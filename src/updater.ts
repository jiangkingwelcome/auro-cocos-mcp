/**
 * Aura for Cocos — 自动更新模块
 * 从 GitHub Raw 拉取 version.json，下载并应用新版本
 *
 * 关键设计：
 *  1. Windows .node EBUSY 修复：已加载的原生模块无法直接覆盖，
 *     使用 rename(dest → dest.upd-old) + copy(src → dest) 绕过锁定。
 *  2. 原子回滚：每个文件替换前先备份到 .upd-bak，
 *     失败时通过 txRollback() 精确还原每个文件，杜绝插件碎裂。
 */
import fs from 'fs';
import https from 'https';
import http from 'http';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { execFile } from 'child_process';

// ─── Config ──────────────────────────────────────────────────────────────────
const GITHUB_OWNER = 'jiangkingwelcome';
const GITHUB_REPO  = 'auro-cocos-mcp';
export const VERSION_JSON_URL =
  `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/master/version.json`;

const CHECK_DELAY_MS      = 15_000;              // 启动后 15 秒首检
const CHECK_INTERVAL_MS   = 4 * 60 * 60 * 1000; // 每 4 小时轮检
const FETCH_TIMEOUT_MS    = 12_000;
const DOWNLOAD_TIMEOUT_MS = 120_000;
const MAX_REDIRECTS       = 5;                   // [Fix-J] 最大重定向次数，防循环

// ─── Types ───────────────────────────────────────────────────────────────────
interface PackageAsset { url: string; sha256: string; }

/** 补丁包描述：从某个旧版本到当前版本的差量 zip */
interface PatchAsset {
  from:            string;    // 适用的旧版本（如 "1.0.14"）
  to:              string;    // 目标新版本（如 "1.0.15"）
  hasNative:       boolean;   // 是否包含 .node 原生模块（true = 必须重启编辑器）
  requiresRestart: boolean;   // 是否需要重启（一般与 hasNative 一致）
  changedFiles:    string[];  // 变更的文件列表（相对于插件根目录）
  url:             string;    // 补丁 zip 下载地址（CE/Pro 共用，只含 JS）
  sha256:          string;    // 补丁 zip SHA256
  size?:           number;    // 补丁 zip 大小（字节），用于展示给用户
}

interface ChannelRelease {
  version:       string;
  releaseDate:   string;
  ce:            PackageAsset;
  pro?:          PackageAsset;
  breaking?:     boolean;
  /** 文件级哈希表：相对路径 → SHA256，用于发布脚本对比差异 */
  fileManifest?: Record<string, string>;
  /** 补丁包列表：按版本跨度排列，客户端找第一个匹配的 */
  patches?:      PatchAsset[];
}
interface VersionManifest {
  schemaVersion: number;
  stable:        ChannelRelease;
  beta?:         ChannelRelease;
  changelog:     Record<string, string>;
}

/** hotpatch = 仅 JS 变更，无需重启；coldpatch = 含原生模块，需重启但包小；full = 全量包 */
export type UpdateKind = 'hotpatch' | 'coldpatch' | 'full';

export interface UpdateInfo {
  currentVersion:  string;
  latestVersion:   string;
  releaseDate:     string;
  changelog:       string;
  breaking:        boolean;
  downloadUrl:     string;
  sha256:          string;
  isPro:           boolean;
  kind:            UpdateKind;  // 更新类型
  requiresRestart: boolean;     // 是否需要重启 Cocos Creator
  changedFiles?:   string[];    // 热补丁时的变更文件列表
  patchSize?:      number;      // 补丁包大小（字节）
}
export type UpdatePhase =
  | { phase: 'idle' }
  | { phase: 'checking' }
  | { phase: 'up-to-date' }
  | { phase: 'available';   info: UpdateInfo }
  | { phase: 'downloading'; info: UpdateInfo; progress: number }
  | { phase: 'verifying';   info: UpdateInfo }
  | { phase: 'ready';       info: UpdateInfo; zipPath: string }
  | { phase: 'installing' }
  | { phase: 'done';  version: string; requiresRestart: boolean }
  | { phase: 'error'; message: string };

// ─── Network helpers ─────────────────────────────────────────────────────────

/** 可重试的瞬断错误码集合（网络抖动/连接被重置/连接拒绝） */
const RETRYABLE_CODES = new Set(['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN']);

