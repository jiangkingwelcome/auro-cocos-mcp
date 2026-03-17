import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  acquireLock, tryAcquireLock, getActiveLocks, isResourceLocked,
  recordOperation, getHistory, undoLastOperation, clearHistory,
  executeTransaction, withLock,
  type TransactionStep,
} from '../../src/operation-manager';

describe('operation-manager', () => {
  describe('lock system', () => {
    it('acquireLock returns a release function', async () => {
      const release = await acquireLock('res-a', 'test');
      expect(typeof release).toBe('function');
      release();
    });

    it('tryAcquireLock returns null when locked', async () => {
      const release = await acquireLock('res-b', 'holder1');
      const second = tryAcquireLock('res-b', 'holder2');
      expect(second).toBeNull();
      release();
    });

    it('tryAcquireLock succeeds when unlocked', () => {
      const release = tryAcquireLock('res-c', 'holder');
      expect(release).not.toBeNull();
      release!();
    });

    it('getActiveLocks returns current locks', async () => {
      const release = await acquireLock('res-d', 'test-holder');
      const locks = getActiveLocks();
      expect(locks.some(l => l.key === 'res-d' && l.holder === 'test-holder')).toBe(true);
      release();
    });

    it('isResourceLocked returns correct state', async () => {
      expect(isResourceLocked('res-e')).toBe(false);
      const release = await acquireLock('res-e', 'test');
      expect(isResourceLocked('res-e')).toBe(true);
      release();
      expect(isResourceLocked('res-e')).toBe(false);
    });

    it('withLock executes function under lock', async () => {
      const result = await withLock('res-f', 'test', async () => 'done');
      expect(result).toBe('done');
      expect(isResourceLocked('res-f')).toBe(false);
    });

    it('withLock releases lock on exception', async () => {
      await expect(withLock('res-g', 'test', async () => { throw new Error('fail'); })).rejects.toThrow('fail');
      expect(isResourceLocked('res-g')).toBe(false);
    });

    it('queued waiters get lock after release', async () => {
      const order: number[] = [];
      const release1 = await acquireLock('res-h', 'first');
      const p2 = acquireLock('res-h', 'second').then(rel => { order.push(2); rel(); });
      order.push(1);
      release1();
      await p2;
      expect(order).toEqual([1, 2]);
    });
  });

  describe('operation history', () => {
    beforeEach(() => {
      clearHistory();
    });

    it('recordOperation adds to history', () => {
      recordOperation('scene_op', 'create_node', { name: 'Foo' }, { uuid: '123' });
      const h = getHistory();
      expect(h.length).toBe(1);
      expect(h[0].tool).toBe('scene_op');
      expect(h[0].action).toBe('create_node');
    });

    it('getHistory returns most recent first', () => {
      recordOperation('t1', 'a1', {}, {});
      recordOperation('t2', 'a2', {}, {});
      const h = getHistory();
      expect(h[0].tool).toBe('t2');
      expect(h[1].tool).toBe('t1');
    });

    it('getHistory respects limit', () => {
      for (let i = 0; i < 10; i++) recordOperation('t', `a${i}`, {}, {});
      expect(getHistory(3).length).toBe(3);
    });

    it('history caps at MAX_HISTORY (50)', () => {
      for (let i = 0; i < 60; i++) recordOperation('t', `a${i}`, {}, {});
      expect(getHistory(100).length).toBe(50);
    });

    it('clearHistory empties the buffer', () => {
      recordOperation('t', 'a', {}, {});
      clearHistory();
      expect(getHistory().length).toBe(0);
    });
  });

  describe('undoLastOperation', () => {
    beforeEach(() => {
      clearHistory();
    });

    it('returns error when no operations exist', async () => {
      const result = await undoLastOperation();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('executes rollback actions', async () => {
      const rollbackFn = vi.fn().mockResolvedValue(undefined);
      recordOperation('t', 'a', {}, {}, [{ description: 'undo create', execute: rollbackFn }]);
      const result = await undoLastOperation();
      expect(result.success).toBe(true);
      expect(rollbackFn).toHaveBeenCalled();
    });

    it('marks operation as rolled back', async () => {
      recordOperation('t', 'a', {}, {}, [{ description: 'undo', execute: vi.fn().mockResolvedValue(undefined) }]);
      await undoLastOperation();
      const second = await undoLastOperation();
      expect(second.success).toBe(false);
    });

    it('handles rollback failure', async () => {
      recordOperation('t', 'a', {}, {}, [{ description: 'fail undo', execute: vi.fn().mockRejectedValue(new Error('undo fail')) }]);
      const result = await undoLastOperation();
      expect(result.success).toBe(false);
      expect(result.rollbackResults![0].error).toContain('undo fail');
    });

    it('skips operations without rollback actions', async () => {
      recordOperation('t1', 'a1', {}, {});
      recordOperation('t2', 'a2', {}, {}, [{ description: 'undo t2', execute: vi.fn().mockResolvedValue(undefined) }]);
      const result = await undoLastOperation();
      expect(result.operationId).toBeDefined();
      expect(result.action).toBe('t2/a2');
    });
  });

  describe('executeTransaction', () => {
    it('executes all steps successfully', async () => {
      const steps: TransactionStep[] = [
        { name: 'step1', execute: vi.fn().mockResolvedValue('r1') },
        { name: 'step2', execute: vi.fn().mockResolvedValue('r2') },
      ];
      const result = await executeTransaction(steps, { name: 'test-tx' });
      expect(result.success).toBe(true);
      expect(result.completedSteps).toBe(2);
      expect(result.totalSteps).toBe(2);
    });

    it('rolls back on failure', async () => {
      const rollback1 = vi.fn().mockResolvedValue(undefined);
      const steps: TransactionStep[] = [
        { name: 'step1', execute: vi.fn().mockResolvedValue('r1'), rollback: rollback1 },
        { name: 'step2', execute: vi.fn().mockRejectedValue(new Error('fail')) },
      ];
      const result = await executeTransaction(steps, { name: 'test-tx' });
      expect(result.success).toBe(false);
      expect(result.rolledBack).toBe(true);
      expect(rollback1).toHaveBeenCalledWith('r1');
    });

    it('skips rollback when autoRollback is false', async () => {
      const rollback1 = vi.fn();
      const steps: TransactionStep[] = [
        { name: 'step1', execute: vi.fn().mockResolvedValue('r1'), rollback: rollback1 },
        { name: 'step2', execute: vi.fn().mockRejectedValue(new Error('fail')) },
      ];
      const result = await executeTransaction(steps, { autoRollback: false });
      expect(result.success).toBe(false);
      expect(result.rolledBack).toBeUndefined();
      expect(rollback1).not.toHaveBeenCalled();
    });

    it('continues on error when continueOnError is true', async () => {
      const steps: TransactionStep[] = [
        { name: 'step1', execute: vi.fn().mockResolvedValue('r1') },
        { name: 'step2', execute: vi.fn().mockRejectedValue(new Error('fail')) },
        { name: 'step3', execute: vi.fn().mockResolvedValue('r3') },
      ];
      const result = await executeTransaction(steps, { continueOnError: true });
      expect(result.success).toBe(false);
      expect(result.results.length).toBe(3);
      expect(result.results[2].success).toBe(true);
    });

    it('handles rollback failure gracefully', async () => {
      const steps: TransactionStep[] = [
        { name: 'step1', execute: vi.fn().mockResolvedValue('r1'), rollback: vi.fn().mockRejectedValue(new Error('rb fail')) },
        { name: 'step2', execute: vi.fn().mockRejectedValue(new Error('fail')) },
      ];
      const result = await executeTransaction(steps);
      expect(result.rolledBack).toBe(true);
      expect(result.rollbackResults![0].success).toBe(false);
    });

    it('acquires and releases resource locks', async () => {
      const steps: TransactionStep[] = [
        { name: 'step1', resourceKey: 'tx-res-1', execute: vi.fn().mockResolvedValue('ok') },
      ];
      await executeTransaction(steps, { name: 'lock-tx' });
      expect(isResourceLocked('tx-res-1')).toBe(false);
    });
  });
});
