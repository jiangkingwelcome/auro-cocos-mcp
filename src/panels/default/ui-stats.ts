// @ts-nocheck

function createUpdateBanner() {
  const el = document.createElement('div');
  el.id = 'updateBanner';
  el.className = 'update-banner';
  el.style.display = 'none';
  return el;
}

function createStatRow(labelKey, labelText, valueId, clickable = false) {
  const row = document.createElement('div');
  row.className = 'stat-row';
  if (clickable) row.classList.add('stat-row-clickable');
  if (clickable) {
    row.id = 'clientsRow';
    row.setAttribute('data-i18n-title', 'status.clients_title');
    row.title = '点击查看已连接的 AI 客户端';
  }

  const label = document.createElement('span');
  label.className = 'stat-label';
  label.setAttribute('data-i18n', labelKey);
  label.textContent = labelText;

  const value = document.createElement('span');
  value.className = 'stat-value';
  value.id = valueId;
  value.textContent = '-';

  row.appendChild(label);
  row.appendChild(value);
  return row;
}

function createClientsPopover() {
  const popover = document.createElement('div');
  popover.className = 'clients-popover';
  popover.id = 'clientsPopover';
  popover.style.display = 'none';

  const title = document.createElement('div');
  title.className = 'clients-popover-title';
  title.setAttribute('data-i18n', 'status.clients_title');
  title.textContent = '已连接的 AI 客户端';

  const list = document.createElement('div');
  list.className = 'clients-popover-list';
  list.id = 'clientsPopoverList';

  popover.appendChild(title);
  popover.appendChild(list);
  return popover;
}

export function mountVueStats(targetEl) {
  const updateBanner = createUpdateBanner();
  const statsList = document.createElement('div');
  statsList.className = 'stats-list';
  statsList.id = 'bentoGrid';

  statsList.appendChild(createStatRow('status.tools', 'TOOLS', 'toolCount'));
  statsList.appendChild(createStatRow('status.actions', 'ACTIONS', 'totalActionCount'));
  statsList.appendChild(createStatRow('status.clients', 'CLIENTS', 'connectionCount', true));
  statsList.appendChild(createClientsPopover());
  statsList.appendChild(createStatRow('status.port', 'PORT', 'portValue'));

  targetEl.replaceChildren(updateBanner, statsList);

  return {
    unmount() {
      targetEl.replaceChildren();
    },
  };
}
