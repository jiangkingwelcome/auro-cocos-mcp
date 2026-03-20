# Aura 对外可信资产（功能矩阵 + 兼容矩阵 + 基准数据）

> 快照日期：2026-03-20  
> 数据来源：`docs/trust-metrics.json`、`COMPATIBILITY.md`、`package.json`、本地质量门禁实测

## 1) 功能矩阵（统一口径）

### 1.1 社区版（JS 运行时，已发布）

**总览：17 tools / 188 actions**

| Tool | Actions | 状态 |
|---|---:|---|
| bridge_status | 1 | 已发布 |
| scene_query | 50 | 已发布 |
| scene_operation | 39 | 已发布 |
| asset_operation | 17 | 已发布 |
| editor_action | 38 | 已发布 |
| preferences | 7 | 已发布 |
| broadcast | 5 | 已发布 |
| tool_management | 4 | 已发布 |
| create_prefab_atomic | 1 | 已发布 |
| import_and_apply_texture | 1 | 已发布 |
| setup_ui_layout | 1 | 已发布 |
| create_tween_animation_atomic | 1 | 已发布 |
| auto_fit_physics_collider | 1 | 已发布 |
| execute_script | 1 | 已发布 |
| register_custom_macro | 1 | 已发布 |
| animation_tool | 10 | 已发布 |
| physics_tool | 10 | 已发布 |

### 1.2 Pro（Native 模块注册快照）

**Native 代码注册总量：28 tools / 408 actions（含后续 phase）**

| Phase | Tool 数 | Action 数 | 说明 |
|---|---:|---:|---|
| Phase 1 | 12 | 58 | Pro 独占基础能力（engine/script/animation/physics/reference/atomic） |
| Phase 2 | 7 | 279 | 社区能力 Native 重写与扩展 |
| Phase 3 | 3 | 24 | AI 工具（scene_generator/batch_engine/scene_audit） |
| Phase 4 | 5 | 37 | 高级工作流能力（脚手架/UI/动画工作流等） |
| Phase 5 | 1 | 10 | 知识库能力 |

### 1.3 对外承诺口径（用于销售/官网）

- 社区版：**188 actions**（JS，开源）
- Pro 版：**270+ 生产可用 actions（Phase 1-3）**
- Native 注册快照：**最高 408 actions（含 Phase 4-5，分阶段发布）**

## 2) 兼容矩阵

### 2.1 Cocos Creator

| 版本 | 级别 | 状态 | 说明 |
|---|---|---|---|
| >= 3.8 | full | ✅ | 主开发目标，完整能力 |
| 3.6 - 3.7 | supported | ✅ | 已支持，存在少量 IPC 名差异由 fallback 处理 |
| 3.4 - 3.5 | best-effort | ⚠️ | 核心能力可用；部分高级 IPC 可能不可用 |
| < 3.4 | unsupported | ❌ | 不支持 |

补充：
- `package.json` 声明编辑器要求为 `>=3.6.0`（商店分发口径）
- 3.7+ 扩展需位于项目 `extensions/`（安装脚本会处理软链接/映射）

### 2.2 操作系统

| OS | 状态 |
|---|---|
| Windows 10/11 | ✅ |
| macOS (Intel/Apple Silicon) | ✅ |
| Linux | ⚠️（best-effort） |

### 2.3 MCP 客户端

| 类别 | 状态 | 说明 |
|---|---|---|
| 一键配置客户端 | ✅ | Cursor、Windsurf、Claude Desktop、Trae、Kiro、Antigravity、Gemini CLI、Codex、Claude Code、CodeBuddy、Comate |
| VS Code 系客户端 | ⚠️ | 需手动写 `.vscode/mcp.json` |
| MCP 2025 规范客户端 | ✅ | 支持 HTTP/stdio（shim 自动探测 framing） |

## 3) 基准数据（本地可复现）

### 3.1 质量门禁结果（2026-03-20）

| 项目 | 结果 |
|---|---|
| `npm run typecheck` | ✅ 通过 |
| `npm run lint` | ✅ 0 error / 7 warning |
| `npm run test` | ✅ 25 files / 601 passed / 0 failed / 0 skipped |

### 3.2 执行时长（同机实测）

| 命令 | 用时 |
|---|---:|
| `npm run typecheck` | 3.04s |
| `npm run lint` | 3.68s |
| `npm run test` | 16.25s |

### 3.3 跳过用例压缩

- 历史基线：104 skipped
- 当前状态：**0 skipped**
- 做法：将历史 `it.skip/describe.skip` 转为社区版边界断言（明确 Pro action 在社区版返回 isError 或工具未注册）

## 4) 复现命令

```bash
# 1) 生成 Vitest JSON 报告
npx vitest run --reporter=json --outputFile .vitest-report.json

# 2) 采集功能矩阵/测试统计（输出 docs/trust-metrics.json）
node scripts/collect-trust-metrics.mjs

# 3) 质量门禁
npm run typecheck
npm run lint
npm run test
```

## 5) 口径治理规则

1. 对外页、README、商业文档引用本文件为准，不单独维护分叉数字。  
2. 版本发布前先更新 `docs/trust-metrics.json`，再同步 README/商业文档。  
3. 若 Pro 某能力仅“Native 已注册但未公开发布”，状态必须写“分阶段发布”，不得写“已全面上线”。
