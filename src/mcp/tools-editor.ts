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
- save_scene: no params. Save current scene silently. If scene has never been saved (no file path), returns skipped=true to avoid triggering a native dialog. Pass force=true to show the Save As dialog.
- open_scene: uuid(optional) or url(optional). Open a scene by UUID or db:// URL.
- new_scene: no params. Create a new empty scene.
- undo: no params. Undo last operation.
- redo: no params. Redo last undone operation.
- project_info: no params. Get project name, path, engine version.
- build: platform(optional, e.g. "web-mobile", "android", "ios"). Start project build.
- preview: no params. Open preview in browser.
- preview_refresh: no params. Refresh preview.
- focus_node: uuid(REQUIRED). Focus editor camera on a node.
- log: text(REQUIRED). Write info message to console.
- warn: text(REQUIRED). Write warning to console.
- error: text(REQUIRED). Write error to console.
- clear_console: no params. Clear console output.
- play_in_editor: no params. Enter play/preview mode.
- pause_in_editor: no params. Pause play mode.
- stop_in_editor: no params. Stop play mode.
- step_in_editor: no params. Step one frame in play mode.
- show_notification: text(REQUIRED), title(optional). Show editor notification dialog.
- build_query: no params. Get current build configuration and available platforms.

Returns: save_scene→{success}. project_info→{name,path,version}. On error: {error:"message"}.
Prerequisites: build requires scene to be saved first (call save_scene). play_in_editor/pause_in_editor/stop_in_editor control the editor preview mode.
Common errors: build may fail silently — use build_query to check configuration first.` + AI_RULES,
    toInputSchema({
      action: z.enum([
        // Community: basic editor actions (20 actions)
        // Scene lifecycle
        'save_scene', 'open_scene', 'new_scene', 'undo', 'redo',
        // Project
        'project_info',
        // Preview
        'preview', 'preview_refresh',
        // Build
        'build', 'build_query',
        // Play
        'play_in_editor', 'pause_in_editor', 'stop_in_editor', 'step_in_editor',
        // Misc
        'focus_node', 'log', 'warn', 'error', 'clear_console', 'show_notification',
      ]).describe('Editor action to perform. See tool description for required parameters per action.'),
      uuid: z.string().optional().describe(
        'Node or asset UUID. REQUIRED for: focus_node. ' +
        'Optional for: open_scene (open scene by UUID).'
      ),
      url: z.string().optional().describe(
        'Asset db:// URL. Optional for: open_scene (open scene by db:// URL).'
      ),
      platform: z.enum(['web-mobile', 'web-desktop', 'android', 'ios', 'mac', 'windows', 'wechatgame']).optional().describe(
        'Target build platform. Used by: build. Example: "web-mobile".'
      ),
      text: z.string().optional().describe(
        'Text content. REQUIRED for: log, warn, error (console output), show_notification (display text).'
      ),
      title: z.string().optional().describe(
        'Notification dialog title. Optional for: show_notification. Default: "AI Assistant".'
      ),
      force: z.boolean().optional().describe(
        'For save_scene: force save even if scene has never been saved (will show native Save As dialog). ' +
        'Default: false. When false, untitled scenes return skipped=true to avoid blocking dialog.'
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
          case 'pause_in_editor': return text(await editorMsg('scene', 'pause') ?? { success: true });
          case 'stop_in_editor': return text(await editorMsg('scene', 'stop') ?? { success: true });
          case 'step_in_editor': return text(await editorMsg('scene', 'step') ?? { success: true });
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
