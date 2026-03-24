# Aura for Cocos Creator — Claude Code 项目规则

> 本文件供 Claude Code 自动加载，确保 AI 遵守项目约定。
> 对应 `.cursor/rules/` 下的四个规则文件。

---

## 一、架构总览

本项目是 Cocos Creator 编辑器的 MCP 插件，双版本架构：

- **社区版（JS，冻结）**：`src/mcp/tools-*.ts`，~158 actions，只修 bug，不加新功能
- **Pro 版（Rust，持续迭代）**：`native/src/tools/*.rs`，270+ actions，所有新功能在这里开发
- **共享基础设施（JS）**：`main.ts` / `core.ts` / `scene.ts` / `panels/` 等，两版本共用

```
AI 请求 → MCP → tools.ts
  ├─ Pro 可用  → tools-pro-bridge.ts → Rust processToolCall → ExecutionPlan → executor.ts → Cocos IPC
  └─ 社区版    → JS handler → ctx.sceneMethod / bridgeGet / editorMsg → Cocos IPC
```

---

## 二、构建命令

> ⚠️ `package.json` 无 `scripts` 段，直接用以下命令：

| 命令 | 说明 |
|------|------|
| `node_modules/.bin/tsc --noEmit` | TypeScript 类型检查 |
| `node_modules/.bin/tsc` | 开发编译 → `dist/` |
| `node scripts/build-release.mjs` | esbuild 打包 → `dist-release/` |
| `node scripts/build-protected.mjs --obfuscate-only` | 混淆（不用 bytenode） |
| `node scripts/build-protected.mjs` | 混淆 + bytenode 字节码加固 |
| `scripts\package-release-win.bat --no-bytenode` | 社区版完整打包 → `dist-plugin-release/` |
| `scripts\package-pro-win.bat` | Pro 版完整打包（需先编译 Rust） |
| `node scripts/build-native.mjs` | 编译 Rust 原生模块 |
| `npx vitest run` | 运行单元测试 |

**修改 `src/` 后必须执行：**
1. `node_modules/.bin/tsc --noEmit` — 类型检查通过
2. `npx vitest run` — 测试全部通过
3. `node_modules/.bin/tsc` — 重新编译

---

## 三、禁止直接修改打包产物

`dist/`、`dist-release/`、`dist-plugin-release/`、`dist-plugin-pro/` 均为构建产物。

- ❌ 禁止直接编辑这些目录下的任何 `.js` / `.d.ts` / `.map` 文件
- ✅ 修改 `src/` 源文件后重新编译

---

## 四、编码约定（来自已验证的 Bug 修复，禁止回退）

### 4.1 资源引用属性必须通过 Editor IPC 设置
在 `scene.ts` 的 `setComponentProperty` 中：
- value 是 `{ __uuid__: "..." }` 时，必须通过 `Editor.Message.request('scene', 'set-property', ...)` 设置
- 禁止直接 `comp[property] = { __uuid__: ... }`，会导致 `Sprite._applySpriteSize` 崩溃

### 4.2 图片导入必须设置 sprite-frame 类型
在 `tools-atomic-texture.ts` 中：
- 导入图片后必须设置 meta `userData.type = 'sprite-frame'`，再 `reimport-asset`
- 否则 Cocos 只生成 Texture2D 子资源，Sprite 组件无法使用

### 4.3 禁止创建自动生成的子资源类型
在 `tools-asset.ts` 的 `asset_operation.create` 中：
- 拦截 `.spriteframe`、`.texture`、`.fbx/mesh` 等类型，返回错误并提示正确做法

### 4.4 set_meta_property 必须支持嵌套路径
- property 参数支持点号分隔路径（如 `userData.type`），逐层深入设置

### 4.5 MCP 调用日志不可移除
在 `local-tool-server.ts` 的 `callTool` 中，四条日志必须保留：
```
[MCP] #N -> tool.action {params}       // 入口
[MCP] #N ✓ tool.action Xms             // 成功
[MCP] #N ✗ tool.action Xms — error     // 业务错误
[MCP] #N ✗✗ tool.action Xms — EXCEPTION  // 异常
```

### 4.6 面板轮询禁止同步阻塞
`refreshStatus()` 每 3 秒调用一次，调用链中禁止 `execSync`、同步大量文件读取、同步网络请求，否则导致编辑器 SIGSEGV 崩溃。

