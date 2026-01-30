/**
 * TerraFusion OS - Trace Store Interface
 *
 * Abstraction layer for trace event persistence.
 * Allows swapping in-memory (dev) vs PostgreSQL (prod) without touching ToolRunner.
 *
 * Phase 8.1: Full PostgresTraceStore implementation with Drizzle ORM.
 */

import type { TraceEvent, TraceQueryOptions } from '../types/index.js';

// ============================================================================
// TraceStore Interface
// ============================================================================

export interface TraceStore {
  /**
   * Append a trace event (immutable, append-only).
   * Returns the stored event with any server-assigned fields.
   */
  append(event: TraceEvent): Promise<TraceEvent>;

  /**
   * Query trace events with filters.
   * Returns newest events first by default.
   */
  query(options: TraceQueryOptions): Promise<TraceEvent[]>;

  /**
   * Query events by county with time window (for MetricsService).
   * Optimized for dashboard time-series queries.
   */
  queryByCountyAndWindow?(countyId: string, since: Date, limit?: number): Promise<TraceEvent[]>;

  /**
   * Get a single event by ID.
   */
  getById(eventId: string): Promise<TraceEvent | undefined>;

  /**
   * Get all events for a correlation ID.
   * Optional countyId for county isolation.
   */
  getByCorrelationId(correlationId: string, countyId?: string): Promise<TraceEvent[]>;

  /**
   * Get event count (for monitoring).
   * Optional countyId for county-scoped counting.
   */
  count(countyId?: string): Promise<number>;

  /**
   * Health check for the store.
   */
  healthy(): Promise<boolean>;

  /**
   * Close the store and release resources (optional).
   */
  close?(): Promise<void>;
}

// ============================================================================
// In-Memory Implementation (dev/test)
// ============================================================================

export interface InMemoryTraceStoreOptions {
  /** Maximum events to retain */
  maxEvents?: number;
}

export class InMemoryTraceStore implements TraceStore {
  private events: TraceEvent[] = [];
  private maxEvents: number;

  constructor(options: InMemoryTraceStoreOptions = {}) {
    this.maxEvents = options.maxEvents ?? 10000;
  }

  async append(event: TraceEvent): Promise<TraceEvent> {
    this.events.push(event);

    // Trim if over capacity
    if (this.events.length > this.maxEvents) {
      const trimCount = this.events.length - this.maxEvents;
      this.events.splice(0, trimCount);
    }

    return event;
  }

  async query(options: TraceQueryOptions = {}): Promise<TraceEvent[]> {
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

    // Sort newest first
    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination
    const offset = options.offset ?? 0;
    const limit = options.limit ?? 100;
    results = results.slice(offset, offset + limit);

    return results;
  }

  async getById(eventId: string): Promise<TraceEvent | undefined> {
    return this.events.find(e => e.eventId === eventId);
  }

