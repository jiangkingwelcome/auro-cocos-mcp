# Aura for Cocos Creator — Community Edition Capabilities

> **Community Edition · 16 Tools · ~157 Actions · Open Source (BSL 1.1)**
>
> 将 AI 能力直接接入 Cocos Creator 编辑器，让 Claude / GPT / Cursor 等 AI 客户端可以读取、修改、管理你的游戏场景。

---

## 快速概览

| 分类 | 工具 | Actions 数 | 说明 |
|------|------|:---------:|------|
| 🔌 连接 | `bridge_status` | — | 连接检测与版本能力查询 |
| 🔍 场景查询 | `scene_query` | **43** | 只读检查场景图、节点、组件 |
| ✏️ 场景操作 | `scene_operation` | **31** | 创建/删除/修改场景节点 |
| 📦 资产管理 | `asset_operation` | **17** | 管理项目资产文件 |
| 🎛️ 编辑器控制 | `editor_action` | **23** | 控制编辑器行为 |
| 🎬 动画 | `animation_tool` | **10** | 创建关键帧动画、控制播放 |
| ⚙️ 物理 | `physics_tool` | **10** | 碰撞体、刚体、关节、物理世界 |
| ⚡ 偏好设置 | `preferences` | **7** | 读写编辑器偏好 |
| 📡 广播事件 | `broadcast` | **5** | 监听/发送编辑器事件 |
| 🔧 工具管理 | `tool_management` | **4** | 动态启用/禁用工具 |
| 🧩 原子宏 | `create_prefab_atomic` | — | 一键创建 Prefab（含回滚） |
| 🖼️ 纹理导入 | `import_and_apply_texture` | — | 一键导入图片并应用到 Sprite |
| 🎞️ 动画宏 | `create_tween_animation_atomic` | — | 一键创建补间动画片段 |
| 🔮 碰撞宏 | `auto_fit_physics_collider` | — | 自动拟合 Sprite 轮廓碰撞体 |
| 🔩 脚本执行 | `execute_script` | ∞ | 逃生舱：运行任意场景脚本方法 |
| 🪝 自定义宏 | `register_custom_macro` | — | 运行时注册自定义宏工具 |

---

## 1. 🔌 bridge_status — 连接检测

始终第一个调用，验证桥接存活并获取编辑器版本与能力。

```json
{ "tool": "bridge_status" }
```

**返回字段**：`connected`、`port`、`uptime`、`editorVersion`、`projectName`、`toolCount`、`totalActions`

**版本分级**：
- `full` — Cocos Creator ≥ 3.8（全功能）
- `supported` — 3.6–3.7
- `best-effort` — 3.4–3.5
- `unsupported` — < 3.4

---

## 2. 🔍 scene_query — 场景查询（43 Actions）

**只读**。检查场景层级、节点详情、组件属性。不修改任何内容。

### 节点层级与搜索

| Action | 必填参数 | 说明 |
|--------|---------|------|
| `tree` | — | 完整场景节点树（含层级） |
| `list` | — | 所有节点扁平列表（uuid、name、active） |
| `stats` | — | 场景统计（节点数、组件数） |
| `find_by_path` | `path` | 按路径查找节点，如 `Canvas/Panel/Button` |
| `find_nodes_by_name` | `name` | 按名称模糊搜索所有匹配节点 |
| `find_nodes_by_component` | `component` | 查找所有包含指定组件的节点 |
| `find_nodes_by_layer` | `layer` | 按渲染层 bitmask 查找节点 |

### 节点详情

| Action | 必填参数 | 说明 |
|--------|---------|------|
| `node_detail` | `uuid` | 完整节点信息（位置/旋转/缩放/组件列表） |
| `get_components` | `uuid` | 列出节点所有组件 |
| `get_component_property` | `uuid`, `component`, `property` | 读取单个组件属性值 |
| `get_node_components_properties` | `uuid` | 读取节点所有组件的全部属性 |
| `get_parent` | `uuid` | 获取父节点信息 |
| `get_children` | `uuid` | 获取直接子节点列表 |
| `get_sibling` | `uuid` | 获取同级节点列表 |

### 坐标与变换

