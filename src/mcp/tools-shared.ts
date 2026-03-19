import { z } from 'zod';
import { type ToolCallResult, errorMessage } from './local-tool-server';
import { ErrorCategory, logIgnored } from '../error-utils';

export { errorMessage };
export type { ToolCallResult };

/**
 * AI_RULES version — bump when rule semantics change so clients can
 * detect stale cached descriptions.
 */
export const AI_RULES_VERSION = 3;

/**
 * Standard AI behavioral rules appended to Funnel tool descriptions.
 * These mirror and exceed DaxianLee's "AI Rules" constraints.
 */
export const AI_RULES = `

AI Rules v${AI_RULES_VERSION} (MUST follow):
1. Query before modify — ALWAYS use scene_query to fetch current state before calling scene_operation. Never assume node exists.
2. Prefer UUIDs, names also work — Prefer UUID for referencing nodes. parentUuid also accepts node names (auto-resolved). If parent not found, the error includes available nodes.
3. Check errors — ALWAYS verify the "success" or "error" field in return values. Retry or report on failure.
4. Confirm destructive ops — ALWAYS set confirmDangerous=true for destroy_node / clear_children. These are BLOCKED without it.
5. Batch when possible — Use action=batch with $N.uuid references instead of individual calls for multi-step operations.
6. Version-aware — Call bridge_status first to check capabilities.supportedFeatures before using version-dependent APIs.
7. Canvas is optional — Many scene templates already include a Canvas. Check scene_query action=tree first. Only call ensure_2d_canvas when explicitly needed.`;

export interface BridgeToolContext {
  bridgeGet: (path: string, params?: Record<string, string>) => Promise<unknown>;
  bridgePost: (path: string, body?: unknown) => Promise<unknown>;
  sceneMethod: (method: string, args?: unknown[]) => Promise<unknown>;
  editorMsg: (module: string, message: string, ...args: unknown[]) => Promise<unknown>;
  text: (data: unknown, isError?: boolean) => ToolCallResult;
  isAutoRollbackEnabled?: () => boolean;
}

// ═══════════════════════════════════════════════════════════════════════
// Cocos Editor AssetDB 类型定义
// ═══════════════════════════════════════════════════════════════════════

/** Cocos AssetDB 资源信息返回类型 (query-asset-info) */
export interface AssetInfo {
  url?: string;
  path?: string;
  file?: string;
  uuid?: string;
  type?: string;
  importer?: string;
}

