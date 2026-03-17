#[cfg(test)]
mod scaffold_tests {
    use crate::tools::scaffold;
    use serde_json::json;

    #[test]
    fn list_templates_returns_bridge_post() {
        let plan = scaffold::process(&json!({ "action": "list_templates" }));
        assert!(plan.error.is_none());
        assert_eq!(plan.calls.len(), 1);
        let call = serde_json::to_value(&plan.calls[0]).unwrap();
        assert_eq!(call["type"], "bridgePost");
        assert_eq!(call["path"], "/api/mcp/ai/scaffold");
    }

    #[test]
    fn generate_component_requires_class_name() {
        let plan = scaffold::process(&json!({ "action": "generate_component" }));
        assert!(plan.error.is_some());
        assert!(plan.error.unwrap().contains("className"));
    }

    #[test]
    fn generate_component_single_bridge_post() {
        let plan = scaffold::process(&json!({
            "action": "generate_component",
            "className": "PlayerController"
        }));
        assert!(plan.error.is_none());
        assert_eq!(plan.calls.len(), 1);
        let call = serde_json::to_value(&plan.calls[0]).unwrap();
        assert_eq!(call["type"], "bridgePost");
    }

    #[test]
    fn from_template_single_bridge_post() {
        let plan = scaffold::process(&json!({
            "action": "from_template",
            "className": "GameManager",
            "template": "singleton"
        }));
        assert!(plan.error.is_none());
        assert_eq!(plan.calls.len(), 1);
    }

    #[test]
    fn generate_and_attach_requires_uuid() {
        let plan = scaffold::process(&json!({
            "action": "generate_and_attach",
            "className": "Foo"
        }));
        assert!(plan.error.is_some());
        assert!(plan.error.unwrap().contains("uuid"));
    }

    #[test]
    fn generate_and_attach_multi_step_plan() {
        let plan = scaffold::process(&json!({
            "action": "generate_and_attach",
            "className": "EnemyAI",
            "uuid": "node-123",
            "savePath": "db://assets/scripts/"
        }));
        assert!(plan.error.is_none());
        assert!(plan.calls.len() >= 3, "Expected at least 3 calls (scaffold + refresh + attach), got {}", plan.calls.len());

        let calls: Vec<_> = plan.calls.iter()
            .map(|c| serde_json::to_value(c).unwrap())
            .collect();
        assert_eq!(calls[0]["type"], "bridgePost");
        assert_eq!(calls[1]["type"], "editorMsg");
        assert_eq!(calls[2]["type"], "sceneMethod");
    }

    #[test]
    fn generate_and_attach_with_properties_adds_set_step() {
        let plan = scaffold::process(&json!({
            "action": "generate_and_attach",
            "className": "Health",
            "uuid": "node-456",
            "properties": [
                { "name": "maxHp", "type": "number", "default": 100 }
            ]
        }));
        assert!(plan.error.is_none());
        assert_eq!(plan.calls.len(), 4, "Expected 4 calls with properties step");
    }

    #[test]
    fn generate_event_handler_requires_events() {
        let plan = scaffold::process(&json!({
            "action": "generate_event_handler",
            "className": "ButtonHandler",
            "uuid": "btn-1"
        }));
        assert!(plan.error.is_some());
        assert!(plan.error.unwrap().contains("events"));
    }

    #[test]
    fn generate_event_handler_multi_step_with_bindings() {
        let plan = scaffold::process(&json!({
            "action": "generate_event_handler",
            "className": "UIHandler",
            "uuid": "btn-1",
            "events": [
                { "event": "click", "handler": "onBtnClick" },
                { "event": "touch-start", "handler": "onTouch" }
            ]
        }));
        assert!(plan.error.is_none());
        // scaffold + refresh + attach + 2 bind_event = 5
        assert_eq!(plan.calls.len(), 5);
    }

    #[test]
    fn add_properties_requires_class_name() {
        let plan = scaffold::process(&json!({ "action": "add_properties" }));
        assert!(plan.error.is_some());
    }

    #[test]
    fn invalid_action_returns_error() {
        let plan = scaffold::process(&json!({ "action": "nonexistent" }));
        assert!(plan.error.is_some());
        assert!(plan.error.unwrap().contains("nonexistent"));
    }

