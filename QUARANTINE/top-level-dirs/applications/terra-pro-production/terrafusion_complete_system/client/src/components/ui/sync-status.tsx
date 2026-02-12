import React from "react";
import { Check, Cloud, CloudOff, Refresh, Warning  } from '@mui/icons-material';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

export type SyncState = "synced" | "syncing" | "offline" | "error" | "pending";

interface SyncStatusProps {
  /**
   * Current sync state
   */
  state: SyncState;

  /**
   * Last synced timestamp (optional)
   */
  lastSynced?: Date | string | null;

  /**
   * Error message if state is 'error'
   */
  errorMessage?: string;

  /**
   * Additional classes to apply
   */
  className?: string;

  /**
   * Whether to show the timestamp
   */
  showTimestamp?: boolean;

  /**
   * Callback for retry action (when in error state)
   */
  onRetry?: () => void;

  /**
   * Show in compact mode (icon only)
   */
  compact?: boolean;
}

/**
 * SyncStatus component for displaying synchronization state
 */
export function SyncStatus({
  state,
  lastSynced,
  errorMessage = "Sync failed",
  className = "",
  showTimestamp = true,
  onRetry,
  compact = false,
}: SyncStatusProps) {
  // Format the timestamp
  const formattedTime = React.useMemo(() => {
    if (!lastSynced) return "";

    const date = typeof lastSynced === "string" ? new Date(lastSynced) : lastSynced;

    // If within the last day, show relative time
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    // For older dates, show a formatted date
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [lastSynced]);

  // Icon and colors based on state
  const { icon, bgColor, dotColor, textColor, label } = React.useMemo(() => {
    switch (state) {
      case "synced":
        return {
          icon: <Check className="h-3.5 w-3.5" />,
          bgColor: "bg-green-100",
          dotColor: "bg-green-500",
          textColor: "text-green-700",
          label: "Synced",
        };
      case "syncing":
        return {
          icon: <Refresh className="h-3.5 w-3.5 animate-spin" />,
          bgColor: "bg-blue-100",
          dotColor: "bg-blue-500",
          textColor: "text-blue-700",
          label: "Syncing",
        };
      case "offline":
        return {
          icon: <CloudOff className="h-3.5 w-3.5" />,
          bgColor: "bg-amber-100",
          dotColor: "bg-amber-500",
          textColor: "text-amber-700",
          label: "Offline",
        };
      case "error":
        return {
          icon: <Warning className="h-3.5 w-3.5" />,
          bgColor: "bg-red-100",
          dotColor: "bg-red-500",
          textColor: "text-red-700",
          label: "Sync Error",
        };
      case "pending":
        return {
          icon: <Cloud className="h-3.5 w-3.5" />,
          bgColor: "bg-gray-100",
          dotColor: "bg-gray-500",
          textColor: "text-gray-700",
          label: "Pending Sync",
        };
      default:
        return {
          icon: <Cloud className="h-3.5 w-3.5" />,
          bgColor: "bg-gray-100",
          dotColor: "bg-gray-500",
          textColor: "text-gray-700",
          label: "Unknown",
        };
    }
  }, [state]);

  // Handle retry click
  const handleRetryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRetry && state === "error") {
      onRetry();
    }
  };

  // Compact version (icon only with tooltip)
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`inline-flex items-center justify-center ${bgColor} ${textColor} rounded-full p-1 ${className} ${state === "error" && onRetry ? "cursor-pointer" : ""}`}
              onClick={handleRetryClick}
            >
              {icon}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="text-xs">
              <p className="font-medium">{label}</p>
              {state === "synced" && showTimestamp && lastSynced && (
                <p className="opacity-80">Last synced: {formattedTime}</p>
              )}
              {state === "error" && errorMessage && <p className="opacity-80">{errorMessage}</p>}
              {state === "error" && onRetry && (
                <p className="mt-1 text-xs opacity-80">Click to retry</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full version with text
  return (
    <div
      className={`inline-flex items-center gap-2 ${className} ${state === "error" && onRetry ? "cursor-pointer" : ""}`}
      onClick={handleRetryClick}
    ><>

      <div
        className={`flex items-center justify-center ${bgColor} ${textColor} rounded-full p-1 w-5 h-5`}
      >
        {icon}
      </div>
      <div
</> className="flex items-center gap-1.5 text-sm">
        <span className={textColor}>{label}</span>
        {state === "synced" && showTimestamp && lastSynced && (
          <span className="text-muted-foreground text-xs">{formattedTime}</span>
        )}
        {state === "error" && onRetry && (
          <span className="text-xs underline hover:no-underline">Retry</span>
        )}
      </div>
    </div>
  );
}
