// NO HARDCODED PORTS! Use environment variables.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3300,
    host: true,
    strictPort: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:${TF_STATIC_PORT:-8080}',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/modules/public-health')
      },
      '/health': {
        target: 'http://localhost:${TF_STATIC_PORT:-8080}',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/health/, '/modules/public-health/health')
      },
      '/modules/public-health': {
        target: 'http://localhost:${TF_STATIC_PORT:-8080}',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['react-router-dom', 'react-modal', 'react-tooltip'],
          charts: ['recharts'],
          utils: ['date-fns', 'lodash']
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
  css: {
    modules: {
      localsConvention: 'camelCase'
    },
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'recharts',
      'date-fns',
      'lodash'
    ]
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  },
  base: '/public-health/',
  publicDir: 'public'
});