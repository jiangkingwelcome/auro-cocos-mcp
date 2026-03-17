import { describe, it, expect, beforeEach } from 'vitest';
import { StandaloneMcpHost } from '../../src/mcp/standalone-host';
import { LocalToolServer } from '../../src/mcp/local-tool-server';

// ─────────────────────────────────────────────────────────────────────────────
// 辅助
// ─────────────────────────────────────────────────────────────────────────────
function makeHost() {
  const toolServer = new LocalToolServer();
  toolServer.tool(
    'echo',
    '回声工具',
    { action: { type: 'string', options: ['ping', 'pong'] } },
    async (args) => ({
      content: [{ type: 'text' as const, text: JSON.stringify(args) }],
    }),
  );
  toolServer.tool(
    'greet',
    '问候工具',
    {},
    async (args) => ({
      content: [{ type: 'text' as const, text: `Hello ${(args as Record<string, unknown>).name || 'world'}` }],
    }),
  );

  const host = new StandaloneMcpHost({
    serverName: 'e2e-test-server',
    serverVersion: '1.0.0',
    toolServer,
  });

  return { host, toolServer };
}

function rpc(method: string, params?: unknown, id: string | number = 1) {
  return { jsonrpc: '2.0', id, method, ...(params !== undefined ? { params } : {}) };
}

function extractResult(response: { status: number; body?: unknown }) {
  expect(response.status).toBe(200);
  const body = response.body as { result?: unknown; error?: unknown };
  expect(body.error).toBeUndefined();
  return body.result;
}

