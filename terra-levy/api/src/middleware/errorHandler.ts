/**
 * Error Handler Middleware
 * Centralized error handling with FISMA-HIGH compliant logging
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export class AppError extends Error implements ApiError {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error types
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const validationErrors = err.errors.map(e => ({
      path: e.path.join('.'),
      message: e.message,
    }));

    logger.warn({
      requestId: req.requestId,
      validationErrors,
    }, 'Validation error');

    res.status(400).json({
      error: 'Validation Error',
      code: 'VALIDATION_ERROR',
      requestId: req.requestId,
      details: validationErrors,
    });
    return;
  }

  // Determine status code
  const statusCode = err.statusCode || 500;

  // Log error
  if (statusCode >= 500) {
    logger.error({
      requestId: req.requestId,
      error: err.message,
      stack: err.stack,
      code: err.code,
    }, 'Server error');
  } else {
    logger.warn({
      requestId: req.requestId,
      error: err.message,
      code: err.code,
    }, 'Client error');
  }

  // Build response
  const response: Record<string, unknown> = {
    error: err.message,
    code: err.code || 'INTERNAL_ERROR',
    requestId: req.requestId,
  };

  // Include details in non-production for debugging
  if (config.nodeEnv !== 'production' && err.details) {
    response.details = err.details;
  }

  // Include stack trace in development only
  if (config.nodeEnv === 'development' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
