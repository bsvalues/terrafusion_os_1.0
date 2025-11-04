import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { realtimeService } from "../lib/realtime-service";

// Define context type for TypeScript
type RealtimeContextType = {
  connectionState: string;
  protocol: string;
  connected: boolean;
  connecting: boolean;
  send: (data: any) => boolean;
  sendPropertyAnalysisRequest: (propertyData: any) => boolean;
  connect: () => void;
  disconnect: () => void;
  propertyAnalysisResult: any | null;
  propertyAnalysisLoading: boolean;
  propertyAnalysisError: string | null;
  // Additional methods for WebSocketTestPage
  connectionStatus: string;
  connectionMethod: string;
  isConnected: boolean;
  forceWebSockets: () => void;
  forcePolling: () => void;
  subscribe: (id: string, options: any) => void;
  unsubscribe: (id: string) => void;
  // Event handling methods
  on: (event: string, handler: (data: any) => void) => void;
  off: (event: string, handler: (data: any) => void) => void;
};

// Create the context with default values
const RealtimeContext = createContext<RealtimeContextType>({
  connectionState: "disconnected",
  protocol: "none",
  connected: false,
  connecting: false,
  send: () => false,
  sendPropertyAnalysisRequest: () => false,
  connect: () => {},
  disconnect: () => {},
  propertyAnalysisResult: null,
  propertyAnalysisLoading: false,
  propertyAnalysisError: null,
  // Additional methods for WebSocketTestPage
  connectionStatus: "disconnected",
  connectionMethod: "none",
  isConnected: false,
  forceWebSockets: () => {},
  forcePolling: () => {},
  subscribe: () => {},
  unsubscribe: () => {},
  // Event handlers
  on: () => {},
  off: () => {},
});

// Context provider component
export const RealtimeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [connectionState, setConnectionState] = useState("disconnected");
  const [protocol, setProtocol] = useState("none");
  const [propertyAnalysisResult, setPropertyAnalysisResult] = useState<any | null>(null);
  const [propertyAnalysisLoading, setPropertyAnalysisLoading] = useState(false);
  const [propertyAnalysisError, setPropertyAnalysisError] = useState<string | null>(null);

  // Set up event handlers when component mounts
  useEffect(() => {
    // Handle connection state changes
    const handleConnected = () => {
      setConnectionState("connected");
      setProtocol(realtimeService.getProtocol());
    };

    const handleDisconnected = () => {
      setConnectionState("disconnected");
      setProtocol("none");
    };

    // Handle property analysis response
    const handlePropertyAnalysisResponse = (data: any) => {
      console.log("Received property analysis response:", data);
      setPropertyAnalysisResult(data.data);
      setPropertyAnalysisLoading(false);
    };

    // Handle errors
    const handleError = (data: any) => {
      console.error("Realtime error:", data);
      if (propertyAnalysisLoading) {
        setPropertyAnalysisError(data.error || "An error occurred during analysis");
        setPropertyAnalysisLoading(false);
      }
    };

    // Register event handlers
    realtimeService.on("connected", handleConnected);
    realtimeService.on("disconnected", handleDisconnected);
    realtimeService.on("property_analysis_response", handlePropertyAnalysisResponse);
    realtimeService.on("error", handleError);

    // Initial state
    setConnectionState(realtimeService.getState());
    setProtocol(realtimeService.getProtocol());

    // Try connecting immediately
    realtimeService.connect();

    // Cleanup on unmount
    return () => {
      realtimeService.off("connected", handleConnected);
      realtimeService.off("disconnected", handleDisconnected);
      realtimeService.off("property_analysis_response", handlePropertyAnalysisResponse);
      realtimeService.off("error", handleError);
    };
  }, []);

  // Connect to realtime service
  const connect = () => {
    realtimeService.connect();
  };

  // Disconnect from realtime service
  const disconnect = () => {
    realtimeService.disconnectAll();
  };

  // Send a message
  const send = (data: any): boolean => {
    return realtimeService.send(data);
  };

  // Send property analysis request using REST API instead of WebSockets
  const sendPropertyAnalysisRequest = (propertyData: any): boolean => {
    // Reset state
    setPropertyAnalysisResult(null);
    setPropertyAnalysisError(null);
    setPropertyAnalysisLoading(true);

    console.log("Sending property analysis request for:", propertyData);

    // Use direct API call instead of WebSockets due to connection issues
    fetch("/api/realtime/propertyAnalysis", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(propertyData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("Property analysis response:", data);
        setPropertyAnalysisResult(data);
        setPropertyAnalysisLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching property analysis:", error);
        setPropertyAnalysisError(error.message || "Failed to analyze property");
        setPropertyAnalysisLoading(false);
      });

    // We always return true since we're using fetch instead of WebSockets
    return true;
  };

  // Implement WebSocketTestPage specific functions
  const forceWebSockets = () => {
    // This would normally force the protocol to WebSockets in the real implementation
    console.log("Forcing WebSocket protocol");
    // For now, just try to connect using the regular protocol selection
    realtimeService.connect();
  };

  const forcePolling = () => {
    // This would normally force the protocol to Long Polling in the real implementation
    console.log("Forcing Polling protocol");
    // Disconnect WebSockets first
    realtimeService.disconnectAll();
    // Simulate a delay before reconnecting
    setTimeout(() => {
      realtimeService.connect();
    }, 500);
  };

  // Simple subscription manager (stub implementation)
  const subscriptions = new Map<string, any>();
  const subscribe = (id: string, options: any) => {
    console.log(`Subscribing to: ${id}`, options);
    subscriptions.set(id, options);
    // In a real implementation, this would set up polling or event subscriptions
  };

  const unsubscribe = (id: string) => {
    console.log(`Unsubscribing from: ${id}`);
    subscriptions.delete(id);
    // In a real implementation, this would clean up polling or event subscriptions
  };

  // Event handlers pass-through
  const on = (event: string, handler: (data: any) => void): void => {
    realtimeService.on(event, handler);
  };

  const off = (event: string, handler: (data: any) => void): void => {
    realtimeService.off(event, handler);
  };

  const contextValue = {
    // Original values
    connectionState,
    protocol,
    connected: connectionState === "connected",
    connecting: connectionState === "connecting",
    send,
    sendPropertyAnalysisRequest,
    connect,
    disconnect,
    propertyAnalysisResult,
    propertyAnalysisLoading,
    propertyAnalysisError,

    // WebSocketTestPage specific values
    connectionStatus: connectionState,
    connectionMethod: protocol,
    isConnected: connectionState === "connected",
    forceWebSockets,
    forcePolling,
    subscribe,
    unsubscribe,

    // Event handling
    on,
    off,
  };

  return <RealtimeContext.Provider value={contextValue}>{children}</RealtimeContext.Provider>;
};

// Custom hook for consuming the context
export const useRealtime = () => useContext(RealtimeContext);
