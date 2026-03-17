import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';

// shim-logic.cjs 是 CommonJS 模块，从 ESM 测试上下文中通过 createRequire 导入
const _require = createRequire(import.meta.url);
const {
  DEFAULT_PORTS,
  resolvePortCandidates,
  detectFramingMode,
  tryParseContentLengthFrame,
  tryParseJsonLinesFrame,
  formatOutput,
} = _require('../../stdio-shim/shim-logic.cjs') as {
  DEFAULT_PORTS: number[];
  resolvePortCandidates: (envPort: string | undefined, defaults?: number[]) => number[];
  detectFramingMode: (preview: string) => 'jsonl' | 'clength';
  tryParseContentLengthFrame: (
    buffer: Buffer,
  ) => { body: string; remaining: Buffer } | { error: string; remaining: Buffer } | null;
  tryParseJsonLinesFrame: (buffer: Buffer) => { line: string | null; remaining: Buffer } | null;
  formatOutput: (payload: unknown, mode: 'jsonl' | 'clength') => string;
};

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT_PORTS
// ─────────────────────────────────────────────────────────────────────────────
describe('DEFAULT_PORTS', () => {
  it('固定端口 7779（单一端口，无 fallback）', () => {
    expect(Array.isArray(DEFAULT_PORTS)).toBe(true);
    expect(DEFAULT_PORTS.length).toBe(1);
    expect(DEFAULT_PORTS[0]).toBe(7779);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// resolvePortCandidates
// ─────────────────────────────────────────────────────────────────────────────
describe('resolvePortCandidates', () => {
  it('无 envPort → 返回默认列表副本', () => {
    const result = resolvePortCandidates(undefined);
    expect(result).toEqual(DEFAULT_PORTS);
    // 必须是副本，不是同一引用
    expect(result).not.toBe(DEFAULT_PORTS);
  });

  it('有效 envPort → 仅返回该端口（固定端口设计）', () => {
    const result = resolvePortCandidates('7780');
    expect(result[0]).toBe(7780);
    expect(result.length).toBe(1);
  });

  it('envPort 不在默认列表中 → 仅返回该端口', () => {
    const result = resolvePortCandidates('9999');
    expect(result[0]).toBe(9999);
    expect(result.length).toBe(1);
  });

  it('无效 envPort（非数字字符串）→ 返回默认列表', () => {
    const result = resolvePortCandidates('not-a-port');
    expect(result).toEqual(DEFAULT_PORTS);
  });

  it('envPort 为空字符串 → 返回默认列表', () => {
    const result = resolvePortCandidates('');
    expect(result).toEqual(DEFAULT_PORTS);
  });

  it('可传入自定义 defaults', () => {
    const custom = [1111, 2222];
    const result = resolvePortCandidates(undefined, custom);
    expect(result).toEqual(custom);
    expect(result).not.toBe(custom);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// detectFramingMode
// ─────────────────────────────────────────────────────────────────────────────
describe('detectFramingMode', () => {
  it('{ 开头 → jsonl', () => {
    expect(detectFramingMode('{"jsonrpc":"2.0"}')).toBe('jsonl');
  });

  it('[ 开头 → jsonl', () => {
    expect(detectFramingMode('[{"id":1}]')).toBe('jsonl');
  });

  it('Content-Length 开头 → clength', () => {
    expect(detectFramingMode('Content-Length: 123\r\n\r\n')).toBe('clength');
  });

  it('前面有空白字符的 { → jsonl', () => {
    expect(detectFramingMode('   {"id":1}')).toBe('jsonl');
  });

  it('前面有换行的 [ → jsonl', () => {
    expect(detectFramingMode('\n[{"id":1}]')).toBe('jsonl');
  });

  it('其他内容 → clength', () => {
    expect(detectFramingMode('C\r\n')).toBe('clength');
    expect(detectFramingMode('some text')).toBe('clength');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// tryParseContentLengthFrame
// ─────────────────────────────────────────────────────────────────────────────
describe('tryParseContentLengthFrame', () => {
  function makeFrame(body: string): Buffer {
    const bodyBytes = Buffer.from(body, 'utf8');
    const header = `Content-Length: ${bodyBytes.length}\r\n\r\n`;
    return Buffer.concat([Buffer.from(header, 'utf8'), bodyBytes]);
  }

  it('完整单帧 → 返回 body 和空 remaining', () => {
    const body = '{"id":1,"method":"ping"}';
    const buf = makeFrame(body);
    const result = tryParseContentLengthFrame(buf);
    expect(result).not.toBeNull();
    expect((result as any).body).toBe(body);
    expect((result as any).remaining.length).toBe(0);
  });

  it('帧后有额外数据 → remaining 包含剩余字节', () => {
    const body = '{"id":1}';
    const extra = 'Content-Length: 3\r\n\r\nabc';
    const buf = Buffer.concat([makeFrame(body), Buffer.from(extra, 'utf8')]);
    const result = tryParseContentLengthFrame(buf) as any;
    expect(result).not.toBeNull();
    expect(result.body).toBe(body);
    expect(result.remaining.toString('utf8')).toBe(extra);
  });

  it('帧不完整（body 未到）→ 返回 null', () => {
    const header = 'Content-Length: 100\r\n\r\n';
    const buf = Buffer.concat([Buffer.from(header, 'utf8'), Buffer.from('only10byte', 'utf8')]);
    expect(tryParseContentLengthFrame(buf)).toBeNull();
  });

  it('无 \\r\\n\\r\\n 分隔符 → 返回 null（等待更多数据）', () => {
    const buf = Buffer.from('Content-Length: 5\r\n', 'utf8');
    expect(tryParseContentLengthFrame(buf)).toBeNull();
  });

  it('缺少 Content-Length 头 → 返回 error', () => {
    const buf = Buffer.from('X-Custom: something\r\n\r\nhello', 'utf8');
    const result = tryParseContentLengthFrame(buf) as any;
    expect(result).not.toBeNull();
    expect(result.error).toBeTruthy();
    expect(result.remaining.length).toBe(0);
  });

  it('多字节 Unicode 正文 → 按字节数计算正确', () => {
    const body = '{"text":"你好"}'; // 中文字符多字节
    const buf = makeFrame(body);
    const result = tryParseContentLengthFrame(buf) as any;
    expect(result.body).toBe(body);
    expect(result.remaining.length).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// tryParseJsonLinesFrame
// ─────────────────────────────────────────────────────────────────────────────
describe('tryParseJsonLinesFrame', () => {
  it('有换行符 → 返回行内容和剩余', () => {
    const buf = Buffer.from('{"id":1}\nremaining', 'utf8');
    const result = tryParseJsonLinesFrame(buf) as any;
    expect(result).not.toBeNull();
    expect(result.line).toBe('{"id":1}');
    expect(result.remaining.toString('utf8')).toBe('remaining');
  });

  it('没有换行符 → 返回 null（等待更多数据）', () => {
    const buf = Buffer.from('{"id":1}', 'utf8');
    expect(tryParseJsonLinesFrame(buf)).toBeNull();
  });

  it('空行 → line 为 null', () => {
    const buf = Buffer.from('\n{"id":2}', 'utf8');
    const result = tryParseJsonLinesFrame(buf) as any;
    expect(result).not.toBeNull();
    expect(result.line).toBeNull();
    expect(result.remaining.toString('utf8')).toBe('{"id":2}');
  });

  it('仅包含空白的行 → line 为 null（trim 后为空）', () => {
    const buf = Buffer.from('   \n{"id":3}', 'utf8');
    const result = tryParseJsonLinesFrame(buf) as any;
    expect(result.line).toBeNull();
  });

  it('多行数据 → 只返回第一行，remaining 包含其余', () => {
    const buf = Buffer.from('line1\nline2\nline3', 'utf8');
    const result = tryParseJsonLinesFrame(buf) as any;
    expect(result.line).toBe('line1');
    expect(result.remaining.toString('utf8')).toBe('line2\nline3');
  });

  it('行前后有空白 → trim 后返回（去掉 \\r）', () => {
    const buf = Buffer.from('  {"id":1}  \n', 'utf8');
    const result = tryParseJsonLinesFrame(buf) as any;
    expect(result.line).toBe('{"id":1}');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// formatOutput
// ─────────────────────────────────────────────────────────────────────────────
describe('formatOutput', () => {
  const payload = { jsonrpc: '2.0', id: 1, result: 'ok' };

  it('jsonl 模式 → JSON + \\n 结尾', () => {
    const output = formatOutput(payload, 'jsonl');
    expect(output.endsWith('\n')).toBe(true);
    expect(JSON.parse(output.trimEnd())).toEqual(payload);
  });

  it('clength 模式 → Content-Length 头 + \\r\\n\\r\\n + JSON', () => {
    const output = formatOutput(payload, 'clength');
    expect(output.startsWith('Content-Length:')).toBe(true);
    expect(output).toContain('\r\n\r\n');
    const [header, body] = output.split('\r\n\r\n');
    expect(JSON.parse(body)).toEqual(payload);
    // 头中的字节数应正确
    const match = header.match(/Content-Length:\s*(\d+)/);
    expect(match).not.toBeNull();
    const declaredBytes = Number(match![1]);
    expect(declaredBytes).toBe(Buffer.byteLength(body, 'utf8'));
  });

  it('clength 模式的 Unicode 字节数正确', () => {
    const unicodePayload = { text: '你好世界' };
    const output = formatOutput(unicodePayload, 'clength');
    const [header, body] = output.split('\r\n\r\n');
    const match = header.match(/Content-Length:\s*(\d+)/);
    const declared = Number(match![1]);
    expect(declared).toBe(Buffer.byteLength(body, 'utf8'));
  });

  it('jsonl 模式下 payload 序列化为有效 JSON', () => {
    const arr = [1, 2, 3];
    const output = formatOutput(arr, 'jsonl');
    expect(JSON.parse(output)).toEqual(arr);
  });
});
