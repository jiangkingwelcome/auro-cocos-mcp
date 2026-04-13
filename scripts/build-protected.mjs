#!/usr/bin/env node
/**
 * build-protected.mjs — 加固构建脚本
 *
 * 在 build-release.mjs 产物基础上，依次执行：
 *   Layer 1: javascript-obfuscator 混淆（控制流扁平化 + 字符串加密 + 死代码注入）
 *   Layer 2: bytenode V8 字节码编译（核心文件编译为 .jsc）
 *
 * 用法:
 *   node scripts/build-protected.mjs                 # 默认：obfuscator + bytenode
 *   node scripts/build-protected.mjs --obfuscate-only # 仅混淆，跳过字节码
 *   node scripts/build-protected.mjs --skip-shim      # 跳过 stdio-shim 混淆
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JavaScriptObfuscator from 'javascript-obfuscator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DIST_RELEASE = path.join(ROOT, 'dist-release');
const STDIO_SHIM = path.join(ROOT, 'stdio-shim');

const args = process.argv.slice(2);
const obfuscateOnly = args.includes('--obfuscate-only');
const skipShim = args.includes('--skip-shim');

function log(step, msg) {
  console.log(`\x1b[35m[${step}]\x1b[0m ${msg}`);
}

function fileSize(filePath) {
  return (fs.statSync(filePath).size / 1024).toFixed(1);
}

// ─── Obfuscator Configs ─────────────────────────────────────────────────────

const CORE_OBFUSCATOR_OPTIONS = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.5,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.2,
  stringArray: true,
  stringArrayEncoding: ['rc4'],
  stringArrayThreshold: 0.6,
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 1,
  stringArrayWrappersType: 'variable',
  splitStrings: true,
  splitStringsChunkLength: 8,
  transformObjectKeys: true,
  unicodeEscapeSequence: false,
  renameGlobals: false,
  selfDefending: false,
  debugProtection: false,
  disableConsoleOutput: false,
  target: 'node',
  seed: 0,
  reservedNames: [
    '^load$', '^unload$', '^methods$',
    '^exports$', '^module$', '^require$', '^__dirname$', '^__filename$',
    '^startServer$', '^stopServer$', '^restartServer$', '^openPanel$',
    '^getServiceInfo$', '^configureIDE$', '^configureCursor$',
    '^getSettings$', '^updateSettings$', '^setToolEnabled$',
    '^resetSettings$', '^getLicenseStatus$', '^activateLicense$',
    '^onSceneReady$',
  ],
  reservedStrings: [
    '^load$', '^unload$', '^methods$',
  ],
};

const _PANEL_OBFUSCATOR_OPTIONS = {
  compact: true,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.4,
  splitStrings: false,
  transformObjectKeys: false,
  unicodeEscapeSequence: false,
  renameGlobals: false,
  selfDefending: false,
  debugProtection: false,
  disableConsoleOutput: false,
  target: 'node',
  seed: 0,
};

const SHIM_OBFUSCATOR_OPTIONS = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.3,
  deadCodeInjection: false,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.5,
  splitStrings: false,
  transformObjectKeys: true,
  unicodeEscapeSequence: false,
  renameGlobals: false,
  selfDefending: false,
  debugProtection: false,
  disableConsoleOutput: false,
  target: 'node',
  seed: 0,
};

// ─── Layer 1: Obfuscation ───────────────────────────────────────────────────

function obfuscateFile(filePath, options, label) {
  const originalSize = fileSize(filePath);
  const code = fs.readFileSync(filePath, 'utf-8');
  const result = JavaScriptObfuscator.obfuscate(code, options);
  fs.writeFileSync(filePath, result.getObfuscatedCode(), 'utf-8');
  const newSize = fileSize(filePath);
  log('obfuscate', `${label}: ${originalSize} KB → ${newSize} KB`);
}

const ENTRY_OBFUSCATOR_OPTIONS = {
  compact: true,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  stringArray: false,
  transformObjectKeys: false,
  unicodeEscapeSequence: false,
  renameGlobals: false,
  selfDefending: false,
  debugProtection: false,
  disableConsoleOutput: false,
  target: 'node',
  seed: 0,
};

function runObfuscation() {
  log('Layer 1', '=== JavaScript Obfuscator 混淆 ===');

  const coreFiles = [
    { rel: 'main.js', label: 'main.js', options: ENTRY_OBFUSCATOR_OPTIONS },
    { rel: 'core.js', label: 'core.js', options: CORE_OBFUSCATOR_OPTIONS },
    { rel: 'scene.js', label: 'scene.js', options: CORE_OBFUSCATOR_OPTIONS },
  ];
  for (const { rel, label, options } of coreFiles) {
    const filePath = path.join(DIST_RELEASE, rel);
    if (!fs.existsSync(filePath)) {
      console.warn(`  ⚠ ${label} not found, skipping`);
      continue;
    }
    obfuscateFile(filePath, options, label);
  }

  // Panel UI: skip obfuscation — Editor.Panel.define() structure must be preserved
  // for Cocos Creator's panel loader. esbuild minify is sufficient protection.
  log('skip', 'panels/default/index.js — panel UI (esbuild minify only)');

  if (!skipShim) {
    const shimOutDir = path.join(DIST_RELEASE, 'stdio-shim');
    fs.mkdirSync(shimOutDir, { recursive: true });
    const shimFiles = ['mcp-stdio-shim.cjs', 'shim-logic.cjs'];
    for (const name of shimFiles) {
      const srcPath = path.join(STDIO_SHIM, name);
      const destPath = path.join(shimOutDir, name);
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        obfuscateFile(destPath, SHIM_OBFUSCATOR_OPTIONS, `stdio-shim/${name}`);
      }
    }
    // Copy non-JS shim files as-is
    for (const name of ['run-stdio-shim.sh', 'run-stdio-shim.cmd']) {
      const srcPath = path.join(STDIO_SHIM, name);
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, path.join(shimOutDir, name));
      }
    }
  }
}

// ─── Layer 2: Bytenode V8 Bytecode ──────────────────────────────────────────

/**
 * Inline bytenode runtime: registers .jsc extension handler on require().
 * This avoids needing bytenode in node_modules at runtime.
 */