| Action | 必填参数 | 说明 |
|--------|---------|------|
| `get_world_position` | `uuid` | 世界坐标位置 {x, y, z} |
| `get_world_rotation` | `uuid` | 世界坐标旋转（欧拉角） |
| `get_world_scale` | `uuid` | 世界坐标缩放 |
| `get_active_in_hierarchy` | `uuid` | 检查节点在层级中是否激活 |
| `get_node_bounds` | `uuid` | 包围盒（2D: UITransform rect；3D: AABB） |
| `measure_distance` | `uuidA`, `uuidB` | 计算两节点间距离 |
| `screen_to_world` | `screenX`, `screenY` | 屏幕坐标 → 世界坐标 |
| `world_to_screen` | `worldX`, `worldY`, `worldZ` | 世界坐标 → 屏幕坐标 |

### 场景与编辑器状态

| Action | 说明 |
|--------|------|
| `get_current_selection` | 当前选中节点详情 |
| `get_active_scene_focus` | 选中节点优先、无选中则返回场景根节点 |
| `get_camera_info` | 主摄像机信息 |
| `get_canvas_info` | Canvas 节点信息与设计分辨率 |
| `get_scene_globals` | 场景全局设置（环境光、雾、阴影） |
| `get_scene_environment` | 结构化场景环境配置 |
| `get_animation_state` | 节点 Animation 组件状态与片段列表 |
| `get_collider_info` | 节点所有碰撞体组件信息 |
| `get_material_info` | 渲染器材质信息 |
| `get_light_info` | 场景中所有灯光组件 |
| `list_all_scenes` | 项目中所有 .scene 文件 |
| `detect_2d_3d` | 检测当前场景是 2D、3D 还是混合 |
| `list_available_components` | 所有可用组件类型（含自定义脚本组件） |

### 验证与分析

| Action | 说明 |
|--------|------|
| `validate_scene` | 当前场景检验（缺失引用等） |
| `deep_validate_scene` | 深度验证 + 缺失资产检测 + 修复建议 |
| `performance_audit` | 性能分析（节点过多、层级过深等问题） |
| `export_scene_json` | 导出完整场景树 JSON |
| `scene_snapshot` | 捕获场景快照（用于后续对比） |
| `scene_diff` | 对比两个快照，找出新增/删除/修改的节点 |

### 脚本集成

| Action | 必填参数 | 说明 |
|--------|---------|------|
| `check_script_ready` | `script` | 检查脚本类是否已编译注册 |
| `get_script_properties` | `script` | 获取脚本类所有 `@property` 声明 |

---

## 3. ✏️ scene_operation — 场景操作（31 Actions）

修改场景图的写操作。

> ⚠️ **危险操作**（`destroy_node`）必须携带 `"confirmDangerous": true`。

### 节点生命周期

| Action | 关键参数 | 说明 |
|--------|---------|------|
| `create_node` | `name`, `parentUuid` | 创建空节点（parentUuid 支持 UUID 或名称自动解析） |
| `destroy_node` | `uuid` | ⚠️ 永久删除节点 |
| `reparent` | `uuid`, `parentUuid` | 移动节点到新父节点下 |
| `duplicate_node` | `uuid`, `includeChildren` | 克隆节点（可选是否包含子节点） |
| `set_name` | `uuid`, `name` | 重命名节点 |
| `set_active` | `uuid`, `active` | 切换节点激活状态 |

### 变换操作

| Action | 关键参数 | 说明 |
|--------|---------|------|
| `set_position` | `uuid`, `x`, `y`, `z` | 设置本地位置 |
| `set_rotation` | `uuid`, `x`, `y`, `z` | 设置本地旋转（度） |
| `set_scale` | `uuid`, `x`, `y`, `z` | 设置本地缩放（1.0 = 100%） |
| `set_world_position` | `uuid`, `x`, `y`, `z` | 设置世界坐标位置 |
| `set_world_rotation` | `uuid`, `x`, `y`, `z` | 设置世界旋转 |
| `set_world_scale` | `uuid`, `x`, `y`, `z` | 设置世界缩放 |
| `reset_transform` | `uuid` | 重置位置/旋转/缩放为默认值 |

### 排序操作

| Action | 说明 |
|--------|------|
| `move_node_up` | 在兄弟列表中上移 |
| `move_node_down` | 在兄弟列表中下移 |
| `set_sibling_index` | 设置绝对兄弟序号（0-based） |

### 组件操作

