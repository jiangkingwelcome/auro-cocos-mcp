# Competitive Analysis — Aura（2026-03-07 更新版）

> Date: 2026-03-07
>
> Compare: **Aura (Ours)** v1.0.10 vs **DaxianLee/cocos-mcp-server** v1.5.4 + 跨引擎 MCP 生态

---

## 一、竞品全景

上一版分析仅对比了 DaxianLee 一家。本次更新扩展到 **整个游戏引擎 MCP 生态**，因为我们的真正竞争对手不仅限于 Cocos 内部。

| 产品 | 引擎 | 最新版 | 上架 / 索引 | 定位 |
|------|------|--------|------------|------|
| 🟢 **Aura (我们)** | Cocos Creator ≥3.4.2 | v1.0.10 | ❌ 未上架 | AI-Native 轻量级 Bridge |
| 🔵 **DaxianLee/cocos-mcp-server** | Cocos Creator ≥3.8.0 | v1.5.4 | ✅ Cocos Store + lobehub + mcpmarket + skywork + aibase | 功能全面的编辑器控制 |
| 🟣 **Cocos MCP Log Bridge** | Cocos Creator | — | ✅ mcpmarket + langdb | Cursor 专用日志同步调试 |
| 🟠 **MCP Unity** | Unity | — | ✅ GitHub 活跃 | Unity 编辑器 AI 控制 |
| 🟡 **Unity AI Gateway** | Unity 6+ | 2026 发布 | ✅ **官方** | 官方 AI Agent 接入层 |
| 🔴 **Godot MCP** | Godot 4 | — | ✅ GitHub + 社区 | Godot 编辑器 AI 控制 |
| ⚫ **Unreal MCP** | UE 5 | — | ✅ mcpmarket + mcp.so | UE 编辑器 AI 控制 |

> ⚠️ **关键趋势**：MCP 已不是 Cocos 独有现象，Unity / Godot / Unreal 全部出现了 MCP 集成。Unity 甚至推出了 **官方 AI Gateway**（2026）。我们需要在 Cocos 生态中抢占 "AI-Native MCP" 的心智定位。

---

## 二、核心竞品深度对比 — 我们 vs DaxianLee v1.5.4

### 2.1 架构设计

| 架构特性 | 🟢 我们 | 🔵 DaxianLee v1.5.4 |
|---------|---------|--------------------|
| MCP Tool 数量 | **17 个 (CE) / 22 (Pro)**（Funnel 漏斗） | **50 个**（精简后） |
| 实际可用 Actions | **~158 (CE) / 270+ (Pro)**（通过 action enum） | **~50**（1:1 映射） |
| Token Overhead | 🟢 **~2K**（极低） | 🟡 **~8K**（中等） |
| AI 记忆负担 | 🟢 **极低** | 🟡 中等 |
| 扩展方式 | 🟢 添加 action 不改工具列表 | 🟡 添加功能需增加 tool |
| 技术栈 | TypeScript（纯 Node.js） | TypeScript + Vue 3 |
| v1.5.4 新增 | — | ✅ 一键自动配置主流 AI 编辑器 |

> **架构优势依然是我们最大的护城河。** DaxianLee v1.5.4 的改进主要在易用性（一键配 IDE），而非架构。50 个 tool vs 17 个 tool (CE) 的 Token 效率差距仍然存在。

### 2.2 功能覆盖

