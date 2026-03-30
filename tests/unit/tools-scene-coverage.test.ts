import { describe, it, expect, vi } from 'vitest';
import { buildCocosToolServer, type BridgeToolContext } from '../../src/mcp/tools';
import type { ToolCallResult } from '../../src/mcp/local-tool-server';

function makeCtx(overrides: Partial<BridgeToolContext> = {}): BridgeToolContext {
  const sceneMethod = overrides.sceneMethod ?? vi.fn().mockResolvedValue({ success: true });
  return {
    bridgeGet: vi.fn().mockResolvedValue({}),
    bridgePost: vi.fn().mockResolvedValue({ success: true }),
    sceneMethod,
    sceneOp: overrides.sceneOp ?? (async (params: Record<string, unknown>) => sceneMethod('dispatchOperation', [params])),
    editorMsg: vi.fn().mockResolvedValue({}),
    text: (data: unknown, isError?: boolean): ToolCallResult => ({
      content: [{ type: 'text', text: JSON.stringify(data) }],
      ...(isError !== undefined ? { isError } : {}),
    }),
    ...overrides,
  };
}
function parse(result: ToolCallResult): Record<string, unknown> {
  return JSON.parse(result.content[0].text);
}

// ═══════════════════════════════════════════════════════════════════════════════
// scene_query
// ═══════════════════════════════════════════════════════════════════════════════
describe('scene_query — standard dispatchQuery actions', () => {
  const simpleQueryActions = [
    'tree', 'list', 'stats',
  ];
  for (const action of simpleQueryActions) {
    it(`${action} calls sceneMethod('dispatchQuery')`, async () => {
      const sceneMethod = vi.fn().mockResolvedValue({ ok: true });
      const server = buildCocosToolServer(makeCtx({ sceneMethod }));
      const result = await server.callTool('scene_query', { action });
      expect(result.isError).toBeFalsy();
      expect(sceneMethod).toHaveBeenCalledWith('dispatchQuery', [expect.objectContaining({ action })]);
    });
  }

  const uuidQueryActions = [
    'node_detail', 'get_components', 'get_parent', 'get_children', 'get_sibling',
    'get_world_position', 'get_world_rotation', 'get_world_scale',
    'get_active_in_hierarchy', 'get_node_components_properties',
  ];
  for (const action of uuidQueryActions) {
    it(`${action} calls dispatchQuery with uuid`, async () => {
      const sceneMethod = vi.fn().mockResolvedValue({ ok: true });
      const server = buildCocosToolServer(makeCtx({ sceneMethod }));
      const result = await server.callTool('scene_query', { action, uuid: 'test-uuid' });
      expect(result.isError).toBeFalsy();
      expect(sceneMethod).toHaveBeenCalledWith('dispatchQuery', [expect.objectContaining({ action, uuid: 'test-uuid' })]);
    });
  }

  it('find_by_path calls dispatchQuery with path', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ ok: true });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));
    const result = await server.callTool('scene_query', { action: 'find_by_path', path: 'Canvas/Panel' });
    expect(result.isError).toBeFalsy();
    expect(sceneMethod).toHaveBeenCalledWith('dispatchQuery', [expect.objectContaining({ action: 'find_by_path', path: 'Canvas/Panel' })]);
  });

  it('find_nodes_by_name calls dispatchQuery with name', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ ok: true });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));
    const result = await server.callTool('scene_query', { action: 'find_nodes_by_name', name: 'Player' });
    expect(result.isError).toBeFalsy();
    expect(sceneMethod).toHaveBeenCalledWith('dispatchQuery', [expect.objectContaining({ action: 'find_nodes_by_name', name: 'Player' })]);
  });

  it('find_nodes_by_component calls dispatchQuery with component', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ ok: true });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));
    const result = await server.callTool('scene_query', { action: 'find_nodes_by_component', component: 'Sprite' });
    expect(result.isError).toBeFalsy();
    expect(sceneMethod).toHaveBeenCalledWith('dispatchQuery', [expect.objectContaining({ action: 'find_nodes_by_component', component: 'Sprite' })]);
  });

  it('get_component_property calls dispatchQuery with uuid, component, property', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ value: 42 });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));
    const result = await server.callTool('scene_query', { action: 'get_component_property', uuid: 'u1', component: 'Label', property: 'fontSize' });
    expect(result.isError).toBeFalsy();
    expect(sceneMethod).toHaveBeenCalledWith('dispatchQuery', [expect.objectContaining({ action: 'get_component_property', uuid: 'u1', component: 'Label', property: 'fontSize' })]);
  });

  it('get_camera_info calls dispatchQuery', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ cameras: [] });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));
    const result = await server.callTool('scene_query', { action: 'get_camera_info' });
    expect(result.isError).toBeFalsy();
    expect(sceneMethod).toHaveBeenCalledWith('dispatchQuery', [expect.objectContaining({ action: 'get_camera_info' })]);
  });

  it('get_canvas_info calls dispatchQuery', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ canvas: {} });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));
    const result = await server.callTool('scene_query', { action: 'get_canvas_info' });
    expect(result.isError).toBeFalsy();
    expect(sceneMethod).toHaveBeenCalledWith('dispatchQuery', [expect.objectContaining({ action: 'get_canvas_info' })]);
  });

  it('get_scene_globals calls dispatchQuery', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ ambient: {} });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));
    const result = await server.callTool('scene_query', { action: 'get_scene_globals' });
    expect(result.isError).toBeFalsy();
    expect(sceneMethod).toHaveBeenCalledWith('dispatchQuery', [expect.objectContaining({ action: 'get_scene_globals' })]);
  });

  it('get_current_selection calls bridgeGet then sceneMethod', async () => {
    const bridgeGet = vi.fn().mockResolvedValue({ selected: ['sel-uuid'] });
    const sceneMethod = vi.fn().mockResolvedValue({ name: 'Node1' });
    const server = buildCocosToolServer(makeCtx({ bridgeGet, sceneMethod }));
    const result = await server.callTool('scene_query', { action: 'get_current_selection' });
    expect(result.isError).toBeFalsy();
    expect(bridgeGet).toHaveBeenCalledWith('/api/editor/selection');
    expect(sceneMethod).toHaveBeenCalledWith('dispatchQuery', [{ action: 'node_detail', uuid: 'sel-uuid' }]);
  });

  it('get_current_selection returns empty when nothing selected', async () => {
    const bridgeGet = vi.fn().mockResolvedValue({ selected: [] });
    const server = buildCocosToolServer(makeCtx({ bridgeGet }));
    const result = await server.callTool('scene_query', { action: 'get_current_selection' });
    const data = parse(result);
    expect(data.message).toBe('当前没有选中节点');
  });

  it('流程：create_node 后用返回的 uuid 调 node_detail 可取 rotation/layer 等字段', async () => {
    const newUuid = 'created-node-uuid';
    const sceneMethod = vi.fn()
      .mockResolvedValueOnce({ success: true, uuid: newUuid, name: 'ProbeNode' })
      .mockResolvedValueOnce({
        uuid: newUuid,
        name: 'ProbeNode',
        active: true,
        path: 'Scene/ProbeNode',
        position: { x: 1, y: 2, z: 3 },
        rotation: { x: 0, y: 45, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        layer: 1073741824,
        childCount: 0,
        components: ['cc.UITransform'],
      });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));
    const created = await server.callTool('scene_operation', { action: 'create_node', name: 'ProbeNode' });
    expect(created.isError).toBeFalsy();
    const detail = await server.callTool('scene_query', { action: 'node_detail', uuid: newUuid });
    expect(detail.isError).toBeFalsy();
    const data = parse(detail);
    expect(data.rotation).toEqual({ x: 0, y: 45, z: 0 });
    expect(data.layer).toBe(1073741824);
    expect(data.position).toEqual({ x: 1, y: 2, z: 3 });
    expect(sceneMethod).toHaveBeenNthCalledWith(1, 'dispatchOperation', [expect.objectContaining({ action: 'create_node', name: 'ProbeNode' })]);
    expect(sceneMethod).toHaveBeenNthCalledWith(2, 'dispatchQuery', [expect.objectContaining({ action: 'node_detail', uuid: newUuid })]);
  });

  it('get_components 返回体中每项组件含 name 与 type（与场景脚本 getNodeComponents 一致）', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({
      uuid: 'u1',
      name: 'Main Camera',
      components: [
        { name: 'cc.Camera', type: 'Camera' },
      ],
    });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));
    const result = await server.callTool('scene_query', { action: 'get_components', uuid: 'u1' });
    expect(result.isError).toBeFalsy();
    const data = parse(result);
    expect(data.components[0].name).toBe('cc.Camera');
    expect(data.components[0].type).toBe('Camera');
  });

  it('get_active_scene_focus with selection returns selection detail', async () => {
    const bridgeGet = vi.fn().mockResolvedValue({ selected: ['focus-uuid'] });
    const sceneMethod = vi.fn().mockResolvedValue({ name: 'FocusNode' });
    const server = buildCocosToolServer(makeCtx({ bridgeGet, sceneMethod }));
    const result = await server.callTool('scene_query', { action: 'get_active_scene_focus' });
    const data = parse(result);
    expect(data.source).toBe('selection');
  });

  it('get_active_scene_focus without selection falls back to stats', async () => {
    const bridgeGet = vi.fn().mockResolvedValue({ selected: [] });
    const sceneMethod = vi.fn().mockResolvedValue({ nodeCount: 10 });
    const server = buildCocosToolServer(makeCtx({ bridgeGet, sceneMethod }));
    const result = await server.callTool('scene_query', { action: 'get_active_scene_focus' });
    const data = parse(result);
    expect(data.source).toBe('scene');
  });

  it('list_all_scenes calls editorMsg', async () => {
    const editorMsg = vi.fn().mockResolvedValue([{ url: 'db://assets/scenes/main.scene' }]);
    const server = buildCocosToolServer(makeCtx({ editorMsg }));
    const result = await server.callTool('scene_query', { action: 'list_all_scenes' });
    expect(result.isError).toBeFalsy();
    expect(editorMsg).toHaveBeenCalledWith('asset-db', 'query-assets', { pattern: 'db://assets/**/*.scene' });
  });

  it('validate_scene calls dispatchQuery', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ valid: true });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));
    const result = await server.callTool('scene_query', { action: 'validate_scene' });
    expect(result.isError).toBeFalsy();
    expect(sceneMethod).toHaveBeenCalledWith('dispatchQuery', [expect.objectContaining({ action: 'validate_scene' })]);
  });

  it('detect_2d_3d calls dispatchQuery', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ mode: '2D' });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));
    const result = await server.callTool('scene_query', { action: 'detect_2d_3d' });
    expect(result.isError).toBeFalsy();
    expect(sceneMethod).toHaveBeenCalledWith('dispatchQuery', [expect.objectContaining({ action: 'detect_2d_3d' })]);
  });

  it('list_available_components calls dispatchQuery', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ components: [] });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));
    const result = await server.callTool('scene_query', { action: 'list_available_components' });
    expect(result.isError).toBeFalsy();
    expect(sceneMethod).toHaveBeenCalledWith('dispatchQuery', [expect.objectContaining({ action: 'list_available_components' })]);
  });
});

