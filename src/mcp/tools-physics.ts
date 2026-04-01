import { z } from 'zod';
import { LocalToolServer } from './local-tool-server';
import type { BridgeToolContext } from './tools-shared';
import {
  toInputSchema,
  errorMessage,
  AI_RULES,
  beginSceneRecording,
  endSceneRecording,
  validateRequiredParams,
  attachScenePersistenceWarnings,
  persistenceModeSchema,
  withPersistenceGuard,
} from './tools-shared';

export function registerPhysicsTools(server: LocalToolServer, ctx: BridgeToolContext): void {
  const { sceneMethod, editorMsg, bridgePost, text } = ctx;
  const sceneOp = ctx.sceneOp ?? ((params: Record<string, unknown>) => sceneMethod('dispatchOperation', [params]));

  // 物理写操作：从主进程包裹 begin-recording + dispatchPhysicsAction + force-dirty + end-recording
  async function physicsWriteOp(action: Record<string, unknown>): Promise<Record<string, unknown>> {
    const uuid = String(action.uuid ?? '');
    const recordId = await beginSceneRecording(editorMsg, uuid ? [uuid] : []);
    try {
      const r = await sceneMethod('dispatchPhysicsAction', [action]) as Record<string, unknown>;
      if (uuid) {
        try {
          const dump = await editorMsg('scene', 'query-node', uuid) as Record<string, unknown>;
          const nameVal = (dump as { value?: { name?: { value?: string } } })?.value?.name?.value;
          if (typeof nameVal === 'string' && nameVal) {
            await editorMsg('scene', 'set-property', {
              uuid, path: 'name',
              dump: { type: 'string', value: nameVal },
            });
          }
        } catch { /* force-dirty is best-effort */ }
      }
      return r;
    } finally {
      await endSceneRecording(editorMsg, recordId);
    }
  }

  async function finalizeWriteResult(
    result: unknown,
    action: string,
    affectedUuid = '',
  ): Promise<Record<string, unknown>> {
    if (!result || typeof result !== 'object') {
      return { success: true, result };
    }
    const response = result as Record<string, unknown>;
    if (!response.error && response.success !== false) {
      await attachScenePersistenceWarnings(editorMsg, response, {
        action,
        affectedUuid,
        includeSceneSaveWarning: false,
        includePrefabWarning: Boolean(affectedUuid),
      });
    }
    return response;
  }

  async function runPhysicsWriteWithPersistence(
    mode: unknown,
    action: string,
    affectedUuid: string,
    execute: () => Promise<Record<string, unknown>>,
  ) {
    const { result, isError } = await withPersistenceGuard(
      { editorMsg, bridgePost },
      {
        mode,
        target: { kind: 'scene', saveStrategy: 'save_scene' },
        strictFailureMessage: `${action} 写入成功，但持久化失败（strict 模式）`,
      },
      async () => finalizeWriteResult(await execute(), action, affectedUuid),
    );
    return text(result, isError ? true : undefined);
  }

  server.tool(
    'physics_tool',
    `Manage physics components, materials, and collision settings on Cocos Creator nodes. Inspect and configure colliders, rigid bodies, joints, and physics world.

Actions & required parameters:
- get_collider_info: uuid(REQUIRED). Get all collider and rigidbody details on a node.
- add_collider: uuid(REQUIRED), colliderType(REQUIRED: box2d/circle2d/polygon2d/capsule2d/box3d/sphere3d/capsule3d). Add a collider component.
- set_collider_size: uuid(REQUIRED), colliderType(optional, auto-detect), width/height(for box), radius(for circle/sphere), size(for {x,y} or {x,y,z}).
- add_rigidbody: uuid(REQUIRED), bodyType(optional: Dynamic/Static/Kinematic, default Dynamic), is2d(optional, default auto).
- set_rigidbody_props: uuid(REQUIRED), mass/linearDamping/angularDamping/gravityScale/fixedRotation/allowSleep/bullet(all optional).
- set_physics_material: uuid(REQUIRED), friction(optional), restitution(optional), density(optional). Set physics material properties on collider.
- set_collision_group: uuid(REQUIRED), group(REQUIRED, integer). Set the collision group/layer of a collider.
- get_physics_world: no params. Get current physics world configuration (gravity, timestep, etc.).
- set_physics_world: gravity(optional {x,y,z}), allowSleep(optional), fixedTimeStep(optional). Configure physics world.
- add_joint: uuid(REQUIRED), jointType(REQUIRED: distance/spring/hinge/fixed/slider), connectedUuid(optional), props(optional). Add a 2D physics joint.
- persistenceMode(optional: warn/auto-save/strict). Controls whether successful scene writes only warn, auto-save, or fail in strict persistence mode.

Prerequisites: add_collider/add_rigidbody require node to exist. add_rigidbody before add_collider for proper physics simulation. bodyType: 0=STATIC, 1=KINEMATIC, 2=DYNAMIC(default).
Returns: add_collider→{success,uuid,colliderType}. add_rigidbody→{success,uuid,bodyType}. get_collider_info→{colliders:[{type,size,offset}],rigidBody?:{type,mass}}. get_physics_world→{gravity,allowSleep}. Successful write results may include persistenceStatus{mode,target,requiresPersistence,saveAttempted,...}. On error: {error:"message"}.` + AI_RULES,
    toInputSchema({
      action: z.enum([
        'get_collider_info', 'add_collider', 'set_collider_size',
        'add_rigidbody', 'set_rigidbody_props', 'set_physics_material',
        'set_collision_group', 'get_physics_world', 'set_physics_world', 'add_joint'
      ]).describe('Physics action to perform.'),
      uuid: z.string().optional().describe(
        'Target node UUID. REQUIRED for most actions except get_physics_world/set_physics_world.'
      ),
      colliderType: z.enum([
        'box2d', 'circle2d', 'polygon2d', 'capsule2d',
        'box3d', 'sphere3d', 'capsule3d'
      ]).optional().describe(
        'Collider type to add. REQUIRED for: add_collider.'
      ),
      bodyType: z.enum(['Dynamic', 'Static', 'Kinematic']).optional().describe(
        'Rigid body type. For add_rigidbody. Default: Dynamic.'
      ),
      is2d: z.boolean().optional().describe(
        'Whether to use 2D physics (RigidBody2D) vs 3D (RigidBody). For add_rigidbody. Default: auto-detect.'
      ),
      // Collider sizing
      width: z.number().min(0).optional().describe('Width for box collider. For set_collider_size.'),
      height: z.number().min(0).optional().describe('Height for box collider. For set_collider_size.'),
      radius: z.number().min(0).optional().describe('Radius for circle/sphere/capsule collider. For set_collider_size.'),
      size: z.object({
        x: z.number().optional(),
        y: z.number().optional(),
        z: z.number().optional(),
      }).optional().describe('Size vector for 3D colliders. For set_collider_size.'),
      // RigidBody props
      mass: z.number().min(0).optional().describe('Body mass. For set_rigidbody_props.'),
      linearDamping: z.number().min(0).optional().describe('Linear damping. For set_rigidbody_props.'),
      angularDamping: z.number().min(0).optional().describe('Angular damping. For set_rigidbody_props.'),
      gravityScale: z.number().optional().describe('Gravity scale (2D only). For set_rigidbody_props.'),
      fixedRotation: z.boolean().optional().describe('Lock rotation. For set_rigidbody_props.'),
      allowSleep: z.boolean().optional().describe('Allow sleep. For set_rigidbody_props / set_physics_world.'),
      bullet: z.boolean().optional().describe('Enable CCD (continuous collision). For set_rigidbody_props.'),
      // Physics material
      friction: z.number().min(0).optional().describe('Friction coefficient. For set_physics_material.'),
      restitution: z.number().min(0).max(1).optional().describe('Bounciness (0-1). For set_physics_material.'),
      density: z.number().min(0).optional().describe('Density. For set_physics_material.'),
      // Collision group
      group: z.number().int().optional().describe('Collision group integer. REQUIRED for: set_collision_group.'),
      // Physics world
      gravity: z.object({
        x: z.number().optional(),
        y: z.number().optional(),
        z: z.number().optional(),
      }).optional().describe('World gravity vector. For set_physics_world.'),
      fixedTimeStep: z.number().min(0.001).max(0.1).optional().describe(
        'Physics fixed time step in seconds. For set_physics_world.'
      ),
      // Joint
      jointType: z.enum(['distance', 'spring', 'hinge', 'fixed', 'slider']).optional().describe(
        'Joint type. REQUIRED for: add_joint.'
      ),
      connectedUuid: z.string().optional().describe(
        'UUID of the connected node for joints. For add_joint.'
      ),
      props: z.record(z.string(), z.unknown()).optional().describe(
        'Additional properties for the joint. For add_joint.'
      ),
      persistenceMode: persistenceModeSchema,
    }),
    async (params) => {
      try {
        const p = params as Record<string, unknown>;
        const _paramErr = validateRequiredParams('physics_tool', String(p.action), p);
        if (_paramErr) return text({ error: _paramErr }, true);

        switch (p.action) {
          case 'get_collider_info': {
            return text(await sceneMethod('dispatchQuery', [{ action: 'get_collider_info', uuid: p.uuid }]));
          }
          case 'add_collider': {
            const TYPE_MAP: Record<string, string> = {
              box2d: 'BoxCollider2D', circle2d: 'CircleCollider2D',
              polygon2d: 'PolygonCollider2D', capsule2d: 'CapsuleCollider2D',
              box3d: 'BoxCollider', sphere3d: 'SphereCollider', capsule3d: 'CapsuleCollider',
            };
            const compName = TYPE_MAP[String(p.colliderType ?? '')] ?? '';
            if (!compName) return text({ error: `未知 colliderType: ${p.colliderType}` }, true);
            return runPhysicsWriteWithPersistence(
              p.persistenceMode,
              'physics_tool.add_collider',
              String(p.uuid ?? ''),
              async () => await sceneOp({ action: 'add_component', uuid: p.uuid, component: compName }) as Record<string, unknown>,
            );
          }
          case 'set_collider_size': {
            // Dispatch to scene script which can read the node's collider and set size
            return runPhysicsWriteWithPersistence(
              p.persistenceMode,
              'physics_tool.set_collider_size',
              String(p.uuid ?? ''),
              async () => await physicsWriteOp(p),
            );
          }
          case 'add_rigidbody': {
            const is2d = p.is2d !== false; // default 2D
            const compName = is2d ? 'RigidBody2D' : 'RigidBody';
            return runPhysicsWriteWithPersistence(
              p.persistenceMode,
              'physics_tool.add_rigidbody',
              String(p.uuid ?? ''),
              async () => {
                const addResult = await sceneOp({ action: 'add_component', uuid: p.uuid, component: compName }) as Record<string, unknown>;
                if (!addResult?.error && addResult?.success !== false && p.bodyType) {
                  const typeMap: Record<string, number> = { Dynamic: 2, Static: 0, Kinematic: 1 };
                  const typeVal = typeMap[String(p.bodyType)] ?? 2;
                  await sceneOp({ action: 'set_property', uuid: p.uuid, component: compName, property: 'type', value: typeVal });
                }
                return addResult;
              },
            );
          }
          case 'set_rigidbody_props': {
            return runPhysicsWriteWithPersistence(
              p.persistenceMode,
              'physics_tool.set_rigidbody_props',
              String(p.uuid ?? ''),
              async () => await physicsWriteOp(p),
            );
          }
          case 'set_physics_material': {
            return runPhysicsWriteWithPersistence(
              p.persistenceMode,
              'physics_tool.set_physics_material',
              String(p.uuid ?? ''),
              async () => await physicsWriteOp(p),
            );
          }
          case 'set_collision_group': {
            return runPhysicsWriteWithPersistence(
              p.persistenceMode,
              'physics_tool.set_collision_group',
              String(p.uuid ?? ''),
              async () => await physicsWriteOp(p),
            );
          }
          case 'get_physics_world': {
            return text(await sceneMethod('dispatchPhysicsAction', [{ action: 'get_physics_world' }]));
          }
          case 'set_physics_world': {
            return runPhysicsWriteWithPersistence(
              p.persistenceMode,
              'physics_tool.set_physics_world',
              '',
              async () => await sceneOp({ action: 'setup_physics_world', gravity: p.gravity, allowSleep: p.allowSleep, fixedTimeStep: p.fixedTimeStep }) as Record<string, unknown>,
            );
          }
          case 'add_joint': {
            return runPhysicsWriteWithPersistence(
              p.persistenceMode,
              'physics_tool.add_joint',
              String(p.uuid ?? ''),
              async () => await physicsWriteOp(p),
            );
          }
          default:
            return text({ error: `未知的物理 action: ${p.action}` }, true);
        }
      } catch (err: unknown) {
        return text({ tool: 'physics_tool', error: errorMessage(err) }, true);
      }
    },
  );
}
