import { clearHistory, getActiveLocks, getHistory, undoLastOperation } from '../operation-manager';
import type { RouteRegistrar } from './route-types';

export function registerOperationRoutes(get: RouteRegistrar, post: RouteRegistrar): void {
  get('/api/operations/history', async (params) => {
    const limit = Number(params.limit || 20);
    const history = getHistory(limit);
    return {
      success: true,
      count: history.length,
      operations: history.map(h => ({
        id: h.id,
        timestamp: h.timestamp,
        tool: h.tool,
        action: h.action,
        hasRollback: !!(h.rollbackActions && h.rollbackActions.length > 0),
        rolledBack: h.rolledBack ?? false,
      })),
    };
  });

  post('/api/operations/undo', async () => undoLastOperation());

  post('/api/operations/clear-history', async () => {
    clearHistory();
    return { success: true, message: '操作历史已清空' };
  });

  get('/api/operations/locks', async () => {
    const locks = getActiveLocks();
    return { success: true, count: locks.length, locks };
  });
}
