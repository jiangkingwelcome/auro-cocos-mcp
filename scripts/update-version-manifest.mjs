/**
 * update-version-manifest.mjs
 *
 * 发布前运行，自动更新 version.json：
 *   node scripts/update-version-manifest.mjs
 *   node scripts/update-version-manifest.mjs --sha256-ce=abc123 --sha256-pro=def456
 *   node scripts/update-version-manifest.mjs --changelog="修复了 XXX 问题"
 *   node scripts/update-version-manifest.mjs --skip-patch   # 跳过补丁包生成
 *
 * schemaVersion 2 新增字段：
 *   stable.fileManifest  — dist/ 下所有文件的 SHA256 哈希表，用于下次发布时对比差异
 *   stable.patches       — 补丁包列表，格式：[{ from, to, hasNative, requiresRestart, changedFiles, url, sha256, size }]
 *
 * 补丁包生成规则：
 *   1. 读取上一版本的 fileManifest（来自当前 version.json），与本次 dist/ 对比
 *   2. 找出变更的文件（哈希不同 or 新增）
 *   3. 若变更文件中含 .node 原生模块 → coldpatch（hasNative=true，requiresRestart=true）
 *      否则 → hotpatch（hasNative=false，requiresRestart=false）
 *   4. 将变更文件按原始目录结构打包为 patch-{from}-{to}.zip
 *   5. 写入 patches 数组供客户端消费
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { execFileSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// ── helpers ──────────────────────────────────────────────────────────────────

function computeSha256(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

/** 递归扫描目录，返回 { "相对路径": "sha256" } */
function buildFileManifest(dir, baseRel = '') {
  const result = {};
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = baseRel ? `${baseRel}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      Object.assign(result, buildFileManifest(full, rel));
    } else if (entry.isFile()) {
      result[rel] = computeSha256(full);
    }
  }
  return result;
}

/** 对比两份 fileManifest，返回变更（新增+修改）的相对路径列表 */
function diffManifests(oldManifest, newManifest) {
  const changed = [];
  for (const [relPath, hash] of Object.entries(newManifest)) {
    if (oldManifest[relPath] !== hash) changed.push(relPath);
  }
  return changed;
}

/** 创建补丁 zip（仅包含 changedFiles 中的文件，保留相对目录结构） */
function createPatchZip(changedFiles, rootDir, zipPath) {
  // 确保输出目录存在
  fs.mkdirSync(path.dirname(zipPath), { recursive: true });
  // 删除旧 zip（如果存在）
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

  const isWin = process.platform === 'win32';

  if (isWin) {
    // PowerShell：通过环境变量传递数据，避免注入
    const fileListJson = JSON.stringify(changedFiles);
    const psScript = `
      Add-Type -Assembly System.IO.Compression.FileSystem;
      $root   = $env:PATCH_ROOT;
      $dest   = $env:PATCH_ZIP;
      $files  = ($env:PATCH_FILES | ConvertFrom-Json);
      $mode   = [System.IO.Compression.CompressionLevel]::Optimal;
      $stream = [System.IO.File]::Open($dest, [System.IO.FileMode]::Create);
      $zip    = New-Object System.IO.Compression.ZipArchive($stream, [System.IO.Compression.ZipArchiveMode]::Create);
      foreach ($f in $files) {
        $full = [System.IO.Path]::Combine($root, $f.Replace('/', [System.IO.Path]::DirectorySeparatorChar));
        if ([System.IO.File]::Exists($full)) {
          [void]$zip.CreateEntryFromFile($full, $f.Replace('\\\\', '/'), $mode);
        }
      }
      $zip.Dispose(); $stream.Dispose();
    `.trim();
    execFileSync(
      'powershell',
      ['-NoProfile', '-NonInteractive', '-Command', psScript],
      {
        timeout: 60_000,
        env: {
          ...process.env,
          PATCH_ROOT:  rootDir,
          PATCH_ZIP:   zipPath,
          PATCH_FILES: fileListJson,
        },
      },
    );
  } else {
    // macOS/Linux：用 zip 命令，-j 不保留路径，这里需要保留，所以用 -r 配合 -i 过滤
    // 方案：先 cd 到 rootDir，逐个添加文件
    const args = [zipPath];
    for (const f of changedFiles) {
      const fullPath = path.join(rootDir, f);
      if (fs.existsSync(fullPath)) args.push(f);
    }
    execFileSync('zip', args, { cwd: rootDir, timeout: 60_000 });
  }
}

/** 格式化字节数 */
function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

// ── main ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (prefix) => {
  const arg = args.find(a => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : '';
};
const hasFlag = (flag) => args.includes(flag);

const pkg     = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
const version = pkg.version;
const OWNER   = 'jiangkingwelcome';
const REPO    = 'auro-cocos-mcp';

const RELEASE_BASE = `https://github.com/${OWNER}/${REPO}/releases/download/v${version}`;

// 全量包 SHA256
const ceZipPath  = path.join(ROOT, `dist-plugin-release/aura-for-cocos-ce-v${version}.zip`);
const proZipPath = path.join(ROOT, `dist-plugin-release/aura-for-cocos-pro-v${version}.zip`);

const ceSha256  = getArg('--sha256-ce=')  || (fs.existsSync(ceZipPath)  ? computeSha256(ceZipPath)  : '');
const proSha256 = getArg('--sha256-pro=') || (fs.existsSync(proZipPath) ? computeSha256(proZipPath) : '');
const changelogEntry = getArg('--changelog=') || '';
const skipPatch = hasFlag('--skip-patch');

// 读取现有 manifest（保留历史 changelog 和上一版本的 fileManifest）
const manifestPath = path.join(ROOT, 'version.json');
let oldManifest = {};
try { oldManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')); } catch (_) {}
const changelog = oldManifest.changelog || {};
const prevVersion      = oldManifest.stable?.version || '';
const prevFileManifest = oldManifest.stable?.fileManifest || {};

// 写入本版本 changelog
if (changelogEntry) {
  changelog[version] = changelogEntry;
} else if (!changelog[version]) {
  changelog[version] = `v${version} — 详见 CHANGELOG.md`;
}

// ── 计算新版本的 fileManifest ───────────────────────────────────────────────
// 优先扫描已组装的 CE 包目录（反映真实安装文件结构），回退到 dist-release/
const pkgDir  = path.join(ROOT, 'dist-plugin-release', 'aura-for-cocos');
const distDir = path.join(ROOT, 'dist-release');
let newFileManifest = {};
if (fs.existsSync(pkgDir)) {
  // 使用已组装包目录（路径与用户安装后结构一致）
  newFileManifest = buildFileManifest(pkgDir);
  console.log(`📁 fileManifest (已组装包): 扫描到 ${Object.keys(newFileManifest).length} 个文件`);
} else if (fs.existsSync(distDir)) {
  // 回退：扫描 dist-release/（路径前缀为 dist/）
  newFileManifest = buildFileManifest(distDir, 'dist');
  console.log(`📁 fileManifest (dist-release 回退): 扫描到 ${Object.keys(newFileManifest).length} 个文件`);
} else {
  console.log('⚠ 未找到已组装包目录或 dist-release/，fileManifest 为空');
}

// ── 生成补丁包 ────────────────────────────────────────────────────────────────
let patches = oldManifest.stable?.patches || [];

if (!skipPatch && prevVersion && prevVersion !== version && Object.keys(prevFileManifest).length > 0) {
  const changedFiles = diffManifests(prevFileManifest, newFileManifest);

  if (changedFiles.length === 0) {
    console.log(`✅ 与 v${prevVersion} 相比无文件变更，跳过补丁包生成`);
  } else {
    const hasNative = changedFiles.some(f => f.endsWith('.node'));
    const requiresRestart = hasNative;
    const kind = hasNative ? 'coldpatch' : 'hotpatch';

    console.log(`\n🔧 检测到 ${changedFiles.length} 个文件变更（${kind}）：`);
    changedFiles.forEach(f => console.log(`   · ${f}`));
    if (hasNative) console.log(`   ⚠ 含原生模块，需要重启编辑器`);

    const patchZipName = `aura-patch-${prevVersion}-${version}.zip`;
    // patch zip 直接提交到仓库 patches/ 目录，通过 raw.githubusercontent.com 托管
    const patchZipPath = path.join(ROOT, 'patches', patchZipName);
    fs.mkdirSync(path.join(ROOT, 'patches'), { recursive: true });

    // patch zip 从已组装包目录打，路径与安装结构一致
    const patchSrcDir = fs.existsSync(pkgDir) ? pkgDir : ROOT;
    try {
      createPatchZip(changedFiles, patchSrcDir, patchZipPath);
      const patchSha256 = computeSha256(patchZipPath);
      const patchSize   = fs.statSync(patchZipPath).size;

      // 移除同一 from 的旧补丁（覆盖更新），追加新补丁
      patches = patches.filter(p => p.from !== prevVersion);
      // URL 使用 raw.githubusercontent.com，不依赖 GitHub Release（push 即上线）
      const RAW_BASE = `https://raw.githubusercontent.com/${OWNER}/${REPO}/master/patches`;
      patches.push({
        from:            prevVersion,
        to:              version,
        hasNative,
        requiresRestart,
        changedFiles,
        url:             `${RAW_BASE}/${patchZipName}`,
        sha256:          patchSha256,
        size:            patchSize,
      });

      console.log(`✅ 补丁包已生成: ${patchZipName} (${fmtBytes(patchSize)})`);
      console.log(`   sha256: ${patchSha256.slice(0, 8)}...`);
    } catch (err) {
      console.warn(`⚠ 补丁包生成失败（将使用全量包）: ${err.message}`);
      // 失败时不写入 patches，客户端自动回退到全量下载
    }
  }
} else if (!skipPatch && !prevVersion) {
  console.log(`ℹ 首次发布或无上一版本信息，跳过补丁包生成`);
} else if (skipPatch) {
  console.log(`ℹ --skip-patch 已指定，跳过补丁包生成`);
}

// ── 写入新的 version.json ─────────────────────────────────────────────────────
const newManifest = {
  schemaVersion: 2,
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
    fileManifest: newFileManifest,
    patches,
  },
  changelog,
};

fs.writeFileSync(manifestPath, JSON.stringify(newManifest, null, 2) + '\n', 'utf-8');

const ceSha256Short  = ceSha256  ? ceSha256.slice(0, 8)  + '...' : '(未找到)';
const proSha256Short = proSha256 ? proSha256.slice(0, 8) + '...' : '(未找到)';
console.log(`\n✅ version.json 已更新 → v${version} (schemaVersion 2)`);
console.log(`   CE  sha256: ${ceSha256Short}`);
console.log(`   Pro sha256: ${proSha256Short}`);
console.log(`   补丁包数量: ${patches.length}`);
console.log(`   下载地址: ${RELEASE_BASE}/...`);
