import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { CocosCC } from '../../src/scene-types';

let resolveEditorComponentIdentifier: typeof import('../../src/scene').resolveEditorComponentIdentifier;

beforeAll(async () => {
  (globalThis as Record<string, unknown>).Editor = {
    App: { path: process.cwd() },
    Message: { request: async () => ({}), send: async () => ({}) },
  };
  ({ resolveEditorComponentIdentifier } = await import('../../src/scene'));
});

afterEach(() => {
  delete (globalThis as Record<string, unknown>).EditorExtends;
});

describe('resolveEditorComponentIdentifier', () => {
  it('prefers runtime script uuid compression for custom scripts', () => {
    class CustomScript {}
    (CustomScript as unknown as { prototype: Record<string, unknown> }).prototype.__scriptUuid = 'b9a956fa-d082-4556-9a7c-ae0e01c0b676';
    (globalThis as Record<string, unknown>).EditorExtends = {
      UuidUtils: {
        compressUuid(uuid: string, min: boolean) {
          return uuid === 'b9a956fa-d082-4556-9a7c-ae0e01c0b676' && min ? 'b9a95b60IJFVpp8rg4BwLZ2' : '';
        },
      },
    };
    const getClassId = vi.fn(() => 'WrongTempId');
    const cc = {
      js: {
        getClassByName(name: string) {
          if (name === 'BallAnimation') return CustomScript;
          if (name === 'cc.Component') return class ComponentBase {};
          return null;
        },
        getClassId,
        isChildClassOf() {
          return false;
        },
      },
    } as unknown as CocosCC;

    expect(resolveEditorComponentIdentifier(cc, 'BallAnimation')).toBe('b9a95b60IJFVpp8rg4BwLZ2');
    expect(getClassId).not.toHaveBeenCalled();
  });

  it('uses class id for custom script components', () => {
    class CustomScript {}
    const getClassId = vi.fn((obj: unknown, allowTempId?: boolean) => (
      obj === CustomScript && allowTempId === true ? 'BallAnimationCid' : ''
    ));
    const cc = {
      js: {
        getClassByName(name: string) {
          if (name === 'BallAnimation') return CustomScript;
          if (name === 'cc.Component') return class ComponentBase {};
          return null;
        },
        getClassId,
        isChildClassOf() {
          return false;
        },
      },
    } as unknown as CocosCC;

    expect(resolveEditorComponentIdentifier(cc, 'BallAnimation')).toBe('BallAnimationCid');
    expect(getClassId).toHaveBeenCalledWith(CustomScript, true);
  });

  it('falls back to cc-prefixed builtin component names when class id is unavailable', () => {
    class Sprite {}
    class ComponentBase {}
    const cc = {
      js: {
        getClassByName(name: string) {
          if (name === 'Sprite' || name === 'cc.Sprite') return Sprite;
          if (name === 'cc.Component') return ComponentBase;
          return null;
        },
        getClassId() {
          return '';
        },
        isChildClassOf(child: unknown, parent: unknown) {
          return child === Sprite && parent === ComponentBase;
        },
      },
    } as unknown as CocosCC;

    expect(resolveEditorComponentIdentifier(cc, 'Sprite')).toBe('cc.Sprite');
  });

  it('keeps raw short names for custom scripts when no class id is available', () => {
    class CustomScript {}
    class ComponentBase {}
    const cc = {
      js: {
        getClassByName(name: string) {
          if (name === 'BallAnimation') return CustomScript;
          if (name === 'cc.Component') return ComponentBase;
          if (name === 'cc.BallAnimation') return class NotAComponent {};
          return null;
        },
        getClassId() {
          return '';
        },
        isChildClassOf() {
          return false;
        },
      },
    } as unknown as CocosCC;

    expect(resolveEditorComponentIdentifier(cc, 'BallAnimation')).toBe('BallAnimation');
  });
});
