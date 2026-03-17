use crate::types::*;
use crate::validate;
use serde_json::json;

const ACTIONS: &[&str] = &[
    // Community actions
    "list", "info", "create", "save", "delete",
    "move", "copy", "rename", "import", "open",
    "refresh", "create_folder",
    "get_meta", "set_meta_property",
    "uuid_to_url", "url_to_uuid", "search_by_type",
    // Pro-only extended actions
    "reimport", "get_dependencies", "get_dependents",
    "show_in_explorer", "clean_unused", "pack_atlas",
    "get_animation_clips", "get_materials",
    "validate_asset", "export_asset_manifest",
    "create_material", "generate_script",
    "batch_import", "get_asset_size", "slice_sprite",
];

const URL_REQUIRED: &[&str] = &[
    "info", "save", "delete", "move", "copy", "rename",
    "open", "get_meta", "set_meta_property",
    "uuid_to_url", "reimport", "get_dependencies", "get_dependents",
    "show_in_explorer", "validate_asset", "get_asset_size",
    "get_animation_clips", "get_materials", "slice_sprite",
];

pub fn definitions() -> Vec<ToolDefinition> {
    vec![ToolDefinition {
        name: "asset_operation".into(),
        description: concat!(
            "Manage Cocos Creator project assets (files, textures, scripts, prefabs, etc.).\n\n",
            "AI RULES:\n",
            "1. Use db:// paths (e.g., db://assets/textures/hero.png).\n",
            "2. NEVER create auto-generated sub-asset types (.spriteframe, .texture).\n",
            "3. After import, use refresh to update the asset database.\n\n",
            "Actions (32): list, info, create, save, delete, move, copy, rename, ",
            "import, open, refresh, create_folder, get_meta, set_meta_property, ",
            "uuid_to_url, url_to_uuid, search_by_type, ",
            "reimport, get_dependencies, get_dependents, show_in_explorer, ",
            "clean_unused, pack_atlas, get_animation_clips, get_materials, ",
            "validate_asset, export_asset_manifest, create_material, generate_script, ",
            "batch_import, get_asset_size, slice_sprite",
        ).into(),
        schema: json!({
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "enum": ACTIONS,
                    "description": "Asset action to perform."
                },
                "url": { "type": "string", "description": "Asset db:// URL. REQUIRED for most actions." },
                "uuid": { "type": "string", "description": "Asset UUID. For uuid_to_url." },
                "name": { "type": "string", "description": "New name for rename, or folder name for create_folder." },
                "targetUrl": { "type": "string", "description": "Destination db:// URL for move/copy." },
                "type": { "type": "string", "description": "Asset type filter for search_by_type, or create type." },
                "content": { "type": "string", "description": "File content for create." },
                "property": { "type": "string", "description": "Meta property path for set_meta_property." },
                "value": { "description": "Value for set_meta_property." },
                "sourcePath": { "type": "string", "description": "OS path for import." },
                "paths": { "type": "array", "description": "Array of OS paths for batch_import." },
                "scriptName": { "type": "string", "description": "Class name for generate_script." },
                "materialName": { "type": "string", "description": "Material name for create_material." },
                "confirmDangerous": { "type": "boolean", "description": "REQUIRED=true for delete." }
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

    if let Err(plan) = validate::require_string_for_actions(args, "url", &action, URL_REQUIRED) {
        return plan;
    }

    let method = match action.as_str() {
        "list" | "search_by_type" | "uuid_to_url" | "url_to_uuid"
        | "get_meta" | "info" | "get_dependencies" | "get_dependents"
        | "get_animation_clips" | "get_materials" | "get_asset_size"
        | "validate_asset" | "export_asset_manifest" | "clean_unused" => "query-assets",
        _ => "asset-change",
    };

    let is_query = method == "query-assets";

    if is_query {
        ExecutionPlan::single(CallInstruction::EditorMsg {
            module: "asset-db".into(),
            message: method.into(),
            args: vec![args.clone()],
        })
    } else {
        ExecutionPlan::single(CallInstruction::BridgePost {
            path: "/api/assets/operation".into(),
            body: Some(args.clone()),
        })
    }
}
