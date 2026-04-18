import fs from 'fs';
import path from 'path';
import { ErrorCategory, logError, logIgnored } from './error-utils';

export interface BridgeSettings {
  rateLimitPerMinute: number;
  loopbackOnly: boolean;
  maxBodySizeBytes: number;
  autoRollback: boolean;
}

export const DEFAULT_RATE_LIMIT_PER_MINUTE = Number(process.env.COCOS_MCP_RATE_LIMIT || 1200);

export const DEFAULT_SETTINGS: BridgeSettings = {
  rateLimitPerMinute: DEFAULT_RATE_LIMIT_PER_MINUTE,
  loopbackOnly: true,
  maxBodySizeBytes: 1_048_576,
  autoRollback: true,
};

export function loadSettings(settingsFile: string): BridgeSettings {
  try {
    if (fs.existsSync(settingsFile)) {
      const raw = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
      return {
        rateLimitPerMinute: typeof raw.rateLimitPerMinute === 'number' ? raw.rateLimitPerMinute : DEFAULT_SETTINGS.rateLimitPerMinute,
        loopbackOnly: typeof raw.loopbackOnly === 'boolean' ? raw.loopbackOnly : DEFAULT_SETTINGS.loopbackOnly,
        maxBodySizeBytes: typeof raw.maxBodySizeBytes === 'number' ? raw.maxBodySizeBytes : DEFAULT_SETTINGS.maxBodySizeBytes,
        autoRollback: typeof raw.autoRollback === 'boolean' ? raw.autoRollback : DEFAULT_SETTINGS.autoRollback,
      };
    }
  } catch (e) {
    logIgnored(ErrorCategory.CONFIG, '加载设置文件失败，使用默认值', e);
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settingsFile: string, settings: BridgeSettings) {
  try {
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (e) {
    logError(ErrorCategory.CONFIG, '保存设置文件失败', e);
  }
}

export async function loadSettingsAsync(settingsFile: string): Promise<BridgeSettings> {
  try {
    await fs.promises.access(settingsFile, fs.constants.F_OK);
    const raw = JSON.parse(await fs.promises.readFile(settingsFile, 'utf-8'));
    return {
      rateLimitPerMinute: typeof raw.rateLimitPerMinute === 'number' ? raw.rateLimitPerMinute : DEFAULT_SETTINGS.rateLimitPerMinute,
      loopbackOnly: typeof raw.loopbackOnly === 'boolean' ? raw.loopbackOnly : DEFAULT_SETTINGS.loopbackOnly,
      maxBodySizeBytes: typeof raw.maxBodySizeBytes === 'number' ? raw.maxBodySizeBytes : DEFAULT_SETTINGS.maxBodySizeBytes,
      autoRollback: typeof raw.autoRollback === 'boolean' ? raw.autoRollback : DEFAULT_SETTINGS.autoRollback,
    };
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err?.code !== 'ENOENT') {
      logIgnored(ErrorCategory.CONFIG, '加载设置文件失败，使用默认值', e);
    }
  }
  return { ...DEFAULT_SETTINGS };
}

let settingsWriteQueue: Promise<void> = Promise.resolve();

export function saveSettingsAsync(settingsFile: string, settings: BridgeSettings): Promise<void> {
  settingsWriteQueue = settingsWriteQueue.then(async () => {
    let tempFile = '';
    try {
      const dir = path.dirname(settingsFile);
      const fileName = path.basename(settingsFile);
      tempFile = path.join(dir, `.${fileName}.${process.pid}.${Date.now()}.tmp`);
      await fs.promises.writeFile(tempFile, JSON.stringify(settings, null, 2), 'utf-8');
      await fs.promises.rename(tempFile, settingsFile);
    } catch (e) {
      if (tempFile) {
        try {
          await fs.promises.rm(tempFile, { force: true });
        } catch (_ignored) {
          // best-effort temp cleanup
        }
      }
      logError(ErrorCategory.CONFIG, '保存设置文件失败', e);
    }
  });
  return settingsWriteQueue;
}

export function applySettingsUpdate(currentSettings: BridgeSettings, payload: Partial<BridgeSettings>): BridgeSettings {
  const next = { ...currentSettings };
  if (typeof payload.rateLimitPerMinute === 'number') {
    next.rateLimitPerMinute = Math.max(10, Math.min(10000, payload.rateLimitPerMinute));
  }
  if (payload.loopbackOnly === true) {
    next.loopbackOnly = true;
  }
  if (typeof payload.maxBodySizeBytes === 'number') {
    next.maxBodySizeBytes = Math.max(65536, Math.min(52_428_800, payload.maxBodySizeBytes));
  }
  if (typeof payload.autoRollback === 'boolean') {
    next.autoRollback = payload.autoRollback;
  }
  return next;
}
