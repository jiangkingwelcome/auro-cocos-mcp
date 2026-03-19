use crate::types::*;
use crate::validate;
use serde_json::json;

const ACTIONS: &[&str] = &[
    "add",
    "query",
    "list",
    "list_categories",
    "delete",
    "update",
    "import_file",
    "export_file",
    "search",
    "get_stats",
];

pub fn definitions() -> Vec<ToolDefinition> {
    vec![ToolDefinition {
        name: "knowledge_base".into(),
        description: concat!(
            "Manage a knowledge base for Cocos Creator development - store and retrieve ",
            "code snippets, best practices, common solutions, and API references.\n\n",
            "Actions:\n",
            "- add: category(REQUIRED), title(REQUIRED), content(REQUIRED), tags(optional). Add a knowledge entry.\n",
            "- query: query(REQUIRED), category(optional), limit(optional). Query knowledge by text.\n",
            "- list: category(optional), limit(optional), offset(optional). List knowledge entries.\n",
            "- list_categories: List all knowledge categories.\n",
            "- delete: id(REQUIRED). Delete a knowledge entry.\n",
            "- update: id(REQUIRED), title(optional), content(optional), tags(optional). Update a knowledge entry.\n",
            "- import_file: filePath(REQUIRED). Import knowledge from a JSON file.\n",
            "- export_file: category(optional), outputPath(optional). Export knowledge to a JSON file.\n",
            "- search: keyword(REQUIRED), tags(optional), limit(optional). Search knowledge by keyword or tags.\n",
            "- get_stats: Get knowledge base statistics.\n",
        ).into(),
        schema: json!({
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "enum": ACTIONS,
                    "description": "Knowledge base action to perform."
                },
                "id": { "type": "string", "description": "Knowledge entry ID. REQUIRED for delete, update." },
                "category": { "type": "string", "description": "Knowledge category. REQUIRED for add, optional for query/list." },
                "title": { "type": "string", "description": "Knowledge entry title. REQUIRED for add, optional for update." },
                "content": { "type": "string", "description": "Knowledge content. REQUIRED for add, optional for update." },
                "tags": {
                    "type": "array",
                    "items": { "type": "string" },
                    "description": "Tags for the knowledge entry. Optional for add, update."
                },
                "query": { "type": "string", "description": "Query string. REQUIRED for query action." },
                "keyword": { "type": "string", "description": "Search keyword. REQUIRED for search action." },
                "limit": { "type": "number", "description": "Result limit. Default: 20." },
                "offset": { "type": "number", "description": "Result offset. Default: 0." },
                "filePath": { "type": "string", "description": "File path for import. REQUIRED for import_file." },
                "outputPath": { "type": "string", "description": "Output file path for export." }
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

    let action = validate::get_action(args).unwrap_or_default();

    // Validate required parameters based on action
    match action {
        "add" => {
            if let Err(plan) = validate::require_string(args, "category") {
                return plan;
            }
            if let Err(plan) = validate::require_string(args, "title") {
                return plan;
            }
            if let Err(plan) = validate::require_string(args, "content") {
                return plan;
            }
        }
        "query" => {
            if let Err(plan) = validate::require_string(args, "query") {
                return plan;
            }
        }
        "delete" | "update" => {
            if let Err(plan) = validate::require_string(args, "id") {
                return plan;
            }
        }
        "search" => {
            if let Err(plan) = validate::require_string(args, "keyword") {
                return plan;
            }
        }
        "import_file" => {
            if let Err(plan) = validate::require_string(args, "filePath") {
                return plan;
            }
        }
        _ => {}
    }

    ExecutionPlan::single(CallInstruction::BridgePost {
        path: "/api/knowledge".into(),
        body: Some(args.clone()),
    })
}