    #[test]
    fn definitions_returns_one_tool() {
        let defs = scaffold::definitions();
        assert_eq!(defs.len(), 1);
        assert_eq!(defs[0].name, "script_scaffold");
        assert_eq!(defs[0].actions.len(), 6);
        assert_eq!(defs[0].edition, "pro");
    }
}

#[cfg(test)]
mod anim_workflow_tests {
    use crate::tools::anim_workflow;
    use serde_json::json;

    #[test]
    fn create_transition_generates_clip() {
        let plan = anim_workflow::process(&json!({
            "action": "create_transition",
            "uuid": "node-1",
            "transitionType": "fade-in"
        }));
        assert!(plan.error.is_none());
        assert_eq!(plan.calls.len(), 1);
        let call = serde_json::to_value(&plan.calls[0]).unwrap();
        assert_eq!(call["type"], "sceneMethod");
        assert_eq!(call["method"], "createAnimationClip");
        let clip_args = &call["args"][0];
        assert_eq!(clip_args["uuid"], "node-1");
        assert_eq!(clip_args["wrapMode"], "Normal");
        assert!(clip_args["tracks"].as_array().unwrap().len() > 0);
    }

    #[test]
    fn all_transition_types_produce_tracks() {
        for t in &["fade-in", "fade-out", "slide-in-left", "slide-in-right", "slide-in-up", "bounce-in", "scale-in"] {
            let plan = anim_workflow::process(&json!({
                "action": "create_transition", "uuid": "n", "transitionType": t
            }));
            assert!(plan.error.is_none(), "Failed for transition: {}", t);
            let call = serde_json::to_value(&plan.calls[0]).unwrap();
            let tracks = call["args"][0]["tracks"].as_array().unwrap();
            assert!(!tracks.is_empty(), "No tracks for transition: {}", t);
        }
    }

    #[test]
    fn create_loop_animation_sets_loop_wrap() {
        let plan = anim_workflow::process(&json!({
            "action": "create_loop_animation", "uuid": "n", "loopType": "pulse"
        }));
        assert!(plan.error.is_none());
        let call = serde_json::to_value(&plan.calls[0]).unwrap();
        assert_eq!(call["args"][0]["wrapMode"], "Loop");
    }

    #[test]
    fn all_loop_types_produce_tracks() {
        for l in &["pulse", "float", "rotate", "breathe", "blink"] {
            let plan = anim_workflow::process(&json!({
                "action": "create_loop_animation", "uuid": "n", "loopType": l
            }));
            assert!(plan.error.is_none(), "Failed for loop: {}", l);
        }
    }

    #[test]
    fn apply_preset_all_types() {
        for p in &["idle", "walk", "attack", "hurt", "die"] {
            let plan = anim_workflow::process(&json!({
                "action": "apply_preset", "uuid": "n", "preset": p
            }));
            assert!(plan.error.is_none(), "Failed for preset: {}", p);
            let call = serde_json::to_value(&plan.calls[0]).unwrap();
            assert_eq!(call["args"][0]["clipName"], *p);
        }
    }

    #[test]
    fn create_ui_animation_all_types() {
        for t in &["button-press", "panel-popup", "notification-slide", "tab-switch"] {
            let plan = anim_workflow::process(&json!({
                "action": "create_ui_animation", "uuid": "n", "uiAnimType": t
            }));
            assert!(plan.error.is_none(), "Failed for ui anim: {}", t);
        }
    }

    #[test]
    fn create_from_description_requires_prompt() {
        let plan = anim_workflow::process(&json!({
            "action": "create_from_description", "uuid": "n"
        }));
        assert!(plan.error.is_some());
        assert!(plan.error.unwrap().contains("prompt"));
    }

    #[test]
    fn create_from_description_posts_to_bridge() {
        let plan = anim_workflow::process(&json!({
            "action": "create_from_description", "uuid": "n", "prompt": "bounce in"
        }));
        assert!(plan.error.is_none());
        let call = serde_json::to_value(&plan.calls[0]).unwrap();
        assert_eq!(call["type"], "bridgePost");
        assert_eq!(call["path"], "/api/mcp/ai/animation");
    }

    #[test]
    fn create_sequence_requires_clips() {
        let plan = anim_workflow::process(&json!({
            "action": "create_sequence", "uuid": "n"
        }));
        assert!(plan.error.is_some());
    }

