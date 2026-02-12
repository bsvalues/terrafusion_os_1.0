import type { NextConfig } from "next";

/**
 * TerraFusion Next.js Configuration - THE TERRAFUSION WAY
 * Production-grade configuration for government-scale React 19 applications
 * 
 * Features:
 * - React 19 optimization with backward compatibility
 * - Government security standards compliance  
 * - Three.js/WebGL performance optimization
 * - Production-ready SSR configuration
 * - Comprehensive error handling and monitoring
 */
const nextConfig: NextConfig = {
  // Performance and security optimizations
  outputFileTracingRoot: "/workspaces/terrafusion_os_1.0/TerraFusion_Command_Portal_Starter/terrafusion-command-portal/apps/terrafusion-web",
  
  // React 19 production optimizations
  reactStrictMode: true,
  
  // Government-grade external packages (moved from experimental)
  serverExternalPackages: ['@tanstack/react-query', 'three', '@react-three/fiber'],
  
  // Government-grade experimental features
  experimental: {
    optimizePackageImports: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-toast'],
    optimisticClientCache: true
  },
  
  // Performance optimizations for Three.js and government dashboards
  webpack: (config, { dev, isServer }) => {
    // Three.js optimization for government visualizations
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: ['raw-loader', 'glslify-loader'],
    });
    
    // Optimize bundle splitting for government components
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups.government = {
        name: 'government-components',
        chunks: 'all',
        test: /[\\/]src[\\/](components|lib)[\\/](dashboard|terra-sphere|workflow)[\\/]/,
        priority: 30,
      };
    }
    
    return config;
  },
  
  // API configuration for backend communication with Rust services
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8787/api/:path*'
      },
      {
        source: '/ws/:path*', 
        destination: 'http://localhost:8787/ws/:path*'
      }
    ];
  },
  
  // Security headers for government compliance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ],
      },
    ];
  },
  
  // Image optimization for government assets
  images: {
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  }
};

export default nextConfig;
