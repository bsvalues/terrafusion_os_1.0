import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'data-management',
    environment: 'node',
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    setupFiles: ['./tests/setup/data-setup.ts'],
    include: ['./tests/data/test-data-management.ts'],
    testTimeout: 15000,
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