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

import type { TraceStore as CoreTraceStore } from '../trace/TraceStore.js';
import type { TraceEvent as CoreTraceEvent } from '../types/index.js';
import type {
  TraceStore as FeedTraceStore,
  TraceEvent as FeedTraceEvent,
  TraceQuery,
  Risk,
} from './trace-feed.js';

// ============================================================================
// Adapter Implementation
// ============================================================================

export class TraceFeedAdapter implements FeedTraceStore {
  private coreStore: CoreTraceStore;
  private riskLookup: Map<string, Risk>;

  /**
   * @param coreStore - The real TraceStore (FileTraceStore, InMemoryTraceStore, etc.)
   * @param riskMap - Optional map of toolId → risk level for feed enrichment
   */
  constructor(
    coreStore: CoreTraceStore,
    riskMap?: Map<string, Risk>
  ) {
    this.coreStore = coreStore;
    this.riskLookup = riskMap ?? new Map();
  }

  async listEvents(query: TraceQuery): Promise<FeedTraceEvent[]> {
    // Query core store with available filters
    const coreEvents = await this.coreStore.query({
      limit: query.limit ?? 100,
    });

    // Filter by countyId (required) and optional subjectId/since
    const filtered = coreEvents.filter(e => {
      if (e.context.countyId !== query.countyId) return false;
      if (query.subjectId && e.context.parcelId !== query.subjectId) return false;
      if (query.since && e.timestamp < query.since) return false;
      return true;
    });

    // Map core events to feed events
    return filtered
      .slice(0, query.limit ?? 100)
      .map(e => this.mapToFeedEvent(e));
  }

  private mapToFeedEvent(core: CoreTraceEvent): FeedTraceEvent {
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

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a TraceFeedAdapter that wraps a core TraceStore.
 *
 * @param coreStore - FileTraceStore or InMemoryTraceStore instance
 * @param riskMap - Optional risk level lookup (from tool manifest)
 */
export function createTraceFeedAdapter(
  coreStore: CoreTraceStore,
  riskMap?: Map<string, Risk>
): FeedTraceStore {
  return new TraceFeedAdapter(coreStore, riskMap);
}
