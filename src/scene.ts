import { join } from 'path';
import type {
  CocosNode, CocosCC, SceneTreeNode, NodeListRow,
  AnimationComponentLike, AnimClipRef,
  UITransformLike, SpriteLike, SpriteFrameLike, TextureLike,
  ColliderComponentLike, RigidBodyLike, UIOpacityLike,
  PhysicsSystemInstance, CachedAssetInfo, RenderRootLike,
  PipelineStatsLike, SizeLike,
} from './scene-types';
import {
  toStr, toNum, getComponentName,
  isAssetRef, isNodeRef, isComponentRef,
} from './scene-types';
import { buildQueryHandlers } from './scene-query-handlers';
import { buildOperationHandlers } from './scene-operation-handlers';
import { ErrorCategory, logIgnored } from './error-utils';

module.paths.push(join(Editor.App.path, 'node_modules'));

// ─── Alpha outline extraction from pixel data ─────────────────────────────────
// Marching-squares-lite: walk the alpha boundary and simplify with Ramer-Douglas-Peucker
function extractAlphaOutline(
  pixels: Uint8Array, w: number, h: number,
  threshold: number, tolerance: number, maxVerts: number,
): Array<{ x: number; y: number }> | null {
  // Build binary alpha mask
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    mask[i] = (pixels[i * 4 + 3] / 255) >= threshold ? 1 : 0;
  }

  // Find boundary pixels (alpha pixel adjacent to transparent pixel)
  const boundary: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!mask[y * w + x]) continue;
      // Check 4-neighbors
      const isEdge =
        x === 0 || x === w - 1 || y === 0 || y === h - 1 ||
        !mask[y * w + (x - 1)] || !mask[y * w + (x + 1)] ||
        !mask[(y - 1) * w + x] || !mask[(y + 1) * w + x];
      if (isEdge) boundary.push({ x: x - w / 2, y: h / 2 - y }); // Center-origin
    }
  }

  if (boundary.length < 3) return null;

  // Sort by angle from centroid to form a convex-hull-like ordering
  const cx = boundary.reduce((s, p) => s + p.x, 0) / boundary.length;
  const cy = boundary.reduce((s, p) => s + p.y, 0) / boundary.length;
  boundary.sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));

  // Simplify: Ramer-Douglas-Peucker
  const simplified = rdpSimplify(boundary, tolerance);

  // Limit vertex count
  if (simplified.length > maxVerts) {
    const step = simplified.length / maxVerts;
    const sampled: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < maxVerts; i++) {
      sampled.push(simplified[Math.floor(i * step)]);
    }
    return sampled;
  }
  return simplified.length >= 3 ? simplified : null;
}

function rdpSimplify(points: Array<{ x: number; y: number }>, epsilon: number): Array<{ x: number; y: number }> {
  if (points.length <= 2) return points;
  let maxDist = 0, maxIdx = 0;
  const first = points[0], last = points[points.length - 1];
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDist(points[i], first, last);
    if (d > maxDist) { maxDist = d; maxIdx = i; }
  }
  if (maxDist > epsilon) {
    const left = rdpSimplify(points.slice(0, maxIdx + 1), epsilon);
    const right = rdpSimplify(points.slice(maxIdx), epsilon);
    return left.slice(0, -1).concat(right);
  }
  return [first, last];
}

function perpendicularDist(p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return Math.sqrt((p.x - a.x) ** 2 + (p.y - a.y) ** 2);
  return Math.abs(dx * (a.y - p.y) - dy * (a.x - p.x)) / len;
}

const COMPONENT_PROPERTY_BLOCKLIST = new Set([
  '__proto__', 'constructor', 'prototype', '__defineGetter__', '__defineSetter__',
  '__lookupGetter__', '__lookupSetter__', 'toString', 'valueOf',
]);

// ─── Editor IPC notification helpers ────────────────────────────────────────
// 优先仅通过 set-property / remove-node 等 IPC 写入可序列化场景数据；失败则返回错误，
// 避免「只改运行时内存、保存丢失」的双写语义。

async function notifyEditorProperty(
  uuid: string, path: string, dump: { type: string; value: unknown },
): Promise<boolean> {
  try {
    await Editor.Message.request('scene', 'set-property', { uuid, path, dump });
    return true;
  } catch (e) {
    logIgnored(ErrorCategory.EDITOR_IPC, `set-property 通知失败 (${path})`, e);
    return false;
  }
}

async function notifyEditorRemoveNode(uuid: string): Promise<boolean> {
  try {
    await Editor.Message.request('scene', 'remove-node', { uuid });
    return true;
  } catch (e) {
    logIgnored(ErrorCategory.EDITOR_IPC, `remove-node IPC 失败 (${uuid})`, e);
    return false;
  }
}

async function notifyEditorComponentProperty(
  nodeUuid: string, node: CocosNode, comp: unknown, property: string,
  dump: { type: string; value: unknown },
): Promise<boolean> {
  const components = node._components ?? [];
  const compIndex = components.indexOf(comp as typeof components[number]);
  if (compIndex < 0) return false;
  const propPath = `__comps__.${compIndex}.${property}`;
  return notifyEditorProperty(nodeUuid, propPath, dump);
}

// ─── Undo recording helpers ─────────────────────────────────────────────────
// Wrap all structural modifications with begin-recording / end-recording so
// the editor records Undo entries. Safe to call on versions that don't support
// these IPC messages (silently ignored).

let _recordingDepth = 0;

async function beginRecording(): Promise<boolean> {
  _recordingDepth++;
  if (_recordingDepth > 1) return true; // nested — already recording
  try {
    await Editor.Message.request('scene', 'begin-recording');
    return true;
  } catch (e) {
    logIgnored(ErrorCategory.EDITOR_IPC, 'begin-recording 不可用，Undo 记录跳过', e);
    return false;
  }
}

async function endRecording(): Promise<boolean> {
  _recordingDepth = Math.max(0, _recordingDepth - 1);
  if (_recordingDepth > 0) return true; // still nested
  try {
    await Editor.Message.request('scene', 'end-recording');
    return true;
  } catch (e) {
    logIgnored(ErrorCategory.EDITOR_IPC, 'end-recording 失败', e);
    return false;
  }
}

// ─── Structural IPC helpers ─────────────────────────────────────────────────
// These call the editor's own IPC messages for structural scene operations,
// which ensures full Undo support, proper serialization, and Inspector sync.
// These IPCs exist in Cocos 3.8.8 — if they fail, it's a bug, not a fallback.

async function ipcCreateNode(parentUuid: string, name: string): Promise<string> {
  const result = await Editor.Message.request('scene', 'create-node', {
    parent: parentUuid,
    name,
  });
  // IPC returns various formats — normalize to UUID string
  if (result && typeof result === 'object') {
    const uuid = (result as Record<string, unknown>).uuid ?? (result as Record<string, unknown>)._id;
    if (uuid) return String(uuid);
  }
  if (typeof result === 'string') return result;
  throw new Error(`create-node IPC 返回了无法识别的格式: ${JSON.stringify(result)}`);
}

/** 编辑器 create-component / remove-component 的组件名字符串（cc.Label / sp.Skeleton 等） */
function editorComponentIpcName(componentName: string): string {
  if (componentName.startsWith('cc.')) return componentName;
  // 扩展模块：sp.*、dragonBones.* — 不可再加 cc. 前缀
  if (componentName.includes('.')) return componentName;
  return `cc.${componentName}`;
}

async function ipcCreateComponent(nodeUuid: string, componentName: string): Promise<void> {
  await Editor.Message.request('scene', 'create-component', {
    uuid: nodeUuid,
    component: editorComponentIpcName(componentName),
  });
}

async function ipcRemoveComponent(nodeUuid: string, componentName: string): Promise<void> {
  await Editor.Message.request('scene', 'remove-component', {
    uuid: nodeUuid,
    component: editorComponentIpcName(componentName),
  });
}

async function ipcSetParent(nodeUuid: string, parentUuid: string): Promise<void> {
  await Editor.Message.request('scene', 'set-parent', {
    uuid: nodeUuid,
    parentUuid,
  });
}

async function ipcResetProperty(nodeUuid: string, path: string): Promise<boolean> {
  try {
    await Editor.Message.request('scene', 'reset-property', { uuid: nodeUuid, path });
    return true;
  } catch (e) {
    logIgnored(ErrorCategory.EDITOR_IPC, `reset-property 失败 (${path})`, e);
    return false;
  }
}

