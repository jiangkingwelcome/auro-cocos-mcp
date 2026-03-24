# Aura — 商业化路线图

> 日期: 2026-03-15 | 版本: v1.0.10 | 最终方案

---

## 一、商业模式：JS 社区版 (冻结) + Rust Pro 版 (持续迭代)

### 核心原则

两个版本**互斥运行**，不会同时存在：

- **社区版**: 纯 JS 实现，开源在 GitHub，功能冻结只修 bug
- **Pro 版**: 纯 Rust 实现（.node 二进制），包含社区版全部功能的重写 + 独占高级功能
- 用户升级 Pro 后，**全部工具调用走 Rust**，JS 社区版工具完全不加载

### 架构总览

```
┌──────────────────────────────────────────────────┐
│  GitHub 公开仓库 (Community Edition)              │
│  BSL 1.1 许可证 · 纯 JS · 功能冻结               │
│                                                    │
│  187 actions (16 个工具)                           │
│  Funnel 架构 + 安全层 + 事务回滚                    │
│  覆盖 80% 日常工作流                               │
│  只修 bug，不加新功能                               │
│                                                    │
├──────────────────────────────────────────────────┤
│  Pro Edition (闭源 Rust .node 二进制)              │
│                                                    │
│  社区版全部 actions 的 Rust 重写                    │
│  + Pro 独占工具 (动画/物理/脚本/原子宏)             │
│  + AI 智能工具 (场景生成器/批量引擎/审计)           │
│  所有新功能只在 Rust 中开发                         │
│  4 层保护: minify + 混淆 + 字节码 + Rust 二进制    │
│                                                    │
│  Cocos Store / Gumroad 销售                        │
└──────────────────────────────────────────────────┘
```

### 升级路径

```
社区版用户:
  tools.ts → 无 .node → 注册 JS 社区版工具 → 直接调用 Cocos IPC

Pro 用户:
  tools.ts → 检测到 .node + License 有效 → 跳过全部 JS 工具
  → Rust processToolCall() → ExecutionPlan → executor.ts → Cocos IPC
```

---

## 二、社区版功能清单 (187 actions, 冻结)

### scene_query — 43 actions (全部免费)

查询是只读的，全部开放：tree, list, stats, node_detail, find_by_path, get_components, get_parent, get_children, get_sibling, get_world_position/rotation/scale, get_active_in_hierarchy, find_nodes_by_name, find_nodes_by_component, get_component_property, get_node_components_properties, get_camera_info, get_canvas_info, get_scene_globals, get_current_selection, get_active_scene_focus, list_all_scenes, validate_scene, detect_2d_3d, list_available_components, measure_distance, scene_snapshot, scene_diff, performance_audit, export_scene_json, deep_validate_scene, get_node_bounds, find_nodes_by_layer, get_animation_state, get_collider_info, get_material_info, get_light_info, get_scene_environment, screen_to_world, world_to_screen, check_script_ready, get_script_properties

### scene_operation — 30 actions (基础 + 预制体)

基础节点: create_node, destroy_node, reparent, set_position, set_rotation, set_scale, set_world_position/rotation/scale, set_name, set_active, duplicate_node, move_node_up, move_node_down, set_sibling_index, reset_transform

基础组件: add_component, remove_component, set_property, reset_property, call_component_method

基础 UI: ensure_2d_canvas, set_anchor_point, set_content_size

预制体: create_prefab, instantiate_prefab, enter_prefab_edit, exit_prefab_edit, apply_prefab, revert_prefab, validate_prefab

### asset_operation — 17 actions (基础 CRUD)

list, info, create, save, delete, move, copy, rename, import, open, refresh, create_folder, get_meta, set_meta_property, uuid_to_url, url_to_uuid, search_by_type

### editor_action — 21 actions (基础编辑 + 构建 + 运行)

场景: save_scene, open_scene, new_scene, undo, redo
选择: get_selection, select, clear_selection
项目: project_info
预览: preview, preview_refresh
构建: build, build_query
运行: play_in_editor, pause_in_editor, stop_in_editor, step_in_editor
其他: focus_node, log, warn, error, clear_console, show_notification