function generateBytenodeRuntime() {
  return `'use strict';
var vm=require('vm'),fs=require('fs'),path=require('path'),Module=require('module'),
v8=require('v8'),zlib=require('zlib');
v8.setFlagsFromString('--no-lazy');
if(+process.versions.node.split('.')[0]>=12)v8.setFlagsFromString('--no-flush-bytecode');
var MAGIC=Buffer.from([0xde,0xc0]),ZERO=Buffer.alloc(2);
function isBuf(o){return o!=null&&o.constructor!=null&&typeof o.constructor.isBuffer==='function'&&o.constructor.isBuffer(o)}
function isV8(b){return isBuf(b)&&!b.subarray(0,2).equals(ZERO)&&b.subarray(2,4).equals(MAGIC)}
function compileCode(c){var s=new vm.Script(c,{produceCachedData:true});return s.createCachedData?s.createCachedData():s.cachedData}
function fixBC(b){var d=compileCode('"\\u0CA0_\\u0CA0"'),v=parseFloat(process.version.slice(1,5));if(v>=12&&v<=25){d.subarray(12,16).copy(b,12)}else{d.subarray(12,16).copy(b,12);d.subarray(16,20).copy(b,16)}}
function readSH(b){return b.subarray(8,12).reduce(function(s,n,p){return s+n*Math.pow(256,p)},0)}
function genScript(cd,fn){if(!isV8(cd)){cd=zlib.brotliDecompressSync(cd);if(!isV8(cd))throw new Error('Invalid bytecode')}fixBC(cd);var l=readSH(cd),dc='';if(l>1)dc='"'+'\\u200b'.repeat(l-2)+'"';var s=new vm.Script(dc,{cachedData:cd,filename:fn});if(s.cachedDataRejected)throw new Error('Bytecode rejected (version mismatch?)');return s}
Module._extensions['.jsc']=function(m,fn){var cd=fs.readFileSync(fn),s=genScript(cd,fn);function req(id){return m.require(id)}req.resolve=function(r,o){return Module._resolveFilename(r,m,false,o)};if(process.main)req.main=process.main;req.extensions=Module._extensions;req.cache=Module._cache;var w=s.runInThisContext({filename:fn,lineOffset:0,columnOffset:0,displayErrors:true});return w.apply(m.exports,[m.exports,req,m,fn,path.dirname(fn),process,global])};
`;
}

