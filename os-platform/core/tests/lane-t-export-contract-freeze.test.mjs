/**
 * Lane T — Export contract freeze (golden conformance guard).
 *
 * This file is the single source of truth for the /pilot/traces/export contract.
 * Each test independently verifies one mode combination and recomputes integrity
 * values from scratch. If any of these break, the export contract has drifted.
 *
 * Modes tested:
 *   1. Default (bare events)
 *   2. includeMeta=1 (header + footer envelope)
 *   3. sidecar=1 (HTTP headers, bare events)
 *   4. includeMeta=1 & sidecar=1 (envelope + HTTP headers, values must match)
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { afterEach, before, describe, it } from 'node:test';

let traceService;
let handleTraceExport;
let sortTraceExportEvents;
let resetAccessDeniedMetrics;

before(async () => {
  const traceModule = await import('../trace/index.js');
  const exportModule = await import('../pilot/traceExport.js');

  traceService = traceModule.traceService;
  resetAccessDeniedMetrics = traceModule.resetAccessDeniedMetrics;
  handleTraceExport = exportModule.handleTraceExport;
  sortTraceExportEvents = exportModule.sortTraceExportEvents;
});

// ── Helpers ──

function createMockResponse() {
  const headers = new Map();
  const chunks = [];
  let statusCode = 200;
  let jsonBody;

  return {
    status(code) { statusCode = code; return this; },
    json(payload) { jsonBody = payload; return this; },
    setHeader(name, value) { headers.set(name.toLowerCase(), value); },
    write(chunk) { chunks.push(String(chunk)); },
    end(chunk) { if (chunk) chunks.push(String(chunk)); },
    get statusCode() { return statusCode; },
    get headers() { return headers; },
    get jsonBody() { return jsonBody; },
    get bodyText() { return chunks.join(''); },
  };
}

function parseNdjsonBody(bodyText) {
  return bodyText.split('\n').map(l => l.trim()).filter(Boolean).map(l => JSON.parse(l));
}

function recomputeSha256(events) {
  const hash = createHash('sha256');
  for (const event of events) {
    hash.update(`${JSON.stringify(event)}\n`);
  }
  return hash.digest('hex');
}

const ADMIN = { userId: 'admin-freeze', roles: ['administrator'], countyId: 'benton' };

function seedEvents(parcelId, count) {
  const events = [];
  for (let i = 0; i < count; i++) {
    events.push(traceService.emit({
      type: 'tool_completed',
      toolId: 'run_valuation_model',
      correlationId: `corr-freeze-${i}`,
      summary: `freeze test event ${i}`,
      context: {
        countyId: 'benton',
        userId: `user-freeze-${i}`,
        roles: ['appraiser'],
        mode: 'pilot',
        parcelId,
      },
    }));
  }
  return events;
}

async function runExport(parcelId, queryOverrides = {}) {
  const req = {
    query: { parcelId, limit: '100', ...queryOverrides },
    user: ADMIN,
  };
  const res = createMockResponse();
  await handleTraceExport(req, res, traceService);
  return res;
}

afterEach(() => {
  traceService.clear();
  resetAccessDeniedMetrics();
});

// ── Golden contract conformance tests ──

describe('Lane T: Export contract freeze', () => {

  it('MODE 1 — default: bare events, no envelope, no sidecar headers', async () => {
    const raw = seedEvents('P-FREEZE-1', 4);
    const res = await runExport('P-FREEZE-1');

    assert.equal(res.statusCode, 200);
    assert.match(String(res.headers.get('content-type')), /application\/x-ndjson/i);

    const lines = parseNdjsonBody(res.bodyText);

    // Must be exactly 4 event lines — no header, no footer
    assert.equal(lines.length, 4);
    assert.ok(lines.every(l => l.type === 'tool_completed'), 'All lines must be events');
    assert.ok(lines.every(l => !l.type.startsWith('trace_export_')), 'No envelope lines');

    // No sidecar headers
    assert.equal(res.headers.has('x-trace-export-sha256'), false);
    assert.equal(res.headers.has('x-trace-export-count'), false);
  });

  it('MODE 2 — includeMeta=1: header + events + footer, hash/count correct', async () => {
    const raw = seedEvents('P-FREEZE-2', 3);
    const res = await runExport('P-FREEZE-2', { includeMeta: '1' });

    assert.equal(res.statusCode, 200);
    const lines = parseNdjsonBody(res.bodyText);

    // header(1) + events(3) + footer(1) = 5
    assert.equal(lines.length, 5);

    // Header shape
    const header = lines[0];
    assert.equal(header.type, 'trace_export_header');
    assert.equal(header.parcelId, 'P-FREEZE-2');
    assert.equal(header.order, 'timestamp_desc,correlationId_asc,eventId_asc');
    assert.equal(typeof header.exportedAt, 'string');
    assert.equal(typeof header.from, 'string');
    assert.equal(typeof header.to, 'string');
    assert.equal(typeof header.limit, 'number');

    // Footer shape
    const footer = lines[lines.length - 1];
    assert.equal(footer.type, 'trace_export_footer');
    assert.equal(footer.count, 3);
    assert.equal(typeof footer.sha256, 'string');
    assert.equal(footer.sha256.length, 64);

    // Independent hash recomputation
    const eventLines = lines.slice(1, -1);
    const expected = recomputeSha256(eventLines);
    assert.equal(footer.sha256, expected, 'Footer SHA-256 must match independent recomputation');

    // No sidecar headers (only includeMeta, not sidecar)
    assert.equal(res.headers.has('x-trace-export-sha256'), false);
    assert.equal(res.headers.has('x-trace-export-count'), false);
  });

  it('MODE 3 — sidecar=1: bare events + HTTP integrity headers', async () => {
    const raw = seedEvents('P-FREEZE-3', 5);
    const res = await runExport('P-FREEZE-3', { sidecar: '1' });

    assert.equal(res.statusCode, 200);
    const lines = parseNdjsonBody(res.bodyText);

    // Bare events — no header, no footer
    assert.equal(lines.length, 5);
    assert.ok(lines.every(l => l.type === 'tool_completed'));

    // Sidecar headers present
    const sha = res.headers.get('x-trace-export-sha256');
    const count = res.headers.get('x-trace-export-count');
    assert.equal(typeof sha, 'string');
    assert.equal(sha.length, 64);
    assert.equal(count, '5');

    // Independent hash recomputation from body events
    const expected = recomputeSha256(lines);
    assert.equal(sha, expected, 'Sidecar SHA-256 must match independent recomputation');
  });

  it('MODE 4 — includeMeta=1 & sidecar=1: envelope + headers, values identical', async () => {
    const raw = seedEvents('P-FREEZE-4', 2);
    const res = await runExport('P-FREEZE-4', { includeMeta: '1', sidecar: '1' });

    assert.equal(res.statusCode, 200);
    const lines = parseNdjsonBody(res.bodyText);

    // header(1) + events(2) + footer(1) = 4
    assert.equal(lines.length, 4);
    assert.equal(lines[0].type, 'trace_export_header');

    const footer = lines[lines.length - 1];
    assert.equal(footer.type, 'trace_export_footer');

    // HTTP headers must exist
    const headerSha = res.headers.get('x-trace-export-sha256');
    const headerCount = res.headers.get('x-trace-export-count');
    assert.equal(typeof headerSha, 'string');
    assert.equal(headerSha.length, 64);

    // HTTP headers must match inline footer exactly
    assert.equal(headerSha, footer.sha256, 'HTTP SHA-256 must equal footer SHA-256');
    assert.equal(headerCount, String(footer.count), 'HTTP count must equal footer count');

    // Independent recomputation against event lines
    const eventLines = lines.slice(1, -1);
    const expected = recomputeSha256(eventLines);
    assert.equal(footer.sha256, expected, 'Both surfaces must match independent recomputation');
  });

  it('INVARIANT — sort order is timestamp_desc, correlationId_asc, eventId_asc', async () => {
    const ts = '2026-03-03T12:00:00.000Z';
    // Emit in reverse alphabetical correlationId to force sort
    traceService.emit({
      type: 'tool_completed',
      toolId: 'run_valuation_model',
      correlationId: 'corr-z',
      summary: 'sort test z',
      context: { countyId: 'benton', userId: 'u-1', roles: ['appraiser'], mode: 'pilot', parcelId: 'P-SORT' },
    }).timestamp = ts;
    traceService.emit({
      type: 'tool_completed',
      toolId: 'run_valuation_model',
      correlationId: 'corr-a',
      summary: 'sort test a',
      context: { countyId: 'benton', userId: 'u-2', roles: ['appraiser'], mode: 'pilot', parcelId: 'P-SORT' },
    }).timestamp = ts;

    const res = await runExport('P-SORT');
    const lines = parseNdjsonBody(res.bodyText);

    // Same timestamp → correlationId ascending: corr-a before corr-z
    assert.equal(lines[0].correlationId, 'corr-a');
    assert.equal(lines[1].correlationId, 'corr-z');
  });

  it('INVARIANT — Content-Disposition filename contains sanitized parcelId', async () => {
    seedEvents('P-FREEZE-CD', 1);
    const res = await runExport('P-FREEZE-CD');

    const cd = res.headers.get('content-disposition');
    assert.ok(cd, 'Content-Disposition header must exist');
    assert.match(cd, /attachment/);
    assert.match(cd, /trace-export-P-FREEZE-CD/);
    assert.match(cd, /\.ndjson/);
  });

  it('INVARIANT — Cache-Control is no-store', async () => {
    seedEvents('P-FREEZE-CC', 1);
    const res = await runExport('P-FREEZE-CC');

    assert.equal(res.headers.get('cache-control'), 'no-store');
  });
});
