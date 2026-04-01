import { z } from 'zod';
import type { LocalToolServer } from './local-tool-server';
import type { BridgeToolContext } from './tools-shared';
import {
  toInputSchema,
  normalizeDbUrl,
  sanitizeDbUrl,
  ensureAssetDirectory,
  extractSelectedNodeUuid,
  errorMessage,
  beginSceneRecording,
  endSceneRecording,
  buildAnimJson,
  persistenceModeSchema,
  withPersistenceGuard,
  attachScenePersistenceWarnings,
} from './tools-shared';
import { ErrorCategory, logIgnored } from '../error-utils';

const keyframeSchema = z.object({
  time: z.number().min(0).describe('Keyframe time in seconds from clip start. e.g. 0, 0.5, 1.0'),
  value: z.union([z.number(), z.string(), z.boolean(), z.record(z.string(), z.unknown()), z.array(z.unknown())]).describe(
    'Keyframe value. Type depends on the animated property: ' +
    'number for position.x/opacity, Vec3 {x,y,z} for position, Color {r,g,b,a} for color.'
  ),
  easing: z.enum(['linear', 'quadIn', 'quadOut', 'quadInOut', 'cubicIn', 'cubicOut', 'cubicInOut',
    'quartIn', 'quartOut', 'quartInOut', 'sineIn', 'sineOut', 'sineInOut',
    'bounceIn', 'bounceOut', 'bounceInOut', 'backIn', 'backOut', 'backInOut',
    'elasticIn', 'elasticOut', 'elasticInOut']).optional().describe(
      'Easing function between this keyframe and the next. Default: "linear". ' +
      'Common: "quadInOut" for smooth, "bounceOut" for bounce effect.'
    ),
});

const trackSchema = z.object({
  path: z.string().optional().describe(
    'Relative node path from the animated root node. Empty string = root node itself. ' +
    'Example: "Sprite" to animate a child node named "Sprite".'
  ),
  component: z.string().optional().describe(
    'Component type to animate property on. Required if property belongs to a component (not Node transform). ' +
    'Example: "cc.Sprite" for spriteFrame, "cc.UIOpacity" for opacity.'
  ),
  property: z.string().describe(
    'Property path to animate. REQUIRED. ' +
    'Node properties: "position", "rotation", "scale", "position.x", "position.y". ' +
    'Component properties: "color" (Sprite), "opacity" (UIOpacity), "string" (Label).'
  ),
  keyframes: z.array(keyframeSchema).min(2).describe(
    'Array of keyframe definitions. Minimum 2 keyframes (start and end). ' +
    'Example: [{"time":0, "value":0}, {"time":1, "value":100, "easing":"quadInOut"}]'
  ),
});

async function queryAnimationState(
  sceneMethod: BridgeToolContext['sceneMethod'],
  uuid: string,
): Promise<Record<string, unknown>> {
  return await sceneMethod('dispatchQuery', [{ action: 'get_animation_state', uuid }]) as Record<string, unknown>;
}

async function attachSavedClipAsset(params: {
  nodeUuid: string;
  assetUuid: string;
  sceneMethod: BridgeToolContext['sceneMethod'];
  editorMsg: BridgeToolContext['editorMsg'];
  playOnLoad?: boolean;
}): Promise<Record<string, unknown>> {
  const { nodeUuid, assetUuid, sceneMethod, editorMsg, playOnLoad } = params;
  const recordId = await beginSceneRecording(editorMsg, [nodeUuid]);
  let clipsResult: Record<string, unknown>;
  let defaultClipResult: Record<string, unknown>;
  let playOnLoadResult: Record<string, unknown> | null = null;

  try {
    clipsResult = await sceneMethod('setComponentProperty', [
      nodeUuid,
      'Animation',
      'clips',
      [{ __uuid__: assetUuid }],
    ]) as Record<string, unknown>;
    if (clipsResult?.error) {
      return { error: `已保存 .anim 资产，但回绑 Animation.clips 失败: ${clipsResult.error}` };
    }

    defaultClipResult = await sceneMethod('setComponentProperty', [
      nodeUuid,
      'Animation',
      'defaultClip',
      { __uuid__: assetUuid },
    ]) as Record<string, unknown>;
    if (defaultClipResult?.error) {
      return { error: `已保存 .anim 资产，但回绑 Animation.defaultClip 失败: ${defaultClipResult.error}` };
    }

    if (playOnLoad) {
      playOnLoadResult = await sceneMethod('setComponentProperty', [
        nodeUuid,
        'Animation',
        'playOnLoad',
        true,
      ]) as Record<string, unknown>;
      if (playOnLoadResult?.error) {
        return { error: `已保存 .anim 资产，但设置 Animation.playOnLoad 失败: ${playOnLoadResult.error}` };
      }
    }

    try {
      const dump = await editorMsg('scene', 'query-node', nodeUuid) as Record<string, unknown>;
      const nameVal = (dump as { value?: { name?: { value?: string } } })?.value?.name?.value;
      if (typeof nameVal === 'string' && nameVal) {
        await editorMsg('scene', 'set-property', {
          uuid: nodeUuid,
          path: 'name',
          dump: { type: 'string', value: nameVal },
        });
      }
    } catch { /* best-effort */ }
  } finally {
    await endSceneRecording(editorMsg, recordId);
  }

  const stateAfter = await queryAnimationState(sceneMethod, nodeUuid);
  return {
    bound: true,
    assetUuid,
    clipsResult,
    defaultClipResult,
    ...(playOnLoadResult ? { playOnLoadResult } : {}),
    stateAfter,
  };
}