// ─────────────────────────────────────────────────────────────────────────────
// 完整 MCP 协议生命周期
// ─────────────────────────────────────────────────────────────────────────────
describe('MCP 协议端到端流程', () => {
  let host: StandaloneMcpHost;

  beforeEach(() => {
    const ctx = makeHost();
    host = ctx.host;
  });

  it('完整生命周期: initialize → tools/list → tools/call → disconnect', async () => {
    // Step 1: initialize
    const initResp = await host.handlePayload(rpc('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' },
    }));
    const initResult = extractResult(initResp) as Record<string, unknown>;
    expect(initResult.protocolVersion).toBe('2024-11-05');
    expect(initResult.serverInfo).toBeDefined();
    expect((initResult.serverInfo as Record<string, unknown>).name).toBe('e2e-test-server');
    expect(host.getConnectionCount()).toBe(1);

    // Step 2: notifications/initialized (无响应)
    const initdResp = await host.handlePayload({ jsonrpc: '2.0', method: 'notifications/initialized' });
    expect(initdResp.status).toBe(204);

    // Step 3: tools/list
    const listResp = await host.handlePayload(rpc('tools/list', {}, 2));
    const listResult = extractResult(listResp) as { tools: Array<{ name: string }> };
    expect(listResult.tools).toHaveLength(2);
    const names = listResult.tools.map(t => t.name).sort();
    expect(names).toEqual(['echo', 'greet']);

    // Step 4: tools/call — echo
    const callResp = await host.handlePayload(rpc('tools/call', {
      name: 'echo',
      arguments: { action: 'ping' },
    }, 3));
    const callResult = extractResult(callResp) as { content: Array<{ text: string }> };
    expect(callResult.content[0].text).toContain('ping');

    // Step 5: tools/call — greet
    const greetResp = await host.handlePayload(rpc('tools/call', {
      name: 'greet',
      arguments: { name: 'Cocos' },
    }, 4));
    const greetResult = extractResult(greetResp) as { content: Array<{ text: string }> };
    expect(greetResult.content[0].text).toBe('Hello Cocos');

    // Step 6: disconnect
    const disconnResp = await host.handlePayload({ jsonrpc: '2.0', method: 'notifications/client-disconnect' });
    expect(disconnResp.status).toBe(204);
    // HTTP transport disconnect 是尽力清理，hasReceivedAnyRequest 仍为 true
    // 所以 getConnectionCount 可能返回 0（sessions 清空）或 1（fallback）
    expect(host.getConnectionCount()).toBeLessThanOrEqual(1);
  });

  it('未知工具返回 isError', async () => {
    const resp = await host.handlePayload(rpc('tools/call', {
      name: 'nonexistent',
      arguments: {},
    }));
    const body = (resp.body as { result?: { isError?: boolean; content?: Array<{ text: string }> } });
    expect(body.result?.isError).toBe(true);
    expect(body.result?.content?.[0]?.text).toContain('未知工具');
  });

  it('tools/call 缺少 name 参数返回 RPC 错误', async () => {
    const resp = await host.handlePayload(rpc('tools/call', { arguments: {} }));
    const body = resp.body as { error?: { code: number; message: string } };
    expect(body.error).toBeDefined();
    expect(body.error?.code).toBe(-32602);
  });

  it('未知方法返回 Method not found', async () => {
    const resp = await host.handlePayload(rpc('unknown/method'));
    const body = resp.body as { error?: { code: number; message: string } };
    expect(body.error).toBeDefined();
    expect(body.error?.code).toBe(-32601);
    expect(body.error?.message).toContain('unknown/method');
  });

  it('非法 payload 返回 Invalid Request', async () => {
    const resp = await host.handlePayload('not an object');
    const body = resp.body as { error?: { code: number } };
    expect(body.error?.code).toBe(-32600);
  });

  it('ping 返回空对象', async () => {
    const resp = await host.handlePayload(rpc('ping'));
    const result = extractResult(resp);
    expect(result).toEqual({});
  });

  it('resources/list 返回空列表', async () => {
    const resp = await host.handlePayload(rpc('resources/list'));
    const result = extractResult(resp) as { resources: unknown[] };
    expect(result.resources).toEqual([]);
  });

  it('prompts/list 返回空列表', async () => {
    const resp = await host.handlePayload(rpc('prompts/list'));
    const result = extractResult(resp) as { prompts: unknown[] };
    expect(result.prompts).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 批量 JSON-RPC 请求
// ─────────────────────────────────────────────────────────────────────────────
describe('MCP 批量请求', () => {
  let host: StandaloneMcpHost;

  beforeEach(() => {
    const ctx = makeHost();
    host = ctx.host;
  });

  it('批量请求返回批量响应', async () => {
    const batch = [
      rpc('ping', undefined, 1),
      rpc('tools/list', {}, 2),
    ];
    const resp = await host.handlePayload(batch);
    expect(resp.status).toBe(200);
    const bodies = resp.body as Array<{ id: number; result?: unknown }>;
    expect(bodies).toHaveLength(2);
    expect(bodies[0].id).toBe(1);
    expect(bodies[1].id).toBe(2);
  });

  it('空批量返回 204', async () => {
    const resp = await host.handlePayload([]);
    expect(resp.status).toBe(204);
  });

  it('批量中包含通知（无 id）时不产生对应响应', async () => {
    const batch = [
      rpc('ping', undefined, 1),
      { jsonrpc: '2.0', method: 'notifications/initialized' }, // notification, no id
    ];
    const resp = await host.handlePayload(batch);
    expect(resp.status).toBe(200);
    const bodies = resp.body as Array<{ id: number }>;
    // 只有 ping 有响应
    expect(bodies).toHaveLength(1);
    expect(bodies[0].id).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 连接计数
// ─────────────────────────────────────────────────────────────────────────────
describe('MCP 连接管理', () => {
  let host: StandaloneMcpHost;

  beforeEach(() => {
    const ctx = makeHost();
    host = ctx.host;
  });

  it('相同 clientInfo 多次 initialize 计为 1 个连接', async () => {
    const clientInfo = { name: 'cursor', version: '1.0' };
    await host.handlePayload(rpc('initialize', { clientInfo }));
    await host.handlePayload(rpc('initialize', { clientInfo }, 2));
    await host.handlePayload(rpc('initialize', { clientInfo }, 3));
    expect(host.getConnectionCount()).toBe(1);
  });

  it('不同 clientInfo 计为不同连接', async () => {
    await host.handlePayload(rpc('initialize', { clientInfo: { name: 'cursor', version: '1.0' } }));
    await host.handlePayload(rpc('initialize', { clientInfo: { name: 'windsurf', version: '2.0' } }, 2));
    expect(host.getConnectionCount()).toBe(2);
  });

  it('resetConnectionCount 清零', async () => {
    await host.handlePayload(rpc('initialize', { clientInfo: { name: 'test', version: '1' } }));
    expect(host.getConnectionCount()).toBe(1);
    host.resetConnectionCount();
    expect(host.getConnectionCount()).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 工具动态启禁
// ─────────────────────────────────────────────────────────────────────────────
describe('MCP 工具动态启禁', () => {
  it('禁用工具后 tools/list 不包含该工具', async () => {
    const { host, toolServer } = makeHost();
    toolServer.disableTool('echo');

    const resp = await host.handlePayload(rpc('tools/list'));
    const result = extractResult(resp) as { tools: Array<{ name: string }> };
    const names = result.tools.map(t => t.name);
    expect(names).not.toContain('echo');
    expect(names).toContain('greet');
  });

  it('禁用工具后调用返回 isError', async () => {
    const { host, toolServer } = makeHost();
    toolServer.disableTool('echo');

    const resp = await host.handlePayload(rpc('tools/call', { name: 'echo', arguments: {} }));
    const body = (resp.body as { result?: { isError?: boolean; content?: Array<{ text: string }> } });
    expect(body.result?.isError).toBe(true);
    expect(body.result?.content?.[0]?.text).toContain('工具已被禁用');
  });

  it('重新启用工具后恢复正常', async () => {
    const { host, toolServer } = makeHost();
    toolServer.disableTool('echo');
    toolServer.enableTool('echo');

    const resp = await host.handlePayload(rpc('tools/list'));
    const result = extractResult(resp) as { tools: Array<{ name: string }> };
    const names = result.tools.map(t => t.name);
    expect(names).toContain('echo');
  });
});
