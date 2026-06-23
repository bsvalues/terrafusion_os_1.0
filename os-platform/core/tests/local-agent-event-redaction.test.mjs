// Slice V — Telemetry redaction test.
//
// Verifies the pure redactor and the wired-in eventLog behavior.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..');

const redactURL = pathToFileURL(
  path.join(repoRoot, 'os-platform', 'core', 'pilot', 'local-agent', 'redact.js'),
);
const eventLogURL = pathToFileURL(
  path.join(repoRoot, 'os-platform', 'core', 'pilot', 'local-agent', 'eventLog.js'),
);
const { redactPayload, redactStringValue } = await import(redactURL.href);
const { appendLocalAgentEvent } = await import(eventLogURL.href);

test('redact: Bearer tokens are scrubbed', () => {
  assert.equal(
    redactStringValue('Authorization: Bearer abc123.def456-foo'),
    'Authorization: Bearer [REDACTED:bearer]',
  );
});

test('redact: JWT triple-segment strings are scrubbed', () => {
  const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiYWxpY2UifQ.signature_part_xyz';
  assert.equal(
    redactStringValue(`token=${jwt}&done`),
    'token=[REDACTED:jwt]&done',
  );
});

test('redact: GitHub PATs are scrubbed', () => {
  assert.equal(
    redactStringValue('use ghp_AAAAAAAAAAAAAAAAAAAAAAAAAAAA1234'),
    'use [REDACTED:github-token]',
  );
});

test('redact: Stripe and OpenAI-style sk- keys are scrubbed', () => {
  assert.equal(
    redactStringValue('STRIPE=sk_live_AAAAAAAAAAAAAAAAAAAAAAAA'),
    'STRIPE=[REDACTED:stripe-key]',
  );
  assert.equal(
    redactStringValue('OPENAI=sk-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'),
    'OPENAI=[REDACTED:api-key]',
  );
});

test('redact: AWS access key ids are scrubbed', () => {
  assert.equal(
    redactStringValue('AKIAIOSFODNN7EXAMPLE'),
    '[REDACTED:aws-akid]',
  );
});

test('redact: emails are scrubbed', () => {
  assert.equal(
    redactStringValue('contact alice@example.com or bob@sub.gov.us'),
    'contact [REDACTED:email] or [REDACTED:email]',
  );
});

test('redact: SSN-shaped values are scrubbed', () => {
  assert.equal(redactStringValue('ssn 123-45-6789'), 'ssn [REDACTED:ssn]');
});

// WO-SEC-LOCALOPS-001 — close the phone-number gap so the local-agent redactor
// (used by LocalOps trace) agrees with the canonical trace audit redactor.
test('redact: phone numbers are scrubbed (dash/dot/bare formats)', () => {
  assert.equal(redactStringValue('call 509-555-1234 now'), 'call [REDACTED:phone] now');
  assert.equal(redactStringValue('call 509.555.1234 now'), 'call [REDACTED:phone] now');
  assert.equal(redactStringValue('call 5095551234 now'), 'call [REDACTED:phone] now');
});

test('redact: phone is distinct from SSN and both are scrubbed together', () => {
  assert.equal(
    redactStringValue('SSN 123-45-6789 phone 360-555-9999'),
    'SSN [REDACTED:ssn] phone [REDACTED:phone]',
  );
});

test('redact: SSN/phone/email all scrubbed from one string (I4 invariant)', () => {
  const out = redactStringValue(
    'owner 111-22-3333, ph 509-555-0000, email owner@county.gov',
  );
  for (const pii of ['111-22-3333', '509-555-0000', 'owner@county.gov']) {
    assert.equal(out.includes(pii), false, `raw PII must not survive: ${pii}`);
  }
});

test('redact: phone matcher does not broaden — non-phone numbers survive', () => {
  // Short numbers, ports, years, and >10-digit runs are not phone-shaped and
  // must pass through unchanged (no over-redaction).
  const clean = 'port 11434, year 2026, count 42, id 1700000000000';
  assert.equal(redactStringValue(clean), clean);
});

