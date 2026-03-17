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

describe('preferences tool', () => {
  it('list action calls bridgeGet', async () => {
    const ctx = makeCtx({ bridgeGet: vi.fn().mockResolvedValue({ config: {} }) });
    const server = buildCocosToolServer(ctx);
    await server.callTool('preferences', { action: 'list' });
    expect(ctx.bridgeGet).toHaveBeenCalledWith('/api/preferences/get');
  });

  it('get action with key calls editorMsg (IPC primary)', async () => {
    const ctx = makeCtx({ editorMsg: vi.fn().mockResolvedValue('en') });
    const server = buildCocosToolServer(ctx);
    await server.callTool('preferences', { action: 'get', key: 'general.language' });
    expect(ctx.editorMsg).toHaveBeenCalled();
  });

  it('set action calls editorMsg (IPC primary)', async () => {
    const ctx = makeCtx({ editorMsg: vi.fn().mockResolvedValue(undefined) });
    const server = buildCocosToolServer(ctx);
    await server.callTool('preferences', { action: 'set', key: 'general.theme', value: 'dark' });
    expect(ctx.editorMsg).toHaveBeenCalled();
  });

  it('get_global falls back to bridgeGet on IPC failure', async () => {
    const ctx = makeCtx({
      editorMsg: vi.fn().mockRejectedValue(new Error('IPC unavailable')),
      bridgeGet: vi.fn().mockResolvedValue({ value: 42 }),
    });
    const server = buildCocosToolServer(ctx);
    await server.callTool('preferences', { action: 'get_global', key: 'test.key' });
    expect(ctx.bridgeGet).toHaveBeenCalled();
  });

  it('set_project falls back to bridgePost on IPC failure', async () => {
    const ctx = makeCtx({
      editorMsg: vi.fn().mockRejectedValue(new Error('IPC unavailable')),
      bridgePost: vi.fn().mockResolvedValue({ success: true }),
    });
    const server = buildCocosToolServer(ctx);
    await server.callTool('preferences', { action: 'set_project', key: 'test.key', value: true });
    expect(ctx.bridgePost).toHaveBeenCalled();
  });
});

describe('broadcast tool', () => {
  it('poll action calls bridgeGet', async () => {
    const ctx = makeCtx({ bridgeGet: vi.fn().mockResolvedValue({ events: [] }) });
    const server = buildCocosToolServer(ctx);
    await server.callTool('broadcast', { action: 'poll' });
    expect(ctx.bridgeGet).toHaveBeenCalled();
  });

  it('history action calls bridgeGet', async () => {
    const ctx = makeCtx({ bridgeGet: vi.fn().mockResolvedValue({ events: [] }) });
    const server = buildCocosToolServer(ctx);
    await server.callTool('broadcast', { action: 'history', limit: 10 });
    expect(ctx.bridgeGet).toHaveBeenCalled();
  });

  it('clear action calls bridgePost', async () => {
    const ctx = makeCtx();
    const server = buildCocosToolServer(ctx);
    await server.callTool('broadcast', { action: 'clear' });
    expect(ctx.bridgePost).toHaveBeenCalled();
  });

  it('send action calls bridgePost with channel', async () => {
    const ctx = makeCtx();
    const server = buildCocosToolServer(ctx);
    await server.callTool('broadcast', { action: 'send', channel: 'test-ch', data: { foo: 1 } });
    expect(ctx.bridgePost).toHaveBeenCalled();
  });

  it('send_ipc dispatches editor message', async () => {
    const ctx = makeCtx();
    const server = buildCocosToolServer(ctx);
    await server.callTool('broadcast', { action: 'send_ipc', module: 'scene', message: 'save-scene' });
    expect(ctx.editorMsg).toHaveBeenCalled();
  });
});

// reference_image — Pro exclusive (社区版已移除，测试在 Pro 版中运行)
describe.skip('reference_image tool — Pro exclusive', () => {
  it('set action calls bridgePost', async () => {
    const ctx = makeCtx();
    const server = buildCocosToolServer(ctx);
    await server.callTool('reference_image', { action: 'set', opacity: 0.5 });
    expect(ctx.bridgePost).toHaveBeenCalledWith('/api/reference-image/set', expect.objectContaining({ active: true }));
  });

  it('clear action calls bridgePost', async () => {
    const ctx = makeCtx();
    const server = buildCocosToolServer(ctx);
    await server.callTool('reference_image', { action: 'clear' });
    expect(ctx.bridgePost).toHaveBeenCalledWith('/api/reference-image/clear');
  });

  it('list action calls sceneMethod', async () => {
    const ctx = makeCtx();
    const server = buildCocosToolServer(ctx);
    await server.callTool('reference_image', { action: 'list' });
    expect(ctx.sceneMethod).toHaveBeenCalled();
  });

  it('add action requires imagePath', async () => {
    const ctx = makeCtx();
    const server = buildCocosToolServer(ctx);
    const result = await server.callTool('reference_image', { action: 'add' });
    expect(parse(result).error).toBeDefined();
  });

  it('add action with imagePath succeeds', async () => {
    const ctx = makeCtx();
    const server = buildCocosToolServer(ctx);
    await server.callTool('reference_image', { action: 'add', imagePath: 'db://assets/ref.png' });
    expect(ctx.sceneMethod).toHaveBeenCalled();
  });

  it('set_opacity action calls sceneMethod', async () => {
    const ctx = makeCtx();
    const server = buildCocosToolServer(ctx);
    await server.callTool('reference_image', { action: 'set_opacity', refUuid: 'ref-1', opacity: 0.8 });
    expect(ctx.sceneMethod).toHaveBeenCalled();
  });

  it('set_transform action calls sceneMethod', async () => {
    const ctx = makeCtx();
    const server = buildCocosToolServer(ctx);
    await server.callTool('reference_image', { action: 'set_transform', refUuid: 'ref-1', x: 100, y: 200 });
    expect(ctx.sceneMethod).toHaveBeenCalled();
  });
});

describe('tool_management', () => {
  it('list_all returns all tools', async () => {
    const ctx = makeCtx();
    const server = buildCocosToolServer(ctx);
    const result = await server.callTool('tool_management', { action: 'list_all' });
    const data = parse(result);
    expect(data.totalTools).toBeGreaterThan(0);
  });

  it('disable and enable a tool', async () => {
    const ctx = makeCtx();
    const server = buildCocosToolServer(ctx);
    await server.callTool('tool_management', { action: 'disable', toolName: 'animation_tool' });
    const listResult = await server.callTool('tool_management', { action: 'list_all' });
    const tools = (parse(listResult).tools as Array<{ name: string; enabled: boolean }>);
    expect(tools.find(t => t.name === 'animation_tool')?.enabled).toBe(false);

    await server.callTool('tool_management', { action: 'enable', toolName: 'animation_tool' });
  });

  it('cannot disable tool_management itself', async () => {
    const ctx = makeCtx();
    const server = buildCocosToolServer(ctx);
    const result = await server.callTool('tool_management', { action: 'disable', toolName: 'tool_management' });
    expect(parse(result).error).toBeDefined();
  });

  it('get_stats returns statistics', async () => {
    const ctx = makeCtx();
    const server = buildCocosToolServer(ctx);
    const result = await server.callTool('tool_management', { action: 'get_stats' });
    const data = parse(result);
    expect(data.totalTools).toBeGreaterThan(0);
  });
});
