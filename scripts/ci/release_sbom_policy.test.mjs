import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { validateSpdxLicensePolicy } from './release_sbom_policy.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const fixtures = join(root, 'scripts', 'ci', 'fixtures', 'release-sbom');
const load = name => JSON.parse(readFileSync(join(fixtures, name), 'utf8'));
const mapboxLicenseId = 'LicenseRef-npm-mapbox-gl-3.20.0-Mapbox-TOS';
const mapboxText = readFileSync(
  join(root, 'frontend', 'node_modules', 'mapbox-gl', 'LICENSE.txt'),
  'utf8'
);
const mapboxInfo = {
  licenseId: mapboxLicenseId,
  extractedText: mapboxText,
  name: 'Mapbox Terms of Service for mapbox-gl@3.20.0',
  comment: 'Source: installed mapbox-gl@3.20.0/LICENSE.txt',
};
const mapboxPackage = {
  name: 'mapbox-gl',
  versionInfo: '3.20.0',
  licenseDeclared: mapboxLicenseId,
  licenseConcluded: mapboxLicenseId,
};

test('allows permissive and LGPL licenses', () => {
  assert.equal(validateSpdxLicensePolicy(load('allowed.spdx.json')).packageCount, 1);
});

test('rejects prohibited AGPL/GPL licenses', () => {
  assert.throws(() => validateSpdxLicensePolicy(load('prohibited-agpl.spdx.json')), /prohibited/);
});

test('rejects unsupported package and document-scoped custom license references', () => {
  assert.throws(
    () => validateSpdxLicensePolicy(load('unresolved-license-ref.spdx.json')),
    /unsupported custom license reference/
  );
  assert.throws(
    () => validateSpdxLicensePolicy(load('unresolved-document-license-ref.spdx.json')),
    /external custom license reference is not allowed/
  );
});

test('allows only the exact hash-bound mapbox-gl 3.20.0 Mapbox TOS evidence', () => {
  assert.equal(
    validateSpdxLicensePolicy({
      hasExtractedLicensingInfos: [mapboxInfo],
      packages: [mapboxPackage],
    }).packageCount,
    1
  );
  assert.equal(
    crypto.createHash('sha256').update(mapboxInfo.extractedText, 'utf8').digest('hex'),
    'c24eff481bf098c82fda9949b2d982589df8b36db11fffa49653d4afe1903998'
  );
});

test('rejects fabricated and external custom license evidence fail closed', () => {
  const customId = 'LicenseRef-Custom-Copyleft';
  assert.throws(
    () =>
      validateSpdxLicensePolicy({
        hasExtractedLicensingInfos: [
          {
            licenseId: customId,
            extractedText: 'AGPL-3.0-only terms disguised as custom evidence',
            name: 'Custom license',
            comment: 'Source: attacker-controlled evidence',
          },
        ],
        packages: [
          {
            name: 'malicious',
            versionInfo: '1.0.0',
            licenseDeclared: customId,
            licenseConcluded: customId,
          },
        ],
      }),
    /unsupported custom license reference LicenseRef-Custom-Copyleft/
  );
  assert.throws(
    () =>
      validateSpdxLicensePolicy({
        packages: [{ name: 'custom', licenseDeclared: 'LicenseRef-Arbitrary' }],
      }),
    /unsupported custom license reference LicenseRef-Arbitrary/
  );
  assert.throws(
    () =>
      validateSpdxLicensePolicy({
        hasExtractedLicensingInfos: [mapboxInfo],
        packages: [{ name: 'external', licenseDeclared: 'DocumentRef-upstream:LicenseRef-Custom' }],
      }),
    /external custom license reference is not allowed/
  );
});

test('rejects every Mapbox evidence identity, source, and content mismatch', () => {
  for (const [label, info, pkg, pattern] of [
    ['missing evidence', undefined, mapboxPackage, /unresolved custom license reference/],
    [
      'duplicate evidence',
      [mapboxInfo, { ...mapboxInfo }],
      mapboxPackage,
      /duplicate extracted license/,
    ],
    ['empty text', { ...mapboxInfo, extractedText: '' }, mapboxPackage, /empty extractedText/],
    [
      'altered text',
      { ...mapboxInfo, extractedText: `${mapboxText}altered` },
      mapboxPackage,
      /unexpected text hash/,
    ],
    [
      'whitespace license id',
      { ...mapboxInfo, licenseId: ` ${mapboxLicenseId}` },
      mapboxPackage,
      /invalid licenseId/,
    ],
    [
      'wrong evidence name',
      { ...mapboxInfo, name: 'Mapbox terms' },
      mapboxPackage,
      /unexpected source-bound name/,
    ],
    [
      'wrong evidence comment',
      { ...mapboxInfo, comment: 'Source: elsewhere' },
      mapboxPackage,
      /unexpected source-bound comment/,
    ],
    [
      'wrong package name',
      mapboxInfo,
      { ...mapboxPackage, name: 'not-mapbox-gl' },
      /custom license package name must be mapbox-gl/,
    ],
    [
      'wrong package version',
      mapboxInfo,
      { ...mapboxPackage, versionInfo: '3.20.1' },
      /custom license package version must be 3.20.0/,
    ],
    [
      'wrong declared field',
      mapboxInfo,
      { ...mapboxPackage, licenseDeclared: 'MIT' },
      /licenseDeclared must equal/,
    ],
    [
      'wrong concluded field',
      mapboxInfo,
      { ...mapboxPackage, licenseConcluded: 'MIT' },
      /licenseConcluded must equal/,
    ],
  ]) {
    const infos = info === undefined ? undefined : Array.isArray(info) ? info : [info];
    assert.throws(
      () =>
        validateSpdxLicensePolicy({
          ...(infos ? { hasExtractedLicensingInfos: infos } : {}),
          packages: [pkg],
        }),
      pattern,
      label
    );
  }
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
