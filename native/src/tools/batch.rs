use crate::types::*;
use crate::validate;
use serde_json::{json, Value};

const ACTIONS: &[&str] = &[
    "find_and_modify",
    "find_and_delete",
    "find_and_add_component",
    "find_and_remove_component",
    "find_and_set_property",
    "find_and_reparent",
    "transform_all",
    "rename_pattern",
    "set_layer_recursive",
    "toggle_active_recursive",
];

pub fn definitions() -> Vec<ToolDefinition> {
    vec![ToolDefinition {
        name: "batch_engine".into(),
        description: concat!(
            "Batch operation engine: match nodes by pattern and apply bulk transformations.\n\n",
            "This tool finds nodes matching a filter criteria and applies the same operation to all of them. ",
            "Much more efficient than calling scene_operation in a loop.\n\n",
            "Actions:\n",
            "- find_and_modify: filter(REQUIRED), modifications(REQUIRED). Find matching nodes and modify properties.\n",
            "- find_and_delete: filter(REQUIRED), confirmDangerous=true(REQUIRED). Delete all matching nodes.\n",
            "- find_and_add_component: filter(REQUIRED), component(REQUIRED). Add component to all matches.\n",
            "- find_and_remove_component: filter(REQUIRED), component(REQUIRED). Remove component from matches.\n",
            "- find_and_set_property: filter(REQUIRED), component(REQUIRED), property(REQUIRED), value(REQUIRED).\n",
            "- find_and_reparent: filter(REQUIRED), newParent(REQUIRED). Move all matches under new parent.\n",
            "- transform_all: filter(REQUIRED), transform(REQUIRED). Apply position/rotation/scale delta.\n",
            "- rename_pattern: filter(REQUIRED), pattern(REQUIRED), replacement(REQUIRED). Regex rename.\n",
            "- set_layer_recursive: uuid(REQUIRED), layer(REQUIRED). Set layer for node and all descendants.\n",
            "- toggle_active_recursive: uuid(REQUIRED), active(REQUIRED). Set active for node tree.\n\n",
            "Filter format: { namePattern?, componentFilter?, layerFilter?, activeFilter?, parentUuid?, maxDepth? }",
        ).into(),
        schema: json!({
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "enum": ACTIONS,
                    "description": "Batch action to perform."
                },
                "filter": {
                    "type": "object",
                    "description": "Node filter criteria: { namePattern?, componentFilter?, layerFilter?, activeFilter?, parentUuid?, maxDepth? }",
                    "properties": {
                        "namePattern": { "type": "string", "description": "Regex pattern to match node names." },
                        "componentFilter": { "type": "string", "description": "Component type name to filter by." },
                        "layerFilter": { "type": "number", "description": "Layer mask to filter by." },
                        "activeFilter": { "type": "boolean", "description": "Filter by active state." },
                        "parentUuid": { "type": "string", "description": "Only search under this parent." },
                        "maxDepth": { "type": "number", "description": "Max search depth. Default: unlimited." }
                    }
                },
                "uuid": { "type": "string", "description": "Root node UUID for recursive operations." },
                "component": { "type": "string", "description": "Component type name." },
                "property": { "type": "string", "description": "Property name." },
                "value": { "description": "Property value." },
                "newParent": { "type": "string", "description": "New parent UUID for reparent." },
                "modifications": { "type": "object", "description": "Properties to modify on matched nodes." },
                "transform": {
                    "type": "object",
                    "description": "Transform delta: { position?, rotation?, scale? }",
                    "properties": {
                        "position": { "type": "object", "description": "Position delta {x, y, z}." },
                        "rotation": { "type": "object", "description": "Rotation delta {x, y, z}." },
                        "scale": { "type": "object", "description": "Scale multiplier {x, y, z}." }
                    }
                },
                "pattern": { "type": "string", "description": "Regex pattern for rename_pattern." },
                "replacement": { "type": "string", "description": "Replacement string for rename_pattern." },
                "layer": { "type": "number", "description": "Layer value for set_layer_recursive." },
                "active": { "type": "boolean", "description": "Active state for toggle_active_recursive." },
                "confirmDangerous": { "type": "boolean", "description": "REQUIRED=true for find_and_delete." }
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
        "set_layer_recursive" | "toggle_active_recursive" => {
            if let Err(plan) = validate::require_string(args, "uuid") {
                return plan;
            }
        }
        "find_and_delete" => {
            let confirmed = args.get("confirmDangerous").and_then(|v| v.as_bool()).unwrap_or(false);
            if !confirmed {
                return ExecutionPlan::error_with_suggestion(
                    "find_and_delete is a destructive batch operation",
                    "Set confirmDangerous=true to proceed.",
                );
            }
        }
        _ => {
            if args.get("filter").is_none() {
                return ExecutionPlan::error_with_suggestion(
                    "Missing required parameter: filter",
                    "Provide a filter object: { namePattern?, componentFilter?, layerFilter?, parentUuid? }",
                );
            }
        }
    }

    ExecutionPlan::single(CallInstruction::BridgePost {
        path: "/api/mcp/ai/batch".into(),
        body: Some(args.clone()),
    })
}
