/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    name: 'e2e-integration-elite',
    environment: 'node',
    include: [
      'tests/e2e/**/*.test.ts',
      'tests/e2e/**/*.spec.ts',
      'testing/e2e/**/*.test.ts',
      'testing/integration/**/*.test.ts'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**'
    ],
    setupFiles: ['./tests/e2e-setup.ts'],
    testTimeout: 180000, // 3 minutes for E2E tests
    hookTimeout: 90000,
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/**/*.ts',
        'backend/**/*.ts',
        'frontend/**/*.ts',
        'modules/**/*.ts'
      ],
      exclude: [
        'tests/**',
        'testing/**',
        'node_modules/**'
      ],
      thresholds: {
        global: {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        }
      }
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        minThreads: 1,
        maxThreads: 3 // Limited for E2E stability
      }
    },
    env: {
      NODE_ENV: 'test',
      VITEST_POOL_ID: 'e2e-integration',
      // E2E Integration Configuration
      E2E_MODE: 'elite',
      PLAYWRIGHT_INTEGRATION: 'true',
      GOVERNMENT_WORKFLOWS: 'true',
      ACCESSIBILITY_COMPLIANCE: 'true',
      PERFORMANCE_MONITORING: 'true',
      FULL_SYSTEM_TESTING: 'true'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
      '@e2e': path.resolve(__dirname, './tests/e2e-setup.ts'),
      '@frontend': path.resolve(__dirname, './frontend'),
      '@backend': path.resolve(__dirname, './backend')
    }
  }
})