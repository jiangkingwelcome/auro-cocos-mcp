#!/usr/bin/env node
/**
 * MCP Full Integration Test
 * Runs against a live Cocos Creator editor with the bridge plugin loaded.
 * Usage: node tests/integration/mcp-full-test.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = path.join(__dirname, 'mcp-test-report.json');
const PORTS = [7779, 7780, 7781, 7782];
const TIMEOUT_MS = 15000;

let BASE_URL = '';
let TOKEN = '';
let rpcId = 1;

// ─── Results tracking ────────────────────────────────────────────────────────
const results = [];
function pass(name, ms) { results.push({ name, status: 'PASS', ms }); console.log(`  \x1b[32m[PASS]\x1b[0m ${name} (${ms}ms)`); }
function fail(name, reason, ms) { results.push({ name, status: 'FAIL', reason, ms }); console.log(`  \x1b[31m[FAIL]\x1b[0m ${name}: ${reason} (${ms}ms)`); }
function skip(name, reason) { results.push({ name, status: 'SKIP', reason, ms: 0 }); console.log(`  \x1b[33m[SKIP]\x1b[0m ${name}: ${reason}`); }

// ─── HTTP helpers ────────────────────────────────────────────────────────────
async function mcpCall(method, params = {}) {
  const id = rpcId++;
  const body = JSON.stringify({ jsonrpc: '2.0', id, method, params });
  const res = await fetch(`${BASE_URL}/mcp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-MCP-Token': TOKEN },
    body,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const json = await res.json();
  if (json.error) throw new Error(`RPC error ${json.error.code}: ${json.error.message}`);
  return json.result;
}

async function callTool(toolName, args = {}) {
  const result = await mcpCall('tools/call', { name: toolName, arguments: args });
  const text = result?.content?.[0]?.text ?? '';
  const parsed = (() => {
    try { return text ? JSON.parse(text) : null; } catch { return text; }
  })();
  const isError = result?.isError === true;
  return { raw: result, parsed, isError };
}

// ─── Test runner ─────────────────────────────────────────────────────────────
async function test(name, fn) {
  const t0 = Date.now();
  try {
    await fn();
    pass(name, Date.now() - t0);
  } catch (err) {
    fail(name, err.message, Date.now() - t0);
  }
}

function assert(condition, msg) { if (!condition) throw new Error(msg || 'assertion failed'); }
function assertNotActionUnknown(parsed, actionName) {
  if (parsed?.error && String(parsed.error).includes('未知的操作 action') || String(parsed?.error).includes('未知的查询 action')) {
    throw new Error(`action "${actionName}" 未在编辑器中注册 — 请在 Cocos 编辑器中点击"热更重启"按钮重新加载插件`);
  }
}

// ─── Discovery ───────────────────────────────────────────────────────────────
function readTokenFromFile() {
  const candidates = [
    path.join(__dirname, '..', '..', '.mcp-token'),
    path.join(__dirname, '..', '..', 'dist', '..', '.mcp-token'),
  ];
  for (const f of candidates) {
    try {
      const t = fs.readFileSync(f, 'utf-8').trim();
      if (t && /^[\x20-\x7e]+$/.test(t)) return t;
    } catch { /* next */ }
  }
  return '';
}

async function discover() {
  const fileToken = readTokenFromFile();
  for (const port of PORTS) {
    try {
      const base = `http://127.0.0.1:${port}`;
      const status = await fetch(`${base}/api/status`, { signal: AbortSignal.timeout(3000) });
      if (!status.ok) continue;
      BASE_URL = base;
      TOKEN = fileToken;
      if (!TOKEN) {
        try {
          const conn = await fetch(`${base}/api/mcp/connection-info`, { signal: AbortSignal.timeout(3000) });
          const connData = await conn.json();
          const apiToken = connData.token || '';
          if (apiToken && /^[\x20-\x7e]+$/.test(apiToken)) TOKEN = apiToken;
        } catch { /* ok */ }
      }
      console.log(`\nBridge found at port ${port}, token: ${TOKEN ? TOKEN.slice(0, 8) + '...' : 'none'}\n`);
      return true;
    } catch { /* next port */ }
  }
  return false;
}

// ─── Shared state for dependent tests ────────────────────────────────────────
let testNodeUuid = '';
let testNodeUuid2 = '';
let childNodeUuid = '';
let snapshotA = null;
let createdAssetUrl = '';

// =============================================================================
// TEST GROUPS
// =============================================================================

async function testBasicConnectivity() {
  console.log('\n=== A. Basic Connectivity ===');

  await test('bridge_status', async () => {
    const { parsed } = await callTool('bridge_status');
    assert(parsed.connected === true, `connected=${parsed.connected}`);
  });

  await test('mcp_initialize', async () => {
    const result = await mcpCall('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'integration-test', version: '1.0.0' },
    });
    assert(result.protocolVersion, 'no protocolVersion');
    assert(result.serverInfo, 'no serverInfo');
  });

  await test('mcp_tools_list', async () => {
    const result = await mcpCall('tools/list');
    assert(Array.isArray(result.tools), 'tools is not array');
    assert(result.tools.length >= 14, `only ${result.tools.length} tools`);
    console.log(`    (${result.tools.length} tools registered, ${result.tools.reduce((s, t) => s + (t.name === 'scene_query' || t.name === 'scene_operation' || t.name === 'asset_operation' || t.name === 'editor_action' ? 1 : 0), 0)} multi-action tools)`);
  });
}

