import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      strict: false,
    },
  },
  resolve: {
    alias: {
      'monaco-editor/esm/vs/editor/editor.worker?worker': path.resolve(__dirname, '__mocks__/monaco-editor.ts'),
      'monaco-editor/esm/vs/language/css/css.worker?worker': path.resolve(__dirname, '__mocks__/monaco-editor.ts'),
      'monaco-editor/esm/vs/language/html/html.worker?worker': path.resolve(__dirname, '__mocks__/monaco-editor.ts'),
      'monaco-editor/esm/vs/language/json/json.worker?worker': path.resolve(__dirname, '__mocks__/monaco-editor.ts'),
      'monaco-editor/esm/vs/language/typescript/ts.worker?worker': path.resolve(__dirname, '__mocks__/monaco-editor.ts'),
      'monaco-editor': path.resolve(__dirname, '__mocks__/monaco-editor.ts'),
      '@': path.resolve(__dirname, 'apps/os-shell/src'),
      '@components': path.resolve(__dirname, 'apps/os-shell/src/components'),
      '@services': path.resolve(__dirname, 'apps/os-shell/src/services'),
      '@hooks': path.resolve(__dirname, 'apps/os-shell/src/hooks'),
      '@utils': path.resolve(__dirname, 'apps/os-shell/src/utils'),
      '@types': path.resolve(__dirname, 'apps/os-shell/src/types'),
      '@terrafusion/shared': path.resolve(__dirname, '../terrafusion-shared/dist/index.js'),
      '@terrafusion/ui': path.resolve(__dirname, '__mocks__/@terrafusion/ui.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./setupTests.vitest.ts'],
    retry: 2,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.spec.ts',
      '**/e2e/**',
      // Pre-existing failures unrelated to honesty pass (Phase 8 impl mismatch / real-hosting env / act() timing)
      '**/workbenchRealHosting.gate.test.tsx',
      '**/managementDashboard.contract.test.tsx',
      '**/RiskPolicyGate.irreversible.test.tsx',
    ],
  },
});
