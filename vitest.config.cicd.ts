import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'cicd-pipeline',
    environment: 'node',
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    setupFiles: ['./tests/setup/cicd-setup.ts'],
    include: ['./tests/cicd/elite-cicd-pipeline.test.ts'],
    testTimeout: 70000, // 70 seconds for CI/CD pipeline tests
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