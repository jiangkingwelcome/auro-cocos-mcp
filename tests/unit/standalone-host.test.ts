import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StandaloneMcpHost } from '../../src/mcp/standalone-host';
import { LocalToolServer } from '../../src/mcp/local-tool-server';

// ─────────────────────────────────────────────────────────────────────────────
// 辅助：创建一个带 echo 工具的 Host
// ─────────────────────────────────────────────────────────────────────────────
function makeHost() {
  const toolServer = new LocalToolServer();
  toolServer.tool(
    'echo',
    '回声',
    {},
    async (args) => ({
      content: [{ type: 'text' as const, text: JSON.stringify(args) }],
    }),
  );

  const host = new StandaloneMcpHost({
    serverName: 'test-server',
    serverVersion: '0.0.1',
    toolServer,
  });

  return { host, toolServer };
}

function rpcRequest(method: string, params?: unknown, id: string | number = 1) {
  return { jsonrpc: '2.0', id, method, ...(params !== undefined ? { params } : {}) };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. getServerInfo
// ─────────────────────────────────────────────────────────────────────────────
describe('StandaloneMcpHost — getServerInfo', () => {
  it('返回正确的服务器信息', () => {
    const { host } = makeHost();
    const info = host.getServerInfo();

    expect(info.name).toBe('test-server');
    expect(info.version).toBe('0.0.1');
    expect(typeof info.protocolVersion).toBe('string');
    expect(info.capabilities.tools).toBeDefined();
  });

  it('getToolCount 返回已注册工具数', () => {
    const { host } = makeHost();
    expect(host.getToolCount()).toBe(1);
  });

  it('初始 getConnectionCount 为 0', () => {
    const { host } = makeHost();
    expect(host.getConnectionCount()).toBe(0);
  });

  it('getAllToolNames 返回全部工具名', () => {
    const { host } = makeHost();
    expect(host.getAllToolNames()).toEqual(['echo']);
  });

  it('setToolEnabled 会更新启用状态与工具列表版本', () => {
    const { host } = makeHost();
    const beforeVersion = host.getToolListVersion();

    const disabled = host.setToolEnabled('echo', false);
    expect(disabled.exists).toBe(true);
    expect(disabled.enabled).toBe(false);
    expect(disabled.toolListVersion).toBe(beforeVersion + 1);
    expect(host.getToolEnabledStates().echo).toBe(false);

    const enabled = host.setToolEnabled('echo', true);
    expect(enabled.exists).toBe(true);
    expect(enabled.enabled).toBe(true);
    expect(enabled.toolListVersion).toBe(beforeVersion + 2);
    expect(host.getToolEnabledStates().echo).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. initialize
// ─────────────────────────────────────────────────────────────────────────────
describe('StandaloneMcpHost — initialize', () => {
  it('返回协议版本和服务器信息', async () => {
    const { host } = makeHost();
    const resp = await host.handlePayload(rpcRequest('initialize'));

    expect(resp.status).toBe(200);
    const body = resp.body as any;
    expect(body.result.protocolVersion).toBeDefined();
    expect(body.result.serverInfo.name).toBe('test-server');
  });

  it('不同 clientInfo 的 initialize 增加连接计数', async () => {
    const { host } = makeHost();
    await host.handlePayload(rpcRequest('initialize', { clientInfo: { name: 'client-a', version: '1.0' } }));
    await host.handlePayload(rpcRequest('initialize', { clientInfo: { name: 'client-b', version: '1.0' } }, 2));

    expect(host.getConnectionCount()).toBe(2);
  });

  it('相同 clientInfo 重复 initialize 计为 1 个连接', async () => {
    const { host } = makeHost();
    await host.handlePayload(rpcRequest('initialize', { clientInfo: { name: 'same', version: '1.0' } }));
    await host.handlePayload(rpcRequest('initialize', { clientInfo: { name: 'same', version: '1.0' } }, 2));

    expect(host.getConnectionCount()).toBe(1);
  });

  it('initialize 作为通知（无 id）时返回 204', async () => {
    const { host } = makeHost();
    const resp = await host.handlePayload({ jsonrpc: '2.0', method: 'initialize' });

    expect(resp.status).toBe(204);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. ping
// ─────────────────────────────────────────────────────────────────────────────
describe('StandaloneMcpHost — ping', () => {
  it('返回空对象结果', async () => {
    const { host } = makeHost();
    const resp = await host.handlePayload(rpcRequest('ping'));

    expect(resp.status).toBe(200);
    expect((resp.body as any).result).toEqual({});
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. tools/list
// ─────────────────────────────────────────────────────────────────────────────
describe('StandaloneMcpHost — tools/list', () => {
  it('返回已注册工具的列表', async () => {
    const { host } = makeHost();
    const resp = await host.handlePayload(rpcRequest('tools/list'));

    expect(resp.status).toBe(200);
    const tools = (resp.body as any).result.tools;
    expect(Array.isArray(tools)).toBe(true);
    expect(tools.length).toBe(1);
    expect(tools[0].name).toBe('echo');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. tools/call
// ─────────────────────────────────────────────────────────────────────────────
describe('StandaloneMcpHost — tools/call', () => {
  it('正常调用工具返回结果', async () => {
    const { host } = makeHost();
    const resp = await host.handlePayload(
      rpcRequest('tools/call', { name: 'echo', arguments: { hello: 'world' } }),
    );

    expect(resp.status).toBe(200);
    const result = (resp.body as any).result;
    expect(result.content[0].text).toContain('hello');
  });

  it('缺少 name 参数时返回 -32602 错误', async () => {
    const { host } = makeHost();
    const resp = await host.handlePayload(
      rpcRequest('tools/call', { arguments: {} }),
    );

    expect(resp.status).toBe(200);
    const body = resp.body as any;
    expect(body.error.code).toBe(-32602);
  });

  it('params 不是对象时返回 -32602 错误', async () => {
    const { host } = makeHost();
    const resp = await host.handlePayload(
      rpcRequest('tools/call', 'invalid-params'),
    );

    expect(resp.status).toBe(200);
    const body = resp.body as any;
    expect(body.error.code).toBe(-32602);
  });

  it('调用不存在的工具名返回 isError 内容', async () => {
    const { host } = makeHost();
    const resp = await host.handlePayload(
      rpcRequest('tools/call', { name: 'nonexistent', arguments: {} }),
    );

    expect(resp.status).toBe(200);
    const result = (resp.body as any).result;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('未知工具');
  });

  it('tools/call 作为通知（无 id）时返回 204', async () => {
    const { host } = makeHost();
    const resp = await host.handlePayload({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { name: 'echo', arguments: {} },
    });

    expect(resp.status).toBe(204);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. resources/list & prompts/list
// ─────────────────────────────────────────────────────────────────────────────
describe('StandaloneMcpHost — resources & prompts', () => {
  it('resources/list 返回空数组', async () => {
    const { host } = makeHost();
    const resp = await host.handlePayload(rpcRequest('resources/list'));

    expect(resp.status).toBe(200);
    expect((resp.body as any).result.resources).toEqual([]);
  });

  it('prompts/list 返回空数组', async () => {
    const { host } = makeHost();
    const resp = await host.handlePayload(rpcRequest('prompts/list'));

    expect(resp.status).toBe(200);
    expect((resp.body as any).result.prompts).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. notifications/initialized
// ─────────────────────────────────────────────────────────────────────────────
describe('StandaloneMcpHost — notifications/initialized', () => {
  it('notifications/initialized 无响应（单条）→ 204', async () => {
    const { host } = makeHost();
    const resp = await host.handlePayload(rpcRequest('notifications/initialized'));

    // 有 id 但 handler 返回 null，所以 body 为空
    expect(resp.status).toBe(204);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. 未知方法
// ─────────────────────────────────────────────────────────────────────────────
describe('StandaloneMcpHost — 未知方法', () => {
  it('返回 -32601 Method not found', async () => {
    const { host } = makeHost();
    const resp = await host.handlePayload(rpcRequest('unknown/method'));

    expect(resp.status).toBe(200);
    const body = resp.body as any;
    expect(body.error.code).toBe(-32601);
    expect(body.error.message).toContain('Method not found');
  });
});

describe('StandaloneMcpHost — SSE cleanup', () => {
  it('broadcastSse 写失败时会关闭并移除连接', () => {
    const { host } = makeHost();
    const end = vi.fn();
    const write = vi.fn(() => {
      throw new Error('socket closed');
    });

    (host as any).sseClients.set('broken-client', { write, end });
    (host as any).broadcastSse('notifications/tools/list_changed', {});

    expect(end).toHaveBeenCalledTimes(1);
    expect((host as any).sseClients.has('broken-client')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. 非法 Payload
// ─────────────────────────────────────────────────────────────────────────────
describe('StandaloneMcpHost — 非法 Payload', () => {
  it('payload 为字符串时返回 -32600', async () => {
    const { host } = makeHost();
    const resp = await host.handlePayload('invalid');

    expect(resp.status).toBe(200);
    const body = resp.body as any;
    expect(body.error.code).toBe(-32600);
  });

  it('payload 无 method 字段时返回 -32600', async () => {
    const { host } = makeHost();
    const resp = await host.handlePayload({ jsonrpc: '2.0', id: 1 });

    expect(resp.status).toBe(200);
    const body = resp.body as any;
    expect(body.error.code).toBe(-32600);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. 批量请求
// ─────────────────────────────────────────────────────────────────────────────
describe('StandaloneMcpHost — 批量请求', () => {
  it('批量请求返回对应数量的响应', async () => {
    const { host } = makeHost();
    const batch = [
      rpcRequest('ping', undefined, 1),
      rpcRequest('tools/list', undefined, 2),
    ];

    const resp = await host.handlePayload(batch);
    expect(resp.status).toBe(200);
    const bodies = resp.body as any[];
    expect(Array.isArray(bodies)).toBe(true);
    expect(bodies.length).toBe(2);
  });

  it('批量请求中纯通知返回 204', async () => {
    const { host } = makeHost();
    const batch = [
      { jsonrpc: '2.0', method: 'ping' }, // 通知，无 id
      { jsonrpc: '2.0', method: 'tools/list' }, // 通知，无 id
    ];

    const resp = await host.handlePayload(batch);
    expect(resp.status).toBe(204);
  });

  it('批量请求中混合通知和请求时只返回请求的响应', async () => {
    const { host } = makeHost();
    const batch = [
      { jsonrpc: '2.0', method: 'ping' }, // 通知
      rpcRequest('tools/list', undefined, 1), // 请求
    ];

    const resp = await host.handlePayload(batch);
    expect(resp.status).toBe(200);
    const bodies = resp.body as any[];
    expect(bodies.length).toBe(1);
    expect(bodies[0].id).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. JSON-RPC id 类型
// ─────────────────────────────────────────────────────────────────────────────
describe('StandaloneMcpHost — id 类型', () => {
  it('字符串 id 被原样返回', async () => {
    const { host } = makeHost();
    const resp = await host.handlePayload({ jsonrpc: '2.0', id: 'abc-123', method: 'ping' });

    expect((resp.body as any).id).toBe('abc-123');
  });

  it('数字 id 被原样返回', async () => {
    const { host } = makeHost();
    const resp = await host.handlePayload({ jsonrpc: '2.0', id: 99, method: 'ping' });

    expect((resp.body as any).id).toBe(99);
  });
});
