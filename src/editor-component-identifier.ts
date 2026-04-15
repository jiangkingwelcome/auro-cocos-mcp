import fs from 'fs';
import path from 'path';

type EditorMsg = (module: string, message: string, ...args: unknown[]) => Promise<unknown>;

type ComponentIdentifierOptions = {
  editorMsg?: EditorMsg;
  projectPath?: string;
};

type CachedCidMap = {
  marker: string;
  entries: Map<string, string>;
};

const RF_PUSH_RE = /_RF\.push\(\{\},\s*"([^"]+)",\s*"([^"]+)"/g;
const customScriptCidCache = new Map<string, CachedCidMap>();

function getProjectPath(projectPath?: string): string {
  if (projectPath) return projectPath;
  const editorProjectPath = (globalThis as { Editor?: { Project?: { path?: string } } }).Editor?.Project?.path;
  return typeof editorProjectPath === 'string' ? editorProjectPath : '';
}

function getProgrammingRecordMarker(projectPath: string): string {
  const mainRecord = path.join(projectPath, 'temp', 'programming', 'packer-driver', 'targets', 'editor', 'main-record.json');
  try {
    const stat = fs.statSync(mainRecord);
    return `${mainRecord}:${stat.size}:${stat.mtimeMs}`;
  } catch {
    return '';
  }
}

function collectChunkFiles(dirPath: string, output: string[]): void {
  let entries: fs.Dirent[] = [];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      collectChunkFiles(fullPath, output);
      continue;
    }
    if (entry.isFile() && fullPath.endsWith('.js') && !fullPath.endsWith('.js.map')) {
      output.push(fullPath);
    }
  }
}

function readCustomScriptCidMap(projectPath: string): Map<string, string> {
  const normalizedProjectPath = path.resolve(projectPath);
  const marker = getProgrammingRecordMarker(normalizedProjectPath);
  const cached = customScriptCidCache.get(normalizedProjectPath);
  if (cached && cached.marker === marker) return cached.entries;

  const chunksDir = path.join(normalizedProjectPath, 'temp', 'programming', 'packer-driver', 'targets', 'editor', 'chunks');
  const chunkFiles: string[] = [];
  collectChunkFiles(chunksDir, chunkFiles);

  const entries = new Map<string, string>();
  for (const filePath of chunkFiles) {
    let content = '';
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }
    if (!content.includes('_RF.push')) continue;

    RF_PUSH_RE.lastIndex = 0;
    for (const match of content.matchAll(RF_PUSH_RE)) {
      const cid = String(match[1] ?? '').trim();
      const className = String(match[2] ?? '').trim();
      if (cid && className && !entries.has(className)) {
        entries.set(className, cid);
      }
    }
  }

  customScriptCidCache.set(normalizedProjectPath, { marker, entries });
  return entries;
}

export function resolveCustomScriptCidFromProject(projectPath: string, componentName: string): string {
  if (!projectPath || !componentName) return '';
  return readCustomScriptCidMap(projectPath).get(componentName) ?? '';
}

export async function resolveEditorComponentIdentifierNode(
  componentName: string,
  options: ComponentIdentifierOptions = {},
): Promise<string> {
  if (!componentName) return componentName;
  if (componentName.startsWith('cc.') || componentName.includes('.')) return componentName;

  const projectPath = getProjectPath(options.projectPath);
  if (typeof options.editorMsg === 'function') {
    try {
      const hasScript = await options.editorMsg('scene', 'query-component-has-script', componentName);
      if (hasScript) {
        const cid = resolveCustomScriptCidFromProject(projectPath, componentName);
        return cid || componentName;
      }
    } catch {
      // Ignore and fallback to builtin naming.
    }
  }

  return `cc.${componentName}`;
}

export function clearCustomScriptCidCache(): void {
  customScriptCidCache.clear();
}
