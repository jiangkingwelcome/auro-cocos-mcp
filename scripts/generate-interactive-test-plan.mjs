import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const testsDir = path.join(rootDir, "tests");
const mcpDir = path.join(rootDir, "src", "mcp");
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

function deriveEdition(tool, actionMatched = true) {
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

  if (tool === "editor_action" && !actionMatched) {
    return "pro";
  }

  return proExclusiveTools.has(tool) ? "pro" : "community";
}

function isRateLimitedErrorMessage(message) {
  return /HTTP\s*429|Too Many Requests/i.test(String(message || ""));
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
    const errorMessage = error.error || "未提供错误信息";
    baseline.set(error.id, {
      status: isRateLimitedErrorMessage(errorMessage) ? "blocked" : "fail",
      duration: "",
      note: isRateLimitedErrorMessage(errorMessage)
        ? `来自 tests/test-report.json，自动化受限流影响：${errorMessage}`
        : `来自 tests/test-report.json，自动化失败：${errorMessage}`,
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

function walkTsFiles(dirPath) {
  const files = [];
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkTsFiles(fullPath));
    } else if (entry.isFile() && fullPath.endsWith(".ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

function extractStaticText(node) {
  if (!node) {
    return "";
  }

  if (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }

  if (ts.isTemplateExpression(node)) {
    return node.head.text + node.templateSpans.map((span) => span.literal.text).join("");
  }

  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    return extractStaticText(node.left) + extractStaticText(node.right);
  }

  if (ts.isParenthesizedExpression(node)) {
    return extractStaticText(node.expression);
  }

  return "";
}

function splitActionAliases(rawName) {
  if (!rawName) {
    return [];
  }

  return rawName
    .split("/")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseActionDescriptions(description) {
  const result = {};
  const lines = description.split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/^\s*-\s*([a-zA-Z0-9_\/-]+):\s*(.+)\s*$/);
    if (!match) {
      continue;
    }

    const rawActionName = match[1].trim();
    const actionText = match[2].trim();
    const aliases = splitActionAliases(rawActionName);
    for (const alias of aliases) {
      if (!result[alias]) {
        result[alias] = actionText;
      }
    }
  }

  return result;
}

function summarizeToolDescription(description) {
  const marker = "Actions & required parameters:";
  const beforeMarker = description.includes(marker)
    ? description.split(marker)[0]
    : description;

  return beforeMarker
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ");
}

function buildToolDescriptionIndex() {
  const index = new Map();
  const files = walkTsFiles(mcpDir);

  for (const filePath of files) {
    const sourceText = fs.readFileSync(filePath, "utf8");
    const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

    function visit(node) {
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === "tool" &&
        node.arguments.length >= 2 &&
        ts.isStringLiteralLike(node.arguments[0])
      ) {
        const toolName = node.arguments[0].text;
        const description = extractStaticText(node.arguments[1]).trim();

        if (description) {
          index.set(toolName, {
            toolSummary: summarizeToolDescription(description),
            actionDescriptions: parseActionDescriptions(description),
            sourceFile: path.relative(rootDir, filePath).replace(/\\/g, "/"),
          });
        }
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
  }

  return index;
}

function translateToolSummary(text) {
  const exactMap = new Map([
    [
      "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
      "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
    ],
    [
      "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
      "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
    ],
    [
      'Manage Cocos Creator project assets via AssetDB. All assets are identified by db:// URLs (e.g. "db://assets/textures/hero.png").',
      '通过 AssetDB 管理 Cocos Creator 项目资源。所有资源都通过 db:// URL 标识，例如 "db://assets/textures/hero.png"。',
    ],
    [
      "Control the Cocos Creator editor environment (non-scene operations).",
      "控制 Cocos Creator 编辑器环境中的非场景类操作。",
    ],
    [
      "Poll, manage, and send editor event broadcasts.",
      "轮询、管理并发送编辑器事件广播。",
    ],
    [
      "Manage MCP tool availability. Enable/disable tools to reduce token consumption and AI confusion.",
      "管理 MCP 工具可用性，通过启用或禁用工具来减少 token 消耗并降低 AI 误用概率。",
    ],
    [
      "Atomically create a Cocos Creator prefab in ONE call with automatic rollback on failure.",
      "通过一次调用原子化创建 Cocos Creator 预制体，失败时自动回滚。",
    ],
    [
      "Import an external texture/image file, convert it to SpriteFrame import mode, refresh the AssetDB until the SpriteFrame sub-asset appears, then optionally auto-add Sprite component and assign the SpriteFrame to a target node.",
      "导入外部贴图/图片文件，将其切换为 SpriteFrame 导入模式，刷新 AssetDB 直到 SpriteFrame 子资源可用，并可选地自动给目标节点添加 Sprite 组件并绑定该 SpriteFrame。",
    ],
    [
      "Create a Cocos AnimationClip and optionally auto-bind/play it on a node in ONE call. This is a high-level atomic workflow built on top of animation_tool + editor operations.",
      "一次调用创建 Cocos AnimationClip，并可选地自动绑定到节点并播放。这是基于 animation_tool 和编辑器操作构建的高层原子工作流。",
    ],
    [
      "Auto-fit a physics collider to a sprite/image node in ONE call. Analyzes image alpha bounds or node size, creates/updates a collider, and optionally adds RigidBody/material.",
      "一次调用将物理碰撞体自动适配到精灵/图片节点。它会分析图片透明区域或节点尺寸，创建或更新碰撞体，并可选地补充 RigidBody 或物理材质。",
    ],
  ]);

  return exactMap.get(text) || translateActionText(text);
}

function replaceAllOrdered(text, replacements) {
  let result = text;
  for (const [from, to] of replacements) {
    result = result.replaceAll(from, to);
  }
  return result;
}

function splitTopLevel(text, separator = ",") {
  const items = [];
  let current = "";
  let depthRound = 0;
  let depthSquare = 0;
  let depthCurly = 0;
  let quote = "";

  for (const char of text) {
    if (quote) {
      current += char;
      if (char === quote) {
        quote = "";
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }

    if (char === "(") {
      depthRound += 1;
      current += char;
      continue;
    }

    if (char === ")") {
      depthRound = Math.max(0, depthRound - 1);
      current += char;
      continue;
    }

    if (char === "[") {
      depthSquare += 1;
      current += char;
      continue;
    }

    if (char === "]") {
      depthSquare = Math.max(0, depthSquare - 1);
      current += char;
      continue;
    }

    if (char === "{") {
      depthCurly += 1;
      current += char;
      continue;
    }

    if (char === "}") {
      depthCurly = Math.max(0, depthCurly - 1);
      current += char;
      continue;
    }

    if (
      char === separator &&
      depthRound === 0 &&
      depthSquare === 0 &&
      depthCurly === 0
    ) {
      items.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    items.push(current.trim());
  }

  return items;
}

function translateParameterMeta(meta) {
  if (!meta) {
    return "";
  }

  let translated = meta.trim();
  const replacements = [
    ["REQUIRED", "必填"],
    ["optional", "可选"],
    ["recommended", "推荐"],
    ["default", "默认"],
    ["e.g.", "例如"],
    ["omit=", "省略时为"],
    ["absolute OS path", "操作系统绝对路径"],
    ["db:// path to .prefab file", "指向 .prefab 文件的 db:// 路径"],
    ["db:// path", "db:// 路径"],
    ["db://... .anim", "db://... .anim 资源路径"],
    ["target node", "目标节点"],
    ["class name", "类名"],
    ["bitmask value", "位掩码值"],
    ["boolean", "布尔值"],
    ["integer", "整数"],
    ["seconds", "秒"],
    ["array of keyframe tracks", "关键帧轨道数组"],
    ["plays default clip if omitted", "省略时播放默认 clip"],
    ["timestamp in ms", "毫秒时间戳"],
    ["absolute", "绝对"],
    ["global scope", "全局作用域"],
    ["project scope", "项目作用域"],
    ["scene root", "场景根节点"],
    ["auto-detect", "自动检测"],
    ["all optional", "全部可选"],
    ["same directory", "同目录"],
    ["specific folder or entire db", "指定文件夹或整个资源库"],
    ["including custom", "包含自定义组件"],
    ["targetUrl", "targetUrl"],
    ["sourceUrl", "sourceUrl"],
    ["sourcePath", "sourcePath"],
    ["uuid omitted", "省略 uuid"],
    ["uuid specified", "传入 uuid"],
    ["optional camera", "可选，相机 uuid"],
  ];

  translated = replaceAllOrdered(translated, replacements)
    .replace(/:\s*/g, "：")
    .replace(/,\s*/g, "，")
    .replace(/\s+/g, " ")
    .trim();

  return translated;
}

function translateParameterSentence(sentence) {
  if (!sentence) {
    return "";
  }

  if (/^no params$/i.test(sentence.trim())) {
    return "无参数";
  }

  return splitTopLevel(sentence)
    .map((part) => {
      const match = part.match(/^([a-zA-Z0-9_./{}=-]+(?:\/[a-zA-Z0-9_./{}=-]+)*)\((.+)\)$/);
      if (!match) {
        return part.trim();
      }
      const name = match[1].trim();
      const meta = translateParameterMeta(match[2]);
      return `${name}（${meta}）`;
    })
    .join("，");
}

function translateClause(sentence) {
  if (!sentence) {
    return "";
  }

  const exactMap = new Map([
    [
      "Returns hierarchical scene tree",
      "返回层级场景树",
    ],
    [
      "By default filters engine-internal hidden nodes (HideInHierarchy) to match editor hierarchy panel",
      "默认会过滤引擎内部隐藏节点（HideInHierarchy），以与编辑器层级面板保持一致",
    ],
    [
      "Returns flat node list with uuid/name/depth/childCount",
      "返回扁平节点列表，包含 uuid/name/depth/childCount",
    ],
    [
      "By default filters hidden nodes",
      "默认会过滤隐藏节点",
    ],
    [
      "Returns scene statistics",
      "返回场景统计信息",
    ],
    [
      "By default filters hidden nodes, reports filteredInternalNodes count",
      "默认会过滤隐藏节点，并返回 filteredInternalNodes 计数",
    ],
    [
      "Returns full detail of a single node (position, rotation, scale, components, active, layer)",
      "返回单个节点的完整详情，包括 position、rotation、scale、components、active、layer",
    ],
    [
      'Find node by hierarchy path like "Canvas/Panel/Button"',
      '按层级路径查找节点，例如 "Canvas/Panel/Button"',
    ],
    [
      "List all components on a node",
      "列出节点上的全部组件",
    ],
    [
      "Get parent node info",
      "获取父节点信息",
    ],
    [
      "Get direct children of a node",
      "获取节点的直接子节点",
    ],
    [
      "Get sibling nodes",
      "获取同级节点",
    ],
    [
      "Get world-space position {x,y,z}",
      "获取世界坐标 {x,y,z}",
    ],
    [
      "Get world-space rotation",
      "获取世界空间旋转",
    ],
    [
      "Get world-space scale",
      "获取世界空间缩放",
    ],
    [
      "Check if node is active considering parent chain",
      "检查节点在父节点链影响下是否处于激活状态",
    ],
    [
      "Get bounding box of a node (2D: local/world rect via UITransform, 3D: AABB via MeshRenderer)",
      "获取节点包围盒（2D：通过 UITransform 返回 local/world rect；3D：通过 MeshRenderer 返回 AABB）",
    ],
    [
      "Search nodes by name substring match",
      "按名称子串匹配搜索节点",
    ],
    [
      "Find all nodes with a specific component type",
      "查找包含指定组件类型的所有节点",
    ],
    [
      "Find all nodes matching a layer",
      "查找匹配指定 layer 的所有节点",
    ],
    [
      "Read a single component property value",
      "读取单个组件属性值",
    ],
    [
      "Get all properties of all components on a node",
      "获取节点上所有组件的全部属性",
    ],
    [
      "Get camera component info (fov, near, far, orthoHeight, projection, clearFlags, priority, clearColor, rect, visibility, clearDepth, clearStencil, aperture, shutter, iso, targetTexture)",
      "获取 Camera 组件信息，包括 fov、near、far、orthoHeight、projection、clearFlags、priority、clearColor、rect、visibility、clearDepth、clearStencil、aperture、shutter、iso、targetTexture",
    ],
    [
      "If uuid omitted, finds all cameras",
      "如果省略 uuid，则查找所有相机",
    ],
    [
      "Get Canvas component info",
      "获取 Canvas 组件信息",
    ],
    [
      "If uuid omitted, finds first canvas",
      "如果省略 uuid，则查找第一个 Canvas",
    ],
    [
      "Get scene-level global settings (ambient, fog, shadows)",
      "获取场景级全局设置，包括 ambient、fog、shadows",
    ],
    [
      "Get structured scene environment settings: ambient (skyColor, skyIllum), shadows (enabled, type, size), fog (enabled, type, density), skybox (enabled, useIBL, useHDR), octree",
      "获取结构化场景环境设置：ambient（skyColor、skyIllum）、shadows（enabled、type、size）、fog（enabled、type、density）、skybox（enabled、useIBL、useHDR）以及 octree",
    ],
    [
      "Get all light components in scene (DirectionalLight/SpotLight/SphereLight) with color, illuminance/luminance, range, shadow settings, position/rotation",
      "获取场景内所有光照组件（DirectionalLight/SpotLight/SphereLight），包含 color、illuminance/luminance、range、shadow 设置、position/rotation",
    ],
    [
      "If uuid specified, only that node",
      "如果传入 uuid，则只返回该节点",
    ],
    [
      "Get material info on a node's renderer (MeshRenderer/Sprite/etc): effectName, technique, passes, uniforms (mainColor, albedo, roughness, metallic, etc)",
      "获取节点渲染器（MeshRenderer/Sprite 等）的材质信息，包括 effectName、technique、passes、uniforms（如 mainColor、albedo、roughness、metallic 等）",
    ],
    [
      "Get Animation component state: clips, playing status, current time, default clip",
      "获取 Animation 组件状态：clips、播放状态、当前时间、默认 clip",
    ],
    [
      "Get all collider components on a node with size/offset/type + RigidBody info",
      "获取节点上的全部碰撞体组件信息，包括 size/offset/type 以及 RigidBody 信息",
    ],
    [
      "Convert screen coordinates to world position via camera",
      "通过相机将屏幕坐标转换为世界坐标",
    ],
    [
      "Convert world position to screen coordinates via camera",
      "通过相机将世界坐标转换为屏幕坐标",
    ],
    [
      "Check if a script class is compiled and registered, returns {ready, isComponent}",
      "检查脚本类是否已编译并注册，返回 {ready, isComponent}",
    ],
    [
      "Get all @property declarations of a script class (name, type, default, visible)",
      "获取脚本类中全部 @property 声明（name、type、default、visible）",
    ],
    [
      "Get currently selected node(s) in editor with detail",
      "获取编辑器中当前选中的节点及其详情",
    ],
    [
      "Get AI-context: selected node detail or scene stats as fallback",
      "获取 AI 上下文：优先返回已选节点详情，否则回退为场景统计信息",
    ],
    [
      "List all .scene files in the project",
      "列出项目中的所有 .scene 文件",
    ],
    [
      "Run validation checks on the current scene",
      "对当前场景执行校验检查",
    ],
    [
      "Deep validation with missing asset detection, orphan node check, and fix suggestions",
      "执行深度校验，包括缺失资源检测、孤立节点检查和修复建议",
    ],
    [
      "Detect whether scene is 2D, 3D, or mixed",
      "检测场景属于 2D、3D 或混合模式",
    ],
    [
      "Analyze scene for performance issues (too many nodes, deep hierarchy, etc.)",
      "分析场景中的性能问题，例如节点过多、层级过深等",
    ],
    [
      "List all available component types (including custom) from cc.js runtime",
      "列出 cc.js 运行时中所有可用组件类型（包含自定义组件）",
    ],
    [
      "Capture full scene state for later diffing",
      "捕获完整场景状态，供后续 diff 使用",
    ],
    [
      "Compare two snapshots to find added/removed/modified nodes",
      "比较两个快照，找出新增、删除或修改的节点",
    ],
    [
      "Export full scene tree as JSON",
      "将完整场景树导出为 JSON",
    ],
    [
      "Measure 2D/3D distance between two nodes",
      "测量两个节点之间的 2D/3D 距离",
    ],
    [
      "Permanently removes a node",
      "永久删除一个节点",
    ],
    [
      "Move node under a new parent",
      "将节点移动到新的父节点下",
    ],
    [
      "Clone node (and optionally children), returns {clonedUuid}",
      "克隆节点（可选包含子节点），并返回 {clonedUuid}",
    ],
    [
      "Remove all child nodes",
      "删除该节点下的全部子节点",
    ],
    [
      "Set LOCAL position",
      "设置本地坐标",
    ],
    [
      "Set LOCAL euler rotation in degrees",
      "设置本地欧拉旋转，单位为度",
    ],
    [
      "Set LOCAL scale (1=100%)",
      "设置本地缩放（1=100%）",
    ],
    [
      "Set WORLD position",
      "设置世界坐标",
    ],
    [
      "Set WORLD euler rotation",
      "设置世界欧拉旋转",
    ],
    [
      "Set WORLD scale",
      "设置世界缩放",
    ],
    [
      "Reset position/rotation/scale to defaults",
      "将 position/rotation/scale 重置为默认值",
    ],
    [
      "Rename a node",
      "重命名节点",
    ],
    [
      "Enable/disable a node",
      "启用或禁用节点",
    ],
    [
      "Set UITransform anchor point directly",
      "直接设置 UITransform 锚点",
    ],
    [
      "Set UITransform content size directly",
      "直接设置 UITransform 内容尺寸",
    ],
    [
      "Reorder in sibling list",
      "调整同级列表中的顺序",
    ],
    [
      "Set exact sibling position (0-based)",
      "设置精确的同级位置（从 0 开始）",
    ],
    [
      "Add component",
      "添加组件",
    ],
    [
      "Remove component from node",
      "从节点上移除组件",
    ],
    [
      "Set a component property",
      "设置组件属性",
    ],
    [
      "Reset property to default",
      "将属性重置为默认值",
    ],
    [
      "Reset all component properties to defaults",
      "将所有组件属性重置为默认值",
    ],
    [
      "If component specified, only reset that component",
      "如果传入 component，则只重置该组件",
    ],
    [
      "Enter prefab editing mode (opens prefab as a scene)",
      "进入预制体编辑模式（将 prefab 作为场景打开）",
    ],
    [
      "Use asset-db open-asset internally",
      "内部通过 asset-db open-asset 打开资源",
    ],
    [
      "Exit prefab editing mode and return to the previous scene",
      "退出预制体编辑模式并返回上一场景",
    ],
    [
      "If sceneUrl omitted, opens the most recently opened scene",
      "如果省略 sceneUrl，则打开最近一次打开的场景",
    ],
    [
      "Apply changes to prefab asset",
      "将修改应用到 prefab 资源",
    ],
    [
      "Restore prefab instance to original",
      "将 prefab 实例恢复为原始状态",
    ],
    [
      "Check prefab file integrity",
      "检查 prefab 文件完整性",
    ],
    [
      'List assets matching glob pattern',
      "列出匹配 glob 模式的资源",
    ],
    [
      "Get asset metadata (type, uuid, path, importer)",
      "获取资源元数据（type、uuid、path、importer）",
    ],
    [
      "Create new asset file",
      "创建新的资源文件",
    ],
    [
      "Use null content for folders/binary",
      "对于文件夹或二进制资源，请使用 null 作为 content",
    ],
    [
      "NEVER create .spriteframe/.texture files — these are auto-generated sub-assets from image imports",
      "不要手动创建 .spriteframe/.texture 文件，它们会在图片导入时自动生成",
    ],
    [
      "Overwrite existing asset content",
      "覆盖已有资源内容",
    ],
    [
      "Delete an asset permanently",
      "永久删除资源",
    ],
    [
      "Move/rename asset to new path",
      "将资源移动或重命名到新路径",
    ],
    [
      "Duplicate asset to new path",
      "将资源复制到新路径",
    ],
    [
      "Rename asset file (same directory)",
      "重命名资源文件（同目录）",
    ],
    [
      "Create folder in asset database",
      "在资源数据库中创建文件夹",
    ],
    [
      "Import external file",
      "导入外部文件",
    ],
    [
      "Open asset in default editor/viewer",
      "在默认编辑器或查看器中打开资源",
    ],
    [
      "Refresh asset database (specific folder or entire db)",
      "刷新资源数据库（指定文件夹或整个资源库）",
    ],
    [
      "Convert asset UUID to db:// URL",
      "将资源 UUID 转换为 db:// URL",
    ],
    [
      "Convert db:// URL to UUID",
      "将 db:// URL 转换为 UUID",
    ],
    [
      "Get full .meta file content as JSON",
      "获取完整 .meta 文件内容，并以 JSON 返回",
    ],
    [
      "Modify a .meta property",
      "修改 .meta 属性",
    ],
    [
      "Save current scene",
      "保存当前场景",
    ],
    [
      "Pass force=true to show Save As dialog for untitled scenes",
      "对于未命名场景，可传入 force=true 以弹出另存为对话框",
    ],
    [
      "Open a scene by UUID or db:// URL",
      "通过 UUID 或 db:// URL 打开场景",
    ],
    [
      "Create a new empty scene",
      "创建一个新的空场景",
    ],
    [
      "Undo last operation",
      "撤销上一步操作",
    ],
    [
      "Redo last undone operation",
      "重做上一步被撤销的操作",
    ],
    [
      "Get project name, path, engine version",
      "获取项目名称、路径和引擎版本",
    ],
    [
      "Start project build",
      "开始构建项目",
    ],
    [
      "Get build configuration and available platforms",
      "获取构建配置和可用平台",
    ],
    [
      "Open preview in browser",
      "在浏览器中打开预览",
    ],
    [
      "Refresh preview",
      "刷新预览",
    ],
    [
      "Focus editor camera on a node",
      "将编辑器相机聚焦到指定节点",
    ],
    [
      "Write message to console",
      "向控制台写入消息",
    ],
    [
      "Clear console output",
      "清空控制台输出",
    ],
    [
      "Write notification to console (non-blocking, no modal dialog)",
      "向控制台写入通知（非阻塞、无模态对话框）",
    ],
    [
      "Enter play/preview mode",
      "进入播放/预览模式",
    ],
    [
      "Create and attach an AnimationClip, optionally save as asset",
      "创建并挂载 AnimationClip，可选保存为资源",
    ],
    [
      "Start playing an animation clip",
      "开始播放动画 clip",
    ],
    [
      "Pause current animation",
      "暂停当前动画",
    ],
    [
      "Resume paused animation",
      "继续播放已暂停的动画",
    ],
    [
      "Stop and reset animation to beginning",
      "停止动画并将时间重置到起点",
    ],
    [
      "Get current animation state (playing, paused, current clip, time)",
      "获取当前动画状态（playing、paused、current clip、time）",
    ],
    [
      "List all animation clips on a node",
      "列出节点上的全部动画 clip",
    ],
    [
      "Seek animation to a specific time",
      "将动画跳转到指定时间",
    ],
    [
      "Set animation playback speed (1.0 = normal)",
      "设置动画播放速度（1.0 为正常速度）",
    ],
    [
      "Crossfade to another animation clip",
      "淡入淡出切换到另一个动画 clip",
    ],
    [
      "Get all collider and rigidbody details on a node",
      "获取节点上的全部碰撞体和刚体详情",
    ],
    [
      "Add a collider component",
      "添加碰撞体组件",
    ],
    [
      "Set physics material properties on collider",
      "设置碰撞体上的物理材质属性",
    ],
    [
      "Set the collision group/layer of a collider",
      "设置碰撞体的碰撞分组或层级",
    ],
    [
      "Get current physics world configuration (gravity, timestep, etc.)",
      "获取当前物理世界配置（gravity、timestep 等）",
    ],
    [
      "Configure physics world",
      "配置物理世界",
    ],
    [
      "Add a 2D physics joint",
      "添加一个 2D 物理关节",
    ],
    [
      "Read a preference value",
      "读取偏好设置值",
    ],
    [
      "Write a preference value",
      "写入偏好设置值",
    ],
    [
      "List all available preferences with scope info",
      "列出全部可用偏好设置及其作用域信息",
    ],
    [
      "Shortcut: read from global scope",
      "快捷方式：从全局作用域读取",
    ],
    [
      "Shortcut: write to global scope",
      "快捷方式：写入全局作用域",
    ],
    [
      "Shortcut: read from project scope",
      "快捷方式：从项目作用域读取",
    ],
    [
      "Shortcut: write to project scope",
      "快捷方式：写入项目作用域",
    ],
    [
      "Get new events since a timestamp",
      "获取某个时间戳之后的新事件",
    ],
    [
      "If omitted, returns all recent events",
      "如果省略参数，则返回最近的全部事件",
    ],
    [
      "Get recent N events",
      "获取最近 N 条事件",
    ],
    [
      "Clear the event queue",
      "清空事件队列",
    ],
    [
      "Broadcast a custom message to all listeners",
      "向全部监听器广播自定义消息",
    ],
    [
      "Send a raw Editor IPC broadcast message",
      "发送一条原始 Editor IPC 广播消息",
    ],
    [
      "List all registered tools with enabled/disabled status and action counts",
      "列出所有已注册工具，以及启用/禁用状态和 action 数量",
    ],
    [
      "Enable a previously disabled tool",
      "启用一个此前被禁用的工具",
    ],
    [
      "Disable a tool (it won't appear in tool listings)",
      "禁用一个工具（禁用后不会出现在工具列表中）",
    ],
    [
      "Get overall tool statistics (total tools, total actions, enabled/disabled counts)",
      "获取整体工具统计信息（工具总数、action 总数、启用/禁用数量）",
    ],
    [
      "Check the Cocos Creator MCP bridge connection status, editor version, capabilities, and environment info",
      "检查 Cocos Creator MCP bridge 的连接状态、编辑器版本、能力集和环境信息",
    ],
  ]);

  if (exactMap.has(sentence)) {
    return exactMap.get(sentence);
  }

  let translated = sentence.trim();
  const phraseReplacements = [
    ["returns {ready, isComponent}", "返回 {ready, isComponent}"],
    ["returns {clonedUuid}", "返回 {clonedUuid}"],
    ["via camera", "通过相机"],
    ["with detail", "并附带详情"],
    ["with scope info", "并附带作用域信息"],
    ["with color, illuminance/luminance, range, shadow settings, position/rotation", "包含 color、illuminance/luminance、range、shadow 设置、position/rotation"],
    ["with size/offset/type + RigidBody info", "包含 size/offset/type 以及 RigidBody 信息"],
    ["including custom", "包含自定义组件"],
    ["scene tree", "场景树"],
    ["scene statistics", "场景统计信息"],
    ["scene environment settings", "场景环境设置"],
    ["scene-level global settings", "场景级全局设置"],
    ["scene state", "场景状态"],
    ["scene", "场景"],
    ["node list", "节点列表"],
    ["node info", "节点信息"],
    ["node", "节点"],
    ["nodes", "节点"],
    ["components", "组件"],
    ["component", "组件"],
    ["property value", "属性值"],
    ["property", "属性"],
    ["camera component info", "相机组件信息"],
    ["world position", "世界坐标"],
    ["world-space position", "世界坐标"],
    ["world-space rotation", "世界空间旋转"],
    ["world-space scale", "世界空间缩放"],
    ["screen coordinates", "屏幕坐标"],
    ["Animation component state", "Animation 组件状态"],
    ["animation clip", "动画 clip"],
    ["animation clips", "动画 clips"],
    ["animation", "动画"],
    ["asset database", "资源数据库"],
    ["asset metadata", "资源元数据"],
    ["asset", "资源"],
    ["assets", "资源"],
    ["prefab asset", "prefab 资源"],
    ["prefab file integrity", "prefab 文件完整性"],
    ["prefab editing mode", "预制体编辑模式"],
    ["preference value", "偏好设置值"],
    ["preference", "偏好设置"],
    ["event queue", "事件队列"],
    ["event", "事件"],
    ["tool statistics", "工具统计信息"],
    ["tool", "工具"],
    ["tools", "工具"],
  ];

  const verbReplacements = [
    [/^Returns?\s+/i, "返回"],
    [/^Get\s+/i, "获取"],
    [/^List\s+/i, "列出"],
    [/^Check\s+/i, "检查"],
    [/^Find\s+/i, "查找"],
    [/^Read\s+/i, "读取"],
    [/^Create\s+/i, "创建"],
    [/^Delete\s+/i, "删除"],
    [/^Move\/rename\s+/i, "移动或重命名"],
    [/^Move\s+/i, "移动"],
    [/^Duplicate\s+/i, "复制"],
    [/^Open\s+/i, "打开"],
    [/^Refresh\s+/i, "刷新"],
    [/^Convert\s+/i, "转换"],
    [/^Export\s+/i, "导出"],
    [/^Measure\s+/i, "测量"],
    [/^Analyze\s+/i, "分析"],
    [/^Detect\s+/i, "检测"],
    [/^Run\s+/i, "执行"],
    [/^Start\s+/i, "开始"],
    [/^Pause\s+/i, "暂停"],
    [/^Resume\s+/i, "继续"],
    [/^Stop\s+/i, "停止"],
    [/^Focus\s+/i, "聚焦"],
    [/^Write\s+/i, "写入"],
    [/^Enable\/disable\s+/i, "启用或禁用"],
    [/^Enable\s+/i, "启用"],
    [/^Disable\s+/i, "禁用"],
    [/^Broadcast\s+/i, "广播"],
    [/^Send\s+/i, "发送"],
  ];

  translated = replaceAllOrdered(translated, phraseReplacements);
  for (const [pattern, replacement] of verbReplacements) {
    translated = translated.replace(pattern, replacement);
  }

  translated = translated
    .replace(/\bIf omitted\b/g, "如果省略参数")
    .replace(/\bIf uuid omitted\b/g, "如果省略 uuid")
    .replace(/\bIf uuid specified\b/g, "如果传入 uuid")
    .replace(/\bIf component specified\b/g, "如果传入 component")
    .replace(/\bBy default\b/g, "默认")
    .replace(/\bNEVER\b/g, "不要")
    .replace(/\s+/g, " ")
    .trim();

  return translated;
}

function translateActionText(text) {
  if (!text) {
    return "";
  }

  const trimmed = text.trim().replace(/\.+$/, "");
  if (!trimmed) {
    return "";
  }

  const exactMap = new Map([
    [
      'layer(REQUIRED, bitmask value e.g. 1=DEFAULT, 33554432=UI_2D). Find all nodes matching a layer. exact(optional, default true)',
      "layer（必填，位掩码值，例如 1=DEFAULT、33554432=UI_2D）。查找匹配指定 layer 的所有节点。exact（可选，默认 true）。",
    ],
    [
      'uuid(REQUIRED), component(REQUIRED, e.g. "Sprite","Label","RigidBody2D"). Add component',
      'uuid（必填），component（必填，例如 "Sprite"、"Label"、"RigidBody2D"）。添加组件。',
    ],
    [
      'uuid(REQUIRED), savePath(recommended, e.g. "db://assets/prefabs/X.prefab")',
      'uuid（必填），savePath（推荐，例如 "db://assets/prefabs/X.prefab"）。',
    ],
    [
      'url(REQUIRED, e.g. "db://assets/prefabs"). Create folder in asset database',
      'url（必填，例如 "db://assets/prefabs"）。在资源数据库中创建文件夹。',
    ],
    [
      'type(REQUIRED, e.g. "cc.ImageAsset", "cc.Prefab"), pattern(optional)',
      'type（必填，例如 "cc.ImageAsset"、"cc.Prefab"），pattern（可选）。',
    ],
  ]);

  if (exactMap.has(trimmed)) {
    return exactMap.get(trimmed);
  }

  const sentences = trimmed
    .split(/(?<!e\.g)\.\s+(?=(?:[A-Z"]|If\b|By\b|Use\b|Pass\b|NEVER\b))/)
    .map((item) => item.trim())
    .filter(Boolean);

  const translated = sentences.map((sentence, index) => {
    if (index === 0 && (/^no params$/i.test(sentence) || /\([^)]+\)/.test(sentence))) {
      return translateParameterSentence(sentence);
    }
    return translateClause(sentence);
  });

  return `${translated.join("。")}。`;
}

function trimTrailingChinesePunctuation(text) {
  return String(text || "").trim().replace(/[。.!！？]+$/g, "").trim();
}

function formatValueForPrompt(value) {
  if (value === null) {
    return "null";
  }

  if (Array.isArray(value) || (value && typeof value === "object")) {
    return JSON.stringify(value);
  }

  return String(value);
}

function classifyScenarioType(item) {
  const inputEntries = Object.entries(item.input || {}).filter(([key]) => key !== "action");
  const note = String(item.note || "").toLowerCase();
  const expected = String(item.expected || "").toLowerCase();
  const title = String(item.title || "").toLowerCase();
  const combined = `${title} ${note} ${expected}`;
  const envHints = [
    "未启动",
    "未加载",
    "断开",
    "插件",
    "编辑器",
    "bridge",
    "连接",
    "econnrefused",
    "环境",
    "启动后",
  ];
  const stateHints = [
    "选中",
    "为空",
    "默认",
    "当前",
    "已存在",
    "不存在",
    "恢复",
    "回退",
    "状态",
    "打开后",
  ];

  if (inputEntries.length) {
    return "参数场景";
  }
  if (envHints.some((hint) => combined.includes(hint))) {
    return "环境场景";
  }
  if (stateHints.some((hint) => combined.includes(hint))) {
    return "状态场景";
  }
  return "通用场景";
}

function firstSentence(text) {
  return trimTrailingChinesePunctuation(String(text || "").split(/[。.!！？]/)[0] || "");
}

function splitChineseSentences(text) {
  return String(text || "")
    .split(/[。.!！？]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function looksLikeParameterSentence(text) {
  return (
    /（(?:必填|可选|推荐)/.test(text) ||
    text === "无参数" ||
    /^[a-zA-Z0-9_./-]+（/.test(text)
  );
}

function buildActionGoal(item, aiDoc) {
  const zhAction = trimTrailingChinesePunctuation(aiDoc.zhActionDescription || "");
  if (zhAction) {
    const sentences = splitChineseSentences(zhAction);
    if (sentences.length > 1 && looksLikeParameterSentence(sentences[0])) {
      return trimTrailingChinesePunctuation(sentences[1]);
    }
    return trimTrailingChinesePunctuation(sentences[0] || zhAction);
  }

  const zhTool = trimTrailingChinesePunctuation(aiDoc.zhToolSummary || "");
  if (zhTool) {
    return firstSentence(zhTool);
  }

  const toolSummarySentence = firstSentence(aiDoc.toolSummary || "");
  if (toolSummarySentence) {
    return trimTrailingChinesePunctuation(translateClause(toolSummarySentence));
  }

  return `执行 ${item.tool}.${item.action}`;
}

function buildScenarioCondition(item, scenarioType) {
  if (item.note) {
    return item.note;
  }

  if (scenarioType === "参数场景") {
    return "使用该参数组合执行一次调用";
  }

  return "无额外前置条件";
}

function describeParameterForNarrative(key, value) {
  if (typeof value === "boolean") {
    return `把 ${key} 设为 ${value}`;
  }

  if (typeof value === "number") {
    return `把 ${key} 设为 ${value}`;
  }

  if (typeof value === "string") {
    if (value.startsWith("<") && value.endsWith(">")) {
      return `将 ${key} 指向 ${value}`;
    }
    return `把 ${key} 设为“${value}”`;
  }

  return `传入 ${key}=${JSON.stringify(value)}`;
}

function buildScenarioNarrative(item, scenarioType, scenarioCondition) {
  if (scenarioCondition && scenarioCondition !== "无额外前置条件") {
    if (scenarioType === "环境场景") {
      return `这个场景通常出现在${scenarioCondition}时。`;
    }
    if (scenarioType === "状态场景") {
      return `这个场景用于验证${scenarioCondition}时系统的返回是否正确。`;
    }
    return `这个场景通常用于${scenarioCondition}。`;
  }

  if (scenarioType === "参数场景") {
    return "这个场景用于验证同一 action 在不同参数组合下的表现。";
  }
  if (scenarioType === "环境场景") {
    return "这个场景用于验证不同编辑器环境或连接状态下的表现。";
  }
  if (scenarioType === "状态场景") {
    return "这个场景用于验证当前对象状态或默认状态下的表现。";
  }
  return "这个场景用于做通用能力验证。";
}

function buildParameterNarrative(item, inputEntries) {
  if (!inputEntries.length) {
    return "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。";
  }

  return `这次请${inputEntries
    .map(([key, value]) => describeParameterForNarrative(key, value))
    .join("，")}。`;
}

function buildNaturalLanguageSpec(item, aiDoc) {
  const inputEntries = Object.entries(item.input || {}).filter(([key]) => key !== "action");
  const inputText = inputEntries.length
    ? inputEntries.map(([key, value]) => `${key}=${formatValueForPrompt(value)}`).join("；")
    : "无额外参数";
  const fullPayload = Object.keys(item.input || {}).length
    ? JSON.stringify(item.input)
    : "{}";

  const scenarioType = classifyScenarioType(item);
  const actionGoal = buildActionGoal(item, aiDoc);
  const scenarioTitle = trimTrailingChinesePunctuation(item.title || "未命名场景");
  const scenarioCondition = trimTrailingChinesePunctuation(buildScenarioCondition(item, scenarioType));
  const scenarioNarrative = buildScenarioNarrative(item, scenarioType, scenarioCondition);
  const parameterNarrative = buildParameterNarrative(item, inputEntries);
  const expectedText = trimTrailingChinesePunctuation(item.expected || "结果与 action 描述一致");
  const executionStep = `调用 ${item.tool}.${item.action}`;
  const mcpCall = `${item.tool}.${item.action}`;
  const verificationFocus = expectedText;
  const aiInstruction =
    `请通过 MCP 调用 ${item.tool} 工具，执行 ${item.action} 动作，处理“${scenarioTitle}”这个${scenarioType}。`
    + `${scenarioNarrative}`
    + `${parameterNarrative}`
    + `调用完成后重点检查：${verificationFocus}。`;

  return {
    aiInstruction,
    actionGoal,
    scenarioType,
    scenarioTitle,
    scenarioCondition,
    scenarioNarrative,
    mcpCall,
    fullPayload,
    inputText,
    executionStep,
    parameterNarrative,
    verificationFocus,
    expectedText,
  };
}

function buildNaturalLanguageTestCase(spec) {
  return spec.aiInstruction;
}

function buildData() {
  const cases = readJson(casesPath);
  const report = readJson(reportPath);
  const aiBaseline = buildAiBaseline(report);
  const toolDescriptionIndex = buildToolDescriptionIndex();

  const enrichedCases = cases.map((item) => {
    const baseline = aiBaseline.get(item.id) || {
      status: "pending",
      duration: "",
      note: "",
    };
    const toolDoc = toolDescriptionIndex.get(item.tool);
    const actionDescription = toolDoc?.actionDescriptions?.[item.action] || "";
    const zhToolSummary = translateToolSummary(toolDoc?.toolSummary || "");
    const zhActionDescription = translateActionText(actionDescription);
    const aiDoc = {
      toolSummary: toolDoc?.toolSummary || "",
      zhToolSummary,
      actionDescription,
      zhActionDescription,
      sourceFile: toolDoc?.sourceFile || "",
      matched: Boolean(actionDescription),
      toolFound: Boolean(toolDoc),
    };
    let naturalLanguageSpec = buildNaturalLanguageSpec(item, aiDoc);
    if (Array.isArray(item.setupSteps) && item.setupSteps.length > 0) {
      const hint =
        " 注意：本用例包含「建议前置步骤（MCP）」——请先在页面该区块按顺序执行，再执行下方「请求输入」主调用。";
      naturalLanguageSpec = { ...naturalLanguageSpec, aiInstruction: naturalLanguageSpec.aiInstruction + hint };
    }

    const manualVerification = item.manualVerification || "";
    const manualBaseline = {
      status: "pending",
      note: manualVerification,
    };
    if (manualVerification.startsWith("通过")) {
      manualBaseline.status = "pass";
    } else if (manualVerification.startsWith("失败")) {
      manualBaseline.status = "fail";
    } else if (manualVerification.startsWith("阻塞")) {
      manualBaseline.status = "blocked";
    } else if (manualVerification.startsWith("存疑")) {
      manualBaseline.status = "uncertain";
    }

    return {
      id: item.id,
      tool: item.tool,
      action: item.action,
      title: item.title,
      input: item.input || {},
      expected: item.expected || "",
      note: item.note || "",
      /** 与 interactive-test-plan.app.js 对齐：页面「前置条件」「建议前置步骤」来自 test-cases.json */
      prerequisites: item.prerequisites || "",
      setupSteps: Array.isArray(item.setupSteps) ? item.setupSteps : [],
      phase: derivePhase(item.tool),
      priority: derivePriority(item.tool),
      edition: deriveEdition(item.tool, Boolean(actionDescription)),
      aiDoc: {
        ...aiDoc,
        naturalLanguageSpec,
        naturalLanguageTest: buildNaturalLanguageTestCase(naturalLanguageSpec),
      },
      aiBaseline: baseline,
      manualBaseline,
      needsRetest: item.needsRetest || false,
      retestReason: item.retestReason || "",
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
