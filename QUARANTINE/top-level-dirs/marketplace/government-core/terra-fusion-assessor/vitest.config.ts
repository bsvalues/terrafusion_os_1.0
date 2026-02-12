import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '**/*.d.ts',
      ],
      threshold: {
        global: {
          statements: 85,
          functions: 85,
          branches: 85,
          lines: 85
        }
      }
    },
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules/', 'dist/']
  }
});