### 4.7 ensure_2d_canvas 必须幂等
- 先检测场景中是否已有 Canvas（排除 Editor Scene Background 中的）
- 已有则直接返回 UUID，不重复创建

### 4.8 scene.ts 中只能用 `Editor.Message.request`
- 禁止使用 `Editor.Message.send`（无返回值，无法确认执行结果）

### 4.9 节点/组件引用属性格式
- `cc.Node` 引用：`{ "__refType__": "cc.Node", "uuid": "..." }`
- `cc.Component` 引用：`{ "__refType__": "cc.Component", "uuid": "...", "component": "ClassName" }`
- 禁止使用 `__type__`（Cocos 序列化保留字，IPC 传输时会被拦截）

---

## 五、安全机制（禁止删除、绕过或弱化）

| 机制 | 位置 | 规则 |
|------|------|------|
| Token 认证 | `core.ts`, `token-manager.ts` | 所有非公开路由必须过 Token 校验，禁止硬编码 |
| 回环地址限制 | `core.ts` | `loopbackOnly` 默认 `true`，禁止改为 `false` |
| 速率限制 | `core.ts` | 默认 240 次/分钟，范围 10-10000，禁止移除上下限 |
| 请求体大小限制 | `core.ts` | 默认 1MB，范围 64KB-50MB，禁止移除 |
| 危险操作拦截 | `tools-scene.ts` | `destroy_node` / `clear_children` 等必须传 `confirmDangerous:true` |
| 属性黑名单 | `scene.ts` | `COMPONENT_PROPERTY_BLOCKLIST` 只允许新增，禁止缩减 |
| AI 行为规则 | `tools-shared.ts` | `AI_RULES` 常量禁止删除或弱化 |
| 轮询禁 execSync | `ide-config-service.ts` | `getConfigStatus()` 调用链中绝对禁止 `execSync` |

---

## 六、架构禁止事项

- ❌ 禁止在 JS 社区版工具文件中添加新功能（冻结）
- ❌ 禁止在 Rust 中直接调用 Cocos IPC（必须通过 ExecutionPlan）
- ❌ 禁止在开源仓库中包含 `.node` 二进制或 `native/src/` Rust 源码
- ❌ 禁止修改 `executor.ts` 的 `CallInstruction` 类型而不同步更新 `native/src/types.rs`
- ❌ 禁止在 JS 代码中实现 License 验证逻辑（只在 Rust 中）
- ❌ 禁止在日志中输出完整 License Key（只输出前 10 字符 + "..."）
- ❌ 禁止在任何仓库中存放 HMAC 签名密钥

---

## 七、目录结构速查

```
src/
├── mcp/
│   ├── tools.ts              # 版本切换入口（Pro or Community）
│   ├── tools-scene.ts        # 社区版：场景查询+操作
│   ├── tools-asset.ts        # 社区版：资源管理
│   ├── tools-editor.ts       # 社区版：编辑器控制
│   ├── tools-animation.ts    # 社区版：动画工具
│   ├── tools-physics.ts      # 社区版：物理工具
│   ├── tools-atomic*.ts      # 原子宏工具
│   ├── tools-script.ts       # 脚本执行
│   ├── tools-misc.ts         # 偏好设置/广播/工具管理
│   ├── tools-pro-bridge.ts   # Pro 版加载器
│   ├── tools-shared.ts       # 共享类型/工具函数/AI_RULES
│   ├── local-tool-server.ts  # 工具注册框架 + 日志
│   ├── executor.ts           # 执行 Rust ExecutionPlan
│   └── standalone-host.ts   # MCP JSON-RPC 宿主
├── core.ts                   # HTTP 服务器 + 安全层
├── main.ts                   # Cocos 插件入口
├── scene.ts                  # 场景脚本（运行在 Cocos 引擎内）
├── panels/                   # 面板 UI
└── routes/                   # IPC 路由

native/src/tools/             # Pro 版 Rust 工具（全部新功能在这里）
docs/
├── technical/                # 技术参考文档
├── business/                 # 商业策略文档
├── ui-previews/              # UI 主题/面板预览
├── reports/                  # 分析报告
├── testing/                  # 测试文档（TEST_CASES.md 等）
└── design/                   # 设计方案
```
