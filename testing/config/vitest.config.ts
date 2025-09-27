import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Test environment configuration
    environment: 'jsdom',

    // Global test setup
    setupFiles: ['./testing/config/test-setup.ts'],

    // Test file patterns
    include: [
      'testing/core/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'testing/core/integration/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'testing/government/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'testing/ai/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'testing/modules/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],

    // Exclude patterns
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/mock_tests/**',
    ],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './testing/reports/coverage',
      exclude: [
        'node_modules/',
        'testing/fixtures/',
        'testing/mocks/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mock_tests/**',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },

    // Test timeout
    testTimeout: 30000,
    hookTimeout: 30000,

    // Reporters
    reporter: ['verbose', 'json', 'html'],
    outputFile: {
      json: './testing/reports/results/vitest-results.json',
      html: './testing/reports/results/vitest-report.html',
    },

    // Global variables
    globals: true,

    // Watch mode
    watch: false,

    // Parallel execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1,
      },
    },
  },

  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, '../..'),
      '@testing': resolve(__dirname, '..'),
      '@core': resolve(__dirname, '../../.ai/core'),
      '@claude-flow': resolve(__dirname, '../../.ai/claude-flow'),
      '@backend': resolve(__dirname, '../../backend'),
      '@frontend': resolve(__dirname, '../../frontend'),
      '@modules': resolve(__dirname, '../../modules'),
    },
  },

  // Define configuration for different environments
  define: {
    __TEST_ENV__: '"test"',
    __GOVERNMENT_MODE__: 'true',
    __BENTON_COUNTY__: 'true',
    __HARRIS_PACS_VERSION__: '"12.4.7"',
    __PARCEL_COUNT__: '89247',
  },
});
