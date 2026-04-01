import { describe, it, expect, vi } from 'vitest';
import { buildCocosToolServer } from '../../src/mcp/tools';
import type { BridgeToolContext, ToolCallResult } from '../../src/mcp/tools-shared';

function makeCtx(overrides: Partial<BridgeToolContext> = {}): BridgeToolContext {
  return {
    bridgeGet: vi.fn().mockResolvedValue({}),
    bridgePost: vi.fn().mockResolvedValue({ success: true }),
    sceneMethod: vi.fn().mockResolvedValue({ success: true }),
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

describe('physics_tool', () => {
  it('get_collider_info dispatches query', async () => {
    const ctx = makeCtx();
    const server = buildCocosToolServer(ctx);
    await server.callTool('physics_tool', { action: 'get_collider_info', uuid: 'node-1' });
    expect(ctx.sceneMethod).toHaveBeenCalledWith('dispatchQuery', [{ action: 'get_collider_info', uuid: 'node-1' }]);
  });

  it('add_collider maps type to component name', async () => {
    const ctx = makeCtx();
    const server = buildCocosToolServer(ctx);
    await server.callTool('physics_tool', { action: 'add_collider', uuid: 'n1', colliderType: 'box2d' });
    expect(ctx.sceneMethod).toHaveBeenCalledWith('dispatchOperation', [expect.objectContaining({ component: 'BoxCollider2D' })]);
  });

  it('add_collider on prefab-like node returns apply/save warnings when dirty', async () => {
    const editorMsg = vi.fn().mockImplementation(async (_module: string, action: string) => {
      if (action === 'query-dirty') return true;
      if (action === 'query-node') return { value: { name: { value: 'Node' } }, _prefab: { assetUuid: 'prefab-1' } };
      return {};
    });
    const ctx = makeCtx({ editorMsg });
    const server = buildCocosToolServer(ctx);
    const result = await server.callTool('physics_tool', { action: 'add_collider', uuid: 'n1', colliderType: 'box2d' });
    const data = parse(result);
    expect(data.warnings).toContain('当前场景存在未保存修改；如需在重开编辑器后保留，请调用 editor_action.save_scene。');
    expect(data.warnings).toContain('检测到目标可能属于 Prefab 实例。若要把当前实例修改回写到预制体资源，请调用 scene_operation.apply_prefab；若需确保重开编辑器后仍保留，再调用 editor_action.save_scene。');
  });

  it('add_collider with persistenceMode auto-save saves scene and returns persistenceStatus', async () => {
    const queryDirtyResults = [false, true, false];
    const editorMsg = vi.fn().mockImplementation(async (_module: string, action: string) => {
      if (action === 'query-dirty') return queryDirtyResults.shift() ?? false;
      if (action === 'query-node') return { value: { name: { value: 'Node' } } };
      return {};
    });
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const ctx = makeCtx({ editorMsg, bridgePost });
    const server = buildCocosToolServer(ctx);

    const result = await server.callTool('physics_tool', {
      action: 'add_collider',
      uuid: 'n1',
      colliderType: 'box2d',
      persistenceMode: 'auto-save',
    });

    const data = parse(result);
    expect(result.isError).toBeUndefined();
    expect(data.persistenceStatus).toEqual(expect.objectContaining({
      mode: 'auto-save',
      requiresPersistence: true,
      saveAttempted: true,
      saveSucceeded: true,
    }));
    expect(bridgePost).toHaveBeenCalledWith('/api/editor/save-scene', { force: false });
  });

  it('add_collider with persistenceMode strict fails when tracked dirty write cannot be saved', async () => {
    const queryDirtyResults = [false, true, true];
    const editorMsg = vi.fn().mockImplementation(async (_module: string, action: string) => {
      if (action === 'query-dirty') return queryDirtyResults.shift() ?? true;
      if (action === 'query-node') return { value: { name: { value: 'Node' } } };
      return {};
    });
    const bridgePost = vi.fn().mockResolvedValue({ success: false, error: 'save failed' });
    const ctx = makeCtx({ editorMsg, bridgePost });
    const server = buildCocosToolServer(ctx);

    const result = await server.callTool('physics_tool', {
      action: 'add_collider',
      uuid: 'n1',
      colliderType: 'box2d',
      persistenceMode: 'strict',
    });

    const data = parse(result);
    expect(result.isError).toBe(true);
    expect(data.error).toContain('strict');
    expect(data.persistenceStatus).toEqual(expect.objectContaining({
      mode: 'strict',
      guarantee: 'tracked',
      saveAttempted: true,
      saveSucceeded: false,
    }));
    expect(bridgePost).toHaveBeenCalledWith('/api/editor/save-scene', { force: false });
  });

  it('add_collider returns error for unknown type', async () => {
    const ctx = makeCtx();
    const server = buildCocosToolServer(ctx);
    const result = await server.callTool('physics_tool', { action: 'add_collider', uuid: 'n1', colliderType: 'unknown_type' });
    const data = parse(result);
    expect(data.error).toContain('未知 colliderType');
  });

  for (const type of ['box2d', 'circle2d', 'polygon2d', 'capsule2d', 'box3d', 'sphere3d', 'capsule3d']) {
    it(`add_collider supports ${type}`, async () => {
      const ctx = makeCtx();
      const server = buildCocosToolServer(ctx);
      const result = await server.callTool('physics_tool', { action: 'add_collider', uuid: 'n', colliderType: type });
      expect(result.isError).toBeUndefined();
    });
  }

  it('add_rigidbody defaults to 2D', async () => {
    const ctx = makeCtx();
    const server = buildCocosToolServer(ctx);
    await server.callTool('physics_tool', { action: 'add_rigidbody', uuid: 'n1' });
    expect(ctx.sceneMethod).toHaveBeenCalledWith('dispatchOperation', [expect.objectContaining({ component: 'RigidBody2D' })]);
  });

  it('add_rigidbody with is2d=false uses 3D', async () => {
    const ctx = makeCtx();
    const server = buildCocosToolServer(ctx);
    await server.callTool('physics_tool', { action: 'add_rigidbody', uuid: 'n1', is2d: false });
    expect(ctx.sceneMethod).toHaveBeenCalledWith('dispatchOperation', [expect.objectContaining({ component: 'RigidBody' })]);
  });

  it('add_rigidbody sets bodyType when provided', async () => {
    const ctx = makeCtx();
    const server = buildCocosToolServer(ctx);
    await server.callTool('physics_tool', { action: 'add_rigidbody', uuid: 'n1', bodyType: 'Static' });
    expect(ctx.sceneMethod).toHaveBeenCalledTimes(2);
  });

  for (const action of ['set_collider_size', 'set_rigidbody_props', 'set_physics_material', 'set_collision_group', 'add_joint']) {
    it(`${action} dispatches to physics action`, async () => {
      const ctx = makeCtx();
      const server = buildCocosToolServer(ctx);
      const extra: Record<string, unknown> = {};
      if (action === 'set_collision_group') extra.group = 1;
      if (action === 'add_joint') extra.jointType = 'distance';
      await server.callTool('physics_tool', { action, uuid: 'n1', ...extra });
      expect(ctx.sceneMethod).toHaveBeenCalled();
    });
  }

  it('get_physics_world dispatches without uuid', async () => {
    const ctx = makeCtx();
    const server = buildCocosToolServer(ctx);
    await server.callTool('physics_tool', { action: 'get_physics_world' });
    expect(ctx.sceneMethod).toHaveBeenCalledWith('dispatchPhysicsAction', [{ action: 'get_physics_world' }]);
  });

  it('set_physics_world dispatches operation', async () => {
    const ctx = makeCtx();
    const server = buildCocosToolServer(ctx);
    await server.callTool('physics_tool', { action: 'set_physics_world', gravity: { x: 0, y: -20 } });
    expect(ctx.sceneMethod).toHaveBeenCalledWith('dispatchOperation', [expect.objectContaining({ action: 'setup_physics_world' })]);
  });

  it('unknown action returns error', async () => {
    const ctx = makeCtx();
    const server = buildCocosToolServer(ctx);
    const result = await server.callTool('physics_tool', { action: 'nonexistent', uuid: 'n' });
    expect(parse(result).error).toContain('未知');
  });

  it('handles exception gracefully', async () => {
    const ctx = makeCtx({ sceneMethod: vi.fn().mockRejectedValue(new Error('physics crash')) });
    const server = buildCocosToolServer(ctx);
    const result = await server.callTool('physics_tool', { action: 'get_collider_info', uuid: 'n' });
    expect(parse(result).error).toContain('physics crash');
    expect(result.isError).toBe(true);
  });
});
