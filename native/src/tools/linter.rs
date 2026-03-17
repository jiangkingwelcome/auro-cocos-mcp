use crate::types::*;
use crate::validate;
use serde_json::{json, Value};

const ACTIONS: &[&str] = &[
    "check_all",
    "check_naming",
    "check_hierarchy",
    "check_components",
    "check_assets",
    "check_performance",
    "auto_fix_naming",
    "set_rules",
];

pub fn definitions() -> Vec<ToolDefinition> {
    vec![ToolDefinition {
        name: "project_linter".into(),
        description: concat!(
            "Project standards checker: custom rules + automated checks for Cocos projects.\n",
            "Like ESLint but for scene hierarchy, naming conventions, component usage, and performance.\n\n",
            "Actions:\n",
            "- check_all: Run all rule checks and return a comprehensive report.\n",
            "- check_naming: Check naming conventions (node names, asset names, script names).\n",
            "  Rules: PascalCase nodes, kebab-case assets, max name length.\n",
            "- check_hierarchy: Check hierarchy rules (max depth, max children, Canvas requirement).\n",
            "- check_components: Check component rules (missing rigidbody for collider, empty sprites, unused animations).\n",
            "- check_assets: Check asset rules (unused assets, naming violations, missing meta).\n",
            "- check_performance: Check performance rules (node count, draw calls, texture sizes).\n",
            "- auto_fix_naming: Automatically fix naming violations by renaming nodes/assets.\n",
            "- set_rules: rules(REQUIRED). Set/update custom lint rules. Persisted to .mcp-lint-rules.json.\n\n",
            "Default rules: nodes=PascalCase, assets=kebab-case, maxDepth=10, maxChildren=50, maxNodes=500, maxTextureSize=2048.",
        ).into(),
        schema: json!({
            "type": "object",
            "properties": {
                "action": { "type": "string", "enum": ACTIONS, "description": "Linter action to perform." },
                "category": {
                    "type": "string",
                    "enum": ["naming", "hierarchy", "components", "assets", "performance"],
                    "description": "Filter results by category."
                },
                "severity": {
                    "type": "string",
                    "enum": ["error", "warning", "info", "all"],
                    "description": "Minimum severity to report. Default: all."
                },
                "autoFix": {
                    "type": "boolean",
                    "description": "If true, auto-fix issues where possible. Default: false."
                },
                "rules": {
                    "type": "object",
                    "description": "Custom lint rules. REQUIRED for set_rules. Merged with defaults.",
                    "properties": {
                        "naming": {
                            "type": "object",
                            "properties": {
                                "nodePattern": { "type": "string", "description": "Node naming pattern: PascalCase, camelCase, snake_case." },
                                "assetPattern": { "type": "string", "description": "Asset naming pattern: kebab-case, snake_case." },
                                "scriptPattern": { "type": "string", "description": "Script naming pattern: PascalCase." },
                                "maxNameLength": { "type": "integer", "description": "Max name length. Default: 32." }
                            }
                        },
                        "hierarchy": {
                            "type": "object",
                            "properties": {
                                "maxDepth": { "type": "integer", "description": "Max hierarchy depth. Default: 10." },
                                "maxChildren": { "type": "integer", "description": "Max children per node. Default: 50." },
                                "requireCanvasForUi": { "type": "boolean", "description": "Require Canvas for UI nodes. Default: true." }
                            }
                        },
                        "components": {
                            "type": "object",
                            "properties": {
                                "warnEmptySprite": { "type": "boolean", "description": "Warn on Sprite without spriteFrame. Default: true." },
                                "warnMissingRigidbody": { "type": "boolean", "description": "Warn on Collider without RigidBody. Default: true." },
                                "warnUnusedAnimation": { "type": "boolean", "description": "Warn on Animation without clips. Default: true." }
                            }
                        },
                        "performance": {
                            "type": "object",
                            "properties": {
                                "maxNodes": { "type": "integer", "description": "Max total nodes. Default: 500." },
                                "maxDrawCalls": { "type": "integer", "description": "Max estimated draw calls. Default: 100." },
                                "maxTextureSize": { "type": "integer", "description": "Max texture dimension. Default: 2048." },
                                "warnLargeHierarchy": { "type": "integer", "description": "Warn if subtree exceeds this. Default: 200." }
                            }
                        }
                    }
                },
                "scope": { "type": "string", "description": "Node UUID to limit check scope. Default: entire scene." }
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

    let severity = args.get("severity").and_then(|v| v.as_str()).unwrap_or("all");
    let scope = args.get("scope").cloned().unwrap_or(Value::Null);

    match action.as_str() {
        "check_all" => {
            ExecutionPlan::multi(vec![
                CallInstruction::SceneMethod {
                    method: "dispatchQuery".into(),
                    args: vec![json!({ "action": "tree", "depth": 20 })],
                },
                CallInstruction::SceneMethod {
                    method: "dispatchQuery".into(),
                    args: vec![json!({ "action": "performance_audit" })],
                },
                CallInstruction::SceneMethod {
                    method: "dispatchQuery".into(),
                    args: vec![json!({ "action": "deep_validate_scene" })],
                },
                CallInstruction::EditorMsg {
                    module: "asset-db".into(),
                    message: "query-assets".into(),
                    args: vec![json!({ "pattern": "db://assets/**" })],
                },
                CallInstruction::BridgePost {
                    path: "/api/mcp/ai/lint".into(),
                    body: Some(json!({
                        "action": "check_all",
                        "severity": severity,
                        "scope": scope,
                        "treeResult": "$0",
                        "perfResult": "$1",
                        "validationResult": "$2",
                        "assetsResult": "$3",
                        "rules": default_rules(),
                        "customRules": args.get("rules").cloned(),
                    })),
                },
            ])
        }

        "check_naming" => {
            ExecutionPlan::multi(vec![
                CallInstruction::SceneMethod {
                    method: "dispatchQuery".into(),
                    args: vec![json!({ "action": "tree", "depth": 20 })],
                },
                CallInstruction::BridgePost {
                    path: "/api/mcp/ai/lint".into(),
                    body: Some(json!({
                        "action": "check_naming",
                        "severity": severity,
                        "scope": scope,
                        "treeResult": "$0",
                        "rules": default_rules(),
                        "customRules": args.get("rules").cloned(),
                    })),
                },
            ])
        }

        "check_hierarchy" => {
            ExecutionPlan::multi(vec![
                CallInstruction::SceneMethod {
                    method: "dispatchQuery".into(),
                    args: vec![json!({ "action": "deep_validate_scene" })],
                },
                CallInstruction::BridgePost {
                    path: "/api/mcp/ai/lint".into(),
                    body: Some(json!({
                        "action": "check_hierarchy",
                        "severity": severity,
                        "scope": scope,
                        "validationResult": "$0",
                        "rules": default_rules(),
                        "customRules": args.get("rules").cloned(),
                    })),
                },
            ])
        }

        "check_components" => {
            ExecutionPlan::multi(vec![
                CallInstruction::SceneMethod {
                    method: "dispatchQuery".into(),
                    args: vec![json!({ "action": "tree", "depth": 20 })],
                },
                CallInstruction::BridgePost {
                    path: "/api/mcp/ai/lint".into(),
                    body: Some(json!({
                        "action": "check_components",
                        "severity": severity,
                        "scope": scope,
                        "treeResult": "$0",
                        "rules": default_rules(),
                        "customRules": args.get("rules").cloned(),
                    })),
                },
            ])
        }

        "check_assets" => {
            ExecutionPlan::multi(vec![
                CallInstruction::EditorMsg {
                    module: "asset-db".into(),
                    message: "query-assets".into(),
                    args: vec![json!({ "pattern": "db://assets/**" })],
                },
                CallInstruction::BridgePost {
                    path: "/api/mcp/ai/lint".into(),
                    body: Some(json!({
                        "action": "check_assets",
                        "severity": severity,
                        "assetsResult": "$0",
                        "rules": default_rules(),
                        "customRules": args.get("rules").cloned(),
                    })),
                },
            ])
        }

        "check_performance" => {
            ExecutionPlan::multi(vec![
                CallInstruction::SceneMethod {
                    method: "dispatchQuery".into(),
                    args: vec![json!({ "action": "performance_audit" })],
                },
                CallInstruction::BridgePost {
                    path: "/api/mcp/ai/lint".into(),
                    body: Some(json!({
                        "action": "check_performance",
                        "severity": severity,
                        "scope": scope,
                        "perfResult": "$0",
                        "rules": default_rules(),
                        "customRules": args.get("rules").cloned(),
                    })),
                },
            ])
        }

        "auto_fix_naming" => {
            ExecutionPlan::single(CallInstruction::BridgePost {
                path: "/api/mcp/ai/lint-fix".into(),
                body: Some(json!({
                    "action": "auto_fix_naming",
                    "scope": scope,
                    "rules": default_rules(),
                    "customRules": args.get("rules").cloned(),
                })),
            })
        }

        "set_rules" => {
            if args.get("rules").is_none() {
                return ExecutionPlan::error_with_suggestion(
                    "Missing required parameter: rules (required for set_rules)",
                    "Provide rules object with naming/hierarchy/components/performance sections",
                );
            }
            ExecutionPlan::single(CallInstruction::BridgePost {
                path: "/api/mcp/ai/lint-rules".into(),
                body: Some(args.clone()),
            })
        }

        _ => ExecutionPlan::error(&format!("Unknown linter action: {}", action)),
    }
}

fn default_rules() -> Value {
    json!({
        "naming": {
            "nodePattern": "PascalCase",
            "assetPattern": "kebab-case",
            "scriptPattern": "PascalCase",
            "maxNameLength": 32
        },
        "hierarchy": {
            "maxDepth": 10,
            "maxChildren": 50,
            "requireCanvasForUi": true
        },
        "components": {
            "warnEmptySprite": true,
            "warnMissingRigidbody": true,
            "warnUnusedAnimation": true
        },
        "performance": {
            "maxNodes": 500,
            "maxDrawCalls": 100,
            "maxTextureSize": 2048,
            "warnLargeHierarchy": 200
        }
    })
}
