// ═══════════════════════════════════════════════════════════════════════════════
// 🔴 PHASE 29: SystemGPT Atlas Live Hook
// Real-time telemetry streaming via SSE with polling fallback
// "Government. Transcended."
// ═══════════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Health state classification for a county
 */
export type HealthState = 'healthy' | 'warning' | 'critical' | 'offline';

/**
 * Connection state for the live stream
 */
export type AtlasConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'offline';

/**
 * Live telemetry for a single county
 */
export interface SystemGptAtlasLiveCountyEvent {
  countyId: string;
  healthScore: number;
  healthState: HealthState;
  ragActive: boolean;
  guardrailTriggered: boolean;
  activeRequests: number;
  p95LatencyMs: number;
  errorRatePercent: number;
  activeAlerts: string[];
}

/**
 * Batch event containing live telemetry for all counties
 */
export interface SystemGptAtlasLiveEvent {
  version: string;
  eventType: string;
  timestamp: string;
  counties: SystemGptAtlasLiveCountyEvent[];
}

/**
 * Configuration options for the hook
 */
export interface UseSystemGptAtlasLiveOptions {
  /** Base URL for API endpoints */
  baseUrl?: string;
  /** Maximum retry attempts before falling back to polling */
  maxRetries?: number;
  /** Enable polling fallback when SSE fails */
  enablePollingFallback?: boolean;
  /** Polling interval in milliseconds (used when SSE fails) */
  pollingIntervalMs?: number;
  /** Callback when connection state changes */
  onConnectionStateChange?: (state: AtlasConnectionState) => void;
}

/**
 * Return type for the hook
 */
export interface UseSystemGptAtlasLiveReturn {
  /** Current connection state */
  connectionState: AtlasConnectionState;
  /** Latest live event (null until first event received) */
  liveEvent: SystemGptAtlasLiveEvent | null;
  /** Error if connection failed */
  error: Error | null;
  /** Get live data for a specific county */
  getCountyById: (countyId: string) => SystemGptAtlasLiveCountyEvent | undefined;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_BASE_URL = '/api/gpt';
const DEFAULT_MAX_RETRIES = 5;
const DEFAULT_POLLING_INTERVAL_MS = 3000;
const RECONNECT_DELAY_MS = 5000;

// ═══════════════════════════════════════════════════════════════════════════════
// Hook Implementation
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * React hook for streaming live Atlas telemetry via SSE with polling fallback
 */
export function useSystemGptAtlasLive(
  options: UseSystemGptAtlasLiveOptions = {}
): UseSystemGptAtlasLiveReturn {
  const {
    baseUrl = DEFAULT_BASE_URL,
    maxRetries = DEFAULT_MAX_RETRIES,
    enablePollingFallback = true,
    pollingIntervalMs = DEFAULT_POLLING_INTERVAL_MS,
    onConnectionStateChange,
  } = options;

  // State
  const [connectionState, setConnectionState] = useState<AtlasConnectionState>('connecting');
  const [liveEvent, setLiveEvent] = useState<SystemGptAtlasLiveEvent | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Refs
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // URLs
  const sseUrl = `${baseUrl}/system/atlas/live`;
  const snapshotUrl = `${baseUrl}/system/atlas/live/snapshot`;

  // ─────────────────────────────────────────────────────────────────────────────
  // Connection state change handler
  // ─────────────────────────────────────────────────────────────────────────────

  const updateConnectionState = useCallback(
    (newState: AtlasConnectionState) => {
      if (!isMountedRef.current) return;
      setConnectionState(newState);
      onConnectionStateChange?.(newState);
    },
    [onConnectionStateChange]
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Polling fallback
  // ─────────────────────────────────────────────────────────────────────────────

  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;

    const poll = async () => {
      if (!isMountedRef.current) return;

      try {
        const response = await fetch(snapshotUrl, {
          headers: { Accept: 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`Snapshot request failed: ${response.status}`);
        }

        const data: SystemGptAtlasLiveEvent = await response.json();

        if (isMountedRef.current) {
          setLiveEvent(data);
          setError(null);
        }
      } catch (err) {
        console.error('[Atlas Live] Polling error:', err);
        // Don't set error state for individual poll failures
      }
    };

    // Initial poll
    poll();

    // Set up interval
    pollingIntervalRef.current = setInterval(poll, pollingIntervalMs);
  }, [snapshotUrl, pollingIntervalMs]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // SSE Connection
  // ─────────────────────────────────────────────────────────────────────────────

  const connectSSE = useCallback(() => {
    if (!isMountedRef.current) return;

    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    updateConnectionState('connecting');

    try {
      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        if (!isMountedRef.current) return;
        console.debug('[Atlas Live] SSE connected');
        retryCountRef.current = 0;
        updateConnectionState('connected');
        setError(null);
        stopPolling();
      };

      eventSource.onmessage = (event) => {
        if (!isMountedRef.current) return;

        try {
          const data: SystemGptAtlasLiveEvent = JSON.parse(event.data);
          setLiveEvent(data);
        } catch (parseError) {
          console.error('[Atlas Live] Failed to parse event:', parseError);
          // Don't update state on parse error - preserve last good event
        }
      };

      eventSource.onerror = () => {
        if (!isMountedRef.current) return;

        console.warn('[Atlas Live] SSE error, attempting reconnect...');

        eventSource.close();
        eventSourceRef.current = null;

        retryCountRef.current++;

        if (retryCountRef.current <= maxRetries) {
          updateConnectionState('reconnecting');

          // Exponential backoff with jitter
          const delay = RECONNECT_DELAY_MS * Math.pow(1.5, retryCountRef.current - 1);
          const jitter = Math.random() * 1000;

          setTimeout(() => {
            if (isMountedRef.current) {
              connectSSE();
            }
          }, delay + jitter);
        } else {
          console.warn('[Atlas Live] Max retries exceeded, falling back to polling');
          updateConnectionState('offline');
          setError(new Error('SSE connection failed after max retries'));

          if (enablePollingFallback) {
            startPolling();
          }
        }
      };
    } catch (err) {
      console.error('[Atlas Live] Failed to create EventSource:', err);
      updateConnectionState('offline');
      setError(err instanceof Error ? err : new Error('Failed to connect'));

      if (enablePollingFallback) {
        startPolling();
      }
    }
  }, [sseUrl, maxRetries, enablePollingFallback, updateConnectionState, startPolling, stopPolling]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Helper: Get county by ID
  // ─────────────────────────────────────────────────────────────────────────────

  const getCountyById = useCallback(
    (countyId: string): SystemGptAtlasLiveCountyEvent | undefined => {
      return liveEvent?.counties.find((c) => c.countyId === countyId);
    },
    [liveEvent]
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Effect: Initialize connection on mount
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    isMountedRef.current = true;
    connectSSE();

    return () => {
      isMountedRef.current = false;

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      stopPolling();
    };
  }, [connectSSE, stopPolling]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Return
  // ─────────────────────────────────────────────────────────────────────────────

  return {
    connectionState,
    liveEvent,
    error,
    getCountyById,
  };
}

export default useSystemGptAtlasLive;
