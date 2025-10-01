import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'elite-load-testing',
    environment: 'node',
    testTimeout: 80000, // 80 seconds for load testing operations
    hookTimeout: 30000,
    teardownTimeout: 10000,
    isolate: false,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
        isolate: false
      }
    },
    logHeapUsage: true,
    reporters: ['verbose', 'json'],
    outputFile: {
      json: './test-results/load-testing-results.json'
    },
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage/load-testing'
    }
  },
  esbuild: {
    target: 'node18'
  }
})