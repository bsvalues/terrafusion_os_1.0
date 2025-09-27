import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5210,
    host: 'localhost',
    open: false,
    cors: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          forms: ['react-hook-form', 'react-select', 'react-datepicker'],
          charts: ['recharts', 'react-gauge-chart', 'react-circular-progressbar'],
          maps: ['leaflet', 'react-leaflet'],
          ui: ['@headlessui/react', '@heroicons/react', 'lucide-react', 'framer-motion'],
          utils: ['axios', 'date-fns', 'uuid', 'classnames'],
          transport: ['@turf/turf', 'proj4', 'd3']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'socket.io-client',
      'date-fns',
      'leaflet',
      'react-leaflet',
      'recharts',
      'framer-motion',
      'react-query',
      'react-hook-form',
      'react-select',
      'react-datepicker',
      'react-modal',
      'react-toastify',
      'lucide-react',
      'classnames',
      '@headlessui/react',
      '@heroicons/react',
      'react-beautiful-dnd',
      'react-hotkeys-hook',
      'qrcode.react',
      'html2canvas',
      'jspdf',
      'file-saver',
      'xlsx',
      'uuid',
      '@turf/turf',
      'proj4',
      'd3',
      'react-virtualized',
      'react-window',
      'fuse.js',
      'react-gauge-chart',
      'react-circular-progressbar',
      'react-table'
    ]
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})