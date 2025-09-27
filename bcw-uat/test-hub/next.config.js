/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost'],
  },
  env: {
    UAT_ENVIRONMENT: 'benton-county-uat',
    TERRAFUSION_VERSION: '1.0.0-uat',
    API_BASE_URL: process.env.API_BASE_URL || 'https://terrafusion-uat.benton.wa.gov/api',
    COMPLIANCE_LEVEL: 'fisma-moderate',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'X-UAT-Environment',
            value: 'benton-county-uat',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig