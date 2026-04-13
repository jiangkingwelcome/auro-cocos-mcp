#!/usr/bin/env node
/**
 * 模拟「纯 JS 热补丁」的文件合并步骤（与 updater 线上逻辑一致），不下载、不重载编辑器。
 *
 * 用法:
 *   node scripts/simulate-js-hotpatch.cjs              # 默认：临时目录自测，打印 OK
 *   node scripts/simulate-js-hotpatch.cjs --help
 *
 * 编译: 需先执行 npx tsc（生成 dist/updater.js）。
 *
 * 在已安装插件目录验证（慎用，会改磁盘上的插件文件）:
 *   node scripts/simulate-js-hotpatch.cjs --plugin-root "C:/path/to/aura-for-cocos" --file dist/console-capture.js
 * 然后于 Cocos 扩展面板重载插件或点击面板「热更重启」，使 Node 重新加载新 JS。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.join(__dirname, '..');

function usage() {
  console.log(`simulate-js-hotpatch.cjs — 本地验证热补丁文件合并

  node scripts/simulate-js-hotpatch.cjs
      在临时目录创建 dist/smoke-hotpatch.js，合并后校验内容已更新。

  node scripts/simulate-js-hotpatch.cjs --plugin-root <dir> --file <相对路径>
      将插件内指定文件追加一行标记，写入临时补丁目录再合并回插件根（与线上一致）。
      合并后请在编辑器中重载扩展使进程加载新代码。
`);
}

function loadMerge() {
  const updaterPath = path.join(ROOT, 'dist', 'updater.js');
  if (!fs.existsSync(updaterPath)) {
    console.error('缺少 dist/updater.js，请先运行: npx tsc');
    process.exit(1);
  }
  return require(updaterPath).applyLocalHotpatchMerge;
}

function runSelfTest() {
  const applyLocalHotpatchMerge = loadMerge();
  const plugin = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-hotpatch-plugin-'));
  const ext = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-hotpatch-ext-'));
  try {
    const rel = path.join('dist', 'smoke-hotpatch.js');
    const orig = path.join(plugin, rel);
    const neu = path.join(ext, rel);
    fs.mkdirSync(path.dirname(orig), { recursive: true });
    fs.mkdirSync(path.dirname(neu), { recursive: true });
    fs.writeFileSync(orig, '// before\nmodule.exports = 1;\n', 'utf8');
    fs.writeFileSync(neu, '// after HOTPATCH_SELFTEST_OK\nmodule.exports = 2;\n', 'utf8');

    const modified = applyLocalHotpatchMerge(ext, plugin);
    const body = fs.readFileSync(orig, 'utf8');
    if (!body.includes('HOTPATCH_SELFTEST_OK')) {
      console.error('FAIL: 合并后文件内容未更新');
      process.exit(1);
    }
    const hit = modified.some((p) => p.replace(/\\/g, '/').endsWith(rel.replace(/\\/g, '/')));
    if (!hit) {
      console.error('FAIL: modified 列表未包含目标文件', modified);
      process.exit(1);
    }
    console.log('✓ 单文件 JS 热更合并自测通过（临时目录）');
    console.log('  修改文件:', modified.join(', '));
  } finally {
    try {
      fs.rmSync(plugin, { recursive: true, force: true });
    } catch (_) {}
    try {
      fs.rmSync(ext, { recursive: true, force: true });
    } catch (_) {}
  }
}

function runPluginPatch(pluginRoot, relFile) {
  const applyLocalHotpatchMerge = loadMerge();
  const absTarget = path.join(pluginRoot, relFile);
  if (!fs.existsSync(absTarget)) {
    console.error('目标文件不存在:', absTarget);
    process.exit(1);
  }
  const ext = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-hotpatch-live-ext-'));
  try {
    const srcInPatch = path.join(ext, relFile);
    fs.mkdirSync(path.dirname(srcInPatch), { recursive: true });
    const stamp = `// aura-hotpatch-local ${new Date().toISOString()}\n`;
    fs.writeFileSync(srcInPatch, fs.readFileSync(absTarget, 'utf8') + stamp, 'utf8');
    const modified = applyLocalHotpatchMerge(ext, pluginRoot);
    console.log('✓ 已合并补丁到插件目录');
    console.log('  变更:', modified.join(', '));
    console.log('  请在 Cocos 中重载本扩展（扩展管理器或面板「热更重启」）后生效。');
  } finally {
    try {
      fs.rmSync(ext, { recursive: true, force: true });
    } catch (_) {}
  }
}

const argv = process.argv.slice(2);
if (argv.includes('--help') || argv.includes('-h')) {
  usage();
  process.exit(0);
}

const prIdx = argv.indexOf('--plugin-root');
const frIdx = argv.indexOf('--file');
if (prIdx !== -1 && frIdx !== -1) {
  const pluginRoot = argv[prIdx + 1];
  const file = argv[frIdx + 1];
  if (!pluginRoot || !file) {
    usage();
    process.exit(1);
  }
  runPluginPatch(path.resolve(pluginRoot), file.replace(/\\/g, '/'));
} else {
  runSelfTest();
}
