import fs from 'fs';
import http from 'http';
import path from 'path';
import { URL } from 'url';
import { applySettingsUpdate, type BridgeSettings, DEFAULT_SETTINGS, loadSettingsAsync, saveSettingsAsync } from './bridge-settings';
import { buildCocosToolServer } from './mcp/tools';
import { StandaloneMcpHost } from './mcp/standalone-host';
import { ErrorCategory, logIgnored, logWarn } from './error-utils';
import { ensureTokenAsync, extractMcpToken } from './token-manager';
import { updateRegistry, removeRegistry } from './registry';
import { getProLicenseStatus, saveLicenseKey, type ProLicenseStatus } from './mcp/tools-pro-bridge';
import { getConfigStatusAsync, configureIDE as configureIdeService, removeIDE as removeIdeService } from './ide-config-service';
import { registerAssetDbRoutes } from './routes/asset-db-routes';
import { registerAnimatorRoutes } from './routes/animator-routes';
import { registerConsoleRoutes } from './routes/console-routes';
import { registerEditorControlRoutes } from './routes/editor-control-routes';
import { registerEventBusRoutes, registerBroadcastListeners, unregisterBroadcastListeners } from './routes/event-bus-routes';
import { registerIpcBridgeRoutes } from './routes/ipc-bridge-routes';
import { registerOperationRoutes } from './routes/operation-routes';
import { registerServiceRoutes } from './routes/service-routes';
import type { RouteHandler } from './routes/route-types';
import { updater } from './updater';
import type { UpdatePhase } from './updater';

const EXTENSION_NAME = 'aura-for-cocos';
const FALLBACK_PKG_VERSION = '0.0.0';
const DEFAULT_PORT = Number(process.env.COCOS_MCP_PORT) || 7779;
const REQUEST_TIMEOUT_MS = Number(process.env.COCOS_MCP_TIMEOUT_MS || 20_000);
const TOKEN_FILE = path.join(__dirname, '..', '.mcp-token');
const SETTINGS_FILE = path.join(__dirname, '..', '.mcp-settings.json');

let currentSettings: BridgeSettings = { ...DEFAULT_SETTINGS };
let packageVersion = FALLBACK_PKG_VERSION;

// updateRegistry / removeRegistry 已抽取到 ./registry.ts

type RouteEntry = { method: 'GET' | 'POST' | 'DELETE'; path: string; handler: RouteHandler };

const routes: RouteEntry[] = [];

let server: http.Server | null = null;
let activePort = 0;
let startTime = 0;
let requestCount = 0;
let mcpHost: StandaloneMcpHost | null = null;
let mcpToken = '';
let bridgeBase = '';
/** 每次服务启动时生成的唯一 ID，shim 用来检测服务是否重启过（即使重启很快也能感知）。 */
let startupId = '';

let initialized = false;
let initPromise: Promise<void> | null = null;

const rateCounter = new Map<string, number>();
let rateWindowStart = 0;

import { installConsoleCapture } from './console-capture';

// Ensure console capture is installed (may already be from main.ts)
installConsoleCapture();

async function readPackageVersion(): Promise<string> {
  try {
    const pkgRaw = await fs.promises.readFile(path.join(__dirname, '..', 'package.json'), 'utf-8');
    const parsed = JSON.parse(pkgRaw) as { version?: string };
    return parsed.version || FALLBACK_PKG_VERSION;
  } catch (e) {
    logIgnored(ErrorCategory.CONFIG, '读取 package.json 版本号失败', e);
    return FALLBACK_PKG_VERSION;
  }
}

function get(pathName: string, handler: RouteHandler) {
  routes.push({ method: 'GET', path: pathName, handler });
}

function post(pathName: string, handler: RouteHandler) {
  routes.push({ method: 'POST', path: pathName, handler });
}

function matchRoute(method: string, pathname: string) {
  for (const route of routes) {
    if (route.method !== method) continue;
    if (route.path === pathname) return route;
  }
  return null;
}

