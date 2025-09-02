/**
 * Terrafusion OS - Jest Configuration for Legacy Tests
 * Government. Transcended.
 */

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Root directories
  roots: ['<rootDir>/testing', '<rootDir>/tests'],
  
  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  
  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  
  // Test match patterns
  testMatch: [
    '**/testing/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '**/tests/**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/mock_tests/'
  ],
  
  // Module name mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@testing/(.*)$': '<rootDir>/testing/$1',
    '^@core/(.*)$': '<rootDir>/.ai/core/$1',
    '^@claude-flow/(.*)$': '<rootDir>/.ai/claude-flow/$1',
    '^@backend/(.*)$': '<rootDir>/backend/$1',
    '^@frontend/(.*)$': '<rootDir>/frontend/$1',
    '^@modules/(.*)$': '<rootDir>/modules/$1'
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/testing/config/jest-setup.js'],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: '<rootDir>/testing/reports/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/build/**',
    '!**/testing/**',
    '!**/mock_tests/**'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },
  
  // Test timeout
  testTimeout: 30000,
  
  // Reporters
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './testing/reports/results',
      outputName: 'jest-junit.xml'
    }],
    ['jest-html-reporters', {
      publicPath: './testing/reports/results',
      filename: 'jest-report.html'
    }]
  ],
  
  // Global variables
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    },
    __TEST_ENV__: 'test',
    __GOVERNMENT_MODE__: true,
    __BENTON_COUNTY__: true,
    __HARRIS_PACS_VERSION__: '12.4.7',
    __PARCEL_COUNT__: 89247
  },
  
  // Module directories
  moduleDirectories: ['node_modules', '<rootDir>'],
  
  // Clear mocks
  clearMocks: true,
  
  // Restore mocks
  restoreMocks: true,
  
  // Verbose output
  verbose: true
};
