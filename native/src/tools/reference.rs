use crate::types::*;
use crate::validate;
use serde_json::json;

const ACTIONS: &[&str] = &[
    "set", "clear", "get", "set_opacity", "set_position", "set_scale", "list",
];

pub fn definitions() -> Vec<ToolDefinition> {
    vec![ToolDefinition {
        name: "reference_image".into(),
        description: concat!(
            "Manage reference image overlays in the scene view for design comparison.\n\n",
            "Actions:\n",
            "- set: url(REQUIRED). Set a reference image overlay.\n",
            "- clear: Remove the current reference image.\n",
            "- get: Get current reference image info.\n",
            "- set_opacity: opacity(REQUIRED, 0-1). Set overlay opacity.\n",
            "- set_position: x/y(REQUIRED). Set overlay position.\n",
            "- set_scale: scale(REQUIRED). Set overlay scale.\n",
            "- list: List all available reference images.",
        ).into(),
        schema: json!({
            "type": "object",
            "properties": {
                "action": { "type": "string", "enum": ACTIONS, "description": "Reference image action." },
                "url": { "type": "string", "description": "Image URL or db:// path. REQUIRED for set." },
                "opacity": { "type": "number", "description": "Opacity 0-1. REQUIRED for set_opacity." },
                "x": { "type": "number", "description": "X position. REQUIRED for set_position." },
                "y": { "type": "number", "description": "Y position. REQUIRED for set_position." },
                "scale": { "type": "number", "description": "Scale factor. REQUIRED for set_scale." }
            },
            "required": ["action"]
        }),
        actions: ACTIONS.iter().map(|s| s.to_string()).collect(),
        edition: "pro".into(),
    }]
}

pub fn process(args: &serde_json::Value) -> ExecutionPlan {
    if let Err(plan) = validate::require_action(args, ACTIONS) {
        return plan;
    }

    ExecutionPlan::single(CallInstruction::BridgePost {
        path: "/api/reference-image".into(),
        body: Some(args.clone()),
    })
}
