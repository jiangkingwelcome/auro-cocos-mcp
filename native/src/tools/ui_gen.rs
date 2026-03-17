use crate::types::*;
use crate::validate;
use serde_json::{json, Value};

const ACTIONS: &[&str] = &[
    "create_login_page",
    "create_settings_page",
    "create_shop_page",
    "create_hud",
    "create_dialog",
    "create_inventory",
    "create_custom_ui",
];

pub fn definitions() -> Vec<ToolDefinition> {
    vec![ToolDefinition {
        name: "ui_generator".into(),
        description: concat!(
            "One-click UI system: generate complete UI pages from templates or natural language.\n",
            "More powerful and specialized than scene_generator.create_ui_page.\n\n",
            "Actions:\n",
            "- create_login_page: parentUuid(optional). Login/register page with email, password, submit, social login.\n",
            "- create_settings_page: parentUuid(optional). Settings page with volume slider, toggles, dropdowns.\n",
            "- create_shop_page: parentUuid(optional), itemCount(optional, default 6). Shop with ScrollView + item cards.\n",
            "- create_hud: parentUuid(optional). Game HUD with health bar, score, minimap placeholder, skill bar.\n",
            "- create_dialog: parentUuid(optional), title(optional), content(optional). Modal dialog with mask + buttons.\n",
            "- create_inventory: parentUuid(optional), columns(optional, default 4), itemCount(optional, default 16). ",
            "Grid inventory with item slots and detail panel.\n",
            "- create_custom_ui: prompt(REQUIRED), parentUuid(optional). Natural language → custom UI layout.\n\n",
            "All actions auto-create Canvas if needed. Nodes include Widget components for responsive layout.",
        ).into(),
        schema: json!({
            "type": "object",
            "properties": {
                "action": { "type": "string", "enum": ACTIONS, "description": "UI generator action." },
                "prompt": { "type": "string", "description": "Natural language UI description. REQUIRED for create_custom_ui." },
                "parentUuid": { "type": "string", "description": "Parent node UUID. Default: Canvas." },
                "title": { "type": "string", "description": "Dialog title. For create_dialog." },
                "content": { "type": "string", "description": "Dialog content text. For create_dialog." },
                "columns": { "type": "integer", "description": "Grid columns. For create_inventory. Default: 4." },
                "itemCount": { "type": "integer", "description": "Number of items. For create_shop_page/create_inventory." },
                "style": {
                    "type": "string",
                    "enum": ["minimal", "detailed", "production"],
                    "description": "Generation detail level. Default: detailed."
                },
                "theme": {
                    "type": "string",
                    "enum": ["light", "dark"],
                    "description": "Color theme. Default: dark."
                }
            },
            "required": ["action"]
        }),
        actions: ACTIONS.iter().map(|s| s.to_string()).collect(),
        edition: "pro".into(),
    }]
}

fn op(action_data: Value) -> CallInstruction {
    CallInstruction::SceneMethod {
        method: "dispatchOperation".into(),
        args: vec![action_data],
    }
}

fn widget(widget_type: &str, name: &str, parent: &str, text: Option<&str>) -> CallInstruction {
    let mut data = json!({
        "action": "create_ui_widget",
        "widgetType": widget_type,
        "name": name,
        "parent": parent,
    });
    if let Some(t) = text { data["text"] = json!(t); }
    op(data)
}

pub fn process(args: &Value) -> ExecutionPlan {
    let action = match validate::require_action(args, ACTIONS) {
        Ok(a) => a,
        Err(plan) => return plan,
    };

    match action.as_str() {
        "create_login_page" => generate_login(args),
        "create_settings_page" => generate_settings(args),
        "create_shop_page" => generate_shop(args),
        "create_hud" => generate_hud(args),
        "create_dialog" => generate_dialog(args),
        "create_inventory" => generate_inventory(args),
        "create_custom_ui" => {
            if let Err(plan) = validate::require_string(args, "prompt") {
                return plan;
            }
            generate_custom(args)
        }
        _ => ExecutionPlan::error(&format!("Unknown ui_generator action: {}", action)),
    }
}

