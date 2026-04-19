// @ts-nocheck

function svgEl(tag, attrs, children = []) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    el.setAttribute(key, String(value));
  }
  for (const child of children) el.appendChild(child);
  return el;
}

function renderLogoSvg() {
  return svgEl('svg', {
    width: '100%',
    height: '100%',
    viewBox: '0 0 40 40',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
  }, [
    svgEl('path', { d: 'M22.95 10.38L21.36 13.14L28.16 24.96H30.43L22.95 12V10.38Z', fill: '#A1A1AA' }),
    svgEl('path', { d: 'M19.34 6.78003L15.35 13.67L22.14 24.93H24.52L19.34 16.33V6.78003Z', fill: '#D4D4D8' }),
    svgEl('path', { d: 'M10 24.93L15.75 14L21.5 24.93H10Z', fill: '#71717A' }),
  ]);
}

function renderUserIcon() {
  return svgEl('svg', {
    width: '13',
    height: '13',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  }, [
    svgEl('path', { d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' }),
    svgEl('circle', { cx: '12', cy: '7', r: '4' }),
  ]);
}

export function mountVueHeader(targetEl) {
  const header = document.createElement('div');
  header.className = 'panel-header';

  const logo = document.createElement('div');
  logo.className = 'logo-icon';
  logo.appendChild(renderLogoSvg());

  const brand = document.createElement('span');
  brand.className = 'brand-container';
  const brandText = document.createElement('span');
  brandText.className = 'brand-txt-aura';
  brandText.textContent = 'Aura';
  brand.appendChild(brandText);

  const badge = document.createElement('div');
  badge.className = 'holo-badge';
  badge.id = 'holoBadge';
  const badgeInner = document.createElement('div');
  badgeInner.className = 'holo-badge-inner';
  badgeInner.style.color = '#f59e0b';
  badgeInner.setAttribute('data-i18n', 'badge.community');
  badgeInner.textContent = 'Community';
  badge.appendChild(badgeInner);

  const actions = document.createElement('div');
  actions.className = 'header-actions';
  const user = document.createElement('div');
  user.className = 'user-avatar';
  user.id = 'userBtn';
  user.setAttribute('data-i18n-title', 'ui.user_center');
  user.title = '用户中心';
  user.appendChild(renderUserIcon());
  actions.appendChild(user);

  header.appendChild(logo);
  header.appendChild(brand);
  header.appendChild(badge);
  header.appendChild(actions);
  targetEl.replaceChildren(header);

  return {
    unmount() {
      targetEl.replaceChildren();
    },
  };
}
