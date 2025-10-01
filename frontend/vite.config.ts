import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.TF_SHELL_PORT || process.env.TF_FRONTEND_PORT || '3103'),
    host: true,
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.TF_API_PORT || '5046'}`,
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      external: ['electron'] // Exclude Electron from web builds
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/contexts': path.resolve(__dirname, './src/contexts'),
      '@/infrastructure': path.resolve(__dirname, './src/infrastructure'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/styles': path.resolve(__dirname, './src/styles'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/lib': path.resolve(__dirname, './src/lib')
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react'],
    exclude: ['electron']
  },
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'process.env.TF_API_PORT': JSON.stringify(process.env.TF_API_PORT || '5046'),
    'process.env.TF_FRONTEND_PORT': JSON.stringify(process.env.TF_FRONTEND_PORT || '3000')
  }
});
