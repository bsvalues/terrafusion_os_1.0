import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ConnectionManager,
  ConnectionOptions,
  ConnectionState,
  ConnectionType,
  ConnectionEvent,
  MessageData,
} from '../services/connection-manager';

export { ConnectionState, ConnectionType };

export type ConnectionHookOptions = ConnectionOptions & {
  onConnect?: (event: ConnectionEvent) => void;
  onDisconnect?: (event: ConnectionEvent) => void;
  onMessage?: (event: ConnectionEvent) => void;
  onError?: (event: ConnectionEvent) => void;
  onStateChange?: (event: ConnectionEvent) => void;
};

export type ConnectionHookResult = {
  connectionState: ConnectionState;
  connectionType: ConnectionType | null;
  clientId: string;
  send: (message: MessageData) => void;
  connect: () => void;
  disconnect: () => void;
  connectionInfo: object;
};

/**
 * React hook for managing real-time connections with fallbacks
 */
export function useConnection(options: ConnectionHookOptions = {}): ConnectionHookResult {
  // Extract callback handlers
  const { onConnect, onDisconnect, onMessage, onError, onStateChange, ...connectionOptions } =
    options;

  // Connection manager reference
  const connectionManagerRef = useRef<ConnectionManager | null>(null);

  // State
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.DISCONNECTED
  );
  const [connectionType, setConnectionType] = useState<ConnectionType | null>(null);
  const [clientId, setClientId] = useState<string>('');

  // Create the connection manager on mount
  useEffect(() => {
    const manager = new ConnectionManager(connectionOptions);
    connectionManagerRef.current = manager;

    // Store client ID
    setClientId(manager.getClientId());

    // Register event handlers
    manager.on('connect', event => {
      setConnectionState(ConnectionState.CONNECTED);
      setConnectionType(event.connectionType);
      if (onConnect) onConnect(event);
    });

    manager.on('disconnect', event => {
      setConnectionState(ConnectionState.DISCONNECTED);
      setConnectionType(null);
      if (onDisconnect) onDisconnect(event);
    });

    manager.on('message', event => {
      if (onMessage) onMessage(event);
    });

    manager.on('error', event => {
      if (event.error) console.error(event.error);
      if (onError) onError(event);
    });

    manager.on('statechange', event => {
      if (event.state) setConnectionState(event.state as ConnectionState);
      if (onStateChange) onStateChange(event);
    });

    manager.on('reconnecting', event => {
      setConnectionState(ConnectionState.RECONNECTING);
    });

    // Update initial state
    setConnectionState(manager.getState());
    setConnectionType(manager.getConnectionType());

    // Clean up on unmount
    return () => {
      if (connectionManagerRef.current) {
        connectionManagerRef.current.disconnect();
        connectionManagerRef.current = null;
      }
    };
  }, []); // Empty dependency array = only on mount

  // Send message
  const send = useCallback((message: MessageData) => {
    if (connectionManagerRef.current) {
      connectionManagerRef.current.send(message);
    } else {
      console.error('Connection manager not initialized');
    }
  }, []);

  // Connect
  const connect = useCallback(() => {
    if (connectionManagerRef.current) {
      connectionManagerRef.current.connect();
    } else {
      console.error('Connection manager not initialized');
    }
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    if (connectionManagerRef.current) {
      connectionManagerRef.current.disconnect();
    } else {
      console.error('Connection manager not initialized');
    }
  }, []);

  // Get connection info (for debugging)
  const connectionInfo = useCallback(() => {
    if (connectionManagerRef.current) {
      return connectionManagerRef.current.getConnectionInfo();
    } else {
      return { error: 'Connection manager not initialized' };
    }
  }, []);

  // Return the hook result
  return {
    connectionState,
    connectionType,
    clientId,
    send,
    connect,
    disconnect,
    connectionInfo,
  };
}