| 功能 | 🟢 我们 | 🔵 DaxianLee v1.5.4 | 优势方 |
|------|---------|---------------------|-------|
| **原子化宏操作** | ✅ 5 个 macro tools | ❌ | 🟢 |
| **事务回滚** | ✅ 自动 rollback | ❌ | 🟢 |
| **组件名自动纠正** | ✅ 13 种映射 | ❌ | 🟢 |
| **路径大小写规范化** | ✅ | ❌ | 🟢 |
| **危险操作拦截** | ✅ `confirmDangerous` | ❌ | 🟢 |
| **选区感知上下文** | ✅ | ❌ | 🟢 |
| **错误自修复建议** | ✅ `suggestion` 字段 | ❌ | 🟢 |
| **可用组件类型发现** | ✅ `scene_query.list_available_components` 动态发现全部引擎+自定义组件 | ✅ 专用工具 | ⚖️ 持平 |
| **可视反馈** | ✅ 自动选中 + 高亮 | ❌ | 🟢 |
| **Ghost 节点防护** | ✅ | ❌ | 🟢 |
| **预制体浏览/列表** | ✅ `asset_operation.list` + `scene_query.list_all_scenes` | ✅ 专用工具 | ⚖️ 持平 |
| **预制体实例化到场景** | ✅ `scene_operation.instantiate_prefab` | ✅ | ⚖️ 持平 |
| **预制体编辑模式** | ✅ `scene_operation.enter/exit_prefab_edit` | ✅ 进入/退出预制体编辑模式 | ⚖️ 持平 |
| **预制体应用/还原** | ✅ `scene_operation.apply/revert_prefab` | ✅ 应用更改到预制体 / 还原实例 | ⚖️ 持平 |
| **预制体验证** | ✅ `scene_operation.validate_prefab` | ✅ 预制体完整性检查 | ⚖️ 持平 |
| **场景列表查询** | ✅ `scene_query.list_all_scenes` | ✅ 获取项目所有场景列表 | ⚖️ 持平 |
| **场景验证/完整性** | ✅ `scene_query.validate_scene` 节点树验证 + 完整性检查 | ✅ 场景节点树验证、性能统计、完整性检查 | ⚖️ 持平 |
| **属性重置** | ✅ `scene_operation.reset_property` | ✅ 重置节点/组件属性到默认值 | ⚖️ 持平 |
| **剪贴板操作** | ✅ `scene_operation.clipboard_copy/paste` | ✅ 节点复制/粘贴到剪贴板 | ⚖️ 持平 |
| **2D/3D 类型检测** | ✅ `scene_query.detect_2d_3d` | ✅ 自动检测节点/场景的 2D/3D 类型 | ⚖️ 持平 |
| **参考图功能** | ✅ `reference_image` set/clear | ✅ Reference Image | ⚖️ 持平 |
| **广播系统** | ✅ `broadcast` poll/history/clear（含增量轮询） | ✅ Broadcast | 🟢 |
| **偏好设置管理** | ✅ `preferences` get/set/list | ✅ 专用工具 | ⚖️ 持平 |
| **工具启用/禁用开关** | ❌ | ✅ 面板逐个开关 | 🔵 |
| **Vue 3 控制面板** | ❌ (纯 HTML/CSS) | ✅ | 🔵 |
| **中英双语界面** | ❌ | ✅ | 🔵 |
| **UUID/URL 互转** | ✅ `asset_operation.uuid_to_url / url_to_uuid` | ✅ | ⚖️ 持平 |
| **动画剪辑/材质列表** | ✅ `asset_operation.get_animation_clips / get_materials` | ✅ | ⚖️ 持平 |
| **在资源管理器中显示** | ✅ `asset_operation.show_in_explorer` | ✅ | ⚖️ 持平 |
| **图集打包** | ⚠️ `pack_atlas` 仅 reimport 封装 | ✅ 专用工具 | 🔵 |
| **清理未使用资源** | ⚠️ `clean_unused` 仅提示，不实际清理 | ✅ 自动分析+清理 | 🔵 |
| **性能统计** | ⚠️ `scene_query.stats` + `engine_action.dump_texture_cache` | ✅ 更全面的性能分析 | 🔵 |
| **Gizmo/坐标系控制** | ✅ `editor_action.set_transform_tool / set_coordinate` | ✅ 场景视图 Gizmo 模式切换 | ⚖️ 持平 |
| **场景视图工具** | ✅ `editor_action.toggle_grid / toggle_snap` | ✅ 网格/对齐/吸附等场景视图控制 | ⚖️ 持平 |
| **日志分析/模式匹配** | ✅ `editor_action.get_console_logs / search_logs` | ✅ 日志过滤、关键词搜索、模式匹配 | ⚖️ 持平 |
| **资源验证** | ✅ `asset_operation.validate_asset` 存在性 + meta + 依赖完整性 | ✅ | ⚖️ 持平 |
| **资源清单导出** | ✅ `asset_operation.export_asset_manifest` 按类型分组 | ✅ | ⚖️ 持平 |
| **一键配置 AI 编辑器** | ✅ 6 种 IDE | ✅ 主流 AI 编辑器 | ⚖️ 持平 |

