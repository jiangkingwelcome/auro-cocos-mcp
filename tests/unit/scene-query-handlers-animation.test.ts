import { describe, expect, it, vi } from 'vitest';
import { buildQueryHandlers } from '../../src/scene-query-handlers';

describe('scene-query-handlers animation metadata', () => {
  it('get_animation_state falls back to serialized clip fields', () => {
    class AnimationComponent {}

    const clip = {
      _name: 'bounce',
      _duration: 1.5,
      _speed: 2,
      _wrapMode: 22,
    };
    const anim = {
      clips: [clip],
      defaultClip: clip,
      playOnLoad: true,
    };
    const node = {
      name: 'Hero',
      getComponent: vi.fn().mockReturnValue(anim),
    };

    const handlers = buildQueryHandlers({
      getCC: () => ({
        js: {
          getClassByName: (name: string) => (
            name === 'Animation' || name === 'cc.Animation' ? AnimationComponent : null
          ),
        },
      } as any),
      getNodePath: () => 'Canvas/Hero',
      findNodeByUuid: () => node as any,
      requireNode: () => ({ node: node as any }),
    });

    const result = handlers.get('get_animation_state')?.({} as any, node as any, { uuid: 'node-uuid' }) as any;

    expect(result.hasAnimation).toBe(true);
    expect(result.clipCount).toBe(1);
    expect(result.clips).toEqual([{
      name: 'bounce',
      duration: 1.5,
      speed: 2,
      wrapMode: 22,
    }]);
    expect(result.defaultClip).toBe('bounce');
    expect(result.playOnLoad).toBe(true);
  });
});
