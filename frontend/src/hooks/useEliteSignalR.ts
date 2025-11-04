/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - ELITE SIGNALR HOOK
 * Real-time Connection to Elite Experimental Research Backend
 * Custom Hook for PhD-Level Research Environment Integration
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseEliteSignalROptions {
  hubUrl: string;
  autoConnect?: boolean;
}

interface EliteSignalRConnection {
  connection: HubConnection | null;
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  joinExperimentMonitoring: (experimentId: string, runId?: string) => Promise<void>;
  leaveExperimentMonitoring: (experimentId: string, runId?: string) => Promise<void>;
  requestConsciousnessVisualization: (experimentId: string, runId: string) => Promise<void>;
  requestExperimentMetrics: (experimentId: string, runId: string) => Promise<void>;
  updateExperimentParameters: (
    experimentId: string,
    runId: string,
    parameters: any
  ) => Promise<void>;
  isConnected: boolean;
}

export const useEliteSignalR = (options: UseEliteSignalROptions): EliteSignalRConnection => {
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [connectionState, setConnectionState] = useState<
    'disconnected' | 'connecting' | 'connected' | 'reconnecting'
  >('disconnected');
  const connectionRef = useRef<HubConnection | null>(null);

  // Initialize connection
  useEffect(() => {
    const newConnection = new HubConnectionBuilder()
      .withUrl(options.hubUrl)
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // Exponential backoff: 2s, 4s, 8s, then 30s
          if (retryContext.previousRetryCount < 3) {
            return Math.pow(2, retryContext.previousRetryCount + 1) * 1000;
          }
          return 30000;
        },
      })
      .build();

    // Connection event handlers
    newConnection.onreconnecting(() => {
      console.log('🔄 Elite Hub: Reconnecting...');
      setConnectionState('reconnecting');
    });

    newConnection.onreconnected(() => {
      console.log('✅ Elite Hub: Reconnected');
      setConnectionState('connected');
    });

    newConnection.onclose((error) => {
      console.log('❌ Elite Hub: Connection closed', error);
      setConnectionState('disconnected');
    });

    // Set up event listeners for elite experimental updates
    newConnection.on('EliteExperimentRunUpdate', (data) => {
      console.log('🧠 Elite Experiment Update:', data);
      // Emit custom event for components to listen to
      window.dispatchEvent(new CustomEvent('eliteExperimentUpdate', { detail: data }));
    });

    newConnection.on('ConsciousnessStateUpdate', (data) => {
      console.log('🌟 Consciousness State Update:', data);
      window.dispatchEvent(new CustomEvent('consciousnessStateUpdate', { detail: data }));
    });

    newConnection.on('ResearchAnalyticsUpdate', (data) => {
      console.log('📊 Research Analytics Update:', data);
      window.dispatchEvent(new CustomEvent('researchAnalyticsUpdate', { detail: data }));
    });

    newConnection.on('ExperimentMetrics', (data) => {
      console.log('📈 Experiment Metrics:', data);
      window.dispatchEvent(new CustomEvent('experimentMetrics', { detail: data }));
    });

    newConnection.on('ConsciousnessVisualizationData', (data) => {
      console.log('🎨 Consciousness Visualization Data:', data);
      window.dispatchEvent(new CustomEvent('consciousnessVisualization', { detail: data }));
    });

    newConnection.on('ExperimentStatusUpdate', (data) => {
      console.log('📋 Experiment Status Update:', data);
      window.dispatchEvent(new CustomEvent('experimentStatusUpdate', { detail: data }));
    });

    newConnection.on('ExperimentParametersUpdated', (data) => {
      console.log('⚙️ Parameters Updated:', data);
      window.dispatchEvent(new CustomEvent('experimentParametersUpdated', { detail: data }));
    });

    newConnection.on('ExperimentError', (error) => {
      console.error('❌ Elite Experiment Error:', error);
      window.dispatchEvent(new CustomEvent('experimentError', { detail: error }));
    });

    setConnection(newConnection);
    connectionRef.current = newConnection;

    // Auto-connect if specified
    if (options.autoConnect) {
      connect();
    }

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
      }
    };
  }, [options.hubUrl, options.autoConnect]);

  const connect = useCallback(async () => {
    if (connection && connection.state === HubConnectionState.Disconnected) {
      try {
        setConnectionState('connecting');
        await connection.start();
        setConnectionState('connected');
        console.log('🌐 Elite Hub: Connected successfully');
      } catch (error) {
        console.error('❌ Elite Hub: Connection failed', error);
        setConnectionState('disconnected');
        throw error;
      }
    }
  }, [connection]);

  const disconnect = useCallback(async () => {
    if (connection && connection.state !== HubConnectionState.Disconnected) {
      try {
        await connection.stop();
        setConnectionState('disconnected');
        console.log('🔌 Elite Hub: Disconnected');
      } catch (error) {
        console.error('❌ Elite Hub: Disconnect failed', error);
        throw error;
      }
    }
  }, [connection]);

  const joinExperimentMonitoring = useCallback(
    async (experimentId: string, runId?: string) => {
      if (connection && connection.state === HubConnectionState.Connected) {
        try {
          await connection.invoke('JoinExperimentMonitoring', experimentId, runId);
          console.log(
            `📡 Joined monitoring for experiment ${experimentId}${runId ? ` - run ${runId}` : ''}`
          );
        } catch (error) {
          console.error('❌ Failed to join experiment monitoring', error);
          throw error;
        }
      } else {
        throw new Error('Connection not established');
      }
    },
    [connection]
  );

  const leaveExperimentMonitoring = useCallback(
    async (experimentId: string, runId?: string) => {
      if (connection && connection.state === HubConnectionState.Connected) {
        try {
          await connection.invoke('LeaveExperimentMonitoring', experimentId, runId);
          console.log(
            `📡 Left monitoring for experiment ${experimentId}${runId ? ` - run ${runId}` : ''}`
          );
        } catch (error) {
          console.error('❌ Failed to leave experiment monitoring', error);
          throw error;
        }
      }
    },
    [connection]
  );

  const requestConsciousnessVisualization = useCallback(
    async (experimentId: string, runId: string) => {
      if (connection && connection.state === HubConnectionState.Connected) {
        try {
          await connection.invoke('RequestConsciousnessVisualization', experimentId, runId);
          console.log(`🎨 Requested consciousness visualization for ${experimentId}-${runId}`);
        } catch (error) {
          console.error('❌ Failed to request consciousness visualization', error);
          throw error;
        }
      } else {
        throw new Error('Connection not established');
      }
    },
    [connection]
  );

  const requestExperimentMetrics = useCallback(
    async (experimentId: string, runId: string) => {
      if (connection && connection.state === HubConnectionState.Connected) {
        try {
          await connection.invoke('RequestExperimentMetrics', experimentId, runId);
          console.log(`📊 Requested metrics for ${experimentId}-${runId}`);
        } catch (error) {
          console.error('❌ Failed to request experiment metrics', error);
          throw error;
        }
      } else {
        throw new Error('Connection not established');
      }
    },
    [connection]
  );

  const updateExperimentParameters = useCallback(
    async (experimentId: string, runId: string, parameters: any) => {
      if (connection && connection.state === HubConnectionState.Connected) {
        try {
          await connection.invoke('UpdateExperimentParameters', experimentId, runId, parameters);
          console.log(`⚙️ Updated parameters for ${experimentId}-${runId}`, parameters);
        } catch (error) {
          console.error('❌ Failed to update experiment parameters', error);
          throw error;
        }
      } else {
        throw new Error('Connection not established');
      }
    },
    [connection]
  );

  const isConnected = connectionState === 'connected';

  return {
    connection,
    connectionState,
    connect,
    disconnect,
    joinExperimentMonitoring,
    leaveExperimentMonitoring,
    requestConsciousnessVisualization,
    requestExperimentMetrics,
    updateExperimentParameters,
    isConnected,
  };
};

