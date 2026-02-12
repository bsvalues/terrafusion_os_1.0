import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@terrafusion/design-system': path.resolve(__dirname, '../../platform/design-system'),
      '@terrafusion/sdk': path.resolve(__dirname, '../../SDK')
    }
  },
  server: {
    port: 3001,
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});