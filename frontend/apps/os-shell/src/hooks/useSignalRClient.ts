/**
 * useSignalRClient Hook
 *
 * React hook for easy SignalR integration in components.
 * Manages connection lifecycle and provides event subscription utilities.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 1.0.0 - Phase 1 Foundation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { SignalRClient, HubConnectionState } from '@/services/signalRClient';

export interface UseSignalRClientOptions {
  hubUrl: string;
  accessToken?: string;
  autoConnect?: boolean;
  automaticReconnect?: boolean;
  onConnected?: () => void;
  onDisconnected?: (error?: Error) => void;
  onReconnecting?: (error?: Error) => void;
  onReconnected?: (connectionId?: string) => void;
}

export interface UseSignalRClientReturn {
  client: SignalRClient | null;
  connectionState: HubConnectionState;
  isConnected: boolean;
  connectionId: string | null;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  on: (eventName: string, handler: (...args: any[]) => void) => void;
  off: (eventName: string, handler?: (...args: any[]) => void) => void;
  invoke: <T = any>(methodName: string, ...args: any[]) => Promise<T>;
  send: (methodName: string, ...args: any[]) => Promise<void>;
}

/**
 * React hook for SignalR client management
 *
 * Example usage:
 * ```tsx
 * const { isConnected, on, invoke } = useSignalRClient({
 *   hubUrl: 'http://localhost:3004/hubs/consciousness',
 *   autoConnect: true
 * });
 *
 * useEffect(() => {
 *   if (isConnected) {
 *     on('AgentUpdate', (data) => {
 *       console.log('Received agent update:', data);
 *     });
 *   }
 * }, [isConnected]);
 * ```
 */
export function useSignalRClient(options: UseSignalRClientOptions): UseSignalRClientReturn {
  const {
    hubUrl,
    accessToken,
    autoConnect = true,
    automaticReconnect = true,
    onConnected,
    onDisconnected,
    onReconnecting,
    onReconnected
  } = options;

  const [client, setClient] = useState<SignalRClient | null>(null);
  const [connectionState, setConnectionState] = useState<HubConnectionState>('Disconnected');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const clientRef = useRef<SignalRClient | null>(null);
  const eventHandlersRef = useRef<Map<string, Set<(...args: any[]) => void>>>(new Map());

  // Initialize client
  useEffect(() => {
    const newClient = new SignalRClient({
      hubUrl,
      accessToken,
      automaticReconnect,
      onConnected: () => {
        setConnectionState('Connected');
        setIsConnected(true);
        setConnectionId(clientRef.current?.connectionId || null);
        setError(null);
        onConnected?.();
      },
      onDisconnected: (err) => {
        setConnectionState('Disconnected');
        setIsConnected(false);
        setConnectionId(null);
        if (err) {
          setError(err);
        }
        onDisconnected?.(err);
      },
      onReconnecting: (err) => {
        setConnectionState('Reconnecting');
        setIsConnected(false);
        if (err) {
          setError(err);
        }
        onReconnecting?.(err);
      },
      onReconnected: (connId) => {
        setConnectionState('Connected');
        setIsConnected(true);
        setConnectionId(connId || null);
        setError(null);
        onReconnected?.(connId);
      }
    });

    clientRef.current = newClient;
    setClient(newClient);

    return () => {
      // Cleanup on unmount
      if (clientRef.current) {
        clientRef.current.disconnect().catch(console.error);
        clientRef.current = null;
      }
      eventHandlersRef.current.clear();
    };
  }, [hubUrl, accessToken, automaticReconnect]);

  // Auto-connect if enabled
  useEffect(() => {
    if (autoConnect && client && !isConnected) {
      connect().catch(console.error);
    }
  }, [autoConnect, client]);

  /**
   * Manually connect to hub
   */
  const connect = useCallback(async () => {
    if (!clientRef.current) {
      throw new Error('Client not initialized');
    }

    if (isConnected) {
      console.warn('Already connected');
      return;
    }

    try {
      setConnectionState('Connecting');
      setError(null);
      await clientRef.current.connect();
    } catch (err: any) {
      console.error('Connection error:', err);
      setError(err);
      setConnectionState('Disconnected');
      throw err;
    }
  }, [isConnected]);

  /**
   * Manually disconnect from hub
   */
  const disconnect = useCallback(async () => {
    if (!clientRef.current) {
      return;
    }

    try {
      await clientRef.current.disconnect();
      setConnectionState('Disconnected');
      setIsConnected(false);
      setConnectionId(null);
    } catch (err: any) {
      console.error('Disconnect error:', err);
      setError(err);
      throw err;
    }
  }, []);

  /**
   * Subscribe to hub event
   */
  const on = useCallback((eventName: string, handler: (...args: any[]) => void) => {
    if (!clientRef.current) {
      console.warn('Cannot subscribe: client not initialized');
      return;
    }

    // Track handler for cleanup
    if (!eventHandlersRef.current.has(eventName)) {
      eventHandlersRef.current.set(eventName, new Set());
    }
    eventHandlersRef.current.get(eventName)!.add(handler);

    // Subscribe to event
    clientRef.current.on(eventName, handler);
  }, []);

  /**
   * Unsubscribe from hub event
   */
  const off = useCallback((eventName: string, handler?: (...args: any[]) => void) => {
    if (!clientRef.current) {
      return;
    }

    if (handler) {
      // Remove specific handler
      clientRef.current.off(eventName, handler);
      eventHandlersRef.current.get(eventName)?.delete(handler);
    } else {
      // Remove all handlers
      clientRef.current.off(eventName);
      eventHandlersRef.current.delete(eventName);
    }
  }, []);

  /**
   * Invoke hub method and await response
   */
  const invoke = useCallback(async <T = any,>(methodName: string, ...args: any[]): Promise<T> => {
    if (!clientRef.current) {
      throw new Error('Client not initialized');
    }

    if (!isConnected) {
      throw new Error('Not connected to hub');
    }

    return await clientRef.current.invoke<T>(methodName, ...args);
  }, [isConnected]);

  /**
   * Send message to hub (fire-and-forget)
   */
  const send = useCallback(async (methodName: string, ...args: any[]): Promise<void> => {
    if (!clientRef.current) {
      throw new Error('Client not initialized');
    }

    if (!isConnected) {
      throw new Error('Not connected to hub');
    }

    await clientRef.current.send(methodName, ...args);
  }, [isConnected]);

  return {
    client,
    connectionState,
    isConnected,
    connectionId,
    error,
    connect,
    disconnect,
    on,
    off,
    invoke,
    send
  };
}

export default useSignalRClient;