fn canvas_and_root(name: &str) -> Vec<CallInstruction> {
    vec![
        op(json!({ "action": "ensure_2d_canvas" })),
        op(json!({ "action": "create_node", "name": name, "parent": "$0.uuid" })),
        op(json!({ "action": "add_component", "uuid": "$1.uuid", "component": "Widget" })),
    ]
}

fn generate_login(_args: &Value) -> ExecutionPlan {
    let mut calls = canvas_and_root("LoginPage");

    // Title
    calls.push(widget("label", "Title", "$1.uuid", Some("Welcome")));
    // Email input
    calls.push(widget("editbox", "EmailInput", "$1.uuid", None));
    // Password input
    calls.push(widget("editbox", "PasswordInput", "$1.uuid", None));
    // Login button
    calls.push(widget("button", "LoginButton", "$1.uuid", Some("Log In")));
    // Register button
    calls.push(widget("button", "RegisterButton", "$1.uuid", Some("Sign Up")));
    // Divider label
    calls.push(widget("label", "OrDivider", "$1.uuid", Some("— or —")));
    // Social login buttons
    calls.push(widget("button", "GoogleLogin", "$1.uuid", Some("Continue with Google")));
    calls.push(widget("button", "AppleLogin", "$1.uuid", Some("Continue with Apple")));

    ExecutionPlan::multi(calls)
}

fn generate_settings(_args: &Value) -> ExecutionPlan {
    let mut calls = canvas_and_root("SettingsPage");

    calls.push(widget("label", "Title", "$1.uuid", Some("Settings")));
    // Audio section
    calls.push(widget("label", "AudioLabel", "$1.uuid", Some("Audio")));
    calls.push(widget("slider", "MusicVolume", "$1.uuid", None));
    calls.push(widget("label", "MusicLabel", "$1.uuid", Some("Music")));
    calls.push(widget("slider", "SFXVolume", "$1.uuid", None));
    calls.push(widget("label", "SFXLabel", "$1.uuid", Some("Sound Effects")));
    // Display section
    calls.push(widget("label", "DisplayLabel", "$1.uuid", Some("Display")));
    calls.push(widget("toggle", "FullscreenToggle", "$1.uuid", None));
    calls.push(widget("label", "FullscreenLabel", "$1.uuid", Some("Fullscreen")));
    calls.push(widget("toggle", "VsyncToggle", "$1.uuid", None));
    calls.push(widget("label", "VsyncLabel", "$1.uuid", Some("V-Sync")));
    // Language
    calls.push(widget("label", "LanguageLabel", "$1.uuid", Some("Language")));
    calls.push(widget("button", "LanguageButton", "$1.uuid", Some("English")));
    // Back button
    calls.push(widget("button", "BackButton", "$1.uuid", Some("Back")));

    ExecutionPlan::multi(calls)
}

fn generate_shop(args: &Value) -> ExecutionPlan {
    let item_count = args.get("itemCount").and_then(|v| v.as_u64()).unwrap_or(6) as usize;
    let mut calls = canvas_and_root("ShopPage");

    calls.push(widget("label", "Title", "$1.uuid", Some("Shop")));
    // Currency display
    calls.push(widget("label", "CurrencyLabel", "$1.uuid", Some("Coins: 1000")));
    // ScrollView container for items
    calls.push(op(json!({
        "action": "create_node", "name": "ItemList", "parent": "$1.uuid",
    })));
    calls.push(op(json!({
        "action": "add_component", "uuid": format!("${}.uuid", calls.len() - 1),
        "component": "ScrollView",
    })));

    let scroll_ref = format!("${}.uuid", calls.len() - 2);
    for i in 0..item_count {
        let item_name = format!("Item_{}", i + 1);
        calls.push(op(json!({
            "action": "create_node", "name": item_name, "parent": scroll_ref,
        })));
        let item_ref = format!("${}.uuid", calls.len() - 1);
        calls.push(widget("label", &format!("ItemName_{}", i + 1), &item_ref, Some(&format!("Item {}", i + 1))));
        calls.push(widget("label", &format!("ItemPrice_{}", i + 1), &item_ref, Some(&format!("{} coins", (i + 1) * 100))));
        calls.push(widget("button", &format!("BuyButton_{}", i + 1), &item_ref, Some("Buy")));
    }

    calls.push(widget("button", "BackButton", "$1.uuid", Some("Back")));

    ExecutionPlan::multi(calls)
}

