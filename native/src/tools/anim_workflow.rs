use crate::types::*;
use crate::validate;
use serde_json::{json, Value};

const ACTIONS: &[&str] = &[
    "create_from_description",
    "create_transition",
    "create_loop_animation",
    "create_sequence",
    "apply_preset",
    "create_ui_animation",
    "batch_animate",
    "preview_animation",
];

const UUID_REQUIRED: &[&str] = &[
    "create_from_description", "create_transition", "create_loop_animation",
    "apply_preset", "create_ui_animation", "preview_animation",
];

pub fn definitions() -> Vec<ToolDefinition> {
    vec![ToolDefinition {
        name: "animation_workflow".into(),
        description: concat!(
            "High-level animation workflow: create animations from natural language or presets.\n",
            "Builds on top of animation_tool by providing ready-made animation patterns.\n\n",
            "Actions:\n",
            "- create_from_description: uuid(REQUIRED), prompt(REQUIRED). Natural language → animation clip.\n",
            "  Example: 'bounce in from the left' → position + scale keyframes.\n",
            "- create_transition: uuid(REQUIRED), transitionType(REQUIRED). Create UI transition animation.\n",
            "  Types: fade-in, fade-out, slide-in-left, slide-in-right, slide-in-up, bounce-in, scale-in.\n",
            "- create_loop_animation: uuid(REQUIRED), loopType(REQUIRED). Create looping animation.\n",
            "  Types: pulse, float, rotate, breathe, blink.\n",
            "- create_sequence: uuid(REQUIRED), clips(REQUIRED). Create multiple clips on one node.\n",
            "- apply_preset: uuid(REQUIRED), preset(REQUIRED). Apply game animation preset.\n",
            "  Presets: idle, walk, attack, hurt, die.\n",
            "- create_ui_animation: uuid(REQUIRED), uiAnimType(REQUIRED). Create UI-specific animation.\n",
            "  Types: button-press, panel-popup, notification-slide, tab-switch.\n",
            "- batch_animate: uuids(REQUIRED), transitionType or loopType(REQUIRED), delay(optional). ",
            "Apply same animation to multiple nodes with staggered delay.\n",
            "- preview_animation: uuid(REQUIRED), clipName(optional), duration(optional). Play animation for preview.",
        ).into(),
        schema: json!({
            "type": "object",
            "properties": {
                "action": { "type": "string", "enum": ACTIONS, "description": "Animation workflow action." },
                "uuid": { "type": "string", "description": "Target node UUID. REQUIRED for most actions." },
                "prompt": { "type": "string", "description": "Natural language animation description. For create_from_description." },
                "transitionType": {
                    "type": "string",
                    "enum": ["fade-in", "fade-out", "slide-in-left", "slide-in-right", "slide-in-up", "bounce-in", "scale-in"],
                    "description": "Transition type. For create_transition and batch_animate."
                },
                "loopType": {
                    "type": "string",
                    "enum": ["pulse", "float", "rotate", "breathe", "blink"],
                    "description": "Loop animation type. For create_loop_animation and batch_animate."
                },
                "preset": {
                    "type": "string",
                    "enum": ["idle", "walk", "attack", "hurt", "die"],
                    "description": "Game animation preset. For apply_preset."
                },
                "uiAnimType": {
                    "type": "string",
                    "enum": ["button-press", "panel-popup", "notification-slide", "tab-switch"],
                    "description": "UI animation type. For create_ui_animation."
                },
                "uuids": {
                    "type": "array",
                    "items": { "type": "string" },
                    "description": "Multiple node UUIDs. For batch_animate."
                },
                "clips": {
                    "type": "array",
                    "description": "Clip definitions for create_sequence. Each: { clipName, transitionType or loopType, duration? }.",
                    "items": {
                        "type": "object",
                        "properties": {
                            "clipName": { "type": "string" },
                            "transitionType": { "type": "string" },
                            "loopType": { "type": "string" },
                            "duration": { "type": "number" }
                        }
                    }
                },
                "delay": { "type": "number", "description": "Stagger delay in seconds between nodes. For batch_animate. Default: 0.1." },
                "duration": { "type": "number", "description": "Override animation duration in seconds." },
                "clipName": { "type": "string", "description": "Custom clip name. Auto-generated if omitted." }
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

    if let Err(plan) = validate::require_string_for_actions(args, "uuid", &action, UUID_REQUIRED) {
        return plan;
    }

    match action.as_str() {
        "create_from_description" => {
            if let Err(plan) = validate::require_string(args, "prompt") {
                return plan;
            }
            ExecutionPlan::single(CallInstruction::BridgePost {
                path: "/api/mcp/ai/animation".into(),
                body: Some(args.clone()),
            })
        }

        "create_transition" => {
            let transition = args.get("transitionType").and_then(|v| v.as_str()).unwrap_or("fade-in");
            let uuid = args.get("uuid").cloned().unwrap_or(Value::Null);
            let dur = args.get("duration").and_then(|v| v.as_f64());
            let clip_name = args.get("clipName").and_then(|v| v.as_str())
                .unwrap_or(transition);

            let tracks = build_transition_tracks(transition, dur);
            let duration = dur.unwrap_or(transition_default_duration(transition));

            ExecutionPlan::single(CallInstruction::SceneMethod {
                method: "createAnimationClip".into(),
                args: vec![json!({
                    "uuid": uuid,
                    "clipName": clip_name,
                    "duration": duration,
                    "wrapMode": "Normal",
                    "tracks": tracks,
                })],
            })
        }

        "create_loop_animation" => {
            let loop_type = args.get("loopType").and_then(|v| v.as_str()).unwrap_or("pulse");
            let uuid = args.get("uuid").cloned().unwrap_or(Value::Null);
            let dur = args.get("duration").and_then(|v| v.as_f64());
            let clip_name = args.get("clipName").and_then(|v| v.as_str())
                .unwrap_or(loop_type);

            let tracks = build_loop_tracks(loop_type, dur);
            let duration = dur.unwrap_or(loop_default_duration(loop_type));

            ExecutionPlan::single(CallInstruction::SceneMethod {
                method: "createAnimationClip".into(),
                args: vec![json!({
                    "uuid": uuid,
                    "clipName": clip_name,
                    "duration": duration,
                    "wrapMode": "Loop",
                    "tracks": tracks,
                })],
            })
        }

        "create_sequence" => {
            if let Err(plan) = validate::require_string(args, "uuid") {
                return plan;
            }
            let clips = args.get("clips").and_then(|v| v.as_array());
            if clips.map_or(true, |a| a.is_empty()) {
                return ExecutionPlan::error_with_suggestion(
                    "Missing required parameter: clips (required for create_sequence)",
                    "Provide clips array: [{clipName: 'intro', transitionType: 'fade-in'}, ...]",
                );
            }

            let uuid = args.get("uuid").cloned().unwrap_or(Value::Null);
            let mut calls = Vec::new();

            for clip_def in clips.unwrap() {
                let clip_name = clip_def.get("clipName").and_then(|v| v.as_str()).unwrap_or("clip");
                let dur = clip_def.get("duration").and_then(|v| v.as_f64());

                let (tracks, duration, wrap) = if let Some(t) = clip_def.get("transitionType").and_then(|v| v.as_str()) {
                    (build_transition_tracks(t, dur), dur.unwrap_or(transition_default_duration(t)), "Normal")
                } else if let Some(l) = clip_def.get("loopType").and_then(|v| v.as_str()) {
                    (build_loop_tracks(l, dur), dur.unwrap_or(loop_default_duration(l)), "Loop")
                } else {
                    continue;
                };

                calls.push(CallInstruction::SceneMethod {
                    method: "createAnimationClip".into(),
                    args: vec![json!({
                        "uuid": uuid,
                        "clipName": clip_name,
                        "duration": duration,
                        "wrapMode": wrap,
                        "tracks": tracks,
                    })],
                });
            }

            if calls.is_empty() {
                return ExecutionPlan::error("No valid clip definitions found in clips array");
            }
            ExecutionPlan::multi(calls)
        }

        "apply_preset" => {
            let preset = args.get("preset").and_then(|v| v.as_str()).unwrap_or("idle");
            let uuid = args.get("uuid").cloned().unwrap_or(Value::Null);
            let (tracks, duration, wrap) = build_preset(preset);

            ExecutionPlan::single(CallInstruction::SceneMethod {
                method: "createAnimationClip".into(),
                args: vec![json!({
                    "uuid": uuid,
                    "clipName": preset,
                    "duration": duration,
                    "wrapMode": wrap,
                    "tracks": tracks,
                })],
            })
        }

        "create_ui_animation" => {
            let anim_type = args.get("uiAnimType").and_then(|v| v.as_str()).unwrap_or("button-press");
            let uuid = args.get("uuid").cloned().unwrap_or(Value::Null);
            let dur = args.get("duration").and_then(|v| v.as_f64());
            let (tracks, duration, wrap) = build_ui_animation(anim_type, dur);
            let clip_name = args.get("clipName").and_then(|v| v.as_str())
                .unwrap_or(anim_type);

            ExecutionPlan::single(CallInstruction::SceneMethod {
                method: "createAnimationClip".into(),
                args: vec![json!({
                    "uuid": uuid,
                    "clipName": clip_name,
                    "duration": duration,
                    "wrapMode": wrap,
                    "tracks": tracks,
                })],
            })
        }

        "batch_animate" => {
            let uuids = args.get("uuids").and_then(|v| v.as_array());
            if uuids.map_or(true, |a| a.is_empty()) {
                return ExecutionPlan::error_with_suggestion(
                    "Missing required parameter: uuids (required for batch_animate)",
                    "Provide uuids array of target node UUIDs",
                );
            }

            let dur = args.get("duration").and_then(|v| v.as_f64());
            let (tracks, duration, wrap) = if let Some(t) = args.get("transitionType").and_then(|v| v.as_str()) {
                (build_transition_tracks(t, dur), dur.unwrap_or(transition_default_duration(t)), "Normal")
            } else if let Some(l) = args.get("loopType").and_then(|v| v.as_str()) {
                (build_loop_tracks(l, dur), dur.unwrap_or(loop_default_duration(l)), "Loop")
            } else {
                return ExecutionPlan::error_with_suggestion(
                    "batch_animate requires either transitionType or loopType",
                    "Provide transitionType (fade-in, slide-in-left, ...) or loopType (pulse, float, ...)",
                );
            };

            let clip_name = args.get("clipName").and_then(|v| v.as_str()).unwrap_or("batch_anim");
            let mut calls = Vec::new();

            for node_uuid in uuids.unwrap() {
                calls.push(CallInstruction::SceneMethod {
                    method: "createAnimationClip".into(),
                    args: vec![json!({
                        "uuid": node_uuid,
                        "clipName": clip_name,
                        "duration": duration,
                        "wrapMode": wrap,
                        "tracks": tracks,
                    })],
                });
            }

            ExecutionPlan::multi(calls)
        }

        "preview_animation" => {
            let uuid = args.get("uuid").cloned().unwrap_or(Value::Null);
            let clip_name = args.get("clipName").cloned();

            let mut play_args = json!({ "action": "play", "uuid": uuid });
            if let Some(cn) = clip_name {
                play_args["clip"] = cn;
            }

            ExecutionPlan::single(CallInstruction::SceneMethod {
                method: "dispatchAnimationAction".into(),
                args: vec![play_args],
            })
        }

        _ => ExecutionPlan::error(&format!("Unknown animation_workflow action: {}", action)),
    }
}

// --- Preset data builders ---

fn kf(time: f64, value: Value, easing: Option<&str>) -> Value {
    let mut k = json!({ "time": time, "value": value });
    if let Some(e) = easing { k["easing"] = json!(e); }
    k
}

fn track(property: &str, keyframes: Vec<Value>) -> Value {
    json!({ "property": property, "keyframes": keyframes })
}

fn transition_default_duration(t: &str) -> f64 {
    match t {
        "bounce-in" => 0.5,
        "slide-in-left" | "slide-in-right" | "slide-in-up" => 0.4,
        _ => 0.3,
    }
}

fn loop_default_duration(l: &str) -> f64 {
    match l {
        "float" | "breathe" => 2.0,
        "rotate" => 2.0,
        "pulse" => 0.8,
        "blink" => 0.6,
        _ => 1.0,
    }
}

fn build_transition_tracks(transition: &str, dur_override: Option<f64>) -> Vec<Value> {
    let d = dur_override.unwrap_or(transition_default_duration(transition));
    match transition {
        "fade-in" => vec![
            track("opacity", vec![kf(0.0, json!(0), None), kf(d, json!(255), Some("quadOut"))]),
        ],
        "fade-out" => vec![
            track("opacity", vec![kf(0.0, json!(255), None), kf(d, json!(0), Some("quadIn"))]),
        ],
        "slide-in-left" => vec![
            track("position", vec![
                kf(0.0, json!({"x": -500, "y": 0, "z": 0}), None),
                kf(d, json!({"x": 0, "y": 0, "z": 0}), Some("quadOut")),
            ]),
        ],
        "slide-in-right" => vec![
            track("position", vec![
                kf(0.0, json!({"x": 500, "y": 0, "z": 0}), None),
                kf(d, json!({"x": 0, "y": 0, "z": 0}), Some("quadOut")),
            ]),
        ],
        "slide-in-up" => vec![
            track("position", vec![
                kf(0.0, json!({"x": 0, "y": -500, "z": 0}), None),
                kf(d, json!({"x": 0, "y": 0, "z": 0}), Some("quadOut")),
            ]),
        ],
        "bounce-in" => vec![
            track("scale", vec![
                kf(0.0, json!({"x": 0, "y": 0, "z": 1}), None),
                kf(d * 0.6, json!({"x": 1.2, "y": 1.2, "z": 1}), Some("quadOut")),
                kf(d, json!({"x": 1, "y": 1, "z": 1}), Some("quadInOut")),
            ]),
        ],
        "scale-in" => vec![
            track("scale", vec![
                kf(0.0, json!({"x": 0, "y": 0, "z": 1}), None),
                kf(d, json!({"x": 1, "y": 1, "z": 1}), Some("backOut")),
            ]),
        ],
        _ => vec![
            track("opacity", vec![kf(0.0, json!(0), None), kf(d, json!(255), None)]),
        ],
    }
}

fn build_loop_tracks(loop_type: &str, dur_override: Option<f64>) -> Vec<Value> {
    let d = dur_override.unwrap_or(loop_default_duration(loop_type));
    match loop_type {
        "pulse" => vec![
            track("scale", vec![
                kf(0.0, json!({"x": 1, "y": 1, "z": 1}), None),
                kf(d * 0.5, json!({"x": 1.1, "y": 1.1, "z": 1}), Some("sineInOut")),
                kf(d, json!({"x": 1, "y": 1, "z": 1}), Some("sineInOut")),
            ]),
        ],
        "float" => vec![
            track("position", vec![
                kf(0.0, json!({"x": 0, "y": 0, "z": 0}), None),
                kf(d * 0.5, json!({"x": 0, "y": 10, "z": 0}), Some("sineInOut")),
                kf(d, json!({"x": 0, "y": 0, "z": 0}), Some("sineInOut")),
            ]),
        ],
        "rotate" => vec![
            track("eulerAngles", vec![
                kf(0.0, json!({"x": 0, "y": 0, "z": 0}), None),
                kf(d, json!({"x": 0, "y": 0, "z": 360}), Some("linear")),
            ]),
        ],
        "breathe" => vec![
            track("opacity", vec![
                kf(0.0, json!(255), None),
                kf(d * 0.5, json!(180), Some("sineInOut")),
                kf(d, json!(255), Some("sineInOut")),
            ]),
        ],
        "blink" => vec![
            track("opacity", vec![
                kf(0.0, json!(255), None),
                kf(d * 0.25, json!(0), None),
                kf(d * 0.5, json!(255), None),
                kf(d, json!(255), None),
            ]),
        ],
        _ => vec![
            track("opacity", vec![
                kf(0.0, json!(255), None),
                kf(d * 0.5, json!(180), None),
                kf(d, json!(255), None),
            ]),
        ],
    }
}

fn build_preset(preset: &str) -> (Vec<Value>, f64, &'static str) {
    match preset {
        "idle" => (vec![
            track("position", vec![
                kf(0.0, json!({"x": 0, "y": 0, "z": 0}), None),
                kf(0.5, json!({"x": 0, "y": 3, "z": 0}), Some("sineInOut")),
                kf(1.0, json!({"x": 0, "y": 0, "z": 0}), Some("sineInOut")),
            ]),
        ], 1.0, "Loop"),
        "walk" => (vec![
            track("position", vec![
                kf(0.0, json!({"x": 0, "y": 0, "z": 0}), None),
                kf(0.15, json!({"x": 0, "y": 5, "z": 0}), Some("sineOut")),
                kf(0.3, json!({"x": 0, "y": 0, "z": 0}), Some("sineIn")),
                kf(0.45, json!({"x": 0, "y": 5, "z": 0}), Some("sineOut")),
                kf(0.6, json!({"x": 0, "y": 0, "z": 0}), Some("sineIn")),
            ]),
        ], 0.6, "Loop"),
        "attack" => (vec![
            track("scale", vec![
                kf(0.0, json!({"x": 1, "y": 1, "z": 1}), None),
                kf(0.1, json!({"x": 1.3, "y": 0.8, "z": 1}), Some("quadOut")),
                kf(0.3, json!({"x": 1, "y": 1, "z": 1}), Some("backOut")),
            ]),
            track("position", vec![
                kf(0.0, json!({"x": 0, "y": 0, "z": 0}), None),
                kf(0.1, json!({"x": 30, "y": 0, "z": 0}), Some("quadOut")),
                kf(0.3, json!({"x": 0, "y": 0, "z": 0}), Some("quadIn")),
            ]),
        ], 0.3, "Normal"),
        "hurt" => (vec![
            track("opacity", vec![
                kf(0.0, json!(255), None),
                kf(0.05, json!(100), None),
                kf(0.1, json!(255), None),
                kf(0.15, json!(100), None),
                kf(0.2, json!(255), None),
            ]),
            track("position", vec![
                kf(0.0, json!({"x": 0, "y": 0, "z": 0}), None),
                kf(0.05, json!({"x": -5, "y": 0, "z": 0}), None),
                kf(0.1, json!({"x": 5, "y": 0, "z": 0}), None),
                kf(0.15, json!({"x": -3, "y": 0, "z": 0}), None),
                kf(0.2, json!({"x": 0, "y": 0, "z": 0}), None),
            ]),
        ], 0.2, "Normal"),
        "die" => (vec![
            track("opacity", vec![
                kf(0.0, json!(255), None),
                kf(0.8, json!(0), Some("quadIn")),
            ]),
            track("scale", vec![
                kf(0.0, json!({"x": 1, "y": 1, "z": 1}), None),
                kf(0.4, json!({"x": 1.2, "y": 0.6, "z": 1}), Some("quadOut")),
                kf(0.8, json!({"x": 0, "y": 0, "z": 1}), Some("quadIn")),
            ]),
            track("position", vec![
                kf(0.0, json!({"x": 0, "y": 0, "z": 0}), None),
                kf(0.8, json!({"x": 0, "y": -50, "z": 0}), Some("quadIn")),
            ]),
        ], 0.8, "Normal"),
        _ => (vec![
            track("opacity", vec![kf(0.0, json!(255), None), kf(1.0, json!(180), None), kf(2.0, json!(255), None)]),
        ], 2.0, "Loop"),
    }
}

fn build_ui_animation(anim_type: &str, dur_override: Option<f64>) -> (Vec<Value>, f64, &'static str) {
    match anim_type {
        "button-press" => {
            let d = dur_override.unwrap_or(0.15);
            (vec![
                track("scale", vec![
                    kf(0.0, json!({"x": 1, "y": 1, "z": 1}), None),
                    kf(d * 0.5, json!({"x": 0.9, "y": 0.9, "z": 1}), Some("quadOut")),
                    kf(d, json!({"x": 1, "y": 1, "z": 1}), Some("backOut")),
                ]),
            ], d, "Normal")
        }
        "panel-popup" => {
            let d = dur_override.unwrap_or(0.35);
            (vec![
                track("scale", vec![
                    kf(0.0, json!({"x": 0, "y": 0, "z": 1}), None),
                    kf(d, json!({"x": 1, "y": 1, "z": 1}), Some("backOut")),
                ]),
                track("opacity", vec![
                    kf(0.0, json!(0), None),
                    kf(d * 0.5, json!(255), Some("quadOut")),
                ]),
            ], d, "Normal")
        }
        "notification-slide" => {
            let d = dur_override.unwrap_or(0.4);
            (vec![
                track("position", vec![
                    kf(0.0, json!({"x": 0, "y": 100, "z": 0}), None),
                    kf(d, json!({"x": 0, "y": 0, "z": 0}), Some("backOut")),
                ]),
                track("opacity", vec![
                    kf(0.0, json!(0), None),
                    kf(d * 0.3, json!(255), Some("quadOut")),
                ]),
            ], d, "Normal")
        }
        "tab-switch" => {
            let d = dur_override.unwrap_or(0.25);
            (vec![
                track("opacity", vec![
                    kf(0.0, json!(0), None),
                    kf(d, json!(255), Some("quadOut")),
                ]),
                track("position", vec![
                    kf(0.0, json!({"x": 20, "y": 0, "z": 0}), None),
                    kf(d, json!({"x": 0, "y": 0, "z": 0}), Some("quadOut")),
                ]),
            ], d, "Normal")
        }
        _ => {
            let d = dur_override.unwrap_or(0.3);
            (vec![
                track("opacity", vec![kf(0.0, json!(0), None), kf(d, json!(255), None)]),
            ], d, "Normal")
        }
    }
}