| Action | 关键参数 | 说明 |
|--------|---------|------|
| `add_component` | `uuid`, `component` | 添加组件（名称自动规范化） |
| `remove_component` | `uuid`, `component` | 移除组件 |
| `set_property` | `uuid`, `component`, `property`, `value` | 设置组件属性 |
| `reset_property` | `uuid`, `component`, `property` | 重置属性为默认值 |
| `call_component_method` | `uuid`, `component`, `methodName`, `args` | 调用组件方法 |

### UI 布局

| Action | 关键参数 | 说明 |
|--------|---------|------|
| `ensure_2d_canvas` | — | 确保 Canvas 节点存在（2D UI 必需） |
| `set_anchor_point` | `uuid`, `anchorX`, `anchorY` | 设置 UITransform 锚点 |
| `set_content_size` | `uuid`, `width`, `height` | 设置 UITransform 内容尺寸 |

> `create_ui_widget` / 一键 UI 组件创建不属于 Community Edition，需升级 Pro 解锁。

### Prefab 操作

| Action | 关键参数 | 说明 |
|--------|---------|------|
| `create_prefab` | `uuid`, `savePath` | 将节点保存为 `.prefab` 资产 |
| `instantiate_prefab` | `prefabUrl`, `parentUuid` | 将 Prefab 实例化到场景中 |
| `enter_prefab_edit` | `uuid` | 进入 Prefab 编辑模式 |
| `exit_prefab_edit` | — | 退出 Prefab 编辑模式 |
| `apply_prefab` | `uuid` | 应用 Prefab 实例更改 |
| `revert_prefab` | `uuid` | 还原 Prefab 实例到原始状态 |
| `validate_prefab` | `prefabUrl` | 检查 Prefab 完整性 |

### 组件名称自动规范化

AI 传入任意大小写均可自动纠正：

| 输入 | 规范化后 |
|------|---------|
| `sprite` | `Sprite` |
| `cc.Sprite` | `Sprite` |
| `scrollview` | `ScrollView` |
| `uitransform` | `UITransform` |
| `uiopacity` | `UIOpacity` |
| `label` / `button` / `camera` | `Label` / `Button` / `Camera` |

---

## 4. 📦 asset_operation — 资产管理（17 Actions）

通过 AssetDB 管理项目资产。所有路径使用 `db://` 格式。

| Action | 关键参数 | 说明 |
|--------|---------|------|
| `list` | `pattern` | 列出匹配 glob 的资产 |
| `info` | `url` | 获取资产元数据（类型、uuid、导入器） |
| `create` | `url`, `content` | 创建新资产文件 |
| `save` | `url`, `content` | 覆写现有资产内容 |
| `delete` | `url` | 永久删除资产 |
| `move` | `sourceUrl`, `targetUrl` | 移动/重命名资产 |
| `copy` | `sourceUrl`, `targetUrl` | 复制资产 |
| `rename` | `url`, `newName` | 在同目录下重命名资产 |
| `import` | `sourcePath`, `targetUrl` | 从OS文件路径导入外部文件 |
| `open` | `url` | 在默认编辑器中打开资产 |
| `refresh` | `url`（可选） | 刷新资产数据库 |
| `uuid_to_url` | `uuid` | UUID → db:// URL |
| `url_to_uuid` | `url` | db:// URL → UUID |
| `create_folder` | `url` | 在资产数据库中创建文件夹 |
| `get_meta` | `url` | 获取完整 .meta 文件内容（JSON） |
| `set_meta_property` | `url`, `property`, `value` | 修改 .meta 属性（支持点分隔路径） |
| `search_by_type` | `type`, `pattern` | 按类型搜索资产，如 `cc.Prefab`、`cc.ImageAsset` |

**路径自动规范化**：`db://assets/Prefabs/Hero.prefab` → `db://assets/prefabs/Hero.prefab`

**图片导入工作流**：
1. `import` 导入图片
2. `set_meta_property` 设置 `userData.type = "sprite-frame"`
3. `refresh` 刷新 → 自动生成 SpriteFrame 子资产

---

## 5. 🎛️ editor_action — 编辑器控制（23 Actions）

### 场景管理

| Action | 关键参数 | 说明 |
|--------|---------|------|
| `save_scene` | — | 保存当前场景 |
| `open_scene` | `uuid` 或 `url` | 打开指定场景 |
| `new_scene` | — | 创建新空场景 |
| `undo` | — | 撤销上一操作 |
| `redo` | — | 重做上一撤销操作 |

