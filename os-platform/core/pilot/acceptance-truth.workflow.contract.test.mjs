import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..', '..', '..');
const matrixScript = readFileSync(
  join(ROOT, 'scripts', 'terraforge-production-matrix-smoke.mjs'),
  'utf8',
);
const acceptanceScript = readFileSync(
  join(ROOT, 'os-platform', 'core', 'pilot', 'os-production-acceptance-smoke.mjs'),
  'utf8',
);
const truthModulePath = join(ROOT, 'os-platform', 'core', 'pilot', 'acceptance-truth.mjs');

describe('acceptance harness truth repair contract', () => {
  it('keeps the shared truth module alongside the smoke scripts', () => {
    assert.ok(existsSync(truthModulePath));
  });

  it('routes TerraForge proof through shared truth classification instead of clickability-only checks', () => {
    assert.match(matrixScript, /classifyCapabilityObservation/);
    assert.match(matrixScript, /evaluateTerraForgeProof/);
    assert.doesNotMatch(matrixScript, /card\.click\(\{\s*trial:\s*true/);
  });

  it('routes OS acceptance through visible release identity checks', () => {
    assert.match(acceptanceScript, /evaluateSurfaceObservation/);
    assert.match(acceptanceScript, /visibleReleaseSha|visible release/i);
  });
});
