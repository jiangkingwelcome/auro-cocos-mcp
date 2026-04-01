import fs from 'fs';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
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

function parse(result: ToolCallResult): unknown {
  return JSON.parse(result.content[0].text);
}

// ─────────────────────────────────────────────────────────────────────────────
// create_prefab_atomic
// ─────────────────────────────────────────────────────────────────────────────
describe('create_prefab_atomic — 正常流程', () => {
  it('完整流程：创建节点 → 创建预制体 → 刷新 → 清理', async () => {
    const sceneMethod = vi.fn()
      .mockResolvedValueOnce({ uuid: 'temp-node-uuid' })  // createChildNode
      .mockResolvedValueOnce({});                          // destroyNode（清理）
    const editorMsg = vi.fn().mockResolvedValue({ prefabUuid: 'new-prefab-uuid' });
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg, bridgePost }));

    const result = await server.callTool('create_prefab_atomic', {
      prefabPath: 'db://assets/prefabs/Hero.prefab',
      nodeName: 'Hero',
    });

    expect(result.isError).toBeFalsy();
    const data = parse(result) as any;
    expect(data.success).toBe(true);
    expect(data.prefabPath).toBe('db://assets/prefabs/Hero.prefab');
    expect(data.stages).toContain('create_root_node');
    expect(data.stages).toContain('create_prefab');
    expect(data.stages).toContain('cleanup_temp_node');
  });

  it('路径透传：大写 Prefabs 原样保留（CASE_NORMALIZE_MAP 已清空）', async () => {
    const sceneMethod = vi.fn()
      .mockResolvedValueOnce({ uuid: 'temp-uuid' })
      .mockResolvedValueOnce({});
    const editorMsg = vi.fn().mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg }));

    const result = await server.callTool('create_prefab_atomic', {
      prefabPath: 'db://assets/Prefabs/Hero.prefab',
    });

    const data = parse(result) as any;
    // 路径不再规范化，原样透传
    expect(data.prefabPath).toBe('db://assets/Prefabs/Hero.prefab');
  });

  it('cleanupSourceNode=false 不清理临时节点', async () => {
    const sceneMethod = vi.fn()
      .mockResolvedValueOnce({ uuid: 'temp-uuid' });
    const editorMsg = vi.fn().mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg }));

    const result = await server.callTool('create_prefab_atomic', {
      prefabPath: 'db://assets/prefabs/Hero.prefab',
      cleanupSourceNode: false,
    });

    const data = parse(result) as any;
    expect(data.success).toBe(true);
    // rootNodeUuid 应该是实际 uuid，不是 "(已清理)"
    expect(data.rootNodeUuid).toBe('temp-uuid');
    // destroyNode 不应被调用（只调用了 createChildNode）
    expect(sceneMethod).toHaveBeenCalledTimes(1);
  });

  it('cleanupSourceNode=false 且场景已 dirty 时返回 save_scene 提示', async () => {
    const sceneMethod = vi.fn().mockResolvedValueOnce({ uuid: 'temp-uuid' });
    const editorMsg = vi.fn().mockImplementation(async (_module: string, action: string) => {
      if (action === 'query-asset-info') return { type: 'directory' };
      if (action === 'create-prefab') return { prefabUuid: 'prefab-uuid' };
      if (action === 'query-dirty') return true;
      return {};
    });
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg }));

    const result = await server.callTool('create_prefab_atomic', {
      prefabPath: 'db://assets/prefabs/Hero.prefab',
      cleanupSourceNode: false,
    });

    const data = parse(result) as any;
    expect(data.success).toBe(true);
    expect(data.warnings).toContain('当前场景存在未保存修改；如需在重开编辑器后保留，请调用 editor_action.save_scene。');
  });

  it('cleanupSourceNode=false 且 persistenceMode=auto-save 时自动保存场景', async () => {
    const sceneMethod = vi.fn().mockResolvedValueOnce({ uuid: 'temp-uuid' });
    const queryDirtyResults = [false, true, false];
    const editorMsg = vi.fn().mockImplementation(async (_module: string, action: string) => {
      if (action === 'query-asset-info') return { type: 'directory' };
      if (action === 'create-prefab') return { prefabUuid: 'prefab-uuid' };
      if (action === 'query-dirty') return queryDirtyResults.shift() ?? false;
      return {};
    });
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg, bridgePost }));

    const result = await server.callTool('create_prefab_atomic', {
      prefabPath: 'db://assets/prefabs/Hero.prefab',
      cleanupSourceNode: false,
      persistenceMode: 'auto-save',
    });

    const data = parse(result) as any;
    expect(result.isError).toBeFalsy();
    expect(data.persistenceStatus).toEqual(expect.objectContaining({
      mode: 'auto-save',
      target: expect.objectContaining({ kind: 'multi' }),
      requiresPersistence: true,
      saveAttempted: true,
      saveSucceeded: true,
    }));
    expect(bridgePost).toHaveBeenCalledWith('/api/editor/save-scene', { force: false });
  });

  it('带组件：添加 Sprite 组件', async () => {
    const sceneMethod = vi.fn()
      .mockResolvedValueOnce({ uuid: 'temp-uuid' }) // createChildNode
      .mockResolvedValueOnce({ success: true })       // addComponent
      .mockResolvedValueOnce({});                     // destroyNode
    const editorMsg = vi.fn().mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg }));

    const result = await server.callTool('create_prefab_atomic', {
      prefabPath: 'db://assets/prefabs/SpriteNode.prefab',
      components: [{ type: 'Sprite' }],
    });

    const data = parse(result) as any;
    expect(data.success).toBe(true);
    expect(data.stages).toContain('add_component:Sprite');
  });

  it('带子节点：创建 Viewport 子节点', async () => {
    const sceneMethod = vi.fn()
      .mockResolvedValueOnce({ uuid: 'root-uuid' })     // createChildNode (root)
      .mockResolvedValueOnce({ uuid: 'child-uuid' })    // createChildNode (child)
      .mockResolvedValueOnce({});                        // destroyNode
    const editorMsg = vi.fn().mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg }));

    const result = await server.callTool('create_prefab_atomic', {
      prefabPath: 'db://assets/prefabs/Panel.prefab',
      children: [{ name: 'Viewport' }],
    });

    const data = parse(result) as any;
    expect(data.success).toBe(true);
    expect(data.stages).toContain('create_child:Viewport');
  });

  it('带 position 设置', async () => {
    const sceneMethod = vi.fn()
      .mockResolvedValueOnce({ uuid: 'temp-uuid' }) // createChildNode
      .mockResolvedValueOnce({ success: true })       // setNodePosition
      .mockResolvedValueOnce({});                     // destroyNode
    const editorMsg = vi.fn().mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg }));

    const result = await server.callTool('create_prefab_atomic', {
      prefabPath: 'db://assets/prefabs/Positioned.prefab',
      position: { x: 100, y: 200, z: 0 },
    });

    const data = parse(result) as any;
    expect(data.stages).toContain('set_position');
    expect(sceneMethod).toHaveBeenCalledWith('setNodePosition', ['temp-uuid', 100, 200, 0]);
  });
});

