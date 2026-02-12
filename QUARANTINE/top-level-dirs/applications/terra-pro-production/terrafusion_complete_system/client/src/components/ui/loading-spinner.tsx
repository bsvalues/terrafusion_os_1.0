import React from "react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-5 w-5 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div className={cn("flex justify-center p-4", className)}>
      <div
        className={cn(
          "animate-spin border-primary border-t-transparent rounded-full",
          sizeClasses[size]
        )}
      ></div>
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="p-6 border rounded-md shadow-sm flex flex-col items-center justify-center space-y-4">
      <LoadingSpinner />
      <p className="text-muted-foreground">Loading data...</p>
    </div>
  );
}

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
      <div className="bg-card p-6 rounded-lg shadow-lg flex flex-col items-center">
        <LoadingSpinner />
        <p className="mt-4 text-muted-foreground">Please wait...</p>
      </div>
    </div>
  );
}
