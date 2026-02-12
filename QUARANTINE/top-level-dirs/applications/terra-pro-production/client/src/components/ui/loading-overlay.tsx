import React from "react";
import { Loader2  } from '@mui/icons-material';
import { useApp } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";

export interface LoadingOverlayProps {
  // Optional override to show loading even when global state is not loading
  show?: boolean;
  // Optional custom message to display
  message?: string;
  // Additional CSS classes
  className?: string;
  // Whether to show as a full-screen overlay or inline
  fullScreen?: boolean;
}

export function LoadingOverlay({
  show,
  message,
  className,
  fullScreen = false,
}: LoadingOverlayProps) {
  const { state } = useApp();
  const isVisible = show !== undefined ? show : state.isLoading;
  const displayMessage = message || state.loadingMessage || "Loading...";

  if (!isVisible) {
    return null;
  }

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className={cn("flex flex-col items-center gap-2 p-4", className)}>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">{displayMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 p-2", className)}>
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{displayMessage}</p>
    </div>
  );
}
