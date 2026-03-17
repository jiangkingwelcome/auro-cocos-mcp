import { LocalToolServer, errorMessage } from './local-tool-server';
import {
  type BridgeToolContext,
  normalizeComponentName,
  normalizeDbUrl,
  normalizeParams,
} from './tools-shared';
import { tryRegisterProTools, isProLoaded, getProLicenseStatus } from './tools-pro-bridge';

// Community Edition JS tools (frozen, open source)
import { registerSceneTools } from './tools-scene';
import { registerAssetTools } from './tools-asset';
import { registerEditorTools } from './tools-editor';
import { registerMiscTools } from './tools-misc';
import { registerAtomicTools } from './tools-atomic';
import { registerScriptTools } from './tools-script';
import { registerAnimationTools } from './tools-animation';
import { registerPhysicsTools } from './tools-physics';

export type { BridgeToolContext };

/**
 * Build the MCP tool server.
 *
 * Two mutually exclusive modes:
 *
 *   Pro Edition (Rust .node detected + valid license):
 *     ALL tools are provided by the Rust native module.
 *     JS community tools are NOT registered — Rust replaces them entirely.
 *     All new features are developed in Rust only.
 *
 *   Community Edition (no .node or no license):
 *     JS community tools are registered (~158 actions).
 *     Frozen codebase — bug fixes only, no new features.
 *     Open source on GitHub (BSL 1.1).
 */
export function buildCocosToolServer(ctx: BridgeToolContext): LocalToolServer {
  const server = new LocalToolServer();
  const { bridgeGet, text } = ctx;

  // bridge_status is always available (registered by either path)
  server.tool('bridge_status', `Check the Cocos Creator MCP bridge connection status, editor version, capabilities, and environment info.
ALWAYS call this first to verify the bridge is alive and check version capabilities before performing other operations.
Returns: {connected:true, editorVersion, capabilities:{versionTier, supportedFeatures:{...}, aiRulesVersion, warnings}, uptime, port} on success.
capabilities.versionTier: "full" (>=3.8), "supported" (3.6-3.7), "best-effort" (3.4-3.5), "unsupported" (<3.4).
capabilities.supportedFeatures: boolean map of available APIs — check before calling version-dependent features.
capabilities.aiRulesVersion: current AI Rules version for cache invalidation.`, {}, async () => {
    try {
      const status = await bridgeGet('/api/status');
      const licenseStatus = getProLicenseStatus();
      const edition = licenseStatus.licenseValid ? (licenseStatus.edition || 'pro') : 'community';
      return text({
        connected: true,
        edition,
        proInstalled: licenseStatus.proInstalled,
        ...(status as Record<string, unknown>),
      });
    } catch (err: unknown) {
      return text({ connected: false, error: errorMessage(err) }, true);
    }
  });

  // ── Try Pro Edition (Rust native module) ──
  // If loaded, Rust provides ALL tools — JS tools are skipped entirely.
  const proLoaded = tryRegisterProTools(server, ctx);

  if (proLoaded) {
    console.log('[MCP] Pro Edition active — all tools provided by native module');
    return server;
  }

  // ── Community Edition (JS, open source, frozen) ──
  console.log('[MCP] Community Edition — JS tools registered');
  registerSceneTools(server, ctx);
  registerAssetTools(server, ctx);
  registerEditorTools(server, ctx);
  registerMiscTools(server, ctx);
  registerAtomicTools(server, ctx);
  registerScriptTools(server, ctx);
  registerAnimationTools(server, ctx);
  registerPhysicsTools(server, ctx);

  return server;
}

export { normalizeComponentName, normalizeDbUrl, normalizeParams };
