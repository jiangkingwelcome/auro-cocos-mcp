// @ts-nocheck

import { createHeaderBlock, createSectionRoot } from './ui-shared';

const IDES = [
  ['cursor', 'Cursor', 'cfg.detecting'],
  ['windsurf', 'Windsurf', 'cfg.detecting'],
  ['claude', 'Claude Desktop', 'cfg.detecting'],
  ['trae', 'Trae', 'cfg.detecting'],
  ['kiro', 'Kiro AI IDE', 'cfg.detecting'],
  ['antigravity', 'Antigravity', 'cfg.detecting'],
  ['gemini-cli', 'Gemini CLI', 'cfg.detecting'],
  ['codex', 'OpenAI Codex', 'cfg.detecting'],
  ['claude-code', 'Claude Code', 'cfg.detecting'],
  ['codebuddy', 'CodeBuddy (腾讯)', 'cfg.detecting'],
  ['comate', 'Comate (百度)', 'cfg.detecting'],
];

export function mountVueConfig(targetEl) {
  const root = createSectionRoot('tabConfig');
  const header = createHeaderBlock('cfg.title', 'IDE 互联配置', 'cfg.desc', '一键将 Cocos 环境注入至主流 AI 编程助手。');
  const list = document.createElement('div');
  list.className = 'ide-status-list';
  for (const [key, label, statusKey] of IDES) {
    const card = document.createElement('div');
    card.className = 'ide-card';
    card.id = `ide${key.replace(/(^|[-_])([a-z])/g, (_, __, c) => c.toUpperCase())}`;
    card.innerHTML = `<div class="ide-info"><span class="ide-title">${label}</span><span class="ide-status" id="status${key.replace(/(^|[-_])([a-z])/g, (_, __, c) => c.toUpperCase())}" data-i18n="${statusKey}">检测中...</span></div><button class="btn config-ide-btn" data-ide="${key}" data-i18n="cfg.inject_button">注入配置</button>`;
    list.appendChild(card);
  }
  const result = document.createElement('div');
  result.className = 'config-result';
  result.id = 'configResult';
  result.style.display = 'none';
  result.innerHTML = '<span id="configIcon"></span><span id="configMessage"></span>';
  const hint = document.createElement('div');
  hint.className = 'info-box';
  hint.setAttribute('data-i18n', 'cfg.hint');
  hint.textContent = '本操作将当前端点写入 IDE 的 MCP 配置文件，您需要在目标 IDE 中刷新或重启生效。';
  root.appendChild(header);
  root.appendChild(list);
  root.appendChild(result);
  root.appendChild(hint);
  targetEl.replaceChildren(root);
  return { unmount() { targetEl.replaceChildren(); } };
}
