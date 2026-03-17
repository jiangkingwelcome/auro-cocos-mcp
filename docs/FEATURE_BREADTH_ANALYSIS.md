# Aura 功能广度扩展分析

> 在当前框架下，功能广度是否还能再提升？  
> 分析日期：2025-03-07

## 结论概览

**可以继续提升。** 当前架构（17 工具、185+ actions）仍有较大扩展空间，主要受限于：
1. Cocos Creator Editor IPC 的暴露程度
2. 场景脚本（`execute-scene-script`）可调用的引擎 API
3. 新增 actions 的边际收益与维护成本

---

## 一、当前能力矩阵

| 工具 | Actions 数 | 主要能力 |
|------|-----------|----------|
| scene_query | 32 | 场景树、节点查询、验证、快照、性能审计 |
| scene_operation | 52 | 节点 CRUD、组件、预制体、UI 组件、事件绑定、批量 |
| editor_action | 38 | 场景/选择/构建/预览、Gizmo、日志、面板 |
| engine_action | 8 | 帧率、暂停、系统信息、渲染/内存统计 |
| asset_operation | 29 | 资源 CRUD、依赖、验证、材质、脚本生成 |
| preferences | 7 | 全局/项目偏好读写 |
| broadcast | 5 | 事件轮询、历史、发送、IPC 广播 |
| reference_image | 7 | 参考图叠加、增删改 |
| tool_management | 4 | 工具启用/禁用、统计 |

---

## 二、可扩展方向（按优先级）

### P0：高价值、低实现成本

| 方向 | 建议 actions | 实现路径 |
|------|-------------|----------|
| **scene_query** | `get_node_bounds` | 返回节点 AABB / contentSize，用于布局计算 |
| **scene_query** | `find_nodes_by_tag` | 若引擎支持 tag，按 tag 筛选节点 |
| **scene_operation** | `set_anchor_point` | UITransform.anchorPoint 设置 |
| **scene_operation** | `set_content_size` | UITransform.contentSize 设置 |
| **editor_action** | `zoom_to_fit` | 场景视图缩放到包含选中节点 |
| **asset_operation** | `get_asset_size` | 返回资源文件大小（用于包体分析） |

### P1：中等价值、需少量新逻辑

| 方向 | 建议 actions | 实现路径 |
|------|-------------|----------|
| **scene_query** | `get_animation_clips_on_node` | 查询节点上 Animation 组件的 clip 列表 |
| **scene_query** | `get_collider_info` | 返回 Collider 形状、尺寸、是否触发器 |
| **scene_operation** | `batch_set_property` | 对多个节点设置同一属性（基于 batch 扩展） |
| **scene_operation** | `group_nodes` | 创建父节点并 reparent 多个子节点 |
| **asset_operation** | `batch_import` | 批量导入外部文件到指定目录 |
| **engine_action** | `get_physics_stats` | 物理世界统计（刚体数、碰撞对数等） |

### P2：高价值、实现成本较高

| 方向 | 建议 actions | 实现路径 |
|------|-------------|----------|
| **animation_tool**（新工具） | `list_clips` / `play_clip` / `stop_clip` / `set_clip_speed` | 动画片段播放控制 |
| **scene_operation** | `create_animation_clip` | 为 Animation 组件添加/关联 clip |
| **asset_operation** | `create_sprite_atlas` | 创建图集配置、触发打包 |
| **asset_operation** | `slice_sprite` | 9-slice 切图配置 |
| **editor_action** | `set_view_mode` | 2D/3D/线框等视图模式切换 |

### P3：依赖 Cocos 版本或未验证 API

| 方向 | 说明 |
|------|------|
| `run_unit_tests` | 需确认 Cocos 是否提供测试框架 IPC |
| `export_scene_to_gltf` | 需确认是否有 glTF 导出扩展 |
| Terrain 编辑 | 3D 项目专用，API 需单独调研 |
| Tilemap 图层编辑 | 需 TiledMap 组件详细 API |

