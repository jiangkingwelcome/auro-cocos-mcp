import { describe, expect, it, vi } from 'vitest';
import { buildOperationHandlers, type SceneOperationDeps } from '../../src/scene-operation-handlers-impl';

function makeNode(overrides: Record<string, unknown> = {}) {
  return {
    uuid: 'node-1',
    _id: 'node-1',
    name: 'Node',
    active: true,
    parent: null,
    children: [],
    _components: [],
    getComponent: vi.fn(() => null),
    ...overrides,
  } as any;
}

function makeDeps(scene: any, nodeByUuid: Map<string, any>, overrides: Partial<SceneOperationDeps> = {}): SceneOperationDeps {
  return {
    getCC: () => ({
      js: { getClassByName: vi.fn() },
    } as any),
    findNodeByUuid: vi.fn((_root: unknown, uuid: string) => nodeByUuid.get(uuid) ?? null),
    findNodeByName: vi.fn(),
    resolveParent: vi.fn(() => ({ node: scene })),
    requireNode: vi.fn((_root: unknown, uuid: string) => {
      const node = nodeByUuid.get(uuid);
      return node ? { node } : { error: `未找到节点: ${uuid}` };
    }),
    notifyEditorProperty: vi.fn().mockResolvedValue(true),
    notifyEditorRemoveNode: vi.fn().mockResolvedValue(true),
    notifyEditorComponentProperty: vi.fn().mockResolvedValue(true),
    ipcDuplicateNode: vi.fn().mockResolvedValue('dup-node'),
    setSiblingIndexViaEditor: vi.fn().mockResolvedValue(true),
    ipcCreateNode: vi.fn().mockResolvedValue('new-node'),
    ipcCreateComponent: vi.fn().mockResolvedValue(undefined),
    ipcResetProperty: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

describe('scene-operation success semantics', () => {
  it('create_primitive 会等待 createChildNode / addComponent 的异步结果', async () => {
    class MeshRenderer {}

    const meshRenderer = {
      sharedMaterials: [],
      setMaterial: vi.fn(),
    };
    const primitiveNode = makeNode({
      uuid: 'primitive-node',
      _id: 'primitive-node',
      name: 'Cube',
      getComponent: vi.fn((cls: unknown) => (cls === MeshRenderer ? meshRenderer : null)),
    });
    const scene = makeNode({ uuid: 'scene', _id: 'scene', name: 'Scene', children: [primitiveNode] });
    const nodeByUuid = new Map<string, any>([
      ['scene', scene],
      ['primitive-node', primitiveNode],
    ]);
    const deps = makeDeps(scene, nodeByUuid, {
      getCC: () => ({
        primitives: {
          box: vi.fn(() => ({ positions: [0, 0, 0] })),
        },
        utils: {
          MeshUtils: {
            createMesh: vi.fn(() => ({ mesh: true })),
          },
        },
        MeshRenderer,
        Material: {
          getBuiltinMaterial: vi.fn(() => null),
        },
        Color: class Color {
          constructor(
            public r: number,
            public g: number,
            public b: number,
            public a: number,
          ) {}
        },
      } as any),
    });
    const handlers = buildOperationHandlers(deps);

    const result = await handlers.get('create_primitive')!(
      {
        createChildNode: vi.fn().mockResolvedValue({ success: true, uuid: 'primitive-node', name: 'Cube' }),
        addComponent: vi.fn().mockResolvedValue({ success: true, uuid: 'primitive-node', component: 'MeshRenderer' }),
      } as any,
      scene,
      { type: 'box', name: 'Cube' },
    );

    expect(result).toMatchObject({
      success: true,
      uuid: 'primitive-node',
      type: 'box',
    });
  });

  it('group_nodes 将 success:false 的 reparentNode 视为失败', async () => {
    const scene = makeNode({ uuid: 'scene', _id: 'scene', name: 'Scene' });
    const child = makeNode({ uuid: 'child-1', _id: 'child-1', name: 'Child', parent: scene });
    const nodeByUuid = new Map<string, any>([
      ['scene', scene],
      ['child-1', child],
    ]);
    const deps = makeDeps(scene, nodeByUuid);
    const handlers = buildOperationHandlers(deps);

    const result = await handlers.get('group_nodes')!(
      {
        createChildNode: vi.fn().mockResolvedValue({ success: true, uuid: 'group-1', name: 'Group' }),
        reparentNode: vi.fn().mockResolvedValue({ success: false, message: '节点未移动' }),
      } as any,
      scene,
      { uuids: ['child-1'], name: 'Group' },
    );

    expect(result).toMatchObject({
      success: false,
      error: '部分子节点未能通过 set-parent IPC 挂到组下',
      errors: ['child-1: 节点未移动'],
      movedCount: 0,
    });
  });

  it('create_ui_widget 将 addComponent 的 success:false 视为失败', async () => {
    const scene = makeNode({ uuid: 'scene', _id: 'scene', name: 'Scene' });
    const nodeByUuid = new Map<string, any>([['scene', scene]]);
    const deps = makeDeps(scene, nodeByUuid);
    const handlers = buildOperationHandlers(deps);

    const result = await handlers.get('create_ui_widget')!(
      {
        createChildNode: vi.fn().mockResolvedValue({ success: true, uuid: 'widget-root', name: 'WidgetRoot' }),
        addComponent: vi.fn().mockImplementation(async (_uuid: string, component: string) => {
          if (component === 'Sprite') return { success: false, message: 'Sprite 未添加成功' };
          return { success: true, component };
        }),
      } as any,
      scene,
      { widgetType: 'sprite', name: 'WidgetRoot' },
    );

    expect(result).toMatchObject({
      error: 'Sprite 未添加成功',
    });
  });
});