test('redact: Windows user paths preserve directory shape', () => {
  const out = redactStringValue('opening C:\\Users\\bsval\\terrafusion_os_1.0\\file.log');
  assert.match(out, /[Cc]:\\Users\\\[redacted-user\]\\terrafusion_os_1\.0\\file\.log/);
});

test('redact: POSIX home paths preserve directory shape', () => {
  assert.match(
    redactStringValue('reading /home/alice/work/notes.md'),
    /reading \/home\/\[redacted-user\]\/work\/notes\.md/,
  );
});

test('redact: clean strings are unchanged', () => {
  const clean = 'TerraFusion local-agent ready, 5 adapters online.';
  assert.equal(redactStringValue(clean), clean);
});

test('redactPayload: structure is preserved (object/array/types/lengths)', () => {
  const input = {
    text: 'send to alice@example.com',
    nested: { ssn: 'a 111-22-3333 b', count: 3 },
    list: ['ok', 'sk-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', true, null, 42],
    nullField: null,
    flag: false,
  };
  const { value, stats } = redactPayload(input);
  assert.equal(typeof value, 'object');
  assert.ok(Array.isArray(value.list));
  assert.equal(value.list.length, 5);
  assert.equal(value.list[0], 'ok');
  assert.equal(value.list[1], '[REDACTED:api-key]');
  assert.equal(value.list[2], true);
  assert.equal(value.list[3], null);
  assert.equal(value.list[4], 42);
  assert.equal(value.text, 'send to [REDACTED:email]');
  assert.equal(value.nested.ssn, 'a [REDACTED:ssn] b');
  assert.equal(value.nested.count, 3);
  assert.equal(value.nullField, null);
  assert.equal(value.flag, false);
  assert.ok(stats.replacements >= 3);
});

test('redactPayload: input object is not mutated', () => {
  const input = { email: 'leak@example.com', other: 'fine' };
  const before = JSON.stringify(input);
  redactPayload(input);
  assert.equal(JSON.stringify(input), before, 'redactPayload must not mutate input');
});

test('redactPayload: non-plain values collapse to a sentinel', () => {
  const input = { when: new Date('2026-01-01'), buf: Buffer.from('hi') };
  const { value } = redactPayload(input);
  assert.equal(value.when, '[redacted-non-plain]');
  assert.equal(value.buf, '[redacted-non-plain]');
});

test('appendLocalAgentEvent writes a redacted payload, not the original', () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'tf-redact-'));
  try {
    appendLocalAgentEvent(tmp, 'test.event', {
      who: 'alice@example.com',
      auth: 'Bearer abc123.def456',
      where: 'C:\\Users\\bsval\\file.txt',
      ssn: '999-11-2222',
      ok: true,
      count: 7,
    });

    const log = readFileSync(path.join(tmp, '.terrafusion', 'agent-events.jsonl'), 'utf8');
    const line = log.trim().split('\n').pop();
    const parsed = JSON.parse(line);

    // Schema unchanged.
    assert.equal(parsed.type, 'test.event');
    assert.equal(typeof parsed.ts, 'number');
    assert.ok(parsed.payload && typeof parsed.payload === 'object');

    // Sensitive values redacted.
    assert.equal(parsed.payload.who, '[REDACTED:email]');
    assert.match(parsed.payload.auth, /^Bearer \[REDACTED:bearer\]$/);
    assert.match(parsed.payload.where, /[Cc]:\\Users\\\[redacted-user\]\\file\.txt/);
    assert.equal(parsed.payload.ssn, '[REDACTED:ssn]');

    // Non-sensitive values preserved.
    assert.equal(parsed.payload.ok, true);
    assert.equal(parsed.payload.count, 7);

    // The raw original tokens MUST NOT appear anywhere in the file.
    for (const banned of ['alice@example.com', 'abc123.def456', 'bsval', '999-11-2222']) {
      assert.equal(
        log.includes(banned),
        false,
        `redacted log must not contain raw "${banned}"`,
      );
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
