/**
 * TerraFusion OS IPC Router
 * 
 * Routes validated IPC messages to the appropriate subsystems.
 * This is a pure function module with no side effects of its own.
 * 
 * @module ipc/ipcRouter
 */

import {
  TF_MESSAGE_TYPES,
  isTfIpcEnvelope,
  isTfSystemLogPayload,
  isTfOpenAppPayload,
  isTfSetBadgePayload,
  type TfIpcEnvelope,
  type TfSystemLogPayload,
  type TfSetBadgePayload,
} from './ipcTypes';

// ============================================================================
// Types
// ============================================================================

/**
 * Telemetry event structure for Neural Feed
 */
export interface TelemetryEvent {
  /** Unique event ID */
  id: string;
  /** ISO timestamp */
  tsUtc: string;
  /** Log level */
  level: 'Info' | 'Warn' | 'Error' | 'Action' | 'Thinking';
  /** Agent/App ID that emitted the event */
  agent: string;
  /** Event topic/category */
  topic: string;
  /** Human-readable message */
  message: string;
  /** Optional correlation ID */
  correlationId?: string;
  /** Optional structured data */
  data?: Record<string, unknown>;
}

/**
 * Dependencies injected into the router
 */
export interface IpcRouterDeps {
  /** Push event to Neural Feed (AgentStore) */
  pushTelemetry: (event: TelemetryEvent) => void;
  /** Open an app window (DesktopStore) */
  openApp: (appId: string) => void;
  /** Set app badge (optional, may not be implemented yet) */
  setAppBadge?: (appId: string, badge: TfSetBadgePayload) => void;
}

/**
 * Result of routing a message
 */
export interface RouteResult {
  /** Whether the message was successfully routed */
  routed: boolean;
  /** Reason for failure or additional info */
  reason?: 'invalid_envelope' | 'unknown_type' | 'invalid_payload' | 'no_handler';
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique event ID
 */
function generateEventId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Map IPC log level to Neural Feed level
 */
function mapLogLevel(level: string): TelemetryEvent['level'] {
  switch (level) {
    case 'debug':
      return 'Info'; // Neural Feed doesn't have debug, map to Info
    case 'info':
      return 'Info';
    case 'warn':
      return 'Warn';
    case 'error':
      return 'Error';
    default:
      return 'Info';
  }
}

// ============================================================================
// Router
// ============================================================================

/**
 * Route an IPC message to the appropriate subsystem.
 * 
 * @param data - The raw message data from postMessage
 * @param verifiedAppId - The app ID determined by origin validation (trusted)
 * @param deps - Injected dependencies for side effects
 * @returns RouteResult indicating success or failure
 */
export function routeIpcMessage(
  data: unknown,
  verifiedAppId: string,
  deps: IpcRouterDeps
): RouteResult {
  // Validate envelope structure
  if (!isTfIpcEnvelope(data)) {
    return { routed: false, reason: 'invalid_envelope' };
  }

  const envelope = data as TfIpcEnvelope;

  // Route by message type
  switch (envelope.type) {
    case TF_MESSAGE_TYPES.SYSTEM_LOG: {
      if (!isTfSystemLogPayload(envelope.payload)) {
        return { routed: false, reason: 'invalid_payload' };
      }

      const payload = envelope.payload as TfSystemLogPayload;
      
      const event: TelemetryEvent = {
        id: envelope.id ?? generateEventId(),
        tsUtc: new Date(envelope.ts ?? Date.now()).toISOString(),
        level: mapLogLevel(payload.level),
        agent: verifiedAppId, // Use verified appId, NOT sender-provided
        topic: payload.topic ?? 'app',
        message: payload.message,
        data: payload.data,
      };

      deps.pushTelemetry(event);
      return { routed: true };
    }

    case TF_MESSAGE_TYPES.OPEN_APP: {
      if (!isTfOpenAppPayload(envelope.payload)) {
        return { routed: false, reason: 'invalid_payload' };
      }

      const { appId } = envelope.payload;
      deps.openApp(appId);
      return { routed: true };
    }

    case TF_MESSAGE_TYPES.SET_BADGE: {
      if (!isTfSetBadgePayload(envelope.payload)) {
        return { routed: false, reason: 'invalid_payload' };
      }

      if (!deps.setAppBadge) {
        // Handler not implemented yet, but message was valid
        return { routed: true, reason: 'no_handler' };
      }

      deps.setAppBadge(verifiedAppId, envelope.payload);
      return { routed: true };
    }

    default:
      return { routed: false, reason: 'unknown_type' };
  }
}
