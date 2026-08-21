import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';

import { buildBackendRuntimeLicenseEvidence } from './backend_runtime_license_evidence.mjs';
import {
  FORGE_VALUATION_KERNEL,
  createReleaseImageManifest,
  validateForgeProducerManifestDocument,
  validateReleaseImageManifest,
  verifyBackendLicenseEvidence,
  verifyForgeProducerManifest,
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

function forgeProducerManifest() {
  return {
    schemaVersion: 1,
    artifactType: FORGE_VALUATION_KERNEL.artifactType,
    repository: 'bsvalues/terrafusion-forge',
    producerCommit: FORGE_VALUATION_KERNEL.producerCommit,
    canonicalSourceCommit: FORGE_VALUATION_KERNEL.canonicalSourceCommit,
    canonicalSourceIntegrity: { files: { ...FORGE_VALUATION_KERNEL.sourceFiles } },
    contracts: FORGE_VALUATION_KERNEL.contracts.map((contract) => ({
      ...contract,
      authorityRepository: FORGE_VALUATION_KERNEL.authorityRepository,
      authorityFreezeCommit: FORGE_VALUATION_KERNEL.authorityFreezeCommit,
      digestAlgorithm: FORGE_VALUATION_KERNEL.digestAlgorithm,
    })),
    build: { target: 'x86_64-unknown-linux-musl', rustc: 'producer-recorded' },
    executable: {
      filename: FORGE_VALUATION_KERNEL.executableFilename,
      sha256: FORGE_VALUATION_KERNEL.executableSha256,
    },
  };
}

function validManifest() {
  return createReleaseImageManifest({
    releaseSha: sha,
    backendImage,
    backendDigest,
    frontendImage,
    frontendDigest,
    backendLicenseEvidenceSha256,
    forgeArtifactType: FORGE_VALUATION_KERNEL.artifactType,
    forgeImage: FORGE_VALUATION_KERNEL.image,
    forgeDigest: FORGE_VALUATION_KERNEL.digest,
    forgeProducerCommit: FORGE_VALUATION_KERNEL.producerCommit,
    forgeCanonicalSourceCommit: FORGE_VALUATION_KERNEL.canonicalSourceCommit,
    forgeProducerManifestSha256: FORGE_VALUATION_KERNEL.producerManifestSha256,
    forgeExecutableSha256: FORGE_VALUATION_KERNEL.executableSha256,
  });
}

test('accepts exact digest-bound images and inseparable backend and Forge evidence', () => {
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
  assert.equal(
    result.forgeValuationKernel.ref,
    `${FORGE_VALUATION_KERNEL.image}@${FORGE_VALUATION_KERNEL.digest}`
  );
  assert.equal(result.forgeValuationKernel.platformAttestation.status, 'unavailable');
  assert.deepEqual(verifyBackendLicenseEvidence(backendEvidenceBytes, backendEvidence, result), {
    releaseSha: sha,
    backendImage,
    backendDigest,
    backendRef,
  });
  assert.equal(
    validateForgeProducerManifestDocument(forgeProducerManifest()).producerCommit,
    FORGE_VALUATION_KERNEL.producerCommit
  );
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

test('rejects Forge digest, identity, contract, source, and attestation tampering', () => {
  for (const mutate of [
    (manifest) => (manifest.forgeValuationKernel.digest = `sha256:${'9'.repeat(64)}`),
    (manifest) => (manifest.forgeValuationKernel.producerCommit = '9'.repeat(40)),
    (manifest) => (manifest.forgeValuationKernel.contracts[0].digest = '9'.repeat(64)),
    (manifest) => (manifest.forgeValuationKernel.platformAttestation.status = 'verified'),
  ]) {
    const manifest = validManifest();
    mutate(manifest);
    assert.throws(() => validateReleaseImageManifest(manifest), /admitted Forge payload/);
  }

  const producer = forgeProducerManifest();
  producer.canonicalSourceIntegrity.files[
    'kernels/terraforge.kernel.valuation/Cargo.lock'
  ] = '9'.repeat(64);
  assert.throws(
    () => validateForgeProducerManifestDocument(producer),
    /Forge source digest/
  );
});

test('requires exact Forge producer manifest bytes before release verification', () => {
  const producer = forgeProducerManifest();
  const bytes = Buffer.from(JSON.stringify(producer));
  assert.throws(
    () => verifyForgeProducerManifest(bytes, producer, validManifest()),
    /file hash does not match/
  );
});
