// @ts-nocheck

export function createSectionRoot(id, className = 'mcp-tab-content flex-column') {
  const root = document.createElement('div');
  root.id = id;
  root.className = className;
  return root;
}

export function createHeaderBlock(titleKey, titleText, descKey, descText) {
  const header = document.createElement('div');
  header.className = 'control-header';
  header.innerHTML = `<h3 data-i18n="${titleKey}">${titleText}</h3><p data-i18n="${descKey}">${descText}</p>`;
  return header;
}
