import { describe, expect, it, vi } from 'vitest';
import { buildCocosToolServer, type BridgeToolContext } from '../../src/mcp/tools';
import type { ToolCallResult } from '../../src/mcp/local-tool-server';
import { beginSceneRecording, endSceneRecording } from '../../src/mcp/tools-shared';

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

describe('recording transaction helpers', () => {
  it('beginSceneRecording normalizes targets and returns token', async () => {
    const editorMsg = vi.fn().mockResolvedValue('undo-token');

    const token = await beginSceneRecording(editorMsg, [' node-1 ', '', null, 'node-2']);

    expect(token).toBe('undo-token');
    expect(editorMsg).toHaveBeenCalledWith('scene', 'begin-recording', ['node-1', 'node-2'], null);
  });

  it('endSceneRecording sends returned token back to scene', async () => {
    const editorMsg = vi.fn().mockResolvedValue(undefined);

    await endSceneRecording(editorMsg, 'undo-token');

    expect(editorMsg).toHaveBeenCalledWith('scene', 'end-recording', 'undo-token');
  });
});

describe('scene recording transaction wiring', () => {
  it('instantiate_prefab wraps scene transaction with recording targets and token', async () => {
    const sceneMethod = vi.fn().mockImplementation((method: string) => {
      if (method === 'dispatchQuery') return Promise.resolve({ uuid: 'scene-root' });
      if (method === 'instantiatePrefab') return Promise.resolve({ success: true, uuid: 'inst-uuid' });
      return Promise.resolve({ success: true });
    });
    const editorMsg = vi.fn().mockImplementation((module: string, message: string, ...args: unknown[]) => {
      if (module === 'asset-db' && message === 'query-uuid') return Promise.resolve('prefab-uuid');
      if (module === 'scene' && message === 'begin-recording') {
        const targets = Array.isArray(args[0]) ? args[0] as string[] : [];
        if (targets[0] === 'scene-root') return Promise.resolve('record-root');
        if (targets[0] === 'inst-uuid') return Promise.resolve('record-instance');
      }
      if (module === 'scene' && message === 'query-node') {
        return Promise.resolve({ value: { name: { value: 'InstantiatedPrefab' } } });
      }
      return Promise.resolve({});
    });
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg }));

    const result = await server.callTool('scene_operation', {
      action: 'instantiate_prefab',
      prefabUrl: 'db://assets/prefabs/P.prefab',
    });

    expect(result.isError).toBeFalsy();
    const data = parse(result);
    expect(data.success).toBe(true);
    expect(editorMsg).toHaveBeenCalledWith('scene', 'begin-recording', ['scene-root'], null);
    expect(editorMsg).toHaveBeenCalledWith('scene', 'begin-recording', ['inst-uuid'], null);
    expect(editorMsg).toHaveBeenCalledWith('scene', 'end-recording', 'record-instance');
    expect(editorMsg).toHaveBeenCalledWith('scene', 'end-recording', 'record-root');
  });

  it('ensure_2d_canvas fallback path still wraps creation in a recording transaction', async () => {
    const sceneMethod = vi.fn().mockImplementation((method: string, args: unknown[]) => {
      const params = Array.isArray(args) ? args[0] as Record<string, unknown> : {};
      if (method === 'dispatchOperation' && params.action === 'ensure_2d_canvas') {
        return Promise.resolve({ error: '未知的操作 action: ensure_2d_canvas' });
      }
      if (method === 'dispatchQuery' && params.action === 'get_canvas_info') {
        return Promise.resolve({ canvases: [] });
      }
      return Promise.resolve({ success: true });
    });
    const editorMsg = vi.fn().mockImplementation((module: string, message: string, ...args: unknown[]) => {
      if (module === 'scene' && message === 'begin-recording') return Promise.resolve('record-canvas');
      if (module === 'scene' && message === 'create-node') {
        const payload = args[0] as Record<string, unknown>;
        if (payload?.name === 'Canvas') return Promise.resolve({ uuid: 'canvas-uuid' });
        if (payload?.name === 'Camera') return Promise.resolve({ uuid: 'camera-uuid' });
      }
      return Promise.resolve({});
    });
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg }));

    const result = await server.callTool('scene_operation', {
      action: 'ensure_2d_canvas',
      confirmCreateCanvas: true,
    });

    expect(result.isError).toBeFalsy();
    const data = parse(result);
    expect(data.created).toBe(true);
    expect(data.canvasUuid).toBe('canvas-uuid');
    expect(editorMsg).toHaveBeenCalledWith('scene', 'begin-recording', [], null);
    expect(editorMsg).toHaveBeenCalledWith('scene', 'end-recording', 'record-canvas');
  });

  it('physics_tool physics-action writes use node uuid as recording target', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ success: true });
    const editorMsg = vi.fn().mockImplementation((module: string, message: string, ...args: unknown[]) => {
      if (module === 'scene' && message === 'begin-recording') return Promise.resolve('record-physics');
      if (module === 'scene' && message === 'query-node') {
        return Promise.resolve({ value: { name: { value: 'PhysicsNode' } } });
      }
      return Promise.resolve({});
    });
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg }));

    const result = await server.callTool('physics_tool', {
      action: 'set_collider_size',
      uuid: 'node-physics',
      width: 100,
      height: 50,
    });

    expect(result.isError).toBeFalsy();
    expect(editorMsg).toHaveBeenCalledWith('scene', 'begin-recording', ['node-physics'], null);
    expect(editorMsg).toHaveBeenCalledWith('scene', 'end-recording', 'record-physics');
  });
});
