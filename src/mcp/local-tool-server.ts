type TextContent = { type: 'text'; text: string };
export type ToolCallResult = { content: TextContent[]; isError?: boolean };
type ToolHandler = (args: Record<string, unknown>) => Promise<ToolCallResult>;

export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

type RegisteredTool = {
  name: string;
  description: string;
  schema: unknown;
  inputSchema: Record<string, unknown>;
  handler: ToolHandler;
  actionCount: number;
};

function toErrorResult(message: string): ToolCallResult {
  return { content: [{ type: 'text', text: message }], isError: true };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

const SUMMARY_KEYS = ['action', 'uuid', 'url', 'sourcePath', 'component', 'property', 'value', 'name', 'prefabUrl'];

function summarizeArgs(args: unknown): string {
  if (!isRecord(args)) return '{}';
  const parts: string[] = [];
  for (const k of SUMMARY_KEYS) {
    if (args[k] === undefined) continue;
    let v: unknown = args[k];
    if (typeof v === 'string' && v.length > 40) v = v.slice(0, 37) + '...';
    try { parts.push(`${k}:${JSON.stringify(v)}`); } catch { parts.push(`${k}:(unserializable)`); }
  }
  return `{${parts.join(', ')}}`;
}

function extractResultSummary(result: ToolCallResult): string {
  try {
    const parsed = JSON.parse(result.content[0]?.text || '{}');
    return typeof parsed.error === 'string' ? parsed.error : '(unknown error)';
  } catch { return '(parse error)'; }
}

// Convert a single Zod v4 type value to JSON Schema property
function zodToJsonSchemaProp(zodVal: unknown): Record<string, unknown> {
  if (!zodVal || typeof zodVal !== 'object') return {};
  const z = zodVal as Record<string, unknown>;
  const zodType = z.type as string | undefined;

  switch (zodType) {
    case 'string':
      return { type: 'string' };
    case 'number':
      return { type: 'number' };
    case 'boolean':
      return { type: 'boolean' };
    case 'enum': {
      const options = z.options as string[] | undefined;
      if (Array.isArray(options)) {
        return { type: 'string', enum: options };
      }
      return { type: 'string' };
    }
    case 'optional': {
      const def = z.def as Record<string, unknown> | undefined;
      const inner = def?.innerType;
      if (inner) return zodToJsonSchemaProp(inner);
      return {};
    }
    case 'nullable': {
      const def = z.def as Record<string, unknown> | undefined;
      const inner = def?.innerType;
      if (inner) {
        const base = zodToJsonSchemaProp(inner);
        return { ...base, nullable: true };
      }
      return {};
    }
    case 'array': {
      const element = z.element;
      if (element) {
        return { type: 'array', items: zodToJsonSchemaProp(element) };
      }
      return { type: 'array' };
    }
    case 'any':
      return {};
    default:
      return {};
  }
}

function resolveInputSchema(schema: unknown): Record<string, unknown> {
  if (!schema || typeof schema !== 'object') {
    return { type: 'object', properties: {} };
  }
  if (Array.isArray(schema)) {
    return { type: 'object', properties: {} };
  }

  const entries = Object.entries(schema as Record<string, unknown>);

  // Check: plain object with zod validators as values (our tool registration pattern)
  // Detect by checking if any value has a `.type` string property (zod v4 fingerprint)
  const isZodMap = entries.length > 0 && entries.some(([, val]) => {
    return val && typeof val === 'object' && typeof (val as Record<string, unknown>).type === 'string';
  });

  if (isZodMap) {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];
    for (const [key, val] of entries) {
      properties[key] = zodToJsonSchemaProp(val);
      // If the zod type is NOT optional, it's required
      const zodType = val && typeof val === 'object' ? (val as Record<string, unknown>).type : undefined;
      if (zodType && zodType !== 'optional' && zodType !== 'nullable') {
        required.push(key);
      }
    }
    return {
      type: 'object',
      properties,
      ...(required.length > 0 ? { required } : {}),
    };
  }

  // z.object() instance (has safeParse + shape)
  const zodLike = schema as { safeParse?: unknown; shape?: unknown };
  if (typeof zodLike.safeParse === 'function' && zodLike.shape && typeof zodLike.shape === 'object') {
    const properties: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(zodLike.shape as Record<string, unknown>)) {
      properties[key] = zodToJsonSchemaProp(val);
    }
    return { type: 'object', properties };
  }

  // Already valid JSON Schema (has type: 'object')
  if ((schema as Record<string, unknown>).type === 'object') {
    return schema as Record<string, unknown>;
  }

  return { type: 'object', properties: {} };
}

function validateArgs(schema: unknown, args: unknown): Record<string, unknown> {
  const zodLike = schema as { safeParse?: unknown };
  if (schema && typeof schema === 'object' && typeof zodLike.safeParse === 'function') {
    const result = (schema as { safeParse: (input: unknown) => { success: boolean; data: unknown; error?: unknown } }).safeParse(
      args ?? {},
    );
    if (!result.success) {
      const error = result.error as { issues?: Array<{ message?: string }> } | undefined;
      const detail = error?.issues?.map((item) => item.message || 'invalid').join('; ') || '参数校验失败';
      throw new Error(detail);
    }
    return (result.data ?? {}) as Record<string, unknown>;
  }
  return (args ?? {}) as Record<string, unknown>;
}

