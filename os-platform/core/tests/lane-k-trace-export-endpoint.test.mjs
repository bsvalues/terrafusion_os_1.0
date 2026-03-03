/**
 * Lane K1-K3: /pilot/traces/export contract tests (handler-level, no Express runtime).
 */

import assert from 'node:assert/strict';
import { afterEach, before, describe, it } from 'node:test';

let traceService;
let handleTraceExport;
let parseTraceExportQuery;
let sortTraceExportEvents;
let resetAccessDeniedMetrics;

before(async () => {
  const traceModule = await import('../trace/index.js');
  const exportModule = await import('../pilot/traceExport.js');

  traceService = traceModule.traceService;
  resetAccessDeniedMetrics = traceModule.resetAccessDeniedMetrics;
  handleTraceExport = exportModule.handleTraceExport;
  parseTraceExportQuery = exportModule.parseTraceExportQuery;
  sortTraceExportEvents = exportModule.sortTraceExportEvents;
});

function createMockResponse() {
  const headers = new Map();
  const chunks = [];
  let statusCode = 200;
  let jsonBody;

  return {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      jsonBody = payload;
      return this;
    },
    setHeader(name, value) {
      headers.set(name.toLowerCase(), value);
    },
    write(chunk) {
      chunks.push(String(chunk));
    },
    end(chunk) {
      if (chunk) chunks.push(String(chunk));
    },
    get statusCode() {
      return statusCode;
    },
    get headers() {
      return headers;
    },
    get jsonBody() {
      return jsonBody;
    },
    get bodyText() {
      return chunks.join('');
    },
  };
}

