import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createReleaseImageManifest,
  validateReleaseImageManifest,
} from './release_image_manifest.mjs';

const sha = 'a'.repeat(40);
const backendImage = 'ghcr.io/bsvalues/terrafusion-os-backend-internal';
const frontendImage = 'ghcr.io/bsvalues/terrafusion-os-frontend-internal';
const backendDigest = `sha256:${'b'.repeat(64)}`;
const frontendDigest = `sha256:${'c'.repeat(64)}`;

function validManifest() {
  return createReleaseImageManifest({
    releaseSha: sha,
    backendImage,
    backendDigest,
    frontendImage,
    frontendDigest,
  });
}

test('accepts the exact canonical digest-bound manifest', () => {
  const result = validateReleaseImageManifest(validManifest(), {
    releaseSha: sha,
    backendImage,
    frontendImage,
  });
  assert.equal(result.images.backend.ref, `${backendImage}@${backendDigest}`);
});

test('rejects release SHA mismatch', () => {
  assert.throws(() =>
    validateReleaseImageManifest(validManifest(), { releaseSha: 'd'.repeat(40) })
  );
});

test('rejects approved job-output digest mismatch', () => {
  const manifest = validManifest();
  assert.throws(
    () => validateReleaseImageManifest(manifest, { backendDigest: `sha256:${'f'.repeat(64)}` }),
    /approved job output/
  );
});

test('rejects digest tampering', () => {
  const manifest = validManifest();
  manifest.images.backend.digest = 'sha256:not-a-digest';
  assert.throws(() => validateReleaseImageManifest(manifest));
});

test('rejects ref and canonical image-name mismatch', () => {
  const refMismatch = validManifest();
  refMismatch.images.frontend.ref = `${frontendImage}@sha256:${'d'.repeat(64)}`;
  assert.throws(() => validateReleaseImageManifest(refMismatch));

  const nameMismatch = validManifest();
  nameMismatch.images.backend.image = 'ghcr.io/bsvalues/not-terrafusion';
  assert.throws(() => validateReleaseImageManifest(nameMismatch));
});
