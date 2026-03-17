# Troubleshooting Guide

Common issues and their solutions when using Aura.

---

## Table of Contents

1. [Bridge service will not start](#1-bridge-service-will-not-start)
2. [IDE cannot connect to the bridge](#2-ide-cannot-connect-to-the-bridge)
3. [Token authentication errors](#3-token-authentication-errors)
4. [Port conflict — all candidate ports are busy](#4-port-conflict--all-candidate-ports-are-busy)
5. [Tool returns "场景未加载" (scene not loaded)](#5-tool-returns-场景未加载-scene-not-loaded)
6. [Component not found errors](#6-component-not-found-errors)
7. [stdio shim disconnects after Cocos restart](#7-stdio-shim-disconnects-after-cocos-restart)
8. [Asset path errors / asset not found](#8-asset-path-errors--asset-not-found)
9. [IDE configuration not detected](#9-ide-configuration-not-detected)
10. [Build or package fails](#10-build-or-package-fails)

---

## 1. Bridge service will not start

**Symptoms**: The "Aura" menu item is missing, or the panel shows "service stopped".

**Causes and solutions**

| Cause | Solution |
|-------|----------|
| Plugin not installed / not symlinked | Run `npm run install:global -- --project "D:/YourProject"` and re-open Cocos Creator |
| Build not up to date | Run `npm run build` then reload the plugin from the panel |
| Another process holds all ports (7779–7782, 4779–4780) | See [§4 Port conflict](#4-port-conflict--all-candidate-ports-are-busy) |
| TypeScript compilation error | Check the Cocos Creator console for red stack traces; run `npm run typecheck` |

**Quick check**

```bash
# After opening Cocos Creator, verify the service is alive:
npm run verify
```

---

## 2. IDE cannot connect to the bridge

**Symptoms**: Cursor / Claude shows "connection refused", `bridge_status` call times out.

**Step-by-step diagnosis**

1. Confirm the bridge is running — open the **Aura** panel inside Cocos Creator and verify the status shows **Running**.

2. Check which port the service is on:
   ```bash
   # Windows
   type %USERPROFILE%\.aura-ports.json

   # macOS / Linux
   cat ~/.aura-ports.json
   ```

3. Try the endpoint directly:
   ```bash
   curl http://127.0.0.1:7779/api/mcp/connection-info
   ```
   You should receive `{ "endpoint": "...", "token": "..." }`.

4. Verify your MCP client config uses the correct port. The default template uses `7779`; if that port was taken, the bridge may have bound to `7780` or later. Copy the actual endpoint from step 3 into your IDE config.

5. If using **stdio shim** mode, ensure the shim path in your MCP client config is correct:
   ```
   .../aura-for-cocos/stdio-shim/mcp-stdio-shim.cjs
   ```

---

## 3. Token authentication errors

**Symptoms**: API returns `401 Unauthorized` or `403 Forbidden`.

**Causes and solutions**

| Cause | Solution |
|-------|----------|
| Token in IDE config is stale | Open the panel → copy the current token → update `mcp.json` in your IDE |
| Token file deleted | Restart the bridge — it generates a new token automatically |
| Wrong header name | Use `X-MCP-Token: <token>` (not `Authorization: Bearer`) for HTTP transport |
| Environment variable overrides token | Check if `COCOS_MCP_TOKEN` is set in your shell; unset it to use the auto-generated token |

**One-click fix**

Use the **IDE auto-configure** button in the Aura panel. It reads the current token and writes it into your IDE's MCP config automatically.

---

## 4. Port conflict — all candidate ports are busy

**Symptoms**: Bridge fails to start; log shows "All candidate ports in use".

**Default port candidates**: `7779, 7780, 7781, 7782, 4779, 4780`

**Solutions**

Option A — Free a port:
```bash
# Windows: find what is using port 7779
netstat -ano | findstr :7779
taskkill /PID <pid> /F

# macOS / Linux
lsof -i :7779
kill -9 <pid>
```

Option B — Use a custom port by setting the environment variable before starting Cocos Creator:
```bash
# Windows
set COCOS_BRIDGE_PORT=9000

# macOS / Linux
export COCOS_BRIDGE_PORT=9000
```
Then update your IDE config to use port `9000`.

---

## 5. Tool returns "场景未加载" (scene not loaded)

**Symptoms**: `scene_query` or `scene_operation` returns `{ "error": "场景未加载" }` or `{ "error": "没有打开的场景" }`.

**Causes and solutions**

| Cause | Solution |
|-------|----------|
| No scene is open in Cocos Creator | Open a scene (double-click a `.scene` file in the Assets panel) |
| Scene is loading / transitioning | Wait a moment and retry |
| The wrong Cocos project is open | Verify the project shown in the Bridge panel matches your target project |

**Tip**: Call `bridge_status` first — the `projectName` and `projectPath` fields confirm which project the bridge is connected to.

---

## 6. Component not found errors

**Symptoms**: `scene_operation.add_component` returns `{ "error": "未找到组件类: <name>" }`.

**Causes and solutions**

| Cause | Solution |
|-------|----------|
| Typo in component name | The bridge auto-corrects known names (`sprite` → `Sprite`). If the error persists, check the suggestion list in the error response. |
| Third-party or custom component | Use the exact class name as registered with `cc.Class`. Check your script with `js.getClassByName('YourClass')` via `execute_script`. |
| Component not included in the build | Ensure the script is imported somewhere in the project so Cocos registers it. |

**Auto-corrected names** (you can use any casing):
`Sprite` · `Label` · `Button` · `Layout` · `ScrollView` · `UITransform` · `Mask` · `RichText` · `EditBox` · `Toggle` · `Slider` · `ProgressBar`

---

## 7. stdio shim disconnects after Cocos restart

**Symptoms**: After restarting Cocos Creator or the bridge service, the IDE MCP connection becomes silent (requests time out instead of failing fast).

**Cause**: The stdio shim discovered the old endpoint/token and cached them. When the bridge restarts on a new port or with a new token, the cached values are invalid.

**Solutions**

Option A — Restart the IDE or reload the MCP connection. The shim will re-run discovery automatically on the next request.

Option B — Set explicit environment variables so the shim always knows where to connect:
```json
{
  "mcpServers": {
    "cocos-creator-bridge": {
      "command": "node",
      "args": ["...path.../stdio-shim/mcp-stdio-shim.cjs"],
      "env": {
        "COCOS_MCP_ENDPOINT": "http://127.0.0.1:7779/mcp",
        "COCOS_MCP_TOKEN": "<your-token>"
      }
    }
  }
}
```
Get the current endpoint and token from: `http://127.0.0.1:7779/api/mcp/connection-info`

Option C — Enable the shim log to diagnose what is happening:
```bash
# The shim writes to:
# Windows: %USERPROFILE%\.aura-shim.log
# macOS:   ~/.aura-shim.log
```

---

## 8. Asset path errors / asset not found

**Symptoms**: `asset_operation` returns `{ "error": "资源不存在" }` or similar.

**Common mistakes and fixes**

| Mistake | Correct form |
|---------|-------------|
| `db://Assets/textures/icon.png` | `db://assets/textures/icon.png` (lowercase `assets`) |
| `db://assets/Textures/icon.png` | `db://assets/textures/icon.png` |
| `db://assets/Prefabs/hero.prefab` | `db://assets/prefabs/hero.prefab` |
| File extension mismatch | Use `.prefab` not `.Prefab`; `.scene` not `.Scene` |

**Note**: The bridge auto-normalizes the most common directory casing mistakes. If you still get "asset not found", double-check the path in Cocos Creator's **Assets** panel.

**Check if an asset exists**:
```json
{ "tool": "asset_operation", "arguments": { "action": "info", "url": "db://assets/textures/icon.png" } }
```

---

## 9. IDE configuration not detected

**Symptoms**: The Bridge panel shows ✗ for your IDE even though you have configured it.

**Cause**: The detection checks that the MCP config file contains `cocos-bridge` as a server key — not just that the file exists.

**Fix**

Use the **"一键配置"** (one-click configure) button next to your IDE in the panel. It writes the correct config automatically.

Alternatively, verify your `mcp.json` manually:
```json
{
  "mcpServers": {
    "aura-cocos": {   ← must contain this key
      "transport": "http",
      "url": "http://127.0.0.1:7779/mcp",
      "headers": { "X-MCP-Token": "<token>" }
    }
  }
}
```

After updating the file, restart the IDE for the changes to take effect.

---

## 10. Build or package fails

**Symptoms**: `npm run package:win` or `npm run package:mac` errors out.

**Common causes**

| Cause | Solution |
|-------|----------|
| `dist/` is out of date | Run `npm run build` before packaging |
| Missing `node_modules` | Run `npm install` |
| On Windows, `7-Zip` not found | Install 7-Zip and ensure `7z.exe` is in your PATH |
| On macOS, `zip` not found | It ships with macOS; if missing, install via `brew install zip` |
| TypeScript errors | Run `npm run typecheck` to see type errors before building |

---

## Diagnostic commands

```bash
# 1. Verify service is running and reachable
npm run verify

# 2. Full CI check (typecheck + lint + tests)
npm run ci

# 3. View shim log (real-time)
# Windows:
Get-Content $HOME\.aura-shim.log -Wait -Tail 20

# macOS / Linux:
tail -f ~/.aura-shim.log

# 4. Check registered port cache
# Windows:
type %USERPROFILE%\.aura-ports.json

# macOS / Linux:
cat ~/.aura-ports.json

# 5. Test the connection endpoint directly
curl http://127.0.0.1:7779/api/mcp/connection-info
```

---

## Still stuck?

Open an issue at: **https://github.com/jiangkingwelcome/aura-for-cocos/issues**

Please include:
- Cocos Creator version
- OS and Node.js version (`node -v`)
- Contents of `~/.aura-shim.log` (if using stdio mode)
- The exact error message
