import { describe, it, expect, vi } from 'vitest';
import { buildCocosToolServer } from '../../src/mcp/tools';
import type { BridgeToolContext, ToolCallResult } from '../../src/mcp/tools-shared';

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
