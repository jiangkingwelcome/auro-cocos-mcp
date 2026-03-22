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
    // Native IPC queries
    "query_node", "query_component", "query_node_tree",
    "query_nodes_by_asset_uuid", "query_is_ready",
    "query_classes", "query_component_has_script",
    // New query actions in 1.7.3
    "find_similar_nodes", "find_nodes_by_tag", "find_nodes_by_script",
    "get_node_hierarchy", "get_node_path", "get_node_depth",
    "list_node_templates", "get_clipboard_content",
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
    "apply_prefab", "restore_prefab", "validate_prefab",
    // Pro-only extended ops
    "lock_node", "unlock_node", "hide_node", "unhide_node",
    "set_layer", "clear_children", "reset_node_properties",
    "batch", "batch_set_property", "group_nodes", "align_nodes",
    "clipboard_copy", "clipboard_paste",
    "create_ui_widget", "setup_particle", "audio_setup",
    "setup_physics_world", "create_skeleton_node", "generate_tilemap",
    "create_primitive",
    "create_camera", "set_camera_property", "camera_screenshot",
    "set_material_property", "assign_material", "assign_builtin_material", "assign_project_material", "clone_material",
    "swap_technique", "sprite_grayscale",
    "create_light", "set_light_property",
    "set_scene_environment",
    "bind_event", "unbind_event", "list_events",
    "attach_script", "detach_script",
    "set_component_properties",
    // Clipboard / Array / Component method (native IPC)
    "copy_node", "paste_node", "cut_node",
    "move_array_element", "remove_array_element",
    "execute_component_method",
    // New operations in 1.7.3 (additional)
    "group_nodes_advanced", "ungroup_nodes",
    "find_similar_nodes", "find_nodes_by_tag",
    "serialize_node", "deserialize_node",
    "create_node_from_template", "save_as_template",
    "swap_nodes", "align_to_node",
    "mirror_node", "flip_node",
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
    "apply_prefab", "restore_prefab", "validate_prefab",
    "lock_node", "unlock_node", "hide_node", "unhide_node",
    "set_layer", "clear_children", "reset_node_properties",
    "attach_script", "detach_script", "set_component_properties",
    "set_camera_property", "camera_screenshot",
    "set_material_property", "assign_material", "assign_builtin_material", "assign_project_material", "clone_material",
    "swap_technique", "sprite_grayscale",
    "set_light_property",
    "bind_event", "unbind_event", "list_events",
    "move_array_element", "remove_array_element",
    "execute_component_method",
    // New in 1.7.3
    "copy_node", "cut_node", "paste_node",
    "group_nodes_advanced", "ungroup_nodes",
    "find_similar_nodes", "find_nodes_by_tag",
    "serialize_node", "deserialize_node",
    "create_node_from_template", "save_as_template",
    "swap_nodes", "align_to_node",
    "mirror_node", "flip_node",
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
                "Actions (51): tree, list, stats, node_detail, find_by_path, ",
                "get_components, get_parent, get_children, get_sibling, ",
                "get_world_position/rotation/scale, get_active_in_hierarchy, ",
                "find_nodes_by_name, find_nodes_by_component, find_similar_nodes, find_nodes_by_tag, find_nodes_by_script, ",
                "get_component_property, get_node_components_properties, ",
                "get_camera_info, get_canvas_info, get_scene_globals, ",
                "get_current_selection, get_active_scene_focus, ",
                "list_all_scenes, validate_scene, detect_2d_3d, ",
                "list_available_components, measure_distance, ",
                "scene_snapshot, scene_diff, performance_audit, ",
                "export_scene_json, deep_validate_scene, ",
                "get_node_bounds, find_nodes_by_layer, get_node_hierarchy, get_node_path, get_node_depth, ",
                "get_animation_state, get_collider_info, get_material_info, ",
                "get_light_info, get_scene_environment, ",
                "screen_to_world, world_to_screen, ",
                "check_script_ready, get_script_properties, ",
                "list_node_templates, get_clipboard_content",
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
                    "x": { "type": "number", "description": "Legacy alias. Prefer screenX/worldX depending on action." },
                    "y": { "type": "number", "description": "Legacy alias. Prefer screenY/worldY depending on action." },
                    "z": { "type": "number", "description": "Legacy alias. Prefer screenZ/worldZ depending on action." },
                    "screenX": { "type": "number", "description": "Screen X coordinate for screen_to_world." },
                    "screenY": { "type": "number", "description": "Screen Y coordinate for screen_to_world." },
                    "screenZ": { "type": "number", "description": "Screen depth coordinate for screen_to_world." },
                    "worldX": { "type": "number", "description": "World X coordinate for world_to_screen." },
                    "worldY": { "type": "number", "description": "World Y coordinate for world_to_screen." },
                    "worldZ": { "type": "number", "description": "World Z coordinate for world_to_screen." },
                    "script": { "type": "string", "description": "Script class name for check_script_ready/get_script_properties." },
                    "scriptName": { "type": "string", "description": "Deprecated alias of script." },
                    // New parameters in 1.7.3
                    "tag": { "type": "string", "description": "Node tag for find_nodes_by_tag." },
                    "templateName": { "type": "string", "description": "Template name for list_node_templates." },
                    "similarity": { "type": "number", "description": "Similarity threshold for find_similar_nodes (0-1)." }
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
                "Actions (79): create_node, destroy_node, reparent, ",
                "set_position/rotation/scale, set_world_position/rotation/scale, ",
                "set_name, set_active, duplicate_node, move_node_up/down, set_sibling_index, reset_transform, ",
                "add_component, remove_component, set_property, reset_property, call_component_method, ",
                "ensure_2d_canvas, set_anchor_point, set_content_size, ",
                "create_prefab, instantiate_prefab, enter/exit_prefab_edit, apply/restore/validate_prefab, ",
                "lock/unlock_node, hide/unhide_node, set_layer, clear_children, reset_node_properties, ",
                "batch, batch_set_property, group_nodes, align_nodes, clipboard_copy/paste, ",
                "create_ui_widget, setup_particle, audio_setup, setup_physics_world, ",
                "create_skeleton_node, generate_tilemap, create_primitive, ",
                "create/set_camera, camera_screenshot, ",
                "set/assign_builtin/assign_project/clone_material, swap_technique, sprite_grayscale, ",
                "create/set_light, set_scene_environment, ",
                "bind/unbind/list_events, attach/detach_script, set_component_properties, ",
                // New in 1.7.3
                "copy_node, paste_node, cut_node, group_nodes_advanced, ungroup_nodes, ",
                "find_similar_nodes, find_nodes_by_tag, serialize_node, deserialize_node, ",
                "create_node_from_template, save_as_template, swap_nodes, align_to_node, mirror_node, flip_node",
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
                    "parent": { "type": "string", "description": "Deprecated alias of parentUuid." },
                    "parentUuid": { "type": "string", "description": "Parent node UUID or node name for create_node/reparent." },
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
                    "script": { "type": "string", "description": "Script class name for attach/detach_script." },
                    "scriptName": { "type": "string", "description": "Deprecated alias of script." },
                    "properties": { "type": "object", "description": "Properties map for set_component_properties." },
                    "widgetType": { "type": "string", "description": "UI widget type for create_ui_widget." },
                    "materialPath": { "type": "string", "description": "Deprecated alias of materialUrl for assign_project_material." },
                    "materialUrl": { "type": "string", "description": "db:// or UUID of project material for assign_project_material." },
                    "effectName": { "type": "string", "description": "Builtin material effect name for assign_builtin_material." },
                    "uniforms": { "type": "object", "description": "Uniform/property map for set_material_property." },
                    "technique": { "type": "integer", "description": "Technique index for swap_technique." },
                    "techniqueIndex": { "type": "integer", "description": "Deprecated alias of technique." },
                    "materialIndex": { "type": "integer", "description": "Renderer material slot index. Default: 0." },
                    "methodName": { "type": "string", "description": "Component method name for call_component_method / execute_component_method." },
                    "lightType": { "type": "string", "description": "Light type for create_light." },
                    "eventName": { "type": "string", "description": "Event name for bind/unbind_event." },
                    // New parameters in 1.7.3
                    "targetUuid": { "type": "string", "description": "Target node UUID for swap_nodes, align_to_node, mirror_node, flip_node." },
                    "templateName": { "type": "string", "description": "Template name for create_node_from_template, save_as_template." },
                    "templateData": { "type": "string", "description": "Template data (JSON) for deserialize_node." },
                    "axis": { "type": "string", "description": "Axis for mirror_node (x, y, z)." },
                    "direction": { "type": "string", "description": "Direction for flip_node (horizontal, vertical)." },
                    "groupConfig": { "type": "object", "description": "Group configuration for group_nodes_advanced." },
                    "uuids": { "type": "array", "description": "Array of node UUIDs for batch operations." }
                },
                "required": ["action"]
            }),
            actions: OPERATION_ACTIONS.iter().map(|s| s.to_string()).collect(),
            edition: "pro".into(),
        },
    ]
}

