/**
 * 操作管理器 — 提供事务支持、操作撤销和并发控制
 *
 * 1. 事务支持：批量操作失败时自动回滚已完成的步骤
 * 2. 操作撤销：维护操作历史环形缓冲区，支持撤销最近操作
 * 3. 并发控制：基于资源键的异步互斥锁，防止同时修改同一资源
 */

import { ErrorCategory, logIgnored, logWarn, logError } from './error-utils';

// ---------------------------------------------------------------------------
// 1. 并发控制 — 资源级异步互斥锁
// ---------------------------------------------------------------------------

interface LockEntry {
  key: string;
  holder: string;
  acquiredAt: number;
  promise: Promise<void>;
  release: () => void;
}

const _locks = new Map<string, LockEntry>();
const _waitQueues = new Map<string, Array<() => void>>();
const LOCK_TIMEOUT_MS = 30_000;

/**
 * 获取资源锁。同一资源键在同一时刻只能被一个操作持有。
 * 如果锁已被持有，调用者将排队等待直到锁释放或超时。
 * 使用 FIFO 队列避免竞态条件。
 */
export async function acquireLock(resourceKey: string, holderName: string): Promise<() => void> {
  // 如果锁已被持有，排队等待
  while (_locks.has(resourceKey)) {
    const existing = _locks.get(resourceKey)!;
    const elapsed = Date.now() - existing.acquiredAt;
    if (elapsed > LOCK_TIMEOUT_MS) {
      logWarn(ErrorCategory.UNKNOWN, `资源锁 "${resourceKey}" 超时 (持有者: ${existing.holder}, ${elapsed}ms)，强制释放`);
      existing.release();
      break;
    }
    // 排队等待：创建一个 promise，在锁释放时由 release 函数唤醒队列中的下一个
    await new Promise<void>((resolve) => {
      let queue = _waitQueues.get(resourceKey);
      if (!queue) {
        queue = [];
        _waitQueues.set(resourceKey, queue);
      }
      queue.push(resolve);
    });
    // 被唤醒后重新检查锁状态（可能有其他等待者先获取了锁）
  }

  // 现在可以安全地获取锁
  let releaseFn!: () => void;
  const lockPromise = new Promise<void>((resolve) => {
    releaseFn = () => {
      _locks.delete(resourceKey);
      resolve();
      // 唤醒等待队列中的下一个
      const queue = _waitQueues.get(resourceKey);
      if (queue && queue.length > 0) {
        const next = queue.shift()!;
        if (queue.length === 0) _waitQueues.delete(resourceKey);
        next();
      }
    };
  });

  _locks.set(resourceKey, {
    key: resourceKey,
    holder: holderName,
    acquiredAt: Date.now(),
    promise: lockPromise,
    release: releaseFn,
  });

  return releaseFn;
}

/**
 * 尝试获取锁，如果锁已被持有则立即返回 null（不等待）
 */
export function tryAcquireLock(resourceKey: string, holderName: string): (() => void) | null {
  if (_locks.has(resourceKey)) return null;

  let releaseFn!: () => void;
  const lockPromise = new Promise<void>((resolve) => {
    releaseFn = () => {
      _locks.delete(resourceKey);
      resolve();
      const queue = _waitQueues.get(resourceKey);
      if (queue && queue.length > 0) {
        const next = queue.shift()!;
        if (queue.length === 0) _waitQueues.delete(resourceKey);
        next();
      }
    };
  });

  _locks.set(resourceKey, {
    key: resourceKey,
    holder: holderName,
    acquiredAt: Date.now(),
    promise: lockPromise,
    release: releaseFn,
  });

  return releaseFn;
}

/** 查询当前所有持有的锁 */
export function getActiveLocks(): Array<{ key: string; holder: string; heldMs: number }> {
  const now = Date.now();
  return Array.from(_locks.values()).map(l => ({
    key: l.key,
    holder: l.holder,
    heldMs: now - l.acquiredAt,
  }));
}

// ---------------------------------------------------------------------------
// 2. 操作历史 — 环形缓冲区 + 撤销支持
// ---------------------------------------------------------------------------

export interface OperationRecord {
  id: string;
  timestamp: number;
  tool: string;
  action: string;
  params: Record<string, unknown>;
  result: unknown;
  rollbackActions?: RollbackAction[];
  rolledBack?: boolean;
}

export interface RollbackAction {
  description: string;
  execute: () => Promise<unknown>;
}

const MAX_HISTORY = 50;
const _history: OperationRecord[] = [];
let _opCounter = 0;

function generateOpId(): string {
  return `op_${Date.now()}_${++_opCounter}`;
}

/** 记录一次操作到历史 */
export function recordOperation(
  tool: string,
  action: string,
  params: Record<string, unknown>,
  result: unknown,
  rollbackActions?: RollbackAction[],
): OperationRecord {
  const record: OperationRecord = {
    id: generateOpId(),
    timestamp: Date.now(),
    tool,
    action,
    params,
    result,
    rollbackActions,
  };
  _history.push(record);
  if (_history.length > MAX_HISTORY) {
    _history.shift();
  }
  return record;
}

/** 获取操作历史（最近 N 条） */
export function getHistory(limit = 20): OperationRecord[] {
  return _history.slice(-limit).reverse();
}

