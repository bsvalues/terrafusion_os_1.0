import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Development server configuration
  server: {
    port: 3013,
    host: true,
    open: false,
    cors: true,
    proxy: {
      // Proxy API calls to backend
      '/api': {
        target: 'http://localhost:\${{TF_FRONTEND_3013_PORT:-3013}}',
        changeOrigin: true,
        secure: false,
        ws: true
      },
      // Proxy WebSocket connections
      '/socket.io': {
        target: 'http://localhost:\${{TF_FRONTEND_3013_PORT:-3013}}',
        changeOrigin: true,
        ws: true
      }
    }
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    target: 'esnext',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts'],
          icons: ['lucide-react'],
          socket: ['socket.io-client']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@assets': resolve(__dirname, 'src/assets'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@types': resolve(__dirname, 'src/types')
    }
  },
  
  // CSS configuration
  css: {
    devSourcemap: true,
    modules: {
      localsConvention: 'camelCase'
    }
  },
  
  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '2.0.0'),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    __BACKEND_URL__: JSON.stringify(process.env.BACKEND_URL || 'http://localhost:\${{TF_FRONTEND_3013_PORT:-3013}}')
  },
  
  // Preview configuration (for production preview)
  preview: {
    port: 3013,
    host: true,
    cors: true
  },
  
  // Optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'recharts',
      'lucide-react',
      'socket.io-client'
    ]
  },
  
  // Worker configuration
  worker: {
    format: 'es'
  }
});