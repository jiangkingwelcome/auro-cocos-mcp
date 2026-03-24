import fs from 'fs';
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
    if (!fs.existsSync(payload.sourcePath)) {
      return { success: false, sourcePath: payload.sourcePath, targetUrl: payload.targetUrl, error: `源文件不存在: ${payload.sourcePath}` };
    }
    try {
      if (!fs.statSync(payload.sourcePath).isFile()) {
        return { success: false, sourcePath: payload.sourcePath, targetUrl: payload.targetUrl, error: `sourcePath 不是文件: ${payload.sourcePath}` };
      }
    } catch (error: unknown) {
      return {
        success: false,
        sourcePath: payload.sourcePath,
        targetUrl: payload.targetUrl,
        error: `读取源文件信息失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
    return withLock(payload.targetUrl, 'import-asset', async () => {
      const preImportInfo = await ipc('asset-db', 'query-asset-info', payload.targetUrl);
      const result = await ipc('asset-db', 'import-asset', payload.sourcePath, payload.targetUrl);
      if (result && typeof result === 'object' && ('success' in result || 'error' in result)) {
        return result;
      }
      const importedInfo = await ipc('asset-db', 'query-asset-info', payload.targetUrl);
      if (!preImportInfo && importedInfo) {
        return { success: true, targetUrl: payload.targetUrl, sourcePath: payload.sourcePath, info: importedInfo };
      }
      return {
        success: false,
        sourcePath: payload.sourcePath,
        targetUrl: payload.targetUrl,
        error: preImportInfo
          ? `import-asset 未返回可确认结果，且目标资源在导入前已存在，无法确认本次导入是否真正成功: ${payload.targetUrl}`
          : `import-asset 未返回可确认结果，且 AssetDB 中未找到目标资源: ${payload.targetUrl}`,
      };
    });
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
