# Aura 高级防护与稳定性增强方案（备用）

> **文档说明：**
> 目前我们的 MCP Bridge 架构（漏斗模型 + 宏指令 + 状态感知）已经具备了极其强壮的基础稳定性。本备用方案用于在未来应对更大规模、更复杂的 AI 操作场景时，作为进一步增强 MCP 侧安全性和容错能力的演进方向。

为了防止 AI 的“幻觉”或者“逻辑死胡同”导致 MCP Server 崩溃或破坏游戏工程文件，我们设计了以下**“四层防护网”**架构，供未来按需实装。

---

## 1. 输入层防护（Input Guard）—— 【防恶意与防幻觉】

当 AI 发起工具调用请求时，第一把关口。

*   **严格的 Schema 校验及阻断**
    *   **问题**：AI 有时会不遵循 JSON Schema 提供非法的参数结构，甚至超长字符串。
    *   **方案**：引入 `Zod` 或类似校验库，在收到 `callTool` 请求的第一时间进行强校验。
    *   **执行**：一旦参数类型、必填项、或格式（如要求 UUID 但传了纯文本）不符合预期，MCP 侧**直接拦截**并向 AI 抛出结构化的格式化建议（如：`"Field 'nodeId' expected a valid UUID, got '123'"`），坚决不让脏数据透传至 Cocos Editor 从而引发底层的不可控报错。
*   **沙盒边界与路径越权拦截**
    *   **问题**：AI 可能会因为幻觉产生类似于 `../../Windows/System32` 或试图修改非项目目录资产的操作。
    *   **方案**：在 Node 桥接层封装全局的 `PathValidator`。
    *   **执行**：所有的文件、资源操作会被强制锁定在 `assets/` 或配置的安全沙箱目录内。若发生越权调用，记录警告级别日志并向 AI 返回操作拒绝。

## 2. 流量层防护（Traffic Guard）—— 【防卡死与死循环】

当 AI 陷入逻辑错误自我尝试修复时，控制其请求的节奏。

*   **工具级别的频率限制（Rate Limiting & Throttling）**
    *   **问题**：AI 可能在 1 秒内连续发送数十次创建节点的请求（死循环）。
    *   **方案**：实现简单的令牌桶算法。
    *   **执行**：限制单个高危/耗时工具（如 `RefreshAsset` 或 `BuildProject`）的调用频率（例如：1次/5秒）。触发限流时返回温和提示（如：`"Editor is busy processing previous request, please modify your workflow rhythm."`）让 AI 暂停重试而不是挂起连接。
*   **状态同步与并发锁（Mutex Locks）**
    *   **问题**：并发请求同时修改同一个 Scene/Prefab 会导致状态不一致。
    *   **方案**：对于涉及到文件 I/O 或场景序列化修改的操作，引入读写互斥锁。
    *   **执行**：保证编辑器的内部状态修改是串行化并且安全的。

## 3. 执行层防护（Execution Guard）—— 【防破坏性盲操】

进入 Cocos Editor 侧之前的拦截与控制机制。

*   **危险操作隔离与 Dry Run（沙盒试运行）**
    *   **问题**：AI 自作主张执行诸如 `DeleteNode` 或大规模 `ReplaceScript` 导致项目结构受损。
    *   **方案**：对不同 Tool 进行权限等级划分（`Read-Only`, `Write-Safe`, `Destructive`）。
    *   **执行**：未来引入 Dry Run 模式，对于 `Destructive` 级别的操作，要求 AI 提供二次确认参数，或者通过插件弹窗提示用户“AI 即将删除关键预制体，是否允许？”。
*   **超长任务熔断机制（Timeout Fallback）**
    *   **问题**：部分查询或加载耗时过长，导致 AI 等待超时直接判定 MCP 掉线。
    *   **方案**：在发送给 Editor 的 IPC 消息层增加绝对超时限制（例如 10 秒）。
    *   **执行**：到时无响应主动砍掉长链接等待，并向 AI 优雅返回任务进行中或超时的响应包，防止 MCP WebSocket/Stdio 通道堵塞。

## 4. 恢复层防护（Recovery Guard）—— 【全局防崩与 AI 辅导】

作为最后的底线，确保桥接器和 AI 交互的持续性。

*   **全局异常边界（Global Error Boundary）**
    *   **问题**：没覆盖到的空指针或 Socket 断开导致 MCP Node 进程挂掉，用户体验极差。
    *   **方案**：在事件的最外层（Event Loop 或 Stdio 层）使用 `uncaughtException` 等全面兜底。
    *   **执行**：所有原生报错将被转换为包裹好的 JSON 错误对象返回，让 AI 知道出了内部问题，而不是直接看到进程崩溃的错误码。
*   **附带“操作建议”的智能错误引导（AI Coaching）**
    *   **问题**：AI 收到简单的 `"Error: Component not found"` 后可能会像无头苍蝇一样持续用不同的名字重试。
    *   **方案**：在抛出错误的同时，给 AI “开小灶”。
    *   **执行**：不仅仅向 AI 报 Error，而是在 Error message 内包含解决建议。例如：`"Error: Component 'MyScript' not found on this node. Tip: Please use 'GetNodeInfo' tool first to check the actual active components."`，以此引导 AI 走向正确的操作流。
