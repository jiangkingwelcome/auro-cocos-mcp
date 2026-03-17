import type { LocalToolServer } from './local-tool-server';
import type { BridgeToolContext } from './tools-shared';

// All stub tools have been promoted to full implementations:
// - create_tween_animation_atomic -> tools-atomic-animation.ts
// - auto_fit_physics_collider -> tools-atomic-physics.ts
export function registerAtomicStubTools(_server: LocalToolServer, _ctx: BridgeToolContext): void {
  // No remaining stubs
}