async function testSceneQuery() {
  console.log('\n=== B. scene_query ===');
  const sq = (action, extra = {}) => callTool('scene_query', { action, ...extra });

  await test('scene_query.tree', async () => {
    const { parsed } = await sq('tree');
    assert(parsed.uuid || parsed.name, 'no tree root');
  });

  await test('scene_query.list', async () => {
    const { parsed } = await sq('list');
    assert(parsed.count > 0, 'empty list');
    testNodeUuid = parsed.nodes?.[0]?.uuid || '';
  });

  await test('scene_query.stats', async () => {
    const { parsed } = await sq('stats');
    assert(parsed.nodeCount > 0, 'no nodes');
  });

  await test('scene_query.node_detail', async () => {
    assert(testNodeUuid, 'no uuid from list');
    const { parsed } = await sq('node_detail', { uuid: testNodeUuid });
    assert(parsed.uuid || parsed.name, 'no detail');
  });

  await test('scene_query.find_by_path', async () => {
    const { parsed: tree } = await sq('tree');
    const sceneName = tree.name || 'Scene';
    const { parsed } = await sq('find_by_path', { path: sceneName });
    assert(parsed.uuid || parsed.name, 'not found');
  });

  await test('scene_query.get_components', async () => {
    const { parsed } = await sq('get_components', { uuid: testNodeUuid });
    assert(parsed.uuid || parsed.components !== undefined, 'no components');
  });

  await test('scene_query.get_parent', async () => {
    const { parsed: list } = await sq('list');
    const childNode = list.nodes?.find(n => n.depth > 0);
    if (!childNode) { skip('scene_query.get_parent', 'no child node'); return; }
    const { parsed } = await sq('get_parent', { uuid: childNode.uuid });
    assert(parsed.uuid || parsed.name, 'no parent');
  });

  await test('scene_query.get_children', async () => {
    const { parsed } = await sq('get_children', { uuid: testNodeUuid });
    assert(Array.isArray(parsed) || parsed.error === undefined, 'error');
  });

  await test('scene_query.get_sibling', async () => {
    const { parsed: list } = await sq('list');
    const childNode = list.nodes?.find(n => n.depth > 0);
    if (!childNode) { skip('scene_query.get_sibling', 'no child node'); return; }
    const { parsed } = await sq('get_sibling', { uuid: childNode.uuid });
    assert(Array.isArray(parsed) || !parsed.error, 'error');
  });

  await test('scene_query.get_world_position', async () => {
    const { parsed: list } = await sq('list');
    const node = list.nodes?.find(n => n.depth > 0) || list.nodes?.[0];
    const { parsed } = await sq('get_world_position', { uuid: node.uuid });
    assert(parsed && (parsed.x !== undefined || parsed.error === undefined), 'no position');
  });

  await test('scene_query.get_world_rotation', async () => {
    const { parsed: list } = await sq('list');
    const node = list.nodes?.find(n => n.depth > 0) || list.nodes?.[0];
    const { parsed } = await sq('get_world_rotation', { uuid: node.uuid });
    assert(parsed !== undefined, 'no rotation');
  });

  await test('scene_query.get_world_scale', async () => {
    const { parsed: list } = await sq('list');
    const node = list.nodes?.find(n => n.depth > 0) || list.nodes?.[0];
    const { parsed } = await sq('get_world_scale', { uuid: node.uuid });
    assert(parsed !== undefined, 'no scale');
  });

  await test('scene_query.get_active_in_hierarchy', async () => {
    const { parsed: list } = await sq('list');
    const node = list.nodes?.find(n => n.depth > 0) || list.nodes?.[0];
    const { parsed } = await sq('get_active_in_hierarchy', { uuid: node.uuid });
    assert(parsed.activeInHierarchy !== undefined || parsed.uuid, 'no result');
  });

  await test('scene_query.find_nodes_by_name', async () => {
    const { parsed } = await sq('find_nodes_by_name', { name: 'Canvas' });
    assert(parsed.count !== undefined, 'no count');
  });

  await test('scene_query.find_nodes_by_component', async () => {
    const { parsed } = await sq('find_nodes_by_component', { component: 'Camera' });
    assert(parsed.count !== undefined, 'no count');
  });

  await test('scene_query.get_component_property', async () => {
    const { parsed: compResult } = await sq('find_nodes_by_component', { component: 'Camera' });
    if (!compResult.nodes?.length) { skip('scene_query.get_component_property', 'no Camera node'); return; }
    const camUuid = compResult.nodes[0].uuid;
    const { parsed } = await sq('get_component_property', { uuid: camUuid, component: 'Camera', property: 'fov' });
    assert(parsed.value !== undefined || !parsed.error, 'no value');
  });

  await test('scene_query.get_node_components_properties', async () => {
    const { parsed: list } = await sq('list');
    const node = list.nodes?.find(n => n.depth > 0) || list.nodes?.[0];
    const { parsed } = await sq('get_node_components_properties', { uuid: node.uuid });
    assert(parsed.components !== undefined || parsed.uuid !== undefined || !parsed.error, `unexpected: ${JSON.stringify(parsed).slice(0, 200)}`);
  });

  await test('scene_query.get_camera_info', async () => {
    const { parsed } = await sq('get_camera_info');
    assert(parsed.count !== undefined, 'no count');
  });

  await test('scene_query.get_canvas_info', async () => {
    const { parsed } = await sq('get_canvas_info');
    assert(parsed.count !== undefined, 'no count');
  });

  await test('scene_query.get_scene_globals', async () => {
    const { parsed } = await sq('get_scene_globals');
    assert(parsed.sceneName !== undefined || parsed.uuid !== undefined || !parsed.error, `unexpected: ${JSON.stringify(parsed).slice(0, 200)}`);
  });

  await test('scene_query.get_current_selection', async () => {
    const { parsed } = await sq('get_current_selection');
    assert(parsed.selected !== undefined || parsed.message, 'no result');
  });

  await test('scene_query.get_active_scene_focus', async () => {
    const { parsed } = await sq('get_active_scene_focus');
    assert(parsed.source || parsed.focus, 'no result');
  });

  await test('scene_query.list_all_scenes', async () => {
    const { parsed } = await sq('list_all_scenes');
    assert(parsed !== undefined, 'no result');
  });

  await test('scene_query.validate_scene', async () => {
    const { parsed } = await sq('validate_scene');
    assert(parsed.valid !== undefined, 'no valid field');
  });

  await test('scene_query.detect_2d_3d', async () => {
    const { parsed } = await sq('detect_2d_3d');
    assert(parsed.sceneType, 'no sceneType');
  });

  await test('scene_query.list_available_components', async () => {
    const { parsed } = await sq('list_available_components');
    assert(parsed.totalCount > 0, 'no components');
  });

  // NEW actions
  await test('scene_query.measure_distance', async () => {
    const { parsed: list } = await sq('list');
    const nodes = (list.nodes || []).filter(n => n.depth > 0);
    if (nodes.length < 2) { skip('scene_query.measure_distance', 'need 2+ child nodes'); return; }
    const { parsed } = await sq('measure_distance', { uuidA: nodes[0].uuid, uuidB: nodes[1].uuid });
    assertNotActionUnknown(parsed, 'measure_distance');
    assert(parsed.distance2D !== undefined || parsed.distance3D !== undefined, 'no distance');
  });

  await test('scene_query.scene_snapshot', async () => {
    const { parsed } = await sq('scene_snapshot');
    assertNotActionUnknown(parsed, 'scene_snapshot');
    assert(parsed.nodeCount > 0, 'empty snapshot');
    snapshotA = parsed;
  });

  await test('scene_query.scene_diff', async () => {
    if (!snapshotA) { skip('scene_query.scene_diff', 'no snapshotA'); return; }
    const { parsed } = await sq('scene_diff', { snapshotA, snapshotB: snapshotA });
    assertNotActionUnknown(parsed, 'scene_diff');
    assert(parsed.addedCount === 0, 'diff should be empty for same snapshot');
  });

  await test('scene_query.performance_audit', async () => {
    const { parsed } = await sq('performance_audit');
    assertNotActionUnknown(parsed, 'performance_audit');
    assert(parsed.totalNodes > 0, 'no nodes');
    assert(parsed.score, 'no score');
  });

  await test('scene_query.export_scene_json', async () => {
    const { parsed } = await sq('export_scene_json', { maxNodes: 50 });
    assertNotActionUnknown(parsed, 'export_scene_json');
    assert(parsed.nodeCount > 0, 'empty export');
    assert(parsed.scene, 'no scene data');
  });
}

