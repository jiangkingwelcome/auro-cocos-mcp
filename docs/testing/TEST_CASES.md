# Aura for Cocos Creator - 测试用例清单
> 共 325 个测试用例
---

## 🔌 Bridge 状态

### `bridge_status`

#### 测试 #1: 基本连通性检查
**输入参数:**
```json
{}
```
**期望结果:** 返回 {connected:true, version:"3.8.x", uptime, port}
**备注:** 启动后第一步调用
---

#### 测试 #2: 桥接断开
**输入参数:**
```json
{}
```
**期望结果:** 返回 {connected:false, error:"ECONNREFUSED"}
**备注:** 编辑器未启动或插件未加载
---

## 🔍 场景查询

### `tree`

#### 测试 #3: 获取默认场景树
**输入参数:**
```json
{
  "action": "tree"
}
```
**期望结果:** 返回过滤隐藏节点的层级树 {name,uuid,children[]}
**备注:** 默认 includeInternal=false
---

#### 测试 #4: 包含内部节点
**输入参数:**
```json
{
  "action": "tree",
  "includeInternal": true
}
```
**期望结果:** 返回含 ScrollView 内部节点、Profiler 节点的完整树
---

#### 测试 #5: 空场景
**输入参数:**
```json
{
  "action": "tree"
}
```
**期望结果:** 返回仅含 Scene 根节点的树
---

### `list`

#### 测试 #6: 扁平节点列表
**输入参数:**
```json
{
  "action": "list"
}
```
**期望结果:** 返回 [{uuid,name,depth,childCount},...] 数组
---

#### 测试 #7: 含内部节点
**输入参数:**
```json
{
  "action": "list",
  "includeInternal": true
}
```
**期望结果:** 结果数量多于默认，包含引擎隐藏节点
---

### `stats`

#### 测试 #8: 场景统计
**输入参数:**
```json
{
  "action": "stats"
}
```
**期望结果:** 返回 {nodeCount,activeCount,sceneName,filteredInternalNodes}
---

#### 测试 #9: 含内部统计
**输入参数:**
```json
{
  "action": "stats",
  "includeInternal": true
}
```
**期望结果:** nodeCount 包含所有运行时节点
---

### `node_detail`

#### 测试 #10: 查看节点详情
**输入参数:**
```json
{
  "action": "node_detail",
  "uuid": "<node-uuid>"
}
```
**期望结果:** 返回 {name,position,rotation,scale,components[],active,layer}
---

#### 测试 #11: 无效 UUID
**输入参数:**
```json
{
  "action": "node_detail",
  "uuid": "invalid"
}
```
**期望结果:** 返回 {error:"未找到节点"}
---

### `find_by_path`

#### 测试 #12: 按路径查找
**输入参数:**
```json
{
  "action": "find_by_path",
  "path": "Canvas/Panel/Button"
}
```
**期望结果:** 返回匹配节点 uuid 和详情
---

#### 测试 #13: 路径不存在
**输入参数:**
```json
{
  "action": "find_by_path",
  "path": "NotExist/X"
}
```
**期望结果:** 返回 {error:"未找到路径"}
---

### `get_components`

#### 测试 #14: 获取组件列表
**输入参数:**
```json
{
  "action": "get_components",
  "uuid": "<uuid>"
}
```
**期望结果:** 返回 [{type:"UITransform",...},{type:"Sprite",...}]
---

### `get_parent`

#### 测试 #15: 获取父节点
**输入参数:**
```json
{
  "action": "get_parent",
  "uuid": "<uuid>"
}
```
**期望结果:** 返回父节点 {uuid,name}
---

#### 测试 #16: 根节点
**输入参数:**
```json
{
  "action": "get_parent",
  "uuid": "<scene-root>"
}
```
**期望结果:** 返回 null 或 scene 根
---

### `get_children`

#### 测试 #17: 直接子节点
**输入参数:**
```json
{
  "action": "get_children",
  "uuid": "<uuid>"
}
```
**期望结果:** 返回 [{uuid,name},...] 列表
---

### `get_sibling`

#### 测试 #18: 兄弟节点
**输入参数:**
```json
{
  "action": "get_sibling",
  "uuid": "<uuid>"
}
```
**期望结果:** 返回同级节点列表
---

### `get_world_position`

#### 测试 #19: 世界坐标
**输入参数:**
```json
{
  "action": "get_world_position",
  "uuid": "<uuid>"
}
```
**期望结果:** 返回 {x,y,z}
---

### `get_world_rotation`

#### 测试 #20: 世界旋转
**输入参数:**
```json
{
  "action": "get_world_rotation",
  "uuid": "<uuid>"
}
```
**期望结果:** 返回 {x,y,z} 欧拉角
---

### `get_world_scale`

#### 测试 #21: 世界缩放
**输入参数:**
```json
{
  "action": "get_world_scale",
  "uuid": "<uuid>"
}
```
**期望结果:** 返回 {x,y,z}
---

### `get_active_in_hierarchy`

#### 测试 #22: 节点激活
**输入参数:**
```json
{
  "action": "get_active_in_hierarchy",
  "uuid": "<uuid>"
}
```
**期望结果:** 返回 {activeInHierarchy:true/false}
---

#### 测试 #23: 父节点禁用
**输入参数:**
```json
{
  "action": "get_active_in_hierarchy",
  "uuid": "<child>"
}
```
**期望结果:** 返回 false（即使自身 active=true）
---

### `get_node_bounds`

#### 测试 #24: 2D 边界
**输入参数:**
```json
{
  "action": "get_node_bounds",
  "uuid": "<sprite>"
}
```
**期望结果:** 返回 UITransform local/world rect
---

#### 测试 #25: 3D 边界
**输入参数:**
```json
{
  "action": "get_node_bounds",
  "uuid": "<mesh>"
}
```
**期望结果:** 返回 AABB {min,max,center,halfExtents}
---

### `find_nodes_by_name`

#### 测试 #26: 按名搜索
**输入参数:**
```json
{
  "action": "find_nodes_by_name",
  "name": "Button"
}
```
**期望结果:** 返回所有含 "Button" 的节点
---

#### 测试 #27: 无匹配
**输入参数:**
```json
{
  "action": "find_nodes_by_name",
  "name": "XXXXXX"
}
```
**期望结果:** 返回空数组 []
---

### `find_nodes_by_component`

#### 测试 #28: 按组件搜索
**输入参数:**
```json
{
  "action": "find_nodes_by_component",
  "component": "Sprite"
}
```
**期望结果:** 返回所有挂 Sprite 的节点
---

#### 测试 #29: 自定义脚本
**输入参数:**
```json
{
  "action": "find_nodes_by_component",
  "component": "PlayerController"
}
```
**期望结果:** 返回挂该脚本的节点
---

### `find_nodes_by_layer`

#### 测试 #30: 精确匹配
**输入参数:**
```json
{
  "action": "find_nodes_by_layer",
  "layer": 33554432
}
```
**期望结果:** 返回所有 UI_2D 层节点
---

#### 测试 #31: 掩码交集
**输入参数:**
```json
{
  "action": "find_nodes_by_layer",
  "layer": 1,
  "exact": false
}
```
**期望结果:** 返回含 DEFAULT 位的节点
---

### `get_component_property`

#### 测试 #32: 读 Label 文本
**输入参数:**
```json
{
  "action": "get_component_property",
  "uuid": "<uuid>",
  "component": "Label",
  "property": "string"
}
```
**期望结果:** 返回 {value:"Hello World"}
---

#### 测试 #33: 读 spriteFrame
**输入参数:**
```json
{
  "action": "get_component_property",
  "uuid": "<uuid>",
  "component": "Sprite",
  "property": "spriteFrame"
}
```
**期望结果:** 返回 spriteFrame UUID
---

### `get_node_components_properties`

#### 测试 #34: 全部组件属性
**输入参数:**
```json
{
  "action": "get_node_components_properties",
  "uuid": "<uuid>"
}
```
**期望结果:** 返回所有组件全部属性快照
---

### `get_camera_info`

#### 测试 #35: 查所有摄像机
**输入参数:**
```json
{
  "action": "get_camera_info"
}
```
**期望结果:** 返回场景全部 Camera 信息列表
---

#### 测试 #36: 指定摄像机
**输入参数:**
```json
{
  "action": "get_camera_info",
  "uuid": "<cam>"
}
```
**期望结果:** 返回 fov/near/far/projection 等参数
---

### `get_canvas_info`

#### 测试 #37: Canvas 信息
**输入参数:**
```json
{
  "action": "get_canvas_info"
}
```
**期望结果:** 返回设计分辨率、适配模式等
---

### `get_scene_globals`

#### 测试 #38: 全局设置
**输入参数:**
```json
{
  "action": "get_scene_globals"
}
```
**期望结果:** 返回 ambient/fog/shadows 原始数据
---

### `get_scene_environment`

#### 测试 #39: 结构化环境
**输入参数:**
```json
{
  "action": "get_scene_environment"
}
```
**期望结果:** 返回 {ambient:{skyColor,skyIllum},shadows,fog,skybox,octree}
---

### `get_light_info`

#### 测试 #40: 所有灯光
**输入参数:**
```json
{
  "action": "get_light_info"
}
```
**期望结果:** 返回全部灯光组件（类型/颜色/亮度/阴影）
---

