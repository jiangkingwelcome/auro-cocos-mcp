#!/usr/bin/env node
/**
 * build-native.mjs — Build the Rust native Pro module
 *
 * Prerequisites: Rust toolchain (rustup, cargo)
 *   Install: https://rustup.rs/
 *
 * Usage:
 *   node scripts/build-native.mjs           # Debug build
 *   node scripts/build-native.mjs --release # Release build (optimized + stripped)
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const NATIVE_DIR = path.join(ROOT, 'native');

const args = process.argv.slice(2);
const release = args.includes('--release');

function log(step, msg) {
  console.log(`\x1b[33m[${step}]\x1b[0m ${msg}`);
}

function run(cmd, cwd) {
  console.log(`  $ ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

async function main() {
  const t0 = Date.now();

  console.log('\n\x1b[33m╔══════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[33m║   Aura — Native Build        ║\x1b[0m');
  console.log('\x1b[33m╚══════════════════════════════════════════╝\x1b[0m\n');

  // Check Rust toolchain
  try {
    execSync('rustc --version', { stdio: 'pipe' });
  } catch {
    console.error('\x1b[31m❌ Rust toolchain not found.\x1b[0m');
    console.error('   Install from: https://rustup.rs/');
    console.error('   Then run: rustup default stable');
    process.exit(1);
  }

  log('1/3', `Cargo build (${release ? 'release' : 'debug'})...`);
  run(`cargo build ${release ? '--release' : ''}`, NATIVE_DIR);

  log('2/3', 'Copy .node binary...');
  const profile = release ? 'release' : 'debug';
  const platform = os.platform();
  const arch = os.arch();

  const libName = platform === 'win32' ? 'cocos_mcp_pro.dll'
    : platform === 'darwin' ? 'libcocos_mcp_pro.dylib'
    : 'libcocos_mcp_pro.so';

  const srcBinary = path.join(NATIVE_DIR, 'target', profile, libName);

  const PLATFORM_MAP = {
    'win32-x64': 'cocos_pro.win32-x64-msvc.node',
    'darwin-x64': 'cocos_pro.darwin-x64.node',
    'darwin-arm64': 'cocos_pro.darwin-arm64.node',
    'linux-x64': 'cocos_pro.linux-x64-gnu.node',
  };

  const destName = PLATFORM_MAP[`${platform}-${arch}`];
  if (!destName) {
    console.error(`\x1b[31m❌ Unsupported platform: ${platform}-${arch}\x1b[0m`);
    process.exit(1);
  }

  const destBinary = path.join(NATIVE_DIR, destName);
  fs.copyFileSync(srcBinary, destBinary);

  const sizeKB = (fs.statSync(destBinary).size / 1024).toFixed(1);
  log('3/3', `Done: ${destName} (${sizeKB} KB)`);

  console.log(`\n\x1b[32m✅ Native build complete\x1b[0m`);
  console.log(`   Mode: ${release ? 'release' : 'debug'}`);
  console.log(`   Output: native/${destName}`);
  console.log(`   Time: ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);
}

main().catch(err => {
  console.error('\x1b[31m❌ Native build failed:\x1b[0m', err.message);
  process.exit(1);
});
