/**
 * TerraFusion OS Parcel Context Trace Events
 *
 * Audit trail for parcel context changes via TerraTrace events.
 * All context changes are logged with hash-friendly payloads (no PII).
 *
 * Events:
 * - parcel_context_set: Parcel context was established
 * - parcel_context_cleared: Parcel context was cleared
 *
 * @module context/parcelContextTrace
 * @see Slice 10: Parcel Context UX Surface
 */

import { clearParcelContext, getParcelContext, setParcelContext } from './parcelContext';

// ============================================================================
// Types
// ============================================================================

/**
 * Parcel context event types for TerraTrace.
 */
export enum ParcelContextEventType {
  SET = 'parcel_context_set',
  CLEARED = 'parcel_context_cleared',
}

/**
 * Source surface where context change originated.
 */
export type ParcelContextSurface =
  | 'launcher'
  | 'standalone'
  | 'workbench'
  | 'shellhome'
  | 'route'
  | 'selection'
  | 'session'
  | 'user_action';

/**
 * TerraTrace event payload for parcel context changes.
 * Safe for logging - contains hashes, not raw PII.
 */
export interface ParcelContextTracePayload {
  /** Hashed parcel ID (for correlation, not identification) */
  parcelIdHash?: string;
  /** Previous parcel ID hash (for clear events) */
  previousParcelIdHash?: string;
  /** Source surface of the change */
  source: ParcelContextSurface;
}

/**
 * Full TerraTrace event structure.
 */
export interface ParcelContextTraceEvent {
  /** Event type */
  type: ParcelContextEventType;
  /** Event timestamp (epoch ms) */
  timestamp: number;
  /** Event payload */
  payload: ParcelContextTracePayload;
}

// ============================================================================
// Event Name
// ============================================================================

/**
 * Custom event name for parcel context trace events.
 * Listeners can subscribe to window events with this name.
 */
export const PARCEL_CONTEXT_EVENT_NAME = 'terratrace:parcel_context';

// ============================================================================
// Hash Utility
// ============================================================================

/**
 * Simple hash function for parcel IDs.
 * Creates a tamper-evident but non-reversible identifier.
 *
 * Note: This is NOT cryptographic security - just for correlation/audit.
 * For true security, use server-side hashing with salt.
 */
export function hashParcelId(parcelId: string): string {
  let hash = 0;
  for (let i = 0; i < parcelId.length; i++) {
    const char = parcelId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to positive hex string
  return `h-${Math.abs(hash).toString(16)}`;
}

// ============================================================================
// Event Emission
// ============================================================================

/**
 * Emit a TerraTrace event for parcel context changes.
 *
 * @param type - Event type (SET or CLEARED)
 * @param payload - Event payload (hashed, safe)
 */
export function emitParcelContextEvent(
  type: ParcelContextEventType,
  payload: ParcelContextTracePayload
): void {
  const event: ParcelContextTraceEvent = {
    type,
    timestamp: Date.now(),
    payload,
  };

  window.dispatchEvent(
    new CustomEvent(PARCEL_CONTEXT_EVENT_NAME, {
      detail: event,
    })
  );
}

// ============================================================================
// Traced Context Actions
// ============================================================================

/**
 * Set parcel context with trace event emission.
 *
 * @param context - The parcel context to set
 * @param surface - The surface where the change originated
 */
export function setParcelContextWithTrace(
  context: { parcelId: string; parcelName?: string; source?: string },
  surface?: ParcelContextSurface
): void {
  // Set the context
  setParcelContext({
    parcelId: context.parcelId,
    parcelName: context.parcelName,
    source: context.source as any,
  });

  // Emit trace event
  emitParcelContextEvent(ParcelContextEventType.SET, {
    parcelIdHash: hashParcelId(context.parcelId),
    source: surface ?? (context.source as ParcelContextSurface) ?? 'selection',
  });
}

/**
 * Clear parcel context with trace event emission.
 *
 * @param previousParcelId - The parcel ID being cleared (for audit)
 * @param surface - The surface where the clear originated
 */
export function clearParcelContextWithTrace(
  previousParcelId?: string,
  surface: ParcelContextSurface = 'user_action'
): void {
  // Get current context if previousParcelId not provided
  const current = previousParcelId ?? getParcelContext()?.parcelId;

  // Clear the context
  clearParcelContext();

  // Emit trace event
  emitParcelContextEvent(ParcelContextEventType.CLEARED, {
    previousParcelIdHash: current ? hashParcelId(current) : undefined,
    source: surface,
  });
}

// ============================================================================
// Event Listener Helpers
// ============================================================================

/**
 * Subscribe to parcel context trace events.
 *
 * @param callback - Handler for trace events
 * @returns Unsubscribe function
 */
export function onParcelContextEvent(
  callback: (event: ParcelContextTraceEvent) => void
): () => void {
  const handler = (e: CustomEvent<ParcelContextTraceEvent>) => {
    callback(e.detail);
  };

  window.addEventListener(PARCEL_CONTEXT_EVENT_NAME, handler as EventListener);

  return () => {
    window.removeEventListener(PARCEL_CONTEXT_EVENT_NAME, handler as EventListener);
  };
}
