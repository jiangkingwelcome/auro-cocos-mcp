import fs from 'fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/routes/route-types', async () => {
  const actual = await vi.importActual<typeof import('../../src/routes/route-types')>('../../src/routes/route-types');
  return {
    ...actual,
    ipc: vi.fn(),
  };
});

import { registerAssetDbRoutes } from '../../src/routes/asset-db-routes';
import { ipc } from '../../src/routes/route-types';

type RouteHandler = (params: Record<string, string>, body: unknown) => Promise<unknown>;

function setupRoutes() {
  const gets = new Map<string, RouteHandler>();
  const posts = new Map<string, RouteHandler>();
  registerAssetDbRoutes(
    (path, handler) => { gets.set(path, handler); },
    (path, handler) => { posts.set(path, handler); },
  );
  return { gets, posts };
}

describe('asset-db routes — import-asset semantics', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(ipc).mockReset();
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'statSync').mockReturnValue({ isFile: () => true } as fs.Stats);
  });

  it('源文件不存在时返回 success:false', async () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    const { posts } = setupRoutes();

    const result = await posts.get('/api/asset-db/import-asset')!(
      {},
      { sourcePath: 'C:/missing.png', targetUrl: 'db://assets/textures/missing.png' },
    ) as Record<string, unknown>;

    expect(result.success).toBe(false);
    expect(result.error).toBe('源文件不存在: C:/missing.png');
  });

  it('导入结果不明确且目标资源原本已存在时返回 success:false', async () => {
    const { posts } = setupRoutes();
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'statSync').mockReturnValue({ isFile: () => true } as fs.Stats);
    vi.mocked(ipc)
      .mockResolvedValueOnce({ uuid: 'existing-uuid', url: 'db://assets/textures/icon.png' })
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ uuid: 'existing-uuid', url: 'db://assets/textures/icon.png' });

    const result = await posts.get('/api/asset-db/import-asset')!(
      {},
      { sourcePath: 'C:/images/icon.png', targetUrl: 'db://assets/textures/icon.png' },
    ) as Record<string, unknown>;

    expect(result.success).toBe(false);
    expect(String(result.error)).toContain('导入前已存在');
  });

  it('导入结果不明确但目标资源从无到有时返回 success:true', async () => {
    const { posts } = setupRoutes();
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'statSync').mockReturnValue({ isFile: () => true } as fs.Stats);
    vi.mocked(ipc)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ uuid: 'new-uuid', url: 'db://assets/textures/icon.png' });

    const result = await posts.get('/api/asset-db/import-asset')!(
      {},
      { sourcePath: 'C:/images/icon.png', targetUrl: 'db://assets/textures/icon.png' },
    ) as Record<string, unknown>;

    expect(result.success).toBe(true);
    expect(result.info).toEqual({ uuid: 'new-uuid', url: 'db://assets/textures/icon.png' });
  });
});
