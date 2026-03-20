import { installConsoleCapture } from './console-capture';
import * as core from './core';

// Install console capture as early as possible — before any other code runs
installConsoleCapture();

export function load() {
  core.load();
}

export function unload() {
  core.unload();
}

export const methods = {
  startServer() {
    return core.startServer();
  },
  stopServer() {
    core.stopServer();
  },
  restartServer() {
    return core.restartServer();
  },
  openPanel() {
    core.methods.openPanel();
  },
  getServiceInfo() {
    return core.getServiceInfo();
  },
  configureIDE(...args: unknown[]) {
    return core.configureIDE(...args);
  },
  configureCursor() {
    return core.configureIDE('cursor');
  },
  getSettings() {
    return core.getSettings();
  },
  updateSettings(...args: unknown[]) {
    return core.updateSettings(...args);
  },
  setToolEnabled(...args: unknown[]) {
    return core.setToolEnabled(...args);
  },
  resetSettings() {
    return core.resetSettings();
  },
  getLicenseStatus() {
    return core.getLicenseStatus();
  },
  activateLicense(...args: unknown[]) {
    return core.activateLicense(...args);
  },
  onSceneReady() {
    core.methods.onSceneReady();
  },
  checkForUpdates() {
    return core.checkForUpdates();
  },
  downloadUpdate() {
    return core.downloadUpdate();
  },
  installUpdate() {
    return core.installUpdate();
  },
  resetUpdateState() {
    return core.resetUpdateState();
  },
};
