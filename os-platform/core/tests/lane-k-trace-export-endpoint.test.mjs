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
      query: { parcelId: 'P-777', limit: '25', includeMeta: '1' },
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
    // header + 2 events + footer = 4 lines
    assert.equal(lines.length, 4);

    const header = lines[0];
    assert.equal(header.type, 'trace_export_header');
    assert.equal(header.parcelId, 'P-777');
    assert.equal(header.limit, 25);
    assert.equal(header.order, 'timestamp_desc,correlationId_asc,eventId_asc');

    const footer = lines[lines.length - 1];
    assert.equal(footer.type, 'trace_export_footer');
    assert.equal(footer.count, 2);
    assert.equal(typeof footer.sha256, 'string');
    assert.equal(footer.sha256.length, 64);
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

    const exported = parseNdjsonBody(res.bodyText);
    const exportedIds = exported.map((e) => e.eventId);
    const expectedIds = sortTraceExportEvents([eventB, eventA2, eventA1]).map((e) => e.eventId);

    assert.deepEqual(exportedIds, expectedIds);
  });

  it('default mode (no includeMeta) returns events only, no header/footer', async () => {
    emitTraceEvent({
      correlationId: 'corr-plain',
      context: {
        countyId: 'benton',
        userId: 'owner-1',
        roles: ['appraiser'],
        mode: 'pilot',
        parcelId: 'P-PLAIN',
      },
    });

    const req = {
      query: { parcelId: 'P-PLAIN' },
      user: {
        userId: 'admin-1',
        roles: ['administrator'],
        countyId: 'benton',
      },
    };
    const res = createMockResponse();

    await handleTraceExport(req, res, traceService);

    assert.equal(res.statusCode, 200);
    const lines = parseNdjsonBody(res.bodyText);
    assert.equal(lines.length, 1);
    assert.equal(lines[0].type, 'tool_completed');
    assert.equal(lines[0].correlationId, 'corr-plain');
  });

  it('includeMeta=1 footer count matches event count', async () => {
    for (let i = 0; i < 5; i++) {
      emitTraceEvent({
        correlationId: `corr-cnt-${i}`,
        context: {
          countyId: 'benton',
          userId: `user-${i}`,
          roles: ['appraiser'],
          mode: 'pilot',
          parcelId: 'P-CNT',
        },
      });
    }

    const req = {
      query: { parcelId: 'P-CNT', includeMeta: '1' },
      user: {
        userId: 'admin-1',
        roles: ['administrator'],
        countyId: 'benton',
      },
    };
    const res = createMockResponse();

    await handleTraceExport(req, res, traceService);

    const lines = parseNdjsonBody(res.bodyText);
    const footer = lines[lines.length - 1];
    assert.equal(footer.type, 'trace_export_footer');
    assert.equal(footer.count, 5);
    // header(1) + events(5) + footer(1) = 7
    assert.equal(lines.length, 7);
  });

  it('includeMeta SHA-256 hash is deterministic for same events', async () => {
    emitTraceEvent({
      correlationId: 'corr-hash',
      context: {
        countyId: 'benton',
        userId: 'owner-hash',
        roles: ['appraiser'],
        mode: 'pilot',
        parcelId: 'P-HASH',
      },
    });

    const run = async () => {
      const req = {
        query: { parcelId: 'P-HASH', includeMeta: '1' },
        user: {
          userId: 'admin-1',
          roles: ['administrator'],
          countyId: 'benton',
        },
      };
      const res = createMockResponse();
      await handleTraceExport(req, res, traceService);
      const lines = parseNdjsonBody(res.bodyText);
      return lines[lines.length - 1].sha256;
    };

    const hash1 = await run();
    const hash2 = await run();
    assert.equal(hash1, hash2, 'SHA-256 hash must be deterministic across runs');
    assert.equal(hash1.length, 64);
  });
});

// ── Lane S: sidecar header tests ──