### 2.3 安全与稳定性

| 维度 | 🟢 我们 | 🔵 DaxianLee v1.5.4 |
|------|---------|--------------------|
| 绑定地址 | `127.0.0.1` 仅本地 | `localhost:3000` |
| Token 认证 | ✅ 24-byte 随机 token | ❓ |
| 速率限制 | ✅ 240 req/min | ❓ |
| 请求超时 | ✅ 20s 硬超时 | ❓ |
| 请求体限制 | ✅ 1 MB max | ❓ |
| CORS 控制 | ✅ 仅 localhost 源 | ❓ |
| 事务回滚 | ✅ 自动清理 | ❌ |
| 连接生命周期 | ✅ heartbeat + farewell | ❓ |
| 自动化测试 | ✅ **221+ 测试** | ❓ 未公开 |

### 2.4 开发者体验

| 维度 | 🟢 我们 | 🔵 DaxianLee v1.5.4 |
|------|---------|--------------------|
| 安装方式 | `npm run install:global` 自动 symlink | 手动复制 + `npm install` |
| 引擎兼容 | **3.4.2+**（更广） | 3.8.0+（v1.5.4: 3.8.6+） |
| stdio 兼容 | ✅ 双协议自动检测 | ❓ 仅 HTTP |
| 多项目支持 | ✅ 注册表 `~/.aura-ports.json` | ❓ 单端口 |
| 跨平台打包 | ✅ | ✅ |

---

## 三、新竞品 — Cocos MCP Log Bridge

这是一个分垂直场景的竞品，**专注日志同步与调试**：

| 维度 | Log Bridge | 我们 |
|------|-----------|------|
| **定位** | Cursor ↔ Cocos 日志同步 | 全面编辑器控制 |
| **通信** | TCP bridge | HTTP + stdio |
| **功能** | 实时日志、智能过滤、场景信息 | ~158 (CE) / 270+ (Pro) actions 全面覆盖 |
| **威胁等级** | 🟡 低 — 功能子集，不构成替代 | — |

> Log Bridge 是一个 **互补型工具** 而非竞争替代。但它的存在表明市场对 "Cocos + AI 调试" 有需求，我们可以考虑在日志同步方面加强。

---

## 四、跨引擎竞品 — 为什么要关注

### 4.1 Unity AI Gateway（2026 官方）

| 维度 | 描述 |
|------|------|
| **发布** | 2026 年发布，Unity 6 的官方功能 |
| **定位** | 安全连接第三方 AI Agent 与 Unity Editor |
| **能力** | 深度上下文感知（场景、层级、资源、平台目标） |
| **影响** | 设立了 "游戏引擎 AI 集成" 的行业标杆 |

> ⚠️ **Unity 做了我们正在做的事情，而且是官方级别的。** 这既是威胁（Cocos 可能跟进），也是验证（证明了 MCP Bridge 的价值）。

### 4.2 跨引擎对比

| 特性 | 🟢 我们 | MCP Unity | Godot MCP | Unreal MCP |
|------|---------|-----------|-----------|------------|
| 架构模式 | Funnel (17 CE / 22 Pro tools) | Flat | Flat | Flat |
| 原子宏操作 | ✅ | ❌ | ❌ | ❌ |
| 事务回滚 | ✅ | ❌ | ❌ | ❌ |
| AI 友好设计 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| 安全基线 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |

