import type { RouteRegistrar } from './route-types';
import { ipc } from './route-types';

const SCENE_SCRIPT_WHITELIST = new Set([
  'dispatchQuery', 'dispatchOperation', 'dispatchEngineAction',
  'getSceneTree', 'getAllNodesList', 'getSceneStats', 'getNodeDetail',
  'findNodeByPath', 'getNodeComponents',
  'setNodePosition', 'setNodeRotation', 'setNodeScale', 'setNodeName', 'setNodeActive',
  'createChildNode', 'destroyNode', 'reparentNode',
  'addComponent', 'removeComponent', 'setComponentProperty',
  'setReferenceImage',
  'detectFeatures',
]);

const IPC_ALLOWED_MODULES = new Set([
  'scene', 'asset-db', 'selection', 'preview', 'builder', 'panel', 'package',
  'preferences', 'project',  // Cocos 3.8.x 内置模块，支持 query-config / set-config
]);

function normalizeStructuredResult(result: unknown, fallback: Record<string, unknown>) {
  if (result && typeof result === 'object' && ('success' in result || 'error' in result)) {
    return { ...fallback, ...(result as Record<string, unknown>) };
  }
  return { success: true, ...fallback, ...(result === undefined ? {} : { result }) };
}

function validateArgsLength(args: unknown[] | undefined) {
  if (Array.isArray(args) && args.length > 50) {
    return { error: 'args 长度不能超过 50' };
  }
  return null;
}

export function registerIpcBridgeRoutes(post: RouteRegistrar, extensionName: string): void {
  post('/api/scene/execute-script', async (_params, body) => {
    const payload = (body && typeof body === 'object' ? body : {}) as { method?: string; args?: unknown[] };
    if (!payload.method) return { error: '缺少 method 参数' };
    const argsLengthError = validateArgsLength(payload.args);
    if (argsLengthError) return argsLengthError;
    if (!SCENE_SCRIPT_WHITELIST.has(payload.method)) {
      return { error: `方法 "${payload.method}" 不在白名单中。允许: ${[...SCENE_SCRIPT_WHITELIST].join(', ')}` };
    }
    try {
      return await ipc('scene', 'execute-scene-script', {
        name: extensionName,
        method: payload.method,
        args: payload.args || [],
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { error: `场景脚本执行失败: ${msg}` };
    }
  });

  post('/api/message/send', async (_params, body) => {
    const payload = (body && typeof body === 'object' ? body : {}) as { module?: string; message?: string; args?: unknown[] };
    if (!payload.module || !payload.message) return { error: '缺少 module 或 message 参数' };
    const argsLengthError = validateArgsLength(payload.args);
    if (argsLengthError) return argsLengthError;
    if (!IPC_ALLOWED_MODULES.has(payload.module)) {
      return { error: `模块 "${payload.module}" 不在允许列表中。允许: ${[...IPC_ALLOWED_MODULES].join(', ')}` };
    }
    try {
      const result = await ipc(payload.module, payload.message, ...(payload.args || []));
      return normalizeStructuredResult(result, { module: payload.module, message: payload.message });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { error: `消息发送失败: ${msg}` };
    }
  });

  post('/api/reference-image/set', async (_params, body) => {
    const payload = (body && typeof body === 'object' ? body : {}) as { opacity?: number; active?: boolean };
    try {
      const result = await ipc('scene', 'execute-scene-script', {
        name: extensionName,
        method: 'setReferenceImage',
        args: [payload.active ?? true, payload.opacity ?? 0.5],
      });
      return normalizeStructuredResult(result, { active: payload.active ?? true, opacity: payload.opacity ?? 0.5 });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { error: `设置参考图失败: ${msg}` };
    }
  });

  post('/api/reference-image/clear', async () => {
    try {
      const result = await ipc('scene', 'execute-scene-script', {
        name: extensionName,
        method: 'setReferenceImage',
        args: [false, 0],
      });
      return normalizeStructuredResult(result, { active: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { error: `清除参考图失败: ${msg}` };
    }
  });
}
