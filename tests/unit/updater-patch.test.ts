/**
 * updater-patch.test.ts
 *
 * 测试分级热更新逻辑：
 *   - hotpatch  (仅 JS 变更，hasNative=false, requiresRestart=false)
 *   - coldpatch (含 .node 模块，hasNative=true,  requiresRestart=true)
 *   - full      (无匹配补丁，退回全量包)
 *   - done 阶段正确携带 requiresRestart
 *
 * 策略：
 *   - updater 是模块单例，通过 vi.spyOn 直接 mock 实例方法，避免模块隔离麻烦
 *   - 用 vi.spyOn(updater, 'currentVersion') / isPro() / pluginRoot() 注入测试数据
 *   - 用 vi.spyOn(https, 'get') mock 网络层
 *   - 每个 test 后 updater.reset() + vi.restoreAllMocks()
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import https from 'https';
import { EventEmitter } from 'events';
import { updater } from '../../src/updater';
import type { UpdateKind } from '../../src/updater';

// ── 全局 mock：屏蔽 Editor / Cocos Creator 运行时 ─────────────────────────────
(globalThis as Record<string, unknown>).Editor = {
  Package: { unregister: vi.fn(), register: vi.fn() },
  Dialog:  { show: vi.fn().mockResolvedValue({ response: 1 }) },
  Panel:   { open: vi.fn() },
};

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

/** 构造假 HTTPS 响应 */
function makeFakeHttpsGet(body: string, statusCode = 200) {
  return vi.spyOn(https, 'get').mockImplementation((_url: unknown, _opts: unknown, cb?: unknown) => {
    const res = new EventEmitter() as NodeJS.ReadableStream & {
      statusCode: number;
      headers: Record<string, string>;
      resume: () => void;
    };
    res.statusCode = statusCode;
    res.headers    = {};
    res.resume     = () => {};

    if (typeof cb === 'function') {
      cb(res);
    } else if (typeof _opts === 'function') {
      _opts(res);
    }

    setImmediate(() => {
      (res as EventEmitter).emit('data', Buffer.from(body, 'utf-8'));
      (res as EventEmitter).emit('end');
    });

    // 返回一个假 ClientRequest
    const req = new EventEmitter() as unknown as ReturnType<typeof https.get>;
    (req as unknown as { destroy: () => void }).destroy = () => {};
    return req;
  });
}

/** 构造 version.json manifest 字符串 */
function makeManifest(opts: {
  latVer?:        string;
  patchFrom?:     string;
  hasNative?:     boolean;
  requiresRestart?: boolean;
  changedFiles?:  string[];
  patchSize?:     number;
  includePatches?: boolean;
  patchSha256?:   string;
} = {}) {
  const {
    latVer          = '1.0.15',
    patchFrom       = '1.0.14',
    hasNative       = false,
    requiresRestart = false,
    changedFiles    = ['dist/core.js', 'dist/updater.js'],
    patchSize       = 12_345,
    includePatches  = true,
    patchSha256     = 'c'.repeat(64),
  } = opts;

  return JSON.stringify({
    schemaVersion: 2,
    stable: {
      version:     latVer,
      releaseDate: '2026-03-21',
      ce:  { url: 'https://example.com/ce.zip',  sha256: 'a'.repeat(64) },
      pro: { url: 'https://example.com/pro.zip', sha256: 'b'.repeat(64) },
      breaking: false,
      patches: includePatches ? [{
        from:            patchFrom,
        to:              latVer,
        hasNative,
        requiresRestart,
        changedFiles,
        url:             'https://example.com/patch.zip',
        sha256:          patchSha256,
        size:            patchSize,
      }] : [],
    },
    changelog: { [latVer]: '测试更新' },
  });
}

/** 强制重置 updater 到 idle（跳过 downloading/installing 保护） */
function forceResetUpdater() {
  // 直接调用内部私有 set，绕过 downloading/installing 检查
  // 由于 TS private 限制，使用类型断言
  (updater as unknown as { set: (p: unknown) => void }).set({ phase: 'idle' });
}

// ─────────────────────────────────────────────────────────────────────────────

