import { describe, it, expect, vi } from 'vitest';
import { buildCocosToolServer, type BridgeToolContext } from '../../src/mcp/tools';
import type { ToolCallResult } from '../../src/mcp/local-tool-server';

// ─────────────────────────────────────────────────────────────────────────────
// 竞品分析专项测试：验证我们在分析报告中声称支持的功能确实可用
// ─────────────────────────────────────────────────────────────────────────────

function makeCtx(overrides: Partial<BridgeToolContext> = {}): BridgeToolContext {
  const sceneMethod = overrides.sceneMethod ?? vi.fn().mockResolvedValue({});
  return {
    bridgeGet: vi.fn().mockResolvedValue({}),
    bridgePost: vi.fn().mockResolvedValue({}),
    sceneMethod,
    sceneOp: overrides.sceneOp ?? (async (params: Record<string, unknown>) => sceneMethod('dispatchOperation', [params])),
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

describe('竞品功能验证 — 动画剪辑/材质列表（社区版边界）', () => {
  it('get_animation_clips / get_materials 在社区版返回 isError', async () => {
    const server = buildCocosToolServer(makeCtx());
    const a = await server.callTool('asset_operation', { action: 'get_animation_clips' });
    const b = await server.callTool('asset_operation', { action: 'get_materials' });
    expect(a.isError).toBe(true);
    expect(b.isError).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. 在资源管理器中显示
//    测试条件：调用 show_in_explorer 应路由到 editorMsg("asset-db", "open-asset")
// ═════════════════════════════════════════════════════════════════════════════

describe('竞品功能验证 — 在资源管理器中显示（社区版边界）', () => {
  it('show_in_explorer 在社区版返回 isError', async () => {
    const server = buildCocosToolServer(makeCtx());
    const result = await server.callTool('asset_operation', { action: 'show_in_explorer', url: 'db://assets/prefabs/Player.prefab' });
    expect(result.isError).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. 图集打包 (⚠️ 部分支持)
//    测试条件：pack_atlas 应调用 reimport-asset（我们标记为"仅 reimport 封装"）
// ═════════════════════════════════════════════════════════════════════════════

describe('竞品功能验证 — 图集打包（社区版边界）', () => {
  it('pack_atlas 在社区版返回 isError', async () => {
    const server = buildCocosToolServer(makeCtx());
    const result = await server.callTool('asset_operation', { action: 'pack_atlas', url: 'db://assets/atlas/ui-sprites' });
    expect(result.isError).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 5. 清理未使用资源 (⚠️ 仅提示)
//    测试条件：clean_unused 应返回提示信息，不实际执行删除
// ═════════════════════════════════════════════════════════════════════════════

describe('竞品功能验证 — 清理未使用资源（社区版边界）', () => {
  it('clean_unused 在社区版返回 isError', async () => {
    const server = buildCocosToolServer(makeCtx());
    const result = await server.callTool('asset_operation', { action: 'clean_unused' });
    expect(result.isError).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 6. 性能统计 (⚠️ 部分支持)
//    测试条件：scene_query.stats 和 engine_action.dump_texture_cache 应可用
// ═════════════════════════════════════════════════════════════════════════════

// engine_action — Pro exclusive (社区版已移除 engine_action，测试在 Pro 版中运行)
describe('竞品功能验证 — 性能统计 (社区版可用 + Pro边界)', () => {
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

  it('engine_action dump_texture_cache: 社区版返回 isError', async () => {
    const server = buildCocosToolServer(makeCtx());
    const result = await server.callTool('engine_action', { action: 'dump_texture_cache' });
    expect(result.isError).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 7. 原子宏操作（我们的核心优势）
//    测试条件：社区版仅保留已开放的原子宏；Pro 独占宏不应出现在 JS 注册结果中
// ═════════════════════════════════════════════════════════════════════════════

describe('竞品功能验证 — 原子宏操作 (我们的优势)', () => {
  it('社区版仅注册已开放的 atomic 工具', () => {
    const server = buildCocosToolServer(makeCtx());
    const names = server.listTools().map((t) => t.name);

    expect(names).toContain('create_prefab_atomic');
    expect(names).toContain('import_and_apply_texture');
    expect(names).not.toContain('setup_ui_layout');
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
    const editorMsg = vi.fn().mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ editorMsg }));

    const result = await server.callTool('scene_operation', { action: 'destroy_node', uuid: 'node-1', confirmDangerous: true });
    expect(result.isError).toBeFalsy();
    expect(editorMsg).toHaveBeenCalledWith('scene', 'remove-node', { uuid: 'node-1' });
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
describe('竞品功能验证 — 引擎全局操作（社区版边界）', () => {
  const engineActions = ['set_frame_rate', 'pause_engine', 'resume_engine', 'get_system_info', 'dump_texture_cache'];

  for (const action of engineActions) {
    it(`engine_action.${action} 在社区版返回 isError`, async () => {
      const server = buildCocosToolServer(makeCtx());

      const params: any = { action };
      if (action === 'set_frame_rate') params.fps = 30;

      const result = await server.callTool('engine_action', params);
      expect(result.isError).toBe(true);
    });
  }
});