function parseNdjsonBody(bodyText) {
  return bodyText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function emitTraceEvent(overrides = {}) {
  const event = traceService.emit({
    type: 'tool_completed',
    toolId: 'run_valuation_model',
    correlationId: 'corr-default',
    summary: 'trace export test event',
    context: {
      countyId: 'benton',
      userId: 'user-001',
      roles: ['appraiser'],
      mode: 'pilot',
      parcelId: 'P-100',
    },
    ...overrides,
  });

  if (overrides.timestamp) {
    event.timestamp = overrides.timestamp;
  }
  return event;
}

afterEach(() => {
  traceService.clear();
  resetAccessDeniedMetrics();
});

describe('parseTraceExportQuery', () => {
  it('requires parcelId and rejects invalid bounds', () => {
    const missing = parseTraceExportQuery({});
    assert.equal(missing.ok, false);
    assert.match(missing.message, /parcelId/i);

    const invalidFrom = parseTraceExportQuery({
      parcelId: 'P-1',
      from: 'invalid',
    });
    assert.equal(invalidFrom.ok, false);
    assert.match(invalidFrom.message, /from must be a valid ISO 8601 timestamp/i);

    const badWindow = parseTraceExportQuery({
      parcelId: 'P-1',
      from: '2025-01-01T00:00:00.000Z',
      to: '2025-03-15T00:00:00.000Z',
    });
    assert.equal(badWindow.ok, false);
    assert.match(badWindow.message, /30 days or less/i);
  });
});

describe('handleTraceExport', () => {
  it('returns NDJSON for elevated role with correct header metadata', async () => {
    emitTraceEvent({
      correlationId: 'corr-a',
      context: {
        countyId: 'benton',
        userId: 'owner-1',
        roles: ['appraiser'],
        mode: 'pilot',
        parcelId: 'P-777',
      },
    });
    emitTraceEvent({
      correlationId: 'corr-b',
      context: {
        countyId: 'benton',
        userId: 'owner-2',
        roles: ['appraiser'],
        mode: 'pilot',
        parcelId: 'P-777',
      },
    });

    const req = {
      query: { parcelId: 'P-777', limit: '25' },
      user: {
        userId: 'admin-1',
        roles: ['administrator'],
        countyId: 'benton',
      },
    };
    const res = createMockResponse();

    await handleTraceExport(req, res, traceService);

    assert.equal(res.statusCode, 200);
    assert.match(
      String(res.headers.get('content-type')),
      /application\/x-ndjson/i
    );

    const lines = parseNdjsonBody(res.bodyText);
    assert.ok(lines.length >= 1);

    const header = lines[0];
    assert.equal(header.type, 'trace_export_header');
    assert.equal(header.parcelId, 'P-777');
    assert.equal(header.count, 2);
    assert.equal(header.limit, 25);
    assert.equal(header.order, 'timestamp_desc,correlationId_asc,eventId_asc');
  });

  it('returns 403 + permission_denied audit for non-elevated role', async () => {
    emitTraceEvent({
      context: {
        countyId: 'benton',
        userId: 'owner-1',
        roles: ['appraiser'],
        mode: 'pilot',
        parcelId: 'P-403',
      },
    });

    const req = {
      query: { parcelId: 'P-403' },
      user: {
        userId: 'viewer-1',
        roles: ['viewer'],
        countyId: 'benton',
      },
    };
    const res = createMockResponse();

    await handleTraceExport(req, res, traceService);

    assert.equal(res.statusCode, 403);
    assert.equal(res.jsonBody.error, 'ACCESS_DENIED');

    const denied = traceService.query({
      type: 'permission_denied',
      toolId: 'pilot:traces:export',
      limit: 10,
    });
    assert.equal(denied.length, 1);
  });

  it('denies cross-county parcel export for elevated role', async () => {
    emitTraceEvent({
      correlationId: 'corr-cross',
      context: {
        countyId: 'yakima',
        userId: 'yakima-admin',
        roles: ['administrator'],
        mode: 'pilot',
        parcelId: 'P-CROSS',
      },
    });

    const req = {
      query: { parcelId: 'P-CROSS' },
      user: {
        userId: 'benton-admin',
        roles: ['administrator'],
        countyId: 'benton',
      },
    };
    const res = createMockResponse();

    await handleTraceExport(req, res, traceService);

    assert.equal(res.statusCode, 403);
    assert.equal(res.jsonBody.error, 'ACCESS_DENIED');
    assert.match(String(res.jsonBody.message), /cross-county/i);
  });

  it('returns 400 for invalid from/to values', async () => {
    const req = {
      query: {
        parcelId: 'P-100',
        from: 'not-a-date',
      },
      user: {
        userId: 'admin-1',
        roles: ['administrator'],
        countyId: 'benton',
      },
    };
    const res = createMockResponse();

    await handleTraceExport(req, res, traceService);

    assert.equal(res.statusCode, 400);
    assert.equal(res.jsonBody.error, 'INVALID_REQUEST');
  });

  it('exports same-timestamp events in deterministic order', async () => {
    const sameTs = '2026-03-03T10:00:00.000Z';
    const eventB = emitTraceEvent({
      correlationId: 'corr-b',
      context: {
        countyId: 'benton',
        userId: 'owner-b',
        roles: ['appraiser'],
        mode: 'pilot',
        parcelId: 'P-ORDER',
      },
      timestamp: sameTs,
    });
    const eventA2 = emitTraceEvent({
      correlationId: 'corr-a',
      context: {
        countyId: 'benton',
        userId: 'owner-a2',
        roles: ['appraiser'],
        mode: 'pilot',
        parcelId: 'P-ORDER',
      },
      timestamp: sameTs,
    });
    const eventA1 = emitTraceEvent({
      correlationId: 'corr-a',
      context: {
        countyId: 'benton',
        userId: 'owner-a1',
        roles: ['appraiser'],
        mode: 'pilot',
        parcelId: 'P-ORDER',
      },
      timestamp: sameTs,
    });

    const req = {
      query: { parcelId: 'P-ORDER', limit: '10' },
      user: {
        userId: 'admin-1',
        roles: ['administrator'],
        countyId: 'benton',
      },
    };
    const res = createMockResponse();

    await handleTraceExport(req, res, traceService);
    assert.equal(res.statusCode, 200);

    const exported = parseNdjsonBody(res.bodyText).slice(1);
    const exportedIds = exported.map((e) => e.eventId);
    const expectedIds = sortTraceExportEvents([eventB, eventA2, eventA1]).map((e) => e.eventId);

    assert.deepEqual(exportedIds, expectedIds);
  });
});
