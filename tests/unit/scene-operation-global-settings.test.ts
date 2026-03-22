import { describe, expect, it, vi } from 'vitest';
import { buildOperationHandlers, type SceneOperationDeps } from '../../src/scene-operation-handlers-impl';

function makeDeps(overrides: Partial<SceneOperationDeps> = {}): SceneOperationDeps {
  return {
    getCC: () => ({
      js: {
        getClassByName: vi.fn(),
      },
    } as any),
    findNodeByUuid: vi.fn(),
    findNodeByName: vi.fn(),
    resolveParent: vi.fn(),
    requireNode: vi.fn(),
    notifyEditorProperty: vi.fn().mockResolvedValue(true),
    notifyEditorRemoveNode: vi.fn().mockResolvedValue(true),
    notifyEditorComponentProperty: vi.fn().mockResolvedValue(true),
    ipcDuplicateNode: vi.fn().mockResolvedValue('dup-node'),
    setSiblingIndexViaEditor: vi.fn().mockResolvedValue(true),
    ipcCreateNode: vi.fn().mockResolvedValue('new-node'),
    ipcCreateComponent: vi.fn().mockResolvedValue(undefined),
    ipcResetProperty: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

describe('scene-operation global settings', () => {
  it('setup_physics_world 不再改写 PhysicsSystem.instance，而是明确返回不支持持久化', async () => {
    const physics3D = {
      gravity: { x: 0, y: -10, z: 0 },
      allowSleep: true,
      fixedTimeStep: 1 / 60,
    };
    const deps = makeDeps({
      getCC: () => ({
        js: {
          getClassByName: vi.fn((name: string) => {
            if (name === 'PhysicsSystem' || name === 'cc.PhysicsSystem') {
              return { instance: physics3D };
            }
            return null;
          }),
        },
      } as any),
    });
    const handlers = buildOperationHandlers(deps);

    const result = await handlers.get('setup_physics_world')!(
      {} as any,
      {} as any,
      { mode: '3d', gravity: { x: 1, y: 2, z: 3 }, allowSleep: false, fixedTimeStep: 0.02 },
    );

    expect(result).toMatchObject({
      error: expect.stringContaining('未实现 PhysicsSystem 世界配置的稳定持久化'),
      unsupportedPersistence: true,
      requested: {
        mode: '3d',
        gravity: { x: 1, y: 2, z: 3 },
        allowSleep: false,
        fixedTimeStep: 0.02,
      },
    });
    expect(physics3D).toEqual({
      gravity: { x: 0, y: -10, z: 0 },
      allowSleep: true,
      fixedTimeStep: 1 / 60,
    });
  });

  it('set_scene_environment preset 不再直接改写 scene.globals', async () => {
    const scene = {
      globals: {
        ambient: { skyIllum: 1000 },
        shadows: { enabled: false, type: 0 },
        fog: { enabled: false, fogDensity: 0 },
      },
    };
    const handlers = buildOperationHandlers(makeDeps());

    const result = await handlers.get('set_scene_environment')!(
      {} as any,
      scene as any,
      { preset: 'outdoor_day' },
    );

    expect(result).toMatchObject({
      error: expect.stringContaining('未实现 scene.globals 的稳定场景持久化'),
      unsupportedPersistence: true,
      preset: 'outdoor_day',
      requested: {
        ambient: { skyIllum: 20000 },
        shadows: { enabled: true, type: 1 },
        fog: { enabled: false },
      },
    });
    expect(scene.globals.ambient.skyIllum).toBe(1000);
    expect(scene.globals.shadows.enabled).toBe(false);
  });

  it('set_scene_environment subsystem 不再直接改写 scene.globals，并返回规范化请求', async () => {
    const scene = {
      globals: {
        ambient: {
          skyIllum: 1000,
          skyColor: { r: 1, g: 2, b: 3, a: 4 },
        },
      },
    };
    const handlers = buildOperationHandlers(makeDeps());

    const result = await handlers.get('set_scene_environment')!(
      {} as any,
      scene as any,
      {
        subsystem: 'ambient',
        skyIllum: 8888,
        skyColor: { r: 300, g: -5, b: 30, a: 512 },
      },
    );

    expect(result).toMatchObject({
      error: expect.stringContaining('未实现 scene.globals 的稳定场景持久化'),
      unsupportedPersistence: true,
      subsystem: 'ambient',
      requested: {
        skyIllum: 8888,
        skyColor: { r: 255, g: 0, b: 30, a: 255 },
      },
    });
    expect(scene.globals.ambient).toEqual({
      skyIllum: 1000,
      skyColor: { r: 1, g: 2, b: 3, a: 4 },
    });
  });
});
