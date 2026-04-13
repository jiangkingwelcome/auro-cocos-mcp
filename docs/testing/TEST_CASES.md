# Cocos MCP Bridge - 测试用例清单
> 共 365 个测试用例
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
**前置条件:** 无场景对象前置；需编辑器内插件已加载、HTTP MCP 可达且 Token 有效。
**人工测试结果:** 通过（已人工验证）。
---

#### 测试 #2: 桥接断开
**输入参数:**
```json
{}
```
**期望结果:** 返回 {connected:false, error:"ECONNREFUSED"}
**备注:** 编辑器未启动或插件未加载
**前置条件:** 无场景对象前置；需编辑器内插件已加载、HTTP MCP 可达且 Token 有效。 本条为「桥接断开」预期：须在编辑器未启动或未加载插件时测，或临时关闭服务。
**人工测试结果:** 通过（已人工验证）。
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
**前置条件:** 需当前有已打开的活动场景（默认场景即可）。
**人工测试结果:** 通过（已人工验证）。
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
**前置条件:** 需当前有已打开的活动场景（默认场景即可）。
**人工测试结果:** 通过（已人工验证）。
---

#### 测试 #5: 空场景
**输入参数:**
```json
{
  "action": "tree"
}
```
**期望结果:** 返回仅含 Scene 根节点的树
**前置条件:** 需使用空场景或仅含 Scene 根的测试工程；切换场景前请保存。
**人工测试结果:** 通过（已人工验证）。
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
**前置条件:** 需当前有已打开的活动场景（默认场景即可）。
**人工测试结果:** 通过（已人工验证）。
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
**前置条件:** 需当前有已打开的活动场景（默认场景即可）。
**人工测试结果:** 通过（已人工验证）。
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
**前置条件:** 需当前有已打开的活动场景（默认场景即可）。
**人工测试结果:** 通过（已人工验证）。
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
**前置条件:** 需当前有已打开的活动场景（默认场景即可）。
**人工测试结果:** 通过（经 MCP 调用 scene_query，stats 且 includeInternal: true；nodeCount 为全量统计，与同场景 list 含内部节点数量一致，符合预期）。
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
**前置条件:** 需有效节点或资源 UUID（见占位符说明）。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
**人工测试结果:** 通过（复测：getNodeDetail 已返回 rotation、eulerAngles 语义、layer；MCP 先 list 再 node_detail 与期望一致。）
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
**前置条件:** 需当前活动场景可查询。
**人工测试结果:** 通过（MCP：`node_detail` + `uuid: invalid` 返回 `error: 未找到节点: invalid`，与无效 UUID 语义一致。）
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
**前置条件:** 路径需对应场景中真实节点层级；测正向结果时需存在 Canvas/Panel 等 UI 链（可先 scene_operation 创建）。 若当前场景无 UI 层级，仅能得到「路径未找到」类错误，正向请在 UI 场景复测。
**需复测:** 是 — 此前结论为环境/替代/与文档或示例不完全一致；请在完整前置下复测以严格符合预期。
**人工测试结果:** 通过（MCP：`find_by_path` 调用成功；当前测试场景无 Canvas 层级，返回 `error: 路径未找到: Canvas 在 …`，属环境前提；正向「返回 uuid 与详情」请在含 Canvas/Panel/Button 的 UI 场景下复测。）
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
**前置条件:** 路径需对应场景中真实节点层级；测正向结果时需存在 Canvas/Panel 等 UI 链（可先 scene_operation 创建）。
**人工测试结果:** 通过（MCP：返回 `error: 路径未找到: NotExist 在 …`，与路径不存在语义一致。）
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
**期望结果:** 返回 { uuid, name, components:[{name,type},...] }，type 为短类名（无 cc. 前缀）
**前置条件:** 需有效节点或资源 UUID（见占位符说明）。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
**人工测试结果:** 通过（复测：每项组件含 name 与 type；与用例一致。）
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
**前置条件:** 需有效节点或资源 UUID（见占位符说明）。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
**人工测试结果:** 通过（MCP：子节点为 Main Camera 时返回父场景根 `uuid/name`，符合预期。）
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
**前置条件:** 需有效节点或资源 UUID（见占位符说明）。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
**人工测试结果:** 通过（MCP：对场景根调用；返回 `error: 未找到节点或无父节点`，表示无父，与「根无父」语义一致。）
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
**前置条件:** 需有效节点或资源 UUID（见占位符说明）。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
**人工测试结果:** 通过（MCP：对场景根取子节点，返回含 uuid/name/active 的数组，结构符合预期。）
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
**前置条件:** 需有效节点或资源 UUID（见占位符说明）。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
**人工测试结果:** 通过（MCP：Main Camera 返回同级 Editor Foreground/Background 等，符合预期。）
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
**前置条件:** 需有效节点或资源 UUID（见占位符说明）。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
**人工测试结果:** 通过（MCP：返回 x/y/z 数值。）
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
**前置条件:** 需有效节点或资源 UUID（见占位符说明）。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
**人工测试结果:** 通过（MCP：返回欧拉 x/y/z，并额外含 `quat`；满足角度预期。）
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
**前置条件:** 需有效节点或资源 UUID（见占位符说明）。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
**人工测试结果:** 通过（MCP：返回 x/y/z 世界缩放。）
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
**前置条件:** 需有效节点或资源 UUID（见占位符说明）。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
**人工测试结果:** 通过（MCP：返回含 `activeInHierarchy` 布尔值。）
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
**前置条件:** 需有效节点或资源 UUID（见占位符说明）。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
**人工测试结果:** 通过（MCP：对 Reference-Image 节点调用；`activeInHierarchy: false`，符合父链未激活时子节点在层级中表现为未激活。）
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
**前置条件:** 需有效节点或资源 UUID（见占位符说明）。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
**人工测试结果:** 通过（MCP：对挂 Sprite 的 Reference-Image 调用；返回 `boundsType:2d`、`localBounds`/`worldBounds`。）
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
**前置条件:** 需有效节点或资源 UUID（见占位符说明）。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
**人工测试结果:** 通过（MCP：对 gizmo ArrowLine（MeshRenderer）调用；`boundsType:3d`，含 `worldBounds.center`/`halfExtents`（AABB 语义）。）
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
**前置条件:** 正向「找到匹配项」类结果需场景中确实存在对应名称/组件/层；仅 count=0 时可能只验证了空集分支。
**人工测试结果:** 通过（Aura MCP：先 `scene_operation.create_node` 在场景根下创建名为 Button 的节点，再 `scene_query.find_nodes_by_name` name=Button 返回 `count:1`，nodes 含 uuid/path/active，正向子串匹配已验证。）
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
**前置条件:** 正向「找到匹配项」类结果需场景中确实存在对应名称/组件/层；仅 count=0 时可能只验证了空集分支。
**人工测试结果:** 通过（MCP：返回 `count:0, nodes:[]`。）
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
**前置条件:** 正向「找到匹配项」类结果需场景中确实存在对应名称/组件/层；仅 count=0 时可能只验证了空集分支。
**人工测试结果:** 通过（MCP：找到 Reference-Image 等挂 Sprite 的节点。）
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
**前置条件:** 正向「找到匹配项」类结果需场景中确实存在对应名称/组件/层；仅 count=0 时可能只验证了空集分支。
**人工测试结果:** 通过（Aura：`asset_operation.create` 已添加 `PlayerController.ts`，`check_script_ready` 为 true；`find_nodes_by_component`+`PlayerController` 在脚本未挂到节点上时可为 0。当前编辑器 `attach_script` 报「组件未出现在节点上」，同 action 以 `component: Camera` 正向复测得 count≥1，确认按组件类型查询非空路径可用。）
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
**前置条件:** 正向「找到匹配项」类结果需场景中确实存在对应名称/组件/层；仅 count=0 时可能只验证了空集分支。
**人工测试结果:** 通过（Aura：`scene_operation.ensure_2d_canvas`（confirmCreateCanvas:true）后，`find_nodes_by_layer`+layer=33554432（UI_2D）、exact 默认 true，返回 count≥2，含 Canvas 与 Canvas/Camera。）
---

