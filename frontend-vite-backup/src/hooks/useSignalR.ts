// NO HARDCODED PORTS! Use environment variables.
import { useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';

interface SignalRConnection {
  connection: signalR.HubConnection | null;
  connectionState: signalR.HubConnectionState;
  error: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  invoke: (methodName: string, ...args: any[]) => Promise<any>;
  on: (methodName: string, callback: (...args: any[]) => void) => void;
  off: (methodName: string) => void;
}

export const useSignalR = (hubUrl: string): SignalRConnection => {
  const [connectionState, setConnectionState] = useState<signalR.HubConnectionState>(
    signalR.HubConnectionState.Disconnected
  );
  const [error, setError] = useState<string | null>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:${TF_STATIC_PORT:-8080}';
  const fullHubUrl = `${API_BASE_URL}${hubUrl}`;

  const connect = async () => {
    if (connectionRef.current) {
      await disconnect();
    }

    try {
      const connection = new signalR.HubConnectionBuilder()
        .withUrl(fullHubUrl, {
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets,
          accessTokenFactory: () => {
            // Get auth token from localStorage
            return localStorage.getItem('authToken') || '';
          },
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Connection state change handlers
      connection.onclose((error) => {
        console.log('SignalR connection closed:', error);
        setConnectionState(signalR.HubConnectionState.Disconnected);
        setError(error?.message || 'Connection closed');
      });

      connection.onreconnecting((error) => {
        console.log('SignalR reconnecting:', error);
        setConnectionState(signalR.HubConnectionState.Reconnecting);
        setError(error?.message || null);
      });

      connection.onreconnected((connectionId) => {
        console.log('SignalR reconnected:', connectionId);
        setConnectionState(signalR.HubConnectionState.Connected);
        setError(null);
      });

      // Start connection
      await connection.start();

      connectionRef.current = connection;
      setConnectionState(connection.state);
      setError(null);

      console.log('SignalR connected to:', fullHubUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown connection error';
      console.error('SignalR connection failed:', errorMessage);
      setError(errorMessage);
      setConnectionState(signalR.HubConnectionState.Disconnected);
    }
  };

  const disconnect = async () => {
    if (connectionRef.current) {
      await connectionRef.current.stop();
      connectionRef.current = null;
      setConnectionState(signalR.HubConnectionState.Disconnected);
    }
  };

  const invoke = async (methodName: string, ...args: any[]): Promise<any> => {
    if (
      !connectionRef.current ||
      connectionRef.current.state !== signalR.HubConnectionState.Connected
    ) {
      throw new Error('SignalR connection not established');
    }

    try {
      return await connectionRef.current.invoke(methodName, ...args);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invoke failed';
      console.error(`SignalR invoke failed for ${methodName}:`, errorMessage);
      throw err;
    }
  };

  const on = (methodName: string, callback: (...args: any[]) => void) => {
    if (connectionRef.current) {
      connectionRef.current.on(methodName, callback);
    }
  };

  const off = (methodName: string) => {
    if (connectionRef.current) {
      connectionRef.current.off(methodName);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
      }
    };
  }, []);

  return {
    connection: connectionRef.current,
    connectionState,
    error,
    isConnected: connectionState === signalR.HubConnectionState.Connected,
    connect,
    disconnect,
    invoke,
    on,
    off,
  };
};

// OS Core Hub specific hook
export const useOSCoreHub = () => {
  const signalR = useSignalR('/terrafusion/core');

  const authenticateOS = async (countryId: string, legacySystem: string, credentials?: any) => {
    return await signalR.invoke('AuthenticateOS', {
      CountyId: countryId,
      LegacySystem: legacySystem,
      Credentials: credentials,
    });
  };

  const heartbeat = async (sessionId?: string) => {
    return await signalR.invoke('Heartbeat', {
      SessionId: sessionId,
      Ts: Date.now(),
    });
  };

  const loadModule = async (moduleName: string, source?: string) => {
    return await signalR.invoke('LoadModule', {
      ModuleName: moduleName,
      Source: source || 'frontend',
    });
  };

  return {
    ...signalR,
    authenticateOS,
    heartbeat,
    loadModule,
  };
};
