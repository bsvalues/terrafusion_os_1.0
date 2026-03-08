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
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./setupTests.vitest.ts'],
    alias: {
      '@': path.resolve(__dirname, 'apps/os-shell/src'),
      '@components': path.resolve(__dirname, 'apps/os-shell/src/components'),
      '@services': path.resolve(__dirname, 'apps/os-shell/src/services'),
      '@hooks': path.resolve(__dirname, 'apps/os-shell/src/hooks'),
      '@utils': path.resolve(__dirname, 'apps/os-shell/src/utils'),
      '@types': path.resolve(__dirname, 'apps/os-shell/src/types'),
    },
  },
});
