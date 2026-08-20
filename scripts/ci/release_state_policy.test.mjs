import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createSecretlessArtifactMetadata,
  planDeployment,
  planRollback,
} from './release_state_policy.mjs';

const shaA = 'a'.repeat(40);
const shaB = 'b'.repeat(40);
const ref = (component, digit) =>
  `ghcr.io/bsvalues/terrafusion-os-${component}-internal@sha256:${digit.repeat(64)}`;
const artifact = (sha, digit) => ({
  sha,
  backendRef: ref('backend', digit),
  frontendRef: ref('frontend', digit),
});

test('legacy current state is preserved once before first digest deployment', () => {
  const state = { currentSha: shaA, snapshots: {} };
  assert.equal(planDeployment(state, artifact(shaB, 'b')).preserveCurrent, true);
});

test('A to B to explicit rollback A is stable and repeated rollback is a no-op', () => {
  const initial = { currentSha: shaA, snapshots: { [shaA]: artifact(shaA, 'a') } };
  const deployed = planDeployment(initial, artifact(shaB, 'b')).nextState;
  const rolledBack = planRollback(deployed, shaA);
  assert.equal(rolledBack.noop, false);
  assert.equal(rolledBack.nextState.currentSha, shaA);
  const repeated = planRollback(rolledBack.nextState, shaA);
  assert.equal(repeated.noop, true);
  assert.equal(repeated.nextState.currentSha, shaA);
});

test('same-SHA legacy migration rejects a different approved digest before mutation', () => {
  const state = {
    currentSha: shaA,
    snapshots: {},
    legacyCurrentArtifact: artifact(shaA, 'a'),
  };
  assert.throws(() => planDeployment(state, artifact(shaA, 'c')), /different image digests/);
});

test('same SHA cannot be rebound to a different digest identity', () => {
  const state = { currentSha: shaA, snapshots: { [shaA]: artifact(shaA, 'a') } };
  assert.throws(() => planDeployment(state, artifact(shaA, 'c')), /different image digests/);
});

test('legacy conversion keeps release metadata and excludes protected values', () => {
  const metadata = createSecretlessArtifactMetadata(
    {
      TF_RELEASE_SHA: shaA,
      TF_RELEASE_ENV: 'production',
      TF_PUBLIC_URL: 'https://example.invalid',
      TERRAFUSION_BOOTSTRAP_PASSWORD: 'must-not-survive',
      API_TOKEN: 'must-not-survive',
    },
    { backendRef: ref('backend', 'a'), frontendRef: ref('frontend', 'a') }
  );
  assert.equal(metadata.TF_RELEASE_SHA, shaA);
  assert.equal(metadata.TERRAFUSION_BOOTSTRAP_PASSWORD, undefined);
  assert.equal(metadata.API_TOKEN, undefined);
});
