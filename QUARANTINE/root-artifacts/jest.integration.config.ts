/**
 * Jest Configuration for TerraFusion OS 1.0 Integration Tests
 * 
 * MIT/PhD-Level Testing Configuration
 * 
 * This configuration enables comprehensive integration testing with:
 * - TypeScript support
 * - Code coverage reporting
 * - Performance testing
 * - Parallel test execution (when safe)
 * - Detailed reporting
 * 
 * @author TerraFusion Systems Engineering Team
 */

import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  // Use ts-jest for TypeScript support
  preset: 'ts-jest',
  
  // Test environment
  testEnvironment: 'node',
  
  // Root directory for tests
  roots: ['<rootDir>/backend/tests'],
  
  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)',
  ],
  
  // Transform files with ts-jest
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  collectCoverageFrom: [
    'backend/src/**/*.{ts,tsx}',
    '!backend/src/**/*.d.ts',
    '!backend/src/**/*.interface.ts',
    '!backend/src/**/*.type.ts',
    '!backend/src/**/index.ts',
  ],
  
  // Coverage thresholds (MIT/PhD standards)
  coverageThresholds: {
    global: {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  
  // Coverage reporters
  coverageReporters: ['text', 'text-summary', 'html', 'lcov', 'json'],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/backend/tests/setup.ts'],
  
  // Global timeout for all tests
  testTimeout: 60000, // 60 seconds for integration tests
  
  // Retry failed tests
  retry: 3,
  
  // Verbose output
  verbose: true,
  
  // Detect open handles (memory leaks)
  detectOpenHandles: true,
  
  // Force exit after tests complete
  forceExit: true,
  
  // Maximum number of workers
  maxWorkers: '50%', // Use 50% of available CPU cores
  
  // Module name mapper for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/backend/src/$1',
    '^@tests/(.*)$': '<rootDir>/backend/tests/$1',
    '^@core/(.*)$': '<rootDir>/backend/src/core/$1',
    '^@modules/(.*)$': '<rootDir>/backend/src/modules/$1',
  },
  
  // Global setup/teardown
  globalSetup: '<rootDir>/backend/tests/global-setup.ts',
  globalTeardown: '<rootDir>/backend/tests/global-teardown.ts',
  
  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Reporters
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/test-results',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
      },
    ],
    [
      'jest-html-reporter',
      {
        pageTitle: 'TerraFusion OS 1.0 - Integration Test Report',
        outputPath: '<rootDir>/test-results/test-report.html',
        includeFailureMsg: true,
        includeConsoleLog: true,
        dateFormat: 'yyyy-mm-dd HH:MM:ss',
      },
    ],
  ],
  
  // Performance testing
  timers: 'real',
  
  // Notify on completion
  notify: true,
  notifyMode: 'failure-change',
};

export default config;
