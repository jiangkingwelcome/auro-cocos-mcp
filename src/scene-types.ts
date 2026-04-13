// ─── 基础几何类型 ─────────────────────────────────────────────────────
export interface Vec3Like { x: number; y: number; z: number }
export interface QuatLike { x: number; y: number; z: number; w: number }
export interface SizeLike { width: number; height: number }
export interface ColorLike { r: number; g: number; b: number; a: number }

// ─── 组件动态访问接口 ─────────────────────────────────────────────────
export interface AnimationComponentLike extends CocosComponent {
  clips?: AnimClipRef[];
  defaultClip?: AnimClipRef | null;
  play?(name?: string): AnimationStateLike | void;
  pause?(): void;
  resume?(): void;
  stop?(): void;
  crossFade?(name: string, duration: number): void;
  getState?(name: string): AnimationStateLike | null;
  addClip?(clip: unknown, name?: string): AnimationStateLike | null | void;
  createState?(clip: unknown, name?: string): AnimationStateLike | null | void;
}

export interface AnimClipRef {
  name?: string;
  duration?: number;
  [key: string]: unknown;
}

export interface AnimationStateLike {
  time: number;
  speed: number;
  isPlaying?: boolean;
  name?: string;
  duration?: number;
  repeatCount?: number;
  wrapMode?: number;
  sample?: number;
  play?(): void;
  pause?(): void;
  resume?(): void;
  stop?(): void;
  setTime?(time: number): void;
  update?(delta: number): void;
  [key: string]: unknown;
}

export interface UITransformLike extends CocosComponent {
  contentSize: SizeLike;
  anchorPoint?: { x: number; y: number };
  width?: number;
  height?: number;
}

export interface SpriteLike extends CocosComponent {
  spriteFrame?: SpriteFrameLike | null;
  color?: ColorLike;
  sizeMode?: number;
  type?: number;
  grayscale?: boolean;
}

export interface SpriteFrameLike {
  texture?: TextureLike | null;
  vertices?: { x: number[]; y: number[] };
  [key: string]: unknown;
}

export interface TextureLike {
  width?: number;
  height?: number;
  readPixels?(x: number, y: number, w: number, h: number): Uint8Array | null;
  [key: string]: unknown;
}

export interface ColliderComponentLike extends CocosComponent {
  size?: SizeLike | unknown;
  radius?: number;
  height?: number;
  points?: unknown[];
  group?: number;
  friction?: number;
  restitution?: number;
  density?: number;
  offset?: { x: number; y: number };
}

export interface RigidBodyLike extends CocosComponent {
  type?: number;
  mass?: number;
  linearDamping?: number;
  angularDamping?: number;
  gravityScale?: number;
  fixedRotation?: boolean;
  allowSleep?: boolean;
  bullet?: boolean;
}

export interface UIOpacityLike extends CocosComponent {
  opacity: number;
}

export interface PhysicsSystemInstance {
  gravity?: Vec3Like;
  allowSleep?: boolean;
  fixedTimeStep?: number;
  enable?: boolean;
  enabled?: boolean;
}

export interface CachedAssetInfo {
  __classname__?: string;
  name?: string;
  [key: string]: unknown;
}

export interface RenderDeviceLike {
  renderer?: string;
  vendor?: string;
  [key: string]: unknown;
}

export interface PipelineStatsLike {
  drawCalls?: number;
  dc?: number;
  instances?: number;
  tris?: number;
  triangles?: number;
  [key: string]: unknown;
}

export interface RenderRootLike {
  device?: RenderDeviceLike;
  pipeline?: { stats?: PipelineStatsLike; _stats?: PipelineStatsLike; [key: string]: unknown };
  [key: string]: unknown;
}

// ─── 引用值检测与运行时解析 ──────────────────────────────────────────

export interface NodeRefValue { __refType__: 'cc.Node'; uuid: string }
export interface ComponentRefValue { __refType__: 'cc.Component'; uuid: string; component: string }
export interface AssetRefValue { __uuid__: string }

