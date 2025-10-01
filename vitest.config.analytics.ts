import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'analytics',
    environment: 'node',
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    setupFiles: ['./tests/setup/analytics-setup.ts'],
    include: ['./tests/analytics/test-analytics-dashboard.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    silent: false,
    reporters: ['verbose'],
    coverage: {
      enabled: false // Disabled for now due to glob issues
    }
  },
  esbuild: {
    target: 'node18'
  }
});