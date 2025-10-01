// NO HARDCODED PORTS! Use environment variables.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:${TF_STATIC_PORT:-8080}',
        changeOrigin: true,
      },
    },
  },
});
