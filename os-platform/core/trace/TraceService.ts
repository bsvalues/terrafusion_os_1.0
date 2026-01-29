/**
 * TerraFusion OS - Trace Service
 *
 * Append-only trace event service with PII-safe payload handling.
 * Enforces Gate 6 (tracePolicy) at runtime.
 *
 * MVP: In-memory ring buffer. Production: persistent storage.
 */

import { randomUUID } from 'crypto';
import { sanitizeForTrace } from '../security/sanitizeForTrace.js';
import type {
    PayloadStore,
    TraceEvent,
    TraceEventInput,
    TraceQueryOptions,
} from '../types/index.js';

// ============================================================================
// Constants
// ============================================================================

const SCHEMA_VERSION = '1.0.0';
const DEFAULT_RING_BUFFER_SIZE = 10000;

// ============================================================================
// Payload Reference Store (MVP: in-memory)
// ============================================================================

interface StoredPayload {
  ref: string;
  store: PayloadStore;
  payload: unknown;
  createdAt: string;
  expiresAt?: string;
}

class PayloadReferenceStore {
  private payloads: Map<string, StoredPayload> = new Map();

  /**
   * Store a payload and return a reference.
   */
  store(payload: unknown, store: PayloadStore): string {
    const ref = `payload-${randomUUID()}`;
    const stored: StoredPayload = {
      ref,
      store,
      payload,
      createdAt: new Date().toISOString(),
    };
    this.payloads.set(ref, stored);
    return ref;
  }

  /**
   * Retrieve a payload by reference.
   * Returns undefined if not found or expired.
   */
  retrieve(ref: string): unknown | undefined {
    const stored = this.payloads.get(ref);
    if (!stored) {
      return undefined;
    }
    if (stored.expiresAt && new Date(stored.expiresAt) < new Date()) {
      this.payloads.delete(ref);
      return undefined;
    }
    return stored.payload;
  }

  /**
   * Get store type for a reference.
   */
  getStoreType(ref: string): PayloadStore | undefined {
    return this.payloads.get(ref)?.store;
  }

  /**
   * Clear all stored payloads (for testing).
   */
  clear(): void {
    this.payloads.clear();
  }
}

// ============================================================================
// TraceService Class
// ============================================================================

export interface TraceServiceOptions {
  /** Maximum events to retain in ring buffer */
  ringBufferSize?: number;
  /** Whether to enable payload storage */
  enablePayloadStore?: boolean;
}

export class TraceService {
  private events: TraceEvent[] = [];
  private ringBufferSize: number;
  private payloadStore: PayloadReferenceStore;
  private enablePayloadStore: boolean;

  constructor(options: TraceServiceOptions = {}) {
    this.ringBufferSize = options.ringBufferSize ?? DEFAULT_RING_BUFFER_SIZE;
    this.enablePayloadStore = options.enablePayloadStore ?? true;
    this.payloadStore = new PayloadReferenceStore();
  }

  /**
   * Emit a trace event.
   * This is an append-only operation - events cannot be deleted or modified.
   */
  emit(input: TraceEventInput): TraceEvent {
    const event: TraceEvent = {
      ...input,
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      schemaVersion: SCHEMA_VERSION,
    };

    // Append to ring buffer
    this.events.push(event);

    // Trim if over capacity
    if (this.events.length > this.ringBufferSize) {
      const trimCount = this.events.length - this.ringBufferSize;
      this.events.splice(0, trimCount);
    }

    return event;
  }

  /**
   * Create a trace event with PII handling.
   * Applies sanitization or payload reference as appropriate.
   */
  emitWithPiiHandling(
    input: TraceEventInput,
    piiHandling: 'none' | 'sanitize' | 'payload_ref',
    rawPayload?: unknown,
    targetStore?: PayloadStore
  ): TraceEvent {
    let processedInput = { ...input };

    if (piiHandling === 'sanitize' && rawPayload) {
      // Sanitize the payload for the summary
      const sanitized = sanitizeForTrace(rawPayload);
      processedInput.summary = `${input.summary} ${sanitized.summary}`;
      processedInput.redactedFields = sanitized.redactedFields;
    } else if (piiHandling === 'payload_ref' && rawPayload) {
      // Store payload securely and reference it
      if (!this.enablePayloadStore) {
        throw new Error('Payload storage is disabled');
      }
      if (!targetStore) {
        throw new Error('payloadStore is required for payload_ref trace policy');
      }
      const ref = this.payloadStore.store(rawPayload, targetStore);
      processedInput.payloadRef = ref;
      processedInput.payloadStore = targetStore;
    }
    // piiHandling === 'none': no processing needed

    return this.emit(processedInput);
  }