/**
 * [Fix-K] 自动重试包装器，支持外部中止信号。
 * 对瞬断错误最多重试 maxRetries 次，每次间隔 delayMs × (attempt+1) 毫秒。
 * isStopped 返回 true 时立即放弃，不再等待或重试。
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 2_000,
  isStopped?: () => boolean,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (isStopped?.()) throw new Error('操作已取消');
    try {
      return await fn();
    } catch (err: unknown) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === '操作已取消') throw err;
      const code = (err as NodeJS.ErrnoException).code ?? '';
      // 非瞬断错误（HTTP 4xx 等）立即退出
      if (!RETRYABLE_CODES.has(code) && !msg.includes('超时')) throw err;
      if (attempt < maxRetries) {
        await new Promise<void>(r => setTimeout(r, delayMs * (attempt + 1)));
      }
    }
  }
  throw lastErr;
}

/**
 * [Fix-J] fetchText 增加重定向计数，防止循环重定向导致调用栈溢出。
 * [已有] settled 标记防止 req.destroy() 后触发的二次 reject。
 */
function fetchText(url: string, timeoutMs = FETCH_TIMEOUT_MS, redirectCount = 0): Promise<string> {
  return new Promise((resolve, reject) => {
    if (redirectCount > MAX_REDIRECTS) {
      reject(new Error(`重定向过多（超过 ${MAX_REDIRECTS} 次）`));
      return;
    }
    const transport = url.startsWith('https') ? https : http;
    let settled = false;
    const done = (fn: () => void) => { if (!settled) { settled = true; fn(); } };

    const req = transport.get(url, { timeout: timeoutMs }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        res.resume();
        const loc = res.headers.location;
        if (loc) { fetchText(loc, timeoutMs, redirectCount + 1).then(resolve).catch(reject); return; }
        done(() => reject(new Error('重定向目标丢失')));
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        done(() => reject(new Error(`HTTP ${res.statusCode}`)));
        return;
      }
      let data = '';
      res.on('data', (chunk: Buffer) => { data += chunk.toString('utf-8'); });
      res.on('end',  () => done(() => resolve(data)));
      res.on('error', (e) => done(() => reject(e)));
    });
    req.on('timeout', () => { req.destroy(); done(() => reject(new Error('请求超时'))); });
    req.on('error',   (e) => done(() => reject(e)));
  });
}

/**
 * [Fix-I] 添加 settled 标记，防止 WriteStream/res 异常后触发二次 reject。
 * [Fix-J] 添加重定向计数，防止循环重定向。
 */
function downloadFile(
  url: string,
  dest: string,
  onProgress?: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (fn: () => void) => { if (!settled) { settled = true; fn(); } };

    const doFetch = (targetUrl: string, redirectCount = 0) => {
      if (redirectCount > MAX_REDIRECTS) {
        done(() => reject(new Error(`重定向过多（超过 ${MAX_REDIRECTS} 次）`)));
        return;
      }
      const transport = targetUrl.startsWith('https') ? https : http;
      const req = transport.get(targetUrl, { timeout: DOWNLOAD_TIMEOUT_MS }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          res.resume();
          const loc = res.headers.location;
          if (loc) { doFetch(loc, redirectCount + 1); return; }
          done(() => reject(new Error('重定向目标丢失')));
          return;
        }
        if (res.statusCode !== 200) {
          res.resume();
          done(() => reject(new Error(`下载失败 HTTP ${res.statusCode}`)));
          return;
        }
        const total = parseInt(res.headers['content-length'] || '0', 10);
        let got = 0;
        const file = fs.createWriteStream(dest);
        res.on('data', (chunk: Buffer) => {
          got += chunk.length;
          if (total > 0 && onProgress) {
            onProgress(Math.min(99, Math.round(got / total * 100)));
          }
        });
        res.pipe(file);
        file.on('finish', () => { file.close(); done(() => resolve()); });
        // [Fix-I] 用 destroy() 替代 close()，确保缓冲区不再 flush
        file.on('error', (e) => { file.destroy(); tryUnlink(dest); done(() => reject(e)); });
        res.on('error',  (e) => { file.destroy(); tryUnlink(dest); done(() => reject(e)); });
      });
      req.on('timeout', () => { req.destroy(); done(() => reject(new Error('下载超时'))); });
      req.on('error',   (e) => done(() => reject(e)));
    };
    doFetch(url);
  });
}

function sha256File(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const h = crypto.createHash('sha256');
    const s = fs.createReadStream(filePath);
    s.on('data', (c: Buffer | string) => h.update(c));
    s.on('end', () => resolve(h.digest('hex')));
    s.on('error', reject);
  });
}

