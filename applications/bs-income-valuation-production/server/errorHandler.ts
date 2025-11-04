import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Custom error classes for specific error types
export class ValidationError extends Error {
  status: number;
  errors: any;
  code: string;
  
  constructor(message: string, errors?: any, code = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
    this.errors = errors;
    this.code = code;
  }
}

export class NotFoundError extends Error {
  status: number;
  code: string;
  entity?: string;
  
  constructor(message = 'Resource not found', entity?: string) {
    super(message);
    this.name = 'NotFoundError';
    this.status = 404;
    this.code = 'RESOURCE_NOT_FOUND';
    this.entity = entity;
  }
}

export class AuthorizationError extends Error {
  status: number;
  code: string;
  
  constructor(message = 'Unauthorized access', code = 'UNAUTHORIZED') {
    super(message);
    this.name = 'AuthorizationError';
    this.status = 401;
    this.code = code;
  }
}

export class ForbiddenError extends Error {
  status: number;
  code: string;
  
  constructor(message = 'Access forbidden', code = 'FORBIDDEN') {
    super(message);
    this.name = 'ForbiddenError';
    this.status = 403;
    this.code = code;
  }
}

export class ConflictError extends Error {
  status: number;
  code: string;
  entity?: string;
  
  constructor(message = 'Resource already exists', entity?: string) {
    super(message);
    this.name = 'ConflictError';
    this.status = 409;
    this.code = 'RESOURCE_CONFLICT';
    this.entity = entity;
  }
}

// Handler for Zod validation errors - formats the error in a more user-friendly way
export function handleZodError(error: z.ZodError) {
  const formattedErrors = error.errors.map(err => ({
    path: err.path.join('.'),
    message: err.message,
    code: 'INVALID_INPUT'
  }));
  
  return new ValidationError('Validation failed', formattedErrors);
}

// Async handler to catch async errors in route handlers
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global error handler middleware
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Get status code
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  // Determine error type
  const errorType = err.name || 'Error';
  
  // Handle Zod validation errors
  if (err instanceof z.ZodError) {
    const zodError = handleZodError(err);
    
    res.status(zodError.status).json({
      success: false,
      error: {
        type: zodError.name,
        message: zodError.message,
        status: zodError.status,
        code: zodError.code,
        validationErrors: zodError.errors
      }
    });
    return;
  }
  
  // Handle Drizzle/Database errors
  if (err.code && (err.code.startsWith('23') || err.code.startsWith('42'))) {
    console.error(`Database Error (${err.code}): ${err.message}`);
    
    // Map DB error code to something more user-friendly
    let dbErrorCode = 'DATABASE_ERROR';
    let dbErrorMessage = 'Database operation failed';
    
    // Handle specific PostgreSQL error codes
    if (err.code === '23505') {
      dbErrorCode = 'UNIQUE_VIOLATION';
      dbErrorMessage = 'A record with this information already exists';
    } else if (err.code === '23503') {
      dbErrorCode = 'FOREIGN_KEY_VIOLATION';
      dbErrorMessage = 'Referenced record does not exist';
    } else if (err.code === '23502') {
      dbErrorCode = 'NOT_NULL_VIOLATION';
      dbErrorMessage = 'Required field is missing';
    } else if (err.code === '42P01') {
      dbErrorCode = 'UNDEFINED_TABLE';
      dbErrorMessage = 'Database schema error';
    }
    
    return res.status(400).json({
      success: false,
      error: {
        type: 'DatabaseError',
        message: dbErrorMessage,
        status: 400,
        code: dbErrorCode,
        ...(process.env.NODE_ENV === 'development' && { 
          details: err.message,
          originalCode: err.code 
        })
      }
    });
  }
  
  // Additional details for development environment
  const details = process.env.NODE_ENV !== 'production' 
    ? {
        stack: err.stack,
        code: err.code,
        ...(err.errors && { validationErrors: err.errors })
      } 
    : undefined;
  
  // Log the error (with different levels based on severity)
  if (status >= 500) {
    console.error(`Error (${status}): ${message}`, err);
  } else if (status >= 400) {
    console.warn(`Warning (${status}): ${message}`);
  } else {
    console.log(`Info (${status}): ${message}`);
  }
  
  // Add error code if available
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  
  // Send standardized response with error code
  res.status(status).json({
    success: false,
    error: {
      type: errorType,
      message,
      status,
      code: errorCode,
      ...(err.entity && { entity: err.entity }),
      ...(err.errors && { validationErrors: err.errors }),
      ...(details && { details })
    }
  });
};