  /**
   * Query trace events.
   * Events are immutable - this returns copies.
   */
  query(options: TraceQueryOptions = {}): TraceEvent[] {
    let results = [...this.events];

    // Apply filters
    if (options.toolId) {
      results = results.filter(e => e.toolId === options.toolId);
    }
    if (options.correlationId) {
      results = results.filter(e => e.correlationId === options.correlationId);
    }
    if (options.type) {
      results = results.filter(e => e.type === options.type);
    }
    if (options.parcelId) {
      results = results.filter(e => e.context.parcelId === options.parcelId);
    }
    if (options.dossierId) {
      results = results.filter(e => e.context.dossierId === options.dossierId);
    }

    // Apply pagination
    const offset = options.offset ?? 0;
    const limit = options.limit ?? 100;
    results = results.slice(offset, offset + limit);

    // Return copies (immutability guarantee)
    return results.map(e => ({ ...e }));
  }

  /**
   * Get a specific event by ID.
   */
  getEvent(eventId: string): TraceEvent | undefined {
    const event = this.events.find(e => e.eventId === eventId);
    return event ? { ...event } : undefined;
  }

  /**
   * Get events by correlation ID.
   * Returns all events for a single tool invocation.
   */
  getByCorrelationId(correlationId: string): TraceEvent[] {
    return this.query({ correlationId });
  }

  /**
   * Retrieve a stored payload by reference.
   * Returns undefined if not found or payload storage is disabled.
   */
  retrievePayload(ref: string): unknown | undefined {
    if (!this.enablePayloadStore) {
      return undefined;
    }
    return this.payloadStore.retrieve(ref);
  }

  /**
   * Get the current event count.
   */
  getEventCount(): number {
    return this.events.length;
  }

  /**
   * Get the ring buffer capacity.
   */
  getCapacity(): number {
    return this.ringBufferSize;
  }

  /**
   * Emit dual trace events for redaction requests.
   * This is the ONLY way to initiate a redaction workflow.
   *
   * Emits:
   *   1. redaction_requested - Immutable record of the request
   *   2. redaction_ticket_created - Trackable workflow ticket
   *
   * This makes redaction operationally trackable without touching original events.
   * Original trace events are NEVER modified - only payloads can be redacted.
   */
  emitRedactionRequest(
    input: Omit<TraceEventInput, 'type'>,
    targetPayloadRefs: string[],
    reasonCode: string,
    supervisorApproval: { approvedBy: string; role: string }
  ): { requestEvent: TraceEvent; ticketEvent: TraceEvent; ticketId: string } {
    const ticketId = `REDACT-${Date.now()}-${randomUUID().slice(0, 8)}`;

    // Event 1: redaction_requested (immutable audit record)
    const requestEvent = this.emit({
      ...input,
      type: 'redaction_requested',
      summary: `Redaction requested for ${targetPayloadRefs.length} payload(s). Reason: ${reasonCode}. Approved by: ${supervisorApproval.approvedBy} (${supervisorApproval.role})`,
    });

    // Event 2: redaction_ticket_created (trackable workflow)
    const ticketEvent = this.emit({
      ...input,
      type: 'redaction_ticket_created',
      summary: `Ticket ${ticketId} created. Awaiting secure deletion of ${targetPayloadRefs.length} payload(s).`,
    });

    return { requestEvent, ticketEvent, ticketId };
  }

  /**
   * Clear all events (for testing only).
   * In production, this should be disabled or require special permissions.
   */
  clear(): void {
    this.events = [];
    this.payloadStore.clear();
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const traceService = new TraceService();

// ============================================================================
// Export Types
// ============================================================================

export { DEFAULT_RING_BUFFER_SIZE, SCHEMA_VERSION };
