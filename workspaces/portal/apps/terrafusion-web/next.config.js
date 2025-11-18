/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8787/ws',
    NEXT_PUBLIC_DOTNET_API_URL: process.env.NEXT_PUBLIC_DOTNET_API_URL || 'http://localhost:5000',
    NEXT_PUBLIC_CONSCIOUSNESS_URL: process.env.NEXT_PUBLIC_CONSCIOUSNESS_URL || 'http://localhost:3004',
  },
  async redirects() {
    return [
      {
        source: '/.well-known/:path*',
        destination: '/404',
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/portal/:path*',
        destination: 'http://localhost:8787/api/portal/:path*',
      },
    ];
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.ignoreWarnings = [
      { module: /node_modules/ },
    ];
    return config;
  },
};

module.exports = nextConfig;
