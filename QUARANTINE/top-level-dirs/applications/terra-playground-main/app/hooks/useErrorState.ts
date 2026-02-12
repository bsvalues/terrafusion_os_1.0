import { useState, useCallback } from 'react';

export interface ErrorState {
  message: string;
  code?: string;
  details?: unknown;
  timestamp: number;
}

export const useErrorState = () => {
  const [error, setError] = useState<ErrorState | null>(null);
  const [errors, setErrors] = useState<ErrorState[]>([]);

  const setErrorState = useCallback((error: Error | string | unknown) => {
    const errorState: ErrorState = {
      message: error instanceof Error ? error.message : String(error),
      code: error instanceof Error ? error.name : undefined,
      details: error instanceof Error ? error.stack : undefined,
      timestamp: Date.now(),
    };

    setError(errorState);
    setErrors((prev) => [...prev, errorState].slice(-10));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearAllErrors = useCallback(() => {
    setError(null);
    setErrors([]);
  }, []);

  const removeError = useCallback((timestamp: number) => {
    setErrors((prev) => prev.filter((err) => err.timestamp !== timestamp));
  }, []);

  const withErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    errorMessage?: string
  ): Promise<T | null> => {
    try {
      return await operation();
    } catch (err) {
      setErrorState(err);
      if (errorMessage) {
        console.error(errorMessage, err);
      }
      return null;
    }
  }, [setErrorState]);

  return {
    error,
    errors,
    setErrorState,
    clearError,
    clearAllErrors,
    removeError,
    withErrorHandling,
  };
}; 