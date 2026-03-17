#!/usr/bin/env node
/**
 * build-release.mjs — 发行构建脚本
 *
 * 使用 esbuild 将 TypeScript 源码打包为混淆压缩的 bundle，
 * 产物输出到 dist-release/，与研发构建 (tsc → dist/) 完全分离。
 *
 * 用法:
 *   node scripts/build-release.mjs            # 默认发行构建
 *   node scripts/build-release.mjs --no-clean # 跳过清理
 *   node scripts/build-release.mjs --analyze  # 显示 bundle 体积分析
 */
import { build } from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'dist-release');
const SRC = path.join(ROOT, 'src');

const args = process.argv.slice(2);
const noClean = args.includes('--no-clean');
const analyze = args.includes('--analyze');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function log(step, msg) {
  console.log(`\x1b[36m[${step}]\x1b[0m ${msg}`);
}

function copyFileSync(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyDirSync(src, dest, filter) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath, filter);
    } else if (!filter || filter(entry.name)) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Node.js 内建模块列表 — esbuild external
const NODE_BUILTINS = [
  'assert', 'buffer', 'child_process', 'cluster', 'crypto', 'dgram', 'dns',
  'events', 'fs', 'http', 'http2', 'https', 'net', 'os', 'path',
  'perf_hooks', 'process', 'querystring', 'readline', 'stream',
  'string_decoder', 'timers', 'tls', 'tty', 'url', 'util', 'v8',
  'vm', 'worker_threads', 'zlib',
];

// 公共 esbuild 配置
const SHARED = {
  platform: 'node',
  format: 'cjs',
  target: 'es2020',
  bundle: true,
  minify: true,
  sourcemap: false,
  treeShaking: true,
  legalComments: 'none',
  charset: 'utf8',
  // 消除研发热更代码路径
  define: {
    'process.env.COCOS_MCP_DEV': '"0"',
  },
  external: [
    ...NODE_BUILTINS,
    ...NODE_BUILTINS.map(m => `node:${m}`),
    'cc',  // Cocos Creator 引擎运行时模块
  ],
  logLevel: analyze ? 'info' : 'warning',
  metafile: analyze,
};

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const t0 = Date.now();

  // 1. 清理输出目录
  if (!noClean) {
    log('1/6', '清理 dist-release/ ...');
    fs.rmSync(OUT, { recursive: true, force: true });
  }
  fs.mkdirSync(OUT, { recursive: true });

  // 2. Bundle main.ts
  //    main.ts 通过 require(path.join(__dirname,'core.js')) 动态加载 core，
  //    esbuild 无法追踪该动态路径，会自动保留。静态依赖 (console-capture) 内联。
  log('2/6', 'Bundle main.ts → main.js');
  const mainResult = await build({
    ...SHARED,
    entryPoints: [path.join(SRC, 'main.ts')],
    outfile: path.join(OUT, 'main.js'),
  });

  // 3. Bundle core.ts (包含 mcp/* 和 zod，全部内联)
  log('3/6', 'Bundle core.ts → core.js (含 mcp/* + zod)');
  const coreResult = await build({
    ...SHARED,
    entryPoints: [path.join(SRC, 'core.ts')],
    outfile: path.join(OUT, 'core.js'),
    // zod 不加 external → 内联到 bundle
  });

  // 4. Bundle scene.ts (包含 scene-*-handlers，全部内联)
  log('4/6', 'Bundle scene.ts → scene.js (含 handlers)');
  const sceneResult = await build({
    ...SHARED,
    entryPoints: [path.join(SRC, 'scene.ts')],
    outfile: path.join(OUT, 'scene.js'),
  });

  // 5. Bundle panel (minify only，已是纯 JS 风格)
  log('5/6', 'Bundle panel index.ts → panels/default/index.js');
  await build({
    ...SHARED,
    entryPoints: [path.join(SRC, 'panels', 'default', 'index.ts')],
    outfile: path.join(OUT, 'panels', 'default', 'index.js'),
    // panel 无外部依赖，全部自包含
  });

  // Strip esbuild CJS dead export blocks
  // (These blocks cause ReferenceError when compiled with javascript-obfuscator)
  ['main.js', 'core.js', 'scene.js'].forEach(f => {
    const filePath = path.join(OUT, f);
    if (!fs.existsSync(filePath)) return;
    let code = fs.readFileSync(filePath, 'utf-8');
    // ESBuild outputs: 0 && (module.exports = { load, methods, unload });
    const cleaned = code.replace(/0\s*&&\s*\(module\.exports\s*=\s*\{[^}]*\}\);/g, '');
    if (cleaned.length !== code.length) {
      fs.writeFileSync(filePath, cleaned, 'utf-8');
    }
  });

  // 复制 i18n JS 文件
  const i18nSrc = path.join(SRC, 'panels', 'default', 'i18n');
  const i18nDest = path.join(OUT, 'panels', 'default', 'i18n');
  copyDirSync(i18nSrc, i18nDest, name => name.endsWith('.js'));

  // 6. 生成精简版 package.json
  log('6/6', '生成精简版 package.json + 复制静态文件');
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
  const releasePkg = {
    package_version: pkg.package_version,
    name: pkg.name,
    version: pkg.version,
    title: pkg.title,
    description: pkg.description,
    author: pkg.author,
    editor: pkg.editor,
    main: './dist/main.js',
    panels: pkg.panels,
    contributions: pkg.contributions,
    // 不含 scripts / dependencies / devDependencies
  };
  fs.writeFileSync(
    path.join(OUT, 'package.json'),
    JSON.stringify(releasePkg, null, 2) + '\n',
    'utf-8'
  );

  // ── 分析输出 ──
  if (analyze) {
    for (const [label, result] of [['main', mainResult], ['core', coreResult], ['scene', sceneResult]]) {
      if (result?.metafile) {
        const text = await import('esbuild').then(m => m.analyzeMetafile(result.metafile));
        console.log(`\n── ${label} bundle 分析 ──`);
        console.log(text);
      }
    }
  }

  // ── 产物统计 ──
  const files = [];
  function walk(dir, prefix = '') {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full, prefix + entry.name + '/');
      } else {
        const size = fs.statSync(full).size;
        files.push({ name: prefix + entry.name, size });
      }
    }
  }
  walk(OUT);

  const totalBytes = files.reduce((s, f) => s + f.size, 0);
  console.log('\n\x1b[32m✅ 发行构建完成\x1b[0m');
  console.log(`   输出目录: dist-release/`);
  console.log(`   文件数量: ${files.length}`);
  console.log(`   总体积:   ${(totalBytes / 1024).toFixed(1)} KB`);
  console.log('   ──────────────────────────────────');
  for (const f of files) {
    const kb = (f.size / 1024).toFixed(1).padStart(8);
    console.log(`   ${kb} KB  ${f.name}`);
  }
  console.log(`\n   耗时: ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);
}

main().catch(err => {
  console.error('\x1b[31m❌ 发行构建失败:\x1b[0m', err.message || err);
  process.exit(1);
});
