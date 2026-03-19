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

  it.skip('move_scene_camera calls POST /api/scene/focus-node', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));
    await server.callTool('editor_action', { action: 'move_scene_camera', uuid: 'cam-1' });
    expect(bridgePost).toHaveBeenCalledWith('/api/scene/focus-node', { uuid: 'cam-1' });
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

  it.skip('query_panels calls GET /api/panel/list', async () => {
    const bridgeGet = vi.fn().mockResolvedValue([]);
    const server = buildCocosToolServer(makeCtx({ bridgeGet }));
    const result = await server.callTool('editor_action', { action: 'query_panels' });
    expect(result.isError).toBeFalsy();
    expect(bridgeGet).toHaveBeenCalledWith('/api/panel/list');
  });

  it.skip('get_console_logs calls GET /api/console/logs', async () => {
    const bridgeGet = vi.fn().mockResolvedValue([]);
    const server = buildCocosToolServer(makeCtx({ bridgeGet }));
    const result = await server.callTool('editor_action', { action: 'get_console_logs' });
    expect(result.isError).toBeFalsy();
    expect(bridgeGet).toHaveBeenCalledWith('/api/console/logs', expect.objectContaining({ type: 'all' }));
  });

  it.skip('search_logs calls GET /api/console/logs with keyword', async () => {
    const bridgeGet = vi.fn().mockResolvedValue([{ message: 'error found' }]);
    const server = buildCocosToolServer(makeCtx({ bridgeGet }));
    const result = await server.callTool('editor_action', { action: 'search_logs', keyword: 'error' });
    expect(result.isError).toBeFalsy();
    expect(bridgeGet).toHaveBeenCalledWith('/api/console/logs', expect.objectContaining({ keyword: 'error' }));
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
  it.skip('send_message calls editorMsg with allowed module', async () => {
    const editorMsg = vi.fn().mockResolvedValue({ ok: true });
    const server = buildCocosToolServer(makeCtx({ editorMsg }));
    const result = await server.callTool('editor_action', { action: 'send_message', module: 'scene', message: 'query-node', args: ['arg1'] });
    expect(result.isError).toBeFalsy();
    expect(editorMsg).toHaveBeenCalledWith('scene', 'query-node', 'arg1');
  });

  it.skip('send_message rejects disallowed module', async () => {
    const server = buildCocosToolServer(makeCtx());
    const result = await server.callTool('editor_action', { action: 'send_message', module: 'dangerous', message: 'hack' });
    expect(result.isError).toBe(true);
    const data = parse(result);
    expect(data.error).toContain('不在允许列表中');
  });

  it.skip('open_panel calls editorMsg panel open', async () => {
    const editorMsg = vi.fn().mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ editorMsg }));
    await server.callTool('editor_action', { action: 'open_panel', panel: 'inspector' });
    expect(editorMsg).toHaveBeenCalledWith('panel', 'open', 'inspector');
  });

  it.skip('close_panel calls editorMsg panel close', async () => {
    const editorMsg = vi.fn().mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ editorMsg }));
    await server.callTool('editor_action', { action: 'close_panel', panel: 'console' });
    expect(editorMsg).toHaveBeenCalledWith('panel', 'close', 'console');
  });

  it.skip('get_packages calls editorMsg package query-all', async () => {
    const editorMsg = vi.fn().mockResolvedValue([{ name: 'pkg1' }]);
    const server = buildCocosToolServer(makeCtx({ editorMsg }));
    const result = await server.callTool('editor_action', { action: 'get_packages' });
    expect(result.isError).toBeFalsy();
    expect(editorMsg).toHaveBeenCalledWith('package', 'query-all');
  });

  it.skip('reload_plugin calls editorMsg package reload', async () => {
    const editorMsg = vi.fn().mockResolvedValue(null);
    const server = buildCocosToolServer(makeCtx({ editorMsg }));
    const result = await server.callTool('editor_action', { action: 'reload_plugin', module: 'my-plugin' });
    expect(result.isError).toBeFalsy();
    expect(editorMsg).toHaveBeenCalledWith('package', 'reload', 'my-plugin');
  });

  it.skip('inspect_asset calls editorMsg selection select asset', async () => {
    const editorMsg = vi.fn().mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ editorMsg }));
    await server.callTool('editor_action', { action: 'inspect_asset', uuid: 'asset-uuid' });
    expect(editorMsg).toHaveBeenCalledWith('selection', 'select', 'asset', ['asset-uuid']);
  });

  it.skip('open_preferences calls editorMsg panel open preferences', async () => {
    const editorMsg = vi.fn().mockResolvedValue(null);
    const server = buildCocosToolServer(makeCtx({ editorMsg }));
    await server.callTool('editor_action', { action: 'open_preferences' });
    expect(editorMsg).toHaveBeenCalledWith('panel', 'open', 'preferences');
  });

  it.skip('open_project_settings calls editorMsg panel open project-settings', async () => {
    const editorMsg = vi.fn().mockResolvedValue(null);
    const server = buildCocosToolServer(makeCtx({ editorMsg }));
    await server.callTool('editor_action', { action: 'open_project_settings' });
    expect(editorMsg).toHaveBeenCalledWith('panel', 'open', 'project-settings');
  });

  it('show_notification calls bridgePost and editorMsg dialog', async () => {
    const bridgePost = vi.fn().mockResolvedValue({});
    const editorMsg = vi.fn().mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ bridgePost, editorMsg }));
    const result = await server.callTool('editor_action', { action: 'show_notification', text: 'Hello!', title: 'Test' });
    expect(result.isError).toBeFalsy();
    expect(bridgePost).toHaveBeenCalledWith('/api/console/warn', expect.objectContaining({ text: expect.stringContaining('Hello!') }));
  });

  it.skip('take_scene_screenshot calls sceneMethod dispatchQuery', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ screenshot: 'base64...' });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));
    const result = await server.callTool('editor_action', { action: 'take_scene_screenshot' });
    expect(result.isError).toBeFalsy();
    expect(sceneMethod).toHaveBeenCalledWith('dispatchQuery', [{ action: 'take_screenshot' }]);
  });

  it.skip('set_transform_tool calls editorMsg scene set-transform-tool', async () => {
    const editorMsg = vi.fn().mockResolvedValue(null);
    const server = buildCocosToolServer(makeCtx({ editorMsg }));
    await server.callTool('editor_action', { action: 'set_transform_tool', toolType: 'rotation' });
    expect(editorMsg).toHaveBeenCalledWith('scene', 'set-transform-tool', 'rotation');
  });

  it.skip('set_coordinate calls editorMsg scene set-coordinate', async () => {
    const editorMsg = vi.fn().mockResolvedValue(null);
    const server = buildCocosToolServer(makeCtx({ editorMsg }));
    await server.callTool('editor_action', { action: 'set_coordinate', coordinate: 'world' });
    expect(editorMsg).toHaveBeenCalledWith('scene', 'set-coordinate', 'world');
  });

  it.skip('toggle_grid calls editorMsg scene set-grid-visible', async () => {
    const editorMsg = vi.fn().mockResolvedValue(null);
    const server = buildCocosToolServer(makeCtx({ editorMsg }));
    await server.callTool('editor_action', { action: 'toggle_grid', visible: true });
    expect(editorMsg).toHaveBeenCalledWith('scene', 'set-grid-visible', true);
  });

  it.skip('toggle_snap calls editorMsg scene set-snap', async () => {
    const editorMsg = vi.fn().mockResolvedValue(null);
    const server = buildCocosToolServer(makeCtx({ editorMsg }));
    await server.callTool('editor_action', { action: 'toggle_snap', enabled: false });
    expect(editorMsg).toHaveBeenCalledWith('scene', 'set-snap', false);
  });

  it.skip('build_with_config calls editorMsg builder build-start', async () => {
    const editorMsg = vi.fn().mockResolvedValue(null);
    const server = buildCocosToolServer(makeCtx({ editorMsg }));
    const result = await server.callTool('editor_action', { action: 'build_with_config', platform: 'web-mobile', debug: true });
    expect(result.isError).toBeFalsy();
    expect(editorMsg).toHaveBeenCalledWith('builder', 'build-start', expect.objectContaining({ platform: 'web-mobile', debug: true }));
  });

  it.skip('build_status calls editorMsg builder query-build-status', async () => {
    const editorMsg = vi.fn().mockResolvedValue({ building: false });
    const server = buildCocosToolServer(makeCtx({ editorMsg }));
    const result = await server.callTool('editor_action', { action: 'build_status' });
    expect(result.isError).toBeFalsy();
    expect(editorMsg).toHaveBeenCalledWith('builder', 'query-build-status');
  });

  it.skip('preview_status calls editorMsg preview query-info', async () => {
    const editorMsg = vi.fn().mockResolvedValue({ running: true, port: 7456 });
    const server = buildCocosToolServer(makeCtx({ editorMsg }));
    const result = await server.callTool('editor_action', { action: 'preview_status' });
    expect(result.isError).toBeFalsy();
    expect(editorMsg).toHaveBeenCalledWith('preview', 'query-info');
  });

  it.skip('set_view_mode calls editorMsg scene set-view-mode', async () => {
    const editorMsg = vi.fn().mockResolvedValue(null);
    const server = buildCocosToolServer(makeCtx({ editorMsg }));
    const result = await server.callTool('editor_action', { action: 'set_view_mode', viewMode: '2d' });
    expect(result.isError).toBeFalsy();
    expect(editorMsg).toHaveBeenCalledWith('scene', 'set-view-mode', '2d');
  });

  it.skip('zoom_to_fit calls editorMsg scene focus-all', async () => {
    const editorMsg = vi.fn().mockResolvedValue(null);
    const server = buildCocosToolServer(makeCtx({ editorMsg }));
    const result = await server.callTool('editor_action', { action: 'zoom_to_fit' });
    expect(result.isError).toBeFalsy();
    expect(editorMsg).toHaveBeenCalledWith('scene', 'focus-all');
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
describe.skip('engine_action — Pro exclusive', () => {
  const engineActions: Array<{ action: string; params: Record<string, unknown> }> = [
    { action: 'set_frame_rate', params: { fps: 60 } },
    { action: 'pause_engine', params: {} },
    { action: 'resume_engine', params: {} },
    { action: 'get_system_info', params: {} },
    { action: 'dump_texture_cache', params: {} },
    { action: 'get_render_stats', params: {} },
    { action: 'get_memory_stats', params: {} },
    { action: 'get_editor_performance', params: {} },
  ];

  for (const { action, params } of engineActions) {
    it(`${action} calls sceneMethod('dispatchEngineAction')`, async () => {
      const sceneMethod = vi.fn().mockResolvedValue({ ok: true });
      const server = buildCocosToolServer(makeCtx({ sceneMethod }));
      const result = await server.callTool('engine_action', { action, ...params });
      expect(result.isError).toBeFalsy();
      expect(sceneMethod).toHaveBeenCalledWith('dispatchEngineAction', [expect.objectContaining({ action })]);
    });
  }

  it('exception in engine_action returns error', async () => {
    const sceneMethod = vi.fn().mockRejectedValue(new Error('engine crashed'));
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));
    const result = await server.callTool('engine_action', { action: 'get_system_info' });
    expect(result.isError).toBe(true);
    const data = parse(result);
    expect(data.error).toContain('engine crashed');
  });
});