/**
 * [Fix-C] 解压实现：Windows 用环境变量传递路径，完全规避 PowerShell 注入风险。
 * [Fix-E] macOS/Linux：unzip 不存在时降级到 ditto（macOS 内置）。
 */
function extractZip(zipPath: string, destDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(destDir, { recursive: true });
    const isWin = process.platform === 'win32';

    if (isWin) {
      // 路径通过环境变量注入，命令字符串本身不含任何用户数据，杜绝 PowerShell 注入
      const cmd = [
        'Add-Type -Assembly System.IO.Compression.FileSystem;',
        '[System.IO.Compression.ZipFile]::ExtractToDirectory($env:AURA_ZIP, $env:AURA_DEST, $true)',
      ].join(' ');
      execFile(
        'powershell',
        ['-NoProfile', '-NonInteractive', '-Command', cmd],
        { timeout: 90_000, env: { ...process.env, AURA_ZIP: zipPath, AURA_DEST: destDir } },
        (err, _out, stderr) => {
          if (err) reject(new Error(`解压失败: ${(stderr || err.message).slice(0, 300)}`));
          else resolve();
        },
      );
    } else {
      // 先尝试 unzip；若不存在则降级到 macOS 内置 ditto
      execFile('unzip', ['-o', zipPath, '-d', destDir], { timeout: 90_000 }, (err, _out, stderr) => {
        if (!err) { resolve(); return; }
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
          // unzip 不可用，使用 macOS 内置的 ditto（所有 macOS 版本均有）
          execFile('ditto', ['-xk', zipPath, destDir], { timeout: 90_000 }, (err2, _o, se2) => {
            if (err2) reject(new Error(`解压失败 (ditto): ${(se2 || err2.message).slice(0, 300)}`));
            else resolve();
          });
        } else {
          reject(new Error(`解压失败 (unzip): ${(stderr || err.message).slice(0, 300)}`));
        }
      });
    }
  });
}

// ─── Utility helpers ─────────────────────────────────────────────────────────

function tryUnlink(p: string) { try { fs.unlinkSync(p); } catch (_) {} }
function tryRmRf(p: string)   { try { fs.rmSync(p, { recursive: true, force: true }); } catch (_) {} }

/**
 * 清理 os.tmpdir() 中的更新残骸：
 *  - aura-ext-* 目录（解压临时目录，正常流程结束后应已删除）
 *  - aura-cocos-update/*.zip（超过 1 小时的遗留包，说明上次更新未完成）
 * 在插件 load 和 unload 时各调一次，覆盖崩溃残留场景。
 */
function cleanTempFiles(): void {
  const tmpDir = os.tmpdir();

  // 清理解压临时目录（始终安全删除，apply() 内已保证正常流程删除）
  try {
    for (const e of fs.readdirSync(tmpDir)) {
      if (e.startsWith('aura-ext-')) tryRmRf(path.join(tmpDir, e));
    }
  } catch (_) {}

  // 清理超过 1 小时的遗留 zip 文件
  const updateDir = path.join(tmpDir, 'aura-cocos-update');
  try {
    if (fs.existsSync(updateDir)) {
      const cutoff = Date.now() - 3_600_000;
      for (const f of fs.readdirSync(updateDir)) {
        const p = path.join(updateDir, f);
        try {
          if (fs.statSync(p).mtimeMs < cutoff) tryUnlink(p);
        } catch (_) {}
      }
    }
  } catch (_) {}
}

/** positive when b > a (has update) */
function compareVer(a: string, b: string): number {
  const p = (v: string) => v.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  const [aMaj, aMin, aPat] = p(a);
  const [bMaj, bMin, bPat] = p(b);
  if (aMaj !== bMaj) return bMaj - aMaj;
  if (aMin !== bMin) return bMin - aMin;
  return bPat - aPat;
}

// ─── Transaction-based safe file replacement ─────────────────────────────────
// 解决两个致命缺陷：
//   1. Windows .node EBUSY：已加载的原生扩展不可直接覆盖，用 rename+copy 绕过
//   2. 原子回滚：每次替换前备份，失败时精确还原，杜绝插件碎裂

interface TxEntry {
  original: string;
  backup:   string;
  /** true = 用 rename 换出的 .node 文件（回滚时 rename 回去即可） */
  nativeRename: boolean;
  /** true = 原来不存在的新文件，回滚时安全删除 */
  isNew?: boolean;
}

