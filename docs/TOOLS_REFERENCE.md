# Aura for Cocos Creator — Tools Reference

This document is the complete API reference for all MCP tools exposed by Aura.

- **Base URL**: `http://127.0.0.1:<port>/mcp` (HTTP transport)
- **Authentication**: `X-MCP-Token: <token>` header required on every request
- **Protocol**: JSON-RPC 2.0 (`tools/call`)

---

## AI Rules (Enforced on all core tools)

All Funnel tools enforce these mandatory behavioral rules:

1. **Query before modify** — ALWAYS use `scene_query` to fetch current state before calling `scene_operation`. Never assume a node exists.
2. **Use UUIDs** — ALWAYS prefer UUID over name for referencing nodes and assets. Get UUIDs via `scene_query` first.
3. **Check errors** — ALWAYS verify the `success` or `error` field in return values. Retry or report on failure.
4. **Confirm destructive ops** — ALWAYS set `confirmDangerous=true` for `destroy_node` / `clear_children`. These are BLOCKED without it.
5. **Batch when possible** — Use `action=batch` with `$N.uuid` references instead of individual calls for multi-step operations.

---

## Table of Contents

| Tool | Type | CE Actions | Pro Actions | Summary |
|------|------|-----------|------------|--------|
| [bridge_status](#bridge_status) | Info | — | — | Connection health check |
| [scene_query](#scene_query) | Read-only | 43 | 43 | Inspect scene graph and nodes |
| [scene_operation](#scene_operation) | Write | 31 | 68 | Modify scene graph |
| [asset_operation](#asset_operation) | Write | 17 | 32 | Manage project assets |
| [editor_action](#editor_action) | Control | 23 | 45 | Control the editor environment |
| [engine_action](#engine_action) | Runtime | — | 8 | Engine-level runtime controls (Pro only) |
| [animation_tool](#animation_tool) | Animation | 10 | 10 | Animation clips and playback control |
| [physics_tool](#physics_tool) | Physics | 10 | 12 | Colliders, rigidbodies, joints, world config, raycast |
| [preferences](#preferences) | Settings | 7 | 7 | Read/write editor preferences |
| [broadcast](#broadcast) | Events | 5 | 5 | Poll/manage editor event messages |
| [tool_management](#tool_management) | Admin | 4 | 4 | List/enable/disable tools dynamically |
| [reference_image](#reference_image) | Visual | — | 7 | Scene reference image overlay (Pro only) |
| [execute_script](#execute_script) | Escape hatch | ∞ | ∞ | Run arbitrary scene-script methods |
| [register_custom_macro](#register_custom_macro) | Extension | — | — | Register a dynamic macro tool |
| [create_prefab_atomic](#create_prefab_atomic) | Macro | — | — | Create a prefab in one atomic call |
| [import_and_apply_texture](#import_and_apply_texture) | Macro | — | — | Import image and apply to Sprite |
| [setup_ui_layout](#setup_ui_layout) | Macro | — | — | Scaffold a ScrollView UI hierarchy |
| [create_tween_animation_atomic](#create_tween_animation_atomic) | Macro | — | — | Create animation clip with keyframes |
| [auto_fit_physics_collider](#auto_fit_physics_collider) | Macro | — | — | Auto-fit 2D physics collider to sprite |

**Community Edition: 17 tools, ~158 actions · Pro Edition: 22 tools, 270+ actions**

---

## bridge_status

Check connection health. **Always call this first** to verify the bridge is alive before issuing write operations.

**Parameters**: none

**Returns**

```json
{
  "connected": true,
  "port": 7779,
  "uptime": 12345,
  "editorVersion": "3.8.0",
  "projectName": "MyGame",
  "projectPath": "D:/MyGame",
  "toolCount": 16,
  "totalActions": 160
}
```

---

## scene_query

Read-only inspection of the Cocos Creator scene graph. **Never modifies anything.**

### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | enum | ✅ | The query action to perform |
| `uuid` | string | — | Node UUID (required by most node-specific actions) |
| `uuidA` | string | — | First node UUID (for `measure_distance`) |
| `uuidB` | string | — | Second node UUID (for `measure_distance`) |
| `path` | string | — | Node path (e.g. `Canvas/Background/Icon`) |
| `name` | string | — | Node name for name-based searches |
| `component` | string | — | Component class name (e.g. `Sprite`, `Label`) |
| `property` | string | — | Component property name |
| `maxNodes` | number | — | Max nodes for `scene_snapshot` (default: 500) |
| `snapshotA` | object | — | First snapshot for `scene_diff` |
| `snapshotB` | object | — | Second snapshot for `scene_diff` |

### Actions (43)

| Action | Required Params | Description |
|--------|----------------|-------------|
| `tree` | — | Full scene node tree with hierarchy |
| `list` | — | Flat list of all nodes (uuid, name, active) |
| `stats` | — | Scene statistics (node count, component count) |
| `node_detail` | `uuid` | Full node details including all components |
| `find_by_path` | `path` | Find node by scene path string |
| `find_nodes_by_name` | `name` | Find all nodes matching a name |
| `find_nodes_by_component` | `component` | Find all nodes that have a given component |
| `get_components` | `uuid` | List all components on a node |
| `get_component_property` | `uuid`, `component`, `property` | Get a specific component property value |
| `get_node_components_properties` | `uuid` | Get all properties of all components on a node |
| `get_parent` | `uuid` | Get parent node info |
| `get_children` | `uuid` | Get direct children of a node |
| `get_sibling` | `uuid` | Get all siblings of a node |
| `get_world_position` | `uuid` | Get world-space position {x, y, z} |
| `get_world_rotation` | `uuid` | Get world-space rotation (Euler angles) |
| `get_world_scale` | `uuid` | Get world-space scale |
| `get_active_in_hierarchy` | `uuid` | Check if node is active in hierarchy |
| `get_camera_info` | — | Get main camera info |
| `get_canvas_info` | — | Get Canvas node info and design resolution |
| `get_scene_globals` | — | Get scene-level global settings |
| `get_current_selection` | — | Get currently selected node(s) in the editor |
| `get_active_scene_focus` | — | Selection-first context: returns selection if any, else scene root |
| `list_all_scenes` | — | List all scenes in the project |
| `validate_scene` | — | Run validation checks on the current scene |
| `detect_2d_3d` | — | Detect whether scene is 2D, 3D, or mixed |
| `list_available_components` | — | List all available component types (including custom) |
| `measure_distance` | `uuidA`, `uuidB` | Measure 2D/3D distance between two nodes |
| `scene_snapshot` | `maxNodes` (optional) | Capture full scene state for later diffing |
| `scene_diff` | `snapshotA`, `snapshotB` | Compare two snapshots to find changes |
| `performance_audit` | — | Analyze scene for performance issues |
| `export_scene_json` | — | Export full scene tree as JSON |
| `deep_validate_scene` | — | Deep validation with missing asset detection and fix suggestions |
| `get_node_bounds` | `uuid` | Get bounding box (2D: UITransform rect, 3D: MeshRenderer AABB) |
| `find_nodes_by_layer` | `layer` | Find all nodes matching a layer bitmask |
| `get_animation_state` | `uuid` | Get Animation component state and clips |
| `get_collider_info` | `uuid` | Get all collider components with size/offset/type |
| `get_material_info` | `uuid` | Get material info on a node's renderer |
| `get_light_info` | — | Get all light components in scene |
| `get_scene_environment` | — | Get structured scene environment settings |
| `screen_to_world` | `screenX`, `screenY` | Convert screen coordinates to world position |
| `world_to_screen` | `worldX`, `worldY`, `worldZ` | Convert world position to screen coordinates |
| `check_script_ready` | `script` | Check if a script class is compiled and registered |
| `get_script_properties` | `script` | Get all @property declarations of a script class |

### Example — Get node tree

```json
{ "tool": "scene_query", "arguments": { "action": "tree" } }
```

### Example — Measure distance between two nodes

```json
{
  "tool": "scene_query",
  "arguments": { "action": "measure_distance", "uuidA": "abc-123", "uuidB": "def-456" }
}
```

---

## scene_operation

Modify the Cocos Creator scene graph (write operations).

> ⚠️ **Dangerous actions** (`destroy_node`, `clear_children`) require `"confirmDangerous": true`.

### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | enum | ✅ | The operation to perform |
| `uuid` | string | Depends | Target node UUID |
| `parentUuid` | string | — | Parent node UUID (for `reparent`, `create_node`) |
| `name` | string | — | Node name (for `create_node`, `set_name`) |
| `siblingIndex` | number | — | Insertion position for `create_node` (0=first, -1=append) |
| `includeChildren` | boolean | — | Include children when duplicating (default: true) |
| `x`, `y`, `z` | number | — | Position/rotation/scale components |
| `active` | boolean | — | Active state (for `set_active`) |
| `component` | string | — | Component class name — **auto-normalized** |
| `property` | string | — | Component property name |
| `value` | any | — | Value to set |
| `index` | number | — | Sibling index (for `set_sibling_index`) |
| `layer` | number | — | Layer bitmask (for `set_layer`) |
| `methodName` | string | — | Method to invoke (for `call_component_method`) |
| `args` | array | — | Method arguments |
| `savePath` | string | — | `db://` path for `create_prefab` |
| `prefabUrl` | string | — | Prefab URL for `instantiate_prefab`, `validate_prefab` |
| `confirmDangerous` | boolean | — | Must be `true` for destructive actions |
| `operations` | array | — | Operation array for `action=batch` |
| `widgetType` | enum | — | UI widget type for `create_ui_widget` |
| `text` | string | — | Display text for UI widgets |

### Actions — Community Edition (31)
| Action | Key Params | Notes |
|--------|-----------|-------|
| `create_node` | `name`, `parentUuid`, `siblingIndex` | Creates empty node. HOW TO USE: 1) `scene_query` action=tree → get parentUuid 2) call create_node |
| `destroy_node` | `uuid` | ⚠️ Requires `confirmDangerous: true` |
| `reparent` | `uuid`, `parentUuid` | Move node to a different parent |
| `set_position` | `uuid`, `x`, `y`, `z` | Set local position |
| `set_rotation` | `uuid`, `x`, `y`, `z` | Set local Euler rotation (degrees) |
| `set_scale` | `uuid`, `x`, `y`, `z` | Set local scale (1.0 = 100%) |
| `set_world_position` | `uuid`, `x`, `y`, `z` | Set world position |
| `set_world_rotation` | `uuid`, `x`, `y`, `z` | Set world Euler rotation |
| `set_world_scale` | `uuid`, `x`, `y`, `z` | Set world scale |
| `set_name` | `uuid`, `name` | Rename a node |
| `set_active` | `uuid`, `active` | Toggle node active state |
| `add_component` | `uuid`, `component` | Add component (name auto-normalized). HOW TO USE: 1) find UUID first 2) verify exists 3) add |
| `remove_component` | `uuid`, `component` | Remove a component |
| `set_property` | `uuid`, `component`, `property`, `value` | Set a component property value |
| `reset_property` | `uuid`, `component`, `property` | Reset property to default value |
| `call_component_method` | `uuid`, `component`, `methodName`, `args` | Call a method on a component |
| `duplicate_node` | `uuid`, `includeChildren` | Clone node. `includeChildren=false` copies node only |
| `move_node_up` | `uuid` | Move up in sibling order |
| `move_node_down` | `uuid` | Move down in sibling order |
| `set_sibling_index` | `uuid`, `index` | Set absolute sibling index (0-based) |
| `reset_transform` | `uuid` | Reset position/rotation/scale to defaults |
| `ensure_2d_canvas` | — | Ensure Canvas node exists for 2D UI |
| `set_anchor_point` | `uuid`, `anchorX`, `anchorY` | Set UITransform anchor point |
| `set_content_size` | `uuid`, `width`, `height` | Set UITransform content size |
| `create_prefab` | `uuid`, `savePath` | Save node as `.prefab` asset |
| `instantiate_prefab` | `prefabUrl`, `parentUuid` | Instantiate prefab into scene |
| `enter_prefab_edit` | `uuid` | Enter prefab editing mode |
| `exit_prefab_edit` | — | Exit prefab editing mode |
| `apply_prefab` | `uuid` | Apply prefab instance changes |
| `revert_prefab` | `uuid` | Revert prefab instance to original |
| `validate_prefab` | `prefabUrl` | Check prefab integrity |

### Actions — Pro Edition Additional (+37)
| `lock_node` | `uuid` | Lock node in editor hierarchy |
| `unlock_node` | `uuid` | Unlock node |
| `hide_node` | `uuid` | Hide node in editor view |
| `unhide_node` | `uuid` | Unhide node |
| `set_layer` | `uuid`, `layer` | Set node render layer |
| `clear_children` | `uuid` | ⚠️ Requires `confirmDangerous: true` |
| `reset_node_properties` | `uuid` | Reset all node properties to defaults |
| `batch` | `operations` | Execute multiple operations atomically with `$N.uuid` cross-references |
| `batch_set_property` | `uuids`, `component`, `property`, `value` | Set the same property on multiple nodes |
| `group_nodes` | `uuids`, `groupName` | Group selected nodes under a new parent |
| `align_nodes` | `uuids`, `alignment` | Align/distribute multiple nodes (left/right/center_h/top/bottom/center_v/distribute_h/distribute_v) |
| `clipboard_copy` | `uuid` | Copy node to clipboard |
| `clipboard_paste` | `parentUuid` | Paste from clipboard |
| `create_ui_widget` | `widgetType`, `parentUuid` | Create complete UI widget (button/label/sprite/toggle/slider/progressbar/editbox) |
| `setup_particle` | `parentUuid`, `preset` | Create particle system (fire/smoke/rain/snow/sparkle/explosion) |
| `audio_setup` | `uuid`, `volume`, `loop` | Add/configure AudioSource component |
| `setup_physics_world` | `gravity`, `mode` | Configure 2D/3D physics world |
| `create_skeleton_node` | `skeletonType`, `parentUuid` | Create Spine/DragonBones skeleton node |
| `generate_tilemap` | `parentUuid` | Create TiledMap node |
| `create_primitive` | `type`, `parentUuid`, `color` | Create 3D primitive (box/cube) |
| `create_camera` | `parentUuid` | Create a Camera node |
| `set_camera_property` | `uuid`, `property`, `value` | Set camera component property |
| `camera_screenshot` | `uuid` | Capture camera viewport screenshot |
| `set_material_property` | `uuid`, `property`, `value` | Set material property on renderer |
| `assign_material` | `uuid`, `materialUrl` | Assign a material asset to renderer |
| `clone_material` | `uuid` | Clone material for independent editing |
| `swap_technique` | `uuid`, `technique` | Switch material rendering technique |
| `sprite_grayscale` | `uuid`, `enabled` | Toggle sprite grayscale effect |
| `create_light` | `lightType`, `parentUuid` | Create a light node (directional/point/spot) |
| `set_light_property` | `uuid`, `property`, `value` | Set light component property |
| `set_scene_environment` | `property`, `value` | Set scene-level environment settings |
| `bind_event` | `uuid`, `event`, `handler` | Bind event listener to node |
| `unbind_event` | `uuid`, `event` | Remove event listener from node |
| `list_events` | `uuid` | List all bound events on a node |
| `attach_script` | `uuid`, `script` | Attach a script component to node |
| `detach_script` | `uuid`, `script` | Remove a script component from node |
| `set_component_properties` | `uuid`, `component`, `properties` | Set multiple component properties at once |

### Component Auto-Normalization

| Input | Normalized |
|-------|-----------|
| `sprite` | `Sprite` |
| `cc.Sprite` | `Sprite` |
| `scrollview` | `ScrollView` |
| `uitransform` | `UITransform` |
| `uiopacity` | `UIOpacity` |
| `label` | `Label` |
| `button` | `Button` |
| `layout` | `Layout` |
| `mask` | `Mask` |
| `richtext` | `RichText` |
| `toggle` | `Toggle` |
| `progressbar` | `ProgressBar` |
| `camera` | `Camera` |
| `canvas` | `Canvas` |

### Example — Batch: Create node + add component

```json
{
  "tool": "scene_operation",
  "arguments": {
    "action": "batch",
    "operations": [
      { "action": "create_node", "name": "Hero", "parentUuid": "canvas-uuid" },
      { "action": "add_component", "uuid": "$0.uuid", "component": "Sprite" },
      { "action": "set_property", "uuid": "$0.uuid", "component": "UITransform", "property": "contentSize", "value": { "width": 128, "height": 128 } }
    ]
  }
}
```

---

## asset_operation

Manage Cocos Creator project assets via AssetDB. All assets identified by `db://` URLs.

### Actions — Community Edition (17)

| Action | Key Params | Description |
|--------|-----------|-------------|
| `list` | `pattern` | List assets matching glob pattern |
| `info` | `url` | Get asset metadata (type, uuid, path, importer) |
| `create` | `url`, `content` | Create new asset file |
| `save` | `url`, `content` | Overwrite existing asset content |
| `delete` | `url` | Delete an asset permanently |
| `move` | `sourceUrl`, `targetUrl` | Move/rename asset |
| `copy` | `sourceUrl`, `targetUrl` | Duplicate asset |
| `rename` | `url`, `newName` | Rename asset file (same directory) |
| `import` | `sourcePath`, `targetUrl` | Import external file into project |
| `open` | `url` | Open asset in default editor |
| `refresh` | `url` (optional) | Refresh asset database |
| `uuid_to_url` | `uuid` | Convert asset UUID to db:// URL |
| `url_to_uuid` | `url` | Convert db:// URL to UUID |
| `create_folder` | `url` | Create folder in asset database |
| `get_meta` | `url` | Get full .meta file content as JSON |
| `set_meta_property` | `url`, `property`, `value` | Modify a .meta property |
| `search_by_type` | `type`, `pattern` | Find assets by type (e.g. `cc.ImageAsset`, `cc.Prefab`) |

### Actions — Pro Edition Additional (+15)

| Action | Key Params | Description |
|--------|-----------|-------------|
| `reimport` | `url` | Force reimport an asset |
| `show_in_explorer` | `url` | Reveal asset in OS file explorer |
| `get_dependencies` | `url` | Get assets this asset depends on |
| `get_dependents` | `url` | Get assets that depend on this asset |
| `clean_unused` | — | List potentially unused assets |
| `pack_atlas` | `url` | Trigger atlas reimport/packing |
| `get_animation_clips` | `pattern` | List all .anim clips |
| `get_materials` | `pattern` | List all material files |
| `validate_asset` | `url` | Check asset integrity |
| `export_asset_manifest` | `pattern` | Export full asset inventory |
| `create_material` | `url`, `effectName`, `uniforms` | Create a material asset |
| `generate_script` | `url`, `className`, `scriptProperties`, `lifecycle`, `scriptBody` | Generate TypeScript component script |
| `batch_import` | `paths`, `targetUrl` | Batch import multiple external files |
| `get_asset_size` | `url` | Get asset file size and dependencies size |
| `slice_sprite` | `url`, `sliceConfig` | Slice sprite into 9-patch or grid |

### Path Auto-Normalization

`db://assets/Prefabs/Hero.prefab` → `db://assets/prefabs/Hero.prefab`

---

## editor_action

Control the Cocos Creator editor environment.

### Actions — Community Edition (23)

| Action | Key Params | Description |
|--------|-----------|-------------|
| `save_scene` | — | Save current scene |
| `open_scene` | `uuid` or `url` | Open a scene |
| `new_scene` | — | Create new empty scene |
| `undo` | — | Undo last operation |
| `redo` | — | Redo last undone operation |
| `get_selection` | — | Get selected node UUIDs |
| `select` | `uuids` | Select specific nodes |
| `clear_selection` | — | Deselect all |
| `project_info` | — | Get project name, path, engine version |
| `build` | `platform` | Start build (web-mobile, android, ios, etc.) |
| `build_query` | — | Query current build status |
| `preview` | — | Open browser preview |
| `preview_refresh` | — | Refresh preview |
| `play_in_editor` | — | Enter play mode |
| `pause_in_editor` | — | Pause play mode |
| `stop_in_editor` | — | Stop play mode |
| `step_in_editor` | — | Step one frame |
| `focus_node` | `uuid` | Focus camera on a node |
| `log` | `text` | Write info to console |
| `warn` | `text` | Write warning to console |
| `error` | `text` | Write error to console |
| `clear_console` | — | Clear console output |
| `show_notification` | `text`, `title` | Show editor notification |

### Actions — Pro Edition Additional (+22)

| Action | Key Params | Description |
|--------|-----------|-------------|
| `build_with_config` | `config` | Build with custom config |
| `build_status` | — | Query build status |
| `preview_status` | — | Query preview status |
| `send_message` | `module`, `message`, `args` | Send Editor IPC message |
| `open_panel` | `panel` | Open editor panel (inspector, hierarchy, console, assets) |
| `close_panel` | `panel` | Close editor panel |
| `query_panels` | — | List all available panels |
| `get_packages` | — | List all installed packages/plugins |
| `reload_plugin` | `module` | Reload a specific plugin |
| `inspect_asset` | `uuid` or `url` | Select asset in Inspector |
| `open_preferences` | — | Open preferences panel |
| `open_project_settings` | — | Open project settings |
| `move_scene_camera` | `uuid` | Move editor camera to node |
| `take_scene_screenshot` | — | Capture scene viewport |
| `set_transform_tool` | `toolType` | Set gizmo mode (position/rotation/scale/rect) |
| `set_coordinate` | `coordinate` | Set coord system (local/world) |
| `toggle_grid` | `visible` | Show/hide editor grid |
| `toggle_snap` | `enabled` | Enable/disable snap mode |
| `get_console_logs` | `logType`, `logCount` | Get console logs (filter: all/log/warn/error/info) |
| `search_logs` | `keyword`, `logType`, `logCount` | Search logs by text pattern |
| `set_view_mode` | `mode` | Set editor viewport mode (2D/3D) |
| `zoom_to_fit` | — | Zoom viewport to fit scene |

---

## engine_action

Engine-level runtime controls. **Pro Edition only.**

### Actions (8)

| Action | Key Params | Description |
|--------|-----------|-------------|
| `set_frame_rate` | `fps` | Set engine frame rate (1–240) |
| `pause_engine` | — | Pause engine main loop |
| `resume_engine` | — | Resume engine main loop |
| `get_system_info` | — | Get OS, browser, device, GPU info |
| `dump_texture_cache` | — | Dump all cached textures for memory profiling |
| `get_render_stats` | — | Get rendering statistics (draw calls, tri count) |
| `set_physics_debug` | `enabled` | Toggle physics debug rendering |
| `get_engine_config` | — | Get current engine configuration |

---

## execute_script

Execute an arbitrary scene-script method. **Escape hatch** for operations not covered by standard tools.

### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `method` | string | ✅ | Scene-script method name |
| `args` | array | — | Arguments to pass |

### Available Methods

`getSceneTree`, `getAllNodesList`, `getSceneStats`, `getNodeDetail`, `findNodeByPath`, `getNodeComponents`, `setNodePosition`, `setNodeRotation`, `setNodeScale`, `setNodeName`, `setNodeActive`, `createChildNode`, `destroyNode`, `reparentNode`, `addComponent`, `removeComponent`, `setComponentProperty`, `dispatchQuery`, `dispatchOperation`, `dispatchEngineAction`, `createAnimationClip`, `autoFitCollider`, `setReferenceImage`, `listMethods`

---

## register_custom_macro

Register a dynamic macro tool at runtime. The new tool appears in the MCP tool list immediately.

### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Tool name (alphanumeric + underscore only) |
| `description` | string | ✅ | Human-readable tool description |
| `sceneMethodName` | string | ✅ | Scene-script method to invoke |

---

## preferences

Read/write Cocos Creator editor preferences.

### Actions (7)

| Action | Key Params | Description |
|--------|-----------|-------------|
| `get` | `key`, `scope` (optional) | Get a preference value. Scope: global (default), project, default |
| `set` | `key`, `value`, `scope` (optional) | Set a preference value |
| `list` | — | List all available preferences with scope info |
| `get_global` | `key` | Shortcut: read from global scope |
| `set_global` | `key`, `value` | Shortcut: write to global scope |
| `get_project` | `key` | Shortcut: read from project scope |
| `set_project` | `key`, `value` | Shortcut: write to project scope |

### Common Preference Keys

`general.language`, `general.theme`, `preview.port`, `builder.compressTexture`

---

## broadcast

Poll and manage editor broadcast event messages.

### Actions (5)

| Action | Key Params | Description |
|--------|-----------|-------------|
| `poll` | `since` (optional, timestamp ms) | Poll new events since timestamp |
| `history` | `limit` (optional, default 20) | Get recent N event history |
| `clear` | — | Clear broadcast buffer |
| `send` | `channel`, `data` (optional) | Broadcast a custom message to all listeners |
| `send_ipc` | `module`, `message`, `args` (optional) | Send a raw Editor IPC broadcast message |

Event types: `scene:ready`, `scene:saved`, `asset:add`, `asset:delete`, `asset:change`, `selection:select`

---

## tool_management

Manage MCP tool availability. Enable/disable tools to reduce token consumption and AI confusion.

### Actions (4)

| Action | Key Params | Description |
|--------|-----------|-------------|
| `list_all` | — | List all registered tools with enabled/disabled status |
| `enable` | `toolName` | Enable a previously disabled tool |
| `disable` | `toolName` | Disable a tool (won't appear in tool listings) |
| `get_stats` | — | Get overall tool statistics (total tools, total actions, enabled/disabled counts) |

> **Note**: `tool_management` itself cannot be disabled.

---

## animation_tool

Create, play, and control animation clips on nodes with Animation components.

### Actions (10)

| Action | Key Params | Description |
|--------|-----------|-------------|
| `create_clip` | `uuid`, `clipName`, `tracks` | Create animation clip with keyframe tracks |
| `play` | `uuid`, `clipName` | Play an animation clip |
| `pause` | `uuid` | Pause current animation |
| `resume` | `uuid` | Resume paused animation |
| `stop` | `uuid` | Stop animation and reset to default pose |
| `get_state` | `uuid` | Get current animation playback state (playing, paused, speed, clip) |
| `list_clips` | `uuid` | List all animation clips on a node |
| `set_current_time` | `uuid`, `time` | Seek to specific time in current clip |
| `set_speed` | `uuid`, `speed` | Set playback speed multiplier |
| `crossfade` | `uuid`, `clipName`, `duration` | Crossfade to another clip over duration |

---

## physics_tool

Create and configure 2D/3D physics components (colliders, rigidbodies, joints) and world settings.

### Actions — Community Edition (10)

| Action | Key Params | Description |
|--------|-----------|-------------|
| `get_collider_info` | `uuid` | Get all collider and rigidbody details on a node |
| `add_collider` | `uuid`, `colliderType` | Add a physics collider component |
| `set_collider_size` | `uuid`, `width`, `height` | Set collider dimensions |
| `add_rigidbody` | `uuid`, `bodyType` | Add a rigidbody component (static/dynamic/kinematic) |
| `set_rigidbody_property` | `uuid`, `property`, `value` | Set rigidbody properties (mass, damping, etc.) |
| `set_physics_material` | `uuid`, `friction`, `restitution`, `density` | Set physics material on collider |
| `set_collision_group` | `uuid`, `group` | Set collision group/layer |
| `get_physics_world` | — | Get physics world configuration (gravity, timestep) |
| `set_physics_world` | `gravity`, `allowSleep`, `fixedTimeStep` | Configure physics world |
| `add_joint` | `uuid`, `jointType`, `connectedBody` | Add a physics joint between two nodes |

### Actions — Pro Edition Additional (+2)

| Action | Key Params | Description |
|--------|-----------|-------------|
| `remove_collider` | `uuid`, `colliderType` | Remove a specific collider component |
| `raycast` | `origin`, `direction` | Perform physics raycast and return hit results |

---

## reference_image

Set or manage reference image overlays in the scene view for design comparison. **Pro Edition only.**

### Actions (7)

| Action | Key Params | Description |
|--------|-----------|-------------|
| `set` | `url`, `opacity` (0–1) | Set reference image from asset URL |
| `clear` | — | Clear reference image overlay |
| `set_opacity` | `opacity` (0–1) | Adjust overlay opacity |
| `set_position` | `x`, `y` | Set overlay position offset |
| `set_scale` | `scale` | Set overlay scale |
| `toggle_visibility` | `visible` | Show/hide overlay without clearing |
| `get_status` | — | Get current reference image state |

---

## create_prefab_atomic

Atomically create a Cocos Creator prefab in a single tool call with **auto-rollback on failure**.

### Pipeline

1. Ensure target directory exists
2. Create temporary root node (and optional children)
3. Add components and set properties
4. Save as `.prefab` asset
5. Refresh the AssetDB
6. Clean up temporary node from scene
7. **Auto-rollback** if any stage fails

### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prefabPath` | string | ✅ | `db://` path for the prefab (e.g. `db://assets/prefabs/Hero.prefab`) |
| `nodeName` | string | — | Root node name (default: filename) |
| `components` | array | — | Components: `[{ "type": "Sprite", "properties": {...} }]` |
| `children` | array | — | Child nodes: `[{ "name": "Icon", "components": [...] }]` |
| `position` | object | — | Initial position `{ x, y, z }` |
| `cleanupSourceNode` | boolean | — | Delete temp node after saving (default: `true`) |

---

## import_and_apply_texture

Import an external image and apply it to a Sprite — all in one atomic call. **Selection-aware**: omit `nodeUuid` to use current editor selection.

### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sourcePath` | string | ✅ | OS file path to image (png, jpg, webp, bmp, svg) |
| `targetUrl` | string | — | `db://` destination (default: `db://assets/textures/<filename>`) |
| `nodeUuid` | string | — | Target node UUID (default: current selection) |
| `autoAddSprite` | boolean | — | Auto-add Sprite if missing (default: `true`) |
| `refreshAssetDb` | boolean | — | Refresh AssetDB after import (default: `true`) |

---

## setup_ui_layout

Create a standard ScrollView list hierarchy in one call. **Selection-aware**.

### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `parentUuid` | string | — | Parent node UUID (default: current selection) |
| `rootName` | string | — | Root node name (default: `AutoScrollView`) |
| `itemNamePrefix` | string | — | Item name prefix (default: `Item`) |
| `itemCount` | number | — | Number of items to create (1–100, default: 5) |
| `withMask` | boolean | — | Add Mask to Viewport (default: `true`) |
| `withLayout` | boolean | — | Add Layout to Content (default: `true`) |

### Created Hierarchy

```
<rootName>  (ScrollView + UITransform)
└─ Viewport  (UITransform [+ Mask])
   └─ Content  (UITransform [+ Layout])
      ├─ <prefix>_1
      ├─ <prefix>_2
      └─ … (<itemCount> items)
```

---

## create_tween_animation_atomic

Create an animation clip with keyframe tracks and optionally attach to a node.

### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tracks` | array | ✅ | Animation tracks (min 1). Each: `{ property, keyframes, path?, component? }` |
| `nodeUuid` | string | — | Node to attach the clip to |
| `clipName` | string | — | Clip name (default: `NewClip`) |
| `duration` | number | — | Clip duration in seconds (0.01–300, default: 1) |
| `wrapMode` | enum | — | `Normal`, `Loop`, `PingPong`, `Reverse`, `LoopReverse` |
| `speed` | number | — | Playback speed (0.01–10, default: 1) |
| `sample` | number | — | Sample rate (1–120, default: 60) |

### Keyframe Format

```json
{
  "property": "position",
  "keyframes": [
    { "time": 0, "value": { "x": 0, "y": 0, "z": 0 } },
    { "time": 1, "value": { "x": 100, "y": 0, "z": 0 }, "easing": "cubicInOut" }
  ]
}
```

### Supported Easing Functions

`linear`, `quadIn`, `quadOut`, `quadInOut`, `cubicIn`, `cubicOut`, `cubicInOut`, `quartIn`, `quartOut`, `quartInOut`, `quintIn`, `quintOut`, `quintInOut`, `sineIn`, `sineOut`, `sineInOut`, `expoIn`, `expoOut`, `expoInOut`, `circIn`, `circOut`, `circInOut`, `elasticIn`, `elasticOut`, `elasticInOut`, `backIn`, `backOut`, `backInOut`, `bounceIn`, `bounceOut`, `bounceInOut`

---

## auto_fit_physics_collider

Automatically fit a 2D physics collider to a sprite's visual bounds or alpha outline.

### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `nodeUuid` | string | — | Target node UUID (default: current selection) |
| `colliderType` | enum | — | `auto`, `polygon`, `box`, `circle` (default: `auto`) |
| `alphaThreshold` | number | — | Alpha cutoff for outline (0–1, default: 0.1) |
| `simplifyTolerance` | number | — | Vertex simplification tolerance (0–20, default: 2.0) |
| `maxVertices` | number | — | Max polygon vertices (3–256, default: 64) |
| `sensor` | boolean | — | Trigger-only collider (no physics response) |
| `friction` | number | — | Surface friction (0–1) |
| `restitution` | number | — | Bounciness (0–1) |
| `density` | number | — | Mass density (min: 0) |

### Collider Type Selection

- **auto**: Tries polygon from texture → falls back to box
- **polygon**: Alpha outline extraction via marching squares + RDP simplification
- **box**: Rectangle from UITransform contentSize
- **circle**: Circle from max(width, height)/2

---

## Error Response Format

All tools return errors consistently:

```json
{
  "success": false,
  "tool": "scene_operation",
  "action": "add_component",
  "error": "未找到组件类: sprite",
  "suggestion": "可尝试: Sprite, Label, Button, Layout, ScrollView, UITransform, Mask, RichText"
}
```

---

## Common Patterns

### Pattern 1: Query before modify

```json
// Step 1: Find node UUID
{ "tool": "scene_query", "arguments": { "action": "find_nodes_by_name", "name": "Hero" } }

// Step 2: Modify using UUID
{ "tool": "scene_operation", "arguments": { "action": "set_position", "uuid": "abc-123", "x": 100, "y": 200, "z": 0 } }
```

### Pattern 2: Selection-aware operations

```json
// Apply texture to whatever node the user currently has selected
{ "tool": "import_and_apply_texture", "arguments": { "sourcePath": "C:/Art/icon.png" } }
```

### Pattern 3: Atomic macros over manual chaining

| ❌ Manual (fragile, no rollback) | ✅ Atomic macro |
|--------------------------------|----------------|
| create_node → add_component → set_property → create_prefab → refresh → destroy_node | `create_prefab_atomic` |
| asset_operation.import → asset_operation.url_to_uuid → scene_operation.set_property | `import_and_apply_texture` |

### Pattern 4: Batch operations with cross-references

```json
{
  "tool": "scene_operation",
  "arguments": {
    "action": "batch",
    "operations": [
      { "action": "create_node", "name": "Parent" },
      { "action": "create_node", "name": "Child", "parentUuid": "$0.uuid" },
      { "action": "add_component", "uuid": "$1.uuid", "component": "Sprite" }
    ]
  }
}
```

### Pattern 5: Path normalization

`db://` path casing errors are auto-corrected. No need to worry about case:

```
db://assets/Prefabs/Hero.prefab  →  db://assets/prefabs/Hero.prefab
db://assets/Scripts/Player.ts    →  db://assets/scripts/Player.ts
```
