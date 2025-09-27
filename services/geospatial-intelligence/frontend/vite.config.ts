import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5240,
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
          maps: ['leaflet', 'react-leaflet'],
          gis: ['ol', 'three', 'deck.gl'],
          spatial: ['@turf/turf', 'proj4'],
          data: ['d3', 'geotiff']
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'leaflet',
      'react-leaflet',
      'ol',
      'three',
      'deck.gl',
      '@turf/turf',
      'proj4',
      'd3',
      'geotiff',
      'mapbox-gl',
      'react-map-gl',
      'fabric',
      'konva'
    ]
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  define: {
    'process.env.VITE_BACKEND_URL': JSON.stringify(process.env.VITE_BACKEND_URL || 'http://localhost:\${{TF_PORT_5240:-5240}}'),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
});
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mapping: ['leaflet', 'react-leaflet', 'ol', 'deck.gl'],
          spatial: ['turf', '@turf/turf', 'proj4', 'geotiff'],
          visualization: ['three', '@react-three/fiber', '@react-three/drei', 'd3'],
          charts: ['recharts', 'react-chartjs-2', 'chart.js']
        }
      }
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'leaflet', 
      'react-leaflet',
      'three',
      '@react-three/fiber',
      'deck.gl',
      '@turf/turf',
      'proj4'
    ]
  }
});