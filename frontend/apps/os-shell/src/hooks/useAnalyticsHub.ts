/**
 * useAnalyticsHub - Real-Time Analytics Streaming Hook
 *
 * React hook for managing live analytics updates and data streaming.
 * Handles connection lifecycle, event subscriptions, and streaming state.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 5 Day 3
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { HubConnection } from '@microsoft/signalr';
import { signalRService, AnalysisProgress } from '../services/SignalRService';

// ==================== TYPES ====================

export interface AnalysisResult {
  analysisId: number;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  results?: any;
  error?: string;
}

export interface DataPoint {
  timestamp: string;
  value: number;
  metadata?: Record<string, any>;
}

export interface VisualizationUpdate {
  visualizationId: string;
  chartType: string;
  data: any[];
  config: Record<string, any>;
}

export interface StatisticalResult {
  analysisId: number;
  statistic: string;
  value: number;
  pValue?: number;
  confidenceInterval?: [number, number];
}

export interface AnalyticsHubState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  activeAnalyses: Map<number, AnalysisResult>;
  dataStreams: Map<string, DataPoint[]>;
  visualizations: Map<string, VisualizationUpdate>;
  statistics: StatisticalResult[];
}

export interface AnalyticsHubActions {
  subscribeToAnalysis: (analysisId: number) => Promise<void>;
  unsubscribeFromAnalysis: (analysisId: number) => Promise<void>;
  subscribeToDataStream: (streamId: string) => Promise<void>;
  unsubscribeFromDataStream: (streamId: string) => Promise<void>;
  disconnect: () => Promise<void>;
}

export interface UseAnalyticsHubReturn {
  state: AnalyticsHubState;
  actions: AnalyticsHubActions;
  connection: HubConnection | null;
}

// ==================== HOOK ====================

/**
 * Custom hook for real-time analytics streaming
 *
 * @param enabled - Whether to connect (default: true)
 */
