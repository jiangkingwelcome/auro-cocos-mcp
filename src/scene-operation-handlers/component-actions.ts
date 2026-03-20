import type { CocosNode, CocosCC, OperationHandler } from '../scene-types';
import { isNodeRef, isComponentRef, resolveRefToRuntime } from '../scene-types';
import { ErrorCategory, logIgnored } from '../error-utils';
import { bilingualMessage } from '../mcp/tools-shared';
import type { SceneOperationDeps } from '../scene-operation-handlers-impl';

export const COMPONENT_ACTIONS = [
  'add_component',
  'remove_component',
  'set_component_property',
  'invoke_component_method',
  'get_component_property',
  'link_node_reference',
  'link_component_reference',
  'unlink_reference',
  'link_asset_reference',
] as const;

export function buildComponentActions(deps: SceneOperationDeps, allHandlers?: Map<string, OperationHandler>): Map<string, OperationHandler> {
  const { getCC, requireNode } = deps;
  const handlers = allHandlers || new Map();
  return new Map<string, OperationHandler>([
  ]);
}
