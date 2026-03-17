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
    await ipc('scene', 'new-scene');
    return { success: true };
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
