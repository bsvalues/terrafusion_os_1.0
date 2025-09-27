import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@terrafusion': resolve(__dirname, '../../../frontend/src/components/TerraFusion/index.ts')
    }
  },
  server: {
    port: 3004,
    host: true
  }
});