import { describe, expect, it, vi } from 'vitest';
import { buildCocosToolServer, type BridgeToolContext } from '../../src/mcp/tools';
import type { ToolCallResult } from '../../src/mcp/local-tool-server';
import { executeTransaction } from '../../src/operation-manager';

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

describe('stability fixes — editor_action semantics', () => {
  it('play_in_editor 调用预览启动接口，而不是进入 prefab 编辑模式', async () => {
    const bridgePost = vi.fn().mockResolvedValue({ success: true, platform: 'browser' });
    const editorMsg = vi.fn();
    const server = buildCocosToolServer(makeCtx({ bridgePost, editorMsg }));

    const result = await server.callTool('editor_action', { action: 'play_in_editor' });
    expect(result.isError).toBeFalsy();
    expect(bridgePost).toHaveBeenCalledWith('/api/preview/open');
  });
});

describe('stability fixes — preferences scope fallback', () => {
  it('get_global 在 IPC 失败时保留 global scope', async () => {
    const editorMsg = vi.fn().mockRejectedValue(new Error('IPC unavailable'));
    const bridgeGet = vi.fn().mockResolvedValue({ success: true, scope: 'global', key: 'general.theme', value: 'dark' });
    const server = buildCocosToolServer(makeCtx({ editorMsg, bridgeGet }));

    const result = await server.callTool('preferences', { action: 'get_global', key: 'general.theme' });
    expect(result.isError).toBeFalsy();
    expect(bridgeGet).toHaveBeenCalledWith('/api/preferences/get', { key: 'general.theme', scope: 'global' });
  });

  it('set_project 在 IPC 失败时保留 project scope', async () => {
    const editorMsg = vi.fn().mockRejectedValue(new Error('IPC unavailable'));
    const bridgePost = vi.fn().mockResolvedValue({ success: true, scope: 'project', key: 'preview.port', value: 7456 });
    const server = buildCocosToolServer(makeCtx({ editorMsg, bridgePost }));

    const result = await server.callTool('preferences', { action: 'set_project', key: 'preview.port', value: 7456 });
    expect(result.isError).toBeFalsy();
    expect(bridgePost).toHaveBeenCalledWith('/api/preferences/set', { key: 'preview.port', value: 7456, scope: 'project' });
  });
});

describe('stability fixes — batch import guardrails', () => {
  it('batch_import 在社区版返回 isError（未开放）', async () => {
    const server = buildCocosToolServer(makeCtx());

    const result = await server.callTool('asset_operation', {
      action: 'batch_import',
      files: [
        { sourcePath: 'C:/temp/a.png', targetUrl: 'db://assets/textures/a.png' },
        { sourcePath: 'C:/temp/b.png', targetUrl: 'db://assets/textures/a.png' },
      ],
    });

    expect(result.isError).toBe(true);
  });
});

describe('stability fixes — executeTransaction repeated resource keys', () => {
  it('同一事务内重复 resourceKey 不会自锁', async () => {
    const calls: string[] = [];

    const tx = executeTransaction([
      {
        name: 'step-1',
        resourceKey: 'same-key',
        execute: async () => {
          calls.push('step-1');
          return 1;
        },
      },
      {
        name: 'step-2',
        resourceKey: 'same-key',
        execute: async () => {
          calls.push('step-2');
          return 2;
        },
      },
    ], { name: 'duplicate-key-test' });

    const result = await Promise.race([
      tx,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('transaction timeout')), 500)),
    ]);

    expect(result.success).toBe(true);
    expect(calls).toEqual(['step-1', 'step-2']);
  });
});
