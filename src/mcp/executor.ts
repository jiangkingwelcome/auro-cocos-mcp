import type { BridgeToolContext, ToolCallResult } from './tools-shared';
import { beginSceneRecording, endSceneRecording, errorMessage } from './tools-shared';

/**
 * IPC call instruction — produced by Rust, executed by JS.
 * This is the contract between the native core and the JS executor.
 */
export type CallInstruction =
  | { type: 'sceneMethod'; method: string; args: unknown[] }
  | { type: 'bridgeGet'; path: string; params?: Record<string, string> }
  | { type: 'bridgePost'; path: string; body?: unknown }
  | { type: 'editorMsg'; module: string; message: string; args: unknown[] };

/**
 * Execution plan — returned by Rust's process_tool_call().
 * Contains the IPC calls to make and optional rollback instructions.
 */
export interface ExecutionPlan {
  calls: CallInstruction[];
  rollback?: CallInstruction[];
  error?: string;
  suggestion?: string;
}

/**
 * Determine if an ExecutionPlan potentially modifies scene state.
 * A plan is read-only only if ALL its calls are reads (bridgeGet,
 * dispatchQuery, asset-db queries, etc.).
 * When uncertain, we treat the plan as a write — better to add an extra
 * begin/end-recording entry than to miss a dirty mark.
 */
function planMayModifyScene(calls: CallInstruction[]): boolean {
  for (const call of calls) {
    if (call.type === 'bridgeGet') continue; // always read
    if (call.type === 'sceneMethod' && call.method === 'dispatchQuery') continue; // read
    if (call.type === 'editorMsg') {
      // asset-db queries are read-only
      if (call.module === 'asset-db' && String(call.message).startsWith('query-')) continue;
      // scene query-node is read-only
      if (call.module === 'scene' && String(call.message).startsWith('query-')) continue;
    }
    // Anything else (sceneMethod writes, editorMsg scene mutations, bridgePost) → write
    return true;
  }
  return false; // all calls were read-only
}

const UUID_RE = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

/** Recursively collect node UUIDs from a value (object, array, or string). */
function collectUuidsFromValue(val: unknown, seen: Set<string>, out: string[]): void {
  if (!val) return;
  if (typeof val === 'string') {
    if (UUID_RE.test(val) && !seen.has(val)) { seen.add(val); out.push(val); }
    return;
  }
  if (Array.isArray(val)) {
    for (const item of val) collectUuidsFromValue(item, seen, out);
    return;
  }
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    // Common UUID fields
    for (const key of ['uuid', '_id', 'parent', 'parentUuid', 'clonedUuid', 'instanceUuid']) {
      if (typeof obj[key] === 'string') collectUuidsFromValue(obj[key], seen, out);
    }
  }
}

/**
 * Collect node UUIDs from call arguments AND results.
 * Results are scanned because newly created node UUIDs appear only in the
 * response, not in the original call args.
 */
function collectUuids(calls: CallInstruction[], results: unknown[]): string[] {
  const seen = new Set<string>();
  const uuids: string[] = [];

  for (const call of calls) {
    if (call.type === 'sceneMethod' || call.type === 'editorMsg') {
      for (const arg of call.args) collectUuidsFromValue(arg, seen, uuids);
    }
  }
  for (const r of results) collectUuidsFromValue(r, seen, uuids);

  return uuids;
}

/**
 * Force-dirty nodes from the extension main process.
 * Cocos Creator 3.8.x: set-property with the SAME value is a no-op (Cocos skips unchanged values),
 * so it does NOT trigger dirty. Toggling `active` (false → true) guarantees a real recorded change
 * in the undo stack, which is what actually marks the scene dirty and prompts the user to save.
 */
