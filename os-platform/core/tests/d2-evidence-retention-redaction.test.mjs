/**
 * TerraFusion OS - D2 Evidence Retention & Redaction Contract
 */
import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

let toAuditRecord;
let exportNDJSON;

before(async () => {
  const traceModule = await import('../trace/index.js');
  const trace = traceModule.default || traceModule;
  toAuditRecord = trace.toAuditRecord;
  exportNDJSON = trace.exportNDJSON;
});

function makeEvent(overrides = {}) {
  return {
    id: overrides.id || 'evt-test-001',
    correlationId: overrides.correlationId || 'corr-test-001',
    toolId: overrides.toolId || 'test_tool',
    type: overrides.type || 'tool_completed',
    timestamp: overrides.timestamp || '2026-03-01T12:00:00.000Z',
    summary: overrides.summary || 'Test event summary',
    errorCode: overrides.errorCode || undefined,
    component: overrides.component || 'TestComponent',
    context: {
      userId: 'user-test',
      countyId: 'benton',
      roles: ['appraiser'],
      reasonCode: null,
      ...(overrides.context || {}),
    },
  };
}

// Suite 1: Retention Window
describe('D2 Retention Window: exportNDJSON filters by ISO 8601 bounds', () => {
  const earlyEvent = makeEvent({ id: 'evt-early', timestamp: '2026-01-15T10:00:00.000Z', summary: 'Early event' });
  const midEvent = makeEvent({ id: 'evt-mid', timestamp: '2026-02-15T10:00:00.000Z', summary: 'Mid event' });
  const lateEvent = makeEvent({ id: 'evt-late', timestamp: '2026-03-15T10:00:00.000Z', summary: 'Late event' });
  const allEvents = [earlyEvent, midEvent, lateEvent];

  it('no from/to -> all events included', () => {
    const ndjson = exportNDJSON(allEvents, {});
    const lines = ndjson.split('\n');
    assert.equal(lines.length, 3, 'all 3 events present');
  });

  it('from filter excludes events before the lower bound', () => {
    const ndjson = exportNDJSON(allEvents, { from: '2026-02-01T00:00:00.000Z' });
    const lines = ndjson.split('\n');
    assert.equal(lines.length, 2, 'early event excluded');
    const parsed = lines.map(l => JSON.parse(l));
    assert.ok(parsed.every(e => e.timestamp >= '2026-02-01T00:00:00.000Z'));
  });

  it('to filter excludes events after the upper bound', () => {
    const ndjson = exportNDJSON(allEvents, { to: '2026-02-28T23:59:59.999Z' });
    const lines = ndjson.split('\n');
    assert.equal(lines.length, 2, 'late event excluded');
    const parsed = lines.map(l => JSON.parse(l));
    assert.ok(parsed.every(e => e.timestamp <= '2026-02-28T23:59:59.999Z'));
  });

  it('from + to together define a retention window', () => {
    const ndjson = exportNDJSON(allEvents, {
      from: '2026-02-01T00:00:00.000Z',
      to: '2026-02-28T23:59:59.999Z',
    });
    const lines = ndjson.split('\n');
    assert.equal(lines.length, 1, 'only mid event in window');
    const parsed = JSON.parse(lines[0]);
    assert.equal(parsed.timestamp, '2026-02-15T10:00:00.000Z');
  });

  it('empty result when window excludes all events', () => {
    const ndjson = exportNDJSON(allEvents, {
      from: '2027-01-01T00:00:00.000Z',
      to: '2027-12-31T23:59:59.999Z',
    });
    assert.equal(ndjson, '', 'empty string for no matching events');
  });
});

