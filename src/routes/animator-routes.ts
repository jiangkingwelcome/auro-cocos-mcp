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
      return { success: true, command, uuid: uuid || undefined, result: result ?? null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { error: `animator 命令执行失败: ${msg}` };
    }
  });
}
