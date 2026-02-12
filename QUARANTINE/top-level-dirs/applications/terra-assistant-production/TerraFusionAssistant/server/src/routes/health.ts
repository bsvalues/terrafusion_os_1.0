/**
 * Health Check Router
 * 
 * Provides endpoints for monitoring and health checking the service.
 */

import { Router } from 'express';
import { FEATURES } from '../../../shared/config';

// Create router
export const healthRouter = Router();

// GET /health - Basic health check
healthRouter.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// GET /health/details - Detailed health information
healthRouter.get('/details', (_req, res) => {
  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || 'unknown',
    environment: process.env.NODE_ENV || 'development',
    features: {
      marketplace: FEATURES.enableMarketplace,
      analytics: FEATURES.enableAnalytics,
      betaFeatures: FEATURES.enableBetaFeatures,
    },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };

  res.status(200).json(healthData);
});