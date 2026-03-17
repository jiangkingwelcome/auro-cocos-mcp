use crate::types::*;
use crate::validate;
use serde_json::json;

pub fn definitions() -> Vec<ToolDefinition> {
    vec![
        ToolDefinition {
            name: "execute_script".into(),
            description: concat!(
                "Execute arbitrary scene script methods in the Cocos Creator runtime.\n",
                "Allows calling any method defined in the scene script (scene.ts) with custom arguments.\n\n",
                "Parameters:\n",
                "- method(REQUIRED): Scene script method name to call.\n",
                "- args(optional): Array of arguments to pass to the method.",
            ).into(),
            schema: json!({
                "type": "object",
                "properties": {
                    "method": { "type": "string", "description": "Scene script method name to call." },
                    "args": { "type": "array", "description": "Arguments to pass to the method." }
                },
                "required": ["method"]
            }),
            actions: vec!["execute".into()],
            edition: "pro".into(),
        },
        ToolDefinition {
            name: "register_custom_macro".into(),
            description: concat!(
                "Register a custom macro tool at runtime.\n",
                "The macro is defined as a sequence of scene operations that execute atomically.\n\n",
                "Parameters:\n",
                "- name(REQUIRED): Macro name.\n",
                "- description(optional): Macro description.\n",
                "- steps(REQUIRED): Array of operation steps.",
            ).into(),
            schema: json!({
                "type": "object",
                "properties": {
                    "name": { "type": "string", "description": "Macro name." },
                    "description": { "type": "string", "description": "Macro description." },
                    "steps": { "type": "array", "description": "Array of operation steps." }
                },
                "required": ["name", "steps"]
            }),
            actions: vec!["register".into()],
            edition: "pro".into(),
        },
    ]
}

pub fn process_execute(args: &serde_json::Value) -> ExecutionPlan {
    let method = match validate::require_string(args, "method") {
        Ok(m) => m,
        Err(plan) => return plan,
    };

    let script_args = args.get("args").cloned().unwrap_or(json!([]));
    let call_args = if script_args.is_array() {
        script_args.as_array().unwrap().clone()
    } else {
        vec![script_args]
    };

    ExecutionPlan::single(CallInstruction::SceneMethod {
        method,
        args: call_args,
    })
}

pub fn process_register_macro(args: &serde_json::Value) -> ExecutionPlan {
    if let Err(plan) = validate::require_string(args, "name") {
        return plan;
    }

    ExecutionPlan::single(CallInstruction::BridgePost {
        path: "/api/mcp/register-macro".into(),
        body: Some(args.clone()),
    })
}
