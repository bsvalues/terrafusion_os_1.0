// GENERATED - DO NOT EDIT
"use strict";
/**
 * TerraFusion OS - Trace Service
 *
 * Append-only trace event service with PII-safe payload handling.
 * Enforces Gate 6 (tracePolicy) at runtime.
 *
 * MVP: In-memory ring buffer. Production: persistent storage.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCHEMA_VERSION = exports.DEFAULT_RING_BUFFER_SIZE = exports.traceService = exports.TraceService = void 0;
const crypto_1 = require("crypto");
const sanitizeForTrace_js_1 = require("../security/sanitizeForTrace.js");
// ============================================================================
// Constants
// ============================================================================
const SCHEMA_VERSION = '1.0.0';
exports.SCHEMA_VERSION = SCHEMA_VERSION;
const DEFAULT_RING_BUFFER_SIZE = 10000;
exports.DEFAULT_RING_BUFFER_SIZE = DEFAULT_RING_BUFFER_SIZE;
class PayloadReferenceStore {
    constructor() {
        this.payloads = new Map();
    }
    /**
     * Store a payload and return a reference.
     */
    store(payload, store) {
        const ref = `payload-${(0, crypto_1.randomUUID)()}`;
        const stored = {
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
    retrieve(ref) {
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
    getStoreType(ref) {
        return this.payloads.get(ref)?.store;
    }
    /**
     * Clear all stored payloads (for testing).
     */
    clear() {
        this.payloads.clear();
    }
}
class TraceService {
    constructor(options = {}) {
        this.events = [];
        this.ringBufferSize = options.ringBufferSize ?? DEFAULT_RING_BUFFER_SIZE;
        this.enablePayloadStore = options.enablePayloadStore ?? true;
        this.payloadStore = new PayloadReferenceStore();
        this.devAuditEnabled = !!process.env.TF_DEV_AUDIT;
        if (this.devAuditEnabled) {
            try {
                // lazy-load dev adapter
                const storeKind = process.env.TF_DEV_AUDIT_STORE || 'file';
                if (storeKind === 'sqlite') {
                    // prefer sqlite-backed adapter when requested
                    // CommonJS module
                    // eslint-disable-next-line global-require, import/no-dynamic-require
                    this.devAdapter = require('./devSqliteAdapter.cjs');
                }
                else {
                    // fallback to file-based ESM adapter
                    // eslint-disable-next-line global-require, import/no-dynamic-require
                    this.devAdapter = require('./devAuditAdapter.mjs');
                }
            }
            catch (e) {
                // ignore - adapter optional
                // eslint-disable-next-line no-console
                console.error('Dev audit adapter failed to load', e && e.message);
                this.devAdapter = null;
            }
        }
    }
    /**
     * Emit a trace event.
     * This is an append-only operation - events cannot be deleted or modified.
     */
    emit(input) {
        const event = {
            ...input,
            eventId: (0, crypto_1.randomUUID)(),
            timestamp: new Date().toISOString(),
            schemaVersion: SCHEMA_VERSION,
        };
        // Append to ring buffer
        this.events.push(event);
        // Persist to dev-adapter if enabled (best-effort)
        if (this.devAuditEnabled && this.devAdapter && typeof this.devAdapter.persistEvent === 'function') {
            try {
                this.devAdapter.persistEvent(event);
            }
            catch (_err) {
                // swallow dev persistence errors
            }
        }
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
    emitWithPiiHandling(input, piiHandling, rawPayload, targetStore) {
        let processedInput = { ...input };
        if (piiHandling === 'sanitize' && rawPayload) {
            // Sanitize the payload for the summary
            const sanitized = (0, sanitizeForTrace_js_1.sanitizeForTrace)(rawPayload);
            processedInput.summary = `${input.summary} ${sanitized.summary}`;
            processedInput.redactedFields = sanitized.redactedFields;
        }
        else if (piiHandling === 'payload_ref' && rawPayload) {
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
            // persist payload in dev adapter if enabled
            if (this.devAuditEnabled && this.devAdapter && typeof this.devAdapter.storePayload === 'function') {
                try {
                    this.devAdapter.storePayload(ref, rawPayload, targetStore);
                }
                catch (_err) {
                    // swallow
                }
            }
        }
        // piiHandling === 'none': no processing needed
        return this.emit(processedInput);
    }
    /**
     * Query trace events.
     * Events are immutable - this returns copies.
     */
    query(options = {}) {
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
    getEvent(eventId) {
        const event = this.events.find(e => e.eventId === eventId);
        return event ? { ...event } : undefined;
    }
    /**
     * Get events by correlation ID.
     * Returns all events for a single tool invocation.
     */
    getByCorrelationId(correlationId) {
        return this.query({ correlationId });
    }
    /**
     * Retrieve a stored payload by reference.
     * Returns undefined if not found or payload storage is disabled.
     */
    retrievePayload(ref) {
        if (!this.enablePayloadStore) {
            return undefined;
        }
        return this.payloadStore.retrieve(ref);
    }
    /**
     * Get the current event count.
     */
    getEventCount() {
        return this.events.length;
    }
    /**
     * Get the ring buffer capacity.
     */
    getCapacity() {
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
    emitRedactionRequest(input, targetPayloadRefs, reasonCode, supervisorApproval) {
        const ticketId = `REDACT-${Date.now()}-${(0, crypto_1.randomUUID)().slice(0, 8)}`;
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
    clear() {
        this.events = [];
        this.payloadStore.clear();
    }
}
exports.TraceService = TraceService;
// ============================================================================
// Singleton Instance
// ============================================================================
exports.traceService = new TraceService();
