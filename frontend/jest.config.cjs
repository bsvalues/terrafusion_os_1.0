const path = require('path');
/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/apps/os-shell/src/setupTests.ts'],
  globals: { 'import.meta': { env: { VITE_API_URL: 'http://localhost:5000', VITE_COUNTY_NAME: 'Benton County', VITE_COUNTY_CODE: 'benton', DEV: true, PROD: false, MODE: 'test' } } },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/apps/os-shell/src/$1',
    '^@components/(.*)$': '<rootDir>/apps/os-shell/src/components/$1',
    '^@ui/(.*)$': '<rootDir>/apps/os-shell/src/components/ui/$1',
    '^@design-system/(.*)$': '<rootDir>/apps/os-shell/src/design-system/$1',
    '^@hooks/(.*)$': '<rootDir>/apps/os-shell/src/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/apps/os-shell/src/utils/$1',
    '^@lib/(.*)$': '<rootDir>/apps/os-shell/src/lib/$1',
    '^@assets/(.*)$': '<rootDir>/apps/os-shell/src/assets/$1',
    'os-platform/core/canon/layoutEnvelope\.mjs$': path.resolve(__dirname, '..', 'os-platform', 'core', 'canon', 'layoutEnvelope.jest.cjs'),
    '\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\.(jpg|jpeg|png|gif|svg|webp)$': '<rootDir>/apps/os-shell/src/__mocks__/fileMock.ts',
    '\.(mp4|webm|ogg|mp3|wav|flac|aac)$': '<rootDir>/apps/os-shell/src/__mocks__/fileMock.ts',
  },
  transform: { '^.+\.tsx?$': ['ts-jest', { useESM: true, tsconfig: { jsx: 'react-jsx', esModuleInterop: true, allowSyntheticDefaultImports: true } }] },
  transformIgnorePatterns: ['/node_modules/(?!(@radix-ui|class-variance-authority)/)'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  testMatch: ['<rootDir>/apps/os-shell/src/**/__tests__/**/*.test.{ts,tsx}', '<rootDir>/apps/os-shell/src/**/*.test.{ts,tsx}', '<rootDir>/tests/**/*.test.{ts,tsx}', '!**/*.vitest.test.{ts,tsx}'],
  collectCoverageFrom: ['apps/os-shell/src/**/*.{ts,tsx}', '!apps/os-shell/src/**/*.d.ts', '!apps/os-shell/src/**/*.stories.{ts,tsx}', '!apps/os-shell/src/main.tsx', '!apps/os-shell/src/vite-env.d.ts', '!apps/os-shell/src/setupTests.ts', '!apps/os-shell/src/__mocks__/**', '!apps/os-shell/src/**/index.{ts,tsx}'],
  coverageThreshold: { global: { branches: 50, functions: 50, lines: 50, statements: 50 } },
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],
  coverageDirectory: '<rootDir>/coverage',
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/', '<rootDir>/build/', '<rootDir>/coverage/', 'tests/integration', 'tests/accessibility', '\.integration\.test\.[tj]sx?$', '\.vitest\.test\.[tj]sx?$', 'scripts/tag_lint.py', 'scripts/scan_todos.py'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  clearMocks: true, maxWorkers: '50%', verbose: true, restoreMocks: true, testTimeout: 10000,
};
module.exports = config;
