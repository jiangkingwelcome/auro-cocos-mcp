import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearCustomScriptCidCache,
  resolveCustomScriptCidFromProject,
  resolveEditorComponentIdentifierNode,
} from '../../src/editor-component-identifier';

const tempProjects: string[] = [];

function makeTempProject(): string {
  const projectPath = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-component-id-'));
  tempProjects.push(projectPath);
  const chunksDir = path.join(projectPath, 'temp', 'programming', 'packer-driver', 'targets', 'editor', 'chunks', '67');
  fs.mkdirSync(chunksDir, { recursive: true });
  fs.writeFileSync(
    path.join(projectPath, 'temp', 'programming', 'packer-driver', 'targets', 'editor', 'main-record.json'),
    JSON.stringify({ ok: true }),
    'utf8',
  );
  fs.writeFileSync(
    path.join(chunksDir, '67dfd9ac.js'),
    '_cclegacy._RF.push({}, "b9a95b60IJFVpp8rg4BwLZ2", "BallAnimation", undefined);',
    'utf8',
  );
  return projectPath;
}

afterEach(() => {
  clearCustomScriptCidCache();
  while (tempProjects.length > 0) {
    fs.rmSync(tempProjects.pop() as string, { recursive: true, force: true });
  }
});

describe('editor component identifier helpers', () => {
  it('reads custom script cid from compiled editor chunks', () => {
    const projectPath = makeTempProject();
    expect(resolveCustomScriptCidFromProject(projectPath, 'BallAnimation')).toBe('b9a95b60IJFVpp8rg4BwLZ2');
  });

  it('returns builtin cc-prefixed names for engine components', async () => {
    const editorMsg = vi.fn().mockResolvedValue(false);
    await expect(resolveEditorComponentIdentifierNode('Sprite', { editorMsg })).resolves.toBe('cc.Sprite');
    expect(editorMsg).toHaveBeenCalledWith('scene', 'query-component-has-script', 'Sprite');
  });

  it('returns compiled cid for custom scripts on node-side tool paths', async () => {
    const projectPath = makeTempProject();
    const editorMsg = vi.fn().mockResolvedValue(true);
    await expect(resolveEditorComponentIdentifierNode('BallAnimation', { editorMsg, projectPath }))
      .resolves.toBe('b9a95b60IJFVpp8rg4BwLZ2');
  });
});
