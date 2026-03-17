mod engine;
mod script;
mod animation;
mod physics;
mod reference;
mod atomic;
mod scene;
mod asset;
mod editor;
mod misc;
mod generator;
mod batch;
mod audit;
mod scaffold;
mod anim_workflow;
mod ui_gen;
mod linter;
mod oplog;
#[cfg(test)]
mod tests;

use crate::types::*;
use serde_json::{json, Value};

/// Collect all Pro tool definitions from sub-modules.
pub fn get_definitions() -> Vec<Value> {
    let mut defs: Vec<ToolDefinition> = Vec::new();

    // Phase 1 tools (Pro-exclusive)
    defs.extend(engine::definitions());
    defs.extend(script::definitions());
    defs.extend(animation::definitions());
    defs.extend(physics::definitions());
    defs.extend(reference::definitions());
    defs.extend(atomic::definitions());

    // Phase 2 tools (full Rust rewrite of community tools + Pro extensions)
    defs.extend(scene::definitions());
    defs.extend(asset::definitions());
    defs.extend(editor::definitions());
    defs.extend(misc::definitions());

    // Phase 3 tools (AI smart tools — Pro exclusive)
    defs.extend(generator::definitions());
    defs.extend(batch::definitions());
    defs.extend(audit::definitions());

    // Phase 4 tools (Advanced Pro features)
    defs.extend(scaffold::definitions());
    defs.extend(anim_workflow::definitions());
    defs.extend(ui_gen::definitions());
    defs.extend(linter::definitions());
    defs.extend(oplog::definitions());

    defs.into_iter()
        .map(|d| serde_json::to_value(d).unwrap())
        .collect()
}

/// Route a tool call to the appropriate sub-module processor.
pub fn process_call(tool_name: &str, args: &Value) -> Value {
    let plan = match tool_name {
        // Phase 1 tools
        "engine_action" => engine::process(args),
        "execute_script" => script::process_execute(args),
        "register_custom_macro" => script::process_register_macro(args),
        "animation_tool" => animation::process(args),
        "physics_tool" => physics::process(args),
        "reference_image" => reference::process(args),
        // Atomic tools
        "create_prefab_atomic" => atomic::process_prefab(args),
        "import_and_apply_texture" => atomic::process_texture(args),
        "setup_ui_layout" => atomic::process_ui_layout(args),
        "create_tween_animation_atomic" => atomic::process_tween(args),
        "auto_fit_physics_collider" => atomic::process_physics_collider(args),
        // Phase 2 tools
        "scene_query" => scene::process_query(args),
        "scene_operation" => scene::process_operation(args),
        "asset_operation" => asset::process(args),
        "editor_action" => editor::process(args),
        "preferences" => misc::process_preferences(args),
        "broadcast" => misc::process_broadcast(args),
        "tool_management" => misc::process_tool_management(args),
        // Phase 3 AI smart tools
        "scene_generator" => generator::process(args),
        "batch_engine" => batch::process(args),
        "scene_audit" => audit::process(args),
        // Phase 4 advanced tools
        "script_scaffold" => scaffold::process(args),
        "animation_workflow" => anim_workflow::process(args),
        "ui_generator" => ui_gen::process(args),
        "project_linter" => linter::process(args),
        "operation_log" => oplog::process(args),
        _ => ExecutionPlan::error(&format!("Unknown Pro tool: {}", tool_name)),
    };

    serde_json::to_value(plan).unwrap_or_else(|e| json!({ "error": e.to_string() }))
}
