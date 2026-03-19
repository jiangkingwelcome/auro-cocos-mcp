import { describe, it, expect, vi } from 'vitest';
import { buildCocosToolServer, type BridgeToolContext } from '../../src/mcp/tools';
import type { ToolCallResult } from '../../src/mcp/local-tool-server';

function makeCtx(overrides: Partial<BridgeToolContext> = {}): BridgeToolContext {
  return {
    bridgeGet: vi.fn().mockResolvedValue({}),
    bridgePost: vi.fn().mockResolvedValue({}),
    sceneMethod: vi.fn().mockResolvedValue({ success: true }),
    editorMsg: vi.fn().mockResolvedValue({}),
    text: (data: unknown, isError?: boolean): ToolCallResult => ({
      content: [{ type: 'text', text: JSON.stringify(data) }],
      ...(isError !== undefined ? { isError } : {}),
    }),
    ...overrides,
  };
}

function parse(result: ToolCallResult): unknown {
  return JSON.parse(result.content[0].text);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. bridgePost 类 actions
// ─────────────────────────────────────────────────────────────────────────────
describe('editor_action — bridgePost actions', () => {
  it('save_scene 调用 POST /api/editor/save-scene', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));

    const result = await server.callTool('editor_action', { action: 'save_scene' });
    expect(result.isError).toBeFalsy();
    expect(bridgePost).toHaveBeenCalledWith('/api/editor/save-scene', { force: undefined });
  });

  it('open_scene 传入 url', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));

    await server.callTool('editor_action', { action: 'open_scene', url: 'db://assets/scenes/main.scene' });
    expect(bridgePost).toHaveBeenCalledWith('/api/editor/open-scene', {
      uuid: undefined,
      url: 'db://assets/scenes/main.scene',
    });
  });

  it('new_scene 调用 POST /api/scene/new-scene', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));

    await server.callTool('editor_action', { action: 'new_scene' });
    expect(bridgePost).toHaveBeenCalledWith('/api/scene/new-scene');
  });

  it('undo 调用 POST /api/editor/undo', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));

    await server.callTool('editor_action', { action: 'undo' });
    expect(bridgePost).toHaveBeenCalledWith('/api/editor/undo');
  });

  it('redo 调用 POST /api/editor/redo', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));

    await server.callTool('editor_action', { action: 'redo' });
    expect(bridgePost).toHaveBeenCalledWith('/api/editor/redo');
  });

  it('build 调用 POST /api/builder/build 并传入 platform', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));

    await server.callTool('editor_action', { action: 'build', platform: 'web-mobile' });
    expect(bridgePost).toHaveBeenCalledWith('/api/builder/build', { platform: 'web-mobile' });
  });

  it('preview 调用 POST /api/preview/open', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));

    await server.callTool('editor_action', { action: 'preview' });
    expect(bridgePost).toHaveBeenCalledWith('/api/preview/open');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. bridgeGet 类 actions