### 独立工具 — 16 actions

- preferences: 7 (get/set/list/get_global/set_global/get_project/set_project)
- broadcast: 5 (poll/history/clear/send/send_ipc)
- tool_management: 4 (list_all/enable/disable/get_stats)

### 社区版也包含的 Pro 工具 (JS 实现)

- 4 个原子宏: create_prefab_atomic, import_and_apply_texture, create_tween_animation_atomic, auto_fit_physics_collider
- execute_script, register_custom_macro
- animation_tool (10 actions)
- physics_tool (10 actions)

`setup_ui_layout` 已从社区版 JS 注册链移除，仅保留为 Pro 能力。

**社区版合计: 187 actions（以 docs/trust-metrics.json 为准）**

---

## 三、Pro 版功能清单 (商业承诺 270+；Native 注册最高 408，持续增长)

### 社区版全部 actions 的 Rust 重写

Pro 版包含社区版全部 ~157 actions，但实现在 Rust 中。

### 社区版工具的完整版 actions (Pro 解锁)

scene_operation 完整版 (+35): lock/unlock_node, hide/unhide_node, set_layer, clear_children, reset_node_properties, batch, batch_set_property, group_nodes, align_nodes, clipboard_copy/paste, create_ui_widget, setup_particle, audio_setup, setup_physics_world, create_skeleton_node, generate_tilemap, create_primitive, create/set_camera_*, camera_screenshot, set/assign/clone_material_*, swap_technique, sprite_grayscale, create/set_light_*, set_scene_environment, bind/unbind/list_events, attach/detach_script, set_component_properties

asset_operation 完整版 (+15): reimport, get_dependencies, get_dependents, show_in_explorer, clean_unused, pack_atlas, get_animation_clips, get_materials, validate_asset, export_asset_manifest, create_material, generate_script, batch_import, get_asset_size, slice_sprite

editor_action 完整版 (+24): build_with_config, build_status, preview_status, send_message, open/close/query_panels, get_packages, reload_plugin, inspect_asset, open_preferences, open_project_settings, move_scene_camera, take_scene_screenshot, set_transform_tool, set_coordinate, toggle_grid, toggle_snap, get_console_logs, search_logs, set_view_mode, zoom_to_fit

### Pro 独占工具

- engine_action (8 actions)
- reference_image (7 actions)

### AI 智能工具 (Rust 独占，Native 模块已注册，按版本分阶段发布)

| 功能 | Actions | 状态 | 说明 |
|------|---------|------|------|
| **AI 场景生成器** (`scene_generator`) | 5 | Native 已注册 | 自然语言 → 完整场景 (create_scene, create_ui_page, create_game_level, create_menu, describe_intent) |
| **批量操作引擎** (`batch_engine`) | 10 | Native 已注册 | 节点匹配 + 批量变换 (find_and_modify/delete/add_component/remove_component/set_property/reparent, transform_all, rename_pattern, set_layer_recursive, toggle_active_recursive) |
| **场景审计工具** (`scene_audit`) | 9 | Native 已注册 | 自动检测问题 + 修复建议 (full_audit, check_performance/hierarchy/components/assets/physics/ui, auto_fix, export_report) |

### 规划中的高级功能 (Phase 4)

| 功能 | 优先级 | 说明 |
|------|--------|------|
| **智能脚本脚手架** | P1 | 生成代码 + 挂载 + 配置一体化 |
| **一键 UI 系统** | P1 | 自然语言 → 完整 UI 界面 |
| **动画工作流** | P1 | 自然语言 → 动画剪辑 |
| **项目规范检查** | P2 | 自定义规则 + 自动检查 |
| **操作日志与回放** | P2 | 记录/导出/回放 MCP 操作 |

AI 智能工具通过 ExecutionPlan 调用底层 Cocos IPC，可以组合使用任何 action。

