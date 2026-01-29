// GENERATED - DO NOT EDIT
"use strict";
/**
 * TerraFusion OS - Trace Store Interface
 *
 * Abstraction layer for trace event persistence.
 * Allows swapping in-memory (dev) vs PostgreSQL (prod) without touching ToolRunner.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresTraceStore = exports.InMemoryTraceStore = void 0;
exports.createTraceStore = createTraceStore;
class InMemoryTraceStore {
    events = [];
    maxEvents;
    constructor(options = {}) {
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
    async getByCorrelationId(correlationId) {
        return this.query({ correlationId });
    }
    async count() {
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
 * PostgreSQL-backed trace store for production.
 * This is a stub - actual implementation would use pg or similar.
 */
class PostgresTraceStore {
    connectionString;
    tableName;
    schema;
    constructor(options) {
        this.connectionString = options.connectionString;
        this.tableName = options.tableName ?? 'trace_events';
        this.schema = options.schema ?? 'terra_trace';
    }
    async append(event) {
        // TODO: Implement actual PostgreSQL insert
        // INSERT INTO ${this.schema}.${this.tableName} (...)
        // For now, throw to indicate not implemented
        throw new Error('PostgresTraceStore.append() not implemented - use InMemoryTraceStore for dev');
    }
    async query(options) {
        throw new Error('PostgresTraceStore.query() not implemented');
    }
    async getById(eventId) {
        throw new Error('PostgresTraceStore.getById() not implemented');
    }
    async getByCorrelationId(correlationId) {
        throw new Error('PostgresTraceStore.getByCorrelationId() not implemented');
    }
    async count() {
        throw new Error('PostgresTraceStore.count() not implemented');
    }
    async healthy() {
        // TODO: Implement actual health check
        // SELECT 1 FROM ${this.schema}.${this.tableName} LIMIT 1
        return false;
    }
}
exports.PostgresTraceStore = PostgresTraceStore;
function createTraceStore(config) {
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
