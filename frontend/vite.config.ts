import fs from 'fs';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { securityPlugin } from './apps/os-shell/src/middleware/security-plugin';
import {
  resolveWashingtonLaunchDataProxy,
  type WashingtonLaunchDataProxyConfiguration,
  WASHINGTON_LAUNCH_DATA_PROXY_CONTEXT,
} from './apps/os-shell/src/config/washingtonLaunchDataProxy';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const appRoot = path.resolve(__dirname, 'apps/os-shell');
  const configFileEnv: Record<string, string> = command === 'serve'
    ? loadEnv(mode, __dirname, '')
    : {};
  const washingtonLaunchDataProxy = command === 'serve'
    ? resolveWashingtonLaunchDataProxy({
        manifestSha256:
          process.env.VITE_WASHINGTON_LAUNCH_MANIFEST_SHA256
          ?? configFileEnv.VITE_WASHINGTON_LAUNCH_MANIFEST_SHA256,
        sourceUrl:
          process.env.WASHINGTON_LAUNCH_DATA_SOURCE_URL
          ?? configFileEnv.WASHINGTON_LAUNCH_DATA_SOURCE_URL,
      })
    : undefined;
  const washingtonLaunchDataProxyEntry: Record<
    string,
    WashingtonLaunchDataProxyConfiguration
  > = washingtonLaunchDataProxy
    ? { [WASHINGTON_LAUNCH_DATA_PROXY_CONTEXT]: washingtonLaunchDataProxy }
    : {};
  const emitBuildSourcemaps =
    mode === 'analyze' || process.env.VITE_BUILD_SOURCEMAP === '1';
  const configuredApiUrl = process.env.VITE_API_URL;
  const backendUrl =
    configuredApiUrl && /^https?:\/\//i.test(configuredApiUrl)
      ? configuredApiUrl
      : `http://localhost:${process.env.TF_API_PORT || process.env.VITE_API_PORT || 5000}`;

  // Dev-mode middleware: serves service-registry.json directly from disk.
  // The .NET ServiceRegistryController serves this in production. In dev, this
  // intercepts before the proxy so AppFrame resolves app URLs without needing
  // the .NET API to have the controller hot-loaded.
  const serviceRegistryPlugin = {
    name: 'tf-service-registry',
    configureServer(server: any) {
      const registryPath = path.resolve(__dirname, '../backend/service-registry.json');
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url === '/api/service-registry') {
          try {
            const json = fs.readFileSync(registryPath, 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.end(json);
          } catch {
            next(); // fall through to proxy
          }
          return;
        }
        next();
      });
    },
  };

  const plugins = [
    react(),
    securityPlugin(), // Security headers and CSP
    serviceRegistryPlugin,
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
    envDir: __dirname,

    publicDir: path.resolve(appRoot, 'public'),

    resolve: {
      alias: {
        '@': path.resolve(appRoot, 'src'),
        '@components': path.resolve(appRoot, 'src/components'),
        '@services': path.resolve(appRoot, 'src/services'),
        '@hooks': path.resolve(appRoot, 'src/hooks'),
        '@utils': path.resolve(appRoot, 'src/utils'),
        '@types': path.resolve(appRoot, 'src/types'),
        '@terrafusion/shared': path.resolve(__dirname, '../terrafusion-shared/dist/index.js'),
        '@terrafusion/ui': path.resolve(__dirname, '../packages/ui/src/index.ts'),
      },
    },

    build: {
      // Build directly to native shell UI dist directory.
      outDir: path.resolve(__dirname, '../native-shell/ui/dist'),
      emptyOutDir: true,

      // Vite's esbuild minifier keeps the guarded shell build inside hosted
      // runner memory while still producing a production bundle.
      minify: 'esbuild',
      // Full sourcemaps make the guarded CI build exceed the hosted runner heap.
      // Keep them opt-in for diagnostics without making every production gate pay
      // the memory cost.
      sourcemap: emitBuildSourcemaps,

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
      port: parseInt(process.env.PORT || process.env.VITE_PORT || '5173'),
      host: '0.0.0.0',
      strictPort: false,
      // Suppress the blocking error overlay for pnpm store issues (e.g. stale
      // @tailwindcss/node chunks). Fix by running: pnpm install --force in frontend/
      hmr: { overlay: false },

      // Proxy API calls to .NET backend
      proxy: {
        // In configured dev runtimes, expose the exact credential-free public
        // package at the same canonical paths used by the production image.
        // Browser-side manifest and county-shard attestation remains mandatory.
        ...washingtonLaunchDataProxyEntry,
        // Capture error boundary reports in pilot runtime (dev diagnostics)
        '/api/errors': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
          ws: true, // WebSocket support for SignalR
        },
        '/hubs': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
        // Minimal-API levy routes (TerraLevy Cycle Cockpit reaches these for
        // district AV / measure target amounts). Served by Program.cs at /levy/*.
        '/levy': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
        '/health': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
        '/ops': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
        // Proxy Pilot runtime — routes /pilot/** to .NET backend /api/pilot/**
        // The dedicated pilot runtime (port 4317) is optional; when offline the
        // backend stubs return gracefully-degraded responses.
        '/pilot': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (path: string) => path.replace(/^\/pilot/, '/api/pilot'),
        },
      },
    },

    preview: {
      port: parseInt(process.env.VITE_PREVIEW_PORT || '4173'),
      strictPort: false,
      proxy: washingtonLaunchDataProxyEntry,
    },

    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        '@mui/material',
        'recharts',
        '@radix-ui/react-slot',
        '@radix-ui/react-label',
        '@radix-ui/react-select',
        '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-dialog',
        '@radix-ui/react-tooltip',
        '@radix-ui/react-tabs',
        '@radix-ui/react-popover',
        'class-variance-authority',
        'clsx',
        'tailwind-merge',
        'lucide-react',
        'zustand',
      ],
    },

    define: {
      // Environment variables available in app
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
      __API_URL__: JSON.stringify(process.env.VITE_API_URL || `/api`),
    },
  };
});
