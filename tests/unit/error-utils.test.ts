import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ErrorCategory, LogLevel, setLogLevel,
  logIgnored, logWarn, logError,
  safeExec, safeExecAsync,
  safeSetProperties, safeStringify, safeJsonClone,
} from '../../src/error-utils';

describe('error-utils', () => {
  beforeEach(() => {
    setLogLevel(LogLevel.DEBUG);
  });

  describe('logIgnored', () => {
    it('logs debug message with category and context', () => {
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      logIgnored(ErrorCategory.CONFIG, 'test context');
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('[CONFIG]'));
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('test context'));
      spy.mockRestore();
    });

    it('includes error message when provided', () => {
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      logIgnored(ErrorCategory.SERIALIZATION, 'parsing', new Error('bad json'));
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('bad json'));
      spy.mockRestore();
    });

    it('respects log level - silent suppresses debug', () => {
      setLogLevel(LogLevel.SILENT);
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      logIgnored(ErrorCategory.CONFIG, 'should not appear');
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('logWarn', () => {
    it('logs warning with category', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      logWarn(ErrorCategory.ENGINE_API, 'engine issue');
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('[ENGINE_API]'));
      spy.mockRestore();
    });

    it('suppressed when log level is ERROR', () => {
      setLogLevel(LogLevel.ERROR);
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      logWarn(ErrorCategory.CONFIG, 'hidden');
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('logError', () => {
    it('logs error with category', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      logError(ErrorCategory.EDITOR_IPC, 'ipc failed', 'detail');
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('[EDITOR_IPC]'));
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('detail'));
      spy.mockRestore();
    });

    it('handles non-Error objects', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      logError(ErrorCategory.UNKNOWN, 'ctx', { code: 42 });
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('safeExec', () => {
    it('returns function result on success', () => {
      const result = safeExec(ErrorCategory.CONFIG, 'test', () => 42, 0);
      expect(result).toBe(42);
    });

    it('returns fallback on exception', () => {
      const result = safeExec(ErrorCategory.CONFIG, 'test', () => { throw new Error('boom'); }, -1);
      expect(result).toBe(-1);
    });
  });

  describe('safeExecAsync', () => {
    it('returns async result on success', async () => {
      const result = await safeExecAsync(ErrorCategory.CONFIG, 'test', async () => 'ok', 'fail');
      expect(result).toBe('ok');
    });

    it('returns fallback on async exception', async () => {
      const result = await safeExecAsync(ErrorCategory.CONFIG, 'test', async () => { throw new Error('boom'); }, 'fallback');
      expect(result).toBe('fallback');
    });
  });

  describe('safeSetProperties', () => {
    it('applies all properties successfully', () => {
      const target: Record<string, unknown> = {};
      const { applied, skipped } = safeSetProperties(target, { a: 1, b: 'hello' }, 'test');
      expect(applied).toEqual(['a', 'b']);
      expect(skipped).toEqual([]);
      expect(target.a).toBe(1);
    });

    it('skips properties that throw on assignment', () => {
      const target = Object.defineProperty({}, 'readonly', {
        get: () => 0,
        set: () => { throw new Error('readonly'); },
      }) as Record<string, unknown>;
      const { applied, skipped } = safeSetProperties(target, { readonly: 1, normal: 2 }, 'test');
      expect(skipped).toContain('readonly');
      expect(applied).toContain('normal');
    });
  });

  describe('safeStringify', () => {
    it('stringifies normal objects', () => {
      expect(safeStringify({ a: 1 })).toBe('{"a":1}');
    });

    it('returns fallback for circular references', () => {
      const obj: Record<string, unknown> = {};
      obj.self = obj;
      const result = safeStringify(obj, 'circular');
      expect(result).toBe('circular');
    });
  });

  describe('safeJsonClone', () => {
    it('deep clones plain objects', () => {
      const orig = { a: 1, b: { c: 2 } };
      const cloned = safeJsonClone(orig) as typeof orig;
      expect(cloned).toEqual(orig);
      expect(cloned).not.toBe(orig);
    });

    it('returns string for non-serializable values', () => {
      const obj: Record<string, unknown> = {};
      obj.self = obj;
      const result = safeJsonClone(obj);
      expect(typeof result).toBe('string');
    });
  });
});
