import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';

import { buildBackendRuntimeLicenseEvidence } from './backend_runtime_license_evidence.mjs';

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

test('creates deterministic backend evidence without claiming legal approval', () => {
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
  const first = buildBackendRuntimeLicenseEvidence(bytes, document);
  const second = buildBackendRuntimeLicenseEvidence(bytes, document);

  assert.deepEqual(first, second);
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
  assert.match(first.disposition.statement, /evidence only/);
});

test('fails closed for malformed backend runtime inventory inputs', () => {
  assert.throws(
    () => buildBackendRuntimeLicenseEvidence(Buffer.from('{}'), {}),
    /at least one package/
  );
  assert.throws(
    () =>
      buildBackendRuntimeLicenseEvidence(Buffer.from('{}'), {
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
      }),
    /conflicting package purls/
  );
  assert.throws(
    () =>
      buildBackendRuntimeLicenseEvidence(Buffer.from('{}'), {
        packages: [{ name: 'bad-license', licenseDeclared: '' }],
      }),
    /licenseDeclared must be a non-empty string/
  );
});
