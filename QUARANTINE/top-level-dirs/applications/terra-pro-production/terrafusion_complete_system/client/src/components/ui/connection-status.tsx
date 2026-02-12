import React from "react";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, Wifi, WifiOff, ArrowUpDown  } from '@mui/icons-material';

/**
 * Connection Status Component
 * Shows the current connection status and type to users
 */
export function ConnectionStatus() {
  const { isConnected, connectionStatus, connectionType, usingFallback, lastPing } = useWebSocket();

  // Calculate time since last ping
  const lastPingAgo = lastPing ? Math.floor((Date.now() - lastPing) / 1000) : null;

  // Determine badge color based on connection status
  let variant: "default" | "secondary" | "destructive" | "outline" = "default";
  let icon = <Wifi className="h-3 w-3 mr-1" />;
  let statusText = "Connected";

  if (!isConnected) {
    variant = "destructive";
    icon = <WifiOff className="h-3 w-3 mr-1" />;
    statusText = connectionStatus === "connecting" ? "Connecting..." : "Disconnected";
  } else if (usingFallback) {
    variant = "secondary";
    icon = <ArrowUpDown className="h-3 w-3 mr-1" />;
    statusText = "Fallback";
  } else if (lastPingAgo && lastPingAgo > 30) {
    variant = "outline";
    icon = <AlertCircle className="h-3 w-3 mr-1" />;
    statusText = "Unstable";
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variant} className="cursor-help flex items-center">
            {icon}
            {statusText}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            <strong>Status:</strong> {connectionStatus}
          </p>
          {connectionType !== "none" && (
            <p>
              <strong>Using:</strong> {connectionType} {usingFallback ? "(fallback)" : ""}
            </p>
          )}
          {lastPing && (
            <p>
              <strong>Last activity:</strong> {lastPingAgo}s ago
            </p>
          )}
          {!isConnected && (
            <p className="text-xs text-muted-foreground mt-1">Attempting to reconnect...</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