**Pro 版口径（统一）**:
- 商业承诺：Phase 1-3 共 22 个工具，270+ 生产可用 actions
- Native 代码注册快照：28 个工具，408 actions（含 Phase 4-5）
- 统一来源：`docs/PRODUCT_TRUST_ASSET.md` + `docs/trust-metrics.json`

---

## 四、定价策略

| 层级 | 价格 | 内容 |
|------|------|------|
| **Community** | 免费 | 187 actions, JS 实现, GitHub 开源 |
| **Pro** | ¥99/年 ($15/年) | 270+ actions + AI 智能工具, Rust 二进制 |
| **Enterprise** | ¥999/年 ($150/年) | Pro + 私有部署 + SLA + 定制 |

### ROI

```
没有 Pro: 搭建 UI 2天 + 10关卡 5天 + 物理 1天 + 动画 2天 + 检查 1天 = ~33 人天
使用 Pro: UI 2小时 + 关卡 1天 + 物理 1小时 + 动画 半天 + 检查 5分钟 = ~2 人天
节省 31 人天 × ¥500 = ¥15,500 → Pro ¥99/年 → ROI 156 倍
```

---

## 五、各平台发布策略

| 平台 | 版本 | 价格 | 目的 |
|------|------|------|------|
| **GitHub** | Community (JS 源码) | 免费 (BSL) | 攒星 + 品牌 |
| **Cocos Store** | Pro (Rust .node) | ¥99/年 | 主要收入 |
| **lobehub / mcpmarket** | Community (链接) | 免费 | MCP 社区曝光 |
| **Gumroad** | Pro (Rust .node) | $15/年 | 国际用户 |

---

## 六、技术架构

### Rust 项目结构 (native/src/)

```
lib.rs              napi 导出入口
types.rs            CallInstruction, ExecutionPlan, ToolDefinition
validate.rs         参数验证工具
license.rs          License 验证 (HMAC-SHA256)
tools/
├── mod.rs          汇总 + 路由
├── engine.rs       engine_action
├── script.rs       execute_script + register_custom_macro
├── animation.rs    animation_tool
├── physics.rs      physics_tool
├── reference.rs    reference_image
├── atomic.rs       4 个社区原子宏 + Pro 独占原子能力
├── scene.rs        scene_query (43) + scene_operation (65)
├── asset.rs        asset_operation (32)
├── editor.rs       editor_action (45)
├── misc.rs         preferences (7) + broadcast (5) + tool_management (4)
├── generator.rs    AI 场景生成器 (5 actions)
├── batch.rs        批量操作引擎 (10 actions)
└── audit.rs        场景审计 (9 actions)
```

### 4 层保护

| 层 | 保护方式 | 覆盖 |
|----|---------|------|
| Layer 1 | esbuild minify + tree shaking | JS 共享基础设施 |
| Layer 2 | JavaScript Obfuscator | JS 共享基础设施 |
| Layer 3 | Bytenode V8 字节码 | JS 共享基础设施 |
| **Layer 4** | **Rust 编译二进制** | **全部工具逻辑 (无法反编译)** |

### 构建命令

```bash
npm run package:pro           # 完整 Pro 版构建 (28 秒)
npm run package:release:win   # 社区版发行打包
npm run build:native:release  # 仅编译 Rust
```

---

## 七、License Key 系统设计

### 7.1 总体方案

所有渠道（Cocos Store / Gumroad）统一使用 License Key 激活。

```
用户购买 Pro
  → 付款成功
  → 联系开发者 / 自动邮件 获取 License Key
  → 在插件面板"设置"Tab 输入 Key（或写入 .mcp-license 文件）
  → Rust 离线验证 → Pro 工具全部激活
```

### 7.2 Key 格式

```
COCOS-PRO-XXXXXXXX-XXXXXXXX-XXXXXXXX      Pro 版
COCOS-ENT-XXXXXXXX-XXXXXXXX-XXXXXXXX      Enterprise 版
```