/** 撤销最近一条有回滚动作的操作 */
export async function undoLastOperation(): Promise<{
  success: boolean;
  operationId?: string;
  action?: string;
  rollbackResults?: Array<{ description: string; success: boolean; error?: string }>;
  error?: string;
}> {
  for (let i = _history.length - 1; i >= 0; i--) {
    const record = _history[i];
    if (record.rolledBack) continue;
    if (!record.rollbackActions || record.rollbackActions.length === 0) continue;

    const rollbackResults: Array<{ description: string; success: boolean; error?: string }> = [];
    for (const rb of record.rollbackActions) {
      try {
        await rb.execute();
        rollbackResults.push({ description: rb.description, success: true });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        logError(ErrorCategory.UNKNOWN, `撤销操作 "${rb.description}" 失败`, e);
        rollbackResults.push({ description: rb.description, success: false, error: msg });
      }
    }
    record.rolledBack = true;
    return {
      success: rollbackResults.every(r => r.success),
      operationId: record.id,
      action: `${record.tool}/${record.action}`,
      rollbackResults,
    };
  }
  return { success: false, error: '没有可撤销的操作' };
}

/** 清空操作历史 */
export function clearHistory(): void {
  _history.length = 0;
}

// ---------------------------------------------------------------------------
// 3. 事务支持 — 批量操作的原子性执行
// ---------------------------------------------------------------------------

export interface TransactionStep<T = unknown> {
  name: string;
  /** 资源键，用于并发控制（可选） */
  resourceKey?: string;
  execute: () => Promise<T>;
  rollback?: (result: T) => Promise<void>;
}

export interface TransactionResult {
  success: boolean;
  completedSteps: number;
  totalSteps: number;
  results: Array<{ name: string; success: boolean; result?: unknown; error?: string }>;
  rolledBack?: boolean;
  rollbackResults?: Array<{ name: string; success: boolean; error?: string }>;
}

/**
 * 在事务中执行一系列步骤。如果任何步骤失败，已完成的步骤将按逆序回滚。
 *
 * @param steps 要执行的步骤列表
 * @param options 事务选项
 */
export async function executeTransaction(
  steps: TransactionStep[],
  options: {
    /** 失败时是否自动回滚，默认 true */
    autoRollback?: boolean;
    /** 事务名称，用于日志 */
    name?: string;
    /** 是否在部分失败后继续执行剩余步骤（默认 false，即遇到第一个错误就停止） */
    continueOnError?: boolean;
  } = {},
): Promise<TransactionResult> {
  const { autoRollback = true, name = '未命名事务', continueOnError = false } = options;

  const completed: Array<{ step: TransactionStep; result: unknown }> = [];
  const results: TransactionResult['results'] = [];
  const locks = new Map<string, () => void>();

  try {
    for (const step of steps) {
      // 获取资源锁
      if (step.resourceKey) {
        if (!locks.has(step.resourceKey)) {
          const release = await acquireLock(step.resourceKey, `${name}/${step.name}`);
          locks.set(step.resourceKey, release);
        }
      }

      try {
        const result = await step.execute();
        completed.push({ step, result });
        results.push({ name: step.name, success: true, result });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        logWarn(ErrorCategory.UNKNOWN, `事务 "${name}" 步骤 "${step.name}" 失败: ${msg}`);
        results.push({ name: step.name, success: false, error: msg });

        if (!continueOnError) {
          // 回滚已完成的步骤
          if (autoRollback && completed.length > 0) {
            const rollbackResults = await rollbackSteps(completed, name);
            return {
              success: false,
              completedSteps: completed.length,
              totalSteps: steps.length,
              results,
              rolledBack: true,
              rollbackResults,
            };
          }
          return {
            success: false,
            completedSteps: completed.length,
            totalSteps: steps.length,
            results,
          };
        }
      }
    }
  } finally {
    // 释放所有获取的锁
    for (const release of locks.values()) {
      try { release(); } catch (e) {
        logIgnored(ErrorCategory.UNKNOWN, '释放事务资源锁失败', e);
      }
    }
  }

  const successCount = results.filter(r => r.success).length;
  return {
    success: successCount === steps.length,
    completedSteps: successCount,
    totalSteps: steps.length,
    results,
  };
}

/** 按逆序回滚已完成的步骤 */
async function rollbackSteps(
  completed: Array<{ step: TransactionStep; result: unknown }>,
  txName: string,
): Promise<Array<{ name: string; success: boolean; error?: string }>> {
  const rollbackResults: Array<{ name: string; success: boolean; error?: string }> = [];

  for (let i = completed.length - 1; i >= 0; i--) {
    const { step, result } = completed[i];
    if (!step.rollback) {
      rollbackResults.push({ name: step.name, success: true, error: '无回滚动作（跳过）' });
      continue;
    }
    try {
      await step.rollback(result);
      rollbackResults.push({ name: step.name, success: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logError(ErrorCategory.UNKNOWN, `事务 "${txName}" 回滚步骤 "${step.name}" 失败: ${msg}`);
      rollbackResults.push({ name: step.name, success: false, error: msg });
    }
  }

  return rollbackResults;
}

// ---------------------------------------------------------------------------
// 4. 便捷函数 — 带锁的操作执行
// ---------------------------------------------------------------------------

/**
 * 在资源锁保护下执行操作。确保同一资源键的操作串行执行。
 */
export async function withLock<T>(
  resourceKey: string,
  holderName: string,
  fn: () => Promise<T>,
): Promise<T> {
  const release = await acquireLock(resourceKey, holderName);
  try {
    return await fn();
  } finally {
    release();
  }
}

/**
 * 检查资源是否正在被操作
 */
export function isResourceLocked(resourceKey: string): boolean {
  return _locks.has(resourceKey);
}
