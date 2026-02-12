import React from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Warning  } from '@mui/icons-material';

interface ApiErrorProps {
  title?: string;
  message?: string;
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
}

/**
 * ApiError component for displaying API request errors with retry functionality
 * 
 * @param title - Error title
 * @param message - Error message (if not provided, will use error.message or default)
 * @param error - Error object
 * @param onRetry - Function to call when retry button is clicked
 * @param className - Additional CSS classes
 */
export function ApiError({
  title = "Error",
  message,
  error,
  onRetry,
  className = ""
}: ApiErrorProps) {
  // Extract message from error if one wasn't provided
  const errorMessage = message || (error?.message || "An unexpected error occurred. Please try again.");
  
  // Check for common error patterns to provide more user-friendly messages
  let userFriendlyMessage = errorMessage;
  
  if (error) {
    if (errorMessage.includes("Network Error") || errorMessage.includes("Failed to fetch")) {
      userFriendlyMessage = "Unable to connect to the server. Please check your internet connection and try again.";
    } else if (errorMessage.includes("Unauthorized") || errorMessage.includes("401")) {
      userFriendlyMessage = "Your session has expired. Please log in again.";
    } else if (errorMessage.includes("Not Found") || errorMessage.includes("404")) {
      userFriendlyMessage = "The requested resource could not be found. It may have been moved or deleted.";
    } else if (errorMessage.includes("Timeout") || errorMessage.includes("timed out")) {
      userFriendlyMessage = "The request timed out. The server might be experiencing high load. Please try again.";
    }
  }
  
  return (
    <Alert variant="destructive" className={`mb-4 ${className}`}>
      <Warning className="h-4 w-4" /><>

      <AlertTitle>{title}</AlertTitle>
      <AlertDescription
</>

className="mt-2">
        <p>{userFriendlyMessage}</p>
        
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry} 
            className="mt-2 bg-background hover:bg-background/80"
          >
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}