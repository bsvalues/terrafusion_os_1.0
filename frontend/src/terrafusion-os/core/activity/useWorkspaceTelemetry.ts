/**
 * useWorkspaceTelemetry – React hook for ingesting external telemetry.
 *
 * Provides a WebSocket-based telemetry connection that feeds events
 * into the OS activity pipeline via ingestWorkspaceEvent.
 *
 * Domain-neutral – no parcel/property/levy semantics.
 */
import { useEffect, useRef } from 'react';
import { ingestWorkspaceEvent } from './ingestWorkspaceEvent';
import type { WorkspaceActivityKind, WorkspaceActivityType } from './types';

/**
 * Raw telemetry payload from external sources.
 * Maps to IncomingWorkspaceEvent after normalization.
 */
export interface RawTelemetryPayload {
  workspaceId: string;
  severity: 'info' | 'warn' | 'error';
  message: string;
  source?: string;
  kind?: WorkspaceActivityKind;
}

export interface UseWorkspaceTelemetryOptions {
  /** WebSocket URL for telemetry stream */
  url: string;
  /** Whether to automatically reconnect on disconnect */
  autoReconnect?: boolean;
  /** Reconnect delay in ms (default: 3000) */
  reconnectDelay?: number;
  /** Callback when connection opens */
  onConnect?: () => void;
  /** Callback when connection closes */
  onDisconnect?: () => void;
  /** Callback when an error occurs */
  onError?: (error: Event) => void;
}

/**
 * Map severity from telemetry payload to WorkspaceActivityType.
 */
const mapSeverityToType = (severity: RawTelemetryPayload['severity']): WorkspaceActivityType => {
  switch (severity) {
    case 'error':
      return 'incident';
    case 'warn':
      return 'warning';
    case 'info':
    default:
      return 'info';
  }
};

/**
 * Hook that connects to a WebSocket telemetry stream and ingests events.
 *
 * Events are automatically normalized and fed into the activity pipeline,
 * appearing in all OS health/activity components.
 *
 * @example
 * ```tsx
 * const WorkspaceShell: React.FC = () => {
 *   useWorkspaceTelemetry({
 *     url: 'ws://localhost:8788/ws/telemetry',
 *     autoReconnect: true,
 *   });
 *
 *   return <div>...</div>;
 * };
 * ```
 */
export const useWorkspaceTelemetry = (options: UseWorkspaceTelemetryOptions): void => {
  const {
    url,
    autoReconnect = true,
    reconnectDelay = 3000,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const connect = () => {
      if (!mountedRef.current) return;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (mountedRef.current) {
          onConnect?.();
        }
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;

        try {
          const data: RawTelemetryPayload = JSON.parse(event.data);

          if (!data.workspaceId || !data.message || !data.severity) {
            return; // Skip malformed payloads
          }

          void ingestWorkspaceEvent({
            workspaceId: data.workspaceId,
            summary: data.message,
            type: mapSeverityToType(data.severity),
            source: data.source ?? 'Telemetry',
            kind: data.kind ?? 'system_event',
          });
        } catch {
          // Swallow malformed JSON
        }
      };

      ws.onerror = (error) => {
        if (mountedRef.current) {
          onError?.(error);
        }
      };

      ws.onclose = () => {
        if (mountedRef.current) {
          onDisconnect?.();

          if (autoReconnect) {
            reconnectTimeoutRef.current = setTimeout(connect, reconnectDelay);
          }
        }
      };
    };

    connect();

    return () => {
      mountedRef.current = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [url, autoReconnect, reconnectDelay, onConnect, onDisconnect, onError]);
};

/**
 * Hook for polling-based telemetry ingestion (fallback when WebSocket unavailable).
 *
 * @example
 * ```tsx
 * useWorkspacePollingTelemetry({
 *   url: '/api/os/workspace-events',
 *   interval: 5000,
 * });
 * ```
 */
export interface UseWorkspacePollingTelemetryOptions {
  /** REST endpoint URL for polling events */
  url: string;
  /** Polling interval in ms (default: 5000) */
  interval?: number;
  /** Callback when polling encounters an error */
  onError?: (error: Error) => void;
}

export const useWorkspacePollingTelemetry = (
  options: UseWorkspacePollingTelemetryOptions
): void => {
  const { url, interval = 5000, onError } = options;

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;

      try {
        const res = await fetch(url);

        if (!res.ok) {
          throw new Error(`Polling failed: ${res.status}`);
        }

        const events: RawTelemetryPayload[] = await res.json();

        if (cancelled) return;

        for (const data of events) {
          if (!data.workspaceId || !data.message || !data.severity) {
            continue;
          }

          void ingestWorkspaceEvent({
            workspaceId: data.workspaceId,
            summary: data.message,
            type: mapSeverityToType(data.severity),
            source: data.source ?? 'Telemetry',
            kind: data.kind ?? 'system_event',
          });
        }
      } catch (error) {
        if (!cancelled) {
          onError?.(error as Error);
        }
      } finally {
        if (!cancelled) {
          setTimeout(tick, interval);
        }
      }
    };

    tick();

    return () => {
      cancelled = true;
    };
  }, [url, interval, onError]);
};
