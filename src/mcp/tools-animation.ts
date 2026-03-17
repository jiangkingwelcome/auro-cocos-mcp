import { z } from 'zod';
import { LocalToolServer } from './local-tool-server';
import type { BridgeToolContext } from './tools-shared';
import { toInputSchema, errorMessage, AI_RULES } from './tools-shared';

export function registerAnimationTools(server: LocalToolServer, ctx: BridgeToolContext): void {
  const { sceneMethod, text } = ctx;

  server.tool(
    'animation_tool',
    `Manage Animation components and clips on Cocos Creator nodes. Create keyframe animations, control playback, and inspect animation state.

Actions & required parameters:
- create_clip: uuid(REQUIRED, target node), duration(optional, default 1), wrapMode(optional: Normal/Loop/PingPong), speed(optional, default 1), tracks(REQUIRED, array of keyframe tracks). Create and attach an AnimationClip.
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
    }),
    async (params) => {
      try {
        const p = params as Record<string, unknown>;
        const uuid = String(p.uuid ?? '');
        if (!uuid) return text({ error: '缺少 uuid 参数' }, true);

        switch (p.action) {
          case 'create_clip': {
            const result = await sceneMethod('createAnimationClip', [p]);
            return text(result);
          }
          case 'play': {
            const result = await sceneMethod('dispatchAnimationAction', [{
              action: 'play', uuid, clipName: p.clipName,
            }]);
            return text(result);
          }
          case 'pause': {
            const result = await sceneMethod('dispatchAnimationAction', [{
              action: 'pause', uuid,
            }]);
            return text(result);
          }
          case 'resume': {
            const result = await sceneMethod('dispatchAnimationAction', [{
              action: 'resume', uuid,
            }]);
            return text(result);
          }
          case 'stop': {
            const result = await sceneMethod('dispatchAnimationAction', [{
              action: 'stop', uuid,
            }]);
            return text(result);
          }
          case 'get_state': {
            // Use the query handler we already added
            const result = await sceneMethod('dispatchQuery', [{ action: 'get_animation_state', uuid }]);
            return text(result);
          }
          case 'list_clips': {
            const result = await sceneMethod('dispatchQuery', [{ action: 'get_animation_state', uuid }]);
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