#### 测试 #41: 指定灯光
**输入参数:**
```json
{
  "action": "get_light_info",
  "uuid": "<light>"
}
```
**期望结果:** 仅返回该节点灯光信息
---

### `get_material_info`

#### 测试 #42: 材质信息
**输入参数:**
```json
{
  "action": "get_material_info",
  "uuid": "<renderer>"
}
```
**期望结果:** 返回 {effectName,technique,passes[],uniforms}
---

### `get_animation_state`

#### 测试 #43: 动画状态
**输入参数:**
```json
{
  "action": "get_animation_state",
  "uuid": "<anim>"
}
```
**期望结果:** 返回 {playing,currentClip,currentTime,clips[]}
---

#### 测试 #44: 无动画组件
**输入参数:**
```json
{
  "action": "get_animation_state",
  "uuid": "<no-anim>"
}
```
**期望结果:** 返回 {error:"没有 Animation 组件"}
---

### `get_collider_info`

#### 测试 #45: 碰撞器信息
**输入参数:**
```json
{
  "action": "get_collider_info",
  "uuid": "<uuid>"
}
```
**期望结果:** 返回碰撞器列表 + RigidBody 信息
---

### `screen_to_world`

#### 测试 #46: 屏幕转世界
**输入参数:**
```json
{
  "action": "screen_to_world",
  "screenX": 400,
  "screenY": 300,
  "screenZ": 0
}
```
**期望结果:** 返回 {worldX,worldY,worldZ}
---

#### 测试 #47: 指定摄像机
**输入参数:**
```json
{
  "action": "screen_to_world",
  "uuid": "<cam>",
  "screenX": 0,
  "screenY": 0
}
```
**期望结果:** 使用指定摄像机转换
---

### `world_to_screen`

#### 测试 #48: 世界转屏幕
**输入参数:**
```json
{
  "action": "world_to_screen",
  "worldX": 100,
  "worldY": 200,
  "worldZ": 0
}
```
**期望结果:** 返回 {screenX,screenY,screenZ}
---

### `check_script_ready`

#### 测试 #49: 脚本已编译
**输入参数:**
```json
{
  "action": "check_script_ready",
  "script": "PlayerController"
}
```
**期望结果:** 返回 {ready:true, isComponent:true}
---

#### 测试 #50: 未就绪
**输入参数:**
```json
{
  "action": "check_script_ready",
  "script": "NewScript"
}
```
**期望结果:** 返回 {ready:false, message:"尚未注册"}
---

#### 测试 #51: 内置组件
**输入参数:**
```json
{
  "action": "check_script_ready",
  "script": "Sprite"
}
```
**期望结果:** 返回 {ready:true, isComponent:true}
---

### `get_script_properties`

#### 测试 #52: 获取属性
**输入参数:**
```json
{
  "action": "get_script_properties",
  "script": "PlayerController"
}
```
**期望结果:** 返回 {properties:[{name:"speed",type:"Float",default:10},...]}
---

#### 测试 #53: 无 @property
**输入参数:**
```json
{
  "action": "get_script_properties",
  "script": "EmptyScript"
}
```
**期望结果:** 返回 {propertyCount:0, properties:[]}
---

#### 测试 #54: 不存在
**输入参数:**
```json
{
  "action": "get_script_properties",
  "script": "XXX"
}
```
**期望结果:** 返回 {error:"未找到脚本类"}
---

### `get_current_selection`

#### 测试 #55: 有选中
**输入参数:**
```json
{
  "action": "get_current_selection"
}
```
**期望结果:** 返回 {selected:["<uuid>"], focused:{name,...}}
---

#### 测试 #56: 无选中
**输入参数:**
```json
{
  "action": "get_current_selection"
}
```
**期望结果:** 返回 {selected:[], message:"当前没有选中节点"}
---

### `get_active_scene_focus`

#### 测试 #57: 有选中→返回详情
**输入参数:**
```json
{
  "action": "get_active_scene_focus"
}
```
**期望结果:** 返回 {source:"selection", focus:{...}}
---

#### 测试 #58: 无选中→返回统计
**输入参数:**
```json
{
  "action": "get_active_scene_focus"
}
```
**期望结果:** 返回 {source:"scene", focus:{nodeCount,...}}
---

### `list_all_scenes`

#### 测试 #59: 列出场景
**输入参数:**
```json
{
  "action": "list_all_scenes"
}
```
**期望结果:** 返回 [{url:"db://assets/scenes/Main.scene",...},...]
---

### `validate_scene`

#### 测试 #60: 场景验证
**输入参数:**
```json
{
  "action": "validate_scene"
}
```
**期望结果:** 返回 {issues:[],score:85}
---

### `deep_validate_scene`

#### 测试 #61: 深度验证
**输入参数:**
```json
{
  "action": "deep_validate_scene"
}
```
**期望结果:** 返回缺失资源、孤立节点、修复建议
---

### `detect_2d_3d`

#### 测试 #62: 2D 场景
**输入参数:**
```json
{
  "action": "detect_2d_3d"
}
```
**期望结果:** 返回 {mode:"2D"}
---

#### 测试 #63: 3D 场景
**输入参数:**
```json
{
  "action": "detect_2d_3d"
}
```
**期望结果:** 返回 {mode:"3D"}
---

#### 测试 #64: 混合场景
**输入参数:**
```json
{
  "action": "detect_2d_3d"
}
```
**期望结果:** 返回 {mode:"Mixed"}
---

### `performance_audit`

#### 测试 #65: 性能审计
**输入参数:**
```json
{
  "action": "performance_audit"
}
```
**期望结果:** 返回 {issues[],metrics:{nodeCount,maxDepth},suggestions[]}
---

### `list_available_components`

#### 测试 #66: 组件列表
**输入参数:**
```json
{
  "action": "list_available_components"
}
```
**期望结果:** 返回引擎内置+自定义脚本组件，按类别分组
---

### `scene_snapshot`

#### 测试 #67: 默认快照
**输入参数:**
```json
{
  "action": "scene_snapshot"
}
```
**期望结果:** 返回场景状态快照（最多 500 节点）
---

#### 测试 #68: 限制数量
**输入参数:**
```json
{
  "action": "scene_snapshot",
  "maxNodes": 100
}
```
**期望结果:** 返回最多 100 节点快照
---

### `scene_diff`

#### 测试 #69: 对比快照
**输入参数:**
```json
{
  "action": "scene_diff",
  "snapshotA": {},
  "snapshotB": {}
}
```
**期望结果:** 返回 {added[],removed[],modified[]}
---

### `export_scene_json`

#### 测试 #70: 导出 JSON
**输入参数:**
```json
{
  "action": "export_scene_json"
}
```
**期望结果:** 返回完整场景节点树 JSON
---

### `measure_distance`

#### 测试 #71: 测量距离
**输入参数:**
```json
{
  "action": "measure_distance",
  "uuidA": "<a>",
  "uuidB": "<b>"
}
```
**期望结果:** 返回 {distance2D,distance3D,delta:{x,y,z}}
---

## ⚙️ 场景操作

### `create_node`

#### 测试 #72: 创建空节点
**输入参数:**
```json
{
  "action": "create_node",
  "name": "MyNode"
}
```
**期望结果:** 返回 {uuid:"<new>"}，在场景根下
---

#### 测试 #73: 指定父节点
**输入参数:**
```json
{
  "action": "create_node",
  "name": "Child",
  "parentUuid": "<parent>"
}
```
**期望结果:** 在父节点下创建子节点
---

#### 测试 #74: 指定排序
**输入参数:**
```json
{
  "action": "create_node",
  "name": "First",
  "parentUuid": "<p>",
  "siblingIndex": 0
}
```
**期望结果:** 插入到兄弟列表第一位
---

### `destroy_node`

#### 测试 #75: 删除节点
**输入参数:**
```json
{
  "action": "destroy_node",
  "uuid": "<uuid>",
  "confirmDangerous": true
}
```
**期望结果:** 返回 {success:true}
---

#### 测试 #76: 缺少确认
**输入参数:**
```json
{
  "action": "destroy_node",
  "uuid": "<uuid>"
}
```
**期望结果:** 返回 {error:"需要 confirmDangerous=true"}
---

### `reparent`

#### 测试 #77: 移动到新父节点
**输入参数:**
```json
{
  "action": "reparent",
  "uuid": "<child>",
  "parentUuid": "<newP>"
}
```
**期望结果:** 返回 {success:true}
---

### `duplicate_node`

#### 测试 #78: 克隆含子节点
**输入参数:**
```json
{
  "action": "duplicate_node",
  "uuid": "<uuid>"
}
```
**期望结果:** 返回 {clonedUuid:"<new>"}
---

#### 测试 #79: 仅克隆自身
**输入参数:**
```json
{
  "action": "duplicate_node",
  "uuid": "<uuid>",
  "includeChildren": false
}
```
**期望结果:** 不含子节点的克隆
---

### `clear_children`

#### 测试 #80: 清空子节点
**输入参数:**
```json
{
  "action": "clear_children",
  "uuid": "<uuid>",
  "confirmDangerous": true
}
```
**期望结果:** 删除全部子节点
---

### `group_nodes`

#### 测试 #81: 编组
**输入参数:**
```json
{
  "action": "group_nodes",
  "uuids": [
    "<a>",
    "<b>"
  ],
  "name": "Group"
}
```
**期望结果:** 创建 Group 节点并将两个节点移入
---