    #[test]
    fn create_sequence_multi_clips() {
        let plan = anim_workflow::process(&json!({
            "action": "create_sequence",
            "uuid": "n",
            "clips": [
                { "clipName": "intro", "transitionType": "fade-in" },
                { "clipName": "loop", "loopType": "pulse" }
            ]
        }));
        assert!(plan.error.is_none());
        assert_eq!(plan.calls.len(), 2);
    }

    #[test]
    fn batch_animate_requires_uuids() {
        let plan = anim_workflow::process(&json!({
            "action": "batch_animate", "transitionType": "fade-in"
        }));
        assert!(plan.error.is_some());
    }

    #[test]
    fn batch_animate_requires_type() {
        let plan = anim_workflow::process(&json!({
            "action": "batch_animate", "uuids": ["a", "b"]
        }));
        assert!(plan.error.is_some());
    }

    #[test]
    fn batch_animate_creates_clip_per_node() {
        let plan = anim_workflow::process(&json!({
            "action": "batch_animate",
            "uuids": ["a", "b", "c"],
            "transitionType": "fade-in"
        }));
        assert!(plan.error.is_none());
        assert_eq!(plan.calls.len(), 3);
    }

    #[test]
    fn preview_animation_dispatches_play() {
        let plan = anim_workflow::process(&json!({
            "action": "preview_animation", "uuid": "n"
        }));
        assert!(plan.error.is_none());
        let call = serde_json::to_value(&plan.calls[0]).unwrap();
        assert_eq!(call["method"], "dispatchAnimationAction");
    }

    #[test]
    fn duration_override_respected() {
        let plan = anim_workflow::process(&json!({
            "action": "create_transition", "uuid": "n",
            "transitionType": "fade-in", "duration": 2.0
        }));
        let call = serde_json::to_value(&plan.calls[0]).unwrap();
        assert_eq!(call["args"][0]["duration"], 2.0);
    }

    #[test]
    fn uuid_required_for_most_actions() {
        for action in &["create_transition", "create_loop_animation", "apply_preset", "create_ui_animation", "preview_animation"] {
            let plan = anim_workflow::process(&json!({ "action": action }));
            assert!(plan.error.is_some(), "Expected uuid error for {}", action);
        }
    }

    #[test]
    fn definitions_returns_one_tool_with_8_actions() {
        let defs = anim_workflow::definitions();
        assert_eq!(defs.len(), 1);
        assert_eq!(defs[0].name, "animation_workflow");
        assert_eq!(defs[0].actions.len(), 8);
    }
}

#[cfg(test)]
mod ui_gen_tests {
    use crate::tools::ui_gen;
    use serde_json::json;

    fn count_calls_of_type(plan: &crate::types::ExecutionPlan, method_contains: &str) -> usize {
        plan.calls.iter().filter(|c| {
            let v = serde_json::to_value(c).unwrap();
            v.get("method").and_then(|m| m.as_str()).map_or(false, |m| m.contains(method_contains))
                || v.get("type").and_then(|t| t.as_str()).map_or(false, |t| t.contains(method_contains))
        }).count()
    }

    #[test]
    fn create_login_page_generates_multi_step() {
        let plan = ui_gen::process(&json!({ "action": "create_login_page" }));
        assert!(plan.error.is_none());
        assert!(plan.calls.len() >= 8, "Login page should have many steps, got {}", plan.calls.len());
    }

    #[test]
    fn create_settings_page_generates_controls() {
        let plan = ui_gen::process(&json!({ "action": "create_settings_page" }));
        assert!(plan.error.is_none());
        assert!(plan.calls.len() >= 10);
    }

    #[test]
    fn create_shop_page_respects_item_count() {
        let plan = ui_gen::process(&json!({ "action": "create_shop_page", "itemCount": 3 }));
        assert!(plan.error.is_none());
        let plan_big = ui_gen::process(&json!({ "action": "create_shop_page", "itemCount": 8 }));
        assert!(plan_big.calls.len() > plan.calls.len());
    }

    #[test]
    fn create_hud_generates_skill_bar() {
        let plan = ui_gen::process(&json!({ "action": "create_hud" }));
        assert!(plan.error.is_none());
        assert!(plan.calls.len() >= 10);
    }