describe('handleTraceExport sidecar headers', () => {
  it('sidecar=1 emits X-Trace-Export-SHA256 and X-Trace-Export-Count headers', async () => {
    for (let i = 0; i < 3; i++) {
      emitTraceEvent({
        correlationId: `corr-sc-${i}`,
        context: {
          countyId: 'benton',
          userId: `user-sc-${i}`,
          roles: ['appraiser'],
          mode: 'pilot',
          parcelId: 'P-SC',
        },
      });
    }

    const req = {
      query: { parcelId: 'P-SC', sidecar: '1' },
      user: { userId: 'admin-1', roles: ['administrator'], countyId: 'benton' },
    };
    const res = createMockResponse();
    await handleTraceExport(req, res, traceService);

    assert.equal(res.statusCode, 200);
    assert.equal(res.headers.get('x-trace-export-count'), '3');
    const sha = res.headers.get('x-trace-export-sha256');
    assert.equal(typeof sha, 'string');
    assert.equal(sha.length, 64);

    // Body should be bare events (no header/footer) since includeMeta omitted
    const lines = parseNdjsonBody(res.bodyText);
    assert.equal(lines.length, 3);
    assert.ok(lines.every((l) => l.type === 'tool_completed'));
  });

  it('sidecar=1 + includeMeta=1 headers match inline footer values', async () => {
    for (let i = 0; i < 2; i++) {
      emitTraceEvent({
        correlationId: `corr-both-${i}`,
        context: {
          countyId: 'benton',
          userId: `user-both-${i}`,
          roles: ['appraiser'],
          mode: 'pilot',
          parcelId: 'P-BOTH',
        },
      });
    }

    const req = {
      query: { parcelId: 'P-BOTH', sidecar: '1', includeMeta: '1' },
      user: { userId: 'admin-1', roles: ['administrator'], countyId: 'benton' },
    };
    const res = createMockResponse();
    await handleTraceExport(req, res, traceService);

    const lines = parseNdjsonBody(res.bodyText);
    const footer = lines[lines.length - 1];
    assert.equal(footer.type, 'trace_export_footer');

    // HTTP headers must match inline footer
    assert.equal(res.headers.get('x-trace-export-sha256'), footer.sha256);
    assert.equal(res.headers.get('x-trace-export-count'), String(footer.count));
  });

  it('default mode (no sidecar) does not emit sidecar headers', async () => {
    emitTraceEvent({
      correlationId: 'corr-no-sc',
      context: {
        countyId: 'benton',
        userId: 'owner-no-sc',
        roles: ['appraiser'],
        mode: 'pilot',
        parcelId: 'P-NOSC',
      },
    });

    const req = {
      query: { parcelId: 'P-NOSC' },
      user: { userId: 'admin-1', roles: ['administrator'], countyId: 'benton' },
    };
    const res = createMockResponse();
    await handleTraceExport(req, res, traceService);

    assert.equal(res.headers.has('x-trace-export-sha256'), false);
    assert.equal(res.headers.has('x-trace-export-count'), false);
  });

  it('sidecar=1 SHA-256 is deterministic across calls', async () => {
    emitTraceEvent({
      correlationId: 'corr-det',
      context: {
        countyId: 'benton',
        userId: 'owner-det',
        roles: ['appraiser'],
        mode: 'pilot',
        parcelId: 'P-DET',
      },
    });

    const run = async () => {
      const req = {
        query: { parcelId: 'P-DET', sidecar: '1' },
        user: { userId: 'admin-1', roles: ['administrator'], countyId: 'benton' },
      };
      const res = createMockResponse();
      await handleTraceExport(req, res, traceService);
      return res.headers.get('x-trace-export-sha256');
    };

    const h1 = await run();
    const h2 = await run();
    assert.equal(h1, h2, 'Sidecar SHA-256 must be deterministic');
    assert.equal(h1.length, 64);
  });
});
