export const productionConfig = {
  server: {
    port: process.env.PORT || 5009,
    host: process.env.HOST || '0.0.0.0',
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5009'],
      credentials: true
    }
  },

  security: {
    sessionSecret: process.env.SESSION_SECRET || 'terrafusion-pilt-development-secret-key-2024',
    sessionMaxAge: 24 * 60 * 60 * 1000,
    rateLimiting: {
      windowMs: 15 * 60 * 1000,
      max: 100
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"]
        }
      }
    }
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'combined',
    enableAccessLog: true,
    enableErrorLog: true
  },

  database: {
    url: process.env.DATABASE_URL,
    poolSize: 10,
    ssl: process.env.NODE_ENV === 'production'
  },

  performance: {
    compression: true,
    cacheMaxAge: 86400000,
    enableEtag: true
  }
};