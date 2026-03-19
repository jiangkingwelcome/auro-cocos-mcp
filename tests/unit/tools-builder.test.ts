import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildCocosToolServer, type BridgeToolContext } from '../../src/mcp/tools';
import type { ToolCallResult } from '../../src/mcp/local-tool-server';

// ─────────────────────────────────────────────────────────────────────────────
// 辅助：创建 Mock BridgeToolContext
// ─────────────────────────────────────────────────────────────────────────────
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

function parseResult(result: ToolCallResult): unknown {
  return JSON.parse(result.content[0].text);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. 工具注册完整性
// ─────────────────────────────────────────────────────────────────────────────
describe('buildCocosToolServer — 工具注册完整性', () => {
  it('包含所有预期的工具名', () => {
    const server = buildCocosToolServer(makeCtx());
    const names = server.listTools().map((t) => t.name);

    const expectedTools = [
      'bridge_status',
      'scene_query',
      'scene_operation',
      'asset_operation',
      'editor_action',
      'execute_script',
      'create_prefab_atomic',
      'import_and_apply_texture',
      'setup_ui_layout',
    ];

    for (const name of expectedTools) {
      expect(names, `期望包含工具: ${name}`).toContain(name);
    }
  });

  it('工具总数 >= 9', () => {
    const server = buildCocosToolServer(makeCtx());
    expect(server.listTools().length).toBeGreaterThanOrEqual(9);
  });

  it('每个工具都有 description 和 inputSchema', () => {
    const server = buildCocosToolServer(makeCtx());
    for (const tool of server.listTools()) {
      expect(tool.description, `${tool.name} 缺少 description`).toBeTruthy();
      expect(tool.inputSchema, `${tool.name} 缺少 inputSchema`).toBeDefined();
    }
  });

  it('getTotalActionCount() 远大于工具数（因为每个工具含多个 action）', () => {
    const server = buildCocosToolServer(makeCtx());
    const toolCount = server.listTools().length;
    const actionCount = server.getTotalActionCount();
    expect(actionCount).toBeGreaterThan(toolCount);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. bridge_status 工具
// ─────────────────────────────────────────────────────────────────────────────
describe('buildCocosToolServer — bridge_status', () => {
  it('调用 bridgeGet("/api/status") 并返回连接状态', async () => {
    const bridgeGet = vi.fn().mockResolvedValue({ port: 7779, engine: 'Cocos Creator' });
    const server = buildCocosToolServer(makeCtx({ bridgeGet }));

    const result = await server.callTool('bridge_status', {});
    expect(result.isError).toBeFalsy();

    const data = parseResult(result) as any;
    expect(data.connected).toBe(true);
    expect(data.port).toBe(7779);
    expect(bridgeGet).toHaveBeenCalledWith('/api/status');
  });

  it('bridgeGet 失败时返回 connected: false 且 isError', async () => {
    const bridgeGet = vi.fn().mockRejectedValue(new Error('连接超时'));
    const server = buildCocosToolServer(makeCtx({ bridgeGet }));

    const result = await server.callTool('bridge_status', {});
    expect(result.isError).toBe(true);

    const data = parseResult(result) as any;
    expect(data.connected).toBe(false);
    expect(data.error).toContain('连接超时');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. scene_operation 危险操作拦截
// ─────────────────────────────────────────────────────────────────────────────
describe('buildCocosToolServer — scene_operation 危险操作守卫', () => {
  it('destroy_node 没有 confirmDangerous → 被拦截，返回 isError', async () => {
    const sceneMethod = vi.fn();
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));

    const result = await server.callTool('scene_operation', {
      action: 'destroy_node',
      uuid: 'some-node-uuid',
    });

    expect(result.isError).toBe(true);
    const data = parseResult(result) as any;
    expect(data.error).toContain('危险操作');
    expect(data.error).toContain('confirmDangerous');

    // sceneMethod 不应被调用
    expect(sceneMethod).not.toHaveBeenCalled();
  });

  it('destroy_node confirmDangerous=true → 调用 editorMsg remove-node', async () => {
    const editorMsg = vi.fn().mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ editorMsg }));

    const result = await server.callTool('scene_operation', {
      action: 'destroy_node',
      uuid: 'some-node-uuid',
      confirmDangerous: true,
    });

    expect(result.isError).toBeFalsy();
    expect(editorMsg).toHaveBeenCalledWith('scene', 'remove-node', { uuid: 'some-node-uuid' });
  });

  it('clear_children 没有 confirmDangerous → 被拦截', async () => {
    const sceneMethod = vi.fn();
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));

    const result = await server.callTool('scene_operation', {
      action: 'clear_children',
      uuid: 'parent-uuid',
    });

    expect(result.isError).toBe(true);
    expect(sceneMethod).not.toHaveBeenCalled();
  });

  it('create_node 不需要 confirmDangerous → 正常调用', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ uuid: 'new-node-uuid', name: 'NewNode' });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));

    const result = await server.callTool('scene_operation', {
      action: 'create_node',
      parentUuid: 'parent-uuid',
      name: 'NewNode',
    });

    expect(result.isError).toBeFalsy();
    expect(sceneMethod).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. scene_operation 路径透传（CASE_NORMALIZE_MAP 已清空）
// ─────────────────────────────────────────────────────────────────────────────
describe('buildCocosToolServer — scene_operation 路径透传', () => {
  it('create_prefab 的 savePath 原样传递（大写路径段不修改）', async () => {
    const editorMsg = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ editorMsg }));

    const result = await server.callTool('scene_operation', {
      action: 'create_prefab',
      uuid: 'some-uuid',
      savePath: 'db://assets/Prefabs/Hero.prefab',
    });

    const data = parseResult(result) as any;
    // savePath 原样保留
    expect(data.savePath).toBe('db://assets/Prefabs/Hero.prefab');

    // editorMsg 使用原始路径
    expect(editorMsg).toHaveBeenCalledWith(
      'scene',
      'create-prefab',
      'some-uuid',
      'db://assets/Prefabs/Hero.prefab',
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. withGuardrailHints — 组件错误提示
// ─────────────────────────────────────────────────────────────────────────────
describe('buildCocosToolServer — withGuardrailHints（通过 scene_operation）', () => {
  it('sceneMethod 返回"未找到组件类"错误时追加 suggestion', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({
      error: '未找到组件类 MySprite',
    });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));

    const result = await server.callTool('scene_operation', {
      action: 'add_component',
      uuid: 'some-uuid',
      component: 'MySprite',
    });

    const data = parseResult(result) as any;
    expect(data.suggestion).toBeTruthy();
    expect(data.suggestion).toContain('Sprite');
  });

  it('普通错误不追加 suggestion', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({
      error: '节点不存在',
    });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));

    const result = await server.callTool('scene_operation', {
      action: 'set_property',
      uuid: 'some-uuid',
      component: 'Sprite',
      property: 'color',
      value: { r: 255, g: 0, b: 0, a: 255 },
    });

    const data = parseResult(result) as any;
    expect(data.suggestion).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. scene_query 工具
// ─────────────────────────────────────────────────────────────────────────────
describe('buildCocosToolServer — scene_query', () => {
  it('action=tree 调用 sceneMethod("dispatchQuery")', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ nodes: [] });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));

    const result = await server.callTool('scene_query', { action: 'tree' });
    expect(result.isError).toBeFalsy();
    expect(sceneMethod).toHaveBeenCalledWith('dispatchQuery', expect.any(Array));
  });

  it('action=list 调用 sceneMethod("dispatchQuery")', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ nodes: [] });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));

    await server.callTool('scene_query', { action: 'list' });
    expect(sceneMethod).toHaveBeenCalledWith('dispatchQuery', expect.any(Array));
  });

  it('action=get_current_selection 通过 editorMsg 获取', async () => {
    const editorMsg = vi.fn().mockResolvedValue(['uuid-1', 'uuid-2']);
    const sceneMethod = vi.fn().mockResolvedValue({ selected: ['uuid-1', 'uuid-2'] });
    const server = buildCocosToolServer(makeCtx({ editorMsg, sceneMethod }));

    const result = await server.callTool('scene_query', { action: 'get_current_selection' });
    expect(result.isError).toBeFalsy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. execute_script 工具
// ─────────────────────────────────────────────────────────────────────────────
describe('buildCocosToolServer — execute_script', () => {
  it('调用 sceneMethod 执行任意方法', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ result: 42 });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));

    const result = await server.callTool('execute_script', {
      method: 'getSceneStats',
      args: [],
    });

    expect(result.isError).toBeFalsy();
    expect(sceneMethod).toHaveBeenCalledWith('getSceneStats', []);
  });
});