function parseQuery(url: URL): Record<string, string> {
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

function isLoopbackAddress(address?: string | null): boolean {
  if (!address) return false;
  return address === '127.0.0.1' || address === '::1' || address.startsWith('::ffff:127.0.0.1');
}

function resolveCorsOrigin(req: http.IncomingMessage): string | null {
  const origin = req.headers.origin;
  if (!origin) return null;
  try {
    const parsed = new URL(origin);
    if (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost') return origin;
  } catch (e) {
    logIgnored(ErrorCategory.UNKNOWN, 'CORS origin 解析失败', e);
    return null;
  }
  return null;
}

function applyCorsHeaders(req: http.IncomingMessage, res: http.ServerResponse) {
  const allowed = resolveCorsOrigin(req);
  if (allowed) res.setHeader('Access-Control-Allow-Origin', allowed);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-MCP-Token, Authorization');
}

function sendJson(req: http.IncomingMessage, res: http.ServerResponse, data: unknown, status = 200) {
  applyCorsHeaders(req, res);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

class BodyTooLargeError extends Error {
  constructor(maxBytes: number) { super(`请求体超过最大限制 (${maxBytes} bytes)`); this.name = 'BodyTooLargeError'; }
}

async function readBody(req: http.IncomingMessage): Promise<unknown> {
  const maxBody = currentSettings.maxBodySizeBytes;
  return new Promise((resolve, reject) => {
    let data = '';
    let totalLen = 0;
    let destroyed = false;
    req.on('data', (chunk: Buffer) => {
      totalLen += chunk.length;
      if (totalLen > maxBody) {
        destroyed = true;
        req.destroy();
        reject(new BodyTooLargeError(maxBody));
        return;
      }
      data += chunk.toString('utf-8');
    });
    req.on('end', () => {
      if (destroyed) return;
      if (!data.trim()) return resolve(null);
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        logWarn(ErrorCategory.SERIALIZATION, `请求体 JSON 解析失败 (${data.length} bytes)`, e);
        reject(new Error('请求体不是合法的 JSON'));
      }
    });
    req.on('error', (err) => {
      if (destroyed) return;
      reject(err);
    });
  });
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`请求超时: ${label}`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function consumeRateLimit(key: string): boolean {
  const now = Date.now();
  if (now - rateWindowStart >= 60_000) {
    rateWindowStart = now;
    rateCounter.clear();
  }
  const count = rateCounter.get(key) ?? 0;
  const next = count + 1;
  rateCounter.set(key, next);
  return next <= currentSettings.rateLimitPerMinute;
}

function getRateLimitKey(req: http.IncomingMessage): string {
  const token = extractMcpToken(req);
  if (token) return `token:${token.slice(0, 8)}`;
  return req.socket.remoteAddress ?? 'unknown';
}

// ensureToken 已抽取到 ./token-manager.ts

function textResponse(data: unknown, isError = false) {
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  return {
    content: [{ type: 'text' as const, text }],
    ...(isError ? { isError: true } : {}),
  };
}

async function invokeRoute(method: 'GET' | 'POST' | 'DELETE', pathname: string, params: Record<string, string> = {}, body: unknown = null) {
  const route = matchRoute(method, pathname);
  if (!route) throw new Error(`路由不存在: ${method} ${pathname}`);
  return withTimeout(route.handler(params, body), REQUEST_TIMEOUT_MS, `${method} ${pathname}`);
}

// extractMcpToken 已抽取到 ./token-manager.ts

// Routes that do NOT require Token auth (read-only diagnostics)
const AUTH_EXEMPT_ROUTES = new Set([
  '/api/status',
  '/api/routes',
  '/api/editor/info',
  '/api/mcp/connection-info',
  '/api/settings',
]);

function requiresAuth(method: string, pathname: string): boolean {
  if (method === 'GET' && AUTH_EXEMPT_ROUTES.has(pathname)) return false;
  if (pathname.startsWith('/api/')) return true;
  return false;
}

function initializeMcpHost(serverVersion = packageVersion) {
  if (mcpHost) return;
  const _sceneMethod = async (method: string, args: unknown[] = []) =>
    withTimeout(
      Editor.Message.request('scene', 'execute-scene-script', {
        name: EXTENSION_NAME,
        method,
        args,
      }),
      REQUEST_TIMEOUT_MS,
      `sceneMethod(${method})`,
    );
  const _editorMsg = (module: string, message: string, ...args: unknown[]) =>
    withTimeout(
      Editor.Message.request(module, message, ...args),
      REQUEST_TIMEOUT_MS,
      `editorMsg(${module}, ${message})`,
    );
  const _querySceneRootUuid = async (): Promise<string> => {
    try {
      const tree = await _sceneMethod('dispatchQuery', [{ action: 'tree', includeInternal: true }]) as Record<string, unknown>;
      const uuid = tree?.uuid ?? tree?._id;
      return uuid ? String(uuid) : '';
    } catch {
      return '';
    }
  };
  const _beginSceneRecording = async (targets: string[] = []): Promise<string | null> => {
    try {
      const normalized = targets
        .map((item) => String(item ?? '').trim())
        .filter(Boolean);
      const recordId = await _editorMsg('scene', 'begin-recording', normalized, null);
      return recordId === undefined || recordId === null || recordId === '' ? null : String(recordId);
    } catch {
      return null;
    }
  };
  const _endSceneRecording = async (recordId: string | null): Promise<void> => {
    try {
      if (recordId) {
        await _editorMsg('scene', 'end-recording', recordId);
        return;
      }
      await _editorMsg('scene', 'end-recording');
    } catch {
      /* ignore */
    }
  };
  const _recordingTargetsForOp = async (op: Record<string, unknown>): Promise<string[]> => {
    const action = String(op.action ?? '');
    const uuid = String(op.uuid ?? '').trim();
    if (uuid) return [uuid];
    if (action === 'create_node') {
      const parentUuid = String(op.parentUuid ?? '').trim();
      if (parentUuid) return [parentUuid];
      const rootUuid = await _querySceneRootUuid();
      return rootUuid ? [rootUuid] : [];
    }
    if (action === 'batch' && Array.isArray(op.operations)) {
      const uuids = op.operations
        .map((item) => {
          if (!item || typeof item !== 'object') return '';
          const entry = item as Record<string, unknown>;
          const itemUuid = String(entry.uuid ?? '').trim();
          if (itemUuid) return itemUuid;
          if (String(entry.action ?? '') === 'create_node') {
            return String(entry.parentUuid ?? '').trim();
          }
          return '';
        })
        .filter(Boolean);
      if (uuids.length > 0) return uuids;
      const rootUuid = await _querySceneRootUuid();
      return rootUuid ? [rootUuid] : [];
    }
    return [];
  };
  // Run an operation via execute-scene-script, then force-dirty from the main process.
  // Cocos Creator 3.8.x: IPC calls from execute-scene-script preview context do NOT mark the
  // scene dirty unless they are wrapped in the editor's real recording transaction.
  const _sceneOpFallback = async (op: Record<string, unknown>): Promise<unknown> => {
    const r = await _sceneMethod('dispatchOperation', [op]) as Record<string, unknown>;
    const touchUuid = String(r?.uuid ?? r?.clonedUuid ?? op.uuid ?? '');
    if (touchUuid) {
      const recordId = await _beginSceneRecording([touchUuid]);
      try {
        await _editorMsg('scene', 'set-property', {
          uuid: touchUuid, path: 'active',
          dump: { type: 'Boolean', value: false },
        });
        await _editorMsg('scene', 'set-property', {
          uuid: touchUuid, path: 'active',
          dump: { type: 'Boolean', value: true },
        });
      } catch {
        /* force-dirty is best-effort */
      } finally {
        await _endSceneRecording(recordId);
      }
    }
    return r;
  };
  const tools = buildCocosToolServer({
    bridgeGet: async (apiPath, params) => invokeRoute('GET', apiPath, params ?? {}, null),
    bridgePost: async (apiPath, body) => invokeRoute('POST', apiPath, {}, body ?? null),
    sceneMethod: _sceneMethod,
    editorMsg: _editorMsg,
    sceneOp: async (params) => {
      const p = params as Record<string, unknown>;
      const action = String(p.action ?? '');
      const recordId = await _beginSceneRecording(await _recordingTargetsForOp(p));
      const _isSceneDirty = async (): Promise<boolean> => {
        try {
          return Boolean(await _editorMsg('scene', 'query-dirty'));
        } catch {
          return false;
        }
      };
      // Force-dirty a node by performing a reversible real write from the main process.
      // In some 3.8.x builds, create-node / same-value set-property still won't mark the scene dirty.
      // Temporarily changing the name and restoring it inside a real recording transaction
      // guarantees the node enters the serialized save path.
      const _forceDirtyNode = async (uuid: string, desiredName?: string): Promise<boolean> => {
        const forceRecordId = await _beginSceneRecording([uuid]);
        try {
          if (await _isSceneDirty()) return true;
          const baseName = desiredName || 'New Node';
          const tempName = `${baseName}__aura_dirty__`;
          await _editorMsg('scene', 'set-property', {
            uuid, path: 'name',
            dump: { type: 'string', value: tempName },
          });
          await _editorMsg('scene', 'set-property', {
            uuid, path: 'name',
            dump: { type: 'string', value: baseName },
          });
          return await _isSceneDirty();
        } catch {
          return false;
        } finally {
          await _endSceneRecording(forceRecordId);
        }
      };
      try {
        if (action === 'create_node') {
          const parentUuid = String(p.parentUuid ?? '');
          const name = String(p.name ?? 'New Node');
          const raw = await _editorMsg('scene', 'create-node', { parent: parentUuid || undefined, name });
          const rawObj = raw as Record<string, unknown>;
          const uuid = rawObj?.uuid ?? rawObj?._id ?? (typeof raw === 'string' ? raw : '');
          if (uuid) {
            const dirtyMarked = await _forceDirtyNode(String(uuid), name);
            return { success: true, uuid: String(uuid), name, _dirtyMarked: dirtyMarked };
          }
          return await _sceneOpFallback(params);
        }
        if (action === 'add_component') {
          const uuid = String(p.uuid ?? '');
          const component = String(p.component ?? '');
          if (uuid && component) {
            const compName = component.startsWith('cc.') || component.includes('.') ? component : `cc.${component}`;
            await _editorMsg('scene', 'create-component', { uuid, component: compName });
            await _forceDirtyNode(uuid);
            return { success: true, uuid, component };
          }
        }
        if (action === 'remove_node') {
          const uuid = String(p.uuid ?? '');
          if (uuid) {
            await _editorMsg('scene', 'remove-node', { uuid });
            return { success: true, uuid };
          }
        }
        return await _sceneOpFallback(params);
      } finally {
        await _endSceneRecording(recordId);
      }
    },
    text: textResponse,
    isAutoRollbackEnabled: () => currentSettings.autoRollback,
  });

  mcpHost = new StandaloneMcpHost({
    serverName: 'cocos-creator-bridge',
    serverVersion,
    toolServer: tools,
  });
}

async function ensureInitialized(): Promise<void> {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const [loadedSettings, loadedToken, loadedPkgVersion] = await Promise.all([
      loadSettingsAsync(SETTINGS_FILE),
      ensureTokenAsync(TOKEN_FILE),
      readPackageVersion(),
    ]);
    currentSettings = loadedSettings;
    mcpToken = loadedToken;
    packageVersion = loadedPkgVersion;
    initializeMcpHost(packageVersion);
    initialized = true;
  })().catch((err) => {
    initPromise = null;
    throw err;
  });

  return initPromise;
}

function persistSettingsInBackground() {
  void saveSettingsAsync(SETTINGS_FILE, currentSettings);
}

const HEAVY_STATUS_TTL_MS = 10_000;
const heavyStatusCache = {
  toolActions: {} as Record<string, unknown>,
  configStatus: {} as Record<string, boolean>,
  updatedAt: 0,
  loading: false,
};
let heavyStatusRefreshPromise: Promise<void> | null = null;

function refreshHeavyStatusInBackground(force = false): void {
  const stale = Date.now() - heavyStatusCache.updatedAt > HEAVY_STATUS_TTL_MS;
  if (!force && !stale && heavyStatusCache.updatedAt > 0) return;
  if (heavyStatusRefreshPromise) return;

  heavyStatusCache.loading = true;
  heavyStatusRefreshPromise = (async () => {
    const nextToolActions = mcpHost ? mcpHost.getToolActions() : {};
    const nextConfigStatus = await getConfigStatusAsync();
    heavyStatusCache.toolActions = nextToolActions;
    heavyStatusCache.configStatus = nextConfigStatus;
    heavyStatusCache.updatedAt = Date.now();
  })().catch((err) => {
    logIgnored(ErrorCategory.CONFIG, '刷新配置状态缓存失败', err);
  }).finally(() => {
    heavyStatusCache.loading = false;
    heavyStatusRefreshPromise = null;
  });
}

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------
registerServiceRoutes(get, post, {
  getActivePort: () => activePort,
  getBridgeBase: () => bridgeBase,
  getStartTime: () => startTime,
  getStartupId: () => startupId,
  getRequestCount: () => requestCount,
  getRouteCount: () => routes.length,
  getRouteEntries: () => routes.map((item) => ({ method: item.method, path: item.path })),
  getMcpHost: () => mcpHost,
  getMcpToken: () => mcpToken,
  getSettings: () => currentSettings,
  getDefaultSettings: () => DEFAULT_SETTINGS,
  updateSettings: (payload) => {
    currentSettings = applySettingsUpdate(currentSettings, payload);
    persistSettingsInBackground();
    return { success: true as const, settings: currentSettings };
  },
  resetSettings: () => {
    currentSettings = { ...DEFAULT_SETTINGS };
    persistSettingsInBackground();
    return { success: true as const, settings: currentSettings };
  },
  detectSceneFeatures: async () => {
    try {
      const result = await withTimeout(
        Editor.Message.request('scene', 'execute-scene-script', {
          name: EXTENSION_NAME,
          method: 'detectFeatures',
          args: [],
        }),
        5_000,
        'detectFeatures',
      );
      if (result && typeof result === 'object' && !('error' in (result as Record<string, unknown>))) {
        return result as Record<string, boolean>;
      }
      return null;
    } catch {
      return null;
    }
  },
});
registerIpcBridgeRoutes(post, EXTENSION_NAME);
registerEditorControlRoutes(get, post);
registerAnimatorRoutes(post);
registerAssetDbRoutes(get, post);
registerOperationRoutes(get, post);
registerConsoleRoutes(get, post);
registerEventBusRoutes(get, post);

function createServer(): http.Server {
  return http.createServer(async (req, res) => {
    requestCount += 1;

    if (currentSettings.loopbackOnly && !isLoopbackAddress(req.socket.remoteAddress)) {
      sendJson(req, res, { error: '仅允许本地回环地址访问' }, 403);
      return;
    }

    if (req.method === 'OPTIONS') {
      applyCorsHeaders(req, res);
      res.writeHead(204, { 'Access-Control-Max-Age': '86400' });
      res.end();
      return;
    }

    try {
      const url = new URL(req.url || '/', `http://127.0.0.1:${activePort || DEFAULT_PORT}`);
      const pathname = url.pathname;
      const method = req.method || 'GET';

      if (!consumeRateLimit(getRateLimitKey(req))) {
        sendJson(req, res, { error: '请求过于频繁，请稍后重试' }, 429);
        return;
      }

      if (pathname === '/mcp') {
        if (!mcpHost) {
          sendJson(req, res, { error: 'MCP Host 未初始化' }, 503);
          return;
        }
        const providedToken = extractMcpToken(req);
        if (!providedToken || providedToken !== mcpToken) {
          sendJson(req, res, { error: 'MCP token 无效或缺失' }, 401);
          return;
        }

        // SSE 长连接：GET /mcp with Accept: text/event-stream
        // AI 编辑器通过此连接接收服务端推送通知（如工具列表变更），
        // 并在 Cocos 重启后感知断连、自动重连。
        if (method === 'GET' && req.headers['accept']?.includes('text/event-stream')) {
          applyCorsHeaders(req, res);
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
          });
          res.flushHeaders();
          const cleanup = mcpHost.addSseClient(res);
          // 每 30 秒发一次心跳注释，防止代理或防火墙断开空闲连接
          const heartbeat = setInterval(() => {
            try { res.write(': ping\n\n'); } catch { /* ignore */ }
          }, 30_000);
          req.on('close', () => {
            clearInterval(heartbeat);
            cleanup();
          });
          return;
        }

        if (method !== 'POST') {
          sendJson(req, res, { error: 'MCP endpoint 仅支持 GET (SSE) 或 POST' }, 405);
          return;
        }
        const body = await readBody(req);
        const rpc = await withTimeout(mcpHost.handlePayload(body), REQUEST_TIMEOUT_MS, 'POST /mcp');
        if (rpc.status === 204) {
          applyCorsHeaders(req, res);
          res.writeHead(204);
          res.end();
          return;
        }
        sendJson(req, res, rpc.body ?? {}, rpc.status);
        return;
      }

      // Token auth for dangerous API routes
      if (requiresAuth(method, pathname)) {
        const providedToken = extractMcpToken(req);
        if (!providedToken || providedToken !== mcpToken) {
          sendJson(req, res, { error: 'API token 无效或缺失' }, 401);
          return;
        }
      }

      const route = matchRoute(method, pathname);
      if (!route) {
        sendJson(req, res, { error: `未知路由: ${method} ${pathname}` }, 404);
        return;
      }
      const params = parseQuery(url);
      const body = method === 'POST' || method === 'DELETE' ? await readBody(req) : null;
      const result = await withTimeout(route.handler(params, body, req), REQUEST_TIMEOUT_MS, `${method} ${pathname}`);
      sendJson(req, res, result);
    } catch (err: unknown) {
      if (err instanceof BodyTooLargeError) {
        sendJson(req, res, { error: err.message }, 413);
        return;
      }
      const msg = err instanceof Error ? err.message : String(err);
      sendJson(req, res, { error: msg || '内部错误' }, 500);
    }
  });
}

