/**
 * useWebSocket Hook
 *
 * A React hook that provides WebSocket functionality to React components.
 * It manages connection state, reconnection, and message handling.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  WebSocketConnectionManager,
  WebSocketOptions,
  ConnectionState,
  WebSocketMessage,
} from '../services/websocket-connection-manager';
import { logger } from '../utils/logger';

// Re-export types for external use
export { ConnectionState } from '../services/websocket-connection-manager';

// Minimal interface for WebSocket message
interface WebSocketMessageEvent {
  type: string;
  [key: string]: any;
}

// Return type for useWebSocket hook
interface UseWebSocketReturn {
  // Connection state
  connectionState: ConnectionState;

  // Last received message
  lastMessage: WebSocketMessageEvent | null;

  // Send a message to the server
  sendMessage: (message: WebSocketMessage | string) => boolean;

  // Manually connect to the server
  connect: () => void;

  // Manually disconnect from the server
  disconnect: () => void;

  // Manually reconnect to the server
  reconnect: () => void;

  // Get connection status and statistics
  getStatus: () => {
    state: ConnectionState;
    stats: {
      messagesReceived: number;
      messagesSent: number;
      reconnects: number;
      errors: number;
      lastLatency: number | null;
      averageLatency: number | null;
    };
    clientId: string | null;
  };
}

/**
 * React hook for WebSocket functionality
 * @param url WebSocket URL (optional, defaults to auto-detection)
 * @param options WebSocket connection options
 * @param autoConnect Whether to automatically connect on mount (default: true)
 * @param onMessage Message handler function
 * @param dependencies Dependencies for the onMessage callback
 * @returns WebSocket interface
 */
export function useWebSocket(
  url?: string,
  options: Partial<WebSocketOptions> = {},
  autoConnect: boolean = true,
  onMessage?: (message: WebSocketMessageEvent) => void,
  dependencies: any[] = []
): UseWebSocketReturn {
  // State for connection status and last message
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.DISCONNECTED
  );
  const [lastMessage, setLastMessage] = useState<WebSocketMessageEvent | null>(null);

  // Use ref for WebSocketConnectionManager to persist across renders
  const managerRef = useRef<WebSocketConnectionManager | null>(null);

  // Memoize message handler
  const handleMessage = useCallback(
    (message: WebSocketMessageEvent) => {
      // Update last message
      setLastMessage(message);

      // Call user-provided handler if available
      if (onMessage) {
        onMessage(message);
      }
    },
    [onMessage, ...dependencies]
  );

  // Initialize WebSocketConnectionManager
  useEffect(() => {
    // Create options with URL if provided
    const fullOptions: WebSocketOptions = {
      ...options,
      ...(url ? { url } : {}),
    };

    // Create WebSocketConnectionManager instance
    const manager = new WebSocketConnectionManager(fullOptions);
    managerRef.current = manager;

    // Set up event handlers
    manager.onAnyMessage(handleMessage);

    manager.onStateChange(state => {
      setConnectionState(state);

      // Log state changes
      switch (state) {
        case ConnectionState.CONNECTED:
          logger.info('WebSocket connected');
          break;
        case ConnectionState.DISCONNECTED:
          logger.info('WebSocket disconnected');
          break;
        case ConnectionState.RECONNECTING:
          logger.info('WebSocket reconnecting...');
          break;
        case ConnectionState.ERROR:
          logger.warn('WebSocket error');
          break;
        default:
          logger.debug(`WebSocket state changed: ${state}`);
      }
    });

    manager.onError((error, context) => {
      logger.error(`WebSocket error (${context || 'unknown'})`, error);
    });

    // Connect if autoConnect is true
    if (autoConnect) {
      manager.connect();
    }

    // Clean up on unmount
    return () => {
      manager.disconnect();
    };
  }, [url, JSON.stringify(options), autoConnect, handleMessage]);

  // Send message function
  const sendMessage = useCallback((message: WebSocketMessage | string): boolean => {
    if (!managerRef.current) {
      logger.warn('Cannot send message: WebSocketConnectionManager not initialized');
      return false;
    }

    return managerRef.current.send(message);
  }, []);

  // Connect function
  const connect = useCallback(() => {
    if (!managerRef.current) {
      logger.warn('Cannot connect: WebSocketConnectionManager not initialized');
      return;
    }

    managerRef.current.connect();
  }, []);

  // Disconnect function
  const disconnect = useCallback(() => {
    if (!managerRef.current) {
      logger.warn('Cannot disconnect: WebSocketConnectionManager not initialized');
      return;
    }

    managerRef.current.disconnect();
  }, []);

  // Reconnect function
  const reconnect = useCallback(() => {
    if (!managerRef.current) {
      logger.warn('Cannot reconnect: WebSocketConnectionManager not initialized');
      return;
    }

    managerRef.current.reconnect();
  }, []);

  // Get status function
  const getStatus = useCallback(() => {
    if (!managerRef.current) {
      return {
        state: ConnectionState.DISCONNECTED,
        stats: {
          messagesReceived: 0,
          messagesSent: 0,
          reconnects: 0,
          errors: 0,
          lastLatency: null,
          averageLatency: null,
        },
        clientId: null,
      };
    }

    return {
      state: managerRef.current.getState(),
      stats: managerRef.current.getStats(),
      clientId: managerRef.current.getClientId(),
    };
  }, []);

  return {
    connectionState,
    lastMessage,
    sendMessage,
    connect,
    disconnect,
    reconnect,
    getStatus,
  };
}

/**
 * React component for WebSocket provider
 */
export function WebSocketProvider({
  children,
  url,
  options = {},
}: {
  children: React.ReactNode;
  url?: string;
  options?: Partial<WebSocketOptions>;
}) {
  const [isConnected, setIsConnected] = useState(false);
  const managerRef = useRef<WebSocketConnectionManager | null>(null);

  useEffect(() => {
    // Create WebSocketConnectionManager instance
    const fullOptions: WebSocketOptions = {
      ...options,
      ...(url ? { url } : {}),
    };

    const manager = new WebSocketConnectionManager(fullOptions);
    managerRef.current = manager;

    // Set up event handlers
    manager.onStateChange(state => {
      setIsConnected(state === ConnectionState.CONNECTED);
    });

    // Connect
    manager.connect();

    // Clean up on unmount
    return () => {
      manager.disconnect();
    };
  }, [url, JSON.stringify(options)]);

  return <div data-websocket-connected={isConnected}>{children}</div>;
}
