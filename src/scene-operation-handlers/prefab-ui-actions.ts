import type { CocosNode, CocosCC, OperationHandler } from '../scene-types';
import { isNodeRef, isComponentRef, resolveRefToRuntime } from '../scene-types';
import { ErrorCategory, logIgnored } from '../error-utils';
import { bilingualMessage } from '../mcp/tools-shared';
import type { SceneOperationDeps } from '../scene-operation-handlers-impl';

export const PREFAB_UI_ACTIONS = [
  'instantiate_prefab',
  'apply_prefab_overrides',
  'revert_prefab_overrides',
  'create_ui_canvas',
  'create_ui_sprite',
  'create_ui_label',
  'create_ui_button',
  'set_ui_widget',
  'set_ui_layout',
  'align_nodes',
] as const;

export function buildPrefabUiActions(deps: SceneOperationDeps, allHandlers?: Map<string, OperationHandler>): Map<string, OperationHandler> {
  const { getCC, requireNode } = deps;
  const handlers = allHandlers || new Map();
  return new Map<string, OperationHandler>([
  ]);
}