function tryListen(srv: http.Server, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const onError = (err: NodeJS.ErrnoException) => {
      srv.removeListener('listening', onListening);
      if (err.code === 'EACCES' || err.code === 'EADDRINUSE') {
        resolve(false);
        return;
      }
      resolve(false);
    };
    const onListening = () => {
      srv.removeListener('error', onError);
      resolve(true);
    };
    srv.once('error', onError);
    srv.once('listening', onListening);
    srv.listen(port, currentSettings.loopbackOnly ? '127.0.0.1' : '0.0.0.0');
  });
}

export async function startServer() {
  if (server) {
    console.log('[Aura] 服务已在运行中，跳过启动');
    return;
  }

  try {
    await ensureInitialized();

    const port = DEFAULT_PORT;
    const srv = createServer();
    const ok = await tryListen(srv, port);
    if (!ok) {
      srv.close();
      console.error(`[Aura] ❌ 启动失败：端口 ${port} 已被占用！`);
      console.error(`[Aura] 可能原因：另一个 Cocos 项目已经在使用 MCP Bridge。`);
      console.error(`[Aura] 解决方法：关闭另一个项目的 MCP Bridge，或设置环境变量 COCOS_MCP_PORT 使用其他端口。`);
      return;
    }
    server = srv;
    activePort = port;
    startTime = Date.now();
    startupId = Math.random().toString(36).slice(2) + Date.now().toString(36);
    requestCount = 0;
    bridgeBase = `http://127.0.0.1:${port}`;
    console.log(`[Aura] HTTP 服务已启动: ${bridgeBase}`);
    console.log(`[Aura] MCP endpoint: ${bridgeBase}/mcp`);
    console.log(`[Aura] MCP token: 已生成 (通过 /api/mcp/connection-info 查看)`);
    updateRegistry(port, mcpToken);
  } catch (err) {
    console.error('[Aura] ❌ 启动服务时发生异常:', err);
  }
}

