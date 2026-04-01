import { z } from 'zod';
import type { LocalToolServer } from './local-tool-server';
import type { BridgeToolContext } from './tools-shared';
import {
  toInputSchema,
  normalizeDbUrl,
  sanitizeDbUrl,
  ensureAssetDirectory,
  errorMessage,
  attachScenePersistenceWarnings,
  persistenceModeSchema,
  withPersistenceGuard,
} from './tools-shared';
import { ErrorCategory, logIgnored } from '../error-utils';

export function registerPrefabAtomicTool(server: LocalToolServer, ctx: BridgeToolContext): void {
  const { bridgePost, sceneMethod, editorMsg, text } = ctx;
  const extractUuid = (raw: unknown): string => {
    if (typeof raw === 'string') return raw;
    if (!raw || typeof raw !== 'object') return '';
    const obj = raw as Record<string, unknown>;
    return String(obj.uuid ?? obj._id ?? '');
  };
  const createNode = async (name: string, parentUuid?: string): Promise<string> => {
    try {
      const legacyResult = await sceneMethod('createChildNode', [parentUuid ?? '', name]);
      const legacyUuid = extractUuid(legacyResult);
      if (legacyUuid) return legacyUuid;
    } catch (e) {
      logIgnored(ErrorCategory.ENGINE_API, `createChildNode 场景脚本失败，回退到 Editor IPC: ${name}`, e);
    }

    try {
      const rawNode = await editorMsg('scene', 'create-node', parentUuid ? { parent: parentUuid, name } : { name });
      const ipcUuid = extractUuid(rawNode);
      if (ipcUuid) return ipcUuid;
    } catch (e) {
      logIgnored(ErrorCategory.EDITOR_IPC, `create-node IPC 失败，回退到场景脚本: ${name}`, e);
    }
    throw new Error(`创建节点 ${name} 失败（未返回 UUID）`);
  };

  server.tool(
    'create_prefab_atomic',
    `Atomically create a Cocos Creator prefab in ONE call with automatic rollback on failure.

Pipeline: 1) ensure target directory exists, 2) create root node with components, 3) create child nodes with components,
4) set properties on all components, 5) save as .prefab asset, 6) refresh AssetDB, 7) cleanup temp node from scene.

Use this INSTEAD of manually chaining scene_operation calls for prefab creation.
On failure at any stage, all temporary nodes are automatically cleaned up (rolled back).

Parameters:
- prefabPath(REQUIRED): db:// path where the .prefab will be saved. Directories are auto-created. Path auto-normalized.
- nodeName(optional): Root node name. Default: derived from prefabPath filename.
- components(optional): Array of components to add to root node, each with type and optional properties.
- children(optional): Array of child node definitions, each with name and optional components.
- position(optional): Initial position {x, y, z} for the root node.
- cleanupSourceNode(optional, default true): Remove temp node from scene after prefab creation.
- persistenceMode(optional: warn/auto-save/strict). Controls whether successful scene writes only warn, auto-save, or fail in strict persistence mode.

ASSET REFERENCES in components.properties: For spriteFrame/font/material properties, use {__uuid__:"asset-uuid"}. Get UUID via asset_operation action=url_to_uuid.
Returns: {success, prefabPath, rootNodeUuid, stages:["create_root_node","add_component:X","create_prefab","cleanup_temp_node"], completedStages?, rollback?:[]}. Successful write results may include persistenceStatus{mode,target,requiresPersistence,saveAttempted,...}. On error: {success:false, error, stage, rollback}.
Auto-rollback: If prefab creation fails, the temp node is automatically destroyed. Set cleanupSourceNode=false to keep it for debugging.`,
    toInputSchema({
      prefabPath: z.string().describe(
        'Target db:// path for the .prefab file. REQUIRED. Auto-creates intermediate directories. ' +
        'Path segments are auto-normalized for case consistency. ' +
        'Example: "db://assets/prefabs/enemies/Boss.prefab".'
      ),
      nodeName: z.string().optional().describe(
        'Name for the root node of the prefab. Default: derived from prefabPath filename (e.g. "Boss" from "Boss.prefab"). ' +
        'Example: "EnemyBoss".'
      ),
      components: z.array(z.object({
        type: z.string().describe(
          'Component class name. e.g. "Sprite", "Label", "UITransform", "BoxCollider2D", "RigidBody2D".'
        ),
        properties: z.record(z.string(), z.unknown()).optional().describe(
          'Component property key-value pairs. e.g. {"string": "Hello", "fontSize": 24} for Label.'
        ),
      })).optional().describe(
        'Components to add to the ROOT node. Each entry adds a component and optionally sets its properties. ' +
        'Example: [{"type": "Sprite"}, {"type": "BoxCollider2D", "properties": {"size": {"width": 100, "height": 100}}}]'
      ),
      children: z.array(z.object({
        name: z.string().describe('Child node name. e.g. "Label", "Icon", "HealthBar".'),
        components: z.array(z.object({
          type: z.string().describe('Component class name for this child node.'),
          properties: z.record(z.string(), z.unknown()).optional().describe('Component property key-value pairs.'),
        })).optional().describe('Components to add to this child node.'),
      })).optional().describe(
        'Child nodes to create under the root. Each child can have its own components. ' +
        'Example: [{"name": "Label", "components": [{"type": "Label", "properties": {"string": "Click Me"}}]}]'
      ),
      position: z.object({
        x: z.number().describe('X position. Default: 0'),
        y: z.number().describe('Y position. Default: 0'),
        z: z.number().describe('Z position. Default: 0'),
      }).optional().describe(
        'Initial LOCAL position for the root node before saving as prefab. Default: {x:0, y:0, z:0}.'
      ),
      cleanupSourceNode: z.boolean().optional().describe(
        'Whether to remove the temporary node from the scene after prefab creation. ' +
        'Default: true. Set false to keep the node in scene as a prefab instance.'
      ),
      persistenceMode: persistenceModeSchema,
    }),
    async (params) => {
      const p = params as Record<string, unknown>;
      const stages: string[] = [];
      let tempNodeUuid = '';
      const childUuids: string[] = [];

      const rawPath = String(p.prefabPath || 'db://assets/prefabs/NewPrefab.prefab');
      const pathErr = sanitizeDbUrl(rawPath);
      if (pathErr) return text({ success: false, error: `路径安全校验失败: ${pathErr}` }, true);
      const normalized = normalizeDbUrl(rawPath);
      const prefabPath = normalized.url;
      const warnings: string[] = [];
      if (normalized.normalized) {
        warnings.push(`路径已自动规范化: ${p.prefabPath} → ${prefabPath}`);
      }

      try {
        stages.push('ensure_directory');
        await ensureAssetDirectory(editorMsg, prefabPath);

        const nodeName = p.nodeName || prefabPath.split('/').pop()?.replace('.prefab', '') || 'NewPrefab';
        stages.push('create_root_node');
        const rootUuid = await createNode(String(nodeName));
        if (!rootUuid) {
          return text({ success: false, stage: 'create_root_node', error: '创建节点失败（未返回 UUID）' }, true);
        }
        tempNodeUuid = rootUuid;

        if (p.position) {
          stages.push('set_position');
          const pos = p.position as { x?: number; y?: number; z?: number };
          await sceneMethod('setNodePosition', [tempNodeUuid, pos.x || 0, pos.y || 0, pos.z || 0]);
        }

        if (Array.isArray(p.components)) {
          for (const comp of p.components as Array<{ type: string; properties?: Record<string, unknown> }>) {
            stages.push(`add_component:${comp.type}`);
            const compNameFull = comp.type.startsWith('cc.') || comp.type.includes('.') ? comp.type : `cc.${comp.type}`;
            await editorMsg('scene', 'create-component', { uuid: tempNodeUuid, component: compNameFull });
            if (comp.properties && typeof comp.properties === 'object') {
              for (const [propKey, propVal] of Object.entries(comp.properties)) {
                stages.push(`set_property:${comp.type}.${propKey}`);
                await sceneMethod('setComponentProperty', [tempNodeUuid, comp.type, propKey, propVal]);
              }
            }
          }
        }

        if (Array.isArray(p.children)) {
          for (const child of p.children as Array<{ name: string; components?: Array<{ type: string; properties?: Record<string, unknown> }> }>) {
            stages.push(`create_child:${child.name}`);
            const childUuid = await createNode(child.name, tempNodeUuid);
            if (!childUuid) {
              throw new Error(`创建子节点 ${child.name} 失败（未返回 UUID）`);
            }
            childUuids.push(childUuid);

            if (Array.isArray(child.components)) {
              for (const comp of child.components) {
                stages.push(`child_component:${child.name}.${comp.type}`);
                const childCompFull = comp.type.startsWith('cc.') || comp.type.includes('.') ? comp.type : `cc.${comp.type}`;
                await editorMsg('scene', 'create-component', { uuid: childUuid, component: childCompFull });
                if (comp.properties && typeof comp.properties === 'object') {
                  for (const [propKey, propVal] of Object.entries(comp.properties)) {
                    await sceneMethod('setComponentProperty', [childUuid, comp.type, propKey, propVal]);
                  }
                }
              }
            }
          }
        }
        stages.push('create_prefab');
        const prefabResult = await editorMsg('scene', 'create-prefab', tempNodeUuid, prefabPath);

        stages.push('refresh_asset_db');
        try {
          await bridgePost('/api/asset-db/refresh', { url: prefabPath.substring(0, prefabPath.lastIndexOf('/')) });
        } catch (e) {
          logIgnored(ErrorCategory.ASSET_OPERATION, '预制体创建后刷新资源数据库失败（非关键）', e);
        }

        const shouldCleanup = p.cleanupSourceNode !== false;
        if (shouldCleanup && tempNodeUuid) {
          stages.push('cleanup_temp_node');
          try {
            await editorMsg('scene', 'remove-node', { uuid: tempNodeUuid });
          } catch (e1) {
            logIgnored(ErrorCategory.EDITOR_IPC, '通过 IPC 清理临时节点失败，尝试场景脚本方式', e1);
            try { await sceneMethod('destroyNode', [tempNodeUuid]); } catch (e2) { logIgnored(ErrorCategory.ENGINE_API, '通过场景脚本清理临时节点也失败', e2); }
          }
        }

        const { result, isError } = await withPersistenceGuard(
          { editorMsg, bridgePost },
          {
            mode: p.persistenceMode,
            target: shouldCleanup
              ? { kind: 'asset', url: prefabPath }
              : {
                kind: 'multi',
                targets: [
                  { kind: 'asset', url: prefabPath },
                  { kind: 'scene', saveStrategy: 'save_scene' },
                ],
              },
            strictFailureMessage: 'create_prefab_atomic 写入成功，但持久化失败（strict 模式）',
          },
          async () => {
            const response: Record<string, unknown> = {
              success: true, prefabPath,
              rootNodeUuid: shouldCleanup ? '(已清理)' : tempNodeUuid,
              stages, prefabResult,
              ...(warnings.length ? { warnings } : {}),
            };
            await attachScenePersistenceWarnings(editorMsg, response, {
              action: 'create_prefab_atomic',
              includePrefabWarning: false,
              includeSceneSaveWarning: false,
            });
            return response;
          },
        );
        return text(result, isError ? true : undefined);

      } catch (err: unknown) {
        const rollbackResult: string[] = [];
        const shouldRollback = ctx.isAutoRollbackEnabled ? ctx.isAutoRollbackEnabled() : true;
        if (tempNodeUuid && shouldRollback) {
          try {
            await editorMsg('scene', 'remove-node', { uuid: tempNodeUuid });
            rollbackResult.push(`已回滚: 通过 Editor IPC 删除临时节点 ${tempNodeUuid}`);
          } catch (e) {
            logIgnored(ErrorCategory.EDITOR_IPC, '回滚时通过 IPC 删除临时节点失败，尝试场景脚本方式', e);
            try {
              await sceneMethod('destroyNode', [tempNodeUuid]);
              rollbackResult.push(`已回滚: 通过场景脚本删除临时节点 ${tempNodeUuid}`);
            } catch (rollbackErr: unknown) {
              rollbackResult.push(`回滚失败: ${errorMessage(rollbackErr)}`);
            }
          }
        } else if (tempNodeUuid && !shouldRollback) {
          rollbackResult.push(`自动回滚已关闭，临时节点 ${tempNodeUuid} 保留在场景中`);
        }

        return text({
          success: false, prefabPath,
          stage: stages[stages.length - 1] || 'unknown',
          failedStage: stages[stages.length - 1] || 'unknown',
          completedStages: stages.slice(0, -1),
          error: errorMessage(err), rollback: rollbackResult,
          ...(warnings.length ? { warnings } : {}),
        }, true);
      }
    },
  );
}