async function forceDirty(ctx: BridgeToolContext, uuids: string[]): Promise<void> {
  for (const uuid of uuids.slice(0, 3)) {
    try {
      await ctx.editorMsg('scene', 'set-property', {
        uuid, path: 'active',
        dump: { type: 'Boolean', value: false },
      });
      await ctx.editorMsg('scene', 'set-property', {
        uuid, path: 'active',
        dump: { type: 'Boolean', value: true },
      });
    } catch { /* best-effort */ }
  }
}

/**
 * Execute a single IPC call instruction against the Cocos Editor.
 */
async function executeCall(ctx: BridgeToolContext, call: CallInstruction): Promise<unknown> {
  switch (call.type) {
    case 'sceneMethod':
      return ctx.sceneMethod(call.method, call.args);
    case 'bridgeGet':
      return ctx.bridgeGet(call.path, call.params);
    case 'bridgePost':
      return ctx.bridgePost(call.path, call.body);
    case 'editorMsg':
      return ctx.editorMsg(call.module, call.message, ...call.args);
  }
}

/**
 * Execute an execution plan produced by the Rust native core.
 *
 * Runs all calls sequentially. On failure, executes rollback instructions
 * if provided. Returns a ToolCallResult for the MCP response.
 *
 * Dirty-marking: If the plan contains sceneMethod write calls (which run
 * inside execute-scene-script and don't mark dirty by themselves), this
 * function wraps them with begin-recording / force-dirty / end-recording
 * from the extension main process to ensure the scene is marked dirty.
 */
export async function executePlan(
  ctx: BridgeToolContext,
  plan: ExecutionPlan,
): Promise<ToolCallResult> {
  if (plan.error) {
    const errObj: Record<string, unknown> = { error: plan.error };
    if (plan.suggestion) errObj.suggestion = plan.suggestion;
    return ctx.text(errObj, true);
  }

  if (!plan.calls || plan.calls.length === 0) {
    return ctx.text({ error: 'Empty execution plan' }, true);
  }

  const needsDirty = planMayModifyScene(plan.calls);

  // [DIRTY-DEBUG] 临时诊断日志，确认 executor 执行路径
  console.log('[DIRTY-DEBUG] executePlan calls:', JSON.stringify(plan.calls.map(c => ({
    type: c.type,
    ...(c.type === 'sceneMethod' ? { method: c.method } : {}),
    ...(c.type === 'editorMsg' ? { module: c.module, message: c.message } : {}),
  }))));
  console.log('[DIRTY-DEBUG] needsDirty:', needsDirty);

  const preKnownUuids = collectUuids(plan.calls, []);
  const recordId = needsDirty ? await beginSceneRecording(ctx.editorMsg, preKnownUuids) : null;

  const results: unknown[] = [];
  try {
    for (const call of plan.calls) {
      const result = await executeCall(ctx, call);
      results.push(result);
    }
    if (needsDirty) {
      // Collect UUIDs from BOTH call args AND results — newly created node
      // UUIDs are returned in results, not present in the original call args.
      const uuids = collectUuids(plan.calls, results);
      console.log('[DIRTY-DEBUG] forceDirty uuids:', uuids);
      console.log('[DIRTY-DEBUG] results:', JSON.stringify(results).slice(0, 300));
      await forceDirty(ctx, uuids);
    }
    return ctx.text(results.length === 1 ? results[0] : results);
  } catch (err: unknown) {
    if (plan.rollback && plan.rollback.length > 0) {
      const rollbackResults: string[] = [];
      for (const rb of plan.rollback) {
        try {
          await executeCall(ctx, rb);
          rollbackResults.push(`rollback:${rb.type}:ok`);
        } catch (rbErr: unknown) {
          rollbackResults.push(`rollback:${rb.type}:failed:${errorMessage(rbErr)}`);
        }
      }
      return ctx.text({
        error: errorMessage(err),
        rollback: rollbackResults,
      }, true);
    }
    return ctx.text({ error: errorMessage(err) }, true);
  } finally {
    if (needsDirty) await endSceneRecording(ctx.editorMsg, recordId);
  }
}
