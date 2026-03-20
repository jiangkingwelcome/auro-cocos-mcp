import type { CocosNode, CocosCC, OperationHandler } from '../scene-types';
import { isNodeRef, isComponentRef, resolveRefToRuntime } from '../scene-types';
import { ErrorCategory, logIgnored } from '../error-utils';
import { bilingualMessage } from '../mcp/tools-shared';
import type { SceneOperationDeps } from '../scene-operation-handlers-impl';

export const TRANSFORM_ACTIONS = [
  'create_node',
  'destroy_node',
  'reparent',
  'duplicate_node',
  'set_position',
  'set_rotation',
  'set_scale',
  'set_world_position',
  'set_world_rotation',
  'set_world_scale',
  'set_name',
  'set_active',
  'move_node_up',
  'move_node_down',
  'set_sibling_index',
  'clear_children',
  'reset_transform',
  'group_nodes',
  'batch',
] as const;

export function buildTransformActions(deps: SceneOperationDeps, allHandlers?: Map<string, OperationHandler>): Map<string, OperationHandler> {
  const { getCC, requireNode } = deps;
  const handlers = allHandlers || new Map();
  return new Map<string, OperationHandler>([
  ]);
}