// Suite 2: PII Leak Guard
describe('D2 PII Leak Guard: toAuditRecord sanitizes SSN, phone, email from summary', () => {
  it('SSN pattern (###-##-####) is replaced with [SSN_REDACTED]', () => {
    const evt = makeEvent({ summary: 'Owner SSN: 123-45-6789 on file' });
    const record = toAuditRecord(evt);
    assert.ok(!record.summary.includes('123-45-6789'), 'SSN must not appear');
    assert.ok(record.summary.includes('[SSN_REDACTED]'), 'SSN replaced with token');
  });

  it('phone number is replaced with [PHONE_REDACTED]', () => {
    const evt = makeEvent({ summary: 'Contact: 509-555-1234 for owner' });
    const record = toAuditRecord(evt);
    assert.ok(!record.summary.includes('509-555-1234'), 'phone must not appear');
    assert.ok(record.summary.includes('[PHONE_REDACTED]'), 'phone replaced with token');
  });

  it('email is replaced with [EMAIL_REDACTED]', () => {
    const evt = makeEvent({ summary: 'Notify owner@county.gov about appeal' });
    const record = toAuditRecord(evt);
    assert.ok(!record.summary.includes('owner@county.gov'), 'email must not appear');
    assert.ok(record.summary.includes('[EMAIL_REDACTED]'), 'email replaced with token');
  });

  it('multiple PII types in one summary are all sanitized', () => {
    const evt = makeEvent({
      summary: 'SSN: 111-22-3333, phone: 509-555-0000, email: test@gov.wa.us',
    });
    const record = toAuditRecord(evt);
    assert.ok(!record.summary.includes('111-22-3333'), 'SSN removed');
    assert.ok(!record.summary.includes('509-555-0000'), 'phone removed');
    assert.ok(!record.summary.includes('test@gov.wa.us'), 'email removed');
  });

  it('PII-free summary passes through unchanged', () => {
    const evt = makeEvent({ summary: 'Valuation model updated for parcel 12345' });
    const record = toAuditRecord(evt);
    assert.equal(record.summary, 'Valuation model updated for parcel 12345');
  });
});

// Suite 3: Redaction Event Classification
describe('D2 Redaction Classification: redaction events -> decision redaction', () => {
  it('redaction_requested -> decision: redaction', () => {
    const evt = makeEvent({ type: 'redaction_requested' });
    const record = toAuditRecord(evt);
    assert.equal(record.decision, 'redaction');
  });

  it('redaction_ticket_created -> decision: redaction', () => {
    const evt = makeEvent({ type: 'redaction_ticket_created' });
    const record = toAuditRecord(evt);
    assert.equal(record.decision, 'redaction');
  });
});

// Suite 4: Backward Compatibility
describe('D2 Backward Compatibility: existing decision mappings unaffected', () => {
  it('tool_completed -> decision: allowed', () => {
    const evt = makeEvent({ type: 'tool_completed' });
    assert.equal(toAuditRecord(evt).decision, 'allowed');
  });

  it('tool_invoked -> decision: allowed', () => {
    const evt = makeEvent({ type: 'tool_invoked' });
    assert.equal(toAuditRecord(evt).decision, 'allowed');
  });

  it('tool_failed + governance errorCode -> decision: blocked', () => {
    const evt = makeEvent({ type: 'tool_failed', errorCode: 'WRITE_LANE_MISMATCH' });
    assert.equal(toAuditRecord(evt).decision, 'blocked');
  });

  it('tool_failed + non-governance errorCode -> decision: failed', () => {
    const evt = makeEvent({ type: 'tool_failed', errorCode: 'HANDLER_ERROR' });
    assert.equal(toAuditRecord(evt).decision, 'failed');
  });
});

// Suite 5: Merge-Check Hardening (backwards compat, invalid timestamps, long summary)
describe('D2 Merge-Check: backwards compatibility with no options arg', () => {
  it('exportNDJSON(events) with no second argument returns all events', () => {
    const events = [
      makeEvent({ id: 'evt-a', timestamp: '2026-01-01T00:00:00.000Z' }),
      makeEvent({ id: 'evt-b', timestamp: '2026-06-01T00:00:00.000Z' }),
    ];
    const ndjson = exportNDJSON(events);
    const lines = ndjson.split('\n');
    assert.equal(lines.length, 2, 'all events returned with no options');
  });

  it('exportNDJSON(events) with only auditFormat returns all events as audit records', () => {
    const events = [
      makeEvent({ id: 'evt-c', timestamp: '2026-01-01T00:00:00.000Z' }),
    ];
    const ndjson = exportNDJSON(events, { auditFormat: true });
    const lines = ndjson.split('\n');
    assert.equal(lines.length, 1);
    const record = JSON.parse(lines[0]);
    assert.ok('decision' in record, 'audit record has decision field');
    assert.ok(!('type' in record), 'audit record does not have raw type field');
  });
});

