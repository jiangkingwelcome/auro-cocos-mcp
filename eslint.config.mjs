import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // 全局忽略
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      '*.config.*',
      'stdio-shim/*.cjs',
    ],
  },

  // JS 推荐规则
  js.configs.recommended,

  // TS 推荐规则
  ...tseslint.configs.recommended,

  // 项目级规则微调
  {
    rules: {
      // no-undef 对 TS 无意义（tsc 已覆盖）
      'no-undef': 'off',
      // 关闭 JS no-unused-vars（由 TS 版本接管）
      'no-unused-vars': 'off',
      // 允许 any（逐步收紧）
      '@typescript-eslint/no-explicit-any': 'error',
      // 未使用变量以 _ 开头时忽略
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      // 允许 require（服务端兼容）
      '@typescript-eslint/no-require-imports': 'off',
      // 允许空 catch
      'no-empty': ['error', { allowEmptyCatch: true }],
      // 允许 namespace
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/ban-ts-comment': ['error', {
        'ts-expect-error': 'allow-with-description',
        'ts-ignore': false,
        'ts-nocheck': false,
        minimumDescriptionLength: 10,
      }],
      // Cocos 场景脚本中 const self = this 属于既有模式
      '@typescript-eslint/no-this-alias': 'off',
      // editor.d.ts 使用 Function 类型声明 Cocos Editor API，降为警告
      '@typescript-eslint/no-unsafe-function-type': 'warn',
    },
  },

  // 测试代码允许更灵活的断言和夹具写法
  {
    files: ['tests/**/*.{ts,js,mjs,cjs}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
);
