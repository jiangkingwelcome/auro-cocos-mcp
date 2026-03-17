import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

const MOCK_PROJECT_PATH = '/mock/project';
const MOCK_PROJECT_NAME = 'MockProject';

(globalThis as Record<string, unknown>).Editor = {
  Project: { path: MOCK_PROJECT_PATH, name: MOCK_PROJECT_NAME },
};

describe('registry', () => {
  let tmpDir: string;
  let registryFile: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-reg-'));
    registryFile = path.join(tmpDir, '.aura-ports.json');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('updateRegistry creates registry file', async () => {
    vi.doMock('os', async (importOriginal) => {
      const orig = await importOriginal<typeof import('os')>();
      return { ...orig, default: { ...orig, homedir: () => tmpDir }, homedir: () => tmpDir };
    });
    const { updateRegistry } = await import('../../src/registry');
    updateRegistry(7779, 'test-token');
    expect(fs.existsSync(registryFile)).toBe(true);
    const reg = JSON.parse(fs.readFileSync(registryFile, 'utf-8'));
    expect(reg[MOCK_PROJECT_PATH]).toBeDefined();
    expect(reg[MOCK_PROJECT_PATH].port).toBe(7779);
    expect(reg[MOCK_PROJECT_PATH].token).toBe('test-token');
    expect(reg[MOCK_PROJECT_PATH].pid).toBe(process.pid);
    vi.doUnmock('os');
  });

  it('removeRegistry is callable and does not throw', async () => {
    vi.doMock('os', async (importOriginal) => {
      const orig = await importOriginal<typeof import('os')>();
      return { ...orig, default: { ...orig, homedir: () => tmpDir }, homedir: () => tmpDir };
    });
    const { removeRegistry } = await import('../../src/registry');
    expect(() => removeRegistry()).not.toThrow();
    vi.doUnmock('os');
  });

  it('removeRegistry does not remove entry with different pid', async () => {
    fs.writeFileSync(registryFile, JSON.stringify({
      [MOCK_PROJECT_PATH]: { name: MOCK_PROJECT_NAME, port: 7779, token: 't', pid: 123456, timestamp: 1 },
    }));
    vi.doMock('os', async (importOriginal) => {
      const orig = await importOriginal<typeof import('os')>();
      return { ...orig, default: { ...orig, homedir: () => tmpDir }, homedir: () => tmpDir };
    });
    const { removeRegistry } = await import('../../src/registry');
    removeRegistry();
    const reg = JSON.parse(fs.readFileSync(registryFile, 'utf-8'));
    expect(reg[MOCK_PROJECT_PATH]).toBeDefined();
    vi.doUnmock('os');
  });

  it('removeRegistry handles missing file', async () => {
    vi.doMock('os', async (importOriginal) => {
      const orig = await importOriginal<typeof import('os')>();
      return { ...orig, default: { ...orig, homedir: () => tmpDir }, homedir: () => tmpDir };
    });
    const { removeRegistry } = await import('../../src/registry');
    expect(() => removeRegistry()).not.toThrow();
    vi.doUnmock('os');
  });
});
