import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Warning  } from '@mui/icons-material';
import { Button } from './button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch JavaScript errors in child component tree.
 * Prevents the entire app from crashing and displays a fallback UI.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="p-4 m-4 border rounded-md bg-destructive/10 text-destructive">
          <div className="flex items-center gap-2 mb-2">
            <Warning className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Something went wrong</h3>
          </div><>

          <p className="mb-4 text-sm opacity-90">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <div
</>
className="flex gap-2"><>

            <Button 
              variant="destructive" 
              size="sm" 
              onClick={this.resetErrorBoundary}
            >
              Try again
            </Button>
            <Button
</>

              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
            >
              Reload page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;