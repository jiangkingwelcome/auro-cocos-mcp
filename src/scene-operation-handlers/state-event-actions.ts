import type { CocosNode, CocosCC, OperationHandler } from '../scene-types';
import { isNodeRef, isComponentRef, resolveRefToRuntime } from '../scene-types';
import { ErrorCategory, logIgnored } from '../error-utils';
import { bilingualMessage } from '../mcp/tools-shared';
import type { SceneOperationDeps } from '../scene-operation-handlers-impl';

export const STATE_EVENT_ACTIONS = [
  'add_click_event',
  'remove_click_event',
  'add_custom_event',
  'remove_custom_event',
  'set_animation_state',
  'play_animation',
  'pause_animation',
  'stop_animation',
  'reset_node_state',
] as const;

export function buildStateEventActions(deps: SceneOperationDeps, allHandlers?: Map<string, OperationHandler>): Map<string, OperationHandler> {
  const { getCC, requireNode } = deps;
  const handlers = allHandlers || new Map();
  return new Map<string, OperationHandler>([
  ]);
}