async function ipcDuplicateNode(nodeUuid: string): Promise<string> {
  const result = await Editor.Message.request('scene', 'duplicate-node', {
    uuids: [nodeUuid],
  });
  // IPC may return an array of new UUIDs or an object
  if (Array.isArray(result) && result.length > 0) {
    return String(result[0]);
  }
  if (result && typeof result === 'object') {
    const uuid = (result as Record<string, unknown>).uuid ?? (result as Record<string, unknown>)._id;
    if (uuid) return String(uuid);
  }
  if (typeof result === 'string') return result;
  throw new Error(`duplicate-node IPC 返回了无法识别的格式: ${JSON.stringify(result)}`);
}

/** 通过 move-array-element 调整节点在父节点 children 中的顺序（可 Undo / 可保存） */
async function ipcMoveArrayElementForChild(parentUuid: string, fromIndex: number, toIndex: number): Promise<boolean> {
  const pathCandidates = [`_children.${fromIndex}`, `children.${fromIndex}`];
  for (const path of pathCandidates) {
    try {
      await Editor.Message.request('scene', 'move-array-element', {
        uuid: parentUuid,
        path,
        target: toIndex,
      });
      return true;
    } catch (e) {
      logIgnored(ErrorCategory.EDITOR_IPC, `move-array-element 失败 (${path})`, e);
    }
  }
  return false;
}

async function setSiblingIndexViaEditor(nodeUuid: string, targetIndex: number): Promise<boolean> {
  const scene = getScene();
  if (!scene) return false;
  const node = findNodeByUuid(scene, nodeUuid);
  if (!node?.parent) return false;
  const parentUuid = String(node.parent.uuid ?? node.parent._id ?? '');
  const currentIndex = node.getSiblingIndex();
  if (currentIndex === targetIndex) return true;
  return ipcMoveArrayElementForChild(parentUuid, currentIndex, targetIndex);
}

const SPRITE_NAMES = new Set(['Sprite', 'cc.Sprite']);

function getCC(): CocosCC {
  return require('cc');
}

function getScene(): CocosNode | null {
  const { director } = getCC();
  return director.getScene();
}

// isAssetRef / isNodeRef / isComponentRef imported from scene-types

function findNodeByUuid(root: CocosNode | null, uuid: string): CocosNode | null {
  if (!root) return null;
  const rootId = root.uuid ?? root._id;
  if (rootId === uuid) return root;
  if (root._id && root._id === uuid) return root;
  for (const child of root.children ?? []) {
    const found = findNodeByUuid(child, uuid);
    if (found) return found;
  }
  return null;
}

function findNodeByName(root: CocosNode | null, name: string): CocosNode | null {
  if (!root) return null;
  if (root.name === name) return root;
  for (const child of root.children ?? []) {
    const found = findNodeByName(child, name);
    if (found) return found;
  }
  return null;
}

const UUID_RE = /^[0-9a-f]{5,}$/i;
function looksLikeUuid(s: string): boolean {
  return UUID_RE.test(s.replace(/-/g, ''));
}

/**
 * Resolve a parent reference that may be a UUID or a node name.
 * Returns the node, or null with a descriptive reason.
 */
function resolveParent(scene: CocosNode, ref: string): { node: CocosNode } | { error: string } {
  if (!ref) return { node: scene };

  if (looksLikeUuid(ref)) {
    const node = findNodeByUuid(scene, ref);
    if (node) return { node };
    return { error: `未找到父节点 (UUID): ${ref}` };
  }

  const byName = findNodeByName(scene, ref);
  if (byName) return { node: byName };

  const suggestions: string[] = [];
  const walk = (n: CocosNode, depth: number) => {
    if (depth > 2 || suggestions.length >= 5) return;
    for (const child of n.children ?? []) {
      if (suggestions.length >= 5) break;
      suggestions.push(child.name);
      walk(child, depth + 1);
    }
  };
  walk(scene, 0);
  const hint = suggestions.length > 0
    ? `。场景中现有的顶层节点: [${suggestions.join(', ')}]`
    : '。场景为空';
  return { error: `未找到名为 "${ref}" 的父节点${hint}` };
}

function getNodePath(node: CocosNode | null): string {
  const names: string[] = [];
  let current = node;
  while (current) {
    names.unshift(current.name);
    current = current.parent;
  }
  return names.join('/');
}

function requireNode(scene: CocosNode, uuid: string): { node: CocosNode } | { error: string } {
  const node = findNodeByUuid(scene, uuid);
  if (!node) return { error: `未找到节点: ${uuid}` };
  return { node };
}

const deps = {
  getCC, getNodePath, findNodeByUuid, findNodeByName, resolveParent, requireNode,
  notifyEditorProperty, notifyEditorRemoveNode, notifyEditorComponentProperty, ipcDuplicateNode,
  setSiblingIndexViaEditor,
  ipcCreateNode,
  ipcCreateComponent,
  ipcResetProperty,
};
const queryHandlers = buildQueryHandlers(deps);
const operationHandlers = buildOperationHandlers(deps);

export function load() {
  console.log('[Aura Scene] 场景脚本已加载');
}

export function unload() {
  console.log('[Aura Scene] 场景脚本已卸载');
}

// Cocos CCObject.Flags — filter editor-internal / hidden nodes
// DontSave (1 << 3 = 8): editor overlay nodes (gizmoRoot, Editor Scene Foreground, etc.)
// HideInHierarchy (1 << 4 = 16): explicitly hidden in hierarchy panel
const EDITOR_INTERNAL_MASK = (1 << 3) | (1 << 4); // DontSave | HideInHierarchy
function isVisibleInEditor(node: CocosNode): boolean {
  return !node._objFlags || !(node._objFlags & EDITOR_INTERNAL_MASK);
}
function visibleChildren(node: CocosNode, includeInternal: boolean): CocosNode[] {
  return includeInternal ? node.children : node.children.filter(isVisibleInEditor);
}

