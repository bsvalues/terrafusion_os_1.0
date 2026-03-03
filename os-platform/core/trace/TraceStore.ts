/**
 * TerraFusion OS - Trace Store Interface
 *
 * Abstraction layer for trace event persistence.
 * Implementations:
 *   - InMemoryTraceStore: dev/test (no persistence)
 *   - FileTraceStore: R1 production (append-only JSON lines, zero deps)
 *   - PostgresTraceStore: R2 future (Drizzle ORM, see schema.ts)
 */

import { readFileSync, appendFileSync, existsSync, mkdirSync, writeFileSync, renameSync } from 'fs';
import { dirname, join } from 'path';
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

  /**
   * Prune events older than retentionMs from now.
   * Returns the number of events removed.
   */
  prune(retentionMs: number): Promise<number>;

  /**
   * Get store statistics for observability.
   */
  stats(): Promise<TraceStoreStats>;
}

// ============================================================================
// Store Stats (for ops/health endpoints)
// ============================================================================

export interface TraceStoreStats {
  totalEvents: number;
  oldestTimestamp: string | null;
  newestTimestamp: string | null;
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
  /** Parcel index: parcelId → set of array indices for O(1) lookup */
  private parcelIndex: Map<string, Set<number>> = new Map();

  constructor(options: InMemoryTraceStoreOptions = {}) {
    this.maxEvents = options.maxEvents ?? 10000;
  }

  async append(event: TraceEvent): Promise<TraceEvent> {
    this.events.push(event);
    // Update parcel index
    const pid = event.context.parcelId;
    if (pid) {
      if (!this.parcelIndex.has(pid)) this.parcelIndex.set(pid, new Set());
      this.parcelIndex.get(pid)!.add(this.events.length - 1);
    }

    // Trim if over capacity
    if (this.events.length > this.maxEvents) {
      const trimCount = this.events.length - this.maxEvents;
      this.rebuildIndex(trimCount);
      this.events.splice(0, trimCount);
    }

    return event;
  }

  /** Rebuild parcel index after trimming first N events */
  private rebuildIndex(trimCount: number): void {
    this.parcelIndex.clear();
    for (let i = trimCount; i < this.events.length; i++) {
      const pid = this.events[i].context.parcelId;
      if (pid) {
        if (!this.parcelIndex.has(pid)) this.parcelIndex.set(pid, new Set());
        this.parcelIndex.get(pid)!.add(i - trimCount);
      }
    }
  }

