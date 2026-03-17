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

describe('animation_tool', () => {
  const actions = [
    'create_clip', 'play', 'pause', 'resume', 'stop',
    'get_state', 'list_clips', 'set_current_time', 'set_speed', 'crossfade',
  ];

  for (const action of actions) {
    it(`${action} calls sceneMethod and returns result`, async () => {
      const ctx = makeCtx();
      const server = buildCocosToolServer(ctx);
      const result = await server.callTool('animation_tool', {
        action,
        uuid: 'test-uuid',
        ...(action === 'create_clip' ? { tracks: [{ property: 'position', keyframes: [{ time: 0, value: [0, 0, 0] }] }] } : {}),
        ...(action === 'crossfade' ? { clipName: 'idle' } : {}),
        ...(action === 'set_current_time' ? { time: 1.5 } : {}),
        ...(action === 'set_speed' ? { speed: 2.0 } : {}),
      });
      expect(result.content[0].text).toBeDefined();
      expect(ctx.sceneMethod).toHaveBeenCalled();
    });
  }

  it('returns error when uuid is missing', async () => {
    const ctx = makeCtx();
    const server = buildCocosToolServer(ctx);
    const result = await server.callTool('animation_tool', { action: 'play', uuid: '' });
    const data = parse(result);
    expect(data.error).toBeDefined();
  });

  it('returns error for unknown action', async () => {
    const ctx = makeCtx();
    const server = buildCocosToolServer(ctx);
    const result = await server.callTool('animation_tool', { action: 'nonexistent', uuid: 'u' });
    const data = parse(result);
    expect(data.error).toContain('未知');
  });

  it('handles sceneMethod exception', async () => {
    const ctx = makeCtx({ sceneMethod: vi.fn().mockRejectedValue(new Error('scene crash')) });
    const server = buildCocosToolServer(ctx);
    const result = await server.callTool('animation_tool', { action: 'play', uuid: 'u' });
    const data = parse(result);
    expect(data.error).toContain('scene crash');
    expect(result.isError).toBe(true);
  });
});
