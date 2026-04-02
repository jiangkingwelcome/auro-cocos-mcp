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
import { inspectReparentOutcome, isComponentRemoved } from './scene-mutation-verifier';
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
let _recordingToken: string | null = null;

function getRecordingTargetsForParams(scene: CocosNode, params: Record<string, unknown>): string[] {
  const uuid = String(params.uuid ?? '').trim();
  if (uuid) return [uuid];
  const action = String(params.action ?? '').trim();
  if (action === 'create_node') {
    const parentUuid = String(params.parentUuid ?? '').trim();
    if (parentUuid) return [parentUuid];
    const sceneUuid = String(scene.uuid ?? scene._id ?? '').trim();
    return sceneUuid ? [sceneUuid] : [];
  }
  if (action === 'batch' && Array.isArray(params.operations)) {
    const uuids = params.operations
      .map((item) => {
        if (!item || typeof item !== 'object') return '';
        const entry = item as Record<string, unknown>;
        const itemUuid = String(entry.uuid ?? '').trim();
        if (itemUuid) return itemUuid;
        if (String(entry.action ?? '') === 'create_node') {
          return String(entry.parentUuid ?? '').trim();
        }
        return '';
      })
      .filter(Boolean);
    if (uuids.length > 0) return uuids;
    const sceneUuid = String(scene.uuid ?? scene._id ?? '').trim();
    return sceneUuid ? [sceneUuid] : [];
  }
  return [];
}

async function beginRecording(targetUuids: string[] = []): Promise<boolean> {
  _recordingDepth++;
  if (_recordingDepth > 1) return true; // nested — already recording
  try {
    const normalized = targetUuids
      .map((item) => String(item ?? '').trim())
      .filter(Boolean);
    const token = await Editor.Message.request('scene', 'begin-recording', normalized, null);
    _recordingToken = token === undefined || token === null || token === '' ? null : String(token);
    return true;
  } catch (e) {
    _recordingToken = null;
    logIgnored(ErrorCategory.EDITOR_IPC, 'begin-recording 不可用，Undo 记录跳过', e);
    return false;
  }
}

