# 测试用例导出说明

## 概述

从 `ACTION_CAPABILITIES.html` 中提取了 **325 个测试用例**，并导出为多种格式，方便不同场景使用。

## 生成的文件

### 1. test-cases.json (90KB)
**用途**: 原始数据，供程序读取

**结构**:
```json
[
  {
    "id": 1,
    "tool": "bridge_status",
    "action": "bridge_status",
    "title": "基本连通性检查",
    "input": {},
    "expected": "返回 {connected:true, version:\"3.8.x\", uptime, port}",
    "note": "启动后第一步调用"
  }
]
```

### 2. test-cases.xlsx (29KB)
**用途**: Excel 表格，适合人工测试和管理

**特点**:
- ✅ 表头加粗，浅蓝色背景
- ✅ 自动筛选功能
- ✅ 冻结首行
- ✅ 输入参数使用等宽字体（Consolas）
- ✅ 自动换行，易于阅读
- ✅ 包含 7 列：测试ID、工具名称、Action名称、测试标题、输入参数、期望结果、备注

**列宽设置**:
- 测试ID: 10
- 工具名称: 20
- Action名称: 25
- 测试标题: 30
- 输入参数: 50
- 期望结果: 50
- 备注: 30

### 3. TEST_CASES.md (70KB)
**用途**: Markdown 文档，适合 AI 阅读和文档展示

**特点**:
- ✅ 按工具和 Action 分组
- ✅ 使用 Emoji 图标标识工具类型
- ✅ JSON 代码块格式化
- ✅ 清晰的层级结构
- ✅ 包含所有测试细节

**工具分类**:
- 🔌 Bridge 状态
- 🔍 场景查询
- ⚙️ 场景操作
- 📦 资源操作
- 🎮 编辑器控制
- 📁 项目管理

### 4. test-cases.csv
**用途**: CSV 格式，适合导入到测试管理工具

**特点**:
- ✅ UTF-8 BOM 编码（Excel 兼容）
- ✅ 包含额外的测试跟踪列：
  - 测试状态（待填写）
  - 实际结果（待填写）
  - 测试人员（待填写）
  - 测试日期（待填写）

## 测试用例统计

### 按工具分类

| 工具 | Action 数量 | 测试用例数量 |
|------|------------|-------------|
| bridge_status | 1 | 2 |
| scene_query | 30+ | 100+ |
| scene_operation | 50+ | 150+ |
| asset_operation | 20+ | 50+ |
| editor_control | 10+ | 20+ |
| project_management | 5+ | 10+ |

**总计**: 325 个测试用例

## 使用建议

### 给 AI 测试人员

1. **阅读 TEST_CASES.md**
   - 完整的测试用例文档
   - 按功能模块组织
   - 包含所有输入参数和期望结果

2. **使用 test-cases.json**
   - 编写自动化测试脚本
   - 批量执行测试
   - 生成测试报告

### 给人工测试人员

1. **使用 test-cases.xlsx**
   - 在 Excel 中打开
   - 使用筛选功能定位测试用例
   - 记录测试结果

2. **使用 test-cases.csv**
   - 导入到 Jira、TestRail 等测试管理工具
   - 与团队协作跟踪测试进度

## 测试执行流程

### 1. 准备环境
- 启动 Cocos Creator 编辑器
- 加载 aura-for-cocos 插件
- 确认 Bridge 状态为 Online

### 2. 执行测试
- 按照测试用例的输入参数发送请求
- 记录实际返回结果
- 对比期望结果

### 3. 记录结果
- 在 Excel 或 CSV 中标记测试状态：
  - ✅ 通过
  - ❌ 失败
  - ⚠️ 部分通过
  - 🔄 待测试
  - ⏭️ 跳过

### 4. 报告问题
- 记录失败的测试用例 ID
- 描述实际结果与期望结果的差异
- 附加错误日志或截图

## 自动化测试执行

### 运行自动化测试

现在你可以**直接运行**这些测试用例了！

```bash
# 1. 确保 Cocos Creator 编辑器已启动
# 2. 确保 aura-for-cocos 插件已加载
# 3. 运行自动化测试
node scripts/run-auto-tests.mjs
```

### 测试脚本功能

✅ **自动连接** - 自动获取 Bridge 认证 Token
✅ **智能跳过** - 自动跳过需要实际 UUID 或危险操作的测试
✅ **彩色输出** - 清晰的测试结果展示
✅ **详细报告** - 生成 JSON 格式的测试报告
✅ **错误汇总** - 失败测试的详细信息
✅ **性能统计** - 每个测试的执行时间

### 测试报告

测试完成后会生成 `test-report.json`，包含：
- 测试统计（总数、通过、失败、跳过）
- 每个测试的详细结果
- 失败测试的错误信息
- 执行时间戳

### 自定义配置

可以通过环境变量自定义 Bridge URL：

```bash
# 使用自定义端口
BRIDGE_URL=http://127.0.0.1:7780 node scripts/run-auto-tests.mjs
```

## 重新生成测试用例文件

如果需要重新生成测试用例文件，运行以下脚本：

```bash
# 1. 从 HTML 提取数据
node scripts/extract-test-cases.js

# 2. 生成 Excel 表格
python scripts/create-test-table.py

# 3. 生成 Markdown 文档
python scripts/create-test-markdown.py

# 4. 生成 CSV 表格
python scripts/create-test-csv.py
```

## 注意事项

1. **UUID 占位符**: 测试用例中的 `<uuid>`, `<node-uuid>` 等需要替换为实际的节点 UUID
2. **路径占位符**: `db://assets/...` 路径需要根据实际项目调整
3. **危险操作**: 带有 `confirmDangerous:true` 的操作需要谨慎执行
4. **依赖关系**: 某些测试用例依赖于前置条件（如先创建节点再操作）

## 联系方式

如有问题，请联系：
- **作者**: jiangking
- **邮箱**: jiangkingwelcome@vip.qq.com
