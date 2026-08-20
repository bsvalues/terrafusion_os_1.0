import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..', '..', '..');
const matrixScript = readFileSync(
  join(ROOT, 'scripts', 'terraforge-production-matrix-smoke.mjs'),
  'utf8'
);
const acceptanceScript = readFileSync(
  join(ROOT, 'os-platform', 'core', 'pilot', 'os-production-acceptance-smoke.mjs'),
  'utf8'
);
const releaseLane = readFileSync(join(ROOT, '.github', 'workflows', 'release-lane.yml'), 'utf8');
const releaseCompliance = readFileSync(
  join(ROOT, '.github', 'workflows', 'release-compliance.yml'),
  'utf8'
);
const frontendDockerfile = readFileSync(join(ROOT, 'frontend', 'Dockerfile'), 'utf8');
const truthModulePath = join(ROOT, 'os-platform', 'core', 'pilot', 'acceptance-truth.mjs');

describe('acceptance harness truth repair contract', () => {
  it('keeps the shared truth module alongside the smoke scripts', () => {
    assert.ok(existsSync(truthModulePath));
  });

  it('routes TerraForge proof through shared truth classification instead of clickability-only checks', () => {
    assert.match(matrixScript, /\bclassifyCapabilityObservation\s*\(/);
    assert.match(matrixScript, /\bevaluateTerraForgeProof\s*\(\s*\{/);
    assert.doesNotMatch(matrixScript, /card\.click\(\{\s*trial:\s*true/);
  });

  it('routes OS acceptance through visible release identity checks', () => {
    assert.match(acceptanceScript, /\bevaluateSurfaceObservation\s*\(\s*\{/);
    assert.match(
      acceptanceScript,
      /expectedReleaseSha:\s*expectedReleaseSha\s*\?\?\s*evidence\.releaseSha/
    );
    assert.match(acceptanceScript, /\bvisibleReleaseSha\b|visible release/i);
  });

  it('passes the release SHA into the frontend production build', () => {
    assert.match(frontendDockerfile, /\bARG\s+VITE_BUILD_SHA=dev\b/);
    assert.match(frontendDockerfile, /\bENV\s+VITE_BUILD_SHA=\$VITE_BUILD_SHA\b/);
    assert.match(
      releaseCompliance,
      /target: production[\s\S]*VITE_BUILD_SHA=\$\{\{ github\.sha \}\}/
    );
    assert.match(releaseLane, /release_image_manifest\.mjs verify/);
    assert.doesNotMatch(releaseLane, /docker build|docker push/);
  });

  it('waits deterministically for launched TerraForge modules', () => {
    assert.match(matrixScript, /\bwaitForLaunchedModule\s*\(/);
    assert.match(matrixScript, /\bpage\s*\.\s*waitForFunction\s*\(/);
    assert.doesNotMatch(matrixScript, /waitForTimeout\s*\(\s*250\s*\)/);
  });

  it('checks disabled TerraForge cards before clicking them', () => {
    const disabledCheckIndex = matrixScript.indexOf(
      'launchActionable = !(await card.isDisabled())'
    );
    const clickIndex = matrixScript.indexOf('await card.click({ timeout: 10000 })');

    assert.notEqual(disabledCheckIndex, -1);
    assert.notEqual(clickIndex, -1);
    assert.ok(disabledCheckIndex < clickIndex);
  });

  it('inspects markup for parcel-scoped Forge routes and records support blockers', () => {
    assert.match(matrixScript, /\binnerHTML\b/);
    assert.match(matrixScript, /evidence\.blockers\.push\(blocker\)/);
  });
});
