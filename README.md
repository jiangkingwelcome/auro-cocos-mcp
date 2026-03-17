# Aura for Cocos Creator

<div align="center">
  <img src="assets/aura-wordmark.png" alt="Aura Logo" width="400">
</div>

[English](#english) | [中文](#中文)

---

<a id="english"></a>

## English

Standalone Cocos Creator editor plugin that provides a full-featured MCP (Model Context Protocol) service directly from the plugin process — enabling AI coding assistants to query, modify, and control your Cocos project in real time.

**22 tools · 270+ actions · Funnel architecture · User-configurable security · AI-Native design**

### Editions

| Edition | Price | Content |
|---------|-------|---------|
| **Community** | Free | ~158 actions, JS implementation, open source (BSL 1.1) |
| **Pro** | ¥99/year ($15/year) | 270+ actions + AI smart tools, Rust binary |
| **Enterprise** | ¥999/year ($150/year) | Pro + private deployment + SLA + customization |

### Architecture

```
┌──────────────────────────────────────────────────────┐
│  Cocos Creator Editor (>= 3.4.2)                     │
│  ┌────────────────────────────────────────────────┐  │
│  │  aura-for-cocos plugin                       │  │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │  │
│  │  │ HTTP API │  │ MCP Host │  │ Scene Script│  │  │
│  │  │ :7779    │  │ /mcp     │  │ (runtime)   │  │  │
│  │  └────┬─────┘  └────┬─────┘  └──────┬──────┘  │  │
│  │       └──────────────┼───────────────┘         │  │
│  │              22 tools, 270+ actions             │  │
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
- **Funnel architecture**: 22 tools with 270+ actions vs flat 50+ tool approach — significantly lower token overhead
- **User-configurable security**: rate limit, loopback restriction, body size limit, auto-rollback

#### AI-Native Design
- **AI behavioral rules**: 5 mandatory constraints enforced at JSON Schema level
- **167+ parameter descriptions** with detailed usage guidance
- **Component name auto-normalization**: `sprite` → `Sprite`, `scrollview` → `ScrollView`
- **Dangerous action interception**: `destroy_node`, `clear_children` require explicit confirmation
- **Error self-healing**: Error responses include `suggestion` field for AI auto-recovery

#### Tool Overview

| Category | Actions | Description |
|----------|---------|-------------|
| Scene Queries | 43 | Tree, search, introspection, validation, spatial queries |
| Scene Operations | 68 | CRUD, transform, components, prefabs, batch, UI, camera, materials |
| Asset Management | 32 | CRUD, discovery, meta control, generation, utilities |
| Editor Control | 45 | Scene lifecycle, selection, console, panels, build, preview, tools |
| Macro Atomic Tools | 5 | High-cohesion multi-step operations with auto-rollback |
| Engine Actions | 8 | Frame rate, pause/resume, system info, render stats |
| Animation | 10 | Create clips, playback control, crossfade |
| Physics | 12 | Colliders, rigidbodies, joints, world config, raycast |
| Reference Image | 7 | Overlay management for visual reference |
| Preferences | 7 | Editor preferences (global/project) |
| Broadcast | 5 | Editor events, custom messages, raw IPC |
| Tool Management | 4 | List/enable/disable tools |

#### Pro Edition Exclusive
- Full scene/asset/editor action set (110+ additional actions)
- Engine actions and reference image tools
- AI Scene Generator — natural language → complete scene
- Batch Operation Engine — node matching + bulk transforms
- Scene Audit Tool — auto-detect issues + fix suggestions

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

**22 个工具 · 270+ 个 action · 漏斗架构 · 用户可配置安全策略 · AI 原生设计**

### 版本

| 版本 | 价格 | 内容 |
|------|------|------|
| **社区版** | 免费 | ~158 个 action，JS 实现，开源 (BSL 1.1) |
| **Pro 版** | ¥99/年 ($15/年) | 270+ 个 action + AI 智能工具，Rust 二进制 |
| **企业版** | ¥999/年 ($150/年) | Pro + 私有部署 + SLA + 定制 |

### 架构

```
┌──────────────────────────────────────────────────────┐
│  Cocos Creator 编辑器 (>= 3.4.2)                     │
│  ┌────────────────────────────────────────────────┐  │
│  │  aura-for-cocos 插件                         │  │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │  │
│  │  │ HTTP API │  │ MCP 宿主 │  │ 场景脚本    │  │  │
│  │  │ :7779    │  │ /mcp     │  │ (运行时)    │  │  │
│  │  └────┬─────┘  └────┬─────┘  └──────┬──────┘  │  │
│  │       └──────────────┼───────────────┘         │  │
│  │              22 个工具, 270+ 个 action          │  │
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
- **漏斗架构**：22 个工具承载 270+ 个 action，相比扁平 50+ 工具方案大幅降低 Token 开销
- **用户可配置安全策略**：速率限制、回环限制、请求体大小、自动回滚

#### AI 原生设计
- **AI 行为规则**：5 条强制约束在 JSON Schema 层面执行
- **167+ 参数描述**：详细的使用指导
- **组件名自动规范化**：`sprite` → `Sprite`，`scrollview` → `ScrollView`
- **危险操作拦截**：`destroy_node`、`clear_children` 需要显式确认
- **错误自愈**：错误响应包含 `suggestion` 字段，AI 可自动恢复

#### 工具概览

| 分类 | Action 数 | 说明 |
|------|-----------|------|
| 场景查询 | 43 | 节点树、搜索、组件内省、验证、空间查询 |
| 场景操作 | 68 | 增删改、变换、组件、预制体、批量、UI、相机、材质 |
| 资产管理 | 32 | 增删改、发现、Meta 控制、生成、工具函数 |
| 编辑器控制 | 45 | 场景生命周期、选择、控制台、面板、构建、预览 |
| 原子宏工具 | 5 | 高内聚多步操作，失败自动回滚 |
| 引擎操作 | 8 | 帧率、暂停/恢复、系统信息、渲染统计 |
| 动画 | 10 | 创建剪辑、播放控制、交叉淡入淡出 |
| 物理 | 12 | 碰撞体、刚体、关节、世界配置、射线检测 |
| 参考图 | 7 | 叠加层管理 |
| 偏好设置 | 7 | 编辑器偏好（全局/项目） |
| 广播 | 5 | 编辑器事件、自定义消息、原始 IPC |
| 工具管理 | 4 | 列出/启用/禁用工具 |

#### Pro 版独占
- 完整的场景/资产/编辑器 action 集（额外 110+ 个 action）
- 引擎操作和参考图工具
- AI 场景生成器（规划中）— 自然语言 → 完整场景
- 批量操作引擎（规划中）— 节点匹配 + 批量变换
- 场景审计工具（规划中）— 自动检测问题 + 修复建议

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
