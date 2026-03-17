/**
 * Mock for Cocos Creator globals (Editor, cc, etc.)
 * 用于将来测试依赖 Cocos 环境的模块（scene.ts / main.ts 等）
 * 当前 unit 测试不需要这些 mock，此文件供未来扩展使用。
 */

// Mock Editor global
export const EditorMock = {
  App: {
    path: '/mock/cocos-editor',
  },
  Message: {
    send: vi.fn(),
    request: vi.fn().mockResolvedValue({}),
    addBroadcastListener: vi.fn(),
    removeBroadcastListener: vi.fn(),
  },
  Panel: {
    open: vi.fn(),
    close: vi.fn(),
  },
  Dialog: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
};

// Mock cc (Cocos Creator engine) global
export const ccMock = {
  director: {
    getScene: vi.fn().mockReturnValue(null),
  },
  find: vi.fn().mockReturnValue(null),
  Node: class MockNode {
    name = 'MockNode';
    uuid = 'mock-uuid';
    active = true;
    parent: MockNode | null = null;
    children: MockNode[] = [];
    components: unknown[] = [];
  },
  Sprite: class MockSprite {},
  Label: class MockLabel {},
};

/**
 * 将 mock 注入到 global 供测试使用
 */
export function setupCocosGlobals() {
  (globalThis as Record<string, unknown>)['Editor'] = EditorMock;
  (globalThis as Record<string, unknown>)['cc'] = ccMock;
}

/**
 * 清理 global mock
 */
export function teardownCocosGlobals() {
  delete (globalThis as Record<string, unknown>)['Editor'];
  delete (globalThis as Record<string, unknown>)['cc'];
}
