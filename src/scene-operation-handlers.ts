import type { OperationHandler } from './scene-types';
import {
  type SceneOperationDeps,
  buildOperationHandlers as buildAllOperationHandlers,
} from './scene-operation-handlers-impl';
import { TRANSFORM_ACTIONS } from './scene-operation-handlers/transform-actions';
import { COMPONENT_ACTIONS } from './scene-operation-handlers/component-actions';
import { PREFAB_UI_ACTIONS } from './scene-operation-handlers/prefab-ui-actions';
import { RENDER_LIGHT_CAMERA_ACTIONS } from './scene-operation-handlers/render-light-camera-actions';
import { STATE_EVENT_ACTIONS } from './scene-operation-handlers/state-event-actions';

export type { SceneOperationDeps };

function appendActionGroup(
  target: Map<string, OperationHandler>,
  source: Map<string, OperationHandler>,
  actions: readonly string[],
  groupName: string,
): void {
  for (const action of actions) {
    const handler = source.get(action);
    if (!handler) {
      throw new Error(`[scene-operation-handlers] Missing action "${action}" in group "${groupName}"`);
    }
    target.set(action, handler);
  }
}

export function buildOperationHandlers(deps: SceneOperationDeps): Map<string, OperationHandler> {
  const allHandlers = buildAllOperationHandlers(deps);
  const handlers = new Map<string, OperationHandler>();

  appendActionGroup(handlers, allHandlers, TRANSFORM_ACTIONS, 'transform');
  appendActionGroup(handlers, allHandlers, COMPONENT_ACTIONS, 'component');
  appendActionGroup(handlers, allHandlers, PREFAB_UI_ACTIONS, 'prefab-ui');
  appendActionGroup(handlers, allHandlers, RENDER_LIGHT_CAMERA_ACTIONS, 'render-light-camera');
  appendActionGroup(handlers, allHandlers, STATE_EVENT_ACTIONS, 'state-event');

  // Preserve forward-compatibility for newly added actions not yet grouped.
  for (const [action, handler] of allHandlers.entries()) {
    if (!handlers.has(action)) handlers.set(action, handler);
  }

  return handlers;
}
