import type { CocosNode, CocosCC, OperationHandler } from './scene-types';
import { isNodeRef, isComponentRef, resolveRefToRuntime } from './scene-types';
import { ErrorCategory, logIgnored } from './error-utils';

export interface SceneOperationDeps {
  getCC: () => CocosCC;
  findNodeByUuid: (root: CocosNode | null, uuid: string) => CocosNode | null;
  findNodeByName: (root: CocosNode | null, name: string) => CocosNode | null;
  resolveParent: (scene: CocosNode, ref: string) => { node: CocosNode } | { error: string };
  requireNode: (scene: CocosNode, uuid: string) => { node: CocosNode } | { error: string };
  notifyEditorProperty: (uuid: string, path: string, dump: { type: string; value: unknown }) => Promise<boolean>;
  notifyEditorRemoveNode: (uuid: string) => Promise<boolean>;
  notifyEditorComponentProperty: (nodeUuid: string, node: CocosNode, comp: unknown, property: string, dump: { type: string; value: unknown }) => Promise<boolean>;
  ipcDuplicateNode: (uuid: string) => Promise<string>;
}

export function buildOperationHandlers(deps: SceneOperationDeps): Map<string, OperationHandler> {
  const { getCC, requireNode } = deps;

  const handlers = new Map<string, OperationHandler>([
    ['create_node', (self, _s, p) => {
      return (async () => {
        const result = await Promise.resolve(self.createChildNode(String(p.parentUuid ?? ''), String(p.name ?? 'New Node')));
        if (result && typeof result === 'object' && 'success' in result && (result as Record<string, unknown>).success && p.siblingIndex !== undefined) {
          const uuid = String((result as Record<string, unknown>).uuid ?? '');
          const cc = getCC();
          const scene = cc.director.getScene();
          if (scene) {
            const node = deps.findNodeByUuid(scene, uuid);
            if (node) {
              node.setSiblingIndex(Number(p.siblingIndex));
            }
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
      if ('error' in r) return r;
      if (!r.node.parent) return { error: `节点无父节点，无法复制: ${p.uuid}` };
      const includeChildren = p.includeChildren !== false;
      const sourceUuid = String(p.uuid ?? '');

      return (async () => {
        if (includeChildren) {
          // ── Editor IPC duplicate-node (full-children duplication) ──
          const clonedUuid = await deps.ipcDuplicateNode(sourceUuid);
          return { success: true, clonedUuid, name: r.node.name + ' (clone)', includeChildren };
        }

        // ── includeChildren=false: no IPC equivalent, use runtime ──
        const { Node } = getCC();
        const clone = new Node(r.node.name + '_copy');
        r.node.parent!.addChild(clone);
        if (r.node.position) clone.setPosition(r.node.position);
        if (r.node.scale) clone.setScale(r.node.scale);
        if (r.node.worldRotation) {
          const { Quat, Vec3 } = getCC();
          const euler = new Vec3(0, 0, 0);
          Quat.toEuler(euler, r.node.worldRotation);
          const e = euler as unknown as { x: number; y: number; z: number };
          clone.setRotationFromEuler(e.x, e.y, e.z);
        }
        clone.active = r.node.active;
        clone.layer = r.node.layer;
        const clonedUuid = clone.uuid || clone._id || '';
        const result: Record<string, unknown> = { success: true, clonedUuid, name: clone.name, includeChildren };
        if (clonedUuid && await deps.notifyEditorProperty(clonedUuid, 'active', { type: 'boolean', value: clone.active })) {
          result._inspectorRefreshed = true;
        }
        return result;
      })();
    }],
    ['set_world_position', (_self, scene, p) => {
      const { Vec3 } = getCC();
      const uuid = String(p.uuid ?? '');
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      r.node.setWorldPosition(new Vec3(Number(p.x ?? 0), Number(p.y ?? 0), Number(p.z ?? 0)));
      const result: Record<string, unknown> = { success: true, uuid };
      return (async () => {
        const pos = r.node.position ?? { x: 0, y: 0, z: 0 };
        if (await deps.notifyEditorProperty(uuid, 'position', {
          type: 'cc.Vec3', value: { x: pos.x, y: pos.y, z: pos.z },
        })) { result._inspectorRefreshed = true; }
        return result;
      })();
    }],
    ['set_world_rotation', (_self, scene, p) => {
      const { Quat } = getCC();
      const uuid = String(p.uuid ?? '');
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      const [x, y, z] = [Number(p.x ?? 0), Number(p.y ?? 0), Number(p.z ?? 0)];
      const q = new Quat();
      Quat.fromEuler(q, x, y, z);
      r.node.setWorldRotation(q);
      const result: Record<string, unknown> = { success: true, uuid, rotation: { x, y, z } };
      return (async () => {
        const euler = r.node.eulerAngles;
        if (euler && await deps.notifyEditorProperty(uuid, 'rotation', {
          type: 'cc.Vec3', value: { x: euler.x, y: euler.y, z: euler.z },
        })) { result._inspectorRefreshed = true; }
        return result;
      })();
    }],
    ['set_world_scale', (_self, scene, p) => {
      const { Vec3 } = getCC();
      const uuid = String(p.uuid ?? '');
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      const [sx, sy, sz] = [Number(p.x ?? 1), Number(p.y ?? 1), Number(p.z ?? 1)];
      r.node.setWorldScale(new Vec3(sx, sy, sz));
      const result: Record<string, unknown> = { success: true, uuid, scale: { x: sx, y: sy, z: sz } };
      return (async () => {
        const s = r.node.scale ?? { x: 1, y: 1, z: 1 };
        if (await deps.notifyEditorProperty(uuid, 'scale', {
          type: 'cc.Vec3', value: { x: s.x, y: s.y, z: s.z },
        })) { result._inspectorRefreshed = true; }
        return result;
      })();
    }],
    ['move_node_up', (_self, scene, p) => {
      const uuid = String(p.uuid ?? '');
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      if (!r.node.parent) return { error: `未找到节点或无父节点: ${uuid}` };
      const idx = r.node.getSiblingIndex();
      if (idx <= 0) return { success: false, uuid, message: '已经在最前面了' };
      r.node.setSiblingIndex(idx - 1);
      const result: Record<string, unknown> = { success: true, uuid, newIndex: idx - 1 };
      return (async () => {
        if (await deps.notifyEditorProperty(uuid, 'active', { type: 'boolean', value: r.node.active })) {
          result._inspectorRefreshed = true;
        }
        return result;
      })();
    }],
    ['move_node_down', (_self, scene, p) => {
      const uuid = String(p.uuid ?? '');
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      if (!r.node.parent) return { error: `未找到节点或无父节点: ${uuid}` };
      const idx = r.node.getSiblingIndex();
      const maxIdx = r.node.parent.children.length - 1;
      if (idx >= maxIdx) return { success: false, uuid, message: '已经在最后面了' };
      r.node.setSiblingIndex(idx + 1);
      const result: Record<string, unknown> = { success: true, uuid, newIndex: idx + 1 };
      return (async () => {
        if (await deps.notifyEditorProperty(uuid, 'active', { type: 'boolean', value: r.node.active })) {
          result._inspectorRefreshed = true;
        }
        return result;
      })();
    }],
    ['set_sibling_index', (_self, scene, p) => {
      const uuid = String(p.uuid ?? '');
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      if (!r.node.parent) return { error: `未找到节点或无父节点: ${uuid}` };
      r.node.setSiblingIndex(Number(p.index ?? 0));
      const result: Record<string, unknown> = { success: true, uuid, newIndex: r.node.getSiblingIndex() };
      return (async () => {
        if (await deps.notifyEditorProperty(uuid, 'active', { type: 'boolean', value: r.node.active })) {
          result._inspectorRefreshed = true;
        }
        return result;
      })();
    }],
    ['lock_node', (_self, scene, p) => {
      const r = requireNode(scene, String(p.uuid ?? ''));
      if ('error' in r) return r;
      return { success: false, uuid: p.uuid, name: r.node.name, message: '节点锁定是编辑器层级功能，场景脚本无法实现真正的锁定。建议通过 editor_action 调用编辑器 API 或手动在 Hierarchy 面板中操作。' };
    }],
    ['unlock_node', (_self, scene, p) => {
      const r = requireNode(scene, String(p.uuid ?? ''));
      if ('error' in r) return r;
      return { success: false, uuid: p.uuid, name: r.node.name, message: '节点解锁是编辑器层级功能，场景脚本无法实现真正的解锁。建议通过 editor_action 调用编辑器 API 或手动在 Hierarchy 面板中操作。' };
    }],
    ['hide_node', (_self, scene, p) => {
      const uuid = String(p.uuid ?? '');
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      r.node.active = false;
      const result: Record<string, unknown> = { success: true, uuid, name: r.node.name, active: false };
      return (async () => {
        if (await deps.notifyEditorProperty(uuid, 'active', { type: 'boolean', value: false })) {
          result._inspectorRefreshed = true;
        }
        return result;
      })();
    }],
    ['unhide_node', (_self, scene, p) => {
      const uuid = String(p.uuid ?? '');
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      r.node.active = true;
      const result: Record<string, unknown> = { success: true, uuid, name: r.node.name, active: true };
      return (async () => {
        if (await deps.notifyEditorProperty(uuid, 'active', { type: 'boolean', value: true })) {
          result._inspectorRefreshed = true;
        }
        return result;
      })();
    }],
    ['set_layer', (_self, scene, p) => {
      const uuid = String(p.uuid ?? '');
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      r.node.layer = Number(p.layer ?? r.node.layer);
      const layerVal = r.node.layer;
      const result: Record<string, unknown> = { success: true, uuid, name: r.node.name, layer: layerVal };
      return (async () => {
        if (await deps.notifyEditorProperty(uuid, 'layer', { type: 'number', value: layerVal })) {
          result._inspectorRefreshed = true;
        }
        return result;
      })();
    }],
    ['call_component_method', (_self, scene, p) => {
      const { js } = getCC();
      const uuid = String(p.uuid ?? '');
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      const compName = String(p.component ?? '');
      const mName = String(p.methodName ?? '');
      if (!compName || !mName) return { error: '缺少 component 或 methodName 参数' };
      const compClass = js.getClassByName(compName) || js.getClassByName('cc.' + compName);
      const comp = compClass ? r.node.getComponent(compClass) : null;
      if (!comp) return { error: `节点上没有组件: ${compName}` };
      if (typeof (comp as Record<string, unknown>)[mName] !== 'function') return { error: `组件 ${compName} 上没有方法: ${mName}` };
      const callArgs = Array.isArray(p.args) ? p.args : [];
      try {
        const fn = (comp as Record<string, unknown>)[mName] as (...a: unknown[]) => unknown;
        return { success: true, uuid, component: compName, method: mName, result: fn.apply(comp, callArgs) ?? null };
      } catch (err: unknown) {
        return { error: `调用失败: ${err instanceof Error ? err.message : String(err)}` };
      }
    }],
    ['clear_children', (_self, scene, p) => {
      const uuid = String(p.uuid ?? '');
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      const childUuids = r.node.children.map((c: CocosNode) => c.uuid ?? c._id);
      const count = childUuids.length;
      return (async () => {
        let editorRemoved = 0;
        for (const childUuid of childUuids) {
          if (await deps.notifyEditorRemoveNode(childUuid)) {
            editorRemoved++;
          }
        }
        if (editorRemoved < count) {
          r.node.removeAllChildren();
        }
        return { success: true, uuid, name: r.node.name, removedCount: count, _editorRemoved: editorRemoved };
      })();
    }],
    ['create_primitive', (self, scene, p) => {
      const cc = getCC();
      const prims = (cc as { primitives?: Record<string, (() => unknown) | undefined> }).primitives;
      const utils = (cc as { utils?: { MeshUtils?: { createMesh: (g: unknown, out?: unknown, opts?: { calculateBounds?: boolean }) => unknown } } }).utils;
      const parentUuid = String(p.parentUuid ?? '');
      const type = String((p.type ?? p.primitive ?? 'box')).toLowerCase();
      const SUPPORTED_TYPES = ['box', 'cube', 'sphere', 'cylinder', 'cone', 'plane', 'torus', 'capsule', 'quad'];
      const ALIAS_MAP: Record<string, string> = { cube: 'box' };
      const resolvedType = ALIAS_MAP[type] || type;
      if (!SUPPORTED_TYPES.includes(type)) {
        return { error: `不支持的几何体类型: ${type}，可用: ${SUPPORTED_TYPES.join(', ')}` };
      }
      const DEFAULT_NAMES: Record<string, string> = { box: 'Cube', sphere: 'Sphere', cylinder: 'Cylinder', cone: 'Cone', plane: 'Plane', torus: 'Torus', capsule: 'Capsule', quad: 'Quad' };
      const name = String(p.name ?? DEFAULT_NAMES[resolvedType] ?? 'Primitive');
      const createRes = self.createChildNode(parentUuid, name);
      if (createRes && typeof createRes === 'object' && 'error' in createRes) return createRes;
      const nodeUuid = (createRes as { uuid?: string })?.uuid;
      if (!nodeUuid) return { error: 'createChildNode 未返回 uuid' };
      const addRes = self.addComponent(nodeUuid, 'MeshRenderer');
      if (addRes && typeof addRes === 'object' && 'error' in addRes) return addRes;
      try {
        let mesh: unknown;
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
        if ('error' in r) return r;
        const MeshRenderer = (cc as { MeshRenderer?: new () => { mesh: unknown; setMaterial?: (m: unknown, i?: number) => void } }).MeshRenderer;
        const mr = r.node.getComponent(MeshRenderer) as { mesh: unknown; setMaterial?: (m: unknown, i?: number) => void; shadowCastingMode?: number; receiveShadow?: boolean } | undefined;
        if (mr) {
          (mr as { mesh: unknown }).mesh = mesh;
          // Shadow settings
          if (p.shadowCasting !== undefined || p.shadowCastingMode !== undefined) {
            const castVal = p.shadowCastingMode ?? (p.shadowCasting ? 1 : 0);
            if ('shadowCastingMode' in mr) mr.shadowCastingMode = Number(castVal);
          }
          if (p.receiveShadow !== undefined) {
            if ('receiveShadow' in mr) mr.receiveShadow = Boolean(p.receiveShadow);
          }
          try {
            const Mat = (cc as { Material?: { getBuiltinMaterial?: (name: string) => unknown } }).Material;
            const Color = (cc as { Color?: new (r: number, g: number, b: number, a?: number) => { r: number; g: number; b: number; a: number } }).Color;
            const builtinMat = Mat?.getBuiltinMaterial?.('builtin-unlit') ?? Mat?.getBuiltinMaterial?.('builtin-standard');
            if (builtinMat && mr.setMaterial) {
              const clone = typeof (builtinMat as { clone?: () => unknown }).clone === 'function'
                ? (builtinMat as { clone: () => unknown }).clone()
                : builtinMat;
              let rVal = 66, gVal = 135, bVal = 245, aVal = 255;
              if (p.color && typeof p.color === 'object') {
                const c = p.color as { r?: number; g?: number; b?: number; a?: number };
                rVal = Math.max(0, Math.min(255, Number(c.r ?? rVal)));
                gVal = Math.max(0, Math.min(255, Number(c.g ?? gVal)));
                bVal = Math.max(0, Math.min(255, Number(c.b ?? bVal)));
                aVal = Math.max(0, Math.min(255, Number(c.a ?? aVal)));
              }
              if (Color) {
                const col = new Color(rVal, gVal, bVal, aVal);
                if (typeof (clone as { setProperty?: (k: string, v: unknown) => void }).setProperty === 'function') {
                  (clone as { setProperty: (k: string, v: unknown) => void }).setProperty('mainColor', col);
                }
              }
              mr.setMaterial(clone, 0);
            }
          } catch (e) {
            logIgnored(ErrorCategory.ENGINE_API, '设置几何体材质/颜色失败（部分版本路径不同，可能显示默认色）', e);
          }
        }
      } catch (err: unknown) {
        return { error: `创建 ${resolvedType} 网格失败: ${err instanceof Error ? err.message : String(err)}` };
      }
      const result: Record<string, unknown> = { success: true, uuid: nodeUuid, name, type: resolvedType };
      return (async () => {
        await Promise.resolve(createRes);
        await Promise.resolve(addRes);
        const rr = requireNode(scene, nodeUuid);
        if (!('error' in rr)) {
          const MR = (cc as { MeshRenderer?: unknown }).MeshRenderer;
          const mrComp = MR ? rr.node.getComponent(MR) : null;
          if (mrComp) await deps.notifyEditorComponentProperty(nodeUuid, rr.node, mrComp, 'sharedMaterials', { type: 'array', value: (mrComp as Record<string, unknown>).sharedMaterials });
        }
        result._inspectorRefreshed = true;
        return result;
      })();
    }],
    ['set_camera_look_at', (_self, scene, p) => {
      const { Vec3 } = getCC();
      const uuid = String(p.uuid ?? '');
      if (!uuid) return { error: '缺少 uuid 参数，需指定摄像机节点 uuid（可通过 scene_query get_camera_info 获取）' };
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      const targetX = Number(p.targetX ?? 0);
      const targetY = Number(p.targetY ?? 0);
      const targetZ = Number(p.targetZ ?? 0);
      const target = new Vec3(targetX, targetY, targetZ);
      const hasPos = p.x !== undefined || p.y !== undefined || p.z !== undefined;
      if (hasPos) {
        const px = Number(p.x ?? 0);
        const py = Number(p.y ?? 0);
        const pz = Number(p.z ?? 0);
        r.node.setWorldPosition(new Vec3(px, py, pz));
      } else {
        const dist = 5;
        r.node.setWorldPosition(new Vec3(dist, dist, dist));
      }
      const lookAt = (r.node as { lookAt?: (v: unknown) => void }).lookAt;
      if (typeof lookAt === 'function') {
        lookAt.call(r.node, target);
      }
      const wp = r.node.worldPosition ?? { x: 0, y: 0, z: 0 };
      const result: Record<string, unknown> = {
        success: true, uuid, name: r.node.name,
        position: { x: wp.x, y: wp.y, z: wp.z },
        target: { x: targetX, y: targetY, z: targetZ },
      };
      return (async () => {
        const pos = r.node.position ?? { x: 0, y: 0, z: 0 };
        await deps.notifyEditorProperty(uuid, 'position', { type: 'cc.Vec3', value: { x: pos.x, y: pos.y, z: pos.z } });
        const euler = r.node.eulerAngles;
        if (euler && await deps.notifyEditorProperty(uuid, 'rotation', { type: 'cc.Vec3', value: { x: euler.x, y: euler.y, z: euler.z } })) {
          result._inspectorRefreshed = true;
        }
        return result;
      })();
    }],
    ['create_prefab', (_self, scene, p) => {
      const uuid = String(p.uuid ?? '');
      if (!uuid) return { error: '缺少 uuid 参数，请指定要保存为预制体的节点' };
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      const savePath = String(p.savePath ?? '');
      return { success: true, uuid, name: r.node.name, savePath: savePath || `db://assets/prefabs/${r.node.name}.prefab`, info: 'Node found, ready for prefab creation via Editor API' };
    }],
    ['reset_property', (_self, scene, p) => {
      const { js, Node } = getCC();
      const uuid = String(p.uuid ?? '');
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      const compName = String(p.component ?? '');
      const propName = String(p.property ?? '');
      if (!compName || !propName) return { error: '缺少 component 或 property 参数' };
      const compClass = js.getClassByName(compName) || js.getClassByName('cc.' + compName);
      if (!compClass) return { error: `未找到组件类: ${compName}` };
      const comp = r.node.getComponent(compClass);
      if (!comp) return { error: `节点上没有组件: ${compName}` };
      try {
        const tempNode = new Node('__reset_tmp__');
        const tempComp = tempNode.addComponent(compClass);
        const defaultValue = (tempComp as Record<string, unknown>)[propName];
        const oldValue = (comp as Record<string, unknown>)[propName];
        if (defaultValue !== undefined) {
          const dv = defaultValue as Record<string, unknown>;
          (comp as Record<string, unknown>)[propName] = (dv && typeof dv === 'object' && typeof dv.clone === 'function') ? (dv.clone as () => unknown)() : defaultValue;
        }
        tempNode.destroy();
        const newValue = (comp as Record<string, unknown>)[propName];
        const result: Record<string, unknown> = { success: true, uuid, component: compName, property: propName, oldValue, newValue };
        const dumpType = typeof newValue === 'boolean' ? 'boolean' : typeof newValue === 'number' ? 'number' : typeof newValue === 'string' ? 'string' : null;
        if (dumpType) {
          return (async () => {
            if (await deps.notifyEditorComponentProperty(uuid, r.node, comp, propName, { type: dumpType, value: newValue })) {
              result._inspectorRefreshed = true;
            }
            return result;
          })();
        }
        return result;
      } catch (err: unknown) {
        return { error: `重置属性失败: ${err instanceof Error ? err.message : String(err)}` };
      }
    }],

    // ─── batch: execute multiple operations in one call ──────────────────
    ['batch', (self, scene, p) => {
      const ops = p.operations as Array<Record<string, unknown>> | undefined;
      if (!Array.isArray(ops) || ops.length === 0) return { error: '缺少 operations 数组' };
      if (ops.length > 200) return { error: `操作数量超过上限 (${ops.length}/200)` };
      const results: Array<Record<string, unknown>> = [];
      const uuidMap: Record<string, string> = {}; // $0, $1 ... -> real uuid
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
        if (action === 'batch') { results.push({ error: '不允许嵌套 batch', index: i }); continue; }
        const handler = handlers.get(action);
        if (!handler) { results.push({ error: `未知操作: ${action}`, index: i }); continue; }
        try {
          const result = handler(self, scene, op) as Record<string, unknown>;
          results.push({ ...result, _index: i });
          // Store uuid for $N references
          const resultUuid = result?.uuid || result?.clonedUuid;
          if (typeof resultUuid === 'string') uuidMap[`$${i}`] = resultUuid;
        } catch (err: unknown) {
          results.push({ error: err instanceof Error ? err.message : String(err), _index: i });
        }
      }
      const successCount = results.filter(r => r.success || !r.error).length;
      return { success: true, totalOps: ops.length, successCount, failCount: ops.length - successCount, results };
    }],

    // ─── create_ui_widget: one-step common UI component creation ─────────
    ['create_ui_widget', (self, scene, p) => {
      const cc = getCC();
      const { Node, Vec3, js } = cc;
      const widgetType = String(p.widgetType ?? 'button').toLowerCase();
      const parentRef = String(p.parentUuid ?? '');
      const nodeName = String(p.name ?? widgetType.charAt(0).toUpperCase() + widgetType.slice(1));
      const resolved = deps.resolveParent(scene, parentRef);
      if ('error' in resolved) return resolved;

      const root = new Node(nodeName);
      resolved.node.addChild(root);
      const rootUuid = root.uuid || (root as unknown as { _id: string })._id;
      const addComp = (node: typeof root, name: string) => {
        const cls = js.getClassByName(name) || js.getClassByName('cc.' + name);
        return cls ? node.addComponent(cls) : null;
      };
      const createdNodes: Array<{ uuid: string; name: string; role: string }> = [];
      createdNodes.push({ uuid: rootUuid, name: nodeName, role: 'root' });

      addComp(root, 'UITransform');

      switch (widgetType) {
        case 'button': {
          addComp(root, 'Sprite');
          addComp(root, 'Button');
          const label = new Node('Label');
          root.addChild(label);
          addComp(label, 'UITransform');
          const labelComp = addComp(label, 'Label');
          if (labelComp) (labelComp as Record<string, unknown>).string = String(p.text ?? 'Button');
          createdNodes.push({ uuid: label.uuid || (label as unknown as { _id: string })._id, name: 'Label', role: 'label' });
          break;
        }
        case 'toggle': {
          addComp(root, 'Sprite');
          addComp(root, 'Toggle');
          const checkmark = new Node('Checkmark');
          root.addChild(checkmark);
          addComp(checkmark, 'UITransform');
          addComp(checkmark, 'Sprite');
          createdNodes.push({ uuid: checkmark.uuid || (checkmark as unknown as { _id: string })._id, name: 'Checkmark', role: 'checkmark' });
          break;
        }
        case 'slider': {
          addComp(root, 'Sprite');
          addComp(root, 'Slider');
          const handle = new Node('Handle');
          root.addChild(handle);
          addComp(handle, 'UITransform');
          addComp(handle, 'Sprite');
          createdNodes.push({ uuid: handle.uuid || (handle as unknown as { _id: string })._id, name: 'Handle', role: 'handle' });
          break;
        }
        case 'progressbar': {
          addComp(root, 'Sprite');
          addComp(root, 'ProgressBar');
          const bar = new Node('Bar');
          root.addChild(bar);
          addComp(bar, 'UITransform');
          addComp(bar, 'Sprite');
          createdNodes.push({ uuid: bar.uuid || (bar as unknown as { _id: string })._id, name: 'Bar', role: 'bar' });
          break;
        }
        case 'editbox': {
          addComp(root, 'Sprite');
          addComp(root, 'EditBox');
          const placeholder = new Node('Placeholder');
          root.addChild(placeholder);
          addComp(placeholder, 'UITransform');
          const phLabel = addComp(placeholder, 'Label');
          if (phLabel) (phLabel as Record<string, unknown>).string = String(p.placeholder ?? 'Enter text...');
          createdNodes.push({ uuid: placeholder.uuid || (placeholder as unknown as { _id: string })._id, name: 'Placeholder', role: 'placeholder' });
          break;
        }
        case 'label': {
          const labelComp = addComp(root, 'Label');
          if (labelComp) (labelComp as Record<string, unknown>).string = String(p.text ?? 'Label');
          break;
        }
        case 'sprite': {
          addComp(root, 'Sprite');
          break;
        }
        default:
          return { error: `未知的 widgetType: ${widgetType}，支持: button, toggle, slider, progressbar, editbox, label, sprite` };
      }

      if (p.x !== undefined || p.y !== undefined) {
        root.setPosition(new Vec3(Number(p.x ?? 0), Number(p.y ?? 0), 0));
      }

      const result: Record<string, unknown> = { success: true, uuid: rootUuid, widgetType, nodes: createdNodes };
      return (async () => {
        for (const cn of createdNodes) {
          await deps.notifyEditorProperty(cn.uuid, 'active', { type: 'boolean', value: true });
        }
        result._inspectorRefreshed = true;
        return result;
      })();
    }],

    // ─── setup_particle: create and configure particle system ────────────
    ['setup_particle', (_self, scene, p) => {
      const cc = getCC();
      const { Node, js } = cc;
      const parentRef = String(p.parentUuid ?? '');
      const resolved = deps.resolveParent(scene, parentRef);
      if ('error' in resolved) return resolved;
      const nodeName = String(p.name ?? 'Particles');
      const node = new Node(nodeName);
      resolved.node.addChild(node);
      const uuid = node.uuid || (node as unknown as { _id: string })._id;
      // Try ParticleSystem2D first (2D), then ParticleSystem (3D)
      const PS2D = js.getClassByName('ParticleSystem2D') || js.getClassByName('cc.ParticleSystem2D');
      const PS3D = js.getClassByName('ParticleSystem') || js.getClassByName('cc.ParticleSystem');
      const is2D = String(p.mode ?? 'auto') === '2d' || (!PS3D && PS2D);
      const PSClass = is2D ? PS2D : PS3D;
      if (!PSClass) return { error: 'ParticleSystem 组件不可用' };
      const comp = node.addComponent(PSClass) as Record<string, unknown>;
      if (!comp) return { error: '无法添加粒子系统组件' };
      // Apply preset or custom properties
      const preset = String(p.preset ?? '').toLowerCase();
      const PRESETS: Record<string, Record<string, unknown>> = {
        fire: { life: 1.5, emissionRate: 80, speed: 60, startColor: { r: 255, g: 120, b: 20, a: 255 } },
        smoke: { life: 3, emissionRate: 30, speed: 20, startColor: { r: 180, g: 180, b: 180, a: 200 } },
        rain: { life: 1, emissionRate: 200, speed: 300, angle: 270 },
        snow: { life: 4, emissionRate: 50, speed: 30, startColor: { r: 255, g: 255, b: 255, a: 230 } },
        sparkle: { life: 0.5, emissionRate: 100, speed: 100, startColor: { r: 255, g: 255, b: 100, a: 255 } },
        explosion: { life: 0.8, emissionRate: 500, speed: 200, duration: 0.1 },
      };
      const props = preset && PRESETS[preset] ? { ...PRESETS[preset], ...(p.properties as Record<string, unknown> ?? {}) } : (p.properties as Record<string, unknown> ?? {});
      for (const [key, val] of Object.entries(props)) {
        try { comp[key] = val; } catch (e) { logIgnored(ErrorCategory.PROPERTY_ASSIGN, `粒子系统属性 "${key}" 赋值失败`, e); }
      }
      const result: Record<string, unknown> = { success: true, uuid: uuid || '', name: nodeName, particleType: is2D ? '2D' : '3D', preset: preset || 'custom', appliedProperties: Object.keys(props) };
      return (async () => {
        if (uuid) await deps.notifyEditorProperty(uuid, 'active', { type: 'boolean', value: node.active });
        result._inspectorRefreshed = true;
        return result;
      })();
    }],

    // ─── align_nodes: align or distribute multiple nodes ─────────────────
    ['align_nodes', (_self, scene, p) => {
      const cc = getCC();
      const { Vec3 } = cc;
      const uuids = p.uuids as string[] | undefined;
      if (!Array.isArray(uuids) || uuids.length < 2) return { error: '需要至少 2 个 uuid' };
      const alignment = String(p.alignment ?? 'center_h');
      const nodes = uuids.map(u => {
        const r = requireNode(scene, u);
        if ('error' in r) return null;
        return r.node;
      }).filter(Boolean) as import('./scene-types').CocosNode[];
      if (nodes.length < 2) return { error: '有效节点不足 2 个' };
      const positions = nodes.map(n => n.worldPosition ? { x: n.worldPosition.x, y: n.worldPosition.y, z: n.worldPosition.z } : { x: 0, y: 0, z: 0 });
      switch (alignment) {
        case 'left': { const minX = Math.min(...positions.map(p => p.x)); nodes.forEach(n => n.setWorldPosition(new Vec3(minX, n.worldPosition?.y ?? 0, n.worldPosition?.z ?? 0))); break; }
        case 'right': { const maxX = Math.max(...positions.map(p => p.x)); nodes.forEach(n => n.setWorldPosition(new Vec3(maxX, n.worldPosition?.y ?? 0, n.worldPosition?.z ?? 0))); break; }
        case 'center_h': { const avgX = positions.reduce((s, p) => s + p.x, 0) / positions.length; nodes.forEach(n => n.setWorldPosition(new Vec3(avgX, n.worldPosition?.y ?? 0, n.worldPosition?.z ?? 0))); break; }
        case 'top': { const maxY = Math.max(...positions.map(p => p.y)); nodes.forEach(n => n.setWorldPosition(new Vec3(n.worldPosition?.x ?? 0, maxY, n.worldPosition?.z ?? 0))); break; }
        case 'bottom': { const minY = Math.min(...positions.map(p => p.y)); nodes.forEach(n => n.setWorldPosition(new Vec3(n.worldPosition?.x ?? 0, minY, n.worldPosition?.z ?? 0))); break; }
        case 'center_v': { const avgY = positions.reduce((s, p) => s + p.y, 0) / positions.length; nodes.forEach(n => n.setWorldPosition(new Vec3(n.worldPosition?.x ?? 0, avgY, n.worldPosition?.z ?? 0))); break; }
        case 'distribute_h': {
          const sorted = nodes.slice().sort((a, b) => (a.worldPosition?.x ?? 0) - (b.worldPosition?.x ?? 0));
          const minX = sorted[0].worldPosition?.x ?? 0;
          const maxX = sorted[sorted.length - 1].worldPosition?.x ?? 0;
          const step = (maxX - minX) / (sorted.length - 1);
          sorted.forEach((n, i) => n.setWorldPosition(new Vec3(minX + step * i, n.worldPosition?.y ?? 0, n.worldPosition?.z ?? 0)));
          break;
        }
        case 'distribute_v': {
          const sorted = nodes.slice().sort((a, b) => (a.worldPosition?.y ?? 0) - (b.worldPosition?.y ?? 0));
          const minY = sorted[0].worldPosition?.y ?? 0;
          const maxY = sorted[sorted.length - 1].worldPosition?.y ?? 0;
          const step = (maxY - minY) / (sorted.length - 1);
          sorted.forEach((n, i) => n.setWorldPosition(new Vec3(n.worldPosition?.x ?? 0, minY + step * i, n.worldPosition?.z ?? 0)));
          break;
        }
        default: return { error: `未知对齐方式: ${alignment}，支持: left, right, center_h, top, bottom, center_v, distribute_h, distribute_v` };
      }
      const result: Record<string, unknown> = { success: true, alignment, nodeCount: nodes.length, uuids };
      return (async () => {
        for (const n of nodes) {
          const nUuid = n.uuid ?? n._id ?? '';
          const pos = n.position ?? { x: 0, y: 0, z: 0 };
          await deps.notifyEditorProperty(nUuid, 'position', { type: 'cc.Vec3', value: { x: pos.x, y: pos.y, z: pos.z } });
        }
        result._inspectorRefreshed = true;
        return result;
      })();
    }],

    // ─── audio_setup: add AudioSource with clip and config ───────────────
    ['audio_setup', (_self, scene, p) => {
      const cc = getCC();
      const { js } = cc;
      const uuid = String(p.uuid ?? '');
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      const AudioSource = js.getClassByName('AudioSource') || js.getClassByName('cc.AudioSource');
      if (!AudioSource) return { error: 'AudioSource 组件不可用' };
      let comp = r.node.getComponent(AudioSource) as Record<string, unknown> | null;
      if (!comp) comp = r.node.addComponent(AudioSource) as Record<string, unknown>;
      if (!comp) return { error: '无法添加 AudioSource 组件' };
      const changed: Record<string, unknown> = {};
      if (p.volume !== undefined) { comp.volume = Number(p.volume); changed.volume = comp.volume; }
      if (p.loop !== undefined) { comp.loop = Boolean(p.loop); changed.loop = comp.loop; }
      if (p.playOnAwake !== undefined) { comp.playOnAwake = Boolean(p.playOnAwake); changed.playOnAwake = comp.playOnAwake; }
      if (p.clip) comp.clip = p.clip;
      const result: Record<string, unknown> = { success: true, uuid, name: r.node.name, volume: comp.volume, loop: comp.loop, playOnAwake: comp.playOnAwake };
      return (async () => {
        for (const [prop, val] of Object.entries(changed)) {
          const dumpType = typeof val === 'boolean' ? 'boolean' : 'number';
          await deps.notifyEditorComponentProperty(uuid, r.node, comp, prop, { type: dumpType, value: val });
        }
        if (Object.keys(changed).length > 0) result._inspectorRefreshed = true;
        return result;
      })();
    }],

    // ─── setup_physics_world: configure 2D/3D physics world ──────────────
    ['setup_physics_world', (_self, _scene, p) => {
      const cc = getCC();
      const { js } = cc;
      const warnings: string[] = [];
      // Try PhysicsSystem2D
      const PS2D = js.getClassByName('PhysicsSystem2D') || js.getClassByName('cc.PhysicsSystem2D');
      const PS3D = js.getClassByName('PhysicsSystem') || js.getClassByName('cc.PhysicsSystem');
      const mode = String(p.mode ?? 'auto');
      const applied: Record<string, unknown> = {};
      if ((mode === '2d' || mode === 'auto') && PS2D) {
        try {
          const inst = (PS2D as Record<string, unknown>).instance as Record<string, unknown> | undefined;
          if (inst) {
            if (p.gravity) {
              const g = p.gravity as { x?: number; y?: number };
              inst.gravity = { x: g.x ?? 0, y: g.y ?? -320 };
              applied.gravity2D = inst.gravity;
            }
            if (p.allowSleep !== undefined) { inst.allowSleep = Boolean(p.allowSleep); applied.allowSleep2D = inst.allowSleep; }
            if (p.fixedTimeStep !== undefined) { inst.fixedTimeStep = Number(p.fixedTimeStep); applied.fixedTimeStep2D = inst.fixedTimeStep; }
            applied.physics2D = true;
          } else { warnings.push('PhysicsSystem2D.instance 不可用'); }
        } catch (e) { logIgnored(ErrorCategory.ENGINE_API, 'PhysicsSystem2D 配置失败', e); warnings.push('PhysicsSystem2D 配置失败'); }
      }
      if ((mode === '3d' || mode === 'auto') && PS3D) {
        try {
          const inst = (PS3D as Record<string, unknown>).instance as Record<string, unknown> | undefined;
          if (inst) {
            if (p.gravity) {
              const g = p.gravity as { x?: number; y?: number; z?: number };
              const Vec3 = cc.Vec3;
              inst.gravity = new Vec3(g.x ?? 0, g.y ?? -10, g.z ?? 0);
              applied.gravity3D = p.gravity;
            }
            if (p.allowSleep !== undefined) { inst.allowSleep = Boolean(p.allowSleep); applied.allowSleep3D = inst.allowSleep; }
            if (p.fixedTimeStep !== undefined) { inst.fixedTimeStep = Number(p.fixedTimeStep); applied.fixedTimeStep3D = inst.fixedTimeStep; }
            applied.physics3D = true;
          } else { warnings.push('PhysicsSystem.instance 不可用'); }
        } catch (e) { logIgnored(ErrorCategory.ENGINE_API, 'PhysicsSystem 配置失败', e); warnings.push('PhysicsSystem 配置失败'); }
      }
      if (!applied.physics2D && !applied.physics3D) return { error: '物理系统不可用（2D 和 3D 均未找到）', warnings };
      return { success: true, ...applied, ...(warnings.length ? { warnings } : {}) };
    }],

    // ─── create_skeleton_node: Spine/DragonBones node setup ──────────────
    ['create_skeleton_node', (_self, scene, p) => {
      const cc = getCC();
      const { Node, js } = cc;
      const parentRef = String(p.parentUuid ?? '');
      const resolved = deps.resolveParent(scene, parentRef);
      if ('error' in resolved) return resolved;
      const skeletonType = String(p.skeletonType ?? 'spine').toLowerCase();
      const nodeName = String(p.name ?? `${skeletonType}_node`);
      const node = new Node(nodeName);
      resolved.node.addChild(node);
      const uuid = node.uuid || (node as unknown as { _id: string })._id;
      const compName = skeletonType === 'spine' ? 'sp.Skeleton' : skeletonType === 'dragonbones' ? 'dragonBones.ArmatureDisplay' : '';
      if (!compName) return { error: `未知骨骼类型: ${skeletonType}，支持: spine, dragonbones` };
      const cls = js.getClassByName(compName);
      if (!cls) return { error: `${compName} 组件不可用，请确认项目中已启用对应模块` };
      const comp = node.addComponent(cls) as Record<string, unknown>;
      if (!comp) return { error: `无法添加 ${compName} 组件` };
      const props = p.properties as Record<string, unknown> | undefined;
      if (props) {
        for (const [key, val] of Object.entries(props)) {
          try { comp[key] = val; } catch (e) { logIgnored(ErrorCategory.PROPERTY_ASSIGN, `骨骼组件属性 "${key}" 赋值失败`, e); }
        }
      }
      const result: Record<string, unknown> = { success: true, uuid: uuid || '', name: nodeName, skeletonType, component: compName };
      return (async () => {
        if (uuid) await deps.notifyEditorProperty(uuid, 'active', { type: 'boolean', value: node.active });
        result._inspectorRefreshed = true;
        return result;
      })();
    }],

    // ─── generate_tilemap: create TiledMap node ──────────────────────────
    ['generate_tilemap', (_self, scene, p) => {
      const cc = getCC();
      const { Node, js } = cc;
      const parentRef = String(p.parentUuid ?? '');
      const resolved = deps.resolveParent(scene, parentRef);
      if ('error' in resolved) return resolved;
      const nodeName = String(p.name ?? 'TiledMap');
      const node = new Node(nodeName);
      resolved.node.addChild(node);
      const uuid = node.uuid || (node as unknown as { _id: string })._id;
      const TiledMap = js.getClassByName('TiledMap') || js.getClassByName('cc.TiledMap');
      if (!TiledMap) return { error: 'TiledMap 组件不可用' };
      const comp = node.addComponent(TiledMap) as Record<string, unknown>;
      if (!comp) return { error: '无法添加 TiledMap 组件' };
      if (p.tmxAsset) comp.tmxAsset = p.tmxAsset;
      const result: Record<string, unknown> = { success: true, uuid: uuid || '', name: nodeName, component: 'TiledMap', hasTmxAsset: !!p.tmxAsset };
      return (async () => {
        if (uuid) await deps.notifyEditorProperty(uuid, 'active', { type: 'boolean', value: node.active });
        result._inspectorRefreshed = true;
        return result;
      })();
    }],
    // ─── bind_event: attach UI event handler to component ────────────────
    ['bind_event', (_self, scene, p) => {
      const cc = getCC();
      const { js } = cc;
      const uuid = String(p.uuid ?? '');
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      const node = r.node;

      const eventType = String(p.eventType ?? 'click');
      const targetUuid = String(p.targetUuid ?? uuid);
      const handler = String(p.handler ?? '');
      const componentName = String(p.component ?? '');
      const customData = p.customEventData !== undefined ? String(p.customEventData) : '';

      if (!handler) return { error: '缺少 handler 参数（回调方法名）' };
      if (!componentName) return { error: '缺少 component 参数（目标脚本组件名）' };

      const EventHandler = js.getClassByName('cc.Component.EventHandler') || js.getClassByName('EventHandler');
      if (!EventHandler) return { error: 'Component.EventHandler 类不可用' };

      const eh = new (EventHandler as new () => Record<string, unknown>)();
      eh.target = deps.findNodeByUuid(scene, targetUuid) || node;
      eh.component = componentName;
      eh.handler = handler;
      if (customData) eh.customEventData = customData;

      const EVENT_PROP_MAP: Record<string, { comp: string; prop: string }> = {
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
      if (!mapping) return { error: `未知的事件类型: ${eventType}。支持: ${Object.keys(EVENT_PROP_MAP).join(', ')}` };

      const CompClass = js.getClassByName(mapping.comp) || js.getClassByName('cc.' + mapping.comp);
      if (!CompClass) return { error: `组件 ${mapping.comp} 不可用` };

      const comp = node.getComponent(CompClass) as Record<string, unknown> | null;
      if (!comp) return { error: `节点上没有 ${mapping.comp} 组件，请先添加` };

      const events = (comp[mapping.prop] as unknown[]) || [];
      events.push(eh);
      comp[mapping.prop] = events;

      const result: Record<string, unknown> = {
        success: true, uuid, eventType,
        targetComponent: componentName, handler,
        eventCount: events.length,
      };
      return (async () => {
        await deps.notifyEditorComponentProperty(uuid, node, comp, mapping.prop, { type: 'array', value: events });
        result._inspectorRefreshed = true;
        return result;
      })();
    }],

    // ─── unbind_event: remove event handler from component ─────────────
    ['unbind_event', (_self, scene, p) => {
      const cc = getCC();
      const { js } = cc;
      const uuid = String(p.uuid ?? '');
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      const node = r.node;

      const eventType = String(p.eventType ?? 'click');
      const handler = p.handler !== undefined ? String(p.handler) : null;
      const eventIndex = p.eventIndex !== undefined ? Number(p.eventIndex) : -1;

      const EVENT_PROP_MAP: Record<string, { comp: string; prop: string }> = {
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
      if (!mapping) return { error: `未知的事件类型: ${eventType}` };

      const CompClass = js.getClassByName(mapping.comp) || js.getClassByName('cc.' + mapping.comp);
      if (!CompClass) return { error: `组件 ${mapping.comp} 不可用` };

      const comp = node.getComponent(CompClass) as Record<string, unknown> | null;
      if (!comp) return { error: `节点上没有 ${mapping.comp} 组件` };

      const events = (comp[mapping.prop] as Array<Record<string, unknown>>) || [];
      let removedCount: number;

      if (eventIndex >= 0 && eventIndex < events.length) {
        events.splice(eventIndex, 1);
        removedCount = 1;
      } else if (handler) {
        const filtered = events.filter(e => String(e.handler ?? '') !== handler);
        removedCount = events.length - filtered.length;
        comp[mapping.prop] = filtered;
      } else {
        removedCount = events.length;
        comp[mapping.prop] = [];
      }

      const remaining = (comp[mapping.prop] as unknown[]);
      const result: Record<string, unknown> = { success: true, uuid, eventType, removedCount, remainingCount: remaining.length };
      return (async () => {
        await deps.notifyEditorComponentProperty(uuid, node, comp, mapping.prop, { type: 'array', value: remaining });
        result._inspectorRefreshed = true;
        return result;
      })();
    }],

    // ─── list_events: enumerate event bindings on a node ────────────────
    ['list_events', (_self, scene, p) => {
      const cc = getCC();
      const { js } = cc;
      const uuid = String(p.uuid ?? '');
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      const node = r.node;

      const EVENT_PROP_MAP: Record<string, { comp: string; prop: string }> = {
        click: { comp: 'Button', prop: 'clickEvents' },
        toggle: { comp: 'Toggle', prop: 'checkEvents' },
        slider: { comp: 'Slider', prop: 'slideEvents' },
        editbox_changed: { comp: 'EditBox', prop: 'textChanged' },
        scrollview_scroll: { comp: 'ScrollView', prop: 'scrollEvents' },
        pageview_change: { comp: 'PageView', prop: 'pageEvents' },
      };

      const result: Array<Record<string, unknown>> = [];
      for (const [eventType, mapping] of Object.entries(EVENT_PROP_MAP)) {
        const CompClass = js.getClassByName(mapping.comp) || js.getClassByName('cc.' + mapping.comp);
        if (!CompClass) continue;
        const comp = node.getComponent(CompClass) as Record<string, unknown> | null;
        if (!comp) continue;
        const events = (comp[mapping.prop] as Array<Record<string, unknown>>) || [];
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
      const cc = getCC();
      const { Vec3 } = cc;
      const uuid = String(p.uuid ?? '');
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      const node = r.node;

      const resetPos = p.resetPosition !== false;
      const resetRot = p.resetRotation !== false;
      const resetScale = p.resetScale !== false;

      if (resetPos) node.setPosition(new Vec3(0, 0, 0));
      if (resetRot) node.setRotationFromEuler(0, 0, 0);
      if (resetScale) node.setScale(new Vec3(1, 1, 1));

      const result: Record<string, unknown> = {
        success: true, uuid, name: node.name,
        reset: { position: resetPos, rotation: resetRot, scale: resetScale },
      };
      return (async () => {
        if (resetPos && await deps.notifyEditorProperty(uuid, 'position', { type: 'cc.Vec3', value: { x: 0, y: 0, z: 0 } })) {
          result._inspectorRefreshed = true;
        }
        if (resetRot) await deps.notifyEditorProperty(uuid, 'rotation', { type: 'cc.Vec3', value: { x: 0, y: 0, z: 0 } });
        if (resetScale) await deps.notifyEditorProperty(uuid, 'scale', { type: 'cc.Vec3', value: { x: 1, y: 1, z: 1 } });
        return result;
      })();
    }],

    // ─── set_anchor_point: set UITransform anchorPoint directly ─────────
    ['set_anchor_point', (_self, scene, p) => {
      const { js } = getCC();
      const uuid = String(p.uuid ?? '');
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      const UITransform = js.getClassByName('UITransform') || js.getClassByName('cc.UITransform');
      if (!UITransform) return { error: 'UITransform 组件类不可用' };
      const ut = r.node.getComponent(UITransform) as Record<string, unknown> | null;
      if (!ut) return { error: `节点 "${r.node.name}" 上没有 UITransform 组件` };
      const ax = Number(p.anchorX ?? p.x ?? 0.5);
      const ay = Number(p.anchorY ?? p.y ?? 0.5);
      const Vec2 = getCC().Vec2;
      if (typeof ut.setAnchorPoint === 'function') {
        (ut as { setAnchorPoint: (v: unknown) => void }).setAnchorPoint(new Vec2(ax, ay));
      } else {
        ut.anchorPoint = new Vec2(ax, ay);
      }
      const result: Record<string, unknown> = { success: true, uuid, name: r.node.name, anchorPoint: { x: ax, y: ay } };
      return (async () => {
        if (await deps.notifyEditorComponentProperty(uuid, r.node, ut, 'anchorPoint', {
          type: 'cc.Vec2', value: { x: ax, y: ay },
        })) { result._inspectorRefreshed = true; }
        return result;
      })();
    }],

    // ─── set_content_size: set UITransform contentSize directly ───────
    ['set_content_size', (_self, scene, p) => {
      const { js } = getCC();
      const uuid = String(p.uuid ?? '');
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      const UITransform = js.getClassByName('UITransform') || js.getClassByName('cc.UITransform');
      if (!UITransform) return { error: 'UITransform 组件类不可用' };
      const ut = r.node.getComponent(UITransform) as Record<string, unknown> | null;
      if (!ut) return { error: `节点 "${r.node.name}" 上没有 UITransform 组件` };
      const w = Number(p.width ?? 100);
      const h = Number(p.height ?? 100);
      const Size = js.getClassByName('Size') || js.getClassByName('cc.Size');
      if (typeof ut.setContentSize === 'function') {
        if (Size) {
          (ut as { setContentSize: (v: unknown) => void }).setContentSize(new Size(w, h));
        } else {
          (ut as { setContentSize: (w: number, h: number) => void }).setContentSize(w, h);
        }
      } else {
        ut.contentSize = Size ? new Size(w, h) : { width: w, height: h };
      }
      const result: Record<string, unknown> = { success: true, uuid, name: r.node.name, contentSize: { width: w, height: h } };
      return (async () => {
        if (await deps.notifyEditorComponentProperty(uuid, r.node, ut, 'contentSize', {
          type: 'cc.Size', value: { width: w, height: h },
        })) { result._inspectorRefreshed = true; }
        return result;
      })();
    }],

    // ─── batch_set_property: set same property on multiple nodes ──────
    ['batch_set_property', (self, scene, p) => {
      const uuids = p.uuids as string[] | undefined;
      if (!Array.isArray(uuids) || uuids.length === 0) return { error: '缺少 uuids 数组' };
      const component = String(p.component ?? '');
      const property = String(p.property ?? '');
      const value = p.value;
      if (!component || !property) return { error: '缺少 component 或 property 参数' };
      if (value === undefined) return { error: '缺少 value 参数' };
      const results: Array<Record<string, unknown>> = [];
      let successCount = 0;
      for (const uuid of uuids) {
        try {
          const res = self.setComponentProperty(uuid, component, property, value) as Record<string, unknown>;
          results.push({ uuid, ...res });
          if (res.success) successCount++;
        } catch (err: unknown) {
          results.push({ uuid, error: err instanceof Error ? err.message : String(err) });
        }
      }
      return { success: successCount > 0, totalNodes: uuids.length, successCount, failCount: uuids.length - successCount, results };
    }],

    // ─── group_nodes: create parent node and reparent selected nodes ──
    ['group_nodes', (self, scene, p) => {
      const { Node } = getCC();
      const uuids = p.uuids as string[] | undefined;
      if (!Array.isArray(uuids) || uuids.length < 1) return { error: '缺少 uuids 数组（至少 1 个节点）' };
      const groupName = String(p.name ?? 'Group');
      const parentRef = String(p.parentUuid ?? '');
      const firstNode = deps.findNodeByUuid(scene, uuids[0]);
      if (!firstNode) return { error: `未找到节点: ${uuids[0]}` };
      let parent: CocosNode;
      if (parentRef) {
        const resolved = deps.resolveParent(scene, parentRef);
        if ('error' in resolved) return resolved;
        parent = resolved.node;
      } else {
        parent = firstNode.parent || scene;
      }
      const groupNode = new Node(groupName);
      parent.addChild(groupNode);
      const groupUuid = groupNode.uuid || (groupNode as unknown as { _id: string })._id;
      // Reparent all nodes under the group
      const moved: Array<{ uuid: string; name: string }> = [];
      const errors: string[] = [];
      for (const uuid of uuids) {
        const node = deps.findNodeByUuid(scene, uuid);
        if (!node) { errors.push(`未找到节点: ${uuid}`); continue; }
        node.setParent(groupNode);
        moved.push({ uuid: node.uuid || node._id || uuid, name: node.name });
      }
      const result: Record<string, unknown> = {
        success: true,
        groupUuid, groupName,
        movedCount: moved.length,
        moved,
        ...(errors.length ? { errors } : {}),
      };
      return (async () => {
        if (await deps.notifyEditorProperty(groupUuid, 'active', { type: 'boolean', value: groupNode.active })) {
          result._inspectorRefreshed = true;
        }
        return result;
      })();
    }],

    // ─── reset_node_properties: reset all component properties to defaults ─
    ['reset_node_properties', (_self, scene, p) => {
      const uuid = String(p.uuid ?? '');
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      const node = r.node;

      const targetComp = p.component ? String(p.component) : '';
      const components = node._components || [];
      let resetCount = 0;
      const resetResults: Array<Record<string, unknown>> = [];

      for (const comp of components) {
        const compName = comp.constructor?.name ?? comp.__classname__ ?? 'Unknown';
        if (targetComp && compName !== targetComp && `cc.${compName}` !== targetComp) continue;

        const CompClass = comp.constructor as (new () => Record<string, unknown>) | undefined;
        if (!CompClass) continue;

        try {
          const defaultInstance = new CompClass();
          const keys = Object.keys(defaultInstance);
          let propsReset = 0;
          for (const key of keys) {
            if (key.startsWith('__') || key === 'node' || key === 'uuid' || key === '_id' || key === 'enabled') continue;
            try {
              (comp as Record<string, unknown>)[key] = (defaultInstance as Record<string, unknown>)[key];
              propsReset++;
            } catch (e) { logIgnored(ErrorCategory.PROPERTY_ASSIGN, `属性 "${key}" 可能为只读，重置跳过`, e); }
          }
          resetResults.push({ component: compName, propertiesReset: propsReset });
          resetCount++;
        } catch (e) {
          logIgnored(ErrorCategory.REFLECTION, `组件 "${compName}" 无法创建默认实例`, e);
          resetResults.push({ component: compName, error: '无法创建默认实例' });
        }
      }

      const result: Record<string, unknown> = {
        success: true, uuid, name: node.name,
        componentsReset: resetCount,
        details: resetResults,
      };
      if (resetCount > 0) {
        return (async () => {
          await deps.notifyEditorProperty(uuid, 'active', { type: 'boolean', value: node.active });
          result._inspectorRefreshed = true;
          return result;
        })();
      }
      return result;
    }],
    ['set_camera_property', (_self, scene, p) => {
      const cc = getCC();
      const { Camera } = cc;
      const uuid = String(p.uuid ?? '');
      if (!uuid) return { error: '缺少 uuid 参数，需指定摄像机节点 uuid' };
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      const cam = (r.node as Record<string, unknown> & CocosNode).getComponent?.(Camera) as Record<string, unknown> | null;
      if (!cam) return { error: `节点 ${r.node.name} 上没有 Camera 组件` };
      const changed: Record<string, unknown> = {};
      // fov
      if (p.fov !== undefined) { cam.fov = Number(p.fov); changed.fov = cam.fov; }
      // near / far
      if (p.near !== undefined) { cam.near = Number(p.near); changed.near = cam.near; }
      if (p.far !== undefined) { cam.far = Number(p.far); changed.far = cam.far; }
      // orthoHeight
      if (p.orthoHeight !== undefined) { cam.orthoHeight = Number(p.orthoHeight); changed.orthoHeight = cam.orthoHeight; }
      // projection: 0=ORTHO, 1=PERSPECTIVE
      if (p.projection !== undefined) { cam.projection = Number(p.projection); changed.projection = cam.projection; }
      // clearFlags: 1=SOLID_COLOR, 2=DEPTH_ONLY, 4=DONT_CLEAR, 7=ALL(SKYBOX)
      if (p.clearFlags !== undefined) { cam.clearFlags = Number(p.clearFlags); changed.clearFlags = cam.clearFlags; }
      // priority
      if (p.priority !== undefined) { cam.priority = Number(p.priority); changed.priority = cam.priority; }
      // visibility (layer mask)
      if (p.visibility !== undefined) { cam.visibility = Number(p.visibility); changed.visibility = cam.visibility; }
      // clearDepth / clearStencil
      if (p.clearDepth !== undefined) { cam.clearDepth = Number(p.clearDepth); changed.clearDepth = cam.clearDepth; }
      if (p.clearStencil !== undefined) { cam.clearStencil = Number(p.clearStencil); changed.clearStencil = cam.clearStencil; }
      // aperture / shutter / iso (physical camera)
      if (p.aperture !== undefined) { cam.aperture = Number(p.aperture); changed.aperture = cam.aperture; }
      if (p.shutter !== undefined) { cam.shutter = Number(p.shutter); changed.shutter = cam.shutter; }
      if (p.iso !== undefined) { cam.iso = Number(p.iso); changed.iso = cam.iso; }
      // clearColor {r,g,b,a} 0-255
      if (p.clearColor && typeof p.clearColor === 'object') {
        const cc2 = p.clearColor as { r?: number; g?: number; b?: number; a?: number };
        const Color = (cc as { Color?: new (r: number, g: number, b: number, a?: number) => unknown }).Color;
        if (Color) {
          const col = new Color(
            Math.max(0, Math.min(255, Number(cc2.r ?? 0))),
            Math.max(0, Math.min(255, Number(cc2.g ?? 0))),
            Math.max(0, Math.min(255, Number(cc2.b ?? 0))),
            Math.max(0, Math.min(255, Number(cc2.a ?? 255))),
          );
          cam.clearColor = col;
          changed.clearColor = { r: cc2.r, g: cc2.g, b: cc2.b, a: cc2.a };
        }
      }
      // rect {x,y,width,height} 0-1
      if (p.rect && typeof p.rect === 'object') {
        const rc = p.rect as { x?: number; y?: number; width?: number; height?: number };
        const Rect = (cc as { Rect?: new (x: number, y: number, w: number, h: number) => unknown }).Rect;
        if (Rect) {
          cam.rect = new Rect(
            Number(rc.x ?? 0), Number(rc.y ?? 0),
            Number(rc.width ?? 1), Number(rc.height ?? 1),
          );
        } else {
          cam.rect = { x: Number(rc.x ?? 0), y: Number(rc.y ?? 0), width: Number(rc.width ?? 1), height: Number(rc.height ?? 1) };
        }
        changed.rect = rc;
      }
      if (Object.keys(changed).length === 0) return { error: '未指定任何要修改的摄像机属性' };
      const result: Record<string, unknown> = { success: true, uuid, name: r.node.name, changed };
      return (async () => {
        for (const prop of Object.keys(changed)) {
          const val = changed[prop];
          if (typeof val === 'number' || typeof val === 'boolean') {
            if (await deps.notifyEditorComponentProperty(uuid, r.node, cam, prop, {
              type: typeof val === 'boolean' ? 'boolean' : 'number', value: val,
            })) { result._inspectorRefreshed = true; }
          }
        }
        return result;
      })();
    }],
    ['create_camera', (_self, scene, p) => {
      const cc = getCC();
      const { Node, Camera } = cc;
      const name = String(p.name ?? 'Camera');
      const node = new Node(name);
      // Parent
      const parentUuid = String(p.parentUuid ?? '');
      if (parentUuid) {
        const pr = requireNode(scene, parentUuid);
        if ('error' in pr) return pr;
        pr.node.addChild(node);
      } else {
        scene.addChild(node);
      }
      // Add Camera component
      const cam = node.addComponent(Camera) as Record<string, unknown>;
      if (!cam) return { error: '添加 Camera 组件失败，当前 Cocos 版本可能不支持' };
      // Apply optional properties
      if (p.fov !== undefined) cam.fov = Number(p.fov);
      if (p.near !== undefined) cam.near = Number(p.near);
      if (p.far !== undefined) cam.far = Number(p.far);
      if (p.orthoHeight !== undefined) cam.orthoHeight = Number(p.orthoHeight);
      if (p.projection !== undefined) cam.projection = Number(p.projection);
      if (p.clearFlags !== undefined) cam.clearFlags = Number(p.clearFlags);
      if (p.priority !== undefined) cam.priority = Number(p.priority);
      if (p.visibility !== undefined) cam.visibility = Number(p.visibility);
      // Set position
      const hasPos = p.x !== undefined || p.y !== undefined || p.z !== undefined;
      if (hasPos) {
        const Vec3 = cc.Vec3;
        node.setWorldPosition(new Vec3(Number(p.x ?? 0), Number(p.y ?? 0), Number(p.z ?? 10)));
      }
      const nodeUuid = node.uuid || node._id || '';
      const result: Record<string, unknown> = { success: true, uuid: nodeUuid, name, component: 'Camera' };
      return (async () => {
        if (nodeUuid && await deps.notifyEditorProperty(nodeUuid, 'active', { type: 'boolean', value: node.active })) {
          result._inspectorRefreshed = true;
        }
        return result;
      })();
    }],
    ['set_material_property', (_self, scene, p) => {
      const cc = getCC();
      const uuid = String(p.uuid ?? '');
      if (!uuid) return { error: '缺少 uuid 参数' };
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      const slotIndex = Number(p.materialIndex ?? 0);
      const compName = String(p.component ?? '');
      // Find target renderer component
      const comps = r.node._components || [];
      let renderer: Record<string, unknown> | null = null;
      let resolvedCompName = '';
      for (const comp of comps) {
        const cn = comp.constructor?.name ?? comp.__classname__ ?? '';
        if (compName && cn !== compName && `cc.${cn}` !== compName) continue;
        const c = comp as Record<string, unknown>;
        if (Array.isArray(c.sharedMaterials) || c.customMaterial) {
          renderer = c;
          resolvedCompName = cn;
          break;
        }
      }
      if (!renderer) return { error: `节点 ${r.node.name} 上未找到渲染器组件${compName ? ` (${compName})` : ''}` };
      // Get material instance (clone if shared)
      const sharedMats = renderer.sharedMaterials as Array<Record<string, unknown>> | null;
      let mat: Record<string, unknown> | null = null;
      if (Array.isArray(sharedMats) && sharedMats[slotIndex]) {
        mat = sharedMats[slotIndex];
      } else if (renderer.customMaterial) {
        mat = renderer.customMaterial as Record<string, unknown>;
      }
      if (!mat) return { error: `材质槽位 ${slotIndex} 为空` };
      // Try to get a material instance (clone for safe editing)
      const getMaterialInstance = renderer.getMaterialInstance as ((idx: number) => Record<string, unknown>) | undefined;
      if (typeof getMaterialInstance === 'function') {
        try { mat = getMaterialInstance.call(renderer, slotIndex); } catch (e) { logIgnored(ErrorCategory.ENGINE_API, '获取材质实例失败，使用共享材质', e); }
      }
      // Set uniform properties
      const uniforms = p.uniforms as Record<string, unknown> | undefined;
      if (!uniforms || typeof uniforms !== 'object') return { error: '缺少 uniforms 参数（如 {"mainColor": {"r":255,"g":0,"b":0,"a":255}}）' };
      const setProperty = mat.setProperty as ((name: string, val: unknown, passIdx?: number) => void) | undefined;
      if (typeof setProperty !== 'function') return { error: '该材质不支持 setProperty 方法' };
      const Color = (cc as { Color?: new (r: number, g: number, b: number, a?: number) => unknown }).Color;
      const Vec4 = (cc as { Vec4?: new (x: number, y: number, z: number, w: number) => unknown }).Vec4;
      const changed: Record<string, unknown> = {};
      for (const [uName, uVal] of Object.entries(uniforms)) {
        try {
          if (uVal && typeof uVal === 'object') {
            const v = uVal as Record<string, number>;
            // Detect color-like ({r,g,b,a}) vs vec-like ({x,y,z,w})
            if ('r' in v && Color) {
              const col = new Color(
                Math.max(0, Math.min(255, Number(v.r ?? 0))),
                Math.max(0, Math.min(255, Number(v.g ?? 0))),
                Math.max(0, Math.min(255, Number(v.b ?? 0))),
                Math.max(0, Math.min(255, Number(v.a ?? 255))),
              );
              setProperty.call(mat, uName, col);
              changed[uName] = v;
            } else if ('x' in v && Vec4) {
              const vec = new Vec4(Number(v.x ?? 0), Number(v.y ?? 0), Number(v.z ?? 0), Number(v.w ?? 0));
              setProperty.call(mat, uName, vec);
              changed[uName] = v;
            } else {
              setProperty.call(mat, uName, uVal);
              changed[uName] = uVal;
            }
          } else {
            setProperty.call(mat, uName, uVal);
            changed[uName] = uVal;
          }
        } catch (err: unknown) {
          changed[uName] = { error: err instanceof Error ? err.message : String(err) };
        }
      }
      const result: Record<string, unknown> = { success: true, uuid, name: r.node.name, component: resolvedCompName, materialIndex: slotIndex, changed };
      return (async () => {
        if (renderer) await deps.notifyEditorComponentProperty(uuid, r.node, renderer, 'sharedMaterials', { type: 'array', value: renderer.sharedMaterials });
        result._inspectorRefreshed = true;
        return result;
      })();
    }],
    ['assign_builtin_material', (_self, scene, p) => {
      const cc = getCC();
      const uuid = String(p.uuid ?? '');
      if (!uuid) return { error: '缺少 uuid 参数' };
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      const effectName = String(p.effectName ?? 'builtin-standard');
      const slotIndex = Number(p.materialIndex ?? 0);
      const compName = String(p.component ?? '');
      // Find renderer
      const comps = r.node._components || [];
      let renderer: Record<string, unknown> | null = null;
      let resolvedCompName = '';
      for (const comp of comps) {
        const cn = comp.constructor?.name ?? comp.__classname__ ?? '';
        if (compName && cn !== compName && `cc.${cn}` !== compName) continue;
        const c = comp as Record<string, unknown>;
        if (Array.isArray(c.sharedMaterials) || c.customMaterial || typeof c.setMaterial === 'function') {
          renderer = c;
          resolvedCompName = cn;
          break;
        }
      }
      if (!renderer) return { error: `节点 ${r.node.name} 上未找到渲染器组件${compName ? ` (${compName})` : ''}` };
      const Mat = (cc as { Material?: { getBuiltinMaterial?: (name: string) => unknown } }).Material;
      if (!Mat?.getBuiltinMaterial) return { error: '当前 Cocos 版本不支持 Material.getBuiltinMaterial' };
      const builtinMat = Mat.getBuiltinMaterial(effectName);
      if (!builtinMat) return { error: `未找到内置材质: ${effectName}` };
      // Clone to avoid mutating the shared builtin
      const clone = typeof (builtinMat as { clone?: () => unknown }).clone === 'function'
        ? (builtinMat as { clone: () => unknown }).clone()
        : builtinMat;
      // Apply optional color
      if (p.color && typeof p.color === 'object') {
        const cv = p.color as { r?: number; g?: number; b?: number; a?: number };
        const Color = (cc as { Color?: new (r: number, g: number, b: number, a?: number) => unknown }).Color;
        if (Color && typeof (clone as { setProperty?: (k: string, v: unknown) => void }).setProperty === 'function') {
          const col = new Color(
            Math.max(0, Math.min(255, Number(cv.r ?? 255))),
            Math.max(0, Math.min(255, Number(cv.g ?? 255))),
            Math.max(0, Math.min(255, Number(cv.b ?? 255))),
            Math.max(0, Math.min(255, Number(cv.a ?? 255))),
          );
          (clone as { setProperty: (k: string, v: unknown) => void }).setProperty('mainColor', col);
        }
      }
      const setMaterial = renderer.setMaterial as ((mat: unknown, idx: number) => void) | undefined;
      if (typeof setMaterial === 'function') {
        setMaterial.call(renderer, clone, slotIndex);
      } else {
        // Fallback: directly set sharedMaterials array
        const mats = renderer.sharedMaterials as unknown[] | null;
        if (Array.isArray(mats)) {
          mats[slotIndex] = clone;
          renderer.sharedMaterials = [...mats];
        }
      }
      const result: Record<string, unknown> = { success: true, uuid, name: r.node.name, component: resolvedCompName, effectName, materialIndex: slotIndex };
      return (async () => {
        if (renderer) await deps.notifyEditorComponentProperty(uuid, r.node, renderer, 'sharedMaterials', { type: 'array', value: renderer.sharedMaterials });
        result._inspectorRefreshed = true;
        return result;
      })();
    }],
    // ─── P0: create_light — create a light node ──────────────────────────
    ['create_light', (_self, scene, p) => {
      const cc = getCC();
      const { Node, js } = cc;
      const lightType = String(p.lightType ?? 'directional').toLowerCase();
      const LIGHT_MAP: Record<string, string> = {
        directional: 'DirectionalLight', spot: 'SpotLight', sphere: 'SphereLight', point: 'SphereLight',
      };
      const compName = LIGHT_MAP[lightType];
      if (!compName) return { error: `不支持的灯光类型: ${lightType}，可用: directional, spot, sphere, point` };
      const cls = js.getClassByName(compName) || js.getClassByName('cc.' + compName);
      if (!cls) return { error: `当前 Cocos 版本不支持 ${compName} 组件` };
      const name = String(p.name ?? compName);
      const node = new Node(name);
      // Parent
      const parentUuid = String(p.parentUuid ?? '');
      if (parentUuid) {
        const pr = requireNode(scene, parentUuid);
        if ('error' in pr) return pr;
        pr.node.addChild(node);
      } else {
        scene.addChild(node);
      }
      const comp = node.addComponent(cls) as Record<string, unknown>;
      if (!comp) return { error: `添加 ${compName} 组件失败` };
      // Set position
      const hasPos = p.x !== undefined || p.y !== undefined || p.z !== undefined;
      if (hasPos) {
        node.setWorldPosition(new cc.Vec3(Number(p.x ?? 0), Number(p.y ?? 10), Number(p.z ?? 0)));
      }
      // Set rotation
      if (p.rotationX !== undefined || p.rotationY !== undefined || p.rotationZ !== undefined) {
        node.setRotationFromEuler(Number(p.rotationX ?? 0), Number(p.rotationY ?? 0), Number(p.rotationZ ?? 0));
      }
      // Apply light properties
      const propMap: Record<string, string[]> = {
        directional: ['illuminance', 'useColorTemperature', 'colorTemperature', 'shadowEnabled', 'shadowPcf', 'shadowBias', 'shadowNormalBias', 'shadowSaturation', 'shadowDistance'],
        spot: ['luminance', 'range', 'spotAngle', 'size', 'useColorTemperature', 'colorTemperature', 'shadowEnabled', 'shadowPcf', 'shadowBias', 'shadowNormalBias'],
        sphere: ['luminance', 'range', 'size', 'useColorTemperature', 'colorTemperature', 'shadowEnabled', 'shadowPcf', 'shadowBias', 'shadowNormalBias'],
        point: ['luminance', 'range', 'size', 'useColorTemperature', 'colorTemperature', 'shadowEnabled'],
      };
      const changed: Record<string, unknown> = {};
      for (const prop of (propMap[lightType] || [])) {
        if (p[prop] !== undefined) { comp[prop] = typeof p[prop] === 'boolean' ? p[prop] : Number(p[prop]); changed[prop] = comp[prop]; }
      }
      // Color
      if (p.color && typeof p.color === 'object') {
        const cv = p.color as { r?: number; g?: number; b?: number; a?: number };
        const Color = (cc as { Color?: new (r: number, g: number, b: number, a?: number) => unknown }).Color;
        if (Color) {
          comp.color = new Color(
            Math.max(0, Math.min(255, Number(cv.r ?? 255))),
            Math.max(0, Math.min(255, Number(cv.g ?? 255))),
            Math.max(0, Math.min(255, Number(cv.b ?? 255))),
            Math.max(0, Math.min(255, Number(cv.a ?? 255))),
          );
          changed.color = cv;
        }
      }
      const nodeUuid = node.uuid || node._id || '';
      const result: Record<string, unknown> = { success: true, uuid: nodeUuid, name, lightType: compName, changed };
      return (async () => {
        if (nodeUuid && await deps.notifyEditorProperty(nodeUuid, 'active', { type: 'boolean', value: node.active })) {
          result._inspectorRefreshed = true;
        }
        return result;
      })();
    }],
    // ─── P0: set_light_property — modify light component properties ──────
    ['set_light_property', (_self, scene, p) => {
      const cc = getCC();
      const { js } = cc;
      const uuid = String(p.uuid ?? '');
      if (!uuid) return { error: '缺少 uuid 参数' };
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      // Find light component on node
      const LIGHT_NAMES = ['DirectionalLight', 'SpotLight', 'SphereLight'];
      let lightComp: Record<string, unknown> | null = null;
      let lightType = '';
      for (const ln of LIGHT_NAMES) {
        const cls = js.getClassByName(ln) || js.getClassByName('cc.' + ln);
        if (!cls) continue;
        const comp = (r.node as Record<string, unknown> & CocosNode).getComponent?.(cls);
        if (comp) { lightComp = comp as Record<string, unknown>; lightType = ln; break; }
      }
      if (!lightComp) return { error: `节点 ${r.node.name} 上没有灯光组件 (DirectionalLight/SpotLight/SphereLight)` };
      const changed: Record<string, unknown> = {};
      // Numeric/boolean properties
      const allProps = ['illuminance', 'luminance', 'luminanceHDR', 'range', 'spotAngle', 'size',
        'useColorTemperature', 'colorTemperature', 'shadowEnabled', 'shadowPcf', 'shadowBias',
        'shadowNormalBias', 'shadowSaturation', 'shadowDistance', 'shadowInvisibleOcclusionRange', 'shadowFixedArea'];
      for (const prop of allProps) {
        if (p[prop] !== undefined) {
          lightComp[prop] = typeof p[prop] === 'boolean' ? p[prop] : Number(p[prop]);
          changed[prop] = lightComp[prop];
        }
      }
      // Color
      if (p.color && typeof p.color === 'object') {
        const cv = p.color as { r?: number; g?: number; b?: number; a?: number };
        const Color = (cc as { Color?: new (r: number, g: number, b: number, a?: number) => unknown }).Color;
        if (Color) {
          lightComp.color = new Color(
            Math.max(0, Math.min(255, Number(cv.r ?? 255))),
            Math.max(0, Math.min(255, Number(cv.g ?? 255))),
            Math.max(0, Math.min(255, Number(cv.b ?? 255))),
            Math.max(0, Math.min(255, Number(cv.a ?? 255))),
          );
          changed.color = cv;
        }
      }
      if (Object.keys(changed).length === 0) return { error: '未指定任何要修改的灯光属性' };
      const result: Record<string, unknown> = { success: true, uuid, name: r.node.name, lightType, changed };
      return (async () => {
        for (const prop of Object.keys(changed)) {
          const val = changed[prop];
          if (typeof val === 'number' || typeof val === 'boolean') {
            if (await deps.notifyEditorComponentProperty(uuid, r.node, lightComp, prop, {
              type: typeof val === 'boolean' ? 'boolean' : 'number', value: val,
            })) { result._inspectorRefreshed = true; }
          }
        }
        return result;
      })();
    }],
    // ─── P0: set_scene_environment — modify ambient/shadows/fog/skybox ───
    ['set_scene_environment', (_self, scene, p) => {
      const cc = getCC();
      const globals = scene.globals as Record<string, unknown> | null;
      if (!globals) return { error: '场景没有 globals 属性' };
      const subsystem = String(p.subsystem ?? '');
      const changed: Record<string, unknown> = {};

      // Preset mode
      if (p.envPreset || p.preset) {
        const preset = String(p.envPreset ?? p.preset);
        const PRESETS: Record<string, Record<string, Record<string, unknown>>> = {
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
        if (!presetData) return { error: `未知预设: ${preset}，可用: ${Object.keys(PRESETS).join(', ')}` };
        for (const [sub, vals] of Object.entries(presetData)) {
          const target = globals[sub] as Record<string, unknown> | null;
          if (target) {
            for (const [k, v] of Object.entries(vals)) target[k] = v;
          }
        }
        return { success: true, preset, applied: presetData };
      }

      if (!subsystem) return { error: '缺少 subsystem 参数（ambient/shadows/fog/skybox）或 preset 参数' };

      const Color = (cc as { Color?: new (r: number, g: number, b: number, a?: number) => unknown }).Color;
      const setColor = (target: Record<string, unknown>, key: string, val: Record<string, unknown>) => {
        if (Color) {
          const cv = val as { r?: number; g?: number; b?: number; a?: number };
          target[key] = new Color(
            Math.max(0, Math.min(255, Number(cv.r ?? 0))),
            Math.max(0, Math.min(255, Number(cv.g ?? 0))),
            Math.max(0, Math.min(255, Number(cv.b ?? 0))),
            Math.max(0, Math.min(255, Number(cv.a ?? 255))),
          );
          changed[key] = cv;
        }
      };

      if (subsystem === 'ambient') {
        const ambient = globals.ambient as Record<string, unknown> | null;
        if (!ambient) return { error: 'globals.ambient 不存在' };
        if (p.skyIllum !== undefined) { ambient.skyIllum = Number(p.skyIllum); changed.skyIllum = ambient.skyIllum; }
        if (p.skyLightIntensity !== undefined) { ambient.skyLightIntensity = Number(p.skyLightIntensity); changed.skyLightIntensity = ambient.skyLightIntensity; }
        if (p.mipmapLevel !== undefined) { ambient.mipmapLevel = Number(p.mipmapLevel); changed.mipmapLevel = ambient.mipmapLevel; }
        if (p.skyColor && typeof p.skyColor === 'object') setColor(ambient, 'skyColor', p.skyColor as Record<string, unknown>);
        if (p.groundAlbedo && typeof p.groundAlbedo === 'object') setColor(ambient, 'groundAlbedo', p.groundAlbedo as Record<string, unknown>);
      } else if (subsystem === 'shadows') {
        const shadows = globals.shadows as Record<string, unknown> | null;
        if (!shadows) return { error: 'globals.shadows 不存在' };
        const numProps = ['enabled', 'type', 'distance', 'planeBias', 'maxReceived', 'size', 'autoAdapt'];
        for (const prop of numProps) {
          if (p[prop] !== undefined) {
            shadows[prop] = typeof p[prop] === 'boolean' ? p[prop] : Number(p[prop]);
            changed[prop] = shadows[prop];
          }
        }
        if (p.shadowColor && typeof p.shadowColor === 'object') setColor(shadows, 'shadowColor', p.shadowColor as Record<string, unknown>);
        if (p.normal && typeof p.normal === 'object') {
          const nv = p.normal as { x?: number; y?: number; z?: number };
          const Vec3 = cc.Vec3;
          shadows.normal = new Vec3(Number(nv.x ?? 0), Number(nv.y ?? 1), Number(nv.z ?? 0));
          changed.normal = nv;
        }
      } else if (subsystem === 'fog') {
        const fog = globals.fog as Record<string, unknown> | null;
        if (!fog) return { error: 'globals.fog 不存在' };
        const fogProps = ['enabled', 'accurate', 'type', 'fogDensity', 'fogStart', 'fogEnd', 'fogAtten', 'fogTop', 'fogRange'];
        for (const prop of fogProps) {
          if (p[prop] !== undefined) {
            fog[prop] = typeof p[prop] === 'boolean' ? p[prop] : Number(p[prop]);
            changed[prop] = fog[prop];
          }
        }
        if (p.fogColor && typeof p.fogColor === 'object') setColor(fog, 'fogColor', p.fogColor as Record<string, unknown>);
      } else if (subsystem === 'skybox') {
        const skybox = globals.skybox as Record<string, unknown> | null;
        if (!skybox) return { error: 'globals.skybox 不存在' };
        const skyProps = ['enabled', 'useIBL', 'useHDR', 'isRGBE', 'rotationAngle'];
        for (const prop of skyProps) {
          if (p[prop] !== undefined) {
            skybox[prop] = typeof p[prop] === 'boolean' ? p[prop] : Number(p[prop]);
            changed[prop] = skybox[prop];
          }
        }
      } else {
        return { error: `未知的 subsystem: ${subsystem}，可用: ambient, shadows, fog, skybox` };
      }
      if (Object.keys(changed).length === 0) return { error: `未指定任何要修改的 ${subsystem} 属性` };
      return { success: true, subsystem, changed };
    }],
    // ─── P1: set_material_define — set shader compile macros ─────────────
    ['set_material_define', (_self, scene, p) => {
      const uuid = String(p.uuid ?? '');
      if (!uuid) return { error: '缺少 uuid 参数' };
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      const slotIndex = Number(p.materialIndex ?? 0);
      const defines = p.defines as Record<string, boolean | number | string> | undefined;
      if (!defines || typeof defines !== 'object') return { error: '缺少 defines 参数（如 {"USE_ALBEDO_MAP": true}）' };
      // Find renderer
      const comps = r.node._components || [];
      let renderer: Record<string, unknown> | null = null;
      for (const comp of comps) {
        const c = comp as Record<string, unknown>;
        if (Array.isArray(c.sharedMaterials) || c.customMaterial) { renderer = c; break; }
      }
      if (!renderer) return { error: `节点 ${r.node.name} 上未找到渲染器组件` };
      // Get material instance
      const getMaterialInstance = renderer.getMaterialInstance as ((idx: number) => Record<string, unknown>) | undefined;
      let mat: Record<string, unknown> | null = null;
      if (typeof getMaterialInstance === 'function') {
        try { mat = getMaterialInstance.call(renderer, slotIndex); } catch (e) { logIgnored(ErrorCategory.ENGINE_API, '获取材质实例失败，回退到共享材质', e); }
      }
      if (!mat) {
        const sharedMats = renderer.sharedMaterials as Array<Record<string, unknown>> | null;
        if (Array.isArray(sharedMats)) mat = sharedMats[slotIndex] ?? null;
      }
      if (!mat) return { error: `材质槽位 ${slotIndex} 为空` };
      // Get passes and set defines
      const passes = mat.passes as Array<Record<string, unknown>> | null;
      if (!Array.isArray(passes) || passes.length === 0) return { error: '材质没有可用的 pass' };
      const passIdx = Number(p.passIndex ?? 0);
      const pass = passes[passIdx];
      if (!pass) return { error: `pass 索引 ${passIdx} 超出范围 (共 ${passes.length} 个)` };
      const changed: Record<string, unknown> = {};
      const redefine = typeof mat.recompileShaders === 'function' ? mat.recompileShaders as (defs: Record<string, unknown>) => void : null;
      // Approach 1: use overridePipelineStates / recompileShaders on material
      // Approach 2: set defines directly on pass
      for (const [defName, defVal] of Object.entries(defines)) {
        try {
          if (typeof pass.setDynamic === 'function') {
            (pass.setDynamic as (name: string, val: unknown) => void)(defName, defVal);
          }
          // Direct property access
          const defs = pass.defines as Record<string, unknown> | undefined;
          if (defs) defs[defName] = defVal;
          changed[defName] = defVal;
        } catch (err: unknown) {
          changed[defName] = { error: err instanceof Error ? err.message : String(err) };
        }
      }
      // Try to recompile
      let recompiled = false;
      if (redefine) {
        try { redefine.call(mat, defines); recompiled = true; } catch (e) { logIgnored(ErrorCategory.ENGINE_API, '材质 redefine 编译失败', e); }
      }
      // Try pass.tryCompile
      if (!recompiled && typeof pass.tryCompile === 'function') {
        try { (pass.tryCompile as () => void).call(pass); recompiled = true; } catch (e) { logIgnored(ErrorCategory.ENGINE_API, '材质 pass.tryCompile 失败', e); }
      }
      const result: Record<string, unknown> = { success: true, uuid, name: r.node.name, materialIndex: slotIndex, passIndex: passIdx, changed, recompiled };
      return (async () => {
        if (renderer) await deps.notifyEditorComponentProperty(uuid, r.node, renderer, 'sharedMaterials', { type: 'array', value: renderer.sharedMaterials });
        result._inspectorRefreshed = true;
        return result;
      })();
    }],
    // ─── P1: assign_project_material — assign custom .mtl by db:// url ──
    ['assign_project_material', (_self, scene, p) => {
      const cc = getCC();
      const uuid = String(p.uuid ?? '');
      if (!uuid) return { error: '缺少 uuid 参数' };
      const materialUrl = String(p.materialUrl ?? p.materialUuid ?? '');
      if (!materialUrl) return { error: '缺少 materialUrl 参数（db://assets/... 或材质 uuid）' };
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      const slotIndex = Number(p.materialIndex ?? 0);
      // Find renderer
      const comps = r.node._components || [];
      let renderer: Record<string, unknown> | null = null;
      let resolvedCompName = '';
      for (const comp of comps) {
        const cn = comp.constructor?.name ?? comp.__classname__ ?? '';
        const c = comp as Record<string, unknown>;
        if (Array.isArray(c.sharedMaterials) || c.customMaterial || typeof c.setMaterial === 'function') {
          renderer = c; resolvedCompName = cn; break;
        }
      }
      if (!renderer) return { error: `节点 ${r.node.name} 上未找到渲染器组件` };
      // Try to load material from assetManager
      const assetManager = cc.assetManager;
      if (!assetManager) return { error: 'cc.assetManager 不可用' };
      let foundMat: Record<string, unknown> | null = null;
      const isUrl = materialUrl.startsWith('db://');
      const searchKey = isUrl ? materialUrl.replace('db://assets/', '') : '';
      let scanned = 0;
      const MAX_SCAN = 10000;
      assetManager.assets.forEach((asset: Record<string, unknown>, assetUuid: string) => {
        if (foundMat || scanned >= MAX_SCAN) return;
        scanned++;
        if (isUrl) {
          const assetName = String(asset.name ?? asset.nativeUrl ?? '');
          if (assetName.includes(searchKey)) foundMat = asset;
        } else {
          if (assetUuid === materialUrl) foundMat = asset;
        }
      });
      if (!foundMat) {
        return {
          error: `未在已加载资源中找到材质: ${materialUrl}。提示: 该材质需要先被引擎加载（在场景或预制体中引用过）。`,
          hint: '可以先用 asset_operation info 确认材质存在，或尝试在编辑器中手动拖拽一次。',
        };
      }
      // Assign material
      const setMaterial = renderer.setMaterial as ((mat: unknown, idx: number) => void) | undefined;
      if (typeof setMaterial === 'function') {
        setMaterial.call(renderer, foundMat, slotIndex);
      } else {
        const mats = renderer.sharedMaterials as unknown[] | null;
        if (Array.isArray(mats)) {
          mats[slotIndex] = foundMat;
          renderer.sharedMaterials = [...mats];
        }
      }
      const result: Record<string, unknown> = { success: true, uuid, name: r.node.name, component: resolvedCompName, materialUrl, materialIndex: slotIndex };
      return (async () => {
        if (renderer) await deps.notifyEditorComponentProperty(uuid, r.node, renderer, 'sharedMaterials', { type: 'array', value: renderer.sharedMaterials });
        result._inspectorRefreshed = true;
        return result;
      })();
    }],
    // ─── P2: clone_material — clone material to independent instance ─────
    ['clone_material', (_self, scene, p) => {
      const uuid = String(p.uuid ?? '');
      if (!uuid) return { error: '缺少 uuid 参数' };
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      const slotIndex = Number(p.materialIndex ?? 0);
      const comps = r.node._components || [];
      let renderer: Record<string, unknown> | null = null;
      for (const comp of comps) {
        const c = comp as Record<string, unknown>;
        if (Array.isArray(c.sharedMaterials) || c.customMaterial) { renderer = c; break; }
      }
      if (!renderer) return { error: `节点 ${r.node.name} 上未找到渲染器组件` };
      // Get material instance (this clones the shared material)
      const getMaterialInstance = renderer.getMaterialInstance as ((idx: number) => Record<string, unknown>) | undefined;
      if (typeof getMaterialInstance !== 'function') return { error: '渲染器不支持 getMaterialInstance 方法' };
      try {
        const instance = getMaterialInstance.call(renderer, slotIndex);
        if (!instance) return { error: `材质槽位 ${slotIndex} 为空` };
        const effectName = instance.effectName ?? (instance.effectAsset as Record<string, unknown> | null)?.name ?? 'unknown';
        const result: Record<string, unknown> = { success: true, uuid, name: r.node.name, materialIndex: slotIndex, effectName, message: '材质已克隆为独立实例，修改不会影响其他节点' };
        return (async () => {
          if (renderer) await deps.notifyEditorComponentProperty(uuid, r.node, renderer, 'sharedMaterials', { type: 'array', value: renderer.sharedMaterials });
          result._inspectorRefreshed = true;
          return result;
        })();
      } catch (err: unknown) {
        return { error: `克隆材质失败: ${err instanceof Error ? err.message : String(err)}` };
      }
    }],
    // ─── P2: swap_technique — switch material technique index ────────────
    ['swap_technique', (_self, scene, p) => {
      const uuid = String(p.uuid ?? '');
      if (!uuid) return { error: '缺少 uuid 参数' };
      const techniqueIndex = Number(p.technique ?? p.techniqueIndex ?? 0);
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      const slotIndex = Number(p.materialIndex ?? 0);
      const comps = r.node._components || [];
      let renderer: Record<string, unknown> | null = null;
      for (const comp of comps) {
        const c = comp as Record<string, unknown>;
        if (Array.isArray(c.sharedMaterials) || c.customMaterial) { renderer = c; break; }
      }
      if (!renderer) return { error: `节点 ${r.node.name} 上未找到渲染器组件` };
      const getMaterialInstance = renderer.getMaterialInstance as ((idx: number) => Record<string, unknown>) | undefined;
      let mat: Record<string, unknown> | null = null;
      if (typeof getMaterialInstance === 'function') {
        try { mat = getMaterialInstance.call(renderer, slotIndex); } catch (e) { logIgnored(ErrorCategory.ENGINE_API, '获取材质实例失败，回退到共享材质', e); }
      }
      if (!mat) {
        const sharedMats = renderer.sharedMaterials as Array<Record<string, unknown>> | null;
        if (Array.isArray(sharedMats)) mat = sharedMats[slotIndex] ?? null;
      }
      if (!mat) return { error: `材质槽位 ${slotIndex} 为空` };
      const oldTechnique = mat.technique;
      mat.technique = techniqueIndex;
      const result: Record<string, unknown> = { success: true, uuid, name: r.node.name, materialIndex: slotIndex, oldTechnique, newTechnique: techniqueIndex };
      return (async () => {
        if (renderer) await deps.notifyEditorComponentProperty(uuid, r.node, renderer, 'sharedMaterials', { type: 'array', value: renderer.sharedMaterials });
        result._inspectorRefreshed = true;
        return result;
      })();
    }],
    // ─── P2: sprite_grayscale — toggle grayscale material on Sprite ──────
    ['sprite_grayscale', (_self, scene, p) => {
      const cc = getCC();
      const { js } = cc;
      const uuid = String(p.uuid ?? '');
      if (!uuid) return { error: '缺少 uuid 参数' };
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      const enable = p.enable !== false; // default true
      const SpriteClass = js.getClassByName('Sprite') || js.getClassByName('cc.Sprite');
      if (!SpriteClass) return { error: 'Sprite 组件类不可用' };
      const sprite = (r.node as Record<string, unknown> & CocosNode).getComponent?.(SpriteClass) as Record<string, unknown> | null;
      if (!sprite) return { error: `节点 ${r.node.name} 上没有 Sprite 组件` };
      const notifySprite = async (res: Record<string, unknown>, prop: string, val: unknown) => {
        const dumpType = typeof val === 'boolean' ? 'boolean' : 'object';
        await deps.notifyEditorComponentProperty(uuid, r.node, sprite, prop, { type: dumpType, value: val });
        res._inspectorRefreshed = true;
        return res;
      };
      if (enable) {
        if ('grayscale' in sprite) {
          sprite.grayscale = true;
          return notifySprite({ success: true, uuid, name: r.node.name, grayscale: true, method: 'grayscale_property' }, 'grayscale', true);
        }
        const Mat = (cc as { Material?: { getBuiltinMaterial?: (name: string) => unknown } }).Material;
        const grayMat = Mat?.getBuiltinMaterial?.('builtin-2d-gray-sprite');
        if (grayMat) {
          const clone = typeof (grayMat as { clone?: () => unknown }).clone === 'function'
            ? (grayMat as { clone: () => unknown }).clone() : grayMat;
          sprite.customMaterial = clone;
          return notifySprite({ success: true, uuid, name: r.node.name, grayscale: true, method: 'gray_sprite_material' }, 'customMaterial', clone);
        }
        return { error: '无法启用灰度：Sprite 没有 grayscale 属性，且 builtin-2d-gray-sprite 材质不可用' };
      } else {
        if ('grayscale' in sprite) {
          sprite.grayscale = false;
          return notifySprite({ success: true, uuid, name: r.node.name, grayscale: false, method: 'grayscale_property' }, 'grayscale', false);
        }
        sprite.customMaterial = null;
        return notifySprite({ success: true, uuid, name: r.node.name, grayscale: false, method: 'remove_custom_material' }, 'customMaterial', null);
      }
    }],
    // ─── P2: camera_screenshot — capture camera view via RenderTexture ───
    ['camera_screenshot', (_self, scene, p) => {
      const cc = getCC();
      const { Camera } = cc;
      const uuid = String(p.uuid ?? '');
      // Find camera
      let camComp: Record<string, unknown> | null = null;
      let camNode: CocosNode | null = null;
      const walkCam = (n: CocosNode) => {
        if (camComp) return;
        const cam = (n as Record<string, unknown> & CocosNode).getComponent?.(Camera);
        if (cam) {
          const nodeUuid = n.uuid || n._id;
          if (!uuid || nodeUuid === uuid) { camComp = cam as Record<string, unknown>; camNode = n; return; }
        }
        for (const child of n.children || []) walkCam(child);
      };
      walkCam(scene);
      if (!camComp || !camNode) return { error: '未找到 Camera 组件' };
      const camRef = camComp as Record<string, unknown>;
      const camNodeRef = camNode as CocosNode;
      // Check if RenderTexture is available
      const RenderTexture = (cc as { RenderTexture?: new () => Record<string, unknown> }).RenderTexture;
      if (!RenderTexture) return { error: '当前 Cocos 版本不支持 RenderTexture' };
      const width = Number(p.width ?? 512);
      const height = Number(p.height ?? 512);
      try {
        const rt = new RenderTexture();
        if (typeof rt.initialize === 'function') {
          (rt.initialize as (info: Record<string, unknown>) => void)({ width, height });
        } else if (typeof rt.reset === 'function') {
          (rt.reset as (info: Record<string, unknown>) => void)({ width, height });
        }
        const hadTarget = !!camRef.targetTexture;
        camRef.targetTexture = rt;
        // Read pixels
        let pixelData: string | null = null;
        if (typeof rt.readPixels === 'function') {
          const buffer = new Uint8Array(width * height * 4);
          (rt.readPixels as (x: number, y: number, w: number, h: number, buffer: Uint8Array) => void)(0, 0, width, height, buffer);
          // Return first few pixels as sample (full data too large for JSON)
          const sampleSize = Math.min(buffer.length, 64);
          pixelData = Array.from(buffer.slice(0, sampleSize)).join(',');
        }
        // Restore original target
        if (!hadTarget) camRef.targetTexture = null;
        return {
          success: true,
          uuid: camNodeRef.uuid || camNodeRef._id,
          name: camNodeRef.name,
          width, height,
          pixelSample: pixelData,
          message: `RenderTexture ${width}x${height} 已捕获。像素数据过大无法完整返回 JSON，建议通过引擎脚本保存为文件。`,
        };
      } catch (err: unknown) {
        return { error: `截图失败: ${err instanceof Error ? err.message : String(err)}` };
      }
    }],

    // ── Script binding operations ───────────────────────────────────────────
    ['set_component_properties', (_self, scene, p) => {
      const cc = getCC();
      const { js } = cc;
      const uuid = String(p.uuid ?? '');
      if (!uuid) return { error: '缺少 uuid 参数' };
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      const compName = String(p.component ?? p.script ?? '');
      if (!compName) return { error: '缺少 component/script 参数（组件类名）' };
      const compClass = js.getClassByName(compName) || js.getClassByName('cc.' + compName);
      if (!compClass) return { error: `未找到组件类: ${compName}` };
      const comp = (r.node as Record<string, unknown> & CocosNode).getComponent?.(compClass) as Record<string, unknown> | null;
      if (!comp) return { error: `节点 ${r.node.name} 上没有组件: ${compName}` };
      const props = p.properties as Record<string, unknown> | undefined;
      if (!props || typeof props !== 'object' || Object.keys(props).length === 0) {
        return { error: '缺少 properties 参数（要设置的属性键值对）' };
      }
      const changed: Record<string, unknown> = {};
      const errors: string[] = [];
      for (const [key, val] of Object.entries(props)) {
        if (key.startsWith('__') || key === 'constructor' || key === 'prototype') {
          errors.push(`属性 "${key}" 不允许被设置`);
          continue;
        }
        try {
          if (isNodeRef(val) || isComponentRef(val)) {
            const resolved = resolveRefToRuntime(val, scene, deps.findNodeByUuid, js);
            if (!resolved) {
              errors.push(`设置 ${key} 失败: 无法解析引用 (节点或组件未找到)`);
              continue;
            }
            comp[key] = resolved;
            changed[key] = val;
          } else {
            comp[key] = val;
            changed[key] = val;
          }
        } catch (err: unknown) {
          errors.push(`设置 ${key} 失败: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
      const result: Record<string, unknown> = {
        success: Object.keys(changed).length > 0,
        uuid, name: r.node.name, component: compName,
        changed,
        ...(errors.length ? { errors } : {}),
      };
      if (Object.keys(changed).length > 0) {
        return (async () => {
          for (const [key, val] of Object.entries(changed)) {
            if (typeof val === 'boolean' || typeof val === 'number' || typeof val === 'string') {
              const dumpType = typeof val === 'boolean' ? 'boolean' : typeof val === 'number' ? 'number' : 'string';
              await deps.notifyEditorComponentProperty(uuid, r.node, comp, key, { type: dumpType, value: val });
            }
          }
          result._inspectorRefreshed = true;
          return result;
        })();
      }
      return result;
    }],

    ['attach_script', (self, scene, p) => {
      const cc = getCC();
      const { js } = cc;
      const uuid = String(p.uuid ?? '');
      if (!uuid) return { error: '缺少 uuid 参数（目标节点 UUID）' };
      const scriptName = String(p.script ?? p.component ?? '');
      if (!scriptName) return { error: '缺少 script 参数（脚本类名，如 "PlayerController"）' };
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      const cls = js.getClassByName(scriptName) || js.getClassByName('cc.' + scriptName);
      if (!cls) {
        return {
          error: `脚本类 "${scriptName}" 未注册`,
          hint: '可能原因: 1) 脚本尚未编译完成，请稍后重试; 2) 类名不正确; 3) 脚本文件不存在。可用 check_script_ready 查询编译状态。',
        };
      }
      const existing = (r.node as Record<string, unknown> & CocosNode).getComponent?.(cls);
      if (existing && !p.allowDuplicate) {
        return {
          success: true, uuid, name: r.node.name, script: scriptName,
          alreadyAttached: true,
          message: `脚本 ${scriptName} 已挂载在节点上，跳过重复添加。如需添加多个实例，请传 allowDuplicate=true。`,
        };
      }
      const addResult = self.addComponent(uuid, scriptName);
      if (addResult && typeof addResult === 'object' && 'error' in addResult) return addResult;
      const comp = (r.node as Record<string, unknown> & CocosNode).getComponent?.(cls) as Record<string, unknown> | null;
      if (!comp) return { error: `添加脚本组件 ${scriptName} 失败` };
      const props = p.properties as Record<string, unknown> | undefined;
      const changed: Record<string, unknown> = {};
      const propErrors: string[] = [];
      if (props && typeof props === 'object') {
        for (const [key, val] of Object.entries(props)) {
          if (key.startsWith('__') || key === 'constructor' || key === 'prototype') {
            propErrors.push(`属性 "${key}" 不允许被设置`);
            continue;
          }
          try {
            if (isNodeRef(val) || isComponentRef(val)) {
              const resolved = resolveRefToRuntime(val, scene, deps.findNodeByUuid, js);
              if (!resolved) {
                propErrors.push(`设置 ${key} 失败: 无法解析引用 (节点或组件未找到)`);
                continue;
              }
              comp[key] = resolved;
              changed[key] = val;
            } else {
              comp[key] = val;
              changed[key] = val;
            }
          } catch (err: unknown) {
            propErrors.push(`设置 ${key} 失败: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }
      const result: Record<string, unknown> = {
        success: true, uuid, name: r.node.name, script: scriptName,
        propertiesSet: Object.keys(changed).length > 0 ? changed : undefined,
        ...(propErrors.length ? { propertyErrors: propErrors } : {}),
      };
      if (Object.keys(changed).length > 0) {
        return (async () => {
          const baseResult = await Promise.resolve(addResult) as Record<string, unknown>;
          Object.assign(result, { _addComponentResult: baseResult });
          for (const [key, val] of Object.entries(changed)) {
            if (typeof val === 'boolean' || typeof val === 'number' || typeof val === 'string') {
              const dumpType = typeof val === 'boolean' ? 'boolean' : typeof val === 'number' ? 'number' : 'string';
              await deps.notifyEditorComponentProperty(uuid, r.node, comp, key, { type: dumpType, value: val });
            }
          }
          result._inspectorRefreshed = true;
          return result;
        })();
      }
      return (async () => {
        await Promise.resolve(addResult);
        return result;
      })();
    }],

    ['detach_script', (self, _scene, p) => {
      const uuid = String(p.uuid ?? '');
      if (!uuid) return { error: '缺少 uuid 参数' };
      const scriptName = String(p.script ?? p.component ?? '');
      if (!scriptName) return { error: '缺少 script 参数（脚本类名）' };
      return self.removeComponent(uuid, scriptName);
    }],
  ]);

  return handlers;
}

