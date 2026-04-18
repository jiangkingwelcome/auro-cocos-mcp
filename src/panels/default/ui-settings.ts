// @ts-nocheck

import { createHeaderBlock, createSectionRoot } from './ui-shared';

export function mountVueSettings(targetEl) {
  const root = createSectionRoot('tabSettings');

  const licenseHeader = createHeaderBlock('settings.license_title', 'License 授权', 'settings.license_desc', '管理 Pro 版 License Key 激活状态。');
  const licenseCard = document.createElement('div');
  licenseCard.className = 'license-card';
  licenseCard.id = 'licenseCard';
  licenseCard.innerHTML = `
    <div class="license-status" id="licenseStatusSection">
      <div class="license-badge" id="licenseBadge">
        <span class="license-edition" id="licenseEdition">Community</span>
        <span class="license-state community" id="licenseState">免费版</span>
      </div>
      <div class="license-detail" id="licenseDetail" style="display:none;">
        <span class="license-expiry" id="licenseExpiry"></span>
        <span class="license-owner" id="licenseOwner"></span>
      </div>
      <div class="license-error" id="licenseError" style="display:none;"></div>
    </div>
    <div class="license-input-row">
      <input type="text" id="licenseKeyInput" class="license-input" placeholder="COCOS-PRO-XXXXXXXX-XXXXXXXX-XXXXXXXX" spellcheck="false" autocomplete="off" />
      <button id="activateLicenseBtn" class="btn btn-primary btn-activate" data-i18n="settings.activate">激活</button>
    </div>
    <div class="license-hint" data-i18n="settings.license_hint">输入 License Key 后点击激活，需要重启插件使 Pro 工具生效。</div>
    <button id="buyProBtn" class="btn btn-buy-pro" style="display:none;" data-i18n="settings.buy_pro">🛒 购买 Pro License</button>
  `;

  const divider = document.createElement('div');
  divider.className = 'divider';

  const languageHeader = createHeaderBlock('settings.language_title', '界面语言', 'settings.language_desc', '设置面板显示语言，切换后立即生效。');
  const languageCard = document.createElement('div');
  languageCard.className = 'settings-card';
  languageCard.style.gap = '0';
  languageCard.innerHTML = `
    <div class="setting-item">
      <div class="setting-info">
        <span class="setting-label" data-i18n="settings.language">语言</span>
        <span class="setting-hint" data-i18n="settings.language_hint">选择面板显示语言</span>
      </div>
      <select id="settingLanguage" class="setting-select"></select>
    </div>
  `;

  const performanceHeader = createHeaderBlock('settings.title', '安全与性能', 'settings.desc', '配置 MCP Bridge 的安全策略和性能参数。');
  const settingsCard = document.createElement('div');
  settingsCard.className = 'settings-card';
  settingsCard.innerHTML = `
    <div class="setting-item">
      <div class="setting-info">
        <span class="setting-label" data-i18n="settings.rate_limit">Rate Limit (req/min)</span>
        <span class="setting-hint" data-i18n="settings.rate_limit_hint">每分钟允许的最大请求数 (10-10000)</span>
      </div>
      <input type="number" id="settingRateLimit" class="setting-input" min="10" max="10000" step="10" value="1200" />
    </div>
    <div class="setting-item">
      <div class="setting-info">
        <span class="setting-label" data-i18n="settings.loopback">Localhost Restrict</span>
        <span class="setting-hint" data-i18n="settings.loopback_hint">开启时仅允许 127.0.0.1 访问</span>
      </div>
      <input type="checkbox" id="settingLoopback" class="tool-toggle" checked />
    </div>
    <div class="setting-warn" id="loopbackWarn" style="display:none;" data-i18n="settings.warn_loopback">⚠ 警告: 关闭回环限制将允许外部网段访问，请确保网络安全。</div>
    <div class="setting-item">
      <div class="setting-info">
        <span class="setting-label" data-i18n="settings.body_limit">Max Payload Size</span>
        <span class="setting-hint" data-i18n="settings.body_limit_hint">单次请求/返回的最大数据体积</span>
      </div>
      <select id="settingBodyLimit" class="setting-select">
        <option value="65536">64 KB</option>
        <option value="262144">256 KB</option>
        <option value="524288">512 KB</option>
        <option value="1048576" selected>1 MB</option>
        <option value="2097152">2 MB</option>
        <option value="5242880">5 MB</option>
        <option value="10485760">10 MB</option>
        <option value="52428800">50 MB</option>
      </select>
    </div>
    <div class="setting-item">
      <div class="setting-info">
        <span class="setting-label" data-i18n="settings.rollback">自动回滚</span>
        <span class="setting-hint" data-i18n="settings.rollback_hint">复杂原子操作失败时自动恢复场景</span>
      </div>
      <input type="checkbox" id="settingRollback" class="tool-toggle" checked />
    </div>
  `;

  const buttons = document.createElement('div');
  buttons.className = 'button-grid';
  buttons.style.marginTop = '12px';
  buttons.innerHTML = `
    <button id="saveSettingsBtn" class="btn btn-primary" data-i18n="settings.save">保存配置</button>
    <button id="resetSettingsBtn" class="btn" data-i18n="settings.reset">恢复默认</button>
  `;

  const result = document.createElement('div');
  result.className = 'config-result';
  result.id = 'settingsResult';
  result.style.display = 'none';
  result.innerHTML = '<span id="settingsIcon"></span><span id="settingsMessage"></span>';

  root.appendChild(licenseHeader);
  root.appendChild(licenseCard);
  root.appendChild(divider);
  root.appendChild(languageHeader);
  root.appendChild(languageCard);
  root.appendChild(performanceHeader);
  root.appendChild(settingsCard);
  root.appendChild(buttons);
  root.appendChild(result);

  targetEl.replaceChildren(root);
  return { unmount() { targetEl.replaceChildren(); } };
}
