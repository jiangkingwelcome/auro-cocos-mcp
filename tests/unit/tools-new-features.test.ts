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
    it('reset_property 路由到 sceneMethod("dispatchOperation")', async () => {
        const mockResult = { success: true, uuid: 'n1', component: 'Label', property: 'fontSize', oldValue: 30, newValue: 40 };
        const sceneMethod = vi.fn().mockResolvedValue(mockResult);
        const editorMsg = vi.fn().mockResolvedValue({});
        const bridgePost = vi.fn().mockResolvedValue({});
        const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg, bridgePost }));

        const result = await server.callTool('scene_operation', {
            action: 'reset_property', uuid: 'n1', component: 'Label', property: 'fontSize',
        });
        expect(result.isError).toBeFalsy();
        expect(sceneMethod).toHaveBeenCalledWith('dispatchOperation', expect.any(Array));
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 5. 剪贴板操作 (clipboard_copy / clipboard_paste)
// ═════════════════════════════════════════════════════════════════════════════
describe.skip('新增功能 — 剪贴板操作 — Pro exclusive', () => {
    it('clipboard_copy 缺少 uuid 时返回错误', async () => {
        const server = buildCocosToolServer(makeCtx());
        const result = await server.callTool('scene_operation', { action: 'clipboard_copy' });
        expect(result.isError).toBe(true);
    });

    it('clipboard_copy 调用 bridgePost 选择并 editorMsg 复制节点', async () => {
        const editorMsg = vi.fn().mockResolvedValue({});
        const bridgePost = vi.fn().mockResolvedValue({});
        const server = buildCocosToolServer(makeCtx({ editorMsg, bridgePost }));

        const result = await server.callTool('scene_operation', { action: 'clipboard_copy', uuid: 'node-1' });
        expect(result.isError).toBeFalsy();
        expect(bridgePost).toHaveBeenCalledWith('/api/editor/select', { uuids: ['node-1'], forceRefresh: true });
        expect(editorMsg).toHaveBeenCalledWith('scene', 'copy-node', ['node-1']);
    });

    it('clipboard_paste 调用 editorMsg 粘贴节点', async () => {
        const editorMsg = vi.fn().mockResolvedValue({});
        const server = buildCocosToolServer(makeCtx({ editorMsg }));

        const result = await server.callTool('scene_operation', { action: 'clipboard_paste', parentUuid: 'parent-1' });
        expect(result.isError).toBeFalsy();
        expect(editorMsg).toHaveBeenCalledWith('scene', 'paste-node', 'parent-1');
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

    it('instantiate_prefab 查询 uuid 并调用 create-node-by-prefab', async () => {
        const editorMsg = vi.fn()
            .mockResolvedValueOnce('prefab-uuid-123') // query-uuid
            .mockResolvedValueOnce({ uuid: 'new-node-uuid' }); // create-node-by-prefab
        const server = buildCocosToolServer(makeCtx({ editorMsg }));

        const result = await server.callTool('scene_operation', {
            action: 'instantiate_prefab', prefabUrl: 'db://assets/prefabs/Player.prefab',
        });
        expect(result.isError).toBeFalsy();
        expect(editorMsg).toHaveBeenCalledWith('asset-db', 'query-uuid', 'db://assets/prefabs/Player.prefab');
        expect(editorMsg).toHaveBeenCalledWith('scene', 'create-node-by-prefab', 'prefab-uuid-123', undefined);
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
// 7. 预制体编辑模式 (enter_prefab_edit / exit_prefab_edit)
// ═════════════════════════════════════════════════════════════════════════════
describe('新增功能 — 预制体编辑模式', () => {
    it('enter_prefab_edit 缺少 uuid 时返回错误', async () => {
        const server = buildCocosToolServer(makeCtx());
        const result = await server.callTool('scene_operation', { action: 'enter_prefab_edit' });
        expect(result.isError).toBe(true);
    });

    it('enter_prefab_edit 调用 editorMsg 进入预制体编辑', async () => {
        const editorMsg = vi.fn().mockResolvedValue({});
        const server = buildCocosToolServer(makeCtx({ editorMsg }));

        const result = await server.callTool('scene_operation', { action: 'enter_prefab_edit', uuid: 'prefab-node-1' });
        expect(result.isError).toBeFalsy();
        expect(editorMsg).toHaveBeenCalledWith('scene', 'enter-prefab-edit-mode', 'prefab-node-1');
    });

    it('exit_prefab_edit 调用 editorMsg 退出预制体编辑', async () => {
        const editorMsg = vi.fn().mockResolvedValue({});
        const server = buildCocosToolServer(makeCtx({ editorMsg }));

        const result = await server.callTool('scene_operation', { action: 'exit_prefab_edit' });
        expect(result.isError).toBeFalsy();
        expect(editorMsg).toHaveBeenCalledWith('scene', 'exit-prefab-edit-mode');
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 8. 预制体应用/还原 (apply_prefab / restore_prefab)
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
describe.skip('新增功能 — Gizmo/坐标系控制 — Pro exclusive', () => {
    it('set_transform_tool 调用 editorMsg 设置 gizmo 模式', async () => {
        const editorMsg = vi.fn().mockResolvedValue(null);
        const server = buildCocosToolServer(makeCtx({ editorMsg }));

        const result = await server.callTool('editor_action', { action: 'set_transform_tool', toolType: 'rotation' });
        expect(result.isError).toBeFalsy();
        expect(editorMsg).toHaveBeenCalledWith('scene', 'set-transform-tool', 'rotation');
    });

    it('set_transform_tool 默认为 position 模式', async () => {
        const editorMsg = vi.fn().mockResolvedValue(null);
        const server = buildCocosToolServer(makeCtx({ editorMsg }));

        await server.callTool('editor_action', { action: 'set_transform_tool' });
        expect(editorMsg).toHaveBeenCalledWith('scene', 'set-transform-tool', 'position');
    });

    it('set_coordinate 调用 editorMsg 设置坐标系', async () => {
        const editorMsg = vi.fn().mockResolvedValue(null);
        const server = buildCocosToolServer(makeCtx({ editorMsg }));

        const result = await server.callTool('editor_action', { action: 'set_coordinate', coordinate: 'world' });
        expect(result.isError).toBeFalsy();
        expect(editorMsg).toHaveBeenCalledWith('scene', 'set-coordinate', 'world');
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 11. 场景视图工具 (toggle_grid / toggle_snap)
// ═════════════════════════════════════════════════════════════════════════════
// toggle_grid / toggle_snap — Pro exclusive (社区版已裁剪)
describe.skip('新增功能 — 场景视图工具 — Pro exclusive', () => {
    it('toggle_grid 调用 editorMsg 控制网格可见性', async () => {
        const editorMsg = vi.fn().mockResolvedValue(null);
        const server = buildCocosToolServer(makeCtx({ editorMsg }));

        const result = await server.callTool('editor_action', { action: 'toggle_grid', visible: false });
        expect(result.isError).toBeFalsy();
        expect(editorMsg).toHaveBeenCalledWith('scene', 'set-grid-visible', false);
    });

    it('toggle_snap 调用 editorMsg 控制吸附模式', async () => {
        const editorMsg = vi.fn().mockResolvedValue(null);
        const server = buildCocosToolServer(makeCtx({ editorMsg }));

        const result = await server.callTool('editor_action', { action: 'toggle_snap', enabled: true });
        expect(result.isError).toBeFalsy();
        expect(editorMsg).toHaveBeenCalledWith('scene', 'set-snap', true);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 12. 日志分析/模式匹配 (get_console_logs / search_logs)
// ═════════════════════════════════════════════════════════════════════════════
// get_console_logs / search_logs — Pro exclusive (社区版已裁剪)
describe.skip('新增功能 — 日志分析/模式匹配 — Pro exclusive', () => {
    it('get_console_logs 调用 bridgeGet 获取日志', async () => {
        const mockLogs = [{ text: 'log1' }, { text: 'log2' }];
        const bridgeGet = vi.fn().mockResolvedValue(mockLogs);
        const server = buildCocosToolServer(makeCtx({ bridgeGet }));

        const result = await server.callTool('editor_action', { action: 'get_console_logs', logType: 'warn', logCount: 20 });
        expect(result.isError).toBeFalsy();
        expect(bridgeGet).toHaveBeenCalledWith('/api/console/logs', { type: 'warn', count: '20' });
    });

    it('search_logs 缺少 keyword 时返回错误', async () => {
        const server = buildCocosToolServer(makeCtx());
        const result = await server.callTool('editor_action', { action: 'search_logs' });
        expect(result.isError).toBe(true);
    });

    it('search_logs 获取日志并按关键词过滤', async () => {
        const mockLogs = [
            { text: 'Error: failed to load asset' },
            { text: 'Info: scene loaded' },
            { text: 'Error: missing component' },
        ];
        const bridgeGet = vi.fn().mockResolvedValue(mockLogs);
        const server = buildCocosToolServer(makeCtx({ bridgeGet }));

        const result = await server.callTool('editor_action', { action: 'search_logs', keyword: 'error' });
        expect(result.isError).toBeFalsy();
        const data = parse(result) as any;
        expect(data.matchCount).toBe(2);
        expect(data.keyword).toBe('error');
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 13. 资源验证 (validate_asset)
// ═════════════════════════════════════════════════════════════════════════════
// validate_asset — Pro exclusive (社区版已裁剪)
describe.skip('新增功能 — 资源验证 — Pro exclusive', () => {
    it('validate_asset 缺少 url 时返回错误', async () => {
        const server = buildCocosToolServer(makeCtx());
        const result = await server.callTool('asset_operation', { action: 'validate_asset' });
        expect(result.isError).toBe(true);
    });

    it('validate_asset 资源不存在时返回 valid=false', async () => {
        const bridgeGet = vi.fn().mockResolvedValue(null);
        const editorMsg = vi.fn();
        const server = buildCocosToolServer(makeCtx({ bridgeGet, editorMsg }));
        const result = await server.callTool('asset_operation', { action: 'validate_asset', url: 'db://assets/notexist.ts' });
        const data = parse(result) as any;
        expect(data.valid).toBe(false);
        expect(data.issues.some((i: any) => (i.message || i).includes('资源文件未找到'))).toBe(true);
    });

    it('validate_asset 资源存在且依赖完整时返回 valid=true', async () => {
        const bridgeGet = vi.fn()
            .mockResolvedValueOnce({ uuid: 'u1', type: 'cc.Script' }); // query-asset-info
        const editorMsg = vi.fn()
            .mockResolvedValueOnce({ ver: '1.0' })                     // query-asset-meta
            .mockResolvedValueOnce([])                                  // query-asset-dependencies (empty)
            .mockResolvedValueOnce([]);                                 // query-dependents (empty)
        const server = buildCocosToolServer(makeCtx({ bridgeGet, editorMsg }));
        const result = await server.callTool('asset_operation', { action: 'validate_asset', url: 'db://assets/scripts/main.ts' });
        const data = parse(result) as any;
        expect(data.valid).toBe(true);
    });

    it('validate_asset 检测到断裂依赖', async () => {
        const bridgeGet = vi.fn()
            .mockResolvedValueOnce({ uuid: 'u1' })       // query-asset-info (asset exists)
            .mockResolvedValueOnce(null);                // query-asset-info for dep → null = missing
        const editorMsg = vi.fn()
            .mockResolvedValueOnce({ ver: '1.0' })        // query-asset-meta (meta ok)
            .mockResolvedValueOnce(['db://assets/missing-dep.png'])  // query-asset-dependencies
            .mockResolvedValueOnce([]);                   // query-dependents
        const server = buildCocosToolServer(makeCtx({ bridgeGet, editorMsg }));
        const result = await server.callTool('asset_operation', { action: 'validate_asset', url: 'db://assets/prefabs/test.prefab' });
        const data = parse(result) as any;
        expect(data.valid).toBe(false);
        expect(data.issues.some((i: any) => (i.message || i).includes('依赖缺失'))).toBe(true);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// 14. 资源清单导出 (export_asset_manifest)
// ═════════════════════════════════════════════════════════════════════════════
// export_asset_manifest — Pro exclusive (社区版已裁剪)
describe.skip('新增功能 — 资源清单导出 — Pro exclusive', () => {
    it('export_asset_manifest 返回按类型分组的资源清单', async () => {
        const mockAssets = [
            { url: 'db://assets/textures/bg.png', uuid: 'u1', type: 'cc.ImageAsset' },
            { url: 'db://assets/textures/icon.png', uuid: 'u2', type: 'cc.ImageAsset' },
            { url: 'db://assets/scripts/main.ts', uuid: 'u3', type: 'cc.Script' },
            { url: 'db://assets/scenes/main.scene', uuid: 'u4', type: 'cc.SceneAsset' },
        ];
        const bridgeGet = vi.fn().mockResolvedValue(mockAssets);
        const server = buildCocosToolServer(makeCtx({ bridgeGet }));

        const result = await server.callTool('asset_operation', { action: 'export_asset_manifest' });
        expect(result.isError).toBeFalsy();
        const data = parse(result) as any;
        expect(data.totalCount).toBe(4);
        expect(data.typeSummary['cc.ImageAsset']).toBe(2);
        expect(data.typeSummary['cc.Script']).toBe(1);
        expect(data.typeSummary['cc.SceneAsset']).toBe(1);
        expect(data.returnedCount).toBe(4);
        expect(data.hasMore).toBe(false);
    });

    it('export_asset_manifest 支持自定义 pattern 筛选', async () => {
        const bridgeGet = vi.fn().mockResolvedValue([]);
        const server = buildCocosToolServer(makeCtx({ bridgeGet }));

        await server.callTool('asset_operation', { action: 'export_asset_manifest', pattern: 'db://assets/textures/**/*' });
        expect(bridgeGet).toHaveBeenCalledWith('/api/asset-db/query-assets', { pattern: 'db://assets/textures/**/*' });
    });

    it('export_asset_manifest 默认按 200 条分页并标记 hasMore', async () => {
        const bigList = Array.from({ length: 250 }, (_, i) => ({ url: `db://assets/item${i}.ts`, uuid: `u${i}`, type: 'cc.Script' }));
        const bridgeGet = vi.fn().mockResolvedValue(bigList);
        const server = buildCocosToolServer(makeCtx({ bridgeGet }));

        const result = await server.callTool('asset_operation', { action: 'export_asset_manifest' });
        const data = parse(result) as any;
        expect(data.totalCount).toBe(250);
        expect(data.returnedCount).toBe(200);
        expect(data.assets).toHaveLength(200);
        expect(data.hasMore).toBe(true);
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
        expect(soActions).toContain('enter_prefab_edit');
        expect(soActions).toContain('exit_prefab_edit');
        expect(soActions).toContain('apply_prefab');
        expect(soActions).toContain('restore_prefab');
        expect(soActions).toContain('validate_prefab');
    });

    // Pro 独占 action 注册检查 (社区版已裁剪)
    it.skip('Pro 独占 action: asset_operation (validate_asset, export_asset_manifest)', () => {
        const server = buildCocosToolServer(makeCtx());
        const tools = server.listTools();
        const getSchema = (name: string) => tools.find(t => t.name === name)?.inputSchema as any;
        const aoSchema = getSchema('asset_operation');
        const aoActions = aoSchema?.properties?.action?.enum || [];
        expect(aoActions).toContain('validate_asset');
        expect(aoActions).toContain('export_asset_manifest');
    });

    it.skip('Pro 独占 action: editor_action (set_transform_tool, set_coordinate, toggle_grid, toggle_snap, get_console_logs, search_logs)', () => {
        const server = buildCocosToolServer(makeCtx());
        const tools = server.listTools();
        const getSchema = (name: string) => tools.find(t => t.name === name)?.inputSchema as any;
        const eaSchema = getSchema('editor_action');
        const eaActions = eaSchema?.properties?.action?.enum || [];
        expect(eaActions).toContain('set_transform_tool');
        expect(eaActions).toContain('set_coordinate');
        expect(eaActions).toContain('toggle_grid');
        expect(eaActions).toContain('toggle_snap');
        expect(eaActions).toContain('get_console_logs');
        expect(eaActions).toContain('search_logs');
    });
});
