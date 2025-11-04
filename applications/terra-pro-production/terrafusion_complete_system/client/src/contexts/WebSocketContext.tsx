import React, { createContext, useContext, useEffect, useState } from "react";
import { websocketManager } from "@/lib/websocket-manager";
import { startLongPolling, stopLongPolling, sendViaHttp } from "@/lib/polling-fallback";
import { useToast } from "@/hooks/use-toast";

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

interface WebSocketContextType {
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  connectionError: string | null;
  reconnectAttempts: number;
  connectionType: "websocket" | "long-polling" | "none";
  usingFallback: boolean;
  connect: () => void;
  disconnect: () => void;
  send: (data: any) => boolean;
  lastPing: number | null;
}

const WebSocketContext = createContext<WebSocketContextType>({
  connectionStatus: "disconnected",
  isConnected: false,
  connectionError: null,
  reconnectAttempts: 0,
  connectionType: "none",
  usingFallback: false,
  connect: () => {},
  disconnect: () => {},
  send: () => false,
  lastPing: null,
});

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastPing, setLastPing] = useState<number | null>(null);
  const [connectionType, setConnectionType] = useState<"websocket" | "long-polling" | "none">(
    "none"
  );
  const [usingFallback, setUsingFallback] = useState(false);
  const { toast } = useToast();

  // Derived state
  const isConnected = connectionStatus === "connected";

  useEffect(() => {
    // Handle connection state changes
    const handleConnection = (data: {
      status: string;
      message?: string;
      code?: number;
      protocol?: string;
      isFallback?: boolean;
    }) => {
      setConnectionStatus(data.status as ConnectionStatus);

      // Update connection type if provided
      if (data.protocol) {
        const connType =
          data.protocol === "websocket"
            ? "websocket"
            : data.protocol === "long-polling"
              ? "long-polling"
              : "none";
        setConnectionType(connType);

        // Update fallback state
        setUsingFallback(!!data.isFallback);
      }

      if (data.status === "connecting") {
        setConnectionError(null);
      } else if (data.status === "connected") {
        // Reset error state and reconnect attempts on successful connection
        setConnectionError(null);
        setReconnectAttempts(0);
        setLastPing(Date.now());

        // Update connection type based on protocol
        if (!data.protocol) {
          setConnectionType("websocket"); // Default if not specified
          setUsingFallback(false);
        }

        // Toast notification only if reconnecting (not on initial connection)
        if (reconnectAttempts > 0) {
          const connMethod = data.isFallback ? "Long-polling fallback" : "WebSocket";
          toast({
            title: "Connection Restored",
            description: `${connMethod} connection has been established`,
            variant: "default",
          });
        }
      } else if (data.status === "error") {
        setConnectionError(data.message || "Unknown connection error");

        toast({
          title: "Connection Error",
          description: data.message || "Connection error occurred",
          variant: "destructive",
        });
      } else if (data.status === "disconnected") {
        if (data.code && data.code !== 1000) {
          // Not a normal closure
          toast({
            title: "Connection Lost",
            description: "Connection to server was lost. Attempting to reconnect...",
            variant: "destructive",
          });
        }
      }
    };

    // Handle error events
    const handleError = (error: any) => {
      if (error.type === "connection_error") {
        setConnectionError(`Connection error: ${error.message || "Unknown error"}`);
      } else if (error.type === "send_error") {
        setConnectionError(`Failed to send message: ${error.message || "Unknown error"}`);
      }
    };

    // Register event listeners
    websocketManager.on("connection", handleConnection);
    websocketManager.on("error", handleError);

    // Set up ping mechanism to detect connection health
    const pingInterval = window.setInterval(() => {
      if (connectionStatus === "connected") {
        websocketManager.send({ type: "ping", timestamp: Date.now() });
        setLastPing(Date.now());
      }
    }, 30000);

    // Listen for pong responses
    const handlePong = (data: any) => {
      if (data.type === "pong") {
        setLastPing(Date.now());
      }
    };
    websocketManager.on("pong", handlePong);

    // Listen for heartbeat responses
    const handleHeartbeat = (data: any) => {
      if (data.type === "heartbeat" && data.action === "pong") {
        setLastPing(Date.now());
      }
    };
    websocketManager.on("heartbeat", handleHeartbeat);

    // Connect on mount
    websocketManager.connect();

    // Cleanup function
    return () => {
      websocketManager.off("connection", handleConnection);
      websocketManager.off("error", handleError);
      websocketManager.off("pong", handlePong);
      websocketManager.off("heartbeat", handleHeartbeat);
      clearInterval(pingInterval);

      // Don't disconnect here as other components might still need the connection
      // The websocketManager will handle cleanup on page unload
    };
  }, [toast, reconnectAttempts]);

  // Update reconnect attempts when websocketManager's reconnect attempts change
  useEffect(() => {
    const handleReconnectAttempt = () => {
      setReconnectAttempts((prev) => prev + 1);
    };

    // Handle WebSocket connection failure by switching to polling
    const handleConnectionFailed = (data: any) => {
      console.log("[WebSocketContext] WebSocket connection failed, switching to polling fallback");

      // Update connection type and fallback status
      setConnectionType("long-polling");
      setUsingFallback(true);

      toast({
        title: "Switching Connection Method",
        description:
          "WebSocket connection failed. Using HTTP long-polling fallback to stay connected.",
        variant: "default",
      });

      // Start long polling as a fallback
      const { clientId } = websocketManager.getConfig();

      // Create handlers for the polling system
      const handlePollingMessage = (message: any) => {
        // Process the message based on its type
        if (message.type === "pong" || message.type === "heartbeat") {
          setLastPing(Date.now());
        }
        // Route the message through the WebSocket manager's event system
        websocketManager.handleMessage(message);
      };

      const handlePollingConnection = (
        state: "connected" | "disconnected" | "error",
        reason?: string
      ) => {
        // Update connection status based on polling state
        setConnectionStatus(state);
        if (state === "connected") {
          setConnectionError(null);
        } else if (state === "error") {
          setConnectionError(reason || "Polling connection error");
        }
      };

      // Start the long polling with the appropriate client ID
      const generatedClientId =
        clientId || `client_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      console.log(
        `[WebSocketContext] Starting long polling fallback with client ID: ${generatedClientId}`
      );

      startLongPolling(
        `/api/poll`,
        generatedClientId,
        handlePollingMessage,
        handlePollingConnection
      );
    };

    websocketManager.on("reconnect_attempt", handleReconnectAttempt);
    websocketManager.on("connection_failed", handleConnectionFailed);

    return () => {
      websocketManager.off("reconnect_attempt", handleReconnectAttempt);
      websocketManager.off("connection_failed", handleConnectionFailed);
    };
  }, [toast]);

  return (
    <WebSocketContext.Provider
      value={{
        connectionStatus,
        isConnected,
        connectionError,
        reconnectAttempts,
        connectionType,
        usingFallback,
        connect: () => {
          toast({
            title: "Connecting",
            description: "Attempting to establish connection...",
          });
          websocketManager.connect();
        },
        disconnect: () => {
          websocketManager.disconnect();
          stopLongPolling(); // Also stop polling fallback

          // Reset connection type and fallback state
          setConnectionType("none");
          setUsingFallback(false);

          toast({
            title: "Disconnected",
            description: "WebSocket connection closed",
          });
        },
        send: (data) => {
          // Try WebSocket first, fall back to HTTP if not available
          const sentViaWebSocket = websocketManager.send(data);

          // If WebSocket send fails, try HTTP
          if (!sentViaWebSocket) {
            console.log("[WebSocketContext] Sending via HTTP fallback");
            const success = sendViaHttp(data);
            if (!success) {
              console.error("[WebSocketContext] Failed to send via HTTP fallback");
            }
          }

          // Return if initial send was successful
          return sentViaWebSocket;
        },
        lastPing,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => useContext(WebSocketContext);
