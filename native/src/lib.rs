mod license;
mod tools;
mod types;
mod validate;

use napi_derive::napi;
use serde_json::Value;

/// Validate a license key. Returns { valid, edition, features, expiry? }.
#[napi]
pub fn validate_license(key: String) -> Value {
    license::validate(&key)
}

/// Get all Pro tool definitions (name, description, schema, actions).
/// Tool descriptions and schemas are embedded in the binary — cannot be extracted.
#[napi]
pub fn get_pro_tool_definitions() -> Vec<Value> {
    tools::get_definitions()
}

/// Process a Pro tool call: validate params, route action, return execution plan.
/// The plan contains IPC instructions for the JS executor to run.
#[napi]
pub fn process_tool_call(tool_name: String, args: Value) -> Value {
    tools::process_call(&tool_name, &args)
}

/// Get the Pro edition info (version, build date, features).
#[napi]
pub fn get_pro_info() -> Value {
    serde_json::json!({
        "version": env!("CARGO_PKG_VERSION"),
        "edition": "pro",
        "nativeArch": std::env::consts::ARCH,
        "nativeOs": std::env::consts::OS,
    })
}
