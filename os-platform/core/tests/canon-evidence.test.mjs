/**
 * Canon evidence bundle + trace seal — self-test.
 *
 * The "proof" half of the doctrine: a deterministic, fail-loud evidence bundle
 * builder plus a tamper-evident trace seal. Dep-free (node:crypto only).
 * Run: node --test os-platform/core/tests/canon-evidence.test.mjs
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildEvidenceBundle,
  canonicalize,
  serializeEvidenceBundle,
} from '../canon/canon-evidence.mjs';
import { computeContentHash, sealEvidenceBundle, verifyTraceSeal } from '../canon/canon-trace-seal.mjs';

/** Minimal valid bundle input. */
function validInput(overrides = {}) {
  return {
    taskId: 'canon-task-demo',
    intent: 'Prove the Canon runtime end to end.',
    surface: 'os-canon',
    canonRulesLoaded: ['surface.os-canon.in-shell'],
    filesRead: ['os-platform/core/canon/canon-query.mjs'],
    filesChanged: ['os-platform/core/canon/canon-loader.mjs'],
    commandsRun: [{ command: 'node --test', status: 'pass' }],
    gateResults: [
      { gateId: 'typecheck', status: 'pass', startedAt: '2026-06-05T00:00:00Z', finishedAt: '2026-06-05T00:00:01Z' },
    ],
    diffHash: 'sha256-abc',
    riskScore: 70,
    ...overrides,
  };
}

test('EB.1 builds a frozen, unsealed bundle from valid input', () => {
  const b = buildEvidenceBundle(validInput());
  assert.equal(b.sealed, false);
  assert.equal(b.taskId, 'canon-task-demo');
  assert.ok(Object.isFrozen(b));
  assert.ok(Array.isArray(b.gateResults));
});

test('EB.2 missing taskId fails loudly', () => {
  const input = validInput();
  delete input.taskId;
  assert.throws(() => buildEvidenceBundle(input), /taskId/i);
});

test('EB.3 non-number riskScore fails loudly', () => {
  assert.throws(() => buildEvidenceBundle(validInput({ riskScore: 'high' })), /riskScore/i);
});

test('EB.4 gate result with invalid status fails loudly', () => {
  const input = validInput({ gateResults: [{ gateId: 'x', status: 'maybe' }] });
  assert.throws(() => buildEvidenceBundle(input), /status/i);
});

test('EB.5 build forces sealed=false even if input says true', () => {
  const b = buildEvidenceBundle(validInput({ sealed: true }));
  assert.equal(b.sealed, false);
});

test('EB.6 canonicalize is key-order independent', () => {
  const a = canonicalize({ b: 1, a: 2, nested: { y: 1, x: 2 } });
  const c = canonicalize({ nested: { x: 2, y: 1 }, a: 2, b: 1 });
  assert.equal(a, c);
});

test('EB.7 computeContentHash is deterministic and content-sensitive', () => {
  const b1 = buildEvidenceBundle(validInput());
  const b2 = buildEvidenceBundle(validInput());
  assert.equal(computeContentHash(b1), computeContentHash(b2));
  const b3 = buildEvidenceBundle(validInput({ diffHash: 'sha256-different' }));
  assert.notEqual(computeContentHash(b1), computeContentHash(b3));
});

test('EB.8 sealing sets sealed/sealedAt/traceHash and leaves original immutable', () => {
  const b = buildEvidenceBundle(validInput());
  const sealed = sealEvidenceBundle(b, '2026-06-05T12:00:00Z');
  assert.equal(sealed.sealed, true);
  assert.equal(sealed.sealedAt, '2026-06-05T12:00:00Z');
  assert.match(sealed.traceHash, /^sha256-[0-9a-f]{64}$/);
  assert.equal(b.sealed, false); // original untouched
});

test('EB.9 cannot seal a bundle with a failed gate', () => {
  const b = buildEvidenceBundle(
    validInput({ gateResults: [{ gateId: 'typecheck', status: 'fail' }] }),
  );
  assert.throws(() => sealEvidenceBundle(b, '2026-06-05T12:00:00Z'), /fail/i);
});

test('EB.10 verifyTraceSeal true for sealed bundle, false after tampering', () => {
  const sealed = sealEvidenceBundle(buildEvidenceBundle(validInput()), '2026-06-05T12:00:00Z');
  assert.equal(verifyTraceSeal(sealed), true);
  const tampered = { ...sealed, riskScore: 5 };
  assert.equal(verifyTraceSeal(tampered), false);
});

test('EB.11 verifyTraceSeal false for an unsealed bundle', () => {
  assert.equal(verifyTraceSeal(buildEvidenceBundle(validInput())), false);
});

test('EB.12 serialize round-trips to the same content hash', () => {
  const sealed = sealEvidenceBundle(buildEvidenceBundle(validInput()), '2026-06-05T12:00:00Z');
  const reparsed = JSON.parse(serializeEvidenceBundle(sealed));
  assert.equal(verifyTraceSeal(reparsed), true);
});