### `set_position`

#### 测试 #82: 设本地位置
**输入参数:**
```json
{
  "action": "set_position",
  "uuid": "<uuid>",
  "x": 100,
  "y": 200,
  "z": 0
}
```
**期望结果:** 本地坐标变为 (100,200,0)
---

### `set_rotation`

#### 测试 #83: 设本地旋转
**输入参数:**
```json
{
  "action": "set_rotation",
  "uuid": "<uuid>",
  "x": 0,
  "y": 45,
  "z": 0
}
```
**期望结果:** 绕 Y 轴旋转 45°
---

### `set_scale`

#### 测试 #84: 设缩放
**输入参数:**
```json
{
  "action": "set_scale",
  "uuid": "<uuid>",
  "x": 2,
  "y": 2,
  "z": 1
}
```
**期望结果:** 放大 2 倍
---

### `set_world_position`

#### 测试 #85: 设世界位置
**输入参数:**
```json
{
  "action": "set_world_position",
  "uuid": "<uuid>",
  "x": 0,
  "y": 500,
  "z": 0
}
```
**期望结果:** 世界坐标设为 (0,500,0)
---

### `set_world_rotation`

#### 测试 #86: 设世界旋转
**输入参数:**
```json
{
  "action": "set_world_rotation",
  "uuid": "<uuid>",
  "x": 0,
  "y": 90,
  "z": 0
}
```
**期望结果:** 世界旋转 (0,90,0)
---

### `set_world_scale`

#### 测试 #87: 设世界缩放
**输入参数:**
```json
{
  "action": "set_world_scale",
  "uuid": "<uuid>",
  "x": 1,
  "y": 1,
  "z": 1
}
```
**期望结果:** 世界缩放归一
---

### `reset_transform`

#### 测试 #88: 重置全部
**输入参数:**
```json
{
  "action": "reset_transform",
  "uuid": "<uuid>"
}
```
**期望结果:** 位置/旋转/缩放全部归零
---

#### 测试 #89: 仅重置位置
**输入参数:**
```json
{
  "action": "reset_transform",
  "uuid": "<uuid>",
  "resetRotation": false,
  "resetScale": false
}
```
**期望结果:** 仅位置归零
---

### `set_name`

#### 测试 #90: 重命名
**输入参数:**
```json
{
  "action": "set_name",
  "uuid": "<uuid>",
  "name": "NewName"
}
```
**期望结果:** 节点名变为 NewName
---

### `set_active`

#### 测试 #91: 禁用
**输入参数:**
```json
{
  "action": "set_active",
  "uuid": "<uuid>",
  "active": false
}
```
**期望结果:** 节点及子节点不再渲染
---

#### 测试 #92: 启用
**输入参数:**
```json
{
  "action": "set_active",
  "uuid": "<uuid>",
  "active": true
}
```
**期望结果:** 节点恢复激活
---

### `set_layer`

#### 测试 #93: 设为 UI_2D
**输入参数:**
```json
{
  "action": "set_layer",
  "uuid": "<uuid>",
  "layer": 33554432
}
```
**期望结果:** Layer→UI_2D
---

### `set_anchor_point`

#### 测试 #94: 锚点左上角
**输入参数:**
```json
{
  "action": "set_anchor_point",
  "uuid": "<uuid>",
  "anchorX": 0,
  "anchorY": 1
}
```
**期望结果:** 锚点变为 (0,1)
---

### `set_content_size`

#### 测试 #95: 设尺寸
**输入参数:**
```json
{
  "action": "set_content_size",
  "uuid": "<uuid>",
  "width": 400,
  "height": 300
}
```
**期望结果:** UITransform 400×300
---

### `move_node_up`

#### 测试 #96: 上移一位
**输入参数:**
```json
{
  "action": "move_node_up",
  "uuid": "<uuid>"
}
```
**期望结果:** 兄弟列表中上移
---

### `move_node_down`

#### 测试 #97: 下移一位
**输入参数:**
```json
{
  "action": "move_node_down",
  "uuid": "<uuid>"
}
```
**期望结果:** 兄弟列表中下移
---

### `set_sibling_index`

#### 测试 #98: 设排序
**输入参数:**
```json
{
  "action": "set_sibling_index",
  "uuid": "<uuid>",
  "index": 0
}
```
**期望结果:** 移到第一位
---

### `lock_node`

#### 测试 #99: 锁定
**输入参数:**
```json
{
  "action": "lock_node",
  "uuid": "<uuid>"
}
```
**期望结果:** 层级面板中锁定
---

### `unlock_node`

#### 测试 #100: 解锁
**输入参数:**
```json
{
  "action": "unlock_node",
  "uuid": "<uuid>"
}
```
**期望结果:** 解除锁定
---

### `hide_node`

#### 测试 #101: 隐藏
**输入参数:**
```json
{
  "action": "hide_node",
  "uuid": "<uuid>"
}
```
**期望结果:** 编辑器中不可见（运行时不影响）
---

### `unhide_node`

#### 测试 #102: 取消隐藏
**输入参数:**
```json
{
  "action": "unhide_node",
  "uuid": "<uuid>"
}
```
**期望结果:** 恢复可见
---

### `add_component`

#### 测试 #103: 添加 Sprite
**输入参数:**
```json
{
  "action": "add_component",
  "uuid": "<uuid>",
  "component": "Sprite"
}
```
**期望结果:** 成功添加
---

#### 测试 #104: 添加自定义脚本
**输入参数:**
```json
{
  "action": "add_component",
  "uuid": "<uuid>",
  "component": "PlayerController"
}
```
**期望结果:** 添加脚本组件
---

### `remove_component`

#### 测试 #105: 移除组件
**输入参数:**
```json
{
  "action": "remove_component",
  "uuid": "<uuid>",
  "component": "Sprite"
}
```
**期望结果:** 移除 Sprite
---

### `set_property`

#### 测试 #106: 设 Label 文本
**输入参数:**
```json
{
  "action": "set_property",
  "uuid": "<uuid>",
  "component": "Label",
  "property": "string",
  "value": "Hello"
}
```
**期望结果:** 显示文字变为 Hello
---

#### 测试 #107: 设颜色
**输入参数:**
```json
{
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
}
```
**期望结果:** 变为红色
---

### `reset_property`

#### 测试 #108: 重置属性
**输入参数:**
```json
{
  "action": "reset_property",
  "uuid": "<uuid>",
  "component": "Label",
  "property": "fontSize"
}
```
**期望结果:** fontSize 恢复默认
---

### `reset_node_properties`

#### 测试 #109: 重置全部
**输入参数:**
```json
{
  "action": "reset_node_properties",
  "uuid": "<uuid>"
}
```
**期望结果:** 所有组件属性恢复默认
---

#### 测试 #110: 重置指定
**输入参数:**
```json
{
  "action": "reset_node_properties",
  "uuid": "<uuid>",
  "component": "Sprite"
}
```
**期望结果:** 仅 Sprite 属性重置
---

### `call_component_method`

#### 测试 #111: 调用方法
**输入参数:**
```json
{
  "action": "call_component_method",
  "uuid": "<uuid>",
  "component": "Animation",
  "methodName": "play",
  "args": [
    "idle"
  ]
}
```
**期望结果:** 播放 idle 动画
---

### `batch_set_property`

#### 测试 #112: 批量设属性
**输入参数:**
```json
{
  "action": "batch_set_property",
  "uuids": [
    "<a>",
    "<b>"
  ],
  "component": "Label",
  "property": "fontSize",
  "value": 24
}
```
**期望结果:** 两个 Label.fontSize→24
---

### `attach_script`

#### 测试 #113: 一键挂载+设属性
**输入参数:**
```json
{
  "action": "attach_script",
  "uuid": "<uuid>",
  "script": "PlayerController",
  "properties": {
    "speed": 15,
    "maxHp": 100
  }
}
```
**期望结果:** 添加组件+设 speed=15,maxHp=100
---

#### 测试 #114: 防重复
**输入参数:**
```json
{
  "action": "attach_script",
  "uuid": "<uuid>",
  "script": "PlayerController"
}
```
**期望结果:** 已存在→{alreadyAttached:true}
---

#### 测试 #115: 允许重复
**输入参数:**
```json
{
  "action": "attach_script",
  "uuid": "<uuid>",
  "script": "PlayerController",
  "allowDuplicate": true
}
```
**期望结果:** 再添加一个实例
---

#### 测试 #116: 脚本未编译
**输入参数:**
```json
{
  "action": "attach_script",
  "uuid": "<uuid>",
  "script": "NewScript"
}
```
**期望结果:** 返回 {error:"脚本类未注册"}
---

### `set_component_properties`

#### 测试 #117: 批量设属性
**输入参数:**
```json
{
  "action": "set_component_properties",
  "uuid": "<uuid>",
  "component": "Label",
  "properties": {
    "string": "Hi",
    "fontSize": 32
  }
}
```
**期望结果:** 一次设 string+fontSize
---

#### 测试 #118: 部分失败
**输入参数:**
```json
{
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
}
```
**期望结果:** color 成功,spriteFrame 报错
---

### `detach_script`

#### 测试 #119: 移除脚本
**输入参数:**
```json
{
  "action": "detach_script",
  "uuid": "<uuid>",
  "script": "PlayerController"
}
```
**期望结果:** 返回 {success:true}
---

