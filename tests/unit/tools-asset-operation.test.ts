import { describe, it, expect, vi } from 'vitest';
import { buildCocosToolServer, type BridgeToolContext } from '../../src/mcp/tools';
import type { ToolCallResult } from '../../src/mcp/local-tool-server';

function makeCtx(overrides: Partial<BridgeToolContext> = {}): BridgeToolContext {
  return {
    bridgeGet: vi.fn().mockResolvedValue({}),
    bridgePost: vi.fn().mockResolvedValue({}),
    sceneMethod: vi.fn().mockResolvedValue({ success: true }),
    editorMsg: vi.fn().mockResolvedValue({}),
    text: (data: unknown, isError?: boolean): ToolCallResult => ({
      content: [{ type: 'text', text: JSON.stringify(data) }],
      ...(isError !== undefined ? { isError } : {}),
    }),
    ...overrides,
  };
}

function parse(result: ToolCallResult): unknown {
  return JSON.parse(result.content[0].text);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. bridgeGet 类 actions（list / info / get_selection / project_info）
// ─────────────────────────────────────────────────────────────────────────────
describe('asset_operation — bridgeGet actions', () => {
  it('list 调用 /api/asset-db/query-assets', async () => {
    const bridgeGet = vi.fn().mockResolvedValue({ assets: [] });
    const server = buildCocosToolServer(makeCtx({ bridgeGet }));

    const result = await server.callTool('asset_operation', { action: 'list' });
    expect(result.isError).toBeFalsy();
    expect(bridgeGet).toHaveBeenCalledWith('/api/asset-db/query-assets', expect.objectContaining({ pattern: expect.any(String) }));
  });

  it('list 可以指定自定义 pattern', async () => {
    const bridgeGet = vi.fn().mockResolvedValue({ assets: [] });
    const server = buildCocosToolServer(makeCtx({ bridgeGet }));

    await server.callTool('asset_operation', { action: 'list', pattern: 'db://assets/prefabs/**' });
    expect(bridgeGet).toHaveBeenCalledWith('/api/asset-db/query-assets', { pattern: 'db://assets/prefabs/**' });
  });

  it('info 调用 /api/asset-db/query-asset-info', async () => {
    const bridgeGet = vi.fn().mockResolvedValue({ uuid: 'abc', url: 'db://assets/foo.ts' });
    const server = buildCocosToolServer(makeCtx({ bridgeGet }));

    await server.callTool('asset_operation', { action: 'info', url: 'db://assets/foo.ts' });
    expect(bridgeGet).toHaveBeenCalledWith('/api/asset-db/query-asset-info', { url: 'db://assets/foo.ts' });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. bridgePost 类 actions
// ─────────────────────────────────────────────────────────────────────────────
describe('asset_operation — bridgePost actions', () => {
  it('create 调用 /api/asset-db/create-asset', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));

    await server.callTool('asset_operation', { action: 'create', url: 'db://assets/foo.ts', content: 'export {}' });
    expect(bridgePost).toHaveBeenCalledWith('/api/asset-db/create-asset', {
      url: 'db://assets/foo.ts',
      content: 'export {}',
    });
  });

  it('save 调用 /api/asset-db/save-asset', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));

    await server.callTool('asset_operation', { action: 'save', url: 'db://assets/foo.ts', content: 'new content' });
    expect(bridgePost).toHaveBeenCalledWith('/api/asset-db/save-asset', {
      url: 'db://assets/foo.ts',
      content: 'new content',
    });
  });

  it('delete 调用 /api/asset-db/delete-asset', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));

    await server.callTool('asset_operation', { action: 'delete', url: 'db://assets/old.ts' });
    expect(bridgePost).toHaveBeenCalledWith('/api/asset-db/delete-asset', { url: 'db://assets/old.ts' });
  });

  it('move 调用 /api/asset-db/move-asset', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));

    await server.callTool('asset_operation', {
      action: 'move',
      sourceUrl: 'db://assets/a.ts',
      targetUrl: 'db://assets/b.ts',
    });
    expect(bridgePost).toHaveBeenCalledWith('/api/asset-db/move-asset', {
      sourceUrl: 'db://assets/a.ts',
      targetUrl: 'db://assets/b.ts',
    });
  });

  it('import 调用 /api/asset-db/import-asset', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));

    await server.callTool('asset_operation', {
      action: 'import',
      sourcePath: 'C:/images/icon.png',
      targetUrl: 'db://assets/textures/icon.png',
    });
    expect(bridgePost).toHaveBeenCalledWith('/api/asset-db/import-asset', {
      sourcePath: 'C:/images/icon.png',
      targetUrl: 'db://assets/textures/icon.png',
    });
  });

  it('refresh 调用 /api/asset-db/refresh', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));

    await server.callTool('asset_operation', { action: 'refresh', url: 'db://assets/prefabs' });
    expect(bridgePost).toHaveBeenCalledWith('/api/asset-db/refresh', { url: 'db://assets/prefabs' });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. editorMsg 类 actions
