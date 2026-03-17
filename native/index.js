'use strict';

const os = require('os');
const path = require('path');
const fs = require('fs');

const platform = os.platform();
const arch = os.arch();

const PLATFORM_MAP = {
  'win32-x64': 'cocos_pro.win32-x64-msvc.node',
  'darwin-x64': 'cocos_pro.darwin-x64.node',
  'darwin-arm64': 'cocos_pro.darwin-arm64.node',
  'linux-x64': 'cocos_pro.linux-x64-gnu.node',
};

const key = `${platform}-${arch}`;
const filename = PLATFORM_MAP[key];

if (!filename) {
  console.warn(`[cocos-pro] Unsupported platform: ${key}. Pro features disabled.`);
  module.exports = null;
} else {
  const nodePath = path.join(__dirname, filename);
  if (fs.existsSync(nodePath)) {
    try {
      module.exports = require(nodePath);
    } catch (err) {
      console.warn(`[cocos-pro] Failed to load native module: ${err.message}. Pro features disabled.`);
      module.exports = null;
    }
  } else {
    // No native binary — Community Edition
    module.exports = null;
  }
}