> 🟢 **即使放在跨引擎视角下，我们的 Funnel 架构、原子操作和安全基线仍然领先。** 这是跨引擎通用的差异化优势。

---

## 五、市场与社区对比（更新）

| 维度 | 🟢 我们 | 🔵 DaxianLee v1.5.4 |
|------|---------|--------------------|
| **Cocos Store 上架** | ❌ | ✅ |
| **lobehub 索引** | ❌ | ✅ |
| **mcpmarket 索引** | ❌ | ✅ |
| **skywork 索引** | ❌ | ✅ |
| **aibase 索引** | ❌ | ✅ |
| **GitHub Stars** | 少 | 较多（先发优势） |
| **更新频率** | 高（月度迭代） | 中（大版本步伐） |

> 🔴 **市场可见性差距在过去一个月没有缩小。** DaxianLee v1.5.4 继续在所有主要 MCP 目录维持收录。

---

## 六、SWOT 分析（更新版）

### 🟢 优势 (Strengths)

1. **Funnel 架构**：17 工具 (CE) / 22 (Pro) vs 50，Token 效率领先 ~3x
2. **AI 友好设计**：选区感知 / 组件名纠正 / 路径规范 / 错误建议 — 跨引擎独有
3. **事务安全**：原子操作 + 自动回滚 + Ghost 节点防护
4. **安全基线**：Token / 限速 / 超时 / CORS — 最完善的安全层
5. **广引擎兼容**：3.4.2+ vs 竞品 3.8+
6. **高质量代码**：191 测试，83% 覆盖率
7. **stdio 双协议**：跨 MCP 客户端兼容性最好

### 🔴 劣势 (Weaknesses)

1. **未上架 Cocos Store**：零官方渠道曝光
2. **零 MCP 目录索引**：lobehub / mcpmarket / skywork 全部缺席
3. **面板 UI 已升级**：5 Tab 暗色主题 + i18n 中英双语
4. ~~缺少 i18n~~：✅ 已实现中英双语
5. ~~缺少部分 niche 功能~~：✅ 已全部实现（参考图、广播、偏好设置、动画、物理）

### 🟡 机会 (Opportunities)

1. **上架 Cocos Store + MCP 目录** → 同时解决"零曝光"问题
2. **Cocos 4 PinK IDE MCP 生态** → 新 IDE 天然支持 MCP 插件，我们可以第一批适配
3. **Generative Action Engine** → 独创的 AI 自扩展能力，无任何竞品有此概念
4. **跨引擎影响力** → 我们的 Funnel 模式可以成为 MCP Bridge 的设计范式参考
5. **MediaTek x Cocos 合作** → 端侧 AI + 引擎合作可能带来新的集成机会

### 🔴 威胁 (Threats)

1. **DaxianLee 持续迭代**：v1.5.4 新增一键配置，易用性进一步提升
2. **Cocos 4 PinK 可能内置 MCP**：[但如前分析，这实际是机会而非威胁]
3. **Unity AI Gateway 树立行业标杆**：如果 Cocos 照搬 Unity 的官方方案，第三方空间会被压缩
4. **MCP 标准快速演进**：如果 MCP 标准变化太快，维护成本上升

---

## 七、综合评分（更新版）

| 评估维度 | 🟢 我们 | 🔵 DaxianLee v1.5.4 | 变化趋势 |
|---------|---------|---------------------|---------|
| 架构设计 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⏸️ 不变 |
| AI 友好性 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⏸️ 不变 |
| 安全性 | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⏸️ 不变 |
| 功能广度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 📈 我方提升（参考图/广播/偏好设置/动画/物理） |
| 代码质量 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⏸️ 不变 |
| 易用性 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐½ | 📈 竞品提升（v1.5.4 一键配置） |
| 市场曝光 | ⭐ | ⭐⭐⭐⭐⭐ | ⏸️ 差距未缩小 |
| 社区生态 | ⭐ | ⭐⭐⭐⭐ | ⏸️ 差距未缩小 |
| 引擎兼容 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⏸️ 不变 |
| **综合** | **⭐⭐⭐⭐½** | **⭐⭐⭐½** | 📈 技术差距进一步拉大 |

