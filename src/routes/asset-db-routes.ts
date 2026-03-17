import { ErrorCategory, logIgnored } from '../error-utils';
import { recordOperation, withLock } from '../operation-manager';
import type { RouteRegistrar } from './route-types';
import { ipc } from './route-types';

export function registerAssetDbRoutes(get: RouteRegistrar, post: RouteRegistrar): void {
  get('/api/asset-db/query-assets', async (params) =>
    ipc('asset-db', 'query-assets', { pattern: params.pattern || 'db://assets/**/*' }),
  );

  get('/api/asset-db/query-asset-info', async (params) =>
    ipc('asset-db', 'query-asset-info', params.url || ''),
  );

  post('/api/asset-db/create-asset', async (_params, body) => {
    const payload = (body && typeof body === 'object' ? body : {}) as { url?: string; content?: unknown };
    if (!payload.url) return { error: '缺少 url 参数' };
    return withLock(payload.url, 'create-asset', async () => {
      const existing = await ipc('asset-db', 'query-asset-info', payload.url);
      if (existing) {
        if (payload.content !== null && payload.content !== undefined) {
          const saveResult = (await ipc('asset-db', 'save-asset', payload.url, typeof payload.content === 'string' ? payload.content : JSON.stringify(payload.content))) ?? { success: true };
          return { ...saveResult as Record<string, unknown>, overwritten: true, url: payload.url };
        }
        return { success: true, url: payload.url, alreadyExists: true, message: '资源已存在，无需重复创建' };
      }
      const result = (await ipc('asset-db', 'create-asset', payload.url, payload.content ?? null)) ?? { success: true };
      recordOperation('asset-db', 'create-asset', { url: payload.url }, result, [{
        description: `删除创建的资源 ${payload.url}`,
        execute: async () => { await ipc('asset-db', 'delete-asset', payload.url); },
      }]);
      return result;
    });
  });

  post('/api/asset-db/save-asset', async (_params, body) => {
    const payload = (body && typeof body === 'object' ? body : {}) as { url?: string; content?: string };
    if (!payload.url) return { error: '缺少 url 参数' };
    return withLock(payload.url, 'save-asset', async () =>
      (await ipc('asset-db', 'save-asset', payload.url, payload.content || '')) ?? { success: true },
    );
  });

  post('/api/asset-db/delete-asset', async (_params, body) => {
    const payload = (body && typeof body === 'object' ? body : {}) as { url?: string };
    if (!payload.url || typeof payload.url !== 'string') return { error: '缺少 url 参数' };
    return withLock(payload.url, 'delete-asset', async () => {
      try {
        const info = await ipc('asset-db', 'query-asset-info', payload.url);
        if (!info) return { success: true, message: '资源不存在，无需删除' };
      } catch (e) {
        logIgnored(ErrorCategory.ASSET_OPERATION, '删除前查询资源信息失败，仍尝试删除', e);
      }
      return (await ipc('asset-db', 'delete-asset', payload.url)) ?? { success: true };
    });
  });

  post('/api/asset-db/move-asset', async (_params, body) => {
    const payload = (body && typeof body === 'object' ? body : {}) as { sourceUrl?: string; targetUrl?: string };
    if (!payload.sourceUrl || !payload.targetUrl) return { error: '缺少 sourceUrl 或 targetUrl 参数' };
    return withLock(`${payload.sourceUrl}|${payload.targetUrl}`, 'move-asset', async () =>
      (await ipc('asset-db', 'move-asset', payload.sourceUrl, payload.targetUrl)) ?? { success: true },
    );
  });

  post('/api/asset-db/import-asset', async (_params, body) => {
    const payload = (body && typeof body === 'object' ? body : {}) as { sourcePath?: string; targetUrl?: string };
    if (!payload.sourcePath || !payload.targetUrl) return { error: '缺少 sourcePath 或 targetUrl 参数' };
    return withLock(payload.targetUrl, 'import-asset', async () =>
      (await ipc('asset-db', 'import-asset', payload.sourcePath, payload.targetUrl)) ?? { success: true },
    );
  });

  post('/api/asset-db/open-asset', async (_params, body) => {
    const payload = (body && typeof body === 'object' ? body : {}) as { url?: string };
    if (!payload.url) return { error: '缺少 url 参数' };
    const info = await ipc('asset-db', 'query-asset-info', payload.url) as Record<string, unknown> | null;
    if (info && info.uuid) {
      await ipc('asset-db', 'open-asset', info.uuid);
    }
    return { success: true };
  });

  post('/api/asset-db/refresh', async (_params, body) => {
    const payload = (body && typeof body === 'object' ? body : {}) as { url?: string };
    await ipc('asset-db', 'refresh-asset', payload.url || 'db://assets');
    return { success: true };
  });
}
