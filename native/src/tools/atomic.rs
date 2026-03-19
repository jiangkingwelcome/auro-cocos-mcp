use crate::types::*;
use crate::validate;
use serde_json::json;

/// Atomic macro tool definitions — complex multi-step operations with auto-rollback.
pub fn definitions() -> Vec<ToolDefinition> {
    vec![
        ToolDefinition {
            name: "create_prefab_atomic".into(),
            description: concat!(
                "Atomically create a Cocos Creator prefab in ONE call with automatic rollback on failure.\n\n",
                "Pipeline: 1) ensure target directory, 2) create root node with components, ",
                "3) create children, 4) set properties, 5) save as .prefab, 6) refresh AssetDB, 7) cleanup.\n\n",
                "Parameters:\n",
                "- prefabPath(REQUIRED): db:// path for the .prefab file.\n",
                "- nodeName(optional): Root node name. Default: derived from filename.\n",
                "- components(optional): Array of {type, properties} for root node.\n",
                "- children(optional): Array of child node definitions.\n",
                "- position(optional): Initial position {x, y, z}.\n",
                "- cleanupSourceNode(optional, default true): Remove temp node after creation.",
            ).into(),
            schema: json!({
                "type": "object",
                "properties": {
                    "prefabPath": { "type": "string", "description": "Target db:// path for the .prefab file. REQUIRED." },
                    "nodeName": { "type": "string", "description": "Root node name." },
                    "components": { "type": "array", "description": "Components for root node." },
                    "children": { "type": "array", "description": "Child node definitions." },
                    "position": { "type": "object", "description": "Initial position {x, y, z}." },
                    "cleanupSourceNode": { "type": "boolean", "description": "Remove temp node. Default: true." }
                },
                "required": ["prefabPath"]
            }),
            actions: vec!["create".into()],
            edition: "pro".into(),
        },
        ToolDefinition {
            name: "import_and_apply_texture".into(),
            description: concat!(
                "Import an image file and apply it to a Sprite component in one atomic operation.\n\n",
                "Pipeline: 1) import image to AssetDB, 2) set sprite-frame type, 3) reimport, ",
                "4) wait for SpriteFrame, 5) apply to target Sprite component.\n\n",
                "Parameters:\n",
                "- sourcePath(REQUIRED): Absolute OS path to the image file.\n",
                "- targetDir(optional): db:// directory. Default: db://assets/textures/.\n",
                "- nodeUuid(optional): Target node UUID to apply the sprite to.\n",
                "- component(optional): Component name. Default: Sprite.",
            ).into(),
            schema: json!({
                "type": "object",
                "properties": {
                    "sourcePath": { "type": "string", "description": "Absolute OS path to image. REQUIRED." },
                    "targetDir": { "type": "string", "description": "db:// target directory." },
                    "nodeUuid": { "type": "string", "description": "Node UUID to apply sprite to." },
                    "component": { "type": "string", "description": "Component name. Default: Sprite." }
                },
                "required": ["sourcePath"]
            }),
            actions: vec!["import_apply".into()],
            edition: "pro".into(),
        },
        ToolDefinition {
            name: "setup_ui_layout".into(),
            description: concat!(
                "Create a ScrollView-based UI layout with content container in one call.\n\n",
                "Parameters:\n",
                "- parentUuid(optional): Parent node UUID. Default: Canvas.\n",
                "- layoutType(optional): vertical, horizontal, grid. Default: vertical.\n",
                "- itemCount(optional): Number of placeholder items. Default: 5.\n",
                "- scrollDirection(optional): vertical, horizontal. Default: vertical.",
            ).into(),
            schema: json!({
                "type": "object",
                "properties": {
                    "parentUuid": { "type": "string" },
                    "layoutType": { "type": "string", "enum": ["vertical", "horizontal", "grid"] },
                    "itemCount": { "type": "number" },
                    "scrollDirection": { "type": "string", "enum": ["vertical", "horizontal"] }
                }
            }),
            actions: vec!["setup".into()],
            edition: "pro".into(),
        },
        ToolDefinition {
            name: "create_tween_animation_atomic".into(),
            description: concat!(
                "Create a tween-based animation clip with keyframes in one atomic call.\n\n",
                "Parameters:\n",
                "- nodeUuid(REQUIRED): Target node UUID.\n",
                "- clipName(REQUIRED): Animation clip name.\n",
                "- duration(REQUIRED): Total duration in seconds.\n",
                "- keyframes(REQUIRED): Array of keyframe definitions.\n",
                "- easing(optional): Easing function. Default: linear.",
            ).into(),
            schema: json!({
                "type": "object",
                "properties": {
                    "nodeUuid": { "type": "string", "description": "Target node UUID. REQUIRED." },
                    "clipName": { "type": "string", "description": "Clip name. REQUIRED." },
                    "duration": { "type": "number", "description": "Duration in seconds. REQUIRED." },
                    "keyframes": { "type": "array", "description": "Keyframe definitions. REQUIRED." },
                    "easing": { "type": "string", "description": "Easing function. Default: linear." }
                },
                "required": ["nodeUuid", "clipName", "duration", "keyframes"]
            }),
            actions: vec!["create".into()],
            edition: "pro".into(),
        },
        ToolDefinition {
            name: "auto_fit_physics_collider".into(),
            description: concat!(
                "Automatically fit a 2D physics collider to a node's visual bounds.\n\n",
                "Parameters:\n",
                "- uuid(REQUIRED): Target node UUID.\n",
                "- colliderType(optional): box, circle, polygon. Default: box.\n",
                "- padding(optional): Extra padding in pixels. Default: 0.\n",
                "- sensor(optional): Is trigger only. Default: false.",
            ).into(),
            schema: json!({
                "type": "object",
                "properties": {
                    "uuid": { "type": "string", "description": "Target node UUID. REQUIRED." },
                    "colliderType": { "type": "string", "enum": ["box", "circle", "polygon"] },
                    "padding": { "type": "number", "description": "Extra padding pixels." },
                    "sensor": { "type": "boolean", "description": "Trigger-only collider." }
                },
                "required": ["uuid"]
            }),
            actions: vec!["auto_fit".into()],
            edition: "pro".into(),
        },
        // New prefab tool in 1.7.3
        ToolDefinition {
            name: "prefab_operation".into(),
            description: concat!(
                "Advanced prefab operations - sync, unpack, find references and usages.\n\n",
                "Actions (new in 1.7.3):\n",
                "- prefab_sync: uuid(REQUIRED). Sync prefab instance with its source.\n",
                "- prefab_unpack: uuid(REQUIRED). Unpack a prefab instance into regular nodes.\n",
                "- prefab_get_references: url(REQUIRED). Get all references to a prefab.\n",
                "- prefab_find_usages: url(REQUIRED). Find all usages of a prefab in the scene.\n",
                "- prefab_pack: uuid(REQUIRED). Pack nodes into a prefab.\n",
                "- prefab_compare: uuid(REQUIRED). Compare prefab instance with source.\n",
            ).into(),
            schema: json!({
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string",
                        "enum": ["prefab_sync", "prefab_unpack", "prefab_get_references", "prefab_find_usages", "prefab_pack", "prefab_compare"],
                        "description": "Prefab action to perform."
                    },
                    "uuid": { "type": "string", "description": "Node UUID. REQUIRED for sync, unpack, pack, compare." },
                    "url": { "type": "string", "description": "Prefab db:// URL. REQUIRED for get_references, find_usages." }
                },
                "required": ["action"]
            }),
            actions: vec!["prefab_sync".into(), "prefab_unpack".into(), "prefab_get_references".into(), "prefab_find_usages".into(), "prefab_pack".into(), "prefab_compare".into()],
            edition: "pro".into(),
        },
    ]
}