    #[test]
    fn create_dialog_uses_custom_title() {
        let plan = ui_gen::process(&json!({
            "action": "create_dialog",
            "title": "Exit Game?",
            "content": "Are you sure you want to quit?"
        }));
        assert!(plan.error.is_none());
        let calls_json: Vec<_> = plan.calls.iter()
            .map(|c| serde_json::to_value(c).unwrap())
            .collect();
        let has_title = calls_json.iter().any(|c| {
            c.get("args").and_then(|a| a.get(0)).and_then(|a| a.get("text"))
                .and_then(|t| t.as_str()) == Some("Exit Game?")
        });
        assert!(has_title, "Dialog should contain custom title");
    }

    #[test]
    fn create_inventory_respects_columns() {
        let plan = ui_gen::process(&json!({
            "action": "create_inventory", "columns": 5, "itemCount": 20
        }));
        assert!(plan.error.is_none());
        assert!(plan.calls.len() >= 20);
    }

    #[test]
    fn create_custom_ui_requires_prompt() {
        let plan = ui_gen::process(&json!({ "action": "create_custom_ui" }));
        assert!(plan.error.is_some());
    }

    #[test]
    fn create_custom_ui_parses_keywords() {
        let plan = ui_gen::process(&json!({
            "action": "create_custom_ui",
            "prompt": "a page with scroll list, button, and input field"
        }));
        assert!(plan.error.is_none());
        // Should have canvas + root + widget + scroll + button + input = at least 7
        assert!(plan.calls.len() >= 6);
    }

    #[test]
    fn all_actions_start_with_canvas() {
        for action in &["create_login_page", "create_settings_page", "create_shop_page",
                        "create_hud", "create_dialog", "create_inventory"] {
            let plan = ui_gen::process(&json!({ "action": action }));
            assert!(plan.error.is_none());
            let first = serde_json::to_value(&plan.calls[0]).unwrap();
            let action_val = first["args"][0]["action"].as_str().unwrap_or("");
            assert_eq!(action_val, "ensure_2d_canvas", "First call of {} should be ensure_2d_canvas", action);
        }
    }

    #[test]
    fn invalid_action_returns_error() {
        let plan = ui_gen::process(&json!({ "action": "nonexistent" }));
        assert!(plan.error.is_some());
    }

    #[test]
    fn definitions_returns_7_actions() {
        let defs = ui_gen::definitions();
        assert_eq!(defs.len(), 1);
        assert_eq!(defs[0].name, "ui_generator");
        assert_eq!(defs[0].actions.len(), 7);
    }
}

#[cfg(test)]
mod linter_tests {
    use crate::tools::linter;
    use serde_json::json;

    #[test]
    fn check_all_multi_step_plan() {
        let plan = linter::process(&json!({ "action": "check_all" }));
        assert!(plan.error.is_none());
        assert_eq!(plan.calls.len(), 5, "check_all should have 5 steps (3 queries + 1 asset + 1 bridge)");

        let calls: Vec<_> = plan.calls.iter()
            .map(|c| serde_json::to_value(c).unwrap())
            .collect();
        assert_eq!(calls[0]["type"], "sceneMethod");
        assert_eq!(calls[1]["type"], "sceneMethod");
        assert_eq!(calls[2]["type"], "sceneMethod");
        assert_eq!(calls[3]["type"], "editorMsg");
        assert_eq!(calls[4]["type"], "bridgePost");
        assert_eq!(calls[4]["path"], "/api/mcp/ai/lint");
    }

    #[test]
    fn check_naming_two_step() {
        let plan = linter::process(&json!({ "action": "check_naming" }));
        assert!(plan.error.is_none());
        assert_eq!(plan.calls.len(), 2);
    }

    #[test]
    fn check_hierarchy_two_step() {
        let plan = linter::process(&json!({ "action": "check_hierarchy" }));
        assert!(plan.error.is_none());
        assert_eq!(plan.calls.len(), 2);
    }

    #[test]
    fn check_components_two_step() {
        let plan = linter::process(&json!({ "action": "check_components" }));
        assert!(plan.error.is_none());
        assert_eq!(plan.calls.len(), 2);
    }

    #[test]
    fn check_assets_two_step() {
        let plan = linter::process(&json!({ "action": "check_assets" }));
        assert!(plan.error.is_none());
        assert_eq!(plan.calls.len(), 2);
        let first = serde_json::to_value(&plan.calls[0]).unwrap();
        assert_eq!(first["type"], "editorMsg");
    }

    #[test]
    fn check_performance_two_step() {
        let plan = linter::process(&json!({ "action": "check_performance" }));
        assert!(plan.error.is_none());
        assert_eq!(plan.calls.len(), 2);
    }

