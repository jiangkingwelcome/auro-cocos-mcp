# Compatibility

## Engine

| Version | Tier | Status | Notes |
|---------|------|--------|-------|
| Cocos Creator >= 3.8 | `full` | ✅ Full support | Primary development target; all features available |
| Cocos Creator 3.6 – 3.7 | `supported` | ✅ Supported | Tested; minor IPC name differences handled by fallbacks |
| Cocos Creator 3.4 – 3.5 | `best-effort` | ⚠️ Best-effort | Core features work; some advanced IPC may be unavailable. `package.json` declares `>=3.6` for Cocos Store compatibility |
| Cocos Creator < 3.4 | `unsupported` | ❌ Not supported | Missing `Editor.Panel.define()` and modern Node.js APIs required by the plugin |

> **Note for 3.7+**: Cocos Creator 3.7 and later only loads extensions from the **project's own** `extensions/` directory. The `install-global.js` script handles this automatically by creating a junction (Windows) or symlink (macOS/Linux) rather than copying files.

### Version Capabilities Matrix

The `bridge_status` tool returns a `capabilities` object with the following feature flags. Use this to decide which MCP actions are safe to call.

| Feature Flag | 3.6 | 3.7 | 3.8+ | Description |
|---|---|---|---|---|
| `sceneScript` | ✅ | ✅ | ✅ | `execute-scene-script` IPC |
| `editorMessageRequest` | ✅ | ✅ | ✅ | `Editor.Message.request` API |
| `editorProject` | ✅ | ✅ | ✅ | `Editor.Project.path` / `.name` |
| `editorProfile` | ✅ | ✅ | ✅ | `Editor.Profile.getConfig/setConfig` |
| `assetDbQueryAssets` | ✅ | ✅ | ✅ | `asset-db.query-assets` IPC |
| `assetDbImport` | ✅ | ✅ | ✅ | `asset-db.import-asset` IPC |
| `animationClip` | ✅ | ✅ | ✅ | `cc.AnimationClip` class |
| `physicsSystem2D` | ✅ | ✅ | ✅ | `cc.PhysicsSystem2D` class |
| `polygonCollider2D` | ✅ | ✅ | ✅ | `cc.PolygonCollider2D` class |
| `extensionsDir` | ❌ | ✅ | ✅ | Extensions loaded from project `extensions/` |
| `prefabEditMode` | ✅ | ✅ | ✅ | Prefab editing IPC |
| `buildWithConfig` | ✅ | ✅ | ✅ | Detailed build configuration |
| `consoleCapture` | ✅ | ✅ | ✅ | Console log capture and search |
| `selectionApi` | ✅ | ✅ | ✅ | `Editor.Selection` API |

### AI Rules Version

The `bridge_status` response includes `capabilities.aiRulesVersion` (integer). AI clients can compare this against their cached version to detect when behavioral rules have changed and tool descriptions need refreshing.

### Runtime Feature Detection

When a scene is open, the bridge also runs **runtime feature detection** via the scene script (`detectFeatures`). These appear as `runtime_*` keys in `capabilities.supportedFeatures` and reflect the actual `cc.*` classes available in the running engine (e.g., `runtime_tween`, `runtime_physicsSystem2D`).

### IPC Fallback System

The bridge includes a `safeEditorMsg` wrapper that automatically tries alternative IPC message names when the primary call fails. This handles known cross-version differences:

| Primary IPC | Fallback | Affected Versions |
|---|---|---|
| `scene.set-view-mode` | `scene.set-mode` | 3.6 |
| `scene.focus-all` | `scene.zoom-to-fit` | 3.6 |

---

## Operating Systems

| OS | Status | Notes |
|----|--------|-------|
| Windows 10/11 | ✅ Full support | Primary platform; packaging via `package-win.bat` |
| macOS (Intel & Apple Silicon) | ✅ Full support | Packaging via `package-mac.sh` |
| Linux | ⚠️ Best-effort | Node.js code is cross-platform; no official packaging script yet |

---

## MCP Clients

