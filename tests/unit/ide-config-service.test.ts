import { beforeEach, describe, expect, it, vi } from 'vitest';

const execMock = vi.fn();

vi.mock('child_process', () => ({
  exec: (...args: unknown[]) => execMock(...args),
}));

import {
  configureIDE,
  getConfigStatus,
  invalidateConfigStatusCache,
  removeIDE,
} from '../../src/ide-config-service';

describe('ide-config-service', () => {
  beforeEach(() => {
    execMock.mockReset();
    invalidateConfigStatusCache();
  });

  it('recognizes aura-for-cocos in Claude Code MCP list output', () => {
    execMock.mockImplementation((_command, _options, callback) => {
      callback(null, 'aura-for-cocos\n', '');
      return {} as never;
    });

    const status = getConfigStatus();
    expect(status['claude-code']).toBe(true);
  });

  it('configureIDE for claude-code uses async CLI registration flow', async () => {
    execMock
      .mockImplementationOnce((_command, _options, callback) => {
        // resolveClaudeCommand: where.exe claude.cmd → found
        callback(null, 'C:\\npm\\claude.cmd\r\n', '');
        return {} as never;
      })
      .mockImplementationOnce((_command, _options, callback) => {
        // claude mcp remove → not found (ignored)
        callback(new Error('not found'), '', '');
        return {} as never;
      })
      .mockImplementationOnce((_command, _options, callback) => {
        // claude mcp add → success
        callback(null, 'ok', '');
        return {} as never;
      });

    const result = await configureIDE('claude-code', 5566, true);

    expect(result.success).toBe(true);
    // call[0] = where.exe, call[1] = mcp remove, call[2] = mcp add
    expect(execMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('mcp remove --scope user aura-cocos'),
      expect.objectContaining({ encoding: 'utf-8', timeout: 10000 }),
      expect.any(Function),
    );
    expect(execMock).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('mcp add --scope user aura-cocos'),
      expect.objectContaining({ encoding: 'utf-8', timeout: 10000 }),
      expect.any(Function),
    );
  });

  it('removeIDE for claude-code removes all known server keys', async () => {
    execMock.mockImplementation((_command, _options, callback) => {
      // resolveClaudeCommand (where.exe) + 4 remove calls
      callback(null, 'C:\\npm\\claude.cmd\r\n', '');
      return {} as never;
    });

    const result = await removeIDE('claude-code');

    expect(result.success).toBe(true);
    // call[0] = where.exe claude.cmd, calls[1..4] = mcp remove for each key
    expect(execMock).toHaveBeenCalledTimes(5);
    expect(execMock.mock.calls[1][0]).toContain('aura-cocos');
    expect(execMock.mock.calls[2][0]).toContain('aura-for-cocos');
    expect(execMock.mock.calls[3][0]).toContain('cocos-bridge-ai-mcp');
    expect(execMock.mock.calls[4][0]).toContain('cocos-mcp-bridge');
  });
});
