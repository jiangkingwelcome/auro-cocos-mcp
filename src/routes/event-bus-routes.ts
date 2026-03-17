import { ErrorCategory, logIgnored } from '../error-utils';
import type { RouteRegistrar } from './route-types';

interface BridgeEvent {
  type: string;
  data: unknown;
  ts: number;
}

const eventQueue: BridgeEvent[] = [];
const MAX_EVENTS = 200;
const broadcastHandlers: Array<{ event: string; handler: (...args: unknown[]) => void }> = [];

function pushEvent(type: string, data: unknown = {}) {
  eventQueue.push({ type, data, ts: Date.now() });
  if (eventQueue.length > MAX_EVENTS) eventQueue.splice(0, eventQueue.length - MAX_EVENTS);
}

export function registerBroadcastListeners() {
  unregisterBroadcastListeners();
  const handlers: Array<[string, (...args: unknown[]) => void]> = [
    ['scene:ready', () => pushEvent('scene:ready', {})],
    ['scene:saved', () => pushEvent('scene:saved', {})],
    ['asset-db:asset-add', (uuid, info) => pushEvent('asset:add', { uuid, info })],
    ['asset-db:asset-delete', (uuid) => pushEvent('asset:delete', { uuid })],
    ['asset-db:asset-change', (uuid) => pushEvent('asset:change', { uuid })],
    ['selection:select', (type, uuids) => pushEvent('selection:select', { type, uuids })],
  ];
  for (const [event, handler] of handlers) {
    Editor.Message.addBroadcastListener(event, handler);
    broadcastHandlers.push({ event, handler });
  }
  console.log(`[MCP] 广播系统已注册 ${handlers.length} 个事件监听`);
}

export function unregisterBroadcastListeners() {
  for (const { event, handler } of broadcastHandlers) {
    try {
      Editor.Message.removeBroadcastListener(event, handler);
    } catch (e) {
      logIgnored(ErrorCategory.EDITOR_IPC, `移除广播监听 "${event}" 失败`, e);
    }
  }
  broadcastHandlers.length = 0;
}

export function registerEventBusRoutes(get: RouteRegistrar, post: RouteRegistrar): void {
  get('/api/events/poll', async (params) => {
    const since = parseInt(params.since || '0', 10);
    const limit = Math.min(parseInt(params.limit || '50', 10), 100);
    const events = eventQueue.filter(e => e.ts > since).slice(-limit);
    return { events, count: events.length, serverTime: Date.now(), queueSize: eventQueue.length };
  });

  get('/api/events/history', async (params) => {
    const limit = Math.min(parseInt(params.limit || '20', 10), 100);
    const events = eventQueue.slice(-limit);
    return { events, count: events.length, serverTime: Date.now() };
  });

  post('/api/events/clear', async () => {
    eventQueue.length = 0;
    return { success: true };
  });

  post('/api/events/emit', async (_params, body) => {
    const payload = (body && typeof body === 'object' ? body : {}) as { channel?: string; data?: unknown };
    if (!payload.channel) return { error: '缺少 channel 参数' };
    pushEvent(`custom:${payload.channel}`, payload.data ?? null);
    return { success: true, channel: payload.channel, queueSize: eventQueue.length };
  });
}
