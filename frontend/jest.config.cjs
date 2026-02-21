/** @type {import('jest').Config} */
const config = {
  // Use jsdom for browser-like testing environment
  testEnvironment: 'jsdom',

  // Setup files to run after Jest is initialized
  setupFilesAfterEnv: ['<rootDir>/apps/os-shell/src/setupTests.ts'],

  // Global variables available in all tests
  globals: {
    'import.meta': {
      env: {
        VITE_API_URL: 'http://localhost:5000',
        VITE_COUNTY_NAME: 'Benton County',
        VITE_COUNTY_CODE: 'benton',
        DEV: true,
        PROD: false,
        MODE: 'test',
      },
    },
  },

  // Module name mapping for path aliases and static assets
  moduleNameMapper: {
    // Path aliases from tsconfig
    '^@/(.*)$': '<rootDir>/apps/os-shell/src/$1',
    '^@components/(.*)$': '<rootDir>/apps/os-shell/src/components/$1',
    '^@ui/(.*)$': '<rootDir>/apps/os-shell/src/components/ui/$1',
    '^@design-system/(.*)$': '<rootDir>/apps/os-shell/src/design-system/$1',
    '^@hooks/(.*)$': '<rootDir>/apps/os-shell/src/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/apps/os-shell/src/utils/$1',
    '^@lib/(.*)$': '<rootDir>/apps/os-shell/src/lib/$1',
    '^@terrafusion/ui$': '<rootDir>/../packages/ui/src/index.ts',
    '^@assets/(.*)$': '<rootDir>/apps/os-shell/src/assets/$1',

    // Mock static assets
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg|webp)$': '<rootDir>/apps/os-shell/src/__mocks__/fileMock.ts',
    '\\.(mp4|webm|ogg|mp3|wav|flac|aac)$': '<rootDir>/apps/os-shell/src/__mocks__/fileMock.ts',
  },

  // Transform files with ts-jest and import.meta handling
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },

  // Inline transform for import.meta.env (runs before ts-jest)
  transformIgnorePatterns: ['/node_modules/(?!(@radix-ui|class-variance-authority)/)'],

  // ESM support
  extensionsToTreatAsEsm: ['.ts', '.tsx'],

  // Test file patterns
  testMatch: [
    '<rootDir>/apps/os-shell/src/**/__tests__/**/*.test.{ts,tsx}',
    '<rootDir>/apps/os-shell/src/**/*.test.{ts,tsx}',
    '<rootDir>/tests/**/*.test.{ts,tsx}',
    '!**/*.vitest.test.{ts,tsx}',
  ],

  // Files to collect coverage from
  collectCoverageFrom: [
    'apps/os-shell/src/**/*.{ts,tsx}',
    '!apps/os-shell/src/**/*.d.ts',
    '!apps/os-shell/src/**/*.stories.{ts,tsx}',
    '!apps/os-shell/src/main.tsx',
    '!apps/os-shell/src/vite-env.d.ts',
    '!apps/os-shell/src/setupTests.ts',
    '!apps/os-shell/src/__mocks__/**',
    '!apps/os-shell/src/**/index.{ts,tsx}',
  ],

  // Coverage thresholds (start conservative, increase over time)
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // Coverage reporters
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],
  coverageDirectory: '<rootDir>/coverage',

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
    '<rootDir>/coverage/',
    'tests/integration',
    'tests/accessibility',
    '\\.integration\\.test\\.[tj]sx?$',
    '\\.vitest\\.test\\.[tj]sx?$',
    'scripts/tag_lint.py',
    'scripts/scan_todos.py',
  ],

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // The maximum amount of workers used to run tests
  maxWorkers: '50%',

  // Indicates whether each individual test should be reported during the run
  verbose: true,

  // Automatically restore mock state between every test
  restoreMocks: true,

  // Global test timeout (10 seconds)
  testTimeout: 10000,
};

module.exports = config;
