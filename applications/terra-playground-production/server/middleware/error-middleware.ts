/**
 * Error Handling Middleware
 *
 * Central error handling for Express routes
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/error-handler';
import { logger } from '../utils/logger';

/**
 * Global error handling middleware
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error with context
  logger.error(`Error handling request: ${err.message}`, {
    component: 'errorMiddleware',
    metadata: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      errorName: err.name,
      errorMessage: err.message,
      errorStack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    },
  });

  // Determine status code based on error type
  let statusCode = 500;
  let errorResponse = {
    error: true,
    message: 'Internal Server Error',
    details: process.env.NODE_ENV !== 'production' ? err.message : undefined,
  };

  // If it's our custom AppError, use its data
  if (err instanceof AppError) {
    statusCode = err.getStatusCode();
    errorResponse = err.toResponse();
  }

  // Send response
  res.status(statusCode).json(errorResponse);
}

/**
 * Not found middleware
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  logger.warn(`Route not found: ${req.method} ${req.url}`, {
    component: 'errorMiddleware',
    metadata: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    },
  });

  res.status(404).json({
    error: true,
    message: `Route not found: ${req.method} ${req.url}`,
  });
}

/**
 * API error wrapper for route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
