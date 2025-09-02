/**
 * Error Handling Middleware for CostForge AI Champion Backend
 * 
 * Provides consistent error handling across all routes with
 * appropriate logging and client-safe error responses.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

/**
 * Central error handling middleware
 */
export function errorHandler(
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error with full context
  logger.error('Request error occurred', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode,
      code: error.code
    },
    request: {
      method: req.method,
      path: req.path,
      params: req.params,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  // Determine status code
  let statusCode = error.statusCode || 500;
  
  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
  } else if (error.name === 'ConflictError') {
    statusCode = 409;
  } else if (error.name === 'RateLimitError') {
    statusCode = 429;
  }

  // Prepare error response
  const errorResponse = {
    error: true,
    status: statusCode,
    message: getClientSafeMessage(error, statusCode),
    ...(process.env.NODE_ENV === 'development' && {
      details: {
        name: error.name,
        stack: error.stack,
        original: error.message
      }
    }),
    timestamp: new Date().toISOString(),
    requestId: generateRequestId(req)
  };

  // Add specific error codes for client handling
  if (error.code) {
    errorResponse.code = error.code;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * Get a client-safe error message
 */
function getClientSafeMessage(error: AppError, statusCode: number): string {
  // For operational errors, we can show the actual message
  if (error.isOperational) {
    return error.message;
  }

  // For specific status codes, provide generic messages
  switch (statusCode) {
    case 400:
      return 'Invalid request data provided';
    case 401:
      return 'Authentication required';
    case 403:
      return 'Access forbidden';
    case 404:
      return 'Resource not found';
    case 409:
      return 'Resource already exists or conflicts with existing data';
    case 429:
      return 'Too many requests, please try again later';
    case 500:
      return 'An internal server error occurred';
    case 502:
      return 'Bad gateway - external service unavailable';
    case 503:
      return 'Service temporarily unavailable';
    default:
      return 'An error occurred while processing your request';
  }
}

/**
 * Generate a unique request ID for tracking
 */
function generateRequestId(req: Request): string {
  // Try to get existing request ID from headers
  const existingId = req.get('x-request-id') || req.get('x-correlation-id');
  if (existingId) {
    return existingId;
  }

  // Generate new request ID
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create operational error (safe to show to client)
 */
export function createOperationalError(
  message: string,
  statusCode: number = 400,
  code?: string
): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  if (code) {
    error.code = code;
  }
  return error;
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Handle uncaught exceptions and unhandled rejections
 */
export function setupGlobalErrorHandlers(): void {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception - shutting down process', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Promise Rejection', {
      reason: reason instanceof Error ? {
        name: reason.name,
        message: reason.message,
        stack: reason.stack
      } : reason,
      promise: promise.toString()
    });
    
    // In production, you might want to shut down gracefully
    if (process.env.NODE_ENV === 'production') {
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    }
  });
}