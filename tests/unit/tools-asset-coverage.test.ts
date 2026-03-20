import { describe, it, expect, vi } from 'vitest';
import { buildCocosToolServer, type BridgeToolContext } from '../../src/mcp/tools';
import type { ToolCallResult } from '../../src/mcp/local-tool-server';

function makeCtx(overrides: Partial<BridgeToolContext> = {}): BridgeToolContext {
  return {
    bridgeGet: vi.fn().mockResolvedValue({}),
    bridgePost: vi.fn().mockResolvedValue({ success: true }),
    sceneMethod: vi.fn().mockResolvedValue({ success: true }),
    editorMsg: vi.fn().mockResolvedValue({}),
    text: (data: unknown, isError?: boolean): ToolCallResult => ({
      content: [{ type: 'text', text: JSON.stringify(data) }],
      ...(isError !== undefined ? { isError } : {}),
    }),
    ...overrides,
  };
}
function parse(result: ToolCallResult): Record<string, unknown> {
  return JSON.parse(result.content[0].text);
}

// ═══════════════════════════════════════════════════════════════════════════════
// asset_operation
// ═══════════════════════════════════════════════════════════════════════════════

describe('asset_operation — bridgeGet actions', () => {
  it('list calls bridgeGet /api/asset-db/query-assets', async () => {
    const bridgeGet = vi.fn().mockResolvedValue([{ url: 'db://assets/a.png' }]);
    const server = buildCocosToolServer(makeCtx({ bridgeGet }));
    const result = await server.callTool('asset_operation', { action: 'list' });
    expect(result.isError).toBeFalsy();
    expect(bridgeGet).toHaveBeenCalledWith('/api/asset-db/query-assets', { pattern: 'db://assets/**/*' });
  });

  it('list with custom pattern', async () => {
    const bridgeGet = vi.fn().mockResolvedValue([]);
    const server = buildCocosToolServer(makeCtx({ bridgeGet }));
    await server.callTool('asset_operation', { action: 'list', pattern: 'db://assets/textures/**/*.png' });
    expect(bridgeGet).toHaveBeenCalledWith('/api/asset-db/query-assets', { pattern: 'db://assets/textures/**/*.png' });
  });

  it('info calls bridgeGet /api/asset-db/query-asset-info', async () => {
    const bridgeGet = vi.fn().mockResolvedValue({ uuid: 'abc', type: 'cc.ImageAsset' });
    const server = buildCocosToolServer(makeCtx({ bridgeGet }));
    const result = await server.callTool('asset_operation', { action: 'info', url: 'db://assets/hero.png' });
    expect(result.isError).toBeFalsy();
    expect(bridgeGet).toHaveBeenCalledWith('/api/asset-db/query-asset-info', { url: 'db://assets/hero.png' });
  });

  it('community edition rejects Pro query actions', async () => {
    const server = buildCocosToolServer(makeCtx());
    const a = await server.callTool('asset_operation', { action: 'get_animation_clips' });
    const b = await server.callTool('asset_operation', { action: 'get_materials' });
    expect(a.isError).toBe(true);
    expect(b.isError).toBe(true);
  });
});

