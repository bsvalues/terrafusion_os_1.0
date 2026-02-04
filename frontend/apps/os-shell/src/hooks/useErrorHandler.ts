import { useCallback, useContext } from 'react';

import { ErrorContext } from '../contexts/ErrorContext';

export interface ErrorInfo {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  errorId: string;
  correlationId?: string; // Phase 1: correlationId-first error UX
  context?: Record<string, any>;
}

export interface AsyncError extends Error {
  context?: Record<string, any>;
  retryable?: boolean;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Enhanced error handling hook for async operations and API calls
 * Provides centralized error management with retry capabilities
 */
export const useErrorHandler = () => {
  const errorContext = useContext(ErrorContext);

  // Handle async errors (API calls, promises)
  const handleAsyncError = useCallback(
    (error: AsyncError, context?: Record<string, any>) => {
      const errorInfo: ErrorInfo = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        errorId: `async-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        context: { ...error.context, ...context },
      };

      console.error('🚨 Async Error:', errorInfo);

      // Send to global error context if available
      if (errorContext) {
        errorContext.reportError(errorInfo);
      }

      // Send to monitoring service
      reportToMonitoring(errorInfo);

      return errorInfo;
    },
    [errorContext]
  );

  // Handle API errors with specific formatting
  const handleApiError = useCallback(
    (error: any, endpoint?: string, requestData?: any) => {
      let errorMessage = 'An API error occurred';
      let statusCode: number | undefined;

      if (error.response) {
        // HTTP error response
        statusCode = error.response.status;
        errorMessage = error.response.data?.message || error.response.statusText || errorMessage;
      } else if (error.request) {
        // Network error
        errorMessage = 'Network error - please check your connection';
      } else {
        // Other error
        errorMessage = error.message || errorMessage;
      }

      const apiError: AsyncError = new Error(errorMessage) as AsyncError;
      apiError.context = {
        endpoint,
        statusCode,
        requestData: requestData ? JSON.stringify(requestData) : undefined,
        type: 'api-error',
      };
      apiError.retryable = statusCode ? isRetryableStatusCode(statusCode) : false;
      apiError.severity = getSeverityFromStatusCode(statusCode);

      return handleAsyncError(apiError);
    },
    [handleAsyncError]
  );

  // Handle validation errors
  const handleValidationError = useCallback(
    (validationErrors: Record<string, string[]>) => {
      const errorMessage =
        'Validation failed: ' +
        Object.entries(validationErrors)
          .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
          .join('; ');

      const validationError: AsyncError = new Error(errorMessage) as AsyncError;
      validationError.context = {
        validationErrors,
        type: 'validation-error',
      };
      validationError.retryable = false;
      validationError.severity = 'medium';

      return handleAsyncError(validationError);
    },
    [handleAsyncError]
  );

  // Create a wrapper for async operations with automatic error handling
  const withErrorHandling = useCallback(
    <T>(asyncOperation: () => Promise<T>, context?: Record<string, any>) => {
      return async (): Promise<T | null> => {
        try {
          return await asyncOperation();
        } catch (error) {
          handleAsyncError(error as AsyncError, context);
          return null;
        }
      };
    },
    [handleAsyncError]
  );

  // Retry mechanism for failed operations
  const retryOperation = useCallback(
    async <T>(
      operation: () => Promise<T>,
      maxRetries: number = 3,
      delay: number = 1000,
      context?: Record<string, any>
    ): Promise<T | null> => {
      let lastError: AsyncError;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await operation();
        } catch (error) {
          lastError = error as AsyncError;

          if (attempt === maxRetries || !lastError.retryable) {
            handleAsyncError(lastError, { ...context, attempt, maxRetries });
            return null;
          }

          console.warn(`⚠️ Retry attempt ${attempt}/${maxRetries} failed:`, error.message);
          await new Promise((resolve) => setTimeout(resolve, delay * attempt)); // Exponential backoff
        }
      }

      return null;
    },
    [handleAsyncError]
  );

  // Clear errors (if using global error context)
  const clearErrors = useCallback(() => {
    if (errorContext) {
      errorContext.clearErrors();
    }
  }, [errorContext]);

  return {
    handleAsyncError,
    handleApiError,
    handleValidationError,
    withErrorHandling,
    retryOperation,
    clearErrors,
  };
};

// Utility functions
const isRetryableStatusCode = (statusCode: number): boolean => {
  // Retry on server errors, not client errors
  return statusCode >= 500 || statusCode === 408 || statusCode === 429;
};

const getSeverityFromStatusCode = (statusCode?: number): 'low' | 'medium' | 'high' | 'critical' => {
  if (!statusCode) return 'medium';

  if (statusCode >= 500) return 'high';
  if (statusCode >= 400) return 'medium';
  return 'low';
};

const reportToMonitoring = async (errorInfo: ErrorInfo) => {
  try {
    await fetch('/api/errors/frontend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorInfo),
    });
  } catch (reportingError) {
    console.warn('Failed to report error to monitoring service:', reportingError);
  }
};

/**
 * Hook for handling form validation errors
 */
export const useFormErrorHandler = () => {
  const { handleValidationError } = useErrorHandler();

  const handleFormError = useCallback(
    (error: any) => {
      if (error.response?.data?.errors) {
        // Handle FluentValidation errors from API
        const validationErrors: Record<string, string[]> = {};

        if (Array.isArray(error.response.data.errors)) {
          // Simple error array
          validationErrors.general = error.response.data.errors;
        } else {
          // Structured validation errors
          Object.entries(error.response.data.errors).forEach(([field, errors]) => {
            validationErrors[field] = Array.isArray(errors) ? errors : [errors as string];
          });
        }

        return handleValidationError(validationErrors);
      }

      return null;
    },
    [handleValidationError]
  );

  return { handleFormError };
};

/**
 * Hook for handling specific API endpoint errors
 */
export const useApiErrorHandler = (baseEndpoint?: string) => {
  const { handleApiError, retryOperation } = useErrorHandler();

  const handleEndpointError = useCallback(
    (error: any, endpoint?: string, requestData?: any) => {
      const fullEndpoint = baseEndpoint && endpoint ? `${baseEndpoint}${endpoint}` : endpoint;
      return handleApiError(error, fullEndpoint, requestData);
    },
    [handleApiError, baseEndpoint]
  );

  const retryApiCall = useCallback(
    <T>(apiCall: () => Promise<T>, endpoint?: string, maxRetries?: number) => {
      return retryOperation(apiCall, maxRetries, 1000, {
        endpoint: baseEndpoint && endpoint ? `${baseEndpoint}${endpoint}` : endpoint,
      });
    },
    [retryOperation, baseEndpoint]
  );

  return {
    handleEndpointError,
    retryApiCall,
  };
};

export default useErrorHandler;
