import { useState, useCallback } from 'react';
import { useToast } from './use-toast';

/**
 * Error handler options
 */
interface ErrorHandlerOptions {
  /**
   * Whether to show toast notifications for errors
   * @default true
   */
  showToast?: boolean;
  
  /**
   * Whether to log errors to the console
   * @default true
   */
  logToConsole?: boolean;
  
  /**
   * Custom error handler to be called when an error occurs
   */
  onError?: (error: Error) => void;
}

/**
 * Error handler hook return type
 */
interface UseErrorHandlerReturn {
  /**
   * Current error object
   */
  error: Error | null;
  
  /**
   * Whether an error has occurred
   */
  hasError: boolean;
  
  /**
   * Handle an error
   */
  handleError: (error: unknown) => void;
  
  /**
   * Clear the current error
   */
  clearError: () => void;
}

/**
 * Custom hook to handle errors in a standardized way
 */
export const useErrorHandler = (options: ErrorHandlerOptions = {}): UseErrorHandlerReturn => {
  // Default options
  const {
    showToast = true,
    logToConsole = true,
    onError,
  } = options;
  
  // Toast hook for notifications
  const { error: showErrorToast } = useToast();
  
  // State to track the current error
  const [error, setError] = useState<Error | null>(null);
  
  // Handle an error
  const handleError = useCallback((err: unknown) => {
    // Convert the error to a proper Error object if it's not already
    const errorObject = err instanceof Error ? err : new Error(String(err));
    
    // Update the error state
    setError(errorObject);
    
    // Show a toast notification if enabled
    if (showToast) {
      showErrorToast({
        title: 'An error occurred',
        description: errorObject.message,
      });
    }
    
    // Log to console if enabled
    if (logToConsole) {
      console.error('Error caught by error handler:', errorObject);
    }
    
    // Call custom error handler if provided
    if (onError) {
      onError(errorObject);
    }
  }, [showToast, logToConsole, onError, showErrorToast]);
  
  // Clear the current error
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  return {
    error,
    hasError: error !== null,
    handleError,
    clearError,
  };
};