fn generate_hud(_args: &Value) -> ExecutionPlan {
    let mut calls = canvas_and_root("HUD");

    // Top-left: Health bar
    calls.push(op(json!({
        "action": "create_node", "name": "HealthBar", "parent": "$1.uuid",
    })));
    calls.push(widget("progressbar", "HealthProgress", &format!("${}.uuid", calls.len() - 1), None));
    calls.push(widget("label", "HealthLabel", &format!("${}.uuid", calls.len() - 2), Some("HP")));

    // Top-right: Score
    calls.push(widget("label", "ScoreLabel", "$1.uuid", Some("Score: 0")));

    // Bottom: Skill bar
    calls.push(op(json!({
        "action": "create_node", "name": "SkillBar", "parent": "$1.uuid",
    })));
    let skill_ref = format!("${}.uuid", calls.len() - 1);
    for i in 1..=4 {
        calls.push(widget("button", &format!("Skill_{}", i), &skill_ref, Some(&format!("Q{}", i))));
    }

    // Minimap placeholder
    calls.push(op(json!({
        "action": "create_node", "name": "MinimapFrame", "parent": "$1.uuid",
    })));
    calls.push(widget("label", "MinimapLabel", &format!("${}.uuid", calls.len() - 1), Some("Minimap")));

    // Pause button
    calls.push(widget("button", "PauseButton", "$1.uuid", Some("||")));

    ExecutionPlan::multi(calls)
}

fn generate_dialog(args: &Value) -> ExecutionPlan {
    let title = args.get("title").and_then(|v| v.as_str()).unwrap_or("Confirm");
    let content = args.get("content").and_then(|v| v.as_str()).unwrap_or("Are you sure?");

    let mut calls = canvas_and_root("DialogOverlay");

    // Mask background
    calls.push(op(json!({
        "action": "create_node", "name": "Mask", "parent": "$1.uuid",
    })));
    calls.push(op(json!({
        "action": "add_component", "uuid": format!("${}.uuid", calls.len() - 1),
        "component": "Sprite",
    })));

    // Dialog panel
    calls.push(op(json!({
        "action": "create_node", "name": "DialogPanel", "parent": "$1.uuid",
    })));
    let panel_ref = format!("${}.uuid", calls.len() - 1);

    calls.push(widget("label", "DialogTitle", &panel_ref, Some(title)));
    calls.push(widget("label", "DialogContent", &panel_ref, Some(content)));

    // Button row
    calls.push(op(json!({
        "action": "create_node", "name": "ButtonRow", "parent": panel_ref,
    })));
    let row_ref = format!("${}.uuid", calls.len() - 1);
    calls.push(widget("button", "ConfirmButton", &row_ref, Some("OK")));
    calls.push(widget("button", "CancelButton", &row_ref, Some("Cancel")));

    // Close button (top-right)
    calls.push(widget("button", "CloseButton", &panel_ref, Some("X")));

    ExecutionPlan::multi(calls)
}

