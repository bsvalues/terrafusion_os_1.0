import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'debugging-tools',
    testTimeout: 90000, // 90 seconds for comprehensive debugging analysis
    hookTimeout: 30000, // 30 seconds for setup/teardown
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true // Debugging tests need consistent resource allocation
      }
    },
    include: ['tests/debugging/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup/debugging-setup.ts'],
    reporters: ['default', 'verbose'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/setup/',
        'dist/'
      ]
    },
    // Debugging-specific configuration
    isolate: true, // Ensure test isolation for accurate debugging analysis
    fileParallelism: false, // Run debugging tests sequentially
    sequence: {
      concurrent: false // No concurrent execution for debugging tests
    }
  },
  esbuild: {
    target: 'node18'
  }
});