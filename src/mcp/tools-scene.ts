import { z } from 'zod';
import { ErrorCategory, logIgnored } from '../error-utils';
import {
  type BridgeToolContext,
  toInputSchema,
  beginSceneRecording,
  endSceneRecording,
  normalizeParams,
  normalizeComponentName,
  withGuardrailHints,
  extractSelectedNodeUuid,
  DANGEROUS_SCENE_ACTIONS,
  errorMessage,
  normalizeDbUrl,
  AI_RULES,
  validateRequiredParams,
} from './tools-shared';
import type { LocalToolServer } from './local-tool-server';

export function registerSceneTools(server: LocalToolServer, ctx: BridgeToolContext): void {
  const { bridgeGet, bridgePost, sceneMethod, editorMsg, text, sceneOp } = ctx;
  const toStructuredToolResult = (result: unknown, successMeta: Record<string, unknown>, fallbackResult?: unknown) => {
    if (result && typeof result === 'object' && ('success' in result || 'error' in result)) {
      const merged = { ...successMeta, ...(result as Record<string, unknown>) };
      const failed = ('error' in merged && merged.error) || ('success' in merged && merged.success === false);
      return text(merged, Boolean(failed));
    }
    return text({ success: true, ...successMeta, ...(result === undefined ? (fallbackResult === undefined ? {} : { result: fallbackResult }) : { result }) });
  };
  const forceDirtyNodeTouch = async (uuid: string, name: string): Promise<void> => {
    if (!uuid || !name) return;
    await editorMsg('scene', 'set-property', {
      uuid,
      path: 'name',
      dump: { type: 'string', value: name },
    });
  };

  const NEW_QUERY_ACTIONS = new Set(['measure_distance', 'scene_snapshot', 'scene_diff', 'performance_audit', 'export_scene_json', 'deep_validate_scene', 'get_node_bounds', 'find_nodes_by_layer', 'get_animation_state', 'get_collider_info', 'get_material_info', 'get_light_info', 'get_scene_environment', 'screen_to_world', 'world_to_screen', 'check_script_ready', 'get_script_properties']);

  server.tool(
    'scene_query',
    `Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.

Actions & required parameters:
- tree: includeInternal(optional, default false). Returns hierarchical scene tree. By default filters engine-internal hidden nodes (HideInHierarchy) to match editor hierarchy panel.
- list: includeInternal(optional, default false). Returns flat node list with uuid/name/depth/childCount. By default filters hidden nodes.
- stats: includeInternal(optional, default false). Returns scene statistics. By default filters hidden nodes, reports filteredInternalNodes count.
- node_detail: uuid(REQUIRED). Returns full detail of a single node (position, rotation, scale, components, active, layer).
- find_by_path: path(REQUIRED). Find node by hierarchy path like "Canvas/Panel/Button".
- get_components: uuid(REQUIRED). List all components on a node.
- get_parent: uuid(REQUIRED). Get parent node info.
- get_children: uuid(REQUIRED). Get direct children of a node.
- get_sibling: uuid(REQUIRED). Get sibling nodes.
- get_world_position: uuid(REQUIRED). Get world-space position {x,y,z}.
- get_world_rotation: uuid(REQUIRED). Get world-space rotation.
- get_world_scale: uuid(REQUIRED). Get world-space scale.
- get_active_in_hierarchy: uuid(REQUIRED). Check if node is active considering parent chain.
- find_nodes_by_name: name(REQUIRED). Search nodes by name substring match.
- find_nodes_by_component: component(REQUIRED). Find all nodes with a specific component type.
- get_component_property: uuid(REQUIRED), component(REQUIRED), property(REQUIRED). Read a single component property value.
- get_node_components_properties: uuid(REQUIRED). Get all properties of all components on a node.
- get_camera_info: uuid(optional). Get camera component info (fov, near, far, orthoHeight, projection, clearFlags, priority, clearColor, rect, visibility, clearDepth, clearStencil, aperture, shutter, iso, targetTexture). If uuid omitted, finds all cameras.
- get_canvas_info: uuid(optional). Get Canvas component info. If uuid omitted, finds first canvas.
- get_scene_globals: no params. Get scene-level global settings (ambient, fog, shadows).
- get_current_selection: no params. Get currently selected node(s) in editor with detail.
- get_active_scene_focus: no params. Get AI-context: selected node detail or scene stats as fallback.
- list_all_scenes: no params. List all .scene files in the project.
- validate_scene: no params. Run validation checks on the current scene.
- detect_2d_3d: no params. Detect whether scene is 2D, 3D, or mixed.
- list_available_components: no params. List all available component types (including custom) from cc.js runtime.
- measure_distance: uuidA(REQUIRED), uuidB(REQUIRED). Measure 2D/3D distance between two nodes.
- scene_snapshot: maxNodes(optional, default 500). Capture full scene state for later diffing.
- scene_diff: snapshotA(REQUIRED), snapshotB(REQUIRED). Compare two snapshots to find added/removed/modified nodes.
- performance_audit: no params. Analyze scene for performance issues (too many nodes, deep hierarchy, etc.).
- export_scene_json: no params. Export full scene tree as JSON.
- deep_validate_scene: no params. Deep validation with missing asset detection, orphan node check, and fix suggestions.
- get_node_bounds: uuid(REQUIRED). Get bounding box of a node (2D: local/world rect via UITransform, 3D: AABB via MeshRenderer).
- find_nodes_by_layer: layer(REQUIRED, bitmask value e.g. 1=DEFAULT, 33554432=UI_2D). Find all nodes matching a layer. exact(optional, default true).
- get_animation_state: uuid(REQUIRED). Get Animation component state: clips, playing status, current time, default clip.
- get_collider_info: uuid(REQUIRED). Get all collider components on a node with size/offset/type + RigidBody info.
- get_material_info: uuid(REQUIRED). Get material info on a node's renderer (MeshRenderer/Sprite/etc): effectName, technique, passes, uniforms (mainColor, albedo, roughness, metallic, etc).
- get_light_info: uuid(optional). Get all light components in scene (DirectionalLight/SpotLight/SphereLight) with color, illuminance/luminance, range, shadow settings, position/rotation. If uuid specified, only that node.
- get_scene_environment: no params. Get structured scene environment settings: ambient (skyColor, skyIllum), shadows (enabled, type, size), fog (enabled, type, density), skybox (enabled, useIBL, useHDR), octree.
- screen_to_world: uuid(optional camera), screenX/screenY(REQUIRED), screenZ(optional, default 0). Convert screen coordinates to world position via camera.
- world_to_screen: uuid(optional camera), worldX/worldY/worldZ(REQUIRED). Convert world position to screen coordinates via camera.
- check_script_ready: script(REQUIRED, class name). Check if a script class is compiled and registered, returns {ready, isComponent}.
- get_script_properties: script(REQUIRED, class name). Get all @property declarations of a script class (name, type, default, visible).
- query_node: uuid(REQUIRED). Query node dump data via native Editor IPC (returns full serialized node info).
- query_component: uuid(REQUIRED). Query component dump data via native Editor IPC.
- query_node_tree: no params. Query the full node tree via native Editor IPC (returns raw editor tree structure).
- query_nodes_by_asset_uuid: assetUuid(REQUIRED). Find all nodes that reference a specific asset UUID.
- query_is_ready: no params. Check if the current scene is fully loaded and ready.
- query_classes: no params. List all classes registered in the engine.
- query_component_has_script: className(REQUIRED). Check if engine component list contains a script with the given class name.

Returns: All actions return JSON. tree→{uuid,name,active,childCount,children[]}. list→{count,nodes[{uuid,name,depth,path}]}. stats→{sceneName,nodeCount,activeCount}. node_detail→{uuid,name,active,path,position,scale,components[]}. find_nodes_by_name→{nodes[]}. get_component_property→{value}. On error: {error:"message"}.
Common errors: "没有打开的场景"=no scene open; "未找到节点: uuid"=invalid UUID (use tree/list to get valid UUIDs first).` + AI_RULES,
    toInputSchema({
      action: z.enum([
        'tree', 'list', 'stats', 'node_detail', 'find_by_path', 'get_components',
        'get_parent', 'get_children', 'get_sibling', 'get_world_position',
        'get_world_rotation', 'get_world_scale', 'get_active_in_hierarchy',
        'find_nodes_by_name', 'find_nodes_by_component', 'get_component_property',
        'get_node_components_properties', 'get_camera_info', 'get_canvas_info', 'get_scene_globals',
        'get_current_selection', 'get_active_scene_focus',
        'list_all_scenes', 'validate_scene', 'detect_2d_3d',
        'list_available_components',
        'measure_distance', 'scene_snapshot', 'scene_diff',
        'performance_audit', 'export_scene_json',
        'deep_validate_scene',
        'get_node_bounds', 'find_nodes_by_layer', 'get_animation_state', 'get_collider_info',
        'get_material_info', 'get_light_info', 'get_scene_environment',
        'screen_to_world', 'world_to_screen',
        'check_script_ready', 'get_script_properties',
        // Native IPC queries
        'query_node', 'query_component', 'query_node_tree',
        'query_nodes_by_asset_uuid', 'query_is_ready',
        'query_classes', 'query_component_has_script',
      ]).describe('Query action to perform. See tool description for required parameters per action.'),
      uuid: z.string().optional().describe(
        'Target node UUID. REQUIRED for: node_detail, get_components, get_parent, get_children, get_sibling, ' +
        'get_world_position, get_world_rotation, get_world_scale, get_active_in_hierarchy, ' +
        'get_component_property, get_node_components_properties, get_node_bounds, get_animation_state, ' +
        'get_collider_info, get_material_info, get_light_info, screen_to_world, world_to_screen. ' +
        'Optional for: get_camera_info, get_canvas_info, get_light_info.'
      ),
      uuidA: z.string().optional().describe(
        'First node UUID for measure_distance. REQUIRED when action=measure_distance.'
      ),
      uuidB: z.string().optional().describe(
        'Second node UUID for measure_distance. REQUIRED when action=measure_distance.'
      ),
      path: z.string().optional().describe(
        'Node hierarchy path like "Canvas/Panel/Button". REQUIRED for action=find_by_path.'
      ),
      name: z.string().optional().describe(
        'Node name to search for (substring match). REQUIRED for action=find_nodes_by_name.'
      ),
      component: z.string().optional().describe(
        'Component type name, e.g. "Sprite", "Label", "UITransform", "cc.Camera". ' +
        'REQUIRED for: find_nodes_by_component, get_component_property. ' +
        'Use list_available_components action to discover valid names.'
      ),
      property: z.string().optional().describe(
        'Component property name, e.g. "string", "fontSize", "color", "spriteFrame". ' +
        'REQUIRED for action=get_component_property.'
      ),
      snapshotA: z.record(z.string(), z.unknown()).optional().describe(
        'First scene snapshot object (from a previous scene_snapshot call). REQUIRED for action=scene_diff.'
      ),
      snapshotB: z.record(z.string(), z.unknown()).optional().describe(
        'Second scene snapshot object (from a later scene_snapshot call). REQUIRED for action=scene_diff.'
      ),
      maxNodes: z.number().int().min(1).max(2000).optional().describe(
        'Maximum number of nodes to capture in scene_snapshot. Default: 500, Max: 2000. Only for action=scene_snapshot.'
      ),
      layer: z.number().int().optional().describe(
        'Node layer bitmask value. REQUIRED for: find_nodes_by_layer. Common: 1=DEFAULT, 33554432=UI_2D (1<<25).'
      ),
      exact: z.boolean().optional().describe(
        'Whether to match layer exactly (default true) or by bitmask intersection. Only for find_nodes_by_layer.'
      ),
      // filter internal/hidden nodes
      includeInternal: z.boolean().optional().describe(
        'Include engine-internal hidden nodes (HideInHierarchy). Default: false. ' +
        'When false, tree/list/stats only return nodes visible in editor hierarchy panel. ' +
        'Set true to see ALL runtime nodes including ScrollView internals, profiler nodes, etc.'
      ),
      // screen_to_world
      screenX: z.number().optional().describe('Screen X coordinate. REQUIRED for action=screen_to_world.'),
      screenY: z.number().optional().describe('Screen Y coordinate. REQUIRED for action=screen_to_world.'),
      screenZ: z.number().optional().describe('Screen Z (depth) coordinate. For action=screen_to_world. Default: 0.'),
      // world_to_screen
      worldX: z.number().optional().describe('World X coordinate. REQUIRED for action=world_to_screen.'),
      worldY: z.number().optional().describe('World Y coordinate. REQUIRED for action=world_to_screen.'),
      worldZ: z.number().optional().describe('World Z coordinate. REQUIRED for action=world_to_screen.'),
      // Script queries
      script: z.string().optional().describe('Script class name. REQUIRED for: check_script_ready, get_script_properties.'),
      // Native IPC queries
      assetUuid: z.string().optional().describe('Asset UUID. REQUIRED for: query_nodes_by_asset_uuid.'),
      className: z.string().optional().describe('Script class name. REQUIRED for: query_component_has_script.'),
    }),
    async (params) => {
      try {
        const p = params as Record<string, unknown>;
        const _paramErr = validateRequiredParams('scene_query', String(p.action), p);
        if (_paramErr) return text({ error: _paramErr }, true);
        if (p.action === 'get_current_selection') {
          const selection = await bridgeGet('/api/editor/selection');
          const selectedUuid = extractSelectedNodeUuid(selection);
          if (!selectedUuid) return text({ selected: [], focused: null, message: '当前没有选中节点' });
          const detail = await sceneMethod('dispatchQuery', [{ action: 'node_detail', uuid: selectedUuid }]);
          return text({ selected: [selectedUuid], focused: detail });
        }
        if (p.action === 'get_active_scene_focus') {
          const selection = await bridgeGet('/api/editor/selection');
          const selectedUuid = extractSelectedNodeUuid(selection);
          if (selectedUuid) {
            const detail = await sceneMethod('dispatchQuery', [{ action: 'node_detail', uuid: selectedUuid }]);
            return text({ source: 'selection', focus: detail });
          }
          const stats = await sceneMethod('dispatchQuery', [{ action: 'stats' }]);
          return text({ source: 'scene', focus: stats, message: '无选中节点，返回场景统计作为焦点上下文' });
        }
        if (p.action === 'list_all_scenes') {
          const scenes = await editorMsg('asset-db', 'query-assets', { pattern: 'db://assets/**/*.scene' });
          return text(scenes);
        }
        // ── Native IPC queries (bypass scene-script, call Editor IPC directly) ──
        if (p.action === 'query_node') {
          return text({ uuid: p.uuid, dump: await editorMsg('scene', 'query-node', p.uuid) });
        }
        if (p.action === 'query_component') {
          return text({ uuid: p.uuid, dump: await editorMsg('scene', 'query-component', p.uuid) });
        }
        if (p.action === 'query_node_tree') {
          return text(await editorMsg('scene', 'query-node-tree'));
        }
        if (p.action === 'query_nodes_by_asset_uuid') {
          return text({ assetUuid: p.assetUuid, nodes: await editorMsg('scene', 'query-nodes-by-asset-uuid', p.assetUuid) });
        }
        if (p.action === 'query_is_ready') {
          return text({ ready: await editorMsg('scene', 'query-is-ready') });
        }
        if (p.action === 'query_classes') {
          return text(await editorMsg('scene', 'query-classes'));
        }
        if (p.action === 'query_component_has_script') {
          return text({ className: p.className, hasScript: await editorMsg('scene', 'query-component-has-script', p.className) });
        }
        // For new query actions, try dispatchQuery first, fallback to MCP-layer
        if (NEW_QUERY_ACTIONS.has(String(p.action))) {
          const tryResult = await sceneMethod('dispatchQuery', [p]) as Record<string, unknown>;
          if (!tryResult?.error || !String(tryResult.error).includes('未知的查询 action')) {
            return text(tryResult);
          }
          return text(await fallbackSceneQuery(String(p.action), p, { sceneMethod, text }));
        }
        return text(await sceneMethod('dispatchQuery', [p]));
      } catch (err: unknown) {
        return text({ tool: 'scene_query', error: errorMessage(err) }, true);
      }
    },
  );

  // 3. scene_operation (39 actions — Community Edition)
  server.tool(
    'scene_operation',
    `Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.

Actions & required parameters:
- create_node: name(REQUIRED), parentUuid(recommended, omit=scene root), siblingIndex(optional, -1=append). Returns {uuid}.
  HOW TO USE: 1) Call scene_query action=tree to get scene hierarchy and parent UUIDs. 2) Call create_node with the target parentUuid.
  SMART PARENT: parentUuid accepts both UUID and node name. If a name is provided, the bridge auto-resolves it to the matching node. If the parent is not found, an error with available top-level nodes is returned — do NOT auto-create parents, let the user decide.
- destroy_node: uuid(REQUIRED), confirmDangerous=true(REQUIRED). Permanently removes a node.
- reparent: uuid(REQUIRED), parentUuid(REQUIRED). Move node under a new parent.
- set_position: uuid(REQUIRED), x/y/z(REQUIRED). Set LOCAL position.
- set_rotation: uuid(REQUIRED), x/y/z(REQUIRED). Set LOCAL euler rotation in degrees.
- set_scale: uuid(REQUIRED), x/y/z(REQUIRED). Set LOCAL scale (1=100%).
- set_world_position: uuid(REQUIRED), x/y/z(REQUIRED). Set WORLD position.
- set_world_rotation: uuid(REQUIRED), x/y/z(REQUIRED). Set WORLD euler rotation.
- set_world_scale: uuid(REQUIRED), x/y/z(REQUIRED). Set WORLD scale.
- set_name: uuid(REQUIRED), name(REQUIRED). Rename a node.
- set_active: uuid(REQUIRED), active(REQUIRED). Enable/disable a node.
- add_component: uuid(REQUIRED), component(REQUIRED, e.g. "Sprite","Label","RigidBody2D"). Add component.
  HOW TO USE: 1) Use scene_query action=find_nodes_by_name or action=tree to get the target node UUID. 2) Verify node exists. 3) Call add_component.
- remove_component: uuid(REQUIRED), component(REQUIRED). Remove component from node.
- set_property: uuid(REQUIRED), component(REQUIRED), property(REQUIRED), value(REQUIRED). Set a component property.
- reset_property: uuid(REQUIRED), component(REQUIRED), property(REQUIRED). Reset property to default.
- duplicate_node: uuid(REQUIRED), includeChildren(optional, default true). Clone node (and optionally children), returns {clonedUuid}.
- move_node_up/move_node_down: uuid(REQUIRED). Reorder in sibling list.
- set_sibling_index: uuid(REQUIRED), index(REQUIRED). Set exact sibling position (0-based).
- call_component_method: uuid(REQUIRED), component(REQUIRED), methodName(REQUIRED), args(optional).
- create_prefab: uuid(REQUIRED), savePath(recommended, e.g. "db://assets/prefabs/X.prefab").
- instantiate_prefab: prefabUrl(REQUIRED, db:// path to .prefab file), parentUuid(optional).
- enter_prefab_edit: prefabUrl(REQUIRED). Enter prefab editing mode (opens prefab as a scene). Use asset-db open-asset internally.
- exit_prefab_edit: sceneUrl(optional). Exit prefab editing mode and return to the previous scene. If sceneUrl omitted, opens the most recently opened scene.
- apply_prefab: uuid(REQUIRED). Apply changes to prefab asset.
- restore_prefab: uuid(REQUIRED). Restore prefab instance to original.
- validate_prefab: prefabUrl(REQUIRED). Check prefab file integrity.
- ensure_2d_canvas: confirmCreateCanvas(REQUIRED, true). Idempotent: returns existing Canvas if present. IF NOT PRESENT, YOU MUST EXPLICITLY ASK THE USER BEFORE CALLING THIS! Tell the user "There is no Canvas for 2D UI. Can I create one for you?". Only call this after they agree, and pass confirmCreateCanvas=true.
- reset_transform: uuid(REQUIRED). Reset position/rotation/scale to defaults. resetPosition/resetRotation/resetScale(optional, default true).
- set_anchor_point: uuid(REQUIRED), anchorX/anchorY(optional, default 0.5). Set UITransform anchor point directly.
- set_content_size: uuid(REQUIRED), width(REQUIRED), height(REQUIRED). Set UITransform content size directly.
- copy_node: uuid(REQUIRED). Copy node to clipboard (prepares for paste_node).
- paste_node: parentUuid(optional). Paste previously copied node under parent (omit=scene root).
- cut_node: uuid(REQUIRED). Cut node to clipboard (removes from scene, prepares for paste_node).
- move_array_element: uuid(REQUIRED), path(REQUIRED), target(REQUIRED, number). Move array element within a component property array.
- remove_array_element: uuid(REQUIRED), path(REQUIRED). Remove an array element from a component property array.
- execute_component_method: uuid(REQUIRED), component(REQUIRED), methodName(REQUIRED), args(optional). Execute a component method via native Editor IPC.
- clear_children: uuid(REQUIRED), confirmDangerous=true(REQUIRED). Remove all child nodes.
- reset_node_properties: uuid(REQUIRED), component(optional). Reset all component properties to defaults. If component specified, only reset that component.

ASSET REFERENCES: For set_property on spriteFrame/font/material, value MUST be {__uuid__:"asset-uuid-here"}. Get the UUID via asset_operation action=url_to_uuid. NEVER pass raw file paths or plain strings for asset properties.
NODE REFERENCES: For set_property on properties that expect a Node (e.g. ScrollView.content, ScrollView.view), value MUST be {"__refType__":"cc.Node","uuid":"target-node-uuid"}. The bridge resolves this via Editor IPC or runtime lookup.
COMPONENT REFERENCES: For set_property on properties that expect a Component, value MUST be {"__refType__":"cc.Component","uuid":"node-uuid","component":"ComponentName"}. The bridge resolves the node then gets the component.
PREREQUISITES: set_property requires the component to exist first (use add_component). For 2D UI nodes (Sprite/Label/Canvas), the node's layer should be UI_2D (33554432). If the scene has no Canvas, you MUST ask the user if they want one, then call ensure_2d_canvas.
PARENT RESOLUTION: parentUuid accepts both UUID and node name. The bridge auto-resolves names to nodes. If not found, error includes available top-level nodes for guidance.
Returns: create_node→{success,uuid,name,parent}. set_property→{success,uuid,component,property}. duplicate_node→{success,clonedUuid}. ensure_2d_canvas→{success,canvasUuid,cameraUuid,created,layer}. On error: {error:"message"}.
Common errors: "未找到节点"=bad UUID; "未找到父节点"=parent not found (check name spelling or use scene_query action=tree); "未找到组件类"=wrong component name (use scene_query action=list_available_components); "危险操作已拦截"=missing confirmDangerous=true for destroy_node/clear_children.` + AI_RULES,
    toInputSchema({
      action: z.enum([
        // Basic node (16)
        'create_node', 'destroy_node', 'reparent',
        'set_position', 'set_rotation', 'set_scale',
        'set_world_position', 'set_world_rotation', 'set_world_scale',
        'set_name', 'set_active', 'duplicate_node',
        'move_node_up', 'move_node_down', 'set_sibling_index', 'reset_transform',
        // Node grouping & batch (2)
        'group_nodes', 'batch',
        // Basic component (9)
        'add_component', 'remove_component', 'set_property', 'reset_property', 'call_component_method',
        'set_component_properties', 'attach_script', 'detach_script', 'batch_set_property',
        // Basic UI (5)
        'ensure_2d_canvas', 'set_anchor_point', 'set_content_size',
        'create_ui_widget', 'align_nodes',
        // Prefab (7)
        'create_prefab', 'instantiate_prefab',
        'enter_prefab_edit', 'exit_prefab_edit',
        'apply_prefab', 'restore_prefab', 'validate_prefab',
        // Clipboard (3)
        'copy_node', 'paste_node', 'cut_node',
        // Array operations (2)
        'move_array_element', 'remove_array_element',
        // Component method via native IPC (1)
        'execute_component_method',
        // IPC-only operations (2)
        'clear_children', 'reset_node_properties',
        // 3D primitives & camera (3)
        'create_primitive', 'create_camera', 'set_camera_look_at',
        // Camera property (1)
        'set_camera_property',
        // Light (2)
        'create_light', 'set_light_property',
        // Scene environment (1)
        'set_scene_environment',
        // Material (6)
        'set_material_property', 'assign_builtin_material', 'set_material_define',
        'assign_project_material', 'clone_material', 'swap_technique',
        // Sprite (1)
        'sprite_grayscale',
        // Events (3)
        'bind_event', 'unbind_event', 'list_events',
        // Special nodes (3)
        'audio_setup', 'create_skeleton_node', 'setup_particle',
      ]).describe('Operation to perform. See tool description for required parameters per action.'),
      uuid: z.string().optional().describe(
        'Target node UUID. REQUIRED for most actions: destroy_node, reparent, set_position, set_rotation, ' +
        'set_scale, set_name, set_active, add_component, remove_component, set_property, reset_property, ' +
        'set_world_position/rotation/scale, duplicate_node, move_node_up/down, set_sibling_index, ' +
        'call_component_method, create_prefab, apply_prefab, restore_prefab, ' +
        'set_anchor_point, set_content_size, reset_transform.'
      ),
      parentUuid: z.string().optional().describe(
        'Parent node UUID or name. REQUIRED for: reparent. Recommended for: create_node (omit = scene root), ' +
        'instantiate_prefab. ' +
        'Accepts both UUID (preferred) and node name (auto-resolved). If parent not found, error includes available nodes.'
      ),
      name: z.string().optional().describe(
        'Node name string. REQUIRED for: set_name, create_node.'
      ),
      siblingIndex: z.number().int().optional().describe(
        'Sibling insertion index for create_node. 0=first child, -1=append at end (default). ' +
        'Only used by action=create_node. Use set_sibling_index to change after creation.'
      ),
      includeChildren: z.boolean().optional().describe(
        'Whether to include child nodes when duplicating. Default: true. ' +
        'Only used by action=duplicate_node. Set false to duplicate the node itself without its children.'
      ),
      x: z.number().optional().describe(
        'X coordinate value. REQUIRED for: set_position, set_rotation, set_scale, set_world_position, ' +
        'set_world_rotation, set_world_scale. For position: pixels in 2D, units in 3D. For rotation: degrees. For scale: 1.0=100%.'
      ),
      y: z.number().optional().describe(
        'Y coordinate value. REQUIRED with x for: set_position, set_rotation, set_scale, ' +
        'set_world_position, set_world_rotation, set_world_scale.'
      ),
      z: z.number().optional().describe(
        'Z coordinate value. REQUIRED with x,y for 3D transforms. For 2D scenes, typically 0.'
      ),
      active: z.boolean().optional().describe(
        'Node active state. REQUIRED for action=set_active. true=visible and updated, false=disabled.'
      ),
      component: z.string().optional().describe(
        'Component type name. REQUIRED for: add_component, remove_component, set_property, reset_property, ' +
        'call_component_method. Common values: "Sprite", "Label", "Button", "UITransform", "Widget", ' +
        '"RigidBody2D", "BoxCollider2D", "Animation", "AudioSource", "Camera", "MeshRenderer". ' +
        'Use scene_query action=list_available_components to discover all valid names.'
      ),
      property: z.string().optional().describe(
        'Component property name. REQUIRED for: set_property, reset_property. Examples: ' +
        'Sprite: "spriteFrame", "color", "sizeMode", "type". Label: "string", "fontSize", "color", "horizontalAlign". ' +
        'UITransform: "contentSize", "anchorPoint". Widget: "isAlignTop", "top", "isAlignLeft", "left".'
      ),
      value: z.union([z.string(), z.number(), z.boolean(), z.record(z.string(), z.unknown()), z.array(z.unknown()), z.null()]).optional().describe(
        'Property value. REQUIRED for: set_property. Type depends on the property: ' +
        'string for text (Label.string), number for numeric (Label.fontSize=24), boolean for toggles (Node.active=true), ' +
        'object for complex types like Color {r:255,g:0,b:0,a:255}, Vec3 {x:0,y:0,z:0}, ' +
        'Asset ref {__uuid__:"xxx"}, Size {width:100,height:100}, ' +
        'Node ref {"__refType__":"cc.Node","uuid":"target-node-uuid"} (e.g. ScrollView.content/view), ' +
        'Component ref {"__refType__":"cc.Component","uuid":"node-uuid","component":"ClassName"}.'
      ),
      index: z.number().int().min(0).optional().describe(
        'Sibling index (0-based). REQUIRED for: set_sibling_index. 0=first child, -1 or omit=last.'
      ),
      layer: z.number().int().optional().describe(
        'Node layer bitmask value. REQUIRED for: set_layer. Common values: 1<<0=DEFAULT(1), 1<<25=UI_2D(33554432), 1<<30=IGNORE_RAYCAST.'
      ),
      methodName: z.string().optional().describe(
        'Component method name to call. REQUIRED for: call_component_method, execute_component_method.'
      ),
      args: z.array(z.unknown()).optional().describe(
        'Arguments array for call_component_method / execute_component_method.'
      ),
      path: z.string().optional().describe(
        'Property path for array operations. REQUIRED for: move_array_element, remove_array_element. ' +
        'Format: "componentUuid.propertyName.index" (e.g. "compUuid.__comps__.0.items.2").'
      ),
      target: z.number().int().optional().describe(
        'Target index for move_array_element. REQUIRED for: move_array_element.'
      ),
      savePath: z.string().optional().describe(
        'db:// path to save the prefab asset. Recommended for: create_prefab. Default: "db://assets/prefabs/{name}.prefab". ' +
        'Example: "db://assets/prefabs/enemies/Boss.prefab".'
      ),
      confirmDangerous: z.boolean().optional().describe(
        'Safety guardrail. MUST be true for destructive actions: destroy_node. ' +
        'If omitted, these actions are BLOCKED to prevent accidental data loss.'
      ),
      prefabUrl: z.string().optional().describe(
        'db:// URL of a .prefab asset. REQUIRED for: instantiate_prefab, validate_prefab, enter_prefab_edit. ' +
        'Example: "db://assets/prefabs/Player.prefab".'
      ),
      sceneUrl: z.string().optional().describe(
        'db:// URL of a .scene asset. Optional for: exit_prefab_edit (return to this scene). ' +
        'If omitted, returns to the most recently opened scene.'
      ),
      // ensure_2d_canvas
      confirmCreateCanvas: z.boolean().optional().describe(
        'Confirmation from the user to create a Canvas node. REQUIRED for action=ensure_2d_canvas. ' +
        'Must explicitly ask the user and receive permission first.'
      ),
      designWidth: z.number().optional().describe(
        'Design resolution width for Canvas. For action=ensure_2d_canvas. Default: 960.'
      ),
      designHeight: z.number().optional().describe(
        'Design resolution height for Canvas. For action=ensure_2d_canvas. Default: 640.'
      ),
      color: z.object({
        r: z.number().int().min(0).max(255).optional().describe('Red channel 0-255'),
        g: z.number().int().min(0).max(255).optional().describe('Green channel 0-255'),
        b: z.number().int().min(0).max(255).optional().describe('Blue channel 0-255'),
        a: z.number().int().min(0).max(255).optional().describe('Alpha channel 0-255'),
      }).optional().describe(
        'Color RGBA values 0-255.'
      ),
      script: z.string().optional().describe(
        'Script class name. REQUIRED for: check_script_ready, get_script_properties (scene_query). ' +
        'Example: "PlayerController", "EnemyAI". Must match the @ccclass name in the .ts file.'
      ),
      properties: z.record(z.string(), z.unknown()).optional().describe(
        'Key-value pairs for component/script properties.'
      ),
      // reset_transform
      resetPosition: z.boolean().optional().describe(
        'Whether to reset position to (0,0,0). For reset_transform. Default: true.'
      ),
      resetRotation: z.boolean().optional().describe(
        'Whether to reset rotation to (0,0,0). For reset_transform. Default: true.'
      ),
      resetScale: z.boolean().optional().describe(
        'Whether to reset scale to (1,1,1). For reset_transform. Default: true.'
      ),
      // set_anchor_point
      anchorX: z.number().min(0).max(1).optional().describe(
        'Anchor point X (0-1). REQUIRED for: set_anchor_point. 0=left, 0.5=center, 1=right. Default: 0.5.'
      ),
      anchorY: z.number().min(0).max(1).optional().describe(
        'Anchor point Y (0-1). REQUIRED for: set_anchor_point. 0=bottom, 0.5=center, 1=top. Default: 0.5.'
      ),
      // set_content_size
      width: z.number().min(0).optional().describe(
        'Content width in pixels. REQUIRED for: set_content_size.'
      ),
      height: z.number().min(0).optional().describe(
        'Content height in pixels. REQUIRED for: set_content_size.'
      ),
    }),
    async (params) => {
      try {
        const p = params as Record<string, unknown>;

        // Phase 0: 声明式必需参数验证
        const _paramErr = validateRequiredParams('scene_operation', String(p.action), p);
        if (_paramErr) return text({ error: _paramErr }, true);

        // Phase 1: 路径规范化 + 路径遍历防护
        const { warnings, pathError } = normalizeParams(p);
        if (pathError) return text({ error: `路径安全校验失败: ${pathError}` }, true);
        const guardrailWarnings = [...warnings];

        if (DANGEROUS_SCENE_ACTIONS.has(String(p.action || '')) && p.confirmDangerous !== true) {
          return text({
            success: false,
            error: `危险操作 ${p.action} 已拦截。请显式传入 confirmDangerous=true 后重试。`,
            hint: '这是人类确认护栏，防止 AI 误删层级。',
          }, true);
        }

        if (typeof p.component === 'string' && p.component.trim()) {
          const normalizedComp = normalizeComponentName(p.component);
          if (normalizedComp.corrected) {
            guardrailWarnings.push(`组件名自动纠正: ${p.component} -> ${normalizedComp.finalName}`);
            p.component = normalizedComp.finalName;
          }
        }

        // create_prefab 需要特殊处理：先验证节点，再通过 Editor IPC 创建预制体
        if (p.action === 'create_prefab') {
          const savePath = String(p.savePath || `db://assets/prefabs/${p.name || 'NewPrefab'}.prefab`);
          const normalized = normalizeDbUrl(savePath);
          const finalPath = normalized.url;
          try {
            const result = await editorMsg('scene', 'create-prefab', p.uuid, finalPath);
            return toStructuredToolResult(
              result,
              {
                uuid: p.uuid,
                savePath: finalPath,
                ...(guardrailWarnings.length ? { warnings: guardrailWarnings } : {}),
              },
            );
          } catch (err: unknown) {
            return text(withGuardrailHints({ error: `创建预制体失败: ${errorMessage(err)}`, uuid: p.uuid, savePath: finalPath }), true);
          }
        }

        // --- 预制体生命周期操作 ---
        if (p.action === 'instantiate_prefab') {
          const prefabUrl = String(p.prefabUrl || p.url || '');
          try {
            const prefabUuid = await editorMsg('asset-db', 'query-uuid', prefabUrl);
            if (!prefabUuid) return text({ error: `预制体不存在: ${prefabUrl}` }, true);
            const sceneTree = await sceneMethod('dispatchQuery', [{ action: 'tree', includeInternal: true }]) as Record<string, unknown>;
            const sceneRootUuid = String(sceneTree?.uuid ?? sceneTree?._id ?? '');
            const parentTarget = String(p.parentUuid ?? '');
            const recordId = await beginSceneRecording(editorMsg, [parentTarget || sceneRootUuid]);
            let result: unknown;
            try {
              result = await sceneMethod('instantiatePrefab', [String(prefabUuid), p.parentUuid || '']);
              // instantiatePrefab 运行在 execute-scene-script 上下文，需从主进程 force-dirty
              const r = result as Record<string, unknown>;
              const touchUuid = String(r?.uuid ?? r?.instanceUuid ?? '');
              if (touchUuid) {
                const touchRecordId = await beginSceneRecording(editorMsg, [touchUuid]);
                try {
                  const dump = await editorMsg('scene', 'query-node', touchUuid) as Record<string, unknown>;
                  const nameVal = (dump as { value?: { name?: { value?: string } } })?.value?.name?.value;
                  if (typeof nameVal === 'string' && nameVal) {
                    await editorMsg('scene', 'set-property', {
                      uuid: touchUuid, path: 'name',
                      dump: { type: 'string', value: nameVal },
                    });
                  }
                } catch {
                  /* best-effort */
                } finally {
                  await endSceneRecording(editorMsg, touchRecordId);
                }
              }
            } finally {
              await endSceneRecording(editorMsg, recordId);
            }
            return toStructuredToolResult(result, { action: 'instantiate_prefab', prefabUrl, method: 'scene-script' }, 'instantiated');
          } catch (err: unknown) {
            return text({ error: `实例化预制体失败: ${errorMessage(err)}` }, true);
          }
        }
        if (p.action === 'enter_prefab_edit') {
          const prefabUrl = String(p.prefabUrl || p.url || '');
          try {
            const prefabUuid = await editorMsg('asset-db', 'query-uuid', prefabUrl);
            if (!prefabUuid) return text({ error: `预制体不存在: ${prefabUrl}` }, true);
            await editorMsg('asset-db', 'open-asset', String(prefabUuid));
            return text({ success: true, action: 'enter_prefab_edit', prefabUrl, prefabUuid: String(prefabUuid) });
          } catch (err: unknown) {
            return text({ error: `进入预制体编辑模式失败: ${errorMessage(err)}` }, true);
          }
        }
        if (p.action === 'exit_prefab_edit') {
          try {
            const sceneUrl = String(p.sceneUrl || '');
            if (sceneUrl) {
              const sceneUuid = await editorMsg('asset-db', 'query-uuid', sceneUrl);
              if (!sceneUuid) return text({ error: `场景不存在: ${sceneUrl}` }, true);
              await editorMsg('asset-db', 'open-asset', String(sceneUuid));
              return text({ success: true, action: 'exit_prefab_edit', sceneUrl });
            }
            const scenes = await editorMsg('asset-db', 'query-assets', { pattern: 'db://assets/**/*.scene' }) as Array<{ uuid?: string; url?: string }> | null;
            if (scenes && scenes.length > 0) {
              const first = scenes[0];
              await editorMsg('asset-db', 'open-asset', String(first.uuid));
              return text({ success: true, action: 'exit_prefab_edit', sceneUrl: first.url });
            }
            return text({ error: '没有找到可用的场景文件' }, true);
          } catch (err: unknown) {
            return text({ error: `退出预制体编辑模式失败: ${errorMessage(err)}` }, true);
          }
        }
        if (p.action === 'apply_prefab') {
          try {
            const result = await editorMsg('scene', 'apply-prefab', p.uuid);
            return toStructuredToolResult(result, { action: 'apply_prefab', uuid: p.uuid }, 'applied');
          } catch (err: unknown) {
            return text({ error: `应用预制体更改失败: ${errorMessage(err)}` }, true);
          }
        }
        if (p.action === 'restore_prefab') {
          try {
            const result = await editorMsg('scene', 'restore-prefab', p.uuid);
            return toStructuredToolResult(result, { action: 'restore_prefab', uuid: p.uuid }, 'restored');
          } catch (err: unknown) {
            return text({ error: `恢复预制体失败: ${errorMessage(err)}` }, true);
          }
        }
        if (p.action === 'validate_prefab') {
          const prefabUrl = String(p.prefabUrl || p.url || '');
          try {
            const info = await editorMsg('asset-db', 'query-asset-info', prefabUrl);
            if (!info) return text({ valid: false, prefabUrl, error: '预制体文件不存在' });
            let dependencies: unknown = null;
            try {
              dependencies = await editorMsg('asset-db', 'query-asset-dependencies', prefabUrl);
            } catch {
              dependencies = '(query-asset-dependencies IPC 不可用，跳过依赖检查)';
            }
            return text({ valid: true, prefabUrl, assetInfo: info, dependencies });
          } catch (err: unknown) {
            return text({ valid: false, prefabUrl, error: errorMessage(err) });
          }
        }

        // ── Clipboard operations (native IPC) ──
        if (p.action === 'copy_node') {
          try {
            const result = await editorMsg('scene', 'copy-node', [p.uuid]);
            return toStructuredToolResult(result, { action: 'copy_node', uuid: p.uuid }, 'copied');
          } catch (err: unknown) {
            return text({ error: `复制节点失败: ${errorMessage(err)}` }, true);
          }
        }
        if (p.action === 'paste_node') {
          try {
            const result = await editorMsg('scene', 'paste-node', p.parentUuid || undefined);
            return toStructuredToolResult(result, { action: 'paste_node', parentUuid: p.parentUuid }, 'pasted');
          } catch (err: unknown) {
            return text({ error: `粘贴节点失败: ${errorMessage(err)}` }, true);
          }
        }
        if (p.action === 'cut_node') {
          try {
            const result = await editorMsg('scene', 'cut-node', [p.uuid]);
            return toStructuredToolResult(result, { action: 'cut_node', uuid: p.uuid }, 'cut');
          } catch (err: unknown) {
            return text({ error: `剪切节点失败: ${errorMessage(err)}` }, true);
          }
        }
        // ── Array operations (native IPC) ──
        if (p.action === 'move_array_element') {
          try {
            const result = await editorMsg('scene', 'move-array-element', { uuid: p.uuid, path: p.path, target: p.target });
            return toStructuredToolResult(result, { action: 'move_array_element' }, 'moved');
          } catch (err: unknown) {
            return text({ error: `移动数组元素失败: ${errorMessage(err)}` }, true);
          }
        }
        if (p.action === 'remove_array_element') {
          try {
            const result = await editorMsg('scene', 'remove-array-element', { uuid: p.uuid, path: p.path });
            return toStructuredToolResult(result, { action: 'remove_array_element' }, 'removed');
          } catch (err: unknown) {
            return text({ error: `删除数组元素失败: ${errorMessage(err)}` }, true);
          }
        }
        // ── Execute component method via native IPC ──
        if (p.action === 'execute_component_method') {
          try {
            const result = await editorMsg('scene', 'execute-component-method', {
              uuid: p.uuid, component: p.component, method: p.methodName,
              args: Array.isArray(p.args) ? p.args : [],
            });
            return toStructuredToolResult(result, { action: 'execute_component_method' }, 'executed');
          } catch (err: unknown) {
            return text({ error: `执行组件方法失败: ${errorMessage(err)}` }, true);
          }
        }

        // ── IPC-only operations (bypass scene-script runtime) ──
        if (p.action === 'destroy_node') {
          try {
            const result = await editorMsg('scene', 'remove-node', { uuid: p.uuid });
            return toStructuredToolResult(result, { uuid: p.uuid, _editorIPC: true }, 'removed');
          } catch (err: unknown) {
            return text({ error: `删除节点失败: ${errorMessage(err)}` }, true);
          }
        }
        if (p.action === 'clear_children') {
          try {
            const tree = await sceneMethod('dispatchQuery', [{ action: 'get_children', uuid: p.uuid }]) as { children?: Array<{ uuid: string }> };
            const children = tree?.children ?? [];
            let removed = 0;
            for (const child of children) {
              try { await editorMsg('scene', 'remove-node', { uuid: child.uuid }); removed++; } catch { /* skip */ }
            }
            return text({ success: true, uuid: p.uuid, removedCount: removed, totalChildren: children.length, _editorIPC: true });
          } catch (err: unknown) {
            return text({ error: `清除子节点失败: ${errorMessage(err)}` }, true);
          }
        }
        if (p.action === 'reset_property') {
          try {
            const result = await editorMsg('scene', 'reset-property', { uuid: p.uuid, path: `${p.component}.${p.property}` });
            return toStructuredToolResult(result, { uuid: p.uuid, component: p.component, property: p.property, _editorIPC: true }, 'reset');
          } catch (err: unknown) {
            return text({ error: `重置属性失败: ${errorMessage(err)}` }, true);
          }
        }
        if (p.action === 'reset_node_properties') {
          try {
            const comps = await sceneMethod('dispatchQuery', [{ action: 'get_components', uuid: p.uuid }]) as { components?: Array<{ type: string }> };
            const components = comps?.components ?? [];
            const targetComp = p.component ? String(p.component) : '';
            let resetCount = 0;
            for (const comp of components) {
              if (targetComp && comp.type !== targetComp && comp.type !== `cc.${targetComp}`) continue;
              try { await editorMsg('scene', 'reset-component', { uuid: p.uuid, component: comp.type }); resetCount++; } catch { /* skip */ }
            }
            return text({ success: true, uuid: p.uuid, componentsReset: resetCount, _editorIPC: true });
          } catch (err: unknown) {
            return text({ error: `重置节点属性失败: ${errorMessage(err)}` }, true);
          }
        }
        // reset_transform: 委托给 dispatchOperation，支持 resetPosition/resetRotation/resetScale 细粒度标志
        if (p.action === 'call_component_method') {
          try {
            const result = await editorMsg('scene', 'execute-component-method', {
              uuid: p.uuid, component: p.component, method: p.methodName,
              args: Array.isArray(p.args) ? p.args : [],
            });
            return toStructuredToolResult(result, { uuid: p.uuid, component: p.component, method: p.methodName, _editorIPC: true }, 'executed');
          } catch (err: unknown) {
            return text({ error: `调用组件方法失败: ${errorMessage(err)}` }, true);
          }
        }

        // ── New actions: try dispatchOperation first, fallback to MCP-layer implementation ──
        const NEW_SCENE_OPS = new Set([
          'ensure_2d_canvas',
          'set_anchor_point', 'set_content_size',
        ]);
        const COMPONENT_CHANGING_OPS = new Set([
          'ensure_2d_canvas',
        ]);
        if (NEW_SCENE_OPS.has(String(p.action))) {
          const tryResult = withGuardrailHints(await sceneOp(p as Record<string, unknown>)) as Record<string, unknown>;
          if (!tryResult?.error || !String(tryResult.error).includes('未知的操作 action')) {
            if (tryResult?.success && COMPONENT_CHANGING_OPS.has(String(p.action))) {
              const affUuid = String(tryResult.uuid ?? p.uuid ?? '');
              if (affUuid) {
                try { await bridgePost('/api/editor/select', { uuids: [affUuid], forceRefresh: true }); } catch { /* ignore */ }
              }
            }
            return text(tryResult);
          }
          // Fallback: implement at MCP layer using basic scene methods
          const fallbackResult = withGuardrailHints(
            await fallbackSceneOperation(String(p.action), p, { sceneMethod, editorMsg, bridgePost, text })
          ) as Record<string, unknown>;
          return text(fallbackResult, Boolean(fallbackResult?.error));
        }

        const result = withGuardrailHints(await sceneOp(p as Record<string, unknown>)) as Record<string, unknown>;
        // 如果有路径规范化警告，附加到返回值
        if (guardrailWarnings.length && result && typeof result === 'object') {
          (result as Record<string, unknown>)._pathWarnings = guardrailWarnings;
        }
        if (result && result.success) {
          const affectedUuid =
            (typeof result.uuid === 'string' && result.uuid) ||
            (typeof result.clonedUuid === 'string' && result.clonedUuid) ||
            '';
          if (String(p.action) === 'create_node' && affectedUuid) {
            const touchedName =
              (typeof result.name === 'string' && result.name) ||
              (typeof p.name === 'string' && p.name) ||
              'New Node';
            try {
              await forceDirtyNodeTouch(affectedUuid, touchedName);
              (result as Record<string, unknown>)._forcedDirty = true;
            } catch (e) {
              logIgnored(ErrorCategory.EDITOR_IPC, 'create_node 后补记 dirty 失败', e);
            }
          }
          if (affectedUuid) {
            try {
              await bridgePost('/api/editor/select', { uuids: [affectedUuid], forceRefresh: true });
            } catch (e) {
              logIgnored(ErrorCategory.EDITOR_IPC, '操作后高亮节点失败', e);
            }
            try {
              await bridgePost('/api/console/log', { text: `已高亮节点: ${affectedUuid} (${p.action})` });
            } catch { /* ignore */ }
          }
        }
        return text(result);
      } catch (err: unknown) {
        return text(withGuardrailHints({ tool: 'scene_operation', error: errorMessage(err) }), true);
      }
    },
  );
}

