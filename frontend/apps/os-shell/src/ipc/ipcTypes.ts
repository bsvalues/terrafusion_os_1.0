/**
 * TerraFusion OS IPC Protocol Types
 * 
 * Defines the Inter-Process Communication protocol for apps to communicate
 * with the OS Shell via window.postMessage.
 * 
 * @module ipc/ipcTypes
 * @see Phase 6: IPC Bridge
 */

// ============================================================================
// Protocol Version
// ============================================================================

/**
 * Current protocol version. Used to ensure compatibility between
 * apps and the shell. Increment when making breaking changes.
 */
export const TF_PROTOCOL_VERSION = 1 as const;

// ============================================================================
// Message Types
// ============================================================================

/**
 * Known IPC message types
 */
export const TF_MESSAGE_TYPES = {
  SYSTEM_LOG: 'TF_SYSTEM_LOG',
  OPEN_APP: 'TF_OPEN_APP',
  SET_BADGE: 'TF_SET_BADGE',
} as const;

export type TfMessageType = (typeof TF_MESSAGE_TYPES)[keyof typeof TF_MESSAGE_TYPES];

// ============================================================================
// Envelope Type
// ============================================================================

/**
 * Source metadata for tracking message origin
 */
export interface TfIpcSource {
  /** App ID as declared by sender (will be overwritten by shell with verified appId) */
  appId?: string;
}

/**
 * The standard IPC envelope for all messages between apps and shell.
 * All messages MUST use this format.
 */
export interface TfIpcEnvelope<T = unknown> {
  /** Protocol version - must be TF_PROTOCOL_VERSION */
  tf: typeof TF_PROTOCOL_VERSION;
  /** Message type identifier */
  type: string;
  /** Optional unique message ID for correlation */
  id?: string;
  /** Epoch milliseconds when message was created */
  ts?: number;
  /** Source metadata (appId is verified by shell, not trusted from sender) */
  source?: TfIpcSource;
  /** Message payload - type depends on message type */
  payload: T;
}

// ============================================================================
// Payload Types
// ============================================================================

/**
 * Log levels for TF_SYSTEM_LOG messages
 */
export type TfLogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Payload for TF_SYSTEM_LOG messages.
 * Writes to the Neural Feed in Sentinel Panel.
 */
export interface TfSystemLogPayload {
  /** Log level */
  level: TfLogLevel;
  /** Human-readable message */
  message: string;
  /** Optional topic/category for filtering */
  topic?: string;
  /** Optional structured data */
  data?: Record<string, unknown>;
}

/**
 * Payload for TF_OPEN_APP messages.
 * Requests the shell to open another application.
 */
export interface TfOpenAppPayload {
  /** Target app ID from module registry */
  appId: string;
  /** Whether to focus the opened window (default: true) */
  focus?: boolean;
}

/**
 * Badge states for TF_SET_BADGE messages
 */
export type TfBadgeState = 'idle' | 'busy' | 'warn' | 'error';

/**
 * Payload for TF_SET_BADGE messages.
 * Sets the app's status badge in taskbar/start menu.
 */
export interface TfSetBadgePayload {
  /** Badge state */
  state: TfBadgeState;
  /** Optional label text */
  label?: string;
}

// ============================================================================
// Type Guards (Runtime Validation)
// ============================================================================

/**
 * Valid log levels for runtime validation
 */
const VALID_LOG_LEVELS: readonly TfLogLevel[] = ['debug', 'info', 'warn', 'error'];

/**
 * Valid badge states for runtime validation
 */
const VALID_BADGE_STATES: readonly TfBadgeState[] = ['idle', 'busy', 'warn', 'error'];

/**
 * Type guard to validate an IPC envelope.
 * Use this on incoming postMessage events before processing.
 */
