import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { SimplifiedWebSocketManager } from "../lib/simplified-websocket";

// Define the types of notifications our WebSocket might receive
export type NotificationType = "system" | "update" | "alert" | "info";

// Define the shape of a notification
export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: number;
  read: boolean;
  data?: any; // Optional additional data
}

// Define the context shape
interface WebSocketContextType {
  connected: boolean;
  notifications: Notification[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  sendMessage: (message: any) => void;
  connectionMode: "websocket" | "polling" | "disconnected";
  lastMessage: any | null; // Add this to support property analysis results
}

// Create the context with default values
const WebSocketContext = createContext<WebSocketContextType>({
  connected: false,
  notifications: [],
  markAsRead: () => {},
  markAllAsRead: () => {},
  sendMessage: () => {},
  connectionMode: "disconnected",
  lastMessage: null, // Default to null
});

// Define a list of example notifications to show on first load
const initialNotifications: Notification[] = [
  {
    id: "notification-1",
    type: "system",
    message: "System check complete - AI model health: Excellent",
    timestamp: Date.now() - 1000 * 60 * 5, // 5 minutes ago
    read: false,
  },
  {
    id: "notification-2",
    type: "update",
    message: "New Terrafusion update available with enhanced AI features",
    timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
    read: true,
  },
  {
    id: "notification-3",
    type: "alert",
    message: "Property condition analysis complete for 123 Main St",
    timestamp: Date.now() - 1000 * 60 * 60, // 1 hour ago
    read: true,
  },
];

// The provider component
export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State to track connection status and notifications
  const [connected, setConnected] = useState(false);
  const [connectionMode, setConnectionMode] = useState<"websocket" | "polling" | "disconnected">(
    "disconnected"
  );
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [lastMessage, setLastMessage] = useState<any | null>(null);

  // Reference to our WebSocket manager
  const wsManagerRef = useRef<SimplifiedWebSocketManager | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const clientIdRef = useRef<string>(
    `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  );

  // Function to handle messages from the WebSocket
  const handleSocketMessage = useCallback((data: any) => {
    console.log("[WebSocketContext] Received message:", data);

    // Store the last received message
    setLastMessage(data);

    // If it's a notification, add it
    if (data.type === "notification") {
      const newNotification: Notification = {
        id: `notification-${Date.now()}`,
        type: data.notificationType || "info",
        message: data.message,
        timestamp: Date.now(),
        read: false,
        data: data.data,
      };

      setNotifications((prev) => [newNotification, ...prev]);
    }

    // Handle property analysis results
    if (data.type === "property-analysis") {
      console.log("[WebSocketContext] Received property analysis result:", data.data);
    }
  }, []);

  // Function to setup long polling as a fallback
  const setupLongPolling = useCallback(() => {
    console.log(
      "[WebSocketContext] Starting long polling fallback with client ID:",
      clientIdRef.current
    );

    setConnectionMode("polling");
    setConnected(true);

    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Setup polling
    const poll = async () => {
      try {
        const response = await fetch(`/api/poll?clientId=${clientIdRef.current}`);
        if (response.ok) {
          const data = await response.json();

          // If we received notifications, process them
          if (data.messages && Array.isArray(data.messages)) {
            data.messages.forEach((msg: any) => {
              // Store the last message for any message type
              setLastMessage(msg);

              if (msg.type === "notification") {
                const newNotification: Notification = {
                  id: `notification-${Date.now()}-${Math.random()}`,
                  type: msg.notificationType || "info",
                  message: msg.message,
                  timestamp: msg.timestamp || Date.now(),
                  read: false,
                  data: msg.data,
                };
                setNotifications((prev) => [newNotification, ...prev]);
              }

              // Also handle property analysis results in polling mode
              if (msg.type === "property-analysis") {
                console.log(
                  "[WebSocketContext] Received property analysis result via polling:",
                  msg.data
                );
              }
            });
          }
        }
      } catch (error) {
        console.error("[WebSocketContext] Polling error:", error);
      }
    };

    // Poll immediately then set interval
    poll();
    pollingIntervalRef.current = setInterval(poll, 2000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Initialize WebSocket and connections
  useEffect(() => {
    // Create WebSocket manager (only once)
    if (!wsManagerRef.current) {
      wsManagerRef.current = new SimplifiedWebSocketManager("/ws");

      // Add handlers
      wsManagerRef.current.addMessageHandler(handleSocketMessage);
      wsManagerRef.current.addConnectionHandler((status, details) => {
        if (status === "connected") {
          setConnected(true);
          setConnectionMode("websocket");

          // Clear polling if active
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        } else if (status === "disconnected") {
          setConnected(false);
          setConnectionMode("disconnected");

          // If this was a final failure, switch to polling
          if (details && details.finalFailure) {
            setupLongPolling();
          }
        }
      });
    }

    // Connect to WebSocket
    wsManagerRef.current.connect();

    // Cleanup on unmount
    return () => {
      if (wsManagerRef.current) {
        wsManagerRef.current.disconnect();
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [handleSocketMessage, setupLongPolling]);

  // Function to mark a notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  }, []);

  // Function to mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
  }, []);

  // Function to send a message
  const sendMessage = useCallback(
    (message: any) => {
      if (connectionMode === "websocket" && wsManagerRef.current) {
        wsManagerRef.current.send(message);
      } else if (connectionMode === "polling") {
        // For polling mode, we can use fetch to send messages
        fetch("/api/message", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clientId: clientIdRef.current,
            ...message,
          }),
        }).catch((error) => {
          console.error("[WebSocketContext] Error sending message via HTTP:", error);
        });
      } else {
        console.warn("[WebSocketContext] Cannot send message, not connected");
      }
    },
    [connectionMode]
  );

  // Provide the WebSocket context to children
  return (
    <WebSocketContext.Provider
      value={{
        connected,
        notifications,
        markAsRead,
        markAllAsRead,
        sendMessage,
        connectionMode,
        lastMessage, // Add this to the context value
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

// Hook for easy access to WebSocket context
export const useWebSocket = () => useContext(WebSocketContext);
