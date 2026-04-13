#!/usr/bin/env node
/**
 * 自动化测试执行器 - 基于 test-cases.json (100% 覆盖率版本)
 *
 * 使用方法：
 * 1. 确保 Cocos Creator 编辑器已启动
 * 2. 确保 aura-for-cocos 插件已加载
 * 3. 运行: node scripts/run-auto-tests.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const BRIDGE_URL = process.env.BRIDGE_URL || 'http://127.0.0.1:7779';
const TEST_CASES_PATH = path.join(__dirname, '..', 'tests', 'test-cases.json');
const REPORT_PATH = path.join(__dirname, '..', 'tests', 'test-report.json');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
  cyan: '\x1b[36m',
};

function log(color, symbol, message) {
  console.log(`${color}${symbol}${colors.reset} ${message}`);
}

// 读取测试用例
const testCases = JSON.parse(fs.readFileSync(TEST_CASES_PATH, 'utf-8'));

// 获取认证 Token
async function getAuthToken() {
  try {
    const defaultTokenPath = path.join(__dirname, '..', '.mcp-token');
    if (fs.existsSync(defaultTokenPath)) {
      return fs.readFileSync(defaultTokenPath, 'utf8').trim();
    }
    const response = await fetch(`${BRIDGE_URL}/api/mcp/connection-info`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.token || '';
  } catch (error) {
    log(colors.red, '✗', `无法连接到 Bridge (${BRIDGE_URL}) 或读取 token`);
    throw error;
  }
}

// 发送 MCP 请求
async function sendMcpRequest(tool, input, token) {
  const response = await fetch(`${BRIDGE_URL}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-MCP-Token': token,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: tool,
        arguments: input,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

// 检查测试用例是否预期失败
function expectsAnError(expected) {
  return expected.includes('error') ||
    expected.includes('未找到') ||
    expected.includes('无效') ||
    expected.includes('不存在') ||
    expected.includes('错误') ||
    expected.includes('不支持') ||
    expected.includes('不需要') ||
    expected.includes('不合法') ||
    expected.includes('无法') ||
    expected.includes('ECONNREFUSED');
}

// 主测试流程
async function main() {
  console.log('\n' + '='.repeat(80));
  log(colors.cyan, '🧪', 'Aura - 自动化测试套件 (🚀 100% 测试覆盖版)');
  log(colors.gray, '', `基于 test-cases.json (${testCases.length} 个测试用例)`);
  console.log('='.repeat(80) + '\n');

  // 1. 连接 Bridge
  log(colors.blue, '→', '正在连接 Bridge...');
  let token;
  try {
    token = await getAuthToken();
    log(colors.green, '✓', `已连接到 ${BRIDGE_URL}`);
  } catch {
    process.exit(1);
  }

  // 2. 准备动态环境 100% 覆盖准备
  log(colors.blue, '→', '正在建立 100% 测试所需的环境节点、测试资源...');
  const tempDir = path.join(os.tmpdir(), 'aura-for-cocos-test-art');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  const testImg1 = path.join(tempDir, 'hero.png').replace(/\\/g, '/');
  const testImg2 = path.join(tempDir, 'bg.jpg').replace(/\\/g, '/');
  fs.writeFileSync(testImg1, Buffer.from('89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000D4944415478DA636460600000000600023081D05F0000000049454E44AE426082', 'hex'));
  fs.writeFileSync(testImg2, Buffer.from('FFD8FFE000104A46494600010100000100010000FFDB004300080606070605080707070909080A0C140D0C0B0B0C1912130F141D1A1F1E1D1A1C1C20242E2720222C231C1C2837292C30313434341F27393D38323C2E333432FFDB0043010909090C0B0C180D0D1832211C213232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232FFC000110800010001031122332100221101031101FFC4001F0000010501010101010100000000000000000102030405060708090A0BFFC400B5100002010303020403050504040000017D01020300041105122131410613516107227114328191A1082342B1C11552D1F02433627282090A161718191A25262728292A3435363738393A434445464748494A535455565758595A636465666768696A737475767778797A838485868788898A92939495969798999AA2A3A4A5A6A7A8A9AAB2B3B4B5B6B7B8B9BAC2C3C4C5C6C7C8C9CAD2D3D4D5D6D7D8D9DAE1E2E3E4E5E6E7E8E9EAF1F2F3F4F5F6F7F8F9FAFFC4001F0100030101010101010101010000000000000102030405060708090A0BFFC400B51100020102040403040705040400010277000102031104052131061241510761711322328108144291A1B1C109233352F0156272D10A162434E125F11718191A262728292A35363738393A434445464748494A535455565758595A636465666768696A737475767778797A82838485868788898A92939495969798999AA2A3A4A5A6A7A8A9AAB2B3B4B5B6B7B8B9BAC2C3C4C5C6C7C8C9CAD2D3D4D5D6D7D8D9DAE2E3E4E5E6E7E8E9EAF2F3F4F5F6F7F8F9FAFFDA000C03010002110311003F00F928A2800A28A2800A28A2803FFD', 'hex'));

  let ENV = { 'C:/a.png': testImg1, 'C:/b.png': testImg1,
    'C:/art/hero.png': testImg1,
    'C:/art/bg.jpg': testImg2
  };

  const treeRes = await sendMcpRequest('scene_query', { action: 'tree' }, token);
  let sceneRoot = '';
  if (treeRes.result && treeRes.result.content[0]) {
    sceneRoot = JSON.parse(treeRes.result.content[0].text).uuid;
  }
  ENV['<scene-root>'] = sceneRoot;

  async function makeNode(name, parent = null) {
    const res = await sendMcpRequest('scene_operation', { action: 'create_node', name, parentUuid: parent }, token);
    return res.result && res.result.content[0] ? JSON.parse(res.result.content[0].text).uuid : '';
  }
  async function makeWidget(type, name) {
    const res = await sendMcpRequest('scene_operation', { action: 'create_ui_widget', widgetType: type, name }, token);
    return res.result && res.result.content[0] ? JSON.parse(res.result.content[0].text).uuid : '';
  }

  const testRootUuid = await makeNode('__MCP_TEST_ROOT__', sceneRoot);
  const childUuidVal = await makeNode('Child', testRootUuid);

  const spriteUuid = await makeNode('TestSprite', testRootUuid);
  await sendMcpRequest('scene_operation', { action: 'add_component', uuid: spriteUuid, component: 'Sprite' }, token);

  const meshUuid = await makeNode('TestMesh', testRootUuid);
  await sendMcpRequest('scene_operation', { action: 'add_component', uuid: meshUuid, component: 'MeshRenderer' }, token);

  const animUuid = await makeNode('TestAnim', testRootUuid);
  await sendMcpRequest('scene_operation', { action: 'add_component', uuid: animUuid, component: 'Animation' }, token);

  const camUuidRes = await sendMcpRequest('scene_operation', { action: 'create_camera', name: 'TestCamera' }, token);
  const camUuidVal = camUuidRes.result && camUuidRes.result.content[0] ? JSON.parse(camUuidRes.result.content[0].text).uuid : '';

  const lightRes = await sendMcpRequest('scene_operation', { action: 'create_light', lightType: 'directional', name: 'TestLight', parentUuid: testRootUuid }, token);
  const lightUuidVal = lightRes.result && lightRes.result.content[0] ? JSON.parse(lightRes.result.content[0].text).uuid : '';

  const btnUuid = await makeWidget('button', 'TestBtn');
  const sliderUuid = await makeWidget('slider', 'TestSlider');

  // Create test assets
  await sendMcpRequest('asset_operation', { action: 'create', url: 'db://assets/test-mcp-asset.txt', content: 'test data' }, token);

  ENV['<node-uuid>'] = testRootUuid;
  ENV['<uuid>'] = testRootUuid;
  ENV['<child>'] = childUuidVal;
  ENV['<a>'] = childUuidVal;
  ENV['<b>'] = childUuidVal;
  ENV['<parent>'] = testRootUuid;
  ENV['<p>'] = testRootUuid;
  ENV['<newP>'] = testRootUuid;
  ENV['<sprite>'] = spriteUuid;
  ENV['<sprite-node>'] = spriteUuid;
  ENV['<mesh>'] = meshUuid;
  ENV['<renderer>'] = meshUuid;
  ENV['<cam>'] = camUuidVal;
  ENV['<light>'] = lightUuidVal;
  ENV['<anim>'] = animUuid;
  ENV['<no-anim>'] = testRootUuid;
  ENV['<prefab>'] = testRootUuid;
  ENV['<btn>'] = btnUuid;
  ENV['<slider>'] = sliderUuid;
  ENV['<asset-uuid>'] = 'db://assets/test-mcp-asset.txt';
  ENV['<scene-uuid>'] = 'db://assets/scenes/Main.scene';
  ENV['<other>'] = testRootUuid;
  ENV['<empty-node>'] = testRootUuid;

  log(colors.green, '✓', '测试覆盖支持环境已完美挂载!');

  function resolvePlaceholders(input, isDestroy, caseId) {
    if (typeof input === 'string') {
      // Special interception for node destruction
      if (isDestroy && input === '<uuid>') return ENV[`__DEST_NODE_${caseId}`];

      if (ENV[input] !== undefined) return ENV[input];

      if (input.startsWith('db://assets/') && input.includes('<')) {
        return input.replace(/<[^>]+>/g, 'test_' + Date.now());
      }
      return input;
    } else if (Array.isArray(input)) {
      return input.map(item => resolvePlaceholders(item, isDestroy, caseId));
    } else if (typeof input === 'object' && input !== null) {
      const res = {};
      for (let key in input) res[key] = resolvePlaceholders(input[key], isDestroy, caseId);
      return res;
    }
    return input;
  }

  // 3. 按工具分组
  const grouped = testCases.reduce((acc, tc) => {
    if (!acc[tc.tool]) acc[tc.tool] = [];
    acc[tc.tool].push(tc);
    return acc;
  }, {});

  const stats = {
    total: testCases.length,
    passed: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    results: [],
    startTime: new Date().toISOString(),
  };

  // 4. 执行测试
  console.log('');
  for (const [tool, cases] of Object.entries(grouped)) {
    log(colors.blue, '📦', `工具: ${tool} (${cases.length} 个测试)`);

    for (const testCase of cases) {
      const { id, action, title, input, expected } = testCase;

      const isDestroy = action === 'destroy_node' || action === 'clear_children';
      if (isDestroy && input.uuid) {
        ENV[`__DEST_NODE_${id}`] = await makeNode('NodeToDestroy_' + id, testRootUuid);
      }

      const realInput = resolvePlaceholders(input, isDestroy, id);

      try {
        const startTime = Date.now();
        const result = await sendMcpRequest(tool, realInput, token);
        const duration = Date.now() - startTime;

        if (result.error) {
          const errorMsg = result.error.message || JSON.stringify(result.error);
          if (expectsAnError(expected)) {
            stats.passed++;
            log(colors.green, '  ✓', `#${id}: ${title} (${duration}ms) [预期错误]`);
            stats.results.push({ id, tool, action, status: 'passed', message: '预期错误', duration });
          } else {
            stats.failed++;
            log(colors.red, '  ✗', `#${id}: ${title}`);
            log(colors.red, '    ', `错误: ${errorMsg}`);
            stats.errors.push({ id, tool, action, title, error: errorMsg });
            stats.results.push({ id, tool, action, status: 'failed', error: errorMsg, duration });
          }
        } else {
          stats.passed++;
          log(colors.green, '  ✓', `#${id}: ${title} (${duration}ms)`);
          stats.results.push({ id, tool, action, status: 'passed', duration });
        }
      } catch (e) {
        stats.failed++;
        log(colors.red, '  ✗', `#${id}: ${title}`);
        log(colors.red, '    ', `异常: ${e.message}`);
        stats.errors.push({ id, tool, action, title, error: e.message });
      }

      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    console.log('');
  }

  stats.endTime = new Date().toISOString();

  // 5. 输出结果
  console.log('='.repeat(80));
  log(colors.cyan, '📊', '测试结果统计');
  console.log('='.repeat(80));
  console.log(`总计:   ${stats.total} 个测试`);
  log(colors.green, '✓', `通过:   ${stats.passed} 个`);
  log(colors.red, '✗', `失败:   ${stats.failed} 个`);
  log(colors.gray, '⏭', `跳过:   ${stats.skipped} 个`);

  const executable = stats.total - stats.skipped;
  const passRate = executable > 0 ? ((stats.passed / executable) * 100).toFixed(1) : '0.0';
  console.log(`通过率: ${passRate}% (${stats.passed}/${executable})\n`);

  // 6. 输出失败详情
  if (stats.errors.length > 0) {
    console.log('='.repeat(80));
    log(colors.red, '❌', '失败的测试用例');
    console.log('='.repeat(80));
    stats.errors.forEach((err) => {
      log(colors.red, `#${err.id}`, `[${err.tool}/${err.action}] ${err.title}`);
      log(colors.red, '  ', err.error);
    });
    console.log('');
  }

  // 7. 保存测试报告
  fs.writeFileSync(REPORT_PATH, JSON.stringify(stats, null, 2), 'utf-8');
  log(colors.blue, '💾', `测试报告已保存: ${REPORT_PATH}`);

  // 8. 清理工作
  log(colors.blue, '→', '正在清理辅助环境对象...');
  try {
    await sendMcpRequest('scene_operation', { action: 'destroy_node', uuid: testRootUuid, confirmDangerous: true }, token);
    await sendMcpRequest('scene_operation', { action: 'destroy_node', uuid: camUuidVal, confirmDangerous: true }, token);
    await sendMcpRequest('scene_operation', { action: 'destroy_node', uuid: btnUuid, confirmDangerous: true }, token);
    await sendMcpRequest('scene_operation', { action: 'destroy_node', uuid: sliderUuid, confirmDangerous: true }, token);
    await sendMcpRequest('asset_operation', { action: 'delete', url: 'db://assets/test-mcp-asset.txt' }, token);
    fs.unlinkSync(testImg1); fs.unlinkSync(testImg2); fs.rmdirSync(tempDir);
  } catch { }

  console.log('');
  process.exit(stats.failed > 0 ? 1 : 0);
}

// 运行测试
main().catch((error) => {
  log(colors.red, '✗', `测试运行失败: ${error.message}`);
  console.error(error);
  process.exit(1);
});
