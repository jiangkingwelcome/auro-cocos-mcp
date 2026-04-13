import fs from 'node:fs';
import path from 'node:path';
import { buildCocosToolServer } from '../dist/mcp/tools.js';

function makeCtx() {
  return {
    bridgeGet: async () => ({}),
    bridgePost: async () => ({ success: true }),
    sceneMethod: async () => ({ success: true }),
    editorMsg: async () => ({}),
    text: (data, isError) => ({
      content: [{ type: 'text', text: JSON.stringify(data) }],
      ...(isError !== undefined ? { isError } : {}),
    }),
  };
}

function collectCommunityMetrics() {
  const server = buildCocosToolServer(makeCtx());
  const tools = server.listTools();
  const rows = tools.map((tool) => ({
    tool: tool.name,
    actions: server.detectActionCount(tool.inputSchema),
  }));
  return {
    toolCount: tools.length,
    totalActions: server.getTotalActionCount(),
    rows,
  };
}

function parseConstActions(content) {
  const out = new Map();
  const re = /const\s+([A-Z_]+)\s*:\s*&\[&str\]\s*=\s*&\[(.*?)\];/gs;
  let m;
  while ((m = re.exec(content)) !== null) {
    const constName = m[1];
    const body = m[2];
    const count = [...body.matchAll(/"([^"]+)"/g)].length;
    out.set(constName, count);
  }
  return out;
}

function parseToolActionsFromNativeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const constActions = parseConstActions(content);
  const rows = new Map();

  // actions: CONST.iter().map(...)
  const reConst = /name:\s*"([a-z_]+)"\.into\(\)[\s\S]*?actions:\s*([A-Z_]+)\.iter\(\)\.map\(/g;
  let m;
  while ((m = reConst.exec(content)) !== null) {
    const tool = m[1];
    const constName = m[2];
    rows.set(tool, constActions.get(constName) ?? 0);
  }

  // actions: vec![...]
  const reVec = /name:\s*"([a-z_]+)"\.into\(\)[\s\S]*?actions:\s*vec!\[(.*?)\]\s*,\s*edition:/g;
  while ((m = reVec.exec(content)) !== null) {
    const tool = m[1];
    const actionsBody = m[2];
    const count = [...actionsBody.matchAll(/"([^"]+)"\.into\(\)/g)].length;
    rows.set(tool, Math.max(rows.get(tool) ?? 0, count));
  }

  return [...rows.entries()].map(([tool, actions]) => ({ tool, actions }));
}

function collectNativeProMetrics() {
  const toolsDir = path.resolve('native/src/tools');
  const files = fs
    .readdirSync(toolsDir)
    .filter((f) => f.endsWith('.rs') && f !== 'mod.rs' && f !== 'tests.rs');

  const rows = files.flatMap((file) => {
    const fullPath = path.join(toolsDir, file);
    return parseToolActionsFromNativeFile(fullPath).map((row) => ({
      file,
      ...row,
    }));
  });

  rows.sort((a, b) => a.tool.localeCompare(b.tool));

  const phases = {
    phase1: ['engine.rs', 'script.rs', 'animation.rs', 'physics.rs', 'reference.rs', 'atomic.rs'],
    phase2: ['scene.rs', 'asset.rs', 'editor.rs', 'misc.rs'],
    phase3: ['generator.rs', 'batch.rs', 'audit.rs'],
    phase4: ['scaffold.rs', 'anim_workflow.rs', 'ui_gen.rs', 'linter.rs', 'oplog.rs'],
    phase5: ['knowledge.rs'],
  };

  const phaseSummary = Object.fromEntries(
    Object.entries(phases).map(([phase, phaseFiles]) => {
      const subset = rows.filter((r) => phaseFiles.includes(r.file));
      return [
        phase,
        {
          toolCount: subset.length,
          totalActions: subset.reduce((sum, r) => sum + r.actions, 0),
        },
      ];
    })
  );

  return {
    toolCount: rows.length,
    totalActions: rows.reduce((sum, r) => sum + r.actions, 0),
    phaseSummary,
    rows,
  };
}

function collectTestMetrics() {
  const reportPath = path.resolve('.vitest-report.json');
  if (!fs.existsSync(reportPath)) {
    return null;
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const testResults = report.testResults ?? [];
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  let todo = 0;
  for (const file of testResults) {
    for (const test of file.assertionResults ?? []) {
      if (test.status === 'passed') passed += 1;
      else if (test.status === 'failed') failed += 1;
      else if (test.status === 'skipped' || test.status === 'pending') skipped += 1;
      else if (test.status === 'todo') todo += 1;
    }
  }

  return {
    testFileCount: testResults.length,
    passed,
    failed,
    skipped,
    todo,
    total: passed + failed + skipped + todo,
  };
}

const metrics = {
  generatedAt: new Date().toISOString(),
  community: collectCommunityMetrics(),
  proNative: collectNativeProMetrics(),
  tests: collectTestMetrics(),
};

const outPath = path.resolve('docs/business/trust-metrics.json');
fs.writeFileSync(outPath, `${JSON.stringify(metrics, null, 2)}\n`, 'utf8');
console.log(`Wrote ${outPath}`);
