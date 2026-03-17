// @ts-nocheck
"use strict";
const EXTENSION_NAME = 'aura-for-cocos';
const EXTENSION_VERSION = '1.0.14';
const POLL_INTERVAL = 3000;
const CONFIG_REQUEST_TIMEOUT_MS = 10000;

let pollTimer = null;

module.exports = Editor.Panel.define({
  template: /* html */ `\n
    <div class="mcp-panel" id="app" style="background:#0a0a14;">

      <!-- Holographic Rainbow Top Bar -->
      <div class="holo-bar"></div>

      <!-- Header -->
      <div class="panel-header">
        <div class="logo-outer"><div class="logo-inner"><img class="logo-icon" src="data:image/png;base64,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" /></div></div>
        <span class="brand-txt">Aura</span>
        <div class="holo-badge" id="holoBadge"><div class="holo-badge-inner" data-i18n="badge.community">Community</div></div>
      </div>

      <!-- Tab Navigation -->
      <div class="mcp-tabs-header">
        <div class="mcp-tab active" data-target="tabStatus" data-i18n="tab.status">状态</div>
        <div class="mcp-tab" data-target="tabControl" data-i18n="tab.control">控制</div>
        <div class="mcp-tab" data-target="tabConfig" data-i18n="tab.config">互联</div>
        <div class="mcp-tab" data-target="tabSettings" data-i18n="tab.settings">设置</div>
        <div class="mcp-tab" data-target="tabGuide" data-i18n="tab.guide">指南</div>
        <div class="tab-indicator"></div>
      </div>

      <!-- Tab Content Container -->
      <div class="mcp-tabs-container">

        <!-- 1. Status Tab -->
        <div class="mcp-tab-content active" id="tabStatus">

          <!-- Status banner -->
          <div class="holo-status-row" id="statusBanner">
            <div id="statusDot" class="status-dot offline"></div>
            <span id="statusText" class="status-lbl status-text offline">Offline</span>
            <span id="endpointValue" class="status-port"></span>
          </div>

          <!-- 4-card num grid (bentoGrid for JS show/hide + loading) -->
          <div class="nums-grid loading" id="bentoGrid">
            <div class="num-card nc-blue">
              <div class="num-lbl" data-i18n="status.tools">TOOLS</div>
              <div class="num-val" id="toolCount">-</div>
              <div class="num-sub">exposed modules</div>
            </div>
            <div class="num-card nc-rose">
              <div class="num-lbl" data-i18n="status.actions">ACTIONS</div>
              <div class="num-val" id="totalActionCount">-</div>
              <div class="num-sub">callable by AI</div>
            </div>
            <div class="num-card nc-purple">
              <div class="num-lbl" data-i18n="status.clients">CLIENTS</div>
              <div class="num-val" id="connectionCount">-</div>
              <div class="num-sub">connected</div>
            </div>
            <div class="num-card nc-teal">
              <div class="num-lbl" data-i18n="status.port">PORT</div>
              <div class="num-val" id="portValue">-</div>
              <div class="num-sub"><code>127.0.0.1</code></div>
            </div>
          </div>

          <!-- Project card (bottom) -->
          <div class="project-card">
            <div class="proj-header">
              <div class="proj-name" id="projectName">-</div>
              <span class="proj-ver" id="editorVersion">-</span>
            </div>
            <div class="proj-details">
              <div class="proj-row">
                <span class="proj-key">Path</span>
                <span class="proj-val" id="projectPath">-</span>
              </div>
              <div class="proj-row">
                <span class="proj-key">Uptime</span>
                <span class="proj-val proj-uptime" id="uptime">-</span>
              </div>
            </div>
          </div>

          <div class="empty-state" id="emptyState" style="display:none;">
            <div class="empty-state-icon">⏸</div>
            <div class="empty-state-text">服务未启动<br><span style="font-size:11px;opacity:0.5;">请前往「控制」Tab 启动 Aura 服务</span></div>
          </div>

        </div>

        <!-- 2. Control Tab -->
        <div class="mcp-tab-content flex-column" id="tabControl">
          <div class="control-header">
            <h3 data-i18n="ctrl.title">服务管理</h3>
            <p>当前服务状态：<span id="ctrlStatusLabel" style="color:#f43f5e;font-weight:600;">已停止</span></p>
          </div>
          <div class="button-grid">
            <button id="startBtn" class="btn btn-success" data-i18n="ctrl.start">▶ 启动服务</button>
            <button id="stopBtn" class="btn btn-danger" data-i18n="ctrl.stop">■ 停止服务</button>
          </div>
          <button id="restartBtn" class="btn btn-holo-btn full-width" data-i18n="ctrl.restart">↻ 重启服务</button>

          <div class="divider"></div>

          <div class="control-header">
            <h3 data-i18n="ctrl.tools_title">工具模块配置</h3>
            <p data-i18n="ctrl.tools_desc">关闭的工具 AI 将完全无法感知，实时生效。</p>
          </div>
          <div id="toolToggleList" class="tool-toggle-list"></div>
        </div>

        <!-- 3. IDE Config Tab -->
        <div class="mcp-tab-content flex-column" id="tabConfig">
          <div class="control-header">
            <h3 data-i18n="cfg.title">IDE 互联配置</h3>
            <p data-i18n="cfg.desc">一键将 Cocos 环境注入至主流 AI 编程助手。</p>
          </div>
          <div class="ide-status-list">
            <div class="ide-card" id="ideCursor">
              <div class="ide-info"><span class="ide-title">Cursor</span><span class="ide-status" id="statusCursor">检测中...</span></div>
              <button class="btn config-ide-btn" data-ide="cursor">注入配置</button>
            </div>
            <div class="ide-card" id="ideWindsurf">
              <div class="ide-info"><span class="ide-title">Windsurf</span><span class="ide-status" id="statusWindsurf">检测中...</span></div>
              <button class="btn config-ide-btn" data-ide="windsurf">注入配置</button>
            </div>
            <div class="ide-card" id="ideClaude">
              <div class="ide-info"><span class="ide-title">Claude Desktop</span><span class="ide-status" id="statusClaude">检测中...</span></div>
              <button class="btn config-ide-btn" data-ide="claude">注入配置</button>
            </div>
            <div class="ide-card" id="ideTrae">
              <div class="ide-info"><span class="ide-title">Trae</span><span class="ide-status" id="statusTrae">检测中...</span></div>
              <button class="btn config-ide-btn" data-ide="trae">注入配置</button>
            </div>
            <div class="ide-card" id="ideKiro">
              <div class="ide-info"><span class="ide-title">Kiro AI IDE</span><span class="ide-status" id="statusKiro">检测中...</span></div>
              <button class="btn config-ide-btn" data-ide="kiro">注入配置</button>
            </div>
            <div class="ide-card" id="ideAntigravity">
              <div class="ide-info"><span class="ide-title">Antigravity</span><span class="ide-status" id="statusAntigravity">检测中...</span></div>
              <button class="btn config-ide-btn" data-ide="antigravity">注入配置</button>
            </div>
            <div class="ide-card" id="ideGeminiCli">
              <div class="ide-info"><span class="ide-title">Gemini CLI</span><span class="ide-status" id="statusGeminiCli">检测中...</span></div>
              <button class="btn config-ide-btn" data-ide="gemini-cli">注入配置</button>
            </div>
            <div class="ide-card" id="ideCodex">
              <div class="ide-info"><span class="ide-title">OpenAI Codex</span><span class="ide-status" id="statusCodex">检测中...</span></div>
              <button class="btn config-ide-btn" data-ide="codex">注入配置</button>
            </div>
            <div class="ide-card" id="ideClaudeCode">
              <div class="ide-info"><span class="ide-title">Claude Code</span><span class="ide-status" id="statusClaudeCode">检测中...</span></div>
              <button class="btn config-ide-btn" data-ide="claude-code">注入配置</button>
            </div>
            <div class="ide-card" id="ideCodebuddy">
              <div class="ide-info"><span class="ide-title">CodeBuddy (腾讯)</span><span class="ide-status" id="statusCodebuddy">检测中...</span></div>
              <button class="btn config-ide-btn" data-ide="codebuddy">注入配置</button>
            </div>
            <div class="ide-card" id="ideComate">
              <div class="ide-info"><span class="ide-title">Comate (百度)</span><span class="ide-status" id="statusComate">检测中...</span></div>
              <button class="btn config-ide-btn" data-ide="comate">注入配置</button>
            </div>
          </div>
          <div class="config-result" id="configResult" style="display:none;">
            <span id="configIcon"></span>
            <span id="configMessage"></span>
          </div>
          <div class="info-box">
            本操作将当前端点写入 IDE 的 MCP 配置文件，您需要在目标 IDE 中刷新或重启生效。
          </div>
        </div>

        <!-- 4. Settings Tab -->
        <div class="mcp-tab-content flex-column" id="tabSettings">
          <div class="control-header">
            <h3 data-i18n="settings.license_title">License 授权</h3>
            <p data-i18n="settings.license_desc">管理 Pro 版 License Key 激活状态。</p>
          </div>
          <div class="license-card" id="licenseCard">
            <div class="license-status" id="licenseStatusSection">
              <div class="license-badge" id="licenseBadge">
                <span class="license-edition" id="licenseEdition">Community</span>
                <span class="license-state community" id="licenseState">免费版</span>
              </div>
              <div class="license-detail" id="licenseDetail" style="display:none;">
                <span class="license-expiry" id="licenseExpiry"></span>
                <span class="license-owner" id="licenseOwner"></span>
              </div>
              <div class="license-error" id="licenseError" style="display:none;"></div>
            </div>
            <div class="license-input-row">
              <input type="text" id="licenseKeyInput" class="license-input" placeholder="COCOS-PRO-XXXXXXXX-XXXXXXXX-XXXXXXXX" spellcheck="false" autocomplete="off" />
              <button id="activateLicenseBtn" class="btn btn-primary btn-activate" data-i18n="settings.activate">激活</button>
            </div>
            <div class="license-hint" data-i18n="settings.license_hint">输入 License Key 后点击激活，需要重启插件使 Pro 工具生效。</div>
          </div>

          <div class="divider"></div>

          <div class="control-header">
            <h3 data-i18n="settings.title">安全与性能</h3>
            <p data-i18n="settings.desc">配置 MCP Bridge 的安全策略和性能参数。</p>
          </div>
          <div class="settings-card">
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label" data-i18n="settings.rate_limit">Rate Limit (req/min)</span>
                <span class="setting-hint" data-i18n="settings.rate_limit_hint">每分钟允许的最大请求数 (10-10000)</span>
              </div>
              <input type="number" id="settingRateLimit" class="setting-input" min="10" max="10000" step="10" value="240" />
            </div>
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label" data-i18n="settings.loopback">Localhost Restrict</span>
                <span class="setting-hint" data-i18n="settings.loopback_hint">开启时仅允许 127.0.0.1 访问</span>
              </div>
              <input type="checkbox" id="settingLoopback" class="tool-toggle" checked />
            </div>
            <div class="setting-warn" id="loopbackWarn" style="display:none;" data-i18n="settings.warn_loopback">⚠ 警告: 关闭回环限制将允许外部网段访问，请确保网络安全。</div>
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label" data-i18n="settings.body_limit">Max Payload Size</span>
                <span class="setting-hint" data-i18n="settings.body_limit_hint">单次请求/返回的最大数据体积</span>
              </div>
              <select id="settingBodyLimit" class="setting-select">
                <option value="65536">64 KB</option>
                <option value="262144">256 KB</option>
                <option value="524288">512 KB</option>
                <option value="1048576" selected>1 MB</option>
                <option value="2097152">2 MB</option>
                <option value="5242880">5 MB</option>
                <option value="10485760">10 MB</option>
                <option value="52428800">50 MB</option>
              </select>
            </div>
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label" data-i18n="settings.rollback">自动回滚</span>
                <span class="setting-hint" data-i18n="settings.rollback_hint">复杂原子操作失败时自动恢复场景</span>
              </div>
              <input type="checkbox" id="settingRollback" class="tool-toggle" checked />
            </div>
          </div>
          <div class="button-grid" style="margin-top:12px;">
            <button id="saveSettingsBtn" class="btn btn-primary" data-i18n="settings.save">保存配置</button>
            <button id="resetSettingsBtn" class="btn" data-i18n="settings.reset">恢复默认</button>
          </div>
          <div class="config-result" id="settingsResult" style="display:none;">
            <span id="settingsIcon"></span>
            <span id="settingsMessage"></span>
          </div>
        </div>

        <!-- 5. Guide Tab -->
        <div class="mcp-tab-content flex-column" id="tabGuide">
          <div class="control-header">
            <h3 data-i18n="guide.title">交互指南</h3>
            <p data-i18n="guide.desc">建议使用如下对话模式驱动引擎工作。</p>
          </div>
          <div class="guide-steps">
            <div class="guide-step">
              <div class="step-number">1</div>
              <div class="step-content">
                <div class="step-title" data-i18n="guide.step1_title">确认服务连通性</div>
                <div class="step-desc" data-i18n="guide.step1_desc">在 IDE 中检查 MCP Status，或提问 &quot;请测试一下 Cocos 桥接状态&quot;。</div>
              </div>
            </div>
            <div class="guide-step">
              <div class="step-number">2</div>
              <div class="step-content">
                <div class="step-title" data-i18n="guide.step2_title">选定操作目标</div>
                <div class="step-desc" data-i18n="guide.step2_desc">若要修改现有节点，请先在层级树选中，再对 AI 说 &quot;把当前选中的节点...&quot;。</div>
              </div>
            </div>
            <div class="guide-step">
              <div class="step-number">3</div>
              <div class="step-content">
                <div class="step-title" data-i18n="guide.step3_title">检查执行结果</div>
                <div class="step-desc" data-i18n="guide.step3_desc">AI 拥有读写双向能力，修改后编辑器内实时刷新，效果不对可说 &quot;撤销刚才的修改&quot;。</div>
              </div>
            </div>
          </div>
          <div class="divider"></div>
          <div class="control-header">
            <h3 data-i18n="guide.examples_title">示例提示词</h3>
          </div>
          <div class="prompt-list">
            <button class="prompt-card">
              <span class="prompt-tag" data-i18n="guide.tag_scene">场景查询</span>
              <div class="prompt-text" data-i18n="guide.prompt1">帮我分析当前场景的根节点结构，列出所有 Canvas 下的子节点。</div>
              <div class="prompt-copy" title="复制">⎘</div>
            </button>
            <button class="prompt-card">
              <span class="prompt-tag" data-i18n="guide.tag_create">实例创建</span>
              <div class="prompt-text" data-i18n="guide.prompt2">在当前选中的节点下，创建一个名为 &quot;LoginButton&quot; 的按钮，并添加 Widget 居中。</div>
              <div class="prompt-copy" title="复制">⎘</div>
            </button>
          </div>
          <div class="info-box guide-tips">
            <div class="tips-title" data-i18n="guide.tips_title">开发建议</div>
            <ul class="tips-list">
              <li data-i18n="guide.tip1">尽量遵循单指令单操作，避免一条对话发布多个复杂引擎改动。</li>
              <li data-i18n="guide.tip2">若 AI 提示组件未导入，请先确保项目中已存在继承自 cc.Component 的脚本。</li>
            </ul>
          </div>
        </div>

      </div><!-- /mcp-tabs-container -->

      <!-- Footer -->
      <div class="mcp-footer">
        <span class="footer-text">v<span id="versionText"></span></span>
        <div class="footer-actions">
          <button id="langBtn" class="ghost-btn">中 / EN</button>
          <button id="refreshBtn" class="ghost-btn" data-i18n="footer.sync">同步状态</button>
        </div>
      </div>

    </div>
\n  `,

  style: /* css */ `\n
    html, body { background: #0a0a14 !important; margin: 0; padding: 0; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :host { background: #0a0a14; display: block; height: 100%; }

    /* ===== AURA HOLOGRAPHIC THEME ===== */
    :root {
      --bg-base:      rgba(12, 12, 24, 0.92);
      --bg-panel:     rgba(255,255,255,0.018);
      --bg-hover:     rgba(255,255,255,0.038);
      --border-color: rgba(255,255,255,0.07);
      --border-hover: rgba(255,255,255,0.13);
      --border-input: rgba(255,255,255,0.1);
      --text-main:    #e2e8f0;
      --text-muted:   rgba(255,255,255,0.32);
      --text-highlight: #ffffff;
      --accent-color: #ffffff;
      --bg-input:     rgba(0,0,0,0.45);
      --danger-color: #f43f5e;
      --success-color: #34d399;
      --mono-color:   rgba(255,255,255,0.5);
      --card-radius:  10px;
    }

    /* ===== AURA HOLOGRAPHIC THEME ===== */

    .mcp-panel {
      color: var(--text-main);
      font-size: 13px;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      height: 100%; display: flex; flex-direction: column;
      background: rgba(10, 10, 20, 0.97);
      user-select: none; position: relative; overflow: hidden;
    }

    /* Holographic rainbow top bar */
    .holo-bar {
      height: 2px; width: 100%; flex-shrink: 0;
      background: linear-gradient(90deg, #ff0080, #ff8c00, #40e0d0, #7b2ff7, #ff0080);
      background-size: 300%;
      animation: holo-shift 4s linear infinite;
    }
    @keyframes holo-shift { 0% { background-position: 0%; } 100% { background-position: 300%; } }

    /* Panel header with logo */
    .panel-header {
      display: flex; align-items: center; padding: 12px 16px; gap: 10px;
      background: rgba(255,255,255,0.016);
      border-bottom: 1px solid rgba(255,255,255,0.04);
      flex-shrink: 0;
    }
    .logo-outer {
      width: 32px; height: 32px; border-radius: 8px;
      overflow: hidden; flex-shrink: 0;
    }
    .logo-inner {
      width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
    }
    .logo-icon { width: 100%; height: 100%; object-fit: cover; display: block; }
    .brand-txt { font-size: 14px; font-weight: 700; color: #fff; letter-spacing: -0.3px; }
    .brand-for { font-size: 11px; color: rgba(255,255,255,0.28); margin-left: 4px; }
    .holo-badge {
      margin-left: auto; font-size: 10px; font-weight: 700; letter-spacing: 1px;
      color: #c4b5fd; position: relative;
    }
    .holo-badge::before {
      content: ''; position: absolute; inset: -1px; border-radius: 20px;
      background: linear-gradient(135deg, #ff0080, #7b2ff7, #40e0d0);
      z-index: -1; animation: holo-shift 4s linear infinite; background-size: 300%;
    }
    .holo-badge-inner { background: #0d0d18; padding: 3px 9px; border-radius: 18px; position: relative; z-index: 1; }

    /* Tab navigation */
    .mcp-tabs-header {
      display: flex; background: rgba(0,0,0,0.2);
      border-bottom: 1px solid rgba(255,255,255,0.04);
      flex-shrink: 0; position: relative; padding: 8px 16px 0; gap: 2px;
    }
    .mcp-tab {
      flex: 1; text-align: center; padding: 8px 4px; cursor: pointer;
      font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.28);
      border-radius: 7px; transition: all 0.2s;
    }
    .mcp-tab:hover { color: rgba(255,255,255,0.6); background: rgba(255,255,255,0.04); }
    .mcp-tab.active { color: #fff; background: rgba(255,255,255,0.07); }
    .tab-indicator {
      position: absolute; bottom: -1px; height: 2px;
      background: linear-gradient(90deg, #7b2ff7, #40e0d0);
      background-size: 200%; animation: holo-shift 4s linear infinite;
      transition: left 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    /* Content area */
    .mcp-tabs-container {
      flex: 1; padding: 14px 16px; overflow-y: auto;
    }
    .mcp-tabs-container::-webkit-scrollbar { width: 3px; }
    .mcp-tabs-container::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }

    .mcp-tab-content { display: none; flex-direction: column; gap: 12px; }
    .mcp-tab-content.active { display: flex; animation: fadeUp 0.25s ease both; }
    .mcp-tab-content.flex-column { flex-direction: column; }
    .mcp-tab-content.flex-column.active { display: flex; }

    @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes tabSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes valueFlash {
      0% { color: #fde047; text-shadow: 0 0 6px rgba(253,224,71,0.5); }
      100% { color: inherit; text-shadow: none; }
    }
    .value-changed { animation: valueFlash 0.6s ease-out; }

    /* Bento grid */
    .s3-bento { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .s3-tile {
      background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06);
      border-radius: 12px; padding: 14px; display: flex; flex-direction: column;
      transition: all 0.25s;
    }
    .s3-tile:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.12); transform: translateY(-1px); }
    .s3-tile.wide { grid-column: span 2; }
    .s3-tile-label {
      font-size: 10px; color: rgba(255,255,255,0.28); text-transform: uppercase;
      letter-spacing: 1.2px; margin-bottom: 8px; font-weight: 600;
    }
    .s3-tile-value {
      font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
      font-size: 28px; font-weight: 600; line-height: 1.1; letter-spacing: -1px; margin-bottom: 4px;
    }
    .val-blue { color: #93c5fd; }
    .val-teal { color: #5eead4; }
    .val-purple { color: #c4b5fd; }
    .val-amber { color: #fbbf24; }
    .val-green { color: #4ade80; }
    .val-white { color: #ffffff; }
    .s3-tile-sub {
      font-size: 11px; color: rgba(255,255,255,0.22); margin-top: auto;
      display: flex; align-items: center; gap: 6px;
    }
    .s3-tile-sub code {
      font-family: 'JetBrains Mono', monospace; font-size: 10px;
      background: rgba(255,255,255,0.06); padding: 2px 5px; border-radius: 4px;
      color: rgba(255,255,255,0.4);
    }
    .meta-chip {
      font-family: 'JetBrains Mono', monospace; font-size: 10px;
      padding: 2px 7px; border-radius: 5px;
      background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.06);
      color: rgba(255,255,255,0.35);
    }
    .status-dot {
      display: inline-block; width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
    }
    .status-dot.online {
      background: #34d399; box-shadow: 0 0 8px #34d399;
      animation: holoPulse 2s ease-in-out infinite;
    }
    .status-dot.offline { background: #f43f5e; }
    @keyframes holoPulse {
      0%,100% { box-shadow: 0 0 4px #34d399, 0 0 12px rgba(52,211,153,0.4); }
      50% { box-shadow: 0 0 2px #34d399, 0 0 4px rgba(52,211,153,0.15); }
    }
    .status-text.online { color: #34d399; font-weight: 600; }
    .status-text.offline { color: #f43f5e; }

    /* Section headers */
    .control-header { display: flex; flex-direction: column; gap: 4px; }
    .control-header h3 {
      font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.9); margin: 0;
      text-transform: uppercase; letter-spacing: 1px;
    }
    .control-header p { color: rgba(255,255,255,0.28); font-size: 12px; line-height: 1.5; margin: 0; }

    .divider { height: 1px; background: rgba(255,255,255,0.05); }

    /* Buttons */
    .btn {
      border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;
      padding: 9px 12px; font-size: 12.5px; font-weight: 600;
      color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.04);
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      gap: 6px; transition: all 0.2s; font-family: inherit;
    }
    .btn:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); color: #fff; }
    .btn:active { transform: scale(0.96); }
    .btn-primary { background: #fff; color: #000; border-color: #fff; font-weight: 700; }
    .btn-primary:hover { background: #e5e5e5; border-color: #e5e5e5; color: #000; }
    .btn-success { background: rgba(52,211,153,0.1); color: #34d399; border-color: rgba(52,211,153,0.25); }
    .btn-success:hover { background: rgba(52,211,153,0.2); border-color: rgba(52,211,153,0.45); }
    .btn-danger { background: rgba(244,63,94,0.1); color: #fda4af; border-color: rgba(244,63,94,0.25); }
    .btn-danger:hover { background: rgba(244,63,94,0.2); border-color: rgba(244,63,94,0.4); }
    .btn-restart, .btn-holo-btn {
      background: rgba(123,47,247,0.08); color: #a78bfa;
      border: 1px solid rgba(123,47,247,0.3); overflow: hidden; position: relative;
    }
    .btn-restart::before, .btn-holo-btn::before {
      content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
      background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent);
      transform: skewX(-20deg); transition: left 0.5s ease;
    }
    .btn-restart:hover::before, .btn-holo-btn:hover::before { left: 150%; }
    .btn-restart:hover, .btn-holo-btn:hover {
      background: rgba(123,47,247,0.16); border-color: rgba(123,47,247,0.5); color: #c4b5fd;
      box-shadow: 0 0 14px rgba(123,47,247,0.18);
    }
    .btn-disabled { opacity: 0.3; pointer-events: none; }
    .button-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .full-width { width: 100%; }

    /* IDE cards */
    .ide-status-list { display: flex; flex-direction: column; gap: 7px; }
    .ide-card {
      background: rgba(255,255,255,0.016); border: 1px solid rgba(255,255,255,0.05);
      border-radius: 9px; padding: 10px 14px;
      display: flex; align-items: center; justify-content: space-between;
      transition: all 0.2s;
    }
    .ide-card:hover { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.1); }
    .ide-info { display: flex; align-items: center; gap: 10px; }
    .ide-title { font-size: 12.5px; font-weight: 500; color: rgba(255,255,255,0.82); }
    .ide-status { font-size: 11px; color: rgba(255,255,255,0.25); }
    .ide-status.ready {
      color: #5eead4; background: rgba(64,224,208,0.07);
      border: 1px solid rgba(64,224,208,0.2); padding: 2px 8px; border-radius: 4px;
    }
    .ide-status.unready { color: rgba(255,255,255,0.22); }
    .config-ide-btn { padding: 6px 12px !important; font-size: 11px !important; }

    /* Toggle */
    .tool-toggle {
      appearance: none; -webkit-appearance: none; width: 38px; height: 21px; flex-shrink: 0;
      background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 21px; position: relative; cursor: pointer; transition: 0.3s;
    }
    .tool-toggle::after {
      content: ''; position: absolute; top: 2px; left: 2px; width: 15px; height: 15px;
      background: rgba(255,255,255,0.35); border-radius: 50%;
      transition: 0.3s cubic-bezier(0.5,-0.5,0.5,1.5);
    }
    .tool-toggle:checked {
      background: linear-gradient(90deg, #7b2ff7, #40e0d0); border-color: transparent;
      background-size: 300%; animation: holo-shift 4s linear infinite;
      box-shadow: 0 0 10px rgba(123,47,247,0.3);
    }
    .tool-toggle:checked::after { transform: translateX(17px); background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.3); }
    .tool-toggle:disabled { opacity: 0.4; cursor: not-allowed; }

    /* Forms */
    .setting-input, .setting-select, .license-input {
      background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 7px; color: #fff; font-family: 'JetBrains Mono', monospace;
      font-size: 12px; padding: 5px 8px; outline: none; transition: 0.2s;
    }
    .setting-input { width: 84px; height: 28px; text-align: right; }
    .setting-select { height: 28px; cursor: pointer; background: rgba(0,0,0,0.4); }
    .setting-input:focus, .setting-select:focus, .license-input:focus {
      border-color: rgba(123,47,247,0.6); box-shadow: 0 0 0 2px rgba(123,47,247,0.12);
    }
    .license-input { flex: 1; height: 32px; padding: 0 10px; font-size: 11px; letter-spacing: 0.5px; }
    .license-input::placeholder { color: rgba(255,255,255,0.15); }

    /* Setting items */
    .setting-item { display: flex; align-items: center; justify-content: space-between; min-height: 36px; gap: 12px; }
    .setting-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
    .setting-label { font-size: 12.5px; font-weight: 500; color: rgba(255,255,255,0.82); }
    .setting-hint { font-size: 11px; color: rgba(255,255,255,0.25); line-height: 1.4; }
    .settings-card {
      background: rgba(255,255,255,0.016); border: 1px solid rgba(255,255,255,0.05);
      border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 12px;
    }
    .setting-warn {
      font-size: 11px; color: #fda4af; background: rgba(244,63,94,0.06);
      border: 1px solid rgba(244,63,94,0.2); border-radius: 7px; padding: 8px 12px;
    }

    /* Tool toggles */
    .tool-toggle-list { display: flex; flex-direction: column; gap: 6px; }
    .tool-wrapper { display: flex; flex-direction: column; }
    .tool-row {
      background: rgba(255,255,255,0.016); border: 1px solid rgba(255,255,255,0.06);
      border-radius: 9px; padding: 10px 14px;
      display: flex; align-items: center; justify-content: space-between;
      border-left: 3px solid transparent; transition: all 0.2s;
    }
    .tool-row:hover { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.1); border-left-color: rgba(123,47,247,0.4); }
    .tool-row.expanded { border-left-color: #7b2ff7; background: rgba(123,47,247,0.05); }
    .tool-info { display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .tool-name-row { display: flex; align-items: center; gap: 8px; }
    .tool-name { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.82); font-family: 'JetBrains Mono', monospace; }
    .tool-desc { font-size: 11px; color: rgba(255,255,255,0.25); }
    .action-count-badge, .core-badge {
      display: inline-flex; align-items: center;
      padding: 1px 6px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1);
      font-size: 10px; color: rgba(255,255,255,0.35); background: rgba(255,255,255,0.04);
    }
    .pro-badge {
      display: inline-flex; align-items: center;
      padding: 1px 6px; border-radius: 4px;
      font-size: 9px; font-weight: 700; letter-spacing: 0.5px;
      background: linear-gradient(135deg, #7b2ff7, #a855f7); color: #fff;
    }
    .pro-extra-badge {
      display: inline-flex; align-items: center;
      padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 600;
      background: rgba(168,85,247,0.12); color: #c084fc; border: 1px solid rgba(168,85,247,0.25);
    }
    .pro-lock-icon { font-size: 14px; opacity: 0.5; flex-shrink: 0; }
    .pro-locked { opacity: 0.45; }
    .pro-locked:hover { opacity: 0.6; }
    .pro-locked-text { color: rgba(255,255,255,0.25) !important; }

    /* Action panel drop-down */
    .action-panel {
      background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.05);
      border-top: none; border-radius: 0 0 9px 9px;
      max-height: 0; opacity: 0; padding: 0 12px;
      transition: max-height 0.3s ease, opacity 0.25s ease, padding 0.3s ease;
      overflow: hidden;
    }
    .action-panel.open { max-height: 300px; opacity: 1; padding: 10px 12px; }
    .action-grid { display: flex; flex-wrap: wrap; gap: 5px; }
    .action-chip {
      padding: 2px 7px; border-radius: 4px; background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07); font-size: 10px;
      font-family: 'JetBrains Mono', monospace; color: rgba(255,255,255,0.45);
    }
    .action-chip-pro { opacity: 0.4; border-style: dashed !important; }
    .action-chip-locked { opacity: 0.3; border-style: dashed !important; color: rgba(255,255,255,0.25) !important; }

    /* Guide steps */
    .guide-steps { display: flex; flex-direction: column; gap: 8px; }
    .guide-step {
      display: flex; gap: 12px; padding: 12px 14px;
      background: rgba(255,255,255,0.016); border: 1px solid rgba(255,255,255,0.05);
      border-radius: 10px; align-items: flex-start;
    }
    .step-number {
      width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; color: #a78bfa;
      background: rgba(123,47,247,0.12); border: 1px solid rgba(123,47,247,0.25);
    }
    .step-content { display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .step-title { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.9); }
    .step-desc { font-size: 12px; color: rgba(255,255,255,0.32); line-height: 1.5; }

    .prompt-list { display: flex; flex-direction: column; gap: 7px; }
    .prompt-card {
      background: rgba(255,255,255,0.016); border: 1px solid rgba(255,255,255,0.05);
      border-radius: 9px; padding: 10px 12px;
      display: flex; align-items: flex-start; gap: 10px; cursor: pointer;
      text-align: left; transition: 0.2s; font-family: inherit;
    }
    .prompt-card:hover { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.1); }
    .prompt-tag {
      font-size: 10px; font-weight: 600; letter-spacing: 0.5px; flex-shrink: 0;
      padding: 3px 7px; border-radius: 4px;
      background: rgba(123,47,247,0.12); border: 1px solid rgba(123,47,247,0.25); color: #a78bfa;
    }
    .prompt-text { font-size: 12px; color: rgba(255,255,255,0.5); line-height: 1.5; flex: 1; }
    .prompt-copy {
      color: rgba(255,255,255,0.2); font-size: 13px; cursor: pointer;
      padding: 2px 5px; transition: 0.2s; background: none; border: none;
    }
    .prompt-copy:hover, .prompt-copy.copied { color: #5eead4; }
    .guide-tips .tips-title { font-size: 12.5px; font-weight: 600; color: rgba(255,255,255,0.82); margin-bottom: 8px; }
    .tips-list { margin: 0; padding-left: 18px; list-style: disc; }
    .tips-list li { font-size: 11px; color: rgba(255,255,255,0.3); margin-bottom: 4px; line-height: 1.5; }

    /* Info / result boxes */
    .info-box {
      background: rgba(255,255,255,0.016); border: 1px solid rgba(255,255,255,0.05);
      border-radius: 9px; padding: 11px 14px;
      font-size: 11.5px; color: rgba(255,255,255,0.28); line-height: 1.6;
    }
    .config-result {
      display: flex; align-items: center; gap: 8px; padding: 9px 12px;
      border-radius: 8px; font-size: 12px;
      border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.016);
    }
    .config-result.success { background: rgba(52,211,153,0.06); border-color: rgba(52,211,153,0.2); color: #5eead4; }
    .config-result.error { background: rgba(244,63,94,0.06); border-color: rgba(244,63,94,0.2); color: #fda4af; }

    /* License card */
    .license-card {
      background: rgba(255,255,255,0.016); border: 1px solid rgba(255,255,255,0.06);
      border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 12px;
    }
    .license-badge { display: flex; align-items: center; gap: 8px; }
    .license-edition { font-size: 14px; font-weight: 600; color: #fff; font-family: 'JetBrains Mono', monospace; }
    .license-state { padding: 3px 8px; border-radius: 5px; font-size: 11px; font-weight: 500; }
    .license-state.community { border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.4); }
    .license-state.active { border: 1px solid rgba(52,211,153,0.35); color: #5eead4; background: rgba(52,211,153,0.08); }
    .license-state.expired { border: 1px solid rgba(244,63,94,0.35); color: #fda4af; background: rgba(244,63,94,0.08); }
    .license-state.no-key { border: 1px solid rgba(251,191,36,0.35); color: #fbbf24; background: rgba(251,191,36,0.08); }
    .license-detail { font-size: 12px; color: rgba(255,255,255,0.3); display: flex; gap: 12px; }
    .license-error { font-size: 12px; color: #fda4af; }
    .license-input-row { display: flex; gap: 8px; }
    .btn-activate { flex-shrink: 0; min-width: 58px; height: 32px; padding: 0 12px; }
    .license-hint { font-size: 11px; color: rgba(255,255,255,0.22); line-height: 1.4; }

    /* Footer */
    .mcp-footer {
      display: flex; align-items: center; justify-content: space-between;
      padding: 9px 16px 12px; border-top: 1px solid rgba(255,255,255,0.04); flex-shrink: 0;
    }
    .footer-text { font-size: 11px; color: rgba(255,255,255,0.14); font-family: 'JetBrains Mono', monospace; }
    .footer-actions { display: flex; gap: 4px; }
    .ghost-btn {
      background: transparent; border: none; font-size: 11px; font-family: inherit;
      color: rgba(255,255,255,0.2); cursor: pointer; padding: 4px 8px; border-radius: 5px; transition: 0.2s;
    }
    .ghost-btn:hover { color: rgba(255,255,255,0.55); background: rgba(255,255,255,0.05); }

    /* Empty state */
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 28px 16px; gap: 12px; grid-column: span 2; }
    .empty-state-icon { font-size: 32px; opacity: 0.3; }
    .empty-state-text { font-size: 13px; color: rgba(255,255,255,0.25); text-align: center; line-height: 1.6; }

    /* Stop confirm pulse */
    .btn-danger.confirming { animation: confirmPulse 0.8s infinite; }
    @keyframes confirmPulse {
      0%,100% { box-shadow: 0 0 0 0 rgba(244,63,94,0.4); }
      50% { box-shadow: 0 0 0 4px rgba(244,63,94,0); }
    }

    /* Copyable elements */
    .copyable { cursor: pointer; position: relative; }
    .copyable:hover { opacity: 0.75; }
    .copy-toast {
      position: absolute; top: -22px; left: 50%; transform: translateX(-50%);
      background: #34d399; color: #000; font-size: 10px; padding: 2px 8px; border-radius: 4px;
      white-space: nowrap; pointer-events: none; animation: toastFade 1s ease forwards;
    }
    @keyframes toastFade {
      0% { opacity: 1; transform: translateX(-50%) translateY(0); }
      100% { opacity: 0; transform: translateX(-50%) translateY(-8px); }
    }

    /* Inject button feedback */
    .config-ide-btn.inject-success { background: rgba(52,211,153,0.12) !important; border-color: rgba(52,211,153,0.3) !important; color: #5eead4 !important; }
    .config-ide-btn.inject-fail { background: rgba(244,63,94,0.12) !important; border-color: rgba(244,63,94,0.3) !important; color: #fda4af !important; }

    /* Refresh spin */
    @keyframes refreshSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .ghost-btn.spinning { animation: refreshSpin 0.6s ease-in-out; }

    /* ── Holographic Status Layout ── */

    /* Status banner row */
    .holo-status-row {
      display: flex; align-items: center; gap: 10px; padding: 10px 14px;
      border-radius: 10px;
      background: rgba(64,224,208,0.05); border: 1px solid rgba(64,224,208,0.18);
    }
    .status-dot {
      width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
    }
    .status-dot.online { background: #40e0d0; box-shadow: 0 0 8px #40e0d0; animation: livePulse 2s infinite; }
    .status-dot.offline { background: #f43f5e; box-shadow: 0 0 6px #f43f5e; }
    @keyframes livePulse { 0%,100% { opacity:1; } 50% { opacity:0.35; } }
    .status-lbl { font-size: 12.5px; font-weight: 500; }
    .status-text.online { color: #a7f3f0; }
    .status-text.offline { color: #fda4af; }
    .status-port { margin-left: auto; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: rgba(255,255,255,0.2); }

    /* Project card */
    .project-card {
      background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);
      border-radius: 12px; padding: 12px 14px; position: relative; overflow: hidden;
    }
    .project-card::after {
      content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(123,47,247,0.5), transparent);
    }
    .proj-header {
      display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
    }
    .proj-name {
      font-size: 14px; font-weight: 700; color: #fff; letter-spacing: -0.3px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .proj-ver {
      font-family: 'JetBrains Mono', monospace; font-size: 10px;
      padding: 2px 7px; border-radius: 10px; flex-shrink: 0;
      background: rgba(123,47,247,0.15); border: 1px solid rgba(123,47,247,0.3);
      color: #c4b5fd; letter-spacing: 0.3px;
    }
    .proj-details {
      display: flex; flex-direction: column; gap: 4px;
    }
    .proj-row {
      display: flex; align-items: center; gap: 8px; min-width: 0;
    }
    .proj-key {
      font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.25);
      text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0; width: 42px;
    }
    .proj-val {
      font-family: 'JetBrains Mono', monospace; font-size: 10px;
      color: rgba(255,255,255,0.45);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .proj-uptime { color: rgba(64,224,208,0.6); }

    /* Num cards 2x2 grid */
    .nums-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .num-card {
      background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06);
      border-radius: 12px; padding: 16px; position: relative; overflow: hidden;
      transition: 0.3s;
    }
    .num-card:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.1); }
    .num-card::before {
      content: ''; position: absolute; top: -20px; right: -20px;
      width: 60px; height: 60px; border-radius: 50%;
      opacity: 0.1; filter: blur(15px);
    }
    .nc-blue::before  { background: #60a5fa; }
    .nc-rose::before  { background: #f43f5e; }
    .nc-purple::before { background: #a78bfa; }
    .nc-teal::before  { background: #2dd4bf; }

    .num-lbl {
      font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px;
      color: rgba(255,255,255,0.25); font-weight: 600; margin-bottom: 10px;
    }
    .num-val {
      font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace; font-size: 28px;
      font-weight: 600; line-height: 1;
    }
    .nc-blue   .num-val { color: #93c5fd; }
    .nc-rose   .num-val { color: #fda4af; }
    .nc-purple .num-val { color: #c4b5fd; }
    .nc-teal   .num-val { color: #5eead4; }
    .num-sub {
      font-size: 11px; color: rgba(255,255,255,0.2); margin-top: 8px;
    }
    .num-sub code {
      font-family: 'JetBrains Mono', monospace; font-size: 10px;
      background: rgba(255,255,255,0.05); padding: 2px 5px; border-radius: 4px;
      color: rgba(255,255,255,0.35);
    }
    /* keep value-changed animation working */
    .num-val { transition: none; }
    @keyframes valueFlash {
      0% { color: #fde047; text-shadow: 0 0 8px rgba(253,224,71,0.6); }
      100% { color: inherit; text-shadow: none; }
    }
    .value-changed { animation: valueFlash 0.6s ease-out; }

    /* Skeleton loader */
    .s3-bento.loading .s3-tile-value,
    .s3-bento.loading .s3-tile-sub {
      background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%);
      background-size: 200% 100%;
      animation: skeletonShimmer 1.5s ease-in-out infinite;
      color: transparent !important; border-radius: 4px;
      user-select: none; pointer-events: none;
    }
    .nums-grid.loading .num-val { min-height: 26px; max-width: 60px; }
    .nums-grid.loading .num-sub { min-height: 12px; max-width: 80px; }
    .nums-grid.loading .num-sub * { visibility: hidden; }
    @keyframes skeletonShimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

\n  `,

  $: {
    app: '#app', bentoGrid: '#bentoGrid', holoBadge: '#holoBadge',
    statusDot: '#statusDot', statusText: '#statusText',
    portValue: '#portValue', endpointValue: '#endpointValue',
    projectName: '#projectName', projectPath: '#projectPath', editorVersion: '#editorVersion', toolCount: '#toolCount', connectionCount: '#connectionCount', totalActionCount: '#totalActionCount',
    uptime: '#uptime',
    emptyState: '#emptyState',
    ctrlStatusLabel: '#ctrlStatusLabel',
    startBtn: '#startBtn', stopBtn: '#stopBtn', restartBtn: '#restartBtn',
    statusCursor: '#statusCursor', statusWindsurf: '#statusWindsurf', statusClaude: '#statusClaude',
    statusTrae: '#statusTrae', statusKiro: '#statusKiro', statusAntigravity: '#statusAntigravity',
    statusGeminiCli: '#statusGeminiCli', statusCodex: '#statusCodex', statusClaudeCode: '#statusClaudeCode',
    statusCodebuddy: '#statusCodebuddy', statusComate: '#statusComate',
    configResult: '#configResult', configIcon: '#configIcon', configMessage: '#configMessage',
    versionText: '#versionText', refreshBtn: '#refreshBtn',
    langBtn: '#langBtn', toolToggleList: '#toolToggleList',
    settingRateLimit: '#settingRateLimit', settingLoopback: '#settingLoopback',
    settingBodyLimit: '#settingBodyLimit', settingRollback: '#settingRollback',
    loopbackWarn: '#loopbackWarn',
    saveSettingsBtn: '#saveSettingsBtn', resetSettingsBtn: '#resetSettingsBtn',
    settingsResult: '#settingsResult', settingsIcon: '#settingsIcon', settingsMessage: '#settingsMessage',
    licenseCard: '#licenseCard', licenseBadge: '#licenseBadge',
    licenseEdition: '#licenseEdition', licenseState: '#licenseState',
    licenseDetail: '#licenseDetail', licenseExpiry: '#licenseExpiry', licenseOwner: '#licenseOwner',
    licenseError: '#licenseError', licenseKeyInput: '#licenseKeyInput', activateLicenseBtn: '#activateLicenseBtn',
  },

  ready() {
    const self = this;
    self.$.versionText.textContent = EXTENSION_VERSION;

    // ---- i18n setup ----
    const I18N = {
      zh: require('./i18n/zh.js'),
      en: require('./i18n/en.js'),
    };
    self._I18N = I18N;
    let currentLang = 'zh';
    try { currentLang = localStorage.getItem('mcp-lang') || 'zh'; } catch { }
    self._currentLang = currentLang;

    function applyI18n(lang) {
      currentLang = lang;
      self._currentLang = lang;
      const dict = I18N[lang] || I18N.zh;
      self.$.app.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) el.textContent = dict[key];
      });
      // Re-apply license UI with new language
      if (self._lastLicenseStatus) {
        self.updateLicenseUI(self._lastLicenseStatus);
      }
      try { localStorage.setItem('mcp-lang', lang); } catch { }
    }
    applyI18n(currentLang);

    self.$.langBtn.addEventListener('click', () => {
      applyI18n(currentLang === 'zh' ? 'en' : 'zh');
    });

    // ---- Tool toggle state ----
    const CORE_TOOLS = ['bridge_status'];
    const TOOL_DESC = {
      zh: {
        bridge_status: '桥接状态检测',
        scene_query: '场景只读查询',
        scene_operation: '场景写操作',
        asset_operation: '资产管理',
        editor_action: '编辑器操作',
        engine_action: '引擎全局操作',
        execute_script: '执行自定义脚本',
        register_custom_macro: '注册自定义宏',
        animation_tool: '动画管理',
        physics_tool: '物理组件管理',
        preferences: '编辑器偏好设置',
        broadcast: '编辑器事件广播',
        reference_image: '参考图叠加',
        tool_management: '工具可用性管理',
        setup_ui_layout: '一键 UI 布局',
        import_and_apply_texture: '导入并应用贴图',
        create_prefab_atomic: '一键创建预制体',
        auto_fit_physics_collider: '自动适配物理碰撞体',
        create_tween_animation_atomic: '一键创建动画',
        scene_generator: 'AI 场景生成器',
        batch_engine: '批量操作引擎',
        scene_audit: '场景审计工具',
      },
      en: {
        bridge_status: 'Bridge Status',
        scene_query: 'Scene Read-Only Query',
        scene_operation: 'Scene Write Operations',
        asset_operation: 'Asset Management',
        editor_action: 'Editor Actions',
        engine_action: 'Engine Global Ops',
        execute_script: 'Execute Custom Script',
        register_custom_macro: 'Register Custom Macro',
        animation_tool: 'Animation Management',
        physics_tool: 'Physics Components',
        preferences: 'Editor Preferences',
        broadcast: 'Editor Event Broadcast',
        reference_image: 'Reference Image Overlay',
        tool_management: 'Tool Availability',
        setup_ui_layout: 'Atomic UI Layout',
        import_and_apply_texture: 'Import & Apply Texture',
        create_prefab_atomic: 'Atomic Create Prefab',
        auto_fit_physics_collider: 'Auto-Fit Physics Collider',
        create_tween_animation_atomic: 'Atomic Create Animation',
        scene_generator: 'AI Scene Generator',
        batch_engine: 'Batch Operations Engine',
        scene_audit: 'Scene Audit Tool',
      },
    };

    // Pro 版完整工具清单 (actions)，用于社区版面板展示 Pro 独占内容
    const PRO_FULL_CATALOG = {
      bridge_status: [],
      scene_query: [
        'tree','list','stats','node_detail','find_by_path','get_components',
        'get_parent','get_children','get_sibling','get_world_position',
        'get_world_rotation','get_world_scale','get_active_in_hierarchy',
        'find_nodes_by_name','find_nodes_by_component','get_component_property',
        'get_node_components_properties','get_camera_info','get_canvas_info','get_scene_globals',
        'get_current_selection','get_active_scene_focus',
        'list_all_scenes','validate_scene','detect_2d_3d',
        'list_available_components',
        'measure_distance','scene_snapshot','scene_diff',
        'performance_audit','export_scene_json',
        'deep_validate_scene',
        'get_node_bounds','find_nodes_by_layer','get_animation_state','get_collider_info',
        'get_material_info','get_light_info','get_scene_environment',
        'screen_to_world','world_to_screen',
        'check_script_ready','get_script_properties',
      ],
      scene_operation: [
        'create_node','destroy_node','reparent',
        'set_position','set_rotation','set_scale',
        'set_world_position','set_world_rotation','set_world_scale',
        'set_name','set_active','duplicate_node',
        'move_node_up','move_node_down','set_sibling_index','reset_transform',
        'add_component','remove_component','set_property','reset_property','call_component_method',
        'ensure_2d_canvas','set_anchor_point','set_content_size',
        'create_prefab','instantiate_prefab','enter_prefab_edit','exit_prefab_edit',
        'apply_prefab','revert_prefab','validate_prefab',
        // Pro-only actions below
        'lock_node','unlock_node','hide_node','unhide_node','set_layer',
        'clear_children','reset_node_properties',
        'batch','batch_set_property','group_nodes','align_nodes',
        'clipboard_copy','clipboard_paste',
        'create_ui_widget','setup_particle','audio_setup','setup_physics_world',
        'create_skeleton_node','generate_tilemap','create_primitive',
        'set_camera_look_at','set_camera_property','camera_screenshot',
        'set_material_property','set_material_define','assign_builtin_material',
        'assign_project_material','clone_material','swap_technique','sprite_grayscale',
        'create_light','set_light_property','set_scene_environment',
        'bind_event','unbind_event','list_events',
        'attach_script','set_component_properties','detach_script',
      ],
      asset_operation: [
        'list','info','create','save','delete','move','copy','rename',
        'import','open','refresh','create_folder',
        'get_meta','set_meta_property',
        'uuid_to_url','url_to_uuid','search_by_type',
        // Pro-only actions below
        'reimport','get_dependencies','get_dependents','show_in_explorer',
        'clean_unused','pack_atlas','get_animation_clips','get_materials',
        'validate_asset','export_asset_manifest',
        'create_material','generate_script','batch_import','get_asset_size','slice_sprite',
      ],
      editor_action: [
        'save_scene','open_scene','new_scene','undo','redo',
        'get_selection','select','clear_selection',
        'project_info',
        'preview','preview_refresh',
        'build','build_query',
        'play_in_editor','pause_in_editor','stop_in_editor','step_in_editor',
        'focus_node','log','warn','error','clear_console','show_notification',
        // Pro-only actions below
        'build_with_config','build_status','preview_status',
        'send_message','open_panel','close_panel','query_panels','get_packages',
        'reload_plugin','inspect_asset','open_preferences','open_project_settings',
        'move_scene_camera','take_scene_screenshot',
        'set_transform_tool','set_coordinate','toggle_grid','toggle_snap',
        'get_console_logs','search_logs','set_view_mode','zoom_to_fit',
      ],
      preferences: ['get','set','list','get_global','set_global','get_project','set_project'],
      broadcast: ['poll','history','clear','send','send_ipc'],
      tool_management: ['list_all','enable','disable','get_stats'],
      execute_script: [],
      register_custom_macro: [],
      animation_tool: ['create_clip','play','pause','resume','stop','get_state','list_clips','set_current_time','set_speed','crossfade'],
      physics_tool: ['get_collider_info','add_collider','set_collider_size','add_rigidbody','set_rigidbody_props','set_physics_material','set_collision_group','get_physics_world','set_physics_world','add_joint'],
      create_prefab_atomic: [],
      import_and_apply_texture: [],
      setup_ui_layout: [],
      create_tween_animation_atomic: [],
      auto_fit_physics_collider: [],
      // Pro-exclusive tools
      engine_action: ['get_engine_info','set_engine_config','reload_scripts','clear_cache','gc','get_runtime_stats','set_design_resolution','get_supported_platforms'],
      reference_image: ['add','remove','list','set_transform','set_opacity','toggle_visibility','clear_all'],
      scene_generator: ['create_scene','create_ui_page','create_game_level','create_menu','describe_intent'],
      batch_engine: ['find_and_modify','find_and_delete','find_and_add_component','find_and_remove_component','find_and_set_property','find_and_reparent','transform_all','rename_pattern','set_layer_recursive','toggle_active_recursive'],
      scene_audit: ['full_audit','check_performance','check_hierarchy','check_components','check_assets','check_physics','check_ui','auto_fix','export_report'],
    };

    // Pro 独占工具（社区版永远不会注册的）
    const PRO_EXCLUSIVE_TOOLS = new Set([
      'engine_action','reference_image',
      'scene_generator','batch_engine','scene_audit',
    ]);

    // Pro 版工具展示顺序
    const PRO_TOOL_ORDER = [
      'bridge_status',
      'scene_query','scene_operation','asset_operation','editor_action',
      'preferences','broadcast','tool_management',
      'execute_script','register_custom_macro',
      'animation_tool','physics_tool',
      'create_prefab_atomic','import_and_apply_texture','setup_ui_layout',
      'create_tween_animation_atomic','auto_fit_physics_collider',
      'engine_action','reference_image',
      'scene_generator','batch_engine','scene_audit',
    ];
    self._toolEnabled = {};
    try { self._toolEnabled = JSON.parse(localStorage.getItem('mcp-tool-enabled') || '{}'); } catch { }
    let _lastToolDataKey = '';

    function renderToolToggles(toolNames, toolActions, toolStates) {
      const container = self.$.toolToggleList;
      if (!container) return;

      const registeredSet = new Set(toolNames || []);
      const registeredActionSets = {};
      (toolNames || []).forEach(n => {
        registeredActionSets[n] = new Set((toolActions && toolActions[n]) || []);
      });

      // Build merged tool list: registered tools + Pro-exclusive unregistered tools
      const mergedNames = [];
      const seen = new Set();
      PRO_TOOL_ORDER.forEach(n => {
        if (!seen.has(n)) { mergedNames.push(n); seen.add(n); }
      });
      (toolNames || []).forEach(n => {
        if (!seen.has(n)) { mergedNames.push(n); seen.add(n); }
      });

      // Skip rebuild if data unchanged
      const dataKey = JSON.stringify({ mergedNames, toolActions, toolStates, currentLang });
      if (dataKey === _lastToolDataKey && container.children.length > 0) return;
      _lastToolDataKey = dataKey;

      let expandedTool = '';
      const expandedRow = container.querySelector('.tool-row.expanded');
      if (expandedRow) {
        const toggle = expandedRow.querySelector('.tool-toggle');
        if (toggle) expandedTool = toggle.getAttribute('data-tool') || '';
      }

      container.textContent = '';
      const dict = I18N[currentLang] || I18N.zh;
      const descMap = TOOL_DESC[currentLang] || TOOL_DESC.zh;
      const proHint = currentLang === 'zh' ? 'Pro 版专属' : 'Pro Exclusive';
      const proActionHint = currentLang === 'zh' ? '升级 Pro 解锁' : 'Upgrade to Pro';

      mergedNames.forEach(name => {
        const isRegistered = registeredSet.has(name);
        const isProExclusive = !isRegistered && PRO_EXCLUSIVE_TOOLS.has(name);
        const isProTool = PRO_EXCLUSIVE_TOOLS.has(name);
        const isCore = CORE_TOOLS.includes(name);
        const enabled = isRegistered
          ? (toolStates && Object.prototype.hasOwnProperty.call(toolStates, name) ? !!toolStates[name] : self._toolEnabled[name] !== false)
          : false;

        const currentActions = (toolActions && toolActions[name]) || [];
        const proActions = PRO_FULL_CATALOG[name] || [];
        const displayActions = proActions.length > 0 ? proActions : currentActions;

        // Determine how many extra Pro actions exist for this tool
        const currentActionSet = registeredActionSets[name] || new Set();
        const hasProExtras = isRegistered && proActions.length > currentActions.length;

        const wrapper = document.createElement('div');
        wrapper.className = 'tool-wrapper';

        const row = document.createElement('div');
        row.className = 'tool-row' + (isProExclusive ? ' pro-locked' : '');

        const infoDiv = document.createElement('div');
        infoDiv.className = 'tool-info';

        const nameRow = document.createElement('div');
        nameRow.className = 'tool-name-row';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'tool-name' + (isProExclusive ? ' pro-locked-text' : '');
        nameSpan.textContent = name;

        if (isCore) {
          const badge = document.createElement('span');
          badge.className = 'core-badge';
          badge.textContent = dict['ctrl.tools_core'] || '(core)';
          nameSpan.appendChild(badge);
        }
        nameRow.appendChild(nameSpan);

        if (isProExclusive) {
          const proBadge = document.createElement('span');
          proBadge.className = 'pro-badge';
          proBadge.textContent = 'PRO';
          nameRow.appendChild(proBadge);
        } else if (hasProExtras) {
          const extraBadge = document.createElement('span');
          extraBadge.className = 'pro-extra-badge';
          extraBadge.textContent = currentLang === 'zh'
            ? `+${proActions.length - currentActions.length} Pro`
            : `+${proActions.length - currentActions.length} Pro`;
          nameRow.appendChild(extraBadge);
        }

        if (displayActions.length > 0) {
          const countBadge = document.createElement('span');
          countBadge.className = 'action-count-badge' + (isProExclusive ? ' pro-locked-text' : '');
          countBadge.textContent = isRegistered && hasProExtras
            ? currentActions.length + '/' + proActions.length
            : String(displayActions.length);
          countBadge.title = isRegistered && hasProExtras
            ? (currentLang === 'zh'
              ? `社区版 ${currentActions.length} / Pro 版 ${proActions.length} actions`
              : `Community ${currentActions.length} / Pro ${proActions.length} actions`)
            : displayActions.length + ' actions';
          nameRow.appendChild(countBadge);
        }
        infoDiv.appendChild(nameRow);

        const desc = descMap[name];
        if (desc) {
          const descSpan = document.createElement('span');
          descSpan.className = 'tool-desc' + (isProExclusive ? ' pro-locked-text' : '');
          descSpan.textContent = isProExclusive ? desc + ' — ' + proHint : desc;
          infoDiv.appendChild(descSpan);
        }

        if (isProExclusive) {
          const lockIcon = document.createElement('span');
          lockIcon.className = 'pro-lock-icon';
          lockIcon.textContent = '🔒';
          lockIcon.title = proHint;
          row.appendChild(infoDiv);
          row.appendChild(lockIcon);
        } else {
          const toggle = document.createElement('input');
          toggle.type = 'checkbox';
          toggle.className = 'tool-toggle';
          toggle.setAttribute('data-tool', name);
          toggle.checked = enabled;
          toggle.disabled = isCore;
          row.appendChild(infoDiv);
          row.appendChild(toggle);
        }

        wrapper.appendChild(row);

        // Action list panel
        if (displayActions.length > 0) {
          const actionPanel = document.createElement('div');
          actionPanel.className = 'action-panel';
          actionPanel.setAttribute('data-tool', name);
          const shouldExpand = (name === expandedTool);
          if (shouldExpand) {
            actionPanel.classList.add('open');
            row.classList.add('expanded');
          }

          const actionGrid = document.createElement('div');
          actionGrid.className = 'action-grid';
          displayActions.forEach(a => {
            const chip = document.createElement('span');
            const isAvailable = isRegistered && currentActionSet.has(a);
            const isProOnlyAction = isRegistered && !currentActionSet.has(a);
            chip.className = 'action-chip'
              + (isProExclusive ? ' action-chip-locked' : '')
              + (isProOnlyAction ? ' action-chip-pro' : '');
            chip.textContent = a;
            if (isProOnlyAction) chip.title = proActionHint;
            if (isProExclusive) chip.title = proHint;
            actionGrid.appendChild(chip);
          });
          actionPanel.appendChild(actionGrid);
          wrapper.appendChild(actionPanel);

          row.style.cursor = 'pointer';
          row.addEventListener('click', (e) => {
            if (e.target.classList && e.target.classList.contains('tool-toggle')) return;
            const isOpen = actionPanel.classList.contains('open');
            container.querySelectorAll('.action-panel').forEach(p => { p.classList.remove('open'); });
            container.querySelectorAll('.tool-row').forEach(r => { r.classList.remove('expanded'); });
            if (!isOpen) {
              actionPanel.classList.add('open');
              row.classList.add('expanded');
            }
          });
        }

        container.appendChild(wrapper);
      });
      container.querySelectorAll('.tool-toggle').forEach(cb => {
        cb.addEventListener('change', (e) => {
          const toolName = e.target.getAttribute('data-tool');
          self._toolEnabled[toolName] = e.target.checked;
          try { localStorage.setItem('mcp-tool-enabled', JSON.stringify(self._toolEnabled)); } catch { }
          Editor.Message.send(EXTENSION_NAME, 'set-tool-enabled', toolName, e.target.checked);
        });
      });
    }
    self._renderToolToggles = renderToolToggles;
    self._applyI18n = applyI18n;

    // Tab Logic
    const tabs = self.$.app.querySelectorAll('.mcp-tab');
    const tabContents = self.$.app.querySelectorAll('.mcp-tab-content');
    const indicator = self.$.app.querySelector('.tab-indicator');
    const tabsHeader = self.$.app.querySelector('.mcp-tabs-header');

    function moveIndicator(tab) {
      if (!indicator || !tabsHeader || !tab) return;
      const headerRect = tabsHeader.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();
      indicator.style.left = (tabRect.left - headerRect.left) + 'px';
      indicator.style.width = tabRect.width + 'px';
    }

    // Position indicator on first active tab after layout
    requestAnimationFrame(() => {
      const activeTab = self.$.app.querySelector('.mcp-tab.active');
      if (activeTab) moveIndicator(activeTab);
    });

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        moveIndicator(tab);
        const targetId = tab.getAttribute('data-target');
        const targetContent = self.$.app.querySelector(`#${targetId}`);
        if (targetContent) targetContent.classList.add('active');
        const container = self.$.app.querySelector('.mcp-tabs-container');
        if (container) container.scrollTop = 0;
      });
    });

    self.$.startBtn.addEventListener('click', () => {
      Editor.Message.send(EXTENSION_NAME, 'start-server');
      setTimeout(() => self.refreshStatus(), 1000);
      setTimeout(() => self.refreshStatus(), 2500);
    });

    let _stopConfirmTimer = null;
    self.$.stopBtn.addEventListener('click', () => {
      if (self.$.stopBtn.classList.contains('confirming')) {
        // Second click - execute
        clearTimeout(_stopConfirmTimer);
        self.$.stopBtn.classList.remove('confirming');
        self.$.stopBtn.textContent = '■ 停止服务';
        Editor.Message.send(EXTENSION_NAME, 'stop-server');
        setTimeout(() => self.refreshStatus(), 800);
      } else {
        // First click - ask confirm
        self.$.stopBtn.classList.add('confirming');
        self.$.stopBtn.textContent = '⚠ 确认停止？';
        _stopConfirmTimer = setTimeout(() => {
          self.$.stopBtn.classList.remove('confirming');
          self.$.stopBtn.textContent = '■ 停止服务';
        }, 2500);
      }
    });

    self.$.restartBtn.addEventListener('click', () => {
      Editor.Message.send(EXTENSION_NAME, 'restart-server');
      setTimeout(() => self.refreshStatus(), 1000);
    });

    const ideBtns = self.$.app.querySelectorAll('.config-ide-btn');
    ideBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const button = e.currentTarget;
        const targetIDE = button && button.getAttribute ? button.getAttribute('data-ide') : null;
        const originalText = button && 'textContent' in button ? button.textContent : '注入配置';
        if (!button || !targetIDE) {
          self.showConfigResult({ success: false, message: '配置失败: 无法识别目标 IDE' });
          return;
        }

        button.setAttribute('disabled', '');
        button.textContent = '⏳ Inject...';
        let feedbackClass = 'inject-fail';
        try {
          const result = await Promise.race([
            Editor.Message.request(EXTENSION_NAME, 'configure-ide', targetIDE),
            new Promise((_, reject) => setTimeout(() => reject(new Error('请求超时，请重试')), CONFIG_REQUEST_TIMEOUT_MS)),
          ]);
          self.showConfigResult(result);
          feedbackClass = result.success ? 'inject-success' : 'inject-fail';
          setTimeout(() => self.refreshStatus(), 500);
        } catch (err) {
          self.showConfigResult({ success: false, message: `配置失败: ${err.message || err}` });
        } finally {
          button.removeAttribute('disabled');
          button.textContent = originalText;
          button.classList.add(feedbackClass);
          setTimeout(() => button.classList.remove(feedbackClass), 2000);
        }
      });
    });

    // ---- Settings Tab Logic ----
    self.$.settingLoopback.addEventListener('change', () => {
      self.$.loopbackWarn.style.display = self.$.settingLoopback.checked ? 'none' : 'block';
    });

    self.$.saveSettingsBtn.addEventListener('click', async () => {
      const dict = I18N[currentLang] || I18N.zh;
      try {
        const settings = {
          rateLimitPerMinute: parseInt(self.$.settingRateLimit.value, 10) || 240,
          loopbackOnly: self.$.settingLoopback.checked,
          maxBodySizeBytes: parseInt(self.$.settingBodyLimit.value, 10) || 1048576,
          autoRollback: self.$.settingRollback.checked,
        };
        await Editor.Message.request(EXTENSION_NAME, 'update-settings', settings);
        self.showSettingsResult(true, dict['settings.saved'] || 'Settings saved');
      } catch (err) {
        self.showSettingsResult(false, `${dict['cfg.fail'] || 'Failed'}: ${err.message || err}`);
      }
    });

    self.$.resetSettingsBtn.addEventListener('click', async () => {
      const dict = I18N[currentLang] || I18N.zh;
      try {
        const result = await Editor.Message.request(EXTENSION_NAME, 'reset-settings');
        if (result && result.settings) {
          self.applySettingsToUI(result.settings);
        }
        self.showSettingsResult(true, dict['settings.reset_done'] || 'Settings reset to defaults');
      } catch (err) {
        self.showSettingsResult(false, `${dict['cfg.fail'] || 'Failed'}: ${err.message || err}`);
      }
    });

    // ---- License activation ----
    self.$.activateLicenseBtn.addEventListener('click', async () => {
      const key = self.$.licenseKeyInput.value.trim();
      if (!key) return;
      const dict = I18N[currentLang] || I18N.zh;
      self.$.activateLicenseBtn.setAttribute('disabled', '');
      self.$.activateLicenseBtn.textContent = '...';
      try {
        const result = await Promise.race([
          Editor.Message.request(EXTENSION_NAME, 'activate-license', key),
          new Promise((_, reject) => setTimeout(() => reject(new Error(dict['cfg.timeout'] || 'Timeout')), CONFIG_REQUEST_TIMEOUT_MS)),
        ]);
        if (result && result.licenseStatus) {
          self.updateLicenseUI(result.licenseStatus);
        }
        if (result && result.success) {
          self.showSettingsResult(true, dict['settings.license_activated'] || 'License activated! Restart plugin for Pro tools.');
        } else {
          self.showSettingsResult(false, result?.error || dict['settings.license_invalid'] || 'Invalid license key');
        }
      } catch (err) {
        self.showSettingsResult(false, `${err.message || err}`);
      } finally {
        self.$.activateLicenseBtn.removeAttribute('disabled');
        self.$.activateLicenseBtn.textContent = dict['settings.activate'] || '激活';
      }
    });

    // ---- Guide tab: prompt copy buttons ----
    self.$.app.querySelectorAll('.prompt-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.prompt-card');
        const text = card?.querySelector('.prompt-text')?.textContent || '';
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text).then(() => {
            btn.textContent = '✓';
            btn.classList.add('copied');
            setTimeout(() => { btn.textContent = '📋'; btn.classList.remove('copied'); }, 1500);
          });
        }
      });
    });

    // ---- Copyable values (port, endpoint) ----
    function makeCopyable(el) {
      if (!el) return;
      el.classList.add('copyable');
      el.style.position = 'relative';
      el.addEventListener('click', () => {
        const text = el.textContent;
        if (!text || text === '-') return;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text).then(() => {
            const toast = document.createElement('span');
            toast.className = 'copy-toast';
            toast.textContent = '已复制';
            el.appendChild(toast);
            setTimeout(() => toast.remove(), 1000);
          });
        }
      });
    }
    makeCopyable(self.$.portValue);
    makeCopyable(self.$.endpointValue);

    self.$.refreshBtn.addEventListener('click', () => {
      self.$.refreshBtn.classList.remove('spinning');
      void self.$.refreshBtn.offsetWidth;
      self.$.refreshBtn.classList.add('spinning');
      self.refreshStatus();
      setTimeout(() => self.$.refreshBtn.classList.remove('spinning'), 700);
    });

    // Defer first fetch so the browser can paint the skeleton frame first
    requestAnimationFrame(() => {
      self.refreshStatus();
      pollTimer = setInterval(() => self.refreshStatus(), POLL_INTERVAL);
    });
  },

  close() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  },

  methods: {
    formatUptime(seconds) {
      if (!seconds || seconds <= 0) return '-';
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    },

    updateWithFlash(el, newValue) {
      if (!el) return;
      const str = String(newValue);
      if (el.textContent !== str) {
        el.textContent = str;
        el.classList.remove('value-changed');
        void el.offsetWidth;
        el.classList.add('value-changed');
      }
    },

    async refreshStatus() {
      const self = this;
      try {
        const info = await Editor.Message.request(EXTENSION_NAME, 'get-service-info');
        if (info && info.running) {
          self.$.statusDot.className = 'status-dot online';
          self.$.statusText.className = 'status-text online';
          self.$.statusText.textContent = 'Online';
          self.$.startBtn.classList.add('btn-disabled');
          self.$.stopBtn.classList.remove('btn-disabled');
          self.$.ctrlStatusLabel.textContent = '运行中';
          self.$.ctrlStatusLabel.style.color = '#22c55e';
          self.$.bentoGrid.classList.remove('loading');
          self.$.bentoGrid.style.display = 'grid';
          self.$.emptyState.style.display = 'none';
          self.$.portValue.textContent = String(info.port);
          self.$.endpointValue.textContent = info.bridgeBase ? `${info.bridgeBase}/mcp` : '-';
          self.$.projectName.textContent = info.projectName || '-';
          self.$.projectPath.textContent = info.projectPath || '-';
          self.$.editorVersion.textContent = info.editorVersion || '-';

          self.updateWithFlash(self.$.connectionCount, info.connectionCount ?? 0);
          self.updateWithFlash(self.$.toolCount, info.toolCount ?? 0);
          self.updateWithFlash(self.$.totalActionCount, info.totalActionCount ?? 0);
          self.updateWithFlash(self.$.uptime, self.formatUptime(info.uptime ?? 0));

          // Render tool toggles
          if (info.allToolNames && info.toolEnabledStates) {
            self._toolEnabled = { ...self._toolEnabled, ...info.toolEnabledStates };
          }
          if ((info.allToolNames || info.toolNames) && self._renderToolToggles) {
            self._renderToolToggles(info.allToolNames || info.toolNames, info.toolActions || {}, info.toolEnabledStates || {});
          }

          if (info.settings) {
            self.applySettingsToUI(info.settings);
          }


          if (info.configStatus) {
            const updateStat = (id, exists) => {
              const el = self.$[id];
              el.textContent = exists ? '配置已就绪' : '未检测到配置';
              el.className = `ide-status ${exists ? 'ready' : 'unready'}`;
            };
            updateStat('statusCursor', info.configStatus.cursor);
            updateStat('statusWindsurf', info.configStatus.windsurf);
            updateStat('statusClaude', info.configStatus.claude);
            updateStat('statusTrae', info.configStatus.trae);
            updateStat('statusKiro', info.configStatus.kiro);
            updateStat('statusAntigravity', info.configStatus.antigravity);
            updateStat('statusGeminiCli', info.configStatus['gemini-cli']);
            updateStat('statusCodex', info.configStatus.codex);
            updateStat('statusClaudeCode', info.configStatus['claude-code']);
            updateStat('statusCodebuddy', info.configStatus.codebuddy);
            updateStat('statusComate', info.configStatus.comate);
          }
        } else {
          self.setOffline();
        }

        // Always update license badge regardless of running state
        if (info && info.licenseStatus) {
          self.updateLicenseUI(info.licenseStatus);
        }
      } catch (e) {
        console.warn('[Aura] refreshStatus 异常:', e);
        self.setOffline();
      }
    },

    setOffline() {
      const self = this;
      self.$.statusDot.className = 'status-dot offline';
      self.$.statusText.className = 'status-text offline';
      self.$.statusText.textContent = 'Offline';
      self.$.startBtn.classList.remove('btn-disabled');
      self.$.stopBtn.classList.add('btn-disabled');
      self.$.ctrlStatusLabel.textContent = '已停止';
      self.$.ctrlStatusLabel.style.color = '#ef4444';
      self.$.bentoGrid.classList.remove('loading');
      self.$.bentoGrid.style.display = 'none';
      self.$.emptyState.style.display = 'flex';
      self.$.portValue.textContent = '-';
      self.$.endpointValue.textContent = '-';
      self.$.projectName.textContent = '-';
      self.$.projectPath.textContent = '-';
      self.$.editorVersion.textContent = '-';

      self.$.connectionCount.textContent = '-';
      self.$.toolCount.textContent = '-';
      self.$.totalActionCount.textContent = '-';
      self.$.uptime.textContent = '-';
    },

    showConfigResult(result) {
      const self = this;
      const el = self.$.configResult;
      el.style.display = 'flex';
      el.className = `config-result ${result.success ? 'success' : 'error'}`;
      self.$.configIcon.textContent = result.success ? '✓' : '✗';
      self.$.configMessage.textContent = result.message || '';
    },

    applySettingsToUI(settings) {
      const self = this;
      if (!settings) return;
      if (typeof settings.rateLimitPerMinute === 'number') {
        self.$.settingRateLimit.value = String(settings.rateLimitPerMinute);
      }
      if (typeof settings.loopbackOnly === 'boolean') {
        self.$.settingLoopback.checked = settings.loopbackOnly;
        self.$.loopbackWarn.style.display = settings.loopbackOnly ? 'none' : 'block';
      }
      if (typeof settings.maxBodySizeBytes === 'number') {
        self.$.settingBodyLimit.value = String(settings.maxBodySizeBytes);
      }
      if (typeof settings.autoRollback === 'boolean') {
        self.$.settingRollback.checked = settings.autoRollback;
      }
    },

    showSettingsResult(success, message) {
      const self = this;
      const el = self.$.settingsResult;
      el.style.display = 'flex';
      el.className = `config-result ${success ? 'success' : 'error'}`;
      self.$.settingsIcon.textContent = success ? '✓' : '✗';
      self.$.settingsMessage.textContent = message || '';
      setTimeout(() => { el.style.display = 'none'; }, 3000);
    },

    updateLicenseUI(status) {
      const self = this;
      if (!status) return;
      self._lastLicenseStatus = status;
      const { proInstalled, licenseValid, edition, expiry, licensedTo, error } = status;
      const dict = (self._I18N && self._I18N[self._currentLang]) || {};
      const t = (key, fallback) => dict[key] || fallback;

      const badgeInner = self.$.holoBadge && self.$.holoBadge.querySelector('.holo-badge-inner');
      const licenseInputRow = self.$.licenseCard && self.$.licenseCard.querySelector('.license-input-row');
      const licenseHint = self.$.licenseCard && self.$.licenseCard.querySelector('.license-hint');

      if (licenseValid && edition && edition !== 'community') {
        const edLabel = edition === 'enterprise'
          ? t('license.enterprise_edition', 'Enterprise Edition')
          : t('license.pro_edition', 'Pro Edition');
        self.$.licenseEdition.textContent = edLabel;
        self.$.licenseState.textContent = t('license.activated', 'Activated');
        self.$.licenseState.className = 'license-state active';
        self.$.licenseDetail.style.display = 'flex';
        self.$.licenseExpiry.textContent = expiry ? `${t('license.expiry_prefix', 'Valid until')} ${expiry}` : '';
        self.$.licenseOwner.textContent = licensedTo ? `Licensed to: ${licensedTo}` : '';
        self.$.licenseError.style.display = 'none';
        if (licenseInputRow) licenseInputRow.style.display = 'flex';
        if (licenseHint) licenseHint.style.display = 'block';
        if (badgeInner) badgeInner.textContent = edition === 'enterprise' ? t('badge.enterprise', 'Enterprise') : t('badge.pro', 'Pro');
      } else if (proInstalled && !licenseValid) {
        self.$.licenseEdition.textContent = t('license.pro_edition', 'Pro Edition');
        const isExpired = error && error.includes('expired');
        if (isExpired) {
          self.$.licenseState.textContent = t('license.expired', 'Expired');
          self.$.licenseState.className = 'license-state expired';
        } else {
          self.$.licenseState.textContent = t('license.not_activated', 'Not Activated');
          self.$.licenseState.className = 'license-state no-key';
        }
        self.$.licenseDetail.style.display = 'none';
        if (error) {
          self.$.licenseError.style.display = 'block';
          self.$.licenseError.textContent = error;
        } else {
          self.$.licenseError.style.display = 'none';
        }
        if (licenseInputRow) licenseInputRow.style.display = 'flex';
        if (licenseHint) licenseHint.style.display = 'block';
        if (badgeInner) badgeInner.textContent = t('badge.pro', 'Pro');
      } else {
        self.$.licenseEdition.textContent = t('license.community_edition', 'Community Edition');
        self.$.licenseState.textContent = t('license.free', 'Free');
        self.$.licenseState.className = 'license-state community';
        self.$.licenseDetail.style.display = 'none';
        self.$.licenseError.style.display = 'none';
        if (licenseInputRow) licenseInputRow.style.display = 'none';
        if (licenseHint) licenseHint.style.display = 'none';
        if (badgeInner) badgeInner.textContent = t('badge.community', 'Community');
      }
    },
  },
});
