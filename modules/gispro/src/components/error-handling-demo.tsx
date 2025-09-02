import React, { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle, Info, XCircle  } from '@mui/icons-material';

interface ErrorHandlingDemoProps {
  title?: string;
}

/**
 * Component to demonstrate various error handling and notification capabilities.
 */
export function ErrorHandlingDemo({ title = "Error Handling Demo" }: ErrorHandlingDemoProps) {
  const { toast, success, error, warning, info } = useToast();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Simulate a JavaScript error (uncaught exception)
  const simulateJsError = () => {
    try {
      // @ts-ignore - Intentional error
      const obj = null;
      obj.nonExistentMethod();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  };

  // Simulate an API error (HTTP error)
  const simulateApiError = () => {
    setErrorMessage("API Error: Failed to fetch data - 404 Not Found");
    error({
      title: "API Error",
      description: "Failed to fetch data - 404 Not Found"
    });
  };

  // Simulate a form validation error
  const simulateValidationError = () => {
    setErrorMessage("Validation Error: Email is required");
    warning({
      title: "Validation Error",
      description: "Email is required"
    });
  };

  // Clear any displayed errors
  const clearError = () => {
    setErrorMessage(null);
  };

  // Show a success toast
  const showSuccessToast = () => {
    success({
      title: "Success!",
      description: "Operation completed successfully"
    });
  };

  // Show an error toast
  const showErrorToast = () => {
    error({
      title: "Error!",
      description: "Something went wrong"
    });
  };

  // Show a warning toast
  const showWarningToast = () => {
    warning({
      title: "Warning!",
      description: "This action might cause issues"
    });
  };

  // Show an info toast
  const showInfoToast = () => {
    info({
      title: "Information",
      description: "Here's something you should know"
    });
  };

  // Show a toast with custom content
  const showCustomToast = () => {
    toast({
      title: (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>Custom Toast</span>
        </div>
      ),
      description: "This is a custom toast with rich content",
      variant: "info",
      action: (
        <Button variant="outline" size="sm" onClick={() => console.log("Action clicked")}>
          Action
        </Button>
      ),
    });
  };

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      <Card>
        <CardHeader><>

          <CardTitle>{title}</CardTitle>
          <CardDescription
</>>
            Explore error handling and notification features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Display current error */}
          {errorMessage && (
            <Alert variant="error" onClose={clearError}>
              <AlertTitle className="flex items-center gap-2"><>

                <XCircle className="h-4 w-4" />
                Error Occurred
              </AlertTitle>
              <AlertDescription
</>>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Error simulation section */}
            <Card>
              <CardHeader><>

                <CardTitle>Simulate Errors</CardTitle>
                <CardDescription
</>>Trigger different types of errors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2"><>

                <Button 
                  onClick={simulateJsError} 
                  variant="outline"
                  className="w-full"
                >
                  Simulate JavaScript Error
                </Button>
                <Button
</> 
                  onClick={simulateApiError} 
                  variant="outline"
                  className="w-full"
                >
                  Simulate API Error
                </Button><>

                <Button 
                  onClick={simulateValidationError} 
                  variant="outline"
                  className="w-full"
                >
                  Simulate Validation Error
                </Button>
                <Button
</> 
                  onClick={clearError} 
                  variant="outline"
                  className="w-full"
                  disabled={!errorMessage}
                >
                  Clear Error
                </Button>
              </CardContent>
            </Card>

            {/* Toast notifications section */}
            <Card>
              <CardHeader><>

                <CardTitle>Toast Notifications</CardTitle>
                <CardDescription
</>>Display different types of toast messages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2"><>

                <Button 
                  onClick={showSuccessToast} 
                  className="w-full"
                  startIcon={<CheckCircle className="h-4 w-4" />}
                >
                  Success Toast
                </Button>
                <Button
</> 
                  onClick={showErrorToast} 
                  className="w-full"
                  variant="destructive"
                  startIcon={<XCircle className="h-4 w-4" />}
                >
                  Error Toast
                </Button><>

                <Button 
                  onClick={showWarningToast} 
                  className="w-full"
                  variant="secondary"
                  startIcon={<AlertCircle className="h-4 w-4" />}
                >
                  Warning Toast
                </Button>
                <Button
</> 
                  onClick={showInfoToast} 
                  className="w-full"
                  variant="outline"
                  startIcon={<Info className="h-4 w-4" />}
                >
                  Info Toast
                </Button>
                <Button 
                  onClick={showCustomToast} 
                  className="w-full"
                  variant="secondary"
                >
                  Custom Toast
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Alert examples */}
          <Card>
            <CardHeader><>

              <CardTitle>Alert Examples</CardTitle>
              <CardDescription
</>>Different types of alert components</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="success"><>

                <AlertTitle>Success</AlertTitle>
                <AlertDescription
</>>Your data has been saved successfully.</AlertDescription>
              </Alert>
              
              <Alert variant="error"><>

                <AlertTitle>Error</AlertTitle>
                <AlertDescription
</>>Failed to save your data. Please try again.</AlertDescription>
              </Alert>
              
              <Alert variant="warning"><>

                <AlertTitle>Warning</AlertTitle>
                <AlertDescription
</>>Your account will expire in 7 days.</AlertDescription>
              </Alert>
              
              <Alert variant="info"><>

                <AlertTitle>Information</AlertTitle>
                <AlertDescription
</>>A new version is available. Please update.</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}