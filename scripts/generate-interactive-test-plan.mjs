import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const testsDir = path.join(rootDir, "tests");
const casesPath = path.join(testsDir, "test-cases.json");
const reportPath = path.join(testsDir, "test-report.json");
const outputPath = path.join(testsDir, "interactive-test-plan.data.js");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function derivePhase(tool) {
  const mapping = {
    bridge_status: "环境与连通",
    tool_management: "环境与连通",
    preferences: "环境与连通",
    operation_log: "环境与连通",
    scene_query: "只读查询",
    scene_operation: "核心改写",
    create_prefab_atomic: "核心改写",
    import_and_apply_texture: "核心改写",
    create_tween_animation_atomic: "核心改写",
    auto_fit_physics_collider: "核心改写",
    asset_operation: "资产与脚本",
    execute_script: "资产与脚本",
    register_custom_macro: "资产与脚本",
    script_scaffold: "资产与脚本",
    editor_action: "编辑器联动",
    broadcast: "编辑器联动",
    animation_tool: "动画工作流",
    animation_workflow: "动画工作流",
    physics_tool: "物理工作流",
    reference_image: "UI 与参考图",
    ui_generator: "UI 与参考图",
    project_linter: "质量与诊断",
    engine_action: "引擎专项",
  };

  return mapping[tool] || "扩展能力";
}

function derivePriority(tool) {
  if (tool === "bridge_status") {
    return "P0";
  }

  if (
    [
      "scene_operation",
      "asset_operation",
      "editor_action",
      "create_prefab_atomic",
      "import_and_apply_texture",
      "create_tween_animation_atomic",
      "auto_fit_physics_collider",
    ].includes(tool)
  ) {
    return "P1";
  }

  if (
    [
      "scene_query",
      "tool_management",
      "preferences",
      "animation_tool",
      "physics_tool",
      "animation_workflow",
      "ui_generator",
      "project_linter",
    ].includes(tool)
  ) {
    return "P2";
  }

  return "P3";
}

function deriveEdition(tool) {
  const proExclusiveTools = new Set([
    "engine_action",
    "reference_image",
    "scene_generator",
    "batch_engine",
    "scene_audit",
    "script_scaffold",
    "animation_workflow",
    "ui_generator",
    "project_linter",
    "operation_log",
  ]);

  return proExclusiveTools.has(tool) ? "pro" : "community";
}

function normalizeReportStatus(status) {
  switch (status) {
    case "passed":
      return "pass";
    case "failed":
    case "error":
      return "fail";
    case "skipped":
      return "blocked";
    default:
      return "pending";
  }
}

function buildAiBaseline(report) {
  const baseline = new Map();

  for (const result of report.results || []) {
    baseline.set(result.id, {
      status: normalizeReportStatus(result.status),
      duration: result.duration ?? "",
      note:
        result.status === "passed"
          ? `来自 tests/test-report.json，自动化执行通过${result.duration ? `（${result.duration}ms）` : ""}`
          : `来自 tests/test-report.json，自动化状态：${result.status}`,
    });
  }

  for (const error of report.errors || []) {
    baseline.set(error.id, {
      status: "fail",
      duration: "",
      note: `来自 tests/test-report.json，自动化失败：${error.error || "未提供错误信息"}`,
    });
  }

  return baseline;
}

function countBy(list, getter) {
  const result = new Map();

  for (const item of list) {
    const key = getter(item);
    result.set(key, (result.get(key) || 0) + 1);
  }

  return [...result.entries()]
    .sort((a, b) => String(a[0]).localeCompare(String(b[0]), "zh-CN"))
    .map(([key, count]) => ({ key, count }));
}

function buildData() {
  const cases = readJson(casesPath);
  const report = readJson(reportPath);
  const aiBaseline = buildAiBaseline(report);

  const enrichedCases = cases.map((item) => {
    const baseline = aiBaseline.get(item.id) || {
      status: "pending",
      duration: "",
      note: "",
    };

    return {
      id: item.id,
      tool: item.tool,
      action: item.action,
      title: item.title,
      input: item.input || {},
      expected: item.expected || "",
      note: item.note || "",
      phase: derivePhase(item.tool),
      priority: derivePriority(item.tool),
      edition: deriveEdition(item.tool),
      aiBaseline: baseline,
    };
  });

  const phaseSummary = countBy(enrichedCases, (item) => item.phase);
  const toolSummary = countBy(enrichedCases, (item) => item.tool);
  const editionSummary = countBy(enrichedCases, (item) => item.edition);

  const baselineSummary = {
    pass: enrichedCases.filter((item) => item.aiBaseline.status === "pass").length,
    fail: enrichedCases.filter((item) => item.aiBaseline.status === "fail").length,
    blocked: enrichedCases.filter((item) => item.aiBaseline.status === "blocked").length,
    pending: enrichedCases.filter((item) => item.aiBaseline.status === "pending").length,
  };

  return {
    generatedAt: new Date().toISOString(),
    project: {
      name: "Aura for Cocos Creator",
      repoRelativeCasesPath: "tests/test-cases.json",
      repoRelativeReportPath: "tests/test-report.json",
      totalCases: enrichedCases.length,
    },
    plan: {
      goals: [
        "覆盖现有 378 条 MCP/插件能力测试用例，形成可持续回归基线。",
        "保留 AI 自动化结果，同时补充人工验证结论，避免只测接口不测真实编辑器交互。",
        "把失败项、阻塞项、复测结果收敛到同一页面，便于发布前做 Go / No-Go 判断。",
      ],
      stages: [
        "阶段 1：环境准备与冒烟检查",
        "阶段 2：AI 自动化回归与失败项筛查",
        "阶段 3：人工交互验证与体验确认",
        "阶段 4：问题复测、关闭与发布结论",
      ],
      exitCriteria: [
        "P0 / P1 用例不存在未确认失败。",
        "人工关键路径冒烟项全部完成。",
        "所有已记录问题具备状态、责任人或复测结论。",
      ],
      checklist: [
        {
          id: "prep-editor",
          title: "确认测试环境",
          description: "Cocos Creator、目标项目、插件版本、Token、端口、网络与权限已就绪。",
        },
        {
          id: "run-unit",
          title: "执行基础自动化",
          description: "完成 npm run test / 覆盖率 / 关键集成脚本，记录当前基线结果。",
        },
        {
          id: "review-ai",
          title: "处理 AI 失败项",
          description: "对自动化失败或未覆盖项进行人工确认，判断是真缺陷、环境问题还是用例过期。",
        },
        {
          id: "manual-smoke",
          title: "完成人工冒烟",
          description: "验证启动、连接、面板、核心场景改写、资源操作、构建与动画等关键链路。",
        },
        {
          id: "retest-close",
          title: "复测并出结论",
          description: "对已修复问题做回归，填写 Go / Conditional Go / No-Go 结论。",
        },
      ],
    },
    summaries: {
      phases: phaseSummary,
      tools: toolSummary,
      editions: editionSummary,
      aiBaseline: baselineSummary,
    },
    cases: enrichedCases,
  };
}

const data = buildData();
const output = `window.AURO_INTERACTIVE_TEST_PLAN_DATA = ${JSON.stringify(data, null, 2)};\n`;

fs.writeFileSync(outputPath, output, "utf8");
console.log(`Generated ${path.relative(rootDir, outputPath)} with ${data.project.totalCases} cases.`);
