import React, {Component, ErrorInfo, ReactNode} from 'react';
import {Button} from './button';
import {AlertTriangle, RefreshCw, RotateCcw} from 'lucide-react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from './card';

interface ErrorBoundaryProps {children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  allowRetry?: boolean;
  allowReload?: boolean;}

interface ErrorBoundaryState {hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;}

/**
 * Enhanced Error Boundary component to catch JavaScript errors in child component tree.
 * Provides comprehensive error handling with retry mechanisms and detailed error reporting.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,};
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState>{return {
      hasError: true,
      error,};
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Update state with error info
    this.setState({
      errorInfo,});

    // Call the onError callback if provided
    if (this.props.onError) {this.props.onError(error, errorInfo);}

    // Send error to monitoring service (if configured)
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo): void => {// Here you could integrate with error reporting services like Sentry, LogRocket, etc.
    console.warn('Error reporting not configured. Error details:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,});
  };

  resetErrorBoundary = (): void => {this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,}));
  };

  handleReload = (): void => {window.location.reload();};

  render(): ReactNode {const {
      children,
      fallback,
      showDetails = true,
      allowRetry = true,
      allowReload = true,} = this.props;

    if (this.state.hasError) {// Custom fallback UI if provided
      if (fallback) {
        return fallback;}

      // Default error UI
      return (<div className="min-h-screen flex items-center justify-center p-4 bg-background"><Card className="w-full max-w-2xl border-destructive/50 bg-destructive/5"><CardHeader className="text-center"><div className="flex justify-center mb-4"><AlertTriangle className="h-12 w-12 text-destructive" /></div><CardTitle className="text-destructive text-2xl">Something Went Wrong</CardTitle><CardDescription className="text-lg">An unexpected error occurred in the application</CardDescription></CardHeader><CardContent className="space-y-6">{/* Error Message */}<div className="p-4 bg-muted rounded-lg border"><h4 className="font-medium text-sm text-destructive mb-2">Error Details:</h4><p className="text-sm font-mono text-muted-foreground break-words">{this.state.error?.message || 'An unexpected error occurred'}</p></div>{/* Retry Information */}
              {this.state.retryCount > 0 && (<div className="p-3 bg-amber-50 border border-amber-200 rounded-lg"><p className="text-sm text-amber-800">Retry attempts: {this.state.retryCount}</p></div>)}

              {/* Stack Trace (if showDetails is true) */}
              {showDetails && this.state.error?.stack && (<details className="group"><summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">View Technical Details</summary><div className="mt-3 p-4 bg-muted rounded-lg border"><h5 className="font-medium text-xs text-destructive mb-2">Stack Trace:</h5><pre className="text-xs font-mono text-muted-foreground overflow-auto max-h-40 whitespace-pre-wrap">{this.state.error.stack}</pre>{this.state.errorInfo?.componentStack && (<div className="mt-4"><h5 className="font-medium text-xs text-destructive mb-2">Component Stack:</h5><pre className="text-xs font-mono text-muted-foreground overflow-auto max-h-40 whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre></div>)}</div></details>)}

              {/* Action Buttons */}<div className="flex flex-col sm:flex-row gap-3 pt-4">{allowRetry && (<Button onClick={this.resetErrorBoundary} className="flex-1" variant="default"><RotateCcw className="w-4 h-4 mr-2" />Try Again</Button>)}

                {allowReload && (<Button onClick={this.handleReload} variant="outline" className="flex-1"><RefreshCw className="w-4 h-4 mr-2" />Reload Page</Button>)}</div>{/* Help Text */}<div className="text-center pt-4 border-t"><p className="text-sm text-muted-foreground">If the problem persists, please contact support with the error details above.</p></div></CardContent></Card></div>);
    }

    return children;
  }
}

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary =<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>) => {
  const WrappedComponent = (props: P) => (<ErrorBoundary {...errorBoundaryProps}><Component {...props} /></ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
};

// Hook for error reporting
export const useErrorHandler = () => {const handleError = React.useCallback((error: Error, errorInfo?: ErrorInfo) => {
    console.error('Manual error report:', error, errorInfo);
    // Could integrate with error reporting service here}, []);

  return handleError;
};

export default ErrorBoundary;