async function compileToBytenode(jsFilePath, label) {
  const bytenode = (await import('bytenode')).default || await import('bytenode');

  const jscPath = jsFilePath.replace(/\.js$/, '.jsc');
  const originalSize = fileSize(jsFilePath);

  await bytenode.compileFile({
    filename: jsFilePath,
    compileAsModule: true,
    compress: false,
    output: jscPath,
    createLoader: false,
  });

  const jscSize = fileSize(jscPath);
  const basename = path.basename(jsFilePath, '.js');

  const loaderCode = `${generateBytenodeRuntime()}
module.exports=require('./${basename}.jsc');
`;
  fs.writeFileSync(jsFilePath, loaderCode, 'utf-8');
  const loaderSize = fileSize(jsFilePath);

  log('bytenode', `${label}: ${originalSize} KB → .jsc ${jscSize} KB + loader ${loaderSize} KB`);
}

async function runBytenode() {
  log('Layer 2', '=== Bytenode V8 字节码编译 ===');

  const targets = [
    { rel: 'main.js', label: 'main.js' },
    { rel: 'core.js', label: 'core.js' },
    { rel: 'scene.js', label: 'scene.js' },
  ];

  for (const { rel, label } of targets) {
    const filePath = path.join(DIST_RELEASE, rel);
    if (!fs.existsSync(filePath)) {
      console.warn(`  ⚠ ${label} not found, skipping bytenode`);
      continue;
    }
    await compileToBytenode(filePath, label);
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const t0 = Date.now();

  if (!fs.existsSync(DIST_RELEASE)) {
    console.error('\x1b[31m❌ dist-release/ not found. Run build-release.mjs first.\x1b[0m');
    process.exit(1);
  }

  console.log('\n\x1b[35m╔══════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[35m║   Aura — Protected Build     ║\x1b[0m');
  console.log('\x1b[35m╚══════════════════════════════════════════╝\x1b[0m\n');

  runObfuscation();

  if (!obfuscateOnly) {
    console.log('');
    await runBytenode();
  } else {
    log('skip', 'Bytenode 跳过（--obfuscate-only）');
  }

  // Summary
  console.log('\n\x1b[32m✅ 加固构建完成\x1b[0m');
  console.log(`   模式: ${obfuscateOnly ? 'obfuscate-only' : 'obfuscate + bytenode'}`);
  console.log(`   耗时: ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  const files = [];
  function walk(dir, prefix = '') {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full, prefix + entry.name + '/');
      else files.push({ name: prefix + entry.name, size: fs.statSync(full).size });
    }
  }
  walk(DIST_RELEASE);
  console.log('   ──────────────────────────────────');
  for (const f of files) {
    const kb = (f.size / 1024).toFixed(1).padStart(8);
    const tag = f.name.endsWith('.jsc') ? ' [bytecode]' : '';
    console.log(`   ${kb} KB  ${f.name}${tag}`);
  }
  console.log('');
}

main().catch(err => {
  console.error('\x1b[31m❌ 加固构建失败:\x1b[0m', err.message || err);
  console.error(err.stack);
  process.exit(1);
});