describe('create_prefab_atomic — 失败与回滚', () => {
  it('createChildNode 失败时立即返回 isError（无回滚节点）', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ error: '场景未加载' });
    const editorMsg = vi.fn().mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg }));

    const result = await server.callTool('create_prefab_atomic', {
      prefabPath: 'db://assets/prefabs/Hero.prefab',
    });

    expect(result.isError).toBe(true);
    const data = parse(result) as any;
    expect(data.success).toBe(false);
    expect(data.stage).toBe('create_root_node');
  });

  it('editorMsg create-prefab 失败时自动回滚删除临时节点', async () => {
    const sceneMethod = vi.fn()
      .mockResolvedValueOnce({ uuid: 'temp-uuid' }) // createChildNode 成功
      .mockResolvedValueOnce({});                    // destroyNode（回滚备选）
    // Mock 链：
    // 1. query-asset-info (dir check) → { exists: true }（目录已存在，跳过 create-asset）
    // 2. create-prefab → reject
    // 3. remove-node (rollback) → resolve
    const editorMsg = vi.fn()
      .mockResolvedValueOnce({ type: 'directory' })        // query-asset-info → dir exists
      .mockRejectedValueOnce(new Error('创建预制体失败'))  // create-prefab 失败
      .mockResolvedValue({});                               // remove-node（回滚）
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg }));

    const result = await server.callTool('create_prefab_atomic', {
      prefabPath: 'db://assets/prefabs/Hero.prefab',
    });

    expect(result.isError).toBe(true);
    const data = parse(result) as any;
    expect(data.success).toBe(false);
    expect(data.error).toContain('创建预制体失败');
    // 回滚通过 editorMsg('scene', 'remove-node') 执行
    expect(editorMsg).toHaveBeenCalledWith('scene', 'remove-node', { uuid: 'temp-uuid' });
  });

  it('回滚本身失败时，rollback 记录失败信息', async () => {
    const sceneMethod = vi.fn()
      .mockResolvedValueOnce({ uuid: 'temp-uuid' })  // createChildNode 成功
      .mockRejectedValueOnce(new Error('无法删除节点')); // destroyNode 失败
    const editorMsg = vi.fn().mockRejectedValue(new Error('预制体创建失败'));
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg }));

    const result = await server.callTool('create_prefab_atomic', {
      prefabPath: 'db://assets/prefabs/Hero.prefab',
    });

    expect(result.isError).toBe(true);
    const data = parse(result) as any;
    expect(data.rollback[0]).toContain('回滚失败');
  });

  it('completedStages 记录失败前已完成的阶段', async () => {
    const sceneMethod = vi.fn()
      .mockResolvedValueOnce({ uuid: 'temp-uuid' }) // createChildNode
      .mockResolvedValueOnce({});                    // destroyNode（回滚）
    const editorMsg = vi.fn().mockRejectedValue(new Error('失败'));
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg }));

    const result = await server.callTool('create_prefab_atomic', {
      prefabPath: 'db://assets/prefabs/Hero.prefab',
    });

    const data = parse(result) as any;
    // ensure_directory 和 create_root_node 已完成
    expect(Array.isArray(data.completedStages)).toBe(true);
    expect(data.completedStages.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// import_and_apply_texture
// ─────────────────────────────────────────────────────────────────────────────
describe('import_and_apply_texture — 正常流程', () => {
  beforeEach(() => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'statSync').mockReturnValue({ isFile: () => true } as fs.Stats);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function makeImportTextureSceneMethod(options: {
    components?: string[];
    missingNode?: boolean;
    setPropertyResult?: Record<string, unknown>;
    spriteFrameValue?: unknown;
    addComponentResults?: Record<string, Record<string, unknown>>;
  } = {}) {
    let components = [...(options.components ?? [])];
    return vi.fn().mockImplementation(async (method: string, args?: Array<Record<string, unknown>>) => {
      const action = args?.[0]?.action;
      if (method === 'dispatchQuery' && action === 'get_components') {
        if (options.missingNode) return { error: '未找到节点: missing-node' };
        return { uuid: String(args?.[0]?.uuid ?? 'node-uuid'), name: 'Node', components: components.map(name => ({ name })) };
      }
      if (method === 'dispatchQuery' && action === 'get_component_property') {
        return { value: options.spriteFrameValue ?? { uuid: 'sprite-frame-uuid' } };
      }
      if (method === 'dispatchOperation' && action === 'add_component') {
        const component = String(args?.[0]?.component ?? '');
        const custom = options.addComponentResults?.[component];
        if (custom) return custom;
        if (!components.includes(component)) components.push(component);
        return { success: true, component };
      }
      if (method === 'dispatchOperation' && action === 'set_property') {
        return options.setPropertyResult ?? { success: true };
      }
      return { success: true };
    });
  }

  it('缺少 sourcePath 时返回 isError', async () => {
    const server = buildCocosToolServer(makeCtx());

    const result = await server.callTool('import_and_apply_texture', {});
    expect(result.isError).toBe(true);
    const data = parse(result) as any;
    expect(data.error).toContain('sourcePath');
  });

  it('指定 nodeUuid：跳过 resolve_selection，直接导入', async () => {
    const bridgeGet = vi.fn().mockResolvedValue({});
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const sceneMethod = makeImportTextureSceneMethod({ components: ['Sprite', 'UITransform'] });
    const editorMsg = vi.fn()
      .mockResolvedValueOnce({ uuid: 'imported-uuid', url: 'db://assets/textures/icon.png' }) // query-asset-info
      .mockResolvedValueOnce({ userData: { type: 'sprite-frame' } }) // query-asset-meta
      .mockResolvedValueOnce('sprite-frame-uuid') // query-uuid (spriteFrame)
      .mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ bridgeGet, bridgePost, sceneMethod, editorMsg }));

    const result = await server.callTool('import_and_apply_texture', {
      sourcePath: 'C:/images/icon.png',
      nodeUuid: 'target-node-uuid',
      targetUrl: 'db://assets/textures/icon.png',
    });

    expect(result.isError).toBeFalsy();
    const data = parse(result) as any;
    expect(data.success).toBe(true);
    expect(data.nodeUuid).toBe('target-node-uuid');
    expect(data.stages).toContain('import_texture');
    expect(data.stages).not.toContain('resolve_selection');
  });

  it('成功挂图后若节点属于 Prefab 且场景 dirty，则返回 apply/save 提示', async () => {
    const bridgeGet = vi.fn().mockResolvedValue({});
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const sceneMethod = makeImportTextureSceneMethod({ components: ['Sprite', 'UITransform'] });
    const editorMsg = vi.fn().mockImplementation(async (_module: string, action: string) => {
      if (action === 'query-asset-info') return { uuid: 'imported-uuid', url: 'db://assets/textures/icon.png' };
      if (action === 'query-asset-meta') return { userData: { type: 'sprite-frame' } };
      if (action === 'query-uuid') return 'sprite-frame-uuid';
      if (action === 'query-dirty') return true;
      if (action === 'query-node') return { value: { name: { value: 'Node' } }, _prefab: { assetUuid: 'prefab-1' } };
      return {};
    });
    const server = buildCocosToolServer(makeCtx({ bridgeGet, bridgePost, sceneMethod, editorMsg }));

    const result = await server.callTool('import_and_apply_texture', {
      sourcePath: 'C:/images/icon.png',
      nodeUuid: 'target-node-uuid',
      targetUrl: 'db://assets/textures/icon.png',
    });

    const data = parse(result) as any;
    expect(data.success).toBe(true);
    expect(data.warnings).toContain('当前场景存在未保存修改；如需在重开编辑器后保留，请调用 editor_action.save_scene。');
    expect(data.warnings).toContain('检测到目标可能属于 Prefab 实例。若要把当前实例修改回写到预制体资源，请调用 scene_operation.apply_prefab；若需确保重开编辑器后仍保留，再调用 editor_action.save_scene。');
  });

  it('未指定 nodeUuid 时从 selection 中获取', async () => {
    const bridgeGet = vi.fn().mockResolvedValue({ selected: ['selected-uuid'] });
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const sceneMethod = makeImportTextureSceneMethod({ components: ['Sprite', 'UITransform'] });
    const editorMsg = vi.fn()
      .mockResolvedValueOnce({ uuid: 'imported-uuid', url: 'db://assets/textures/bg.png' })
      .mockResolvedValueOnce({ userData: { type: 'sprite-frame' } })
      .mockResolvedValueOnce('sprite-frame-uuid')
      .mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ bridgeGet, bridgePost, sceneMethod, editorMsg }));

    const result = await server.callTool('import_and_apply_texture', {
      sourcePath: 'C:/images/bg.png',
    });

    const data = parse(result) as any;
    expect(data.nodeUuid).toBe('selected-uuid');
    expect(data.stages).toContain('resolve_selection');
  });

  it('源文件不存在时返回 isError', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const server = buildCocosToolServer(makeCtx());

    const result = await server.callTool('import_and_apply_texture', {
      sourcePath: 'C:/images/missing.png',
      nodeUuid: 'node-uuid',
    });

    expect(result.isError).toBe(true);
    const data = parse(result) as any;
    expect(data.error).toContain('源文件不存在');
    expect(data.stages).toContain('validate_input');
  });

  it('nodeUuid 不存在时返回 isError', async () => {
    const sceneMethod = makeImportTextureSceneMethod({ missingNode: true });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));

    const result = await server.callTool('import_and_apply_texture', {
      sourcePath: 'C:/images/icon.png',
      nodeUuid: 'missing-node',
    });

    expect(result.isError).toBe(true);
    const data = parse(result) as any;
    expect(data.error).toContain('未找到节点');
    expect(data.stages).toContain('validate_input');
  });

  it('未指定 nodeUuid 且无 selection 时返回 isError', async () => {
    const bridgeGet = vi.fn().mockResolvedValue({ selected: [] });
    const server = buildCocosToolServer(makeCtx({ bridgeGet }));

    const result = await server.callTool('import_and_apply_texture', {
      sourcePath: 'C:/images/icon.png',
    });

    expect(result.isError).toBe(true);
    const data = parse(result) as any;
    expect(data.error).toContain('未选中节点');
  });

  it('spriteFrame UUID 解析失败时返回 isError', async () => {
    const bridgeGet = vi.fn().mockResolvedValue({});
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const sceneMethod = makeImportTextureSceneMethod({ components: ['Sprite', 'UITransform'] });
    const editorMsg = vi.fn()
      .mockResolvedValueOnce({ uuid: 'imported-uuid', url: 'db://assets/textures/icon.png' })
      .mockResolvedValueOnce({ userData: { type: 'sprite-frame' } })
      .mockResolvedValue(''); // 空字符串，uuid 解析失败（重试 5 次均失败）
    const server = buildCocosToolServer(makeCtx({ bridgeGet, bridgePost, sceneMethod, editorMsg }));

    const result = await server.callTool('import_and_apply_texture', {
      sourcePath: 'C:/images/icon.png',
      nodeUuid: 'node-uuid',
    });

    expect(result.isError).toBe(true);
    const data = parse(result) as any;
    expect(data.success).toBe(false);
    expect(data.error).toContain('未能解析 SpriteFrame UUID');
  }, 15_000);

  it('已存在 Sprite 和 UITransform 时跳过重复添加', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const sceneMethod = makeImportTextureSceneMethod({
      components: ['Sprite', 'UITransform'],
      spriteFrameValue: { uuid: 'resolved-sf-uuid' },
    });
    const editorMsg = vi.fn()
      .mockResolvedValueOnce({ uuid: 'imported-uuid', url: 'db://assets/textures/icon.png' })
      .mockResolvedValueOnce({ userData: { type: 'sprite-frame' } })
      .mockResolvedValueOnce('resolved-sf-uuid')
      .mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ bridgePost, sceneMethod, editorMsg }));

    const result = await server.callTool('import_and_apply_texture', {
      sourcePath: 'C:/images/icon.png',
      nodeUuid: 'target-node',
      targetUrl: 'db://assets/textures/icon.png',
    });

    expect(result.isError).toBeFalsy();
    const addCalls = (sceneMethod as any).mock.calls.filter(
      (c: any[]) => c[0] === 'dispatchOperation' && c[1]?.[0]?.action === 'add_component',
    );
    expect(addCalls).toHaveLength(0);
  });

  it('缺少 UITransform 时会先自动补齐', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const sceneMethod = makeImportTextureSceneMethod({
      components: ['Sprite'],
      spriteFrameValue: { uuid: 'resolved-sf-uuid' },
    });
    const editorMsg = vi.fn()
      .mockResolvedValueOnce({ uuid: 'imported-uuid', url: 'db://assets/textures/icon.png' })
      .mockResolvedValueOnce({ userData: { type: 'sprite-frame' } })
      .mockResolvedValueOnce('resolved-sf-uuid')
      .mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ bridgePost, sceneMethod, editorMsg }));

    const result = await server.callTool('import_and_apply_texture', {
      sourcePath: 'C:/images/icon.png',
      nodeUuid: 'target-node',
      targetUrl: 'db://assets/textures/icon.png',
    });

    expect(result.isError).toBeFalsy();
    const data = parse(result) as any;
    expect(data.stages).toContain('ensure_ui_transform');
    expect(sceneMethod).toHaveBeenCalledWith('dispatchOperation', [
      expect.objectContaining({ action: 'add_component', uuid: 'target-node', component: 'UITransform' }),
    ]);
  });

  it('apply_sprite_frame 阶段传递 __uuid__ 资源引用给 sceneMethod', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const sceneMethod = makeImportTextureSceneMethod({
      components: ['Sprite', 'UITransform'],
      spriteFrameValue: { uuid: 'resolved-sf-uuid' },
    });
    const editorMsg = vi.fn()
      .mockResolvedValueOnce({ uuid: 'imported-uuid', url: 'db://assets/textures/icon.png' })
      .mockResolvedValueOnce({ userData: { type: 'sprite-frame' } }) // query-asset-meta (already sprite-frame, skip reimport)
      .mockResolvedValueOnce('resolved-sf-uuid')  // query-uuid → spriteFrame UUID
      .mockResolvedValue({});                       // selection, console log
    const server = buildCocosToolServer(makeCtx({ bridgePost, sceneMethod, editorMsg }));

    const result = await server.callTool('import_and_apply_texture', {
      sourcePath: 'C:/images/icon.png',
      nodeUuid: 'target-node',
      targetUrl: 'db://assets/textures/icon.png',
    });

    const data = parse(result) as any;
    expect(data.success).toBe(true);
    expect(data.stages).toContain('apply_sprite_frame');

    const setPropertyCall = (sceneMethod as any).mock.calls.find(
      (c: any[]) => c[0] === 'dispatchOperation' && c[1]?.[0]?.action === 'set_property' && c[1]?.[0]?.property === 'spriteFrame'
    );
    expect(setPropertyCall).toBeTruthy();
    expect(setPropertyCall[1][0].value).toEqual({ __uuid__: 'resolved-sf-uuid' });
  });

  it('spriteFrame UUID 解析重试：首次失败后重试成功', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const sceneMethod = makeImportTextureSceneMethod({
      components: ['Sprite', 'UITransform'],
      spriteFrameValue: { uuid: 'retry-sf-uuid' },
    });
    const editorMsg = vi.fn()
      .mockResolvedValueOnce({ uuid: 'imported-uuid', url: 'db://assets/textures/icon.png' })
      .mockResolvedValueOnce({ userData: { type: 'sprite-frame' } }) // query-asset-meta
      .mockResolvedValueOnce('')                   // 第 1 次 query-uuid 失败
      .mockResolvedValueOnce('')                   // 第 2 次 query-uuid 失败
      .mockResolvedValueOnce('retry-sf-uuid')      // 第 3 次 query-uuid 成功
      .mockResolvedValue({});                       // selection, console log
    const server = buildCocosToolServer(makeCtx({ bridgePost, sceneMethod, editorMsg }));

    const result = await server.callTool('import_and_apply_texture', {
      sourcePath: 'C:/images/icon.png',
      nodeUuid: 'target-node',
      targetUrl: 'db://assets/textures/icon.png',
    });

    const data = parse(result) as any;
    expect(data.success).toBe(true);
    expect(data.stages).toContain('apply_sprite_frame');
    expect(editorMsg).toHaveBeenCalledWith('asset-db', 'query-uuid', 'db://assets/textures/icon.png/spriteFrame');
  });

  it('set_property 传递资源引用 { __uuid__ } 给 dispatchOperation', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));

    const result = await server.callTool('scene_operation', {
      action: 'set_property',
      uuid: 'sprite-node',
      component: 'Sprite',
      property: 'spriteFrame',
      value: { __uuid__: 'some-sprite-frame-uuid' },
    });

    expect(result.isError).toBeFalsy();
    expect(sceneMethod).toHaveBeenCalledWith('dispatchOperation', [
      expect.objectContaining({
        action: 'set_property',
        uuid: 'sprite-node',
        component: 'Sprite',
        property: 'spriteFrame',
        value: { __uuid__: 'some-sprite-frame-uuid' },
      }),
    ]);
  });

  it('targetUrl 路径透传：大写 Textures 原样保留', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const sceneMethod = makeImportTextureSceneMethod({
      components: ['Sprite', 'UITransform'],
      spriteFrameValue: { uuid: 'sprite-uuid' },
    });
    const editorMsg = vi.fn()
      .mockResolvedValueOnce({ uuid: 'imported-uuid', url: 'db://assets/Textures/icon.png' })
      .mockResolvedValueOnce({ userData: { type: 'sprite-frame' } })
      .mockResolvedValueOnce('sprite-uuid')
      .mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ bridgePost, sceneMethod, editorMsg }));

    const result = await server.callTool('import_and_apply_texture', {
      sourcePath: 'C:/images/icon.png',
      nodeUuid: 'node-uuid',
      targetUrl: 'db://assets/Textures/icon.png',
    });

    const data = parse(result) as any;
    // CASE_NORMALIZE_MAP 已清空，路径原样保留
    expect(data.targetUrl).toBe('db://assets/Textures/icon.png');
  });

  it('set_property 返回成功但 spriteFrame 未实际挂上时返回 isError', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const sceneMethod = makeImportTextureSceneMethod({
      components: ['Sprite', 'UITransform'],
      spriteFrameValue: {},
    });
    const editorMsg = vi.fn()
      .mockResolvedValueOnce({ uuid: 'imported-uuid', url: 'db://assets/textures/icon.png' })
      .mockResolvedValueOnce({ userData: { type: 'sprite-frame' } })
      .mockResolvedValueOnce('resolved-sf-uuid')
      .mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ bridgePost, sceneMethod, editorMsg }));

    const result = await server.callTool('import_and_apply_texture', {
      sourcePath: 'C:/images/icon.png',
      nodeUuid: 'target-node',
      targetUrl: 'db://assets/textures/icon.png',
    });

    expect(result.isError).toBe(true);
    const data = parse(result) as any;
    expect(data.error).toContain('spriteFrame 挂载后校验失败');
  });

  it('优先使用 query-node dump 校验 spriteFrame，避免场景脚本属性序列化失败', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const sceneMethod = vi.fn().mockImplementation(async (method: string, args?: Array<Record<string, unknown>>) => {
      const action = args?.[0]?.action;
      if (method === 'dispatchQuery' && action === 'get_components') {
        return { uuid: 'target-node', name: 'Node', components: [{ name: 'Sprite' }, { name: 'UITransform' }] };
      }
      if (method === 'dispatchQuery' && action === 'get_component_property') {
        return { error: 'Converting circular structure to JSON' };
      }
      if (method === 'dispatchOperation') {
        return { success: true };
      }
      return { success: true };
    });
    const editorMsg = vi.fn()
      .mockResolvedValueOnce({ uuid: 'imported-uuid', url: 'db://assets/textures/icon.png' })
      .mockResolvedValueOnce({ userData: { type: 'sprite-frame' } })
      .mockResolvedValueOnce('resolved-sf-uuid')
      .mockResolvedValueOnce({
        __comps__: [{
          type: 'cc.Sprite',
          value: {
            spriteFrame: {
              value: { uuid: 'resolved-sf-uuid' },
            },
          },
        }],
      })
      .mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ bridgePost, sceneMethod, editorMsg }));

    const result = await server.callTool('import_and_apply_texture', {
      sourcePath: 'C:/images/icon.png',
      nodeUuid: 'target-node',
      targetUrl: 'db://assets/textures/icon.png',
    });

    expect(result.isError).toBeFalsy();
    const data = parse(result) as any;
    expect(data.success).toBe(true);
    expect(editorMsg).toHaveBeenCalledWith('scene', 'query-node', 'target-node');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// create_tween_animation_atomic
