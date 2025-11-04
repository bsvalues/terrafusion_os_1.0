import React from "react";
import { UseQueryResult } from "@tanstack/react-query";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { Card, CardContent } from "@/components/ui/card";

interface DataQueryWrapperProps<TData> {
  query: UseQueryResult<TData, Error>;
  children: (data: TData) => React.ReactNode;
  loadingText?: string;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  loadingVariant?: "overlay" | "inline" | "skeleton";
  showCard?: boolean;
  className?: string;
  hideLoadingState?: boolean;
}

export function DataQueryWrapper<TData>({
  query,
  children,
  loadingText = "Loading data...",
  loadingComponent,
  errorComponent,
  loadingVariant = "overlay",
  showCard = false,
  className,
  hideLoadingState = false,
}: DataQueryWrapperProps<TData>) {
  const { isLoading, isError, error, data, refetch } = query;

  // Custom loading component if provided
  if (isLoading && loadingComponent) {
    return <>{loadingComponent}</>;
  }

  // Custom error component if provided
  if (isError && errorComponent) {
    return <>{errorComponent}</>;
  }

  // Default error state
  if (isError) {
    return (
      <ErrorState
        title="Error loading data"
        message={error?.message || "An unexpected error occurred while fetching data."}
        onRetry={() => refetch()}
        className={className}
      />
    );
  }

  // Main content with optional loading state
  const content = (
    <>
      {!hideLoadingState && (
        <LoadingState isLoading={isLoading} loadingText={loadingText} variant={loadingVariant}>
          {data ? children(data) : null}
        </LoadingState>
      )}
      {hideLoadingState &&
        (isLoading
          ? loadingComponent || (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
              </div>
            )
          : data
            ? children(data)
            : null)}
    </>
  );

  // Wrap in card if requested
  if (showCard) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">{content}</CardContent>
      </Card>
    );
  }

  return <div className={className}>{content}</div>;
}
