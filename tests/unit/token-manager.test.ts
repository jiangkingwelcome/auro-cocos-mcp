import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { ensureToken, extractMcpToken } from '../../src/token-manager';
import http from 'http';

// ─────────────────────────────────────────────────────────────────────────────
// ensureToken
// ─────────────────────────────────────────────────────────────────────────────
describe('ensureToken', () => {
  const tmpDir = path.join(os.tmpdir(), 'cocos-mcp-test-token-' + process.pid);
  const tokenFile = path.join(tmpDir, '.mcp-token');

  beforeEach(() => {
    fs.mkdirSync(tmpDir, { recursive: true });
    delete process.env.COCOS_MCP_TOKEN;
    // Clean up token file if exists
    try { fs.unlinkSync(tokenFile); } catch (_e) { }
  });

  afterEach(() => {
    delete process.env.COCOS_MCP_TOKEN;
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_e) { }
  });

  it('生成新 Token 并写入文件（文件不存在时）', () => {
    const token = ensureToken(tokenFile);
    expect(typeof token).toBe('string');
    expect(token.length).toBe(48); // 24 bytes hex = 48 chars
    // 文件应被创建
    const saved = fs.readFileSync(tokenFile, 'utf-8').trim();
    expect(saved).toBe(token);
  });

  it('复用文件中已有的 Token', () => {
    fs.writeFileSync(tokenFile, 'existing-token-value\n', 'utf-8');
    const token = ensureToken(tokenFile);
    expect(token).toBe('existing-token-value');
  });

  it('环境变量 COCOS_MCP_TOKEN 优先于文件', () => {
    fs.writeFileSync(tokenFile, 'file-token\n', 'utf-8');
    process.env.COCOS_MCP_TOKEN = 'env-token';
    const token = ensureToken(tokenFile);
    expect(token).toBe('env-token');
  });

  it('环境变量为空白时不使用', () => {
    process.env.COCOS_MCP_TOKEN = '   ';
    const token = ensureToken(tokenFile);
    // 应该生成新 token 而非使用空白
    expect(token.length).toBe(48);
  });

  it('文件为空时生成新 Token', () => {
    fs.writeFileSync(tokenFile, '', 'utf-8');
    const token = ensureToken(tokenFile);
    expect(token.length).toBe(48);
  });

  it('两次调用返回相同的 Token（从文件复用）', () => {
    const token1 = ensureToken(tokenFile);
    const token2 = ensureToken(tokenFile);
    expect(token1).toBe(token2);
  });

  it('读取 token 文件异常时会回退到生成新 token', () => {
    const existsSpy = vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    const readSpy = vi.spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw new Error('read denied');
    });
    const writeSpy = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

    const token = ensureToken(tokenFile);
    expect(token.length).toBe(48);
    expect(writeSpy).toHaveBeenCalled();

    existsSpy.mockRestore();
    readSpy.mockRestore();
    writeSpy.mockRestore();
  });

  it('写入 token 文件失败时仍返回内存中的 token', () => {
    const writeSpy = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {
      throw new Error('disk full');
    });

    const token = ensureToken(tokenFile);
    expect(token.length).toBe(48);

    writeSpy.mockRestore();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// extractMcpToken
// ─────────────────────────────────────────────────────────────────────────────
describe('extractMcpToken', () => {
  function fakeReq(headers: Record<string, string | undefined>): http.IncomingMessage {
    return { headers } as unknown as http.IncomingMessage;
  }

  it('从 X-MCP-Token 头提取 Token', () => {
    const req = fakeReq({ 'x-mcp-token': 'my-token-abc' });
    expect(extractMcpToken(req)).toBe('my-token-abc');
  });

  it('提取时会 trim X-MCP-Token 头', () => {
    const req = fakeReq({ 'x-mcp-token': '  my-token-abc  ' });
    expect(extractMcpToken(req)).toBe('my-token-abc');
  });

  it('从 Authorization Bearer 头提取 Token', () => {
    const req = fakeReq({ authorization: 'Bearer bearer-token-123' });
    expect(extractMcpToken(req)).toBe('bearer-token-123');
  });

  it('提取时会 trim Bearer token', () => {
    const req = fakeReq({ authorization: 'Bearer   bearer-token-123   ' });
    expect(extractMcpToken(req)).toBe('bearer-token-123');
  });

  it('X-MCP-Token 优先于 Authorization', () => {
    const req = fakeReq({
      'x-mcp-token': 'header-token',
      authorization: 'Bearer bearer-token',
    });
    expect(extractMcpToken(req)).toBe('header-token');
  });

  it('无 Token 头时返回空字符串', () => {
    const req = fakeReq({});
    expect(extractMcpToken(req)).toBe('');
  });

  it('空白 Token 头时返回空字符串', () => {
    const req = fakeReq({ 'x-mcp-token': '   ' });
    expect(extractMcpToken(req)).toBe('');
  });

  it('非 Bearer 认证头不提取', () => {
    const req = fakeReq({ authorization: 'Basic dXNlcjpwYXNz' });
    expect(extractMcpToken(req)).toBe('');
  });
});