#### 测试 #120: 不存在
**输入参数:**
```json
{
  "action": "detach_script",
  "uuid": "<uuid>",
  "script": "NotExist"
}
```
**期望结果:** 返回 {error:"没有脚本"}
---

### `align_nodes`

#### 测试 #121: 水平居中
**输入参数:**
```json
{
  "action": "align_nodes",
  "uuids": [
    "<a>",
    "<b>",
    "<c>"
  ],
  "alignment": "center_h"
}
```
**期望结果:** 三节点水平居中对齐
---

#### 测试 #122: 均匀分布
**输入参数:**
```json
{
  "action": "align_nodes",
  "uuids": [
    "<a>",
    "<b>",
    "<c>"
  ],
  "alignment": "distribute_h"
}
```
**期望结果:** 水平均匀分布
---

### `clipboard_copy`

#### 测试 #123: 复制
**输入参数:**
```json
{
  "action": "clipboard_copy",
  "uuid": "<uuid>"
}
```
**期望结果:** 节点存入剪贴板
---

### `clipboard_paste`

#### 测试 #124: 粘贴
**输入参数:**
```json
{
  "action": "clipboard_paste",
  "parentUuid": "<p>"
}
```
**期望结果:** 从剪贴板粘贴到父节点下
---

### `create_prefab`

#### 测试 #125: 保存预制体
**输入参数:**
```json
{
  "action": "create_prefab",
  "uuid": "<uuid>",
  "savePath": "db://assets/prefabs/Hero.prefab"
}
```
**期望结果:** 保存为 .prefab
---

### `instantiate_prefab`

#### 测试 #126: 实例化
**输入参数:**
```json
{
  "action": "instantiate_prefab",
  "prefabUrl": "db://assets/prefabs/Hero.prefab"
}
```
**期望结果:** 在场景根创建实例
---

#### 测试 #127: 指定父
**输入参数:**
```json
{
  "action": "instantiate_prefab",
  "prefabUrl": "db://assets/prefabs/Enemy.prefab",
  "parentUuid": "<p>"
}
```
**期望结果:** 在父节点下实例化
---

### `enter_prefab_edit`

#### 测试 #128: 进入编辑
**输入参数:**
```json
{
  "action": "enter_prefab_edit",
  "uuid": "<prefab>"
}
```
**期望结果:** 进入预制体编辑模式
---

### `exit_prefab_edit`

#### 测试 #129: 退出编辑
**输入参数:**
```json
{
  "action": "exit_prefab_edit"
}
```
**期望结果:** 返回场景编辑模式
---

### `apply_prefab`

#### 测试 #130: 应用更改
**输入参数:**
```json
{
  "action": "apply_prefab",
  "uuid": "<uuid>"
}
```
**期望结果:** 同步到预制体资源
---

### `revert_prefab`

#### 测试 #131: 还原
**输入参数:**
```json
{
  "action": "revert_prefab",
  "uuid": "<uuid>"
}
```
**期望结果:** 恢复为原始状态
---

### `validate_prefab`

#### 测试 #132: 验证
**输入参数:**
```json
{
  "action": "validate_prefab",
  "prefabUrl": "db://assets/prefabs/Hero.prefab"
}
```
**期望结果:** 检查完整性和依赖
---

### `create_ui_widget`

#### 测试 #133: 创建 Button
**输入参数:**
```json
{
  "action": "create_ui_widget",
  "widgetType": "button",
  "text": "点击"
}
```
**期望结果:** 创建完整 Button 层级
---

#### 测试 #134: 创建 Label
**输入参数:**
```json
{
  "action": "create_ui_widget",
  "widgetType": "label",
  "text": "Hello"
}
```
**期望结果:** 创建 Label 节点
---

#### 测试 #135: 创建 Slider
**输入参数:**
```json
{
  "action": "create_ui_widget",
  "widgetType": "slider"
}
```
**期望结果:** 创建 Slider 层级
---

### `setup_particle`

#### 测试 #136: 火焰粒子
**输入参数:**
```json
{
  "action": "setup_particle",
  "preset": "fire"
}
```
**期望结果:** 创建火焰效果
---

#### 测试 #137: 默认粒子
**输入参数:**
```json
{
  "action": "setup_particle"
}
```
**期望结果:** 创建默认粒子节点
---

### `create_skeleton_node`

#### 测试 #138: Spine
**输入参数:**
```json
{
  "action": "create_skeleton_node",
  "skeletonType": "spine"
}
```
**期望结果:** 创建 Spine 节点
---

#### 测试 #139: DragonBones
**输入参数:**
```json
{
  "action": "create_skeleton_node",
  "skeletonType": "dragonbones"
}
```
**期望结果:** 创建龙骨节点
---

### `generate_tilemap`

#### 测试 #140: 瓦片地图
**输入参数:**
```json
{
  "action": "generate_tilemap",
  "name": "Level1"
}
```
**期望结果:** 创建 TiledMap 节点
---

### `create_primitive`

#### 测试 #141: Box+颜色
**输入参数:**
```json
{
  "action": "create_primitive",
  "type": "box",
  "color": {
    "r": 255,
    "g": 100,
    "b": 50,
    "a": 255
  }
}
```
**期望结果:** 创建橙色 Box
---

#### 测试 #142: Sphere+阴影
**输入参数:**
```json
{
  "action": "create_primitive",
  "type": "sphere",
  "shadowCasting": true,
  "receiveShadow": true
}
```
**期望结果:** 创建可投射阴影球体
---

#### 测试 #143: Cylinder
**输入参数:**
```json
{
  "action": "create_primitive",
  "type": "cylinder"
}
```
**期望结果:** 创建圆柱体
---

### `create_camera`

#### 测试 #144: 透视摄像机
**输入参数:**
```json
{
  "action": "create_camera",
  "name": "MainCam",
  "fov": 60,
  "near": 0.1,
  "far": 1000
}
```
**期望结果:** 创建 FOV=60 摄像机
---

### `set_camera_property`

#### 测试 #145: 改 FOV
**输入参数:**
```json
{
  "action": "set_camera_property",
  "uuid": "<cam>",
  "fov": 45
}
```
**期望结果:** FOV→45°
---

#### 测试 #146: 设背景色
**输入参数:**
```json
{
  "action": "set_camera_property",
  "uuid": "<cam>",
  "clearColor": {
    "r": 30,
    "g": 30,
    "b": 60,
    "a": 255
  }
}
```
**期望结果:** 背景色→深蓝
---

### `set_camera_look_at`

#### 测试 #147: 朝向原点
**输入参数:**
```json
{
  "action": "set_camera_look_at",
  "uuid": "<cam>",
  "targetX": 0,
  "targetY": 0,
  "targetZ": 0
}
```
**期望结果:** 摄像机旋转朝向原点
---

### `camera_screenshot`

#### 测试 #148: 默认截图
**输入参数:**
```json
{
  "action": "camera_screenshot",
  "width": 1024,
  "height": 768
}
```
**期望结果:** 返回截图数据
---

#### 测试 #149: 指定摄像机
**输入参数:**
```json
{
  "action": "camera_screenshot",
  "uuid": "<cam>",
  "width": 512,
  "height": 512
}
```
**期望结果:** 使用指定摄像机截图
---

### `set_material_property`

#### 测试 #150: 设材质颜色
**输入参数:**
```json
{
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
}
```
**期望结果:** 主颜色变红
---

#### 测试 #151: 设粗糙度
**输入参数:**
```json
{
  "action": "set_material_property",
  "uuid": "<uuid>",
  "uniforms": {
    "roughness": 0.3,
    "metallic": 0.8
  }
}
```
**期望结果:** 光滑金属质感
---

### `assign_builtin_material`

#### 测试 #152: Unlit 材质
**输入参数:**
```json
{
  "action": "assign_builtin_material",
  "uuid": "<uuid>",
  "effectName": "builtin-unlit"
}
```
**期望结果:** 切换到无光照材质
---

#### 测试 #153: 带颜色
**输入参数:**
```json
{
  "action": "assign_builtin_material",
  "uuid": "<uuid>",
  "effectName": "builtin-standard",
  "color": {
    "r": 0,
    "g": 255,
    "b": 0,
    "a": 255
  }
}
```
**期望结果:** 标准材质+绿色
---

### `assign_project_material`

#### 测试 #154: 自定义材质
**输入参数:**
```json
{
  "action": "assign_project_material",
  "uuid": "<uuid>",
  "materialUrl": "db://assets/materials/Glass.mtl"
}
```
**期望结果:** 使用项目材质
---

### `set_material_define`

#### 测试 #155: 启用法线贴图
**输入参数:**
```json
{
  "action": "set_material_define",
  "uuid": "<uuid>",
  "defines": {
    "USE_NORMAL_MAP": true
  }
}
```
**期望结果:** Shader 宏启用并重编译
---

### `clone_material`

#### 测试 #156: 克隆材质
**输入参数:**
```json
{
  "action": "clone_material",
  "uuid": "<uuid>"
}
```
**期望结果:** 共享材质→独立实例
---

### `swap_technique`

#### 测试 #157: 切换 Technique
**输入参数:**
```json
{
  "action": "swap_technique",
  "uuid": "<uuid>",
  "technique": 1
}
```
**期望结果:** 切换到第 2 个渲染技术
---

### `sprite_grayscale`

