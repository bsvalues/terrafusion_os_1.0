import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  
  // Development server configuration
  server: {
    port: 3007,
    host: true,
    open: false,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:\${{TF_PORT_7000:-7000}}',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  
  // Preview server configuration
  preview: {
    port: 3007,
    host: true,
    cors: true
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    target: 'es2020',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          pdf: ['react-pdf'],
          dropzone: ['react-dropzone']
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    chunkSizeWarningLimit: 1000
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@assets': resolve(__dirname, './src/assets'),
      '@utils': resolve(__dirname, './src/utils'),
      '@types': resolve(__dirname, './src/types')
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
  envPrefix: 'VITE_',
  
  // Asset handling
  assetsInclude: ['**/*.pdf', '**/*.docx'],
  
  // Optimization
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-pdf', 'react-dropzone'],
    exclude: []
  },
  
  // Define global constants
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    __BACKEND_URL__: JSON.stringify(process.env.VITE_BACKEND_URL || 'http://localhost:\${{TF_PORT_7000:-7000}}')
  },
  
  // PWA and service worker
  base: './',
  
  // ESBuild configuration
  esbuild: {
    target: 'es2020',
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
});