export function isAssetRef(v: unknown): v is AssetRefValue {
  return !!v && typeof v === 'object' && '__uuid__' in v && typeof (v as Record<string, unknown>).__uuid__ === 'string';
}

export function isNodeRef(v: unknown): v is NodeRefValue {
  if (!v || typeof v !== 'object') return false;
  const r = v as Record<string, unknown>;
  return r.__refType__ === 'cc.Node' && typeof r.uuid === 'string';
}

export function isComponentRef(v: unknown): v is ComponentRefValue {
  if (!v || typeof v !== 'object') return false;
  const r = v as Record<string, unknown>;
  return r.__refType__ === 'cc.Component' && typeof r.uuid === 'string' && typeof r.component === 'string';
}

export function isAnyRef(v: unknown): boolean {
  return isAssetRef(v) || isNodeRef(v) || isComponentRef(v);
}

/**
 * Resolve a Node or Component ref value to its runtime object.
 * Returns the resolved object, or null if resolution fails.
 */
export function resolveRefToRuntime(
  value: unknown,
  scene: CocosNode,
  findNodeByUuid: (root: CocosNode | null, uuid: string) => CocosNode | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  js: { getClassByName(name: string): any },
): CocosNode | CocosComponent | null {
  if (isNodeRef(value)) {
    return findNodeByUuid(scene, value.uuid);
  }
  if (isComponentRef(value)) {
    const targetNode = findNodeByUuid(scene, value.uuid);
    if (!targetNode) return null;
    const cls = js.getClassByName(value.component) || js.getClassByName('cc.' + value.component);
    if (!cls) return null;
    return targetNode.getComponent(cls);
  }
  return null;
}

// ─── 类型安全的参数提取工具 ──────────────────────────────────────────

export function toStr(val: unknown, fallback = ''): string {
  if (typeof val === 'string') return val;
  if (val == null) return fallback;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  return fallback;
}

export function toNum(val: unknown, fallback = 0): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') { const n = Number(val); return Number.isFinite(n) ? n : fallback; }
  return fallback;
}

export function toBool(val: unknown, fallback = false): boolean {
  if (typeof val === 'boolean') return val;
  return fallback;
}

export function getComponentName(comp: CocosComponent): string {
  return comp.constructor?.name ?? comp.__classname__ ?? 'Unknown';
}

// ─── 场景方法返回值类型 ─────────────────────────────────────────────

export interface SceneTreeNode {
  uuid: string;
  name: string;
  active: boolean;
  childCount: number;
  children: SceneTreeNode[];
}

export interface NodeListRow {
  uuid: string;
  name: string;
  active: boolean;
  depth: number;
  childCount: number;
  path: string;
}

export interface NodeSearchResult {
  uuid: string;
  name: string;
  path: string;
  active: boolean;
  component?: string;
}

export interface ErrorResult { error: string }
export interface SuccessResult { success: true }

export type SceneResult<T> = (T & SuccessResult) | ErrorResult;

// ─── Cocos 节点 & 组件 ──────────────────────────────────────────────

export interface CocosNode {
  uuid: string;
  _id?: string;
  name: string;
  active: boolean;
  activeInHierarchy?: boolean;
  parent: CocosNode | null;
  children: CocosNode[];
  _objFlags?: number;
  _components: CocosComponent[];
  layer: number;
  position: Vec3Like | null;
  scale: Vec3Like | null;
  worldPosition: Vec3Like | null;
  worldRotation: QuatLike | null;
  worldScale: Vec3Like | null;
  eulerAngles?: Vec3Like | null;
  autoReleaseAssets?: boolean;
  globals?: unknown;
  setPosition(v: unknown): void;
  setRotationFromEuler(x: number, y: number, z: number): void;
  setScale(v: unknown): void;
  setWorldPosition(v: unknown): void;
  setWorldRotation(v: unknown): void;
  setWorldScale(v: unknown): void;
  setParent(parent: CocosNode): void;
  addChild(child: CocosNode): void;
  removeAllChildren(): void;
  destroy(): void;
  getSiblingIndex(): number;
  setSiblingIndex(index: number): void;
  addComponent(cls: unknown): CocosComponent;
  getComponent(cls: unknown): CocosComponent | null;
  removeComponent(comp: CocosComponent): void;
}