/** Cocos AssetDB 资源 meta 返回类型 (query-asset-meta) */
export interface AssetMeta {
  ver?: string;
  importer?: string;
  userData?: Record<string, unknown>;
  subMetas?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Cocos AssetDB 资源列表条目类型 */
export interface AssetEntry {
  url?: string;
  path?: string;
  uuid?: string;
  type?: string;
  importer?: string;
}

/**
 * 安全字符串转换。与 String() 不同，对 null/undefined 返回 fallback
 * 而非 "null"/"undefined"。
 */
export function toStr(val: unknown, fallback = ''): string {
  if (typeof val === 'string') return val;
  if (val == null) return fallback;
  return String(val);
}

export const COMPONENT_CANONICAL_MAP: Record<string, string> = {
  sprite: 'Sprite',
  label: 'Label',
  button: 'Button',
  layout: 'Layout',
  widget: 'Widget',
  mask: 'Mask',
  camera: 'Camera',
  canvas: 'Canvas',
  scrollview: 'ScrollView',
  richtext: 'RichText',
  progressbar: 'ProgressBar',
  toggle: 'Toggle',
  uitransform: 'UITransform',
  uiopacity: 'UIOpacity',
};

export const COMPONENT_SUGGESTIONS = Object.values(COMPONENT_CANONICAL_MAP);
export const DANGEROUS_SCENE_ACTIONS = new Set(['destroy_node', 'clear_children']);

export function normalizeComponentName(input: string): { finalName: string; corrected: boolean; from?: string } {
  const raw = String(input || '').trim();
  if (!raw) return { finalName: raw, corrected: false };
  const plain = raw.startsWith('cc.') ? raw.slice(3) : raw;
  const lowered = plain.toLowerCase();
  const mapped = COMPONENT_CANONICAL_MAP[lowered];
  if (mapped && mapped !== plain) return { finalName: mapped, corrected: true, from: raw };
  return { finalName: plain, corrected: false };
}

export function withGuardrailHints(result: unknown): unknown {
  if (!result || typeof result !== 'object') return result;
  const maybeError = (result as Record<string, unknown>).error;
  if (typeof maybeError !== 'string') return result;
  if (maybeError.includes('未找到组件类')) {
    return {
      ...(result as Record<string, unknown>),
      suggestion: `可尝试组件名: ${COMPONENT_SUGGESTIONS.join(', ')}`,
    };
  }
  return result;
}

export function extractSelectedNodeUuid(selectionResult: unknown): string {
  if (!selectionResult || typeof selectionResult !== 'object') return '';
  const selected = (selectionResult as Record<string, unknown>).selected;
  if (!Array.isArray(selected) || !selected.length) return '';
  const first = selected[0];
  return typeof first === 'string' ? first : '';
}

export interface NormalizeResult {
  url: string;
  normalized: boolean;
  originalSegments?: string[];
  fixedSegments?: string[];
}

export function normalizeDbUrl(url: string): NormalizeResult {
  // Pass-through: no case normalization map is currently populated.
  // The function signature is kept for future use.
  return { url, normalized: false };
}

/**
 * Validate a db:// URL against path traversal attacks.
 * Rejects URLs containing ".." segments, null bytes, or escaping outside db://assets/ or db://internal/.
 * Returns null if safe, or an error message string if dangerous.
 */
export function sanitizeDbUrl(url: string): string | null {
  if (typeof url !== 'string' || !url) return null; // empty is ok, let downstream handle required validation
  if (!url.startsWith('db://')) return `非法资源路径: 必须以 db:// 开头，收到 "${url}"`;
  if (url.includes('\0')) return `非法资源路径: 包含空字节`;
  // Normalize backslashes then check for traversal
  const normalized = url.replace(/\\/g, '/');
  const segments = normalized.split('/');
  if (segments.some(s => s === '..')) return `非法资源路径: 包含路径遍历 ".." — ${url}`;
  // Ensure stays within db://assets/ or db://internal/
  const afterProtocol = normalized.slice('db://'.length);
  if (!afterProtocol.startsWith('assets') && !afterProtocol.startsWith('internal')) {
    return `非法资源路径: 必须在 db://assets/ 或 db://internal/ 下，收到 "${url}"`;
  }
  return null;
}

/**
 * Validate an OS file path against path traversal attacks.
 * Rejects paths containing ".." segments or null bytes.
 * Returns null if safe, or an error message string if dangerous.
 */
export function sanitizeOsPath(filePath: string): string | null {
  if (typeof filePath !== 'string' || !filePath) return null;
  if (filePath.includes('\0')) return `非法文件路径: 包含空字节`;
  const normalized = filePath.replace(/\\/g, '/');
  const segments = normalized.split('/');
  if (segments.some(s => s === '..')) return `非法文件路径: 包含路径遍历 ".." — ${filePath}`;
  return null;
}

export function normalizeParams(p: Record<string, unknown>): { warnings: string[]; pathError?: string } {
  const warnings: string[] = [];
  // Validate db:// URLs against path traversal
  const dbUrlFields = ['url', 'sourceUrl', 'targetUrl', 'savePath', 'pattern'];
  for (const field of dbUrlFields) {
    if (typeof p[field] === 'string') {
      const val = p[field] as string;
      if (val.startsWith('db://')) {
        const err = sanitizeDbUrl(val);
        if (err) return { warnings, pathError: `[${field}] ${err}` };
        const result = normalizeDbUrl(val);
        if (result.normalized) {
          warnings.push(`路径自动规范化: ${val} → ${result.url} (${result.originalSegments?.join(',')} → ${result.fixedSegments?.join(',')})`);
          p[field] = result.url;
        }
      }
    }
  }
  // Validate OS file paths against path traversal
  const osPathFields = ['sourcePath'];
  for (const field of osPathFields) {
    if (typeof p[field] === 'string') {
      const err = sanitizeOsPath(p[field] as string);
      if (err) return { warnings, pathError: `[${field}] ${err}` };
    }
  }
  // Validate batch_import files array
  if (Array.isArray(p.files)) {
    for (let i = 0; i < (p.files as unknown[]).length; i++) {
      const file = (p.files as Array<Record<string, unknown>>)[i];
      if (file && typeof file === 'object') {
        if (typeof file.sourcePath === 'string') {
          const err = sanitizeOsPath(file.sourcePath);
          if (err) return { warnings, pathError: `[files[${i}].sourcePath] ${err}` };
        }
        if (typeof file.targetUrl === 'string') {
          const err = sanitizeDbUrl(file.targetUrl);
          if (err) return { warnings, pathError: `[files[${i}].targetUrl] ${err}` };
        }
      }
    }
  }
  return { warnings };
}

export async function ensureAssetDirectory(
  editorMsg: (module: string, message: string, ...args: unknown[]) => Promise<unknown>,
  assetUrl: string,
): Promise<void> {
  const dirPath = assetUrl.substring(0, assetUrl.lastIndexOf('/'));
  try {
    if (dirPath && dirPath !== 'db://assets' && dirPath !== 'db://internal') {
      const dirInfo = await editorMsg('asset-db', 'query-asset-info', dirPath);
      if (!dirInfo) {
        try {
          await editorMsg('asset-db', 'create-asset', dirPath, null);
        } catch (createErr) {
          const existing = await editorMsg('asset-db', 'query-asset-info', dirPath);
          if (!existing) throw createErr;
        }
        await new Promise(r => setTimeout(r, 200));
      }
    }
  } catch (e) { logIgnored(ErrorCategory.ASSET_OPERATION, '确保资源目录存在时冲突（已安全跳过）', e); }
}

export function toInputSchema(shape: Record<string, unknown>): Record<string, unknown> {
  const schema = z.toJSONSchema(z.object(shape as Record<string, z.ZodType>));
  const { $schema: _schema, additionalProperties: _additionalProperties, ...rest } = schema as Record<string, unknown>;
  return rest;
}

// ═══════════════════════════════════════════════════════════════════════
// Declarative Required-Params Map & Validator
// ═══════════════════════════════════════════════════════════════════════

/**
 * Per-action required parameter declarations.
 * Key = "toolName.actionName", value = array of required param names.
 * Actions not listed here have no mandatory params (e.g. "tree", "stats").
 */
export const REQUIRED_PARAMS: Record<string, string[]> = {
  // ── scene_query ──────────────────────────────────────────────────
  'scene_query.node_detail': ['uuid'],
  'scene_query.find_by_path': ['path'],
  'scene_query.get_components': ['uuid'],
  'scene_query.get_parent': ['uuid'],
  'scene_query.get_children': ['uuid'],
  'scene_query.get_sibling': ['uuid'],
  'scene_query.get_world_position': ['uuid'],
  'scene_query.get_world_rotation': ['uuid'],
  'scene_query.get_world_scale': ['uuid'],
  'scene_query.get_active_in_hierarchy': ['uuid'],
  'scene_query.get_node_bounds': ['uuid'],
  'scene_query.find_nodes_by_name': ['name'],
  'scene_query.find_nodes_by_component': ['component'],
  'scene_query.find_nodes_by_layer': ['layer'],
  'scene_query.get_component_property': ['uuid', 'component', 'property'],
  'scene_query.get_node_components_properties': ['uuid'],
  'scene_query.get_animation_state': ['uuid'],
  'scene_query.get_collider_info': ['uuid'],
  'scene_query.get_material_info': ['uuid'],
  'scene_query.screen_to_world': ['screenX', 'screenY'],
  'scene_query.world_to_screen': ['worldX', 'worldY', 'worldZ'],
  'scene_query.measure_distance': ['uuidA', 'uuidB'],
  'scene_query.scene_diff': ['snapshotA', 'snapshotB'],
  'scene_query.check_script_ready': ['script'],
  'scene_query.get_script_properties': ['script'],

  // ── scene_operation ──────────────────────────────────────────────
  'scene_operation.create_node': ['name'],
  'scene_operation.destroy_node': ['uuid'],
  'scene_operation.reparent': ['uuid', 'parentUuid'],
  'scene_operation.set_position': ['uuid', 'x', 'y'],
  'scene_operation.set_rotation': ['uuid', 'x', 'y'],
  'scene_operation.set_scale': ['uuid', 'x', 'y'],
  'scene_operation.set_world_position': ['uuid', 'x', 'y'],
  'scene_operation.set_world_rotation': ['uuid', 'x', 'y'],
  'scene_operation.set_world_scale': ['uuid', 'x', 'y'],
  'scene_operation.set_name': ['uuid', 'name'],
  'scene_operation.set_active': ['uuid'],
  'scene_operation.add_component': ['uuid', 'component'],
  'scene_operation.remove_component': ['uuid', 'component'],
  'scene_operation.set_property': ['uuid', 'component', 'property'],
  'scene_operation.reset_property': ['uuid', 'component', 'property'],
  'scene_operation.duplicate_node': ['uuid'],
  'scene_operation.move_node_up': ['uuid'],
  'scene_operation.move_node_down': ['uuid'],
  'scene_operation.set_sibling_index': ['uuid', 'index'],
  'scene_operation.lock_node': ['uuid'],
  'scene_operation.unlock_node': ['uuid'],
  'scene_operation.hide_node': ['uuid'],
  'scene_operation.unhide_node': ['uuid'],
  'scene_operation.set_layer': ['uuid', 'layer'],
  'scene_operation.call_component_method': ['uuid', 'component', 'methodName'],
  'scene_operation.clear_children': ['uuid'],
  'scene_operation.create_prefab': ['uuid'],
  'scene_operation.clipboard_copy': ['uuid'],
  'scene_operation.instantiate_prefab': ['prefabUrl'],
  'scene_operation.enter_prefab_edit': ['uuid'],
  'scene_operation.apply_prefab': ['uuid'],
  'scene_operation.restore_prefab': ['uuid'],
  'scene_operation.validate_prefab': ['prefabUrl'],
  'scene_operation.batch': ['operations'],
  'scene_operation.create_ui_widget': ['widgetType'],
  'scene_operation.align_nodes': ['uuids', 'alignment'],
  'scene_operation.audio_setup': ['uuid'],
  'scene_operation.create_skeleton_node': ['skeletonType'],
  'scene_operation.create_primitive': ['type'],
  'scene_operation.set_camera_look_at': ['uuid', 'targetX', 'targetY', 'targetZ'],
  'scene_operation.set_camera_property': ['uuid'],
  'scene_operation.set_material_property': ['uuid', 'uniforms'],
  'scene_operation.assign_builtin_material': ['uuid'],
  'scene_operation.bind_event': ['uuid', 'eventType', 'component', 'handler'],
  'scene_operation.unbind_event': ['uuid', 'eventType'],
  'scene_operation.list_events': ['uuid'],
  'scene_operation.reset_transform': ['uuid'],
  'scene_operation.reset_node_properties': ['uuid'],
  'scene_operation.set_anchor_point': ['uuid'],
  'scene_operation.set_content_size': ['uuid', 'width', 'height'],
  'scene_operation.batch_set_property': ['uuids', 'component', 'property', 'value'],
  'scene_operation.group_nodes': ['uuids'],
  'scene_operation.create_light': ['lightType'],
  'scene_operation.set_light_property': ['uuid'],
  'scene_operation.set_scene_environment': [],  // subsystem OR preset, validated separately
  'scene_operation.set_material_define': ['uuid', 'defines'],
  'scene_operation.assign_project_material': ['uuid', 'materialUrl'],
  'scene_operation.clone_material': ['uuid'],
  'scene_operation.swap_technique': ['uuid', 'technique'],
  'scene_operation.sprite_grayscale': ['uuid'],
  'scene_operation.ensure_2d_canvas': [],
  'scene_operation.attach_script': ['uuid', 'script'],
  'scene_operation.set_component_properties': ['uuid', 'component', 'properties'],
  'scene_operation.detach_script': ['uuid', 'script'],

  // ── asset_operation ──────────────────────────────────────────────
  'asset_operation.info': ['url'],
  'asset_operation.create': ['url'],
  'asset_operation.save': ['url', 'content'],
  'asset_operation.delete': ['url'],
  'asset_operation.move': ['sourceUrl', 'targetUrl'],
  'asset_operation.copy': ['sourceUrl', 'targetUrl'],
  'asset_operation.import': ['sourcePath', 'targetUrl'],
  'asset_operation.open': ['url'],
  'asset_operation.reimport': ['url'],
  'asset_operation.create_folder': ['url'],
  'asset_operation.show_in_explorer': ['url'],
  'asset_operation.get_dependencies': ['url'],
  'asset_operation.get_dependents': ['url'],
  'asset_operation.rename': ['url', 'newName'],
  'asset_operation.get_meta': ['url'],
  'asset_operation.set_meta_property': ['url', 'property'],
  'asset_operation.url_to_uuid': ['url'],
  'asset_operation.uuid_to_url': ['uuid'],
  'asset_operation.search_by_type': ['type'],
  'asset_operation.pack_atlas': ['url'],
  'asset_operation.validate_asset': ['url'],
  'asset_operation.create_material': ['url'],
  'asset_operation.generate_script': ['url'],
  'asset_operation.batch_import': ['files'],
  'asset_operation.get_asset_size': ['url'],
  'asset_operation.slice_sprite': ['url', 'borderTop', 'borderBottom', 'borderLeft', 'borderRight'],

  // ── editor_action ────────────────────────────────────────────────
  'editor_action.select': ['uuids'],
  'editor_action.send_message': ['module', 'message'],
  'editor_action.focus_node': ['uuid'],
  'editor_action.move_scene_camera': ['uuid'],
  'editor_action.open_panel': ['panel'],
  'editor_action.close_panel': ['panel'],
  'editor_action.log': ['text'],
  'editor_action.warn': ['text'],
  'editor_action.error': ['text'],
  'editor_action.show_notification': ['text'],
  'editor_action.reload_plugin': ['module'],
  'editor_action.set_transform_tool': [],
  'editor_action.set_coordinate': [],
  'editor_action.toggle_grid': [],
  'editor_action.toggle_snap': [],
  'editor_action.search_logs': ['keyword'],
  'editor_action.build_with_config': [],
  'editor_action.set_view_mode': ['viewMode'],
  'editor_action.inspect_asset': [],

  // ── physics_tool ─────────────────────────────────────────────────
  'physics_tool.get_collider_info': ['uuid'],
  'physics_tool.add_collider': ['uuid', 'colliderType'],
  'physics_tool.set_collider_size': ['uuid'],
  'physics_tool.add_rigidbody': ['uuid'],
  'physics_tool.set_rigidbody_props': ['uuid'],
  'physics_tool.set_physics_material': ['uuid'],
  'physics_tool.set_collision_group': ['uuid', 'group'],
  'physics_tool.add_joint': ['uuid', 'jointType'],

  // ── preferences ──────────────────────────────────────────────────
  'preferences.get': ['key'],
  'preferences.set': ['key', 'value'],
  'preferences.get_global': ['key'],
  'preferences.set_global': ['key', 'value'],
  'preferences.get_project': ['key'],
  'preferences.set_project': ['key', 'value'],

  // ── broadcast ────────────────────────────────────────────────────
  'broadcast.send': ['channel'],
  'broadcast.send_ipc': ['module', 'message'],

  // ── reference_image ──────────────────────────────────────────────
  'reference_image.add': ['imagePath'],
  'reference_image.remove': ['refUuid'],
  'reference_image.set_transform': ['refUuid'],
  'reference_image.set_opacity': ['refUuid', 'opacity'],

  // ── tool_management ──────────────────────────────────────────────
  'tool_management.enable': ['toolName'],
  'tool_management.disable': ['toolName'],

  // ── animation_tool ───────────────────────────────────────────────
  'animation_tool.create_clip': ['uuid', 'tracks'],
  'animation_tool.play': ['uuid'],
  'animation_tool.pause': ['uuid'],
  'animation_tool.resume': ['uuid'],
  'animation_tool.stop': ['uuid'],
  'animation_tool.get_state': ['uuid'],
  'animation_tool.list_clips': ['uuid'],
  'animation_tool.set_current_time': ['uuid', 'time'],
  'animation_tool.set_speed': ['uuid', 'speed'],
  'animation_tool.crossfade': ['uuid', 'clipName'],
};

/**
 * Validate that all required parameters for a given tool+action are present.
 * @returns null if valid, or an error message string if missing params.
 */
export function validateRequiredParams(
  tool: string,
  action: string,
  params: Record<string, unknown>,
): string | null {
  const key = `${tool}.${action}`;
  const required = REQUIRED_PARAMS[key];
  if (!required || required.length === 0) return null;

  const missing = required.filter(k => {
    const v = params[k];
    return v === undefined || v === null || v === '';
  });

  if (missing.length === 0) return null;
  return `action "${action}" 缺少必需参数: ${missing.join(', ')}`;
}