#### 测试 #158: 启用灰度
**输入参数:**
```json
{
  "action": "sprite_grayscale",
  "uuid": "<uuid>",
  "enable": true
}
```
**期望结果:** Sprite 变灰色
---

#### 测试 #159: 恢复彩色
**输入参数:**
```json
{
  "action": "sprite_grayscale",
  "uuid": "<uuid>",
  "enable": false
}
```
**期望结果:** Sprite 恢复彩色
---

### `create_light`

#### 测试 #160: 平行光
**输入参数:**
```json
{
  "action": "create_light",
  "lightType": "directional",
  "rotationX": -45
}
```
**期望结果:** 创建 45° 平行光
---

#### 测试 #161: 聚光灯
**输入参数:**
```json
{
  "action": "create_light",
  "lightType": "spot",
  "x": 0,
  "y": 5,
  "z": 0,
  "spotAngle": 60,
  "range": 20
}
```
**期望结果:** 创建聚光灯
---

### `set_light_property`

#### 测试 #162: 调亮度
**输入参数:**
```json
{
  "action": "set_light_property",
  "uuid": "<light>",
  "illuminance": 150000
}
```
**期望结果:** 亮度→150000 lux
---

#### 测试 #163: 开阴影
**输入参数:**
```json
{
  "action": "set_light_property",
  "uuid": "<light>",
  "shadowEnabled": true,
  "shadowPcf": 2
}
```
**期望结果:** 启用 PCF2 阴影
---

### `set_scene_environment`

#### 测试 #164: 用预设
**输入参数:**
```json
{
  "action": "set_scene_environment",
  "preset": "outdoor_day"
}
```
**期望结果:** 一键应用户外白天环境
---

#### 测试 #165: 设雾效
**输入参数:**
```json
{
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
}
```
**期望结果:** 启用淡蓝雾效
---

#### 测试 #166: 设环境光
**输入参数:**
```json
{
  "action": "set_scene_environment",
  "subsystem": "ambient",
  "skyIllum": 30000,
  "skyColor": {
    "r": 128,
    "g": 160,
    "b": 255,
    "a": 255
  }
}
```
**期望结果:** 天空颜色→淡蓝
---

### `bind_event`

#### 测试 #167: 绑定点击
**输入参数:**
```json
{
  "action": "bind_event",
  "uuid": "<btn>",
  "eventType": "click",
  "component": "GameUI",
  "handler": "onClickStart"
}
```
**期望结果:** Button 绑定 click→GameUI.onClickStart
---

#### 测试 #168: 绑定滑块
**输入参数:**
```json
{
  "action": "bind_event",
  "uuid": "<slider>",
  "eventType": "slider",
  "component": "Settings",
  "handler": "onVolumeChange"
}
```
**期望结果:** Slider 绑定回调
---

### `unbind_event`

#### 测试 #169: 移除指定
**输入参数:**
```json
{
  "action": "unbind_event",
  "uuid": "<btn>",
  "eventType": "click",
  "handler": "onClickStart"
}
```
**期望结果:** 移除匹配的 handler
---

#### 测试 #170: 清空全部
**输入参数:**
```json
{
  "action": "unbind_event",
  "uuid": "<btn>",
  "eventType": "click"
}
```
**期望结果:** 移除所有 click 事件
---

### `list_events`

#### 测试 #171: 列出事件
**输入参数:**
```json
{
  "action": "list_events",
  "uuid": "<btn>"
}
```
**期望结果:** 返回所有已绑定 UI 事件
---

### `audio_setup`

#### 测试 #172: 添加音频
**输入参数:**
```json
{
  "action": "audio_setup",
  "uuid": "<uuid>",
  "volume": 0.8,
  "loop": true,
  "playOnAwake": true
}
```
**期望结果:** 添加 AudioSource+配置
---

### `setup_physics_world`

#### 测试 #173: 设重力
**输入参数:**
```json
{
  "action": "setup_physics_world",
  "gravity": {
    "x": 0,
    "y": -20,
    "z": 0
  }
}
```
**期望结果:** 物理世界重力加倍
---

### `batch`

#### 测试 #174: 批量操作
**输入参数:**
```json
{
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
}
```
**期望结果:** 创建节点 A 并添加 Sprite，$0.uuid 引用上一步结果
---

## 📦 资源操作

### `list`

#### 测试 #175: 列出所有图片
**输入参数:**
```json
{
  "action": "list",
  "pattern": "db://assets/**/*.png"
}
```
**期望结果:** 返回所有 PNG 资源列表
---

### `info`

#### 测试 #176: 资源信息
**输入参数:**
```json
{
  "action": "info",
  "url": "db://assets/textures/hero.png"
}
```
**期望结果:** 返回 {type,uuid,path,importer}
---

### `create`

#### 测试 #177: 创建文件
**输入参数:**
```json
{
  "action": "create",
  "url": "db://assets/scripts/Test.ts",
  "content": "import {_decorator} from \"cc\";"
}
```
**期望结果:** 创建 TS 文件
---

### `save`

#### 测试 #178: 覆盖保存
**输入参数:**
```json
{
  "action": "save",
  "url": "db://assets/scripts/Test.ts",
  "content": "...new code..."
}
```
**期望结果:** 文件内容被覆盖
---

### `delete`

#### 测试 #179: 删除资源
**输入参数:**
```json
{
  "action": "delete",
  "url": "db://assets/old/unused.png"
}
```
**期望结果:** 永久删除
---

### `move`

#### 测试 #180: 移动资源
**输入参数:**
```json
{
  "action": "move",
  "sourceUrl": "db://assets/a.png",
  "targetUrl": "db://assets/textures/a.png"
}
```
**期望结果:** 资源移到 textures 目录
---

### `copy`

#### 测试 #181: 复制资源
**输入参数:**
```json
{
  "action": "copy",
  "sourceUrl": "db://assets/a.png",
  "targetUrl": "db://assets/b.png"
}
```
**期望结果:** 创建副本
---

### `rename`

#### 测试 #182: 重命名
**输入参数:**
```json
{
  "action": "rename",
  "url": "db://assets/old.png",
  "newName": "new.png"
}
```
**期望结果:** 文件改名为 new.png
---

### `create_folder`

#### 测试 #183: 创建目录
**输入参数:**
```json
{
  "action": "create_folder",
  "url": "db://assets/prefabs"
}
```
**期望结果:** 创建 prefabs 目录
---

### `import`

#### 测试 #184: 导入外部文件
**输入参数:**
```json
{
  "action": "import",
  "sourcePath": "C:/art/hero.png",
  "targetUrl": "db://assets/textures/hero.png"
}
```
**期望结果:** 文件导入到 AssetDB
---

### `batch_import`

#### 测试 #185: 批量导入
**输入参数:**
```json
{
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
}
```
**期望结果:** 两个文件同时导入
---

### `open`

#### 测试 #186: 打开资源
**输入参数:**
```json
{
  "action": "open",
  "url": "db://assets/scenes/Main.scene"
}
```
**期望结果:** 在编辑器中打开
---

### `refresh`

#### 测试 #187: 刷新全库
**输入参数:**
```json
{
  "action": "refresh"
}
```
**期望结果:** 整个 AssetDB 刷新
---

#### 测试 #188: 刷新目录
**输入参数:**
```json
{
  "action": "refresh",
  "url": "db://assets/textures"
}
```
**期望结果:** 仅刷新 textures 目录
---

### `reimport`

#### 测试 #189: 强制重新导入
**输入参数:**
```json
{
  "action": "reimport",
  "url": "db://assets/textures/hero.png"
}
```
**期望结果:** 资源重新导入处理
---

### `show_in_explorer`

#### 测试 #190: 在资源管理器中显示
**输入参数:**
```json
{
  "action": "show_in_explorer",
  "url": "db://assets/textures/hero.png"
}
```
**期望结果:** 打开系统文件管理器定位到文件
---

### `uuid_to_url`

#### 测试 #191: UUID→URL
**输入参数:**
```json
{
  "action": "uuid_to_url",
  "uuid": "<asset-uuid>"
}
```
**期望结果:** 返回 db:// 路径
---

### `url_to_uuid`

#### 测试 #192: URL→UUID
**输入参数:**
```json
{
  "action": "url_to_uuid",
  "url": "db://assets/textures/hero.png"
}
```
**期望结果:** 返回 UUID 字符串
---

### `get_dependencies`

#### 测试 #193: 查依赖
**输入参数:**
```json
{
  "action": "get_dependencies",
  "url": "db://assets/prefabs/Hero.prefab"
}
```
**期望结果:** 返回依赖的纹理、脚本等列表
---

### `get_dependents`

#### 测试 #194: 查被引用
**输入参数:**
```json
{
  "action": "get_dependents",
  "url": "db://assets/textures/hero.png"
}
```
**期望结果:** 返回引用此纹理的 Prefab/场景列表
---

### `get_meta`

#### 测试 #195: 获取 meta
**输入参数:**
```json
{
  "action": "get_meta",
  "url": "db://assets/textures/hero.png"
}
```
**期望结果:** 返回完整 .meta JSON
---

### `set_meta_property`

#### 测试 #196: 修改 meta
**输入参数:**
```json
{
  "action": "set_meta_property",
  "url": "db://assets/textures/hero.png",
  "property": "userData",
  "value": {
    "customTag": "player"
  }
}
```
**期望结果:** userData 字段被修改
---

