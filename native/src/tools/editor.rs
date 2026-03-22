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
                "url": { "type": "string", "description": "Scene db:// URL for open_scene." },
                "scenePath": { "type": "string", "description": "Deprecated alias of url for open_scene." },
                "text": { "type": "string", "description": "Log message or notification text." },
                "message": { "type": "string", "description": "Deprecated alias of text." },
                "level": { "type": "string", "description": "Log level: log, warn, error." },
                "panel": { "type": "string", "description": "Panel name for open_panel / close_panel." },
                "panelName": { "type": "string", "description": "Panel name for open/close_panel." },
                "buildConfig": { "type": "object", "description": "Build configuration for build_with_config." },
                "tool": { "type": "string", "enum": ["position", "rotation", "scale", "rect"], "description": "Transform tool for set_transform_tool." },
                "coordinate": { "type": "string", "enum": ["local", "world"], "description": "Coordinate system for set_coordinate." },
                "viewMode": { "type": "string", "enum": ["2d", "3d"], "description": "View mode for set_view_mode." },
                "keyword": { "type": "string", "description": "Search keyword for search_logs." },
                "module": { "type": "string", "description": "Plugin/module name for reload_plugin or send_message." },
                "pluginName": { "type": "string", "description": "Plugin name for reload_plugin." },
                "position": { "type": "object", "description": "Legacy camera position payload for move_scene_camera." },
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

    let mut normalized = args.clone();
    if let Some(obj) = normalized.as_object_mut() {
        if let Some(scene_path) = obj.get("scenePath").cloned() {
            obj.entry("url").or_insert(scene_path);
        }
        if let Some(message) = obj.get("message").cloned() {
            obj.entry("text").or_insert(message);
        }
        if let Some(panel_name) = obj.get("panelName").cloned() {
            obj.entry("panel").or_insert(panel_name);
        }
        if let Some(plugin_name) = obj.get("pluginName").cloned() {
            obj.entry("module").or_insert(plugin_name);
        }
    }

    match action.as_str() {
        "open_scene" => {
            if normalized.get("uuid").is_none() && normalized.get("url").is_none() {
                return ExecutionPlan::error_with_suggestion(
                    "Missing required parameter: uuid or url",
                    "Provide scene UUID or db:// scene URL for open_scene",
                );
            }
        }
        "focus_node" => {
            if let Err(plan) = validate::require_string(&normalized, "uuid") { return plan; }
        }
        "log" | "warn" | "error" | "show_notification" => {
            if let Err(plan) = validate::require_string(&normalized, "text") { return plan; }
        }
        _ => {}
    }

    match action.as_str() {
        "save_scene" => ExecutionPlan::single(CallInstruction::BridgePost {
            path: "/api/editor/save-scene".into(),
            body: Some(json!({ "force": normalized.get("force").cloned().unwrap_or(json!(null)) })),
        }),
        "open_scene" => ExecutionPlan::single(CallInstruction::BridgePost {
            path: "/api/editor/open-scene".into(),
            body: Some(json!({
                "uuid": normalized.get("uuid").cloned().unwrap_or(json!(null)),
                "url": normalized.get("url").cloned().unwrap_or(json!(null))
            })),
        }),
        "new_scene" => ExecutionPlan::single(CallInstruction::BridgePost {
            path: "/api/scene/new-scene".into(),
            body: None,
        }),
        "undo" => ExecutionPlan::single(CallInstruction::BridgePost {
            path: "/api/editor/undo".into(),
            body: None,
        }),
        "redo" => ExecutionPlan::single(CallInstruction::BridgePost {
            path: "/api/editor/redo".into(),
            body: None,
        }),
        "preview" | "play_in_editor" => ExecutionPlan::single(CallInstruction::BridgePost {
            path: "/api/preview/open".into(),
            body: None,
        }),
        "preview_refresh" => ExecutionPlan::single(CallInstruction::BridgePost {
            path: "/api/preview/refresh".into(),
            body: None,
        }),
        "build" => ExecutionPlan::single(CallInstruction::BridgePost {
            path: "/api/builder/build".into(),
            body: Some(json!({ "platform": normalized.get("platform").cloned().unwrap_or(json!(null)) })),
        }),
        "project_info" => ExecutionPlan::single(CallInstruction::BridgeGet {
            path: "/api/editor/project-info".into(),
            params: None,
        }),
        "focus_node" => ExecutionPlan::single(CallInstruction::BridgePost {
            path: "/api/scene/focus-node".into(),
            body: Some(json!({ "uuid": normalized["uuid"] })),
        }),
        "log" => ExecutionPlan::single(CallInstruction::BridgePost {
            path: "/api/console/log".into(),
            body: Some(json!({ "text": normalized["text"] })),
        }),
        "warn" => ExecutionPlan::single(CallInstruction::BridgePost {
            path: "/api/console/warn".into(),
            body: Some(json!({ "text": normalized["text"] })),
        }),
        "error" => ExecutionPlan::single(CallInstruction::BridgePost {
            path: "/api/console/error".into(),
            body: Some(json!({ "text": normalized["text"] })),
        }),
        "clear_console" => ExecutionPlan::single(CallInstruction::BridgePost {
            path: "/api/console/clear".into(),
            body: Some(json!({})),
        }),
        "show_notification" => ExecutionPlan::single(CallInstruction::BridgePost {
            path: "/api/console/warn".into(),
            body: Some(json!({
                "text": format!(
                    "[{}] {}",
                    normalized.get("title").and_then(|v| v.as_str()).unwrap_or("AI Assistant"),
                    normalized.get("text").and_then(|v| v.as_str()).unwrap_or("Notification")
                )
            })),
        }),
        "soft_reload" | "snapshot" | "snapshot_abort" | "cancel_recording" => {
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
        "build_query" => {
            ExecutionPlan::single(CallInstruction::BridgeGet {
                path: "/api/editor/project-info".into(),
                params: None,
            })
        }
        _ => {
            ExecutionPlan::single(CallInstruction::BridgePost {
                path: "/api/editor/action".into(),
                body: Some(normalized),
            })
        }
    }
}
