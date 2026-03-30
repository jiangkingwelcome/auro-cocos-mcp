import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { loadSettings, saveSettings, applySettingsUpdate, DEFAULT_SETTINGS, type BridgeSettings } from '../../src/bridge-settings';

describe('bridge-settings', () => {
  let tmpDir: string;
  let settingsFile: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-settings-'));
    settingsFile = path.join(tmpDir, '.mcp-settings.json');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('loadSettings', () => {
    it('returns defaults when file does not exist', () => {
      const s = loadSettings(settingsFile);
      expect(s.rateLimitPerMinute).toBe(DEFAULT_SETTINGS.rateLimitPerMinute);
      expect(s.loopbackOnly).toBe(true);
      expect(s.maxBodySizeBytes).toBe(1_048_576);
      expect(s.autoRollback).toBe(true);
    });

    it('loads valid settings from file', () => {
      const custom: BridgeSettings = {
        rateLimitPerMinute: 500,
        loopbackOnly: false,
        maxBodySizeBytes: 2_097_152,
        autoRollback: false,
      };
      fs.writeFileSync(settingsFile, JSON.stringify(custom), 'utf-8');
      const s = loadSettings(settingsFile);
      expect(s).toEqual(custom);
    });

    it('falls back to defaults for missing fields', () => {
      fs.writeFileSync(settingsFile, JSON.stringify({ rateLimitPerMinute: 100 }), 'utf-8');
      const s = loadSettings(settingsFile);
      expect(s.rateLimitPerMinute).toBe(100);
      expect(s.loopbackOnly).toBe(true);
      expect(s.maxBodySizeBytes).toBe(1_048_576);
      expect(s.autoRollback).toBe(true);
    });

    it('falls back to defaults for wrong types', () => {
      fs.writeFileSync(settingsFile, JSON.stringify({
        rateLimitPerMinute: 'not-a-number',
        loopbackOnly: 42,
      }), 'utf-8');
      const s = loadSettings(settingsFile);
      expect(s.rateLimitPerMinute).toBe(DEFAULT_SETTINGS.rateLimitPerMinute);
      expect(s.loopbackOnly).toBe(true);
    });

    it('returns defaults on corrupt JSON', () => {
      fs.writeFileSync(settingsFile, '{broken json!!!', 'utf-8');
      const s = loadSettings(settingsFile);
      expect(s).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe('saveSettings', () => {
    it('writes settings to file', () => {
      const custom: BridgeSettings = {
        rateLimitPerMinute: 300,
        loopbackOnly: false,
        maxBodySizeBytes: 512_000,
        autoRollback: true,
      };
      saveSettings(settingsFile, custom);
      const raw = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
      expect(raw.rateLimitPerMinute).toBe(300);
      expect(raw.loopbackOnly).toBe(false);
    });

    it('does not throw on write failure', () => {
      expect(() => saveSettings('/nonexistent/path/settings.json', DEFAULT_SETTINGS)).not.toThrow();
    });
  });

  describe('applySettingsUpdate', () => {
    it('updates only provided fields', () => {
      const result = applySettingsUpdate(DEFAULT_SETTINGS, { rateLimitPerMinute: 500 });
      expect(result.rateLimitPerMinute).toBe(500);
      expect(result.loopbackOnly).toBe(true);
      expect(result.autoRollback).toBe(true);
    });

    it('clamps rateLimitPerMinute to min 10', () => {
      const result = applySettingsUpdate(DEFAULT_SETTINGS, { rateLimitPerMinute: 1 });
      expect(result.rateLimitPerMinute).toBe(10);
    });

    it('clamps rateLimitPerMinute to max 10000', () => {
      const result = applySettingsUpdate(DEFAULT_SETTINGS, { rateLimitPerMinute: 99999 });
      expect(result.rateLimitPerMinute).toBe(10000);
    });

    it('clamps maxBodySizeBytes to min 65536', () => {
      const result = applySettingsUpdate(DEFAULT_SETTINGS, { maxBodySizeBytes: 100 });
      expect(result.maxBodySizeBytes).toBe(65536);
    });

    it('clamps maxBodySizeBytes to max 52428800', () => {
      const result = applySettingsUpdate(DEFAULT_SETTINGS, { maxBodySizeBytes: 999_999_999 });
      expect(result.maxBodySizeBytes).toBe(52_428_800);
    });

    it('loopbackOnly 只能设为 true（不能通过 API 设为 false）', () => {
      // loopbackOnly=false 被安全策略拦截，值保持不变
      const result = applySettingsUpdate(DEFAULT_SETTINGS, { loopbackOnly: false, autoRollback: false });
      expect(result.loopbackOnly).toBe(true);
      expect(result.autoRollback).toBe(false);
    });

    it('loopbackOnly 可以设为 true（幂等）', () => {
      const base = { ...DEFAULT_SETTINGS, loopbackOnly: true };
      const result = applySettingsUpdate(base, { loopbackOnly: true });
      expect(result.loopbackOnly).toBe(true);
    });

    it('ignores non-matching types', () => {
      const result = applySettingsUpdate(DEFAULT_SETTINGS, { rateLimitPerMinute: 'bad' as unknown as number });
      expect(result.rateLimitPerMinute).toBe(DEFAULT_SETTINGS.rateLimitPerMinute);
    });
  });
});
