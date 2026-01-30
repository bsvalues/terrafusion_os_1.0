/**
 * TerraFusion OS - Trace Service
 *
 * Append-only trace event service with PII-safe payload handling.
 * Enforces Gate 6 (tracePolicy) at runtime.
 *
 * MVP: In-memory ring buffer. Production: persistent storage.
 */
import type { PayloadStore, TraceEvent, TraceEventInput, TraceQueryOptions } from '../types/index.js';
declare const SCHEMA_VERSION = "1.0.0";
declare const DEFAULT_RING_BUFFER_SIZE = 10000;
export interface TraceServiceOptions {
    /** Maximum events to retain in ring buffer */
    ringBufferSize?: number;
    /** Whether to enable payload storage */
    enablePayloadStore?: boolean;
}
export declare class TraceService {
    private events;
    private ringBufferSize;
    private payloadStore;
    private enablePayloadStore;
    constructor(options?: TraceServiceOptions);
    /**
     * Emit a trace event.
     * This is an append-only operation - events cannot be deleted or modified.
     */
    emit(input: TraceEventInput): TraceEvent;
    /**
     * Create a trace event with PII handling.
     * Applies sanitization or payload reference as appropriate.
     */
    emitWithPiiHandling(input: TraceEventInput, piiHandling: 'none' | 'sanitize' | 'payload_ref', rawPayload?: unknown, targetStore?: PayloadStore): TraceEvent;
    /**
     * Query trace events.
     * Events are immutable - this returns copies.
     */
    query(options?: TraceQueryOptions): TraceEvent[];
    /**
     * Get a specific event by ID.
     */
    getEvent(eventId: string): TraceEvent | undefined;
    /**
     * Get events by correlation ID.
     * Returns all events for a single tool invocation.
     */
    getByCorrelationId(correlationId: string): TraceEvent[];
    /**
     * Retrieve a stored payload by reference.
     * Returns undefined if not found or payload storage is disabled.
     */
    retrievePayload(ref: string): unknown | undefined;
    /**
     * Get the current event count.
     */
    getEventCount(): number;
    /**
     * Get the ring buffer capacity.
     */
    getCapacity(): number;
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
    emitRedactionRequest(input: Omit<TraceEventInput, 'type'>, targetPayloadRefs: string[], reasonCode: string, supervisorApproval: {
        approvedBy: string;
        role: string;
    }): {
        requestEvent: TraceEvent;
        ticketEvent: TraceEvent;
        ticketId: string;
    };
    /**
     * Clear all events (for testing only).
     * In production, this should be disabled or require special permissions.
     */
    clear(): void;
}
export declare const traceService: TraceService;
export { DEFAULT_RING_BUFFER_SIZE, SCHEMA_VERSION };
