module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  ignorePatterns: ['dist', '.eslintrc.js', 'node_modules', 'components-enhanced', '**/*.test.*'],
  plugins: ['@typescript-eslint'],
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
    '@typescript-eslint/no-unused-vars': 'off', // Matches no-unused-vars
    '@typescript-eslint/no-explicit-any': 'off', // Directive recognition only
    '@typescript-eslint/no-var-requires': 'off', // Legacy requires in codebase
    '@typescript-eslint/ban-ts-comment': 'off', // Legacy @ts-ignore usage
    '@typescript-eslint/ban-types': 'off', // Legacy Function type usage
    '@typescript-eslint/triple-slash-reference': 'off', // Vite env type refs
    '@typescript-eslint/no-namespace': 'off', // Legacy namespace usage
    'prefer-const': 'warn',
    'no-console': 'off', // Temporarily disabled for cleanup
    'no-undef': 'off', // TypeScript handles this
    'no-redeclare': 'off', // TypeScript handles this
    'no-empty': 'warn',
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
  ],
};