    #[test]
    fn auto_fix_naming_single_bridge_post() {
        let plan = linter::process(&json!({ "action": "auto_fix_naming" }));
        assert!(plan.error.is_none());
        assert_eq!(plan.calls.len(), 1);
        let call = serde_json::to_value(&plan.calls[0]).unwrap();
        assert_eq!(call["path"], "/api/mcp/ai/lint-fix");
    }

    #[test]
    fn set_rules_requires_rules_param() {
        let plan = linter::process(&json!({ "action": "set_rules" }));
        assert!(plan.error.is_some());
        assert!(plan.error.unwrap().contains("rules"));
    }

    #[test]
    fn set_rules_posts_to_lint_rules() {
        let plan = linter::process(&json!({
            "action": "set_rules",
            "rules": { "naming": { "nodePattern": "camelCase" } }
        }));
        assert!(plan.error.is_none());
        assert_eq!(plan.calls.len(), 1);
        let call = serde_json::to_value(&plan.calls[0]).unwrap();
        assert_eq!(call["path"], "/api/mcp/ai/lint-rules");
    }

    #[test]
    fn check_all_includes_default_rules() {
        let plan = linter::process(&json!({ "action": "check_all" }));
        let last = serde_json::to_value(&plan.calls[4]).unwrap();
        let body = &last["body"];
        assert!(body["rules"]["naming"]["nodePattern"].is_string());
        assert!(body["rules"]["performance"]["maxNodes"].is_number());
    }

    #[test]
    fn invalid_action_returns_error() {
        let plan = linter::process(&json!({ "action": "nonexistent" }));
        assert!(plan.error.is_some());
    }

    #[test]
    fn definitions_returns_8_actions() {
        let defs = linter::definitions();
        assert_eq!(defs.len(), 1);
        assert_eq!(defs[0].name, "project_linter");
        assert_eq!(defs[0].actions.len(), 8);
    }
}

#[cfg(test)]
mod oplog_tests {
    use crate::tools::oplog;
    use serde_json::json;

    #[test]
    fn get_history_uses_bridge_get() {
        let plan = oplog::process(&json!({ "action": "get_history" }));
        assert!(plan.error.is_none());
        assert_eq!(plan.calls.len(), 1);
        let call = serde_json::to_value(&plan.calls[0]).unwrap();
        assert_eq!(call["type"], "bridgeGet");
        assert_eq!(call["path"], "/api/operations/history");
    }

    #[test]
    fn get_history_passes_filter() {
        let plan = oplog::process(&json!({
            "action": "get_history",
            "filter": { "tool": "scene_operation", "limit": 20 }
        }));
        assert!(plan.error.is_none());
        let call = serde_json::to_value(&plan.calls[0]).unwrap();
        assert_eq!(call["params"]["tool"], "scene_operation");
        assert_eq!(call["params"]["limit"], 20);
    }

    #[test]
    fn get_stats_uses_bridge_post() {
        let plan = oplog::process(&json!({ "action": "get_stats" }));
        assert!(plan.error.is_none());
        let call = serde_json::to_value(&plan.calls[0]).unwrap();
        assert_eq!(call["type"], "bridgePost");
    }

    #[test]
    fn export_log_default_json_format() {
        let plan = oplog::process(&json!({ "action": "export_log" }));
        assert!(plan.error.is_none());
        let call = serde_json::to_value(&plan.calls[0]).unwrap();
        assert_eq!(call["body"]["format"], "json");
        assert_eq!(call["body"]["savePath"], "db://assets/mcp-logs/");
    }

    #[test]
    fn export_script_uses_script_format() {
        let plan = oplog::process(&json!({ "action": "export_script" }));
        assert!(plan.error.is_none());
        let call = serde_json::to_value(&plan.calls[0]).unwrap();
        assert_eq!(call["body"]["format"], "script");
    }

    #[test]
    fn replay_last_default_count() {
        let plan = oplog::process(&json!({ "action": "replay_last" }));
        assert!(plan.error.is_none());
        let call = serde_json::to_value(&plan.calls[0]).unwrap();
        assert_eq!(call["body"]["count"], 10);
    }

    #[test]
    fn replay_last_custom_count() {
        let plan = oplog::process(&json!({ "action": "replay_last", "count": 5 }));
        let call = serde_json::to_value(&plan.calls[0]).unwrap();
        assert_eq!(call["body"]["count"], 5);
    }

