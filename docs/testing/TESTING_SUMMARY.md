# ✅ 测试用例导出完成

## 📦 生成的文件

### 1. 测试数据文件（在 `tests/` 目录）

| 文件 | 大小 | 用途 |
|------|------|------|
| `test-cases.json` | 90KB | 原始测试数据，供自动化测试使用 |
| `test-cases.xlsx` | 29KB | Excel 表格，适合人工测试 |
| `test-cases.csv` | 50KB | CSV 格式，可导入测试管理工具 |

### 2. 文档文件（在根目录）

| 文件 | 大小 | 用途 |
|------|------|------|
| `TEST_CASES.md` | 70KB | Markdown 格式，适合 AI 阅读 |
| `TEST_CASES_README.md` | 5KB | 使用说明文档 |
| `QUICK_START_TESTING.md` | 3.4KB | 快速开始指南 |

### 3. 脚本文件（在 `scripts/` 目录）

| 文件 | 用途 |
|------|------|
| `extract-test-cases.js` | 从 HTML 提取测试用例 |
| `create-test-table.py` | 生成 Excel 表格 |
| `create-test-markdown.py` | 生成 Markdown 文档 |
| `create-test-csv.py` | 生成 CSV 文件 |
| `run-auto-tests.mjs` | **自动化测试执行器** ⭐ |

## 🚀 快速开始

### 方式 1：自动化测试（推荐）

```bash
# 一键运行所有可执行的测试
node scripts/run-auto-tests.mjs
```

**特点**：
- ✅ 自动连接 Bridge
- ✅ 智能跳过需要实际数据的测试
- ✅ 彩色输出，清晰易读
- ✅ 生成详细的 JSON 测试报告
- ✅ 显示每个测试的执行时间

### 方式 2：手动测试

1. 打开 `tests/test-cases.xlsx`
2. 使用筛选功能定位测试用例
3. 手动执行并记录结果

### 方式 3：AI 测试

将 `TEST_CASES.md` 提供给 AI，让它：
- 阅读测试用例
- 理解输入参数和期望结果
- 执行测试并验证

## 📊 测试统计

- **总测试用例数**: 325 个
- **可自动执行**: ~185 个（57%）
- **需要实际数据**: ~140 个（43%）

### 按工具分类

| 工具 | 测试数量 |
|------|---------|
| bridge_status | 2 |
| scene_query | 100+ |
| scene_operation | 150+ |
| asset_operation | 50+ |
| editor_control | 20+ |

## 🎯 测试覆盖范围

### ✅ 可以直接运行的测试

- Bridge 连接状态检查
- 场景树查询（默认参数）
- 场景统计信息
- 组件列表查询
- 资源列表查询
- 编辑器状态查询

### ⏭️ 需要跳过的测试

- 需要实际节点 UUID 的操作
- 危险操作（删除、清空等）
- 需要外部文件路径的操作

## 📝 测试报告示例

运行测试后会生成 `tests/test-report.json`：

```json
{
  "total": 325,
  "passed": 180,
  "failed": 5,
  "skipped": 140,
  "startTime": "2026-03-09T14:20:00.000Z",
  "endTime": "2026-03-09T14:22:30.000Z",
  "errors": [
    {
      "id": 42,
      "tool": "scene_operation",
      "action": "create_node",
      "title": "创建空节点",
      "error": "HTTP 500: Internal Server Error"
    }
  ]
}
```

## 🔧 自定义测试

### 修改 Bridge URL

```bash
BRIDGE_URL=http://127.0.0.1:7780 node scripts/run-auto-tests.mjs
```

### 只测试特定工具

编辑 `scripts/run-auto-tests.mjs`：

```javascript
// 只测试 scene_query
for (const [tool, cases] of Object.entries(grouped)) {
  if (tool !== 'scene_query') continue;
  // ...
}
```

### 添加自定义验证

在 `runTest` 函数中添加：

```javascript
// 验证返回的节点数量
if (action === 'tree') {
  const nodes = result.result.content[0].text;
  expect(nodes).toContain('Scene');
}
```

## 🐛 故障排查

### 无法连接到 Bridge

**解决方案**：
1. 启动 Cocos Creator 编辑器
2. 打开任意项目
3. 确认插件面板显示 "Online"

### 大量测试失败

**可能原因**：
- 场景为空（没有节点）
- 编辑器版本不兼容
- Bridge 版本过旧

**解决方案**：
1. 创建一个包含基本节点的测试场景
2. 更新 Bridge 到最新版本

## 📚 相关文档

- [TEST_CASES.md](TEST_CASES.md) - 完整测试用例列表
- [TEST_CASES_README.md](TEST_CASES_README.md) - 详细使用说明
- [QUICK_START_TESTING.md](QUICK_START_TESTING.md) - 快速开始指南

## 🎉 总结

现在你有了：

1. ✅ **325 个详细的测试用例**
2. ✅ **可直接运行的自动化测试脚本**
3. ✅ **多种格式的测试文档**（Excel、Markdown、CSV）
4. ✅ **完整的测试报告生成**
5. ✅ **清晰的使用文档**

**立即开始测试**：

```bash
node scripts/run-auto-tests.mjs
```

祝测试顺利！🚀
