/**
 * One-off: regenerate src/scene-operation-handlers-impl.ts from dist/scene-operation-handlers-impl.js
 * Run: node scripts/regen-scene-operation-handlers-impl.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const distJs = fs.readFileSync(path.join(ROOT, 'dist/scene-operation-handlers-impl.js'), 'utf8');

const start = distJs.indexOf('function buildOperationHandlers(deps) {');
if (start < 0) throw new Error('start marker not found');
const bodyStart = start + 'function buildOperationHandlers(deps) {'.length;
const endMarker = '\n    return handlers;\n}';
const end = distJs.indexOf(endMarker, bodyStart);
if (end < 0) throw new Error('end marker not found');
let inner = distJs.slice(bodyStart, end);
inner = inner.replace(
  /\(0, error_utils_1\.logIgnored\)\(error_utils_1\.ErrorCategory\./g,
  'logIgnored(ErrorCategory.',
);
inner = inner.replace(/\(0, scene_types_1\.isNodeRef\)/g, 'isNodeRef');
inner = inner.replace(/\(0, scene_types_1\.isComponentRef\)/g, 'isComponentRef');
inner = inner.replace(/\(0, scene_types_1\.resolveRefToRuntime\)/g, 'resolveRefToRuntime');

const header = `// @ts-nocheck — 自 dist 迁移的完整 handler 映射；后续若拆分子模块再逐步补类型
import type { CocosCC, CocosNode, OperationHandler } from './scene-types';
import { isNodeRef, isComponentRef, resolveRefToRuntime } from './scene-types';
import { ErrorCategory, logIgnored } from './error-utils';

export interface SceneOperationDeps {
  getCC: () => CocosCC;
  findNodeByUuid: (root: CocosNode | null, uuid: string) => CocosNode | null;
  findNodeByName: (root: CocosNode | null, name: string) => CocosNode | null;
  resolveParent: (scene: CocosNode, ref: string) => { node: CocosNode } | { error: string };
  requireNode: (scene: CocosNode, uuid: string) => { node: CocosNode } | { error: string };
  notifyEditorProperty: (uuid: string, path: string, dump: { type: string; value: unknown }) => Promise<boolean>;
  notifyEditorRemoveNode: (uuid: string) => Promise<boolean>;
  notifyEditorComponentProperty: (
    nodeUuid: string,
    node: CocosNode,
    comp: unknown,
    property: string,
    dump: { type: string; value: unknown },
  ) => Promise<boolean>;
  ipcDuplicateNode: (uuid: string) => Promise<string>;
}

export function buildOperationHandlers(deps: SceneOperationDeps): Map<string, OperationHandler> {
`;

const out = `${header}${inner}
    return handlers;
}
`;

const outPath = path.join(ROOT, 'src/scene-operation-handlers-impl.ts');
fs.writeFileSync(outPath, out, 'utf8');
console.log('Wrote', outPath);