### 选择管理

| Action | 关键参数 | 说明 |
|--------|---------|------|
| `get_selection` | — | 获取当前选中节点的 UUID 列表 |
| `select` | `uuids` | 选中指定节点 |
| `clear_selection` | — | 取消所有选中 |
| `focus_node` | `uuid` | 将编辑器摄像机聚焦到节点 |

### 构建与预览

| Action | 关键参数 | 说明 |
|--------|---------|------|
| `project_info` | — | 获取项目名称、路径、引擎版本 |
| `build` | `platform` | 构建（web-mobile / android / ios / wechatgame 等） |
| `build_query` | — | 查询当前构建状态 |
| `preview` | — | 在浏览器中打开预览 |
| `preview_refresh` | — | 刷新预览页面 |

### 播放模式

| Action | 说明 |
|--------|------|
| `play_in_editor` | 进入编辑器内播放模式 |
| `pause_in_editor` | 暂停播放 |
| `stop_in_editor` | 停止播放 |
| `step_in_editor` | 单帧步进 |

### 调试输出

| Action | 关键参数 | 说明 |
|--------|---------|------|
| `log` | `text` | 输出普通日志到控制台 |
| `warn` | `text` | 输出警告 |
| `error` | `text` | 输出错误 |
| `clear_console` | — | 清空控制台 |
| `show_notification` | `text`, `title` | 显示编辑器通知（非阻塞） |

---

## 6. 🎬 animation_tool — 动画工具（10 Actions）

为节点上的 Animation 组件创建关键帧动画并控制播放。

| Action | 关键参数 | 说明 |
|--------|---------|------|
| `create_clip` | `uuid`, `clipName`, `tracks` | 创建含关键帧轨道的动画片段 |
| `play` | `uuid`, `clipName` | 播放指定动画片段 |
| `pause` | `uuid` | 暂停当前动画 |
| `resume` | `uuid` | 恢复暂停的动画 |
| `stop` | `uuid` | 停止动画并重置到初始姿态 |
| `get_state` | `uuid` | 获取当前播放状态（播放中/暂停/速度/片段名） |
| `list_clips` | `uuid` | 列出节点上所有动画片段 |
| `set_current_time` | `uuid`, `time` | 跳转到指定时间点 |
| `set_speed` | `uuid`, `speed` | 设置播放速度倍率 |
| `crossfade` | `uuid`, `clipName`, `duration` | 渐变过渡到另一片段 |

**支持属性**：`position`、`rotation`、`scale`、`opacity`、`color`、`position.x/y/z`

**循环模式**：`Normal`、`Loop`、`PingPong`、`Reverse`、`LoopReverse`

---

## 7. ⚙️ physics_tool — 物理工具（10 Actions）

创建和配置 2D/3D 物理组件。

| Action | 关键参数 | 说明 |
|--------|---------|------|
| `get_collider_info` | `uuid` | 获取节点上所有碰撞体与刚体详情 |
| `add_collider` | `uuid`, `colliderType` | 添加碰撞体（box2d/circle2d/polygon2d/capsule2d/box3d/sphere3d/capsule3d） |
| `set_collider_size` | `uuid`, `width`, `height` | 设置碰撞体尺寸 |
| `add_rigidbody` | `uuid`, `bodyType` | 添加刚体（Dynamic/Static/Kinematic） |
| `set_rigidbody_property` | `uuid`, `property`, `value` | 设置刚体属性（质量、阻尼等） |
| `set_physics_material` | `uuid`, `friction`, `restitution`, `density` | 设置物理材质 |
| `set_collision_group` | `uuid`, `group` | 设置碰撞分组/层 |
| `get_physics_world` | — | 获取物理世界配置（重力、时间步长等） |
| `set_physics_world` | `gravity`, `allowSleep`, `fixedTimeStep` | 配置物理世界 |
| `add_joint` | `uuid`, `jointType`, `connectedBody` | 添加物理关节（distance/spring/hinge/fixed/slider） |

---

## 8. ⚡ preferences — 偏好设置（7 Actions）

读写 Cocos Creator 编辑器偏好，支持作用域（全局/项目/默认）。

