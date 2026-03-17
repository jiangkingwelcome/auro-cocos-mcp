use crate::types::*;
use crate::validate;
use serde_json::json;

// ─── scene_query ────────────────────────────────────────────────────────────

const QUERY_ACTIONS: &[&str] = &[
    "tree", "list", "stats", "node_detail", "find_by_path",
    "get_components", "get_parent", "get_children", "get_sibling",
    "get_world_position", "get_world_rotation", "get_world_scale",
    "get_active_in_hierarchy", "find_nodes_by_name", "find_nodes_by_component",
    "get_component_property", "get_node_components_properties",
    "get_camera_info", "get_canvas_info", "get_scene_globals",
    "get_current_selection", "get_active_scene_focus",
    "list_all_scenes", "validate_scene", "detect_2d_3d",
    "list_available_components", "measure_distance",
    "scene_snapshot", "scene_diff", "performance_audit",
    "export_scene_json", "deep_validate_scene",
    "get_node_bounds", "find_nodes_by_layer",
    "get_animation_state", "get_collider_info", "get_material_info",
    "get_light_info", "get_scene_environment",
    "screen_to_world", "world_to_screen",
    "check_script_ready", "get_script_properties",
];

// ─── scene_operation ────────────────────────────────────────────────────────

const OPERATION_ACTIONS: &[&str] = &[
    // Basic node ops
    "create_node", "destroy_node", "reparent",
    "set_position", "set_rotation", "set_scale",
    "set_world_position", "set_world_rotation", "set_world_scale",
    "set_name", "set_active", "duplicate_node",
    "move_node_up", "move_node_down", "set_sibling_index", "reset_transform",
    // Component ops
    "add_component", "remove_component", "set_property",
    "reset_property", "call_component_method",
    // UI ops
    "ensure_2d_canvas", "set_anchor_point", "set_content_size",
    // Prefab ops
    "create_prefab", "instantiate_prefab",
    "enter_prefab_edit", "exit_prefab_edit",
    "apply_prefab", "revert_prefab", "validate_prefab",
    // Pro-only extended ops
    "lock_node", "unlock_node", "hide_node", "unhide_node",
    "set_layer", "clear_children", "reset_node_properties",
    "batch", "batch_set_property", "group_nodes", "align_nodes",
    "clipboard_copy", "clipboard_paste",
    "create_ui_widget", "setup_particle", "audio_setup",
    "setup_physics_world", "create_skeleton_node", "generate_tilemap",
    "create_primitive",
    "create_camera", "set_camera_property", "camera_screenshot",
    "set_material_property", "assign_material", "clone_material",
    "swap_technique", "sprite_grayscale",
    "create_light", "set_light_property",
    "set_scene_environment",
    "bind_event", "unbind_event", "list_events",
    "attach_script", "detach_script",
    "set_component_properties",
];

const OPERATION_UUID_REQUIRED: &[&str] = &[
    "destroy_node", "reparent",
    "set_position", "set_rotation", "set_scale",
    "set_world_position", "set_world_rotation", "set_world_scale",
    "set_name", "set_active", "duplicate_node",
    "move_node_up", "move_node_down", "set_sibling_index", "reset_transform",
    "add_component", "remove_component", "set_property",
    "reset_property", "call_component_method",
    "set_anchor_point", "set_content_size",
    "instantiate_prefab",
    "enter_prefab_edit", "exit_prefab_edit",
    "apply_prefab", "revert_prefab", "validate_prefab",
    "lock_node", "unlock_node", "hide_node", "unhide_node",
    "set_layer", "clear_children", "reset_node_properties",
    "attach_script", "detach_script", "set_component_properties",
    "set_camera_property", "camera_screenshot",
    "set_material_property", "assign_material", "clone_material",
    "swap_technique", "sprite_grayscale",
    "set_light_property",
    "bind_event", "unbind_event", "list_events",
];