/**
 * Windows 原生模块安全替换：
 *  - .node 文件被进程加载后，Windows 不允许覆盖（EBUSY）
 *  - 但 rename 始终被允许（DLL 锁定的是 inode 而非路径）
 *  - 策略：rename(dest → dest.upd-old) 腾出路径，再 copy(src → dest)
 *  - .upd-old 文件在下次成功更新时被 cleanUpdateArtifacts() 清理
 *
 * [Fix-B] copyFileSync 失败时立即就地撤销 rename，不依赖 txRollback，
 *         同时不向 txLog push 记录，避免 txRollback 重复处理同一个文件。
 */
function safeReplaceFile(src: string, dest: string, txLog: TxEntry[]): void {
  const isNative = process.platform === 'win32' && dest.endsWith('.node');

  if (fs.existsSync(dest)) {
    if (isNative) {
      const oldPath = dest + '.upd-old';
      tryUnlink(oldPath);
      fs.renameSync(dest, oldPath); // 始终成功，即使文件已被加载
      try {
        fs.copyFileSync(src, dest);
        // copy 成功后才记录事务，确保 txLog 里的每一条都是"已成功修改"的文件
        txLog.push({ original: dest, backup: oldPath, nativeRename: true });
      } catch (e) {
        // copy 失败：立即就地还原，不等 txRollback
        try { fs.renameSync(oldPath, dest); } catch (_) {}
        throw e;
      }
    } else {
      const bakPath = dest + '.upd-bak';
      tryUnlink(bakPath);
      fs.copyFileSync(dest, bakPath); // 备份原文件
      try {
        fs.copyFileSync(src, dest);
        txLog.push({ original: dest, backup: bakPath, nativeRename: false });
      } catch (e) {
        // copy 失败：立即就地还原
        try { fs.copyFileSync(bakPath, dest); } catch (_) {}
        tryUnlink(bakPath);
        throw e;
      }
    }
  } else {
    // 全新文件：copy 成功后才记录，copy 失败时路径干净，无需还原
    fs.copyFileSync(src, dest);
    txLog.push({ original: dest, backup: '', nativeRename: false, isNew: true });
  }
}

/** 递归合并目录（不删除目标目录，逐文件替换，对 .node 使用 rename 技巧） */
function safeMergeDir(src: string, dest: string, txLog: TxEntry[]): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) safeMergeDir(s, d, txLog);
    else safeReplaceFile(s, d, txLog);
  }
}

/** 回滚：精确还原事务日志中的每个文件 */
function txRollback(txLog: TxEntry[]): void {
  // 逆序还原，保证目录结构正确
  for (const entry of [...txLog].reverse()) {
    try {
      if (entry.isNew) {
        tryUnlink(entry.original);
      } else if (entry.nativeRename) {
        // .node 文件：删除新写入的（可能损坏），把 .upd-old 重命名回去
        tryUnlink(entry.original);
        try { fs.renameSync(entry.backup, entry.original); } catch (_) {}
      } else {
        // 普通文件：从 .upd-bak 还原
        fs.copyFileSync(entry.backup, entry.original);
        tryUnlink(entry.backup);
      }
    } catch (_) {
      // best-effort：单个文件回滚失败不中断其余文件的还原
    }
  }
}

/** 提交：删除所有备份文件（更新成功后调用） */
function txCommit(txLog: TxEntry[]): void {
  for (const entry of txLog) {
    if (entry.backup) tryUnlink(entry.backup);
  }
}

/**
 * [Fix-F] 清理上一次更新遗留的 .upd-old 和 .upd-bak 文件。
 * 增加递归深度限制，防止符号链接导致无限遍历。
 */
function cleanUpdateArtifacts(dir: string, depth = 0): void {
  if (depth > 8) return;
  try {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory() && !e.isSymbolicLink()) {
        cleanUpdateArtifacts(p, depth + 1);
      } else if (e.name.endsWith('.upd-old') || e.name.endsWith('.upd-bak')) {
        tryUnlink(p);
      }
    }
  } catch (_) {}
}

// ─── 主动通知：控制台 banner + Editor.Dialog ──────────────────────────────────

/** 读取已通知版本记录（防重复弹窗） */
function readNotifiedVersion(root: string): string {
  try {
    const f = path.join(root, '.mcp-update-state.json');
    if (fs.existsSync(f)) {
      const raw = JSON.parse(fs.readFileSync(f, 'utf-8'));
      return typeof raw.notifiedVersion === 'string' ? raw.notifiedVersion : '';
    }
  } catch (_) {}
  return '';
}

/** 记录已弹窗的版本号，防止重复打扰 */
function writeNotifiedVersion(root: string, version: string): void {
  try {
    fs.writeFileSync(
      path.join(root, '.mcp-update-state.json'),
      JSON.stringify({ notifiedVersion: version }, null, 2),
      'utf-8',
    );
  } catch (_) {}
}