// ─── Fallback implementations for new actions (when scene script hasn't reloaded) ───

type FallbackCtx = {
  sceneMethod: BridgeToolContext['sceneMethod'];
  editorMsg: BridgeToolContext['editorMsg'];
  bridgePost: BridgeToolContext['bridgePost'];
  text: BridgeToolContext['text'];
};

async function fallbackSceneOperation(action: string, p: Record<string, unknown>, ctx: FallbackCtx): Promise<unknown> {
  const { sceneMethod, editorMsg } = ctx;
  const op = (a: string, extra: Record<string, unknown> = {}) =>
    sceneMethod('dispatchOperation', [{ action: a, ...extra }]) as Promise<Record<string, unknown>>;
  const query = (a: string, extra: Record<string, unknown> = {}) =>
    sceneMethod('dispatchQuery', [{ action: a, ...extra }]) as Promise<Record<string, unknown>>;

  switch (action) {
    case 'ensure_2d_canvas': {
      if (p.confirmCreateCanvas !== true) {
        return {
          error: 'Missing confirmCreateCanvas=true. You MUST explicitly ask the user if they want to create a Canvas node for 2D UI. Only call this action after they agree, and set confirmCreateCanvas=true.'
        };
      }

      const UI_2D_LAYER = 33554432;
      const designHeight = typeof p.designHeight === 'number' ? p.designHeight : 640;
      const designWidth = typeof p.designWidth === 'number' ? p.designWidth : 960;
      const canvasName = typeof p.name === 'string' ? p.name : 'Canvas';

      const canvasInfo = await query('get_canvas_info') as { canvases?: Array<{ uuid: string; name: string; path: string }> };
      const existing = (canvasInfo.canvases ?? []).find(c => !c.path.includes('Editor Scene Background'));
      if (existing) {
        return { success: true, canvasUuid: existing.uuid, canvasName: existing.name, created: false, message: '场景已有 Canvas，直接复用' };
      }

      const sceneTree = await sceneMethod('dispatchQuery', [{ action: 'tree', includeInternal: true }]) as Record<string, unknown>;
      const sceneRootUuid = String(sceneTree?.uuid ?? sceneTree?._id ?? '');
      // 从扩展主进程发 begin-recording，确保整个 Canvas 创建在一个 undo 事务内并标记 dirty
      const recordId = await beginSceneRecording(editorMsg, sceneRootUuid ? [sceneRootUuid] : []);
      try {
        // 直接从扩展主进程调用 create-node（不走 execute-scene-script），确保触发 dirty 标记
        const rawCanvas = await editorMsg('scene', 'create-node', { name: canvasName });
        const rawCanvasObj = rawCanvas as Record<string, unknown>;
        const canvasUuid = String(rawCanvasObj?.uuid ?? rawCanvasObj?._id ?? (typeof rawCanvas === 'string' ? rawCanvas : ''));
        if (!canvasUuid) return { error: '创建 Canvas 节点失败（IPC 未返回 UUID）' };

        // 直接从扩展主进程添加 Canvas 组件
        try {
          await editorMsg('scene', 'create-component', { uuid: canvasUuid, component: 'cc.Canvas' });
        } catch (e) {
          try { await editorMsg('scene', 'remove-node', { uuid: canvasUuid }); } catch {}
          return { error: `Canvas 组件添加失败 (可能引擎版本不支持): ${e instanceof Error ? e.message : String(e)}。场景模板可能已自带 Canvas，请用 scene_query action=tree 确认。` };
        }

        await op('set_layer', { uuid: canvasUuid, layer: UI_2D_LAYER });

        // 直接从扩展主进程创建 Camera 子节点
        let cameraUuid = '';
        try {
          const rawCamera = await editorMsg('scene', 'create-node', { parent: canvasUuid, name: 'Camera' });
          const rawCameraObj = rawCamera as Record<string, unknown>;
          cameraUuid = String(rawCameraObj?.uuid ?? rawCameraObj?._id ?? (typeof rawCamera === 'string' ? rawCamera : ''));
        } catch (e) {
          logIgnored(ErrorCategory.ENGINE_API, 'ensure_2d_canvas: 创建 Camera 子节点失败', e);
        }

        if (!cameraUuid) {
          return {
            success: true, canvasUuid, canvasName, created: true,
            warning: '已创建 Canvas 但 Camera 子节点创建失败，可能需要手动添加',
            layer: UI_2D_LAYER,
          };
        }

        // 直接从扩展主进程添加 Camera 组件
        await editorMsg('scene', 'create-component', { uuid: cameraUuid, component: 'cc.Camera' });
        await op('set_layer', { uuid: cameraUuid, layer: UI_2D_LAYER });

        try {
          await op('set_camera_property', {
            uuid: cameraUuid,
            projection: 0, clearFlags: 6, priority: 1,
            visibility: UI_2D_LAYER, orthoHeight: designHeight / 2,
          });
        } catch (e) {
          logIgnored(ErrorCategory.ENGINE_API, 'ensure_2d_canvas: 配置 Camera 属性失败', e);
        }

        return {
          success: true, canvasUuid, canvasName, created: true,
          cameraUuid,
          designResolution: { width: designWidth, height: designHeight },
          camera: { projection: 'ortho', clearFlags: 6, priority: 1, visibility: UI_2D_LAYER, orthoHeight: designHeight / 2 },
          layer: UI_2D_LAYER,
          hint: '在此 Canvas 下创建的子节点需要设置 layer=33554432 (UI_2D) 才能被 Canvas Camera 渲染',
        };
      } finally {
        await endSceneRecording(editorMsg, recordId);
      }
    }

    default:
      return { error: `未知的操作 action: ${action}` };
  }
}