const GRACEFUL_SHUTDOWN_TIMEOUT_MS = 5_000;

async function shutdownServerInternal(): Promise<boolean> {
  if (!server) return false;
  const srv = server;
  server = null;
  activePort = 0;
  bridgeBase = '';
  removeRegistry();

  const closePromise = new Promise<void>((resolve) => {
    srv.close(() => {
      console.log('[Aura] HTTP 服务已停止');
      resolve();
    });
  });

  const forceTimer = setTimeout(() => {
    try {
      srv.closeAllConnections();
    } catch (_e) {
      // closeAllConnections 在较旧 Node.js 版本中不存在，忽略
    }
  }, GRACEFUL_SHUTDOWN_TIMEOUT_MS);
  forceTimer.unref();
  await closePromise;
  return true;
}

export function stopServer() {
  void shutdownServerInternal();
}

export async function restartServer() {
  await shutdownServerInternal();
  await startServer();
}

// ---------------------------------------------------------------------------
// Panel API
// ---------------------------------------------------------------------------

export function getServiceInfo() {
  try {
    refreshHeavyStatusInBackground();

    const projectPath = Editor.Project?.path || process.cwd();
    const projectName = Editor.Project?.name || path.basename(projectPath);

    let toolCount = 0;
    let connectionCount = 0;
    let connectedClients: Array<{ name: string; version: string; lastSeenMs: number }> = [];
    let totalActionCount = 0;
    let toolNames: string[] = [];
    let allToolNames: string[] = [];
    let toolEnabledStates: Record<string, boolean> = {};
    let toolListVersion = 0;

    if (mcpHost) {
      try {
        toolCount = mcpHost.getToolCount();
        connectionCount = mcpHost.getConnectionCount();
        connectedClients = mcpHost.getConnectedClients();
        totalActionCount = mcpHost.getTotalActionCount();
        toolNames = mcpHost.getToolNames();
        allToolNames = mcpHost.getAllToolNames();
        toolEnabledStates = mcpHost.getToolEnabledStates();
        toolListVersion = mcpHost.getToolListVersion();
      } catch (e) {
        console.warn('[Aura] getServiceInfo: mcpHost 方法调用异常', e);
      }
    }

    return {
      running: !!server,
      initialized,
      port: activePort,
      token: mcpToken,
      bridgeBase,
      uptime: startTime ? Math.floor((Date.now() - startTime) / 1000) : 0,
      requestCount,
      editorVersion: Editor.App.version,
      projectName,
      projectPath,
      toolCount,
      totalActionCount,
      connectionCount,
      connectedClients,
      toolNames,
      allToolNames,
      toolActions: heavyStatusCache.toolActions,
      toolEnabledStates,
      toolListVersion,
      configStatus: heavyStatusCache.configStatus,
      heavyStatusLoading: heavyStatusCache.loading,
      heavyStatusReady: heavyStatusCache.updatedAt > 0,
      heavyStatusUpdatedAt: heavyStatusCache.updatedAt,
      settings: currentSettings,
      licenseStatus: getProLicenseStatus(),
      updatePhase: serializeUpdatePhase(updater.phase),
    };
  } catch (e) {
    console.error('[Aura] getServiceInfo 发生严重异常:', e);
    return {
      running: !!server,
      initialized,
      port: activePort,
      token: mcpToken,
      bridgeBase,
      uptime: 0,
      requestCount: 0,
      editorVersion: '',
      projectName: '',
      projectPath: '',
      toolCount: 0,
      totalActionCount: 0,
      connectionCount: 0,
      toolNames: [],
      allToolNames: [],
      toolActions: {},
      toolEnabledStates: {},
      toolListVersion: 0,
      configStatus: {},
      heavyStatusLoading: heavyStatusCache.loading,
      heavyStatusReady: heavyStatusCache.updatedAt > 0,
      heavyStatusUpdatedAt: heavyStatusCache.updatedAt,
      settings: currentSettings,
      licenseStatus: getProLicenseStatus(),
      updatePhase: serializeUpdatePhase(updater.phase),
    };
  }
}

