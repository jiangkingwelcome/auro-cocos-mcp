import { z } from 'zod';
import type { LocalToolServer } from './local-tool-server';
import type { BridgeToolContext } from './tools-shared';
import { toInputSchema, errorMessage, validateRequiredParams } from './tools-shared';
import { ErrorCategory, logIgnored } from '../error-utils';

export function registerMiscTools(server: LocalToolServer, ctx: BridgeToolContext): void {
  const { bridgeGet, bridgePost, editorMsg, text } = ctx;
  const toStructuredToolResult = (result: unknown, successMeta: Record<string, unknown>, fallbackResult?: unknown) => {
    if (result && typeof result === 'object' && ('success' in result || 'error' in result)) {
      const merged = { ...successMeta, ...(result as Record<string, unknown>) };
      const failed = ('error' in merged && merged.error) || ('success' in merged && merged.success === false);
      return text(merged, Boolean(failed));
    }
    return text({ success: true, ...successMeta, ...(result === undefined ? (fallbackResult === undefined ? {} : { result: fallbackResult }) : { result }) });
  };

  server.tool(
    'preferences',
    `Read or write Cocos Editor preferences with scope awareness (global/project/default).

Actions & required parameters:
- get: key(REQUIRED), scope(optional: "global"/"project"/"default", default="global"). Read a preference value.
- set: key(REQUIRED), value(REQUIRED), scope(optional: "global"/"project", default="global"). Write a preference value.
- list: no params. List all available preferences with scope info.
- get_global: key(REQUIRED). Shortcut: read from global scope.
- set_global: key(REQUIRED), value(REQUIRED). Shortcut: write to global scope.
- get_project: key(REQUIRED). Shortcut: read from project scope.
- set_project: key(REQUIRED), value(REQUIRED). Shortcut: write to project scope.

Common keys: "general.language" (en/zh), "general.theme" (dark/light), "builder.compressTexture", "preview.port".

Returns: get→{value}. set→{success,key,value,scope}. list→{preferences:[{key,scope,value}]}. On error: {error:"message"}.`,
    toInputSchema({
      action: z.enum(['get', 'set', 'list', 'get_global', 'set_global', 'get_project', 'set_project']).describe(
        'Preference action. "get/set"=with scope param, "list"=list all, "*_global/*_project"=scope shortcut.'
      ),
      key: z.string().optional().describe(
        'Preference key path. REQUIRED for: get, set, get_global, set_global, get_project, set_project. ' +
        'Format: "category.name". Examples: "general.language", "general.theme", "builder.compressTexture".'
      ),
      value: z.union([z.string(), z.number(), z.boolean(), z.record(z.string(), z.unknown())]).optional().describe(
        'Value to write. REQUIRED for: set, set_global, set_project.'
      ),
      scope: z.enum(['global', 'project', 'default']).optional().describe(
        'Preference scope. "global"=user-level (default), "project"=project-level, "default"=read-only defaults. ' +
        'Used by: get, set.'
      ),
    }),
    async (params: Record<string, unknown>) => {
      try {
        const p = params;
        const _paramErr = validateRequiredParams('preferences', String(p.action), p);
        if (_paramErr) return text({ error: _paramErr }, true);
        const resolveScope = (action: string) => {
          if (action.endsWith('_global')) return 'global';
          if (action.endsWith('_project')) return 'project';
          return String(p.scope || 'global');
        };
        const actionStr = String(p.action);
        const scope = resolveScope(actionStr);
        const key = String(p.key || '');

        if (actionStr === 'list') {
          return text(await bridgeGet('/api/preferences/get'));
        }

        const isGet = actionStr === 'get' || actionStr === 'get_global' || actionStr === 'get_project';
        const isSet = actionStr === 'set' || actionStr === 'set_global' || actionStr === 'set_project';

        if (isGet) {
          try {
            const result = await editorMsg('editor', 'config-get', scope, key);
            return text({ key, scope, value: result });
          } catch (e) {
            logIgnored(ErrorCategory.EDITOR_IPC, `通过 IPC 读取偏好 "${key}" 失败，回退到 HTTP 接口`, e);
            return text(await bridgeGet('/api/preferences/get', { key, scope }));
          }
        }

        if (isSet) {
          try {
            await editorMsg('editor', 'config-set', scope, key, p.value);
            return text({ success: true, key, scope, value: p.value });
          } catch (e) {
            logIgnored(ErrorCategory.EDITOR_IPC, `通过 IPC 写入偏好 "${key}" 失败，回退到 HTTP 接口`, e);
            const result = await bridgePost('/api/preferences/set', { key, value: p.value, scope }) as Record<string, unknown>;
            // 如果后端返回了 warning 字段，把它拼接到返回文本结尾，让 AI 直接读到并转述给用户
            if (result && typeof result.warning === 'string') {
              const resultText = JSON.stringify(result, null, 2);
              const warningText = `\n\n🟡 重要提示：${result.warning}`;
              return {
                content: [{ type: 'text' as const, text: resultText + warningText }],
              };
            }
            return text(result);
          }
        }

        return text({ error: `未知的 action: ${p.action}` }, true);
      } catch (err: unknown) {
        return text({ error: errorMessage(err) }, true);
      }
    },
  );

  server.tool(
    'broadcast',
    `Poll, manage, and send editor event broadcasts.

Actions & required parameters:
- poll: since(recommended, timestamp in ms). Get new events since a timestamp. If omitted, returns all recent events.
- history: limit(optional, default 20). Get recent N events.
- clear: no params. Clear the event queue.
- send: channel(REQUIRED), data(optional). Broadcast a custom message to all listeners.
- send_ipc: module(REQUIRED), message(REQUIRED), args(optional). Send a raw Editor IPC broadcast message.

Event types: scene:ready, scene:saved, asset:add, asset:delete, asset:change, selection:select.
Use this to monitor what changed in the editor between AI operations, or send custom messages.

Returns: poll→{events:[{type,data,timestamp}]}. history→{events:[]}. send→{success}. send_ipc→{success}. On error: {error:"message"}.`,
    toInputSchema({
      action: z.enum(['poll', 'history', 'clear', 'send', 'send_ipc']).describe(
        'Broadcast action. "poll"=get events, "history"=recent events, "clear"=flush, "send"=broadcast custom message, "send_ipc"=raw IPC broadcast.'
      ),
      since: z.number().int().min(0).optional().describe(
        'Unix timestamp in milliseconds. Used by: poll.'
      ),
      limit: z.number().int().min(1).max(100).optional().describe(
        'Maximum events to return. Used by: poll (default 50), history (default 20). Max: 100.'
      ),
      channel: z.string().optional().describe(
        'Custom broadcast channel name. REQUIRED for: send. Example: "ai:task-complete", "custom:refresh".'
      ),
      data: z.union([z.string(), z.number(), z.boolean(), z.record(z.string(), z.unknown()), z.array(z.unknown())]).optional().describe(
        'Data payload for custom broadcast. Used by: send.'
      ),
      module: z.string().optional().describe(
        'Editor IPC module for send_ipc. REQUIRED for: send_ipc. Allowed: scene, asset-db, selection, preview, builder, panel.'
      ),
      message: z.string().optional().describe(
        'IPC message name. REQUIRED for: send_ipc.'
      ),
      args: z.array(z.unknown()).optional().describe(
        'Arguments for send_ipc call.'
      ),
    }),
    async (params: Record<string, unknown>) => {
      try {
        const p = params;
        const _paramErr2 = validateRequiredParams('broadcast', String(p.action), p);
        if (_paramErr2) return text({ error: _paramErr2 }, true);
        switch (p.action) {
          case 'poll':
            return text(await bridgeGet('/api/events/poll', {
              since: String(p.since || 0),
              limit: String(p.limit || 50),
            }));
          case 'history':
            return text(await bridgeGet('/api/events/history', {
              limit: String(p.limit || 20),
            }));
          case 'clear':
            return text(await bridgePost('/api/events/clear'));
          case 'send': {
            const event = {
              channel: p.channel,
              data: p.data ?? null,
              timestamp: Date.now(),
              source: 'mcp',
            };
            try {
              await bridgePost('/api/events/emit', event);
            } catch { /* emit route may not exist yet */ }
            await bridgePost('/api/console/log', { text: `[Broadcast] ${p.channel}: ${JSON.stringify(p.data ?? null)}` });
            return text({ success: true, action: 'send', ...event });
          }
          case 'send_ipc': {
            const allowedModules = ['scene', 'asset-db', 'selection', 'preview', 'builder', 'panel'];
            if (!allowedModules.includes(String(p.module))) {
              return text({ error: `模块 "${p.module}" 不在允许列表。允许: ${allowedModules.join(', ')}` }, true);
            }
            try {
              const result = await editorMsg(String(p.module), String(p.message), ...(Array.isArray(p.args) ? p.args : []));
              return toStructuredToolResult(result, { module: p.module, message: p.message }, 'sent');
            } catch (err: unknown) {
              return text({ error: `IPC 广播失败: ${errorMessage(err)}` }, true);
            }
          }
          default:
            return text({ error: `未知的 action: ${p.action}` }, true);
        }
      } catch (err: unknown) {
        return text({ error: errorMessage(err) }, true);
      }
    },
  );

  // reference_image is Pro-exclusive — registered only via Rust native module

  // ─── Tool Management ──────────────────────────────────────────────────
  server.tool(
    'tool_management',
    `Manage MCP tool availability. Enable/disable tools to reduce token consumption and AI confusion.

Actions & required parameters:
- list_all: no params. List all registered tools with enabled/disabled status and action counts.
- enable: toolName(REQUIRED). Enable a previously disabled tool.
- disable: toolName(REQUIRED). Disable a tool (it won't appear in tool listings).
- get_stats: no params. Get overall tool statistics (total tools, total actions, enabled/disabled counts).

Returns: list_all→{tools:[{name,enabled,actionCount}]}. enable/disable→{success,toolName,enabled,changed}. get_stats→{totalTools,totalActions,enabledCount,disabledCount}. Note: tool_management itself cannot be disabled.`,
    toInputSchema({
      action: z.enum(['list_all', 'enable', 'disable', 'get_stats']).describe(
        'Tool management action.'
      ),
      toolName: z.string().optional().describe(
        'Name of the tool to enable/disable. REQUIRED for: enable, disable. ' +
        'Use list_all to discover available tool names.'
      ),
    }),
    async (params: Record<string, unknown>) => {
      try {
        const p = params;
        const _paramErr4 = validateRequiredParams('tool_management', String(p.action), p);
        if (_paramErr4) return text({ error: _paramErr4 }, true);
        switch (p.action) {
          case 'list_all': {
            const allNames = server.listAllToolNames();
            const toolActions = server.getToolActions();
            const tools = allNames.map(name => ({
              name,
              enabled: server.isToolEnabled(name),
              actionCount: toolActions[name]?.length || 1,
            }));
            return text({ totalTools: tools.length, tools });
          }
          case 'enable': {
            const toolName = String(p.toolName);
            const allNames = server.listAllToolNames();
            if (!allNames.includes(toolName)) {
              return text({ error: `未知工具: ${toolName}` }, true);
            }
            const changed = !server.isToolEnabled(toolName);
            server.enableTool(toolName);
            return text({ success: true, toolName, enabled: true, changed });
          }
          case 'disable': {
            const toolName = String(p.toolName);
            if (toolName === 'tool_management') return text({ error: '不能禁用 tool_management 工具本身' }, true);
            const allNames = server.listAllToolNames();
            if (!allNames.includes(toolName)) {
              return text({ error: `未知工具: ${toolName}` }, true);
            }
            const changed = server.isToolEnabled(toolName);
            server.disableTool(toolName);
            return text({ success: true, toolName, enabled: false, changed });
          }
          case 'get_stats': {
            const allNames = server.listAllToolNames();
            const enabledCount = allNames.filter(n => server.isToolEnabled(n)).length;
            const totalActions = server.getTotalActionCount();
            return text({
              totalTools: allNames.length,
              enabledCount,
              disabledCount: allNames.length - enabledCount,
              enabledTools: enabledCount,
              disabledTools: allNames.length - enabledCount,
              totalActions,
            });
          }
          default:
            return text({ error: `未知的 action: ${p.action}` }, true);
        }
      } catch (err: unknown) {
        return text({ error: errorMessage(err) }, true);
      }
    },
  );
}
