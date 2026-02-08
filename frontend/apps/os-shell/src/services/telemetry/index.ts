/**
 * Telemetry Module
 *
 * Local-first telemetry persistence with IndexedDB storage,
 * batched writes, and retention policies.
 *
 * @module services/telemetry
 * @see Slice 20: Persisted Telemetry Backend
 */

// Store
export {
    createTelemetryStore,
    getTelemetryStore,
    resetTelemetryStore, type StoredTraceEvent, type TelemetryStore,
    type TelemetryStoreConfig,
    type TelemetryStoreStats
} from './telemetryStore';

// Adapter
export {
    createIndexedDBAdapter, createMemoryAdapter, getStorageAdapter,
    resetStorageAdapter, type ListOptions, type TelemetryStorageAdapter
} from './telemetryStorageAdapter';

// Sink
export {
    createTelemetrySink, getTelemetrySink, startTelemetrySink,
    stopTelemetrySink, type TelemetrySink,
    type TelemetrySinkConfig,
    type TelemetrySinkStats,
    type TraceEventInput
} from './telemetrySink';

