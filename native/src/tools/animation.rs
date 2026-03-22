use crate::types::*;
use crate::validate;
use serde_json::json;

const ACTIONS: &[&str] = &[
    // Basic animation actions
    "create_clip", "list_clips", "play", "stop", "pause", "resume",
    "get_state", "set_speed", "set_time", "set_current_time", "crossfade",
    // Preset animation actions (new in 1.7.3)
    "create_preset", "list_presets", "apply_preset", "save_as_preset", "delete_preset",
    "list_preset_categories", "export_preset", "import_preset",
];

const UUID_REQUIRED: &[&str] = &[
    "create_clip", "list_clips", "play", "stop", "pause", "resume",
    "get_state", "set_speed", "set_time", "set_current_time", "crossfade", "apply_preset",
];

pub fn definitions() -> Vec<ToolDefinition> {
    vec![ToolDefinition {
        name: "animation_tool".into(),
        description: concat!(
            "Control animation playback on Cocos Creator nodes, including preset animation system.\n\n",
            "Basic Animation Actions:\n",
            "- create_clip: uuid(REQUIRED), tracks(REQUIRED), duration(optional), wrapMode(optional), speed(optional), savePath(optional). ",
            "Create and attach an AnimationClip with keyframe tracks.\n",
            "- list_clips: uuid(REQUIRED). List animation clips on a node.\n",
            "- play: uuid(REQUIRED), clipName(optional). Play animation.\n",
            "- stop: uuid(REQUIRED). Stop animation.\n",
            "- pause/resume: uuid(REQUIRED). Pause/resume playback.\n",
            "- get_state: uuid(REQUIRED). Get current playback state.\n",
            "- set_speed: uuid(REQUIRED), speed(REQUIRED). Set playback speed.\n",
            "- set_current_time: uuid(REQUIRED), time(REQUIRED). Seek to time position.\n",
            "- crossfade: uuid(REQUIRED), clipName(REQUIRED), duration(optional). Crossfade to another clip.\n\n",
            "Preset Animation Actions (new in 1.7.3):\n",
            "- create_preset: name(REQUIRED), tracks(REQUIRED), category(optional), description(optional). Create a reusable animation preset.\n",
            "- list_presets: category(optional). List all available animation presets.\n",
            "- apply_preset: uuid(REQUIRED), presetName(REQUIRED), category(optional). Apply a preset to a node.\n",
            "- save_as_preset: uuid(REQUIRED), name(REQUIRED), category(optional). Save node's animation as a preset.\n",
            "- delete_preset: name(REQUIRED), category(optional). Delete an animation preset.\n",
            "- list_preset_categories: List all preset categories.\n",
            "- export_preset: name(REQUIRED), category(optional), outputPath(optional). Export preset to JSON file.\n",
            "- import_preset: filePath(REQUIRED). Import preset from JSON file.\n",
        ).into(),
        schema: json!({
            "type": "object",
            "properties": {
                "action": { "type": "string", "enum": ACTIONS, "description": "Animation action to perform." },
                "uuid": { "type": "string", "description": "Target node UUID. REQUIRED for all actions." },
                "clip": { "type": "string", "description": "Deprecated alias of clipName. Optional for play, required for crossfade if clipName omitted." },
                "clipName": { "type": "string", "description": "Animation clip name. Optional for play, required for crossfade." },
                "speed": { "type": "number", "description": "Playback speed multiplier. REQUIRED for set_speed, optional for create_clip (default 1)." },
                "time": { "type": "number", "description": "Time position in seconds. REQUIRED for set_current_time." },
                "duration": { "type": "number", "description": "Duration in seconds. For create_clip (default 1), for crossfade transition (default 0.3)." },
                "wrapMode": { "type": "string", "enum": ["Normal", "Loop", "PingPong", "Reverse", "LoopReverse"], "description": "Animation wrap mode. For create_clip. Default: Normal." },
                "savePath": { "type": "string", "description": "Optional db:// path to save the generated .anim asset." },
                "tracks": {
                    "type": "array",
                    "description": "Keyframe tracks. REQUIRED for create_clip, create_preset. Each track: {path?, component?, property, keyframes: [{time, value, easing?}]}.",
                    "items": {
                        "type": "object",
                        "properties": {
                            "path": { "type": "string", "description": "Child node path relative to animated node." },
                            "component": { "type": "string", "description": "Component type name if animating a component property." },
                            "property": { "type": "string", "description": "Property name to animate, e.g. position, scale, color, opacity." },
                            "keyframes": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "time": { "type": "number" },
                                        "value": {},
                                        "easing": { "type": "string" }
                                    },
                                    "required": ["time", "value"]
                                }
                            }
                        },
                        "required": ["property", "keyframes"]
                    }
                },
                // Preset animation properties
                "name": { "type": "string", "description": "Preset name. REQUIRED for create_preset, save_as_preset, delete_preset, apply_preset, export_preset." },
                "presetName": { "type": "string", "description": "Preset name to apply. REQUIRED for apply_preset." },
                "category": { "type": "string", "description": "Preset category. Optional for create_preset, list_presets, save_as_preset, delete_preset." },
                "description": { "type": "string", "description": "Preset description. Optional for create_preset." },
                "filePath": { "type": "string", "description": "File path for import/export. REQUIRED for import_preset, export_preset." },
                "outputPath": { "type": "string", "description": "Output path for export. Optional for export_preset." }
            },
            "required": ["action"]
        }),
        actions: ACTIONS.iter().map(|s| s.to_string()).collect(),
        edition: "pro".into(),
    }]
}

