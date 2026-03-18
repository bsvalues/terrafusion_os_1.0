/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import path from 'path';
import { defineConfig } from 'vite';

// Anchor paths to config file location, not cwd (fixes dual-checkout scenarios)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Isolated config for known-fail baseline tests.
// These files are excluded from the main vitest.config.ts suite and run
// separately in CI with continue-on-error: true so failures are visible
// without blocking the gate.
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [],
    },
  },
  test: {
    include: [
      // Known-fail baseline (Wave 5) — isolated in CI with continue-on-error
      // All documented in .governance/known-failures/
      '**/workbenchRealHosting.gate.test.tsx',
      '**/TerraCanonCrossTabSyncContract.test.tsx',
      '**/command-palette-workflows.integration.test.tsx',
      '**/forgeAnalytics.contract.test.tsx',
    ],
    exclude: [
      'node_modules/**',
      '**/.git/**',
      '**/dist/**',
      '**/build/**',
    ],
    globals: true,
    environment: 'jsdom',
    setupFiles: [path.resolve(__dirname, 'tests/setupTests.ts')],
    testTimeout: 10000,
    hookTimeout: 10000,
    pool: 'forks',
    isolate: true,
    retry: 0,
    reporters: ['verbose'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend/apps/os-shell/src'),
      '@/tests': path.resolve(__dirname, './tests'),
      '@/fixtures': path.resolve(__dirname, './tests/fixtures'),
      '@components': path.resolve(__dirname, './frontend/apps/os-shell/src/components'),
      '@services': path.resolve(__dirname, './frontend/apps/os-shell/src/services'),
      '@hooks': path.resolve(__dirname, './frontend/apps/os-shell/src/hooks'),
      '@utils': path.resolve(__dirname, './frontend/apps/os-shell/src/utils'),
      '@types': path.resolve(__dirname, './frontend/apps/os-shell/src/types'),
      '@terrafusion/shared': path.resolve(__dirname, './terrafusion-shared/dist/index.js'),
      '@terrafusion/ui': path.resolve(__dirname, './frontend/__mocks__/@terrafusion/ui.ts'),
      'monaco-editor': path.resolve(__dirname, './frontend/__mocks__/monaco-editor.ts'),
    },
  },
});