export const methods = {
  getSceneTree(includeInternal = false) {
    const scene = getScene();
    if (!scene) return { error: '没有打开的场景' };
    const build = (node: CocosNode): SceneTreeNode => {
      const kids = visibleChildren(node, includeInternal);
      return {
        uuid: node.uuid ?? node._id,
        name: node.name,
        active: node.active,
        childCount: kids.length,
        children: kids.map(build),
      };
    };
    return build(scene);
  },

  getAllNodesList(includeInternal = false) {
    const scene = getScene();
    if (!scene) return { error: '没有打开的场景' };
    const rows: NodeListRow[] = [];
    const walk = (node: CocosNode, depth: number) => {
      rows.push({
        uuid: node.uuid ?? node._id, name: node.name, active: node.active,
        depth, childCount: visibleChildren(node, includeInternal).length, path: getNodePath(node),
      });
      for (const child of visibleChildren(node, includeInternal)) walk(child, depth + 1);
    };
    walk(scene, 0);
    return { count: rows.length, nodes: rows };
  },

  getSceneStats(includeInternal = false) {
    const scene = getScene();
    if (!scene) return { error: '没有打开的场景' };
    let nodeCount = 0, activeCount = 0, hiddenCount = 0;
    const walk = (node: CocosNode) => {
      nodeCount += 1;
      if (node.active) activeCount += 1;
      for (const child of node.children) {
        if (!includeInternal && !isVisibleInEditor(child)) { hiddenCount += 1; continue; }
        walk(child);
      }
    };
    walk(scene);
    return { sceneName: scene.name, nodeCount, activeCount, inactiveCount: nodeCount - activeCount, ...(hiddenCount > 0 ? { filteredInternalNodes: hiddenCount } : {}) };
  },

  getNodeDetail(uuid: string) {
    const scene = getScene();
    if (!scene) return { error: '没有打开的场景' };
    const node = findNodeByUuid(scene, uuid);
    if (!node) return { error: `未找到节点: ${uuid}` };
    return {
      uuid: node.uuid ?? node._id, name: node.name, active: node.active,
      path: getNodePath(node),
      position: node.position ? { x: node.position.x, y: node.position.y, z: node.position.z } : null,
      scale: node.scale ? { x: node.scale.x, y: node.scale.y, z: node.scale.z } : null,
      childCount: node.children.length,
      components: (node._components ?? []).map(getComponentName),
    };
  },

  findNodeByPath(nodePath: string) {
    const scene = getScene();
    if (!scene) return { error: '没有打开的场景' };
    const parts = nodePath.split('/').filter(Boolean);
    let current: CocosNode = scene;
    let i = parts.length > 0 && parts[0] === scene.name ? 1 : 0;
    for (; i < parts.length; i++) {
      let found: CocosNode | null = null;
      for (const child of current.children) {
        if (child.name === parts[i]) { found = child; break; }
      }
      if (!found) return { error: `路径未找到: ${parts[i]} 在 ${current.name}` };
      current = found;
    }
    return { uuid: current.uuid ?? current._id, name: current.name, active: current.active, path: getNodePath(current) };
  },

  getNodeComponents(uuid: string) {
    const scene = getScene();
    if (!scene) return { error: '没有打开的场景' };
    const node = findNodeByUuid(scene, uuid);
    if (!node) return { error: `未找到节点: ${uuid}` };
    const comps = (node._components ?? []).map((comp) => ({
      name: getComponentName(comp),
    }));
    return { uuid, name: node.name, components: comps };
  },

  setNodePosition(uuid: string, x: number, y: number, z: number) {
    const scene = getScene();
    if (!scene) return { error: '没有打开的场景' };
    const node = findNodeByUuid(scene, uuid);
    if (!node) return { error: `未找到节点: ${uuid}` };
    return (async () => {
      const ok = await notifyEditorProperty(uuid, 'position', { type: 'cc.Vec3', value: { x, y, z } });
      if (!ok) {
        return {
          success: false,
          uuid,
          name: node.name,
          error: 'set-property(position) 失败，本地坐标未能写入可保存数据',
        };
      }
      return {
        success: true,
        uuid,
        name: node.name,
        position: { x, y, z },
        _viaEditorIPC: true,
        _inspectorRefreshed: true,
      };
    })();
  },

  setNodeRotation(uuid: string, x: number, y: number, z: number) {
    const scene = getScene();
    if (!scene) return { error: '没有打开的场景' };
    const node = findNodeByUuid(scene, uuid);
    if (!node) return { error: `未找到节点: ${uuid}` };
    return (async () => {
      const ok = await notifyEditorProperty(uuid, 'rotation', { type: 'cc.Vec3', value: { x, y, z } });
      if (!ok) {
        return {
          success: false,
          uuid,
          name: node.name,
          error: 'set-property(rotation) 失败，旋转未能写入可保存数据',
        };
      }
      return {
        success: true,
        uuid,
        name: node.name,
        rotation: { x, y, z },
        _viaEditorIPC: true,
        _inspectorRefreshed: true,
      };
    })();
  },

  setNodeScale(uuid: string, x: number, y: number, z: number) {
    const scene = getScene();
    if (!scene) return { error: '没有打开的场景' };
    const node = findNodeByUuid(scene, uuid);
    if (!node) return { error: `未找到节点: ${uuid}` };
    return (async () => {
      const ok = await notifyEditorProperty(uuid, 'scale', { type: 'cc.Vec3', value: { x, y, z } });
      if (!ok) {
        return {
          success: false,
          uuid,
          name: node.name,
          error: 'set-property(scale) 失败，缩放未能写入可保存数据',
        };
      }
      return {
        success: true,
        uuid,
        name: node.name,
        scale: { x, y, z },
        _viaEditorIPC: true,
        _inspectorRefreshed: true,
      };
    })();
  },

  setNodeName(uuid: string, name: string) {
    const scene = getScene();
    if (!scene) return { error: '没有打开的场景' };
    const node = findNodeByUuid(scene, uuid);
    if (!node) return { error: `未找到节点: ${uuid}` };
    const oldName = node.name;
    return (async () => {
      const ok = await notifyEditorProperty(uuid, 'name', { type: 'string', value: name });
      if (!ok) {
        return {
          success: false,
          uuid,
          oldName,
          error: 'set-property(name) 失败，节点名未能写入可保存数据',
        };
      }
      return {
        success: true,
        uuid,
        oldName,
        newName: name,
        _viaEditorIPC: true,
        _inspectorRefreshed: true,
      };
    })();
  },

  setNodeActive(uuid: string, active: boolean) {
    const scene = getScene();
    if (!scene) return { error: '没有打开的场景' };
    const node = findNodeByUuid(scene, uuid);
    if (!node) return { error: `未找到节点: ${uuid}` };
    return (async () => {
      const ok = await notifyEditorProperty(uuid, 'active', { type: 'boolean', value: active });
      if (!ok) {
        return {
          success: false,
          uuid,
          error: 'set-property(active) 失败，显隐状态未能写入可保存数据',
        };
      }
      return {
        success: true,
        uuid,
        active,
        _viaEditorIPC: true,
        _inspectorRefreshed: true,
      };
    })();
  },

  createChildNode(parentRef: string, name: string) {
    const scene = getScene();
    if (!scene) return { error: '没有打开的场景' };
    const resolved = resolveParent(scene, parentRef);
    if ('error' in resolved) return resolved;
    const parent = resolved.node;
    const parentUuid = parent.uuid ?? parent._id ?? '';
    const nodeName = name || 'New Node';

    return (async () => {
      const newUuid = await ipcCreateNode(parentUuid, nodeName);
      return { success: true, uuid: newUuid, name: nodeName, parent: parent.name };
    })();
  },

  destroyNode(uuid: string) {
    const scene = getScene();
    if (!scene) return { error: '没有打开的场景' };
    const node = findNodeByUuid(scene, uuid);
    if (!node) return { error: `未找到节点: ${uuid}` };
    const name = node.name;
    return (async () => {
      const removed = await notifyEditorRemoveNode(uuid);
      if (!removed) {
        return {
          success: false,
          uuid,
          name,
          error: 'remove-node IPC 失败，已跳过销毁（避免仅内存删除导致无法保存/不同步）',
        };
      }
      return { success: true, uuid, name, _editorIPC: true, _viaEditorIPC: true };
    })();
  },

  reparentNode(uuid: string, parentRef: string) {
    const scene = getScene();
    if (!scene) return { error: '没有打开的场景' };
    const node = findNodeByUuid(scene, uuid);
    if (!node) return { error: `未找到节点: ${uuid}` };
    const resolved = resolveParent(scene, parentRef);
    if ('error' in resolved) return resolved;
    const newParent = resolved.node;
    const newParentUuid = newParent.uuid ?? newParent._id ?? '';

    return (async () => {
      await ipcSetParent(uuid, newParentUuid);
      return { success: true, uuid, parent: newParent.name };
    })();
  },

  addComponent(uuid: string, componentName: string) {
    const { js } = getCC();
    const scene = getScene();
    if (!scene) return { error: '没有打开的场景' };
    const node = findNodeByUuid(scene, uuid);
    if (!node) return { error: `未找到节点: ${uuid}` };
    const compClass = js.getClassByName(componentName) || js.getClassByName('cc.' + componentName);
    if (!compClass) return { error: `未找到组件类: ${componentName}` };

    return (async () => {
      await ipcCreateComponent(uuid, componentName);
      const result: Record<string, unknown> = { success: true, uuid, component: componentName };
      if (SPRITE_NAMES.has(componentName)) {
        result.warning = 'Sprite 组件已添加但未设置 spriteFrame。Cocos 3.8.x 存在引擎缺陷：场景重新激活时 Sprite.onEnable 会在 updateUVs 中访问空 UV 数据导致 TypeError。建议通过 set_property 设置 spriteFrame 后再使用。';
      }
      return result;
    })();
  },

  removeComponent(uuid: string, componentName: string) {
    const { js } = getCC();
    const scene = getScene();
    if (!scene) return { error: '没有打开的场景' };
    const node = findNodeByUuid(scene, uuid);
    if (!node) return { error: `未找到节点: ${uuid}` };
    const compClass = js.getClassByName(componentName) || js.getClassByName('cc.' + componentName);
    if (!compClass) return { error: `未找到组件类: ${componentName}` };
    const comp = node.getComponent(compClass);
    if (!comp) return { success: false, uuid, component: componentName };

    return (async () => {
      await ipcRemoveComponent(uuid, componentName);
      return { success: true, uuid, component: componentName };
    })();
  },

  setComponentProperty(uuid: string, componentName: string, property: string, value: unknown): unknown {
    const cc = getCC();
    const { js } = cc;
    const scene = getScene();
    if (!scene) return { error: '没有打开的场景' };
    const node = findNodeByUuid(scene, uuid);
    if (!node) return { error: `未找到节点: ${uuid}` };
    if (COMPONENT_PROPERTY_BLOCKLIST.has(property) || property.startsWith('__')) {
      return { error: `属性 "${property}" 不允许被设置` };
    }
    const compClass = js.getClassByName(componentName) || js.getClassByName('cc.' + componentName);
    if (!compClass) return { error: `未找到组件类: ${componentName}` };
    const comp = node.getComponent(compClass);
    if (!comp) return { error: `节点上没有此组件: ${componentName}` };

    if (isAssetRef(value)) {
      const assetUuid = (value as { __uuid__: string }).__uuid__;

      const compIndex = (node._components ?? []).indexOf(comp);
      if (compIndex < 0) return { error: `无法定位组件索引: ${componentName}` };

      const propPath = `__comps__.${compIndex}.${property}`;

      return (async () => {
        try {
          await Editor.Message.request('scene', 'set-property', {
            uuid,
            path: propPath,
            dump: { type: 'cc.Asset', value: { uuid: assetUuid } },
          });
          return { success: true, uuid, component: componentName, property, resolvedViaEditorIPC: true, assetUuid };
        } catch (ipcErr: unknown) {
          const am = cc.assetManager;
          if (am) {
            const cached = am.assets?.get?.(assetUuid);
            if (cached) {
              comp[property] = cached;
              return { success: true, uuid, component: componentName, property, resolvedFromCache: true };
            }
          }
          const msg = ipcErr instanceof Error ? ipcErr.message : String(ipcErr);
          logIgnored(ErrorCategory.EDITOR_IPC, `set-property IPC 失败 (${propPath})`, ipcErr);
          return { error: `设置资源引用失败: ${msg}。请确保资源已导入并刷新 AssetDB。`, assetUuid };
        }
      })();
    }

    if (isNodeRef(value)) {
      const targetNodeUuid = value.uuid;
      const compIndex = (node._components ?? []).indexOf(comp);
      if (compIndex < 0) return { error: `无法定位组件索引: ${componentName}` };
      const propPath = `__comps__.${compIndex}.${property}`;

      return (async () => {
        try {
          await Editor.Message.request('scene', 'set-property', {
            uuid,
            path: propPath,
            dump: { type: 'cc.Node', value: { uuid: targetNodeUuid } },
          });
          return { success: true, uuid, component: componentName, property, resolvedViaEditorIPC: true, targetNodeUuid };
        } catch (ipcErr: unknown) {
          const scene2 = getScene();
          const targetNode = scene2 ? findNodeByUuid(scene2, targetNodeUuid) : null;
          if (targetNode) {
            comp[property] = targetNode;
            return { success: true, uuid, component: componentName, property, resolvedFromRuntime: true, targetNodeUuid };
          }
          const msg = ipcErr instanceof Error ? ipcErr.message : String(ipcErr);
          logIgnored(ErrorCategory.EDITOR_IPC, `set-property Node ref IPC 失败 (${propPath})`, ipcErr);
          return { error: `设置节点引用失败: ${msg}。请确保目标节点存在。`, targetNodeUuid };
        }
      })();
    }

    if (isComponentRef(value)) {
      const targetNodeUuid = value.uuid;
      const targetCompName = value.component;
      const compIndex = (node._components ?? []).indexOf(comp);
      if (compIndex < 0) return { error: `无法定位组件索引: ${componentName}` };
      const propPath = `__comps__.${compIndex}.${property}`;
      // Resolve the full cc-prefixed type name for the Editor IPC dump
      const dumpType = targetCompName.startsWith('cc.') ? targetCompName : `cc.${targetCompName}`;

      return (async () => {
        try {
          // Primary: Editor IPC — this auto-refreshes the Inspector panel
          await Editor.Message.request('scene', 'set-property', {
            uuid,
            path: propPath,
            dump: { type: dumpType, value: { uuid: targetNodeUuid } },
          });
          return { success: true, uuid, component: componentName, property, resolvedViaEditorIPC: true, targetNodeUuid, targetComponent: targetCompName };
        } catch (ipcErr: unknown) {
          // Fallback: runtime assignment (Inspector won't auto-refresh)
          const scene2 = getScene();
          const targetNode = scene2 ? findNodeByUuid(scene2, targetNodeUuid) : null;
          if (!targetNode) return { error: `设置组件引用失败: 未找到目标节点 ${targetNodeUuid}` };
          const targetCompClass = js.getClassByName(targetCompName) || js.getClassByName('cc.' + targetCompName);
          if (!targetCompClass) return { error: `设置组件引用失败: 未找到组件类 ${targetCompName}` };
          const targetComp = targetNode.getComponent(targetCompClass);
          if (!targetComp) return { error: `设置组件引用失败: 目标节点上没有组件 ${targetCompName}` };
          comp[property] = targetComp;
          const msg = ipcErr instanceof Error ? ipcErr.message : String(ipcErr);
          logIgnored(ErrorCategory.EDITOR_IPC, `set-property Component ref IPC 失败 (${propPath})`, ipcErr);
          return { success: true, uuid, component: componentName, property, resolvedFromRuntime: true, targetNodeUuid, targetComponent: targetCompName, _ipcError: msg };
        }
      })();
    }

    comp[property] = value;
    const result: Record<string, unknown> = { success: true, uuid, component: componentName, property, value };

    const compIndex = (node._components ?? []).indexOf(comp);
    if (compIndex >= 0) {
      const propPath = `__comps__.${compIndex}.${property}`;
      const dumpType = typeof value === 'boolean' ? 'boolean'
        : typeof value === 'number' ? 'number'
        : typeof value === 'string' ? 'string'
        : null;
      if (dumpType) {
        return (async () => {
          if (await notifyEditorProperty(uuid, propPath, { type: dumpType, value })) {
            result._inspectorRefreshed = true;
          }
          return result;
        })();
      }
    }
    return result;
  },

  instantiatePrefab(prefabUuid: string, parentUuid: string) {
    const cc = getCC();
    const scene = getScene();
    if (!scene) return { error: '没有打开的场景' };
    const am = cc.assetManager;
    if (!am || typeof am.loadAny !== 'function') {
      return { error: 'assetManager.loadAny 不可用' };
    }
    return new Promise<unknown>((resolve) => {
      am.loadAny!(prefabUuid, (err: Error | null, prefab: unknown) => {
        if (err || !prefab) {
          resolve({ error: `加载预制体失败: ${err?.message || '资源为空'}` });
          return;
        }
        try {
          const node = cc.instantiate(prefab as CocosNode);
          const resolved = resolveParent(scene, parentUuid);
          const parent = 'error' in resolved ? scene : resolved.node;
          parent.addChild(node);
          const nodeUuid = node.uuid ?? node._id ?? '';
          const result: Record<string, unknown> = { success: true, uuid: nodeUuid, name: node.name };
          if (nodeUuid) {
            notifyEditorProperty(nodeUuid, 'active', { type: 'boolean', value: node.active })
              .then(ok => { if (ok) result._inspectorRefreshed = true; })
              .finally(() => resolve(result));
          } else {
            resolve(result);
          }
        } catch (e) {
          resolve({ error: `实例化预制体失败: ${e instanceof Error ? e.message : String(e)}` });
        }
      });
    });
  },

  listMethods() {
    return {
      query: ['getSceneTree', 'getAllNodesList', 'getSceneStats', 'getNodeDetail', 'findNodeByPath', 'getNodeComponents', 'listMethods'],
      modify: ['setNodePosition', 'setNodeRotation', 'setNodeScale', 'setNodeName', 'setNodeActive', 'createChildNode', 'destroyNode', 'reparentNode', 'addComponent', 'removeComponent', 'setComponentProperty', 'instantiatePrefab'],
    };
  },

  /**
   * Runtime feature detection — probes actual cc.* API availability
   * so the bridge can report accurate capabilities per Cocos version.
   */
  detectFeatures() {
    const cc = getCC();
    const { js } = cc;

    const probe = (name: string): boolean => {
      try { return !!(js.getClassByName(name) || js.getClassByName('cc.' + name)); } catch { return false; }
    };

    return {
      node: typeof cc.Node === 'function',
      vec3: typeof cc.Vec3 === 'function',
      vec2: typeof cc.Vec2 === 'function',
      director: !!cc.director,
      assetManager: !!cc.assetManager,
      instantiate: typeof cc.instantiate === 'function',
      animationClip: !!cc.AnimationClip,
      wrapMode: !!cc.WrapMode,
      animationComponent: probe('Animation') || probe('AnimationComponent'),
      hierarchyPath: !!cc.animation?.HierarchyPath,
      componentPath: !!cc.animation?.ComponentPath,
      uiTransform: probe('UITransform'),
      uiOpacity: probe('UIOpacity'),
      sprite: probe('Sprite'),
      label: probe('Label'),
      button: probe('Button'),
      canvas: probe('Canvas'),
      camera: probe('Camera'),
      widget: probe('Widget'),
      layout: probe('Layout'),
      scrollView: probe('ScrollView'),
      richText: probe('RichText'),
      boxCollider2D: probe('BoxCollider2D'),
      circleCollider2D: probe('CircleCollider2D'),
      polygonCollider2D: probe('PolygonCollider2D'),
      rigidBody2D: probe('RigidBody2D'),
      rigidBody3D: probe('RigidBody'),
      physicsSystem2D: probe('PhysicsSystem2D'),
      physicsSystem3D: probe('PhysicsSystem'),
      distanceJoint2D: probe('DistanceJoint2D'),
      renderTexture: probe('RenderTexture'),
      tween: typeof cc.tween === 'function',
      layers: !!cc.Layers,
    };
  },

  dispatchQuery(params: Record<string, unknown>) {
    const scene = getScene();
    if (!scene) return { error: '没有打开的场景' };
    const action = toStr(params.action);
    const handler = queryHandlers.get(action);
    if (!handler) return { error: `未知的查询 action: ${action}` };
    return handler(this, scene, params);
  },

  dispatchOperation(params: Record<string, unknown>) {
    const scene = getScene();
    if (!scene) return { error: '没有打开的场景' };
    const action = toStr(params.action);
    const handler = operationHandlers.get(action);
    if (!handler) return { error: `未知的操作 action: ${action}` };

    // Wrap ALL operations with begin-recording / end-recording for Undo
    return (async () => {
      await beginRecording();
      try {
        const result = handler(this, scene, params);
        // handler may return a promise (async operations) or a plain value
        return await Promise.resolve(result);
      } finally {
        await endRecording();
      }
    })();
  },

  dispatchEngineAction(params: Record<string, unknown>) {
    const { director, game, sys, assetManager } = getCC();
    const action = toStr(params.action);
    switch (action) {
      case 'set_frame_rate': {
        const fps = typeof params.fps === 'number' ? params.fps : 60;
        game.frameRate = fps;
        return { success: true, action: 'set_frame_rate', fps };
      }
      case 'pause_engine': { director.pause(); return { success: true, action: 'pause_engine' }; }
      case 'resume_engine': { director.resume(); return { success: true, action: 'resume_engine' }; }
      case 'get_system_info': {
        return {
          os: sys.os, osVersion: sys.osVersion, browserType: sys.browserType,
          language: sys.language, isMobile: sys.isMobile, isNative: sys.isNative,
          isBrowser: sys.isBrowser, platform: sys.platform,
        };
      }
      case 'dump_texture_cache': {
        const MAX_DUMP = 500;
        const assets: Array<{ uuid: string; type: string; name: string }> = [];
        let totalCount = 0;
        let truncated = false;
        if (assetManager?.assets && typeof assetManager.assets.forEach === 'function') {
          assetManager.assets.forEach((asset: CachedAssetInfo, assetUuid: string) => {
            totalCount++;
            if (assets.length < MAX_DUMP) {
              assets.push({ uuid: assetUuid, type: asset.__classname__ ?? 'Unknown', name: asset.name ?? 'unnamed' });
            } else {
              truncated = true;
            }
          });
        }
        return { success: true, action: 'dump_texture_cache', totalCount, returned: assets.length, truncated, topAssets: assets };
      }
      case 'get_render_stats': {
        const stats: {
          renderer?: string; vendor?: string;
          drawCalls?: number; instances?: number; triangles?: number;
          totalFrames?: number; frameRate?: number; _warning?: string;
        } = {};
        try {
          const root = director.root as RenderRootLike | undefined;
          if (root) {
            const device = root.device;
            if (device) {
              stats.renderer = device.renderer ?? '';
              stats.vendor = device.vendor ?? '';
            }
            const pipeline = root.pipeline;
            if (pipeline) {
              const pStats: PipelineStatsLike | undefined = pipeline.stats ?? pipeline._stats;
              if (pStats) {
                stats.drawCalls = pStats.drawCalls ?? pStats.dc ?? 0;
                stats.instances = pStats.instances ?? 0;
                stats.triangles = pStats.tris ?? pStats.triangles ?? 0;
              }
            }
          }
          stats.totalFrames = game.totalFrames ?? 0;
          stats.frameRate = game.frameRate ?? 60;
        } catch (e: unknown) {
          stats._warning = `部分统计信息不可用: ${e instanceof Error ? e.message : toStr(e)}`;
        }
        return { success: true, action: 'get_render_stats', ...stats };
      }
      case 'get_memory_stats': {
        const mem: {
          heapUsed?: number; heapTotal?: number; rss?: number; external?: number;
          unit?: string; cachedAssets?: number; _warning?: string;
        } = {};
        try {
          if (typeof process !== 'undefined' && process.memoryUsage) {
            const usage = process.memoryUsage();
            mem.heapUsed = Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100;
            mem.heapTotal = Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100;
            mem.rss = Math.round(usage.rss / 1024 / 1024 * 100) / 100;
            mem.external = Math.round(usage.external / 1024 / 1024 * 100) / 100;
            mem.unit = 'MB';
          }
          if (assetManager?.assets) {
            const assetsMap = assetManager.assets as { count?: number; size?: number; forEach: Function };
            mem.cachedAssets = assetsMap.count ?? assetsMap.size ?? 0;
          }
        } catch (e: unknown) {
          mem._warning = e instanceof Error ? e.message : toStr(e);
        }
        return { success: true, action: 'get_memory_stats', ...mem };
      }
      case 'get_editor_performance': {
        const perf: {
          totalFrames?: number; frameRate?: number; isPaused?: boolean;
          sceneNodeCount?: number; platform?: string | number; os?: string; _warning?: string;
        } = {};
        try {
          perf.totalFrames = game.totalFrames ?? 0;
          perf.frameRate = game.frameRate ?? 60;
          perf.isPaused = director.isPaused?.() ?? false;
          const scene = getScene();
          if (scene) {
            let nodeCount = 0;
            const walk = (n: CocosNode) => { nodeCount++; for (const c of n.children ?? []) walk(c); };
            walk(scene);
            perf.sceneNodeCount = nodeCount;
          }
          perf.platform = sys.platform;
          perf.os = sys.os;
        } catch (e: unknown) {
          perf._warning = e instanceof Error ? e.message : toStr(e);
        }
        return { success: true, action: 'get_editor_performance', ...perf };
      }
      default: return { error: `未知的引擎全局操作 action: ${action}` };
    }
  },

  // ─── Animation: create clip and attach to node ───────────────────────
  createAnimationClip(params: Record<string, unknown>) {
    try {
      const cc = getCC();
      const AnimClip = cc.AnimationClip;
      if (!AnimClip) return { error: 'AnimationClip 类不可用，请确认 Cocos 版本 >= 3.4' };

      const uuid = toStr(params.uuid);
      const scene = getScene();
      if (!scene) return { error: '没有打开的场景' };
      const node = uuid ? findNodeByUuid(scene, uuid) : null;
      if (uuid && !node) return { error: `未找到节点: ${uuid}` };

      const duration = toNum(params.duration, 1);
      const wrapMode = toStr(params.wrapMode, 'Normal');
      const speed = toNum(params.speed, 1);
      const sample = toNum(params.sample, 60);
      const tracks = params.tracks as Array<{
        path?: string; component?: string; property: string;
        keyframes: Array<{ time: number; value: unknown; easing?: string }>;
      }> | undefined;

      if (!Array.isArray(tracks) || tracks.length === 0) {
        return { error: '缺少 tracks 参数（至少需要一条动画轨道）' };
      }

      // Build keyframe time array and curves
      const allTimes = new Set<number>();
      for (const t of tracks) {
        for (const kf of t.keyframes) allTimes.add(kf.time);
      }
      const sortedTimes = [...allTimes].sort((a, b) => a - b);

      const clip = new AnimClip();
      clip.duration = duration;
      clip.speed = speed;
      clip.sample = sample;
      clip.keys = [sortedTimes];

      // Resolve wrap mode
      if (cc.WrapMode) {
        const modeMap: Record<string, number> = {
          normal: cc.WrapMode.Normal ?? 0,
          loop: cc.WrapMode.Loop ?? 2,
          pingpong: cc.WrapMode.PingPong ?? 6,
          reverse: cc.WrapMode.Reverse ?? 36,
          loopReverse: cc.WrapMode.LoopReverse ?? 38,
        };
        const modeVal = modeMap[wrapMode.toLowerCase()];
        if (modeVal !== undefined) clip.wrapMode = modeVal;
      }

      const curves: unknown[] = [];
      for (const track of tracks) {
        const modifiers: unknown[] = [];
        if (track.path) {
          if (cc.animation.HierarchyPath) modifiers.push(new cc.animation.HierarchyPath(track.path));
          else modifiers.push(track.path);
        }
        if (track.component) {
          if (cc.animation.ComponentPath) {
            modifiers.push(new cc.animation.ComponentPath(track.component));
          }
        }
        modifiers.push(track.property);

        // Build per-curve values aligned to sortedTimes
        const timeToValue = new Map<number, unknown>();
        for (const kf of track.keyframes) timeToValue.set(kf.time, kf.value);

        const values: unknown[] = [];
        const easings: (string | undefined)[] = [];
        for (const t of sortedTimes) {
          values.push(timeToValue.has(t) ? timeToValue.get(t) : undefined);
          const kf = track.keyframes.find(k => k.time === t);
          easings.push(kf?.easing);
        }

        // Filter to only times that have values for this track
        const filteredTimes: number[] = [];
        const filteredValues: unknown[] = [];
        for (let i = 0; i < sortedTimes.length; i++) {
          if (values[i] !== undefined) {
            filteredTimes.push(sortedTimes[i]);
            filteredValues.push(values[i]);
          }
        }

        // Use a dedicated keys entry for this curve if it differs from global
        let keysIdx = 0;
        if (filteredTimes.length !== sortedTimes.length) {
          keysIdx = clip.keys.length;
          clip.keys.push(filteredTimes);
        }

        const curveData: { keys: number; values: unknown[]; interpolate: boolean } = {
          keys: keysIdx,
          values: filteredValues,
          interpolate: true,
        };

        curves.push({ modifiers, data: curveData });
      }

      clip.curves = curves;

      // Attach to node if provided
      let attachResult: { attached: boolean; uuid?: string; nodeName?: string; error?: string } | null = null;
      if (node) {
        const AnimComp = cc.Animation || cc.AnimationComponent;
        if (AnimComp) {
          let anim = node.getComponent(AnimComp);
          if (!anim) anim = node.addComponent(AnimComp);
          if (anim) {
            try {
              const ac = anim as AnimationComponentLike;
              if (typeof ac.addClip === 'function') {
                ac.addClip(clip);
              } else if (typeof ac.createState === 'function') {
                ac.createState(clip);
              } else {
                // Fallback: set clips array directly
                const existing = ac.clips || [];
                ac.clips = [...existing, clip];
              }
              attachResult = { attached: true, uuid, nodeName: node.name };
              if (uuid && anim) {
                notifyEditorComponentProperty(uuid, node, anim, 'clips', { type: 'array', value: (anim as AnimationComponentLike).clips });
              }
            } catch (attachErr: unknown) {
              attachResult = { attached: false, error: attachErr instanceof Error ? attachErr.message : toStr(attachErr) };
            }
          }
        } else {
          attachResult = { attached: false, error: 'Animation/AnimationComponent 类不可用' };
        }
      }

      return {
        success: true,
        clipDuration: duration,
        trackCount: tracks.length,
        keyframeTimesCount: sortedTimes.length,
        wrapMode,
        speed,
        ...(attachResult ? { attach: attachResult } : {}),
        _clipRef: clip, // Internal reference for caller to serialize
      };
    } catch (err: unknown) {
      return { error: `创建动画失败: ${err instanceof Error ? err.message : toStr(err)}` };
    }
  },

  // ─── Physics: auto-fit collider to sprite bounds / alpha outline ─────
  autoFitCollider(params: Record<string, unknown>) {
    try {
      const cc = getCC();
      const scene = getScene();
      if (!scene) return { error: '没有打开的场景' };
      const uuid = toStr(params.uuid);
      const node = findNodeByUuid(scene, uuid);
      if (!node) return { error: `未找到节点: ${uuid}` };

      const colliderType = toStr(params.colliderType, 'auto');
      const alphaThreshold = toNum(params.alphaThreshold, 0.1);
      const simplifyTolerance = toNum(params.simplifyTolerance, 2.0);
      const maxVertices = Math.min(toNum(params.maxVertices, 64), 256);

      // Helper: get UITransform content size
      const UITransform = cc.js.getClassByName('UITransform') || cc.js.getClassByName('cc.UITransform');
      const uiTransform = UITransform ? node.getComponent(UITransform) as UITransformLike | null : null;
      const contentSize: SizeLike | null = uiTransform ? uiTransform.contentSize : null;

      // Helper: get Sprite component and its spriteFrame
      const SpriteClass = cc.js.getClassByName('Sprite') || cc.js.getClassByName('cc.Sprite');
      const sprite = SpriteClass ? node.getComponent(SpriteClass) as SpriteLike | null : null;
      const spriteFrame: SpriteFrameLike | null = sprite?.spriteFrame ?? null;

      // Try to extract alpha outline from texture
      let outlinePoints: Array<{ x: number; y: number }> | null = null;
      let outlineMethod = 'none';

      if (spriteFrame && (colliderType === 'auto' || colliderType === 'polygon')) {
        // Attempt 1: use spriteFrame's built-in vertices if available (Cocos stores trimmed mesh data)
        const sfVertices = spriteFrame.vertices;
        if (sfVertices && Array.isArray(sfVertices.x) && sfVertices.x.length >= 3) {
          outlinePoints = sfVertices.x.map((x: number, i: number) => ({ x, y: sfVertices.y[i] }));
          outlineMethod = 'spriteFrame_vertices';
        }

        // Attempt 2: try reading texture pixels via renderTexture (best-effort)
        if (!outlinePoints) {
          try {
            const texture: TextureLike | null = spriteFrame.texture ?? null;
            if (texture) {
              const width = texture.width ?? 0;
              const height = texture.height ?? 0;

              if (width > 0 && height > 0) {
                // Try to use gfx device readPixels or renderTexture approach
                const RenderTexture = cc.js.getClassByName('RenderTexture') || cc.js.getClassByName('cc.RenderTexture');
                if (RenderTexture && typeof texture.readPixels === 'function') {
                  const pixels = texture.readPixels(0, 0, width, height);
                  if (pixels && pixels.length >= width * height * 4) {
                    outlinePoints = extractAlphaOutline(pixels, width, height, alphaThreshold, simplifyTolerance, maxVertices);
                    if (outlinePoints && outlinePoints.length >= 3) {
                      outlineMethod = 'texture_readPixels';
                    } else {
                      outlinePoints = null;
                    }
                  }
                }
              }
            }
          } catch (e) {
            logIgnored(ErrorCategory.ENGINE_API, 'readPixels 提取精灵轮廓失败（可能不可用）', e);
          }
        }
      }

      // Determine final collider type
      let finalType: 'polygon' | 'box' | 'circle';
      if (colliderType === 'polygon' || (colliderType === 'auto' && outlinePoints && outlinePoints.length >= 3)) {
        finalType = 'polygon';
      } else if (colliderType === 'circle') {
        finalType = 'circle';
      } else {
        finalType = 'box';
      }

      const warnings: string[] = [];
      const result: {
        uuid: string; nodeName: string;
        colliderType?: string; pointCount?: number; points?: Array<{ x: number; y: number }>;
        radius?: number; size?: SizeLike; outlineMethod?: string;
      } = { uuid, nodeName: node.name };

      if (finalType === 'polygon') {
        const PolygonCollider = cc.js.getClassByName('PolygonCollider2D') || cc.js.getClassByName('cc.PolygonCollider2D');
        if (!PolygonCollider) return { error: 'PolygonCollider2D 类不可用' };

        let collider = node.getComponent(PolygonCollider) as ColliderComponentLike | null;
        if (!collider) collider = node.addComponent(PolygonCollider) as ColliderComponentLike;
        if (!collider) return { error: '无法添加 PolygonCollider2D 组件' };

        let points: Array<{ x: number; y: number }>;
        if (outlinePoints && outlinePoints.length >= 3) {
          points = outlinePoints;
        } else {
          // Fallback: generate rectangle from content size
          warnings.push('无法从贴图提取轮廓，已回退为矩形近似');
          const w = contentSize ? contentSize.width / 2 : 50;
          const h = contentSize ? contentSize.height / 2 : 50;
          points = [{ x: -w, y: -h }, { x: w, y: -h }, { x: w, y: h }, { x: -w, y: h }];
          outlineMethod = 'rect_fallback';
        }

        // Convert to Vec2 array and assign
        const Vec2 = cc.Vec2;
        const vec2Points = points.map(p => new Vec2(p.x, p.y));
        collider.points = vec2Points;

        result.colliderType = 'PolygonCollider2D';
        result.pointCount = points.length;
        result.points = points;
        result.outlineMethod = outlineMethod;
      } else if (finalType === 'circle') {
        const CircleCollider = cc.js.getClassByName('CircleCollider2D') || cc.js.getClassByName('cc.CircleCollider2D');
        if (!CircleCollider) return { error: 'CircleCollider2D 类不可用' };

        let collider = node.getComponent(CircleCollider) as ColliderComponentLike | null;
        if (!collider) collider = node.addComponent(CircleCollider) as ColliderComponentLike;
        if (!collider) return { error: '无法添加 CircleCollider2D 组件' };

        const radius = contentSize ? Math.max(contentSize.width, contentSize.height) / 2 : 50;
        collider.radius = radius;

        result.colliderType = 'CircleCollider2D';
        result.radius = radius;
        result.outlineMethod = 'circle_from_size';
      } else {
        // Box collider
        const BoxCollider = cc.js.getClassByName('BoxCollider2D') || cc.js.getClassByName('cc.BoxCollider2D');
        if (!BoxCollider) return { error: 'BoxCollider2D 类不可用' };

        let collider = node.getComponent(BoxCollider) as ColliderComponentLike | null;
        if (!collider) collider = node.addComponent(BoxCollider) as ColliderComponentLike;
        if (!collider) return { error: '无法添加 BoxCollider2D 组件' };

        const w = contentSize ? contentSize.width : 100;
        const h = contentSize ? contentSize.height : 100;
        const Size = cc.js.getClassByName('Size') || cc.js.getClassByName('cc.Size');
        if (Size) {
          collider.size = new Size(w, h);
        } else {
          collider.size = { width: w, height: h };
        }

        result.colliderType = 'BoxCollider2D';
        result.size = { width: w, height: h };
        result.outlineMethod = 'box_from_size';
      }

      const finalResult: Record<string, unknown> = {
        success: true,
        ...result,
        ...(warnings.length ? { warnings } : {}),
      };
      return (async () => {
        await notifyEditorProperty(uuid, 'active', { type: 'boolean', value: node.active });
        finalResult._inspectorRefreshed = true;
        return finalResult;
      })();
    } catch (err: unknown) {
      return { error: `自动适配碰撞体失败: ${err instanceof Error ? err.message : String(err)}` };
    }
  },

  dispatchAnimationAction(params: Record<string, unknown>) {
    const cc = getCC();
    const { js } = cc;
    const scene = getScene();
    if (!scene) return { error: '没有打开的场景' };
    const action = toStr(params.action);
    const uuid = toStr(params.uuid);
    const node = uuid ? findNodeByUuid(scene, uuid) : null;
    if (uuid && !node) return { error: `未找到节点: ${uuid}` };

    const AnimClass = js.getClassByName('Animation') || js.getClassByName('cc.Animation') || js.getClassByName('AnimationComponent') || js.getClassByName('cc.AnimationComponent');
    if (!AnimClass) return { error: 'Animation 组件类不可用' };

    switch (action) {
      case 'play': {
        if (!node) return { error: '缺少 uuid' };
        const anim = node.getComponent(AnimClass) as AnimationComponentLike | null;
        if (!anim) return { error: '节点上没有 Animation 组件' };
        const clipName = params.clipName ? toStr(params.clipName) : undefined;
        if (typeof anim.play === 'function') {
          anim.play(clipName);
          return { success: true, uuid, action: 'play', clipName: clipName ?? 'default' };
        }
        return { error: 'Animation.play 方法不可用' };
      }
      case 'pause': {
        if (!node) return { error: '缺少 uuid' };
        const anim = node.getComponent(AnimClass) as AnimationComponentLike | null;
        if (!anim) return { error: '节点上没有 Animation 组件' };
        if (typeof anim.pause === 'function') {
          anim.pause();
          return { success: true, uuid, action: 'pause' };
        }
        return { error: 'Animation.pause 方法不可用' };
      }
      case 'resume': {
        if (!node) return { error: '缺少 uuid' };
        const anim = node.getComponent(AnimClass) as AnimationComponentLike | null;
        if (!anim) return { error: '节点上没有 Animation 组件' };
        if (typeof anim.resume === 'function') {
          anim.resume();
          return { success: true, uuid, action: 'resume' };
        }
        return { error: 'Animation.resume 方法不可用' };
      }
      case 'stop': {
        if (!node) return { error: '缺少 uuid' };
        const anim = node.getComponent(AnimClass) as AnimationComponentLike | null;
        if (!anim) return { error: '节点上没有 Animation 组件' };
        if (typeof anim.stop === 'function') {
          anim.stop();
          return { success: true, uuid, action: 'stop' };
        }
        return { error: 'Animation.stop 方法不可用' };
      }
      case 'set_current_time': {
        if (!node) return { error: '缺少 uuid' };
        const anim = node.getComponent(AnimClass) as AnimationComponentLike | null;
        if (!anim) return { error: '节点上没有 Animation 组件' };
        const time = toNum(params.time);
        // Try to get current state and set time
        if (typeof anim.getState === 'function') {
          const clips: AnimClipRef[] = anim.clips || [];
          for (const clip of clips) {
            if (!clip?.name) continue;
            const state = anim.getState(clip.name);
            if (state) { state.time = time; return { success: true, uuid, time }; }
          }
        }
        return { success: false, message: '无法设置当前时间，未找到活跃的动画状态' };
      }
      case 'set_speed': {
        if (!node) return { error: '缺少 uuid' };
        const anim = node.getComponent(AnimClass) as AnimationComponentLike | null;
        if (!anim) return { error: '节点上没有 Animation 组件' };
        const speed = toNum(params.speed, 1);
        // Set speed on all clips' states
        if (typeof anim.getState === 'function') {
          const clips: AnimClipRef[] = anim.clips || [];
          let set = false;
          for (const clip of clips) {
            if (!clip?.name) continue;
            const state = anim.getState(clip.name);
            if (state) { state.speed = speed; set = true; }
          }
          if (set) return { success: true, uuid, speed };
        }
        return { success: false, message: '无法设置速度，未找到动画状态' };
      }
      case 'crossfade': {
        if (!node) return { error: '缺少 uuid' };
        const anim = node.getComponent(AnimClass) as AnimationComponentLike | null;
        if (!anim) return { error: '节点上没有 Animation 组件' };
        const clipName = toStr(params.clipName);
        if (!clipName) return { error: '缺少 clipName 参数' };
        const duration = toNum(params.duration, 0.3);
        if (typeof anim.crossFade === 'function') {
          anim.crossFade(clipName, duration);
          return { success: true, uuid, clipName, duration };
        }
        // Fallback: just play
        if (typeof anim.play === 'function') {
          anim.play(clipName);
          return { success: true, uuid, clipName, duration, fallback: 'play (crossFade not available)' };
        }
        return { error: 'crossFade 和 play 方法均不可用' };
      }
      default:
        return { error: `未知的动画 action: ${action}` };
    }
  },

  dispatchPhysicsAction(params: Record<string, unknown>) {
    const cc = getCC();
    const { js } = cc;
    const scene = getScene();
    if (!scene) return { error: '没有打开的场景' };
    const action = toStr(params.action);
    const uuid = toStr(params.uuid);
    const node = uuid ? findNodeByUuid(scene, uuid) : null;

    switch (action) {
      case 'set_collider_size': {
        if (!node) return { error: `未找到节点: ${uuid}` };
        for (const comp of (node._components || [])) {
          const cn = getComponentName(comp).replace('cc.', '');
          const c = comp as ColliderComponentLike;
          if (cn.includes('BoxCollider')) {
            if (params.width !== undefined || params.height !== undefined) {
              const Size = js.getClassByName('Size') || js.getClassByName('cc.Size');
              const curSize = c.size as SizeLike | undefined;
              const w = toNum(params.width, curSize?.width ?? 100);
              const h = toNum(params.height, curSize?.height ?? 100);
              c.size = Size ? new Size(w, h) : { width: w, height: h };
              const result: Record<string, unknown> = { success: true, uuid, collider: cn, size: { width: w, height: h } };
              return (async () => { await notifyEditorComponentProperty(uuid, node, comp, 'size', { type: 'cc.Size', value: { width: w, height: h } }); result._inspectorRefreshed = true; return result; })();
            }
          }
          if (cn.includes('CircleCollider') || cn.includes('SphereCollider')) {
            if (params.radius !== undefined) {
              c.radius = toNum(params.radius);
              const result: Record<string, unknown> = { success: true, uuid, collider: cn, radius: c.radius };
              return (async () => { await notifyEditorComponentProperty(uuid, node, comp, 'radius', { type: 'number', value: c.radius }); result._inspectorRefreshed = true; return result; })();
            }
          }
          if (cn.includes('CapsuleCollider')) {
            if (params.radius !== undefined) c.radius = toNum(params.radius);
            if (params.height !== undefined) c.height = toNum(params.height);
            const result: Record<string, unknown> = { success: true, uuid, collider: cn, radius: c.radius, height: c.height };
            return (async () => { await notifyEditorProperty(uuid, 'active', { type: 'boolean', value: node.active }); result._inspectorRefreshed = true; return result; })();
          }
        }
        return { error: '节点上未找到碰撞体组件' };
      }
      case 'set_rigidbody_props': {
        if (!node) return { error: `未找到节点: ${uuid}` };
        const RB2D = js.getClassByName('RigidBody2D') || js.getClassByName('cc.RigidBody2D');
        const RB3D = js.getClassByName('RigidBody') || js.getClassByName('cc.RigidBody');
        let rb: RigidBodyLike | null = null;
        let rbType = '';
        if (RB2D) { const c = node.getComponent(RB2D); if (c) { rb = c as RigidBodyLike; rbType = 'RigidBody2D'; } }
        if (!rb && RB3D) { const c = node.getComponent(RB3D); if (c) { rb = c as RigidBodyLike; rbType = 'RigidBody'; } }
        if (!rb) return { error: '节点上未找到 RigidBody 组件' };
        const applied: Partial<RigidBodyLike> = {};
        if (params.mass !== undefined) { rb.mass = toNum(params.mass); applied.mass = rb.mass; }
        if (params.linearDamping !== undefined) { rb.linearDamping = toNum(params.linearDamping); applied.linearDamping = rb.linearDamping; }
        if (params.angularDamping !== undefined) { rb.angularDamping = toNum(params.angularDamping); applied.angularDamping = rb.angularDamping; }
        if (params.gravityScale !== undefined) { rb.gravityScale = toNum(params.gravityScale); applied.gravityScale = rb.gravityScale; }
        if (params.fixedRotation !== undefined) { rb.fixedRotation = !!params.fixedRotation; applied.fixedRotation = rb.fixedRotation; }
        if (params.allowSleep !== undefined) { rb.allowSleep = !!params.allowSleep; applied.allowSleep = rb.allowSleep; }
        if (params.bullet !== undefined) { rb.bullet = !!params.bullet; applied.bullet = rb.bullet; }
        const rbResult: Record<string, unknown> = { success: true, uuid, rbType, applied };
        return (async () => {
          for (const [prop, val] of Object.entries(applied)) {
            const dt = typeof val === 'boolean' ? 'boolean' : 'number';
            await notifyEditorComponentProperty(uuid, node, rb!, prop, { type: dt, value: val });
          }
          rbResult._inspectorRefreshed = true;
          return rbResult;
        })();
      }
      case 'set_physics_material': {
        if (!node) return { error: `未找到节点: ${uuid}` };
        for (const comp of (node._components || [])) {
          const cn = getComponentName(comp).replace('cc.', '');
          if (!cn.includes('Collider')) continue;
          const c = comp as ColliderComponentLike;
          const pmApplied: { friction?: number; restitution?: number; density?: number } = {};
          if (params.friction !== undefined) { c.friction = toNum(params.friction); pmApplied.friction = c.friction; }
          if (params.restitution !== undefined) { c.restitution = toNum(params.restitution); pmApplied.restitution = c.restitution; }
          if (params.density !== undefined) { c.density = toNum(params.density); pmApplied.density = c.density; }
          const pmResult: Record<string, unknown> = { success: true, uuid, collider: cn, applied: pmApplied };
          return (async () => {
            for (const [prop, val] of Object.entries(pmApplied)) {
              await notifyEditorComponentProperty(uuid, node, comp, prop, { type: 'number', value: val });
            }
            pmResult._inspectorRefreshed = true;
            return pmResult;
          })();
        }
        return { error: '节点上未找到碰撞体组件' };
      }
      case 'set_collision_group': {
        if (!node) return { error: `未找到节点: ${uuid}` };
        const group = toNum(params.group);
        let groupSet = false;
        for (const comp of (node._components || [])) {
          const cn = getComponentName(comp).replace('cc.', '');
          if (!cn.includes('Collider')) continue;
          (comp as ColliderComponentLike).group = group;
          groupSet = true;
        }
        if (!groupSet) return { error: '节点上未找到碰撞体组件' };
        const grpResult: Record<string, unknown> = { success: true, uuid, group };
        return (async () => { await notifyEditorProperty(uuid, 'active', { type: 'boolean', value: node!.active }); grpResult._inspectorRefreshed = true; return grpResult; })();
      }
      case 'get_physics_world': {
        type PhysicsWorldInfo = { gravity?: unknown; allowSleep?: boolean; fixedTimeStep?: number; enabled?: boolean };
        const result: { physics2D?: PhysicsWorldInfo; physics3D?: PhysicsWorldInfo } = {};
        const PS2D = js.getClassByName('PhysicsSystem2D') || js.getClassByName('cc.PhysicsSystem2D');
        const PS3D = js.getClassByName('PhysicsSystem') || js.getClassByName('cc.PhysicsSystem');
        if (PS2D) {
          const inst = (PS2D as { instance?: PhysicsSystemInstance }).instance;
          if (inst) {
            result.physics2D = {
              gravity: inst.gravity,
              allowSleep: inst.allowSleep,
              fixedTimeStep: inst.fixedTimeStep,
              enabled: inst.enable ?? inst.enabled,
            };
          }
        }
        if (PS3D) {
          const inst = (PS3D as { instance?: PhysicsSystemInstance }).instance;
          if (inst) {
            result.physics3D = {
              gravity: inst.gravity,
              allowSleep: inst.allowSleep,
              fixedTimeStep: inst.fixedTimeStep,
              enabled: inst.enable ?? inst.enabled,
            };
          }
        }
        if (!result.physics2D && !result.physics3D) return { error: '物理系统不可用' };
        return { success: true, ...result };
      }
      case 'add_joint': {
        if (!node) return { error: `未找到节点: ${uuid}` };
        const jointType = toStr(params.jointType);
        const JOINT_MAP: Record<string, string> = {
          distance: 'DistanceJoint2D', spring: 'SpringJoint2D',
          hinge: 'HingeJoint2D', fixed: 'FixedJoint2D', slider: 'SliderJoint2D',
        };
        const compName = JOINT_MAP[jointType];
        if (!compName) return { error: `未知的 jointType: ${jointType}，支持: ${Object.keys(JOINT_MAP).join(', ')}` };
        const JointClass = js.getClassByName(compName) || js.getClassByName('cc.' + compName);
        if (!JointClass) return { error: `${compName} 组件不可用` };
        const joint = node.addComponent(JointClass);
        if (!joint) return { error: `无法添加 ${compName}` };
        // Set connected body
        if (params.connectedUuid) {
          const connNode = findNodeByUuid(scene, toStr(params.connectedUuid));
          if (connNode) {
            const RB2D = js.getClassByName('RigidBody2D') || js.getClassByName('cc.RigidBody2D');
            if (RB2D) {
              const rb = connNode.getComponent(RB2D);
              if (rb) joint.connectedBody = rb;
            }
          }
        }
        // Apply extra props
        if (params.props && typeof params.props === 'object') {
          for (const [k, v] of Object.entries(params.props as Record<string, unknown>)) {
            try { joint[k] = v; } catch (e) { logIgnored(ErrorCategory.PROPERTY_ASSIGN, `关节属性 "${k}" 赋值失败`, e); }
          }
        }
        return { success: true, uuid, jointType, component: compName };
      }
      default:
        return { error: `未知的物理 action: ${action}` };
    }
  },

  setReferenceImage(active: boolean, opacity: number) {
    const { js } = getCC();
    const scene = getScene();
    if (!scene) return { error: '没有打开的场景' };
    const refNodes: CocosNode[] = [];
    const walk = (node: CocosNode) => {
      if (node.name?.toLowerCase().includes('reference')) refNodes.push(node);
      for (const child of node.children ?? []) walk(child);
    };
    walk(scene);
    if (refNodes.length === 0) {
      return { success: false, info: '场景中未找到 Reference 节点。请在场景中添加名为 Reference-Image 的节点。' };
    }
    for (const node of refNodes) {
      node.active = active;
      try {
        const OpacityClass = js.getClassByName('cc.UIOpacity');
        if (OpacityClass) {
          let opComp = node.getComponent(OpacityClass);
          if (!opComp && active) opComp = node.addComponent(OpacityClass);
          if (opComp) (opComp as UIOpacityLike).opacity = Math.round(opacity * 255);
        }
      } catch (e) { logIgnored(ErrorCategory.ENGINE_API, 'UIOpacity 组件操作失败（可能不可用）', e); }
    }
    return {
      success: true, active, opacity,
      affectedNodes: refNodes.map((n) => ({ uuid: n.uuid ?? n._id, name: n.name })),
    };
  },
};