describe('D2 Merge-Check: invalid/missing timestamps are handled safely', () => {
  function makeRawEvent(overrides = {}) {
    return {
      id: overrides.id || 'evt-raw',
      correlationId: 'corr-raw',
      toolId: 'test_tool',
      type: 'tool_completed',
      timestamp: overrides.timestamp,
      summary: overrides.summary || 'Raw event',
      errorCode: undefined,
      component: 'TestComponent',
      context: { userId: 'u', countyId: 'c', roles: ['r'], reasonCode: null },
    };
  }

  it('event with undefined timestamp is included when no from/to', () => {
    const events = [
      makeEvent({ id: 'evt-ok', timestamp: '2026-06-01T00:00:00.000Z' }),
      makeRawEvent({ id: 'evt-undef', timestamp: undefined }),
    ];
    const ndjson = exportNDJSON(events);
    const lines = ndjson.split('\n');
    assert.equal(lines.length, 2, 'both events included');
  });

  it('event with undefined timestamp is excluded by from filter (no crash)', () => {
    const events = [
      makeEvent({ id: 'evt-ok', timestamp: '2026-06-01T00:00:00.000Z' }),
      makeRawEvent({ id: 'evt-undef', timestamp: undefined }),
    ];
    const ndjson = exportNDJSON(events, { from: '2026-01-01T00:00:00.000Z' });
    const lines = ndjson.split('\n').filter(l => l.length > 0);
    // undefined >= 'any string' is false, so it should be excluded
    assert.equal(lines.length, 1, 'undefined timestamp excluded by from');
  });

  it('event with empty string timestamp is excluded by from filter (no crash)', () => {
    const events = [
      makeEvent({ id: 'evt-ok', timestamp: '2026-06-01T00:00:00.000Z' }),
      makeRawEvent({ id: 'evt-empty', timestamp: '' }),
    ];
    const ndjson = exportNDJSON(events, { from: '2026-01-01T00:00:00.000Z' });
    const lines = ndjson.split('\n').filter(l => l.length > 0);
    assert.equal(lines.length, 1, 'empty timestamp excluded by from');
  });
});

describe('D2 Merge-Check: PII regex performance on long summaries', () => {
  it('10K character summary with embedded PII completes in < 50ms', () => {
    const padding = 'A'.repeat(5000);
    const longSummary = padding + ' SSN: 999-88-7777 phone: 360-555-9999 email: long@test.gov ' + padding;
    const evt = makeEvent({ summary: longSummary });
    const start = performance.now();
    const record = toAuditRecord(evt);
    const elapsed = performance.now() - start;
    assert.ok(elapsed < 50, 'PII sanitization completes in < 50ms, got ' + elapsed.toFixed(2) + 'ms');
    assert.ok(!record.summary.includes('999-88-7777'), 'SSN redacted in long summary');
    assert.ok(!record.summary.includes('360-555-9999'), 'phone redacted in long summary');
    assert.ok(!record.summary.includes('long@test.gov'), 'email redacted in long summary');
  });

  it('100K character summary does not cause catastrophic backtracking', () => {
    const hugeSummary = 'X'.repeat(100000);
    const evt = makeEvent({ summary: hugeSummary });
    const start = performance.now();
    const record = toAuditRecord(evt);
    const elapsed = performance.now() - start;
    assert.ok(elapsed < 200, '100K summary processed in < 200ms, got ' + elapsed.toFixed(2) + 'ms');
    assert.equal(record.summary, hugeSummary, 'no-PII summary passes through unchanged');
  });
});

// Suite 5: Merge-Check Hardening (backwards compat, invalid timestamps, long summary)
