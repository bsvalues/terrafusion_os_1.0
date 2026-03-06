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
import type { TraceStore } from './TraceStore.js';
import type { TraceStoreStats } from './TraceStore.js';

// ============================================================================
// Constants
// ============================================================================

const SCHEMA_VERSION = '1.0.0';
const DEFAULT_RING_BUFFER_SIZE = 10000;

/**
 * Audit event types that must NEVER recursively generate additional audit events.
 * This is the service-level audit loop guard (Lane H).
 */
const AUDIT_EVENT_TYPES: ReadonlySet<string> = new Set([
  'trace_accessed',
  'permission_denied',
]);

/** Returns true if the event type is an audit/system-generated type. */
export function isAuditEventType(type: string): boolean {
  return AUDIT_EVENT_TYPES.has(type);
}

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
  /** Maximum events to retain in ring buffer (when no store provided) */
  ringBufferSize?: number;
  /** Whether to enable payload storage */
  enablePayloadStore?: boolean;
  /** Optional persistent store. When set, events are persisted via TraceStore. */
  store?: TraceStore;
  /** Retention window in ms. When set, prune() removes events older than this on demand. */
  retentionMs?: number;
}

export class TraceService {
  private events: TraceEvent[] = [];
  private ringBufferSize: number;
  private payloadStore: PayloadReferenceStore;
  private enablePayloadStore: boolean;
  private store: TraceStore | undefined;
  private retentionMs: number | undefined;
  /**
   * Audit loop guard flag. When true, we are inside an audit-event emit.
   * Any nested emit() call for an audit event type is suppressed.
   * This prevents future middleware or hooks from creating infinite audit chains.
   */
  private _insideAuditEmit = false;

  constructor(options: TraceServiceOptions = {}) {
    this.ringBufferSize = options.ringBufferSize ?? DEFAULT_RING_BUFFER_SIZE;
    this.enablePayloadStore = options.enablePayloadStore ?? true;
    this.payloadStore = new PayloadReferenceStore();
    this.store = options.store;
    this.retentionMs = options.retentionMs;
  }

