import { describe, it, expect, vi } from 'vitest';
import { buildCocosToolServer, type BridgeToolContext } from '../../src/mcp/tools';
import type { ToolCallResult } from '../../src/mcp/local-tool-server';

// ─────────────────────────────────────────────────────────────────────────────
// 新增竞品功能测试：验证所有 ❌ → ✅ 的功能已实现
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
// 1. 场景列表查询 (list_all_scenes)
// ═════════════════════════════════════════════════════════════════════════════
describe('新增功能 — 场景列表查询', () => {
    it('list_all_scenes 调用 editorMsg 查询所有 .scene 文件', async () => {
        const mockScenes = [
            { url: 'db://assets/scenes/main.scene', uuid: 'uuid-1' },
            { url: 'db://assets/scenes/level1.scene', uuid: 'uuid-2' },
        ];
        const editorMsg = vi.fn().mockResolvedValue(mockScenes);
        const server = buildCocosToolServer(makeCtx({ editorMsg }));

        const result = await server.callTool('scene_query', { action: 'list_all_scenes' });
        expect(result.isError).toBeFalsy();
        expect(editorMsg).toHaveBeenCalledWith('asset-db', 'query-assets', { pattern: 'db://assets/**/*.scene' });
        const data = parse(result) as any[];
        expect(data).toHaveLength(2);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. 场景验证/完整性 (validate_scene)
// ═════════════════════════════════════════════════════════════════════════════
describe('新增功能 — 场景验证/完整性', () => {
    it('validate_scene 路由到 sceneMethod("dispatchQuery")', async () => {
        const mockResult = { valid: true, totalNodes: 10, issueCount: 0, issues: [] };
        const sceneMethod = vi.fn().mockResolvedValue(mockResult);
        const server = buildCocosToolServer(makeCtx({ sceneMethod }));

        const result = await server.callTool('scene_query', { action: 'validate_scene' });
        expect(result.isError).toBeFalsy();
        expect(sceneMethod).toHaveBeenCalledWith('dispatchQuery', [{ action: 'validate_scene' }]);
        const data = parse(result) as any;
        expect(data.valid).toBe(true);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. 2D/3D 类型检测 (detect_2d_3d)
// ═════════════════════════════════════════════════════════════════════════════
describe('新增功能 — 2D/3D 类型检测', () => {
    it('detect_2d_3d 路由到 sceneMethod("dispatchQuery")', async () => {
        const mockResult = { sceneType: '2d', has2D: true, has3D: false, sample2DNodes: [], sample3DNodes: [] };
        const sceneMethod = vi.fn().mockResolvedValue(mockResult);
        const server = buildCocosToolServer(makeCtx({ sceneMethod }));

        const result = await server.callTool('scene_query', { action: 'detect_2d_3d' });
        expect(result.isError).toBeFalsy();
        expect(sceneMethod).toHaveBeenCalledWith('dispatchQuery', [{ action: 'detect_2d_3d' }]);
        const data = parse(result) as any;
        expect(data.sceneType).toBe('2d');
    });

    it('detect_2d_3d 支持传入 uuid 限定检测范围', async () => {
        const sceneMethod = vi.fn().mockResolvedValue({ sceneType: '3d' });
        const server = buildCocosToolServer(makeCtx({ sceneMethod }));

        await server.callTool('scene_query', { action: 'detect_2d_3d', uuid: 'node-123' });
        expect(sceneMethod).toHaveBeenCalledWith('dispatchQuery', [{ action: 'detect_2d_3d', uuid: 'node-123' }]);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. 属性重置 (reset_property)
// ═════════════════════════════════════════════════════════════════════════════
describe('新增功能 — 属性重置', () => {
    it('reset_property 路由到 editorMsg reset-property', async () => {
        const editorMsg = vi.fn().mockResolvedValue({});
        const server = buildCocosToolServer(makeCtx({ editorMsg }));

        const result = await server.callTool('scene_operation', {
            action: 'reset_property', uuid: 'n1', component: 'Label', property: 'fontSize',
        });
        expect(result.isError).toBeFalsy();
        expect(editorMsg).toHaveBeenCalledWith('scene', 'reset-property', { uuid: 'n1', path: 'Label.fontSize' });
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 5. 剪贴板操作 (clipboard_copy / clipboard_paste)
// ═════════════════════════════════════════════════════════════════════════════
describe('新增功能 — 剪贴板操作（社区版边界）', () => {
    it('clipboard_copy / clipboard_paste 在社区版返回未开放', async () => {
        const server = buildCocosToolServer(makeCtx());
        const copyResult = await server.callTool('scene_operation', { action: 'clipboard_copy', uuid: 'node-1' });
        const pasteResult = await server.callTool('scene_operation', { action: 'clipboard_paste', parentUuid: 'parent-1' });
        expect(copyResult.isError).toBe(true);
        expect(pasteResult.isError).toBe(true);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 6. 预制体实例化到场景 (instantiate_prefab)
// ═════════════════════════════════════════════════════════════════════════════
describe('新增功能 — 预制体实例化到场景', () => {
    it('instantiate_prefab 缺少 prefabUrl 时返回错误', async () => {
        const server = buildCocosToolServer(makeCtx());
        const result = await server.callTool('scene_operation', { action: 'instantiate_prefab' });
        expect(result.isError).toBe(true);
    });

    it('instantiate_prefab 查询 uuid 并通过 scene-script 实例化', async () => {
        const editorMsg = vi.fn()
            .mockResolvedValueOnce('prefab-uuid-123'); // query-uuid
        const sceneMethod = vi.fn().mockResolvedValue({ uuid: 'new-node-uuid' });
        const server = buildCocosToolServer(makeCtx({ editorMsg, sceneMethod }));

        const result = await server.callTool('scene_operation', {
            action: 'instantiate_prefab', prefabUrl: 'db://assets/prefabs/Player.prefab',
        });
        expect(result.isError).toBeFalsy();
        expect(editorMsg).toHaveBeenCalledWith('asset-db', 'query-uuid', 'db://assets/prefabs/Player.prefab');
        expect(sceneMethod).toHaveBeenCalledWith('instantiatePrefab', ['prefab-uuid-123', '']);
    });

    it('instantiate_prefab 预制体不存在时返回错误', async () => {
        const editorMsg = vi.fn().mockResolvedValue(null);
        const server = buildCocosToolServer(makeCtx({ editorMsg }));

        const result = await server.callTool('scene_operation', {
            action: 'instantiate_prefab', prefabUrl: 'db://assets/prefabs/NotExist.prefab',
        });
        expect(result.isError).toBe(true);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 7. 预制体应用/还原 (apply_prefab / restore_prefab)
// ═════════════════════════════════════════════════════════════════════════════
describe('新增功能 — 预制体应用/还原', () => {
    it('apply_prefab 缺少 uuid 时返回错误', async () => {
        const server = buildCocosToolServer(makeCtx());
        const result = await server.callTool('scene_operation', { action: 'apply_prefab' });
        expect(result.isError).toBe(true);
    });

    it('apply_prefab 调用 editorMsg 应用预制体更改', async () => {
        const editorMsg = vi.fn().mockResolvedValue({});
        const server = buildCocosToolServer(makeCtx({ editorMsg }));

        const result = await server.callTool('scene_operation', { action: 'apply_prefab', uuid: 'prefab-inst-1' });
        expect(result.isError).toBeFalsy();
        expect(editorMsg).toHaveBeenCalledWith('scene', 'apply-prefab', 'prefab-inst-1');
    });

    it('restore_prefab 缺少 uuid 时返回错误', async () => {
        const server = buildCocosToolServer(makeCtx());
        const result = await server.callTool('scene_operation', { action: 'restore_prefab' });
        expect(result.isError).toBe(true);
    });

    it('restore_prefab 调用 editorMsg 恢复预制体', async () => {
        const editorMsg = vi.fn().mockResolvedValue({});
        const server = buildCocosToolServer(makeCtx({ editorMsg }));

        const result = await server.callTool('scene_operation', { action: 'restore_prefab', uuid: 'prefab-inst-1' });
        expect(result.isError).toBeFalsy();
        expect(editorMsg).toHaveBeenCalledWith('scene', 'restore-prefab', 'prefab-inst-1');
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 9. 预制体验证 (validate_prefab)
// ═════════════════════════════════════════════════════════════════════════════
describe('新增功能 — 预制体验证', () => {
    it('validate_prefab 缺少 prefabUrl 时返回错误', async () => {
        const server = buildCocosToolServer(makeCtx());
        const result = await server.callTool('scene_operation', { action: 'validate_prefab' });
        expect(result.isError).toBe(true);
    });

    it('validate_prefab 检查预制体存在性和依赖', async () => {
        const editorMsg = vi.fn()
            .mockResolvedValueOnce({ uuid: 'prefab-uuid', type: 'cc.Prefab' }) // query-asset-info
            .mockResolvedValueOnce(['dep-1', 'dep-2']); // query-asset-dependencies
        const server = buildCocosToolServer(makeCtx({ editorMsg }));

        const result = await server.callTool('scene_operation', {
            action: 'validate_prefab', prefabUrl: 'db://assets/prefabs/Player.prefab',
        });
        expect(result.isError).toBeFalsy();
        const data = parse(result) as any;
        expect(data.valid).toBe(true);
        expect(data.dependencies).toEqual(['dep-1', 'dep-2']);
    });

    it('validate_prefab 预制体不存在时返回 valid=false', async () => {
        const editorMsg = vi.fn().mockResolvedValue(null);
        const server = buildCocosToolServer(makeCtx({ editorMsg }));

        const result = await server.callTool('scene_operation', {
            action: 'validate_prefab', prefabUrl: 'db://assets/prefabs/NotExist.prefab',
        });
        const data = parse(result) as any;
        expect(data.valid).toBe(false);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 10. Gizmo/坐标系控制 (set_transform_tool / set_coordinate)
// ═════════════════════════════════════════════════════════════════════════════
// set_transform_tool / set_coordinate — Pro exclusive (社区版已裁剪)
describe('新增功能 — Gizmo/坐标系控制（社区版边界）', () => {
    it('set_transform_tool / set_coordinate 在社区版返回 isError', async () => {
        const server = buildCocosToolServer(makeCtx());
        const a = await server.callTool('editor_action', { action: 'set_transform_tool', toolType: 'rotation' });
        const b = await server.callTool('editor_action', { action: 'set_coordinate', coordinate: 'world' });
        expect(a.isError).toBe(true);
        expect(b.isError).toBe(true);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 11. 场景视图工具 (toggle_grid / toggle_snap)
// ═════════════════════════════════════════════════════════════════════════════
// toggle_grid / toggle_snap — Pro exclusive (社区版已裁剪)
describe('新增功能 — 场景视图工具（社区版边界）', () => {
    it('toggle_grid / toggle_snap 在社区版返回 isError', async () => {
        const server = buildCocosToolServer(makeCtx());
        const a = await server.callTool('editor_action', { action: 'toggle_grid', visible: false });
        const b = await server.callTool('editor_action', { action: 'toggle_snap', enabled: true });
        expect(a.isError).toBe(true);
        expect(b.isError).toBe(true);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 12. 日志分析/模式匹配 (get_console_logs / search_logs)
// ═════════════════════════════════════════════════════════════════════════════
// get_console_logs / search_logs — Pro exclusive (社区版已裁剪)
describe('新增功能 — 日志分析/模式匹配（社区版边界）', () => {
    it('get_console_logs / search_logs 在社区版返回 isError', async () => {
        const server = buildCocosToolServer(makeCtx());
        const a = await server.callTool('editor_action', { action: 'get_console_logs', logType: 'warn', logCount: 20 });
        const b = await server.callTool('editor_action', { action: 'search_logs', keyword: 'error' });
        expect(a.isError).toBe(true);
        expect(b.isError).toBe(true);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 13. 资源验证 (validate_asset)
// ═════════════════════════════════════════════════════════════════════════════
// validate_asset — Pro exclusive (社区版已裁剪)
describe('新增功能 — 资源验证（社区版边界）', () => {
    it('validate_asset 在社区版返回 isError', async () => {
        const server = buildCocosToolServer(makeCtx());
        const result = await server.callTool('asset_operation', { action: 'validate_asset', url: 'db://assets/main.ts' });
        expect(result.isError).toBe(true);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 14. 资源清单导出 (export_asset_manifest)
// ═════════════════════════════════════════════════════════════════════════════
// export_asset_manifest — Pro exclusive (社区版已裁剪)
describe('新增功能 — 资源清单导出（社区版边界）', () => {
    it('export_asset_manifest 在社区版返回 isError', async () => {
        const server = buildCocosToolServer(makeCtx());
        const result = await server.callTool('asset_operation', { action: 'export_asset_manifest' });
        expect(result.isError).toBe(true);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 15. 可用组件类型发现 (list_available_components)
// ═════════════════════════════════════════════════════════════════════════════
describe('新增功能 — 可用组件类型发现', () => {
    it('list_available_components 路由到 sceneMethod("dispatchQuery")', async () => {
        const mockResult = {
            totalCount: 85,
            categorySummary: { '2d_ui': 20, '3d_rendering': 15, 'animation': 3, 'user_defined': 47 },
            categories: { '2d_ui': ['Sprite', 'Label'], user_defined: ['PlayerController'] },
            components: [{ name: 'Sprite', fullName: 'cc.Sprite', category: '2d_ui', isBuiltin: true }],
        };
        const sceneMethod = vi.fn().mockResolvedValue(mockResult);
        const server = buildCocosToolServer(makeCtx({ sceneMethod }));

        const result = await server.callTool('scene_query', { action: 'list_available_components' });
        expect(result.isError).toBeFalsy();
        expect(sceneMethod).toHaveBeenCalledWith('dispatchQuery', [{ action: 'list_available_components' }]);
        const data = parse(result) as any;
        expect(data.totalCount).toBe(85);
        expect(data.categorySummary.user_defined).toBe(47);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 16. 工具注册完整性检查 — 确认所有新 action 已注册
// ═════════════════════════════════════════════════════════════════════════════
describe('新增功能 — 工具注册完整性 (社区版)', () => {
    it('社区版保留的新增 action 都在各工具的 enum 中', () => {
        const server = buildCocosToolServer(makeCtx());
        const tools = server.listTools();
        const getSchema = (name: string) => tools.find(t => t.name === name)?.inputSchema as any;

        // scene_query 新增 4 个 (社区版保留)
        const sqSchema = getSchema('scene_query');
        const sqActions = sqSchema?.properties?.action?.enum || [];
        expect(sqActions).toContain('list_all_scenes');
        expect(sqActions).toContain('validate_scene');
        expect(sqActions).toContain('detect_2d_3d');
        expect(sqActions).toContain('list_available_components');

        // scene_operation 社区版保留的 action 抽样检查
        const soSchema = getSchema('scene_operation');
        const soActions = soSchema?.properties?.action?.enum || [];
        expect(soActions).toContain('reset_property');
        expect(soActions).toContain('instantiate_prefab');
        expect(soActions).toContain('apply_prefab');
        expect(soActions).toContain('restore_prefab');
        expect(soActions).toContain('validate_prefab');
    });

    // Pro 独占 action 注册检查 (社区版已裁剪)
    it('Pro 独占 action: asset_operation 在社区版 schema 中不存在', () => {
        const server = buildCocosToolServer(makeCtx());
        const tools = server.listTools();
        const getSchema = (name: string) => tools.find(t => t.name === name)?.inputSchema as any;
        const aoSchema = getSchema('asset_operation');
        const aoActions = aoSchema?.properties?.action?.enum || [];
        expect(aoActions).not.toContain('validate_asset');
        expect(aoActions).not.toContain('export_asset_manifest');
    });

    it('Pro 独占 action: editor_action 在社区版 schema 中不存在', () => {
        const server = buildCocosToolServer(makeCtx());
        const tools = server.listTools();
        const getSchema = (name: string) => tools.find(t => t.name === name)?.inputSchema as any;
        const eaSchema = getSchema('editor_action');
        const eaActions = eaSchema?.properties?.action?.enum || [];
        expect(eaActions).not.toContain('set_transform_tool');
        expect(eaActions).not.toContain('set_coordinate');
        expect(eaActions).not.toContain('toggle_grid');
        expect(eaActions).not.toContain('toggle_snap');
        expect(eaActions).not.toContain('get_console_logs');
        expect(eaActions).not.toContain('search_logs');
    });
});
