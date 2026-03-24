import { z } from 'zod';
import { LocalToolServer } from './local-tool-server';
import type { BridgeToolContext } from './tools-shared';
import {
  toInputSchema,
  errorMessage,
  AI_RULES,
  normalizeDbUrl,
  sanitizeDbUrl,
  ensureAssetDirectory,
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

  function buildAnimJson(
    name: string,
    duration: number,
    wrapMode: string,
    speed: number,
    sample: number,
    tracks: Array<Record<string, unknown>>,
  ): Record<string, unknown> {
    const wrapModeMap: Record<string, number> = {
      normal: 1,
      loop: 2,
      pingpong: 22,
      reverse: 36,
      loopreverse: 38,
    };

    const allTimes = new Set<number>();
    for (const t of tracks) {
      const keyframes = t.keyframes as Array<{ time: number }> | undefined;
      if (!Array.isArray(keyframes)) continue;
      for (const keyframe of keyframes) allTimes.add(keyframe.time);
    }
    const sortedTimes = [...allTimes].sort((a, b) => a - b);

    const curves = tracks.map((track) => {
      const keyframes = (track.keyframes as Array<{ time: number; value: unknown }> | undefined) || [];
      const modifiers: unknown[] = [];
      if (track.path) modifiers.push({ __type__: 'cc.animation.HierarchyPath', path: track.path });
      if (track.component) modifiers.push({ __type__: 'cc.animation.ComponentPath', component: track.component });
      modifiers.push(track.property);

      const timeToValue = new Map<number, unknown>();
      for (const keyframe of keyframes) timeToValue.set(keyframe.time, keyframe.value);

      const filteredTimes: number[] = [];
      const filteredValues: unknown[] = [];
      for (const time of sortedTimes) {
        if (!timeToValue.has(time)) continue;
        filteredTimes.push(time);
        filteredValues.push(timeToValue.get(time));
      }

      return { modifiers, data: { keys: 0, values: filteredValues, interpolate: true }, filteredTimes };
    });

    const keys: number[][] = [sortedTimes];
    const normalizedCurves = curves.map((curve) => {
      let keysIndex = 0;
      if (curve.filteredTimes.length !== sortedTimes.length) {
        keysIndex = keys.length;
        keys.push(curve.filteredTimes);
      }
      return {
        modifiers: curve.modifiers,
        data: {
          ...(curve.data as Record<string, unknown>),
          keys: keysIndex,
        },
      };
    });

    return {
      __type__: 'cc.AnimationClip',
      _name: name,
      _duration: duration,
      sample,
      speed,
      wrapMode: wrapModeMap[wrapMode.toLowerCase()] ?? 1,
      keys,
      curves: normalizedCurves,
    };
  }

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

  async function attachSavedClipAsset(nodeUuid: string, assetUuid: string): Promise<Record<string, unknown>> {
    const defaultClipResult = await sceneMethod('setComponentProperty', [
      nodeUuid,
      'Animation',
      'defaultClip',
      { __uuid__: assetUuid },
    ]) as Record<string, unknown>;
    if (defaultClipResult?.error) {
      return { error: `已保存 .anim 资产，但回绑 Animation.defaultClip 失败: ${defaultClipResult.error}` };
    }

    const stateAfter = await queryAnimationState(nodeUuid);
    return {
      bound: true,
      assetUuid,
      defaultClipResult,
      stateAfter,
    };
  }

  async function queryAnimationState(uuid: string): Promise<Record<string, unknown>> {
    return await sceneMethod('dispatchQuery', [{ action: 'get_animation_state', uuid }]) as Record<string, unknown>;
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
- create_clip: uuid(REQUIRED, target node), duration(optional, default 1), wrapMode(optional: Normal/Loop/PingPong), speed(optional, default 1), tracks(REQUIRED, array of keyframe tracks), savePath(optional, db://... .anim). Create and attach an AnimationClip, optionally save as asset.
- play: uuid(REQUIRED), clipName(optional, plays default clip if omitted). Start playing an animation clip.
- pause: uuid(REQUIRED). Pause current animation.
- resume: uuid(REQUIRED). Resume paused animation.
- stop: uuid(REQUIRED). Stop and reset animation to beginning.
- get_state: uuid(REQUIRED). Get current animation state (playing, paused, current clip, time).
- list_clips: uuid(REQUIRED). List all animation clips on a node.
- set_current_time: uuid(REQUIRED), time(REQUIRED, seconds). Seek animation to a specific time.
- set_speed: uuid(REQUIRED), speed(REQUIRED). Set animation playback speed (1.0 = normal).
- crossfade: uuid(REQUIRED), clipName(REQUIRED), duration(optional, default 0.3). Crossfade to another animation clip.

Prerequisites: Node must have an Animation component. Use scene_operation action=add_component component="Animation" first if needed.
Returns: create_clip→{success,clipName,duration}. play/pause/resume/stop→{success}. get_state→{isPlaying,currentClip,time,speed}. list_clips→{clips:[{name,duration}]}. On error: {error:"message"}.` + AI_RULES,
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
        'Optional db:// path to save the created clip as a .anim asset. Example: "db://assets/animations/idle.anim".'
      ),
    }),
    async (params) => {
      try {
        const p = params as Record<string, unknown>;
        const uuid = String(p.uuid ?? '');
        if (!uuid) return text({ error: '缺少 uuid 参数' }, true);

        switch (p.action) {
          case 'create_clip': {
            const result = await sceneMethod('createAnimationClip', [p]);
            if (isFailedResult(result)) {
              return text(result, true);
            }
            const savePath = typeof p.savePath === 'string' ? p.savePath : '';
            if (!savePath) return text(result);

            const saveResult = await saveAnimationAsset({
              savePath,
              clipName: String((result as Record<string, unknown>).clipName || p.clipName || 'NewClip'),
              duration: Number(p.duration ?? 1),
              wrapMode: String(p.wrapMode ?? 'Normal'),
              speed: Number(p.speed ?? 1),
              sample: Number(p.sample ?? 60),
              tracks: (p.tracks as Array<Record<string, unknown>> | undefined) || [],
            });
            if (saveResult.error) {
              return text({
                ...(result as Record<string, unknown>),
                savedAsset: null,
                warnings: [`保存 .anim 资产失败: ${saveResult.error}`],
              });
            }
            const assetUuid = typeof saveResult.uuid === 'string' ? saveResult.uuid : '';
            if (!assetUuid) {
              return text({
                ...(result as Record<string, unknown>),
                savedAsset: saveResult,
                warnings: ['.anim 文件已写入，但未能解析出资源 UUID，尚未完成节点资产回绑。'],
              });
            }
            const attachAssetResult = await attachSavedClipAsset(uuid, assetUuid);
            if (attachAssetResult.error) {
              return text({
                ...(result as Record<string, unknown>),
                savedAsset: saveResult,
                assetBinding: null,
                warnings: [String(attachAssetResult.error)],
              });
            }
            return text({
              ...(result as Record<string, unknown>),
              savedAsset: saveResult,
              assetBinding: attachAssetResult,
            });
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
