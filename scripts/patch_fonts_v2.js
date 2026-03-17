const fs = require('fs');
const path = require('path');
const target = path.join(__dirname, '../src/panels/default/index.ts');
let src = fs.readFileSync(target, 'utf8');

// Helper: exact string replace, log if missed
function rep(from, to) {
  if (src.includes(from)) { src = src.replace(from, to); return true; }
  console.warn('MISS:', from.substring(0, 80));
  return false;
}

// 1. Base panel font: 14px -> 16px
rep('font-size: 14px;\n      font-family: \'Inter\'', 'font-size: 16px;\n      font-family: \'Inter\'');

// 2. Tabs: bigger & much brighter inactive
rep(
  '.mcp-tab {\n      flex: 1; text-align: center; padding: 9px 4px; cursor: pointer;\n      font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.45);\n      border-radius: 7px; transition: all 0.2s; letter-spacing: 0.2px;\n    }\n    .mcp-tab:hover { color: rgba(255,255,255,0.75); background: rgba(255,255,255,0.06); }\n    .mcp-tab.active { color: #fff; background: rgba(255,255,255,0.09); text-shadow: 0 0 12px rgba(255,255,255,0.3); }',
  '.mcp-tab {\n      flex: 1; text-align: center; padding: 10px 4px; cursor: pointer;\n      font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.55);\n      border-radius: 8px; transition: all 0.2s; letter-spacing: 0.3px;\n    }\n    .mcp-tab:hover { color: rgba(255,255,255,0.85); background: rgba(255,255,255,0.07); }\n    .mcp-tab.active { color: #fff; background: rgba(255,255,255,0.1); text-shadow: 0 0 14px rgba(255,255,255,0.35); font-weight: 700; }'
);

// 3. Brand header text
rep('.brand-txt { font-size: 15px;', '.brand-txt { font-size: 16px;');
rep('.brand-for { font-size: 11px;', '.brand-for { font-size: 13px;');

// 4. Bento tile labels
rep('.s3-tile-label {\n      font-size: 11px;', '.s3-tile-label {\n      font-size: 12px;');

// 5. Tile sub
rep('.s3-tile-sub {\n      font-size: 12px;', '.s3-tile-sub {\n      font-size: 13px;');

// 6. Control-header section title + desc
rep('.control-header h3 {\n      font-size: 13px;', '.control-header h3 {\n      font-size: 14px;');
rep('.control-header p { color: rgba(255,255,255,0.35); font-size: 12.5px;', '.control-header p { color: rgba(255,255,255,0.4); font-size: 13px;');

// 7. Settings
rep('.setting-label { font-size: 13px;', '.setting-label { font-size: 14px;');
rep('.setting-hint { font-size: 12px;', '.setting-hint { font-size: 13px;');

// 8. Tool list
rep('.tool-name { font-size: 13px;', '.tool-name { font-size: 14px;');
rep('.tool-desc { font-size: 12px;', '.tool-desc { font-size: 13px;');

// 9. IDE cards
rep('.ide-title { font-size: 13px;', '.ide-title { font-size: 14px;');
rep('.ide-status { font-size: 12px;', '.ide-status { font-size: 13px;');

// 10. Guide
rep('.step-title { font-size: 14px;', '.step-title { font-size: 15px;');
rep('.step-desc { font-size: 13px;', '.step-desc { font-size: 14px;');
rep('.prompt-text { font-size: 13px;', '.prompt-text { font-size: 14px;');
rep('.tips-title { font-size: 12.5px;', '.tips-title { font-size: 14px;');
rep('.tips-list li { font-size: 11px;', '.tips-list li { font-size: 13px;');

// 11. Buttons
rep('padding: 10px 14px; font-size: 13px;', 'padding: 11px 14px; font-size: 14px;');

// 12. Footer / ghost btns
rep('.footer-text { font-size: 12px;', '.footer-text { font-size: 13px;');
rep('.ghost-btn {\n      background: transparent; border: none; font-size: 12px;', '.ghost-btn {\n      background: transparent; border: none; font-size: 13px;');

// 13. Info box
rep('font-size: 12.5px;', 'font-size: 13.5px;');

// 14. Action chip & badge sizes
rep('.action-chip {\n      padding: 2px 7px; border-radius: 4px; background: rgba(255,255,255,0.04);\n      border: 1px solid rgba(255,255,255,0.07); font-size: 10px;', '.action-chip {\n      padding: 2px 8px; border-radius: 4px; background: rgba(255,255,255,0.04);\n      border: 1px solid rgba(255,255,255,0.07); font-size: 11px;');

// 15. License card
rep('.license-edition { font-size: 14px;', '.license-edition { font-size: 15px;');
rep('.license-hint { font-size: 11px;', '.license-hint { font-size: 13px;');
rep('.license-error { font-size: 12px;', '.license-error { font-size: 13px;');
rep('.license-detail { font-size: 12px;', '.license-detail { font-size: 13px;');

fs.writeFileSync(target, src, 'utf8');
console.log('Font patch v2 done.');
