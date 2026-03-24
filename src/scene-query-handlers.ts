import type { CocosNode, CocosComponent, CocosCC, QueryHandler, NodeSearchResult } from './scene-types';
import { toStr, getComponentName } from './scene-types';
import { ErrorCategory, logIgnored } from './error-utils';

export interface SceneQueryDeps {
  getCC: () => CocosCC;
  getNodePath: (node: CocosNode | null) => string;
  findNodeByUuid: (root: CocosNode | null, uuid: string) => CocosNode | null;
  requireNode: (scene: CocosNode, uuid: string) => { node: CocosNode } | { error: string };
}

function clipStrField(clip: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = clip[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return '';
}

function clipNumField(clip: Record<string, unknown>, fallback: number, ...keys: string[]): number {
  for (const key of keys) {
    const value = clip[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return fallback;
}

export function buildQueryHandlers(deps: SceneQueryDeps): Map<string, QueryHandler> {
  const { getCC, getNodePath, findNodeByUuid, requireNode } = deps;

  return new Map<string, QueryHandler>([
    ['tree', (self, _s, p) => self.getSceneTree(!!p.includeInternal)],
    ['list', (self, _s, p) => self.getAllNodesList(!!p.includeInternal)],
    ['stats', (self, _s, p) => self.getSceneStats(!!p.includeInternal)],
    ['node_detail', (self, _s, p) => self.getNodeDetail(toStr(p.uuid))],
    ['find_by_path', (self, _s, p) => self.findNodeByPath(toStr(p.path))],
    ['get_components', (self, _s, p) => self.getNodeComponents(toStr(p.uuid))],
    ['get_parent', (_self, scene, p) => {
      const uuid = toStr(p.uuid);
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      if (!r.node.parent) return { error: `未找到节点或无父节点: ${uuid}` };
      return { uuid: r.node.parent.uuid || r.node.parent._id, name: r.node.parent.name };
    }],
    ['get_children', (_self, scene, p) => {
      const r = requireNode(scene, toStr(p.uuid));
      if ('error' in r) return r;
      return (r.node.children || []).map((c: CocosNode) => ({ uuid: c.uuid || c._id, name: c.name, active: c.active }));
    }],
    ['get_sibling', (_self, scene, p) => {
      const uuid = toStr(p.uuid);
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      if (!r.node.parent) return { error: `未找到节点或无父节点: ${uuid}` };
      return (r.node.parent.children || [])
        .filter((s: CocosNode) => (s.uuid || s._id) !== (r.node.uuid || r.node._id))
        .map((s: CocosNode) => ({ uuid: s.uuid || s._id, name: s.name, active: s.active }));
    }],
    ['get_world_position', (_self, scene, p) => {
      const r = requireNode(scene, toStr(p.uuid));
      if ('error' in r) return r;
      const wp = r.node.worldPosition;
      return wp ? { x: wp.x, y: wp.y, z: wp.z } : null;
    }],
    ['get_world_rotation', (_self, scene, p) => {
      const r = requireNode(scene, toStr(p.uuid));
      if ('error' in r) return r;
      if (r.node.worldRotation) {
        const q = r.node.worldRotation;
        const { Quat, Vec3: V3 } = getCC();
        const euler = new V3(0, 0, 0) as { x: number; y: number; z: number };
        Quat.toEuler(euler, q);
        return { x: euler.x, y: euler.y, z: euler.z, quat: { x: q.x, y: q.y, z: q.z, w: q.w } };
      }
      return null;
    }],
    ['get_world_scale', (_self, scene, p) => {
      const r = requireNode(scene, toStr(p.uuid));
      if ('error' in r) return r;
      const ws = r.node.worldScale;
      return ws ? { x: ws.x, y: ws.y, z: ws.z } : null;
    }],
    ['get_active_in_hierarchy', (_self, scene, p) => {
      const uuid = toStr(p.uuid);
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      return { uuid, name: r.node.name, activeInHierarchy: r.node.activeInHierarchy ?? r.node.active };
    }],
    ['find_nodes_by_name', (_self, scene, p) => {
      const targetName = toStr(p.name);
      if (!targetName) return { error: '缺少 name 参数' };
      const results: NodeSearchResult[] = [];
      const walk = (n: CocosNode) => {
        if (n.name === targetName || n.name.includes(targetName)) {
          results.push({ uuid: n.uuid ?? n._id ?? '', name: n.name, path: getNodePath(n), active: n.active });
        }
        for (const child of n.children || []) walk(child);
      };
      walk(scene);
      return { count: results.length, nodes: results };
    }],
    ['find_nodes_by_component', (_self, scene, p) => {
      const compName = toStr(p.component);
      if (!compName) return { error: '缺少 component 参数' };
      const results: NodeSearchResult[] = [];
      const walk = (n: CocosNode) => {
        for (const comp of (n._components || [])) {
          const cn = getComponentName(comp);
          if (cn === compName || cn === 'cc.' + compName || cn.includes(compName)) {
            results.push({ uuid: n.uuid ?? n._id ?? '', name: n.name, path: getNodePath(n), active: n.active, component: cn });
            break;
          }
        }
        for (const child of n.children || []) walk(child);
      };
      walk(scene);
      return { count: results.length, nodes: results };
    }],
    ['get_component_property', (_self, scene, p) => {
      const { js } = getCC();
      const uuid = toStr(p.uuid);
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      const compName = toStr(p.component);
      const propName = toStr(p.property);
      if (!compName || !propName) return { error: '缺少 component 或 property 参数' };
      const compClass = js.getClassByName(compName) || js.getClassByName('cc.' + compName);
      const comp = compClass ? r.node.getComponent(compClass) : null;
      if (!comp) return { error: `节点上没有组件: ${compName}` };
      let val = comp[propName];
      if (val && typeof val === 'object' && typeof (val as Record<string, unknown>).clone === 'function') {
        val = JSON.parse(JSON.stringify(val));
      }
      return { uuid, component: compName, property: propName, value: val };
    }],
    ['get_node_components_properties', (_self, scene, p) => {
      const uuid = toStr(p.uuid);
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      const comps = (r.node._components || []).map((comp: CocosComponent) => {
        const cn = getComponentName(comp);
        const props: Record<string, unknown> = {};
        try {
          for (const key of Object.keys(comp)) {
            if (key.startsWith('_') && key !== '_name') continue;
            const val = comp[key];
            if (typeof val === 'function') continue;
            if (val && typeof val === 'object' && (val as Record<string, unknown>).constructor?.name === 'Node') {
              const nodeVal = val as Record<string, unknown>;
              props[key] = { __type__: 'Node', uuid: nodeVal.uuid || nodeVal._id, name: nodeVal.name };
            } else if (val && typeof val === 'object' && typeof (val as Record<string, unknown>).clone === 'function') {
              try { props[key] = JSON.parse(JSON.stringify(val)); } catch (e) { logIgnored(ErrorCategory.SERIALIZATION, `属性 "${key}" 序列化失败，回退为字符串`, e); props[key] = String(val); }
            } else {
              try { props[key] = JSON.parse(JSON.stringify(val)); } catch (e) { logIgnored(ErrorCategory.SERIALIZATION, `属性 "${key}" 序列化失败，回退为字符串`, e); props[key] = String(val); }
            }
          }
        } catch (e) { logIgnored(ErrorCategory.SERIALIZATION, '组件属性序列化失败', e); }
        return { name: cn, properties: props };
      });
      return { uuid, nodeName: r.node.name, components: comps };
    }],
    ['get_camera_info', (_self, scene, p) => {
      const { Camera } = getCC();
      const filterUuid = p.uuid ? toStr(p.uuid) : '';
      const results: Record<string, unknown>[] = [];
      const walk = (n: CocosNode) => {
        const cam = (n as Record<string, unknown> & CocosNode).getComponent?.(Camera);
        if (cam) {
          const nodeUuid = n.uuid || n._id;
          if (filterUuid && nodeUuid !== filterUuid) { for (const child of n.children || []) walk(child); return; }
          const c = cam as Record<string, unknown>;
          const clearColorObj = c.clearColor as { r?: number; g?: number; b?: number; a?: number } | null;
          const rectObj = c.rect as { x?: number; y?: number; width?: number; height?: number } | null;
          const info: Record<string, unknown> = {
            uuid: nodeUuid, name: n.name, path: getNodePath(n),
            fov: c.fov, near: c.near, far: c.far, orthoHeight: c.orthoHeight,
            projection: c.projection, clearFlags: c.clearFlags, priority: c.priority,
            clearColor: clearColorObj ? { r: clearColorObj.r, g: clearColorObj.g, b: clearColorObj.b, a: clearColorObj.a } : null,
            rect: rectObj ? { x: rectObj.x, y: rectObj.y, width: rectObj.width, height: rectObj.height } : null,
            visibility: c.visibility,
            clearDepth: c.clearDepth,
            clearStencil: c.clearStencil,
            aperture: c.aperture,
            shutter: c.shutter,
            iso: c.iso,
            targetTexture: c.targetTexture ? 'set' : null,
          };
          results.push(info);
        }
        for (const child of n.children || []) walk(child);
      };
      walk(scene);
      return { count: results.length, cameras: results };
    }],
    ['get_canvas_info', (_self, scene) => {
      const { Canvas } = getCC();
      const results: Record<string, unknown>[] = [];
      const walk = (n: CocosNode) => {
        const canvas = (n as Record<string, unknown> & CocosNode).getComponent?.(Canvas);
        if (canvas) {
          const cv = canvas as Record<string, unknown>;
          const dr = cv.designResolution as { width: number; height: number } | null;
          results.push({
            uuid: n.uuid || n._id, name: n.name, path: getNodePath(n),
            designResolution: dr ? { width: dr.width, height: dr.height } : null,
            fitWidth: cv.fitWidth, fitHeight: cv.fitHeight,
          });
        }
        for (const child of n.children || []) walk(child);
      };
      walk(scene);
      return { count: results.length, canvases: results };
    }],
    ['get_material_info', (_self, scene, p) => {
      const uuid = toStr(p.uuid);
      if (!uuid) return { error: '缺少 uuid 参数，请指定节点 uuid' };
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      const comps = r.node._components || [];
      const materialResults: Record<string, unknown>[] = [];
      for (const comp of comps) {
        const compName = comp.constructor?.name ?? comp.__classname__ ?? 'Unknown';
        const renderer = comp as Record<string, unknown>;
        // Check if component has sharedMaterials (MeshRenderer, Sprite, etc.)
        const sharedMats = renderer.sharedMaterials as Array<Record<string, unknown>> | null;
        const matSingle = renderer.customMaterial as Record<string, unknown> | null;
        const mats: Array<Record<string, unknown> | null> = [];
        if (Array.isArray(sharedMats)) {
          for (const m of sharedMats) mats.push(m ?? null);
        } else if (matSingle) {
          mats.push(matSingle);
        } else {
          continue;
        }
        const slots: Record<string, unknown>[] = [];
        for (let i = 0; i < mats.length; i++) {
          const mat = mats[i];
          if (!mat) { slots.push({ index: i, material: null }); continue; }
          const effectAsset = mat.effectAsset as Record<string, unknown> | null;
          const effectName = mat.effectName ?? (effectAsset ? effectAsset.name : null);
          const technique = mat.technique;
          const hash = mat.hash;
          // Extract passes info
          const passes = mat.passes as Array<Record<string, unknown>> | null;
          const passInfos: Record<string, unknown>[] = [];
          if (Array.isArray(passes)) {
            for (let pi = 0; pi < passes.length; pi++) {
              const pass = passes[pi];
              const props: Record<string, unknown> = {};
              // Try to read pass properties/defines
              const handle = pass.properties as Record<string, unknown> | null;
              if (handle && typeof handle === 'object') {
                for (const [k, v] of Object.entries(handle)) props[k] = v;
              }
              passInfos.push({
                index: pi,
                primitive: pass.primitive,
                stage: pass.stage,
                blendState: pass.blendState ? 'set' : null,
                depthStencilState: pass.depthStencilState ? 'set' : null,
                rasterizerState: pass.rasterizerState ? 'set' : null,
                properties: Object.keys(props).length > 0 ? props : null,
              });
            }
          }
          // Try to get uniform property values from the material
          const getProperty = typeof mat.getProperty === 'function' ? mat.getProperty : null;
          const uniformValues: Record<string, unknown> = {};
          const knownUniforms = ['mainColor', 'mainTexture', 'albedo', 'albedoMap', 'normalMap',
            'emissive', 'emissiveMap', 'roughness', 'metallic', 'occlusion', 'alphaThreshold'];
          for (const uName of knownUniforms) {
            try {
              if (getProperty) {
                const val = (mat.getProperty as (n: string, pi?: number) => unknown)(uName, 0);
                if (val !== undefined && val !== null) {
                  const v = val as Record<string, unknown>;
                  if (typeof v === 'object' && v !== null && ('r' in v || 'x' in v)) {
                    uniformValues[uName] = { r: v.r, g: v.g, b: v.b, a: v.a, x: v.x, y: v.y, z: v.z, w: v.w };
                  } else {
                    uniformValues[uName] = val;
                  }
                }
              }
            } catch (e) { logIgnored(ErrorCategory.REFLECTION, '部分 uniform 参数读取失败（可能不存在于当前 effect）', e); }
          }
          slots.push({
            index: i,
            effectName: effectName ?? null,
            technique: technique ?? 0,
            hash,
            passCount: passInfos.length,
            passes: passInfos.length > 0 ? passInfos : null,
            uniforms: Object.keys(uniformValues).length > 0 ? uniformValues : null,
          });
        }
        materialResults.push({
          component: compName,
          slotCount: slots.length,
          slots,
        });
      }
      if (materialResults.length === 0) {
        return { uuid, name: r.node.name, message: '该节点上没有带材质的渲染器组件' };
      }
      return { uuid, name: r.node.name, renderers: materialResults };
    }],
    // ─── get_light_info: query all lights in scene ──────────────────────
    ['get_light_info', (_self, scene, p) => {
      const { js } = getCC();
      const filterUuid = p.uuid ? toStr(p.uuid) : '';
      const LIGHT_TYPES: Array<{ className: string; type: string; props: string[] }> = [
        { className: 'DirectionalLight', type: 'DirectionalLight', props: ['illuminance', 'color', 'useColorTemperature', 'colorTemperature', 'shadowEnabled', 'shadowPcf', 'shadowBias', 'shadowNormalBias', 'shadowSaturation', 'shadowDistance', 'shadowInvisibleOcclusionRange', 'shadowFixedArea'] },
        { className: 'SpotLight', type: 'SpotLight', props: ['luminance', 'luminanceHDR', 'color', 'useColorTemperature', 'colorTemperature', 'range', 'spotAngle', 'size', 'shadowEnabled', 'shadowPcf', 'shadowBias', 'shadowNormalBias'] },
        { className: 'SphereLight', type: 'SphereLight', props: ['luminance', 'luminanceHDR', 'color', 'useColorTemperature', 'colorTemperature', 'range', 'size', 'shadowEnabled', 'shadowPcf', 'shadowBias', 'shadowNormalBias'] },
      ];
      const results: Record<string, unknown>[] = [];
      const walk = (n: CocosNode) => {
        const nodeUuid = n.uuid || n._id;
        if (filterUuid && nodeUuid !== filterUuid) { for (const child of n.children || []) walk(child); return; }
        for (const lt of LIGHT_TYPES) {
          const cls = js.getClassByName(lt.className) || js.getClassByName('cc.' + lt.className);
          if (!cls) continue;
          const comp = (n as Record<string, unknown> & CocosNode).getComponent?.(cls);
          if (!comp) continue;
          const c = comp as Record<string, unknown>;
          const info: Record<string, unknown> = {
            uuid: nodeUuid, name: n.name, path: getNodePath(n), lightType: lt.type,
          };
          for (const prop of lt.props) {
            const val = c[prop];
            if (val !== undefined) {
              if (val && typeof val === 'object' && ('r' in (val as Record<string, unknown>))) {
                const cv = val as { r?: number; g?: number; b?: number; a?: number };
                info[prop] = { r: cv.r, g: cv.g, b: cv.b, a: cv.a };
              } else {
                info[prop] = val;
              }
            }
          }
          // Add world position/rotation for spatial context
          const wp = n.worldPosition;
          if (wp) info.position = { x: wp.x, y: wp.y, z: wp.z };
          const wr = n.worldRotation;
          if (wr) {
            // Convert quaternion to euler for readability
            try {
              const { Quat, Vec3 } = getCC();
              const euler = new Vec3(0, 0, 0) as { x: number; y: number; z: number };
              Quat.toEuler(euler, wr);
              info.rotation = { x: Math.round((euler.x as number) * 100) / 100, y: Math.round((euler.y as number) * 100) / 100, z: Math.round((euler.z as number) * 100) / 100 };
            } catch (e) { logIgnored(ErrorCategory.ENGINE_API, '四元数转欧拉角失败', e); }
          }
          results.push(info);
        }
        for (const child of n.children || []) walk(child);
      };
      walk(scene);
      return { count: results.length, lights: results };
    }],
    // ─── get_scene_environment: structured ambient/shadows/fog/skybox ────
    ['get_scene_environment', (_self, scene) => {
      const result: Record<string, unknown> = { sceneName: scene.name };
      const globals = scene.globals as Record<string, unknown> | null;
      if (!globals) return { ...result, error: '场景没有 globals 属性（可能非活动场景）' };
      // Ambient
      const ambient = globals.ambient as Record<string, unknown> | null;
      if (ambient) {
        const skyColor = ambient.skyColor as { r?: number; g?: number; b?: number; a?: number } | null;
        const groundAlbedo = ambient.groundAlbedo as { r?: number; g?: number; b?: number; a?: number } | null;
        result.ambient = {
          skyColor: skyColor ? { r: skyColor.r, g: skyColor.g, b: skyColor.b, a: skyColor.a } : null,
          skyIllum: ambient.skyIllum ?? ambient.skyLightIntensity,
          groundAlbedo: groundAlbedo ? { r: groundAlbedo.r, g: groundAlbedo.g, b: groundAlbedo.b, a: groundAlbedo.a } : null,
          mipmapLevel: ambient.mipmapLevel,
        };
      }
      // Shadows
      const shadows = globals.shadows as Record<string, unknown> | null;
      if (shadows) {
        const shadowColor = shadows.shadowColor as { r?: number; g?: number; b?: number; a?: number } | null;
        const normal = shadows.normal as { x?: number; y?: number; z?: number } | null;
        result.shadows = {
          enabled: shadows.enabled,
          type: shadows.type,
          shadowColor: shadowColor ? { r: shadowColor.r, g: shadowColor.g, b: shadowColor.b, a: shadowColor.a } : null,
          normal: normal ? { x: normal.x, y: normal.y, z: normal.z } : null,
          distance: shadows.distance,
          planeBias: shadows.planeBias,
          maxReceived: shadows.maxReceived,
          size: shadows.size ?? shadows.shadowMapSize,
          autoAdapt: shadows.autoAdapt,
        };
      }
      // Fog
      const fog = globals.fog as Record<string, unknown> | null;
      if (fog) {
        const fogColor = fog.fogColor as { r?: number; g?: number; b?: number; a?: number } | null;
        result.fog = {
          enabled: fog.enabled,
          accurate: fog.accurate,
          type: fog.type,
          fogColor: fogColor ? { r: fogColor.r, g: fogColor.g, b: fogColor.b, a: fogColor.a } : null,
          fogDensity: fog.fogDensity,
          fogStart: fog.fogStart,
          fogEnd: fog.fogEnd,
          fogAtten: fog.fogAtten,
          fogTop: fog.fogTop,
          fogRange: fog.fogRange,
        };
      }
      // Skybox
      const skybox = globals.skybox as Record<string, unknown> | null;
      if (skybox) {
        result.skybox = {
          enabled: skybox.enabled,
          useIBL: skybox.useIBL,
          useHDR: skybox.useHDR,
          isRGBE: skybox.isRGBE,
          envmap: skybox.envmap ? 'set' : null,
          diffuseMap: skybox.diffuseMap ? 'set' : null,
          rotationAngle: skybox.rotationAngle,
        };
      }
      // Octree
      const octree = globals.octree as Record<string, unknown> | null;
      if (octree) {
        const minPos = octree.minPos as { x?: number; y?: number; z?: number } | null;
        const maxPos = octree.maxPos as { x?: number; y?: number; z?: number } | null;
        result.octree = {
          enabled: octree.enabled,
          minPos: minPos ? { x: minPos.x, y: minPos.y, z: minPos.z } : null,
          maxPos: maxPos ? { x: maxPos.x, y: maxPos.y, z: maxPos.z } : null,
          depth: octree.depth,
        };
      }
      return result;
    }],
    // ─── screen_to_world: convert screen coordinates to world position ──
    ['screen_to_world', (_self, scene, p) => {
      const cc = getCC();
      const { Camera } = cc;
      const screenX = Number(p.screenX ?? p.x ?? 0);
      const screenY = Number(p.screenY ?? p.y ?? 0);
      const screenZ = Number(p.screenZ ?? p.z ?? 0);
      // Find camera
      const camUuid = p.uuid ? toStr(p.uuid) : '';
      let camComp: Record<string, unknown> | null = null;
      let camNode: CocosNode | null = null;
      const walkCam = (n: CocosNode) => {
        if (camComp) return;
        const cam = (n as Record<string, unknown> & CocosNode).getComponent?.(Camera);
        if (cam) {
          const nodeUuid = n.uuid || n._id;
          if (!camUuid || nodeUuid === camUuid) { camComp = cam as Record<string, unknown>; camNode = n; return; }
        }
        for (const child of n.children || []) walkCam(child);
      };
      walkCam(scene);
      if (!camComp) return { error: '未找到 Camera 组件' };
      const camObj = camComp as Record<string, unknown>;
      const screenToWorld = camObj.screenToWorld as ((out: unknown, screen: unknown) => unknown) | undefined;
      if (typeof screenToWorld !== 'function') return { error: '当前 Camera 不支持 screenToWorld 方法' };
      const Vec3 = cc.Vec3;
      const out = new Vec3(0, 0, 0) as { x: number; y: number; z: number };
      const screenPos = new Vec3(screenX, screenY, screenZ);
      try {
        screenToWorld.call(camComp, out, screenPos);
        return {
          success: true,
          camera: { uuid: camNode!.uuid || camNode!._id, name: camNode!.name },
          screen: { x: screenX, y: screenY, z: screenZ },
          world: { x: Math.round(out.x * 1000) / 1000, y: Math.round(out.y * 1000) / 1000, z: Math.round(out.z * 1000) / 1000 },
        };
      } catch (err: unknown) {
        return { error: `screenToWorld 调用失败: ${err instanceof Error ? err.message : String(err)}` };
      }
    }],
    // ─── world_to_screen: convert world position to screen coordinates ──
    ['world_to_screen', (_self, scene, p) => {
      const cc = getCC();
      const { Camera } = cc;
      const worldX = Number(p.worldX ?? p.x ?? 0);
      const worldY = Number(p.worldY ?? p.y ?? 0);
      const worldZ = Number(p.worldZ ?? p.z ?? 0);
      const camUuid = p.uuid ? toStr(p.uuid) : '';
      let camComp: Record<string, unknown> | null = null;
      let camNode: CocosNode | null = null;
      const walkCam = (n: CocosNode) => {
        if (camComp) return;
        const cam = (n as Record<string, unknown> & CocosNode).getComponent?.(Camera);
        if (cam) {
          const nodeUuid = n.uuid || n._id;
          if (!camUuid || nodeUuid === camUuid) { camComp = cam as Record<string, unknown>; camNode = n; return; }
        }
        for (const child of n.children || []) walkCam(child);
      };
      walkCam(scene);
      if (!camComp) return { error: '未找到 Camera 组件' };
      const camObj = camComp as Record<string, unknown>;
      const worldToScreen = camObj.worldToScreen as ((out: unknown, world: unknown) => unknown) | undefined;
      if (typeof worldToScreen !== 'function') return { error: '当前 Camera 不支持 worldToScreen 方法' };
      const Vec3 = cc.Vec3;
      const out = new Vec3(0, 0, 0) as { x: number; y: number; z: number };
      const worldPos = new Vec3(worldX, worldY, worldZ);
      try {
        worldToScreen.call(camComp, out, worldPos);
        return {
          success: true,
          camera: { uuid: camNode!.uuid || camNode!._id, name: camNode!.name },
          world: { x: worldX, y: worldY, z: worldZ },
          screen: { x: Math.round(out.x * 100) / 100, y: Math.round(out.y * 100) / 100, z: Math.round(out.z * 1000) / 1000 },
        };
      } catch (err: unknown) {
        return { error: `worldToScreen 调用失败: ${err instanceof Error ? err.message : String(err)}` };
      }
    }],
    ['get_scene_globals', (_self, scene) => {
      let globals: unknown = null;
      if (scene.globals) {
        try { globals = JSON.parse(JSON.stringify(scene.globals)); } catch (e) { logIgnored(ErrorCategory.SERIALIZATION, '场景全局设置序列化失败（可能存在循环引用）', e); globals = '[循环引用或不可序列化]'; }
      }
      return {
        sceneName: scene.name,
        uuid: scene.uuid || scene._id,
        autoReleaseAssets: scene.autoReleaseAssets ?? false,
        globals,
      };
    }],
    ['validate_scene', (_self, scene) => {
      const issues: Record<string, unknown>[] = [];
      let totalNodes = 0, inactiveNodes = 0, emptyNodes = 0, missingComponents = 0;
      const walkValidate = (n: CocosNode, depth: number) => {
        totalNodes++;
        if (!n.active) inactiveNodes++;
        const comps = n._components || [];
        const children = n.children || [];
        if (comps.length === 0 && children.length === 0 && depth > 0) {
          emptyNodes++;
          if (issues.length < 50) issues.push({ type: 'empty_node', uuid: n.uuid || n._id, name: n.name, path: getNodePath(n) });
        }
        for (const comp of comps) {
          if (!comp || !comp.constructor || comp.constructor.name === 'MissingScript') {
            missingComponents++;
            if (issues.length < 50) issues.push({ type: 'missing_component', uuid: n.uuid || n._id, name: n.name, path: getNodePath(n) });
          }
        }
        if (children.length > 1) {
          const nameCount = new Map<string, number>();
          for (const child of children) nameCount.set(child.name, (nameCount.get(child.name) || 0) + 1);
          for (const [dupName, cnt] of nameCount) {
            if (cnt > 1 && issues.length < 50) issues.push({ type: 'duplicate_sibling_name', parentPath: getNodePath(n), name: dupName, count: cnt });
          }
        }
        if (depth > 15 && issues.length < 50) issues.push({ type: 'deep_nesting', uuid: n.uuid || n._id, name: n.name, depth, path: getNodePath(n) });
        for (const child of children) walkValidate(child, depth + 1);
      };
      walkValidate(scene, 0);
      return { valid: issues.length === 0, sceneName: scene.name, totalNodes, inactiveNodes, emptyNodes, missingComponents, issueCount: issues.length, issues };
    }],
    ['detect_2d_3d', (_self, scene, p) => {
      const uuid = toStr(p.uuid);
      let has2D = false, has3D = false;
      const sample2D: Record<string, unknown>[] = [];
      const sample3D: Record<string, unknown>[] = [];
      const COMP_2D = ['UITransform', 'Sprite', 'Label', 'Canvas', 'Widget', 'Layout', 'Button', 'ScrollView', 'RichText', 'UIOpacity', 'Graphics', 'Mask', 'EditBox', 'ProgressBar', 'Toggle', 'Slider', 'PageView'];
      const COMP_3D = ['MeshRenderer', 'SkinnedMeshRenderer', 'SkinnedMeshBatchRenderer', 'MeshCollider', 'BoxCollider', 'SphereCollider', 'CapsuleCollider', 'RigidBody', 'DirectionalLight', 'SpotLight', 'SphereLight', 'Terrain'];
      const targetNode = uuid ? findNodeByUuid(scene, uuid) : scene;
      if (!targetNode) return { error: `未找到节点: ${uuid}` };
      const walkDetect = (n: CocosNode) => {
        for (const comp of (n._components || [])) {
          const cn = comp.constructor?.name || comp.__classname__ || '';
          const plain = cn.startsWith('cc.') ? cn.slice(3) : cn;
          if (COMP_2D.includes(plain)) { has2D = true; if (sample2D.length < 5) sample2D.push({ uuid: n.uuid || n._id, name: n.name, component: plain }); }
          if (COMP_3D.includes(plain)) { has3D = true; if (sample3D.length < 5) sample3D.push({ uuid: n.uuid || n._id, name: n.name, component: plain }); }
        }
        for (const child of n.children || []) walkDetect(child);
      };
      walkDetect(targetNode);
      const sceneType = (has2D && has3D) ? 'mixed_2d_3d' : has2D ? '2d' : has3D ? '3d' : 'unknown';
      return { sceneType, has2D, has3D, sample2DNodes: sample2D, sample3DNodes: sample3D };
    }],
    // ─── measure_distance: measure between two nodes ───────────────────
    ['measure_distance', (_self, scene, p) => {
      const uuidA = toStr(p.uuidA ?? p.uuid);
      const uuidB = toStr(p.uuidB);
      if (!uuidA || !uuidB) return { error: '需要 uuidA 和 uuidB 两个参数' };
      const rA = requireNode(scene, uuidA);
      if ('error' in rA) return rA;
      const rB = requireNode(scene, uuidB);
      if ('error' in rB) return rB;
      const wpA = rA.node.worldPosition ?? { x: 0, y: 0, z: 0 };
      const wpB = rB.node.worldPosition ?? { x: 0, y: 0, z: 0 };
      const dx = wpB.x - wpA.x, dy = wpB.y - wpA.y, dz = wpB.z - wpA.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const distance2D = Math.sqrt(dx * dx + dy * dy);
      return {
        uuidA, uuidB, nameA: rA.node.name, nameB: rB.node.name,
        positionA: { x: wpA.x, y: wpA.y, z: wpA.z },
        positionB: { x: wpB.x, y: wpB.y, z: wpB.z },
        delta: { x: dx, y: dy, z: dz },
        distance3D: Math.round(distance * 100) / 100,
        distance2D: Math.round(distance2D * 100) / 100,
        alignedX: Math.abs(dx) < 1,
        alignedY: Math.abs(dy) < 1,
      };
    }],

    // ─── scene_snapshot: capture current scene state ─────────────────────
    ['scene_snapshot', (_self, scene, p) => {
      const maxNodes = typeof p.maxNodes === 'number' && p.maxNodes > 0 ? Math.min(p.maxNodes, 5000) : 500;
      const snapshot: Record<string, unknown>[] = [];
      let truncated = false;
      const walkSnapshot = (n: CocosNode, depth: number) => {
        if (snapshot.length >= maxNodes) { truncated = true; return; }
        const comps = (n._components || []).map((c: CocosComponent) => {
          const cn = c.constructor?.name || c.__classname__ || 'Unknown';
          const props: Record<string, unknown> = {};
          try {
            for (const key of Object.keys(c)) {
              if (key.startsWith('_') && key !== '_name') continue;
              const val = c[key];
              if (typeof val === 'function') continue;
              try { props[key] = JSON.parse(JSON.stringify(val)); } catch (e2) { logIgnored(ErrorCategory.SERIALIZATION, `快照属性 "${key}" 序列化失败，回退为字符串`, e2); props[key] = String(val); }
            }
          } catch (e) { logIgnored(ErrorCategory.SERIALIZATION, `快照组件 "${cn}" 属性序列化失败`, e); }
          return { name: cn, properties: props };
        });
        snapshot.push({
          uuid: n.uuid || n._id, name: n.name, active: n.active, depth,
          position: n.position ? { x: n.position.x, y: n.position.y, z: n.position.z } : null,
          scale: n.scale ? { x: n.scale.x, y: n.scale.y, z: n.scale.z } : null,
          layer: n.layer, childCount: n.children.length, components: comps,
        });
        for (const child of n.children || []) {
          if (snapshot.length >= maxNodes) { truncated = true; return; }
          walkSnapshot(child, depth + 1);
        }
      };
      walkSnapshot(scene, 0);
      return { sceneName: scene.name, timestamp: Date.now(), nodeCount: snapshot.length, maxNodes, truncated, nodes: snapshot };
    }],

    // ─── scene_diff: compare two snapshots ───────────────────────────────
    ['scene_diff', (_self, _scene, p) => {
      const snapshotA = p.snapshotA as { nodes: Array<Record<string, unknown>> } | undefined;
      const snapshotB = p.snapshotB as { nodes: Array<Record<string, unknown>> } | undefined;
      if (!snapshotA?.nodes || !snapshotB?.nodes) return { error: '需要 snapshotA 和 snapshotB 参数（来自 scene_snapshot 的返回值）' };
      const mapA = new Map(snapshotA.nodes.map(n => [String(n.uuid), n]));
      const mapB = new Map(snapshotB.nodes.map(n => [String(n.uuid), n]));
      const added: string[] = [], removed: string[] = [], modified: Array<{ uuid: string; name: string; changes: string[] }> = [];
      for (const [uuid, nodeB] of mapB) {
        if (!mapA.has(uuid)) { added.push(`${nodeB.name} (${uuid})`); continue; }
        const nodeA = mapA.get(uuid)!;
        const changes: string[] = [];
        if (nodeA.name !== nodeB.name) changes.push(`name: ${nodeA.name} → ${nodeB.name}`);
        if (nodeA.active !== nodeB.active) changes.push(`active: ${nodeA.active} → ${nodeB.active}`);
        if (JSON.stringify(nodeA.position) !== JSON.stringify(nodeB.position)) changes.push('position changed');
        if (JSON.stringify(nodeA.scale) !== JSON.stringify(nodeB.scale)) changes.push('scale changed');
        if (JSON.stringify(nodeA.components) !== JSON.stringify(nodeB.components)) changes.push('components changed');
        if (changes.length > 0) modified.push({ uuid, name: String(nodeB.name), changes });
      }
      for (const [uuid, nodeA] of mapA) {
        if (!mapB.has(uuid)) removed.push(`${nodeA.name} (${uuid})`);
      }
      return { addedCount: added.length, removedCount: removed.length, modifiedCount: modified.length, added, removed, modified };
    }],

    // ─── performance_audit: analyze scene for performance issues ─────────
    ['performance_audit', (_self, scene) => {
      const issues: Array<{ severity: string; type: string; message: string; uuid?: string }> = [];
      let totalNodes = 0, totalComponents = 0, maxDepth = 0;
      const compCounts: Record<string, number> = {};
      const walkAudit = (n: CocosNode, depth: number) => {
        totalNodes++;
        if (depth > maxDepth) maxDepth = depth;
        const comps = n._components || [];
        totalComponents += comps.length;
        for (const comp of comps) {
          const cn = comp.constructor?.name || comp.__classname__ || 'Unknown';
          compCounts[cn] = (compCounts[cn] || 0) + 1;
        }
        // Check for performance issues
        if (n.children.length > 100 && issues.length < 50) {
          issues.push({ severity: 'warning', type: 'too_many_children', message: `节点 "${n.name}" 有 ${n.children.length} 个子节点`, uuid: n.uuid || n._id });
        }
        if (depth > 20 && issues.length < 50) {
          issues.push({ severity: 'warning', type: 'deep_nesting', message: `节点 "${n.name}" 嵌套深度 ${depth}`, uuid: n.uuid || n._id });
        }
        if (comps.length > 10 && issues.length < 50) {
          issues.push({ severity: 'info', type: 'many_components', message: `节点 "${n.name}" 有 ${comps.length} 个组件`, uuid: n.uuid || n._id });
        }
        for (const child of n.children || []) walkAudit(child, depth + 1);
      };
      walkAudit(scene, 0);
      if (totalNodes > 5000) issues.unshift({ severity: 'error', type: 'too_many_nodes', message: `场景共 ${totalNodes} 个节点，建议控制在 5000 以内` });
      else if (totalNodes > 2000) issues.unshift({ severity: 'warning', type: 'many_nodes', message: `场景共 ${totalNodes} 个节点，较多` });
      const estimatedDrawCalls = (compCounts['Sprite'] || 0) + (compCounts['cc.Sprite'] || 0) + (compCounts['MeshRenderer'] || 0) + (compCounts['cc.MeshRenderer'] || 0) + (compCounts['Label'] || 0) + (compCounts['cc.Label'] || 0);
      if (estimatedDrawCalls > 200) issues.push({ severity: 'warning', type: 'high_draw_calls', message: `估算 Draw Call 约 ${estimatedDrawCalls}（Sprite + MeshRenderer + Label）` });
      return {
        sceneName: scene.name, totalNodes, totalComponents, maxDepth, estimatedDrawCalls,
        componentBreakdown: compCounts, issueCount: issues.length, issues,
        score: issues.filter(i => i.severity === 'error').length === 0 ? (issues.filter(i => i.severity === 'warning').length === 0 ? 'excellent' : 'good') : 'needs_attention',
      };
    }],

    // ─── export_scene_json: full scene serialization ─────────────────────
    ['export_scene_json', (_self, scene, p) => {
      const maxNodes = Math.min(Number(p.maxNodes ?? 500), 2000);
      let count = 0;
      const serialize = (n: CocosNode, depth: number): Record<string, unknown> | null => {
        if (count >= maxNodes) return null;
        count++;
        const comps = (n._components || []).map((c: CocosComponent) => {
          const cn = c.constructor?.name || c.__classname__ || 'Unknown';
          const props: Record<string, unknown> = {};
          try {
            for (const key of Object.keys(c)) {
              if (key.startsWith('_') && key !== '_name') continue;
              const val = c[key];
              if (typeof val === 'function') continue;
              try { props[key] = JSON.parse(JSON.stringify(val)); } catch (e2) { logIgnored(ErrorCategory.SERIALIZATION, `导出属性 "${key}" 序列化失败，回退为字符串`, e2); props[key] = String(val); }
            }
          } catch (e) { logIgnored(ErrorCategory.SERIALIZATION, `导出组件 "${cn}" 属性序列化失败`, e); }
          return { type: cn, properties: props };
        });
        const children = (n.children || []).map(child => serialize(child, depth + 1)).filter(Boolean);
        return {
          uuid: n.uuid || n._id, name: n.name, active: n.active, layer: n.layer,
          position: n.position ? { x: n.position.x, y: n.position.y, z: n.position.z } : null,
          scale: n.scale ? { x: n.scale.x, y: n.scale.y, z: n.scale.z } : null,
          components: comps, children,
        };
      };
      const result = serialize(scene, 0);
      return { sceneName: scene.name, nodeCount: count, truncated: count >= maxNodes, scene: result };
    }],

    // ─── get_node_bounds: get bounding box of a node ──────────────────
    ['get_node_bounds', (_self, scene, p) => {
      const { js } = getCC();
      const uuid = toStr(p.uuid);
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      const result: Record<string, unknown> = { uuid, name: r.node.name, path: getNodePath(r.node) };
      // 2D bounds via UITransform
      const UITransform = js.getClassByName('UITransform') || js.getClassByName('cc.UITransform');
      if (UITransform) {
        const ut = r.node.getComponent(UITransform) as Record<string, unknown> | null;
        if (ut) {
          const cs = ut.contentSize as { width: number; height: number } | null;
          const ap = ut.anchorPoint as { x: number; y: number } | null;
          result.contentSize = cs ? { width: cs.width, height: cs.height } : null;
          result.anchorPoint = ap ? { x: ap.x, y: ap.y } : null;
          if (typeof ut.getBoundingBox === 'function') {
            try {
              const rect = (ut as { getBoundingBox: () => { x: number; y: number; width: number; height: number } }).getBoundingBox();
              result.localBounds = { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
            } catch (e) { logIgnored(ErrorCategory.ENGINE_API, '获取本地包围盒失败', e); }
          }
          if (typeof ut.getBoundingBoxToWorld === 'function') {
            try {
              const rect = (ut as { getBoundingBoxToWorld: () => { x: number; y: number; width: number; height: number } }).getBoundingBoxToWorld();
              result.worldBounds = { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
            } catch (e) { logIgnored(ErrorCategory.ENGINE_API, '获取世界包围盒失败', e); }
          }
          result.boundsType = '2d';
        }
      }
      // 3D bounds via MeshRenderer
      if (!result.boundsType) {
        const MeshRenderer = js.getClassByName('MeshRenderer') || js.getClassByName('cc.MeshRenderer');
        if (MeshRenderer) {
          const mr = r.node.getComponent(MeshRenderer) as Record<string, unknown> | null;
          if (mr && mr.model) {
            const model = mr.model as Record<string, unknown>;
            if (model.worldBounds) {
              const wb = model.worldBounds as { center: { x: number; y: number; z: number }; halfExtents: { x: number; y: number; z: number } };
              result.worldBounds = {
                center: { x: wb.center.x, y: wb.center.y, z: wb.center.z },
                halfExtents: { x: wb.halfExtents.x, y: wb.halfExtents.y, z: wb.halfExtents.z },
              };
              result.boundsType = '3d';
            }
          }
        }
      }
      if (!result.boundsType) result.boundsType = 'none';
      return result;
    }],

    // ─── find_nodes_by_layer: find nodes matching a layer bitmask ─────
    ['find_nodes_by_layer', (_self, scene, p) => {
      const targetLayer = Number(p.layer ?? 0);
      if (!targetLayer) return { error: '缺少 layer 参数（节点的 layer 位掩码值，如 1=DEFAULT, 33554432=UI_2D）' };
      const exact = p.exact !== false; // default: exact match
      const results: Record<string, unknown>[] = [];
      const walk = (n: CocosNode) => {
        const match = exact ? (n.layer === targetLayer) : ((n.layer & targetLayer) !== 0);
        if (match) {
          results.push({ uuid: n.uuid || n._id, name: n.name, path: getNodePath(n), active: n.active, layer: n.layer });
        }
        for (const child of n.children || []) walk(child);
      };
      walk(scene);
      return { count: results.length, layer: targetLayer, exact, nodes: results };
    }],

    // ─── get_animation_state: get animation component state ──────────
    ['get_animation_state', (_self, scene, p) => {
      const { js } = getCC();
      const uuid = toStr(p.uuid);
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      const AnimClass = js.getClassByName('Animation') || js.getClassByName('cc.Animation') || js.getClassByName('AnimationComponent') || js.getClassByName('cc.AnimationComponent');
      if (!AnimClass) return { error: 'Animation 组件类不可用' };
      const anim = r.node.getComponent(AnimClass) as Record<string, unknown> | null;
      if (!anim) return { uuid, name: r.node.name, hasAnimation: false, message: '节点上没有 Animation 组件' };
      const rawClips = (anim.clips as Array<Record<string, unknown> | null> | null) || [];
      const clips = rawClips.filter((clip): clip is Record<string, unknown> => {
        if (!clip) return false;
        const clipName = clipStrField(clip, 'name', '_name') || 'unnamed';
        const clipDuration = clipNumField(clip, 0, 'duration', '_duration');
        const trackCount = Array.isArray(clip._tracks) ? clip._tracks.length : 0;
        if (clipName === 'unnamed' && clipDuration === 0 && trackCount === 0) return false;
        return true;
      });
      const clipInfos = clips.map((clip) => {
        if (!clip) return { name: 'null', duration: 0 };
        return {
          name: clipStrField(clip, 'name', '_name') || 'unnamed',
          duration: clipNumField(clip, 0, 'duration', '_duration'),
          speed: clipNumField(clip, 1, 'speed', '_speed'),
          wrapMode: clipNumField(clip, 0, 'wrapMode', '_wrapMode'),
        };
      });
      const defaultClip = anim.defaultClip as Record<string, unknown> | null;
      const result: Record<string, unknown> = {
        uuid, name: r.node.name, hasAnimation: true,
        clipCount: clips.length,
        clips: clipInfos,
        defaultClip: defaultClip ? (clipStrField(defaultClip, 'name', '_name') || 'unnamed') : null,
        playOnLoad: anim.playOnLoad ?? false,
      };
      if (rawClips.length !== clips.length) {
        result.filteredNullClips = rawClips.length - clips.length;
      }
      // Try to get current playing state
      if (typeof anim.getState === 'function') {
        try {
          for (const clip of clips) {
            if (!clip || !clip.name) continue;
            const state = (anim as { getState: (name: string) => Record<string, unknown> | null }).getState(String(clip.name));
            if (state && state.isPlaying) {
              result.currentlyPlaying = clip.name;
              result.currentTime = state.time ?? 0;
              result.isPlaying = true;
              break;
            }
          }
          if (!result.isPlaying) result.isPlaying = false;
        } catch (e) { logIgnored(ErrorCategory.ENGINE_API, '获取动画播放状态失败', e); }
      }
      return result;
    }],

    // ─── get_collider_info: get collider component details ───────────
    ['get_collider_info', (_self, scene, p) => {
      const { js } = getCC();
      const uuid = toStr(p.uuid);
      const r = requireNode(scene, uuid);
      if ('error' in r) return r;
      const COLLIDER_NAMES = new Set([
        'BoxCollider2D', 'CircleCollider2D', 'PolygonCollider2D', 'CapsuleCollider2D',
        'BoxCollider', 'SphereCollider', 'CapsuleCollider', 'MeshCollider', 'CylinderCollider', 'ConeCollider', 'PlaneCollider',
      ]);
      const colliders: Record<string, unknown>[] = [];
      for (const comp of (r.node._components || [])) {
        const cn = comp.constructor?.name || comp.__classname__ || '';
        const plain = cn.startsWith('cc.') ? cn.slice(3) : cn;
        if (!COLLIDER_NAMES.has(plain)) continue;
        const c = comp as Record<string, unknown>;
        const info: Record<string, unknown> = { type: plain };
        if (c.offset) try { info.offset = JSON.parse(JSON.stringify(c.offset)); } catch (e) { logIgnored(ErrorCategory.SERIALIZATION, `碰撞体 "${plain}" offset 序列化失败`, e); }
        if (c.size) try { info.size = JSON.parse(JSON.stringify(c.size)); } catch (e) { logIgnored(ErrorCategory.SERIALIZATION, `碰撞体 "${plain}" size 序列化失败`, e); }
        if (c.radius !== undefined) info.radius = c.radius;
        if (c.height !== undefined) info.height = c.height;
        if (c.direction !== undefined) info.direction = c.direction;
        if (c.center) try { info.center = JSON.parse(JSON.stringify(c.center)); } catch (e) { logIgnored(ErrorCategory.SERIALIZATION, `碰撞体 "${plain}" center 序列化失败`, e); }
        if (c.points) {
          try { info.points = JSON.parse(JSON.stringify(c.points)); } catch (e) { logIgnored(ErrorCategory.SERIALIZATION, `碰撞体 "${plain}" points 序列化失败，回退为点数`, e); info.pointCount = (c.points as unknown[]).length; }
        }
        if (c.isTrigger !== undefined) info.isTrigger = c.isTrigger;
        if (c.sensor !== undefined) info.sensor = c.sensor;
        if (c.density !== undefined) info.density = c.density;
        if (c.friction !== undefined) info.friction = c.friction;
        if (c.restitution !== undefined) info.restitution = c.restitution;
        if (c.group !== undefined) info.group = c.group;
        if (c.enabled !== undefined) info.enabled = c.enabled;
        colliders.push(info);
      }
      // Also check RigidBody
      let rigidBody: Record<string, unknown> | null = null;
      const RB2D = js.getClassByName('RigidBody2D') || js.getClassByName('cc.RigidBody2D');
      const RB3D = js.getClassByName('RigidBody') || js.getClassByName('cc.RigidBody');
      for (const [rbClass, rbType] of [[RB2D, 'RigidBody2D'], [RB3D, 'RigidBody']] as Array<[unknown, string]>) {
        if (!rbClass) continue;
        const rb = r.node.getComponent(rbClass) as Record<string, unknown> | null;
        if (rb) {
          rigidBody = { type: rbType, enabled: rb.enabled };
          if (rb.type !== undefined) rigidBody.bodyType = rb.type;
          if (rb.mass !== undefined) rigidBody.mass = rb.mass;
          if (rb.linearDamping !== undefined) rigidBody.linearDamping = rb.linearDamping;
          if (rb.angularDamping !== undefined) rigidBody.angularDamping = rb.angularDamping;
          if (rb.gravityScale !== undefined) rigidBody.gravityScale = rb.gravityScale;
          if (rb.allowSleep !== undefined) rigidBody.allowSleep = rb.allowSleep;
          if (rb.fixedRotation !== undefined) rigidBody.fixedRotation = rb.fixedRotation;
          if (rb.bullet !== undefined) rigidBody.bullet = rb.bullet;
          if (rb.useGravity !== undefined) rigidBody.useGravity = rb.useGravity;
          break;
        }
      }
      return { uuid, name: r.node.name, colliderCount: colliders.length, colliders, rigidBody };
    }],

    ['list_available_components', (_self, _scene) => {
      const { js, Component } = getCC();
      const allClasses: Record<string, unknown>[] = [];
      const visited = new Set<string>();
      const classMap = js._nameToClass || js._registeredClassNames || {};
      const COMP_2D_LIST = ['UITransform', 'Sprite', 'Label', 'Canvas', 'Widget', 'Layout', 'Button', 'ScrollView', 'RichText', 'UIOpacity', 'Graphics', 'Mask', 'EditBox', 'ProgressBar', 'Toggle', 'Slider', 'PageView', 'SafeArea', 'BlockInputEvents', 'UIMeshRenderer'];
      const COMP_3D_LIST = ['MeshRenderer', 'SkinnedMeshRenderer', 'SkinnedMeshBatchRenderer', 'MeshCollider', 'BoxCollider', 'SphereCollider', 'CapsuleCollider', 'RigidBody', 'DirectionalLight', 'SpotLight', 'SphereLight', 'Camera', 'Terrain', 'ParticleSystem', 'BillboardComponent'];
      const COMP_ANIM = ['Animation', 'AnimationController', 'SkeletalAnimation'];
      const COMP_AUDIO = ['AudioSource'];
      for (const [clsName, cls] of Object.entries(classMap)) {
        try {
          if (!cls || visited.has(clsName)) continue;
          visited.add(clsName);
          let isComponent = false;
          try {
            if (cls === Component) isComponent = true;
            else if (typeof cls === 'function' && (cls as { prototype: unknown }).prototype instanceof Component) isComponent = true;
          } catch (e) { logIgnored(ErrorCategory.REFLECTION, `类型检查 "${clsName}" 是否为 Component 失败`, e); }
          if (!isComponent) continue;
          const displayName = clsName.startsWith('cc.') ? clsName.slice(3) : clsName;
          const isBuiltin = clsName.startsWith('cc.');
          let category = 'other';
          if (COMP_2D_LIST.includes(displayName)) category = '2d_ui';
          else if (COMP_3D_LIST.includes(displayName)) category = '3d_rendering';
          else if (COMP_ANIM.includes(displayName)) category = 'animation';
          else if (COMP_AUDIO.includes(displayName)) category = 'audio';
          else if (!isBuiltin) category = 'user_defined';
          allClasses.push({ name: displayName, fullName: clsName, category, isBuiltin });
        } catch (e) { logIgnored(ErrorCategory.REFLECTION, `遍历组件类 "${clsName}" 失败`, e); }
      }
      const grouped: Record<string, string[]> = {};
      for (const c of allClasses) {
        const cat = c.category as string;
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(c.name as string);
      }
      return {
        totalCount: allClasses.length,
        categorySummary: Object.fromEntries(Object.entries(grouped).map(([k, v]) => [k, v.length])),
        categories: grouped,
        components: allClasses,
      };
    }],

    // ── Script binding queries ──────────────────────────────────────────────
    ['check_script_ready', (_self, _scene, p) => {
      const cc = getCC();
      const { js } = cc;
      const scriptName = toStr(p.script ?? p.component);
      if (!scriptName) return { error: '缺少 script 参数（脚本类名）' };
      const cls = js.getClassByName(scriptName) || js.getClassByName('cc.' + scriptName);
      if (cls) {
        const proto = cls.prototype as Record<string, unknown> | null;
        const isComponent = proto && typeof proto.addComponent === 'function';
        return { ready: true, script: scriptName, isComponent: !!isComponent };
      }
      return { ready: false, script: scriptName, message: `脚本类 "${scriptName}" 尚未注册，可能未编译完成或类名不正确` };
    }],

    ['get_script_properties', (_self, _scene, p) => {
      const cc = getCC();
      const { js, CCClass } = cc as Record<string, unknown> & CocosCC;
      const scriptName = toStr(p.script ?? p.component);
      if (!scriptName) return { error: '缺少 script 参数（脚本类名）' };
      const cls = js.getClassByName(scriptName) || js.getClassByName('cc.' + scriptName);
      if (!cls) return { error: `未找到脚本类: ${scriptName}`, hint: '请确认脚本已编译且类名正确，可先用 check_script_ready 检查' };
      const result: Record<string, unknown>[] = [];
      try {
        // Cocos CCClass stores property attrs in __attrs__
        const attrs = (CCClass as { Attr?: { getClassAttrs?: (c: unknown) => Record<string, unknown> } })
          ?.Attr?.getClassAttrs?.(cls);
        if (attrs && typeof attrs === 'object') {
          const propNames = new Set<string>();
          for (const key of Object.keys(attrs)) {
            // Attr keys are like "propertyName$_$type", "propertyName$_$default", etc.
            const propName = key.split('$_$')[0];
            if (propName && !propName.startsWith('_')) propNames.add(propName);
          }
          for (const propName of propNames) {
            const typeKey = `${propName}$_$type`;
            const defaultKey = `${propName}$_$default`;
            const visibleKey = `${propName}$_$visible`;
            const info: Record<string, unknown> = { name: propName };
            if (typeKey in attrs) info.type = String(attrs[typeKey] ?? 'unknown');
            if (defaultKey in attrs) info.default = attrs[defaultKey];
            if (visibleKey in attrs) info.visible = attrs[visibleKey];
            result.push(info);
          }
        }
        // Fallback: inspect prototype for @property decorated fields
        if (result.length === 0) {
          const proto = cls.prototype as Record<string, unknown> | undefined;
          if (proto) {
            const builtinKeys = new Set(['__proto__', 'constructor', 'node', 'enabled', 'enabledInHierarchy',
              'uuid', '_id', 'name', 'isValid', 'hideFlags', '__classname__']);
            for (const key of Object.getOwnPropertyNames(proto)) {
              if (builtinKeys.has(key) || key.startsWith('_') || typeof proto[key] === 'function') continue;
              result.push({ name: key, default: proto[key], type: typeof proto[key] });
            }
          }
        }
      } catch (err: unknown) {
        return { error: `获取脚本属性失败: ${err instanceof Error ? err.message : String(err)}` };
      }
      return { script: scriptName, propertyCount: result.length, properties: result };
    }],
  ]);
}
