/**
 * TerraFusion OS - Trace Module Exports
 *
 * Re-exports all trace module components for clean imports.
 */

export {
    DEFAULT_RING_BUFFER_SIZE,
    SCHEMA_VERSION,
    TraceService,
    exportNDJSON,
    isAuditEventType,
    toAuditRecord,
    traceService,
    type AuditRecord,
    type ExportNDJSONOptions,
    type TraceServiceOptions
} from './TraceService.js';

export {
    FileTraceStore,
    InMemoryTraceStore,
    createTraceStore,
    type FileTraceStoreOptions,
    type InMemoryTraceStoreOptions,
    type TraceStore,
    type TraceStoreConfig,
    type TraceStoreStats,
    type TraceStoreType
} from './TraceStore.js';

export {
    ELEVATED_TRACE_ROLES,
    canViewCorrelation,
    evaluateTraceAccess,
    filterVisibleTraceEvents,
    getAccessDeniedMetrics,
    hasElevatedTraceRole,
    recordAccessDenied,
    resetAccessDeniedMetrics,
    type ElevatedTraceRole,
    type TraceAccessDecision,
    type TraceAccessDenied,
    type TraceAccessPrincipal
} from './TraceAccessControl.js';

export {
    MetricsService, createMetricsService,
    getMetricsService, type HighRiskEvent,
    type HighRiskFeed,
    type MetricsSummary,
    type ModeBreakdown,
    type RiskBreakdown,
    type TimeWindow,
    type ToolUsage
} from './MetricsService.js';

