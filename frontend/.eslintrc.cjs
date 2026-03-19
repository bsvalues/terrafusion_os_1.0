module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  extends: ['eslint:recommended'],
  ignorePatterns: ['dist', '.eslintrc.js', 'node_modules', 'components-enhanced', '**/*.test.*'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react-hooks'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    'no-unused-vars': 'off', // Disabled for TypeScript (handled in upper workspace)
    '@typescript-eslint/no-explicit-any': 'warn',
    'prefer-const': 'warn',
    'no-console': 'off', // Temporarily disabled for cleanup
    'no-undef': 'off', // TypeScript handles this
    'no-redeclare': 'off', // TypeScript handles this
    'no-empty': 'warn',
    // Security rules (Phase 7 — government compliance essentials)
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    // Disable CSS-related errors for TypeScript files
    'css-syntax-error': 'off',
    'no-unknown-css-property': 'off',
    // DURABILITY: Prevent recurring expect(value, message) smell
    // Context: Observed in registryConsistency.test.ts + qualityGate.test.tsx
    // Pattern: expect() takes at most 1 argument (value), message via throw
    'no-restricted-syntax': [
      'error',
      {
        selector: 'CallExpression[callee.name="expect"][arguments.length>1]',
        message:
          'expect() takes at most one argument. Use error-first pattern: if (!condition) throw new Error(message); expect(value).matcher();',
      },
    ],
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        // Disable CSS linting entirely for TypeScript files
        'css/*': 'off',
      },
    },
    {
      files: [
        'apps/os-shell/src/auth/**/*.ts',
        'apps/os-shell/src/auth/**/*.tsx',
        'apps/os-shell/src/contracts/**/*.ts',
        'apps/os-shell/src/orchestration/**/*.ts',
        'apps/os-shell/src/routing/**/*.ts',
        'apps/os-shell/src/routing/**/*.tsx',
        'apps/os-shell/src/config/**/*.ts',
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
      },
    },
  ],
};
