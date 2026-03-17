const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'src', 'panels', 'default', 'index.ts');
let content = fs.readFileSync(targetFile, 'utf8');

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
    .s3-tile-value.blue { color: #3b82f6; } 
    .s3-tile-value.green { color: var(--text-highlight); }
    .s3-tile-value.purple { color: var(--text-highlight); }
    .s3-tile-value.amber { color: var(--text-highlight); }
    
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
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .status-dot.online { background: var(--success-color); }
    .status-dot.offline { background: var(--danger-color); }
    
    .status-text.online { color: var(--success-color); }
    .status-text.offline { color: var(--danger-color); }
    
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
    .ide-card, .tool-row, .guide-step, .prompt-card, .settings-card {
      background: var(--bg-panel);
      border: 1px solid var(--border-color);
      border-radius: var(--card-radius);
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: background 0.2s, border-color 0.2s;
    }
    .guide-step, .prompt-card, .settings-card, .ide-card {
      margin-bottom: 8px;
    }
    .ide-card:hover, .tool-row:hover, .prompt-card:hover {
      background: var(--bg-hover);
      border-color: var(--border-hover);
    }
    .settings-card {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
      padding: 16px;
    }

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
    .setting-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .setting-info { display: flex; flex-direction: column; gap: 4px; }
    .setting-label { font-size: 13px; font-weight: 500; color: var(--text-main); font-family: 'JetBrains Mono', monospace; }
    .setting-hint { font-size: 12px; color: var(--text-muted); }

    .setting-input, .setting-select {
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
    .setting-select { width: 100px; text-align: left; }
    .setting-input:focus, .setting-select:focus { border-color: #52525b; }

    /* Tool toggles */
    .tool-toggle-list { display: flex; flex-direction: column; gap: 8px; }
    .tool-info { display: flex; flex-direction: column; gap: 4px; }
    .tool-name-row { display: flex; align-items: center; gap: 8px; }
    .tool-name { font-size: 13px; font-weight: 500; color: var(--text-main); font-family: 'JetBrains Mono', monospace; }
    .tool-desc { font-size: 12px; color: var(--text-muted); }
    .core-badge, .action-count-badge {
      display: inline-block; padding: 2px 6px; border-radius: 4px;
      font-size: 10px; font-weight: 500; border: 1px solid var(--border-hover); color: var(--mono-color);
    }
    
    .tool-toggle {
      appearance: none; -webkit-appearance: none; width: 32px; height: 18px; background: #000;
      border: 1px solid #27272a; border-radius: 9px; position: relative; cursor: pointer; transition: 0.2s;
    }
    .tool-toggle:checked { background: var(--text-highlight); border-color: var(--text-highlight); }
    .tool-toggle::after {
      content: ''; position: absolute; top: 1px; left: 1px; width: 14px; height: 14px;
      background: #71717a; border-radius: 50%; transition: 0.2s;
    }
    .tool-toggle:checked::after { transform: translateX(14px); background: #000; }
    .tool-toggle:disabled { opacity: 0.5; cursor: not-allowed; }

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
    .ide-status-list { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
    .ide-info { display: flex; flex-direction: row; align-items: center; gap: 12px; }
    .ide-title { font-size: 13px; font-weight: 500; color: var(--text-main); font-family: 'Inter', sans-serif;}
    .ide-status {
      padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; border: 1px solid var(--border-hover); color: var(--mono-color);
    }
    .ide-status.ready { border-color: rgba(34, 197, 94, 0.2); color: var(--success-color); background: rgba(34, 197, 94, 0.05); }
    
    /* Prompts & Guides */
    .step-content { display: flex; flex-direction: column; gap: 4px; }
    .step-number {
      width: 20px; height: 20px; border-radius: 50%; background: var(--text-highlight); color: #000;
      display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; flex-shrink: 0;
    }
    .step-title { font-size: 13px; font-weight: 600; color: var(--text-highlight); }
    .step-desc { font-size: 12px; color: var(--text-muted); }
    
    .prompt-list { display: flex; flex-direction: column; gap: 8px; }
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
`;

let newContent = content.replace(/style:\s*\/\*\s*css\s*\*\/\s*`[\s\S]*?`,\n\n\s*\$:/, `style: /* css */ \`\n${newCSS}\n\`, \n\n  $:`);

fs.writeFileSync(targetFile, newContent, 'utf8');
console.log('Successfully injected Minimalist Dark CSS into index.ts');