// ─────────────────────────────────────────────────────────────────────────────
describe('editor_action — bridgeGet actions', () => {
  it('project_info 调用 GET /api/editor/project-info', async () => {
    const bridgeGet = vi.fn().mockResolvedValue({ name: 'MyGame', version: '1.0' });
    const server = buildCocosToolServer(makeCtx({ bridgeGet }));

    await server.callTool('editor_action', { action: 'project_info' });
    expect(bridgeGet).toHaveBeenCalledWith('/api/editor/project-info');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. editorMsg 类 actions
// ─────────────────────────────────────────────────────────────────────────────
describe('editor_action — editorMsg actions', () => {
  it.skip('send_message 透传 module / message / args', async () => {
    const editorMsg = vi.fn().mockResolvedValue({ ok: true });
    const server = buildCocosToolServer(makeCtx({ editorMsg }));

    await server.callTool('editor_action', {
      action: 'send_message',
      module: 'scene',
      message: 'reload',
      args: ['arg1'],
    });
    expect(editorMsg).toHaveBeenCalledWith('scene', 'reload', 'arg1');
  });

  it('log 调用 bridgePost("/api/console/log")', async () => {
    const bridgePost = vi.fn().mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ bridgePost }));

    await server.callTool('editor_action', { action: 'log', text: '调试日志' });
    expect(bridgePost).toHaveBeenCalledWith('/api/console/log', { text: '调试日志' });
  });

  it('warn 调用 bridgePost("/api/console/warn")', async () => {
    const bridgePost = vi.fn().mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ bridgePost }));

    await server.callTool('editor_action', { action: 'warn', text: '警告信息' });
    expect(bridgePost).toHaveBeenCalledWith('/api/console/warn', { text: '警告信息' });
  });

  it('error 调用 bridgePost("/api/console/error")', async () => {
    const bridgePost = vi.fn().mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ bridgePost }));

    await server.callTool('editor_action', { action: 'error', text: '错误信息' });
    expect(bridgePost).toHaveBeenCalledWith('/api/console/error', { text: '错误信息' });
  });

  it('clear_console 调用 bridgePost("/api/console/clear")', async () => {
    const bridgePost = vi.fn().mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ bridgePost }));

    await server.callTool('editor_action', { action: 'clear_console' });
    expect(bridgePost).toHaveBeenCalledWith('/api/console/clear', {});
  });

  it.skip('open_panel 调用 editorMsg("panel", "open", panelName)', async () => {
    const editorMsg = vi.fn().mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ editorMsg }));

    await server.callTool('editor_action', { action: 'open_panel', panel: 'animator' });
    expect(editorMsg).toHaveBeenCalledWith('panel', 'open', 'animator');
  });

  it.skip('close_panel 调用 editorMsg("panel", "close", panelName)', async () => {
    const editorMsg = vi.fn().mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ editorMsg }));

    await server.callTool('editor_action', { action: 'close_panel', panel: 'animator' });
    expect(editorMsg).toHaveBeenCalledWith('panel', 'close', 'animator');
  });

  it('focus_node 缺少 uuid 时返回 isError', async () => {
    const server = buildCocosToolServer(makeCtx());

    const result = await server.callTool('editor_action', { action: 'focus_node' });
    expect(result.isError).toBe(true);
    const data = parse(result) as any;
    expect(data.error).toContain('uuid');
  });

  it('focus_node 正确调用 bridgePost("/api/scene/focus-node")', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));

    await server.callTool('editor_action', { action: 'focus_node', uuid: 'node-uuid-123' });
    expect(bridgePost).toHaveBeenCalledWith('/api/scene/focus-node', { uuid: 'node-uuid-123' });
  });

  it('reload_plugin 缺少 module 时返回 isError', async () => {
    const server = buildCocosToolServer(makeCtx());

    const result = await server.callTool('editor_action', { action: 'reload_plugin' });
    expect(result.isError).toBe(true);
  });

  it.skip('reload_plugin 正确调用 editorMsg("package", "reload")', async () => {
    const editorMsg = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ editorMsg }));

    await server.callTool('editor_action', { action: 'reload_plugin', module: 'aura-for-cocos' });
    expect(editorMsg).toHaveBeenCalledWith('package', 'reload', 'aura-for-cocos');
  });

  it.skip('open_preferences 调用 editorMsg("panel", "open", "preferences")', async () => {
    const editorMsg = vi.fn().mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ editorMsg }));

    await server.callTool('editor_action', { action: 'open_preferences' });
    expect(editorMsg).toHaveBeenCalledWith('panel', 'open', 'preferences');
  });

  it.skip('open_project_settings 调用 editorMsg("panel", "open", "project-settings")', async () => {
    const editorMsg = vi.fn().mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ editorMsg }));

    await server.callTool('editor_action', { action: 'open_project_settings' });
    expect(editorMsg).toHaveBeenCalledWith('panel', 'open', 'project-settings');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. 异常处理
// ─────────────────────────────────────────────────────────────────────────────
describe('editor_action — 异常处理', () => {
  it('bridgePost 抛出时返回 isError', async () => {
    const bridgePost = vi.fn().mockRejectedValue(new Error('保存失败'));
    const server = buildCocosToolServer(makeCtx({ bridgePost }));

    const result = await server.callTool('editor_action', { action: 'save_scene' });
    expect(result.isError).toBe(true);
    const data = parse(result) as any;
    expect(data.tool).toBe('editor_action');
    expect(data.error).toContain('保存失败');
  });

  it('editorMsg 抛出时返回 isError', async () => {
    const editorMsg = vi.fn().mockRejectedValue(new Error('IPC 超时'));
    const server = buildCocosToolServer(makeCtx({ editorMsg }));

    const result = await server.callTool('editor_action', { action: 'pause_in_editor' });
    expect(result.isError).toBe(true);
    const data = parse(result) as any;
    expect(data.error).toContain('IPC 超时');
  });
});
