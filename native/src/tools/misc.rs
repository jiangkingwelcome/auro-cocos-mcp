use crate::types::*;
use crate::validate;
use serde_json::json;

// ─── preferences ────────────────────────────────────────────────────────────

const PREF_ACTIONS: &[&str] = &[
    "get", "set", "list",
    "get_global", "set_global",
    "get_project", "set_project",
];

// ─── broadcast ──────────────────────────────────────────────────────────────

const BROADCAST_ACTIONS: &[&str] = &[
    "poll", "history", "clear", "send", "send_ipc",
];

// ─── tool_management ────────────────────────────────────────────────────────

const TOOL_MGMT_ACTIONS: &[&str] = &[
    "list_all", "enable", "disable", "get_stats",
];

pub fn definitions() -> Vec<ToolDefinition> {
    vec![
        ToolDefinition {
            name: "preferences".into(),
            description: concat!(
                "Read and write Cocos Creator editor preferences.\n\n",
                "Actions:\n",
                "- get: key(REQUIRED). Get a preference value.\n",
                "- set: key(REQUIRED), value(REQUIRED). Set a preference value.\n",
                "- list: List all preference keys.\n",
                "- get_global: key(REQUIRED). Get global preference.\n",
                "- set_global: key(REQUIRED), value(REQUIRED). Set global preference.\n",
                "- get_project: key(REQUIRED). Get project-level preference.\n",
                "- set_project: key(REQUIRED), value(REQUIRED). Set project-level preference.",
            ).into(),
            schema: json!({
                "type": "object",
                "properties": {
                    "action": { "type": "string", "enum": PREF_ACTIONS, "description": "Preference action." },
                    "key": { "type": "string", "description": "Preference key path." },
                    "value": { "description": "Value to set." }
                },
                "required": ["action"]
            }),
            actions: PREF_ACTIONS.iter().map(|s| s.to_string()).collect(),
            edition: "pro".into(),
        },
        ToolDefinition {
            name: "broadcast".into(),
            description: concat!(
                "Interact with the Cocos Creator editor event system.\n\n",
                "Actions:\n",
                "- poll: Get new events since last poll.\n",
                "- history: Get recent event history.\n",
                "- clear: Clear event buffer.\n",
                "- send: channel(REQUIRED), data(optional). Send a custom broadcast event.\n",
                "- send_ipc: module(REQUIRED), message(REQUIRED), args(optional). Send raw Editor IPC message.",
            ).into(),
            schema: json!({
                "type": "object",
                "properties": {
                    "action": { "type": "string", "enum": BROADCAST_ACTIONS, "description": "Broadcast action." },
                    "channel": { "type": "string", "description": "Event channel for send." },
                    "data": { "description": "Event data for send." },
                    "module": { "type": "string", "description": "IPC module for send_ipc." },
                    "message": { "type": "string", "description": "IPC message for send_ipc." },
                    "args": { "type": "array", "description": "IPC args for send_ipc." }
                },
                "required": ["action"]
            }),
            actions: BROADCAST_ACTIONS.iter().map(|s| s.to_string()).collect(),
            edition: "pro".into(),
        },
        ToolDefinition {
            name: "tool_management".into(),
            description: concat!(
                "Manage MCP tool availability at runtime.\n\n",
                "Actions:\n",
                "- list_all: List all registered tools with enabled state.\n",
                "- enable: toolName(REQUIRED). Enable a tool.\n",
                "- disable: toolName(REQUIRED). Disable a tool.\n",
                "- get_stats: Get tool usage statistics.",
            ).into(),
            schema: json!({
                "type": "object",
                "properties": {
                    "action": { "type": "string", "enum": TOOL_MGMT_ACTIONS, "description": "Management action." },
                    "toolName": { "type": "string", "description": "Tool name for enable/disable." }
                },
                "required": ["action"]
            }),
            actions: TOOL_MGMT_ACTIONS.iter().map(|s| s.to_string()).collect(),
            edition: "pro".into(),
        },
    ]
}

pub fn process_preferences(args: &serde_json::Value) -> ExecutionPlan {
    let action = match validate::require_action(args, PREF_ACTIONS) {
        Ok(a) => a,
        Err(plan) => return plan,
    };

    let key_required: &[&str] = &["get", "set", "get_global", "set_global", "get_project", "set_project"];
    if let Err(plan) = validate::require_string_for_actions(args, "key", &action, key_required) {
        return plan;
    }

    ExecutionPlan::single(CallInstruction::BridgePost {
        path: "/api/preferences".into(),
        body: Some(args.clone()),
    })
}

pub fn process_broadcast(args: &serde_json::Value) -> ExecutionPlan {
    let action = match validate::require_action(args, BROADCAST_ACTIONS) {
        Ok(a) => a,
        Err(plan) => return plan,
    };

    match action.as_str() {
        "poll" | "history" | "clear" => {
            ExecutionPlan::single(CallInstruction::BridgeGet {
                path: format!("/api/events/{}", action),
                params: None,
            })
        }
        "send_ipc" => {
            if let Err(plan) = validate::require_string(args, "module") {
                return plan;
            }
            if let Err(plan) = validate::require_string(args, "message") {
                return plan;
            }
            ExecutionPlan::single(CallInstruction::BridgePost {
                path: "/api/events/send-ipc".into(),
                body: Some(args.clone()),
            })
        }
        _ => {
            ExecutionPlan::single(CallInstruction::BridgePost {
                path: "/api/events/send".into(),
                body: Some(args.clone()),
            })
        }
    }
}

pub fn process_tool_management(args: &serde_json::Value) -> ExecutionPlan {
    let action = match validate::require_action(args, TOOL_MGMT_ACTIONS) {
        Ok(a) => a,
        Err(plan) => return plan,
    };

    let name_required: &[&str] = &["enable", "disable"];
    if let Err(plan) = validate::require_string_for_actions(args, "toolName", &action, name_required) {
        return plan;
    }

    ExecutionPlan::single(CallInstruction::BridgePost {
        path: "/api/mcp/tool-management".into(),
        body: Some(args.clone()),
    })
}
