import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Tesla Performance Optimization
export default defineConfig(() => ({
  plugins: [react()],

  // Performance optimizations
  build: {
    // Faster builds
    minify: 'esbuild' as const,
    target: 'esnext',

    // Better tree shaking
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['lodash', 'axios'],
        },
      },
    },

    // Smaller chunks
    chunkSizeWarningLimit: 1000,

    // Faster source maps in dev
    sourcemap: false,
  },

  // Development server optimizations
  server: {
    hmr: {
      overlay: false, // Faster HMR
    },
  },

  // Dependency optimization
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['@tauri-apps/api'],
  },

  // Faster resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/pages': path.resolve(__dirname, './src/pages'),
    },
  },

  // Tesla: Prevent the clearing of the screen
  clearScreen: false,

  // Tesla: Environment variables for Tauri
  envPrefix: ['VITE_', 'TAURI_'],
}));