async function notifyAvailable(info: UpdateInfo, root: string): Promise<void> {
  console.warn(`[Aura] 有新版本 v${info.latestVersion} 可用，打开插件面板查看详情`);

  if (readNotifiedVersion(root) === info.latestVersion) return;
  writeNotifiedVersion(root, info.latestVersion);

  try {
    const result = await Editor.Dialog.show({
      type:      'info',
      title:     'Aura for Cocos 有新版本',
      message:   `v${info.latestVersion} 已发布`,
      detail:    '点击「查看详情」打开插件面板，了解更新内容并一键安装。',
      buttons:   ['查看详情', '稍后'],
      defaultId: 0,
      cancelId:  1,
    });
    if (result.response === 0) {
      try { Editor.Panel.open('aura-for-cocos.default'); } catch (_) {
        try { Editor.Panel.open('aura-for-cocos'); } catch (__) {}
      }
    }
  } catch (_) {
    // Editor.Dialog 不可用时控制台提示已足够
  }
}

// [Fix-M] 更新时跳过的用户数据文件（增加 .mcp-update-state.json）
const SKIP_ON_UPDATE = new Set([
  '.mcp-token', '.mcp-settings.json', '.mcp-license', '.mcp-update-state.json',
  'node_modules', '.git', 'dist.bak', 'dist-backup',
]);

/**
 * 开发 / 自测：将已解压的补丁包根目录合并进插件根目录（与 apply() / _silentHotpatch 的文件替换步骤一致）。
 * 不包含：下载、SHA256 校验、Editor.Package 重载。
 *
 * @param extRoot     解压后的扩展内容根（其下可有 dist/、package.json 等）
 * @param pluginRoot  当前安装的插件根目录
 * @returns           本次成功写入的绝对路径列表
 */
export function applyLocalHotpatchMerge(extRoot: string, pluginRoot: string): string[] {
  const txLog: TxEntry[] = [];
  for (const e of fs.readdirSync(extRoot, { withFileTypes: true })) {
    if (SKIP_ON_UPDATE.has(e.name)) continue;
    const src = path.join(extRoot, e.name);
    const dest = path.join(pluginRoot, e.name);
    if (e.isDirectory()) safeMergeDir(src, dest, txLog);
    else safeReplaceFile(src, dest, txLog);
  }
  const modified = txLog.map((t) => t.original);
  txCommit(txLog);
  cleanUpdateArtifacts(pluginRoot);
  return modified;
}

// ─── AuraUpdater ─────────────────────────────────────────────────────────────
class AuraUpdater {
  private _phase:    UpdatePhase = { phase: 'idle' };
  private _listeners: Array<(p: UpdatePhase) => void> = [];
  private _timer1:   ReturnType<typeof setTimeout>  | null = null;
  private _timer2:   ReturnType<typeof setInterval> | null = null;
  private _stopped = false; // [Fix-K] 用于中断 withRetry 的重试等待

  get phase(): UpdatePhase { return this._phase; }

  private set(p: UpdatePhase) {
    this._phase = p;
    this._listeners.forEach(fn => { try { fn(p); } catch (_) {} });
  }

  // [Fix-L] 添加 removed 标记，确保 unsubscribe 函数幂等
  onChange(cb: (p: UpdatePhase) => void): () => void {
    this._listeners.push(cb);
    let removed = false;
    return () => {
      if (removed) return;
      removed = true;
      this._listeners = this._listeners.filter(f => f !== cb);
    };
  }

  pluginRoot(): string { return path.join(__dirname, '..'); }

  currentVersion(): string {
    try {
      const raw = fs.readFileSync(path.join(this.pluginRoot(), 'package.json'), 'utf-8');
      return (JSON.parse(raw) as { version?: string }).version || '0.0.0';
    } catch { return '0.0.0'; }
  }