fn generate_inventory(args: &Value) -> ExecutionPlan {
    let columns = args.get("columns").and_then(|v| v.as_u64()).unwrap_or(4) as usize;
    let item_count = args.get("itemCount").and_then(|v| v.as_u64()).unwrap_or(16) as usize;

    let mut calls = canvas_and_root("InventoryPage");

    calls.push(widget("label", "Title", "$1.uuid", Some("Inventory")));

    // Grid container
    calls.push(op(json!({
        "action": "create_node", "name": "ItemGrid", "parent": "$1.uuid",
    })));
    calls.push(op(json!({
        "action": "add_component", "uuid": format!("${}.uuid", calls.len() - 1),
        "component": "Layout",
    })));
    calls.push(op(json!({
        "action": "set_property", "uuid": format!("${}.uuid", calls.len() - 2),
        "component": "Layout", "property": "type", "value": 3,
    })));
    if columns > 0 {
        calls.push(op(json!({
            "action": "set_property", "uuid": format!("${}.uuid", calls.len() - 3),
            "component": "Layout", "property": "constraintNum", "value": columns,
        })));
    }

    let grid_ref = format!("${}.uuid", calls.len() - 1 - if columns > 0 { 1 } else { 0 });
    for i in 0..item_count {
        calls.push(op(json!({
            "action": "create_node", "name": format!("Slot_{}", i + 1), "parent": grid_ref,
        })));
    }

    // Detail panel
    calls.push(op(json!({
        "action": "create_node", "name": "DetailPanel", "parent": "$1.uuid",
    })));
    let detail_ref = format!("${}.uuid", calls.len() - 1);
    calls.push(widget("label", "ItemName", &detail_ref, Some("Select an item")));
    calls.push(widget("label", "ItemDesc", &detail_ref, Some("")));
    calls.push(widget("button", "UseButton", &detail_ref, Some("Use")));
    calls.push(widget("button", "DropButton", &detail_ref, Some("Drop")));

    // Close button
    calls.push(widget("button", "CloseButton", "$1.uuid", Some("Close")));

    ExecutionPlan::multi(calls)
}

fn generate_custom(args: &Value) -> ExecutionPlan {
    let prompt = args.get("prompt").and_then(|v| v.as_str()).unwrap_or("");
    let mut calls = canvas_and_root("CustomUI");

    if prompt.contains("scroll") || prompt.contains("列表") || prompt.contains("list") {
        calls.push(op(json!({
            "action": "create_node", "name": "ScrollContainer", "parent": "$1.uuid",
        })));
        calls.push(op(json!({
            "action": "add_component", "uuid": format!("${}.uuid", calls.len() - 1),
            "component": "ScrollView",
        })));
    }

    if prompt.contains("grid") || prompt.contains("网格") {
        calls.push(op(json!({
            "action": "create_node", "name": "GridContainer", "parent": "$1.uuid",
        })));
        calls.push(op(json!({
            "action": "add_component", "uuid": format!("${}.uuid", calls.len() - 1),
            "component": "Layout",
        })));
    }

    if prompt.contains("tab") || prompt.contains("标签") {
        calls.push(op(json!({
            "action": "create_node", "name": "TabBar", "parent": "$1.uuid",
        })));
        let tab_ref = format!("${}.uuid", calls.len() - 1);
        calls.push(widget("button", "Tab1", &tab_ref, Some("Tab 1")));
        calls.push(widget("button", "Tab2", &tab_ref, Some("Tab 2")));
        calls.push(widget("button", "Tab3", &tab_ref, Some("Tab 3")));
        calls.push(op(json!({
            "action": "create_node", "name": "TabContent", "parent": "$1.uuid",
        })));
    }

    if prompt.contains("title") || prompt.contains("标题") || prompt.contains("header") {
        calls.push(widget("label", "Title", "$1.uuid", Some("Title")));
    }

    if prompt.contains("button") || prompt.contains("按钮") {
        calls.push(widget("button", "ActionButton", "$1.uuid", Some("Submit")));
    }

    if prompt.contains("input") || prompt.contains("输入") || prompt.contains("field") || prompt.contains("text") {
        calls.push(widget("editbox", "InputField", "$1.uuid", None));
    }

    if prompt.contains("progress") || prompt.contains("进度") {
        calls.push(widget("progressbar", "ProgressBar", "$1.uuid", None));
    }

    if prompt.contains("slider") || prompt.contains("滑块") {
        calls.push(widget("slider", "Slider", "$1.uuid", None));
    }

    if prompt.contains("toggle") || prompt.contains("开关") || prompt.contains("switch") {
        calls.push(widget("toggle", "Toggle", "$1.uuid", None));
    }

    if prompt.contains("image") || prompt.contains("图片") || prompt.contains("icon") {
        calls.push(op(json!({
            "action": "create_node", "name": "ImagePlaceholder", "parent": "$1.uuid",
        })));
        calls.push(op(json!({
            "action": "add_component", "uuid": format!("${}.uuid", calls.len() - 1),
            "component": "Sprite",
        })));
    }

    ExecutionPlan::multi(calls)
}
