// GENERATED - DO NOT EDIT
"use strict";
/**
 * TerraFusion OS - Trace Store Interface
 *
 * Abstraction layer for trace event persistence.
 * Implementations:
 *   - InMemoryTraceStore: dev/test (no persistence)
 *   - FileTraceStore: R1 production (append-only JSON lines, zero deps)
 *   - PostgresTraceStore: R2 future (Drizzle ORM, see schema.ts)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileTraceStore = exports.InMemoryTraceStore = void 0;
exports.createTraceStore = createTraceStore;
const fs_1 = require("fs");
const node_crypto_1 = require("node:crypto");
const path_1 = require("path");
// ============================================================================
// Hash chain helpers
// ============================================================================
function sha256Event(event) {
    return (0, node_crypto_1.createHash)('sha256')
        .update(JSON.stringify(event), 'utf8')
        .digest('hex');
}
const DEFAULT_PER_PARCEL_CAP = 2000;
class InMemoryTraceStore {
    constructor(options = {}) {
        this.events = [];
        /** Parcel index: parcelId → set of array indices for O(1) lookup */
        this.parcelIndex = new Map();
        this.maxEvents = options.maxEvents ?? 10000;
        this.perParcelCap = options.perParcelCap ?? DEFAULT_PER_PARCEL_CAP;
    }
    async append(event) {
        const lastEvent = this.events.length > 0 ? this.events[this.events.length - 1] : null;
        const nextEvent = {
            ...event,
            previousHash: lastEvent !== null ? sha256Event(lastEvent) : null,
        };
        this.events.push(nextEvent);
        // Update parcel index
        const pid = nextEvent.context.parcelId;
        if (pid) {
            if (!this.parcelIndex.has(pid))
                this.parcelIndex.set(pid, new Set());
            this.parcelIndex.get(pid).add(this.events.length - 1);
        }
        // Enforce per-parcel cap (retention-first, then cap)
        if (pid && this.perParcelCap > 0) {
            this.enforceParcelCap(pid);
        }
        // Trim if over capacity
        if (this.events.length > this.maxEvents) {
            const trimCount = this.events.length - this.maxEvents;
            this.rebuildIndex(trimCount);
            this.events.splice(0, trimCount);
        }
        return nextEvent;
    }
    /**
     * Enforce per-parcel cap: if a parcel exceeds the cap, remove its oldest
     * events (by timestamp ASC, correlationId ASC for deterministic ordering).
     */
    enforceParcelCap(parcelId) {
        const indices = this.parcelIndex.get(parcelId);
        if (!indices || indices.size <= this.perParcelCap)
            return;
        // Gather parcel events with their array indices
        const parcelEntries = [];
        for (const idx of indices) {
            if (idx < this.events.length) {
                parcelEntries.push({ idx, event: this.events[idx] });
            }
        }
        // Sort: newest first (timestamp DESC, correlationId ASC for ties)
        parcelEntries.sort((a, b) => {
            const dt = new Date(b.event.timestamp).getTime() - new Date(a.event.timestamp).getTime();
            if (dt !== 0)
                return dt;
            return a.event.correlationId.localeCompare(b.event.correlationId);
        });
        // Mark events beyond cap for removal
        const toRemove = new Set();
        for (let i = this.perParcelCap; i < parcelEntries.length; i++) {
            toRemove.add(parcelEntries[i].idx);
        }
        // Remove events and rebuild
        this.events = this.events.filter((_, i) => !toRemove.has(i));
        this.rebuildIndex(0);
    }
    /** Rebuild parcel index after trimming first N events */
    rebuildIndex(trimCount) {
        this.parcelIndex.clear();
        for (let i = trimCount; i < this.events.length; i++) {
            const pid = this.events[i].context.parcelId;
            if (pid) {
                if (!this.parcelIndex.has(pid))
                    this.parcelIndex.set(pid, new Set());
                this.parcelIndex.get(pid).add(i - trimCount);
            }
        }
    }
    async query(options = {}) {
        // Use parcel index for the hot path when parcelId is specified
        let results;
        if (options.parcelId && this.parcelIndex.has(options.parcelId)) {
            const indices = this.parcelIndex.get(options.parcelId);
            results = [];
            for (const idx of indices) {
                if (idx < this.events.length)
                    results.push(this.events[idx]);
            }
        }
        else if (options.parcelId) {
            // parcelId specified but not in index — empty result
            results = [];
        }
        else {
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
            if (dt !== 0)
                return dt;
            return a.correlationId.localeCompare(b.correlationId);
        });
        // Apply pagination
        const offset = options.offset ?? 0;
        const limit = options.limit ?? 100;
        results = results.slice(offset, offset + limit);
        return results;
    }
    async getById(eventId) {
        return this.events.find(e => e.eventId === eventId);
    }
    async queryByCountyAndWindow(countyId, since, limit = 100000) {
        return this.events
            .filter(e => e.context.countyId === countyId && new Date(e.timestamp) >= since)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, limit);
    }
    async getByCorrelationId(correlationId, countyId) {
        let results = this.events.filter(e => e.correlationId === correlationId);
        if (countyId) {
            results = results.filter(e => e.context.countyId === countyId);
        }
        return results.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }
    async count(countyId) {
        if (countyId) {
            return this.events.filter(e => e.context.countyId === countyId).length;
        }
        return this.events.length;
    }
    async healthy() {
        return true;
    }
    async prune(retentionMs) {
        const cutoff = Date.now() - retentionMs;
        const before = this.events.length;
        this.events = this.events.filter(e => new Date(e.timestamp).getTime() >= cutoff);
        const removed = before - this.events.length;
        if (removed > 0)
            this.rebuildIndex(0);
        return removed;
    }
    async stats() {
        if (this.events.length === 0) {
            return {
                totalEvents: 0,
                oldestTimestamp: null,
                newestTimestamp: null,
                perParcelCap: this.perParcelCap > 0 ? this.perParcelCap : undefined,
                cappedParcelsCount: 0,
                maxEventsInParcel: 0,
            };
        }
        let oldest = this.events[0].timestamp;
        let newest = this.events[0].timestamp;
        for (const e of this.events) {
            if (e.timestamp < oldest)
                oldest = e.timestamp;
            if (e.timestamp > newest)
                newest = e.timestamp;
        }
        // Per-parcel cap stats
        let cappedParcelsCount = 0;
        let maxEventsInParcel = 0;
        for (const [, indices] of this.parcelIndex) {
            if (indices.size > maxEventsInParcel)
                maxEventsInParcel = indices.size;
            if (this.perParcelCap > 0 && indices.size >= this.perParcelCap)
                cappedParcelsCount++;
        }
        return {
            totalEvents: this.events.length,
            oldestTimestamp: oldest,
            newestTimestamp: newest,
            perParcelCap: this.perParcelCap > 0 ? this.perParcelCap : undefined,
            cappedParcelsCount,
            maxEventsInParcel,
        };
    }
    /**
     * Clear all events (for testing).
     */
    clear() {
        this.events = [];
        this.parcelIndex.clear();
    }
}
exports.InMemoryTraceStore = InMemoryTraceStore;
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
class FileTraceStore {
    constructor(options) {
        this.events = [];
        this.loaded = false;
        /** Count of malformed lines skipped during load (corruption metric) */
        this.corruptLineCount = 0;
        this.filePath = options.filePath;
        this.perParcelCap = options.perParcelCap ?? DEFAULT_PER_PARCEL_CAP;
    }
    /** Number of malformed lines skipped during last load */
    getCorruptLineCount() {
        return this.corruptLineCount;
    }
    /**
     * Ensure events are loaded from disk. Idempotent.
     */
    ensureLoaded() {
        if (this.loaded)
            return;
        this.loaded = true;
        if (!(0, fs_1.existsSync)(this.filePath)) {
            const dir = (0, path_1.dirname)(this.filePath);
            if (!(0, fs_1.existsSync)(dir)) {
                (0, fs_1.mkdirSync)(dir, { recursive: true });
            }
            (0, fs_1.writeFileSync)(this.filePath, '', 'utf-8');
            return;
        }
        const raw = (0, fs_1.readFileSync)(this.filePath, 'utf-8');
        const lines = raw.split('\n').filter(line => line.trim().length > 0);
        for (const line of lines) {
            try {
                const event = JSON.parse(line);
                this.events.push(event);
            }
            catch {
                // Skip malformed lines — append-only means we never fix them
                this.corruptLineCount++;
            }
        }
    }
    async append(event) {
        this.ensureLoaded();
        const lastEvent = this.events.length > 0 ? this.events[this.events.length - 1] : null;
        const nextEvent = {
            ...event,
            previousHash: lastEvent !== null ? sha256Event(lastEvent) : null,
        };
        this.events.push(nextEvent);
        // Append to file (sync for durability)
        const dir = (0, path_1.dirname)(this.filePath);
        if (!(0, fs_1.existsSync)(dir)) {
            (0, fs_1.mkdirSync)(dir, { recursive: true });
        }
        (0, fs_1.appendFileSync)(this.filePath, JSON.stringify(nextEvent) + '\n', 'utf-8');
        return nextEvent;
    }
    async query(options = {}) {
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
            if (dt !== 0)
                return dt;
            return a.correlationId.localeCompare(b.correlationId);
        });
        const offset = options.offset ?? 0;
        const limit = options.limit ?? 100;
        return results.slice(offset, offset + limit);
    }
    async queryByCountyAndWindow(countyId, since, limit = 100000) {
        this.ensureLoaded();
        return this.events
            .filter(e => e.context.countyId === countyId && new Date(e.timestamp) >= since)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, limit);
    }
    async getById(eventId) {
        this.ensureLoaded();
        return this.events.find(e => e.eventId === eventId);
    }
    async getByCorrelationId(correlationId, countyId) {
        this.ensureLoaded();
        let results = this.events.filter(e => e.correlationId === correlationId);
        if (countyId) {
            results = results.filter(e => e.context.countyId === countyId);
        }
        return results.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }
    async count(countyId) {
        this.ensureLoaded();
        if (countyId) {
            return this.events.filter(e => e.context.countyId === countyId).length;
        }
        return this.events.length;
    }
    async healthy() {
        try {
            this.ensureLoaded();
            return true;
        }
        catch {
            return false;
        }
    }
    async close() {
        // No-op — sync writes mean nothing to flush
    }
    async prune(retentionMs) {
        this.ensureLoaded();
        const cutoff = Date.now() - retentionMs;
        const before = this.events.length;
        // Retention-first: drop events older than cutoff
        this.events = this.events.filter(e => new Date(e.timestamp).getTime() >= cutoff);
        // Then enforce per-parcel cap on surviving events
        if (this.perParcelCap > 0) {
            this.enforceAllParcelCaps();
        }
        const removed = before - this.events.length;
        if (removed > 0) {
            // Atomic rewrite: write to temp file, then rename (prevents partial writes on crash)
            const tmpPath = this.filePath + '.tmp';
            const lines = this.events.map(e => JSON.stringify(e)).join('\n');
            (0, fs_1.writeFileSync)(tmpPath, lines.length > 0 ? lines + '\n' : '', 'utf-8');
            (0, fs_1.renameSync)(tmpPath, this.filePath);
        }
        return removed;
    }
    /**
     * Enforce per-parcel cap across all parcels.
     * For each parcel, keep only the newest `perParcelCap` events.
     * Sort order: timestamp DESC, correlationId ASC (deterministic).
     */
    enforceAllParcelCaps() {
        // Group events by parcelId
        const parcelGroups = new Map();
        const noParcel = [];
        for (let i = 0; i < this.events.length; i++) {
            const pid = this.events[i].context.parcelId;
            if (pid) {
                if (!parcelGroups.has(pid))
                    parcelGroups.set(pid, []);
                parcelGroups.get(pid).push({ idx: i, event: this.events[i] });
            }
            else {
                noParcel.push(this.events[i]);
            }
        }
        // Check if any parcel exceeds cap
        let needsFilter = false;
        const toRemove = new Set();
        for (const [, entries] of parcelGroups) {
            if (entries.length <= this.perParcelCap)
                continue;
            needsFilter = true;
            // Sort newest first
            entries.sort((a, b) => {
                const dt = new Date(b.event.timestamp).getTime() - new Date(a.event.timestamp).getTime();
                if (dt !== 0)
                    return dt;
                return a.event.correlationId.localeCompare(b.event.correlationId);
            });
            for (let i = this.perParcelCap; i < entries.length; i++) {
                toRemove.add(entries[i].idx);
            }
        }
        if (needsFilter) {
            this.events = this.events.filter((_, i) => !toRemove.has(i));
        }
    }
    async stats() {
        this.ensureLoaded();
        if (this.events.length === 0) {
            return {
                totalEvents: 0,
                oldestTimestamp: null,
                newestTimestamp: null,
                perParcelCap: this.perParcelCap > 0 ? this.perParcelCap : undefined,
                cappedParcelsCount: 0,
                maxEventsInParcel: 0,
            };
        }
        let oldest = this.events[0].timestamp;
        let newest = this.events[0].timestamp;
        const parcelCounts = new Map();
        for (const e of this.events) {
            if (e.timestamp < oldest)
                oldest = e.timestamp;
            if (e.timestamp > newest)
                newest = e.timestamp;
            const pid = e.context.parcelId;
            if (pid) {
                parcelCounts.set(pid, (parcelCounts.get(pid) ?? 0) + 1);
            }
        }
        let cappedParcelsCount = 0;
        let maxEventsInParcel = 0;
        for (const [, count] of parcelCounts) {
            if (count > maxEventsInParcel)
                maxEventsInParcel = count;
            if (this.perParcelCap > 0 && count >= this.perParcelCap)
                cappedParcelsCount++;
        }
        return {
            totalEvents: this.events.length,
            oldestTimestamp: oldest,
            newestTimestamp: newest,
            perParcelCap: this.perParcelCap > 0 ? this.perParcelCap : undefined,
            cappedParcelsCount,
            maxEventsInParcel,
        };
    }
    /** Clear events (testing only — rewrites the file) */
    clear() {
        this.events = [];
        if ((0, fs_1.existsSync)(this.filePath)) {
            (0, fs_1.writeFileSync)(this.filePath, '', 'utf-8');
        }
    }
}
exports.FileTraceStore = FileTraceStore;
/**
 * Create a TraceStore from configuration.
 * Default: 'memory' for dev/test, 'file' for persistence.
 */
function createTraceStore(config) {
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
