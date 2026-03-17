use crate::types::*;
use crate::validate;
use serde_json::{json, Value};

const ACTIONS: &[&str] = &[
    "generate_component",
    "generate_and_attach",
    "list_templates",
    "from_template",
    "add_properties",
    "generate_event_handler",
];

const CLASS_REQUIRED: &[&str] = &[
    "generate_component", "generate_and_attach",
    "from_template", "add_properties", "generate_event_handler",
];

pub fn definitions() -> Vec<ToolDefinition> {
    vec![ToolDefinition {
        name: "script_scaffold".into(),
        description: concat!(
            "Smart script scaffolding: generate TypeScript component scripts, attach to nodes, and configure properties in one step.\n\n",
            "Actions:\n",
            "- generate_component: className(REQUIRED), description(optional), savePath(optional). ",
            "Generate a component script and save to project assets.\n",
            "- generate_and_attach: className(REQUIRED), uuid(REQUIRED), savePath(optional), properties(optional). ",
            "Generate script + attach to node + set initial properties. The core one-step action.\n",
            "- list_templates: List available script templates (controller, manager, ui-handler, data-model, singleton, fsm).\n",
            "- from_template: className(REQUIRED), template(REQUIRED), savePath(optional). ",
            "Generate script from a preset template.\n",
            "- add_properties: className(REQUIRED), properties(REQUIRED). ",
            "Add @property declarations to an existing script.\n",
            "- generate_event_handler: className(REQUIRED), uuid(REQUIRED), events(REQUIRED). ",
            "Generate event handler script and bind events to node.\n\n",
            "Templates: controller (start/update lifecycle), manager (singleton pattern), ",
            "ui-handler (button/slider/toggle events), data-model (@property serialization), ",
            "singleton (strict singleton), fsm (finite state machine).",
        ).into(),
        schema: json!({
            "type": "object",
            "properties": {
                "action": { "type": "string", "enum": ACTIONS, "description": "Scaffold action to perform." },
                "className": { "type": "string", "description": "Script class name (PascalCase). REQUIRED for most actions." },
                "uuid": { "type": "string", "description": "Target node UUID. REQUIRED for generate_and_attach and generate_event_handler." },
                "description": { "type": "string", "description": "Natural language description of the component's purpose." },
                "template": {
                    "type": "string",
                    "enum": ["controller", "manager", "ui-handler", "data-model", "singleton", "fsm"],
                    "description": "Script template. REQUIRED for from_template."
                },
                "savePath": { "type": "string", "description": "Asset path to save script. Default: db://assets/scripts/" },
                "properties": {
                    "type": "array",
                    "description": "Properties to add. For generate_and_attach and add_properties.",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": { "type": "string", "description": "Property name." },
                            "type": { "type": "string", "description": "Property type: number, string, boolean, Vec3, Color, Node." },
                            "default": { "description": "Default value." }
                        },
                        "required": ["name", "type"]
                    }
                },
                "events": {
                    "type": "array",
                    "description": "Events to bind. REQUIRED for generate_event_handler.",
                    "items": {
                        "type": "object",
                        "properties": {
                            "event": { "type": "string", "description": "Event name: click, touch-start, touch-end, value-changed." },
                            "handler": { "type": "string", "description": "Handler method name." }
                        },
                        "required": ["event", "handler"]
                    }
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

    if let Err(plan) = validate::require_string_for_actions(args, "className", &action, CLASS_REQUIRED) {
        return plan;
    }

    match action.as_str() {
        "list_templates" => {
            ExecutionPlan::single(CallInstruction::BridgePost {
                path: "/api/mcp/ai/scaffold".into(),
                body: Some(json!({
                    "action": "list_templates",
                    "templates": [
                        { "name": "controller", "description": "Basic component with start/update/onEnable/onDisable lifecycle methods" },
                        { "name": "manager", "description": "Singleton manager with static instance and lifecycle management" },
                        { "name": "ui-handler", "description": "UI event handler with onButtonClick/onSliderChange/onToggle methods" },
                        { "name": "data-model", "description": "Data model with @property declarations and serialization" },
                        { "name": "singleton", "description": "Strict singleton pattern with instance guard" },
                        { "name": "fsm", "description": "Finite state machine with states/transitions/currentState" }
                    ]
                })),
            })
        }

        "generate_component" | "from_template" | "add_properties" => {
            ExecutionPlan::single(CallInstruction::BridgePost {
                path: "/api/mcp/ai/scaffold".into(),
                body: Some(args.clone()),
            })
        }

        "generate_and_attach" => {
            if let Err(plan) = validate::require_string(args, "uuid") {
                return plan;
            }
            let class_name = args.get("className").and_then(|v| v.as_str()).unwrap_or("");
            let save_path = args.get("savePath").and_then(|v| v.as_str())
                .unwrap_or("db://assets/scripts/");
            let uuid = args.get("uuid").cloned().unwrap_or(Value::Null);

            let mut calls = vec![
                CallInstruction::BridgePost {
                    path: "/api/mcp/ai/scaffold".into(),
                    body: Some(json!({
                        "action": "generate_component",
                        "className": class_name,
                        "description": args.get("description").cloned(),
                        "template": args.get("template").cloned(),
                        "savePath": save_path,
                        "properties": args.get("properties").cloned(),
                    })),
                },
                CallInstruction::EditorMsg {
                    module: "asset-db".into(),
                    message: "refresh-asset".into(),
                    args: vec![json!(save_path)],
                },
                CallInstruction::SceneMethod {
                    method: "dispatchOperation".into(),
                    args: vec![json!({
                        "action": "attach_script",
                        "uuid": uuid,
                        "scriptName": class_name,
                    })],
                },
            ];

            if let Some(props) = args.get("properties") {
                if props.is_array() && !props.as_array().unwrap().is_empty() {
                    calls.push(CallInstruction::SceneMethod {
                        method: "dispatchOperation".into(),
                        args: vec![json!({
                            "action": "set_component_properties",
                            "uuid": uuid,
                            "component": class_name,
                            "properties": props,
                        })],
                    });
                }
            }

            ExecutionPlan::multi(calls)
        }

        "generate_event_handler" => {
            if let Err(plan) = validate::require_string(args, "uuid") {
                return plan;
            }
            if args.get("events").and_then(|v| v.as_array()).map_or(true, |a| a.is_empty()) {
                return ExecutionPlan::error_with_suggestion(
                    "Missing required parameter: events (required for generate_event_handler)",
                    "Provide events array: [{event: 'click', handler: 'onButtonClick'}]",
                );
            }

            let class_name = args.get("className").and_then(|v| v.as_str()).unwrap_or("");
            let save_path = args.get("savePath").and_then(|v| v.as_str())
                .unwrap_or("db://assets/scripts/");
            let uuid = args.get("uuid").cloned().unwrap_or(Value::Null);
            let events = args.get("events").cloned().unwrap_or(json!([]));

            let mut calls = vec![
                CallInstruction::BridgePost {
                    path: "/api/mcp/ai/scaffold".into(),
                    body: Some(json!({
                        "action": "generate_event_handler",
                        "className": class_name,
                        "savePath": save_path,
                        "events": events,
                    })),
                },
                CallInstruction::EditorMsg {
                    module: "asset-db".into(),
                    message: "refresh-asset".into(),
                    args: vec![json!(save_path)],
                },
                CallInstruction::SceneMethod {
                    method: "dispatchOperation".into(),
                    args: vec![json!({
                        "action": "attach_script",
                        "uuid": uuid,
                        "scriptName": class_name,
                    })],
                },
            ];

            if let Some(evts) = events.as_array() {
                for evt in evts {
                    let event_name = evt.get("event").and_then(|v| v.as_str()).unwrap_or("");
                    let handler = evt.get("handler").and_then(|v| v.as_str()).unwrap_or("");
                    if !event_name.is_empty() && !handler.is_empty() {
                        calls.push(CallInstruction::SceneMethod {
                            method: "dispatchOperation".into(),
                            args: vec![json!({
                                "action": "bind_event",
                                "uuid": uuid,
                                "event": event_name,
                                "handler": handler,
                                "component": class_name,
                            })],
                        });
                    }
                }
            }

            ExecutionPlan::multi(calls)
        }

        _ => ExecutionPlan::error(&format!("Unknown scaffold action: {}", action)),
    }
}
