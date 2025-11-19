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
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    'no-unused-vars': 'off', // Disabled for TypeScript (handled in upper workspace)
    'prefer-const': 'warn',
    'no-console': 'off', // Temporarily disabled for cleanup
    'no-undef': 'off', // TypeScript handles this
    'no-redeclare': 'off', // TypeScript handles this
    'no-empty': 'warn',
    // Disable CSS-related errors for TypeScript files
    'css-syntax-error': 'off',
    'no-unknown-css-property': 'off',
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        // Disable CSS linting entirely for TypeScript files
        'css/*': 'off',
      },
    },
  ],
};
