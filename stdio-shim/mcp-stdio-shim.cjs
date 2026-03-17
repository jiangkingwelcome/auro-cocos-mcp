#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  DEFAULT_PORTS,
  resolvePortCandidates,
  detectFramingMode,
  tryParseContentLengthFrame,
  tryParseJsonLinesFrame,
  formatOutput,
} = require('./shim-logic.cjs');

const LOG_FILE = path.join(os.homedir(), '.aura-for-cocos-shim.log');
const LOOPBACK_HOST = process.env.BRIDGE_HOST || '127.0.0.1';
const REQUEST_TIMEOUT_MS = Number(process.env.COCOS_MCP_SHIM_TIMEOUT_MS || 15000);

let discoveredEndpoint = process.env.COCOS_MCP_ENDPOINT || '';
let discoveredToken = process.env.COCOS_MCP_TOKEN || '';
let readBuffer = Buffer.alloc(0);

// 项目身份追踪：记住当前连接的项目，切换时通知用户
let connectedProjectName = '';
let connectedProjectPath = '';
let projectSwitchWarning = '';  // 非空时在下一次响应中附加警告

const MAX_LOG_SIZE = 2 * 1024 * 1024; // 2 MB

function log(msg) {
  const ts = new Date().toISOString();
  try {
    // Rotate log if it exceeds max size
    try {
      const stat = fs.statSync(LOG_FILE);
      if (stat.size > MAX_LOG_SIZE) {
        const backupPath = LOG_FILE + '.old';
        try { fs.unlinkSync(backupPath); } catch { /* ignore */ }
        fs.renameSync(LOG_FILE, backupPath);
      }
    } catch { /* file doesn't exist yet, that's fine */ }
    fs.appendFileSync(LOG_FILE, `[${ts}] ${msg}\n`);
  } catch { /* ignore write errors */ }
  process.stderr.write(`[aura-stdio-shim] ${msg}\n`);
}