describe('scene_query — NEW_QUERY_ACTIONS (dispatchQuery with fallback)', () => {
  const newQueryActions: Array<{ action: string; params: Record<string, unknown> }> = [
    { action: 'measure_distance', params: { uuidA: 'a1', uuidB: 'b1' } },
    { action: 'scene_snapshot', params: {} },
    { action: 'scene_diff', params: { snapshotA: { nodes: [] }, snapshotB: { nodes: [] } } },
    { action: 'performance_audit', params: {} },
    { action: 'export_scene_json', params: {} },
    { action: 'deep_validate_scene', params: {} },
    { action: 'get_node_bounds', params: { uuid: 'u1' } },
    { action: 'find_nodes_by_layer', params: { layer: 1 } },
    { action: 'get_animation_state', params: { uuid: 'u1' } },
    { action: 'get_collider_info', params: { uuid: 'u1' } },
    { action: 'get_material_info', params: { uuid: 'u1' } },
    { action: 'get_light_info', params: {} },
    { action: 'get_scene_environment', params: {} },
    { action: 'screen_to_world', params: { screenX: 100, screenY: 200 } },
    { action: 'world_to_screen', params: { worldX: 1, worldY: 2, worldZ: 3 } },
    { action: 'check_script_ready', params: { script: 'PlayerCtrl' } },
    { action: 'get_script_properties', params: { script: 'PlayerCtrl' } },
  ];

  for (const { action, params } of newQueryActions) {
    it(`${action} calls dispatchQuery`, async () => {
      const sceneMethod = vi.fn().mockResolvedValue({ ok: true });
      const server = buildCocosToolServer(makeCtx({ sceneMethod }));
      const result = await server.callTool('scene_query', { action, ...params });
      expect(result.isError).toBeFalsy();
      expect(sceneMethod).toHaveBeenCalledWith('dispatchQuery', [expect.objectContaining({ action })]);
    });
  }

  it('exception in scene_query returns error', async () => {
    const sceneMethod = vi.fn().mockRejectedValue(new Error('connection lost'));
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));
    const result = await server.callTool('scene_query', { action: 'tree' });
    expect(result.isError).toBe(true);
    const data = parse(result);
    expect(data.error).toContain('connection lost');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// scene_operation — standard dispatchOperation actions
// ═══════════════════════════════════════════════════════════════════════════════
describe('scene_operation — standard dispatchOperation actions', () => {
  it('create_node calls dispatchOperation and touches name to force dirty', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ success: true, uuid: 'new-uuid', name: 'TestNode' });
    const editorMsg = vi.fn().mockResolvedValue({});
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg, bridgePost }));
    const result = await server.callTool('scene_operation', { action: 'create_node', name: 'TestNode' });
    expect(result.isError).toBeFalsy();
    expect(sceneMethod).toHaveBeenCalledWith('dispatchOperation', [expect.objectContaining({ action: 'create_node', name: 'TestNode' })]);
    expect(editorMsg).toHaveBeenCalledWith('scene', 'set-property', {
      uuid: 'new-uuid',
      path: 'name',
      dump: { type: 'string', value: 'TestNode' },
    });
  });

  it('destroy_node blocked without confirmDangerous', async () => {
    const server = buildCocosToolServer(makeCtx());
    const result = await server.callTool('scene_operation', { action: 'destroy_node', uuid: 'u1' });
    expect(result.isError).toBe(true);
    const data = parse(result);
    expect(data.error).toContain('危险操作');
  });

  it('destroy_node calls editorMsg remove-node with confirmDangerous=true', async () => {
    const editorMsg = vi.fn().mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ editorMsg }));
    const result = await server.callTool('scene_operation', { action: 'destroy_node', uuid: 'u1', confirmDangerous: true });
    expect(result.isError).toBeFalsy();
    expect(editorMsg).toHaveBeenCalledWith('scene', 'remove-node', { uuid: 'u1' });
  });

  it('reparent calls dispatchOperation', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));
    const result = await server.callTool('scene_operation', { action: 'reparent', uuid: 'child', parentUuid: 'parent' });
    expect(result.isError).toBeFalsy();
    expect(sceneMethod).toHaveBeenCalledWith('dispatchOperation', [expect.objectContaining({ action: 'reparent', uuid: 'child', parentUuid: 'parent' })]);
  });

  const transformActions = [
    { action: 'set_position', params: { uuid: 'u1', x: 1, y: 2, z: 3 } },
    { action: 'set_rotation', params: { uuid: 'u1', x: 0, y: 90, z: 0 } },
    { action: 'set_scale', params: { uuid: 'u1', x: 1, y: 1, z: 1 } },
    { action: 'set_world_position', params: { uuid: 'u1', x: 10, y: 20, z: 30 } },
    { action: 'set_world_rotation', params: { uuid: 'u1', x: 0, y: 45, z: 0 } },
    { action: 'set_world_scale', params: { uuid: 'u1', x: 2, y: 2, z: 2 } },
  ];
  for (const { action, params } of transformActions) {
    it(`${action} calls dispatchOperation`, async () => {
      const sceneMethod = vi.fn().mockResolvedValue({ success: true });
      const server = buildCocosToolServer(makeCtx({ sceneMethod }));
      const result = await server.callTool('scene_operation', { action, ...params });
      expect(result.isError).toBeFalsy();
      expect(sceneMethod).toHaveBeenCalledWith('dispatchOperation', [expect.objectContaining({ action })]);
    });
  }

  it('set_name calls dispatchOperation', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));
    const result = await server.callTool('scene_operation', { action: 'set_name', uuid: 'u1', name: 'NewName' });
    expect(result.isError).toBeFalsy();
    expect(sceneMethod).toHaveBeenCalledWith('dispatchOperation', [expect.objectContaining({ action: 'set_name', uuid: 'u1', name: 'NewName' })]);
  });

  it('set_active calls dispatchOperation', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));
    const result = await server.callTool('scene_operation', { action: 'set_active', uuid: 'u1', active: false });
    expect(result.isError).toBeFalsy();
    expect(sceneMethod).toHaveBeenCalledWith('dispatchOperation', [expect.objectContaining({ action: 'set_active', uuid: 'u1' })]);
  });

  it('add_component calls dispatchOperation', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));
    const result = await server.callTool('scene_operation', { action: 'add_component', uuid: 'u1', component: 'Sprite' });
    expect(result.isError).toBeFalsy();
    expect(sceneMethod).toHaveBeenCalledWith('dispatchOperation', [expect.objectContaining({ action: 'add_component', uuid: 'u1', component: 'Sprite' })]);
  });

  it('remove_component calls dispatchOperation', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));
    const result = await server.callTool('scene_operation', { action: 'remove_component', uuid: 'u1', component: 'Sprite' });
    expect(result.isError).toBeFalsy();
    expect(sceneMethod).toHaveBeenCalledWith('dispatchOperation', [expect.objectContaining({ action: 'remove_component' })]);
  });

  it('set_property calls dispatchOperation', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));
    const result = await server.callTool('scene_operation', { action: 'set_property', uuid: 'u1', component: 'Label', property: 'string', value: 'Hello' });
    expect(result.isError).toBeFalsy();
    expect(sceneMethod).toHaveBeenCalledWith('dispatchOperation', [expect.objectContaining({ action: 'set_property' })]);
  });

  it('reset_property calls editorMsg reset-property', async () => {
    const editorMsg = vi.fn().mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ editorMsg }));
    const result = await server.callTool('scene_operation', { action: 'reset_property', uuid: 'u1', component: 'Label', property: 'string' });
    expect(result.isError).toBeFalsy();
    expect(editorMsg).toHaveBeenCalledWith('scene', 'reset-property', { uuid: 'u1', path: 'Label.string' });
  });

  it('duplicate_node calls dispatchOperation', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ success: true, clonedUuid: 'cloned-1' });
    const editorMsg = vi.fn().mockResolvedValue({});
    const bridgePost = vi.fn().mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg, bridgePost }));
    const result = await server.callTool('scene_operation', { action: 'duplicate_node', uuid: 'u1' });
    expect(result.isError).toBeFalsy();
    expect(sceneMethod).toHaveBeenCalledWith('dispatchOperation', [expect.objectContaining({ action: 'duplicate_node', uuid: 'u1' })]);
  });

  it('move_node_up calls dispatchOperation', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));
    const result = await server.callTool('scene_operation', { action: 'move_node_up', uuid: 'u1' });
    expect(result.isError).toBeFalsy();
    expect(sceneMethod).toHaveBeenCalledWith('dispatchOperation', [expect.objectContaining({ action: 'move_node_up' })]);
  });

  it('move_node_down calls dispatchOperation', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));
    const result = await server.callTool('scene_operation', { action: 'move_node_down', uuid: 'u1' });
    expect(result.isError).toBeFalsy();
    expect(sceneMethod).toHaveBeenCalledWith('dispatchOperation', [expect.objectContaining({ action: 'move_node_down' })]);
  });

  it('set_sibling_index calls dispatchOperation', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));
    const result = await server.callTool('scene_operation', { action: 'set_sibling_index', uuid: 'u1', index: 2 });
    expect(result.isError).toBeFalsy();
    expect(sceneMethod).toHaveBeenCalledWith('dispatchOperation', [expect.objectContaining({ action: 'set_sibling_index' })]);
  });

  const simpleUuidOps = [
    'lock_node', 'unlock_node', 'hide_node', 'unhide_node',
  ];
  for (const action of simpleUuidOps) {
    it(`${action} calls dispatchOperation`, async () => {
      const sceneMethod = vi.fn().mockResolvedValue({ success: true });
      const server = buildCocosToolServer(makeCtx({ sceneMethod }));
      const result = await server.callTool('scene_operation', { action, uuid: 'u1' });
      expect(result.isError).toBeFalsy();
      expect(sceneMethod).toHaveBeenCalledWith('dispatchOperation', [expect.objectContaining({ action, uuid: 'u1' })]);
    });
  }

  it('set_layer calls dispatchOperation', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));
    const result = await server.callTool('scene_operation', { action: 'set_layer', uuid: 'u1', layer: 33554432 });
    expect(result.isError).toBeFalsy();
    expect(sceneMethod).toHaveBeenCalledWith('dispatchOperation', [expect.objectContaining({ action: 'set_layer' })]);
  });

  it('call_component_method calls editorMsg execute-component-method', async () => {
    const editorMsg = vi.fn().mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ editorMsg }));
    const result = await server.callTool('scene_operation', { action: 'call_component_method', uuid: 'u1', component: 'Animation', methodName: 'play' });
    expect(result.isError).toBeFalsy();
    expect(editorMsg).toHaveBeenCalledWith('scene', 'execute-component-method', {
      uuid: 'u1', component: 'Animation', method: 'play', args: [],
    });
  });

  it('clear_children blocked without confirmDangerous', async () => {
    const server = buildCocosToolServer(makeCtx());
    const result = await server.callTool('scene_operation', { action: 'clear_children', uuid: 'u1' });
    expect(result.isError).toBe(true);
  });

  it('clear_children queries children then calls editorMsg remove-node for each', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ children: [{ uuid: 'c1' }, { uuid: 'c2' }] });
    const editorMsg = vi.fn().mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg }));
    const result = await server.callTool('scene_operation', { action: 'clear_children', uuid: 'u1', confirmDangerous: true });
    expect(result.isError).toBeFalsy();
    expect(sceneMethod).toHaveBeenCalledWith('dispatchQuery', [{ action: 'get_children', uuid: 'u1' }]);
    expect(editorMsg).toHaveBeenCalledWith('scene', 'remove-node', { uuid: 'c1' });
    expect(editorMsg).toHaveBeenCalledWith('scene', 'remove-node', { uuid: 'c2' });
  });
});

