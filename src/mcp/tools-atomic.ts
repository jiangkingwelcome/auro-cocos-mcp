import type { LocalToolServer } from './local-tool-server';
import type { BridgeToolContext } from './tools-shared';
import { registerPrefabAtomicTool } from './tools-atomic-prefab';
import { registerTextureAtomicTool } from './tools-atomic-texture';
import { registerUILayoutAtomicTool } from './tools-atomic-ui';
import { registerAnimationAtomicTool } from './tools-atomic-animation';
import { registerPhysicsAtomicTool } from './tools-atomic-physics';
import { registerAtomicStubTools } from './tools-atomic-stubs';

export function registerAtomicTools(server: LocalToolServer, ctx: BridgeToolContext): void {
  registerPrefabAtomicTool(server, ctx);
  registerTextureAtomicTool(server, ctx);
  registerUILayoutAtomicTool(server, ctx);
  registerAnimationAtomicTool(server, ctx);
  registerPhysicsAtomicTool(server, ctx);
  registerAtomicStubTools(server, ctx);
}
