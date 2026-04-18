// @ts-nocheck

function createStatusDot() {
  const el = document.createElement('div');
  el.id = 'statusDot';
  el.className = 'status-dot offline';
  return el;
}

function createStatusText() {
  const el = document.createElement('span');
  el.id = 'statusText';
  el.className = 'status-lbl status-text offline';
  el.textContent = 'Offline';
  return el;
}

function createEndpointValue() {
  const el = document.createElement('span');
  el.id = 'endpointValue';
  el.className = 'status-port';
  return el;
}

export function mountVueStatusBar(targetEl) {
  const root = document.createElement('div');
  root.className = 'status-bar';
  root.id = 'statusBanner';
  root.appendChild(createStatusDot());
  root.appendChild(createStatusText());
  root.appendChild(createEndpointValue());
  targetEl.replaceChildren(root);

  return {
    unmount() {
      targetEl.replaceChildren();
    },
  };
}
