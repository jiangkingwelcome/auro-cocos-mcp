#!/usr/bin/env node
/**
 * package-pro.mjs — Complete Pro edition build & package
 *
 * Builds everything from source and produces a distributable zip:
 *   1. TypeScript compilation
 *   2. Rust native module (release)
 *   3. esbuild release bundle
 *   4. JS obfuscation + bytenode protection
 *   5. Assemble dist-plugin-pro/ with all artifacts
 *   6. Create zip
 *
 * Usage:
 *   node scripts/package-pro.mjs              # Full Pro build
 *   node scripts/package-pro.mjs --skip-rust  # Skip Rust build (use existing .node)
 *   node scripts/package-pro.mjs --skip-protect # Skip obfuscation/bytenode
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const NATIVE_DIR = path.join(ROOT, 'native');
const OUT = path.join(ROOT, 'dist-plugin-pro');
const DIST_RELEASE = path.join(ROOT, 'dist-release');

const argv = process.argv.slice(2);
const skipRust = argv.includes('--skip-rust');
const skipProtect = argv.includes('--skip-protect');

const platform = os.platform();
const arch = os.arch();

const PLATFORM_NODE_MAP = {
  'win32-x64':    'cocos_pro.win32-x64-msvc.node',
  'darwin-x64':   'cocos_pro.darwin-x64.node',
  'darwin-arm64': 'cocos_pro.darwin-arm64.node',
  'linux-x64':    'cocos_pro.linux-x64-gnu.node',
};

const LIB_NAME_MAP = {
  win32:  'cocos_mcp_pro.dll',
  darwin: 'libcocos_mcp_pro.dylib',
  linux:  'libcocos_mcp_pro.so',
};

function log(step, msg) {
  console.log(`\x1b[33m[${step}]\x1b[0m ${msg}`);
}

function run(cmd, cwd = ROOT) {
  console.log(`  \x1b[2m$ ${cmd}\x1b[0m`);
  execSync(cmd, { cwd, stdio: 'inherit', env: { ...process.env, PATH: `${path.join(os.homedir(), '.cargo', 'bin')}${path.delimiter}${process.env.PATH}` } });
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function fileSize(p) {
  return (fs.statSync(p).size / 1024).toFixed(1);
}

async function main() {
  const t0 = Date.now();

  console.log('\n\x1b[33m' + '='.repeat(50) + '\x1b[0m');
  console.log('\x1b[33m  Aura Pro — Full Build\x1b[0m');
  console.log('\x1b[33m' + '='.repeat(50) + '\x1b[0m');
  console.log(`  Platform: ${platform}-${arch}`);
  console.log(`  Skip Rust: ${skipRust}`);
  console.log(`  Skip Protection: ${skipProtect}\n`);

  const nodeFile = PLATFORM_NODE_MAP[`${platform}-${arch}`];
  if (!nodeFile) {
    console.error(`\x1b[31mUnsupported platform: ${platform}-${arch}\x1b[0m`);
    process.exit(1);
  }

  // ── Step 1: TypeScript ──
  log('1/7', 'TypeScript compilation...');
  run('npm run build');

  // ── Step 2: Rust native module ──
  if (!skipRust) {
    log('2/7', 'Rust native module (release)...');
    try {
      execSync('rustc --version', { stdio: 'pipe', env: { ...process.env, PATH: `${path.join(os.homedir(), '.cargo', 'bin')}${path.delimiter}${process.env.PATH}` } });
    } catch {
      console.error('\x1b[31mRust toolchain not found. Install from https://rustup.rs/\x1b[0m');
      process.exit(1);
    }
    run('cargo build --release', NATIVE_DIR);

    const libName = LIB_NAME_MAP[platform];
    const srcBin = path.join(NATIVE_DIR, 'target', 'release', libName);
    const destBin = path.join(NATIVE_DIR, nodeFile);
    fs.copyFileSync(srcBin, destBin);
    log('2/7', `Output: native/${nodeFile} (${fileSize(destBin)} KB)`);
  } else {
    log('2/7', 'Skipped Rust build (--skip-rust)');
    if (!fs.existsSync(path.join(NATIVE_DIR, nodeFile))) {
      console.error(`\x1b[31mNo existing .node file found: native/${nodeFile}\x1b[0m`);
      console.error('Run without --skip-rust first.');
      process.exit(1);
    }
  }

  // ── Step 3: esbuild release bundle ──
  log('3/7', 'esbuild release bundle...');
  run('node scripts/build-release.mjs');

  // ── Step 4: JS protection ──
  if (!skipProtect) {
    log('4/7', 'JS obfuscation + bytenode...');
    run('node scripts/build-protected.mjs');
  } else {
    log('4/7', 'Skipped protection (--skip-protect)');
  }

  // ── Step 5: Assemble Pro package ──
  log('5/7', 'Assemble Pro package...');
  if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true, force: true });

  const pluginDir = path.join(OUT, 'aura-for-cocos');

  // package.json
  copyFile(path.join(DIST_RELEASE, 'package.json'), path.join(pluginDir, 'package.json'));

  // JS bundles
  for (const f of ['main.js', 'core.js', 'scene.js', 'main.jsc', 'core.jsc', 'scene.jsc']) {
    const src = path.join(DIST_RELEASE, f);
    if (fs.existsSync(src)) copyFile(src, path.join(pluginDir, 'dist', f));
  }

  // Panel
  copyFile(
    path.join(DIST_RELEASE, 'panels', 'default', 'index.js'),
    path.join(pluginDir, 'dist', 'panels', 'default', 'index.js'),
  );
  const i18nDir = path.join(DIST_RELEASE, 'panels', 'default', 'i18n');
  if (fs.existsSync(i18nDir)) {
    copyDir(i18nDir, path.join(pluginDir, 'dist', 'panels', 'default', 'i18n'));
  }

  // Rust native binary
  copyFile(path.join(NATIVE_DIR, 'index.js'), path.join(pluginDir, 'native', 'index.js'));
  copyFile(path.join(NATIVE_DIR, nodeFile), path.join(pluginDir, 'native', nodeFile));

  // stdio-shim (protected if available)
  const shimSrc = fs.existsSync(path.join(DIST_RELEASE, 'stdio-shim'))
    ? path.join(DIST_RELEASE, 'stdio-shim')
    : path.join(ROOT, 'stdio-shim');
  copyDir(shimSrc, path.join(pluginDir, 'stdio-shim'));

  // MCP config templates
  copyDir(path.join(ROOT, 'mcp-config-templates'), path.join(pluginDir, 'mcp-config-templates'));

  // ── Step 6: Docs + LICENSE + README + ACTIVATION ──
  log('6/7', 'Copy docs, LICENSE, README, ACTIVATION...');
  const docsDir = path.join(ROOT, 'docs');
  if (fs.existsSync(docsDir)) {
    copyDir(docsDir, path.join(pluginDir, 'docs'));
  }
  for (const f of ['LICENSE', 'README.md', 'ACTIVATION.txt']) {
    const src = path.join(ROOT, f);
    if (fs.existsSync(src)) copyFile(src, path.join(pluginDir, f));
  }

  // ── Step 7: Zip ──
  log('7/7', 'Create zip...');
  let version = 'unknown';
  try {
    version = JSON.parse(fs.readFileSync(path.join(DIST_RELEASE, 'package.json'), 'utf-8')).version || 'unknown';
  } catch { /* ignore */ }

  const zipName = `aura-for-cocos-v${version}-pro-${platform}-${arch}.zip`;
  const zipPath = path.join(OUT, zipName);

  if (platform === 'win32') {
    run(`powershell -Command "Compress-Archive -Path '${pluginDir}' -DestinationPath '${zipPath}' -Force"`, ROOT);
  } else {
    run(`cd "${OUT}" && zip -r "${zipName}" aura-for-cocos`, ROOT);
  }

  // ── Summary ──
  const files = [];
  function walk(dir, prefix = '') {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full, prefix + entry.name + '/');
      else files.push({ name: prefix + entry.name, size: fs.statSync(full).size });
    }
  }
  walk(pluginDir);

  const totalSize = files.reduce((a, f) => a + f.size, 0);
  const zipSize = fs.existsSync(zipPath) ? fs.statSync(zipPath).size : 0;

  console.log('\n\x1b[32m' + '='.repeat(50) + '\x1b[0m');
  console.log('\x1b[32m  Pro Build Complete\x1b[0m');
  console.log('\x1b[32m' + '='.repeat(50) + '\x1b[0m');
  console.log(`  Version:  v${version}`);
  console.log(`  Platform: ${platform}-${arch}`);
  console.log(`  Folder:   dist-plugin-pro/aura-for-cocos/`);
  console.log(`  Zip:      dist-plugin-pro/${zipName}`);
  console.log(`  Size:     ${(totalSize / 1024 / 1024).toFixed(1)} MB (zip: ${(zipSize / 1024 / 1024).toFixed(1)} MB)`);
  console.log(`  Time:     ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  console.log('');
  console.log('  Protection layers:');
  console.log('    [1] esbuild minify + tree shaking');
  if (!skipProtect) {
    console.log('    [2] JavaScript Obfuscator (control flow + string encryption)');
    console.log('    [3] Bytenode V8 bytecode (.jsc binary)');
  }
  console.log('    [4] Rust native binary (.node — cannot be decompiled)');
  console.log('');
  console.log('  Key files:');
  const nodeSize = files.find(f => f.name.endsWith('.node'));
  const jscFiles = files.filter(f => f.name.endsWith('.jsc'));
  if (nodeSize) console.log(`    native/${nodeFile}  ${(nodeSize.size / 1024).toFixed(0)} KB  [Rust binary]`);
  for (const f of jscFiles) console.log(`    dist/${f.name.split('/').pop()}  ${(f.size / 1024).toFixed(0)} KB  [V8 bytecode]`);
  console.log('');
  console.log('  Install:');
  console.log('    1. Copy aura-for-cocos/ to Cocos project extensions/');
  console.log('    2. Create .mcp-license with: COCOS-PRO-XXXX-XXXX-XXXX');
  console.log('    3. Restart Cocos Creator');
  if (platform === 'darwin') {
    console.log('    macOS: xattr -cr extensions/aura-for-cocos/');
  }
  console.log('\x1b[32m' + '='.repeat(50) + '\x1b[0m\n');
}

main().catch(err => {
  console.error('\x1b[31mPro build failed:\x1b[0m', err.message);
  process.exit(1);
});
