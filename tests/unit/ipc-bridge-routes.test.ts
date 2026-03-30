import { describe, expect, it, vi, beforeEach } from 'vitest';
import { registerIpcBridgeRoutes } from '../../src/routes/ipc-bridge-routes';

const ipcMock = vi.fn();

vi.mock('../../src/routes/route-types', () => ({
  ipc: (...args: unknown[]) => ipcMock(...args),
}));

type RegisteredHandler = (params: Record<string, string>, body: unknown) => Promise<unknown>;

describe('ipc-bridge-routes', () => {
  const handlers = new Map<string, RegisteredHandler>();

  beforeEach(() => {
    handlers.clear();
    ipcMock.mockReset();
    registerIpcBridgeRoutes((path, handler) => {
      handlers.set(path, handler);
    }, 'test-extension');
  });

  it('rejects execute-script when args length exceeds 50', async () => {
    const handler = handlers.get('/api/scene/execute-script');
    expect(handler).toBeDefined();

    const result = await handler!({}, {
      method: 'dispatchQuery',
      args: Array.from({ length: 51 }, (_, i) => i),
    });

    expect(result).toEqual({ error: 'args 长度不能超过 50' });
    expect(ipcMock).not.toHaveBeenCalled();
  });

  it('rejects message/send when args length exceeds 50', async () => {
    const handler = handlers.get('/api/message/send');
    expect(handler).toBeDefined();

    const result = await handler!({}, {
      module: 'scene',
      message: 'query-node',
      args: Array.from({ length: 51 }, (_, i) => i),
    });

    expect(result).toEqual({ error: 'args 长度不能超过 50' });
    expect(ipcMock).not.toHaveBeenCalled();
  });

  it('forwards valid message/send requests', async () => {
    const handler = handlers.get('/api/message/send');
    expect(handler).toBeDefined();
    ipcMock.mockResolvedValueOnce({ ok: true });

    const result = await handler!({}, {
      module: 'scene',
      message: 'query-node',
      args: ['node-1'],
    });

    expect(ipcMock).toHaveBeenCalledWith('scene', 'query-node', 'node-1');
    expect(result).toEqual({
      success: true,
      module: 'scene',
      message: 'query-node',
      result: { ok: true },
    });
  });
});
