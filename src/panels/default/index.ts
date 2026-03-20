// @ts-nocheck
"use strict";
const EXTENSION_NAME = 'aura-for-cocos';
const EXTENSION_VERSION = '1.0.14';
const POLL_INTERVAL = 3000;
const CONFIG_REQUEST_TIMEOUT_MS = 10000;

let pollTimer = null;

module.exports = Editor.Panel.define({
  template: /* html */ `\n
    <div class="mcp-panel" id="app">

      <!-- Brand Line -->
      <div class="brand-line"></div>

      <!-- Header -->
      <div class="panel-header">
        <div class="logo-icon"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAABqklEQVRIie2UPU/CQADH/3ctFBQSE4cujm5u+gUcnfwEji5+AhcXFxc/gYuLi5OJiYmDg4ODMTExMRoTE6MxGl9iKFB67V17vBTjwE1N7v+7/+/u2gP+e6j+DZcAqAAUgCIiLYBuALqIaI8A9wC4BcBtAN4A8AaANwC8AeANAG8AeAPAGwDeAPAGgDcAvAHgDQBvAHgDwBsA3gDwBoA3ALwB4A0AbwB4A8AbAN4A8AaANwC8AeANAG8AeAPAGwDeAPAGgDcAvAHgDQBvAHgDwBsA3gDwBoA3ALwB4A0AbwB4A8AbAN4A8AaAN/4A8AaANwC8AeANAG8AeAPAGwDeAPAGgDcAvAHgDQBvAHgDwBsA3gDwBoA3ALwB4A0AbwB4A8AbAN4A8AaANwC8AeANAG8AeAPAGwDeAPAGgDcAvAHgDQBvAHgDwBsA3gDwBoA3ALwB4A0AbwB4A8AbAN4A8AaANwC8AeANAG/8AeANAG8AeAPAGwDeAPAGgDcAvAHgDQBvAHgDwBsA3gDwBoA3ALwB4A0AbwB4A8AbAN4A8AaAN/6/8Q3SaGv8FjMJHwAAAABJRU5ErkJggg==" /></div>
        <span class="brand-txt">Aura</span>
        <div class="holo-badge" id="holoBadge"><div class="holo-badge-inner" data-i18n="badge.community">Community</div></div>
        <div class="header-actions">
          <button id="updateBtn" class="ghost-btn update-notify-btn" style="display:none;" data-i18n="update.notify">有更新</button>
          <button id="langBtn" class="ghost-btn">中/EN</button>
          <button id="refreshBtn" class="ghost-btn" data-i18n="footer.sync">Sync</button>
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
              <div class="stat-row">
                <span class="stat-label" data-i18n="status.clients">CLIENTS</span>
                <span class="stat-value" id="connectionCount">-</span>
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
    html, body { background: #1e1e1e !important; margin: 0; padding: 0; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :host { background: #1e1e1e; display: block; height: 100%; }

    .mcp-panel {
      color: #cccccc;
      font-size: 13px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      height: 100%; display: flex; flex-direction: column;
      background: #1e1e1e;
      user-select: none; position: relative; overflow: hidden;
    }

    /* ===== BRAND LINE ===== */
    .brand-line {
      height: 2px; width: 100%; flex-shrink: 0;
      background: #7c3aed;
    }

    /* ===== HEADER ===== */
    .panel-header {
      display: flex; align-items: center; padding: 10px 16px; gap: 8px;
      background: #181818;
      border-bottom: 1px solid #2d2d2d;
      flex-shrink: 0;
    }
    .logo-icon {
      width: 22px; height: 22px; flex-shrink: 0; border-radius: 5px; overflow: hidden;
    }
    .logo-icon img { width: 100%; height: 100%; display: block; }
    .brand-txt { font-size: 14px; font-weight: 700; color: #e0e0e0; letter-spacing: -0.3px; }
    .holo-badge {
      display: inline-block; font-size: 10px; font-weight: 600; letter-spacing: 0.5px;
    }
    .holo-badge-inner {
      display: inline-block;
      background: #2d2d2d; color: #a78bfa;
      padding: 2px 8px; border-radius: 3px;
      font-size: 10px; border: 1px solid rgba(124,58,237,0.3);
    }
    .header-actions {
      margin-left: auto; display: flex; gap: 4px;
    }
    .ghost-btn {
      background: transparent; border: none; font-size: 11px; font-family: inherit;
      color: #858585; cursor: pointer; padding: 4px 8px; border-radius: 3px;
      transition: color 0.15s, background 0.15s;
    }
    .ghost-btn:hover { color: #cccccc; background: rgba(255,255,255,0.06); }
    .ghost-btn.spinning { animation: refreshSpin 0.6s ease-in-out; }

    /* ===== TAB NAVIGATION ===== */
    .mcp-tabs-header {
      display: flex; background: #181818;
      border-bottom: 1px solid #2d2d2d;
      flex-shrink: 0; padding: 0 12px; gap: 0;
    }
    .mcp-tab {
      padding: 8px 14px; cursor: pointer;
      font-size: 12px; font-weight: 500; color: #858585;
      border-bottom: 2px solid transparent;
      transition: color 0.15s, border-color 0.15s;
    }
    .mcp-tab:hover { color: #cccccc; }
    .mcp-tab.active {
      color: #ffffff;
      border-bottom-color: #7c3aed;
    }

    /* ===== CONTENT AREA ===== */
    .mcp-tabs-container {
      flex: 1; padding: 16px; overflow-y: auto;
    }
    .mcp-tabs-container::-webkit-scrollbar { width: 6px; }
    .mcp-tabs-container::-webkit-scrollbar-thumb { background: #3c3c3c; border-radius: 3px; }
    .mcp-tabs-container::-webkit-scrollbar-track { background: transparent; }

    .mcp-tab-content { display: none; flex-direction: column; gap: 14px; }
    .mcp-tab-content.active { display: flex; animation: fadeIn 0.15s ease both; }
    .mcp-tab-content.flex-column { flex-direction: column; }
    .mcp-tab-content.flex-column.active { display: flex; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    /* ===== FOOTER ===== */
    .mcp-footer {
      display: flex; align-items: center; justify-content: center;
      padding: 6px 16px; border-top: 1px solid #2d2d2d; flex-shrink: 0;
    }
    .footer-text {
      font-size: 10px; color: #555;
      font-family: 'SF Mono', Consolas, 'Courier New', monospace;
    }

    /* ===== STATUS BAR ===== */
    .status-bar {
      display: flex; align-items: center; gap: 10px; padding: 10px 14px;
      border-radius: 4px;
      background: #252526; border: 1px solid #3c3c3c;
    }
    .status-dot {
      display: inline-block; width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
    }
    .status-dot.online { background: #5eead4; }
    .status-dot.offline { background: #f14c4c; }
    .status-lbl { font-size: 12.5px; font-weight: 500; }
    .status-text.online { color: #5eead4; font-weight: 600; }
    .status-text.offline { color: #f14c4c; }
    .status-port {
      margin-left: auto;
      font-family: 'SF Mono', Consolas, 'Courier New', monospace;
      font-size: 11px; color: #858585;
    }

    /* ===== STATS LIST ===== */
    .stats-list {
      background: #252526; border: 1px solid #3c3c3c; border-radius: 4px;
      padding: 4px 0;
    }
    .stat-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 7px 14px;
    }
    .stat-row + .stat-row { border-top: 1px solid #2d2d2d; }
    .stat-label {
      font-size: 11px; text-transform: uppercase; letter-spacing: 1px;
      color: #858585; font-weight: 600;
    }
    .stat-value {
      font-family: 'SF Mono', Consolas, 'Courier New', monospace;
      font-size: 14px; font-weight: 600; color: #e0e0e0;
    }
    .value-changed { animation: valueFlash 0.5s ease-out; }
    @keyframes valueFlash {
      0% { color: #a78bfa; }
      100% { color: #e0e0e0; }
    }

    /* ===== PROJECT CARD ===== */
    .project-card {
      background: #252526; border: 1px solid #3c3c3c;
      border-radius: 4px; padding: 12px 14px;
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
      background: #2d2d2d; border: 1px solid #3c3c3c; color: #858585;
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

    .divider { height: 1px; background: #3c3c3c; }

    /* ===== BUTTONS ===== */
    .btn {
      border: 1px solid #3c3c3c; border-radius: 4px;
      padding: 8px 12px; font-size: 12px; font-weight: 500;
      color: #cccccc; background: transparent;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      gap: 6px; transition: background 0.15s, border-color 0.15s, color 0.15s;
      font-family: inherit;
    }
    .btn:hover { background: #2d2d2d; border-color: #555; color: #e0e0e0; }
    .btn:active { background: #333; }
    .btn-primary { background: #7c3aed; color: #fff; border-color: #7c3aed; font-weight: 600; }
    .btn-primary:hover { background: #6d28d9; border-color: #6d28d9; color: #fff; }
    .btn-success { background: rgba(94,234,212,0.12); color: #5eead4; border-color: rgba(94,234,212,0.3); }
    .btn-success:hover { background: rgba(94,234,212,0.2); border-color: rgba(94,234,212,0.5); }
    .btn-danger { background: rgba(241,76,76,0.12); color: #f14c4c; border-color: rgba(241,76,76,0.3); }
    .btn-danger:hover { background: rgba(241,76,76,0.2); border-color: rgba(241,76,76,0.5); }
    .btn-holo-btn {
      background: rgba(124,58,237,0.08); color: #a78bfa;
      border: 1px solid rgba(124,58,237,0.3);
    }
    .btn-holo-btn:hover {
      background: rgba(124,58,237,0.16); border-color: rgba(124,58,237,0.5); color: #c4b5fd;
    }
    .btn-disabled { opacity: 0.35; pointer-events: none; }
    .button-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .full-width { width: 100%; }

    /* ===== IDE CARDS ===== */
    .ide-status-list { display: flex; flex-direction: column; gap: 6px; }
    .ide-card {
      background: #252526; border: 1px solid #3c3c3c;
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
      appearance: none; -webkit-appearance: none; width: 36px; height: 20px; flex-shrink: 0;
      background: #3c3c3c; border: 1px solid #555;
      border-radius: 20px; position: relative; cursor: pointer; transition: 0.2s;
    }
    .tool-toggle::after {
      content: ''; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px;
      background: #858585; border-radius: 50%; transition: 0.2s;
    }
    .tool-toggle:checked {
      background: #7c3aed; border-color: #7c3aed;
    }
    .tool-toggle:checked::after { transform: translateX(16px); background: #fff; }
    .tool-toggle:disabled { opacity: 0.4; cursor: not-allowed; }

    /* ===== FORM INPUTS ===== */
    .setting-input, .setting-select, .license-input {
      background: #3c3c3c; border: 1px solid #555;
      border-radius: 3px; color: #cccccc;
      font-family: 'SF Mono', Consolas, 'Courier New', monospace;
      font-size: 12px; padding: 5px 8px; outline: none; transition: border-color 0.15s;
    }
    .setting-input { width: 84px; height: 28px; text-align: right; }
    .setting-select { height: 28px; cursor: pointer; }
    .setting-input:focus, .setting-select:focus, .license-input:focus {
      border-color: #7c3aed;
    }
    .license-input { flex: 1; height: 32px; padding: 0 10px; font-size: 11px; letter-spacing: 0.5px; }
    .license-input::placeholder { color: #555; }

    /* ===== SETTING ITEMS ===== */
    .setting-item { display: flex; align-items: center; justify-content: space-between; min-height: 36px; gap: 12px; }
    .setting-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
    .setting-label { font-size: 12px; font-weight: 500; color: #cccccc; }
    .setting-hint { font-size: 11px; color: #858585; line-height: 1.4; }
    .settings-card {
      background: #252526; border: 1px solid #3c3c3c;
      border-radius: 4px; padding: 14px; display: flex; flex-direction: column; gap: 12px;
    }
    .setting-warn {
      font-size: 11px; color: #f14c4c; background: rgba(241,76,76,0.08);
      border: 1px solid rgba(241,76,76,0.25); border-radius: 3px; padding: 8px 12px;
    }

    /* ===== TOOL TOGGLES ===== */
    .tool-toggle-list { display: flex; flex-direction: column; gap: 5px; }
    .tool-wrapper { display: flex; flex-direction: column; }
    .tool-row {
      background: #252526; border: 1px solid #3c3c3c;
      border-radius: 4px; padding: 9px 14px;
      display: flex; align-items: center; justify-content: space-between;
      border-left: 2px solid transparent; transition: border-color 0.15s, background 0.15s;
    }
    .tool-row:hover { border-color: #555; border-left-color: #555; background: #2a2a2a; }
    .tool-row.expanded { border-left-color: #7c3aed; background: #2a2a2a; }
    .tool-info { display: flex; flex-direction: column; gap: 3px; flex: 1; }
    .tool-name-row { display: flex; align-items: center; gap: 8px; }
    .tool-name { font-size: 12px; font-weight: 500; color: #cccccc; font-family: 'SF Mono', Consolas, 'Courier New', monospace; }
    .tool-desc { font-size: 11px; color: #858585; }
    .action-count-badge, .core-badge {
      display: inline-flex; align-items: center;
      padding: 1px 6px; border-radius: 3px; border: 1px solid #3c3c3c;
      font-size: 10px; color: #858585; background: #2d2d2d;
    }
    .pro-badge {
      display: inline-flex; align-items: center;
      padding: 1px 6px; border-radius: 3px;
      font-size: 9px; font-weight: 700; letter-spacing: 0.5px;
      background: #7c3aed; color: #fff;
    }
    .pro-extra-badge {
      display: inline-flex; align-items: center;
      padding: 1px 6px; border-radius: 3px; font-size: 9px; font-weight: 600;
      background: rgba(124,58,237,0.12); color: #a78bfa; border: 1px solid rgba(124,58,237,0.3);
    }
    .pro-lock-icon { font-size: 14px; opacity: 0.5; flex-shrink: 0; }
    .pro-locked { opacity: 0.45; }
    .pro-locked:hover { opacity: 0.6; }
    .pro-locked-text { color: #555 !important; }

    /* ===== ACTION PANEL ===== */
    .action-panel {
      background: #1e1e1e; border: 1px solid #3c3c3c;
      border-top: none; border-radius: 0 0 4px 4px;
      max-height: 0; opacity: 0; padding: 0 12px;
      transition: max-height 0.25s ease, opacity 0.2s ease, padding 0.25s ease;
      overflow: hidden;
    }
    .action-panel.open { max-height: 300px; opacity: 1; padding: 10px 12px; }
    .action-grid { display: flex; flex-wrap: wrap; gap: 4px; }
    .action-chip {
      padding: 2px 7px; border-radius: 3px; background: #2d2d2d;
      border: 1px solid #3c3c3c; font-size: 10px;
      font-family: 'SF Mono', Consolas, 'Courier New', monospace; color: #999;
    }
    .action-chip-pro { opacity: 0.5; border-style: dashed !important; }
    .action-chip-locked { opacity: 0.3; border-style: dashed !important; color: #555 !important; }

    /* ===== GUIDE STEPS ===== */
    .guide-steps { display: flex; flex-direction: column; gap: 8px; }
    .guide-step {
      display: flex; gap: 12px; padding: 12px 14px;
      background: #252526; border: 1px solid #3c3c3c;
      border-radius: 4px; align-items: flex-start;
    }
    .step-number {
      width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; color: #a78bfa;
      background: rgba(124,58,237,0.15); border: 1px solid rgba(124,58,237,0.3);
    }
    .step-content { display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .step-title { font-size: 13px; font-weight: 600; color: #e0e0e0; }
    .step-desc { font-size: 12px; color: #858585; line-height: 1.5; }

    .prompt-list { display: flex; flex-direction: column; gap: 6px; }
    .prompt-card {
      background: #252526; border: 1px solid #3c3c3c;
      border-radius: 4px; padding: 10px 12px;
      display: flex; align-items: flex-start; gap: 10px; cursor: pointer;
      text-align: left; transition: border-color 0.15s; font-family: inherit;
    }
    .prompt-card:hover { border-color: #555; }
    .prompt-tag {
      font-size: 10px; font-weight: 600; letter-spacing: 0.5px; flex-shrink: 0;
      padding: 3px 7px; border-radius: 3px;
      background: rgba(124,58,237,0.12); border: 1px solid rgba(124,58,237,0.3); color: #a78bfa;
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
      background: #252526; border: 1px solid #3c3c3c;
      border-radius: 4px; padding: 11px 14px;
      font-size: 11px; color: #858585; line-height: 1.6;
    }
    .config-result {
      display: flex; align-items: center; gap: 8px; padding: 9px 12px;
      border-radius: 4px; font-size: 12px;
      border: 1px solid #3c3c3c; background: #252526;
    }
    .config-result.success { background: rgba(94,234,212,0.08); border-color: rgba(94,234,212,0.25); color: #5eead4; }
    .config-result.error { background: rgba(241,76,76,0.08); border-color: rgba(241,76,76,0.25); color: #f14c4c; }

    /* ===== LICENSE CARD ===== */
    .license-card {
      background: #252526; border: 1px solid #3c3c3c;
      border-radius: 4px; padding: 14px; display: flex; flex-direction: column; gap: 12px;
    }
    .license-badge { display: flex; align-items: center; gap: 8px; }
    .license-edition { font-size: 14px; font-weight: 600; color: #e0e0e0; font-family: 'SF Mono', Consolas, 'Courier New', monospace; }
    .license-state { padding: 3px 8px; border-radius: 3px; font-size: 11px; font-weight: 500; }
    .license-state.community { border: 1px solid #3c3c3c; color: #858585; }
    .license-state.active { border: 1px solid rgba(94,234,212,0.35); color: #5eead4; background: rgba(94,234,212,0.08); }
    .license-state.expired { border: 1px solid rgba(241,76,76,0.35); color: #f14c4c; background: rgba(241,76,76,0.08); }
    .license-state.no-key { border: 1px solid rgba(167,139,250,0.35); color: #a78bfa; background: rgba(167,139,250,0.08); }
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

    /* ===== REFRESH SPIN ===== */
    @keyframes refreshSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    /* ===== SKELETON LOADER ===== */
    .stats-list.loading .stat-value {
      background: linear-gradient(90deg, #2d2d2d 25%, #3c3c3c 50%, #2d2d2d 75%);
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
      border-radius: 4px; padding: 12px 14px;
      background: rgba(124,58,237,0.08); border: 1px solid rgba(124,58,237,0.3);
      display: flex; flex-direction: column; gap: 10px;
    }
    .update-header { display: flex; align-items: center; justify-content: space-between; }
    .update-title { font-size: 13px; font-weight: 600; color: #a78bfa; }
    .update-ver-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .update-ver-label { font-size: 11px; color: #858585; }
    .update-ver-value {
      font-family: 'SF Mono', Consolas, 'Courier New', monospace;
      font-size: 11px; color: #c4b5fd; font-weight: 600;
    }
    .update-arrow { font-size: 12px; color: #858585; }
    .update-changelog {
      font-size: 11px; color: #999; line-height: 1.5;
      background: rgba(0,0,0,0.2); border-radius: 3px;
      padding: 7px 10px; border-left: 2px solid rgba(124,58,237,0.4);
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
      height: 4px; border-radius: 2px; background: #3c3c3c; overflow: hidden;
    }
    .update-progress-fill {
      height: 100%; background: #7c3aed; border-radius: 2px;
      transition: width 0.3s ease;
    }
    .update-progress-text { font-size: 11px; color: #858585; }
    .update-done-msg {
      font-size: 12px; color: #5eead4; font-weight: 500;
    }
    .update-error-msg { font-size: 12px; color: #f14c4c; }
    .update-notify-btn {
      color: #a78bfa !important;
      border: 1px solid rgba(124,58,237,0.35) !important;
      background: rgba(124,58,237,0.08) !important;
      border-radius: 3px;
    }
    .update-notify-btn:hover { background: rgba(124,58,237,0.16) !important; }
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
        'create_prefab','instantiate_prefab',
        'enter_prefab_edit','exit_prefab_edit',
        'apply_prefab','restore_prefab','validate_prefab',
        'copy_node','paste_node','cut_node',
        'move_array_element','remove_array_element','execute_component_method',
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
        'play_in_editor',
        'focus_node','log','warn','error','clear_console','show_notification',
        'change_gizmo_tool','query_gizmo_tool_name',
        'change_gizmo_pivot','query_gizmo_pivot',
        'change_gizmo_coordinate','query_gizmo_coordinate',
        'change_is2D','query_is2D',
        'set_grid_visible','query_is_grid_visible',
        'set_icon_gizmo_3d','query_is_icon_gizmo_3d',
        'set_icon_gizmo_size','query_icon_gizmo_size',
        'align_node_with_view','align_view_with_node',
        'soft_reload','query_dirty',
        'snapshot','snapshot_abort','cancel_recording',
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

    // ---- Update notification button ----
    self.$.updateBtn.addEventListener('click', () => {
      // 滚动到 Status Tab 并显示更新横幅
      const statusTab = self.$.app.querySelector('[data-target="tabStatus"]');
      if (statusTab) statusTab.click();
      if (self.$.updateBanner) {
        self.$.updateBanner.style.display = 'flex';
        self.$.updateBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });

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
          self.$.bentoGrid.style.display = '';
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
        // Update banner
        if (info && info.updatePhase) {
          self.renderUpdateBanner(info.updatePhase);
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

    renderUpdateBanner(up) {
      const self = this;
      const banner = self.$.updateBanner;
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
        let html = `<div class="update-header"><span class="update-title">${t('update.available','🎉 新版本可用')}</span></div>`;
        html += `<div class="update-ver-row">
          <span class="update-ver-label">${t('update.current','当前')}:</span>
          <span class="update-ver-value">${info.currentVersion || '-'}</span>
          <span class="update-arrow">→</span>
          <span class="update-ver-label">${t('update.latest','最新')}:</span>
          <span class="update-ver-value">${info.latestVersion || '-'}</span>
        </div>`;
        if (info.changelog) {
          html += `<div class="update-changelog">${info.changelog}</div>`;
        }
        if (info.breaking) {
          html += `<div class="update-breaking">${t('update.breaking','⚠ 重要更新，建议备份后升级')}</div>`;
        }
        html += `<div class="update-actions">
          <button class="btn btn-primary" id="doDownloadBtn" style="padding:6px 14px;font-size:12px;">${t('update.download','立即下载')}</button>
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
        const label = up.phase === 'verifying' ? t('update.verifying','校验中...') : `${t('update.downloading','下载中')} ${pct}%`;
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
        banner.innerHTML = `
          <div class="update-header"><span class="update-title">${t('update.available','🎉 新版本可用')} v${info.latestVersion || ''}</span></div>
          <div class="update-progress-wrap">
            <div class="update-progress-bar"><div class="update-progress-fill" style="width:100%"></div></div>
            <span class="update-progress-text">✓ 下载完成，SHA256 校验通过</span>
          </div>
          <div class="update-actions">
            <button class="btn btn-primary" id="doInstallBtn" style="padding:6px 14px;font-size:12px;">${t('update.install','安装并重启')}</button>
          </div>`;
        const instBtn = banner.querySelector('#doInstallBtn');
        if (instBtn) {
          instBtn.addEventListener('click', () => { self.handleInstallUpdate(instBtn); });
        }
        return;
      }

      if (up.phase === 'installing') {
        banner.innerHTML = `<div class="update-header"><span class="update-title">${t('update.installing','安装中...')}</span></div>
          <div class="update-progress-wrap">
            <div class="update-progress-bar"><div class="update-progress-fill" style="width:100%;animation:updatePulse 1s infinite"></div></div>
          </div>`;
        return;
      }

      if (up.phase === 'done') {
        banner.innerHTML = `<div class="update-done-msg">${t('update.done','✅ 更新完成，请重启 Cocos Creator 生效')}</div>`;
        if (updateBtn) updateBtn.style.display = 'none';
        return;
      }

      if (up.phase === 'error') {
        banner.innerHTML = `
          <div class="update-error-msg">✗ ${t('update.error','更新失败')}: ${up.message || ''}</div>
          <div class="update-actions">
            <button class="btn" id="doRetryBtn" style="padding:5px 12px;font-size:11px;">${t('update.retry','重试')}</button>
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
      const self = this;
      if (btn) { btn.setAttribute('disabled', ''); btn.textContent = '下载中...'; }
      try {
        await Editor.Message.request(EXTENSION_NAME, 'download-update');
        // 面板会通过 3s 轮询自动更新进度
      } catch (err) {
        console.error('[Aura] 下载更新失败:', err);
      }
    },

    async handleInstallUpdate(btn) {
      const self = this;
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
