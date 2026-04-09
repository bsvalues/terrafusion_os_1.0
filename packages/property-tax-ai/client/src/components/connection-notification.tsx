/**
 * Connection Notification Component
 * 
 * This component displays a notification when the application is using 
 * fallback mode (REST API polling) instead of WebSockets.
 */

import { useAgentSocketIO } from "@/hooks/use-agent-socketio";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, WifiOff, RotateCw } from "lucide-react";
import { useState, useEffect } from "react";

export function ConnectionNotification() {
  const { 
    isPolling,
    connect,
    connectionStatus,
    connectionStatuses
  } = useAgentSocketIO();
  
  const [showAlert, setShowAlert] = useState(false);
  
  // Only show the alert after the app has been in polling mode for a bit
  // to avoid showing it during normal initial connection process
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isPolling) {
      timeoutId = setTimeout(() => {
        setShowAlert(true);
      }, 3000);
    } else {
      setShowAlert(false);
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isPolling]);
  
  // Don't show anything if not in polling mode
  if (!showAlert) {
    return null;
  }
  
  return (
    <Alert 
      variant="destructive" 
      className="fixed top-4 left-1/2 transform -translate-x-1/2 max-w-md z-50 bg-white border border-red-200 text-red-800 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300"
    >
      <div className="flex items-start">
        <WifiOff className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <AlertTitle className="text-red-800">
            WebSocket Connection Issue
          </AlertTitle>
          <AlertDescription className="text-red-700">
            <p className="mt-1">
              The system is currently using a fallback connection method. 
              Real-time updates may be delayed.
            </p>
            <div className="flex items-center mt-2 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white border-red-300 hover:bg-red-50 text-red-700 flex items-center gap-1"
                onClick={() => connect()}
                disabled={connectionStatus === connectionStatuses.CONNECTING}
              >
                <RotateCw className="h-3.5 w-3.5" />
                Reconnect
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-red-700 hover:bg-red-50 hover:text-red-800"
                onClick={() => setShowAlert(false)}
              >
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}