// ─────────────────────────────────────────────────────────────────────────────
describe('create_tween_animation_atomic — 正常流程', () => {
  it('完整流程：验证节点 → 创建动画 → highlight', async () => {
    const sceneMethod = vi.fn().mockImplementation((method: string) => {
      if (method === 'dispatchQuery') return Promise.resolve({ uuid: 'node-uuid', name: 'Hero' });
      if (method === 'createAnimationClip') return Promise.resolve({
        success: true, clipDuration: 1, trackCount: 1, keyframeTimesCount: 3,
        wrapMode: 'Normal', speed: 1, attach: { attached: true },
      });
      return Promise.resolve({ success: true });
    });
    const editorMsg = vi.fn().mockResolvedValue({});
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg, bridgePost }));

    const result = await server.callTool('create_tween_animation_atomic', {
      nodeUuid: 'node-uuid',
      duration: 1,
      tracks: [{ property: 'position', keyframes: [{ time: 0, value: { x: 0, y: 0, z: 0 } }, { time: 0.5, value: { x: 100, y: 0, z: 0 } }, { time: 1, value: { x: 0, y: 0, z: 0 } }] }],
    });

    expect(result.isError).toBeFalsy();
    const data = parse(result) as any;
    expect(data.success).toBe(true);
    expect(data.trackCount).toBe(1);
    expect(data.stages).toContain('validate_node');
    expect(data.stages).toContain('create_clip');
    expect(data.stages).toContain('highlight');
  });

  it('缺少 tracks 参数时返回 isError', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ uuid: 'node-uuid', name: 'Hero' });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));

    const result = await server.callTool('create_tween_animation_atomic', {
      nodeUuid: 'node-uuid',
    });

    expect(result.isError).toBe(true);
    const data = parse(result) as any;
    expect(data.error).toContain('tracks');
  });

  it('未指定 nodeUuid 时从 selection 中获取', async () => {
    const bridgeGet = vi.fn().mockResolvedValue({ selected: ['selected-uuid'] });
    const sceneMethod = vi.fn().mockImplementation((method: string) => {
      if (method === 'dispatchQuery') return Promise.resolve({ uuid: 'selected-uuid', name: 'Node' });
      if (method === 'createAnimationClip') return Promise.resolve({
        success: true, clipDuration: 1, trackCount: 1, keyframeTimesCount: 2,
        wrapMode: 'Loop', speed: 1, attach: { attached: true },
      });
      return Promise.resolve({ success: true });
    });
    const editorMsg = vi.fn().mockResolvedValue({});
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgeGet, sceneMethod, editorMsg, bridgePost }));

    const result = await server.callTool('create_tween_animation_atomic', {
      wrapMode: 'Loop',
      tracks: [{ property: 'scale', keyframes: [{ time: 0, value: 1 }, { time: 1, value: 2 }] }],
    });

    const data = parse(result) as any;
    expect(data.success).toBe(true);
    expect(data.stages).toContain('resolve_selection');
  });

  it('未指定 nodeUuid 且无 selection 时返回 isError', async () => {
    const bridgeGet = vi.fn().mockResolvedValue({ selected: [] });
    const server = buildCocosToolServer(makeCtx({ bridgeGet }));

    const result = await server.callTool('create_tween_animation_atomic', {
      tracks: [{ property: 'opacity', keyframes: [{ time: 0, value: 255 }] }],
    });

    expect(result.isError).toBe(true);
    const data = parse(result) as any;
    expect(data.error).toContain('未选中节点');
  });

  it('strict 模式下未提供 savePath 时直接失败', async () => {
    const sceneMethod = vi.fn().mockImplementation((method: string) => {
      if (method === 'dispatchQuery') return Promise.resolve({ uuid: 'node-uuid', name: 'Hero' });
      if (method === 'createAnimationClip') {
        return Promise.resolve({
          success: true,
          clipDuration: 1,
          trackCount: 1,
          keyframeTimesCount: 2,
          wrapMode: 'Normal',
          speed: 1,
          attach: { attached: true },
        });
      }
      return Promise.resolve({ success: true });
    });
    const editorMsg = vi.fn().mockImplementation(async (_module: string, action: string) => {
      if (action === 'begin-recording') return 'record-1';
      if (action === 'query-node') return { value: { name: { value: 'Hero' } } };
      if (action === 'set-property') return { success: true };
      if (action === 'end-recording') return { success: true };
      return {};
    });
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg }));

    const result = await server.callTool('create_tween_animation_atomic', {
      nodeUuid: 'node-uuid',
      persistenceMode: 'strict',
      tracks: [{ property: 'position', keyframes: [{ time: 0, value: 0 }, { time: 1, value: 100 }] }],
    });

    const data = parse(result) as any;
    expect(result.isError).toBe(true);
    expect(data.error).toContain('strict');
    expect(data.warnings).toEqual(expect.arrayContaining([
      expect.stringContaining('未提供 savePath'),
    ]));
  });

  it('带 savePath 时尝试保存 .anim 资产', async () => {
    const sceneMethod = vi.fn().mockImplementation((method: string, args?: unknown[]) => {
      if (method === 'dispatchQuery') return Promise.resolve({ uuid: 'node-uuid', name: 'Hero' });
      if (method === 'createAnimationClip') return Promise.resolve({
        success: true, clipDuration: 1, trackCount: 1, keyframeTimesCount: 2,
        wrapMode: 'Normal', speed: 1, attach: { attached: true },
      });
      if (method === 'setComponentProperty') {
        const property = Array.isArray(args) ? args[2] : '';
        return Promise.resolve({ success: true, property, resolvedViaEditorIPC: true });
      }
      return Promise.resolve({ success: true });
    });
    const editorMsg = vi.fn().mockImplementation(async (_module: string, message: string) => {
      if (message === 'query-asset-info') return { uuid: 'asset-uuid-1' };
      if (message === 'query-node') return { value: { name: { value: 'Hero' } } };
      return {};
    });
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg, bridgePost }));

    const result = await server.callTool('create_tween_animation_atomic', {
      nodeUuid: 'node-uuid',
      savePath: 'db://assets/animations/hero-move.anim',
      tracks: [{ property: 'position', keyframes: [{ time: 0, value: 0 }, { time: 1, value: 100 }] }],
    });

    const data = parse(result) as any;
    expect(data.success).toBe(true);
    expect(data.stages).toContain('save_anim_asset');
    expect(data.savedAsset).toBeTruthy();
    expect(data.assetBinding).toEqual(expect.objectContaining({
      bound: true,
      assetUuid: 'asset-uuid-1',
    }));
    expect(sceneMethod).toHaveBeenCalledWith('setComponentProperty', [
      'node-uuid',
      'Animation',
      'clips',
      [{ __uuid__: 'asset-uuid-1' }],
    ]);
    expect(sceneMethod).toHaveBeenCalledWith('setComponentProperty', [
      'node-uuid',
      'Animation',
      'defaultClip',
      { __uuid__: 'asset-uuid-1' },
    ]);
  });

  it('保存成功但 Animation.defaultClip 回绑失败时给出 warning', async () => {
    const sceneMethod = vi.fn().mockImplementation((method: string, args?: unknown[]) => {
      if (method === 'dispatchQuery') return Promise.resolve({ uuid: 'node-uuid', name: 'Hero' });
      if (method === 'createAnimationClip') return Promise.resolve({
        success: true, clipDuration: 1, trackCount: 1, keyframeTimesCount: 2,
        wrapMode: 'Normal', speed: 1, attach: { attached: true },
      });
      if (method === 'setComponentProperty') {
        const property = Array.isArray(args) ? args[2] : '';
        if (property === 'defaultClip') return Promise.resolve({ error: 'decodePatch failed' });
        return Promise.resolve({ success: true, property, resolvedViaEditorIPC: true });
      }
      return Promise.resolve({ success: true });
    });
    const editorMsg = vi.fn().mockImplementation(async (_module: string, message: string) => {
      if (message === 'query-asset-info') return { uuid: 'asset-uuid-1' };
      if (message === 'query-node') return { value: { name: { value: 'Hero' } } };
      return {};
    });
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg, bridgePost }));

    const result = await server.callTool('create_tween_animation_atomic', {
      nodeUuid: 'node-uuid',
      savePath: 'db://assets/animations/hero-move.anim',
      tracks: [{ property: 'position', keyframes: [{ time: 0, value: 0 }, { time: 1, value: 100 }] }],
    });

    const data = parse(result) as any;
    expect(data.success).toBe(true);
    expect(data.assetBinding).toBeNull();
    expect(data.warnings).toEqual(expect.arrayContaining([
      expect.stringContaining('回绑 Animation.defaultClip 失败'),
    ]));
  });

  it('透传 clipName/speed/wrapMode 到 createAnimationClip，并按引擎枚举落盘', async () => {
    const sceneMethod = vi.fn().mockImplementation((method: string) => {
      if (method === 'dispatchQuery') return Promise.resolve({ uuid: 'node-uuid', name: 'Hero' });
      if (method === 'createAnimationClip') return Promise.resolve({
        success: true,
        clipName: 'bounce',
        clipDuration: 1.5,
        trackCount: 1,
        keyframeTimesCount: 2,
        wrapMode: 'PingPong',
        speed: 2,
        attach: { attached: true },
      });
      return Promise.resolve({ success: true });
    });
    const editorMsg = vi.fn().mockImplementation(async (_module: string, message: string) => {
      if (message === 'query-asset-info') return { uuid: 'asset-uuid-1' };
      return {};
    });
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg, bridgePost }));

    const result = await server.callTool('create_tween_animation_atomic', {
      nodeUuid: 'node-uuid',
      clipName: 'bounce',
      duration: 1.5,
      wrapMode: 'PingPong',
      speed: 2,
      savePath: 'db://assets/animations/bounce.anim',
      tracks: [{ property: 'position', keyframes: [{ time: 0, value: 0 }, { time: 1.5, value: 100 }] }],
    });

    const data = parse(result) as any;
    expect(data.success).toBe(true);
    expect(sceneMethod).toHaveBeenCalledWith('createAnimationClip', [expect.objectContaining({
      uuid: 'node-uuid',
      clipName: 'bounce',
      wrapMode: 'PingPong',
      speed: 2,
    })]);

    const createAssetCall = bridgePost.mock.calls.find(([path]) => path === '/api/asset-db/create-asset');
    expect(createAssetCall).toBeTruthy();
    const assetPayload = createAssetCall?.[1] as { content: string };
    const animJson = JSON.parse(assetPayload.content);
    expect(animJson._name).toBe('bounce');
    expect(animJson.speed).toBe(2);
    expect(animJson.wrapMode).toBe(22);
  });

  it('createAnimationClip 失败时返回 isError', async () => {
    const sceneMethod = vi.fn().mockImplementation((method: string) => {
      if (method === 'dispatchQuery') return Promise.resolve({ uuid: 'node-uuid', name: 'Hero' });
      if (method === 'createAnimationClip') return Promise.resolve({ error: 'AnimationClip 类不可用' });
      return Promise.resolve({ success: true });
    });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));

    const result = await server.callTool('create_tween_animation_atomic', {
      nodeUuid: 'node-uuid',
      tracks: [{ property: 'position', keyframes: [{ time: 0, value: 0 }] }],
    });

    expect(result.isError).toBe(true);
    const data = parse(result) as any;
    expect(data.error).toContain('AnimationClip');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// auto_fit_physics_collider
