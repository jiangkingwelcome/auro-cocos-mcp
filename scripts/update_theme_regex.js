const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'src', 'panels', 'default', 'index.ts');
let content = fs.readFileSync(targetFile, 'utf8');

const newTemplate = `
    <div class="mcp-panel" id="app">

      <!-- ====== 顶部标签页导航 ====== -->
      <div class="mcp-tabs-header">
        <div class="mcp-tab active" data-target="tabStatus" data-i18n="tab.status">状态</div>
        <div class="mcp-tab" data-target="tabControl" data-i18n="tab.control">控制</div>
        <div class="mcp-tab" data-target="tabConfig" data-i18n="tab.config">互联</div>
        <div class="mcp-tab" data-target="tabSettings" data-i18n="tab.settings">设置</div>
        <div class="mcp-tab" data-target="tabGuide" data-i18n="tab.guide">📖 指南</div>
        <div class="tab-indicator"></div>
      </div>

      <!-- ====== 内容容器 ====== -->
      <div class="mcp-tabs-container">

        <!-- 1. 服务状态 Tab -->
        <div class="mcp-tab-content active" id="tabStatus">
          <div class="s3-bento">
            <div class="s3-tile"><div class="s3-tile-label" data-i18n="status.tools">暴露工具数</div><div class="s3-tile-value val-white" id="toolCount">-</div><div class="s3-tile-sub">tools exposed</div></div>
            <div class="s3-tile"><div class="s3-tile-label" data-i18n="status.actions">可调用行为</div><div class="s3-tile-value val-white" id="totalActionCount">-</div><div class="s3-tile-sub">total actions</div></div>
            <div class="s3-tile"><div class="s3-tile-label" data-i18n="status.clients">已连接 AI</div><div class="s3-tile-value val-blue" id="connectionCount">-</div><div class="s3-tile-sub" style="justify-content:flex-start;"><span id="statusDot" class="status-dot offline"></span><span id="statusText" class="status-text offline">Offline</span></div></div>
            <div class="s3-tile"><div class="s3-tile-label" data-i18n="status.port">监听端口</div><div class="s3-tile-value val-white" id="portValue">-</div><div class="s3-tile-sub"><span id="uptime">00:00:00</span></div></div>
            <div class="s3-tile wide"><div class="s3-tile-label" data-i18n="status.project">当前项目</div><div class="s3-tile-value val-white" style="font-size:22px;" id="projectName">-</div><div class="s3-tile-sub" style="margin-top: 8px; justify-content: space-between;"><span>Engine: <span id="editorVersion" style="color:#a1a1aa"></span> &nbsp;·&nbsp; 端点: <span id="endpointValue" style="color:#a1a1aa"></span></span><code id="projectPath">-</code></div></div>
          </div>
        </div>

        <!-- 2. 服务控制 Tab -->
        <div class="mcp-tab-content flex-column" id="tabControl">
          <div class="control-header">
            <h3 data-i18n="ctrl.title">服务管理</h3>
            <p data-i18n="ctrl.desc">管理底层的 MCP 中继服务节点。</p>
          </div>
            
          <div class="button-grid">
            <button id="startBtn" class="btn" data-i18n="ctrl.start">Start Service</button>
            <button id="stopBtn" class="btn btn-danger" data-i18n="ctrl.stop">Stop Service</button>
          </div>
          <button id="restartBtn" class="btn btn-primary full-width" data-i18n="ctrl.restart">Restart Service</button>

          <div class="divider"></div>

          <div class="control-header">
            <h3 data-i18n="ctrl.tools_title">工具开关</h3>
            <p data-i18n="ctrl.tools_desc">控制 AI 可调用的 MCP 工具。关闭后 AI 将无法看到该工具。</p>
          </div>
          <div id="toolToggleList" class="card-list"></div>
        </div>

        <!-- 3. IDE 互联 Tab -->
        <div class="mcp-tab-content flex-column" id="tabConfig">
          <div class="control-header">
             <h3 data-i18n="cfg.title">IDE 协同配置</h3>
             <p data-i18n="cfg.desc">将当前 Cocos 环境桥接至 AI 编程助手。</p>
          </div>
          
          <div class="card-list ide-status-list">
            <div class="list-item" id="ideCursor">
              <div class="item-info ide-info">
                <span class="item-title ide-title">Cursor</span>
                <span class="badge ide-status" id="statusCursor">检测中...</span>
              </div>
              <button class="btn config-ide-btn" style="padding: 4px 10px; font-size: 12px; height: 26px;" data-ide="cursor">Inject</button>
            </div>
            
            <div class="list-item" id="ideWindsurf">
              <div class="item-info ide-info">
                <span class="item-title ide-title">Windsurf</span>
                <span class="badge ide-status" id="statusWindsurf">检测中...</span>
              </div>
              <button class="btn config-ide-btn" style="padding: 4px 10px; font-size: 12px; height: 26px;" data-ide="windsurf">Inject</button>
            </div>
            
            <div class="list-item" id="ideClaude">
              <div class="item-info ide-info">
                <span class="item-title ide-title">Claude Desktop</span>
                <span class="badge ide-status" id="statusClaude">检测中...</span>
              </div>
              <button class="btn config-ide-btn" style="padding: 4px 10px; font-size: 12px; height: 26px;" data-ide="claude">Inject</button>
            </div>
            
            <div class="list-item" id="ideTrae">
              <div class="item-info ide-info">
                <span class="item-title ide-title">Trae</span>
                <span class="badge ide-status" id="statusTrae">检测中...</span>
              </div>
              <button class="btn config-ide-btn" style="padding: 4px 10px; font-size: 12px; height: 26px;" data-ide="trae">Inject</button>
            </div>
            
            <div class="list-item" id="ideKiro">
              <div class="item-info ide-info">
                <span class="item-title ide-title">Kiro AI IDE</span>
                <span class="badge ide-status" id="statusKiro">检测中...</span>
              </div>
              <button class="btn config-ide-btn" style="padding: 4px 10px; font-size: 12px; height: 26px;" data-ide="kiro">Inject</button>
            </div>
            
            <div class="list-item" id="ideAntigravity">
              <div class="item-info ide-info">
                <span class="item-title ide-title">Antigravity (Agent)</span>
                <span class="badge ide-status" id="statusAntigravity">检测中...</span>
              </div>
              <button class="btn config-ide-btn" style="padding: 4px 10px; font-size: 12px; height: 26px;" data-ide="antigravity">Inject</button>
            </div>
          </div>
            
          <div class="config-result" id="configResult" style="display:none; margin-top: 10px;">
            <span id="configIcon" class="config-icon"></span>
            <span id="configMessage" class="config-msg"></span>
          </div>
            
          <div class="info-box" style="margin-top: 10px;">
             本操作会将当前工作空间的端点合并写入对应 IDE 的 <code>mcp.json</code>，您需要在目标 IDE 中刷新或重启生效。
          </div>
        </div>

        <!-- 4. 设置 Tab -->
        <div class="mcp-tab-content flex-column" id="tabSettings">
          <div class="control-header">
            <h3 data-i18n="settings.title">安全与性能</h3>
            <p data-i18n="settings.desc">配置 MCP Bridge 的安全策略和性能参数。</p>
          </div>

          <div class="card-list">
            <div class="list-item">
              <div class="item-info">
                <span class="item-title setting-label" data-i18n="settings.rate_limit">Rate Limit (req/min)</span>
                <span class="item-desc setting-hint" data-i18n="settings.rate_limit_hint">每分钟允许的最大请求数，范围 10-10000</span>
              </div>
              <input type="number" id="settingRateLimit" class="input" min="10" max="10000" step="10" value="240" />
            </div>

            <div class="list-item">
              <div class="item-info">
                <span class="item-title setting-label" data-i18n="settings.loopback">Localhost Restrict</span>
                <span class="item-desc setting-hint" data-i18n="settings.loopback_hint">开启时仅允许 127.0.0.1 访问</span>
              </div>
              <input type="checkbox" id="settingLoopback" class="toggle" checked />
            </div>
            <div class="setting-warn" id="loopbackWarn" style="display:none;" data-i18n="settings.warn_loopback">⚠ 关闭回环限制将允许外部网络访问，请确保网络安全</div>

            <div class="list-item">
              <div class="item-info">
                <span class="item-title setting-label" data-i18n="settings.body_limit">Max Payload Size</span>
                <span class="item-desc setting-hint" data-i18n="settings.body_limit_hint">单次请求最大体积</span>
              </div>
              <select id="settingBodyLimit" class="input" style="width: 100px; -webkit-appearance: none;">
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

            <div class="list-item">
              <div class="item-info">
                <span class="item-title setting-label" data-i18n="settings.rollback">自动回滚</span>
                <span class="item-desc setting-hint" data-i18n="settings.rollback_hint">开启时，原子操作失败将自动回滚</span>
              </div>
              <input type="checkbox" id="settingRollback" class="toggle" checked />
            </div>
          </div>

          <div class="button-grid" style="margin-top: 12px;">
            <button id="saveSettingsBtn" class="btn btn-primary" data-i18n="settings.save">Save Settings</button>
            <button id="resetSettingsBtn" class="btn" data-i18n="settings.reset">Reset</button>
          </div>

          <div class="config-result" id="settingsResult" style="display:none;">
            <span id="settingsIcon" class="config-icon"></span>
            <span id="settingsMessage" class="config-msg"></span>
          </div>
        </div>

        <!-- 5. 使用指南 Tab -->
        <div class="mcp-tab-content flex-column" id="tabGuide">
          <div class="control-header">
            <h3 data-i18n="guide.title">快速上手</h3>
            <p data-i18n="guide.desc">3 步完成从安装到 AI 驱动开发。</p>
          </div>

          <div class="guide-steps card-list">
            <div class="list-item guide-step">
              <div class="step-number">1</div>
              <div class="item-info step-content">
                <div class="item-title step-title" data-i18n="guide.step1_title">确认服务在线</div>
                <div class="item-desc step-desc" data-i18n="guide.step1_desc">切到「状态」Tab，确认连接状态为 Online。若离线，切到「控制」Tab 点击启动。</div>
              </div>
            </div>
            <div class="list-item guide-step">
              <div class="step-number">2</div>
              <div class="item-info step-content">
                <div class="item-title step-title" data-i18n="guide.step2_title">连接你的 AI IDE</div>
                <div class="item-desc step-desc" data-i18n="guide.step2_desc">切到「互联」Tab，点击 IDE 旁的注射按钮。然后在 IDE 中重启 MCP。</div>
              </div>
            </div>
            <div class="list-item guide-step">
              <div class="step-number">3</div>
              <div class="item-info step-content">
                <div class="item-title step-title" data-i18n="guide.step3_title">开始对话</div>
                <div class="item-desc step-desc" data-i18n="guide.step3_desc">在 IDE 中直接用自然语言描述你想做的操作。</div>
              </div>
            </div>
          </div>

          <div class="divider"></div>

          <div class="control-header">
            <h3 data-i18n="guide.examples_title">💬 提示词示例</h3>
          </div>

          <div class="prompt-list card-list">
            <div class="list-item prompt-card" style="padding: 8px 12px;">
              <span class="prompt-tag badge" data-i18n="guide.tag_scene">场景</span>
              <code class="prompt-text" style="background:transparent; border:none;" data-i18n="guide.prompt1">查看当前场景节点树</code>
              <button class="prompt-copy btn" style="padding:2px 6px; font-size:11px;" title="Copy">📋</button>
            </div>
            <div class="list-item prompt-card" style="padding: 8px 12px;">
              <span class="prompt-tag badge" data-i18n="guide.tag_create">创建</span>
              <code class="prompt-text" style="background:transparent; border:none;" data-i18n="guide.prompt2">创建按钮「开始游戏」</code>
              <button class="prompt-copy btn" style="padding:2px 6px; font-size:11px;" title="Copy">📋</button>
            </div>
          </div>

          <div class="info-box guide-tips">
            <div class="tips-title" data-i18n="guide.tips_title" style="color:var(--text-highlight); font-weight:600; margin-bottom:8px;">💡 Tips</div>
            <ul class="tips-list">
              <li data-i18n="guide.tip1">先选中节点再描述操作，AI 会自动作用于选中对象</li>
              <li data-i18n="guide.tip2">报错自动重试无干预</li>
            </ul>
          </div>
        </div>

      </div>

      <!-- ====== 底部信息 ====== -->
      <div class="mcp-footer">
        <span class="footer-text">v<span id="versionText"></span></span>
        <div class="footer-actions">
          <button id="langBtn" class="ghost-btn" title="Switch Language">中/EN</button>
          <button id="refreshBtn" class="ghost-btn" title="Sync" data-i18n="footer.sync">🔄 Sync</button>
        </div>
      </div>

    </div>
`;