export function isTfIpcEnvelope(value: unknown): value is TfIpcEnvelope {
  if (value === null || value === undefined) return false;
  if (typeof value !== 'object') return false;
  if (Array.isArray(value)) return false;

  const obj = value as Record<string, unknown>;

  // Must have tf field equal to protocol version
  if (obj.tf !== TF_PROTOCOL_VERSION) return false;

  // Must have string type field
  if (typeof obj.type !== 'string') return false;

  // Must have payload field (can be any value including null)
  if (!('payload' in obj)) return false;

  return true;
}

/**
 * Type guard for TF_SYSTEM_LOG payload
 */
export function isTfSystemLogPayload(value: unknown): value is TfSystemLogPayload {
  if (value === null || value === undefined) return false;
  if (typeof value !== 'object') return false;

  const obj = value as Record<string, unknown>;

  // Must have valid level
  if (!VALID_LOG_LEVELS.includes(obj.level as TfLogLevel)) return false;

  // Must have string message
  if (typeof obj.message !== 'string') return false;

  // topic is optional but must be string if present
  if ('topic' in obj && obj.topic !== undefined && typeof obj.topic !== 'string') return false;

  return true;
}

/**
 * Type guard for TF_OPEN_APP payload
 */
export function isTfOpenAppPayload(value: unknown): value is TfOpenAppPayload {
  if (value === null || value === undefined) return false;
  if (typeof value !== 'object') return false;

  const obj = value as Record<string, unknown>;

  // Must have non-empty string appId
  if (typeof obj.appId !== 'string' || obj.appId.length === 0) return false;

  // focus is optional but must be boolean if present
  if ('focus' in obj && obj.focus !== undefined && typeof obj.focus !== 'boolean') return false;

  return true;
}

/**
 * Type guard for TF_SET_BADGE payload
 */
export function isTfSetBadgePayload(value: unknown): value is TfSetBadgePayload {
  if (value === null || value === undefined) return false;
  if (typeof value !== 'object') return false;

  const obj = value as Record<string, unknown>;

  // Must have valid state
  if (!VALID_BADGE_STATES.includes(obj.state as TfBadgeState)) return false;

  // label is optional but must be string if present
  if ('label' in obj && obj.label !== undefined && typeof obj.label !== 'string') return false;

  return true;
}

// ============================================================================
// Typed Envelope Helpers
// ============================================================================

/**
 * Type alias for a system log message envelope
 */
export type TfSystemLogEnvelope = TfIpcEnvelope<TfSystemLogPayload>;

/**
 * Type alias for an open app message envelope
 */
export type TfOpenAppEnvelope = TfIpcEnvelope<TfOpenAppPayload>;

/**
 * Type alias for a set badge message envelope
 */
export type TfSetBadgeEnvelope = TfIpcEnvelope<TfSetBadgePayload>;

// ============================================================================
// Full Message Type Guards (envelope + payload combined)
// ============================================================================

/**
 * Type guard for complete TF_SYSTEM_LOG message (envelope + payload)
 */
export function isTfSystemLog(
  value: unknown
): value is TfIpcEnvelope<TfSystemLogPayload> & { type: 'TF_SYSTEM_LOG' } {
  if (!isTfIpcEnvelope(value)) return false;
  if (value.type !== TF_MESSAGE_TYPES.SYSTEM_LOG) return false;
  return isTfSystemLogPayload(value.payload);
}

/**
 * Type guard for complete TF_OPEN_APP message (envelope + payload)
 */
export function isTfOpenApp(
  value: unknown
): value is TfIpcEnvelope<TfOpenAppPayload> & { type: 'TF_OPEN_APP' } {
  if (!isTfIpcEnvelope(value)) return false;
  if (value.type !== TF_MESSAGE_TYPES.OPEN_APP) return false;
  return isTfOpenAppPayload(value.payload);
}

/**
 * Type guard for complete TF_SET_BADGE message (envelope + payload)
 */
export function isTfSetBadge(
  value: unknown
): value is TfIpcEnvelope<TfSetBadgePayload> & { type: 'TF_SET_BADGE' } {
  if (!isTfIpcEnvelope(value)) return false;
  if (value.type !== TF_MESSAGE_TYPES.SET_BADGE) return false;
  return isTfSetBadgePayload(value.payload);
}
