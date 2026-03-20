import type { CocosNode, CocosCC, OperationHandler } from './scene-types';

export interface SceneOperationDeps {
  getCC: () => CocosCC;
  findNodeByUuid: (root: CocosNode | null, uuid: string) => CocosNode | null;
  findNodeByName: (root: CocosNode | null, name: string) => CocosNode | null;
  resolveParent: (scene: CocosNode, ref: string) => { node: CocosNode } | { error: string };
  requireNode: (scene: CocosNode, uuid: string) => { node: CocosNode } | { error: string };
  notifyEditorProperty: (uuid: string, path: string, dump: { type: string; value: unknown }) => Promise<boolean>;
  notifyEditorRemoveNode: (uuid: string) => Promise<boolean>;
  notifyEditorComponentProperty: (nodeUuid: string, node: CocosNode, comp: unknown, property: string, dump: { type: string; value: unknown }) => Promise<boolean>;
  ipcDuplicateNode: (uuid: string) => Promise<string>;
}

import { buildTransformActions } from './scene-operation-handlers/transform-actions';
import { buildComponentActions } from './scene-operation-handlers/component-actions';
import { buildPrefabUiActions } from './scene-operation-handlers/prefab-ui-actions';
import { buildRenderLightCameraActions } from './scene-operation-handlers/render-light-camera-actions';
import { buildStateEventActions } from './scene-operation-handlers/state-event-actions';

export function buildOperationHandlers(deps: SceneOperationDeps): Map<string, OperationHandler> {
  const allHandlers = new Map<string, OperationHandler>();
  const transformActions = buildTransformActions(deps, allHandlers);
  for (const [k, v] of transformActions) allHandlers.set(k, v);
  const componentActions = buildComponentActions(deps, allHandlers);
  for (const [k, v] of componentActions) allHandlers.set(k, v);
  const prefabUiActions = buildPrefabUiActions(deps, allHandlers);
  for (const [k, v] of prefabUiActions) allHandlers.set(k, v);
  const renderLightCameraActions = buildRenderLightCameraActions(deps, allHandlers);
  for (const [k, v] of renderLightCameraActions) allHandlers.set(k, v);
  const stateEventActions = buildStateEventActions(deps, allHandlers);
  for (const [k, v] of stateEventActions) allHandlers.set(k, v);
  return allHandlers;
}
