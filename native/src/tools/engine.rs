use crate::types::*;
use crate::validate;
use serde_json::json;

const ACTIONS: &[&str] = &[
    "get_fps", "set_target_fps", "pause_game", "resume_game",
    "get_system_info", "get_time_info", "dump_texture_cache", "get_memory_stats",
];

pub fn definitions() -> Vec<ToolDefinition> {
    vec![ToolDefinition {
        name: "engine_action".into(),
        description: concat!(
            "Control Cocos Creator engine runtime: FPS, pause, time scale, system info, texture/memory stats.\n\n",
            "Actions:\n",
            "- get_fps: Get current frame rate.\n",
            "- set_target_fps: fps(REQUIRED). Set target frame rate.\n",
            "- pause_game / resume_game: Pause/resume engine.\n",
            "- get_system_info: Get platform, OS, engine version.\n",
            "- get_time_info: Get total time, delta time, frame count.\n",
            "- dump_texture_cache: List all loaded textures with size.\n",
            "- get_memory_stats: Get JS heap and native memory usage.",
        ).into(),
        schema: json!({
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "enum": ACTIONS,
                    "description": "Engine action to perform."
                },
                "fps": {
                    "type": "number",
                    "description": "Target FPS. REQUIRED for set_target_fps."
                }
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

    ExecutionPlan::single(CallInstruction::SceneMethod {
        method: "dispatchEngineAction".into(),
        args: vec![args.clone()],
    })
}
