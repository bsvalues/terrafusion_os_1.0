/**
 * Championship Jest Configuration
 * "Test everything. Trust nothing." - QA Mantra
 */

module.exports = {
  // Use projects for monorepo setup
  projects: [
    // Frontend unit tests
    {
      displayName: 'frontend',
      testMatch: ['<rootDir>/apps/*/src/**/*.{spec,test}.{ts,tsx}'],
      testEnvironment: 'jsdom',
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: {
            jsx: 'react'
          }
        }]
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@terrafusion/(.*)$': '<rootDir>/shared/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/test-utils/jest-setup.ts'],
      coverageThreshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 90,
          statements: 90
        }
      }
    },
    
    // Shared libraries tests
    {
      displayName: 'shared',
      testMatch: ['<rootDir>/shared/**/*.{spec,test}.{ts,tsx}'],
      testEnvironment: 'node',
      transform: {
        '^.+\\.ts$': 'ts-jest'
      }
    },
    
    // Integration tests
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.{spec,test}.{ts,tsx}'],
      testEnvironment: 'node',
      transform: {
        '^.+\\.ts$': 'ts-jest'
      },
      globalSetup: '<rootDir>/test-utils/integration-setup.ts',
      globalTeardown: '<rootDir>/test-utils/integration-teardown.ts'
    }
  ],
  
  // Global settings
  collectCoverageFrom: [
    'apps/*/src/**/*.{ts,tsx}',
    'shared/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**'
  ],
  
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  
  // Championship standards
  testTimeout: 10000,
  verbose: true,
  
  // Watch plugins for better DX
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ]
};