export function configureIDE(...args: unknown[]) {
  const targetIDE = typeof args[0] === 'string' ? args[0] : 'cursor';

  try {
    const result = configureIdeService(targetIDE, activePort, !!server);
    if (result.success) {
      heavyStatusCache.updatedAt = 0;
      refreshHeavyStatusInBackground(true);
    }
    return result;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[Aura] 配置 ${targetIDE} 失败:`, msg);
    return { success: false, message: `写入失败: ${msg}` };
  }
}

export function removeIDE(...args: unknown[]) {
  const targetIDE = typeof args[0] === 'string' ? args[0] : '';
  if (!targetIDE) return { success: false, message: '缺少 IDE 参数' };
  try {
    const result = removeIdeService(targetIDE);
    if (result.success) {
      heavyStatusCache.updatedAt = 0;
      refreshHeavyStatusInBackground(true);
    }
    return result;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[Aura] 移除 ${targetIDE} 配置失败:`, msg);
    return { success: false, message: `移除失败: ${msg}` };
  }
}

export function getSettings() {
  return { settings: currentSettings, defaults: DEFAULT_SETTINGS };
}

export function updateSettings(...args: unknown[]) {
  const payload = args[0] && typeof args[0] === 'object' ? args[0] as Partial<BridgeSettings> : {};
  currentSettings = applySettingsUpdate(currentSettings, payload);
  persistSettingsInBackground();
  return { success: true, settings: currentSettings };
}

