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
