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
        ['add_component', (self, _s, p) => self.addComponent(String(p.uuid ?? ''), String(p.component ?? ''))],
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
                const createRes = self.createChildNode(parentUuid, name);
                if (createRes && typeof createRes === 'object' && 'error' in createRes)
                    return createRes;
                const nodeUuid = createRes?.uuid;
                if (!nodeUuid)
                    return { error: 'createChildNode 未返回 uuid' };
                const addRes = self.addComponent(nodeUuid, 'MeshRenderer');
                if (addRes && typeof addRes === 'object' && 'error' in addRes)
                    return addRes;
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
                return (async () => {
                    await Promise.resolve(createRes);
                    await Promise.resolve(addRes);
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
                            if (res && typeof res === 'object' && 'error' in res)
                                throw new Error(String(res.error));
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
                        if (addRes && typeof addRes === 'object' && 'error' in addRes)
                            return addRes;
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
                const warnings = [];
                // Try PhysicsSystem2D
                const PS2D = js.getClassByName('PhysicsSystem2D') || js.getClassByName('cc.PhysicsSystem2D');
                const PS3D = js.getClassByName('PhysicsSystem') || js.getClassByName('cc.PhysicsSystem');
                const mode = String(p.mode ?? 'auto');
                const applied = {};
                if ((mode === '2d' || mode === 'auto') && PS2D) {
                    try {
                        const inst = PS2D.instance;
                        if (inst) {
                            if (p.gravity) {
                                const g = p.gravity;
                                inst.gravity = { x: g.x ?? 0, y: g.y ?? -320 };
                                applied.gravity2D = inst.gravity;
                            }
                            if (p.allowSleep !== undefined) {
                                inst.allowSleep = Boolean(p.allowSleep);
                                applied.allowSleep2D = inst.allowSleep;
                            }
                            if (p.fixedTimeStep !== undefined) {
                                inst.fixedTimeStep = Number(p.fixedTimeStep);
                                applied.fixedTimeStep2D = inst.fixedTimeStep;
                            }
                            applied.physics2D = true;
                        }
                        else {
                            warnings.push('PhysicsSystem2D.instance 不可用');
                        }
                    }
                    catch (e) {
                        logIgnored(ErrorCategory.ENGINE_API, 'PhysicsSystem2D 配置失败', e);
                        warnings.push('PhysicsSystem2D 配置失败');
                    }
                }
                if ((mode === '3d' || mode === 'auto') && PS3D) {
                    try {
                        const inst = PS3D.instance;
                        if (inst) {
                            if (p.gravity) {
                                const g = p.gravity;
                                const Vec3 = cc.Vec3;
                                inst.gravity = new Vec3(g.x ?? 0, g.y ?? -10, g.z ?? 0);
                                applied.gravity3D = p.gravity;
                            }
                            if (p.allowSleep !== undefined) {
                                inst.allowSleep = Boolean(p.allowSleep);
                                applied.allowSleep3D = inst.allowSleep;
                            }
                            if (p.fixedTimeStep !== undefined) {
                                inst.fixedTimeStep = Number(p.fixedTimeStep);
                                applied.fixedTimeStep3D = inst.fixedTimeStep;
                            }
                            applied.physics3D = true;
                        }
                        else {
                            warnings.push('PhysicsSystem.instance 不可用');
                        }
                    }
                    catch (e) {
                        logIgnored(ErrorCategory.ENGINE_API, 'PhysicsSystem 配置失败', e);
                        warnings.push('PhysicsSystem 配置失败');
                    }
                }
                if (!applied.physics2D && !applied.physics3D)
                    return { error: '物理系统不可用（2D 和 3D 均未找到）', warnings };
                return { success: true, ...applied, _runtimeOnly: true, _note: '直接修改 PhysicsSystem.instance，非场景序列化数据', ...(warnings.length ? { warnings } : {}) };
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
                        if (p.tmxAsset !== undefined && p.tmxAsset !== null) {
                            const sp = await Promise.resolve(self.setComponentProperty(nodeUuid, 'TiledMap', 'tmxAsset', p.tmxAsset));
                            tmxOk = !!(sp && typeof sp === 'object' && !('error' in sp && sp.error));
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
                            result.error = 'tmxAsset 或 active 写入失败';
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
        ['batch_set_property', (self, scene, p) => {
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
                const results = [];
                let successCount = 0;
                for (const uuid of uuids) {
                    try {
                        const res = self.setComponentProperty(uuid, component, property, value);
                        results.push({ uuid, ...res });
                        if (res.success)
                            successCount++;
                    }
                    catch (err) {
                        results.push({ uuid, error: err instanceof Error ? err.message : String(err) });
                    }
                }
                return { success: successCount > 0, totalNodes: uuids.length, successCount, failCount: uuids.length - successCount, results };
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
                        if (rep && typeof rep === 'object' && 'error' in rep) {
                            errors.push(`${uid}: ${(rep as { error: string }).error}`);
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
                const cc = getCC();
                const uuid = String(p.uuid ?? '');
                if (!uuid)
                    return { error: '缺少 uuid 参数' };
                const r = requireNode(scene, uuid);
                if ('error' in r)
                    return r;
                const slotIndex = Number(p.materialIndex ?? 0);
                const compName = String(p.component ?? '');
                // Find target renderer component
                const comps = r.node._components || [];
                let renderer = null;
                let resolvedCompName = '';
                for (const comp of comps) {
                    const cn = comp.constructor?.name ?? comp.__classname__ ?? '';
                    if (compName && cn !== compName && `cc.${cn}` !== compName)
                        continue;
                    const c = comp;
                    if (Array.isArray(c.sharedMaterials) || c.customMaterial) {
                        renderer = c;
                        resolvedCompName = cn;
                        break;
                    }
                }
                if (!renderer)
                    return { error: `节点 ${r.node.name} 上未找到渲染器组件${compName ? ` (${compName})` : ''}` };
                // Get material instance (clone if shared)
                const sharedMats = renderer.sharedMaterials;
                let mat = null;
                if (Array.isArray(sharedMats) && sharedMats[slotIndex]) {
                    mat = sharedMats[slotIndex];
                }
                else if (renderer.customMaterial) {
                    mat = renderer.customMaterial;
                }
                if (!mat)
                    return { error: `材质槽位 ${slotIndex} 为空` };
                // Try to get a material instance (clone for safe editing)
                const getMaterialInstance = renderer.getMaterialInstance;
                if (typeof getMaterialInstance === 'function') {
                    try {
                        mat = getMaterialInstance.call(renderer, slotIndex);
                    }
                    catch (e) {
                        logIgnored(ErrorCategory.ENGINE_API, '获取材质实例失败，使用共享材质', e);
                    }
                }
                // Set uniform properties
                const uniforms = p.uniforms;
                if (!uniforms || typeof uniforms !== 'object')
                    return { error: '缺少 uniforms 参数（如 {"mainColor": {"r":255,"g":0,"b":0,"a":255}}）' };
                const setProperty = mat.setProperty;
                if (typeof setProperty !== 'function')
                    return { error: '该材质不支持 setProperty 方法' };
                const Color = cc.Color;
                const Vec4 = cc.Vec4;
                const changed = {};
                for (const [uName, uVal] of Object.entries(uniforms)) {
                    try {
                        if (uVal && typeof uVal === 'object') {
                            const v = uVal;
                            // Detect color-like ({r,g,b,a}) vs vec-like ({x,y,z,w})
                            if ('r' in v && Color) {
                                const col = new Color(Math.max(0, Math.min(255, Number(v.r ?? 0))), Math.max(0, Math.min(255, Number(v.g ?? 0))), Math.max(0, Math.min(255, Number(v.b ?? 0))), Math.max(0, Math.min(255, Number(v.a ?? 255))));
                                setProperty.call(mat, uName, col);
                                changed[uName] = v;
                            }
                            else if ('x' in v && Vec4) {
                                const vec = new Vec4(Number(v.x ?? 0), Number(v.y ?? 0), Number(v.z ?? 0), Number(v.w ?? 0));
                                setProperty.call(mat, uName, vec);
                                changed[uName] = v;
                            }
                            else {
                                setProperty.call(mat, uName, uVal);
                                changed[uName] = uVal;
                            }
                        }
                        else {
                            setProperty.call(mat, uName, uVal);
                            changed[uName] = uVal;
                        }
                    }
                    catch (err) {
                        changed[uName] = { error: err instanceof Error ? err.message : String(err) };
                    }
                }
                const result = { success: true, uuid, name: r.node.name, component: resolvedCompName, materialIndex: slotIndex, changed };
                return (async () => {
                    if (renderer)
                        await deps.notifyEditorComponentProperty(uuid, r.node, renderer, 'sharedMaterials', { type: 'array', value: renderer.sharedMaterials });
                    result._inspectorRefreshed = true;
                    return result;
                })();
            }],
        ['assign_builtin_material', (_self, scene, p) => {
                const cc = getCC();
                const uuid = String(p.uuid ?? '');
                if (!uuid)
                    return { error: '缺少 uuid 参数' };
                const r = requireNode(scene, uuid);
                if ('error' in r)
                    return r;
                const effectName = String(p.effectName ?? 'builtin-standard');
                const slotIndex = Number(p.materialIndex ?? 0);
                const compName = String(p.component ?? '');
                // Find renderer
                const comps = r.node._components || [];
                let renderer = null;
                let resolvedCompName = '';
                for (const comp of comps) {
                    const cn = comp.constructor?.name ?? comp.__classname__ ?? '';
                    if (compName && cn !== compName && `cc.${cn}` !== compName)
                        continue;
                    const c = comp;
                    if (Array.isArray(c.sharedMaterials) || c.customMaterial || typeof c.setMaterial === 'function') {
                        renderer = c;
                        resolvedCompName = cn;
                        break;
                    }
                }
                if (!renderer)
                    return { error: `节点 ${r.node.name} 上未找到渲染器组件${compName ? ` (${compName})` : ''}` };
                const Mat = cc.Material;
                if (!Mat?.getBuiltinMaterial)
                    return { error: '当前 Cocos 版本不支持 Material.getBuiltinMaterial' };
                const builtinMat = Mat.getBuiltinMaterial(effectName);
                if (!builtinMat)
                    return { error: `未找到内置材质: ${effectName}` };
                // Clone to avoid mutating the shared builtin
                const clone = typeof builtinMat.clone === 'function'
                    ? builtinMat.clone()
                    : builtinMat;
                // Apply optional color
                if (p.color && typeof p.color === 'object') {
                    const cv = p.color;
                    const Color = cc.Color;
                    if (Color && typeof clone.setProperty === 'function') {
                        const col = new Color(Math.max(0, Math.min(255, Number(cv.r ?? 255))), Math.max(0, Math.min(255, Number(cv.g ?? 255))), Math.max(0, Math.min(255, Number(cv.b ?? 255))), Math.max(0, Math.min(255, Number(cv.a ?? 255))));
                        clone.setProperty('mainColor', col);
                    }
                }
                const setMaterial = renderer.setMaterial;
                if (typeof setMaterial === 'function') {
                    setMaterial.call(renderer, clone, slotIndex);
                }
                else {
                    // Fallback: directly set sharedMaterials array
                    const mats = renderer.sharedMaterials;
                    if (Array.isArray(mats)) {
                        mats[slotIndex] = clone;
                        renderer.sharedMaterials = [...mats];
                    }
                }
                const result = { success: true, uuid, name: r.node.name, component: resolvedCompName, effectName, materialIndex: slotIndex };
                return (async () => {
                    if (renderer)
                        await deps.notifyEditorComponentProperty(uuid, r.node, renderer, 'sharedMaterials', { type: 'array', value: renderer.sharedMaterials });
                    result._inspectorRefreshed = true;
                    return result;
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
                const cc = getCC();
                const globals = scene.globals;
                if (!globals)
                    return { error: '场景没有 globals 属性' };
                const subsystem = String(p.subsystem ?? '');
                const changed = {};
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
                    for (const [sub, vals] of Object.entries(presetData)) {
                        const target = globals[sub];
                        if (target) {
                            for (const [k, v] of Object.entries(vals))
                                target[k] = v;
                        }
                    }
                    return { success: true, preset, applied: presetData, _runtimeOnly: true, _note: '仅修改运行时 scene.globals，不经过 scene set-property，可能不会随场景保存' };
                }
                if (!subsystem)
                    return { error: '缺少 subsystem 参数（ambient/shadows/fog/skybox）或 preset 参数' };
                const Color = cc.Color;
                const setColor = (target, key, val) => {
                    if (Color) {
                        const cv = val;
                        target[key] = new Color(Math.max(0, Math.min(255, Number(cv.r ?? 0))), Math.max(0, Math.min(255, Number(cv.g ?? 0))), Math.max(0, Math.min(255, Number(cv.b ?? 0))), Math.max(0, Math.min(255, Number(cv.a ?? 255))));
                        changed[key] = cv;
                    }
                };
                if (subsystem === 'ambient') {
                    const ambient = globals.ambient;
                    if (!ambient)
                        return { error: 'globals.ambient 不存在' };
                    if (p.skyIllum !== undefined) {
                        ambient.skyIllum = Number(p.skyIllum);
                        changed.skyIllum = ambient.skyIllum;
                    }
                    if (p.skyLightIntensity !== undefined) {
                        ambient.skyLightIntensity = Number(p.skyLightIntensity);
                        changed.skyLightIntensity = ambient.skyLightIntensity;
                    }
                    if (p.mipmapLevel !== undefined) {
                        ambient.mipmapLevel = Number(p.mipmapLevel);
                        changed.mipmapLevel = ambient.mipmapLevel;
                    }
                    if (p.skyColor && typeof p.skyColor === 'object')
                        setColor(ambient, 'skyColor', p.skyColor);
                    if (p.groundAlbedo && typeof p.groundAlbedo === 'object')
                        setColor(ambient, 'groundAlbedo', p.groundAlbedo);
                }
                else if (subsystem === 'shadows') {
                    const shadows = globals.shadows;
                    if (!shadows)
                        return { error: 'globals.shadows 不存在' };
                    const numProps = ['enabled', 'type', 'distance', 'planeBias', 'maxReceived', 'size', 'autoAdapt'];
                    for (const prop of numProps) {
                        if (p[prop] !== undefined) {
                            shadows[prop] = typeof p[prop] === 'boolean' ? p[prop] : Number(p[prop]);
                            changed[prop] = shadows[prop];
                        }
                    }
                    if (p.shadowColor && typeof p.shadowColor === 'object')
                        setColor(shadows, 'shadowColor', p.shadowColor);
                    if (p.normal && typeof p.normal === 'object') {
                        const nv = p.normal;
                        const Vec3 = cc.Vec3;
                        shadows.normal = new Vec3(Number(nv.x ?? 0), Number(nv.y ?? 1), Number(nv.z ?? 0));
                        changed.normal = nv;
                    }
                }
                else if (subsystem === 'fog') {
                    const fog = globals.fog;
                    if (!fog)
                        return { error: 'globals.fog 不存在' };
                    const fogProps = ['enabled', 'accurate', 'type', 'fogDensity', 'fogStart', 'fogEnd', 'fogAtten', 'fogTop', 'fogRange'];
                    for (const prop of fogProps) {
                        if (p[prop] !== undefined) {
                            fog[prop] = typeof p[prop] === 'boolean' ? p[prop] : Number(p[prop]);
                            changed[prop] = fog[prop];
                        }
                    }
                    if (p.fogColor && typeof p.fogColor === 'object')
                        setColor(fog, 'fogColor', p.fogColor);
                }
                else if (subsystem === 'skybox') {
                    const skybox = globals.skybox;
                    if (!skybox)
                        return { error: 'globals.skybox 不存在' };
                    const skyProps = ['enabled', 'useIBL', 'useHDR', 'isRGBE', 'rotationAngle'];
                    for (const prop of skyProps) {
                        if (p[prop] !== undefined) {
                            skybox[prop] = typeof p[prop] === 'boolean' ? p[prop] : Number(p[prop]);
                            changed[prop] = skybox[prop];
                        }
                    }
                }
                else {
                    return { error: `未知的 subsystem: ${subsystem}，可用: ambient, shadows, fog, skybox` };
                }
                if (Object.keys(changed).length === 0)
                    return { error: `未指定任何要修改的 ${subsystem} 属性` };
                return { success: true, subsystem, changed, _runtimeOnly: true, _note: '仅修改运行时 scene.globals' };
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
                // Find renderer
                const comps = r.node._components || [];
                let renderer = null;
                for (const comp of comps) {
                    const c = comp;
                    if (Array.isArray(c.sharedMaterials) || c.customMaterial) {
                        renderer = c;
                        break;
                    }
                }
                if (!renderer)
                    return { error: `节点 ${r.node.name} 上未找到渲染器组件` };
                // Get material instance
                const getMaterialInstance = renderer.getMaterialInstance;
                let mat = null;
                if (typeof getMaterialInstance === 'function') {
                    try {
                        mat = getMaterialInstance.call(renderer, slotIndex);
                    }
                    catch (e) {
                        logIgnored(ErrorCategory.ENGINE_API, '获取材质实例失败，回退到共享材质', e);
                    }
                }
                if (!mat) {
                    const sharedMats = renderer.sharedMaterials;
                    if (Array.isArray(sharedMats))
                        mat = sharedMats[slotIndex] ?? null;
                }
                if (!mat)
                    return { error: `材质槽位 ${slotIndex} 为空` };
                // Get passes and set defines
                const passes = mat.passes;
                if (!Array.isArray(passes) || passes.length === 0)
                    return { error: '材质没有可用的 pass' };
                const passIdx = Number(p.passIndex ?? 0);
                const pass = passes[passIdx];
                if (!pass)
                    return { error: `pass 索引 ${passIdx} 超出范围 (共 ${passes.length} 个)` };
                const changed = {};
                const redefine = typeof mat.recompileShaders === 'function' ? mat.recompileShaders : null;
                // Approach 1: use overridePipelineStates / recompileShaders on material
                // Approach 2: set defines directly on pass
                for (const [defName, defVal] of Object.entries(defines)) {
                    try {
                        if (typeof pass.setDynamic === 'function') {
                            pass.setDynamic(defName, defVal);
                        }
                        // Direct property access
                        const defs = pass.defines;
                        if (defs)
                            defs[defName] = defVal;
                        changed[defName] = defVal;
                    }
                    catch (err) {
                        changed[defName] = { error: err instanceof Error ? err.message : String(err) };
                    }
                }
                // Try to recompile
                let recompiled = false;
                if (redefine) {
                    try {
                        redefine.call(mat, defines);
                        recompiled = true;
                    }
                    catch (e) {
                        logIgnored(ErrorCategory.ENGINE_API, '材质 redefine 编译失败', e);
                    }
                }
                // Try pass.tryCompile
                if (!recompiled && typeof pass.tryCompile === 'function') {
                    try {
                        pass.tryCompile.call(pass);
                        recompiled = true;
                    }
                    catch (e) {
                        logIgnored(ErrorCategory.ENGINE_API, '材质 pass.tryCompile 失败', e);
                    }
                }
                const result = { success: true, uuid, name: r.node.name, materialIndex: slotIndex, passIndex: passIdx, changed, recompiled };
                return (async () => {
                    if (renderer)
                        await deps.notifyEditorComponentProperty(uuid, r.node, renderer, 'sharedMaterials', { type: 'array', value: renderer.sharedMaterials });
                    result._inspectorRefreshed = true;
                    return result;
                })();
            }],
        // ─── P1: assign_project_material — assign custom .mtl by db:// url ──
        ['assign_project_material', (_self, scene, p) => {
                const cc = getCC();
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
                // Find renderer
                const comps = r.node._components || [];
                let renderer = null;
                let resolvedCompName = '';
                for (const comp of comps) {
                    const cn = comp.constructor?.name ?? comp.__classname__ ?? '';
                    const c = comp;
                    if (Array.isArray(c.sharedMaterials) || c.customMaterial || typeof c.setMaterial === 'function') {
                        renderer = c;
                        resolvedCompName = cn;
                        break;
                    }
                }
                if (!renderer)
                    return { error: `节点 ${r.node.name} 上未找到渲染器组件` };
                // Try to load material from assetManager
                const assetManager = cc.assetManager;
                if (!assetManager)
                    return { error: 'cc.assetManager 不可用' };
                let foundMat = null;
                const isUrl = materialUrl.startsWith('db://');
                const searchKey = isUrl ? materialUrl.replace('db://assets/', '') : '';
                let scanned = 0;
                const MAX_SCAN = 10000;
                assetManager.assets.forEach((asset, assetUuid) => {
                    if (foundMat || scanned >= MAX_SCAN)
                        return;
                    scanned++;
                    if (isUrl) {
                        const assetName = String(asset.name ?? asset.nativeUrl ?? '');
                        if (assetName.includes(searchKey))
                            foundMat = asset;
                    }
                    else {
                        if (assetUuid === materialUrl)
                            foundMat = asset;
                    }
                });
                if (!foundMat) {
                    return {
                        error: `未在已加载资源中找到材质: ${materialUrl}。提示: 该材质需要先被引擎加载（在场景或预制体中引用过）。`,
                        hint: '可以先用 asset_operation info 确认材质存在，或尝试在编辑器中手动拖拽一次。',
                    };
                }
                // Assign material
                const setMaterial = renderer.setMaterial;
                if (typeof setMaterial === 'function') {
                    setMaterial.call(renderer, foundMat, slotIndex);
                }
                else {
                    const mats = renderer.sharedMaterials;
                    if (Array.isArray(mats)) {
                        mats[slotIndex] = foundMat;
                        renderer.sharedMaterials = [...mats];
                    }
                }
                const result = { success: true, uuid, name: r.node.name, component: resolvedCompName, materialUrl, materialIndex: slotIndex };
                return (async () => {
                    if (renderer)
                        await deps.notifyEditorComponentProperty(uuid, r.node, renderer, 'sharedMaterials', { type: 'array', value: renderer.sharedMaterials });
                    result._inspectorRefreshed = true;
                    return result;
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
                const comps = r.node._components || [];
                let renderer = null;
                for (const comp of comps) {
                    const c = comp;
                    if (Array.isArray(c.sharedMaterials) || c.customMaterial) {
                        renderer = c;
                        break;
                    }
                }
                if (!renderer)
                    return { error: `节点 ${r.node.name} 上未找到渲染器组件` };
                // Get material instance (this clones the shared material)
                const getMaterialInstance = renderer.getMaterialInstance;
                if (typeof getMaterialInstance !== 'function')
                    return { error: '渲染器不支持 getMaterialInstance 方法' };
                try {
                    const instance = getMaterialInstance.call(renderer, slotIndex);
                    if (!instance)
                        return { error: `材质槽位 ${slotIndex} 为空` };
                    const effectName = instance.effectName ?? instance.effectAsset?.name ?? 'unknown';
                    const result = { success: true, uuid, name: r.node.name, materialIndex: slotIndex, effectName, message: '材质已克隆为独立实例，修改不会影响其他节点' };
                    return (async () => {
                        if (renderer)
                            await deps.notifyEditorComponentProperty(uuid, r.node, renderer, 'sharedMaterials', { type: 'array', value: renderer.sharedMaterials });
                        result._inspectorRefreshed = true;
                        return result;
                    })();
                }
                catch (err) {
                    return { error: `克隆材质失败: ${err instanceof Error ? err.message : String(err)}` };
                }
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
                const comps = r.node._components || [];
                let renderer = null;
                for (const comp of comps) {
                    const c = comp;
                    if (Array.isArray(c.sharedMaterials) || c.customMaterial) {
                        renderer = c;
                        break;
                    }
                }
                if (!renderer)
                    return { error: `节点 ${r.node.name} 上未找到渲染器组件` };
                const getMaterialInstance = renderer.getMaterialInstance;
                let mat = null;
                if (typeof getMaterialInstance === 'function') {
                    try {
                        mat = getMaterialInstance.call(renderer, slotIndex);
                    }
                    catch (e) {
                        logIgnored(ErrorCategory.ENGINE_API, '获取材质实例失败，回退到共享材质', e);
                    }
                }
                if (!mat) {
                    const sharedMats = renderer.sharedMaterials;
                    if (Array.isArray(sharedMats))
                        mat = sharedMats[slotIndex] ?? null;
                }
                if (!mat)
                    return { error: `材质槽位 ${slotIndex} 为空` };
                const oldTechnique = mat.technique;
                mat.technique = techniqueIndex;
                const result = { success: true, uuid, name: r.node.name, materialIndex: slotIndex, oldTechnique, newTechnique: techniqueIndex };
                return (async () => {
                    if (renderer)
                        await deps.notifyEditorComponentProperty(uuid, r.node, renderer, 'sharedMaterials', { type: 'array', value: renderer.sharedMaterials });
                    result._inspectorRefreshed = true;
                    return result;
                })();
            }],
        // ─── P2: sprite_grayscale — toggle grayscale material on Sprite ──────
        ['sprite_grayscale', (_self, scene, p) => {
                const cc = getCC();
                const { js } = cc;
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
                    const Mat = cc.Material;
                    const grayMat = Mat?.getBuiltinMaterial?.('builtin-2d-gray-sprite');
                    if (grayMat) {
                        const clone = typeof grayMat.clone === 'function'
                            ? grayMat.clone() : grayMat;
                        sprite.customMaterial = clone;
                        return notifySprite({ success: true, uuid, name: r.node.name, grayscale: true, method: 'gray_sprite_material', _assignsRuntimeFirst: true }, 'customMaterial', clone);
                    }
                    return { error: '无法启用灰度：Sprite 没有 grayscale 属性，且 builtin-2d-gray-sprite 材质不可用' };
                }
                else {
                    if ('grayscale' in sprite) {
                        return notifySprite({ success: true, uuid, name: r.node.name, grayscale: false, method: 'grayscale_property', _viaEditorIPC: true }, 'grayscale', false);
                    }
                    sprite.customMaterial = null;
                    return notifySprite({ success: true, uuid, name: r.node.name, grayscale: false, method: 'remove_custom_material', _assignsRuntimeFirst: true }, 'customMaterial', null);
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
                    const changed = {};
                    const errors = [];
                    const assignedRuntimeOnly = [];
                    for (const [key, val] of Object.entries(props)) {
                        if (key.startsWith('__') || key === 'constructor' || key === 'prototype') {
                            errors.push(`属性 "${key}" 不允许被设置`);
                            continue;
                        }
                        try {
                            if (isAssetRef(val) || isNodeRef(val) || isComponentRef(val)) {
                                const res = await Promise.resolve(self.setComponentProperty(uuid, compName, key, val));
                                if (res && typeof res === 'object' && 'error' in res)
                                    errors.push(`设置 ${key} 失败: ${String((res).error)}`);
                                else
                                    changed[key] = val;
                                continue;
                            }
                            if (typeof val === 'boolean' || typeof val === 'number' || typeof val === 'string') {
                                const dumpType = typeof val === 'boolean' ? 'boolean' : typeof val === 'number' ? 'number' : 'string';
                                const ok = await deps.notifyEditorComponentProperty(uuid, r.node, comp, key, { type: dumpType, value: val });
                                if (ok)
                                    changed[key] = val;
                                else
                                    errors.push(`IPC 设置 ${key} 失败`);
                                continue;
                            }
                            if (val && typeof val === 'object' && !Array.isArray(val) && 'r' in val) {
                                const o = val;
                                const ok = await deps.notifyEditorComponentProperty(uuid, r.node, comp, key, {
                                    type: 'cc.Color',
                                    value: {
                                        r: Math.max(0, Math.min(255, Number(o.r ?? 0))),
                                        g: Math.max(0, Math.min(255, Number(o.g ?? 0))),
                                        b: Math.max(0, Math.min(255, Number(o.b ?? 0))),
                                        a: Math.max(0, Math.min(255, Number(o.a ?? 255))),
                                    },
                                });
                                if (ok)
                                    changed[key] = val;
                                else
                                    errors.push(`IPC 设置 ${key} (Color) 失败`);
                                continue;
                            }
                            comp[key] = val;
                            changed[key] = val;
                            assignedRuntimeOnly.push(key);
                        }
                        catch (err) {
                            errors.push(`设置 ${key} 失败: ${err instanceof Error ? err.message : String(err)}`);
                        }
                    }
                    const result = {
                        success: Object.keys(changed).length > 0 && errors.length === 0,
                        uuid,
                        name: r.node.name,
                        component: compName,
                        changed,
                        ...(errors.length ? { errors } : {}),
                        ...(assignedRuntimeOnly.length ? { assignedRuntimeOnly, _note: 'assignedRuntimeOnly 中的键仅写了运行时对象，未保证 Inspector/保存一致' } : {}),
                    };
                    if (Object.keys(changed).length > 0 && errors.length === 0) {
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
                const cls = js.getClassByName(scriptName) || js.getClassByName('cc.' + scriptName);
                if (!cls) {
                    return {
                        error: `脚本类 "${scriptName}" 未注册`,
                        hint: '可能原因: 1) 脚本尚未编译完成，请稍后重试; 2) 类名不正确; 3) 脚本文件不存在。可用 check_script_ready 查询编译状态。',
                    };
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
                if (addResult && typeof addResult === 'object' && 'error' in addResult)
                    return addResult;
                return (async () => {
                    const baseResult = await Promise.resolve(addResult);
                    const r2 = requireNode(scene, uuid);
                    if ('error' in r2)
                        return { error: r2.error, _addComponentResult: baseResult };
                    const comp = r2.node.getComponent?.(cls);
                    if (!comp)
                        return { error: `添加脚本组件 ${scriptName} 失败`, _addComponentResult: baseResult };
                    const props = p.properties;
                    const changed = {};
                    const propErrors = [];
                    const assignedRuntimeOnly = [];
                    if (props && typeof props === 'object') {
                        for (const [key, val] of Object.entries(props)) {
                            if (key.startsWith('__') || key === 'constructor' || key === 'prototype') {
                                propErrors.push(`属性 "${key}" 不允许被设置`);
                                continue;
                            }
                            try {
                                if (isAssetRef(val) || isNodeRef(val) || isComponentRef(val)) {
                                    const res = await Promise.resolve(self.setComponentProperty(uuid, scriptName, key, val));
                                    if (res && typeof res === 'object' && 'error' in res)
                                        propErrors.push(`设置 ${key} 失败: ${String(res.error)}`);
                                    else
                                        changed[key] = val;
                                    continue;
                                }
                                if (typeof val === 'boolean' || typeof val === 'number' || typeof val === 'string') {
                                    const dumpType = typeof val === 'boolean' ? 'boolean' : typeof val === 'number' ? 'number' : 'string';
                                    const ok = await deps.notifyEditorComponentProperty(uuid, r2.node, comp, key, { type: dumpType, value: val });
                                    if (ok)
                                        changed[key] = val;
                                    else
                                        propErrors.push(`IPC 设置 ${key} 失败`);
                                    continue;
                                }
                                if (val && typeof val === 'object' && !Array.isArray(val) && 'r' in val) {
                                    const o = val;
                                    const ok = await deps.notifyEditorComponentProperty(uuid, r2.node, comp, key, {
                                        type: 'cc.Color',
                                        value: {
                                            r: Math.max(0, Math.min(255, Number(o.r ?? 0))),
                                            g: Math.max(0, Math.min(255, Number(o.g ?? 0))),
                                            b: Math.max(0, Math.min(255, Number(o.b ?? 0))),
                                            a: Math.max(0, Math.min(255, Number(o.a ?? 255))),
                                        },
                                    });
                                    if (ok)
                                        changed[key] = val;
                                    else
                                        propErrors.push(`IPC 设置 ${key} (Color) 失败`);
                                    continue;
                                }
                                comp[key] = val;
                                changed[key] = val;
                                assignedRuntimeOnly.push(key);
                            }
                            catch (err) {
                                propErrors.push(`设置 ${key} 失败: ${err instanceof Error ? err.message : String(err)}`);
                            }
                        }
                    }
                    const result = {
                        success: propErrors.length === 0,
                        uuid,
                        name: r2.node.name,
                        script: scriptName,
                        _addComponentResult: baseResult,
                        ...(Object.keys(changed).length > 0 ? { propertiesSet: changed } : {}),
                        ...(propErrors.length ? { propertyErrors: propErrors } : {}),
                        ...(assignedRuntimeOnly.length ? { assignedRuntimeOnly, _note: 'assignedRuntimeOnly 仅运行时赋值' } : {}),
                    };
                    if (Object.keys(changed).length > 0 && propErrors.length === 0) {
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
