# Cocos Creator 3.8.8 IPC 消息参考文档

> 来源：Cocos Creator 3.8.8 编辑器 - 开发者 → 消息管理  
> 仅包含截图中的 7 个模块：project, preferences, asset-db, scene, server, builder, reference-image

---

## 1. project 模块

### Message

| 消息名称 | 描述 |
|---------|------|
| `open-settings` | 打开项目设置面板 |
| `query-config` | 查询项目配置 |
| `set-config` | 设置项目配置 |

---

## 2. preferences 模块

### Message

| 消息名称 | 描述 |
|---------|------|
| `open-settings` | 打开偏好设置面板 |
| `query-config` | 查询偏好配置 |
| `set-config` | 设置偏好配置 |

---

## 3. asset-db 模块

### Message

| 消息名称 | 描述 |
|---------|------|
| `query-ready` | 检查资源数据库是否已启动完成 |
| `create-asset` | 创建新资源 |
| `import-asset` | 将文件或文件夹导入资源数据库 |
| `copy-asset` | 复制指定资源 |
| `move-asset` | 将资源移动到指定位置 |
| `delete-asset` | 删除资源 |
| `open-asset` | 尝试使用记录的打开程序打开资源 |
| `save-asset` | 保存资源 |
| `save-asset-meta` | 保存资源的 meta 信息 |
| `reimport-asset` | 重新导入资源 |
| `refresh-asset` | 刷新资源所在 url 位置；删除的资源会被销毁，新增资源会被添加 |
| `query-path` | 查询资源的文件路径 |
| `query-url` | 查询资源的 URL |
| `query-uuid` | 查询资源的 UUID |
| `query-assets` | 根据条件查询资源数组 |
| `query-asset-info` | 查询资源的基本信息 |
| `query-asset-meta` | 查询资源的 META 信息 |
| `query-asset-dependencies` | 查询资源依赖的资源或脚本 uuid 数组 |
| `query-asset-users` | 查询资源被哪些资源或脚本直接使用 |
| `generate-available-url` | 根据传入的 url 生成一个可用的新 url |

---

## 4. scene 模块

### Message

| 消息名称 | 描述 |
|---------|------|
| `set-property` | 设置某个元素内的属性 |
| `reset-property` | 重置元素属性到默认值 |
| `move-array-element` | 移动数组内某个元素的位置 |
| `remove-array-element` | 删除数组内某个元素 |
| `copy-node` | 拷贝节点，给下一步粘贴（创建）节点准备数据 |
| `duplicate-node` | 复制节点 |
| `paste-node` | 粘贴节点 |
| `cut-node` | 剪切节点 |
| `set-parent` | 设置节点父级 |
| `create-node` | 创建节点 |
| `reset-node` | 重置节点的位置、角度和缩放 |
| `reset-component` | 重置组件 |
| `restore-prefab` | 使用预制体资源还原对应预制件节点（内置撤销记录） |
| `remove-node` | 删除节点 |
| `create-component` | 创建组件 |
| `remove-component` | 删除组件 |
| `execute-component-method` | 执行组件上的方法 |
| `execute-scene-script` | 执行某个插件注册的方法 |
| `snapshot` | 快照当前场景状态 |
| `snapshot-abort` | 中止快照 |
| `begin-recording` | 开始记录节点 Undo 数据 |
| `end-recording` | 结束记录节点 Undo 数据 |
| `cancel-recording` | 取消记录节点 Undo 数据 |
| `soft-reload` | 软刷新场景 |
| `change-gizmo-tool` | 更改 Gizmo 工具 |
| `query-gizmo-tool-name` | 获取当前 Gizmo 工具的名字 |
| `change-gizmo-pivot` | 更改变换基准点 |
| `query-gizmo-pivot` | 获取当前 Gizmo 基准点名字 |
| `query-gizmo-view-mode` | 查询视图模式（查看/选择） |
| `change-gizmo-coordinate` | 更改坐标系 |
| `query-gizmo-coordinate` | 获取当前坐标系名字 |
| `change-is2D` | 更改 2D/3D 视图模式 |
| `query-is2D` | 获取当前视图模式 |
| `set-grid-visible` | 显示/隐藏网格 |
| `query-is-grid-visible` | 查询网格显示状态 |
| `set-icon-gizmo-3d` | 设置 IconGizmo 为 3D 或 2D 模式 |
| `query-is-icon-gizmo-3d` | 查询 IconGizmo 模式 |
| `set-icon-gizmo-size` | 设置 IconGizmo 的大小 |
| `query-icon-gizmo-size` | 查询 IconGizmo 的大小 |
| `focus-camera` | 聚焦场景相机到节点上 |
| `align-with-view` | 将场景相机位置与角度应用到选中节点上 |
| `align-view-with-node` | 将选中节点位置与角度应用到当前视角 |
| `query-is-ready` | 查询当前场景是否准备就绪 |
| `query-node` | 查询一个节点的数据 |
| `query-component` | 查询一个组件的数据 |
| `query-node-tree` | 查询节点树的信息 |
| `query-nodes-by-asset-uuid` | 查询使用了资源 UUID 的节点 |
| `query-dirty` | 查询当前场景是否有修改 |
| `query-classes` | 查询所有在引擎中注册的类 |
| `query-components` | 查询当前场景的所有组件 |
| `query-component-has-script` | 查询引擎组件列表是否含有指定类名的脚本 |

---

## 5. server 模块

### Message

| 消息名称 | 描述 |
|---------|------|
| `query-ip-list` | 查询 IP 列表 |
| `query-sort-ip-list` | 获取排序后的 ip 列表 |
| `query-port` | 查询编辑器服务器当前启动的端口号 |

---

## 6. builder 模块

### Message

| 消息名称 | 描述 |
|---------|------|
| `open` | 打开构建面板 |
| `query-worker-ready` | 查询构建进程是否启动 |

---

## 7. reference-image 模块

### Message

| 消息名称 | 描述 |
|---------|------|
| `add-image` | 添加参考图 |
| `remove-image` | 删除参考图 |
| `switch-image` | 切换参考图 |
| `set-image-data` | 设置参考图数据 |
| `query-config` | 请求参考图配置 |
| `query-current` | 请求当前参考图数据 |
| `refresh` | 刷新参考图 |

---

## 使用说明

- **普通消息（有返回值）**：`await Editor.Message.request('scene', 'query-node', uuid)`
- **发送消息（无返回值）**：`Editor.Message.send('builder', 'open')`
- 完整列表请以编辑器 **开发者 → 消息管理** 为准。
