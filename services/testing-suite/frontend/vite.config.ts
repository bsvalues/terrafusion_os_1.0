import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// TerraFusion Testing Suite - Vite Configuration
// Port \${{TF_PORT_4000:-4000}} - Automated Testing Dashboard

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4000,
    host: true,
    strictPort: true,
    open: false
  },
  preview: {
    port: 4000,
    host: true,
    strictPort: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts'],
          utils: ['socket.io-client']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'recharts', 'socket.io-client']
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  css: {
    devSourcemap: true
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  }
})