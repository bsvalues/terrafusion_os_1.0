/**
 * Error Handler Utility
 * Elite Power User - Centralized Error Handling
 */

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  context?: Record<string, any>;
}

export class AppErrorHandler {
  private static errorListeners: Array<(error: AppError) => void> = [];

  static onError(listener: (error: AppError) => void) {
    this.errorListeners.push(listener);
    return () => {
      this.errorListeners = this.errorListeners.filter((l) => l !== listener);
    };
  }

  static handleError(
    error: Error | unknown,
    code: string = 'UNKNOWN_ERROR',
    context?: Record<string, any>
  ): AppError {
    const appError: AppError = {
      code,
      message: error instanceof Error ? error.message : 'An unknown error occurred',
      details: error instanceof Error ? { stack: error.stack, name: error.name } : error,
      timestamp: new Date(),
      context,
    };

    // Log to console
    console.error('[AppError]', appError);

    // Notify listeners
    this.errorListeners.forEach((listener) => {
      try {
        listener(appError);
      } catch (err) {
        console.error('Error in error listener:', err);
      }
    });

    return appError;
  }

  static handleApiError(error: any, context?: Record<string, any>): AppError {
    let code = 'API_ERROR';
    let message = 'An API error occurred';

    if (error?.response) {
      code = `API_ERROR_${error.response.status}`;
      message = error.response.data?.message || error.response.statusText || message;
    } else if (error?.request) {
      code = 'API_NETWORK_ERROR';
      message = 'Network error: Unable to reach the API';
    } else if (error?.message) {
      message = error.message;
    }

    return this.handleError(error, code, context);
  }

  static handleSignalRError(error: any, context?: Record<string, any>): AppError {
    return this.handleError(error, 'SIGNALR_ERROR', { ...context, type: 'signalr' });
  }
}

