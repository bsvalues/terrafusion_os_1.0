// Security Middleware for TerraFusion OS Frontend
// Implements Content Security Policy, Security Headers, and JWT Validation

import { NextFunction, Request, Response } from 'express';
// import helmet from 'helmet'; // Commented out - not needed for frontend build

/**
 * Content Security Policy Configuration
 * Government-grade security for TerraFusion OS
 */
export const cspMiddleware = helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // Required for React inline scripts
      "'unsafe-eval'", // Required for development hot reload
      "https://cdn.jsdelivr.net",
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'", // Required for styled-components
      "https://fonts.googleapis.com",
    ],
    fontSrc: [
      "'self'",
      "https://fonts.gstatic.com",
      "data:",
    ],
    imgSrc: [
      "'self'",
      "data:",
      "blob:",
      "https:",
    ],
    connectSrc: [
      "'self'",
      "http://localhost:5000", // .NET API backend
      "http://localhost:3004", // Consciousness Engine
      "http://localhost:3002", // API Gateway
      "ws://localhost:*", // WebSocket for SignalR
      "wss://localhost:*",
    ],
    frameSrc: ["'self'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: [],
  },
});

/**
 * Security Headers Middleware
 * Applies comprehensive security headers for government compliance
 */
export const securityHeadersMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // HSTS - Force HTTPS (31536000 seconds = 1 year)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (formerly Feature Policy)
  res.setHeader('Permissions-Policy', 'geolocation=(self), microphone=(), camera=()');

  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');

  next();
};

/**
 * JWT Token Validation Middleware
 * Validates JWT tokens for authenticated routes
 */
export interface JWTPayload {
  userId: string;
  countyId: string;
  role: string;
  exp: number;
  iat: number;
}

export const validateJWT = (
  req: Request & { user?: JWTPayload },
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // JWT validation logic (to be implemented with actual JWT library)
    // For now, this is a placeholder structure
    const decoded = parseJWT(token);

    if (!decoded || isTokenExpired(decoded)) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT validation error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Parse JWT token (simplified - use proper JWT library in production)
 */
function parseJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    return payload as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Check if JWT token is expired
 */
function isTokenExpired(payload: JWTPayload): boolean {
  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
}

/**
 * Rate Limiting Middleware
 * Prevents abuse and DoS attacks
 */
interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const rateLimitStore: RateLimitStore = {};

export const rateLimiter = (maxRequests: number, windowMs: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    if (!rateLimitStore[clientIP]) {
      rateLimitStore[clientIP] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return next();
    }

    const clientData = rateLimitStore[clientIP];

    if (now > clientData.resetTime) {
      // Reset window
      clientData.count = 1;
      clientData.resetTime = now + windowMs;
      return next();
    }

    if (clientData.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
      });
    }

    clientData.count++;
    next();
  };
};

/**
 * CORS Configuration for TerraFusion OS
 * Allows cross-origin requests from trusted sources
 */
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5000',
      'http://localhost:3004',
      'http://localhost:3002',
    ];

    // Allow requests with no origin (like mobile apps or curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

/**
 * Combined Security Middleware Setup
 * Apply all security middleware in correct order
 */
export const applySecurityMiddleware = (app: any) => {
  app.use(helmet()); // General helmet security
  app.use(cspMiddleware); // Content Security Policy
  app.use(securityHeadersMiddleware); // Custom security headers
  app.use(rateLimiter(100, 60000)); // 100 requests per minute

  console.log('✅ Security middleware applied: CSP, Headers, Rate Limiting');
};

export default {
  cspMiddleware,
  securityHeadersMiddleware,
  validateJWT,
  rateLimiter,
  corsOptions,
  applySecurityMiddleware,
};
