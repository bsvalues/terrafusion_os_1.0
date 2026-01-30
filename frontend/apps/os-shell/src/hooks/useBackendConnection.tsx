import { useCallback, useEffect, useRef, useState } from 'react';

interface BackendConnectionState {
  isConnected: boolean;
  lastSuccessfulConnection: Date | null;
  connectionAttempts: number;
  lastError: string | null;
  responseTime: number;
  backendVersion: string | null;
}

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database?: {
      IsHealthy: boolean;
      Provider?: string;
      ModuleCount?: number;
      PendingMigrations?: number;
    };
    modules?: { IsHealthy: boolean; ActiveCount?: number };
    memory?: { IsHealthy: boolean; Usage?: number };
    aiServices?: { IsHealthy: boolean; AgentCount?: number };
  };
  responseTime: number;
  timestamp: string;
  version: string;
  uptime: string;
}

export const useBackendConnection = () => {
  const [state, setState] = useState<BackendConnectionState>({
    isConnected: false,
    lastSuccessfulConnection: null,
    connectionAttempts: 0,
    lastError: null,
    responseTime: 0,
    backendVersion: null,
  });

  const [isMonitoring, setIsMonitoring] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  const BACKEND_URL = 'http://localhost:5000';
  const MAX_RETRY_ATTEMPTS = 5;
  const RETRY_DELAY_BASE = 1000; // Start with 1 second
  const HEALTH_CHECK_INTERVAL = 5000; // Check every 5 seconds

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const testConnection = useCallback(async (): Promise<HealthCheckResponse | null> => {
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const startTime = performance.now();

    try {
      const response = await fetch(`${BACKEND_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
        },
        signal: abortControllerRef.current.signal,
      });

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      if (response.ok) {
        const healthData: HealthCheckResponse = await response.json();

        setState((prev) => ({
          ...prev,
          isConnected: true,
          lastSuccessfulConnection: new Date(),
          connectionAttempts: 0,
          lastError: null,
          responseTime,
          backendVersion: healthData.version,
        }));

        return { ...healthData, responseTime };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      if (error.name === 'AbortError') {
        console.log('Health check aborted');
        return null;
      }

      const errorMessage = error.message || 'Unknown connection error';
      console.error('Backend connection failed:', errorMessage);

      setState((prev) => ({
        ...prev,
        isConnected: false,
        connectionAttempts: prev.connectionAttempts + 1,
        lastError: errorMessage,
        responseTime,
      }));

      return null;
    }
  }, [BACKEND_URL]);

  const scheduleReconnect = useCallback(
    (attemptNumber: number) => {
      if (attemptNumber >= MAX_RETRY_ATTEMPTS) {
        console.warn(
          `Max retry attempts (${MAX_RETRY_ATTEMPTS}) reached. Stopping automatic reconnection.`
        );
        return;
      }

      const delay = RETRY_DELAY_BASE * Math.pow(2, attemptNumber); // Exponential backoff
      console.log(`Scheduling reconnection attempt ${attemptNumber + 1} in ${delay}ms`);

      reconnectTimeoutRef.current = setTimeout(async () => {
        console.log(`Reconnection attempt ${attemptNumber + 1}...`);
        const result = await testConnection();

        if (!result) {
          scheduleReconnect(attemptNumber + 1);
        }
      }, delay);
    },
    [testConnection, MAX_RETRY_ATTEMPTS, RETRY_DELAY_BASE]
  );

  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    console.log('🔍 Starting backend connection monitoring...');
    setIsMonitoring(true);

    // Initial connection test
    testConnection().then((result) => {
      if (!result) {
        scheduleReconnect(0);
      }
    });
  }, [isMonitoring, testConnection, scheduleReconnect]);

  const stopMonitoring = useCallback(() => {
    console.log('⏹️ Stopping backend connection monitoring...');
    setIsMonitoring(false);
    cleanup();
  }, [cleanup]);

  const forceReconnect = useCallback(() => {
    console.log('🔄 Forcing backend reconnection...');
    setState((prev) => ({ ...prev, connectionAttempts: 0, lastError: null }));
    testConnection();
  }, [testConnection]);

  // Auto-start monitoring
  useEffect(() => {
    startMonitoring();
    return stopMonitoring;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    ...state,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    forceReconnect,
    testConnection,
  };
};

export default useBackendConnection;