describe('scene_operation — prefab & clipboard actions (editorMsg)', () => {
  it('create_prefab calls editorMsg scene create-prefab', async () => {
    const editorMsg = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ editorMsg }));
    const result = await server.callTool('scene_operation', { action: 'create_prefab', uuid: 'u1', savePath: 'db://assets/prefabs/Test.prefab' });
    expect(result.isError).toBeFalsy();
    expect(editorMsg).toHaveBeenCalledWith('scene', 'create-prefab', 'u1', 'db://assets/prefabs/Test.prefab');
  });

  it('clipboard_copy 透传 dispatchOperation', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));
    const result = await server.callTool('scene_operation', { action: 'clipboard_copy', uuid: 'u1' });
    expect(result.isError).toBeFalsy();
    expect(sceneMethod).toHaveBeenCalledWith('dispatchOperation', [expect.objectContaining({ action: 'clipboard_copy', uuid: 'u1' })]);
  });

  it('clipboard_paste 透传 dispatchOperation', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));
    const result = await server.callTool('scene_operation', { action: 'clipboard_paste', parentUuid: 'u1' });
    expect(result.isError).toBeFalsy();
    expect(sceneMethod).toHaveBeenCalledWith('dispatchOperation', [expect.objectContaining({ action: 'clipboard_paste', parentUuid: 'u1' })]);
  });

  it('instantiate_prefab calls editorMsg', async () => {
    const editorMsg = vi.fn().mockResolvedValue('prefab-uuid');
    const server = buildCocosToolServer(makeCtx({ editorMsg }));
    const result = await server.callTool('scene_operation', { action: 'instantiate_prefab', prefabUrl: 'db://assets/prefabs/P.prefab' });
    expect(result.isError).toBeFalsy();
    expect(editorMsg).toHaveBeenCalledWith('asset-db', 'query-uuid', 'db://assets/prefabs/P.prefab');
  });

  it('apply_prefab calls editorMsg', async () => {
    const editorMsg = vi.fn().mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ editorMsg }));
    const result = await server.callTool('scene_operation', { action: 'apply_prefab', uuid: 'u1' });
    expect(result.isError).toBeFalsy();
    expect(editorMsg).toHaveBeenCalledWith('scene', 'apply-prefab', 'u1');
  });

  it('restore_prefab calls editorMsg', async () => {
    const editorMsg = vi.fn().mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ editorMsg }));
    const result = await server.callTool('scene_operation', { action: 'restore_prefab', uuid: 'u1' });
    expect(result.isError).toBeFalsy();
    expect(editorMsg).toHaveBeenCalledWith('scene', 'restore-prefab', 'u1');
  });

  it('validate_prefab calls editorMsg query-asset-info and query-asset-dependencies', async () => {
    const editorMsg = vi.fn()
      .mockResolvedValueOnce({ url: 'db://assets/prefabs/P.prefab' })
      .mockResolvedValueOnce([]);
    const server = buildCocosToolServer(makeCtx({ editorMsg }));
    const result = await server.callTool('scene_operation', { action: 'validate_prefab', prefabUrl: 'db://assets/prefabs/P.prefab' });
    expect(result.isError).toBeFalsy();
    const data = parse(result);
    expect(data.valid).toBe(true);
  });
});

