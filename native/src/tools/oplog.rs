use crate::types::*;
use crate::validate;
use serde_json::{json, Value};

const ACTIONS: &[&str] = &[
    "get_history",
    "get_stats",
    "export_log",
    "export_script",
    "replay_last",
    "replay_from_log",
    "clear_history",
    "bookmark",
];

pub fn definitions() -> Vec<ToolDefinition> {
    vec![ToolDefinition {
        name: "operation_log".into(),
        description: concat!(
            "Operation log and replay: record, export, and replay MCP operations.\n",
            "Uses the built-in operation history to provide audit trail and reproducibility.\n\n",
            "Actions:\n",
            "- get_history: filter(optional). Get operation history with optional filtering.\n",
            "  Filter: { tool?, action?, since?(ISO date), until?(ISO date), limit?(default 50) }\n",
            "- get_stats: Get operation statistics grouped by tool and action (call counts, avg duration).\n",
            "- export_log: format(optional: json/script), savePath(optional). Export operation log to file.\n",
            "  json: Raw operation records. script: Replayable TypeScript code.\n",
            "- export_script: savePath(optional). Export as executable TypeScript replay script.\n",
            "- replay_last: count(optional, default 10). Replay the last N operations.\n",
            "- replay_from_log: log(REQUIRED). Replay operations from an exported JSON log.\n",
            "- clear_history: Clear all operation history. confirmDangerous=true REQUIRED.\n",
            "- bookmark: label(REQUIRED). Add a named bookmark at the current point in history.",
        ).into(),
        schema: json!({
            "type": "object",
            "properties": {
                "action": { "type": "string", "enum": ACTIONS, "description": "Operation log action." },
                "filter": {
                    "type": "object",
                    "description": "History filter for get_history.",
                    "properties": {
                        "tool": { "type": "string", "description": "Filter by tool name." },
                        "action": { "type": "string", "description": "Filter by action name." },
                        "since": { "type": "string", "description": "Start date (ISO 8601)." },
                        "until": { "type": "string", "description": "End date (ISO 8601)." },
                        "limit": { "type": "integer", "description": "Max records. Default: 50." }
                    }
                },
                "count": { "type": "integer", "description": "Number of operations to replay. For replay_last. Default: 10." },
                "format": {
                    "type": "string",
                    "enum": ["json", "script"],
                    "description": "Export format. Default: json."
                },
                "savePath": { "type": "string", "description": "Asset path to save export. Default: db://assets/mcp-logs/" },
                "log": {
                    "type": "array",
                    "description": "Operation records to replay. REQUIRED for replay_from_log.",
                    "items": { "type": "object" }
                },
                "label": { "type": "string", "description": "Bookmark label. REQUIRED for bookmark." },
                "confirmDangerous": { "type": "boolean", "description": "REQUIRED=true for clear_history." }
            },
            "required": ["action"]
        }),
        actions: ACTIONS.iter().map(|s| s.to_string()).collect(),
        edition: "pro".into(),
    }]
}

pub fn process(args: &Value) -> ExecutionPlan {
    let action = match validate::require_action(args, ACTIONS) {
        Ok(a) => a,
        Err(plan) => return plan,
    };

    match action.as_str() {
        "get_history" => {
            let filter = args.get("filter").cloned().unwrap_or(json!({}));
            let limit = filter.get("limit").and_then(|v| v.as_u64()).unwrap_or(50);

            let mut params = json!({ "limit": limit });
            if let Some(tool) = filter.get("tool") { params["tool"] = tool.clone(); }
            if let Some(act) = filter.get("action") { params["action"] = act.clone(); }
            if let Some(since) = filter.get("since") { params["since"] = since.clone(); }
            if let Some(until) = filter.get("until") { params["until"] = until.clone(); }

            ExecutionPlan::single(CallInstruction::BridgeGet {
                path: "/api/operations/history".into(),
                params: Some(params),
            })
        }

        "get_stats" => {
            ExecutionPlan::single(CallInstruction::BridgePost {
                path: "/api/mcp/ai/oplog-stats".into(),
                body: Some(json!({ "action": "get_stats" })),
            })
        }

        "export_log" => {
            let format = args.get("format").and_then(|v| v.as_str()).unwrap_or("json");
            let save_path = args.get("savePath").and_then(|v| v.as_str())
                .unwrap_or("db://assets/mcp-logs/");

            ExecutionPlan::single(CallInstruction::BridgePost {
                path: "/api/mcp/ai/oplog-export".into(),
                body: Some(json!({
                    "action": "export_log",
                    "format": format,
                    "savePath": save_path,
                    "filter": args.get("filter").cloned(),
                })),
            })
        }

        "export_script" => {
            let save_path = args.get("savePath").and_then(|v| v.as_str())
                .unwrap_or("db://assets/mcp-logs/");

            ExecutionPlan::single(CallInstruction::BridgePost {
                path: "/api/mcp/ai/oplog-export".into(),
                body: Some(json!({
                    "action": "export_script",
                    "format": "script",
                    "savePath": save_path,
                    "filter": args.get("filter").cloned(),
                })),
            })
        }

        "replay_last" => {
            let count = args.get("count").and_then(|v| v.as_u64()).unwrap_or(10);

            ExecutionPlan::single(CallInstruction::BridgePost {
                path: "/api/mcp/ai/oplog-replay".into(),
                body: Some(json!({
                    "action": "replay_last",
                    "count": count,
                })),
            })
        }

        "replay_from_log" => {
            if args.get("log").and_then(|v| v.as_array()).map_or(true, |a| a.is_empty()) {
                return ExecutionPlan::error_with_suggestion(
                    "Missing required parameter: log (required for replay_from_log)",
                    "Provide log array of operation records from a previous export",
                );
            }

            ExecutionPlan::single(CallInstruction::BridgePost {
                path: "/api/mcp/ai/oplog-replay".into(),
                body: Some(json!({
                    "action": "replay_from_log",
                    "log": args.get("log").cloned(),
                })),
            })
        }

        "clear_history" => {
            let confirmed = args.get("confirmDangerous").and_then(|v| v.as_bool()).unwrap_or(false);
            if !confirmed {
                return ExecutionPlan::error_with_suggestion(
                    "clear_history is a destructive operation",
                    "Set confirmDangerous=true to proceed.",
                );
            }

            ExecutionPlan::single(CallInstruction::BridgePost {
                path: "/api/operations/clear-history".into(),
                body: None,
            })
        }

        "bookmark" => {
            if let Err(plan) = validate::require_string(args, "label") {
                return plan;
            }

            ExecutionPlan::single(CallInstruction::BridgePost {
                path: "/api/mcp/ai/oplog-bookmark".into(),
                body: Some(json!({
                    "action": "bookmark",
                    "label": args.get("label").cloned(),
                })),
            })
        }

        _ => ExecutionPlan::error(&format!("Unknown operation_log action: {}", action)),
    }
}