const newCSS = `
    * { box-sizing: border-box; }

    /* ===== Minimalist Dark Theme ===== */
    :root {
      --bg-base: #000000;
      --bg-panel: #09090b;
      --bg-hover: #0f0f11;
      --border-color: #1f1f22;
      --border-hover: #27272a;
      --text-main: #e5e5e5;
      --text-muted: #71717a;
      --text-highlight: #fafafa;
      --accent-color: #fafafa;
      --danger-color: #ef4444;
      --success-color: #22c55e;
      --mono-color: #a1a1aa;
      --card-radius: 6px;
    }

    .mcp-panel {
      color: var(--text-main);
      font-size: 13px;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      height: 100%;
      overflow-y: auto;
      background: var(--bg-base);
      display: flex;
      flex-direction: column;
      user-select: none;
      position: relative;
    }

    .mcp-panel::before {
      content: '';
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
      background-size: 20px 20px;
      z-index: 0;
      pointer-events: none;
    }

    .mcp-tabs-header {
      display: flex;
      background: var(--bg-panel);
      border-bottom: 1px solid var(--border-color);
      flex-shrink: 0;
      position: relative;
      z-index: 1;
    }

    .mcp-tab {
      flex: 1;
      text-align: center;
      padding: 14px 0;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-muted);
      transition: color 0.2s;
    }

    .mcp-tab:hover { color: #a1a1aa; }
    .mcp-tab.active { color: var(--text-highlight); font-weight: 500; }

    .tab-indicator {
      position: absolute;
      bottom: -1px;
      left: 0;
      height: 2px;
      width: 20%;
      background: var(--accent-color);
      transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .mcp-tabs-container {
      flex: 1;
      padding: 24px 20px;
      overflow-y: auto;
      position: relative;
      z-index: 1;
    }
    .mcp-tabs-container::-webkit-scrollbar { width: 4px; }
    .mcp-tabs-container::-webkit-scrollbar-thumb { background: #27272a; border-radius: 2px; }

    .mcp-tab-content { display: none; }
    .mcp-tab-content.active { display: block; animation: fadeIn 0.15s ease-out; }
    .mcp-tab-content.flex-column.active { display: flex; flex-direction: column; gap: 16px; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; transform: translateY(0); } }

    .s3-bento {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .s3-tile {
      background: var(--bg-panel);
      border: 1px solid var(--border-color);
      border-radius: var(--card-radius);
      padding: 16px;
      display: flex;
      flex-direction: column;
      transition: background 0.2s, border-color 0.2s;
    }
    .s3-tile:hover {
      background: var(--bg-hover);
      border-color: var(--border-hover);
    }
    .s3-tile.wide { grid-column: span 2; }
    .s3-tile-label {
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      font-weight: 500;
    }
    .s3-tile-value {
      font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
      font-size: 24px;
      font-weight: 500;
      color: var(--text-highlight);
      line-height: 1.2;
      margin-bottom: 4px;
    }
    .s3-tile-value.val-blue { color: #3b82f6; } 
    .s3-tile-value.val-green { color: var(--text-highlight); }
    .s3-tile-value.val-purple { color: var(--text-highlight); }
    .s3-tile-value.val-amber { color: var(--text-highlight); }
    .s3-tile-value.val-white { color: var(--text-highlight); }
    
    .s3-tile-sub {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: auto;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .status-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .status-dot.online { background: var(--success-color); }
    .status-dot.offline { background: var(--danger-color); }
    
    .status-text.online { color: var(--success-color); font-weight: 600; }
    .status-text.offline { color: var(--danger-color); font-weight: 600; }
    
    .s3-tile-sub code {
      font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
      font-size: 11px;
      color: var(--mono-color);
    }

    .divider { height: 1px; background: var(--border-color); margin: 8px 0; }

    .control-header { margin-bottom: 4px; }
    .control-header h3 {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-highlight);
      margin: 0 0 6px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .control-header p {
      color: var(--text-muted);
      font-size: 13px;
      line-height: 1.5;
      margin: 0;
    }

    /* Cards generic */
    .card-list { display: flex; flex-direction: column; gap: 8px; }
    .list-item, .ide-card, .tool-row, .guide-step, .prompt-card, .settings-card, .tool-wrapper.standalone .tool-row {
      background: var(--bg-panel);
      border: 1px solid var(--border-color);
      border-radius: var(--card-radius);
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: background 0.2s, border-color 0.2s;
    }
    .guide-step, .prompt-card, .ide-card {
      margin-bottom: 0px;
    }
    .list-item:hover, .ide-card:hover, .tool-row:hover, .prompt-card:hover {
      background: var(--bg-hover);
      border-color: var(--border-hover);
    }
    .settings-card {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
      padding: 16px;
    }
    
    .item-info { display: flex; flex-direction: column; gap: 4px; }
    .item-title { font-size: 13px; font-weight: 500; color: var(--text-main); font-family: 'JetBrains Mono', monospace; }
    .item-desc { font-size: 12px; color: var(--text-muted); }

    /* Buttons */
    button { outline: none; font-family: inherit; }
    .btn {
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 8px 12px;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-main);
      background: var(--bg-panel);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .btn:hover { background: #18181b; border-color: var(--border-hover); color: var(--text-highlight); }
    .btn:active { transform: scale(0.99); }
    
    .btn-primary {
      background: var(--text-highlight);
      color: #000;
      border-color: var(--text-highlight);
      font-weight: 600;
    }
    .btn-primary:hover {
      background: #e5e5e5;
      border-color: #e5e5e5;
      color: #000;
    }
    .btn-danger {
      color: var(--danger-color);
      border-color: rgba(239, 68, 68, 0.2);
      background: rgba(239, 68, 68, 0.05);
    }
    .btn-danger:hover {
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.3);
      color: #f87171;
    }
    .button-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .full-width { width: 100%; }

    /* Forms */
    .input {
      background: #000;
      border: 1px solid var(--border-hover);
      border-radius: 4px;
      color: var(--text-main);
      padding: 6px 10px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      outline: none;
      transition: border-color 0.2s;
      width: 90px;
      text-align: right;
    }
    select.input { width: 100px; text-align: left; }
    .input:focus { border-color: #52525b; }

    /* Tool toggles */
    .tool-info { display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .tool-name-row { display: flex; align-items: center; gap: 8px; }
    .tool-name { font-size: 13px; font-weight: 500; color: var(--text-main); font-family: 'JetBrains Mono', monospace; }
    .tool-desc { font-size: 12px; color: var(--text-muted); }
    .core-badge, .action-count-badge {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border-hover);
      font-size: 10px; font-weight: 500; color: var(--mono-color);
    }
    
    .toggle, .tool-toggle {
      appearance: none; -webkit-appearance: none; width: 32px; height: 18px; background: #000;
      border: 1px solid #27272a; border-radius: 9px; position: relative; cursor: pointer; transition: 0.2s;
    }
    .toggle:checked, .tool-toggle:checked { background: var(--text-highlight); border-color: var(--text-highlight); }
    .toggle::after, .tool-toggle::after {
      content: ''; position: absolute; top: 1px; left: 1px; width: 14px; height: 14px;
      background: #71717a; border-radius: 50%; transition: 0.2s;
    }
    .toggle:checked::after, .tool-toggle:checked::after { transform: translateX(14px); background: #000; }
    .toggle:disabled, .tool-toggle:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Tool actions panel drop down */
    .tool-row.expanded {
      border-bottom-left-radius: 0; border-bottom-right-radius: 0;
      background: var(--bg-hover); border-color: var(--border-hover);
    }
    .action-panel {
      background: #000;
      border: 1px solid var(--border-hover);
      border-top: none;
      border-radius: 0 0 var(--card-radius) var(--card-radius);
      padding: 12px;
      margin-top: -4px;
      margin-bottom: 8px;
    }
    .action-grid { display: flex; flex-wrap: wrap; gap: 6px; }
    .action-chip {
      padding: 2px 8px; border-radius: 4px; background: var(--bg-panel); border: 1px solid var(--border-color);
      font-size: 11px; font-family: 'JetBrains Mono', monospace; color: var(--text-main);
    }

    /* IDE config */
    .ide-status-list { margin-top: 8px; }
    .ide-info { flex-direction: row; gap: 12px; }
    .ide-title { font-family: 'Inter', sans-serif;}
    .ide-status, .badge {
      padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; border: 1px solid var(--border-hover); color: var(--mono-color);
    }
    .ide-status.ready, .badge.success { border-color: rgba(34, 197, 94, 0.2); color: var(--success-color); background: rgba(34, 197, 94, 0.05); }
    
    /* Prompts & Guides */
    .step-content { display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .step-number {
      width: 20px; height: 20px; border-radius: 50%; background: var(--text-highlight); color: #000;
      display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; flex-shrink: 0;
    }
    .step-title { font-size: 13px; font-weight: 600; color: var(--text-highlight); }
    .step-desc { font-size: 12px; color: var(--text-muted); }
    
    .prompt-tag {
      padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 500;
      border: 1px solid var(--border-hover); color: var(--text-muted); background: #000;
    }
    .prompt-text { font-size: 12px; color: var(--text-main); font-family: 'JetBrains Mono', monospace; flex: 1; }
    
    .guide-tips .tips-title { font-size: 13px; font-weight: 600; color: var(--text-highlight); margin-bottom: 8px; }
    .tips-list { margin: 0; padding-left: 20px; list-style: disc; }
    .tips-list li { font-size: 12px; color: var(--text-muted); margin-bottom: 6px; }

    /* Footer */
    .mcp-footer {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 16px; background: var(--bg-panel); border-top: 1px solid var(--border-color);
      flex-shrink: 0; z-index: 1;
    }
    .footer-text { font-size: 11px; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; }
    .ghost-btn {
      background: transparent; border: none; font-size: 11px; color: var(--text-muted);
      cursor: pointer; padding: 4px 8px; border-radius: 4px; transition: 0.2s;
    }
    .ghost-btn:hover { background: var(--bg-hover); color: var(--text-highlight); }
    .footer-actions { display: flex; gap: 8px; }

    /* Utilities */
    .info-box, .setting-warn {
      padding: 12px; border-radius: var(--card-radius); font-size: 12px; color: var(--text-muted);
      background: var(--bg-panel); border: 1px solid var(--border-color); line-height: 1.5; margin-top: 8px;
    }
    .info-box code { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--mono-color); }
    .setting-warn { color: var(--danger-color); border-color: rgba(239, 68, 68, 0.2); background: rgba(239, 68, 68, 0.05); }

    .config-result {
      display: flex; align-items: center; gap: 8px; padding: 10px; border-radius: 4px; font-size: 12px; margin-top: 8px;
      border: 1px solid var(--border-hover); background: var(--bg-panel);
    }
    .config-result.success { border-color: rgba(34, 197, 94, 0.2); color: var(--success-color); background: rgba(34, 197, 94, 0.05); }
    .config-result.error { border-color: rgba(239, 68, 68, 0.2); color: var(--danger-color); background: rgba(239, 68, 68, 0.05); }
    
    .prompt-copy.copied { color: var(--success-color); }
`;

let tplMatch = content.match(/template:\s*\/\*\s*html\s*\*\/\s*\`([\s\S]*?)\`,/);
if (tplMatch) {
    content = content.replace(tplMatch[0], \`template: /* html */ \\\`\\n\${newTemplate}\\n\\\`,\`);
  console.log('Template replaced');
} else {
  console.error("Failed to match template");
}

let cssMatch = content.match(/style:\s*\/\*\s*css\s*\*\/\s*\`([\s\S]*?)\`,/);
if (cssMatch) {
  content = content.replace(cssMatch[0], \`style: /* css */ \\\`\\n\${newCSS}\\n\\\`,\`);
  console.log('Style replaced');
} else {
  console.error("Failed to match style");
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully injected Minimalist Dark HTML & CSS into index.ts');
