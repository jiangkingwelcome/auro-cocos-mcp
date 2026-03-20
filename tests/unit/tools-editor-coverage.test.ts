import { describe, it, expect, vi } from 'vitest';
import { buildCocosToolServer, type BridgeToolContext } from '../../src/mcp/tools';
import type { ToolCallResult } from '../../src/mcp/local-tool-server';

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

// ═══════════════════════════════════════════════════════════════════════════════
// editor_action — bridgePost actions
// ═══════════════════════════════════════════════════════════════════════════════
describe('editor_action — bridgePost actions', () => {
  it('save_scene calls POST /api/editor/save-scene', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));
    const result = await server.callTool('editor_action', { action: 'save_scene' });
    expect(result.isError).toBeFalsy();
    expect(bridgePost).toHaveBeenCalledWith('/api/editor/save-scene', { force: undefined });
  });

  it('open_scene calls POST /api/editor/open-scene', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));
    await server.callTool('editor_action', { action: 'open_scene', url: 'db://assets/scenes/main.scene' });
    expect(bridgePost).toHaveBeenCalledWith('/api/editor/open-scene', { uuid: undefined, url: 'db://assets/scenes/main.scene' });
  });

  it('new_scene calls POST /api/scene/new-scene', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));
    await server.callTool('editor_action', { action: 'new_scene' });
    expect(bridgePost).toHaveBeenCalledWith('/api/scene/new-scene');
  });

  it('undo calls POST /api/editor/undo', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));
    await server.callTool('editor_action', { action: 'undo' });
    expect(bridgePost).toHaveBeenCalledWith('/api/editor/undo');
  });

  it('redo calls POST /api/editor/redo', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));
    await server.callTool('editor_action', { action: 'redo' });
    expect(bridgePost).toHaveBeenCalledWith('/api/editor/redo');
  });

  it('build calls POST /api/builder/build', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));
    await server.callTool('editor_action', { action: 'build', platform: 'web-mobile' });
    expect(bridgePost).toHaveBeenCalledWith('/api/builder/build', { platform: 'web-mobile' });
  });

  it('preview calls POST /api/preview/open', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));
    await server.callTool('editor_action', { action: 'preview' });
    expect(bridgePost).toHaveBeenCalledWith('/api/preview/open');
  });

  it('preview_refresh calls POST /api/preview/refresh', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));
    await server.callTool('editor_action', { action: 'preview_refresh' });
    expect(bridgePost).toHaveBeenCalledWith('/api/preview/refresh');
  });

  it('log calls POST /api/console/log', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));
    await server.callTool('editor_action', { action: 'log', text: 'hello' });
    expect(bridgePost).toHaveBeenCalledWith('/api/console/log', { text: 'hello' });
  });

  it('warn calls POST /api/console/warn', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));
    await server.callTool('editor_action', { action: 'warn', text: 'warning msg' });
    expect(bridgePost).toHaveBeenCalledWith('/api/console/warn', { text: 'warning msg' });
  });

  it('error calls POST /api/console/error', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));
    await server.callTool('editor_action', { action: 'error', text: 'error msg' });
    expect(bridgePost).toHaveBeenCalledWith('/api/console/error', { text: 'error msg' });
  });

  it('clear_console calls POST /api/console/clear', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));
    await server.callTool('editor_action', { action: 'clear_console' });
    expect(bridgePost).toHaveBeenCalledWith('/api/console/clear', {});
  });

  it('focus_node calls POST /api/scene/focus-node', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));
    await server.callTool('editor_action', { action: 'focus_node', uuid: 'node-1' });
    expect(bridgePost).toHaveBeenCalledWith('/api/scene/focus-node', { uuid: 'node-1' });
  });

  it('community edition rejects move_scene_camera', async () => {
    const server = buildCocosToolServer(makeCtx());
    const result = await server.callTool('editor_action', { action: 'move_scene_camera', uuid: 'cam-1' });
    expect(result.isError).toBe(true);
  });

  it('play_in_editor calls POST /api/preview/open', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));
    await server.callTool('editor_action', { action: 'play_in_editor' });
    expect(bridgePost).toHaveBeenCalledWith('/api/preview/open');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// editor_action — bridgeGet actions