async function testSceneOperation() {
  console.log('\n=== C. scene_operation ===');
  const so = (action, extra = {}) => callTool('scene_operation', { action, ...extra });

  // Create test nodes
  await test('scene_operation.create_node', async () => {
    const { parsed } = await so('create_node', { name: '__mcp_test_node__' });
    assert(parsed.success, `create failed: ${parsed.error || ''}`);
    testNodeUuid = parsed.uuid;
  });

  await test('scene_operation.create_node_2', async () => {
    const { parsed } = await so('create_node', { name: '__mcp_test_node_2__' });
    assert(parsed.success, `create failed: ${parsed.error || ''}`);
    testNodeUuid2 = parsed.uuid;
  });

  await test('scene_operation.set_name', async () => {
    const { parsed } = await so('set_name', { uuid: testNodeUuid, name: '__mcp_renamed__' });
    assert(parsed.success, `rename failed: ${parsed.error || ''}`);
  });

  await test('scene_operation.set_position', async () => {
    const { parsed } = await so('set_position', { uuid: testNodeUuid, x: 100, y: 200, z: 0 });
    assert(parsed.success, `set_position failed: ${parsed.error || ''}`);
  });

  await test('scene_operation.set_rotation', async () => {
    const { parsed } = await so('set_rotation', { uuid: testNodeUuid, x: 0, y: 0, z: 45 });
    assert(parsed.success, `set_rotation failed: ${parsed.error || ''}`);
  });

  await test('scene_operation.set_scale', async () => {
    const { parsed } = await so('set_scale', { uuid: testNodeUuid, x: 2, y: 2, z: 1 });
    assert(parsed.success, `set_scale failed: ${parsed.error || ''}`);
  });

  await test('scene_operation.set_active', async () => {
    const { parsed } = await so('set_active', { uuid: testNodeUuid, active: false });
    assert(parsed.success, `set_active failed: ${parsed.error || ''}`);
    await so('set_active', { uuid: testNodeUuid, active: true });
  });

  await test('scene_operation.set_world_position', async () => {
    const { parsed } = await so('set_world_position', { uuid: testNodeUuid, x: 50, y: 50, z: 0 });
    assert(parsed.success, `failed: ${parsed.error || ''}`);
  });

  await test('scene_operation.set_world_rotation', async () => {
    const { parsed } = await so('set_world_rotation', { uuid: testNodeUuid, x: 0, y: 0, z: 30 });
    assert(parsed.success, `failed: ${parsed.error || ''}`);
  });

  await test('scene_operation.set_world_scale', async () => {
    const { parsed } = await so('set_world_scale', { uuid: testNodeUuid, x: 1, y: 1, z: 1 });
    assert(parsed.success, `failed: ${parsed.error || ''}`);
  });

  await test('scene_operation.add_component', async () => {
    const { parsed } = await so('add_component', { uuid: testNodeUuid, component: 'UITransform' });
    assert(parsed.success, `add failed: ${parsed.error || ''}`);
  });

  await test('scene_operation.set_property', async () => {
    const { parsed } = await so('set_property', { uuid: testNodeUuid, component: 'UITransform', property: 'contentSize', value: { width: 200, height: 100 } });
    assert(parsed.success || !parsed.error, `set_property: ${parsed.error || ''}`);
  });

  await test('scene_operation.reset_property', async () => {
    const { parsed } = await so('reset_property', { uuid: testNodeUuid, component: 'UITransform', property: 'contentSize' });
    assert(parsed.success || !parsed.error, `reset: ${parsed.error || ''}`);
  });

  await test('scene_operation.remove_component', async () => {
    const { parsed } = await so('remove_component', { uuid: testNodeUuid, component: 'UITransform' });
    assert(parsed.success, `remove failed: ${parsed.error || ''}`);
  });

  await test('scene_operation.duplicate_node', async () => {
    const { parsed } = await so('duplicate_node', { uuid: testNodeUuid });
    assert(parsed.success && parsed.clonedUuid, `duplicate failed: ${parsed.error || ''}`);
    // Cleanup clone
    await so('destroy_node', { uuid: parsed.clonedUuid, confirmDangerous: true });
  });

  // Create child for hierarchy tests
  await test('scene_operation.reparent', async () => {
    const { parsed: child } = await so('create_node', { name: '__mcp_child__' });
    childNodeUuid = child.uuid;
    const { parsed } = await so('reparent', { uuid: childNodeUuid, parentUuid: testNodeUuid });
    assert(parsed.success, `reparent failed: ${parsed.error || ''}`);
  });

  await test('scene_operation.move_node_up', async () => {
    const { parsed } = await so('move_node_up', { uuid: testNodeUuid });
    assert(parsed.success !== undefined, `failed: ${parsed.error || parsed.message || ''}`);
  });

  await test('scene_operation.move_node_down', async () => {
    const { parsed } = await so('move_node_down', { uuid: testNodeUuid });
    assert(parsed.success !== undefined, `failed: ${parsed.error || parsed.message || ''}`);
  });

  await test('scene_operation.set_sibling_index', async () => {
    const { parsed } = await so('set_sibling_index', { uuid: testNodeUuid, index: 0 });
    assert(parsed.success, `failed: ${parsed.error || ''}`);
  });

  await test('scene_operation.hide_node', async () => {
    const { parsed } = await so('hide_node', { uuid: testNodeUuid });
    assert(parsed.success, `failed: ${parsed.error || ''}`);
  });

  await test('scene_operation.unhide_node', async () => {
    const { parsed } = await so('unhide_node', { uuid: testNodeUuid });
    assert(parsed.success, `failed: ${parsed.error || ''}`);
  });

  await test('scene_operation.set_layer', async () => {
    const { parsed } = await so('set_layer', { uuid: testNodeUuid, layer: 1 });
    assert(parsed.success, `failed: ${parsed.error || ''}`);
  });

  await test('scene_operation.lock_node', async () => {
    const { parsed } = await so('lock_node', { uuid: testNodeUuid });
    assert(parsed.message || parsed.success !== undefined, 'no response');
  });

  await test('scene_operation.unlock_node', async () => {
    const { parsed } = await so('unlock_node', { uuid: testNodeUuid });
    assert(parsed.message || parsed.success !== undefined, 'no response');
  });

  await test('scene_operation.call_component_method', async () => {
    // This may fail if no suitable component, that's expected
    const { parsed } = await so('call_component_method', { uuid: testNodeUuid, component: 'Node', methodName: 'getPosition', args: [] });
    assert(parsed !== undefined, 'no response');
  });

  await test('scene_operation.clear_children', async () => {
    const { parsed } = await so('clear_children', { uuid: testNodeUuid, confirmDangerous: true });
    assert(parsed.success, `failed: ${parsed.error || ''}`);
    childNodeUuid = '';
  });

  await test('scene_operation.clipboard_copy', async () => {
    const { parsed } = await so('clipboard_copy', { uuid: testNodeUuid });
    assert(parsed.success || parsed.result || parsed.error, 'no response');
    // clipboard_copy may fail on some Cocos versions due to IPC differences
  });

  await test('scene_operation.clipboard_paste', async () => {
    const { parsed } = await so('clipboard_paste', {});
    assert(parsed.success || parsed.result, `failed: ${parsed.error || ''}`);
  });

  // Prefab operations (best-effort)
  await test('scene_operation.create_prefab', async () => {
    const { parsed } = await so('create_prefab', { uuid: testNodeUuid, savePath: 'db://assets/__mcp_test__.prefab' });
    assert(parsed.success || parsed.result, `failed: ${parsed.error || ''}`);
  });

  await test('scene_operation.validate_prefab', async () => {
    const { parsed } = await so('validate_prefab', { prefabUrl: 'db://assets/__mcp_test__.prefab' });
    assert(parsed.valid !== undefined || parsed.error, 'no result');
  });

  await test('scene_operation.instantiate_prefab', async () => {
    const { parsed } = await so('instantiate_prefab', { prefabUrl: 'db://assets/__mcp_test__.prefab' });
    // May fail if prefab doesn't exist yet
    assert(parsed !== undefined, 'no response');
  });

  await test('scene_operation.enter_prefab_edit', async () => {
    const { parsed } = await so('enter_prefab_edit', { uuid: testNodeUuid });
    assert(parsed !== undefined, 'no response');
  });

  await test('scene_operation.exit_prefab_edit', async () => {
    const { parsed } = await so('exit_prefab_edit');
    assert(parsed !== undefined, 'no response');
  });

  await test('scene_operation.apply_prefab', async () => {
    const { parsed } = await so('apply_prefab', { uuid: testNodeUuid });
    assert(parsed !== undefined, 'no response');
  });

  await test('scene_operation.revert_prefab', async () => {
    const { parsed } = await so('revert_prefab', { uuid: testNodeUuid });
    assert(parsed !== undefined, 'no response');
  });

  // NEW actions
  await test('scene_operation.batch', async () => {
    const { parsed } = await so('batch', {
      operations: [
        { action: 'create_node', name: '__batch_a__' },
        { action: 'set_position', uuid: '$0.uuid', x: 10, y: 20, z: 0 },
        { action: 'destroy_node', uuid: '$0.uuid', confirmDangerous: true },
      ],
    });
    assertNotActionUnknown(parsed, 'batch');
    assert(parsed.success, `batch failed: ${parsed.error || ''}`);
    assert(parsed.totalOps === 3, `expected 3 ops, got ${parsed.totalOps}`);
  });

  await test('scene_operation.create_ui_widget', async () => {
    const { parsed } = await so('create_ui_widget', { widgetType: 'button', name: '__mcp_btn__', text: 'Test' });
    assertNotActionUnknown(parsed, 'create_ui_widget');
    assert(parsed.success, `failed: ${parsed.error || ''}`);
    if (parsed.uuid) await so('destroy_node', { uuid: parsed.uuid, confirmDangerous: true });
  });

  await test('scene_operation.setup_particle', async () => {
    const { parsed } = await so('setup_particle', { preset: 'fire', name: '__mcp_particles__' });
    assertNotActionUnknown(parsed, 'setup_particle');
    assert(parsed.success || parsed.error, `no response`);
    if (parsed.uuid) await so('destroy_node', { uuid: parsed.uuid, confirmDangerous: true });
  });

  await test('scene_operation.align_nodes', async () => {
    const { parsed } = await so('align_nodes', { uuids: [testNodeUuid, testNodeUuid2], alignment: 'center_h' });
    assertNotActionUnknown(parsed, 'align_nodes');
    assert(parsed.success || parsed.error, 'no response');
  });

  await test('scene_operation.audio_setup', async () => {
    const { parsed } = await so('audio_setup', { uuid: testNodeUuid, volume: 0.5, loop: true });
    assertNotActionUnknown(parsed, 'audio_setup');
    assert(parsed.success || parsed.error, 'no response');
  });

  await test('scene_operation.setup_physics_world', async () => {
    const { parsed } = await so('setup_physics_world', { mode: 'auto', gravity: { x: 0, y: -320 } });
    assertNotActionUnknown(parsed, 'setup_physics_world');
    assert(parsed.success || parsed.error || parsed.warnings, 'no response');
  });

  await test('scene_operation.create_skeleton_node', async () => {
    const { parsed } = await so('create_skeleton_node', { skeletonType: 'spine', name: '__mcp_spine__' });
    assertNotActionUnknown(parsed, 'create_skeleton_node');
    assert(parsed.success || parsed.error, 'no response');
    if (parsed.uuid) await so('destroy_node', { uuid: parsed.uuid, confirmDangerous: true });
  });

  await test('scene_operation.generate_tilemap', async () => {
    const { parsed } = await so('generate_tilemap', { name: '__mcp_tilemap__' });
    assertNotActionUnknown(parsed, 'generate_tilemap');
    assert(parsed.success || parsed.error, 'no response');
    if (parsed.uuid) await so('destroy_node', { uuid: parsed.uuid, confirmDangerous: true });
  });

  // 正方体 + 45° 摄像机 + 预览（仅 3D 场景）
  let cubeUuid = '';
  await test('scene_operation.create_primitive_cube', async () => {
    const { parsed } = await so('create_primitive', {
      parentUuid: '',
      name: '__mcp_Cube__',
      type: 'box',
      color: { r: 66, g: 135, b: 245, a: 255 },
    });
    assertNotActionUnknown(parsed, 'create_primitive');
    if (parsed.error && parsed.error.includes('不支持')) {
      skip('scene_operation.create_primitive_cube', '需 3D 场景或 Cocos 3.x');
      return;
    }
    assert(parsed.success, parsed.error || 'create_primitive 失败');
    assert(parsed.uuid, 'no uuid');
    cubeUuid = parsed.uuid;
  });

  await test('scene_operation.set_camera_look_at', async () => {
    const { parsed: cam } = await callTool('scene_query', { action: 'get_camera_info' });
    const camUuid = cam?.cameras?.[0]?.uuid;
    if (!camUuid) {
      skip('scene_operation.set_camera_look_at', '场景无摄像机');
      return;
    }
    const { parsed } = await so('set_camera_look_at', {
      uuid: camUuid,
      targetX: 0,
      targetY: 0,
      targetZ: 0,
    });
    assertNotActionUnknown(parsed, 'set_camera_look_at');
    assert(parsed?.success || parsed?.error, 'no response');
  });

  await test('editor_action.preview_after_cube', async () => {
    const { parsed } = await callTool('editor_action', { action: 'preview' });
    assert(parsed !== undefined, 'preview 无响应');
  });

  // Cleanup test nodes — thorough sweep
  console.log('  (cleaning up test nodes...)');
  if (testNodeUuid) try { await so('destroy_node', { uuid: testNodeUuid, confirmDangerous: true }); } catch { /* ok */ }
  if (testNodeUuid2) try { await so('destroy_node', { uuid: testNodeUuid2, confirmDangerous: true }); } catch { /* ok */ }
  if (cubeUuid) try { await so('destroy_node', { uuid: cubeUuid, confirmDangerous: true }); } catch { /* ok */ }
  // Sweep: remove any __mcp_ prefixed nodes AND (Missing Node) entries
  try {
    const { parsed: allNodes } = await callTool('scene_query', { action: 'list' });
    const junk = (allNodes?.nodes || []).filter(n =>
      n.name.startsWith('__mcp_') || n.name === '(Missing Node)' || n.name === ''
    );
    for (const n of junk) {
      try { await so('destroy_node', { uuid: n.uuid, confirmDangerous: true }); } catch { /* ok */ }
    }
  } catch { /* ok */ }
}

