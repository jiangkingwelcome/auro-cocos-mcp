const fs = require('fs');
const path = require('path');

// ── 1. Move project-card below nums-grid in index.ts ──────────────────────
const panelTarget = path.join(__dirname, '../src/panels/default/index.ts');
let src = fs.readFileSync(panelTarget, 'utf8');

const oldStatusBlock = `          <!-- Status banner -->
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
          <div class="nums-grid loading" id="bentoGrid">`;

const newStatusBlock = `          <!-- Status banner -->
          <div class="holo-status-row" id="statusBanner">
            <div id="statusDot" class="status-dot offline"></div>
            <span id="statusText" class="status-lbl status-text offline">Offline</span>
            <span id="endpointValue" class="status-port"></span>
          </div>

          <!-- 4-card num grid (bentoGrid for JS show/hide + loading) -->
          <div class="nums-grid loading" id="bentoGrid">`;

if (!src.includes(oldStatusBlock)) {
  console.error('ERROR: status block not found'); process.exit(1);
}
src = src.replace(oldStatusBlock, newStatusBlock);

// Remove the project-card after bentoGrid closing tag and add it back after
const oldAfterGrid = `          </div>

          <div class="empty-state" id="emptyState" style="display:none;">`;

const newAfterGrid = `          </div>

          <!-- Project card (bottom) -->
          <div class="project-card">
            <div class="proj-name" id="projectName">-</div>
            <div class="proj-pills">
              <span class="pill" id="editorVersion">-</span>
              <span class="pill" id="projectPath">-</span>
              <span class="pill">up <span id="uptime">-</span></span>
            </div>
          </div>

          <div class="empty-state" id="emptyState" style="display:none;">`;

if (!src.includes(oldAfterGrid)) {
  console.error('ERROR: after-grid block not found'); process.exit(1);
}
src = src.replace(oldAfterGrid, newAfterGrid);

fs.writeFileSync(panelTarget, src, 'utf8');
console.log('Status tab reordered: project-card moved to bottom.');

// ── 2. Update package.json panel size ─────────────────────────────────────
const pkgTarget = path.join(__dirname, '../package.json');
const pkg = JSON.parse(fs.readFileSync(pkgTarget, 'utf8'));
pkg.panels.default.size = {
  'min-width': 360,
  'min-height': 500,
  'width': 430,
  'height': 660,
};
fs.writeFileSync(pkgTarget, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log('package.json panel size updated to 430×660.');