describe('scene_operation — NEW_SCENE_OPS (dispatchOperation with fallback)', () => {
  const newSceneOps: Array<{ action: string; params: Record<string, unknown> }> = [
    { action: 'batch', params: { operations: [{ action: 'set_name', uuid: 'u', name: 'N' }] } },
    { action: 'create_ui_widget', params: { widgetType: 'button' } },
    { action: 'setup_particle', params: {} },
    { action: 'align_nodes', params: { uuids: ['a', 'b'], alignment: 'left' } },
    { action: 'audio_setup', params: { uuid: 'u1' } },
    { action: 'setup_physics_world', params: {} },
    { action: 'create_skeleton_node', params: { skeletonType: 'spine' } },
    { action: 'generate_tilemap', params: {} },
    { action: 'create_primitive', params: { type: 'box' } },
    { action: 'set_camera_look_at', params: { uuid: 'u1', targetX: 0, targetY: 0, targetZ: 0 } },
    { action: 'set_camera_property', params: { uuid: 'u1' } },
    { action: 'create_camera', params: {} },
    { action: 'set_material_property', params: { uuid: 'u1', uniforms: { mainColor: { r: 255, g: 0, b: 0, a: 255 } } } },
    { action: 'assign_builtin_material', params: { uuid: 'u1' } },
    { action: 'bind_event', params: { uuid: 'u1', eventType: 'click', component: 'MyScript', handler: 'onClick' } },
    { action: 'unbind_event', params: { uuid: 'u1', eventType: 'click' } },
    { action: 'list_events', params: { uuid: 'u1' } },
    // reset_transform and reset_node_properties use editorMsg IPC — tested separately below
    { action: 'set_anchor_point', params: { uuid: 'u1' } },
    { action: 'set_content_size', params: { uuid: 'u1', width: 100, height: 50 } },
    { action: 'batch_set_property', params: { uuids: ['a', 'b'], component: 'Label', property: 'string', value: 'Hi' } },
    { action: 'group_nodes', params: { uuids: ['a', 'b'] } },
    { action: 'create_light', params: { lightType: 'directional' } },
    { action: 'set_light_property', params: { uuid: 'u1' } },
    { action: 'set_scene_environment', params: { subsystem: 'ambient' } },
    { action: 'set_material_define', params: { uuid: 'u1', defines: { USE_ALBEDO_MAP: true } } },
    { action: 'assign_project_material', params: { uuid: 'u1', materialUrl: 'db://assets/materials/Wood.mtl' } },
    { action: 'clone_material', params: { uuid: 'u1' } },
    { action: 'swap_technique', params: { uuid: 'u1', technique: 1 } },
    { action: 'sprite_grayscale', params: { uuid: 'u1' } },
    { action: 'camera_screenshot', params: {} },
    { action: 'attach_script', params: { uuid: 'u1', script: 'PlayerCtrl' } },
    { action: 'set_component_properties', params: { uuid: 'u1', component: 'Label', properties: { string: 'Hi' } } },
    { action: 'detach_script', params: { uuid: 'u1', script: 'PlayerCtrl' } },
    { action: 'ensure_2d_canvas', params: { confirmCreateCanvas: true } },
  ];

  for (const { action, params } of newSceneOps) {
    it(`${action} calls dispatchOperation`, async () => {
      const sceneMethod = vi.fn().mockResolvedValue({ success: true });
      const server = buildCocosToolServer(makeCtx({ sceneMethod }));
      const result = await server.callTool('scene_operation', { action, ...params });
      expect(result.isError).toBeFalsy();
      expect(sceneMethod).toHaveBeenCalledWith('dispatchOperation', [expect.objectContaining({ action })]);
    });
  }

  it('batch preserves operations payload for dispatchOperation', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));
    const operations = [{ action: 'set_name', uuid: 'u', name: 'N' }];

    const result = await server.callTool('scene_operation', { action: 'batch', operations });

    expect(result.isError).toBeFalsy();
    expect(sceneMethod).toHaveBeenCalledWith('dispatchOperation', [
      expect.objectContaining({ action: 'batch', operations }),
    ]);
  });

  it('reset_transform calls dispatchOperation（场景内通过 set-property 重置变换，非 editorMsg reset-node）', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({
      success: true,
      uuid: 'u1',
      name: 'N',
      reset: { position: true, rotation: true, scale: true },
    });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));
    const result = await server.callTool('scene_operation', { action: 'reset_transform', uuid: 'u1' });
    expect(result.isError).toBeFalsy();
    expect(sceneMethod).toHaveBeenCalledWith('dispatchOperation', [expect.objectContaining({ action: 'reset_transform', uuid: 'u1' })]);
  });

  it('reset_node_properties queries components then calls editorMsg reset-component', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ components: [{ type: 'cc.Sprite' }, { type: 'cc.Label' }] });
    const editorMsg = vi.fn().mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg }));
    const result = await server.callTool('scene_operation', { action: 'reset_node_properties', uuid: 'u1' });
    expect(result.isError).toBeFalsy();
    expect(sceneMethod).toHaveBeenCalledWith('dispatchQuery', [{ action: 'get_components', uuid: 'u1' }]);
    expect(editorMsg).toHaveBeenCalledWith('scene', 'reset-component', { uuid: 'u1', component: 'cc.Sprite' });
    expect(editorMsg).toHaveBeenCalledWith('scene', 'reset-component', { uuid: 'u1', component: 'cc.Label' });
  });

  it('exception in scene_operation returns error', async () => {
    const sceneMethod = vi.fn().mockRejectedValue(new Error('scene crashed'));
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));
    const result = await server.callTool('scene_operation', { action: 'create_node', name: 'Fail' });
    expect(result.isError).toBe(true);
    const data = parse(result);
    expect(data.error).toContain('scene crashed');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ensure_2d_canvas — 幂等 2D Canvas 创建
