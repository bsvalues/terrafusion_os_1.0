import type { Config } from 'jest';
import baseConfig from './jest.config';

/**
 * Jest Configuration for Integration Tests
 *
 * Integration tests validate multi-component workflows and interactions.
 * This config extends the base Jest config with integration-specific settings:
 * - Longer timeouts for complex workflows
 * - Focus on integration test files only
 * - Sequential execution for reliable state management
 * - Enhanced error reporting for workflow debugging
 */
const config: Config = {
  ...baseConfig,

  // Display name for this test suite
  displayName: {
    name: 'Integration Tests',
    color: 'blue',
  },

  // Only run integration test files
  testMatch: [
    '<rootDir>/src/**/*.integration.test.{ts,tsx}',
    '<rootDir>/src/__tests__/integration/**/*.test.{ts,tsx}',
  ],

  // Longer timeout for complex integration workflows (default: 5000ms)
  testTimeout: 10000, // 10 seconds for workflows with animations, loading states, etc.

  // Run tests sequentially to avoid state conflicts (integration tests may have side effects)
  maxWorkers: 1,

  // Bail after first test suite failure for faster feedback
  bail: 0, // Set to 1 or true to stop after first failure

  // Collect coverage from integration test files
  collectCoverageFrom: [
    ...(baseConfig.collectCoverageFrom || []),
    'src/__tests__/integration/**/*.{ts,tsx}',
    '!src/__tests__/integration/**/*.d.ts',
  ],

  // Coverage thresholds specific to integration tests
  coverageThreshold: undefined, // Don't enforce coverage thresholds for integration tests

  // Setup files specific to integration tests
  setupFilesAfterEnv: [
    '<rootDir>/src/setupTests.ts',
    '<rootDir>/src/__tests__/integration/setupIntegrationTests.ts',
  ],

  // Increase slowTestThreshold for integration tests (workflows take longer)
  slowTestThreshold: 5, // Report tests slower than 5 seconds

  // Verbose output for better debugging of workflow failures
  verbose: true,

  // Clear mocks between tests to ensure clean state
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Module name mapper (inherited from base config)
  moduleNameMapper: baseConfig.moduleNameMapper,

  // Transform configuration (inherited from base config)
  transform: baseConfig.transform,

  // Test environment (inherited from base config)
  testEnvironment: baseConfig.testEnvironment,

  // Coverage directory for integration tests
  coverageDirectory: '<rootDir>/coverage/integration',

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

  // Test results processor (optional)
  // testResultsProcessor: '<rootDir>/node_modules/jest-sonar-reporter',

  // Globals for integration tests
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    },
  },
};

export default config;