  async query(options: TraceQueryOptions = {}): Promise<TraceEvent[]> {
    // Use parcel index for the hot path when parcelId is specified
    let results: TraceEvent[];
    if (options.parcelId && this.parcelIndex.has(options.parcelId)) {
      const indices = this.parcelIndex.get(options.parcelId)!;
      results = [];
      for (const idx of indices) {
        if (idx < this.events.length) results.push(this.events[idx]);
      }
    } else if (options.parcelId) {
      // parcelId specified but not in index — empty result
      results = [];
    } else {
      results = [...this.events];
    }

    // Apply remaining filters
    if (options.toolId) {
      results = results.filter(e => e.toolId === options.toolId);
    }
    if (options.correlationId) {
      results = results.filter(e => e.correlationId === options.correlationId);
    }
    if (options.type) {
      results = results.filter(e => e.type === options.type);
    }
    if (!options.parcelId && options.dossierId) {
      // parcelId already handled above; dossierId is a separate filter
      results = results.filter(e => e.context.dossierId === options.dossierId);
    }
    if (options.parcelId) {
      // dossierId filter still applies even when parcel-indexed
      if (options.dossierId) {
        results = results.filter(e => e.context.dossierId === options.dossierId);
      }
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

  async prune(retentionMs: number): Promise<number> {
    const cutoff = Date.now() - retentionMs;
    const before = this.events.length;
    this.events = this.events.filter(
      e => new Date(e.timestamp).getTime() >= cutoff
    );
    const removed = before - this.events.length;
    if (removed > 0) this.rebuildIndex(0);
    return removed;
  }

  async stats(): Promise<TraceStoreStats> {
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
   * Clear all events (for testing).
   */
  clear(): void {
    this.events = [];
    this.parcelIndex.clear();
  }
}

// ============================================================================
// File-Based Implementation (R1 Production — zero external deps)
// ============================================================================

export interface FileTraceStoreOptions {
  /** Path to the trace events file (JSON lines format) */
  filePath: string;
  /** Flush interval in ms for in-memory cache sync (default: 0 = sync writes) */
  flushIntervalMs?: number;
}

/**
 * Append-only file-based trace store using JSON lines format.
 * Each line is a complete serialized TraceEvent.
 *
 * Properties:
 *   - PERSISTENT: survives process restarts
 *   - APPEND-ONLY: no updates, no deletes
 *   - ZERO-DEP: uses only Node.js built-ins (fs, path)
 *   - QUERY: loads into memory for filtering (adequate for R1 volumes)
 *
 * For high-volume production, migrate to PostgresTraceStore (R2).
 */
export class FileTraceStore implements TraceStore {
  private events: TraceEvent[] = [];
  private filePath: string;
  private loaded = false;
  /** Count of malformed lines skipped during load (corruption metric) */
  private corruptLineCount = 0;

  constructor(options: FileTraceStoreOptions) {
    this.filePath = options.filePath;
  }

  /** Number of malformed lines skipped during last load */
  getCorruptLineCount(): number {
    return this.corruptLineCount;
  }

  /**
   * Ensure events are loaded from disk. Idempotent.
   */
  private ensureLoaded(): void {
    if (this.loaded) return;
    this.loaded = true;

    if (!existsSync(this.filePath)) {
      const dir = dirname(this.filePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(this.filePath, '', 'utf-8');
      return;
    }

    const raw = readFileSync(this.filePath, 'utf-8');
    const lines = raw.split('\n').filter(line => line.trim().length > 0);

    for (const line of lines) {
      try {
        const event = JSON.parse(line) as TraceEvent;
        this.events.push(event);
      } catch {
        // Skip malformed lines — append-only means we never fix them
        this.corruptLineCount++;
      }
    }
  }

  async append(event: TraceEvent): Promise<TraceEvent> {
    this.ensureLoaded();
    this.events.push(event);

    // Append to file (sync for durability)
    const dir = dirname(this.filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    appendFileSync(this.filePath, JSON.stringify(event) + '\n', 'utf-8');

    return event;
  }

  async query(options: TraceQueryOptions = {}): Promise<TraceEvent[]> {
    this.ensureLoaded();
    let results = [...this.events];

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

    const offset = options.offset ?? 0;
    const limit = options.limit ?? 100;
    return results.slice(offset, offset + limit);
  }

  async queryByCountyAndWindow(
    countyId: string,
    since: Date,
    limit: number = 100000
  ): Promise<TraceEvent[]> {
    this.ensureLoaded();
    return this.events
      .filter(e => e.context.countyId === countyId && new Date(e.timestamp) >= since)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async getById(eventId: string): Promise<TraceEvent | undefined> {
    this.ensureLoaded();
    return this.events.find(e => e.eventId === eventId);
  }

  async getByCorrelationId(correlationId: string, countyId?: string): Promise<TraceEvent[]> {
    this.ensureLoaded();
    let results = this.events.filter(e => e.correlationId === correlationId);
    if (countyId) {
      results = results.filter(e => e.context.countyId === countyId);
    }
    return results.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  async count(countyId?: string): Promise<number> {
    this.ensureLoaded();
    if (countyId) {
      return this.events.filter(e => e.context.countyId === countyId).length;
    }
    return this.events.length;
  }

  async healthy(): Promise<boolean> {
    try {
      this.ensureLoaded();
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    // No-op — sync writes mean nothing to flush
  }

  async prune(retentionMs: number): Promise<number> {
    this.ensureLoaded();
    const cutoff = Date.now() - retentionMs;
    const before = this.events.length;
    this.events = this.events.filter(
      e => new Date(e.timestamp).getTime() >= cutoff
    );
    const removed = before - this.events.length;
    if (removed > 0) {
      // Atomic rewrite: write to temp file, then rename (prevents partial writes on crash)
      const tmpPath = this.filePath + '.tmp';
      const lines = this.events.map(e => JSON.stringify(e)).join('\n');
      writeFileSync(tmpPath, lines.length > 0 ? lines + '\n' : '', 'utf-8');
      renameSync(tmpPath, this.filePath);
    }
    return removed;
  }

  async stats(): Promise<TraceStoreStats> {
    this.ensureLoaded();
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

  /** Clear events (testing only — rewrites the file) */
  clear(): void {
    this.events = [];
    if (existsSync(this.filePath)) {
      writeFileSync(this.filePath, '', 'utf-8');
    }
  }
}

// ============================================================================
// Factory
// ============================================================================

export type TraceStoreType = 'memory' | 'file';

export interface TraceStoreConfig {
  type: TraceStoreType;
  memory?: InMemoryTraceStoreOptions;
  file?: FileTraceStoreOptions;
}

/**
 * Create a TraceStore from configuration.
 * Default: 'memory' for dev/test, 'file' for persistence.
 */
export function createTraceStore(config: TraceStoreConfig): TraceStore {
  switch (config.type) {
    case 'memory':
      return new InMemoryTraceStore(config.memory);
    case 'file':
      if (!config.file) {
        throw new Error('FileTraceStoreOptions required for file type');
      }
      return new FileTraceStore(config.file);
    default:
      throw new Error(`Unknown trace store type: ${config.type}`);
  }
}