### `get_asset_size`

#### 测试 #197: 文件大小
**输入参数:**
```json
{
  "action": "get_asset_size",
  "url": "db://assets/textures/hero.png"
}
```
**期望结果:** 返回 {bytes:102400,kb:"100.0",mb:"0.10"}
---

### `search_by_type`

#### 测试 #198: 按类型搜索
**输入参数:**
```json
{
  "action": "search_by_type",
  "type": "cc.Prefab"
}
```
**期望结果:** 返回所有 Prefab 资源列表
---

### `get_animation_clips`

#### 测试 #199: 所有动画片段
**输入参数:**
```json
{
  "action": "get_animation_clips"
}
```
**期望结果:** 返回项目中全部 .anim 文件
---

### `get_materials`

#### 测试 #200: 所有材质
**输入参数:**
```json
{
  "action": "get_materials"
}
```
**期望结果:** 返回项目中全部 .mtl 文件
---

### `clean_unused`

#### 测试 #201: 未使用资源
**输入参数:**
```json
{
  "action": "clean_unused"
}
```
**期望结果:** 返回可能未使用的资源列表（需人工审查）
---

### `validate_asset`

#### 测试 #202: 验证资源
**输入参数:**
```json
{
  "action": "validate_asset",
  "url": "db://assets/textures/hero.png"
}
```
**期望结果:** 返回 {valid:true/false,issues[]}
---

### `export_asset_manifest`

#### 测试 #203: 导出清单
**输入参数:**
```json
{
  "action": "export_asset_manifest"
}
```
**期望结果:** 返回完整资源清单+类型分布统计
---

### `pack_atlas`

#### 测试 #204: 打包图集
**输入参数:**
```json
{
  "action": "pack_atlas",
  "url": "db://assets/atlas/ui"
}
```
**期望结果:** 触发图集重新打包
---

### `slice_sprite`

#### 测试 #205: 九宫格切图
**输入参数:**
```json
{
  "action": "slice_sprite",
  "url": "db://assets/ui/panel.png/spriteFrame",
  "borderTop": 20,
  "borderBottom": 20,
  "borderLeft": 30,
  "borderRight": 30
}
```
**期望结果:** 设置九宫格边距
---

### `create_material`

#### 测试 #206: 创建材质
**输入参数:**
```json
{
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
}
```
**期望结果:** 创建半透明玻璃材质
---

### `generate_script`

#### 测试 #207: 生成脚本
**输入参数:**
```json
{
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
}
```
**期望结果:** 生成带 @property speed 和 onLoad/update 的脚本
---

## editor_action

### `save_scene`

#### 测试 #208: 保存场景
**输入参数:**
```json
{
  "action": "save_scene"
}
```
**期望结果:** 当前场景保存到磁盘
---

### `open_scene`

#### 测试 #209: 按 URL 打开
**输入参数:**
```json
{
  "action": "open_scene",
  "url": "db://assets/scenes/Main.scene"
}
```
**期望结果:** 打开 Main 场景
---

#### 测试 #210: 按 UUID 打开
**输入参数:**
```json
{
  "action": "open_scene",
  "uuid": "<scene-uuid>"
}
```
**期望结果:** 打开指定场景
---

### `new_scene`

#### 测试 #211: 新建场景
**输入参数:**
```json
{
  "action": "new_scene"
}
```
**期望结果:** 创建空场景
---

### `undo`

#### 测试 #212: 撤销
**输入参数:**
```json
{
  "action": "undo"
}
```
**期望结果:** 撤销上一步操作
---

### `redo`

#### 测试 #213: 重做
**输入参数:**
```json
{
  "action": "redo"
}
```
**期望结果:** 重做被撤销的操作
---

### `get_selection`

#### 测试 #214: 获取选中
**输入参数:**
```json
{
  "action": "get_selection"
}
```
**期望结果:** 返回选中节点 UUID 数组
---

### `select`

#### 测试 #215: 选中节点
**输入参数:**
```json
{
  "action": "select",
  "uuids": [
    "<uuid1>",
    "<uuid2>"
  ]
}
```
**期望结果:** 两个节点被选中
---

### `clear_selection`

#### 测试 #216: 清除选中
**输入参数:**
```json
{
  "action": "clear_selection"
}
```
**期望结果:** 取消所有选中
---

### `project_info`

#### 测试 #217: 项目信息
**输入参数:**
```json
{
  "action": "project_info"
}
```
**期望结果:** 返回 {name,path,engineVersion}
---

### `build`

#### 测试 #218: 构建 Web
**输入参数:**
```json
{
  "action": "build",
  "platform": "web-mobile"
}
```
**期望结果:** 启动 Web Mobile 构建
---

### `build_query`

#### 测试 #219: 构建配置
**输入参数:**
```json
{
  "action": "build_query"
}
```
**期望结果:** 返回当前构建配置和可用平台
---

### `build_with_config`

#### 测试 #220: 详细构建
**输入参数:**
```json
{
  "action": "build_with_config",
  "platform": "web-mobile",
  "debug": true
}
```
**期望结果:** Debug 模式构建
---

### `build_status`

#### 测试 #221: 构建状态
**输入参数:**
```json
{
  "action": "build_status"
}
```
**期望结果:** 返回 {building:true/false}
---

### `preview`

#### 测试 #222: 预览
**输入参数:**
```json
{
  "action": "preview"
}
```
**期望结果:** 浏览器中打开预览
---

### `preview_refresh`

#### 测试 #223: 刷新预览
**输入参数:**
```json
{
  "action": "preview_refresh"
}
```
**期望结果:** 预览页面刷新
---

### `preview_status`

#### 测试 #224: 预览状态
**输入参数:**
```json
{
  "action": "preview_status"
}
```
**期望结果:** 返回 {running,port}
---

### `send_message`

#### 测试 #225: IPC 消息
**输入参数:**
```json
{
  "action": "send_message",
  "module": "scene",
  "message": "query-node",
  "args": [
    "<uuid>"
  ]
}
```
**期望结果:** 发送 IPC 消息到 scene 模块
---

### `focus_node`

#### 测试 #226: 聚焦节点
**输入参数:**
```json
{
  "action": "focus_node",
  "uuid": "<uuid>"
}
```
**期望结果:** 编辑器摄像机聚焦到该节点
---

### `open_panel`

#### 测试 #227: 打开面板
**输入参数:**
```json
{
  "action": "open_panel",
  "panel": "console"
}
```
**期望结果:** 打开控制台面板
---

### `close_panel`

#### 测试 #228: 关闭面板
**输入参数:**
```json
{
  "action": "close_panel",
  "panel": "console"
}
```
**期望结果:** 关闭控制台面板
---

### `query_panels`

#### 测试 #229: 列出面板
**输入参数:**
```json
{
  "action": "query_panels"
}
```
**期望结果:** 返回所有可用面板名
---

### `log`

#### 测试 #230: 输出日志
**输入参数:**
```json
{
  "action": "log",
  "text": "Hello from AI"
}
```
**期望结果:** 控制台输出 info 消息
---

### `warn`

#### 测试 #231: 输出警告
**输入参数:**
```json
{
  "action": "warn",
  "text": "Something suspicious"
}
```
**期望结果:** 控制台输出 warning
---

### `error`

#### 测试 #232: 输出错误
**输入参数:**
```json
{
  "action": "error",
  "text": "Critical failure"
}
```
**期望结果:** 控制台输出 error
---

### `clear_console`

#### 测试 #233: 清空控制台
**输入参数:**
```json
{
  "action": "clear_console"
}
```
**期望结果:** 控制台清空
---

### `get_console_logs`

#### 测试 #234: 全部日志
**输入参数:**
```json
{
  "action": "get_console_logs"
}
```
**期望结果:** 返回所有日志条目
---

#### 测试 #235: 仅错误
**输入参数:**
```json
{
  "action": "get_console_logs",
  "logType": "error",
  "logCount": 10
}
```
**期望结果:** 返回最近 10 条错误日志
---

### `search_logs`

#### 测试 #236: 搜索日志
**输入参数:**
```json
{
  "action": "search_logs",
  "keyword": "TypeError"
}
```
**期望结果:** 返回含 TypeError 的日志
---

### `get_packages`

#### 测试 #237: 已安装插件
**输入参数:**
```json
{
  "action": "get_packages"
}
```
**期望结果:** 返回插件列表
---

### `reload_plugin`

#### 测试 #238: 重载插件
**输入参数:**
```json
{
  "action": "reload_plugin",
  "module": "aura-for-cocos"
}
```
**期望结果:** 插件热重载
---

### `inspect_asset`

#### 测试 #239: 查看资源
**输入参数:**
```json
{
  "action": "inspect_asset",
  "uuid": "<asset-uuid>"
}
```
**期望结果:** Inspector 面板显示该资源
---

### `open_preferences`

#### 测试 #240: 偏好设置
**输入参数:**
```json
{
  "action": "open_preferences"
}
```
**期望结果:** 打开偏好设置面板
---

### `open_project_settings`

#### 测试 #241: 项目设置
**输入参数:**
```json
{
  "action": "open_project_settings"
}
```
**期望结果:** 打开项目设置面板
---

### `show_notification`

#### 测试 #242: 通知
**输入参数:**
```json
{
  "action": "show_notification",
  "text": "操作完成！",
  "title": "AI"
}
```
**期望结果:** 弹出通知
---