// ═══════════════════════════════════════════════════════════════════════════════
describe('scene_operation — ensure_2d_canvas', () => {
  it('场景已有 Canvas 时返回已有 UUID，不创建新的', async () => {
    const sceneMethod = vi.fn()
      .mockResolvedValueOnce({ error: '未知的操作 action: ensure_2d_canvas' }) // dispatchOperation fallback trigger
      .mockResolvedValueOnce({ canvases: [{ uuid: 'existing-canvas', name: 'Canvas', path: '/Canvas' }] }) // get_canvas_info
      .mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));

    const result = await server.callTool('scene_operation', { action: 'ensure_2d_canvas', confirmCreateCanvas: true });
    expect(result.isError).toBeFalsy();
    const data = parse(result);
    expect(data.canvasUuid).toBe('existing-canvas');
    expect(data.created).toBe(false);
  });

  it('场景无 Canvas 时创建新的 Canvas + Camera', async () => {
    let callCount = 0;
    const sceneMethod = vi.fn().mockImplementation((method: string, args: unknown[]) => {
      callCount++;
      if (callCount === 1) return Promise.resolve({ error: '未知的操作 action: ensure_2d_canvas' }); // fallback trigger
      const params = Array.isArray(args) ? args[0] as Record<string, unknown> : {};
      if (method === 'dispatchQuery' && params.action === 'get_canvas_info') {
        return Promise.resolve({ canvases: [] });
      }
      return Promise.resolve({ success: true });
    });
    const editorMsg = vi.fn().mockImplementation((module: string, message: string, ...args: unknown[]) => {
      if (module === 'scene' && message === 'create-node') {
        const params = args[0] as Record<string, unknown>;
        if (!params?.parent) return Promise.resolve({ uuid: 'new-canvas-uuid' }); // Canvas 节点
        return Promise.resolve({ uuid: 'new-camera-uuid' }); // Camera 子节点
      }
      return Promise.resolve({});
    });
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg }));

    const result = await server.callTool('scene_operation', { action: 'ensure_2d_canvas', confirmCreateCanvas: true });
    expect(result.isError).toBeFalsy();
    const data = parse(result);
    expect(data.canvasUuid).toBe('new-canvas-uuid');
    expect(data.created).toBe(true);
    expect(data.layer).toBe(33554432);
    expect(data.camera.projection).toBe('ortho');
  });

  it('自定义 designHeight 影响 orthoHeight', async () => {
    let callCount = 0;
    const sceneMethod = vi.fn().mockImplementation((method: string, args: unknown[]) => {
      callCount++;
      if (callCount === 1) return Promise.resolve({ error: '未知的操作 action: ensure_2d_canvas' });
      const params = Array.isArray(args) ? args[0] as Record<string, unknown> : {};
      if (method === 'dispatchQuery' && params.action === 'get_canvas_info') {
        return Promise.resolve({ canvases: [] });
      }
      return Promise.resolve({ success: true });
    });
    const editorMsg = vi.fn().mockImplementation((module: string, message: string, ...args: unknown[]) => {
      if (module === 'scene' && message === 'create-node') {
        const params = args[0] as Record<string, unknown>;
        if (!params?.parent) return Promise.resolve({ uuid: 'canvas-uuid' });
        return Promise.resolve({ uuid: 'camera-uuid' });
      }
      return Promise.resolve({});
    });
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg }));

    const result = await server.callTool('scene_operation', { action: 'ensure_2d_canvas', confirmCreateCanvas: true, designHeight: 1280 });
    const data = parse(result);
    expect(data.camera.orthoHeight).toBe(640);
  });

  it('忽略 Editor Scene Background 中的 Canvas', async () => {
    const sceneMethod = vi.fn()
      .mockResolvedValueOnce({ error: '未知的操作 action: ensure_2d_canvas' })
      .mockResolvedValueOnce({ canvases: [{ uuid: 'editor-canvas', name: 'Reference-Image-Canvas', path: '/Editor Scene Background/Reference-Image-Canvas' }] })
      .mockResolvedValue({ success: true });
    const editorMsg = vi.fn().mockImplementation((module: string, message: string, ...args: unknown[]) => {
      if (module === 'scene' && message === 'create-node') {
        const params = args[0] as Record<string, unknown>;
        if (!params?.parent) return Promise.resolve({ uuid: 'new-canvas' });
        return Promise.resolve({ uuid: 'new-camera' });
      }
      return Promise.resolve({});
    });
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg }));

    const result = await server.callTool('scene_operation', { action: 'ensure_2d_canvas', confirmCreateCanvas: true });
    const data = parse(result);
    expect(data.created).toBe(true);
  });
});
