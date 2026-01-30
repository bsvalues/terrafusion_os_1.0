import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// ELITE STANDARD: Port 5177 | Strict Mode
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5177,
    strictPort: true,
    host: true,
  },
  build: {
    minify: 'esbuild',
    target: 'esnext',
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  clearScreen: false,
});