### `play_in_editor`

#### 测试 #243: 播放
**输入参数:**
```json
{
  "action": "play_in_editor"
}
```
**期望结果:** 进入播放模式
---

### `pause_in_editor`

#### 测试 #244: 暂停
**输入参数:**
```json
{
  "action": "pause_in_editor"
}
```
**期望结果:** 暂停播放
---

### `stop_in_editor`

#### 测试 #245: 停止
**输入参数:**
```json
{
  "action": "stop_in_editor"
}
```
**期望结果:** 停止播放
---

### `step_in_editor`

#### 测试 #246: 单步帧
**输入参数:**
```json
{
  "action": "step_in_editor"
}
```
**期望结果:** 执行一帧
---

### `move_scene_camera`

#### 测试 #247: 移动场景相机
**输入参数:**
```json
{
  "action": "move_scene_camera",
  "uuid": "<uuid>"
}
```
**期望结果:** 编辑器摄像机移动到节点
---

### `take_scene_screenshot`

#### 测试 #248: 视口截图
**输入参数:**
```json
{
  "action": "take_scene_screenshot"
}
```
**期望结果:** 截取场景编辑器画面
---

### `set_transform_tool`

#### 测试 #249: 切 Gizmo
**输入参数:**
```json
{
  "action": "set_transform_tool",
  "toolType": "rotation"
}
```
**期望结果:** 切换到旋转工具
---

### `set_coordinate`

#### 测试 #250: 切坐标系
**输入参数:**
```json
{
  "action": "set_coordinate",
  "coordinate": "world"
}
```
**期望结果:** 切换到世界坐标系
---

### `toggle_grid`

#### 测试 #251: 显示网格
**输入参数:**
```json
{
  "action": "toggle_grid",
  "visible": true
}
```
**期望结果:** 显示编辑器网格
---

### `toggle_snap`

#### 测试 #252: 启用吸附
**输入参数:**
```json
{
  "action": "toggle_snap",
  "enabled": true
}
```
**期望结果:** 启用吸附模式
---

### `set_view_mode`

#### 测试 #253: 切到 2D
**输入参数:**
```json
{
  "action": "set_view_mode",
  "viewMode": "2d"
}
```
**期望结果:** 场景视图切为 2D
---

#### 测试 #254: 切到 3D
**输入参数:**
```json
{
  "action": "set_view_mode",
  "viewMode": "3d"
}
```
**期望结果:** 场景视图切为 3D
---

### `zoom_to_fit`

#### 测试 #255: 缩放适应
**输入参数:**
```json
{
  "action": "zoom_to_fit"
}
```
**期望结果:** 视图缩放以适应所有节点
---

## engine_action

### `set_frame_rate`

#### 测试 #256: 设 60 FPS
**输入参数:**
```json
{
  "action": "set_frame_rate",
  "fps": 60
}
```
**期望结果:** 帧率限制为 60
---

#### 测试 #257: 设 30 FPS
**输入参数:**
```json
{
  "action": "set_frame_rate",
  "fps": 30
}
```
**期望结果:** 省电模式 30 FPS
---

### `pause_engine`

#### 测试 #258: 暂停引擎
**输入参数:**
```json
{
  "action": "pause_engine"
}
```
**期望结果:** 渲染和逻辑冻结
---

### `resume_engine`

#### 测试 #259: 恢复引擎
**输入参数:**
```json
{
  "action": "resume_engine"
}
```
**期望结果:** 继续运行
---

### `get_system_info`

#### 测试 #260: 系统信息
**输入参数:**
```json
{
  "action": "get_system_info"
}
```
**期望结果:** 返回 {os,browser,device,screenRes,gpu}
---

### `dump_texture_cache`

#### 测试 #261: 纹理缓存
**输入参数:**
```json
{
  "action": "dump_texture_cache"
}
```
**期望结果:** 返回已缓存纹理列表+大小
---

### `get_render_stats`

#### 测试 #262: 渲染统计
**输入参数:**
```json
{
  "action": "get_render_stats"
}
```
**期望结果:** 返回 {drawCalls,triangles,batches,fps}
---

### `get_memory_stats`

#### 测试 #263: 内存统计
**输入参数:**
```json
{
  "action": "get_memory_stats"
}
```
**期望结果:** 返回 {heapUsed,rss,cachedAssets}
---

### `get_editor_performance`

#### 测试 #264: 性能总览
**输入参数:**
```json
{
  "action": "get_editor_performance"
}
```
**期望结果:** 返回 {fps,nodeCount,platform,paused}
---

## animation_tool

### `create_clip`

#### 测试 #265: 创建动画
**输入参数:**
```json
{
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
}
```
**期望结果:** 创建左右移动循环动画
---

### `play`

#### 测试 #266: 播放默认
**输入参数:**
```json
{
  "action": "play",
  "uuid": "<uuid>"
}
```
**期望结果:** 播放默认动画片段
---

#### 测试 #267: 播放指定
**输入参数:**
```json
{
  "action": "play",
  "uuid": "<uuid>",
  "clipName": "walk"
}
```
**期望结果:** 播放 walk 片段
---

### `pause`

#### 测试 #268: 暂停
**输入参数:**
```json
{
  "action": "pause",
  "uuid": "<uuid>"
}
```
**期望结果:** 动画暂停
---

### `resume`

#### 测试 #269: 恢复
**输入参数:**
```json
{
  "action": "resume",
  "uuid": "<uuid>"
}
```
**期望结果:** 继续播放
---

### `stop`

#### 测试 #270: 停止
**输入参数:**
```json
{
  "action": "stop",
  "uuid": "<uuid>"
}
```
**期望结果:** 停止并重置
---

### `get_state`

#### 测试 #271: 查状态
**输入参数:**
```json
{
  "action": "get_state",
  "uuid": "<uuid>"
}
```
**期望结果:** 返回 {playing,clip,time}
---

### `list_clips`

#### 测试 #272: 列出片段
**输入参数:**
```json
{
  "action": "list_clips",
  "uuid": "<uuid>"
}
```
**期望结果:** 返回动画片段名称列表
---

### `set_current_time`

#### 测试 #273: 跳转时间
**输入参数:**
```json
{
  "action": "set_current_time",
  "uuid": "<uuid>",
  "time": 0.5
}
```
**期望结果:** 跳转到 0.5 秒
---

### `set_speed`

#### 测试 #274: 倍速播放
**输入参数:**
```json
{
  "action": "set_speed",
  "uuid": "<uuid>",
  "speed": 2
}
```
**期望结果:** 2 倍速播放
---

### `crossfade`

#### 测试 #275: 交叉淡入
**输入参数:**
```json
{
  "action": "crossfade",
  "uuid": "<uuid>",
  "clipName": "run",
  "duration": 0.3
}
```
**期望结果:** 0.3 秒内淡入 run 动画
---

## physics_tool

### `get_collider_info`

#### 测试 #276: 碰撞器详情
**输入参数:**
```json
{
  "action": "get_collider_info",
  "uuid": "<uuid>"
}
```
**期望结果:** 返回碰撞器+刚体信息
---

### `add_collider`

#### 测试 #277: 添加 Box2D
**输入参数:**
```json
{
  "action": "add_collider",
  "uuid": "<uuid>",
  "colliderType": "box2d"
}
```
**期望结果:** 添加 BoxCollider2D
---

#### 测试 #278: 添加 Sphere3D
**输入参数:**
```json
{
  "action": "add_collider",
  "uuid": "<uuid>",
  "colliderType": "sphere3d"
}
```
**期望结果:** 添加 SphereCollider
---

### `set_collider_size`

#### 测试 #279: 设 Box 大小
**输入参数:**
```json
{
  "action": "set_collider_size",
  "uuid": "<uuid>",
  "width": 100,
  "height": 80
}
```
**期望结果:** Box 碰撞器→100×80
---

### `add_rigidbody`

#### 测试 #280: 动态刚体
**输入参数:**
```json
{
  "action": "add_rigidbody",
  "uuid": "<uuid>",
  "bodyType": "Dynamic"
}
```
**期望结果:** 添加动态刚体
---

#### 测试 #281: 静态刚体
**输入参数:**
```json
{
  "action": "add_rigidbody",
  "uuid": "<uuid>",
  "bodyType": "Static"
}
```
**期望结果:** 添加静态刚体
---

### `set_rigidbody_props`

#### 测试 #282: 设刚体属性
**输入参数:**
```json
{
  "action": "set_rigidbody_props",
  "uuid": "<uuid>",
  "mass": 5,
  "linearDamping": 0.5,
  "fixedRotation": true
}
```
**期望结果:** 质量 5kg+线性阻尼 0.5+锁定旋转
---

### `set_physics_material`

#### 测试 #283: 设物理材质
**输入参数:**
```json
{
  "action": "set_physics_material",
  "uuid": "<uuid>",
  "friction": 0.3,
  "restitution": 0.8
}
```
**期望结果:** 摩擦 0.3+弹性 0.8
---

### `set_collision_group`

#### 测试 #284: 设碰撞组
**输入参数:**
```json
{
  "action": "set_collision_group",
  "uuid": "<uuid>",
  "group": 2
}
```
**期望结果:** 碰撞组→2
---

### `get_physics_world`

