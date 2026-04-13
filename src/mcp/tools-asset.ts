import { z } from 'zod';
import { LocalToolServer } from './local-tool-server';
import type { BridgeToolContext } from './tools-shared';
import {
  toInputSchema,
  normalizeParams,
  errorMessage,
  AI_RULES,
  validateRequiredParams,
  toStr,
  type AssetMeta,
  type AssetEntry,
  persistenceModeSchema,
  withPersistenceGuard,
  type PersistenceTarget,
} from './tools-shared';

export function registerAssetTools(server: LocalToolServer, ctx: BridgeToolContext): void {
  const { bridgeGet, bridgePost, editorMsg, text } = ctx;

  // asset_operation (17 actions — Community Edition)
  server.tool(
    'asset_operation',
    `Manage Cocos Creator project assets via AssetDB. All assets are identified by db:// URLs (e.g. "db://assets/textures/hero.png").

Actions & required parameters:
- list: pattern(optional, default "db://assets/**/*"). List assets matching glob pattern.
- info: url(REQUIRED). Get asset metadata (type, uuid, path, importer).
- create: url(REQUIRED), content(optional). Create new asset file. Use null content for folders/binary. NEVER create .spriteframe/.texture files — these are auto-generated sub-assets from image imports.
- save: url(REQUIRED), content(REQUIRED). Overwrite existing asset content.
- delete: url(REQUIRED). Delete an asset permanently.
- move: sourceUrl(REQUIRED), targetUrl(REQUIRED). Move/rename asset to new path.
- copy: sourceUrl(REQUIRED), targetUrl(REQUIRED). Duplicate asset to new path.
- rename: url(REQUIRED), newName(REQUIRED). Rename asset file (same directory).
- import: sourcePath(REQUIRED, absolute OS path), targetUrl(REQUIRED, db:// path). Import external file.
- open: url(REQUIRED). Open asset in default editor/viewer.
- refresh: url(optional). Refresh asset database (specific folder or entire db).
- uuid_to_url: uuid(REQUIRED). Convert asset UUID to db:// URL.
- url_to_uuid: url(REQUIRED). Convert db:// URL to UUID.
- create_folder: url(REQUIRED, e.g. "db://assets/prefabs"). Create folder in asset database.
- get_meta: url(REQUIRED). Get full .meta file content as JSON.
- set_meta_property: url(REQUIRED), property(REQUIRED), value(REQUIRED). Modify a .meta property.
- search_by_type: type(REQUIRED, e.g. "cc.ImageAsset", "cc.Prefab"), pattern(optional).
- persistenceMode(optional: warn/auto-save/strict). Controls whether successful write operations only warn, auto-save, or fail in strict persistence mode.

IMAGE IMPORT WORKFLOW: After importing a .png/.jpg via "import", the image defaults to type "texture" (no SpriteFrame). To use it with Sprite components, either: (A) use import_and_apply_texture which handles this automatically, or (B) manually: 1) import, 2) set_meta_property url=<img> property="userData.type" value="sprite-frame", 3) reimport url=<img>. This generates the SpriteFrame sub-asset at <img>/spriteFrame.
set_meta_property: Supports dot-separated nested paths (e.g. "userData.type" sets meta.userData.type). Use get_meta first to see the structure.
Returns: info→{uuid,type,importer,subAssets{}}. list→[{url,uuid,type}]. create/save/delete/move→{success}. Successful write results may include persistenceStatus{mode,target,requiresPersistence,saveAttempted,...}. url_to_uuid→"uuid-string". On error: {error:"message"}.
Common errors: "资源不存在"=wrong db:// URL; create blocked for .spriteframe/.texture (auto-generated sub-assets).` + AI_RULES,
    toInputSchema({
      action: z.enum([
        // Community: basic CRUD (17 actions)
        'list', 'info', 'create', 'save', 'delete', 'move', 'copy', 'rename',
        'import', 'open', 'refresh', 'create_folder',
        'get_meta', 'set_meta_property',
        'uuid_to_url', 'url_to_uuid', 'search_by_type',
      ]).describe('Asset operation to perform. See tool description for required parameters per action.'),
      url: z.string().optional().describe(
        'Asset db:// URL path. REQUIRED for: info, create, save, delete, open, create_folder, ' +
        'get_meta, set_meta_property, rename. Optional for: refresh (omit=refresh all). ' +
        'Format: "db://assets/path/to/file.ext". Example: "db://assets/textures/hero.png".'
      ),
      uuid: z.string().optional().describe(
        'Asset UUID string. REQUIRED for: uuid_to_url. Used when you have a UUID and need the db:// URL.'
      ),
      pattern: z.string().optional().describe(
        'Glob pattern for asset queries. Used by: list (default "db://assets/**/*"), search_by_type. ' +
        'Example: "db://assets/textures/**/*.png".'
      ),
      content: z.union([z.string(), z.null()]).optional().describe(
        'File content to write. Used by: create (null=binary/folder, string=text content), ' +
        'save (REQUIRED, string content to overwrite). For scripts, provide the TypeScript source code.'
      ),
      sourceUrl: z.string().optional().describe(
        'Source asset db:// URL. REQUIRED for: move, copy. The original asset to move/copy from.'
      ),
      targetUrl: z.string().optional().describe(
        'Target asset db:// URL or path. REQUIRED for: move (destination path), copy (destination path), ' +
        'import (destination db:// path). Example: "db://assets/sprites/imported_hero.png".'
      ),
      sourcePath: z.string().optional().describe(
        'Absolute OS file path for importing external files. REQUIRED for: import. ' +
        'Example: "C:/Users/dev/Downloads/hero.png" or "/home/dev/assets/hero.png".'
      ),
      newName: z.string().optional().describe(
        'New filename (with extension). REQUIRED for: rename. Example: "NewName.png".'
      ),
      type: z.string().optional().describe(
        'Asset type filter string. REQUIRED for: search_by_type. Common values: ' +
        '"cc.ImageAsset", "cc.Prefab", "cc.AnimationClip", "cc.AudioClip", "cc.Material", ' +
        '"cc.SpriteFrame", "cc.JsonAsset", "cc.TextAsset", "cc.SceneAsset".'
      ),
      property: z.string().optional().describe(
        'Meta property name. REQUIRED for: set_meta_property. Examples: "userData", "subMetas", ' +
        '"ver", "importer". Use get_meta first to discover available properties.'
      ),
      value: z.union([z.string(), z.number(), z.boolean(), z.record(z.string(), z.unknown()), z.array(z.unknown()), z.null()]).optional().describe(
        'Property value. REQUIRED for: set_meta_property. Type must match the property being set.'
      ),
      persistenceMode: persistenceModeSchema,
    }),
    async (params) => {
      try {
        const p = params as Record<string, unknown>;
        const _paramErr = validateRequiredParams('asset_operation', toStr(p.action), p);
        if (_paramErr) return text({ error: _paramErr }, true);
        const { warnings, pathError } = normalizeParams(p);
        if (pathError) return text({ error: `路径安全校验失败: ${pathError}` }, true);
        const addWarnings = (result: unknown) => {
          if (warnings.length && result && typeof result === 'object') {
            Object.assign(result, { _pathWarnings: warnings });
          }
          return result;
        };
        const resolveAssetPersistenceTarget = (action: string, input: Record<string, unknown>): PersistenceTarget => {
          switch (action) {
            case 'create':
            case 'save':
            case 'delete':
            case 'create_folder':
            case 'set_meta_property':
            case 'rename':
              return { kind: 'asset', url: toStr(input.url) || undefined };
            case 'move':
            case 'copy':
            case 'import':
              return { kind: 'asset', url: toStr(input.targetUrl) || undefined };
            default:
              return { kind: 'none' };
          }
        };
        const runAssetWriteWithPersistence = async (
          action: string,
          execute: () => Promise<Record<string, unknown>>,
        ) => {
          const { result, isError } = await withPersistenceGuard(
            { editorMsg, bridgePost },
            {
              mode: p.persistenceMode,
              target: resolveAssetPersistenceTarget(action, p),
              strictFailureMessage: `asset_operation.${action} 写入成功，但持久化失败（strict 模式）`,
            },
            execute,
          );
          return text(result, isError);
        };
        // ── API 调用规则 ──────────────────────────────────────────
        //   bridgeGet / bridgePost : 有 HTTP 路由 → 自带超时、锁、回滚
        //   editorMsg              : 仅 IPC 可达（无路由）
        // 返回格式: 写操作 → { success, ...ctx }; 读操作 → 原始数据
        // ─────────────────────────────────────────────────────────────
        switch (p.action) {
          case 'list': return text(addWarnings(await bridgeGet('/api/asset-db/query-assets', { pattern: toStr(p.pattern, 'db://assets/**/*') })));
          case 'info': return text(addWarnings(await bridgeGet('/api/asset-db/query-asset-info', { url: toStr(p.url) })));
          case 'create': {
            const createUrl = toStr(p.url);
            const AUTO_GENERATED_EXTS = ['.spriteframe', '.texture', '.fbx/mesh', '.fbx/skeleton', '.fbx/animation'];
            const lowerUrl = createUrl.toLowerCase();
            if (AUTO_GENERATED_EXTS.some(ext => lowerUrl.endsWith(ext))) {
              return text({
                error: `禁止手动创建 "${createUrl}"。` +
                  `该类型资源（${lowerUrl.split('.').pop()}）是 Cocos 导入器自动生成的子资源，不能手动创建。` +
                  `如需 SpriteFrame，请导入 .png/.jpg 图片，Cocos 会自动生成对应的 spriteFrame 子资源。` +
                  `使用 import_and_apply_texture 工具可一步完成导入+应用。`,
              }, true);
            }
            return runAssetWriteWithPersistence(
              'create',
              async () => addWarnings(await bridgePost('/api/asset-db/create-asset', { url: createUrl, content: p.content ?? null })) as Record<string, unknown>,
            );
          }
          case 'save': return runAssetWriteWithPersistence(
            'save',
            async () => addWarnings(await bridgePost('/api/asset-db/save-asset', { url: p.url, content: p.content || '' })) as Record<string, unknown>,
          );
          case 'delete': return runAssetWriteWithPersistence(
            'delete',
            async () => addWarnings(await bridgePost('/api/asset-db/delete-asset', { url: p.url })) as Record<string, unknown>,
          );
          case 'move': return runAssetWriteWithPersistence(
            'move',
            async () => addWarnings(await bridgePost('/api/asset-db/move-asset', { sourceUrl: p.sourceUrl, targetUrl: p.targetUrl })) as Record<string, unknown>,
          );
          case 'import': {
            return runAssetWriteWithPersistence(
              'import',
              async () => addWarnings(await bridgePost('/api/asset-db/import-asset', { sourcePath: p.sourcePath, targetUrl: p.targetUrl })) as Record<string, unknown>,
            );
          }
          case 'open': return text(addWarnings(await bridgePost('/api/asset-db/open-asset', { url: p.url })));
          case 'refresh': return text(addWarnings(await bridgePost('/api/asset-db/refresh', { url: p.url })));
          // ── IPC-only 读操作（无 HTTP 路由） ──
          case 'uuid_to_url': return text(await editorMsg('asset-db', 'query-url', p.uuid));
          case 'url_to_uuid': return text(await editorMsg('asset-db', 'query-uuid', p.url));
          // ── 写操作走 HTTP 路由（带锁 + 回滚） ──
          case 'create_folder': return runAssetWriteWithPersistence(
            'create_folder',
            async () => addWarnings(await bridgePost('/api/asset-db/create-asset', { url: p.url, content: null })) as Record<string, unknown>,
          );
          case 'copy': {
            const copyInfo = await bridgeGet('/api/asset-db/query-asset-info', { url: toStr(p.sourceUrl) });
            if (!copyInfo) return text({ error: `源资源不存在: ${p.sourceUrl}` }, true);
            // copy-asset 无 HTTP 路由，直接 IPC
            return runAssetWriteWithPersistence(
              'copy',
              async () => {
                await editorMsg('asset-db', 'copy-asset', p.sourceUrl, p.targetUrl);
                return addWarnings({ success: true, sourceUrl: p.sourceUrl, targetUrl: p.targetUrl }) as Record<string, unknown>;
              },
            );
          }
          case 'rename': {
            const parts = toStr(p.url).split('/');
            parts[parts.length - 1] = toStr(p.newName);
            const newUrl = parts.join('/');
            return runAssetWriteWithPersistence(
              'rename',
              async () => {
                await bridgePost('/api/asset-db/move-asset', { sourceUrl: toStr(p.url), targetUrl: newUrl });
                return addWarnings({ success: true, oldUrl: p.url, newUrl }) as Record<string, unknown>;
              },
            );
          }
          case 'get_meta': {
            // query-asset-meta 无 HTTP 路由，直接 IPC
            return text(addWarnings(await editorMsg('asset-db', 'query-asset-meta', p.url)));
          }
          case 'set_meta_property': {
            const meta = await editorMsg('asset-db', 'query-asset-meta', p.url) as AssetMeta | null;
            if (!meta) return text({ error: `无法获取 meta: ${p.url}` }, true);
            const propPath = toStr(p.property);
            const segments = propPath.split('.');
            if (segments.length === 1) {
              meta[propPath] = p.value;
            } else {
              let target: Record<string, unknown> = meta;
              for (let i = 0; i < segments.length - 1; i++) {
                const seg = segments[i];
                if (!target[seg] || typeof target[seg] !== 'object') target[seg] = {};
                target = target[seg] as Record<string, unknown>;
              }
              target[segments[segments.length - 1]] = p.value;
            }
            return runAssetWriteWithPersistence(
              'set_meta_property',
              async () => {
                await editorMsg('asset-db', 'save-asset-meta', p.url, JSON.stringify(meta));
                return addWarnings({ success: true, url: p.url, property: p.property, value: p.value }) as Record<string, unknown>;
              },
            );
          }
          case 'search_by_type': {
            const stPattern = toStr(p.pattern, 'db://assets/**/*');
            const typeFilter = toStr(p.type, '');
            const allAssets = await bridgeGet('/api/asset-db/query-assets', { pattern: stPattern }) as AssetEntry[];
            if (!Array.isArray(allAssets)) return text(allAssets);
            const filtered = typeFilter ? allAssets.filter((a) => toStr(a.type).toLowerCase().includes(typeFilter.toLowerCase())) : allAssets;
            return text(addWarnings({ count: filtered.length, assets: filtered }));
          }
          default:
            return text({ error: `未知的资源操作 action: ${p.action}` }, true);
        }
      } catch (err: unknown) {
        return text({ tool: 'asset_operation', error: errorMessage(err) }, true);
      }
    },
  );
}
