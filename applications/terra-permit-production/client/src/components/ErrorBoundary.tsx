import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, Refresh  } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <div className="p-8 max-w-3xl mx-auto">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" /><>

            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription
</>>
              An error occurred in the application. Please try refreshing the page or click the button below to attempt recovery.
            </AlertDescription>
          </Alert>
          
          <div className="bg-gray-50 border rounded-md p-4 mb-6 overflow-auto max-h-60">
            <p className="font-mono text-sm text-red-600 whitespace-pre-wrap">
              {this.state.error && this.state.error.toString()}
            </p>
            {this.state.errorInfo && (
              <details className="mt-2"><>

                <summary className="text-sm font-medium cursor-pointer">Stack trace</summary>
                <p
</> className="mt-2 font-mono text-xs text-gray-700 whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </p>
              </details>
            )}
          </div>
          
          <div className="flex gap-4">
            <Button onClick={this.handleReset} className="flex items-center gap-2"><>

              <Refresh className="h-4 w-4" /> Try Recovery
            </Button>
            <Button
</> variant="outline" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;