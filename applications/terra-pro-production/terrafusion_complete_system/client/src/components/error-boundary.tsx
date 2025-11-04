import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Refresh  } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Custom fallback UI when an error occurs
      if (fallback) {
        return fallback;
      }

      return (
        <div className="p-6 border rounded-md shadow-sm space-y-4 bg-card text-card-foreground">
          <div className="flex items-center space-x-2 text-red-500">
            <AlertCircle className="h-5 w-5" />
            <h3 className="text-lg font-medium">Something went wrong</h3>
          </div><>


          <p className="text-muted-foreground">
            {error?.message || "An unexpected error occurred while rendering this component."}
          </p>

          <div
</> className="bg-muted rounded-md p-4 mt-4 text-xs font-mono overflow-auto max-h-40">
            <pre>{error?.stack || "No stack trace available"}</pre>
          </div>

          <Button onClick={this.handleReset} className="mt-4" variant="outline">
            <Refresh className="mr-2 h-4 w-4" /> Try Again
          </Button>
        </div>
      );
    }

    return children;
  }
}
