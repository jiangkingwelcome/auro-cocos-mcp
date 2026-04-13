import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      include: [
        'src/mcp/**/*.ts',
        'src/token-manager.ts',
        'src/registry.ts',
        'src/error-utils.ts',
        'src/operation-manager.ts',
        'src/bridge-settings.ts',
      ],
      exclude: [
        'src/panels/**',
        'src/main.ts',
        'src/core.ts',
        'src/scene.ts',
        'src/scene-query-handlers.ts',
        'src/scene-operation-handlers.ts',
        'src/scene-types.ts',
        'src/console-capture.ts',
        'src/ide-config-service.ts',
        'src/routes/**',
        'src/mcp/tools-animation.ts',
        'src/mcp/tools-atomic-animation.ts',
        'src/mcp/tools-atomic-stubs.ts',
      ],
      reporter: ['text', 'html'],
      thresholds: {
        lines: 70,
        functions: 75,
        branches: 55,
      },
    },
  },
});
