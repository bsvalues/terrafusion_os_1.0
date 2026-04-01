import React, { useEffect, useState } from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  RefreshCw, 
  Wifi, 
  WifiOff 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { agentWebSocketService } from '@/services/agent-websocket-service';
import type { ConnectionStatus } from '@/hooks/use-agent-websocket';

/**
 * Connection status indicator component
 * 
 * Displays the current status of the agent WebSocket connection
 * and indicates whether it's using fallback mode.
 */
export function ConnectionStatusIndicator() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [usingFallback, setUsingFallback] = useState<boolean>(false);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  
  useEffect(() => {
    // Get initial status
    setStatus(agentWebSocketService.getConnectionStatus());
    setUsingFallback(agentWebSocketService.isUsingFallback());
    
    // Subscribe to status changes
    const unsubscribe = agentWebSocketService.onConnectionStatusChange((newStatus) => {
      setStatus(newStatus);
      setUsingFallback(agentWebSocketService.isUsingFallback());
      
      // Track reconnection attempts
      if (newStatus === 'connecting') {
        setIsReconnecting(true);
      } else if (newStatus === 'connected' || newStatus === 'disconnected') {
        if (isReconnecting) {
          setIsReconnecting(false);
        }
      }
    });
    
    return () => {
      // Clean up subscription
      unsubscribe();
    };
  }, [isReconnecting]);
  
  /**
   * Get status badge variant based on connection status
   */
  const getStatusVariant = () => {
    switch (status) {
      case 'connected':
        return 'default'; // Our badge doesn't have success variant, use default 
      case 'connecting':
        return 'secondary'; // Use secondary for warning state
      case 'disconnected':
        return 'destructive';
      case 'errored':
        return 'destructive';
      default:
        return 'secondary';
    }
  };
  
  /**
   * Get status icon based on connection status
   */
  const getStatusIcon = () => {
    if (isReconnecting) {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
    
    switch (status) {
      case 'connected':
        return usingFallback 
          ? <Info className="h-4 w-4" /> 
          : <CheckCircle2 className="h-4 w-4" />;
      case 'connecting':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4" />;
      case 'errored':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Wifi className="h-4 w-4" />;
    }
  };
  
  /**
   * Get status text based on connection status
   */
  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return usingFallback 
          ? 'Connected (Fallback)' 
          : 'Connected';
      case 'connecting':
        return isReconnecting 
          ? 'Reconnecting...' 
          : 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'errored':
        return 'Connection Error';
      default:
        return 'Unknown';
    }
  };
  
  /**
   * Get detailed status message for tooltip
   */
  const getStatusMessage = () => {
    if (status === 'connected' && usingFallback) {
      return 'Using fallback REST API for agent communication due to WebSocket connection issues. The system remains fully functional but with slightly higher latency.';
    }
    
    switch (status) {
      case 'connected':
        return 'Real-time connection established. Agent communication is operating at full capacity.';
      case 'connecting':
        return isReconnecting 
          ? 'Attempting to reconnect after connection loss...' 
          : 'Establishing initial connection...';
      case 'disconnected':
        return 'Connection to the agent system has been closed. Please refresh the page or check your network.';
      case 'errored':
        return 'An error occurred with the connection. The system will attempt to reconnect automatically.';
      default:
        return 'Connection status unknown.';
    }
  };
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div className="flex items-center space-x-1 cursor-help">
            <Badge variant={getStatusVariant()} className="flex items-center space-x-1 px-2 py-1 h-7">
              {getStatusIcon()}
              <span className="ml-1">{getStatusText()}</span>
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs p-3">
          <p>{getStatusMessage()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}