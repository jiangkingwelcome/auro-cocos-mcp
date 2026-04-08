import type { ServerResponse } from 'http';
import { LocalToolServer } from './local-tool-server';

type JsonRpcId = string | number | null;

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: JsonRpcId;
  method?: string;
  params?: unknown;
};

type JsonRpcResponse = {
  jsonrpc: '2.0';
  id: JsonRpcId;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
};

type ClientSession = {
  key: string;
  name: string;
  version: string;
  isShim: boolean;
  lastSeenMs: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function rpcResult(id: JsonRpcId, result: unknown): JsonRpcResponse {
  return { jsonrpc: '2.0', id, result };
}

function rpcError(id: JsonRpcId, code: number, message: string, data?: unknown): JsonRpcResponse {
  return { jsonrpc: '2.0', id, error: { code, message, ...(data !== undefined ? { data } : {}) } };
}

/**
 * 超过此时长未收到 initialize 或心跳的会话视为已断连。
 * stdio shim 每 15 秒发一次心跳，45 秒超时可覆盖 3 个心跳周期，
 * 兼顾短暂抖动与连接状态收敛速度。
 */
const SESSION_TIMEOUT_MS = 45 * 1000;

export class StandaloneMcpHost {
  private readonly protocolVersion = '2024-11-05';
  private toolListVersion = 1;

  /** 按会话 key 存储客户端会话。 */
  private clientSessions = new Map<string, ClientSession>();
  /** 仅当真实 AI 客户端（非 shim）发过 initialize 时才为 true，用于插件重载后的计数补偿。 */
  private hasReceivedRealClientRequest = false;

  /** SSE 长连接客户端，key 为自增 id。 */
  private sseClients = new Map<string, ServerResponse>();
  private sseIdCounter = 0;

  constructor(
    private readonly options: {
      serverName: string;
      serverVersion: string;
      toolServer: LocalToolServer;
    },
  ) { }

  getServerInfo() {
    return {
      name: this.options.serverName,
      version: this.options.serverVersion,
      protocolVersion: this.protocolVersion,
      capabilities: { tools: { listChanged: true } },
    };
  }

  getToolCount(): number {
    return this.options.toolServer.listTools().length;
  }

  getToolNames(): string[] {
    return this.options.toolServer.listTools().map(t => t.name);
  }

  getAllToolNames(): string[] {
    return this.options.toolServer.listAllToolNames();
  }

  getToolActions(): Record<string, string[]> {
    return this.options.toolServer.getToolActions();
  }

  getToolEnabledStates(): Record<string, boolean> {
    return this.options.toolServer.getToolEnabledStates();
  }

  getToolListVersion(): number {
    return this.toolListVersion;
  }

  setToolEnabled(name: string, enabled: boolean): { exists: boolean; changed: boolean; enabled: boolean; toolListVersion: number } {
    const result = this.options.toolServer.setToolEnabled(name, enabled);
    if (result.changed) {
      this.toolListVersion += 1;
      this.broadcastSse('notifications/tools/list_changed', {});
    }
    return { ...result, toolListVersion: this.toolListVersion };
  }

  /** shim 纯转发会话，不计入连接数。 */
  private isShimClient(name: string): boolean {
    return name.startsWith('cocos-stdio-shim');
  }

  /**
   * 解析客户端会话标识。
   * 优先使用实例级 id（clientInfo.instanceId/clientSessionId/sessionId），
   * 解决同名同版本编辑器并发连接时的冲突。
   */
  private parseClientSession(params: unknown): ClientSession {
    const now = Date.now();
    if (!isRecord(params)) {
      return {
        key: 'unknown:unknown:legacy',
        name: 'unknown',
        version: '',
        isShim: false,
        lastSeenMs: now,
      };
    }

    const info = isRecord(params.clientInfo) ? params.clientInfo : {};
    const name = typeof info.name === 'string' ? info.name : 'unknown';
    const version = typeof info.version === 'string' ? info.version : '';

    const instanceIdCandidates = [
      isRecord(info) ? info.instanceId : undefined,
      isRecord(info) ? info.clientSessionId : undefined,
      params.sessionId,
      params.clientSessionId,
    ];

    let instanceId = '';
    for (const candidate of instanceIdCandidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        instanceId = candidate.trim();
        break;
      }
    }

    // 兼容旧客户端：没有实例 ID 时保留 legacy key（行为与历史一致）。
    const key = instanceId
      ? `${name}:${version}:instance:${instanceId}`
      : `${name}:${version}:legacy`;

    return {
      key,
      name,
      version,
      isShim: this.isShimClient(name),
      lastSeenMs: now,
    };
  }

  /**
   * 返回已连接的 AI 客户端数量。
   * SSE 长连接优先：有 SSE 客户端时直接返回 SSE 连接数（持久连接，最准确）。
   * 否则按 HTTP 会话计数（过滤 shim）。
   */
  getConnectionCount(): number {
    if (this.sseClients.size > 0) return this.sseClients.size;
    this.pruneStaleSessions();
    let count = 0;
    for (const session of this.clientSessions.values()) {
      if (!session.isShim) count++;
    }
    return count;
  }

  /**
   * 注册一个 SSE 长连接客户端。
   * 返回清理函数，在连接关闭时调用。
   */
  addSseClient(res: ServerResponse): () => void {
    const id = String(++this.sseIdCounter);
    this.sseClients.set(id, res);
    this.hasReceivedRealClientRequest = true;
    return () => {
      this.sseClients.delete(id);
    };
  }

  /**
   * 关闭所有 SSE 长连接（插件卸载时调用，让 AI 编辑器感知断连并触发重连）。
   */
  closeAllSseClients(): void {
    for (const res of this.sseClients.values()) {
      try { res.end(); } catch { /* ignore */ }
    }
    this.sseClients.clear();
  }

  /** 向所有 SSE 客户端广播 JSON-RPC 通知。 */
  private broadcastSse(method: string, params: Record<string, unknown> = {}): void {
    if (this.sseClients.size === 0) return;
    const msg = `data: ${JSON.stringify({ jsonrpc: '2.0', method, params })}\n\n`;
    for (const [id, res] of this.sseClients) {
      try {
        res.write(msg);
      } catch {
        try { res.end(); } catch { /* ignore */ }
        this.sseClients.delete(id);
      }
    }
  }

  /** 返回已连接的 AI 客户端列表（同 getConnectionCount 的过滤规则）。 */
  getConnectedClients(): Array<{ name: string; version: string; lastSeenMs: number }> {
    this.pruneStaleSessions();
    const result: Array<{ name: string; version: string; lastSeenMs: number }> = [];
    for (const session of this.clientSessions.values()) {
      if (session.isShim) continue;
      result.push({
        name: session.name,
        version: session.version,
        lastSeenMs: session.lastSeenMs,
      });
    }
    return result;
  }

  resetConnectionCount(): void {
    this.clientSessions.clear();
    this.hasReceivedRealClientRequest = false;
  }

  private pruneStaleSessions(): void {
    const now = Date.now();
    for (const [k, session] of this.clientSessions) {
      if (now - session.lastSeenMs > SESSION_TIMEOUT_MS) this.clientSessions.delete(k);
    }
  }

  getTotalActionCount(): number {
    return this.options.toolServer.getTotalActionCount();
  }

  async handlePayload(payload: unknown): Promise<{ status: number; body?: unknown }> {
    if (Array.isArray(payload)) {
      const responses: JsonRpcResponse[] = [];
      for (const item of payload) {
        const response = await this.handleSingle(item);
        if (response) responses.push(response);
      }
      if (responses.length === 0) return { status: 204 };
      return { status: 200, body: responses };
    }
    const single = await this.handleSingle(payload);
    if (!single) return { status: 204 };
    return { status: 200, body: single };
  }

  private async handleSingle(payload: unknown): Promise<JsonRpcResponse | null> {
    if (!isRecord(payload)) return rpcError(null, -32600, 'Invalid Request');

    const req = payload as JsonRpcRequest;
    const id: JsonRpcId = req.id ?? null;
    const method = req.method;
    if (typeof method !== 'string' || !method) return rpcError(id, -32600, 'Invalid Request');

    const isNotification = req.id === undefined;

    try {
      switch (method) {
        case 'initialize': {
          this.pruneStaleSessions();
          const session = this.parseClientSession(req.params);
          this.clientSessions.set(session.key, session);
          if (!session.isShim) {
            this.hasReceivedRealClientRequest = true;
          }
          const result = {
            protocolVersion: this.protocolVersion,
            capabilities: { tools: { listChanged: true } },
            serverInfo: { name: this.options.serverName, version: this.options.serverVersion },
            instructions: 'Cocos standalone MCP host',
          };
          return isNotification ? null : rpcResult(id, result);
        }
        case 'notifications/initialized':
          return null;
        case 'notifications/client-heartbeat': {
          const session = this.parseClientSession(req.params);
          const existing = this.clientSessions.get(session.key);
          if (existing) {
            existing.lastSeenMs = Date.now();
            this.clientSessions.set(session.key, existing);
          }
          return null;
        }
        case 'notifications/client-disconnect': {
          const session = this.parseClientSession(req.params);
          if (this.clientSessions.has(session.key)) {
            this.clientSessions.delete(session.key);
          } else {
            // 兜底：删除最老的 session
            let oldest: string | null = null;
            let oldestT = Infinity;
            for (const [k, s] of this.clientSessions) {
              if (s.lastSeenMs < oldestT) { oldestT = s.lastSeenMs; oldest = k; }
            }
            if (oldest !== null) this.clientSessions.delete(oldest);
          }
          return null;
        }
        case 'ping':
          return isNotification ? null : rpcResult(id, {});
        case 'tools/list':
          return isNotification ? null : rpcResult(id, { tools: this.options.toolServer.listTools() });
        case 'tools/call': {
          if (!isRecord(req.params)) {
            return isNotification ? null : rpcError(id, -32602, 'Invalid params: expected object');
          }
          const toolName = req.params.name;
          if (typeof toolName !== 'string' || !toolName) {
            return isNotification ? null : rpcError(id, -32602, 'Invalid params: missing name');
          }
          const args = req.params.arguments;
          const result = await this.options.toolServer.callTool(toolName, args);
          return isNotification ? null : rpcResult(id, result);
        }
        case 'resources/list':
          return isNotification ? null : rpcResult(id, { resources: [] });
        case 'prompts/list':
          return isNotification ? null : rpcResult(id, { prompts: [] });
        default:
          return isNotification ? null : rpcError(id, -32601, `Method not found: ${method}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return isNotification ? null : rpcError(id, -32603, message);
    }
  }
}
