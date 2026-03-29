# Save/Dirty Regression Checklist

## Goal
Verify that scene-changing MCP operations in Cocos Creator 3.8.8:
- mark the scene as dirty immediately
- show the save indicator on the scene tab
- persist after `Ctrl+S`
- survive Creator restart

## Preconditions
- Open a disposable test scene.
- Ensure Aura MCP is running and hot-reloaded to the latest build.
- Keep the Console panel visible.
- Before each case, start from a saved scene state.

## Core Cases
1. `scene_operation.create_node`
   Expected: node appears, scene tab shows unsaved marker, save prompt works.

2. `scene_operation.set_name`
   Expected: rename visible in hierarchy, scene marked dirty, save persists renamed node.

3. `scene_operation.set_position`
   Expected: transform changes in Inspector, scene marked dirty, reopen scene keeps values.

4. `scene_operation.add_component`
   Expected: component appears in Inspector, scene marked dirty, reopen scene still has component.

5. `scene_operation.attach_script`
   Expected: script component appears, scene marked dirty, reopen scene still has script.

6. `scene_operation.destroy_node`
   Expected: node removed, scene marked dirty, save persists deletion.

7. `scene_operation.batch`
   Suggested payload: create node + rename + move.
   Expected: all changes land in one run, scene marked dirty, save persists all changes.

## Prefab Cases
1. `scene_operation.instantiate_prefab`
   Expected: instance appears, scene marked dirty, reopen scene still contains instance.

2. `scene_operation.apply_prefab`
   Expected: prefab override application changes scene/prefab as intended and save state is correct.

3. `create_prefab_atomic`
   Expected: temporary scene edits complete without save-state loss; generated prefab asset is valid.

## Animation Cases
1. `animation_tool.create_clip` with `savePath`
   Expected: clip asset created, `Animation.defaultClip` bound, scene marked dirty if component binding changed.

2. `create_tween_animation_atomic`
   Expected: clip created/bound, scene marked dirty, reopen scene keeps animation binding.

## Physics Cases
1. `physics_tool.add_collider`
   Expected: collider appears, scene marked dirty, reopen scene still has collider.

2. `physics_tool.add_rigidbody`
   Expected: rigidbody appears, scene marked dirty, reopen scene still has rigidbody.

3. `auto_fit_physics_collider`
   Expected: fitted collider data persists after save and restart.

## Canvas/UI Cases
1. `scene_operation.ensure_2d_canvas`
   Expected: Canvas and Camera created once, scene marked dirty, reopen scene still contains them.

2. `scene_operation.set_content_size`
   Expected: UITransform content size persists after save and restart.

3. `scene_operation.set_anchor_point`
   Expected: anchor changes persist after save and restart.

## Negative Cases
1. Re-run `scene_operation.add_component` for a singleton component already present.
   Expected: no editor exception, returns already-attached semantics, no duplicate component.

2. Pass wrong script name like `cc.Test` to `scene_operation.attach_script`.
   Expected: MCP returns clear validation error, no editor stack trace.

3. Trigger rate-limited or blocked external operation.
   Expected: blocked/failure classification is correct, scene save state is unaffected.

## Persistence Confirmation
For every successful write case:
1. Observe dirty marker.
2. Save scene.
3. Close and reopen the scene.
4. Confirm the exact change is still present.
5. If relevant, restart Creator once and recheck.
