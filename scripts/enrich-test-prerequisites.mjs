/**
 * 为 tests/test-cases.json 批量补充 prerequisites / setupSteps（占位符解析步骤），
 * 并根据已有 manualVerification 推断 needsRetest + retestReason。
 *
 * 用法: node scripts/enrich-test-prerequisites.mjs
 * 会覆盖写入 tests/test-cases.json（建议先 git diff 检查）。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const testsPath = path.join(root, "tests", "test-cases.json");

function str(c) {
  return JSON.stringify(c.input || {});
}

function hasAnglePlaceholder(c) {
  return /<[^>]+>/.test(str(c));
}

const PRO_TOOLS = new Set([
  "engine_action",
  "reference_image",
  "script_scaffold",
  "animation_workflow",
  "ui_generator",
  "project_linter",
  "operation_log",
]);

function proPrefix(tool) {
  return PRO_TOOLS.has(tool)
    ? "Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。"
    : "";
}

function genericUuidLine(c) {
  if (!hasAnglePlaceholder(c)) return "";
  return "将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。";
}

function stepResolvePlaceholders() {
  return {
    step: 1,
    description:
      "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    tool: "scene_query",
    action: "list",
    input: { action: "list" },
  };
}

function inferPrerequisites(c) {
  const { tool, action, title, expected, note, id } = c;
  const input = c.input || {};
  const s = str(c).toLowerCase();
  const pp = proPrefix(tool);
  const gu = genericUuidLine(c);

  const join = (parts) =>
    [pp, ...parts.filter(Boolean), gu || ""].filter(Boolean).join(" ");

  if (tool === "bridge_status") {
    return join([
      "无场景对象前置；需编辑器内插件已加载、HTTP MCP 可达且 Token 有效。",
      id === 2 ? "本条为「桥接断开」预期：须在编辑器未启动或未加载插件时测，或临时关闭服务。" : "",
    ]);
  }

  if (tool === "scene_query") {
    if (action === "tree" && /空场景/.test(title || "")) {
      return join([
        "需使用空场景或仅含 Scene 根的测试工程；切换场景前请保存。",
      ]);
    }
    if (action === "tree" || action === "list" || action === "stats") {
      if (!hasAnglePlaceholder(c)) {
        return join(["需当前有已打开的活动场景（默认场景即可）。"]);
      }
    }
    if (action === "find_by_path") {
      return join([
        "路径需对应场景中真实节点层级；测正向结果时需存在 Canvas/Panel 等 UI 链（可先 scene_operation 创建）。",
        /Canvas|Button|Panel/.test(str(c)) ? "若当前场景无 UI 层级，仅能得到「路径未找到」类错误，正向请在 UI 场景复测。" : "",
      ]);
    }
    if (action === "get_component_property" || action === "get_node_components_properties") {
      return join([
        "目标节点须已挂载用例中 component 指明的组件；否则仅能测错误分支。",
        /Label|Sprite|Button|RichText|ScrollView/.test(str(c))
          ? "若场景无该组件，请按同文件中带 setupSteps 的模板或 scene_operation.add_component 先创建。"
          : "",
      ]);
    }
    if (
      action === "find_nodes_by_name" ||
      action === "find_nodes_by_component" ||
      action === "find_nodes_by_layer"
    ) {
      return join([
        "正向「找到匹配项」类结果需场景中确实存在对应名称/组件/层；仅 count=0 时可能只验证了空集分支。",
      ]);
    }
    if (hasAnglePlaceholder(c)) {
      return join(["需有效节点或资源 UUID（见占位符说明）。"]);
    }
    return join(["需当前活动场景可查询。"]);
  }

  if (tool === "scene_operation") {
    return join([
      "改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。",
      /Canvas|UI|Label|Sprite|Button|Widget/.test(str(c)) ? "2D UI 相关操作通常需 Canvas 与 UI_2D 层；无 Canvas 时先 ensure_2d_canvas。" : "",
    ]);
  }

  if (tool === "asset_operation") {
    return join([
      "路径需落在项目 assets 下且资源可访问；删除/覆盖类操作前确认可丢弃；URL 导入需网络可达。",
    ]);
  }

  if (tool === "editor_action") {
    return join(["需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。"]);
  }

  if (tool === "preferences" || tool === "broadcast" || tool === "tool_management") {
    return join(["插件已加载；写偏好/广播可能影响本地配置，测试后可视需要还原。"]);
  }

  if (tool === "execute_script" || tool === "register_custom_macro") {
    return join(["需目标脚本/宏在工程内存在或路径有效；在沙箱策略允许时执行。"]);
  }

  if (tool === "animation_tool" || tool === "animation_workflow") {
    return join(["需目标节点存在且可挂 Animation/AnimationClip；复杂链建议先 scene_query 确认 uuid。"]);
  }

  if (tool === "physics_tool") {
    return join(["需场景中具备刚体/碰撞体等物理前置；2D/3D 与项目设置一致。"]);
  }

  if (tool === "create_prefab_atomic" || tool === "import_and_apply_texture" || tool === "create_tween_animation_atomic") {
    return join(["原子宏依赖目标节点与资源路径；纹理/预制体路径需存在或可创建。"]);
  }

  if (tool === "auto_fit_physics_collider") {
    return join(["目标节点须有 Sprite/UITransform 等宏所需组件；否则走错误或降级分支。"]);
  }

  if (tool === "reference_image") {
    return join(["参考图路径或剪贴板图像需可用；依赖 Pro。"]);
  }

  return join(["按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。"]);
}

function positiveExpectationForRetest(c) {
  const e = (c.expected || "") + (c.title || "");
  if (/无匹配|无效|缺少|错误|不存在|失败|断开|空场景(?![^。]*根)/.test(c.title || "")) return false;
  if (/错误|空数组|ECONNREFUSED|未找到.*路径|count:0.*期望/.test(c.expected || "")) return false;
  return /返回所有|返回挂|返回含|返回 \{value|返回 spriteFrame|返回.*节点/.test(e);
}

function inferRetest(c) {
  const mv = c.manualVerification;
  if (!mv || typeof mv !== "string") {
    return { needsRetest: false, retestReason: "" };
  }
  const t = mv.trim();

  if (/^待前置|^待.*前置/.test(t)) {
    return { needsRetest: true, retestReason: "须完成前置步骤后按主用例重测。" };
  }

  if (/^(失败|阻塞|存疑)/.test(t)) {
    return { needsRetest: false, retestReason: "" };
  }

  if (
    /复测|替代|部分不一致|略有差异|正向.*请|需在含|环境前提|用例示例为.*当前|属环境/.test(t)
  ) {
    return {
      needsRetest: true,
      retestReason: "此前结论为环境/替代/与文档或示例不完全一致；请在完整前置下复测以严格符合预期。",
    };
  }

  if (
    t.startsWith("通过") &&
    positiveExpectationForRetest(c) &&
    /当前场景无|当前工程无|当前无.*节点|当前测试场景无|count:0|无该名称|无该脚本|无该层/.test(t)
  ) {
    return {
      needsRetest: true,
      retestReason:
        "此前在目标实体不存在或查询为空时仅验证接口/结构；若期望为正向数据，请在满足前置（节点/组件/资源存在）后复测。",
    };
  }

  return { needsRetest: false, retestReason: "" };
}

function shouldAddGenericSetup(c) {
  if (Array.isArray(c.setupSteps) && c.setupSteps.length > 0) return false;
  if (!hasAnglePlaceholder(c)) return false;
  const t = `${c.tool}`;
  return (
    t === "scene_query" ||
    t === "scene_operation" ||
    t === "animation_tool" ||
    t === "physics_tool" ||
    t === "create_prefab_atomic" ||
    t === "import_and_apply_texture" ||
    t === "create_tween_animation_atomic" ||
    t === "auto_fit_physics_collider" ||
    t === "reference_image"
  );
}

function main() {
  const raw = fs.readFileSync(testsPath, "utf8");
  const cases = JSON.parse(raw);

  let nPre = 0;
  let nSetup = 0;
  let nRetest = 0;

  for (const c of cases) {
    const prereq = inferPrerequisites(c);
    if (!c.prerequisites || !String(c.prerequisites).trim()) {
      c.prerequisites = prereq;
      nPre += 1;
    }

    if (!Array.isArray(c.setupSteps)) {
      c.setupSteps = [];
    }

    if (shouldAddGenericSetup(c)) {
      c.setupSteps = [stepResolvePlaceholders(), ...c.setupSteps];
      nSetup += 1;
    }

    const { needsRetest, retestReason } = inferRetest(c);
    c.needsRetest = needsRetest;
    if (needsRetest && retestReason) {
      c.retestReason = retestReason;
      nRetest += 1;
    } else {
      delete c.retestReason;
    }
  }

  fs.writeFileSync(testsPath, `${JSON.stringify(cases, null, 2)}\n`, "utf8");
  console.log(`[enrich-test-prerequisites] wrote ${testsPath}`);
  console.log(`  prerequisites filled/updated where empty: ${nPre} (all cases now have text)`);
  console.log(`  generic setupSteps prepended: ${nSetup}`);
  console.log(`  needsRetest=true: ${nRetest}`);
}

main();
