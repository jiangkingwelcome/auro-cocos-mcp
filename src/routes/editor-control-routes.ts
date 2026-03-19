import { ErrorCategory, logIgnored } from '../error-utils';
import type { RouteRegistrar } from './route-types';
import { ipc, safeEditorMsg } from './route-types';

export function registerEditorControlRoutes(get: RouteRegistrar, post: RouteRegistrar): void {
  const resolvePreferenceScope = (rawScope: string | undefined): 'global' | 'project' | 'default' => {
    if (rawScope === 'project' || rawScope === 'default') return rawScope;
    return 'global';
  };

  post('/api/editor/save-scene', async (_params, body) => {
    const payload = (body && typeof body === 'object' ? body : {}) as { force?: boolean };
    try {
      const sceneInfo = await ipc('scene', 'query-scene') as { url?: string; name?: string } | null;
      const sceneUrl = sceneInfo?.url;
      const isUntitled = !sceneUrl || sceneUrl === '' || sceneUrl === 'db://';
      if (isUntitled && !payload.force) {
        return {
          success: false,
          skipped: true,
          reason: '当前场景尚未保存过（无文件路径），save-scene 会弹出原生对话框。请先在编辑器中手动 Ctrl+S 保存一次，或传 force:true 强制弹出对话框。',
          sceneName: sceneInfo?.name || 'Untitled',
        };
      }
    } catch {
      // query-scene IPC not available on this Cocos version — proceed with save
    }
    await ipc('scene', 'save-scene');
    return { success: true };
  });

  post('/api/editor/open-scene', async (_params, body) => {
    const payload = (body && typeof body === 'object' ? body : {}) as { uuid?: string; url?: string };
    if (payload.uuid) {
      await ipc('asset-db', 'open-asset', payload.uuid);
      return { success: true };
    }
    if (payload.url) {
      const info = await ipc('asset-db', 'query-asset-info', payload.url) as Record<string, unknown> | null;
      if (info && info.uuid) {
        await ipc('asset-db', 'open-asset', info.uuid);
        return { success: true };
      }
      return { error: `找不到场景: ${payload.url}` };
    }
    return { error: '缺少 uuid 或 url 参数' };
  });

  post('/api/scene/new-scene', async () => {
    try {
      const sceneInfo = await ipc('scene', 'query-scene') as { url?: string } | null;
      const sceneUrl = sceneInfo?.url;
      if (sceneUrl && sceneUrl !== '' && sceneUrl !== 'db://') {
        await ipc('scene', 'save-scene');
      }
    } catch (_e) { /* best effort save — skip if query-scene or save fails */ }

    // 方案1: 通过 asset-db 创建 .scene 文件 + open-asset 打开，避免直接调用 scene:new-scene 可能的兼容性问题
    const baseUrl = 'db://assets/scenes/New Scene.scene';
    let sceneUrl: string;
    try {
      sceneUrl = await ipc('asset-db', 'generate-available-url', baseUrl) as string;
    } catch {
      sceneUrl = baseUrl;
    }

    // 确保 scenes 目录存在
    try {
      const folderInfo = await ipc('asset-db', 'query-asset-info', 'db://assets/scenes');
      if (!folderInfo) {
        await ipc('asset-db', 'create-asset', 'db://assets/scenes', null);
      }
    } catch { /* folder may already exist */ }

    const emptyScene = JSON.stringify(buildEmptySceneJson(), null, 2);

    await ipc('asset-db', 'create-asset', sceneUrl, emptyScene);

    // 打开新创建的场景
    const info = await ipc('asset-db', 'query-asset-info', sceneUrl) as { uuid?: string } | null;
    if (info?.uuid) {
      await ipc('asset-db', 'open-asset', info.uuid);
    }

    return { success: true, url: sceneUrl, method: 'asset-db-create' };
  });

  post('/api/editor/undo', async () => {
    await ipc('scene', 'undo');
    return { success: true };
  });

  post('/api/editor/redo', async () => {
    await ipc('scene', 'redo');
    return { success: true };
  });

  get('/api/editor/selection', async () => ({ selected: Editor.Selection.getSelected('node') }));

  post('/api/editor/select', async (_params, body) => {
    const payload = (body && typeof body === 'object' ? body : {}) as { uuids?: string[]; forceRefresh?: boolean };
    if (!Array.isArray(payload.uuids)) return { error: '缺少 uuids 数组' };
    if (payload.forceRefresh) {
      try { Editor.Selection.clear('node'); } catch { /* ignore */ }
    }
    Editor.Selection.select('node', payload.uuids);
    return { success: true, selected: payload.uuids };
  });

  get('/api/editor/project-info', async () => ({
    editorVersion: Editor.App.version,
    editorPath: Editor.App.path,
    projectPath: Editor.Project?.path || '',
    projectName: Editor.Project?.name || '',
  }));

  post('/api/scene/focus-node', async (_params, body) => {
    const payload = (body && typeof body === 'object' ? body : {}) as { uuid?: string };
    const uuid = payload.uuid || '';
    if (!uuid) return { error: '缺少 uuid 参数' };
    Editor.Selection.select('node', [uuid]);
    return { success: true, uuid };
  });

  get('/api/panel/list', async () => ({
    panels: [
      'scene', 'hierarchy', 'inspector', 'assets', 'console',
      'animation', 'preferences', 'project-settings', 'build',
    ],
    info: 'Cocos 3.8.x 面板列表（静态）',
  }));

  get('/api/preferences/get', async (params) => {
    const key = params.key || '';
    const scope = resolvePreferenceScope(params.scope);
    if (typeof Editor.Profile?.getConfig !== 'function') {
      return { error: '当前 Cocos 版本不支持 Editor.Profile API (需要 >= 3.6)' };
    }
    if (!key) {
      try {
        const cfg = await Editor.Profile.getConfig(scope, '*') || {};
        return { success: true, scope, config: cfg };
      } catch (e) {
        logIgnored(ErrorCategory.EDITOR_IPC, '读取全量偏好配置失败', e);
        return { success: true, scope, config: {}, info: '无法读取全量配置，请指定具体 key' };
      }
    }
    try {
      const val = await Editor.Profile.getConfig(scope, key);
      return { success: true, key, scope, value: val };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { error: `读取偏好失败: ${msg}` };
    }
  });

  post('/api/preferences/set', async (_params, body) => {
    const payload = (body && typeof body === 'object' ? body : {}) as { key?: string; value?: unknown; scope?: string };
    if (!payload.key) return { error: '缺少 key 参数' };
    if (typeof Editor.Profile?.setConfig !== 'function') {
      return { error: '当前 Cocos 版本不支持 Editor.Profile API (需要 >= 3.6)' };
    }
    const scope = resolvePreferenceScope(payload.scope);
    if (scope === 'default') return { error: 'default 作用域只读，不能写入' };
    try {
      await Editor.Profile.setConfig(scope, payload.key, payload.value);
      return { success: true, key: payload.key, scope, value: payload.value };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { error: `写入偏好失败: ${msg}` };
    }
  });

  post('/api/preview/open', async () => {
    try {
      let platform = 'browser';
      try {
        platform = await (Editor.Profile.getConfig as (...args: unknown[]) => Promise<unknown>)('preview', 'preview.current.platform', 'local') as string || 'browser';
      } catch {
        logIgnored(ErrorCategory.EDITOR_IPC, 'Editor.Profile.getConfig 不可用（Cocos < 3.6），使用默认 platform=browser');
      }
      if (platform === 'gameView') {
        const res = await safeEditorMsg('scene', 'editor-preview-set-play', [true]);
        return res.ok ? { success: true, platform, result: res.data } : { error: res.error };
      }
      const res = await safeEditorMsg('preview', 'open-terminal', [undefined], [
        { module: 'preview', message: 'open' },
      ]);
      return res.ok ? { success: true, platform } : { error: res.error };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { error: `启动预览失败: ${msg}` };
    }
  });

  post('/api/preview/refresh', async () => {
    try {
      const res = await safeEditorMsg('preview', 'reload-terminal', [], [
        { module: 'preview', message: 'reload' },
      ]);
      return res.ok ? { success: true } : { error: res.error };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { error: `刷新预览失败: ${msg}` };
    }
  });

  post('/api/builder/build', async (_params, body) => {
    const payload = (body && typeof body === 'object' ? body : {}) as { platform?: string };
    await ipc('builder', 'open');
    if (payload.platform) await ipc('builder', 'start-build', { platform: payload.platform });
    return { success: true };
  });
}