function timeoutSignal(ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  if (typeof timer.unref === 'function') timer.unref();
  return controller.signal;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    signal: timeoutSignal(REQUEST_TIMEOUT_MS),
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

/**
 * 查询当前连接的 Cocos 项目信息
 */
async function queryProjectInfo(port) {
  try {
    const info = await requestJson(`http://${LOOPBACK_HOST}:${port}/api/editor/project-info`, { method: 'GET' });
    if (info && typeof info === 'object') {
      return { name: info.projectName || '', path: info.projectPath || '' };
    }
  } catch { }
  return { name: '', path: '' };
}

/**
 * 检测项目是否发生了切换，如果切换了就记录警告
 */
async function checkProjectSwitch(port) {
  const proj = await queryProjectInfo(port);
  if (!proj.name) return;

  if (!connectedProjectName) {
    // 首次连接，记住项目
    connectedProjectName = proj.name;
    connectedProjectPath = proj.path;
    log(`[project] connected to: ${proj.name} (${proj.path})`);
  } else if (proj.path !== connectedProjectPath) {
    // 项目切换了！
    const oldName = connectedProjectName;
    const oldPath = connectedProjectPath;
    connectedProjectName = proj.name;
    connectedProjectPath = proj.path;
    const warning = `⚠️ MCP 连接的 Cocos 项目已切换！从 "${oldName}" (${oldPath}) 切换到 "${proj.name}" (${proj.path})。如果这不是你期望的，请关闭多余的 Cocos 项目。`;
    log(`[project] PROJECT SWITCHED! ${warning}`);
    projectSwitchWarning = warning;
  } else {
    // 同一个项目重连（Cocos 重启等），清除警告
    log(`[project] reconnected to same project: ${proj.name}`);
  }
}

function readTokenFromLocalSources(port) {
  // 1. Try registry file (most reliable — written by the plugin on startup)
  try {
    const registryFile = path.join(os.homedir(), '.aura-ports.json');
    if (fs.existsSync(registryFile)) {
      const registry = JSON.parse(fs.readFileSync(registryFile, 'utf-8'));
      for (const entry of Object.values(registry)) {
        if (entry && entry.port === port && typeof entry.token === 'string' && entry.token.length > 10) {
          return entry.token;
        }
      }
    }
  } catch { /* ignore */ }
  // 2. Try .mcp-token file next to the plugin
  try {
    const candidates = [
      path.join(__dirname, '..', '.mcp-token'),
      path.join(__dirname, '.mcp-token'),
    ];
    for (const f of candidates) {
      if (fs.existsSync(f)) {
        const t = fs.readFileSync(f, 'utf-8').trim();
        if (t && t.length > 10 && /^[\x20-\x7e]+$/.test(t)) return t;
      }
    }
  } catch { /* ignore */ }
  return '';
}

async function discoverHost() {
  if (discoveredEndpoint) return { endpoint: discoveredEndpoint, token: discoveredToken };
  const ports = resolvePortCandidates(process.env.COCOS_BRIDGE_PORT || process.env.BRIDGE_PORT, DEFAULT_PORTS);
  log(`discovering host, trying ports: ${ports.join(', ')}`);
  for (const port of ports) {
    const base = `http://${LOOPBACK_HOST}:${port}`;
    try {
      const info = await requestJson(`${base}/api/mcp/connection-info`, { method: 'GET' });
      if (info && info.endpoint) {
        discoveredEndpoint = String(info.endpoint);
        // Read token from local files (API response is masked)
        const localToken = readTokenFromLocalSources(port);
        if (localToken) {
          discoveredToken = localToken;
        } else if (typeof info.token === 'string' && /^[0-9a-f]+$/i.test(info.token)) {
          discoveredToken = info.token;
        }
        log(`discovered host: ${discoveredEndpoint} (token: ${discoveredToken ? discoveredToken.slice(0, 8) + '...' : 'none'})`);
        await checkProjectSwitch(port);
        return { endpoint: discoveredEndpoint, token: discoveredToken };
      }
    } catch (e) {
      log(`port ${port} failed: ${e.message || e}`);
    }
  }
  throw new Error('无法发现 Aura MCP Host，请确认插件已启动');
}

/**
 * 当 Cocos 重启后，shim 需要替客户端补发一次 initialize 握手，
 * 让新的服务端知道我们还活着。
 */
let needsReInitialize = false;

async function autoReInitialize(host, port) {
  log('auto re-initializing with new MCP host...');
  try {
    const initPayload = {
      jsonrpc: '2.0',
      id: `shim-reinit-${Date.now()}`,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'aura-stdio-shim-reconnect', version: '1.0.0' },
      },
    };
    const headers = {};
    if (host.token) headers['X-MCP-Token'] = host.token;
    await requestJson(host.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(initPayload),
    });
    log('auto re-initialize succeeded, connection count restored');
    // 重连成功后检查项目是否切换
    if (port) await checkProjectSwitch(port);
  } catch (e) {
    log(`auto re-initialize failed: ${e.message || e}`);
  }
}

