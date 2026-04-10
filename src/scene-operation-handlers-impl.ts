// @ts-nocheck — 自 dist 迁移的完整 handler 映射；后续若拆分子模块再逐步补类型
import type { CocosCC, CocosNode, OperationHandler } from './scene-types';
import { isAssetRef, isNodeRef, isComponentRef } from './scene-types';
import { ErrorCategory, logIgnored } from './error-utils';

export interface SceneOperationDeps {
  getCC: () => CocosCC;
  findNodeByUuid: (root: CocosNode | null, uuid: string) => CocosNode | null;
  findNodeByName: (root: CocosNode | null, name: string) => CocosNode | null;
  resolveParent: (scene: CocosNode, ref: string) => { node: CocosNode } | { error: string };
  requireNode: (scene: CocosNode, uuid: string) => { node: CocosNode } | { error: string };
  notifyEditorProperty: (uuid: string, path: string, dump: { type: string; value: unknown }) => Promise<boolean>;
  notifyEditorRemoveNode: (uuid: string) => Promise<boolean>;
  notifyEditorComponentProperty: (
    nodeUuid: string,
    node: CocosNode,
    comp: unknown,
    property: string,
    dump: { type: string; value: unknown },
  ) => Promise<boolean>;
  ipcDuplicateNode: (uuid: string) => Promise<string>;
  /** 通过 scene.move-array-element 调整兄弟顺序（可保存 / Undo） */
  setSiblingIndexViaEditor: (nodeUuid: string, newIndex: number) => Promise<boolean>;
  ipcCreateNode: (parentUuid: string, name: string) => Promise<string>;
  /** scene.create-component — 可 Undo / 可保存 */
  ipcCreateComponent: (nodeUuid: string, componentName: string) => Promise<void>;
  ipcResetProperty: (uuid: string, path: string) => Promise<boolean>;
}

function isSuccessfulResult(result: unknown): result is Record<string, unknown> & { success: true } {
  return !!result && typeof result === 'object' && 'success' in result && result.success === true;
}

function getFailureReason(result: unknown, fallback: string): string {
  if (result && typeof result === 'object') {
    if ('error' in result && result.error) return String(result.error);
    if ('message' in result && result.message) return String(result.message);
  }
  return fallback;
}

function isComponentSubclass(cc: CocosCC, cls: unknown): boolean {
  const { js, Component } = cc;
  const componentBase = js.getClassByName?.('cc.Component') || Component;
  if (!cls || !componentBase) return false;
  const isChild = js.isChildClassOf;
  if (typeof isChild === 'function') {
    try {
      return !!isChild(cls, componentBase);
    } catch {
      // Fall through to prototype-based detection.
    }
  }
  if (typeof cls === 'function' && typeof componentBase === 'function') {
    return cls === componentBase || cls.prototype instanceof componentBase;
  }
  return false;
}

function resolveRegisteredClass(cc: CocosCC, className: string): unknown {
  const { js } = cc;
  const exactClass = js.getClassByName(className);
  if (exactClass) return exactClass;
  if (!className.startsWith('cc.')) return js.getClassByName(`cc.${className}`);
  return null;
}

function buildNonComponentClassError(cc: CocosCC, className: string, label: string) {
  if (className.startsWith('cc.')) {
    const shortName = className.slice(3);
    const shortClass = shortName ? cc.js.getClassByName(shortName) : null;
    if (shortClass && isComponentSubclass(cc, shortClass)) {
      return {
        error: `${label} "${className}" 不是 cc.Component 子类`,
        hint: `检测到 "${shortName}" 是已注册组件。自定义脚本不要带 "cc." 前缀，请改传 "${shortName}"。`,
      };
    }
  }
  return {
    error: `${label} "${className}" 不是 cc.Component 子类`,
    hint: '请确认传入的是 @ccclass 注册名，并且该类继承自 Component。',
  };
}

async function expectSuccessfulResult(resultOrPromise: unknown, fallback: string): Promise<Record<string, unknown> & { success: true }> {
  const result = await Promise.resolve(resultOrPromise);
  if (isSuccessfulResult(result)) return result;
  throw new Error(getFailureReason(result, fallback));
}

/** 世界坐标 → 本地 position（仅用父节点变换，不修改目标节点） */
function worldPointToLocalPosition(
  node: import('./scene-types').CocosNode,
  wx: number,
  wy: number,
  wz: number,
  getCC: () => import('./scene-types').CocosCC,
): { x: number; y: number; z: number } {
  const { Vec3, Mat4 } = getCC();
  const w = new Vec3(wx, wy, wz);
  const parent = node.parent;
  if (!parent) return { x: w.x, y: w.y, z: w.z };
  const out = new Vec3();
  const p = parent as { inverseTransformPoint?: (o: unknown, i: unknown) => void; getWorldMatrix?: (m: unknown) => void };
  if (typeof p.inverseTransformPoint === 'function') {
    p.inverseTransformPoint(out, w);
    return { x: out.x, y: out.y, z: out.z };
  }
  const m = new Mat4();
  p.getWorldMatrix?.(m);
  Mat4.invert(m, m);
  Vec3.transformMat4(out, w, m);
  return { x: out.x, y: out.y, z: out.z };
}

/** 世界欧拉角(度) → 本地 rotation 欧拉角(度)，用于 set-property rotation */
function worldEulerToLocalRotationDeg(
  node: import('./scene-types').CocosNode,
  ex: number,
  ey: number,
  ez: number,
  getCC: () => import('./scene-types').CocosCC,
): { x: number; y: number; z: number } {
  const { Quat, Vec3 } = getCC();
  if (!node.parent) return { x: ex, y: ey, z: ez };
  const worldQ = new Quat();
  Quat.fromEuler(worldQ, ex, ey, ez);
  const invP = new Quat();
  Quat.invert(invP, node.parent.worldRotation);
  const localQ = new Quat();
  Quat.multiply(localQ, invP, worldQ);
  const euler = new Vec3();
  Quat.toEuler(euler, localQ);
  return { x: euler.x, y: euler.y, z: euler.z };
}

/** 目标世界缩放 → 本地 scale 分量比近似（父节点有旋转时可能不准） */
function approxWorldScaleToLocal(
  node: import('./scene-types').CocosNode,
  sx: number,
  sy: number,
  sz: number,
  getCC: () => import('./scene-types').CocosCC,
): { x: number; y: number; z: number; approximate: boolean } {
  const { Vec3 } = getCC();
  const targetW = new Vec3(sx, sy, sz);
  if (!node.parent) return { x: targetW.x, y: targetW.y, z: targetW.z, approximate: false };
  const pw = node.parent.worldScale ?? new Vec3(1, 1, 1);
  return {
    x: pw.x !== 0 ? targetW.x / pw.x : targetW.x,
    y: pw.y !== 0 ? targetW.y / pw.y : targetW.y,
    z: pw.z !== 0 ? targetW.z / pw.z : targetW.z,
    approximate: true,
  };
}

/** 世界 eye→target 朝向 → 节点本地 rotation 欧拉角（度），不写场景节点 */
function worldLookAtToLocalEulerDeg(
  node: import('./scene-types').CocosNode,
  eyeX: number,
  eyeY: number,
  eyeZ: number,
  targetX: number,
  targetY: number,
  targetZ: number,
  getCC: () => import('./scene-types').CocosCC,
): { x: number; y: number; z: number } {
  const { Vec3, Quat, Mat4 } = getCC();
  const eye = new Vec3(eyeX, eyeY, eyeZ);
  const center = new Vec3(targetX, targetY, targetZ);
  let up = new Vec3(0, 1, 0);
  const forward = new Vec3();
  Vec3.subtract(forward, center, eye);
  if (Vec3.lengthSqr(forward) < 1e-10) {
    return worldEulerToLocalRotationDeg(node, 0, 0, 0, getCC);
  }
  Vec3.normalize(forward, forward);
  if (Math.abs(Vec3.dot(forward, up)) > 0.995) {
    up = new Vec3(0, 0, 1);
  }
  const worldQ = new Quat();
  try {
    const view = new Mat4();
    Mat4.lookAt(view, eye, center, up);
    const inv = new Mat4();
    Mat4.invert(inv, view);
    if (typeof Mat4.toQuat === 'function') {
      Mat4.toQuat(worldQ, inv);
    } else if (typeof Mat4.getRotation === 'function') {
      Mat4.getRotation(worldQ, inv);
    } else if (typeof Quat.fromViewUp === 'function') {
      Quat.fromViewUp(worldQ, forward, up);
    } else {
      Quat.identity(worldQ);
    }
  } catch {
    if (typeof Quat.fromViewUp === 'function') {
      Quat.fromViewUp(worldQ, forward, up);
    } else {
      return worldEulerToLocalRotationDeg(node, 0, 0, 0, getCC);
    }
  }
  const worldEuler = new Vec3();
  Quat.toEuler(worldEuler, worldQ);
  return worldEulerToLocalRotationDeg(node, worldEuler.x, worldEuler.y, worldEuler.z, getCC);
}

