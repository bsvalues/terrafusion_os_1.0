import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';

import { buildBackendRuntimeLicenseEvidence } from './backend_runtime_license_evidence.mjs';
import {
  createReleaseImageManifest,
  validateReleaseImageManifest,
  verifyBackendLicenseEvidence,
} from './release_image_manifest.mjs';

const sha = 'a'.repeat(40);
const backendImage = 'ghcr.io/bsvalues/terrafusion-os-backend-internal';
const frontendImage = 'ghcr.io/bsvalues/terrafusion-os-frontend-internal';
const backendDigest = `sha256:${'b'.repeat(64)}`;
const frontendDigest = `sha256:${'c'.repeat(64)}`;
const backendRef = `${backendImage}@${backendDigest}`;
const spdx = { packages: [{ name: 'backend-package', licenseDeclared: 'NOASSERTION' }] };
const spdxBytes = Buffer.from(JSON.stringify(spdx));
const backendEvidence = buildBackendRuntimeLicenseEvidence(spdxBytes, spdx, {
  releaseSha: sha,
  backendImage,
  backendDigest,
  backendRef,
});
const backendEvidenceBytes = Buffer.from(JSON.stringify(backendEvidence));
const backendLicenseEvidenceSha256 = crypto
  .createHash('sha256')
  .update(backendEvidenceBytes)
  .digest('hex');

function validManifest() {
  return createReleaseImageManifest({
    releaseSha: sha,
    backendImage,
    backendDigest,
    frontendImage,
    frontendDigest,
    backendLicenseEvidenceSha256,
  });
}

test('accepts exact digest-bound images and inseparable backend legal-wall evidence', () => {
  const result = validateReleaseImageManifest(validManifest(), {
    releaseSha: sha,
    backendImage,
    frontendImage,
    backendLicenseEvidenceSha256,
  });
  assert.equal(result.schemaVersion, 2);
  assert.equal(result.images.backend.ref, backendRef);
  assert.equal(result.backendDistributionApprovalRequired, true);
  assert.equal(result.backendLicenseEvidence.sha256, backendLicenseEvidenceSha256);
  assert.deepEqual(verifyBackendLicenseEvidence(backendEvidenceBytes, backendEvidence, result), {
    releaseSha: sha,
    backendImage,
    backendDigest,
    backendRef,
  });
});

test('rejects release SHA and approved digest mismatches', () => {
  assert.throws(() =>
    validateReleaseImageManifest(validManifest(), { releaseSha: 'd'.repeat(40) })
  );
  assert.throws(
    () =>
      validateReleaseImageManifest(validManifest(), { backendDigest: `sha256:${'f'.repeat(64)}` }),
    /approved job output/
  );
});

test('rejects image digest, ref, and canonical-name tampering', () => {
  const digest = validManifest();
  digest.images.backend.digest = 'sha256:not-a-digest';
  assert.throws(() => validateReleaseImageManifest(digest));

  const ref = validManifest();
  ref.images.frontend.ref = `${frontendImage}@sha256:${'d'.repeat(64)}`;
  assert.throws(() => validateReleaseImageManifest(ref));

  const name = validManifest();
  name.images.backend.image = 'ghcr.io/bsvalues/not-terrafusion';
  assert.throws(() => validateReleaseImageManifest(name));
});

test('rejects detached, tampered, or approval-clearing backend evidence', () => {
  const missingWall = validManifest();
  missingWall.backendDistributionApprovalRequired = false;
  assert.throws(() => validateReleaseImageManifest(missingWall), /must equal true/);

  const hash = validManifest();
  hash.backendLicenseEvidence.sha256 = '0'.repeat(64);
  assert.throws(
    () => verifyBackendLicenseEvidence(backendEvidenceBytes, backendEvidence, hash),
    /file hash does not match/
  );

  const binding = structuredClone(backendEvidence);
  binding.binding.releaseSha = 'd'.repeat(40);
  assert.throws(
    () => verifyBackendLicenseEvidence(backendEvidenceBytes, binding, validManifest()),
    /file hash does not match|releaseSha does not match/
  );
});
