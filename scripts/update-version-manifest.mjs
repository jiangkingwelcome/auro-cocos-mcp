/**
 * update-version-manifest.mjs
 *
 * 发布前运行，自动更新 version.json：
 *   node scripts/update-version-manifest.mjs
 *   node scripts/update-version-manifest.mjs --sha256-ce=abc123 --sha256-pro=def456
 *   node scripts/update-version-manifest.mjs --changelog="修复了 XXX 问题"
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function computeSha256(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

// 解析命令行参数
const args = process.argv.slice(2);
const getArg = (prefix) => {
  const arg = args.find(a => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : '';
};

const pkg     = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
const version = pkg.version;
const OWNER   = 'jiangkingwelcome';
const REPO    = 'auro-cocos-mcp';

const RELEASE_BASE = `https://github.com/${OWNER}/${REPO}/releases/download/v${version}`;

// 尝试从本地 zip 计算 SHA256
const ceZipPath  = path.join(ROOT, `dist-plugin-release/aura-for-cocos-ce-v${version}.zip`);
const proZipPath = path.join(ROOT, `dist-plugin-release/aura-for-cocos-pro-v${version}.zip`);

const ceSha256  = getArg('--sha256-ce=')  || (fs.existsSync(ceZipPath)  ? computeSha256(ceZipPath)  : '');
const proSha256 = getArg('--sha256-pro=') || (fs.existsSync(proZipPath) ? computeSha256(proZipPath) : '');
const changelogEntry = getArg('--changelog=') || '';

// 读取现有 manifest，保留历史 changelog
const manifestPath = path.join(ROOT, 'version.json');
let manifest = {};
try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')); } catch (_) {}
const changelog = manifest.changelog || {};

// 写入本版本 changelog（优先使用命令行参数，否则保留已有内容）
if (changelogEntry) {
  changelog[version] = changelogEntry;
} else if (!changelog[version]) {
  changelog[version] = `v${version} — 详见 CHANGELOG.md`;
}

const newManifest = {
  schemaVersion: 1,
  stable: {
    version,
    releaseDate: new Date().toISOString().split('T')[0],
    ce: {
      url:    `${RELEASE_BASE}/aura-for-cocos-ce-v${version}.zip`,
      sha256: ceSha256,
    },
    pro: {
      url:    `${RELEASE_BASE}/aura-for-cocos-pro-v${version}.zip`,
      sha256: proSha256,
    },
    breaking: false,
  },
  changelog,
};

fs.writeFileSync(manifestPath, JSON.stringify(newManifest, null, 2) + '\n', 'utf-8');

const ceSha256Short  = ceSha256  ? ceSha256.slice(0, 8)  + '...' : '(未找到)';
const proSha256Short = proSha256 ? proSha256.slice(0, 8) + '...' : '(未找到)';
console.log(`✅ version.json 已更新 → v${version}`);
console.log(`   CE  sha256: ${ceSha256Short}`);
console.log(`   Pro sha256: ${proSha256Short}`);
console.log(`   下载地址: ${RELEASE_BASE}/...`);