// Custom hook to listen to elite experimental events
export const useEliteExperimentalEvents = () => {
  const [experimentUpdate, setExperimentUpdate] = useState<any>(null);
  const [consciousnessData, setConsciousnessData] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [metricsData, setMetricsData] = useState<any>(null);
  const [visualizationData, setVisualizationData] = useState<any>(null);
  const [statusUpdate, setStatusUpdate] = useState<any>(null);
  const [parametersUpdate, setParametersUpdate] = useState<any>(null);
  const [experimentError, setExperimentError] = useState<any>(null);

  useEffect(() => {
    const handleExperimentUpdate = (event: CustomEvent) => {
      setExperimentUpdate(event.detail);
    };

    const handleConsciousnessUpdate = (event: CustomEvent) => {
      setConsciousnessData(event.detail);
    };

    const handleAnalyticsUpdate = (event: CustomEvent) => {
      setAnalyticsData(event.detail);
    };

    const handleMetricsUpdate = (event: CustomEvent) => {
      setMetricsData(event.detail);
    };

    const handleVisualizationUpdate = (event: CustomEvent) => {
      setVisualizationData(event.detail);
    };

    const handleStatusUpdate = (event: CustomEvent) => {
      setStatusUpdate(event.detail);
    };

    const handleParametersUpdate = (event: CustomEvent) => {
      setParametersUpdate(event.detail);
    };

    const handleExperimentError = (event: CustomEvent) => {
      setExperimentError(event.detail);
    };

    // Add event listeners
    window.addEventListener('eliteExperimentUpdate', handleExperimentUpdate as EventListener);
    window.addEventListener('consciousnessStateUpdate', handleConsciousnessUpdate as EventListener);
    window.addEventListener('researchAnalyticsUpdate', handleAnalyticsUpdate as EventListener);
    window.addEventListener('experimentMetrics', handleMetricsUpdate as EventListener);
    window.addEventListener(
      'consciousnessVisualization',
      handleVisualizationUpdate as EventListener
    );
    window.addEventListener('experimentStatusUpdate', handleStatusUpdate as EventListener);
    window.addEventListener('experimentParametersUpdated', handleParametersUpdate as EventListener);
    window.addEventListener('experimentError', handleExperimentError as EventListener);

    return () => {
      // Cleanup event listeners
      window.removeEventListener('eliteExperimentUpdate', handleExperimentUpdate as EventListener);
      window.removeEventListener(
        'consciousnessStateUpdate',
        handleConsciousnessUpdate as EventListener
      );
      window.removeEventListener('researchAnalyticsUpdate', handleAnalyticsUpdate as EventListener);
      window.removeEventListener('experimentMetrics', handleMetricsUpdate as EventListener);
      window.removeEventListener(
        'consciousnessVisualization',
        handleVisualizationUpdate as EventListener
      );
      window.removeEventListener('experimentStatusUpdate', handleStatusUpdate as EventListener);
      window.removeEventListener(
        'experimentParametersUpdated',
        handleParametersUpdate as EventListener
      );
      window.removeEventListener('experimentError', handleExperimentError as EventListener);
    };
  }, []);

  return {
    experimentUpdate,
    consciousnessData,
    analyticsData,
    metricsData,
    visualizationData,
    statusUpdate,
    parametersUpdate,
    experimentError,
  };
};