export function useAnalyticsHub(enabled: boolean = true): UseAnalyticsHubReturn {
  // ==================== STATE ====================

  const [state, setState] = useState<AnalyticsHubState>({
    connected: false,
    connecting: false,
    error: null,
    activeAnalyses: new Map(),
    dataStreams: new Map(),
    visualizations: new Map(),
    statistics: [],
  });

  const connectionRef = useRef<HubConnection | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // ==================== ACTIONS ====================

  const subscribeToAnalysis = useCallback(async (analysisId: number) => {
    if (!connectionRef.current) {
      throw new Error('Not connected to AnalyticsHub');
    }

    await connectionRef.current.invoke('SubscribeToAnalysis', analysisId);
    console.debug(`📊 Subscribed to analysis ${analysisId}`);
  }, []);

  const unsubscribeFromAnalysis = useCallback(async (analysisId: number) => {
    if (!connectionRef.current) {
      throw new Error('Not connected to AnalyticsHub');
    }

    await connectionRef.current.invoke('UnsubscribeFromAnalysis', analysisId);
    console.debug(`📊 Unsubscribed from analysis ${analysisId}`);
  }, []);

  const subscribeToDataStream = useCallback(async (streamId: string) => {
    if (!connectionRef.current) {
      throw new Error('Not connected to AnalyticsHub');
    }

    await connectionRef.current.invoke('SubscribeToDataStream', streamId);
    console.debug(`📡 Subscribed to data stream ${streamId}`);
  }, []);

  const unsubscribeFromDataStream = useCallback(async (streamId: string) => {
    if (!connectionRef.current) {
      throw new Error('Not connected to AnalyticsHub');
    }

    await connectionRef.current.invoke('UnsubscribeFromDataStream', streamId);
    console.debug(`📡 Unsubscribed from data stream ${streamId}`);
  }, []);

  const disconnect = useCallback(async () => {
    if (connectionRef.current) {
      await signalRService.disconnectFromAnalytics();
      connectionRef.current = null;
      setState((prev) => ({ ...prev, connected: false }));
    }
  }, []);

  // ==================== CONNECTION MANAGEMENT ====================

  useEffect(() => {
    if (!enabled) return;

    let mounted = true;

    const connect = async () => {
      try {
        setState((prev) => ({ ...prev, connecting: true, error: null }));

        // Connect to AnalyticsHub
        const connection = await signalRService.connectToAnalytics();

        if (!mounted) {
          await signalRService.disconnectFromAnalytics();
          return;
        }

        connectionRef.current = connection;

        // ==================== EVENT HANDLERS ====================

        // Analysis started
        connection.on(
          'AnalysisStarted',
          (data: { analysisId: number; totalSteps: number; startedAt: string }) => {
            console.debug(`▶️ Analysis ${data.analysisId} started`);
            setState((prev) => {
              const newAnalyses = new Map(prev.activeAnalyses);
              newAnalyses.set(data.analysisId, {
                analysisId: data.analysisId,
                status: 'running',
                progress: 0,
                currentStep: 'Initializing...',
              });
              return { ...prev, activeAnalyses: newAnalyses };
            });
          }
        );

        // Analysis progress update
        connection.on('AnalysisProgress', (update: AnalysisProgress) => {
          setState((prev) => {
            const newAnalyses = new Map(prev.activeAnalyses);
            const existing = newAnalyses.get(update.analysisId);
            newAnalyses.set(update.analysisId, {
              analysisId: update.analysisId,
              status: 'running',
              progress: update.progress,
              currentStep: update.currentStep,
              results: existing?.results,
            });
            return { ...prev, activeAnalyses: newAnalyses };
          });
        });

        // Analysis completed
        connection.on(
          'AnalysisCompleted',
          (data: {
            analysisId: number;
            results: any;
            durationMs: number;
            completedAt: string;
          }) => {
            console.debug(`✅ Analysis ${data.analysisId} completed in ${data.durationMs}ms`);
            setState((prev) => {
              const newAnalyses = new Map(prev.activeAnalyses);
              newAnalyses.set(data.analysisId, {
                analysisId: data.analysisId,
                status: 'completed',
                progress: 1,
                currentStep: 'Completed',
                results: data.results,
              });
              return { ...prev, activeAnalyses: newAnalyses };
            });
          }
        );

        // Analysis failed
        connection.on(
          'AnalysisFailed',
          (data: { analysisId: number; error: string; failedAt: string }) => {
            console.error(`❌ Analysis ${data.analysisId} failed:`, data.error);
            setState((prev) => {
              const newAnalyses = new Map(prev.activeAnalyses);
              newAnalyses.set(data.analysisId, {
                analysisId: data.analysisId,
                status: 'failed',
                progress: 0,
                currentStep: 'Failed',
                error: data.error,
              });
              return { ...prev, activeAnalyses: newAnalyses };
            });
          }
        );

        // Live data point
        connection.on(
          'LiveDataPoint',
          (data: { streamId: string; dataPoint: DataPoint }) => {
            setState((prev) => {
              const newStreams = new Map(prev.dataStreams);
              const existing = newStreams.get(data.streamId) || [];
              newStreams.set(data.streamId, [...existing, data.dataPoint]);
              return { ...prev, dataStreams: newStreams };
            });
          }
        );

        // Batch data update
        connection.on(
          'BatchDataUpdate',
          (data: { streamId: string; dataPoints: DataPoint[] }) => {
            setState((prev) => {
              const newStreams = new Map(prev.dataStreams);
              const existing = newStreams.get(data.streamId) || [];
              newStreams.set(data.streamId, [...existing, ...data.dataPoints]);
              return { ...prev, dataStreams: newStreams };
            });
          }
        );

        // Visualization update
        connection.on('VisualizationUpdate', (update: VisualizationUpdate) => {
          setState((prev) => {
            const newVisualizations = new Map(prev.visualizations);
            newVisualizations.set(update.visualizationId, update);
            return { ...prev, visualizations: newVisualizations };
          });
        });

        // Statistical result
        connection.on('StatisticalResult', (result: StatisticalResult) => {
          console.debug(
            `📈 Statistical result for analysis ${result.analysisId}: ${result.statistic} = ${result.value}`
          );
          setState((prev) => ({
            ...prev,
            statistics: [...prev.statistics, result],
          }));
        });

        // Significance alert
        connection.on(
          'SignificanceAlert',
          (data: {
            analysisId: number;
            pValue: number;
            threshold: number;
            isSignificant: boolean;
          }) => {
            if (data.isSignificant) {
              console.warn(
                `⚠️ Significant result for analysis ${data.analysisId}: p-value ${data.pValue} <= ${data.threshold}`
              );
            }
          }
        );

        // Model training progress
        connection.on(
          'ModelTrainingProgress',
          (data: {
            modelId: string;
            epoch: number;
            totalEpochs: number;
            loss: number;
            accuracy: number;
          }) => {
            console.debug(
              `🤖 Model ${data.modelId} training: Epoch ${data.epoch}/${data.totalEpochs} - Loss: ${data.loss.toFixed(4)}, Accuracy: ${data.accuracy.toFixed(4)}`
            );
          }
        );

        setState((prev) => ({ ...prev, connected: true, connecting: false }));

        // Cleanup function
        cleanupRef.current = () => {
          connection.off('AnalysisStarted');
          connection.off('AnalysisProgress');
          connection.off('AnalysisCompleted');
          connection.off('AnalysisFailed');
          connection.off('LiveDataPoint');
          connection.off('BatchDataUpdate');
          connection.off('VisualizationUpdate');
          connection.off('StatisticalResult');
          connection.off('SignificanceAlert');
          connection.off('ModelTrainingProgress');
        };
      } catch (error) {
        console.error('❌ Failed to connect to AnalyticsHub:', error);
        if (mounted) {
          setState((prev) => ({
            ...prev,
            connecting: false,
            error: error instanceof Error ? error.message : 'Connection failed',
          }));
        }
      }
    };

    connect();

    // Cleanup on unmount
    return () => {
      mounted = false;
      if (cleanupRef.current) {
        cleanupRef.current();
      }
      signalRService.disconnectFromAnalytics().catch(console.error);
    };
  }, [enabled]);

  // ==================== RETURN ====================

  return {
    state,
    actions: {
      subscribeToAnalysis,
      unsubscribeFromAnalysis,
      subscribeToDataStream,
      unsubscribeFromDataStream,
      disconnect,
    },
    connection: connectionRef.current,
  };
}

export default useAnalyticsHub;