| Action | 关键参数 | 说明 |
|--------|---------|------|
| `get` | `key`, `scope` | 读取偏好值（scope: global/project/default） |
| `set` | `key`, `value`, `scope` | 写入偏好值 |
| `list` | — | 列出所有偏好项及作用域 |
| `get_global` | `key` | 快捷读取全局偏好 |
| `set_global` | `key`, `value` | 快捷写入全局偏好 |
| `get_project` | `key` | 快捷读取项目偏好 |
| `set_project` | `key`, `value` | 快捷写入项目偏好 |

**常用 Key**：`general.language`、`general.theme`、`preview.port`、`builder.compressTexture`

---

## 9. 📡 broadcast — 广播事件（5 Actions）

监听和发送编辑器广播事件。

| Action | 关键参数 | 说明 |
|--------|---------|------|
| `poll` | `since`（时间戳 ms） | 获取指定时间之后的新事件 |
| `history` | `limit`（默认 20） | 获取最近 N 条事件历史 |
| `clear` | — | 清空事件缓冲区 |
| `send` | `channel`, `data` | 向所有监听者广播自定义消息 |
| `send_ipc` | `module`, `message`, `args` | 发送原始 Editor IPC 消息 |

**内置事件类型**：`scene:ready`、`scene:saved`、`asset:add`、`asset:delete`、`asset:change`、`selection:select`

---

## 10. 🔧 tool_management — 工具管理（4 Actions）

动态启用/禁用 MCP 工具，减少 token 消耗和 AI 混淆。

| Action | 关键参数 | 说明 |
|--------|---------|------|
| `list_all` | — | 列出所有工具及启用/禁用状态 |
| `enable` | `toolName` | 启用已禁用的工具 |
| `disable` | `toolName` | 禁用工具（不再出现在工具列表中） |
| `get_stats` | — | 获取统计（工具总数、Action 总数、启用/禁用数） |

> `tool_management` 本身不可被禁用。

---

## 11. 🧩 create_prefab_atomic — 原子创建 Prefab

一次调用完成 Prefab 创建全流程，**任意步骤失败自动回滚**。

**Pipeline**：确保目录 → 创建临时根节点 → 添加组件 → 设置属性 → 保存 `.prefab` → 刷新 AssetDB → 清理临时节点

**关键参数**：

| 参数 | 说明 |
|------|------|
| `prefabPath` | ✅ `db://` 路径，如 `db://assets/prefabs/Hero.prefab` |
| `nodeName` | 根节点名称（默认取文件名） |
| `components` | 组件数组：`[{ "type": "Sprite", "properties": {...} }]` |
| `children` | 子节点数组：`[{ "name": "Icon", "components": [...] }]` |
| `position` | 初始位置 `{ x, y, z }` |
| `cleanupSourceNode` | 保存后删除临时节点（默认 `true`） |

---

## 12. 🖼️ import_and_apply_texture — 导入并应用纹理

从外部文件导入图片，设置为 SpriteFrame 类型，并应用到节点 Sprite 组件。**选中感知**：省略 `nodeUuid` 则使用当前编辑器选中节点。

**关键参数**：

| 参数 | 说明 |
|------|------|
| `sourcePath` | ✅ OS 文件路径，如 `C:/Art/hero.png` |
| `targetUrl` | `db://` 目标路径（默认: `db://assets/textures/<文件名>`） |
| `nodeUuid` | 目标节点 UUID（默认: 当前选中） |
| `autoAddSprite` | 若节点未有 Sprite 组件则自动添加（默认 `true`） |

---

## 13. 🎞️ create_tween_animation_atomic — 原子创建补间动画

一次调用创建完整动画片段并挂载到节点。

**关键参数**：

| 参数 | 说明 |
|------|------|
| `tracks` | ✅ 动画轨道数组（至少 1 个） |
| `nodeUuid` | 目标节点 UUID |
| `clipName` | 片段名称（默认 `NewClip`） |
| `duration` | 总时长（秒，默认 1.0） |
| `wrapMode` | `Normal`/`Loop`/`PingPong`/`Reverse`/`LoopReverse` |
| `autoPlay` | 创建后立即播放（默认 `false`） |
| `savePath` | 保存为 `.anim` 资产的 `db://` 路径（可选） |

**轨道格式示例**：

```json
{
  "property": "position",
  "keyframes": [
    { "time": 0, "value": { "x": 0, "y": 0, "z": 0 } },
    { "time": 1, "value": { "x": 200, "y": 0, "z": 0 }, "easing": "cubicInOut" }
  ]
}
```

