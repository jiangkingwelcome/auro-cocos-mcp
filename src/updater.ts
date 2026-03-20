/**
 * Aura for Cocos — 自动更新模块
 * 从 GitHub Raw 拉取 version.json，下载并应用新版本
 */
import fs from 'fs';
import https from 'https';
import http from 'http';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { exec } from 'child_process';

// ─── Config ──────────────────────────────────────────────────────────────────
// TODO: 替换为实际的 GitHub 仓库
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

// ─── Utility helpers ─────────────────────────────────────────────────────────

/** positive when b > a (has update) */
function compareVer(a: string, b: string): number {
  const p = (v: string) => v.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  const [aMaj, aMin, aPat] = p(a);
  const [bMaj, bMin, bPat] = p(b);
  if (aMaj !== bMaj) return bMaj - aMaj;
  if (aMin !== bMin) return bMin - aMin;
  return bPat - aPat;
}

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
    // Escape single quotes in path for PowerShell
    const escaped = zipPath.replace(/'/g, "''");
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

function copyDir(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function tryUnlink(p: string) { try { fs.unlinkSync(p); } catch (_) {} }
function tryRmRf(p: string)   { try { fs.rmSync(p, { recursive: true, force: true }); } catch (_) {} }

// 更新时跳过的用户数据文件
const SKIP_ON_UPDATE = new Set([
  '.mcp-token', '.mcp-settings.json', '.mcp-license',
  'node_modules', '.git', 'dist.bak',
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

      // compareVer 返回正值 = lat > cur = 有新版本
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
      this.set({ phase: 'idle' }); // 恢复 idle，下次仍可检查
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

    // SHA256 完整性校验
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

  /** 应用更新（解压 → 备份 dist/ → 替换文件） */
  async apply(): Promise<void> {
    if (this._phase.phase !== 'ready') throw new Error('更新包尚未就绪');
    const { info, zipPath } = this._phase;

    this.set({ phase: 'installing' });
    const root    = this.pluginRoot();
    const backDir = path.join(root, 'dist.bak');
    const tmpExt  = path.join(os.tmpdir(), `aura-ext-${info.latestVersion}`);
    tryRmRf(tmpExt);

    try {
      // 解压到临时目录
      await extractZip(zipPath, tmpExt);

      // 找到解压根目录（zip 内可能有单层子目录）
      let extRoot = tmpExt;
      const entries = fs.readdirSync(tmpExt);
      if (entries.length === 1 && fs.statSync(path.join(tmpExt, entries[0])).isDirectory()) {
        extRoot = path.join(tmpExt, entries[0]);
      }

      // 备份当前 dist/
      const curDist = path.join(root, 'dist');
      if (fs.existsSync(curDist)) {
        tryRmRf(backDir);
        copyDir(curDist, backDir);
      }

      // 替换文件（跳过用户数据）
      for (const e of fs.readdirSync(extRoot, { withFileTypes: true })) {
        if (SKIP_ON_UPDATE.has(e.name)) continue;
        const src  = path.join(extRoot, e.name);
        const dest = path.join(root, e.name);
        if (e.isDirectory()) {
          tryRmRf(dest);
          copyDir(src, dest);
        } else {
          fs.copyFileSync(src, dest);
        }
      }

      tryRmRf(tmpExt);
      tryUnlink(zipPath);
      this.set({ phase: 'done', version: info.latestVersion });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // 尝试从备份回滚
      try {
        const curDist = path.join(root, 'dist');
        if (fs.existsSync(backDir)) {
          tryRmRf(curDist);
          copyDir(backDir, curDist);
        }
      } catch (_) {}
      tryRmRf(tmpExt);
      this.set({ phase: 'error', message: `安装失败: ${msg}` });
      throw err;
    }
  }

  /** 重置为 idle，允许重新检查 */
  reset() { this.set({ phase: 'idle' }); }

  /** 启动定期检查 */
  scheduleChecks(): void {
    this._timer1 = setTimeout(() => { void this.checkForUpdates(); }, CHECK_DELAY_MS);
    this._timer2 = setInterval(() => { void this.checkForUpdates(); }, CHECK_INTERVAL_MS);
  }

  stopChecks(): void {
    if (this._timer1) { clearTimeout(this._timer1);  this._timer1 = null; }
    if (this._timer2) { clearInterval(this._timer2); this._timer2 = null; }
  }
}

export const updater = new AuraUpdater();
