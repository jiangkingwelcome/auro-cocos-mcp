import { z } from 'zod';
import type { LocalToolServer } from './local-tool-server';
import type { BridgeToolContext } from './tools-shared';
import { toInputSchema, normalizeDbUrl, sanitizeDbUrl, ensureAssetDirectory, extractSelectedNodeUuid, errorMessage } from './tools-shared';
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

export function registerAnimationAtomicTool(server: LocalToolServer, ctx: BridgeToolContext): void {
  const { bridgeGet, bridgePost, sceneMethod, editorMsg, text } = ctx;

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

tracks format: [{property:"position", keyframes:[{time:0, value:{x:0,y:0,z:0}}, {time:1, value:{x:100,y:0,z:0}}]}]. Supported properties: position, scale, rotation, opacity, color, eulerAngles.
Returns: {success, nodeUuid, clipDuration, trackCount, keyframeTimesCount, wrapMode, speed, attach:{attached}, savedAsset?, stages:["validate_node","create_clip","highlight"]}. On error: {success:false, error}.
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

        const clipResult = await sceneMethod('createAnimationClip', [{
          uuid: nodeUuid,
          duration: Number(p.duration ?? 1),
          wrapMode: String(p.wrapMode ?? 'Normal'),
          speed: Number(p.speed ?? 1),
          sample: Number(p.sample ?? 60),
          tracks,
        }]) as Record<string, unknown>;

        if (!clipResult || clipResult.error) {
          return text({
            success: false, stage: 'create_clip',
            error: (clipResult as { error?: string })?.error || '创建动画失败',
          }, true);
        }

        // ── Stage 3: best-effort save as .anim asset ──
        let saveResult: Record<string, unknown> | null = null;
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

            saveResult = await bridgePost('/api/asset-db/create-asset', {
              url: finalPath,
              content: JSON.stringify(animJson, null, 2),
            }) as Record<string, unknown>;

            if (saveResult?.error) {
              warnings.push(`保存 .anim 资产失败: ${saveResult.error}，动画已在场景中生效但未落盘`);
              saveResult = null;
            } else {
              stages.push('refresh_asset_db');
              try {
                await bridgePost('/api/asset-db/refresh', { url: finalPath.substring(0, finalPath.lastIndexOf('/')) });
              } catch (e) { logIgnored(ErrorCategory.ASSET_OPERATION, '动画保存后刷新资源数据库失败（非关键）', e); }
            }
          } catch (saveErr: unknown) {
            warnings.push(`保存 .anim 资产异常: ${errorMessage(saveErr)}，动画已在场景中生效但未落盘`);
          }
        }

        // ── Stage 4: auto-play if requested ──
        if (p.autoPlay) {
          stages.push('auto_play');
          try {
            const clipName = (p.clipName as string) || 'default';
            await sceneMethod('dispatchOperation', [{
              action: 'call_component_method',
              uuid: nodeUuid,
              component: 'Animation',
              methodName: 'play',
              args: [clipName],
            }]);
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

        return text({
          success: true,
          nodeUuid,
          clipDuration: clipResult.clipDuration,
          trackCount: clipResult.trackCount,
          keyframeTimesCount: clipResult.keyframeTimesCount,
          wrapMode: clipResult.wrapMode,
          speed: clipResult.speed,
          attach: clipResult.attach,
          savedAsset: saveResult ? { saved: true, path: savePath } : null,
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

// Build a minimal Cocos .anim JSON structure for asset-db save
function buildAnimJson(
  name: string, duration: number, wrapMode: string, speed: number, sample: number,
  tracks: Array<Record<string, unknown>>,
): Record<string, unknown> {
  const wrapModeMap: Record<string, number> = {
    normal: 0, loop: 2, pingpong: 6, reverse: 36, loopreverse: 38,
  };

  const allTimes = new Set<number>();
  for (const t of tracks) {
    const kfs = t.keyframes as Array<{ time: number }>;
    if (Array.isArray(kfs)) for (const kf of kfs) allTimes.add(kf.time);
  }
  const sortedTimes = [...allTimes].sort((a, b) => a - b);

  const curves = tracks.map(track => {
    const kfs = (track.keyframes as Array<{ time: number; value: unknown }>) || [];
    const modifiers: unknown[] = [];
    if (track.path) modifiers.push({ __type__: 'cc.animation.HierarchyPath', path: track.path });
    if (track.component) modifiers.push({ __type__: 'cc.animation.ComponentPath', component: track.component });
    modifiers.push(track.property);

    const timeToValue = new Map<number, unknown>();
    for (const kf of kfs) timeToValue.set(kf.time, kf.value);

    const filteredTimes: number[] = [];
    const filteredValues: unknown[] = [];
    for (const t of sortedTimes) {
      if (timeToValue.has(t)) {
        filteredTimes.push(t);
        filteredValues.push(timeToValue.get(t));
      }
    }

    return { modifiers, data: { keys: 0, values: filteredValues } };
  });

  return {
    __type__: 'cc.AnimationClip',
    _name: name,
    _duration: duration,
    sample,
    speed,
    wrapMode: wrapModeMap[wrapMode.toLowerCase()] ?? 0,
    keys: [sortedTimes],
    curves,
  };
}