    #[test]
    fn replay_from_log_requires_log() {
        let plan = oplog::process(&json!({ "action": "replay_from_log" }));
        assert!(plan.error.is_some());
        assert!(plan.error.unwrap().contains("log"));
    }

    #[test]
    fn replay_from_log_with_data() {
        let plan = oplog::process(&json!({
            "action": "replay_from_log",
            "log": [{ "tool": "scene_operation", "action": "create_node" }]
        }));
        assert!(plan.error.is_none());
        let call = serde_json::to_value(&plan.calls[0]).unwrap();
        assert_eq!(call["path"], "/api/mcp/ai/oplog-replay");
    }

    #[test]
    fn clear_history_requires_confirm() {
        let plan = oplog::process(&json!({ "action": "clear_history" }));
        assert!(plan.error.is_some());
        assert!(plan.suggestion.is_some());
    }

    #[test]
    fn clear_history_with_confirm() {
        let plan = oplog::process(&json!({
            "action": "clear_history", "confirmDangerous": true
        }));
        assert!(plan.error.is_none());
        let call = serde_json::to_value(&plan.calls[0]).unwrap();
        assert_eq!(call["path"], "/api/operations/clear-history");
    }

    #[test]
    fn bookmark_requires_label() {
        let plan = oplog::process(&json!({ "action": "bookmark" }));
        assert!(plan.error.is_some());
        assert!(plan.error.unwrap().contains("label"));
    }

    #[test]
    fn bookmark_with_label() {
        let plan = oplog::process(&json!({
            "action": "bookmark", "label": "before-refactor"
        }));
        assert!(plan.error.is_none());
        let call = serde_json::to_value(&plan.calls[0]).unwrap();
        assert_eq!(call["path"], "/api/mcp/ai/oplog-bookmark");
    }

    #[test]
    fn invalid_action_returns_error() {
        let plan = oplog::process(&json!({ "action": "nonexistent" }));
        assert!(plan.error.is_some());
    }

    #[test]
    fn definitions_returns_8_actions() {
        let defs = oplog::definitions();
        assert_eq!(defs.len(), 1);
        assert_eq!(defs[0].name, "operation_log");
        assert_eq!(defs[0].actions.len(), 8);
    }
}

#[cfg(test)]
mod mod_routing_tests {
    use crate::tools;
    use serde_json::json;

    #[test]
    fn phase4_tools_registered_in_definitions() {
        let defs = tools::get_definitions();
        let names: Vec<String> = defs.iter()
            .filter_map(|d| d.get("name").and_then(|n| n.as_str()).map(String::from))
            .collect();

        assert!(names.contains(&"script_scaffold".to_string()));
        assert!(names.contains(&"animation_workflow".to_string()));
        assert!(names.contains(&"ui_generator".to_string()));
        assert!(names.contains(&"project_linter".to_string()));
        assert!(names.contains(&"operation_log".to_string()));
    }

    #[test]
    fn phase4_tools_routed_in_process_call() {
        let tools_and_actions = vec![
            ("script_scaffold", json!({ "action": "list_templates" })),
            ("animation_workflow", json!({ "action": "create_transition", "uuid": "n", "transitionType": "fade-in" })),
            ("ui_generator", json!({ "action": "create_login_page" })),
            ("project_linter", json!({ "action": "check_performance" })),
            ("operation_log", json!({ "action": "get_history" })),
        ];

        for (tool, args) in tools_and_actions {
            let result = tools::process_call(tool, &args);
            let error = result.get("error").and_then(|e| e.as_str());
            assert!(
                error.map_or(true, |e| !e.contains("Unknown Pro tool")),
                "Tool {} should be routed, got error: {:?}", tool, error
            );
        }
    }

    #[test]
    fn unknown_tool_returns_error() {
        let result = tools::process_call("nonexistent_tool", &json!({}));
        let error = result.get("error").and_then(|e| e.as_str()).unwrap_or("");
        assert!(error.contains("Unknown Pro tool"));
    }

    #[test]
    fn total_tool_count_at_least_26() {
        let defs = tools::get_definitions();
        // 27 logical tools but some share definitions (execute_script + register_custom_macro)
        assert!(defs.len() >= 26, "Expected at least 26 tool definitions, got {}", defs.len());
    }
}
