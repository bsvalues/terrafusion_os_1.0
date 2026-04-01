/**
 * Error Handler Utility
 * 
 * Provides centralized error handling and logging capabilities for the application.
 * This utility helps classify errors, log them properly, and transform them into
 * appropriate responses.
 */

// Error classification types
export enum ErrorType {
  // Data errors
  DATA_NOT_FOUND = 'DATA_NOT_FOUND',
  DATA_VALIDATION = 'DATA_VALIDATION',
  DATA_INTEGRITY = 'DATA_INTEGRITY',
  
  // Authentication/Authorization errors
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_FAILED = 'AUTH_FAILED',
  FORBIDDEN = 'FORBIDDEN',
  
  // Service errors
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  SERVICE_TIMEOUT = 'SERVICE_TIMEOUT',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // Runtime errors
  RUNTIME_ERROR = 'RUNTIME_ERROR',
  INVALID_OPERATION = 'INVALID_OPERATION',
  
  // LLM and AI errors
  LLM_REQUEST_ERROR = 'LLM_REQUEST_ERROR',
  LLM_RESPONSE_ERROR = 'LLM_RESPONSE_ERROR',
  AGENT_EXECUTION_ERROR = 'AGENT_EXECUTION_ERROR',
  
  // Unknown errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// HTTP status code mapping
const errorStatusMap: Record<ErrorType, number> = {
  [ErrorType.DATA_NOT_FOUND]: 404,
  [ErrorType.DATA_VALIDATION]: 400,
  [ErrorType.DATA_INTEGRITY]: 400,
  
  [ErrorType.AUTH_REQUIRED]: 401,
  [ErrorType.AUTH_FAILED]: 401,
  [ErrorType.FORBIDDEN]: 403,
  
  [ErrorType.SERVICE_UNAVAILABLE]: 503,
  [ErrorType.SERVICE_TIMEOUT]: 504,
  [ErrorType.EXTERNAL_SERVICE_ERROR]: 502,
  
  [ErrorType.RUNTIME_ERROR]: 500,
  [ErrorType.INVALID_OPERATION]: 400,
  
  [ErrorType.LLM_REQUEST_ERROR]: 500,
  [ErrorType.LLM_RESPONSE_ERROR]: 500,
  [ErrorType.AGENT_EXECUTION_ERROR]: 500,
  
  [ErrorType.UNKNOWN_ERROR]: 500
};

// Application error class
export class AppError extends Error {
  type: ErrorType;
  details?: any;
  source?: string;
  
  constructor(
    message: string, 
    type: ErrorType = ErrorType.UNKNOWN_ERROR, 
    details?: any,
    source?: string
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.details = details;
    this.source = source;
  }
  
  /**
   * Get HTTP status code for this error type
   */
  getStatusCode(): number {
    return errorStatusMap[this.type] || 500;
  }
  
  /**
   * Transform error to a safe response object
   */
  toResponse() {
    return {
      error: true,
      type: this.type,
      message: this.message,
      ...(process.env.NODE_ENV !== 'production' && this.details ? { details: this.details } : {})
    };
  }
}

/**
 * Error Handler Utility Class
 */
export class ErrorHandler {
  /**
   * Handle and transform any error
   * @param error The error to handle
   * @param source Source of the error
   */
  static handleError(error: unknown, source?: string): AppError {
    if (error instanceof AppError) {
      return error;
    }
    
    // Handle native Error objects
    if (error instanceof Error) {
      return new AppError(
        error.message, 
        ErrorType.RUNTIME_ERROR,
        {
          stack: error.stack,
          name: error.name,
        },
        source
      );
    }
    
    // Handle other types of errors
    return new AppError(
      typeof error === 'string' ? error : 'An unknown error occurred',
      ErrorType.UNKNOWN_ERROR,
      error,
      source
    );
  }
  
  /**
   * Create a "Not Found" error
   */
  static notFound(message: string, details?: any): AppError {
    return new AppError(message, ErrorType.DATA_NOT_FOUND, details);
  }
  
  /**
   * Create a validation error
   */
  static validation(message: string, details?: any): AppError {
    return new AppError(message, ErrorType.DATA_VALIDATION, details);
  }
  
  /**
   * Create a service unavailable error
   */
  static serviceUnavailable(message: string, details?: any): AppError {
    return new AppError(message, ErrorType.SERVICE_UNAVAILABLE, details);
  }
  
  /**
   * Create an external service error
   */
  static externalServiceError(message: string, details?: any): AppError {
    return new AppError(message, ErrorType.EXTERNAL_SERVICE_ERROR, details);
  }
  
  /**
   * Create an LLM request error
   */
  static llmRequestError(message: string, details?: any): AppError {
    return new AppError(message, ErrorType.LLM_REQUEST_ERROR, details);
  }
  
  /**
   * Create an LLM response error
   */
  static llmResponseError(message: string, details?: any): AppError {
    return new AppError(message, ErrorType.LLM_RESPONSE_ERROR, details);
  }
  
  /**
   * Create an agent execution error
   */
  static agentExecutionError(message: string, details?: any): AppError {
    return new AppError(message, ErrorType.AGENT_EXECUTION_ERROR, details);
  }
  
  /**
   * Create an invalid operation error
   */
  static invalidOperation(message: string, details?: any): AppError {
    return new AppError(message, ErrorType.INVALID_OPERATION, details);
  }
}

/**
 * Error handling wrapper for async functions
 * @param fn Async function to wrap with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  source?: string
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw ErrorHandler.handleError(error, source);
    }
  };
}