pub fn definitions() -> Vec<ToolDefinition> {
    vec![
        ToolDefinition {
            name: "scene_query".into(),
            description: concat!(
                "Read-only queries on the Cocos Creator scene graph.\n\n",
                "AI RULES:\n",
                "1. ALWAYS query before modifying (e.g., tree → find target → modify).\n",
                "2. Use UUID from query results for subsequent operations.\n",
                "3. Use find_by_path or find_nodes_by_name to locate nodes.\n\n",
                "Actions (43): tree, list, stats, node_detail, find_by_path, ",
                "get_components, get_parent, get_children, get_sibling, ",
                "get_world_position/rotation/scale, get_active_in_hierarchy, ",
                "find_nodes_by_name, find_nodes_by_component, ",
                "get_component_property, get_node_components_properties, ",
                "get_camera_info, get_canvas_info, get_scene_globals, ",
                "get_current_selection, get_active_scene_focus, ",
                "list_all_scenes, validate_scene, detect_2d_3d, ",
                "list_available_components, measure_distance, ",
                "scene_snapshot, scene_diff, performance_audit, ",
                "export_scene_json, deep_validate_scene, ",
                "get_node_bounds, find_nodes_by_layer, ",
                "get_animation_state, get_collider_info, get_material_info, ",
                "get_light_info, get_scene_environment, ",
                "screen_to_world, world_to_screen, ",
                "check_script_ready, get_script_properties",
            ).into(),
            schema: json!({
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string",
                        "enum": QUERY_ACTIONS,
                        "description": "Query action to perform."
                    },
                    "uuid": { "type": "string", "description": "Target node UUID." },
                    "path": { "type": "string", "description": "Node path (e.g., 'Canvas/Button')." },
                    "name": { "type": "string", "description": "Node name to search for." },
                    "component": { "type": "string", "description": "Component type name." },
                    "property": { "type": "string", "description": "Component property name." },
                    "depth": { "type": "number", "description": "Max tree depth. Default: 3." },
                    "layer": { "type": "number", "description": "Layer mask for find_nodes_by_layer." },
                    "snapshotId": { "type": "string", "description": "Snapshot ID for scene_diff." },
                    "x": { "type": "number", "description": "X coordinate for screen_to_world." },
                    "y": { "type": "number", "description": "Y coordinate for screen_to_world." },
                    "z": { "type": "number", "description": "Z coordinate for world_to_screen." },
                    "scriptName": { "type": "string", "description": "Script name for check_script_ready." }
                },
                "required": ["action"]
            }),
            actions: QUERY_ACTIONS.iter().map(|s| s.to_string()).collect(),
            edition: "pro".into(),
        },
        ToolDefinition {
            name: "scene_operation".into(),
            description: concat!(
                "Write operations on the Cocos Creator scene graph.\n\n",
                "AI RULES:\n",
                "1. ALWAYS query the scene first to get target UUIDs.\n",
                "2. For destructive ops (destroy_node, clear_children), set confirmDangerous=true.\n",
                "3. Use batch for multi-step operations with $N.uuid cross-references.\n\n",
                "Actions (65): create_node, destroy_node, reparent, ",
                "set_position/rotation/scale, set_world_position/rotation/scale, ",
                "set_name, set_active, duplicate_node, move_node_up/down, set_sibling_index, reset_transform, ",
                "add_component, remove_component, set_property, reset_property, call_component_method, ",
                "ensure_2d_canvas, set_anchor_point, set_content_size, ",
                "create_prefab, instantiate_prefab, enter/exit_prefab_edit, apply/revert/validate_prefab, ",
                "lock/unlock_node, hide/unhide_node, set_layer, clear_children, reset_node_properties, ",
                "batch, batch_set_property, group_nodes, align_nodes, clipboard_copy/paste, ",
                "create_ui_widget, setup_particle, audio_setup, setup_physics_world, ",
                "create_skeleton_node, generate_tilemap, create_primitive, ",
                "create/set_camera, camera_screenshot, ",
                "set/assign/clone_material, swap_technique, sprite_grayscale, ",
                "create/set_light, set_scene_environment, ",
                "bind/unbind/list_events, attach/detach_script, set_component_properties",
            ).into(),
            schema: json!({
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string",
                        "enum": OPERATION_ACTIONS,
                        "description": "Scene operation to perform."
                    },
                    "uuid": { "type": "string", "description": "Target node UUID. REQUIRED for most actions." },
                    "name": { "type": "string", "description": "Node name for create_node, set_name." },
                    "parent": { "type": "string", "description": "Parent node UUID for create_node, reparent." },
                    "component": { "type": "string", "description": "Component type name." },
                    "property": { "type": "string", "description": "Property name for set_property." },
                    "value": { "description": "Property value for set_property." },
                    "position": { "type": "object", "description": "Position {x, y, z}." },
                    "rotation": { "type": "object", "description": "Rotation {x, y, z}." },
                    "scale": { "type": "object", "description": "Scale {x, y, z}." },
                    "active": { "type": "boolean", "description": "Active state for set_active." },
                    "confirmDangerous": { "type": "boolean", "description": "REQUIRED=true for destructive actions." },
                    "operations": { "type": "array", "description": "Array of operations for batch." },
                    "prefabUrl": { "type": "string", "description": "Prefab db:// URL for instantiate_prefab." },
                    "scriptName": { "type": "string", "description": "Script class name for attach/detach_script." },
                    "properties": { "type": "object", "description": "Properties map for set_component_properties." },
                    "widgetType": { "type": "string", "description": "UI widget type for create_ui_widget." },
                    "materialPath": { "type": "string", "description": "Material path for assign_material." },
                    "lightType": { "type": "string", "description": "Light type for create_light." },
                    "eventName": { "type": "string", "description": "Event name for bind/unbind_event." }
                },
                "required": ["action"]
            }),
            actions: OPERATION_ACTIONS.iter().map(|s| s.to_string()).collect(),
            edition: "pro".into(),
        },
    ]
}

pub fn process_query(args: &serde_json::Value) -> ExecutionPlan {
    if let Err(plan) = validate::require_action(args, QUERY_ACTIONS) {
        return plan;
    }

    ExecutionPlan::single(CallInstruction::SceneMethod {
        method: "dispatchQuery".into(),
        args: vec![args.clone()],
    })
}

pub fn process_operation(args: &serde_json::Value) -> ExecutionPlan {
    let action = match validate::require_action(args, OPERATION_ACTIONS) {
        Ok(a) => a,
        Err(plan) => return plan,
    };

    if let Err(plan) = validate::require_string_for_actions(args, "uuid", &action, OPERATION_UUID_REQUIRED) {
        return plan;
    }

    ExecutionPlan::single(CallInstruction::SceneMethod {
        method: "dispatchOperation".into(),
        args: vec![args.clone()],
    })
}
