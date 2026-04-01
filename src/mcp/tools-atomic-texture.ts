import fs from 'fs';
import { z } from 'zod';
import type { LocalToolServer } from './local-tool-server';
import type { BridgeToolContext } from './tools-shared';
import {
  toInputSchema,
  normalizeDbUrl,
  sanitizeDbUrl,
  sanitizeOsPath,
  extractSelectedNodeUuid,
  errorMessage,
  attachScenePersistenceWarnings,
  persistenceModeSchema,
  withPersistenceGuard,
} from './tools-shared';
import { ErrorCategory, logIgnored } from '../error-utils';

export function registerTextureAtomicTool(server: LocalToolServer, ctx: BridgeToolContext): void {
  const { bridgeGet, bridgePost, sceneMethod, editorMsg, text } = ctx;
  const sceneOp = ctx.sceneOp ?? ((params: Record<string, unknown>) => sceneMethod('dispatchOperation', [params]));
  const getFailureReason = (result: unknown, fallback: string): string => {
    if (result && typeof result === 'object') {
      if ('error' in result && result.error) return String(result.error);
      if ('message' in result && result.message) return String(result.message);
    }
    return fallback;
  };
  const isFailedResult = (result: unknown): boolean => {
    return Boolean(
      result
      && typeof result === 'object'
      && (('error' in result && result.error) || ('success' in result && result.success === false))
    );
  };
  const componentExists = (components: unknown, componentName: string): boolean => {
    return Array.isArray(components) && components.some((entry) => {
      if (!entry || typeof entry !== 'object') return false;
      const type = String(
        (entry as { type?: unknown; name?: unknown; component?: unknown }).type
        ?? (entry as { type?: unknown; name?: unknown; component?: unknown }).name
        ?? (entry as { type?: unknown; name?: unknown; component?: unknown }).component
        ?? '',
      );
      return type === componentName || type === `cc.${componentName}` || type.endsWith(`.${componentName}`);
    });
  };
  const getComponentDump = (dump: unknown, componentName: string): Record<string, unknown> | null => {
    if (!dump || typeof dump !== 'object') return null;
    const comps = (dump as { __comps__?: unknown }).__comps__;
    if (!Array.isArray(comps)) return null;
    for (const entry of comps) {
      if (!entry || typeof entry !== 'object') continue;
      const type = String((entry as { type?: unknown }).type ?? '');
      if (type === componentName || type === `cc.${componentName}` || type.endsWith(`.${componentName}`)) {
        return entry as Record<string, unknown>;
      }
    }
    return null;
  };
  const extractSpriteFrameUuidFromDump = (dump: unknown): string => {
    const spriteDump = getComponentDump(dump, 'Sprite');
    if (!spriteDump) return '';
    const value = (spriteDump.value ?? {}) as Record<string, unknown>;
    const spriteFrame = (value.spriteFrame ?? value._spriteFrame ?? null) as Record<string, unknown> | null;
    const spriteFrameValue = (spriteFrame?.value ?? null) as Record<string, unknown> | null;
    return String(
      spriteFrameValue?.uuid
      ?? spriteFrameValue?._uuid
      ?? spriteFrameValue?.__uuid__
      ?? '',
    );
  };

  server.tool(
    'import_and_apply_texture',
    `Atomic macro: import an external image file into AssetDB AND apply it to a node's Sprite component in ONE call.

IMPORTANT: If the scene has no Canvas (e.g. a 3D-only scene), call scene_operation action=ensure_2d_canvas FIRST to create the 2D rendering environment, then create a child node under the returned canvasUuid with layer=33554432 (UI_2D).

Pipeline: 1) resolve target node (from nodeUuid or current selection), 2) import image to AssetDB,
3) auto-set meta type to sprite-frame, 4) ensure UITransform + Sprite exist, 5) resolve SpriteFrame UUID, 6) set spriteFrame property, 7) refresh & highlight.

Parameters:
- sourcePath(REQUIRED): Absolute OS file path of the image to import.
- targetUrl(optional): db:// destination path. Default: "db://assets/textures/{filename}".
- nodeUuid(optional): Target node UUID. If omitted, uses current editor selection.
- autoAddSprite(optional, default true): Automatically add Sprite component if target node doesn't have one.
- refreshAssetDb(optional, default true): Refresh AssetDB after import.
- persistenceMode(optional: warn/auto-save/strict). Controls whether successful scene writes only warn, auto-save, or fail in strict persistence mode.

Auto-behavior: This tool automatically sets the image meta type to "sprite-frame" and reimports, ensuring a SpriteFrame sub-asset is generated. It then applies the SpriteFrame to the Sprite component via Editor IPC.
Returns: {success, nodeUuid, targetUrl, stages:["validate_input","import_texture","ensure_sprite_frame_type","ensure_ui_transform","ensure_sprite_component","resolve_sprite_frame_uuid","apply_sprite_frame","refresh_asset_db","highlight"], importResult:{uuid,subAssets}}. Successful write results may include persistenceStatus{mode,target,requiresPersistence,saveAttempted,...}. On error: {success:false, error:"message", stages}.
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
      persistenceMode: persistenceModeSchema,
    }),
    async (params) => {
      const p = params as Record<string, unknown>;
      const stages: string[] = [];
      const warnings: string[] = [];
      try {
        if (!p.sourcePath) return text({ success: false, error: '缺少 sourcePath 参数' }, true);
        const osPathErr = sanitizeOsPath(String(p.sourcePath));
        if (osPathErr) return text({ success: false, error: `路径安全校验失败: ${osPathErr}` }, true);
        const sourcePath = String(p.sourcePath);
        stages.push('validate_input');
        if (!fs.existsSync(sourcePath)) {
          return text({ success: false, error: `源文件不存在: ${sourcePath}`, stages }, true);
        }
        let sourceStats: fs.Stats;
        try {
          sourceStats = fs.statSync(sourcePath);
        } catch (err: unknown) {
          return text({ success: false, error: `读取源文件信息失败: ${errorMessage(err)}`, stages }, true);
        }
        if (!sourceStats.isFile()) {
          return text({ success: false, error: `sourcePath 不是文件: ${sourcePath}`, stages }, true);
        }
        const fileName = String(p.sourcePath).split(/[/\\]/).pop() || 'texture.png';
        const defaultTarget = `db://assets/textures/${fileName}`;
        const rawTargetUrl = String(p.targetUrl || defaultTarget);
        const dbUrlErr = sanitizeDbUrl(rawTargetUrl);
        if (dbUrlErr) return text({ success: false, error: `路径安全校验失败: ${dbUrlErr}` }, true);
        const normalizedTarget = normalizeDbUrl(rawTargetUrl);
        const targetUrl = normalizedTarget.url;

        let nodeUuid = typeof p.nodeUuid === 'string' ? p.nodeUuid : '';
        if (!nodeUuid) {
          stages.push('resolve_selection');
          const selection = await bridgeGet('/api/editor/selection');
          nodeUuid = extractSelectedNodeUuid(selection);
          if (!nodeUuid) return text({ success: false, error: '未提供 nodeUuid 且当前未选中节点' }, true);
        }
        const nodeInfo = await sceneMethod('dispatchQuery', [{ action: 'get_components', uuid: nodeUuid }]) as Record<string, unknown>;
        if (isFailedResult(nodeInfo)) {
          return text({ success: false, error: getFailureReason(nodeInfo, `目标节点不存在: ${nodeUuid}`), stages }, true);
        }
        let currentComponents = Array.isArray(nodeInfo.components) ? nodeInfo.components : [];

        stages.push('import_texture');
        const importResult = await bridgePost('/api/asset-db/import-asset', { sourcePath: p.sourcePath, targetUrl });
        if (isFailedResult(importResult)) {
          return text({ success: false, error: getFailureReason(importResult, `导入贴图失败: ${targetUrl}`), stages }, true);
        }
        const importedInfo = await editorMsg('asset-db', 'query-asset-info', targetUrl) as Record<string, unknown> | null;
        if (!importedInfo) {
          return text({ success: false, error: `导入完成后未在 AssetDB 中找到资源: ${targetUrl}`, stages }, true);
        }

        stages.push('ensure_sprite_frame_type');
        const meta = await editorMsg('asset-db', 'query-asset-meta', targetUrl) as Record<string, unknown> | null;
        if (!meta) {
          return text({ success: false, error: `未找到资源 meta: ${targetUrl}`, stages }, true);
        }
        const ud = (meta.userData ?? {}) as Record<string, unknown>;
        if (ud.type !== 'sprite-frame') {
          try {
            ud.type = 'sprite-frame';
            delete ud.redirect;
            meta.userData = ud;
            await editorMsg('asset-db', 'save-asset-meta', targetUrl, JSON.stringify(meta));
            await editorMsg('asset-db', 'reimport-asset', targetUrl);
          } catch (e) {
            logIgnored(ErrorCategory.ASSET_OPERATION, '设置图片 meta type 为 sprite-frame 失败', e);
            return text({ success: false, error: `设置图片 meta type 失败: ${errorMessage(e)}`, stages }, true);
          }
        }

        if (!componentExists(currentComponents, 'UITransform')) {
          stages.push('ensure_ui_transform');
          const addUiTransformResult = await sceneOp({ action: 'add_component', uuid: nodeUuid, component: 'UITransform' });
          if (isFailedResult(addUiTransformResult)) {
            return text({ success: false, error: getFailureReason(addUiTransformResult, '添加 UITransform 组件失败'), stages }, true);
          }
          const refreshedNode = await sceneMethod('dispatchQuery', [{ action: 'get_components', uuid: nodeUuid }]) as Record<string, unknown>;
          if (isFailedResult(refreshedNode) || !componentExists(refreshedNode.components, 'UITransform')) {
            return text({ success: false, error: 'UITransform 添加操作返回成功，但组件未实际出现在节点上', stages }, true);
          }
          currentComponents = Array.isArray(refreshedNode.components) ? refreshedNode.components : currentComponents;
        }

        const spriteExists = componentExists(currentComponents, 'Sprite');
        if (p.autoAddSprite !== false) {
          if (!spriteExists) {
            stages.push('ensure_sprite_component');
            const addSpriteResult = await sceneOp({ action: 'add_component', uuid: nodeUuid, component: 'Sprite' });
            if (isFailedResult(addSpriteResult)) {
              return text({ success: false, error: getFailureReason(addSpriteResult, '添加 Sprite 组件失败'), stages }, true);
            }
            const refreshedNode = await sceneMethod('dispatchQuery', [{ action: 'get_components', uuid: nodeUuid }]) as Record<string, unknown>;
            if (isFailedResult(refreshedNode) || !componentExists(refreshedNode.components, 'Sprite')) {
              return text({ success: false, error: 'Sprite 添加操作返回成功，但组件未实际出现在节点上', stages }, true);
            }
            currentComponents = Array.isArray(refreshedNode.components) ? refreshedNode.components : currentComponents;
          }
        } else if (!spriteExists) {
          return text({ success: false, error: '目标节点缺少 Sprite 组件，且 autoAddSprite=false', stages }, true);
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
          return text({ success: false, error: `未能解析 SpriteFrame UUID: ${spriteFrameUrl}`, stages }, true);
        }

        stages.push('apply_sprite_frame');
        const setResult = await sceneOp({ action: 'set_property', uuid: nodeUuid, component: 'Sprite', property: 'spriteFrame', value: { __uuid__: spriteFrameUuid } }) as Record<string, unknown>;
        if (isFailedResult(setResult)) {
          return text({ success: false, error: getFailureReason(setResult, '自动挂载 spriteFrame 失败'), stages }, true);
        }
        let resolvedSpriteFrameUuid = '';
        try {
          const nodeDump = await editorMsg('scene', 'query-node', nodeUuid);
          resolvedSpriteFrameUuid = extractSpriteFrameUuidFromDump(nodeDump);
        } catch (e) {
          logIgnored(ErrorCategory.EDITOR_IPC, 'query-node 校验 spriteFrame 失败，回退到场景脚本查询', e);
        }
        if (!resolvedSpriteFrameUuid) {
          const spriteFrameValue = await sceneMethod('dispatchQuery', [{
            action: 'get_component_property', uuid: nodeUuid, component: 'Sprite', property: 'spriteFrame',
          }]) as Record<string, unknown>;
          if (isFailedResult(spriteFrameValue)) {
            return text({ success: false, error: getFailureReason(spriteFrameValue, 'spriteFrame 挂载后校验失败'), stages }, true);
          }
          resolvedSpriteFrameUuid = String(
            (spriteFrameValue.value as { uuid?: unknown; _uuid?: unknown; __uuid__?: unknown } | undefined)?.uuid
            ?? (spriteFrameValue.value as { uuid?: unknown; _uuid?: unknown; __uuid__?: unknown } | undefined)?._uuid
            ?? (spriteFrameValue.value as { uuid?: unknown; _uuid?: unknown; __uuid__?: unknown } | undefined)?.__uuid__
            ?? '',
          );
        }
        if (!resolvedSpriteFrameUuid) {
          return text({ success: false, error: 'spriteFrame 挂载后校验失败，节点上未读取到有效的 SpriteFrame UUID', stages }, true);
        }
        if (resolvedSpriteFrameUuid !== spriteFrameUuid) {
          return text({ success: false, error: `spriteFrame 校验失败，期望 ${spriteFrameUuid}，实际 ${resolvedSpriteFrameUuid}`, stages }, true);
        }

        if (p.refreshAssetDb !== false) {
          stages.push('refresh_asset_db');
          await bridgePost('/api/asset-db/refresh', { url: targetUrl.slice(0, targetUrl.lastIndexOf('/')) });
        }

        stages.push('highlight');
        try { await bridgePost('/api/editor/select', { uuids: [nodeUuid], forceRefresh: true }); } catch (e) {
          logIgnored(ErrorCategory.EDITOR_IPC, '选中节点高亮失败', e);
        }
        try { await bridgePost('/api/console/log', { text: `import_and_apply_texture 已执行: ${targetUrl}` }); } catch { /* ignore */ }

        const { result, isError } = await withPersistenceGuard(
          { editorMsg, bridgePost },
          {
            mode: p.persistenceMode,
            target: {
              kind: 'multi',
              targets: [
                { kind: 'asset', url: targetUrl },
                { kind: 'scene', saveStrategy: 'save_scene' },
              ],
            },
            strictFailureMessage: 'import_and_apply_texture 写入成功，但持久化失败（strict 模式）',
          },
          async () => {
            const response: Record<string, unknown> = {
              success: true, nodeUuid, sourcePath: p.sourcePath, targetUrl, stages, importResult,
              ...(warnings.length ? { warnings } : {}),
            };
            await attachScenePersistenceWarnings(editorMsg, response, {
              action: 'import_and_apply_texture',
              affectedUuid: nodeUuid,
              includeSceneSaveWarning: false,
            });
            return response;
          },
        );
        return text(result, isError ? true : undefined);
      } catch (err: unknown) {
        return text({
          success: false, error: errorMessage(err), stages,
          ...(warnings.length ? { warnings } : {}),
        }, true);
      }
    },
  );
}
