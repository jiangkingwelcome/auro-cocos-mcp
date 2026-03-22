import { describe, expect, it, vi } from 'vitest';
import { buildOperationHandlers, type SceneOperationDeps } from '../../src/scene-operation-handlers-impl';

class TestScript {}

function makeNode(component: Record<string, unknown>) {
  return {
    uuid: 'node-1',
    _id: 'node-1',
    name: 'ScriptNode',
    active: true,
    parent: null,
    children: [],
    _components: [component],
    getComponent: vi.fn((cls: unknown) => (cls === TestScript ? component : null)),
  } as any;
}

function makeDeps(node: any, overrides: Partial<SceneOperationDeps> = {}): SceneOperationDeps {
  return {
    getCC: () => ({
      js: {
        getClassByName: vi.fn((name: string) => {
          if (name === 'TestScript' || name === 'cc.TestScript') return TestScript;
          return null;
        }),
      },
    } as any),
    findNodeByUuid: vi.fn(() => node),
    findNodeByName: vi.fn(() => node),
    resolveParent: vi.fn(() => ({ node })),
    requireNode: vi.fn(() => ({ node })),
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

describe('scene-operation script properties', () => {
  it('set_component_properties 持久化 Vec3 和资源引用，不再 runtime-only 回退', async () => {
    const comp: Record<string, unknown> = {};
    const node = makeNode(comp);
    const deps = makeDeps(node);
    const handlers = buildOperationHandlers(deps);
    const setComponentProperty = vi.fn().mockResolvedValue({ success: true, resolvedViaEditorIPC: true });

    const result = await handlers.get('set_component_properties')!(
      { setComponentProperty } as any,
      {} as any,
      {
        uuid: 'node-1',
        component: 'TestScript',
        properties: {
          target: { __refType__: 'cc.Node', uuid: 'other-node' },
          offset: { x: 1, y: 2, z: 3 },
        },
      },
    );

    expect(setComponentProperty).toHaveBeenCalledWith('node-1', 'TestScript', 'target', { __refType__: 'cc.Node', uuid: 'other-node' });
    expect(deps.notifyEditorComponentProperty).toHaveBeenCalledWith(
      'node-1',
      node,
      comp,
      'offset',
      { type: 'cc.Vec3', value: { x: 1, y: 2, z: 3 } },
    );
    expect(result).toMatchObject({
      success: true,
      changed: {
        target: { __refType__: 'cc.Node', uuid: 'other-node' },
        offset: { x: 1, y: 2, z: 3 },
      },
      _inspectorRefreshed: true,
    });
    expect((result as any).assignedRuntimeOnly).toBeUndefined();
  });

  it('set_component_properties 对不支持的复杂值明确报 unsupportedPersistence', async () => {
    const comp: Record<string, unknown> = {};
    const node = makeNode(comp);
    const deps = makeDeps(node);
    const handlers = buildOperationHandlers(deps);

    const result = await handlers.get('set_component_properties')!(
      { setComponentProperty: vi.fn() } as any,
      {} as any,
      {
        uuid: 'node-1',
        component: 'TestScript',
        properties: {
          customObject: { foo: 1, bar: 2 },
          plainArray: [1, 2, 3],
        },
      },
    );

    expect(result).toMatchObject({
      success: false,
      unsupportedPersistence: [
        { key: 'customObject', reason: '复杂对象持久化未实现' },
        { key: 'plainArray', reason: '数组持久化未实现' },
      ],
    });
    expect(comp.customObject).toBeUndefined();
    expect(comp.plainArray).toBeUndefined();
  });

  it('attach_script 设置属性时对不支持值不再 runtime-only 假成功', async () => {
    const comp: Record<string, unknown> = {};
    const node = makeNode(comp);
    let attached = false;
    node.getComponent = vi.fn((cls: unknown) => {
      if (cls !== TestScript) return null;
      return attached ? comp : null;
    });
    const deps = makeDeps(node);
    const handlers = buildOperationHandlers(deps);

    const result = await handlers.get('attach_script')!(
      {
        addComponent: vi.fn().mockImplementation(async () => {
          attached = true;
          return { success: true };
        }),
        setComponentProperty: vi.fn(),
      } as any,
      {} as any,
      {
        uuid: 'node-1',
        script: 'TestScript',
        properties: {
          tint: { r: 1, g: 2, b: 3, a: 255 },
          unsupported: { nested: true },
        },
      },
    );

    expect(deps.notifyEditorComponentProperty).toHaveBeenCalledWith(
      'node-1',
      node,
      comp,
      'tint',
      { type: 'cc.Color', value: { r: 1, g: 2, b: 3, a: 255 } },
    );
    expect(result).toMatchObject({
      success: false,
      propertiesSet: {
        tint: { r: 1, g: 2, b: 3, a: 255 },
      },
      unsupportedPersistence: [
        { key: 'unsupported', reason: '复杂对象持久化未实现' },
      ],
    });
    expect(comp.unsupported).toBeUndefined();
    expect((result as any).assignedRuntimeOnly).toBeUndefined();
  });
});
