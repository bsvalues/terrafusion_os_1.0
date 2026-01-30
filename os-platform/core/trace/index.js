// GENERATED - DO NOT EDIT
"use strict";
/**
 * TerraFusion OS - Trace Module Exports
 *
 * Re-exports all trace module components for clean imports.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMetricsService = exports.createMetricsService = exports.MetricsService = exports.resetAccessDeniedMetrics = exports.recordAccessDenied = exports.hasElevatedTraceRole = exports.getAccessDeniedMetrics = exports.filterVisibleTraceEvents = exports.evaluateTraceAccess = exports.canViewCorrelation = exports.ELEVATED_TRACE_ROLES = exports.createTraceStore = exports.PostgresTraceStore = exports.InMemoryTraceStore = exports.traceService = exports.TraceService = exports.SCHEMA_VERSION = exports.DEFAULT_RING_BUFFER_SIZE = void 0;
var TraceService_js_1 = require("./TraceService.js");
Object.defineProperty(exports, "DEFAULT_RING_BUFFER_SIZE", { enumerable: true, get: function () { return TraceService_js_1.DEFAULT_RING_BUFFER_SIZE; } });
Object.defineProperty(exports, "SCHEMA_VERSION", { enumerable: true, get: function () { return TraceService_js_1.SCHEMA_VERSION; } });
Object.defineProperty(exports, "TraceService", { enumerable: true, get: function () { return TraceService_js_1.TraceService; } });
Object.defineProperty(exports, "traceService", { enumerable: true, get: function () { return TraceService_js_1.traceService; } });
var TraceStore_js_1 = require("./TraceStore.js");
Object.defineProperty(exports, "InMemoryTraceStore", { enumerable: true, get: function () { return TraceStore_js_1.InMemoryTraceStore; } });
Object.defineProperty(exports, "PostgresTraceStore", { enumerable: true, get: function () { return TraceStore_js_1.PostgresTraceStore; } });
Object.defineProperty(exports, "createTraceStore", { enumerable: true, get: function () { return TraceStore_js_1.createTraceStore; } });
var TraceAccessControl_js_1 = require("./TraceAccessControl.js");
Object.defineProperty(exports, "ELEVATED_TRACE_ROLES", { enumerable: true, get: function () { return TraceAccessControl_js_1.ELEVATED_TRACE_ROLES; } });
Object.defineProperty(exports, "canViewCorrelation", { enumerable: true, get: function () { return TraceAccessControl_js_1.canViewCorrelation; } });
Object.defineProperty(exports, "evaluateTraceAccess", { enumerable: true, get: function () { return TraceAccessControl_js_1.evaluateTraceAccess; } });
Object.defineProperty(exports, "filterVisibleTraceEvents", { enumerable: true, get: function () { return TraceAccessControl_js_1.filterVisibleTraceEvents; } });
Object.defineProperty(exports, "getAccessDeniedMetrics", { enumerable: true, get: function () { return TraceAccessControl_js_1.getAccessDeniedMetrics; } });
Object.defineProperty(exports, "hasElevatedTraceRole", { enumerable: true, get: function () { return TraceAccessControl_js_1.hasElevatedTraceRole; } });
Object.defineProperty(exports, "recordAccessDenied", { enumerable: true, get: function () { return TraceAccessControl_js_1.recordAccessDenied; } });
Object.defineProperty(exports, "resetAccessDeniedMetrics", { enumerable: true, get: function () { return TraceAccessControl_js_1.resetAccessDeniedMetrics; } });
var MetricsService_js_1 = require("./MetricsService.js");
Object.defineProperty(exports, "MetricsService", { enumerable: true, get: function () { return MetricsService_js_1.MetricsService; } });
Object.defineProperty(exports, "createMetricsService", { enumerable: true, get: function () { return MetricsService_js_1.createMetricsService; } });
Object.defineProperty(exports, "getMetricsService", { enumerable: true, get: function () { return MetricsService_js_1.getMetricsService; } });