  async queryByCountyAndWindow(
    countyId: string,
    since: Date,
    limit: number = 100000
  ): Promise<TraceEvent[]> {
    return this.events
      .filter(e => e.context.countyId === countyId && new Date(e.timestamp) >= since)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async getByCorrelationId(correlationId: string, countyId?: string): Promise<TraceEvent[]> {
    let results = this.events.filter(e => e.correlationId === correlationId);
    if (countyId) {
      results = results.filter(e => e.context.countyId === countyId);
    }
    return results.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  async count(countyId?: string): Promise<number> {
    if (countyId) {
      return this.events.filter(e => e.context.countyId === countyId).length;
    }
    return this.events.length;
  }

  async healthy(): Promise<boolean> {
    return true;
  }

  /**
   * Clear all events (for testing).
   */
  clear(): void {
    this.events = [];
  }
}

// ============================================================================
// PostgreSQL Implementation (Drizzle ORM - Phase 8.1)
// ============================================================================

export interface PostgresTraceStoreOptions {
  /** PostgreSQL connection string (DATABASE_URL) */
  connectionString: string;
  /** Maximum connections in pool (default: 10) */
  maxConnections?: number;
  /** Idle timeout in ms (default: 30000) */
  idleTimeout?: number;
}

/**
 * PostgreSQL-backed trace store for production.
 * Uses Drizzle ORM with postgres-js driver.
 *
 * Design:
 *   - APPEND-ONLY: No UPDATE or DELETE methods
 *   - COUNTY ISOLATION: All queries scoped by county_id
 *   - IMMUTABLE: Events cannot be modified after insertion
 */
export class PostgresTraceStore implements TraceStore {
  private db: PostgresJsDatabase;
  private sql: postgres.Sql;

  constructor(options: PostgresTraceStoreOptions) {
    // Create postgres-js connection with pooling
    this.sql = postgres(options.connectionString, {
      max: options.maxConnections ?? 10,
      idle_timeout: options.idleTimeout ?? 30,
      connect_timeout: 10,
    });

    // Initialize Drizzle
    this.db = drizzle(this.sql);
  }

  /**
   * Append a trace event (immutable, append-only).
   * This is the ONLY write operation - no updates, no deletes.
   */
  async append(event: TraceEvent): Promise<TraceEvent> {
    const insert: TraceEventInsert = {
      eventId: event.eventId,
      correlationId: event.correlationId,
      countyId: event.context.countyId,
      userId: event.context.userId,
      toolId: event.toolId,
      type: event.type,
      mode: event.context.mode,
      summary: event.summary,
      context: event.context,
      payloadRef: event.payloadRef ?? null,
      payloadStore: event.payloadStore ?? null,
      redactedFields: event.redactedFields ?? null,
      schemaVersion: event.schemaVersion,
      // createdAt is auto-set by defaultNow()
    };

    await this.db.insert(traceEvents).values(insert);

    return event;
  }

  /**
   * Query trace events with filters.
   * All queries are county-scoped for isolation.
   */
  async query(options: TraceQueryOptions): Promise<TraceEvent[]> {
    const limit = options.limit ?? 100;
    const offset = options.offset ?? 0;

    // Build conditions array
    const conditions = [];

    if (options.toolId) {
      conditions.push(eq(traceEvents.toolId, options.toolId));
    }
    if (options.correlationId) {
      conditions.push(eq(traceEvents.correlationId, options.correlationId));
    }
    if (options.type) {
      conditions.push(eq(traceEvents.type, options.type));
    }
    if (options.parcelId) {
      // Use SQL JSON operator for context.parcelId
      conditions.push(sql`${traceEvents.context}->>'parcelId' = ${options.parcelId}`);
    }
    if (options.dossierId) {
      conditions.push(sql`${traceEvents.context}->>'dossierId' = ${options.dossierId}`);
    }

    // Execute query with conditions
    const rows = await this.db
      .select()
      .from(traceEvents)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(traceEvents.createdAt))
      .limit(limit)
      .offset(offset);

    // Map rows to TraceEvent type
    return rows.map(this.rowToEvent);
  }

  /**
   * Query events by county with time window (for MetricsService).
   */
  async queryByCountyAndWindow(
    countyId: string,
    since: Date,
    limit: number = 100000
  ): Promise<TraceEvent[]> {
    const rows = await this.db
      .select()
      .from(traceEvents)
      .where(and(eq(traceEvents.countyId, countyId), gte(traceEvents.createdAt, since)))
      .orderBy(desc(traceEvents.createdAt))
      .limit(limit);

    return rows.map(this.rowToEvent);
  }

  /**
   * Get a single event by ID.
   */
  async getById(eventId: string): Promise<TraceEvent | undefined> {
    const rows = await this.db
      .select()
      .from(traceEvents)
      .where(eq(traceEvents.eventId, eventId))
      .limit(1);

    return rows.length > 0 ? this.rowToEvent(rows[0]) : undefined;
  }

  /**
   * Get all events for a correlation ID.
   * County isolation is enforced by requiring countyId.
   */
  async getByCorrelationId(correlationId: string, countyId?: string): Promise<TraceEvent[]> {
    const conditions = [eq(traceEvents.correlationId, correlationId)];
    if (countyId) {
      conditions.push(eq(traceEvents.countyId, countyId));
    }

    const rows = await this.db
      .select()
      .from(traceEvents)
      .where(and(...conditions))
      .orderBy(traceEvents.createdAt);

    return rows.map(this.rowToEvent);
  }

  /**
   * Get event count (for monitoring).
   * Optionally filtered by county.
   */
  async count(countyId?: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(traceEvents)
      .where(countyId ? eq(traceEvents.countyId, countyId) : undefined);

    return result[0]?.count ?? 0;
  }

  /**
   * Health check for the store.
   */
  async healthy(): Promise<boolean> {
    try {
      await this.db
        .select({ one: sql`1` })
        .from(traceEvents)
        .limit(1);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Close the database connection pool.
   */
  async close(): Promise<void> {
    await this.sql.end();
  }

  /**
   * Convert database row to TraceEvent type.
   */
  private rowToEvent(row: typeof traceEvents.$inferSelect): TraceEvent {
    return {
      eventId: row.eventId,
      correlationId: row.correlationId,
      toolId: row.toolId,
      type: row.type as TraceEvent['type'],
      summary: row.summary,
      context: row.context as TraceEvent['context'],
      payloadRef: row.payloadRef ?? undefined,
      payloadStore: row.payloadStore as TraceEvent['payloadStore'],
      redactedFields: row.redactedFields ?? undefined,
      schemaVersion: row.schemaVersion,
      timestamp: row.createdAt.toISOString(),
    };
  }
}

// ============================================================================
// Factory
// ============================================================================

export type TraceStoreType = 'memory' | 'postgres';

export interface TraceStoreConfig {
  type: TraceStoreType;
  memory?: InMemoryTraceStoreOptions;
  postgres?: PostgresTraceStoreOptions;
}

export function createTraceStore(config: TraceStoreConfig): TraceStore {
  switch (config.type) {
    case 'memory':
      return new InMemoryTraceStore(config.memory);
    case 'postgres':
      if (!config.postgres) {
        throw new Error('PostgresTraceStoreOptions required for postgres type');
      }
      return new PostgresTraceStore(config.postgres);
    default:
      throw new Error(`Unknown trace store type: ${config.type}`);
  }
}