pub fn process_prefab(args: &serde_json::Value) -> ExecutionPlan {
    if let Err(plan) = validate::require_string(args, "prefabPath") {
        return plan;
    }
    ExecutionPlan::single(CallInstruction::BridgePost {
        path: "/api/mcp/atomic/create-prefab".into(),
        body: Some(args.clone()),
    })
}

pub fn process_texture(args: &serde_json::Value) -> ExecutionPlan {
    if let Err(plan) = validate::require_string(args, "sourcePath") {
        return plan;
    }
    ExecutionPlan::single(CallInstruction::BridgePost {
        path: "/api/mcp/atomic/import-texture".into(),
        body: Some(args.clone()),
    })
}

pub fn process_ui_layout(args: &serde_json::Value) -> ExecutionPlan {
    ExecutionPlan::single(CallInstruction::BridgePost {
        path: "/api/mcp/atomic/setup-ui-layout".into(),
        body: Some(args.clone()),
    })
}

pub fn process_tween(args: &serde_json::Value) -> ExecutionPlan {
    if let Err(plan) = validate::require_string(args, "nodeUuid") {
        return plan;
    }
    if let Err(plan) = validate::require_string(args, "clipName") {
        return plan;
    }
    ExecutionPlan::single(CallInstruction::BridgePost {
        path: "/api/mcp/atomic/create-tween".into(),
        body: Some(args.clone()),
    })
}

pub fn process_physics_collider(args: &serde_json::Value) -> ExecutionPlan {
    if let Err(plan) = validate::require_string(args, "uuid") {
        return plan;
    }
    ExecutionPlan::single(CallInstruction::BridgePost {
        path: "/api/mcp/atomic/auto-fit-collider".into(),
        body: Some(args.clone()),
    })
}

pub fn process_prefab_operation(args: &serde_json::Value) -> ExecutionPlan {
    let action = match args.get("action").and_then(|v| v.as_str()) {
        Some(a) => a,
        None => return ExecutionPlan::error("Missing required parameter: action"),
    };

    let valid_actions = ["prefab_sync", "prefab_unpack", "prefab_get_references", "prefab_find_usages", "prefab_pack", "prefab_compare"];
    if !valid_actions.contains(&action) {
        return ExecutionPlan::error(&format!("Invalid action: {}", action));
    }

    // Validate required parameters
    match action {
        "prefab_sync" | "prefab_unpack" | "prefab_pack" | "prefab_compare" => {
            if let Err(plan) = validate::require_string(args, "uuid") {
                return plan;
            }
        }
        "prefab_get_references" | "prefab_find_usages" => {
            if let Err(plan) = validate::require_string(args, "url") {
                return plan;
            }
        }
        _ => {}
    }

    ExecutionPlan::single(CallInstruction::BridgePost {
        path: "/api/mcp/prefab-operation".into(),
        body: Some(args.clone()),
    })
}
