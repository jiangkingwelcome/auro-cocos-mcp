const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../src/panels/default/index.ts');
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
            <div class="s3-tile">
              <div class="s3-tile-label" data-i18n="status.tools">暴露可用工具数</div>
              <div class="s3-tile-value val-blue" id="toolCount">-</div>
              <div class="s3-tile-sub">tools exposed</div>
            </div>
            <div class="s3-tile">
              <div class="s3-tile-label" data-i18n="status.actions">可调用总 ACTION 数</div>
              <div class="s3-tile-value val-green" id="totalActionCount">-</div>
              <div class="s3-tile-sub">total actions</div>
            </div>
            <div class="s3-tile">
              <div class="s3-tile-label" data-i18n="status.clients">已连接 AI 客户端</div>
              <div class="s3-tile-value val-purple" id="connectionCount">-</div>
              <div class="s3-tile-sub" style="justify-content:flex-start;">
                <span id="statusDot" class="status-dot offline"></span>
                <span id="statusText" class="status-text offline">Offline</span>
              </div>
            </div>
            <div class="s3-tile">
              <div class="s3-tile-label" data-i18n="status.port">监听端口 (PORT)</div>
              <div class="s3-tile-value val-amber" id="portValue">-</div>
              <div class="s3-tile-sub"><span id="uptime">00:00:00</span></div>
            </div>
            <div class="s3-tile wide">
              <div class="s3-tile-label" data-i18n="status.project">项目名称</div>
              <div class="s3-tile-value val-white" style="font-size:22px;" id="projectName">-</div>
              <div class="s3-tile-sub" style="margin-top: 8px; justify-content: space-between;">
                <span>引擎: <span id="editorVersion" style="color:#60a5fa"></span> &nbsp;·&nbsp; 端点: <span id="endpointValue" style="color:#34d399"></span></span>
              </div>
              <div class="s3-tile-sub" style="margin-top: 4px;">
                <span>路径: <code id="projectPath">-</code></span>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. 服务控制 Tab -->
        <div class="mcp-tab-content flex-column" id="tabControl">
          <div class="control-header">
            <h3 data-i18n="ctrl.title">服务管理</h3>
            <p data-i18n="ctrl.desc">管理底层的 MCP 中继服务节点。</p>
          </div>
            
          <div class="button-grid">
            <button id="startBtn" class="btn btn-primary" data-i18n="ctrl.start">启动服务</button>
            <button id="stopBtn" class="btn btn-outline-danger" data-i18n="ctrl.stop">停止服务</button>
          </div>
          <button id="restartBtn" class="btn full-width" data-i18n="ctrl.restart">重启服务</button>

          <div class="divider"></div>

          <div class="control-header">
            <h3 data-i18n="ctrl.tools_title">可用工具配置</h3>
            <p data-i18n="ctrl.tools_desc">动态控制 AI 可调用的能力。关闭的工具 AI 将无法感知。</p>
          </div>
          <div id="toolToggleList" class="tool-toggle-list"></div>
        </div>

        <!-- 3. IDE 互联 Tab -->
        <div class="mcp-tab-content flex-column" id="tabConfig">
          <div class="control-header">
             <h3 data-i18n="cfg.title">IDE 互联配置</h3>
             <p data-i18n="cfg.desc">一键将当前 Cocos 环境注入至主流 AI 编程助手的配置中。</p>
          </div>
          
          <div class="ide-status-list">
            <div class="ide-card" id="ideCursor">
              <div class="ide-info">
                <span class="ide-title">Cursor</span>
                <span class="ide-status" id="statusCursor">检测中...</span>
              </div>
              <button class="btn config-ide-btn" data-ide="cursor">注入配置</button>
            </div>
            
            <div class="ide-card" id="ideWindsurf">
              <div class="ide-info">
                <span class="ide-title">Windsurf</span>
                <span class="ide-status" id="statusWindsurf">检测中...</span>
              </div>
              <button class="btn config-ide-btn" data-ide="windsurf">注入配置</button>
            </div>
            
            <div class="ide-card" id="ideClaude">
              <div class="ide-info">
                <span class="ide-title">Claude Desktop</span>
                <span class="ide-status" id="statusClaude">检测中...</span>
              </div>
              <button class="btn config-ide-btn" data-ide="claude">注入配置</button>
            </div>
            
            <div class="ide-card" id="ideTrae">
              <div class="ide-info">
                <span class="ide-title">Trae</span>
                <span class="ide-status" id="statusTrae">检测中...</span>
              </div>
              <button class="btn config-ide-btn" data-ide="trae">注入配置</button>
            </div>
            
            <div class="ide-card" id="ideKiro">
              <div class="ide-info">
                <span class="ide-title">Kiro AI IDE</span>
                <span class="ide-status" id="statusKiro">检测中...</span>
              </div>
              <button class="btn config-ide-btn" data-ide="kiro">注入配置</button>
            </div>
            
            <div class="ide-card" id="ideAntigravity">
              <div class="ide-info">
                <span class="ide-title">Antigravity</span>
                <span class="ide-status" id="statusAntigravity">检测中...</span>
              </div>
              <button class="btn config-ide-btn" data-ide="antigravity">注入配置</button>
            </div>
          </div>
            
          <div class="config-result" id="configResult" style="display:none;">
            <span id="configIcon"></span>
            <span id="configMessage"></span>
          </div>
            
          <div class="info-box">
             本操作会将当前工作空间的端点合并写入对应 IDE 的 <code>mcp.json</code>，您需要在目标 IDE 中刷新或重启生效。
          </div>
        </div>

        <!-- 4. 设置 Tab -->
        <div class="mcp-tab-content flex-column" id="tabSettings">
          <div class="control-header">
            <h3 data-i18n="settings.title">全局设置</h3>
            <p data-i18n="settings.desc">配置底层 MCP Bridge 的性能与安全参数。</p>
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
                <span class="setting-hint" data-i18n="settings.loopback_hint">开启时仅允许本地环境 127.0.0.1 访问</span>
              </div>
              <input type="checkbox" id="settingLoopback" class="tool-toggle" checked />
            </div>
            <div class="setting-warn" id="loopbackWarn" style="display:none;" data-i18n="settings.warn_loopback">⚠ 警告: 关闭回环限制将允许外部网段访问本节点，请确保所处网络环境安全。</div>

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
                <span class="setting-hint" data-i18n="settings.rollback_hint">开启时，复杂原子操作失败将自动恢复场景</span>
              </div>
              <input type="checkbox" id="settingRollback" class="tool-toggle" checked />
            </div>
          </div>

          <div class="button-grid" style="margin-top: 12px;">
            <button id="saveSettingsBtn" class="btn btn-primary" data-i18n="settings.save">保存配置</button>
            <button id="resetSettingsBtn" class="btn" data-i18n="settings.reset">恢复默认</button>
          </div>

          <div class="config-result" id="settingsResult" style="display:none;">
            <span id="settingsIcon"></span>
            <span id="settingsMessage"></span>
          </div>
        </div>

        <!-- 5. 使用指南 Tab -->
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
                <div class="step-desc" data-i18n="guide.step1_desc">在 IDE 中检查 MCP Status，或提问 "请测试一下 Cocos 桥接状态"。</div>
              </div>
            </div>
            <div class="guide-step">
              <div class="step-number">2</div>
              <div class="step-content">
                <div class="step-title" data-i18n="guide.step2_title">选定操作目标</div>
                <div class="step-desc" data-i18n="guide.step2_desc">若要修改现有节点，请先在 Cocos 编辑器层级树中选中目标，然后对 AI 说 "把当前选中的节点..."。</div>
              </div>
            </div>
            <div class="guide-step">
              <div class="step-number">3</div>
              <div class="step-content">
                <div class="step-title" data-i18n="guide.step3_title">检查执行结果</div>
                <div class="step-desc" data-i18n="guide.step3_desc">AI 拥有读写双向能力，修改后编辑器内会实时刷新，若效果不对可直接说 "撤销刚才的修改"。</div>
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
              <div class="prompt-copy" title="复制">📋</div>
            </button>
            <button class="prompt-card">
              <span class="prompt-tag" data-i18n="guide.tag_create">实例创建</span>
              <div class="prompt-text" data-i18n="guide.prompt2">在当前选中的节点下，创建一个名为 "LoginButton" 的按钮，并添加 Widget 居中。</div>
              <div class="prompt-copy" title="复制">📋</div>
            </button>
          </div>

          <div class="info-box guide-tips">
            <div class="tips-title" data-i18n="guide.tips_title">开发建议</div>
            <ul class="tips-list">
              <li data-i18n="guide.tip1">尽量遵循单指令单操作，避免一条对话发布多个复杂的引擎改动。</li>
              <li data-i18n="guide.tip2">若 AI 提示组件未导入，请先确保项目代码中已存在该继承自 cc.Component 的脚本。</li>
            </ul>
          </div>
        </div>

      </div>

      <!-- ====== 底部信息 ====== -->
      <div class="mcp-footer">
        <span class="footer-text">v<span id="versionText"></span></span>
        <div class="footer-actions">
          <button id="langBtn" class="ghost-btn" title="切换语言 / Switch Language">中 / EN</button>
          <button id="refreshBtn" class="ghost-btn" title="手动刷新服务心跳" data-i18n="footer.sync">同步状态</button>
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
      --border-input: #27272a;
      --text-main: #e5e5e5;
      --text-muted: #71717a;
      --text-highlight: #fafafa;
      --accent-color: #fafafa;
      --bg-input: #000000;
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
    .s3-tile-value.val-blue { color: #3b82f6; text-shadow: none; } 
    .s3-tile-value.val-green { color: var(--success-color); text-shadow: none; }
    .s3-tile-value.val-purple { color: #a855f7; text-shadow: none; }
    .s3-tile-value.val-amber { color: #fbbf24; text-shadow: none; }
    .s3-tile-value.val-white { color: var(--text-highlight); text-shadow: none; }
    
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
    
    .status-text.online { color: var(--success-color); font-weight: 600; text-shadow: none; }
    .status-text.offline { color: var(--danger-color); font-weight: 600; text-shadow: none; }
    
    .s3-tile-sub code {
      font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
      font-size: 11px;
      color: var(--mono-color);
      background: var(--bg-input);
      padding: 2px 4px;
      border-radius: 4px;
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
    .list-item, .ide-card, .tool-row, .guide-step, .prompt-card, .settings-card, .tool-wrapper .tool-row {
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
    .btn-outline-danger {
      color: var(--danger-color);
      border-color: rgba(239, 68, 68, 0.2);
      background: rgba(239, 68, 68, 0.05);
    }
    .btn-outline-danger:hover {
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
    
    /* Settings */
    .setting-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 36px;
      gap: 12px;
    }
    .setting-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
      min-width: 0;
    }
    .setting-label {
      font-size: 12.5px;
      font-weight: 500;
      color: var(--text-main);
      font-family: 'Inter', sans-serif;
    }
    .setting-hint {
      font-size: 11px;
      color: var(--text-muted);
      line-height: 1.4;
    }
    .setting-input {
      width: 90px;
      height: 28px;
      background: var(--bg-input);
      border: 1px solid var(--border-input);
      border-radius: 4px;
      color: var(--text-highlight);
      font-family: 'SF Mono', Consolas, monospace;
      font-size: 12px;
      padding: 0 8px;
      outline: none;
      text-align: right;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .setting-input:focus {
      border-color: var(--accent-color);
      box-shadow: 0 0 0 2px rgba(250, 250, 250, 0.2);
    }
    .setting-select {
      height: 28px;
      background: var(--bg-input);
      border: 1px solid var(--border-input);
      border-radius: 4px;
      color: var(--text-highlight);
      font-size: 12px;
      padding: 0 8px;
      outline: none;
      cursor: pointer;
      transition: border-color 0.2s;
    }
    .setting-select:focus {
      border-color: var(--accent-color);
    }

    /* Tool toggles */
    .tool-info { display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .tool-name-row { display: flex; align-items: center; gap: 8px; }
    .tool-name { font-size: 13px; font-weight: 500; color: var(--text-main); font-family: 'JetBrains Mono', monospace; }
    .tool-desc { font-size: 12px; color: var(--text-muted); }
    .core-badge, .action-count-badge {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border-hover);
      font-size: 10px; font-weight: 500; color: var(--mono-color); background: #000;
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
      margin-top: -1px;
      margin-bottom: 8px;
    }
    .action-grid { display: flex; flex-wrap: wrap; gap: 6px; }
    .action-chip {
      padding: 2px 8px; border-radius: 4px; background: var(--bg-panel); border: 1px solid var(--border-color);
      font-size: 11px; font-family: 'JetBrains Mono', monospace; color: var(--text-main);
    }

    /* IDE config */
    .ide-status-list { margin-top: 8px; display: flex; flex-direction: column; gap: 8px; }
    .ide-info { flex-direction: row; gap: 12px; display: flex; align-items: center;}
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
    
    .prompt-card { background: var(--bg-panel); border: 1px solid var(--border-color); padding: 8px 12px; display: flex; align-items: center; gap: 8px; border-radius: var(--card-radius); text-align: left;}
    .prompt-tag {
      padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 500; flex-shrink: 0;
      border: 1px solid var(--border-hover); color: var(--text-muted); background: #000;
    }
    .prompt-text { font-size: 12px; color: var(--text-main); font-family: 'JetBrains Mono', monospace; flex: 1; text-align: left; }
    .prompt-copy { background: transparent; border: none; font-size: 12px; cursor: pointer; color: var(--text-muted); padding: 2px 6px; }
    
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

function spliceString(str, startStr, endStr, replacement) {
    const i = str.indexOf(startStr);
    if (i === -1) throw new Error("Could not find " + startStr);
    const startIdx = i + startStr.length;
    const j = str.indexOf(endStr, startIdx);
    if (j === -1) throw new Error("Could not find " + endStr);
    return str.substring(0, startIdx) + "\\n" + replacement + "\\n  " + str.substring(j);
}

content = spliceString(content, "template: /* html */ \`", "\`,", newTemplate);
content = spliceString(content, "style: /* css */ \`", "\`,", newCSS);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully injected Minimalist Dark HTML & CSS into index.ts');
