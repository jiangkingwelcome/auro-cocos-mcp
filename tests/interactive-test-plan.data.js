window.AURO_INTERACTIVE_TEST_PLAN_DATA = {
  "generatedAt": "2026-03-25T13:30:27.400Z",
  "project": {
    "name": "Aura for Cocos Creator",
    "repoRelativeCasesPath": "tests/test-cases.json",
    "repoRelativeReportPath": "tests/test-report.json",
    "totalCases": 378
  },
  "plan": {
    "goals": [
      "覆盖现有 378 条 MCP/插件能力测试用例，形成可持续回归基线。",
      "保留 AI 自动化结果，同时补充人工验证结论，避免只测接口不测真实编辑器交互。",
      "把失败项、阻塞项、复测结果收敛到同一页面，便于发布前做 Go / No-Go 判断。"
    ],
    "stages": [
      "阶段 1：环境准备与冒烟检查",
      "阶段 2：AI 自动化回归与失败项筛查",
      "阶段 3：人工交互验证与体验确认",
      "阶段 4：问题复测、关闭与发布结论"
    ],
    "exitCriteria": [
      "P0 / P1 用例不存在未确认失败。",
      "人工关键路径冒烟项全部完成。",
      "所有已记录问题具备状态、责任人或复测结论。"
    ],
    "checklist": [
      {
        "id": "prep-editor",
        "title": "确认测试环境",
        "description": "Cocos Creator、目标项目、插件版本、Token、端口、网络与权限已就绪。"
      },
      {
        "id": "run-unit",
        "title": "执行基础自动化",
        "description": "完成 npm run test / 覆盖率 / 关键集成脚本，记录当前基线结果。"
      },
      {
        "id": "review-ai",
        "title": "处理 AI 失败项",
        "description": "对自动化失败或未覆盖项进行人工确认，判断是真缺陷、环境问题还是用例过期。"
      },
      {
        "id": "manual-smoke",
        "title": "完成人工冒烟",
        "description": "验证启动、连接、面板、核心场景改写、资源操作、构建与动画等关键链路。"
      },
      {
        "id": "retest-close",
        "title": "复测并出结论",
        "description": "对已修复问题做回归，填写 Go / Conditional Go / No-Go 结论。"
      }
    ]
  },
  "summaries": {
    "phases": [
      {
        "key": "编辑器联动",
        "count": 53
      },
      {
        "key": "动画工作流",
        "count": 26
      },
      {
        "key": "核心改写",
        "count": 112
      },
      {
        "key": "环境与连通",
        "count": 26
      },
      {
        "key": "物理工作流",
        "count": 12
      },
      {
        "key": "引擎专项",
        "count": 9
      },
      {
        "key": "只读查询",
        "count": 69
      },
      {
        "key": "质量与诊断",
        "count": 9
      },
      {
        "key": "资产与脚本",
        "count": 46
      },
      {
        "key": "UI 与参考图",
        "count": 16
      }
    ],
    "tools": [
      {
        "key": "animation_tool",
        "count": 11
      },
      {
        "key": "animation_workflow",
        "count": 15
      },
      {
        "key": "asset_operation",
        "count": 33
      },
      {
        "key": "auto_fit_physics_collider",
        "count": 3
      },
      {
        "key": "bridge_status",
        "count": 2
      },
      {
        "key": "broadcast",
        "count": 5
      },
      {
        "key": "create_prefab_atomic",
        "count": 2
      },
      {
        "key": "create_tween_animation_atomic",
        "count": 2
      },
      {
        "key": "editor_action",
        "count": 48
      },
      {
        "key": "engine_action",
        "count": 9
      },
      {
        "key": "execute_script",
        "count": 2
      },
      {
        "key": "import_and_apply_texture",
        "count": 2
      },
      {
        "key": "operation_log",
        "count": 13
      },
      {
        "key": "physics_tool",
        "count": 12
      },
      {
        "key": "preferences",
        "count": 7
      },
      {
        "key": "project_linter",
        "count": 9
      },
      {
        "key": "reference_image",
        "count": 7
      },
      {
        "key": "register_custom_macro",
        "count": 2
      },
      {
        "key": "scene_operation",
        "count": 103
      },
      {
        "key": "scene_query",
        "count": 69
      },
      {
        "key": "script_scaffold",
        "count": 9
      },
      {
        "key": "tool_management",
        "count": 4
      },
      {
        "key": "ui_generator",
        "count": 9
      }
    ],
    "editions": [
      {
        "key": "community",
        "count": 307
      },
      {
        "key": "pro",
        "count": 71
      }
    ],
    "aiBaseline": {
      "pass": 223,
      "fail": 155,
      "blocked": 0,
      "pending": 0
    }
  },
  "cases": [
    {
      "id": 1,
      "tool": "bridge_status",
      "action": "bridge_status",
      "title": "基本连通性检查",
      "input": {},
      "expected": "返回 {connected:true, version:\"3.8.x\", uptime, port}",
      "note": "启动后第一步调用",
      "phase": "环境与连通",
      "priority": "P0",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Check the Cocos Creator MCP bridge connection status, editor version, capabilities, and environment info. ALWAYS call this first to verify the bridge is alive and check version capabilities before performing other operations. Returns: {connected:true, editorVersion, capabilities:{versionTier, supportedFeatures:{...}, aiRulesVersion, warnings}, uptime, port} on success. capabilities.versionTier: \"full\" (>=3.8), \"supported\" (3.6-3.7), \"best-effort\" (3.4-3.5), \"unsupported\" (<3.4). capabilities.supportedFeatures: boolean map of available APIs — check before calling version-dependent features. capabilities.aiRulesVersion: current AI Rules version for cache invalidation.",
        "zhToolSummary": "检查 Cocos Creator MCP bridge 的连接状态、编辑器版本、能力集和环境信息。ALWAYS call this first to verify the bridge is alive and check version capabilities before performing other operations。Returns: {connected:true, editorVersion, capabilities:{versionTier, supportedFeatures:{...}, aiRulesVersion, warnings}, uptime, port} on success. capabilities.versionTier: \"full\" (>=3.8), \"supported\" (3.6-3.7), \"best-effort\" (3.4-3.5), \"unsupported\" (<3.4). capabilities.supportedFeatures: boolean map of available APIs — check before calling version-dependent features. capabilities.aiRulesVersion: current AI Rules version for cache invalidation。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 bridge_status 工具，执行 bridge_status 动作，处理“基本连通性检查”这个环境场景。这个场景通常出现在启动后第一步调用时。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {connected:true, version:\"3.8.x\", uptime, port}。",
          "actionGoal": "检查 Cocos Creator MCP bridge 的连接状态、编辑器版本、能力集和环境信息",
          "scenarioType": "环境场景",
          "scenarioTitle": "基本连通性检查",
          "scenarioCondition": "启动后第一步调用",
          "scenarioNarrative": "这个场景通常出现在启动后第一步调用时。",
          "mcpCall": "bridge_status.bridge_status",
          "fullPayload": "{}",
          "inputText": "无额外参数",
          "executionStep": "调用 bridge_status.bridge_status",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回 {connected:true, version:\"3.8.x\", uptime, port}",
          "expectedText": "返回 {connected:true, version:\"3.8.x\", uptime, port}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 bridge_status 工具，执行 bridge_status 动作，处理“基本连通性检查”这个环境场景。这个场景通常出现在启动后第一步调用时。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {connected:true, version:\"3.8.x\", uptime, port}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 44,
        "note": "来自 tests/test-report.json，自动化执行通过（44ms）"
      }
    },
    {
      "id": 2,
      "tool": "bridge_status",
      "action": "bridge_status",
      "title": "桥接断开",
      "input": {},
      "expected": "返回 {connected:false, error:\"ECONNREFUSED\"}",
      "note": "编辑器未启动或插件未加载",
      "phase": "环境与连通",
      "priority": "P0",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Check the Cocos Creator MCP bridge connection status, editor version, capabilities, and environment info. ALWAYS call this first to verify the bridge is alive and check version capabilities before performing other operations. Returns: {connected:true, editorVersion, capabilities:{versionTier, supportedFeatures:{...}, aiRulesVersion, warnings}, uptime, port} on success. capabilities.versionTier: \"full\" (>=3.8), \"supported\" (3.6-3.7), \"best-effort\" (3.4-3.5), \"unsupported\" (<3.4). capabilities.supportedFeatures: boolean map of available APIs — check before calling version-dependent features. capabilities.aiRulesVersion: current AI Rules version for cache invalidation.",
        "zhToolSummary": "检查 Cocos Creator MCP bridge 的连接状态、编辑器版本、能力集和环境信息。ALWAYS call this first to verify the bridge is alive and check version capabilities before performing other operations。Returns: {connected:true, editorVersion, capabilities:{versionTier, supportedFeatures:{...}, aiRulesVersion, warnings}, uptime, port} on success. capabilities.versionTier: \"full\" (>=3.8), \"supported\" (3.6-3.7), \"best-effort\" (3.4-3.5), \"unsupported\" (<3.4). capabilities.supportedFeatures: boolean map of available APIs — check before calling version-dependent features. capabilities.aiRulesVersion: current AI Rules version for cache invalidation。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 bridge_status 工具，执行 bridge_status 动作，处理“桥接断开”这个环境场景。这个场景通常出现在编辑器未启动或插件未加载时。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {connected:false, error:\"ECONNREFUSED\"}。",
          "actionGoal": "检查 Cocos Creator MCP bridge 的连接状态、编辑器版本、能力集和环境信息",
          "scenarioType": "环境场景",
          "scenarioTitle": "桥接断开",
          "scenarioCondition": "编辑器未启动或插件未加载",
          "scenarioNarrative": "这个场景通常出现在编辑器未启动或插件未加载时。",
          "mcpCall": "bridge_status.bridge_status",
          "fullPayload": "{}",
          "inputText": "无额外参数",
          "executionStep": "调用 bridge_status.bridge_status",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回 {connected:false, error:\"ECONNREFUSED\"}",
          "expectedText": "返回 {connected:false, error:\"ECONNREFUSED\"}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 bridge_status 工具，执行 bridge_status 动作，处理“桥接断开”这个环境场景。这个场景通常出现在编辑器未启动或插件未加载时。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {connected:false, error:\"ECONNREFUSED\"}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 20,
        "note": "来自 tests/test-report.json，自动化执行通过（20ms）"
      }
    },
    {
      "id": 3,
      "tool": "scene_query",
      "action": "tree",
      "title": "获取默认场景树",
      "input": {
        "action": "tree"
      },
      "expected": "返回过滤隐藏节点的层级树 {name,uuid,children[]}",
      "note": "默认 includeInternal=false",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "includeInternal(optional, default false). Returns hierarchical scene tree. By default filters engine-internal hidden nodes (HideInHierarchy) to match editor hierarchy panel.",
        "zhActionDescription": "includeInternal（可选，默认 false）。返回层级场景树。默认会过滤引擎内部隐藏节点（HideInHierarchy），以与编辑器层级面板保持一致。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 tree 动作，处理“获取默认场景树”这个状态场景。这个场景用于验证默认 includeInternal=false时系统的返回是否正确。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回过滤隐藏节点的层级树 {name,uuid,children[]}。",
          "actionGoal": "返回层级场景树",
          "scenarioType": "状态场景",
          "scenarioTitle": "获取默认场景树",
          "scenarioCondition": "默认 includeInternal=false",
          "scenarioNarrative": "这个场景用于验证默认 includeInternal=false时系统的返回是否正确。",
          "mcpCall": "scene_query.tree",
          "fullPayload": "{\"action\":\"tree\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 scene_query.tree",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回过滤隐藏节点的层级树 {name,uuid,children[]}",
          "expectedText": "返回过滤隐藏节点的层级树 {name,uuid,children[]}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 tree 动作，处理“获取默认场景树”这个状态场景。这个场景用于验证默认 includeInternal=false时系统的返回是否正确。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回过滤隐藏节点的层级树 {name,uuid,children[]}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 43,
        "note": "来自 tests/test-report.json，自动化执行通过（43ms）"
      }
    },
    {
      "id": 4,
      "tool": "scene_query",
      "action": "tree",
      "title": "包含内部节点",
      "input": {
        "action": "tree",
        "includeInternal": true
      },
      "expected": "返回含 ScrollView 内部节点、Profiler 节点的完整树",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "includeInternal(optional, default false). Returns hierarchical scene tree. By default filters engine-internal hidden nodes (HideInHierarchy) to match editor hierarchy panel.",
        "zhActionDescription": "includeInternal（可选，默认 false）。返回层级场景树。默认会过滤引擎内部隐藏节点（HideInHierarchy），以与编辑器层级面板保持一致。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 tree 动作，处理“包含内部节点”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 includeInternal 设为 true。调用完成后重点检查：返回含 ScrollView 内部节点、Profiler 节点的完整树。",
          "actionGoal": "返回层级场景树",
          "scenarioType": "参数场景",
          "scenarioTitle": "包含内部节点",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.tree",
          "fullPayload": "{\"action\":\"tree\",\"includeInternal\":true}",
          "inputText": "includeInternal=true",
          "executionStep": "调用 scene_query.tree",
          "parameterNarrative": "这次请把 includeInternal 设为 true。",
          "verificationFocus": "返回含 ScrollView 内部节点、Profiler 节点的完整树",
          "expectedText": "返回含 ScrollView 内部节点、Profiler 节点的完整树"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 tree 动作，处理“包含内部节点”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 includeInternal 设为 true。调用完成后重点检查：返回含 ScrollView 内部节点、Profiler 节点的完整树。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 11,
        "note": "来自 tests/test-report.json，自动化执行通过（11ms）"
      }
    },
    {
      "id": 5,
      "tool": "scene_query",
      "action": "tree",
      "title": "空场景",
      "input": {
        "action": "tree"
      },
      "expected": "返回仅含 Scene 根节点的树",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "includeInternal(optional, default false). Returns hierarchical scene tree. By default filters engine-internal hidden nodes (HideInHierarchy) to match editor hierarchy panel.",
        "zhActionDescription": "includeInternal（可选，默认 false）。返回层级场景树。默认会过滤引擎内部隐藏节点（HideInHierarchy），以与编辑器层级面板保持一致。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 tree 动作，处理“空场景”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回仅含 Scene 根节点的树。",
          "actionGoal": "返回层级场景树",
          "scenarioType": "通用场景",
          "scenarioTitle": "空场景",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "scene_query.tree",
          "fullPayload": "{\"action\":\"tree\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 scene_query.tree",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回仅含 Scene 根节点的树",
          "expectedText": "返回仅含 Scene 根节点的树"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 tree 动作，处理“空场景”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回仅含 Scene 根节点的树。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 6,
        "note": "来自 tests/test-report.json，自动化执行通过（6ms）"
      }
    },
    {
      "id": 6,
      "tool": "scene_query",
      "action": "list",
      "title": "扁平节点列表",
      "input": {
        "action": "list"
      },
      "expected": "返回 [{uuid,name,depth,childCount},...] 数组",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "includeInternal(optional, default false). Returns flat node list with uuid/name/depth/childCount. By default filters hidden nodes.",
        "zhActionDescription": "includeInternal（可选，默认 false）。返回扁平节点列表，包含 uuid/name/depth/childCount。默认会过滤隐藏节点。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 list 动作，处理“扁平节点列表”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 [{uuid,name,depth,childCount},...] 数组。",
          "actionGoal": "返回扁平节点列表，包含 uuid/name/depth/childCount",
          "scenarioType": "通用场景",
          "scenarioTitle": "扁平节点列表",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "scene_query.list",
          "fullPayload": "{\"action\":\"list\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 scene_query.list",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回 [{uuid,name,depth,childCount},...] 数组",
          "expectedText": "返回 [{uuid,name,depth,childCount},...] 数组"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 list 动作，处理“扁平节点列表”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 [{uuid,name,depth,childCount},...] 数组。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 7,
        "note": "来自 tests/test-report.json，自动化执行通过（7ms）"
      }
    },
    {
      "id": 7,
      "tool": "scene_query",
      "action": "list",
      "title": "含内部节点",
      "input": {
        "action": "list",
        "includeInternal": true
      },
      "expected": "结果数量多于默认，包含引擎隐藏节点",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "includeInternal(optional, default false). Returns flat node list with uuid/name/depth/childCount. By default filters hidden nodes.",
        "zhActionDescription": "includeInternal（可选，默认 false）。返回扁平节点列表，包含 uuid/name/depth/childCount。默认会过滤隐藏节点。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 list 动作，处理“含内部节点”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 includeInternal 设为 true。调用完成后重点检查：结果数量多于默认，包含引擎隐藏节点。",
          "actionGoal": "返回扁平节点列表，包含 uuid/name/depth/childCount",
          "scenarioType": "参数场景",
          "scenarioTitle": "含内部节点",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.list",
          "fullPayload": "{\"action\":\"list\",\"includeInternal\":true}",
          "inputText": "includeInternal=true",
          "executionStep": "调用 scene_query.list",
          "parameterNarrative": "这次请把 includeInternal 设为 true。",
          "verificationFocus": "结果数量多于默认，包含引擎隐藏节点",
          "expectedText": "结果数量多于默认，包含引擎隐藏节点"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 list 动作，处理“含内部节点”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 includeInternal 设为 true。调用完成后重点检查：结果数量多于默认，包含引擎隐藏节点。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 32,
        "note": "来自 tests/test-report.json，自动化执行通过（32ms）"
      }
    },
    {
      "id": 8,
      "tool": "scene_query",
      "action": "stats",
      "title": "场景统计",
      "input": {
        "action": "stats"
      },
      "expected": "返回 {nodeCount,activeCount,sceneName,filteredInternalNodes}",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "includeInternal(optional, default false). Returns scene statistics. By default filters hidden nodes, reports filteredInternalNodes count.",
        "zhActionDescription": "includeInternal（可选，默认 false）。返回场景统计信息。默认会过滤隐藏节点，并返回 filteredInternalNodes 计数。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 stats 动作，处理“场景统计”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {nodeCount,activeCount,sceneName,filteredInternalNodes}。",
          "actionGoal": "返回场景统计信息",
          "scenarioType": "通用场景",
          "scenarioTitle": "场景统计",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "scene_query.stats",
          "fullPayload": "{\"action\":\"stats\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 scene_query.stats",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回 {nodeCount,activeCount,sceneName,filteredInternalNodes}",
          "expectedText": "返回 {nodeCount,activeCount,sceneName,filteredInternalNodes}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 stats 动作，处理“场景统计”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {nodeCount,activeCount,sceneName,filteredInternalNodes}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 5,
        "note": "来自 tests/test-report.json，自动化执行通过（5ms）"
      }
    },
    {
      "id": 9,
      "tool": "scene_query",
      "action": "stats",
      "title": "含内部统计",
      "input": {
        "action": "stats",
        "includeInternal": true
      },
      "expected": "nodeCount 包含所有运行时节点",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "includeInternal(optional, default false). Returns scene statistics. By default filters hidden nodes, reports filteredInternalNodes count.",
        "zhActionDescription": "includeInternal（可选，默认 false）。返回场景统计信息。默认会过滤隐藏节点，并返回 filteredInternalNodes 计数。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 stats 动作，处理“含内部统计”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 includeInternal 设为 true。调用完成后重点检查：nodeCount 包含所有运行时节点。",
          "actionGoal": "返回场景统计信息",
          "scenarioType": "参数场景",
          "scenarioTitle": "含内部统计",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.stats",
          "fullPayload": "{\"action\":\"stats\",\"includeInternal\":true}",
          "inputText": "includeInternal=true",
          "executionStep": "调用 scene_query.stats",
          "parameterNarrative": "这次请把 includeInternal 设为 true。",
          "verificationFocus": "nodeCount 包含所有运行时节点",
          "expectedText": "nodeCount 包含所有运行时节点"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 stats 动作，处理“含内部统计”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 includeInternal 设为 true。调用完成后重点检查：nodeCount 包含所有运行时节点。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 7,
        "note": "来自 tests/test-report.json，自动化执行通过（7ms）"
      }
    },
    {
      "id": 10,
      "tool": "scene_query",
      "action": "node_detail",
      "title": "查看节点详情",
      "input": {
        "action": "node_detail",
        "uuid": "<node-uuid>"
      },
      "expected": "返回 {name,position,rotation,scale,components[],active,layer}",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "uuid(REQUIRED). Returns full detail of a single node (position, rotation, scale, components, active, layer).",
        "zhActionDescription": "uuid（必填）。返回单个节点的完整详情，包括 position、rotation、scale、components、active、layer。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 node_detail 动作，处理“查看节点详情”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <node-uuid>。调用完成后重点检查：返回 {name,position,rotation,scale,components[],active,layer}。",
          "actionGoal": "返回单个节点的完整详情，包括 position、rotation、scale、components、active、layer",
          "scenarioType": "参数场景",
          "scenarioTitle": "查看节点详情",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.node_detail",
          "fullPayload": "{\"action\":\"node_detail\",\"uuid\":\"<node-uuid>\"}",
          "inputText": "uuid=<node-uuid>",
          "executionStep": "调用 scene_query.node_detail",
          "parameterNarrative": "这次请将 uuid 指向 <node-uuid>。",
          "verificationFocus": "返回 {name,position,rotation,scale,components[],active,layer}",
          "expectedText": "返回 {name,position,rotation,scale,components[],active,layer}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 node_detail 动作，处理“查看节点详情”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <node-uuid>。调用完成后重点检查：返回 {name,position,rotation,scale,components[],active,layer}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 17,
        "note": "来自 tests/test-report.json，自动化执行通过（17ms）"
      }
    },
    {
      "id": 11,
      "tool": "scene_query",
      "action": "node_detail",
      "title": "无效 UUID",
      "input": {
        "action": "node_detail",
        "uuid": "invalid"
      },
      "expected": "返回 {error:\"未找到节点\"}",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "uuid(REQUIRED). Returns full detail of a single node (position, rotation, scale, components, active, layer).",
        "zhActionDescription": "uuid（必填）。返回单个节点的完整详情，包括 position、rotation、scale、components、active、layer。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 node_detail 动作，处理“无效 UUID”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 uuid 设为“invalid”。调用完成后重点检查：返回 {error:\"未找到节点\"}。",
          "actionGoal": "返回单个节点的完整详情，包括 position、rotation、scale、components、active、layer",
          "scenarioType": "参数场景",
          "scenarioTitle": "无效 UUID",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.node_detail",
          "fullPayload": "{\"action\":\"node_detail\",\"uuid\":\"invalid\"}",
          "inputText": "uuid=invalid",
          "executionStep": "调用 scene_query.node_detail",
          "parameterNarrative": "这次请把 uuid 设为“invalid”。",
          "verificationFocus": "返回 {error:\"未找到节点\"}",
          "expectedText": "返回 {error:\"未找到节点\"}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 node_detail 动作，处理“无效 UUID”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 uuid 设为“invalid”。调用完成后重点检查：返回 {error:\"未找到节点\"}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 5,
        "note": "来自 tests/test-report.json，自动化执行通过（5ms）"
      }
    },
    {
      "id": 12,
      "tool": "scene_query",
      "action": "find_by_path",
      "title": "按路径查找",
      "input": {
        "action": "find_by_path",
        "path": "Canvas/Panel/Button"
      },
      "expected": "返回匹配节点 uuid 和详情",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "path(REQUIRED). Find node by hierarchy path like \"Canvas/Panel/Button\".",
        "zhActionDescription": "path（必填）。按层级路径查找节点，例如 \"Canvas/Panel/Button\"。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 find_by_path 动作，处理“按路径查找”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 path 设为“Canvas/Panel/Button”。调用完成后重点检查：返回匹配节点 uuid 和详情。",
          "actionGoal": "按层级路径查找节点，例如 \"Canvas/Panel/Button\"",
          "scenarioType": "参数场景",
          "scenarioTitle": "按路径查找",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.find_by_path",
          "fullPayload": "{\"action\":\"find_by_path\",\"path\":\"Canvas/Panel/Button\"}",
          "inputText": "path=Canvas/Panel/Button",
          "executionStep": "调用 scene_query.find_by_path",
          "parameterNarrative": "这次请把 path 设为“Canvas/Panel/Button”。",
          "verificationFocus": "返回匹配节点 uuid 和详情",
          "expectedText": "返回匹配节点 uuid 和详情"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 find_by_path 动作，处理“按路径查找”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 path 设为“Canvas/Panel/Button”。调用完成后重点检查：返回匹配节点 uuid 和详情。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 7,
        "note": "来自 tests/test-report.json，自动化执行通过（7ms）"
      }
    },
    {
      "id": 13,
      "tool": "scene_query",
      "action": "find_by_path",
      "title": "路径不存在",
      "input": {
        "action": "find_by_path",
        "path": "NotExist/X"
      },
      "expected": "返回 {error:\"未找到路径\"}",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "path(REQUIRED). Find node by hierarchy path like \"Canvas/Panel/Button\".",
        "zhActionDescription": "path（必填）。按层级路径查找节点，例如 \"Canvas/Panel/Button\"。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 find_by_path 动作，处理“路径不存在”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 path 设为“NotExist/X”。调用完成后重点检查：返回 {error:\"未找到路径\"}。",
          "actionGoal": "按层级路径查找节点，例如 \"Canvas/Panel/Button\"",
          "scenarioType": "参数场景",
          "scenarioTitle": "路径不存在",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.find_by_path",
          "fullPayload": "{\"action\":\"find_by_path\",\"path\":\"NotExist/X\"}",
          "inputText": "path=NotExist/X",
          "executionStep": "调用 scene_query.find_by_path",
          "parameterNarrative": "这次请把 path 设为“NotExist/X”。",
          "verificationFocus": "返回 {error:\"未找到路径\"}",
          "expectedText": "返回 {error:\"未找到路径\"}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 find_by_path 动作，处理“路径不存在”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 path 设为“NotExist/X”。调用完成后重点检查：返回 {error:\"未找到路径\"}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 12,
        "note": "来自 tests/test-report.json，自动化执行通过（12ms）"
      }
    },
    {
      "id": 14,
      "tool": "scene_query",
      "action": "get_components",
      "title": "获取组件列表",
      "input": {
        "action": "get_components",
        "uuid": "<uuid>"
      },
      "expected": "返回 [{type:\"UITransform\",...},{type:\"Sprite\",...}]",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "uuid(REQUIRED). List all components on a node.",
        "zhActionDescription": "uuid（必填）。列出节点上的全部组件。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 get_components 动作，处理“获取组件列表”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：返回 [{type:\"UITransform\",...},{type:\"Sprite\",...}]。",
          "actionGoal": "列出节点上的全部组件",
          "scenarioType": "参数场景",
          "scenarioTitle": "获取组件列表",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.get_components",
          "fullPayload": "{\"action\":\"get_components\",\"uuid\":\"<uuid>\"}",
          "inputText": "uuid=<uuid>",
          "executionStep": "调用 scene_query.get_components",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>。",
          "verificationFocus": "返回 [{type:\"UITransform\",...},{type:\"Sprite\",...}]",
          "expectedText": "返回 [{type:\"UITransform\",...},{type:\"Sprite\",...}]"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 get_components 动作，处理“获取组件列表”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：返回 [{type:\"UITransform\",...},{type:\"Sprite\",...}]。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 6,
        "note": "来自 tests/test-report.json，自动化执行通过（6ms）"
      }
    },
    {
      "id": 15,
      "tool": "scene_query",
      "action": "get_parent",
      "title": "获取父节点",
      "input": {
        "action": "get_parent",
        "uuid": "<uuid>"
      },
      "expected": "返回父节点 {uuid,name}",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "uuid(REQUIRED). Get parent node info.",
        "zhActionDescription": "uuid（必填）。获取父节点信息。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 get_parent 动作，处理“获取父节点”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：返回父节点 {uuid,name}。",
          "actionGoal": "获取父节点信息",
          "scenarioType": "参数场景",
          "scenarioTitle": "获取父节点",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.get_parent",
          "fullPayload": "{\"action\":\"get_parent\",\"uuid\":\"<uuid>\"}",
          "inputText": "uuid=<uuid>",
          "executionStep": "调用 scene_query.get_parent",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>。",
          "verificationFocus": "返回父节点 {uuid,name}",
          "expectedText": "返回父节点 {uuid,name}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 get_parent 动作，处理“获取父节点”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：返回父节点 {uuid,name}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 5,
        "note": "来自 tests/test-report.json，自动化执行通过（5ms）"
      }
    },
    {
      "id": 16,
      "tool": "scene_query",
      "action": "get_parent",
      "title": "根节点",
      "input": {
        "action": "get_parent",
        "uuid": "<scene-root>"
      },
      "expected": "返回 null 或 scene 根",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "uuid(REQUIRED). Get parent node info.",
        "zhActionDescription": "uuid（必填）。获取父节点信息。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 get_parent 动作，处理“根节点”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <scene-root>。调用完成后重点检查：返回 null 或 scene 根。",
          "actionGoal": "获取父节点信息",
          "scenarioType": "参数场景",
          "scenarioTitle": "根节点",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.get_parent",
          "fullPayload": "{\"action\":\"get_parent\",\"uuid\":\"<scene-root>\"}",
          "inputText": "uuid=<scene-root>",
          "executionStep": "调用 scene_query.get_parent",
          "parameterNarrative": "这次请将 uuid 指向 <scene-root>。",
          "verificationFocus": "返回 null 或 scene 根",
          "expectedText": "返回 null 或 scene 根"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 get_parent 动作，处理“根节点”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <scene-root>。调用完成后重点检查：返回 null 或 scene 根。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 13,
        "note": "来自 tests/test-report.json，自动化执行通过（13ms）"
      }
    },
    {
      "id": 17,
      "tool": "scene_query",
      "action": "get_children",
      "title": "直接子节点",
      "input": {
        "action": "get_children",
        "uuid": "<uuid>"
      },
      "expected": "返回 [{uuid,name},...] 列表",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "uuid(REQUIRED). Get direct children of a node.",
        "zhActionDescription": "uuid（必填）。获取节点的直接子节点。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 get_children 动作，处理“直接子节点”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：返回 [{uuid,name},...] 列表。",
          "actionGoal": "获取节点的直接子节点",
          "scenarioType": "参数场景",
          "scenarioTitle": "直接子节点",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.get_children",
          "fullPayload": "{\"action\":\"get_children\",\"uuid\":\"<uuid>\"}",
          "inputText": "uuid=<uuid>",
          "executionStep": "调用 scene_query.get_children",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>。",
          "verificationFocus": "返回 [{uuid,name},...] 列表",
          "expectedText": "返回 [{uuid,name},...] 列表"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 get_children 动作，处理“直接子节点”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：返回 [{uuid,name},...] 列表。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 5,
        "note": "来自 tests/test-report.json，自动化执行通过（5ms）"
      }
    },
    {
      "id": 18,
      "tool": "scene_query",
      "action": "get_sibling",
      "title": "兄弟节点",
      "input": {
        "action": "get_sibling",
        "uuid": "<uuid>"
      },
      "expected": "返回同级节点列表",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "uuid(REQUIRED). Get sibling nodes.",
        "zhActionDescription": "uuid（必填）。获取同级节点。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 get_sibling 动作，处理“兄弟节点”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：返回同级节点列表。",
          "actionGoal": "获取同级节点",
          "scenarioType": "参数场景",
          "scenarioTitle": "兄弟节点",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.get_sibling",
          "fullPayload": "{\"action\":\"get_sibling\",\"uuid\":\"<uuid>\"}",
          "inputText": "uuid=<uuid>",
          "executionStep": "调用 scene_query.get_sibling",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>。",
          "verificationFocus": "返回同级节点列表",
          "expectedText": "返回同级节点列表"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 get_sibling 动作，处理“兄弟节点”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：返回同级节点列表。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 6,
        "note": "来自 tests/test-report.json，自动化执行通过（6ms）"
      }
    },
    {
      "id": 19,
      "tool": "scene_query",
      "action": "get_world_position",
      "title": "世界坐标",
      "input": {
        "action": "get_world_position",
        "uuid": "<uuid>"
      },
      "expected": "返回 {x,y,z}",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "uuid(REQUIRED). Get world-space position {x,y,z}.",
        "zhActionDescription": "uuid（必填）。获取世界坐标 {x,y,z}。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 get_world_position 动作，处理“世界坐标”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：返回 {x,y,z}。",
          "actionGoal": "获取世界坐标 {x,y,z}",
          "scenarioType": "参数场景",
          "scenarioTitle": "世界坐标",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.get_world_position",
          "fullPayload": "{\"action\":\"get_world_position\",\"uuid\":\"<uuid>\"}",
          "inputText": "uuid=<uuid>",
          "executionStep": "调用 scene_query.get_world_position",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>。",
          "verificationFocus": "返回 {x,y,z}",
          "expectedText": "返回 {x,y,z}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 get_world_position 动作，处理“世界坐标”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：返回 {x,y,z}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 14,
        "note": "来自 tests/test-report.json，自动化执行通过（14ms）"
      }
    },
    {
      "id": 20,
      "tool": "scene_query",
      "action": "get_world_rotation",
      "title": "世界旋转",
      "input": {
        "action": "get_world_rotation",
        "uuid": "<uuid>"
      },
      "expected": "返回 {x,y,z} 欧拉角",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "uuid(REQUIRED). Get world-space rotation.",
        "zhActionDescription": "uuid（必填）。获取世界空间旋转。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 get_world_rotation 动作，处理“世界旋转”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：返回 {x,y,z} 欧拉角。",
          "actionGoal": "获取世界空间旋转",
          "scenarioType": "参数场景",
          "scenarioTitle": "世界旋转",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.get_world_rotation",
          "fullPayload": "{\"action\":\"get_world_rotation\",\"uuid\":\"<uuid>\"}",
          "inputText": "uuid=<uuid>",
          "executionStep": "调用 scene_query.get_world_rotation",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>。",
          "verificationFocus": "返回 {x,y,z} 欧拉角",
          "expectedText": "返回 {x,y,z} 欧拉角"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 get_world_rotation 动作，处理“世界旋转”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：返回 {x,y,z} 欧拉角。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 15,
        "note": "来自 tests/test-report.json，自动化执行通过（15ms）"
      }
    },
    {
      "id": 21,
      "tool": "scene_query",
      "action": "get_world_scale",
      "title": "世界缩放",
      "input": {
        "action": "get_world_scale",
        "uuid": "<uuid>"
      },
      "expected": "返回 {x,y,z}",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "uuid(REQUIRED). Get world-space scale.",
        "zhActionDescription": "uuid（必填）。获取世界空间缩放。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 get_world_scale 动作，处理“世界缩放”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：返回 {x,y,z}。",
          "actionGoal": "获取世界空间缩放",
          "scenarioType": "参数场景",
          "scenarioTitle": "世界缩放",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.get_world_scale",
          "fullPayload": "{\"action\":\"get_world_scale\",\"uuid\":\"<uuid>\"}",
          "inputText": "uuid=<uuid>",
          "executionStep": "调用 scene_query.get_world_scale",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>。",
          "verificationFocus": "返回 {x,y,z}",
          "expectedText": "返回 {x,y,z}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 get_world_scale 动作，处理“世界缩放”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：返回 {x,y,z}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 5,
        "note": "来自 tests/test-report.json，自动化执行通过（5ms）"
      }
    },
    {
      "id": 22,
      "tool": "scene_query",
      "action": "get_active_in_hierarchy",
      "title": "节点激活",
      "input": {
        "action": "get_active_in_hierarchy",
        "uuid": "<uuid>"
      },
      "expected": "返回 {activeInHierarchy:true/false}",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "uuid(REQUIRED). Check if node is active considering parent chain.",
        "zhActionDescription": "uuid（必填）。检查节点在父节点链影响下是否处于激活状态。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 get_active_in_hierarchy 动作，处理“节点激活”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：返回 {activeInHierarchy:true/false}。",
          "actionGoal": "检查节点在父节点链影响下是否处于激活状态",
          "scenarioType": "参数场景",
          "scenarioTitle": "节点激活",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.get_active_in_hierarchy",
          "fullPayload": "{\"action\":\"get_active_in_hierarchy\",\"uuid\":\"<uuid>\"}",
          "inputText": "uuid=<uuid>",
          "executionStep": "调用 scene_query.get_active_in_hierarchy",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>。",
          "verificationFocus": "返回 {activeInHierarchy:true/false}",
          "expectedText": "返回 {activeInHierarchy:true/false}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 get_active_in_hierarchy 动作，处理“节点激活”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：返回 {activeInHierarchy:true/false}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 9,
        "note": "来自 tests/test-report.json，自动化执行通过（9ms）"
      }
    },
    {
      "id": 23,
      "tool": "scene_query",
      "action": "get_active_in_hierarchy",
      "title": "父节点禁用",
      "input": {
        "action": "get_active_in_hierarchy",
        "uuid": "<child>"
      },
      "expected": "返回 false（即使自身 active=true）",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "uuid(REQUIRED). Check if node is active considering parent chain.",
        "zhActionDescription": "uuid（必填）。检查节点在父节点链影响下是否处于激活状态。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 get_active_in_hierarchy 动作，处理“父节点禁用”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <child>。调用完成后重点检查：返回 false（即使自身 active=true）。",
          "actionGoal": "检查节点在父节点链影响下是否处于激活状态",
          "scenarioType": "参数场景",
          "scenarioTitle": "父节点禁用",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.get_active_in_hierarchy",
          "fullPayload": "{\"action\":\"get_active_in_hierarchy\",\"uuid\":\"<child>\"}",
          "inputText": "uuid=<child>",
          "executionStep": "调用 scene_query.get_active_in_hierarchy",
          "parameterNarrative": "这次请将 uuid 指向 <child>。",
          "verificationFocus": "返回 false（即使自身 active=true）",
          "expectedText": "返回 false（即使自身 active=true）"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 get_active_in_hierarchy 动作，处理“父节点禁用”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <child>。调用完成后重点检查：返回 false（即使自身 active=true）。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 5,
        "note": "来自 tests/test-report.json，自动化执行通过（5ms）"
      }
    },
    {
      "id": 24,
      "tool": "scene_query",
      "action": "get_node_bounds",
      "title": "2D 边界",
      "input": {
        "action": "get_node_bounds",
        "uuid": "<sprite>"
      },
      "expected": "返回 UITransform local/world rect",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "uuid(REQUIRED). Get bounding box of a node (2D: local/world rect via UITransform, 3D: AABB via MeshRenderer).",
        "zhActionDescription": "uuid（必填）。获取节点包围盒（2D：通过 UITransform 返回 local/world rect；3D：通过 MeshRenderer 返回 AABB）。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 get_node_bounds 动作，处理“2D 边界”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <sprite>。调用完成后重点检查：返回 UITransform local/world rect。",
          "actionGoal": "获取节点包围盒（2D：通过 UITransform 返回 local/world rect；3D：通过 MeshRenderer 返回 AABB）",
          "scenarioType": "参数场景",
          "scenarioTitle": "2D 边界",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.get_node_bounds",
          "fullPayload": "{\"action\":\"get_node_bounds\",\"uuid\":\"<sprite>\"}",
          "inputText": "uuid=<sprite>",
          "executionStep": "调用 scene_query.get_node_bounds",
          "parameterNarrative": "这次请将 uuid 指向 <sprite>。",
          "verificationFocus": "返回 UITransform local/world rect",
          "expectedText": "返回 UITransform local/world rect"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 get_node_bounds 动作，处理“2D 边界”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <sprite>。调用完成后重点检查：返回 UITransform local/world rect。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 6,
        "note": "来自 tests/test-report.json，自动化执行通过（6ms）"
      }
    },
    {
      "id": 25,
      "tool": "scene_query",
      "action": "get_node_bounds",
      "title": "3D 边界",
      "input": {
        "action": "get_node_bounds",
        "uuid": "<mesh>"
      },
      "expected": "返回 AABB {min,max,center,halfExtents}",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "uuid(REQUIRED). Get bounding box of a node (2D: local/world rect via UITransform, 3D: AABB via MeshRenderer).",
        "zhActionDescription": "uuid（必填）。获取节点包围盒（2D：通过 UITransform 返回 local/world rect；3D：通过 MeshRenderer 返回 AABB）。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 get_node_bounds 动作，处理“3D 边界”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <mesh>。调用完成后重点检查：返回 AABB {min,max,center,halfExtents}。",
          "actionGoal": "获取节点包围盒（2D：通过 UITransform 返回 local/world rect；3D：通过 MeshRenderer 返回 AABB）",
          "scenarioType": "参数场景",
          "scenarioTitle": "3D 边界",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.get_node_bounds",
          "fullPayload": "{\"action\":\"get_node_bounds\",\"uuid\":\"<mesh>\"}",
          "inputText": "uuid=<mesh>",
          "executionStep": "调用 scene_query.get_node_bounds",
          "parameterNarrative": "这次请将 uuid 指向 <mesh>。",
          "verificationFocus": "返回 AABB {min,max,center,halfExtents}",
          "expectedText": "返回 AABB {min,max,center,halfExtents}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 get_node_bounds 动作，处理“3D 边界”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <mesh>。调用完成后重点检查：返回 AABB {min,max,center,halfExtents}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 15,
        "note": "来自 tests/test-report.json，自动化执行通过（15ms）"
      }
    },
    {
      "id": 26,
      "tool": "scene_query",
      "action": "find_nodes_by_name",
      "title": "按名搜索",
      "input": {
        "action": "find_nodes_by_name",
        "name": "Button"
      },
      "expected": "返回所有含 \"Button\" 的节点",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "name(REQUIRED). Search nodes by name substring match.",
        "zhActionDescription": "name（必填）。按名称子串匹配搜索节点。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 find_nodes_by_name 动作，处理“按名搜索”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 name 设为“Button”。调用完成后重点检查：返回所有含 \"Button\" 的节点。",
          "actionGoal": "按名称子串匹配搜索节点",
          "scenarioType": "参数场景",
          "scenarioTitle": "按名搜索",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.find_nodes_by_name",
          "fullPayload": "{\"action\":\"find_nodes_by_name\",\"name\":\"Button\"}",
          "inputText": "name=Button",
          "executionStep": "调用 scene_query.find_nodes_by_name",
          "parameterNarrative": "这次请把 name 设为“Button”。",
          "verificationFocus": "返回所有含 \"Button\" 的节点",
          "expectedText": "返回所有含 \"Button\" 的节点"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 find_nodes_by_name 动作，处理“按名搜索”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 name 设为“Button”。调用完成后重点检查：返回所有含 \"Button\" 的节点。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 5,
        "note": "来自 tests/test-report.json，自动化执行通过（5ms）"
      }
    },
    {
      "id": 27,
      "tool": "scene_query",
      "action": "find_nodes_by_name",
      "title": "无匹配",
      "input": {
        "action": "find_nodes_by_name",
        "name": "XXXXXX"
      },
      "expected": "返回空数组 []",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "name(REQUIRED). Search nodes by name substring match.",
        "zhActionDescription": "name（必填）。按名称子串匹配搜索节点。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 find_nodes_by_name 动作，处理“无匹配”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 name 设为“XXXXXX”。调用完成后重点检查：返回空数组 []。",
          "actionGoal": "按名称子串匹配搜索节点",
          "scenarioType": "参数场景",
          "scenarioTitle": "无匹配",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.find_nodes_by_name",
          "fullPayload": "{\"action\":\"find_nodes_by_name\",\"name\":\"XXXXXX\"}",
          "inputText": "name=XXXXXX",
          "executionStep": "调用 scene_query.find_nodes_by_name",
          "parameterNarrative": "这次请把 name 设为“XXXXXX”。",
          "verificationFocus": "返回空数组 []",
          "expectedText": "返回空数组 []"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 find_nodes_by_name 动作，处理“无匹配”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 name 设为“XXXXXX”。调用完成后重点检查：返回空数组 []。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 5,
        "note": "来自 tests/test-report.json，自动化执行通过（5ms）"
      }
    },
    {
      "id": 28,
      "tool": "scene_query",
      "action": "find_nodes_by_component",
      "title": "按组件搜索",
      "input": {
        "action": "find_nodes_by_component",
        "component": "Sprite"
      },
      "expected": "返回所有挂 Sprite 的节点",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "component(REQUIRED). Find all nodes with a specific component type.",
        "zhActionDescription": "component（必填）。查找包含指定组件类型的所有节点。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 find_nodes_by_component 动作，处理“按组件搜索”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 component 设为“Sprite”。调用完成后重点检查：返回所有挂 Sprite 的节点。",
          "actionGoal": "查找包含指定组件类型的所有节点",
          "scenarioType": "参数场景",
          "scenarioTitle": "按组件搜索",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.find_nodes_by_component",
          "fullPayload": "{\"action\":\"find_nodes_by_component\",\"component\":\"Sprite\"}",
          "inputText": "component=Sprite",
          "executionStep": "调用 scene_query.find_nodes_by_component",
          "parameterNarrative": "这次请把 component 设为“Sprite”。",
          "verificationFocus": "返回所有挂 Sprite 的节点",
          "expectedText": "返回所有挂 Sprite 的节点"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 find_nodes_by_component 动作，处理“按组件搜索”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 component 设为“Sprite”。调用完成后重点检查：返回所有挂 Sprite 的节点。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 16,
        "note": "来自 tests/test-report.json，自动化执行通过（16ms）"
      }
    },
    {
      "id": 29,
      "tool": "scene_query",
      "action": "find_nodes_by_component",
      "title": "自定义脚本",
      "input": {
        "action": "find_nodes_by_component",
        "component": "PlayerController"
      },
      "expected": "返回挂该脚本的节点",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "component(REQUIRED). Find all nodes with a specific component type.",
        "zhActionDescription": "component（必填）。查找包含指定组件类型的所有节点。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 find_nodes_by_component 动作，处理“自定义脚本”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 component 设为“PlayerController”。调用完成后重点检查：返回挂该脚本的节点。",
          "actionGoal": "查找包含指定组件类型的所有节点",
          "scenarioType": "参数场景",
          "scenarioTitle": "自定义脚本",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.find_nodes_by_component",
          "fullPayload": "{\"action\":\"find_nodes_by_component\",\"component\":\"PlayerController\"}",
          "inputText": "component=PlayerController",
          "executionStep": "调用 scene_query.find_nodes_by_component",
          "parameterNarrative": "这次请把 component 设为“PlayerController”。",
          "verificationFocus": "返回挂该脚本的节点",
          "expectedText": "返回挂该脚本的节点"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 find_nodes_by_component 动作，处理“自定义脚本”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 component 设为“PlayerController”。调用完成后重点检查：返回挂该脚本的节点。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 6,
        "note": "来自 tests/test-report.json，自动化执行通过（6ms）"
      }
    },
    {
      "id": 30,
      "tool": "scene_query",
      "action": "find_nodes_by_layer",
      "title": "精确匹配",
      "input": {
        "action": "find_nodes_by_layer",
        "layer": 33554432
      },
      "expected": "返回所有 UI_2D 层节点",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "layer(REQUIRED, bitmask value e.g. 1=DEFAULT, 33554432=UI_2D). Find all nodes matching a layer. exact(optional, default true).",
        "zhActionDescription": "layer（必填，位掩码值，例如 1=DEFAULT、33554432=UI_2D）。查找匹配指定 layer 的所有节点。exact（可选，默认 true）。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 find_nodes_by_layer 动作，处理“精确匹配”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 layer 设为 33554432。调用完成后重点检查：返回所有 UI_2D 层节点。",
          "actionGoal": "查找匹配指定 layer 的所有节点",
          "scenarioType": "参数场景",
          "scenarioTitle": "精确匹配",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.find_nodes_by_layer",
          "fullPayload": "{\"action\":\"find_nodes_by_layer\",\"layer\":33554432}",
          "inputText": "layer=33554432",
          "executionStep": "调用 scene_query.find_nodes_by_layer",
          "parameterNarrative": "这次请把 layer 设为 33554432。",
          "verificationFocus": "返回所有 UI_2D 层节点",
          "expectedText": "返回所有 UI_2D 层节点"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 find_nodes_by_layer 动作，处理“精确匹配”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 layer 设为 33554432。调用完成后重点检查：返回所有 UI_2D 层节点。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 6,
        "note": "来自 tests/test-report.json，自动化执行通过（6ms）"
      }
    },
    {
      "id": 31,
      "tool": "scene_query",
      "action": "find_nodes_by_layer",
      "title": "掩码交集",
      "input": {
        "action": "find_nodes_by_layer",
        "layer": 1,
        "exact": false
      },
      "expected": "返回含 DEFAULT 位的节点",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "layer(REQUIRED, bitmask value e.g. 1=DEFAULT, 33554432=UI_2D). Find all nodes matching a layer. exact(optional, default true).",
        "zhActionDescription": "layer（必填，位掩码值，例如 1=DEFAULT、33554432=UI_2D）。查找匹配指定 layer 的所有节点。exact（可选，默认 true）。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 find_nodes_by_layer 动作，处理“掩码交集”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 layer 设为 1，把 exact 设为 false。调用完成后重点检查：返回含 DEFAULT 位的节点。",
          "actionGoal": "查找匹配指定 layer 的所有节点",
          "scenarioType": "参数场景",
          "scenarioTitle": "掩码交集",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.find_nodes_by_layer",
          "fullPayload": "{\"action\":\"find_nodes_by_layer\",\"layer\":1,\"exact\":false}",
          "inputText": "layer=1；exact=false",
          "executionStep": "调用 scene_query.find_nodes_by_layer",
          "parameterNarrative": "这次请把 layer 设为 1，把 exact 设为 false。",
          "verificationFocus": "返回含 DEFAULT 位的节点",
          "expectedText": "返回含 DEFAULT 位的节点"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 find_nodes_by_layer 动作，处理“掩码交集”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 layer 设为 1，把 exact 设为 false。调用完成后重点检查：返回含 DEFAULT 位的节点。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 12,
        "note": "来自 tests/test-report.json，自动化执行通过（12ms）"
      }
    },
    {
      "id": 32,
      "tool": "scene_query",
      "action": "get_component_property",
      "title": "读 Label 文本",
      "input": {
        "action": "get_component_property",
        "uuid": "<uuid>",
        "component": "Label",
        "property": "string"
      },
      "expected": "返回 {value:\"Hello World\"}",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "uuid(REQUIRED), component(REQUIRED), property(REQUIRED). Read a single component property value.",
        "zhActionDescription": "uuid（必填），component（必填），property（必填）。读取单个组件属性值。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 get_component_property 动作，处理“读 Label 文本”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 component 设为“Label”，把 property 设为“string”。调用完成后重点检查：返回 {value:\"Hello World\"}。",
          "actionGoal": "读取单个组件属性值",
          "scenarioType": "参数场景",
          "scenarioTitle": "读 Label 文本",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.get_component_property",
          "fullPayload": "{\"action\":\"get_component_property\",\"uuid\":\"<uuid>\",\"component\":\"Label\",\"property\":\"string\"}",
          "inputText": "uuid=<uuid>；component=Label；property=string",
          "executionStep": "调用 scene_query.get_component_property",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 component 设为“Label”，把 property 设为“string”。",
          "verificationFocus": "返回 {value:\"Hello World\"}",
          "expectedText": "返回 {value:\"Hello World\"}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 get_component_property 动作，处理“读 Label 文本”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 component 设为“Label”，把 property 设为“string”。调用完成后重点检查：返回 {value:\"Hello World\"}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 7,
        "note": "来自 tests/test-report.json，自动化执行通过（7ms）"
      }
    },
    {
      "id": 33,
      "tool": "scene_query",
      "action": "get_component_property",
      "title": "读 spriteFrame",
      "input": {
        "action": "get_component_property",
        "uuid": "<uuid>",
        "component": "Sprite",
        "property": "spriteFrame"
      },
      "expected": "返回 spriteFrame UUID",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "uuid(REQUIRED), component(REQUIRED), property(REQUIRED). Read a single component property value.",
        "zhActionDescription": "uuid（必填），component（必填），property（必填）。读取单个组件属性值。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 get_component_property 动作，处理“读 spriteFrame”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 component 设为“Sprite”，把 property 设为“spriteFrame”。调用完成后重点检查：返回 spriteFrame UUID。",
          "actionGoal": "读取单个组件属性值",
          "scenarioType": "参数场景",
          "scenarioTitle": "读 spriteFrame",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.get_component_property",
          "fullPayload": "{\"action\":\"get_component_property\",\"uuid\":\"<uuid>\",\"component\":\"Sprite\",\"property\":\"spriteFrame\"}",
          "inputText": "uuid=<uuid>；component=Sprite；property=spriteFrame",
          "executionStep": "调用 scene_query.get_component_property",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 component 设为“Sprite”，把 property 设为“spriteFrame”。",
          "verificationFocus": "返回 spriteFrame UUID",
          "expectedText": "返回 spriteFrame UUID"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 get_component_property 动作，处理“读 spriteFrame”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 component 设为“Sprite”，把 property 设为“spriteFrame”。调用完成后重点检查：返回 spriteFrame UUID。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 12,
        "note": "来自 tests/test-report.json，自动化执行通过（12ms）"
      }
    },
    {
      "id": 34,
      "tool": "scene_query",
      "action": "get_node_components_properties",
      "title": "全部组件属性",
      "input": {
        "action": "get_node_components_properties",
        "uuid": "<uuid>"
      },
      "expected": "返回所有组件全部属性快照",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "uuid(REQUIRED). Get all properties of all components on a node.",
        "zhActionDescription": "uuid（必填）。获取节点上所有组件的全部属性。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 get_node_components_properties 动作，处理“全部组件属性”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：返回所有组件全部属性快照。",
          "actionGoal": "获取节点上所有组件的全部属性",
          "scenarioType": "参数场景",
          "scenarioTitle": "全部组件属性",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.get_node_components_properties",
          "fullPayload": "{\"action\":\"get_node_components_properties\",\"uuid\":\"<uuid>\"}",
          "inputText": "uuid=<uuid>",
          "executionStep": "调用 scene_query.get_node_components_properties",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>。",
          "verificationFocus": "返回所有组件全部属性快照",
          "expectedText": "返回所有组件全部属性快照"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 get_node_components_properties 动作，处理“全部组件属性”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：返回所有组件全部属性快照。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 7,
        "note": "来自 tests/test-report.json，自动化执行通过（7ms）"
      }
    },
    {
      "id": 35,
      "tool": "scene_query",
      "action": "get_camera_info",
      "title": "查所有摄像机",
      "input": {
        "action": "get_camera_info"
      },
      "expected": "返回场景全部 Camera 信息列表",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "uuid(optional). Get camera component info (fov, near, far, orthoHeight, projection, clearFlags, priority, clearColor, rect, visibility, clearDepth, clearStencil, aperture, shutter, iso, targetTexture). If uuid omitted, finds all cameras.",
        "zhActionDescription": "uuid（可选）。获取 Camera 组件信息，包括 fov、near、far、orthoHeight、projection、clearFlags、priority、clearColor、rect、visibility、clearDepth、clearStencil、aperture、shutter、iso、targetTexture。如果省略 uuid，则查找所有相机。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 get_camera_info 动作，处理“查所有摄像机”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回场景全部 Camera 信息列表。",
          "actionGoal": "获取 Camera 组件信息，包括 fov、near、far、orthoHeight、projection、clearFlags、priority、clearColor、rect、visibility、clearDepth、clearStencil、aperture、shutter、iso、targetTexture",
          "scenarioType": "通用场景",
          "scenarioTitle": "查所有摄像机",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "scene_query.get_camera_info",
          "fullPayload": "{\"action\":\"get_camera_info\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 scene_query.get_camera_info",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回场景全部 Camera 信息列表",
          "expectedText": "返回场景全部 Camera 信息列表"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 get_camera_info 动作，处理“查所有摄像机”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回场景全部 Camera 信息列表。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 6,
        "note": "来自 tests/test-report.json，自动化执行通过（6ms）"
      }
    },
    {
      "id": 36,
      "tool": "scene_query",
      "action": "get_camera_info",
      "title": "指定摄像机",
      "input": {
        "action": "get_camera_info",
        "uuid": "<cam>"
      },
      "expected": "返回 fov/near/far/projection 等参数",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "uuid(optional). Get camera component info (fov, near, far, orthoHeight, projection, clearFlags, priority, clearColor, rect, visibility, clearDepth, clearStencil, aperture, shutter, iso, targetTexture). If uuid omitted, finds all cameras.",
        "zhActionDescription": "uuid（可选）。获取 Camera 组件信息，包括 fov、near、far、orthoHeight、projection、clearFlags、priority、clearColor、rect、visibility、clearDepth、clearStencil、aperture、shutter、iso、targetTexture。如果省略 uuid，则查找所有相机。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 get_camera_info 动作，处理“指定摄像机”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <cam>。调用完成后重点检查：返回 fov/near/far/projection 等参数。",
          "actionGoal": "获取 Camera 组件信息，包括 fov、near、far、orthoHeight、projection、clearFlags、priority、clearColor、rect、visibility、clearDepth、clearStencil、aperture、shutter、iso、targetTexture",
          "scenarioType": "参数场景",
          "scenarioTitle": "指定摄像机",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.get_camera_info",
          "fullPayload": "{\"action\":\"get_camera_info\",\"uuid\":\"<cam>\"}",
          "inputText": "uuid=<cam>",
          "executionStep": "调用 scene_query.get_camera_info",
          "parameterNarrative": "这次请将 uuid 指向 <cam>。",
          "verificationFocus": "返回 fov/near/far/projection 等参数",
          "expectedText": "返回 fov/near/far/projection 等参数"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 get_camera_info 动作，处理“指定摄像机”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <cam>。调用完成后重点检查：返回 fov/near/far/projection 等参数。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 7,
        "note": "来自 tests/test-report.json，自动化执行通过（7ms）"
      }
    },
    {
      "id": 37,
      "tool": "scene_query",
      "action": "get_canvas_info",
      "title": "Canvas 信息",
      "input": {
        "action": "get_canvas_info"
      },
      "expected": "返回设计分辨率、适配模式等",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "uuid(optional). Get Canvas component info. If uuid omitted, finds first canvas.",
        "zhActionDescription": "uuid（可选）。获取 Canvas 组件信息。如果省略 uuid，则查找第一个 Canvas。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 get_canvas_info 动作，处理“Canvas 信息”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回设计分辨率、适配模式等。",
          "actionGoal": "获取 Canvas 组件信息",
          "scenarioType": "通用场景",
          "scenarioTitle": "Canvas 信息",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "scene_query.get_canvas_info",
          "fullPayload": "{\"action\":\"get_canvas_info\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 scene_query.get_canvas_info",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回设计分辨率、适配模式等",
          "expectedText": "返回设计分辨率、适配模式等"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 get_canvas_info 动作，处理“Canvas 信息”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回设计分辨率、适配模式等。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 5,
        "note": "来自 tests/test-report.json，自动化执行通过（5ms）"
      }
    },
    {
      "id": 38,
      "tool": "scene_query",
      "action": "get_scene_globals",
      "title": "全局设置",
      "input": {
        "action": "get_scene_globals"
      },
      "expected": "返回 ambient/fog/shadows 原始数据",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "no params. Get scene-level global settings (ambient, fog, shadows).",
        "zhActionDescription": "无参数。获取场景级全局设置，包括 ambient、fog、shadows。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 get_scene_globals 动作，处理“全局设置”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 ambient/fog/shadows 原始数据。",
          "actionGoal": "获取场景级全局设置，包括 ambient、fog、shadows",
          "scenarioType": "通用场景",
          "scenarioTitle": "全局设置",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "scene_query.get_scene_globals",
          "fullPayload": "{\"action\":\"get_scene_globals\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 scene_query.get_scene_globals",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回 ambient/fog/shadows 原始数据",
          "expectedText": "返回 ambient/fog/shadows 原始数据"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 get_scene_globals 动作，处理“全局设置”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 ambient/fog/shadows 原始数据。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 6,
        "note": "来自 tests/test-report.json，自动化执行通过（6ms）"
      }
    },
    {
      "id": 39,
      "tool": "scene_query",
      "action": "get_scene_environment",
      "title": "结构化环境",
      "input": {
        "action": "get_scene_environment"
      },
      "expected": "返回 {ambient:{skyColor,skyIllum},shadows,fog,skybox,octree}",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "no params. Get structured scene environment settings: ambient (skyColor, skyIllum), shadows (enabled, type, size), fog (enabled, type, density), skybox (enabled, useIBL, useHDR), octree.",
        "zhActionDescription": "无参数。获取结构化场景环境设置：ambient（skyColor、skyIllum）、shadows（enabled、type、size）、fog（enabled、type、density）、skybox（enabled、useIBL、useHDR）以及 octree。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 get_scene_environment 动作，处理“结构化环境”这个环境场景。这个场景用于验证不同编辑器环境或连接状态下的表现。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {ambient:{skyColor,skyIllum},shadows,fog,skybox,octree}。",
          "actionGoal": "获取结构化场景环境设置：ambient（skyColor、skyIllum）、shadows（enabled、type、size）、fog（enabled、type、density）、skybox（enabled、useIBL、useHDR）以及 octree",
          "scenarioType": "环境场景",
          "scenarioTitle": "结构化环境",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于验证不同编辑器环境或连接状态下的表现。",
          "mcpCall": "scene_query.get_scene_environment",
          "fullPayload": "{\"action\":\"get_scene_environment\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 scene_query.get_scene_environment",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回 {ambient:{skyColor,skyIllum},shadows,fog,skybox,octree}",
          "expectedText": "返回 {ambient:{skyColor,skyIllum},shadows,fog,skybox,octree}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 get_scene_environment 动作，处理“结构化环境”这个环境场景。这个场景用于验证不同编辑器环境或连接状态下的表现。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {ambient:{skyColor,skyIllum},shadows,fog,skybox,octree}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 5,
        "note": "来自 tests/test-report.json，自动化执行通过（5ms）"
      }
    },
    {
      "id": 40,
      "tool": "scene_query",
      "action": "get_light_info",
      "title": "所有灯光",
      "input": {
        "action": "get_light_info"
      },
      "expected": "返回全部灯光组件（类型/颜色/亮度/阴影）",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "uuid(optional). Get all light components in scene (DirectionalLight/SpotLight/SphereLight) with color, illuminance/luminance, range, shadow settings, position/rotation. If uuid specified, only that node.",
        "zhActionDescription": "uuid（可选）。获取场景内所有光照组件（DirectionalLight/SpotLight/SphereLight），包含 color、illuminance/luminance、range、shadow 设置、position/rotation。如果传入 uuid，则只返回该节点。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 get_light_info 动作，处理“所有灯光”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回全部灯光组件（类型/颜色/亮度/阴影）。",
          "actionGoal": "获取场景内所有光照组件（DirectionalLight/SpotLight/SphereLight），包含 color、illuminance/luminance、range、shadow 设置、position/rotation",
          "scenarioType": "通用场景",
          "scenarioTitle": "所有灯光",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "scene_query.get_light_info",
          "fullPayload": "{\"action\":\"get_light_info\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 scene_query.get_light_info",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回全部灯光组件（类型/颜色/亮度/阴影）",
          "expectedText": "返回全部灯光组件（类型/颜色/亮度/阴影）"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 get_light_info 动作，处理“所有灯光”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回全部灯光组件（类型/颜色/亮度/阴影）。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 7,
        "note": "来自 tests/test-report.json，自动化执行通过（7ms）"
      }
    },
    {
      "id": 41,
      "tool": "scene_query",
      "action": "get_light_info",
      "title": "指定灯光",
      "input": {
        "action": "get_light_info",
        "uuid": "<light>"
      },
      "expected": "仅返回该节点灯光信息",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "uuid(optional). Get all light components in scene (DirectionalLight/SpotLight/SphereLight) with color, illuminance/luminance, range, shadow settings, position/rotation. If uuid specified, only that node.",
        "zhActionDescription": "uuid（可选）。获取场景内所有光照组件（DirectionalLight/SpotLight/SphereLight），包含 color、illuminance/luminance、range、shadow 设置、position/rotation。如果传入 uuid，则只返回该节点。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 get_light_info 动作，处理“指定灯光”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <light>。调用完成后重点检查：仅返回该节点灯光信息。",
          "actionGoal": "获取场景内所有光照组件（DirectionalLight/SpotLight/SphereLight），包含 color、illuminance/luminance、range、shadow 设置、position/rotation",
          "scenarioType": "参数场景",
          "scenarioTitle": "指定灯光",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.get_light_info",
          "fullPayload": "{\"action\":\"get_light_info\",\"uuid\":\"<light>\"}",
          "inputText": "uuid=<light>",
          "executionStep": "调用 scene_query.get_light_info",
          "parameterNarrative": "这次请将 uuid 指向 <light>。",
          "verificationFocus": "仅返回该节点灯光信息",
          "expectedText": "仅返回该节点灯光信息"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 get_light_info 动作，处理“指定灯光”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <light>。调用完成后重点检查：仅返回该节点灯光信息。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 6,
        "note": "来自 tests/test-report.json，自动化执行通过（6ms）"
      }
    },
    {
      "id": 42,
      "tool": "scene_query",
      "action": "get_material_info",
      "title": "材质信息",
      "input": {
        "action": "get_material_info",
        "uuid": "<renderer>"
      },
      "expected": "返回 {effectName,technique,passes[],uniforms}",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "uuid(REQUIRED). Get material info on a node's renderer (MeshRenderer/Sprite/etc): effectName, technique, passes, uniforms (mainColor, albedo, roughness, metallic, etc).",
        "zhActionDescription": "uuid（必填）。获取节点渲染器（MeshRenderer/Sprite 等）的材质信息，包括 effectName、technique、passes、uniforms（如 mainColor、albedo、roughness、metallic 等）。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 get_material_info 动作，处理“材质信息”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <renderer>。调用完成后重点检查：返回 {effectName,technique,passes[],uniforms}。",
          "actionGoal": "获取节点渲染器（MeshRenderer/Sprite 等）的材质信息，包括 effectName、technique、passes、uniforms（如 mainColor、albedo、roughness、metallic 等）",
          "scenarioType": "参数场景",
          "scenarioTitle": "材质信息",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.get_material_info",
          "fullPayload": "{\"action\":\"get_material_info\",\"uuid\":\"<renderer>\"}",
          "inputText": "uuid=<renderer>",
          "executionStep": "调用 scene_query.get_material_info",
          "parameterNarrative": "这次请将 uuid 指向 <renderer>。",
          "verificationFocus": "返回 {effectName,technique,passes[],uniforms}",
          "expectedText": "返回 {effectName,technique,passes[],uniforms}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 get_material_info 动作，处理“材质信息”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <renderer>。调用完成后重点检查：返回 {effectName,technique,passes[],uniforms}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 4,
        "note": "来自 tests/test-report.json，自动化执行通过（4ms）"
      }
    },
    {
      "id": 43,
      "tool": "scene_query",
      "action": "get_animation_state",
      "title": "动画状态",
      "input": {
        "action": "get_animation_state",
        "uuid": "<anim>"
      },
      "expected": "返回 {playing,currentClip,currentTime,clips[]}",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "uuid(REQUIRED). Get Animation component state: clips, playing status, current time, default clip.",
        "zhActionDescription": "uuid（必填）。获取 Animation 组件状态：clips、播放状态、当前时间、默认 clip。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 get_animation_state 动作，处理“动画状态”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <anim>。调用完成后重点检查：返回 {playing,currentClip,currentTime,clips[]}。",
          "actionGoal": "获取 Animation 组件状态：clips、播放状态、当前时间、默认 clip",
          "scenarioType": "参数场景",
          "scenarioTitle": "动画状态",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.get_animation_state",
          "fullPayload": "{\"action\":\"get_animation_state\",\"uuid\":\"<anim>\"}",
          "inputText": "uuid=<anim>",
          "executionStep": "调用 scene_query.get_animation_state",
          "parameterNarrative": "这次请将 uuid 指向 <anim>。",
          "verificationFocus": "返回 {playing,currentClip,currentTime,clips[]}",
          "expectedText": "返回 {playing,currentClip,currentTime,clips[]}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 get_animation_state 动作，处理“动画状态”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <anim>。调用完成后重点检查：返回 {playing,currentClip,currentTime,clips[]}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 5,
        "note": "来自 tests/test-report.json，自动化执行通过（5ms）"
      }
    },
    {
      "id": 44,
      "tool": "scene_query",
      "action": "get_animation_state",
      "title": "无动画组件",
      "input": {
        "action": "get_animation_state",
        "uuid": "<no-anim>"
      },
      "expected": "返回 {error:\"没有 Animation 组件\"}",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "uuid(REQUIRED). Get Animation component state: clips, playing status, current time, default clip.",
        "zhActionDescription": "uuid（必填）。获取 Animation 组件状态：clips、播放状态、当前时间、默认 clip。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 get_animation_state 动作，处理“无动画组件”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <no-anim>。调用完成后重点检查：返回 {error:\"没有 Animation 组件\"}。",
          "actionGoal": "获取 Animation 组件状态：clips、播放状态、当前时间、默认 clip",
          "scenarioType": "参数场景",
          "scenarioTitle": "无动画组件",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.get_animation_state",
          "fullPayload": "{\"action\":\"get_animation_state\",\"uuid\":\"<no-anim>\"}",
          "inputText": "uuid=<no-anim>",
          "executionStep": "调用 scene_query.get_animation_state",
          "parameterNarrative": "这次请将 uuid 指向 <no-anim>。",
          "verificationFocus": "返回 {error:\"没有 Animation 组件\"}",
          "expectedText": "返回 {error:\"没有 Animation 组件\"}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 get_animation_state 动作，处理“无动画组件”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <no-anim>。调用完成后重点检查：返回 {error:\"没有 Animation 组件\"}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 6,
        "note": "来自 tests/test-report.json，自动化执行通过（6ms）"
      }
    },
    {
      "id": 45,
      "tool": "scene_query",
      "action": "get_collider_info",
      "title": "碰撞器信息",
      "input": {
        "action": "get_collider_info",
        "uuid": "<uuid>"
      },
      "expected": "返回碰撞器列表 + RigidBody 信息",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "uuid(REQUIRED). Get all collider components on a node with size/offset/type + RigidBody info.",
        "zhActionDescription": "uuid（必填）。获取节点上的全部碰撞体组件信息，包括 size/offset/type 以及 RigidBody 信息。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 get_collider_info 动作，处理“碰撞器信息”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：返回碰撞器列表 + RigidBody 信息。",
          "actionGoal": "获取节点上的全部碰撞体组件信息，包括 size/offset/type 以及 RigidBody 信息",
          "scenarioType": "参数场景",
          "scenarioTitle": "碰撞器信息",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.get_collider_info",
          "fullPayload": "{\"action\":\"get_collider_info\",\"uuid\":\"<uuid>\"}",
          "inputText": "uuid=<uuid>",
          "executionStep": "调用 scene_query.get_collider_info",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>。",
          "verificationFocus": "返回碰撞器列表 + RigidBody 信息",
          "expectedText": "返回碰撞器列表 + RigidBody 信息"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 get_collider_info 动作，处理“碰撞器信息”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：返回碰撞器列表 + RigidBody 信息。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 5,
        "note": "来自 tests/test-report.json，自动化执行通过（5ms）"
      }
    },
    {
      "id": 46,
      "tool": "scene_query",
      "action": "screen_to_world",
      "title": "屏幕转世界",
      "input": {
        "action": "screen_to_world",
        "screenX": 400,
        "screenY": 300,
        "screenZ": 0
      },
      "expected": "返回 {worldX,worldY,worldZ}",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "uuid(optional camera), screenX/screenY(REQUIRED), screenZ(optional, default 0). Convert screen coordinates to world position via camera.",
        "zhActionDescription": "uuid（可选 camera），screenX/screenY（必填），screenZ（可选，默认 0）。通过相机将屏幕坐标转换为世界坐标。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 screen_to_world 动作，处理“屏幕转世界”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 screenX 设为 400，把 screenY 设为 300，把 screenZ 设为 0。调用完成后重点检查：返回 {worldX,worldY,worldZ}。",
          "actionGoal": "通过相机将屏幕坐标转换为世界坐标",
          "scenarioType": "参数场景",
          "scenarioTitle": "屏幕转世界",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.screen_to_world",
          "fullPayload": "{\"action\":\"screen_to_world\",\"screenX\":400,\"screenY\":300,\"screenZ\":0}",
          "inputText": "screenX=400；screenY=300；screenZ=0",
          "executionStep": "调用 scene_query.screen_to_world",
          "parameterNarrative": "这次请把 screenX 设为 400，把 screenY 设为 300，把 screenZ 设为 0。",
          "verificationFocus": "返回 {worldX,worldY,worldZ}",
          "expectedText": "返回 {worldX,worldY,worldZ}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 screen_to_world 动作，处理“屏幕转世界”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 screenX 设为 400，把 screenY 设为 300，把 screenZ 设为 0。调用完成后重点检查：返回 {worldX,worldY,worldZ}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 6,
        "note": "来自 tests/test-report.json，自动化执行通过（6ms）"
      }
    },
    {
      "id": 47,
      "tool": "scene_query",
      "action": "screen_to_world",
      "title": "指定摄像机",
      "input": {
        "action": "screen_to_world",
        "uuid": "<cam>",
        "screenX": 0,
        "screenY": 0
      },
      "expected": "使用指定摄像机转换",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "uuid(optional camera), screenX/screenY(REQUIRED), screenZ(optional, default 0). Convert screen coordinates to world position via camera.",
        "zhActionDescription": "uuid（可选 camera），screenX/screenY（必填），screenZ（可选，默认 0）。通过相机将屏幕坐标转换为世界坐标。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 screen_to_world 动作，处理“指定摄像机”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <cam>，把 screenX 设为 0，把 screenY 设为 0。调用完成后重点检查：使用指定摄像机转换。",
          "actionGoal": "通过相机将屏幕坐标转换为世界坐标",
          "scenarioType": "参数场景",
          "scenarioTitle": "指定摄像机",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.screen_to_world",
          "fullPayload": "{\"action\":\"screen_to_world\",\"uuid\":\"<cam>\",\"screenX\":0,\"screenY\":0}",
          "inputText": "uuid=<cam>；screenX=0；screenY=0",
          "executionStep": "调用 scene_query.screen_to_world",
          "parameterNarrative": "这次请将 uuid 指向 <cam>，把 screenX 设为 0，把 screenY 设为 0。",
          "verificationFocus": "使用指定摄像机转换",
          "expectedText": "使用指定摄像机转换"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 screen_to_world 动作，处理“指定摄像机”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <cam>，把 screenX 设为 0，把 screenY 设为 0。调用完成后重点检查：使用指定摄像机转换。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 7,
        "note": "来自 tests/test-report.json，自动化执行通过（7ms）"
      }
    },
    {
      "id": 48,
      "tool": "scene_query",
      "action": "world_to_screen",
      "title": "世界转屏幕",
      "input": {
        "action": "world_to_screen",
        "worldX": 100,
        "worldY": 200,
        "worldZ": 0
      },
      "expected": "返回 {screenX,screenY,screenZ}",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "uuid(optional camera), worldX/worldY/worldZ(REQUIRED). Convert world position to screen coordinates via camera.",
        "zhActionDescription": "uuid（可选 camera），worldX/worldY/worldZ（必填）。通过相机将世界坐标转换为屏幕坐标。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 world_to_screen 动作，处理“世界转屏幕”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 worldX 设为 100，把 worldY 设为 200，把 worldZ 设为 0。调用完成后重点检查：返回 {screenX,screenY,screenZ}。",
          "actionGoal": "通过相机将世界坐标转换为屏幕坐标",
          "scenarioType": "参数场景",
          "scenarioTitle": "世界转屏幕",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.world_to_screen",
          "fullPayload": "{\"action\":\"world_to_screen\",\"worldX\":100,\"worldY\":200,\"worldZ\":0}",
          "inputText": "worldX=100；worldY=200；worldZ=0",
          "executionStep": "调用 scene_query.world_to_screen",
          "parameterNarrative": "这次请把 worldX 设为 100，把 worldY 设为 200，把 worldZ 设为 0。",
          "verificationFocus": "返回 {screenX,screenY,screenZ}",
          "expectedText": "返回 {screenX,screenY,screenZ}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 world_to_screen 动作，处理“世界转屏幕”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 worldX 设为 100，把 worldY 设为 200，把 worldZ 设为 0。调用完成后重点检查：返回 {screenX,screenY,screenZ}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 7,
        "note": "来自 tests/test-report.json，自动化执行通过（7ms）"
      }
    },
    {
      "id": 49,
      "tool": "scene_query",
      "action": "check_script_ready",
      "title": "脚本已编译",
      "input": {
        "action": "check_script_ready",
        "script": "PlayerController"
      },
      "expected": "返回 {ready:true, isComponent:true}",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "script(REQUIRED, class name). Check if a script class is compiled and registered, returns {ready, isComponent}.",
        "zhActionDescription": "script（必填，类名）。检查脚本类是否已编译并注册，返回 {ready, isComponent}。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 check_script_ready 动作，处理“脚本已编译”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 script 设为“PlayerController”。调用完成后重点检查：返回 {ready:true, isComponent:true}。",
          "actionGoal": "检查脚本类是否已编译并注册，返回 {ready, isComponent}",
          "scenarioType": "参数场景",
          "scenarioTitle": "脚本已编译",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.check_script_ready",
          "fullPayload": "{\"action\":\"check_script_ready\",\"script\":\"PlayerController\"}",
          "inputText": "script=PlayerController",
          "executionStep": "调用 scene_query.check_script_ready",
          "parameterNarrative": "这次请把 script 设为“PlayerController”。",
          "verificationFocus": "返回 {ready:true, isComponent:true}",
          "expectedText": "返回 {ready:true, isComponent:true}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 check_script_ready 动作，处理“脚本已编译”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 script 设为“PlayerController”。调用完成后重点检查：返回 {ready:true, isComponent:true}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 15,
        "note": "来自 tests/test-report.json，自动化执行通过（15ms）"
      }
    },
    {
      "id": 50,
      "tool": "scene_query",
      "action": "check_script_ready",
      "title": "未就绪",
      "input": {
        "action": "check_script_ready",
        "script": "NewScript"
      },
      "expected": "返回 {ready:false, message:\"尚未注册\"}",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "script(REQUIRED, class name). Check if a script class is compiled and registered, returns {ready, isComponent}.",
        "zhActionDescription": "script（必填，类名）。检查脚本类是否已编译并注册，返回 {ready, isComponent}。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 check_script_ready 动作，处理“未就绪”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 script 设为“NewScript”。调用完成后重点检查：返回 {ready:false, message:\"尚未注册\"}。",
          "actionGoal": "检查脚本类是否已编译并注册，返回 {ready, isComponent}",
          "scenarioType": "参数场景",
          "scenarioTitle": "未就绪",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.check_script_ready",
          "fullPayload": "{\"action\":\"check_script_ready\",\"script\":\"NewScript\"}",
          "inputText": "script=NewScript",
          "executionStep": "调用 scene_query.check_script_ready",
          "parameterNarrative": "这次请把 script 设为“NewScript”。",
          "verificationFocus": "返回 {ready:false, message:\"尚未注册\"}",
          "expectedText": "返回 {ready:false, message:\"尚未注册\"}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 check_script_ready 动作，处理“未就绪”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 script 设为“NewScript”。调用完成后重点检查：返回 {ready:false, message:\"尚未注册\"}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 5,
        "note": "来自 tests/test-report.json，自动化执行通过（5ms）"
      }
    },
    {
      "id": 51,
      "tool": "scene_query",
      "action": "check_script_ready",
      "title": "内置组件",
      "input": {
        "action": "check_script_ready",
        "script": "Sprite"
      },
      "expected": "返回 {ready:true, isComponent:true}",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "script(REQUIRED, class name). Check if a script class is compiled and registered, returns {ready, isComponent}.",
        "zhActionDescription": "script（必填，类名）。检查脚本类是否已编译并注册，返回 {ready, isComponent}。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 check_script_ready 动作，处理“内置组件”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 script 设为“Sprite”。调用完成后重点检查：返回 {ready:true, isComponent:true}。",
          "actionGoal": "检查脚本类是否已编译并注册，返回 {ready, isComponent}",
          "scenarioType": "参数场景",
          "scenarioTitle": "内置组件",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.check_script_ready",
          "fullPayload": "{\"action\":\"check_script_ready\",\"script\":\"Sprite\"}",
          "inputText": "script=Sprite",
          "executionStep": "调用 scene_query.check_script_ready",
          "parameterNarrative": "这次请把 script 设为“Sprite”。",
          "verificationFocus": "返回 {ready:true, isComponent:true}",
          "expectedText": "返回 {ready:true, isComponent:true}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 check_script_ready 动作，处理“内置组件”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 script 设为“Sprite”。调用完成后重点检查：返回 {ready:true, isComponent:true}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 7,
        "note": "来自 tests/test-report.json，自动化执行通过（7ms）"
      }
    },
    {
      "id": 52,
      "tool": "scene_query",
      "action": "get_script_properties",
      "title": "获取属性",
      "input": {
        "action": "get_script_properties",
        "script": "PlayerController"
      },
      "expected": "返回 {properties:[{name:\"speed\",type:\"Float\",default:10},...]}",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "script(REQUIRED, class name). Get all @property declarations of a script class (name, type, default, visible).",
        "zhActionDescription": "script（必填，类名）。获取脚本类中全部 @property 声明（name、type、default、visible）。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 get_script_properties 动作，处理“获取属性”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 script 设为“PlayerController”。调用完成后重点检查：返回 {properties:[{name:\"speed\",type:\"Float\",default:10},...]}。",
          "actionGoal": "获取脚本类中全部 @property 声明（name、type、default、visible）",
          "scenarioType": "参数场景",
          "scenarioTitle": "获取属性",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.get_script_properties",
          "fullPayload": "{\"action\":\"get_script_properties\",\"script\":\"PlayerController\"}",
          "inputText": "script=PlayerController",
          "executionStep": "调用 scene_query.get_script_properties",
          "parameterNarrative": "这次请把 script 设为“PlayerController”。",
          "verificationFocus": "返回 {properties:[{name:\"speed\",type:\"Float\",default:10},...]}",
          "expectedText": "返回 {properties:[{name:\"speed\",type:\"Float\",default:10},...]}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 get_script_properties 动作，处理“获取属性”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 script 设为“PlayerController”。调用完成后重点检查：返回 {properties:[{name:\"speed\",type:\"Float\",default:10},...]}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 6,
        "note": "来自 tests/test-report.json，自动化执行通过（6ms）"
      }
    },
    {
      "id": 53,
      "tool": "scene_query",
      "action": "get_script_properties",
      "title": "无 @property",
      "input": {
        "action": "get_script_properties",
        "script": "EmptyScript"
      },
      "expected": "返回 {propertyCount:0, properties:[]}",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "script(REQUIRED, class name). Get all @property declarations of a script class (name, type, default, visible).",
        "zhActionDescription": "script（必填，类名）。获取脚本类中全部 @property 声明（name、type、default、visible）。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 get_script_properties 动作，处理“无 @property”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 script 设为“EmptyScript”。调用完成后重点检查：返回 {propertyCount:0, properties:[]}。",
          "actionGoal": "获取脚本类中全部 @property 声明（name、type、default、visible）",
          "scenarioType": "参数场景",
          "scenarioTitle": "无 @property",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.get_script_properties",
          "fullPayload": "{\"action\":\"get_script_properties\",\"script\":\"EmptyScript\"}",
          "inputText": "script=EmptyScript",
          "executionStep": "调用 scene_query.get_script_properties",
          "parameterNarrative": "这次请把 script 设为“EmptyScript”。",
          "verificationFocus": "返回 {propertyCount:0, properties:[]}",
          "expectedText": "返回 {propertyCount:0, properties:[]}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 get_script_properties 动作，处理“无 @property”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 script 设为“EmptyScript”。调用完成后重点检查：返回 {propertyCount:0, properties:[]}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 5,
        "note": "来自 tests/test-report.json，自动化执行通过（5ms）"
      }
    },
    {
      "id": 54,
      "tool": "scene_query",
      "action": "get_script_properties",
      "title": "不存在",
      "input": {
        "action": "get_script_properties",
        "script": "XXX"
      },
      "expected": "返回 {error:\"未找到脚本类\"}",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "script(REQUIRED, class name). Get all @property declarations of a script class (name, type, default, visible).",
        "zhActionDescription": "script（必填，类名）。获取脚本类中全部 @property 声明（name、type、default、visible）。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 get_script_properties 动作，处理“不存在”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 script 设为“XXX”。调用完成后重点检查：返回 {error:\"未找到脚本类\"}。",
          "actionGoal": "获取脚本类中全部 @property 声明（name、type、default、visible）",
          "scenarioType": "参数场景",
          "scenarioTitle": "不存在",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.get_script_properties",
          "fullPayload": "{\"action\":\"get_script_properties\",\"script\":\"XXX\"}",
          "inputText": "script=XXX",
          "executionStep": "调用 scene_query.get_script_properties",
          "parameterNarrative": "这次请把 script 设为“XXX”。",
          "verificationFocus": "返回 {error:\"未找到脚本类\"}",
          "expectedText": "返回 {error:\"未找到脚本类\"}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 get_script_properties 动作，处理“不存在”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 script 设为“XXX”。调用完成后重点检查：返回 {error:\"未找到脚本类\"}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 12,
        "note": "来自 tests/test-report.json，自动化执行通过（12ms）"
      }
    },
    {
      "id": 55,
      "tool": "scene_query",
      "action": "get_current_selection",
      "title": "有选中",
      "input": {
        "action": "get_current_selection"
      },
      "expected": "返回 {selected:[\"<uuid>\"], focused:{name,...}}",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "no params. Get currently selected node(s) in editor with detail.",
        "zhActionDescription": "无参数。获取编辑器中当前选中的节点及其详情。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 get_current_selection 动作，处理“有选中”这个状态场景。这个场景用于验证当前对象状态或默认状态下的表现。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {selected:[\"<uuid>\"], focused:{name,...}}。",
          "actionGoal": "获取编辑器中当前选中的节点及其详情",
          "scenarioType": "状态场景",
          "scenarioTitle": "有选中",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于验证当前对象状态或默认状态下的表现。",
          "mcpCall": "scene_query.get_current_selection",
          "fullPayload": "{\"action\":\"get_current_selection\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 scene_query.get_current_selection",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回 {selected:[\"<uuid>\"], focused:{name,...}}",
          "expectedText": "返回 {selected:[\"<uuid>\"], focused:{name,...}}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 get_current_selection 动作，处理“有选中”这个状态场景。这个场景用于验证当前对象状态或默认状态下的表现。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {selected:[\"<uuid>\"], focused:{name,...}}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 8,
        "note": "来自 tests/test-report.json，自动化执行通过（8ms）"
      }
    },
    {
      "id": 56,
      "tool": "scene_query",
      "action": "get_current_selection",
      "title": "无选中",
      "input": {
        "action": "get_current_selection"
      },
      "expected": "返回 {selected:[], message:\"当前没有选中节点\"}",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "no params. Get currently selected node(s) in editor with detail.",
        "zhActionDescription": "无参数。获取编辑器中当前选中的节点及其详情。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 get_current_selection 动作，处理“无选中”这个状态场景。这个场景用于验证当前对象状态或默认状态下的表现。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {selected:[], message:\"当前没有选中节点\"}。",
          "actionGoal": "获取编辑器中当前选中的节点及其详情",
          "scenarioType": "状态场景",
          "scenarioTitle": "无选中",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于验证当前对象状态或默认状态下的表现。",
          "mcpCall": "scene_query.get_current_selection",
          "fullPayload": "{\"action\":\"get_current_selection\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 scene_query.get_current_selection",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回 {selected:[], message:\"当前没有选中节点\"}",
          "expectedText": "返回 {selected:[], message:\"当前没有选中节点\"}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 get_current_selection 动作，处理“无选中”这个状态场景。这个场景用于验证当前对象状态或默认状态下的表现。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {selected:[], message:\"当前没有选中节点\"}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 5,
        "note": "来自 tests/test-report.json，自动化执行通过（5ms）"
      }
    },
    {
      "id": 57,
      "tool": "scene_query",
      "action": "get_active_scene_focus",
      "title": "有选中→返回详情",
      "input": {
        "action": "get_active_scene_focus"
      },
      "expected": "返回 {source:\"selection\", focus:{...}}",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "no params. Get AI-context: selected node detail or scene stats as fallback.",
        "zhActionDescription": "无参数。获取 AI 上下文：优先返回已选节点详情，否则回退为场景统计信息。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 get_active_scene_focus 动作，处理“有选中→返回详情”这个状态场景。这个场景用于验证当前对象状态或默认状态下的表现。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {source:\"selection\", focus:{...}}。",
          "actionGoal": "获取 AI 上下文：优先返回已选节点详情，否则回退为场景统计信息",
          "scenarioType": "状态场景",
          "scenarioTitle": "有选中→返回详情",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于验证当前对象状态或默认状态下的表现。",
          "mcpCall": "scene_query.get_active_scene_focus",
          "fullPayload": "{\"action\":\"get_active_scene_focus\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 scene_query.get_active_scene_focus",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回 {source:\"selection\", focus:{...}}",
          "expectedText": "返回 {source:\"selection\", focus:{...}}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 get_active_scene_focus 动作，处理“有选中→返回详情”这个状态场景。这个场景用于验证当前对象状态或默认状态下的表现。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {source:\"selection\", focus:{...}}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 6,
        "note": "来自 tests/test-report.json，自动化执行通过（6ms）"
      }
    },
    {
      "id": 58,
      "tool": "scene_query",
      "action": "get_active_scene_focus",
      "title": "无选中→返回统计",
      "input": {
        "action": "get_active_scene_focus"
      },
      "expected": "返回 {source:\"scene\", focus:{nodeCount,...}}",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "no params. Get AI-context: selected node detail or scene stats as fallback.",
        "zhActionDescription": "无参数。获取 AI 上下文：优先返回已选节点详情，否则回退为场景统计信息。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 get_active_scene_focus 动作，处理“无选中→返回统计”这个状态场景。这个场景用于验证当前对象状态或默认状态下的表现。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {source:\"scene\", focus:{nodeCount,...}}。",
          "actionGoal": "获取 AI 上下文：优先返回已选节点详情，否则回退为场景统计信息",
          "scenarioType": "状态场景",
          "scenarioTitle": "无选中→返回统计",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于验证当前对象状态或默认状态下的表现。",
          "mcpCall": "scene_query.get_active_scene_focus",
          "fullPayload": "{\"action\":\"get_active_scene_focus\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 scene_query.get_active_scene_focus",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回 {source:\"scene\", focus:{nodeCount,...}}",
          "expectedText": "返回 {source:\"scene\", focus:{nodeCount,...}}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 get_active_scene_focus 动作，处理“无选中→返回统计”这个状态场景。这个场景用于验证当前对象状态或默认状态下的表现。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {source:\"scene\", focus:{nodeCount,...}}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 5,
        "note": "来自 tests/test-report.json，自动化执行通过（5ms）"
      }
    },
    {
      "id": 59,
      "tool": "scene_query",
      "action": "list_all_scenes",
      "title": "列出场景",
      "input": {
        "action": "list_all_scenes"
      },
      "expected": "返回 [{url:\"db://assets/scenes/Main.scene\",...},...]",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "no params. List all .scene files in the project.",
        "zhActionDescription": "无参数。列出项目中的所有 .scene 文件。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 list_all_scenes 动作，处理“列出场景”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 [{url:\"db://assets/scenes/Main.scene\",...},...]。",
          "actionGoal": "列出项目中的所有",
          "scenarioType": "通用场景",
          "scenarioTitle": "列出场景",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "scene_query.list_all_scenes",
          "fullPayload": "{\"action\":\"list_all_scenes\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 scene_query.list_all_scenes",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回 [{url:\"db://assets/scenes/Main.scene\",...},...]",
          "expectedText": "返回 [{url:\"db://assets/scenes/Main.scene\",...},...]"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 list_all_scenes 动作，处理“列出场景”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 [{url:\"db://assets/scenes/Main.scene\",...},...]。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 21,
        "note": "来自 tests/test-report.json，自动化执行通过（21ms）"
      }
    },
    {
      "id": 60,
      "tool": "scene_query",
      "action": "validate_scene",
      "title": "场景验证",
      "input": {
        "action": "validate_scene"
      },
      "expected": "返回 {issues:[],score:85}",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "no params. Run validation checks on the current scene.",
        "zhActionDescription": "无参数。对当前场景执行校验检查。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 validate_scene 动作，处理“场景验证”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {issues:[],score:85}。",
          "actionGoal": "对当前场景执行校验检查",
          "scenarioType": "通用场景",
          "scenarioTitle": "场景验证",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "scene_query.validate_scene",
          "fullPayload": "{\"action\":\"validate_scene\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 scene_query.validate_scene",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回 {issues:[],score:85}",
          "expectedText": "返回 {issues:[],score:85}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 validate_scene 动作，处理“场景验证”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {issues:[],score:85}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 5,
        "note": "来自 tests/test-report.json，自动化执行通过（5ms）"
      }
    },
    {
      "id": 61,
      "tool": "scene_query",
      "action": "deep_validate_scene",
      "title": "深度验证",
      "input": {
        "action": "deep_validate_scene"
      },
      "expected": "返回缺失资源、孤立节点、修复建议",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "no params. Deep validation with missing asset detection, orphan node check, and fix suggestions.",
        "zhActionDescription": "无参数。执行深度校验，包括缺失资源检测、孤立节点检查和修复建议。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 deep_validate_scene 动作，处理“深度验证”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回缺失资源、孤立节点、修复建议。",
          "actionGoal": "执行深度校验，包括缺失资源检测、孤立节点检查和修复建议",
          "scenarioType": "通用场景",
          "scenarioTitle": "深度验证",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "scene_query.deep_validate_scene",
          "fullPayload": "{\"action\":\"deep_validate_scene\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 scene_query.deep_validate_scene",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回缺失资源、孤立节点、修复建议",
          "expectedText": "返回缺失资源、孤立节点、修复建议"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 deep_validate_scene 动作，处理“深度验证”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回缺失资源、孤立节点、修复建议。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 39,
        "note": "来自 tests/test-report.json，自动化执行通过（39ms）"
      }
    },
    {
      "id": 62,
      "tool": "scene_query",
      "action": "detect_2d_3d",
      "title": "2D 场景",
      "input": {
        "action": "detect_2d_3d"
      },
      "expected": "返回 {mode:\"2D\"}",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "no params. Detect whether scene is 2D, 3D, or mixed.",
        "zhActionDescription": "无参数。检测场景属于 2D、3D 或混合模式。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 detect_2d_3d 动作，处理“2D 场景”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {mode:\"2D\"}。",
          "actionGoal": "检测场景属于 2D、3D 或混合模式",
          "scenarioType": "通用场景",
          "scenarioTitle": "2D 场景",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "scene_query.detect_2d_3d",
          "fullPayload": "{\"action\":\"detect_2d_3d\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 scene_query.detect_2d_3d",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回 {mode:\"2D\"}",
          "expectedText": "返回 {mode:\"2D\"}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 detect_2d_3d 动作，处理“2D 场景”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {mode:\"2D\"}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 6,
        "note": "来自 tests/test-report.json，自动化执行通过（6ms）"
      }
    },
    {
      "id": 63,
      "tool": "scene_query",
      "action": "detect_2d_3d",
      "title": "3D 场景",
      "input": {
        "action": "detect_2d_3d"
      },
      "expected": "返回 {mode:\"3D\"}",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "no params. Detect whether scene is 2D, 3D, or mixed.",
        "zhActionDescription": "无参数。检测场景属于 2D、3D 或混合模式。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 detect_2d_3d 动作，处理“3D 场景”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {mode:\"3D\"}。",
          "actionGoal": "检测场景属于 2D、3D 或混合模式",
          "scenarioType": "通用场景",
          "scenarioTitle": "3D 场景",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "scene_query.detect_2d_3d",
          "fullPayload": "{\"action\":\"detect_2d_3d\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 scene_query.detect_2d_3d",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回 {mode:\"3D\"}",
          "expectedText": "返回 {mode:\"3D\"}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 detect_2d_3d 动作，处理“3D 场景”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {mode:\"3D\"}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 7,
        "note": "来自 tests/test-report.json，自动化执行通过（7ms）"
      }
    },
    {
      "id": 64,
      "tool": "scene_query",
      "action": "detect_2d_3d",
      "title": "混合场景",
      "input": {
        "action": "detect_2d_3d"
      },
      "expected": "返回 {mode:\"Mixed\"}",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "no params. Detect whether scene is 2D, 3D, or mixed.",
        "zhActionDescription": "无参数。检测场景属于 2D、3D 或混合模式。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 detect_2d_3d 动作，处理“混合场景”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {mode:\"Mixed\"}。",
          "actionGoal": "检测场景属于 2D、3D 或混合模式",
          "scenarioType": "通用场景",
          "scenarioTitle": "混合场景",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "scene_query.detect_2d_3d",
          "fullPayload": "{\"action\":\"detect_2d_3d\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 scene_query.detect_2d_3d",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回 {mode:\"Mixed\"}",
          "expectedText": "返回 {mode:\"Mixed\"}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 detect_2d_3d 动作，处理“混合场景”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {mode:\"Mixed\"}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 6,
        "note": "来自 tests/test-report.json，自动化执行通过（6ms）"
      }
    },
    {
      "id": 65,
      "tool": "scene_query",
      "action": "performance_audit",
      "title": "性能审计",
      "input": {
        "action": "performance_audit"
      },
      "expected": "返回 {issues[],metrics:{nodeCount,maxDepth},suggestions[]}",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "no params. Analyze scene for performance issues (too many nodes, deep hierarchy, etc.).",
        "zhActionDescription": "无参数。分析场景中的性能问题，例如节点过多、层级过深等。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 performance_audit 动作，处理“性能审计”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {issues[],metrics:{nodeCount,maxDepth},suggestions[]}。",
          "actionGoal": "分析场景中的性能问题，例如节点过多、层级过深等",
          "scenarioType": "通用场景",
          "scenarioTitle": "性能审计",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "scene_query.performance_audit",
          "fullPayload": "{\"action\":\"performance_audit\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 scene_query.performance_audit",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回 {issues[],metrics:{nodeCount,maxDepth},suggestions[]}",
          "expectedText": "返回 {issues[],metrics:{nodeCount,maxDepth},suggestions[]}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 performance_audit 动作，处理“性能审计”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {issues[],metrics:{nodeCount,maxDepth},suggestions[]}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 5,
        "note": "来自 tests/test-report.json，自动化执行通过（5ms）"
      }
    },
    {
      "id": 66,
      "tool": "scene_query",
      "action": "list_available_components",
      "title": "组件列表",
      "input": {
        "action": "list_available_components"
      },
      "expected": "返回引擎内置+自定义脚本组件，按类别分组",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "no params. List all available component types (including custom) from cc.js runtime.",
        "zhActionDescription": "无参数。列出 cc.js 运行时中所有可用组件类型（包含自定义组件）。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 list_available_components 动作，处理“组件列表”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回引擎内置+自定义脚本组件，按类别分组。",
          "actionGoal": "列出 cc",
          "scenarioType": "通用场景",
          "scenarioTitle": "组件列表",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "scene_query.list_available_components",
          "fullPayload": "{\"action\":\"list_available_components\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 scene_query.list_available_components",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回引擎内置+自定义脚本组件，按类别分组",
          "expectedText": "返回引擎内置+自定义脚本组件，按类别分组"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 list_available_components 动作，处理“组件列表”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回引擎内置+自定义脚本组件，按类别分组。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 6,
        "note": "来自 tests/test-report.json，自动化执行通过（6ms）"
      }
    },
    {
      "id": 67,
      "tool": "scene_query",
      "action": "scene_snapshot",
      "title": "默认快照",
      "input": {
        "action": "scene_snapshot"
      },
      "expected": "返回场景状态快照（最多 500 节点）",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "maxNodes(optional, default 500). Capture full scene state for later diffing.",
        "zhActionDescription": "maxNodes（可选，默认 500）。捕获完整场景状态，供后续 diff 使用。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 scene_snapshot 动作，处理“默认快照”这个状态场景。这个场景用于验证当前对象状态或默认状态下的表现。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回场景状态快照（最多 500 节点）。",
          "actionGoal": "捕获完整场景状态，供后续 diff 使用",
          "scenarioType": "状态场景",
          "scenarioTitle": "默认快照",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于验证当前对象状态或默认状态下的表现。",
          "mcpCall": "scene_query.scene_snapshot",
          "fullPayload": "{\"action\":\"scene_snapshot\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 scene_query.scene_snapshot",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回场景状态快照（最多 500 节点）",
          "expectedText": "返回场景状态快照（最多 500 节点）"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 scene_snapshot 动作，处理“默认快照”这个状态场景。这个场景用于验证当前对象状态或默认状态下的表现。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回场景状态快照（最多 500 节点）。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 101,
        "note": "来自 tests/test-report.json，自动化执行通过（101ms）"
      }
    },
    {
      "id": 68,
      "tool": "scene_query",
      "action": "scene_snapshot",
      "title": "限制数量",
      "input": {
        "action": "scene_snapshot",
        "maxNodes": 100
      },
      "expected": "返回最多 100 节点快照",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "maxNodes(optional, default 500). Capture full scene state for later diffing.",
        "zhActionDescription": "maxNodes（可选，默认 500）。捕获完整场景状态，供后续 diff 使用。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 scene_snapshot 动作，处理“限制数量”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 maxNodes 设为 100。调用完成后重点检查：返回最多 100 节点快照。",
          "actionGoal": "捕获完整场景状态，供后续 diff 使用",
          "scenarioType": "参数场景",
          "scenarioTitle": "限制数量",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.scene_snapshot",
          "fullPayload": "{\"action\":\"scene_snapshot\",\"maxNodes\":100}",
          "inputText": "maxNodes=100",
          "executionStep": "调用 scene_query.scene_snapshot",
          "parameterNarrative": "这次请把 maxNodes 设为 100。",
          "verificationFocus": "返回最多 100 节点快照",
          "expectedText": "返回最多 100 节点快照"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 scene_snapshot 动作，处理“限制数量”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 maxNodes 设为 100。调用完成后重点检查：返回最多 100 节点快照。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 72,
        "note": "来自 tests/test-report.json，自动化执行通过（72ms）"
      }
    },
    {
      "id": 69,
      "tool": "scene_query",
      "action": "scene_diff",
      "title": "对比快照",
      "input": {
        "action": "scene_diff",
        "snapshotA": {},
        "snapshotB": {}
      },
      "expected": "返回 {added[],removed[],modified[]}",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "snapshotA(REQUIRED), snapshotB(REQUIRED). Compare two snapshots to find added/removed/modified nodes.",
        "zhActionDescription": "snapshotA（必填），snapshotB（必填）。比较两个快照，找出新增、删除或修改的节点。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 scene_diff 动作，处理“对比快照”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请传入 snapshotA={}，传入 snapshotB={}。调用完成后重点检查：返回 {added[],removed[],modified[]}。",
          "actionGoal": "比较两个快照，找出新增、删除或修改的节点",
          "scenarioType": "参数场景",
          "scenarioTitle": "对比快照",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.scene_diff",
          "fullPayload": "{\"action\":\"scene_diff\",\"snapshotA\":{},\"snapshotB\":{}}",
          "inputText": "snapshotA={}；snapshotB={}",
          "executionStep": "调用 scene_query.scene_diff",
          "parameterNarrative": "这次请传入 snapshotA={}，传入 snapshotB={}。",
          "verificationFocus": "返回 {added[],removed[],modified[]}",
          "expectedText": "返回 {added[],removed[],modified[]}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 scene_diff 动作，处理“对比快照”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请传入 snapshotA={}，传入 snapshotB={}。调用完成后重点检查：返回 {added[],removed[],modified[]}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 6,
        "note": "来自 tests/test-report.json，自动化执行通过（6ms）"
      }
    },
    {
      "id": 70,
      "tool": "scene_query",
      "action": "export_scene_json",
      "title": "导出 JSON",
      "input": {
        "action": "export_scene_json"
      },
      "expected": "返回完整场景节点树 JSON",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "no params. Export full scene tree as JSON.",
        "zhActionDescription": "无参数。将完整场景树导出为 JSON。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 export_scene_json 动作，处理“导出 JSON”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回完整场景节点树 JSON。",
          "actionGoal": "将完整场景树导出为 JSON",
          "scenarioType": "通用场景",
          "scenarioTitle": "导出 JSON",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "scene_query.export_scene_json",
          "fullPayload": "{\"action\":\"export_scene_json\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 scene_query.export_scene_json",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回完整场景节点树 JSON",
          "expectedText": "返回完整场景节点树 JSON"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 export_scene_json 动作，处理“导出 JSON”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回完整场景节点树 JSON。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 89,
        "note": "来自 tests/test-report.json，自动化执行通过（89ms）"
      }
    },
    {
      "id": 71,
      "tool": "scene_query",
      "action": "measure_distance",
      "title": "测量距离",
      "input": {
        "action": "measure_distance",
        "uuidA": "<a>",
        "uuidB": "<b>"
      },
      "expected": "返回 {distance2D,distance3D,delta:{x,y,z}}",
      "note": "",
      "phase": "只读查询",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read-only inspection of the Cocos Creator scene graph. NEVER modifies anything.",
        "zhToolSummary": "对 Cocos Creator 场景图进行只读检查，不会执行任何修改。",
        "actionDescription": "uuidA(REQUIRED), uuidB(REQUIRED). Measure 2D/3D distance between two nodes.",
        "zhActionDescription": "uuidA（必填），uuidB（必填）。测量两个节点之间的 2D/3D 距离。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_query 工具，执行 measure_distance 动作，处理“测量距离”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuidA 指向 <a>，将 uuidB 指向 <b>。调用完成后重点检查：返回 {distance2D,distance3D,delta:{x,y,z}}。",
          "actionGoal": "测量两个节点之间的 2D/3D 距离",
          "scenarioType": "参数场景",
          "scenarioTitle": "测量距离",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_query.measure_distance",
          "fullPayload": "{\"action\":\"measure_distance\",\"uuidA\":\"<a>\",\"uuidB\":\"<b>\"}",
          "inputText": "uuidA=<a>；uuidB=<b>",
          "executionStep": "调用 scene_query.measure_distance",
          "parameterNarrative": "这次请将 uuidA 指向 <a>，将 uuidB 指向 <b>。",
          "verificationFocus": "返回 {distance2D,distance3D,delta:{x,y,z}}",
          "expectedText": "返回 {distance2D,distance3D,delta:{x,y,z}}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_query 工具，执行 measure_distance 动作，处理“测量距离”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuidA 指向 <a>，将 uuidB 指向 <b>。调用完成后重点检查：返回 {distance2D,distance3D,delta:{x,y,z}}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 6,
        "note": "来自 tests/test-report.json，自动化执行通过（6ms）"
      }
    },
    {
      "id": 72,
      "tool": "scene_operation",
      "action": "create_node",
      "title": "创建空节点",
      "input": {
        "action": "create_node",
        "name": "MyNode"
      },
      "expected": "返回 {uuid:\"<new>\"}，在场景根下",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "name(REQUIRED), parentUuid(recommended, omit=scene root), siblingIndex(optional, -1=append). Returns {uuid}.",
        "zhActionDescription": "name（必填），parentUuid（推荐，省略时为场景根节点），siblingIndex（可选，-1=append）。返回{uuid}。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 create_node 动作，处理“创建空节点”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 name 设为“MyNode”。调用完成后重点检查：返回 {uuid:\"<new>\"}，在场景根下。",
          "actionGoal": "返回{uuid}",
          "scenarioType": "参数场景",
          "scenarioTitle": "创建空节点",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.create_node",
          "fullPayload": "{\"action\":\"create_node\",\"name\":\"MyNode\"}",
          "inputText": "name=MyNode",
          "executionStep": "调用 scene_operation.create_node",
          "parameterNarrative": "这次请把 name 设为“MyNode”。",
          "verificationFocus": "返回 {uuid:\"<new>\"}，在场景根下",
          "expectedText": "返回 {uuid:\"<new>\"}，在场景根下"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 create_node 动作，处理“创建空节点”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 name 设为“MyNode”。调用完成后重点检查：返回 {uuid:\"<new>\"}，在场景根下。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 23,
        "note": "来自 tests/test-report.json，自动化执行通过（23ms）"
      }
    },
    {
      "id": 73,
      "tool": "scene_operation",
      "action": "create_node",
      "title": "指定父节点",
      "input": {
        "action": "create_node",
        "name": "Child",
        "parentUuid": "<parent>"
      },
      "expected": "在父节点下创建子节点",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "name(REQUIRED), parentUuid(recommended, omit=scene root), siblingIndex(optional, -1=append). Returns {uuid}.",
        "zhActionDescription": "name（必填），parentUuid（推荐，省略时为场景根节点），siblingIndex（可选，-1=append）。返回{uuid}。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 create_node 动作，处理“指定父节点”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 name 设为“Child”，将 parentUuid 指向 <parent>。调用完成后重点检查：在父节点下创建子节点。",
          "actionGoal": "返回{uuid}",
          "scenarioType": "参数场景",
          "scenarioTitle": "指定父节点",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.create_node",
          "fullPayload": "{\"action\":\"create_node\",\"name\":\"Child\",\"parentUuid\":\"<parent>\"}",
          "inputText": "name=Child；parentUuid=<parent>",
          "executionStep": "调用 scene_operation.create_node",
          "parameterNarrative": "这次请把 name 设为“Child”，将 parentUuid 指向 <parent>。",
          "verificationFocus": "在父节点下创建子节点",
          "expectedText": "在父节点下创建子节点"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 create_node 动作，处理“指定父节点”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 name 设为“Child”，将 parentUuid 指向 <parent>。调用完成后重点检查：在父节点下创建子节点。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 48,
        "note": "来自 tests/test-report.json，自动化执行通过（48ms）"
      }
    },
    {
      "id": 74,
      "tool": "scene_operation",
      "action": "create_node",
      "title": "指定排序",
      "input": {
        "action": "create_node",
        "name": "First",
        "parentUuid": "<p>",
        "siblingIndex": 0
      },
      "expected": "插入到兄弟列表第一位",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "name(REQUIRED), parentUuid(recommended, omit=scene root), siblingIndex(optional, -1=append). Returns {uuid}.",
        "zhActionDescription": "name（必填），parentUuid（推荐，省略时为场景根节点），siblingIndex（可选，-1=append）。返回{uuid}。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 create_node 动作，处理“指定排序”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 name 设为“First”，将 parentUuid 指向 <p>，把 siblingIndex 设为 0。调用完成后重点检查：插入到兄弟列表第一位。",
          "actionGoal": "返回{uuid}",
          "scenarioType": "参数场景",
          "scenarioTitle": "指定排序",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.create_node",
          "fullPayload": "{\"action\":\"create_node\",\"name\":\"First\",\"parentUuid\":\"<p>\",\"siblingIndex\":0}",
          "inputText": "name=First；parentUuid=<p>；siblingIndex=0",
          "executionStep": "调用 scene_operation.create_node",
          "parameterNarrative": "这次请把 name 设为“First”，将 parentUuid 指向 <p>，把 siblingIndex 设为 0。",
          "verificationFocus": "插入到兄弟列表第一位",
          "expectedText": "插入到兄弟列表第一位"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 create_node 动作，处理“指定排序”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 name 设为“First”，将 parentUuid 指向 <p>，把 siblingIndex 设为 0。调用完成后重点检查：插入到兄弟列表第一位。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 43,
        "note": "来自 tests/test-report.json，自动化执行通过（43ms）"
      }
    },
    {
      "id": 75,
      "tool": "scene_operation",
      "action": "destroy_node",
      "title": "删除节点",
      "input": {
        "action": "destroy_node",
        "uuid": "<uuid>",
        "confirmDangerous": true
      },
      "expected": "返回 {success:true}",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "uuid(REQUIRED), confirmDangerous=true(REQUIRED). Permanently removes a node.",
        "zhActionDescription": "uuid（必填），confirmDangerous=true（必填）。永久删除一个节点。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 destroy_node 动作，处理“删除节点”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 confirmDangerous 设为 true。调用完成后重点检查：返回 {success:true}。",
          "actionGoal": "永久删除一个节点",
          "scenarioType": "参数场景",
          "scenarioTitle": "删除节点",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.destroy_node",
          "fullPayload": "{\"action\":\"destroy_node\",\"uuid\":\"<uuid>\",\"confirmDangerous\":true}",
          "inputText": "uuid=<uuid>；confirmDangerous=true",
          "executionStep": "调用 scene_operation.destroy_node",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 confirmDangerous 设为 true。",
          "verificationFocus": "返回 {success:true}",
          "expectedText": "返回 {success:true}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 destroy_node 动作，处理“删除节点”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 confirmDangerous 设为 true。调用完成后重点检查：返回 {success:true}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 14,
        "note": "来自 tests/test-report.json，自动化执行通过（14ms）"
      }
    },
    {
      "id": 76,
      "tool": "scene_operation",
      "action": "destroy_node",
      "title": "缺少确认",
      "input": {
        "action": "destroy_node",
        "uuid": "<uuid>"
      },
      "expected": "返回 {error:\"需要 confirmDangerous=true\"}",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "uuid(REQUIRED), confirmDangerous=true(REQUIRED). Permanently removes a node.",
        "zhActionDescription": "uuid（必填），confirmDangerous=true（必填）。永久删除一个节点。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 destroy_node 动作，处理“缺少确认”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：返回 {error:\"需要 confirmDangerous=true\"}。",
          "actionGoal": "永久删除一个节点",
          "scenarioType": "参数场景",
          "scenarioTitle": "缺少确认",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.destroy_node",
          "fullPayload": "{\"action\":\"destroy_node\",\"uuid\":\"<uuid>\"}",
          "inputText": "uuid=<uuid>",
          "executionStep": "调用 scene_operation.destroy_node",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>。",
          "verificationFocus": "返回 {error:\"需要 confirmDangerous=true\"}",
          "expectedText": "返回 {error:\"需要 confirmDangerous=true\"}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 destroy_node 动作，处理“缺少确认”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：返回 {error:\"需要 confirmDangerous=true\"}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 3,
        "note": "来自 tests/test-report.json，自动化执行通过（3ms）"
      }
    },
    {
      "id": 77,
      "tool": "scene_operation",
      "action": "reparent",
      "title": "移动到新父节点",
      "input": {
        "action": "reparent",
        "uuid": "<child>",
        "parentUuid": "<newP>"
      },
      "expected": "返回 {success:true}",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "uuid(REQUIRED), parentUuid(REQUIRED). Move node under a new parent.",
        "zhActionDescription": "uuid（必填），parentUuid（必填）。将节点移动到新的父节点下。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 reparent 动作，处理“移动到新父节点”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <child>，将 parentUuid 指向 <newP>。调用完成后重点检查：返回 {success:true}。",
          "actionGoal": "将节点移动到新的父节点下",
          "scenarioType": "参数场景",
          "scenarioTitle": "移动到新父节点",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.reparent",
          "fullPayload": "{\"action\":\"reparent\",\"uuid\":\"<child>\",\"parentUuid\":\"<newP>\"}",
          "inputText": "uuid=<child>；parentUuid=<newP>",
          "executionStep": "调用 scene_operation.reparent",
          "parameterNarrative": "这次请将 uuid 指向 <child>，将 parentUuid 指向 <newP>。",
          "verificationFocus": "返回 {success:true}",
          "expectedText": "返回 {success:true}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 reparent 动作，处理“移动到新父节点”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <child>，将 parentUuid 指向 <newP>。调用完成后重点检查：返回 {success:true}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 73,
        "note": "来自 tests/test-report.json，自动化执行通过（73ms）"
      }
    },
    {
      "id": 78,
      "tool": "scene_operation",
      "action": "duplicate_node",
      "title": "克隆含子节点",
      "input": {
        "action": "duplicate_node",
        "uuid": "<uuid>"
      },
      "expected": "返回 {clonedUuid:\"<new>\"}",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "uuid(REQUIRED), includeChildren(optional, default true). Clone node (and optionally children), returns {clonedUuid}.",
        "zhActionDescription": "uuid（必填），includeChildren（可选，默认 true）。克隆节点（可选包含子节点），并返回 {clonedUuid}。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 duplicate_node 动作，处理“克隆含子节点”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：返回 {clonedUuid:\"<new>\"}。",
          "actionGoal": "克隆节点（可选包含子节点），并返回 {clonedUuid}",
          "scenarioType": "参数场景",
          "scenarioTitle": "克隆含子节点",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.duplicate_node",
          "fullPayload": "{\"action\":\"duplicate_node\",\"uuid\":\"<uuid>\"}",
          "inputText": "uuid=<uuid>",
          "executionStep": "调用 scene_operation.duplicate_node",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>。",
          "verificationFocus": "返回 {clonedUuid:\"<new>\"}",
          "expectedText": "返回 {clonedUuid:\"<new>\"}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 duplicate_node 动作，处理“克隆含子节点”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：返回 {clonedUuid:\"<new>\"}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 48,
        "note": "来自 tests/test-report.json，自动化执行通过（48ms）"
      }
    },
    {
      "id": 79,
      "tool": "scene_operation",
      "action": "duplicate_node",
      "title": "仅克隆自身",
      "input": {
        "action": "duplicate_node",
        "uuid": "<uuid>",
        "includeChildren": false
      },
      "expected": "不含子节点的克隆",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "uuid(REQUIRED), includeChildren(optional, default true). Clone node (and optionally children), returns {clonedUuid}.",
        "zhActionDescription": "uuid（必填），includeChildren（可选，默认 true）。克隆节点（可选包含子节点），并返回 {clonedUuid}。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 duplicate_node 动作，处理“仅克隆自身”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 includeChildren 设为 false。调用完成后重点检查：不含子节点的克隆。",
          "actionGoal": "克隆节点（可选包含子节点），并返回 {clonedUuid}",
          "scenarioType": "参数场景",
          "scenarioTitle": "仅克隆自身",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.duplicate_node",
          "fullPayload": "{\"action\":\"duplicate_node\",\"uuid\":\"<uuid>\",\"includeChildren\":false}",
          "inputText": "uuid=<uuid>；includeChildren=false",
          "executionStep": "调用 scene_operation.duplicate_node",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 includeChildren 设为 false。",
          "verificationFocus": "不含子节点的克隆",
          "expectedText": "不含子节点的克隆"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 duplicate_node 动作，处理“仅克隆自身”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 includeChildren 设为 false。调用完成后重点检查：不含子节点的克隆。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 28,
        "note": "来自 tests/test-report.json，自动化执行通过（28ms）"
      }
    },
    {
      "id": 80,
      "tool": "scene_operation",
      "action": "clear_children",
      "title": "清空子节点",
      "input": {
        "action": "clear_children",
        "uuid": "<uuid>",
        "confirmDangerous": true
      },
      "expected": "删除全部子节点",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "uuid(REQUIRED), confirmDangerous=true(REQUIRED). Remove all child nodes.",
        "zhActionDescription": "uuid（必填），confirmDangerous=true（必填）。删除该节点下的全部子节点。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 clear_children 动作，处理“清空子节点”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 confirmDangerous 设为 true。调用完成后重点检查：删除全部子节点。",
          "actionGoal": "删除该节点下的全部子节点",
          "scenarioType": "参数场景",
          "scenarioTitle": "清空子节点",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.clear_children",
          "fullPayload": "{\"action\":\"clear_children\",\"uuid\":\"<uuid>\",\"confirmDangerous\":true}",
          "inputText": "uuid=<uuid>；confirmDangerous=true",
          "executionStep": "调用 scene_operation.clear_children",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 confirmDangerous 设为 true。",
          "verificationFocus": "删除全部子节点",
          "expectedText": "删除全部子节点"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 clear_children 动作，处理“清空子节点”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 confirmDangerous 设为 true。调用完成后重点检查：删除全部子节点。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 34,
        "note": "来自 tests/test-report.json，自动化执行通过（34ms）"
      }
    },
    {
      "id": 81,
      "tool": "scene_operation",
      "action": "group_nodes",
      "title": "编组",
      "input": {
        "action": "group_nodes",
        "uuids": [
          "<a>",
          "<b>"
        ],
        "name": "Group"
      },
      "expected": "创建 Group 节点并将两个节点移入",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 group_nodes 动作，处理“编组”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请传入 uuids=[\"<a>\",\"<b>\"]，把 name 设为“Group”。调用完成后重点检查：创建 Group 节点并将两个节点移入。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "编组",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.group_nodes",
          "fullPayload": "{\"action\":\"group_nodes\",\"uuids\":[\"<a>\",\"<b>\"],\"name\":\"Group\"}",
          "inputText": "uuids=[\"<a>\",\"<b>\"]；name=Group",
          "executionStep": "调用 scene_operation.group_nodes",
          "parameterNarrative": "这次请传入 uuids=[\"<a>\",\"<b>\"]，把 name 设为“Group”。",
          "verificationFocus": "创建 Group 节点并将两个节点移入",
          "expectedText": "创建 Group 节点并将两个节点移入"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 group_nodes 动作，处理“编组”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请传入 uuids=[\"<a>\",\"<b>\"]，把 name 设为“Group”。调用完成后重点检查：创建 Group 节点并将两个节点移入。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 26,
        "note": "来自 tests/test-report.json，自动化执行通过（26ms）"
      }
    },
    {
      "id": 82,
      "tool": "scene_operation",
      "action": "set_position",
      "title": "设本地位置",
      "input": {
        "action": "set_position",
        "uuid": "<uuid>",
        "x": 100,
        "y": 200,
        "z": 0
      },
      "expected": "本地坐标变为 (100,200,0)",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "uuid(REQUIRED), x/y/z(REQUIRED). Set LOCAL position.",
        "zhActionDescription": "uuid（必填），x/y/z（必填）。设置本地坐标。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 set_position 动作，处理“设本地位置”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 x 设为 100，把 y 设为 200，把 z 设为 0。调用完成后重点检查：本地坐标变为 (100,200,0)。",
          "actionGoal": "设置本地坐标",
          "scenarioType": "参数场景",
          "scenarioTitle": "设本地位置",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.set_position",
          "fullPayload": "{\"action\":\"set_position\",\"uuid\":\"<uuid>\",\"x\":100,\"y\":200,\"z\":0}",
          "inputText": "uuid=<uuid>；x=100；y=200；z=0",
          "executionStep": "调用 scene_operation.set_position",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 x 设为 100，把 y 设为 200，把 z 设为 0。",
          "verificationFocus": "本地坐标变为 (100,200,0)",
          "expectedText": "本地坐标变为 (100,200,0)"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 set_position 动作，处理“设本地位置”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 x 设为 100，把 y 设为 200，把 z 设为 0。调用完成后重点检查：本地坐标变为 (100,200,0)。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 66,
        "note": "来自 tests/test-report.json，自动化执行通过（66ms）"
      }
    },
    {
      "id": 83,
      "tool": "scene_operation",
      "action": "set_rotation",
      "title": "设本地旋转",
      "input": {
        "action": "set_rotation",
        "uuid": "<uuid>",
        "x": 0,
        "y": 45,
        "z": 0
      },
      "expected": "绕 Y 轴旋转 45°",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "uuid(REQUIRED), x/y/z(REQUIRED). Set LOCAL euler rotation in degrees.",
        "zhActionDescription": "uuid（必填），x/y/z（必填）。设置本地欧拉旋转，单位为度。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 set_rotation 动作，处理“设本地旋转”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 x 设为 0，把 y 设为 45，把 z 设为 0。调用完成后重点检查：绕 Y 轴旋转 45°。",
          "actionGoal": "设置本地欧拉旋转，单位为度",
          "scenarioType": "参数场景",
          "scenarioTitle": "设本地旋转",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.set_rotation",
          "fullPayload": "{\"action\":\"set_rotation\",\"uuid\":\"<uuid>\",\"x\":0,\"y\":45,\"z\":0}",
          "inputText": "uuid=<uuid>；x=0；y=45；z=0",
          "executionStep": "调用 scene_operation.set_rotation",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 x 设为 0，把 y 设为 45，把 z 设为 0。",
          "verificationFocus": "绕 Y 轴旋转 45°",
          "expectedText": "绕 Y 轴旋转 45°"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 set_rotation 动作，处理“设本地旋转”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 x 设为 0，把 y 设为 45，把 z 设为 0。调用完成后重点检查：绕 Y 轴旋转 45°。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 24,
        "note": "来自 tests/test-report.json，自动化执行通过（24ms）"
      }
    },
    {
      "id": 84,
      "tool": "scene_operation",
      "action": "set_scale",
      "title": "设缩放",
      "input": {
        "action": "set_scale",
        "uuid": "<uuid>",
        "x": 2,
        "y": 2,
        "z": 1
      },
      "expected": "放大 2 倍",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "uuid(REQUIRED), x/y/z(REQUIRED). Set LOCAL scale (1=100%).",
        "zhActionDescription": "uuid（必填），x/y/z（必填）。设置本地缩放（1=100%）。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 set_scale 动作，处理“设缩放”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 x 设为 2，把 y 设为 2，把 z 设为 1。调用完成后重点检查：放大 2 倍。",
          "actionGoal": "设置本地缩放（1=100%）",
          "scenarioType": "参数场景",
          "scenarioTitle": "设缩放",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.set_scale",
          "fullPayload": "{\"action\":\"set_scale\",\"uuid\":\"<uuid>\",\"x\":2,\"y\":2,\"z\":1}",
          "inputText": "uuid=<uuid>；x=2；y=2；z=1",
          "executionStep": "调用 scene_operation.set_scale",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 x 设为 2，把 y 设为 2，把 z 设为 1。",
          "verificationFocus": "放大 2 倍",
          "expectedText": "放大 2 倍"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 set_scale 动作，处理“设缩放”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 x 设为 2，把 y 设为 2，把 z 设为 1。调用完成后重点检查：放大 2 倍。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 35,
        "note": "来自 tests/test-report.json，自动化执行通过（35ms）"
      }
    },
    {
      "id": 85,
      "tool": "scene_operation",
      "action": "set_world_position",
      "title": "设世界位置",
      "input": {
        "action": "set_world_position",
        "uuid": "<uuid>",
        "x": 0,
        "y": 500,
        "z": 0
      },
      "expected": "世界坐标设为 (0,500,0)",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "uuid(REQUIRED), x/y/z(REQUIRED). Set WORLD position.",
        "zhActionDescription": "uuid（必填），x/y/z（必填）。设置世界坐标。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 set_world_position 动作，处理“设世界位置”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 x 设为 0，把 y 设为 500，把 z 设为 0。调用完成后重点检查：世界坐标设为 (0,500,0)。",
          "actionGoal": "设置世界坐标",
          "scenarioType": "参数场景",
          "scenarioTitle": "设世界位置",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.set_world_position",
          "fullPayload": "{\"action\":\"set_world_position\",\"uuid\":\"<uuid>\",\"x\":0,\"y\":500,\"z\":0}",
          "inputText": "uuid=<uuid>；x=0；y=500；z=0",
          "executionStep": "调用 scene_operation.set_world_position",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 x 设为 0，把 y 设为 500，把 z 设为 0。",
          "verificationFocus": "世界坐标设为 (0,500,0)",
          "expectedText": "世界坐标设为 (0,500,0)"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 set_world_position 动作，处理“设世界位置”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 x 设为 0，把 y 设为 500，把 z 设为 0。调用完成后重点检查：世界坐标设为 (0,500,0)。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 13,
        "note": "来自 tests/test-report.json，自动化执行通过（13ms）"
      }
    },
    {
      "id": 86,
      "tool": "scene_operation",
      "action": "set_world_rotation",
      "title": "设世界旋转",
      "input": {
        "action": "set_world_rotation",
        "uuid": "<uuid>",
        "x": 0,
        "y": 90,
        "z": 0
      },
      "expected": "世界旋转 (0,90,0)",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "uuid(REQUIRED), x/y/z(REQUIRED). Set WORLD euler rotation.",
        "zhActionDescription": "uuid（必填），x/y/z（必填）。设置世界欧拉旋转。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 set_world_rotation 动作，处理“设世界旋转”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 x 设为 0，把 y 设为 90，把 z 设为 0。调用完成后重点检查：世界旋转 (0,90,0)。",
          "actionGoal": "设置世界欧拉旋转",
          "scenarioType": "参数场景",
          "scenarioTitle": "设世界旋转",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.set_world_rotation",
          "fullPayload": "{\"action\":\"set_world_rotation\",\"uuid\":\"<uuid>\",\"x\":0,\"y\":90,\"z\":0}",
          "inputText": "uuid=<uuid>；x=0；y=90；z=0",
          "executionStep": "调用 scene_operation.set_world_rotation",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 x 设为 0，把 y 设为 90，把 z 设为 0。",
          "verificationFocus": "世界旋转 (0,90,0)",
          "expectedText": "世界旋转 (0,90,0)"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 set_world_rotation 动作，处理“设世界旋转”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 x 设为 0，把 y 设为 90，把 z 设为 0。调用完成后重点检查：世界旋转 (0,90,0)。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 27,
        "note": "来自 tests/test-report.json，自动化执行通过（27ms）"
      }
    },
    {
      "id": 87,
      "tool": "scene_operation",
      "action": "set_world_scale",
      "title": "设世界缩放",
      "input": {
        "action": "set_world_scale",
        "uuid": "<uuid>",
        "x": 1,
        "y": 1,
        "z": 1
      },
      "expected": "世界缩放归一",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "uuid(REQUIRED), x/y/z(REQUIRED). Set WORLD scale.",
        "zhActionDescription": "uuid（必填），x/y/z（必填）。设置世界缩放。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 set_world_scale 动作，处理“设世界缩放”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 x 设为 1，把 y 设为 1，把 z 设为 1。调用完成后重点检查：世界缩放归一。",
          "actionGoal": "设置世界缩放",
          "scenarioType": "参数场景",
          "scenarioTitle": "设世界缩放",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.set_world_scale",
          "fullPayload": "{\"action\":\"set_world_scale\",\"uuid\":\"<uuid>\",\"x\":1,\"y\":1,\"z\":1}",
          "inputText": "uuid=<uuid>；x=1；y=1；z=1",
          "executionStep": "调用 scene_operation.set_world_scale",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 x 设为 1，把 y 设为 1，把 z 设为 1。",
          "verificationFocus": "世界缩放归一",
          "expectedText": "世界缩放归一"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 set_world_scale 动作，处理“设世界缩放”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 x 设为 1，把 y 设为 1，把 z 设为 1。调用完成后重点检查：世界缩放归一。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 11,
        "note": "来自 tests/test-report.json，自动化执行通过（11ms）"
      }
    },
    {
      "id": 88,
      "tool": "scene_operation",
      "action": "reset_transform",
      "title": "重置全部",
      "input": {
        "action": "reset_transform",
        "uuid": "<uuid>"
      },
      "expected": "位置/旋转/缩放全部归零",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "uuid(REQUIRED). Reset position/rotation/scale to defaults. resetPosition/resetRotation/resetScale(optional, default true).",
        "zhActionDescription": "uuid（必填）。Reset position/rotation/scale to defaults. resetPosition/resetRotation/resetScale(optional, default true)。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 reset_transform 动作，处理“重置全部”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：位置/旋转/缩放全部归零。",
          "actionGoal": "Reset position/rotation/scale to defaults",
          "scenarioType": "参数场景",
          "scenarioTitle": "重置全部",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.reset_transform",
          "fullPayload": "{\"action\":\"reset_transform\",\"uuid\":\"<uuid>\"}",
          "inputText": "uuid=<uuid>",
          "executionStep": "调用 scene_operation.reset_transform",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>。",
          "verificationFocus": "位置/旋转/缩放全部归零",
          "expectedText": "位置/旋转/缩放全部归零"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 reset_transform 动作，处理“重置全部”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：位置/旋转/缩放全部归零。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 41,
        "note": "来自 tests/test-report.json，自动化执行通过（41ms）"
      }
    },
    {
      "id": 89,
      "tool": "scene_operation",
      "action": "reset_transform",
      "title": "仅重置位置",
      "input": {
        "action": "reset_transform",
        "uuid": "<uuid>",
        "resetRotation": false,
        "resetScale": false
      },
      "expected": "仅位置归零",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "uuid(REQUIRED). Reset position/rotation/scale to defaults. resetPosition/resetRotation/resetScale(optional, default true).",
        "zhActionDescription": "uuid（必填）。Reset position/rotation/scale to defaults. resetPosition/resetRotation/resetScale(optional, default true)。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 reset_transform 动作，处理“仅重置位置”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 resetRotation 设为 false，把 resetScale 设为 false。调用完成后重点检查：仅位置归零。",
          "actionGoal": "Reset position/rotation/scale to defaults",
          "scenarioType": "参数场景",
          "scenarioTitle": "仅重置位置",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.reset_transform",
          "fullPayload": "{\"action\":\"reset_transform\",\"uuid\":\"<uuid>\",\"resetRotation\":false,\"resetScale\":false}",
          "inputText": "uuid=<uuid>；resetRotation=false；resetScale=false",
          "executionStep": "调用 scene_operation.reset_transform",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 resetRotation 设为 false，把 resetScale 设为 false。",
          "verificationFocus": "仅位置归零",
          "expectedText": "仅位置归零"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 reset_transform 动作，处理“仅重置位置”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 resetRotation 设为 false，把 resetScale 设为 false。调用完成后重点检查：仅位置归零。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 26,
        "note": "来自 tests/test-report.json，自动化执行通过（26ms）"
      }
    },
    {
      "id": 90,
      "tool": "scene_operation",
      "action": "set_name",
      "title": "重命名",
      "input": {
        "action": "set_name",
        "uuid": "<uuid>",
        "name": "NewName"
      },
      "expected": "节点名变为 NewName",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "uuid(REQUIRED), name(REQUIRED). Rename a node.",
        "zhActionDescription": "uuid（必填），name（必填）。重命名节点。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 set_name 动作，处理“重命名”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 name 设为“NewName”。调用完成后重点检查：节点名变为 NewName。",
          "actionGoal": "重命名节点",
          "scenarioType": "参数场景",
          "scenarioTitle": "重命名",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.set_name",
          "fullPayload": "{\"action\":\"set_name\",\"uuid\":\"<uuid>\",\"name\":\"NewName\"}",
          "inputText": "uuid=<uuid>；name=NewName",
          "executionStep": "调用 scene_operation.set_name",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 name 设为“NewName”。",
          "verificationFocus": "节点名变为 NewName",
          "expectedText": "节点名变为 NewName"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 set_name 动作，处理“重命名”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 name 设为“NewName”。调用完成后重点检查：节点名变为 NewName。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 11,
        "note": "来自 tests/test-report.json，自动化执行通过（11ms）"
      }
    },
    {
      "id": 91,
      "tool": "scene_operation",
      "action": "set_active",
      "title": "禁用",
      "input": {
        "action": "set_active",
        "uuid": "<uuid>",
        "active": false
      },
      "expected": "节点及子节点不再渲染",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "uuid(REQUIRED), active(REQUIRED). Enable/disable a node.",
        "zhActionDescription": "uuid（必填），active（必填）。启用或禁用节点。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 set_active 动作，处理“禁用”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 active 设为 false。调用完成后重点检查：节点及子节点不再渲染。",
          "actionGoal": "启用或禁用节点",
          "scenarioType": "参数场景",
          "scenarioTitle": "禁用",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.set_active",
          "fullPayload": "{\"action\":\"set_active\",\"uuid\":\"<uuid>\",\"active\":false}",
          "inputText": "uuid=<uuid>；active=false",
          "executionStep": "调用 scene_operation.set_active",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 active 设为 false。",
          "verificationFocus": "节点及子节点不再渲染",
          "expectedText": "节点及子节点不再渲染"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 set_active 动作，处理“禁用”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 active 设为 false。调用完成后重点检查：节点及子节点不再渲染。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 17,
        "note": "来自 tests/test-report.json，自动化执行通过（17ms）"
      }
    },
    {
      "id": 92,
      "tool": "scene_operation",
      "action": "set_active",
      "title": "启用",
      "input": {
        "action": "set_active",
        "uuid": "<uuid>",
        "active": true
      },
      "expected": "节点恢复激活",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "uuid(REQUIRED), active(REQUIRED). Enable/disable a node.",
        "zhActionDescription": "uuid（必填），active（必填）。启用或禁用节点。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 set_active 动作，处理“启用”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 active 设为 true。调用完成后重点检查：节点恢复激活。",
          "actionGoal": "启用或禁用节点",
          "scenarioType": "参数场景",
          "scenarioTitle": "启用",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.set_active",
          "fullPayload": "{\"action\":\"set_active\",\"uuid\":\"<uuid>\",\"active\":true}",
          "inputText": "uuid=<uuid>；active=true",
          "executionStep": "调用 scene_operation.set_active",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 active 设为 true。",
          "verificationFocus": "节点恢复激活",
          "expectedText": "节点恢复激活"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 set_active 动作，处理“启用”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 active 设为 true。调用完成后重点检查：节点恢复激活。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 34,
        "note": "来自 tests/test-report.json，自动化执行通过（34ms）"
      }
    },
    {
      "id": 93,
      "tool": "scene_operation",
      "action": "set_layer",
      "title": "设为 UI_2D",
      "input": {
        "action": "set_layer",
        "uuid": "<uuid>",
        "layer": 33554432
      },
      "expected": "Layer→UI_2D",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 set_layer 动作，处理“设为 UI_2D”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 layer 设为 33554432。调用完成后重点检查：Layer→UI_2D。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "设为 UI_2D",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.set_layer",
          "fullPayload": "{\"action\":\"set_layer\",\"uuid\":\"<uuid>\",\"layer\":33554432}",
          "inputText": "uuid=<uuid>；layer=33554432",
          "executionStep": "调用 scene_operation.set_layer",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 layer 设为 33554432。",
          "verificationFocus": "Layer→UI_2D",
          "expectedText": "Layer→UI_2D"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 set_layer 动作，处理“设为 UI_2D”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 layer 设为 33554432。调用完成后重点检查：Layer→UI_2D。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 12,
        "note": "来自 tests/test-report.json，自动化执行通过（12ms）"
      }
    },
    {
      "id": 94,
      "tool": "scene_operation",
      "action": "set_anchor_point",
      "title": "锚点左上角",
      "input": {
        "action": "set_anchor_point",
        "uuid": "<uuid>",
        "anchorX": 0,
        "anchorY": 1
      },
      "expected": "锚点变为 (0,1)",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "uuid(REQUIRED), anchorX/anchorY(optional, default 0.5). Set UITransform anchor point directly.",
        "zhActionDescription": "uuid（必填），anchorX/anchorY（可选，默认 0.5）。直接设置 UITransform 锚点。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 set_anchor_point 动作，处理“锚点左上角”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 anchorX 设为 0，把 anchorY 设为 1。调用完成后重点检查：锚点变为 (0,1)。",
          "actionGoal": "5）",
          "scenarioType": "参数场景",
          "scenarioTitle": "锚点左上角",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.set_anchor_point",
          "fullPayload": "{\"action\":\"set_anchor_point\",\"uuid\":\"<uuid>\",\"anchorX\":0,\"anchorY\":1}",
          "inputText": "uuid=<uuid>；anchorX=0；anchorY=1",
          "executionStep": "调用 scene_operation.set_anchor_point",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 anchorX 设为 0，把 anchorY 设为 1。",
          "verificationFocus": "锚点变为 (0,1)",
          "expectedText": "锚点变为 (0,1)"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 set_anchor_point 动作，处理“锚点左上角”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 anchorX 设为 0，把 anchorY 设为 1。调用完成后重点检查：锚点变为 (0,1)。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 48,
        "note": "来自 tests/test-report.json，自动化执行通过（48ms）"
      }
    },
    {
      "id": 95,
      "tool": "scene_operation",
      "action": "set_content_size",
      "title": "设尺寸",
      "input": {
        "action": "set_content_size",
        "uuid": "<uuid>",
        "width": 400,
        "height": 300
      },
      "expected": "UITransform 400×300",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "uuid(REQUIRED), width(REQUIRED), height(REQUIRED). Set UITransform content size directly.",
        "zhActionDescription": "uuid（必填），width（必填），height（必填）。直接设置 UITransform 内容尺寸。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 set_content_size 动作，处理“设尺寸”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 width 设为 400，把 height 设为 300。调用完成后重点检查：UITransform 400×300。",
          "actionGoal": "直接设置 UITransform 内容尺寸",
          "scenarioType": "参数场景",
          "scenarioTitle": "设尺寸",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.set_content_size",
          "fullPayload": "{\"action\":\"set_content_size\",\"uuid\":\"<uuid>\",\"width\":400,\"height\":300}",
          "inputText": "uuid=<uuid>；width=400；height=300",
          "executionStep": "调用 scene_operation.set_content_size",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 width 设为 400，把 height 设为 300。",
          "verificationFocus": "UITransform 400×300",
          "expectedText": "UITransform 400×300"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 set_content_size 动作，处理“设尺寸”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 width 设为 400，把 height 设为 300。调用完成后重点检查：UITransform 400×300。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 67,
        "note": "来自 tests/test-report.json，自动化执行通过（67ms）"
      }
    },
    {
      "id": 96,
      "tool": "scene_operation",
      "action": "move_node_up",
      "title": "上移一位",
      "input": {
        "action": "move_node_up",
        "uuid": "<uuid>"
      },
      "expected": "兄弟列表中上移",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "uuid(REQUIRED). Reorder in sibling list.",
        "zhActionDescription": "uuid（必填）。调整同级列表中的顺序。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 move_node_up 动作，处理“上移一位”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：兄弟列表中上移。",
          "actionGoal": "调整同级列表中的顺序",
          "scenarioType": "参数场景",
          "scenarioTitle": "上移一位",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.move_node_up",
          "fullPayload": "{\"action\":\"move_node_up\",\"uuid\":\"<uuid>\"}",
          "inputText": "uuid=<uuid>",
          "executionStep": "调用 scene_operation.move_node_up",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>。",
          "verificationFocus": "兄弟列表中上移",
          "expectedText": "兄弟列表中上移"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 move_node_up 动作，处理“上移一位”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：兄弟列表中上移。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 34,
        "note": "来自 tests/test-report.json，自动化执行通过（34ms）"
      }
    },
    {
      "id": 97,
      "tool": "scene_operation",
      "action": "move_node_down",
      "title": "下移一位",
      "input": {
        "action": "move_node_down",
        "uuid": "<uuid>"
      },
      "expected": "兄弟列表中下移",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "uuid(REQUIRED). Reorder in sibling list.",
        "zhActionDescription": "uuid（必填）。调整同级列表中的顺序。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 move_node_down 动作，处理“下移一位”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：兄弟列表中下移。",
          "actionGoal": "调整同级列表中的顺序",
          "scenarioType": "参数场景",
          "scenarioTitle": "下移一位",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.move_node_down",
          "fullPayload": "{\"action\":\"move_node_down\",\"uuid\":\"<uuid>\"}",
          "inputText": "uuid=<uuid>",
          "executionStep": "调用 scene_operation.move_node_down",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>。",
          "verificationFocus": "兄弟列表中下移",
          "expectedText": "兄弟列表中下移"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 move_node_down 动作，处理“下移一位”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：兄弟列表中下移。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 19,
        "note": "来自 tests/test-report.json，自动化执行通过（19ms）"
      }
    },
    {
      "id": 98,
      "tool": "scene_operation",
      "action": "set_sibling_index",
      "title": "设排序",
      "input": {
        "action": "set_sibling_index",
        "uuid": "<uuid>",
        "index": 0
      },
      "expected": "移到第一位",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "uuid(REQUIRED), index(REQUIRED). Set exact sibling position (0-based).",
        "zhActionDescription": "uuid（必填），index（必填）。设置精确的同级位置（从 0 开始）。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 set_sibling_index 动作，处理“设排序”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 index 设为 0。调用完成后重点检查：移到第一位。",
          "actionGoal": "设置精确的同级位置（从 0 开始）",
          "scenarioType": "参数场景",
          "scenarioTitle": "设排序",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.set_sibling_index",
          "fullPayload": "{\"action\":\"set_sibling_index\",\"uuid\":\"<uuid>\",\"index\":0}",
          "inputText": "uuid=<uuid>；index=0",
          "executionStep": "调用 scene_operation.set_sibling_index",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 index 设为 0。",
          "verificationFocus": "移到第一位",
          "expectedText": "移到第一位"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 set_sibling_index 动作，处理“设排序”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 index 设为 0。调用完成后重点检查：移到第一位。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 11,
        "note": "来自 tests/test-report.json，自动化执行通过（11ms）"
      }
    },
    {
      "id": 99,
      "tool": "scene_operation",
      "action": "lock_node",
      "title": "锁定",
      "input": {
        "action": "lock_node",
        "uuid": "<uuid>"
      },
      "expected": "层级面板中锁定",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 lock_node 动作，处理“锁定”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：层级面板中锁定。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "锁定",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.lock_node",
          "fullPayload": "{\"action\":\"lock_node\",\"uuid\":\"<uuid>\"}",
          "inputText": "uuid=<uuid>",
          "executionStep": "调用 scene_operation.lock_node",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>。",
          "verificationFocus": "层级面板中锁定",
          "expectedText": "层级面板中锁定"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 lock_node 动作，处理“锁定”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：层级面板中锁定。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 8,
        "note": "来自 tests/test-report.json，自动化执行通过（8ms）"
      }
    },
    {
      "id": 100,
      "tool": "scene_operation",
      "action": "unlock_node",
      "title": "解锁",
      "input": {
        "action": "unlock_node",
        "uuid": "<uuid>"
      },
      "expected": "解除锁定",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 unlock_node 动作，处理“解锁”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：解除锁定。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "解锁",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.unlock_node",
          "fullPayload": "{\"action\":\"unlock_node\",\"uuid\":\"<uuid>\"}",
          "inputText": "uuid=<uuid>",
          "executionStep": "调用 scene_operation.unlock_node",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>。",
          "verificationFocus": "解除锁定",
          "expectedText": "解除锁定"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 unlock_node 动作，处理“解锁”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：解除锁定。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 9,
        "note": "来自 tests/test-report.json，自动化执行通过（9ms）"
      }
    },
    {
      "id": 101,
      "tool": "scene_operation",
      "action": "hide_node",
      "title": "隐藏",
      "input": {
        "action": "hide_node",
        "uuid": "<uuid>"
      },
      "expected": "编辑器中不可见（运行时不影响）",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 hide_node 动作，处理“隐藏”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：编辑器中不可见（运行时不影响）。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "隐藏",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.hide_node",
          "fullPayload": "{\"action\":\"hide_node\",\"uuid\":\"<uuid>\"}",
          "inputText": "uuid=<uuid>",
          "executionStep": "调用 scene_operation.hide_node",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>。",
          "verificationFocus": "编辑器中不可见（运行时不影响）",
          "expectedText": "编辑器中不可见（运行时不影响）"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 hide_node 动作，处理“隐藏”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：编辑器中不可见（运行时不影响）。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 12,
        "note": "来自 tests/test-report.json，自动化执行通过（12ms）"
      }
    },
    {
      "id": 102,
      "tool": "scene_operation",
      "action": "unhide_node",
      "title": "取消隐藏",
      "input": {
        "action": "unhide_node",
        "uuid": "<uuid>"
      },
      "expected": "恢复可见",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 unhide_node 动作，处理“取消隐藏”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：恢复可见。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "取消隐藏",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.unhide_node",
          "fullPayload": "{\"action\":\"unhide_node\",\"uuid\":\"<uuid>\"}",
          "inputText": "uuid=<uuid>",
          "executionStep": "调用 scene_operation.unhide_node",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>。",
          "verificationFocus": "恢复可见",
          "expectedText": "恢复可见"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 unhide_node 动作，处理“取消隐藏”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：恢复可见。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 23,
        "note": "来自 tests/test-report.json，自动化执行通过（23ms）"
      }
    },
    {
      "id": 103,
      "tool": "scene_operation",
      "action": "add_component",
      "title": "添加 Sprite",
      "input": {
        "action": "add_component",
        "uuid": "<uuid>",
        "component": "Sprite"
      },
      "expected": "成功添加",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "uuid(REQUIRED), component(REQUIRED, e.g. \"Sprite\",\"Label\",\"RigidBody2D\"). Add component.",
        "zhActionDescription": "uuid（必填），component（必填，例如 \"Sprite\"、\"Label\"、\"RigidBody2D\"）。添加组件。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 add_component 动作，处理“添加 Sprite”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 component 设为“Sprite”。调用完成后重点检查：成功添加。",
          "actionGoal": "添加组件",
          "scenarioType": "参数场景",
          "scenarioTitle": "添加 Sprite",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.add_component",
          "fullPayload": "{\"action\":\"add_component\",\"uuid\":\"<uuid>\",\"component\":\"Sprite\"}",
          "inputText": "uuid=<uuid>；component=Sprite",
          "executionStep": "调用 scene_operation.add_component",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 component 设为“Sprite”。",
          "verificationFocus": "成功添加",
          "expectedText": "成功添加"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 add_component 动作，处理“添加 Sprite”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 component 设为“Sprite”。调用完成后重点检查：成功添加。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 11,
        "note": "来自 tests/test-report.json，自动化执行通过（11ms）"
      }
    },
    {
      "id": 104,
      "tool": "scene_operation",
      "action": "add_component",
      "title": "添加自定义脚本",
      "input": {
        "action": "add_component",
        "uuid": "<uuid>",
        "component": "PlayerController"
      },
      "expected": "添加脚本组件",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "uuid(REQUIRED), component(REQUIRED, e.g. \"Sprite\",\"Label\",\"RigidBody2D\"). Add component.",
        "zhActionDescription": "uuid（必填），component（必填，例如 \"Sprite\"、\"Label\"、\"RigidBody2D\"）。添加组件。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 add_component 动作，处理“添加自定义脚本”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 component 设为“PlayerController”。调用完成后重点检查：添加脚本组件。",
          "actionGoal": "添加组件",
          "scenarioType": "参数场景",
          "scenarioTitle": "添加自定义脚本",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.add_component",
          "fullPayload": "{\"action\":\"add_component\",\"uuid\":\"<uuid>\",\"component\":\"PlayerController\"}",
          "inputText": "uuid=<uuid>；component=PlayerController",
          "executionStep": "调用 scene_operation.add_component",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 component 设为“PlayerController”。",
          "verificationFocus": "添加脚本组件",
          "expectedText": "添加脚本组件"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 add_component 动作，处理“添加自定义脚本”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 component 设为“PlayerController”。调用完成后重点检查：添加脚本组件。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 7,
        "note": "来自 tests/test-report.json，自动化执行通过（7ms）"
      }
    },
    {
      "id": 105,
      "tool": "scene_operation",
      "action": "remove_component",
      "title": "移除组件",
      "input": {
        "action": "remove_component",
        "uuid": "<uuid>",
        "component": "Sprite"
      },
      "expected": "移除 Sprite",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "uuid(REQUIRED), component(REQUIRED). Remove component from node.",
        "zhActionDescription": "uuid（必填），component（必填）。从节点上移除组件。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 remove_component 动作，处理“移除组件”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 component 设为“Sprite”。调用完成后重点检查：移除 Sprite。",
          "actionGoal": "从节点上移除组件",
          "scenarioType": "参数场景",
          "scenarioTitle": "移除组件",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.remove_component",
          "fullPayload": "{\"action\":\"remove_component\",\"uuid\":\"<uuid>\",\"component\":\"Sprite\"}",
          "inputText": "uuid=<uuid>；component=Sprite",
          "executionStep": "调用 scene_operation.remove_component",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 component 设为“Sprite”。",
          "verificationFocus": "移除 Sprite",
          "expectedText": "移除 Sprite"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 remove_component 动作，处理“移除组件”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 component 设为“Sprite”。调用完成后重点检查：移除 Sprite。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 53,
        "note": "来自 tests/test-report.json，自动化执行通过（53ms）"
      }
    },
    {
      "id": 106,
      "tool": "scene_operation",
      "action": "set_property",
      "title": "设 Label 文本",
      "input": {
        "action": "set_property",
        "uuid": "<uuid>",
        "component": "Label",
        "property": "string",
        "value": "Hello"
      },
      "expected": "显示文字变为 Hello",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "uuid(REQUIRED), component(REQUIRED), property(REQUIRED), value(REQUIRED). Set a component property.",
        "zhActionDescription": "uuid（必填），component（必填），property（必填），value（必填）。设置组件属性。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 set_property 动作，处理“设 Label 文本”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 component 设为“Label”，把 property 设为“string”，把 value 设为“Hello”。调用完成后重点检查：显示文字变为 Hello。",
          "actionGoal": "设置组件属性",
          "scenarioType": "参数场景",
          "scenarioTitle": "设 Label 文本",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.set_property",
          "fullPayload": "{\"action\":\"set_property\",\"uuid\":\"<uuid>\",\"component\":\"Label\",\"property\":\"string\",\"value\":\"Hello\"}",
          "inputText": "uuid=<uuid>；component=Label；property=string；value=Hello",
          "executionStep": "调用 scene_operation.set_property",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 component 设为“Label”，把 property 设为“string”，把 value 设为“Hello”。",
          "verificationFocus": "显示文字变为 Hello",
          "expectedText": "显示文字变为 Hello"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 set_property 动作，处理“设 Label 文本”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 component 设为“Label”，把 property 设为“string”，把 value 设为“Hello”。调用完成后重点检查：显示文字变为 Hello。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 117,
        "note": "来自 tests/test-report.json，自动化执行通过（117ms）"
      }
    },
    {
      "id": 107,
      "tool": "scene_operation",
      "action": "set_property",
      "title": "设颜色",
      "input": {
        "action": "set_property",
        "uuid": "<uuid>",
        "component": "Sprite",
        "property": "color",
        "value": {
          "r": 255,
          "g": 0,
          "b": 0,
          "a": 255
        }
      },
      "expected": "变为红色",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "uuid(REQUIRED), component(REQUIRED), property(REQUIRED), value(REQUIRED). Set a component property.",
        "zhActionDescription": "uuid（必填），component（必填），property（必填），value（必填）。设置组件属性。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 set_property 动作，处理“设颜色”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 component 设为“Sprite”，把 property 设为“color”，传入 value={\"r\":255,\"g\":0,\"b\":0,\"a\":255}。调用完成后重点检查：变为红色。",
          "actionGoal": "设置组件属性",
          "scenarioType": "参数场景",
          "scenarioTitle": "设颜色",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.set_property",
          "fullPayload": "{\"action\":\"set_property\",\"uuid\":\"<uuid>\",\"component\":\"Sprite\",\"property\":\"color\",\"value\":{\"r\":255,\"g\":0,\"b\":0,\"a\":255}}",
          "inputText": "uuid=<uuid>；component=Sprite；property=color；value={\"r\":255,\"g\":0,\"b\":0,\"a\":255}",
          "executionStep": "调用 scene_operation.set_property",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 component 设为“Sprite”，把 property 设为“color”，传入 value={\"r\":255,\"g\":0,\"b\":0,\"a\":255}。",
          "verificationFocus": "变为红色",
          "expectedText": "变为红色"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 set_property 动作，处理“设颜色”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 component 设为“Sprite”，把 property 设为“color”，传入 value={\"r\":255,\"g\":0,\"b\":0,\"a\":255}。调用完成后重点检查：变为红色。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 25,
        "note": "来自 tests/test-report.json，自动化执行通过（25ms）"
      }
    },
    {
      "id": 108,
      "tool": "scene_operation",
      "action": "reset_property",
      "title": "重置属性",
      "input": {
        "action": "reset_property",
        "uuid": "<uuid>",
        "component": "Label",
        "property": "fontSize"
      },
      "expected": "fontSize 恢复默认",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "uuid(REQUIRED), component(REQUIRED), property(REQUIRED). Reset property to default.",
        "zhActionDescription": "uuid（必填），component（必填），property（必填）。将属性重置为默认值。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 reset_property 动作，处理“重置属性”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 component 设为“Label”，把 property 设为“fontSize”。调用完成后重点检查：fontSize 恢复默认。",
          "actionGoal": "将属性重置为默认值",
          "scenarioType": "参数场景",
          "scenarioTitle": "重置属性",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.reset_property",
          "fullPayload": "{\"action\":\"reset_property\",\"uuid\":\"<uuid>\",\"component\":\"Label\",\"property\":\"fontSize\"}",
          "inputText": "uuid=<uuid>；component=Label；property=fontSize",
          "executionStep": "调用 scene_operation.reset_property",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 component 设为“Label”，把 property 设为“fontSize”。",
          "verificationFocus": "fontSize 恢复默认",
          "expectedText": "fontSize 恢复默认"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 reset_property 动作，处理“重置属性”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 component 设为“Label”，把 property 设为“fontSize”。调用完成后重点检查：fontSize 恢复默认。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 9,
        "note": "来自 tests/test-report.json，自动化执行通过（9ms）"
      }
    },
    {
      "id": 109,
      "tool": "scene_operation",
      "action": "reset_node_properties",
      "title": "重置全部",
      "input": {
        "action": "reset_node_properties",
        "uuid": "<uuid>"
      },
      "expected": "所有组件属性恢复默认",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "uuid(REQUIRED), component(optional). Reset all component properties to defaults. If component specified, only reset that component.",
        "zhActionDescription": "uuid（必填），component（可选）。将所有组件属性重置为默认值。如果传入 component，则只重置该组件。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 reset_node_properties 动作，处理“重置全部”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：所有组件属性恢复默认。",
          "actionGoal": "将所有组件属性重置为默认值",
          "scenarioType": "参数场景",
          "scenarioTitle": "重置全部",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.reset_node_properties",
          "fullPayload": "{\"action\":\"reset_node_properties\",\"uuid\":\"<uuid>\"}",
          "inputText": "uuid=<uuid>",
          "executionStep": "调用 scene_operation.reset_node_properties",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>。",
          "verificationFocus": "所有组件属性恢复默认",
          "expectedText": "所有组件属性恢复默认"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 reset_node_properties 动作，处理“重置全部”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：所有组件属性恢复默认。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 23,
        "note": "来自 tests/test-report.json，自动化执行通过（23ms）"
      }
    },
    {
      "id": 110,
      "tool": "scene_operation",
      "action": "reset_node_properties",
      "title": "重置指定",
      "input": {
        "action": "reset_node_properties",
        "uuid": "<uuid>",
        "component": "Sprite"
      },
      "expected": "仅 Sprite 属性重置",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "uuid(REQUIRED), component(optional). Reset all component properties to defaults. If component specified, only reset that component.",
        "zhActionDescription": "uuid（必填），component（可选）。将所有组件属性重置为默认值。如果传入 component，则只重置该组件。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 reset_node_properties 动作，处理“重置指定”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 component 设为“Sprite”。调用完成后重点检查：仅 Sprite 属性重置。",
          "actionGoal": "将所有组件属性重置为默认值",
          "scenarioType": "参数场景",
          "scenarioTitle": "重置指定",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.reset_node_properties",
          "fullPayload": "{\"action\":\"reset_node_properties\",\"uuid\":\"<uuid>\",\"component\":\"Sprite\"}",
          "inputText": "uuid=<uuid>；component=Sprite",
          "executionStep": "调用 scene_operation.reset_node_properties",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 component 设为“Sprite”。",
          "verificationFocus": "仅 Sprite 属性重置",
          "expectedText": "仅 Sprite 属性重置"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 reset_node_properties 动作，处理“重置指定”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 component 设为“Sprite”。调用完成后重点检查：仅 Sprite 属性重置。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 65,
        "note": "来自 tests/test-report.json，自动化执行通过（65ms）"
      }
    },
    {
      "id": 111,
      "tool": "scene_operation",
      "action": "call_component_method",
      "title": "调用方法",
      "input": {
        "action": "call_component_method",
        "uuid": "<uuid>",
        "component": "Animation",
        "methodName": "play",
        "args": [
          "idle"
        ]
      },
      "expected": "播放 idle 动画",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "uuid(REQUIRED), component(REQUIRED), methodName(REQUIRED), args(optional).",
        "zhActionDescription": "uuid（必填），component（必填），methodName（必填），args（可选）。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 call_component_method 动作，处理“调用方法”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 component 设为“Animation”，把 methodName 设为“play”，传入 args=[\"idle\"]。调用完成后重点检查：播放 idle 动画。",
          "actionGoal": "uuid（必填），component（必填），methodName（必填），args（可选）",
          "scenarioType": "参数场景",
          "scenarioTitle": "调用方法",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.call_component_method",
          "fullPayload": "{\"action\":\"call_component_method\",\"uuid\":\"<uuid>\",\"component\":\"Animation\",\"methodName\":\"play\",\"args\":[\"idle\"]}",
          "inputText": "uuid=<uuid>；component=Animation；methodName=play；args=[\"idle\"]",
          "executionStep": "调用 scene_operation.call_component_method",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 component 设为“Animation”，把 methodName 设为“play”，传入 args=[\"idle\"]。",
          "verificationFocus": "播放 idle 动画",
          "expectedText": "播放 idle 动画"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 call_component_method 动作，处理“调用方法”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 component 设为“Animation”，把 methodName 设为“play”，传入 args=[\"idle\"]。调用完成后重点检查：播放 idle 动画。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 5,
        "note": "来自 tests/test-report.json，自动化执行通过（5ms）"
      }
    },
    {
      "id": 112,
      "tool": "scene_operation",
      "action": "batch_set_property",
      "title": "批量设属性",
      "input": {
        "action": "batch_set_property",
        "uuids": [
          "<a>",
          "<b>"
        ],
        "component": "Label",
        "property": "fontSize",
        "value": 24
      },
      "expected": "两个 Label.fontSize→24",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 batch_set_property 动作，处理“批量设属性”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请传入 uuids=[\"<a>\",\"<b>\"]，把 component 设为“Label”，把 property 设为“fontSize”，把 value 设为 24。调用完成后重点检查：两个 Label.fontSize→24。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "批量设属性",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.batch_set_property",
          "fullPayload": "{\"action\":\"batch_set_property\",\"uuids\":[\"<a>\",\"<b>\"],\"component\":\"Label\",\"property\":\"fontSize\",\"value\":24}",
          "inputText": "uuids=[\"<a>\",\"<b>\"]；component=Label；property=fontSize；value=24",
          "executionStep": "调用 scene_operation.batch_set_property",
          "parameterNarrative": "这次请传入 uuids=[\"<a>\",\"<b>\"]，把 component 设为“Label”，把 property 设为“fontSize”，把 value 设为 24。",
          "verificationFocus": "两个 Label.fontSize→24",
          "expectedText": "两个 Label.fontSize→24"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 batch_set_property 动作，处理“批量设属性”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请传入 uuids=[\"<a>\",\"<b>\"]，把 component 设为“Label”，把 property 设为“fontSize”，把 value 设为 24。调用完成后重点检查：两个 Label.fontSize→24。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 17,
        "note": "来自 tests/test-report.json，自动化执行通过（17ms）"
      }
    },
    {
      "id": 113,
      "tool": "scene_operation",
      "action": "attach_script",
      "title": "一键挂载+设属性",
      "input": {
        "action": "attach_script",
        "uuid": "<uuid>",
        "script": "PlayerController",
        "properties": {
          "speed": 15,
          "maxHp": 100
        }
      },
      "expected": "添加组件+设 speed=15,maxHp=100",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 attach_script 动作，处理“一键挂载+设属性”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 script 设为“PlayerController”，传入 properties={\"speed\":15,\"maxHp\":100}。调用完成后重点检查：添加组件+设 speed=15,maxHp=100。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "一键挂载+设属性",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.attach_script",
          "fullPayload": "{\"action\":\"attach_script\",\"uuid\":\"<uuid>\",\"script\":\"PlayerController\",\"properties\":{\"speed\":15,\"maxHp\":100}}",
          "inputText": "uuid=<uuid>；script=PlayerController；properties={\"speed\":15,\"maxHp\":100}",
          "executionStep": "调用 scene_operation.attach_script",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 script 设为“PlayerController”，传入 properties={\"speed\":15,\"maxHp\":100}。",
          "verificationFocus": "添加组件+设 speed=15,maxHp=100",
          "expectedText": "添加组件+设 speed=15,maxHp=100"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 attach_script 动作，处理“一键挂载+设属性”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 script 设为“PlayerController”，传入 properties={\"speed\":15,\"maxHp\":100}。调用完成后重点检查：添加组件+设 speed=15,maxHp=100。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 44,
        "note": "来自 tests/test-report.json，自动化执行通过（44ms）"
      }
    },
    {
      "id": 114,
      "tool": "scene_operation",
      "action": "attach_script",
      "title": "防重复",
      "input": {
        "action": "attach_script",
        "uuid": "<uuid>",
        "script": "PlayerController"
      },
      "expected": "已存在→{alreadyAttached:true}",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 attach_script 动作，处理“防重复”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 script 设为“PlayerController”。调用完成后重点检查：已存在→{alreadyAttached:true}。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "防重复",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.attach_script",
          "fullPayload": "{\"action\":\"attach_script\",\"uuid\":\"<uuid>\",\"script\":\"PlayerController\"}",
          "inputText": "uuid=<uuid>；script=PlayerController",
          "executionStep": "调用 scene_operation.attach_script",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 script 设为“PlayerController”。",
          "verificationFocus": "已存在→{alreadyAttached:true}",
          "expectedText": "已存在→{alreadyAttached:true}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 attach_script 动作，处理“防重复”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 script 设为“PlayerController”。调用完成后重点检查：已存在→{alreadyAttached:true}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 7,
        "note": "来自 tests/test-report.json，自动化执行通过（7ms）"
      }
    },
    {
      "id": 115,
      "tool": "scene_operation",
      "action": "attach_script",
      "title": "允许重复",
      "input": {
        "action": "attach_script",
        "uuid": "<uuid>",
        "script": "PlayerController",
        "allowDuplicate": true
      },
      "expected": "再添加一个实例",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 attach_script 动作，处理“允许重复”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 script 设为“PlayerController”，把 allowDuplicate 设为 true。调用完成后重点检查：再添加一个实例。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "允许重复",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.attach_script",
          "fullPayload": "{\"action\":\"attach_script\",\"uuid\":\"<uuid>\",\"script\":\"PlayerController\",\"allowDuplicate\":true}",
          "inputText": "uuid=<uuid>；script=PlayerController；allowDuplicate=true",
          "executionStep": "调用 scene_operation.attach_script",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 script 设为“PlayerController”，把 allowDuplicate 设为 true。",
          "verificationFocus": "再添加一个实例",
          "expectedText": "再添加一个实例"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 attach_script 动作，处理“允许重复”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 script 设为“PlayerController”，把 allowDuplicate 设为 true。调用完成后重点检查：再添加一个实例。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 27,
        "note": "来自 tests/test-report.json，自动化执行通过（27ms）"
      }
    },
    {
      "id": 116,
      "tool": "scene_operation",
      "action": "attach_script",
      "title": "脚本未编译",
      "input": {
        "action": "attach_script",
        "uuid": "<uuid>",
        "script": "NewScript"
      },
      "expected": "返回 {error:\"脚本类未注册\"}",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 attach_script 动作，处理“脚本未编译”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 script 设为“NewScript”。调用完成后重点检查：返回 {error:\"脚本类未注册\"}。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "脚本未编译",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.attach_script",
          "fullPayload": "{\"action\":\"attach_script\",\"uuid\":\"<uuid>\",\"script\":\"NewScript\"}",
          "inputText": "uuid=<uuid>；script=NewScript",
          "executionStep": "调用 scene_operation.attach_script",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 script 设为“NewScript”。",
          "verificationFocus": "返回 {error:\"脚本类未注册\"}",
          "expectedText": "返回 {error:\"脚本类未注册\"}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 attach_script 动作，处理“脚本未编译”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 script 设为“NewScript”。调用完成后重点检查：返回 {error:\"脚本类未注册\"}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 44,
        "note": "来自 tests/test-report.json，自动化执行通过（44ms）"
      }
    },
    {
      "id": 117,
      "tool": "scene_operation",
      "action": "set_component_properties",
      "title": "批量设属性",
      "input": {
        "action": "set_component_properties",
        "uuid": "<uuid>",
        "component": "Label",
        "properties": {
          "string": "Hi",
          "fontSize": 32
        }
      },
      "expected": "一次设 string+fontSize",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 set_component_properties 动作，处理“批量设属性”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 component 设为“Label”，传入 properties={\"string\":\"Hi\",\"fontSize\":32}。调用完成后重点检查：一次设 string+fontSize。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "批量设属性",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.set_component_properties",
          "fullPayload": "{\"action\":\"set_component_properties\",\"uuid\":\"<uuid>\",\"component\":\"Label\",\"properties\":{\"string\":\"Hi\",\"fontSize\":32}}",
          "inputText": "uuid=<uuid>；component=Label；properties={\"string\":\"Hi\",\"fontSize\":32}",
          "executionStep": "调用 scene_operation.set_component_properties",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 component 设为“Label”，传入 properties={\"string\":\"Hi\",\"fontSize\":32}。",
          "verificationFocus": "一次设 string+fontSize",
          "expectedText": "一次设 string+fontSize"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 set_component_properties 动作，处理“批量设属性”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 component 设为“Label”，传入 properties={\"string\":\"Hi\",\"fontSize\":32}。调用完成后重点检查：一次设 string+fontSize。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 32,
        "note": "来自 tests/test-report.json，自动化执行通过（32ms）"
      }
    },
    {
      "id": 118,
      "tool": "scene_operation",
      "action": "set_component_properties",
      "title": "部分失败",
      "input": {
        "action": "set_component_properties",
        "uuid": "<uuid>",
        "component": "Sprite",
        "properties": {
          "spriteFrame": "bad",
          "color": {
            "r": 0,
            "g": 255,
            "b": 0,
            "a": 255
          }
        }
      },
      "expected": "color 成功,spriteFrame 报错",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 set_component_properties 动作，处理“部分失败”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 component 设为“Sprite”，传入 properties={\"spriteFrame\":\"bad\",\"color\":{\"r\":0,\"g\":255,\"b\":0,\"a\":255}}。调用完成后重点检查：color 成功,spriteFrame 报错。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "部分失败",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.set_component_properties",
          "fullPayload": "{\"action\":\"set_component_properties\",\"uuid\":\"<uuid>\",\"component\":\"Sprite\",\"properties\":{\"spriteFrame\":\"bad\",\"color\":{\"r\":0,\"g\":255,\"b\":0,\"a\":255}}}",
          "inputText": "uuid=<uuid>；component=Sprite；properties={\"spriteFrame\":\"bad\",\"color\":{\"r\":0,\"g\":255,\"b\":0,\"a\":255}}",
          "executionStep": "调用 scene_operation.set_component_properties",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 component 设为“Sprite”，传入 properties={\"spriteFrame\":\"bad\",\"color\":{\"r\":0,\"g\":255,\"b\":0,\"a\":255}}。",
          "verificationFocus": "color 成功,spriteFrame 报错",
          "expectedText": "color 成功,spriteFrame 报错"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 set_component_properties 动作，处理“部分失败”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 component 设为“Sprite”，传入 properties={\"spriteFrame\":\"bad\",\"color\":{\"r\":0,\"g\":255,\"b\":0,\"a\":255}}。调用完成后重点检查：color 成功,spriteFrame 报错。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 92,
        "note": "来自 tests/test-report.json，自动化执行通过（92ms）"
      }
    },
    {
      "id": 119,
      "tool": "scene_operation",
      "action": "detach_script",
      "title": "移除脚本",
      "input": {
        "action": "detach_script",
        "uuid": "<uuid>",
        "script": "PlayerController"
      },
      "expected": "返回 {success:true}",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 detach_script 动作，处理“移除脚本”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 script 设为“PlayerController”。调用完成后重点检查：返回 {success:true}。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "移除脚本",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.detach_script",
          "fullPayload": "{\"action\":\"detach_script\",\"uuid\":\"<uuid>\",\"script\":\"PlayerController\"}",
          "inputText": "uuid=<uuid>；script=PlayerController",
          "executionStep": "调用 scene_operation.detach_script",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 script 设为“PlayerController”。",
          "verificationFocus": "返回 {success:true}",
          "expectedText": "返回 {success:true}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 detach_script 动作，处理“移除脚本”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 script 设为“PlayerController”。调用完成后重点检查：返回 {success:true}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 21,
        "note": "来自 tests/test-report.json，自动化执行通过（21ms）"
      }
    },
    {
      "id": 120,
      "tool": "scene_operation",
      "action": "detach_script",
      "title": "不存在",
      "input": {
        "action": "detach_script",
        "uuid": "<uuid>",
        "script": "NotExist"
      },
      "expected": "返回 {error:\"没有脚本\"}",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 detach_script 动作，处理“不存在”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 script 设为“NotExist”。调用完成后重点检查：返回 {error:\"没有脚本\"}。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "不存在",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.detach_script",
          "fullPayload": "{\"action\":\"detach_script\",\"uuid\":\"<uuid>\",\"script\":\"NotExist\"}",
          "inputText": "uuid=<uuid>；script=NotExist",
          "executionStep": "调用 scene_operation.detach_script",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 script 设为“NotExist”。",
          "verificationFocus": "返回 {error:\"没有脚本\"}",
          "expectedText": "返回 {error:\"没有脚本\"}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 detach_script 动作，处理“不存在”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 script 设为“NotExist”。调用完成后重点检查：返回 {error:\"没有脚本\"}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 13,
        "note": "来自 tests/test-report.json，自动化执行通过（13ms）"
      }
    },
    {
      "id": 121,
      "tool": "scene_operation",
      "action": "align_nodes",
      "title": "水平居中",
      "input": {
        "action": "align_nodes",
        "uuids": [
          "<a>",
          "<b>",
          "<c>"
        ],
        "alignment": "center_h"
      },
      "expected": "三节点水平居中对齐",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 align_nodes 动作，处理“水平居中”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请传入 uuids=[\"<a>\",\"<b>\",\"<c>\"]，把 alignment 设为“center_h”。调用完成后重点检查：三节点水平居中对齐。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "水平居中",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.align_nodes",
          "fullPayload": "{\"action\":\"align_nodes\",\"uuids\":[\"<a>\",\"<b>\",\"<c>\"],\"alignment\":\"center_h\"}",
          "inputText": "uuids=[\"<a>\",\"<b>\",\"<c>\"]；alignment=center_h",
          "executionStep": "调用 scene_operation.align_nodes",
          "parameterNarrative": "这次请传入 uuids=[\"<a>\",\"<b>\",\"<c>\"]，把 alignment 设为“center_h”。",
          "verificationFocus": "三节点水平居中对齐",
          "expectedText": "三节点水平居中对齐"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 align_nodes 动作，处理“水平居中”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请传入 uuids=[\"<a>\",\"<b>\",\"<c>\"]，把 alignment 设为“center_h”。调用完成后重点检查：三节点水平居中对齐。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 10,
        "note": "来自 tests/test-report.json，自动化执行通过（10ms）"
      }
    },
    {
      "id": 122,
      "tool": "scene_operation",
      "action": "align_nodes",
      "title": "均匀分布",
      "input": {
        "action": "align_nodes",
        "uuids": [
          "<a>",
          "<b>",
          "<c>"
        ],
        "alignment": "distribute_h"
      },
      "expected": "水平均匀分布",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 align_nodes 动作，处理“均匀分布”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请传入 uuids=[\"<a>\",\"<b>\",\"<c>\"]，把 alignment 设为“distribute_h”。调用完成后重点检查：水平均匀分布。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "均匀分布",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.align_nodes",
          "fullPayload": "{\"action\":\"align_nodes\",\"uuids\":[\"<a>\",\"<b>\",\"<c>\"],\"alignment\":\"distribute_h\"}",
          "inputText": "uuids=[\"<a>\",\"<b>\",\"<c>\"]；alignment=distribute_h",
          "executionStep": "调用 scene_operation.align_nodes",
          "parameterNarrative": "这次请传入 uuids=[\"<a>\",\"<b>\",\"<c>\"]，把 alignment 设为“distribute_h”。",
          "verificationFocus": "水平均匀分布",
          "expectedText": "水平均匀分布"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 align_nodes 动作，处理“均匀分布”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请传入 uuids=[\"<a>\",\"<b>\",\"<c>\"]，把 alignment 设为“distribute_h”。调用完成后重点检查：水平均匀分布。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 24,
        "note": "来自 tests/test-report.json，自动化执行通过（24ms）"
      }
    },
    {
      "id": 123,
      "tool": "scene_operation",
      "action": "clipboard_copy",
      "title": "复制",
      "input": {
        "action": "clipboard_copy",
        "uuid": "<uuid>"
      },
      "expected": "节点存入剪贴板",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 clipboard_copy 动作，处理“复制”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：节点存入剪贴板。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "复制",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.clipboard_copy",
          "fullPayload": "{\"action\":\"clipboard_copy\",\"uuid\":\"<uuid>\"}",
          "inputText": "uuid=<uuid>",
          "executionStep": "调用 scene_operation.clipboard_copy",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>。",
          "verificationFocus": "节点存入剪贴板",
          "expectedText": "节点存入剪贴板"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 clipboard_copy 动作，处理“复制”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：节点存入剪贴板。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 21,
        "note": "来自 tests/test-report.json，自动化执行通过（21ms）"
      }
    },
    {
      "id": 124,
      "tool": "scene_operation",
      "action": "clipboard_paste",
      "title": "粘贴",
      "input": {
        "action": "clipboard_paste",
        "parentUuid": "<p>"
      },
      "expected": "从剪贴板粘贴到父节点下",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 clipboard_paste 动作，处理“粘贴”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 parentUuid 指向 <p>。调用完成后重点检查：从剪贴板粘贴到父节点下。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "粘贴",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.clipboard_paste",
          "fullPayload": "{\"action\":\"clipboard_paste\",\"parentUuid\":\"<p>\"}",
          "inputText": "parentUuid=<p>",
          "executionStep": "调用 scene_operation.clipboard_paste",
          "parameterNarrative": "这次请将 parentUuid 指向 <p>。",
          "verificationFocus": "从剪贴板粘贴到父节点下",
          "expectedText": "从剪贴板粘贴到父节点下"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 clipboard_paste 动作，处理“粘贴”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 parentUuid 指向 <p>。调用完成后重点检查：从剪贴板粘贴到父节点下。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 19,
        "note": "来自 tests/test-report.json，自动化执行通过（19ms）"
      }
    },
    {
      "id": 125,
      "tool": "scene_operation",
      "action": "create_prefab",
      "title": "保存预制体",
      "input": {
        "action": "create_prefab",
        "uuid": "<uuid>",
        "savePath": "db://assets/prefabs/Hero.prefab"
      },
      "expected": "保存为 .prefab",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "uuid(REQUIRED), savePath(recommended, e.g. \"db://assets/prefabs/X.prefab\").",
        "zhActionDescription": "uuid（必填），savePath（推荐，例如 \"db://assets/prefabs/X.prefab\"）。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 create_prefab 动作，处理“保存预制体”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 savePath 设为“db://assets/prefabs/Hero.prefab”。调用完成后重点检查：保存为 .prefab。",
          "actionGoal": "prefab\"）",
          "scenarioType": "参数场景",
          "scenarioTitle": "保存预制体",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.create_prefab",
          "fullPayload": "{\"action\":\"create_prefab\",\"uuid\":\"<uuid>\",\"savePath\":\"db://assets/prefabs/Hero.prefab\"}",
          "inputText": "uuid=<uuid>；savePath=db://assets/prefabs/Hero.prefab",
          "executionStep": "调用 scene_operation.create_prefab",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 savePath 设为“db://assets/prefabs/Hero.prefab”。",
          "verificationFocus": "保存为 .prefab",
          "expectedText": "保存为 .prefab"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 create_prefab 动作，处理“保存预制体”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 savePath 设为“db://assets/prefabs/Hero.prefab”。调用完成后重点检查：保存为 .prefab。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 68,
        "note": "来自 tests/test-report.json，自动化执行通过（68ms）"
      }
    },
    {
      "id": 126,
      "tool": "scene_operation",
      "action": "instantiate_prefab",
      "title": "实例化",
      "input": {
        "action": "instantiate_prefab",
        "prefabUrl": "db://assets/prefabs/Hero.prefab"
      },
      "expected": "在场景根创建实例",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "prefabUrl(REQUIRED, db:// path to .prefab file), parentUuid(optional).",
        "zhActionDescription": "prefabUrl（必填，指向 .prefab 文件的 db：// 路径），parentUuid（可选）。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 instantiate_prefab 动作，处理“实例化”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 prefabUrl 设为“db://assets/prefabs/Hero.prefab”。调用完成后重点检查：在场景根创建实例。",
          "actionGoal": "prefab 文件的 db：// 路径），parentUuid（可选）",
          "scenarioType": "参数场景",
          "scenarioTitle": "实例化",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.instantiate_prefab",
          "fullPayload": "{\"action\":\"instantiate_prefab\",\"prefabUrl\":\"db://assets/prefabs/Hero.prefab\"}",
          "inputText": "prefabUrl=db://assets/prefabs/Hero.prefab",
          "executionStep": "调用 scene_operation.instantiate_prefab",
          "parameterNarrative": "这次请把 prefabUrl 设为“db://assets/prefabs/Hero.prefab”。",
          "verificationFocus": "在场景根创建实例",
          "expectedText": "在场景根创建实例"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 instantiate_prefab 动作，处理“实例化”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 prefabUrl 设为“db://assets/prefabs/Hero.prefab”。调用完成后重点检查：在场景根创建实例。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 81,
        "note": "来自 tests/test-report.json，自动化执行通过（81ms）"
      }
    },
    {
      "id": 127,
      "tool": "scene_operation",
      "action": "instantiate_prefab",
      "title": "指定父",
      "input": {
        "action": "instantiate_prefab",
        "prefabUrl": "db://assets/prefabs/Enemy.prefab",
        "parentUuid": "<p>"
      },
      "expected": "在父节点下实例化",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "prefabUrl(REQUIRED, db:// path to .prefab file), parentUuid(optional).",
        "zhActionDescription": "prefabUrl（必填，指向 .prefab 文件的 db：// 路径），parentUuid（可选）。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 instantiate_prefab 动作，处理“指定父”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 prefabUrl 设为“db://assets/prefabs/Enemy.prefab”，将 parentUuid 指向 <p>。调用完成后重点检查：在父节点下实例化。",
          "actionGoal": "prefab 文件的 db：// 路径），parentUuid（可选）",
          "scenarioType": "参数场景",
          "scenarioTitle": "指定父",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.instantiate_prefab",
          "fullPayload": "{\"action\":\"instantiate_prefab\",\"prefabUrl\":\"db://assets/prefabs/Enemy.prefab\",\"parentUuid\":\"<p>\"}",
          "inputText": "prefabUrl=db://assets/prefabs/Enemy.prefab；parentUuid=<p>",
          "executionStep": "调用 scene_operation.instantiate_prefab",
          "parameterNarrative": "这次请把 prefabUrl 设为“db://assets/prefabs/Enemy.prefab”，将 parentUuid 指向 <p>。",
          "verificationFocus": "在父节点下实例化",
          "expectedText": "在父节点下实例化"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 instantiate_prefab 动作，处理“指定父”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 prefabUrl 设为“db://assets/prefabs/Enemy.prefab”，将 parentUuid 指向 <p>。调用完成后重点检查：在父节点下实例化。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 4,
        "note": "来自 tests/test-report.json，自动化执行通过（4ms）"
      }
    },
    {
      "id": 128,
      "tool": "scene_operation",
      "action": "enter_prefab_edit",
      "title": "进入编辑",
      "input": {
        "action": "enter_prefab_edit",
        "uuid": "<prefab>"
      },
      "expected": "进入预制体编辑模式",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "prefabUrl(REQUIRED). Enter prefab editing mode (opens prefab as a scene). Use asset-db open-asset internally.",
        "zhActionDescription": "prefabUrl（必填）。进入预制体编辑模式（将 prefab 作为场景打开）。内部通过 asset-db open-asset 打开资源。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 enter_prefab_edit 动作，处理“进入编辑”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <prefab>。调用完成后重点检查：进入预制体编辑模式。",
          "actionGoal": "进入预制体编辑模式（将 prefab 作为场景打开）",
          "scenarioType": "参数场景",
          "scenarioTitle": "进入编辑",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.enter_prefab_edit",
          "fullPayload": "{\"action\":\"enter_prefab_edit\",\"uuid\":\"<prefab>\"}",
          "inputText": "uuid=<prefab>",
          "executionStep": "调用 scene_operation.enter_prefab_edit",
          "parameterNarrative": "这次请将 uuid 指向 <prefab>。",
          "verificationFocus": "进入预制体编辑模式",
          "expectedText": "进入预制体编辑模式"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 enter_prefab_edit 动作，处理“进入编辑”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <prefab>。调用完成后重点检查：进入预制体编辑模式。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 3,
        "note": "来自 tests/test-report.json，自动化执行通过（3ms）"
      }
    },
    {
      "id": 129,
      "tool": "scene_operation",
      "action": "exit_prefab_edit",
      "title": "退出编辑",
      "input": {
        "action": "exit_prefab_edit"
      },
      "expected": "返回场景编辑模式",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "sceneUrl(optional). Exit prefab editing mode and return to the previous scene. If sceneUrl omitted, opens the most recently opened scene.",
        "zhActionDescription": "sceneUrl（可选）。退出预制体编辑模式并返回上一场景。如果省略 sceneUrl，则打开最近一次打开的场景。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 exit_prefab_edit 动作，处理“退出编辑”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回场景编辑模式。",
          "actionGoal": "退出预制体编辑模式并返回上一场景",
          "scenarioType": "通用场景",
          "scenarioTitle": "退出编辑",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "scene_operation.exit_prefab_edit",
          "fullPayload": "{\"action\":\"exit_prefab_edit\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 scene_operation.exit_prefab_edit",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回场景编辑模式",
          "expectedText": "返回场景编辑模式"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 exit_prefab_edit 动作，处理“退出编辑”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回场景编辑模式。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 15,
        "note": "来自 tests/test-report.json，自动化执行通过（15ms）"
      }
    },
    {
      "id": 130,
      "tool": "scene_operation",
      "action": "apply_prefab",
      "title": "应用更改",
      "input": {
        "action": "apply_prefab",
        "uuid": "<uuid>"
      },
      "expected": "同步到预制体资源",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "uuid(REQUIRED). Apply changes to prefab asset.",
        "zhActionDescription": "uuid（必填）。将修改应用到 prefab 资源。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 apply_prefab 动作，处理“应用更改”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：同步到预制体资源。",
          "actionGoal": "将修改应用到 prefab 资源",
          "scenarioType": "参数场景",
          "scenarioTitle": "应用更改",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.apply_prefab",
          "fullPayload": "{\"action\":\"apply_prefab\",\"uuid\":\"<uuid>\"}",
          "inputText": "uuid=<uuid>",
          "executionStep": "调用 scene_operation.apply_prefab",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>。",
          "verificationFocus": "同步到预制体资源",
          "expectedText": "同步到预制体资源"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 apply_prefab 动作，处理“应用更改”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：同步到预制体资源。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 3249,
        "note": "来自 tests/test-report.json，自动化执行通过（3249ms）"
      }
    },
    {
      "id": 131,
      "tool": "scene_operation",
      "action": "restore_prefab",
      "title": "恢复",
      "input": {
        "action": "restore_prefab",
        "uuid": "<uuid>"
      },
      "expected": "恢复为原始状态",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "uuid(REQUIRED). Restore prefab instance to original.",
        "zhActionDescription": "uuid（必填）。将 prefab 实例恢复为原始状态。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 restore_prefab 动作，处理“恢复”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：恢复为原始状态。",
          "actionGoal": "将 prefab 实例恢复为原始状态",
          "scenarioType": "参数场景",
          "scenarioTitle": "恢复",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.restore_prefab",
          "fullPayload": "{\"action\":\"restore_prefab\",\"uuid\":\"<uuid>\"}",
          "inputText": "uuid=<uuid>",
          "executionStep": "调用 scene_operation.restore_prefab",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>。",
          "verificationFocus": "恢复为原始状态",
          "expectedText": "恢复为原始状态"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 restore_prefab 动作，处理“恢复”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：恢复为原始状态。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 12,
        "note": "来自 tests/test-report.json，自动化执行通过（12ms）"
      }
    },
    {
      "id": 132,
      "tool": "scene_operation",
      "action": "validate_prefab",
      "title": "验证",
      "input": {
        "action": "validate_prefab",
        "prefabUrl": "db://assets/prefabs/Hero.prefab"
      },
      "expected": "检查完整性和依赖",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "prefabUrl(REQUIRED). Check prefab file integrity.",
        "zhActionDescription": "prefabUrl（必填）。检查 prefab 文件完整性。",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 validate_prefab 动作，处理“验证”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 prefabUrl 设为“db://assets/prefabs/Hero.prefab”。调用完成后重点检查：检查完整性和依赖。",
          "actionGoal": "检查 prefab 文件完整性",
          "scenarioType": "参数场景",
          "scenarioTitle": "验证",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.validate_prefab",
          "fullPayload": "{\"action\":\"validate_prefab\",\"prefabUrl\":\"db://assets/prefabs/Hero.prefab\"}",
          "inputText": "prefabUrl=db://assets/prefabs/Hero.prefab",
          "executionStep": "调用 scene_operation.validate_prefab",
          "parameterNarrative": "这次请把 prefabUrl 设为“db://assets/prefabs/Hero.prefab”。",
          "verificationFocus": "检查完整性和依赖",
          "expectedText": "检查完整性和依赖"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 validate_prefab 动作，处理“验证”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 prefabUrl 设为“db://assets/prefabs/Hero.prefab”。调用完成后重点检查：检查完整性和依赖。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 14,
        "note": "来自 tests/test-report.json，自动化执行通过（14ms）"
      }
    },
    {
      "id": 133,
      "tool": "scene_operation",
      "action": "create_ui_widget",
      "title": "创建 Button",
      "input": {
        "action": "create_ui_widget",
        "widgetType": "button",
        "text": "点击"
      },
      "expected": "创建完整 Button 层级",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 create_ui_widget 动作，处理“创建 Button”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 widgetType 设为“button”，把 text 设为“点击”。调用完成后重点检查：创建完整 Button 层级。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "创建 Button",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.create_ui_widget",
          "fullPayload": "{\"action\":\"create_ui_widget\",\"widgetType\":\"button\",\"text\":\"点击\"}",
          "inputText": "widgetType=button；text=点击",
          "executionStep": "调用 scene_operation.create_ui_widget",
          "parameterNarrative": "这次请把 widgetType 设为“button”，把 text 设为“点击”。",
          "verificationFocus": "创建完整 Button 层级",
          "expectedText": "创建完整 Button 层级"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 create_ui_widget 动作，处理“创建 Button”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 widgetType 设为“button”，把 text 设为“点击”。调用完成后重点检查：创建完整 Button 层级。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 43,
        "note": "来自 tests/test-report.json，自动化执行通过（43ms）"
      }
    },
    {
      "id": 134,
      "tool": "scene_operation",
      "action": "create_ui_widget",
      "title": "创建 Label",
      "input": {
        "action": "create_ui_widget",
        "widgetType": "label",
        "text": "Hello"
      },
      "expected": "创建 Label 节点",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 create_ui_widget 动作，处理“创建 Label”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 widgetType 设为“label”，把 text 设为“Hello”。调用完成后重点检查：创建 Label 节点。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "创建 Label",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.create_ui_widget",
          "fullPayload": "{\"action\":\"create_ui_widget\",\"widgetType\":\"label\",\"text\":\"Hello\"}",
          "inputText": "widgetType=label；text=Hello",
          "executionStep": "调用 scene_operation.create_ui_widget",
          "parameterNarrative": "这次请把 widgetType 设为“label”，把 text 设为“Hello”。",
          "verificationFocus": "创建 Label 节点",
          "expectedText": "创建 Label 节点"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 create_ui_widget 动作，处理“创建 Label”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 widgetType 设为“label”，把 text 设为“Hello”。调用完成后重点检查：创建 Label 节点。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 28,
        "note": "来自 tests/test-report.json，自动化执行通过（28ms）"
      }
    },
    {
      "id": 135,
      "tool": "scene_operation",
      "action": "create_ui_widget",
      "title": "创建 Slider",
      "input": {
        "action": "create_ui_widget",
        "widgetType": "slider"
      },
      "expected": "创建 Slider 层级",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 create_ui_widget 动作，处理“创建 Slider”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 widgetType 设为“slider”。调用完成后重点检查：创建 Slider 层级。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "创建 Slider",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.create_ui_widget",
          "fullPayload": "{\"action\":\"create_ui_widget\",\"widgetType\":\"slider\"}",
          "inputText": "widgetType=slider",
          "executionStep": "调用 scene_operation.create_ui_widget",
          "parameterNarrative": "这次请把 widgetType 设为“slider”。",
          "verificationFocus": "创建 Slider 层级",
          "expectedText": "创建 Slider 层级"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 create_ui_widget 动作，处理“创建 Slider”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 widgetType 设为“slider”。调用完成后重点检查：创建 Slider 层级。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 193,
        "note": "来自 tests/test-report.json，自动化执行通过（193ms）"
      }
    },
    {
      "id": 136,
      "tool": "scene_operation",
      "action": "setup_particle",
      "title": "火焰粒子",
      "input": {
        "action": "setup_particle",
        "preset": "fire"
      },
      "expected": "创建火焰效果",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 setup_particle 动作，处理“火焰粒子”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 preset 设为“fire”。调用完成后重点检查：创建火焰效果。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "火焰粒子",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.setup_particle",
          "fullPayload": "{\"action\":\"setup_particle\",\"preset\":\"fire\"}",
          "inputText": "preset=fire",
          "executionStep": "调用 scene_operation.setup_particle",
          "parameterNarrative": "这次请把 preset 设为“fire”。",
          "verificationFocus": "创建火焰效果",
          "expectedText": "创建火焰效果"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 setup_particle 动作，处理“火焰粒子”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 preset 设为“fire”。调用完成后重点检查：创建火焰效果。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 643,
        "note": "来自 tests/test-report.json，自动化执行通过（643ms）"
      }
    },
    {
      "id": 137,
      "tool": "scene_operation",
      "action": "setup_particle",
      "title": "默认粒子",
      "input": {
        "action": "setup_particle"
      },
      "expected": "创建默认粒子节点",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 setup_particle 动作，处理“默认粒子”这个状态场景。这个场景用于验证当前对象状态或默认状态下的表现。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：创建默认粒子节点。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "状态场景",
          "scenarioTitle": "默认粒子",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于验证当前对象状态或默认状态下的表现。",
          "mcpCall": "scene_operation.setup_particle",
          "fullPayload": "{\"action\":\"setup_particle\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 scene_operation.setup_particle",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "创建默认粒子节点",
          "expectedText": "创建默认粒子节点"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 setup_particle 动作，处理“默认粒子”这个状态场景。这个场景用于验证当前对象状态或默认状态下的表现。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：创建默认粒子节点。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 678,
        "note": "来自 tests/test-report.json，自动化执行通过（678ms）"
      }
    },
    {
      "id": 138,
      "tool": "scene_operation",
      "action": "create_skeleton_node",
      "title": "Spine",
      "input": {
        "action": "create_skeleton_node",
        "skeletonType": "spine"
      },
      "expected": "创建 Spine 节点",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 create_skeleton_node 动作，处理“Spine”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 skeletonType 设为“spine”。调用完成后重点检查：创建 Spine 节点。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "Spine",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.create_skeleton_node",
          "fullPayload": "{\"action\":\"create_skeleton_node\",\"skeletonType\":\"spine\"}",
          "inputText": "skeletonType=spine",
          "executionStep": "调用 scene_operation.create_skeleton_node",
          "parameterNarrative": "这次请把 skeletonType 设为“spine”。",
          "verificationFocus": "创建 Spine 节点",
          "expectedText": "创建 Spine 节点"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 create_skeleton_node 动作，处理“Spine”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 skeletonType 设为“spine”。调用完成后重点检查：创建 Spine 节点。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 298,
        "note": "来自 tests/test-report.json，自动化执行通过（298ms）"
      }
    },
    {
      "id": 139,
      "tool": "scene_operation",
      "action": "create_skeleton_node",
      "title": "DragonBones",
      "input": {
        "action": "create_skeleton_node",
        "skeletonType": "dragonbones"
      },
      "expected": "创建龙骨节点",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 create_skeleton_node 动作，处理“DragonBones”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 skeletonType 设为“dragonbones”。调用完成后重点检查：创建龙骨节点。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "DragonBones",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.create_skeleton_node",
          "fullPayload": "{\"action\":\"create_skeleton_node\",\"skeletonType\":\"dragonbones\"}",
          "inputText": "skeletonType=dragonbones",
          "executionStep": "调用 scene_operation.create_skeleton_node",
          "parameterNarrative": "这次请把 skeletonType 设为“dragonbones”。",
          "verificationFocus": "创建龙骨节点",
          "expectedText": "创建龙骨节点"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 create_skeleton_node 动作，处理“DragonBones”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 skeletonType 设为“dragonbones”。调用完成后重点检查：创建龙骨节点。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 107,
        "note": "来自 tests/test-report.json，自动化执行通过（107ms）"
      }
    },
    {
      "id": 140,
      "tool": "scene_operation",
      "action": "generate_tilemap",
      "title": "瓦片地图",
      "input": {
        "action": "generate_tilemap",
        "name": "Level1"
      },
      "expected": "创建 TiledMap 节点",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 generate_tilemap 动作，处理“瓦片地图”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 name 设为“Level1”。调用完成后重点检查：创建 TiledMap 节点。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "瓦片地图",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.generate_tilemap",
          "fullPayload": "{\"action\":\"generate_tilemap\",\"name\":\"Level1\"}",
          "inputText": "name=Level1",
          "executionStep": "调用 scene_operation.generate_tilemap",
          "parameterNarrative": "这次请把 name 设为“Level1”。",
          "verificationFocus": "创建 TiledMap 节点",
          "expectedText": "创建 TiledMap 节点"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 generate_tilemap 动作，处理“瓦片地图”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 name 设为“Level1”。调用完成后重点检查：创建 TiledMap 节点。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 39,
        "note": "来自 tests/test-report.json，自动化执行通过（39ms）"
      }
    },
    {
      "id": 141,
      "tool": "scene_operation",
      "action": "create_primitive",
      "title": "Box+颜色",
      "input": {
        "action": "create_primitive",
        "type": "box",
        "color": {
          "r": 255,
          "g": 100,
          "b": 50,
          "a": 255
        }
      },
      "expected": "创建橙色 Box",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 create_primitive 动作，处理“Box+颜色”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 type 设为“box”，传入 color={\"r\":255,\"g\":100,\"b\":50,\"a\":255}。调用完成后重点检查：创建橙色 Box。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "Box+颜色",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.create_primitive",
          "fullPayload": "{\"action\":\"create_primitive\",\"type\":\"box\",\"color\":{\"r\":255,\"g\":100,\"b\":50,\"a\":255}}",
          "inputText": "type=box；color={\"r\":255,\"g\":100,\"b\":50,\"a\":255}",
          "executionStep": "调用 scene_operation.create_primitive",
          "parameterNarrative": "这次请把 type 设为“box”，传入 color={\"r\":255,\"g\":100,\"b\":50,\"a\":255}。",
          "verificationFocus": "创建橙色 Box",
          "expectedText": "创建橙色 Box"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 create_primitive 动作，处理“Box+颜色”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 type 设为“box”，传入 color={\"r\":255,\"g\":100,\"b\":50,\"a\":255}。调用完成后重点检查：创建橙色 Box。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 105,
        "note": "来自 tests/test-report.json，自动化执行通过（105ms）"
      }
    },
    {
      "id": 142,
      "tool": "scene_operation",
      "action": "create_primitive",
      "title": "Sphere+阴影",
      "input": {
        "action": "create_primitive",
        "type": "sphere",
        "shadowCasting": true,
        "receiveShadow": true
      },
      "expected": "创建可投射阴影球体",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 create_primitive 动作，处理“Sphere+阴影”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 type 设为“sphere”，把 shadowCasting 设为 true，把 receiveShadow 设为 true。调用完成后重点检查：创建可投射阴影球体。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "Sphere+阴影",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.create_primitive",
          "fullPayload": "{\"action\":\"create_primitive\",\"type\":\"sphere\",\"shadowCasting\":true,\"receiveShadow\":true}",
          "inputText": "type=sphere；shadowCasting=true；receiveShadow=true",
          "executionStep": "调用 scene_operation.create_primitive",
          "parameterNarrative": "这次请把 type 设为“sphere”，把 shadowCasting 设为 true，把 receiveShadow 设为 true。",
          "verificationFocus": "创建可投射阴影球体",
          "expectedText": "创建可投射阴影球体"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 create_primitive 动作，处理“Sphere+阴影”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 type 设为“sphere”，把 shadowCasting 设为 true，把 receiveShadow 设为 true。调用完成后重点检查：创建可投射阴影球体。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 26,
        "note": "来自 tests/test-report.json，自动化执行通过（26ms）"
      }
    },
    {
      "id": 143,
      "tool": "scene_operation",
      "action": "create_primitive",
      "title": "Cylinder",
      "input": {
        "action": "create_primitive",
        "type": "cylinder"
      },
      "expected": "创建圆柱体",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 create_primitive 动作，处理“Cylinder”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 type 设为“cylinder”。调用完成后重点检查：创建圆柱体。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "Cylinder",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.create_primitive",
          "fullPayload": "{\"action\":\"create_primitive\",\"type\":\"cylinder\"}",
          "inputText": "type=cylinder",
          "executionStep": "调用 scene_operation.create_primitive",
          "parameterNarrative": "这次请把 type 设为“cylinder”。",
          "verificationFocus": "创建圆柱体",
          "expectedText": "创建圆柱体"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 create_primitive 动作，处理“Cylinder”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 type 设为“cylinder”。调用完成后重点检查：创建圆柱体。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 89,
        "note": "来自 tests/test-report.json，自动化执行通过（89ms）"
      }
    },
    {
      "id": 144,
      "tool": "scene_operation",
      "action": "create_camera",
      "title": "透视摄像机",
      "input": {
        "action": "create_camera",
        "name": "MainCam",
        "fov": 60,
        "near": 0.1,
        "far": 1000
      },
      "expected": "创建 FOV=60 摄像机",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 create_camera 动作，处理“透视摄像机”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 name 设为“MainCam”，把 fov 设为 60，把 near 设为 0.1，把 far 设为 1000。调用完成后重点检查：创建 FOV=60 摄像机。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "透视摄像机",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.create_camera",
          "fullPayload": "{\"action\":\"create_camera\",\"name\":\"MainCam\",\"fov\":60,\"near\":0.1,\"far\":1000}",
          "inputText": "name=MainCam；fov=60；near=0.1；far=1000",
          "executionStep": "调用 scene_operation.create_camera",
          "parameterNarrative": "这次请把 name 设为“MainCam”，把 fov 设为 60，把 near 设为 0.1，把 far 设为 1000。",
          "verificationFocus": "创建 FOV=60 摄像机",
          "expectedText": "创建 FOV=60 摄像机"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 create_camera 动作，处理“透视摄像机”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 name 设为“MainCam”，把 fov 设为 60，把 near 设为 0.1，把 far 设为 1000。调用完成后重点检查：创建 FOV=60 摄像机。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 41,
        "note": "来自 tests/test-report.json，自动化执行通过（41ms）"
      }
    },
    {
      "id": 145,
      "tool": "scene_operation",
      "action": "set_camera_property",
      "title": "改 FOV",
      "input": {
        "action": "set_camera_property",
        "uuid": "<cam>",
        "fov": 45
      },
      "expected": "FOV→45°",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 set_camera_property 动作，处理“改 FOV”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <cam>，把 fov 设为 45。调用完成后重点检查：FOV→45°。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "改 FOV",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.set_camera_property",
          "fullPayload": "{\"action\":\"set_camera_property\",\"uuid\":\"<cam>\",\"fov\":45}",
          "inputText": "uuid=<cam>；fov=45",
          "executionStep": "调用 scene_operation.set_camera_property",
          "parameterNarrative": "这次请将 uuid 指向 <cam>，把 fov 设为 45。",
          "verificationFocus": "FOV→45°",
          "expectedText": "FOV→45°"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 set_camera_property 动作，处理“改 FOV”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <cam>，把 fov 设为 45。调用完成后重点检查：FOV→45°。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 52,
        "note": "来自 tests/test-report.json，自动化执行通过（52ms）"
      }
    },
    {
      "id": 146,
      "tool": "scene_operation",
      "action": "set_camera_property",
      "title": "设背景色",
      "input": {
        "action": "set_camera_property",
        "uuid": "<cam>",
        "clearColor": {
          "r": 30,
          "g": 30,
          "b": 60,
          "a": 255
        }
      },
      "expected": "背景色→深蓝",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 set_camera_property 动作，处理“设背景色”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <cam>，传入 clearColor={\"r\":30,\"g\":30,\"b\":60,\"a\":255}。调用完成后重点检查：背景色→深蓝。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "设背景色",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.set_camera_property",
          "fullPayload": "{\"action\":\"set_camera_property\",\"uuid\":\"<cam>\",\"clearColor\":{\"r\":30,\"g\":30,\"b\":60,\"a\":255}}",
          "inputText": "uuid=<cam>；clearColor={\"r\":30,\"g\":30,\"b\":60,\"a\":255}",
          "executionStep": "调用 scene_operation.set_camera_property",
          "parameterNarrative": "这次请将 uuid 指向 <cam>，传入 clearColor={\"r\":30,\"g\":30,\"b\":60,\"a\":255}。",
          "verificationFocus": "背景色→深蓝",
          "expectedText": "背景色→深蓝"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 set_camera_property 动作，处理“设背景色”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <cam>，传入 clearColor={\"r\":30,\"g\":30,\"b\":60,\"a\":255}。调用完成后重点检查：背景色→深蓝。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 130,
        "note": "来自 tests/test-report.json，自动化执行通过（130ms）"
      }
    },
    {
      "id": 147,
      "tool": "scene_operation",
      "action": "set_camera_look_at",
      "title": "朝向原点",
      "input": {
        "action": "set_camera_look_at",
        "uuid": "<cam>",
        "targetX": 0,
        "targetY": 0,
        "targetZ": 0
      },
      "expected": "摄像机旋转朝向原点",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 set_camera_look_at 动作，处理“朝向原点”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <cam>，把 targetX 设为 0，把 targetY 设为 0，把 targetZ 设为 0。调用完成后重点检查：摄像机旋转朝向原点。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "朝向原点",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.set_camera_look_at",
          "fullPayload": "{\"action\":\"set_camera_look_at\",\"uuid\":\"<cam>\",\"targetX\":0,\"targetY\":0,\"targetZ\":0}",
          "inputText": "uuid=<cam>；targetX=0；targetY=0；targetZ=0",
          "executionStep": "调用 scene_operation.set_camera_look_at",
          "parameterNarrative": "这次请将 uuid 指向 <cam>，把 targetX 设为 0，把 targetY 设为 0，把 targetZ 设为 0。",
          "verificationFocus": "摄像机旋转朝向原点",
          "expectedText": "摄像机旋转朝向原点"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 set_camera_look_at 动作，处理“朝向原点”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <cam>，把 targetX 设为 0，把 targetY 设为 0，把 targetZ 设为 0。调用完成后重点检查：摄像机旋转朝向原点。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 43,
        "note": "来自 tests/test-report.json，自动化执行通过（43ms）"
      }
    },
    {
      "id": 148,
      "tool": "scene_operation",
      "action": "camera_screenshot",
      "title": "默认截图",
      "input": {
        "action": "camera_screenshot",
        "width": 1024,
        "height": 768
      },
      "expected": "返回截图数据",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 camera_screenshot 动作，处理“默认截图”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 width 设为 1024，把 height 设为 768。调用完成后重点检查：返回截图数据。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "默认截图",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.camera_screenshot",
          "fullPayload": "{\"action\":\"camera_screenshot\",\"width\":1024,\"height\":768}",
          "inputText": "width=1024；height=768",
          "executionStep": "调用 scene_operation.camera_screenshot",
          "parameterNarrative": "这次请把 width 设为 1024，把 height 设为 768。",
          "verificationFocus": "返回截图数据",
          "expectedText": "返回截图数据"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 camera_screenshot 动作，处理“默认截图”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 width 设为 1024，把 height 设为 768。调用完成后重点检查：返回截图数据。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 19,
        "note": "来自 tests/test-report.json，自动化执行通过（19ms）"
      }
    },
    {
      "id": 149,
      "tool": "scene_operation",
      "action": "camera_screenshot",
      "title": "指定摄像机",
      "input": {
        "action": "camera_screenshot",
        "uuid": "<cam>",
        "width": 512,
        "height": 512
      },
      "expected": "使用指定摄像机截图",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 camera_screenshot 动作，处理“指定摄像机”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <cam>，把 width 设为 512，把 height 设为 512。调用完成后重点检查：使用指定摄像机截图。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "指定摄像机",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.camera_screenshot",
          "fullPayload": "{\"action\":\"camera_screenshot\",\"uuid\":\"<cam>\",\"width\":512,\"height\":512}",
          "inputText": "uuid=<cam>；width=512；height=512",
          "executionStep": "调用 scene_operation.camera_screenshot",
          "parameterNarrative": "这次请将 uuid 指向 <cam>，把 width 设为 512，把 height 设为 512。",
          "verificationFocus": "使用指定摄像机截图",
          "expectedText": "使用指定摄像机截图"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 camera_screenshot 动作，处理“指定摄像机”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <cam>，把 width 设为 512，把 height 设为 512。调用完成后重点检查：使用指定摄像机截图。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 10,
        "note": "来自 tests/test-report.json，自动化执行通过（10ms）"
      }
    },
    {
      "id": 150,
      "tool": "scene_operation",
      "action": "set_material_property",
      "title": "设材质颜色",
      "input": {
        "action": "set_material_property",
        "uuid": "<uuid>",
        "uniforms": {
          "mainColor": {
            "r": 255,
            "g": 0,
            "b": 0,
            "a": 255
          }
        }
      },
      "expected": "主颜色变红",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 set_material_property 动作，处理“设材质颜色”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，传入 uniforms={\"mainColor\":{\"r\":255,\"g\":0,\"b\":0,\"a\":255}}。调用完成后重点检查：主颜色变红。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "设材质颜色",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.set_material_property",
          "fullPayload": "{\"action\":\"set_material_property\",\"uuid\":\"<uuid>\",\"uniforms\":{\"mainColor\":{\"r\":255,\"g\":0,\"b\":0,\"a\":255}}}",
          "inputText": "uuid=<uuid>；uniforms={\"mainColor\":{\"r\":255,\"g\":0,\"b\":0,\"a\":255}}",
          "executionStep": "调用 scene_operation.set_material_property",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，传入 uniforms={\"mainColor\":{\"r\":255,\"g\":0,\"b\":0,\"a\":255}}。",
          "verificationFocus": "主颜色变红",
          "expectedText": "主颜色变红"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 set_material_property 动作，处理“设材质颜色”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，传入 uniforms={\"mainColor\":{\"r\":255,\"g\":0,\"b\":0,\"a\":255}}。调用完成后重点检查：主颜色变红。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 357,
        "note": "来自 tests/test-report.json，自动化执行通过（357ms）"
      }
    },
    {
      "id": 151,
      "tool": "scene_operation",
      "action": "set_material_property",
      "title": "设粗糙度",
      "input": {
        "action": "set_material_property",
        "uuid": "<uuid>",
        "uniforms": {
          "roughness": 0.3,
          "metallic": 0.8
        }
      },
      "expected": "光滑金属质感",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 set_material_property 动作，处理“设粗糙度”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，传入 uniforms={\"roughness\":0.3,\"metallic\":0.8}。调用完成后重点检查：光滑金属质感。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "设粗糙度",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.set_material_property",
          "fullPayload": "{\"action\":\"set_material_property\",\"uuid\":\"<uuid>\",\"uniforms\":{\"roughness\":0.3,\"metallic\":0.8}}",
          "inputText": "uuid=<uuid>；uniforms={\"roughness\":0.3,\"metallic\":0.8}",
          "executionStep": "调用 scene_operation.set_material_property",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，传入 uniforms={\"roughness\":0.3,\"metallic\":0.8}。",
          "verificationFocus": "光滑金属质感",
          "expectedText": "光滑金属质感"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 set_material_property 动作，处理“设粗糙度”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，传入 uniforms={\"roughness\":0.3,\"metallic\":0.8}。调用完成后重点检查：光滑金属质感。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 12,
        "note": "来自 tests/test-report.json，自动化执行通过（12ms）"
      }
    },
    {
      "id": 152,
      "tool": "scene_operation",
      "action": "assign_builtin_material",
      "title": "Unlit 材质",
      "input": {
        "action": "assign_builtin_material",
        "uuid": "<uuid>",
        "effectName": "builtin-unlit"
      },
      "expected": "切换到无光照材质",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 assign_builtin_material 动作，处理“Unlit 材质”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 effectName 设为“builtin-unlit”。调用完成后重点检查：切换到无光照材质。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "Unlit 材质",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.assign_builtin_material",
          "fullPayload": "{\"action\":\"assign_builtin_material\",\"uuid\":\"<uuid>\",\"effectName\":\"builtin-unlit\"}",
          "inputText": "uuid=<uuid>；effectName=builtin-unlit",
          "executionStep": "调用 scene_operation.assign_builtin_material",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 effectName 设为“builtin-unlit”。",
          "verificationFocus": "切换到无光照材质",
          "expectedText": "切换到无光照材质"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 assign_builtin_material 动作，处理“Unlit 材质”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 effectName 设为“builtin-unlit”。调用完成后重点检查：切换到无光照材质。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 8,
        "note": "来自 tests/test-report.json，自动化执行通过（8ms）"
      }
    },
    {
      "id": 153,
      "tool": "scene_operation",
      "action": "assign_builtin_material",
      "title": "带颜色",
      "input": {
        "action": "assign_builtin_material",
        "uuid": "<uuid>",
        "effectName": "builtin-standard",
        "color": {
          "r": 0,
          "g": 255,
          "b": 0,
          "a": 255
        }
      },
      "expected": "标准材质+绿色",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 assign_builtin_material 动作，处理“带颜色”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 effectName 设为“builtin-standard”，传入 color={\"r\":0,\"g\":255,\"b\":0,\"a\":255}。调用完成后重点检查：标准材质+绿色。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "带颜色",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.assign_builtin_material",
          "fullPayload": "{\"action\":\"assign_builtin_material\",\"uuid\":\"<uuid>\",\"effectName\":\"builtin-standard\",\"color\":{\"r\":0,\"g\":255,\"b\":0,\"a\":255}}",
          "inputText": "uuid=<uuid>；effectName=builtin-standard；color={\"r\":0,\"g\":255,\"b\":0,\"a\":255}",
          "executionStep": "调用 scene_operation.assign_builtin_material",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 effectName 设为“builtin-standard”，传入 color={\"r\":0,\"g\":255,\"b\":0,\"a\":255}。",
          "verificationFocus": "标准材质+绿色",
          "expectedText": "标准材质+绿色"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 assign_builtin_material 动作，处理“带颜色”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 effectName 设为“builtin-standard”，传入 color={\"r\":0,\"g\":255,\"b\":0,\"a\":255}。调用完成后重点检查：标准材质+绿色。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 37,
        "note": "来自 tests/test-report.json，自动化执行通过（37ms）"
      }
    },
    {
      "id": 154,
      "tool": "scene_operation",
      "action": "assign_project_material",
      "title": "自定义材质",
      "input": {
        "action": "assign_project_material",
        "uuid": "<uuid>",
        "materialUrl": "db://assets/materials/Glass.mtl"
      },
      "expected": "使用项目材质",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 assign_project_material 动作，处理“自定义材质”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 materialUrl 设为“db://assets/materials/Glass.mtl”。调用完成后重点检查：使用项目材质。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "自定义材质",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.assign_project_material",
          "fullPayload": "{\"action\":\"assign_project_material\",\"uuid\":\"<uuid>\",\"materialUrl\":\"db://assets/materials/Glass.mtl\"}",
          "inputText": "uuid=<uuid>；materialUrl=db://assets/materials/Glass.mtl",
          "executionStep": "调用 scene_operation.assign_project_material",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 materialUrl 设为“db://assets/materials/Glass.mtl”。",
          "verificationFocus": "使用项目材质",
          "expectedText": "使用项目材质"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 assign_project_material 动作，处理“自定义材质”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 materialUrl 设为“db://assets/materials/Glass.mtl”。调用完成后重点检查：使用项目材质。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 8,
        "note": "来自 tests/test-report.json，自动化执行通过（8ms）"
      }
    },
    {
      "id": 155,
      "tool": "scene_operation",
      "action": "set_material_define",
      "title": "启用法线贴图",
      "input": {
        "action": "set_material_define",
        "uuid": "<uuid>",
        "defines": {
          "USE_NORMAL_MAP": true
        }
      },
      "expected": "Shader 宏启用并重编译",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 set_material_define 动作，处理“启用法线贴图”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，传入 defines={\"USE_NORMAL_MAP\":true}。调用完成后重点检查：Shader 宏启用并重编译。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "启用法线贴图",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.set_material_define",
          "fullPayload": "{\"action\":\"set_material_define\",\"uuid\":\"<uuid>\",\"defines\":{\"USE_NORMAL_MAP\":true}}",
          "inputText": "uuid=<uuid>；defines={\"USE_NORMAL_MAP\":true}",
          "executionStep": "调用 scene_operation.set_material_define",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，传入 defines={\"USE_NORMAL_MAP\":true}。",
          "verificationFocus": "Shader 宏启用并重编译",
          "expectedText": "Shader 宏启用并重编译"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 set_material_define 动作，处理“启用法线贴图”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，传入 defines={\"USE_NORMAL_MAP\":true}。调用完成后重点检查：Shader 宏启用并重编译。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 16,
        "note": "来自 tests/test-report.json，自动化执行通过（16ms）"
      }
    },
    {
      "id": 156,
      "tool": "scene_operation",
      "action": "clone_material",
      "title": "克隆材质",
      "input": {
        "action": "clone_material",
        "uuid": "<uuid>"
      },
      "expected": "共享材质→独立实例",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 clone_material 动作，处理“克隆材质”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：共享材质→独立实例。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "克隆材质",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.clone_material",
          "fullPayload": "{\"action\":\"clone_material\",\"uuid\":\"<uuid>\"}",
          "inputText": "uuid=<uuid>",
          "executionStep": "调用 scene_operation.clone_material",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>。",
          "verificationFocus": "共享材质→独立实例",
          "expectedText": "共享材质→独立实例"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 clone_material 动作，处理“克隆材质”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：共享材质→独立实例。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 7,
        "note": "来自 tests/test-report.json，自动化执行通过（7ms）"
      }
    },
    {
      "id": 157,
      "tool": "scene_operation",
      "action": "swap_technique",
      "title": "切换 Technique",
      "input": {
        "action": "swap_technique",
        "uuid": "<uuid>",
        "technique": 1
      },
      "expected": "切换到第 2 个渲染技术",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 swap_technique 动作，处理“切换 Technique”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 technique 设为 1。调用完成后重点检查：切换到第 2 个渲染技术。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "切换 Technique",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.swap_technique",
          "fullPayload": "{\"action\":\"swap_technique\",\"uuid\":\"<uuid>\",\"technique\":1}",
          "inputText": "uuid=<uuid>；technique=1",
          "executionStep": "调用 scene_operation.swap_technique",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 technique 设为 1。",
          "verificationFocus": "切换到第 2 个渲染技术",
          "expectedText": "切换到第 2 个渲染技术"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 swap_technique 动作，处理“切换 Technique”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 technique 设为 1。调用完成后重点检查：切换到第 2 个渲染技术。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 12,
        "note": "来自 tests/test-report.json，自动化执行通过（12ms）"
      }
    },
    {
      "id": 158,
      "tool": "scene_operation",
      "action": "sprite_grayscale",
      "title": "启用灰度",
      "input": {
        "action": "sprite_grayscale",
        "uuid": "<uuid>",
        "enable": true
      },
      "expected": "Sprite 变灰色",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 sprite_grayscale 动作，处理“启用灰度”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 enable 设为 true。调用完成后重点检查：Sprite 变灰色。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "启用灰度",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.sprite_grayscale",
          "fullPayload": "{\"action\":\"sprite_grayscale\",\"uuid\":\"<uuid>\",\"enable\":true}",
          "inputText": "uuid=<uuid>；enable=true",
          "executionStep": "调用 scene_operation.sprite_grayscale",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 enable 设为 true。",
          "verificationFocus": "Sprite 变灰色",
          "expectedText": "Sprite 变灰色"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 sprite_grayscale 动作，处理“启用灰度”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 enable 设为 true。调用完成后重点检查：Sprite 变灰色。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 20,
        "note": "来自 tests/test-report.json，自动化执行通过（20ms）"
      }
    },
    {
      "id": 159,
      "tool": "scene_operation",
      "action": "sprite_grayscale",
      "title": "恢复彩色",
      "input": {
        "action": "sprite_grayscale",
        "uuid": "<uuid>",
        "enable": false
      },
      "expected": "Sprite 恢复彩色",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 sprite_grayscale 动作，处理“恢复彩色”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 enable 设为 false。调用完成后重点检查：Sprite 恢复彩色。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "恢复彩色",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.sprite_grayscale",
          "fullPayload": "{\"action\":\"sprite_grayscale\",\"uuid\":\"<uuid>\",\"enable\":false}",
          "inputText": "uuid=<uuid>；enable=false",
          "executionStep": "调用 scene_operation.sprite_grayscale",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 enable 设为 false。",
          "verificationFocus": "Sprite 恢复彩色",
          "expectedText": "Sprite 恢复彩色"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 sprite_grayscale 动作，处理“恢复彩色”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 enable 设为 false。调用完成后重点检查：Sprite 恢复彩色。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 6,
        "note": "来自 tests/test-report.json，自动化执行通过（6ms）"
      }
    },
    {
      "id": 160,
      "tool": "scene_operation",
      "action": "create_light",
      "title": "平行光",
      "input": {
        "action": "create_light",
        "lightType": "directional",
        "rotationX": -45
      },
      "expected": "创建 45° 平行光",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 create_light 动作，处理“平行光”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 lightType 设为“directional”，把 rotationX 设为 -45。调用完成后重点检查：创建 45° 平行光。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "平行光",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.create_light",
          "fullPayload": "{\"action\":\"create_light\",\"lightType\":\"directional\",\"rotationX\":-45}",
          "inputText": "lightType=directional；rotationX=-45",
          "executionStep": "调用 scene_operation.create_light",
          "parameterNarrative": "这次请把 lightType 设为“directional”，把 rotationX 设为 -45。",
          "verificationFocus": "创建 45° 平行光",
          "expectedText": "创建 45° 平行光"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 create_light 动作，处理“平行光”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 lightType 设为“directional”，把 rotationX 设为 -45。调用完成后重点检查：创建 45° 平行光。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 35,
        "note": "来自 tests/test-report.json，自动化执行通过（35ms）"
      }
    },
    {
      "id": 161,
      "tool": "scene_operation",
      "action": "create_light",
      "title": "聚光灯",
      "input": {
        "action": "create_light",
        "lightType": "spot",
        "x": 0,
        "y": 5,
        "z": 0,
        "spotAngle": 60,
        "range": 20
      },
      "expected": "创建聚光灯",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 create_light 动作，处理“聚光灯”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 lightType 设为“spot”，把 x 设为 0，把 y 设为 5，把 z 设为 0，把 spotAngle 设为 60，把 range 设为 20。调用完成后重点检查：创建聚光灯。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "聚光灯",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.create_light",
          "fullPayload": "{\"action\":\"create_light\",\"lightType\":\"spot\",\"x\":0,\"y\":5,\"z\":0,\"spotAngle\":60,\"range\":20}",
          "inputText": "lightType=spot；x=0；y=5；z=0；spotAngle=60；range=20",
          "executionStep": "调用 scene_operation.create_light",
          "parameterNarrative": "这次请把 lightType 设为“spot”，把 x 设为 0，把 y 设为 5，把 z 设为 0，把 spotAngle 设为 60，把 range 设为 20。",
          "verificationFocus": "创建聚光灯",
          "expectedText": "创建聚光灯"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 create_light 动作，处理“聚光灯”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 lightType 设为“spot”，把 x 设为 0，把 y 设为 5，把 z 设为 0，把 spotAngle 设为 60，把 range 设为 20。调用完成后重点检查：创建聚光灯。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 126,
        "note": "来自 tests/test-report.json，自动化执行通过（126ms）"
      }
    },
    {
      "id": 162,
      "tool": "scene_operation",
      "action": "set_light_property",
      "title": "调亮度",
      "input": {
        "action": "set_light_property",
        "uuid": "<light>",
        "illuminance": 150000
      },
      "expected": "亮度→150000 lux",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 set_light_property 动作，处理“调亮度”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <light>，把 illuminance 设为 150000。调用完成后重点检查：亮度→150000 lux。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "调亮度",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.set_light_property",
          "fullPayload": "{\"action\":\"set_light_property\",\"uuid\":\"<light>\",\"illuminance\":150000}",
          "inputText": "uuid=<light>；illuminance=150000",
          "executionStep": "调用 scene_operation.set_light_property",
          "parameterNarrative": "这次请将 uuid 指向 <light>，把 illuminance 设为 150000。",
          "verificationFocus": "亮度→150000 lux",
          "expectedText": "亮度→150000 lux"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 set_light_property 动作，处理“调亮度”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <light>，把 illuminance 设为 150000。调用完成后重点检查：亮度→150000 lux。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 33,
        "note": "来自 tests/test-report.json，自动化执行通过（33ms）"
      }
    },
    {
      "id": 163,
      "tool": "scene_operation",
      "action": "set_light_property",
      "title": "开阴影",
      "input": {
        "action": "set_light_property",
        "uuid": "<light>",
        "shadowEnabled": true,
        "shadowPcf": 2
      },
      "expected": "启用 PCF2 阴影",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 set_light_property 动作，处理“开阴影”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <light>，把 shadowEnabled 设为 true，把 shadowPcf 设为 2。调用完成后重点检查：启用 PCF2 阴影。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "开阴影",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.set_light_property",
          "fullPayload": "{\"action\":\"set_light_property\",\"uuid\":\"<light>\",\"shadowEnabled\":true,\"shadowPcf\":2}",
          "inputText": "uuid=<light>；shadowEnabled=true；shadowPcf=2",
          "executionStep": "调用 scene_operation.set_light_property",
          "parameterNarrative": "这次请将 uuid 指向 <light>，把 shadowEnabled 设为 true，把 shadowPcf 设为 2。",
          "verificationFocus": "启用 PCF2 阴影",
          "expectedText": "启用 PCF2 阴影"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 set_light_property 动作，处理“开阴影”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <light>，把 shadowEnabled 设为 true，把 shadowPcf 设为 2。调用完成后重点检查：启用 PCF2 阴影。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 120,
        "note": "来自 tests/test-report.json，自动化执行通过（120ms）"
      }
    },
    {
      "id": 164,
      "tool": "scene_operation",
      "action": "set_scene_environment",
      "title": "用预设",
      "input": {
        "action": "set_scene_environment",
        "preset": "outdoor_day"
      },
      "expected": "一键应用户外白天环境",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 set_scene_environment 动作，处理“用预设”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 preset 设为“outdoor_day”。调用完成后重点检查：一键应用户外白天环境。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "用预设",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.set_scene_environment",
          "fullPayload": "{\"action\":\"set_scene_environment\",\"preset\":\"outdoor_day\"}",
          "inputText": "preset=outdoor_day",
          "executionStep": "调用 scene_operation.set_scene_environment",
          "parameterNarrative": "这次请把 preset 设为“outdoor_day”。",
          "verificationFocus": "一键应用户外白天环境",
          "expectedText": "一键应用户外白天环境"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 set_scene_environment 动作，处理“用预设”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 preset 设为“outdoor_day”。调用完成后重点检查：一键应用户外白天环境。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 40,
        "note": "来自 tests/test-report.json，自动化执行通过（40ms）"
      }
    },
    {
      "id": 165,
      "tool": "scene_operation",
      "action": "set_scene_environment",
      "title": "设雾效",
      "input": {
        "action": "set_scene_environment",
        "subsystem": "fog",
        "enabled": true,
        "fogDensity": 0.05,
        "fogColor": {
          "r": 200,
          "g": 200,
          "b": 220,
          "a": 255
        }
      },
      "expected": "启用淡蓝雾效",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 set_scene_environment 动作，处理“设雾效”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 subsystem 设为“fog”，把 enabled 设为 true，把 fogDensity 设为 0.05，传入 fogColor={\"r\":200,\"g\":200,\"b\":220,\"a\":255}。调用完成后重点检查：启用淡蓝雾效。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "设雾效",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.set_scene_environment",
          "fullPayload": "{\"action\":\"set_scene_environment\",\"subsystem\":\"fog\",\"enabled\":true,\"fogDensity\":0.05,\"fogColor\":{\"r\":200,\"g\":200,\"b\":220,\"a\":255}}",
          "inputText": "subsystem=fog；enabled=true；fogDensity=0.05；fogColor={\"r\":200,\"g\":200,\"b\":220,\"a\":255}",
          "executionStep": "调用 scene_operation.set_scene_environment",
          "parameterNarrative": "这次请把 subsystem 设为“fog”，把 enabled 设为 true，把 fogDensity 设为 0.05，传入 fogColor={\"r\":200,\"g\":200,\"b\":220,\"a\":255}。",
          "verificationFocus": "启用淡蓝雾效",
          "expectedText": "启用淡蓝雾效"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 set_scene_environment 动作，处理“设雾效”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 subsystem 设为“fog”，把 enabled 设为 true，把 fogDensity 设为 0.05，传入 fogColor={\"r\":200,\"g\":200,\"b\":220,\"a\":255}。调用完成后重点检查：启用淡蓝雾效。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 56,
        "note": "来自 tests/test-report.json，自动化执行通过（56ms）"
      }
    },
    {
      "id": 166,
      "tool": "scene_operation",
      "action": "set_scene_environment",
      "title": "设环境光",
      "input": {
        "action": "set_scene_environment",
        "subsystem": "ambient",
        "skyIllum": 30000,
        "skyColor": {
          "r": 128,
          "g": 160,
          "b": 255,
          "a": 255
        }
      },
      "expected": "天空颜色→淡蓝",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 set_scene_environment 动作，处理“设环境光”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 subsystem 设为“ambient”，把 skyIllum 设为 30000，传入 skyColor={\"r\":128,\"g\":160,\"b\":255,\"a\":255}。调用完成后重点检查：天空颜色→淡蓝。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "设环境光",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.set_scene_environment",
          "fullPayload": "{\"action\":\"set_scene_environment\",\"subsystem\":\"ambient\",\"skyIllum\":30000,\"skyColor\":{\"r\":128,\"g\":160,\"b\":255,\"a\":255}}",
          "inputText": "subsystem=ambient；skyIllum=30000；skyColor={\"r\":128,\"g\":160,\"b\":255,\"a\":255}",
          "executionStep": "调用 scene_operation.set_scene_environment",
          "parameterNarrative": "这次请把 subsystem 设为“ambient”，把 skyIllum 设为 30000，传入 skyColor={\"r\":128,\"g\":160,\"b\":255,\"a\":255}。",
          "verificationFocus": "天空颜色→淡蓝",
          "expectedText": "天空颜色→淡蓝"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 set_scene_environment 动作，处理“设环境光”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 subsystem 设为“ambient”，把 skyIllum 设为 30000，传入 skyColor={\"r\":128,\"g\":160,\"b\":255,\"a\":255}。调用完成后重点检查：天空颜色→淡蓝。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 7,
        "note": "来自 tests/test-report.json，自动化执行通过（7ms）"
      }
    },
    {
      "id": 167,
      "tool": "scene_operation",
      "action": "bind_event",
      "title": "绑定点击",
      "input": {
        "action": "bind_event",
        "uuid": "<btn>",
        "eventType": "click",
        "component": "GameUI",
        "handler": "onClickStart"
      },
      "expected": "Button 绑定 click→GameUI.onClickStart",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 bind_event 动作，处理“绑定点击”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <btn>，把 eventType 设为“click”，把 component 设为“GameUI”，把 handler 设为“onClickStart”。调用完成后重点检查：Button 绑定 click→GameUI.onClickStart。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "绑定点击",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.bind_event",
          "fullPayload": "{\"action\":\"bind_event\",\"uuid\":\"<btn>\",\"eventType\":\"click\",\"component\":\"GameUI\",\"handler\":\"onClickStart\"}",
          "inputText": "uuid=<btn>；eventType=click；component=GameUI；handler=onClickStart",
          "executionStep": "调用 scene_operation.bind_event",
          "parameterNarrative": "这次请将 uuid 指向 <btn>，把 eventType 设为“click”，把 component 设为“GameUI”，把 handler 设为“onClickStart”。",
          "verificationFocus": "Button 绑定 click→GameUI.onClickStart",
          "expectedText": "Button 绑定 click→GameUI.onClickStart"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 bind_event 动作，处理“绑定点击”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <btn>，把 eventType 设为“click”，把 component 设为“GameUI”，把 handler 设为“onClickStart”。调用完成后重点检查：Button 绑定 click→GameUI.onClickStart。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 9,
        "note": "来自 tests/test-report.json，自动化执行通过（9ms）"
      }
    },
    {
      "id": 168,
      "tool": "scene_operation",
      "action": "bind_event",
      "title": "绑定滑块",
      "input": {
        "action": "bind_event",
        "uuid": "<slider>",
        "eventType": "slider",
        "component": "Settings",
        "handler": "onVolumeChange"
      },
      "expected": "Slider 绑定回调",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 bind_event 动作，处理“绑定滑块”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <slider>，把 eventType 设为“slider”，把 component 设为“Settings”，把 handler 设为“onVolumeChange”。调用完成后重点检查：Slider 绑定回调。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "绑定滑块",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.bind_event",
          "fullPayload": "{\"action\":\"bind_event\",\"uuid\":\"<slider>\",\"eventType\":\"slider\",\"component\":\"Settings\",\"handler\":\"onVolumeChange\"}",
          "inputText": "uuid=<slider>；eventType=slider；component=Settings；handler=onVolumeChange",
          "executionStep": "调用 scene_operation.bind_event",
          "parameterNarrative": "这次请将 uuid 指向 <slider>，把 eventType 设为“slider”，把 component 设为“Settings”，把 handler 设为“onVolumeChange”。",
          "verificationFocus": "Slider 绑定回调",
          "expectedText": "Slider 绑定回调"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 bind_event 动作，处理“绑定滑块”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <slider>，把 eventType 设为“slider”，把 component 设为“Settings”，把 handler 设为“onVolumeChange”。调用完成后重点检查：Slider 绑定回调。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 11,
        "note": "来自 tests/test-report.json，自动化执行通过（11ms）"
      }
    },
    {
      "id": 169,
      "tool": "scene_operation",
      "action": "unbind_event",
      "title": "移除指定",
      "input": {
        "action": "unbind_event",
        "uuid": "<btn>",
        "eventType": "click",
        "handler": "onClickStart"
      },
      "expected": "移除匹配的 handler",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 unbind_event 动作，处理“移除指定”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <btn>，把 eventType 设为“click”，把 handler 设为“onClickStart”。调用完成后重点检查：移除匹配的 handler。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "移除指定",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.unbind_event",
          "fullPayload": "{\"action\":\"unbind_event\",\"uuid\":\"<btn>\",\"eventType\":\"click\",\"handler\":\"onClickStart\"}",
          "inputText": "uuid=<btn>；eventType=click；handler=onClickStart",
          "executionStep": "调用 scene_operation.unbind_event",
          "parameterNarrative": "这次请将 uuid 指向 <btn>，把 eventType 设为“click”，把 handler 设为“onClickStart”。",
          "verificationFocus": "移除匹配的 handler",
          "expectedText": "移除匹配的 handler"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 unbind_event 动作，处理“移除指定”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <btn>，把 eventType 设为“click”，把 handler 设为“onClickStart”。调用完成后重点检查：移除匹配的 handler。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 7,
        "note": "来自 tests/test-report.json，自动化执行通过（7ms）"
      }
    },
    {
      "id": 170,
      "tool": "scene_operation",
      "action": "unbind_event",
      "title": "清空全部",
      "input": {
        "action": "unbind_event",
        "uuid": "<btn>",
        "eventType": "click"
      },
      "expected": "移除所有 click 事件",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 unbind_event 动作，处理“清空全部”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <btn>，把 eventType 设为“click”。调用完成后重点检查：移除所有 click 事件。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "清空全部",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.unbind_event",
          "fullPayload": "{\"action\":\"unbind_event\",\"uuid\":\"<btn>\",\"eventType\":\"click\"}",
          "inputText": "uuid=<btn>；eventType=click",
          "executionStep": "调用 scene_operation.unbind_event",
          "parameterNarrative": "这次请将 uuid 指向 <btn>，把 eventType 设为“click”。",
          "verificationFocus": "移除所有 click 事件",
          "expectedText": "移除所有 click 事件"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 unbind_event 动作，处理“清空全部”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <btn>，把 eventType 设为“click”。调用完成后重点检查：移除所有 click 事件。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 11,
        "note": "来自 tests/test-report.json，自动化执行通过（11ms）"
      }
    },
    {
      "id": 171,
      "tool": "scene_operation",
      "action": "list_events",
      "title": "列出事件",
      "input": {
        "action": "list_events",
        "uuid": "<btn>"
      },
      "expected": "返回所有已绑定 UI 事件",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 list_events 动作，处理“列出事件”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <btn>。调用完成后重点检查：返回所有已绑定 UI 事件。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "列出事件",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.list_events",
          "fullPayload": "{\"action\":\"list_events\",\"uuid\":\"<btn>\"}",
          "inputText": "uuid=<btn>",
          "executionStep": "调用 scene_operation.list_events",
          "parameterNarrative": "这次请将 uuid 指向 <btn>。",
          "verificationFocus": "返回所有已绑定 UI 事件",
          "expectedText": "返回所有已绑定 UI 事件"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 list_events 动作，处理“列出事件”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <btn>。调用完成后重点检查：返回所有已绑定 UI 事件。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 7,
        "note": "来自 tests/test-report.json，自动化执行通过（7ms）"
      }
    },
    {
      "id": 172,
      "tool": "scene_operation",
      "action": "audio_setup",
      "title": "添加音频",
      "input": {
        "action": "audio_setup",
        "uuid": "<uuid>",
        "volume": 0.8,
        "loop": true,
        "playOnAwake": true
      },
      "expected": "添加 AudioSource+配置",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 audio_setup 动作，处理“添加音频”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 volume 设为 0.8，把 loop 设为 true，把 playOnAwake 设为 true。调用完成后重点检查：添加 AudioSource+配置。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "添加音频",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.audio_setup",
          "fullPayload": "{\"action\":\"audio_setup\",\"uuid\":\"<uuid>\",\"volume\":0.8,\"loop\":true,\"playOnAwake\":true}",
          "inputText": "uuid=<uuid>；volume=0.8；loop=true；playOnAwake=true",
          "executionStep": "调用 scene_operation.audio_setup",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 volume 设为 0.8，把 loop 设为 true，把 playOnAwake 设为 true。",
          "verificationFocus": "添加 AudioSource+配置",
          "expectedText": "添加 AudioSource+配置"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 audio_setup 动作，处理“添加音频”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 volume 设为 0.8，把 loop 设为 true，把 playOnAwake 设为 true。调用完成后重点检查：添加 AudioSource+配置。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 6,
        "note": "来自 tests/test-report.json，自动化执行通过（6ms）"
      }
    },
    {
      "id": 173,
      "tool": "scene_operation",
      "action": "setup_physics_world",
      "title": "设重力",
      "input": {
        "action": "setup_physics_world",
        "gravity": {
          "x": 0,
          "y": -20,
          "z": 0
        }
      },
      "expected": "物理世界重力加倍",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 setup_physics_world 动作，处理“设重力”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请传入 gravity={\"x\":0,\"y\":-20,\"z\":0}。调用完成后重点检查：物理世界重力加倍。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "设重力",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.setup_physics_world",
          "fullPayload": "{\"action\":\"setup_physics_world\",\"gravity\":{\"x\":0,\"y\":-20,\"z\":0}}",
          "inputText": "gravity={\"x\":0,\"y\":-20,\"z\":0}",
          "executionStep": "调用 scene_operation.setup_physics_world",
          "parameterNarrative": "这次请传入 gravity={\"x\":0,\"y\":-20,\"z\":0}。",
          "verificationFocus": "物理世界重力加倍",
          "expectedText": "物理世界重力加倍"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 setup_physics_world 动作，处理“设重力”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请传入 gravity={\"x\":0,\"y\":-20,\"z\":0}。调用完成后重点检查：物理世界重力加倍。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 8,
        "note": "来自 tests/test-report.json，自动化执行通过（8ms）"
      }
    },
    {
      "id": 174,
      "tool": "scene_operation",
      "action": "batch",
      "title": "批量操作",
      "input": {
        "action": "batch",
        "operations": [
          {
            "action": "create_node",
            "name": "A"
          },
          {
            "action": "add_component",
            "uuid": "$0.uuid",
            "component": "Sprite"
          }
        ]
      },
      "expected": "创建节点 A 并添加 Sprite，$0.uuid 引用上一步结果",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Modify the Cocos Creator scene graph (write operations). Use scene_query for reading.",
        "zhToolSummary": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-scene.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 scene_operation 工具，执行 batch 动作，处理“批量操作”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请传入 operations=[{\"action\":\"create_node\",\"name\":\"A\"},{\"action\":\"add_component\",\"uuid\":\"$0.uuid\",\"component\":\"Sprite\"}]。调用完成后重点检查：创建节点 A 并添加 Sprite，$0.uuid 引用上一步结果。",
          "actionGoal": "修改 Cocos Creator 场景图中的内容，属于写操作；只读查询请使用 scene_query",
          "scenarioType": "参数场景",
          "scenarioTitle": "批量操作",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "scene_operation.batch",
          "fullPayload": "{\"action\":\"batch\",\"operations\":[{\"action\":\"create_node\",\"name\":\"A\"},{\"action\":\"add_component\",\"uuid\":\"$0.uuid\",\"component\":\"Sprite\"}]}",
          "inputText": "operations=[{\"action\":\"create_node\",\"name\":\"A\"},{\"action\":\"add_component\",\"uuid\":\"$0.uuid\",\"component\":\"Sprite\"}]",
          "executionStep": "调用 scene_operation.batch",
          "parameterNarrative": "这次请传入 operations=[{\"action\":\"create_node\",\"name\":\"A\"},{\"action\":\"add_component\",\"uuid\":\"$0.uuid\",\"component\":\"Sprite\"}]。",
          "verificationFocus": "创建节点 A 并添加 Sprite，$0.uuid 引用上一步结果",
          "expectedText": "创建节点 A 并添加 Sprite，$0.uuid 引用上一步结果"
        },
        "naturalLanguageTest": "请通过 MCP 调用 scene_operation 工具，执行 batch 动作，处理“批量操作”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请传入 operations=[{\"action\":\"create_node\",\"name\":\"A\"},{\"action\":\"add_component\",\"uuid\":\"$0.uuid\",\"component\":\"Sprite\"}]。调用完成后重点检查：创建节点 A 并添加 Sprite，$0.uuid 引用上一步结果。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 13,
        "note": "来自 tests/test-report.json，自动化执行通过（13ms）"
      }
    },
    {
      "id": 175,
      "tool": "asset_operation",
      "action": "list",
      "title": "列出所有图片",
      "input": {
        "action": "list",
        "pattern": "db://assets/**/*.png"
      },
      "expected": "返回所有 PNG 资源列表",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Cocos Creator project assets via AssetDB. All assets are identified by db:// URLs (e.g. \"db://assets/textures/hero.png\").",
        "zhToolSummary": "通过 AssetDB 管理 Cocos Creator 项目资源。所有资源都通过 db:// URL 标识，例如 \"db://assets/textures/hero.png\"。",
        "actionDescription": "pattern(optional, default \"db://assets/**/*\"). List assets matching glob pattern.",
        "zhActionDescription": "pattern（可选，默认 \"db：//assets/**/*\"）。列出匹配 glob 模式的资源。",
        "sourceFile": "src/mcp/tools-asset.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 asset_operation 工具，执行 list 动作，处理“列出所有图片”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 pattern 设为“db://assets/**/*.png”。调用完成后重点检查：返回所有 PNG 资源列表。",
          "actionGoal": "列出匹配 glob 模式的资源",
          "scenarioType": "参数场景",
          "scenarioTitle": "列出所有图片",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "asset_operation.list",
          "fullPayload": "{\"action\":\"list\",\"pattern\":\"db://assets/**/*.png\"}",
          "inputText": "pattern=db://assets/**/*.png",
          "executionStep": "调用 asset_operation.list",
          "parameterNarrative": "这次请把 pattern 设为“db://assets/**/*.png”。",
          "verificationFocus": "返回所有 PNG 资源列表",
          "expectedText": "返回所有 PNG 资源列表"
        },
        "naturalLanguageTest": "请通过 MCP 调用 asset_operation 工具，执行 list 动作，处理“列出所有图片”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 pattern 设为“db://assets/**/*.png”。调用完成后重点检查：返回所有 PNG 资源列表。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 10,
        "note": "来自 tests/test-report.json，自动化执行通过（10ms）"
      }
    },
    {
      "id": 176,
      "tool": "asset_operation",
      "action": "info",
      "title": "资源信息",
      "input": {
        "action": "info",
        "url": "db://assets/textures/hero.png"
      },
      "expected": "返回 {type,uuid,path,importer}",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Cocos Creator project assets via AssetDB. All assets are identified by db:// URLs (e.g. \"db://assets/textures/hero.png\").",
        "zhToolSummary": "通过 AssetDB 管理 Cocos Creator 项目资源。所有资源都通过 db:// URL 标识，例如 \"db://assets/textures/hero.png\"。",
        "actionDescription": "url(REQUIRED). Get asset metadata (type, uuid, path, importer).",
        "zhActionDescription": "url（必填）。获取资源元数据（type、uuid、path、importer）。",
        "sourceFile": "src/mcp/tools-asset.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 asset_operation 工具，执行 info 动作，处理“资源信息”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/textures/hero.png”。调用完成后重点检查：返回 {type,uuid,path,importer}。",
          "actionGoal": "获取资源元数据（type、uuid、path、importer）",
          "scenarioType": "参数场景",
          "scenarioTitle": "资源信息",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "asset_operation.info",
          "fullPayload": "{\"action\":\"info\",\"url\":\"db://assets/textures/hero.png\"}",
          "inputText": "url=db://assets/textures/hero.png",
          "executionStep": "调用 asset_operation.info",
          "parameterNarrative": "这次请把 url 设为“db://assets/textures/hero.png”。",
          "verificationFocus": "返回 {type,uuid,path,importer}",
          "expectedText": "返回 {type,uuid,path,importer}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 asset_operation 工具，执行 info 动作，处理“资源信息”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/textures/hero.png”。调用完成后重点检查：返回 {type,uuid,path,importer}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 3,
        "note": "来自 tests/test-report.json，自动化执行通过（3ms）"
      }
    },
    {
      "id": 177,
      "tool": "asset_operation",
      "action": "create",
      "title": "创建文件",
      "input": {
        "action": "create",
        "url": "db://assets/scripts/Test.ts",
        "content": "import {_decorator} from \"cc\";"
      },
      "expected": "创建 TS 文件",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Cocos Creator project assets via AssetDB. All assets are identified by db:// URLs (e.g. \"db://assets/textures/hero.png\").",
        "zhToolSummary": "通过 AssetDB 管理 Cocos Creator 项目资源。所有资源都通过 db:// URL 标识，例如 \"db://assets/textures/hero.png\"。",
        "actionDescription": "url(REQUIRED), content(optional). Create new asset file. Use null content for folders/binary. NEVER create .spriteframe/.texture files — these are auto-generated sub-assets from image imports.",
        "zhActionDescription": "url（必填），content（可选）。创建新的资源文件。对于文件夹或二进制资源，请使用 null 作为 content。不要手动创建 .spriteframe/.texture 文件，它们会在图片导入时自动生成。",
        "sourceFile": "src/mcp/tools-asset.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 asset_operation 工具，执行 create 动作，处理“创建文件”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/scripts/Test.ts”，把 content 设为“import {_decorator} from \"cc\";”。调用完成后重点检查：创建 TS 文件。",
          "actionGoal": "创建新的资源文件",
          "scenarioType": "参数场景",
          "scenarioTitle": "创建文件",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "asset_operation.create",
          "fullPayload": "{\"action\":\"create\",\"url\":\"db://assets/scripts/Test.ts\",\"content\":\"import {_decorator} from \\\"cc\\\";\"}",
          "inputText": "url=db://assets/scripts/Test.ts；content=import {_decorator} from \"cc\";",
          "executionStep": "调用 asset_operation.create",
          "parameterNarrative": "这次请把 url 设为“db://assets/scripts/Test.ts”，把 content 设为“import {_decorator} from \"cc\";”。",
          "verificationFocus": "创建 TS 文件",
          "expectedText": "创建 TS 文件"
        },
        "naturalLanguageTest": "请通过 MCP 调用 asset_operation 工具，执行 create 动作，处理“创建文件”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/scripts/Test.ts”，把 content 设为“import {_decorator} from \"cc\";”。调用完成后重点检查：创建 TS 文件。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 14,
        "note": "来自 tests/test-report.json，自动化执行通过（14ms）"
      }
    },
    {
      "id": 178,
      "tool": "asset_operation",
      "action": "save",
      "title": "覆盖保存",
      "input": {
        "action": "save",
        "url": "db://assets/scripts/Test.ts",
        "content": "...new code..."
      },
      "expected": "文件内容被覆盖",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Cocos Creator project assets via AssetDB. All assets are identified by db:// URLs (e.g. \"db://assets/textures/hero.png\").",
        "zhToolSummary": "通过 AssetDB 管理 Cocos Creator 项目资源。所有资源都通过 db:// URL 标识，例如 \"db://assets/textures/hero.png\"。",
        "actionDescription": "url(REQUIRED), content(REQUIRED). Overwrite existing asset content.",
        "zhActionDescription": "url（必填），content（必填）。覆盖已有资源内容。",
        "sourceFile": "src/mcp/tools-asset.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 asset_operation 工具，执行 save 动作，处理“覆盖保存”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/scripts/Test.ts”，把 content 设为“...new code...”。调用完成后重点检查：文件内容被覆盖。",
          "actionGoal": "覆盖已有资源内容",
          "scenarioType": "参数场景",
          "scenarioTitle": "覆盖保存",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "asset_operation.save",
          "fullPayload": "{\"action\":\"save\",\"url\":\"db://assets/scripts/Test.ts\",\"content\":\"...new code...\"}",
          "inputText": "url=db://assets/scripts/Test.ts；content=...new code...",
          "executionStep": "调用 asset_operation.save",
          "parameterNarrative": "这次请把 url 设为“db://assets/scripts/Test.ts”，把 content 设为“...new code...”。",
          "verificationFocus": "文件内容被覆盖",
          "expectedText": "文件内容被覆盖"
        },
        "naturalLanguageTest": "请通过 MCP 调用 asset_operation 工具，执行 save 动作，处理“覆盖保存”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/scripts/Test.ts”，把 content 设为“...new code...”。调用完成后重点检查：文件内容被覆盖。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 10,
        "note": "来自 tests/test-report.json，自动化执行通过（10ms）"
      }
    },
    {
      "id": 179,
      "tool": "asset_operation",
      "action": "delete",
      "title": "删除资源",
      "input": {
        "action": "delete",
        "url": "db://assets/old/unused.png"
      },
      "expected": "永久删除",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Cocos Creator project assets via AssetDB. All assets are identified by db:// URLs (e.g. \"db://assets/textures/hero.png\").",
        "zhToolSummary": "通过 AssetDB 管理 Cocos Creator 项目资源。所有资源都通过 db:// URL 标识，例如 \"db://assets/textures/hero.png\"。",
        "actionDescription": "url(REQUIRED). Delete an asset permanently.",
        "zhActionDescription": "url（必填）。永久删除资源。",
        "sourceFile": "src/mcp/tools-asset.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 asset_operation 工具，执行 delete 动作，处理“删除资源”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/old/unused.png”。调用完成后重点检查：永久删除。",
          "actionGoal": "永久删除资源",
          "scenarioType": "参数场景",
          "scenarioTitle": "删除资源",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "asset_operation.delete",
          "fullPayload": "{\"action\":\"delete\",\"url\":\"db://assets/old/unused.png\"}",
          "inputText": "url=db://assets/old/unused.png",
          "executionStep": "调用 asset_operation.delete",
          "parameterNarrative": "这次请把 url 设为“db://assets/old/unused.png”。",
          "verificationFocus": "永久删除",
          "expectedText": "永久删除"
        },
        "naturalLanguageTest": "请通过 MCP 调用 asset_operation 工具，执行 delete 动作，处理“删除资源”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/old/unused.png”。调用完成后重点检查：永久删除。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 6,
        "note": "来自 tests/test-report.json，自动化执行通过（6ms）"
      }
    },
    {
      "id": 180,
      "tool": "asset_operation",
      "action": "move",
      "title": "移动资源",
      "input": {
        "action": "move",
        "sourceUrl": "db://assets/a.png",
        "targetUrl": "db://assets/textures/a.png"
      },
      "expected": "资源移到 textures 目录",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Cocos Creator project assets via AssetDB. All assets are identified by db:// URLs (e.g. \"db://assets/textures/hero.png\").",
        "zhToolSummary": "通过 AssetDB 管理 Cocos Creator 项目资源。所有资源都通过 db:// URL 标识，例如 \"db://assets/textures/hero.png\"。",
        "actionDescription": "sourceUrl(REQUIRED), targetUrl(REQUIRED). Move/rename asset to new path.",
        "zhActionDescription": "sourceUrl（必填），targetUrl（必填）。将资源移动或重命名到新路径。",
        "sourceFile": "src/mcp/tools-asset.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 asset_operation 工具，执行 move 动作，处理“移动资源”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 sourceUrl 设为“db://assets/a.png”，把 targetUrl 设为“db://assets/textures/a.png”。调用完成后重点检查：资源移到 textures 目录。",
          "actionGoal": "将资源移动或重命名到新路径",
          "scenarioType": "参数场景",
          "scenarioTitle": "移动资源",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "asset_operation.move",
          "fullPayload": "{\"action\":\"move\",\"sourceUrl\":\"db://assets/a.png\",\"targetUrl\":\"db://assets/textures/a.png\"}",
          "inputText": "sourceUrl=db://assets/a.png；targetUrl=db://assets/textures/a.png",
          "executionStep": "调用 asset_operation.move",
          "parameterNarrative": "这次请把 sourceUrl 设为“db://assets/a.png”，把 targetUrl 设为“db://assets/textures/a.png”。",
          "verificationFocus": "资源移到 textures 目录",
          "expectedText": "资源移到 textures 目录"
        },
        "naturalLanguageTest": "请通过 MCP 调用 asset_operation 工具，执行 move 动作，处理“移动资源”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 sourceUrl 设为“db://assets/a.png”，把 targetUrl 设为“db://assets/textures/a.png”。调用完成后重点检查：资源移到 textures 目录。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 21,
        "note": "来自 tests/test-report.json，自动化执行通过（21ms）"
      }
    },
    {
      "id": 181,
      "tool": "asset_operation",
      "action": "copy",
      "title": "复制资源",
      "input": {
        "action": "copy",
        "sourceUrl": "db://assets/a.png",
        "targetUrl": "db://assets/b.png"
      },
      "expected": "创建副本",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Cocos Creator project assets via AssetDB. All assets are identified by db:// URLs (e.g. \"db://assets/textures/hero.png\").",
        "zhToolSummary": "通过 AssetDB 管理 Cocos Creator 项目资源。所有资源都通过 db:// URL 标识，例如 \"db://assets/textures/hero.png\"。",
        "actionDescription": "sourceUrl(REQUIRED), targetUrl(REQUIRED). Duplicate asset to new path.",
        "zhActionDescription": "sourceUrl（必填），targetUrl（必填）。将资源复制到新路径。",
        "sourceFile": "src/mcp/tools-asset.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 asset_operation 工具，执行 copy 动作，处理“复制资源”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 sourceUrl 设为“db://assets/a.png”，把 targetUrl 设为“db://assets/b.png”。调用完成后重点检查：创建副本。",
          "actionGoal": "将资源复制到新路径",
          "scenarioType": "参数场景",
          "scenarioTitle": "复制资源",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "asset_operation.copy",
          "fullPayload": "{\"action\":\"copy\",\"sourceUrl\":\"db://assets/a.png\",\"targetUrl\":\"db://assets/b.png\"}",
          "inputText": "sourceUrl=db://assets/a.png；targetUrl=db://assets/b.png",
          "executionStep": "调用 asset_operation.copy",
          "parameterNarrative": "这次请把 sourceUrl 设为“db://assets/a.png”，把 targetUrl 设为“db://assets/b.png”。",
          "verificationFocus": "创建副本",
          "expectedText": "创建副本"
        },
        "naturalLanguageTest": "请通过 MCP 调用 asset_operation 工具，执行 copy 动作，处理“复制资源”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 sourceUrl 设为“db://assets/a.png”，把 targetUrl 设为“db://assets/b.png”。调用完成后重点检查：创建副本。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 4,
        "note": "来自 tests/test-report.json，自动化执行通过（4ms）"
      }
    },
    {
      "id": 182,
      "tool": "asset_operation",
      "action": "rename",
      "title": "重命名",
      "input": {
        "action": "rename",
        "url": "db://assets/old.png",
        "newName": "new.png"
      },
      "expected": "文件改名为 new.png",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Cocos Creator project assets via AssetDB. All assets are identified by db:// URLs (e.g. \"db://assets/textures/hero.png\").",
        "zhToolSummary": "通过 AssetDB 管理 Cocos Creator 项目资源。所有资源都通过 db:// URL 标识，例如 \"db://assets/textures/hero.png\"。",
        "actionDescription": "url(REQUIRED), newName(REQUIRED). Rename asset file (same directory).",
        "zhActionDescription": "url（必填），newName（必填）。重命名资源文件（同目录）。",
        "sourceFile": "src/mcp/tools-asset.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 asset_operation 工具，执行 rename 动作，处理“重命名”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/old.png”，把 newName 设为“new.png”。调用完成后重点检查：文件改名为 new.png。",
          "actionGoal": "重命名资源文件（同目录）",
          "scenarioType": "参数场景",
          "scenarioTitle": "重命名",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "asset_operation.rename",
          "fullPayload": "{\"action\":\"rename\",\"url\":\"db://assets/old.png\",\"newName\":\"new.png\"}",
          "inputText": "url=db://assets/old.png；newName=new.png",
          "executionStep": "调用 asset_operation.rename",
          "parameterNarrative": "这次请把 url 设为“db://assets/old.png”，把 newName 设为“new.png”。",
          "verificationFocus": "文件改名为 new.png",
          "expectedText": "文件改名为 new.png"
        },
        "naturalLanguageTest": "请通过 MCP 调用 asset_operation 工具，执行 rename 动作，处理“重命名”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/old.png”，把 newName 设为“new.png”。调用完成后重点检查：文件改名为 new.png。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 8,
        "note": "来自 tests/test-report.json，自动化执行通过（8ms）"
      }
    },
    {
      "id": 183,
      "tool": "asset_operation",
      "action": "create_folder",
      "title": "创建目录",
      "input": {
        "action": "create_folder",
        "url": "db://assets/prefabs"
      },
      "expected": "创建 prefabs 目录",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Cocos Creator project assets via AssetDB. All assets are identified by db:// URLs (e.g. \"db://assets/textures/hero.png\").",
        "zhToolSummary": "通过 AssetDB 管理 Cocos Creator 项目资源。所有资源都通过 db:// URL 标识，例如 \"db://assets/textures/hero.png\"。",
        "actionDescription": "url(REQUIRED, e.g. \"db://assets/prefabs\"). Create folder in asset database.",
        "zhActionDescription": "url（必填，例如 \"db://assets/prefabs\"）。在资源数据库中创建文件夹。",
        "sourceFile": "src/mcp/tools-asset.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 asset_operation 工具，执行 create_folder 动作，处理“创建目录”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/prefabs”。调用完成后重点检查：创建 prefabs 目录。",
          "actionGoal": "在资源数据库中创建文件夹",
          "scenarioType": "参数场景",
          "scenarioTitle": "创建目录",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "asset_operation.create_folder",
          "fullPayload": "{\"action\":\"create_folder\",\"url\":\"db://assets/prefabs\"}",
          "inputText": "url=db://assets/prefabs",
          "executionStep": "调用 asset_operation.create_folder",
          "parameterNarrative": "这次请把 url 设为“db://assets/prefabs”。",
          "verificationFocus": "创建 prefabs 目录",
          "expectedText": "创建 prefabs 目录"
        },
        "naturalLanguageTest": "请通过 MCP 调用 asset_operation 工具，执行 create_folder 动作，处理“创建目录”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/prefabs”。调用完成后重点检查：创建 prefabs 目录。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 4,
        "note": "来自 tests/test-report.json，自动化执行通过（4ms）"
      }
    },
    {
      "id": 184,
      "tool": "asset_operation",
      "action": "import",
      "title": "导入外部文件",
      "input": {
        "action": "import",
        "sourcePath": "C:/art/hero.png",
        "targetUrl": "db://assets/textures/hero.png"
      },
      "expected": "文件导入到 AssetDB",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Cocos Creator project assets via AssetDB. All assets are identified by db:// URLs (e.g. \"db://assets/textures/hero.png\").",
        "zhToolSummary": "通过 AssetDB 管理 Cocos Creator 项目资源。所有资源都通过 db:// URL 标识，例如 \"db://assets/textures/hero.png\"。",
        "actionDescription": "sourcePath(REQUIRED, absolute OS path), targetUrl(REQUIRED, db:// path). Import external file.",
        "zhActionDescription": "sourcePath（必填，操作系统绝对路径），targetUrl（必填，db：// 路径）。导入外部文件。",
        "sourceFile": "src/mcp/tools-asset.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 asset_operation 工具，执行 import 动作，处理“导入外部文件”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 sourcePath 设为“C:/art/hero.png”，把 targetUrl 设为“db://assets/textures/hero.png”。调用完成后重点检查：文件导入到 AssetDB。",
          "actionGoal": "导入外部文件",
          "scenarioType": "参数场景",
          "scenarioTitle": "导入外部文件",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "asset_operation.import",
          "fullPayload": "{\"action\":\"import\",\"sourcePath\":\"C:/art/hero.png\",\"targetUrl\":\"db://assets/textures/hero.png\"}",
          "inputText": "sourcePath=C:/art/hero.png；targetUrl=db://assets/textures/hero.png",
          "executionStep": "调用 asset_operation.import",
          "parameterNarrative": "这次请把 sourcePath 设为“C:/art/hero.png”，把 targetUrl 设为“db://assets/textures/hero.png”。",
          "verificationFocus": "文件导入到 AssetDB",
          "expectedText": "文件导入到 AssetDB"
        },
        "naturalLanguageTest": "请通过 MCP 调用 asset_operation 工具，执行 import 动作，处理“导入外部文件”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 sourcePath 设为“C:/art/hero.png”，把 targetUrl 设为“db://assets/textures/hero.png”。调用完成后重点检查：文件导入到 AssetDB。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 24,
        "note": "来自 tests/test-report.json，自动化执行通过（24ms）"
      }
    },
    {
      "id": 185,
      "tool": "asset_operation",
      "action": "batch_import",
      "title": "批量导入",
      "input": {
        "action": "batch_import",
        "files": [
          {
            "sourcePath": "C:/a.png",
            "targetUrl": "db://assets/a.png"
          },
          {
            "sourcePath": "C:/b.png",
            "targetUrl": "db://assets/b.png"
          }
        ]
      },
      "expected": "两个文件同时导入",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Cocos Creator project assets via AssetDB. All assets are identified by db:// URLs (e.g. \"db://assets/textures/hero.png\").",
        "zhToolSummary": "通过 AssetDB 管理 Cocos Creator 项目资源。所有资源都通过 db:// URL 标识，例如 \"db://assets/textures/hero.png\"。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-asset.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 asset_operation 工具，执行 batch_import 动作，处理“批量导入”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请传入 files=[{\"sourcePath\":\"C:/a.png\",\"targetUrl\":\"db://assets/a.png\"},{\"sourcePath\":\"C:/b.png\",\"targetUrl\":\"db://assets/b.png\"}]。调用完成后重点检查：两个文件同时导入。",
          "actionGoal": "通过 AssetDB 管理 Cocos Creator 项目资源",
          "scenarioType": "参数场景",
          "scenarioTitle": "批量导入",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "asset_operation.batch_import",
          "fullPayload": "{\"action\":\"batch_import\",\"files\":[{\"sourcePath\":\"C:/a.png\",\"targetUrl\":\"db://assets/a.png\"},{\"sourcePath\":\"C:/b.png\",\"targetUrl\":\"db://assets/b.png\"}]}",
          "inputText": "files=[{\"sourcePath\":\"C:/a.png\",\"targetUrl\":\"db://assets/a.png\"},{\"sourcePath\":\"C:/b.png\",\"targetUrl\":\"db://assets/b.png\"}]",
          "executionStep": "调用 asset_operation.batch_import",
          "parameterNarrative": "这次请传入 files=[{\"sourcePath\":\"C:/a.png\",\"targetUrl\":\"db://assets/a.png\"},{\"sourcePath\":\"C:/b.png\",\"targetUrl\":\"db://assets/b.png\"}]。",
          "verificationFocus": "两个文件同时导入",
          "expectedText": "两个文件同时导入"
        },
        "naturalLanguageTest": "请通过 MCP 调用 asset_operation 工具，执行 batch_import 动作，处理“批量导入”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请传入 files=[{\"sourcePath\":\"C:/a.png\",\"targetUrl\":\"db://assets/a.png\"},{\"sourcePath\":\"C:/b.png\",\"targetUrl\":\"db://assets/b.png\"}]。调用完成后重点检查：两个文件同时导入。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 2,
        "note": "来自 tests/test-report.json，自动化执行通过（2ms）"
      }
    },
    {
      "id": 186,
      "tool": "asset_operation",
      "action": "open",
      "title": "打开资源",
      "input": {
        "action": "open",
        "url": "db://assets/scenes/Main.scene"
      },
      "expected": "在编辑器中打开",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Cocos Creator project assets via AssetDB. All assets are identified by db:// URLs (e.g. \"db://assets/textures/hero.png\").",
        "zhToolSummary": "通过 AssetDB 管理 Cocos Creator 项目资源。所有资源都通过 db:// URL 标识，例如 \"db://assets/textures/hero.png\"。",
        "actionDescription": "url(REQUIRED). Open asset in default editor/viewer.",
        "zhActionDescription": "url（必填）。在默认编辑器或查看器中打开资源。",
        "sourceFile": "src/mcp/tools-asset.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 asset_operation 工具，执行 open 动作，处理“打开资源”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/scenes/Main.scene”。调用完成后重点检查：在编辑器中打开。",
          "actionGoal": "在默认编辑器或查看器中打开资源",
          "scenarioType": "参数场景",
          "scenarioTitle": "打开资源",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "asset_operation.open",
          "fullPayload": "{\"action\":\"open\",\"url\":\"db://assets/scenes/Main.scene\"}",
          "inputText": "url=db://assets/scenes/Main.scene",
          "executionStep": "调用 asset_operation.open",
          "parameterNarrative": "这次请把 url 设为“db://assets/scenes/Main.scene”。",
          "verificationFocus": "在编辑器中打开",
          "expectedText": "在编辑器中打开"
        },
        "naturalLanguageTest": "请通过 MCP 调用 asset_operation 工具，执行 open 动作，处理“打开资源”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/scenes/Main.scene”。调用完成后重点检查：在编辑器中打开。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 4,
        "note": "来自 tests/test-report.json，自动化执行通过（4ms）"
      }
    },
    {
      "id": 187,
      "tool": "asset_operation",
      "action": "refresh",
      "title": "刷新全库",
      "input": {
        "action": "refresh"
      },
      "expected": "整个 AssetDB 刷新",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Cocos Creator project assets via AssetDB. All assets are identified by db:// URLs (e.g. \"db://assets/textures/hero.png\").",
        "zhToolSummary": "通过 AssetDB 管理 Cocos Creator 项目资源。所有资源都通过 db:// URL 标识，例如 \"db://assets/textures/hero.png\"。",
        "actionDescription": "url(optional). Refresh asset database (specific folder or entire db).",
        "zhActionDescription": "url（可选）。刷新资源数据库（指定文件夹或整个资源库）。",
        "sourceFile": "src/mcp/tools-asset.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 asset_operation 工具，执行 refresh 动作，处理“刷新全库”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：整个 AssetDB 刷新。",
          "actionGoal": "刷新资源数据库（指定文件夹或整个资源库）",
          "scenarioType": "通用场景",
          "scenarioTitle": "刷新全库",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "asset_operation.refresh",
          "fullPayload": "{\"action\":\"refresh\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 asset_operation.refresh",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "整个 AssetDB 刷新",
          "expectedText": "整个 AssetDB 刷新"
        },
        "naturalLanguageTest": "请通过 MCP 调用 asset_operation 工具，执行 refresh 动作，处理“刷新全库”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：整个 AssetDB 刷新。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 533,
        "note": "来自 tests/test-report.json，自动化执行通过（533ms）"
      }
    },
    {
      "id": 188,
      "tool": "asset_operation",
      "action": "refresh",
      "title": "刷新目录",
      "input": {
        "action": "refresh",
        "url": "db://assets/textures"
      },
      "expected": "仅刷新 textures 目录",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Cocos Creator project assets via AssetDB. All assets are identified by db:// URLs (e.g. \"db://assets/textures/hero.png\").",
        "zhToolSummary": "通过 AssetDB 管理 Cocos Creator 项目资源。所有资源都通过 db:// URL 标识，例如 \"db://assets/textures/hero.png\"。",
        "actionDescription": "url(optional). Refresh asset database (specific folder or entire db).",
        "zhActionDescription": "url（可选）。刷新资源数据库（指定文件夹或整个资源库）。",
        "sourceFile": "src/mcp/tools-asset.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 asset_operation 工具，执行 refresh 动作，处理“刷新目录”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/textures”。调用完成后重点检查：仅刷新 textures 目录。",
          "actionGoal": "刷新资源数据库（指定文件夹或整个资源库）",
          "scenarioType": "参数场景",
          "scenarioTitle": "刷新目录",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "asset_operation.refresh",
          "fullPayload": "{\"action\":\"refresh\",\"url\":\"db://assets/textures\"}",
          "inputText": "url=db://assets/textures",
          "executionStep": "调用 asset_operation.refresh",
          "parameterNarrative": "这次请把 url 设为“db://assets/textures”。",
          "verificationFocus": "仅刷新 textures 目录",
          "expectedText": "仅刷新 textures 目录"
        },
        "naturalLanguageTest": "请通过 MCP 调用 asset_operation 工具，执行 refresh 动作，处理“刷新目录”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/textures”。调用完成后重点检查：仅刷新 textures 目录。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 513,
        "note": "来自 tests/test-report.json，自动化执行通过（513ms）"
      }
    },
    {
      "id": 189,
      "tool": "asset_operation",
      "action": "reimport",
      "title": "强制重新导入",
      "input": {
        "action": "reimport",
        "url": "db://assets/textures/hero.png"
      },
      "expected": "资源重新导入处理",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Cocos Creator project assets via AssetDB. All assets are identified by db:// URLs (e.g. \"db://assets/textures/hero.png\").",
        "zhToolSummary": "通过 AssetDB 管理 Cocos Creator 项目资源。所有资源都通过 db:// URL 标识，例如 \"db://assets/textures/hero.png\"。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-asset.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 asset_operation 工具，执行 reimport 动作，处理“强制重新导入”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/textures/hero.png”。调用完成后重点检查：资源重新导入处理。",
          "actionGoal": "通过 AssetDB 管理 Cocos Creator 项目资源",
          "scenarioType": "参数场景",
          "scenarioTitle": "强制重新导入",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "asset_operation.reimport",
          "fullPayload": "{\"action\":\"reimport\",\"url\":\"db://assets/textures/hero.png\"}",
          "inputText": "url=db://assets/textures/hero.png",
          "executionStep": "调用 asset_operation.reimport",
          "parameterNarrative": "这次请把 url 设为“db://assets/textures/hero.png”。",
          "verificationFocus": "资源重新导入处理",
          "expectedText": "资源重新导入处理"
        },
        "naturalLanguageTest": "请通过 MCP 调用 asset_operation 工具，执行 reimport 动作，处理“强制重新导入”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/textures/hero.png”。调用完成后重点检查：资源重新导入处理。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 3,
        "note": "来自 tests/test-report.json，自动化执行通过（3ms）"
      }
    },
    {
      "id": 190,
      "tool": "asset_operation",
      "action": "show_in_explorer",
      "title": "在资源管理器中显示",
      "input": {
        "action": "show_in_explorer",
        "url": "db://assets/textures/hero.png"
      },
      "expected": "打开系统文件管理器定位到文件",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Cocos Creator project assets via AssetDB. All assets are identified by db:// URLs (e.g. \"db://assets/textures/hero.png\").",
        "zhToolSummary": "通过 AssetDB 管理 Cocos Creator 项目资源。所有资源都通过 db:// URL 标识，例如 \"db://assets/textures/hero.png\"。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-asset.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 asset_operation 工具，执行 show_in_explorer 动作，处理“在资源管理器中显示”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/textures/hero.png”。调用完成后重点检查：打开系统文件管理器定位到文件。",
          "actionGoal": "通过 AssetDB 管理 Cocos Creator 项目资源",
          "scenarioType": "参数场景",
          "scenarioTitle": "在资源管理器中显示",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "asset_operation.show_in_explorer",
          "fullPayload": "{\"action\":\"show_in_explorer\",\"url\":\"db://assets/textures/hero.png\"}",
          "inputText": "url=db://assets/textures/hero.png",
          "executionStep": "调用 asset_operation.show_in_explorer",
          "parameterNarrative": "这次请把 url 设为“db://assets/textures/hero.png”。",
          "verificationFocus": "打开系统文件管理器定位到文件",
          "expectedText": "打开系统文件管理器定位到文件"
        },
        "naturalLanguageTest": "请通过 MCP 调用 asset_operation 工具，执行 show_in_explorer 动作，处理“在资源管理器中显示”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/textures/hero.png”。调用完成后重点检查：打开系统文件管理器定位到文件。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 2,
        "note": "来自 tests/test-report.json，自动化执行通过（2ms）"
      }
    },
    {
      "id": 191,
      "tool": "asset_operation",
      "action": "uuid_to_url",
      "title": "UUID→URL",
      "input": {
        "action": "uuid_to_url",
        "uuid": "<asset-uuid>"
      },
      "expected": "返回 db:// 路径",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Cocos Creator project assets via AssetDB. All assets are identified by db:// URLs (e.g. \"db://assets/textures/hero.png\").",
        "zhToolSummary": "通过 AssetDB 管理 Cocos Creator 项目资源。所有资源都通过 db:// URL 标识，例如 \"db://assets/textures/hero.png\"。",
        "actionDescription": "uuid(REQUIRED). Convert asset UUID to db:// URL.",
        "zhActionDescription": "uuid（必填）。将资源 UUID 转换为 db:// URL。",
        "sourceFile": "src/mcp/tools-asset.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 asset_operation 工具，执行 uuid_to_url 动作，处理“UUID→URL”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <asset-uuid>。调用完成后重点检查：返回 db:// 路径。",
          "actionGoal": "将资源 UUID 转换为 db:// URL",
          "scenarioType": "参数场景",
          "scenarioTitle": "UUID→URL",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "asset_operation.uuid_to_url",
          "fullPayload": "{\"action\":\"uuid_to_url\",\"uuid\":\"<asset-uuid>\"}",
          "inputText": "uuid=<asset-uuid>",
          "executionStep": "调用 asset_operation.uuid_to_url",
          "parameterNarrative": "这次请将 uuid 指向 <asset-uuid>。",
          "verificationFocus": "返回 db:// 路径",
          "expectedText": "返回 db:// 路径"
        },
        "naturalLanguageTest": "请通过 MCP 调用 asset_operation 工具，执行 uuid_to_url 动作，处理“UUID→URL”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <asset-uuid>。调用完成后重点检查：返回 db:// 路径。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 4,
        "note": "来自 tests/test-report.json，自动化执行通过（4ms）"
      }
    },
    {
      "id": 192,
      "tool": "asset_operation",
      "action": "url_to_uuid",
      "title": "URL→UUID",
      "input": {
        "action": "url_to_uuid",
        "url": "db://assets/textures/hero.png"
      },
      "expected": "返回 UUID 字符串",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Cocos Creator project assets via AssetDB. All assets are identified by db:// URLs (e.g. \"db://assets/textures/hero.png\").",
        "zhToolSummary": "通过 AssetDB 管理 Cocos Creator 项目资源。所有资源都通过 db:// URL 标识，例如 \"db://assets/textures/hero.png\"。",
        "actionDescription": "url(REQUIRED). Convert db:// URL to UUID.",
        "zhActionDescription": "url（必填）。将 db:// URL 转换为 UUID。",
        "sourceFile": "src/mcp/tools-asset.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 asset_operation 工具，执行 url_to_uuid 动作，处理“URL→UUID”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/textures/hero.png”。调用完成后重点检查：返回 UUID 字符串。",
          "actionGoal": "将 db:// URL 转换为 UUID",
          "scenarioType": "参数场景",
          "scenarioTitle": "URL→UUID",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "asset_operation.url_to_uuid",
          "fullPayload": "{\"action\":\"url_to_uuid\",\"url\":\"db://assets/textures/hero.png\"}",
          "inputText": "url=db://assets/textures/hero.png",
          "executionStep": "调用 asset_operation.url_to_uuid",
          "parameterNarrative": "这次请把 url 设为“db://assets/textures/hero.png”。",
          "verificationFocus": "返回 UUID 字符串",
          "expectedText": "返回 UUID 字符串"
        },
        "naturalLanguageTest": "请通过 MCP 调用 asset_operation 工具，执行 url_to_uuid 动作，处理“URL→UUID”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/textures/hero.png”。调用完成后重点检查：返回 UUID 字符串。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 3,
        "note": "来自 tests/test-report.json，自动化执行通过（3ms）"
      }
    },
    {
      "id": 193,
      "tool": "asset_operation",
      "action": "get_dependencies",
      "title": "查依赖",
      "input": {
        "action": "get_dependencies",
        "url": "db://assets/prefabs/Hero.prefab"
      },
      "expected": "返回依赖的纹理、脚本等列表",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Cocos Creator project assets via AssetDB. All assets are identified by db:// URLs (e.g. \"db://assets/textures/hero.png\").",
        "zhToolSummary": "通过 AssetDB 管理 Cocos Creator 项目资源。所有资源都通过 db:// URL 标识，例如 \"db://assets/textures/hero.png\"。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-asset.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 asset_operation 工具，执行 get_dependencies 动作，处理“查依赖”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/prefabs/Hero.prefab”。调用完成后重点检查：返回依赖的纹理、脚本等列表。",
          "actionGoal": "通过 AssetDB 管理 Cocos Creator 项目资源",
          "scenarioType": "参数场景",
          "scenarioTitle": "查依赖",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "asset_operation.get_dependencies",
          "fullPayload": "{\"action\":\"get_dependencies\",\"url\":\"db://assets/prefabs/Hero.prefab\"}",
          "inputText": "url=db://assets/prefabs/Hero.prefab",
          "executionStep": "调用 asset_operation.get_dependencies",
          "parameterNarrative": "这次请把 url 设为“db://assets/prefabs/Hero.prefab”。",
          "verificationFocus": "返回依赖的纹理、脚本等列表",
          "expectedText": "返回依赖的纹理、脚本等列表"
        },
        "naturalLanguageTest": "请通过 MCP 调用 asset_operation 工具，执行 get_dependencies 动作，处理“查依赖”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/prefabs/Hero.prefab”。调用完成后重点检查：返回依赖的纹理、脚本等列表。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 3,
        "note": "来自 tests/test-report.json，自动化执行通过（3ms）"
      }
    },
    {
      "id": 194,
      "tool": "asset_operation",
      "action": "get_dependents",
      "title": "查被引用",
      "input": {
        "action": "get_dependents",
        "url": "db://assets/textures/hero.png"
      },
      "expected": "返回引用此纹理的 Prefab/场景列表",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Cocos Creator project assets via AssetDB. All assets are identified by db:// URLs (e.g. \"db://assets/textures/hero.png\").",
        "zhToolSummary": "通过 AssetDB 管理 Cocos Creator 项目资源。所有资源都通过 db:// URL 标识，例如 \"db://assets/textures/hero.png\"。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-asset.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 asset_operation 工具，执行 get_dependents 动作，处理“查被引用”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/textures/hero.png”。调用完成后重点检查：返回引用此纹理的 Prefab/场景列表。",
          "actionGoal": "通过 AssetDB 管理 Cocos Creator 项目资源",
          "scenarioType": "参数场景",
          "scenarioTitle": "查被引用",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "asset_operation.get_dependents",
          "fullPayload": "{\"action\":\"get_dependents\",\"url\":\"db://assets/textures/hero.png\"}",
          "inputText": "url=db://assets/textures/hero.png",
          "executionStep": "调用 asset_operation.get_dependents",
          "parameterNarrative": "这次请把 url 设为“db://assets/textures/hero.png”。",
          "verificationFocus": "返回引用此纹理的 Prefab/场景列表",
          "expectedText": "返回引用此纹理的 Prefab/场景列表"
        },
        "naturalLanguageTest": "请通过 MCP 调用 asset_operation 工具，执行 get_dependents 动作，处理“查被引用”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/textures/hero.png”。调用完成后重点检查：返回引用此纹理的 Prefab/场景列表。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 3,
        "note": "来自 tests/test-report.json，自动化执行通过（3ms）"
      }
    },
    {
      "id": 195,
      "tool": "asset_operation",
      "action": "get_meta",
      "title": "获取 meta",
      "input": {
        "action": "get_meta",
        "url": "db://assets/textures/hero.png"
      },
      "expected": "返回完整 .meta JSON",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Cocos Creator project assets via AssetDB. All assets are identified by db:// URLs (e.g. \"db://assets/textures/hero.png\").",
        "zhToolSummary": "通过 AssetDB 管理 Cocos Creator 项目资源。所有资源都通过 db:// URL 标识，例如 \"db://assets/textures/hero.png\"。",
        "actionDescription": "url(REQUIRED). Get full .meta file content as JSON.",
        "zhActionDescription": "url（必填）。获取完整 .meta 文件内容，并以 JSON 返回。",
        "sourceFile": "src/mcp/tools-asset.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 asset_operation 工具，执行 get_meta 动作，处理“获取 meta”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/textures/hero.png”。调用完成后重点检查：返回完整 .meta JSON。",
          "actionGoal": "获取完整",
          "scenarioType": "参数场景",
          "scenarioTitle": "获取 meta",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "asset_operation.get_meta",
          "fullPayload": "{\"action\":\"get_meta\",\"url\":\"db://assets/textures/hero.png\"}",
          "inputText": "url=db://assets/textures/hero.png",
          "executionStep": "调用 asset_operation.get_meta",
          "parameterNarrative": "这次请把 url 设为“db://assets/textures/hero.png”。",
          "verificationFocus": "返回完整 .meta JSON",
          "expectedText": "返回完整 .meta JSON"
        },
        "naturalLanguageTest": "请通过 MCP 调用 asset_operation 工具，执行 get_meta 动作，处理“获取 meta”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/textures/hero.png”。调用完成后重点检查：返回完整 .meta JSON。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 5,
        "note": "来自 tests/test-report.json，自动化执行通过（5ms）"
      }
    },
    {
      "id": 196,
      "tool": "asset_operation",
      "action": "set_meta_property",
      "title": "修改 meta",
      "input": {
        "action": "set_meta_property",
        "url": "db://assets/textures/hero.png",
        "property": "userData",
        "value": {
          "customTag": "player"
        }
      },
      "expected": "userData 字段被修改",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Cocos Creator project assets via AssetDB. All assets are identified by db:// URLs (e.g. \"db://assets/textures/hero.png\").",
        "zhToolSummary": "通过 AssetDB 管理 Cocos Creator 项目资源。所有资源都通过 db:// URL 标识，例如 \"db://assets/textures/hero.png\"。",
        "actionDescription": "url(REQUIRED), property(REQUIRED), value(REQUIRED). Modify a .meta property.",
        "zhActionDescription": "url（必填），property（必填），value（必填）。修改 .meta 属性。",
        "sourceFile": "src/mcp/tools-asset.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 asset_operation 工具，执行 set_meta_property 动作，处理“修改 meta”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/textures/hero.png”，把 property 设为“userData”，传入 value={\"customTag\":\"player\"}。调用完成后重点检查：userData 字段被修改。",
          "actionGoal": "修改",
          "scenarioType": "参数场景",
          "scenarioTitle": "修改 meta",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "asset_operation.set_meta_property",
          "fullPayload": "{\"action\":\"set_meta_property\",\"url\":\"db://assets/textures/hero.png\",\"property\":\"userData\",\"value\":{\"customTag\":\"player\"}}",
          "inputText": "url=db://assets/textures/hero.png；property=userData；value={\"customTag\":\"player\"}",
          "executionStep": "调用 asset_operation.set_meta_property",
          "parameterNarrative": "这次请把 url 设为“db://assets/textures/hero.png”，把 property 设为“userData”，传入 value={\"customTag\":\"player\"}。",
          "verificationFocus": "userData 字段被修改",
          "expectedText": "userData 字段被修改"
        },
        "naturalLanguageTest": "请通过 MCP 调用 asset_operation 工具，执行 set_meta_property 动作，处理“修改 meta”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/textures/hero.png”，把 property 设为“userData”，传入 value={\"customTag\":\"player\"}。调用完成后重点检查：userData 字段被修改。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 14,
        "note": "来自 tests/test-report.json，自动化执行通过（14ms）"
      }
    },
    {
      "id": 197,
      "tool": "asset_operation",
      "action": "get_asset_size",
      "title": "文件大小",
      "input": {
        "action": "get_asset_size",
        "url": "db://assets/textures/hero.png"
      },
      "expected": "返回 {bytes:102400,kb:\"100.0\",mb:\"0.10\"}",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Cocos Creator project assets via AssetDB. All assets are identified by db:// URLs (e.g. \"db://assets/textures/hero.png\").",
        "zhToolSummary": "通过 AssetDB 管理 Cocos Creator 项目资源。所有资源都通过 db:// URL 标识，例如 \"db://assets/textures/hero.png\"。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-asset.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 asset_operation 工具，执行 get_asset_size 动作，处理“文件大小”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/textures/hero.png”。调用完成后重点检查：返回 {bytes:102400,kb:\"100.0\",mb:\"0.10\"}。",
          "actionGoal": "通过 AssetDB 管理 Cocos Creator 项目资源",
          "scenarioType": "参数场景",
          "scenarioTitle": "文件大小",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "asset_operation.get_asset_size",
          "fullPayload": "{\"action\":\"get_asset_size\",\"url\":\"db://assets/textures/hero.png\"}",
          "inputText": "url=db://assets/textures/hero.png",
          "executionStep": "调用 asset_operation.get_asset_size",
          "parameterNarrative": "这次请把 url 设为“db://assets/textures/hero.png”。",
          "verificationFocus": "返回 {bytes:102400,kb:\"100.0\",mb:\"0.10\"}",
          "expectedText": "返回 {bytes:102400,kb:\"100.0\",mb:\"0.10\"}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 asset_operation 工具，执行 get_asset_size 动作，处理“文件大小”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/textures/hero.png”。调用完成后重点检查：返回 {bytes:102400,kb:\"100.0\",mb:\"0.10\"}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 2,
        "note": "来自 tests/test-report.json，自动化执行通过（2ms）"
      }
    },
    {
      "id": 198,
      "tool": "asset_operation",
      "action": "search_by_type",
      "title": "按类型搜索",
      "input": {
        "action": "search_by_type",
        "type": "cc.Prefab"
      },
      "expected": "返回所有 Prefab 资源列表",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Cocos Creator project assets via AssetDB. All assets are identified by db:// URLs (e.g. \"db://assets/textures/hero.png\").",
        "zhToolSummary": "通过 AssetDB 管理 Cocos Creator 项目资源。所有资源都通过 db:// URL 标识，例如 \"db://assets/textures/hero.png\"。",
        "actionDescription": "type(REQUIRED, e.g. \"cc.ImageAsset\", \"cc.Prefab\"), pattern(optional).",
        "zhActionDescription": "type（必填，例如 \"cc.ImageAsset\"、\"cc.Prefab\"），pattern（可选）。",
        "sourceFile": "src/mcp/tools-asset.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 asset_operation 工具，执行 search_by_type 动作，处理“按类型搜索”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 type 设为“cc.Prefab”。调用完成后重点检查：返回所有 Prefab 资源列表。",
          "actionGoal": "ImageAsset\"、\"cc",
          "scenarioType": "参数场景",
          "scenarioTitle": "按类型搜索",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "asset_operation.search_by_type",
          "fullPayload": "{\"action\":\"search_by_type\",\"type\":\"cc.Prefab\"}",
          "inputText": "type=cc.Prefab",
          "executionStep": "调用 asset_operation.search_by_type",
          "parameterNarrative": "这次请把 type 设为“cc.Prefab”。",
          "verificationFocus": "返回所有 Prefab 资源列表",
          "expectedText": "返回所有 Prefab 资源列表"
        },
        "naturalLanguageTest": "请通过 MCP 调用 asset_operation 工具，执行 search_by_type 动作，处理“按类型搜索”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 type 设为“cc.Prefab”。调用完成后重点检查：返回所有 Prefab 资源列表。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 13,
        "note": "来自 tests/test-report.json，自动化执行通过（13ms）"
      }
    },
    {
      "id": 199,
      "tool": "asset_operation",
      "action": "get_animation_clips",
      "title": "所有动画片段",
      "input": {
        "action": "get_animation_clips"
      },
      "expected": "返回项目中全部 .anim 文件",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Cocos Creator project assets via AssetDB. All assets are identified by db:// URLs (e.g. \"db://assets/textures/hero.png\").",
        "zhToolSummary": "通过 AssetDB 管理 Cocos Creator 项目资源。所有资源都通过 db:// URL 标识，例如 \"db://assets/textures/hero.png\"。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-asset.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 asset_operation 工具，执行 get_animation_clips 动作，处理“所有动画片段”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回项目中全部 .anim 文件。",
          "actionGoal": "通过 AssetDB 管理 Cocos Creator 项目资源",
          "scenarioType": "通用场景",
          "scenarioTitle": "所有动画片段",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "asset_operation.get_animation_clips",
          "fullPayload": "{\"action\":\"get_animation_clips\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 asset_operation.get_animation_clips",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回项目中全部 .anim 文件",
          "expectedText": "返回项目中全部 .anim 文件"
        },
        "naturalLanguageTest": "请通过 MCP 调用 asset_operation 工具，执行 get_animation_clips 动作，处理“所有动画片段”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回项目中全部 .anim 文件。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 3,
        "note": "来自 tests/test-report.json，自动化执行通过（3ms）"
      }
    },
    {
      "id": 200,
      "tool": "asset_operation",
      "action": "get_materials",
      "title": "所有材质",
      "input": {
        "action": "get_materials"
      },
      "expected": "返回项目中全部 .mtl 文件",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Cocos Creator project assets via AssetDB. All assets are identified by db:// URLs (e.g. \"db://assets/textures/hero.png\").",
        "zhToolSummary": "通过 AssetDB 管理 Cocos Creator 项目资源。所有资源都通过 db:// URL 标识，例如 \"db://assets/textures/hero.png\"。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-asset.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 asset_operation 工具，执行 get_materials 动作，处理“所有材质”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回项目中全部 .mtl 文件。",
          "actionGoal": "通过 AssetDB 管理 Cocos Creator 项目资源",
          "scenarioType": "通用场景",
          "scenarioTitle": "所有材质",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "asset_operation.get_materials",
          "fullPayload": "{\"action\":\"get_materials\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 asset_operation.get_materials",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回项目中全部 .mtl 文件",
          "expectedText": "返回项目中全部 .mtl 文件"
        },
        "naturalLanguageTest": "请通过 MCP 调用 asset_operation 工具，执行 get_materials 动作，处理“所有材质”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回项目中全部 .mtl 文件。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 4,
        "note": "来自 tests/test-report.json，自动化执行通过（4ms）"
      }
    },
    {
      "id": 201,
      "tool": "asset_operation",
      "action": "clean_unused",
      "title": "未使用资源",
      "input": {
        "action": "clean_unused"
      },
      "expected": "返回可能未使用的资源列表（需人工审查）",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Cocos Creator project assets via AssetDB. All assets are identified by db:// URLs (e.g. \"db://assets/textures/hero.png\").",
        "zhToolSummary": "通过 AssetDB 管理 Cocos Creator 项目资源。所有资源都通过 db:// URL 标识，例如 \"db://assets/textures/hero.png\"。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-asset.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 asset_operation 工具，执行 clean_unused 动作，处理“未使用资源”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回可能未使用的资源列表（需人工审查）。",
          "actionGoal": "通过 AssetDB 管理 Cocos Creator 项目资源",
          "scenarioType": "通用场景",
          "scenarioTitle": "未使用资源",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "asset_operation.clean_unused",
          "fullPayload": "{\"action\":\"clean_unused\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 asset_operation.clean_unused",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回可能未使用的资源列表（需人工审查）",
          "expectedText": "返回可能未使用的资源列表（需人工审查）"
        },
        "naturalLanguageTest": "请通过 MCP 调用 asset_operation 工具，执行 clean_unused 动作，处理“未使用资源”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回可能未使用的资源列表（需人工审查）。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 8,
        "note": "来自 tests/test-report.json，自动化执行通过（8ms）"
      }
    },
    {
      "id": 202,
      "tool": "asset_operation",
      "action": "validate_asset",
      "title": "验证资源",
      "input": {
        "action": "validate_asset",
        "url": "db://assets/textures/hero.png"
      },
      "expected": "返回 {valid:true/false,issues[]}",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Cocos Creator project assets via AssetDB. All assets are identified by db:// URLs (e.g. \"db://assets/textures/hero.png\").",
        "zhToolSummary": "通过 AssetDB 管理 Cocos Creator 项目资源。所有资源都通过 db:// URL 标识，例如 \"db://assets/textures/hero.png\"。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-asset.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 asset_operation 工具，执行 validate_asset 动作，处理“验证资源”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/textures/hero.png”。调用完成后重点检查：返回 {valid:true/false,issues[]}。",
          "actionGoal": "通过 AssetDB 管理 Cocos Creator 项目资源",
          "scenarioType": "参数场景",
          "scenarioTitle": "验证资源",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "asset_operation.validate_asset",
          "fullPayload": "{\"action\":\"validate_asset\",\"url\":\"db://assets/textures/hero.png\"}",
          "inputText": "url=db://assets/textures/hero.png",
          "executionStep": "调用 asset_operation.validate_asset",
          "parameterNarrative": "这次请把 url 设为“db://assets/textures/hero.png”。",
          "verificationFocus": "返回 {valid:true/false,issues[]}",
          "expectedText": "返回 {valid:true/false,issues[]}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 asset_operation 工具，执行 validate_asset 动作，处理“验证资源”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/textures/hero.png”。调用完成后重点检查：返回 {valid:true/false,issues[]}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 11,
        "note": "来自 tests/test-report.json，自动化执行通过（11ms）"
      }
    },
    {
      "id": 203,
      "tool": "asset_operation",
      "action": "export_asset_manifest",
      "title": "导出清单",
      "input": {
        "action": "export_asset_manifest"
      },
      "expected": "返回完整资源清单+类型分布统计",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Cocos Creator project assets via AssetDB. All assets are identified by db:// URLs (e.g. \"db://assets/textures/hero.png\").",
        "zhToolSummary": "通过 AssetDB 管理 Cocos Creator 项目资源。所有资源都通过 db:// URL 标识，例如 \"db://assets/textures/hero.png\"。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-asset.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 asset_operation 工具，执行 export_asset_manifest 动作，处理“导出清单”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回完整资源清单+类型分布统计。",
          "actionGoal": "通过 AssetDB 管理 Cocos Creator 项目资源",
          "scenarioType": "通用场景",
          "scenarioTitle": "导出清单",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "asset_operation.export_asset_manifest",
          "fullPayload": "{\"action\":\"export_asset_manifest\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 asset_operation.export_asset_manifest",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回完整资源清单+类型分布统计",
          "expectedText": "返回完整资源清单+类型分布统计"
        },
        "naturalLanguageTest": "请通过 MCP 调用 asset_operation 工具，执行 export_asset_manifest 动作，处理“导出清单”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回完整资源清单+类型分布统计。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 2,
        "note": "来自 tests/test-report.json，自动化执行通过（2ms）"
      }
    },
    {
      "id": 204,
      "tool": "asset_operation",
      "action": "pack_atlas",
      "title": "打包图集",
      "input": {
        "action": "pack_atlas",
        "url": "db://assets/atlas/ui"
      },
      "expected": "触发图集重新打包",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Cocos Creator project assets via AssetDB. All assets are identified by db:// URLs (e.g. \"db://assets/textures/hero.png\").",
        "zhToolSummary": "通过 AssetDB 管理 Cocos Creator 项目资源。所有资源都通过 db:// URL 标识，例如 \"db://assets/textures/hero.png\"。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-asset.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 asset_operation 工具，执行 pack_atlas 动作，处理“打包图集”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/atlas/ui”。调用完成后重点检查：触发图集重新打包。",
          "actionGoal": "通过 AssetDB 管理 Cocos Creator 项目资源",
          "scenarioType": "参数场景",
          "scenarioTitle": "打包图集",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "asset_operation.pack_atlas",
          "fullPayload": "{\"action\":\"pack_atlas\",\"url\":\"db://assets/atlas/ui\"}",
          "inputText": "url=db://assets/atlas/ui",
          "executionStep": "调用 asset_operation.pack_atlas",
          "parameterNarrative": "这次请把 url 设为“db://assets/atlas/ui”。",
          "verificationFocus": "触发图集重新打包",
          "expectedText": "触发图集重新打包"
        },
        "naturalLanguageTest": "请通过 MCP 调用 asset_operation 工具，执行 pack_atlas 动作，处理“打包图集”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/atlas/ui”。调用完成后重点检查：触发图集重新打包。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 3,
        "note": "来自 tests/test-report.json，自动化执行通过（3ms）"
      }
    },
    {
      "id": 205,
      "tool": "asset_operation",
      "action": "slice_sprite",
      "title": "九宫格切图",
      "input": {
        "action": "slice_sprite",
        "url": "db://assets/ui/panel.png/spriteFrame",
        "borderTop": 20,
        "borderBottom": 20,
        "borderLeft": 30,
        "borderRight": 30
      },
      "expected": "设置九宫格边距",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Cocos Creator project assets via AssetDB. All assets are identified by db:// URLs (e.g. \"db://assets/textures/hero.png\").",
        "zhToolSummary": "通过 AssetDB 管理 Cocos Creator 项目资源。所有资源都通过 db:// URL 标识，例如 \"db://assets/textures/hero.png\"。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-asset.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 asset_operation 工具，执行 slice_sprite 动作，处理“九宫格切图”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/ui/panel.png/spriteFrame”，把 borderTop 设为 20，把 borderBottom 设为 20，把 borderLeft 设为 30，把 borderRight 设为 30。调用完成后重点检查：设置九宫格边距。",
          "actionGoal": "通过 AssetDB 管理 Cocos Creator 项目资源",
          "scenarioType": "参数场景",
          "scenarioTitle": "九宫格切图",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "asset_operation.slice_sprite",
          "fullPayload": "{\"action\":\"slice_sprite\",\"url\":\"db://assets/ui/panel.png/spriteFrame\",\"borderTop\":20,\"borderBottom\":20,\"borderLeft\":30,\"borderRight\":30}",
          "inputText": "url=db://assets/ui/panel.png/spriteFrame；borderTop=20；borderBottom=20；borderLeft=30；borderRight=30",
          "executionStep": "调用 asset_operation.slice_sprite",
          "parameterNarrative": "这次请把 url 设为“db://assets/ui/panel.png/spriteFrame”，把 borderTop 设为 20，把 borderBottom 设为 20，把 borderLeft 设为 30，把 borderRight 设为 30。",
          "verificationFocus": "设置九宫格边距",
          "expectedText": "设置九宫格边距"
        },
        "naturalLanguageTest": "请通过 MCP 调用 asset_operation 工具，执行 slice_sprite 动作，处理“九宫格切图”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/ui/panel.png/spriteFrame”，把 borderTop 设为 20，把 borderBottom 设为 20，把 borderLeft 设为 30，把 borderRight 设为 30。调用完成后重点检查：设置九宫格边距。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 3,
        "note": "来自 tests/test-report.json，自动化执行通过（3ms）"
      }
    },
    {
      "id": 206,
      "tool": "asset_operation",
      "action": "create_material",
      "title": "创建材质",
      "input": {
        "action": "create_material",
        "url": "db://assets/materials/Glass.mtl",
        "effectName": "builtin-standard",
        "uniforms": {
          "mainColor": {
            "r": 200,
            "g": 230,
            "b": 255,
            "a": 128
          }
        }
      },
      "expected": "创建半透明玻璃材质",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Cocos Creator project assets via AssetDB. All assets are identified by db:// URLs (e.g. \"db://assets/textures/hero.png\").",
        "zhToolSummary": "通过 AssetDB 管理 Cocos Creator 项目资源。所有资源都通过 db:// URL 标识，例如 \"db://assets/textures/hero.png\"。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-asset.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 asset_operation 工具，执行 create_material 动作，处理“创建材质”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/materials/Glass.mtl”，把 effectName 设为“builtin-standard”，传入 uniforms={\"mainColor\":{\"r\":200,\"g\":230,\"b\":255,\"a\":128}}。调用完成后重点检查：创建半透明玻璃材质。",
          "actionGoal": "通过 AssetDB 管理 Cocos Creator 项目资源",
          "scenarioType": "参数场景",
          "scenarioTitle": "创建材质",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "asset_operation.create_material",
          "fullPayload": "{\"action\":\"create_material\",\"url\":\"db://assets/materials/Glass.mtl\",\"effectName\":\"builtin-standard\",\"uniforms\":{\"mainColor\":{\"r\":200,\"g\":230,\"b\":255,\"a\":128}}}",
          "inputText": "url=db://assets/materials/Glass.mtl；effectName=builtin-standard；uniforms={\"mainColor\":{\"r\":200,\"g\":230,\"b\":255,\"a\":128}}",
          "executionStep": "调用 asset_operation.create_material",
          "parameterNarrative": "这次请把 url 设为“db://assets/materials/Glass.mtl”，把 effectName 设为“builtin-standard”，传入 uniforms={\"mainColor\":{\"r\":200,\"g\":230,\"b\":255,\"a\":128}}。",
          "verificationFocus": "创建半透明玻璃材质",
          "expectedText": "创建半透明玻璃材质"
        },
        "naturalLanguageTest": "请通过 MCP 调用 asset_operation 工具，执行 create_material 动作，处理“创建材质”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/materials/Glass.mtl”，把 effectName 设为“builtin-standard”，传入 uniforms={\"mainColor\":{\"r\":200,\"g\":230,\"b\":255,\"a\":128}}。调用完成后重点检查：创建半透明玻璃材质。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 2,
        "note": "来自 tests/test-report.json，自动化执行通过（2ms）"
      }
    },
    {
      "id": 207,
      "tool": "asset_operation",
      "action": "generate_script",
      "title": "生成脚本",
      "input": {
        "action": "generate_script",
        "url": "db://assets/scripts/Player.ts",
        "className": "Player",
        "scriptProperties": [
          {
            "name": "speed",
            "type": "number",
            "default": 10
          }
        ],
        "lifecycle": [
          "onLoad",
          "update"
        ]
      },
      "expected": "生成带 @property speed 和 onLoad/update 的脚本",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Cocos Creator project assets via AssetDB. All assets are identified by db:// URLs (e.g. \"db://assets/textures/hero.png\").",
        "zhToolSummary": "通过 AssetDB 管理 Cocos Creator 项目资源。所有资源都通过 db:// URL 标识，例如 \"db://assets/textures/hero.png\"。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-asset.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 asset_operation 工具，执行 generate_script 动作，处理“生成脚本”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/scripts/Player.ts”，把 className 设为“Player”，传入 scriptProperties=[{\"name\":\"speed\",\"type\":\"number\",\"default\":10}]，传入 lifecycle=[\"onLoad\",\"update\"]。调用完成后重点检查：生成带 @property speed 和 onLoad/update 的脚本。",
          "actionGoal": "通过 AssetDB 管理 Cocos Creator 项目资源",
          "scenarioType": "参数场景",
          "scenarioTitle": "生成脚本",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "asset_operation.generate_script",
          "fullPayload": "{\"action\":\"generate_script\",\"url\":\"db://assets/scripts/Player.ts\",\"className\":\"Player\",\"scriptProperties\":[{\"name\":\"speed\",\"type\":\"number\",\"default\":10}],\"lifecycle\":[\"onLoad\",\"update\"]}",
          "inputText": "url=db://assets/scripts/Player.ts；className=Player；scriptProperties=[{\"name\":\"speed\",\"type\":\"number\",\"default\":10}]；lifecycle=[\"onLoad\",\"update\"]",
          "executionStep": "调用 asset_operation.generate_script",
          "parameterNarrative": "这次请把 url 设为“db://assets/scripts/Player.ts”，把 className 设为“Player”，传入 scriptProperties=[{\"name\":\"speed\",\"type\":\"number\",\"default\":10}]，传入 lifecycle=[\"onLoad\",\"update\"]。",
          "verificationFocus": "生成带 @property speed 和 onLoad/update 的脚本",
          "expectedText": "生成带 @property speed 和 onLoad/update 的脚本"
        },
        "naturalLanguageTest": "请通过 MCP 调用 asset_operation 工具，执行 generate_script 动作，处理“生成脚本”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/scripts/Player.ts”，把 className 设为“Player”，传入 scriptProperties=[{\"name\":\"speed\",\"type\":\"number\",\"default\":10}]，传入 lifecycle=[\"onLoad\",\"update\"]。调用完成后重点检查：生成带 @property speed 和 onLoad/update 的脚本。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 2,
        "note": "来自 tests/test-report.json，自动化执行通过（2ms）"
      }
    },
    {
      "id": 208,
      "tool": "editor_action",
      "action": "save_scene",
      "title": "保存场景",
      "input": {
        "action": "save_scene"
      },
      "expected": "当前场景保存到磁盘",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "force(optional, boolean). Save current scene. Pass force=true to show Save As dialog for untitled scenes.",
        "zhActionDescription": "force（可选，布尔值）。保存当前场景。对于未命名场景，可传入 force=true 以弹出另存为对话框。",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 save_scene 动作，处理“保存场景”这个状态场景。这个场景用于验证当前对象状态或默认状态下的表现。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：当前场景保存到磁盘。",
          "actionGoal": "保存当前场景",
          "scenarioType": "状态场景",
          "scenarioTitle": "保存场景",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于验证当前对象状态或默认状态下的表现。",
          "mcpCall": "editor_action.save_scene",
          "fullPayload": "{\"action\":\"save_scene\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 editor_action.save_scene",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "当前场景保存到磁盘",
          "expectedText": "当前场景保存到磁盘"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 save_scene 动作，处理“保存场景”这个状态场景。这个场景用于验证当前对象状态或默认状态下的表现。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：当前场景保存到磁盘。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 34,
        "note": "来自 tests/test-report.json，自动化执行通过（34ms）"
      }
    },
    {
      "id": 209,
      "tool": "editor_action",
      "action": "open_scene",
      "title": "按 URL 打开",
      "input": {
        "action": "open_scene",
        "url": "db://assets/scenes/Main.scene"
      },
      "expected": "打开 Main 场景",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "uuid(optional) or url(optional). Open a scene by UUID or db:// URL.",
        "zhActionDescription": "uuid（可选) or url(可选）。通过 UUID 或 db:// URL 打开场景。",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 open_scene 动作，处理“按 URL 打开”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/scenes/Main.scene”。调用完成后重点检查：打开 Main 场景。",
          "actionGoal": "通过 UUID 或 db:// URL 打开场景",
          "scenarioType": "参数场景",
          "scenarioTitle": "按 URL 打开",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "editor_action.open_scene",
          "fullPayload": "{\"action\":\"open_scene\",\"url\":\"db://assets/scenes/Main.scene\"}",
          "inputText": "url=db://assets/scenes/Main.scene",
          "executionStep": "调用 editor_action.open_scene",
          "parameterNarrative": "这次请把 url 设为“db://assets/scenes/Main.scene”。",
          "verificationFocus": "打开 Main 场景",
          "expectedText": "打开 Main 场景"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 open_scene 动作，处理“按 URL 打开”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 url 设为“db://assets/scenes/Main.scene”。调用完成后重点检查：打开 Main 场景。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 4,
        "note": "来自 tests/test-report.json，自动化执行通过（4ms）"
      }
    },
    {
      "id": 210,
      "tool": "editor_action",
      "action": "open_scene",
      "title": "按 UUID 打开",
      "input": {
        "action": "open_scene",
        "uuid": "<scene-uuid>"
      },
      "expected": "打开指定场景",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "uuid(optional) or url(optional). Open a scene by UUID or db:// URL.",
        "zhActionDescription": "uuid（可选) or url(可选）。通过 UUID 或 db:// URL 打开场景。",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 open_scene 动作，处理“按 UUID 打开”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <scene-uuid>。调用完成后重点检查：打开指定场景。",
          "actionGoal": "通过 UUID 或 db:// URL 打开场景",
          "scenarioType": "参数场景",
          "scenarioTitle": "按 UUID 打开",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "editor_action.open_scene",
          "fullPayload": "{\"action\":\"open_scene\",\"uuid\":\"<scene-uuid>\"}",
          "inputText": "uuid=<scene-uuid>",
          "executionStep": "调用 editor_action.open_scene",
          "parameterNarrative": "这次请将 uuid 指向 <scene-uuid>。",
          "verificationFocus": "打开指定场景",
          "expectedText": "打开指定场景"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 open_scene 动作，处理“按 UUID 打开”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <scene-uuid>。调用完成后重点检查：打开指定场景。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 5,
        "note": "来自 tests/test-report.json，自动化执行通过（5ms）"
      }
    },
    {
      "id": 211,
      "tool": "editor_action",
      "action": "new_scene",
      "title": "新建场景",
      "input": {
        "action": "new_scene"
      },
      "expected": "创建空场景",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "no params. Create a new empty scene.",
        "zhActionDescription": "无参数。创建一个新的空场景。",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 new_scene 动作，处理“新建场景”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：创建空场景。",
          "actionGoal": "创建一个新的空场景",
          "scenarioType": "通用场景",
          "scenarioTitle": "新建场景",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "editor_action.new_scene",
          "fullPayload": "{\"action\":\"new_scene\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 editor_action.new_scene",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "创建空场景",
          "expectedText": "创建空场景"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 new_scene 动作，处理“新建场景”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：创建空场景。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 96,
        "note": "来自 tests/test-report.json，自动化执行通过（96ms）"
      }
    },
    {
      "id": 212,
      "tool": "editor_action",
      "action": "undo",
      "title": "撤销",
      "input": {
        "action": "undo"
      },
      "expected": "撤销上一步操作",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "no params. Undo last operation.",
        "zhActionDescription": "无参数。撤销上一步操作。",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 undo 动作，处理“撤销”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：撤销上一步操作。",
          "actionGoal": "撤销上一步操作",
          "scenarioType": "通用场景",
          "scenarioTitle": "撤销",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "editor_action.undo",
          "fullPayload": "{\"action\":\"undo\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 editor_action.undo",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "撤销上一步操作",
          "expectedText": "撤销上一步操作"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 undo 动作，处理“撤销”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：撤销上一步操作。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 71,
        "note": "来自 tests/test-report.json，自动化执行通过（71ms）"
      }
    },
    {
      "id": 213,
      "tool": "editor_action",
      "action": "redo",
      "title": "重做",
      "input": {
        "action": "redo"
      },
      "expected": "重做被撤销的操作",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "no params. Redo last undone operation.",
        "zhActionDescription": "无参数。重做上一步被撤销的操作。",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 redo 动作，处理“重做”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：重做被撤销的操作。",
          "actionGoal": "重做上一步被撤销的操作",
          "scenarioType": "通用场景",
          "scenarioTitle": "重做",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "editor_action.redo",
          "fullPayload": "{\"action\":\"redo\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 editor_action.redo",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "重做被撤销的操作",
          "expectedText": "重做被撤销的操作"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 redo 动作，处理“重做”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：重做被撤销的操作。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 35,
        "note": "来自 tests/test-report.json，自动化执行通过（35ms）"
      }
    },
    {
      "id": 214,
      "tool": "editor_action",
      "action": "get_selection",
      "title": "获取选中",
      "input": {
        "action": "get_selection"
      },
      "expected": "返回选中节点 UUID 数组",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 get_selection 动作，处理“获取选中”这个状态场景。这个场景用于验证当前对象状态或默认状态下的表现。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回选中节点 UUID 数组。",
          "actionGoal": "控制 Cocos Creator 编辑器环境中的非场景类操作",
          "scenarioType": "状态场景",
          "scenarioTitle": "获取选中",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于验证当前对象状态或默认状态下的表现。",
          "mcpCall": "editor_action.get_selection",
          "fullPayload": "{\"action\":\"get_selection\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 editor_action.get_selection",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回选中节点 UUID 数组",
          "expectedText": "返回选中节点 UUID 数组"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 get_selection 动作，处理“获取选中”这个状态场景。这个场景用于验证当前对象状态或默认状态下的表现。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回选中节点 UUID 数组。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 2,
        "note": "来自 tests/test-report.json，自动化执行通过（2ms）"
      }
    },
    {
      "id": 215,
      "tool": "editor_action",
      "action": "select",
      "title": "选中节点",
      "input": {
        "action": "select",
        "uuids": [
          "<uuid1>",
          "<uuid2>"
        ]
      },
      "expected": "两个节点被选中",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 select 动作，处理“选中节点”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请传入 uuids=[\"<uuid1>\",\"<uuid2>\"]。调用完成后重点检查：两个节点被选中。",
          "actionGoal": "控制 Cocos Creator 编辑器环境中的非场景类操作",
          "scenarioType": "参数场景",
          "scenarioTitle": "选中节点",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "editor_action.select",
          "fullPayload": "{\"action\":\"select\",\"uuids\":[\"<uuid1>\",\"<uuid2>\"]}",
          "inputText": "uuids=[\"<uuid1>\",\"<uuid2>\"]",
          "executionStep": "调用 editor_action.select",
          "parameterNarrative": "这次请传入 uuids=[\"<uuid1>\",\"<uuid2>\"]。",
          "verificationFocus": "两个节点被选中",
          "expectedText": "两个节点被选中"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 select 动作，处理“选中节点”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请传入 uuids=[\"<uuid1>\",\"<uuid2>\"]。调用完成后重点检查：两个节点被选中。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 7,
        "note": "来自 tests/test-report.json，自动化执行通过（7ms）"
      }
    },
    {
      "id": 216,
      "tool": "editor_action",
      "action": "clear_selection",
      "title": "清除选中",
      "input": {
        "action": "clear_selection"
      },
      "expected": "取消所有选中",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 clear_selection 动作，处理“清除选中”这个状态场景。这个场景用于验证当前对象状态或默认状态下的表现。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：取消所有选中。",
          "actionGoal": "控制 Cocos Creator 编辑器环境中的非场景类操作",
          "scenarioType": "状态场景",
          "scenarioTitle": "清除选中",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于验证当前对象状态或默认状态下的表现。",
          "mcpCall": "editor_action.clear_selection",
          "fullPayload": "{\"action\":\"clear_selection\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 editor_action.clear_selection",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "取消所有选中",
          "expectedText": "取消所有选中"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 clear_selection 动作，处理“清除选中”这个状态场景。这个场景用于验证当前对象状态或默认状态下的表现。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：取消所有选中。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 3,
        "note": "来自 tests/test-report.json，自动化执行通过（3ms）"
      }
    },
    {
      "id": 217,
      "tool": "editor_action",
      "action": "project_info",
      "title": "项目信息",
      "input": {
        "action": "project_info"
      },
      "expected": "返回 {name,path,engineVersion}",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "no params. Get project name, path, engine version.",
        "zhActionDescription": "无参数。获取项目名称、路径和引擎版本。",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 project_info 动作，处理“项目信息”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {name,path,engineVersion}。",
          "actionGoal": "获取项目名称、路径和引擎版本",
          "scenarioType": "通用场景",
          "scenarioTitle": "项目信息",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "editor_action.project_info",
          "fullPayload": "{\"action\":\"project_info\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 editor_action.project_info",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回 {name,path,engineVersion}",
          "expectedText": "返回 {name,path,engineVersion}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 project_info 动作，处理“项目信息”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {name,path,engineVersion}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 3,
        "note": "来自 tests/test-report.json，自动化执行通过（3ms）"
      }
    },
    {
      "id": 218,
      "tool": "editor_action",
      "action": "build",
      "title": "构建 Web",
      "input": {
        "action": "build",
        "platform": "web-mobile"
      },
      "expected": "启动 Web Mobile 构建",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "platform(optional). Start project build.",
        "zhActionDescription": "platform（可选）。开始构建项目。",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 build 动作，处理“构建 Web”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 platform 设为“web-mobile”。调用完成后重点检查：启动 Web Mobile 构建。",
          "actionGoal": "开始构建项目",
          "scenarioType": "参数场景",
          "scenarioTitle": "构建 Web",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "editor_action.build",
          "fullPayload": "{\"action\":\"build\",\"platform\":\"web-mobile\"}",
          "inputText": "platform=web-mobile",
          "executionStep": "调用 editor_action.build",
          "parameterNarrative": "这次请把 platform 设为“web-mobile”。",
          "verificationFocus": "启动 Web Mobile 构建",
          "expectedText": "启动 Web Mobile 构建"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 build 动作，处理“构建 Web”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 platform 设为“web-mobile”。调用完成后重点检查：启动 Web Mobile 构建。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 932,
        "note": "来自 tests/test-report.json，自动化执行通过（932ms）"
      }
    },
    {
      "id": 219,
      "tool": "editor_action",
      "action": "build_query",
      "title": "构建配置",
      "input": {
        "action": "build_query"
      },
      "expected": "返回当前构建配置和可用平台",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "no params. Get build configuration and available platforms.",
        "zhActionDescription": "无参数。获取构建配置和可用平台。",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 build_query 动作，处理“构建配置”这个状态场景。这个场景用于验证当前对象状态或默认状态下的表现。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回当前构建配置和可用平台。",
          "actionGoal": "获取构建配置和可用平台",
          "scenarioType": "状态场景",
          "scenarioTitle": "构建配置",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于验证当前对象状态或默认状态下的表现。",
          "mcpCall": "editor_action.build_query",
          "fullPayload": "{\"action\":\"build_query\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 editor_action.build_query",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回当前构建配置和可用平台",
          "expectedText": "返回当前构建配置和可用平台"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 build_query 动作，处理“构建配置”这个状态场景。这个场景用于验证当前对象状态或默认状态下的表现。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回当前构建配置和可用平台。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 3,
        "note": "来自 tests/test-report.json，自动化执行通过（3ms）"
      }
    },
    {
      "id": 220,
      "tool": "editor_action",
      "action": "build_with_config",
      "title": "详细构建",
      "input": {
        "action": "build_with_config",
        "platform": "web-mobile",
        "debug": true
      },
      "expected": "Debug 模式构建",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 build_with_config 动作，处理“详细构建”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 platform 设为“web-mobile”，把 debug 设为 true。调用完成后重点检查：Debug 模式构建。",
          "actionGoal": "控制 Cocos Creator 编辑器环境中的非场景类操作",
          "scenarioType": "参数场景",
          "scenarioTitle": "详细构建",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "editor_action.build_with_config",
          "fullPayload": "{\"action\":\"build_with_config\",\"platform\":\"web-mobile\",\"debug\":true}",
          "inputText": "platform=web-mobile；debug=true",
          "executionStep": "调用 editor_action.build_with_config",
          "parameterNarrative": "这次请把 platform 设为“web-mobile”，把 debug 设为 true。",
          "verificationFocus": "Debug 模式构建",
          "expectedText": "Debug 模式构建"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 build_with_config 动作，处理“详细构建”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 platform 设为“web-mobile”，把 debug 设为 true。调用完成后重点检查：Debug 模式构建。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 3,
        "note": "来自 tests/test-report.json，自动化执行通过（3ms）"
      }
    },
    {
      "id": 221,
      "tool": "editor_action",
      "action": "build_status",
      "title": "构建状态",
      "input": {
        "action": "build_status"
      },
      "expected": "返回 {building:true/false}",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 build_status 动作，处理“构建状态”这个状态场景。这个场景用于验证当前对象状态或默认状态下的表现。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {building:true/false}。",
          "actionGoal": "控制 Cocos Creator 编辑器环境中的非场景类操作",
          "scenarioType": "状态场景",
          "scenarioTitle": "构建状态",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于验证当前对象状态或默认状态下的表现。",
          "mcpCall": "editor_action.build_status",
          "fullPayload": "{\"action\":\"build_status\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 editor_action.build_status",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回 {building:true/false}",
          "expectedText": "返回 {building:true/false}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 build_status 动作，处理“构建状态”这个状态场景。这个场景用于验证当前对象状态或默认状态下的表现。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {building:true/false}。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 2,
        "note": "来自 tests/test-report.json，自动化执行通过（2ms）"
      }
    },
    {
      "id": 222,
      "tool": "editor_action",
      "action": "preview",
      "title": "预览",
      "input": {
        "action": "preview"
      },
      "expected": "浏览器中打开预览",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "no params. Open preview in browser.",
        "zhActionDescription": "无参数。在浏览器中打开预览。",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 preview 动作，处理“预览”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：浏览器中打开预览。",
          "actionGoal": "在浏览器中打开预览",
          "scenarioType": "通用场景",
          "scenarioTitle": "预览",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "editor_action.preview",
          "fullPayload": "{\"action\":\"preview\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 editor_action.preview",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "浏览器中打开预览",
          "expectedText": "浏览器中打开预览"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 preview 动作，处理“预览”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：浏览器中打开预览。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 6,
        "note": "来自 tests/test-report.json，自动化执行通过（6ms）"
      }
    },
    {
      "id": 223,
      "tool": "editor_action",
      "action": "preview_refresh",
      "title": "刷新预览",
      "input": {
        "action": "preview_refresh"
      },
      "expected": "预览页面刷新",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "no params. Refresh preview.",
        "zhActionDescription": "无参数。刷新预览。",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 preview_refresh 动作，处理“刷新预览”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：预览页面刷新。",
          "actionGoal": "刷新预览",
          "scenarioType": "通用场景",
          "scenarioTitle": "刷新预览",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "editor_action.preview_refresh",
          "fullPayload": "{\"action\":\"preview_refresh\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 editor_action.preview_refresh",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "预览页面刷新",
          "expectedText": "预览页面刷新"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 preview_refresh 动作，处理“刷新预览”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：预览页面刷新。"
      },
      "aiBaseline": {
        "status": "pass",
        "duration": 9,
        "note": "来自 tests/test-report.json，自动化执行通过（9ms）"
      }
    },
    {
      "id": 224,
      "tool": "editor_action",
      "action": "preview_status",
      "title": "预览状态",
      "input": {
        "action": "preview_status"
      },
      "expected": "返回 {running,port}",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 preview_status 动作，处理“预览状态”这个状态场景。这个场景用于验证当前对象状态或默认状态下的表现。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {running,port}。",
          "actionGoal": "控制 Cocos Creator 编辑器环境中的非场景类操作",
          "scenarioType": "状态场景",
          "scenarioTitle": "预览状态",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于验证当前对象状态或默认状态下的表现。",
          "mcpCall": "editor_action.preview_status",
          "fullPayload": "{\"action\":\"preview_status\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 editor_action.preview_status",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回 {running,port}",
          "expectedText": "返回 {running,port}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 preview_status 动作，处理“预览状态”这个状态场景。这个场景用于验证当前对象状态或默认状态下的表现。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {running,port}。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 225,
      "tool": "editor_action",
      "action": "send_message",
      "title": "IPC 消息",
      "input": {
        "action": "send_message",
        "module": "scene",
        "message": "query-node",
        "args": [
          "<uuid>"
        ]
      },
      "expected": "发送 IPC 消息到 scene 模块",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 send_message 动作，处理“IPC 消息”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 module 设为“scene”，把 message 设为“query-node”，传入 args=[\"<uuid>\"]。调用完成后重点检查：发送 IPC 消息到 scene 模块。",
          "actionGoal": "控制 Cocos Creator 编辑器环境中的非场景类操作",
          "scenarioType": "参数场景",
          "scenarioTitle": "IPC 消息",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "editor_action.send_message",
          "fullPayload": "{\"action\":\"send_message\",\"module\":\"scene\",\"message\":\"query-node\",\"args\":[\"<uuid>\"]}",
          "inputText": "module=scene；message=query-node；args=[\"<uuid>\"]",
          "executionStep": "调用 editor_action.send_message",
          "parameterNarrative": "这次请把 module 设为“scene”，把 message 设为“query-node”，传入 args=[\"<uuid>\"]。",
          "verificationFocus": "发送 IPC 消息到 scene 模块",
          "expectedText": "发送 IPC 消息到 scene 模块"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 send_message 动作，处理“IPC 消息”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 module 设为“scene”，把 message 设为“query-node”，传入 args=[\"<uuid>\"]。调用完成后重点检查：发送 IPC 消息到 scene 模块。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 226,
      "tool": "editor_action",
      "action": "focus_node",
      "title": "聚焦节点",
      "input": {
        "action": "focus_node",
        "uuid": "<uuid>"
      },
      "expected": "编辑器摄像机聚焦到该节点",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "uuid(REQUIRED). Focus editor camera on a node.",
        "zhActionDescription": "uuid（必填）。将编辑器相机聚焦到指定节点。",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 focus_node 动作，处理“聚焦节点”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：编辑器摄像机聚焦到该节点。",
          "actionGoal": "将编辑器相机聚焦到指定节点",
          "scenarioType": "参数场景",
          "scenarioTitle": "聚焦节点",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "editor_action.focus_node",
          "fullPayload": "{\"action\":\"focus_node\",\"uuid\":\"<uuid>\"}",
          "inputText": "uuid=<uuid>",
          "executionStep": "调用 editor_action.focus_node",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>。",
          "verificationFocus": "编辑器摄像机聚焦到该节点",
          "expectedText": "编辑器摄像机聚焦到该节点"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 focus_node 动作，处理“聚焦节点”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：编辑器摄像机聚焦到该节点。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 227,
      "tool": "editor_action",
      "action": "open_panel",
      "title": "打开面板",
      "input": {
        "action": "open_panel",
        "panel": "console"
      },
      "expected": "打开控制台面板",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 open_panel 动作，处理“打开面板”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 panel 设为“console”。调用完成后重点检查：打开控制台面板。",
          "actionGoal": "控制 Cocos Creator 编辑器环境中的非场景类操作",
          "scenarioType": "参数场景",
          "scenarioTitle": "打开面板",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "editor_action.open_panel",
          "fullPayload": "{\"action\":\"open_panel\",\"panel\":\"console\"}",
          "inputText": "panel=console",
          "executionStep": "调用 editor_action.open_panel",
          "parameterNarrative": "这次请把 panel 设为“console”。",
          "verificationFocus": "打开控制台面板",
          "expectedText": "打开控制台面板"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 open_panel 动作，处理“打开面板”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 panel 设为“console”。调用完成后重点检查：打开控制台面板。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 228,
      "tool": "editor_action",
      "action": "close_panel",
      "title": "关闭面板",
      "input": {
        "action": "close_panel",
        "panel": "console"
      },
      "expected": "关闭控制台面板",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 close_panel 动作，处理“关闭面板”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 panel 设为“console”。调用完成后重点检查：关闭控制台面板。",
          "actionGoal": "控制 Cocos Creator 编辑器环境中的非场景类操作",
          "scenarioType": "参数场景",
          "scenarioTitle": "关闭面板",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "editor_action.close_panel",
          "fullPayload": "{\"action\":\"close_panel\",\"panel\":\"console\"}",
          "inputText": "panel=console",
          "executionStep": "调用 editor_action.close_panel",
          "parameterNarrative": "这次请把 panel 设为“console”。",
          "verificationFocus": "关闭控制台面板",
          "expectedText": "关闭控制台面板"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 close_panel 动作，处理“关闭面板”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 panel 设为“console”。调用完成后重点检查：关闭控制台面板。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 229,
      "tool": "editor_action",
      "action": "query_panels",
      "title": "列出面板",
      "input": {
        "action": "query_panels"
      },
      "expected": "返回所有可用面板名",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 query_panels 动作，处理“列出面板”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回所有可用面板名。",
          "actionGoal": "控制 Cocos Creator 编辑器环境中的非场景类操作",
          "scenarioType": "通用场景",
          "scenarioTitle": "列出面板",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "editor_action.query_panels",
          "fullPayload": "{\"action\":\"query_panels\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 editor_action.query_panels",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回所有可用面板名",
          "expectedText": "返回所有可用面板名"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 query_panels 动作，处理“列出面板”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回所有可用面板名。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 230,
      "tool": "editor_action",
      "action": "log",
      "title": "输出日志",
      "input": {
        "action": "log",
        "text": "Hello from AI"
      },
      "expected": "控制台输出 info 消息",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "text(REQUIRED). Write message to console.",
        "zhActionDescription": "text（必填）。向控制台写入消息。",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 log 动作，处理“输出日志”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 text 设为“Hello from AI”。调用完成后重点检查：控制台输出 info 消息。",
          "actionGoal": "向控制台写入消息",
          "scenarioType": "参数场景",
          "scenarioTitle": "输出日志",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "editor_action.log",
          "fullPayload": "{\"action\":\"log\",\"text\":\"Hello from AI\"}",
          "inputText": "text=Hello from AI",
          "executionStep": "调用 editor_action.log",
          "parameterNarrative": "这次请把 text 设为“Hello from AI”。",
          "verificationFocus": "控制台输出 info 消息",
          "expectedText": "控制台输出 info 消息"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 log 动作，处理“输出日志”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 text 设为“Hello from AI”。调用完成后重点检查：控制台输出 info 消息。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 231,
      "tool": "editor_action",
      "action": "warn",
      "title": "输出警告",
      "input": {
        "action": "warn",
        "text": "Something suspicious"
      },
      "expected": "控制台输出 warning",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "text(REQUIRED). Write message to console.",
        "zhActionDescription": "text（必填）。向控制台写入消息。",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 warn 动作，处理“输出警告”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 text 设为“Something suspicious”。调用完成后重点检查：控制台输出 warning。",
          "actionGoal": "向控制台写入消息",
          "scenarioType": "参数场景",
          "scenarioTitle": "输出警告",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "editor_action.warn",
          "fullPayload": "{\"action\":\"warn\",\"text\":\"Something suspicious\"}",
          "inputText": "text=Something suspicious",
          "executionStep": "调用 editor_action.warn",
          "parameterNarrative": "这次请把 text 设为“Something suspicious”。",
          "verificationFocus": "控制台输出 warning",
          "expectedText": "控制台输出 warning"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 warn 动作，处理“输出警告”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 text 设为“Something suspicious”。调用完成后重点检查：控制台输出 warning。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 232,
      "tool": "editor_action",
      "action": "error",
      "title": "输出错误",
      "input": {
        "action": "error",
        "text": "Critical failure"
      },
      "expected": "控制台输出 error",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "text(REQUIRED). Write message to console.",
        "zhActionDescription": "text（必填）。向控制台写入消息。",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 error 动作，处理“输出错误”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 text 设为“Critical failure”。调用完成后重点检查：控制台输出 error。",
          "actionGoal": "向控制台写入消息",
          "scenarioType": "参数场景",
          "scenarioTitle": "输出错误",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "editor_action.error",
          "fullPayload": "{\"action\":\"error\",\"text\":\"Critical failure\"}",
          "inputText": "text=Critical failure",
          "executionStep": "调用 editor_action.error",
          "parameterNarrative": "这次请把 text 设为“Critical failure”。",
          "verificationFocus": "控制台输出 error",
          "expectedText": "控制台输出 error"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 error 动作，处理“输出错误”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 text 设为“Critical failure”。调用完成后重点检查：控制台输出 error。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 233,
      "tool": "editor_action",
      "action": "clear_console",
      "title": "清空控制台",
      "input": {
        "action": "clear_console"
      },
      "expected": "控制台清空",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "no params. Clear console output.",
        "zhActionDescription": "无参数。清空控制台输出。",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 clear_console 动作，处理“清空控制台”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：控制台清空。",
          "actionGoal": "清空控制台输出",
          "scenarioType": "通用场景",
          "scenarioTitle": "清空控制台",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "editor_action.clear_console",
          "fullPayload": "{\"action\":\"clear_console\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 editor_action.clear_console",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "控制台清空",
          "expectedText": "控制台清空"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 clear_console 动作，处理“清空控制台”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：控制台清空。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 234,
      "tool": "editor_action",
      "action": "get_console_logs",
      "title": "全部日志",
      "input": {
        "action": "get_console_logs"
      },
      "expected": "返回所有日志条目",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 get_console_logs 动作，处理“全部日志”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回所有日志条目。",
          "actionGoal": "控制 Cocos Creator 编辑器环境中的非场景类操作",
          "scenarioType": "通用场景",
          "scenarioTitle": "全部日志",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "editor_action.get_console_logs",
          "fullPayload": "{\"action\":\"get_console_logs\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 editor_action.get_console_logs",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回所有日志条目",
          "expectedText": "返回所有日志条目"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 get_console_logs 动作，处理“全部日志”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回所有日志条目。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 235,
      "tool": "editor_action",
      "action": "get_console_logs",
      "title": "仅错误",
      "input": {
        "action": "get_console_logs",
        "logType": "error",
        "logCount": 10
      },
      "expected": "返回最近 10 条错误日志",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 get_console_logs 动作，处理“仅错误”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 logType 设为“error”，把 logCount 设为 10。调用完成后重点检查：返回最近 10 条错误日志。",
          "actionGoal": "控制 Cocos Creator 编辑器环境中的非场景类操作",
          "scenarioType": "参数场景",
          "scenarioTitle": "仅错误",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "editor_action.get_console_logs",
          "fullPayload": "{\"action\":\"get_console_logs\",\"logType\":\"error\",\"logCount\":10}",
          "inputText": "logType=error；logCount=10",
          "executionStep": "调用 editor_action.get_console_logs",
          "parameterNarrative": "这次请把 logType 设为“error”，把 logCount 设为 10。",
          "verificationFocus": "返回最近 10 条错误日志",
          "expectedText": "返回最近 10 条错误日志"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 get_console_logs 动作，处理“仅错误”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 logType 设为“error”，把 logCount 设为 10。调用完成后重点检查：返回最近 10 条错误日志。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 236,
      "tool": "editor_action",
      "action": "search_logs",
      "title": "搜索日志",
      "input": {
        "action": "search_logs",
        "keyword": "TypeError"
      },
      "expected": "返回含 TypeError 的日志",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 search_logs 动作，处理“搜索日志”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 keyword 设为“TypeError”。调用完成后重点检查：返回含 TypeError 的日志。",
          "actionGoal": "控制 Cocos Creator 编辑器环境中的非场景类操作",
          "scenarioType": "参数场景",
          "scenarioTitle": "搜索日志",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "editor_action.search_logs",
          "fullPayload": "{\"action\":\"search_logs\",\"keyword\":\"TypeError\"}",
          "inputText": "keyword=TypeError",
          "executionStep": "调用 editor_action.search_logs",
          "parameterNarrative": "这次请把 keyword 设为“TypeError”。",
          "verificationFocus": "返回含 TypeError 的日志",
          "expectedText": "返回含 TypeError 的日志"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 search_logs 动作，处理“搜索日志”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 keyword 设为“TypeError”。调用完成后重点检查：返回含 TypeError 的日志。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 237,
      "tool": "editor_action",
      "action": "get_packages",
      "title": "已安装插件",
      "input": {
        "action": "get_packages"
      },
      "expected": "返回插件列表",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 get_packages 动作，处理“已安装插件”这个环境场景。这个场景用于验证不同编辑器环境或连接状态下的表现。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回插件列表。",
          "actionGoal": "控制 Cocos Creator 编辑器环境中的非场景类操作",
          "scenarioType": "环境场景",
          "scenarioTitle": "已安装插件",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于验证不同编辑器环境或连接状态下的表现。",
          "mcpCall": "editor_action.get_packages",
          "fullPayload": "{\"action\":\"get_packages\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 editor_action.get_packages",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回插件列表",
          "expectedText": "返回插件列表"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 get_packages 动作，处理“已安装插件”这个环境场景。这个场景用于验证不同编辑器环境或连接状态下的表现。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回插件列表。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 238,
      "tool": "editor_action",
      "action": "reload_plugin",
      "title": "重载插件",
      "input": {
        "action": "reload_plugin",
        "module": "aura-for-cocos"
      },
      "expected": "插件热重载",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 reload_plugin 动作，处理“重载插件”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 module 设为“aura-for-cocos”。调用完成后重点检查：插件热重载。",
          "actionGoal": "控制 Cocos Creator 编辑器环境中的非场景类操作",
          "scenarioType": "参数场景",
          "scenarioTitle": "重载插件",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "editor_action.reload_plugin",
          "fullPayload": "{\"action\":\"reload_plugin\",\"module\":\"aura-for-cocos\"}",
          "inputText": "module=aura-for-cocos",
          "executionStep": "调用 editor_action.reload_plugin",
          "parameterNarrative": "这次请把 module 设为“aura-for-cocos”。",
          "verificationFocus": "插件热重载",
          "expectedText": "插件热重载"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 reload_plugin 动作，处理“重载插件”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 module 设为“aura-for-cocos”。调用完成后重点检查：插件热重载。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 239,
      "tool": "editor_action",
      "action": "inspect_asset",
      "title": "查看资源",
      "input": {
        "action": "inspect_asset",
        "uuid": "<asset-uuid>"
      },
      "expected": "Inspector 面板显示该资源",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 inspect_asset 动作，处理“查看资源”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <asset-uuid>。调用完成后重点检查：Inspector 面板显示该资源。",
          "actionGoal": "控制 Cocos Creator 编辑器环境中的非场景类操作",
          "scenarioType": "参数场景",
          "scenarioTitle": "查看资源",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "editor_action.inspect_asset",
          "fullPayload": "{\"action\":\"inspect_asset\",\"uuid\":\"<asset-uuid>\"}",
          "inputText": "uuid=<asset-uuid>",
          "executionStep": "调用 editor_action.inspect_asset",
          "parameterNarrative": "这次请将 uuid 指向 <asset-uuid>。",
          "verificationFocus": "Inspector 面板显示该资源",
          "expectedText": "Inspector 面板显示该资源"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 inspect_asset 动作，处理“查看资源”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <asset-uuid>。调用完成后重点检查：Inspector 面板显示该资源。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 240,
      "tool": "editor_action",
      "action": "open_preferences",
      "title": "偏好设置",
      "input": {
        "action": "open_preferences"
      },
      "expected": "打开偏好设置面板",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 open_preferences 动作，处理“偏好设置”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：打开偏好设置面板。",
          "actionGoal": "控制 Cocos Creator 编辑器环境中的非场景类操作",
          "scenarioType": "通用场景",
          "scenarioTitle": "偏好设置",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "editor_action.open_preferences",
          "fullPayload": "{\"action\":\"open_preferences\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 editor_action.open_preferences",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "打开偏好设置面板",
          "expectedText": "打开偏好设置面板"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 open_preferences 动作，处理“偏好设置”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：打开偏好设置面板。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 241,
      "tool": "editor_action",
      "action": "open_project_settings",
      "title": "项目设置",
      "input": {
        "action": "open_project_settings"
      },
      "expected": "打开项目设置面板",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 open_project_settings 动作，处理“项目设置”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：打开项目设置面板。",
          "actionGoal": "控制 Cocos Creator 编辑器环境中的非场景类操作",
          "scenarioType": "通用场景",
          "scenarioTitle": "项目设置",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "editor_action.open_project_settings",
          "fullPayload": "{\"action\":\"open_project_settings\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 editor_action.open_project_settings",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "打开项目设置面板",
          "expectedText": "打开项目设置面板"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 open_project_settings 动作，处理“项目设置”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：打开项目设置面板。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 242,
      "tool": "editor_action",
      "action": "show_notification",
      "title": "通知",
      "input": {
        "action": "show_notification",
        "text": "操作完成！",
        "title": "AI"
      },
      "expected": "弹出通知",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "text(REQUIRED), title(optional). Write notification to console (non-blocking, no modal dialog).",
        "zhActionDescription": "text（必填），title（可选）。向控制台写入通知（非阻塞、无模态对话框）。",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 show_notification 动作，处理“通知”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 text 设为“操作完成！”，把 title 设为“AI”。调用完成后重点检查：弹出通知。",
          "actionGoal": "向控制台写入通知（非阻塞、无模态对话框）",
          "scenarioType": "参数场景",
          "scenarioTitle": "通知",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "editor_action.show_notification",
          "fullPayload": "{\"action\":\"show_notification\",\"text\":\"操作完成！\",\"title\":\"AI\"}",
          "inputText": "text=操作完成！；title=AI",
          "executionStep": "调用 editor_action.show_notification",
          "parameterNarrative": "这次请把 text 设为“操作完成！”，把 title 设为“AI”。",
          "verificationFocus": "弹出通知",
          "expectedText": "弹出通知"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 show_notification 动作，处理“通知”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 text 设为“操作完成！”，把 title 设为“AI”。调用完成后重点检查：弹出通知。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 243,
      "tool": "editor_action",
      "action": "play_in_editor",
      "title": "播放",
      "input": {
        "action": "play_in_editor"
      },
      "expected": "进入播放模式",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "no params. Enter play/preview mode.",
        "zhActionDescription": "无参数。进入播放/预览模式。",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 play_in_editor 动作，处理“播放”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：进入播放模式。",
          "actionGoal": "进入播放/预览模式",
          "scenarioType": "通用场景",
          "scenarioTitle": "播放",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "editor_action.play_in_editor",
          "fullPayload": "{\"action\":\"play_in_editor\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 editor_action.play_in_editor",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "进入播放模式",
          "expectedText": "进入播放模式"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 play_in_editor 动作，处理“播放”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：进入播放模式。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 244,
      "tool": "editor_action",
      "action": "pause_in_editor",
      "title": "暂停",
      "input": {
        "action": "pause_in_editor"
      },
      "expected": "暂停播放",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 pause_in_editor 动作，处理“暂停”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：暂停播放。",
          "actionGoal": "控制 Cocos Creator 编辑器环境中的非场景类操作",
          "scenarioType": "通用场景",
          "scenarioTitle": "暂停",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "editor_action.pause_in_editor",
          "fullPayload": "{\"action\":\"pause_in_editor\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 editor_action.pause_in_editor",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "暂停播放",
          "expectedText": "暂停播放"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 pause_in_editor 动作，处理“暂停”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：暂停播放。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 245,
      "tool": "editor_action",
      "action": "stop_in_editor",
      "title": "停止",
      "input": {
        "action": "stop_in_editor"
      },
      "expected": "停止播放",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 stop_in_editor 动作，处理“停止”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：停止播放。",
          "actionGoal": "控制 Cocos Creator 编辑器环境中的非场景类操作",
          "scenarioType": "通用场景",
          "scenarioTitle": "停止",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "editor_action.stop_in_editor",
          "fullPayload": "{\"action\":\"stop_in_editor\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 editor_action.stop_in_editor",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "停止播放",
          "expectedText": "停止播放"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 stop_in_editor 动作，处理“停止”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：停止播放。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 246,
      "tool": "editor_action",
      "action": "step_in_editor",
      "title": "单步帧",
      "input": {
        "action": "step_in_editor"
      },
      "expected": "执行一帧",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 step_in_editor 动作，处理“单步帧”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：执行一帧。",
          "actionGoal": "控制 Cocos Creator 编辑器环境中的非场景类操作",
          "scenarioType": "通用场景",
          "scenarioTitle": "单步帧",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "editor_action.step_in_editor",
          "fullPayload": "{\"action\":\"step_in_editor\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 editor_action.step_in_editor",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "执行一帧",
          "expectedText": "执行一帧"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 step_in_editor 动作，处理“单步帧”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：执行一帧。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 247,
      "tool": "editor_action",
      "action": "move_scene_camera",
      "title": "移动场景相机",
      "input": {
        "action": "move_scene_camera",
        "uuid": "<uuid>"
      },
      "expected": "编辑器摄像机移动到节点",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 move_scene_camera 动作，处理“移动场景相机”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：编辑器摄像机移动到节点。",
          "actionGoal": "控制 Cocos Creator 编辑器环境中的非场景类操作",
          "scenarioType": "参数场景",
          "scenarioTitle": "移动场景相机",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "editor_action.move_scene_camera",
          "fullPayload": "{\"action\":\"move_scene_camera\",\"uuid\":\"<uuid>\"}",
          "inputText": "uuid=<uuid>",
          "executionStep": "调用 editor_action.move_scene_camera",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>。",
          "verificationFocus": "编辑器摄像机移动到节点",
          "expectedText": "编辑器摄像机移动到节点"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 move_scene_camera 动作，处理“移动场景相机”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：编辑器摄像机移动到节点。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 248,
      "tool": "editor_action",
      "action": "take_scene_screenshot",
      "title": "视口截图",
      "input": {
        "action": "take_scene_screenshot"
      },
      "expected": "截取场景编辑器画面",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 take_scene_screenshot 动作，处理“视口截图”这个环境场景。这个场景用于验证不同编辑器环境或连接状态下的表现。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：截取场景编辑器画面。",
          "actionGoal": "控制 Cocos Creator 编辑器环境中的非场景类操作",
          "scenarioType": "环境场景",
          "scenarioTitle": "视口截图",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于验证不同编辑器环境或连接状态下的表现。",
          "mcpCall": "editor_action.take_scene_screenshot",
          "fullPayload": "{\"action\":\"take_scene_screenshot\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 editor_action.take_scene_screenshot",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "截取场景编辑器画面",
          "expectedText": "截取场景编辑器画面"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 take_scene_screenshot 动作，处理“视口截图”这个环境场景。这个场景用于验证不同编辑器环境或连接状态下的表现。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：截取场景编辑器画面。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 249,
      "tool": "editor_action",
      "action": "set_transform_tool",
      "title": "切 Gizmo",
      "input": {
        "action": "set_transform_tool",
        "toolType": "rotation"
      },
      "expected": "切换到旋转工具",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 set_transform_tool 动作，处理“切 Gizmo”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 toolType 设为“rotation”。调用完成后重点检查：切换到旋转工具。",
          "actionGoal": "控制 Cocos Creator 编辑器环境中的非场景类操作",
          "scenarioType": "参数场景",
          "scenarioTitle": "切 Gizmo",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "editor_action.set_transform_tool",
          "fullPayload": "{\"action\":\"set_transform_tool\",\"toolType\":\"rotation\"}",
          "inputText": "toolType=rotation",
          "executionStep": "调用 editor_action.set_transform_tool",
          "parameterNarrative": "这次请把 toolType 设为“rotation”。",
          "verificationFocus": "切换到旋转工具",
          "expectedText": "切换到旋转工具"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 set_transform_tool 动作，处理“切 Gizmo”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 toolType 设为“rotation”。调用完成后重点检查：切换到旋转工具。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 250,
      "tool": "editor_action",
      "action": "set_coordinate",
      "title": "切坐标系",
      "input": {
        "action": "set_coordinate",
        "coordinate": "world"
      },
      "expected": "切换到世界坐标系",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 set_coordinate 动作，处理“切坐标系”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 coordinate 设为“world”。调用完成后重点检查：切换到世界坐标系。",
          "actionGoal": "控制 Cocos Creator 编辑器环境中的非场景类操作",
          "scenarioType": "参数场景",
          "scenarioTitle": "切坐标系",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "editor_action.set_coordinate",
          "fullPayload": "{\"action\":\"set_coordinate\",\"coordinate\":\"world\"}",
          "inputText": "coordinate=world",
          "executionStep": "调用 editor_action.set_coordinate",
          "parameterNarrative": "这次请把 coordinate 设为“world”。",
          "verificationFocus": "切换到世界坐标系",
          "expectedText": "切换到世界坐标系"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 set_coordinate 动作，处理“切坐标系”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 coordinate 设为“world”。调用完成后重点检查：切换到世界坐标系。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 251,
      "tool": "editor_action",
      "action": "toggle_grid",
      "title": "显示网格",
      "input": {
        "action": "toggle_grid",
        "visible": true
      },
      "expected": "显示编辑器网格",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 toggle_grid 动作，处理“显示网格”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 visible 设为 true。调用完成后重点检查：显示编辑器网格。",
          "actionGoal": "控制 Cocos Creator 编辑器环境中的非场景类操作",
          "scenarioType": "参数场景",
          "scenarioTitle": "显示网格",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "editor_action.toggle_grid",
          "fullPayload": "{\"action\":\"toggle_grid\",\"visible\":true}",
          "inputText": "visible=true",
          "executionStep": "调用 editor_action.toggle_grid",
          "parameterNarrative": "这次请把 visible 设为 true。",
          "verificationFocus": "显示编辑器网格",
          "expectedText": "显示编辑器网格"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 toggle_grid 动作，处理“显示网格”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 visible 设为 true。调用完成后重点检查：显示编辑器网格。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 252,
      "tool": "editor_action",
      "action": "toggle_snap",
      "title": "启用吸附",
      "input": {
        "action": "toggle_snap",
        "enabled": true
      },
      "expected": "启用吸附模式",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 toggle_snap 动作，处理“启用吸附”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 enabled 设为 true。调用完成后重点检查：启用吸附模式。",
          "actionGoal": "控制 Cocos Creator 编辑器环境中的非场景类操作",
          "scenarioType": "参数场景",
          "scenarioTitle": "启用吸附",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "editor_action.toggle_snap",
          "fullPayload": "{\"action\":\"toggle_snap\",\"enabled\":true}",
          "inputText": "enabled=true",
          "executionStep": "调用 editor_action.toggle_snap",
          "parameterNarrative": "这次请把 enabled 设为 true。",
          "verificationFocus": "启用吸附模式",
          "expectedText": "启用吸附模式"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 toggle_snap 动作，处理“启用吸附”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 enabled 设为 true。调用完成后重点检查：启用吸附模式。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 253,
      "tool": "editor_action",
      "action": "set_view_mode",
      "title": "切到 2D",
      "input": {
        "action": "set_view_mode",
        "viewMode": "2d"
      },
      "expected": "场景视图切为 2D",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 set_view_mode 动作，处理“切到 2D”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 viewMode 设为“2d”。调用完成后重点检查：场景视图切为 2D。",
          "actionGoal": "控制 Cocos Creator 编辑器环境中的非场景类操作",
          "scenarioType": "参数场景",
          "scenarioTitle": "切到 2D",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "editor_action.set_view_mode",
          "fullPayload": "{\"action\":\"set_view_mode\",\"viewMode\":\"2d\"}",
          "inputText": "viewMode=2d",
          "executionStep": "调用 editor_action.set_view_mode",
          "parameterNarrative": "这次请把 viewMode 设为“2d”。",
          "verificationFocus": "场景视图切为 2D",
          "expectedText": "场景视图切为 2D"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 set_view_mode 动作，处理“切到 2D”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 viewMode 设为“2d”。调用完成后重点检查：场景视图切为 2D。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 254,
      "tool": "editor_action",
      "action": "set_view_mode",
      "title": "切到 3D",
      "input": {
        "action": "set_view_mode",
        "viewMode": "3d"
      },
      "expected": "场景视图切为 3D",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 set_view_mode 动作，处理“切到 3D”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 viewMode 设为“3d”。调用完成后重点检查：场景视图切为 3D。",
          "actionGoal": "控制 Cocos Creator 编辑器环境中的非场景类操作",
          "scenarioType": "参数场景",
          "scenarioTitle": "切到 3D",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "editor_action.set_view_mode",
          "fullPayload": "{\"action\":\"set_view_mode\",\"viewMode\":\"3d\"}",
          "inputText": "viewMode=3d",
          "executionStep": "调用 editor_action.set_view_mode",
          "parameterNarrative": "这次请把 viewMode 设为“3d”。",
          "verificationFocus": "场景视图切为 3D",
          "expectedText": "场景视图切为 3D"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 set_view_mode 动作，处理“切到 3D”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 viewMode 设为“3d”。调用完成后重点检查：场景视图切为 3D。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 255,
      "tool": "editor_action",
      "action": "zoom_to_fit",
      "title": "缩放适应",
      "input": {
        "action": "zoom_to_fit"
      },
      "expected": "视图缩放以适应所有节点",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Control the Cocos Creator editor environment (non-scene operations).",
        "zhToolSummary": "控制 Cocos Creator 编辑器环境中的非场景类操作。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-editor.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 editor_action 工具，执行 zoom_to_fit 动作，处理“缩放适应”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：视图缩放以适应所有节点。",
          "actionGoal": "控制 Cocos Creator 编辑器环境中的非场景类操作",
          "scenarioType": "通用场景",
          "scenarioTitle": "缩放适应",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "editor_action.zoom_to_fit",
          "fullPayload": "{\"action\":\"zoom_to_fit\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 editor_action.zoom_to_fit",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "视图缩放以适应所有节点",
          "expectedText": "视图缩放以适应所有节点"
        },
        "naturalLanguageTest": "请通过 MCP 调用 editor_action 工具，执行 zoom_to_fit 动作，处理“缩放适应”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：视图缩放以适应所有节点。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 256,
      "tool": "engine_action",
      "action": "set_frame_rate",
      "title": "设 60 FPS",
      "input": {
        "action": "set_frame_rate",
        "fps": 60
      },
      "expected": "帧率限制为 60",
      "note": "",
      "phase": "引擎专项",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 engine_action 工具，执行 set_frame_rate 动作，处理“设 60 FPS”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 fps 设为 60。调用完成后重点检查：帧率限制为 60。",
          "actionGoal": "执行 engine_action.set_frame_rate",
          "scenarioType": "参数场景",
          "scenarioTitle": "设 60 FPS",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "engine_action.set_frame_rate",
          "fullPayload": "{\"action\":\"set_frame_rate\",\"fps\":60}",
          "inputText": "fps=60",
          "executionStep": "调用 engine_action.set_frame_rate",
          "parameterNarrative": "这次请把 fps 设为 60。",
          "verificationFocus": "帧率限制为 60",
          "expectedText": "帧率限制为 60"
        },
        "naturalLanguageTest": "请通过 MCP 调用 engine_action 工具，执行 set_frame_rate 动作，处理“设 60 FPS”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 fps 设为 60。调用完成后重点检查：帧率限制为 60。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 257,
      "tool": "engine_action",
      "action": "set_frame_rate",
      "title": "设 30 FPS",
      "input": {
        "action": "set_frame_rate",
        "fps": 30
      },
      "expected": "省电模式 30 FPS",
      "note": "",
      "phase": "引擎专项",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 engine_action 工具，执行 set_frame_rate 动作，处理“设 30 FPS”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 fps 设为 30。调用完成后重点检查：省电模式 30 FPS。",
          "actionGoal": "执行 engine_action.set_frame_rate",
          "scenarioType": "参数场景",
          "scenarioTitle": "设 30 FPS",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "engine_action.set_frame_rate",
          "fullPayload": "{\"action\":\"set_frame_rate\",\"fps\":30}",
          "inputText": "fps=30",
          "executionStep": "调用 engine_action.set_frame_rate",
          "parameterNarrative": "这次请把 fps 设为 30。",
          "verificationFocus": "省电模式 30 FPS",
          "expectedText": "省电模式 30 FPS"
        },
        "naturalLanguageTest": "请通过 MCP 调用 engine_action 工具，执行 set_frame_rate 动作，处理“设 30 FPS”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 fps 设为 30。调用完成后重点检查：省电模式 30 FPS。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 258,
      "tool": "engine_action",
      "action": "pause_engine",
      "title": "暂停引擎",
      "input": {
        "action": "pause_engine"
      },
      "expected": "渲染和逻辑冻结",
      "note": "",
      "phase": "引擎专项",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 engine_action 工具，执行 pause_engine 动作，处理“暂停引擎”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：渲染和逻辑冻结。",
          "actionGoal": "执行 engine_action.pause_engine",
          "scenarioType": "通用场景",
          "scenarioTitle": "暂停引擎",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "engine_action.pause_engine",
          "fullPayload": "{\"action\":\"pause_engine\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 engine_action.pause_engine",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "渲染和逻辑冻结",
          "expectedText": "渲染和逻辑冻结"
        },
        "naturalLanguageTest": "请通过 MCP 调用 engine_action 工具，执行 pause_engine 动作，处理“暂停引擎”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：渲染和逻辑冻结。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 259,
      "tool": "engine_action",
      "action": "resume_engine",
      "title": "恢复引擎",
      "input": {
        "action": "resume_engine"
      },
      "expected": "继续运行",
      "note": "",
      "phase": "引擎专项",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 engine_action 工具，执行 resume_engine 动作，处理“恢复引擎”这个状态场景。这个场景用于验证当前对象状态或默认状态下的表现。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：继续运行。",
          "actionGoal": "执行 engine_action.resume_engine",
          "scenarioType": "状态场景",
          "scenarioTitle": "恢复引擎",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于验证当前对象状态或默认状态下的表现。",
          "mcpCall": "engine_action.resume_engine",
          "fullPayload": "{\"action\":\"resume_engine\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 engine_action.resume_engine",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "继续运行",
          "expectedText": "继续运行"
        },
        "naturalLanguageTest": "请通过 MCP 调用 engine_action 工具，执行 resume_engine 动作，处理“恢复引擎”这个状态场景。这个场景用于验证当前对象状态或默认状态下的表现。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：继续运行。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 260,
      "tool": "engine_action",
      "action": "get_system_info",
      "title": "系统信息",
      "input": {
        "action": "get_system_info"
      },
      "expected": "返回 {os,browser,device,screenRes,gpu}",
      "note": "",
      "phase": "引擎专项",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 engine_action 工具，执行 get_system_info 动作，处理“系统信息”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {os,browser,device,screenRes,gpu}。",
          "actionGoal": "执行 engine_action.get_system_info",
          "scenarioType": "通用场景",
          "scenarioTitle": "系统信息",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "engine_action.get_system_info",
          "fullPayload": "{\"action\":\"get_system_info\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 engine_action.get_system_info",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回 {os,browser,device,screenRes,gpu}",
          "expectedText": "返回 {os,browser,device,screenRes,gpu}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 engine_action 工具，执行 get_system_info 动作，处理“系统信息”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {os,browser,device,screenRes,gpu}。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 261,
      "tool": "engine_action",
      "action": "dump_texture_cache",
      "title": "纹理缓存",
      "input": {
        "action": "dump_texture_cache"
      },
      "expected": "返回已缓存纹理列表+大小",
      "note": "",
      "phase": "引擎专项",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 engine_action 工具，执行 dump_texture_cache 动作，处理“纹理缓存”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回已缓存纹理列表+大小。",
          "actionGoal": "执行 engine_action.dump_texture_cache",
          "scenarioType": "通用场景",
          "scenarioTitle": "纹理缓存",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "engine_action.dump_texture_cache",
          "fullPayload": "{\"action\":\"dump_texture_cache\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 engine_action.dump_texture_cache",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回已缓存纹理列表+大小",
          "expectedText": "返回已缓存纹理列表+大小"
        },
        "naturalLanguageTest": "请通过 MCP 调用 engine_action 工具，执行 dump_texture_cache 动作，处理“纹理缓存”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回已缓存纹理列表+大小。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 262,
      "tool": "engine_action",
      "action": "get_render_stats",
      "title": "渲染统计",
      "input": {
        "action": "get_render_stats"
      },
      "expected": "返回 {drawCalls,triangles,batches,fps}",
      "note": "",
      "phase": "引擎专项",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 engine_action 工具，执行 get_render_stats 动作，处理“渲染统计”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {drawCalls,triangles,batches,fps}。",
          "actionGoal": "执行 engine_action.get_render_stats",
          "scenarioType": "通用场景",
          "scenarioTitle": "渲染统计",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "engine_action.get_render_stats",
          "fullPayload": "{\"action\":\"get_render_stats\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 engine_action.get_render_stats",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回 {drawCalls,triangles,batches,fps}",
          "expectedText": "返回 {drawCalls,triangles,batches,fps}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 engine_action 工具，执行 get_render_stats 动作，处理“渲染统计”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {drawCalls,triangles,batches,fps}。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 263,
      "tool": "engine_action",
      "action": "get_memory_stats",
      "title": "内存统计",
      "input": {
        "action": "get_memory_stats"
      },
      "expected": "返回 {heapUsed,rss,cachedAssets}",
      "note": "",
      "phase": "引擎专项",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 engine_action 工具，执行 get_memory_stats 动作，处理“内存统计”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {heapUsed,rss,cachedAssets}。",
          "actionGoal": "执行 engine_action.get_memory_stats",
          "scenarioType": "通用场景",
          "scenarioTitle": "内存统计",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "engine_action.get_memory_stats",
          "fullPayload": "{\"action\":\"get_memory_stats\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 engine_action.get_memory_stats",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回 {heapUsed,rss,cachedAssets}",
          "expectedText": "返回 {heapUsed,rss,cachedAssets}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 engine_action 工具，执行 get_memory_stats 动作，处理“内存统计”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {heapUsed,rss,cachedAssets}。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 264,
      "tool": "engine_action",
      "action": "get_editor_performance",
      "title": "性能总览",
      "input": {
        "action": "get_editor_performance"
      },
      "expected": "返回 {fps,nodeCount,platform,paused}",
      "note": "",
      "phase": "引擎专项",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 engine_action 工具，执行 get_editor_performance 动作，处理“性能总览”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {fps,nodeCount,platform,paused}。",
          "actionGoal": "执行 engine_action.get_editor_performance",
          "scenarioType": "通用场景",
          "scenarioTitle": "性能总览",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "engine_action.get_editor_performance",
          "fullPayload": "{\"action\":\"get_editor_performance\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 engine_action.get_editor_performance",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回 {fps,nodeCount,platform,paused}",
          "expectedText": "返回 {fps,nodeCount,platform,paused}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 engine_action 工具，执行 get_editor_performance 动作，处理“性能总览”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {fps,nodeCount,platform,paused}。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 265,
      "tool": "animation_tool",
      "action": "create_clip",
      "title": "创建动画",
      "input": {
        "action": "create_clip",
        "uuid": "<uuid>",
        "duration": 1,
        "wrapMode": "Loop",
        "tracks": [
          {
            "property": "position",
            "keyframes": [
              {
                "time": 0,
                "value": {
                  "x": 0,
                  "y": 0,
                  "z": 0
                }
              },
              {
                "time": 1,
                "value": {
                  "x": 100,
                  "y": 0,
                  "z": 0
                }
              }
            ]
          }
        ]
      },
      "expected": "创建左右移动循环动画",
      "note": "",
      "phase": "动画工作流",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Animation components and clips on Cocos Creator nodes. Create keyframe animations, control playback, and inspect animation state.",
        "zhToolSummary": "Manage Animation 组件 and clips on Cocos Creator 节点s。创建keyframe 动画s, control playback, and inspect 动画 state。",
        "actionDescription": "uuid(REQUIRED, target node), duration(optional, default 1), wrapMode(optional: Normal/Loop/PingPong), speed(optional, default 1), tracks(REQUIRED, array of keyframe tracks), savePath(optional, db://... .anim). Create and attach an AnimationClip, optionally save as asset.",
        "zhActionDescription": "uuid（必填，目标节点），duration（可选，默认 1），wrapMode（可选：Normal/Loop/PingPong），speed（可选，默认 1），tracks（必填，关键帧轨道数组），savePath（可选，db：//... .anim 资源路径）。创建并挂载 AnimationClip，可选保存为资源。",
        "sourceFile": "src/mcp/tools-animation.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 animation_tool 工具，执行 create_clip 动作，处理“创建动画”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 duration 设为 1，把 wrapMode 设为“Loop”，传入 tracks=[{\"property\":\"position\",\"keyframes\":[{\"time\":0,\"value\":{\"x\":0,\"y\":0,\"z\":0}},{\"time\":1,\"value\":{\"x\":100,\"y\":0,\"z\":0}}]}]。调用完成后重点检查：创建左右移动循环动画。",
          "actionGoal": "anim 资源路径）",
          "scenarioType": "参数场景",
          "scenarioTitle": "创建动画",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "animation_tool.create_clip",
          "fullPayload": "{\"action\":\"create_clip\",\"uuid\":\"<uuid>\",\"duration\":1,\"wrapMode\":\"Loop\",\"tracks\":[{\"property\":\"position\",\"keyframes\":[{\"time\":0,\"value\":{\"x\":0,\"y\":0,\"z\":0}},{\"time\":1,\"value\":{\"x\":100,\"y\":0,\"z\":0}}]}]}",
          "inputText": "uuid=<uuid>；duration=1；wrapMode=Loop；tracks=[{\"property\":\"position\",\"keyframes\":[{\"time\":0,\"value\":{\"x\":0,\"y\":0,\"z\":0}},{\"time\":1,\"value\":{\"x\":100,\"y\":0,\"z\":0}}]}]",
          "executionStep": "调用 animation_tool.create_clip",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 duration 设为 1，把 wrapMode 设为“Loop”，传入 tracks=[{\"property\":\"position\",\"keyframes\":[{\"time\":0,\"value\":{\"x\":0,\"y\":0,\"z\":0}},{\"time\":1,\"value\":{\"x\":100,\"y\":0,\"z\":0}}]}]。",
          "verificationFocus": "创建左右移动循环动画",
          "expectedText": "创建左右移动循环动画"
        },
        "naturalLanguageTest": "请通过 MCP 调用 animation_tool 工具，执行 create_clip 动作，处理“创建动画”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 duration 设为 1，把 wrapMode 设为“Loop”，传入 tracks=[{\"property\":\"position\",\"keyframes\":[{\"time\":0,\"value\":{\"x\":0,\"y\":0,\"z\":0}},{\"time\":1,\"value\":{\"x\":100,\"y\":0,\"z\":0}}]}]。调用完成后重点检查：创建左右移动循环动画。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 266,
      "tool": "animation_tool",
      "action": "play",
      "title": "播放默认",
      "input": {
        "action": "play",
        "uuid": "<uuid>"
      },
      "expected": "播放默认动画片段",
      "note": "",
      "phase": "动画工作流",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Animation components and clips on Cocos Creator nodes. Create keyframe animations, control playback, and inspect animation state.",
        "zhToolSummary": "Manage Animation 组件 and clips on Cocos Creator 节点s。创建keyframe 动画s, control playback, and inspect 动画 state。",
        "actionDescription": "uuid(REQUIRED), clipName(optional, plays default clip if omitted). Start playing an animation clip.",
        "zhActionDescription": "uuid（必填），clipName（可选，plays 默认 clip if omitted）。开始播放动画 clip。",
        "sourceFile": "src/mcp/tools-animation.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 animation_tool 工具，执行 play 动作，处理“播放默认”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：播放默认动画片段。",
          "actionGoal": "开始播放动画 clip",
          "scenarioType": "参数场景",
          "scenarioTitle": "播放默认",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "animation_tool.play",
          "fullPayload": "{\"action\":\"play\",\"uuid\":\"<uuid>\"}",
          "inputText": "uuid=<uuid>",
          "executionStep": "调用 animation_tool.play",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>。",
          "verificationFocus": "播放默认动画片段",
          "expectedText": "播放默认动画片段"
        },
        "naturalLanguageTest": "请通过 MCP 调用 animation_tool 工具，执行 play 动作，处理“播放默认”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：播放默认动画片段。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 267,
      "tool": "animation_tool",
      "action": "play",
      "title": "播放指定",
      "input": {
        "action": "play",
        "uuid": "<uuid>",
        "clipName": "walk"
      },
      "expected": "播放 walk 片段",
      "note": "",
      "phase": "动画工作流",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Animation components and clips on Cocos Creator nodes. Create keyframe animations, control playback, and inspect animation state.",
        "zhToolSummary": "Manage Animation 组件 and clips on Cocos Creator 节点s。创建keyframe 动画s, control playback, and inspect 动画 state。",
        "actionDescription": "uuid(REQUIRED), clipName(optional, plays default clip if omitted). Start playing an animation clip.",
        "zhActionDescription": "uuid（必填），clipName（可选，plays 默认 clip if omitted）。开始播放动画 clip。",
        "sourceFile": "src/mcp/tools-animation.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 animation_tool 工具，执行 play 动作，处理“播放指定”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 clipName 设为“walk”。调用完成后重点检查：播放 walk 片段。",
          "actionGoal": "开始播放动画 clip",
          "scenarioType": "参数场景",
          "scenarioTitle": "播放指定",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "animation_tool.play",
          "fullPayload": "{\"action\":\"play\",\"uuid\":\"<uuid>\",\"clipName\":\"walk\"}",
          "inputText": "uuid=<uuid>；clipName=walk",
          "executionStep": "调用 animation_tool.play",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 clipName 设为“walk”。",
          "verificationFocus": "播放 walk 片段",
          "expectedText": "播放 walk 片段"
        },
        "naturalLanguageTest": "请通过 MCP 调用 animation_tool 工具，执行 play 动作，处理“播放指定”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 clipName 设为“walk”。调用完成后重点检查：播放 walk 片段。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 268,
      "tool": "animation_tool",
      "action": "pause",
      "title": "暂停",
      "input": {
        "action": "pause",
        "uuid": "<uuid>"
      },
      "expected": "动画暂停",
      "note": "",
      "phase": "动画工作流",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Animation components and clips on Cocos Creator nodes. Create keyframe animations, control playback, and inspect animation state.",
        "zhToolSummary": "Manage Animation 组件 and clips on Cocos Creator 节点s。创建keyframe 动画s, control playback, and inspect 动画 state。",
        "actionDescription": "uuid(REQUIRED). Pause current animation.",
        "zhActionDescription": "uuid（必填）。暂停当前动画。",
        "sourceFile": "src/mcp/tools-animation.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 animation_tool 工具，执行 pause 动作，处理“暂停”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：动画暂停。",
          "actionGoal": "暂停当前动画",
          "scenarioType": "参数场景",
          "scenarioTitle": "暂停",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "animation_tool.pause",
          "fullPayload": "{\"action\":\"pause\",\"uuid\":\"<uuid>\"}",
          "inputText": "uuid=<uuid>",
          "executionStep": "调用 animation_tool.pause",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>。",
          "verificationFocus": "动画暂停",
          "expectedText": "动画暂停"
        },
        "naturalLanguageTest": "请通过 MCP 调用 animation_tool 工具，执行 pause 动作，处理“暂停”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：动画暂停。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 269,
      "tool": "animation_tool",
      "action": "resume",
      "title": "恢复",
      "input": {
        "action": "resume",
        "uuid": "<uuid>"
      },
      "expected": "继续播放",
      "note": "",
      "phase": "动画工作流",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Animation components and clips on Cocos Creator nodes. Create keyframe animations, control playback, and inspect animation state.",
        "zhToolSummary": "Manage Animation 组件 and clips on Cocos Creator 节点s。创建keyframe 动画s, control playback, and inspect 动画 state。",
        "actionDescription": "uuid(REQUIRED). Resume paused animation.",
        "zhActionDescription": "uuid（必填）。继续播放已暂停的动画。",
        "sourceFile": "src/mcp/tools-animation.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 animation_tool 工具，执行 resume 动作，处理“恢复”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：继续播放。",
          "actionGoal": "继续播放已暂停的动画",
          "scenarioType": "参数场景",
          "scenarioTitle": "恢复",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "animation_tool.resume",
          "fullPayload": "{\"action\":\"resume\",\"uuid\":\"<uuid>\"}",
          "inputText": "uuid=<uuid>",
          "executionStep": "调用 animation_tool.resume",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>。",
          "verificationFocus": "继续播放",
          "expectedText": "继续播放"
        },
        "naturalLanguageTest": "请通过 MCP 调用 animation_tool 工具，执行 resume 动作，处理“恢复”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：继续播放。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 270,
      "tool": "animation_tool",
      "action": "stop",
      "title": "停止",
      "input": {
        "action": "stop",
        "uuid": "<uuid>"
      },
      "expected": "停止并重置",
      "note": "",
      "phase": "动画工作流",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Animation components and clips on Cocos Creator nodes. Create keyframe animations, control playback, and inspect animation state.",
        "zhToolSummary": "Manage Animation 组件 and clips on Cocos Creator 节点s。创建keyframe 动画s, control playback, and inspect 动画 state。",
        "actionDescription": "uuid(REQUIRED). Stop and reset animation to beginning.",
        "zhActionDescription": "uuid（必填）。停止动画并将时间重置到起点。",
        "sourceFile": "src/mcp/tools-animation.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 animation_tool 工具，执行 stop 动作，处理“停止”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：停止并重置。",
          "actionGoal": "停止动画并将时间重置到起点",
          "scenarioType": "参数场景",
          "scenarioTitle": "停止",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "animation_tool.stop",
          "fullPayload": "{\"action\":\"stop\",\"uuid\":\"<uuid>\"}",
          "inputText": "uuid=<uuid>",
          "executionStep": "调用 animation_tool.stop",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>。",
          "verificationFocus": "停止并重置",
          "expectedText": "停止并重置"
        },
        "naturalLanguageTest": "请通过 MCP 调用 animation_tool 工具，执行 stop 动作，处理“停止”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：停止并重置。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 271,
      "tool": "animation_tool",
      "action": "get_state",
      "title": "查状态",
      "input": {
        "action": "get_state",
        "uuid": "<uuid>"
      },
      "expected": "返回 {playing,clip,time}",
      "note": "",
      "phase": "动画工作流",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Animation components and clips on Cocos Creator nodes. Create keyframe animations, control playback, and inspect animation state.",
        "zhToolSummary": "Manage Animation 组件 and clips on Cocos Creator 节点s。创建keyframe 动画s, control playback, and inspect 动画 state。",
        "actionDescription": "uuid(REQUIRED). Get current animation state (playing, paused, current clip, time).",
        "zhActionDescription": "uuid（必填）。获取当前动画状态（playing、paused、current clip、time）。",
        "sourceFile": "src/mcp/tools-animation.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 animation_tool 工具，执行 get_state 动作，处理“查状态”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：返回 {playing,clip,time}。",
          "actionGoal": "获取当前动画状态（playing、paused、current clip、time）",
          "scenarioType": "参数场景",
          "scenarioTitle": "查状态",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "animation_tool.get_state",
          "fullPayload": "{\"action\":\"get_state\",\"uuid\":\"<uuid>\"}",
          "inputText": "uuid=<uuid>",
          "executionStep": "调用 animation_tool.get_state",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>。",
          "verificationFocus": "返回 {playing,clip,time}",
          "expectedText": "返回 {playing,clip,time}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 animation_tool 工具，执行 get_state 动作，处理“查状态”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：返回 {playing,clip,time}。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 272,
      "tool": "animation_tool",
      "action": "list_clips",
      "title": "列出片段",
      "input": {
        "action": "list_clips",
        "uuid": "<uuid>"
      },
      "expected": "返回动画片段名称列表",
      "note": "",
      "phase": "动画工作流",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Animation components and clips on Cocos Creator nodes. Create keyframe animations, control playback, and inspect animation state.",
        "zhToolSummary": "Manage Animation 组件 and clips on Cocos Creator 节点s。创建keyframe 动画s, control playback, and inspect 动画 state。",
        "actionDescription": "uuid(REQUIRED). List all animation clips on a node.",
        "zhActionDescription": "uuid（必填）。列出节点上的全部动画 clip。",
        "sourceFile": "src/mcp/tools-animation.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 animation_tool 工具，执行 list_clips 动作，处理“列出片段”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：返回动画片段名称列表。",
          "actionGoal": "列出节点上的全部动画 clip",
          "scenarioType": "参数场景",
          "scenarioTitle": "列出片段",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "animation_tool.list_clips",
          "fullPayload": "{\"action\":\"list_clips\",\"uuid\":\"<uuid>\"}",
          "inputText": "uuid=<uuid>",
          "executionStep": "调用 animation_tool.list_clips",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>。",
          "verificationFocus": "返回动画片段名称列表",
          "expectedText": "返回动画片段名称列表"
        },
        "naturalLanguageTest": "请通过 MCP 调用 animation_tool 工具，执行 list_clips 动作，处理“列出片段”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：返回动画片段名称列表。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 273,
      "tool": "animation_tool",
      "action": "set_current_time",
      "title": "跳转时间",
      "input": {
        "action": "set_current_time",
        "uuid": "<uuid>",
        "time": 0.5
      },
      "expected": "跳转到 0.5 秒",
      "note": "",
      "phase": "动画工作流",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Animation components and clips on Cocos Creator nodes. Create keyframe animations, control playback, and inspect animation state.",
        "zhToolSummary": "Manage Animation 组件 and clips on Cocos Creator 节点s。创建keyframe 动画s, control playback, and inspect 动画 state。",
        "actionDescription": "uuid(REQUIRED), time(REQUIRED, seconds). Seek animation to a specific time.",
        "zhActionDescription": "uuid（必填），time（必填，秒）。将动画跳转到指定时间。",
        "sourceFile": "src/mcp/tools-animation.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 animation_tool 工具，执行 set_current_time 动作，处理“跳转时间”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 time 设为 0.5。调用完成后重点检查：跳转到 0.5 秒。",
          "actionGoal": "将动画跳转到指定时间",
          "scenarioType": "参数场景",
          "scenarioTitle": "跳转时间",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "animation_tool.set_current_time",
          "fullPayload": "{\"action\":\"set_current_time\",\"uuid\":\"<uuid>\",\"time\":0.5}",
          "inputText": "uuid=<uuid>；time=0.5",
          "executionStep": "调用 animation_tool.set_current_time",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 time 设为 0.5。",
          "verificationFocus": "跳转到 0.5 秒",
          "expectedText": "跳转到 0.5 秒"
        },
        "naturalLanguageTest": "请通过 MCP 调用 animation_tool 工具，执行 set_current_time 动作，处理“跳转时间”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 time 设为 0.5。调用完成后重点检查：跳转到 0.5 秒。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 274,
      "tool": "animation_tool",
      "action": "set_speed",
      "title": "倍速播放",
      "input": {
        "action": "set_speed",
        "uuid": "<uuid>",
        "speed": 2
      },
      "expected": "2 倍速播放",
      "note": "",
      "phase": "动画工作流",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Animation components and clips on Cocos Creator nodes. Create keyframe animations, control playback, and inspect animation state.",
        "zhToolSummary": "Manage Animation 组件 and clips on Cocos Creator 节点s。创建keyframe 动画s, control playback, and inspect 动画 state。",
        "actionDescription": "uuid(REQUIRED), speed(REQUIRED). Set animation playback speed (1.0 = normal).",
        "zhActionDescription": "uuid（必填），speed（必填）。设置动画播放速度（1.0 为正常速度）。",
        "sourceFile": "src/mcp/tools-animation.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 animation_tool 工具，执行 set_speed 动作，处理“倍速播放”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 speed 设为 2。调用完成后重点检查：2 倍速播放。",
          "actionGoal": "设置动画播放速度（1",
          "scenarioType": "参数场景",
          "scenarioTitle": "倍速播放",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "animation_tool.set_speed",
          "fullPayload": "{\"action\":\"set_speed\",\"uuid\":\"<uuid>\",\"speed\":2}",
          "inputText": "uuid=<uuid>；speed=2",
          "executionStep": "调用 animation_tool.set_speed",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 speed 设为 2。",
          "verificationFocus": "2 倍速播放",
          "expectedText": "2 倍速播放"
        },
        "naturalLanguageTest": "请通过 MCP 调用 animation_tool 工具，执行 set_speed 动作，处理“倍速播放”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 speed 设为 2。调用完成后重点检查：2 倍速播放。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 275,
      "tool": "animation_tool",
      "action": "crossfade",
      "title": "交叉淡入",
      "input": {
        "action": "crossfade",
        "uuid": "<uuid>",
        "clipName": "run",
        "duration": 0.3
      },
      "expected": "0.3 秒内淡入 run 动画",
      "note": "",
      "phase": "动画工作流",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage Animation components and clips on Cocos Creator nodes. Create keyframe animations, control playback, and inspect animation state.",
        "zhToolSummary": "Manage Animation 组件 and clips on Cocos Creator 节点s。创建keyframe 动画s, control playback, and inspect 动画 state。",
        "actionDescription": "uuid(REQUIRED), clipName(REQUIRED), duration(optional, default 0.3). Crossfade to another animation clip.",
        "zhActionDescription": "uuid（必填），clipName（必填），duration（可选，默认 0.3）。淡入淡出切换到另一个动画 clip。",
        "sourceFile": "src/mcp/tools-animation.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 animation_tool 工具，执行 crossfade 动作，处理“交叉淡入”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 clipName 设为“run”，把 duration 设为 0.3。调用完成后重点检查：0.3 秒内淡入 run 动画。",
          "actionGoal": "3）",
          "scenarioType": "参数场景",
          "scenarioTitle": "交叉淡入",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "animation_tool.crossfade",
          "fullPayload": "{\"action\":\"crossfade\",\"uuid\":\"<uuid>\",\"clipName\":\"run\",\"duration\":0.3}",
          "inputText": "uuid=<uuid>；clipName=run；duration=0.3",
          "executionStep": "调用 animation_tool.crossfade",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 clipName 设为“run”，把 duration 设为 0.3。",
          "verificationFocus": "0.3 秒内淡入 run 动画",
          "expectedText": "0.3 秒内淡入 run 动画"
        },
        "naturalLanguageTest": "请通过 MCP 调用 animation_tool 工具，执行 crossfade 动作，处理“交叉淡入”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 clipName 设为“run”，把 duration 设为 0.3。调用完成后重点检查：0.3 秒内淡入 run 动画。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 276,
      "tool": "physics_tool",
      "action": "get_collider_info",
      "title": "碰撞器详情",
      "input": {
        "action": "get_collider_info",
        "uuid": "<uuid>"
      },
      "expected": "返回碰撞器+刚体信息",
      "note": "",
      "phase": "物理工作流",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage physics components, materials, and collision settings on Cocos Creator nodes. Inspect and configure colliders, rigid bodies, joints, and physics world.",
        "zhToolSummary": "Manage physics 组件, materials, and collision settings on Cocos Creator 节点s。Inspect and configure colliders, rigid bodies, joints, and physics world。",
        "actionDescription": "uuid(REQUIRED). Get all collider and rigidbody details on a node.",
        "zhActionDescription": "uuid（必填）。获取节点上的全部碰撞体和刚体详情。",
        "sourceFile": "src/mcp/tools-physics.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 physics_tool 工具，执行 get_collider_info 动作，处理“碰撞器详情”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：返回碰撞器+刚体信息。",
          "actionGoal": "获取节点上的全部碰撞体和刚体详情",
          "scenarioType": "参数场景",
          "scenarioTitle": "碰撞器详情",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "physics_tool.get_collider_info",
          "fullPayload": "{\"action\":\"get_collider_info\",\"uuid\":\"<uuid>\"}",
          "inputText": "uuid=<uuid>",
          "executionStep": "调用 physics_tool.get_collider_info",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>。",
          "verificationFocus": "返回碰撞器+刚体信息",
          "expectedText": "返回碰撞器+刚体信息"
        },
        "naturalLanguageTest": "请通过 MCP 调用 physics_tool 工具，执行 get_collider_info 动作，处理“碰撞器详情”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>。调用完成后重点检查：返回碰撞器+刚体信息。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 277,
      "tool": "physics_tool",
      "action": "add_collider",
      "title": "添加 Box2D",
      "input": {
        "action": "add_collider",
        "uuid": "<uuid>",
        "colliderType": "box2d"
      },
      "expected": "添加 BoxCollider2D",
      "note": "",
      "phase": "物理工作流",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage physics components, materials, and collision settings on Cocos Creator nodes. Inspect and configure colliders, rigid bodies, joints, and physics world.",
        "zhToolSummary": "Manage physics 组件, materials, and collision settings on Cocos Creator 节点s。Inspect and configure colliders, rigid bodies, joints, and physics world。",
        "actionDescription": "uuid(REQUIRED), colliderType(REQUIRED: box2d/circle2d/polygon2d/capsule2d/box3d/sphere3d/capsule3d). Add a collider component.",
        "zhActionDescription": "uuid（必填），colliderType（必填：box2d/circle2d/polygon2d/capsule2d/box3d/sphere3d/capsule3d）。添加碰撞体组件。",
        "sourceFile": "src/mcp/tools-physics.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 physics_tool 工具，执行 add_collider 动作，处理“添加 Box2D”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 colliderType 设为“box2d”。调用完成后重点检查：添加 BoxCollider2D。",
          "actionGoal": "添加碰撞体组件",
          "scenarioType": "参数场景",
          "scenarioTitle": "添加 Box2D",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "physics_tool.add_collider",
          "fullPayload": "{\"action\":\"add_collider\",\"uuid\":\"<uuid>\",\"colliderType\":\"box2d\"}",
          "inputText": "uuid=<uuid>；colliderType=box2d",
          "executionStep": "调用 physics_tool.add_collider",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 colliderType 设为“box2d”。",
          "verificationFocus": "添加 BoxCollider2D",
          "expectedText": "添加 BoxCollider2D"
        },
        "naturalLanguageTest": "请通过 MCP 调用 physics_tool 工具，执行 add_collider 动作，处理“添加 Box2D”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 colliderType 设为“box2d”。调用完成后重点检查：添加 BoxCollider2D。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 278,
      "tool": "physics_tool",
      "action": "add_collider",
      "title": "添加 Sphere3D",
      "input": {
        "action": "add_collider",
        "uuid": "<uuid>",
        "colliderType": "sphere3d"
      },
      "expected": "添加 SphereCollider",
      "note": "",
      "phase": "物理工作流",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage physics components, materials, and collision settings on Cocos Creator nodes. Inspect and configure colliders, rigid bodies, joints, and physics world.",
        "zhToolSummary": "Manage physics 组件, materials, and collision settings on Cocos Creator 节点s。Inspect and configure colliders, rigid bodies, joints, and physics world。",
        "actionDescription": "uuid(REQUIRED), colliderType(REQUIRED: box2d/circle2d/polygon2d/capsule2d/box3d/sphere3d/capsule3d). Add a collider component.",
        "zhActionDescription": "uuid（必填），colliderType（必填：box2d/circle2d/polygon2d/capsule2d/box3d/sphere3d/capsule3d）。添加碰撞体组件。",
        "sourceFile": "src/mcp/tools-physics.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 physics_tool 工具，执行 add_collider 动作，处理“添加 Sphere3D”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 colliderType 设为“sphere3d”。调用完成后重点检查：添加 SphereCollider。",
          "actionGoal": "添加碰撞体组件",
          "scenarioType": "参数场景",
          "scenarioTitle": "添加 Sphere3D",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "physics_tool.add_collider",
          "fullPayload": "{\"action\":\"add_collider\",\"uuid\":\"<uuid>\",\"colliderType\":\"sphere3d\"}",
          "inputText": "uuid=<uuid>；colliderType=sphere3d",
          "executionStep": "调用 physics_tool.add_collider",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 colliderType 设为“sphere3d”。",
          "verificationFocus": "添加 SphereCollider",
          "expectedText": "添加 SphereCollider"
        },
        "naturalLanguageTest": "请通过 MCP 调用 physics_tool 工具，执行 add_collider 动作，处理“添加 Sphere3D”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 colliderType 设为“sphere3d”。调用完成后重点检查：添加 SphereCollider。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 279,
      "tool": "physics_tool",
      "action": "set_collider_size",
      "title": "设 Box 大小",
      "input": {
        "action": "set_collider_size",
        "uuid": "<uuid>",
        "width": 100,
        "height": 80
      },
      "expected": "Box 碰撞器→100×80",
      "note": "",
      "phase": "物理工作流",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage physics components, materials, and collision settings on Cocos Creator nodes. Inspect and configure colliders, rigid bodies, joints, and physics world.",
        "zhToolSummary": "Manage physics 组件, materials, and collision settings on Cocos Creator 节点s。Inspect and configure colliders, rigid bodies, joints, and physics world。",
        "actionDescription": "uuid(REQUIRED), colliderType(optional, auto-detect), width/height(for box), radius(for circle/sphere), size(for {x,y} or {x,y,z}).",
        "zhActionDescription": "uuid（必填），colliderType（可选，自动检测），width/height（for box），radius（for circle/sphere），size（for {x，y} or {x，y，z}）。",
        "sourceFile": "src/mcp/tools-physics.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 physics_tool 工具，执行 set_collider_size 动作，处理“设 Box 大小”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 width 设为 100，把 height 设为 80。调用完成后重点检查：Box 碰撞器→100×80。",
          "actionGoal": "uuid（必填），colliderType（可选，自动检测），width/height（for box），radius（for circle/sphere），size（for {x，y} or {x，y，z}）",
          "scenarioType": "参数场景",
          "scenarioTitle": "设 Box 大小",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "physics_tool.set_collider_size",
          "fullPayload": "{\"action\":\"set_collider_size\",\"uuid\":\"<uuid>\",\"width\":100,\"height\":80}",
          "inputText": "uuid=<uuid>；width=100；height=80",
          "executionStep": "调用 physics_tool.set_collider_size",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 width 设为 100，把 height 设为 80。",
          "verificationFocus": "Box 碰撞器→100×80",
          "expectedText": "Box 碰撞器→100×80"
        },
        "naturalLanguageTest": "请通过 MCP 调用 physics_tool 工具，执行 set_collider_size 动作，处理“设 Box 大小”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 width 设为 100，把 height 设为 80。调用完成后重点检查：Box 碰撞器→100×80。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 280,
      "tool": "physics_tool",
      "action": "add_rigidbody",
      "title": "动态刚体",
      "input": {
        "action": "add_rigidbody",
        "uuid": "<uuid>",
        "bodyType": "Dynamic"
      },
      "expected": "添加动态刚体",
      "note": "",
      "phase": "物理工作流",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage physics components, materials, and collision settings on Cocos Creator nodes. Inspect and configure colliders, rigid bodies, joints, and physics world.",
        "zhToolSummary": "Manage physics 组件, materials, and collision settings on Cocos Creator 节点s。Inspect and configure colliders, rigid bodies, joints, and physics world。",
        "actionDescription": "uuid(REQUIRED), bodyType(optional: Dynamic/Static/Kinematic, default Dynamic), is2d(optional, default auto).",
        "zhActionDescription": "uuid（必填），bodyType（可选：Dynamic/Static/Kinematic，默认 Dynamic），is2d（可选，默认 auto）。",
        "sourceFile": "src/mcp/tools-physics.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 physics_tool 工具，执行 add_rigidbody 动作，处理“动态刚体”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 bodyType 设为“Dynamic”。调用完成后重点检查：添加动态刚体。",
          "actionGoal": "uuid（必填），bodyType（可选：Dynamic/Static/Kinematic，默认 Dynamic），is2d（可选，默认 auto）",
          "scenarioType": "参数场景",
          "scenarioTitle": "动态刚体",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "physics_tool.add_rigidbody",
          "fullPayload": "{\"action\":\"add_rigidbody\",\"uuid\":\"<uuid>\",\"bodyType\":\"Dynamic\"}",
          "inputText": "uuid=<uuid>；bodyType=Dynamic",
          "executionStep": "调用 physics_tool.add_rigidbody",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 bodyType 设为“Dynamic”。",
          "verificationFocus": "添加动态刚体",
          "expectedText": "添加动态刚体"
        },
        "naturalLanguageTest": "请通过 MCP 调用 physics_tool 工具，执行 add_rigidbody 动作，处理“动态刚体”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 bodyType 设为“Dynamic”。调用完成后重点检查：添加动态刚体。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 281,
      "tool": "physics_tool",
      "action": "add_rigidbody",
      "title": "静态刚体",
      "input": {
        "action": "add_rigidbody",
        "uuid": "<uuid>",
        "bodyType": "Static"
      },
      "expected": "添加静态刚体",
      "note": "",
      "phase": "物理工作流",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage physics components, materials, and collision settings on Cocos Creator nodes. Inspect and configure colliders, rigid bodies, joints, and physics world.",
        "zhToolSummary": "Manage physics 组件, materials, and collision settings on Cocos Creator 节点s。Inspect and configure colliders, rigid bodies, joints, and physics world。",
        "actionDescription": "uuid(REQUIRED), bodyType(optional: Dynamic/Static/Kinematic, default Dynamic), is2d(optional, default auto).",
        "zhActionDescription": "uuid（必填），bodyType（可选：Dynamic/Static/Kinematic，默认 Dynamic），is2d（可选，默认 auto）。",
        "sourceFile": "src/mcp/tools-physics.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 physics_tool 工具，执行 add_rigidbody 动作，处理“静态刚体”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 bodyType 设为“Static”。调用完成后重点检查：添加静态刚体。",
          "actionGoal": "uuid（必填），bodyType（可选：Dynamic/Static/Kinematic，默认 Dynamic），is2d（可选，默认 auto）",
          "scenarioType": "参数场景",
          "scenarioTitle": "静态刚体",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "physics_tool.add_rigidbody",
          "fullPayload": "{\"action\":\"add_rigidbody\",\"uuid\":\"<uuid>\",\"bodyType\":\"Static\"}",
          "inputText": "uuid=<uuid>；bodyType=Static",
          "executionStep": "调用 physics_tool.add_rigidbody",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 bodyType 设为“Static”。",
          "verificationFocus": "添加静态刚体",
          "expectedText": "添加静态刚体"
        },
        "naturalLanguageTest": "请通过 MCP 调用 physics_tool 工具，执行 add_rigidbody 动作，处理“静态刚体”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 bodyType 设为“Static”。调用完成后重点检查：添加静态刚体。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 282,
      "tool": "physics_tool",
      "action": "set_rigidbody_props",
      "title": "设刚体属性",
      "input": {
        "action": "set_rigidbody_props",
        "uuid": "<uuid>",
        "mass": 5,
        "linearDamping": 0.5,
        "fixedRotation": true
      },
      "expected": "质量 5kg+线性阻尼 0.5+锁定旋转",
      "note": "",
      "phase": "物理工作流",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage physics components, materials, and collision settings on Cocos Creator nodes. Inspect and configure colliders, rigid bodies, joints, and physics world.",
        "zhToolSummary": "Manage physics 组件, materials, and collision settings on Cocos Creator 节点s。Inspect and configure colliders, rigid bodies, joints, and physics world。",
        "actionDescription": "uuid(REQUIRED), mass/linearDamping/angularDamping/gravityScale/fixedRotation/allowSleep/bullet(all optional).",
        "zhActionDescription": "uuid（必填），mass/linearDamping/angularDamping/gravityScale/fixedRotation/allowSleep/bullet（all 可选）。",
        "sourceFile": "src/mcp/tools-physics.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 physics_tool 工具，执行 set_rigidbody_props 动作，处理“设刚体属性”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 mass 设为 5，把 linearDamping 设为 0.5，把 fixedRotation 设为 true。调用完成后重点检查：质量 5kg+线性阻尼 0.5+锁定旋转。",
          "actionGoal": "uuid（必填），mass/linearDamping/angularDamping/gravityScale/fixedRotation/allowSleep/bullet（all 可选）",
          "scenarioType": "参数场景",
          "scenarioTitle": "设刚体属性",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "physics_tool.set_rigidbody_props",
          "fullPayload": "{\"action\":\"set_rigidbody_props\",\"uuid\":\"<uuid>\",\"mass\":5,\"linearDamping\":0.5,\"fixedRotation\":true}",
          "inputText": "uuid=<uuid>；mass=5；linearDamping=0.5；fixedRotation=true",
          "executionStep": "调用 physics_tool.set_rigidbody_props",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 mass 设为 5，把 linearDamping 设为 0.5，把 fixedRotation 设为 true。",
          "verificationFocus": "质量 5kg+线性阻尼 0.5+锁定旋转",
          "expectedText": "质量 5kg+线性阻尼 0.5+锁定旋转"
        },
        "naturalLanguageTest": "请通过 MCP 调用 physics_tool 工具，执行 set_rigidbody_props 动作，处理“设刚体属性”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 mass 设为 5，把 linearDamping 设为 0.5，把 fixedRotation 设为 true。调用完成后重点检查：质量 5kg+线性阻尼 0.5+锁定旋转。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 283,
      "tool": "physics_tool",
      "action": "set_physics_material",
      "title": "设物理材质",
      "input": {
        "action": "set_physics_material",
        "uuid": "<uuid>",
        "friction": 0.3,
        "restitution": 0.8
      },
      "expected": "摩擦 0.3+弹性 0.8",
      "note": "",
      "phase": "物理工作流",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage physics components, materials, and collision settings on Cocos Creator nodes. Inspect and configure colliders, rigid bodies, joints, and physics world.",
        "zhToolSummary": "Manage physics 组件, materials, and collision settings on Cocos Creator 节点s。Inspect and configure colliders, rigid bodies, joints, and physics world。",
        "actionDescription": "uuid(REQUIRED), friction(optional), restitution(optional), density(optional). Set physics material properties on collider.",
        "zhActionDescription": "uuid（必填），friction（可选），restitution（可选），density（可选）。设置碰撞体上的物理材质属性。",
        "sourceFile": "src/mcp/tools-physics.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 physics_tool 工具，执行 set_physics_material 动作，处理“设物理材质”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 friction 设为 0.3，把 restitution 设为 0.8。调用完成后重点检查：摩擦 0.3+弹性 0.8。",
          "actionGoal": "设置碰撞体上的物理材质属性",
          "scenarioType": "参数场景",
          "scenarioTitle": "设物理材质",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "physics_tool.set_physics_material",
          "fullPayload": "{\"action\":\"set_physics_material\",\"uuid\":\"<uuid>\",\"friction\":0.3,\"restitution\":0.8}",
          "inputText": "uuid=<uuid>；friction=0.3；restitution=0.8",
          "executionStep": "调用 physics_tool.set_physics_material",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 friction 设为 0.3，把 restitution 设为 0.8。",
          "verificationFocus": "摩擦 0.3+弹性 0.8",
          "expectedText": "摩擦 0.3+弹性 0.8"
        },
        "naturalLanguageTest": "请通过 MCP 调用 physics_tool 工具，执行 set_physics_material 动作，处理“设物理材质”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 friction 设为 0.3，把 restitution 设为 0.8。调用完成后重点检查：摩擦 0.3+弹性 0.8。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 284,
      "tool": "physics_tool",
      "action": "set_collision_group",
      "title": "设碰撞组",
      "input": {
        "action": "set_collision_group",
        "uuid": "<uuid>",
        "group": 2
      },
      "expected": "碰撞组→2",
      "note": "",
      "phase": "物理工作流",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage physics components, materials, and collision settings on Cocos Creator nodes. Inspect and configure colliders, rigid bodies, joints, and physics world.",
        "zhToolSummary": "Manage physics 组件, materials, and collision settings on Cocos Creator 节点s。Inspect and configure colliders, rigid bodies, joints, and physics world。",
        "actionDescription": "uuid(REQUIRED), group(REQUIRED, integer). Set the collision group/layer of a collider.",
        "zhActionDescription": "uuid（必填），group（必填，整数）。设置碰撞体的碰撞分组或层级。",
        "sourceFile": "src/mcp/tools-physics.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 physics_tool 工具，执行 set_collision_group 动作，处理“设碰撞组”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 group 设为 2。调用完成后重点检查：碰撞组→2。",
          "actionGoal": "设置碰撞体的碰撞分组或层级",
          "scenarioType": "参数场景",
          "scenarioTitle": "设碰撞组",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "physics_tool.set_collision_group",
          "fullPayload": "{\"action\":\"set_collision_group\",\"uuid\":\"<uuid>\",\"group\":2}",
          "inputText": "uuid=<uuid>；group=2",
          "executionStep": "调用 physics_tool.set_collision_group",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 group 设为 2。",
          "verificationFocus": "碰撞组→2",
          "expectedText": "碰撞组→2"
        },
        "naturalLanguageTest": "请通过 MCP 调用 physics_tool 工具，执行 set_collision_group 动作，处理“设碰撞组”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 group 设为 2。调用完成后重点检查：碰撞组→2。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 285,
      "tool": "physics_tool",
      "action": "get_physics_world",
      "title": "世界配置",
      "input": {
        "action": "get_physics_world"
      },
      "expected": "返回重力/时间步等参数",
      "note": "",
      "phase": "物理工作流",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage physics components, materials, and collision settings on Cocos Creator nodes. Inspect and configure colliders, rigid bodies, joints, and physics world.",
        "zhToolSummary": "Manage physics 组件, materials, and collision settings on Cocos Creator 节点s。Inspect and configure colliders, rigid bodies, joints, and physics world。",
        "actionDescription": "no params. Get current physics world configuration (gravity, timestep, etc.).",
        "zhActionDescription": "无参数。获取当前物理世界配置（gravity、timestep 等）。",
        "sourceFile": "src/mcp/tools-physics.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 physics_tool 工具，执行 get_physics_world 动作，处理“世界配置”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回重力/时间步等参数。",
          "actionGoal": "获取当前物理世界配置（gravity、timestep 等）",
          "scenarioType": "通用场景",
          "scenarioTitle": "世界配置",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "physics_tool.get_physics_world",
          "fullPayload": "{\"action\":\"get_physics_world\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 physics_tool.get_physics_world",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回重力/时间步等参数",
          "expectedText": "返回重力/时间步等参数"
        },
        "naturalLanguageTest": "请通过 MCP 调用 physics_tool 工具，执行 get_physics_world 动作，处理“世界配置”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回重力/时间步等参数。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 286,
      "tool": "physics_tool",
      "action": "set_physics_world",
      "title": "设重力",
      "input": {
        "action": "set_physics_world",
        "gravity": {
          "x": 0,
          "y": -20,
          "z": 0
        }
      },
      "expected": "重力→-20 m/s²",
      "note": "",
      "phase": "物理工作流",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage physics components, materials, and collision settings on Cocos Creator nodes. Inspect and configure colliders, rigid bodies, joints, and physics world.",
        "zhToolSummary": "Manage physics 组件, materials, and collision settings on Cocos Creator 节点s。Inspect and configure colliders, rigid bodies, joints, and physics world。",
        "actionDescription": "gravity(optional {x,y,z}), allowSleep(optional), fixedTimeStep(optional). Configure physics world.",
        "zhActionDescription": "gravity（可选 {x，y，z}），allowSleep（可选），fixedTimeStep（可选）。配置物理世界。",
        "sourceFile": "src/mcp/tools-physics.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 physics_tool 工具，执行 set_physics_world 动作，处理“设重力”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请传入 gravity={\"x\":0,\"y\":-20,\"z\":0}。调用完成后重点检查：重力→-20 m/s²。",
          "actionGoal": "配置物理世界",
          "scenarioType": "参数场景",
          "scenarioTitle": "设重力",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "physics_tool.set_physics_world",
          "fullPayload": "{\"action\":\"set_physics_world\",\"gravity\":{\"x\":0,\"y\":-20,\"z\":0}}",
          "inputText": "gravity={\"x\":0,\"y\":-20,\"z\":0}",
          "executionStep": "调用 physics_tool.set_physics_world",
          "parameterNarrative": "这次请传入 gravity={\"x\":0,\"y\":-20,\"z\":0}。",
          "verificationFocus": "重力→-20 m/s²",
          "expectedText": "重力→-20 m/s²"
        },
        "naturalLanguageTest": "请通过 MCP 调用 physics_tool 工具，执行 set_physics_world 动作，处理“设重力”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请传入 gravity={\"x\":0,\"y\":-20,\"z\":0}。调用完成后重点检查：重力→-20 m/s²。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 287,
      "tool": "physics_tool",
      "action": "add_joint",
      "title": "弹簧关节",
      "input": {
        "action": "add_joint",
        "uuid": "<uuid>",
        "jointType": "spring",
        "connectedUuid": "<other>"
      },
      "expected": "两节点间添加弹簧关节",
      "note": "",
      "phase": "物理工作流",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage physics components, materials, and collision settings on Cocos Creator nodes. Inspect and configure colliders, rigid bodies, joints, and physics world.",
        "zhToolSummary": "Manage physics 组件, materials, and collision settings on Cocos Creator 节点s。Inspect and configure colliders, rigid bodies, joints, and physics world。",
        "actionDescription": "uuid(REQUIRED), jointType(REQUIRED: distance/spring/hinge/fixed/slider), connectedUuid(optional), props(optional). Add a 2D physics joint.",
        "zhActionDescription": "uuid（必填），jointType（必填：distance/spring/hinge/fixed/slider），connectedUuid（可选），props（可选）。添加一个 2D 物理关节。",
        "sourceFile": "src/mcp/tools-physics.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 physics_tool 工具，执行 add_joint 动作，处理“弹簧关节”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 jointType 设为“spring”，将 connectedUuid 指向 <other>。调用完成后重点检查：两节点间添加弹簧关节。",
          "actionGoal": "添加一个 2D 物理关节",
          "scenarioType": "参数场景",
          "scenarioTitle": "弹簧关节",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "physics_tool.add_joint",
          "fullPayload": "{\"action\":\"add_joint\",\"uuid\":\"<uuid>\",\"jointType\":\"spring\",\"connectedUuid\":\"<other>\"}",
          "inputText": "uuid=<uuid>；jointType=spring；connectedUuid=<other>",
          "executionStep": "调用 physics_tool.add_joint",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 jointType 设为“spring”，将 connectedUuid 指向 <other>。",
          "verificationFocus": "两节点间添加弹簧关节",
          "expectedText": "两节点间添加弹簧关节"
        },
        "naturalLanguageTest": "请通过 MCP 调用 physics_tool 工具，执行 add_joint 动作，处理“弹簧关节”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 jointType 设为“spring”，将 connectedUuid 指向 <other>。调用完成后重点检查：两节点间添加弹簧关节。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 288,
      "tool": "preferences",
      "action": "get",
      "title": "读偏好",
      "input": {
        "action": "get",
        "key": "general.language",
        "scope": "global"
      },
      "expected": "返回 {value:\"zh\"}",
      "note": "",
      "phase": "环境与连通",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read or write Cocos Editor preferences with scope awareness (global/project/default).",
        "zhToolSummary": "Read or write Cocos Editor preferences with scope awareness (global/project/default)。",
        "actionDescription": "key(REQUIRED), scope(optional: \"global\"/\"project\"/\"default\", default=\"global\"). Read a preference value.",
        "zhActionDescription": "key（必填），scope（可选：\"global\"/\"project\"/\"默认\"，默认=\"global\"）。读取偏好设置值。",
        "sourceFile": "src/mcp/tools-misc.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 preferences 工具，执行 get 动作，处理“读偏好”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 key 设为“general.language”，把 scope 设为“global”。调用完成后重点检查：返回 {value:\"zh\"}。",
          "actionGoal": "读取偏好设置值",
          "scenarioType": "参数场景",
          "scenarioTitle": "读偏好",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "preferences.get",
          "fullPayload": "{\"action\":\"get\",\"key\":\"general.language\",\"scope\":\"global\"}",
          "inputText": "key=general.language；scope=global",
          "executionStep": "调用 preferences.get",
          "parameterNarrative": "这次请把 key 设为“general.language”，把 scope 设为“global”。",
          "verificationFocus": "返回 {value:\"zh\"}",
          "expectedText": "返回 {value:\"zh\"}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 preferences 工具，执行 get 动作，处理“读偏好”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 key 设为“general.language”，把 scope 设为“global”。调用完成后重点检查：返回 {value:\"zh\"}。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 289,
      "tool": "preferences",
      "action": "set",
      "title": "写偏好",
      "input": {
        "action": "set",
        "key": "general.language",
        "value": "en",
        "scope": "global"
      },
      "expected": "语言改为英文",
      "note": "",
      "phase": "环境与连通",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read or write Cocos Editor preferences with scope awareness (global/project/default).",
        "zhToolSummary": "Read or write Cocos Editor preferences with scope awareness (global/project/default)。",
        "actionDescription": "key(REQUIRED), value(REQUIRED), scope(optional: \"global\"/\"project\", default=\"global\"). Write a preference value.",
        "zhActionDescription": "key（必填），value（必填），scope（可选：\"global\"/\"project\"，默认=\"global\"）。写入偏好设置值。",
        "sourceFile": "src/mcp/tools-misc.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 preferences 工具，执行 set 动作，处理“写偏好”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 key 设为“general.language”，把 value 设为“en”，把 scope 设为“global”。调用完成后重点检查：语言改为英文。",
          "actionGoal": "写入偏好设置值",
          "scenarioType": "参数场景",
          "scenarioTitle": "写偏好",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "preferences.set",
          "fullPayload": "{\"action\":\"set\",\"key\":\"general.language\",\"value\":\"en\",\"scope\":\"global\"}",
          "inputText": "key=general.language；value=en；scope=global",
          "executionStep": "调用 preferences.set",
          "parameterNarrative": "这次请把 key 设为“general.language”，把 value 设为“en”，把 scope 设为“global”。",
          "verificationFocus": "语言改为英文",
          "expectedText": "语言改为英文"
        },
        "naturalLanguageTest": "请通过 MCP 调用 preferences 工具，执行 set 动作，处理“写偏好”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 key 设为“general.language”，把 value 设为“en”，把 scope 设为“global”。调用完成后重点检查：语言改为英文。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 290,
      "tool": "preferences",
      "action": "list",
      "title": "列出全部",
      "input": {
        "action": "list"
      },
      "expected": "返回所有偏好设置",
      "note": "",
      "phase": "环境与连通",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read or write Cocos Editor preferences with scope awareness (global/project/default).",
        "zhToolSummary": "Read or write Cocos Editor preferences with scope awareness (global/project/default)。",
        "actionDescription": "no params. List all available preferences with scope info.",
        "zhActionDescription": "无参数。列出全部可用偏好设置及其作用域信息。",
        "sourceFile": "src/mcp/tools-misc.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 preferences 工具，执行 list 动作，处理“列出全部”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回所有偏好设置。",
          "actionGoal": "列出全部可用偏好设置及其作用域信息",
          "scenarioType": "通用场景",
          "scenarioTitle": "列出全部",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "preferences.list",
          "fullPayload": "{\"action\":\"list\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 preferences.list",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回所有偏好设置",
          "expectedText": "返回所有偏好设置"
        },
        "naturalLanguageTest": "请通过 MCP 调用 preferences 工具，执行 list 动作，处理“列出全部”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回所有偏好设置。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 291,
      "tool": "preferences",
      "action": "get_global",
      "title": "读全局",
      "input": {
        "action": "get_global",
        "key": "general.theme"
      },
      "expected": "返回 {value:\"dark\"}",
      "note": "",
      "phase": "环境与连通",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read or write Cocos Editor preferences with scope awareness (global/project/default).",
        "zhToolSummary": "Read or write Cocos Editor preferences with scope awareness (global/project/default)。",
        "actionDescription": "key(REQUIRED). Shortcut: read from global scope.",
        "zhActionDescription": "key（必填）。快捷方式：从全局作用域读取。",
        "sourceFile": "src/mcp/tools-misc.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 preferences 工具，执行 get_global 动作，处理“读全局”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 key 设为“general.theme”。调用完成后重点检查：返回 {value:\"dark\"}。",
          "actionGoal": "快捷方式：从全局作用域读取",
          "scenarioType": "参数场景",
          "scenarioTitle": "读全局",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "preferences.get_global",
          "fullPayload": "{\"action\":\"get_global\",\"key\":\"general.theme\"}",
          "inputText": "key=general.theme",
          "executionStep": "调用 preferences.get_global",
          "parameterNarrative": "这次请把 key 设为“general.theme”。",
          "verificationFocus": "返回 {value:\"dark\"}",
          "expectedText": "返回 {value:\"dark\"}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 preferences 工具，执行 get_global 动作，处理“读全局”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 key 设为“general.theme”。调用完成后重点检查：返回 {value:\"dark\"}。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 292,
      "tool": "preferences",
      "action": "set_global",
      "title": "写全局",
      "input": {
        "action": "set_global",
        "key": "general.theme",
        "value": "light"
      },
      "expected": "主题改为亮色",
      "note": "",
      "phase": "环境与连通",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read or write Cocos Editor preferences with scope awareness (global/project/default).",
        "zhToolSummary": "Read or write Cocos Editor preferences with scope awareness (global/project/default)。",
        "actionDescription": "key(REQUIRED), value(REQUIRED). Shortcut: write to global scope.",
        "zhActionDescription": "key（必填），value（必填）。快捷方式：写入全局作用域。",
        "sourceFile": "src/mcp/tools-misc.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 preferences 工具，执行 set_global 动作，处理“写全局”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 key 设为“general.theme”，把 value 设为“light”。调用完成后重点检查：主题改为亮色。",
          "actionGoal": "快捷方式：写入全局作用域",
          "scenarioType": "参数场景",
          "scenarioTitle": "写全局",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "preferences.set_global",
          "fullPayload": "{\"action\":\"set_global\",\"key\":\"general.theme\",\"value\":\"light\"}",
          "inputText": "key=general.theme；value=light",
          "executionStep": "调用 preferences.set_global",
          "parameterNarrative": "这次请把 key 设为“general.theme”，把 value 设为“light”。",
          "verificationFocus": "主题改为亮色",
          "expectedText": "主题改为亮色"
        },
        "naturalLanguageTest": "请通过 MCP 调用 preferences 工具，执行 set_global 动作，处理“写全局”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 key 设为“general.theme”，把 value 设为“light”。调用完成后重点检查：主题改为亮色。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 293,
      "tool": "preferences",
      "action": "get_project",
      "title": "读项目级",
      "input": {
        "action": "get_project",
        "key": "builder.compressTexture"
      },
      "expected": "返回压缩纹理设置",
      "note": "",
      "phase": "环境与连通",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read or write Cocos Editor preferences with scope awareness (global/project/default).",
        "zhToolSummary": "Read or write Cocos Editor preferences with scope awareness (global/project/default)。",
        "actionDescription": "key(REQUIRED). Shortcut: read from project scope.",
        "zhActionDescription": "key（必填）。快捷方式：从项目作用域读取。",
        "sourceFile": "src/mcp/tools-misc.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 preferences 工具，执行 get_project 动作，处理“读项目级”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 key 设为“builder.compressTexture”。调用完成后重点检查：返回压缩纹理设置。",
          "actionGoal": "快捷方式：从项目作用域读取",
          "scenarioType": "参数场景",
          "scenarioTitle": "读项目级",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "preferences.get_project",
          "fullPayload": "{\"action\":\"get_project\",\"key\":\"builder.compressTexture\"}",
          "inputText": "key=builder.compressTexture",
          "executionStep": "调用 preferences.get_project",
          "parameterNarrative": "这次请把 key 设为“builder.compressTexture”。",
          "verificationFocus": "返回压缩纹理设置",
          "expectedText": "返回压缩纹理设置"
        },
        "naturalLanguageTest": "请通过 MCP 调用 preferences 工具，执行 get_project 动作，处理“读项目级”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 key 设为“builder.compressTexture”。调用完成后重点检查：返回压缩纹理设置。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 294,
      "tool": "preferences",
      "action": "set_project",
      "title": "写项目级",
      "input": {
        "action": "set_project",
        "key": "preview.port",
        "value": 7456
      },
      "expected": "预览端口→7456",
      "note": "",
      "phase": "环境与连通",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Read or write Cocos Editor preferences with scope awareness (global/project/default).",
        "zhToolSummary": "Read or write Cocos Editor preferences with scope awareness (global/project/default)。",
        "actionDescription": "key(REQUIRED), value(REQUIRED). Shortcut: write to project scope.",
        "zhActionDescription": "key（必填），value（必填）。快捷方式：写入项目作用域。",
        "sourceFile": "src/mcp/tools-misc.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 preferences 工具，执行 set_project 动作，处理“写项目级”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 key 设为“preview.port”，把 value 设为 7456。调用完成后重点检查：预览端口→7456。",
          "actionGoal": "快捷方式：写入项目作用域",
          "scenarioType": "参数场景",
          "scenarioTitle": "写项目级",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "preferences.set_project",
          "fullPayload": "{\"action\":\"set_project\",\"key\":\"preview.port\",\"value\":7456}",
          "inputText": "key=preview.port；value=7456",
          "executionStep": "调用 preferences.set_project",
          "parameterNarrative": "这次请把 key 设为“preview.port”，把 value 设为 7456。",
          "verificationFocus": "预览端口→7456",
          "expectedText": "预览端口→7456"
        },
        "naturalLanguageTest": "请通过 MCP 调用 preferences 工具，执行 set_project 动作，处理“写项目级”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 key 设为“preview.port”，把 value 设为 7456。调用完成后重点检查：预览端口→7456。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 295,
      "tool": "broadcast",
      "action": "poll",
      "title": "拉取事件",
      "input": {
        "action": "poll",
        "since": 1700000000000
      },
      "expected": "返回该时间戳后的新事件列表",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P3",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Poll, manage, and send editor event broadcasts.",
        "zhToolSummary": "轮询、管理并发送编辑器事件广播。",
        "actionDescription": "since(recommended, timestamp in ms). Get new events since a timestamp. If omitted, returns all recent events.",
        "zhActionDescription": "since（推荐，毫秒时间戳）。获取某个时间戳之后的新事件。如果省略参数，则返回最近的全部事件。",
        "sourceFile": "src/mcp/tools-misc.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 broadcast 工具，执行 poll 动作，处理“拉取事件”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 since 设为 1700000000000。调用完成后重点检查：返回该时间戳后的新事件列表。",
          "actionGoal": "获取某个时间戳之后的新事件",
          "scenarioType": "参数场景",
          "scenarioTitle": "拉取事件",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "broadcast.poll",
          "fullPayload": "{\"action\":\"poll\",\"since\":1700000000000}",
          "inputText": "since=1700000000000",
          "executionStep": "调用 broadcast.poll",
          "parameterNarrative": "这次请把 since 设为 1700000000000。",
          "verificationFocus": "返回该时间戳后的新事件列表",
          "expectedText": "返回该时间戳后的新事件列表"
        },
        "naturalLanguageTest": "请通过 MCP 调用 broadcast 工具，执行 poll 动作，处理“拉取事件”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 since 设为 1700000000000。调用完成后重点检查：返回该时间戳后的新事件列表。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 296,
      "tool": "broadcast",
      "action": "history",
      "title": "历史记录",
      "input": {
        "action": "history",
        "limit": 10
      },
      "expected": "返回最近 10 条事件",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P3",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Poll, manage, and send editor event broadcasts.",
        "zhToolSummary": "轮询、管理并发送编辑器事件广播。",
        "actionDescription": "limit(optional, default 20). Get recent N events.",
        "zhActionDescription": "limit（可选，默认 20）。获取最近 N 条事件。",
        "sourceFile": "src/mcp/tools-misc.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 broadcast 工具，执行 history 动作，处理“历史记录”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 limit 设为 10。调用完成后重点检查：返回最近 10 条事件。",
          "actionGoal": "获取最近 N 条事件",
          "scenarioType": "参数场景",
          "scenarioTitle": "历史记录",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "broadcast.history",
          "fullPayload": "{\"action\":\"history\",\"limit\":10}",
          "inputText": "limit=10",
          "executionStep": "调用 broadcast.history",
          "parameterNarrative": "这次请把 limit 设为 10。",
          "verificationFocus": "返回最近 10 条事件",
          "expectedText": "返回最近 10 条事件"
        },
        "naturalLanguageTest": "请通过 MCP 调用 broadcast 工具，执行 history 动作，处理“历史记录”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 limit 设为 10。调用完成后重点检查：返回最近 10 条事件。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 297,
      "tool": "broadcast",
      "action": "clear",
      "title": "清空队列",
      "input": {
        "action": "clear"
      },
      "expected": "事件队列清空",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P3",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Poll, manage, and send editor event broadcasts.",
        "zhToolSummary": "轮询、管理并发送编辑器事件广播。",
        "actionDescription": "no params. Clear the event queue.",
        "zhActionDescription": "无参数。清空事件队列。",
        "sourceFile": "src/mcp/tools-misc.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 broadcast 工具，执行 clear 动作，处理“清空队列”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：事件队列清空。",
          "actionGoal": "清空事件队列",
          "scenarioType": "通用场景",
          "scenarioTitle": "清空队列",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "broadcast.clear",
          "fullPayload": "{\"action\":\"clear\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 broadcast.clear",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "事件队列清空",
          "expectedText": "事件队列清空"
        },
        "naturalLanguageTest": "请通过 MCP 调用 broadcast 工具，执行 clear 动作，处理“清空队列”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：事件队列清空。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 298,
      "tool": "broadcast",
      "action": "send",
      "title": "广播消息",
      "input": {
        "action": "send",
        "channel": "ai:done",
        "data": {
          "task": "build_ui"
        }
      },
      "expected": "广播自定义消息",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P3",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Poll, manage, and send editor event broadcasts.",
        "zhToolSummary": "轮询、管理并发送编辑器事件广播。",
        "actionDescription": "channel(REQUIRED), data(optional). Broadcast a custom message to all listeners.",
        "zhActionDescription": "channel（必填），data（可选）。向全部监听器广播自定义消息。",
        "sourceFile": "src/mcp/tools-misc.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 broadcast 工具，执行 send 动作，处理“广播消息”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 channel 设为“ai:done”，传入 data={\"task\":\"build_ui\"}。调用完成后重点检查：广播自定义消息。",
          "actionGoal": "向全部监听器广播自定义消息",
          "scenarioType": "参数场景",
          "scenarioTitle": "广播消息",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "broadcast.send",
          "fullPayload": "{\"action\":\"send\",\"channel\":\"ai:done\",\"data\":{\"task\":\"build_ui\"}}",
          "inputText": "channel=ai:done；data={\"task\":\"build_ui\"}",
          "executionStep": "调用 broadcast.send",
          "parameterNarrative": "这次请把 channel 设为“ai:done”，传入 data={\"task\":\"build_ui\"}。",
          "verificationFocus": "广播自定义消息",
          "expectedText": "广播自定义消息"
        },
        "naturalLanguageTest": "请通过 MCP 调用 broadcast 工具，执行 send 动作，处理“广播消息”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 channel 设为“ai:done”，传入 data={\"task\":\"build_ui\"}。调用完成后重点检查：广播自定义消息。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 299,
      "tool": "broadcast",
      "action": "send_ipc",
      "title": "IPC 广播",
      "input": {
        "action": "send_ipc",
        "module": "scene",
        "message": "soft-reload"
      },
      "expected": "发送场景重载 IPC",
      "note": "",
      "phase": "编辑器联动",
      "priority": "P3",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Poll, manage, and send editor event broadcasts.",
        "zhToolSummary": "轮询、管理并发送编辑器事件广播。",
        "actionDescription": "module(REQUIRED), message(REQUIRED), args(optional). Send a raw Editor IPC broadcast message.",
        "zhActionDescription": "module（必填），message（必填），args（可选）。发送一条原始 Editor IPC 广播消息。",
        "sourceFile": "src/mcp/tools-misc.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 broadcast 工具，执行 send_ipc 动作，处理“IPC 广播”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 module 设为“scene”，把 message 设为“soft-reload”。调用完成后重点检查：发送场景重载 IPC。",
          "actionGoal": "发送一条原始 Editor IPC 广播消息",
          "scenarioType": "参数场景",
          "scenarioTitle": "IPC 广播",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "broadcast.send_ipc",
          "fullPayload": "{\"action\":\"send_ipc\",\"module\":\"scene\",\"message\":\"soft-reload\"}",
          "inputText": "module=scene；message=soft-reload",
          "executionStep": "调用 broadcast.send_ipc",
          "parameterNarrative": "这次请把 module 设为“scene”，把 message 设为“soft-reload”。",
          "verificationFocus": "发送场景重载 IPC",
          "expectedText": "发送场景重载 IPC"
        },
        "naturalLanguageTest": "请通过 MCP 调用 broadcast 工具，执行 send_ipc 动作，处理“IPC 广播”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 module 设为“scene”，把 message 设为“soft-reload”。调用完成后重点检查：发送场景重载 IPC。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 300,
      "tool": "reference_image",
      "action": "set",
      "title": "显示参考图",
      "input": {
        "action": "set",
        "opacity": 0.5
      },
      "expected": "参考图叠加层显示，透明度 50%",
      "note": "",
      "phase": "UI 与参考图",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 reference_image 工具，执行 set 动作，处理“显示参考图”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 opacity 设为 0.5。调用完成后重点检查：参考图叠加层显示，透明度 50%。",
          "actionGoal": "执行 reference_image.set",
          "scenarioType": "参数场景",
          "scenarioTitle": "显示参考图",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "reference_image.set",
          "fullPayload": "{\"action\":\"set\",\"opacity\":0.5}",
          "inputText": "opacity=0.5",
          "executionStep": "调用 reference_image.set",
          "parameterNarrative": "这次请把 opacity 设为 0.5。",
          "verificationFocus": "参考图叠加层显示，透明度 50%",
          "expectedText": "参考图叠加层显示，透明度 50%"
        },
        "naturalLanguageTest": "请通过 MCP 调用 reference_image 工具，执行 set 动作，处理“显示参考图”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 opacity 设为 0.5。调用完成后重点检查：参考图叠加层显示，透明度 50%。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 301,
      "tool": "reference_image",
      "action": "clear",
      "title": "清除参考图",
      "input": {
        "action": "clear"
      },
      "expected": "隐藏所有参考图叠加",
      "note": "",
      "phase": "UI 与参考图",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 reference_image 工具，执行 clear 动作，处理“清除参考图”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：隐藏所有参考图叠加。",
          "actionGoal": "执行 reference_image.clear",
          "scenarioType": "通用场景",
          "scenarioTitle": "清除参考图",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "reference_image.clear",
          "fullPayload": "{\"action\":\"clear\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 reference_image.clear",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "隐藏所有参考图叠加",
          "expectedText": "隐藏所有参考图叠加"
        },
        "naturalLanguageTest": "请通过 MCP 调用 reference_image 工具，执行 clear 动作，处理“清除参考图”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：隐藏所有参考图叠加。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 302,
      "tool": "reference_image",
      "action": "list",
      "title": "列出参考图",
      "input": {
        "action": "list"
      },
      "expected": "返回场景中参考图节点列表",
      "note": "",
      "phase": "UI 与参考图",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 reference_image 工具，执行 list 动作，处理“列出参考图”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回场景中参考图节点列表。",
          "actionGoal": "执行 reference_image.list",
          "scenarioType": "通用场景",
          "scenarioTitle": "列出参考图",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "reference_image.list",
          "fullPayload": "{\"action\":\"list\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 reference_image.list",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回场景中参考图节点列表",
          "expectedText": "返回场景中参考图节点列表"
        },
        "naturalLanguageTest": "请通过 MCP 调用 reference_image 工具，执行 list 动作，处理“列出参考图”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回场景中参考图节点列表。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 303,
      "tool": "reference_image",
      "action": "add",
      "title": "添加参考图",
      "input": {
        "action": "add",
        "imagePath": "db://assets/ui/mockup.png",
        "opacity": 0.4
      },
      "expected": "添加参考图节点",
      "note": "",
      "phase": "UI 与参考图",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 reference_image 工具，执行 add 动作，处理“添加参考图”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 imagePath 设为“db://assets/ui/mockup.png”，把 opacity 设为 0.4。调用完成后重点检查：添加参考图节点。",
          "actionGoal": "执行 reference_image.add",
          "scenarioType": "参数场景",
          "scenarioTitle": "添加参考图",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "reference_image.add",
          "fullPayload": "{\"action\":\"add\",\"imagePath\":\"db://assets/ui/mockup.png\",\"opacity\":0.4}",
          "inputText": "imagePath=db://assets/ui/mockup.png；opacity=0.4",
          "executionStep": "调用 reference_image.add",
          "parameterNarrative": "这次请把 imagePath 设为“db://assets/ui/mockup.png”，把 opacity 设为 0.4。",
          "verificationFocus": "添加参考图节点",
          "expectedText": "添加参考图节点"
        },
        "naturalLanguageTest": "请通过 MCP 调用 reference_image 工具，执行 add 动作，处理“添加参考图”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 imagePath 设为“db://assets/ui/mockup.png”，把 opacity 设为 0.4。调用完成后重点检查：添加参考图节点。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 304,
      "tool": "reference_image",
      "action": "remove",
      "title": "移除参考图",
      "input": {
        "action": "remove",
        "refUuid": "<uuid>"
      },
      "expected": "删除指定参考图节点",
      "note": "",
      "phase": "UI 与参考图",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 reference_image 工具，执行 remove 动作，处理“移除参考图”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 refUuid 指向 <uuid>。调用完成后重点检查：删除指定参考图节点。",
          "actionGoal": "执行 reference_image.remove",
          "scenarioType": "参数场景",
          "scenarioTitle": "移除参考图",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "reference_image.remove",
          "fullPayload": "{\"action\":\"remove\",\"refUuid\":\"<uuid>\"}",
          "inputText": "refUuid=<uuid>",
          "executionStep": "调用 reference_image.remove",
          "parameterNarrative": "这次请将 refUuid 指向 <uuid>。",
          "verificationFocus": "删除指定参考图节点",
          "expectedText": "删除指定参考图节点"
        },
        "naturalLanguageTest": "请通过 MCP 调用 reference_image 工具，执行 remove 动作，处理“移除参考图”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 refUuid 指向 <uuid>。调用完成后重点检查：删除指定参考图节点。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 305,
      "tool": "reference_image",
      "action": "set_transform",
      "title": "调整位置",
      "input": {
        "action": "set_transform",
        "refUuid": "<uuid>",
        "x": 100,
        "y": -50,
        "scaleX": 0.8
      },
      "expected": "参考图移动+缩放",
      "note": "",
      "phase": "UI 与参考图",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 reference_image 工具，执行 set_transform 动作，处理“调整位置”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 refUuid 指向 <uuid>，把 x 设为 100，把 y 设为 -50，把 scaleX 设为 0.8。调用完成后重点检查：参考图移动+缩放。",
          "actionGoal": "执行 reference_image.set_transform",
          "scenarioType": "参数场景",
          "scenarioTitle": "调整位置",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "reference_image.set_transform",
          "fullPayload": "{\"action\":\"set_transform\",\"refUuid\":\"<uuid>\",\"x\":100,\"y\":-50,\"scaleX\":0.8}",
          "inputText": "refUuid=<uuid>；x=100；y=-50；scaleX=0.8",
          "executionStep": "调用 reference_image.set_transform",
          "parameterNarrative": "这次请将 refUuid 指向 <uuid>，把 x 设为 100，把 y 设为 -50，把 scaleX 设为 0.8。",
          "verificationFocus": "参考图移动+缩放",
          "expectedText": "参考图移动+缩放"
        },
        "naturalLanguageTest": "请通过 MCP 调用 reference_image 工具，执行 set_transform 动作，处理“调整位置”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 refUuid 指向 <uuid>，把 x 设为 100，把 y 设为 -50，把 scaleX 设为 0.8。调用完成后重点检查：参考图移动+缩放。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 306,
      "tool": "reference_image",
      "action": "set_opacity",
      "title": "调透明度",
      "input": {
        "action": "set_opacity",
        "refUuid": "<uuid>",
        "opacity": 0.3
      },
      "expected": "透明度→30%",
      "note": "",
      "phase": "UI 与参考图",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 reference_image 工具，执行 set_opacity 动作，处理“调透明度”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 refUuid 指向 <uuid>，把 opacity 设为 0.3。调用完成后重点检查：透明度→30%。",
          "actionGoal": "执行 reference_image.set_opacity",
          "scenarioType": "参数场景",
          "scenarioTitle": "调透明度",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "reference_image.set_opacity",
          "fullPayload": "{\"action\":\"set_opacity\",\"refUuid\":\"<uuid>\",\"opacity\":0.3}",
          "inputText": "refUuid=<uuid>；opacity=0.3",
          "executionStep": "调用 reference_image.set_opacity",
          "parameterNarrative": "这次请将 refUuid 指向 <uuid>，把 opacity 设为 0.3。",
          "verificationFocus": "透明度→30%",
          "expectedText": "透明度→30%"
        },
        "naturalLanguageTest": "请通过 MCP 调用 reference_image 工具，执行 set_opacity 动作，处理“调透明度”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 refUuid 指向 <uuid>，把 opacity 设为 0.3。调用完成后重点检查：透明度→30%。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 307,
      "tool": "tool_management",
      "action": "list_all",
      "title": "列出工具",
      "input": {
        "action": "list_all"
      },
      "expected": "返回所有工具及启用状态",
      "note": "",
      "phase": "环境与连通",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage MCP tool availability. Enable/disable tools to reduce token consumption and AI confusion.",
        "zhToolSummary": "管理 MCP 工具可用性，通过启用或禁用工具来减少 token 消耗并降低 AI 误用概率。",
        "actionDescription": "no params. List all registered tools with enabled/disabled status and action counts.",
        "zhActionDescription": "无参数。列出所有已注册工具，以及启用/禁用状态和 action 数量。",
        "sourceFile": "src/mcp/tools-misc.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 tool_management 工具，执行 list_all 动作，处理“列出工具”这个状态场景。这个场景用于验证当前对象状态或默认状态下的表现。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回所有工具及启用状态。",
          "actionGoal": "列出所有已注册工具，以及启用/禁用状态和 action 数量",
          "scenarioType": "状态场景",
          "scenarioTitle": "列出工具",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于验证当前对象状态或默认状态下的表现。",
          "mcpCall": "tool_management.list_all",
          "fullPayload": "{\"action\":\"list_all\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 tool_management.list_all",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回所有工具及启用状态",
          "expectedText": "返回所有工具及启用状态"
        },
        "naturalLanguageTest": "请通过 MCP 调用 tool_management 工具，执行 list_all 动作，处理“列出工具”这个状态场景。这个场景用于验证当前对象状态或默认状态下的表现。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回所有工具及启用状态。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 308,
      "tool": "tool_management",
      "action": "enable",
      "title": "启用工具",
      "input": {
        "action": "enable",
        "toolName": "physics_tool"
      },
      "expected": "physics_tool 重新启用",
      "note": "",
      "phase": "环境与连通",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage MCP tool availability. Enable/disable tools to reduce token consumption and AI confusion.",
        "zhToolSummary": "管理 MCP 工具可用性，通过启用或禁用工具来减少 token 消耗并降低 AI 误用概率。",
        "actionDescription": "toolName(REQUIRED). Enable a previously disabled tool.",
        "zhActionDescription": "toolName（必填）。启用一个此前被禁用的工具。",
        "sourceFile": "src/mcp/tools-misc.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 tool_management 工具，执行 enable 动作，处理“启用工具”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 toolName 设为“physics_tool”。调用完成后重点检查：physics_tool 重新启用。",
          "actionGoal": "启用一个此前被禁用的工具",
          "scenarioType": "参数场景",
          "scenarioTitle": "启用工具",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "tool_management.enable",
          "fullPayload": "{\"action\":\"enable\",\"toolName\":\"physics_tool\"}",
          "inputText": "toolName=physics_tool",
          "executionStep": "调用 tool_management.enable",
          "parameterNarrative": "这次请把 toolName 设为“physics_tool”。",
          "verificationFocus": "physics_tool 重新启用",
          "expectedText": "physics_tool 重新启用"
        },
        "naturalLanguageTest": "请通过 MCP 调用 tool_management 工具，执行 enable 动作，处理“启用工具”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 toolName 设为“physics_tool”。调用完成后重点检查：physics_tool 重新启用。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 309,
      "tool": "tool_management",
      "action": "disable",
      "title": "禁用工具",
      "input": {
        "action": "disable",
        "toolName": "physics_tool"
      },
      "expected": "physics_tool 被禁用，减少 Token 消耗",
      "note": "",
      "phase": "环境与连通",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage MCP tool availability. Enable/disable tools to reduce token consumption and AI confusion.",
        "zhToolSummary": "管理 MCP 工具可用性，通过启用或禁用工具来减少 token 消耗并降低 AI 误用概率。",
        "actionDescription": "toolName(REQUIRED). Disable a tool (it won't appear in tool listings).",
        "zhActionDescription": "toolName（必填）。禁用一个工具（禁用后不会出现在工具列表中）。",
        "sourceFile": "src/mcp/tools-misc.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 tool_management 工具，执行 disable 动作，处理“禁用工具”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 toolName 设为“physics_tool”。调用完成后重点检查：physics_tool 被禁用，减少 Token 消耗。",
          "actionGoal": "禁用一个工具（禁用后不会出现在工具列表中）",
          "scenarioType": "参数场景",
          "scenarioTitle": "禁用工具",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "tool_management.disable",
          "fullPayload": "{\"action\":\"disable\",\"toolName\":\"physics_tool\"}",
          "inputText": "toolName=physics_tool",
          "executionStep": "调用 tool_management.disable",
          "parameterNarrative": "这次请把 toolName 设为“physics_tool”。",
          "verificationFocus": "physics_tool 被禁用，减少 Token 消耗",
          "expectedText": "physics_tool 被禁用，减少 Token 消耗"
        },
        "naturalLanguageTest": "请通过 MCP 调用 tool_management 工具，执行 disable 动作，处理“禁用工具”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 toolName 设为“physics_tool”。调用完成后重点检查：physics_tool 被禁用，减少 Token 消耗。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 310,
      "tool": "tool_management",
      "action": "get_stats",
      "title": "工具统计",
      "input": {
        "action": "get_stats"
      },
      "expected": "返回 {totalTools:19,enabledTools:19,totalActions:236}",
      "note": "",
      "phase": "环境与连通",
      "priority": "P2",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Manage MCP tool availability. Enable/disable tools to reduce token consumption and AI confusion.",
        "zhToolSummary": "管理 MCP 工具可用性，通过启用或禁用工具来减少 token 消耗并降低 AI 误用概率。",
        "actionDescription": "no params. Get overall tool statistics (total tools, total actions, enabled/disabled counts).",
        "zhActionDescription": "无参数。获取整体工具统计信息（工具总数、action 总数、启用/禁用数量）。",
        "sourceFile": "src/mcp/tools-misc.ts",
        "matched": true,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 tool_management 工具，执行 get_stats 动作，处理“工具统计”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {totalTools:19,enabledTools:19,totalActions:236}。",
          "actionGoal": "获取整体工具统计信息（工具总数、action 总数、启用/禁用数量）",
          "scenarioType": "通用场景",
          "scenarioTitle": "工具统计",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "tool_management.get_stats",
          "fullPayload": "{\"action\":\"get_stats\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 tool_management.get_stats",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回 {totalTools:19,enabledTools:19,totalActions:236}",
          "expectedText": "返回 {totalTools:19,enabledTools:19,totalActions:236}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 tool_management 工具，执行 get_stats 动作，处理“工具统计”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 {totalTools:19,enabledTools:19,totalActions:236}。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 311,
      "tool": "execute_script",
      "action": "execute_script",
      "title": "调用 dispatchQuery",
      "input": {
        "method": "dispatchQuery",
        "args": [
          {
            "action": "tree"
          }
        ]
      },
      "expected": "返回场景树",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P3",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Execute arbitrary scene-script methods in the Cocos Creator scene context. Use this as an ESCAPE HATCH when the other tools (scene_query, scene_operation, asset_operation, editor_action) do not cover your needs. The method runs inside the editor scene process with full access to the engine API (cc.*, nodes, components). Parameters: - method(REQUIRED): Name of the scene-script method to call. Common methods: \"dispatchQuery\", \"dispatchOperation\", \"createChildNode\", \"setNodePosition\". - args(optional): Array of arguments to pass to the method. Each element is a positional argument. WARNING: This tool has NO validation. Prefer using the specific tools (scene_query, scene_operation) when possible. Returns: The raw return value from the scene method, JSON-serialized. On error: {error:\"message\"}. Prerequisites: The method must be exposed by scene.ts (see listMethods for available methods). For dispatchQuery/dispatchOperation, args is [{action:\"...\", ...params}].",
        "zhToolSummary": "Execute arbitrary 场景-script methods in the Cocos Creator 场景 context。Use this as an ESCAPE HATCH when the other 工具s (场景_query, 场景_operation, 资源_operation, editor_action) do not cover your needs。The method runs inside the editor 场景 process with full access to the engine API (cc.*, 节点s, 组件)。Parameters: - method(REQUIRED): Name of the 场景-script method to call。Common methods: \"dispatchQuery\", \"dispatchOperation\", \"createChildNode\", \"setNodePosition\". - args(optional): Array of arguments to pass to the method。Each element is a positional argument。WARNING: This 工具 has NO validation。Prefer using the specific 工具s (场景_query, 场景_operation) when possible。Returns: The raw return value from the 场景 method, JSON-serialized。On error: {error:\"message\"}。Prerequisites: The method must be exposed by 场景.ts (see listMethods for available methods)。For dispatchQuery/dispatchOperation, args is [{action:\"...\", ...params}]。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-script.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 execute_script 工具，执行 execute_script 动作，处理“调用 dispatchQuery”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 method 设为“dispatchQuery”，传入 args=[{\"action\":\"tree\"}]。调用完成后重点检查：返回场景树。",
          "actionGoal": "Execute arbitrary 场景-script methods in the Cocos Creator 场景 context",
          "scenarioType": "参数场景",
          "scenarioTitle": "调用 dispatchQuery",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "execute_script.execute_script",
          "fullPayload": "{\"method\":\"dispatchQuery\",\"args\":[{\"action\":\"tree\"}]}",
          "inputText": "method=dispatchQuery；args=[{\"action\":\"tree\"}]",
          "executionStep": "调用 execute_script.execute_script",
          "parameterNarrative": "这次请把 method 设为“dispatchQuery”，传入 args=[{\"action\":\"tree\"}]。",
          "verificationFocus": "返回场景树",
          "expectedText": "返回场景树"
        },
        "naturalLanguageTest": "请通过 MCP 调用 execute_script 工具，执行 execute_script 动作，处理“调用 dispatchQuery”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 method 设为“dispatchQuery”，传入 args=[{\"action\":\"tree\"}]。调用完成后重点检查：返回场景树。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 312,
      "tool": "execute_script",
      "action": "execute_script",
      "title": "调用 setNodePosition",
      "input": {
        "method": "setNodePosition",
        "args": [
          "<uuid>",
          100,
          200,
          0
        ]
      },
      "expected": "节点位置被设置",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P3",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Execute arbitrary scene-script methods in the Cocos Creator scene context. Use this as an ESCAPE HATCH when the other tools (scene_query, scene_operation, asset_operation, editor_action) do not cover your needs. The method runs inside the editor scene process with full access to the engine API (cc.*, nodes, components). Parameters: - method(REQUIRED): Name of the scene-script method to call. Common methods: \"dispatchQuery\", \"dispatchOperation\", \"createChildNode\", \"setNodePosition\". - args(optional): Array of arguments to pass to the method. Each element is a positional argument. WARNING: This tool has NO validation. Prefer using the specific tools (scene_query, scene_operation) when possible. Returns: The raw return value from the scene method, JSON-serialized. On error: {error:\"message\"}. Prerequisites: The method must be exposed by scene.ts (see listMethods for available methods). For dispatchQuery/dispatchOperation, args is [{action:\"...\", ...params}].",
        "zhToolSummary": "Execute arbitrary 场景-script methods in the Cocos Creator 场景 context。Use this as an ESCAPE HATCH when the other 工具s (场景_query, 场景_operation, 资源_operation, editor_action) do not cover your needs。The method runs inside the editor 场景 process with full access to the engine API (cc.*, 节点s, 组件)。Parameters: - method(REQUIRED): Name of the 场景-script method to call。Common methods: \"dispatchQuery\", \"dispatchOperation\", \"createChildNode\", \"setNodePosition\". - args(optional): Array of arguments to pass to the method。Each element is a positional argument。WARNING: This 工具 has NO validation。Prefer using the specific 工具s (场景_query, 场景_operation) when possible。Returns: The raw return value from the 场景 method, JSON-serialized。On error: {error:\"message\"}。Prerequisites: The method must be exposed by 场景.ts (see listMethods for available methods)。For dispatchQuery/dispatchOperation, args is [{action:\"...\", ...params}]。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-script.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 execute_script 工具，执行 execute_script 动作，处理“调用 setNodePosition”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 method 设为“setNodePosition”，传入 args=[\"<uuid>\",100,200,0]。调用完成后重点检查：节点位置被设置。",
          "actionGoal": "Execute arbitrary 场景-script methods in the Cocos Creator 场景 context",
          "scenarioType": "参数场景",
          "scenarioTitle": "调用 setNodePosition",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "execute_script.execute_script",
          "fullPayload": "{\"method\":\"setNodePosition\",\"args\":[\"<uuid>\",100,200,0]}",
          "inputText": "method=setNodePosition；args=[\"<uuid>\",100,200,0]",
          "executionStep": "调用 execute_script.execute_script",
          "parameterNarrative": "这次请把 method 设为“setNodePosition”，传入 args=[\"<uuid>\",100,200,0]。",
          "verificationFocus": "节点位置被设置",
          "expectedText": "节点位置被设置"
        },
        "naturalLanguageTest": "请通过 MCP 调用 execute_script 工具，执行 execute_script 动作，处理“调用 setNodePosition”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 method 设为“setNodePosition”，传入 args=[\"<uuid>\",100,200,0]。调用完成后重点检查：节点位置被设置。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 313,
      "tool": "register_custom_macro",
      "action": "register_custom_macro",
      "title": "注册快捷宏",
      "input": {
        "name": "quick_sprite",
        "description": "快速创建 Sprite 节点",
        "sceneMethodName": "createChildNode"
      },
      "expected": "注册为 macro_quick_sprite 工具",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P3",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Register a named macro that chains existing scene methods. The macro calls a pre-defined scene method with given arguments. Arbitrary code execution is NOT allowed — only whitelisted scene methods can be used. Parameters: - name(REQUIRED): Unique tool name (alphanumeric & underscores only). The macro will be registered as \"macro_{name}\". - description(REQUIRED): Clear human-readable description of what the macro does. - sceneMethodName(REQUIRED): Name of an existing whitelisted scene method to call. Allowed methods:",
        "zhToolSummary": "Register a named macro that chains existing 场景 methods。The macro calls a pre-defined 场景 method with given arguments。Arbitrary code execution is NOT allowed — only whitelisted 场景 methods can be used。Parameters: - name(REQUIRED): Unique 工具 name (alphanumeric & underscores only)。The macro will be registered as \"macro_{name}\". - description(REQUIRED): Clear human-readable description of what the macro does. - 场景MethodName(REQUIRED): Name of an existing whitelisted 场景 method to call。Allowed methods:。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-script.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 register_custom_macro 工具，执行 register_custom_macro 动作，处理“注册快捷宏”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 name 设为“quick_sprite”，把 description 设为“快速创建 Sprite 节点”，把 sceneMethodName 设为“createChildNode”。调用完成后重点检查：注册为 macro_quick_sprite 工具。",
          "actionGoal": "Register a named macro that chains existing 场景 methods",
          "scenarioType": "参数场景",
          "scenarioTitle": "注册快捷宏",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "register_custom_macro.register_custom_macro",
          "fullPayload": "{\"name\":\"quick_sprite\",\"description\":\"快速创建 Sprite 节点\",\"sceneMethodName\":\"createChildNode\"}",
          "inputText": "name=quick_sprite；description=快速创建 Sprite 节点；sceneMethodName=createChildNode",
          "executionStep": "调用 register_custom_macro.register_custom_macro",
          "parameterNarrative": "这次请把 name 设为“quick_sprite”，把 description 设为“快速创建 Sprite 节点”，把 sceneMethodName 设为“createChildNode”。",
          "verificationFocus": "注册为 macro_quick_sprite 工具",
          "expectedText": "注册为 macro_quick_sprite 工具"
        },
        "naturalLanguageTest": "请通过 MCP 调用 register_custom_macro 工具，执行 register_custom_macro 动作，处理“注册快捷宏”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 name 设为“quick_sprite”，把 description 设为“快速创建 Sprite 节点”，把 sceneMethodName 设为“createChildNode”。调用完成后重点检查：注册为 macro_quick_sprite 工具。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 314,
      "tool": "register_custom_macro",
      "action": "register_custom_macro",
      "title": "非白名单方法",
      "input": {
        "name": "bad",
        "description": "test",
        "sceneMethodName": "eval"
      },
      "expected": "返回 {error:\"方法不在白名单\"}",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P3",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Register a named macro that chains existing scene methods. The macro calls a pre-defined scene method with given arguments. Arbitrary code execution is NOT allowed — only whitelisted scene methods can be used. Parameters: - name(REQUIRED): Unique tool name (alphanumeric & underscores only). The macro will be registered as \"macro_{name}\". - description(REQUIRED): Clear human-readable description of what the macro does. - sceneMethodName(REQUIRED): Name of an existing whitelisted scene method to call. Allowed methods:",
        "zhToolSummary": "Register a named macro that chains existing 场景 methods。The macro calls a pre-defined 场景 method with given arguments。Arbitrary code execution is NOT allowed — only whitelisted 场景 methods can be used。Parameters: - name(REQUIRED): Unique 工具 name (alphanumeric & underscores only)。The macro will be registered as \"macro_{name}\". - description(REQUIRED): Clear human-readable description of what the macro does. - 场景MethodName(REQUIRED): Name of an existing whitelisted 场景 method to call。Allowed methods:。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-script.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 register_custom_macro 工具，执行 register_custom_macro 动作，处理“非白名单方法”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 name 设为“bad”，把 description 设为“test”，把 sceneMethodName 设为“eval”。调用完成后重点检查：返回 {error:\"方法不在白名单\"}。",
          "actionGoal": "Register a named macro that chains existing 场景 methods",
          "scenarioType": "参数场景",
          "scenarioTitle": "非白名单方法",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "register_custom_macro.register_custom_macro",
          "fullPayload": "{\"name\":\"bad\",\"description\":\"test\",\"sceneMethodName\":\"eval\"}",
          "inputText": "name=bad；description=test；sceneMethodName=eval",
          "executionStep": "调用 register_custom_macro.register_custom_macro",
          "parameterNarrative": "这次请把 name 设为“bad”，把 description 设为“test”，把 sceneMethodName 设为“eval”。",
          "verificationFocus": "返回 {error:\"方法不在白名单\"}",
          "expectedText": "返回 {error:\"方法不在白名单\"}"
        },
        "naturalLanguageTest": "请通过 MCP 调用 register_custom_macro 工具，执行 register_custom_macro 动作，处理“非白名单方法”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 name 设为“bad”，把 description 设为“test”，把 sceneMethodName 设为“eval”。调用完成后重点检查：返回 {error:\"方法不在白名单\"}。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 315,
      "tool": "create_prefab_atomic",
      "action": "create_prefab_atomic",
      "title": "完整预制体",
      "input": {
        "prefabPath": "db://assets/prefabs/Enemy.prefab",
        "nodeName": "Enemy",
        "components": [
          {
            "type": "Sprite"
          },
          {
            "type": "BoxCollider2D",
            "properties": {
              "size": {
                "width": 64,
                "height": 64
              }
            }
          }
        ],
        "children": [
          {
            "name": "Label",
            "components": [
              {
                "type": "Label",
                "properties": {
                  "string": "HP: 100"
                }
              }
            ]
          }
        ]
      },
      "expected": "一步创建含 Sprite+碰撞器+子 Label 的预制体",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Atomically create a Cocos Creator prefab in ONE call with automatic rollback on failure. Pipeline: 1) ensure target directory exists, 2) create root node with components, 3) create child nodes with components, 4) set properties on all components, 5) save as .prefab asset, 6) refresh AssetDB, 7) cleanup temp node from scene. Use this INSTEAD of manually chaining scene_operation calls for prefab creation. On failure at any stage, all temporary nodes are automatically cleaned up (rolled back). Parameters: - prefabPath(REQUIRED): db:// path where the .prefab will be saved. Directories are auto-created. Path auto-normalized. - nodeName(optional): Root node name. Default: derived from prefabPath filename. - components(optional): Array of components to add to root node, each with type and optional properties. - children(optional): Array of child node definitions, each with name and optional components. - position(optional): Initial position {x, y, z} for the root node. - cleanupSourceNode(optional, default true): Remove temp node from scene after prefab creation. ASSET REFERENCES in components.properties: For spriteFrame/font/material properties, use {__uuid__:\"asset-uuid\"}. Get UUID via asset_operation action=url_to_uuid. Returns: {success, prefabPath, rootNodeUuid, stages:[\"create_root_node\",\"add_component:X\",\"create_prefab\",\"cleanup_temp_node\"], completedStages?, rollback?:[]}. On error: {success:false, error, stage, rollback}. Auto-rollback: If prefab creation fails, the temp node is automatically destroyed. Set cleanupSourceNode=false to keep it for debugging.",
        "zhToolSummary": "Atomically create a Cocos Creator prefab in ONE call with automatic rollback on failure。Pipeline: 1) ensure target directory exists, 2) create root 节点 with 组件, 3) create child 节点s with 组件, 4) set properties on all 组件, 5) save as .prefab 资源, 6) refresh AssetDB, 7) cleanup temp 节点 from 场景。Use this INSTEAD of manually chaining 场景_operation calls for prefab creation。On failure at any stage, all temporary 节点s are automatically cleaned up (rolled back)。Parameters: - prefabPath(REQUIRED): db:// path where the .prefab will be saved。Directories are auto-created。Path auto-normalized. - 节点Name(optional): Root 节点 name。Default: derived from prefabPath filename. - 组件(optional): Array of 组件 to add to root 节点, each with type and optional properties. - children(optional): Array of child 节点 definitions, each with name and optional 组件. - position(optional): Initial position {x, y, z} for the root 节点. - cleanupSourceNode(optional, default true): Remove temp 节点 from 场景 after prefab creation。ASSET REFERENCES in 组件.properties: For spriteFrame/font/material properties, use {__uuid__:\"资源-uuid\"}。获取UUID via 资源_operation action=url_to_uuid。Returns: {success, prefabPath, rootNodeUuid, stages:[\"create_root_节点\",\"add_组件:X\",\"create_prefab\",\"cleanup_temp_节点\"], completedStages?, rollback?:[]}。On error: {success:false, error, stage, rollback}。Auto-rollback: If prefab creation fails, the temp 节点 is automatically destroyed。Set cleanupSourceNode=false to keep it for debugging。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-atomic-prefab.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 create_prefab_atomic 工具，执行 create_prefab_atomic 动作，处理“完整预制体”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 prefabPath 设为“db://assets/prefabs/Enemy.prefab”，把 nodeName 设为“Enemy”，传入 components=[{\"type\":\"Sprite\"},{\"type\":\"BoxCollider2D\",\"properties\":{\"size\":{\"width\":64,\"height\":64}}}]，传入 children=[{\"name\":\"Label\",\"components\":[{\"type\":\"Label\",\"properties\":{\"string\":\"HP: 100\"}}]}]。调用完成后重点检查：一步创建含 Sprite+碰撞器+子 Label 的预制体。",
          "actionGoal": "Atomically create a Cocos Creator prefab in ONE call with automatic rollback on failure",
          "scenarioType": "参数场景",
          "scenarioTitle": "完整预制体",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "create_prefab_atomic.create_prefab_atomic",
          "fullPayload": "{\"prefabPath\":\"db://assets/prefabs/Enemy.prefab\",\"nodeName\":\"Enemy\",\"components\":[{\"type\":\"Sprite\"},{\"type\":\"BoxCollider2D\",\"properties\":{\"size\":{\"width\":64,\"height\":64}}}],\"children\":[{\"name\":\"Label\",\"components\":[{\"type\":\"Label\",\"properties\":{\"string\":\"HP: 100\"}}]}]}",
          "inputText": "prefabPath=db://assets/prefabs/Enemy.prefab；nodeName=Enemy；components=[{\"type\":\"Sprite\"},{\"type\":\"BoxCollider2D\",\"properties\":{\"size\":{\"width\":64,\"height\":64}}}]；children=[{\"name\":\"Label\",\"components\":[{\"type\":\"Label\",\"properties\":{\"string\":\"HP: 100\"}}]}]",
          "executionStep": "调用 create_prefab_atomic.create_prefab_atomic",
          "parameterNarrative": "这次请把 prefabPath 设为“db://assets/prefabs/Enemy.prefab”，把 nodeName 设为“Enemy”，传入 components=[{\"type\":\"Sprite\"},{\"type\":\"BoxCollider2D\",\"properties\":{\"size\":{\"width\":64,\"height\":64}}}]，传入 children=[{\"name\":\"Label\",\"components\":[{\"type\":\"Label\",\"properties\":{\"string\":\"HP: 100\"}}]}]。",
          "verificationFocus": "一步创建含 Sprite+碰撞器+子 Label 的预制体",
          "expectedText": "一步创建含 Sprite+碰撞器+子 Label 的预制体"
        },
        "naturalLanguageTest": "请通过 MCP 调用 create_prefab_atomic 工具，执行 create_prefab_atomic 动作，处理“完整预制体”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 prefabPath 设为“db://assets/prefabs/Enemy.prefab”，把 nodeName 设为“Enemy”，传入 components=[{\"type\":\"Sprite\"},{\"type\":\"BoxCollider2D\",\"properties\":{\"size\":{\"width\":64,\"height\":64}}}]，传入 children=[{\"name\":\"Label\",\"components\":[{\"type\":\"Label\",\"properties\":{\"string\":\"HP: 100\"}}]}]。调用完成后重点检查：一步创建含 Sprite+碰撞器+子 Label 的预制体。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 316,
      "tool": "create_prefab_atomic",
      "action": "create_prefab_atomic",
      "title": "失败回滚",
      "input": {
        "prefabPath": "db://invalid/path.prefab"
      },
      "expected": "创建失败，临时节点自动清理",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Atomically create a Cocos Creator prefab in ONE call with automatic rollback on failure. Pipeline: 1) ensure target directory exists, 2) create root node with components, 3) create child nodes with components, 4) set properties on all components, 5) save as .prefab asset, 6) refresh AssetDB, 7) cleanup temp node from scene. Use this INSTEAD of manually chaining scene_operation calls for prefab creation. On failure at any stage, all temporary nodes are automatically cleaned up (rolled back). Parameters: - prefabPath(REQUIRED): db:// path where the .prefab will be saved. Directories are auto-created. Path auto-normalized. - nodeName(optional): Root node name. Default: derived from prefabPath filename. - components(optional): Array of components to add to root node, each with type and optional properties. - children(optional): Array of child node definitions, each with name and optional components. - position(optional): Initial position {x, y, z} for the root node. - cleanupSourceNode(optional, default true): Remove temp node from scene after prefab creation. ASSET REFERENCES in components.properties: For spriteFrame/font/material properties, use {__uuid__:\"asset-uuid\"}. Get UUID via asset_operation action=url_to_uuid. Returns: {success, prefabPath, rootNodeUuid, stages:[\"create_root_node\",\"add_component:X\",\"create_prefab\",\"cleanup_temp_node\"], completedStages?, rollback?:[]}. On error: {success:false, error, stage, rollback}. Auto-rollback: If prefab creation fails, the temp node is automatically destroyed. Set cleanupSourceNode=false to keep it for debugging.",
        "zhToolSummary": "Atomically create a Cocos Creator prefab in ONE call with automatic rollback on failure。Pipeline: 1) ensure target directory exists, 2) create root 节点 with 组件, 3) create child 节点s with 组件, 4) set properties on all 组件, 5) save as .prefab 资源, 6) refresh AssetDB, 7) cleanup temp 节点 from 场景。Use this INSTEAD of manually chaining 场景_operation calls for prefab creation。On failure at any stage, all temporary 节点s are automatically cleaned up (rolled back)。Parameters: - prefabPath(REQUIRED): db:// path where the .prefab will be saved。Directories are auto-created。Path auto-normalized. - 节点Name(optional): Root 节点 name。Default: derived from prefabPath filename. - 组件(optional): Array of 组件 to add to root 节点, each with type and optional properties. - children(optional): Array of child 节点 definitions, each with name and optional 组件. - position(optional): Initial position {x, y, z} for the root 节点. - cleanupSourceNode(optional, default true): Remove temp 节点 from 场景 after prefab creation。ASSET REFERENCES in 组件.properties: For spriteFrame/font/material properties, use {__uuid__:\"资源-uuid\"}。获取UUID via 资源_operation action=url_to_uuid。Returns: {success, prefabPath, rootNodeUuid, stages:[\"create_root_节点\",\"add_组件:X\",\"create_prefab\",\"cleanup_temp_节点\"], completedStages?, rollback?:[]}。On error: {success:false, error, stage, rollback}。Auto-rollback: If prefab creation fails, the temp 节点 is automatically destroyed。Set cleanupSourceNode=false to keep it for debugging。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-atomic-prefab.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 create_prefab_atomic 工具，执行 create_prefab_atomic 动作，处理“失败回滚”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 prefabPath 设为“db://invalid/path.prefab”。调用完成后重点检查：创建失败，临时节点自动清理。",
          "actionGoal": "Atomically create a Cocos Creator prefab in ONE call with automatic rollback on failure",
          "scenarioType": "参数场景",
          "scenarioTitle": "失败回滚",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "create_prefab_atomic.create_prefab_atomic",
          "fullPayload": "{\"prefabPath\":\"db://invalid/path.prefab\"}",
          "inputText": "prefabPath=db://invalid/path.prefab",
          "executionStep": "调用 create_prefab_atomic.create_prefab_atomic",
          "parameterNarrative": "这次请把 prefabPath 设为“db://invalid/path.prefab”。",
          "verificationFocus": "创建失败，临时节点自动清理",
          "expectedText": "创建失败，临时节点自动清理"
        },
        "naturalLanguageTest": "请通过 MCP 调用 create_prefab_atomic 工具，执行 create_prefab_atomic 动作，处理“失败回滚”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 prefabPath 设为“db://invalid/path.prefab”。调用完成后重点检查：创建失败，临时节点自动清理。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 317,
      "tool": "import_and_apply_texture",
      "action": "import_and_apply_texture",
      "title": "导入+应用",
      "input": {
        "sourcePath": "C:/art/hero.png",
        "nodeUuid": "<sprite-node>"
      },
      "expected": "图片导入→SpriteFrame 设置→Sprite 显示新图片",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Atomic macro: import an external image file into AssetDB AND apply it to a node's Sprite component in ONE call. IMPORTANT: If the scene has no Canvas (e.g. a 3D-only scene), call scene_operation action=ensure_2d_canvas FIRST to create the 2D rendering environment, then create a child node under the returned canvasUuid with layer=33554432 (UI_2D). Pipeline: 1) resolve target node (from nodeUuid or current selection), 2) import image to AssetDB, 3) auto-set meta type to sprite-frame, 4) ensure UITransform + Sprite exist, 5) resolve SpriteFrame UUID, 6) set spriteFrame property, 7) refresh & highlight. Parameters: - sourcePath(REQUIRED): Absolute OS file path of the image to import. - targetUrl(optional): db:// destination path. Default: \"db://assets/textures/{filename}\". - nodeUuid(optional): Target node UUID. If omitted, uses current editor selection. - autoAddSprite(optional, default true): Automatically add Sprite component if target node doesn't have one. - refreshAssetDb(optional, default true): Refresh AssetDB after import. Auto-behavior: This tool automatically sets the image meta type to \"sprite-frame\" and reimports, ensuring a SpriteFrame sub-asset is generated. It then applies the SpriteFrame to the Sprite component via Editor IPC. Returns: {success, nodeUuid, targetUrl, stages:[\"validate_input\",\"import_texture\",\"ensure_sprite_frame_type\",\"ensure_ui_transform\",\"ensure_sprite_component\",\"resolve_sprite_frame_uuid\",\"apply_sprite_frame\",\"refresh_asset_db\",\"highlight\"], importResult:{uuid,subAssets}}. On error: {success:false, error:\"message\", stages}. Prerequisites: Target node must exist. In 3D scenes, call scene_operation action=ensure_2d_canvas first, create a child node under canvasUuid with layer=33554432, then pass that node's UUID. Common errors: \"未选中节点\"=no nodeUuid and nothing selected; sourcePath file not found; SpriteFrame UUID resolution may retry up to 5 times.",
        "zhToolSummary": "Atomic macro: import an external image file into AssetDB AND apply it to a 节点's Sprite 组件 in ONE call。IMPORTANT: If the 场景 has no Canvas (e.g. a 3D-only 场景), call 场景_operation action=ensure_2d_canvas FIRST to create the 2D rendering environment, then create a child 节点 under the returned canvasUuid with layer=33554432 (UI_2D)。Pipeline: 1) resolve target 节点 (from 节点Uuid or current selection), 2) import image to AssetDB, 3) auto-set meta type to sprite-frame, 4) ensure UITransform + Sprite exist, 5) resolve SpriteFrame UUID, 6) set spriteFrame 属性, 7) refresh & highlight。Parameters: - sourcePath(REQUIRED): Absolute OS file path of the image to import. - targetUrl(optional): db:// destination path。Default: \"db://资源s/textures/{filename}\". - 节点Uuid(optional): Target 节点 UUID。如果省略参数, uses current editor selection. - autoAddSprite(optional, default true): Automatically add Sprite 组件 if target 节点 doesn't have one. - refreshAssetDb(optional, default true): Refresh AssetDB after import。Auto-behavior: This 工具 automatically sets the image meta type to \"sprite-frame\" and reimports, ensuring a SpriteFrame sub-资源 is generated。It then applies the SpriteFrame to the Sprite 组件 via Editor IPC。Returns: {success, 节点Uuid, targetUrl, stages:[\"validate_input\",\"import_texture\",\"ensure_sprite_frame_type\",\"ensure_ui_transform\",\"ensure_sprite_组件\",\"resolve_sprite_frame_uuid\",\"apply_sprite_frame\",\"refresh_资源_db\",\"highlight\"], importResult:{uuid,subAssets}}。On error: {success:false, error:\"message\", stages}。Prerequisites: Target 节点 must exist。In 3D 场景s, call 场景_operation action=ensure_2d_canvas first, create a child 节点 under canvasUuid with layer=33554432, then pass that 节点's UUID。Common errors: \"未选中节点\"=no 节点Uuid and nothing selected; sourcePath file not found; SpriteFrame UUID resolution may retry up to 5 times。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-atomic-texture.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 import_and_apply_texture 工具，执行 import_and_apply_texture 动作，处理“导入+应用”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 sourcePath 设为“C:/art/hero.png”，将 nodeUuid 指向 <sprite-node>。调用完成后重点检查：图片导入→SpriteFrame 设置→Sprite 显示新图片。",
          "actionGoal": "Atomic macro: import an external image file into AssetDB AND apply it to a 节点's Sprite 组件 in ONE call",
          "scenarioType": "参数场景",
          "scenarioTitle": "导入+应用",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "import_and_apply_texture.import_and_apply_texture",
          "fullPayload": "{\"sourcePath\":\"C:/art/hero.png\",\"nodeUuid\":\"<sprite-node>\"}",
          "inputText": "sourcePath=C:/art/hero.png；nodeUuid=<sprite-node>",
          "executionStep": "调用 import_and_apply_texture.import_and_apply_texture",
          "parameterNarrative": "这次请把 sourcePath 设为“C:/art/hero.png”，将 nodeUuid 指向 <sprite-node>。",
          "verificationFocus": "图片导入→SpriteFrame 设置→Sprite 显示新图片",
          "expectedText": "图片导入→SpriteFrame 设置→Sprite 显示新图片"
        },
        "naturalLanguageTest": "请通过 MCP 调用 import_and_apply_texture 工具，执行 import_and_apply_texture 动作，处理“导入+应用”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 sourcePath 设为“C:/art/hero.png”，将 nodeUuid 指向 <sprite-node>。调用完成后重点检查：图片导入→SpriteFrame 设置→Sprite 显示新图片。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 318,
      "tool": "import_and_apply_texture",
      "action": "import_and_apply_texture",
      "title": "自动添加 Sprite",
      "input": {
        "sourcePath": "C:/art/bg.jpg",
        "nodeUuid": "<empty-node>",
        "autoAddSprite": true
      },
      "expected": "自动添加 Sprite 组件+设置纹理",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Atomic macro: import an external image file into AssetDB AND apply it to a node's Sprite component in ONE call. IMPORTANT: If the scene has no Canvas (e.g. a 3D-only scene), call scene_operation action=ensure_2d_canvas FIRST to create the 2D rendering environment, then create a child node under the returned canvasUuid with layer=33554432 (UI_2D). Pipeline: 1) resolve target node (from nodeUuid or current selection), 2) import image to AssetDB, 3) auto-set meta type to sprite-frame, 4) ensure UITransform + Sprite exist, 5) resolve SpriteFrame UUID, 6) set spriteFrame property, 7) refresh & highlight. Parameters: - sourcePath(REQUIRED): Absolute OS file path of the image to import. - targetUrl(optional): db:// destination path. Default: \"db://assets/textures/{filename}\". - nodeUuid(optional): Target node UUID. If omitted, uses current editor selection. - autoAddSprite(optional, default true): Automatically add Sprite component if target node doesn't have one. - refreshAssetDb(optional, default true): Refresh AssetDB after import. Auto-behavior: This tool automatically sets the image meta type to \"sprite-frame\" and reimports, ensuring a SpriteFrame sub-asset is generated. It then applies the SpriteFrame to the Sprite component via Editor IPC. Returns: {success, nodeUuid, targetUrl, stages:[\"validate_input\",\"import_texture\",\"ensure_sprite_frame_type\",\"ensure_ui_transform\",\"ensure_sprite_component\",\"resolve_sprite_frame_uuid\",\"apply_sprite_frame\",\"refresh_asset_db\",\"highlight\"], importResult:{uuid,subAssets}}. On error: {success:false, error:\"message\", stages}. Prerequisites: Target node must exist. In 3D scenes, call scene_operation action=ensure_2d_canvas first, create a child node under canvasUuid with layer=33554432, then pass that node's UUID. Common errors: \"未选中节点\"=no nodeUuid and nothing selected; sourcePath file not found; SpriteFrame UUID resolution may retry up to 5 times.",
        "zhToolSummary": "Atomic macro: import an external image file into AssetDB AND apply it to a 节点's Sprite 组件 in ONE call。IMPORTANT: If the 场景 has no Canvas (e.g. a 3D-only 场景), call 场景_operation action=ensure_2d_canvas FIRST to create the 2D rendering environment, then create a child 节点 under the returned canvasUuid with layer=33554432 (UI_2D)。Pipeline: 1) resolve target 节点 (from 节点Uuid or current selection), 2) import image to AssetDB, 3) auto-set meta type to sprite-frame, 4) ensure UITransform + Sprite exist, 5) resolve SpriteFrame UUID, 6) set spriteFrame 属性, 7) refresh & highlight。Parameters: - sourcePath(REQUIRED): Absolute OS file path of the image to import. - targetUrl(optional): db:// destination path。Default: \"db://资源s/textures/{filename}\". - 节点Uuid(optional): Target 节点 UUID。如果省略参数, uses current editor selection. - autoAddSprite(optional, default true): Automatically add Sprite 组件 if target 节点 doesn't have one. - refreshAssetDb(optional, default true): Refresh AssetDB after import。Auto-behavior: This 工具 automatically sets the image meta type to \"sprite-frame\" and reimports, ensuring a SpriteFrame sub-资源 is generated。It then applies the SpriteFrame to the Sprite 组件 via Editor IPC。Returns: {success, 节点Uuid, targetUrl, stages:[\"validate_input\",\"import_texture\",\"ensure_sprite_frame_type\",\"ensure_ui_transform\",\"ensure_sprite_组件\",\"resolve_sprite_frame_uuid\",\"apply_sprite_frame\",\"refresh_资源_db\",\"highlight\"], importResult:{uuid,subAssets}}。On error: {success:false, error:\"message\", stages}。Prerequisites: Target 节点 must exist。In 3D 场景s, call 场景_operation action=ensure_2d_canvas first, create a child 节点 under canvasUuid with layer=33554432, then pass that 节点's UUID。Common errors: \"未选中节点\"=no 节点Uuid and nothing selected; sourcePath file not found; SpriteFrame UUID resolution may retry up to 5 times。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-atomic-texture.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 import_and_apply_texture 工具，执行 import_and_apply_texture 动作，处理“自动添加 Sprite”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 sourcePath 设为“C:/art/bg.jpg”，将 nodeUuid 指向 <empty-node>，把 autoAddSprite 设为 true。调用完成后重点检查：自动添加 Sprite 组件+设置纹理。",
          "actionGoal": "Atomic macro: import an external image file into AssetDB AND apply it to a 节点's Sprite 组件 in ONE call",
          "scenarioType": "参数场景",
          "scenarioTitle": "自动添加 Sprite",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "import_and_apply_texture.import_and_apply_texture",
          "fullPayload": "{\"sourcePath\":\"C:/art/bg.jpg\",\"nodeUuid\":\"<empty-node>\",\"autoAddSprite\":true}",
          "inputText": "sourcePath=C:/art/bg.jpg；nodeUuid=<empty-node>；autoAddSprite=true",
          "executionStep": "调用 import_and_apply_texture.import_and_apply_texture",
          "parameterNarrative": "这次请把 sourcePath 设为“C:/art/bg.jpg”，将 nodeUuid 指向 <empty-node>，把 autoAddSprite 设为 true。",
          "verificationFocus": "自动添加 Sprite 组件+设置纹理",
          "expectedText": "自动添加 Sprite 组件+设置纹理"
        },
        "naturalLanguageTest": "请通过 MCP 调用 import_and_apply_texture 工具，执行 import_and_apply_texture 动作，处理“自动添加 Sprite”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 sourcePath 设为“C:/art/bg.jpg”，将 nodeUuid 指向 <empty-node>，把 autoAddSprite 设为 true。调用完成后重点检查：自动添加 Sprite 组件+设置纹理。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 321,
      "tool": "create_tween_animation_atomic",
      "action": "create_tween_animation_atomic",
      "title": "淡入动画",
      "input": {
        "nodeUuid": "<uuid>",
        "clipName": "fadeIn",
        "duration": 0.5,
        "tracks": [
          {
            "component": "cc.UIOpacity",
            "property": "opacity",
            "keyframes": [
              {
                "time": 0,
                "value": 0
              },
              {
                "time": 0.5,
                "value": 255,
                "easing": "quadOut"
              }
            ]
          }
        ]
      },
      "expected": "创建 0.5 秒透明度从 0 到 255 的淡入动画",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Atomic macro: create an AnimationClip with keyframe tracks and attach it to a target node in ONE call. Pipeline: 1) validate target node, 2) create AnimationClip with tracks via scene script, 3) attach Animation component if needed, 4) best-effort save as .anim asset to AssetDB, 5) refresh & highlight. Supports multiple property tracks (position, scale, rotation, opacity, custom component properties). If nodeUuid is omitted, uses current editor selection. Parameters: - nodeUuid(optional): Target node UUID. If omitted, uses current selection. - clipName(optional): Animation clip name. Default: derived from savePath filename. - duration(optional, default 1.0): Total clip duration in seconds. - wrapMode(optional, default \"Normal\"): Playback mode. - speed(optional, default 1.0): Playback speed multiplier. - sample(optional, default 60): Sampling rate in frames per second. - tracks(REQUIRED): Array of animation property tracks with keyframes. - savePath(optional): db:// path to save .anim file. If omitted, clip exists only in scene memory. - autoPlay(optional, default false): Start playing the animation immediately after creation. tracks format: [{property:\"position\", keyframes:[{time:0, value:{x:0,y:0,z:0}}, {time:1, value:{x:100,y:0,z:0}}]}]. Supported properties: position, scale, rotation, opacity, color, eulerAngles. Returns: {success, nodeUuid, clipDuration, trackCount, keyframeTimesCount, wrapMode, speed, attach:{attached}, savedAsset?, stages:[\"validate_node\",\"create_clip\",\"highlight\"]}. On error: {success:false, error}. Prerequisites: Node must exist. If nodeUuid omitted, uses current selection. tracks array must have at least one track with keyframes.",
        "zhToolSummary": "Atomic macro: create an AnimationClip with keyframe tracks and attach it to a target 节点 in ONE call。Pipeline: 1) validate target 节点, 2) create AnimationClip with tracks via 场景 script, 3) attach Animation 组件 if needed, 4) best-effort save as .anim 资源 to AssetDB, 5) refresh & highlight。Supports multiple 属性 tracks (position, scale, rotation, opacity, custom 组件 properties)。If 节点Uuid is omitted, uses current editor selection。Parameters: - 节点Uuid(optional): Target 节点 UUID。如果省略参数, uses current selection. - clipName(optional): Animation clip name。Default: derived from savePath filename. - duration(optional, default 1.0): Total clip duration in seconds. - wrapMode(optional, default \"Normal\"): Playback mode. - speed(optional, default 1.0): Playback speed multiplier. - sample(optional, default 60): Sampling rate in frames per second. - tracks(REQUIRED): Array of 动画 属性 tracks with keyframes. - savePath(optional): db:// path to save .anim file。如果省略参数, clip exists only in 场景 memory. - autoPlay(optional, default false): Start playing the 动画 immediately after creation. tracks format: [{属性:\"position\", keyframes:[{time:0, value:{x:0,y:0,z:0}}, {time:1, value:{x:100,y:0,z:0}}]}]。Supported properties: position, scale, rotation, opacity, color, eulerAngles。Returns: {success, 节点Uuid, clipDuration, trackCount, keyframeTimesCount, wrapMode, speed, attach:{attached}, savedAsset?, stages:[\"validate_节点\",\"create_clip\",\"highlight\"]}。On error: {success:false, error}。Prerequisites: Node must exist。If 节点Uuid omitted, uses current selection. tracks array must have at least one track with keyframes。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-atomic-animation.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 create_tween_animation_atomic 工具，执行 create_tween_animation_atomic 动作，处理“淡入动画”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 nodeUuid 指向 <uuid>，把 clipName 设为“fadeIn”，把 duration 设为 0.5，传入 tracks=[{\"component\":\"cc.UIOpacity\",\"property\":\"opacity\",\"keyframes\":[{\"time\":0,\"value\":0},{\"time\":0.5,\"value\":255,\"easing\":\"quadOut\"}]}]。调用完成后重点检查：创建 0.5 秒透明度从 0 到 255 的淡入动画。",
          "actionGoal": "Atomic macro: create an AnimationClip with keyframe tracks and attach it to a target 节点 in ONE call",
          "scenarioType": "参数场景",
          "scenarioTitle": "淡入动画",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "create_tween_animation_atomic.create_tween_animation_atomic",
          "fullPayload": "{\"nodeUuid\":\"<uuid>\",\"clipName\":\"fadeIn\",\"duration\":0.5,\"tracks\":[{\"component\":\"cc.UIOpacity\",\"property\":\"opacity\",\"keyframes\":[{\"time\":0,\"value\":0},{\"time\":0.5,\"value\":255,\"easing\":\"quadOut\"}]}]}",
          "inputText": "nodeUuid=<uuid>；clipName=fadeIn；duration=0.5；tracks=[{\"component\":\"cc.UIOpacity\",\"property\":\"opacity\",\"keyframes\":[{\"time\":0,\"value\":0},{\"time\":0.5,\"value\":255,\"easing\":\"quadOut\"}]}]",
          "executionStep": "调用 create_tween_animation_atomic.create_tween_animation_atomic",
          "parameterNarrative": "这次请将 nodeUuid 指向 <uuid>，把 clipName 设为“fadeIn”，把 duration 设为 0.5，传入 tracks=[{\"component\":\"cc.UIOpacity\",\"property\":\"opacity\",\"keyframes\":[{\"time\":0,\"value\":0},{\"time\":0.5,\"value\":255,\"easing\":\"quadOut\"}]}]。",
          "verificationFocus": "创建 0.5 秒透明度从 0 到 255 的淡入动画",
          "expectedText": "创建 0.5 秒透明度从 0 到 255 的淡入动画"
        },
        "naturalLanguageTest": "请通过 MCP 调用 create_tween_animation_atomic 工具，执行 create_tween_animation_atomic 动作，处理“淡入动画”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 nodeUuid 指向 <uuid>，把 clipName 设为“fadeIn”，把 duration 设为 0.5，传入 tracks=[{\"component\":\"cc.UIOpacity\",\"property\":\"opacity\",\"keyframes\":[{\"time\":0,\"value\":0},{\"time\":0.5,\"value\":255,\"easing\":\"quadOut\"}]}]。调用完成后重点检查：创建 0.5 秒透明度从 0 到 255 的淡入动画。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 322,
      "tool": "create_tween_animation_atomic",
      "action": "create_tween_animation_atomic",
      "title": "位移+旋转",
      "input": {
        "nodeUuid": "<uuid>",
        "clipName": "move",
        "duration": 2,
        "wrapMode": "Loop",
        "tracks": [
          {
            "property": "position",
            "keyframes": [
              {
                "time": 0,
                "value": {
                  "x": 0,
                  "y": 0,
                  "z": 0
                }
              },
              {
                "time": 2,
                "value": {
                  "x": 200,
                  "y": 0,
                  "z": 0
                }
              }
            ]
          },
          {
            "property": "eulerAngles",
            "keyframes": [
              {
                "time": 0,
                "value": {
                  "x": 0,
                  "y": 0,
                  "z": 0
                }
              },
              {
                "time": 2,
                "value": {
                  "x": 0,
                  "y": 0,
                  "z": 360
                }
              }
            ]
          }
        ]
      },
      "expected": "创建边移动边旋转的循环动画",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Atomic macro: create an AnimationClip with keyframe tracks and attach it to a target node in ONE call. Pipeline: 1) validate target node, 2) create AnimationClip with tracks via scene script, 3) attach Animation component if needed, 4) best-effort save as .anim asset to AssetDB, 5) refresh & highlight. Supports multiple property tracks (position, scale, rotation, opacity, custom component properties). If nodeUuid is omitted, uses current editor selection. Parameters: - nodeUuid(optional): Target node UUID. If omitted, uses current selection. - clipName(optional): Animation clip name. Default: derived from savePath filename. - duration(optional, default 1.0): Total clip duration in seconds. - wrapMode(optional, default \"Normal\"): Playback mode. - speed(optional, default 1.0): Playback speed multiplier. - sample(optional, default 60): Sampling rate in frames per second. - tracks(REQUIRED): Array of animation property tracks with keyframes. - savePath(optional): db:// path to save .anim file. If omitted, clip exists only in scene memory. - autoPlay(optional, default false): Start playing the animation immediately after creation. tracks format: [{property:\"position\", keyframes:[{time:0, value:{x:0,y:0,z:0}}, {time:1, value:{x:100,y:0,z:0}}]}]. Supported properties: position, scale, rotation, opacity, color, eulerAngles. Returns: {success, nodeUuid, clipDuration, trackCount, keyframeTimesCount, wrapMode, speed, attach:{attached}, savedAsset?, stages:[\"validate_node\",\"create_clip\",\"highlight\"]}. On error: {success:false, error}. Prerequisites: Node must exist. If nodeUuid omitted, uses current selection. tracks array must have at least one track with keyframes.",
        "zhToolSummary": "Atomic macro: create an AnimationClip with keyframe tracks and attach it to a target 节点 in ONE call。Pipeline: 1) validate target 节点, 2) create AnimationClip with tracks via 场景 script, 3) attach Animation 组件 if needed, 4) best-effort save as .anim 资源 to AssetDB, 5) refresh & highlight。Supports multiple 属性 tracks (position, scale, rotation, opacity, custom 组件 properties)。If 节点Uuid is omitted, uses current editor selection。Parameters: - 节点Uuid(optional): Target 节点 UUID。如果省略参数, uses current selection. - clipName(optional): Animation clip name。Default: derived from savePath filename. - duration(optional, default 1.0): Total clip duration in seconds. - wrapMode(optional, default \"Normal\"): Playback mode. - speed(optional, default 1.0): Playback speed multiplier. - sample(optional, default 60): Sampling rate in frames per second. - tracks(REQUIRED): Array of 动画 属性 tracks with keyframes. - savePath(optional): db:// path to save .anim file。如果省略参数, clip exists only in 场景 memory. - autoPlay(optional, default false): Start playing the 动画 immediately after creation. tracks format: [{属性:\"position\", keyframes:[{time:0, value:{x:0,y:0,z:0}}, {time:1, value:{x:100,y:0,z:0}}]}]。Supported properties: position, scale, rotation, opacity, color, eulerAngles。Returns: {success, 节点Uuid, clipDuration, trackCount, keyframeTimesCount, wrapMode, speed, attach:{attached}, savedAsset?, stages:[\"validate_节点\",\"create_clip\",\"highlight\"]}。On error: {success:false, error}。Prerequisites: Node must exist。If 节点Uuid omitted, uses current selection. tracks array must have at least one track with keyframes。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-atomic-animation.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 create_tween_animation_atomic 工具，执行 create_tween_animation_atomic 动作，处理“位移+旋转”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 nodeUuid 指向 <uuid>，把 clipName 设为“move”，把 duration 设为 2，把 wrapMode 设为“Loop”，传入 tracks=[{\"property\":\"position\",\"keyframes\":[{\"time\":0,\"value\":{\"x\":0,\"y\":0,\"z\":0}},{\"time\":2,\"value\":{\"x\":200,\"y\":0,\"z\":0}}]},{\"property\":\"eulerAngles\",\"keyframes\":[{\"time\":0,\"value\":{\"x\":0,\"y\":0,\"z\":0}},{\"time\":2,\"value\":{\"x\":0,\"y\":0,\"z\":360}}]}]。调用完成后重点检查：创建边移动边旋转的循环动画。",
          "actionGoal": "Atomic macro: create an AnimationClip with keyframe tracks and attach it to a target 节点 in ONE call",
          "scenarioType": "参数场景",
          "scenarioTitle": "位移+旋转",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "create_tween_animation_atomic.create_tween_animation_atomic",
          "fullPayload": "{\"nodeUuid\":\"<uuid>\",\"clipName\":\"move\",\"duration\":2,\"wrapMode\":\"Loop\",\"tracks\":[{\"property\":\"position\",\"keyframes\":[{\"time\":0,\"value\":{\"x\":0,\"y\":0,\"z\":0}},{\"time\":2,\"value\":{\"x\":200,\"y\":0,\"z\":0}}]},{\"property\":\"eulerAngles\",\"keyframes\":[{\"time\":0,\"value\":{\"x\":0,\"y\":0,\"z\":0}},{\"time\":2,\"value\":{\"x\":0,\"y\":0,\"z\":360}}]}]}",
          "inputText": "nodeUuid=<uuid>；clipName=move；duration=2；wrapMode=Loop；tracks=[{\"property\":\"position\",\"keyframes\":[{\"time\":0,\"value\":{\"x\":0,\"y\":0,\"z\":0}},{\"time\":2,\"value\":{\"x\":200,\"y\":0,\"z\":0}}]},{\"property\":\"eulerAngles\",\"keyframes\":[{\"time\":0,\"value\":{\"x\":0,\"y\":0,\"z\":0}},{\"time\":2,\"value\":{\"x\":0,\"y\":0,\"z\":360}}]}]",
          "executionStep": "调用 create_tween_animation_atomic.create_tween_animation_atomic",
          "parameterNarrative": "这次请将 nodeUuid 指向 <uuid>，把 clipName 设为“move”，把 duration 设为 2，把 wrapMode 设为“Loop”，传入 tracks=[{\"property\":\"position\",\"keyframes\":[{\"time\":0,\"value\":{\"x\":0,\"y\":0,\"z\":0}},{\"time\":2,\"value\":{\"x\":200,\"y\":0,\"z\":0}}]},{\"property\":\"eulerAngles\",\"keyframes\":[{\"time\":0,\"value\":{\"x\":0,\"y\":0,\"z\":0}},{\"time\":2,\"value\":{\"x\":0,\"y\":0,\"z\":360}}]}]。",
          "verificationFocus": "创建边移动边旋转的循环动画",
          "expectedText": "创建边移动边旋转的循环动画"
        },
        "naturalLanguageTest": "请通过 MCP 调用 create_tween_animation_atomic 工具，执行 create_tween_animation_atomic 动作，处理“位移+旋转”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 nodeUuid 指向 <uuid>，把 clipName 设为“move”，把 duration 设为 2，把 wrapMode 设为“Loop”，传入 tracks=[{\"property\":\"position\",\"keyframes\":[{\"time\":0,\"value\":{\"x\":0,\"y\":0,\"z\":0}},{\"time\":2,\"value\":{\"x\":200,\"y\":0,\"z\":0}}]},{\"property\":\"eulerAngles\",\"keyframes\":[{\"time\":0,\"value\":{\"x\":0,\"y\":0,\"z\":0}},{\"time\":2,\"value\":{\"x\":0,\"y\":0,\"z\":360}}]}]。调用完成后重点检查：创建边移动边旋转的循环动画。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 323,
      "tool": "auto_fit_physics_collider",
      "action": "auto_fit_physics_collider",
      "title": "自动适配",
      "input": {
        "nodeUuid": "<sprite-node>"
      },
      "expected": "根据 Sprite Alpha 生成 PolygonCollider2D",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Atomic macro: automatically fit a 2D physics collider to a target node's Sprite/UITransform bounds in ONE call. Pipeline: 1) validate target node, 2) detect Sprite + UITransform components, 3) attempt alpha-outline extraction for PolygonCollider2D, 4) fallback to BoxCollider2D/CircleCollider2D from content size, 5) set physics properties, 6) highlight. If nodeUuid is omitted, uses current editor selection. Parameters: - nodeUuid(optional): Target node UUID. Uses current selection if omitted. - colliderType(optional, default \"auto\"): Collider shape to create. - alphaThreshold(optional, default 0.1): Alpha threshold for polygon outline extraction (0.0-1.0). - simplifyTolerance(optional, default 2.0): Polygon simplification tolerance in pixels. - maxVertices(optional, default 64): Maximum vertex count for polygon collider. - sensor(optional): If true, collider detects overlap but doesn't apply physics response. - friction(optional): Surface friction coefficient (0.0-1.0). - restitution(optional): Bounciness coefficient (0.0=no bounce, 1.0=full bounce). - density(optional): Physics material density. Prerequisites: Node must exist and ideally have a Sprite or UITransform for size detection. Without these, collider defaults to 100x100. Returns: {success, uuid, nodeName, colliderType:\"BoxCollider2D\"|\"PolygonCollider2D\", outlineMethod, size?:{width,height}, pointCount?, points?:[{x,y}], stages}. On error: {success:false, error}. colliderType: \"box\"(default)=BoxCollider2D, \"polygon\"=PolygonCollider2D (attempts alpha outline from Sprite texture).",
        "zhToolSummary": "Atomic macro: automatically fit a 2D physics collider to a target 节点's Sprite/UITransform bounds in ONE call。Pipeline: 1) validate target 节点, 2) detect Sprite + UITransform 组件, 3) attempt alpha-outline extraction for PolygonCollider2D, 4) fallback to BoxCollider2D/CircleCollider2D from content size, 5) set physics properties, 6) highlight。If 节点Uuid is omitted, uses current editor selection。Parameters: - 节点Uuid(optional): Target 节点 UUID。Uses current selection if omitted. - colliderType(optional, default \"auto\"): Collider shape to create. - alphaThreshold(optional, default 0.1): Alpha threshold for polygon outline extraction (0.0-1.0). - simplifyTolerance(optional, default 2.0): Polygon simplification tolerance in pixels. - maxVertices(optional, default 64): Maximum vertex count for polygon collider. - sensor(optional): If true, collider detects overlap but doesn't apply physics response. - friction(optional): Surface friction coefficient (0.0-1.0). - restitution(optional): Bounciness coefficient (0.0=no bounce, 1.0=full bounce). - density(optional): Physics material density。Prerequisites: Node must exist and ideally have a Sprite or UITransform for size detection。Without these, collider defaults to 100x100。Returns: {success, uuid, 节点Name, colliderType:\"BoxCollider2D\"|\"PolygonCollider2D\", outlineMethod, size?:{width,height}, pointCount?, points?:[{x,y}], stages}。On error: {success:false, error}. colliderType: \"box\"(default)=BoxCollider2D, \"polygon\"=PolygonCollider2D (attempts alpha outline from Sprite texture)。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-atomic-physics.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 auto_fit_physics_collider 工具，执行 auto_fit_physics_collider 动作，处理“自动适配”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 nodeUuid 指向 <sprite-node>。调用完成后重点检查：根据 Sprite Alpha 生成 PolygonCollider2D。",
          "actionGoal": "Atomic macro: automatically fit a 2D physics collider to a target 节点's Sprite/UITransform bounds in ONE call",
          "scenarioType": "参数场景",
          "scenarioTitle": "自动适配",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "auto_fit_physics_collider.auto_fit_physics_collider",
          "fullPayload": "{\"nodeUuid\":\"<sprite-node>\"}",
          "inputText": "nodeUuid=<sprite-node>",
          "executionStep": "调用 auto_fit_physics_collider.auto_fit_physics_collider",
          "parameterNarrative": "这次请将 nodeUuid 指向 <sprite-node>。",
          "verificationFocus": "根据 Sprite Alpha 生成 PolygonCollider2D",
          "expectedText": "根据 Sprite Alpha 生成 PolygonCollider2D"
        },
        "naturalLanguageTest": "请通过 MCP 调用 auto_fit_physics_collider 工具，执行 auto_fit_physics_collider 动作，处理“自动适配”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 nodeUuid 指向 <sprite-node>。调用完成后重点检查：根据 Sprite Alpha 生成 PolygonCollider2D。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 324,
      "tool": "auto_fit_physics_collider",
      "action": "auto_fit_physics_collider",
      "title": "指定 Box",
      "input": {
        "nodeUuid": "<uuid>",
        "colliderType": "box"
      },
      "expected": "根据 UITransform 尺寸创建 BoxCollider2D",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Atomic macro: automatically fit a 2D physics collider to a target node's Sprite/UITransform bounds in ONE call. Pipeline: 1) validate target node, 2) detect Sprite + UITransform components, 3) attempt alpha-outline extraction for PolygonCollider2D, 4) fallback to BoxCollider2D/CircleCollider2D from content size, 5) set physics properties, 6) highlight. If nodeUuid is omitted, uses current editor selection. Parameters: - nodeUuid(optional): Target node UUID. Uses current selection if omitted. - colliderType(optional, default \"auto\"): Collider shape to create. - alphaThreshold(optional, default 0.1): Alpha threshold for polygon outline extraction (0.0-1.0). - simplifyTolerance(optional, default 2.0): Polygon simplification tolerance in pixels. - maxVertices(optional, default 64): Maximum vertex count for polygon collider. - sensor(optional): If true, collider detects overlap but doesn't apply physics response. - friction(optional): Surface friction coefficient (0.0-1.0). - restitution(optional): Bounciness coefficient (0.0=no bounce, 1.0=full bounce). - density(optional): Physics material density. Prerequisites: Node must exist and ideally have a Sprite or UITransform for size detection. Without these, collider defaults to 100x100. Returns: {success, uuid, nodeName, colliderType:\"BoxCollider2D\"|\"PolygonCollider2D\", outlineMethod, size?:{width,height}, pointCount?, points?:[{x,y}], stages}. On error: {success:false, error}. colliderType: \"box\"(default)=BoxCollider2D, \"polygon\"=PolygonCollider2D (attempts alpha outline from Sprite texture).",
        "zhToolSummary": "Atomic macro: automatically fit a 2D physics collider to a target 节点's Sprite/UITransform bounds in ONE call。Pipeline: 1) validate target 节点, 2) detect Sprite + UITransform 组件, 3) attempt alpha-outline extraction for PolygonCollider2D, 4) fallback to BoxCollider2D/CircleCollider2D from content size, 5) set physics properties, 6) highlight。If 节点Uuid is omitted, uses current editor selection。Parameters: - 节点Uuid(optional): Target 节点 UUID。Uses current selection if omitted. - colliderType(optional, default \"auto\"): Collider shape to create. - alphaThreshold(optional, default 0.1): Alpha threshold for polygon outline extraction (0.0-1.0). - simplifyTolerance(optional, default 2.0): Polygon simplification tolerance in pixels. - maxVertices(optional, default 64): Maximum vertex count for polygon collider. - sensor(optional): If true, collider detects overlap but doesn't apply physics response. - friction(optional): Surface friction coefficient (0.0-1.0). - restitution(optional): Bounciness coefficient (0.0=no bounce, 1.0=full bounce). - density(optional): Physics material density。Prerequisites: Node must exist and ideally have a Sprite or UITransform for size detection。Without these, collider defaults to 100x100。Returns: {success, uuid, 节点Name, colliderType:\"BoxCollider2D\"|\"PolygonCollider2D\", outlineMethod, size?:{width,height}, pointCount?, points?:[{x,y}], stages}。On error: {success:false, error}. colliderType: \"box\"(default)=BoxCollider2D, \"polygon\"=PolygonCollider2D (attempts alpha outline from Sprite texture)。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-atomic-physics.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 auto_fit_physics_collider 工具，执行 auto_fit_physics_collider 动作，处理“指定 Box”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 nodeUuid 指向 <uuid>，把 colliderType 设为“box”。调用完成后重点检查：根据 UITransform 尺寸创建 BoxCollider2D。",
          "actionGoal": "Atomic macro: automatically fit a 2D physics collider to a target 节点's Sprite/UITransform bounds in ONE call",
          "scenarioType": "参数场景",
          "scenarioTitle": "指定 Box",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "auto_fit_physics_collider.auto_fit_physics_collider",
          "fullPayload": "{\"nodeUuid\":\"<uuid>\",\"colliderType\":\"box\"}",
          "inputText": "nodeUuid=<uuid>；colliderType=box",
          "executionStep": "调用 auto_fit_physics_collider.auto_fit_physics_collider",
          "parameterNarrative": "这次请将 nodeUuid 指向 <uuid>，把 colliderType 设为“box”。",
          "verificationFocus": "根据 UITransform 尺寸创建 BoxCollider2D",
          "expectedText": "根据 UITransform 尺寸创建 BoxCollider2D"
        },
        "naturalLanguageTest": "请通过 MCP 调用 auto_fit_physics_collider 工具，执行 auto_fit_physics_collider 动作，处理“指定 Box”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 nodeUuid 指向 <uuid>，把 colliderType 设为“box”。调用完成后重点检查：根据 UITransform 尺寸创建 BoxCollider2D。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 325,
      "tool": "auto_fit_physics_collider",
      "action": "auto_fit_physics_collider",
      "title": "指定 Circle",
      "input": {
        "nodeUuid": "<uuid>",
        "colliderType": "circle"
      },
      "expected": "创建 CircleCollider2D，radius=min(w,h)/2",
      "note": "",
      "phase": "核心改写",
      "priority": "P1",
      "edition": "community",
      "aiDoc": {
        "toolSummary": "Atomic macro: automatically fit a 2D physics collider to a target node's Sprite/UITransform bounds in ONE call. Pipeline: 1) validate target node, 2) detect Sprite + UITransform components, 3) attempt alpha-outline extraction for PolygonCollider2D, 4) fallback to BoxCollider2D/CircleCollider2D from content size, 5) set physics properties, 6) highlight. If nodeUuid is omitted, uses current editor selection. Parameters: - nodeUuid(optional): Target node UUID. Uses current selection if omitted. - colliderType(optional, default \"auto\"): Collider shape to create. - alphaThreshold(optional, default 0.1): Alpha threshold for polygon outline extraction (0.0-1.0). - simplifyTolerance(optional, default 2.0): Polygon simplification tolerance in pixels. - maxVertices(optional, default 64): Maximum vertex count for polygon collider. - sensor(optional): If true, collider detects overlap but doesn't apply physics response. - friction(optional): Surface friction coefficient (0.0-1.0). - restitution(optional): Bounciness coefficient (0.0=no bounce, 1.0=full bounce). - density(optional): Physics material density. Prerequisites: Node must exist and ideally have a Sprite or UITransform for size detection. Without these, collider defaults to 100x100. Returns: {success, uuid, nodeName, colliderType:\"BoxCollider2D\"|\"PolygonCollider2D\", outlineMethod, size?:{width,height}, pointCount?, points?:[{x,y}], stages}. On error: {success:false, error}. colliderType: \"box\"(default)=BoxCollider2D, \"polygon\"=PolygonCollider2D (attempts alpha outline from Sprite texture).",
        "zhToolSummary": "Atomic macro: automatically fit a 2D physics collider to a target 节点's Sprite/UITransform bounds in ONE call。Pipeline: 1) validate target 节点, 2) detect Sprite + UITransform 组件, 3) attempt alpha-outline extraction for PolygonCollider2D, 4) fallback to BoxCollider2D/CircleCollider2D from content size, 5) set physics properties, 6) highlight。If 节点Uuid is omitted, uses current editor selection。Parameters: - 节点Uuid(optional): Target 节点 UUID。Uses current selection if omitted. - colliderType(optional, default \"auto\"): Collider shape to create. - alphaThreshold(optional, default 0.1): Alpha threshold for polygon outline extraction (0.0-1.0). - simplifyTolerance(optional, default 2.0): Polygon simplification tolerance in pixels. - maxVertices(optional, default 64): Maximum vertex count for polygon collider. - sensor(optional): If true, collider detects overlap but doesn't apply physics response. - friction(optional): Surface friction coefficient (0.0-1.0). - restitution(optional): Bounciness coefficient (0.0=no bounce, 1.0=full bounce). - density(optional): Physics material density。Prerequisites: Node must exist and ideally have a Sprite or UITransform for size detection。Without these, collider defaults to 100x100。Returns: {success, uuid, 节点Name, colliderType:\"BoxCollider2D\"|\"PolygonCollider2D\", outlineMethod, size?:{width,height}, pointCount?, points?:[{x,y}], stages}。On error: {success:false, error}. colliderType: \"box\"(default)=BoxCollider2D, \"polygon\"=PolygonCollider2D (attempts alpha outline from Sprite texture)。",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "src/mcp/tools-atomic-physics.ts",
        "matched": false,
        "toolFound": true,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 auto_fit_physics_collider 工具，执行 auto_fit_physics_collider 动作，处理“指定 Circle”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 nodeUuid 指向 <uuid>，把 colliderType 设为“circle”。调用完成后重点检查：创建 CircleCollider2D，radius=min(w,h)/2。",
          "actionGoal": "Atomic macro: automatically fit a 2D physics collider to a target 节点's Sprite/UITransform bounds in ONE call",
          "scenarioType": "参数场景",
          "scenarioTitle": "指定 Circle",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "auto_fit_physics_collider.auto_fit_physics_collider",
          "fullPayload": "{\"nodeUuid\":\"<uuid>\",\"colliderType\":\"circle\"}",
          "inputText": "nodeUuid=<uuid>；colliderType=circle",
          "executionStep": "调用 auto_fit_physics_collider.auto_fit_physics_collider",
          "parameterNarrative": "这次请将 nodeUuid 指向 <uuid>，把 colliderType 设为“circle”。",
          "verificationFocus": "创建 CircleCollider2D，radius=min(w,h)/2",
          "expectedText": "创建 CircleCollider2D，radius=min(w,h)/2"
        },
        "naturalLanguageTest": "请通过 MCP 调用 auto_fit_physics_collider 工具，执行 auto_fit_physics_collider 动作，处理“指定 Circle”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 nodeUuid 指向 <uuid>，把 colliderType 设为“circle”。调用完成后重点检查：创建 CircleCollider2D，radius=min(w,h)/2。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 326,
      "tool": "script_scaffold",
      "action": "list_templates",
      "title": "列出脚本模板",
      "input": {
        "action": "list_templates"
      },
      "expected": "返回 6 个模板: controller/manager/ui-handler/data-model/singleton/fsm",
      "note": "Pro Phase 4",
      "phase": "资产与脚本",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 script_scaffold 工具，执行 list_templates 动作，处理“列出脚本模板”这个通用场景。这个场景通常用于Pro Phase 4。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 6 个模板: controller/manager/ui-handler/data-model/singleton/fsm。",
          "actionGoal": "执行 script_scaffold.list_templates",
          "scenarioType": "通用场景",
          "scenarioTitle": "列出脚本模板",
          "scenarioCondition": "Pro Phase 4",
          "scenarioNarrative": "这个场景通常用于Pro Phase 4。",
          "mcpCall": "script_scaffold.list_templates",
          "fullPayload": "{\"action\":\"list_templates\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 script_scaffold.list_templates",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回 6 个模板: controller/manager/ui-handler/data-model/singleton/fsm",
          "expectedText": "返回 6 个模板: controller/manager/ui-handler/data-model/singleton/fsm"
        },
        "naturalLanguageTest": "请通过 MCP 调用 script_scaffold 工具，执行 list_templates 动作，处理“列出脚本模板”这个通用场景。这个场景通常用于Pro Phase 4。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回 6 个模板: controller/manager/ui-handler/data-model/singleton/fsm。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 327,
      "tool": "script_scaffold",
      "action": "generate_component",
      "title": "生成组件脚本",
      "input": {
        "action": "generate_component",
        "className": "PlayerController",
        "description": "控制角色移动"
      },
      "expected": "生成 PlayerController.ts 到 assets/scripts/",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 script_scaffold 工具，执行 generate_component 动作，处理“生成组件脚本”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 className 设为“PlayerController”，把 description 设为“控制角色移动”。调用完成后重点检查：生成 PlayerController.ts 到 assets/scripts/。",
          "actionGoal": "执行 script_scaffold.generate_component",
          "scenarioType": "参数场景",
          "scenarioTitle": "生成组件脚本",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "script_scaffold.generate_component",
          "fullPayload": "{\"action\":\"generate_component\",\"className\":\"PlayerController\",\"description\":\"控制角色移动\"}",
          "inputText": "className=PlayerController；description=控制角色移动",
          "executionStep": "调用 script_scaffold.generate_component",
          "parameterNarrative": "这次请把 className 设为“PlayerController”，把 description 设为“控制角色移动”。",
          "verificationFocus": "生成 PlayerController.ts 到 assets/scripts/",
          "expectedText": "生成 PlayerController.ts 到 assets/scripts/"
        },
        "naturalLanguageTest": "请通过 MCP 调用 script_scaffold 工具，执行 generate_component 动作，处理“生成组件脚本”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 className 设为“PlayerController”，把 description 设为“控制角色移动”。调用完成后重点检查：生成 PlayerController.ts 到 assets/scripts/。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 328,
      "tool": "script_scaffold",
      "action": "generate_component",
      "title": "缺少 className",
      "input": {
        "action": "generate_component"
      },
      "expected": "返回错误: 缺少 className",
      "note": "参数校验",
      "phase": "资产与脚本",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 script_scaffold 工具，执行 generate_component 动作，处理“缺少 className”这个通用场景。这个场景通常用于参数校验。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回错误: 缺少 className。",
          "actionGoal": "执行 script_scaffold.generate_component",
          "scenarioType": "通用场景",
          "scenarioTitle": "缺少 className",
          "scenarioCondition": "参数校验",
          "scenarioNarrative": "这个场景通常用于参数校验。",
          "mcpCall": "script_scaffold.generate_component",
          "fullPayload": "{\"action\":\"generate_component\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 script_scaffold.generate_component",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回错误: 缺少 className",
          "expectedText": "返回错误: 缺少 className"
        },
        "naturalLanguageTest": "请通过 MCP 调用 script_scaffold 工具，执行 generate_component 动作，处理“缺少 className”这个通用场景。这个场景通常用于参数校验。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回错误: 缺少 className。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 329,
      "tool": "script_scaffold",
      "action": "from_template",
      "title": "从模板生成",
      "input": {
        "action": "from_template",
        "className": "GameManager",
        "template": "singleton"
      },
      "expected": "生成单例管理器脚本",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 script_scaffold 工具，执行 from_template 动作，处理“从模板生成”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 className 设为“GameManager”，把 template 设为“singleton”。调用完成后重点检查：生成单例管理器脚本。",
          "actionGoal": "执行 script_scaffold.from_template",
          "scenarioType": "参数场景",
          "scenarioTitle": "从模板生成",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "script_scaffold.from_template",
          "fullPayload": "{\"action\":\"from_template\",\"className\":\"GameManager\",\"template\":\"singleton\"}",
          "inputText": "className=GameManager；template=singleton",
          "executionStep": "调用 script_scaffold.from_template",
          "parameterNarrative": "这次请把 className 设为“GameManager”，把 template 设为“singleton”。",
          "verificationFocus": "生成单例管理器脚本",
          "expectedText": "生成单例管理器脚本"
        },
        "naturalLanguageTest": "请通过 MCP 调用 script_scaffold 工具，执行 from_template 动作，处理“从模板生成”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 className 设为“GameManager”，把 template 设为“singleton”。调用完成后重点检查：生成单例管理器脚本。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 330,
      "tool": "script_scaffold",
      "action": "generate_and_attach",
      "title": "生成+挂载",
      "input": {
        "action": "generate_and_attach",
        "className": "EnemyAI",
        "uuid": "<uuid>",
        "properties": [
          {
            "name": "speed",
            "type": "number",
            "default": 5
          }
        ]
      },
      "expected": "4 步: 生成→刷新→挂载→设属性",
      "note": "核心一体化 action",
      "phase": "资产与脚本",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 script_scaffold 工具，执行 generate_and_attach 动作，处理“生成+挂载”这个参数场景。这个场景通常用于核心一体化 action。这次请把 className 设为“EnemyAI”，将 uuid 指向 <uuid>，传入 properties=[{\"name\":\"speed\",\"type\":\"number\",\"default\":5}]。调用完成后重点检查：4 步: 生成→刷新→挂载→设属性。",
          "actionGoal": "执行 script_scaffold.generate_and_attach",
          "scenarioType": "参数场景",
          "scenarioTitle": "生成+挂载",
          "scenarioCondition": "核心一体化 action",
          "scenarioNarrative": "这个场景通常用于核心一体化 action。",
          "mcpCall": "script_scaffold.generate_and_attach",
          "fullPayload": "{\"action\":\"generate_and_attach\",\"className\":\"EnemyAI\",\"uuid\":\"<uuid>\",\"properties\":[{\"name\":\"speed\",\"type\":\"number\",\"default\":5}]}",
          "inputText": "className=EnemyAI；uuid=<uuid>；properties=[{\"name\":\"speed\",\"type\":\"number\",\"default\":5}]",
          "executionStep": "调用 script_scaffold.generate_and_attach",
          "parameterNarrative": "这次请把 className 设为“EnemyAI”，将 uuid 指向 <uuid>，传入 properties=[{\"name\":\"speed\",\"type\":\"number\",\"default\":5}]。",
          "verificationFocus": "4 步: 生成→刷新→挂载→设属性",
          "expectedText": "4 步: 生成→刷新→挂载→设属性"
        },
        "naturalLanguageTest": "请通过 MCP 调用 script_scaffold 工具，执行 generate_and_attach 动作，处理“生成+挂载”这个参数场景。这个场景通常用于核心一体化 action。这次请把 className 设为“EnemyAI”，将 uuid 指向 <uuid>，传入 properties=[{\"name\":\"speed\",\"type\":\"number\",\"default\":5}]。调用完成后重点检查：4 步: 生成→刷新→挂载→设属性。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 331,
      "tool": "script_scaffold",
      "action": "generate_and_attach",
      "title": "缺少 uuid",
      "input": {
        "action": "generate_and_attach",
        "className": "Foo"
      },
      "expected": "返回错误: 缺少 uuid",
      "note": "参数校验",
      "phase": "资产与脚本",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 script_scaffold 工具，执行 generate_and_attach 动作，处理“缺少 uuid”这个参数场景。这个场景通常用于参数校验。这次请把 className 设为“Foo”。调用完成后重点检查：返回错误: 缺少 uuid。",
          "actionGoal": "执行 script_scaffold.generate_and_attach",
          "scenarioType": "参数场景",
          "scenarioTitle": "缺少 uuid",
          "scenarioCondition": "参数校验",
          "scenarioNarrative": "这个场景通常用于参数校验。",
          "mcpCall": "script_scaffold.generate_and_attach",
          "fullPayload": "{\"action\":\"generate_and_attach\",\"className\":\"Foo\"}",
          "inputText": "className=Foo",
          "executionStep": "调用 script_scaffold.generate_and_attach",
          "parameterNarrative": "这次请把 className 设为“Foo”。",
          "verificationFocus": "返回错误: 缺少 uuid",
          "expectedText": "返回错误: 缺少 uuid"
        },
        "naturalLanguageTest": "请通过 MCP 调用 script_scaffold 工具，执行 generate_and_attach 动作，处理“缺少 uuid”这个参数场景。这个场景通常用于参数校验。这次请把 className 设为“Foo”。调用完成后重点检查：返回错误: 缺少 uuid。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 332,
      "tool": "script_scaffold",
      "action": "add_properties",
      "title": "追加属性",
      "input": {
        "action": "add_properties",
        "className": "PlayerController",
        "properties": [
          {
            "name": "jumpForce",
            "type": "number",
            "default": 12
          }
        ]
      },
      "expected": "追加 @property 声明",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 script_scaffold 工具，执行 add_properties 动作，处理“追加属性”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 className 设为“PlayerController”，传入 properties=[{\"name\":\"jumpForce\",\"type\":\"number\",\"default\":12}]。调用完成后重点检查：追加 @property 声明。",
          "actionGoal": "执行 script_scaffold.add_properties",
          "scenarioType": "参数场景",
          "scenarioTitle": "追加属性",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "script_scaffold.add_properties",
          "fullPayload": "{\"action\":\"add_properties\",\"className\":\"PlayerController\",\"properties\":[{\"name\":\"jumpForce\",\"type\":\"number\",\"default\":12}]}",
          "inputText": "className=PlayerController；properties=[{\"name\":\"jumpForce\",\"type\":\"number\",\"default\":12}]",
          "executionStep": "调用 script_scaffold.add_properties",
          "parameterNarrative": "这次请把 className 设为“PlayerController”，传入 properties=[{\"name\":\"jumpForce\",\"type\":\"number\",\"default\":12}]。",
          "verificationFocus": "追加 @property 声明",
          "expectedText": "追加 @property 声明"
        },
        "naturalLanguageTest": "请通过 MCP 调用 script_scaffold 工具，执行 add_properties 动作，处理“追加属性”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 className 设为“PlayerController”，传入 properties=[{\"name\":\"jumpForce\",\"type\":\"number\",\"default\":12}]。调用完成后重点检查：追加 @property 声明。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 333,
      "tool": "script_scaffold",
      "action": "generate_event_handler",
      "title": "生成事件处理",
      "input": {
        "action": "generate_event_handler",
        "className": "BtnHandler",
        "uuid": "<uuid>",
        "events": [
          {
            "event": "click",
            "handler": "onBtnClick"
          }
        ]
      },
      "expected": "生成脚本→挂载→绑定 click",
      "note": "",
      "phase": "资产与脚本",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 script_scaffold 工具，执行 generate_event_handler 动作，处理“生成事件处理”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 className 设为“BtnHandler”，将 uuid 指向 <uuid>，传入 events=[{\"event\":\"click\",\"handler\":\"onBtnClick\"}]。调用完成后重点检查：生成脚本→挂载→绑定 click。",
          "actionGoal": "执行 script_scaffold.generate_event_handler",
          "scenarioType": "参数场景",
          "scenarioTitle": "生成事件处理",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "script_scaffold.generate_event_handler",
          "fullPayload": "{\"action\":\"generate_event_handler\",\"className\":\"BtnHandler\",\"uuid\":\"<uuid>\",\"events\":[{\"event\":\"click\",\"handler\":\"onBtnClick\"}]}",
          "inputText": "className=BtnHandler；uuid=<uuid>；events=[{\"event\":\"click\",\"handler\":\"onBtnClick\"}]",
          "executionStep": "调用 script_scaffold.generate_event_handler",
          "parameterNarrative": "这次请把 className 设为“BtnHandler”，将 uuid 指向 <uuid>，传入 events=[{\"event\":\"click\",\"handler\":\"onBtnClick\"}]。",
          "verificationFocus": "生成脚本→挂载→绑定 click",
          "expectedText": "生成脚本→挂载→绑定 click"
        },
        "naturalLanguageTest": "请通过 MCP 调用 script_scaffold 工具，执行 generate_event_handler 动作，处理“生成事件处理”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 className 设为“BtnHandler”，将 uuid 指向 <uuid>，传入 events=[{\"event\":\"click\",\"handler\":\"onBtnClick\"}]。调用完成后重点检查：生成脚本→挂载→绑定 click。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 334,
      "tool": "script_scaffold",
      "action": "generate_event_handler",
      "title": "缺少 events",
      "input": {
        "action": "generate_event_handler",
        "className": "X",
        "uuid": "<uuid>"
      },
      "expected": "返回错误: 缺少 events",
      "note": "参数校验",
      "phase": "资产与脚本",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 script_scaffold 工具，执行 generate_event_handler 动作，处理“缺少 events”这个参数场景。这个场景通常用于参数校验。这次请把 className 设为“X”，将 uuid 指向 <uuid>。调用完成后重点检查：返回错误: 缺少 events。",
          "actionGoal": "执行 script_scaffold.generate_event_handler",
          "scenarioType": "参数场景",
          "scenarioTitle": "缺少 events",
          "scenarioCondition": "参数校验",
          "scenarioNarrative": "这个场景通常用于参数校验。",
          "mcpCall": "script_scaffold.generate_event_handler",
          "fullPayload": "{\"action\":\"generate_event_handler\",\"className\":\"X\",\"uuid\":\"<uuid>\"}",
          "inputText": "className=X；uuid=<uuid>",
          "executionStep": "调用 script_scaffold.generate_event_handler",
          "parameterNarrative": "这次请把 className 设为“X”，将 uuid 指向 <uuid>。",
          "verificationFocus": "返回错误: 缺少 events",
          "expectedText": "返回错误: 缺少 events"
        },
        "naturalLanguageTest": "请通过 MCP 调用 script_scaffold 工具，执行 generate_event_handler 动作，处理“缺少 events”这个参数场景。这个场景通常用于参数校验。这次请把 className 设为“X”，将 uuid 指向 <uuid>。调用完成后重点检查：返回错误: 缺少 events。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 335,
      "tool": "animation_workflow",
      "action": "create_transition",
      "title": "淡入过渡",
      "input": {
        "action": "create_transition",
        "uuid": "<uuid>",
        "transitionType": "fade-in"
      },
      "expected": "创建 0.3s opacity 0→255 动画",
      "note": "Pro Phase 4",
      "phase": "动画工作流",
      "priority": "P2",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 animation_workflow 工具，执行 create_transition 动作，处理“淡入过渡”这个参数场景。这个场景通常用于Pro Phase 4。这次请将 uuid 指向 <uuid>，把 transitionType 设为“fade-in”。调用完成后重点检查：创建 0.3s opacity 0→255 动画。",
          "actionGoal": "执行 animation_workflow.create_transition",
          "scenarioType": "参数场景",
          "scenarioTitle": "淡入过渡",
          "scenarioCondition": "Pro Phase 4",
          "scenarioNarrative": "这个场景通常用于Pro Phase 4。",
          "mcpCall": "animation_workflow.create_transition",
          "fullPayload": "{\"action\":\"create_transition\",\"uuid\":\"<uuid>\",\"transitionType\":\"fade-in\"}",
          "inputText": "uuid=<uuid>；transitionType=fade-in",
          "executionStep": "调用 animation_workflow.create_transition",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 transitionType 设为“fade-in”。",
          "verificationFocus": "创建 0.3s opacity 0→255 动画",
          "expectedText": "创建 0.3s opacity 0→255 动画"
        },
        "naturalLanguageTest": "请通过 MCP 调用 animation_workflow 工具，执行 create_transition 动作，处理“淡入过渡”这个参数场景。这个场景通常用于Pro Phase 4。这次请将 uuid 指向 <uuid>，把 transitionType 设为“fade-in”。调用完成后重点检查：创建 0.3s opacity 0→255 动画。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 336,
      "tool": "animation_workflow",
      "action": "create_transition",
      "title": "弹跳进入",
      "input": {
        "action": "create_transition",
        "uuid": "<uuid>",
        "transitionType": "bounce-in"
      },
      "expected": "创建 0.5s scale 0→1.2→1 动画",
      "note": "",
      "phase": "动画工作流",
      "priority": "P2",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 animation_workflow 工具，执行 create_transition 动作，处理“弹跳进入”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 transitionType 设为“bounce-in”。调用完成后重点检查：创建 0.5s scale 0→1.2→1 动画。",
          "actionGoal": "执行 animation_workflow.create_transition",
          "scenarioType": "参数场景",
          "scenarioTitle": "弹跳进入",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "animation_workflow.create_transition",
          "fullPayload": "{\"action\":\"create_transition\",\"uuid\":\"<uuid>\",\"transitionType\":\"bounce-in\"}",
          "inputText": "uuid=<uuid>；transitionType=bounce-in",
          "executionStep": "调用 animation_workflow.create_transition",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 transitionType 设为“bounce-in”。",
          "verificationFocus": "创建 0.5s scale 0→1.2→1 动画",
          "expectedText": "创建 0.5s scale 0→1.2→1 动画"
        },
        "naturalLanguageTest": "请通过 MCP 调用 animation_workflow 工具，执行 create_transition 动作，处理“弹跳进入”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 transitionType 设为“bounce-in”。调用完成后重点检查：创建 0.5s scale 0→1.2→1 动画。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 337,
      "tool": "animation_workflow",
      "action": "create_transition",
      "title": "自定义时长",
      "input": {
        "action": "create_transition",
        "uuid": "<uuid>",
        "transitionType": "slide-in-left",
        "duration": 1
      },
      "expected": "创建 1.0s 左滑入动画",
      "note": "",
      "phase": "动画工作流",
      "priority": "P2",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 animation_workflow 工具，执行 create_transition 动作，处理“自定义时长”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 transitionType 设为“slide-in-left”，把 duration 设为 1。调用完成后重点检查：创建 1.0s 左滑入动画。",
          "actionGoal": "执行 animation_workflow.create_transition",
          "scenarioType": "参数场景",
          "scenarioTitle": "自定义时长",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "animation_workflow.create_transition",
          "fullPayload": "{\"action\":\"create_transition\",\"uuid\":\"<uuid>\",\"transitionType\":\"slide-in-left\",\"duration\":1}",
          "inputText": "uuid=<uuid>；transitionType=slide-in-left；duration=1",
          "executionStep": "调用 animation_workflow.create_transition",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 transitionType 设为“slide-in-left”，把 duration 设为 1。",
          "verificationFocus": "创建 1.0s 左滑入动画",
          "expectedText": "创建 1.0s 左滑入动画"
        },
        "naturalLanguageTest": "请通过 MCP 调用 animation_workflow 工具，执行 create_transition 动作，处理“自定义时长”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 transitionType 设为“slide-in-left”，把 duration 设为 1。调用完成后重点检查：创建 1.0s 左滑入动画。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 338,
      "tool": "animation_workflow",
      "action": "create_loop_animation",
      "title": "浮动循环",
      "input": {
        "action": "create_loop_animation",
        "uuid": "<uuid>",
        "loopType": "float"
      },
      "expected": "创建 2s 上下浮动 Loop 动画",
      "note": "",
      "phase": "动画工作流",
      "priority": "P2",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 animation_workflow 工具，执行 create_loop_animation 动作，处理“浮动循环”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 loopType 设为“float”。调用完成后重点检查：创建 2s 上下浮动 Loop 动画。",
          "actionGoal": "执行 animation_workflow.create_loop_animation",
          "scenarioType": "参数场景",
          "scenarioTitle": "浮动循环",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "animation_workflow.create_loop_animation",
          "fullPayload": "{\"action\":\"create_loop_animation\",\"uuid\":\"<uuid>\",\"loopType\":\"float\"}",
          "inputText": "uuid=<uuid>；loopType=float",
          "executionStep": "调用 animation_workflow.create_loop_animation",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 loopType 设为“float”。",
          "verificationFocus": "创建 2s 上下浮动 Loop 动画",
          "expectedText": "创建 2s 上下浮动 Loop 动画"
        },
        "naturalLanguageTest": "请通过 MCP 调用 animation_workflow 工具，执行 create_loop_animation 动作，处理“浮动循环”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 loopType 设为“float”。调用完成后重点检查：创建 2s 上下浮动 Loop 动画。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 339,
      "tool": "animation_workflow",
      "action": "create_loop_animation",
      "title": "旋转循环",
      "input": {
        "action": "create_loop_animation",
        "uuid": "<uuid>",
        "loopType": "rotate"
      },
      "expected": "创建 2s Z 轴 0→360 旋转动画",
      "note": "",
      "phase": "动画工作流",
      "priority": "P2",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 animation_workflow 工具，执行 create_loop_animation 动作，处理“旋转循环”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 loopType 设为“rotate”。调用完成后重点检查：创建 2s Z 轴 0→360 旋转动画。",
          "actionGoal": "执行 animation_workflow.create_loop_animation",
          "scenarioType": "参数场景",
          "scenarioTitle": "旋转循环",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "animation_workflow.create_loop_animation",
          "fullPayload": "{\"action\":\"create_loop_animation\",\"uuid\":\"<uuid>\",\"loopType\":\"rotate\"}",
          "inputText": "uuid=<uuid>；loopType=rotate",
          "executionStep": "调用 animation_workflow.create_loop_animation",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 loopType 设为“rotate”。",
          "verificationFocus": "创建 2s Z 轴 0→360 旋转动画",
          "expectedText": "创建 2s Z 轴 0→360 旋转动画"
        },
        "naturalLanguageTest": "请通过 MCP 调用 animation_workflow 工具，执行 create_loop_animation 动作，处理“旋转循环”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 loopType 设为“rotate”。调用完成后重点检查：创建 2s Z 轴 0→360 旋转动画。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 340,
      "tool": "animation_workflow",
      "action": "apply_preset",
      "title": "idle 预设",
      "input": {
        "action": "apply_preset",
        "uuid": "<uuid>",
        "preset": "idle"
      },
      "expected": "创建 idle 呼吸循环动画",
      "note": "",
      "phase": "动画工作流",
      "priority": "P2",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 animation_workflow 工具，执行 apply_preset 动作，处理“idle 预设”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 preset 设为“idle”。调用完成后重点检查：创建 idle 呼吸循环动画。",
          "actionGoal": "执行 animation_workflow.apply_preset",
          "scenarioType": "参数场景",
          "scenarioTitle": "idle 预设",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "animation_workflow.apply_preset",
          "fullPayload": "{\"action\":\"apply_preset\",\"uuid\":\"<uuid>\",\"preset\":\"idle\"}",
          "inputText": "uuid=<uuid>；preset=idle",
          "executionStep": "调用 animation_workflow.apply_preset",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 preset 设为“idle”。",
          "verificationFocus": "创建 idle 呼吸循环动画",
          "expectedText": "创建 idle 呼吸循环动画"
        },
        "naturalLanguageTest": "请通过 MCP 调用 animation_workflow 工具，执行 apply_preset 动作，处理“idle 预设”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 preset 设为“idle”。调用完成后重点检查：创建 idle 呼吸循环动画。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 341,
      "tool": "animation_workflow",
      "action": "apply_preset",
      "title": "attack 预设",
      "input": {
        "action": "apply_preset",
        "uuid": "<uuid>",
        "preset": "attack"
      },
      "expected": "创建 attack 缩放+位移动画",
      "note": "",
      "phase": "动画工作流",
      "priority": "P2",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 animation_workflow 工具，执行 apply_preset 动作，处理“attack 预设”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 preset 设为“attack”。调用完成后重点检查：创建 attack 缩放+位移动画。",
          "actionGoal": "执行 animation_workflow.apply_preset",
          "scenarioType": "参数场景",
          "scenarioTitle": "attack 预设",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "animation_workflow.apply_preset",
          "fullPayload": "{\"action\":\"apply_preset\",\"uuid\":\"<uuid>\",\"preset\":\"attack\"}",
          "inputText": "uuid=<uuid>；preset=attack",
          "executionStep": "调用 animation_workflow.apply_preset",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 preset 设为“attack”。",
          "verificationFocus": "创建 attack 缩放+位移动画",
          "expectedText": "创建 attack 缩放+位移动画"
        },
        "naturalLanguageTest": "请通过 MCP 调用 animation_workflow 工具，执行 apply_preset 动作，处理“attack 预设”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 preset 设为“attack”。调用完成后重点检查：创建 attack 缩放+位移动画。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 342,
      "tool": "animation_workflow",
      "action": "create_ui_animation",
      "title": "按钮点击",
      "input": {
        "action": "create_ui_animation",
        "uuid": "<uuid>",
        "uiAnimType": "button-press"
      },
      "expected": "创建 0.15s 缩放反馈动画",
      "note": "",
      "phase": "动画工作流",
      "priority": "P2",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 animation_workflow 工具，执行 create_ui_animation 动作，处理“按钮点击”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 uiAnimType 设为“button-press”。调用完成后重点检查：创建 0.15s 缩放反馈动画。",
          "actionGoal": "执行 animation_workflow.create_ui_animation",
          "scenarioType": "参数场景",
          "scenarioTitle": "按钮点击",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "animation_workflow.create_ui_animation",
          "fullPayload": "{\"action\":\"create_ui_animation\",\"uuid\":\"<uuid>\",\"uiAnimType\":\"button-press\"}",
          "inputText": "uuid=<uuid>；uiAnimType=button-press",
          "executionStep": "调用 animation_workflow.create_ui_animation",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 uiAnimType 设为“button-press”。",
          "verificationFocus": "创建 0.15s 缩放反馈动画",
          "expectedText": "创建 0.15s 缩放反馈动画"
        },
        "naturalLanguageTest": "请通过 MCP 调用 animation_workflow 工具，执行 create_ui_animation 动作，处理“按钮点击”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 uiAnimType 设为“button-press”。调用完成后重点检查：创建 0.15s 缩放反馈动画。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 343,
      "tool": "animation_workflow",
      "action": "create_ui_animation",
      "title": "面板弹出",
      "input": {
        "action": "create_ui_animation",
        "uuid": "<uuid>",
        "uiAnimType": "panel-popup"
      },
      "expected": "创建 0.35s scale+opacity 弹出动画",
      "note": "",
      "phase": "动画工作流",
      "priority": "P2",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 animation_workflow 工具，执行 create_ui_animation 动作，处理“面板弹出”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 uiAnimType 设为“panel-popup”。调用完成后重点检查：创建 0.35s scale+opacity 弹出动画。",
          "actionGoal": "执行 animation_workflow.create_ui_animation",
          "scenarioType": "参数场景",
          "scenarioTitle": "面板弹出",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "animation_workflow.create_ui_animation",
          "fullPayload": "{\"action\":\"create_ui_animation\",\"uuid\":\"<uuid>\",\"uiAnimType\":\"panel-popup\"}",
          "inputText": "uuid=<uuid>；uiAnimType=panel-popup",
          "executionStep": "调用 animation_workflow.create_ui_animation",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 uiAnimType 设为“panel-popup”。",
          "verificationFocus": "创建 0.35s scale+opacity 弹出动画",
          "expectedText": "创建 0.35s scale+opacity 弹出动画"
        },
        "naturalLanguageTest": "请通过 MCP 调用 animation_workflow 工具，执行 create_ui_animation 动作，处理“面板弹出”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 uiAnimType 设为“panel-popup”。调用完成后重点检查：创建 0.35s scale+opacity 弹出动画。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 344,
      "tool": "animation_workflow",
      "action": "create_from_description",
      "title": "自然语言动画",
      "input": {
        "action": "create_from_description",
        "uuid": "<uuid>",
        "prompt": "让按钮弹跳进入"
      },
      "expected": "AI 解析→生成关键帧",
      "note": "",
      "phase": "动画工作流",
      "priority": "P2",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 animation_workflow 工具，执行 create_from_description 动作，处理“自然语言动画”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 prompt 设为“让按钮弹跳进入”。调用完成后重点检查：AI 解析→生成关键帧。",
          "actionGoal": "执行 animation_workflow.create_from_description",
          "scenarioType": "参数场景",
          "scenarioTitle": "自然语言动画",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "animation_workflow.create_from_description",
          "fullPayload": "{\"action\":\"create_from_description\",\"uuid\":\"<uuid>\",\"prompt\":\"让按钮弹跳进入\"}",
          "inputText": "uuid=<uuid>；prompt=让按钮弹跳进入",
          "executionStep": "调用 animation_workflow.create_from_description",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 prompt 设为“让按钮弹跳进入”。",
          "verificationFocus": "AI 解析→生成关键帧",
          "expectedText": "AI 解析→生成关键帧"
        },
        "naturalLanguageTest": "请通过 MCP 调用 animation_workflow 工具，执行 create_from_description 动作，处理“自然语言动画”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 prompt 设为“让按钮弹跳进入”。调用完成后重点检查：AI 解析→生成关键帧。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 345,
      "tool": "animation_workflow",
      "action": "create_from_description",
      "title": "缺少 prompt",
      "input": {
        "action": "create_from_description",
        "uuid": "<uuid>"
      },
      "expected": "返回错误: 缺少 prompt",
      "note": "参数校验",
      "phase": "动画工作流",
      "priority": "P2",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 animation_workflow 工具，执行 create_from_description 动作，处理“缺少 prompt”这个参数场景。这个场景通常用于参数校验。这次请将 uuid 指向 <uuid>。调用完成后重点检查：返回错误: 缺少 prompt。",
          "actionGoal": "执行 animation_workflow.create_from_description",
          "scenarioType": "参数场景",
          "scenarioTitle": "缺少 prompt",
          "scenarioCondition": "参数校验",
          "scenarioNarrative": "这个场景通常用于参数校验。",
          "mcpCall": "animation_workflow.create_from_description",
          "fullPayload": "{\"action\":\"create_from_description\",\"uuid\":\"<uuid>\"}",
          "inputText": "uuid=<uuid>",
          "executionStep": "调用 animation_workflow.create_from_description",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>。",
          "verificationFocus": "返回错误: 缺少 prompt",
          "expectedText": "返回错误: 缺少 prompt"
        },
        "naturalLanguageTest": "请通过 MCP 调用 animation_workflow 工具，执行 create_from_description 动作，处理“缺少 prompt”这个参数场景。这个场景通常用于参数校验。这次请将 uuid 指向 <uuid>。调用完成后重点检查：返回错误: 缺少 prompt。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 346,
      "tool": "animation_workflow",
      "action": "create_sequence",
      "title": "动画序列",
      "input": {
        "action": "create_sequence",
        "uuid": "<uuid>",
        "clips": [
          {
            "clipName": "intro",
            "transitionType": "fade-in"
          },
          {
            "clipName": "loop",
            "loopType": "pulse"
          }
        ]
      },
      "expected": "创建 2 个剪辑",
      "note": "",
      "phase": "动画工作流",
      "priority": "P2",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 animation_workflow 工具，执行 create_sequence 动作，处理“动画序列”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，传入 clips=[{\"clipName\":\"intro\",\"transitionType\":\"fade-in\"},{\"clipName\":\"loop\",\"loopType\":\"pulse\"}]。调用完成后重点检查：创建 2 个剪辑。",
          "actionGoal": "执行 animation_workflow.create_sequence",
          "scenarioType": "参数场景",
          "scenarioTitle": "动画序列",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "animation_workflow.create_sequence",
          "fullPayload": "{\"action\":\"create_sequence\",\"uuid\":\"<uuid>\",\"clips\":[{\"clipName\":\"intro\",\"transitionType\":\"fade-in\"},{\"clipName\":\"loop\",\"loopType\":\"pulse\"}]}",
          "inputText": "uuid=<uuid>；clips=[{\"clipName\":\"intro\",\"transitionType\":\"fade-in\"},{\"clipName\":\"loop\",\"loopType\":\"pulse\"}]",
          "executionStep": "调用 animation_workflow.create_sequence",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，传入 clips=[{\"clipName\":\"intro\",\"transitionType\":\"fade-in\"},{\"clipName\":\"loop\",\"loopType\":\"pulse\"}]。",
          "verificationFocus": "创建 2 个剪辑",
          "expectedText": "创建 2 个剪辑"
        },
        "naturalLanguageTest": "请通过 MCP 调用 animation_workflow 工具，执行 create_sequence 动作，处理“动画序列”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，传入 clips=[{\"clipName\":\"intro\",\"transitionType\":\"fade-in\"},{\"clipName\":\"loop\",\"loopType\":\"pulse\"}]。调用完成后重点检查：创建 2 个剪辑。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 347,
      "tool": "animation_workflow",
      "action": "batch_animate",
      "title": "批量入场",
      "input": {
        "action": "batch_animate",
        "uuids": [
          "<a>",
          "<b>",
          "<c>"
        ],
        "transitionType": "fade-in"
      },
      "expected": "3 个节点各创建 fade-in 动画",
      "note": "",
      "phase": "动画工作流",
      "priority": "P2",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 animation_workflow 工具，执行 batch_animate 动作，处理“批量入场”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请传入 uuids=[\"<a>\",\"<b>\",\"<c>\"]，把 transitionType 设为“fade-in”。调用完成后重点检查：3 个节点各创建 fade-in 动画。",
          "actionGoal": "执行 animation_workflow.batch_animate",
          "scenarioType": "参数场景",
          "scenarioTitle": "批量入场",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "animation_workflow.batch_animate",
          "fullPayload": "{\"action\":\"batch_animate\",\"uuids\":[\"<a>\",\"<b>\",\"<c>\"],\"transitionType\":\"fade-in\"}",
          "inputText": "uuids=[\"<a>\",\"<b>\",\"<c>\"]；transitionType=fade-in",
          "executionStep": "调用 animation_workflow.batch_animate",
          "parameterNarrative": "这次请传入 uuids=[\"<a>\",\"<b>\",\"<c>\"]，把 transitionType 设为“fade-in”。",
          "verificationFocus": "3 个节点各创建 fade-in 动画",
          "expectedText": "3 个节点各创建 fade-in 动画"
        },
        "naturalLanguageTest": "请通过 MCP 调用 animation_workflow 工具，执行 batch_animate 动作，处理“批量入场”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请传入 uuids=[\"<a>\",\"<b>\",\"<c>\"]，把 transitionType 设为“fade-in”。调用完成后重点检查：3 个节点各创建 fade-in 动画。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 348,
      "tool": "animation_workflow",
      "action": "batch_animate",
      "title": "缺少 uuids",
      "input": {
        "action": "batch_animate",
        "transitionType": "fade-in"
      },
      "expected": "返回错误: 缺少 uuids",
      "note": "参数校验",
      "phase": "动画工作流",
      "priority": "P2",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 animation_workflow 工具，执行 batch_animate 动作，处理“缺少 uuids”这个参数场景。这个场景通常用于参数校验。这次请把 transitionType 设为“fade-in”。调用完成后重点检查：返回错误: 缺少 uuids。",
          "actionGoal": "执行 animation_workflow.batch_animate",
          "scenarioType": "参数场景",
          "scenarioTitle": "缺少 uuids",
          "scenarioCondition": "参数校验",
          "scenarioNarrative": "这个场景通常用于参数校验。",
          "mcpCall": "animation_workflow.batch_animate",
          "fullPayload": "{\"action\":\"batch_animate\",\"transitionType\":\"fade-in\"}",
          "inputText": "transitionType=fade-in",
          "executionStep": "调用 animation_workflow.batch_animate",
          "parameterNarrative": "这次请把 transitionType 设为“fade-in”。",
          "verificationFocus": "返回错误: 缺少 uuids",
          "expectedText": "返回错误: 缺少 uuids"
        },
        "naturalLanguageTest": "请通过 MCP 调用 animation_workflow 工具，执行 batch_animate 动作，处理“缺少 uuids”这个参数场景。这个场景通常用于参数校验。这次请把 transitionType 设为“fade-in”。调用完成后重点检查：返回错误: 缺少 uuids。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 349,
      "tool": "animation_workflow",
      "action": "preview_animation",
      "title": "预览动画",
      "input": {
        "action": "preview_animation",
        "uuid": "<uuid>",
        "clipName": "idle"
      },
      "expected": "播放 idle 动画",
      "note": "",
      "phase": "动画工作流",
      "priority": "P2",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 animation_workflow 工具，执行 preview_animation 动作，处理“预览动画”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 clipName 设为“idle”。调用完成后重点检查：播放 idle 动画。",
          "actionGoal": "执行 animation_workflow.preview_animation",
          "scenarioType": "参数场景",
          "scenarioTitle": "预览动画",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "animation_workflow.preview_animation",
          "fullPayload": "{\"action\":\"preview_animation\",\"uuid\":\"<uuid>\",\"clipName\":\"idle\"}",
          "inputText": "uuid=<uuid>；clipName=idle",
          "executionStep": "调用 animation_workflow.preview_animation",
          "parameterNarrative": "这次请将 uuid 指向 <uuid>，把 clipName 设为“idle”。",
          "verificationFocus": "播放 idle 动画",
          "expectedText": "播放 idle 动画"
        },
        "naturalLanguageTest": "请通过 MCP 调用 animation_workflow 工具，执行 preview_animation 动作，处理“预览动画”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请将 uuid 指向 <uuid>，把 clipName 设为“idle”。调用完成后重点检查：播放 idle 动画。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 350,
      "tool": "ui_generator",
      "action": "create_login_page",
      "title": "一键登录页",
      "input": {
        "action": "create_login_page"
      },
      "expected": "生成完整登录页: Canvas→根容器→邮箱+密码+按钮+社交登录",
      "note": "Pro Phase 4",
      "phase": "UI 与参考图",
      "priority": "P2",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 ui_generator 工具，执行 create_login_page 动作，处理“一键登录页”这个通用场景。这个场景通常用于Pro Phase 4。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：生成完整登录页: Canvas→根容器→邮箱+密码+按钮+社交登录。",
          "actionGoal": "执行 ui_generator.create_login_page",
          "scenarioType": "通用场景",
          "scenarioTitle": "一键登录页",
          "scenarioCondition": "Pro Phase 4",
          "scenarioNarrative": "这个场景通常用于Pro Phase 4。",
          "mcpCall": "ui_generator.create_login_page",
          "fullPayload": "{\"action\":\"create_login_page\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 ui_generator.create_login_page",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "生成完整登录页: Canvas→根容器→邮箱+密码+按钮+社交登录",
          "expectedText": "生成完整登录页: Canvas→根容器→邮箱+密码+按钮+社交登录"
        },
        "naturalLanguageTest": "请通过 MCP 调用 ui_generator 工具，执行 create_login_page 动作，处理“一键登录页”这个通用场景。这个场景通常用于Pro Phase 4。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：生成完整登录页: Canvas→根容器→邮箱+密码+按钮+社交登录。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 351,
      "tool": "ui_generator",
      "action": "create_settings_page",
      "title": "一键设置页",
      "input": {
        "action": "create_settings_page"
      },
      "expected": "生成设置页: 音量滑块+开关+语言选择",
      "note": "",
      "phase": "UI 与参考图",
      "priority": "P2",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 ui_generator 工具，执行 create_settings_page 动作，处理“一键设置页”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：生成设置页: 音量滑块+开关+语言选择。",
          "actionGoal": "执行 ui_generator.create_settings_page",
          "scenarioType": "通用场景",
          "scenarioTitle": "一键设置页",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "ui_generator.create_settings_page",
          "fullPayload": "{\"action\":\"create_settings_page\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 ui_generator.create_settings_page",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "生成设置页: 音量滑块+开关+语言选择",
          "expectedText": "生成设置页: 音量滑块+开关+语言选择"
        },
        "naturalLanguageTest": "请通过 MCP 调用 ui_generator 工具，执行 create_settings_page 动作，处理“一键设置页”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：生成设置页: 音量滑块+开关+语言选择。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 352,
      "tool": "ui_generator",
      "action": "create_shop_page",
      "title": "一键商店页",
      "input": {
        "action": "create_shop_page",
        "itemCount": 6
      },
      "expected": "生成商店: ScrollView + 6 个商品卡片",
      "note": "",
      "phase": "UI 与参考图",
      "priority": "P2",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 ui_generator 工具，执行 create_shop_page 动作，处理“一键商店页”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 itemCount 设为 6。调用完成后重点检查：生成商店: ScrollView + 6 个商品卡片。",
          "actionGoal": "执行 ui_generator.create_shop_page",
          "scenarioType": "参数场景",
          "scenarioTitle": "一键商店页",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "ui_generator.create_shop_page",
          "fullPayload": "{\"action\":\"create_shop_page\",\"itemCount\":6}",
          "inputText": "itemCount=6",
          "executionStep": "调用 ui_generator.create_shop_page",
          "parameterNarrative": "这次请把 itemCount 设为 6。",
          "verificationFocus": "生成商店: ScrollView + 6 个商品卡片",
          "expectedText": "生成商店: ScrollView + 6 个商品卡片"
        },
        "naturalLanguageTest": "请通过 MCP 调用 ui_generator 工具，执行 create_shop_page 动作，处理“一键商店页”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 itemCount 设为 6。调用完成后重点检查：生成商店: ScrollView + 6 个商品卡片。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 353,
      "tool": "ui_generator",
      "action": "create_shop_page",
      "title": "自定义商品数",
      "input": {
        "action": "create_shop_page",
        "itemCount": 3
      },
      "expected": "生成 3 个商品卡片（少于默认 6 个）",
      "note": "",
      "phase": "UI 与参考图",
      "priority": "P2",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 ui_generator 工具，执行 create_shop_page 动作，处理“自定义商品数”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 itemCount 设为 3。调用完成后重点检查：生成 3 个商品卡片（少于默认 6 个）。",
          "actionGoal": "执行 ui_generator.create_shop_page",
          "scenarioType": "参数场景",
          "scenarioTitle": "自定义商品数",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "ui_generator.create_shop_page",
          "fullPayload": "{\"action\":\"create_shop_page\",\"itemCount\":3}",
          "inputText": "itemCount=3",
          "executionStep": "调用 ui_generator.create_shop_page",
          "parameterNarrative": "这次请把 itemCount 设为 3。",
          "verificationFocus": "生成 3 个商品卡片（少于默认 6 个）",
          "expectedText": "生成 3 个商品卡片（少于默认 6 个）"
        },
        "naturalLanguageTest": "请通过 MCP 调用 ui_generator 工具，执行 create_shop_page 动作，处理“自定义商品数”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 itemCount 设为 3。调用完成后重点检查：生成 3 个商品卡片（少于默认 6 个）。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 354,
      "tool": "ui_generator",
      "action": "create_hud",
      "title": "一键 HUD",
      "input": {
        "action": "create_hud"
      },
      "expected": "生成 HUD: 血条+分数+技能栏+小地图+暂停按钮",
      "note": "",
      "phase": "UI 与参考图",
      "priority": "P2",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 ui_generator 工具，执行 create_hud 动作，处理“一键 HUD”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：生成 HUD: 血条+分数+技能栏+小地图+暂停按钮。",
          "actionGoal": "执行 ui_generator.create_hud",
          "scenarioType": "通用场景",
          "scenarioTitle": "一键 HUD",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "ui_generator.create_hud",
          "fullPayload": "{\"action\":\"create_hud\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 ui_generator.create_hud",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "生成 HUD: 血条+分数+技能栏+小地图+暂停按钮",
          "expectedText": "生成 HUD: 血条+分数+技能栏+小地图+暂停按钮"
        },
        "naturalLanguageTest": "请通过 MCP 调用 ui_generator 工具，执行 create_hud 动作，处理“一键 HUD”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：生成 HUD: 血条+分数+技能栏+小地图+暂停按钮。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 355,
      "tool": "ui_generator",
      "action": "create_dialog",
      "title": "自定义对话框",
      "input": {
        "action": "create_dialog",
        "title": "退出游戏?",
        "content": "确定要退出吗?"
      },
      "expected": "生成对话框含自定义标题和内容",
      "note": "",
      "phase": "UI 与参考图",
      "priority": "P2",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 ui_generator 工具，执行 create_dialog 动作，处理“自定义对话框”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 title 设为“退出游戏?”，把 content 设为“确定要退出吗?”。调用完成后重点检查：生成对话框含自定义标题和内容。",
          "actionGoal": "执行 ui_generator.create_dialog",
          "scenarioType": "参数场景",
          "scenarioTitle": "自定义对话框",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "ui_generator.create_dialog",
          "fullPayload": "{\"action\":\"create_dialog\",\"title\":\"退出游戏?\",\"content\":\"确定要退出吗?\"}",
          "inputText": "title=退出游戏?；content=确定要退出吗?",
          "executionStep": "调用 ui_generator.create_dialog",
          "parameterNarrative": "这次请把 title 设为“退出游戏?”，把 content 设为“确定要退出吗?”。",
          "verificationFocus": "生成对话框含自定义标题和内容",
          "expectedText": "生成对话框含自定义标题和内容"
        },
        "naturalLanguageTest": "请通过 MCP 调用 ui_generator 工具，执行 create_dialog 动作，处理“自定义对话框”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 title 设为“退出游戏?”，把 content 设为“确定要退出吗?”。调用完成后重点检查：生成对话框含自定义标题和内容。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 356,
      "tool": "ui_generator",
      "action": "create_inventory",
      "title": "一键背包",
      "input": {
        "action": "create_inventory",
        "columns": 4,
        "itemCount": 16
      },
      "expected": "生成 4 列 16 格背包+详情面板",
      "note": "",
      "phase": "UI 与参考图",
      "priority": "P2",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 ui_generator 工具，执行 create_inventory 动作，处理“一键背包”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 columns 设为 4，把 itemCount 设为 16。调用完成后重点检查：生成 4 列 16 格背包+详情面板。",
          "actionGoal": "执行 ui_generator.create_inventory",
          "scenarioType": "参数场景",
          "scenarioTitle": "一键背包",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "ui_generator.create_inventory",
          "fullPayload": "{\"action\":\"create_inventory\",\"columns\":4,\"itemCount\":16}",
          "inputText": "columns=4；itemCount=16",
          "executionStep": "调用 ui_generator.create_inventory",
          "parameterNarrative": "这次请把 columns 设为 4，把 itemCount 设为 16。",
          "verificationFocus": "生成 4 列 16 格背包+详情面板",
          "expectedText": "生成 4 列 16 格背包+详情面板"
        },
        "naturalLanguageTest": "请通过 MCP 调用 ui_generator 工具，执行 create_inventory 动作，处理“一键背包”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 columns 设为 4，把 itemCount 设为 16。调用完成后重点检查：生成 4 列 16 格背包+详情面板。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 357,
      "tool": "ui_generator",
      "action": "create_custom_ui",
      "title": "自定义 UI",
      "input": {
        "action": "create_custom_ui",
        "prompt": "一个带标签页和滚动列表的界面"
      },
      "expected": "解析关键词→生成 TabBar + ScrollView",
      "note": "",
      "phase": "UI 与参考图",
      "priority": "P2",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 ui_generator 工具，执行 create_custom_ui 动作，处理“自定义 UI”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 prompt 设为“一个带标签页和滚动列表的界面”。调用完成后重点检查：解析关键词→生成 TabBar + ScrollView。",
          "actionGoal": "执行 ui_generator.create_custom_ui",
          "scenarioType": "参数场景",
          "scenarioTitle": "自定义 UI",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "ui_generator.create_custom_ui",
          "fullPayload": "{\"action\":\"create_custom_ui\",\"prompt\":\"一个带标签页和滚动列表的界面\"}",
          "inputText": "prompt=一个带标签页和滚动列表的界面",
          "executionStep": "调用 ui_generator.create_custom_ui",
          "parameterNarrative": "这次请把 prompt 设为“一个带标签页和滚动列表的界面”。",
          "verificationFocus": "解析关键词→生成 TabBar + ScrollView",
          "expectedText": "解析关键词→生成 TabBar + ScrollView"
        },
        "naturalLanguageTest": "请通过 MCP 调用 ui_generator 工具，执行 create_custom_ui 动作，处理“自定义 UI”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 prompt 设为“一个带标签页和滚动列表的界面”。调用完成后重点检查：解析关键词→生成 TabBar + ScrollView。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 358,
      "tool": "ui_generator",
      "action": "create_custom_ui",
      "title": "缺少 prompt",
      "input": {
        "action": "create_custom_ui"
      },
      "expected": "返回错误: 缺少 prompt",
      "note": "参数校验",
      "phase": "UI 与参考图",
      "priority": "P2",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 ui_generator 工具，执行 create_custom_ui 动作，处理“缺少 prompt”这个通用场景。这个场景通常用于参数校验。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回错误: 缺少 prompt。",
          "actionGoal": "执行 ui_generator.create_custom_ui",
          "scenarioType": "通用场景",
          "scenarioTitle": "缺少 prompt",
          "scenarioCondition": "参数校验",
          "scenarioNarrative": "这个场景通常用于参数校验。",
          "mcpCall": "ui_generator.create_custom_ui",
          "fullPayload": "{\"action\":\"create_custom_ui\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 ui_generator.create_custom_ui",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回错误: 缺少 prompt",
          "expectedText": "返回错误: 缺少 prompt"
        },
        "naturalLanguageTest": "请通过 MCP 调用 ui_generator 工具，执行 create_custom_ui 动作，处理“缺少 prompt”这个通用场景。这个场景通常用于参数校验。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回错误: 缺少 prompt。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 359,
      "tool": "project_linter",
      "action": "check_all",
      "title": "全量检查",
      "input": {
        "action": "check_all"
      },
      "expected": "5 步: 3 个场景查询 + 1 资源查询 + 1 汇总分析",
      "note": "Pro Phase 4",
      "phase": "质量与诊断",
      "priority": "P2",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 project_linter 工具，执行 check_all 动作，处理“全量检查”这个通用场景。这个场景通常用于Pro Phase 4。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：5 步: 3 个场景查询 + 1 资源查询 + 1 汇总分析。",
          "actionGoal": "执行 project_linter.check_all",
          "scenarioType": "通用场景",
          "scenarioTitle": "全量检查",
          "scenarioCondition": "Pro Phase 4",
          "scenarioNarrative": "这个场景通常用于Pro Phase 4。",
          "mcpCall": "project_linter.check_all",
          "fullPayload": "{\"action\":\"check_all\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 project_linter.check_all",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "5 步: 3 个场景查询 + 1 资源查询 + 1 汇总分析",
          "expectedText": "5 步: 3 个场景查询 + 1 资源查询 + 1 汇总分析"
        },
        "naturalLanguageTest": "请通过 MCP 调用 project_linter 工具，执行 check_all 动作，处理“全量检查”这个通用场景。这个场景通常用于Pro Phase 4。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：5 步: 3 个场景查询 + 1 资源查询 + 1 汇总分析。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 360,
      "tool": "project_linter",
      "action": "check_naming",
      "title": "命名检查",
      "input": {
        "action": "check_naming"
      },
      "expected": "返回不符合 PascalCase/kebab-case 的项",
      "note": "",
      "phase": "质量与诊断",
      "priority": "P2",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 project_linter 工具，执行 check_naming 动作，处理“命名检查”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回不符合 PascalCase/kebab-case 的项。",
          "actionGoal": "执行 project_linter.check_naming",
          "scenarioType": "通用场景",
          "scenarioTitle": "命名检查",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "project_linter.check_naming",
          "fullPayload": "{\"action\":\"check_naming\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 project_linter.check_naming",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回不符合 PascalCase/kebab-case 的项",
          "expectedText": "返回不符合 PascalCase/kebab-case 的项"
        },
        "naturalLanguageTest": "请通过 MCP 调用 project_linter 工具，执行 check_naming 动作，处理“命名检查”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回不符合 PascalCase/kebab-case 的项。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 361,
      "tool": "project_linter",
      "action": "check_hierarchy",
      "title": "层级检查",
      "input": {
        "action": "check_hierarchy"
      },
      "expected": "返回深度>10 或子节点>50 的节点",
      "note": "",
      "phase": "质量与诊断",
      "priority": "P2",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 project_linter 工具，执行 check_hierarchy 动作，处理“层级检查”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回深度>10 或子节点>50 的节点。",
          "actionGoal": "执行 project_linter.check_hierarchy",
          "scenarioType": "通用场景",
          "scenarioTitle": "层级检查",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "project_linter.check_hierarchy",
          "fullPayload": "{\"action\":\"check_hierarchy\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 project_linter.check_hierarchy",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回深度>10 或子节点>50 的节点",
          "expectedText": "返回深度>10 或子节点>50 的节点"
        },
        "naturalLanguageTest": "请通过 MCP 调用 project_linter 工具，执行 check_hierarchy 动作，处理“层级检查”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回深度>10 或子节点>50 的节点。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 362,
      "tool": "project_linter",
      "action": "check_components",
      "title": "组件检查",
      "input": {
        "action": "check_components"
      },
      "expected": "返回空 Sprite、缺 RigidBody 等问题",
      "note": "",
      "phase": "质量与诊断",
      "priority": "P2",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 project_linter 工具，执行 check_components 动作，处理“组件检查”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回空 Sprite、缺 RigidBody 等问题。",
          "actionGoal": "执行 project_linter.check_components",
          "scenarioType": "通用场景",
          "scenarioTitle": "组件检查",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "project_linter.check_components",
          "fullPayload": "{\"action\":\"check_components\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 project_linter.check_components",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回空 Sprite、缺 RigidBody 等问题",
          "expectedText": "返回空 Sprite、缺 RigidBody 等问题"
        },
        "naturalLanguageTest": "请通过 MCP 调用 project_linter 工具，执行 check_components 动作，处理“组件检查”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回空 Sprite、缺 RigidBody 等问题。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 363,
      "tool": "project_linter",
      "action": "check_assets",
      "title": "资源检查",
      "input": {
        "action": "check_assets"
      },
      "expected": "返回未使用资源和命名违规",
      "note": "",
      "phase": "质量与诊断",
      "priority": "P2",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 project_linter 工具，执行 check_assets 动作，处理“资源检查”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回未使用资源和命名违规。",
          "actionGoal": "执行 project_linter.check_assets",
          "scenarioType": "通用场景",
          "scenarioTitle": "资源检查",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "project_linter.check_assets",
          "fullPayload": "{\"action\":\"check_assets\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 project_linter.check_assets",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回未使用资源和命名违规",
          "expectedText": "返回未使用资源和命名违规"
        },
        "naturalLanguageTest": "请通过 MCP 调用 project_linter 工具，执行 check_assets 动作，处理“资源检查”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回未使用资源和命名违规。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 364,
      "tool": "project_linter",
      "action": "check_performance",
      "title": "性能检查",
      "input": {
        "action": "check_performance"
      },
      "expected": "返回节点数/DrawCall/纹理尺寸超标项",
      "note": "",
      "phase": "质量与诊断",
      "priority": "P2",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 project_linter 工具，执行 check_performance 动作，处理“性能检查”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回节点数/DrawCall/纹理尺寸超标项。",
          "actionGoal": "执行 project_linter.check_performance",
          "scenarioType": "通用场景",
          "scenarioTitle": "性能检查",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "project_linter.check_performance",
          "fullPayload": "{\"action\":\"check_performance\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 project_linter.check_performance",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回节点数/DrawCall/纹理尺寸超标项",
          "expectedText": "返回节点数/DrawCall/纹理尺寸超标项"
        },
        "naturalLanguageTest": "请通过 MCP 调用 project_linter 工具，执行 check_performance 动作，处理“性能检查”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回节点数/DrawCall/纹理尺寸超标项。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 365,
      "tool": "project_linter",
      "action": "auto_fix_naming",
      "title": "自动修复命名",
      "input": {
        "action": "auto_fix_naming"
      },
      "expected": "批量重命名违规节点",
      "note": "",
      "phase": "质量与诊断",
      "priority": "P2",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 project_linter 工具，执行 auto_fix_naming 动作，处理“自动修复命名”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：批量重命名违规节点。",
          "actionGoal": "执行 project_linter.auto_fix_naming",
          "scenarioType": "通用场景",
          "scenarioTitle": "自动修复命名",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "project_linter.auto_fix_naming",
          "fullPayload": "{\"action\":\"auto_fix_naming\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 project_linter.auto_fix_naming",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "批量重命名违规节点",
          "expectedText": "批量重命名违规节点"
        },
        "naturalLanguageTest": "请通过 MCP 调用 project_linter 工具，执行 auto_fix_naming 动作，处理“自动修复命名”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：批量重命名违规节点。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 366,
      "tool": "project_linter",
      "action": "set_rules",
      "title": "设置自定义规则",
      "input": {
        "action": "set_rules",
        "rules": {
          "naming": {
            "nodePattern": "camelCase"
          }
        }
      },
      "expected": "规则保存到 .mcp-lint-rules.json",
      "note": "",
      "phase": "质量与诊断",
      "priority": "P2",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 project_linter 工具，执行 set_rules 动作，处理“设置自定义规则”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请传入 rules={\"naming\":{\"nodePattern\":\"camelCase\"}}。调用完成后重点检查：规则保存到 .mcp-lint-rules.json。",
          "actionGoal": "执行 project_linter.set_rules",
          "scenarioType": "参数场景",
          "scenarioTitle": "设置自定义规则",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "project_linter.set_rules",
          "fullPayload": "{\"action\":\"set_rules\",\"rules\":{\"naming\":{\"nodePattern\":\"camelCase\"}}}",
          "inputText": "rules={\"naming\":{\"nodePattern\":\"camelCase\"}}",
          "executionStep": "调用 project_linter.set_rules",
          "parameterNarrative": "这次请传入 rules={\"naming\":{\"nodePattern\":\"camelCase\"}}。",
          "verificationFocus": "规则保存到 .mcp-lint-rules.json",
          "expectedText": "规则保存到 .mcp-lint-rules.json"
        },
        "naturalLanguageTest": "请通过 MCP 调用 project_linter 工具，执行 set_rules 动作，处理“设置自定义规则”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请传入 rules={\"naming\":{\"nodePattern\":\"camelCase\"}}。调用完成后重点检查：规则保存到 .mcp-lint-rules.json。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 367,
      "tool": "project_linter",
      "action": "set_rules",
      "title": "缺少 rules",
      "input": {
        "action": "set_rules"
      },
      "expected": "返回错误: 缺少 rules",
      "note": "参数校验",
      "phase": "质量与诊断",
      "priority": "P2",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 project_linter 工具，执行 set_rules 动作，处理“缺少 rules”这个通用场景。这个场景通常用于参数校验。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回错误: 缺少 rules。",
          "actionGoal": "执行 project_linter.set_rules",
          "scenarioType": "通用场景",
          "scenarioTitle": "缺少 rules",
          "scenarioCondition": "参数校验",
          "scenarioNarrative": "这个场景通常用于参数校验。",
          "mcpCall": "project_linter.set_rules",
          "fullPayload": "{\"action\":\"set_rules\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 project_linter.set_rules",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回错误: 缺少 rules",
          "expectedText": "返回错误: 缺少 rules"
        },
        "naturalLanguageTest": "请通过 MCP 调用 project_linter 工具，执行 set_rules 动作，处理“缺少 rules”这个通用场景。这个场景通常用于参数校验。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回错误: 缺少 rules。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 368,
      "tool": "operation_log",
      "action": "get_history",
      "title": "查看历史",
      "input": {
        "action": "get_history"
      },
      "expected": "返回最近 50 条操作记录",
      "note": "Pro Phase 4",
      "phase": "环境与连通",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 operation_log 工具，执行 get_history 动作，处理“查看历史”这个通用场景。这个场景通常用于Pro Phase 4。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回最近 50 条操作记录。",
          "actionGoal": "执行 operation_log.get_history",
          "scenarioType": "通用场景",
          "scenarioTitle": "查看历史",
          "scenarioCondition": "Pro Phase 4",
          "scenarioNarrative": "这个场景通常用于Pro Phase 4。",
          "mcpCall": "operation_log.get_history",
          "fullPayload": "{\"action\":\"get_history\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 operation_log.get_history",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回最近 50 条操作记录",
          "expectedText": "返回最近 50 条操作记录"
        },
        "naturalLanguageTest": "请通过 MCP 调用 operation_log 工具，执行 get_history 动作，处理“查看历史”这个通用场景。这个场景通常用于Pro Phase 4。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回最近 50 条操作记录。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 369,
      "tool": "operation_log",
      "action": "get_history",
      "title": "过滤历史",
      "input": {
        "action": "get_history",
        "filter": {
          "tool": "scene_operation",
          "limit": 20
        }
      },
      "expected": "返回最近 20 条 scene_operation 操作",
      "note": "",
      "phase": "环境与连通",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 operation_log 工具，执行 get_history 动作，处理“过滤历史”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请传入 filter={\"tool\":\"scene_operation\",\"limit\":20}。调用完成后重点检查：返回最近 20 条 scene_operation 操作。",
          "actionGoal": "执行 operation_log.get_history",
          "scenarioType": "参数场景",
          "scenarioTitle": "过滤历史",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "operation_log.get_history",
          "fullPayload": "{\"action\":\"get_history\",\"filter\":{\"tool\":\"scene_operation\",\"limit\":20}}",
          "inputText": "filter={\"tool\":\"scene_operation\",\"limit\":20}",
          "executionStep": "调用 operation_log.get_history",
          "parameterNarrative": "这次请传入 filter={\"tool\":\"scene_operation\",\"limit\":20}。",
          "verificationFocus": "返回最近 20 条 scene_operation 操作",
          "expectedText": "返回最近 20 条 scene_operation 操作"
        },
        "naturalLanguageTest": "请通过 MCP 调用 operation_log 工具，执行 get_history 动作，处理“过滤历史”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请传入 filter={\"tool\":\"scene_operation\",\"limit\":20}。调用完成后重点检查：返回最近 20 条 scene_operation 操作。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 370,
      "tool": "operation_log",
      "action": "get_stats",
      "title": "操作统计",
      "input": {
        "action": "get_stats"
      },
      "expected": "返回按工具/action 分组的统计",
      "note": "",
      "phase": "环境与连通",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 operation_log 工具，执行 get_stats 动作，处理“操作统计”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回按工具/action 分组的统计。",
          "actionGoal": "执行 operation_log.get_stats",
          "scenarioType": "通用场景",
          "scenarioTitle": "操作统计",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "operation_log.get_stats",
          "fullPayload": "{\"action\":\"get_stats\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 operation_log.get_stats",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回按工具/action 分组的统计",
          "expectedText": "返回按工具/action 分组的统计"
        },
        "naturalLanguageTest": "请通过 MCP 调用 operation_log 工具，执行 get_stats 动作，处理“操作统计”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回按工具/action 分组的统计。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 371,
      "tool": "operation_log",
      "action": "export_log",
      "title": "导出 JSON",
      "input": {
        "action": "export_log",
        "format": "json"
      },
      "expected": "操作日志保存到 assets/mcp-logs/",
      "note": "",
      "phase": "环境与连通",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 operation_log 工具，执行 export_log 动作，处理“导出 JSON”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 format 设为“json”。调用完成后重点检查：操作日志保存到 assets/mcp-logs/。",
          "actionGoal": "执行 operation_log.export_log",
          "scenarioType": "参数场景",
          "scenarioTitle": "导出 JSON",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "operation_log.export_log",
          "fullPayload": "{\"action\":\"export_log\",\"format\":\"json\"}",
          "inputText": "format=json",
          "executionStep": "调用 operation_log.export_log",
          "parameterNarrative": "这次请把 format 设为“json”。",
          "verificationFocus": "操作日志保存到 assets/mcp-logs/",
          "expectedText": "操作日志保存到 assets/mcp-logs/"
        },
        "naturalLanguageTest": "请通过 MCP 调用 operation_log 工具，执行 export_log 动作，处理“导出 JSON”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 format 设为“json”。调用完成后重点检查：操作日志保存到 assets/mcp-logs/。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 372,
      "tool": "operation_log",
      "action": "export_script",
      "title": "导出脚本",
      "input": {
        "action": "export_script"
      },
      "expected": "生成可回放的 TypeScript 脚本",
      "note": "",
      "phase": "环境与连通",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 operation_log 工具，执行 export_script 动作，处理“导出脚本”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：生成可回放的 TypeScript 脚本。",
          "actionGoal": "执行 operation_log.export_script",
          "scenarioType": "通用场景",
          "scenarioTitle": "导出脚本",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于做通用能力验证。",
          "mcpCall": "operation_log.export_script",
          "fullPayload": "{\"action\":\"export_script\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 operation_log.export_script",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "生成可回放的 TypeScript 脚本",
          "expectedText": "生成可回放的 TypeScript 脚本"
        },
        "naturalLanguageTest": "请通过 MCP 调用 operation_log 工具，执行 export_script 动作，处理“导出脚本”这个通用场景。这个场景用于做通用能力验证。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：生成可回放的 TypeScript 脚本。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 373,
      "tool": "operation_log",
      "action": "replay_last",
      "title": "回放最近 5 步",
      "input": {
        "action": "replay_last",
        "count": 5
      },
      "expected": "重放最近 5 个操作",
      "note": "",
      "phase": "环境与连通",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 operation_log 工具，执行 replay_last 动作，处理“回放最近 5 步”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 count 设为 5。调用完成后重点检查：重放最近 5 个操作。",
          "actionGoal": "执行 operation_log.replay_last",
          "scenarioType": "参数场景",
          "scenarioTitle": "回放最近 5 步",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "operation_log.replay_last",
          "fullPayload": "{\"action\":\"replay_last\",\"count\":5}",
          "inputText": "count=5",
          "executionStep": "调用 operation_log.replay_last",
          "parameterNarrative": "这次请把 count 设为 5。",
          "verificationFocus": "重放最近 5 个操作",
          "expectedText": "重放最近 5 个操作"
        },
        "naturalLanguageTest": "请通过 MCP 调用 operation_log 工具，执行 replay_last 动作，处理“回放最近 5 步”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 count 设为 5。调用完成后重点检查：重放最近 5 个操作。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 374,
      "tool": "operation_log",
      "action": "replay_last",
      "title": "默认回放 10 步",
      "input": {
        "action": "replay_last"
      },
      "expected": "重放最近 10 个操作",
      "note": "",
      "phase": "环境与连通",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 operation_log 工具，执行 replay_last 动作，处理“默认回放 10 步”这个状态场景。这个场景用于验证当前对象状态或默认状态下的表现。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：重放最近 10 个操作。",
          "actionGoal": "执行 operation_log.replay_last",
          "scenarioType": "状态场景",
          "scenarioTitle": "默认回放 10 步",
          "scenarioCondition": "无额外前置条件",
          "scenarioNarrative": "这个场景用于验证当前对象状态或默认状态下的表现。",
          "mcpCall": "operation_log.replay_last",
          "fullPayload": "{\"action\":\"replay_last\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 operation_log.replay_last",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "重放最近 10 个操作",
          "expectedText": "重放最近 10 个操作"
        },
        "naturalLanguageTest": "请通过 MCP 调用 operation_log 工具，执行 replay_last 动作，处理“默认回放 10 步”这个状态场景。这个场景用于验证当前对象状态或默认状态下的表现。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：重放最近 10 个操作。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 375,
      "tool": "operation_log",
      "action": "replay_from_log",
      "title": "从日志回放",
      "input": {
        "action": "replay_from_log",
        "log": [
          {
            "tool": "scene_operation",
            "action": "create_node"
          }
        ]
      },
      "expected": "按日志逐条重放",
      "note": "",
      "phase": "环境与连通",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 operation_log 工具，执行 replay_from_log 动作，处理“从日志回放”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请传入 log=[{\"tool\":\"scene_operation\",\"action\":\"create_node\"}]。调用完成后重点检查：按日志逐条重放。",
          "actionGoal": "执行 operation_log.replay_from_log",
          "scenarioType": "参数场景",
          "scenarioTitle": "从日志回放",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "operation_log.replay_from_log",
          "fullPayload": "{\"action\":\"replay_from_log\",\"log\":[{\"tool\":\"scene_operation\",\"action\":\"create_node\"}]}",
          "inputText": "log=[{\"tool\":\"scene_operation\",\"action\":\"create_node\"}]",
          "executionStep": "调用 operation_log.replay_from_log",
          "parameterNarrative": "这次请传入 log=[{\"tool\":\"scene_operation\",\"action\":\"create_node\"}]。",
          "verificationFocus": "按日志逐条重放",
          "expectedText": "按日志逐条重放"
        },
        "naturalLanguageTest": "请通过 MCP 调用 operation_log 工具，执行 replay_from_log 动作，处理“从日志回放”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请传入 log=[{\"tool\":\"scene_operation\",\"action\":\"create_node\"}]。调用完成后重点检查：按日志逐条重放。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 376,
      "tool": "operation_log",
      "action": "replay_from_log",
      "title": "缺少 log",
      "input": {
        "action": "replay_from_log"
      },
      "expected": "返回错误: 缺少 log",
      "note": "参数校验",
      "phase": "环境与连通",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 operation_log 工具，执行 replay_from_log 动作，处理“缺少 log”这个通用场景。这个场景通常用于参数校验。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回错误: 缺少 log。",
          "actionGoal": "执行 operation_log.replay_from_log",
          "scenarioType": "通用场景",
          "scenarioTitle": "缺少 log",
          "scenarioCondition": "参数校验",
          "scenarioNarrative": "这个场景通常用于参数校验。",
          "mcpCall": "operation_log.replay_from_log",
          "fullPayload": "{\"action\":\"replay_from_log\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 operation_log.replay_from_log",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回错误: 缺少 log",
          "expectedText": "返回错误: 缺少 log"
        },
        "naturalLanguageTest": "请通过 MCP 调用 operation_log 工具，执行 replay_from_log 动作，处理“缺少 log”这个通用场景。这个场景通常用于参数校验。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回错误: 缺少 log。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 377,
      "tool": "operation_log",
      "action": "clear_history",
      "title": "清空历史",
      "input": {
        "action": "clear_history",
        "confirmDangerous": true
      },
      "expected": "操作历史已清空",
      "note": "",
      "phase": "环境与连通",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 operation_log 工具，执行 clear_history 动作，处理“清空历史”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 confirmDangerous 设为 true。调用完成后重点检查：操作历史已清空。",
          "actionGoal": "执行 operation_log.clear_history",
          "scenarioType": "参数场景",
          "scenarioTitle": "清空历史",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "operation_log.clear_history",
          "fullPayload": "{\"action\":\"clear_history\",\"confirmDangerous\":true}",
          "inputText": "confirmDangerous=true",
          "executionStep": "调用 operation_log.clear_history",
          "parameterNarrative": "这次请把 confirmDangerous 设为 true。",
          "verificationFocus": "操作历史已清空",
          "expectedText": "操作历史已清空"
        },
        "naturalLanguageTest": "请通过 MCP 调用 operation_log 工具，执行 clear_history 动作，处理“清空历史”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 confirmDangerous 设为 true。调用完成后重点检查：操作历史已清空。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 378,
      "tool": "operation_log",
      "action": "clear_history",
      "title": "未确认清空",
      "input": {
        "action": "clear_history"
      },
      "expected": "返回错误: 需要 confirmDangerous=true",
      "note": "危险操作拦截",
      "phase": "环境与连通",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 operation_log 工具，执行 clear_history 动作，处理“未确认清空”这个通用场景。这个场景通常用于危险操作拦截。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回错误: 需要 confirmDangerous=true。",
          "actionGoal": "执行 operation_log.clear_history",
          "scenarioType": "通用场景",
          "scenarioTitle": "未确认清空",
          "scenarioCondition": "危险操作拦截",
          "scenarioNarrative": "这个场景通常用于危险操作拦截。",
          "mcpCall": "operation_log.clear_history",
          "fullPayload": "{\"action\":\"clear_history\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 operation_log.clear_history",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回错误: 需要 confirmDangerous=true",
          "expectedText": "返回错误: 需要 confirmDangerous=true"
        },
        "naturalLanguageTest": "请通过 MCP 调用 operation_log 工具，执行 clear_history 动作，处理“未确认清空”这个通用场景。这个场景通常用于危险操作拦截。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回错误: 需要 confirmDangerous=true。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 379,
      "tool": "operation_log",
      "action": "bookmark",
      "title": "添加书签",
      "input": {
        "action": "bookmark",
        "label": "before-refactor"
      },
      "expected": "书签 before-refactor 已添加",
      "note": "",
      "phase": "环境与连通",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 operation_log 工具，执行 bookmark 动作，处理“添加书签”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 label 设为“before-refactor”。调用完成后重点检查：书签 before-refactor 已添加。",
          "actionGoal": "执行 operation_log.bookmark",
          "scenarioType": "参数场景",
          "scenarioTitle": "添加书签",
          "scenarioCondition": "使用该参数组合执行一次调用",
          "scenarioNarrative": "这个场景通常用于使用该参数组合执行一次调用。",
          "mcpCall": "operation_log.bookmark",
          "fullPayload": "{\"action\":\"bookmark\",\"label\":\"before-refactor\"}",
          "inputText": "label=before-refactor",
          "executionStep": "调用 operation_log.bookmark",
          "parameterNarrative": "这次请把 label 设为“before-refactor”。",
          "verificationFocus": "书签 before-refactor 已添加",
          "expectedText": "书签 before-refactor 已添加"
        },
        "naturalLanguageTest": "请通过 MCP 调用 operation_log 工具，执行 bookmark 动作，处理“添加书签”这个参数场景。这个场景通常用于使用该参数组合执行一次调用。这次请把 label 设为“before-refactor”。调用完成后重点检查：书签 before-refactor 已添加。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    },
    {
      "id": 380,
      "tool": "operation_log",
      "action": "bookmark",
      "title": "缺少 label",
      "input": {
        "action": "bookmark"
      },
      "expected": "返回错误: 缺少 label",
      "note": "参数校验",
      "phase": "环境与连通",
      "priority": "P3",
      "edition": "pro",
      "aiDoc": {
        "toolSummary": "",
        "zhToolSummary": "",
        "actionDescription": "",
        "zhActionDescription": "",
        "sourceFile": "",
        "matched": false,
        "toolFound": false,
        "naturalLanguageSpec": {
          "aiInstruction": "请通过 MCP 调用 operation_log 工具，执行 bookmark 动作，处理“缺少 label”这个通用场景。这个场景通常用于参数校验。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回错误: 缺少 label。",
          "actionGoal": "执行 operation_log.bookmark",
          "scenarioType": "通用场景",
          "scenarioTitle": "缺少 label",
          "scenarioCondition": "参数校验",
          "scenarioNarrative": "这个场景通常用于参数校验。",
          "mcpCall": "operation_log.bookmark",
          "fullPayload": "{\"action\":\"bookmark\"}",
          "inputText": "无额外参数",
          "executionStep": "调用 operation_log.bookmark",
          "parameterNarrative": "这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。",
          "verificationFocus": "返回错误: 缺少 label",
          "expectedText": "返回错误: 缺少 label"
        },
        "naturalLanguageTest": "请通过 MCP 调用 operation_log 工具，执行 bookmark 动作，处理“缺少 label”这个通用场景。这个场景通常用于参数校验。这次不需要额外业务参数，直接让 AI 发起 MCP 调用即可。调用完成后重点检查：返回错误: 缺少 label。"
      },
      "aiBaseline": {
        "status": "fail",
        "duration": "",
        "note": "来自 tests/test-report.json，自动化失败：HTTP 429: Too Many Requests"
      }
    }
  ]
};
