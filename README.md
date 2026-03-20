# Aura for Cocos Creator

<div align="center">
  <img src="assets/aura-wordmark.png" alt="Aura Logo" width="400">
</div>

[English](#english) | [中文](#中文)

---

<a id="english"></a>

## English

Standalone Cocos Creator editor plugin that provides a full-featured MCP (Model Context Protocol) service directly from the plugin process — enabling AI coding assistants to query, modify, and control your Cocos project in real time.

**Community: 17 tools / 188 actions · Pro Native: up to 28 tools / 408 actions (phased)**

### Editions

| Edition | Price | Content |
|---------|-------|---------|
| **Community** | Free | 188 actions, JS implementation, open source (BSL 1.1) |
| **Pro** | ¥99/year ($15/year) | 270+ production actions (Phase 1-3), Rust binary |
| **Enterprise** | ¥999/year ($150/year) | Pro + private deployment + SLA + customization |

### Architecture

```
┌──────────────────────────────────────────────────────┐
│  Cocos Creator Editor (>= 3.6.0)                     │
│  ┌────────────────────────────────────────────────┐  │
│  │  aura-for-cocos plugin                       │  │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │  │
│  │  │ HTTP API │  │ MCP Host │  │ Scene Script│  │  │
│  │  │ :7779    │  │ /mcp     │  │ (runtime)   │  │  │
│  │  └────┬─────┘  └────┬─────┘  └──────┬──────┘  │  │
│  │       └──────────────┼───────────────┘         │  │
│  │       Community: 17 tools / 188 actions         │  │
│  │       Pro Native (phased): up to 28 / 408       │  │
│  └────────────────────────────────────────────────┘  │
│                         ▲                            │
│  ┌──────────────────────┼─────────────────────────┐  │
│  │  Panel (5 Tabs)      │                         │  │
│  │  Status │ Control │ Connect │ Settings │ Guide │  │
│  └──────────────────────┼─────────────────────────┘  │
└─────────────────────────┼────────────────────────────┘
                          │ HTTP / stdio / TOML / CLI
          ┌───────────┬───┼───┬───────────┐
          ▼           ▼   ▼   ▼           ▼
       Cursor     Windsurf  Claude Desktop  Trae
       Kiro       Antigravity  Gemini CLI   Codex
       Claude Code  CodeBuddy  Comate
```

### Features

#### Core
- In-process MCP host at `http://127.0.0.1:<port>/mcp`
- Stdio compatibility shim for clients that only support stdio transport
- **Funnel architecture**: Community ships 17 tools / 188 actions; Pro Native modules register up to 28 / 408 (phased)
- **User-configurable security**: rate limit, loopback restriction, body size limit, auto-rollback

#### AI-Native Design
- **AI behavioral rules**: 5 mandatory constraints enforced at JSON Schema level
- **167+ parameter descriptions** with detailed usage guidance
- **Component name auto-normalization**: `sprite` → `Sprite`, `scrollview` → `ScrollView`
- **Dangerous action interception**: `destroy_node`, `clear_children` require explicit confirmation
- **Error self-healing**: Error responses include `suggestion` field for AI auto-recovery

#### Tool Overview

| Category (Community Runtime) | Actions | Description |
|----------|---------|-------------|
| Scene Queries | 50 | Tree, search, introspection, validation, spatial queries |
| Scene Operations | 39 | CRUD, transform, components, prefabs, UI, camera/material extensions |
| Asset Management | 17 | CRUD, discovery, meta control, URL/UUID conversion |
| Editor Control | 38 | Scene lifecycle, selection, console, build, preview, gizmo/view basics |
| Macro Atomic Tools | 5 | High-cohesion multi-step operations with auto-rollback |
| Script Utilities | 2 | `execute_script`, `register_custom_macro` |
| Animation | 10 | Create clips, playback control, crossfade |
| Physics | 10 | Colliders, rigidbodies, joints, world config |
| Preferences / Broadcast / Tool Mgmt / Status | 17 | preferences(7), broadcast(5), tool_management(4), bridge_status(1) |

#### Pro Edition (Native) Status
- Commercial commitment: 270+ production actions (Phase 1-3)
- Native code registration snapshot: up to 28 tools / 408 actions (includes Phase 4-5 modules)
- AI tools (`scene_generator`, `batch_engine`, `scene_audit`) are implemented in native modules and released in phases

See [docs/PRODUCT_TRUST_ASSET.md](docs/PRODUCT_TRUST_ASSET.md) and [docs/trust-metrics.json](docs/trust-metrics.json) for the single source of truth.

### Panel

The plugin panel has **5 tabs**:

| Tab | Description |
|-----|-------------|
| **Status** | Connection status, endpoint, port, project info, tool count, uptime |
| **Control** | Start/stop/restart service, toggle individual MCP tools on/off |
| **Connect** | One-click IDE config injection for 11 AI coding assistants |
| **Settings** | License activation, rate limit, loopback restriction, body size limit, auto-rollback |
| **Guide** | Quick-start guide, prompt examples, and usage tips |

### Supported IDEs (One-Click Config)

Cursor, Windsurf, Claude Desktop, Trae, Kiro, Antigravity, Gemini CLI, OpenAI Codex, Claude Code, CodeBuddy, Comate

### Security

| Feature | Value |
|---------|-------|
| Binding | `127.0.0.1` loopback only (configurable) |
| Authentication | 24-byte random token |
| Rate limit | 240 req/min (configurable, 10–10,000) |
| Request timeout | 20 seconds |
| Max request body | 1 MB (configurable, 64 KB – 50 MB) |
| Auto rollback | Enabled (configurable) |

### Build & Installation

```bash
npm install
npm run build
npm run install:global -- --project "D:/MyGame"
```

### Pro Activation

1. Purchase Pro from Cocos Store or Gumroad
2. Open the plugin panel → Settings tab
3. Enter your License Key in the input field
4. Click "Activate"
5. Restart the plugin for Pro tools to take effect

### Development

```bash
npm run watch          # Watch mode
npm run typecheck      # Type check
npm run test           # Unit tests (Vitest)
npm run ci             # Full CI: typecheck → lint → coverage
npm run verify         # Verify local config
```

### License

Community Edition: [BSL 1.1](LICENSE)
Pro Edition: Commercial License (Cocos Store / Gumroad)

---

<a id="中文"></a>

## 中文

独立的 Cocos Creator 编辑器插件，直接在插件进程中提供完整的 MCP（Model Context Protocol）服务——让 AI 编程助手实时查询、修改和控制你的 Cocos 项目。

**社区版：17 个工具 / 188 个 action · Pro Native：最高 28 / 408（分阶段）**

### 版本

| 版本 | 价格 | 内容 |
|------|------|------|
| **社区版** | 免费 | 188 个 action，JS 实现，开源 (BSL 1.1) |
| **Pro 版** | ¥99/年 ($15/年) | 270+ 生产可用 action（Phase 1-3），Rust 二进制 |
| **企业版** | ¥999/年 ($150/年) | Pro + 私有部署 + SLA + 定制 |

### 架构

```
┌──────────────────────────────────────────────────────┐
│  Cocos Creator 编辑器 (>= 3.6.0)                     │
│  ┌────────────────────────────────────────────────┐  │
│  │  aura-for-cocos 插件                         │  │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │  │
│  │  │ HTTP API │  │ MCP 宿主 │  │ 场景脚本    │  │  │
│  │  │ :7779    │  │ /mcp     │  │ (运行时)    │  │  │
│  │  └────┬─────┘  └────┬─────┘  └──────┬──────┘  │  │
│  │       └──────────────┼───────────────┘         │  │
│  │          社区版：17 个工具 / 188 个 action       │  │
│  │          Pro Native（分阶段）：最高 28 / 408     │  │
│  └────────────────────────────────────────────────┘  │
│                         ▲                            │
│  ┌──────────────────────┼─────────────────────────┐  │
│  │  面板 (5 个标签页)    │                         │  │
│  │  状态 │ 控制 │ 互联 │ 设置 │ 指南              │  │
│  └──────────────────────┼─────────────────────────┘  │
└─────────────────────────┼────────────────────────────┘
                          │ HTTP / stdio / TOML / CLI
          ┌───────────┬───┼───┬───────────┐
          ▼           ▼   ▼   ▼           ▼
       Cursor     Windsurf  Claude Desktop  Trae
       Kiro       Antigravity  Gemini CLI   Codex
       Claude Code  CodeBuddy  Comate
```

### 功能特性

#### 核心
- 插件进程内 MCP 宿主：`http://127.0.0.1:<port>/mcp`
- Stdio 兼容垫片，支持仅 stdio 传输的客户端
- **漏斗架构**：社区版 17 个工具 / 188 个 action；Pro Native 模块最高注册到 28 / 408（分阶段）
- **用户可配置安全策略**：速率限制、回环限制、请求体大小、自动回滚

#### AI 原生设计
- **AI 行为规则**：5 条强制约束在 JSON Schema 层面执行
- **167+ 参数描述**：详细的使用指导
- **组件名自动规范化**：`sprite` → `Sprite`，`scrollview` → `ScrollView`
- **危险操作拦截**：`destroy_node`、`clear_children` 需要显式确认
- **错误自愈**：错误响应包含 `suggestion` 字段，AI 可自动恢复

#### 工具概览

| 分类（社区版运行时） | Action 数 | 说明 |
|------|-----------|------|
| 场景查询 | 50 | 节点树、搜索、组件内省、验证、空间查询 |
| 场景操作 | 39 | 增删改、变换、组件、预制体、UI、相机/材质扩展 |
| 资产管理 | 17 | 增删改、发现、Meta 控制、URL/UUID 互转 |
| 编辑器控制 | 38 | 场景生命周期、选择、控制台、构建、预览、gizmo/view 基础 |
| 原子宏工具 | 5 | 高内聚多步操作，失败自动回滚 |
| 脚本工具 | 2 | `execute_script`、`register_custom_macro` |
| 动画 | 10 | 创建剪辑、播放控制、交叉淡入淡出 |
| 物理 | 10 | 碰撞体、刚体、关节、世界配置 |
| 偏好/广播/工具管理/状态 | 17 | preferences(7)、broadcast(5)、tool_management(4)、bridge_status(1) |

#### Pro 版（Native）状态
- 商业承诺：270+ 生产可用 action（Phase 1-3）
- Native 代码注册快照：最高 28 个工具 / 408 个 action（含 Phase 4-5 模块）
- AI 工具 `scene_generator` / `batch_engine` / `scene_audit` 已在 Native 模块实现，按版本分阶段发布

统一口径请以 [docs/PRODUCT_TRUST_ASSET.md](docs/PRODUCT_TRUST_ASSET.md) 与 [docs/trust-metrics.json](docs/trust-metrics.json) 为准。

### 面板

插件面板有 **5 个标签页**：

| 标签页 | 说明 |
|--------|------|
| **状态** | 连接状态、端点、端口、项目信息、工具数、运行时长 |
| **控制** | 启动/停止/重启服务，开关单个 MCP 工具 |
| **互联** | 一键注入 11 个 AI 编程助手的配置 |
| **设置** | License 激活、速率限制、回环限制、请求体大小、自动回滚 |
| **指南** | 快速上手指南、提示词示例、使用技巧 |

### 支持的 IDE（一键配置）

Cursor、Windsurf、Claude Desktop、Trae、Kiro、Antigravity、Gemini CLI、OpenAI Codex、Claude Code、CodeBuddy（腾讯）、Comate（百度）

### 安全基线

| 特性 | 值 |
|------|-----|
| 绑定 | `127.0.0.1` 仅回环（可配置） |
| 认证 | 24 字节随机 Token |
| 速率限制 | 240 请求/分钟（可配置，10–10,000） |
| 请求超时 | 20 秒 |
| 最大请求体 | 1 MB（可配置，64 KB – 50 MB） |
| 自动回滚 | 启用（可配置） |

### 构建与安装

```bash
npm install
npm run build
npm run install:global -- --project "D:/MyGame"
```

### Pro 版激活

1. 从 Cocos Store 或 Gumroad 购买 Pro 版
2. 打开插件面板 → 设置标签页
3. 在输入框中输入 License Key
4. 点击"激活"
5. 重启插件使 Pro 工具生效

### 开发

```bash
npm run watch          # 监听模式
npm run typecheck      # 类型检查
npm run test           # 单元测试 (Vitest)
npm run ci             # 完整 CI：typecheck → lint → coverage
npm run verify         # 验证本地配置
```

### 许可证

社区版：[BSL 1.1](LICENSE)
Pro 版：商业许可（Cocos Store / Gumroad）

---

## Documentation / 文档

| Document | Description |
|----------|-------------|
| [docs/TOOLS_REFERENCE.md](docs/TOOLS_REFERENCE.md) | Complete API reference — all 22 tools, 270+ actions |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Common issues and solutions |
| [COMPATIBILITY.md](COMPATIBILITY.md) | Engine versions, OS, MCP client support matrix |
| [CHANGELOG.md](CHANGELOG.md) | Release history |
