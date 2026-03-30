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
        callback(new Error('not found'), '', '');
        return {} as never;
      })
      .mockImplementationOnce((_command, _options, callback) => {
        callback(null, 'ok', '');
        return {} as never;
      });

    const result = await configureIDE('claude-code', 5566, true);

    expect(result.success).toBe(true);
    expect(execMock).toHaveBeenNthCalledWith(
      1,
      'claude mcp remove --scope user aura-cocos',
      expect.objectContaining({ encoding: 'utf-8', timeout: 10000 }),
      expect.any(Function),
    );
    expect(execMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('claude mcp add --scope user aura-cocos'),
      expect.objectContaining({ encoding: 'utf-8', timeout: 10000 }),
      expect.any(Function),
    );
  });

  it('removeIDE for claude-code removes all known server keys', async () => {
    execMock.mockImplementation((_command, _options, callback) => {
      callback(null, 'ok', '');
      return {} as never;
    });

    const result = await removeIDE('claude-code');

    expect(result.success).toBe(true);
    expect(execMock).toHaveBeenCalledTimes(4);
    expect(execMock.mock.calls[0][0]).toContain('aura-cocos');
    expect(execMock.mock.calls[1][0]).toContain('aura-for-cocos');
    expect(execMock.mock.calls[2][0]).toContain('cocos-bridge-ai-mcp');
    expect(execMock.mock.calls[3][0]).toContain('cocos-mcp-bridge');
  });
});
