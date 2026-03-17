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
    const sceneMethod = vi.fn().mockResolvedValue({ success: true });
    const editorMsg = vi.fn()
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

  it('未指定 nodeUuid 时从 selection 中获取', async () => {
    const bridgeGet = vi.fn().mockResolvedValue({ selected: ['selected-uuid'] });
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const sceneMethod = vi.fn().mockResolvedValue({ success: true });
    const editorMsg = vi.fn().mockResolvedValue('sprite-frame-uuid');
    const server = buildCocosToolServer(makeCtx({ bridgeGet, bridgePost, sceneMethod, editorMsg }));

    const result = await server.callTool('import_and_apply_texture', {
      sourcePath: 'C:/images/bg.png',
    });

    const data = parse(result) as any;
    expect(data.nodeUuid).toBe('selected-uuid');
    expect(data.stages).toContain('resolve_selection');
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

  it('spriteFrame UUID 解析失败时加 warning 而非 isError', async () => {
    const bridgeGet = vi.fn().mockResolvedValue({});
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const sceneMethod = vi.fn().mockResolvedValue({ success: true });
    const editorMsg = vi.fn().mockResolvedValue(''); // 空字符串，uuid 解析失败（重试 5 次均失败）
    const server = buildCocosToolServer(makeCtx({ bridgeGet, bridgePost, sceneMethod, editorMsg }));

    const result = await server.callTool('import_and_apply_texture', {
      sourcePath: 'C:/images/icon.png',
      nodeUuid: 'node-uuid',
    });

    expect(result.isError).toBeFalsy();
    const data = parse(result) as any;
    expect(data.success).toBe(true);
    expect(data.warnings).toBeDefined();
    expect(data.warnings.some((w: string) => w.includes('SpriteFrame'))).toBe(true);
  }, 15_000);

  it('apply_sprite_frame 阶段传递 __uuid__ 资源引用给 sceneMethod', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const sceneMethod = vi.fn().mockResolvedValue({ success: true });
    const editorMsg = vi.fn()
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
    const sceneMethod = vi.fn().mockResolvedValue({ success: true });
    const editorMsg = vi.fn()
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
    const sceneMethod = vi.fn().mockResolvedValue({ success: true });
    const editorMsg = vi.fn().mockResolvedValue('sprite-uuid');
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
});

// ─────────────────────────────────────────────────────────────────────────────
// setup_ui_layout
// ─────────────────────────────────────────────────────────────────────────────
describe('setup_ui_layout — 正常流程', () => {
  function makeScrollViewMocks() {
    // createChildNode 每次返回不同 uuid
    let callCount = 0;
    const uuids = ['root-uuid', 'viewport-uuid', 'content-uuid', 'item1-uuid', 'item2-uuid', 'item3-uuid'];
    const sceneMethod = vi.fn().mockImplementation((method: string) => {
      if (method === 'createChildNode') {
        return Promise.resolve({ uuid: uuids[callCount++] || `extra-uuid-${callCount}` });
      }
      return Promise.resolve({ success: true });
    });
    const editorMsg = vi.fn().mockResolvedValue({});
    const bridgeGet = vi.fn().mockResolvedValue({ selected: ['parent-uuid'] });
    return { sceneMethod, editorMsg, bridgeGet };
  }

  it('创建完整 ScrollView 层级，返回所有 uuid', async () => {
    const { sceneMethod, editorMsg, bridgeGet } = makeScrollViewMocks();
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg, bridgeGet }));

    const result = await server.callTool('setup_ui_layout', {
      parentUuid: 'canvas-uuid',
      rootName: 'MyList',
      itemCount: 3,
    });

    expect(result.isError).toBeFalsy();
    const data = parse(result) as any;
    expect(data.success).toBe(true);
    expect(data.rootUuid).toBeDefined();
    expect(data.viewportUuid).toBeDefined();
    expect(data.contentUuid).toBeDefined();
    expect(data.itemCount).toBe(3);
  });

  it('包含所有阶段：create_root / root_components / viewport / content / items', async () => {
    const { sceneMethod, editorMsg, bridgeGet } = makeScrollViewMocks();
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg, bridgeGet }));

    const result = await server.callTool('setup_ui_layout', {
      parentUuid: 'canvas-uuid',
      itemCount: 2,
    });

    const data = parse(result) as any;
    expect(data.stages).toContain('create_root');
    expect(data.stages).toContain('root_components');
    expect(data.stages).toContain('create_viewport');
    expect(data.stages).toContain('create_content');
    expect(data.stages).toContain('create_items');
  });

  it('itemCount 超出 100 时限制为 100', async () => {
    const { sceneMethod, editorMsg } = makeScrollViewMocks();
    // 需要足够多的 uuid 返回
    const sceneMethodUnlimited = vi.fn().mockImplementation((method: string, args: any[]) => {
      if (method === 'createChildNode') return Promise.resolve({ uuid: `uuid-${Math.random()}` });
      return Promise.resolve({ success: true });
    });
    const server = buildCocosToolServer(makeCtx({ sceneMethod: sceneMethodUnlimited, editorMsg }));

    const result = await server.callTool('setup_ui_layout', {
      parentUuid: 'p',
      itemCount: 999,
    });

    const data = parse(result) as any;
    expect(data.itemCount).toBeLessThanOrEqual(100);
  });

  it('withMask=false 跳过 Mask 组件', async () => {
    const { sceneMethod, editorMsg } = makeScrollViewMocks();
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg }));

    await server.callTool('setup_ui_layout', {
      parentUuid: 'canvas',
      withMask: false,
      itemCount: 1,
    });

    // 确认 add_component 中没有 Mask
    const addComponentCalls = (sceneMethod as any).mock.calls
      .filter((c: any[]) => c[0] === 'dispatchOperation')
      .map((c: any[]) => c[1][0]);
    const hasMask = addComponentCalls.some((p: any) => p.component === 'Mask');
    expect(hasMask).toBe(false);
  });

  it('withLayout=false 跳过 Layout 组件', async () => {
    const { sceneMethod, editorMsg } = makeScrollViewMocks();
    const server = buildCocosToolServer(makeCtx({ sceneMethod, editorMsg }));

    await server.callTool('setup_ui_layout', {
      parentUuid: 'canvas',
      withLayout: false,
      itemCount: 1,
    });

    const addComponentCalls = (sceneMethod as any).mock.calls
      .filter((c: any[]) => c[0] === 'dispatchOperation')
      .map((c: any[]) => c[1][0]);
    const hasLayout = addComponentCalls.some((p: any) => p.component === 'Layout');
    expect(hasLayout).toBe(false);
  });

  it('根节点创建失败时返回 isError', async () => {
    const sceneMethod = vi.fn().mockResolvedValue({ error: '场景未加载' });
    const server = buildCocosToolServer(makeCtx({ sceneMethod }));

    const result = await server.callTool('setup_ui_layout', { parentUuid: 'canvas' });
    expect(result.isError).toBe(true);
    const data = parse(result) as any;
    expect(data.success).toBe(false);
    // error 透传自 sceneMethod 返回的 error 字符串
    expect(data.error).toBeTruthy();
  });

  it('未指定 parentUuid 时从 selection 中获取', async () => {
    const bridgeGet = vi.fn().mockResolvedValue({ selected: ['selected-canvas-uuid'] });
    const sceneMethod = vi.fn().mockImplementation((method: string) => {
      if (method === 'createChildNode') return Promise.resolve({ uuid: `uuid-${Math.random()}` });
      return Promise.resolve({ success: true });
    });
    const editorMsg = vi.fn().mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ bridgeGet, sceneMethod, editorMsg }));

    const result = await server.callTool('setup_ui_layout', { itemCount: 1 });

    const data = parse(result) as any;
    expect(data.stages).toContain('resolve_selection_parent');
  });
});

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

  it('带 savePath 时尝试保存 .anim 资产', async () => {
    const sceneMethod = vi.fn().mockImplementation((method: string) => {
      if (method === 'dispatchQuery') return Promise.resolve({ uuid: 'node-uuid', name: 'Hero' });
      if (method === 'createAnimationClip') return Promise.resolve({
        success: true, clipDuration: 1, trackCount: 1, keyframeTimesCount: 2,
        wrapMode: 'Normal', speed: 1, attach: { attached: true },
      });
      return Promise.resolve({ success: true });
    });
    const editorMsg = vi.fn().mockResolvedValue({});
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