---

## 八、行动建议（优先级排序）

### 🔥 紧急（本周启动）

| # | 行动 | 预期效果 | 难度 |
|---|------|---------|------|
| 1 | **上架 Cocos Store** | 直接获取目标用户，建立品牌先例 | 中 |
| 2 | **提交到 lobehub + mcpmarket** | 国际 MCP 社区可见性 | 低 |
| 3 | **英文 README** | 覆盖国际开发者 + 商店/目录要求 | 低 |

### 🟡 重要（本月完成）

| # | 行动 | 预期效果 | 难度 |
|---|------|---------|------|
| 4 | **面板 UI 升级** | 提升第一印象，缩小与竞品面板差距 | 中 |
| 5 | **发布性能对比数据**（Token 消耗基准测试） | 用数据证明架构优势 | 中 |
| 6 | **Generative Action Engine 落地** | 独创差异化卖点 | 高 |

### 🟢 战略（未来 2-3 个月）

| # | 行动 | 预期效果 | 难度 |
|---|------|---------|------|
| 7 | **PinK IDE 适配**（追踪 Cocos 4 进展） | 抢占新平台先机 | 高 |
| 8 | **日志同步增强** | 覆盖 Log Bridge 的垂直需求 | 中 |
| 9 | **发布 "MCP Bridge 설计范式" 技术博客** | 建立思想领导力，影响跨引擎社区 | 低 |
| 10 | **搭建用户社区**（Discord / 微信群） | 持续反馈和口碑 | 低 |

---

## 九、结论

> **技术层面：** Pro Edition 大幅扩展至 22 工具 / 270+ actions。Community Edition 同步升级到 16 工具 / ~157 actions。Funnel 架构效率依然远超竞品。动画、物理、工具管理等新工具已全部补齐。
>
> **市场层面：** 差距仍在。竞品继续在所有主要 MCP 目录保持索引。上架是最紧迫的工作。
>
> **生态层面：** 游戏引擎 MCP 已从 "Cocos 小众现象" 演变为 **跨引擎行业趋势**。
>
> 🔥 **一句话总结：技术全面领先，功能差距归零，Pro Edition 已具备完整商业竞争力。上架是唯一的短板。**

---

## 附录 A：Cocos 4 / PinK IDE 影响分析

（保留自上一版，结论不变）

Cocos 4 于 2026-01 开源（MIT），PinK IDE 将内置 Agent + MCP 生态。但：

1. **品类先例已建立** — DaxianLee 已上架 Cocos Store
2. **审核无"功能重复即拒"条款**
3. **Cocos 策略是鼓励 MCP 生态**，非垄断
4. **PinK 内置 MCP ≠ 排他** — 历史规律：官方做基础层，第三方做增强层（如 VS Code + GitLens）
5. **窗口期至少 12 个月** — PinK 仍在早期阶段

> 🟢 **结论不变：Cocos 4 内置 MCP 是机会而非威胁。关键是现在就上架，在 PinK 成熟前建立用户基础。**

## 附录 B：跨引擎 MCP 对照表

| 引擎 | 第三方 MCP | 官方 AI 计划 | 状态 |
|------|-----------|-------------|------|
| **Cocos** | DaxianLee + 我们 | PinK IDE (MCP + Agent) | 第三方先行，官方跟进 |
| **Unity** | MCP Unity (社区) | **AI Gateway (官方)** | 官方已发布 |
| **Godot** | Godot MCP (社区) | 无官方计划 | 社区驱动 |
| **Unreal** | Unreal MCP (社区) | AI 辅助 (蓝图/场景) | 社区 + 部分官方 |

> 每个引擎都走了 "社区先行 → 官方跟进" 的路径。Cocos 也将如此。**先行者优势取决于谁先建立了用户基础和品牌认知。**
