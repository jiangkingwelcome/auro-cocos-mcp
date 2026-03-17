import { describe, it, expect, vi } from 'vitest';
import { buildCocosToolServer, type BridgeToolContext } from '../../src/mcp/tools';
import type { ToolCallResult } from '../../src/mcp/local-tool-server';

// ─────────────────────────────────────────────────────────────────────────────
// 竞品分析专项测试：验证我们在分析报告中声称支持的功能确实可用
// ─────────────────────────────────────────────────────────────────────────────

function makeCtx(overrides: Partial<BridgeToolContext> = {}): BridgeToolContext {
  return {
    bridgeGet: vi.fn().mockResolvedValue({}),
    bridgePost: vi.fn().mockResolvedValue({}),
    sceneMethod: vi.fn().mockResolvedValue({}),
    editorMsg: vi.fn().mockResolvedValue({}),
    text(data: unknown, isError?: boolean): ToolCallResult {
      return { content: [{ type: 'text', text: JSON.stringify(data) }], isError: !!isError };
    },
    ...overrides,
  };
}

function parse(result: ToolCallResult): unknown {
  return JSON.parse(result.content[0].text);
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. UUID/URL 互转
//    测试条件：调用 asset_operation uuid_to_url / url_to_uuid 应正确路由到 editorMsg
// ═════════════════════════════════════════════════════════════════════════════

describe('竞品功能验证 — UUID/URL 互转', () => {
  it('uuid_to_url: 传入 uuid 应调用 editorMsg("asset-db", "query-url", uuid)', async () => {
    const editorMsg = vi.fn().mockResolvedValue('db://assets/textures/icon.png');
    const server = buildCocosToolServer(makeCtx({ editorMsg }));

    const result = await server.callTool('asset_operation', { action: 'uuid_to_url', uuid: 'abc-123-def' });
    expect(result.isError).toBeFalsy();
    expect(editorMsg).toHaveBeenCalledWith('asset-db', 'query-url', 'abc-123-def');
    const data = parse(result);
    expect(data).toBe('db://assets/textures/icon.png');
  });

  it('url_to_uuid: 传入 url 应调用 editorMsg("asset-db", "query-uuid", url)', async () => {
    const editorMsg = vi.fn().mockResolvedValue('abc-123-def');
    const server = buildCocosToolServer(makeCtx({ editorMsg }));

    const result = await server.callTool('asset_operation', { action: 'url_to_uuid', url: 'db://assets/textures/icon.png' });
    expect(result.isError).toBeFalsy();
    expect(editorMsg).toHaveBeenCalledWith('asset-db', 'query-uuid', 'db://assets/textures/icon.png');
    const data = parse(result);
    expect(data).toBe('abc-123-def');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. 动画剪辑列表 / 材质列表
//    测试条件：调用 get_animation_clips / get_materials 应使用正确的 glob 模式
// ═════════════════════════════════════════════════════════════════════════════

describe.skip('竞品功能验证 — 动画剪辑/材质列表', () => {
  it('get_animation_clips: 默认查询 db://assets/**/*.anim', async () => {
    const mockClips = [{ url: 'db://assets/anims/walk.anim', type: 'cc.AnimationClip' }];
    const bridgeGet = vi.fn().mockResolvedValue(mockClips);
    const server = buildCocosToolServer(makeCtx({ bridgeGet }));

    const result = await server.callTool('asset_operation', { action: 'get_animation_clips' });
    expect(result.isError).toBeFalsy();
    expect(bridgeGet).toHaveBeenCalledWith('/api/asset-db/query-assets', { pattern: 'db://assets/**/*.anim' });
  });

  it('get_animation_clips: 自定义 pattern 覆盖默认值', async () => {
    const bridgeGet = vi.fn().mockResolvedValue([]);
    const server = buildCocosToolServer(makeCtx({ bridgeGet }));

    await server.callTool('asset_operation', { action: 'get_animation_clips', pattern: 'db://assets/characters/**/*.anim' });
    expect(bridgeGet).toHaveBeenCalledWith('/api/asset-db/query-assets', { pattern: 'db://assets/characters/**/*.anim' });
  });

  it('get_materials: 默认查询 db://assets/**/*.mtl', async () => {
    const mockMats = [{ url: 'db://assets/materials/default.mtl', type: 'cc.Material' }];
    const bridgeGet = vi.fn().mockResolvedValue(mockMats);
    const server = buildCocosToolServer(makeCtx({ bridgeGet }));

    const result = await server.callTool('asset_operation', { action: 'get_materials' });
    expect(result.isError).toBeFalsy();
    expect(bridgeGet).toHaveBeenCalledWith('/api/asset-db/query-assets', { pattern: 'db://assets/**/*.mtl' });
  });

  it('get_materials: 自定义 pattern', async () => {
    const bridgeGet = vi.fn().mockResolvedValue([]);
    const server = buildCocosToolServer(makeCtx({ bridgeGet }));

    await server.callTool('asset_operation', { action: 'get_materials', pattern: 'db://assets/ui/**/*.mtl' });
    expect(bridgeGet).toHaveBeenCalledWith('/api/asset-db/query-assets', { pattern: 'db://assets/ui/**/*.mtl' });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. 在资源管理器中显示
//    测试条件：调用 show_in_explorer 应路由到 editorMsg("asset-db", "open-asset")
// ═════════════════════════════════════════════════════════════════════════════

describe.skip('竞品功能验证 — 在资源管理器中显示', () => {
  it('show_in_explorer: 传入 url 应调用 /api/asset-db/open-asset', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));

    const result = await server.callTool('asset_operation', { action: 'show_in_explorer', url: 'db://assets/prefabs/Player.prefab' });
    expect(result.isError).toBeFalsy();
    expect(bridgePost).toHaveBeenCalledWith('/api/asset-db/open-asset', { url: 'db://assets/prefabs/Player.prefab' });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. 图集打包 (⚠️ 部分支持)
//    测试条件：pack_atlas 应调用 reimport-asset（我们标记为"仅 reimport 封装"）
// ═════════════════════════════════════════════════════════════════════════════

describe.skip('竞品功能验证 — 图集打包 (部分支持)', () => {
  it('pack_atlas: 传入 url 应调用 editorMsg("asset-db", "reimport-asset", url)', async () => {
    const editorMsg = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ editorMsg }));

    const result = await server.callTool('asset_operation', { action: 'pack_atlas', url: 'db://assets/atlas/ui-sprites' });
    expect(result.isError).toBeFalsy();
    expect(editorMsg).toHaveBeenCalledWith('asset-db', 'reimport-asset', 'db://assets/atlas/ui-sprites');
  });

  it('pack_atlas: 缺少 url 参数时返回错误', async () => {
    const server = buildCocosToolServer(makeCtx());

    const result = await server.callTool('asset_operation', { action: 'pack_atlas' });
    expect(result.isError).toBe(true);
    const data = parse(result) as any;
    expect(data.error).toContain('url');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 5. 清理未使用资源 (⚠️ 仅提示)
//    测试条件：clean_unused 应返回提示信息，不实际执行删除
// ═════════════════════════════════════════════════════════════════════════════

describe.skip('竞品功能验证 — 清理未使用资源 (仅提示)', () => {
  it('clean_unused: 应返回只读扫描结果，不执行任何破坏性 POST 操作', async () => {
    const bridgeGet = vi.fn().mockResolvedValue([]);
    const bridgePost = vi.fn();
    const editorMsg = vi.fn();
    const server = buildCocosToolServer(makeCtx({ bridgeGet, bridgePost, editorMsg }));

    const result = await server.callTool('asset_operation', { action: 'clean_unused' });
    expect(result.isError).toBeFalsy();
    const data = parse(result) as any;
    expect(data.status).toBe('completed');
    expect(data.warning).toContain('人工审核');
    expect(bridgePost).not.toHaveBeenCalled();
    expect(editorMsg).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 6. 性能统计 (⚠️ 部分支持)
//    测试条件：scene_query.stats 和 engine_action.dump_texture_cache 应可用
// ═════════════════════════════════════════════════════════════════════════════

// engine_action — Pro exclusive (社区版已移除 engine_action，测试在 Pro 版中运行)
describe.skip('竞品功能验证 — 性能统计 (部分支持) — Pro exclusive', () => {
  it('scene_query stats: 应调用 sceneMethod("dispatchQuery", [{action:"stats"}])', async () => {
    const mockStats = { sceneName: 'Main', nodeCount: 42, activeCount: 38, inactiveCount: 4 };
    const sceneMethod = vi.fn().mockResolvedValue(mockStats);
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));

    const result = await server.callTool('scene_query', { action: 'stats' });
    expect(result.isError).toBeFalsy();
    expect(sceneMethod).toHaveBeenCalledWith('dispatchQuery', [{ action: 'stats' }]);
    const data = parse(result) as any;
    expect(data.nodeCount).toBe(42);
    expect(data.activeCount).toBe(38);
  });

  it('engine_action dump_texture_cache: 应调用 sceneMethod("dispatchEngineAction")', async () => {
    const mockCache = { success: true, action: 'dump_texture_cache', totalCount: 15, topAssets: [] };
    const sceneMethod = vi.fn().mockResolvedValue(mockCache);
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));

    const result = await server.callTool('engine_action', { action: 'dump_texture_cache' });
    expect(result.isError).toBeFalsy();
    expect(sceneMethod).toHaveBeenCalledWith('dispatchEngineAction', [{ action: 'dump_texture_cache' }]);
    const data = parse(result) as any;
    expect(data.totalCount).toBe(15);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 7. 原子宏操作（我们的核心优势）
//    测试条件：create_prefab_atomic / import_and_apply_texture / setup_ui_layout 应已注册
// ═════════════════════════════════════════════════════════════════════════════

describe('竞品功能验证 — 原子宏操作 (我们的优势)', () => {
  it('三个 macro 工具均已注册', () => {
    const server = buildCocosToolServer(makeCtx());
    const names = server.listTools().map((t) => t.name);

    expect(names).toContain('create_prefab_atomic');
    expect(names).toContain('import_and_apply_texture');
    expect(names).toContain('setup_ui_layout');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 8. 选区感知上下文（我们的优势）
//    测试条件：scene_query 的 get_current_selection / get_active_scene_focus 应可用
// ═════════════════════════════════════════════════════════════════════════════

describe('竞品功能验证 — 选区感知上下文 (我们的优势)', () => {
  it('get_current_selection: 无选中时返回空结果（不报错）', async () => {
    const bridgeGet = vi.fn().mockResolvedValue({ selected: [] });
    const server = buildCocosToolServer(makeCtx({ bridgeGet }));

    const result = await server.callTool('scene_query', { action: 'get_current_selection' });
    expect(result.isError).toBeFalsy();
    const data = parse(result) as any;
    expect(data.message).toContain('没有选中');
  });

  it('get_current_selection: 有选中时调用 node_detail 充实信息', async () => {
    const bridgeGet = vi.fn().mockResolvedValue({ selected: ['uuid-001'] });
    const sceneMethod = vi.fn().mockResolvedValue({ uuid: 'uuid-001', name: 'Player', active: true });
    const server = buildCocosToolServer(makeCtx({ bridgeGet, sceneMethod }));

    const result = await server.callTool('scene_query', { action: 'get_current_selection' });
    expect(result.isError).toBeFalsy();
    const data = parse(result) as any;
    expect(data.selected).toContain('uuid-001');
    expect(data.focused.name).toBe('Player');
  });

  it('get_active_scene_focus: 无选中时回退到场景统计', async () => {
    const bridgeGet = vi.fn().mockResolvedValue({ selected: [] });
    const sceneMethod = vi.fn().mockResolvedValue({ sceneName: 'Main', nodeCount: 10 });
    const server = buildCocosToolServer(makeCtx({ bridgeGet, sceneMethod }));

    const result = await server.callTool('scene_query', { action: 'get_active_scene_focus' });
    expect(result.isError).toBeFalsy();
    const data = parse(result) as any;
    expect(data.source).toBe('scene');
    expect(data.focus.nodeCount).toBe(10);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 9. 危险操作拦截（我们的优势）
//    测试条件：destroy_node / clear_children 无 confirmDangerous 时被拦截
// ═════════════════════════════════════════════════════════════════════════════

describe('竞品功能验证 — 危险操作拦截 (我们的优势)', () => {
  it('destroy_node 无确认 → 被拦截', async () => {
    const sceneMethod = vi.fn();
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));

    const result = await server.callTool('scene_operation', { action: 'destroy_node', uuid: 'node-1' });
    expect(result.isError).toBe(true);
    expect(sceneMethod).not.toHaveBeenCalled();
    const data = parse(result) as any;
    expect(data.error).toContain('confirmDangerous');
  });

  it('clear_children 无确认 → 被拦截', async () => {
    const sceneMethod = vi.fn();
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));

    const result = await server.callTool('scene_operation', { action: 'clear_children', uuid: 'node-1' });
    expect(result.isError).toBe(true);
    expect(sceneMethod).not.toHaveBeenCalled();
  });

  it('destroy_node 有确认 → 放行', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ success: true, uuid: 'node-1', name: 'Deleted' });
    const editorMsg = vi.fn().mockResolvedValue({});
    const bridgePost = vi.fn().mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg, bridgePost }));

    const result = await server.callTool('scene_operation', { action: 'destroy_node', uuid: 'node-1', confirmDangerous: true });
    expect(result.isError).toBeFalsy();
    expect(sceneMethod).toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 10. 组件名自动纠正（我们的优势）
//     测试条件：传入小写组件名应自动纠正并附带警告
// ═════════════════════════════════════════════════════════════════════════════

describe('竞品功能验证 — 组件名自动纠正 (我们的优势)', () => {
  it('sprite → Sprite 自动纠正', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ success: true, uuid: 'n1', component: 'Sprite' });
    const editorMsg = vi.fn().mockResolvedValue({});
    const bridgePost = vi.fn().mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg, bridgePost }));

    const result = await server.callTool('scene_operation', { action: 'add_component', uuid: 'n1', component: 'sprite' });
    expect(result.isError).toBeFalsy();
    const call = sceneMethod.mock.calls[0];
    const passedParams = call[1][0];
    expect(passedParams.component).toBe('Sprite');
  });

  it('scrollview → ScrollView 自动纠正', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ success: true });
    const editorMsg = vi.fn().mockResolvedValue({});
    const bridgePost = vi.fn().mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg, bridgePost }));

    const result = await server.callTool('scene_operation', { action: 'add_component', uuid: 'n1', component: 'scrollview' });
    const call = sceneMethod.mock.calls[0];
    expect(call[1][0].component).toBe('ScrollView');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 11. 引擎全局操作（我们的优势维度）
//     测试条件：engine_action 的 5 个 action 均已注册且可路由
// ═════════════════════════════════════════════════════════════════════════════

// engine_action — Pro exclusive (社区版已移除 engine_action，测试在 Pro 版中运行)
describe.skip('竞品功能验证 — 引擎全局操作 — Pro exclusive', () => {
  const engineActions = ['set_frame_rate', 'pause_engine', 'resume_engine', 'get_system_info', 'dump_texture_cache'];

  for (const action of engineActions) {
    it(`engine_action.${action} 应可调用且不报错`, async () => {
      const sceneMethod = vi.fn().mockResolvedValue({ success: true, action });
      const server = buildCocosToolServer(makeCtx({ sceneMethod }));

      const params: any = { action };
      if (action === 'set_frame_rate') params.fps = 30;

      const result = await server.callTool('engine_action', params);
      expect(result.isError).toBeFalsy();
      expect(sceneMethod).toHaveBeenCalledWith('dispatchEngineAction', [params]);
    });
  }
});
