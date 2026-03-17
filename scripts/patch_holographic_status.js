const fs = require('fs');
const path = require('path');
const target = path.join(__dirname, '../src/panels/default/index.ts');
let src = fs.readFileSync(target, 'utf8');

// ─── 1. Replace Status Tab HTML ──────────────────────────────────────────────
const oldStatusStart = src.indexOf('<!-- 1. Status Tab -->');
const oldStatusEnd   = src.indexOf('<!-- 2. Control Tab -->');
if (oldStatusStart < 0 || oldStatusEnd < 0) { console.error('Status tab markers not found'); process.exit(1); }

const newStatusTab = `<!-- 1. Status Tab -->
        <div class="mcp-tab-content active" id="tabStatus">

          <!-- Status banner -->
          <div class="holo-status-row" id="statusBanner">
            <div id="statusDot" class="status-dot offline"></div>
            <span id="statusText" class="status-lbl status-text offline">Offline</span>
            <span id="endpointValue" class="status-port"></span>
          </div>

          <!-- Project card -->
          <div class="project-card">
            <div class="proj-name" id="projectName">-</div>
            <div class="proj-pills">
              <span class="pill" id="editorVersion">-</span>
              <span class="pill" id="projectPath">-</span>
              <span class="pill">up <span id="uptime">-</span></span>
            </div>
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

          <div class="empty-state" id="emptyState" style="display:none;">
            <div class="empty-state-icon">\u23f8</div>
            <div class="empty-state-text">\u670d\u52a1\u672a\u542f\u52a8<br><span style="font-size:11px;opacity:0.5;">\u8bf7\u524d\u5f80\u300c\u63a7\u5236\u300dTab \u542f\u52a8 Aura \u670d\u52a1</span></div>
          </div>

        </div>

        `;

src = src.substring(0, oldStatusStart) + newStatusTab + src.substring(oldStatusEnd);

// ─── 2. Fix JS: bentoGrid.style.display should be 'grid' (nums-grid is display:grid) ─
// nums-grid uses display:grid so this is already correct.
// But setOffline/refreshStatus uses display='none'/'grid' - works perfectly.

// ─── 3. Also fix .s3-bento.loading skeleton → .nums-grid.loading ─────────────
src = src.replace(
  '.s3-bento.loading .s3-tile-value,\n    .s3-bento.loading .s3-tile-sub {',
  '.nums-grid.loading .num-val,\n    .nums-grid.loading .num-sub {'
);
src = src.replace(
  '.s3-bento.loading .s3-tile-value { min-height: 26px; max-width: 80px; }',
  '.nums-grid.loading .num-val { min-height: 26px; max-width: 60px; }'
);
src = src.replace(
  '.s3-bento.loading .s3-tile-sub { min-height: 12px; max-width: 100px; }',
  '.nums-grid.loading .num-sub { min-height: 12px; max-width: 80px; }'
);
src = src.replace(
  '.s3-bento.loading .s3-tile-sub * { visibility: hidden; }',
  '.nums-grid.loading .num-sub * { visibility: hidden; }'
);

// ─── 4. Replace old s3-bento / s3-tile CSS with new card CSS ─────────────────
const oldBentoCSS = `    /* Bento grid */
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
    }`;

const newCardsCSS = `    /* ── Holographic Status Layout ── */

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
      background: rgba(255,255,255,0.016); border: 1px solid rgba(255,255,255,0.06);
      border-radius: 12px; padding: 14px 16px; position: relative; overflow: hidden;
    }
    .project-card::after {
      content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(123,47,247,0.5), transparent);
    }
    .proj-name { font-size: 17px; font-weight: 700; color: #fff; margin-bottom: 8px; letter-spacing: -0.3px; }
    .proj-pills { display: flex; gap: 6px; flex-wrap: wrap; }
    .pill {
      font-family: 'JetBrains Mono', monospace; font-size: 10px;
      padding: 3px 8px; border-radius: 20px;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
      color: rgba(255,255,255,0.4);
    }

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
      font-family: 'JetBrains Mono', monospace; font-size: 40px;
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
    .value-changed { animation: valueFlash 0.6s ease-out; }`;

if (src.includes(oldBentoCSS)) {
  src = src.replace(oldBentoCSS, newCardsCSS);
  console.log('CSS replaced OK');
} else {
  console.warn('WARN: old bento CSS block not found exactly, appending new CSS before skeleton section');
  // Fallback: inject before skeleton loader CSS
  src = src.replace('    /* Skeleton loader */', newCardsCSS + '\n\n    /* Skeleton loader */');
}

fs.writeFileSync(target, src, 'utf8');
console.log('Patch complete. File size:', fs.statSync(target).size);
