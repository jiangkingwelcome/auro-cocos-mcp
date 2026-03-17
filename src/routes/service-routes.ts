import type { IncomingMessage } from 'http';
import type { BridgeSettings } from '../bridge-settings';
import type { StandaloneMcpHost } from '../mcp/standalone-host';
import { AI_RULES_VERSION } from '../mcp/tools-shared';
import { extractMcpToken } from '../token-manager';
import type { RouteRegistrar } from './route-types';

type ServiceRouteDeps = {
  getActivePort: () => number;
  getBridgeBase: () => string;
  getStartTime: () => number;
  getRequestCount: () => number;
  getRouteCount: () => number;
  getRouteEntries: () => Array<{ method: string; path: string }>;
  getMcpHost: () => StandaloneMcpHost | null;
  getMcpToken: () => string;
  getSettings: () => BridgeSettings;
  getDefaultSettings: () => BridgeSettings;
  updateSettings: (payload: Partial<BridgeSettings>) => { success: true; settings: BridgeSettings };
  resetSettings: () => { success: true; settings: BridgeSettings };
  detectSceneFeatures?: () => Promise<Record<string, boolean> | null>;
};

/**
 * Parse Cocos Creator semver string (e.g. "3.8.5") into numeric tuple.
 * Returns [major, minor, patch] or [0, 0, 0] on failure.
 */
function parseEditorVersion(raw: string): [number, number, number] {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(raw || '');
  if (!m) return [0, 0, 0];
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function gte(ver: [number, number, number], major: number, minor: number, patch = 0): boolean {
  if (ver[0] !== major) return ver[0] > major;
  if (ver[1] !== minor) return ver[1] > minor;
  return ver[2] >= patch;
}

export interface VersionCapabilities {
  editorVersion: string;
  versionTuple: [number, number, number];
  aiRulesVersion: number;
  supportedFeatures: Record<string, boolean>;
  versionTier: 'full' | 'supported' | 'best-effort' | 'unsupported';
  warnings: string[];
}

function detectCapabilities(editorVersion: string): VersionCapabilities {
  const ver = parseEditorVersion(editorVersion);
  const warnings: string[] = [];

  const features: Record<string, boolean> = {
    sceneScript: gte(ver, 3, 4),
    editorMessageRequest: gte(ver, 3, 4),
    editorProject: gte(ver, 3, 6),
    editorProfile: gte(ver, 3, 6),
    assetDbQueryAssets: gte(ver, 3, 4),
    assetDbImport: gte(ver, 3, 4),
    animationClip: gte(ver, 3, 4),
    physicsSystem2D: gte(ver, 3, 4),
    polygonCollider2D: gte(ver, 3, 4),
    extensionsDir: gte(ver, 3, 7),
    prefabEditMode: gte(ver, 3, 6),
    batchOperations: gte(ver, 3, 4),
    sceneSetProperty: gte(ver, 3, 4),
    buildWithConfig: gte(ver, 3, 6),
    previewControl: gte(ver, 3, 4),
    customScript: gte(ver, 3, 4),
    tweenAnimation: gte(ver, 3, 4),
    uiWidget: gte(ver, 3, 4),
    selectionApi: gte(ver, 3, 4),
    consoleCapture: gte(ver, 3, 6),
  };

  let versionTier: VersionCapabilities['versionTier'];
  if (gte(ver, 3, 8)) {
    versionTier = 'full';
  } else if (gte(ver, 3, 6)) {
    versionTier = 'supported';
  } else if (gte(ver, 3, 4)) {
    versionTier = 'best-effort';
    warnings.push('Cocos 3.4-3.5: Editor.Project API 可能缺失，部分面板功能受限');
  } else {
    versionTier = 'unsupported';
    warnings.push('Cocos < 3.4: 缺少必需的编辑器插件 API，大部分功能不可用');
  }

  if (!features.extensionsDir) {
    warnings.push('Cocos < 3.7: 扩展需安装到全局目录，install-global.js 已自动处理');
  }

  return {
    editorVersion,
    versionTuple: ver,
    aiRulesVersion: AI_RULES_VERSION,
    supportedFeatures: features,
    versionTier,
    warnings,
  };
}

export function registerServiceRoutes(get: RouteRegistrar, post: RouteRegistrar, deps: ServiceRouteDeps): void {
  get('/api/status', async () => {
    const editorVersion = Editor.App.version;
    const capabilities = detectCapabilities(editorVersion);

    if (deps.detectSceneFeatures) {
      try {
        const sceneFeatures = await deps.detectSceneFeatures();
        if (sceneFeatures) {
          capabilities.supportedFeatures = {
            ...capabilities.supportedFeatures,
            ...Object.fromEntries(
              Object.entries(sceneFeatures).map(([k, v]) => [`runtime_${k}`, v]),
            ),
          };
        }
      } catch {
        // Scene not ready yet — static detection only
      }
    }

    return {
      running: true,
      port: deps.getActivePort(),
      bridgeBase: deps.getBridgeBase(),
      uptime: Math.floor((Date.now() - deps.getStartTime()) / 1000),
      requestCount: deps.getRequestCount(),
      editorVersion,
      routeCount: deps.getRouteCount(),
      capabilities,
      mcp: {
        endpoint: deps.getActivePort() ? `http://127.0.0.1:${deps.getActivePort()}/mcp` : '',
        tokenRequired: true,
        rateLimitPerMinute: deps.getSettings().rateLimitPerMinute,
      },
    };
  });

  get('/api/routes', async () => ({ routes: deps.getRouteEntries() }));

  get('/api/mcp/connection-info', async (_params, _body, req?: IncomingMessage) => {
    const providedToken = req ? extractMcpToken(req) : '';
    const authenticated = providedToken === deps.getMcpToken();
    return {
      endpoint: deps.getActivePort() ? `http://127.0.0.1:${deps.getActivePort()}/mcp` : '',
      tokenHeader: 'X-MCP-Token',
      token: authenticated ? deps.getMcpToken() : '',
      protocol: 'jsonrpc-http',
      serverInfo: deps.getMcpHost()?.getServerInfo() || null,
    };
  });

  get('/api/editor/info', async () => ({
    editorVersion: Editor.App.version,
    editorPath: Editor.App.path,
    extensionName: 'aura-for-cocos',
  }));

  get('/api/settings', async () => ({
    settings: deps.getSettings(),
    defaults: deps.getDefaultSettings(),
  }));

  post('/api/settings', async (_params, body) => {
    const payload = (body && typeof body === 'object' ? body : {}) as Partial<BridgeSettings>;
    return deps.updateSettings(payload);
  });

  post('/api/settings/reset', async () => deps.resetSettings());
}
