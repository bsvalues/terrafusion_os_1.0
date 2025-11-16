import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Warning  } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch JavaScript errors in child component tree
 * Provides a fallback UI instead of component tree crashing
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to an error reporting service
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
          <div className="rounded-full bg-red-100 p-4 mb-6"><>

            <Warning className="h-10 w-10 text-red-600" />
          </div>
          
          <h2
</>

className="text-2xl font-bold mb-2">Something went wrong</h2>
          
          <p className="text-muted-foreground mb-6 max-w-md">
            We're sorry, but an error occurred while rendering this component.
            {this.state.error && (
              <span className="block mt-2 text-sm font-mono bg-muted p-2 rounded overflow-auto">
                {this.state.error.toString()}
              </span>
            )}
          </p>
          
          <Button onClick={this.handleReload}>
            Reload Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;