export function registerAnimationAtomicTool(server: LocalToolServer, ctx: BridgeToolContext): void {
  const { bridgeGet, bridgePost, sceneMethod, editorMsg, text } = ctx;
  const sceneOp = ctx.sceneOp ?? ((params: Record<string, unknown>) => sceneMethod('dispatchOperation', [params]));

  server.tool(
    'create_tween_animation_atomic',
    `Atomic macro: create an AnimationClip with keyframe tracks and attach it to a target node in ONE call.

Pipeline: 1) validate target node, 2) create AnimationClip with tracks via scene script,
3) attach Animation component if needed, 4) best-effort save as .anim asset to AssetDB, 5) refresh & highlight.

Supports multiple property tracks (position, scale, rotation, opacity, custom component properties).
If nodeUuid is omitted, uses current editor selection.

Parameters:
- nodeUuid(optional): Target node UUID. If omitted, uses current selection.
- clipName(optional): Animation clip name. Default: derived from savePath filename.
- duration(optional, default 1.0): Total clip duration in seconds.
- wrapMode(optional, default "Normal"): Playback mode.
- speed(optional, default 1.0): Playback speed multiplier.
- sample(optional, default 60): Sampling rate in frames per second.
- tracks(REQUIRED): Array of animation property tracks with keyframes.
- savePath(optional): db:// path to save .anim file. If omitted, clip exists only in scene memory.
- autoPlay(optional, default false): Start playing the animation immediately after creation.
- persistenceMode(optional: warn/auto-save/strict). Controls whether successful scene writes only warn, auto-save, or fail in strict persistence mode.

tracks format: [{property:"position", keyframes:[{time:0, value:{x:0,y:0,z:0}}, {time:1, value:{x:100,y:0,z:0}}]}]. Supported properties: position, scale, rotation, opacity, color, eulerAngles.
Returns: {success, nodeUuid, clipDuration, trackCount, keyframeTimesCount, wrapMode, speed, attach:{attached}, savedAsset?, stages:["validate_node","create_clip","highlight"]}. Successful write results may include persistenceStatus{mode,target,requiresPersistence,saveAttempted,...}. On error: {success:false, error}.
Prerequisites: Node must exist. If nodeUuid omitted, uses current selection. tracks array must have at least one track with keyframes.`,
    toInputSchema({
      nodeUuid: z.string().optional().describe(
        'UUID of the node to attach the animation to. If omitted, uses the currently selected node in editor.'
      ),
      clipName: z.string().optional().describe(
        'Name identifier for the AnimationClip. Default: derived from savePath filename or "default". ' +
        'Example: "idle_bounce", "fade_in".'
      ),
      duration: z.number().min(0.01).max(300).optional().describe(
        'Total animation duration in seconds. Default: 1.0. Example: 2.5 for a 2.5-second animation.'
      ),
      wrapMode: z.enum(['Normal', 'Loop', 'PingPong', 'Reverse', 'LoopReverse']).optional().describe(
        'Animation playback wrap mode. Default: "Normal" (play once). ' +
        '"Loop"=repeat forever, "PingPong"=forward then backward, "Reverse"=play backward, "LoopReverse"=loop backward.'
      ),
      speed: z.number().min(0.01).max(10).optional().describe(
        'Playback speed multiplier. Default: 1.0. Use 0.5 for half speed, 2.0 for double speed.'
      ),
      sample: z.number().int().min(1).max(120).optional().describe(
        'Sampling rate in frames per second. Default: 60. Lower for file size, higher for smoother curves.'
      ),
      tracks: z.array(trackSchema).min(1).describe(
        'Array of animation property tracks. REQUIRED, minimum 1 track. ' +
        'Each track animates one property with keyframes. Multiple tracks can animate different properties simultaneously.'
      ),
      savePath: z.string().optional().describe(
        'db:// path to save the .anim file as an asset. If omitted, the clip exists only in scene memory. ' +
        'Example: "db://assets/animations/bounce.anim". Directories are auto-created.'
      ),
      autoPlay: z.boolean().optional().describe(
        'Whether to immediately play the animation after creation. Default: false.'
      ),
      persistenceMode: persistenceModeSchema,
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

        // Validate node exists
        stages.push('validate_node');
        const nodeInfo = await sceneMethod('dispatchQuery', [{ action: 'node_detail', uuid: nodeUuid }]);
        if (nodeInfo && typeof nodeInfo === 'object' && 'error' in nodeInfo) {
          return text(nodeInfo, true);
        }

        // ── Stage 2: create AnimationClip via scene script ──
        stages.push('create_clip');
        const tracks = p.tracks as Array<Record<string, unknown>>;
        if (!Array.isArray(tracks) || tracks.length === 0) {
          return text({ success: false, error: '缺少 tracks 参数（至少需要一条动画轨道）' }, true);
        }

        // createAnimationClip 在 execute-scene-script 上下文执行，需从主进程包裹 begin/end-recording
        // 并在之后 force-dirty，确保动画组件修改被记录为场景变更
        const recordId = await beginSceneRecording(editorMsg, [nodeUuid]);
        let clipResult: Record<string, unknown>;
        try {
          clipResult = await sceneMethod('createAnimationClip', [{
            uuid: nodeUuid,
            clipName: typeof p.clipName === 'string' ? p.clipName : undefined,
            duration: Number(p.duration ?? 1),
            wrapMode: String(p.wrapMode ?? 'Normal'),
            speed: Number(p.speed ?? 1),
            sample: Number(p.sample ?? 60),
            tracks,
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

        if (!clipResult || clipResult.error) {
          return text({
            success: false, stage: 'create_clip',
            error: (clipResult as { error?: string })?.error || '创建动画失败',
          }, true);
        }

        // ── Stage 3: best-effort save as .anim asset ──
        let saveResult: Record<string, unknown> | null = null;
        let assetBinding: Record<string, unknown> | null = null;
        const savePath = typeof p.savePath === 'string' ? p.savePath : '';
        if (savePath) {
          const pathErr = sanitizeDbUrl(savePath);
          if (pathErr) return text({ success: false, error: `路径安全校验失败: ${pathErr}` }, true);
          stages.push('save_anim_asset');
          try {
            const normalized = normalizeDbUrl(savePath);
            const finalPath = normalized.url;
            if (normalized.normalized) {
              warnings.push(`路径已自动规范化: ${savePath} -> ${finalPath}`);
            }

            // Ensure directory exists
            await ensureAssetDirectory(editorMsg, finalPath);

            // Build a minimal .anim JSON representation
            const clipName = (p.clipName as string) || finalPath.split('/').pop()?.replace('.anim', '') || 'NewClip';
            const animJson = buildAnimJson(clipName, Number(p.duration ?? 1), String(p.wrapMode ?? 'Normal'), Number(p.speed ?? 1), Number(p.sample ?? 60), tracks);

            const createAssetResult = await bridgePost('/api/asset-db/create-asset', {
              url: finalPath,
              content: JSON.stringify(animJson, null, 2),
            }) as Record<string, unknown>;

            if (createAssetResult?.error) {
              warnings.push(`保存 .anim 资产失败: ${createAssetResult.error}，动画已在场景中生效但未落盘`);
              saveResult = null;
            } else {
              const info = await editorMsg('asset-db', 'query-asset-info', finalPath) as { uuid?: string } | null;
              saveResult = {
                saved: true,
                path: finalPath,
                ...(info?.uuid ? { uuid: info.uuid } : {}),
              };
              stages.push('refresh_asset_db');
              try {
                await bridgePost('/api/asset-db/refresh', { url: finalPath.substring(0, finalPath.lastIndexOf('/')) });
              } catch (e) { logIgnored(ErrorCategory.ASSET_OPERATION, '动画保存后刷新资源数据库失败（非关键）', e); }
              if (info?.uuid) {
                assetBinding = await attachSavedClipAsset({
                  nodeUuid,
                  assetUuid: info.uuid,
                  sceneMethod,
                  editorMsg,
                  playOnLoad: Boolean(p.autoPlay),
                });
                if (assetBinding?.error) {
                  warnings.push(String(assetBinding.error));
                  assetBinding = null;
                }
              } else {
                warnings.push('动画资产已保存，但未能获取 UUID，无法回绑到 Animation 组件。');
              }
            }
          } catch (saveErr: unknown) {
            warnings.push(`保存 .anim 资产异常: ${errorMessage(saveErr)}，动画已在场景中生效但未落盘`);
          }
        } else {
          // 无 savePath：clip 仅在运行时内存（editorSyncSkipped=true），无法持久化
          warnings.push('未提供 savePath，动画 clip 仅存在于运行时内存，重载场景后将丢失。请提供 savePath 参数。');
          if (p.persistenceMode === 'strict') {
            return text({
              success: false,
              nodeUuid,
              stages,
              error: 'create_tween_animation_atomic 未提供 savePath，无法在 strict 模式下保证持久化。',
              warnings,
            }, true);
          }
        }

        // ── Stage 4: auto-play if requested ──
        if (p.autoPlay) {
          stages.push('auto_play');
          try {
            const clipName = (p.clipName as string) || 'default';
            await sceneOp({ action: 'call_component_method', uuid: nodeUuid, component: 'Animation', methodName: 'play', args: [clipName] });
          } catch (e) {
            logIgnored(ErrorCategory.ENGINE_API, 'autoPlay 调用失败', e);
            warnings.push('autoPlay 调用失败，可能需要手动播放');
          }
        }

        // ── Stage 5: highlight + refresh Inspector ──
        stages.push('highlight');
        try { await bridgePost('/api/editor/select', { uuids: [nodeUuid], forceRefresh: true }); } catch (e) {
          logIgnored(ErrorCategory.EDITOR_IPC, '选中节点高亮失败', e);
          warnings.push(`高亮节点失败: ${errorMessage(e)}`);
        }
        try { await bridgePost('/api/console/log', {
          text: `[AI Animation] create_tween_animation_atomic 完成: ${(clipResult as Record<string, unknown>).trackCount} 轨道, ${(clipResult as Record<string, unknown>).clipDuration}s`,
        }); } catch { /* ignore */ }

        if (p.persistenceMode === 'strict' && savePath && !saveResult) {
          return text({
            success: false,
            nodeUuid,
            stages,
            error: 'create_tween_animation_atomic 保存 .anim 资产失败（strict 模式）。',
            ...(warnings.length ? { warnings } : {}),
          }, true);
        }
        if (p.persistenceMode === 'strict' && saveResult && !assetBinding) {
          return text({
            success: false,
            nodeUuid,
            stages,
            error: 'create_tween_animation_atomic 动画资产已保存但未能回绑到节点（strict 模式）。',
            ...(warnings.length ? { warnings } : {}),
          }, true);
        }

        const persistenceTarget = saveResult
          ? {
            kind: 'multi' as const,
            targets: [
              { kind: 'asset' as const, url: savePath || undefined },
              { kind: 'scene' as const, saveStrategy: 'save_scene' as const },
            ],
          }
          : { kind: 'none' as const };

        const { result, isError } = await withPersistenceGuard(
          { editorMsg, bridgePost },
          {
            mode: p.persistenceMode,
            target: persistenceTarget,
            strictFailureMessage: 'create_tween_animation_atomic 写入成功，但场景持久化失败（strict 模式）',
          },
          async () => {
            const response: Record<string, unknown> = {
              success: true,
              nodeUuid,
              clipDuration: clipResult.clipDuration,
              trackCount: clipResult.trackCount,
              keyframeTimesCount: clipResult.keyframeTimesCount,
              wrapMode: clipResult.wrapMode,
              speed: clipResult.speed,
              attach: clipResult.attach,
              savedAsset: saveResult ? { saved: true, path: savePath } : null,
              assetBinding,
              stages,
              ...(warnings.length ? { warnings } : {}),
            };
            await attachScenePersistenceWarnings(editorMsg, response, {
              action: 'create_tween_animation_atomic',
              affectedUuid: nodeUuid,
              includeSceneSaveWarning: false,
            });
            return response;
          },
        );
        return text(result, isError ? true : undefined);
      } catch (err: unknown) {
        return text({
          success: false, error: errorMessage(err), stages,
          ...(warnings.length ? { warnings } : {}),
        }, true);
      }
    },
  );
}

// buildAnimJson 已统一迁移至 tools-shared.ts（_tracks 格式），此处不再重复定义。
