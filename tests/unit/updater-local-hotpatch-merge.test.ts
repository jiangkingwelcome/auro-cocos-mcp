/**
 * 验证 applyLocalHotpatchMerge 与线上一致：单文件 JS 替换 + 事务提交后无 .upd-bak 残留
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, it, expect, afterEach } from 'vitest';
import { applyLocalHotpatchMerge } from '../../src/updater';

describe('applyLocalHotpatchMerge — 单 JS 文件热更合并', () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const d of dirs) {
      try {
        fs.rmSync(d, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
    }
    dirs.length = 0;
  });

  it('应用补丁目录中的 dist/*.js 覆盖插件内同路径文件', () => {
    const plugin = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-hp-plugin-'));
    const ext = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-hp-ext-'));
    dirs.push(plugin, ext);

    const rel = path.join('dist', 'hotpatch-smoke.js');
    const destFile = path.join(plugin, rel);
    const srcFile = path.join(ext, rel);
    fs.mkdirSync(path.dirname(destFile), { recursive: true });
    fs.mkdirSync(path.dirname(srcFile), { recursive: true });
    fs.writeFileSync(destFile, '// v1\n', 'utf8');
    fs.writeFileSync(srcFile, '// v2 HOTPATCH_MERGE_OK\n', 'utf8');

    const modified = applyLocalHotpatchMerge(ext, plugin);

    expect(fs.readFileSync(destFile, 'utf8')).toContain('HOTPATCH_MERGE_OK');
    expect(modified.map((p) => path.normalize(p))).toContain(path.normalize(destFile));
    expect(fs.existsSync(destFile + '.upd-bak')).toBe(false);
  });
});