**支持缓动函数**：`linear`、`quadIn/Out/InOut`、`cubicIn/Out/InOut`、`sineIn/Out/InOut`、`elasticIn/Out`、`bounceIn/Out/InOut`、`backIn/Out/InOut` 等 30+ 种

---

## 14. 🔮 auto_fit_physics_collider — 自动拟合碰撞体

自动检测 Sprite 纹理轮廓（行进方块算法 + RDP 简化），为节点创建精确碰撞体。

**关键参数**：

| 参数 | 说明 |
|------|------|
| `nodeUuid` | 目标节点 UUID（默认: 当前选中） |
| `colliderType` | `auto`（默认）/ `polygon` / `box` / `circle` |
| `alphaThreshold` | Alpha 阈值（0–1，默认 0.1） |
| `simplifyTolerance` | 多边形简化容差（默认 2.0） |
| `maxVertices` | 多边形最大顶点数（3–256，默认 64） |
| `sensor` | 是否为触发器（只检测不产生物理响应） |
| `friction` / `restitution` / `density` | 物理材质属性 |

**工作模式**：
- `auto`：优先从纹理 Alpha 提取多边形轮廓，失败则回退到 Box
- `polygon`：强制使用 Alpha 轮廓（多边形碰撞体）
- `box`：从 UITransform contentSize 生成矩形碰撞体
- `circle`：从节点尺寸生成圆形碰撞体

---

## 15. 🔩 execute_script — 逃生舱

当标准工具不能满足需求时，直接调用场景脚本方法。

**可调用的方法**：

`getSceneTree`、`getAllNodesList`、`getSceneStats`、`getNodeDetail`、`findNodeByPath`、`getNodeComponents`、`setNodePosition`、`setNodeRotation`、`setNodeScale`、`setNodeName`、`setNodeActive`、`createChildNode`、`destroyNode`、`reparentNode`、`addComponent`、`removeComponent`、`setComponentProperty`、`dispatchQuery`、`dispatchOperation`、`dispatchEngineAction`

---

## 16. 🪝 register_custom_macro — 注册自定义宏

在运行时动态注册新工具，注册后立即出现在 MCP 工具列表中。

**参数**：

| 参数 | 说明 |
|------|------|
| `name` | ✅ 工具名称（仅字母/数字/下划线） |
| `description` | ✅ 工具描述（显示给 AI 客户端） |
| `sceneMethodName` | ✅ 要调用的场景脚本方法名 |

---

## AI 规则（所有工具强制执行）

1. **查询优先** — 修改前**必须**先用 `scene_query` 获取当前状态，不假设节点存在
2. **UUID 优先** — 始终优先用 UUID 引用节点和资产
3. **检查返回值** — 始终验证 `success` 或 `error` 字段
4. **危险确认** — `destroy_node` 等破坏性操作**必须**携带 `confirmDangerous: true`
5. **批量优先** — 多步操作使用 `action=batch` + `$N.uuid` 交叉引用

---

## 错误响应格式

所有工具统一返回错误格式：

```json
{
  "success": false,
  "tool": "scene_operation",
  "action": "add_component",
  "error": "未找到组件类: sprite",
  "suggestion": "可尝试: Sprite, Label, Button, Layout, ScrollView, UITransform, Mask, RichText"
}
```

---

## 典型工作流示例

### 查询后修改

```
1. scene_query action=find_nodes_by_name → 获取 UUID
2. scene_operation action=set_position uuid=<UUID> x=100 y=200 z=0
```

### 一键导入纹理

```
import_and_apply_texture sourcePath="C:/Art/icon.png"
(无需选 nodeUuid，AI 自动使用当前选中节点)
```

### 批量创建层级（跨引用）

```json
{
  "action": "batch",
  "operations": [
    { "action": "create_node", "name": "Parent" },
    { "action": "create_node", "name": "Child", "parentUuid": "$0.uuid" },
    { "action": "add_component", "uuid": "$1.uuid", "component": "Sprite" }
  ]
}
```

### 原子宏替代手动链式调用

| ❌ 手动（易失败，无回滚） | ✅ 原子宏 |
|--------------------------|---------|
| create_node → add_component → set_property → create_prefab → refresh → destroy_node | `create_prefab_atomic` |
| import → url_to_uuid → set_property（3步） | `import_and_apply_texture` |

---

*Community Edition · Open Source on GitHub · BSL 1.1*
