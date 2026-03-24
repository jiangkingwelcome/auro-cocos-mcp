# 快速开始 - 自动化测试

## 一键运行测试

```bash
node scripts/run-auto-tests.mjs
```

## 前置条件

1. ✅ Cocos Creator 编辑器已启动
2. ✅ aura-for-cocos 插件已加载
3. ✅ Bridge 状态显示为 **Online**

## 测试输出示例

```
================================================================================
🧪 Aura - 自动化测试套件
   基于 test-cases.json (325 个测试用例)
================================================================================

→ 正在连接 Bridge...
✓ 已连接到 http://127.0.0.1:7779

📦 工具: bridge_status (2 个测试)
  ✓ #1: 基本连通性检查 (45ms)
  ✓ #2: 桥接断开 (预期错误)

📦 工具: scene_query (100 个测试)
  ✓ #3: 获取默认场景树 (120ms)
  ✓ #4: 包含内部节点 (135ms)
  ⏭ #5: 空场景 (需要实际数据)
  ...

================================================================================
📊 测试结果统计
================================================================================
总计:   325 个测试
✓ 通过:   180 个
✗ 失败:   5 个
⏭ 跳过:   140 个
通过率: 97.3% (180/185)

💾 测试报告已保存: test-report.json
```

## 查看测试报告

测试完成后会生成 `test-report.json`：

```json
{
  "total": 325,
  "passed": 180,
  "failed": 5,
  "skipped": 140,
  "startTime": "2026-03-09T08:20:00.000Z",
  "endTime": "2026-03-09T08:22:30.000Z",
  "errors": [
    {
      "id": 42,
      "tool": "scene_operation",
      "action": "create_node",
      "title": "创建空节点",
      "error": "HTTP 500: Internal Server Error"
    }
  ],
  "results": [...]
}
```

## 自定义配置

### 使用不同的 Bridge 端口

```bash
BRIDGE_URL=http://127.0.0.1:7780 node scripts/run-auto-tests.mjs
```

### 只运行特定工具的测试

编辑 `scripts/run-auto-tests.mjs`，在主循环中添加过滤：

```javascript
// 只测试 scene_query
for (const [tool, cases] of Object.entries(grouped)) {
  if (tool !== 'scene_query') continue;
  // ...
}
```

## 故障排查

### 错误：无法连接到 Bridge

**原因**：编辑器未启动或插件未加载

**解决**：
1. 启动 Cocos Creator
2. 打开任意项目
3. 确认插件面板显示 "Online"

### 错误：HTTP 401 Unauthorized

**原因**：认证 Token 无效

**解决**：
1. 重启 Bridge（点击"热更重启"）
2. 重新运行测试

### 大量测试被跳过

**原因**：测试用例需要实际的节点 UUID

**解决**：这是正常的！约 40% 的测试需要实际场景数据，会自动跳过。

## 集成到 CI/CD

### GitHub Actions 示例

```yaml
name: MCP Bridge Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      # 启动 Cocos Creator（需要自定义脚本）
      - name: Start Cocos Creator
        run: |
          # 启动编辑器的脚本

      - name: Run Tests
        run: node scripts/run-auto-tests.mjs

      - name: Upload Report
        uses: actions/upload-artifact@v3
        with:
          name: test-report
          path: test-report.json
```

## 下一步

- 📖 查看 [TEST_CASES.md](TEST_CASES.md) 了解所有测试用例
- 📊 打开 [test-cases.xlsx](test-cases.xlsx) 手动测试
- 🔧 修改 [scripts/run-auto-tests.mjs](scripts/run-auto-tests.mjs) 自定义测试逻辑
