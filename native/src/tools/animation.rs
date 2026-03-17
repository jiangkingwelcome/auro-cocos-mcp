use crate::types::*;
use crate::validate;
use serde_json::json;

const ACTIONS: &[&str] = &[
    "create_clip", "list_clips", "play", "stop", "pause", "resume",
    "get_state", "set_speed", "set_time", "crossfade",
];

const UUID_REQUIRED: &[&str] = &[
    "create_clip", "list_clips", "play", "stop", "pause", "resume",
    "get_state", "set_speed", "set_time", "crossfade",
];

pub fn definitions() -> Vec<ToolDefinition> {
    vec![ToolDefinition {
        name: "animation_tool".into(),
        description: concat!(
            "Control animation playback on Cocos Creator nodes.\n\n",
            "Actions:\n",
            "- create_clip: uuid(REQUIRED), tracks(REQUIRED), duration(optional), wrapMode(optional), speed(optional). ",
            "Create and attach an AnimationClip with keyframe tracks.\n",
            "- list_clips: uuid(REQUIRED). List animation clips on a node.\n",
            "- play: uuid(REQUIRED), clip(optional). Play animation.\n",
            "- stop: uuid(REQUIRED). Stop animation.\n",
            "- pause/resume: uuid(REQUIRED). Pause/resume playback.\n",
            "- get_state: uuid(REQUIRED). Get current playback state.\n",
            "- set_speed: uuid(REQUIRED), speed(REQUIRED). Set playback speed.\n",
            "- set_time: uuid(REQUIRED), time(REQUIRED). Seek to time position.\n",
            "- crossfade: uuid(REQUIRED), clip(REQUIRED), duration(optional). Crossfade to another clip.",
        ).into(),
        schema: json!({
            "type": "object",
            "properties": {
                "action": { "type": "string", "enum": ACTIONS, "description": "Animation action to perform." },
                "uuid": { "type": "string", "description": "Target node UUID. REQUIRED for all actions." },
                "clip": { "type": "string", "description": "Animation clip name. REQUIRED for crossfade, optional for play." },
                "speed": { "type": "number", "description": "Playback speed multiplier. REQUIRED for set_speed, optional for create_clip (default 1)." },
                "time": { "type": "number", "description": "Time position in seconds. REQUIRED for set_time." },
                "duration": { "type": "number", "description": "Duration in seconds. For create_clip (default 1), for crossfade transition (default 0.3)." },
                "wrapMode": { "type": "string", "enum": ["Normal", "Loop", "PingPong", "Reverse", "LoopReverse"], "description": "Animation wrap mode. For create_clip. Default: Normal." },
                "tracks": {
                    "type": "array",
                    "description": "Keyframe tracks. REQUIRED for create_clip. Each track: {path?, component?, property, keyframes: [{time, value, easing?}]}.",
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
                }
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
                args: vec![args.clone()],
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
        _ => {
            ExecutionPlan::single(CallInstruction::SceneMethod {
                method: "dispatchAnimationAction".into(),
                args: vec![args.clone()],
            })
        }
    }
}
