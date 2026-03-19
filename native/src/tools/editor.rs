use crate::types::*;
use crate::validate;
use serde_json::json;

const ACTIONS: &[&str] = &[
    // Community actions
    "save_scene", "open_scene", "new_scene",
    "undo", "redo",
    "project_info",
    "preview", "preview_refresh",
    "build", "build_query",
    "play_in_editor",
    "focus_node", "log", "warn", "error", "clear_console", "show_notification",
    // Gizmo / View / Camera align / Scene management / Undo
    "change_gizmo_tool", "query_gizmo_tool_name",
    "change_gizmo_pivot", "query_gizmo_pivot",
    "change_gizmo_coordinate", "query_gizmo_coordinate",
    "change_is2D", "query_is2D",
    "set_grid_visible", "query_is_grid_visible",
    "set_icon_gizmo_3d", "query_is_icon_gizmo_3d",
    "set_icon_gizmo_size", "query_icon_gizmo_size",
    "align_node_with_view", "align_view_with_node",
    "soft_reload", "query_dirty",
    "snapshot", "snapshot_abort", "cancel_recording",
    // Pro-only extended actions
    "build_with_config", "build_status", "preview_status",
    "send_message",
    "open_panel", "close_panel", "query_panels",
    "get_packages", "reload_plugin",
    "inspect_asset", "open_preferences", "open_project_settings",
    "move_scene_camera", "take_scene_screenshot",
    "set_transform_tool", "set_coordinate",
    "toggle_grid", "toggle_snap",
    "get_console_logs", "search_logs",
    "set_view_mode", "zoom_to_fit",
    // New actions in 1.7.3
    "open_recent_project", "get_recent_projects",
    "get_project_settings", "set_project_settings",
    "get_editor_preferences", "set_editor_preferences",
    "get_editor_info", "get_system_info",
    "install_package", "uninstall_package",
    "toggle_inspector_lock", "toggle_hierarchy_lock",
    "refresh_assets", "clear_cache",
    // Builder actions (new in 1.7.3)
    "get_build_platforms", "get_build_configs",
    "set_build_config", "build_progress",
    "cancel_build", "get_build_result",
];

pub fn definitions() -> Vec<ToolDefinition> {
    vec![ToolDefinition {
        name: "editor_action".into(),
        description: concat!(
            "Control the Cocos Creator editor: scene lifecycle, selection, console, panels, build, preview, tools.\n\n",
            "AI RULES:\n",
            "1. save_scene before switching scenes.\n",
            "2. Use undo/redo for quick corrections.\n",
            "3. Use focus_node after creating nodes to center the view.\n\n",
            "Actions (60): save_scene, open_scene, new_scene, undo, redo, ",
            "project_info, ",
            "preview, preview_refresh, build, build_query, ",
            "play_in_editor, ",
            "focus_node, log, warn, error, clear_console, show_notification, ",
            "build_with_config, build_status, preview_status, send_message, ",
            "open/close/query_panels, get_packages, reload_plugin, ",
            "inspect_asset, open_preferences, open_project_settings, ",
            "move_scene_camera, take_scene_screenshot, ",
            "set_transform_tool, set_coordinate, toggle_grid, toggle_snap, ",
            "get_console_logs, search_logs, set_view_mode, zoom_to_fit, ",
            // New in 1.7.3
            "open_recent_project, get_recent_projects, ",
            "get_project_settings, set_project_settings, ",
            "get_editor_preferences, set_editor_preferences, ",
            "get_editor_info, get_system_info, ",
            "install_package, uninstall_package, ",
            "toggle_inspector_lock, toggle_hierarchy_lock, ",
            "refresh_assets, clear_cache, ",
            // Builder in 1.7.3
            "get_build_platforms, get_build_configs, set_build_config, build_progress, cancel_build, get_build_result",
        ).into(),
        schema: json!({
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "enum": ACTIONS,
                    "description": "Editor action to perform."
                },
                "uuid": { "type": "string", "description": "Node UUID for focus_node, inspect_asset." },
                "scenePath": { "type": "string", "description": "Scene db:// path for open_scene." },
                "message": { "type": "string", "description": "Log message or notification text." },
                "level": { "type": "string", "description": "Log level: log, warn, error." },
                "panelName": { "type": "string", "description": "Panel name for open/close_panel." },
                "buildConfig": { "type": "object", "description": "Build configuration for build_with_config." },
                "tool": { "type": "string", "enum": ["position", "rotation", "scale", "rect"], "description": "Transform tool for set_transform_tool." },
                "coordinate": { "type": "string", "enum": ["local", "world"], "description": "Coordinate system for set_coordinate." },
                "viewMode": { "type": "string", "enum": ["2d", "3d"], "description": "View mode for set_view_mode." },
                "keyword": { "type": "string", "description": "Search keyword for search_logs." },
                "pluginName": { "type": "string", "description": "Plugin name for reload_plugin." },
                "position": { "type": "object", "description": "Camera position for move_scene_camera." },
                // New parameters in 1.7.3
                "projectPath": { "type": "string", "description": "Project path for open_recent_project." },
                "settings": { "type": "object", "description": "Settings object for set_project_settings, set_editor_preferences." },
                "preferences": { "type": "object", "description": "Preferences object for set_editor_preferences." },
                "packageName": { "type": "string", "description": "Package name for install_package, uninstall_package." },
                "packageUrl": { "type": "string", "description": "Package URL for install_package." },
                // Builder parameters in 1.7.3
                "platform": { "type": "string", "description": "Build platform for get_build_configs, set_build_config." },
                "config": { "type": "object", "description": "Build configuration object for set_build_config." },
                "buildId": { "type": "string", "description": "Build task ID for build_progress, cancel_build, get_build_result." }
            },
            "required": ["action"]
        }),
        actions: ACTIONS.iter().map(|s| s.to_string()).collect(),
        edition: "pro".into(),
    }]
}

