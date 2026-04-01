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

describe('execute_script', () => {
  it('calls sceneMethod with method and args', async () => {
    const ctx = makeCtx();
    const server = buildCocosToolServer(ctx);
    await server.callTool('execute_script', { method: 'dispatchQuery', args: [{ action: 'tree' }] });
    expect(ctx.sceneMethod).toHaveBeenCalledWith('dispatchQuery', [{ action: 'tree' }]);
  });

  it('query-like methods ignore persistenceMode and do not save scene', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const ctx = makeCtx({ bridgePost });
    const server = buildCocosToolServer(ctx);

    const result = await server.callTool('execute_script', {
      method: 'dispatchQuery',
      args: [{ action: 'tree' }],
      persistenceMode: 'auto-save',
    });

    expect(result.isError).toBeUndefined();
    expect(ctx.sceneMethod).toHaveBeenCalledWith('dispatchQuery', [{ action: 'tree' }]);
    expect(bridgePost).not.toHaveBeenCalledWith('/api/editor/save-scene', { force: false });
  });

  it('handles missing args gracefully', async () => {
    const ctx = makeCtx();
    const server = buildCocosToolServer(ctx);
    await server.callTool('execute_script', { method: 'getSceneTree' });
    expect(ctx.sceneMethod).toHaveBeenCalledWith('getSceneTree', []);
  });

  it('mutating methods with persistenceMode auto-save save scene and return persistenceStatus', async () => {
    const queryDirtyResults = [false, true, false];
    const editorMsg = vi.fn().mockImplementation(async (_module: string, action: string) => {
      if (action === 'query-dirty') return queryDirtyResults.shift() ?? false;
      return {};
    });
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const ctx = makeCtx({ editorMsg, bridgePost });
    const server = buildCocosToolServer(ctx);

    const result = await server.callTool('execute_script', {
      method: 'setNodePosition',
      args: ['node-1', 10, 20, 0],
      persistenceMode: 'auto-save',
    });

    const data = parse(result);
    expect(result.isError).toBeUndefined();
    expect(ctx.sceneMethod).toHaveBeenCalledWith('setNodePosition', ['node-1', 10, 20, 0]);
    expect(data.persistenceStatus).toEqual(expect.objectContaining({
      mode: 'auto-save',
      target: expect.objectContaining({ kind: 'scene' }),
      requiresPersistence: true,
      saveAttempted: true,
      saveSucceeded: true,
    }));
    expect(bridgePost).toHaveBeenCalledWith('/api/editor/save-scene', { force: false });
  });

  it('returns error on exception', async () => {
    const ctx = makeCtx({ sceneMethod: vi.fn().mockRejectedValue(new Error('script error')) });
    const server = buildCocosToolServer(ctx);
    const result = await server.callTool('execute_script', { method: 'bad' });
    expect(parse(result).error).toContain('script error');
    expect(result.isError).toBe(true);
  });
});

describe('register_custom_macro', () => {
  it('registers a macro with allowed method', async () => {
    const ctx = makeCtx();
    const server = buildCocosToolServer(ctx);
    const result = await server.callTool('register_custom_macro', {
      name: 'test_macro',
      description: 'A test macro',
      sceneMethodName: 'getSceneTree',
    });
    const data = parse(result);
    expect(data.success).toBe(true);
    expect(data.message).toContain('macro_test_macro');
  });

  it('rejects disallowed method', async () => {
    const ctx = makeCtx();
    const server = buildCocosToolServer(ctx);
    const result = await server.callTool('register_custom_macro', {
      name: 'bad_macro',
      description: 'Should fail',
      sceneMethodName: 'dangerousMethod',
    });
    const data = parse(result);
    expect(data.error).toContain('不在允许列表中');
  });

  it('registered macro can be called', async () => {
    const ctx = makeCtx();
    const server = buildCocosToolServer(ctx);
    await server.callTool('register_custom_macro', {
      name: 'callable_macro',
      description: 'Test',
      sceneMethodName: 'dispatchQuery',
    });
    const result = await server.callTool('macro_callable_macro', {
      args: [{ action: 'tree' }],
    });
    expect(ctx.sceneMethod).toHaveBeenCalledWith('dispatchQuery', [{ action: 'tree' }]);
    expect(result.content[0].text).toBeDefined();
  });

  it('registered macro handles errors', async () => {
    const ctx = makeCtx({ sceneMethod: vi.fn().mockRejectedValue(new Error('macro fail')) });
    const server = buildCocosToolServer(ctx);
    await server.callTool('register_custom_macro', {
      name: 'err_macro',
      description: 'Test',
      sceneMethodName: 'getSceneTree',
    });
    const result = await server.callTool('macro_err_macro', { args: [] });
    expect(parse(result).error).toContain('macro fail');
  });
});