---

## 三、按工具维度的扩展清单

### scene_query（32 → 约 40）

- `get_node_bounds`：节点包围盒 / contentSize
- `find_nodes_by_tag`：按 tag 查找
- `get_animation_clips_on_node`：节点动画片段
- `get_collider_info`：碰撞体信息
- `get_physics_body_info`：刚体属性
- `find_nodes_in_rect`：矩形区域内节点（2D）
- `get_prefab_instance_info`：预制体实例与变体信息

### scene_operation（52 → 约 60）

- `set_anchor_point`：锚点
- `set_content_size`：内容尺寸
- `batch_set_property`：批量设置属性
- `group_nodes` / `ungroup_nodes`：成组/解组
- `set_collider_properties`：碰撞体参数
- `create_animation_clip`：创建/关联动画片段

### editor_action（38 → 约 45）

- `zoom_to_fit`：缩放到合适视野
- `set_view_mode`：视图模式
- `get_scene_view_state`：当前视图状态
- `run_build_and_preview`：构建后自动预览

### asset_operation（29 → 约 35）

- `get_asset_size`：文件大小
- `batch_import`：批量导入
- `create_sprite_atlas`：图集创建
- `slice_sprite`：9-slice
- `diff_asset_meta`：meta 差异对比

### engine_action（8 → 约 12）

- `get_physics_stats`：物理统计
- `set_physics_debug_draw`：物理调试绘制
- `get_audio_stats`：音频统计
- `set_time_scale`：时间缩放

---

## 四、新增工具类别的可行性

| 新工具 | 用途 | 可行性 |
|--------|------|--------|
| **animation_tool** | 动画片段查询、播放、速度控制 | 高，基于 Animation 组件 |
| **physics_tool** | 物理材质、碰撞层、关节配置 | 中，需梳理 Physics API |
| **tilemap_tool** | 瓦片地图图层、瓦片编辑 | 中，依赖 TiledMap 组件 |
| **terrain_tool** | 地形编辑（3D） | 低，3D 专用，API 需调研 |

---

## 五、实现约束与注意事项

1. **Editor IPC 可用性**  
   - `scene`、`asset-db`、`builder`、`preview`、`selection`、`panel` 等模块的 IPC 消息需在「开发者 → 消息管理器」中确认  
   - 部分能力（如 `set-transform-tool`、`set-grid-visible`）可能因版本不同而缺失

2. **场景脚本能力**  
   - 所有 `dispatchQuery` / `dispatchOperation` / `dispatchEngineAction` 均在 `execute-scene-script` 中执行  
   - 只能调用引擎运行时 API（`cc.*`），不能直接访问 Editor 内部实现

3. **Token 与复杂度**  
   - 工具描述和 schema 会随 actions 增加而变长，影响 MCP 上下文  
   - 可通过 `tool_management` 按需禁用低频工具，控制 token 消耗

4. **向后兼容**  
   - 新增 action 应保持可选参数、默认值清晰  
   - 对不支持的 Cocos 版本，应返回明确错误信息，而非静默失败

---

## 六、建议实施顺序

1. **第一阶段**：P0 的 6 个 actions（约 1–2 天）
2. **第二阶段**：P1 的 6 个 actions（约 2–3 天）
3. **第三阶段**：视需求决定是否新增 `animation_tool` 或扩展 `physics_tool`

---

## 七、总结

| 维度 | 当前 | 扩展后（保守估计） |
|------|------|-------------------|
| 工具数 | 17 | 17–19 |
| Actions 总数 | 185+ | 220–250 |
| 覆盖场景 | 场景/资源/编辑器/引擎/偏好/广播/参考图/工具管理 | 同上 + 动画/物理/图集等 |

在现有架构下，通过增加 actions 和 1–2 个新工具，功能广度仍有约 **20–35%** 的提升空间，且无需改动核心框架。
