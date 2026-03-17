import http from 'http';

export type RouteHandler = (params: Record<string, string>, body: unknown, req?: http.IncomingMessage) => Promise<unknown>;

export type RouteRegistrar = (path: string, handler: RouteHandler) => void;

const IPC_TIMEOUT_MS = 15_000;

export function ipc(module: string, message: string, ...args: unknown[]): Promise<unknown> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return Promise.race([
    Editor.Message.request(module, message, ...args),
    new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => reject(new Error(`IPC 超时 (${IPC_TIMEOUT_MS}ms): ${module}.${message}`)), IPC_TIMEOUT_MS);
    }),
  ]).finally(() => { if (timer) clearTimeout(timer); });
}

/**
 * IPC fallback chain entry. The wrapper tries `alternatives` in order
 * when the primary call throws.  This covers Cocos 3.x cross-version
 * IPC name differences (e.g. `set-view-mode` vs `set-mode`).
 */
export interface IpcFallback {
  module: string;
  message: string;
  mapArgs?: (...originalArgs: unknown[]) => unknown[];
}

/**
 * Safe IPC wrapper with automatic fallback chain.
 *
 * 1. Tries `module.message(...args)` first.
 * 2. On failure, iterates through `fallbacks` in order.
 * 3. If all fail, returns a structured error including the
 *    original error and a hint that the API may not exist on
 *    this Cocos version.
 */
export async function safeEditorMsg(
  module: string,
  message: string,
  args: unknown[],
  fallbacks?: IpcFallback[],
): Promise<{ ok: true; data: unknown } | { ok: false; error: string; triedPaths: string[] }> {
  const tried: string[] = [];
  try {
    tried.push(`${module}.${message}`);
    const data = await ipc(module, message, ...args);
    return { ok: true, data };
  } catch (primaryErr) {
    if (fallbacks && fallbacks.length > 0) {
      for (const fb of fallbacks) {
        try {
          tried.push(`${fb.module}.${fb.message}`);
          const fbArgs = fb.mapArgs ? fb.mapArgs(...args) : args;
          const data = await ipc(fb.module, fb.message, ...fbArgs);
          return { ok: true, data };
        } catch {
          // continue to next fallback
        }
      }
    }
    const msg = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
    return {
      ok: false,
      error: `IPC 调用失败: ${msg} (当前 Cocos 版本可能不支持此接口)`,
      triedPaths: tried,
    };
  }
}
