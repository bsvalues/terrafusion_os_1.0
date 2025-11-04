import React, { useEffect, useState } from "react";
import websocketClient from "@/lib/websocketClient";
import { AlertCircle, Brain, Wifi, WifiOff, Activity, Zap, Refresh  } from '@mui/icons-material';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// WebSocket connection states for AI real-time communication
enum ConnectionState {
  CONNECTING = "connecting",
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
  FALLBACK = "fallback",
}

/**
 * WebSocketManager component
 *
 * Manages WebSocket connection and shows status information
 * Provides manual reconnection capability
 */
const WebSocketManager: React.FC = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    websocketClient.isSocketConnected() ? ConnectionState.CONNECTED : ConnectionState.CONNECTING
  );
  const [attempts, setAttempts] = useState(websocketClient.getReconnectAttempts());
  const [maxAttempts, setMaxAttempts] = useState(websocketClient.getMaxReconnectAttempts());

  useEffect(() => {
    // Subscribe to connection state changes
    const unsubscribe = websocketClient.onConnectionStateChange((connected) => {
      console.log(`[WebSocketManager] Connection state changed: ${connected}`);

      if (connected) {
        setConnectionState(ConnectionState.CONNECTED);
      } else {
        // If max attempts reached, we've switched to fallback mode
        const currentAttempts = websocketClient.getReconnectAttempts();
        setAttempts(currentAttempts);

        if (currentAttempts >= maxAttempts) {
          setConnectionState(ConnectionState.FALLBACK);
        } else {
          setConnectionState(ConnectionState.DISCONNECTED);
        }
      }
    });

    // Connect to WebSocket on component mount
    if (!websocketClient.isSocketConnected()) {
      console.log("[WebSocketManager] Initial connection attempt");
      websocketClient.connect();
    }

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [maxAttempts]);

  // Handle manual reconnection
  const handleReconnect = () => {
    console.log("[WebSocketManager] Manual reconnection initiated");
    websocketClient.disconnect();
    // Reset connection state to connecting
    setConnectionState(ConnectionState.CONNECTING);
    // Reset attempts counter
    setAttempts(0);
    // Reconnect after a brief delay
    setTimeout(() => {
      websocketClient.connect();
    }, 1000);
  };

  // No UI if everything is working normally
  if (connectionState === ConnectionState.CONNECTED) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Alert
        variant={connectionState === ConnectionState.FALLBACK ? "destructive" : "default"}
        className={
          connectionState === ConnectionState.FALLBACK
            ? "border-red-200 bg-red-50"
            : connectionState === ConnectionState.DISCONNECTED
              ? "border-orange-200 bg-orange-50"
              : connectionState === ConnectionState.CONNECTING
                ? "border-primary/20 bg-primary/5"
                : "border-primary/20 bg-primary/5"
        }
      >
        <div className="flex items-center gap-2">
          {connectionState === ConnectionState.CONNECTING && (
            <div className="relative">
              <Brain className="h-5 w-5 text-primary" />
              <Activity className="h-3 w-3 text-primary/80 absolute -top-1 -right-1 animate-pulse" />
            </div>
          )}
          {connectionState === ConnectionState.DISCONNECTED && (
            <div className="relative">
              <Brain className="h-5 w-5 text-orange-500" />
              <WifiOff className="h-3 w-3 text-orange-600 absolute -top-1 -right-1" />
            </div>
          )}
          {connectionState === ConnectionState.FALLBACK && (
            <div className="relative">
              <Brain className="h-5 w-5 text-red-500" />
              <AlertCircle className="h-3 w-3 text-red-600 absolute -top-1 -right-1" />
            </div>
          )}

          <AlertTitle className="font-medium flex items-center gap-1.5">
            {connectionState === ConnectionState.CONNECTING && (
              <><>

                <span className="text-primary">AI Network</span>
                <Badge
</>
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/30 text-[10px]"
                >
                  Connecting
                </Badge>
              </>
            )}
            {connectionState === ConnectionState.DISCONNECTED && (
              <><>

                <span className="text-orange-600">AI Network</span>
                <Badge
</>
                  variant="outline"
                  className="bg-orange-100 text-orange-600 border-orange-200 text-[10px]"
                >
                  Reconnecting
                </Badge>
              </>
            )}
            {connectionState === ConnectionState.FALLBACK && (
              <><>

                <span className="text-red-600">AI Network</span>
                <Badge
</>
                  variant="outline"
                  className="bg-red-100 text-red-600 border-red-200 text-[10px]"
                >
                  Limited
                </Badge>
              </>
            )}
          </AlertTitle>
        </div>

        <AlertDescription>
          {connectionState === ConnectionState.CONNECTING && (
            <div className="mt-2"><>

              <p className="text-sm text-muted-foreground mb-2">
                Establishing AI neural network connection...
              </p>
              <Progress
</>
                value={attempts ? (attempts / maxAttempts) * 100 : 33}
                className="h-1 bg-primary/10"
              />
            </div>
          )}

          {connectionState === ConnectionState.DISCONNECTED && (
            <div className="mt-2"><>

              <p className="text-sm text-muted-foreground mb-2">
                Attempting to restore AI network connection ({attempts}/{maxAttempts})
              </p>
              <Progress
</> value={(attempts / maxAttempts) * 100} className="h-1 bg-orange-100" />
            </div>
          )}

          {connectionState === ConnectionState.FALLBACK && (
            <div className="mt-2"><>

              <p className="text-sm text-muted-foreground mb-2">
                AI features operating in limited mode. Real-time property analytics may be delayed.
              </p>
              <Button
</>
                variant="outline"
                size="sm"
                className="mt-2 border-primary/30 bg-primary/5 text-primary"
                onClick={handleReconnect}
              >
                <Refresh className="h-3 w-3 mr-2" />
                Reconnect AI Network
              </Button>
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default WebSocketManager;