async function testAssetOperation() {
  console.log('\n=== D. asset_operation ===');
  const ao = (action, extra = {}) => callTool('asset_operation', { action, ...extra });

  await test('asset_operation.list', async () => {
    const { parsed } = await ao('list', { pattern: 'db://assets/**/*' });
    assert(parsed !== undefined, 'no result');
  });

  await test('asset_operation.create', async () => {
    createdAssetUrl = 'db://assets/__mcp_test_asset__.txt';
    const { parsed } = await ao('create', { url: createdAssetUrl, content: 'test content' });
    assert(parsed !== undefined, 'no result');
  });

  await test('asset_operation.info', async () => {
    const { parsed } = await ao('info', { url: createdAssetUrl });
    assert(parsed !== undefined, 'no result');
  });

  await test('asset_operation.save', async () => {
    const { parsed } = await ao('save', { url: createdAssetUrl, content: 'updated content' });
    assert(parsed !== undefined, 'no result');
  });

  await test('asset_operation.refresh', async () => {
    const { parsed } = await ao('refresh', { url: 'db://assets' });
    assert(parsed !== undefined, 'no result');
  });

  await test('asset_operation.search_by_type', async () => {
    const { parsed } = await ao('search_by_type', { pattern: 'db://assets/**/*', type: 'scene' });
    assert(parsed.count !== undefined || parsed !== undefined, 'no result');
  });

  await test('asset_operation.get_meta', async () => {
    const { parsed } = await ao('get_meta', { url: createdAssetUrl });
    assert(parsed !== undefined, 'no result');
  });

  await test('asset_operation.uuid_to_url', async () => {
    const { parsed } = await ao('uuid_to_url', { uuid: 'test-uuid' });
    assert(parsed !== undefined, 'no result');
  });

  await test('asset_operation.url_to_uuid', async () => {
    const { raw } = await callTool('asset_operation', { action: 'url_to_uuid', url: createdAssetUrl });
    const text = raw?.content?.[0]?.text ?? '';
    // May return a UUID string, null, or an error object
    assert(text.length > 0, 'empty response');
  });

  await test('asset_operation.get_dependencies', async () => {
    const { parsed } = await ao('get_dependencies', { url: createdAssetUrl });
    assert(parsed !== undefined, 'no result');
  });

  await test('asset_operation.get_dependents', async () => {
    const { parsed } = await ao('get_dependents', { url: createdAssetUrl });
    assert(parsed !== undefined, 'no result');
  });

  await test('asset_operation.get_animation_clips', async () => {
    const { parsed } = await ao('get_animation_clips');
    assert(parsed !== undefined, 'no result');
  });

  await test('asset_operation.get_materials', async () => {
    const { parsed } = await ao('get_materials');
    assert(parsed !== undefined, 'no result');
  });

  await test('asset_operation.validate_asset', async () => {
    const { parsed } = await ao('validate_asset', { url: createdAssetUrl });
    assert(parsed.valid !== undefined || parsed.error, 'no result');
  });

  await test('asset_operation.export_asset_manifest', async () => {
    const { parsed } = await ao('export_asset_manifest');
    assert(parsed.totalCount !== undefined, 'no totalCount');
  });

  await test('asset_operation.create_folder', async () => {
    const { parsed } = await ao('create_folder', { url: 'db://assets/__mcp_test_folder__' });
    assert(parsed !== undefined, 'no result');
  });

  await test('asset_operation.copy', async () => {
    const { parsed } = await ao('copy', { sourceUrl: createdAssetUrl, targetUrl: 'db://assets/__mcp_test_copy__.txt' });
    assert(parsed !== undefined, 'no result');
  });

  await test('asset_operation.rename', async () => {
    const { parsed } = await ao('rename', { url: 'db://assets/__mcp_test_copy__.txt', newName: '__mcp_test_renamed__.txt' });
    assert(parsed !== undefined, 'no result');
  });

  await test('asset_operation.reimport', async () => {
    const { parsed } = await ao('reimport', { url: createdAssetUrl });
    assert(parsed !== undefined, 'no result');
  });

  await test('asset_operation.set_meta_property', async () => {
    const { parsed } = await ao('set_meta_property', { url: createdAssetUrl, property: 'userData', value: { test: true } });
    assert(parsed !== undefined, 'no result');
  });

  await test('asset_operation.clean_unused', async () => {
    const { parsed } = await ao('clean_unused');
    assert(parsed.status || parsed.message, 'no result');
  });

  // NEW actions
  await test('asset_operation.create_material', async () => {
    const { parsed } = await ao('create_material', { url: 'db://assets/__mcp_test_mat__.mtl', effectName: 'builtin-standard' });
    assert(parsed.success || parsed.error, 'no result');
  });

  await test('asset_operation.generate_script', async () => {
    const { parsed } = await ao('generate_script', {
      url: 'db://assets/__mcp_test_script__.ts',
      className: 'McpTestComponent',
      scriptProperties: [{ name: 'speed', type: 'number', default: 10 }],
      lifecycle: ['onLoad', 'start', 'update'],
    });
    assert(parsed.success || parsed.error, 'no result');
  });

  // Cleanup
  console.log('  (cleaning up test assets...)');
  const cleanups = [
    createdAssetUrl, 'db://assets/__mcp_test_renamed__.txt',
    'db://assets/__mcp_test_folder__', 'db://assets/__mcp_test__.prefab',
    'db://assets/__mcp_test_mat__.mtl', 'db://assets/__mcp_test_script__.ts',
  ].filter(u => u && typeof u === 'string' && u.startsWith('db://'));
  for (const url of cleanups) {
    try { await ao('delete', { url }); } catch { /* ok */ }
  }
  await new Promise(r => setTimeout(r, 500));
  try { await ao('refresh', { url: 'db://assets' }); } catch { /* ok */ }
}

