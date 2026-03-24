import { describe, expect, it, vi } from 'vitest';
import { buildQueryHandlers } from '../../src/scene-query-handlers';

describe('scene-query-handlers serialization', () => {
  it('get_component_property serializes SpriteFrame-like circular objects into uuid snapshots', () => {
    class Sprite {}

    const spriteFrame: Record<string, unknown> = {
      _uuid: 'sprite-frame-uuid',
      name: 'HeroFrame',
      constructor: { name: 'SpriteFrame' },
    };
    spriteFrame.texture = { _viewInfo: spriteFrame, constructor: { name: 'Texture2D' } };

    const sprite = { spriteFrame };
    const node = {
      getComponent: vi.fn().mockReturnValue(sprite),
    };

    const handlers = buildQueryHandlers({
      getCC: () => ({
        js: {
          getClassByName: (name: string) => (
            name === 'Sprite' || name === 'cc.Sprite' ? Sprite : null
          ),
        },
      } as any),
      getNodePath: () => 'scene/Hero',
      findNodeByUuid: () => node as any,
      requireNode: () => ({ node: node as any }),
    });

    const result = handlers.get('get_component_property')?.(
      {} as any,
      node as any,
      { uuid: 'node-uuid', component: 'Sprite', property: 'spriteFrame' },
    ) as any;

    expect(result.error).toBeUndefined();
    expect(result.value).toEqual({
      __type__: 'SpriteFrame',
      uuid: 'sprite-frame-uuid',
      name: 'HeroFrame',
    });
  });

  it('get_component_property preserves plain vector-like values', () => {
    class Transform {}

    const transform = { position: { x: 1, y: 2, z: 3 } };
    const node = {
      getComponent: vi.fn().mockReturnValue(transform),
    };

    const handlers = buildQueryHandlers({
      getCC: () => ({
        js: {
          getClassByName: (name: string) => (
            name === 'Transform' || name === 'cc.Transform' ? Transform : null
          ),
        },
      } as any),
      getNodePath: () => 'scene/Hero',
      findNodeByUuid: () => node as any,
      requireNode: () => ({ node: node as any }),
    });

    const result = handlers.get('get_component_property')?.(
      {} as any,
      node as any,
      { uuid: 'node-uuid', component: 'Transform', property: 'position' },
    ) as any;

    expect(result.value).toEqual({ x: 1, y: 2, z: 3 });
  });
});
