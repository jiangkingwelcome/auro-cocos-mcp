// @ts-nocheck

const TABS = [
  { target: 'tabStatus', key: 'tab.status', label: '状态' },
  { target: 'tabControl', key: 'tab.control', label: '控制' },
  { target: 'tabConfig', key: 'tab.config', label: '互联' },
  { target: 'tabSettings', key: 'tab.settings', label: '设置' },
  { target: 'tabGuide', key: 'tab.guide', label: '指南' },
];

export function mountVueTabs(targetEl) {
  const header = document.createElement('div');
  header.className = 'mcp-tabs-header';

  for (const tab of TABS) {
    const el = document.createElement('div');
    el.className = 'mcp-tab';
    if (tab.target === 'tabStatus') el.classList.add('active');
    el.setAttribute('data-target', tab.target);
    el.setAttribute('data-i18n', tab.key);
    el.textContent = tab.label;
    header.appendChild(el);
  }

  targetEl.replaceChildren(header);

  return {
    unmount() {
      targetEl.replaceChildren();
    },
  };
}