async function endRecording(): Promise<boolean> {
  _recordingDepth = Math.max(0, _recordingDepth - 1);
  if (_recordingDepth > 0) return true; // still nested
  try {
    if (_recordingToken) {
      await Editor.Message.request('scene', 'end-recording', _recordingToken);
    } else {
      await Editor.Message.request('scene', 'end-recording');
    }
    _recordingToken = null;
    return true;
  } catch (e) {
    _recordingToken = null;
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

/** 判断 `ctor` 是否为 `cc.Component` 子类（用于区分引擎内置组件名 vs 用户脚本短类名） */
function isEngineComponentConstructor(ctor: unknown, componentBase: unknown): boolean {
  if (!ctor || !componentBase) return false;
  const { js } = require('cc') as CocosCC;
  const isChild = js.isChildClassOf;
  if (typeof isChild !== 'function') return false;
  try {
    return !!isChild(ctor, componentBase);
  } catch {
    return false;
  }
}

function isComponentConstructor(ctor: unknown, componentBase: unknown): boolean {
  if (!ctor || !componentBase) return false;
  if (isEngineComponentConstructor(ctor, componentBase)) return true;
  if (typeof ctor === 'function' && typeof componentBase === 'function') {
    return ctor === componentBase || ctor.prototype instanceof componentBase;
  }
  return false;
}

function resolveComponentClass(cc: CocosCC, componentName: string): unknown {
  const exactClass = cc.js.getClassByName(componentName);
  if (exactClass) return exactClass;
  if (!componentName.startsWith('cc.')) return cc.js.getClassByName(`cc.${componentName}`);
  return null;
}

type SerializablePropertyDump =
  | { kind: 'primitive'; dumpType: 'boolean' | 'number' | 'string'; value: boolean | number | string }
  | { kind: 'editor-dump'; dumpType: 'cc.Color' | 'cc.Rect' | 'cc.Size' | 'cc.Vec3' | 'cc.Vec2'; value: Record<string, unknown> }
  | { kind: 'unsupported'; reason: string };

function classifySerializablePropertyValue(value: unknown): SerializablePropertyDump {
  if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
    return {
      kind: 'primitive',
      dumpType: typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string',
      value,
    };
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;

    if ('r' in obj) {
      return {
        kind: 'editor-dump',
        dumpType: 'cc.Color',
        value: {
          r: Math.max(0, Math.min(255, Number(obj.r ?? 0))),
          g: Math.max(0, Math.min(255, Number(obj.g ?? 0))),
          b: Math.max(0, Math.min(255, Number(obj.b ?? 0))),
          a: Math.max(0, Math.min(255, Number(obj.a ?? 255))),
        },
      };
    }

    if ('width' in obj || 'height' in obj) {
      if ('x' in obj || 'y' in obj) {
        return {
          kind: 'editor-dump',
          dumpType: 'cc.Rect',
          value: {
            x: Number(obj.x ?? 0),
            y: Number(obj.y ?? 0),
            width: Number(obj.width ?? 0),
            height: Number(obj.height ?? 0),
          },
        };
      }
      return {
        kind: 'editor-dump',
        dumpType: 'cc.Size',
        value: {
          width: Number(obj.width ?? 0),
          height: Number(obj.height ?? 0),
        },
      };
    }

    if ('x' in obj || 'y' in obj || 'z' in obj || 'w' in obj) {
      if ('w' in obj) {
        return { kind: 'unsupported', reason: 'Vec4 目前未实现稳定持久化' };
      }
      if ('z' in obj) {
        return {
          kind: 'editor-dump',
          dumpType: 'cc.Vec3',
          value: {
            x: Number(obj.x ?? 0),
            y: Number(obj.y ?? 0),
            z: Number(obj.z ?? 0),
          },
        };
      }
      return {
        kind: 'editor-dump',
        dumpType: 'cc.Vec2',
        value: {
          x: Number(obj.x ?? 0),
          y: Number(obj.y ?? 0),
        },
      };
    }
  }

  if (Array.isArray(value)) {
    return { kind: 'unsupported', reason: '数组值暂未实现稳定持久化' };
  }

  return { kind: 'unsupported', reason: '复杂对象值暂未实现稳定持久化' };
}

function buildNonComponentClassError(cc: CocosCC, componentName: string, label = '组件类') {
  const componentBase = cc.js.getClassByName('cc.Component') || cc.Component;
  if (componentName.startsWith('cc.')) {
    const shortName = componentName.slice(3);
    const shortClass = shortName ? cc.js.getClassByName(shortName) : null;
    if (shortClass && isComponentConstructor(shortClass, componentBase)) {
      return {
        error: `${label} "${componentName}" 不是 cc.Component 子类`,
        hint: `检测到 "${shortName}" 是已注册组件。自定义脚本不要带 "cc." 前缀，请改传 "${shortName}"。`,
      };
    }
  }
  return {
    error: `${label} "${componentName}" 不是 cc.Component 子类`,
    hint: '请确认传入的是 @ccclass 注册名，并且该类继承自 Component。',
  };
}

/** 编辑器 create-component / remove-component 的组件名字符串（cc.Label / sp.Skeleton 等） */
function editorComponentIpcName(componentName: string): string {
  if (componentName.startsWith('cc.')) return componentName;
  // 扩展模块：sp.*、dragonBones.* — 不可再加 cc. 前缀
  if (componentName.includes('.')) return componentName;
  // 仅当 `cc.${shortName}` 在引擎中确实是 cc.Component 子类时才加 cc. 前缀。
  // 否则（用户脚本 @ccclass('Test')、或 cc.Test 等非 Component 占位）必须原样传递类名，
  // 否则会触发编辑器报错：ctor with name cc.Test is not child class of Component。
  const { js } = require('cc') as CocosCC;
  const ccPrefixed = `cc.${componentName}`;
  const ccCls = js.getClassByName(ccPrefixed);
  const compBase = js.getClassByName('cc.Component');
  if (ccCls && compBase && isEngineComponentConstructor(ccCls, compBase)) {
    return ccPrefixed;
  }
  return componentName;
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

  const byUuid = findNodeByUuid(scene, ref);
  if (byUuid) return { node: byUuid };

  if (looksLikeUuid(ref)) {
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
    const ea = node.eulerAngles;
    return {
      uuid: node.uuid ?? node._id, name: node.name, active: node.active,
      path: getNodePath(node),
      position: node.position ? { x: node.position.x, y: node.position.y, z: node.position.z } : null,
      rotation: ea != null ? { x: ea.x, y: ea.y, z: ea.z } : null,
      scale: node.scale ? { x: node.scale.x, y: node.scale.y, z: node.scale.z } : null,
      layer: node.layer,
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
    const comps = (node._components ?? []).map((comp) => {
      const name = getComponentName(comp);
      const type = name.replace(/^cc\./, '');
      return { name, type };
    });
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
      const refreshedScene = getScene();
      if (!refreshedScene) {
        return {
          success: false,
          uuid: newUuid,
          name: nodeName,
          parent: parent.name,
          parentUuid,
          error: 'create-node IPC 已返回，但场景刷新后不可用，无法确认节点是否已创建',
        };
      }
      const createdNode = findNodeByUuid(refreshedScene, newUuid);
      if (!createdNode) {
        return {
          success: false,
          uuid: newUuid,
          name: nodeName,
          parent: parent.name,
          parentUuid,
          error: `create-node IPC 已返回，但场景中未找到新节点: ${newUuid}`,
        };
      }
      const parentCheck = inspectReparentOutcome(createdNode, parentUuid);
      if (!parentCheck.ok) {
        return {
          success: false,
          uuid: newUuid,
          name: createdNode.name,
          parent: parent.name,
          parentUuid,
          actualParent: parentCheck.actualParentName,
          actualParentUuid: parentCheck.actualParentUuid || null,
          error: 'create-node IPC 已返回，但新节点父级与目标父节点不一致',
        };
      }
      return { success: true, uuid: newUuid, name: createdNode.name, parent: parent.name, parentUuid };
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
      const refreshedScene = getScene();
      const remainingNode = refreshedScene ? findNodeByUuid(refreshedScene, uuid) : null;
      if (remainingNode) {
        return {
          success: false,
          uuid,
          name,
          error: 'remove-node IPC 已返回，但节点仍存在于场景中',
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
      const refreshedScene = getScene();
      if (!refreshedScene) {
        return {
          success: false,
          uuid,
          parent: newParent.name,
          parentUuid: newParentUuid,
          error: 'set-parent IPC 已返回，但场景刷新后不可用，无法确认节点是否已移动',
        };
      }
      const refreshedNode = findNodeByUuid(refreshedScene, uuid);
      if (!refreshedNode) {
        return {
          success: false,
          uuid,
          parent: newParent.name,
          parentUuid: newParentUuid,
          error: `set-parent IPC 已返回，但场景中未找到节点: ${uuid}`,
        };
      }
      const parentCheck = inspectReparentOutcome(refreshedNode, newParentUuid);
      if (!parentCheck.ok) {
        return {
          success: false,
          uuid,
          parent: newParent.name,
          parentUuid: newParentUuid,
          actualParent: parentCheck.actualParentName,
          actualParentUuid: parentCheck.actualParentUuid || null,
          error: 'set-parent IPC 已返回，但节点父级未更新',
        };
      }
      return { success: true, uuid, parent: newParent.name, parentUuid: newParentUuid };
    })();
  },

  addComponent(uuid: string, componentName: string) {
    const cc = getCC();
    const { js, Component } = cc;
    const scene = getScene();
    if (!scene) return { error: '没有打开的场景' };
    const node = findNodeByUuid(scene, uuid);
    if (!node) return { error: `未找到节点: ${uuid}` };
    const compClass = resolveComponentClass(cc, componentName);
    if (!compClass) return { error: `未找到组件类: ${componentName}` };
    const componentBase = js.getClassByName('cc.Component') || Component;
    if (!isComponentConstructor(compClass, componentBase)) {
      return buildNonComponentClassError(cc, componentName);
    }
    if (node.getComponent?.(compClass)) {
      return {
        success: true,
        uuid,
        name: node.name,
        component: componentName,
        alreadyAttached: true,
        message: `组件 ${componentName} 已存在，跳过重复添加。`,
      };
    }

    return (async () => {
      await ipcCreateComponent(uuid, componentName);
      const refreshedScene = getScene();
      if (!refreshedScene) {
        return {
          success: false,
          uuid,
          component: componentName,
          error: 'create-component IPC 已返回，但场景刷新后不可用，无法确认组件是否已添加',
        };
      }
      const refreshedNode = findNodeByUuid(refreshedScene, uuid);
      if (!refreshedNode) {
        return {
          success: false,
          uuid,
          component: componentName,
          error: `create-component IPC 已返回，但场景中未找到节点: ${uuid}`,
        };
      }
      if (isComponentRemoved(refreshedNode, compClass)) {
        return {
          success: false,
          uuid,
          component: componentName,
          error: 'create-component IPC 已返回，但组件未出现在节点上',
        };
      }
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
      const refreshedScene = getScene();
      if (!refreshedScene) {
        return {
          success: false,
          uuid,
          component: componentName,
          error: 'remove-component IPC 已返回，但场景刷新后不可用，无法确认组件是否已移除',
        };
      }
      const refreshedNode = findNodeByUuid(refreshedScene, uuid);
      if (!refreshedNode) {
        return {
          success: false,
          uuid,
          component: componentName,
          error: `remove-component IPC 已返回，但场景中未找到节点: ${uuid}`,
        };
      }
      if (!isComponentRemoved(refreshedNode, compClass)) {
        return {
          success: false,
          uuid,
          component: componentName,
          error: 'remove-component IPC 已返回，但组件仍存在于节点上',
        };
      }
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

    const loadAssetByUuid = async (assetUuid: string): Promise<unknown> => {
      const am = cc.assetManager;
      const cached = am?.assets?.get?.(assetUuid);
      if (cached) return cached;
      if (am && typeof am.loadAny === 'function') {
        return await new Promise((resolve, reject) => {
          am.loadAny!(assetUuid, (err: Error | null, asset: unknown) => {
            if (err || !asset) {
              reject(err || new Error(`资源为空: ${assetUuid}`));
              return;
            }
            resolve(asset);
          });
        });
      }
      return null;
    };

    if (Array.isArray(value) && value.every(isAssetRef)) {
      const assetUuids = value.map((entry) => entry.__uuid__);
      const compIndex = (node._components ?? []).indexOf(comp);
      if (compIndex < 0) return { error: `无法定位组件索引: ${componentName}` };
      const propPath = `__comps__.${compIndex}.${property}`;

      return (async () => {
        try {
          const assets = [] as unknown[];
          for (const assetUuid of assetUuids) {
            const loaded = await loadAssetByUuid(assetUuid);
            if (!loaded) {
              return { error: `设置资源数组失败: 无法加载资源 ${assetUuid}` };
            }
            assets.push(loaded);
          }
          try {
            const resetOk = await ipcResetProperty(uuid, propPath);
            if (!resetOk && assetUuids.length === 0) {
              return { error: `设置资源数组失败: 无法清空属性 ${property}` };
            }
            for (let index = 0; index < assetUuids.length; index++) {
              await Editor.Message.request('scene', 'set-property', {
                uuid,
                path: `${propPath}.${index}`,
                dump: { type: 'cc.Asset', value: { uuid: assetUuids[index] } },
              });
            }
            comp[property] = assets;
            return { success: true, uuid, component: componentName, property, resolvedViaEditorIPC: true, assetUuids };
          } catch (ipcErr: unknown) {
            const msg = ipcErr instanceof Error ? ipcErr.message : String(ipcErr);
            logIgnored(ErrorCategory.EDITOR_IPC, `set-property 资源数组 IPC 失败 (${propPath})`, ipcErr);
            return { error: `设置资源数组失败: ${msg}。当前版本未允许仅运行时回退。`, assetUuids };
          }
        } catch (assetErr: unknown) {
          return { error: `设置资源数组失败: ${assetErr instanceof Error ? assetErr.message : String(assetErr)}` };
        }
      })();
    }

    if (isAssetRef(value)) {
      const assetUuid = (value as { __uuid__: string }).__uuid__;

      const compIndex = (node._components ?? []).indexOf(comp);
      if (compIndex < 0) return { error: `无法定位组件索引: ${componentName}` };

      const propPath = `__comps__.${compIndex}.${property}`;

      return (async () => {
        try {
          const loaded = await loadAssetByUuid(assetUuid);
          await Editor.Message.request('scene', 'set-property', {
            uuid,
            path: propPath,
            dump: { type: 'cc.Asset', value: { uuid: assetUuid } },
          });
          if (loaded) {
            comp[property] = loaded;
          }
          return { success: true, uuid, component: componentName, property, resolvedViaEditorIPC: true, assetUuid };
        } catch (ipcErr: unknown) {
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
          const msg = ipcErr instanceof Error ? ipcErr.message : String(ipcErr);
          logIgnored(ErrorCategory.EDITOR_IPC, `set-property Component ref IPC 失败 (${propPath})`, ipcErr);
          return { error: `设置组件引用失败: ${msg}。请确保目标节点与组件存在。`, targetNodeUuid, targetComponent: targetCompName };
        }
      })();
    }

    const compIndex = (node._components ?? []).indexOf(comp);
    if (compIndex < 0) return { error: `无法定位组件索引: ${componentName}` };
    const propPath = `__comps__.${compIndex}.${property}`;
    const classified = classifySerializablePropertyValue(value);
    if (classified.kind === 'unsupported') {
      if (Array.isArray(value)) {
        return { error: `属性 "${property}" 的数组值暂未实现稳定持久化，请改用专用操作或资源引用数组。` };
      }
      return { error: `属性 "${property}" 的${classified.reason}，请改用专用操作。` };
    }
    return (async () => {
      const ok = await notifyEditorProperty(uuid, propPath, {
        type: classified.dumpType,
        value: classified.value,
      });
      if (!ok) {
        return {
          success: false,
          uuid,
          component: componentName,
          property,
          value,
          error: `set-property IPC 未能持久化属性 "${property}"，已阻止仅运行时修改`,
        };
      }
      try {
        comp[property] = value;
      } catch {
        // Editor IPC has already persisted the value; runtime assignment is best-effort only.
      }
      return {
        success: true,
        uuid,
        component: componentName,
        property,
        value,
        _inspectorRefreshed: true,
      };
    })();
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
      await beginRecording(getRecordingTargetsForParams(scene, params));
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
      const clipName = toStr(params.clipName, '').trim();
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
      const clipRecord = clip as Record<string, unknown>;
      if (clipName) {
        clip.name = clipName;
        if ('_name' in clipRecord) clipRecord._name = clipName;
      }
      clip.duration = duration;
      if ('_duration' in clipRecord) clipRecord._duration = duration;
      clip.speed = speed;
      if ('_speed' in clipRecord) clipRecord._speed = speed;
      clip.sample = sample;
      if ('_sample' in clipRecord) clipRecord._sample = sample;
      // Resolve wrap mode
      const animationWrapMode = (AnimClip as { WrapMode?: Record<string, number> }).WrapMode || cc.WrapMode;
      let resolvedWrapModeValue: number | null = null;
      if (animationWrapMode) {
        const modeMap: Record<string, number> = {
          normal: animationWrapMode.Normal ?? 1,
          loop: animationWrapMode.Loop ?? 2,
          pingpong: animationWrapMode.PingPong ?? 22,
          reverse: animationWrapMode.Reverse ?? 36,
          loopreverse: animationWrapMode.LoopReverse ?? 38,
        };
        const modeVal = modeMap[wrapMode.toLowerCase()];
        if (modeVal !== undefined) {
          resolvedWrapModeValue = modeVal;
          clip.wrapMode = modeVal;
          if ('_wrapMode' in clipRecord) clipRecord._wrapMode = modeVal;
        }
      }

      // easing string → interpolationMode: 0=Constant, 1=Linear, 2=Cubic
      const toInterpMode = (easing?: string): number => {
        if (!easing || easing === 'linear') return 1;
        if (easing === 'constant') return 0;
        return 2;
      };

      const VEC3_PROPS = new Set(['position', 'scale', 'eulerAngles', 'worldPosition', 'worldScale', 'worldEulerAngles']);
      const animNS = cc.animation as Record<string, unknown>;
      const hasNewApi = typeof (animNS.VectorTrack as { new?(): unknown } | undefined)?.['new'] !== 'undefined'
        || typeof animNS.VectorTrack === 'function';

      // Helper: apply keyframes to a RealCurve channel via assignSorted
      const applyRealCurve = (chan: Record<string, unknown>, kfData: Array<[number, Record<string, unknown>]>) => {
        const curve = (chan['_curve'] ?? chan['curve']) as Record<string, unknown> | undefined;
        if (curve && typeof curve['assignSorted'] === 'function') {
          (curve['assignSorted'] as (kfs: unknown) => void)(kfData);
        }
      };

      // Helper: set up track binding path
      const applyPath = (trackObj: Record<string, unknown>, nodePath?: string, component?: string, property?: string) => {
        const p = trackObj['path'] as Record<string, unknown> | undefined;
        if (!p) return;
        if (nodePath && typeof p['toHierarchy'] === 'function')
          (p['toHierarchy'] as (s: string) => unknown)(nodePath);
        if (component && typeof p['toComponent'] === 'function')
          (p['toComponent'] as (s: string) => unknown)(component);
        if (property && typeof p['toProperty'] === 'function')
          (p['toProperty'] as (s: string) => unknown)(property);
      };

      if (hasNewApi) {
        // ── Cocos 3.8 新 _tracks API（避免 legacy curves 转换产生 null channel）──
        for (const track of tracks) {
          const property = track.property;
          const kfs = track.keyframes;
          const sampleVal = kfs[0]?.value;

          const isVec3 = VEC3_PROPS.has(property)
            || (sampleVal !== null && typeof sampleVal === 'object' && sampleVal !== undefined
              && 'x' in (sampleVal as object) && !('r' in (sampleVal as object)));
          const isColor = property === 'color'
            || (sampleVal !== null && typeof sampleVal === 'object' && sampleVal !== undefined
              && 'r' in (sampleVal as object) && 'g' in (sampleVal as object));

          if (isVec3 && typeof animNS['VectorTrack'] === 'function') {
            const vt = new (animNS['VectorTrack'] as new() => Record<string, unknown>)();
            (vt as { componentsCount: number })['componentsCount'] = 3;
            applyPath(vt, track.path, track.component, property);
            const channels = typeof vt['channels'] === 'function'
              ? (vt['channels'] as () => Record<string, unknown>[])() : [];
            const axes = ['x', 'y', 'z'] as const;
            for (let i = 0; i < 3; i++) {
              if (channels[i]) {
                applyRealCurve(channels[i], kfs.map(kf => [kf.time, {
                  interpolationMode: toInterpMode(kf.easing),
                  tangentWeightMode: 0,
                  value: ((kf.value as Record<string, number>) ?? {})[axes[i]] ?? 0,
                  leftTangent: 0, leftTangentWeight: 0, rightTangent: 0, rightTangentWeight: 0,
                }]));
              }
            }
            if (typeof (clip as Record<string, unknown>)['addTrack'] === 'function')
              ((clip as Record<string, unknown>)['addTrack'] as (t: unknown) => void)(vt);

          } else if (isColor && typeof animNS['ColorTrack'] === 'function') {
            const ct = new (animNS['ColorTrack'] as new() => Record<string, unknown>)();
            applyPath(ct, track.path, track.component, property);
            const channels = typeof ct['channels'] === 'function'
              ? (ct['channels'] as () => Record<string, unknown>[])() : [];
            const colorCurve = channels[0] ? (channels[0]['_curve'] ?? channels[0]['curve']) as Record<string, unknown> | undefined : undefined;
            if (colorCurve && typeof colorCurve['assignSorted'] === 'function') {
              (colorCurve['assignSorted'] as (kfs: unknown) => void)(kfs.map(kf => {
                const cv = (kf.value as Record<string, number>) ?? {};
                return [kf.time, {
                  interpolationMode: toInterpMode(kf.easing),
                  value: { r: cv['r'] ?? 255, g: cv['g'] ?? 255, b: cv['b'] ?? 255, a: cv['a'] ?? 255 },
                }];
              }));
            }
            if (typeof (clip as Record<string, unknown>)['addTrack'] === 'function')
              ((clip as Record<string, unknown>)['addTrack'] as (t: unknown) => void)(ct);

          } else if (typeof animNS['RealTrack'] === 'function') {
            const rt = new (animNS['RealTrack'] as new() => Record<string, unknown>)();
            applyPath(rt, track.path, track.component, property);
            const channels = typeof rt['channels'] === 'function'
              ? (rt['channels'] as () => Record<string, unknown>[])() : [];
            if (channels[0]) {
              applyRealCurve(channels[0], kfs.map(kf => [kf.time, {
                interpolationMode: toInterpMode(kf.easing),
                tangentWeightMode: 0,
                value: typeof kf.value === 'number' ? kf.value : Number(kf.value) || 0,
                leftTangent: 0, leftTangentWeight: 0, rightTangent: 0, rightTangentWeight: 0,
              }]));
            }
            if (typeof (clip as Record<string, unknown>)['addTrack'] === 'function')
              ((clip as Record<string, unknown>)['addTrack'] as (t: unknown) => void)(rt);
          }
        }
      } else {
        // ── Legacy curves fallback（Cocos < 3.8）──
        clip.keys = [sortedTimes];
        const curves: unknown[] = [];
        for (const track of tracks) {
          const modifiers: unknown[] = [];
          if (track.path) {
            if (cc.animation.HierarchyPath) modifiers.push(new cc.animation.HierarchyPath(track.path));
            else modifiers.push(track.path);
          }
          if (track.component && cc.animation.ComponentPath)
            modifiers.push(new cc.animation.ComponentPath(track.component));
          modifiers.push(track.property);

          const timeToValue = new Map<number, unknown>();
          for (const kf of track.keyframes) timeToValue.set(kf.time, kf.value);
          const filteredTimes: number[] = [];
          const filteredValues: unknown[] = [];
          const filteredEasings: (string | undefined)[] = [];
          for (let i = 0; i < sortedTimes.length; i++) {
            const t = sortedTimes[i];
            if (timeToValue.has(t)) {
              filteredTimes.push(t);
              filteredValues.push(timeToValue.get(t));
              filteredEasings.push(track.keyframes.find(k => k.time === t)?.easing);
            }
          }
          let keysIdx = 0;
          if (filteredTimes.length !== sortedTimes.length) {
            keysIdx = clip.keys.length;
            clip.keys.push(filteredTimes);
          }
          const allConstant = filteredEasings.length > 0 && filteredEasings.every(e => e === 'constant');
          const curveData: Record<string, unknown> = {
            keys: keysIdx, values: filteredValues, interpolate: !allConstant,
          };
          if (!allConstant && filteredEasings.some(e => e && e !== 'linear')) {
            curveData['easingMethods'] = filteredEasings.map(e =>
              (!e || e === 'linear' || e === 'constant') ? null : e);
          }
          curves.push({ modifiers, data: curveData });
        }
        clip.curves = curves;
      }

      // Attach to node if provided
      let attachResult: {
        attached: boolean;
        uuid?: string;
        nodeName?: string;
        error?: string;
        editorSyncSkipped?: boolean;
      } | null = null;
      if (node) {
        const AnimComp = cc.Animation || cc.AnimationComponent;
        if (AnimComp) {
          let anim = node.getComponent(AnimComp);
          if (!anim) anim = node.addComponent(AnimComp);
          if (anim) {
            try {
              const ac = anim as AnimationComponentLike;
              const existingClips = (ac.clips || []).filter((existing): existing is AnimClipRef => Boolean(existing));
              if ((ac.clips || []).length !== existingClips.length) {
                ac.clips = existingClips;
              }
              const resolvedName = clipName || clip.name || undefined;
              if (typeof ac.addClip === 'function') {
                ac.addClip(clip, resolvedName);
              } else if (typeof ac.createState === 'function') {
                ac.clips = [...existingClips, clip];
                ac.createState(clip, resolvedName);
              } else {
                // Fallback: set clips array directly
                ac.clips = [...existingClips, clip];
              }
              if (!ac.defaultClip) {
                ac.defaultClip = clip;
              }
              // Runtime-only clips are not serializable through scene set-property.
              // Pushing them into editor IPC causes decodePatch failures and can reset defaultClip.
              attachResult = {
                attached: true,
                uuid,
                nodeName: node.name,
                editorSyncSkipped: true,
              };
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
        clipName: clip.name || clipRecord._name || clipName || 'unnamed',
        clipDuration: duration,
        trackCount: tracks.length,
        keyframeTimesCount: sortedTimes.length,
        wrapMode,
        _resolvedWrapModeValue: resolvedWrapModeValue,
        _clipWrapModeAfterAssign: clip.wrapMode,
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
          const clips: AnimClipRef[] = (anim.clips || []).filter((clip): clip is AnimClipRef => Boolean(clip));
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
          const clips: AnimClipRef[] = (anim.clips || []).filter((clip): clip is AnimClipRef => Boolean(clip));
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
              const result: Record<string, unknown> = { success: true, uuid, collider: cn, size: { width: w, height: h } };
              return (async () => {
                const ok = await notifyEditorComponentProperty(uuid, node, comp, 'size', { type: 'cc.Size', value: { width: w, height: h } });
                if (!ok) {
                  result.success = false;
                  result.error = '碰撞体 size 持久化失败，已阻止仅运行时修改';
                  return result;
                }
                c.size = Size ? new Size(w, h) : { width: w, height: h };
                result._inspectorRefreshed = true;
                return result;
              })();
            }
          }
          if (cn.includes('CircleCollider') || cn.includes('SphereCollider')) {
            if (params.radius !== undefined) {
              const radius = toNum(params.radius);
              const result: Record<string, unknown> = { success: true, uuid, collider: cn, radius };
              return (async () => {
                const ok = await notifyEditorComponentProperty(uuid, node, comp, 'radius', { type: 'number', value: radius });
                if (!ok) {
                  result.success = false;
                  result.error = '碰撞体 radius 持久化失败，已阻止仅运行时修改';
                  return result;
                }
                c.radius = radius;
                result._inspectorRefreshed = true;
                return result;
              })();
            }
          }
          if (cn.includes('CapsuleCollider')) {
            const nextRadius = params.radius !== undefined ? toNum(params.radius) : c.radius;
            const nextHeight = params.height !== undefined ? toNum(params.height) : c.height;
            const result: Record<string, unknown> = { success: true, uuid, collider: cn, radius: nextRadius, height: nextHeight };
            return (async () => {
              let okAll = true;
              if (params.radius !== undefined) {
                okAll = await notifyEditorComponentProperty(uuid, node, comp, 'radius', { type: 'number', value: nextRadius }) && okAll;
              }
              if (params.height !== undefined) {
                okAll = await notifyEditorComponentProperty(uuid, node, comp, 'height', { type: 'number', value: nextHeight }) && okAll;
              }
              if (!okAll) {
                result.success = false;
                result.error = 'CapsuleCollider 属性持久化失败，已阻止仅运行时修改';
                return result;
              }
              if (params.radius !== undefined) c.radius = nextRadius;
              if (params.height !== undefined) c.height = nextHeight;
              result._inspectorRefreshed = true;
              return result;
            })();
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
        if (params.mass !== undefined) { applied.mass = toNum(params.mass); }
        if (params.linearDamping !== undefined) { applied.linearDamping = toNum(params.linearDamping); }
        if (params.angularDamping !== undefined) { applied.angularDamping = toNum(params.angularDamping); }
        if (params.gravityScale !== undefined) { applied.gravityScale = toNum(params.gravityScale); }
        if (params.fixedRotation !== undefined) { applied.fixedRotation = !!params.fixedRotation; }
        if (params.allowSleep !== undefined) { applied.allowSleep = !!params.allowSleep; }
        if (params.bullet !== undefined) { applied.bullet = !!params.bullet; }
        const rbResult: Record<string, unknown> = { success: true, uuid, rbType, applied };
        return (async () => {
          let okAll = true;
          for (const [prop, val] of Object.entries(applied)) {
            const dt = typeof val === 'boolean' ? 'boolean' : 'number';
            okAll = await notifyEditorComponentProperty(uuid, node, rb!, prop, { type: dt, value: val }) && okAll;
          }
          if (!okAll) {
            rbResult.success = false;
            rbResult.error = 'RigidBody 属性持久化失败，已阻止仅运行时修改';
            return rbResult;
          }
          Object.assign(rb!, applied);
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
          if (params.friction !== undefined) { pmApplied.friction = toNum(params.friction); }
          if (params.restitution !== undefined) { pmApplied.restitution = toNum(params.restitution); }
          if (params.density !== undefined) { pmApplied.density = toNum(params.density); }
          const pmResult: Record<string, unknown> = { success: true, uuid, collider: cn, applied: pmApplied };
          return (async () => {
            let okAll = true;
            for (const [prop, val] of Object.entries(pmApplied)) {
              okAll = await notifyEditorComponentProperty(uuid, node, comp, prop, { type: 'number', value: val }) && okAll;
            }
            if (!okAll) {
              pmResult.success = false;
              pmResult.error = 'PhysicsMaterial 属性持久化失败，已阻止仅运行时修改';
              return pmResult;
            }
            Object.assign(c, pmApplied);
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
        const colliders = [] as ColliderComponentLike[];
        for (const comp of (node._components || [])) {
          const cn = getComponentName(comp).replace('cc.', '');
          if (!cn.includes('Collider')) continue;
          groupSet = true;
          colliders.push(comp as ColliderComponentLike);
        }
        if (!groupSet) return { error: '节点上未找到碰撞体组件' };
        const grpResult: Record<string, unknown> = { success: true, uuid, group };
        return (async () => {
          let okAll = true;
          for (const collider of colliders) {
            okAll = await notifyEditorComponentProperty(uuid, node, collider, 'group', { type: 'number', value: group }) && okAll;
          }
          if (!okAll) {
            grpResult.success = false;
            grpResult.error = '碰撞组持久化失败，已阻止仅运行时修改';
            return grpResult;
          }
          for (const collider of colliders) {
            collider.group = group;
          }
          grpResult._inspectorRefreshed = true;
          return grpResult;
        })();
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
        return (async () => {
          await ipcCreateComponent(uuid, compName);
          const refreshedScene = getScene();
          const refreshedNode = refreshedScene ? findNodeByUuid(refreshedScene, uuid) : null;
          if (!refreshedNode) return { error: `未找到节点: ${uuid}` };
          const joint = refreshedNode.getComponent(JointClass);
          if (!joint) return { error: `无法取得 ${compName}` };
          const unsupportedPersistence = [] as Array<{ key: string; reason: string }>;
          let okAll = true;

          if (params.connectedUuid) {
            const connNodeUuid = toStr(params.connectedUuid);
            const connNode = findNodeByUuid(refreshedScene, connNodeUuid);
            if (!connNode) {
              return { error: `未找到 connectedUuid 对应节点: ${connNodeUuid}` };
            }
            const RB2D = js.getClassByName('RigidBody2D') || js.getClassByName('cc.RigidBody2D');
            if (!RB2D || !connNode.getComponent(RB2D)) {
              return { error: 'connectedUuid 节点上未找到 RigidBody2D 组件' };
            }
            const refResult = await methods.setComponentProperty(uuid, compName, 'connectedBody', {
              __refType__: 'cc.Component',
              uuid: connNodeUuid,
              component: 'RigidBody2D',
            });
            if (!refResult || typeof refResult !== 'object' || (refResult as { success?: boolean; error?: string }).success === false || (refResult as { error?: string }).error) {
              return {
                error: `connectedBody 持久化失败: ${String((refResult as { error?: string } | undefined)?.error ?? '未知错误')}`,
                component: compName,
                jointType,
              };
            }
          }

          if (params.props && typeof params.props === 'object') {
            for (const [k, v] of Object.entries(params.props as Record<string, unknown>)) {
              if (v === null || v === undefined) continue;
              if (Array.isArray(v)) {
                unsupportedPersistence.push({ key: k, reason: '数组持久化未实现' });
                continue;
              }
              if (typeof v === 'object') {
                unsupportedPersistence.push({ key: k, reason: '复杂对象持久化未实现' });
                continue;
              }
              const dt = typeof v === 'boolean' ? 'boolean'
                : typeof v === 'number' ? 'number'
                : typeof v === 'string' ? 'string'
                : null;
              if (!dt) {
                unsupportedPersistence.push({ key: k, reason: `不支持的属性类型: ${typeof v}` });
                continue;
              }
              okAll = await notifyEditorComponentProperty(uuid, refreshedNode, joint, k, { type: dt, value: v }) && okAll;
            }
          }

          if (!okAll) {
            return {
              success: false,
              uuid,
              jointType,
              component: compName,
              error: '关节属性持久化失败，已阻止仅运行时修改',
              ...(unsupportedPersistence.length ? { unsupportedPersistence } : {}),
            };
          }

          if (params.props && typeof params.props === 'object') {
            for (const [k, v] of Object.entries(params.props as Record<string, unknown>)) {
              if (v === null || v === undefined) continue;
              if (typeof v === 'object') continue;
              try { joint[k] = v; } catch (e) { logIgnored(ErrorCategory.PROPERTY_ASSIGN, `关节属性 "${k}" 同步到运行时失败`, e); }
            }
          }

          const result: Record<string, unknown> = { success: unsupportedPersistence.length === 0, uuid, jointType, component: compName, _editorIPC: true, _viaEditorIPC: true };
          if (unsupportedPersistence.length) {
            result.error = '部分关节属性暂未实现稳定持久化';
            result.unsupportedPersistence = unsupportedPersistence;
          }
          return result;
        })();
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
