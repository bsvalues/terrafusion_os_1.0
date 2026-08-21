import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { validateSpdxLicensePolicy } from './release_sbom_policy.mjs';

const fixtures = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'release-sbom');
const load = name => JSON.parse(readFileSync(join(fixtures, name), 'utf8'));

test('allows permissive and LGPL licenses', () => {
  assert.equal(validateSpdxLicensePolicy(load('allowed.spdx.json')).packageCount, 1);
});

test('rejects prohibited AGPL/GPL licenses', () => {
  assert.throws(() => validateSpdxLicensePolicy(load('prohibited-agpl.spdx.json')), /prohibited/);
});

test('rejects incomplete package and document-scoped custom license references', () => {
  assert.throws(
    () => validateSpdxLicensePolicy(load('unresolved-license-ref.spdx.json')),
    /missing a source-bound name/
  );
  assert.throws(
    () => validateSpdxLicensePolicy(load('unresolved-document-license-ref.spdx.json')),
    /external custom license reference is not allowed/
  );
});

test('allows only exact same-document custom license evidence and rejects mismatches', () => {
  const info = {
    licenseId: 'LicenseRef-npm-mapbox-gl-3.20.0-Mapbox-TOS',
    extractedText: 'Exact installed Mapbox test terms',
    name: 'Mapbox Terms of Service for mapbox-gl@3.20.0',
    comment: 'Source: installed mapbox-gl@3.20.0/LICENSE.txt',
  };
  const pkg = { name: 'mapbox-gl', licenseDeclared: info.licenseId };
  assert.equal(
    validateSpdxLicensePolicy({ hasExtractedLicensingInfos: [info], packages: [pkg] }).packageCount,
    1
  );
  assert.throws(
    () => validateSpdxLicensePolicy({ packages: [pkg] }),
    /unresolved custom license reference/
  );
  assert.throws(
    () =>
      validateSpdxLicensePolicy({
        hasExtractedLicensingInfos: [info, { ...info }],
        packages: [pkg],
      }),
    /duplicate extracted license/
  );
  assert.throws(
    () =>
      validateSpdxLicensePolicy({
        hasExtractedLicensingInfos: [{ ...info, extractedText: '' }],
        packages: [pkg],
      }),
    /empty extractedText/
  );
  assert.throws(
    () =>
      validateSpdxLicensePolicy({
        hasExtractedLicensingInfos: [{ ...info, licenseId: 'LicenseRef-unused' }],
        packages: [pkg],
      }),
    /unresolved custom license reference/
  );
  assert.throws(
    () =>
      validateSpdxLicensePolicy({
        hasExtractedLicensingInfos: [info],
        packages: [{ name: 'external', licenseDeclared: 'DocumentRef-upstream:LicenseRef-Custom' }],
      }),
    /external custom license reference is not allowed/
  );
});

test('rejects missing and NOASSERTION package licenses', () => {
  for (const pkg of [
    { name: 'missing-license' },
    { name: 'unknown', licenseConcluded: 'NOASSERTION' },
  ]) {
    assert.throws(
      () => validateSpdxLicensePolicy({ packages: [pkg] }, 'unknown.spdx.json'),
      /missing asserted license metadata/
    );
  }
});

test('parses complete SPDX expressions and rejects placeholders or malformed syntax', () => {
  for (const expression of ['MIT', 'MIT OR Apache-2.0', 'Apache-2.0 WITH LLVM-exception']) {
    assert.equal(
      validateSpdxLicensePolicy({ packages: [{ name: 'valid', licenseDeclared: expression }] })
        .packageCount,
      1
    );
  }

  for (const expression of [
    'UNKNOWN',
    'UNLICENSED',
    'SEE LICENSE IN LICENSE',
    'MIT OR UNKNOWN',
    'MIT OR',
  ]) {
    assert.throws(
      () =>
        validateSpdxLicensePolicy({ packages: [{ name: 'invalid', licenseDeclared: expression }] }),
      /unresolved license placeholder|invalid SPDX license expression/
    );
  }
});

test('rejects prohibited licenses at any leaf of a parsed SPDX expression', () => {
  assert.throws(
    () =>
      validateSpdxLicensePolicy({
        packages: [{ name: 'nested-gpl', licenseDeclared: 'MIT OR (Apache-2.0 AND GPL-3.0-only)' }],
      }),
    /prohibited GPL-3.0-only/
  );
});

test('rejects malformed or empty SPDX package data', () => {
  assert.throws(
    () => validateSpdxLicensePolicy(load('malformed.spdx.json')),
    /at least one package/
  );
  assert.throws(() => validateSpdxLicensePolicy({ packages: [] }), /at least one package/);
});

test('missing fixture reads fail closed', () => {
  assert.throws(() => readFileSync(join(fixtures, 'missing.spdx.json'), 'utf8'));
});
