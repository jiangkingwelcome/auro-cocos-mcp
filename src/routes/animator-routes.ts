import type { RouteRegistrar } from './route-types';
import { ipc } from './route-types';

const ALLOWED_ANIMATOR_COMMANDS = new Set([
  'open',
  'play-or-pause',
  'stop',
  'next-step',
  'prev-step',
  'jump-to-first-frame',
  'jump-to-last-frame',
]);

function normalizeAnimatorResult(result: unknown, fallback: Record<string, unknown>) {
  if (result && typeof result === 'object' && ('success' in result || 'error' in result)) {
    return { ...fallback, ...(result as Record<string, unknown>) };
  }
  return { success: true, ...fallback, ...(result === undefined ? {} : { result }) };
}

export function registerAnimatorRoutes(post: RouteRegistrar): void {
  post('/api/animator/command', async (_params, body) => {
    const payload = (body && typeof body === 'object' ? body : {}) as { command?: string; uuid?: string };
    const command = String(payload.command || '');
    const uuid = String(payload.uuid || '');

    if (!command) return { error: '缺少 command 参数' };
    if (!ALLOWED_ANIMATOR_COMMANDS.has(command)) {
      return {
        error: `animator 命令 "${command}" 不在允许列表。允许: ${[...ALLOWED_ANIMATOR_COMMANDS].join(', ')}`,
      };
    }

    try {
      if (uuid) {
        Editor.Selection.select('node', [uuid]);
      }

      if (command !== 'open') {
        await ipc('animator', 'open');
        // Let the panel finish handling the selection before sending the control command.
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const result = await ipc('animator', command);
      return normalizeAnimatorResult(result, { command, uuid: uuid || undefined });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { error: `animator 命令执行失败: ${msg}` };
    }
  });
}
