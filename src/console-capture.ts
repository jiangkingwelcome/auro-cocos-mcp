// Console capture — must be imported as early as possible (in main.ts)
// Hooks console.log/warn/error to capture all output into a ring buffer

export interface LogEntry {
  type: 'log' | 'warn' | 'error';
  message: string;
  timestamp: number;
}

const LOG_BUFFER_MAX = 500;

type ConsoleCaptureState = {
  logBuffer: LogEntry[];
  consoleSinceTs: number;
  projectLogOffset: number;
  installed: boolean;
  origLog: typeof console.log;
  origWarn: typeof console.warn;
  origError: typeof console.error;
};

const stateKey = '__cocosMcpConsoleCaptureState';
const globalState = globalThis as typeof globalThis & { [stateKey]?: ConsoleCaptureState };
const state = globalState[stateKey] ?? {
  logBuffer: [],
  consoleSinceTs: 0,
  projectLogOffset: 0,
  installed: false,
  origLog: console.log.bind(console),
  origWarn: console.warn.bind(console),
  origError: console.error.bind(console),
};
globalState[stateKey] = state;

export const logBuffer = state.logBuffer;

function pushLog(type: LogEntry['type'], args: unknown[]) {
  const message = args.map(a => {
    if (typeof a === 'string') return a;
    try { return JSON.stringify(a); } catch { return String(a); }
  }).join(' ');
  state.logBuffer.push({ type, message, timestamp: Date.now() });
  if (state.logBuffer.length > LOG_BUFFER_MAX) state.logBuffer.splice(0, state.logBuffer.length - LOG_BUFFER_MAX);
}

export const _origLog = state.origLog;
export const _origWarn = state.origWarn;
export const _origError = state.origError;

export function installConsoleCapture() {
  if (state.installed) return;
  state.installed = true;
  console.log = (...args: unknown[]) => { pushLog('log', args); _origLog(...args); };
  console.warn = (...args: unknown[]) => { pushLog('warn', args); _origWarn(...args); };
  console.error = (...args: unknown[]) => { pushLog('error', args); _origError(...args); };
}

export function clearLogBuffer() {
  state.logBuffer.length = 0;
  // project.log timestamps are only second-precision, so keep a 1-second grace window
  // to avoid dropping logs emitted in the same second right after clear_console.
  state.consoleSinceTs = Math.floor(Date.now() / 1000) * 1000 - 1000;
}

export function queryLogs(options: { type?: string; keyword?: string; count?: number } = {}) {
  const { type = 'all', keyword = '', count = 50 } = options;
  const max = Math.min(count, LOG_BUFFER_MAX);
  let entries = type === 'all' ? logBuffer : logBuffer.filter(e => e.type === type);
  if (keyword) {
    const kw = keyword.toLowerCase();
    entries = entries.filter(e => e.message.toLowerCase().includes(kw));
  }
  const sliced = entries.slice(-max);
  return { total: entries.length, returned: sliced.length, logs: sliced };
}

export function getConsoleSinceTs() {
  return state.consoleSinceTs;
}

export function setProjectLogOffset(offset: number) {
  state.projectLogOffset = Math.max(0, offset);
}

export function getProjectLogOffset() {
  return state.projectLogOffset;
}