export class LocalToolServer {
  private readonly tools = new Map<string, RegisteredTool>();
  private readonly disabledTools = new Set<string>();
  private callSeq = 0;

  tool(name: string, description: string, schema: unknown, handler: ToolHandler): void {
    this.tools.set(name, {
      name,
      description,
      schema,
      inputSchema: resolveInputSchema(schema),
      handler,
      actionCount: this.detectActionCount(schema),
    });
  }

  getTotalActionCount(): number {
    let total = 0;
    for (const tool of this.tools.values()) {
      if (this.disabledTools.has(tool.name)) continue;
      total += tool.actionCount;
    }
    return total;
  }

  private detectActionCount(schema: unknown): number {
    if (!schema || typeof schema !== 'object') return 1;
    const s = schema as Record<string, unknown>;
    // JSON Schema format: { properties: { action: { enum: [...] } } }
    const props = s.properties as Record<string, unknown> | undefined;
    if (props) {
      const action = props.action as { enum?: unknown[] } | undefined;
      if (action && Array.isArray(action.enum) && action.enum.length > 0) {
        return action.enum.length;
      }
    }
    const action = s.action as { options?: unknown[] } | undefined;
    if (action && Array.isArray(action.options) && action.options.length > 0) {
      return action.options.length;
    }
    return 1;
  }

  disableTool(name: string): boolean {
    if (!this.tools.has(name)) return false;
    this.disabledTools.add(name);
    return true;
  }

  enableTool(name: string): boolean {
    return this.disabledTools.delete(name);
  }

  isToolEnabled(name: string): boolean {
    return this.tools.has(name) && !this.disabledTools.has(name);
  }

  setToolEnabled(name: string, enabled: boolean): { exists: boolean; changed: boolean; enabled: boolean } {
    if (!this.tools.has(name)) {
      return { exists: false, changed: false, enabled: false };
    }
    const wasEnabled = this.isToolEnabled(name);
    if (enabled) {
      this.disabledTools.delete(name);
    } else {
      this.disabledTools.add(name);
    }
    const isEnabled = this.isToolEnabled(name);
    return { exists: true, changed: wasEnabled !== isEnabled, enabled: isEnabled };
  }

  listTools(): Array<{ name: string; description: string; inputSchema: Record<string, unknown> }> {
    return Array.from(this.tools.values())
      .filter((tool) => !this.disabledTools.has(tool.name))
      .map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      }));
  }

  listAllToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  getToolEnabledStates(): Record<string, boolean> {
    const states: Record<string, boolean> = {};
    for (const name of this.tools.keys()) {
      states[name] = this.isToolEnabled(name);
    }
    return states;
  }

  getToolActions(): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    for (const [name, tool] of this.tools) {
      result[name] = this.extractActions(tool.schema);
    }
    return result;
  }

  private extractActions(schema: unknown): string[] {
    if (!schema || typeof schema !== 'object') return [];
    const s = schema as Record<string, unknown>;
    // Zod v4 style: { action: { options: [...] } }
    const action = s.action as { options?: unknown[] } | undefined;
    if (action && Array.isArray(action.options) && action.options.length > 0) {
      return action.options.map(String);
    }
    // JSON Schema style: { properties: { action: { enum: [...] } } }
    const props = s.properties as Record<string, unknown> | undefined;
    if (props) {
      const act = props.action as { enum?: unknown[] } | undefined;
      if (act && Array.isArray(act.enum) && act.enum.length > 0) {
        return act.enum.map(String);
      }
    }
    return [];
  }

  async callTool(name: string, args: unknown): Promise<ToolCallResult> {
    const tool = this.tools.get(name);
    if (!tool) return toErrorResult(`未知工具: ${name}`);
    if (this.disabledTools.has(name)) {
      return toErrorResult(`工具已被禁用: ${name}`);
    }

    const startMs = Date.now();
    const action = isRecord(args) ? args.action : undefined;
    const callId = ++this.callSeq;
    const tag = `${name}${action ? '.' + action : ''}`;

    console.log(`[MCP] #${callId} → ${tag} ${summarizeArgs(args)}`);

    try {
      const parsedArgs = validateArgs(tool.schema, args);
      const result = await tool.handler(parsedArgs);
      const elapsed = Date.now() - startMs;

      if (result.isError) {
        console.log(`[MCP] #${callId} ✗ ${tag} ${elapsed}ms — ${extractResultSummary(result)}`);
      } else {
        console.log(`[MCP] #${callId} ✓ ${tag} ${elapsed}ms`);
      }
      return result;
    } catch (err: unknown) {
      const elapsed = Date.now() - startMs;
      const message = err instanceof Error ? err.message : String(err);
      console.log(`[MCP] #${callId} ✗✗ ${tag} ${elapsed}ms — EXCEPTION: ${message}`);
      return toErrorResult(`工具执行失败: ${message}`);
    }
  }
}
