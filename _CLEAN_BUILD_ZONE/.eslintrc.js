module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:storybook/recommended'],
  ignorePatterns: ['dist', '.eslintrc.js', 'node_modules', 'components-enhanced', '**/*.test.*'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    'no-unused-vars': 'off', // Disabled for TypeScript
    'prefer-const': 'warn',
    'no-console': 'off', // Temporarily disabled for cleanup
    'no-undef': 'off', // TypeScript handles this
    'no-redeclare': 'off', // TypeScript handles this
    'no-empty': 'warn',
  },
};