export function resetSettings() {
  currentSettings = { ...DEFAULT_SETTINGS };
  persistSettingsInBackground();
  return { success: true, settings: currentSettings };
}

export function setToolEnabled(...args: unknown[]) {
  const toolName = typeof args[0] === 'string' ? args[0] : '';
  const enabled = typeof args[1] === 'boolean' ? args[1] : true;
  if (!toolName) {
    return { success: false, error: '缺少 toolName 参数' };
  }
  if (!mcpHost) {
    return { success: false, error: 'MCP Host 未初始化' };
  }
  const result = mcpHost.setToolEnabled(toolName, enabled);
  if (!result.exists) {
    return { success: false, error: `未知工具: ${toolName}` };
  }
  return {
    success: true,
    toolName,
    enabled: result.enabled,
    changed: result.changed,
    toolListVersion: result.toolListVersion,
    note: '已更新工具可用性；已连接的 MCP 客户端如未自动刷新，请重新获取 tools/list 或重连。',
  };
}

export function isAutoRollbackEnabled(): boolean {
  return currentSettings.autoRollback;
}

export function getLicenseStatus(): ProLicenseStatus {
  return getProLicenseStatus();
}

export function activateLicense(...args: unknown[]): { success: boolean; licenseStatus: ProLicenseStatus; error?: string } {
  const key = typeof args[0] === 'string' ? args[0].trim() : '';
  if (!key) {
    return { success: false, licenseStatus: getProLicenseStatus(), error: 'No license key provided' };
  }
  const status = saveLicenseKey(key);
  return {
    success: status.licenseValid,
    licenseStatus: status,
    error: status.error,
  };
}