// Cocos Creator 3.8.x 最小合法空场景 JSON（从真实编辑器产物提取精简）
// 结构: [0]SceneAsset → [1]Scene → [2]Camera Node → [3]Camera Component
//       [1]Scene._globals → [4]SceneGlobals → [5..12] 各全局设置
function buildEmptySceneJson(): unknown[] {
  const V3 = (x: number, y: number, z: number) => ({ __type__: 'cc.Vec3', x, y, z });
  const V4 = (x: number, y: number, z: number, w: number) => ({ __type__: 'cc.Vec4', x, y, z, w });
  const QUAT = (x: number, y: number, z: number, w: number) => ({ __type__: 'cc.Quat', x, y, z, w });
  const COLOR = (r: number, g: number, b: number, a: number) => ({ __type__: 'cc.Color', r, g, b, a });
  const ID = (id: number) => ({ __id__: id });
  // Cocos 短 ID：Base64-like 22 字符，与编辑器内部格式一致
  const shortId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let id = '';
    for (let i = 0; i < 22; i++) id += chars[Math.floor(Math.random() * 64)];
    return id;
  };

  return [
    // [0] SceneAsset
    {
      __type__: 'cc.SceneAsset', _name: '', _objFlags: 0,
      __editorExtras__: {}, _native: '',
      scene: ID(1),
    },
    // [1] Scene
    {
      __type__: 'cc.Scene', _name: 'New Scene', _objFlags: 0,
      __editorExtras__: {},
      _parent: null,
      _children: [ID(2)],
      _active: true, _components: [], _prefab: null,
      _lpos: V3(0, 0, 0), _lrot: QUAT(0, 0, 0, 1), _lscale: V3(1, 1, 1),
      _mobility: 0, _layer: 1073741824,
      _euler: V3(0, 0, 0),
      autoReleaseAssets: false,
      _globals: ID(4),
      _id: shortId(),
    },
    // [2] Main Camera Node
    {
      __type__: 'cc.Node', _name: 'Main Camera', _objFlags: 0,
      __editorExtras__: {},
      _parent: ID(1),
      _children: [],
      _active: true,
      _components: [ID(3)],
      _prefab: null,
      _lpos: V3(-10, 10, 10),
      _lrot: QUAT(-0.27781593346944056, -0.36497167621709875, -0.11507512748638377, 0.8811195706053617),
      _lscale: V3(1, 1, 1),
      _mobility: 0, _layer: 1073741824,
      _euler: V3(-35, -45, 0),
      _id: shortId(),
    },
    // [3] Camera Component
    {
      __type__: 'cc.Camera', _name: '', _objFlags: 0,
      __editorExtras__: {},
      node: ID(2),
      _enabled: true, __prefab: null,
      _projection: 1, _priority: 0, _fov: 45, _fovAxis: 0,
      _orthoHeight: 10, _near: 1, _far: 1000,
      _color: COLOR(51, 51, 51, 255),
      _depth: 1, _stencil: 0, _clearFlags: 14,
      _rect: { __type__: 'cc.Rect', x: 0, y: 0, width: 1, height: 1 },
      _aperture: 19, _shutter: 7, _iso: 0, _screenScale: 1,
      _visibility: 1788870655,
      _targetTexture: null, _postProcess: null,
      _usePostProcess: false, _cameraType: -1, _trackingType: 0,
      _id: shortId(),
    },
    // [4] SceneGlobals
    {
      __type__: 'cc.SceneGlobals',
      ambient: ID(5), shadows: ID(6), _skybox: ID(7), fog: ID(8),
      octree: ID(9), skin: ID(10), lightProbeInfo: ID(11), postSettings: ID(12),
      bakedWithStationaryMainLight: false, bakedWithHighpLightmap: false,
    },
    // [5] AmbientInfo
    {
      __type__: 'cc.AmbientInfo',
      _skyColorHDR: V4(0.2, 0.5, 0.8, 0.520833125),
      _skyColor: V4(0.2, 0.5, 0.8, 0.520833125),
      _skyIllumHDR: 20000, _skyIllum: 20000,
      _groundAlbedoHDR: V4(0.2, 0.2, 0.2, 1),
      _groundAlbedo: V4(0.2, 0.2, 0.2, 1),
      _skyColorLDR: V4(0.452588, 0.607642, 0.755699, 0),
      _skyIllumLDR: 0.8,
      _groundAlbedoLDR: V4(0.618555, 0.577848, 0.544564, 0),
    },
    // [6] ShadowsInfo
    {
      __type__: 'cc.ShadowsInfo',
      _enabled: false, _type: 0,
      _normal: V3(0, 1, 0), _distance: 0, _planeBias: 1,
      _shadowColor: COLOR(76, 76, 76, 255),
      _maxReceived: 4,
      _size: { __type__: 'cc.Vec2', x: 1024, y: 1024 },
    },
    // [7] SkyboxInfo
    {
      __type__: 'cc.SkyboxInfo',
      _envLightingType: 0,
      _envmapHDR: null, _envmap: null, _envmapLDR: null,
      _diffuseMapHDR: null, _diffuseMapLDR: null,
      _enabled: false, _useHDR: true,
      _editableMaterial: null,
      _reflectionHDR: null, _reflectionLDR: null,
      _rotationAngle: 0,
    },
    // [8] FogInfo
    {
      __type__: 'cc.FogInfo',
      _type: 0, _fogColor: COLOR(200, 200, 200, 255),
      _enabled: false, _fogDensity: 0.3,
      _fogStart: 0.5, _fogEnd: 300, _fogAtten: 5,
      _fogTop: 1.5, _fogRange: 1.2, _accurate: false,
    },
    // [9] OctreeInfo
    {
      __type__: 'cc.OctreeInfo',
      _enabled: false,
      _minPos: V3(-1024, -1024, -1024),
      _maxPos: V3(1024, 1024, 1024),
      _depth: 8,
    },
    // [10] SkinInfo
    {
      __type__: 'cc.SkinInfo',
      _enabled: true, _blurRadius: 0.01, _sssIntensity: 3,
    },
    // [11] LightProbeInfo
    {
      __type__: 'cc.LightProbeInfo',
      _giScale: 1, _giSamples: 1024, _bounces: 2,
      _reduceRinging: 0, _showProbe: true, _showWireframe: true,
      _showConvex: false, _data: null, _lightProbeSphereVolume: 1,
    },
    // [12] PostSettingsInfo
    {
      __type__: 'cc.PostSettingsInfo',
      _toneMappingType: 0,
    },
  ];
}
