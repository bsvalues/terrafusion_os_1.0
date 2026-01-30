import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'TerraFusion OS',
        short_name: 'TerraFusion',
        description: 'Government Operating System - Complete County Management Platform',
        theme_color: '#0891b2',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    }),
    // Bundle analyzer for visualizing bundle size
    mode === 'analyze' && visualizer({
      open: true,
      filename: path.resolve(__dirname, '../native-shell/ui/dist/stats.html'),
      gzipSize: true,
      brotliSize: true,
      template: 'treemap', // 'sunburst', 'treemap', 'network'
    }),
  ].filter(Boolean),

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@terrafusion/shared': path.resolve(__dirname, '../terrafusion-shared/dist/index.js'),
    }
  },

  build: {
    // Build directly to native shell UI dist directory.
    outDir: '../native-shell/ui/dist',
    emptyOutDir: true,

    // Optimize for production
    minify: 'terser',
    sourcemap: true,

    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui': ['@mui/material', '@mui/icons-material'],
          'charts': ['recharts'],
          '3d': ['three'],
          // 'platform-design-system': ['../platform/design-system'], // Commented out - directory exists but is empty
        },
        // Platform-specific naming for cache busting
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
      // External dependencies for platform modules
      external: [],
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false
      }
    },

    // Performance
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: true,
  },

  server: {
    port: parseInt(process.env.VITE_PORT || '3000'),
    host: true,
    strictPort: false,

    // Proxy API calls to .NET backend
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true, // WebSocket support for SignalR
      }
    }
  },

  preview: {
    port: parseInt(process.env.VITE_PORT || '3000'),
    strictPort: false,
  },

  optimizeDeps: {
    include: ['react', 'react-dom', '@mui/material', 'recharts'],
  },

  define: {
    // Environment variables available in app
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __API_URL__: JSON.stringify(process.env.VITE_API_URL || 'http://localhost:5000'),
  }
}));
