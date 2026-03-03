// GENERATED - DO NOT EDIT
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRACE_EXPORT_MAX_WINDOW_MS = exports.TRACE_EXPORT_DEFAULT_LIMIT = exports.TRACE_EXPORT_MAX_LIMIT = void 0;
exports.parseTraceExportQuery = parseTraceExportQuery;
exports.sortTraceExportEvents = sortTraceExportEvents;
exports.handleTraceExport = handleTraceExport;
const crypto_1 = require("crypto");
const TraceAccessControl_js_1 = require("../trace/TraceAccessControl.js");
exports.TRACE_EXPORT_MAX_LIMIT = 2000;
exports.TRACE_EXPORT_DEFAULT_LIMIT = 500;
exports.TRACE_EXPORT_MAX_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const TRACE_EXPORT_TOOL_ID = 'pilot:traces:export';
function queryString(query, key) {
    const value = query[key];
    if (typeof value === 'string')
        return value;
    return undefined;
}
function parseTraceExportQuery(query, nowMs = Date.now()) {
    const parcelId = queryString(query, 'parcelId')?.trim();
    if (!parcelId) {
        return { ok: false, message: 'parcelId query parameter is required' };
    }
    const format = queryString(query, 'format')?.toLowerCase();
    if (format && format !== 'ndjson') {
        return { ok: false, message: 'format must be ndjson' };
    }
    const rawFrom = queryString(query, 'from');
    const rawTo = queryString(query, 'to');
    const parsedFromMs = rawFrom ? Date.parse(rawFrom) : NaN;
    const parsedToMs = rawTo ? Date.parse(rawTo) : NaN;
    if (rawFrom && Number.isNaN(parsedFromMs)) {
        return { ok: false, message: 'from must be a valid ISO 8601 timestamp' };
    }
    if (rawTo && Number.isNaN(parsedToMs)) {
        return { ok: false, message: 'to must be a valid ISO 8601 timestamp' };
    }
    const effectiveToMs = rawTo ? parsedToMs : nowMs;
    const effectiveFromMs = rawFrom
        ? parsedFromMs
        : (rawTo ? (parsedToMs - exports.TRACE_EXPORT_MAX_WINDOW_MS) : (nowMs - exports.TRACE_EXPORT_MAX_WINDOW_MS));
    if (effectiveFromMs > effectiveToMs) {
        return { ok: false, message: 'from must not be after to' };
    }
    if ((effectiveToMs - effectiveFromMs) > exports.TRACE_EXPORT_MAX_WINDOW_MS) {
        return { ok: false, message: 'trace export window must be 30 days or less' };
    }
    const rawLimit = queryString(query, 'limit');
    let limit = exports.TRACE_EXPORT_DEFAULT_LIMIT;
    if (rawLimit !== undefined) {
        const parsedLimit = Number.parseInt(rawLimit, 10);
        if (!Number.isFinite(parsedLimit) || parsedLimit < 1) {
            return { ok: false, message: 'limit must be an integer >= 1' };
        }
        limit = Math.min(parsedLimit, exports.TRACE_EXPORT_MAX_LIMIT);
    }
    const correlationId = queryString(query, 'correlationId')?.trim() || undefined;
    return {
        ok: true,
        value: {
            parcelId,
            correlationId,
            from: new Date(effectiveFromMs).toISOString(),
            to: new Date(effectiveToMs).toISOString(),
            limit,
        },
    };
}
function sortTraceExportEvents(events) {
    return [...events].sort((a, b) => {
        const dt = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        if (dt !== 0)
            return dt;
        const byCorrelation = a.correlationId.localeCompare(b.correlationId);
        if (byCorrelation !== 0)
            return byCorrelation;
        return a.eventId.localeCompare(b.eventId);
    });
}
async function handleTraceExport(req, res, traceService) {
    const parsed = parseTraceExportQuery(req.query);
    if (!parsed.ok) {
        const message = parsed.message;
        return res.status(400).json({
            error: 'INVALID_REQUEST',
            message,
        });
    }
    const params = parsed.value;
    const user = req.user ?? {
        userId: 'anonymous',
        roles: ['viewer'],
        countyId: 'benton',
    };
    const principal = {
        userId: user.userId,
        roles: user.roles,
        countyId: user.countyId,
    };
    const exportCorrelationId = `trace-export-${(0, crypto_1.randomUUID)().slice(0, 8)}`;
    if (!(0, TraceAccessControl_js_1.hasElevatedTraceRole)(principal)) {
        traceService.emit({
            type: 'permission_denied',
            toolId: TRACE_EXPORT_TOOL_ID,
            correlationId: exportCorrelationId,
            summary: `Trace export access denied: user=${principal.userId}`,
            context: {
                countyId: principal.countyId,
                userId: principal.userId,
                roles: principal.roles,
                mode: 'pilot',
            },
        });
        (0, TraceAccessControl_js_1.recordAccessDenied)('user_mismatch');
        return res.status(403).json({
            error: 'ACCESS_DENIED',
            message: 'Trace export requires elevated role',
        });
    }
    const queriedEvents = await traceService.queryAsync({
        parcelId: params.parcelId,
        correlationId: params.correlationId,
        from: params.from,
        to: params.to,
        limit: exports.TRACE_EXPORT_MAX_LIMIT,
        offset: 0,
    });
    let filteredCount = 0;
    const visibleEvents = queriedEvents.filter((event) => {
        if (event.context.countyId.toLowerCase() !== principal.countyId.toLowerCase()) {
            filteredCount++;
            (0, TraceAccessControl_js_1.recordAccessDenied)('cross_county');
            return false;
        }
        return true;
    });
    if (filteredCount > 0) {
        traceService.emit({
            type: 'permission_denied',
            toolId: TRACE_EXPORT_TOOL_ID,
            correlationId: exportCorrelationId,
            summary: `Trace export denied: parcelId=${params.parcelId}, filtered=${filteredCount}`,
            context: {
                countyId: principal.countyId,
                userId: principal.userId,
                roles: principal.roles,
                mode: 'pilot',
            },
        });
        return res.status(403).json({
            error: 'ACCESS_DENIED',
            message: 'Cross-county trace export denied',
        });
    }
    const exportedEvents = sortTraceExportEvents(visibleEvents).slice(0, params.limit);
    traceService.emit({
        type: 'trace_accessed',
        toolId: TRACE_EXPORT_TOOL_ID,
        correlationId: exportCorrelationId,
        summary: `Trace export accessed: parcelId=${params.parcelId}, returned=${exportedEvents.length}`,
        context: {
            countyId: principal.countyId,
            userId: principal.userId,
            roles: principal.roles,
            mode: 'pilot',
        },
    });
    const safeParcelId = params.parcelId.replace(/[^a-zA-Z0-9._-]/g, '_');
    const safeCorrelation = params.correlationId?.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileSuffix = safeCorrelation ? `-${safeCorrelation}` : '';
    const exportedAt = new Date().toISOString();
    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Disposition', `attachment; filename="trace-export-${safeParcelId}${fileSuffix}.ndjson"`);
    const header = {
        type: 'trace_export_header',
        parcelId: params.parcelId,
        correlationId: params.correlationId ?? null,
        from: params.from,
        to: params.to,
        limit: params.limit,
        exportedAt,
        count: exportedEvents.length,
        order: 'timestamp_desc,correlationId_asc,eventId_asc',
    };
    res.write(`${JSON.stringify(header)}\n`);
    for (const event of exportedEvents) {
        res.write(`${JSON.stringify(event)}\n`);
    }
    return res.end();
}
