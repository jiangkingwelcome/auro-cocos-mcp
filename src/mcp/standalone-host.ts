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

/** 超过此时长未收到 init 的会话视为已断连（HTTP 无 client-disconnect 时用于清理）。 */
const SESSION_TIMEOUT_MS = 5 * 60 * 1000;

export class StandaloneMcpHost {
  private readonly protocolVersion = '2024-11-05';
  private toolListVersion = 1;

  /**
   * 按 clientInfo 去重的客户端会话。
   * key: `${clientInfo.name}:${clientInfo.version}`（同一 AI 编辑器多次 initialize 视为同一连接）。
   * value: 该客户端上次 initialize 的时间戳。
   */
  private clientSessions = new Map<string, number>();
  private hasReceivedAnyRequest = false;

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
    }
    return { ...result, toolListVersion: this.toolListVersion };
  }

  /**
   * 返回已连接的 AI 客户端数量。
   * 按 clientInfo 去重：同一编辑器（相同 name+version）的多次 initialize 计为 1 个连接。
   * stdio shim 内部重连会话（cocos-stdio-shim-*）不计入用户可见的连接数。
   */
  getConnectionCount(): number {
    this.pruneStaleSessions();
    let count = 0;
    for (const key of this.clientSessions.keys()) {
      if (!key.startsWith('cocos-stdio-shim')) count++;
    }
    if (count === 0 && this.hasReceivedAnyRequest) return 1;
    return count;
  }

  resetConnectionCount(): void {
    this.clientSessions.clear();
    this.hasReceivedAnyRequest = false;
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

    // 标记：有请求进来过（用于插件重载后的自动补偿）
    this.hasReceivedAnyRequest = true;

    try {
      switch (method) {
        case 'initialize': {
          this.pruneStaleSessions();
          const clientKey = this.getClientKey(req.params);
          this.clientSessions.set(clientKey, Date.now());
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
        case 'notifications/client-disconnect': {
          // NOTE: HTTP transport has no session ID in disconnect notifications,
          // so we can only do best-effort cleanup by removing the oldest session.
          // If multiple IDEs are connected, the wrong session may be removed.
          if (this.clientSessions.size === 0) return null;
          let oldest: string | null = null;
          let oldestT = Infinity;
          for (const [k, t] of this.clientSessions) {
            if (t < oldestT) {
              oldestT = t;
              oldest = k;
            }
          }
          if (oldest !== null) this.clientSessions.delete(oldest);
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