const NATIVE_IPC_QUERIES: &[(&str, &str)] = &[
    ("query_node", "query-node"),
    ("query_component", "query-component"),
    ("query_node_tree", "query-node-tree"),
    ("query_nodes_by_asset_uuid", "query-nodes-by-asset-uuid"),
    ("query_is_ready", "query-is-ready"),
    ("query_classes", "query-classes"),
    ("query_component_has_script", "query-component-has-script"),
];

pub fn process_query(args: &serde_json::Value) -> ExecutionPlan {
    let action = match validate::require_action(args, QUERY_ACTIONS) {
        Ok(a) => a,
        Err(plan) => return plan,
    };

    let mut normalized = args.clone();
    if let Some(obj) = normalized.as_object_mut() {
        if let Some(script_name) = obj.get("scriptName").cloned() {
            obj.entry("script").or_insert(script_name);
        }
        if action == "screen_to_world" {
            if let Some(v) = obj.get("x").cloned() { obj.entry("screenX").or_insert(v); }
            if let Some(v) = obj.get("y").cloned() { obj.entry("screenY").or_insert(v); }
            if let Some(v) = obj.get("z").cloned() { obj.entry("screenZ").or_insert(v); }
        }
        if action == "world_to_screen" {
            if let Some(v) = obj.get("x").cloned() { obj.entry("worldX").or_insert(v); }
            if let Some(v) = obj.get("y").cloned() { obj.entry("worldY").or_insert(v); }
            if let Some(v) = obj.get("z").cloned() { obj.entry("worldZ").or_insert(v); }
        }
    }

    for &(act, ipc_msg) in NATIVE_IPC_QUERIES {
        if action == act {
            let ipc_args: Vec<serde_json::Value> = match act {
                "query_node" | "query_component" => vec![normalized["uuid"].clone()],
                "query_nodes_by_asset_uuid" => vec![normalized["assetUuid"].clone()],
                "query_component_has_script" => vec![normalized["className"].clone()],
                _ => vec![],
            };
            return ExecutionPlan::single(CallInstruction::EditorMsg {
                module: "scene".into(),
                message: ipc_msg.into(),
                args: ipc_args,
            });
        }
    }

    ExecutionPlan::single(CallInstruction::SceneMethod {
        method: "dispatchQuery".into(),
        args: vec![normalized],
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

    let mut normalized = args.clone();
    if let Some(obj) = normalized.as_object_mut() {
        if let Some(parent) = obj.get("parent").cloned() {
            obj.entry("parentUuid").or_insert(parent);
        }
        if let Some(script_name) = obj.get("scriptName").cloned() {
            obj.entry("script").or_insert(script_name);
        }
        if action == "assign_material" {
            if obj.get("materialUrl").is_some() || obj.get("materialPath").is_some() {
                obj.insert("action".into(), json!("assign_project_material"));
                if let Some(material_path) = obj.get("materialPath").cloned() {
                    obj.entry("materialUrl").or_insert(material_path);
                }
            } else {
                obj.insert("action".into(), json!("assign_builtin_material"));
            }
        }
    }

    match action.as_str() {
        "destroy_node" => ExecutionPlan::single(CallInstruction::EditorMsg {
            module: "scene".into(),
            message: "remove-node".into(),
            args: vec![json!({"uuid": args["uuid"]})],
        }),
        "clear_children" => ExecutionPlan::single(CallInstruction::SceneMethod {
            method: "dispatchOperation".into(),
            args: vec![args.clone()],
        }),
        "reset_property" => ExecutionPlan::single(CallInstruction::EditorMsg {
            module: "scene".into(),
            message: "reset-property".into(),
            args: vec![json!({
                "uuid": args["uuid"],
                "path": format!("{}.{}",
                    args["component"].as_str().unwrap_or(""),
                    args["property"].as_str().unwrap_or(""))
            })],
        }),
        "reset_node_properties" => ExecutionPlan::single(CallInstruction::EditorMsg {
            module: "scene".into(),
            message: "reset-component".into(),
            args: vec![json!({"uuid": args["uuid"], "component": args.get("component").cloned().unwrap_or(json!(null))})],
        }),
        "reset_transform" => ExecutionPlan::single(CallInstruction::EditorMsg {
            module: "scene".into(),
            message: "reset-node".into(),
            args: vec![json!({"uuid": args["uuid"]})],
        }),
        "call_component_method" => ExecutionPlan::single(CallInstruction::EditorMsg {
            module: "scene".into(),
            message: "execute-component-method".into(),
            args: vec![json!({
                "uuid": args["uuid"],
                "component": args["component"],
                "method": args["methodName"],
                "args": args.get("args").cloned().unwrap_or(json!([]))
            })],
        }),
        "enter_prefab_edit" => {
            if let Err(plan) = validate::require_string(args, "prefabUrl") { return plan; }
            ExecutionPlan::single(CallInstruction::EditorMsg {
                module: "asset-db".into(),
                message: "open-asset".into(),
                args: vec![args["prefabUrl"].clone()],
            })
        }
        "exit_prefab_edit" => {
            ExecutionPlan::single(CallInstruction::EditorMsg {
                module: "asset-db".into(),
                message: "open-asset".into(),
                args: if args.get("sceneUrl").is_some() { vec![args["sceneUrl"].clone()] } else { vec![] },
            })
        }
        "copy_node" => ExecutionPlan::single(CallInstruction::EditorMsg {
            module: "scene".into(),
            message: "copy-node".into(),
            args: vec![json!([args["uuid"]])],
        }),
        "paste_node" => ExecutionPlan::single(CallInstruction::EditorMsg {
            module: "scene".into(),
            message: "paste-node".into(),
            args: if args.get("parentUuid").is_some() { vec![args["parentUuid"].clone()] } else { vec![] },
        }),
        "cut_node" => ExecutionPlan::single(CallInstruction::EditorMsg {
            module: "scene".into(),
            message: "cut-node".into(),
            args: vec![json!([args["uuid"]])],
        }),
        "move_array_element" => ExecutionPlan::single(CallInstruction::EditorMsg {
            module: "scene".into(),
            message: "move-array-element".into(),
            args: vec![json!({"uuid": args["uuid"], "path": args["path"], "target": args["target"]})],
        }),
        "remove_array_element" => ExecutionPlan::single(CallInstruction::EditorMsg {
            module: "scene".into(),
            message: "remove-array-element".into(),
            args: vec![json!({"uuid": args["uuid"], "path": args["path"]})],
        }),
        "execute_component_method" => ExecutionPlan::single(CallInstruction::EditorMsg {
            module: "scene".into(),
            message: "execute-component-method".into(),
            args: vec![json!({
                "uuid": args["uuid"],
                "component": args["component"],
                "method": args["methodName"],
                "args": args.get("args").cloned().unwrap_or(json!([]))
            })],
        }),
        _ => ExecutionPlan::single(CallInstruction::SceneMethod {
            method: "dispatchOperation".into(),
            args: vec![normalized],
        }),
    }
}
