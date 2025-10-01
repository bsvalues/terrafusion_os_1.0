/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    name: 'government-compliance-elite',
    environment: 'node',
    include: [
      'tests/government/**/*.test.ts',
      'tests/government/**/*.spec.ts',
      'testing/government/**/*.test.ts',
      'testing/government/**/*.spec.ts'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/*.spec.ts', // Exclude Playwright spec files
      '**/tests/government/basic-compliance.spec.ts',
      '**/testing/government/compliance/basic-compliance.spec.ts'
    ],
    setupFiles: [
      './tests/government-compliance-setup.ts',
      './tests/fisma-nist-setup.ts'
    ],
    testTimeout: 45000, // Extended for compliance validation
    hookTimeout: 20000,
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'src/**/*.ts',
        'backend/**/*.ts',
        'modules/government-core/**/*.ts'
      ],
      exclude: [
        'tests/**',
        'testing/**',
        'node_modules/**'
      ],
      thresholds: {
        global: {
          branches: 98, // Higher standard for government compliance
          functions: 98,
          lines: 98,
          statements: 98
        }
      }
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        minThreads: 1,
        maxThreads: 4
      }
    },
    env: {
      NODE_ENV: 'test',
      VITEST_POOL_ID: 'government-compliance',
      // Government Compliance Configuration
      FISMA_COMPLIANCE: 'true',
      NIST_800_53_CONTROLS: 'true',
      SECURITY_CLEARANCE_LEVELS: '5',
      AUDIT_LOGGING: 'enabled',
      ENCRYPTION_REQUIRED: 'AES-256-GCM',
      COMPLIANCE_MODE: 'elite'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
      '@government': path.resolve(__dirname, './tests/government-compliance-setup.ts'),
      '@fisma': path.resolve(__dirname, './tests/fisma-nist-setup.ts')
    }
  }
})