import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { LocalToolServer } from '../../src/mcp/local-tool-server';

// ─────────────────────────────────────────────────────────────────────────────
// 辅助：创建一个带简单处理器的工具
// ─────────────────────────────────────────────────────────────────────────────
function makeEchoTool(server: LocalToolServer, name = 'echo') {
  server.tool(
    name,
    '回声工具',
    { message: z.string() },
    async (args) => ({
      content: [{ type: 'text' as const, text: String(args.message) }],
    }),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. 工具注册 & 列表
// ─────────────────────────────────────────────────────────────────────────────
describe('LocalToolServer — 工具注册', () => {
  it('注册工具后 listTools() 可返回该工具', () => {
    const server = new LocalToolServer();
    makeEchoTool(server);

    const tools = server.listTools();
    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe('echo');
    expect(tools[0].description).toBe('回声工具');
  });

  it('注册多个工具后 listTools() 全部返回', () => {
    const server = new LocalToolServer();
    makeEchoTool(server, 'tool_a');
    makeEchoTool(server, 'tool_b');
    makeEchoTool(server, 'tool_c');

    const tools = server.listTools();
    expect(tools.map((t) => t.name)).toEqual(['tool_a', 'tool_b', 'tool_c']);
  });

  it('重复注册同名工具会覆盖旧工具', () => {
    const server = new LocalToolServer();
    server.tool('dup', '第一版', {}, async () => ({ content: [{ type: 'text', text: 'v1' }] }));
    server.tool('dup', '第二版', {}, async () => ({ content: [{ type: 'text', text: 'v2' }] }));

    const tools = server.listTools();
    expect(tools).toHaveLength(1);
    expect(tools[0].description).toBe('第二版');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. callTool 基本行为
// ─────────────────────────────────────────────────────────────────────────────
describe('LocalToolServer — callTool', () => {
  it('正常调用返回处理器结果', async () => {
    const server = new LocalToolServer();
    makeEchoTool(server);

    const result = await server.callTool('echo', { message: 'hello' });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toBe('hello');
  });

  it('调用不存在的工具返回 isError', async () => {
    const server = new LocalToolServer();

    const result = await server.callTool('nonexistent', {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('未知工具');
  });

  it('处理器抛出异常时返回 isError', async () => {
    const server = new LocalToolServer();
    server.tool('failer', '会失败的工具', {}, async () => {
      throw new Error('故意失败');
    });

    const result = await server.callTool('failer', {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('故意失败');
  });

  it('调用已禁用工具时返回 isError', async () => {
    const server = new LocalToolServer();
    makeEchoTool(server);
    server.disableTool('echo');

    const result = await server.callTool('echo', { message: 'hello' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('工具已被禁用');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Zod 参数校验
// ─────────────────────────────────────────────────────────────────────────────
describe('LocalToolServer — Zod 参数校验', () => {
  it('参数符合 schema 时正常通过', async () => {
    const server = new LocalToolServer();
    server.tool(
      'typed',
      '有类型约束',
      z.object({ count: z.number(), name: z.string() }),
      async (args) => ({
        content: [{ type: 'text' as const, text: `${args.name}:${args.count}` }],
      }),
    );

    const result = await server.callTool('typed', { count: 42, name: 'foo' });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toBe('foo:42');
  });

  it('参数类型错误时返回 isError（Zod 校验失败）', async () => {
    const server = new LocalToolServer();
    server.tool(
      'typed',
      '有类型约束',
      z.object({ count: z.number() }),
      async () => ({ content: [{ type: 'text' as const, text: 'ok' }] }),
    );

    const result = await server.callTool('typed', { count: 'not-a-number' });
    expect(result.isError).toBe(true);
  });

  it('缺少必填参数时返回 isError', async () => {
    const server = new LocalToolServer();
    server.tool(
      'required',
      '必填参数',
      z.object({ id: z.string() }),
      async () => ({ content: [{ type: 'text' as const, text: 'ok' }] }),
    );

    const result = await server.callTool('required', {});
    expect(result.isError).toBe(true);
  });

  it('可选参数缺失时正常通过', async () => {
    const server = new LocalToolServer();
    server.tool(
      'optional_tool',
      '可选参数',
      z.object({ name: z.string().optional() }),
      async (args) => ({
        content: [{ type: 'text' as const, text: String(args.name ?? 'default') }],
      }),
    );

    const result = await server.callTool('optional_tool', {});
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toBe('default');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Action 计数
// ─────────────────────────────────────────────────────────────────────────────
describe('LocalToolServer — getTotalActionCount', () => {
  it('无 action 枚举的工具计为 1', () => {
    const server = new LocalToolServer();
    server.tool('simple', '简单工具', {}, async () => ({ content: [] }));

    expect(server.getTotalActionCount()).toBe(1);
  });

  it('有 enum action 的工具按枚举项数计数', () => {
    const server = new LocalToolServer();

    // 使用 JSON Schema 格式
    server.tool(
      'multi_action',
      '多 action',
      {
        type: 'object',
        properties: {
          action: { enum: ['read', 'write', 'delete'] },
        },
      },
      async () => ({ content: [] }),
    );

    expect(server.getTotalActionCount()).toBe(3);
  });

  it('多个工具的 action 总数累加', () => {
    const server = new LocalToolServer();

    server.tool('a', '工具A', { type: 'object', properties: { action: { enum: ['x', 'y'] } } }, async () => ({ content: [] }));
    server.tool('b', '工具B', { type: 'object', properties: { action: { enum: ['p', 'q', 'r'] } } }, async () => ({ content: [] }));
    server.tool('c', '工具C', {}, async () => ({ content: [] }));

    // a=2, b=3, c=1 → 6
    expect(server.getTotalActionCount()).toBe(6);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. inputSchema 生成（通过 listTools 验证）
// ─────────────────────────────────────────────────────────────────────────────
describe('LocalToolServer — inputSchema 生成', () => {
  it('string 字段生成正确的 JSON Schema', () => {
    const server = new LocalToolServer();
    server.tool('s', 'd', { name: z.string() }, async () => ({ content: [] }));

    const schema = server.listTools()[0].inputSchema;
    const props = (schema as any).properties;
    expect(props.name.type).toBe('string');
  });

  it('number 字段生成正确的 JSON Schema', () => {
    const server = new LocalToolServer();
    server.tool('n', 'd', { count: z.number() }, async () => ({ content: [] }));

    const schema = server.listTools()[0].inputSchema;
    expect((schema as any).properties.count.type).toBe('number');
  });

  it('boolean 字段生成正确的 JSON Schema', () => {
    const server = new LocalToolServer();
    server.tool('b', 'd', { flag: z.boolean() }, async () => ({ content: [] }));

    const schema = server.listTools()[0].inputSchema;
    expect((schema as any).properties.flag.type).toBe('boolean');
  });

  it('enum 字段生成包含 enum 数组的 JSON Schema', () => {
    const server = new LocalToolServer();
    server.tool('e', 'd', { action: z.enum(['a', 'b', 'c']) }, async () => ({ content: [] }));

    const schema = server.listTools()[0].inputSchema;
    const actionSchema = (schema as any).properties.action;
    expect(actionSchema.type).toBe('string');
    expect(actionSchema.enum).toEqual(['a', 'b', 'c']);
  });

  it('必填字段出现在 required 数组，可选字段不出现', () => {
    const server = new LocalToolServer();
    server.tool(
      'mix',
      'd',
      { required_field: z.string(), optional_field: z.string().optional() },
      async () => ({ content: [] }),
    );

    const schema = server.listTools()[0].inputSchema;
    const required = (schema as any).required ?? [];
    expect(required).toContain('required_field');
    expect(required).not.toContain('optional_field');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. 调用日志
// ─────────────────────────────────────────────────────────────────────────────
describe('LocalToolServer — 调用日志', () => {
  it('成功调用输出入口日志和成功日志', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const server = new LocalToolServer();
    makeEchoTool(server);

    await server.callTool('echo', { message: 'hi' });

    const logs = logSpy.mock.calls.map(c => c[0]);
    expect(logs.some((l: string) => l.includes('[MCP]') && l.includes('→') && l.includes('echo'))).toBe(true);
    expect(logs.some((l: string) => l.includes('[MCP]') && l.includes('✓') && l.includes('echo') && l.includes('ms'))).toBe(true);
    logSpy.mockRestore();
  });

  it('业务错误（isError）输出 log 日志', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const server = new LocalToolServer();
    server.tool('fail_biz', 'business error', {}, async () => ({
      content: [{ type: 'text' as const, text: JSON.stringify({ error: '节点不存在' }) }],
      isError: true,
    }));

    await server.callTool('fail_biz', {});

    const logs = logSpy.mock.calls.map(c => c[0]);
    expect(logs.some((l: string) => l.includes('[MCP]') && l.includes('✗') && l.includes('fail_biz') && l.includes('节点不存在'))).toBe(true);
    logSpy.mockRestore();
  });

  it('异常抛出输出 log 日志', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const server = new LocalToolServer();
    server.tool('fail_throw', 'throws', {}, async () => { throw new Error('boom'); });

    await server.callTool('fail_throw', {});

    const logs = logSpy.mock.calls.map(c => c[0]);
    expect(logs.some((l: string) => l.includes('[MCP]') && l.includes('✗✗') && l.includes('EXCEPTION') && l.includes('boom'))).toBe(true);
    logSpy.mockRestore();
  });

  it('带 action 参数时日志显示 tool.action 格式', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const server = new LocalToolServer();
    server.tool('scene_query', 'query', {}, async () => ({
      content: [{ type: 'text' as const, text: '{}' }],
    }));

    await server.callTool('scene_query', { action: 'tree' });

    const logs = logSpy.mock.calls.map(c => c[0]);
    expect(logs.some((l: string) => l.includes('scene_query.tree'))).toBe(true);
    logSpy.mockRestore();
  });

  it('参数摘要截断超长字符串', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const server = new LocalToolServer();
    server.tool('long_args', 'test', {}, async () => ({
      content: [{ type: 'text' as const, text: '{}' }],
    }));

    const longUrl = 'db://assets/' + 'a'.repeat(100) + '.png';
    await server.callTool('long_args', { url: longUrl });

    const entryLog = logSpy.mock.calls.map(c => c[0]).find((l: string) => l.includes('→') && l.includes('long_args'));
    expect(entryLog).toBeDefined();
    expect(entryLog.includes(longUrl)).toBe(false);
    expect(entryLog.includes('...')).toBe(true);
    logSpy.mockRestore();
  });

  it('调用序号递增', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const server = new LocalToolServer();
    server.tool('seq_test', 'test', {}, async () => ({
      content: [{ type: 'text' as const, text: '{}' }],
    }));

    await server.callTool('seq_test', {});
    await server.callTool('seq_test', {});

    const entryLogs = logSpy.mock.calls.map(c => c[0]).filter((l: string) => l.includes('→') && l.includes('seq_test'));
    expect(entryLogs).toHaveLength(2);
    const id1 = entryLogs[0].match(/#(\d+)/)?.[1];
    const id2 = entryLogs[1].match(/#(\d+)/)?.[1];
    expect(Number(id2)).toBe(Number(id1) + 1);
    logSpy.mockRestore();
  });
});
