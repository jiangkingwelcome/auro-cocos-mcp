import { z } from 'zod';
import type { LocalToolServer } from './local-tool-server';
import type { BridgeToolContext } from './tools-shared';
import { toInputSchema, normalizeDbUrl, sanitizeDbUrl, sanitizeOsPath, withGuardrailHints, extractSelectedNodeUuid, errorMessage } from './tools-shared';
import { ErrorCategory, logIgnored } from '../error-utils';

export function registerTextureAtomicTool(server: LocalToolServer, ctx: BridgeToolContext): void {
  const { bridgeGet, bridgePost, sceneMethod, editorMsg, text } = ctx;

  server.tool(
    'import_and_apply_texture',
    `Atomic macro: import an external image file into AssetDB AND apply it to a node's Sprite component in ONE call.

IMPORTANT: If the scene has no Canvas (e.g. a 3D-only scene), call scene_operation action=ensure_2d_canvas FIRST to create the 2D rendering environment, then create a child node under the returned canvasUuid with layer=33554432 (UI_2D).

Pipeline: 1) resolve target node (from nodeUuid or current selection), 2) import image to AssetDB,
3) auto-set meta type to sprite-frame, 4) auto-add Sprite component if missing, 5) resolve SpriteFrame UUID, 6) set spriteFrame property, 7) refresh & highlight.

Parameters:
- sourcePath(REQUIRED): Absolute OS file path of the image to import.
- targetUrl(optional): db:// destination path. Default: "db://assets/textures/{filename}".
- nodeUuid(optional): Target node UUID. If omitted, uses current editor selection.
- autoAddSprite(optional, default true): Automatically add Sprite component if target node doesn't have one.
- refreshAssetDb(optional, default true): Refresh AssetDB after import.

Auto-behavior: This tool automatically sets the image meta type to "sprite-frame" and reimports, ensuring a SpriteFrame sub-asset is generated. It then applies the SpriteFrame to the Sprite component via Editor IPC.
Returns: {success, nodeUuid, targetUrl, stages:["import_texture","ensure_sprite_frame_type","ensure_sprite_component","resolve_sprite_frame_uuid","apply_sprite_frame","refresh_asset_db","highlight"], importResult:{uuid,subAssets}, warnings?:[]}. On error: {success:false, error:"message", stages}.
Prerequisites: Target node must exist. In 3D scenes, call scene_operation action=ensure_2d_canvas first, create a child node under canvasUuid with layer=33554432, then pass that node's UUID.
Common errors: "未选中节点"=no nodeUuid and nothing selected; sourcePath file not found; SpriteFrame UUID resolution may retry up to 5 times.`,
    toInputSchema({
      sourcePath: z.string().describe(
        'Absolute OS file path of the image to import. REQUIRED. ' +
        'Example: "C:/Users/dev/Downloads/hero.png" or "/home/dev/assets/bg.jpg". ' +
        'Supported formats: PNG, JPG, JPEG, WebP, BMP.'
      ),
      targetUrl: z.string().optional().describe(
        'Destination db:// URL in AssetDB. Default: "db://assets/textures/{original_filename}". ' +
        'Example: "db://assets/sprites/characters/hero.png".'
      ),
      nodeUuid: z.string().optional().describe(
        'UUID of the target node to apply the texture to. If omitted, uses the currently selected node in editor. ' +
        'The node should have or will get a Sprite component.'
      ),
      autoAddSprite: z.boolean().optional().describe(
        'Whether to automatically add a Sprite component if the target node lacks one. Default: true.'
      ),
      refreshAssetDb: z.boolean().optional().describe(
        'Whether to refresh the AssetDB after import. Default: true. Set false for batch operations.'
      ),
    }),
    async (params) => {
      const p = params as Record<string, unknown>;
      const stages: string[] = [];
      const warnings: string[] = [];
      try {
        if (!p.sourcePath) return text({ success: false, error: '缺少 sourcePath 参数' }, true);
        const osPathErr = sanitizeOsPath(String(p.sourcePath));
        if (osPathErr) return text({ success: false, error: `路径安全校验失败: ${osPathErr}` }, true);
        const fileName = String(p.sourcePath).split(/[/\\]/).pop() || 'texture.png';
        const defaultTarget = `db://assets/textures/${fileName}`;
        const rawTargetUrl = String(p.targetUrl || defaultTarget);
        const dbUrlErr = sanitizeDbUrl(rawTargetUrl);
        if (dbUrlErr) return text({ success: false, error: `路径安全校验失败: ${dbUrlErr}` }, true);
        const normalizedTarget = normalizeDbUrl(rawTargetUrl);
        const targetUrl = normalizedTarget.url;
        if (normalizedTarget.normalized) warnings.push(`路径已自动规范化: ${p.targetUrl || defaultTarget} -> ${targetUrl}`);

        let nodeUuid = typeof p.nodeUuid === 'string' ? p.nodeUuid : '';
        if (!nodeUuid) {
          stages.push('resolve_selection');
          const selection = await bridgeGet('/api/editor/selection');
          nodeUuid = extractSelectedNodeUuid(selection);
          if (!nodeUuid) return text({ success: false, error: '未提供 nodeUuid 且当前未选中节点' }, true);
        }

        stages.push('import_texture');
        const importResult = await bridgePost('/api/asset-db/import-asset', { sourcePath: p.sourcePath, targetUrl });

        stages.push('ensure_sprite_frame_type');
        try {
          const meta = await editorMsg('asset-db', 'query-asset-meta', targetUrl) as Record<string, unknown> | null;
          if (meta) {
            const ud = (meta.userData ?? {}) as Record<string, unknown>;
            if (ud.type !== 'sprite-frame') {
              ud.type = 'sprite-frame';
              delete ud.redirect;
              meta.userData = ud;
              await editorMsg('asset-db', 'save-asset-meta', targetUrl, JSON.stringify(meta));
              await editorMsg('asset-db', 'reimport-asset', targetUrl);
            }
          }
        } catch (e) {
          logIgnored(ErrorCategory.ASSET_OPERATION, '设置图片 meta type 为 sprite-frame 失败', e);
          warnings.push('未能自动将图片类型设为 sprite-frame，SpriteFrame 子资源可能不可用。');
        }

        if (p.autoAddSprite !== false) {
          stages.push('ensure_sprite_component');
          const addSpriteResult = withGuardrailHints(await sceneMethod('dispatchOperation', [{ action: 'add_component', uuid: nodeUuid, component: 'Sprite' }])) as Record<string, unknown>;
          if (addSpriteResult?.error && !String(addSpriteResult.error).includes('already')) {
            warnings.push(`添加 Sprite 组件提示: ${addSpriteResult.error}`);
          }
        }

        stages.push('resolve_sprite_frame_uuid');
        const spriteFrameUrl = `${targetUrl}/spriteFrame`;
        let spriteFrameUuid = '';
        const maxRetries = 5;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            spriteFrameUuid = String(await editorMsg('asset-db', 'query-uuid', spriteFrameUrl) || '');
          } catch (e) {
            logIgnored(ErrorCategory.ASSET_OPERATION, `解析 SpriteFrame UUID 失败 (attempt ${attempt + 1})`, e);
          }
          if (spriteFrameUuid) break;
          await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
        }
        if (!spriteFrameUuid) {
          warnings.push(`未能解析 SpriteFrame UUID (${spriteFrameUrl})，已完成导入和组件准备，可能需要手动指定 spriteFrame。`);
        } else {
          stages.push('apply_sprite_frame');
          const setResult = withGuardrailHints(await sceneMethod('dispatchOperation', [{
            action: 'set_property', uuid: nodeUuid, component: 'Sprite',
            property: 'spriteFrame', value: { __uuid__: spriteFrameUuid },
          }])) as Record<string, unknown>;
          if (setResult?.error) {
            warnings.push(`自动挂载 spriteFrame 失败: ${setResult.error}`);
          }
        }

        if (p.refreshAssetDb !== false) {
          stages.push('refresh_asset_db');
          await bridgePost('/api/asset-db/refresh', { url: targetUrl.slice(0, targetUrl.lastIndexOf('/')) });
        }

        stages.push('highlight');
        try { await bridgePost('/api/editor/select', { uuids: [nodeUuid], forceRefresh: true }); } catch (e) {
          logIgnored(ErrorCategory.EDITOR_IPC, '选中节点高亮失败', e);
          warnings.push(`高亮节点失败: ${errorMessage(e)}`);
        }
        try { await bridgePost('/api/console/log', { text: `import_and_apply_texture 已执行: ${targetUrl}` }); } catch { /* ignore */ }

        return text({
          success: true, nodeUuid, sourcePath: p.sourcePath, targetUrl, stages, importResult,
          ...(warnings.length ? { warnings } : {}),
        });
      } catch (err: unknown) {
        return text({
          success: false, error: errorMessage(err), stages,
          ...(warnings.length ? { warnings } : {}),
        }, true);
      }
    },
  );
}
