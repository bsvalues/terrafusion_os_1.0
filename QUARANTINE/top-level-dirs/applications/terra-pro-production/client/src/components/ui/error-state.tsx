import React from "react";
import { Warning, Refresh  } from '@mui/icons-material';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./card";
import { Button } from "./button";

interface ErrorStateProps {
  /**
   * Error to display
   */
  error: Error | string | null;

  /**
   * Title for the error card
   */
  title?: string;

  /**
   * Callback for retry action
   */
  onRetry?: () => void;

  /**
   * Custom actions to render instead of the default retry button
   */
  actions?: React.ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ErrorState component for standardized error display
 */
export function ErrorState({
  error,
  title = "An error occurred",
  onRetry,
  actions,
  className = "",
}: ErrorStateProps) {
  // Convert error to string if it's an Error object
  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <Card className={`border-red-200 ${className}`}>
      <CardHeader className="bg-red-50 border-b border-red-100">
        <CardTitle className="text-red-700 flex items-center gap-2">
          <Warning className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="py-6">
        <p className="text-gray-700">
          {errorMessage ||
            "Something went wrong. Please try again or contact support if the problem persists."}
        </p>
      </CardContent>
      {(onRetry || actions) && (
        <CardFooter className="border-t border-red-100 bg-red-50/50 flex justify-end py-3">
          {actions || (
            <Button
              onClick={onRetry}
              variant="outline"
              className="gap-2 border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800"
            >
              <Refresh className="h-4 w-4" />
              Try Again
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