#### 测试 #285: 世界配置
**输入参数:**
```json
{
  "action": "get_physics_world"
}
```
**期望结果:** 返回重力/时间步等参数
---

### `set_physics_world`

#### 测试 #286: 设重力
**输入参数:**
```json
{
  "action": "set_physics_world",
  "gravity": {
    "x": 0,
    "y": -20,
    "z": 0
  }
}
```
**期望结果:** 重力→-20 m/s²
---

### `add_joint`

#### 测试 #287: 弹簧关节
**输入参数:**
```json
{
  "action": "add_joint",
  "uuid": "<uuid>",
  "jointType": "spring",
  "connectedUuid": "<other>"
}
```
**期望结果:** 两节点间添加弹簧关节
---

## preferences

### `get`

#### 测试 #288: 读偏好
**输入参数:**
```json
{
  "action": "get",
  "key": "general.language",
  "scope": "global"
}
```
**期望结果:** 返回 {value:"zh"}
---

### `set`

#### 测试 #289: 写偏好
**输入参数:**
```json
{
  "action": "set",
  "key": "general.language",
  "value": "en",
  "scope": "global"
}
```
**期望结果:** 语言改为英文
---

### `list`

#### 测试 #290: 列出全部
**输入参数:**
```json
{
  "action": "list"
}
```
**期望结果:** 返回所有偏好设置
---

### `get_global`

#### 测试 #291: 读全局
**输入参数:**
```json
{
  "action": "get_global",
  "key": "general.theme"
}
```
**期望结果:** 返回 {value:"dark"}
---

### `set_global`

#### 测试 #292: 写全局
**输入参数:**
```json
{
  "action": "set_global",
  "key": "general.theme",
  "value": "light"
}
```
**期望结果:** 主题改为亮色
---

### `get_project`

#### 测试 #293: 读项目级
**输入参数:**
```json
{
  "action": "get_project",
  "key": "builder.compressTexture"
}
```
**期望结果:** 返回压缩纹理设置
---

### `set_project`

#### 测试 #294: 写项目级
**输入参数:**
```json
{
  "action": "set_project",
  "key": "preview.port",
  "value": 7456
}
```
**期望结果:** 预览端口→7456
---

## broadcast

### `poll`

#### 测试 #295: 拉取事件
**输入参数:**
```json
{
  "action": "poll",
  "since": 1700000000000
}
```
**期望结果:** 返回该时间戳后的新事件列表
---

### `history`

#### 测试 #296: 历史记录
**输入参数:**
```json
{
  "action": "history",
  "limit": 10
}
```
**期望结果:** 返回最近 10 条事件
---

### `clear`

#### 测试 #297: 清空队列
**输入参数:**
```json
{
  "action": "clear"
}
```
**期望结果:** 事件队列清空
---

### `send`

#### 测试 #298: 广播消息
**输入参数:**
```json
{
  "action": "send",
  "channel": "ai:done",
  "data": {
    "task": "build_ui"
  }
}
```
**期望结果:** 广播自定义消息
---

### `send_ipc`

#### 测试 #299: IPC 广播
**输入参数:**
```json
{
  "action": "send_ipc",
  "module": "scene",
  "message": "soft-reload"
}
```
**期望结果:** 发送场景重载 IPC
---

## reference_image

### `set`

#### 测试 #300: 显示参考图
**输入参数:**
```json
{
  "action": "set",
  "opacity": 0.5
}
```
**期望结果:** 参考图叠加层显示，透明度 50%
---

### `clear`

#### 测试 #301: 清除参考图
**输入参数:**
```json
{
  "action": "clear"
}
```
**期望结果:** 隐藏所有参考图叠加
---

### `list`

#### 测试 #302: 列出参考图
**输入参数:**
```json
{
  "action": "list"
}
```
**期望结果:** 返回场景中参考图节点列表
---

### `add`

#### 测试 #303: 添加参考图
**输入参数:**
```json
{
  "action": "add",
  "imagePath": "db://assets/ui/mockup.png",
  "opacity": 0.4
}
```
**期望结果:** 添加参考图节点
---

### `remove`

#### 测试 #304: 移除参考图
**输入参数:**
```json
{
  "action": "remove",
  "refUuid": "<uuid>"
}
```
**期望结果:** 删除指定参考图节点
---

### `set_transform`

#### 测试 #305: 调整位置
**输入参数:**
```json
{
  "action": "set_transform",
  "refUuid": "<uuid>",
  "x": 100,
  "y": -50,
  "scaleX": 0.8
}
```
**期望结果:** 参考图移动+缩放
---

### `set_opacity`

#### 测试 #306: 调透明度
**输入参数:**
```json
{
  "action": "set_opacity",
  "refUuid": "<uuid>",
  "opacity": 0.3
}
```
**期望结果:** 透明度→30%
---

## tool_management

### `list_all`

#### 测试 #307: 列出工具
**输入参数:**
```json
{
  "action": "list_all"
}
```
**期望结果:** 返回所有工具及启用状态
---

### `enable`

#### 测试 #308: 启用工具
**输入参数:**
```json
{
  "action": "enable",
  "toolName": "physics_tool"
}
```
**期望结果:** physics_tool 重新启用
---

### `disable`

#### 测试 #309: 禁用工具
**输入参数:**
```json
{
  "action": "disable",
  "toolName": "physics_tool"
}
```
**期望结果:** physics_tool 被禁用，减少 Token 消耗
---

### `get_stats`

#### 测试 #310: 工具统计
**输入参数:**
```json
{
  "action": "get_stats"
}
```
**期望结果:** 返回 {totalTools:19,enabledTools:19,totalActions:236}
---

## execute_script

### `execute_script`

#### 测试 #311: 调用 dispatchQuery
**输入参数:**
```json
{
  "method": "dispatchQuery",
  "args": [
    {
      "action": "tree"
    }
  ]
}
```
**期望结果:** 返回场景树
---

#### 测试 #312: 调用 setNodePosition
**输入参数:**
```json
{
  "method": "setNodePosition",
  "args": [
    "<uuid>",
    100,
    200,
    0
  ]
}
```
**期望结果:** 节点位置被设置
---

## register_custom_macro

### `register_custom_macro`

#### 测试 #313: 注册快捷宏
**输入参数:**
```json
{
  "name": "quick_sprite",
  "description": "快速创建 Sprite 节点",
  "sceneMethodName": "createChildNode"
}
```
**期望结果:** 注册为 macro_quick_sprite 工具
---

#### 测试 #314: 非白名单方法
**输入参数:**
```json
{
  "name": "bad",
  "description": "test",
  "sceneMethodName": "eval"
}
```
**期望结果:** 返回 {error:"方法不在白名单"}
---

## create_prefab_atomic

### `create_prefab_atomic`

#### 测试 #315: 完整预制体
**输入参数:**
```json
{
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
}
```
**期望结果:** 一步创建含 Sprite+碰撞器+子 Label 的预制体
---

#### 测试 #316: 失败回滚
**输入参数:**
```json
{
  "prefabPath": "db://invalid/path.prefab"
}
```
**期望结果:** 创建失败，临时节点自动清理
---

## import_and_apply_texture

### `import_and_apply_texture`

#### 测试 #317: 导入+应用
**输入参数:**
```json
{
  "sourcePath": "C:/art/hero.png",
  "nodeUuid": "<sprite-node>"
}
```
**期望结果:** 图片导入→SpriteFrame 设置→Sprite 显示新图片
---

#### 测试 #318: 自动添加 Sprite
**输入参数:**
```json
{
  "sourcePath": "C:/art/bg.jpg",
  "nodeUuid": "<empty-node>",
  "autoAddSprite": true
}
```
**期望结果:** 自动添加 Sprite 组件+设置纹理
---

## setup_ui_layout

### `setup_ui_layout`

#### 测试 #319: 默认列表
**输入参数:**
```json
{
  "rootName": "PlayerList",
  "itemCount": 5
}
```
**期望结果:** 创建 PlayerList>Viewport(Mask)>Content(Layout)>Item_1~5
---

#### 测试 #320: 无 Mask
**输入参数:**
```json
{
  "rootName": "Grid",
  "itemCount": 10,
  "withMask": false
}
```
**期望结果:** 创建不带 Mask 的布局
---

## create_tween_animation_atomic

### `create_tween_animation_atomic`

#### 测试 #321: 淡入动画
**输入参数:**
```json
{
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
}
```
**期望结果:** 创建 0.5 秒透明度从 0 到 255 的淡入动画
---

#### 测试 #322: 位移+旋转
**输入参数:**
```json
{
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
}
```
**期望结果:** 创建边移动边旋转的循环动画
---

## auto_fit_physics_collider

### `auto_fit_physics_collider`

#### 测试 #323: 自动适配
**输入参数:**
```json
{
  "nodeUuid": "<sprite-node>"
}
```
**期望结果:** 根据 Sprite Alpha 生成 PolygonCollider2D
---

#### 测试 #324: 指定 Box
**输入参数:**
```json
{
  "nodeUuid": "<uuid>",
  "colliderType": "box"
}
```
**期望结果:** 根据 UITransform 尺寸创建 BoxCollider2D
---

#### 测试 #325: 指定 Circle
**输入参数:**
```json
{
  "nodeUuid": "<uuid>",
  "colliderType": "circle"
}
```
**期望结果:** 创建 CircleCollider2D，radius=min(w,h)/2
---