async function forwardToHost(payload, _retryCount = 0) {
  let host;
  try {
    host = await discoverHost();
  } catch (e) {
    // 发现失败，如果还没重试过，等一会再试（Cocos 可能正在启动中）
    if (_retryCount < 2) {
      log(`discover failed, retrying in 2s... (attempt ${_retryCount + 1})`);
      await new Promise(r => setTimeout(r, 2000));
      return forwardToHost(payload, _retryCount + 1);
    }
    throw e;
  }

  try {
    const headers = {};
    if (host.token) headers['X-MCP-Token'] = host.token;
    const result = await requestJson(host.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    // Token 被拒 → Cocos 重启换了 token → 重新发现
    if (!_retryCount && result && typeof result === 'object' && typeof result.error === 'string' && result.error.includes('token')) {
      log('token rejected, re-discovering host...');
      discoveredEndpoint = '';
      discoveredToken = '';
      needsReInitialize = true;
      return forwardToHost(payload, _retryCount + 1);
    }

    // 如果刚刚重新发现了 host，需要补发 initialize
    if (needsReInitialize) {
      needsReInitialize = false;
      await autoReInitialize(host);
    }

    return result;
  } catch (err) {
    // 连接失败（ECONNREFUSED / ETIMEDOUT 等）→ Cocos 可能重启了
    if (_retryCount < 2) {
      log(`connection failed: ${err.message || err}, clearing cache and re-discovering... (attempt ${_retryCount + 1})`);
      discoveredEndpoint = '';
      discoveredToken = '';
      needsReInitialize = true;
      // 等待一小段时间，给 Cocos 启动的缓冲
      await new Promise(r => setTimeout(r, 1500));
      return forwardToHost(payload, _retryCount + 1);
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Auto-detect framing mode: 'jsonl' (newline-delimited) or 'clength' (Content-Length)
// New MCP spec (2025) uses JSON lines; old spec uses Content-Length headers.
// ---------------------------------------------------------------------------
let framingMode = '';

function writeOutput(payload) {
  process.stdout.write(formatOutput(payload, framingMode || 'jsonl'));
  log(`>>> wrote response (${framingMode}): ${JSON.stringify(payload).substring(0, 120)}...`);
}

function writeError(id, code, message) {
  writeOutput({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });
}

async function handleMessage(message) {
  log(`<<< received message: ${message.substring(0, 150)}...`);
  let parsed;
  try {
    parsed = JSON.parse(message);
  } catch (e) {
    log(`parse error: ${e.message}`);
    writeError(null, -32700, 'Parse error');
    return;
  }
  try {
    log(`forwarding method=${parsed.method || '(batch)'} id=${parsed.id}`);
    const response = await forwardToHost(parsed);
    log(`got response from host: ${JSON.stringify(response).substring(0, 120)}`);
    const isNotification = !Array.isArray(parsed) && parsed && parsed.id === undefined;
    if (response == null || isNotification) {
      log(`skipping response (null=${response == null}, notification=${isNotification})`);
      return;
    }
    // 如果有项目切换警告，附加到 tools/call 的返回中让 AI 知道
    if (projectSwitchWarning && response && typeof response === 'object' && response.result) {
      const result = response.result;
      if (result && typeof result === 'object' && Array.isArray(result.content)) {
        result.content.push({ type: 'text', text: `\n\n${projectSwitchWarning}` });
        log(`[project] injected switch warning into response`);
        projectSwitchWarning = '';  // 只通知一次
      }
    }
    writeOutput(response);
  } catch (err) {
    const messageText = err instanceof Error ? err.message : String(err);
    log(`forward error: ${messageText}`);
    if (Array.isArray(parsed)) {
      const failures = parsed
        .filter((item) => item && item.id !== undefined)
        .map((item) => ({ jsonrpc: '2.0', id: item.id, error: { code: -32603, message: messageText } }));
      if (failures.length) writeOutput(failures);
      return;
    }
    const id = parsed && typeof parsed === 'object' ? parsed.id ?? null : null;
    writeError(id, -32603, messageText);
  }
}

// Content-Length framed consumer (old MCP spec)
function consumeContentLength() {
  while (true) {
    const result = tryParseContentLengthFrame(readBuffer);
    if (result === null) return;
    if (result.error) {
      readBuffer = result.remaining; // shim-logic 保证这里是 Buffer.alloc(0)
      writeError(null, -32600, result.error);
      return;
    }
    readBuffer = result.remaining;
    void handleMessage(result.body);
  }
}

// Newline-delimited JSON consumer (new MCP spec 2025)
function consumeJsonLines() {
  while (true) {
    const result = tryParseJsonLinesFrame(readBuffer);
    if (result === null) return;
    readBuffer = result.remaining;
    if (result.line !== null) {
      void handleMessage(result.line);
    }
  }
}

function detectAndConsume() {
  if (readBuffer.length === 0) return;

  if (!framingMode) {
    const preview = readBuffer.toString('utf8', 0, Math.min(readBuffer.length, 40));
    log(`detecting framing, first bytes: ${JSON.stringify(preview)}`);
    framingMode = detectFramingMode(preview);
    log(`detected ${framingMode === 'jsonl' ? 'JSON-lines' : 'Content-Length'} framing`);
  }

  if (framingMode === 'jsonl') {
    consumeJsonLines();
  } else {
    consumeContentLength();
  }
}

process.stdin.on('data', (chunk) => {
  log(`stdin data received, ${chunk.length} bytes`);
  readBuffer = Buffer.concat([readBuffer, chunk]);
  detectAndConsume();
});

// ---------------------------------------------------------------------------
// 告别握手：通知 MCP 服务端"我要走了"
// ---------------------------------------------------------------------------
let disconnectSent = false;

function sendDisconnect() {
  if (disconnectSent) return;
  disconnectSent = true;
  if (!discoveredEndpoint) return;

  log('sending disconnect notification to MCP host...');
  const payload = JSON.stringify({
    jsonrpc: '2.0',
    method: 'notifications/client-disconnect',
  });

  // 用同步风格的 fire-and-forget，进程即将退出不等响应
  try {
    const url = new URL(discoveredEndpoint);
    const http = require('http');
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...(discoveredToken ? { 'X-MCP-Token': discoveredToken } : {}),
      },
      timeout: 2000,
    });
    req.on('error', () => { }); // 忽略错误，进程要死了
    req.write(payload);
    req.end();
    log('disconnect notification sent');
  } catch (e) {
    log(`disconnect send failed: ${e.message || e}`);
  }
}

process.stdin.on('end', () => {
  log('stdin ended');
  sendDisconnect();
});

process.stdin.on('close', () => {
  log('stdin closed');
  sendDisconnect();
});

process.on('SIGTERM', () => {
  log('received SIGTERM');
  sendDisconnect();
  process.exit(0);
});

process.on('SIGINT', () => {
  log('received SIGINT');
  sendDisconnect();
  process.exit(0);
});

process.on('exit', () => {
  sendDisconnect(); // 最后的保险
});

log(`started, node=${process.version}, pid=${process.pid}, COCOS_BRIDGE_PORT=${process.env.COCOS_BRIDGE_PORT || '(not set)'}`);

// ---------------------------------------------------------------------------
// 后台保活探针：主动检测 MCP 服务是否在线
// Cocos 重启后，不用等 AI 发请求，shim 自己就能感知并自动重连。
// ---------------------------------------------------------------------------
const HEALTH_CHECK_INTERVAL_MS = 15_000; // 每 15 秒探测一次
let serverAlive = false;

const healthTimer = setInterval(async () => {
  const ports = resolvePortCandidates(process.env.COCOS_BRIDGE_PORT || process.env.BRIDGE_PORT, DEFAULT_PORTS);
  for (const port of ports) {
    try {
      const info = await requestJson(`http://${LOOPBACK_HOST}:${port}/api/mcp/connection-info`, { method: 'GET' });
      if (info && info.endpoint) {
        const oldEndpoint = discoveredEndpoint;
        discoveredEndpoint = String(info.endpoint);
        const localToken = readTokenFromLocalSources(port);
        if (localToken) {
          discoveredToken = localToken;
        } else if (typeof info.token === 'string' && /^[0-9a-f]+$/i.test(info.token)) {
          discoveredToken = info.token;
        }

        if (!serverAlive || oldEndpoint !== discoveredEndpoint) {
          // 服务刚上线或端口变了 → 自动补发 initialize
          serverAlive = true;
          log(`[healthcheck] MCP host detected at port ${port}, auto re-initializing...`);
          await autoReInitialize({ endpoint: discoveredEndpoint, token: discoveredToken }, port);
        }
        return; // 找到了就不再继续扫描
      }
    } catch {
      // 这个端口不通，继续试下一个
    }
  }
  // 所有端口都不通 → 服务离线
  if (serverAlive) {
    log('[healthcheck] MCP host went offline');
    serverAlive = false;
    discoveredEndpoint = '';
    discoveredToken = '';
    needsReInitialize = true;
  }
}, HEALTH_CHECK_INTERVAL_MS);

// 让定时器不阻止进程退出
if (typeof healthTimer.unref === 'function') healthTimer.unref();

