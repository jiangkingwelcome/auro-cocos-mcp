import type { CocosNode } from './scene-types';

type NodeIdentityLike = Pick<CocosNode, 'uuid' | '_id' | 'name'>;
type ReparentCheckNode = Pick<CocosNode, 'parent'>;
type ComponentCheckNode = Pick<CocosNode, 'getComponent'>;

function getNodeIdentity(node: NodeIdentityLike | null | undefined): {
  uuid: string;
  name: string | null;
} {
  if (!node) return { uuid: '', name: null };
  return {
    uuid: String(node.uuid ?? node._id ?? ''),
    name: typeof node.name === 'string' ? node.name : null,
  };
}

export function inspectReparentOutcome(node: ReparentCheckNode | null | undefined, expectedParentUuid: string): {
  ok: boolean;
  actualParentUuid: string;
  actualParentName: string | null;
} {
  const parent = node?.parent;
  const { uuid, name } = getNodeIdentity(parent);
  return {
    ok: uuid === expectedParentUuid,
    actualParentUuid: uuid,
    actualParentName: name,
  };
}

export function isComponentRemoved(node: ComponentCheckNode | null | undefined, compClass: unknown): boolean {
  if (!node || typeof node.getComponent !== 'function') return true;
  return !node.getComponent(compClass);
}
