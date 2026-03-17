import crypto from 'crypto';
import fs from 'fs';
import http from 'http';
import { ErrorCategory, logIgnored, logWarn } from './error-utils';

/**
 * 从文件或环境变量中获取 Token，如果不存在则自动生成。
 */
export function ensureToken(tokenFile: string): string {
  const env = process.env.COCOS_MCP_TOKEN?.trim();
  if (env) return env;
  try {
    if (fs.existsSync(tokenFile)) {
      const existing = fs.readFileSync(tokenFile, 'utf-8').trim();
      if (existing) return existing;
    }
  } catch (e) {
    logIgnored(ErrorCategory.CONFIG, '读取 token 文件失败，将重新生成', e);
  }
  const generated = crypto.randomBytes(24).toString('hex');
  try {
    fs.writeFileSync(tokenFile, `${generated}\n`, 'utf-8');
  } catch (e) {
    logWarn(ErrorCategory.CONFIG, 'token 文件写入失败，仅保留在内存中', e);
  }
  return generated;
}

/**
 * 从 HTTP 请求头中提取 MCP Token。
 * 支持 X-MCP-Token 头和 Bearer 认证。
 */
export function extractMcpToken(req: http.IncomingMessage): string {
  const headerToken = req.headers['x-mcp-token'];
  if (typeof headerToken === 'string' && headerToken.trim()) return headerToken.trim();
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) return authHeader.slice(7).trim();
  return '';
}
