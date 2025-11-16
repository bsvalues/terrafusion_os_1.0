import React, { useState } from "react";
import { AlertCircle, X, ChevronDown, ChevronUp  } from '@mui/icons-material';
import { useApp } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Button } from "./button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";

export interface ErrorBannerProps {
  // Optional override to show a specific error message
  title?: string;
  // Optional error description
  description?: string;
  // Optional error details (typically for developers)
  details?: string;
  // Whether to allow the user to dismiss the error
  dismissible?: boolean;
  // Additional CSS classes
  className?: string;
}

export function ErrorBanner({
  title,
  description,
  details,
  dismissible = true,
  className,
}: ErrorBannerProps) {
  const { state, clearError } = useApp();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Use passed props or global error state
  const isError = title !== undefined || state.error.isError;
  const errorTitle = title || state.error.message || "An error occurred";
  const errorDescription =
    description || state.error.message || "Something went wrong. Please try again.";
  const errorDetails = details || state.error.details;

  if (!isError) {
    return null;
  }

  return (
    <Alert variant="destructive" className={cn("relative", className)}>
      <AlertCircle className="h-4 w-4" /><>

      <AlertTitle>{errorTitle}</AlertTitle>
      <AlertDescription
</>>
        {errorDescription}

        {errorDetails && (
          <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen} className="mt-2">
            <div className="flex items-center">
              <CollapsibleTrigger asChild>
                <Button variant="link" size="sm" className="p-0 h-auto text-xs">
                  {isDetailsOpen ? (
                    <ChevronUp className="h-3 w-3 mr-1" />
                  ) : (
                    <ChevronDown className="h-3 w-3 mr-1" />
                  )}
                  {isDetailsOpen ? "Hide details" : "Show details"}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              <div className="mt-2 p-2 bg-destructive/10 rounded text-xs font-mono whitespace-pre-wrap overflow-auto max-h-32">
                {errorDetails}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </AlertDescription>

      {dismissible && (
        <Button
          size="sm"
          variant="ghost"
          className="absolute top-1 right-1 h-6 w-6 p-0"
          onClick={() => clearError()}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      )}
    </Alert>
  );
}
