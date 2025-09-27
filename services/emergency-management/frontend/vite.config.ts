import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5280,
    host: true,
    strictPort: true,
    open: false
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          forms: ['react-hook-form', 'react-select'],
          charts: ['recharts', 'd3'],
          maps: ['leaflet', 'react-leaflet'],
          ui: ['framer-motion', '@headlessui/react']
        }
      }
    }
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
      'fuse.js'
    ]
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  define: {
    'process.env.VITE_BACKEND_URL': JSON.stringify(process.env.VITE_BACKEND_URL || 'http://localhost:\${{TF_PORT_5280:-5280}}'),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
});