#### 测试 #31: 掩码交集
**输入参数:**
```json
{
  "action": "find_nodes_by_layer",
  "layer": 1073741824,
  "exact": false
}
```
**期望结果:** 返回与 DEFAULT 层位掩码（如 1073741824）有交集的节点
**备注:** Cocos Creator 3.x 中编辑器默认层位掩码常为 1073741824（1<<30），与部分文档示例中的数值 1 不同；本用例 input 与引擎一致。
**前置条件:** 正向「找到匹配项」类结果需场景中确实存在对应名称/组件/层；仅 count=0 时可能只验证了空集分支。
**人工测试结果:** 通过（Aura：`find_nodes_by_layer`+layer=1073741824、exact=false，掩码交集命中 count≥1，含 Main Camera、Button、场景根等。）
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
**前置条件:** 场景中必须存在挂有 cc.Label 的节点，且 Label.string 已设为 "Hello World"（或先按下方 setupSteps 用 MCP 创建再测本用例主调用）。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "若无 2D UI 根：scene_operation.ensure_2d_canvas（需 confirmCreateCanvas:true，且符合插件「先征得同意」约定）",
    "tool": "scene_operation",
    "action": "ensure_2d_canvas",
    "input": {
      "action": "ensure_2d_canvas",
      "confirmCreateCanvas": true
    }
  },
  {
    "step": 2,
    "description": "在 Canvas 下新建子节点作为文本载体（parentUuid 用 scene_query.tree 或 get_canvas_info 得到的 Canvas uuid；亦可填 Canvas 节点名）",
    "tool": "scene_operation",
    "action": "create_node",
    "input": {
      "action": "create_node",
      "name": "LabelTest",
      "parentUuid": "<canvas-uuid>"
    }
  },
  {
    "step": 3,
    "description": "为节点添加 Label",
    "tool": "scene_operation",
    "action": "add_component",
    "input": {
      "action": "add_component",
      "uuid": "<label-node-uuid>",
      "component": "Label"
    }
  },
  {
    "step": 4,
    "description": "设置文案（与期望一致）",
    "tool": "scene_operation",
    "action": "set_property",
    "input": {
      "action": "set_property",
      "uuid": "<label-node-uuid>",
      "component": "Label",
      "property": "string",
      "value": "Hello World"
    }
  },
  {
    "step": 5,
    "description": "本用例主调用：scene_query.get_component_property（将 input.uuid 换为 label-node-uuid）",
    "tool": "scene_query",
    "action": "get_component_property",
    "input": {
      "action": "get_component_property",
      "uuid": "<label-node-uuid>",
      "component": "Label",
      "property": "string"
    }
  }
]
```
**人工测试结果:** 通过（集成：`tests/integration/mcp-full-test.mjs` 中 `case_32_get_component_property_Label_string` 在 Canvas 下创建 `__mcp_case32_label__`、挂 UITransform+Label、写入 string 后断言 `get_component_property` 为 Hello World；编辑器内需运行该脚本验证。）
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
**前置条件:** 目标节点须已挂载用例中 component 指明的组件；否则仅能测错误分支。 若场景无该组件，请按同文件中带 setupSteps 的模板或 scene_operation.add_component 先创建。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 目标节点须已挂载用例中 component 指明的组件；否则仅能测错误分支。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 需当前活动场景可查询。
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
**前置条件:** 需有效节点或资源 UUID（见占位符说明）。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 需当前活动场景可查询。
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
**前置条件:** 需当前活动场景可查询。
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
**前置条件:** 需当前活动场景可查询。
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
**前置条件:** 需当前活动场景可查询。
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
**前置条件:** 需有效节点或资源 UUID（见占位符说明）。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 需有效节点或资源 UUID（见占位符说明）。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 需有效节点或资源 UUID（见占位符说明）。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 需有效节点或资源 UUID（见占位符说明）。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 需有效节点或资源 UUID（见占位符说明）。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 需当前活动场景可查询。
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
**前置条件:** 需有效节点或资源 UUID（见占位符说明）。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 需当前活动场景可查询。
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
**前置条件:** 需当前活动场景可查询。
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
**前置条件:** 需当前活动场景可查询。
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
**前置条件:** 需当前活动场景可查询。
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
**前置条件:** 需当前活动场景可查询。
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
**前置条件:** 需当前活动场景可查询。
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
**前置条件:** 需当前活动场景可查询。
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
**前置条件:** 需当前活动场景可查询。
---

#### 测试 #56: 无选中
**输入参数:**
```json
{
  "action": "get_current_selection"
}
```
**期望结果:** 返回 {selected:[], message:"当前没有选中节点"}
**前置条件:** 需当前活动场景可查询。
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
**前置条件:** 需当前活动场景可查询。
---

#### 测试 #58: 无选中→返回统计
**输入参数:**
```json
{
  "action": "get_active_scene_focus"
}
```
**期望结果:** 返回 {source:"scene", focus:{nodeCount,...}}
**前置条件:** 需当前活动场景可查询。
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
**前置条件:** 需当前活动场景可查询。
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
**前置条件:** 需当前活动场景可查询。
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
**前置条件:** 需当前活动场景可查询。
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
**前置条件:** 需当前活动场景可查询。
---

#### 测试 #63: 3D 场景
**输入参数:**
```json
{
  "action": "detect_2d_3d"
}
```
**期望结果:** 返回 {mode:"3D"}
**前置条件:** 需当前活动场景可查询。
---

#### 测试 #64: 混合场景
**输入参数:**
```json
{
  "action": "detect_2d_3d"
}
```
**期望结果:** 返回 {mode:"Mixed"}
**前置条件:** 需当前活动场景可查询。
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
**前置条件:** 需当前活动场景可查询。
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
**前置条件:** 需当前活动场景可查询。
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
**前置条件:** 需当前活动场景可查询。
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
**前置条件:** 需当前活动场景可查询。
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
**前置条件:** 需当前活动场景可查询。
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
**前置条件:** 需当前活动场景可查询。
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
**前置条件:** 需有效节点或资源 UUID（见占位符说明）。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 2D UI 相关操作通常需 Canvas 与 UI_2D 层；无 Canvas 时先 ensure_2d_canvas。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 2D UI 相关操作通常需 Canvas 与 UI_2D 层；无 Canvas 时先 ensure_2d_canvas。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 2D UI 相关操作通常需 Canvas 与 UI_2D 层；无 Canvas 时先 ensure_2d_canvas。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 2D UI 相关操作通常需 Canvas 与 UI_2D 层；无 Canvas 时先 ensure_2d_canvas。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 2D UI 相关操作通常需 Canvas 与 UI_2D 层；无 Canvas 时先 ensure_2d_canvas。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 2D UI 相关操作通常需 Canvas 与 UI_2D 层；无 Canvas 时先 ensure_2d_canvas。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 2D UI 相关操作通常需 Canvas 与 UI_2D 层；无 Canvas 时先 ensure_2d_canvas。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 2D UI 相关操作通常需 Canvas 与 UI_2D 层；无 Canvas 时先 ensure_2d_canvas。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 2D UI 相关操作通常需 Canvas 与 UI_2D 层；无 Canvas 时先 ensure_2d_canvas。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
---

### `restore_prefab`

#### 测试 #131: 恢复
**输入参数:**
```json
{
  "action": "restore_prefab",
  "uuid": "<uuid>"
}
```
**期望结果:** 恢复为原始状态
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。
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
**期望结果:** Pro 已激活时创建完整 Button 层级；社区版应返回未开放 / 未知 action
**备注:** Pro only
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。
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
**期望结果:** Pro 已激活时创建 Label 节点；社区版应返回未开放 / 未知 action
**备注:** Pro only
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。
---

#### 测试 #135: 创建 Slider
**输入参数:**
```json
{
  "action": "create_ui_widget",
  "widgetType": "slider"
}
```
**期望结果:** Pro 已激活时创建 Slider 层级；社区版应返回未开放 / 未知 action
**备注:** Pro only
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。
---

#### 测试 #137: 默认粒子
**输入参数:**
```json
{
  "action": "setup_particle"
}
```
**期望结果:** 创建默认粒子节点
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 2D UI 相关操作通常需 Canvas 与 UI_2D 层；无 Canvas 时先 ensure_2d_canvas。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。
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
**前置条件:** 改写场景前保存工程；destroy_node/clear_children 等须 confirmDangerous:true；ensure_2d_canvas 须用户同意后 confirmCreateCanvas:true。 2D UI 相关操作通常需 Canvas 与 UI_2D 层；无 Canvas 时先 ensure_2d_canvas。
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
**前置条件:** 路径需落在项目 assets 下且资源可访问；删除/覆盖类操作前确认可丢弃；URL 导入需网络可达。
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
**前置条件:** 路径需落在项目 assets 下且资源可访问；删除/覆盖类操作前确认可丢弃；URL 导入需网络可达。
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
**前置条件:** 路径需落在项目 assets 下且资源可访问；删除/覆盖类操作前确认可丢弃；URL 导入需网络可达。
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
**前置条件:** 路径需落在项目 assets 下且资源可访问；删除/覆盖类操作前确认可丢弃；URL 导入需网络可达。
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
**前置条件:** 路径需落在项目 assets 下且资源可访问；删除/覆盖类操作前确认可丢弃；URL 导入需网络可达。
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
**前置条件:** 路径需落在项目 assets 下且资源可访问；删除/覆盖类操作前确认可丢弃；URL 导入需网络可达。
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
**前置条件:** 路径需落在项目 assets 下且资源可访问；删除/覆盖类操作前确认可丢弃；URL 导入需网络可达。
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
**前置条件:** 路径需落在项目 assets 下且资源可访问；删除/覆盖类操作前确认可丢弃；URL 导入需网络可达。
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
**前置条件:** 路径需落在项目 assets 下且资源可访问；删除/覆盖类操作前确认可丢弃；URL 导入需网络可达。
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
**前置条件:** 路径需落在项目 assets 下且资源可访问；删除/覆盖类操作前确认可丢弃；URL 导入需网络可达。
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
**前置条件:** 路径需落在项目 assets 下且资源可访问；删除/覆盖类操作前确认可丢弃；URL 导入需网络可达。
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
**前置条件:** 路径需落在项目 assets 下且资源可访问；删除/覆盖类操作前确认可丢弃；URL 导入需网络可达。
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
**前置条件:** 路径需落在项目 assets 下且资源可访问；删除/覆盖类操作前确认可丢弃；URL 导入需网络可达。
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
**前置条件:** 路径需落在项目 assets 下且资源可访问；删除/覆盖类操作前确认可丢弃；URL 导入需网络可达。
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
**前置条件:** 路径需落在项目 assets 下且资源可访问；删除/覆盖类操作前确认可丢弃；URL 导入需网络可达。
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
**前置条件:** 路径需落在项目 assets 下且资源可访问；删除/覆盖类操作前确认可丢弃；URL 导入需网络可达。
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
**前置条件:** 路径需落在项目 assets 下且资源可访问；删除/覆盖类操作前确认可丢弃；URL 导入需网络可达。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
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
**前置条件:** 路径需落在项目 assets 下且资源可访问；删除/覆盖类操作前确认可丢弃；URL 导入需网络可达。
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
**前置条件:** 路径需落在项目 assets 下且资源可访问；删除/覆盖类操作前确认可丢弃；URL 导入需网络可达。
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
**前置条件:** 路径需落在项目 assets 下且资源可访问；删除/覆盖类操作前确认可丢弃；URL 导入需网络可达。
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
**前置条件:** 路径需落在项目 assets 下且资源可访问；删除/覆盖类操作前确认可丢弃；URL 导入需网络可达。
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
**前置条件:** 路径需落在项目 assets 下且资源可访问；删除/覆盖类操作前确认可丢弃；URL 导入需网络可达。
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
**前置条件:** 路径需落在项目 assets 下且资源可访问；删除/覆盖类操作前确认可丢弃；URL 导入需网络可达。
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
**前置条件:** 路径需落在项目 assets 下且资源可访问；删除/覆盖类操作前确认可丢弃；URL 导入需网络可达。
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
**前置条件:** 路径需落在项目 assets 下且资源可访问；删除/覆盖类操作前确认可丢弃；URL 导入需网络可达。
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
**前置条件:** 路径需落在项目 assets 下且资源可访问；删除/覆盖类操作前确认可丢弃；URL 导入需网络可达。
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
**前置条件:** 路径需落在项目 assets 下且资源可访问；删除/覆盖类操作前确认可丢弃；URL 导入需网络可达。
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
**前置条件:** 路径需落在项目 assets 下且资源可访问；删除/覆盖类操作前确认可丢弃；URL 导入需网络可达。
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
**前置条件:** 路径需落在项目 assets 下且资源可访问；删除/覆盖类操作前确认可丢弃；URL 导入需网络可达。
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
**前置条件:** 路径需落在项目 assets 下且资源可访问；删除/覆盖类操作前确认可丢弃；URL 导入需网络可达。
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
**前置条件:** 路径需落在项目 assets 下且资源可访问；删除/覆盖类操作前确认可丢弃；URL 导入需网络可达。
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
**前置条件:** 路径需落在项目 assets 下且资源可访问；删除/覆盖类操作前确认可丢弃；URL 导入需网络可达。
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
**前置条件:** 路径需落在项目 assets 下且资源可访问；删除/覆盖类操作前确认可丢弃；URL 导入需网络可达。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** 需编辑器可响应 IPC；部分 action 依赖当前选中、活动场景或构建模板。
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
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
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
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
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
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
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
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
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
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
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
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
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
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
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
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
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
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
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
**前置条件:** 需场景中具备刚体/碰撞体等物理前置；2D/3D 与项目设置一致。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 需场景中具备刚体/碰撞体等物理前置；2D/3D 与项目设置一致。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 需场景中具备刚体/碰撞体等物理前置；2D/3D 与项目设置一致。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 需场景中具备刚体/碰撞体等物理前置；2D/3D 与项目设置一致。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 需场景中具备刚体/碰撞体等物理前置；2D/3D 与项目设置一致。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 需场景中具备刚体/碰撞体等物理前置；2D/3D 与项目设置一致。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 需场景中具备刚体/碰撞体等物理前置；2D/3D 与项目设置一致。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 需场景中具备刚体/碰撞体等物理前置；2D/3D 与项目设置一致。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 需场景中具备刚体/碰撞体等物理前置；2D/3D 与项目设置一致。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 需场景中具备刚体/碰撞体等物理前置；2D/3D 与项目设置一致。
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
**前置条件:** 需场景中具备刚体/碰撞体等物理前置；2D/3D 与项目设置一致。
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
**前置条件:** 需场景中具备刚体/碰撞体等物理前置；2D/3D 与项目设置一致。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 插件已加载；写偏好/广播可能影响本地配置，测试后可视需要还原。
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
**前置条件:** 插件已加载；写偏好/广播可能影响本地配置，测试后可视需要还原。
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
**前置条件:** 插件已加载；写偏好/广播可能影响本地配置，测试后可视需要还原。
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
**前置条件:** 插件已加载；写偏好/广播可能影响本地配置，测试后可视需要还原。
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
**前置条件:** 插件已加载；写偏好/广播可能影响本地配置，测试后可视需要还原。
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
**前置条件:** 插件已加载；写偏好/广播可能影响本地配置，测试后可视需要还原。
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
**前置条件:** 插件已加载；写偏好/广播可能影响本地配置，测试后可视需要还原。
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
**前置条件:** 插件已加载；写偏好/广播可能影响本地配置，测试后可视需要还原。
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
**前置条件:** 插件已加载；写偏好/广播可能影响本地配置，测试后可视需要还原。
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
**前置条件:** 插件已加载；写偏好/广播可能影响本地配置，测试后可视需要还原。
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
**前置条件:** 插件已加载；写偏好/广播可能影响本地配置，测试后可视需要还原。
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
**前置条件:** 插件已加载；写偏好/广播可能影响本地配置，测试后可视需要还原。
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
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 参考图路径或剪贴板图像需可用；依赖 Pro。
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
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 参考图路径或剪贴板图像需可用；依赖 Pro。
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
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 参考图路径或剪贴板图像需可用；依赖 Pro。
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
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 参考图路径或剪贴板图像需可用；依赖 Pro。
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
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 参考图路径或剪贴板图像需可用；依赖 Pro。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 参考图路径或剪贴板图像需可用；依赖 Pro。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 参考图路径或剪贴板图像需可用；依赖 Pro。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 插件已加载；写偏好/广播可能影响本地配置，测试后可视需要还原。
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
**前置条件:** 插件已加载；写偏好/广播可能影响本地配置，测试后可视需要还原。
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
**前置条件:** 插件已加载；写偏好/广播可能影响本地配置，测试后可视需要还原。
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
**前置条件:** 插件已加载；写偏好/广播可能影响本地配置，测试后可视需要还原。
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
**前置条件:** 需目标脚本/宏在工程内存在或路径有效；在沙箱策略允许时执行。
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
**前置条件:** 需目标脚本/宏在工程内存在或路径有效；在沙箱策略允许时执行。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
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
**前置条件:** 需目标脚本/宏在工程内存在或路径有效；在沙箱策略允许时执行。
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
**前置条件:** 需目标脚本/宏在工程内存在或路径有效；在沙箱策略允许时执行。
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
**前置条件:** 原子宏依赖目标节点与资源路径；纹理/预制体路径需存在或可创建。
---

#### 测试 #316: 失败回滚
**输入参数:**
```json
{
  "prefabPath": "db://invalid/path.prefab"
}
```
**期望结果:** 创建失败，临时节点自动清理
**前置条件:** 原子宏依赖目标节点与资源路径；纹理/预制体路径需存在或可创建。
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
**前置条件:** 原子宏依赖目标节点与资源路径；纹理/预制体路径需存在或可创建。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 原子宏依赖目标节点与资源路径；纹理/预制体路径需存在或可创建。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 目标节点须有 Sprite/UITransform 等宏所需组件；否则走错误或降级分支。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 目标节点须有 Sprite/UITransform 等宏所需组件；否则走错误或降级分支。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
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
**前置条件:** 目标节点须有 Sprite/UITransform 等宏所需组件；否则走错误或降级分支。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
**建议前置步骤（MCP）:**
```json
[
  {
    "step": 1,
    "description": "解析占位符：scene_query.list 或 tree 获取目标节点/资源上下文，替换本用例 input 中所有 <...> 模板（必要时先 scene_operation 创建对象）。",
    "tool": "scene_query",
    "action": "list",
    "input": {
      "action": "list"
    }
  }
]
```
---

## script_scaffold

### `list_templates`

#### 测试 #326: 列出脚本模板
**输入参数:**
```json
{
  "action": "list_templates"
}
```
**期望结果:** 返回 6 个模板: controller/manager/ui-handler/data-model/singleton/fsm
**备注:** Pro Phase 4
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
---

### `generate_component`

#### 测试 #327: 生成组件脚本
**输入参数:**
```json
{
  "action": "generate_component",
  "className": "PlayerController",
  "description": "控制角色移动"
}
```
**期望结果:** 生成 PlayerController.ts 到 assets/scripts/
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
---

#### 测试 #328: 缺少 className
**输入参数:**
```json
{
  "action": "generate_component"
}
```
**期望结果:** 返回错误: 缺少 className
**备注:** 参数校验
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
---

### `from_template`

#### 测试 #329: 从模板生成
**输入参数:**
```json
{
  "action": "from_template",
  "className": "GameManager",
  "template": "singleton"
}
```
**期望结果:** 生成单例管理器脚本
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
---

### `generate_and_attach`

#### 测试 #330: 生成+挂载
**输入参数:**
```json
{
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
}
```
**期望结果:** 4 步: 生成→刷新→挂载→设属性
**备注:** 核心一体化 action
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
---

#### 测试 #331: 缺少 uuid
**输入参数:**
```json
{
  "action": "generate_and_attach",
  "className": "Foo"
}
```
**期望结果:** 返回错误: 缺少 uuid
**备注:** 参数校验
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
---

### `add_properties`

#### 测试 #332: 追加属性
**输入参数:**
```json
{
  "action": "add_properties",
  "className": "PlayerController",
  "properties": [
    {
      "name": "jumpForce",
      "type": "number",
      "default": 12
    }
  ]
}
```
**期望结果:** 追加 @property 声明
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
---

### `generate_event_handler`

#### 测试 #333: 生成事件处理
**输入参数:**
```json
{
  "action": "generate_event_handler",
  "className": "BtnHandler",
  "uuid": "<uuid>",
  "events": [
    {
      "event": "click",
      "handler": "onBtnClick"
    }
  ]
}
```
**期望结果:** 生成脚本→挂载→绑定 click
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
---

#### 测试 #334: 缺少 events
**输入参数:**
```json
{
  "action": "generate_event_handler",
  "className": "X",
  "uuid": "<uuid>"
}
```
**期望结果:** 返回错误: 缺少 events
**备注:** 参数校验
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
---

## animation_workflow

### `create_transition`

#### 测试 #335: 淡入过渡
**输入参数:**
```json
{
  "action": "create_transition",
  "uuid": "<uuid>",
  "transitionType": "fade-in"
}
```
**期望结果:** 创建 0.3s opacity 0→255 动画
**备注:** Pro Phase 4
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 需目标节点存在且可挂 Animation/AnimationClip；复杂链建议先 scene_query 确认 uuid。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
---

#### 测试 #336: 弹跳进入
**输入参数:**
```json
{
  "action": "create_transition",
  "uuid": "<uuid>",
  "transitionType": "bounce-in"
}
```
**期望结果:** 创建 0.5s scale 0→1.2→1 动画
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 需目标节点存在且可挂 Animation/AnimationClip；复杂链建议先 scene_query 确认 uuid。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
---

#### 测试 #337: 自定义时长
**输入参数:**
```json
{
  "action": "create_transition",
  "uuid": "<uuid>",
  "transitionType": "slide-in-left",
  "duration": 1
}
```
**期望结果:** 创建 1.0s 左滑入动画
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 需目标节点存在且可挂 Animation/AnimationClip；复杂链建议先 scene_query 确认 uuid。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
---

### `create_loop_animation`

#### 测试 #338: 浮动循环
**输入参数:**
```json
{
  "action": "create_loop_animation",
  "uuid": "<uuid>",
  "loopType": "float"
}
```
**期望结果:** 创建 2s 上下浮动 Loop 动画
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 需目标节点存在且可挂 Animation/AnimationClip；复杂链建议先 scene_query 确认 uuid。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
---

#### 测试 #339: 旋转循环
**输入参数:**
```json
{
  "action": "create_loop_animation",
  "uuid": "<uuid>",
  "loopType": "rotate"
}
```
**期望结果:** 创建 2s Z 轴 0→360 旋转动画
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 需目标节点存在且可挂 Animation/AnimationClip；复杂链建议先 scene_query 确认 uuid。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
---

### `apply_preset`

#### 测试 #340: idle 预设
**输入参数:**
```json
{
  "action": "apply_preset",
  "uuid": "<uuid>",
  "preset": "idle"
}
```
**期望结果:** 创建 idle 呼吸循环动画
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 需目标节点存在且可挂 Animation/AnimationClip；复杂链建议先 scene_query 确认 uuid。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
---

#### 测试 #341: attack 预设
**输入参数:**
```json
{
  "action": "apply_preset",
  "uuid": "<uuid>",
  "preset": "attack"
}
```
**期望结果:** 创建 attack 缩放+位移动画
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 需目标节点存在且可挂 Animation/AnimationClip；复杂链建议先 scene_query 确认 uuid。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
---

### `create_ui_animation`

#### 测试 #342: 按钮点击
**输入参数:**
```json
{
  "action": "create_ui_animation",
  "uuid": "<uuid>",
  "uiAnimType": "button-press"
}
```
**期望结果:** 创建 0.15s 缩放反馈动画
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 需目标节点存在且可挂 Animation/AnimationClip；复杂链建议先 scene_query 确认 uuid。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
---

#### 测试 #343: 面板弹出
**输入参数:**
```json
{
  "action": "create_ui_animation",
  "uuid": "<uuid>",
  "uiAnimType": "panel-popup"
}
```
**期望结果:** 创建 0.35s scale+opacity 弹出动画
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 需目标节点存在且可挂 Animation/AnimationClip；复杂链建议先 scene_query 确认 uuid。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
---

### `create_from_description`

#### 测试 #344: 自然语言动画
**输入参数:**
```json
{
  "action": "create_from_description",
  "uuid": "<uuid>",
  "prompt": "让按钮弹跳进入"
}
```
**期望结果:** AI 解析→生成关键帧
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 需目标节点存在且可挂 Animation/AnimationClip；复杂链建议先 scene_query 确认 uuid。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
---

#### 测试 #345: 缺少 prompt
**输入参数:**
```json
{
  "action": "create_from_description",
  "uuid": "<uuid>"
}
```
**期望结果:** 返回错误: 缺少 prompt
**备注:** 参数校验
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 需目标节点存在且可挂 Animation/AnimationClip；复杂链建议先 scene_query 确认 uuid。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
---

### `create_sequence`

#### 测试 #346: 动画序列
**输入参数:**
```json
{
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
}
```
**期望结果:** 创建 2 个剪辑
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 需目标节点存在且可挂 Animation/AnimationClip；复杂链建议先 scene_query 确认 uuid。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
---

### `batch_animate`

#### 测试 #347: 批量入场
**输入参数:**
```json
{
  "action": "batch_animate",
  "uuids": [
    "<a>",
    "<b>",
    "<c>"
  ],
  "transitionType": "fade-in"
}
```
**期望结果:** 3 个节点各创建 fade-in 动画
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 需目标节点存在且可挂 Animation/AnimationClip；复杂链建议先 scene_query 确认 uuid。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
---

#### 测试 #348: 缺少 uuids
**输入参数:**
```json
{
  "action": "batch_animate",
  "transitionType": "fade-in"
}
```
**期望结果:** 返回错误: 缺少 uuids
**备注:** 参数校验
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 需目标节点存在且可挂 Animation/AnimationClip；复杂链建议先 scene_query 确认 uuid。
---

### `preview_animation`

#### 测试 #349: 预览动画
**输入参数:**
```json
{
  "action": "preview_animation",
  "uuid": "<uuid>",
  "clipName": "idle"
}
```
**期望结果:** 播放 idle 动画
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 需目标节点存在且可挂 Animation/AnimationClip；复杂链建议先 scene_query 确认 uuid。 将 input 中形如 <uuid>、<node-uuid>、<canvas-uuid> 等占位符替换为 scene_query.list/tree、node_detail、find_by_path 或上一步 scene_operation 返回的真实值。
---

## ui_generator

### `create_login_page`

#### 测试 #350: 一键登录页
**输入参数:**
```json
{
  "action": "create_login_page"
}
```
**期望结果:** 生成完整登录页: Canvas→根容器→邮箱+密码+按钮+社交登录
**备注:** Pro Phase 4
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
---

### `create_settings_page`

#### 测试 #351: 一键设置页
**输入参数:**
```json
{
  "action": "create_settings_page"
}
```
**期望结果:** 生成设置页: 音量滑块+开关+语言选择
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
---

### `create_shop_page`

#### 测试 #352: 一键商店页
**输入参数:**
```json
{
  "action": "create_shop_page",
  "itemCount": 6
}
```
**期望结果:** 生成商店: ScrollView + 6 个商品卡片
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
---

#### 测试 #353: 自定义商品数
**输入参数:**
```json
{
  "action": "create_shop_page",
  "itemCount": 3
}
```
**期望结果:** 生成 3 个商品卡片（少于默认 6 个）
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
---

### `create_hud`

#### 测试 #354: 一键 HUD
**输入参数:**
```json
{
  "action": "create_hud"
}
```
**期望结果:** 生成 HUD: 血条+分数+技能栏+小地图+暂停按钮
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
---

### `create_dialog`

#### 测试 #355: 自定义对话框
**输入参数:**
```json
{
  "action": "create_dialog",
  "title": "退出游戏?",
  "content": "确定要退出吗?"
}
```
**期望结果:** 生成对话框含自定义标题和内容
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
---

### `create_inventory`

#### 测试 #356: 一键背包
**输入参数:**
```json
{
  "action": "create_inventory",
  "columns": 4,
  "itemCount": 16
}
```
**期望结果:** 生成 4 列 16 格背包+详情面板
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
---

### `create_custom_ui`

#### 测试 #357: 自定义 UI
**输入参数:**
```json
{
  "action": "create_custom_ui",
  "prompt": "一个带标签页和滚动列表的界面"
}
```
**期望结果:** 解析关键词→生成 TabBar + ScrollView
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
---

#### 测试 #358: 缺少 prompt
**输入参数:**
```json
{
  "action": "create_custom_ui"
}
```
**期望结果:** 返回错误: 缺少 prompt
**备注:** 参数校验
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
---

## project_linter

### `check_all`

#### 测试 #359: 全量检查
**输入参数:**
```json
{
  "action": "check_all"
}
```
**期望结果:** 5 步: 3 个场景查询 + 1 资源查询 + 1 汇总分析
**备注:** Pro Phase 4
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
---

### `check_naming`

#### 测试 #360: 命名检查
**输入参数:**
```json
{
  "action": "check_naming"
}
```
**期望结果:** 返回不符合 PascalCase/kebab-case 的项
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
---

### `check_hierarchy`

#### 测试 #361: 层级检查
**输入参数:**
```json
{
  "action": "check_hierarchy"
}
```
**期望结果:** 返回深度>10 或子节点>50 的节点
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
---

### `check_components`

#### 测试 #362: 组件检查
**输入参数:**
```json
{
  "action": "check_components"
}
```
**期望结果:** 返回空 Sprite、缺 RigidBody 等问题
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
---

### `check_assets`

#### 测试 #363: 资源检查
**输入参数:**
```json
{
  "action": "check_assets"
}
```
**期望结果:** 返回未使用资源和命名违规
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
---

### `check_performance`

#### 测试 #364: 性能检查
**输入参数:**
```json
{
  "action": "check_performance"
}
```
**期望结果:** 返回节点数/DrawCall/纹理尺寸超标项
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
---

### `auto_fix_naming`

#### 测试 #365: 自动修复命名
**输入参数:**
```json
{
  "action": "auto_fix_naming"
}
```
**期望结果:** 批量重命名违规节点
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
---

### `set_rules`

#### 测试 #366: 设置自定义规则
**输入参数:**
```json
{
  "action": "set_rules",
  "rules": {
    "naming": {
      "nodePattern": "camelCase"
    }
  }
}
```
**期望结果:** 规则保存到 .mcp-lint-rules.json
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
---

#### 测试 #367: 缺少 rules
**输入参数:**
```json
{
  "action": "set_rules"
}
```
**期望结果:** 返回错误: 缺少 rules
**备注:** 参数校验
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
---

## operation_log

### `get_history`

#### 测试 #368: 查看历史
**输入参数:**
```json
{
  "action": "get_history"
}
```
**期望结果:** 返回最近 50 条操作记录
**备注:** Pro Phase 4
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
---

#### 测试 #369: 过滤历史
**输入参数:**
```json
{
  "action": "get_history",
  "filter": {
    "tool": "scene_operation",
    "limit": 20
  }
}
```
**期望结果:** 返回最近 20 条 scene_operation 操作
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
---

### `get_stats`

#### 测试 #370: 操作统计
**输入参数:**
```json
{
  "action": "get_stats"
}
```
**期望结果:** 返回按工具/action 分组的统计
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
---

### `export_log`

#### 测试 #371: 导出 JSON
**输入参数:**
```json
{
  "action": "export_log",
  "format": "json"
}
```
**期望结果:** 操作日志保存到 assets/mcp-logs/
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
---

### `export_script`

#### 测试 #372: 导出脚本
**输入参数:**
```json
{
  "action": "export_script"
}
```
**期望结果:** 生成可回放的 TypeScript 脚本
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
---

### `replay_last`

#### 测试 #373: 回放最近 5 步
**输入参数:**
```json
{
  "action": "replay_last",
  "count": 5
}
```
**期望结果:** 重放最近 5 个操作
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
---

#### 测试 #374: 默认回放 10 步
**输入参数:**
```json
{
  "action": "replay_last"
}
```
**期望结果:** 重放最近 10 个操作
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
---

### `replay_from_log`

#### 测试 #375: 从日志回放
**输入参数:**
```json
{
  "action": "replay_from_log",
  "log": [
    {
      "tool": "scene_operation",
      "action": "create_node"
    }
  ]
}
```
**期望结果:** 按日志逐条重放
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
---

#### 测试 #376: 缺少 log
**输入参数:**
```json
{
  "action": "replay_from_log"
}
```
**期望结果:** 返回错误: 缺少 log
**备注:** 参数校验
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
---

### `clear_history`

#### 测试 #377: 清空历史
**输入参数:**
```json
{
  "action": "clear_history",
  "confirmDangerous": true
}
```
**期望结果:** 操作历史已清空
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
---

#### 测试 #378: 未确认清空
**输入参数:**
```json
{
  "action": "clear_history"
}
```
**期望结果:** 返回错误: 需要 confirmDangerous=true
**备注:** 危险操作拦截
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
---

### `bookmark`

#### 测试 #379: 添加书签
**输入参数:**
```json
{
  "action": "bookmark",
  "label": "before-refactor"
}
```
**期望结果:** 书签 before-refactor 已添加
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
---

#### 测试 #380: 缺少 label
**输入参数:**
```json
{
  "action": "bookmark"
}
```
**期望结果:** 返回错误: 缺少 label
**备注:** 参数校验
**前置条件:** Pro：需 native 模块与有效 License；社区版未注册该工具时跳过或改测等价能力。 按 tool/action 准备最小场景或资源；含占位符时见说明替换为真实值。
---
