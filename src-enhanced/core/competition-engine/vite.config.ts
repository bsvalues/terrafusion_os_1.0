import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: ['es2021', 'chrome100', 'safari13'],
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './modules/costforge'),
      '@/components': path.resolve(__dirname, './modules/costforge/components'),
      '@/services': path.resolve(__dirname, './modules/costforge/services'),
      '@/lib': path.resolve(__dirname, './modules/costforge/lib'),
      '@/hooks': path.resolve(__dirname, './modules/costforge/hooks'),
      '@/utils': path.resolve(__dirname, './modules/costforge/utils'),
      '@/contexts': path.resolve(__dirname, './modules/costforge/contexts'),
      '@/pages': path.resolve(__dirname, './modules/costforge/pages'),
      '@/types': path.resolve(__dirname, './modules/costforge/types'),
      '@shared': path.resolve(__dirname, './modules/costforge/shared'),
    },
  },
});