export const methods = {
  startServer,
  stopServer,
  restartServer,
  getServiceInfo,
  configureIDE,
  removeIDE,
  getSettings,
  updateSettings,
  resetSettings,
  setToolEnabled,
  openPanel() {
    const candidates = [
      `${EXTENSION_NAME}.default`,
      `${EXTENSION_NAME}:default`,
      `${EXTENSION_NAME}/default`,
      'default',
    ];
    for (const panelId of candidates) {
      try {
        Editor.Panel.open(panelId as never);
        return;
      } catch (err) {
        console.warn(`[Aura] 打开面板失败: ${panelId}`, err);
      }
    }
    console.error(`[Aura] 无法打开面板，已尝试: ${candidates.join(', ')}`);
  },
  onSceneReady() {
    console.log('[Aura] 场景已就绪');
  },
};

export function load() {
  let loadVer = FALLBACK_PKG_VERSION;
  try {
    const raw = fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8');
    loadVer = (JSON.parse(raw) as { version?: string }).version || FALLBACK_PKG_VERSION;
  } catch {
    /* ignore */
  }
  console.warn(
    `[Aura] 插件已加载 · package v${loadVer} · ${new Date().toISOString()}（热更后若见此行时间变新，说明新 JS 已生效）`,
  );
  try {
    registerBroadcastListeners();
  } catch (err) {
    console.warn('[MCP] 广播系统事件注册失败 (部分事件可能不可用)', err);
  }
  void ensureInitialized()
    .then(async () => {
      await startServer();
      refreshHeavyStatusInBackground(true);
    })
    .catch((err) => {
      console.error('[Aura] 初始化失败:', err);
    });
  // 启动自动更新后台检查（异步，不阻塞加载）
  updater.scheduleChecks();
}

