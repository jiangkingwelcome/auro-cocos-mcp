import { z } from 'zod';
import type { LocalToolServer } from './local-tool-server';
import type { BridgeToolContext } from './tools-shared';
import { toInputSchema, extractSelectedNodeUuid, errorMessage } from './tools-shared';
import { ErrorCategory, logIgnored } from '../error-utils';

export function registerUILayoutAtomicTool(server: LocalToolServer, ctx: BridgeToolContext): void {
  const { bridgeGet, bridgePost, sceneMethod, editorMsg, text } = ctx;

  server.tool(
    'setup_ui_layout',
    `Atomic macro: create a complete ScrollView with hierarchy (Root > Viewport > Content > Items) in ONE call.

Pipeline: 1) resolve parent (from parentUuid or current selection), 2) create Root node with UITransform + ScrollView,
3) create Viewport with UITransform + Mask, 4) create Content with UITransform + Layout,
5) create N item nodes, 6) bind ScrollView.content and ScrollView.view references, 7) highlight result.

Parameters:
- parentUuid(optional): Parent node UUID. If omitted, uses current editor selection or scene root.
- rootName(optional, default "AutoScrollView"): Name for the root ScrollView node.
- itemNamePrefix(optional, default "Item"): Prefix for generated item names (Item_1, Item_2, ...).
- itemCount(optional, default 5, max 100): Number of list item nodes to create.
- withMask(optional, default true): Add Mask component to Viewport for clipping.
- withLayout(optional, default true): Add Layout component to Content for auto-arrangement.

Prerequisites: parentUuid should be a node under a Canvas with UI_2D layer. In 3D scenes, call scene_operation action=ensure_2d_canvas first, then use the returned canvasUuid as parentUuid. If parentUuid omitted, uses current editor selection.
Returns: {success, rootUuid, viewportUuid, contentUuid, itemCount, scrollViewBound, stages:[...]}. On error: {success:false, error}.`,
    toInputSchema({
      parentUuid: z.string().optional().describe(
        'UUID of the parent node to create the ScrollView hierarchy under. ' +
        'If omitted, uses the currently selected node in editor, or scene root as fallback.'
      ),
      rootName: z.string().optional().describe(
        'Name for the root ScrollView node. Default: "AutoScrollView". Example: "PlayerList".'
      ),
      itemNamePrefix: z.string().optional().describe(
        'Name prefix for generated item child nodes. Default: "Item". ' +
        'Items will be named "{prefix}_1", "{prefix}_2", etc. Example: "PlayerCard".'
      ),
      itemCount: z.number().int().min(1).max(100).optional().describe(
        'Number of list item child nodes to create under Content. Default: 5, Max: 100.'
      ),
      withMask: z.boolean().optional().describe(
        'Whether to add a Mask component to the Viewport node for clipping. Default: true. ' +
        'Set false if you want to handle masking differently.'
      ),
      withLayout: z.boolean().optional().describe(
        'Whether to add a Layout component to the Content node for auto-arrangement. Default: true. ' +
        'The Layout component auto-positions child items in a list.'
      ),
    }),
    async (params) => {
      const p = params as Record<string, unknown>;
      const stages: string[] = [];
      const warnings: string[] = [];
      try {
        let parentUuid = typeof p.parentUuid === 'string' ? p.parentUuid : '';
        if (!parentUuid) {
          stages.push('resolve_selection_parent');
          const selection = await bridgeGet('/api/editor/selection');
          parentUuid = extractSelectedNodeUuid(selection);
        }

        const rootName = (p.rootName as string) || 'AutoScrollView';
        const itemPrefix = (p.itemNamePrefix as string) || 'Item';
        const itemCount = Math.max(1, Math.min(Number(p.itemCount || 5), 100));

        stages.push('create_root');
        const rootResult = await sceneMethod('createChildNode', [parentUuid || '', rootName]) as Record<string, unknown>;
        if (!rootResult || rootResult.error) throw new Error((rootResult as { error?: string })?.error || '创建 ScrollView 根节点失败');
        const rootUuid = String(rootResult.uuid);

        stages.push('root_components');
        await sceneMethod('dispatchOperation', [{ action: 'add_component', uuid: rootUuid, component: 'UITransform' }]);

        stages.push('create_viewport');
        const viewportResult = await sceneMethod('createChildNode', [rootUuid, 'Viewport']) as Record<string, unknown>;
        if (!viewportResult || viewportResult.error) throw new Error((viewportResult as { error?: string })?.error || '创建 Viewport 失败');
        const viewportUuid = String(viewportResult.uuid);
        await sceneMethod('dispatchOperation', [{ action: 'add_component', uuid: viewportUuid, component: 'UITransform' }]);
        if (p.withMask !== false) {
          await sceneMethod('dispatchOperation', [{ action: 'add_component', uuid: viewportUuid, component: 'Mask' }]);
        }

        stages.push('create_content');
        const contentResult = await sceneMethod('createChildNode', [viewportUuid, 'Content']) as Record<string, unknown>;
        if (!contentResult || contentResult.error) throw new Error((contentResult as { error?: string })?.error || '创建 Content 失败');
        const contentUuid = String(contentResult.uuid);
        await sceneMethod('dispatchOperation', [{ action: 'add_component', uuid: contentUuid, component: 'UITransform' }]);
        if (p.withLayout !== false) {
          await sceneMethod('dispatchOperation', [{ action: 'add_component', uuid: contentUuid, component: 'Layout' }]);
        }

        const items: string[] = [];
        stages.push('create_items');
        for (let i = 0; i < itemCount; i++) {
          const itemRes = await sceneMethod('createChildNode', [contentUuid, `${itemPrefix}_${i + 1}`]) as Record<string, unknown>;
          if (itemRes?.uuid) {
            items.push(String(itemRes.uuid));
            await sceneMethod('dispatchOperation', [{ action: 'add_component', uuid: itemRes.uuid, component: 'UITransform' }]);
          }
        }

        stages.push('add_scrollview');
        let scrollViewBound = false;
        try {
          await sceneMethod('dispatchOperation', [{ action: 'add_component', uuid: rootUuid, component: 'ScrollView' }]);

          stages.push('bind_scrollview_refs');
          const contentRef = { __refType__: 'cc.Node' as const, uuid: contentUuid };
          const viewRef = { __refType__: 'cc.Node' as const, uuid: viewportUuid };
          const contentResult = await sceneMethod('setComponentProperty', [rootUuid, 'ScrollView', 'content', contentRef]) as Record<string, unknown>;
          const viewResult = await sceneMethod('setComponentProperty', [rootUuid, 'ScrollView', 'view', viewRef]) as Record<string, unknown>;
          scrollViewBound = !!(contentResult?.success && viewResult?.success);
          if (!scrollViewBound) {
            const errs: string[] = [];
            if (!contentResult?.success) errs.push(`content: ${contentResult?.error || 'unknown'}`);
            if (!viewResult?.success) errs.push(`view: ${viewResult?.error || 'unknown'}`);
            warnings.push(`ScrollView 组件已添加但引用绑定部分失败 (${errs.join('; ')})。可在编辑器中手动绑定。`);
          }
        } catch (e) {
          logIgnored(ErrorCategory.ENGINE_API, 'ScrollView 组件添加或引用绑定失败', e);
          warnings.push(`ScrollView 组件添加失败 (${errorMessage(e)})。层级结构已正确创建，可在编辑器中手动添加 ScrollView 组件。`);
        }

        stages.push('highlight');
        try { await bridgePost('/api/editor/select', { uuids: [rootUuid], forceRefresh: true }); } catch (e) {
          logIgnored(ErrorCategory.EDITOR_IPC, '选中节点高亮失败', e);
          warnings.push(`高亮节点失败: ${errorMessage(e)}`);
        }
        try { await bridgePost('/api/console/log', { text: `setup_ui_layout 已创建: ${rootName} (${itemCount} items)` }); } catch { /* ignore */ }

        return text({
          success: true, rootUuid, viewportUuid, contentUuid,
          itemCount: items.length, itemUuids: items, scrollViewBound, stages,
          ...(warnings.length ? { warnings } : {}),
        });
      } catch (err: unknown) {
        return text({ success: false, stages, error: errorMessage(err), ...(warnings.length ? { warnings } : {}) }, true);
      }
    },
  );
}
