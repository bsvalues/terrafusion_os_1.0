/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Windows-specific optimizations for 100% reliability
  experimental: {
    webpackBuildWorker: false,
    cpus: 1,
    instrumentationHook: false,
  },
  // Disable problematic features on Windows
  swcMinify: false,
  // Custom webpack configuration for Windows compatibility
  webpack: (config, { dev, isServer }) => {
    // Disable webpack caching on Windows to prevent corruption
    if (process.platform === 'win32') {
      config.cache = false;
    }
    
    // Optimize for Windows filesystem
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    };
    
    return config;
  },
  // Production-ready output configuration
  output: 'standalone',
  // Disable source maps in production for performance
  productionBrowserSourceMaps: false,
}

export default nextConfig