describe('asset_operation — bridgePost actions', () => {
  it('create calls bridgePost /api/asset-db/create-asset', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));
    const result = await server.callTool('asset_operation', { action: 'create', url: 'db://assets/test.ts', content: 'code' });
    expect(result.isError).toBeFalsy();
    expect(bridgePost).toHaveBeenCalledWith('/api/asset-db/create-asset', { url: 'db://assets/test.ts', content: 'code' });
  });

  it('save calls bridgePost /api/asset-db/save-asset', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));
    const result = await server.callTool('asset_operation', { action: 'save', url: 'db://assets/test.ts', content: 'new code' });
    expect(result.isError).toBeFalsy();
    expect(bridgePost).toHaveBeenCalledWith('/api/asset-db/save-asset', { url: 'db://assets/test.ts', content: 'new code' });
  });

  it('delete calls bridgePost /api/asset-db/delete-asset', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));
    const result = await server.callTool('asset_operation', { action: 'delete', url: 'db://assets/old.png' });
    expect(result.isError).toBeFalsy();
    expect(bridgePost).toHaveBeenCalledWith('/api/asset-db/delete-asset', { url: 'db://assets/old.png' });
  });

  it('move calls bridgePost /api/asset-db/move-asset', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));
    const result = await server.callTool('asset_operation', { action: 'move', sourceUrl: 'db://assets/a.png', targetUrl: 'db://assets/b.png' });
    expect(result.isError).toBeFalsy();
    expect(bridgePost).toHaveBeenCalledWith('/api/asset-db/move-asset', { sourceUrl: 'db://assets/a.png', targetUrl: 'db://assets/b.png' });
  });

  it('import calls bridgePost /api/asset-db/import-asset', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));
    const result = await server.callTool('asset_operation', { action: 'import', sourcePath: 'C:/img.png', targetUrl: 'db://assets/img.png' });
    expect(result.isError).toBeFalsy();
    expect(bridgePost).toHaveBeenCalledWith('/api/asset-db/import-asset', { sourcePath: 'C:/img.png', targetUrl: 'db://assets/img.png' });
  });

  it('open calls bridgePost /api/asset-db/open-asset', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));
    const result = await server.callTool('asset_operation', { action: 'open', url: 'db://assets/hero.png' });
    expect(result.isError).toBeFalsy();
    expect(bridgePost).toHaveBeenCalledWith('/api/asset-db/open-asset', { url: 'db://assets/hero.png' });
  });

  it('refresh calls bridgePost /api/asset-db/refresh', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));
    const result = await server.callTool('asset_operation', { action: 'refresh' });
    expect(result.isError).toBeFalsy();
    expect(bridgePost).toHaveBeenCalledWith('/api/asset-db/refresh', expect.objectContaining({}));
  });

  it('create_folder calls bridgePost /api/asset-db/create-asset with null content', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));
    const result = await server.callTool('asset_operation', { action: 'create_folder', url: 'db://assets/prefabs' });
    expect(result.isError).toBeFalsy();
    expect(bridgePost).toHaveBeenCalledWith('/api/asset-db/create-asset', { url: 'db://assets/prefabs', content: null });
  });

  it('community edition rejects show_in_explorer', async () => {
    const server = buildCocosToolServer(makeCtx());
    const result = await server.callTool('asset_operation', { action: 'show_in_explorer', url: 'db://assets/hero.png' });
    expect(result.isError).toBe(true);
  });

  it('rename calls bridgePost /api/asset-db/move-asset', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));
    const result = await server.callTool('asset_operation', { action: 'rename', url: 'db://assets/old.png', newName: 'new.png' });
    expect(result.isError).toBeFalsy();
    expect(bridgePost).toHaveBeenCalledWith('/api/asset-db/move-asset', { sourceUrl: 'db://assets/old.png', targetUrl: 'db://assets/new.png' });
  });
});

describe('asset_operation — editorMsg (IPC) actions', () => {
  it('uuid_to_url calls editorMsg asset-db query-url', async () => {
    const editorMsg = vi.fn().mockResolvedValue('db://assets/hero.png');
    const server = buildCocosToolServer(makeCtx({ editorMsg }));
    const result = await server.callTool('asset_operation', { action: 'uuid_to_url', uuid: 'abc-123' });
    expect(result.isError).toBeFalsy();
    expect(editorMsg).toHaveBeenCalledWith('asset-db', 'query-url', 'abc-123');
  });

  it('url_to_uuid calls editorMsg asset-db query-uuid', async () => {
    const editorMsg = vi.fn().mockResolvedValue('abc-123');
    const server = buildCocosToolServer(makeCtx({ editorMsg }));
    const result = await server.callTool('asset_operation', { action: 'url_to_uuid', url: 'db://assets/hero.png' });
    expect(result.isError).toBeFalsy();
    expect(editorMsg).toHaveBeenCalledWith('asset-db', 'query-uuid', 'db://assets/hero.png');
  });

  it('community edition rejects Pro IPC actions', async () => {
    const server = buildCocosToolServer(makeCtx());
    const actions = ['reimport', 'get_dependencies', 'get_dependents', 'pack_atlas'] as const;
    for (const action of actions) {
      const result = await server.callTool('asset_operation', { action, url: 'db://assets/hero.png' });
      expect(result.isError).toBe(true);
    }
  });

  it('get_meta calls editorMsg asset-db query-asset-meta', async () => {
    const editorMsg = vi.fn().mockResolvedValue({ ver: '1.0', importer: 'image' });
    const server = buildCocosToolServer(makeCtx({ editorMsg }));
    const result = await server.callTool('asset_operation', { action: 'get_meta', url: 'db://assets/hero.png' });
    expect(result.isError).toBeFalsy();
    expect(editorMsg).toHaveBeenCalledWith('asset-db', 'query-asset-meta', 'db://assets/hero.png');
  });

  it('set_meta_property reads meta then saves', async () => {
    const editorMsg = vi.fn()
      .mockResolvedValueOnce({ ver: '1.0', userData: {} })
      .mockResolvedValueOnce(null);
    const server = buildCocosToolServer(makeCtx({ editorMsg }));
    const result = await server.callTool('asset_operation', { action: 'set_meta_property', url: 'db://assets/hero.png', property: 'ver', value: '2.0' });
    expect(result.isError).toBeFalsy();
    expect(editorMsg).toHaveBeenCalledWith('asset-db', 'query-asset-meta', 'db://assets/hero.png');
    expect(editorMsg).toHaveBeenCalledWith('asset-db', 'save-asset-meta', 'db://assets/hero.png', expect.any(String));
  });

  it('copy calls editorMsg copy-asset', async () => {
    const bridgeGet = vi.fn().mockResolvedValue({ uuid: 'src-uuid' });
    const editorMsg = vi.fn().mockResolvedValue(null);
    const server = buildCocosToolServer(makeCtx({ bridgeGet, editorMsg }));
    const result = await server.callTool('asset_operation', { action: 'copy', sourceUrl: 'db://assets/a.png', targetUrl: 'db://assets/b.png' });
    expect(result.isError).toBeFalsy();
    expect(editorMsg).toHaveBeenCalledWith('asset-db', 'copy-asset', 'db://assets/a.png', 'db://assets/b.png');
  });
});

