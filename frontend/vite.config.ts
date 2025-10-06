import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
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
    })
  ],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
    }
  },
  
  build: {
    // Build directly to native shell UI directory!
    outDir: '../native-shell/ui',
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
        }
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
});