pub fn process(args: &serde_json::Value) -> ExecutionPlan {
    let action = match validate::require_action(args, ACTIONS) {
        Ok(a) => a,
        Err(plan) => return plan,
    };

    match action.as_str() {
        "save_scene" | "undo" | "redo" | "new_scene"
        | "soft_reload" | "snapshot" | "snapshot_abort" | "cancel_recording" => {
            ExecutionPlan::single(CallInstruction::EditorMsg {
                module: "scene".into(),
                message: action.replace('_', "-"),
                args: vec![],
            })
        }
        // No-arg scene IPC queries
        "query_gizmo_tool_name" | "query_gizmo_pivot" | "query_gizmo_coordinate"
        | "query_is2D" | "query_is_grid_visible" | "query_is_icon_gizmo_3d"
        | "query_icon_gizmo_size" | "query_dirty" => {
            ExecutionPlan::single(CallInstruction::EditorMsg {
                module: "scene".into(),
                message: action.replace('_', "-"),
                args: vec![],
            })
        }
        // No-arg scene IPC commands
        "align_node_with_view" => {
            ExecutionPlan::single(CallInstruction::EditorMsg {
                module: "scene".into(),
                message: "align-with-view".into(),
                args: vec![],
            })
        }
        "align_view_with_node" => {
            ExecutionPlan::single(CallInstruction::EditorMsg {
                module: "scene".into(),
                message: "align-view-with-node".into(),
                args: vec![],
            })
        }
        // Single-arg scene IPC commands
        "change_gizmo_tool" => {
            if let Err(plan) = validate::require_string(args, "tool") { return plan; }
            ExecutionPlan::single(CallInstruction::EditorMsg {
                module: "scene".into(),
                message: "change-gizmo-tool".into(),
                args: vec![args["tool"].clone()],
            })
        }
        "change_gizmo_pivot" => {
            if let Err(plan) = validate::require_string(args, "pivot") { return plan; }
            ExecutionPlan::single(CallInstruction::EditorMsg {
                module: "scene".into(),
                message: "change-gizmo-pivot".into(),
                args: vec![args["pivot"].clone()],
            })
        }
        "change_gizmo_coordinate" => {
            if let Err(plan) = validate::require_string(args, "coordinate") { return plan; }
            ExecutionPlan::single(CallInstruction::EditorMsg {
                module: "scene".into(),
                message: "change-gizmo-coordinate".into(),
                args: vec![args["coordinate"].clone()],
            })
        }
        "change_is2D" => {
            ExecutionPlan::single(CallInstruction::EditorMsg {
                module: "scene".into(),
                message: "change-is2D".into(),
                args: vec![args["is2D"].clone()],
            })
        }
        "set_grid_visible" => {
            ExecutionPlan::single(CallInstruction::EditorMsg {
                module: "scene".into(),
                message: "set-grid-visible".into(),
                args: vec![args["visible"].clone()],
            })
        }
        "set_icon_gizmo_3d" => {
            ExecutionPlan::single(CallInstruction::EditorMsg {
                module: "scene".into(),
                message: "set-icon-gizmo-3d".into(),
                args: vec![args["is3D"].clone()],
            })
        }
        "set_icon_gizmo_size" => {
            ExecutionPlan::single(CallInstruction::EditorMsg {
                module: "scene".into(),
                message: "set-icon-gizmo-size".into(),
                args: vec![args["size"].clone()],
            })
        }
        "open_scene" => {
            if let Err(plan) = validate::require_string(args, "scenePath") {
                return plan;
            }
            ExecutionPlan::single(CallInstruction::EditorMsg {
                module: "scene".into(),
                message: "open-scene".into(),
                args: vec![args.clone()],
            })
        }
        "project_info" => {
            ExecutionPlan::single(CallInstruction::BridgeGet {
                path: "/api/status".into(),
                params: None,
            })
        }
        _ => {
            ExecutionPlan::single(CallInstruction::BridgePost {
                path: "/api/editor/action".into(),
                body: Some(args.clone()),
            })
        }
    }
}
