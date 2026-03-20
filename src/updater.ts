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
import { exec } from 'child_process';

// ─── Config ──────────────────────────────────────────────────────────────────
const GITHUB_OWNER = 'jiangkingwelcome';
const GITHUB_REPO  = 'auro-cocos-mcp';
export const VERSION_JSON_URL =
  `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/master/version.json`;

const CHECK_DELAY_MS      = 15_000;              // 启动后 15 秒首检
const CHECK_INTERVAL_MS   = 4 * 60 * 60 * 1000; // 每 4 小时轮检
const FETCH_TIMEOUT_MS    = 12_000;
const DOWNLOAD_TIMEOUT_MS = 120_000;

// ─── Types ───────────────────────────────────────────────────────────────────
interface PackageAsset { url: string; sha256: string; }
interface ChannelRelease {
  version:     string;
  releaseDate: string;
  ce:          PackageAsset;
  pro?:        PackageAsset;
  breaking?:   boolean;
}
interface VersionManifest {
  schemaVersion: number;
  stable:        ChannelRelease;
  beta?:         ChannelRelease;
  changelog:     Record<string, string>;
}
export interface UpdateInfo {
  currentVersion: string;
  latestVersion:  string;
  releaseDate:    string;
  changelog:      string;
  breaking:       boolean;
  downloadUrl:    string;
  sha256:         string;
  isPro:          boolean;
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
  | { phase: 'done';  version: string }
  | { phase: 'error'; message: string };

// ─── Network helpers ─────────────────────────────────────────────────────────

function fetchText(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<string> {
  return new Promise((resolve, reject) => {
    const transport = url.startsWith('https') ? https : http;
    const req = transport.get(url, { timeout: timeoutMs }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        res.resume();
        const loc = res.headers.location;
        if (loc) { fetchText(loc, timeoutMs).then(resolve).catch(reject); return; }
        reject(new Error('重定向目标丢失'));
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', (chunk: Buffer) => { data += chunk.toString('utf-8'); });
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('请求超时')); });
    req.on('error', reject);
  });
}

function downloadFile(
  url: string,
  dest: string,
  onProgress?: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const doFetch = (targetUrl: string) => {
      const transport = targetUrl.startsWith('https') ? https : http;
      const req = transport.get(targetUrl, { timeout: DOWNLOAD_TIMEOUT_MS }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          res.resume();
          const loc = res.headers.location;
          if (loc) { doFetch(loc); return; }
          reject(new Error('重定向目标丢失'));
          return;
        }
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`下载失败 HTTP ${res.statusCode}`));
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
        file.on('finish', () => { file.close(); resolve(); });
        file.on('error', (e) => { file.close(); tryUnlink(dest); reject(e); });
        res.on('error',  (e) => { file.close(); tryUnlink(dest); reject(e); });
      });
      req.on('timeout', () => { req.destroy(); reject(new Error('下载超时')); });
      req.on('error', reject);
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

function extractZip(zipPath: string, destDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(destDir, { recursive: true });
    const isWin = process.platform === 'win32';
    const escaped     = zipPath.replace(/'/g, "''");
    const escapedDest = destDir.replace(/'/g, "''");
    const cmd = isWin
      ? `powershell -NoProfile -NonInteractive -Command "Expand-Archive -LiteralPath '${escaped}' -DestinationPath '${escapedDest}' -Force"`
      : `unzip -o "${zipPath}" -d "${destDir}"`;
    exec(cmd, { timeout: 90_000 }, (err, _out, stderr) => {
      if (err) reject(new Error(`解压失败: ${(stderr || err.message).slice(0, 300)}`));
      else resolve();
    });
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

  // 清理超过 1 小时的遗留 zip 文件（1 小时内的保留，允许用户在 ready 状态下重启 Cocos 后重新安装）
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
  /** true = 用 rename 换出的 .node 文件（不需要 copy back，直接 rename 回去） */
  nativeRename: boolean;
}

/**
 * Windows 原生模块安全替换：
 *  - .node 文件被进程加载后，Windows 不允许覆盖（EBUSY）
 *  - 但 rename 始终被允许（DLL 锁定的是 inode 而非路径）
 *  - 策略：rename(dest → dest.upd-old) 腾出路径，再 copy(src → dest)
 *  - .upd-old 文件在下次成功更新时被 cleanUpdateArtifacts() 清理
 */
function safeReplaceFile(src: string, dest: string, txLog: TxEntry[]): void {
  const isNative = process.platform === 'win32' && dest.endsWith('.node');

  if (isNative && fs.existsSync(dest)) {
    // Windows .node：rename 换出，不做 copy backup（rename 本身就是原子的）
    const oldPath = dest + '.upd-old';
    tryUnlink(oldPath);
    fs.renameSync(dest, oldPath); // 始终成功，即使文件已被加载
    txLog.push({ original: dest, backup: oldPath, nativeRename: true });
  } else if (fs.existsSync(dest)) {
    // 普通文件：先 copy 备份，再覆盖
    const bakPath = dest + '.upd-bak';
    tryUnlink(bakPath);
    fs.copyFileSync(dest, bakPath);
    txLog.push({ original: dest, backup: bakPath, nativeRename: false });
  }
  // 此时 dest 已不存在（.node 被 rename，或不存在），直接 copy
  fs.copyFileSync(src, dest);
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
      if (entry.nativeRename) {
        // .node 文件：删除新写入的（可能损坏），把 .upd-old 重命名回去
        tryUnlink(entry.original);
        try { fs.renameSync(entry.backup, entry.original); } catch (_) {}
      } else {
        // 普通文件：从 .upd-bak 还原
        fs.copyFileSync(entry.backup, entry.original);
        tryUnlink(entry.backup);
      }
    } catch (_) {
      // best-effort，单个文件回滚失败不中断其余文件的还原
    }
  }
}

