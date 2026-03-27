// @ts-nocheck
"use strict";

// 在 JS 文件执行的第一时间（模板渲染前）把 webview 背景压黑，消除白色第一帧
try {
  const _s = document.createElement('style');
  _s.textContent = 'html,body{background:#18181b!important;margin:0;padding:0;}';
  (document.head || document.documentElement).appendChild(_s);
} catch(_e) { /* 宿主环境不支持时静默忽略 */ }

const EXTENSION_NAME = 'aura-for-cocos';
const EXTENSION_VERSION = '1.0.14';
const POLL_INTERVAL = 3000;
const CONFIG_REQUEST_TIMEOUT_MS = 10000;

let pollTimer = null;

module.exports = Editor.Panel.define({
  template: /* html */ `
    <style>:host,html,body{background:#18181b!important;margin:0;padding:0;}#app{background:#18181b!important;}</style>
    <div class="mcp-panel" id="app" style="background:#18181b;position:relative;height:100%;overflow:hidden;">

      <!-- 初始加载遮罩：inline style 确保在样式表解析前就遮住白屏 -->
      <div id="appLoading" style="position:absolute;inset:0;z-index:9999;background:#18181b;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;transition:opacity 0.25s ease;pointer-events:none;">
        <div class="loading-spinner"></div>
        <span style="color:#52525b;font-size:11px;font-family:-apple-system,sans-serif;letter-spacing:1px;">AURA</span>
      </div>

      <!-- Header -->
      <div class="panel-header">
        <div class="logo-icon">
          <svg width="100%" height="100%" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.95 10.38L21.36 13.14L28.16 24.96H30.43L22.95 12V10.38Z" fill="#A1A1AA"/>
            <path d="M19.34 6.78003L15.35 13.67L22.14 24.93H24.52L19.34 16.33V6.78003Z" fill="#D4D4D8"/>
            <path d="M10 24.93L15.75 14L21.5 24.93H10Z" fill="#71717A"/>
            <text x="20.5" y="32" fill="#71717A" font-size="6.5" font-family="-apple-system, sans-serif" font-weight="700" letter-spacing="0.5" text-anchor="middle">AURA</text>
          </svg>
        </div>
        <div class="brand-container">
          <span class="brand-txt-aura">Aura</span>
        </div>
        <div class="holo-badge" id="holoBadge">
          <div class="holo-badge-inner" data-i18n="badge.community">Community</div>
        </div>
        <div class="header-actions">
          <button id="langBtn" class="ghost-btn">中/EN</button>
          <div class="user-avatar" id="userBtn" title="用户中心">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="mcp-tabs-header">
        <div class="mcp-tab active" data-target="tabStatus" data-i18n="tab.status">状态</div>
        <div class="mcp-tab" data-target="tabControl" data-i18n="tab.control">控制</div>
        <div class="mcp-tab" data-target="tabConfig" data-i18n="tab.config">互联</div>
        <div class="mcp-tab" data-target="tabSettings" data-i18n="tab.settings">设置</div>
        <div class="mcp-tab" data-target="tabGuide" data-i18n="tab.guide">指南</div>
      </div>

      <!-- Tab Content -->
      <div class="mcp-tabs-container">

          <!-- 1. Status Tab -->
          <div class="mcp-tab-content active" id="tabStatus">

            <div class="status-bar" id="statusBanner">
              <div id="statusDot" class="status-dot offline"></div>
              <span id="statusText" class="status-lbl status-text offline">Offline</span>
              <span id="endpointValue" class="status-port"></span>
            </div>

            <div id="updateBanner" class="update-banner" style="display:none;"></div>

            <div class="stats-list" id="bentoGrid">
              <div class="stat-row">
                <span class="stat-label" data-i18n="status.tools">TOOLS</span>
                <span class="stat-value" id="toolCount">-</span>
              </div>
              <div class="stat-row">
                <span class="stat-label" data-i18n="status.actions">ACTIONS</span>
                <span class="stat-value" id="totalActionCount">-</span>
              </div>
              <div class="stat-row stat-row-clickable" id="clientsRow" title="点击查看已连接的 AI 客户端">
                <span class="stat-label" data-i18n="status.clients">CLIENTS</span>
                <span class="stat-value" id="connectionCount">-</span>
              </div>
              <div class="clients-popover" id="clientsPopover" style="display:none;">
                <div class="clients-popover-title">已连接的 AI 客户端</div>
                <div class="clients-popover-list" id="clientsPopoverList"></div>
              </div>
              <div class="stat-row">
                <span class="stat-label" data-i18n="status.port">PORT</span>
                <span class="stat-value" id="portValue">-</span>
              </div>
            </div>

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
              <p>当前服务状态：<span id="ctrlStatusLabel" style="color:#f14c4c;font-weight:600;">已停止</span></p>
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
      </div>

    </div>
\n  `,

  style: /* css */ `\n
    html, body { background: #18181b !important; margin: 0; padding: 0; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :host { background: #18181b; display: block; height: 100%; }

    /* 加载遮罩 spinner */
    .loading-spinner {
      width: 22px; height: 22px;
      border: 2px solid #3f3f46;
      border-top-color: #71717a;
      border-radius: 50%;
      animation: aura-spin 0.8s linear infinite;
    }
    @keyframes aura-spin { to { transform: rotate(360deg); } }

    .mcp-panel {
      color: #d4d4d8;
      font-size: 13px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
      height: 100%; display: flex; flex-direction: column;
      background: linear-gradient(180deg, #27272a 0%, #18181b 100%);
      user-select: none; position: relative; overflow: hidden;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
    }

    /* ===== HEADER ===== */
    .panel-header {
      display: flex; align-items: center; padding: 14px 18px 10px; gap: 10px;
      background: transparent;
      flex-shrink: 0;
    }
    .logo-icon {
      width: 32px; height: 32px; flex-shrink: 0; display: flex; justify-content: center; align-items: center;
    }
    .brand-container {
      display: flex; align-items: baseline; gap: 4px; padding-left: 2px;
    }
    .brand-txt-aura { font-size: 18px; font-weight: 600; color: #f4f4f5; font-family: -apple-system, sans-serif; letter-spacing: -0.01em; }
    
    .holo-badge {
      display: inline-flex;
      margin-left: 8px; align-items: baseline;
    }
    .holo-badge-inner {
      color: #71717a; /* Sleek slate gray color */
      font-size: 13px; font-weight: 500; font-family: -apple-system, sans-serif;
    }
    .header-actions {
      margin-left: auto; display: flex; align-items: center; gap: 8px;
    }
    .ghost-btn {
      background: transparent; border: 1px solid rgba(255,255,255,0.06); font-size: 11px; font-family: inherit;
      color: #71717a; cursor: pointer; padding: 4px 8px; border-radius: 4px;
      transition: all 0.15s; height: 24px; display: flex; align-items: center;
    }
    .ghost-btn:hover { color: #d4d4d8; background: rgba(255,255,255,0.08); }
    
    .user-avatar {
      width: 24px; height: 24px; border-radius: 50%; background: transparent;
      border: 1px solid rgba(255,255,255,0.06);
      display: flex; align-items: center; justify-content: center;
      color: #71717a; cursor: pointer; transition: all 0.15s; pointer-events: auto;
    }
    .user-avatar:hover {
      color: #d4d4d8; background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15);
    }

    /* ===== TAB NAVIGATION ===== */
    .mcp-tabs-header {
      display: flex; background: transparent;
      border-bottom: 1px solid #27272a;
      flex-shrink: 0; padding: 0 14px; gap: 4px;
      overflow-x: auto;
    }
    .mcp-tabs-header::-webkit-scrollbar { display: none; } /* Safari and Chrome */
    .mcp-tabs-header { -ms-overflow-style: none; scrollbar-width: none; } /* Firefox */
    .mcp-tab {
      flex: 1; text-align: center;
      padding: 10px 12px; cursor: pointer;
      font-size: 13px; font-weight: 400; color: #71717a;
      position: relative; white-space: nowrap;
      transition: color 0.15s;
    }
    .mcp-tab:hover { color: #a1a1aa; }
    .mcp-tab.active {
      color: #f4f4f5;
    }
    .mcp-tab.active::after {
      content: '';
      position: absolute;
      bottom: -1px; left: 0; width: 100%; height: 2px;
      background: #ffffff;
      box-shadow: 0 0 10px 1px rgba(167, 139, 250, 0.4), 0 -2px 8px rgba(255, 255, 255, 0.8), 0 0 12px 2px rgba(99, 102, 241, 0.5);
      border-radius: 2px;
      z-index: 10;
    }

    /* ===== CONTENT AREA ===== */
    .mcp-tabs-container {
      flex: 1; padding: 16px; overflow-y: auto;
    }
    .mcp-tabs-container::-webkit-scrollbar { width: 6px; }
    .mcp-tabs-container::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 3px; }
    .mcp-tabs-container::-webkit-scrollbar-track { background: transparent; }

    .mcp-tab-content { display: none; flex-direction: column; gap: 14px; }
    .mcp-tab-content.active { display: flex; animation: fadeIn 0.15s ease both; }
    .mcp-tab-content.flex-column { flex-direction: column; }
    .mcp-tab-content.flex-column.active { display: flex; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    /* ===== FOOTER ===== */
    .mcp-footer {
      display: flex; align-items: center; justify-content: center;
      padding: 6px 16px; border-top: 1px solid #27272a; flex-shrink: 0;
    }
    .footer-text {
      font-size: 10px; color: #555;
      font-family: 'SF Mono', Consolas, 'Courier New', monospace;
    }

    /* ===== STATUS BAR ===== */
    .status-bar {
      display: flex; align-items: center; gap: 10px; padding: 12px 16px;
      border-radius: 8px;
      background: linear-gradient(180deg, #27272a 0%, #1c1c1e 100%);
      border: 1px solid #3f3f46;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05);
    }
    .status-dot {
      display: inline-block; width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
      position: relative;
    }
    .status-dot.online { 
      background: #5eead4; 
      box-shadow: 0 0 8px rgba(94, 234, 212, 0.8);
    }
    .status-dot.online::after {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      border-radius: 50%;
      border: 1px solid #5eead4;
      animation: statusBreathe 2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
    }
    @keyframes statusBreathe {
      0% { transform: scale(1); opacity: 0.8; }
      100% { transform: scale(2.5); opacity: 0; }
    }
    .status-dot.offline { background: #f14c4c; }
    .status-lbl { font-size: 13px; font-weight: 600; letter-spacing: 0.3px; }
    .status-text.online { color: #5eead4; text-shadow: 0 0 10px rgba(94,234,212,0.3); }
    .status-text.offline { color: #f14c4c; }
    .status-port {
      margin-left: auto;
      font-family: 'SF Mono', Consolas, 'Courier New', monospace;
      font-size: 11px; color: #a1a1aa;
      background: rgba(0,0,0,0.25);
      padding: 4px 8px;
      border-radius: 4px; border: 1px solid #3f3f46;
    }

    /* ===== STATS LIST ===== */
    .stats-list {
      background: #27272a; border: 1px solid #3f3f46; border-radius: 6px;
      padding: 4px 0; position: relative;
    }
    .stat-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 7px 14px;
    }
    .stat-row + .stat-row { border-top: 1px solid #27272a; }
    .stat-label {
      font-size: 11px; text-transform: uppercase; letter-spacing: 1px;
      color: #858585; font-weight: 600;
    }
    .stat-value {
      font-family: 'SF Mono', Consolas, 'Courier New', monospace;
      font-size: 14px; font-weight: 600; color: #e0e0e0;
    }
    .stat-row-clickable {
      cursor: pointer; border-radius: 4px; transition: background 0.15s;
      position: relative;
    }
    .stat-row-clickable:hover { background: rgba(255,255,255,0.05); }
    .stat-row-clickable:hover .stat-label { color: #a0a0a0; }
    .clients-popover {
      position: absolute; left: 8px; right: 8px;
      background: #1c1c1e; border: 1px solid #3f3f46; border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5); z-index: 999;
      overflow: hidden; margin-top: 2px;
    }
    .clients-popover-title {
      font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.08em; color: #858585; padding: 8px 12px 6px;
      border-bottom: 1px solid #2a2a2e;
    }
    .clients-popover-list { padding: 4px 0; }
    .clients-popover-item {
      display: flex; align-items: center; gap: 8px;
      padding: 7px 12px; font-size: 12px;
    }
    .clients-popover-item + .clients-popover-item { border-top: 1px solid #2a2a2e; }
    .clients-popover-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: #22c55e; flex-shrink: 0;
      box-shadow: 0 0 4px rgba(34,197,94,0.6);
    }
    .clients-popover-name { color: #e0e0e0; font-weight: 600; flex: 1; }
    .clients-popover-ver { color: #858585; font-size: 11px; }
    .clients-popover-ago { color: #6b7280; font-size: 11px; margin-left: auto; }
    .clients-popover-empty {
      padding: 10px 12px; color: #6b7280; font-size: 12px; text-align: center;
    }
    .value-changed { animation: valueFlash 0.5s ease-out; }
    @keyframes valueFlash {
      0% { color: #38bdf8; }
      100% { color: #e4e4e7; }
    }

    /* ===== PROJECT CARD ===== */
    .project-card {
      background: #27272a; border: 1px solid #3f3f46;
      border-radius: 6px; padding: 12px 14px;
    }
    .proj-header {
      display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
    }
    .proj-name {
      font-size: 14px; font-weight: 600; color: #e0e0e0;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .proj-ver {
      font-family: 'SF Mono', Consolas, 'Courier New', monospace; font-size: 10px;
      padding: 2px 7px; border-radius: 3px; flex-shrink: 0;
      background: #3f3f46; border: 1px solid #52525b; color: #a1a1aa;
    }
    .proj-details { display: flex; flex-direction: column; gap: 4px; }
    .proj-row { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .proj-key {
      font-size: 10px; font-weight: 600; color: #858585;
      text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0; width: 42px;
    }
    .proj-val {
      font-family: 'SF Mono', Consolas, 'Courier New', monospace; font-size: 11px;
      color: #999;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .proj-uptime { color: #5eead4; }

    /* ===== SECTION HEADERS ===== */
    .control-header { display: flex; flex-direction: column; gap: 4px; }
    .control-header h3 {
      font-size: 13px; font-weight: 600; color: #e0e0e0; margin: 0;
    }
    .control-header p { color: #858585; font-size: 12px; line-height: 1.5; margin: 0; }

    .divider { height: 1px; background: #3f3f46; }

    /* ===== BUTTONS ===== */
    .btn {
      border: 1px solid #3f3f46; border-radius: 6px;
      padding: 9px 14px; font-size: 13px; font-weight: 500;
      color: #e4e4e7; background: #27272a;
      box-shadow: 0 1px 2px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05);
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      gap: 6px; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      font-family: inherit; position: relative; overflow: hidden;
    }
    .btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1);
      border-color: #52525b;
    }
    .btn:active {
      transform: translateY(0);
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.3); border-color: transparent !important;
    }
    .btn::before {
      content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
      transform: skewX(-20deg); transition: 0s;
    }
    .btn:hover::before { animation: btnShine 0.6s ease-out; }
    @keyframes btnShine { 100% { left: 200%; } }

    .btn-primary { background: linear-gradient(180deg, #0ea5e9, #0284c7); color: #fff; border-color: #0284c7; text-shadow: 0 1px 1px rgba(0,0,0,0.2); }
    .btn-primary:hover { background: linear-gradient(180deg, #38bdf8, #0ea5e9); border-color: #0ea5e9; box-shadow: 0 4px 12px rgba(14,165,233,0.3); }

    .btn-success {
      background: linear-gradient(180deg, rgba(16,185,129,0.1), rgba(5,150,105,0.15));
      color: #34d399; border-color: rgba(16,185,129,0.3);
    }
    .btn-success:hover {
      background: linear-gradient(180deg, rgba(16,185,129,0.15), rgba(5,150,105,0.25));
      border-color: rgba(16,185,129,0.6); color: #6ee7b7; box-shadow: 0 4px 12px rgba(16,185,129,0.15), inset 0 1px 0 rgba(255,255,255,0.05);
    }

    .btn-danger {
      background: linear-gradient(180deg, rgba(239,68,68,0.1), rgba(220,38,38,0.15));
      color: #f87171; border-color: rgba(239,68,68,0.3);
    }
    .btn-danger:hover {
      background: linear-gradient(180deg, rgba(239,68,68,0.15), rgba(220,38,38,0.25));
      border-color: rgba(239,68,68,0.6); color: #fca5a5; box-shadow: 0 4px 12px rgba(239,68,68,0.15), inset 0 1px 0 rgba(255,255,255,0.05);
    }

    .btn-holo-btn {
      background: linear-gradient(180deg, #27272a, #18181b); color: #7dd3fc;
      border-color: #3f3f46;
    }
    .btn-holo-btn:hover {
      background: linear-gradient(180deg, #3f3f46, #27272a);
      border-color: #0ea5e9; color: #bae6fd;
      box-shadow: 0 4px 12px rgba(14,165,233,0.15), inset 0 1px 0 rgba(255,255,255,0.05);
    }
    .btn-disabled { opacity: 0.35; pointer-events: none; }
    .button-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .full-width { width: 100%; }

    /* ===== IDE CARDS ===== */
    .ide-status-list { display: flex; flex-direction: column; gap: 6px; }
    .ide-card {
      background: #27272a; border: 1px solid #3f3f46;
      border-radius: 4px; padding: 9px 14px;
      display: flex; align-items: center; justify-content: space-between;
      transition: border-color 0.15s;
    }
    .ide-card:hover { border-color: #555; }
    .ide-info { display: flex; align-items: center; gap: 10px; }
    .ide-title { font-size: 12px; font-weight: 500; color: #cccccc; }
    .ide-status { font-size: 11px; color: #858585; }
    .ide-status.ready {
      color: #5eead4; background: rgba(94,234,212,0.1);
      border: 1px solid rgba(94,234,212,0.25); padding: 2px 8px; border-radius: 3px;
    }
    .ide-status.unready { color: #858585; }
    .config-ide-btn { padding: 5px 10px !important; font-size: 11px !important; }

    /* ===== TOGGLE SWITCH ===== */
    .tool-toggle {
      grid-area: toggle; align-self: center; justify-self: flex-end;
      appearance: none; -webkit-appearance: none; width: 44px; height: 26px; flex-shrink: 0;
      background: #27272a; border: none;
      border-radius: 20px; position: relative; cursor: pointer; transition: 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
      outline: none;
    }
    .tool-toggle::after {
      content: ''; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px;
      background: #71717a; border-radius: 50%; transition: 0.3s cubic-bezier(0.2, 0.8, 0.2, 1.2);
    }
    .tool-toggle:checked {
      background: #ffffff;
      box-shadow: 0 0 16px 2px rgba(255, 255, 255, 0.25);
    }
    .tool-toggle:checked::after { transform: translateX(18px); background: #18181b; }
    .tool-toggle:disabled { opacity: 0.4; cursor: not-allowed; }

    /* ===== FORM INPUTS ===== */
    .setting-input, .setting-select, .license-input {
      background: #3f3f46; border: 1px solid #555;
      border-radius: 3px; color: #cccccc;
      font-family: 'SF Mono', Consolas, 'Courier New', monospace;
      font-size: 12px; padding: 5px 8px; outline: none; transition: border-color 0.15s;
    }
    .setting-input { width: 84px; height: 28px; text-align: right; }
    .setting-select { height: 28px; cursor: pointer; }
    .setting-input:focus, .setting-select:focus, .license-input:focus {
      border-color: #0ea5e9;
    }
    .license-input { flex: 1; height: 32px; padding: 0 10px; font-size: 11px; letter-spacing: 0.5px; }
    .license-input::placeholder { color: #555; }

    /* ===== SETTING ITEMS ===== */
    .setting-item { display: flex; align-items: center; justify-content: space-between; min-height: 36px; gap: 12px; }
    .setting-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
    .setting-label { font-size: 12px; font-weight: 500; color: #cccccc; }
    .setting-hint { font-size: 11px; color: #858585; line-height: 1.4; }
    .settings-card {
      background: #27272a; border: 1px solid #3f3f46;
      border-radius: 4px; padding: 14px; display: flex; flex-direction: column; gap: 12px;
    }
    .setting-warn {
      font-size: 11px; color: #f14c4c; background: rgba(241,76,76,0.08);
      border: 1px solid rgba(241,76,76,0.25); border-radius: 3px; padding: 8px 12px;
    }

    /* ===== TOOL TOGGLES ===== */
    .tool-toggle-list { display: flex; flex-direction: column; gap: 14px; padding-bottom: 12px; }
    .tool-wrapper { display: flex; flex-direction: column; }
    .tool-row {
      background: #18181b; border: 1px solid #27272a;
      border-radius: 12px; padding: 18px 20px;
      display: grid; grid-template-columns: 1fr auto; 
      grid-template-areas: "name name" "desc toggle";
      row-gap: 24px; column-gap: 16px; align-items: end;
      cursor: pointer; transition: border-color 0.2s, box-shadow 0.2s, background 0.2s, transform 0.2s;
    }
    .tool-row:hover { border-color: #3f3f46; background: #1a1a1e; box-shadow: 0 8px 24px rgba(0,0,0,0.3); transform: translateY(-1px); }
    .tool-row.expanded { border-radius: 12px 12px 0 0; border-bottom-color: transparent; }
    
    .tool-info { display: contents; } /* Allows children into css grid */
    .tool-name-row { grid-area: name; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; align-self: start; }
    .tool-name { font-size: 16px; font-weight: 700; color: #ffffff; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; letter-spacing: -0.01em; margin-bottom: 2px; }
    .tool-desc { grid-area: desc; font-size: 13px; color: #a1a1aa; line-height: 1.4; }
    
    .action-count-badge, .core-badge {
      display: inline-flex; align-items: center;
      padding: 3px 8px; border-radius: 4px; border: 1px solid #3f3f46;
      font-size: 11px; color: #a1a1aa; background: transparent; font-family: 'SF Mono', Consolas, monospace;
    }
    .pro-badge {
      display: inline-flex; align-items: center;
      padding: 3px 8px; border-radius: 4px; border: 1px solid #fde047;
      font-size: 11px; font-weight: 700; letter-spacing: 0.3px;
      background: #fde047; color: #18181b;
    }
    .pro-extra-badge {
      display: inline-flex; align-items: center;
      padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;
      background: transparent; color: #fde047; border: 1px solid #fde047;
    }
    .pro-lock-icon { grid-area: toggle; align-self: end; justify-self: end; font-size: 20px; opacity: 0.5; margin-bottom: 2px; }
    .pro-locked { opacity: 0.6; }
    .pro-locked:hover { opacity: 0.9; }
    .pro-locked-text { color: #71717a !important; }

    /* ===== ACTION PANEL ===== */
    .action-panel {
      background: #18181b; border: 1px solid #27272a;
      border-top: none; border-radius: 0 0 12px 12px;
      max-height: 0; opacity: 0; padding: 0 20px;
      transition: max-height 0.25s ease, opacity 0.2s ease, padding 0.25s ease;
      overflow: hidden;
    }
    .action-panel.open { max-height: 600px; opacity: 1; padding: 12px 20px 20px; }
    .action-grid { display: flex; flex-wrap: wrap; gap: 5px; }
    .action-chip {
      padding: 3px 8px; border-radius: 4px; background: #27272a;
      border: 1px solid #3f3f46; font-size: 10.5px;
      font-family: 'SF Mono', Consolas, 'Courier New', monospace; color: #a1a1aa;
    }
    .action-chip-pro {
      border-style: dashed !important; border-color: rgba(245,158,11,0.4) !important;
      color: #d97706 !important; background: rgba(245,158,11,0.08); opacity: 1;
    }
    .action-chip-locked {
      border-style: dashed !important; border-color: #52525b !important;
      color: #a1a1aa !important; background: transparent; opacity: 1;
    }

    /* ===== GUIDE STEPS ===== */
    .guide-steps { display: flex; flex-direction: column; gap: 8px; }
    .guide-step {
      display: flex; gap: 12px; padding: 12px 14px;
      background: #27272a; border: 1px solid #3f3f46;
      border-radius: 4px; align-items: flex-start;
    }
    .step-number {
      width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; color: #38bdf8;
      background: rgba(14,165,233,0.12); border: 1px solid rgba(14,165,233,0.28);
    }
    .step-content { display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .step-title { font-size: 13px; font-weight: 600; color: #e0e0e0; }
    .step-desc { font-size: 12px; color: #858585; line-height: 1.5; }

    .prompt-list { display: flex; flex-direction: column; gap: 6px; }
    .prompt-card {
      background: #27272a; border: 1px solid #3f3f46;
      border-radius: 4px; padding: 10px 12px;
      display: flex; align-items: flex-start; gap: 10px; cursor: pointer;
      text-align: left; transition: border-color 0.15s; font-family: inherit;
    }
    .prompt-card:hover { border-color: #555; }
    .prompt-tag {
      font-size: 10px; font-weight: 600; letter-spacing: 0.5px; flex-shrink: 0;
      padding: 3px 7px; border-radius: 3px;
      background: rgba(14,165,233,0.1); border: 1px solid rgba(14,165,233,0.28); color: #7dd3fc;
    }
    .prompt-text { font-size: 12px; color: #999; line-height: 1.5; flex: 1; }
    .prompt-copy {
      color: #555; font-size: 13px; cursor: pointer;
      padding: 2px 5px; transition: color 0.15s; background: none; border: none;
    }
    .prompt-copy:hover, .prompt-copy.copied { color: #5eead4; }
    .guide-tips .tips-title { font-size: 12px; font-weight: 600; color: #cccccc; margin-bottom: 8px; }
    .tips-list { margin: 0; padding-left: 18px; list-style: disc; }
    .tips-list li { font-size: 11px; color: #858585; margin-bottom: 4px; line-height: 1.5; }

    /* ===== INFO / RESULT BOXES ===== */
    .info-box {
      background: #27272a; border: 1px solid #3f3f46;
      border-radius: 4px; padding: 11px 14px;
      font-size: 11px; color: #858585; line-height: 1.6;
    }
    .config-result {
      display: flex; align-items: center; gap: 8px; padding: 9px 12px;
      border-radius: 4px; font-size: 12px;
      border: 1px solid #3f3f46; background: #27272a;
    }
    .config-result.success { background: rgba(94,234,212,0.08); border-color: rgba(94,234,212,0.25); color: #5eead4; }
    .config-result.error { background: rgba(241,76,76,0.08); border-color: rgba(241,76,76,0.25); color: #f14c4c; }

    /* ===== LICENSE CARD ===== */
    .license-card {
      background: #27272a; border: 1px solid #3f3f46;
      border-radius: 4px; padding: 14px; display: flex; flex-direction: column; gap: 12px;
    }
    .license-badge { display: flex; align-items: center; gap: 8px; }
    .license-edition { font-size: 14px; font-weight: 600; color: #e0e0e0; font-family: 'SF Mono', Consolas, 'Courier New', monospace; }
    .license-state { padding: 3px 8px; border-radius: 3px; font-size: 11px; font-weight: 500; }
    .license-state.community { border: 1px solid #3f3f46; color: #858585; }
    .license-state.active { border: 1px solid rgba(94,234,212,0.35); color: #5eead4; background: rgba(94,234,212,0.08); }
    .license-state.expired { border: 1px solid rgba(241,76,76,0.35); color: #f14c4c; background: rgba(241,76,76,0.08); }
    .license-state.no-key { border: 1px solid rgba(14,165,233,0.35); color: #7dd3fc; background: rgba(14,165,233,0.08); }
    .license-detail { font-size: 12px; color: #858585; display: flex; gap: 12px; }
    .license-error { font-size: 12px; color: #f14c4c; }
    .license-input-row { display: flex; gap: 8px; }
    .btn-activate { flex-shrink: 0; min-width: 58px; height: 32px; padding: 0 12px; }
    .license-hint { font-size: 11px; color: #555; line-height: 1.4; }

    /* ===== EMPTY STATE ===== */
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 28px 16px; gap: 12px; }
    .empty-state-icon { font-size: 32px; opacity: 0.3; }
    .empty-state-text { font-size: 13px; color: #858585; text-align: center; line-height: 1.6; }

    /* ===== STOP CONFIRM ===== */
    .btn-danger.confirming { animation: confirmPulse 0.8s infinite; }
    @keyframes confirmPulse {
      0%,100% { box-shadow: 0 0 0 0 rgba(241,76,76,0.4); }
      50% { box-shadow: 0 0 0 4px rgba(241,76,76,0); }
    }

    /* ===== COPYABLE ===== */
    .copyable { cursor: pointer; position: relative; }
    .copyable:hover { opacity: 0.75; }
    .copy-toast {
      position: absolute; top: -22px; left: 50%; transform: translateX(-50%);
      background: #5eead4; color: #000; font-size: 10px; padding: 2px 8px; border-radius: 3px;
      white-space: nowrap; pointer-events: none; animation: toastFade 1s ease forwards;
    }
    @keyframes toastFade {
      0% { opacity: 1; transform: translateX(-50%) translateY(0); }
      100% { opacity: 0; transform: translateX(-50%) translateY(-8px); }
    }

    /* ===== INJECT BUTTON FEEDBACK ===== */
    .config-ide-btn.inject-success { background: rgba(94,234,212,0.12) !important; border-color: rgba(94,234,212,0.3) !important; color: #5eead4 !important; }
    .config-ide-btn.inject-fail { background: rgba(241,76,76,0.12) !important; border-color: rgba(241,76,76,0.3) !important; color: #f14c4c !important; }
    .config-ide-btn.inject-active { background: rgba(251,146,60,0.1) !important; border-color: rgba(251,146,60,0.35) !important; color: #fb923c !important; }

    /* ===== REFRESH SPIN ===== */
    @keyframes refreshSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    /* ===== SKELETON LOADER ===== */
    .stats-list.loading .stat-value {
      background: linear-gradient(90deg, #27272a 25%, #3f3f46 50%, #27272a 75%);
      background-size: 200% 100%;
      animation: skeletonShimmer 1.5s ease-in-out infinite;
      color: transparent !important; border-radius: 3px;
      min-width: 40px; display: inline-block;
    }
    @keyframes skeletonShimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* ===== UPDATE BANNER ===== */
    .update-banner {
      border-radius: 6px; padding: 12px 14px;
      background: rgba(14,165,233,0.08); border: 1px solid rgba(14,165,233,0.28);
      display: flex; flex-direction: column; gap: 10px;
    }
    .update-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
    .update-title { font-size: 13px; font-weight: 600; color: #7dd3fc; }
    .update-kind-badge {
      font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 10px;
      white-space: nowrap; letter-spacing: 0.3px;
    }
    .update-kind-badge.hotpatch {
      background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.4); color: #4ade80;
    }
    .update-kind-badge.coldpatch {
      background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.35); color: #fbbf24;
    }
    .update-kind-badge.full {
      background: rgba(14,165,233,0.12); border: 1px solid rgba(14,165,233,0.35); color: #7dd3fc;
    }
    .update-ver-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .update-ver-label { font-size: 11px; color: #858585; }
    .update-ver-value {
      font-family: 'SF Mono', Consolas, 'Courier New', monospace;
      font-size: 11px; color: #bae6fd; font-weight: 600;
    }
    .update-arrow { font-size: 12px; color: #858585; }
    .update-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .update-meta-item { font-size: 11px; color: #666; }
    .update-meta-item span { color: #888; }
    .update-files-list {
      font-size: 10px; color: #5a5a5a; background: rgba(0,0,0,0.15);
      border-radius: 3px; padding: 5px 8px; font-family: 'SF Mono', Consolas, monospace;
      max-height: 48px; overflow: hidden;
    }
    .update-changelog {
      font-size: 11px; color: #999; line-height: 1.5;
      background: rgba(0,0,0,0.2); border-radius: 3px;
      padding: 7px 10px; border-left: 2px solid rgba(14,165,233,0.4);
      max-height: 60px; overflow: hidden; text-overflow: ellipsis;
    }
    .update-breaking {
      font-size: 11px; color: #f59e0b;
      background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.25);
      border-radius: 3px; padding: 6px 10px;
    }
    .update-actions { display: flex; gap: 8px; align-items: center; }
    .update-progress-wrap {
      display: flex; flex-direction: column; gap: 5px;
    }
    .update-progress-bar {
      height: 4px; border-radius: 2px; background: #3f3f46; overflow: hidden;
    }
    .update-progress-fill {
      height: 100%; background: linear-gradient(90deg, #0ea5e9, #14b8a6); border-radius: 2px;
      transition: width 0.3s ease;
    }
    .update-progress-text { font-size: 11px; color: #858585; }
    .update-done-msg {
      font-size: 12px; color: #5eead4; font-weight: 500;
    }
    .update-done-msg.no-restart { color: #4ade80; }
    .update-error-msg { font-size: 12px; color: #f14c4c; }
    .update-notify-btn {
      color: #7dd3fc !important;
      border: 1px solid rgba(14,165,233,0.35) !important;
      background: rgba(14,165,233,0.1) !important;
      border-radius: 3px;
    }
    .update-notify-btn:hover { background: rgba(14,165,233,0.18) !important; }
    @keyframes updatePulse {
      0%,100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
    .update-notify-btn { animation: updatePulse 2.5s ease-in-out infinite; }

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
    clientsRow: '#clientsRow', clientsPopover: '#clientsPopover', clientsPopoverList: '#clientsPopoverList',
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
    updateBanner: '#updateBanner',
    updateBtn: '#updateBtn',
    appLoading: '#appLoading',
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

    if (self.$.langBtn) {
      self.$.langBtn.addEventListener('click', () => {
        applyI18n(currentLang === 'zh' ? 'en' : 'zh');
      });
    }

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
        'tree', 'list', 'stats', 'node_detail', 'find_by_path', 'get_components',
        'get_parent', 'get_children', 'get_sibling', 'get_world_position',
        'get_world_rotation', 'get_world_scale', 'get_active_in_hierarchy',
        'find_nodes_by_name', 'find_nodes_by_component', 'get_component_property',
        'get_node_components_properties', 'get_camera_info', 'get_canvas_info', 'get_scene_globals',
        'get_current_selection', 'get_active_scene_focus',
        'list_all_scenes', 'validate_scene', 'detect_2d_3d',
        'list_available_components',
        'measure_distance', 'scene_snapshot', 'scene_diff',
        'performance_audit', 'export_scene_json',
        'deep_validate_scene',
        'get_node_bounds', 'find_nodes_by_layer', 'get_animation_state', 'get_collider_info',
        'get_material_info', 'get_light_info', 'get_scene_environment',
        'screen_to_world', 'world_to_screen',
        'check_script_ready', 'get_script_properties',
      ],
      scene_operation: [
        'create_node', 'destroy_node', 'reparent',
        'set_position', 'set_rotation', 'set_scale',
        'set_world_position', 'set_world_rotation', 'set_world_scale',
        'set_name', 'set_active', 'duplicate_node',
        'move_node_up', 'move_node_down', 'set_sibling_index', 'reset_transform',
        'add_component', 'remove_component', 'set_property', 'reset_property', 'call_component_method',
        'ensure_2d_canvas', 'set_anchor_point', 'set_content_size',
        'create_prefab', 'instantiate_prefab',
        'enter_prefab_edit', 'exit_prefab_edit',
        'apply_prefab', 'restore_prefab', 'validate_prefab',
        'copy_node', 'paste_node', 'cut_node',
        'move_array_element', 'remove_array_element', 'execute_component_method',
        // Pro-only actions below
        'lock_node', 'unlock_node', 'hide_node', 'unhide_node', 'set_layer',
        'clear_children', 'reset_node_properties',
        'batch', 'batch_set_property', 'group_nodes', 'align_nodes',
        'clipboard_copy', 'clipboard_paste',
        'create_ui_widget', 'setup_particle', 'audio_setup', 'setup_physics_world',
        'create_skeleton_node', 'generate_tilemap', 'create_primitive',
        'set_camera_look_at', 'set_camera_property', 'camera_screenshot',
        'set_material_property', 'set_material_define', 'assign_builtin_material',
        'assign_project_material', 'clone_material', 'swap_technique', 'sprite_grayscale',
        'create_light', 'set_light_property', 'set_scene_environment',
        'bind_event', 'unbind_event', 'list_events',
        'attach_script', 'set_component_properties', 'detach_script',
      ],
      asset_operation: [
        'list', 'info', 'create', 'save', 'delete', 'move', 'copy', 'rename',
        'import', 'open', 'refresh', 'create_folder',
        'get_meta', 'set_meta_property',
        'uuid_to_url', 'url_to_uuid', 'search_by_type',
        // Pro-only actions below
        'reimport', 'get_dependencies', 'get_dependents', 'show_in_explorer',
        'clean_unused', 'pack_atlas', 'get_animation_clips', 'get_materials',
        'validate_asset', 'export_asset_manifest',
        'create_material', 'generate_script', 'batch_import', 'get_asset_size', 'slice_sprite',
      ],
      editor_action: [
        'save_scene', 'open_scene', 'new_scene', 'undo', 'redo',
        'get_selection', 'select', 'clear_selection',
        'project_info',
        'preview', 'preview_refresh',
        'build', 'build_query',
        'play_in_editor',
        'focus_node', 'log', 'warn', 'error', 'clear_console', 'show_notification',
        'change_gizmo_tool', 'query_gizmo_tool_name',
        'change_gizmo_pivot', 'query_gizmo_pivot',
        'change_gizmo_coordinate', 'query_gizmo_coordinate',
        'change_is2D', 'query_is2D',
        'set_grid_visible', 'query_is_grid_visible',
        'set_icon_gizmo_3d', 'query_is_icon_gizmo_3d',
        'set_icon_gizmo_size', 'query_icon_gizmo_size',
        'align_node_with_view', 'align_view_with_node',
        'soft_reload', 'query_dirty',
        'snapshot', 'snapshot_abort', 'cancel_recording',
        // Pro-only actions below
        'build_with_config', 'build_status', 'preview_status',
        'send_message', 'open_panel', 'close_panel', 'query_panels', 'get_packages',
        'reload_plugin', 'inspect_asset', 'open_preferences', 'open_project_settings',
        'move_scene_camera', 'take_scene_screenshot',
        'set_transform_tool', 'set_coordinate', 'toggle_grid', 'toggle_snap',
        'get_console_logs', 'search_logs', 'set_view_mode', 'zoom_to_fit',
      ],
      preferences: ['get', 'set', 'list', 'get_global', 'set_global', 'get_project', 'set_project'],
      broadcast: ['poll', 'history', 'clear', 'send', 'send_ipc'],
      tool_management: ['list_all', 'enable', 'disable', 'get_stats'],
      execute_script: [],
      register_custom_macro: [],
      animation_tool: ['create_clip', 'play', 'pause', 'resume', 'stop', 'get_state', 'list_clips', 'set_current_time', 'set_speed', 'crossfade'],
      physics_tool: ['get_collider_info', 'add_collider', 'set_collider_size', 'add_rigidbody', 'set_rigidbody_props', 'set_physics_material', 'set_collision_group', 'get_physics_world', 'set_physics_world', 'add_joint'],
      create_prefab_atomic: [],
      import_and_apply_texture: [],
      setup_ui_layout: [],
      create_tween_animation_atomic: [],
      auto_fit_physics_collider: [],
      // Pro-exclusive tools
      engine_action: ['get_engine_info', 'set_engine_config', 'reload_scripts', 'clear_cache', 'gc', 'get_runtime_stats', 'set_design_resolution', 'get_supported_platforms'],
      reference_image: ['add', 'remove', 'list', 'set_transform', 'set_opacity', 'toggle_visibility', 'clear_all'],
      scene_generator: ['create_scene', 'create_ui_page', 'create_game_level', 'create_menu', 'describe_intent'],
      batch_engine: ['find_and_modify', 'find_and_delete', 'find_and_add_component', 'find_and_remove_component', 'find_and_set_property', 'find_and_reparent', 'transform_all', 'rename_pattern', 'set_layer_recursive', 'toggle_active_recursive'],
      scene_audit: ['full_audit', 'check_performance', 'check_hierarchy', 'check_components', 'check_assets', 'check_physics', 'check_ui', 'auto_fix', 'export_report'],
    };

    // Pro 独占工具（社区版永远不会注册的）
    const PRO_EXCLUSIVE_TOOLS = new Set([
      'engine_action', 'reference_image',
      'scene_generator', 'batch_engine', 'scene_audit',
    ]);

    // Pro 版工具展示顺序
    const PRO_TOOL_ORDER = [
      'bridge_status',
      'scene_query', 'scene_operation', 'asset_operation', 'editor_action',
      'preferences', 'broadcast', 'tool_management',
      'execute_script', 'register_custom_macro',
      'animation_tool', 'physics_tool',
      'create_prefab_atomic', 'import_and_apply_texture', 'setup_ui_layout',
      'create_tween_animation_atomic', 'auto_fit_physics_collider',
      'engine_action', 'reference_image',
      'scene_generator', 'batch_engine', 'scene_audit',
    ];
    self._toolEnabled = {};
    try { self._toolEnabled = JSON.parse(localStorage.getItem('mcp-tool-enabled') || '{}'); } catch { }
    let _lastToolDataKey = '';

    function renderToolToggles(toolNames, toolActions, toolStates, licenseStatus) {
      const container = self.$.toolToggleList;
      if (!container) return;

      const proLicensed = !!(
        licenseStatus &&
        licenseStatus.licenseValid &&
        licenseStatus.edition &&
        licenseStatus.edition !== 'community'
      );

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
      const dataKey = JSON.stringify({ mergedNames, toolActions, toolStates, currentLang, proLicensed });
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
        // 已激活 Pro：以服务端从 JSON Schema 解析的 action 为准（与顶栏 totalActionCount 一致）；
        // 未激活时仍用静态目录做「社区版 vs Pro 能力」对比展示。
        const displayActions = proLicensed
          ? (currentActions.length > 0 ? currentActions : (proActions.length > 0 ? proActions : currentActions))
          : (proActions.length > 0 ? proActions : currentActions);

        // Determine how many extra Pro actions exist for this tool
        const currentActionSet = registeredActionSets[name] || new Set();
        const hasProExtras = !proLicensed && isRegistered && proActions.length > currentActions.length;
        const usingServerActions = proLicensed && isRegistered && currentActions.length > 0;

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

        nameRow.appendChild(nameSpan);
        if (isCore) {
          const badge = document.createElement('span');
          badge.className = 'core-badge';
          badge.textContent = dict['ctrl.tools_core'] || '(core)';
          nameRow.appendChild(badge);
        }

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
            const isAvailable = isRegistered && (usingServerActions ? currentActionSet.has(a) : (proLicensed || currentActionSet.has(a)));
            const isProOnlyAction = isRegistered && !proLicensed && !currentActionSet.has(a);
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
    self._refreshInFlight = false;
    self._refreshPending = false;
    self._refreshSeq = 0;

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

    // ---- Clients Popover ----
    self._connectedClients = [];
    self.$.clientsRow.addEventListener('click', (e) => {
      e.stopPropagation();
      const popover = self.$.clientsPopover;
      const isOpen = popover.style.display !== 'none';
      if (isOpen) {
        popover.style.display = 'none';
        return;
      }
      // 渲染客户端列表
      const clients = self._connectedClients || [];
      const now = Date.now();
      if (clients.length === 0) {
        self.$.clientsPopoverList.innerHTML = `<div class="clients-popover-empty">暂无已连接的 AI 客户端</div>`;
      } else {
        self.$.clientsPopoverList.innerHTML = clients.map(c => {
          const ageSec = Math.floor((now - c.lastSeenMs) / 1000);
          const agoStr = ageSec < 60 ? '刚刚' : ageSec < 3600 ? `${Math.floor(ageSec / 60)} 分钟前` : `${Math.floor(ageSec / 3600)} 小时前`;
          const ver = c.version ? `<span class="clients-popover-ver">v${c.version}</span>` : '';
          return `<div class="clients-popover-item">
            <span class="clients-popover-dot"></span>
            <span class="clients-popover-name">${c.name}</span>
            ${ver}
            <span class="clients-popover-ago">${agoStr}</span>
          </div>`;
        }).join('');
      }
      popover.style.display = '';
    });
    // 点击外部关闭 popover
    document.addEventListener('click', () => {
      if (self.$.clientsPopover) self.$.clientsPopover.style.display = 'none';
    });

    const ideBtns = self.$.app.querySelectorAll('.config-ide-btn');
    ideBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const button = e.currentTarget;
        const targetIDE = button && button.getAttribute ? button.getAttribute('data-ide') : null;
        if (!button || !targetIDE) {
          self.showConfigResult({ success: false, message: '配置失败: 无法识别目标 IDE' });
          return;
        }

        const isActive = button.classList.contains('inject-active');
        button.setAttribute('disabled', '');
        button.textContent = isActive ? '⏳ 移除中…' : '⏳ 注入中…';
        try {
          const result = await Promise.race([
            Editor.Message.request(EXTENSION_NAME, isActive ? 'remove-ide' : 'configure-ide', targetIDE),
            new Promise((_, reject) => setTimeout(() => reject(new Error('请求超时，请重试')), CONFIG_REQUEST_TIMEOUT_MS)),
          ]);
          self.showConfigResult(result);
          if (result.success) {
            button.removeAttribute('disabled');
            setTimeout(() => self.refreshStatus(), 500);
          } else {
            button.removeAttribute('disabled');
            button.textContent = isActive ? '取消注入' : '注入配置';
            button.classList.add('inject-fail');
            setTimeout(() => button.classList.remove('inject-fail'), 2000);
          }
        } catch (err) {
          self.showConfigResult({ success: false, message: `操作失败: ${err.message || err}` });
          button.removeAttribute('disabled');
          button.textContent = isActive ? '取消注入' : '注入配置';
          button.classList.add('inject-fail');
          setTimeout(() => button.classList.remove('inject-fail'), 2000);
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

    // ---- Update notification button ----
    if (self.$.updateBtn) {
      self.$.updateBtn.addEventListener('click', () => {
        // 滚动到 Status Tab 并显示更新横幅
        const statusTab = self.$.app.querySelector('[data-target="tabStatus"]');
        if (statusTab) statusTab.click();
        if (self.$.updateBanner) {
          self.$.updateBanner.style.display = 'flex';
          self.$.updateBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    }

    if (self.$.refreshBtn) {
      self.$.refreshBtn.addEventListener('click', () => {
        self.$.refreshBtn.classList.remove('spinning');
        void self.$.refreshBtn.offsetWidth;
        self.$.refreshBtn.classList.add('spinning');
        self.refreshStatus();
        setTimeout(() => self.$.refreshBtn.classList.remove('spinning'), 700);
      });
    }

    // Defer first fetch so the browser can paint the skeleton frame first
    self._loadingStartTime = Date.now();
    requestAnimationFrame(() => {
      self.refreshStatus();
      pollTimer = setInterval(() => self.refreshStatus(), POLL_INTERVAL);
      // 兜底：最多 5 秒后强制移除加载遮罩，防止极端情况卡住
      setTimeout(() => {
        const loading = self.$.appLoading;
        if (loading && loading.style.display !== 'none') {
          loading.style.opacity = '0';
          setTimeout(() => { loading.style.display = 'none'; }, 260);
        }
      }, 5000);
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
      if (self._refreshInFlight) {
        self._refreshPending = true;
        return;
      }
      self._refreshInFlight = true;
      const requestSeq = ++self._refreshSeq;
      try {
        const info = await Editor.Message.request(EXTENSION_NAME, 'get-service-info');
        if (requestSeq !== self._refreshSeq) return;
        if (info && info.running) {
          self.$.statusDot.className = 'status-dot online';
          self.$.statusText.className = 'status-text online';
          self.$.statusText.textContent = 'Online';
          self.$.startBtn.classList.add('btn-disabled');
          self.$.stopBtn.classList.remove('btn-disabled');
          self.$.ctrlStatusLabel.textContent = '运行中';
          self.$.ctrlStatusLabel.style.color = '#22c55e';
          self.$.bentoGrid.classList.remove('loading');
          self.$.bentoGrid.style.display = '';
          self.$.emptyState.style.display = 'none';
          self.$.portValue.textContent = String(info.port);
          self.$.endpointValue.textContent = info.bridgeBase ? `${info.bridgeBase}/mcp` : '-';
          self.$.projectName.textContent = info.projectName || '-';
          self.$.projectPath.textContent = info.projectPath || '-';
          self.$.editorVersion.textContent = info.editorVersion || '-';

          self.updateWithFlash(self.$.connectionCount, info.connectionCount ?? 0);
          self._connectedClients = info.connectedClients || [];
          self.updateWithFlash(self.$.toolCount, info.toolCount ?? 0);
          self.updateWithFlash(self.$.totalActionCount, info.totalActionCount ?? 0);
          self.updateWithFlash(self.$.uptime, self.formatUptime(info.uptime ?? 0));

          // Render tool toggles
          if (info.allToolNames && info.toolEnabledStates) {
            self._toolEnabled = { ...self._toolEnabled, ...info.toolEnabledStates };
          }
          if ((info.allToolNames || info.toolNames) && self._renderToolToggles) {
            self._renderToolToggles(
              info.allToolNames || info.toolNames,
              info.toolActions || {},
              info.toolEnabledStates || {},
              info.licenseStatus,
            );
          }

          if (info.settings) {
            self.applySettingsToUI(info.settings);
          }


          if (info.configStatus) {
            const updateStat = (id, ideKey, exists) => {
              const el = self.$[id];
              el.textContent = exists ? '配置已就绪' : '未检测到配置';
              el.className = `ide-status ${exists ? 'ready' : 'unready'}`;
              // 同步按钮状态
              const btn = self.$.app.querySelector(`.config-ide-btn[data-ide="${ideKey}"]`);
              if (btn && !btn.hasAttribute('disabled')) {
                if (exists) {
                  btn.textContent = '取消注入';
                  btn.classList.add('inject-active');
                } else {
                  btn.textContent = '注入配置';
                  btn.classList.remove('inject-active');
                }
              }
            };
            updateStat('statusCursor', 'cursor', info.configStatus.cursor);
            updateStat('statusWindsurf', 'windsurf', info.configStatus.windsurf);
            updateStat('statusClaude', 'claude', info.configStatus.claude);
            updateStat('statusTrae', 'trae', info.configStatus.trae);
            updateStat('statusKiro', 'kiro', info.configStatus.kiro);
            updateStat('statusAntigravity', 'antigravity', info.configStatus.antigravity);
            updateStat('statusGeminiCli', 'gemini-cli', info.configStatus['gemini-cli']);
            updateStat('statusCodex', 'codex', info.configStatus.codex);
            updateStat('statusClaudeCode', 'claude-code', info.configStatus['claude-code']);
            updateStat('statusCodebuddy', 'codebuddy', info.configStatus.codebuddy);
            updateStat('statusComate', 'comate', info.configStatus.comate);
          }
        } else {
          self.setOffline();
        }

        // Always update license badge regardless of running state
        if (info && info.licenseStatus) {
          self.updateLicenseUI(info.licenseStatus);
        }
        // Update banner
        if (info && info.updatePhase) {
          self.renderUpdateBanner(info.updatePhase);
        }
      } catch (e) {
        if (requestSeq !== self._refreshSeq) return;
        console.warn('[Aura] refreshStatus 异常:', e);
        self.setOffline();
      } finally {
        self._refreshInFlight = false;
        // 首次加载完成后淡出遮罩，最短显示 2 秒
        if (!self._firstLoadDone) {
          self._firstLoadDone = true;
          const loading = self.$.appLoading;
          if (loading) {
            const elapsed = Date.now() - (self._loadingStartTime || 0);
            const remaining = Math.max(0, 2000 - elapsed);
            setTimeout(() => {
              loading.style.opacity = '0';
              setTimeout(() => { loading.style.display = 'none'; }, 260);
            }, remaining);
          }
        }
        if (self._refreshPending) {
          self._refreshPending = false;
          setTimeout(() => self.refreshStatus(), 0);
        }
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

    renderUpdateBanner(up) {
      const self = this;
      const banner = self.$.updateBanner;
      /** 字节数格式化：1536 → "1.5 KB" */
      function _fmtBytes(n) {
        if (!n || n <= 0) return '';
        if (n < 1024)        return `${n} B`;
        if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
        return `${(n / 1024 / 1024).toFixed(1)} MB`;
      }
      const updateBtn = self.$.updateBtn;
      if (!banner || !up) return;
      const dict = (self._I18N && self._I18N[self._currentLang]) || {};
      const t = (key, fallback) => dict[key] || fallback;

      if (up.phase === 'idle' || up.phase === 'checking' || up.phase === 'up-to-date') {
        banner.style.display = 'none';
        if (updateBtn) updateBtn.style.display = 'none';
        return;
      }

      banner.style.display = 'flex';
      if (updateBtn) updateBtn.style.display = 'inline-flex';

      if (up.phase === 'available') {
        const info = up.info || {};
        const kind = info.kind || 'full';
        const noRestart = info.requiresRestart === false;

        // 更新类型徽章
        const kindLabel = kind === 'hotpatch'
          ? t('update.kind.hotpatch', '热补丁 · 无需重启')
          : kind === 'coldpatch'
            ? t('update.kind.coldpatch', '小包更新 · 需重启')
            : t('update.kind.full', '完整更新 · 需重启');

        let html = `<div class="update-header">
          <span class="update-title">${t('update.available', '新版本可用')}</span>
          <span class="update-kind-badge ${kind}">${kindLabel}</span>
        </div>`;
        html += `<div class="update-ver-row">
          <span class="update-ver-label">${t('update.current', '当前')}:</span>
          <span class="update-ver-value">${info.currentVersion || '-'}</span>
          <span class="update-arrow">→</span>
          <span class="update-ver-label">${t('update.latest', '最新')}:</span>
          <span class="update-ver-value">${info.latestVersion || '-'}</span>
        </div>`;

        // 补丁元信息：文件数 + 大小
        if (kind !== 'full' && (info.changedFiles || info.patchSize)) {
          const fileCount = info.changedFiles ? info.changedFiles.length : 0;
          const sizeStr   = info.patchSize ? _fmtBytes(info.patchSize) : '';
          html += `<div class="update-meta">`;
          if (fileCount) html += `<span class="update-meta-item">${fileCount} ${t('update.files.changed', '个文件变更')}</span>`;
          if (sizeStr)   html += `<span class="update-meta-item">${t('update.size', '大小')}: <span>${sizeStr}</span></span>`;
          html += `</div>`;
          if (info.changedFiles && info.changedFiles.length > 0) {
            html += `<div class="update-files-list">${info.changedFiles.slice(0, 5).join('<br>')}</div>`;
          }
        }

        if (info.changelog) {
          html += `<div class="update-changelog">${info.changelog}</div>`;
        }
        if (info.breaking) {
          html += `<div class="update-breaking">${t('update.breaking', '⚠ 重要更新，建议备份后升级')}</div>`;
        }

        const btnLabel = noRestart
          ? t('update.apply', '立即应用')
          : t('update.download', '下载更新');
        html += `<div class="update-actions">
          <button class="btn btn-primary" id="doDownloadBtn" style="padding:6px 14px;font-size:12px;">${btnLabel}</button>
        </div>`;
        banner.innerHTML = html;
        const dlBtn = banner.querySelector('#doDownloadBtn');
        if (dlBtn) {
          dlBtn.addEventListener('click', () => { self.handleDownloadUpdate(dlBtn); });
        }
        return;
      }

      if (up.phase === 'downloading' || up.phase === 'verifying') {
        const pct = up.phase === 'verifying' ? 100 : (up.progress || 0);
        const label = up.phase === 'verifying' ? t('update.verifying', '校验中...') : `${t('update.downloading', '下载中')} ${pct}%`;
        banner.innerHTML = `
          <div class="update-header"><span class="update-title">${label}</span></div>
          <div class="update-progress-wrap">
            <div class="update-progress-bar">
              <div class="update-progress-fill" style="width:${pct}%"></div>
            </div>
            <span class="update-progress-text">${pct}%</span>
          </div>`;
        return;
      }

      if (up.phase === 'ready') {
        const info = up.info || {};
        const noRestart = info.requiresRestart === false;
        const installLabel = noRestart
          ? t('update.install.hotpatch', '立即应用（无需重启）')
          : t('update.install', '安装并重启');
        banner.innerHTML = `
          <div class="update-header"><span class="update-title">v${info.latestVersion || ''} ${t('update.ready', '下载完成')}</span></div>
          <div class="update-progress-wrap">
            <div class="update-progress-bar"><div class="update-progress-fill" style="width:100%"></div></div>
            <span class="update-progress-text">✓ SHA256 校验通过</span>
          </div>
          <div class="update-actions">
            <button class="btn btn-primary" id="doInstallBtn" style="padding:6px 14px;font-size:12px;">${installLabel}</button>
          </div>`;
        const instBtn = banner.querySelector('#doInstallBtn');
        if (instBtn) {
          instBtn.addEventListener('click', () => { self.handleInstallUpdate(instBtn); });
        }
        return;
      }

      if (up.phase === 'installing') {
        banner.innerHTML = `<div class="update-header"><span class="update-title">${t('update.installing', '安装中...')}</span></div>
          <div class="update-progress-wrap">
            <div class="update-progress-bar"><div class="update-progress-fill" style="width:100%;animation:updatePulse 1s infinite"></div></div>
          </div>`;
        return;
      }

      if (up.phase === 'done') {
        const noRestart = up.requiresRestart === false;
        const doneMsg = noRestart
          ? t('update.done.hotpatch', '✅ 热更新完成，插件已自动重载，无需重启编辑器')
          : t('update.done', '✅ 更新完成，请重启 Cocos Creator 生效');
        banner.innerHTML = `<div class="update-done-msg${noRestart ? ' no-restart' : ''}">${doneMsg}</div>`;
        if (updateBtn) updateBtn.style.display = 'none';
        return;
      }

      if (up.phase === 'error') {
        banner.innerHTML = `
          <div class="update-error-msg">✗ ${t('update.error', '更新失败')}: ${up.message || ''}</div>
          <div class="update-actions">
            <button class="btn" id="doRetryBtn" style="padding:5px 12px;font-size:11px;">${t('update.retry', '重试')}</button>
          </div>`;
        const retryBtn = banner.querySelector('#doRetryBtn');
        if (retryBtn) {
          retryBtn.addEventListener('click', async () => {
            await Editor.Message.request(EXTENSION_NAME, 'reset-update-state');
            await Editor.Message.request(EXTENSION_NAME, 'check-for-updates');
            setTimeout(() => self.refreshStatus(), 500);
          });
        }
        return;
      }
    },

    async handleDownloadUpdate(btn) {
      if (btn) { btn.setAttribute('disabled', ''); btn.textContent = '下载中...'; }
      try {
        await Editor.Message.request(EXTENSION_NAME, 'download-update');
        // 面板会通过 3s 轮询自动更新进度
      } catch (err) {
        console.error('[Aura] 下载更新失败:', err);
      }
    },

    async handleInstallUpdate(btn) {
      if (btn) { btn.setAttribute('disabled', ''); btn.textContent = '安装中...'; }
      try {
        await Editor.Message.request(EXTENSION_NAME, 'install-update');
      } catch (err) {
        console.error('[Aura] 安装更新失败:', err);
      }
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
        // 实际 MCP 仍走社区版工具；仅表示本机带有 Pro .node。角标与工具数需一致，避免误显示为 Pro。
        self.$.licenseEdition.textContent = t('license.edition_community_pro_inactive', 'Community (Pro not activated)');
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
        if (badgeInner) badgeInner.textContent = t('badge.community', 'Community');
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