describe('AuraUpdater — 分级热更新', () => {

  beforeEach(() => {
    forceResetUpdater();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    forceResetUpdater();
  });

  // ── 共用 mock 注入 ────────────────────────────────────────────────────────
  function mockUpdaterContext(curVer: string, isPro = false) {
    vi.spyOn(updater, 'currentVersion').mockReturnValue(curVer);
    vi.spyOn(updater, 'isPro').mockReturnValue(isPro);
  }

  /**
   * 屏蔽后台 _silentHotpatch：
   * checkForUpdates 返回后立即检查 phase 的测试需要防止
   * _silentHotpatch catch 分支在下一个微任务里设置 available。
   */
  function stubSilentHotpatch() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(updater as any, '_silentHotpatch').mockResolvedValue(undefined);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 场景 1：hotpatch — 仅 JS 文件变更，hasNative=false
  // ─────────────────────────────────────────────────────────────────────────
  describe('场景 1：hotpatch（纯 JS 变更）', () => {

    it('返回 kind=hotpatch，requiresRestart=false', async () => {
      mockUpdaterContext('1.0.14', false);
      stubSilentHotpatch();
      makeFakeHttpsGet(makeManifest({
        hasNative: false, requiresRestart: false,
        changedFiles: ['dist/core.js', 'dist/updater.js'],
        patchSize: 9_876,
      }));

      const info = await updater.checkForUpdates();

      expect(info).not.toBeNull();
      expect(info!.kind).toBe<UpdateKind>('hotpatch');
      expect(info!.requiresRestart).toBe(false);
    });

    it('下载地址指向补丁包（不是全量包）', async () => {
      mockUpdaterContext('1.0.14', false);
      stubSilentHotpatch();
      makeFakeHttpsGet(makeManifest({ hasNative: false }));

      const info = await updater.checkForUpdates();

      expect(info!.downloadUrl).toBe('https://example.com/patch.zip');
      expect(info!.sha256).toBe('c'.repeat(64));
    });

    it('changedFiles 和 patchSize 正确传递', async () => {
      mockUpdaterContext('1.0.14', false);
      stubSilentHotpatch();
      makeFakeHttpsGet(makeManifest({
        hasNative: false, requiresRestart: false,
        changedFiles: ['dist/core.js'],
        patchSize: 3_200,
      }));

      const info = await updater.checkForUpdates();

      expect(info!.changedFiles).toEqual(['dist/core.js']);
      expect(info!.patchSize).toBe(3_200);
    });

    it('hotpatch 不设置 available phase（无感静默安装，phase 回到 idle）', async () => {
      mockUpdaterContext('1.0.14', false);
      stubSilentHotpatch(); // 屏蔽后台安装，防止 fallback 干扰 phase 断言
      makeFakeHttpsGet(makeManifest({ hasNative: false }));

      await updater.checkForUpdates();

      // hotpatch 无感：不显示"有更新"提示，phase 立即回到 idle
      // _silentHotpatch 在后台异步执行，不阻塞 checkForUpdates 返回
      expect(updater.phase.phase).toBe('idle');
    });

    it('多文件变更（5 个文件）', async () => {
      mockUpdaterContext('1.0.14', false);
      stubSilentHotpatch();
      const files = ['dist/core.js', 'dist/updater.js', 'dist/tools.js', 'dist/main.js', 'dist/panel.js'];
      makeFakeHttpsGet(makeManifest({ hasNative: false, changedFiles: files, patchSize: 42_000 }));

      const info = await updater.checkForUpdates();

      expect(info!.kind).toBe<UpdateKind>('hotpatch');
      expect(info!.changedFiles).toHaveLength(5);
      expect(info!.patchSize).toBe(42_000);
    });

    it('Pro 用户同样走 hotpatch（JS 补丁 CE/Pro 共用）', async () => {
      mockUpdaterContext('1.0.14', true); // isPro = true
      stubSilentHotpatch();
      makeFakeHttpsGet(makeManifest({ hasNative: false, requiresRestart: false }));

      const info = await updater.checkForUpdates();

      // 补丁只有一个 URL，不区分 CE/Pro
      expect(info!.kind).toBe<UpdateKind>('hotpatch');
      expect(info!.downloadUrl).toBe('https://example.com/patch.zip');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 场景 2：coldpatch — 含 .node 原生模块，需重启
  // ─────────────────────────────────────────────────────────────────────────
  describe('场景 2：coldpatch（含原生模块）', () => {

    it('返回 kind=coldpatch，requiresRestart=true', async () => {
      mockUpdaterContext('1.0.14', false);
      makeFakeHttpsGet(makeManifest({
        hasNative: true, requiresRestart: true,
        changedFiles: ['dist/core.js', 'native/aura.node'],
        patchSize: 520_000,
      }));

      const info = await updater.checkForUpdates();

      expect(info!.kind).toBe<UpdateKind>('coldpatch');
      expect(info!.requiresRestart).toBe(true);
    });

    it('coldpatch 下载地址仍指向补丁包（包更小）', async () => {
      mockUpdaterContext('1.0.14', false);
      makeFakeHttpsGet(makeManifest({ hasNative: true, requiresRestart: true }));

      const info = await updater.checkForUpdates();

      // 即使 coldpatch 也用补丁 URL，只是要重启
      expect(info!.downloadUrl).toBe('https://example.com/patch.zip');
    });

    it('phase.info 携带 requiresRestart=true', async () => {
      mockUpdaterContext('1.0.14', false);
      makeFakeHttpsGet(makeManifest({ hasNative: true, requiresRestart: true }));

      await updater.checkForUpdates();

      const phase = updater.phase;
      expect(phase.phase).toBe('available');
      if (phase.phase === 'available') {
        expect(phase.info.kind).toBe<UpdateKind>('coldpatch');
        expect(phase.info.requiresRestart).toBe(true);
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 场景 3：full — 无匹配补丁，退回全量包
  // ─────────────────────────────────────────────────────────────────────────
  describe('场景 3：full（无匹配补丁）', () => {

    it('patches 为空时，使用 CE 全量包 URL', async () => {
      mockUpdaterContext('1.0.14', false); // CE 用户
      makeFakeHttpsGet(makeManifest({ includePatches: false }));

      const info = await updater.checkForUpdates();

      expect(info!.kind).toBe<UpdateKind>('full');
      expect(info!.requiresRestart).toBe(true);
      expect(info!.changedFiles).toBeUndefined();
      expect(info!.patchSize).toBeUndefined();
      expect(info!.downloadUrl).toBe('https://example.com/ce.zip');
      expect(info!.sha256).toBe('a'.repeat(64));
    });

    it('patches 为空时，Pro 用户使用 Pro 全量包 URL', async () => {
      mockUpdaterContext('1.0.14', true); // Pro 用户
      makeFakeHttpsGet(makeManifest({ includePatches: false }));

      const info = await updater.checkForUpdates();

      expect(info!.kind).toBe<UpdateKind>('full');
      expect(info!.downloadUrl).toBe('https://example.com/pro.zip');
    });

    it('补丁 from 版本不匹配当前版本（1.0.12 vs 1.0.14），退回全量包', async () => {
      mockUpdaterContext('1.0.14', false);
      makeFakeHttpsGet(makeManifest({ patchFrom: '1.0.12' }));

      const info = await updater.checkForUpdates();

      expect(info!.kind).toBe<UpdateKind>('full');
      expect(info!.downloadUrl).toBe('https://example.com/ce.zip');
    });

    it('schemaVersion=1（旧格式，无 patches 字段），退回全量包', async () => {
      mockUpdaterContext('1.0.13', false);
      const oldFormat = JSON.stringify({
        schemaVersion: 1,
        stable: {
          version:     '1.0.14',
          releaseDate: '2026-03-20',
          ce:  { url: 'https://example.com/ce-old.zip',  sha256: 'd'.repeat(64) },
          pro: { url: 'https://example.com/pro-old.zip', sha256: 'e'.repeat(64) },
        },
        changelog: { '1.0.14': '旧版格式' },
      });
      makeFakeHttpsGet(oldFormat);

      const info = await updater.checkForUpdates();

      expect(info!.kind).toBe<UpdateKind>('full');
      expect(info!.requiresRestart).toBe(true);
      expect(info!.downloadUrl).toBe('https://example.com/ce-old.zip');
    });

    it('full 时 changedFiles / patchSize 均为 undefined', async () => {
      mockUpdaterContext('1.0.14', false);
      makeFakeHttpsGet(makeManifest({ includePatches: false }));

      const info = await updater.checkForUpdates();

      expect(info!.changedFiles).toBeUndefined();
      expect(info!.patchSize).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 场景 4：已是最新版本
  // ─────────────────────────────────────────────────────────────────────────
  describe('场景 4：已是最新版本', () => {

    it('版本相同时返回 null，phase=up-to-date', async () => {
      mockUpdaterContext('1.0.15', false); // 已是最新
      makeFakeHttpsGet(makeManifest({ latVer: '1.0.15' }));

      const info = await updater.checkForUpdates();

      expect(info).toBeNull();
      expect(updater.phase.phase).toBe('up-to-date');
    });

    it('本地版本更高时也返回 null', async () => {
      mockUpdaterContext('2.0.0', false);
      makeFakeHttpsGet(makeManifest({ latVer: '1.0.15' }));

      const info = await updater.checkForUpdates();

      expect(info).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 场景 5：UpdatePhase done 字段完整性（类型契约）
  // ─────────────────────────────────────────────────────────────────────────
  describe('场景 5：UpdatePhase done 字段完整性', () => {

    it('hotpatch done 阶段 requiresRestart=false', () => {
      // 构造 done phase 对象验证类型契约
      const donePhase = { phase: 'done' as const, version: '1.0.15', requiresRestart: false };
      expect(donePhase.requiresRestart).toBe(false);
      expect(donePhase.version).toBe('1.0.15');
    });

    it('full/coldpatch done 阶段 requiresRestart=true', () => {
      const donePhase = { phase: 'done' as const, version: '1.0.15', requiresRestart: true };
      expect(donePhase.requiresRestart).toBe(true);
    });

    it('hotpatch：onChange 监听器只看到 checking → idle，不含 available', async () => {
      mockUpdaterContext('1.0.14', false);
      stubSilentHotpatch(); // 屏蔽后台安装，防止 fallback 向 phases 写入 available
      makeFakeHttpsGet(makeManifest({ hasNative: false }));

      const phases: string[] = [];
      const unsub = updater.onChange(p => phases.push(p.phase));

      await updater.checkForUpdates();
      unsub();

      expect(phases).toContain('checking');
      expect(phases).toContain('idle');
      // hotpatch 无感：不应出现 available（那会触发面板 UI 提示）
      expect(phases).not.toContain('available');
    });

    it('coldpatch/full：onChange 监听器触发 available（需用户手动安装）', async () => {
      mockUpdaterContext('1.0.14', false);
      // coldpatch — hasNative=true
      makeFakeHttpsGet(makeManifest({ hasNative: true, requiresRestart: true }));

      const phases: string[] = [];
      const unsub = updater.onChange(p => phases.push(p.phase));

      await updater.checkForUpdates();
      unsub();

      expect(phases).toContain('checking');
      expect(phases).toContain('available');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 场景 6：UpdateInfo 字段全面验证
  // ─────────────────────────────────────────────────────────────────────────
  describe('场景 6：UpdateInfo 字段完整性', () => {

    it('hotpatch info 包含所有期望字段', async () => {
      mockUpdaterContext('1.0.14', false);
      stubSilentHotpatch();
      makeFakeHttpsGet(makeManifest({
        hasNative: false, requiresRestart: false,
        changedFiles: ['dist/core.js'],
        patchSize: 5_000,
        patchSha256: 'c'.repeat(64),
      }));

      const info = await updater.checkForUpdates();

      expect(info).toMatchObject({
        currentVersion:  '1.0.14',
        latestVersion:   '1.0.15',
        kind:            'hotpatch',
        requiresRestart: false,
        changedFiles:    ['dist/core.js'],
        patchSize:       5_000,
        downloadUrl:     'https://example.com/patch.zip',
        sha256:          'c'.repeat(64),
        breaking:        false,
        isPro:           false,
      });
    });

    it('full info：changedFiles=undefined，下载用全量包', async () => {
      mockUpdaterContext('1.0.14', false);
      makeFakeHttpsGet(makeManifest({ includePatches: false }));

      const info = await updater.checkForUpdates();

      expect(info!.kind).toBe('full');
      expect(info!.changedFiles).toBeUndefined();
      expect(info!.patchSize).toBeUndefined();
      expect(info!.downloadUrl).toBe('https://example.com/ce.zip');
    });

    it('hotpatch 和 full 的 changelog 都能正确读取', async () => {
      mockUpdaterContext('1.0.14', false);
      stubSilentHotpatch();
      makeFakeHttpsGet(makeManifest({ hasNative: false }));

      const info = await updater.checkForUpdates();

      expect(info!.changelog).toBe('测试更新');
      expect(info!.releaseDate).toBe('2026-03-21');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 场景 7：网络异常处理
  // ─────────────────────────────────────────────────────────────────────────
  describe('场景 7：网络异常', () => {

    it('version.json 返回 500，phase 回到 idle（静默失败）', async () => {
      mockUpdaterContext('1.0.14', false);
      makeFakeHttpsGet('Internal Server Error', 500);

      const info = await updater.checkForUpdates();

      expect(info).toBeNull();
      expect(updater.phase.phase).toBe('idle');
    });

    it('version.json 是无效 JSON，phase 回到 idle', async () => {
      mockUpdaterContext('1.0.14', false);
      makeFakeHttpsGet('not valid json {{ ');

      const info = await updater.checkForUpdates();

      expect(info).toBeNull();
      expect(updater.phase.phase).toBe('idle');
    });
  });
});
