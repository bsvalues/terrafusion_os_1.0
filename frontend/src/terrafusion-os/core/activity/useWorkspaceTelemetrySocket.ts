/**
 * useWorkspaceTelemetrySocket – Browser-side WebSocket telemetry hook.
 *
 * Connects to a telemetry WebSocket and feeds events into the activity pipeline.
 * This is intentionally simple: connect, parse, ingest.
 *
 * Domain-neutral – no parcel/property/levy semantics.
 */
import { useEffect } from 'react';
import { ingestWorkspaceTelemetry } from './ingestTelemetry';
import type { WorkspaceTelemetryEvent } from './telemetryTypes';

/**
 * Options for the telemetry socket hook.
 */
export interface WorkspaceTelemetrySocketOptions {
  /** WebSocket URL (e.g. ws://localhost:8788/ws/telemetry) */
  url: string;
  /** Default workspace ID for events that don't specify one */
  workspaceId: string;
}

/**
 * Hook that connects to a WebSocket telemetry stream and ingests events.
 *
 * Events are automatically normalized and fed into the activity pipeline,
 * appearing in all OS health/activity components.
 *
 * @example
 * ```tsx
 * export const HomeWorkspace: React.FC = () => {
 *   const workspaceId = 'home';
 *
 *   useWorkspaceTelemetrySocket({
 *     url: 'ws://localhost:8788/ws/telemetry',
 *     workspaceId,
 *   });
 *
 *   return <div>...</div>;
 * };
 * ```
 */
export const useWorkspaceTelemetrySocket = ({
  url,
  workspaceId,
}: WorkspaceTelemetrySocketOptions): void => {
  useEffect(() => {
    let ws: WebSocket | null = null;
    let closed = false;

    try {
      ws = new WebSocket(url);
    } catch {
      // Connection failed - silently ignore in this stub
      return;
    }

    ws.onmessage = (event) => {
      if (closed) return;

      try {
        const data = JSON.parse(event.data);

        // Build telemetry event with defaults
        const telemetry: WorkspaceTelemetryEvent = {
          workspaceId: data.workspaceId ?? workspaceId,
          severity: data.severity ?? 'info',
          kind: data.kind ?? 'system',
          message: data.message ?? 'Telemetry event',
          source: data.source,
          occurredAt: data.occurredAt,
        };

        void ingestWorkspaceTelemetry(telemetry);
      } catch {
        // Ignore malformed messages in this stub
      }
    };

    ws.onerror = () => {
      // Could log to console or record a low-severity system event
    };

    return () => {
      closed = true;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [url, workspaceId]);
};
