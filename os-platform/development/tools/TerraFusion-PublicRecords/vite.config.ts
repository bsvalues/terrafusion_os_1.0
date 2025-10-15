import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Championship-level Vite configuration
export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@ai': path.resolve(__dirname, './src/ai'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
  
  server: {
    port: 3500,
    host: true,
    open: true,
    cors: true,
    
    // Hot Module Replacement for instant updates
    hmr: {
      overlay: true,
    },
    
    // Proxy API calls to backend
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    
    // Optimize chunks for performance
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'animation': ['framer-motion'],
          'charts': ['recharts'],
          'ui': ['@headlessui/react', '@heroicons/react', 'lucide-react'],
        },
      },
    },
    
    // Performance optimizations
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    
    // Asset size warnings
    chunkSizeWarningLimit: 1000,
  },
  
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'framer-motion',
      'recharts',
      '@tanstack/react-query',
    ],
  },
  
  // Environment variables
  define: {
    'process.env.VITE_APP_VERSION': JSON.stringify('1.0.0-domination'),
    'process.env.VITE_TYLER_DESTRUCTION_LEVEL': JSON.stringify('MAXIMUM'),
    'process.env.VITE_SPEED_MULTIPLIER': JSON.stringify('379000000'),
  },
});