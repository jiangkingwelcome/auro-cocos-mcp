import { describe, it, expect, vi } from 'vitest';
import { buildCocosToolServer } from '../../src/mcp/tools';
import type { BridgeToolContext, ToolCallResult } from '../../src/mcp/tools-shared';

function makeCtx(overrides: Partial<BridgeToolContext> = {}): BridgeToolContext {
  const defaultSceneMethod = vi.fn().mockImplementation(async (method: string, args?: unknown[]) => {
    if (method === 'dispatchQuery') {
      const payload = Array.isArray(args) ? args[0] as Record<string, unknown> : undefined;
      if (payload?.action === 'get_animation_state') {
        return { isPlaying: false, clips: [] };
      }
    }
    return { success: true };
  });

  return {
    bridgeGet: vi.fn().mockResolvedValue({}),
    bridgePost: vi.fn().mockResolvedValue({ success: true }),
    sceneMethod: defaultSceneMethod,
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
  const sceneActions = [
    'create_clip',
    'get_state', 'list_clips', 'set_current_time', 'set_speed', 'crossfade',
  ];

  for (const action of sceneActions) {
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

  it('create_clip saves .anim asset when savePath is provided', async () => {
    const ctx = makeCtx({
      sceneMethod: vi.fn().mockImplementation(async (method: string) => {
        if (method === 'createAnimationClip') {
          return { success: true, clipName: 'saved_clip', clipDuration: 1 };
        }
        if (method === 'setComponentProperty') {
          return { success: true, resolvedViaEditorIPC: true };
        }
        if (method === 'dispatchQuery') {
          return { isPlaying: false, clips: [{ name: 'saved_clip', duration: 1 }] };
        }
        return { success: true };
      }),
      bridgePost: vi.fn().mockResolvedValue({ success: true }),
      editorMsg: vi.fn().mockImplementation(async (_module: string, message: string) => {
        if (message === 'query-asset-info') {
          return { uuid: 'asset-uuid-1' };
        }
        return { success: true };
      }),
    });
    const server = buildCocosToolServer(ctx);
    const result = await server.callTool('animation_tool', {
      action: 'create_clip',
      uuid: 'test-uuid',
      savePath: 'db://assets/animations/saved_clip.anim',
      tracks: [{ property: 'position', keyframes: [{ time: 0, value: [0, 0, 0] }] }],
    });
    const data = parse(result);
    expect(data.savedAsset).toEqual(expect.objectContaining({
      saved: true,
      path: 'db://assets/animations/saved_clip.anim',
    }));
    expect(ctx.editorMsg).toHaveBeenCalled();
    expect(ctx.bridgePost).toHaveBeenCalledWith('/api/asset-db/create-asset', expect.objectContaining({
      url: 'db://assets/animations/saved_clip.anim',
    }));
    expect(ctx.sceneMethod).toHaveBeenCalledWith('setComponentProperty', [
      'test-uuid',
      'Animation',
      'defaultClip',
      { __uuid__: 'asset-uuid-1' },
    ]);
  });

  it('create_clip returns warning when savePath persistence fails', async () => {
    const ctx = makeCtx({
      sceneMethod: vi.fn().mockResolvedValue({ success: true, clipName: 'saved_clip', clipDuration: 1 }),
      bridgePost: vi.fn().mockImplementation(async (path: string) => {
        if (path === '/api/asset-db/create-asset') {
          return { error: 'create failed' };
        }
        return { success: true };
      }),
      editorMsg: vi.fn().mockResolvedValue({ success: true }),
    });
    const server = buildCocosToolServer(ctx);
    const result = await server.callTool('animation_tool', {
      action: 'create_clip',
      uuid: 'test-uuid',
      savePath: 'db://assets/animations/saved_clip.anim',
      tracks: [{ property: 'position', keyframes: [{ time: 0, value: [0, 0, 0] }] }],
    });
    const data = parse(result);
    expect(data.savedAsset).toBeNull();
    expect(data.warnings).toEqual(expect.arrayContaining([expect.stringContaining('保存 .anim 资产失败')]));
  });

  it('create_clip returns warning when saved asset cannot be rebound to Animation', async () => {
    const ctx = makeCtx({
      sceneMethod: vi.fn().mockImplementation(async (method: string) => {
        if (method === 'createAnimationClip') {
          return { success: true, clipName: 'saved_clip', clipDuration: 1 };
        }
        if (method === 'setComponentProperty') {
          return { error: 'set-property failed' };
        }
        return { success: true };
      }),
      bridgePost: vi.fn().mockResolvedValue({ success: true }),
      editorMsg: vi.fn().mockImplementation(async (_module: string, message: string) => {
        if (message === 'query-asset-info') {
          return { uuid: 'asset-uuid-1' };
        }
        return { success: true };
      }),
    });
    const server = buildCocosToolServer(ctx);
    const result = await server.callTool('animation_tool', {
      action: 'create_clip',
      uuid: 'test-uuid',
      savePath: 'db://assets/animations/saved_clip.anim',
      tracks: [{ property: 'position', keyframes: [{ time: 0, value: [0, 0, 0] }] }],
    });
    const data = parse(result);
    expect(data.savedAsset).toEqual(expect.objectContaining({
      saved: true,
      path: 'db://assets/animations/saved_clip.anim',
      uuid: 'asset-uuid-1',
    }));
    expect(data.assetBinding).toBeNull();
    expect(data.warnings).toEqual(expect.arrayContaining([expect.stringContaining('回绑 Animation.defaultClip 失败')]));
  });

  for (const action of ['play', 'pause', 'resume', 'stop'] as const) {
    it(`${action} prefers verified runtime playback`, async () => {
      const ctx = makeCtx({
        sceneMethod: vi.fn().mockImplementation(async (method: string, args?: unknown[]) => {
          if (method === 'dispatchAnimationAction') {
            return { success: true };
          }
          if (method === 'dispatchQuery') {
            const payload = Array.isArray(args) ? args[0] as Record<string, unknown> | undefined : undefined;
            if (payload?.action === 'get_animation_state') {
              return { isPlaying: action === 'play' || action === 'resume', clips: [] };
            }
          }
          return { success: true };
        }),
      });
      const server = buildCocosToolServer(ctx);
      const result = await server.callTool('animation_tool', {
        action,
        uuid: 'test-uuid',
      });
      const data = parse(result);
      expect(data.success).toBe(true);
      expect(data.transport).toBe('runtime');
      expect(ctx.sceneMethod).toHaveBeenCalledWith('dispatchAnimationAction', [{
        action,
        uuid: 'test-uuid',
      }]);
      expect(ctx.bridgePost).not.toHaveBeenCalled();
    });
  }

  it('falls back to animator bridge when runtime playback does not change state', async () => {
    let queryCount = 0;
    const ctx = makeCtx({
      sceneMethod: vi.fn().mockImplementation(async (method: string, args?: unknown[]) => {
        if (method === 'dispatchAnimationAction') {
          return { success: true };
        }
        if (method === 'dispatchQuery') {
          const payload = Array.isArray(args) ? args[0] as Record<string, unknown> | undefined : undefined;
          if (payload?.action === 'get_animation_state') {
            queryCount += 1;
            return { isPlaying: queryCount >= 5, clips: [] };
          }
        }
        return { success: true };
      }),
    });
    const server = buildCocosToolServer(ctx);
    const result = await server.callTool('animation_tool', {
      action: 'play',
      uuid: 'test-uuid',
    });
    const data = parse(result);
    expect(data.success).toBe(true);
    expect(data.transport).toBe('animator');
    expect(ctx.bridgePost).toHaveBeenCalledWith('/api/animator/command', {
      command: 'play-or-pause',
      uuid: 'test-uuid',
    });
  });

  it('returns error when play does not enter playing state', async () => {
    const ctx = makeCtx({
      sceneMethod: vi.fn().mockImplementation(async (method: string, args?: unknown[]) => {
        if (method === 'dispatchAnimationAction') {
          return { success: true };
        }
        if (method === 'dispatchQuery') {
          const payload = Array.isArray(args) ? args[0] as Record<string, unknown> | undefined : undefined;
          if (payload?.action === 'get_animation_state') {
            return { isPlaying: false, clips: [] };
          }
        }
        return { success: true };
      }),
    });
    const server = buildCocosToolServer(ctx);
    const result = await server.callTool('animation_tool', {
      action: 'play',
      uuid: 'test-uuid',
    });
    const data = parse(result);
    expect(data.error).toContain('未进入播放状态');
    expect(result.isError).toBe(true);
  });

  it('returns error when play requests a specific clipName and runtime playback fails', async () => {
    const ctx = makeCtx();
    const server = buildCocosToolServer(ctx);
    const result = await server.callTool('animation_tool', {
      action: 'play',
      uuid: 'test-uuid',
      clipName: 'idle',
    });
    const data = parse(result);
    expect(data.error).toContain('clipName');
    expect(ctx.bridgePost).not.toHaveBeenCalled();
  });

  it('passes through filtered null clip metadata from get_state', async () => {
    const ctx = makeCtx({
      sceneMethod: vi.fn().mockImplementation(async (method: string, args?: unknown[]) => {
        if (method === 'dispatchQuery') {
          const payload = Array.isArray(args) ? args[0] as Record<string, unknown> | undefined : undefined;
          if (payload?.action === 'get_animation_state') {
            return {
              hasAnimation: true,
              clipCount: 1,
              clips: [{ name: 'valid', duration: 1 }],
              filteredNullClips: 2,
              isPlaying: false,
            };
          }
        }
        return { success: true };
      }),
    });
    const server = buildCocosToolServer(ctx);
    const result = await server.callTool('animation_tool', {
      action: 'get_state',
      uuid: 'test-uuid',
    });
    const data = parse(result);
    expect(data.clipCount).toBe(1);
    expect(data.filteredNullClips).toBe(2);
    expect(data.clips).toEqual([{ name: 'valid', duration: 1 }]);
  });

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
    const result = await server.callTool('animation_tool', { action: 'get_state', uuid: 'u' });
    const data = parse(result);
    expect(data.error).toContain('scene crash');
    expect(result.isError).toBe(true);
  });

  it('handles animator bridge exception', async () => {
    const ctx = makeCtx({ bridgePost: vi.fn().mockRejectedValue(new Error('animator crash')) });
    const server = buildCocosToolServer(ctx);
    const result = await server.callTool('animation_tool', { action: 'play', uuid: 'u' });
    const data = parse(result);
    expect(data.error).toContain('animator crash');
    expect(result.isError).toBe(true);
  });
});