// ─────────────────────────────────────────────────────────────────────────────
describe('auto_fit_physics_collider — 正常流程', () => {
  it('完整流程：验证节点 → 检测组件 → 自动适配 → highlight', async () => {
    const sceneMethod = vi.fn().mockImplementation((method: string) => {
      if (method === 'dispatchQuery') {
        // First call: node_detail, second call: get_components
        return Promise.resolve({ uuid: 'node-uuid', name: 'Sprite', components: [{ name: 'Sprite' }, { name: 'UITransform' }] });
      }
      if (method === 'autoFitCollider') return Promise.resolve({
        success: true, uuid: 'node-uuid', nodeName: 'Sprite',
        colliderType: 'BoxCollider2D', outlineMethod: 'box_from_size',
        size: { width: 100, height: 100 },
      });
      return Promise.resolve({ success: true });
    });
    const editorMsg = vi.fn().mockResolvedValue({});
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg, bridgePost }));

    const result = await server.callTool('auto_fit_physics_collider', {
      nodeUuid: 'node-uuid',
    });

    expect(result.isError).toBeFalsy();
    const data = parse(result) as any;
    expect(data.success).toBe(true);
    expect(data.colliderType).toBe('BoxCollider2D');
    expect(data.stages).toContain('validate_node');
    expect(data.stages).toContain('detect_components');
    expect(data.stages).toContain('auto_fit_collider');
    expect(data.stages).toContain('highlight');
  });

  it('成功适配碰撞体后若节点属于 Prefab 且场景 dirty，则返回 apply/save 提示', async () => {
    const sceneMethod = vi.fn().mockImplementation((method: string) => {
      if (method === 'dispatchQuery') {
        return Promise.resolve({ uuid: 'node-uuid', name: 'Sprite', components: [{ name: 'Sprite' }, { name: 'UITransform' }] });
      }
      if (method === 'autoFitCollider') return Promise.resolve({
        success: true, uuid: 'node-uuid', nodeName: 'Sprite',
        colliderType: 'BoxCollider2D', outlineMethod: 'box_from_size',
        size: { width: 100, height: 100 },
      });
      return Promise.resolve({ success: true });
    });
    const editorMsg = vi.fn().mockImplementation(async (_module: string, action: string) => {
      if (action === 'begin-recording') return 'record-1';
      if (action === 'query-node') return { value: { name: { value: 'Sprite' } }, _prefab: { assetUuid: 'prefab-1' } };
      if (action === 'set-property') return { success: true };
      if (action === 'end-recording') return { success: true };
      if (action === 'query-dirty') return true;
      return {};
    });
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg, bridgePost }));

    const result = await server.callTool('auto_fit_physics_collider', {
      nodeUuid: 'node-uuid',
    });

    const data = parse(result) as any;
    expect(data.success).toBe(true);
    expect(data.warnings).toContain('当前场景存在未保存修改；如需在重开编辑器后保留，请调用 editor_action.save_scene。');
    expect(data.warnings).toContain('检测到目标可能属于 Prefab 实例。若要把当前实例修改回写到预制体资源，请调用 scene_operation.apply_prefab；若需确保重开编辑器后仍保留，再调用 editor_action.save_scene。');
  });

  it('polygon 类型结果包含 points', async () => {
    const sceneMethod = vi.fn().mockImplementation((method: string) => {
      if (method === 'dispatchQuery') return Promise.resolve({ uuid: 'node-uuid', name: 'Sprite', components: [{ name: 'Sprite' }] });
      if (method === 'autoFitCollider') return Promise.resolve({
        success: true, uuid: 'node-uuid', nodeName: 'Sprite',
        colliderType: 'PolygonCollider2D', outlineMethod: 'rect_fallback',
        pointCount: 4, points: [{ x: -50, y: -50 }, { x: 50, y: -50 }, { x: 50, y: 50 }, { x: -50, y: 50 }],
      });
      return Promise.resolve({ success: true });
    });
    const editorMsg = vi.fn().mockResolvedValue({});
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg, bridgePost }));

    const result = await server.callTool('auto_fit_physics_collider', {
      nodeUuid: 'node-uuid',
      colliderType: 'polygon',
    });

    const data = parse(result) as any;
    expect(data.success).toBe(true);
    expect(data.colliderType).toBe('PolygonCollider2D');
    expect(data.pointCount).toBe(4);
    expect(data.points).toHaveLength(4);
  });

  it('未指定 nodeUuid 时从 selection 中获取', async () => {
    const bridgeGet = vi.fn().mockResolvedValue({ selected: ['selected-uuid'] });
    const sceneMethod = vi.fn().mockImplementation((method: string) => {
      if (method === 'dispatchQuery') return Promise.resolve({ uuid: 'selected-uuid', name: 'Node', components: [] });
      if (method === 'autoFitCollider') return Promise.resolve({
        success: true, uuid: 'selected-uuid', nodeName: 'Node',
        colliderType: 'BoxCollider2D', outlineMethod: 'box_from_size',
        size: { width: 100, height: 100 },
      });
      return Promise.resolve({ success: true });
    });
    const editorMsg = vi.fn().mockResolvedValue({});
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgeGet, sceneMethod, editorMsg, bridgePost }));

    const result = await server.callTool('auto_fit_physics_collider', {});

    const data = parse(result) as any;
    expect(data.success).toBe(true);
    expect(data.stages).toContain('resolve_selection');
  });

  it('未指定 nodeUuid 且无 selection 时返回 isError', async () => {
    const bridgeGet = vi.fn().mockResolvedValue({ selected: [] });
    const server = buildCocosToolServer(makeCtx({ bridgeGet }));

    const result = await server.callTool('auto_fit_physics_collider', {});

    expect(result.isError).toBe(true);
    const data = parse(result) as any;
    expect(data.error).toContain('未选中节点');
  });

  it('autoFitCollider 失败时返回 isError', async () => {
    const sceneMethod = vi.fn().mockImplementation((method: string) => {
      if (method === 'dispatchQuery') return Promise.resolve({ uuid: 'node-uuid', name: 'Node', components: [] });
      if (method === 'autoFitCollider') return Promise.resolve({ error: 'PolygonCollider2D 类不可用' });
      return Promise.resolve({ success: true });
    });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));

    const result = await server.callTool('auto_fit_physics_collider', {
      nodeUuid: 'node-uuid',
      colliderType: 'polygon',
    });

    expect(result.isError).toBe(true);
    const data = parse(result) as any;
    expect(data.error).toContain('PolygonCollider2D');
  });

  it('设置额外物理属性 (sensor, friction, restitution)', async () => {
    const sceneMethod = vi.fn().mockImplementation((method: string) => {
      if (method === 'dispatchQuery') return Promise.resolve({ uuid: 'node-uuid', name: 'Node', components: [{ name: 'UITransform' }] });
      if (method === 'autoFitCollider') return Promise.resolve({
        success: true, uuid: 'node-uuid', nodeName: 'Node',
        colliderType: 'BoxCollider2D', outlineMethod: 'box_from_size',
        size: { width: 100, height: 100 },
      });
      return Promise.resolve({ success: true });
    });
    const editorMsg = vi.fn().mockResolvedValue({});
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg, bridgePost }));

    const result = await server.callTool('auto_fit_physics_collider', {
      nodeUuid: 'node-uuid',
      sensor: true,
      friction: 0.3,
      restitution: 0.8,
    });

    const data = parse(result) as any;
    expect(data.success).toBe(true);
    expect(data.stages).toContain('set_physics_properties');

    // Verify set_property calls for physics properties
    const setPropertyCalls = (sceneMethod as any).mock.calls
      .filter((c: any[]) => c[0] === 'dispatchOperation')
      .map((c: any[]) => c[1][0]);
    const sensorCall = setPropertyCalls.find((p: any) => p.property === 'sensor');
    expect(sensorCall).toBeTruthy();
    expect(sensorCall.value).toBe(true);
  });
});