  /**
   * Emit a trace event.
   * This is an append-only operation - events cannot be deleted or modified.
   */
  emit(input: TraceEventInput): TraceEvent {
    const isAudit = isAuditEventType(input.type);

    // Audit loop guard: if we are already inside an audit emit and this is
    // another audit event, suppress it to prevent recursive audit chains.
    // This is the central service-level guard (Lane H).
    if (isAudit && this._insideAuditEmit) {
      // Return a synthetic no-op event so callers don't crash
      return {
        ...input,
        eventId: `suppressed-${randomUUID()}`,
        timestamp: new Date().toISOString(),
        schemaVersion: SCHEMA_VERSION,
      };
    }

    if (isAudit) this._insideAuditEmit = true;
    try {
      const event: TraceEvent = {
        ...input,
        eventId: randomUUID(),
        timestamp: new Date().toISOString(),
        schemaVersion: SCHEMA_VERSION,
      };

      // Append to in-memory ring buffer (always, for fast query)
      this.events.push(event);
      if (this.events.length > this.ringBufferSize) {
        const trimCount = this.events.length - this.ringBufferSize;
        this.events.splice(0, trimCount);
      }

      // Persist if store is configured (fire-and-forget — don't block emit)
      if (this.store) {
        this.store.append(event).catch(() => {
          // Persistence failure is non-fatal for R1 — event is still in ring buffer
        });
      }

      return event;
    } finally {
      if (isAudit) this._insideAuditEmit = false;
    }
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
   * When a persistent store is configured, queries go through it.
   * Otherwise falls back to in-memory ring buffer.
   */
  query(options: TraceQueryOptions = {}): TraceEvent[] {
    // Synchronous path uses ring buffer (for backward compat with tests)
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
    if (options.from) {
      const fromMs = new Date(options.from).getTime();
      results = results.filter(e => new Date(e.timestamp).getTime() >= fromMs);
    }
    if (options.to) {
      const toMs = new Date(options.to).getTime();
      results = results.filter(e => new Date(e.timestamp).getTime() <= toMs);
    }

    // Sort newest first; tiebreak by correlationId for stable ordering
    results.sort((a, b) => {
      const dt = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (dt !== 0) return dt;
      return a.correlationId.localeCompare(b.correlationId);
    });

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
   * Async query — delegates to persistent store when available.
   * Use this for API endpoints that can await.
   */
  async queryAsync(options: TraceQueryOptions = {}): Promise<TraceEvent[]> {
    if (this.store) {
      return this.store.query(options);
    }
    return this.query(options);
  }

  /**
   * Async getByCorrelationId — delegates to persistent store.
   */
  async getByCorrelationIdAsync(correlationId: string, countyId?: string): Promise<TraceEvent[]> {
    if (this.store) {
      return this.store.getByCorrelationId(correlationId, countyId);
    }
    return this.getByCorrelationId(correlationId);
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
   * Prune events older than the configured retention window (or explicit retentionMs).
   * Prunes both in-memory ring buffer and persistent store.
   * Returns total events removed.
   */
  async prune(retentionMs?: number): Promise<number> {
    const window = retentionMs ?? this.retentionMs;
    if (!window || window <= 0) return 0;
    const cutoff = Date.now() - window;
    // Prune ring buffer
    const before = this.events.length;
    this.events = this.events.filter(
      e => new Date(e.timestamp).getTime() >= cutoff
    );
    let removed = before - this.events.length;
    // Prune persistent store
    if (this.store) {
      removed += await this.store.prune(window);
    }
    return removed;
  }

  /**
   * Get store statistics.
   * When persistent store is configured, delegates to it.
   * Otherwise reports ring buffer stats.
   */
  async stats(): Promise<TraceStoreStats> {
    if (this.store) {
      return this.store.stats();
    }
    if (this.events.length === 0) {
      return { totalEvents: 0, oldestTimestamp: null, newestTimestamp: null };
    }
    let oldest = this.events[0].timestamp;
    let newest = this.events[0].timestamp;
    for (const e of this.events) {
      if (e.timestamp < oldest) oldest = e.timestamp;
      if (e.timestamp > newest) newest = e.timestamp;
    }
    return { totalEvents: this.events.length, oldestTimestamp: oldest, newestTimestamp: newest };
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
// Audit Record Mapping
// ============================================================================

/**
 * Audit-facing record derived from a trace event.
 * Maps internal trace events to the fields required by FISMA audit exports:
 * who, what, decision, errorCode, reasonCode, correlationId, timestamp.
 */
export interface AuditRecord {
  correlationId: string;
  toolId: string;
  decision: 'blocked' | 'allowed' | 'failed' | 'redaction';
  errorCode: string | null;
  userId: string;
  countyId: string;
  roles: string[];
  reasonCode: string | null;
  timestamp: string;
  component: string | null;
  summary: string;
}

/** Event types that represent redaction workflow events. */
const REDACTION_EVENT_TYPES: ReadonlySet<string> = new Set([
  'redaction_requested',
  'redaction_ticket_created',
]);

/** PII patterns for audit summary sanitization. */
const AUDIT_SSN_PATTERN = /\b\d{3}-\d{2}-\d{4}\b/g;
const AUDIT_PHONE_PATTERN = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
const AUDIT_EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/gi;

/**
 * Sanitize an audit summary string by replacing PII tokens.
 * This ensures SSNs, phone numbers, and emails never appear in NDJSON exports.
 */
function sanitizeAuditSummary(summary: string): string {
  return summary
    .replace(AUDIT_SSN_PATTERN, '[SSN_REDACTED]')
    .replace(AUDIT_PHONE_PATTERN, '[PHONE_REDACTED]')
    .replace(AUDIT_EMAIL_PATTERN, '[EMAIL_REDACTED]');
}

/** Governance error codes that indicate a policy-blocked write attempt. */
const GOVERNANCE_ERROR_CODES: ReadonlySet<string> = new Set([
  'CONFIRMATION_REQUIRED',
  'REASON_CODE_REQUIRED',
  'REASON_CODE_INVALID',
  'PERMISSION_DENIED',
  'SUPERVISOR_APPROVAL_REQUIRED',
  'SUPERVISOR_ROLE_INVALID',
  'WRITE_LANE_MISMATCH',
  'WRITE_LANE_REQUIRED',
  'POLICY_DENIED',
]);

/**
 * Map a TraceEvent to an AuditRecord with an explicit `decision` field.
 *
 * Decision logic:
 *   - tool_failed + governance errorCode → "blocked"
 *   - tool_failed + other errorCode → "failed"
 *   - tool_completed → "allowed"
 *   - tool_invoked → "allowed" (in-progress)
 */
export function toAuditRecord(event: TraceEvent): AuditRecord {
  let decision: AuditRecord['decision'];
  if (REDACTION_EVENT_TYPES.has(event.type)) {
    decision = 'redaction';
  } else if (event.type === 'tool_failed') {
    decision = event.errorCode && GOVERNANCE_ERROR_CODES.has(event.errorCode)
      ? 'blocked'
      : 'failed';
  } else {
    decision = 'allowed';
  }

  return {
    correlationId: event.correlationId,
    toolId: event.toolId,
    decision,
    errorCode: event.errorCode ?? null,
    userId: event.context.userId,
    countyId: event.context.countyId,
    roles: [...event.context.roles],
    reasonCode: event.context.reasonCode ?? null,
    timestamp: event.timestamp,
    component: event.component ?? null,
    summary: sanitizeAuditSummary(event.summary),
  };
}

/**
 * Export trace events as NDJSON (newline-delimited JSON) audit records.
 * Each line is a self-contained JSON object suitable for log ingestion,
 * SIEM forwarding, or FISMA audit evidence packages.
 */
/** Options for NDJSON export with optional retention window and audit format. */
export interface ExportNDJSONOptions {
  auditFormat?: boolean;
  /** ISO 8601 lower bound (inclusive). Events before this are excluded. */
  from?: string;
  /** ISO 8601 upper bound (inclusive). Events after this are excluded. */
  to?: string;
}

export function exportNDJSON(
  events: TraceEvent[],
  options: ExportNDJSONOptions = {}
): string {
  let filtered = events;
  if (options.from) {
    filtered = filtered.filter(e => e.timestamp >= options.from);
  }
  if (options.to) {
    filtered = filtered.filter(e => e.timestamp <= options.to);
  }
  const mapper = options.auditFormat ? toAuditRecord : (e) => e;
  return filtered.map(e => JSON.stringify(mapper(e))).join('\n');
}

// ============================================================================
// Export Types
// ============================================================================

export { DEFAULT_RING_BUFFER_SIZE, SCHEMA_VERSION };
