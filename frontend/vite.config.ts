import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { securityPlugin } from './apps/os-shell/src/middleware/security-plugin';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const appRoot = path.resolve(__dirname, 'apps/os-shell');

  const plugins = [
    react(),
    securityPlugin(), // Security headers and CSP
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
    //   manifest: {
    //     name: 'TerraFusion OS',
    //     short_name: 'TerraFusion',
    //     description: 'Government Operating System - Complete County Management Platform',
    //     theme_color: '#0891b2',
    //     icons: [
    //       {
    //         src: 'pwa-192x192.png',
    //         sizes: '192x192',
    //         type: 'image/png',
    //       },
    //       {
    //         src: 'pwa-512x512.png',
    //         sizes: '512x512',
    //         type: 'image/png',
    //       },
    //     ],
    //   },
    // }),
  ];

  // Add bundle analyzer only in analyze mode
  if (mode === 'analyze') {
    // Dynamic import to avoid conflict issues
    import('rollup-plugin-visualizer').then(({ visualizer }) => {
      plugins.push(
        visualizer({
          open: true,
          filename: path.resolve(__dirname, '../native-shell/ui/dist/stats.html'),
          gzipSize: true,
          brotliSize: true,
          template: 'treemap',
        })
      );
    });
  }

  return {
    plugins,

    root: appRoot,

    publicDir: path.resolve(__dirname, 'public'),

    resolve: {
      alias: {
        '@': path.resolve(appRoot, 'src'),
        '@components': path.resolve(appRoot, 'src/components'),
        '@services': path.resolve(appRoot, 'src/services'),
        '@hooks': path.resolve(appRoot, 'src/hooks'),
        '@utils': path.resolve(appRoot, 'src/utils'),
        '@types': path.resolve(appRoot, 'src/types'),
        '@terrafusion/shared': path.resolve(__dirname, '../terrafusion-shared/dist/index.js'),
      },
    },

    build: {
      // Build directly to native shell UI dist directory.
      outDir: path.resolve(__dirname, '../native-shell/ui/dist'),
      emptyOutDir: true,

      // Optimize for production
      minify: 'terser',
      sourcemap: true,

      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['@mui/material', '@mui/icons-material'],
            charts: ['recharts'],
            '3d': ['three'],
            'platform-design-system': [path.resolve(appRoot, 'src/design-system')],
          },
        },
      },

      // Performance
      chunkSizeWarningLimit: 1000,
      reportCompressedSize: true,
    },

    esbuild: {
      logOverride: { 'this-is-undefined-in-esm': 'silent' },
    },

    server: {
      port: parseInt(process.env.VITE_PORT || '5173'),
      host: '0.0.0.0',
      strictPort: false,

      // Proxy API calls to .NET backend
      proxy: {
        '/api': {
          target: process.env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          ws: true, // WebSocket support for SignalR
        },
      },
    },

    preview: {
      port: parseInt(process.env.VITE_PREVIEW_PORT || '4173'),
      strictPort: false,
    },

    optimizeDeps: {
      include: ['react', 'react-dom', '@mui/material', 'recharts'],
    },

    define: {
      // Environment variables available in app
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
      __API_URL__: JSON.stringify(process.env.VITE_API_URL || 'http://localhost:5000'),
    },
  };
});