export function unload() {
  console.log('[Aura] 插件卸载中...');
  unregisterBroadcastListeners();
  mcpHost?.closeAllSseClients();
  stopServer();
  mcpHost = null;
  initialized = false;
  initPromise = null;
  heavyStatusCache.toolActions = {};
  heavyStatusCache.configStatus = {};
  heavyStatusCache.updatedAt = 0;
  heavyStatusCache.loading = false;
  heavyStatusRefreshPromise = null;
  updater.stopChecks();
}

// ─── Update API ──────────────────────────────────────────────────────────────

function serializeUpdatePhase(p: UpdatePhase): Record<string, unknown> {
  switch (p.phase) {
    case 'downloading': return { phase: p.phase, progress: p.progress, info: p.info };
    case 'available':   return { phase: p.phase, info: p.info };
    case 'verifying':   return { phase: p.phase, info: p.info };
    case 'ready':       return { phase: p.phase, info: p.info };
    case 'done':        return { phase: p.phase, version: p.version, requiresRestart: p.requiresRestart };
    case 'error':       return { phase: p.phase, message: p.message };
    default:            return { phase: p.phase };
  }
}

export async function checkForUpdates() {
  const info = await updater.checkForUpdates();
  return { updatePhase: serializeUpdatePhase(updater.phase), info };
}

export async function downloadUpdate() {
  if (updater.phase.phase !== 'available') {
    return { success: false, error: '当前没有可用更新', updatePhase: serializeUpdatePhase(updater.phase) };
  }
  try {
    void updater.download(); // 异步，面板通过轮询获取进度
    return { success: true, updatePhase: serializeUpdatePhase(updater.phase) };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg, updatePhase: serializeUpdatePhase(updater.phase) };
  }
}

export async function installUpdate() {
  if (updater.phase.phase !== 'ready') {
    return { success: false, error: '更新包尚未下载完成', updatePhase: serializeUpdatePhase(updater.phase) };
  }
  try {
    void updater.apply(); // 异步
    return { success: true, updatePhase: serializeUpdatePhase(updater.phase) };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg, updatePhase: serializeUpdatePhase(updater.phase) };
  }
}

export function resetUpdateState() {
  updater.reset();
  return { success: true, updatePhase: serializeUpdatePhase(updater.phase) };
}