type QueryFallbackCtx = {
  sceneMethod: BridgeToolContext['sceneMethod'];
  text: BridgeToolContext['text'];
};

async function fallbackSceneQuery(action: string, p: Record<string, unknown>, ctx: QueryFallbackCtx): Promise<unknown> {
  const { sceneMethod } = ctx;
  const query = (a: string, extra: Record<string, unknown> = {}) =>
    sceneMethod('dispatchQuery', [{ action: a, ...extra }]) as Promise<Record<string, unknown>>;

  switch (action) {
    case 'measure_distance': {
      const uuidA = String(p.uuidA ?? p.uuid ?? '');
      const uuidB = String(p.uuidB ?? '');
      if (!uuidA || !uuidB) return { error: '需要 uuidA 和 uuidB 两个参数' };
      const wpA = await query('get_world_position', { uuid: uuidA }) as { x?: number; y?: number; z?: number };
      const wpB = await query('get_world_position', { uuid: uuidB }) as { x?: number; y?: number; z?: number };
      if (!wpA || wpA.x === undefined) return { error: `无法获取节点 A 的世界坐标: ${uuidA}` };
      if (!wpB || wpB.x === undefined) return { error: `无法获取节点 B 的世界坐标: ${uuidB}` };
      const dx = (wpB.x ?? 0) - (wpA.x ?? 0), dy = (wpB.y ?? 0) - (wpA.y ?? 0), dz = (wpB.z ?? 0) - (wpA.z ?? 0);
      return {
        uuidA, uuidB, positionA: wpA, positionB: wpB,
        delta: { x: dx, y: dy, z: dz },
        distance3D: Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz) * 100) / 100,
        distance2D: Math.round(Math.sqrt(dx * dx + dy * dy) * 100) / 100,
        alignedX: Math.abs(dx) < 1, alignedY: Math.abs(dy) < 1,
      };
    }

    case 'scene_snapshot': {
      const list = await query('list') as { nodes?: Array<Record<string, unknown>> };
      if (!list.nodes?.length) return { error: '场景为空' };
      const nodes: Array<Record<string, unknown>> = [];
      for (const n of list.nodes.slice(0, 500)) {
        const detail = await query('node_detail', { uuid: n.uuid }) as Record<string, unknown>;
        nodes.push({ ...n, ...(detail.error ? {} : detail) });
      }
      return { sceneName: 'snapshot', timestamp: Date.now(), nodeCount: nodes.length, nodes };
    }

    case 'scene_diff': {
      const snapshotA = p.snapshotA as { nodes?: Array<Record<string, unknown>> } | undefined;
      const snapshotB = p.snapshotB as { nodes?: Array<Record<string, unknown>> } | undefined;
      if (!snapshotA?.nodes || !snapshotB?.nodes) return { error: '需要 snapshotA 和 snapshotB' };
      const mapA = new Map(snapshotA.nodes.map(n => [String(n.uuid), n]));
      const mapB = new Map(snapshotB.nodes.map(n => [String(n.uuid), n]));
      const added: string[] = [], removed: string[] = [], modified: Array<Record<string, unknown>> = [];
      for (const [uuid, nodeB] of mapB) {
        if (!mapA.has(uuid)) { added.push(`${nodeB.name} (${uuid})`); continue; }
        const nodeA = mapA.get(uuid)!;
        const changes: string[] = [];
        if (nodeA.name !== nodeB.name) changes.push(`name: ${nodeA.name} -> ${nodeB.name}`);
        if (nodeA.active !== nodeB.active) changes.push(`active changed`);
        if (changes.length) modified.push({ uuid, name: nodeB.name, changes });
      }
      for (const [uuid, nodeA] of mapA) {
        if (!mapB.has(uuid)) removed.push(`${nodeA.name} (${uuid})`);
      }
      return { addedCount: added.length, removedCount: removed.length, modifiedCount: modified.length, added, removed, modified };
    }

    case 'performance_audit': {
      const stats = await query('stats') as { nodeCount?: number; activeCount?: number; sceneName?: string };
      const list = await query('list') as { nodes?: Array<Record<string, unknown>> };
      const issues: Array<Record<string, unknown>> = [];
      const totalNodes = stats.nodeCount ?? 0;
      if (totalNodes > 5000) issues.push({ severity: 'error', type: 'too_many_nodes', message: `场景共 ${totalNodes} 个节点` });
      else if (totalNodes > 2000) issues.push({ severity: 'warning', type: 'many_nodes', message: `场景共 ${totalNodes} 个节点` });
      let maxDepth = 0;
      for (const n of (list.nodes ?? [])) {
        const depth = Number(n.depth ?? 0);
        if (depth > maxDepth) maxDepth = depth;
        if (Number(n.childCount ?? 0) > 100) issues.push({ severity: 'warning', type: 'too_many_children', message: `节点 "${n.name}" 有 ${n.childCount} 个子节点`, uuid: n.uuid });
      }
      return {
        sceneName: stats.sceneName, totalNodes, maxDepth,
        issueCount: issues.length, issues,
        score: issues.filter(i => i.severity === 'error').length === 0 ? (issues.filter(i => i.severity === 'warning').length === 0 ? 'excellent' : 'good') : 'needs_attention',
      };
    }

    case 'export_scene_json': {
      const tree = await query('tree') as Record<string, unknown>;
      if (!tree || tree.error) return { error: `无法获取场景树: ${tree?.error || ''}` };
      return { sceneName: tree.name, nodeCount: 1, truncated: false, scene: tree };
    }

    case 'deep_validate_scene': {
      const issues: Array<Record<string, unknown>> = [];
      const suggestions: string[] = [];
      const stats = await query('stats') as Record<string, unknown>;
      const list = await query('list') as { nodes?: Array<Record<string, unknown>> };
      const totalNodes = Number(stats?.nodeCount ?? 0);

      if (totalNodes > 5000) {
        issues.push({ severity: 'error', type: 'too_many_nodes', message: `场景共 ${totalNodes} 个节点，严重影响性能` });
        suggestions.push('考虑拆分场景或使用预制体池管理');
      } else if (totalNodes > 2000) {
        issues.push({ severity: 'warning', type: 'many_nodes', message: `场景共 ${totalNodes} 个节点` });
        suggestions.push('关注节点数增长趋势，及时优化');
      }

      let maxDepth = 0;
      const emptyNodes: string[] = [];
      const inactiveNodes: string[] = [];
      const deepNodes: Array<Record<string, unknown>> = [];

      for (const n of (list.nodes ?? [])) {
        const depth = Number(n.depth ?? 0);
        if (depth > maxDepth) maxDepth = depth;
        if (depth > 15) {
          deepNodes.push({ name: n.name, uuid: n.uuid, depth });
        }
        if (Number(n.childCount ?? 0) === 0 && !n.path?.toString().includes('Canvas')) {
          const detail = await query('node_detail', { uuid: n.uuid }) as Record<string, unknown>;
          const comps = Array.isArray(detail.components) ? detail.components : [];
          if (comps.length <= 1) {
            emptyNodes.push(`${n.name} (${n.uuid})`);
          }
        }
        if (n.active === false) {
          inactiveNodes.push(`${n.name} (${n.uuid})`);
        }
        if (Number(n.childCount ?? 0) > 100) {
          issues.push({
            severity: 'warning', type: 'too_many_children',
            message: `节点 "${n.name}" 有 ${n.childCount} 个子节点`,
            uuid: n.uuid,
          });
          suggestions.push(`考虑对 "${n.name}" 使用虚拟列表或分页加载`);
        }
      }

      if (maxDepth > 15) {
        issues.push({ severity: 'warning', type: 'deep_hierarchy', message: `最大层级深度 ${maxDepth}`, deepNodes: deepNodes.slice(0, 5) });
        suggestions.push('扁平化层级结构，减少嵌套深度');
      }
      if (emptyNodes.length > 10) {
        issues.push({ severity: 'info', type: 'empty_nodes', message: `发现 ${emptyNodes.length} 个疑似空节点（无子节点且仅有 Transform）`, nodes: emptyNodes.slice(0, 10) });
        suggestions.push('审查空节点，移除不需要的节点以减少开销');
      }
      if (inactiveNodes.length > 20) {
        issues.push({ severity: 'info', type: 'many_inactive', message: `${inactiveNodes.length} 个非活跃节点`, count: inactiveNodes.length });
        suggestions.push('非活跃节点仍占用内存，考虑使用对象池或延迟加载');
      }

      const score = issues.filter(i => i.severity === 'error').length > 0 ? 'critical'
        : issues.filter(i => i.severity === 'warning').length > 3 ? 'needs_attention'
          : issues.filter(i => i.severity === 'warning').length > 0 ? 'good'
            : 'excellent';

      return {
        sceneName: stats?.sceneName, totalNodes, maxDepth,
        issueCount: issues.length, issues,
        suggestionCount: suggestions.length, suggestions,
        score, validationTimestamp: Date.now(),
      };
    }

    default:
      return { error: `未知的查询 action: ${action}` };
  }
}
