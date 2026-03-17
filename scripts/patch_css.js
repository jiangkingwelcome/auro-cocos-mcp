const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '../src/panels/default/index.ts');
let src = fs.readFileSync(target, 'utf8');

const holoCSS = `
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
      width: 26px; height: 26px; border-radius: 8px; padding: 1.5px;
      background: linear-gradient(135deg, #ff0080, #7b2ff7, #40e0d0);
      box-shadow: 0 0 12px rgba(123,47,247,0.5); flex-shrink: 0;
    }
    .logo-inner {
      width: 100%; height: 100%; border-radius: 6px;
      background: #0d0d18; display: flex; align-items: center; justify-content: center;
      font-size: 12px; color: #a78bfa;
    }
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
      position: absolute; bottom: -1px; left: 16px; height: 2px;
      width: calc(20% - 4px);
      background: linear-gradient(90deg, #7b2ff7, #40e0d0);
      background-size: 200%; animation: holo-shift 4s linear infinite;
      transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
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

    /* Skeleton loader */
    .s3-bento.loading .s3-tile-value,
    .s3-bento.loading .s3-tile-sub {
      background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%);
      background-size: 200% 100%;
      animation: skeletonShimmer 1.5s ease-in-out infinite;
      color: transparent !important; border-radius: 4px;
      user-select: none; pointer-events: none;
    }
    .s3-bento.loading .s3-tile-value { min-height: 26px; max-width: 80px; }
    .s3-bento.loading .s3-tile-sub { min-height: 12px; max-width: 100px; }
    .s3-bento.loading .s3-tile-sub * { visibility: hidden; }
    @keyframes skeletonShimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
`;

// Find the block: from first "\n    .mcp-panel {" after style: line, to \\n  \`
const styleMarker = `  style: /* css */ \`\\n`;
const styleMarkerIdx = src.indexOf(styleMarker);
if (styleMarkerIdx === -1) { console.error('ERROR: style marker not found'); process.exit(1); }

// After the marker, find .mcp-panel to know where old CSS body starts
const cssBodyStart = src.indexOf('\n    .mcp-panel {', styleMarkerIdx);
if (cssBodyStart === -1) { console.error('ERROR: .mcp-panel not found'); process.exit(1); }

// Find the closing \\n  `, after cssBodyStart
const cssBodyEnd = src.indexOf('\\n  `,', cssBodyStart);
if (cssBodyEnd === -1) { console.error('ERROR: style closing marker not found'); process.exit(1); }

const newSrc = src.substring(0, cssBodyStart) + holoCSS + '\n' + src.substring(cssBodyEnd);
fs.writeFileSync(target, newSrc, 'utf8');

const stat = require('fs').statSync(target);
console.log('CSS replaced successfully. File size:', stat.size, 'bytes');
