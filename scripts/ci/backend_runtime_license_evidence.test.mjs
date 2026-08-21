import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';

import {
  buildBackendRuntimeLicenseEvidence,
  validateBackendRuntimeLicenseEvidence,
} from './backend_runtime_license_evidence.mjs';

const binding = {
  releaseSha: 'a'.repeat(40),
  backendImage: 'ghcr.io/bsvalues/terrafusion-os-backend-internal',
  backendDigest: `sha256:${'b'.repeat(64)}`,
  backendRef: `ghcr.io/bsvalues/terrafusion-os-backend-internal@sha256:${'b'.repeat(64)}`,
};

function packageRecord(name, versionInfo, purl, licenseDeclared = 'NOASSERTION') {
  return {
    name,
    versionInfo,
    licenseDeclared,
    licenseConcluded: licenseDeclared,
    ...(purl
      ? {
          externalRefs: [
            {
              referenceCategory: 'PACKAGE-MANAGER',
              referenceType: 'purl',
              referenceLocator: purl,
            },
          ],
        }
      : {}),
  };
}

function fixture() {
  const document = {
    name: 'backend-runtime',
    documentNamespace: 'https://example.test/backend-runtime',
    packages: [
      packageRecord('NuGet.A', '1.0.0', 'pkg:nuget/NuGet.A@1.0.0'),
      packageRecord('NuGet.A', '1.0.0', 'pkg:nuget/NuGet.A@1.0.0'),
      packageRecord('NuGet.B', '2.0.0', 'pkg:nuget/NuGet.B@2.0.0', 'MIT'),
      packageRecord('busybox', '1.0-r0', 'pkg:apk/alpine/busybox@1.0-r0', 'GPL-2.0-only'),
      packageRecord('native-lib', 'UNKNOWN', null, 'Apache-2.0'),
    ],
  };
  const bytes = Buffer.from(JSON.stringify(document));
  return { bytes, document };
}

test('creates deterministic digest-bound backend evidence without claiming legal approval', () => {
  const { bytes, document } = fixture();
  const first = buildBackendRuntimeLicenseEvidence(bytes, document, binding);
  const second = buildBackendRuntimeLicenseEvidence(bytes, document, binding);

  assert.deepEqual(first, second);
  assert.deepEqual(first.binding, binding);
  assert.equal(first.input.spdxSha256, crypto.createHash('sha256').update(bytes).digest('hex'));
  assert.equal(first.input.packageOccurrenceCount, 5);
  assert.equal(first.inventory.uniqueIdentityCount, 4);
  assert.equal(first.inventory.duplicateOccurrenceCount, 1);
  assert.equal(first.inventory.assertedLicenseOccurrenceCount, 3);
  assert.equal(first.inventory.missingAssertedLicenseOccurrenceCount, 2);
  assert.deepEqual(first.inventory.purlTypeOccurrenceCounts, { apk: 1, 'no-purl': 1, nuget: 3 });
  assert.deepEqual(first.inventory.uniqueIdentityCountsByPurlType, {
    apk: 1,
    'no-purl': 1,
    nuget: 2,
  });
  assert.equal(first.copyleftCandidates.length, 1);
  assert.equal(first.copyleftCandidates[0].name, 'busybox');
  assert.equal(first.disposition.automatedLegalApproval, false);
  assert.equal(first.disposition.requiresProtectedReleaseLegalApproval, true);
  assert.equal(first.disposition.backendDistributionApprovalRequired, true);
  assert.match(first.disposition.statement, /evidence only/);
  assert.deepEqual(validateBackendRuntimeLicenseEvidence(first, binding), binding);
});

test('rejects release, digest, ref, and approval-wall tampering', () => {
  const { bytes, document } = fixture();
  const evidence = buildBackendRuntimeLicenseEvidence(bytes, document, binding);
  for (const [mutate, pattern] of [
    [copy => (copy.binding.releaseSha = 'c'.repeat(40)), /releaseSha does not match/],
    [copy => (copy.binding.backendDigest = `sha256:${'d'.repeat(64)}`), /not digest-bound/],
    [copy => (copy.binding.backendRef = 'not-a-ref'), /not digest-bound/],
    [copy => (copy.disposition.backendDistributionApprovalRequired = false), /approval wall/],
  ]) {
    const copy = structuredClone(evidence);
    mutate(copy);
    assert.throws(() => validateBackendRuntimeLicenseEvidence(copy, binding), pattern);
  }
});

test('fails closed for malformed backend runtime inventory inputs', () => {
  assert.throws(
    () => buildBackendRuntimeLicenseEvidence(Buffer.from('{}'), {}, binding),
    /at least one package/
  );
  assert.throws(
    () =>
      buildBackendRuntimeLicenseEvidence(
        Buffer.from('{}'),
        {
          packages: [
            {
              name: 'ambiguous',
              versionInfo: '1.0.0',
              licenseDeclared: 'MIT',
              externalRefs: [
                { referenceType: 'purl', referenceLocator: 'pkg:nuget/a@1.0.0' },
                { referenceType: 'purl', referenceLocator: 'pkg:nuget/b@1.0.0' },
              ],
            },
          ],
        },
        binding
      ),
    /conflicting package purls/
  );
  assert.throws(
    () =>
      buildBackendRuntimeLicenseEvidence(
        Buffer.from('{}'),
        { packages: [{ name: 'bad-license', licenseDeclared: '' }] },
        binding
      ),
    /licenseDeclared must be a non-empty string/
  );
});
