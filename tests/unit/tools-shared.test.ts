import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  toStr,
  sanitizeDbUrl,
  sanitizeOsPath,
  normalizeParams,
  withGuardrailHints,
  extractSelectedNodeUuid,
  normalizeComponentName,
  validateRequiredParams,
  toInputSchema,
} from '../../src/mcp/tools-shared';

describe('tools-shared', () => {
  describe('toStr', () => {
    it('returns fallback for nullish values', () => {
      expect(toStr(undefined, 'fallback')).toBe('fallback');
      expect(toStr(null, 'fallback')).toBe('fallback');
    });

    it('casts non-string values with String()', () => {
      expect(toStr(123)).toBe('123');
      expect(toStr(true)).toBe('true');
    });
  });

  describe('sanitizeDbUrl', () => {
    it('accepts safe db://assets and db://internal urls', () => {
      expect(sanitizeDbUrl('db://assets/foo/bar.prefab')).toBeNull();
      expect(sanitizeDbUrl('db://internal/tmp/config.json')).toBeNull();
    });

    it('rejects invalid protocol and traversal with bilingual error', () => {
      const badProtocol = sanitizeDbUrl('file://assets/a.prefab');
      expect(badProtocol).toContain('Invalid db URL');
      expect(badProtocol).toContain('非法资源路径');

      const traversal = sanitizeDbUrl('db://assets/../secret.txt');
      expect(traversal).toContain('path traversal');
      expect(traversal).toContain('路径遍历');
    });
  });

  describe('sanitizeOsPath', () => {
    it('accepts regular local path', () => {
      expect(sanitizeOsPath('C:/project/assets/a.png')).toBeNull();
    });

    it('rejects null-byte and traversal path', () => {
      const withNull = sanitizeOsPath('C:/a\0/b.png');
      expect(withNull).toContain('Invalid file path');
      expect(withNull).toContain('非法文件路径');

      const traversal = sanitizeOsPath('../etc/passwd');
      expect(traversal).toContain('path traversal');
      expect(traversal).toContain('路径遍历');
    });
  });

  describe('normalizeParams', () => {
    it('returns pathError with field location for dangerous db url', () => {
      const result = normalizeParams({ url: 'db://assets/../../hack.ts' });
      expect(result.pathError).toContain('[url]');
      expect(result.pathError).toContain('Invalid db URL');
    });

    it('validates batch_import file entries', () => {
      const result = normalizeParams({
        files: [
          { sourcePath: '../tmp/a.png', targetUrl: 'db://assets/textures/a.png' },
        ],
      });
      expect(result.pathError).toContain('[files[0].sourcePath]');
    });
  });

  describe('withGuardrailHints', () => {
    it('adds bilingual suggestion when component class is missing', () => {
      const out = withGuardrailHints({ error: '未找到组件类 MyComp' }) as Record<string, unknown>;
      expect(String(out.suggestion)).toContain('Try component names');
      expect(String(out.suggestion)).toContain('可尝试组件名');
    });

    it('keeps original result for non-component errors', () => {
      const out = withGuardrailHints({ error: '节点不存在' });
      expect((out as Record<string, unknown>).suggestion).toBeUndefined();
    });
  });

  describe('extractSelectedNodeUuid', () => {
    it('extracts first selected uuid from selection payload', () => {
      expect(extractSelectedNodeUuid({ selected: ['uuid-a', 'uuid-b'] })).toBe('uuid-a');
    });

    it('returns empty string for invalid payloads', () => {
      expect(extractSelectedNodeUuid({ selected: [] })).toBe('');
      expect(extractSelectedNodeUuid(null)).toBe('');
    });
  });

  describe('normalizeComponentName', () => {
    it('returns lowercase name and correct boolean for unknown components', () => {
      const res = normalizeComponentName('UnknownComp');
      expect(res.finalName).toBe('UnknownComp');
      expect(res.corrected).toBe(false);
    });

    it('translates canonical component names', () => {
      const res = normalizeComponentName('sprite');
      expect(res.finalName).toBe('Sprite');
      expect(res.corrected).toBe(true);
      expect(res.from).toBe('sprite');
    });

    it('strips cc. prefix before checking', () => {
      const res = normalizeComponentName('cc.Label');
      expect(res.finalName).toBe('Label');
      expect(res.corrected).toBe(false);
    });
  });

  describe('validateRequiredParams', () => {
    it('returns bilingual missing-params message', () => {
      const msg = validateRequiredParams('scene_operation', 'set_position', { uuid: 'n1' }) ?? '';
      expect(msg).toContain('Missing required params');
      expect(msg).toContain('缺少必需参数');
      expect(msg).toContain('x');
      expect(msg).toContain('y');
    });

    it('returns null when params are complete', () => {
      const msg = validateRequiredParams('scene_operation', 'set_position', { uuid: 'n1', x: 1, y: 2 });
      expect(msg).toBeNull();
    });
  });

  describe('toInputSchema', () => {
    it('produces json schema object without $schema field', () => {
      const schema = toInputSchema({
        action: z.string(),
        count: z.number().optional(),
      }) as Record<string, unknown>;

      expect(schema.type).toBe('object');
      expect(schema.$schema).toBeUndefined();
      expect(schema.additionalProperties).toBeUndefined();
      expect(schema.properties).toBeTruthy();
    });
  });
});
