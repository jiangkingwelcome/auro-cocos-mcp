import type { BridgeToolContext, ToolCallResult } from './tools-shared';
import { errorMessage } from './tools-shared';

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

  const results: unknown[] = [];
  try {
    for (const call of plan.calls) {
      const result = await executeCall(ctx, call);
      results.push(result);
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
  }
}
