const fs = require('fs');
const path = require('path');
const target = path.join(__dirname, '../src/panels/default/index.ts');
let src = fs.readFileSync(target, 'utf8');

function rep(from, to) {
  if (src.includes(from)) { src = src.replace(from, to); return true; }
  console.warn('MISS:', from.substring(0, 80));
  return false;
}

// 1. Base font back to 13px (panel is small, 16px is too big)
rep('font-size: 16px;\n      font-family: \'Inter\'', 'font-size: 13px;\n      font-family: \'Inter\'');

// 2. Tab: keep bigger than original but not enormous; high-contrast inactive
rep(
  '.mcp-tab {\n      flex: 1; text-align: center; padding: 10px 4px; cursor: pointer;\n      font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.55);\n      border-radius: 8px; transition: all 0.2s; letter-spacing: 0.3px;\n    }\n    .mcp-tab:hover { color: rgba(255,255,255,0.85); background: rgba(255,255,255,0.07); }\n    .mcp-tab.active { color: #fff; background: rgba(255,255,255,0.1); text-shadow: 0 0 14px rgba(255,255,255,0.35); font-weight: 700; }',
  '.mcp-tab {\n      flex: 1; text-align: center; padding: 9px 3px; cursor: pointer;\n      font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.6);\n      border-radius: 7px; transition: all 0.2s;\n    }\n    .mcp-tab:hover { color: rgba(255,255,255,0.85); background: rgba(255,255,255,0.06); }\n    .mcp-tab.active { color: #fff; font-weight: 700; background: rgba(255,255,255,0.1); text-shadow: 0 0 10px rgba(255,255,255,0.25); }'
);

// 3. Brand header - keep 15px (nice)
rep('.brand-txt { font-size: 16px;', '.brand-txt { font-size: 15px;');
rep('.brand-for { font-size: 13px;', '.brand-for { font-size: 12px;');

// 4. Tile labels back to 10px (short text, cards are narrow)
rep('.s3-tile-label {\n      font-size: 12px;', '.s3-tile-label {\n      font-size: 10px;');

// 5. Tile sub back to 11px
rep('.s3-tile-sub {\n      font-size: 13px;', '.s3-tile-sub {\n      font-size: 11px;');

// 6. Control header
rep('.control-header h3 {\n      font-size: 14px;', '.control-header h3 {\n      font-size: 12px;');
rep('.control-header p { color: rgba(255,255,255,0.4); font-size: 13px;', '.control-header p { color: rgba(255,255,255,0.35); font-size: 12px;');

// 7. Settings
rep('.setting-label { font-size: 14px;', '.setting-label { font-size: 13px;');
rep('.setting-hint { font-size: 13px;', '.setting-hint { font-size: 11px;');

// 8. Tool list
rep('.tool-name { font-size: 14px;', '.tool-name { font-size: 13px;');
rep('.tool-desc { font-size: 13px;', '.tool-desc { font-size: 11px;');

// 9. IDE cards
rep('.ide-title { font-size: 14px;', '.ide-title { font-size: 13px;');
rep('.ide-status { font-size: 13px;', '.ide-status { font-size: 11px;');

// 10. Guide
rep('.step-title { font-size: 15px;', '.step-title { font-size: 13px;');
rep('.step-desc { font-size: 14px;', '.step-desc { font-size: 12px;');
rep('.prompt-text { font-size: 14px;', '.prompt-text { font-size: 12px;');
rep('.tips-title { font-size: 14px;', '.tips-title { font-size: 13px;');
rep('.tips-list li { font-size: 13px;', '.tips-list li { font-size: 11px;');

// 11. Buttons
rep('padding: 11px 14px; font-size: 14px;', 'padding: 9px 12px; font-size: 13px;');

// 12. Footer
rep('.footer-text { font-size: 13px;', '.footer-text { font-size: 11px;');
rep('.ghost-btn {\n      background: transparent; border: none; font-size: 13px;', '.ghost-btn {\n      background: transparent; border: none; font-size: 11px;');

// 13. Info box
rep('font-size: 13.5px;', 'font-size: 12px;');

// 14. Action chip
rep('font-size: 11px;\n      font-family: \'JetBrains Mono\'', 'font-size: 10px;\n      font-family: \'JetBrains Mono\'');

// 15. License
rep('.license-edition { font-size: 15px;', '.license-edition { font-size: 14px;');
rep('.license-hint { font-size: 13px;', '.license-hint { font-size: 11px;');
rep('.license-error { font-size: 13px;', '.license-error { font-size: 12px;');
rep('.license-detail { font-size: 13px;', '.license-detail { font-size: 12px;');

fs.writeFileSync(target, src, 'utf8');
console.log('Font rebalance done.');
