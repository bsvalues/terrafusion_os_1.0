/**
 * Health Check Routes
 * Service health and readiness endpoints
 */

import { Router, Request, Response } from 'express';
import { config } from '../config/index.js';
import { getConnectionStats } from '../websocket/index.js';

const router = Router();

// Basic health check
router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'terralevy-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Detailed health check
router.get('/detailed', async (_req: Request, res: Response) => {
  const wsStats = getConnectionStats();

  const health = {
    status: 'healthy',
    service: 'terralevy-api',
    version: '1.0.0',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    websocket: wsStats,
    compliance: {
      fismaLevel: 'HIGH',
      auditEnabled: config.auditLogEnabled,
      auditLevel: config.auditLogLevel,
    },
    services: {
      coreServices: config.coreServicesUrl,
      collectionEngine: config.collectionEngineUrl,
      analyticsPlatform: config.analyticsPlatformUrl,
      citizenPortal: config.citizenPortalUrl,
    },
  };

  res.json(health);
});

// Readiness probe (for Kubernetes)
router.get('/ready', (_req: Request, res: Response) => {
  // Add checks for database, external services, etc.
  res.json({ ready: true });
});

// Liveness probe (for Kubernetes)
router.get('/live', (_req: Request, res: Response) => {
  res.json({ alive: true });
});

export { router as healthRoutes };
