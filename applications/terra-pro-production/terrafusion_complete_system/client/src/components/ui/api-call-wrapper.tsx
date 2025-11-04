import React, { useState } from "react";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { SuccessState } from "@/components/ui/success-state";

interface ApiCallWrapperProps<T> {
  onExecute: () => Promise<T>;
  children: (data: T | null, execute: () => Promise<void>) => React.ReactNode;
  loadingText?: string;
  successMessage?: string;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  loadingVariant?: "overlay" | "inline" | "skeleton";
  showCard?: boolean;
  className?: string;
  hideLoadingState?: boolean;
  executeOnMount?: boolean;
}

export function ApiCallWrapper<T>({
  onExecute,
  children,
  loadingText = "Processing...",
  successMessage,
  loadingComponent,
  errorComponent,
  loadingVariant = "overlay",
  className,
  hideLoadingState = false,
  executeOnMount = false,
}: ApiCallWrapperProps<T>) {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [data, setData] = useState<T | null>(null);

  React.useEffect(() => {
    if (executeOnMount) {
      execute();
    }
  }, []);

  const execute = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setIsError(false);
      setIsSuccess(false);

      const result = await onExecute();

      setData(result);
      setIsSuccess(true);
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  // Custom loading component if provided
  if (isLoading && loadingComponent) {
    return <>{loadingComponent}</>;
  }

  // Custom error component if provided
  if (isError && error && errorComponent) {
    return <>{errorComponent}</>;
  }

  // Default error state
  if (isError && error) {
    return (
      <ErrorState
        title="Error"
        message={error?.message || "An unexpected error occurred."}
        onRetry={() => execute()}
        className={className}
      />
    );
  }

  // Show success message if specified
  if (isSuccess && successMessage) {
    return <SuccessState message={successMessage} className="mb-4" />;
  }

  // Main content with optional loading state
  if (!hideLoadingState) {
    return (
      <LoadingState
        isLoading={isLoading}
        loadingText={loadingText}
        variant={loadingVariant}
        className={className}
      >
        {children(data, execute)}
      </LoadingState>
    );
  }

  return <div className={className}>{children(data, execute)}</div>;
}
