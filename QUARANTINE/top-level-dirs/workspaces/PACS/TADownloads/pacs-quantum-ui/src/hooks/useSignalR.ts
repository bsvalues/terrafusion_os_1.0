/**
 * SignalR Hook for Real-time Communication
 */

import { useEffect, useState, useRef } from 'react';
import * as signalR from '@microsoft/signalr';

interface UseSignalROptions {
  url: string;
  autoStart?: boolean;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
}

export const useSignalR = (
  url: string,
  options: Omit<UseSignalROptions, 'url'> = {}
): {
  connection: signalR.HubConnection | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  send: (methodName: string, ...args: any[]) => Promise<void>;
  invoke: <T>(methodName: string, ...args: any[]) => Promise<T>;
} => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    const hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(url)
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // Exponential backoff: 0s, 2s, 10s, 30s, then every 30s
          if (retryContext.elapsedMilliseconds === 0) {
            return 0;
          }
          if (retryContext.previousRetryCount === 0) {
            return 2000;
          }
          if (retryContext.previousRetryCount === 1) {
            return 10000;
          }
          if (retryContext.previousRetryCount === 2) {
            return 30000;
          }
          return 30000;
        },
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connectionRef.current = hubConnection;

    // Connection event handlers
    hubConnection.onclose((error) => {
      setIsConnected(false);
      if (error) {
        const errorMessage = error.message || 'Connection closed';
        setError(new Error(`Connection closed: ${errorMessage}`));
        options.onError?.(new Error(errorMessage));
      }
    });

    hubConnection.onreconnecting((error) => {
      setIsConnected(false);
      if (error) {
        const errorMessage = error.message || 'Reconnecting';
        setError(new Error(`Reconnecting: ${errorMessage}`));
      }
    });

    hubConnection.onreconnected(() => {
      setIsConnected(true);
      setError(null);
      options.onConnected?.();
    });

    // Start connection if autoStart is enabled
    if (options.autoStart !== false) {
      startConnection();
    }

    return () => {
      hubConnection.stop();
      connectionRef.current = null;
      setIsConnected(false);
    };
  }, [url]);

  const startConnection = async () => {
    if (!connectionRef.current || isConnecting || isConnected) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      await connectionRef.current.start();
      setIsConnected(true);
      setIsConnecting(false);
      options.onConnected?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start SignalR connection');
      setError(error);
      setIsConnecting(false);
      setIsConnected(false);
      options.onError?.(error);
    }
  };

  const stopConnection = async () => {
    if (!connectionRef.current) {
      return;
    }

    try {
      await connectionRef.current.stop();
      setIsConnected(false);
      options.onDisconnected?.();
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to stop SignalR connection');
      setError(error);
      options.onError?.(error);
    }
  };

  const send = async (methodName: string, ...args: any[]) => {
    if (!connectionRef.current || !isConnected) {
      throw new Error('SignalR connection is not established');
    }

    try {
      await connectionRef.current.send(methodName, ...args);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      const error = err instanceof Error ? err : new Error(`Failed to send: ${errorMessage}`);
      setError(error);
      throw error;
    }
  };

  const invoke = async <T,>(methodName: string, ...args: any[]): Promise<T> => {
    if (!connectionRef.current || !isConnected) {
      throw new Error('SignalR connection is not established');
    }

    try {
      return await connectionRef.current.invoke<T>(methodName, ...args);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      const error = err instanceof Error ? err : new Error(`Failed to invoke: ${errorMessage}`);
      setError(error);
      throw error;
    }
  };

  return {
    connection: connectionRef.current, // Exposed for external use (connection.on, connection.off, etc.)
    isConnected,
    isConnecting,
    error,
    start: startConnection,
    stop: stopConnection,
    send,
    invoke,
  };
};

