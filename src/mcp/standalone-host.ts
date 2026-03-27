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
 * stdio shim 每 15 秒发一次心跳（notifications/client-heartbeat），
 * 因此 20 秒超时 = 2.5 个心跳周期容错，编辑器关闭后最多 20 秒内计数归零。
 * SSE 长连接不受此限制，断线立即感知。
 */
const SESSION_TIMEOUT_MS = 20 * 1000;

export class StandaloneMcpHost {
  private readonly protocolVersion = '2024-11-05';
  private toolListVersion = 1;

  /**
   * 按 clientInfo 去重的客户端会话。
   * key: `${clientInfo.name}:${clientInfo.version}`（同一 AI 编辑器多次 initialize 视为同一连接）。
   * value: 该客户端上次 initialize 的时间戳。
   */
  private clientSessions = new Map<string, number>();
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

  /**
   * shim 纯转发会话，不计入连接数。
   * aura-stdio-shim-reconnect 是重连心跳，代表真实 AI 编辑器在线，不在此列。
   */
  private isShimClient(key: string): boolean {
    return key.startsWith('cocos-stdio-shim');
  }

  /**
   * 返回已连接的 AI 客户端数量。
   * SSE 长连接优先：有 SSE 客户端时直接返回 SSE 连接数（持久连接，最准确）。
   * 否则按 clientInfo 去重的 HTTP 会话计数（同一编辑器多次 initialize 计为 1 个）。
   * stdio shim 内部重连会话不计入用户可见的连接数。
   */
  getConnectionCount(): number {
    // SSE 连接是持久的，最能反映真实在线状态
    if (this.sseClients.size > 0) return this.sseClients.size;
    this.pruneStaleSessions();
    let count = 0;
    for (const key of this.clientSessions.keys()) {
      if (!this.isShimClient(key)) count++;
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

  /**
   * 向所有 SSE 客户端广播 JSON-RPC 通知。
   */
  private broadcastSse(method: string, params: Record<string, unknown> = {}): void {
    if (this.sseClients.size === 0) return;
    const msg = `data: ${JSON.stringify({ jsonrpc: '2.0', method, params })}\n\n`;
    for (const [id, res] of this.sseClients) {
      try {
        res.write(msg);
      } catch {
        this.sseClients.delete(id);
      }
    }
  }

  /**
   * 返回已连接的 AI 客户端列表（同 getConnectionCount 的过滤规则）。
   */
  getConnectedClients(): Array<{ name: string; version: string; lastSeenMs: number }> {
    this.pruneStaleSessions();
    const result: Array<{ name: string; version: string; lastSeenMs: number }> = [];
    for (const [key, ts] of this.clientSessions) {
      if (this.isShimClient(key)) continue;
      const colonIdx = key.indexOf(':');
      const name = colonIdx >= 0 ? key.slice(0, colonIdx) : key;
      const version = colonIdx >= 0 ? key.slice(colonIdx + 1) : '';
      result.push({ name, version, lastSeenMs: ts });
    }
    return result;
  }

  resetConnectionCount(): void {
    this.clientSessions.clear();
    this.hasReceivedRealClientRequest = false;
  }

  private getClientKey(params: unknown): string {
    if (!isRecord(params)) return 'unknown:';
    const info = params.clientInfo;
    if (!isRecord(info)) return 'unknown:';
    const name = typeof info.name === 'string' ? info.name : 'unknown';
    const version = typeof info.version === 'string' ? info.version : '';
    return `${name}:${version}`;
  }

  private pruneStaleSessions(): void {
    const now = Date.now();
    for (const [k, t] of this.clientSessions) {
      if (now - t > SESSION_TIMEOUT_MS) this.clientSessions.delete(k);
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
          const clientKey = this.getClientKey(req.params);
          this.clientSessions.set(clientKey, Date.now());
          if (!this.isShimClient(clientKey)) {
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
          // shim 每 15 秒发一次心跳，刷新 session 时间戳防止超时
          const heartbeatKey = this.getClientKey(req.params);
          if (heartbeatKey && heartbeatKey !== 'unknown:' && this.clientSessions.has(heartbeatKey)) {
            this.clientSessions.set(heartbeatKey, Date.now());
          }
          return null;
        }
        case 'notifications/client-disconnect': {
          // 优先用 params.clientInfo 精确删除对应 session（shim 断连时携带）
          const disconnectKey = this.getClientKey(req.params);
          if (disconnectKey && disconnectKey !== 'unknown:' && this.clientSessions.has(disconnectKey)) {
            this.clientSessions.delete(disconnectKey);
          } else {
            // 兜底：删除最老的 session
            let oldest: string | null = null;
            let oldestT = Infinity;
            for (const [k, t] of this.clientSessions) {
              if (t < oldestT) { oldestT = t; oldest = k; }
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
