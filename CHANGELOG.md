# Changelog

All notable changes to this project are documented in this file.

---

## 1.0.14 — 2026-03-17

### Fixed
- **Panel loading optimization**: Deferred loading heavy CSS definitions by injecting them via script to reduce panel layout blocking, while keeping only critical structural styling in the raw HTML template.

---

## 1.0.13 — 2026-03-17

### Fixed
- **Panel flash optimization**: Further refined the white flash fix by adding a `style` tag with `:host,:root,html,body{background:#0a0a14!important}` directly to the raw Panel template html. Ensures zero flash regardless of loading sequence.

---

## 1.0.12 — 2026-03-17

### Fixed
- **Build obfuscation**: Fixed an issue where the `esbuild` dead-code injection caused `javascript-obfuscator` to fail with `ReferenceError: load is not defined` on scene execution.
- **Panel flash**: Eliminated the brief white flash that could occur before CSS loading in dark mode by applying a default `:host` background directly in the `<style>`.

### Changed
- **ensure_2d_canvas guardrail**: AI is now strictly required to ask the user (`confirmCreateCanvas`) before automatically generating a Canvas and Camera for 2D UI rendering in an empty 3D scene.

---

## 1.0.11 — 2026-03-17

### Added
- **Panel i18n**: Community/Pro badge and license information (edition, status, expiry) now fully localized in Chinese and English.
- **Brand icon**: Header logo replaced with the actual Aura brand icon (64×64 PNG, base64-inlined) — fills the entire logo container for clear brand visibility.

### Fixed
- **Tab scroll reset**: Switching between tabs no longer preserves the scroll position from the previous tab; content always starts from the top.
- **License badge**: Badge now correctly displays Pro/Community/Enterprise regardless of whether the MCP service is running (previously only updated when service was online).

### Changed
- **Header simplified**: Removed "for Cocos" subtitle from the header — now displays only "Aura" alongside the brand icon and edition badge.

---

## 1.0.10 — 2026-03-15

### Added
- **Pro Edition (Rust .node binary)**: Full Rust native module with all CE actions rewritten + Pro-exclusive tools. Dual-track architecture where Pro mode bypasses all JS tools.
- **License system**: Offline HMAC-SHA256 license verification with panel UI activation.
- **animation_tool**: 10 actions — create_clip, play, pause, resume, stop, get_state, list_clips, set_current_time, set_speed, crossfade.
- **physics_tool**: 10 actions — colliders, rigidbodies, joints, world configuration, raycast, debug drawing.
- **tool_management**: 4 actions — list_all, enable, disable, get_stats. Dynamically enable/disable tools to reduce token overhead.
- **New IDE support**: Gemini CLI, OpenAI Codex, Claude Code, CodeBuddy, Comate (total: 11 IDEs).
- **TOML/CLI configuration**: Auto-config for Codex (TOML) and Claude Code (CLI).
- **Panel i18n**: Chinese/English bilingual switcher.
- **Panel Guide tab**: Quick-start guide, prompt examples, and usage tips (total: 5 tabs).
- **Panel version display**: Version number shown in footer.

### Changed
- **preferences**: 3 → 7 actions (added get_global, set_global, get_project, set_project with scope awareness).
- **broadcast**: 3 → 5 actions (added send for custom messages, send_ipc for raw Editor IPC).
- **engine_action**: 4 → 8 actions (Pro only; added get_render_stats, set_physics_debug, get_engine_config).
- **reference_image**: 2 → 7 actions (Pro only; added set_opacity, set_position, set_scale, toggle_visibility, get_status).
- **scene_query**: Added 12 new CE actions (deep_validate_scene, get_node_bounds, find_nodes_by_layer, get_animation_state, get_collider_info, get_material_info, get_light_info, get_scene_environment, screen_to_world, world_to_screen, check_script_ready, get_script_properties). Total: 43.
- **COMPATIBILITY.md**: Added 3.4–3.5 best-effort tier to match >=3.4.2 product support.
- **Documentation sync**: Unified tool/action counts across TOOLS_REFERENCE.md, README.md, COMPETITIVE_ANALYSIS.md, COMPATIBILITY.md, and CHANGELOG.md.
- **Rebrand**: Product renamed from "Cocos MCP Bridge" to **Aura** (`aura-for-cocos`). MCP server identifier changed from `cocos-bridge-ai-mcp` to `aura-cocos`. Registry file changed from `.cocos-mcp-ports.json` to `.aura-ports.json`.