export interface CocosComponent {
  constructor: { name: string };
  __classname__?: string;
  [key: string]: unknown;
}

export interface SceneMethods {
  getSceneTree(includeInternal?: boolean): unknown;
  getAllNodesList(includeInternal?: boolean): unknown;
  getSceneStats(includeInternal?: boolean): unknown;
  getNodeDetail(uuid: string): unknown;
  findNodeByPath(nodePath: string): unknown;
  getNodeComponents(uuid: string): unknown;
  setNodePosition(uuid: string, x: number, y: number, z: number): unknown;
  setNodeRotation(uuid: string, x: number, y: number, z: number): unknown;
  setNodeScale(uuid: string, x: number, y: number, z: number): unknown;
  setNodeName(uuid: string, name: string): unknown;
  setNodeActive(uuid: string, active: boolean): unknown;
  createChildNode(parentUuid: string, name: string): unknown;
  destroyNode(uuid: string): unknown;
  reparentNode(uuid: string, parentUuid: string): unknown;
  addComponent(uuid: string, componentName: string): unknown;
  removeComponent(uuid: string, componentName: string): unknown;
  setComponentProperty(uuid: string, componentName: string, property: string, value: unknown): unknown;
}

export type QueryHandler = (self: SceneMethods, scene: CocosNode, params: Record<string, unknown>) => unknown;
export type OperationHandler = (self: SceneMethods, scene: CocosNode, params: Record<string, unknown>) => unknown;

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface CocosVec2 { x: number; y: number; clone?(): CocosVec2 }

export interface CocosSysInfo {
  os: string;
  osVersion?: string;
  browserType?: string;
  language?: string;
  isMobile?: boolean;
  isNative?: boolean;
  isBrowser?: boolean;
  platform?: string | number;
  [key: string]: unknown;
}

export interface CocosCC {
  director: { getScene(): CocosNode | null; pause(): void; resume(): void; root?: RenderRootLike; isPaused?(): boolean };
  game: { frameRate: number; totalFrames?: number };
  CCObject?: unknown;
  sys: CocosSysInfo;
  assetManager: {
    assets: { forEach(fn: (asset: CachedAssetInfo, uuid: string) => void): void; get?(uuid: string): CachedAssetInfo | undefined };
    loadAny?(uuidOrOpts: string | Record<string, unknown>, callback: (err: Error | null, asset: unknown) => void): void;
  } | null;
  Vec2: new (x: number, y: number) => CocosVec2;
  Vec3: new (x: number, y: number, z: number) => Vec3Like;
  Quat: { new (): QuatLike; fromEuler(out: unknown, x: number, y: number, z: number): void; toEuler(out: Vec3Like, q: unknown): void };
  Node: new (name: string) => CocosNode;
  Camera: unknown;
  Canvas: unknown;
  Component: any;
  AnimationClip: any;
  AnimationComponent?: any;
  Animation?: any;
  animation: {
    HierarchyPath?: new (path: string) => unknown;
    ComponentPath?: new (className: string) => unknown;
  };
  WrapMode?: Record<string, number>;
  js: {
    getClassByName(name: string): any;
    getClassName?(cls: any): string;
    /** 若存在，用于判断 `cc.${shortName}` 是否为引擎内置 Component（避免把用户脚本名如 Test 误发成 cc.Test） */
    isChildClassOf?(child: unknown, parent: unknown): boolean;
    _nameToClass?: Record<string, any>;
    _registeredClassNames?: Record<string, any>;
  };
  instantiate(node: CocosNode): CocosNode;
  tween?: (...args: unknown[]) => unknown;
  Layers?: unknown;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
