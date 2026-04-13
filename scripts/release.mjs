#!/usr/bin/env node
/**
 * scripts/release.mjs — 一键发布脚本
 *
 * 两种模式：
 *   full   完整发布（全量 CE + Pro zip 上传 GitHub Release，清空 patches/ 旧补丁）
 *   patch  热补丁  （差量 patch zip 提交到仓库 patches/ 目录，raw.githubusercontent.com 托管，
 *                    无需创建 GitHub Release，git push 即上线）
 *
 * 用法：
 *   node scripts/release.mjs                交互模式（推荐）
 *   node scripts/release.mjs --full         强制完整发布
 *   node scripts/release.mjs --patch        强制热补丁
 *   node scripts/release.mjs --dry-run      预演，不实际执行
 *   node scripts/release.mjs --skip-pro     跳过 Pro 版本构建
 *   node scripts/release.mjs --skip-push    跳过 git push + gh release
 *   node scripts/release.mjs --no-bytenode  跳过字节码保护（兼容旧 Cocos）
 *   node scripts/release.mjs --breaking     标记破坏性更新
 *   node scripts/release.mjs --version=X.Y.Z  指定版本号（跳过询问）
 *   node scripts/release.mjs --changelog="..."  指定 changelog（跳过询问）
 */
import fs   from 'fs';
import path from 'path';
import os   from 'os';
import crypto        from 'crypto';
import readline      from 'readline';
import { execSync, execFileSync, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');

// ── CLI flags ────────────────────────────────────────────────────────────────
const argv    = process.argv.slice(2);
const hasFlag = f   => argv.includes(f);
const getArg  = pfx => { const a = argv.find(x => x.startsWith(pfx)); return a ? a.slice(pfx.length) : ''; };

const OPT = {
  forceType:  hasFlag('--full') ? 'full' : hasFlag('--patch') ? 'patch' : '',
  dryRun:     hasFlag('--dry-run'),
  skipPro:    hasFlag('--skip-pro'),
  skipPush:   hasFlag('--skip-push'),
  noBytenode: hasFlag('--no-bytenode'),
  breaking:   hasFlag('--breaking'),
  version:    getArg('--version='),
  changelog:  getArg('--changelog='),
};

// ── Colors ───────────────────────────────────────────────────────────────────
const C = { reset:'\x1b[0m', bold:'\x1b[1m', dim:'\x1b[2m',
  green:'\x1b[32m', cyan:'\x1b[36m', yellow:'\x1b[33m',
  red:'\x1b[31m', blue:'\x1b[34m', magenta:'\x1b[35m' };
const clr = (c, s) => `${C[c]}${s}${C.reset}`;
const ok  = s => clr('green',  `✓ ${s}`);
const wrn = s => clr('yellow', `⚠ ${s}`);
const inf = s => clr('cyan',   `ℹ ${s}`);
const hdr = s => `\n${C.bold}${C.blue}━━ ${s} ${'━'.repeat(Math.max(0, 52 - s.length))}${C.reset}\n`;

let _stepN = 0;
const step = label => { _stepN++; console.log(`\n${C.bold}${C.cyan}[${String(_stepN).padStart(2)}]${C.reset} ${label}`); };
const log  = (...a) => console.log('    ', ...a);
const die  = msg   => { console.error(`\n${clr('red', `✗ ${msg}`)}\n`); process.exit(1); };

// ── Exec helper ──────────────────────────────────────────────────────────────
const isWin = process.platform === 'win32';
const npm   = isWin ? 'npm.cmd' : 'npm';

function run(cmd, opts = {}) {
  const desc = Array.isArray(cmd) ? cmd.join(' ') : cmd;
  log(clr('dim', `$ ${desc}`));
  if (OPT.dryRun) { log(clr('yellow', '(dry-run: skipped)')); return; }
  try {
    if (Array.isArray(cmd)) {
      const [bin, ...args] = cmd;
      const r = spawnSync(bin, args, { cwd: ROOT, stdio: 'inherit', shell: isWin, ...opts });
      if (r.status !== 0) die(`命令失败: ${desc}`);
    } else {
      execSync(cmd, { cwd: ROOT, stdio: 'inherit', shell: true, ...opts });
    }
  } catch { die(`命令失败: ${desc}`); }
}

// ── File utils ───────────────────────────────────────────────────────────────
const readJson  = f => JSON.parse(fs.readFileSync(f, 'utf-8'));
const exists    = p => fs.existsSync(p);
const ensureDir = p => { if (!OPT.dryRun) fs.mkdirSync(p, { recursive: true }); };
const tryRm     = p => { try { if (!OPT.dryRun) fs.unlinkSync(p); } catch {} };

function copyFile(src, dest) {
  if (!exists(src)) return false;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  return true;
}
function copyDir(src, dest) {
  if (!exists(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dest, e.name);
    if (e.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

function sha256(file) {
  const h = crypto.createHash('sha256');
  h.update(fs.readFileSync(file));
  return h.digest('hex');
}
function fmtBytes(n) {
  if (!n || n <= 0) return '0 B';
  if (n < 1024) return `${n} B`;
  if (n < 1_048_576) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1_048_576).toFixed(2)} MB`;
}

// ── fileManifest（扫描已组装的 CE 包目录，路径对应插件安装结构）───────────────
function buildManifest(dir, baseRel = '') {
  const m = {};
  if (!exists(dir)) return m;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel  = baseRel ? `${baseRel}/${e.name}` : e.name;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) Object.assign(m, buildManifest(full, rel));
    else {
      const h = crypto.createHash('sha256');
      h.update(fs.readFileSync(full));
      m[rel] = h.digest('hex');
    }
  }
  return m;
}
function diffManifests(oldM, newM) {
  return Object.entries(newM).filter(([k, v]) => oldM[k] !== v).map(([k]) => k);
}

// ── 版本号工具 ───────────────────────────────────────────────────────────────
function bumpVer(v, type) {
  const [maj, min, pat] = v.replace(/^v/, '').split('.').map(Number);
  return type === 'major' ? `${maj+1}.0.0` : type === 'minor' ? `${maj}.${min+1}.0` : `${maj}.${min}.${pat+1}`;
}

// ── git helpers ───────────────────────────────────────────────────────────────
const gitBranch  = () => { try { return execSync('git branch --show-current', { cwd: ROOT, encoding: 'utf-8' }).trim(); } catch { return 'unknown'; } };
const gitClean   = () => { try { return execSync('git status --porcelain', { cwd: ROOT, encoding: 'utf-8' }).trim() === ''; } catch { return false; } };
const ghAvail    = () => { try { execSync('gh --version', { stdio: 'ignore' }); return true; } catch { return false; } };
const cargoAvail = () => { try { execSync('cargo --version', { stdio: 'ignore' }); return true; } catch { return false; } };

function gitChangedFiles() {
  try {
    return execSync('git diff --name-only HEAD', { cwd: ROOT, encoding: 'utf-8' })
      .trim().split('\n').filter(Boolean);
  } catch { return []; }
}

// ── CHANGELOG.md 更新 ────────────────────────────────────────────────────────
function updateChangelog(version, entry) {
  if (OPT.dryRun) { log(clr('yellow', '(dry-run) 跳过 CHANGELOG')); return; }
  const file  = path.join(ROOT, 'CHANGELOG.md');
  const date  = new Date().toISOString().split('T')[0];
  const block = `## [${version}] - ${date}\n\n${entry}\n\n`;
  if (exists(file)) {
    const cur = fs.readFileSync(file, 'utf-8');
    if (cur.includes(`## [${version}]`)) return;
    const patched = cur.replace(/^(# .+\n+)/, `$1${block}`);
    fs.writeFileSync(file, patched === cur ? block + cur : patched, 'utf-8');
  } else {
    fs.writeFileSync(file, `# Changelog\n\n${block}`, 'utf-8');
  }
}

// ── CE 包组装（内联 Node.js，跨平台，不依赖 .bat/.sh）──────────────────────
function assembleCE(version) {
  const rel = path.join(ROOT, 'dist-release');
  const out = path.join(ROOT, 'dist-plugin-release', 'aura-for-cocos');

  if (!OPT.dryRun) {
    // 清旧目录（保留 .zip 文件）
    if (exists(out)) fs.rmSync(out, { recursive: true, force: true });
    fs.mkdirSync(path.join(out, 'dist', 'panels', 'default', 'i18n'), { recursive: true });
    fs.mkdirSync(path.join(out, 'native'), { recursive: true });

    copyFile(path.join(rel, 'package.json'), path.join(out, 'package.json'));

    for (const f of ['main.js', 'core.js', 'scene.js']) {
      copyFile(path.join(rel, f), path.join(out, 'dist', f));
    }
    if (!OPT.noBytenode) {
      for (const f of ['main.jsc', 'core.jsc', 'scene.jsc']) {
        copyFile(path.join(rel, f), path.join(out, 'dist', f));
      }
    }
    copyFile(path.join(rel, 'panels', 'default', 'index.js'),
             path.join(out, 'dist', 'panels', 'default', 'index.js'));
    const i18nSrc = path.join(rel, 'panels', 'default', 'i18n');
    if (exists(i18nSrc)) copyDir(i18nSrc, path.join(out, 'dist', 'panels', 'default', 'i18n'));

    const shimSrc = exists(path.join(rel, 'stdio-shim'))
      ? path.join(rel, 'stdio-shim') : path.join(ROOT, 'stdio-shim');
    copyDir(shimSrc, path.join(out, 'stdio-shim'));
    copyDir(path.join(ROOT, 'mcp-config-templates'), path.join(out, 'mcp-config-templates'));
    if (exists(path.join(ROOT, 'docs'))) copyDir(path.join(ROOT, 'docs'), path.join(out, 'docs'));
    copyFile(path.join(ROOT, 'LICENSE'),     path.join(out, 'LICENSE'));
    copyFile(path.join(ROOT, 'README.md'),   path.join(out, 'README.md'));
    copyFile(path.join(ROOT, 'native', 'index.js'), path.join(out, 'native', 'index.js'));
  }

  const zipPath = path.join(ROOT, 'dist-plugin-release', `aura-for-cocos-ce-v${version}.zip`);
  tryRm(zipPath);
  log(`打包 CE → ${clr('green', path.basename(zipPath))}`);
  if (!OPT.dryRun) {
    if (isWin) {
      execFileSync('powershell', ['-NoProfile', '-NonInteractive', '-Command',
        `Compress-Archive -Path '${out.replace(/\\/g, '/')}' -DestinationPath '${zipPath.replace(/\\/g, '/')}' -Force`],
        { cwd: ROOT, timeout: 120_000 });
    } else {
      execFileSync('zip', ['-r', zipPath, 'aura-for-cocos'],
        { cwd: path.join(ROOT, 'dist-plugin-release'), timeout: 120_000 });
    }
    log(`CE zip: ${fmtBytes(fs.statSync(zipPath).size)}`);
  }
  return zipPath;
}

// ── Pro 包组装（CE + native binaries）───────────────────────────────────────
function assemblePro(version) {
  const ceIn  = path.join(ROOT, 'dist-plugin-release', 'aura-for-cocos');
  const out   = path.join(ROOT, 'dist-plugin-pro',     'aura-for-cocos');

  if (!OPT.dryRun) {
    if (exists(out)) fs.rmSync(out, { recursive: true, force: true });
    // Pro = CE 内容基础上追加 native binaries
    copyDir(ceIn, out);
    // ACTIVATION.txt
    copyFile(path.join(ROOT, 'ACTIVATION.txt'), path.join(out, 'ACTIVATION.txt'));
    // native binaries — 复制 native/ 下所有 .node 文件
    const nativeDir = path.join(ROOT, 'native');
    const destNative = path.join(out, 'native');
    fs.mkdirSync(destNative, { recursive: true });
    if (exists(nativeDir)) {
      for (const e of fs.readdirSync(nativeDir, { withFileTypes: true })) {
        if (e.isFile()) copyFile(path.join(nativeDir, e.name), path.join(destNative, e.name));
      }
    }
  }

  const zipPath = path.join(ROOT, 'dist-plugin-release', `aura-for-cocos-pro-v${version}.zip`);
  tryRm(zipPath);
  log(`打包 Pro → ${clr('green', path.basename(zipPath))}`);
  if (!OPT.dryRun) {
    const outParent = path.join(ROOT, 'dist-plugin-pro');
    if (isWin) {
      execFileSync('powershell', ['-NoProfile', '-NonInteractive', '-Command',
        `Compress-Archive -Path '${out.replace(/\\/g, '/')}' -DestinationPath '${zipPath.replace(/\\/g, '/')}' -Force`],
        { cwd: ROOT, timeout: 120_000 });
    } else {
      execFileSync('zip', ['-r', zipPath, 'aura-for-cocos'],
        { cwd: outParent, timeout: 120_000 });
    }
    log(`Pro zip: ${fmtBytes(fs.statSync(zipPath).size)}`);
  }
  return zipPath;
}

// ── Rust 原生模块构建 ────────────────────────────────────────────────────────
function buildNative() {
  const nativeDir = path.join(ROOT, 'native');
  if (!exists(nativeDir)) { log(wrn('native/ 目录不存在，跳过 Rust 构建')); return; }

  log('cargo build --release …');
  if (!OPT.dryRun) {
    const cargoBin = path.join(os.homedir(), '.cargo', 'bin');
    execSync('cargo build --release', {
      cwd: nativeDir, stdio: 'inherit',
      env: { ...process.env, PATH: `${cargoBin}${path.delimiter}${process.env.PATH}` },
      timeout: 600_000,
    });

    const libName = isWin ? 'cocos_mcp_pro.dll'
      : process.platform === 'darwin' ? 'libcocos_mcp_pro.dylib' : 'libcocos_mcp_pro.so';
    const nodeFile = isWin ? 'cocos_pro.win32-x64-msvc.node'
      : process.platform === 'darwin'
        ? `cocos_pro.darwin-${process.arch}.node`
        : 'cocos_pro.linux-x64-gnu.node';

    const src  = path.join(nativeDir, 'target', 'release', libName);
    const dest = path.join(nativeDir, nodeFile);
    if (!exists(src)) die(`Rust 构建产物未找到: ${src}`);
    fs.copyFileSync(src, dest);
    log(`✓ ${nodeFile}  (${fmtBytes(fs.statSync(dest).size)})`);
  }
}

// ── 补丁 zip 创建（changedFiles 相对于 pluginPackageDir）────────────────────
function createPatchZip(changedFiles, pluginPackageDir, zipPath) {
  ensureDir(path.dirname(zipPath));
  tryRm(zipPath);
  if (OPT.dryRun) { log(clr('yellow', `(dry-run) 跳过创建 ${path.basename(zipPath)}`)); return; }

  if (isWin) {
    const ps = [
      'Add-Type -Assembly System.IO.Compression.FileSystem;',
      '$r=$env:P_ROOT;$z=$env:P_ZIP;',
      '$fl=($env:P_FILES|ConvertFrom-Json);',
      '$m=[System.IO.Compression.CompressionLevel]::Optimal;',
      '$s=[System.IO.File]::Open($z,[System.IO.FileMode]::Create);',
      '$a=New-Object System.IO.Compression.ZipArchive($s,[System.IO.Compression.ZipArchiveMode]::Create);',
      'foreach($f in $fl){',
      '  $fp=[System.IO.Path]::Combine($r,$f.Replace("/",[char]92));',
      '  if([System.IO.File]::Exists($fp)){',
      '    [void]$a.CreateEntryFromFile($fp,$f,$m)',
      '  }',
      '};$a.Dispose();$s.Dispose()',
    ].join(' ');
    execFileSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', ps], {
      cwd: ROOT, timeout: 60_000,
      env: { ...process.env, P_ROOT: pluginPackageDir, P_ZIP: zipPath, P_FILES: JSON.stringify(changedFiles) },
    });
  } else {
    const valid = changedFiles.filter(f => exists(path.join(pluginPackageDir, f)));
    execFileSync('zip', [zipPath, ...valid], { cwd: pluginPackageDir, timeout: 60_000 });
  }
}

// ── readline prompt ──────────────────────────────────────────────────────────
function prompt(rl, q) { return new Promise(r => rl.question(q, r)); }

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  // Banner
  console.log(`\n${C.bold}${C.magenta}  Aura for Cocos — 一键发布脚本${C.reset}  ${OPT.dryRun ? clr('yellow', '[DRY-RUN]') : ''}\n`);

  // 读取当前状态
  const pkgPath = path.join(ROOT, 'package.json');
  const vmPath  = path.join(ROOT, 'version.json');
  const pkg     = readJson(pkgPath);
  const vm      = exists(vmPath) ? readJson(vmPath) : { stable: {}, changelog: {} };
  const curVer  = pkg.version;
  const prevManifest = vm.stable?.fileManifest ?? {};
  const prevPatches  = vm.stable?.patches      ?? [];

  console.log(`${inf('当前版本')}: ${clr('bold', curVer)}   分支: ${clr('bold', gitBranch())}`);

  // ── 预检 ──────────────────────────────────────────────────────────────────
  console.log(hdr('预检'));
  if (gitClean()) {
    console.log(ok('Git 工作区干净'));
  } else {
    console.log(wrn('工作区有未提交更改，请确认所有更改均已包含在本次发布中'));
  }
  if (ghAvail()) {
    console.log(ok('gh CLI 可用'));
  } else if (OPT.skipPush) {
    console.log(inf('gh CLI 不可用（--skip-push 已跳过）'));
  } else {
    console.log(wrn('gh CLI 未安装，将跳过 GitHub Release 创建'));
  }

  // ── 交互收集配置 ───────────────────────────────────────────────────────────
  console.log(hdr('发布配置'));
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  // 1. 版本号
  let newVer = OPT.version?.replace(/^v/, '');
  if (!newVer) {
    const sp = bumpVer(curVer, 'patch'), sm = bumpVer(curVer, 'minor'), sM = bumpVer(curVer, 'major');
    console.log(`  建议: ${clr('green', sp)} (patch)  ${clr('cyan', sm)} (minor)  ${clr('yellow', sM)} (major)`);
    const inp = await prompt(rl, `  新版本号 [默认 ${sp}]: `);
    newVer = inp.trim() || sp;
  }
  if (!/^\d+\.\d+\.\d+$/.test(newVer)) die(`版本号格式无效: ${newVer}`);
  console.log(ok(`新版本: v${newVer}`));

  // 2. 发布类型
  let releaseType = OPT.forceType;
  if (!releaseType) {
    const changedSrc = gitChangedFiles();
    const hasRust    = changedSrc.some(f => f.startsWith('native/') && f.endsWith('.rs'));
    const hasPrev    = Object.keys(prevManifest).length > 0;
    const suggest    = (!hasPrev || hasRust) ? 'full' : 'patch';
    const reason     = !hasPrev ? '首次发布或无历史 fileManifest'
      : hasRust ? '检测到 Rust 源码变更，需完整构建'
      : '仅检测到 JS/TS 变更，建议热补丁';
    console.log(`\n  自动推断: ${clr('cyan', suggest)}  (${reason})`);
    console.log(`    f = full   完整发布（全量 zip，清空补丁历史）`);
    console.log(`    p = patch  热补丁  （差量 zip，JS 变更无需重启）`);
    const inp = await prompt(rl, `  发布类型 [${suggest === 'full' ? 'F/p' : 'f/P'}，回车接受]: `);
    const c   = inp.trim().toLowerCase();
    releaseType = (c === 'p' || c === 'patch') ? 'patch'
      : (c === 'f' || c === 'full')  ? 'full'
      : suggest;
  }
  console.log(ok(`类型: ${releaseType === 'patch' ? clr('green', 'hotpatch 热补丁') : clr('yellow', 'full 完整发布')}`));

  // 3. Changelog
  let changelog = OPT.changelog;
  if (!changelog) {
    let def = '';
    try {
      def = execSync('git log --oneline -5 --no-merges', { cwd: ROOT, encoding: 'utf-8' })
        .trim().split('\n').map(l => `- ${l.replace(/^[a-f0-9]+ /, '')}`).join('\n');
    } catch {}
    if (def) console.log(`\n  最近提交:\n${clr('dim', def.split('\n').map(l => `    ${l}`).join('\n'))}`);
    const inp = await prompt(rl, `  Changelog（回车用 git log）: `);
    changelog = inp.trim() || def || `v${newVer} 更新`;
  }

  // 4. Pro / Breaking
  let buildPro = !OPT.skipPro;
  if (!OPT.skipPro) {
    const inp = await prompt(rl, `\n  构建 Pro 版本? [Y/n]: `);
    buildPro = inp.trim().toLowerCase() !== 'n';
  }
  let breaking = OPT.breaking;
  if (!breaking) {
    const inp = await prompt(rl, `  Breaking change? [y/N]: `);
    breaking = inp.trim().toLowerCase() === 'y';
  }
  rl.close();

  // 5. 汇总确认
  console.log(hdr('发布计划'));
  [
    `  版本     : ${clr('dim', curVer)} → ${clr('bold', `v${newVer}`)}`,
    `  类型     : ${releaseType === 'patch' ? clr('green', '热补丁') : clr('yellow', '完整发布')}`,
    `  Pro 版本 : ${buildPro ? clr('green', '是') : clr('dim', '跳过')}`,
    `  字节码   : ${OPT.noBytenode ? clr('dim', '跳过') : clr('green', '是')}`,
    `  Breaking : ${breaking ? clr('yellow', '是 ⚠') : clr('dim', '否')}`,
    `  git push : ${OPT.skipPush ? clr('dim', '跳过') : clr('green', '是')}`,
  ].forEach(l => console.log(l));

  if (!OPT.dryRun) {
    const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ok2 = await prompt(rl2, `\n${C.bold}  确认发布? [y/N]: ${C.reset}`);
    rl2.close();
    if (ok2.trim().toLowerCase() !== 'y') { console.log(clr('yellow', '\n  已取消')); process.exit(0); }
  }

  // ════════════════════════════════════════════════════════
  // 执行发布
  // ════════════════════════════════════════════════════════

  // ① 更新 package.json 版本
  step('更新版本号');
  log(`package.json: ${curVer} → ${clr('green', newVer)}`);
  if (!OPT.dryRun) { pkg.version = newVer; fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8'); }
  console.log(`  ${ok('package.json 已更新')}`);

  // ② TypeScript 编译
  step('TypeScript 编译 (tsc)');
  run([npm, 'run', 'build']);
  console.log(`  ${ok('dist/ 编译完成')}`);

  // ③ esbuild release bundle
  step('esbuild release bundle');
  run(['node', 'scripts/build-release.mjs']);
  console.log(`  ${ok('dist-release/ 构建完成')}`);

  // ④ 代码保护（混淆 + 字节码）
  step(`代码保护${OPT.noBytenode ? '（仅混淆）' : '（混淆 + bytenode）'}`);
  run(['node', 'scripts/build-protected.mjs', ...(OPT.noBytenode ? ['--obfuscate-only'] : [])]);
  console.log(`  ${ok('代码保护完成')}`);

  // ⑤ [Full only] 编译 Rust 原生模块
  if (releaseType === 'full' && buildPro) {
    step('Rust 原生模块编译');
    if (cargoAvail()) {
      buildNative();
      console.log(`  ${ok('native 编译完成')}`);
    } else {
      console.log(`  ${wrn('未找到 cargo，跳过 Rust 编译（将复用已有 .node 文件）')}`);
    }
  }

  // ⑥ 组装 CE 包
  step('组装 CE 发布包');
  const ceZip = assembleCE(newVer);
  console.log(`  ${ok('CE zip 完成')}`);

  // ⑦ 组装 Pro 包（可选）
  let proZip = null;
  if (buildPro) {
    step(`组装 Pro 发布包`);
    proZip = assemblePro(newVer);
    console.log(`  ${ok('Pro zip 完成')}`);
  }

  // ⑧ fileManifest + patch zip + version.json
  step('生成 fileManifest 并更新 version.json');

  // fileManifest 扫描已组装好的 CE 包目录（反映真实安装文件结构）
  const pkgDir     = path.join(ROOT, 'dist-plugin-release', 'aura-for-cocos');
  const newManifest = OPT.dryRun ? {} : buildManifest(pkgDir);
  log(`fileManifest: ${Object.keys(newManifest).length} 个文件`);

  // patch 处理
  let patches  = prevPatches.slice();
  let patchZip = null;
  let patchMeta = null;

  if (releaseType === 'patch' && Object.keys(prevManifest).length > 0) {
    const changedFiles  = OPT.dryRun ? ['dist/core.js'] : diffManifests(prevManifest, newManifest);
    const hasNative     = changedFiles.some(f => f.endsWith('.node'));
    const requiresRestart = hasNative;
    const kind          = hasNative ? 'coldpatch' : 'hotpatch';

    log(`变更文件 (${clr('cyan', kind)}): ${changedFiles.length} 个`);
    changedFiles.slice(0, 8).forEach(f => log(`  ${clr('dim', f)}`));
    if (changedFiles.length > 8) log(clr('dim', `  ... 等 ${changedFiles.length - 8} 个`));

    const patchName  = `aura-patch-${curVer}-${newVer}.zip`;
    // patch zip 直接提交到仓库 patches/ 目录，通过 raw.githubusercontent.com 托管
    // 无需上传 GitHub Release，push 即上线
    const patchesDir = path.join(ROOT, 'patches');
    patchZip = path.join(patchesDir, patchName);
    if (!OPT.dryRun) ensureDir(patchesDir);
    log(`创建补丁包: ${clr('green', patchName)}  → patches/${patchName}`);
    createPatchZip(changedFiles, pkgDir, patchZip);

    const patchSha = !OPT.dryRun && exists(patchZip) ? sha256(patchZip) : '0'.repeat(64);
    const patchSz  = !OPT.dryRun && exists(patchZip) ? fs.statSync(patchZip).size : 0;

    // URL 使用 raw.githubusercontent.com，不依赖 GitHub Release
    const RAW_BASE = `https://raw.githubusercontent.com/jiangkingwelcome/auro-cocos-mcp/master/patches`;
    patchMeta = { from: curVer, to: newVer, hasNative, requiresRestart, changedFiles,
      url:    `${RAW_BASE}/${patchName}`,
      sha256: patchSha, size: patchSz };
    log(`补丁大小: ${fmtBytes(patchSz)}  sha256: ${patchSha.slice(0, 8)}...`);
    log(inf(`托管方式: raw.githubusercontent.com（git push 即上线，无需 gh release）`));

    // ── 累积补丁（cross-version hotpatch）────────────────────────────────────
    // 问题：旧逻辑只保留直接补丁（e.g. 1.0.14→1.0.15），导致用户跨越多版本时
    //       find(p => p.from===cur && p.to===lat) 永远找不到匹配，强制全量包。
    //
    // 修复：对 prevPatches 中每个历史 from 版本，把它到 curVer 已积累的文件集
    //       与本次 changedFiles 合并，生成新的 fromVer→newVer 累积补丁。
    //       同时删除旧的 fromVer→prevTo.zip（不再被引用）。
    //
    // 例：1.0.12→1.0.13["a.js"]  +  1.0.14→1.0.15["b.js"]
    //      ⟹ 生成 1.0.12→1.0.15["a.js","b.js"]  （1.0.12 用户直接 hotpatch）
    const cumulativeEntries = [];
    // 排除 curVer 本身：直接补丁 patchMeta 已经覆盖 curVer→newVer，防止重复条目
    const prevFromVersions  = prevPatches.map(p => p.from).filter(v => v !== curVer);

    if (prevFromVersions.length > 0) {
      log(inf(`为 ${prevFromVersions.length} 个历史版本生成累积补丁...`));
    }

    for (const fromVer of prevFromVersions) {
      const prevEntry    = prevPatches.find(p => p.from === fromVer);
      const histFiles    = prevEntry?.changedFiles ?? [];
      const histNative   = prevEntry?.hasNative    ?? false;

      // 合并历史变更 + 本次变更（去重）
      const cumFiles     = [...new Set([...histFiles, ...changedFiles])];
      const cumNative    = histNative || hasNative;
      const cumName      = `aura-patch-${fromVer}-${newVer}.zip`;
      const cumPath      = path.join(patchesDir, cumName);

      log(`  累积补丁: ${clr('dim', `v${fromVer}`)} → ${clr('green', `v${newVer}`)}  ${cumFiles.length} 个文件`);
      createPatchZip(cumFiles, pkgDir, cumPath);

      // 删除旧的 fromVer→prevTo.zip（已被本次累积包替代，不再被任何版本引用）
      if (!OPT.dryRun && prevEntry && prevEntry.to !== newVer) {
        const oldZip = path.join(patchesDir, `aura-patch-${fromVer}-${prevEntry.to}.zip`);
        if (exists(oldZip)) { fs.unlinkSync(oldZip); log(`  ${clr('dim', `已删除旧补丁: aura-patch-${fromVer}-${prevEntry.to}.zip`)}`); }
      }

      const cumSha = !OPT.dryRun && exists(cumPath) ? sha256(cumPath) : '0'.repeat(64);
      const cumSz  = !OPT.dryRun && exists(cumPath) ? fs.statSync(cumPath).size : 0;

      cumulativeEntries.push({
        from: fromVer, to: newVer,
        hasNative: cumNative, requiresRestart: cumNative,
        changedFiles: cumFiles,
        url:    `${RAW_BASE}/${cumName}`,
        sha256: cumSha, size: cumSz,
      });
    }

    // 最终 patches：所有条目的 to 都指向 newVer（含直接补丁 + 所有累积补丁）
    patches = [...cumulativeEntries, patchMeta];

  } else if (releaseType === 'full') {
    // 完整发布：清空旧补丁历史（从当前版本起重新计算）
    patches = [];
    log(inf('完整发布：清空历史 patches[]'));
    // 同时删除 patches/ 目录下所有旧 zip（保留 .gitkeep）
    if (!OPT.dryRun) {
      const patchesDir = path.join(ROOT, 'patches');
      if (exists(patchesDir)) {
        for (const f of fs.readdirSync(patchesDir)) {
          if (f.endsWith('.zip')) fs.unlinkSync(path.join(patchesDir, f));
        }
        log(inf('已清空 patches/ 目录下旧补丁文件'));
      }
    }
  }

  // SHA256
  const BASE       = `https://github.com/jiangkingwelcome/auro-cocos-mcp/releases/download/v${newVer}`;
  const ceSha256   = !OPT.dryRun && exists(ceZip)  ? sha256(ceZip)  : '';
  const proSha256  = !OPT.dryRun && proZip && exists(proZip) ? sha256(proZip) : '';

  log(`CE  sha256: ${ceSha256.slice(0, 12) || '(dry-run)'}...`);
  if (proSha256) log(`Pro sha256: ${proSha256.slice(0, 12)}...`);

  // 写入 version.json
  const newVm = {
    schemaVersion: 2,
    stable: {
      version:     newVer,
      releaseDate: new Date().toISOString().split('T')[0],
      ce:          { url: `${BASE}/aura-for-cocos-ce-v${newVer}.zip`,  sha256: ceSha256 },
      pro:         { url: `${BASE}/aura-for-cocos-pro-v${newVer}.zip`, sha256: proSha256 },
      breaking,
      fileManifest: newManifest,
      patches,
    },
    changelog: { ...(vm.changelog ?? {}), [newVer]: changelog },
  };
  if (!OPT.dryRun) fs.writeFileSync(vmPath, JSON.stringify(newVm, null, 2) + '\n', 'utf-8');
  console.log(`  ${ok(`version.json 更新完成  patches: ${patches.length} 条`)}`);

  // ⑨ CHANGELOG.md
  step('更新 CHANGELOG.md');
  updateChangelog(newVer, changelog);
  console.log(`  ${ok('CHANGELOG.md 完成')}`);

  // ⑩ Git commit + tag + push
  step('Git 提交、打标签');
  const commitMsg = releaseType === 'patch'
    ? `chore: hotpatch v${newVer}` : `chore: release v${newVer}`;
  // patches/ 目录：hotpatch 模式提交新 zip；full 模式提交删除旧 zip 后的状态
  run(`git add package.json version.json CHANGELOG.md patches/`);
  run(`git commit -m "${commitMsg}"`);
  run(`git tag -a v${newVer} -m "Release v${newVer}"`);
  console.log(`  ${ok(`已提交 & 标签 v${newVer}`)}`);

  if (!OPT.skipPush) {
    run('git push');
    run('git push --tags');
    console.log(`  ${ok('已推送到远程')}`);
  }

  // ⑪ GitHub Release
  if (!OPT.skipPush && ghAvail()) {
    step('创建 GitHub Release');
    const assets = [ceZip];
    if (proZip && exists(proZip)) assets.push(proZip);
    // patch zip 已提交到仓库 patches/ 目录，通过 raw.githubusercontent.com 下载
    // 无需上传 GitHub Release，所以不加入 assets

    const kindLabel = releaseType === 'patch'
      ? (patchMeta?.kind === 'hotpatch' ? '🔥 热补丁（无需重启编辑器）' : '🔧 小包更新（需重启编辑器）')
      : '🚀 完整版本发布';
    const patchNote = releaseType === 'patch' && patchMeta
      ? `\n> 💡 **从 v${curVer} 升级**：插件自动下载 \`${path.basename(patchZip)}\` (${fmtBytes(patchMeta.size)})，${patchMeta.requiresRestart ? '更新后需重启编辑器' : '**无需重启编辑器**'}。`
      : '';

    const notes = [
      `## ${kindLabel}`, '',
      changelog, '',
      '---', '',
      `**版本**: v${newVer}  |  **日期**: ${new Date().toISOString().split('T')[0]}`,
      '', '### 安装',
      `下载 \`aura-for-cocos-ce-v${newVer}.zip\`（社区版）或 \`aura-for-cocos-pro-v${newVer}.zip\`（Pro 版），`,
      `解压到 Cocos Creator 项目 \`extensions/\` 目录后启用插件。`,
      patchNote,
    ].join('\n');

    const ghArgs = [
      'release', 'create', `v${newVer}`,
      ...assets,
      '--title', `v${newVer}${breaking ? ' (Breaking Change)' : ''}`,
      '--notes', notes,
      '--latest',
      ...(breaking ? ['--prerelease'] : []),
    ];

    if (!OPT.dryRun) {
      try {
        execFileSync('gh', ghArgs, { cwd: ROOT, stdio: 'inherit' });
        console.log(`  ${ok('GitHub Release 创建成功')}`);
      } catch (e) {
        console.log(wrn(`GitHub Release 失败: ${e.message}`));
        console.log(inf(`手动创建: gh release create v${newVer} ${assets.map(a => `"${path.basename(a)}"`).join(' ')}`));
      }
    } else {
      log(clr('yellow', `(dry-run) gh release create v${newVer} ${assets.map(a => path.basename(a)).join(' ')}`));
    }
  }

  // ── 完成摘要 ──────────────────────────────────────────────────────────────
  console.log(`\n${C.bold}${C.green}${'═'.repeat(56)}${C.reset}`);
  console.log(`${C.bold}${C.green}  🎉  发布完成！v${newVer}${C.reset}`);
  console.log(`${C.bold}${C.green}${'═'.repeat(56)}${C.reset}\n`);
  [
    `  CE zip  : ${clr('cyan', path.basename(ceZip))}  ${!OPT.dryRun && exists(ceZip) ? fmtBytes(fs.statSync(ceZip).size) : ''}`,
    proZip   ? `  Pro zip : ${clr('cyan', path.basename(proZip))}  ${!OPT.dryRun && exists(proZip) ? fmtBytes(fs.statSync(proZip).size) : ''}` : null,
    patchZip ? `  Patch   : ${clr('green', path.basename(patchZip))}  ${!OPT.dryRun && exists(patchZip) ? fmtBytes(fs.statSync(patchZip).size) : ''}  ← 用户自动热更` : null,
    `  类型    : ${releaseType}${patchMeta ? ` (${patchMeta.kind})` : ''}`,
  ].filter(Boolean).forEach(l => console.log(l));
  console.log('');
}

main().catch(e => {
  if (e.code === 'ERR_USE_AFTER_CLOSE') { console.log(clr('yellow', '\n  已中断')); process.exit(0); }
  console.error(clr('red', `\n未捕获错误: ${e.message}`));
  if (process.env.DEBUG) console.error(e.stack);
  process.exit(1);
});
