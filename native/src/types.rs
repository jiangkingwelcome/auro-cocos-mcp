use serde::{Deserialize, Serialize};
use serde_json::Value;

// ─── IPC Instructions ───────────────────────────────────────────────────────
// These are the 4 types of calls the JS executor can make to Cocos Editor.

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum CallInstruction {
    /// Call a scene script method: ctx.sceneMethod(method, args)
    #[serde(rename = "sceneMethod")]
    SceneMethod { method: String, args: Vec<Value> },

    /// HTTP GET to internal bridge route: ctx.bridgeGet(path, params)
    #[serde(rename = "bridgeGet")]
    BridgeGet {
        path: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        params: Option<Value>,
    },

    /// HTTP POST to internal bridge route: ctx.bridgePost(path, body)
    #[serde(rename = "bridgePost")]
    BridgePost {
        path: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        body: Option<Value>,
    },

    /// Editor IPC message: ctx.editorMsg(module, message, ...args)
    #[serde(rename = "editorMsg")]
    EditorMsg {
        module: String,
        message: String,
        args: Vec<Value>,
    },
}

// ─── Execution Plan ─────────────────────────────────────────────────────────
// Returned by Rust to JS. Contains the calls to execute and optional rollback.

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionPlan {
    pub calls: Vec<CallInstruction>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rollback: Option<Vec<CallInstruction>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub suggestion: Option<String>,
}

impl ExecutionPlan {
    pub fn single(call: CallInstruction) -> Self {
        Self { calls: vec![call], rollback: None, error: None, suggestion: None }
    }

    #[allow(dead_code)]
    pub fn multi(calls: Vec<CallInstruction>) -> Self {
        Self { calls, rollback: None, error: None, suggestion: None }
    }

    #[allow(dead_code)]
    pub fn with_rollback(calls: Vec<CallInstruction>, rollback: Vec<CallInstruction>) -> Self {
        Self { calls, rollback: Some(rollback), error: None, suggestion: None }
    }

    pub fn error(msg: &str) -> Self {
        Self { calls: vec![], rollback: None, error: Some(msg.to_string()), suggestion: None }
    }

    pub fn error_with_suggestion(msg: &str, suggestion: &str) -> Self {
        Self {
            calls: vec![],
            rollback: None,
            error: Some(msg.to_string()),
            suggestion: Some(suggestion.to_string()),
        }
    }
}

// ─── Tool Definition ────────────────────────────────────────────────────────
// Describes a Pro tool exposed to JS for MCP registration.

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolDefinition {
    pub name: String,
    pub description: String,
    pub schema: Value,
    pub actions: Vec<String>,
    pub edition: String,
}
