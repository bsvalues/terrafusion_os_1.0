import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3010,
    open: true,
    proxy: {
      '/marketplace': 'http://localhost:\${{TF_DOCS_PORT:-8000}}', // Adjust backend port as needed
    },
  },
});