  // [Fix-G] 递归扫描子目录（深度≤3），防止 Pro .node 在子目录时误判为 CE
  isPro(): boolean {
    const hasNodeFile = (dir: string, depth = 0): boolean => {
      if (depth > 3) return false;
      try {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
          if (e.isFile() && e.name.endsWith('.node')) return true;
          if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules') {
            if (hasNodeFile(path.join(dir, e.name), depth + 1)) return true;
          }
        }
      } catch { /* ignore */ }
      return false;
    };
    return hasNodeFile(this.pluginRoot());
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /** 检查更新 — 静默失败，不打扰用户正常使用 */
  async checkForUpdates(): Promise<UpdateInfo | null> {
    const { phase } = this._phase;
    if (phase === 'checking' || phase === 'downloading' || phase === 'installing') return null;

    this.set({ phase: 'checking' });
    try {
      const raw = await withRetry(
        () => fetchText(VERSION_JSON_URL),
        3, 2_000,
        () => this._stopped, // [Fix-K] stopChecks() 后重试立即放弃
      );

      // [Fix-D] 严格校验 JSON 格式，字段缺失时明确报错而非 TypeError 崩溃
      let mf: VersionManifest;
      try {
        mf = JSON.parse(raw) as VersionManifest;
      } catch {
        throw new Error('version.json 不是有效的 JSON');
      }
      if (!mf || typeof mf !== 'object' || !mf.stable || typeof mf.stable.version !== 'string') {
        throw new Error('version.json 格式无效：缺少 stable.version 字段');
      }

      const ch  = mf.stable;
      const cur = this.currentVersion();
      const lat = ch.version;

      if (compareVer(cur, lat) <= 0) {
        this.set({ phase: 'up-to-date' });
        return null;
      }

      const isPro  = this.isPro();
      const asset  = (isPro && ch.pro) ? ch.pro : ch.ce;

      // ── 分级更新：优先使用补丁包（hotpatch/coldpatch），回退到全量包 ─────
      let kind: UpdateKind            = 'full';
      let requiresRestart             = true;
      let changedFiles: string[] | undefined;
      let patchSize:    number  | undefined;
      let downloadUrl   = asset.url;
      let sha256        = asset.sha256 || '';

      const patch = (ch.patches || []).find(p => p.from === cur && p.to === lat);
      if (patch) {
        // 补丁包存在且适用于当前版本
        kind            = patch.hasNative ? 'coldpatch' : 'hotpatch';
        requiresRestart = patch.requiresRestart;
        changedFiles    = patch.changedFiles;
        patchSize       = patch.size;
        downloadUrl     = patch.url;
        sha256          = patch.sha256;
      }

      const info: UpdateInfo = {
        currentVersion:  cur,
        latestVersion:   lat,
        releaseDate:     ch.releaseDate || '',
        changelog:       mf.changelog?.[lat] || '',
        breaking:        ch.breaking ?? false,
        downloadUrl,
        sha256,
        isPro,
        kind,
        requiresRestart,
        changedFiles,
        patchSize,
      };

      // hotpatch（纯 JS，无需重启）：全程无感，静默下载 → 应用 → 重载，不更新 UI
      if (info.kind === 'hotpatch') {
        this.set({ phase: 'idle' }); // 对面板不可见，后台进行
        void this._silentHotpatch(info);
        return info;
      }

      // coldpatch / full：走正常 UI 流程，通知用户手动安装
      this.set({ phase: 'available', info });
      void notifyAvailable(info, this.pluginRoot());
      return info;

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg !== '操作已取消') {
        console.warn('[Aura Updater] 版本检查静默失败:', msg);
      }
      this.set({ phase: 'idle' });
      return null;
    }
  }

  /** 下载更新包（含 SHA256 校验） */
  async download(): Promise<void> {
    if (this._phase.phase !== 'available') throw new Error('没有可用的更新信息');
    const info = this._phase.info;

    const tmpDir  = path.join(os.tmpdir(), 'aura-cocos-update');
    fs.mkdirSync(tmpDir, { recursive: true });
    const zipPath = path.join(tmpDir, `aura-update-${info.latestVersion}.zip`);
    tryUnlink(zipPath);

    this.set({ phase: 'downloading', info, progress: 0 });
    await downloadFile(info.downloadUrl, zipPath, (pct) => {
      this.set({ phase: 'downloading', info, progress: pct });
    });

    this.set({ phase: 'verifying', info });

    // [Fix-A] SHA256 强制校验：空值/非法格式一律拒绝安装，不允许跳过
    const sha256Hex = (info.sha256 || '').toLowerCase().trim();
    if (!sha256Hex || sha256Hex.length !== 64 || !/^[0-9a-f]{64}$/.test(sha256Hex)) {
      tryUnlink(zipPath);
      this.set({ phase: 'error', message: 'version.json 中缺少有效的 SHA256 校验值，拒绝安装' });
      throw new Error('缺少有效的 SHA256');
    }
    const actual = await sha256File(zipPath);
    if (actual !== sha256Hex) {
      tryUnlink(zipPath);
      this.set({ phase: 'error', message: 'SHA256 校验失败，文件可能已损坏或被篡改，请重试' });
      throw new Error('SHA256 mismatch');
    }

    this.set({ phase: 'ready', info, zipPath });
  }

  /**
   * 应用更新
   *
   * 修复说明：
   *  ① EBUSY（Windows .node 锁定）
   *     - 不再用 rmRf + copyDir 粗暴替换整个目录
   *     - 改用 safeMergeDir → safeReplaceFile，对 .node 先 rename 再 copy
   *
   *  ② 回滚不彻底（插件碎裂）
   *     - 引入 txLog（事务日志）：copy 成功后才 push 记录，确保每条记录都可回滚
   *     - 任何一步失败 → txRollback() 精确还原全部已改文件
   *     - 成功后 txCommit() 清理备份，再清理 .upd-old 残留
   */
  async apply(): Promise<void> {
    if (this._phase.phase !== 'ready') throw new Error('更新包尚未就绪');
    const { info, zipPath } = this._phase;

    this.set({ phase: 'installing' });
    const root   = this.pluginRoot();
    const tmpExt = path.join(os.tmpdir(), `aura-ext-${info.latestVersion}`);
    tryRmRf(tmpExt);

    const txLog: TxEntry[] = [];

    try {
      // ① 解压到临时目录（与 dist/ 完全隔离，不触碰任何现有文件）
      await extractZip(zipPath, tmpExt);

      // ② 定位解压根目录（zip 内可能含单层子目录）
      let extRoot = tmpExt;
      const entries = fs.readdirSync(tmpExt);
      if (entries.length === 1 && fs.statSync(path.join(tmpExt, entries[0])).isDirectory()) {
        extRoot = path.join(tmpExt, entries[0]);
      }

      // ③ 逐项替换，全程记录事务日志
      //    - 普通文件：先 copy 备份(.upd-bak)，copy 成功后 push txLog
      //    - .node 文件：rename 换出(.upd-old)，copy 成功后 push txLog（绕过 EBUSY）
      for (const e of fs.readdirSync(extRoot, { withFileTypes: true })) {
        if (SKIP_ON_UPDATE.has(e.name)) continue;
        const src  = path.join(extRoot, e.name);
        const dest = path.join(root, e.name);
        if (e.isDirectory()) {
          safeMergeDir(src, dest, txLog);
        } else {
          safeReplaceFile(src, dest, txLog);
        }
      }

      // ④ 全部文件替换成功 → 提交事务（清理 .upd-bak）
      txCommit(txLog);
      tryUnlink(zipPath);

      // ⑤ 清理本次及历史遗留的 .upd-old / .upd-bak
      cleanUpdateArtifacts(root);

      this.set({ phase: 'done', version: info.latestVersion, requiresRestart: info.requiresRestart });

      // ⑥ 通知 Cocos Editor 重载插件：卸载旧内存镜像 → 重新加载新代码
      //    延迟 800ms 确保当前调用栈（面板轮询、IPC 回包）全部结束后再执行
      //    hotpatch（纯 JS）：重载插件扩展即可，无需重启 Cocos Creator
      //    coldpatch/full（含 .node）：重载后仍提示用户重启编辑器
      setTimeout(() => {
        try {
          Editor.Package.unregister(root);
          Editor.Package.register(root);
          console.warn(
            `[Aura 热更新] 扩展已重载 · v${info.latestVersion} · ${new Date().toISOString()}（下一条「插件已加载」即为新代码运行）`,
          );
        } catch (e) {
          console.warn('[Aura Updater] 自动重载失败，请在编辑器中手动重启插件:', e);
        }
      }, 800);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[Aura Updater] 安装失败，执行事务回滚:', msg);
      txRollback(txLog);
      this.set({ phase: 'error', message: `安装失败: ${msg}` });
      throw err;
    } finally {
      // 无论成功/失败/崩溃，tmpExt 解压目录必须清理
      tryRmRf(tmpExt);
    }
  }

  /**
   * hotpatch 静默自动更新管线：全程后台，不更新可见 phase，不弹对话框。
   *
   * 成功路径：下载 → SHA256 校验 → 解压 → 事务替换 → 重载插件扩展
   * 失败路径：任何步骤异常 → 控制台 warn → 降级到 'available' + notifyAvailable（让用户手动更新）
   */
  private async _silentHotpatch(info: UpdateInfo): Promise<void> {
    const root    = this.pluginRoot();
    const tmpDir  = path.join(os.tmpdir(), 'aura-cocos-update');
    const zipPath = path.join(tmpDir, `aura-hotpatch-${info.latestVersion}.zip`);
    const tmpExt  = path.join(os.tmpdir(), `aura-ext-${info.latestVersion}`);

    console.log(
      `[Aura] 检测到热补丁 v${info.latestVersion}`
      + (info.changedFiles?.length ? `（${info.changedFiles.length} 个文件）` : '')
      + '，后台静默安装中...',
    );

    try {
      // ① 下载补丁 zip（不更新 phase，面板无感知）
      fs.mkdirSync(tmpDir, { recursive: true });
      tryUnlink(zipPath);
      await downloadFile(info.downloadUrl, zipPath);

      // ② SHA256 强制校验（与手动安装路径保持一致的安全标准）
      const sha256Hex = (info.sha256 || '').toLowerCase().trim();
      if (!sha256Hex || sha256Hex.length !== 64 || !/^[0-9a-f]{64}$/.test(sha256Hex)) {
        throw new Error('SHA256 格式无效，拒绝安装');
      }
      const actual = await sha256File(zipPath);
      if (actual !== sha256Hex) throw new Error('SHA256 校验失败，文件可能已损坏或被篡改');

      // ③ 解压到临时目录
      tryRmRf(tmpExt);
      await extractZip(zipPath, tmpExt);

      // ④ 定位解压根（zip 内可能含单层子目录）
      let extRoot = tmpExt;
      const entries = fs.readdirSync(tmpExt);
      if (entries.length === 1 && fs.statSync(path.join(tmpExt, entries[0])).isDirectory()) {
        extRoot = path.join(tmpExt, entries[0]);
      }

      // ⑤ 事务替换（复用完整的 safeReplaceFile / safeMergeDir 逻辑）
      const txLog: TxEntry[] = [];
      for (const e of fs.readdirSync(extRoot, { withFileTypes: true })) {
        if (SKIP_ON_UPDATE.has(e.name)) continue;
        const src  = path.join(extRoot, e.name);
        const dest = path.join(root, e.name);
        e.isDirectory() ? safeMergeDir(src, dest, txLog) : safeReplaceFile(src, dest, txLog);
      }

      // ⑥ 提交事务 + 清理残留
      txCommit(txLog);
      cleanUpdateArtifacts(root);

      console.log(`[Aura] 热补丁 v${info.latestVersion} 安装成功，正在重载插件扩展...`);

      // ⑦ 重载插件扩展（不需要重启 Cocos Creator）
      //    延迟 800ms 等当前调用栈结束
      setTimeout(() => {
        try {
          Editor.Package.unregister(root);
          Editor.Package.register(root);
          console.warn(
            `[Aura 热更新] 静默热补丁已重载 · v${info.latestVersion} · ${new Date().toISOString()}（下一条「插件已加载」即为新代码运行）`,
          );
        } catch (e) {
          console.warn('[Aura Updater] 热补丁重载失败，请在扩展管理器中手动重启插件:', e);
          // 重载失败时降级：显示普通可用更新提示
          this.set({ phase: 'available', info });
          void notifyAvailable(info, root);
        }
      }, 800);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[Aura Updater] 热补丁静默安装失败（${msg}），降级为手动更新提示`);
      // 降级：走正常 UI 流程，让用户在面板中手动安装
      this.set({ phase: 'available', info });
      void notifyAvailable(info, root);
    } finally {
      tryUnlink(zipPath);
      tryRmRf(tmpExt);
    }
  }

  /**
   * [Fix-H] 重置为 idle：下载中/安装中不允许重置，防止后台任务与状态机脱节。
   */
  reset() {
    const { phase } = this._phase;
    if (phase === 'downloading' || phase === 'installing') return;
    this.set({ phase: 'idle' });
  }

  /** 启动定期检查（同时清理上次残留的临时文件） */
  scheduleChecks(): void {
    this._stopped = false; // [Fix-K] 重置停止标志，允许新一轮重试
    cleanTempFiles();
    this._timer1 = setTimeout(() => { void this.checkForUpdates(); }, CHECK_DELAY_MS);
    this._timer2 = setInterval(() => { void this.checkForUpdates(); }, CHECK_INTERVAL_MS);
  }

  /** 停止定期检查（清理本次会话产生的临时文件） */
  stopChecks(): void {
    this._stopped = true; // [Fix-K] 让正在等待重试的 withRetry 立即放弃
    if (this._timer1) { clearTimeout(this._timer1);  this._timer1 = null; }
    if (this._timer2) { clearInterval(this._timer2); this._timer2 = null; }
    cleanTempFiles();
  }
}

export const updater = new AuraUpdater();
