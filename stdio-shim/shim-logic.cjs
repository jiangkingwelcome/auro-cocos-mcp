'use strict';

/** 固定端口：同一时间只有一个 Cocos 项目被 MCP 操控 */
const DEFAULT_PORTS = [7779];

/**
 * 解析端口：固定使用单一端口，不做 fallback 扫描
 * @param {string | undefined} envPort - COCOS_BRIDGE_PORT 环境变量值
 * @param {number[]} [defaults] - 默认端口列表
 * @returns {number[]}
 */
function resolvePortCandidates(envPort, defaults) {
  if (envPort) {
    const parsed = Number(envPort);
    if (Number.isFinite(parsed)) {
      return [parsed];
    }
  }
  return (defaults || DEFAULT_PORTS).slice();
}

/**
 * 从输入预览字符串自动检测帧格式
 * @param {string} preview - 输入数据的前几十个字节转换成的字符串
 * @returns {'jsonl' | 'clength'}
 */
function detectFramingMode(preview) {
  const firstChar = preview.trim().charAt(0);
  if (firstChar === '{' || firstChar === '[') return 'jsonl';
  return 'clength';
}

/**
 * 尝试从 Buffer 中解析一个 Content-Length 帧
 * @param {Buffer} buffer
 * @returns {{ body: string, remaining: Buffer } | { error: string, remaining: Buffer } | null}
 * 返回 null 表示帧不完整，需要等待更多数据
 */
function tryParseContentLengthFrame(buffer) {
  const delimiter = buffer.indexOf('\r\n\r\n');
  if (delimiter === -1) return null;
  const header = buffer.slice(0, delimiter).toString('utf8');
  const match = header.match(/Content-Length:\s*(\d+)/i);
  if (!match) return { error: 'Missing Content-Length', remaining: Buffer.alloc(0) };
  const contentLength = Number(match[1]);
  const frameLength = delimiter + 4 + contentLength;
  if (buffer.length < frameLength) return null;
  const body = buffer.slice(delimiter + 4, frameLength).toString('utf8');
  const remaining = buffer.slice(frameLength);
  return { body, remaining };
}

/**
 * 尝试从 Buffer 中解析一行 JSON-Lines 数据
 * @param {Buffer} buffer
 * @returns {{ line: string | null, remaining: Buffer } | null}
 * 返回 null 表示没有换行符，需要等待更多数据；line 为 null 表示空行（需跳过）
 */
function tryParseJsonLinesFrame(buffer) {
  const newlineIdx = buffer.indexOf('\n');
  if (newlineIdx === -1) return null;
  const line = buffer.slice(0, newlineIdx).toString('utf8').trim();
  const remaining = buffer.slice(newlineIdx + 1);
  return { line: line.length > 0 ? line : null, remaining };
}

/**
 * 将 payload 格式化为对应帧格式的字符串
 * @param {unknown} payload
 * @param {'jsonl' | 'clength'} mode
 * @returns {string}
 */
function formatOutput(payload, mode) {
  const json = JSON.stringify(payload);
  if (mode === 'clength') {
    const bytes = Buffer.byteLength(json, 'utf8');
    return `Content-Length: ${bytes}\r\n\r\n${json}`;
  }
  return json + '\n';
}

module.exports = {
  DEFAULT_PORTS,
  resolvePortCandidates,
  detectFramingMode,
  tryParseContentLengthFrame,
  tryParseJsonLinesFrame,
  formatOutput,
};
