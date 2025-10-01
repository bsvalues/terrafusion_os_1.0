import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Development server configuration
  server: {
    port: 5000,
    host: true, // Allow external connections
    strictPort: true, // Exit if port is already in use
    cors: true,
    proxy: {
      // Proxy API requests to backend
      '/api': {
        target: 'http://localhost:\${{TF_API_HTTPS_PORT:-5001}}',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          icons: ['lucide-react'],
          research: ['react-flow-renderer', 'dagre'],
          editor: ['monaco-editor']
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
      '@utils': resolve(__dirname, 'src/utils'),
      '@types': resolve(__dirname, 'src/types'),
      '@assets': resolve(__dirname, 'src/assets')
    }
  },
  
  // CSS configuration
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  },
  
  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    __RESEARCH_ENGINE_PORT__: JSON.stringify(5000),
    __API_BASE_URL__: JSON.stringify(process.env.VITE_API_BASE_URL || 'http://localhost:\${{TF_API_HTTPS_PORT:-5001}}')
  },
  
  // Optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'lucide-react',
      'react-flow-renderer',
      'dagre',
      'monaco-editor'
    ],
    exclude: ['@vite/client', '@vite/env']
  },
  
  // Preview configuration (for production build testing)
  preview: {
    port: 5000,
    host: true,
    strictPort: true,
    cors: true
  },
  
  // ESBuild configuration
  esbuild: {
    target: 'esnext',
    format: 'esm',
    platform: 'browser',
    treeShaking: true
  }
})