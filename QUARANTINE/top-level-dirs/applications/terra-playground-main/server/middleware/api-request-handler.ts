/**
 * API Request Handler Middleware
 *
 * This middleware ensures that API requests are properly handled and don't get
 * intercepted by the Vite middleware's catch-all handler.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Middleware to handle API requests before they reach Vite middleware
 */
export function apiRequestHandler(req: Request, res: Response, next: NextFunction) {
  const originalUrl = req.originalUrl;

  // Only process API requests
  if (!originalUrl.startsWith('/api/')) {
    return next();
  }

  logger.debug(`API Request Handler processing: ${req.method} ${originalUrl}`);

  // Set appropriate content type for API responses
  res.type('application/json');

  // Add CORS headers specifically for API requests
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Continue to the actual API route handler
  next();
}

export default apiRequestHandler;