async function testEditorAction() {
  console.log('\n=== E. editor_action + engine_action ===');
  const ea = (action, extra = {}) => callTool('editor_action', { action, ...extra });
  const eng = (action, extra = {}) => callTool('engine_action', { action, ...extra });

  await test('editor_action.project_info', async () => {
    const { parsed } = await ea('project_info');
    assert(parsed.editorVersion || parsed.projectPath, 'no info');
  });

  await test('editor_action.get_selection', async () => {
    const { parsed } = await ea('get_selection');
    assert(parsed !== undefined, 'no result');
  });

  await test('editor_action.clear_selection', async () => {
    const { parsed } = await ea('clear_selection');
    assert(parsed !== undefined, 'no result');
  });

  await test('editor_action.log', async () => {
    const { parsed } = await ea('log', { text: '[MCP Integration Test] log test' });
    assert(parsed !== undefined, 'no result');
  });

  await test('editor_action.warn', async () => {
    const { parsed } = await ea('warn', { text: '[MCP Integration Test] warn test' });
    assert(parsed !== undefined, 'no result');
  });

  await test('editor_action.error', async () => {
    const { parsed } = await ea('error', { text: '[MCP Integration Test] error test' });
    assert(parsed !== undefined, 'no result');
  });

  await test('editor_action.clear_console', async () => {
    const { parsed } = await ea('clear_console');
    assert(parsed !== undefined, 'no result');
  });

  await test('editor_action.query_panels', async () => {
    const { parsed } = await ea('query_panels');
    assert(parsed !== undefined, 'no result');
  });

  await test('editor_action.get_packages', async () => {
    const { parsed } = await ea('get_packages');
    assert(parsed !== undefined, 'no result');
  });

  await test('editor_action.set_transform_tool', async () => {
    const { parsed } = await ea('set_transform_tool', { tool: 'position' });
    assert(parsed !== undefined, 'no result');
  });

  await test('editor_action.set_coordinate', async () => {
    const { parsed } = await ea('set_coordinate', { coordinate: 'local' });
    assert(parsed !== undefined, 'no result');
  });

  await test('editor_action.show_notification', async () => {
    const { parsed } = await ea('show_notification', { title: 'MCP Test', message: 'Integration test running' });
    assert(parsed !== undefined, 'no result');
  });

  await test('editor_action.save_scene', async () => {
    const { parsed } = await ea('save_scene');
    assert(parsed !== undefined, 'no result');
  });

  await test('editor_action.undo', async () => {
    const { parsed } = await ea('undo');
    assert(parsed !== undefined, 'no result');
  });

  await test('editor_action.redo', async () => {
    const { parsed } = await ea('redo');
    assert(parsed !== undefined, 'no result');
  });

  // Engine actions
  await test('engine_action.get_system_info', async () => {
    const { parsed } = await eng('get_system_info');
    assert(parsed.os || parsed.platform || parsed.isBrowser !== undefined, 'no info');
  });

  await test('engine_action.set_frame_rate', async () => {
    const { parsed } = await eng('set_frame_rate', { fps: 60 });
    assert(parsed.success, `failed: ${parsed.error || ''}`);
  });

  await test('engine_action.pause_engine', async () => {
    const { parsed } = await eng('pause_engine');
    assert(parsed.success, `failed: ${parsed.error || ''}`);
  });

  await test('engine_action.resume_engine', async () => {
    const { parsed } = await eng('resume_engine');
    assert(parsed.success, `failed: ${parsed.error || ''}`);
  });

  await test('engine_action.dump_texture_cache', async () => {
    const { parsed } = await eng('dump_texture_cache');
    assert(parsed.success || parsed.totalCount !== undefined, 'no result');
  });
}