// ─────────────────────────────────────────────────────────────────────────────
describe('asset_operation — editorMsg actions', () => {
  it('uuid_to_url 调用 editorMsg("asset-db", "query-url")', async () => {
    const editorMsg = vi.fn().mockResolvedValue('db://assets/foo.ts');
    const server = buildCocosToolServer(makeCtx({ editorMsg }));

    await server.callTool('asset_operation', { action: 'uuid_to_url', uuid: 'some-uuid' });
    expect(editorMsg).toHaveBeenCalledWith('asset-db', 'query-url', 'some-uuid');
  });

  it('url_to_uuid 调用 editorMsg("asset-db", "query-uuid")', async () => {
    const editorMsg = vi.fn().mockResolvedValue('some-uuid');
    const server = buildCocosToolServer(makeCtx({ editorMsg }));

    await server.callTool('asset_operation', { action: 'url_to_uuid', url: 'db://assets/foo.ts' });
    expect(editorMsg).toHaveBeenCalledWith('asset-db', 'query-uuid', 'db://assets/foo.ts');
  });

  it.skip('reimport 调用 editorMsg("asset-db", "reimport-asset")', async () => {
    const editorMsg = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ editorMsg }));

    await server.callTool('asset_operation', { action: 'reimport', url: 'db://assets/foo.ts' });
    expect(editorMsg).toHaveBeenCalledWith('asset-db', 'reimport-asset', 'db://assets/foo.ts');
  });

  it('create_folder 调用 /api/asset-db/create-asset', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));

    await server.callTool('asset_operation', { action: 'create_folder', url: 'db://assets/newfolder' });
    expect(bridgePost).toHaveBeenCalledWith('/api/asset-db/create-asset', {
      url: 'db://assets/newfolder',
      content: null,
    });
  });

  it.skip('get_dependencies 调用 editorMsg("asset-db", "query-asset-dependencies")', async () => {
    const editorMsg = vi.fn().mockResolvedValue([]);
    const server = buildCocosToolServer(makeCtx({ editorMsg }));

    await server.callTool('asset_operation', { action: 'get_dependencies', url: 'db://assets/foo.ts' });
    expect(editorMsg).toHaveBeenCalledWith('asset-db', 'query-asset-dependencies', 'db://assets/foo.ts');
  });

  it.skip('get_dependents 调用 editorMsg("asset-db", "query-dependents")', async () => {
    const editorMsg = vi.fn().mockResolvedValue([]);
    const server = buildCocosToolServer(makeCtx({ editorMsg }));

    await server.callTool('asset_operation', { action: 'get_dependents', url: 'db://assets/foo.ts' });
    expect(editorMsg).toHaveBeenCalledWith('asset-db', 'query-dependents', 'db://assets/foo.ts');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. 复合逻辑 actions
// ─────────────────────────────────────────────────────────────────────────────
describe('asset_operation — 复合逻辑 actions', () => {
  it('copy 缺少参数时返回 isError', async () => {
    const server = buildCocosToolServer(makeCtx());

    const result = await server.callTool('asset_operation', { action: 'copy' });
    expect(result.isError).toBe(true);
    const data = parse(result) as any;
    expect(data.error).toContain('sourceUrl');
  });

  it('copy 正常调用 bridgeGet 校验源资源并通过 editorMsg copy-asset', async () => {
    const bridgeGet = vi.fn().mockResolvedValue({ uuid: 'src-uuid' });
    const editorMsg = vi.fn()
      .mockResolvedValueOnce({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgeGet, editorMsg }));

    const result = await server.callTool('asset_operation', {
      action: 'copy',
      sourceUrl: 'db://assets/a.prefab',
      targetUrl: 'db://assets/b.prefab',
    });
    expect(result.isError).toBeFalsy();
    expect(bridgeGet).toHaveBeenCalledWith('/api/asset-db/query-asset-info', { url: 'db://assets/a.prefab' });
    expect(editorMsg).toHaveBeenCalledWith('asset-db', 'copy-asset', 'db://assets/a.prefab', 'db://assets/b.prefab');
  });

  it('copy 源不存在时返回 isError', async () => {
    const bridgeGet = vi.fn().mockResolvedValue(null);
    const editorMsg = vi.fn();
    const server = buildCocosToolServer(makeCtx({ bridgeGet, editorMsg }));

    const result = await server.callTool('asset_operation', {
      action: 'copy',
      sourceUrl: 'db://assets/notexist.prefab',
      targetUrl: 'db://assets/target.prefab',
    });
    expect(result.isError).toBe(true);
    const data = parse(result) as any;
    expect(data.error).toContain('notexist');
    expect(editorMsg).not.toHaveBeenCalled();
  });

  it('rename 缺少 newName 时返回 isError', async () => {
    const server = buildCocosToolServer(makeCtx());

    const result = await server.callTool('asset_operation', { action: 'rename', url: 'db://assets/foo.ts' });
    expect(result.isError).toBe(true);
  });

  it('rename 正确拼接新路径并调用 /api/asset-db/move-asset', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true });
    const server = buildCocosToolServer(makeCtx({ bridgePost }));

    const result = await server.callTool('asset_operation', {
      action: 'rename',
      url: 'db://assets/scripts/old.ts',
      newName: 'new.ts',
    });
    expect(result.isError).toBeFalsy();
    expect(bridgePost).toHaveBeenCalledWith('/api/asset-db/move-asset', {
      sourceUrl: 'db://assets/scripts/old.ts',
      targetUrl: 'db://assets/scripts/new.ts',
    });
  });

  it.skip('clean_unused 返回只读扫描结果（非 isError）', async () => {
    const bridgeGet = vi.fn().mockResolvedValue([]);
    const editorMsg = vi.fn();
    const server = buildCocosToolServer(makeCtx({ bridgeGet, editorMsg }));

    const result = await server.callTool('asset_operation', { action: 'clean_unused' });
    expect(result.isError).toBeFalsy();
    const data = parse(result) as any;
    expect(data.status).toBe('completed');
    expect(data.potentiallyUnusedCount).toBe(0);
    expect(data.warning).toContain('人工审核');
    expect(editorMsg).not.toHaveBeenCalled();
  });

  it('search_by_type 过滤 type 字段', async () => {
    const bridgeGet = vi.fn().mockResolvedValue([
      { type: 'cc.Prefab', url: 'db://assets/foo.prefab' },
      { type: 'cc.Texture2D', url: 'db://assets/bar.png' },
    ]);
    const server = buildCocosToolServer(makeCtx({ bridgeGet }));

    const result = await server.callTool('asset_operation', { action: 'search_by_type', type: 'Prefab' });
    const data = parse(result) as any;
    expect(data.count).toBe(1);
    expect(data.assets[0].type).toContain('Prefab');
  });

  it.skip('get_animation_clips 使用 .anim 模式', async () => {
    const bridgeGet = vi.fn().mockResolvedValue([]);
    const server = buildCocosToolServer(makeCtx({ bridgeGet }));

    await server.callTool('asset_operation', { action: 'get_animation_clips' });
    expect(bridgeGet).toHaveBeenCalledWith('/api/asset-db/query-assets', { pattern: 'db://assets/**/*.anim' });
  });

  it.skip('get_materials 使用 .mtl 模式', async () => {
    const bridgeGet = vi.fn().mockResolvedValue([]);
    const server = buildCocosToolServer(makeCtx({ bridgeGet }));

    await server.callTool('asset_operation', { action: 'get_materials' });
    expect(bridgeGet).toHaveBeenCalledWith('/api/asset-db/query-assets', { pattern: 'db://assets/**/*.mtl' });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. 路径透传（CASE_NORMALIZE_MAP 已清空，路径原样保留）
// ─────────────────────────────────────────────────────────────────────────────
describe('asset_operation — 路径透传', () => {
  it('url 字段大写路径段原样透传（无规范化）', async () => {
    const bridgeGet = vi.fn().mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ bridgeGet }));

    const result = await server.callTool('asset_operation', {
      action: 'info',
      url: 'db://assets/Prefabs/Hero.prefab',
    });
    // bridgeGet 收到原始路径
    expect(bridgeGet).toHaveBeenCalledWith('/api/asset-db/query-asset-info', {
      url: 'db://assets/Prefabs/Hero.prefab',
    });
  });

  it('move 的 sourceUrl / targetUrl 原样透传', async () => {
    const bridgePost = vi.fn().mockResolvedValue({});
    const server = buildCocosToolServer(makeCtx({ bridgePost }));

    await server.callTool('asset_operation', {
      action: 'move',
      sourceUrl: 'db://assets/Prefabs/a.prefab',
      targetUrl: 'db://assets/Scripts/a.ts',
    });
    expect(bridgePost).toHaveBeenCalledWith('/api/asset-db/move-asset', {
      sourceUrl: 'db://assets/Prefabs/a.prefab',
      targetUrl: 'db://assets/Scripts/a.ts',
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. 异常处理
// ─────────────────────────────────────────────────────────────────────────────
describe('asset_operation — 异常处理', () => {
  it('bridgeGet 抛出异常时返回 isError', async () => {
    const bridgeGet = vi.fn().mockRejectedValue(new Error('网络错误'));
    const server = buildCocosToolServer(makeCtx({ bridgeGet }));

    const result = await server.callTool('asset_operation', { action: 'list' });
    expect(result.isError).toBe(true);
    const data = parse(result) as any;
    expect(data.tool).toBe('asset_operation');
    expect(data.error).toContain('网络错误');
  });
});
