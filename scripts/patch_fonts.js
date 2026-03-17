const fs = require('fs');
const path = require('path');
const target = path.join(__dirname, '../src/panels/default/index.ts');
let src = fs.readFileSync(target, 'utf8');

const replacements = [
  // 1. 基础面板字体 13px -> 14px
  [
    'font-size: 13px;\n      font-family: \'Inter\', system-ui, -apple-system, sans-serif;\n      height: 100%; display: flex; flex-direction: column;\n      background: rgba(10, 10, 20, 0.97);',
    'font-size: 14px;\n      font-family: \'Inter\', system-ui, -apple-system, sans-serif;\n      height: 100%; display: flex; flex-direction: column;\n      background: rgba(10, 10, 20, 0.97);'
  ],

  // 2. Tab 字体放大 + 非激活态更亮
  [
    '.mcp-tab {\n      flex: 1; text-align: center; padding: 8px 4px; cursor: pointer;\n      font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.28);\n      border-radius: 7px; transition: all 0.2s;\n    }\n    .mcp-tab:hover { color: rgba(255,255,255,0.6); background: rgba(255,255,255,0.04); }\n    .mcp-tab.active { color: #fff; background: rgba(255,255,255,0.07); }',
    '.mcp-tab {\n      flex: 1; text-align: center; padding: 9px 4px; cursor: pointer;\n      font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.45);\n      border-radius: 7px; transition: all 0.2s; letter-spacing: 0.2px;\n    }\n    .mcp-tab:hover { color: rgba(255,255,255,0.75); background: rgba(255,255,255,0.06); }\n    .mcp-tab.active { color: #fff; background: rgba(255,255,255,0.09); text-shadow: 0 0 12px rgba(255,255,255,0.3); }'
  ],

  // 3. 各组件文字放大
  // brand txt
  ['.brand-txt { font-size: 14px;', '.brand-txt { font-size: 15px;'],
  // tile label
  ['.s3-tile-label {\n      font-size: 10px;', '.s3-tile-label {\n      font-size: 11px;'],
  // tile value
  ['.s3-tile-value {\n      font-family: \'JetBrains Mono\', \'SF Mono\', Consolas, monospace;\n      font-size: 28px;', '.s3-tile-value {\n      font-family: \'JetBrains Mono\', \'SF Mono\', Consolas, monospace;\n      font-size: 30px;'],
  // tile sub
  ['.s3-tile-sub {\n      font-size: 11px;', '.s3-tile-sub {\n      font-size: 12px;'],
  // control header h3
  ['.control-header h3 {\n      font-size: 12px;', '.control-header h3 {\n      font-size: 13px;'],
  // control header p
  ['.control-header p { color: rgba(255,255,255,0.28); font-size: 12px;', '.control-header p { color: rgba(255,255,255,0.35); font-size: 12.5px;'],
  // setting-label
  ['.setting-label { font-size: 12.5px;', '.setting-label { font-size: 13px;'],
  // setting-hint
  ['.setting-hint { font-size: 11px;', '.setting-hint { font-size: 12px;'],
  // tool-name
  ['.tool-name { font-size: 12px;', '.tool-name { font-size: 13px;'],
  // tool-desc
  ['.tool-desc { font-size: 11px;', '.tool-desc { font-size: 12px;'],
  // ide-title
  ['.ide-title { font-size: 12.5px;', '.ide-title { font-size: 13px;'],
  // ide-status
  ['.ide-status { font-size: 11px;', '.ide-status { font-size: 12px;'],
  // step-title
  ['.step-title { font-size: 13px;', '.step-title { font-size: 14px;'],
  // step-desc
  ['.step-desc { font-size: 12px;', '.step-desc { font-size: 13px;'],
  // prompt-text
  ['.prompt-text { font-size: 12px;', '.prompt-text { font-size: 13px;'],
  // button font
  ['.btn {\n      border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;\n      padding: 9px 12px; font-size: 12.5px;', '.btn {\n      border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;\n      padding: 10px 14px; font-size: 13px;'],
  // footer text
  ['.footer-text { font-size: 11px;', '.footer-text { font-size: 12px;'],
  // ghost-btn
  ['.ghost-btn {\n      background: transparent; border: none; font-size: 11px;', '.ghost-btn {\n      background: transparent; border: none; font-size: 12px;'],
  // info-box
  ['.info-box {\n      background: rgba(255,255,255,0.016); border: 1px solid rgba(255,255,255,0.05);\n      border-radius: 9px; padding: 11px 14px;\n      font-size: 11.5px;', '.info-box {\n      background: rgba(255,255,255,0.016); border: 1px solid rgba(255,255,255,0.05);\n      border-radius: 9px; padding: 11px 14px;\n      font-size: 12.5px;'],
];

let changed = 0;
for (const [from, to] of replacements) {
  if (src.includes(from)) {
    src = src.replace(from, to);
    changed++;
  } else {
    console.warn('NOT FOUND:', from.substring(0, 60));
  }
}

fs.writeFileSync(target, src, 'utf8');
console.log(`Done. ${changed}/${replacements.length} replacements applied.`);
