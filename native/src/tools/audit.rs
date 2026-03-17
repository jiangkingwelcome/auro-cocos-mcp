use crate::types::*;
use crate::validate;
use serde_json::{json, Value};

const ACTIONS: &[&str] = &[
    "full_audit",
    "check_performance",
    "check_hierarchy",
    "check_components",
    "check_assets",
    "check_physics",
    "check_ui",
    "auto_fix",
    "export_report",
];

pub fn definitions() -> Vec<ToolDefinition> {
    vec![ToolDefinition {
        name: "scene_audit".into(),
        description: concat!(
            "AI-powered scene audit tool: automatically detect issues and suggest fixes.\n\n",
            "Analyzes the current scene for common problems: performance issues, hierarchy problems, ",
            "missing components, unused assets, physics misconfigurations, and UI layout issues.\n\n",
            "Actions:\n",
            "- full_audit: Run all checks and return a comprehensive report.\n",
            "- check_performance: Check for performance issues (too many nodes, draw calls, etc.).\n",
            "- check_hierarchy: Check node hierarchy (deep nesting, orphans, naming conventions).\n",
            "- check_components: Check for missing/misconfigured components.\n",
            "- check_assets: Check for missing/unused asset references.\n",
            "- check_physics: Check physics setup (missing rigidbodies, collider issues).\n",
            "- check_ui: Check UI layout issues (overlapping, off-screen, missing Canvas).\n",
            "- auto_fix: category(REQUIRED). Automatically fix detected issues in a category.\n",
            "  category: performance, hierarchy, components, physics, ui.\n",
            "- export_report: format(optional). Export audit report. format: json, markdown. Default: json.",
        ).into(),
        schema: json!({
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "enum": ACTIONS,
                    "description": "Audit action to perform."
                },
                "category": {
                    "type": "string",
                    "enum": ["performance", "hierarchy", "components", "physics", "ui"],
                    "description": "Issue category for auto_fix."
                },
                "format": {
                    "type": "string",
                    "enum": ["json", "markdown"],
                    "description": "Report format for export_report. Default: json."
                },
                "severity": {
                    "type": "string",
                    "enum": ["error", "warning", "info", "all"],
                    "description": "Minimum severity to include. Default: all."
                },
                "scope": {
                    "type": "string",
                    "description": "Node UUID to limit audit scope. Default: entire scene."
                }
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

    if action == "auto_fix" {
        if let Err(plan) = validate::require_string(args, "category") {
            return plan;
        }
    }

    match action.as_str() {
        "full_audit" => {
            let scope = args.get("scope").cloned().unwrap_or(Value::Null);
            let severity = args.get("severity").and_then(|v| v.as_str()).unwrap_or("all");

            ExecutionPlan::multi(vec![
                CallInstruction::SceneMethod {
                    method: "dispatchQuery".into(),
                    args: vec![json!({ "action": "tree", "depth": 10 })],
                },
                CallInstruction::SceneMethod {
                    method: "dispatchQuery".into(),
                    args: vec![json!({ "action": "performance_audit" })],
                },
                CallInstruction::SceneMethod {
                    method: "dispatchQuery".into(),
                    args: vec![json!({ "action": "deep_validate_scene" })],
                },
                CallInstruction::BridgePost {
                    path: "/api/mcp/ai/audit".into(),
                    body: Some(json!({
                        "action": "full_audit",
                        "scope": scope,
                        "severity": severity,
                        "treeResult": "$0",
                        "perfResult": "$1",
                        "validationResult": "$2",
                    })),
                },
            ])
        }
        "check_performance" => {
            ExecutionPlan::single(CallInstruction::SceneMethod {
                method: "dispatchQuery".into(),
                args: vec![json!({ "action": "performance_audit" })],
            })
        }
        "check_hierarchy" => {
            ExecutionPlan::single(CallInstruction::SceneMethod {
                method: "dispatchQuery".into(),
                args: vec![json!({ "action": "deep_validate_scene" })],
            })
        }
        _ => {
            ExecutionPlan::single(CallInstruction::BridgePost {
                path: "/api/mcp/ai/audit".into(),
                body: Some(args.clone()),
            })
        }
    }
}