// ═══════════════════════════════════════════════════════════════════════════════
describe('editor_action — bridgeGet actions', () => {
  it('project_info calls GET /api/editor/project-info', async () => {
    const bridgeGet = vi.fn().mockResolvedValue({ name: 'MyProject' });
    const server = buildCocosToolServer(makeCtx({ bridgeGet }));
    const result = await server.callTool('editor_action', { action: 'project_info' });
    expect(result.isError).toBeFalsy();
    expect(bridgeGet).toHaveBeenCalledWith('/api/editor/project-info');
  });

  it('community edition rejects Pro bridgeGet actions', async () => {
    const server = buildCocosToolServer(makeCtx());
    const actions = ['query_panels', 'get_console_logs', 'search_logs'] as const;
    for (const action of actions) {
      const result = await server.callTool('editor_action', {
        action,
        ...(action === 'search_logs' ? { keyword: 'error' } : {}),
      });
      expect(result.isError).toBe(true);
    }
  });

  it('search_logs requires keyword', async () => {
    const server = buildCocosToolServer(makeCtx());
    const result = await server.callTool('editor_action', { action: 'search_logs', keyword: '' });
    expect(result.isError).toBe(true);
  });

  it('build_query calls bridgeGet project-info', async () => {
    const bridgeGet = vi.fn().mockResolvedValue({ name: 'Proj' });
    const editorMsg = vi.fn().mockResolvedValue(null);
    const server = buildCocosToolServer(makeCtx({ bridgeGet, editorMsg }));
    const result = await server.callTool('editor_action', { action: 'build_query' });
    expect(result.isError).toBeFalsy();
    expect(bridgeGet).toHaveBeenCalledWith('/api/editor/project-info');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// editor_action — editorMsg (IPC) actions
// ═══════════════════════════════════════════════════════════════════════════════
describe('editor_action — editorMsg actions', () => {
  it('community edition rejects Pro editorMsg actions', async () => {
    const server = buildCocosToolServer(makeCtx());
    const cases: Array<{ action: string; params?: Record<string, unknown> }> = [
      { action: 'send_message', params: { module: 'scene', message: 'query-node', args: ['arg1'] } },
      { action: 'open_panel', params: { panel: 'inspector' } },
      { action: 'close_panel', params: { panel: 'console' } },
      { action: 'get_packages' },
      { action: 'reload_plugin', params: { module: 'my-plugin' } },
      { action: 'inspect_asset', params: { uuid: 'asset-uuid' } },
      { action: 'open_preferences' },
      { action: 'open_project_settings' },
      { action: 'take_scene_screenshot' },
      { action: 'set_transform_tool', params: { toolType: 'rotation' } },
      { action: 'set_coordinate', params: { coordinate: 'world' } },
      { action: 'toggle_grid', params: { visible: true } },
      { action: 'toggle_snap', params: { enabled: false } },
      { action: 'build_with_config', params: { platform: 'web-mobile', debug: true } },
      { action: 'build_status' },
      { action: 'preview_status' },
      { action: 'set_view_mode', params: { viewMode: '2d' } },
      { action: 'zoom_to_fit' },
    ];
    for (const c of cases) {
      const result = await server.callTool('editor_action', { action: c.action, ...(c.params ?? {}) });
      expect(result.isError).toBe(true);
    }
  });

  it('show_notification calls bridgePost and editorMsg dialog', async () => {
    const bridgePost = vi.fn().mockResolvedValue({});
    const editorMsg = vi.fn().mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ bridgePost, editorMsg }));
    const result = await server.callTool('editor_action', { action: 'show_notification', text: 'Hello!', title: 'Test' });
    expect(result.isError).toBeFalsy();
    expect(bridgePost).toHaveBeenCalledWith('/api/console/warn', expect.objectContaining({ text: expect.stringContaining('Hello!') }));
  });

  it('exception in editor_action returns error', async () => {
    const bridgePost = vi.fn().mockRejectedValue(new Error('editor offline'));
    const server = buildCocosToolServer(makeCtx({ bridgePost }));
    const result = await server.callTool('editor_action', { action: 'save_scene' });
    expect(result.isError).toBe(true);
    const data = parse(result);
    expect(data.error).toContain('editor offline');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// engine_action — Pro exclusive (社区版已移除，测试在 Pro 版中运行)
// ═══════════════════════════════════════════════════════════════════════════════
describe('engine_action — community guardrail', () => {
  it('engine_action tool is not registered in community edition', async () => {
    const server = buildCocosToolServer(makeCtx());
    const toolNames = server.listTools().map(t => t.name);
    expect(toolNames).not.toContain('engine_action');
  });

  it('calling engine_action returns error in community edition', async () => {
    const server = buildCocosToolServer(makeCtx());
    const result = await server.callTool('engine_action', { action: 'get_system_info' });
    expect(result.isError).toBe(true);
  });
});
