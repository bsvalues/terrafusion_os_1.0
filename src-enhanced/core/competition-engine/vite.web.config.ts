import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { resolve } from 'path';

// Terrafusion Web Production Build Configuration
// SUPREME DEPLOYMENT COMMANDER - WEB EDITION
export default defineConfig({
  plugins: [react()],

  // Optimize for web deployment
  base: './',

  define: {
    // Web-specific environment variables
    __TERRAFUSION_WEB__: true,
    __TERRAFUSION_VERSION__: JSON.stringify('1.0.0-championship'),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },

  build: {
    outDir: 'dist-web',
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari13'],
    minify: 'esbuild',
    sourcemap: false,

    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          vendor: ['react', 'react-dom'],
          ui: ['@mui/material', '@mui/icons-material', '@emotion/react'],
          charts: ['recharts'],
          forms: ['react-hook-form', 'zod'],
          routing: ['wouter', 'react-router-dom'],
          utils: ['clsx', 'tailwind-merge'],
        },
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },

    // Optimize chunk size
    chunkSizeWarningLimit: 1000,

    // Asset handling
    assetsDir: 'assets',

    // Enable experimental features
    cssCodeSplit: true,
  },

  // Development server (for testing)
  server: {
    port: 3000,
    host: true,
    strictPort: false,
    open: true,
  },

  // Preview server
  preview: {
    port: 3001,
    host: true,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/modules': path.resolve(__dirname, './modules'),
      '@/intelligence': path.resolve(__dirname, './INTELLIGENCE'),
      '@/assets': path.resolve(__dirname, './src/assets'),
    },
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@mui/material',
      '@mui/icons-material',
      'recharts',
      'react-hook-form',
      'wouter',
    ],
  },

  // CSS configuration
  css: {
    postcss: './postcss.config.js',
    preprocessorOptions: {
      css: {
        charset: false,
      },
    },
  },

  // Environment variables
  envPrefix: ['VITE_', 'TERRAFUSION_'],
  envDir: '.',
});
