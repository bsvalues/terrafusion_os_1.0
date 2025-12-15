/** @type {import('jest').Config} */
const config = {
  // Use jsdom for browser-like testing environment
  testEnvironment: 'jsdom',

  // Setup files to run after Jest is initialized
  setupFilesAfterEnv: ['<rootDir>/apps/os-shell/src/setupTests.ts'],

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
    '^@assets/(.*)$': '<rootDir>/apps/os-shell/src/assets/$1',

    // Mock static assets
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg|webp)$': '<rootDir>/apps/os-shell/src/__mocks__/fileMock.ts',
    '\\.(mp4|webm|ogg|mp3|wav|flac|aac)$': '<rootDir>/apps/os-shell/src/__mocks__/fileMock.ts',
  },

  // Transform files with ts-jest
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

  // ESM support
  extensionsToTreatAsEsm: ['.ts', '.tsx'],

  // Test file patterns
  testMatch: [
    '<rootDir>/apps/os-shell/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/apps/os-shell/src/**/*.{test,spec}.{ts,tsx}',
    '<rootDir>/tests/**/*.{test,spec}.{ts,tsx}',
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
    '<rootDir>/tests/integration/',
    '\\.spec\\.ts$', // Playwright uses .spec.ts convention
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
