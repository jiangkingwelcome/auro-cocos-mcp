import type { CocosNode, CocosCC, OperationHandler } from '../scene-types';
import { isNodeRef, isComponentRef, resolveRefToRuntime } from '../scene-types';
import { ErrorCategory, logIgnored } from '../error-utils';
import { bilingualMessage } from '../mcp/tools-shared';
import type { SceneOperationDeps } from '../scene-operation-handlers-impl';

export const RENDER_LIGHT_CAMERA_ACTIONS = [
  'create_mesh_renderer',
  'create_primitive_mesh',
  'ensure_2d_canvas',
  'create_camera',
  'set_camera_props',
  'create_light',
  'set_light_props',
  'set_render_pipeline',
  'set_material_property',
  'set_shadow_settings',
  'set_fog_settings',
  'set_skybox_settings',
  'set_ambient_light',
  'batch_set_materials',
  'apply_render_preset',
] as const;

export function buildRenderLightCameraActions(deps: SceneOperationDeps, allHandlers?: Map<string, OperationHandler>): Map<string, OperationHandler> {
  const { getCC, requireNode } = deps;
  const handlers = allHandlers || new Map();
  return new Map<string, OperationHandler>([
  ]);
}
