/**
 * TerraLevy API Server
 * Government Tax & Levy Management Gateway
 * FISMA-HIGH Compliant
 */

import express, { Application } from 'express';
import { createServer, Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { auditMiddleware } from './middleware/audit.js';
import { errorHandler } from './middleware/errorHandler.js';

// Routes
import { budgetRoutes } from './routes/budget.js';
import { levyRoutes } from './routes/levy.js';
import { citizenRoutes } from './routes/citizen.js';
import { paymentRoutes } from './routes/payment.js';
import { aiRoutes } from './routes/ai.js';
import { healthRoutes } from './routes/health.js';

// WebSocket handlers
import { setupWebSocket } from './websocket/index.js';

const app: Application = express();
const server: HttpServer = createServer(app);

// WebSocket Server
const wss = new WebSocketServer({ server, path: '/ws' });

// Security middleware (FISMA-HIGH)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'wss:', 'ws:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Audit-User'],
}));

// Rate limiting (FISMA-HIGH)
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Parsing & compression
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Audit logging (FISMA-HIGH requirement)
app.use(auditMiddleware);

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/levy', levyRoutes);
app.use('/api/citizens', citizenRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ai', aiRoutes);

// WebSocket setup for real-time updates
setupWebSocket(wss);

// Error handling
app.use(errorHandler);

// Start server
server.listen(config.port, () => {
  logger.info(`🚀 TerraLevy API running on port ${config.port}`);
  logger.info(`📡 WebSocket server available at ws://localhost:${config.port}/ws`);
  logger.info(`🔒 FISMA-HIGH compliance: ENABLED`);
  logger.info(`🌍 Environment: ${config.nodeEnv}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export { app, server, wss };
