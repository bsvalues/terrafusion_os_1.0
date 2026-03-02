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
const path_1 = require("path");
class InMemoryTraceStore {
    constructor(options = {}) {
        this.events = [];
        this.maxEvents = options.maxEvents ?? 10000;
    }
    async append(event) {
        this.events.push(event);
        // Trim if over capacity
        if (this.events.length > this.maxEvents) {
            const trimCount = this.events.length - this.maxEvents;
            this.events.splice(0, trimCount);
        }
        return event;
    }
    async query(options = {}) {
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
    /**
     * Clear all events (for testing).
     */
    clear() {
        this.events = [];
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
        this.filePath = options.filePath;
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
            }
        }
    }
    async append(event) {
        this.ensureLoaded();
        this.events.push(event);
        // Append to file (sync for durability)
        const dir = (0, path_1.dirname)(this.filePath);
        if (!(0, fs_1.existsSync)(dir)) {
            (0, fs_1.mkdirSync)(dir, { recursive: true });
        }
        (0, fs_1.appendFileSync)(this.filePath, JSON.stringify(event) + '\n', 'utf-8');
        return event;
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
        results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
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
