import fs from 'fs';
import path from 'path';
import { ErrorCategory, logIgnored } from '../error-utils';
import {
  _origLog,
  clearLogBuffer,
  getConsoleSinceTs,
  getProjectLogOffset,
  queryLogs,
  setProjectLogOffset,
} from '../console-capture';
import type { RouteRegistrar } from './route-types';

function getProjectLogPath(): string {
  const projectPath = Editor.Project?.path || '';
  return projectPath ? path.join(projectPath, 'temp', 'logs', 'project.log') : '';
}

function readProjectConsoleEntries(offset = 0): Array<{ type: 'log' | 'warn' | 'error'; message: string; timestamp: number; source: 'project-log' }> {
  const logPath = getProjectLogPath();
  if (!logPath || !fs.existsSync(logPath)) return [];
  const fileContent = fs.readFileSync(logPath, 'utf-8');
  const content = offset > 0 ? fileContent.slice(offset) : fileContent;
  const lines = content.split(/\r?\n/);
  const entries: Array<{ type: 'log' | 'warn' | 'error'; message: string; timestamp: number; source: 'project-log' }> = [];
  let current: { type: 'log' | 'warn' | 'error'; message: string; timestamp: number; source: 'project-log' } | null = null;
  const lineRe = /^(\d{4})-(\d{1,2})-(\d{1,2}) (\d{2}):(\d{2}):(\d{2}) - (\w+): (.*)$/;
  for (const line of lines) {
    const m = line.match(lineRe);
    if (m) {
      if (current) entries.push(current);
      const [, y, mo, d, h, mi, s, rawType, msg] = m;
      const ts = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s)).getTime();
      const t = rawType === 'error' ? 'error' : rawType === 'warn' ? 'warn' : 'log';
      current = { type: t, message: msg, timestamp: ts, source: 'project-log' };
    } else if (current && line.trim()) {
      current.message += `\n${line}`;
    }
  }
  if (current) entries.push(current);
  return entries;
}

export function registerConsoleRoutes(get: RouteRegistrar, post: RouteRegistrar): void {
  post('/api/console/log', async (_params, body) => {
    const payload = (body && typeof body === 'object' ? body : {}) as { text?: string };
    console.log(`[MCP] ${payload.text || ''}`);
    return { success: true };
  });

  post('/api/console/warn', async (_params, body) => {
    const payload = (body && typeof body === 'object' ? body : {}) as { text?: string };
    console.warn(`[MCP] ${payload.text || ''}`);
    return { success: true };
  });

  post('/api/console/error', async (_params, body) => {
    const payload = (body && typeof body === 'object' ? body : {}) as { text?: string };
    console.error(`[MCP] ${payload.text || ''}`);
    return { success: true };
  });

  post('/api/console/clear', async () => {
    const logPath = getProjectLogPath();
    try {
      if (logPath && fs.existsSync(logPath)) {
        setProjectLogOffset(fs.statSync(logPath).size);
      } else {
        setProjectLogOffset(0);
      }
    } catch (e) {
      logIgnored(ErrorCategory.CONFIG, '获取日志文件偏移失败，重置为 0', e);
      setProjectLogOffset(0);
    }
    clearLogBuffer();
    _origLog('[MCP] ────────── Console Cleared ──────────');
    return { success: true };
  });

  get('/api/console/logs', async (params) => {
    const opts = {
      type: params.type || 'all',
      keyword: params.keyword || '',
      count: Number(params.count || 50),
    };
    const bufferResult = queryLogs({ ...opts, count: 500 });
    const sinceTs = getConsoleSinceTs();
    const projectEntries = readProjectConsoleEntries(getProjectLogOffset())
      .filter(e => !sinceTs || e.timestamp >= sinceTs - 1000)
      .filter(e => opts.type === 'all' || e.type === opts.type)
      .filter(e => !opts.keyword || e.message.toLowerCase().includes(opts.keyword.toLowerCase()));

    const merged = [...projectEntries, ...bufferResult.logs.map(e => ({ ...e, source: 'buffer' as const }))]
      .sort((a, b) => a.timestamp - b.timestamp);

    const deduped: typeof merged = [];
    const seen = new Set<string>();
    for (const e of merged) {
      const key = `${e.type}|${e.timestamp}|${e.message}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(e);
    }
    const sliced = deduped.slice(-Math.min(opts.count, 500));
    return { total: deduped.length, returned: sliced.length, logs: sliced };
  });
}