Key 内部编码了：email_hash(4B) + edition(1B) + expiry(4B) + hmac_sig(6B) = 15B → Base32 → 3 段 8 字符

### 7.3 生成端（你本地运行，不发布）

```
输入: 用户邮箱 + 版本 + 有效期天数
  → email_hash = SHA256(email)[0..4]
  → payload = email_hash(4B) + edition_byte(1B) + expiry_ts(4B) = 9B
  → signature = HMAC-SHA256(HMAC_KEY, payload)[0..6] = 6B
  → full = payload + signature = 15B
  → Base32 编码 → 24 字符 → 3 段 8 字符
  → 输出: COCOS-{edition}-{seg1}-{seg2}-{seg3}
```

- HMAC_KEY 存储在 `keys/hmac.key`（32 字节随机密钥），同时编译进 Rust 二进制
- HMAC_KEY 只有你知道，不在任何代码仓库中（.gitignore 排除 keys/）
- 生成工具是 `tools/generate-license.mjs`，本地运行，不入仓库

### 7.4 验证端（Rust .node 二进制，用户无法查看）

```
输入: License Key (COCOS-PRO-XXXXXXXX-XXXXXXXX-XXXXXXXX)
  → 解析格式 → 提取 edition 头 + 3 段 Base32
  → Base32 解码 → 15 字节 (payload 9B + sig 6B)
  → 用编译进二进制的 HMAC_KEY 计算 HMAC-SHA256(payload)
  → 比较前 6 字节是否匹配 sig → 签名验证
  → 检查 edition 字节与头部一致
  → 检查 expiry 时间戳未过期
  → 返回 { valid, edition, features, expiry, licensedTo }
```

验证完全离线，不需要联网。HMAC_KEY 编译在 Rust 二进制中 (strip + LTO)。

### 7.5 用户输入 Key 的方式（三选一）

1. **面板 UI**: 插件面板"设置"Tab 中的输入框（最友好）
2. **文件**: 项目根目录或插件目录下创建 `.mcp-license` 文件
3. **环境变量**: `COCOS_MCP_LICENSE=COCOS-PRO-XXXXXXXX-XXXXXXXX-XXXXXXXX`

优先级: 环境变量 > .mcp-license 文件 > 面板设置

### 7.6 防传播机制

| 机制 | 说明 |
|------|------|
| **Key 绑定邮箱** | Key 内编码购买者邮箱哈希，传播出去可追溯 |
| **Rust 二进制验证** | 无法修改代码绕过验证 |
| **更新绑定** | 后续版本更新需要有效 Key |
| **心理威慑** | 面板显示"Licensed to: xxx@email.com"，用户知道 Key 有身份信息 |

### 7.7 各渠道发 Key 流程

| 渠道 | 流程 |
|------|------|
| **Cocos Store** | 商品描述写"购买后发邮件到 xxx@email.com 附订单截图，24h 内发送 License Key"；Pro 包内含 ACTIVATION.txt 说明 |
| **Gumroad** | 付款后自动跳转到感谢页面显示 Key，同时邮件发送 |
| **企业客户** | 直接邮件沟通，可批量生成多个 Key |

### 7.8 未激活时的用户体验

```
Pro 包安装但未输入 Key:
  → 面板显示: "Pro Edition — 未激活"
  → 面板显示: License Key 输入框 + 激活按钮
  → 工具状态: 降级为社区版 (~157 actions)
  → bridge_status 返回: { edition: "community", proInstalled: true }
  → getServiceInfo.licenseStatus: { proInstalled: true, licenseValid: false, edition: "community" }

输入有效 Key 后:
  → 面板显示: "Pro Edition — 已激活 (Licensed to: xx...xx)"
  → 工具状态: 全部 Pro 工具启用 (270+ actions)
  → bridge_status 返回: { edition: "pro" }
  → getServiceInfo.licenseStatus: { proInstalled: true, licenseValid: true, edition: "pro", expiry: "2027-03-13", licensedTo: "xx...xx" }

输入无效/过期 Key:
  → 面板显示: "License Key 无效" 或 "License 已过期 (2027-03-13)"
  → 工具状态: 保持社区版
  → getServiceInfo.licenseStatus: { proInstalled: true, licenseValid: false, error: "..." }
```

