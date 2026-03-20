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

// reference_image — Pro exclusive (社区版边界)
describe('reference_image tool — community guardrail', () => {
  it('reference_image tool is not registered in community edition', () => {
    const server = buildCocosToolServer(makeCtx());
    const names = server.listTools().map((t) => t.name);
    expect(names).not.toContain('reference_image');
  });

  it('calling reference_image returns isError in community edition', async () => {
    const server = buildCocosToolServer(makeCtx());
    const result = await server.callTool('reference_image', { action: 'list' });
    expect(result.isError).toBe(true);
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
