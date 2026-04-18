// @ts-nocheck

const fs = require('fs');
const path = require('path');

let hotReloadTimer = null;
let lastHash = null;
let lastMtime = 0;

function readManifest(manifestPath) {
  try {
    if (!fs.existsSync(manifestPath)) return null;
    const raw = fs.readFileSync(manifestPath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function startPanelHotReload(options = {}) {
  const {
    manifestPath,
    intervalMs = 1500,
    reloadFn = () => { try { window.location.reload(); } catch { } },
  } = options;

  if (!manifestPath || hotReloadTimer) return stopPanelHotReload;

  const manifest = readManifest(manifestPath);
  if (manifest) {
    lastHash = manifest.hash || null;
    lastMtime = manifest.mtime || 0;
  }

  hotReloadTimer = setInterval(() => {
    const next = readManifest(manifestPath);
    if (!next) return;
    const nextHash = next.hash || null;
    const nextMtime = next.mtime || 0;
    if (lastHash == null) {
      lastHash = nextHash;
      lastMtime = nextMtime;
      return;
    }
    if (nextHash !== lastHash || nextMtime !== lastMtime) {
      lastHash = nextHash;
      lastMtime = nextMtime;
      reloadFn();
    }
  }, intervalMs);

  return stopPanelHotReload;
}

export function stopPanelHotReload() {
  if (hotReloadTimer) {
    clearInterval(hotReloadTimer);
    hotReloadTimer = null;
  }
}
