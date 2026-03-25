# 交互式测试计划使用说明

## 文件

- `tests/interactive-test-plan.html`
- `tests/interactive-test-plan.css`
- `tests/interactive-test-plan.app.js`
- `tests/interactive-test-plan.data.js`

## 怎么打开

1. 直接双击打开 `tests/interactive-test-plan.html`
2. 推荐用 Edge 或 Chrome
3. 页面会自动读取同目录下的 `interactive-test-plan.data.js`

## 能做什么

- 查看完整测试计划和阶段分布
- 明确区分社区版与 Pro / 扩展测试范围
- 同时记录 AI 测试结果和人工测试结果
- 查看当前源码里“给 AI 的 tool / action 描述”，并附带中文翻译
- 自然语言测试用例会按“AI 指令 / 适用场景 / 操作方式 / 验证重点 / MCP 调用 / 原始参数”结构化展示
- 为每条用例填写问题、责任人、问题单、复测结果
- 自动统计完成率、失败数和问题汇总
- 自动保存在浏览器本地
- 保存本地 JSON / 导出 CSV
- 导入之前导出的 JSON 继续填写

## 刷新测试数据

如果 `tests/test-cases.json` 或 `tests/test-report.json` 更新了，在仓库根目录执行：

```powershell
node scripts/generate-interactive-test-plan.mjs
```

这会重新生成：

```text
tests/interactive-test-plan.data.js
```

## 说明

- 当前页面预填的是 `tests/test-report.json` 里的 AI 基线结果
- 用例会明确标注 `社区版` 或 `Pro / 扩展`
- 人工结果默认是 `待测`
- 页面填写内容保存在浏览器 `localStorage` 中
- 点击“保存本地 JSON”可以把当前填写结果保存成单独的 `.json` 文件
- 如果浏览器不支持本地文件保存 API，会自动退回为普通下载
- 如果你换浏览器或清缓存，建议先保存一份 JSON 备份