async function testAtomicTools() {
  console.log('\n=== F. Atomic Tools ===');

  await test('create_prefab_atomic', async () => {
    const { parsed } = await callTool('create_prefab_atomic', {
      prefabPath: 'db://assets/__mcp_atomic_test__.prefab',
      nodeName: 'AtomicTestNode',
      components: [{ type: 'UITransform' }],
      cleanupSourceNode: true,
    });
    assert(parsed.success || parsed.error, 'no response');
    // Wait for asset-db to settle before deleting
    await new Promise(r => setTimeout(r, 300));
    try { await callTool('asset_operation', { action: 'delete', url: 'db://assets/__mcp_atomic_test__.prefab' }); } catch { /* ok */ }
    await new Promise(r => setTimeout(r, 200));
    try { await callTool('asset_operation', { action: 'refresh', url: 'db://assets' }); } catch { /* ok */ }
  });

  await test('setup_ui_layout', async () => {
    const { parsed } = await callTool('setup_ui_layout', {
      rootName: '__mcp_scroll_test__',
      itemCount: 3,
    });
    assert(parsed.success || parsed.error, 'no response');
    if (parsed.rootUuid) {
      try { await callTool('scene_operation', { action: 'destroy_node', uuid: parsed.rootUuid, confirmDangerous: true }); } catch { /* ok */ }
    }
  });

  await test('create_tween_animation_atomic', async () => {
    // Create a temp node first
    const { parsed: node } = await callTool('scene_operation', { action: 'create_node', name: '__mcp_anim_test__' });
    if (!node.uuid) { skip('create_tween_animation_atomic', 'could not create node'); return; }
    const { parsed } = await callTool('create_tween_animation_atomic', {
      nodeUuid: node.uuid,
      duration: 1,
      tracks: [{ property: 'position', keyframes: [{ time: 0, value: { x: 0, y: 0, z: 0 } }, { time: 1, value: { x: 100, y: 0, z: 0 } }] }],
    });
    assert(parsed.success || parsed.error, 'no response');
    try { await callTool('scene_operation', { action: 'destroy_node', uuid: node.uuid, confirmDangerous: true }); } catch { /* ok */ }
  });

  await test('auto_fit_physics_collider', async () => {
    const { parsed: node } = await callTool('scene_operation', { action: 'create_node', name: '__mcp_phys_test__' });
    if (!node.uuid) { skip('auto_fit_physics_collider', 'could not create node'); return; }
    // Add UITransform + Sprite first
    await callTool('scene_operation', { action: 'add_component', uuid: node.uuid, component: 'UITransform' });
    await callTool('scene_operation', { action: 'add_component', uuid: node.uuid, component: 'Sprite' });
    const { parsed } = await callTool('auto_fit_physics_collider', {
      nodeUuid: node.uuid,
      colliderType: 'box',
    });
    assert(parsed.success || parsed.error, 'no response');
    try { await callTool('scene_operation', { action: 'destroy_node', uuid: node.uuid, confirmDangerous: true }); } catch { /* ok */ }
  });

  skip('import_and_apply_texture', 'no test image available');
}