/** 提交：删除所有备份文件（更新成功后调用） */
function txCommit(txLog: TxEntry[]): void {
  for (const entry of txLog) {
    tryUnlink(entry.backup);
  }
}

/** 清理上一次更新遗留的 .upd-old 和 .upd-bak 文件 */
function cleanUpdateArtifacts(dir: string): void {
  try {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        cleanUpdateArtifacts(p);
      } else if (e.name.endsWith('.upd-old') || e.name.endsWith('.upd-bak')) {
        tryUnlink(p);
      }
    }
  } catch (_) {}
}

// 更新时跳过的用户数据文件
const SKIP_ON_UPDATE = new Set([
  '.mcp-token', '.mcp-settings.json', '.mcp-license',
  'node_modules', '.git', 'dist.bak', 'dist-backup',
]);

// ─── AuraUpdater ─────────────────────────────────────────────────────────────
class AuraUpdater {
  private _phase: UpdatePhase = { phase: 'idle' };
  private _listeners: Array<(p: UpdatePhase) => void> = [];
  private _timer1: ReturnType<typeof setTimeout>  | null = null;
  private _timer2: ReturnType<typeof setInterval> | null = null;

  get phase(): UpdatePhase { return this._phase; }

  private set(p: UpdatePhase) {
    this._phase = p;
    this._listeners.forEach(fn => { try { fn(p); } catch (_) {} });
  }

  onChange(cb: (p: UpdatePhase) => void): () => void {
    this._listeners.push(cb);
    return () => { this._listeners = this._listeners.filter(f => f !== cb); };
  }

  pluginRoot(): string { return path.join(__dirname, '..'); }

  currentVersion(): string {
    try {
      const raw = fs.readFileSync(path.join(this.pluginRoot(), 'package.json'), 'utf-8');
      return (JSON.parse(raw) as { version?: string }).version || '0.0.0';
    } catch { return '0.0.0'; }
  }

  isPro(): boolean {
    try { return fs.readdirSync(this.pluginRoot()).some(f => f.endsWith('.node')); }
    catch { return false; }
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /** 检查更新 — 静默失败，不打扰用户正常使用 */
  async checkForUpdates(): Promise<UpdateInfo | null> {
    const { phase } = this._phase;
    if (phase === 'checking' || phase === 'downloading' || phase === 'installing') return null;

    this.set({ phase: 'checking' });
    try {
      const raw = await fetchText(VERSION_JSON_URL);
      const mf  = JSON.parse(raw) as VersionManifest;
      const ch  = mf.stable;
      const cur = this.currentVersion();
      const lat = ch.version;

      if (compareVer(cur, lat) <= 0) {
        this.set({ phase: 'up-to-date' });
        return null;
      }

      const isPro  = this.isPro();
      const asset  = (isPro && ch.pro) ? ch.pro : ch.ce;
      const info: UpdateInfo = {
        currentVersion: cur,
        latestVersion:  lat,
        releaseDate:    ch.releaseDate || '',
        changelog:      mf.changelog?.[lat] || '',
        breaking:       ch.breaking ?? false,
        downloadUrl:    asset.url,
        sha256:         asset.sha256 || '',
        isPro,
      };

      this.set({ phase: 'available', info });
      return info;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[Aura Updater] 版本检查静默失败:', msg);
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
    if (info.sha256 && info.sha256.length === 64) {
      const actual = await sha256File(zipPath);
      if (actual.toLowerCase() !== info.sha256.toLowerCase()) {
        tryUnlink(zipPath);
        this.set({ phase: 'error', message: 'SHA256 校验失败，文件可能已损坏，请重试' });
        throw new Error('SHA256 mismatch');
      }
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
   *     - 引入 txLog（事务日志）：每个文件替换前先做 .upd-bak 备份
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
      //    - 普通文件：先 copy 备份(.upd-bak)，再覆盖
      //    - .node 文件：rename 换出(.upd-old)，再 copy 新文件（绕过 EBUSY）
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

      this.set({ phase: 'done', version: info.latestVersion });

      // ⑥ 通知 Cocos Editor 重载插件：卸载旧内存镜像 → 重新加载新代码
      //    延迟 800ms 确保当前调用栈（面板轮询、IPC 回包）全部结束后再执行
      setTimeout(() => {
        try {
          Editor.Package.unregister(root);
          Editor.Package.register(root);
        } catch (e) {
          console.warn('[Aura Updater] 自动重载失败，请在编辑器中手动重启插件:', e);
        }
      }, 800);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[Aura Updater] 安装失败，执行事务回滚:', msg);

      // 精确回滚：仅还原已经被修改的文件，未触碰的文件完全不受影响
      txRollback(txLog);

      this.set({ phase: 'error', message: `安装失败: ${msg}` });
      throw err;
    } finally {
      // 无论成功/失败/崩溃，tmpExt 解压目录必须清理
      tryRmRf(tmpExt);
    }
  }

  /** 重置为 idle，允许重新检查 */
  reset() { this.set({ phase: 'idle' }); }

  /** 启动定期检查（同时清理上次残留的临时文件） */
  scheduleChecks(): void {
    cleanTempFiles();
    this._timer1 = setTimeout(() => { void this.checkForUpdates(); }, CHECK_DELAY_MS);
    this._timer2 = setInterval(() => { void this.checkForUpdates(); }, CHECK_INTERVAL_MS);
  }

  /** 停止定期检查（清理本次会话产生的临时文件） */
  stopChecks(): void {
    if (this._timer1) { clearTimeout(this._timer1);  this._timer1 = null; }
    if (this._timer2) { clearInterval(this._timer2); this._timer2 = null; }
    cleanTempFiles();
  }
}

export const updater = new AuraUpdater();
