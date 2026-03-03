import { createHash, randomUUID } from 'crypto';
import {
  hasElevatedTraceRole,
  recordAccessDenied,
  type TraceAccessPrincipal,
} from '../trace/TraceAccessControl.js';
import type { TraceService } from '../trace/TraceService.js';
import type { TraceEvent } from '../types/index.js';

export const TRACE_EXPORT_MAX_LIMIT = 2_000;
export const TRACE_EXPORT_DEFAULT_LIMIT = 500;
export const TRACE_EXPORT_MAX_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

const TRACE_EXPORT_TOOL_ID = 'pilot:traces:export';

export interface TraceExportRequestLike {
  query: Record<string, unknown>;
  user?: {
    userId: string;
    roles: string[];
    countyId: string;
  };
}

export interface TraceExportResponseLike {
  status(code: number): TraceExportResponseLike;
  json(payload: unknown): unknown;
  setHeader(name: string, value: string): unknown;
  write(chunk: string): unknown;
  end(chunk?: string): unknown;
}

export interface TraceExportParams {
  parcelId: string;
  correlationId?: string;
  from: string;
  to: string;
  limit: number;
  includeMeta: boolean;
}

export type TraceExportParseResult =
  | { ok: true; value: TraceExportParams }
  | { ok: false; message: string };

function queryString(
  query: Record<string, unknown>,
  key: string
): string | undefined {
  const value = query[key];
  if (typeof value === 'string') return value;
  return undefined;
}

export function parseTraceExportQuery(
  query: Record<string, unknown>,
  nowMs: number = Date.now()
): TraceExportParseResult {
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
    : (rawTo ? (parsedToMs - TRACE_EXPORT_MAX_WINDOW_MS) : (nowMs - TRACE_EXPORT_MAX_WINDOW_MS));

  if (effectiveFromMs > effectiveToMs) {
    return { ok: false, message: 'from must not be after to' };
  }
  if ((effectiveToMs - effectiveFromMs) > TRACE_EXPORT_MAX_WINDOW_MS) {
    return { ok: false, message: 'trace export window must be 30 days or less' };
  }

  const rawLimit = queryString(query, 'limit');
  let limit = TRACE_EXPORT_DEFAULT_LIMIT;
  if (rawLimit !== undefined) {
    const parsedLimit = Number.parseInt(rawLimit, 10);
    if (!Number.isFinite(parsedLimit) || parsedLimit < 1) {
      return { ok: false, message: 'limit must be an integer >= 1' };
    }
    limit = Math.min(parsedLimit, TRACE_EXPORT_MAX_LIMIT);
  }

  const correlationId = queryString(query, 'correlationId')?.trim() || undefined;

  const rawIncludeMeta = queryString(query, 'includeMeta');
  const includeMeta = rawIncludeMeta === '1' || rawIncludeMeta === 'true';

  return {
    ok: true,
    value: {
      parcelId,
      correlationId,
      from: new Date(effectiveFromMs).toISOString(),
      to: new Date(effectiveToMs).toISOString(),
      limit,
      includeMeta,
    },
  };
}

export function sortTraceExportEvents(events: TraceEvent[]): TraceEvent[] {
  return [...events].sort((a, b) => {
    const dt = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    if (dt !== 0) return dt;
    const byCorrelation = a.correlationId.localeCompare(b.correlationId);
    if (byCorrelation !== 0) return byCorrelation;
    return a.eventId.localeCompare(b.eventId);
  });
}

export async function handleTraceExport(
  req: TraceExportRequestLike,
  res: TraceExportResponseLike,
  traceService: TraceService
): Promise<unknown> {
  const parsed = parseTraceExportQuery(req.query);
  if (!parsed.ok) {
    const message = (parsed as { ok: false; message: string }).message;
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

  const principal: TraceAccessPrincipal = {
    userId: user.userId,
    roles: user.roles,
    countyId: user.countyId,
  };

  const exportCorrelationId = `trace-export-${randomUUID().slice(0, 8)}`;

  if (!hasElevatedTraceRole(principal)) {
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
    recordAccessDenied('user_mismatch');
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
    limit: TRACE_EXPORT_MAX_LIMIT,
    offset: 0,
  });

  let filteredCount = 0;
  const visibleEvents = queriedEvents.filter((event) => {
    if (event.context.countyId.toLowerCase() !== principal.countyId.toLowerCase()) {
      filteredCount++;
      recordAccessDenied('cross_county');
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
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="trace-export-${safeParcelId}${fileSuffix}.ndjson"`
  );

  if (params.includeMeta) {
    const header = {
      type: 'trace_export_header',
      parcelId: params.parcelId,
      correlationId: params.correlationId ?? null,
      from: params.from,
      to: params.to,
      limit: params.limit,
      exportedAt,
      order: 'timestamp_desc,correlationId_asc,eventId_asc',
    };
    res.write(`${JSON.stringify(header)}\n`);

    const hash = createHash('sha256');
    let count = 0;
    for (const event of exportedEvents) {
      const line = `${JSON.stringify(event)}\n`;
      hash.update(line);
      res.write(line);
      count++;
    }

    const footer = {
      type: 'trace_export_footer',
      sha256: hash.digest('hex'),
      count,
    };
    res.write(`${JSON.stringify(footer)}\n`);
  } else {
    for (const event of exportedEvents) {
      res.write(`${JSON.stringify(event)}\n`);
    }
  }

  return res.end();
}
