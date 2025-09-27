// NO HARDCODED PORTS! Use environment variables.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Fast Refresh for React development
      fastRefresh: true,
      // Include .jsx and .tsx files
      include: "**/*.{jsx,tsx}",
    })
  ],
  
  // Development server configuration
  server: {
    port: 9000,
    host: true, // Listen on all addresses
    open: false, // Don't auto-open browser
    cors: true,
    proxy: {
      // Proxy API requests to backend
      '/api': {
        target: 'http://localhost:${TF_STATIC_PORT:-8080}',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/health': {
        target: 'http://localhost:${TF_STATIC_PORT:-8080}',
        changeOrigin: true,
        secure: false
      },
      '/metrics': {
        target: 'http://localhost:${TF_STATIC_PORT:-8080}',
        changeOrigin: true,
        secure: false
      },
      '/diagnostics': {
        target: 'http://localhost:${TF_STATIC_PORT:-8080}',
        changeOrigin: true,
        secure: false
      }
    }
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs for debugging
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for third-party libraries
          vendor: ['react', 'react-dom'],
          // Utils chunk for utility functions
          utils: ['socket.io-client']
        }
      }
    },
    // Asset optimization
    assetsInlineLimit: 4096, // 4kb
    chunkSizeWarningLimit: 1000 // 1MB
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/components': resolve(__dirname, 'src/components'),
      '@/utils': resolve(__dirname, 'src/utils'),
      '@/types': resolve(__dirname, 'src/types'),
      '@/services': resolve(__dirname, 'src/services'),
      '@/hooks': resolve(__dirname, 'src/hooks'),
      '@/assets': resolve(__dirname, 'src/assets')
    }
  },
  
  // CSS configuration
  css: {
    modules: {
      // CSS Modules configuration
      localsConvention: 'camelCase',
      generateScopedName: '[name]__[local]___[hash:base64:5]'
    },
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    },
    devSourcemap: true
  },
  
  // Environment variables
  define: {
    // Global constants
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development')
  },
  
  // Optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'socket.io-client'
    ],
    exclude: [
      // Large dependencies that should be loaded dynamically
    ]
  },
  
  // Preview configuration (for production preview)
  preview: {
    port: 9000,
    host: true,
    cors: true
  },
  
  // Base path for deployment
  base: '/',
  
  // Public directory
  publicDir: 'public',
  
  // Error overlay
  clearScreen: false,
  
  // Logging level
  logLevel: 'info',
  
  // Worker configuration
  worker: {
    format: 'es'
  }
});