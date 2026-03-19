import { z } from 'zod';
import { LocalToolServer } from './local-tool-server';
import type { BridgeToolContext } from './tools-shared';
import { toInputSchema, errorMessage, AI_RULES, validateRequiredParams } from './tools-shared';

export function registerEditorTools(server: LocalToolServer, ctx: BridgeToolContext): void {
  const { bridgeGet, bridgePost, editorMsg, text } = ctx;

  // editor_action (24 actions — Community Edition)
  server.tool(
    'editor_action',
    `Control the Cocos Creator editor environment (non-scene operations).

Actions & required parameters:
- save_scene: no params. Save current scene silently.
- open_scene: uuid(optional) or url(optional). Open a scene by UUID or db:// URL.
- new_scene: no params. Create a new empty scene.
- undo: no params. Undo last operation.
- redo: no params. Redo last undone operation.
- project_info: no params. Get project name, path, engine version.
- build: platform(optional). Start project build.
- preview: no params. Open preview in browser.
- preview_refresh: no params. Refresh preview.
- focus_node: uuid(REQUIRED). Focus editor camera on a node.
- log/warn/error: text(REQUIRED). Write message to console.
- clear_console: no params. Clear console output.
- play_in_editor: no params. Enter play/preview mode.
- show_notification: text(REQUIRED), title(optional). Show editor notification dialog.
- build_query: no params. Get build configuration and available platforms.
- change_gizmo_tool: tool(REQUIRED, "position"|"rotation"|"scale"|"rect"). Switch Gizmo tool.
- query_gizmo_tool_name: no params. Get current Gizmo tool name.
- change_gizmo_pivot: pivot(REQUIRED, "center"|"pivot"). Switch transform pivot.
- query_gizmo_pivot: no params. Get current Gizmo pivot name.
- change_gizmo_coordinate: coordinate(REQUIRED, "local"|"world"). Switch coordinate system.
- query_gizmo_coordinate: no params. Get current coordinate system name.
- change_is2D: is2D(REQUIRED, boolean). Switch 2D/3D view mode.
- query_is2D: no params. Get current 2D/3D view mode.
- set_grid_visible: visible(REQUIRED, boolean). Show/hide scene grid.
- query_is_grid_visible: no params. Get grid visibility state.
- set_icon_gizmo_3d: is3D(REQUIRED, boolean). Set IconGizmo 3D/2D mode.
- query_is_icon_gizmo_3d: no params. Get IconGizmo 3D mode state.
- set_icon_gizmo_size: size(REQUIRED, number). Set IconGizmo size.
- query_icon_gizmo_size: no params. Get IconGizmo size.
- align_node_with_view: no params. Apply scene camera position/rotation to selected node.
- align_view_with_node: no params. Apply selected node position/rotation to scene camera.
- soft_reload: no params. Soft-reload the current scene.
- query_dirty: no params. Check if current scene has unsaved changes. Returns {dirty:boolean}.
- snapshot: no params. Snapshot current scene state for undo.
- snapshot_abort: no params. Abort current snapshot.
- cancel_recording: no params. Cancel current undo recording.

Returns: save_scene→{success}. query_dirty→{dirty:boolean}. query_*→value. On error: {error:"message"}.
Prerequisites: build requires scene to be saved first (call save_scene).` + AI_RULES,
    toInputSchema({
      action: z.enum([
        // Scene lifecycle
        'save_scene', 'open_scene', 'new_scene', 'undo', 'redo',
        // Project
        'project_info',
        // Preview
        'preview', 'preview_refresh',
        // Build
        'build', 'build_query',
        // Play
        'play_in_editor',
        // Misc
        'focus_node', 'log', 'warn', 'error', 'clear_console', 'show_notification',
        // Gizmo
        'change_gizmo_tool', 'query_gizmo_tool_name',
        'change_gizmo_pivot', 'query_gizmo_pivot',
        'change_gizmo_coordinate', 'query_gizmo_coordinate',
        // View
        'change_is2D', 'query_is2D',
        'set_grid_visible', 'query_is_grid_visible',
        'set_icon_gizmo_3d', 'query_is_icon_gizmo_3d',
        'set_icon_gizmo_size', 'query_icon_gizmo_size',
        // Camera align
        'align_node_with_view', 'align_view_with_node',
        // Scene management
        'soft_reload', 'query_dirty',
        // Undo system
        'snapshot', 'snapshot_abort', 'cancel_recording',
      ]).describe('Editor action to perform. See tool description for required parameters per action.'),
      uuid: z.string().optional().describe(
        'Node or asset UUID. REQUIRED for: focus_node. Optional for: open_scene.'
      ),
      url: z.string().optional().describe(
        'Asset db:// URL. Optional for: open_scene (open scene by db:// URL).'
      ),
      platform: z.enum(['web-mobile', 'web-desktop', 'android', 'ios', 'mac', 'windows', 'wechatgame']).optional().describe(
        'Target build platform. Used by: build.'
      ),
      text: z.string().optional().describe(
        'Text content. REQUIRED for: log, warn, error, show_notification.'
      ),
      title: z.string().optional().describe(
        'Notification dialog title. Optional for: show_notification. Default: "AI Assistant".'
      ),
      force: z.boolean().optional().describe(
        'For save_scene: force save even if scene has never been saved.'
      ),
      tool: z.enum(['position', 'rotation', 'scale', 'rect']).optional().describe(
        'Gizmo tool type. REQUIRED for: change_gizmo_tool.'
      ),
      pivot: z.enum(['center', 'pivot']).optional().describe(
        'Transform pivot. REQUIRED for: change_gizmo_pivot.'
      ),
      coordinate: z.enum(['local', 'world']).optional().describe(
        'Coordinate system. REQUIRED for: change_gizmo_coordinate.'
      ),
      is2D: z.boolean().optional().describe(
        'Whether to use 2D view. REQUIRED for: change_is2D.'
      ),
      visible: z.boolean().optional().describe(
        'Grid visibility. REQUIRED for: set_grid_visible.'
      ),
      is3D: z.boolean().optional().describe(
        'IconGizmo 3D mode. REQUIRED for: set_icon_gizmo_3d.'
      ),
      size: z.number().optional().describe(
        'IconGizmo size. REQUIRED for: set_icon_gizmo_size.'
      ),
    }),
    async (params) => {
      try {
        const p = params as Record<string, unknown>;
        const _paramErr = validateRequiredParams('editor_action', String(p.action), p);
        if (_paramErr) return text({ error: _paramErr }, true);
        switch (p.action) {
          case 'save_scene': return text(await bridgePost('/api/editor/save-scene', { force: p.force }));
          case 'open_scene': return text(await bridgePost('/api/editor/open-scene', { uuid: p.uuid, url: p.url }));
          case 'new_scene': return text(await bridgePost('/api/scene/new-scene'));
          case 'undo': return text(await bridgePost('/api/editor/undo'));
          case 'redo': return text(await bridgePost('/api/editor/redo'));
          case 'project_info': return text(await bridgeGet('/api/editor/project-info'));
          case 'build': return text(await bridgePost('/api/builder/build', { platform: p.platform }));
          case 'preview': return text(await bridgePost('/api/preview/open'));
          case 'preview_refresh': return text(await bridgePost('/api/preview/refresh'));
          case 'log': return text(await bridgePost('/api/console/log', { text: p.text }));
          case 'warn': return text(await bridgePost('/api/console/warn', { text: p.text }));
          case 'error': return text(await bridgePost('/api/console/error', { text: p.text }));
          case 'clear_console': return text(await bridgePost('/api/console/clear', {}));
          case 'focus_node': return text(await bridgePost('/api/scene/focus-node', { uuid: p.uuid }));
          case 'show_notification': {
            const title = p.title || 'AI Assistant';
            const msg = String(p.text || 'Notification');
            await bridgePost('/api/console/warn', { text: `[${title}] ${msg}` });
            return text({ success: true, action: 'show_notification', displayedText: msg, note: '已写入控制台（不弹模态对话框，避免阻塞自动化流程）' });
          }
          case 'play_in_editor': return text(await bridgePost('/api/preview/open'));
          // Gizmo
          case 'change_gizmo_tool': return text({ success: true, result: await editorMsg('scene', 'change-gizmo-tool', p.tool) });
          case 'query_gizmo_tool_name': return text({ tool: await editorMsg('scene', 'query-gizmo-tool-name') });
          case 'change_gizmo_pivot': return text({ success: true, result: await editorMsg('scene', 'change-gizmo-pivot', p.pivot) });
          case 'query_gizmo_pivot': return text({ pivot: await editorMsg('scene', 'query-gizmo-pivot') });
          case 'change_gizmo_coordinate': return text({ success: true, result: await editorMsg('scene', 'change-gizmo-coordinate', p.coordinate) });
          case 'query_gizmo_coordinate': return text({ coordinate: await editorMsg('scene', 'query-gizmo-coordinate') });
          // View
          case 'change_is2D': return text({ success: true, result: await editorMsg('scene', 'change-is2D', p.is2D) });
          case 'query_is2D': return text({ is2D: await editorMsg('scene', 'query-is2D') });
          case 'set_grid_visible': return text({ success: true, result: await editorMsg('scene', 'set-grid-visible', p.visible) });
          case 'query_is_grid_visible': return text({ visible: await editorMsg('scene', 'query-is-grid-visible') });
          case 'set_icon_gizmo_3d': return text({ success: true, result: await editorMsg('scene', 'set-icon-gizmo-3d', p.is3D) });
          case 'query_is_icon_gizmo_3d': return text({ is3D: await editorMsg('scene', 'query-is-icon-gizmo-3d') });
          case 'set_icon_gizmo_size': return text({ success: true, result: await editorMsg('scene', 'set-icon-gizmo-size', p.size) });
          case 'query_icon_gizmo_size': return text({ size: await editorMsg('scene', 'query-icon-gizmo-size') });
          // Camera align
          case 'align_node_with_view': return text({ success: true, result: await editorMsg('scene', 'align-with-view') });
          case 'align_view_with_node': return text({ success: true, result: await editorMsg('scene', 'align-view-with-node') });
          // Scene management
          case 'soft_reload': return text({ success: true, result: await editorMsg('scene', 'soft-reload') });
          case 'query_dirty': return text({ dirty: await editorMsg('scene', 'query-dirty') });
          // Undo system
          case 'snapshot': return text({ success: true, result: await editorMsg('scene', 'snapshot') });
          case 'snapshot_abort': return text({ success: true, result: await editorMsg('scene', 'snapshot-abort') });
          case 'cancel_recording': return text({ success: true, result: await editorMsg('scene', 'cancel-recording') });
          case 'build_query': {
            try {
              const projectInfo = await bridgeGet('/api/editor/project-info');
              const platforms = ['web-mobile', 'web-desktop', 'android', 'ios', 'mac', 'windows', 'wechatgame'];
              let buildSettings: unknown = null;
              try { buildSettings = await editorMsg('builder', 'query-build-options'); } catch { /* may not be available */ }
              return text({
                availablePlatforms: platforms,
                projectInfo,
                buildSettings,
              });
            } catch (err: unknown) {
              return text({ error: errorMessage(err) }, true);
            }
          }
          default:
            return text({ error: `未知的编辑器 action: ${p.action}` }, true);
        }
      } catch (err: unknown) {
        return text({ tool: 'editor_action', error: errorMessage(err) }, true);
      }
    },
  );

  // engine_action is Pro-exclusive — registered only via Rust native module
}
