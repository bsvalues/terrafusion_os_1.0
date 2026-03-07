// GENERATED - DO NOT EDIT
"use strict";
/**
 * TerraTrace Feed Adapter
 *
 * Bridges the core TraceStore (os-platform/core/trace/TraceStore.ts) to the
 * trace-feed's TraceStore interface (terratrc/trace-feed.ts).
 *
 * This adapter allows the trace projection feed to query real persisted events
 * instead of requiring a separate mock data source.
 *
 * Field mapping (core → feed):
 *   eventId       → id
 *   timestamp     → ts
 *   context.userId → actorId
 *   context.countyId → countyId
 *   context.parcelId → subjectId
 *   toolId        → tool
 *   type          → kind
 *   summary       → message
 *   correlationId → correlationId
 *   tool.risk     → risk (requires manifest lookup, defaults to 'read_only')
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraceFeedAdapter = void 0;
exports.createTraceFeedAdapter = createTraceFeedAdapter;
// ============================================================================
// Adapter Implementation
// ============================================================================
class TraceFeedAdapter {
    /**
     * @param coreStore - The real TraceStore (FileTraceStore, InMemoryTraceStore, etc.)
     * @param riskMap - Optional map of toolId → risk level for feed enrichment
     */
    constructor(coreStore, riskMap) {
        this.coreStore = coreStore;
        this.riskLookup = riskMap ?? new Map();
    }
    async listEvents(query) {
        // Query core store with available filters
        const coreEvents = await this.coreStore.query({
            limit: query.limit ?? 100,
        });
        // Filter by countyId (required) and optional subjectId/since
        const filtered = coreEvents.filter(e => {
            if (e.context.countyId !== query.countyId)
                return false;
            if (query.subjectId && e.context.parcelId !== query.subjectId)
                return false;
            if (query.since && e.timestamp < query.since)
                return false;
            return true;
        });
        // Map core events to feed events
        return filtered
            .slice(0, query.limit ?? 100)
            .map(e => this.mapToFeedEvent(e));
    }
    mapToFeedEvent(core) {
        return {
            id: core.eventId,
            ts: core.timestamp,
            countyId: core.context.countyId,
            actorId: core.context.userId,
            subjectId: core.context.parcelId,
            tool: core.toolId,
            risk: this.riskLookup.get(core.toolId) ?? 'read_only',
            kind: core.type,
            message: core.summary,
            correlationId: core.correlationId,
        };
    }
}
exports.TraceFeedAdapter = TraceFeedAdapter;
// ============================================================================
// Factory
// ============================================================================
/**
 * Create a TraceFeedAdapter that wraps a core TraceStore.
 *
 * @param coreStore - FileTraceStore or InMemoryTraceStore instance
 * @param riskMap - Optional risk level lookup (from tool manifest)
 */
function createTraceFeedAdapter(coreStore, riskMap) {
    return new TraceFeedAdapter(coreStore, riskMap);
}
