/**
 * TerraFusion OS - Elite Security Testing Configuration
 * Advanced Threat Modeling & Government Security Validation
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'elite-security-validation',
    environment: 'node',
    include: [
      'tests/security/**/*.test.ts',
      'testing/security/**/*.test.ts'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/*.spec.ts' // Exclude Playwright spec files
    ],
    setupFiles: [
      './tests/security-setup.ts'
    ],
    testTimeout: 60000, // Extended for security validation
    hookTimeout: 30000,
    threads: true,
    minThreads: 2,
    maxThreads: 8,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        branches: 98, // Higher security coverage requirement
        functions: 98,
        lines: 98,
        statements: 98
      }
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        minThreads: 2,
        maxThreads: 8
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src',
      '@tests': '/tests',
      '@security': '/tests/security'
    }
  },
  define: {
    __SECURITY_TESTING__: true,
    __THREAT_MODELING__: true,
    __GOVERNMENT_GRADE__: true
  }
});