### 7.9 Rust 侧实现要点

```rust
// license.rs 已实现:

// HMAC 密钥编译进二进制（生成和验证共用同一把密钥）
const VERIFY_KEY: &[u8; 32] = include_bytes!("../../keys/hmac.key");

// 自定义 Base32 解码（无 I/O/0/1 字母表）
fn base32_decode(input: &str) -> Option<Vec<u8>>

// 主验证函数：解析 → 解码 → 验签 → 检查版本 → 检查过期
pub fn validate(key: &str) -> Value {
    // 返回 { valid, edition, features, expiry, licensedTo }
    // 或    { valid: false, error: "...", edition: "community" }
}
```

### 7.10 Key 生成工具实现要点

```
tools/generate-license.mjs (已实现)
  - 不在开源仓库中（.gitignore 排除 tools/）
  - 不在 Pro 发行包中
  - 只在开发者本地机器运行
  - 命令:
    node tools/generate-license.mjs --init-keys                          # 生成 hmac.key
    node tools/generate-license.mjs --email user@example.com --edition PRO --days 365
    node tools/generate-license.mjs --verify COCOS-PRO-XXXXXXXX-XXXXXXXX-XXXXXXXX
  - 输出: COCOS-PRO-XXXXXXXX-XXXXXXXX-XXXXXXXX
  - 自动记录到 tools/licenses.csv (本地数据库)
```

---

## 八、开发路线图

### Phase 1: 基础发布 (Week 1-2) ✅

- [x] 中英双语 README
- [x] BSL 1.1 LICENSE 文件
- [x] ACTIVATION.txt 激活说明
- [x] 实现 HMAC-SHA256 License Key 生成工具 (tools/generate-license.mjs)
- [x] 实现 Rust 侧 License 验证 (native/src/license.rs, hmac + sha2)
- [x] 面板 UI 添加 License Key 输入框和激活状态显示
- [x] 社区版 action 裁剪 (158 actions, 与 Pro 版严格分离)
- [x] 社区版打包 (npm run package:release:win/mac)
- [x] Pro 版打包 (npm run package:pro, 4 层保护)
- [ ] GitHub 上架社区版
- [ ] Cocos Store 上架 Pro 版
- [ ] 提交到 lobehub / mcpmarket / skywork / aibase

### Phase 2: Rust 全量重写 (Week 3-6) ✅

- [x] scene_query (43 actions) + scene_operation (65 actions) → scene.rs
- [x] asset_operation (32 actions) → asset.rs
- [x] editor_action (45 actions) → editor.rs
- [x] preferences (7) + broadcast (5) + tool_management (4) → misc.rs

### Phase 3: AI 智能工具 (Month 2-3) ✅

- [x] AI 场景生成器 (5 actions) → generator.rs
- [x] 批量操作引擎 (10 actions) → batch.rs
- [x] 场景审计工具 (9 actions) → audit.rs

### Phase 4: 高级功能 (Month 3-6)

- [ ] 智能脚本脚手架 (P1)
- [ ] 一键 UI 系统 (P1)
- [ ] 动画工作流 (P1)
- [ ] 项目规范检查 (P2)
- [ ] 操作日志与回放 (P2)

---

## 八、核心结论

> **社区版是"快照"** — 158 actions 的 JS 实现，冻结在 GitHub 上攒星。
>
> **Pro 版是"未来"** — 全部工具的 Rust 重写 + AI 智能工具，持续迭代。
>
> **用户升级 Pro 后，全部调用走 Rust，JS 代码完全不加载。**
>
> **Pro 的 AI 智能工具通过 ExecutionPlan 调用任何底层 action，**
> **拥有社区版的全部"砖头"，加上 Rust 闭源的"建筑师"。**