---

## 1.0.9 — 2026-03-07

### Added
- **AI behavioral rules**: Enforced 5 mandatory rules (query-before-modify, use-UUIDs, check-errors, confirm-destructive, batch-when-possible) appended to all core tools via `AI_RULES` constant in `tools-shared.ts`.
- **Parameter constraint upgrade**: 167 `.describe()` annotations (up from ~8), 22 `z.enum()` constraints, 28 `min/max/int` numeric constraints, 0 remaining `z.any()` (down from 12).
- **New `scene_operation` parameters**:
  - `siblingIndex` for `create_node` — control insertion position (0=first, -1=append).
  - `includeChildren` for `duplicate_node` — duplicate node with or without children (default: true).
- **New tools**:
  - `engine_action` — 4 actions: set_frame_rate, pause/resume_engine, get_system_info, dump_texture_cache.
  - `preferences` — 3 actions: get/set/list editor preferences.
  - `broadcast` — 3 actions: poll/history/clear editor event messages.
  - `reference_image` — 2 actions: set/clear scene reference image overlay.
  - `register_custom_macro` — register dynamic macro tools at runtime.
  - `create_tween_animation_atomic` — create animation clips with keyframe tracks.
  - `auto_fit_physics_collider` — auto-fit 2D colliders to sprite bounds or alpha outline.
- **New `scene_operation` actions**: `setup_particle`, `align_nodes`, `audio_setup`, `setup_physics_world`, `create_skeleton_node`, `generate_tilemap`, `create_primitive`, `set_camera_look_at`.
- **New `scene_query` actions**: `list_all_scenes`, `validate_scene`, `detect_2d_3d`, `list_available_components`, `measure_distance`, `scene_snapshot`, `scene_diff`, `performance_audit`, `export_scene_json`.
- **New `asset_operation` actions**: `validate_asset`, `export_asset_manifest`, `create_material`, `generate_script`.
- **New `editor_action` actions**: `show_notification`, `move_scene_camera`, `take_scene_screenshot`, `set_transform_tool`, `set_coordinate`, `toggle_grid`, `toggle_snap`, `get_console_logs`, `search_logs`.
- **Operational guidance**: `create_node` and `add_component` descriptions include step-by-step "HOW TO USE" instructions.
- **`logType` enum**: Added `info` filter option (now: all/log/warn/error/info).

### Changed
- **Tool count**: 6 → **13** tools, **103 → 160+** total actions.
- **Documentation**: Complete rewrite of `docs/TOOLS_REFERENCE.md`, updated `CHANGELOG.md`, `README.md`, and `docs/COMPETITIVE_ANALYSIS.md` to reflect current capabilities.

### Technical
- `z.toJSONSchema()` confirmed to auto-generate JSON Schema `required` arrays from non-optional Zod fields.
- All modifications verified with `tsc --noEmit` (zero errors).

---

## 1.0.8 — 2026-03-03

### Added
- **Context-aware tools**: `scene_query.get_current_selection` and `scene_query.get_active_scene_focus` — AI can operate directly on the current editor selection without needing a UUID.
- **Guardrails & self-healing**: Dangerous actions (`destroy_node`, `clear_children`) require explicit `confirmDangerous=true`. Component name typos are auto-corrected (`sprite` → `Sprite`, `scrollview` → `ScrollView`, etc.). Error responses include actionable suggestions for quick AI recovery.
- **Macro atomic tools**:
  - `create_prefab_atomic` — one call to create a node tree, add components, save `.prefab`, refresh AssetDB, and auto-rollback on failure.
  - `import_and_apply_texture` — one call to import an external image and apply it to a Sprite (selection-aware, with fallback warnings).
  - `setup_ui_layout` — one call to scaffold a full ScrollView / Viewport / Content / Items hierarchy.
