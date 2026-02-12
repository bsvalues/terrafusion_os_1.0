import React, { createContext, useContext, useEffect, useCallback, useState, useRef } from "react";

// Define message types
type MessageType = "connection_established" | "echo" | "heartbeat" | "notification" | "error";

// Define the shape of a message
interface WebSocketMessage {
  type: MessageType;
  message?: string;
  timestamp: number;
  clientId?: string;
  [key: string]: any; // Allow additional properties
}

// Define the context shape
interface BasicWebSocketContextType {
  connected: boolean;
  messages: WebSocketMessage[];
  sendMessage: (data: any) => void;
  lastMessage: WebSocketMessage | null;
  usingFallback: boolean;
}

// Create the context with default values
const BasicWebSocketContext = createContext<BasicWebSocketContextType>({
  connected: false,
  messages: [],
  sendMessage: () => {},
  lastMessage: null,
  usingFallback: false,
});

// Provider component
export const BasicWebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  // References
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const clientIdRef = useRef<string>(
    `client_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
  );
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxReconnectAttempts = 3;

  // Function to handle incoming messages (from WebSocket or polling)
  const handleMessage = useCallback((data: WebSocketMessage) => {
    console.log("[BasicWebSocket] Received:", data);

    // Add the message to our history
    setMessages((prev) => [data, ...prev].slice(0, 50)); // Keep last 50 messages
    setLastMessage(data);
  }, []);

  // Start long-polling as fallback
  const startPolling = useCallback(() => {
    console.log("[BasicWebSocket] Starting long-polling fallback");
    setUsingFallback(true);

    // Clear any existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    // Start polling
    pollIntervalRef.current = setInterval(() => {
      fetch(`/api/poll?clientId=${clientIdRef.current}`)
        .then((response) => response.json())
        .then((data) => {
          if (!connected) setConnected(true);

          if (data.messages && Array.isArray(data.messages)) {
            data.messages.forEach((msg: WebSocketMessage) => {
              handleMessage(msg);
            });
          }
        })
        .catch((err) => {
          console.error("[BasicWebSocket] Polling error:", err);
          // Don't set disconnected on individual poll failures
        });
    }, 2000);

    // Mark as connected since polling is working
    setConnected(true);
  }, [connected, handleMessage]);

  // Function to establish WebSocket connection
  const connect = useCallback(() => {
    // Close existing connection
    if (socketRef.current) {
      socketRef.current.close();
    }

    try {
      // Determine WebSocket URL
      let host = window.location.host;
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

      // Special handling for Replit environments
      if (host.includes("replit")) {
        console.log(`[BasicWebSocket] Replit environment detected: ${host}`);
      } else if (window.location.port) {
        host = window.location.hostname + ":" + window.location.port;
      } else {
        host = window.location.hostname;
      }

      // Construct URL with host
      const wsUrl = `${protocol}//${host}/basic-ws`;

      // Add a timestamp and random token to avoid caching issues
      const token = Math.random().toString(36).substring(2, 15);
      const timestampedUrl = `${wsUrl}?t=${Date.now()}&token=${token}&clientId=${clientIdRef.current}`;

      console.log(`[BasicWebSocket] Connecting to ${timestampedUrl}`);

      // Create WebSocket connection
      socketRef.current = new WebSocket(timestampedUrl);

      // Set up event handlers
      socketRef.current.onopen = () => {
        console.log("[BasicWebSocket] WebSocket connected!");
        setConnected(true);
        setUsingFallback(false);
        reconnectCountRef.current = 0;

        // Stop polling if it was active
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      };

      socketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketMessage;
          handleMessage(data);
        } catch (err) {
          console.error("[BasicWebSocket] Error parsing message:", err);
        }
      };

      socketRef.current.onclose = () => {
        console.log("[BasicWebSocket] WebSocket closed");
        setConnected(false);

        // Attempt to reconnect or fall back to polling
        reconnectCountRef.current++;

        if (reconnectCountRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectCountRef.current - 1), 30000);
          console.log(
            `[BasicWebSocket] Reconnecting in ${delay}ms... (Attempt ${reconnectCountRef.current}/${maxReconnectAttempts})`
          );

          setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.log(
            "[BasicWebSocket] Max reconnect attempts reached, switching to polling fallback"
          );
          startPolling();
        }
      };

      socketRef.current.onerror = (error) => {
        console.error("[BasicWebSocket] WebSocket error:", error);
        // The onclose handler will be called after this
      };
    } catch (err) {
      console.error("[BasicWebSocket] Connection setup error:", err);
      startPolling();
    }
  }, [handleMessage, startPolling]);

  // Function to send a message
  const sendMessage = useCallback(
    (data: any) => {
      // Prepare message with client ID
      const message = {
        ...data,
        clientId: clientIdRef.current,
        timestamp: Date.now(),
      };

      // Try WebSocket first if available
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        try {
          socketRef.current.send(JSON.stringify(message));
          return; // Success, we're done
        } catch (err) {
          console.error("[BasicWebSocket] Error sending WebSocket message:", err);
          // Fall through to HTTP fallback
        }
      }

      // HTTP fallback if WebSocket is not available or failed
      if (usingFallback) {
        fetch("/api/message", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(message),
        })
          .then((response) => response.json())
          .then((data) => {
            console.log("[BasicWebSocket] Message sent via HTTP:", data);
          })
          .catch((err) => {
            console.error("[BasicWebSocket] Error sending message via HTTP:", err);
          });
      } else {
        console.warn("[BasicWebSocket] Cannot send message, not connected");
      }
    },
    [usingFallback]
  );

  // Connect on mount
  useEffect(() => {
    // Try WebSocket first
    connect();

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [connect]);

  // Provide the context
  return (
    <BasicWebSocketContext.Provider
      value={{
        connected,
        messages,
        sendMessage,
        lastMessage,
        usingFallback,
      }}
    >
      {children}
    </BasicWebSocketContext.Provider>
  );
};

// Custom hook for using the WebSocket context
export const useBasicWebSocket = () => useContext(BasicWebSocketContext);
