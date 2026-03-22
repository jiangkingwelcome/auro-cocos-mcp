use crate::types::*;
use crate::validate;
use serde_json::json;

const ACTIONS: &[&str] = &[
    "get_collider_info", "add_collider", "remove_collider", "set_collider_size",
    "add_rigidbody", "set_rigidbody", "set_rigidbody_props", "set_physics_material",
    "set_collision_group", "get_physics_world", "set_physics_world",
    "add_joint", "raycast",
];

const UUID_REQUIRED: &[&str] = &[
    "get_collider_info", "add_collider", "remove_collider", "set_collider_size",
    "add_rigidbody", "set_rigidbody", "set_rigidbody_props", "set_physics_material",
    "set_collision_group", "add_joint",
];

pub fn definitions() -> Vec<ToolDefinition> {
    vec![ToolDefinition {
        name: "physics_tool".into(),
        description: concat!(
            "Manage 2D/3D physics components on Cocos Creator nodes.\n\n",
            "Actions:\n",
            "- get_collider_info: uuid(REQUIRED). Get all collider and rigidbody details on a node.\n",
            "- add_collider: uuid(REQUIRED), colliderType(REQUIRED: box2d/circle2d/polygon2d/capsule2d/box3d/sphere3d/capsule3d). Add a collider.\n",
            "- remove_collider: currently unsupported in the JS scene backend.\n",
            "- set_collider_size: uuid(REQUIRED), width/height or radius or size. Set collider dimensions.\n",
            "- add_rigidbody: uuid(REQUIRED), bodyType(optional: Dynamic/Static/Kinematic), is2d(optional). Add RigidBody.\n",
            "- set_rigidbody_props: uuid(REQUIRED), mass/linearDamping/angularDamping/gravityScale/fixedRotation(optional). Configure rigidbody.\n",
            "- set_physics_material: uuid(REQUIRED), friction/restitution/density(optional). Set physics material on collider.\n",
            "- set_collision_group: uuid(REQUIRED), group(REQUIRED, integer). Set collision group/layer.\n",
            "- get_physics_world: no params. Get physics world configuration (gravity, timestep).\n",
            "- set_physics_world: gravity(optional {x,y,z}), allowSleep(optional), fixedTimeStep(optional). Configure physics world.\n",
            "- add_joint: uuid(REQUIRED), jointType(REQUIRED), connectedUuid(optional). Add physics joint.\n",
            "- raycast: currently unsupported in the JS scene backend.",
        ).into(),
        schema: json!({
            "type": "object",
            "properties": {
                "action": { "type": "string", "enum": ACTIONS, "description": "Physics action to perform." },
                "uuid": { "type": "string", "description": "Target node UUID. REQUIRED for most actions except get/set_physics_world and raycast." },
                "colliderType": {
                    "type": "string",
                    "enum": ["box2d", "circle2d", "polygon2d", "capsule2d", "box3d", "sphere3d", "capsule3d"],
                    "description": "Collider type. REQUIRED for: add_collider, remove_collider."
                },
                "bodyType": { "type": "string", "enum": ["Dynamic", "Static", "Kinematic"], "description": "Rigid body type. For add_rigidbody. Default: Dynamic." },
                "is2d": { "type": "boolean", "description": "Use 2D physics (RigidBody2D) vs 3D (RigidBody). For add_rigidbody. Default: auto-detect." },
                "width": { "type": "number", "description": "Collider width. For set_collider_size." },
                "height": { "type": "number", "description": "Collider height. For set_collider_size." },
                "radius": { "type": "number", "description": "Radius for circle/sphere/capsule collider. For set_collider_size." },
                "size": { "type": "object", "properties": { "x": { "type": "number" }, "y": { "type": "number" }, "z": { "type": "number" } }, "description": "Size vector for 3D colliders." },
                "mass": { "type": "number", "description": "Body mass. For set_rigidbody_props." },
                "linearDamping": { "type": "number", "description": "Linear damping. For set_rigidbody_props." },
                "angularDamping": { "type": "number", "description": "Angular damping. For set_rigidbody_props." },
                "gravityScale": { "type": "number", "description": "Gravity scale (2D only). For set_rigidbody_props." },
                "fixedRotation": { "type": "boolean", "description": "Lock rotation. For set_rigidbody_props." },
                "allowSleep": { "type": "boolean", "description": "Allow sleep. For set_rigidbody_props / set_physics_world." },
                "bullet": { "type": "boolean", "description": "Enable CCD. For set_rigidbody_props." },
                "friction": { "type": "number", "description": "Friction coefficient. For set_physics_material." },
                "restitution": { "type": "number", "description": "Bounciness (0-1). For set_physics_material." },
                "density": { "type": "number", "description": "Density. For set_physics_material." },
                "group": { "type": "integer", "description": "Collision group integer. REQUIRED for: set_collision_group." },
                "gravity": { "type": "object", "properties": { "x": { "type": "number" }, "y": { "type": "number" }, "z": { "type": "number" } }, "description": "World gravity vector. For set_physics_world." },
                "fixedTimeStep": { "type": "number", "description": "Physics fixed time step in seconds. For set_physics_world." },
                "jointType": { "type": "string", "enum": ["distance", "spring", "hinge", "fixed", "slider"], "description": "Joint type. REQUIRED for: add_joint." },
                "connectedBody": { "type": "string", "description": "Deprecated alias of connectedUuid. UUID of the connected rigidbody node." },
                "connectedUuid": { "type": "string", "description": "UUID of the connected rigidbody node. For add_joint." },
                "props": { "type": "object", "description": "Additional joint properties. For add_joint." },
                "origin": { "type": "object", "description": "Raycast origin point {x,y,z}. For raycast." },
                "direction": { "type": "object", "description": "Raycast direction {x,y,z}. For raycast." }
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

    if action == "remove_collider" {
        return ExecutionPlan::error_with_suggestion(
            "remove_collider is not implemented by the current JS scene backend",
            "Use remove_component with the collider component name instead",
        );
    }

    if action == "raycast" {
        return ExecutionPlan::error_with_suggestion(
            "raycast is not implemented by the current JS scene backend",
            "Use a dedicated scene query / physics query implementation before exposing this action",
        );
    }

    let mut normalized = args.clone();
    if let Some(obj) = normalized.as_object_mut() {
        if action == "set_rigidbody" {
            obj.insert("action".into(), json!("set_rigidbody_props"));
        }
        if let Some(connected_body) = obj.get("connectedBody").cloned() {
            obj.entry("connectedUuid").or_insert(connected_body);
        }
    }

    match action.as_str() {
        "get_collider_info" => {
            ExecutionPlan::single(CallInstruction::SceneMethod {
                method: "dispatchQuery".into(),
                args: vec![json!({
                    "action": "get_collider_info",
                    "uuid": args.get("uuid").cloned().unwrap_or(json!(null))
                })],
            })
        }
        "add_collider" => {
            let type_map: &[(&str, &str)] = &[
                ("box2d", "BoxCollider2D"), ("circle2d", "CircleCollider2D"),
                ("polygon2d", "PolygonCollider2D"), ("capsule2d", "CapsuleCollider2D"),
                ("box3d", "BoxCollider"), ("sphere3d", "SphereCollider"), ("capsule3d", "CapsuleCollider"),
            ];
            let collider_type = args.get("colliderType").and_then(|v| v.as_str()).unwrap_or("");
            let comp_name = type_map.iter()
                .find(|(k, _)| *k == collider_type)
                .map(|(_, v)| *v);

            match comp_name {
                Some(name) => ExecutionPlan::single(CallInstruction::SceneMethod {
                    method: "dispatchOperation".into(),
                    args: vec![json!({
                        "action": "add_component",
                        "uuid": args.get("uuid").cloned().unwrap_or(json!(null)),
                        "component": name
                    })],
                }),
                None => ExecutionPlan::error_with_suggestion(
                    &format!("Unknown colliderType: {}", collider_type),
                    "Valid types: box2d, circle2d, polygon2d, capsule2d, box3d, sphere3d, capsule3d",
                ),
            }
        }
        "add_rigidbody" => {
            let is_2d = args.get("is2d").and_then(|v| v.as_bool()).unwrap_or(true);
            let comp_name = if is_2d { "RigidBody2D" } else { "RigidBody" };
            let mut calls = vec![CallInstruction::SceneMethod {
                method: "dispatchOperation".into(),
                args: vec![json!({
                    "action": "add_component",
                    "uuid": args.get("uuid").cloned().unwrap_or(json!(null)),
                    "component": comp_name
                })],
            }];
            if let Some(body_type) = args.get("bodyType").and_then(|v| v.as_str()) {
                let type_val = match body_type {
                    "Static" => 0, "Kinematic" => 1, _ => 2,
                };
                calls.push(CallInstruction::SceneMethod {
                    method: "dispatchOperation".into(),
                    args: vec![json!({
                        "action": "set_property",
                        "uuid": args.get("uuid").cloned().unwrap_or(json!(null)),
                        "component": comp_name,
                        "property": "type",
                        "value": type_val
                    })],
                });
            }
            ExecutionPlan::multi(calls)
        }
        "set_physics_world" => {
            ExecutionPlan::single(CallInstruction::SceneMethod {
                method: "dispatchOperation".into(),
                args: vec![json!({
                    "action": "setup_physics_world",
                    "gravity": args.get("gravity").cloned(),
                    "allowSleep": args.get("allowSleep").cloned(),
                    "fixedTimeStep": args.get("fixedTimeStep").cloned()
                })],
            })
        }
        "get_physics_world" => {
            ExecutionPlan::single(CallInstruction::SceneMethod {
                method: "dispatchPhysicsAction".into(),
                args: vec![json!({ "action": "get_physics_world" })],
            })
        }
        _ => {
            ExecutionPlan::single(CallInstruction::SceneMethod {
                method: "dispatchPhysicsAction".into(),
                args: vec![normalized],
            })
        }
    }
}