| Client | Transport | Status | Config format | Config template |
|--------|-----------|--------|---------------|----------------|
| **Cursor** | HTTP | ✅ Full support | JSON | `mcp-config-templates/cursor-http.example.json` |
| **Windsurf** | HTTP | ✅ Full support | JSON | Same as Cursor HTTP template |
| **Claude Desktop** | stdio (via shim) | ✅ Supported | JSON | `mcp-config-templates/claude-desktop-stdio.example.json` |
| **Trae** | stdio (via shim) | ✅ Supported | JSON | Auto-configured via panel |
| **Kiro** | stdio (via shim) | ✅ Supported | JSON | Auto-configured via panel |
| **Antigravity** | stdio (via shim) | ✅ Supported | JSON | Auto-configured via panel |
| **Gemini CLI** | stdio (via shim) | ✅ Supported | JSON | Auto-configured via panel (`~/.gemini/settings.json`) |
| **OpenAI Codex** | stdio (via shim) | ✅ Supported | TOML | `mcp-config-templates/codex-stdio.example.toml` |
| **Claude Code** | stdio (via shim) | ✅ Supported | CLI | Auto-configured via panel (`claude mcp add`) |
| **CodeBuddy (腾讯)** | stdio (via shim) | ✅ Supported | JSON | Auto-configured via panel |
| **Comate (百度)** | stdio (via shim) | ✅ Supported | JSON | Auto-configured via panel (`~/.baidu-comate/mcp.json`) |
| VS Code (Copilot, 通义灵码, etc.) | HTTP | ⚠️ Manual config | JSON | Use `.vscode/mcp.json` with HTTP endpoint and token |
| Any MCP 2025-spec client | HTTP or stdio | ✅ Compatible | — | JSON-Lines framing auto-detected by the stdio shim |
| Any legacy MCP client | stdio | ✅ Compatible | — | Content-Length framing auto-detected by the stdio shim |

### Claude Desktop — stdio details

Claude Desktop does not support the HTTP MCP transport natively. Use the bundled stdio shim:

```json
{
  "mcpServers": {
    "aura-cocos": {
      "command": "node",
      "args": ["<absolute-path>/stdio-shim/mcp-stdio-shim.cjs"]
    }
  }
}
```

The shim auto-discovers the running bridge on the local ports and forwards all JSON-RPC traffic. See `mcp-config-templates/claude-desktop-stdio.example.json` for a full example.

### OpenAI Codex — TOML details

Codex uses TOML format for configuration at `~/.codex/config.toml`:

```toml
[mcp_servers.aura-cocos]
command = "node"
args = ["<absolute-path>/stdio-shim/mcp-stdio-shim.cjs"]

[mcp_servers.aura-cocos.env]
COCOS_BRIDGE_PORT = "7779"
```

See `mcp-config-templates/codex-stdio.example.toml` for a ready-to-copy template.

### Claude Code — CLI details

Claude Code uses a CLI command to register MCP servers:

```bash
claude mcp add aura-cocos -e COCOS_BRIDGE_PORT=7779 -- node "<absolute-path>/stdio-shim/mcp-stdio-shim.cjs"
```

### VS Code plugins (Copilot, 通义灵码, Gemini Code Assist)

These plugins share VS Code's standard MCP configuration. Add to `.vscode/mcp.json` in your project:

```json
{
  "mcpServers": {
    "aura-cocos": {
      "command": "node",
      "args": ["<absolute-path>/stdio-shim/mcp-stdio-shim.cjs"],
      "env": {
        "COCOS_BRIDGE_PORT": "7779"
      }
    }
  }
}
```

---

## Transport

| Transport | Endpoint | Authentication |
|-----------|----------|----------------|
| HTTP MCP | `http://127.0.0.1:<port>/mcp` | `X-MCP-Token: <token>` header |
| stdio shim | `stdio-shim/mcp-stdio-shim.cjs` | Token forwarded automatically via discovery |

### Port

The bridge binds to a fixed port (default `7779`). Set `COCOS_MCP_PORT` environment variable to use a different port.

> Only one Cocos project can use Aura at a time on the same port. If the port is occupied, the service will fail to start with a clear error message.

The active endpoint and token are always available at:
```
http://127.0.0.1:<port>/api/mcp/connection-info
```

---

## Security baseline

All security settings below are **user-configurable** from the plugin panel's **Settings** tab. Changes are persisted to `<extension-root>/.mcp-settings.json`.

| Feature | Default | Configurable | Notes |
|---------|---------|-------------|-------|
| Binding | `127.0.0.1` loopback only | Yes (ON/OFF) | When OFF, binds to `0.0.0.0` — use with caution |
| Authentication | 24-byte random token | No | Required for `/mcp` endpoint, stored in `.mcp-token` |
| Rate limit | 240 req/min | Yes (10–10,000) | Also overridable via `COCOS_MCP_RATE_LIMIT` env var |
| Request timeout | 20 seconds | Via env var | `COCOS_MCP_TIMEOUT_MS` |
| Max request body | 1 MB | Yes (64 KB – 50 MB) | — |
| Auto rollback | Enabled | Yes (ON/OFF) | Atomic operations auto-cleanup on failure |
| CORS | Localhost origins only | No | — |
