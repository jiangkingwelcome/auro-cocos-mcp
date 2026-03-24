import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildOperationHandlers, type SceneOperationDeps } from '../../src/scene-operation-handlers-impl';

function makeNode(component: Record<string, unknown>) {
  return {
    uuid: 'node-1',
    _id: 'node-1',
    name: 'TestNode',
    active: true,
    parent: null,
    children: [],
    _components: [component],
  } as any;
}

function makeDeps(node: any, overrides: Partial<SceneOperationDeps> = {}): SceneOperationDeps {
  class FakeMaterial {
    _name = '';
    _uuid = '';
    uuid = '';
    _effectAsset: any = null;
    _techIdx = 0;
    _defines: any[] = [];
    _states: any[] = [];
    _props: any[] = [];
    passes: any[] = [];
    get effectAsset() { return this._effectAsset; }
    get effectName() { return this._effectAsset?.name ?? ''; }
    get technique() { return this._techIdx; }
    get hash() { return 0; }
    onLoaded() { this.passes = []; }
  }
  return {
    getCC: () => ({
      assetManager: {
        assets: { get: vi.fn() },
        loadAny: vi.fn((uuid: string, cb: (err: Error | null, asset?: unknown) => void) => {
          cb(null, { uuid, _uuid: uuid, name: uuid === 'effect-uuid' ? 'builtin-standard' : uuid, effectName: uuid === 'builtin-standard-uuid' ? 'builtin-standard' : 'unknown' });
        }),
      },
      Material: FakeMaterial,
      js: { getClassByName: vi.fn((name: string) => (name === 'Sprite' || name === 'cc.Sprite') ? function Sprite() {} : null) },
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

function writeJson(filePath: string, json: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
}

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function makeAssetDbRequestMock(options: {
  urlByUuid?: Record<string, string>;
  infoByUrl?: Record<string, Record<string, unknown> | null>;
}) {
  const urlByUuid = new Map(Object.entries(options.urlByUuid ?? {}));
  const infoByUrl = new Map(Object.entries(options.infoByUrl ?? {}));

  return vi.fn(async (module: string, message: string, ...args: unknown[]) => {
    if (module !== 'asset-db') {
      throw new Error(`unexpected ${module}.${message}`);
    }

    if (message === 'query-url') {
      return urlByUuid.get(String(args[0] ?? '')) ?? '';
    }

    if (message === 'query-asset-info') {
      return infoByUrl.get(String(args[0] ?? '')) ?? null;
    }

    if (message === 'generate-available-url') {
      return String(args[0] ?? '');
    }

    if (message === 'create-asset' || message === 'save-asset') {
      const url = String(args[0] ?? '');
      const content = String(args[1] ?? '');
      const info = infoByUrl.get(url);
      if (!info || !info.file) {
        throw new Error(`missing asset info for ${url}`);
      }
      fs.mkdirSync(path.dirname(String(info.file)), { recursive: true });
      fs.writeFileSync(String(info.file), content, 'utf8');
      return { uuid: info.uuid, url };
    }

    throw new Error(`unexpected ${module}.${message}`);
  });
}

describe('scene-operation materials', () => {
  const originalEditor = (globalThis as any).Editor;
  let tempDirs: string[] = [];

  beforeEach(() => {
    vi.restoreAllMocks();
    tempDirs = [];
  });

  it('assign_project_material 通过 sharedMaterials 槽位资产引用绑定材质', async () => {
    const renderer = { constructor: { name: 'MeshRenderer' }, sharedMaterials: [], customMaterial: null };
    const node = makeNode(renderer);
    const deps = makeDeps(node);
    const handlers = buildOperationHandlers(deps);
    const setComponentProperty = vi.fn().mockResolvedValue({ success: true, resolvedViaEditorIPC: true });

    (globalThis as any).Editor = {
      Message: {
        request: vi.fn(async (module: string, message: string, payload: unknown) => {
          if (module === 'asset-db' && message === 'query-asset-info' && payload === 'db://assets/materials/Wood.mtl') {
            return { uuid: 'mat-uuid', url: 'db://assets/materials/Wood.mtl' };
          }
          throw new Error(`unexpected ${module}.${message}`);
        }),
      },
    };

    const result = await handlers.get('assign_project_material')!(
      { setComponentProperty } as any,
      {} as any,
      { uuid: 'node-1', materialUrl: 'db://assets/materials/Wood.mtl', materialIndex: 0 },
    );

    expect(setComponentProperty).toHaveBeenCalledWith('node-1', 'MeshRenderer', 'sharedMaterials.0', { __uuid__: 'mat-uuid' });
    expect(result).toMatchObject({
      success: true,
      materialUuid: 'mat-uuid',
      materialUrl: 'db://assets/materials/Wood.mtl',
      bindingProperty: 'sharedMaterials.0',
    });
  });

  it('assign_project_material 将 success:false 的材质绑定视为失败', async () => {
    const renderer = { constructor: { name: 'MeshRenderer' }, sharedMaterials: [], customMaterial: null };
    const node = makeNode(renderer);
    const deps = makeDeps(node);
    const handlers = buildOperationHandlers(deps);
    const setComponentProperty = vi.fn().mockResolvedValue({ success: false, message: '材质未实际绑定' });

    (globalThis as any).Editor = {
      Message: {
        request: vi.fn(async (module: string, message: string, payload: unknown) => {
          if (module === 'asset-db' && message === 'query-asset-info' && payload === 'db://assets/materials/Wood.mtl') {
            return { uuid: 'mat-uuid', url: 'db://assets/materials/Wood.mtl' };
          }
          throw new Error(`unexpected ${module}.${message}`);
        }),
      },
    };

    const result = await handlers.get('assign_project_material')!(
      { setComponentProperty } as any,
      {} as any,
      { uuid: 'node-1', materialUrl: 'db://assets/materials/Wood.mtl', materialIndex: 0 },
    );

    expect((result as { error?: string }).error).toContain('材质未实际绑定');
  });

  it('assign_builtin_material 解析内置材质资产后按槽位绑定', async () => {
    const renderer = { constructor: { name: 'MeshRenderer' }, sharedMaterials: [], customMaterial: null };
    const node = makeNode(renderer);
    const deps = makeDeps(node);
    const handlers = buildOperationHandlers(deps);
    const setComponentProperty = vi.fn().mockResolvedValue({ success: true, resolvedViaEditorIPC: true });

    (globalThis as any).Editor = {
      Message: {
        request: vi.fn(async (module: string, message: string, payload: unknown) => {
          if (module === 'asset-db' && message === 'query-asset-info' && payload === 'db://internal/default_materials/standard-material.mtl') {
            return { uuid: 'builtin-standard-uuid', url: String(payload) };
          }
          throw new Error(`unexpected ${module}.${message}`);
        }),
      },
    };

    const result = await handlers.get('assign_builtin_material')!(
      { setComponentProperty } as any,
      {} as any,
      { uuid: 'node-1', effectName: 'builtin-standard', materialIndex: 0 },
    );

    expect(setComponentProperty).toHaveBeenCalledWith('node-1', 'MeshRenderer', 'sharedMaterials.0', { __uuid__: 'builtin-standard-uuid' });
    expect(result).toMatchObject({
      success: true,
      materialUuid: 'builtin-standard-uuid',
      materialUrl: 'db://internal/default_materials/standard-material.mtl',
      bindingProperty: 'sharedMaterials.0',
    });
  });

  it('sprite_grayscale 无 grayscale 属性时绑定灰度材质资产并可重置', async () => {
    const sprite = {
      constructor: { name: 'Sprite' },
      __classname__: 'Sprite',
    };
    const node = makeNode(sprite);
    node.getComponent = vi.fn(() => sprite);
    const ipcResetProperty = vi.fn().mockResolvedValue(true);
    const deps = makeDeps(node, { ipcResetProperty });
    const handlers = buildOperationHandlers(deps);
    const setComponentProperty = vi.fn().mockResolvedValue({ success: true, resolvedViaEditorIPC: true });

    (globalThis as any).Editor = {
      Message: {
        request: vi.fn(async (module: string, message: string, payload: unknown) => {
          if (module === 'asset-db' && message === 'query-asset-info' && payload === 'db://internal/default_materials/ui-sprite-gray-material.mtl') {
            return { uuid: 'gray-mat-uuid', url: String(payload) };
          }
          throw new Error(`unexpected ${module}.${message}`);
        }),
      },
    };

    const enableResult = await handlers.get('sprite_grayscale')!(
      { setComponentProperty } as any,
      {} as any,
      { uuid: 'node-1', enable: true },
    );

    expect(setComponentProperty).toHaveBeenCalledWith('node-1', 'Sprite', 'customMaterial', { __uuid__: 'gray-mat-uuid' });
    expect(enableResult).toMatchObject({
      success: true,
      method: 'custom_material_asset',
      materialUuid: 'gray-mat-uuid',
    });

    const disableResult = await handlers.get('sprite_grayscale')!(
      { setComponentProperty } as any,
      {} as any,
      { uuid: 'node-1', enable: false },
    );

    expect(ipcResetProperty).toHaveBeenCalledWith('node-1', '__comps__.0.customMaterial');
    expect(disableResult).toMatchObject({
      success: true,
      method: 'reset_custom_material',
    });
  });

  it('sprite_grayscale 将 success:false 的灰度材质绑定视为失败', async () => {
    const sprite = {
      constructor: { name: 'Sprite' },
      __classname__: 'Sprite',
    };
    const node = makeNode(sprite);
    node.getComponent = vi.fn(() => sprite);
    const deps = makeDeps(node);
    const handlers = buildOperationHandlers(deps);
    const setComponentProperty = vi.fn().mockResolvedValue({ success: false, message: 'customMaterial 未更新' });

    (globalThis as any).Editor = {
      Message: {
        request: vi.fn(async (module: string, message: string, payload: unknown) => {
          if (module === 'asset-db' && message === 'query-asset-info' && payload === 'db://internal/default_materials/ui-sprite-gray-material.mtl') {
            return { uuid: 'gray-mat-uuid', url: String(payload) };
          }
          throw new Error(`unexpected ${module}.${message}`);
        }),
      },
    };

    const result = await handlers.get('sprite_grayscale')!(
      { setComponentProperty } as any,
      {} as any,
      { uuid: 'node-1', enable: true },
    );

    expect(result).toMatchObject({
      error: 'customMaterial 未更新',
    });
  });

  it('set_material_property 会克隆只读材质资产并持久化 uniforms', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-mat-prop-'));
    tempDirs.push(tempDir);
    const sourceUrl = 'db://internal/default_materials/standard-material.mtl';
    const targetUrl = 'db://assets/materials/TestNode-MeshRenderer-0.mtl';
    const sourceFile = path.join(tempDir, 'internal', 'standard-material.mtl');
    const targetFile = path.join(tempDir, 'assets', 'materials', 'TestNode-MeshRenderer-0.mtl');
    writeJson(sourceFile, {
      __type__: 'cc.Material',
      _name: 'standard-material',
      _effectAsset: { __uuid__: 'effect-uuid' },
      _techIdx: 0,
      _defines: [{}],
      _props: [{}],
    });

    const renderer = {
      constructor: { name: 'MeshRenderer' },
      sharedMaterials: [{ _uuid: 'builtin-standard-uuid' }],
      customMaterial: null,
    };
    const node = makeNode(renderer);
    const deps = makeDeps(node);
    const handlers = buildOperationHandlers(deps);
    const setComponentProperty = vi.fn().mockResolvedValue({ success: true, resolvedViaEditorIPC: true });

    (globalThis as any).Editor = {
      Message: {
        request: makeAssetDbRequestMock({
          urlByUuid: {
            'builtin-standard-uuid': sourceUrl,
          },
          infoByUrl: {
            'db://assets/materials': { url: 'db://assets/materials', file: path.join(tempDir, 'assets', 'materials') },
            [sourceUrl]: { uuid: 'builtin-standard-uuid', url: sourceUrl, file: sourceFile, readonly: true },
            [targetUrl]: { uuid: 'cloned-mat-uuid', url: targetUrl, file: targetFile, readonly: false },
          },
        }),
      },
    };

    const result = await handlers.get('set_material_property')!(
      { setComponentProperty } as any,
      {} as any,
      {
        uuid: 'node-1',
        materialIndex: 0,
        savePath: targetUrl,
        uniforms: { mainColor: { r: 255, g: 128, b: 0, a: 255 } },
      },
    );

    expect(setComponentProperty).toHaveBeenCalledWith('node-1', 'MeshRenderer', 'sharedMaterials.0', { __uuid__: 'cloned-mat-uuid' });
    expect(result).toMatchObject({
      success: true,
      materialUrl: targetUrl,
      materialUuid: 'cloned-mat-uuid',
      clonedToPersist: true,
      clonedFromUrl: sourceUrl,
    });
    expect(readJson(targetFile)).toMatchObject({
      _props: [{ mainColor: [1, 128 / 255, 0, 1] }],
    });
  });

  it('set_material_define 会修改项目材质资产的 defines', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-mat-define-'));
    tempDirs.push(tempDir);
    const materialUrl = 'db://assets/materials/RuntimeEditable.mtl';
    const materialFile = path.join(tempDir, 'assets', 'materials', 'RuntimeEditable.mtl');
    writeJson(materialFile, {
      __type__: 'cc.Material',
      _name: 'RuntimeEditable',
      _effectAsset: { __uuid__: 'effect-uuid' },
      _techIdx: 0,
      _defines: [{}],
      _props: [{}],
    });

    const renderer = {
      constructor: { name: 'MeshRenderer' },
      sharedMaterials: [{ _uuid: 'project-mat-uuid' }],
      customMaterial: null,
    };
    const node = makeNode(renderer);
    const deps = makeDeps(node);
    const handlers = buildOperationHandlers(deps);
    const setComponentProperty = vi.fn().mockResolvedValue({ success: true, resolvedViaEditorIPC: true });

    (globalThis as any).Editor = {
      Message: {
        request: makeAssetDbRequestMock({
          urlByUuid: {
            'project-mat-uuid': materialUrl,
          },
          infoByUrl: {
            [materialUrl]: { uuid: 'project-mat-uuid', url: materialUrl, file: materialFile, readonly: false },
          },
        }),
      },
    };

    const result = await handlers.get('set_material_define')!(
      { setComponentProperty } as any,
      {} as any,
      {
        uuid: 'node-1',
        materialIndex: 0,
        defines: { USE_FOG: true, MAX_LIGHTS: 4 },
      },
    );

    expect(result).toMatchObject({
      success: true,
      materialUrl,
      materialUuid: 'project-mat-uuid',
    });
    expect(readJson(materialFile)).toMatchObject({
      _defines: [{ USE_FOG: true, MAX_LIGHTS: 4 }],
    });
  });

  it('clone_material 会生成项目材质资产并重新绑定', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-mat-clone-'));
    tempDirs.push(tempDir);
    const sourceUrl = 'db://internal/default_materials/standard-material.mtl';
    const targetUrl = 'db://assets/materials/TestNode-MeshRenderer-0-clone.mtl';
    const sourceFile = path.join(tempDir, 'internal', 'standard-material.mtl');
    const targetFile = path.join(tempDir, 'assets', 'materials', 'TestNode-MeshRenderer-0-clone.mtl');
    writeJson(sourceFile, {
      __type__: 'cc.Material',
      _name: 'standard-material',
      _effectAsset: { __uuid__: 'effect-uuid' },
      _techIdx: 1,
      _defines: [{ USE_FOG: true }],
      _props: [{ roughness: 0.5 }],
    });

    const staleInstance = { destroy: vi.fn() };
    const renderer = {
      constructor: { name: 'MeshRenderer' },
      sharedMaterials: [{ _uuid: 'builtin-standard-uuid' }],
      customMaterial: null,
      _materialInstances: [staleInstance],
      setSharedMaterial: vi.fn(function (material: unknown, index: number, forceUpdate?: boolean) {
        this.sharedMaterials[index] = material;
        this._materialInstances[index] = null;
        this.__lastForceUpdate = forceUpdate;
      }),
      getMaterialInstance: vi.fn(() => ({ refreshed: true })),
    };
    const node = makeNode(renderer);
    const deps = makeDeps(node);
    const handlers = buildOperationHandlers(deps);
    const setComponentProperty = vi.fn().mockResolvedValue({ success: true, resolvedViaEditorIPC: true });

    (globalThis as any).Editor = {
      Message: {
        request: makeAssetDbRequestMock({
          urlByUuid: {
            'builtin-standard-uuid': sourceUrl,
          },
          infoByUrl: {
            'db://assets/materials': { url: 'db://assets/materials', file: path.join(tempDir, 'assets', 'materials') },
            [sourceUrl]: { uuid: 'builtin-standard-uuid', url: sourceUrl, file: sourceFile, readonly: true },
            [targetUrl]: { uuid: 'clone-uuid', url: targetUrl, file: targetFile, readonly: false },
          },
        }),
      },
    };

    const result = await handlers.get('clone_material')!(
      { setComponentProperty } as any,
      {} as any,
      { uuid: 'node-1', materialIndex: 0, savePath: targetUrl },
    );

    expect(setComponentProperty).toHaveBeenCalledWith('node-1', 'MeshRenderer', 'sharedMaterials.0', { __uuid__: 'clone-uuid' });
    expect(renderer.setSharedMaterial).toHaveBeenCalledWith(expect.objectContaining({ _uuid: 'clone-uuid', uuid: 'clone-uuid', _techIdx: 1 }), 0, true);
    expect(staleInstance.destroy).toHaveBeenCalledTimes(1);
    expect(renderer.getMaterialInstance).toHaveBeenCalledWith(0);
    expect(result).toMatchObject({
      success: true,
      materialUrl: targetUrl,
      materialUuid: 'clone-uuid',
      clonedFromUrl: sourceUrl,
      effectUuid: 'effect-uuid',
    });
    expect(readJson(targetFile)).toMatchObject({
      _techIdx: 1,
      _defines: [{ USE_FOG: true }],
      _props: [{ roughness: 0.5 }],
    });
  });

  it('swap_technique 会修改材质 technique 并补齐 props/defines 槽位', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-mat-tech-'));
    tempDirs.push(tempDir);
    const materialUrl = 'db://assets/materials/TechniqueEditable.mtl';
    const materialFile = path.join(tempDir, 'assets', 'materials', 'TechniqueEditable.mtl');
    writeJson(materialFile, {
      __type__: 'cc.Material',
      _name: 'TechniqueEditable',
      _effectAsset: { __uuid__: 'effect-uuid' },
      _techIdx: 0,
      _defines: [{ USE_FOG: true }],
      _props: [{ roughness: 0.25 }],
    });

    const staleInstance = { destroy: vi.fn() };
    const cachedStaleMaterial = { _uuid: 'project-mat-uuid', uuid: 'project-mat-uuid', technique: 0, effectName: 'builtin-standard' };
    let removedKey: string | null = null;
    const renderer = {
      constructor: { name: 'MeshRenderer' },
      sharedMaterials: [cachedStaleMaterial],
      customMaterial: null,
      _materialInstances: [staleInstance],
      setSharedMaterial: vi.fn(function (material: unknown, index: number, forceUpdate?: boolean) {
        this.sharedMaterials[index] = material;
        this._materialInstances[index] = null;
        this.__lastForceUpdate = forceUpdate;
      }),
      getMaterialInstance: vi.fn(() => ({ refreshed: true })),
    };
    const node = makeNode(renderer);
    const deps = makeDeps(node, {
      getCC: () => ({
        Material: class FakeMaterial {
          _name = '';
          _uuid = '';
          uuid = '';
          _effectAsset: any = null;
          _techIdx = 0;
          _defines: any[] = [];
          _states: any[] = [];
          _props: any[] = [];
          passes: any[] = [];
          get effectAsset() { return this._effectAsset; }
          get effectName() { return this._effectAsset?.name ?? ''; }
          get technique() { return this._techIdx; }
          get hash() { return 0; }
          onLoaded() { this.passes = []; }
        },
        assetManager: {
          assets: {
            get: vi.fn((uuid: string) => uuid === 'project-mat-uuid' ? cachedStaleMaterial : undefined),
            remove: vi.fn((key: string) => {
              removedKey = key;
              return cachedStaleMaterial;
            }),
          },
          releaseAsset: vi.fn(),
          loadAny: vi.fn((uuid: string, cb: (err: Error | null, asset?: unknown) => void) => {
            if (uuid === 'effect-uuid') {
              cb(null, {
                _uuid: uuid,
                uuid,
                name: 'builtin-standard',
                techniques: [
                  { passes: [{}] },
                  { passes: [{}] },
                  { passes: [{}] },
                ],
              });
              return;
            }
            cb(null, { _uuid: uuid, uuid, name: uuid, effectName: uuid === 'project-mat-uuid' ? 'builtin-standard' : 'unknown' });
          }),
        },
        js: { getClassByName: vi.fn(() => null) },
      } as any),
    });
    const handlers = buildOperationHandlers(deps);
    const setComponentProperty = vi.fn().mockResolvedValue({ success: true, resolvedViaEditorIPC: true });

    (globalThis as any).Editor = {
      Message: {
        request: makeAssetDbRequestMock({
          urlByUuid: {
            'project-mat-uuid': materialUrl,
          },
          infoByUrl: {
            [materialUrl]: { uuid: 'project-mat-uuid', url: materialUrl, file: materialFile, readonly: false },
          },
        }),
      },
    };

    const result = await handlers.get('swap_technique')!(
      { setComponentProperty } as any,
      {} as any,
      { uuid: 'node-1', materialIndex: 0, techniqueIndex: 2 },
    );

    const saved = readJson(materialFile);
    expect(result).toMatchObject({
      success: true,
      materialUrl,
      materialUuid: 'project-mat-uuid',
      oldTechnique: 0,
      newTechnique: 2,
    });
    expect(renderer.setSharedMaterial).toHaveBeenCalledWith(expect.objectContaining({ _uuid: 'project-mat-uuid', uuid: 'project-mat-uuid', _techIdx: 2 }), 0, true);
    expect(staleInstance.destroy).toHaveBeenCalledTimes(1);
    expect(renderer.getMaterialInstance).toHaveBeenCalledWith(0);
    expect(saved._techIdx).toBe(2);
    expect(saved._props).toHaveLength(3);
    expect(saved._defines).toHaveLength(3);
    expect(removedKey).toBeNull();
  });

  it('swap_technique 会拒绝超出 effect 技术数量的索引', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-mat-tech-invalid-'));
    tempDirs.push(tempDir);
    const materialUrl = 'db://assets/materials/TechniqueInvalid.mtl';
    const materialFile = path.join(tempDir, 'assets', 'materials', 'TechniqueInvalid.mtl');
    writeJson(materialFile, {
      __type__: 'cc.Material',
      _name: 'TechniqueInvalid',
      _effectAsset: { __uuid__: 'effect-uuid' },
      _techIdx: 0,
      _defines: [{}],
      _props: [{}],
    });

    const renderer = {
      constructor: { name: 'MeshRenderer' },
      sharedMaterials: [{ _uuid: 'project-mat-uuid' }],
      customMaterial: null,
      setSharedMaterial: vi.fn(),
      getMaterialInstance: vi.fn(),
    };
    const node = makeNode(renderer);
    const deps = makeDeps(node, {
      getCC: () => ({
        Material: class FakeMaterial {
          _effectAsset: any = null;
          _techIdx = 0;
          _defines: any[] = [];
          _states: any[] = [];
          _props: any[] = [];
          passes: any[] = [];
          onLoaded() { this.passes = []; }
        },
        assetManager: {
          assets: {
            get: vi.fn(),
            remove: vi.fn(),
          },
          releaseAsset: vi.fn(),
          loadAny: vi.fn((uuid: string, cb: (err: Error | null, asset?: unknown) => void) => {
            if (uuid === 'effect-uuid') {
              cb(null, {
                _uuid: uuid,
                uuid,
                name: 'single-tech-effect',
                techniques: [{ passes: [{}] }],
              });
              return;
            }
            cb(null, { _uuid: uuid, uuid, name: uuid, effectName: 'builtin-standard' });
          }),
        },
        js: { getClassByName: vi.fn(() => null) },
      } as any),
    });
    const handlers = buildOperationHandlers(deps);
    const setComponentProperty = vi.fn().mockResolvedValue({ success: true, resolvedViaEditorIPC: true });

    (globalThis as any).Editor = {
      Message: {
        request: makeAssetDbRequestMock({
          urlByUuid: {
            'project-mat-uuid': materialUrl,
          },
          infoByUrl: {
            [materialUrl]: { uuid: 'project-mat-uuid', url: materialUrl, file: materialFile, readonly: false },
          },
        }),
      },
    };

    const before = readJson(materialFile);
    const result = await handlers.get('swap_technique')!(
      { setComponentProperty } as any,
      {} as any,
      { uuid: 'node-1', materialIndex: 0, technique: 2 },
    );
    const after = readJson(materialFile);

    expect(result).toMatchObject({
      error: 'Technique 2 超出当前材质可用范围',
      materialUrl,
      materialUuid: 'project-mat-uuid',
      currentTechnique: 0,
      techniqueCount: 1,
      validRange: '0-0',
    });
    expect(after).toEqual(before);
    expect(renderer.setSharedMaterial).not.toHaveBeenCalled();
  });

  afterEach(() => {
    for (const dir of tempDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    (globalThis as any).Editor = originalEditor;
  });
});
