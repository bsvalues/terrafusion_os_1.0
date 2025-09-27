import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3015,
    host: true,
    hmr: {
      port: 3015
    },
    // Proxy API calls to backend service
    proxy: {
      '/api': {
        target: 'http://localhost:\${{TF_API_5015_PORT:-5015}}',
        changeOrigin: true,
        secure: false
      },
      '/ws': {
        target: 'ws://localhost:\${{TF_API_5015_PORT:-5015}}',
        ws: true,
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          compliance: ['react-table', 'xlsx', 'jspdf'],
          ui: ['framer-motion', 'react-hook-form']
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types')
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'socket.io-client',
      'react-table',
      'xlsx',
      'jspdf',
      'framer-motion'
    ]
  }
})