- **Visual feedback**: Bridge auto-selects affected nodes and logs highlighted output in the editor console after successful scene write operations.
- **Test infrastructure**: 191 automated unit tests across 8 test files (83 % statement coverage). Dual-tsconfig isolation ensures test code never enters `dist/`. Coverage thresholds enforced via Vitest.
- **Code quality tooling**: ESLint (`eslint.config.mjs`) and Prettier (`.prettierrc`) configured; `npm run ci` runs the full typecheck → lint → coverage pipeline.

---

## 1.0.7 — 2026-02

### Added
- **Path normalization**: `normalizeDbUrl` and `normalizeComponentName` auto-correct common AI casing mistakes in `db://` asset paths (`Prefabs` → `prefabs`, `Scripts` → `scripts`, etc.). Applied automatically to all tool parameters.
- **Atomic prefab rollback**: If any stage of prefab creation fails, temporary scene nodes are automatically removed.

### Fixed
- Action count statistics now correctly computed from Zod enum schema rather than accumulated counters; removed misleading "total requests" display in the panel.

---

## 1.0.6 — 2026-01

### Fixed
- `inputSchema` generation switched to `z.toJSONSchema()` for standards-compliant JSON Schema output; resolves schema validation errors in some MCP clients.
- stdio shim now auto-retries with token re-discovery when the host returns a token rejection error.
- IDE configuration detection changed to content-based checks (inspects file contents for `cocos-bridge`) rather than mere file existence; eliminates false-positive "configured" status.

### Changed
- MCP server identifier standardised to `cocos-bridge-ai-mcp` in all injected IDE configurations for consistent cross-IDE recognition.

---

## 1.0.5 — 2025-12

### Added
- **101 concrete actions** across 6 macro tools: `scene_query` (22 actions), `scene_operation` (25 actions), `asset_operation` (25 actions), `editor_action` (30 actions).
- Status panel now shows live **connection count**, **tool count**, and **total action count** statistics.
- **stdio shim dual-protocol support**: auto-detects framing format from the first bytes of stdin — JSON-Lines (MCP 2025 spec) or Content-Length headers (legacy spec) — enabling compatibility with both current and older MCP clients.

---

## 1.0.4 — 2025-11

### Changed
- **Major MCP architecture refactor**: consolidated into 6 macro tools with nested `action` enums, replacing the previous flat tool-per-operation design. Reduces the tool list from 100+ items to 6, improving AI context window efficiency.

---

## 1.0.3 — 2025-10

### Added
- One-click IDE configuration support for **Trae**, **Kiro**, and **Antigravity** (in addition to Cursor and Windsurf).

### Changed
- IDE configuration cards in the panel changed from a horizontal grid to a vertical list for better readability.

---

## 1.0.2 — 2025-09

### Added
- Status panel now displays **project name**, **project path**, and **Cocos Engine version** (replaces the token display field).
- Multi-IDE configuration detection: simultaneous status for Cursor, Windsurf, Claude, Trae, Kiro, and Antigravity.
- Tool count telemetry shown in the panel footer.

---

## 1.0.1 — 2025-08

### Added
- Completely redesigned MCP control panel with a minimal VS Code-inspired dark-mode layout.

### Fixed
- `shadowRoot` undefined crash in Cocos Creator when the panel first attaches to the DOM.

---

## 1.0.0 — 2025-07

### Added
- Initial standalone release of Cocos MCP Bridge.
- In-process MCP host at `http://127.0.0.1:<port>/mcp` — no dependency on any external backend service.
- stdio compatibility shim (`stdio-shim/mcp-stdio-shim.cjs`) for MCP clients that only support stdio transport.
- Local security baseline: loopback-only binding, X-MCP-Token authentication, rate limiting (240 req/min), request timeout (20 s), request body limit (1 MB).
- Cross-platform packaging scripts for Windows (`package-win.bat`) and macOS (`package-mac.sh`).
- `install-global.js` for registering the plugin to one or more Cocos Creator projects via junction/symlink.
