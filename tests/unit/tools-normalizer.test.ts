import { describe, it, expect } from 'vitest';
import {
  normalizeComponentName,
  normalizeDbUrl,
  normalizeParams,
} from '../../src/mcp/tools';

// ─────────────────────────────────────────────────────────────────────────────
// 1. normalizeComponentName
// ─────────────────────────────────────────────────────────────────────────────
describe('normalizeComponentName', () => {
  it('小写已知组件名 → 规范大写', () => {
    expect(normalizeComponentName('sprite').finalName).toBe('Sprite');
    expect(normalizeComponentName('label').finalName).toBe('Label');
    expect(normalizeComponentName('button').finalName).toBe('Button');
    expect(normalizeComponentName('layout').finalName).toBe('Layout');
    expect(normalizeComponentName('widget').finalName).toBe('Widget');
    expect(normalizeComponentName('mask').finalName).toBe('Mask');
    expect(normalizeComponentName('camera').finalName).toBe('Camera');
    expect(normalizeComponentName('canvas').finalName).toBe('Canvas');
    expect(normalizeComponentName('scrollview').finalName).toBe('ScrollView');
    expect(normalizeComponentName('richtext').finalName).toBe('RichText');
    expect(normalizeComponentName('progressbar').finalName).toBe('ProgressBar');
    expect(normalizeComponentName('toggle').finalName).toBe('Toggle');
    expect(normalizeComponentName('uitransform').finalName).toBe('UITransform');
    expect(normalizeComponentName('uiopacity').finalName).toBe('UIOpacity');
  });

  it('cc. 前缀的组件名 → 去掉前缀并规范', () => {
    const r = normalizeComponentName('cc.Sprite');
    expect(r.finalName).toBe('Sprite');
    expect(r.corrected).toBe(false); // 'Sprite' 本身正确，无修正
  });

  it('cc. 前缀小写 → 去掉前缀并修正', () => {
    const r = normalizeComponentName('cc.sprite');
    expect(r.finalName).toBe('Sprite');
    expect(r.corrected).toBe(true);
    expect(r.from).toBe('cc.sprite');
  });

  it('已经是正确大写的组件名 → 不修改', () => {
    const r = normalizeComponentName('Sprite');
    expect(r.finalName).toBe('Sprite');
    expect(r.corrected).toBe(false);
  });

  it('空字符串 → 原样返回空字符串', () => {
    const r = normalizeComponentName('');
    expect(r.finalName).toBe('');
    expect(r.corrected).toBe(false);
  });

  it('未知组件名 → 原样保留（不修改）', () => {
    const r = normalizeComponentName('MyCustomComponent');
    expect(r.finalName).toBe('MyCustomComponent');
    expect(r.corrected).toBe(false);
  });

  it('全大写未知组件名 → 原样保留', () => {
    const r = normalizeComponentName('UNKNOWNCOMP');
    expect(r.finalName).toBe('UNKNOWNCOMP');
    expect(r.corrected).toBe(false);
  });

  it('修正时 corrected=true 且 from 记录原始值', () => {
    const r = normalizeComponentName('scrollview');
    expect(r.corrected).toBe(true);
    expect(r.from).toBe('scrollview');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. normalizeDbUrl
//    CASE_NORMALIZE_MAP 已被清空（设计决策：信任 AI 传入路径，避免强行规范化
//    导致与真实目录名不匹配）。因此 normalizeDbUrl 不会修改任何路径段。
// ─────────────────────────────────────────────────────────────────────────────
describe('normalizeDbUrl', () => {
  it('大写路径段无规范化（CASE_NORMALIZE_MAP 已清空）', () => {
    const r = normalizeDbUrl('db://assets/Prefabs/Hero.prefab');
    expect(r.normalized).toBe(false);
    expect(r.url).toBe('db://assets/Prefabs/Hero.prefab');
  });

  it('Scripts 路径段保持原样', () => {
    const r = normalizeDbUrl('db://assets/Scripts/Player.ts');
    expect(r.normalized).toBe(false);
    expect(r.url).toBe('db://assets/Scripts/Player.ts');
  });

  it('Scenes 路径段保持原样', () => {
    const r = normalizeDbUrl('db://assets/Scenes/Main.scene');
    expect(r.normalized).toBe(false);
    expect(r.url).toBe('db://assets/Scenes/Main.scene');
  });

  it('Textures 路径段保持原样', () => {
    const r = normalizeDbUrl('db://assets/Textures/bg.png');
    expect(r.normalized).toBe(false);
    expect(r.url).toBe('db://assets/Textures/bg.png');
  });

  it('已经是小写路径 → 不修改（normalized=false）', () => {
    const r = normalizeDbUrl('db://assets/prefabs/Hero.prefab');
    expect(r.normalized).toBe(false);
    expect(r.url).toBe('db://assets/prefabs/Hero.prefab');
  });

  it('全大写目录名保持原样', () => {
    const r = normalizeDbUrl('db://assets/PREFABS/test.prefab');
    expect(r.normalized).toBe(false);
    expect(r.url).toBe('db://assets/PREFABS/test.prefab');
  });

  it('非 db:// 协议 → 原样返回', () => {
    const r = normalizeDbUrl('file://assets/foo.ts');
    expect(r.normalized).toBe(false);
    expect(r.url).toBe('file://assets/foo.ts');
  });

  it('空字符串 → 原样返回', () => {
    const r = normalizeDbUrl('');
    expect(r.normalized).toBe(false);
    expect(r.url).toBe('');
  });

  it('非 assets 子路径的 db:// → 不修改', () => {
    const r = normalizeDbUrl('db://internal/foo');
    expect(r.normalized).toBe(false);
    expect(r.url).toBe('db://internal/foo');
  });

  it('多路径段全部保持原样', () => {
    const r = normalizeDbUrl('db://assets/Textures/Sprites/icon.png');
    expect(r.normalized).toBe(false);
    expect(r.url).toBe('db://assets/Textures/Sprites/icon.png');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. normalizeParams
//    CASE_NORMALIZE_MAP 清空后，normalizeParams 也不再产生路径 warning
// ─────────────────────────────────────────────────────────────────────────────
describe('normalizeParams', () => {
  it('大写路径段不产生 warning（无规范化）', () => {
    const params: Record<string, any> = { url: 'db://assets/Prefabs/foo.prefab' };
    const { warnings } = normalizeParams(params);

    expect(params.url).toBe('db://assets/Prefabs/foo.prefab');
    expect(warnings.length).toBe(0);
  });

  it('sourceUrl 字段保持原样', () => {
    const params: Record<string, any> = { sourceUrl: 'db://assets/Scripts/Foo.ts' };
    const { warnings } = normalizeParams(params);

    expect(params.sourceUrl).toBe('db://assets/Scripts/Foo.ts');
    expect(warnings.length).toBe(0);
  });

  it('targetUrl 字段保持原样', () => {
    const params: Record<string, any> = { targetUrl: 'db://assets/Scenes/Main.scene' };
    const { warnings } = normalizeParams(params);

    expect(params.targetUrl).toBe('db://assets/Scenes/Main.scene');
    expect(warnings.length).toBe(0);
  });

  it('savePath 字段保持原样', () => {
    const params: Record<string, any> = { savePath: 'db://assets/Materials/Mat.mtl' };
    const { warnings } = normalizeParams(params);

    expect(params.savePath).toBe('db://assets/Materials/Mat.mtl');
    expect(warnings.length).toBe(0);
  });

  it('多个大写 URL 字段无 warning', () => {
    const params: Record<string, any> = {
      url: 'db://assets/Prefabs/a.prefab',
      targetUrl: 'db://assets/Scenes/b.scene',
    };
    const { warnings } = normalizeParams(params);

    expect(warnings.length).toBe(0);
    expect(params.url).toBe('db://assets/Prefabs/a.prefab');
    expect(params.targetUrl).toBe('db://assets/Scenes/b.scene');
  });

  it('已经规范化的路径无 warning', () => {
    const params: Record<string, any> = { url: 'db://assets/prefabs/foo.prefab' };
    const { warnings } = normalizeParams(params);

    expect(warnings.length).toBe(0);
  });

  it('非 db:// 的 URL 字段不处理', () => {
    const params: Record<string, any> = { url: 'file://assets/foo.ts' };
    const { warnings } = normalizeParams(params);

    expect(warnings.length).toBe(0);
    expect(params.url).toBe('file://assets/foo.ts');
  });

  it('无 URL 字段的 params 不产生 warning', () => {
    const params: Record<string, any> = { name: 'test', count: 42 };
    const { warnings } = normalizeParams(params);

    expect(warnings.length).toBe(0);
    expect(params.name).toBe('test');
  });
});
