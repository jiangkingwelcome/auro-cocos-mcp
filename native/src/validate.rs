use serde_json::Value;

use crate::types::ExecutionPlan;

/// Extract the "action" string from tool call args.
pub fn get_action(args: &Value) -> Option<&str> {
    args.get("action").and_then(|v| v.as_str())
}

/// Require the "action" parameter, returning an error plan if missing.
pub fn require_action(args: &Value, valid_actions: &[&str]) -> Result<String, ExecutionPlan> {
    match get_action(args) {
        Some(a) => {
            if valid_actions.contains(&a) {
                Ok(a.to_string())
            } else {
                Err(ExecutionPlan::error_with_suggestion(
                    &format!("Unknown action: {}", a),
                    &format!("Valid actions: {}", valid_actions.join(", ")),
                ))
            }
        }
        None => Err(ExecutionPlan::error_with_suggestion(
            "Missing required parameter: action",
            &format!("Valid actions: {}", valid_actions.join(", ")),
        )),
    }
}

/// Require a string parameter by key.
pub fn require_string(args: &Value, key: &str) -> Result<String, ExecutionPlan> {
    match args.get(key).and_then(|v| v.as_str()) {
        Some(s) => Ok(s.to_string()),
        None => Err(ExecutionPlan::error(&format!("Missing required parameter: {}", key))),
    }
}

/// Require a string parameter for specific actions only.
pub fn require_string_for_actions(
    args: &Value,
    key: &str,
    action: &str,
    required_for: &[&str],
) -> Result<Option<String>, ExecutionPlan> {
    if required_for.contains(&action) {
        match args.get(key).and_then(|v| v.as_str()) {
            Some(s) => Ok(Some(s.to_string())),
            None => Err(ExecutionPlan::error_with_suggestion(
                &format!("Missing required parameter: {} (required for action={})", key, action),
                &format!("Provide {} when using action={}", key, action),
            )),
        }
    } else {
        Ok(args.get(key).and_then(|v| v.as_str()).map(String::from))
    }
}