pub fn process(args: &serde_json::Value) -> ExecutionPlan {
    let action = match validate::require_action(args, ACTIONS) {
        Ok(a) => a,
        Err(plan) => return plan,
    };

    if let Err(plan) = validate::require_string_for_actions(args, "uuid", &action, UUID_REQUIRED) {
        return plan;
    }

    // Validate required parameters for preset actions
    match action.as_str() {
        "create_preset" | "save_as_preset" => {
            if let Err(plan) = validate::require_string(args, "name") {
                return plan;
            }
        }
        "apply_preset" => {
            if let Err(plan) = validate::require_string(args, "presetName") {
                return plan;
            }
        }
        "delete_preset" | "export_preset" => {
            if let Err(plan) = validate::require_string(args, "name") {
                return plan;
            }
        }
        "import_preset" => {
            if let Err(plan) = validate::require_string(args, "filePath") {
                return plan;
            }
        }
        _ => {}
    }

    let mut normalized = args.clone();
    if let Some(obj) = normalized.as_object_mut() {
        if let Some(clip) = obj.get("clip").cloned() {
            obj.entry("clipName").or_insert(clip);
        }
        if action == "set_time" {
            obj.insert("action".into(), json!("set_current_time"));
        }
    }

    match action.as_str() {
        "create_clip" => {
            if args.get("tracks").and_then(|v| v.as_array()).map_or(true, |a| a.is_empty()) {
                return ExecutionPlan::error_with_suggestion(
                    "Missing required parameter: tracks (required for action=create_clip)",
                    "Provide tracks array with at least one track containing property and keyframes",
                );
            }
            ExecutionPlan::single(CallInstruction::SceneMethod {
                method: "createAnimationClip".into(),
                args: vec![normalized],
            })
        }
        "get_state" | "list_clips" => {
            ExecutionPlan::single(CallInstruction::SceneMethod {
                method: "dispatchQuery".into(),
                args: vec![json!({
                    "action": "get_animation_state",
                    "uuid": args.get("uuid").cloned().unwrap_or(json!(null))
                })],
            })
        }
        // Preset animation actions - route to bridge API
        "create_preset" | "list_presets" | "apply_preset" | "save_as_preset"
        | "delete_preset" | "list_preset_categories" | "export_preset" | "import_preset" => {
            ExecutionPlan::single(CallInstruction::BridgePost {
                path: "/api/animation-preset".into(),
                body: Some(args.clone()),
            })
        }
        _ => {
            ExecutionPlan::single(CallInstruction::SceneMethod {
                method: "dispatchAnimationAction".into(),
                args: vec![normalized],
            })
        }
    }
}