export function buildOperationHandlers(deps: SceneOperationDeps): Map<string, OperationHandler> {

    const { getCC, requireNode, setSiblingIndexViaEditor, ipcCreateNode, ipcCreateComponent, ipcResetProperty } = deps;
    const BUILTIN_MATERIAL_URLS = {
        'builtin-standard': 'db://internal/default_materials/standard-material.mtl',
        'builtin-sprite': 'db://internal/default_materials/ui-sprite-material.mtl',
        'builtin-sprite-renderer': 'db://internal/default_materials/default-sprite-renderer-material.mtl',
        'ui-sprite-gray': 'db://internal/default_materials/ui-sprite-gray-material.mtl',
        'ui-sprite-gray-alpha-sep': 'db://internal/default_materials/ui-sprite-gray-alpha-sep-material.mtl',
    };
    const builtinMaterialCache = new Map();

    function normalizeBuiltinMaterialKey(effectName) {
        return String(effectName ?? 'builtin-standard').trim().toLowerCase();
    }

    function getNodeComponentIndex(node, comp) {
        return (node._components ?? []).indexOf(comp);
    }

    function getComponentPropertyPath(node, comp, property) {
        const compIndex = getNodeComponentIndex(node, comp);
        if (compIndex < 0)
            return null;
        return `__comps__.${compIndex}.${property}`;
    }

    async function queryAssetInfo(url) {
        try {
            const info = await Editor.Message.request('asset-db', 'query-asset-info', url);
            return info && typeof info === 'object' ? info : null;
        }
        catch (e) {
            logIgnored(ErrorCategory.EDITOR_IPC, `query-asset-info 失败 (${url})`, e);
            return null;
        }
    }

    async function queryAssets(pattern) {
        try {
            const list = await Editor.Message.request('asset-db', 'query-assets', { pattern });
            return Array.isArray(list) ? list : [];
        }
        catch (e) {
            logIgnored(ErrorCategory.EDITOR_IPC, `query-assets 失败 (${pattern})`, e);
            return [];
        }
    }

    async function refreshAsset(url) {
        try {
            await Editor.Message.request('asset-db', 'refresh-asset', url);
            return true;
        }
        catch (e) {
            logIgnored(ErrorCategory.ASSET_OPERATION, `refresh-asset 失败 (${url})`, e);
            return false;
        }
    }

    async function loadAssetByUuid(assetUuid, opts = {}) {
        const cc = getCC();
        const am = cc.assetManager;
        const forceReload = Boolean(opts && typeof opts === 'object' && opts.forceReload);
        const cache = am?.assets;
        const cached = cache?.get?.(assetUuid);
        if (cached && !forceReload)
            return cached;
        if (forceReload && cached) {
            try {
                if (typeof am?.releaseAsset === 'function')
                    am.releaseAsset(cached);
            }
            catch (e) {
                logIgnored(ErrorCategory.ASSET_OPERATION, `releaseAsset 失败 (${assetUuid})`, e);
            }
            try {
                if (typeof cache?.remove === 'function') {
                    const cacheKey = String(cached?._uuid ?? cached?.uuid ?? assetUuid);
                    cache.remove(cacheKey);
                }
            }
            catch (e) {
                logIgnored(ErrorCategory.ASSET_OPERATION, `assets.remove 失败 (${assetUuid})`, e);
            }
        }
        if (!am || typeof am.loadAny !== 'function')
            return cached || null;
        try {
            return await new Promise((resolve, reject) => {
                am.loadAny(assetUuid, (err, asset) => {
                    if (err || !asset) {
                        reject(err || new Error(`资源为空: ${assetUuid}`));
                        return;
                    }
                    resolve(asset);
                });
            });
        }
        catch (e) {
            logIgnored(ErrorCategory.ASSET_OPERATION, `loadAny 材质资源失败 (${assetUuid})`, e);
            return cached || null;
        }
    }

    function findRendererOnNode(node, requestedCompName = '') {
        const comps = node._components || [];
        for (const comp of comps) {
            const cn = comp.constructor?.name ?? comp.__classname__ ?? '';
            if (requestedCompName && cn !== requestedCompName && `cc.${cn}` !== requestedCompName)
                continue;
            const c = comp;
            if (Array.isArray(c.sharedMaterials) || 'customMaterial' in c || typeof c.setMaterial === 'function' || typeof c.getMaterialInstance === 'function') {
                return { renderer: c, resolvedCompName: cn };
            }
        }
        return null;
    }

    async function resolveMaterialAssetRef(materialRef) {
        const value = String(materialRef ?? '').trim();
        if (!value)
            return { error: '缺少材质资源标识' };
        if (value.startsWith('db://')) {
            const info = await queryAssetInfo(value);
            if (!info?.uuid)
                return { error: `材质资源不存在: ${value}` };
            return { uuid: String(info.uuid), url: String(info.url ?? value), source: 'asset-db' };
        }
        const loaded = await loadAssetByUuid(value);
        if (!loaded)
            return { error: `无法加载材质资源 UUID: ${value}` };
        return { uuid: value, url: String(loaded._nativeUrl ?? loaded.nativeUrl ?? loaded.name ?? value), source: 'uuid' };
    }

    async function resolveBuiltinMaterialAsset(effectName) {
        const normalized = normalizeBuiltinMaterialKey(effectName);
        if (builtinMaterialCache.has(normalized))
            return builtinMaterialCache.get(normalized);

        const mappedUrl = BUILTIN_MATERIAL_URLS[normalized];
        if (mappedUrl) {
            const mappedInfo = await queryAssetInfo(mappedUrl);
            if (mappedInfo?.uuid) {
                const resolved = { uuid: String(mappedInfo.uuid), url: mappedUrl, source: 'known-map', effectName: normalized };
                builtinMaterialCache.set(normalized, resolved);
                return resolved;
            }
        }

        const materials = await queryAssets('db://internal/**/*.mtl');
        const sorted = [...materials].sort((a, b) => {
            const urlA = String(a?.url ?? '');
            const urlB = String(b?.url ?? '');
            const score = (url) => {
                let n = 0;
                if (url.includes('/default_materials/'))
                    n -= 10;
                if (url.includes('missing-'))
                    n += 100;
                if (normalized.includes('sprite-gray') && url.includes('gray'))
                    n -= 20;
                if (normalized.includes('sprite') && url.includes('sprite'))
                    n -= 10;
                return n;
            };
            return score(urlA) - score(urlB);
        });
        for (const candidate of sorted) {
            const url = String(candidate?.url ?? '');
            const uuid = String(candidate?.uuid ?? '');
            if (!url)
                continue;
            const finalUuid = uuid || String((await queryAssetInfo(url))?.uuid ?? '');
            if (!finalUuid)
                continue;
            const loaded = await loadAssetByUuid(finalUuid);
            const runtimeEffectName = normalizeBuiltinMaterialKey(loaded?.effectName ?? loaded?.effectAsset?.name ?? loaded?.effectAsset?._name ?? '');
            if (runtimeEffectName === normalized) {
                const resolved = { uuid: finalUuid, url, source: 'scan', effectName: runtimeEffectName };
                builtinMaterialCache.set(normalized, resolved);
                return resolved;
            }
        }
        return { error: `未找到可用的内置材质资源: ${effectName}` };
    }

    function syncRendererMaterialRuntime(renderer, slotIndex, materialAsset, bindingProperty) {
        if (!renderer || !materialAsset)
            return false;
        try {
            const materialInstances = Array.isArray(renderer._materialInstances) ? renderer._materialInstances : null;
            if (materialInstances && materialInstances[slotIndex]) {
                try {
                    if (typeof materialInstances[slotIndex]?.destroy === 'function')
                        materialInstances[slotIndex].destroy();
                }
                catch (e) {
                    logIgnored(ErrorCategory.PROPERTY_ASSIGN, `运行时材质实例销毁失败 (slot=${slotIndex})`, e);
                }
                materialInstances[slotIndex] = null;
            }
            if (bindingProperty === 'customMaterial' && 'customMaterial' in renderer) {
                if (slotIndex === 0 && typeof renderer.setSharedMaterial === 'function')
                    renderer.setSharedMaterial(materialAsset, slotIndex, true);
                renderer.customMaterial = materialAsset;
                if (typeof renderer.getMaterialInstance === 'function')
                    renderer.getMaterialInstance(slotIndex);
                return true;
            }
            if (typeof renderer.setSharedMaterial === 'function') {
                renderer.setSharedMaterial(materialAsset, slotIndex, true);
                if (typeof renderer.getMaterialInstance === 'function')
                    renderer.getMaterialInstance(slotIndex);
                return true;
            }
            if (typeof renderer.setMaterial === 'function') {
                renderer.setMaterial(materialAsset, slotIndex);
                if (typeof renderer.getMaterialInstance === 'function')
                    renderer.getMaterialInstance(slotIndex);
                return true;
            }
            if (Array.isArray(renderer.sharedMaterials)) {
                const next = renderer.sharedMaterials.slice();
                while (next.length <= slotIndex)
                    next.push(null);
                next[slotIndex] = materialAsset;
                renderer.sharedMaterials = next;
                if (typeof renderer.getMaterialInstance === 'function')
                    renderer.getMaterialInstance(slotIndex);
                return true;
            }
            if (slotIndex === 0 && 'customMaterial' in renderer) {
                renderer.customMaterial = materialAsset;
                if (typeof renderer.getMaterialInstance === 'function')
                    renderer.getMaterialInstance(slotIndex);
                return true;
            }
        }
        catch (e) {
            logIgnored(ErrorCategory.PROPERTY_ASSIGN, `运行时材质同步失败 (slot=${slotIndex})`, e);
        }
        return false;
    }

    async function bindMaterialAssetToRenderer(self, nodeUuid, node, renderer, resolvedCompName, slotIndex, materialUuid, opts = {}) {
        const primary = await Promise.resolve(self.setComponentProperty(nodeUuid, resolvedCompName, `sharedMaterials.${slotIndex}`, { __uuid__: materialUuid }));
        if (isSuccessfulResult(primary)) {
            const runtimeMaterial = await createFreshRuntimeMaterialFromJson(opts.materialJson, materialUuid)
                || await loadAssetByUuid(materialUuid, { forceReload: true });
            const bindingProperty = `sharedMaterials.${slotIndex}`;
            const runtimeSynced = syncRendererMaterialRuntime(renderer, slotIndex, runtimeMaterial, bindingProperty);
            return {
                ...(primary && typeof primary === 'object' ? primary : {}),
                bindingProperty,
                ...(runtimeMaterial ? { runtimeMaterialSource: runtimeMaterial._effectAsset ? 'serialized-json' : 'asset-load' } : {}),
                ...(runtimeSynced ? { runtimeSynced: true } : {}),
            };
        }
        if (slotIndex === 0 && 'customMaterial' in renderer) {
            const fallback = await Promise.resolve(self.setComponentProperty(nodeUuid, resolvedCompName, 'customMaterial', { __uuid__: materialUuid }));
            if (isSuccessfulResult(fallback)) {
                const runtimeMaterial = await createFreshRuntimeMaterialFromJson(opts.materialJson, materialUuid)
                    || await loadAssetByUuid(materialUuid, { forceReload: true });
                const runtimeSynced = syncRendererMaterialRuntime(renderer, slotIndex, runtimeMaterial, 'customMaterial');
                return {
                    ...(fallback && typeof fallback === 'object' ? fallback : {}),
                    bindingProperty: 'customMaterial',
                    bindingFallbackFrom: `sharedMaterials.${slotIndex}`,
                    ...(runtimeMaterial ? { runtimeMaterialSource: runtimeMaterial._effectAsset ? 'serialized-json' : 'asset-load' } : {}),
                    ...(runtimeSynced ? { runtimeSynced: true } : {}),
                };
            }
            return {
                error: `材质绑定失败: ${getFailureReason(primary, `sharedMaterials.${slotIndex} 绑定失败`)}；customMaterial 回退也失败: ${getFailureReason(fallback, 'customMaterial 绑定失败')}`,
            };
        }
        return primary;
    }

    function dbUrlDirname(url) {
        const value = String(url ?? '');
        const idx = value.lastIndexOf('/');
        return idx > 'db://'.length ? value.slice(0, idx) : 'db://assets';
    }

    function basenameWithoutExt(url) {
        const last = String(url ?? '').split('/').pop() || 'material';
        const dot = last.lastIndexOf('.');
        return dot > 0 ? last.slice(0, dot) : last;
    }

    function sanitizeFileName(name) {
        return String(name ?? 'material').replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'material';
    }

    function deepCloneJson(value) {
        return JSON.parse(JSON.stringify(value ?? null));
    }

    async function hydrateMaterialSerializedValue(value) {
        if (Array.isArray(value)) {
            const arr = [];
            for (const item of value)
                arr.push(await hydrateMaterialSerializedValue(item));
            return arr;
        }
        if (!value || typeof value !== 'object')
            return value;
        if (typeof value.__uuid__ === 'string' && value.__uuid__) {
            const asset = await loadAssetByUuid(String(value.__uuid__), { forceReload: true });
            return asset || value;
        }
        const cc = getCC();
        if ('r' in value || 'g' in value || 'b' in value) {
            const Color = cc.Color;
            if (typeof Color === 'function') {
                return new Color(
                    Number(value.r ?? 0),
                    Number(value.g ?? 0),
                    Number(value.b ?? 0),
                    Number(value.a ?? 255),
                );
            }
        }
        if ('x' in value || 'y' in value || 'z' in value || 'w' in value) {
            const hasW = 'w' in value;
            const hasZ = 'z' in value;
            const VecCtor = hasW ? cc.Vec4 : hasZ ? cc.Vec3 : cc.Vec2;
            if (typeof VecCtor === 'function') {
                return hasW
                    ? new VecCtor(Number(value.x ?? 0), Number(value.y ?? 0), Number(value.z ?? 0), Number(value.w ?? 0))
                    : hasZ
                        ? new VecCtor(Number(value.x ?? 0), Number(value.y ?? 0), Number(value.z ?? 0))
                        : new VecCtor(Number(value.x ?? 0), Number(value.y ?? 0));
            }
        }
        const out = {};
        for (const [k, v] of Object.entries(value))
            out[k] = await hydrateMaterialSerializedValue(v);
        return out;
    }

    async function createFreshRuntimeMaterialFromJson(materialJson, materialUuid = '') {
        try {
            const cc = getCC();
            const MaterialCtor = cc?.Material;
            if (typeof MaterialCtor !== 'function' || !materialJson || typeof materialJson !== 'object')
                return null;
            const material = new MaterialCtor();
            const effectUuid = String(materialJson?._effectAsset?.__uuid__ ?? materialJson?._effectAsset?._uuid ?? '');
            const effectAsset = effectUuid ? await loadAssetByUuid(effectUuid, { forceReload: true }) : null;
            if (!effectAsset)
                return null;
            material._name = String(materialJson._name ?? materialUuid ?? 'RuntimeMaterial');
            material._effectAsset = effectAsset;
            material._techIdx = Number(materialJson._techIdx ?? 0);
            material._defines = deepCloneJson(materialJson._defines ?? []);
            material._states = deepCloneJson(materialJson._states ?? []);
            material._props = await hydrateMaterialSerializedValue(materialJson._props ?? []);
            if (materialUuid) {
                try {
                    material._uuid = materialUuid;
                    material.uuid = materialUuid;
                }
                catch {
                }
            }
            if (typeof material.onLoaded === 'function')
                material.onLoaded();
            else if (typeof material._update === 'function')
                material._update();
            return material;
        }
        catch (e) {
            logIgnored(ErrorCategory.PROPERTY_ASSIGN, '根据材质 JSON 重建运行时材质失败', e);
            return null;
        }
    }

    async function queryAssetUrl(assetUuid) {
        try {
            const url = await Editor.Message.request('asset-db', 'query-url', assetUuid);
            return typeof url === 'string' && url ? url : '';
        }
        catch (e) {
            logIgnored(ErrorCategory.EDITOR_IPC, `query-url 失败 (${assetUuid})`, e);
            return '';
        }
    }

    async function ensureAssetDirExists(dirUrl) {
        if (!dirUrl || dirUrl === 'db://assets' || dirUrl === 'db://internal')
            return true;
        const prefix = dirUrl.startsWith('db://internal') ? 'db://internal' : 'db://assets';
        const suffix = dirUrl.slice(prefix.length).replace(/^\/+/, '');
        if (!suffix)
            return true;
        const segments = suffix.split('/').filter(Boolean);
        let current = prefix;
        for (const seg of segments) {
            current += `/${seg}`;
            const existing = await queryAssetInfo(current);
            if (existing)
                continue;
            try {
                await Editor.Message.request('asset-db', 'create-asset', current, null);
            }
            catch (e) {
                const retry = await queryAssetInfo(current);
                if (!retry) {
                    logIgnored(ErrorCategory.ASSET_OPERATION, `创建资源目录失败 (${current})`, e);
                    return false;
                }
            }
        }
        return true;
    }

    async function generateAvailableAssetUrl(baseUrl) {
        try {
            const generated = await Editor.Message.request('asset-db', 'generate-available-url', baseUrl);
            return typeof generated === 'string' && generated ? generated : baseUrl;
        }
        catch (e) {
            logIgnored(ErrorCategory.EDITOR_IPC, `generate-available-url 失败 (${baseUrl})`, e);
            return baseUrl;
        }
    }

    async function readMaterialAssetJson(url) {
        const info = await queryAssetInfo(url);
        const filePath = String(info?.file ?? '');
        if (!info?.uuid || !filePath)
            return { error: `无法读取材质资源: ${url}` };
        try {
            const fs = require('fs');
            const text = fs.readFileSync(filePath, 'utf8');
            return { info, json: JSON.parse(text) };
        }
        catch (e) {
            return { error: `读取材质文件失败: ${e instanceof Error ? e.message : String(e)}` };
        }
    }

    async function writeMaterialAssetJson(url, json) {
        try {
            await Editor.Message.request('asset-db', 'save-asset', url, JSON.stringify(json, null, 2));
            await refreshAsset(url);
            return true;
        }
        catch (e) {
            logIgnored(ErrorCategory.ASSET_OPERATION, `保存材质资源失败 (${url})`, e);
            return false;
        }
    }

    async function getMaterialTechniqueCount(materialJson) {
        const effectUuid = String(materialJson?._effectAsset?.__uuid__ ?? materialJson?._effectAsset?._uuid ?? '');
        if (!effectUuid)
            return 0;
        const effectAsset = await loadAssetByUuid(effectUuid, { forceReload: true });
        return Array.isArray(effectAsset?.techniques) ? effectAsset.techniques.length : 0;
    }

    async function getTechniqueCountFromBinding(binding) {
        if (!binding || binding.error)
            return 0;
        const effectUuid = String(
            binding.material?._effectAsset?._uuid
            ?? binding.material?.effectAsset?._uuid
            ?? binding.material?._effectAsset?.uuid
            ?? binding.material?.effectAsset?.uuid
            ?? '',
        );
        if (!effectUuid)
            return 0;
        const effectAsset = await loadAssetByUuid(effectUuid, { forceReload: true });
        return Array.isArray(effectAsset?.techniques) ? effectAsset.techniques.length : 0;
    }

    async function resolveRendererSlotMaterialBinding(renderer, slotIndex) {
        let material = null;
        const sharedMats = renderer?.sharedMaterials;
        if (Array.isArray(sharedMats))
            material = sharedMats[slotIndex] ?? null;
        if (!material && slotIndex === 0 && renderer?.customMaterial)
            material = renderer.customMaterial;
        if (!material)
            return { error: `材质槽位 ${slotIndex} 为空` };

        const uuidCandidates = [
            material._uuid,
            material.uuid,
            material._id,
        ].filter((v) => typeof v === 'string' && v);

        for (const assetUuid of uuidCandidates) {
            const url = await queryAssetUrl(assetUuid);
            if (url) {
                const info = await queryAssetInfo(url);
                return {
                    material,
                    uuid: assetUuid,
                    url,
                    readonly: Boolean(info?.readonly) || url.startsWith('db://internal/'),
                    info,
                };
            }
        }

        return {
            material,
            runtimeOnly: true,
            effectName: normalizeBuiltinMaterialKey(material.effectName ?? material.effectAsset?.name ?? material.effectAsset?._name ?? ''),
            technique: Number(material.technique ?? material._techIdx ?? 0),
        };
    }

    async function cloneMaterialAssetForRenderer(self, nodeUuid, node, renderer, resolvedCompName, slotIndex, opts = {}) {
        const binding = await resolveRendererSlotMaterialBinding(renderer, slotIndex);
        if (binding?.error)
            return binding;

        let materialJson = null;
        let clonedFromUrl = '';
        let clonedFromUuid = '';

        if (!binding.runtimeOnly && binding.url) {
            const source = await readMaterialAssetJson(binding.url);
            if (source?.error)
                return source;
            materialJson = deepCloneJson(source.json);
            clonedFromUrl = binding.url;
            clonedFromUuid = binding.uuid;
        }
        else {
            const effectUuid = String(binding.material?._effectAsset?._uuid ?? binding.material?.effectAsset?._uuid ?? '');
            if (!effectUuid)
                return { error: '无法从运行时材质解析 effect 资源，不能克隆为可保存材质' };
            materialJson = {
                __type__: 'cc.Material',
                _name: '',
                _objFlags: 0,
                _native: '',
                _effectAsset: { __uuid__: effectUuid },
                _techIdx: Number(binding.technique ?? 0),
                _defines: deepCloneJson(binding.material?._defines ?? []),
                _props: deepCloneJson(binding.material?._props ?? [{}]),
            };
        }

        const requestedPath = String(opts.savePath ?? '').trim();
        const baseName = sanitizeFileName(String(opts.baseName ?? `${node.name || 'Node'}-${resolvedCompName || 'Renderer'}-${slotIndex}`));
        let targetUrl = requestedPath || `db://assets/materials/${baseName}.mtl`;
        if (!requestedPath) {
            targetUrl = await generateAvailableAssetUrl(targetUrl);
        }
        const dirUrl = dbUrlDirname(targetUrl);
        const dirOk = await ensureAssetDirExists(dirUrl);
        if (!dirOk)
            return { error: `无法创建材质目录: ${dirUrl}` };

        materialJson._name = sanitizeFileName(basenameWithoutExt(targetUrl));
        const existing = await queryAssetInfo(targetUrl);
        const saved = existing
            ? await writeMaterialAssetJson(targetUrl, materialJson)
            : await (async () => {
                try {
                    await Editor.Message.request('asset-db', 'create-asset', targetUrl, JSON.stringify(materialJson, null, 2));
                    await refreshAsset(targetUrl);
                    return true;
                }
                catch (e) {
                    logIgnored(ErrorCategory.ASSET_OPERATION, `创建材质资源失败 (${targetUrl})`, e);
                    return false;
                }
            })();
        if (!saved)
            return { error: `克隆材质资源失败: ${targetUrl}` };

        const info = await queryAssetInfo(targetUrl);
        if (!info?.uuid)
            return { error: `无法解析克隆后的材质资源 UUID: ${targetUrl}` };
        const rebound = await bindMaterialAssetToRenderer(self, nodeUuid, node, renderer, resolvedCompName, slotIndex, String(info.uuid), {
            materialJson,
        });
        if (!isSuccessfulResult(rebound))
            return rebound;
        return {
            success: true,
            materialUrl: targetUrl,
            materialUuid: String(info.uuid),
            bindingProperty: rebound?.bindingProperty ?? `sharedMaterials.${slotIndex}`,
            ...(clonedFromUrl ? { clonedFromUrl, clonedFromUuid } : {}),
        };
    }

    async function resolvePersistableMaterialTarget(self, nodeUuid, node, renderer, resolvedCompName, slotIndex, opts = {}) {
        const binding = await resolveRendererSlotMaterialBinding(renderer, slotIndex);
        if (binding?.error)
            return binding;
        if (!binding.runtimeOnly && binding.url && !binding.readonly) {
            return {
                materialUrl: binding.url,
                materialUuid: binding.uuid,
                readonly: false,
                cloned: false,
            };
        }
        const clone = await cloneMaterialAssetForRenderer(self, nodeUuid, node, renderer, resolvedCompName, slotIndex, opts);
        if (clone?.error)
            return clone;
        return {
            materialUrl: clone.materialUrl,
            materialUuid: clone.materialUuid,
            bindingProperty: clone.bindingProperty,
            cloned: true,
            ...(clone.clonedFromUrl ? { clonedFromUrl: clone.clonedFromUrl, clonedFromUuid: clone.clonedFromUuid } : {}),
        };
    }

    /** 将纯数据属性写入组件（不先改运行时字段），支持 number/boolean/cc.Color/cc.Vec3 */
    async function applyPropsViaEditor(nodeUuid, node, comp, props) {
        let okAll = true;
        for (const [key, val] of Object.entries(props)) {
            if (val === null || val === undefined)
                continue;
            try {
                if (typeof val === 'number' || typeof val === 'boolean') {
                    const ok = await deps.notifyEditorComponentProperty(nodeUuid, node, comp, key, {
                        type: typeof val === 'boolean' ? 'boolean' : 'number', value: val,
                    });
                    okAll = okAll && ok;
                }
                else if (typeof val === 'object' && !Array.isArray(val) && 'r' in val) {
                    const o = val;
                    const ok = await deps.notifyEditorComponentProperty(nodeUuid, node, comp, key, {
                        type: 'cc.Color',
                        value: {
                            r: Math.max(0, Math.min(255, Number(o.r ?? 0))),
                            g: Math.max(0, Math.min(255, Number(o.g ?? 0))),
                            b: Math.max(0, Math.min(255, Number(o.b ?? 0))),
                            a: Math.max(0, Math.min(255, Number(o.a ?? 255))),
                        },
                    });
                    okAll = okAll && ok;
                }
                else if (typeof val === 'object' && !Array.isArray(val) && 'x' in val && 'y' in val) {
                    const o = val;
                    const ok = await deps.notifyEditorComponentProperty(nodeUuid, node, comp, key, {
                        type: 'cc.Vec3',
                        value: { x: Number(o.x ?? 0), y: Number(o.y ?? 0), z: Number(o.z ?? 0) },
                    });
                    okAll = okAll && ok;
                }
            }
            catch (e) {
                logIgnored(ErrorCategory.PROPERTY_ASSIGN, `IPC 写入属性 "${key}" 失败`, e);
            }
        }
        return okAll;
    }

    function classifySerializableValue(val) {
        if (isAssetRef(val) || isNodeRef(val) || isComponentRef(val))
            return { kind: 'ref' };
        if (typeof val === 'boolean' || typeof val === 'number' || typeof val === 'string')
            return { kind: 'primitive', dumpType: typeof val === 'boolean' ? 'boolean' : typeof val === 'number' ? 'number' : 'string', value: val };
        if (val && typeof val === 'object' && !Array.isArray(val)) {
            if ('r' in val) {
                return {
                    kind: 'editor-dump',
                    dumpType: 'cc.Color',
                    value: {
                        r: Math.max(0, Math.min(255, Number(val.r ?? 0))),
                        g: Math.max(0, Math.min(255, Number(val.g ?? 0))),
                        b: Math.max(0, Math.min(255, Number(val.b ?? 0))),
                        a: Math.max(0, Math.min(255, Number(val.a ?? 255))),
                    },
                };
            }
            if ('width' in val || 'height' in val) {
                if ('x' in val || 'y' in val) {
                    return {
                        kind: 'editor-dump',
                        dumpType: 'cc.Rect',
                        value: {
                            x: Number(val.x ?? 0),
                            y: Number(val.y ?? 0),
                            width: Number(val.width ?? 0),
                            height: Number(val.height ?? 0),
                        },
                    };
                }
                return {
                    kind: 'editor-dump',
                    dumpType: 'cc.Size',
                    value: {
                        width: Number(val.width ?? 0),
                        height: Number(val.height ?? 0),
                    },
                };
            }
            if ('x' in val || 'y' in val || 'z' in val || 'w' in val) {
                if ('w' in val) {
                    return { kind: 'unsupported', reason: 'Vec4 目前未实现稳定持久化' };
                }
                if ('z' in val) {
                    return {
                        kind: 'editor-dump',
                        dumpType: 'cc.Vec3',
                        value: { x: Number(val.x ?? 0), y: Number(val.y ?? 0), z: Number(val.z ?? 0) },
                    };
                }
                return {
                    kind: 'editor-dump',
                    dumpType: 'cc.Vec2',
                    value: { x: Number(val.x ?? 0), y: Number(val.y ?? 0) },
                };
            }
        }
        if (Array.isArray(val) && val.every(isAssetRef)) {
            return { kind: 'ref-array' };
        }
        return { kind: 'unsupported', reason: Array.isArray(val) ? '数组持久化未实现' : '复杂对象持久化未实现' };
    }

    async function applySerializableComponentProperties(self, nodeUuid, node, compName, comp, props) {
        const changed = {};
        const errors = [];
        const unsupportedPersistence = [];
        for (const [key, val] of Object.entries(props)) {
            if (key.startsWith('__') || key === 'constructor' || key === 'prototype') {
                errors.push(`属性 "${key}" 不允许被设置`);
                continue;
            }
            try {
                const classified = classifySerializableValue(val);
                if (classified.kind === 'ref' || classified.kind === 'ref-array') {
                    const res = await Promise.resolve(self.setComponentProperty(nodeUuid, compName, key, val));
                    if (!isSuccessfulResult(res))
                        errors.push(`设置 ${key} 失败: ${getFailureReason(res, '未知错误')}`);
                    else
                        changed[key] = val;
                    continue;
                }
                if (classified.kind === 'primitive' || classified.kind === 'editor-dump') {
                    const ok = await deps.notifyEditorComponentProperty(nodeUuid, node, comp, key, {
                        type: classified.dumpType,
                        value: classified.value,
                    });
                    if (ok)
                        changed[key] = val;
                    else
                        errors.push(`IPC 设置 ${key} 失败`);
                    continue;
                }
                unsupportedPersistence.push({ key, reason: classified.reason });
            }
            catch (err) {
                errors.push(`设置 ${key} 失败: ${err instanceof Error ? err.message : String(err)}`);
            }
        }
        return { changed, errors, unsupportedPersistence };
    }

    const handlers = new Map([
        ['create_node', (self, _s, p) => {
                return (async () => {
                    const result = await Promise.resolve(self.createChildNode(String(p.parentUuid ?? ''), String(p.name ?? 'New Node')));
                    if (result && typeof result === 'object' && 'success' in result && result.success && p.siblingIndex !== undefined) {
                        const uuid = String(result.uuid ?? '');
                        const ok = await setSiblingIndexViaEditor(uuid, Number(p.siblingIndex));
                        if (!ok) {
                            result.warning = (result.warning ? String(result.warning) + ' ' : '') +
                                'siblingIndex 未能通过 move-array-element IPC 应用';
                        }
                    }
                    return result;
                })();
            }],
        ['destroy_node', (self, _s, p) => self.destroyNode(String(p.uuid ?? ''))],
        ['reparent', (self, _s, p) => self.reparentNode(String(p.uuid ?? ''), String(p.parentUuid ?? ''))],
        ['set_position', (self, _s, p) => self.setNodePosition(String(p.uuid ?? ''), Number(p.x ?? 0), Number(p.y ?? 0), Number(p.z ?? 0))],
        ['set_rotation', (self, _s, p) => self.setNodeRotation(String(p.uuid ?? ''), Number(p.x ?? 0), Number(p.y ?? 0), Number(p.z ?? 0))],
        ['set_scale', (self, _s, p) => self.setNodeScale(String(p.uuid ?? ''), Number(p.x ?? 1), Number(p.y ?? 1), Number(p.z ?? 1))],
        ['set_name', (self, _s, p) => self.setNodeName(String(p.uuid ?? ''), String(p.name ?? 'Node'))],
        ['set_active', (self, _s, p) => self.setNodeActive(String(p.uuid ?? ''), Boolean(p.active ?? true))],
        ['add_component', (self, scene, p) => {
                const cc = getCC();
                const uuid = String(p.uuid ?? '');
                const componentName = String(p.component ?? '');
                const r = requireNode(scene, uuid);
                if ('error' in r)
                    return r;
                const cls = resolveRegisteredClass(cc, componentName);
                if (!cls)
                    return { error: `未找到组件类: ${componentName}` };
                if (!isComponentSubclass(cc, cls))
                    return buildNonComponentClassError(cc, componentName, '组件类');
                const existing = r.node.getComponent?.(cls);
                if (existing) {
                    return {
                        success: true,
                        uuid,
                        name: r.node.name,
                        component: componentName,
                        alreadyAttached: true,
                        message: `组件 ${componentName} 已存在，跳过重复添加。`,
                    };
                }
                return self.addComponent(uuid, componentName);
            }],
        ['remove_component', (self, _s, p) => self.removeComponent(String(p.uuid ?? ''), String(p.component ?? ''))],
        ['set_property', (self, _s, p) => self.setComponentProperty(String(p.uuid ?? ''), String(p.component ?? ''), String(p.property ?? ''), p.value)],
        ['duplicate_node', (_self, scene, p) => {
                const r = requireNode(scene, String(p.uuid ?? ''));
                if ('error' in r)
                    return r;
                if (!r.node.parent)
                    return { error: `节点无父节点，无法复制: ${p.uuid}` };
                const includeChildren = p.includeChildren !== false;
                const sourceUuid = String(p.uuid ?? '');
                return (async () => {
                    if (includeChildren) {
                        const clonedUuid = await deps.ipcDuplicateNode(sourceUuid);
                        return { success: true, clonedUuid, name: r.node.name + ' (clone)', includeChildren, _viaEditorIPC: true };
                    }
                    // ── includeChildren=false: duplicate-node IPC 后逐个 remove-node 去掉子树 ──
                    const clonedUuid = await deps.ipcDuplicateNode(sourceUuid);
                    const cloneR = requireNode(scene, clonedUuid);
                    if (!('error' in cloneR)) {
                        const children = [...cloneR.node.children];
                        for (const ch of children) {
                            const cid = String(ch.uuid ?? ch._id ?? '');
                            if (!cid || !(await deps.notifyEditorRemoveNode(cid))) {
                                return {
                                    success: false,
                                    clonedUuid,
                                    includeChildren: false,
                                    error: `浅复制失败：子节点 remove-node IPC 未成功 (${cid || '?'})`,
                                };
                            }
                        }
                    }
                    const ok = await deps.notifyEditorProperty(clonedUuid, 'active', { type: 'boolean', value: true });
                    return {
                        success: true,
                        clonedUuid,
                        name: r.node.name + ' (shallow)',
                        includeChildren: false,
                        _viaEditorIPC: true,
                        _inspectorRefreshed: ok,
                    };
                })();
            }],
        ['set_world_position', (_self, scene, p) => {
                const uuid = String(p.uuid ?? '');
                const r = requireNode(scene, uuid);
                if ('error' in r)
                    return r;
                const local = worldPointToLocalPosition(
                    r.node,
                    Number(p.x ?? 0),
                    Number(p.y ?? 0),
                    Number(p.z ?? 0),
                    getCC,
                );
                const result: Record<string, unknown> = { success: true, uuid, appliedLocalPosition: local, _viaEditorIPC: true };
                return (async () => {
                    const ok = await deps.notifyEditorProperty(uuid, 'position', {
                        type: 'cc.Vec3', value: { x: local.x, y: local.y, z: local.z },
                    });
                    if (ok) {
                        result._inspectorRefreshed = true;
                    } else {
                        result.success = false;
                        result.error = 'set-property(position) 失败，世界坐标未能写入可保存数据';
                    }
                    return result;
                })();
            }],
        ['set_world_rotation', (_self, scene, p) => {
                const uuid = String(p.uuid ?? '');
                const r = requireNode(scene, uuid);
                if ('error' in r)
                    return r;
                const [x, y, z] = [Number(p.x ?? 0), Number(p.y ?? 0), Number(p.z ?? 0)];
                const local = worldEulerToLocalRotationDeg(r.node, x, y, z, getCC);
                const result: Record<string, unknown> = {
                    success: true,
                    uuid,
                    requestedWorldEulerDeg: { x, y, z },
                    appliedLocalEulerDeg: local,
                    _viaEditorIPC: true,
                };
                return (async () => {
                    const ok = await deps.notifyEditorProperty(uuid, 'rotation', {
                        type: 'cc.Vec3', value: { x: local.x, y: local.y, z: local.z },
                    });
                    if (ok) {
                        result._inspectorRefreshed = true;
                    } else {
                        result.success = false;
                        result.error = 'set-property(rotation) 失败';
                    }
                    return result;
                })();
            }],
        ['set_world_scale', (_self, scene, p) => {
                const uuid = String(p.uuid ?? '');
                const r = requireNode(scene, uuid);
                if ('error' in r)
                    return r;
                const [sx, sy, sz] = [Number(p.x ?? 1), Number(p.y ?? 1), Number(p.z ?? 1)];
                const loc = approxWorldScaleToLocal(r.node, sx, sy, sz, getCC);
                const result: Record<string, unknown> = {
                    success: true,
                    uuid,
                    requestedWorldScale: { x: sx, y: sy, z: sz },
                    appliedLocalScale: { x: loc.x, y: loc.y, z: loc.z },
                    _worldScaleApproximate: loc.approximate,
                    _viaEditorIPC: true,
                };
                return (async () => {
                    const ok = await deps.notifyEditorProperty(uuid, 'scale', {
                        type: 'cc.Vec3', value: { x: loc.x, y: loc.y, z: loc.z },
                    });
                    if (ok) {
                        result._inspectorRefreshed = true;
                    } else {
                        result.success = false;
                        result.error = 'set-property(scale) 失败';
                    }
                    return result;
                })();
            }],
        ['move_node_up', (_self, scene, p) => {
                const uuid = String(p.uuid ?? '');
                const r = requireNode(scene, uuid);
                if ('error' in r)
                    return r;
                if (!r.node.parent)
                    return { error: `未找到节点或无父节点: ${uuid}` };
                const idx = r.node.getSiblingIndex();
                if (idx <= 0)
                    return { success: false, uuid, message: '已经在最前面了' };
                const newIdx = idx - 1;
                return (async () => {
                    const ok = await setSiblingIndexViaEditor(uuid, newIdx);
                    if (!ok) {
                        return {
                            success: false,
                            uuid,
                            error: 'move-array-element IPC 失败，未调整兄弟顺序（避免仅内存修改）',
                        };
                    }
                    return { success: true, uuid, newIndex: newIdx, _viaEditorIPC: true };
                })();
            }],
        ['move_node_down', (_self, scene, p) => {
                const uuid = String(p.uuid ?? '');
                const r = requireNode(scene, uuid);
                if ('error' in r)
                    return r;
                if (!r.node.parent)
                    return { error: `未找到节点或无父节点: ${uuid}` };
                const idx = r.node.getSiblingIndex();
                const maxIdx = r.node.parent.children.length - 1;
                if (idx >= maxIdx)
                    return { success: false, uuid, message: '已经在最后面了' };
                const newIdx = idx + 1;
                return (async () => {
                    const ok = await setSiblingIndexViaEditor(uuid, newIdx);
                    if (!ok) {
                        return {
                            success: false,
                            uuid,
                            error: 'move-array-element IPC 失败，未调整兄弟顺序（避免仅内存修改）',
                        };
                    }
                    return { success: true, uuid, newIndex: newIdx, _viaEditorIPC: true };
                })();
            }],
        ['set_sibling_index', (_self, scene, p) => {
                const uuid = String(p.uuid ?? '');
                const r = requireNode(scene, uuid);
                if ('error' in r)
                    return r;
                if (!r.node.parent)
                    return { error: `未找到节点或无父节点: ${uuid}` };
                const newIdx = Number(p.index ?? 0);
                return (async () => {
                    const ok = await setSiblingIndexViaEditor(uuid, newIdx);
                    if (!ok) {
                        return {
                            success: false,
                            uuid,
                            error: 'move-array-element IPC 失败，未设置兄弟索引（避免仅内存修改）',
                        };
                    }
                    return { success: true, uuid, newIndex: newIdx, _viaEditorIPC: true };
                })();
            }],
        ['lock_node', (_self, scene, p) => {
                const r = requireNode(scene, String(p.uuid ?? ''));
                if ('error' in r)
                    return r;
                return { success: false, uuid: p.uuid, name: r.node.name, message: '节点锁定是编辑器层级功能，场景脚本无法实现真正的锁定。建议通过 editor_action 调用编辑器 API 或手动在 Hierarchy 面板中操作。' };
            }],
        ['unlock_node', (_self, scene, p) => {
                const r = requireNode(scene, String(p.uuid ?? ''));
                if ('error' in r)
                    return r;
                return { success: false, uuid: p.uuid, name: r.node.name, message: '节点解锁是编辑器层级功能，场景脚本无法实现真正的解锁。建议通过 editor_action 调用编辑器 API 或手动在 Hierarchy 面板中操作。' };
            }],
        ['hide_node', (_self, scene, p) => {
                const uuid = String(p.uuid ?? '');
                const r = requireNode(scene, uuid);
                if ('error' in r)
                    return r;
                const result: Record<string, unknown> = { success: true, uuid, name: r.node.name, active: false, _viaEditorIPC: true };
                return (async () => {
                    const ok = await deps.notifyEditorProperty(uuid, 'active', { type: 'boolean', value: false });
                    if (ok) {
                        result._inspectorRefreshed = true;
                    } else {
                        result.success = false;
                        result.error = 'set-property(active=false) 失败';
                    }
                    return result;
                })();
            }],
        ['unhide_node', (_self, scene, p) => {
                const uuid = String(p.uuid ?? '');
                const r = requireNode(scene, uuid);
                if ('error' in r)
                    return r;
                const result: Record<string, unknown> = { success: true, uuid, name: r.node.name, active: true, _viaEditorIPC: true };
                return (async () => {
                    const ok = await deps.notifyEditorProperty(uuid, 'active', { type: 'boolean', value: true });
                    if (ok) {
                        result._inspectorRefreshed = true;
                    } else {
                        result.success = false;
                        result.error = 'set-property(active=true) 失败';
                    }
                    return result;
                })();
            }],
        ['set_layer', (_self, scene, p) => {
                const uuid = String(p.uuid ?? '');
                const r = requireNode(scene, uuid);
                if ('error' in r)
                    return r;
                const layerVal = Number(p.layer ?? r.node.layer);
                const result: Record<string, unknown> = { success: true, uuid, name: r.node.name, layer: layerVal, _viaEditorIPC: true };
                return (async () => {
                    const ok = await deps.notifyEditorProperty(uuid, 'layer', { type: 'number', value: layerVal });
                    if (ok) {
                        result._inspectorRefreshed = true;
                    } else {
                        result.success = false;
                        result.error = 'set-property(layer) 失败';
                    }
                    return result;
                })();
            }],
        ['call_component_method', (_self, scene, p) => {
                const { js } = getCC();
                const uuid = String(p.uuid ?? '');
                const r = requireNode(scene, uuid);
                if ('error' in r)
                    return r;
                const compName = String(p.component ?? '');
                const mName = String(p.methodName ?? '');
                if (!compName || !mName)
                    return { error: '缺少 component 或 methodName 参数' };
                const compClass = js.getClassByName(compName) || js.getClassByName('cc.' + compName);
                const comp = compClass ? r.node.getComponent(compClass) : null;
                if (!comp)
                    return { error: `节点上没有组件: ${compName}` };
                if (typeof comp[mName] !== 'function')
                    return { error: `组件 ${compName} 上没有方法: ${mName}` };
                const callArgs = Array.isArray(p.args) ? p.args : [];
                try {
                    const fn = comp[mName];
                    return { success: true, uuid, component: compName, method: mName, result: fn.apply(comp, callArgs) ?? null };
                }
                catch (err) {
                    return { error: `调用失败: ${err instanceof Error ? err.message : String(err)}` };
                }
            }],
        ['clear_children', (_self, scene, p) => {
                const uuid = String(p.uuid ?? '');
                const r = requireNode(scene, uuid);
                if ('error' in r)
                    return r;
                const childUuids = r.node.children.map((c) => c.uuid ?? c._id);
                const count = childUuids.length;
                return (async () => {
                    let editorRemoved = 0;
                    let failed = 0;
                    for (const childUuid of childUuids) {
                        if (await deps.notifyEditorRemoveNode(String(childUuid))) {
                            editorRemoved++;
                        } else {
                            failed++;
                        }
                    }
                    if (failed > 0) {
                        return {
                            success: false,
                            uuid,
                            name: r.node.name,
                            removedCount: editorRemoved,
                            failedCount: failed,
                            error: `${failed} 个子节点 remove-node IPC 失败，未执行 removeAllChildren 兜底（避免仅内存清空）`,
                        };
                    }
                    return {
                        success: true,
                        uuid,
                        name: r.node.name,
                        removedCount: count,
                        _editorRemoved: editorRemoved,
                        _viaEditorIPC: true,
                    };
                })();
            }],
        ['create_primitive', (self, scene, p) => {
                const cc = getCC();
                const prims = cc.primitives;
                const utils = cc.utils;
                const parentUuid = String(p.parentUuid ?? '');
                const type = String((p.type ?? p.primitive ?? 'box')).toLowerCase();
                const SUPPORTED_TYPES = ['box', 'cube', 'sphere', 'cylinder', 'cone', 'plane', 'torus', 'capsule', 'quad'];
                const ALIAS_MAP = { cube: 'box' };
                const resolvedType = ALIAS_MAP[type] || type;
                if (!SUPPORTED_TYPES.includes(type)) {
                    return { error: `不支持的几何体类型: ${type}，可用: ${SUPPORTED_TYPES.join(', ')}` };
                }
                const DEFAULT_NAMES = { box: 'Cube', sphere: 'Sphere', cylinder: 'Cylinder', cone: 'Cone', plane: 'Plane', torus: 'Torus', capsule: 'Capsule', quad: 'Quad' };
                const name = String(p.name ?? DEFAULT_NAMES[resolvedType] ?? 'Primitive');
                return (async () => {
                    let createRes;
                    let nodeUuid = '';
                    try {
                        createRes = await expectSuccessfulResult(self.createChildNode(parentUuid, name), 'createChildNode 失败');
                        nodeUuid = String(createRes.uuid ?? '');
                        if (!nodeUuid)
                            return { error: 'createChildNode 未返回 uuid' };
                        await expectSuccessfulResult(self.addComponent(nodeUuid, 'MeshRenderer'), '添加 MeshRenderer 失败');
                    }
                    catch (err) {
                        return { error: err instanceof Error ? err.message : String(err) };
                    }
                    try {
                        let mesh;
                        // Try primitives API (Cocos 3.x)
                        const primFn = prims?.[resolvedType];
                        if (typeof primFn === 'function' && utils?.MeshUtils?.createMesh) {
                            const geometry = primFn();
                            mesh = utils.MeshUtils.createMesh(geometry, undefined, { calculateBounds: true });
                        }
                        if (!mesh) {
                            return { error: `当前 Cocos 版本不支持 primitives.${resolvedType}，需 Cocos Creator 3.x` };
                        }
                        const r = requireNode(scene, nodeUuid);
                        if ('error' in r)
                            return r;
                        const MeshRenderer = cc.MeshRenderer;
                        const mr = r.node.getComponent(MeshRenderer);
                        if (mr) {
                            mr.mesh = mesh;
                            // Shadow settings
                            if (p.shadowCasting !== undefined || p.shadowCastingMode !== undefined) {
                                const castVal = p.shadowCastingMode ?? (p.shadowCasting ? 1 : 0);
                                if ('shadowCastingMode' in mr)
                                    mr.shadowCastingMode = Number(castVal);
                            }
                            if (p.receiveShadow !== undefined) {
                                if ('receiveShadow' in mr)
                                    mr.receiveShadow = Boolean(p.receiveShadow);
                            }
                            try {
                                const Mat = cc.Material;
                                const Color = cc.Color;
                                const builtinMat = Mat?.getBuiltinMaterial?.('builtin-unlit') ?? Mat?.getBuiltinMaterial?.('builtin-standard');
                                if (builtinMat && mr.setMaterial) {
                                    const clone = typeof builtinMat.clone === 'function'
                                        ? builtinMat.clone()
                                        : builtinMat;
                                    let rVal = 66, gVal = 135, bVal = 245, aVal = 255;
                                    if (p.color && typeof p.color === 'object') {
                                        const c = p.color;
                                        rVal = Math.max(0, Math.min(255, Number(c.r ?? rVal)));
                                        gVal = Math.max(0, Math.min(255, Number(c.g ?? gVal)));
                                        bVal = Math.max(0, Math.min(255, Number(c.b ?? bVal)));
                                        aVal = Math.max(0, Math.min(255, Number(c.a ?? aVal)));
                                    }
                                    if (Color) {
                                        const col = new Color(rVal, gVal, bVal, aVal);
                                        if (typeof clone.setProperty === 'function') {
                                            clone.setProperty('mainColor', col);
                                        }
                                    }
                                    mr.setMaterial(clone, 0);
                                }
                            }
                            catch (e) {
                                logIgnored(ErrorCategory.ENGINE_API, '设置几何体材质/颜色失败（部分版本路径不同，可能显示默认色）', e);
                            }
                        }
                    }
                    catch (err) {
                        return { error: `创建 ${resolvedType} 网格失败: ${err instanceof Error ? err.message : String(err)}` };
                    }
                    const result = {
                        success: true,
                        uuid: nodeUuid,
                        name,
                        type: resolvedType,
                        _structureViaEditorIPC: true,
                        _meshMaterialViaRuntime: true,
                        _note: 'Mesh/shadow/材质实例在运行时生成，仅 sharedMaterials 等通过 IPC 同步',
                    };
                    const rr = requireNode(scene, nodeUuid);
                    if (!('error' in rr)) {
                        const MR = cc.MeshRenderer;
                        const mrComp = MR ? rr.node.getComponent(MR) : null;
                        if (mrComp)
                            await deps.notifyEditorComponentProperty(nodeUuid, rr.node, mrComp, 'sharedMaterials', { type: 'array', value: mrComp.sharedMaterials });
                    }
                    result._inspectorRefreshed = true;
                    return result;
                })();
            }],
        ['set_camera_look_at', (_self, scene, p) => {
                const uuid = String(p.uuid ?? '');
                if (!uuid)
                    return { error: '缺少 uuid 参数，需指定摄像机节点 uuid（可通过 scene_query get_camera_info 获取）' };
                const r = requireNode(scene, uuid);
                if ('error' in r)
                    return r;
                const targetX = Number(p.targetX ?? 0);
                const targetY = Number(p.targetY ?? 0);
                const targetZ = Number(p.targetZ ?? 0);
                const hasPos = p.x !== undefined || p.y !== undefined || p.z !== undefined;
                const dist = 5;
                const eyeX = hasPos ? Number(p.x ?? 0) : dist;
                const eyeY = hasPos ? Number(p.y ?? 0) : dist;
                const eyeZ = hasPos ? Number(p.z ?? 0) : dist;
                const localPos = worldPointToLocalPosition(r.node, eyeX, eyeY, eyeZ, getCC);
                const localRot = worldLookAtToLocalEulerDeg(r.node, eyeX, eyeY, eyeZ, targetX, targetY, targetZ, getCC);
                const result: Record<string, unknown> = {
                    success: true,
                    uuid,
                    name: r.node.name,
                    eyeWorld: { x: eyeX, y: eyeY, z: eyeZ },
                    target: { x: targetX, y: targetY, z: targetZ },
                    appliedLocalPosition: localPos,
                    appliedLocalRotationDeg: localRot,
                    _viaEditorIPC: true,
                };
                return (async () => {
                    const okP = await deps.notifyEditorProperty(uuid, 'position', {
                        type: 'cc.Vec3', value: { x: localPos.x, y: localPos.y, z: localPos.z },
                    });
                    const okR = await deps.notifyEditorProperty(uuid, 'rotation', {
                        type: 'cc.Vec3', value: { x: localRot.x, y: localRot.y, z: localRot.z },
                    });
                    if (okP && okR) {
                        result._inspectorRefreshed = true;
                    } else {
                        result.success = false;
                        result.error = 'set-property(position/rotation) 部分失败，lookAt 可能无法保存';
                    }
                    return result;
                })();
            }],
        ['create_prefab', (_self, scene, p) => {
                const uuid = String(p.uuid ?? '');
                if (!uuid)
                    return { error: '缺少 uuid 参数，请指定要保存为预制体的节点' };
                const r = requireNode(scene, uuid);
                if ('error' in r)
                    return r;
                const savePath = String(p.savePath ?? '');
                return { success: true, uuid, name: r.node.name, savePath: savePath || `db://assets/prefabs/${r.node.name}.prefab`, info: 'Node found, ready for prefab creation via Editor API' };
            }],
        ['reset_property', (_self, scene, p) => {
                const { js } = getCC();
                const uuid = String(p.uuid ?? '');
                const r = requireNode(scene, uuid);
                if ('error' in r)
                    return r;
                const compName = String(p.component ?? '');
                const propName = String(p.property ?? '');
                if (!compName || !propName)
                    return { error: '缺少 component 或 property 参数' };
                const compClass = js.getClassByName(compName) || js.getClassByName('cc.' + compName);
                if (!compClass)
                    return { error: `未找到组件类: ${compName}` };
                const comp = r.node.getComponent(compClass);
                if (!comp)
                    return { error: `节点上没有组件: ${compName}` };
                const path = `${compName}.${propName}`;
                const oldValue = comp[propName];
                return (async () => {
                    const ok = await ipcResetProperty(uuid, path);
                    if (!ok) {
                        return { success: false, uuid, component: compName, property: propName, oldValue, error: 'reset-property IPC 失败' };
                    }
                    return {
                        success: true,
                        uuid,
                        component: compName,
                        property: propName,
                        oldValue,
                        _viaEditorIPC: true,
                        _inspectorRefreshed: true,
                    };
                })();
            }],
        // ─── batch: execute multiple operations in one call ──────────────────
        ['batch', (self, scene, p) => {
                const ops = p.operations;
                if (!Array.isArray(ops) || ops.length === 0)
                    return { error: '缺少 operations 数组' };
                if (ops.length > 200)
                    return { error: `操作数量超过上限 (${ops.length}/200)` };
                const results = [];
                const uuidMap = {}; // $0, $1 ... -> real uuid
                for (let i = 0; i < ops.length; i++) {
                    const op = { ...ops[i] };
                    // Resolve $N references
                    for (const key of Object.keys(op)) {
                        const val = op[key];
                        if (typeof val === 'string' && val.startsWith('$')) {
                            const match = val.match(/^\$(\d+)\.(\w+)$/);
                            if (match) {
                                const refIdx = Number(match[1]);
                                const refKey = match[2];
                                const refResult = results[refIdx];
                                if (refResult && refResult[refKey] !== undefined) {
                                    op[key] = refResult[refKey];
                                }
                            }
                        }
                    }
                    const action = String(op.action ?? '');
                    // Re-dispatch through the handler map (excluding batch itself to prevent recursion)
                    if (action === 'batch') {
                        results.push({ error: '不允许嵌套 batch', index: i });
                        continue;
                    }
                    const handler = handlers.get(action);
                    if (!handler) {
                        results.push({ error: `未知操作: ${action}`, index: i });
                        continue;
                    }
                    try {
                        const result = handler(self, scene, op);
                        results.push({ ...result, _index: i });
                        // Store uuid for $N references
                        const resultUuid = result?.uuid || result?.clonedUuid;
                        if (typeof resultUuid === 'string')
                            uuidMap[`$${i}`] = resultUuid;
                    }
                    catch (err) {
                        results.push({ error: err instanceof Error ? err.message : String(err), _index: i });
                    }
                }
                const successCount = results.filter(r => r.success || !r.error).length;
                return { success: true, totalOps: ops.length, successCount, failCount: ops.length - successCount, results };
            }],
        // ─── create_ui_widget: one-step common UI component creation ─────────
        ['create_ui_widget', (self, scene, p) => {
                const cc = getCC();
                const { js } = cc;
                const widgetType = String(p.widgetType ?? 'button').toLowerCase();
                const parentRef = String(p.parentUuid ?? '');
                const nodeName = String(p.name ?? widgetType.charAt(0).toUpperCase() + widgetType.slice(1));
                const resolved = deps.resolveParent(scene, parentRef);
                if ('error' in resolved)
                    return resolved;
                const allowed = ['button', 'toggle', 'slider', 'progressbar', 'editbox', 'label', 'sprite'];
                if (!allowed.includes(widgetType))
                    return { error: `未知的 widgetType: ${widgetType}，支持: ${allowed.join(', ')}` };
                const getComp = (node, shortName) => {
                    const cls = js.getClassByName(shortName) || js.getClassByName('cc.' + shortName);
                    return cls ? node.getComponent(cls) : null;
                };
                return (async () => {
                    try {
                        const addCompIpc = async (uuid, compShortName) => {
                            const res = await Promise.resolve(self.addComponent(uuid, compShortName));
                            if (!isSuccessfulResult(res))
                                throw new Error(getFailureReason(res, `添加组件 ${compShortName} 失败`));
                            return res;
                        };
                        const newChildUuid = async (parentUuid, childName) => {
                            const res = await Promise.resolve(self.createChildNode(parentUuid, childName));
                            if (!res || typeof res !== 'object' || !res.success || !res.uuid)
                                throw new Error(res && res.error ? String(res.error) : 'createChildNode 失败');
                            return String(res.uuid);
                        };
                        const rootRes = await Promise.resolve(self.createChildNode(parentRef, nodeName));
                        if (!rootRes || typeof rootRes !== 'object' || !rootRes.success || !rootRes.uuid)
                            return { error: rootRes && rootRes.error ? String(rootRes.error) : 'createChildNode 失败' };
                        const rootUuid = String(rootRes.uuid);
                        const createdNodes = [{ uuid: rootUuid, name: nodeName, role: 'root' }];
                        await addCompIpc(rootUuid, 'UITransform');
                        switch (widgetType) {
                            case 'button': {
                                await addCompIpc(rootUuid, 'Sprite');
                                await addCompIpc(rootUuid, 'Button');
                                const labelUuid = await newChildUuid(rootUuid, 'Label');
                                createdNodes.push({ uuid: labelUuid, name: 'Label', role: 'label' });
                                await addCompIpc(labelUuid, 'UITransform');
                                await addCompIpc(labelUuid, 'Label');
                                const rL = requireNode(scene, labelUuid);
                                if (!('error' in rL)) {
                                    const labelComp = getComp(rL.node, 'Label');
                                    if (labelComp) {
                                        await deps.notifyEditorComponentProperty(labelUuid, rL.node, labelComp, 'string', {
                                            type: 'string', value: String(p.text ?? 'Button'),
                                        });
                                    }
                                }
                                break;
                            }
                            case 'toggle': {
                                await addCompIpc(rootUuid, 'Sprite');
                                await addCompIpc(rootUuid, 'Toggle');
                                const cUuid = await newChildUuid(rootUuid, 'Checkmark');
                                createdNodes.push({ uuid: cUuid, name: 'Checkmark', role: 'checkmark' });
                                await addCompIpc(cUuid, 'UITransform');
                                await addCompIpc(cUuid, 'Sprite');
                                break;
                            }
                            case 'slider': {
                                await addCompIpc(rootUuid, 'Sprite');
                                await addCompIpc(rootUuid, 'Slider');
                                const hUuid = await newChildUuid(rootUuid, 'Handle');
                                createdNodes.push({ uuid: hUuid, name: 'Handle', role: 'handle' });
                                await addCompIpc(hUuid, 'UITransform');
                                await addCompIpc(hUuid, 'Sprite');
                                break;
                            }
                            case 'progressbar': {
                                await addCompIpc(rootUuid, 'Sprite');
                                await addCompIpc(rootUuid, 'ProgressBar');
                                const bUuid = await newChildUuid(rootUuid, 'Bar');
                                createdNodes.push({ uuid: bUuid, name: 'Bar', role: 'bar' });
                                await addCompIpc(bUuid, 'UITransform');
                                await addCompIpc(bUuid, 'Sprite');
                                break;
                            }
                            case 'editbox': {
                                await addCompIpc(rootUuid, 'Sprite');
                                await addCompIpc(rootUuid, 'EditBox');
                                const phUuid = await newChildUuid(rootUuid, 'Placeholder');
                                createdNodes.push({ uuid: phUuid, name: 'Placeholder', role: 'placeholder' });
                                await addCompIpc(phUuid, 'UITransform');
                                await addCompIpc(phUuid, 'Label');
                                const rP = requireNode(scene, phUuid);
                                if (!('error' in rP)) {
                                    const phLabel = getComp(rP.node, 'Label');
                                    if (phLabel) {
                                        await deps.notifyEditorComponentProperty(phUuid, rP.node, phLabel, 'string', {
                                            type: 'string', value: String(p.placeholder ?? 'Enter text...'),
                                        });
                                    }
                                }
                                break;
                            }
                            case 'label': {
                                await addCompIpc(rootUuid, 'Label');
                                const rR = requireNode(scene, rootUuid);
                                if (!('error' in rR)) {
                                    const lc = getComp(rR.node, 'Label');
                                    if (lc) {
                                        await deps.notifyEditorComponentProperty(rootUuid, rR.node, lc, 'string', {
                                            type: 'string', value: String(p.text ?? 'Label'),
                                        });
                                    }
                                }
                                break;
                            }
                            case 'sprite': {
                                await addCompIpc(rootUuid, 'Sprite');
                                break;
                            }
                            default:
                                return { error: `未知的 widgetType: ${widgetType}` };
                        }
                        const result = { success: true, uuid: rootUuid, widgetType, nodes: createdNodes, _viaEditorIPC: true };
                        if (p.x !== undefined || p.y !== undefined) {
                            const ok = await deps.notifyEditorProperty(rootUuid, 'position', {
                                type: 'cc.Vec3',
                                value: { x: Number(p.x ?? 0), y: Number(p.y ?? 0), z: 0 },
                            });
                            if (!ok) {
                                result.success = false;
                                result.error = 'set-property(position) 失败';
                            }
                        }
                        let okAll = result.success !== false;
                        for (const cn of createdNodes) {
                            const ok = await deps.notifyEditorProperty(cn.uuid, 'active', { type: 'boolean', value: true });
                            okAll = okAll && ok;
                        }
                        if (okAll && result.success !== false) {
                            result._inspectorRefreshed = true;
                        }
                        else if (result.success !== false) {
                            result.success = false;
                            result.error = result.error || '部分节点 active IPC 失败';
                        }
                        return result;
                    }
                    catch (e) {
                        return { error: e instanceof Error ? e.message : String(e) };
                    }
                })();
            }],
        // ─── setup_particle: create and configure particle system ────────────
        ['setup_particle', (_self, scene, p) => {
                const cc = getCC();
                const { js } = cc;
                const parentRef = String(p.parentUuid ?? '');
                const resolved = deps.resolveParent(scene, parentRef);
                if ('error' in resolved)
                    return resolved;
                const nodeName = String(p.name ?? 'Particles');
                const parentUuid = String(resolved.node.uuid ?? resolved.node._id ?? '');
                if (!parentUuid)
                    return { error: '父节点无 UUID' };
                const PS2D = js.getClassByName('ParticleSystem2D') || js.getClassByName('cc.ParticleSystem2D');
                const PS3D = js.getClassByName('ParticleSystem') || js.getClassByName('cc.ParticleSystem');
                const is2D = String(p.mode ?? 'auto') === '2d' || (!PS3D && PS2D);
                const PSClass = is2D ? PS2D : PS3D;
                if (!PSClass)
                    return { error: 'ParticleSystem 组件不可用' };
                const compShort = is2D ? 'ParticleSystem2D' : 'ParticleSystem';
                const preset = String(p.preset ?? '').toLowerCase();
                const PRESETS = {
                    fire: { life: 1.5, emissionRate: 80, speed: 60, startColor: { r: 255, g: 120, b: 20, a: 255 } },
                    smoke: { life: 3, emissionRate: 30, speed: 20, startColor: { r: 180, g: 180, b: 180, a: 200 } },
                    rain: { life: 1, emissionRate: 200, speed: 300, angle: 270 },
                    snow: { life: 4, emissionRate: 50, speed: 30, startColor: { r: 255, g: 255, b: 255, a: 230 } },
                    sparkle: { life: 0.5, emissionRate: 100, speed: 100, startColor: { r: 255, g: 255, b: 100, a: 255 } },
                    explosion: { life: 0.8, emissionRate: 500, speed: 200, duration: 0.1 },
                };
                const props = preset && PRESETS[preset] ? { ...PRESETS[preset], ...(p.properties ?? {}) } : (p.properties ?? {});
                return (async () => {
                    try {
                        const nodeUuid = await ipcCreateNode(parentUuid, nodeName);
                        await ipcCreateComponent(nodeUuid, compShort);
                        const r = requireNode(scene, nodeUuid);
                        if ('error' in r)
                            return { error: r.error, uuid: nodeUuid, partial: true };
                        const comp = r.node.getComponent(PSClass);
                        if (!comp)
                            return { error: '无法取得粒子系统组件', uuid: nodeUuid, partial: true };
                        const propsOk = await applyPropsViaEditor(nodeUuid, r.node, comp, props);
                        const okA = await deps.notifyEditorProperty(nodeUuid, 'active', { type: 'boolean', value: true });
                        const result = {
                            success: propsOk && okA,
                            uuid: nodeUuid,
                            name: nodeName,
                            particleType: is2D ? '2D' : '3D',
                            preset: preset || 'custom',
                            appliedProperties: Object.keys(props),
                            _viaEditorIPC: true,
                        };
                        if (!propsOk || !okA)
                            result.error = '部分属性或 active 写入失败';
                        else
                            result._inspectorRefreshed = true;
                        return result;
                    }
                    catch (e) {
                        return { error: e instanceof Error ? e.message : String(e) };
                    }
                })();
            }],
        // ─── align_nodes: align or distribute multiple nodes ─────────────────
        ['align_nodes', (_self, scene, p) => {
                const uuids = p.uuids;
                if (!Array.isArray(uuids) || uuids.length < 2)
                    return { error: '需要至少 2 个 uuid' };
                const alignment = String(p.alignment ?? 'center_h');
                const nodes = uuids.map(u => {
                    const r = requireNode(scene, u);
                    if ('error' in r)
                        return null;
                    return r.node;
                }).filter(Boolean);
                if (nodes.length < 2)
                    return { error: '有效节点不足 2 个' };
                const positions = nodes.map(n => n.worldPosition ? { x: n.worldPosition.x, y: n.worldPosition.y, z: n.worldPosition.z } : { x: 0, y: 0, z: 0 });
                const targets: Array<{ n: (typeof nodes)[0]; wx: number; wy: number; wz: number }> = [];
                switch (alignment) {
                    case 'left': {
                        const minX = Math.min(...positions.map(pos => pos.x));
                        nodes.forEach((n, i) => targets.push({ n, wx: minX, wy: positions[i].y, wz: positions[i].z }));
                        break;
                    }
                    case 'right': {
                        const maxX = Math.max(...positions.map(pos => pos.x));
                        nodes.forEach((n, i) => targets.push({ n, wx: maxX, wy: positions[i].y, wz: positions[i].z }));
                        break;
                    }
                    case 'center_h': {
                        const avgX = positions.reduce((s, pos) => s + pos.x, 0) / positions.length;
                        nodes.forEach((n, i) => targets.push({ n, wx: avgX, wy: positions[i].y, wz: positions[i].z }));
                        break;
                    }
                    case 'top': {
                        const maxY = Math.max(...positions.map(pos => pos.y));
                        nodes.forEach((n, i) => targets.push({ n, wx: positions[i].x, wy: maxY, wz: positions[i].z }));
                        break;
                    }
                    case 'bottom': {
                        const minY = Math.min(...positions.map(pos => pos.y));
                        nodes.forEach((n, i) => targets.push({ n, wx: positions[i].x, wy: minY, wz: positions[i].z }));
                        break;
                    }
                    case 'center_v': {
                        const avgY = positions.reduce((s, pos) => s + pos.y, 0) / positions.length;
                        nodes.forEach((n, i) => targets.push({ n, wx: positions[i].x, wy: avgY, wz: positions[i].z }));
                        break;
                    }
                    case 'distribute_h': {
                        const sorted = nodes.slice().sort((a, b) => (a.worldPosition?.x ?? 0) - (b.worldPosition?.x ?? 0));
                        const minX = sorted[0].worldPosition?.x ?? 0;
                        const maxX = sorted[sorted.length - 1].worldPosition?.x ?? 0;
                        const step = sorted.length > 1 ? (maxX - minX) / (sorted.length - 1) : 0;
                        sorted.forEach((n, i) => {
                            targets.push({
                                n,
                                wx: minX + step * i,
                                wy: n.worldPosition?.y ?? 0,
                                wz: n.worldPosition?.z ?? 0,
                            });
                        });
                        break;
                    }
                    case 'distribute_v': {
                        const sorted = nodes.slice().sort((a, b) => (a.worldPosition?.y ?? 0) - (b.worldPosition?.y ?? 0));
                        const minY = sorted[0].worldPosition?.y ?? 0;
                        const maxY = sorted[sorted.length - 1].worldPosition?.y ?? 0;
                        const step = sorted.length > 1 ? (maxY - minY) / (sorted.length - 1) : 0;
                        sorted.forEach((n, i) => {
                            targets.push({
                                n,
                                wx: n.worldPosition?.x ?? 0,
                                wy: minY + step * i,
                                wz: n.worldPosition?.z ?? 0,
                            });
                        });
                        break;
                    }
                    default: return { error: `未知对齐方式: ${alignment}，支持: left, right, center_h, top, bottom, center_v, distribute_h, distribute_v` };
                }
                const result: Record<string, unknown> = { success: true, alignment, nodeCount: nodes.length, uuids, _viaEditorIPC: true };
                return (async () => {
                    let okAll = true;
                    for (const t of targets) {
                        const nUuid = String(t.n.uuid ?? t.n._id ?? '');
                        const lp = worldPointToLocalPosition(t.n, t.wx, t.wy, t.wz, getCC);
                        const ok = await deps.notifyEditorProperty(nUuid, 'position', {
                            type: 'cc.Vec3', value: { x: lp.x, y: lp.y, z: lp.z },
                        });
                        okAll = okAll && ok;
                    }
                    if (okAll) {
                        result._inspectorRefreshed = true;
                    } else {
                        result.success = false;
                        result.error = '部分节点 set-property(position) 失败，对齐可能无法保存';
                    }
                    return result;
                })();
            }],
        // ─── audio_setup: add AudioSource with clip and config ───────────────
        ['audio_setup', (self, scene, p) => {
                const cc = getCC();
                const { js } = cc;
                const uuid = String(p.uuid ?? '');
                const r = requireNode(scene, uuid);
                if ('error' in r)
                    return r;
                const AudioSource = js.getClassByName('AudioSource') || js.getClassByName('cc.AudioSource');
                if (!AudioSource)
                    return { error: 'AudioSource 组件不可用' };
                return (async () => {
                    let comp = r.node.getComponent(AudioSource);
                    if (!comp) {
                        const addRes = await Promise.resolve(self.addComponent(uuid, 'AudioSource'));
                        if (!isSuccessfulResult(addRes))
                            return { error: getFailureReason(addRes, '添加 AudioSource 失败') };
                        const r2 = requireNode(scene, uuid);
                        if ('error' in r2)
                            return r2;
                        comp = r2.node.getComponent(AudioSource);
                    }
                    if (!comp)
                        return { error: '无法添加或找到 AudioSource 组件' };
                    const changed: Record<string, number | boolean> = {};
                    if (p.volume !== undefined)
                        changed.volume = Number(p.volume);
                    if (p.loop !== undefined)
                        changed.loop = Boolean(p.loop);
                    if (p.playOnAwake !== undefined)
                        changed.playOnAwake = Boolean(p.playOnAwake);
                    const result: Record<string, unknown> = {
                        success: true,
                        uuid,
                        name: r.node.name,
                        volume: p.volume !== undefined ? Number(p.volume) : undefined,
                        loop: p.loop !== undefined ? Boolean(p.loop) : undefined,
                        playOnAwake: p.playOnAwake !== undefined ? Boolean(p.playOnAwake) : undefined,
                        _viaEditorIPC: true,
                    };
                    let okAll = true;
                    for (const [prop, val] of Object.entries(changed)) {
                        const dumpType = typeof val === 'boolean' ? 'boolean' : 'number';
                        const ok = await deps.notifyEditorComponentProperty(uuid, r.node, comp, prop, { type: dumpType, value: val });
                        okAll = okAll && ok;
                    }
                    if (p.clip !== undefined && p.clip !== null) {
                        const clipRes = await Promise.resolve(self.setComponentProperty(uuid, 'AudioSource', 'clip', p.clip));
                        okAll = okAll && !!(clipRes && typeof clipRes === 'object' && (clipRes as { success?: boolean }).success !== false && !(clipRes as { error?: string }).error);
                    }
                    if (okAll && (Object.keys(changed).length > 0 || (p.clip !== undefined && p.clip !== null))) {
                        result._inspectorRefreshed = true;
                    } else if (!okAll) {
                        result.success = false;
                        result.error = '部分 AudioSource 属性 set-property 失败';
                    }
                    return result;
                })();
            }],
        // ─── setup_physics_world: configure 2D/3D physics world ──────────────
        ['setup_physics_world', (_self, _scene, p) => {
                const cc = getCC();
                const { js } = cc;
                const PS2D = js.getClassByName('PhysicsSystem2D') || js.getClassByName('cc.PhysicsSystem2D');
                const PS3D = js.getClassByName('PhysicsSystem') || js.getClassByName('cc.PhysicsSystem');
                const mode = String(p.mode ?? 'auto');
                const supports2D = Boolean((mode === '2d' || mode === 'auto') && PS2D?.instance);
                const supports3D = Boolean((mode === '3d' || mode === 'auto') && PS3D?.instance);
                if (!supports2D && !supports3D)
                    return { error: '物理系统不可用（2D 和 3D 均未找到）' };
                return {
                    error: '当前版本未实现 PhysicsSystem 世界配置的稳定持久化，已阻止仅运行时修改。',
                    unsupportedPersistence: true,
                    requested: {
                        mode,
                        gravity: p.gravity ?? null,
                        allowSleep: p.allowSleep,
                        fixedTimeStep: p.fixedTimeStep,
                    },
                    availableSystems: {
                        physics2D: supports2D,
                        physics3D: supports3D,
                    },
                    note: 'PhysicsSystem.instance 属于运行时全局状态，不属于场景序列化数据。',
                };
            }],
        // ─── create_skeleton_node: Spine/DragonBones node setup ──────────────
        ['create_skeleton_node', (_self, scene, p) => {
                const cc = getCC();
                const { js } = cc;
                const parentRef = String(p.parentUuid ?? '');
                const resolved = deps.resolveParent(scene, parentRef);
                if ('error' in resolved)
                    return resolved;
                const skeletonType = String(p.skeletonType ?? 'spine').toLowerCase();
                const nodeName = String(p.name ?? `${skeletonType}_node`);
                const compName = skeletonType === 'spine' ? 'sp.Skeleton' : skeletonType === 'dragonbones' ? 'dragonBones.ArmatureDisplay' : '';
                if (!compName)
                    return { error: `未知骨骼类型: ${skeletonType}，支持: spine, dragonbones` };
                const cls = js.getClassByName(compName);
                if (!cls)
                    return { error: `${compName} 组件不可用，请确认项目中已启用对应模块` };
                const parentUuid = String(resolved.node.uuid ?? resolved.node._id ?? '');
                if (!parentUuid)
                    return { error: '父节点无 UUID' };
                const props = p.properties && typeof p.properties === 'object' ? p.properties : {};
                return (async () => {
                    try {
                        const nodeUuid = await ipcCreateNode(parentUuid, nodeName);
                        await ipcCreateComponent(nodeUuid, compName);
                        const r = requireNode(scene, nodeUuid);
                        if ('error' in r)
                            return { error: r.error, uuid: nodeUuid, partial: true };
                        const comp = r.node.getComponent(cls);
                        if (!comp)
                            return { error: `无法取得 ${compName} 组件`, uuid: nodeUuid, partial: true };
                        const propsOk = await applyPropsViaEditor(nodeUuid, r.node, comp, props);
                        const okA = await deps.notifyEditorProperty(nodeUuid, 'active', { type: 'boolean', value: true });
                        const result = {
                            success: propsOk && okA,
                            uuid: nodeUuid,
                            name: nodeName,
                            skeletonType,
                            component: compName,
                            _viaEditorIPC: true,
                        };
                        if (!propsOk || !okA)
                            result.error = '部分属性或 active 写入失败';
                        else
                            result._inspectorRefreshed = true;
                        return result;
                    }
                    catch (e) {
                        return { error: e instanceof Error ? e.message : String(e) };
                    }
                })();
            }],
        // ─── generate_tilemap: create TiledMap node ──────────────────────────
        ['generate_tilemap', (self, scene, p) => {
                const cc = getCC();
                const { js } = cc;
                const parentRef = String(p.parentUuid ?? '');
                const resolved = deps.resolveParent(scene, parentRef);
                if ('error' in resolved)
                    return resolved;
                const nodeName = String(p.name ?? 'TiledMap');
                const TiledMap = js.getClassByName('TiledMap') || js.getClassByName('cc.TiledMap');
                if (!TiledMap)
                    return { error: 'TiledMap 组件不可用' };
                const parentUuid = String(resolved.node.uuid ?? resolved.node._id ?? '');
                if (!parentUuid)
                    return { error: '父节点无 UUID' };
                return (async () => {
                    try {
                        const nodeUuid = await ipcCreateNode(parentUuid, nodeName);
                        await ipcCreateComponent(nodeUuid, 'TiledMap');
                        const r = requireNode(scene, nodeUuid);
                        if ('error' in r)
                            return { error: r.error, uuid: nodeUuid, partial: true };
                        const comp = r.node.getComponent(TiledMap);
                        if (!comp)
                            return { error: '无法取得 TiledMap 组件', uuid: nodeUuid, partial: true };
                        let tmxOk = true;
                        let tmxError = '';
                        if (p.tmxAsset !== undefined && p.tmxAsset !== null) {
                            const sp = await Promise.resolve(self.setComponentProperty(nodeUuid, 'TiledMap', 'tmxAsset', p.tmxAsset));
                            tmxOk = isSuccessfulResult(sp);
                            if (!tmxOk)
                                tmxError = getFailureReason(sp, 'tmxAsset 持久化失败');
                        }
                        const okA = await deps.notifyEditorProperty(nodeUuid, 'active', { type: 'boolean', value: true });
                        const result = {
                            success: tmxOk && okA,
                            uuid: nodeUuid,
                            name: nodeName,
                            component: 'TiledMap',
                            hasTmxAsset: !!p.tmxAsset,
                            _viaEditorIPC: true,
                        };
                        if (!tmxOk || !okA)
                            result.error = !tmxOk ? tmxError : 'active 写入失败';
                        else
                            result._inspectorRefreshed = true;
                        return result;
                    }
                    catch (e) {
                        return { error: e instanceof Error ? e.message : String(e) };
                    }
                })();
            }],
        // ─── bind_event: attach UI event handler to component ────────────────
        ['bind_event', (_self, scene, p) => {
                const cc = getCC();
                const { js } = cc;
                const uuid = String(p.uuid ?? '');
                const r = requireNode(scene, uuid);
                if ('error' in r)
                    return r;
                const node = r.node;
                const eventType = String(p.eventType ?? 'click');
                const targetUuid = String(p.targetUuid ?? uuid);
                const handler = String(p.handler ?? '');
                const componentName = String(p.component ?? '');
                const customData = p.customEventData !== undefined ? String(p.customEventData) : '';
                if (!handler)
                    return { error: '缺少 handler 参数（回调方法名）' };
                if (!componentName)
                    return { error: '缺少 component 参数（目标脚本组件名）' };
                const EventHandler = js.getClassByName('cc.Component.EventHandler') || js.getClassByName('EventHandler');
                if (!EventHandler)
                    return { error: 'Component.EventHandler 类不可用' };
                const eh = new EventHandler();
                eh.target = deps.findNodeByUuid(scene, targetUuid) || node;
                eh.component = componentName;
                eh.handler = handler;
                if (customData)
                    eh.customEventData = customData;
                const EVENT_PROP_MAP = {
                    click: { comp: 'Button', prop: 'clickEvents' },
                    toggle: { comp: 'Toggle', prop: 'checkEvents' },
                    slider: { comp: 'Slider', prop: 'slideEvents' },
                    editbox_began: { comp: 'EditBox', prop: 'editingDidBegan' },
                    editbox_ended: { comp: 'EditBox', prop: 'editingDidEnded' },
                    editbox_return: { comp: 'EditBox', prop: 'editingReturn' },
                    editbox_changed: { comp: 'EditBox', prop: 'textChanged' },
                    scrollview_scroll: { comp: 'ScrollView', prop: 'scrollEvents' },
                    pageview_change: { comp: 'PageView', prop: 'pageEvents' },
                };
                const mapping = EVENT_PROP_MAP[eventType];
                if (!mapping)
                    return { error: `未知的事件类型: ${eventType}。支持: ${Object.keys(EVENT_PROP_MAP).join(', ')}` };
                const CompClass = js.getClassByName(mapping.comp) || js.getClassByName('cc.' + mapping.comp);
                if (!CompClass)
                    return { error: `组件 ${mapping.comp} 不可用` };
                const comp = node.getComponent(CompClass);
                if (!comp)
                    return { error: `节点上没有 ${mapping.comp} 组件，请先添加` };
                const prev = comp[mapping.prop] || [];
                const events = [...prev, eh];
                const result = {
                    success: true, uuid, eventType,
                    targetComponent: componentName, handler,
                    eventCount: events.length,
                    _viaEditorIPC: true,
                };
                return (async () => {
                    const ok = await deps.notifyEditorComponentProperty(uuid, node, comp, mapping.prop, { type: 'array', value: events });
                    if (ok) {
                        result._inspectorRefreshed = true;
                    } else {
                        result.success = false;
                        result.error = 'set-property 事件数组写入失败（未修改运行时内存）';
                    }
                    return result;
                })();
            }],
        // ─── unbind_event: remove event handler from component ─────────────
        ['unbind_event', (_self, scene, p) => {
                const cc = getCC();
                const { js } = cc;
                const uuid = String(p.uuid ?? '');
                const r = requireNode(scene, uuid);
                if ('error' in r)
                    return r;
                const node = r.node;
                const eventType = String(p.eventType ?? 'click');
                const handler = p.handler !== undefined ? String(p.handler) : null;
                const eventIndex = p.eventIndex !== undefined ? Number(p.eventIndex) : -1;
                const EVENT_PROP_MAP = {
                    click: { comp: 'Button', prop: 'clickEvents' },
                    toggle: { comp: 'Toggle', prop: 'checkEvents' },
                    slider: { comp: 'Slider', prop: 'slideEvents' },
                    editbox_began: { comp: 'EditBox', prop: 'editingDidBegan' },
                    editbox_ended: { comp: 'EditBox', prop: 'editingDidEnded' },
                    editbox_return: { comp: 'EditBox', prop: 'editingReturn' },
                    editbox_changed: { comp: 'EditBox', prop: 'textChanged' },
                    scrollview_scroll: { comp: 'ScrollView', prop: 'scrollEvents' },
                    pageview_change: { comp: 'PageView', prop: 'pageEvents' },
                };
                const mapping = EVENT_PROP_MAP[eventType];
                if (!mapping)
                    return { error: `未知的事件类型: ${eventType}` };
                const CompClass = js.getClassByName(mapping.comp) || js.getClassByName('cc.' + mapping.comp);
                if (!CompClass)
                    return { error: `组件 ${mapping.comp} 不可用` };
                const comp = node.getComponent(CompClass);
                if (!comp)
                    return { error: `节点上没有 ${mapping.comp} 组件` };
                const raw = comp[mapping.prop] || [];
                let remaining;
                let removedCount;
                if (eventIndex >= 0 && eventIndex < raw.length) {
                    remaining = raw.filter((_e, i) => i !== eventIndex);
                    removedCount = 1;
                }
                else if (handler) {
                    remaining = raw.filter(e => String(e.handler ?? '') !== handler);
                    removedCount = raw.length - remaining.length;
                }
                else {
                    remaining = [];
                    removedCount = raw.length;
                }
                const result: Record<string, unknown> = {
                    success: true,
                    uuid,
                    eventType,
                    removedCount,
                    remainingCount: remaining.length,
                    _viaEditorIPC: true,
                };
                return (async () => {
                    const ok = await deps.notifyEditorComponentProperty(uuid, node, comp, mapping.prop, { type: 'array', value: remaining });
                    if (ok) {
                        result._inspectorRefreshed = true;
                    } else {
                        result.success = false;
                        result.error = 'set-property 事件数组写入失败（未修改运行时内存）';
                    }
                    return result;
                })();
            }],
        // ─── list_events: enumerate event bindings on a node ────────────────
        ['list_events', (_self, scene, p) => {
                const cc = getCC();
                const { js } = cc;
                const uuid = String(p.uuid ?? '');
                const r = requireNode(scene, uuid);
                if ('error' in r)
                    return r;
                const node = r.node;
                const EVENT_PROP_MAP = {
                    click: { comp: 'Button', prop: 'clickEvents' },
                    toggle: { comp: 'Toggle', prop: 'checkEvents' },
                    slider: { comp: 'Slider', prop: 'slideEvents' },
                    editbox_changed: { comp: 'EditBox', prop: 'textChanged' },
                    scrollview_scroll: { comp: 'ScrollView', prop: 'scrollEvents' },
                    pageview_change: { comp: 'PageView', prop: 'pageEvents' },
                };
                const result = [];
                for (const [eventType, mapping] of Object.entries(EVENT_PROP_MAP)) {
                    const CompClass = js.getClassByName(mapping.comp) || js.getClassByName('cc.' + mapping.comp);
                    if (!CompClass)
                        continue;
                    const comp = node.getComponent(CompClass);
                    if (!comp)
                        continue;
                    const events = comp[mapping.prop] || [];
                    for (let i = 0; i < events.length; i++) {
                        const e = events[i];
                        result.push({
                            eventType, index: i,
                            component: mapping.comp,
                            targetComponent: e.component ?? '',
                            handler: e.handler ?? '',
                            customEventData: e.customEventData ?? '',
                        });
                    }
                }
                return { uuid, nodeName: node.name, totalEvents: result.length, events: result };
            }],
        // ─── reset_transform: reset position/rotation/scale to defaults ─────
        ['reset_transform', (_self, scene, p) => {
                const uuid = String(p.uuid ?? '');
                const r = requireNode(scene, uuid);
                if ('error' in r)
                    return r;
                const node = r.node;
                const resetPos = p.resetPosition !== false;
                const resetRot = p.resetRotation !== false;
                const resetScale = p.resetScale !== false;
                const result: Record<string, unknown> = {
                    success: true,
                    uuid,
                    name: node.name,
                    reset: { position: resetPos, rotation: resetRot, scale: resetScale },
                    _viaEditorIPC: true,
                };
                return (async () => {
                    let okAll = true;
                    if (resetPos) {
                        const ok = await deps.notifyEditorProperty(uuid, 'position', { type: 'cc.Vec3', value: { x: 0, y: 0, z: 0 } });
                        okAll = okAll && ok;
                    }
                    if (resetRot) {
                        const ok = await deps.notifyEditorProperty(uuid, 'rotation', { type: 'cc.Vec3', value: { x: 0, y: 0, z: 0 } });
                        okAll = okAll && ok;
                    }
                    if (resetScale) {
                        const ok = await deps.notifyEditorProperty(uuid, 'scale', { type: 'cc.Vec3', value: { x: 1, y: 1, z: 1 } });
                        okAll = okAll && ok;
                    }
                    if (okAll) {
                        result._inspectorRefreshed = true;
                    } else {
                        result.success = false;
                        result.error = '部分 set-property 失败，变换重置可能无法完整保存';
                    }
                    return result;
                })();
            }],
        // ─── set_anchor_point: set UITransform anchorPoint directly ─────────
        ['set_anchor_point', (_self, scene, p) => {
                const { js } = getCC();
                const uuid = String(p.uuid ?? '');
                const r = requireNode(scene, uuid);
                if ('error' in r)
                    return r;
                const UITransform = js.getClassByName('UITransform') || js.getClassByName('cc.UITransform');
                if (!UITransform)
                    return { error: 'UITransform 组件类不可用' };
                const ut = r.node.getComponent(UITransform);
                if (!ut)
                    return { error: `节点 "${r.node.name}" 上没有 UITransform 组件` };
                const ax = Number(p.anchorX ?? p.x ?? 0.5);
                const ay = Number(p.anchorY ?? p.y ?? 0.5);
                const result: Record<string, unknown> = { success: true, uuid, name: r.node.name, anchorPoint: { x: ax, y: ay }, _viaEditorIPC: true };
                return (async () => {
                    const ok = await deps.notifyEditorComponentProperty(uuid, r.node, ut, 'anchorPoint', {
                        type: 'cc.Vec2', value: { x: ax, y: ay },
                    });
                    if (ok) {
                        result._inspectorRefreshed = true;
                    } else {
                        result.success = false;
                        result.error = 'set-property(anchorPoint) 失败';
                    }
                    return result;
                })();
            }],
        // ─── set_content_size: set UITransform contentSize directly ───────
        ['set_content_size', (_self, scene, p) => {
                const { js } = getCC();
                const uuid = String(p.uuid ?? '');
                const r = requireNode(scene, uuid);
                if ('error' in r)
                    return r;
                const UITransform = js.getClassByName('UITransform') || js.getClassByName('cc.UITransform');
                if (!UITransform)
                    return { error: 'UITransform 组件类不可用' };
                const ut = r.node.getComponent(UITransform);
                if (!ut)
                    return { error: `节点 "${r.node.name}" 上没有 UITransform 组件` };
                const w = Number(p.width ?? 100);
                const h = Number(p.height ?? 100);
                const result: Record<string, unknown> = {
                    success: true,
                    uuid,
                    name: r.node.name,
                    contentSize: { width: w, height: h },
                    _viaEditorIPC: true,
                };
                return (async () => {
                    const ok = await deps.notifyEditorComponentProperty(uuid, r.node, ut, 'contentSize', {
                        type: 'cc.Size', value: { width: w, height: h },
                    });
                    if (ok) {
                        result._inspectorRefreshed = true;
                    } else {
                        result.success = false;
                        result.error = 'set-property(contentSize) 失败';
                    }
                    return result;
                })();
            }],
        // ─── batch_set_property: set same property on multiple nodes ──────
        ['batch_set_property', (self, _scene, p) => {
                const uuids = p.uuids;
                if (!Array.isArray(uuids) || uuids.length === 0)
                    return { error: '缺少 uuids 数组' };
                const component = String(p.component ?? '');
                const property = String(p.property ?? '');
                const value = p.value;
                if (!component || !property)
                    return { error: '缺少 component 或 property 参数' };
                if (value === undefined)
                    return { error: '缺少 value 参数' };
                return (async () => {
                    const results = [];
                    let successCount = 0;
                    for (const uuid of uuids) {
                        try {
                            const res = await Promise.resolve(self.setComponentProperty(uuid, component, property, value));
                            const resObj = (res && typeof res === 'object') ? res as Record<string, unknown> : {};
                            results.push({ uuid, ...resObj });
                            if (resObj.success)
                                successCount++;
                        }
                        catch (err) {
                            results.push({ uuid, error: err instanceof Error ? err.message : String(err) });
                        }
                    }
                    return { success: successCount > 0, totalNodes: uuids.length, successCount, failCount: uuids.length - successCount, results };
                })();
            }],
        // ─── group_nodes: create parent node and reparent selected nodes ──
        ['group_nodes', (self, scene, p) => {
                const uuids = p.uuids;
                if (!Array.isArray(uuids) || uuids.length < 1)
                    return { error: '缺少 uuids 数组（至少 1 个节点）' };
                const groupName = String(p.name ?? 'Group');
                const parentRef = String(p.parentUuid ?? '');
                const firstNode = deps.findNodeByUuid(scene, uuids[0]);
                if (!firstNode)
                    return { error: `未找到节点: ${uuids[0]}` };
                let parent;
                if (parentRef) {
                    const resolved = deps.resolveParent(scene, parentRef);
                    if ('error' in resolved)
                        return resolved;
                    parent = resolved.node;
                }
                else {
                    parent = firstNode.parent || scene;
                }
                const parentUuidStr = String(parent.uuid ?? parent._id ?? '');
                return (async () => {
                    const createRes = await Promise.resolve(self.createChildNode(parentUuidStr, groupName));
                    if (createRes && typeof createRes === 'object' && 'error' in createRes)
                        return createRes;
                    if (!createRes || typeof createRes !== 'object' || !('success' in createRes) || !createRes.success) {
                        return { error: 'createChildNode 失败，无法创建组节点' };
                    }
                    const groupUuid = String(createRes.uuid ?? '');
                    if (!groupUuid)
                        return { error: 'createChildNode 未返回组节点 uuid' };
                    const moved: Array<{ uuid: string; name: string }> = [];
                    const errors: string[] = [];
                    for (const uid of uuids) {
                        const node = deps.findNodeByUuid(scene, uid);
                        if (!node) {
                            errors.push(`未找到节点: ${uid}`);
                            continue;
                        }
                        const rep = await Promise.resolve(self.reparentNode(String(uid), groupUuid));
                        if (!isSuccessfulResult(rep)) {
                            errors.push(`${uid}: ${getFailureReason(rep, 'reparentNode 失败')}`);
                            continue;
                        }
                        moved.push({ uuid: String(node.uuid ?? node._id ?? uid), name: node.name });
                    }
                    const result: Record<string, unknown> = {
                        success: errors.length === 0,
                        groupUuid,
                        groupName,
                        movedCount: moved.length,
                        moved,
                        _viaEditorIPC: true,
                        ...(errors.length ? { errors } : {}),
                    };
                    if (errors.length) {
                        result.error = '部分子节点未能通过 set-parent IPC 挂到组下';
                    }
                    if (await deps.notifyEditorProperty(groupUuid, 'active', { type: 'boolean', value: true })) {
                        result._inspectorRefreshed = true;
                    }
                    return result;
                })();
            }],
        // ─── reset_node_properties: reset all component properties to defaults ─
        ['reset_node_properties', (_self, scene, p) => {
                const uuid = String(p.uuid ?? '');
                const r = requireNode(scene, uuid);
                if ('error' in r)
                    return r;
                const node = r.node;
                const targetComp = p.component ? String(p.component) : '';
                const components = node._components || [];
                return (async () => {
                    let resetCount = 0;
                    const resetResults = [];
                    for (const comp of components) {
                        const compName = comp.constructor?.name ?? comp.__classname__ ?? 'Unknown';
                        if (targetComp && compName !== targetComp && `cc.${compName}` !== targetComp)
                            continue;
                        const CompClass = comp.constructor;
                        if (!CompClass)
                            continue;
                        try {
                            const defaultInstance = new CompClass();
                            const keys = Object.keys(defaultInstance);
                            let propsReset = 0;
                            let propsResetFailed = 0;
                            for (const key of keys) {
                                if (key.startsWith('__') || key === 'node' || key === 'uuid' || key === '_id' || key === 'enabled')
                                    continue;
                                const path = `${compName}.${key}`;
                                const ok = await ipcResetProperty(uuid, path);
                                if (ok)
                                    propsReset++;
                                else
                                    propsResetFailed++;
                            }
                            resetResults.push({ component: compName, propertiesReset: propsReset, propertiesResetFailed: propsResetFailed });
                            resetCount++;
                        }
                        catch (e) {
                            logIgnored(ErrorCategory.REFLECTION, `组件 "${compName}" 无法创建默认实例`, e);
                            resetResults.push({ component: compName, error: '无法创建默认实例' });
                        }
                    }
                    const result = {
                        success: true,
                        uuid,
                        name: node.name,
                        componentsReset: resetCount,
                        details: resetResults,
                        _viaEditorIPC: true,
                    };
                    if (resetCount > 0) {
                        if (await deps.notifyEditorProperty(uuid, 'active', { type: 'boolean', value: node.active })) {
                            result._inspectorRefreshed = true;
                        }
                    }
                    return result;
                })();
            }],
        ['set_camera_property', (_self, scene, p) => {
                const cc = getCC();
                const { Camera } = cc;
                const uuid = String(p.uuid ?? '');
                if (!uuid)
                    return { error: '缺少 uuid 参数，需指定摄像机节点 uuid' };
                const r = requireNode(scene, uuid);
                if ('error' in r)
                    return r;
                const cam = r.node.getComponent?.(Camera);
                if (!cam)
                    return { error: `节点 ${r.node.name} 上没有 Camera 组件` };
                const changed: Record<string, unknown> = {};
                if (p.fov !== undefined) changed.fov = Number(p.fov);
                if (p.near !== undefined) changed.near = Number(p.near);
                if (p.far !== undefined) changed.far = Number(p.far);
                if (p.orthoHeight !== undefined) changed.orthoHeight = Number(p.orthoHeight);
                if (p.projection !== undefined) changed.projection = Number(p.projection);
                if (p.clearFlags !== undefined) changed.clearFlags = Number(p.clearFlags);
                if (p.priority !== undefined) changed.priority = Number(p.priority);
                if (p.visibility !== undefined) changed.visibility = Number(p.visibility);
                if (p.clearDepth !== undefined) changed.clearDepth = Number(p.clearDepth);
                if (p.clearStencil !== undefined) changed.clearStencil = Number(p.clearStencil);
                if (p.aperture !== undefined) changed.aperture = Number(p.aperture);
                if (p.shutter !== undefined) changed.shutter = Number(p.shutter);
                if (p.iso !== undefined) changed.iso = Number(p.iso);
                if (p.clearColor && typeof p.clearColor === 'object') {
                    const cc2 = p.clearColor as Record<string, unknown>;
                    changed.clearColor = {
                        r: Math.max(0, Math.min(255, Number(cc2.r ?? 0))),
                        g: Math.max(0, Math.min(255, Number(cc2.g ?? 0))),
                        b: Math.max(0, Math.min(255, Number(cc2.b ?? 0))),
                        a: Math.max(0, Math.min(255, Number(cc2.a ?? 255))),
                    };
                }
                if (p.rect && typeof p.rect === 'object') {
                    const rc = p.rect as Record<string, unknown>;
                    changed.rect = {
                        x: Number(rc.x ?? 0),
                        y: Number(rc.y ?? 0),
                        width: Number(rc.width ?? 1),
                        height: Number(rc.height ?? 1),
                    };
                }
                if (Object.keys(changed).length === 0)
                    return { error: '未指定任何要修改的摄像机属性' };
                const result: Record<string, unknown> = { success: true, uuid, name: r.node.name, changed, _viaEditorIPC: true };
                return (async () => {
                    let okAll = true;
                    for (const prop of Object.keys(changed)) {
                        const val = changed[prop];
                        if (typeof val === 'number' || typeof val === 'boolean') {
                            const ok = await deps.notifyEditorComponentProperty(uuid, r.node, cam, prop, {
                                type: typeof val === 'boolean' ? 'boolean' : 'number', value: val,
                            });
                            okAll = okAll && ok;
                        }
                        else if (prop === 'clearColor' && val && typeof val === 'object') {
                            const c = val as { r: number; g: number; b: number; a: number };
                            const ok = await deps.notifyEditorComponentProperty(uuid, r.node, cam, prop, {
                                type: 'cc.Color', value: { r: c.r, g: c.g, b: c.b, a: c.a },
                            });
                            okAll = okAll && ok;
                        }
                        else if (prop === 'rect' && val && typeof val === 'object') {
                            const rc = val as { x: number; y: number; width: number; height: number };
                            const ok = await deps.notifyEditorComponentProperty(uuid, r.node, cam, prop, {
                                type: 'cc.Rect', value: { x: rc.x, y: rc.y, width: rc.width, height: rc.height },
                            });
                            okAll = okAll && ok;
                        }
                    }
                    if (okAll) {
                        result._inspectorRefreshed = true;
                    } else {
                        result.success = false;
                        result.error = '部分 Camera 属性 set-property 失败';
                    }
                    return result;
                })();
            }],
        ['create_camera', (_self, scene, p) => {
                const cc = getCC();
                const { Camera } = cc;
                const name = String(p.name ?? 'Camera');
                const parentRef = String(p.parentUuid ?? '');
                let parentUuid = '';
                if (parentRef) {
                    const pr = requireNode(scene, parentRef);
                    if ('error' in pr)
                        return pr;
                    parentUuid = String(pr.node.uuid ?? pr.node._id ?? '');
                }
                else {
                    parentUuid = String(scene.uuid ?? scene._id ?? '');
                }
                if (!parentUuid)
                    return { error: '无法解析父节点 UUID' };
                return (async () => {
                    try {
                        const nodeUuid = await ipcCreateNode(parentUuid, name);
                        await ipcCreateComponent(nodeUuid, 'Camera');
                        const r = requireNode(scene, nodeUuid);
                        if ('error' in r) {
                            return { error: r.error, uuid: nodeUuid, partial: true };
                        }
                        const cam = r.node.getComponent?.(Camera);
                        if (!cam) {
                            return { error: 'create-component 后未找到 Camera 组件', uuid: nodeUuid, partial: true };
                        }
                        const changed = {};
                        if (p.fov !== undefined) changed.fov = Number(p.fov);
                        if (p.near !== undefined) changed.near = Number(p.near);
                        if (p.far !== undefined) changed.far = Number(p.far);
                        if (p.orthoHeight !== undefined) changed.orthoHeight = Number(p.orthoHeight);
                        if (p.projection !== undefined) changed.projection = Number(p.projection);
                        if (p.clearFlags !== undefined) changed.clearFlags = Number(p.clearFlags);
                        if (p.priority !== undefined) changed.priority = Number(p.priority);
                        if (p.visibility !== undefined) changed.visibility = Number(p.visibility);
                        const result = { success: true, uuid: nodeUuid, name, component: 'Camera', changed, _viaEditorIPC: true };
                        let okAll = true;
                        for (const prop of Object.keys(changed)) {
                            const val = changed[prop];
                            const ok = await deps.notifyEditorComponentProperty(nodeUuid, r.node, cam, prop, {
                                type: typeof val === 'boolean' ? 'boolean' : 'number', value: val,
                            });
                            okAll = okAll && ok;
                        }
                        const hasPos = p.x !== undefined || p.y !== undefined || p.z !== undefined;
                        if (hasPos) {
                            const lp = worldPointToLocalPosition(r.node, Number(p.x ?? 0), Number(p.y ?? 0), Number(p.z ?? 10), getCC);
                            const ok = await deps.notifyEditorProperty(nodeUuid, 'position', {
                                type: 'cc.Vec3',
                                value: { x: lp.x, y: lp.y, z: lp.z },
                            });
                            okAll = okAll && ok;
                        }
                        const okA = await deps.notifyEditorProperty(nodeUuid, 'active', { type: 'boolean', value: true });
                        okAll = okAll && okA;
                        if (okAll) {
                            result._inspectorRefreshed = true;
                        }
                        else {
                            result.success = false;
                            result.error = '部分 Camera / 节点属性 set-property 失败';
                        }
                        return result;
                    }
                    catch (e) {
                        return { error: e instanceof Error ? e.message : String(e) };
                    }
                })();
            }],
        ['set_material_property', (_self, scene, p) => {
                const uuid = String(p.uuid ?? '');
                if (!uuid)
                    return { error: '缺少 uuid 参数' };
                const r = requireNode(scene, uuid);
                if ('error' in r)
                    return r;
                const slotIndex = Number(p.materialIndex ?? 0);
                const compName = String(p.component ?? '');
                const rendererInfo = findRendererOnNode(r.node, compName);
                if (!rendererInfo)
                    return { error: `节点 ${r.node.name} 上未找到渲染器组件${compName ? ` (${compName})` : ''}` };
                const uniforms = p.uniforms;
                if (!uniforms || typeof uniforms !== 'object')
                    return { error: '缺少 uniforms 参数（如 {"mainColor": {"r":255,"g":0,"b":0,"a":255}}）' };
                return (async () => {
                    const target = await resolvePersistableMaterialTarget(_self, uuid, r.node, rendererInfo.renderer, rendererInfo.resolvedCompName, slotIndex, {
                        savePath: p.savePath,
                        baseName: `${r.node.name}-${rendererInfo.resolvedCompName || 'Material'}-${slotIndex}`,
                    });
                    if (target?.error)
                        return target;
                    const asset = await readMaterialAssetJson(target.materialUrl);
                    if (asset?.error)
                        return asset;
                    const json = deepCloneJson(asset.json);
                    const techIdx = Number(json._techIdx ?? 0);
                    if (!Array.isArray(json._props))
                        json._props = [];
                    while (json._props.length <= techIdx)
                        json._props.push({});
                    const changed = {};
                    for (const [uName, rawUniformValue] of Object.entries(uniforms)) {
                        // 支持 Inspector/查询结果中的包装格式：{ value: [...] }
                        const uVal = (rawUniformValue && typeof rawUniformValue === 'object' && !Array.isArray(rawUniformValue) && 'value' in rawUniformValue)
                            ? rawUniformValue.value
                            : rawUniformValue;

                        if (uVal && typeof uVal === 'object' && !Array.isArray(uVal)) {
                            const v = uVal;
                            if ('r' in v) {
                                json._props[techIdx][uName] = [
                                    Math.max(0, Math.min(255, Number(v.r ?? 0))) / 255,
                                    Math.max(0, Math.min(255, Number(v.g ?? 0))) / 255,
                                    Math.max(0, Math.min(255, Number(v.b ?? 0))) / 255,
                                    Math.max(0, Math.min(255, Number(v.a ?? 255))) / 255,
                                ];
                            }
                            else if ('x' in v || 'y' in v || 'z' in v || 'w' in v) {
                                const vec = [Number(v.x ?? 0), Number(v.y ?? 0)];
                                if ('z' in v)
                                    vec.push(Number(v.z ?? 0));
                                if ('w' in v)
                                    vec.push(Number(v.w ?? 0));
                                json._props[techIdx][uName] = vec;
                            }
                            else {
                                json._props[techIdx][uName] = deepCloneJson(uVal);
                            }
                        }
                        else {
                            json._props[techIdx][uName] = uVal;
                        }
                        changed[uName] = uVal;
                    }
                    const ok = await writeMaterialAssetJson(target.materialUrl, json);
                    if (!ok)
                        return { error: `保存材质属性失败: ${target.materialUrl}` };
                    const binding = await bindMaterialAssetToRenderer(_self, uuid, r.node, rendererInfo.renderer, rendererInfo.resolvedCompName, slotIndex, target.materialUuid, {
                        materialJson: json,
                    });
                    if (!isSuccessfulResult(binding))
                        return binding;
                    return {
                        success: true,
                        uuid,
                        name: r.node.name,
                        component: rendererInfo.resolvedCompName,
                        materialIndex: slotIndex,
                        materialUrl: target.materialUrl,
                        materialUuid: target.materialUuid,
                        changed,
                        ...(target.cloned ? { clonedToPersist: true, clonedFromUrl: target.clonedFromUrl, clonedFromUuid: target.clonedFromUuid } : {}),
                        _inspectorRefreshed: true,
                    };
                })();
            }],
        ['assign_builtin_material', (_self, scene, p) => {
                const uuid = String(p.uuid ?? '');
                if (!uuid)
                    return { error: '缺少 uuid 参数' };
                const r = requireNode(scene, uuid);
                if ('error' in r)
                    return r;
                const effectName = String(p.effectName ?? 'builtin-standard');
                const slotIndex = Number(p.materialIndex ?? 0);
                const compName = String(p.component ?? '');
                const rendererInfo = findRendererOnNode(r.node, compName);
                if (!rendererInfo)
                    return { error: `节点 ${r.node.name} 上未找到渲染器组件${compName ? ` (${compName})` : ''}` };
                return (async () => {
                    const builtinRef = await resolveBuiltinMaterialAsset(effectName);
                    if (builtinRef?.error)
                        return builtinRef;
                    const binding = await bindMaterialAssetToRenderer(_self, uuid, r.node, rendererInfo.renderer, rendererInfo.resolvedCompName, slotIndex, builtinRef.uuid);
                    if (!isSuccessfulResult(binding))
                        return binding;
                    return {
                        success: true,
                        uuid,
                        name: r.node.name,
                        component: rendererInfo.resolvedCompName,
                        effectName,
                        materialIndex: slotIndex,
                        materialUuid: builtinRef.uuid,
                        materialUrl: builtinRef.url,
                        bindingProperty: binding?.bindingProperty ?? `sharedMaterials.${slotIndex}`,
                        _materialResolveSource: builtinRef.source,
                        _inspectorRefreshed: true,
                    };
                })();
            }],
        // ─── P0: create_light — create a light node ──────────────────────────
        ['create_light', (_self, scene, p) => {
                const cc = getCC();
                const { js } = cc;
                const lightType = String(p.lightType ?? 'directional').toLowerCase();
                const LIGHT_MAP = {
                    directional: 'DirectionalLight', spot: 'SpotLight', sphere: 'SphereLight', point: 'SphereLight',
                };
                const compName = LIGHT_MAP[lightType];
                if (!compName)
                    return { error: `不支持的灯光类型: ${lightType}，可用: directional, spot, sphere, point` };
                const cls = js.getClassByName(compName) || js.getClassByName('cc.' + compName);
                if (!cls)
                    return { error: `当前 Cocos 版本不支持 ${compName} 组件` };
                const name = String(p.name ?? compName);
                const parentRef = String(p.parentUuid ?? '');
                let parentUuid = '';
                if (parentRef) {
                    const pr = requireNode(scene, parentRef);
                    if ('error' in pr)
                        return pr;
                    parentUuid = String(pr.node.uuid ?? pr.node._id ?? '');
                }
                else {
                    parentUuid = String(scene.uuid ?? scene._id ?? '');
                }
                if (!parentUuid)
                    return { error: '无法解析父节点 UUID' };
                const propMap = {
                    directional: ['illuminance', 'useColorTemperature', 'colorTemperature', 'shadowEnabled', 'shadowPcf', 'shadowBias', 'shadowNormalBias', 'shadowSaturation', 'shadowDistance'],
                    spot: ['luminance', 'range', 'spotAngle', 'size', 'useColorTemperature', 'colorTemperature', 'shadowEnabled', 'shadowPcf', 'shadowBias', 'shadowNormalBias'],
                    sphere: ['luminance', 'range', 'size', 'useColorTemperature', 'colorTemperature', 'shadowEnabled', 'shadowPcf', 'shadowBias', 'shadowNormalBias'],
                    point: ['luminance', 'range', 'size', 'useColorTemperature', 'colorTemperature', 'shadowEnabled'],
                };
                return (async () => {
                    try {
                        const nodeUuid = await ipcCreateNode(parentUuid, name);
                        await ipcCreateComponent(nodeUuid, compName);
                        const r = requireNode(scene, nodeUuid);
                        if ('error' in r) {
                            return { error: r.error, uuid: nodeUuid, partial: true };
                        }
                        const comp = r.node.getComponent?.(cls);
                        if (!comp) {
                            return { error: `create-component 后未找到 ${compName}`, uuid: nodeUuid, partial: true };
                        }
                        const changed = {};
                        for (const prop of (propMap[lightType] || [])) {
                            if (p[prop] !== undefined) {
                                changed[prop] = typeof p[prop] === 'boolean' ? p[prop] : Number(p[prop]);
                            }
                        }
                        if (p.color && typeof p.color === 'object') {
                            const cv = p.color;
                            changed.color = {
                                r: Math.max(0, Math.min(255, Number(cv.r ?? 255))),
                                g: Math.max(0, Math.min(255, Number(cv.g ?? 255))),
                                b: Math.max(0, Math.min(255, Number(cv.b ?? 255))),
                                a: Math.max(0, Math.min(255, Number(cv.a ?? 255))),
                            };
                        }
                        const result = { success: true, uuid: nodeUuid, name, lightType: compName, changed, _viaEditorIPC: true };
                        let okAll = true;
                        for (const prop of Object.keys(changed)) {
                            const val = changed[prop];
                            if (prop === 'color' && val && typeof val === 'object') {
                                const c = val;
                                const ok = await deps.notifyEditorComponentProperty(nodeUuid, r.node, comp, prop, {
                                    type: 'cc.Color', value: { r: c.r, g: c.g, b: c.b, a: c.a },
                                });
                                okAll = okAll && ok;
                            }
                            else if (typeof val === 'number' || typeof val === 'boolean') {
                                const ok = await deps.notifyEditorComponentProperty(nodeUuid, r.node, comp, prop, {
                                    type: typeof val === 'boolean' ? 'boolean' : 'number', value: val,
                                });
                                okAll = okAll && ok;
                            }
                        }
                        const hasPos = p.x !== undefined || p.y !== undefined || p.z !== undefined;
                        if (hasPos) {
                            const lp = worldPointToLocalPosition(r.node, Number(p.x ?? 0), Number(p.y ?? 10), Number(p.z ?? 0), getCC);
                            const ok = await deps.notifyEditorProperty(nodeUuid, 'position', {
                                type: 'cc.Vec3',
                                value: { x: lp.x, y: lp.y, z: lp.z },
                            });
                            okAll = okAll && ok;
                        }
                        if (p.rotationX !== undefined || p.rotationY !== undefined || p.rotationZ !== undefined) {
                            const ok = await deps.notifyEditorProperty(nodeUuid, 'rotation', {
                                type: 'cc.Vec3',
                                value: {
                                    x: Number(p.rotationX ?? 0),
                                    y: Number(p.rotationY ?? 0),
                                    z: Number(p.rotationZ ?? 0),
                                },
                            });
                            okAll = okAll && ok;
                        }
                        const okA = await deps.notifyEditorProperty(nodeUuid, 'active', { type: 'boolean', value: true });
                        okAll = okAll && okA;
                        if (okAll) {
                            result._inspectorRefreshed = true;
                        }
                        else {
                            result.success = false;
                            result.error = '部分 Light / 节点属性 set-property 失败';
                        }
                        return result;
                    }
                    catch (e) {
                        return { error: e instanceof Error ? e.message : String(e) };
                    }
                })();
            }],
        // ─── P0: set_light_property — modify light component properties ──────
        ['set_light_property', (_self, scene, p) => {
                const cc = getCC();
                const { js } = cc;
                const uuid = String(p.uuid ?? '');
                if (!uuid)
                    return { error: '缺少 uuid 参数' };
                const r = requireNode(scene, uuid);
                if ('error' in r)
                    return r;
                // Find light component on node
                const LIGHT_NAMES = ['DirectionalLight', 'SpotLight', 'SphereLight'];
                let lightComp = null;
                let lightType = '';
                for (const ln of LIGHT_NAMES) {
                    const cls = js.getClassByName(ln) || js.getClassByName('cc.' + ln);
                    if (!cls)
                        continue;
                    const comp = r.node.getComponent?.(cls);
                    if (comp) {
                        lightComp = comp;
                        lightType = ln;
                        break;
                    }
                }
                if (!lightComp)
                    return { error: `节点 ${r.node.name} 上没有灯光组件 (DirectionalLight/SpotLight/SphereLight)` };
                const changed = {};
                const allProps = ['illuminance', 'luminance', 'luminanceHDR', 'range', 'spotAngle', 'size',
                    'useColorTemperature', 'colorTemperature', 'shadowEnabled', 'shadowPcf', 'shadowBias',
                    'shadowNormalBias', 'shadowSaturation', 'shadowDistance', 'shadowInvisibleOcclusionRange', 'shadowFixedArea'];
                for (const prop of allProps) {
                    if (p[prop] !== undefined) {
                        changed[prop] = typeof p[prop] === 'boolean' ? p[prop] : Number(p[prop]);
                    }
                }
                if (p.color && typeof p.color === 'object') {
                    const cv = p.color;
                    changed.color = {
                        r: Math.max(0, Math.min(255, Number(cv.r ?? 255))),
                        g: Math.max(0, Math.min(255, Number(cv.g ?? 255))),
                        b: Math.max(0, Math.min(255, Number(cv.b ?? 255))),
                        a: Math.max(0, Math.min(255, Number(cv.a ?? 255))),
                    };
                }
                if (Object.keys(changed).length === 0)
                    return { error: '未指定任何要修改的灯光属性' };
                const result = { success: true, uuid, name: r.node.name, lightType, changed, _viaEditorIPC: true };
                return (async () => {
                    let okAll = true;
                    for (const prop of Object.keys(changed)) {
                        const val = changed[prop];
                        if (prop === 'color' && val && typeof val === 'object') {
                            const c = val;
                            const ok = await deps.notifyEditorComponentProperty(uuid, r.node, lightComp, prop, {
                                type: 'cc.Color', value: { r: c.r, g: c.g, b: c.b, a: c.a },
                            });
                            okAll = okAll && ok;
                        }
                        else if (typeof val === 'number' || typeof val === 'boolean') {
                            const ok = await deps.notifyEditorComponentProperty(uuid, r.node, lightComp, prop, {
                                type: typeof val === 'boolean' ? 'boolean' : 'number', value: val,
                            });
                            okAll = okAll && ok;
                        }
                    }
                    if (okAll) {
                        result._inspectorRefreshed = true;
                    }
                    else {
                        result.success = false;
                        result.error = '部分 Light 属性 set-property 失败';
                    }
                    return result;
                })();
            }],
        // ─── P0: set_scene_environment — modify ambient/shadows/fog/skybox ───
        ['set_scene_environment', (_self, scene, p) => {
                const globals = scene.globals;
                if (!globals)
                    return { error: '场景没有 globals 属性' };
                const subsystem = String(p.subsystem ?? '');
                // Preset mode
                if (p.envPreset || p.preset) {
                    const preset = String(p.envPreset ?? p.preset);
                    const PRESETS = {
                        outdoor_day: {
                            ambient: { skyIllum: 20000 },
                            shadows: { enabled: true, type: 1 },
                            fog: { enabled: false },
                        },
                        outdoor_sunset: {
                            ambient: { skyIllum: 12000 },
                            shadows: { enabled: true, type: 1 },
                            fog: { enabled: true, fogDensity: 0.002, type: 1 },
                        },
                        night: {
                            ambient: { skyIllum: 500 },
                            shadows: { enabled: false },
                            fog: { enabled: true, fogDensity: 0.01, type: 2 },
                        },
                        indoor: {
                            ambient: { skyIllum: 5000 },
                            shadows: { enabled: true, type: 1 },
                            fog: { enabled: false },
                        },
                        foggy: {
                            ambient: { skyIllum: 8000 },
                            shadows: { enabled: true, type: 1 },
                            fog: { enabled: true, fogDensity: 0.05, type: 2, fogStart: 1, fogEnd: 50 },
                        },
                    };
                    const presetData = PRESETS[preset];
                    if (!presetData)
                        return { error: `未知预设: ${preset}，可用: ${Object.keys(PRESETS).join(', ')}` };
                    return {
                        error: '当前版本未实现 scene.globals 的稳定场景持久化，已阻止仅运行时修改。',
                        unsupportedPersistence: true,
                        preset,
                        requested: presetData,
                        note: 'scene.globals 需要走场景资产级写回；当前实现若直接改运行时会与保存/重启结果不一致。',
                    };
                }
                if (!subsystem)
                    return { error: '缺少 subsystem 参数（ambient/shadows/fog/skybox）或 preset 参数' };
                const changed = {};
                const clampColor = (val) => ({
                    r: Math.max(0, Math.min(255, Number(val?.r ?? 0))),
                    g: Math.max(0, Math.min(255, Number(val?.g ?? 0))),
                    b: Math.max(0, Math.min(255, Number(val?.b ?? 0))),
                    a: Math.max(0, Math.min(255, Number(val?.a ?? 255))),
                });
                if (subsystem === 'ambient') {
                    const ambient = globals.ambient;
                    if (!ambient)
                        return { error: 'globals.ambient 不存在' };
                    if (p.skyIllum !== undefined) {
                        changed.skyIllum = Number(p.skyIllum);
                    }
                    if (p.skyLightIntensity !== undefined) {
                        changed.skyLightIntensity = Number(p.skyLightIntensity);
                    }
                    if (p.mipmapLevel !== undefined) {
                        changed.mipmapLevel = Number(p.mipmapLevel);
                    }
                    if (p.skyColor && typeof p.skyColor === 'object')
                        changed.skyColor = clampColor(p.skyColor);
                    if (p.groundAlbedo && typeof p.groundAlbedo === 'object')
                        changed.groundAlbedo = clampColor(p.groundAlbedo);
                }
                else if (subsystem === 'shadows') {
                    const shadows = globals.shadows;
                    if (!shadows)
                        return { error: 'globals.shadows 不存在' };
                    const numProps = ['enabled', 'type', 'distance', 'planeBias', 'maxReceived', 'size', 'autoAdapt'];
                    for (const prop of numProps) {
                        if (p[prop] !== undefined) {
                            changed[prop] = typeof p[prop] === 'boolean' ? p[prop] : Number(p[prop]);
                        }
                    }
                    if (p.shadowColor && typeof p.shadowColor === 'object')
                        changed.shadowColor = clampColor(p.shadowColor);
                    if (p.normal && typeof p.normal === 'object') {
                        const nv = p.normal;
                        changed.normal = {
                            x: Number(nv.x ?? 0),
                            y: Number(nv.y ?? 1),
                            z: Number(nv.z ?? 0),
                        };
                    }
                }
                else if (subsystem === 'fog') {
                    const fog = globals.fog;
                    if (!fog)
                        return { error: 'globals.fog 不存在' };
                    const fogProps = ['enabled', 'accurate', 'type', 'fogDensity', 'fogStart', 'fogEnd', 'fogAtten', 'fogTop', 'fogRange'];
                    for (const prop of fogProps) {
                        if (p[prop] !== undefined) {
                            changed[prop] = typeof p[prop] === 'boolean' ? p[prop] : Number(p[prop]);
                        }
                    }
                    if (p.fogColor && typeof p.fogColor === 'object')
                        changed.fogColor = clampColor(p.fogColor);
                }
                else if (subsystem === 'skybox') {
                    const skybox = globals.skybox;
                    if (!skybox)
                        return { error: 'globals.skybox 不存在' };
                    const skyProps = ['enabled', 'useIBL', 'useHDR', 'isRGBE', 'rotationAngle'];
                    for (const prop of skyProps) {
                        if (p[prop] !== undefined) {
                            changed[prop] = typeof p[prop] === 'boolean' ? p[prop] : Number(p[prop]);
                        }
                    }
                }
                else {
                    return { error: `未知的 subsystem: ${subsystem}，可用: ambient, shadows, fog, skybox` };
                }
                if (Object.keys(changed).length === 0)
                    return { error: `未指定任何要修改的 ${subsystem} 属性` };
                return {
                    error: '当前版本未实现 scene.globals 的稳定场景持久化，已阻止仅运行时修改。',
                    unsupportedPersistence: true,
                    subsystem,
                    requested: changed,
                    note: 'scene.globals 需要走场景资产级写回；当前实现若直接改运行时会与保存/重启结果不一致。',
                };
            }],
        // ─── P1: set_material_define — set shader compile macros ─────────────
        ['set_material_define', (_self, scene, p) => {
                const uuid = String(p.uuid ?? '');
                if (!uuid)
                    return { error: '缺少 uuid 参数' };
                const r = requireNode(scene, uuid);
                if ('error' in r)
                    return r;
                const slotIndex = Number(p.materialIndex ?? 0);
                const defines = p.defines;
                if (!defines || typeof defines !== 'object')
                    return { error: '缺少 defines 参数（如 {"USE_ALBEDO_MAP": true}）' };
                const compName = String(p.component ?? '');
                const rendererInfo = findRendererOnNode(r.node, compName);
                if (!rendererInfo)
                    return { error: `节点 ${r.node.name} 上未找到渲染器组件` };
                return (async () => {
                    const currentBinding = await resolveRendererSlotMaterialBinding(rendererInfo.renderer, slotIndex);
                    if (currentBinding?.error)
                        return currentBinding;
                    const currentTechnique = Number(currentBinding?.material?.technique ?? currentBinding?.material?._techIdx ?? 0);
                    const currentTechniqueCount = await getTechniqueCountFromBinding(currentBinding);
                    if (currentTechniqueCount > 0 && (techniqueIndex < 0 || techniqueIndex >= currentTechniqueCount)) {
                        return {
                            error: `Technique ${techniqueIndex} 超出当前材质可用范围`,
                            materialUrl: currentBinding?.url ?? null,
                            materialUuid: currentBinding?.uuid ?? null,
                            currentTechnique,
                            techniqueCount: currentTechniqueCount,
                            validRange: `0-${Math.max(0, currentTechniqueCount - 1)}`,
                        };
                    }
                    const target = await resolvePersistableMaterialTarget(_self, uuid, r.node, rendererInfo.renderer, rendererInfo.resolvedCompName, slotIndex, {
                        savePath: p.savePath,
                        baseName: `${r.node.name}-${rendererInfo.resolvedCompName || 'Material'}-${slotIndex}`,
                    });
                    if (target?.error)
                        return target;
                    const asset = await readMaterialAssetJson(target.materialUrl);
                    if (asset?.error)
                        return asset;
                    const json = deepCloneJson(asset.json);
                    const techIdx = Number(json._techIdx ?? 0);
                    if (!Array.isArray(json._defines))
                        json._defines = [];
                    while (json._defines.length <= techIdx)
                        json._defines.push({});
                    for (const [defName, defVal] of Object.entries(defines)) {
                        json._defines[techIdx][defName] = defVal;
                    }
                    const ok = await writeMaterialAssetJson(target.materialUrl, json);
                    if (!ok)
                        return { error: `保存材质 defines 失败: ${target.materialUrl}` };
                    const binding = await bindMaterialAssetToRenderer(_self, uuid, r.node, rendererInfo.renderer, rendererInfo.resolvedCompName, slotIndex, target.materialUuid, {
                        materialJson: json,
                    });
                    if (!isSuccessfulResult(binding))
                        return binding;
                    return {
                        success: true,
                        uuid,
                        name: r.node.name,
                        materialIndex: slotIndex,
                        materialUrl: target.materialUrl,
                        materialUuid: target.materialUuid,
                        changed: defines,
                        ...(target.cloned ? { clonedToPersist: true, clonedFromUrl: target.clonedFromUrl, clonedFromUuid: target.clonedFromUuid } : {}),
                        _inspectorRefreshed: true,
                    };
                })();
            }],
        // ─── P1: assign_project_material — assign custom .mtl by db:// url ──
        ['assign_project_material', (_self, scene, p) => {
                const uuid = String(p.uuid ?? '');
                if (!uuid)
                    return { error: '缺少 uuid 参数' };
                const materialUrl = String(p.materialUrl ?? p.materialUuid ?? '');
                if (!materialUrl)
                    return { error: '缺少 materialUrl 参数（db://assets/... 或材质 uuid）' };
                const r = requireNode(scene, uuid);
                if ('error' in r)
                    return r;
                const slotIndex = Number(p.materialIndex ?? 0);
                const compName = String(p.component ?? '');
                const rendererInfo = findRendererOnNode(r.node, compName);
                if (!rendererInfo)
                    return { error: `节点 ${r.node.name} 上未找到渲染器组件` };
                return (async () => {
                    const materialRef = await resolveMaterialAssetRef(materialUrl);
                    if (materialRef?.error)
                        return materialRef;
                    const binding = await bindMaterialAssetToRenderer(_self, uuid, r.node, rendererInfo.renderer, rendererInfo.resolvedCompName, slotIndex, materialRef.uuid);
                    if (!isSuccessfulResult(binding))
                        return binding;
                    return {
                        success: true,
                        uuid,
                        name: r.node.name,
                        component: rendererInfo.resolvedCompName,
                        materialUrl: materialRef.url,
                        materialUuid: materialRef.uuid,
                        materialIndex: slotIndex,
                        bindingProperty: binding?.bindingProperty ?? `sharedMaterials.${slotIndex}`,
                        _materialResolveSource: materialRef.source,
                        _inspectorRefreshed: true,
                    };
                })();
            }],
        // ─── P2: clone_material — clone material to independent instance ─────
        ['clone_material', (_self, scene, p) => {
                const uuid = String(p.uuid ?? '');
                if (!uuid)
                    return { error: '缺少 uuid 参数' };
                const r = requireNode(scene, uuid);
                if ('error' in r)
                    return r;
                const slotIndex = Number(p.materialIndex ?? 0);
                const compName = String(p.component ?? '');
                const rendererInfo = findRendererOnNode(r.node, compName);
                if (!rendererInfo)
                    return { error: `节点 ${r.node.name} 上未找到渲染器组件` };
                return (async () => {
                    const clone = await cloneMaterialAssetForRenderer(_self, uuid, r.node, rendererInfo.renderer, rendererInfo.resolvedCompName, slotIndex, {
                        savePath: p.savePath,
                        baseName: `${r.node.name}-${rendererInfo.resolvedCompName || 'Material'}-${slotIndex}`,
                    });
                    if (clone?.error)
                        return clone;
                    const asset = await readMaterialAssetJson(clone.materialUrl);
                    const effectUuid = String(asset?.json?._effectAsset?.__uuid__ ?? '');
                    return {
                        success: true,
                        uuid,
                        name: r.node.name,
                        materialIndex: slotIndex,
                        materialUrl: clone.materialUrl,
                        materialUuid: clone.materialUuid,
                        ...(clone.clonedFromUrl ? { clonedFromUrl: clone.clonedFromUrl, clonedFromUuid: clone.clonedFromUuid } : {}),
                        ...(effectUuid ? { effectUuid } : {}),
                        bindingProperty: clone.bindingProperty,
                        message: '材质已克隆为项目资源并重新绑定到节点',
                        _inspectorRefreshed: true,
                    };
                })();
            }],
        // ─── P2: swap_technique — switch material technique index ────────────
        ['swap_technique', (_self, scene, p) => {
                const uuid = String(p.uuid ?? '');
                if (!uuid)
                    return { error: '缺少 uuid 参数' };
                const techniqueIndex = Number(p.technique ?? p.techniqueIndex ?? 0);
                const r = requireNode(scene, uuid);
                if ('error' in r)
                    return r;
                const slotIndex = Number(p.materialIndex ?? 0);
                const compName = String(p.component ?? '');
                const rendererInfo = findRendererOnNode(r.node, compName);
                if (!rendererInfo)
                    return { error: `节点 ${r.node.name} 上未找到渲染器组件` };
                return (async () => {
                    const target = await resolvePersistableMaterialTarget(_self, uuid, r.node, rendererInfo.renderer, rendererInfo.resolvedCompName, slotIndex, {
                        savePath: p.savePath,
                        baseName: `${r.node.name}-${rendererInfo.resolvedCompName || 'Material'}-${slotIndex}`,
                    });
                    if (target?.error)
                        return target;
                    const asset = await readMaterialAssetJson(target.materialUrl);
                    if (asset?.error)
                        return asset;
                    const json = deepCloneJson(asset.json);
                    const oldTechnique = Number(json._techIdx ?? 0);
                    const techniqueCount = await getMaterialTechniqueCount(json);
                    if (techniqueCount > 0 && (techniqueIndex < 0 || techniqueIndex >= techniqueCount)) {
                        return {
                            error: `Technique ${techniqueIndex} 超出当前材质可用范围`,
                            materialUrl: target.materialUrl,
                            materialUuid: target.materialUuid,
                            currentTechnique: oldTechnique,
                            techniqueCount,
                            validRange: `0-${Math.max(0, techniqueCount - 1)}`,
                        };
                    }
                    json._techIdx = techniqueIndex;
                    if (!Array.isArray(json._props))
                        json._props = [];
                    while (json._props.length <= techniqueIndex)
                        json._props.push({});
                    if (!Array.isArray(json._defines))
                        json._defines = [];
                    while (json._defines.length <= techniqueIndex)
                        json._defines.push({});
                    const ok = await writeMaterialAssetJson(target.materialUrl, json);
                    if (!ok)
                        return { error: `保存材质 technique 失败: ${target.materialUrl}` };
                    const binding = await bindMaterialAssetToRenderer(_self, uuid, r.node, rendererInfo.renderer, rendererInfo.resolvedCompName, slotIndex, target.materialUuid, {
                        materialJson: json,
                    });
                    if (!isSuccessfulResult(binding))
                        return binding;
                    return {
                        success: true,
                        uuid,
                        name: r.node.name,
                        materialIndex: slotIndex,
                        oldTechnique,
                        newTechnique: techniqueIndex,
                        materialUrl: target.materialUrl,
                        materialUuid: target.materialUuid,
                        ...(target.cloned ? { clonedToPersist: true, clonedFromUrl: target.clonedFromUrl, clonedFromUuid: target.clonedFromUuid } : {}),
                        _inspectorRefreshed: true,
                    };
                })();
            }],
        // ─── P2: sprite_grayscale — toggle grayscale material on Sprite ──────
        ['sprite_grayscale', (_self, scene, p) => {
                const { js } = getCC();
                const uuid = String(p.uuid ?? '');
                if (!uuid)
                    return { error: '缺少 uuid 参数' };
                const r = requireNode(scene, uuid);
                if ('error' in r)
                    return r;
                const enable = p.enable !== false; // default true
                const SpriteClass = js.getClassByName('Sprite') || js.getClassByName('cc.Sprite');
                if (!SpriteClass)
                    return { error: 'Sprite 组件类不可用' };
                const sprite = r.node.getComponent?.(SpriteClass);
                if (!sprite)
                    return { error: `节点 ${r.node.name} 上没有 Sprite 组件` };
                const spriteCompName = sprite.constructor?.name ?? sprite.__classname__ ?? 'Sprite';
                const customMaterialPath = getComponentPropertyPath(r.node, sprite, 'customMaterial');
                const notifySprite = async (res, prop, val) => {
                    const dumpType = typeof val === 'boolean' ? 'boolean' : 'object';
                    await deps.notifyEditorComponentProperty(uuid, r.node, sprite, prop, { type: dumpType, value: val });
                    res._inspectorRefreshed = true;
                    return res;
                };
                if (enable) {
                    if ('grayscale' in sprite) {
                        return notifySprite({ success: true, uuid, name: r.node.name, grayscale: true, method: 'grayscale_property', _viaEditorIPC: true }, 'grayscale', true);
                    }
                    return (async () => {
                        const grayRef = await resolveMaterialAssetRef(BUILTIN_MATERIAL_URLS['ui-sprite-gray']);
                        if (grayRef?.error)
                            return { error: `无法启用灰度：Sprite 没有 grayscale 属性，且灰度材质不可用 (${grayRef.error})` };
                        const binding = await Promise.resolve(_self.setComponentProperty(uuid, spriteCompName, 'customMaterial', { __uuid__: grayRef.uuid }));
                        if (!isSuccessfulResult(binding))
                            return { error: getFailureReason(binding, 'Sprite 灰度材质绑定失败') };
                        return {
                            success: true,
                            uuid,
                            name: r.node.name,
                            grayscale: true,
                            method: 'custom_material_asset',
                            materialUuid: grayRef.uuid,
                            materialUrl: grayRef.url,
                            _inspectorRefreshed: true,
                        };
                    })();
                }
                else {
                    if ('grayscale' in sprite) {
                        return notifySprite({ success: true, uuid, name: r.node.name, grayscale: false, method: 'grayscale_property', _viaEditorIPC: true }, 'grayscale', false);
                    }
                    return (async () => {
                        if (!customMaterialPath)
                            return { error: '无法定位 Sprite.customMaterial 属性路径' };
                        const ok = await ipcResetProperty(uuid, customMaterialPath);
                        if (!ok)
                            return { error: '重置 Sprite.customMaterial 失败' };
                        return {
                            success: true,
                            uuid,
                            name: r.node.name,
                            grayscale: false,
                            method: 'reset_custom_material',
                            _inspectorRefreshed: true,
                        };
                    })();
                }
            }],
        // ─── P2: camera_screenshot — capture camera view via RenderTexture ───
        ['camera_screenshot', (_self, scene, p) => {
                const cc = getCC();
                const { Camera } = cc;
                const uuid = String(p.uuid ?? '');
                // Find camera
                let camComp = null;
                let camNode = null;
                const walkCam = (n) => {
                    if (camComp)
                        return;
                    const cam = n.getComponent?.(Camera);
                    if (cam) {
                        const nodeUuid = n.uuid || n._id;
                        if (!uuid || nodeUuid === uuid) {
                            camComp = cam;
                            camNode = n;
                            return;
                        }
                    }
                    for (const child of n.children || [])
                        walkCam(child);
                };
                walkCam(scene);
                if (!camComp || !camNode)
                    return { error: '未找到 Camera 组件' };
                const camRef = camComp;
                const camNodeRef = camNode;
                // Check if RenderTexture is available
                const RenderTexture = cc.RenderTexture;
                if (!RenderTexture)
                    return { error: '当前 Cocos 版本不支持 RenderTexture' };
                const width = Number(p.width ?? 512);
                const height = Number(p.height ?? 512);
                try {
                    const rt = new RenderTexture();
                    if (typeof rt.initialize === 'function') {
                        rt.initialize({ width, height });
                    }
                    else if (typeof rt.reset === 'function') {
                        rt.reset({ width, height });
                    }
                    const hadTarget = !!camRef.targetTexture;
                    camRef.targetTexture = rt;
                    // Read pixels
                    let pixelData = null;
                    if (typeof rt.readPixels === 'function') {
                        const buffer = new Uint8Array(width * height * 4);
                        rt.readPixels(0, 0, width, height, buffer);
                        // Return first few pixels as sample (full data too large for JSON)
                        const sampleSize = Math.min(buffer.length, 64);
                        pixelData = Array.from(buffer.slice(0, sampleSize)).join(',');
                    }
                    // Restore original target
                    if (!hadTarget)
                        camRef.targetTexture = null;
                    return {
                        success: true,
                        uuid: camNodeRef.uuid || camNodeRef._id,
                        name: camNodeRef.name,
                        width, height,
                        pixelSample: pixelData,
                        message: `RenderTexture ${width}x${height} 已捕获。像素数据过大无法完整返回 JSON，建议通过引擎脚本保存为文件。`,
                    };
                }
                catch (err) {
                    return { error: `截图失败: ${err instanceof Error ? err.message : String(err)}` };
                }
            }],
        // ── Script binding operations ───────────────────────────────────────────
        ['set_component_properties', (self, scene, p) => {
                const cc = getCC();
                const { js } = cc;
                const uuid = String(p.uuid ?? '');
                if (!uuid)
                    return { error: '缺少 uuid 参数' };
                const r = requireNode(scene, uuid);
                if ('error' in r)
                    return r;
                const compName = String(p.component ?? p.script ?? '');
                if (!compName)
                    return { error: '缺少 component/script 参数（组件类名）' };
                const compClass = js.getClassByName(compName) || js.getClassByName('cc.' + compName);
                if (!compClass)
                    return { error: `未找到组件类: ${compName}` };
                const comp = r.node.getComponent?.(compClass);
                if (!comp)
                    return { error: `节点 ${r.node.name} 上没有组件: ${compName}` };
                const props = p.properties;
                if (!props || typeof props !== 'object' || Object.keys(props).length === 0) {
                    return { error: '缺少 properties 参数（要设置的属性键值对）' };
                }
                return (async () => {
                    const { changed, errors, unsupportedPersistence } = await applySerializableComponentProperties(self, uuid, r.node, compName, comp, props);
                    const result = {
                        success: Object.keys(changed).length > 0 && errors.length === 0 && unsupportedPersistence.length === 0,
                        uuid,
                        name: r.node.name,
                        component: compName,
                        changed,
                        ...(errors.length ? { errors } : {}),
                        ...(unsupportedPersistence.length ? { unsupportedPersistence, _note: 'unsupportedPersistence 中的键未写入，避免产生仅运行时成功的假象' } : {}),
                    };
                    if (Object.keys(changed).length > 0 && errors.length === 0 && unsupportedPersistence.length === 0) {
                        result._inspectorRefreshed = true;
                    }
                    return result;
                })();
            }],
        ['attach_script', (self, scene, p) => {
                const cc = getCC();
                const { js } = cc;
                const uuid = String(p.uuid ?? '');
                if (!uuid)
                    return { error: '缺少 uuid 参数（目标节点 UUID）' };
                const scriptName = String(p.script ?? p.component ?? '');
                if (!scriptName)
                    return { error: '缺少 script 参数（脚本类名，如 "PlayerController"）' };
                const r = requireNode(scene, uuid);
                if ('error' in r)
                    return r;
                const cls = resolveRegisteredClass(cc, scriptName);
                if (!cls) {
                    return {
                        error: `脚本类 "${scriptName}" 未注册`,
                        hint: '可能原因: 1) 脚本尚未编译完成，请稍后重试; 2) 类名不正确; 3) 脚本文件不存在。可用 check_script_ready 查询编译状态。',
                    };
                }
                if (!isComponentSubclass(cc, cls)) {
                    return buildNonComponentClassError(cc, scriptName, '脚本类');
                }
                const existing = r.node.getComponent?.(cls);
                if (existing && !p.allowDuplicate) {
                    return {
                        success: true, uuid, name: r.node.name, script: scriptName,
                        alreadyAttached: true,
                        message: `脚本 ${scriptName} 已挂载在节点上，跳过重复添加。如需添加多个实例，请传 allowDuplicate=true。`,
                    };
                }
                const addResult = self.addComponent(uuid, scriptName);
                return (async () => {
                    const baseResult = await Promise.resolve(addResult);
                    if (!isSuccessfulResult(baseResult))
                        return { error: getFailureReason(baseResult, `添加脚本组件 ${scriptName} 失败`), _addComponentResult: baseResult };
                    const r2 = requireNode(scene, uuid);
                    if ('error' in r2)
                        return { error: r2.error, _addComponentResult: baseResult };
                    const comp = r2.node.getComponent?.(cls);
                    if (!comp)
                        return { error: `添加脚本组件 ${scriptName} 失败`, _addComponentResult: baseResult };
                    const props = p.properties;
                    const { changed, errors: propErrors, unsupportedPersistence } =
                        props && typeof props === 'object'
                            ? await applySerializableComponentProperties(self, uuid, r2.node, scriptName, comp, props)
                            : { changed: {}, errors: [], unsupportedPersistence: [] };
                    const result = {
                        success: propErrors.length === 0 && unsupportedPersistence.length === 0,
                        uuid,
                        name: r2.node.name,
                        script: scriptName,
                        _addComponentResult: baseResult,
                        ...(Object.keys(changed).length > 0 ? { propertiesSet: changed } : {}),
                        ...(propErrors.length ? { propertyErrors: propErrors } : {}),
                        ...(unsupportedPersistence.length ? { unsupportedPersistence, _note: 'unsupportedPersistence 中的键未写入，避免仅运行时成功' } : {}),
                    };
                    if (Object.keys(changed).length > 0 && propErrors.length === 0 && unsupportedPersistence.length === 0) {
                        result._inspectorRefreshed = true;
                    }
                    return result;
                })();
            }],
        ['detach_script', (self, _scene, p) => {
                const uuid = String(p.uuid ?? '');
                if (!uuid)
                    return { error: '缺少 uuid 参数' };
                const scriptName = String(p.script ?? p.component ?? '');
                if (!scriptName)
                    return { error: '缺少 script 参数（脚本类名）' };
                return self.removeComponent(uuid, scriptName);
            }],
    ]);
    return handlers;
}
