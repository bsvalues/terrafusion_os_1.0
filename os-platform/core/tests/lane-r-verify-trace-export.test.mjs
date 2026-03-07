/**
 * Lane R: verify-trace-export contract tests.
 *
 * Tests the CLI verification logic without spawning a subprocess —
 * we import the hash computation approach and validate against known fixtures.
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFileSync, unlinkSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { describe, it, before, after } from 'node:test';

const TOOL_PATH = join(import.meta.dirname, '..', '..', '..', 'tools', 'verify-trace-export.mjs');

let tempDir;

before(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'trace-verify-'));
});

function writeTempFile(name, content) {
  const p = join(tempDir, name);
  writeFileSync(p, content, 'utf-8');
  return p;
}

function runVerifier(filePath) {
  const args = [TOOL_PATH];
  if (filePath !== undefined) args.push(filePath);
  try {
    const stdout = execFileSync(process.execPath, args, {
      encoding: 'utf-8',
      timeout: 10_000,
    });
    return { exitCode: 0, stdout, stderr: '' };
  } catch (err) {
    return {
      exitCode: err.status ?? 1,
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? '',
    };
  }
}

function buildNdjson(events, { includeHeader = true, includeFooter = true, overrideHash, overrideCount } = {}) {
  const lines = [];

  if (includeHeader) {
    lines.push(JSON.stringify({
      type: 'trace_export_header',
      parcelId: 'P-TEST',
      correlationId: null,
      from: '2026-02-01T00:00:00.000Z',
      to: '2026-03-01T00:00:00.000Z',
      limit: 500,
      exportedAt: '2026-03-03T12:00:00.000Z',
      order: 'timestamp_desc,correlationId_asc,eventId_asc',
    }));
  }

  const hash = createHash('sha256');
  for (const event of events) {
    const line = JSON.stringify(event);
    hash.update(line + '\n');
    lines.push(line);
  }

  if (includeFooter) {
    lines.push(JSON.stringify({
      type: 'trace_export_footer',
      sha256: overrideHash ?? hash.digest('hex'),
      count: overrideCount ?? events.length,
    }));
  }

  return lines.join('\n') + '\n';
}

function makeEvent(id, correlationId = 'corr-1') {
  return {
    eventId: `evt-${id}`,
    type: 'tool_completed',
    toolId: 'run_valuation_model',
    correlationId,
    summary: `test event ${id}`,
    timestamp: '2026-03-03T10:00:00.000Z',
    context: {
      countyId: 'benton',
      userId: 'user-1',
      roles: ['appraiser'],
      mode: 'pilot',
      parcelId: 'P-TEST',
    },
  };
}

describe('verify-trace-export', () => {
  it('exits 2 with no arguments', () => {
    const result = runVerifier(undefined);
    // No file path → usage error
    assert.equal(result.exitCode, 2);
    assert.match(result.stderr, /usage/i);
  });

  it('passes for a valid integrity-mode export', () => {
    const events = [makeEvent(1), makeEvent(2), makeEvent(3)];
    const ndjson = buildNdjson(events);
    const path = writeTempFile('valid.ndjson', ndjson);

    const result = runVerifier(path);
    assert.equal(result.exitCode, 0, `Expected exit 0, got ${result.exitCode}. stderr: ${result.stderr}`);
    assert.match(result.stdout, /INTEGRITY CHECK PASSED/);
    assert.match(result.stdout, /Event count verified: 3/);
    assert.match(result.stdout, /SHA-256 verified/);
  });

  it('fails when SHA-256 is tampered', () => {
    const events = [makeEvent(1)];
    const ndjson = buildNdjson(events, { overrideHash: 'deadbeef'.repeat(8) });
    const path = writeTempFile('bad-hash.ndjson', ndjson);

    const result = runVerifier(path);
    assert.equal(result.exitCode, 1);
    assert.match(result.stderr, /SHA-256 mismatch/);
    assert.match(result.stderr, /INTEGRITY CHECK FAILED/);
  });

  it('fails when count is wrong', () => {
    const events = [makeEvent(1), makeEvent(2)];
    const ndjson = buildNdjson(events, { overrideCount: 5 });
    const path = writeTempFile('bad-count.ndjson', ndjson);

    const result = runVerifier(path);
    assert.equal(result.exitCode, 1);
    assert.match(result.stderr, /count mismatch/i);
  });

  it('fails when header is missing', () => {
    const events = [makeEvent(1)];
    const ndjson = buildNdjson(events, { includeHeader: false });
    const path = writeTempFile('no-header.ndjson', ndjson);

    const result = runVerifier(path);
    assert.equal(result.exitCode, 1);
    assert.match(result.stderr, /no trace_export_header/i);
  });

  it('fails when footer is missing', () => {
    const events = [makeEvent(1)];
    const ndjson = buildNdjson(events, { includeFooter: false });
    const path = writeTempFile('no-footer.ndjson', ndjson);

    const result = runVerifier(path);
    assert.equal(result.exitCode, 1);
    assert.match(result.stderr, /no trace_export_footer/i);
  });

  it('hash is deterministic: same events produce same digest', () => {
    const events = [makeEvent(1), makeEvent(2)];
    const hash1 = createHash('sha256');
    const hash2 = createHash('sha256');

    for (const event of events) {
      const line = JSON.stringify(event) + '\n';
      hash1.update(line);
      hash2.update(line);
    }

    assert.equal(hash1.digest('hex'), hash2.digest('hex'));
  });

  it('verifies a single-event export', () => {
    const events = [makeEvent(1)];
    const ndjson = buildNdjson(events);
    const path = writeTempFile('single.ndjson', ndjson);

    const result = runVerifier(path);
    assert.equal(result.exitCode, 0);
    assert.match(result.stdout, /Event count verified: 1/);
  });
});
