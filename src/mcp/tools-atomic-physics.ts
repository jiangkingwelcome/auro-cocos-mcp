import { z } from 'zod';
import type { LocalToolServer } from './local-tool-server';
import type { BridgeToolContext } from './tools-shared';
import { toInputSchema, extractSelectedNodeUuid, errorMessage, beginSceneRecording, endSceneRecording } from './tools-shared';
import { ErrorCategory, logIgnored } from '../error-utils';

export function registerPhysicsAtomicTool(server: LocalToolServer, ctx: BridgeToolContext): void {
  const { bridgeGet, bridgePost, sceneMethod, editorMsg, text, sceneOp } = ctx;

  server.tool(
    'auto_fit_physics_collider',
    `Atomic macro: automatically fit a 2D physics collider to a target node's Sprite/UITransform bounds in ONE call.

Pipeline: 1) validate target node, 2) detect Sprite + UITransform components, 3) attempt alpha-outline extraction
for PolygonCollider2D, 4) fallback to BoxCollider2D/CircleCollider2D from content size, 5) set physics properties, 6) highlight.

If nodeUuid is omitted, uses current editor selection.

Parameters:
- nodeUuid(optional): Target node UUID. Uses current selection if omitted.
- colliderType(optional, default "auto"): Collider shape to create.
- alphaThreshold(optional, default 0.1): Alpha threshold for polygon outline extraction (0.0-1.0).
- simplifyTolerance(optional, default 2.0): Polygon simplification tolerance in pixels.
- maxVertices(optional, default 64): Maximum vertex count for polygon collider.
- sensor(optional): If true, collider detects overlap but doesn't apply physics response.
- friction(optional): Surface friction coefficient (0.0-1.0).
- restitution(optional): Bounciness coefficient (0.0=no bounce, 1.0=full bounce).
- density(optional): Physics material density.

Prerequisites: Node must exist and ideally have a Sprite or UITransform for size detection. Without these, collider defaults to 100x100.
Returns: {success, uuid, nodeName, colliderType:"BoxCollider2D"|"PolygonCollider2D", outlineMethod, size?:{width,height}, pointCount?, points?:[{x,y}], stages}. On error: {success:false, error}.
colliderType: "box"(default)=BoxCollider2D, "polygon"=PolygonCollider2D (attempts alpha outline from Sprite texture).`,
    toInputSchema({
      nodeUuid: z.string().optional().describe(
        'UUID of the target node to fit a collider to. If omitted, uses the currently selected node in editor. ' +
        'The node should have a Sprite or UITransform component for bounds detection.'
      ),
      colliderType: z.enum(['auto', 'polygon', 'box', 'circle']).optional().describe(
        'Type of collider to create. Default: "auto". ' +
        '"auto" = try polygon (alpha outline) first, fallback to box. ' +
        '"polygon" = PolygonCollider2D from sprite alpha. ' +
        '"box" = BoxCollider2D from UITransform content size. ' +
        '"circle" = CircleCollider2D with radius = min(width, height) / 2.'
      ),
      alphaThreshold: z.number().min(0).max(1).optional().describe(
        'Alpha threshold for polygon outline extraction. Default: 0.1. ' +
        'Pixels with alpha below this are considered transparent. ' +
        'Lower = more accurate outline, higher = simpler outline.'
      ),
      simplifyTolerance: z.number().min(0).max(20).optional().describe(
        'Polygon simplification tolerance in pixels. Default: 2.0. ' +
        'Higher values produce fewer vertices (better performance, less accurate).'
      ),
      maxVertices: z.number().int().min(3).max(256).optional().describe(
        'Maximum number of vertices for polygon collider. Default: 64, Range: 3-256. ' +
        'Lower values improve physics performance.'
      ),
      sensor: z.boolean().optional().describe(
        'Whether the collider is a sensor (trigger). Default: false. ' +
        'Sensors detect overlap via onBeginContact/onEndContact but do NOT apply physics forces.'
      ),
      friction: z.number().min(0).max(1).optional().describe(
        'Surface friction coefficient. Default: engine default (~0.2). ' +
        '0.0 = no friction (ice), 1.0 = maximum friction (rubber).'
      ),
      restitution: z.number().min(0).max(1).optional().describe(
        'Bounciness (elasticity) coefficient. Default: engine default (~0). ' +
        '0.0 = no bounce (clay), 1.0 = perfect bounce (rubber ball).'
      ),
      density: z.number().min(0).optional().describe(
        'Physics material density. Default: engine default (~1.0). ' +
        'Affects mass calculation: mass = density × area. Higher = heavier object.'
      ),
    }),
    async (params) => {
      const p = params as Record<string, unknown>;
      const stages: string[] = [];
      const warnings: string[] = [];

      try {
        // ── Stage 1: resolve target node ──
        let nodeUuid = typeof p.nodeUuid === 'string' ? p.nodeUuid : '';
        if (!nodeUuid) {
          stages.push('resolve_selection');
          const selection = await bridgeGet('/api/editor/selection');
          nodeUuid = extractSelectedNodeUuid(selection);
          if (!nodeUuid) return text({ success: false, error: '未提供 nodeUuid 且当前未选中节点' }, true);
        }

        // Validate node
        stages.push('validate_node');
        const nodeInfo = await sceneMethod('dispatchQuery', [{ action: 'node_detail', uuid: nodeUuid }]) as Record<string, unknown>;
        if (nodeInfo?.error) return text(nodeInfo, true);

        // ── Stage 2: detect components on node ──
        stages.push('detect_components');
        const compsResult = await sceneMethod('dispatchQuery', [{ action: 'get_components', uuid: nodeUuid }]) as Record<string, unknown>;
        const componentNames = Array.isArray((compsResult as Record<string, unknown>)?.components)
          ? ((compsResult as Record<string, unknown>).components as Array<{ name: string }>).map(c => c.name)
          : [];

        const _hasSprite = componentNames.some(n => n === 'Sprite' || n === 'cc.Sprite');
        const hasUITransform = componentNames.some(n => n === 'UITransform' || n === 'cc.UITransform');

        if (!hasUITransform) {
          warnings.push('节点没有 UITransform 组件，碰撞体尺寸可能不准确');
        }

        // ── Stage 3: call scene script autoFitCollider ──
        // autoFitCollider 在 execute-scene-script 上下文执行，需从主进程包裹 begin/end-recording
        // 并在之后 force-dirty，确保碰撞体修改被记录为场景变更
        stages.push('auto_fit_collider');
        const recordId = await beginSceneRecording(editorMsg, [nodeUuid]);
        let fitResult: Record<string, unknown>;
        try {
          fitResult = await sceneMethod('autoFitCollider', [{
            uuid: nodeUuid,
            colliderType: String(p.colliderType ?? 'auto'),
            alphaThreshold: Number(p.alphaThreshold ?? 0.1),
            simplifyTolerance: Number(p.simplifyTolerance ?? 2.0),
            maxVertices: Number(p.maxVertices ?? 64),
          }]) as Record<string, unknown>;
          // force-dirty: 从主进程 touch 节点名称，触发 dirty 标记
          try {
            const dump = await editorMsg('scene', 'query-node', nodeUuid) as Record<string, unknown>;
            const nameVal = (dump as { value?: { name?: { value?: string } } })?.value?.name?.value;
            if (typeof nameVal === 'string' && nameVal) {
              await editorMsg('scene', 'set-property', {
                uuid: nodeUuid, path: 'name',
                dump: { type: 'string', value: nameVal },
              });
            }
          } catch { /* best-effort */ }
        } finally {
          await endSceneRecording(editorMsg, recordId);
        }

        if (!fitResult || fitResult.error) {
          return text({
            success: false, stage: 'auto_fit_collider',
            error: (fitResult as { error?: string })?.error || '自动适配碰撞体失败',
            stages,
          }, true);
        }

        // Merge warnings from scene script
        if (Array.isArray(fitResult.warnings)) {
          warnings.push(...(fitResult.warnings as string[]));
        }

        // ── Stage 4: set additional physics properties ──
        const colliderType = String(fitResult.colliderType ?? '');
        if (colliderType) {
          const physicsProps: Array<[string, unknown]> = [];
          if (p.sensor !== undefined) physicsProps.push(['sensor', Boolean(p.sensor)]);
          if (p.friction !== undefined) physicsProps.push(['friction', Number(p.friction)]);
          if (p.restitution !== undefined) physicsProps.push(['restitution', Number(p.restitution)]);
          if (p.density !== undefined) physicsProps.push(['density', Number(p.density)]);

          if (physicsProps.length > 0) {
            stages.push('set_physics_properties');
            const compName = colliderType.replace('cc.', '');
            for (const [prop, val] of physicsProps) {
              try {
                await sceneOp({ action: 'set_property', uuid: nodeUuid, component: compName, property: prop, value: val });
              } catch {
                warnings.push(`设置 ${compName}.${prop} 失败`);
              }
            }
          }
        }

        // ── Stage 5: highlight + refresh Inspector ──
        stages.push('highlight');
        try { await bridgePost('/api/editor/select', { uuids: [nodeUuid], forceRefresh: true }); } catch (e) {
          logIgnored(ErrorCategory.EDITOR_IPC, '选中节点高亮失败', e);
          warnings.push(`高亮节点失败: ${errorMessage(e)}`);
        }
        try { await bridgePost('/api/console/log', {
          text: `[AI Physics] auto_fit_physics_collider 完成: ${fitResult.colliderType} (${fitResult.outlineMethod})`,
        }); } catch { /* ignore */ }

        return text({
          success: true,
          nodeUuid,
          nodeName: fitResult.nodeName,
          colliderType: fitResult.colliderType,
          outlineMethod: fitResult.outlineMethod,
          pointCount: fitResult.pointCount,
          points: fitResult.points,
          size: fitResult.size,
          radius: fitResult.radius,
          stages,
          ...(warnings.length ? { warnings } : {}),
        });
      } catch (err: unknown) {
        return text({
          success: false, error: errorMessage(err), stages,
          ...(warnings.length ? { warnings } : {}),
        }, true);
      }
    },
  );
}