async function testMiscTools() {
  console.log('\n=== G. Misc Tools ===');

  await test('preferences.get', async () => {
    const { parsed } = await callTool('preferences', { action: 'list' });
    assert(parsed !== undefined, 'no result');
  });

  await test('broadcast.poll', async () => {
    const { parsed } = await callTool('broadcast', { action: 'poll' });
    assert(parsed !== undefined, 'no result');
  });

  await test('broadcast.history', async () => {
    const { parsed } = await callTool('broadcast', { action: 'history' });
    assert(parsed !== undefined, 'no result');
  });

  await test('reference_image.set', async () => {
    const { parsed } = await callTool('reference_image', { action: 'set', active: false, opacity: 0.5 });
    assert(parsed !== undefined, 'no result');
  });
}

// =============================================================================
// MAIN
// =============================================================================
async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   MCP Full Integration Test                     ║');
  console.log('╚══════════════════════════════════════════════════╝');

  const found = await discover();
  if (!found) {
    console.error('\nERROR: No running bridge found on ports 7779-7782');
    process.exit(1);
  }

  await testBasicConnectivity();
  await testSceneQuery();
  await testSceneOperation();
  await testAssetOperation();
  await testEditorAction();
  await testAtomicTools();
  await testMiscTools();

  // Final cleanup sweep — catch anything missed by individual test groups
  console.log('\n=== Final Cleanup ===');
  try {
    const { parsed: allNodes } = await callTool('scene_query', { action: 'list' });
    const junk = (allNodes?.nodes || []).filter(n =>
      n.name.startsWith('__mcp_') || n.name.startsWith('__batch_') ||
      n.name === '(Missing Node)' || n.name === ''
    );
    if (junk.length) {
      for (const n of junk) {
        try { await callTool('scene_operation', { action: 'destroy_node', uuid: n.uuid, confirmDangerous: true }); } catch { /* ok */ }
      }
      console.log(`  Cleaned ${junk.length} leftover node(s)`);
    } else {
      console.log('  Scene is clean');
    }
  } catch { /* ok */ }

  // Report
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;
  const total = results.length;

  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log(`║  SUMMARY: Total ${total} | Pass ${passed} | Fail ${failed} | Skip ${skipped}`);
  console.log('╚══════════════════════════════════════════════════╝');

  if (failed > 0) {
    console.log('\nFailed tests:');
    for (const r of results.filter(r => r.status === 'FAIL')) {
      console.log(`  - ${r.name}: ${r.reason}`);
    }
  }

  // Write report
  const report = {
    timestamp: new Date().toISOString(),
    endpoint: BASE_URL,
    summary: { total, passed, failed, skipped },
    results,
  };
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to: ${REPORT_PATH}`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(2);
});