describe('asset_operation — composite actions', () => {
  it('search_by_type filters by type', async () => {
    const bridgeGet = vi.fn().mockResolvedValue([
      { url: 'db://assets/a.png', type: 'cc.ImageAsset' },
      { url: 'db://assets/b.prefab', type: 'cc.Prefab' },
    ]);
    const server = buildCocosToolServer(makeCtx({ bridgeGet }));
    const result = await server.callTool('asset_operation', { action: 'search_by_type', type: 'cc.ImageAsset' });
    expect(result.isError).toBeFalsy();
    const data = parse(result);
    expect(data.count).toBe(1);
  });

  it('community edition rejects Pro composite actions', async () => {
    const server = buildCocosToolServer(makeCtx());
    const cases: Array<{ action: string; params?: Record<string, unknown> }> = [
      { action: 'clean_unused' },
      { action: 'validate_asset', params: { url: 'db://assets/hero.png' } },
      { action: 'export_asset_manifest' },
      { action: 'create_material', params: { url: 'db://assets/materials/Test.mtl' } },
      { action: 'generate_script', params: { url: 'db://assets/scripts/Player.ts', className: 'Player' } },
      { action: 'get_asset_size', params: { url: 'db://assets/hero.png' } },
      {
        action: 'slice_sprite',
        params: { url: 'db://assets/sprites/btn.png', borderTop: 10, borderBottom: 10, borderLeft: 10, borderRight: 10 },
      },
    ];
    for (const c of cases) {
      const result = await server.callTool('asset_operation', { action: c.action, ...(c.params ?? {}) });
      expect(result.isError).toBe(true);
    }
  });

  it('batch_import requires files array', async () => {
    const server = buildCocosToolServer(makeCtx());
    const result = await server.callTool('asset_operation', { action: 'batch_import', files: [] });
    expect(result.isError).toBe(true);
  });

  it('get_asset_size returns error when asset not found', async () => {
    const bridgeGet = vi.fn().mockResolvedValue(null);
    const server = buildCocosToolServer(makeCtx({ bridgeGet }));
    const result = await server.callTool('asset_operation', { action: 'get_asset_size', url: 'db://assets/missing.png' });
    expect(result.isError).toBe(true);
  });

  it('slice_sprite rejects all-zero borders', async () => {
    const server = buildCocosToolServer(makeCtx());
    const result = await server.callTool('asset_operation', {
      action: 'slice_sprite',
      url: 'db://assets/sprites/btn.png',
      borderTop: 0, borderBottom: 0, borderLeft: 0, borderRight: 0,
    });
    expect(result.isError).toBe(true);
  });

  it('exception in asset_operation returns error', async () => {
    const bridgeGet = vi.fn().mockRejectedValue(new Error('network error'));
    const server = buildCocosToolServer(makeCtx({ bridgeGet }));
    const result = await server.callTool('asset_operation', { action: 'list' });
    expect(result.isError).toBe(true);
    const data = parse(result);
    expect(data.error).toContain('network error');
  });
});
