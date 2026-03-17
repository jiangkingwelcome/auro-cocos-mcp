use crate::types::*;
use crate::validate;
use serde_json::{json, Value};

const ACTIONS: &[&str] = &[
    "create_scene",
    "create_ui_page",
    "create_game_level",
    "create_menu",
    "describe_intent",
];

pub fn definitions() -> Vec<ToolDefinition> {
    vec![ToolDefinition {
        name: "scene_generator".into(),
        description: concat!(
            "AI-powered scene generator: describe what you want in natural language, ",
            "and this tool creates the complete scene structure with nodes, components, and properties.\n\n",
            "This tool internally generates an ExecutionPlan with 10-50+ atomic operations ",
            "(create_node, add_component, set_property, etc.) and executes them in sequence.\n\n",
            "Actions:\n",
            "- create_scene: prompt(REQUIRED). Generate a complete scene from description.\n",
            "  Examples: 'a 2D platformer level with ground, platforms, and a player'\n",
            "- create_ui_page: prompt(REQUIRED). Generate a UI page (login, settings, shop, etc.).\n",
            "  Examples: 'a login page with email/password fields and a submit button'\n",
            "- create_game_level: prompt(REQUIRED), levelType(optional). Generate a game level.\n",
            "  levelType: platformer, top-down, puzzle, runner, shooter.\n",
            "- create_menu: prompt(REQUIRED), menuType(optional). Generate a menu screen.\n",
            "  menuType: main, pause, settings, game-over, level-select.\n",
            "- describe_intent: prompt(REQUIRED). Analyze the intent and return a plan without executing.",
        ).into(),
        schema: json!({
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "enum": ACTIONS,
                    "description": "Generator action."
                },
                "prompt": {
                    "type": "string",
                    "description": "Natural language description of what to create. REQUIRED."
                },
                "parentUuid": {
                    "type": "string",
                    "description": "Parent node UUID. Default: scene root or Canvas."
                },
                "levelType": {
                    "type": "string",
                    "enum": ["platformer", "top-down", "puzzle", "runner", "shooter"],
                    "description": "Game level type for create_game_level."
                },
                "menuType": {
                    "type": "string",
                    "enum": ["main", "pause", "settings", "game-over", "level-select"],
                    "description": "Menu type for create_menu."
                },
                "style": {
                    "type": "string",
                    "enum": ["minimal", "detailed", "production"],
                    "description": "Generation detail level. Default: detailed."
                }
            },
            "required": ["action", "prompt"]
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

    if let Err(plan) = validate::require_string(args, "prompt") {
        return plan;
    }

    match action.as_str() {
        "describe_intent" => {
            ExecutionPlan::single(CallInstruction::BridgePost {
                path: "/api/mcp/ai/describe-intent".into(),
                body: Some(args.clone()),
            })
        }
        "create_scene" => generate_scene(args),
        "create_ui_page" => generate_ui_page(args),
        "create_game_level" => generate_game_level(args),
        "create_menu" => generate_menu(args),
        _ => ExecutionPlan::error(&format!("Unknown generator action: {}", action)),
    }
}

fn get_parent(args: &Value) -> Value {
    args.get("parentUuid")
        .cloned()
        .unwrap_or(Value::Null)
}

fn generate_scene(args: &Value) -> ExecutionPlan {
    let parent = get_parent(args);
    let prompt = args.get("prompt").and_then(|v| v.as_str()).unwrap_or("");

    let mut calls = vec![
        CallInstruction::SceneMethod {
            method: "dispatchOperation".into(),
            args: vec![json!({
                "action": "create_node",
                "name": "GeneratedScene",
                "parent": parent,
            })],
        },
    ];

    if prompt.contains("camera") || prompt.contains("相机") {
        calls.push(CallInstruction::SceneMethod {
            method: "dispatchOperation".into(),
            args: vec![json!({
                "action": "create_camera",
                "name": "MainCamera",
                "parent": "$0.uuid",
            })],
        });
    }

    if prompt.contains("light") || prompt.contains("灯光") {
        calls.push(CallInstruction::SceneMethod {
            method: "dispatchOperation".into(),
            args: vec![json!({
                "action": "create_light",
                "lightType": "directional",
                "name": "MainLight",
                "parent": "$0.uuid",
            })],
        });
    }

    if prompt.contains("canvas") || prompt.contains("ui") || prompt.contains("UI")
        || prompt.contains("界面") || prompt.contains("2D") || prompt.contains("2d")
    {
        calls.push(CallInstruction::SceneMethod {
            method: "dispatchOperation".into(),
            args: vec![json!({ "action": "ensure_2d_canvas" })],
        });
    }

    ExecutionPlan::multi(calls)
}

fn generate_ui_page(args: &Value) -> ExecutionPlan {
    let prompt = args.get("prompt").and_then(|v| v.as_str()).unwrap_or("");

    let mut calls = vec![
        CallInstruction::SceneMethod {
            method: "dispatchOperation".into(),
            args: vec![json!({ "action": "ensure_2d_canvas" })],
        },
        CallInstruction::SceneMethod {
            method: "dispatchOperation".into(),
            args: vec![json!({
                "action": "create_node",
                "name": "UIPage",
                "parent": "$0.uuid",
            })],
        },
        CallInstruction::SceneMethod {
            method: "dispatchOperation".into(),
            args: vec![json!({
                "action": "add_component",
                "uuid": "$1.uuid",
                "component": "Widget",
            })],
        },
    ];

    if prompt.contains("title") || prompt.contains("标题") {
        calls.push(CallInstruction::SceneMethod {
            method: "dispatchOperation".into(),
            args: vec![json!({
                "action": "create_ui_widget",
                "widgetType": "label",
                "name": "Title",
                "parent": "$1.uuid",
                "text": "Title",
            })],
        });
    }

    if prompt.contains("button") || prompt.contains("按钮") {
        calls.push(CallInstruction::SceneMethod {
            method: "dispatchOperation".into(),
            args: vec![json!({
                "action": "create_ui_widget",
                "widgetType": "button",
                "name": "ActionButton",
                "parent": "$1.uuid",
                "text": "Submit",
            })],
        });
    }

    if prompt.contains("input") || prompt.contains("输入") || prompt.contains("field") {
        calls.push(CallInstruction::SceneMethod {
            method: "dispatchOperation".into(),
            args: vec![json!({
                "action": "create_ui_widget",
                "widgetType": "editbox",
                "name": "InputField",
                "parent": "$1.uuid",
            })],
        });
    }

    ExecutionPlan::multi(calls)
}

fn generate_game_level(args: &Value) -> ExecutionPlan {
    let level_type = args.get("levelType").and_then(|v| v.as_str()).unwrap_or("platformer");

    let mut calls = vec![
        CallInstruction::SceneMethod {
            method: "dispatchOperation".into(),
            args: vec![json!({
                "action": "create_node",
                "name": format!("Level_{}", level_type),
            })],
        },
    ];

    match level_type {
        "platformer" => {
            calls.push(CallInstruction::SceneMethod {
                method: "dispatchOperation".into(),
                args: vec![json!({
                    "action": "create_node",
                    "name": "Ground",
                    "parent": "$0.uuid",
                })],
            });
            calls.push(CallInstruction::SceneMethod {
                method: "dispatchOperation".into(),
                args: vec![json!({
                    "action": "add_component",
                    "uuid": "$1.uuid",
                    "component": "BoxCollider2D",
                })],
            });
            calls.push(CallInstruction::SceneMethod {
                method: "dispatchOperation".into(),
                args: vec![json!({
                    "action": "create_node",
                    "name": "Player",
                    "parent": "$0.uuid",
                })],
            });
            calls.push(CallInstruction::SceneMethod {
                method: "dispatchOperation".into(),
                args: vec![json!({
                    "action": "add_component",
                    "uuid": "$3.uuid",
                    "component": "Sprite",
                })],
            });
            calls.push(CallInstruction::SceneMethod {
                method: "dispatchOperation".into(),
                args: vec![json!({
                    "action": "add_component",
                    "uuid": "$3.uuid",
                    "component": "RigidBody2D",
                })],
            });
        }
        _ => {
            calls.push(CallInstruction::SceneMethod {
                method: "dispatchOperation".into(),
                args: vec![json!({
                    "action": "create_node",
                    "name": "Environment",
                    "parent": "$0.uuid",
                })],
            });
            calls.push(CallInstruction::SceneMethod {
                method: "dispatchOperation".into(),
                args: vec![json!({
                    "action": "create_node",
                    "name": "Player",
                    "parent": "$0.uuid",
                })],
            });
        }
    }

    ExecutionPlan::multi(calls)
}

fn generate_menu(args: &Value) -> ExecutionPlan {
    let menu_type = args.get("menuType").and_then(|v| v.as_str()).unwrap_or("main");

    let mut calls = vec![
        CallInstruction::SceneMethod {
            method: "dispatchOperation".into(),
            args: vec![json!({ "action": "ensure_2d_canvas" })],
        },
        CallInstruction::SceneMethod {
            method: "dispatchOperation".into(),
            args: vec![json!({
                "action": "create_node",
                "name": format!("{}Menu", capitalize(menu_type)),
                "parent": "$0.uuid",
            })],
        },
        CallInstruction::SceneMethod {
            method: "dispatchOperation".into(),
            args: vec![json!({
                "action": "add_component",
                "uuid": "$1.uuid",
                "component": "Widget",
            })],
        },
    ];

    let title = match menu_type {
        "main" => "Game Title",
        "pause" => "Paused",
        "settings" => "Settings",
        "game-over" => "Game Over",
        "level-select" => "Select Level",
        _ => "Menu",
    };

    calls.push(CallInstruction::SceneMethod {
        method: "dispatchOperation".into(),
        args: vec![json!({
            "action": "create_ui_widget",
            "widgetType": "label",
            "name": "Title",
            "parent": "$1.uuid",
            "text": title,
        })],
    });

    let buttons: Vec<&str> = match menu_type {
        "main" => vec!["Start Game", "Settings", "Quit"],
        "pause" => vec!["Resume", "Settings", "Main Menu"],
        "settings" => vec!["Audio", "Graphics", "Controls", "Back"],
        "game-over" => vec!["Retry", "Main Menu"],
        "level-select" => vec!["Level 1", "Level 2", "Level 3", "Back"],
        _ => vec!["OK"],
    };

    for btn_text in buttons {
        calls.push(CallInstruction::SceneMethod {
            method: "dispatchOperation".into(),
            args: vec![json!({
                "action": "create_ui_widget",
                "widgetType": "button",
                "name": btn_text.replace(' ', ""),
                "parent": "$1.uuid",
                "text": btn_text,
            })],
        });
    }

    ExecutionPlan::multi(calls)
}

fn capitalize(s: &str) -> String {
    let mut c = s.chars();
    match c.next() {
        None => String::new(),
        Some(f) => f.to_uppercase().collect::<String>() + c.as_str(),
    }
}
