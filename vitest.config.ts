/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import path from 'path';
import { defineConfig } from 'vite';

// Anchor paths to config file location, not cwd (fixes dual-checkout scenarios)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    include: [
      'tests/**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'os-platform/core/tests/**/*.test.ts',
      'os-platform/core/pilot/**/*.test.ts',
      'os-platform/core/terratrc/**/*.test.ts',
    ],
    exclude: [
      'node_modules/**',
      '**/data/**',
      '**/postgres/**',
      '**/from D/**',
      '**/.git/**',
      '**/dist/**',
      '**/build/**',
      '**/modules/*/node_modules/**',
      '**/.ai/**',
      '**/ULTIMATE_*/**',
      'tests/e2e/**/*.spec.ts',
      'tests/**/*.spec.ts',
    ],
    globals: true,
    environment: 'jsdom',
    setupFiles: [path.resolve(__dirname, 'tests/setupTests.ts')],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: 'coverage',
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/electron/**',
        '**/dist/**',
        '**/.next/**',
        '**/data/**',
        '**/postgres/**',
        '**/from D/**',
      ],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    pool: 'forks',
    isolate: true,
    retry: 2,
    bail: 1,
    reporters: ['default', 'json'],
    outputFile: {
      json: './test-results/vitest-results.json',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend/src'),
      '@/tests': path.resolve(__dirname, './tests'),
      '@/fixtures': path.resolve(__dirname, './tests/fixtures'),
    },
  },
});
