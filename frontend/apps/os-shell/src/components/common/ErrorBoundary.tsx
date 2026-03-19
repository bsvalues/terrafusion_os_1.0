import { BugReport, Home, Refresh, Warning } from '@mui/icons-material';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { createLogger } from '@/hooks/useLogger';

const logger = createLogger('ErrorBoundary');
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showErrorDetails?: boolean;
  onError?: (_error: Error, _errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}
interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

/**
 * Comprehensive Error Boundary Component
 * Provides graceful error handling with government-grade error reporting
 * Replaces white screens with user-friendly error messages
 */
export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }
  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    logger.error('ErrorBoundary caught an error:', error);
    logger.error('Error Info:', errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send error to monitoring service
    this.reportError(error, errorInfo);
  }
  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset error boundary when resetKeys change
    if (hasError && resetKeys && prevProps.resetKeys) {
      const resetKeysChanged = resetKeys.some((key, index) => key !== prevProps.resetKeys![index]);
      if (resetKeysChanged) {
        this.resetErrorBoundary();
      }
    }

    // Reset on any prop change if enabled
    if (hasError && resetOnPropsChange && prevProps !== this.props) {
      this.resetErrorBoundary();
    }
  }
  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }
  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Report to monitoring service (e.g., Sentry, LogRocket, etc.)
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.getUserId(),
        sessionId: this.getSessionId(),
        errorId: this.state.errorId,
      };

      // Send to API endpoint for logging
      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      }).catch(() => {
        // Silently fail if error reporting fails
        logger.warn('Failed to report error to server');
      });
    } catch (reportingError) {
      logger.error('Error while reporting error:', reportingError);
    }
  };
  private getUserId = (): string | null => {
    // Get user ID from localStorage, context, or other state management
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user).id : null;
    } catch {
      return null;
    }
  };
  private getSessionId = (): string => {
    // Get or create session ID
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  };
  private resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };
  private handleRetry = () => {
    this.resetErrorBoundary();
  };
  private handleReload = () => {
    window.location.reload();
  };
  private handleGoHome = () => {
    window.location.href = '/';
  };
  private copyErrorToClipboard = async () => {
    const { error, errorInfo, errorId } = this.state;
    const errorText = `
Error ID: ${errorId}
Timestamp: ${new Date().toISOString()}
Message: ${error?.message}
Stack: ${error?.stack}
Component Stack: ${errorInfo?.componentStack}
`;
    try {
      await navigator.clipboard.writeText(errorText);
      alert('Error details copied to clipboard');
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = errorText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Error details copied to clipboard');
    }
  };
  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }
      const { error, errorInfo, errorId } = this.state;
      // Use globalThis.import.meta.env for Jest compatibility (mocked in setupTests.ts)
      const isDevelopment = (globalThis as any).import?.meta?.env?.DEV ?? false;
      return (
        <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
          <Card className='w-full max-w-2xl'>
            <CardHeader className='text-center'>
              <div className='mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center'>
                <Warning className='w-8 h-8 text-red-600' />
              </div>
              <CardTitle className='text-2xl font-bold text-gray-900'>
                Something went wrong
              </CardTitle>
              <CardDescription className='text-gray-600'>
                We apologize for the inconvenience. An unexpected error has occurred.
              </CardDescription>
            </CardHeader>

            <CardContent className='space-y-6'>
              <Alert>
                <Warning className='h-4 w-4' />

                <AlertTitle>Error Information</AlertTitle>
                <AlertDescription>
                  <div className='mt-2 space-y-2'>
                    <p>
                      <strong>Error ID:</strong> {errorId}
                    </p>
                    <p>
                      <strong>Time:</strong> {new Date().toLocaleString()}
                    </p>
                    {error?.message && (
                      <p>
                        <strong>Message:</strong> {error.message}
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              <div className='flex flex-wrap gap-3 justify-center'>
                <Button onClick={this.handleRetry} className='flex items-center gap-2'>
                  <Refresh className='w-4 h-4' />
                  Try Again
                </Button>

                <Button
                  variant='outline'
                  onClick={this.handleReload}
                  className='flex items-center gap-2'
                >
                  <Refresh className='w-4 h-4' />
                  Reload Page
                </Button>

                <Button
                  variant='outline'
                  onClick={this.handleGoHome}
                  className='flex items-center gap-2'
                >
                  <Home className='w-4 h-4' />
                  Go Home
                </Button>

                {isDevelopment && (
                  <Button
                    variant='outline'
                    onClick={this.copyErrorToClipboard}
                    className='flex items-center gap-2'
                  >
                    <BugReport className='w-4 h-4' />
                    Copy Error Details
                  </Button>
                )}
              </div>

              {isDevelopment && this.props.showErrorDetails && (
                <details className='mt-6'>
                  <summary className='cursor-pointer font-medium text-gray-700 hover:text-gray-900'>
                    🔍 Technical Details (Development Only)
                  </summary>
                  <div className='mt-4 p-4 bg-gray-100 rounded-lg overflow-auto'>
                    <h4 className='font-semibold mb-2'>Error Stack:</h4>
                    <pre className='text-sm text-red-600 whitespace-pre-wrap mb-4'>
                      {error?.stack}
                    </pre>

                    <h4 className='font-semibold mb-2'>Component Stack:</h4>
                    <pre className='text-sm text-blue-600 whitespace-pre-wrap'>
                      {errorInfo?.componentStack}
                    </pre>
                  </div>
                </details>
              )}

              <div className='text-center text-sm text-gray-500'>
                <p>
                  If this problem persists, please contact support with Error ID:{' '}
                  <code className='bg-gray-100 px-1 rounded'>{errorId}</code>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}

// Hook version for functional components
export const useErrorHandler = () => {
  const handleError = React.useCallback((error: Error, errorInfo?: ErrorInfo) => {
    logger.error('Handled Error:', error);
    if (errorInfo) {
      logger.error('Error Info:', errorInfo);
    }

    // You can add custom error handling logic here
    // such as sending to analytics, showing toast notifications, etc.
  }, []);
  return {
    handleError,
  };
};

// Higher-order component for wrapping any component with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Async error boundary for handling promise rejections
export class AsyncErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }
  componentDidMount() {
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }
  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }
  private resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };
  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    logger.error('Unhandled Promise Rejection:', event.reason);

    // Create a synthetic error for promise rejections
    const error = new Error(`Unhandled Promise Rejection: ${event.reason}`);
    const errorInfo: ErrorInfo = {
      componentStack: 'Promise rejection (no component stack available)',
    };
    this.setState({
      hasError: true,
      error,
      errorInfo,
      errorId: `async-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    });

    // Prevent the default browser behavior
    event.preventDefault();
  };
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className='error-boundary-fallback p-8 text-center'>
          <h2>Something went wrong</h2>
          <p>An error occurred while rendering this component.</p>
          <button
            onClick={this.resetErrorBoundary}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--tf-network-blue)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
export default ErrorBoundary;
