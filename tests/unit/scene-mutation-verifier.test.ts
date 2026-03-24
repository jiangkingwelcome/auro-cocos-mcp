import { describe, expect, it, vi } from 'vitest';
import { inspectReparentOutcome, isComponentRemoved } from '../../src/scene-mutation-verifier';

describe('scene mutation verifier', () => {
  it('inspectReparentOutcome 在父节点未变化时返回失败和实际父节点信息', () => {
    const node = {
      parent: {
        uuid: 'old-parent',
        _id: 'old-parent',
        name: 'OldParent',
      },
    } as any;

    expect(inspectReparentOutcome(node, 'new-parent')).toEqual({
      ok: false,
      actualParentUuid: 'old-parent',
      actualParentName: 'OldParent',
    });
  });

  it('inspectReparentOutcome 支持通过 _id 校验父节点', () => {
    const node = {
      parent: {
        _id: 'new-parent',
        name: 'NewParent',
      },
    } as any;

    expect(inspectReparentOutcome(node, 'new-parent')).toEqual({
      ok: true,
      actualParentUuid: 'new-parent',
      actualParentName: 'NewParent',
    });
  });

  it('isComponentRemoved 在组件仍存在时返回 false', () => {
    const getComponent = vi.fn().mockReturnValue({ __classname__: 'cc.Label' });
    const node = { getComponent } as any;

    expect(isComponentRemoved(node, function Label() {})).toBe(false);
    expect(getComponent).toHaveBeenCalledTimes(1);
  });

  it('isComponentRemoved 在组件不存在时返回 true', () => {
    const node = { getComponent: vi.fn().mockReturnValue(null) } as any;

    expect(isComponentRemoved(node, function Label() {})).toBe(true);
  });
});
