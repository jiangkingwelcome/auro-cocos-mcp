import { z } from 'zod';
import { LocalToolServer } from './local-tool-server';
import type { BridgeToolContext } from './tools-shared';
import {
  toInputSchema,
  errorMessage,
  AI_RULES,
  beginSceneRecording,
  endSceneRecording,
  normalizeDbUrl,
  sanitizeDbUrl,
  ensureAssetDirectory,
  buildAnimJson,
  persistenceModeSchema,
  withPersistenceGuard,
  attachScenePersistenceWarnings,
} from './tools-shared';

export function registerAnimationTools(server: LocalToolServer, ctx: BridgeToolContext): void {
  const { bridgePost, sceneMethod, editorMsg, text } = ctx;
  const isFailedResult = (result: unknown): boolean => {
    return Boolean(
      result
      && typeof result === 'object'
      && (('error' in result && result.error) || ('success' in result && result.success === false))
    );
  };

  async function saveAnimationAsset(params: {
    savePath: string;
    clipName: string;
    duration: number;
    wrapMode: string;
    speed: number;
    sample: number;
    tracks: Array<Record<string, unknown>>;
  }): Promise<Record<string, unknown>> {
    const pathError = sanitizeDbUrl(params.savePath);
    if (pathError) return { error: `路径安全校验失败: ${pathError}` };

    const normalized = normalizeDbUrl(params.savePath);
    const finalPath = normalized.url;
    await ensureAssetDirectory(editorMsg, finalPath);

    const animJson = buildAnimJson(
      params.clipName,
      params.duration,
      params.wrapMode,
      params.speed,
      params.sample,
      params.tracks,
    );

    const createResult = await bridgePost('/api/asset-db/create-asset', {
      url: finalPath,
      content: JSON.stringify(animJson, null, 2),
    }) as Record<string, unknown>;
    if (createResult?.error) return createResult;

    await bridgePost('/api/asset-db/refresh', {
      url: finalPath.substring(0, finalPath.lastIndexOf('/')),
    });

    const info = await editorMsg('asset-db', 'query-asset-info', finalPath) as { uuid?: string } | null;

    return {
      saved: true,
      path: finalPath,
      ...(info?.uuid ? { uuid: info.uuid } : {}),
      ...(normalized.normalized ? { normalizedFrom: params.savePath } : {}),
    };
  }

  async function attachSavedClipAsset(
    nodeUuid: string,
    assetUuid: string,
    playOnLoad = false,
  ): Promise<Record<string, unknown>> {
    // 3.8.8 在通过 set-property 写 Animation.clips 时容易触发 keyFramesCount 空引用异常。
    // 产品主干默认走“安全绑定”：仅绑定 defaultClip（必要时附带 playOnLoad）。
    const recordId = await beginSceneRecording(editorMsg, [nodeUuid]);
    let defaultClipResult: Record<string, unknown>;
    let playOnLoadResult: Record<string, unknown> | null = null;
    try {
      defaultClipResult = await sceneMethod('setComponentProperty', [
        nodeUuid, 'Animation', 'defaultClip', { __uuid__: assetUuid },
      ]) as Record<string, unknown>;
      if (defaultClipResult?.error) {
        return { error: `已保存 .anim 资产，但回绑 Animation.defaultClip 失败: ${defaultClipResult.error}` };
      }

      if (playOnLoad) {
        playOnLoadResult = await sceneMethod('setComponentProperty', [
          nodeUuid, 'Animation', 'playOnLoad', true,
        ]) as Record<string, unknown>;
        if (playOnLoadResult?.error) {
          return { error: `已保存 .anim 资产，但设置 Animation.playOnLoad 失败: ${playOnLoadResult.error}` };
        }
      }

      // force-dirty
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

    const stateAfter = await queryAnimationState(nodeUuid);
    return {
      bound: true,
      assetUuid,
      bindingMode: 'safe-defaultClip-only',
      defaultClipResult,
      ...(playOnLoadResult ? { playOnLoadResult } : {}),
      stateAfter,
    };
  }

  async function queryAnimationState(uuid: string): Promise<Record<string, unknown>> {
    return await sceneMethod('dispatchQuery', [{ action: 'get_animation_state', uuid }]) as Record<string, unknown>;
  }

  function sanitizeTracksForClip(rawTracks: unknown): {
    validTracks: Array<Record<string, unknown>>;
    droppedTracks: number;
    droppedKeyframes: number;
  } {
    const tracks = Array.isArray(rawTracks) ? rawTracks : [];
    const validTracks: Array<Record<string, unknown>> = [];
    let droppedTracks = 0;
    let droppedKeyframes = 0;

    const vec3Props = new Set([
      'position', 'scale', 'eulerAngles',
      'worldPosition', 'worldScale', 'worldEulerAngles',
    ]);

    const normalizeVec3 = (value: unknown): { x: number; y: number; z: number } | null => {
      if (Array.isArray(value)) {
        const x = Number(value[0]);
        const y = Number(value[1]);
        const z = Number(value[2] ?? 0);
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return null;
        return { x, y, z };
      }
      if (value && typeof value === 'object') {
        const raw = value as Record<string, unknown>;
        const x = Number(raw.x);
        const y = Number(raw.y);
        const z = Number(raw.z ?? 0);
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return null;
        return { x, y, z };
      }
      return null;
    };

    const normalizeColor = (value: unknown): { r: number; g: number; b: number; a: number } | null => {
      if (Array.isArray(value)) {
        const r = Number(value[0]);
        const g = Number(value[1]);
        const b = Number(value[2]);
        const a = Number(value[3] ?? 255);
        if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b) || !Number.isFinite(a)) return null;
        return { r, g, b, a };
      }
      if (value && typeof value === 'object') {
        const raw = value as Record<string, unknown>;
        const r = Number(raw.r);
        const g = Number(raw.g);
        const b = Number(raw.b);
        const a = Number(raw.a ?? 255);
        if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b) || !Number.isFinite(a)) return null;
        return { r, g, b, a };
      }
      return null;
    };

    for (const item of tracks) {
      if (!item || typeof item !== 'object') {
        droppedTracks += 1;
        continue;
      }
      const track = item as Record<string, unknown>;
      const property = typeof track.property === 'string' ? track.property.trim() : '';
      if (!property) {
        droppedTracks += 1;
        continue;
      }
      const keyframesRaw = Array.isArray(track.keyframes) ? track.keyframes : [];
      const keyframes: Array<Record<string, unknown>> = [];

      for (const kf of keyframesRaw) {
        if (!kf || typeof kf !== 'object') {
          droppedKeyframes += 1;
          continue;
        }
        const k = kf as Record<string, unknown>;
        if (typeof k.time !== 'number' || !Number.isFinite(k.time)) {
          droppedKeyframes += 1;
          continue;
        }
        if (!("value" in k) || k.value === undefined || k.value === null) {
          droppedKeyframes += 1;
          continue;
        }

        let normalizedValue: unknown = k.value;
        if (vec3Props.has(property)) {
          const vec3 = normalizeVec3(k.value);
          if (!vec3) {
            droppedKeyframes += 1;
            continue;
          }
          normalizedValue = vec3;
        } else if (property === 'color') {
          const color = normalizeColor(k.value);
          if (!color) {
            droppedKeyframes += 1;
            continue;
          }
          normalizedValue = color;
        }

        keyframes.push({ ...k, value: normalizedValue });
      }

      if (keyframes.length < 2) {
        droppedTracks += 1;
        continue;
      }

      validTracks.push({ ...track, property, keyframes });
    }

    return { validTracks, droppedTracks, droppedKeyframes };
  }

  async function waitForAnimationState(
    uuid: string,
    predicate: (state: Record<string, unknown>) => boolean,
    attempts = 4,
    delayMs = 120,
  ): Promise<Record<string, unknown>> {
    let lastState = await queryAnimationState(uuid);
    if (predicate(lastState)) return lastState;

    for (let i = 1; i < attempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      lastState = await queryAnimationState(uuid);
      if (predicate(lastState)) return lastState;
    }

    return lastState;
  }

  function playbackExpectation(
    action: 'play' | 'pause' | 'resume' | 'stop',
    state: Record<string, unknown>,
  ): boolean {
    if (action === 'play' || action === 'resume') return state.isPlaying === true;
    return state.isPlaying === false;
  }

  async function dispatchRuntimePlayback(
    action: 'play' | 'pause' | 'resume' | 'stop',
    uuid: string,
    clipName?: string,
  ): Promise<Record<string, unknown>> {
    const payload: Record<string, unknown> = { action, uuid };
    if (clipName) payload.clipName = clipName;

    const result = await sceneMethod('dispatchAnimationAction', [payload]) as Record<string, unknown>;
    if (isFailedResult(result)) return result;

    const stateAfter = await waitForAnimationState(uuid, (state) => playbackExpectation(action, state));
    if (!playbackExpectation(action, stateAfter)) {
      return {
        error: `运行时 Animation.${action} 已执行，但组件状态未达到预期。`,
        uuid,
        action,
        transport: 'runtime',
        stateAfter,
      };
    }

    return {
      ...(result && typeof result === 'object' ? result : {}),
      success: true,
      uuid,
      action,
      transport: 'runtime',
      stateAfter,
    };
  }

  async function dispatchAnimatorPlayback(
    action: 'play' | 'pause' | 'resume' | 'stop',
    uuid: string,
    clipName?: string,
  ): Promise<unknown> {
    const runtimeResult = await dispatchRuntimePlayback(action, uuid, clipName);
    if (!(runtimeResult && typeof runtimeResult === 'object' && 'error' in runtimeResult)) {
      return runtimeResult;
    }

    if (clipName) {
      return {
        error: '当前 animator 桥接不支持按 clipName 精确控制，且运行时 Animation.play 也未能进入目标状态。',
        uuid,
        action,
        transport: 'runtime',
        runtimeFailure: runtimeResult,
      };
    }

    const command = action === 'stop' ? 'stop' : 'play-or-pause';
    const result = await bridgePost('/api/animator/command', { command, uuid }) as Record<string, unknown>;
    if (isFailedResult(result)) return result;

    const stateAfter = await waitForAnimationState(
      uuid,
      (state) => action === 'stop'
        ? state.isPlaying === false
        : state.isPlaying === true,
    );

    const isPlaying = stateAfter?.isPlaying === true;
    if (action === 'play' && !isPlaying) {
      return {
        error: '动画播放命令已发送，但 Animation 组件仍未进入播放状态。',
        uuid,
        action,
        command,
        transport: 'animator',
        runtimeFailure: runtimeResult,
        stateAfter,
      };
    }
    if (action === 'resume' && !isPlaying) {
      return {
        error: '动画恢复命令已发送，但 Animation 组件仍未进入播放状态。',
        uuid,
        action,
        command,
        transport: 'animator',
        runtimeFailure: runtimeResult,
        stateAfter,
      };
    }
    if (action === 'pause' && isPlaying) {
      return {
        error: '动画暂停命令已发送，但 Animation 组件仍显示为播放中。',
        uuid,
        action,
        command,
        transport: 'animator',
        runtimeFailure: runtimeResult,
        stateAfter,
      };
    }
    if (action === 'stop' && stateAfter?.isPlaying === true) {
      return {
        error: '动画停止命令已发送，但 Animation 组件仍显示为播放中。',
        uuid,
        action,
        command,
        transport: 'animator',
        runtimeFailure: runtimeResult,
        stateAfter,
      };
    }

    const limitations = action === 'stop'
      ? []
      : ['当前 Cocos 内置 animator 仅暴露 play-or-pause 切换命令，无法区分显式 play/pause/resume 状态。'];

    return {
      ...(result && typeof result === 'object' ? result : {}),
      success: true,
      uuid,
      action,
      transport: 'animator',
      command,
      stateAfter,
      ...(limitations.length > 0 ? { limitations } : {}),
    };
  }

  server.tool(
    'animation_tool',
    `Manage Animation components and clips on Cocos Creator nodes. Create keyframe animations, control playback, and inspect animation state.

Actions & required parameters:
- create_clip: uuid(REQUIRED, target node), duration(optional, default 1), wrapMode(optional: Normal/Loop/PingPong), speed(optional, default 1), tracks(REQUIRED, array of keyframe tracks), savePath(STRONGLY RECOMMENDED, db://assets/animations/xxx.anim), autoPlay(optional, set Animation.playOnLoad=true). Create and attach an AnimationClip; without savePath the clip only lives in runtime memory and will be lost on scene reload.
- play: uuid(REQUIRED), clipName(optional, plays default clip if omitted). Start playing an animation clip.
- pause: uuid(REQUIRED). Pause current animation.
- resume: uuid(REQUIRED). Resume paused animation.
- stop: uuid(REQUIRED). Stop and reset animation to beginning.
- get_state: uuid(REQUIRED). Get current animation state (playing, paused, current clip, time).
- list_clips: uuid(REQUIRED). List all animation clips on a node.
- set_current_time: uuid(REQUIRED), time(REQUIRED, seconds). Seek animation to a specific time.
- set_speed: uuid(REQUIRED), speed(REQUIRED). Set animation playback speed (1.0 = normal).
- crossfade: uuid(REQUIRED), clipName(REQUIRED), duration(optional, default 0.3). Crossfade to another animation clip.
- persistenceMode(optional: warn/auto-save/strict). Controls whether successful scene writes only warn, auto-save, or fail in strict persistence mode.

Prerequisites: Node must have an Animation component. Use scene_operation action=add_component component="Animation" first if needed.
Returns: create_clip→{success,clipName,duration}. play/pause/resume/stop→{success}. get_state→{isPlaying,currentClip,time,speed}. list_clips→{clips:[{name,duration}]}. Successful write results may include persistenceStatus{mode,target,requiresPersistence,saveAttempted,...}. On error: {error:"message"}.` + AI_RULES,
    toInputSchema({
      action: z.enum([
        'create_clip', 'play', 'pause', 'resume', 'stop',
        'get_state', 'list_clips', 'set_current_time', 'set_speed', 'crossfade'
      ]).describe('Animation action to perform.'),
      uuid: z.string().describe('Target node UUID. REQUIRED for all actions.'),
      clipName: z.string().optional().describe(
        'Animation clip name. Used by: play (optional, default clip if omitted), crossfade (REQUIRED).'
      ),
      duration: z.number().min(0.01).optional().describe(
        'Clip duration in seconds. For create_clip (default 1). For crossfade transition (default 0.3).'
      ),
      wrapMode: z.enum(['Normal', 'Loop', 'PingPong', 'Reverse', 'LoopReverse']).optional().describe(
        'Animation wrap mode. For create_clip. Default: Normal.'
      ),
      speed: z.number().optional().describe(
        'Playback speed multiplier. For create_clip (default 1), set_speed (REQUIRED). 1.0=normal, 2.0=double, 0.5=half.'
      ),
      time: z.number().min(0).optional().describe(
        'Time position in seconds. REQUIRED for: set_current_time.'
      ),
      tracks: z.array(z.object({
        path: z.string().optional().describe('Child node path relative to animated node. Omit for animating the node itself.'),
        component: z.string().optional().describe('Component type name if animating a component property.'),
        property: z.string().describe('Property name to animate, e.g. "position", "scale", "color", "opacity".'),
        keyframes: z.array(z.object({
          time: z.number().describe('Keyframe time in seconds'),
          value: z.unknown().describe('Property value at this keyframe'),
          easing: z.string().optional().describe('Easing function name, e.g. "linear", "quadIn", "quadOut"'),
        })).describe('Array of keyframes with time and value'),
      })).optional().describe(
        'Animation tracks. REQUIRED for: create_clip. Each track defines keyframes for one property.'
      ),
      savePath: z.string().optional().describe(
        'STRONGLY RECOMMENDED db:// path to save the clip as a .anim asset. Without this the clip only exists in runtime memory and will be lost on scene reload. Example: "db://assets/animations/idle.anim".'
      ),
      autoPlay: z.boolean().optional().describe(
        'For create_clip only. If true, sets Animation.playOnLoad=true so the clip auto-plays when the scene loads.'
      ),
      persistenceMode: persistenceModeSchema,
    }),
    async (params) => {
      try {
        const p = params as Record<string, unknown>;
        const uuid = String(p.uuid ?? '');
        if (!uuid) return text({ error: '缺少 uuid 参数' }, true);

        switch (p.action) {
          case 'create_clip': {
            const sanitizedTracks = sanitizeTracksForClip(p.tracks);
            if (sanitizedTracks.validTracks.length === 0) {
              return text({
                success: false,
                error: 'create_clip 未提供有效 tracks（每条轨道至少需要 2 个有效 keyframe: time + value）。',
                droppedTracks: sanitizedTracks.droppedTracks,
                droppedKeyframes: sanitizedTracks.droppedKeyframes,
              }, true);
            }

            const savePath = typeof p.savePath === 'string' ? p.savePath : '';
            const clipPayload = {
              ...p,
              tracks: sanitizedTracks.validTracks,
              ...(savePath ? { attachToNode: false } : {}),
            };

            const result = await sceneMethod('createAnimationClip', [clipPayload]);
            if (isFailedResult(result)) {
              return text(result, true);
            }
            if (!savePath) {
              // createAnimationClip 在 execute-scene-script 中直接操作运行时对象（editorSyncSkipped=true），
              // 编辑器场景模型不感知此 clip，即使手动 Ctrl+S 也无法持久化。
              const response = {
                ...(result as Record<string, unknown>),
                _persistenceWarning: '动画 clip 仅存在于运行时内存，重载场景后将丢失。请提供 savePath（如 "db://assets/animations/xxx.anim"）参数以保存为 .anim 文件并落地到场景。',
              };
              if (p.persistenceMode === 'strict') {
                return text({
                  ...response,
                  success: false,
                  error: 'create_clip 未提供 savePath，无法在 strict 模式下保证持久化。',
                }, true);
              }
              return text(response);
            }

            const saveResult = await saveAnimationAsset({
              savePath,
              clipName: String((result as Record<string, unknown>).clipName || p.clipName || 'NewClip'),
              duration: Number(p.duration ?? 1),
              wrapMode: String(p.wrapMode ?? 'Normal'),
              speed: Number(p.speed ?? 1),
              sample: Number(p.sample ?? 60),
              tracks: sanitizedTracks.validTracks,
            });
            if (saveResult.error) {
              const response = {
                ...(result as Record<string, unknown>),
                savedAsset: null,
                warnings: [`保存 .anim 资产失败: ${saveResult.error}`],
              };
              if (p.persistenceMode === 'strict') {
                return text({
                  ...response,
                  success: false,
                  error: `create_clip 保存 .anim 资产失败（strict 模式）: ${saveResult.error}`,
                }, true);
              }
              return text(response);
            }
            const assetUuid = typeof saveResult.uuid === 'string' ? saveResult.uuid : '';
            if (!assetUuid) {
              const response = {
                ...(result as Record<string, unknown>),
                savedAsset: saveResult,
                warnings: ['.anim 文件已写入，但未能解析出资源 UUID，尚未完成节点资产回绑。'],
              };
              if (p.persistenceMode === 'strict') {
                return text({
                  ...response,
                  success: false,
                  error: 'create_clip 已写入 .anim 文件，但未能解析资源 UUID，strict 模式下视为持久化失败。',
                }, true);
              }
              return text(response);
            }
            const attachAssetResult = await attachSavedClipAsset(uuid, assetUuid, Boolean(p.autoPlay));

            if (attachAssetResult.error) {
              const response = {
                ...(result as Record<string, unknown>),
                savedAsset: saveResult,
                assetBinding: null,
                warnings: [String(attachAssetResult.error)],
              };
              if (p.persistenceMode === 'strict') {
                return text({
                  ...response,
                  success: false,
                  error: `create_clip 资产回绑失败（strict 模式）: ${attachAssetResult.error}`,
                }, true);
              }
              return text(response);
            }
            const persistenceWrapped = await withPersistenceGuard(
              { editorMsg, bridgePost },
              {
                mode: p.persistenceMode,
                target: {
                  kind: 'multi',
                  targets: [
                    { kind: 'asset', url: saveResult.path as string | undefined },
                    { kind: 'scene', saveStrategy: 'save_scene' },
                  ],
                },
                strictFailureMessage: 'animation_tool.create_clip 写入成功，但场景持久化失败（strict 模式）',
              },
              async () => {
                const response = {
                  ...(result as Record<string, unknown>),
                  savedAsset: saveResult,
                  assetBinding: attachAssetResult,
                };
                await attachScenePersistenceWarnings(editorMsg, response, {
                  action: 'animation_tool.create_clip',
                  affectedUuid: uuid,
                  includeSceneSaveWarning: false,
                });
                return response;
              },
            );
            return text(persistenceWrapped.result, persistenceWrapped.isError ? true : undefined);
          }
          case 'play': {
            const result = await dispatchAnimatorPlayback('play', uuid, typeof p.clipName === 'string' ? p.clipName : undefined);
            return text(result, isFailedResult(result));
          }
          case 'pause': {
            const result = await dispatchAnimatorPlayback('pause', uuid);
            return text(result, isFailedResult(result));
          }
          case 'resume': {
            const result = await dispatchAnimatorPlayback('resume', uuid);
            return text(result, isFailedResult(result));
          }
          case 'stop': {
            const result = await dispatchAnimatorPlayback('stop', uuid);
            return text(result, isFailedResult(result));
          }
          case 'get_state': {
            const result = await queryAnimationState(uuid);
            return text(result);
          }
          case 'list_clips': {
            const result = await queryAnimationState(uuid);
            return text(result);
          }
          case 'set_current_time': {
            const result = await sceneMethod('dispatchAnimationAction', [{
              action: 'set_current_time', uuid, time: p.time,
            }]);
            return text(result);
          }
          case 'set_speed': {
            const result = await sceneMethod('dispatchAnimationAction', [{
              action: 'set_speed', uuid, speed: p.speed,
            }]);
            return text(result);
          }
          case 'crossfade': {
            const result = await sceneMethod('dispatchAnimationAction', [{
              action: 'crossfade', uuid, clipName: p.clipName, duration: p.duration ?? 0.3,
            }]);
            return text(result);
          }
          default:
            return text({ error: `未知的动画 action: ${p.action}` }, true);
        }
      } catch (err: unknown) {
        return text({ tool: 'animation_tool', error: errorMessage(err) }, true);
      }
    },
  );
}
