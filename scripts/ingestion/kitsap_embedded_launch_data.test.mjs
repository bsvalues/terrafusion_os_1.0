import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  assertRuntimeCompatibleCountyDetail,
  assertRuntimeCompatibleCountyShard,
} from '../ci/package_washington_launch_data.mjs';

const PACKAGE_ROOT = 'frontend/apps/os-shell/public/launch-data/washington';
const EXPECTED_MANIFEST_SHA256 =
  'ed6475da4961a801e46dbfa95b2d67d6982140ec5e64f71b57af4d402a5688f1';

function canonicalizeJson(value) {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalizeJson).join(',')}]`;
  if (typeof value === 'object' && value !== null) {
    return `{${Object.keys(value)
      .sort()
      .map(key => `${JSON.stringify(key)}:${canonicalizeJson(value[key])}`)
      .join(',')}}`;
  }
  throw new Error('Non-JSON value in embedded package.');
}

function canonicalSha256(value) {
  return createHash('sha256').update(canonicalizeJson(value)).digest('hex');
}

test('embedded Kitsap package is digest-bound, county-isolated, public-only, and runtime-compatible', async () => {
  const manifest = JSON.parse(await readFile(`${PACKAGE_ROOT}/manifest.json`, 'utf8'));
  const status = JSON.parse(await readFile(`${PACKAGE_ROOT}/counties/status.json`, 'utf8'));
  const detail = JSON.parse(await readFile(`${PACKAGE_ROOT}/counties/035.json`, 'utf8'));
  const shard = JSON.parse(await readFile(`${PACKAGE_ROOT}/sales/by-county/035.json`, 'utf8'));
  const receipt = JSON.parse(await readFile(`${PACKAGE_ROOT}/receipts/kitsap-source.json`, 'utf8'));

  const manifestDigest = canonicalSha256(manifest);
  assert.equal(manifestDigest, EXPECTED_MANIFEST_SHA256);
  assert.equal(status.counties.length, 1);
  assert.equal(status.counties[0].countyCode, '035');
  assert.equal(status.counties[0].stagedSales, 24_585);
  assert.equal(shard.countyCode, '035');
  assert.equal(shard.records.length, 24_585);
  assert.equal(
    shard.records.every(record => record.countyCode === '035'),
    true
  );
  assert.equal(
    shard.records.every(record => record.grantor === null && record.grantee === null),
    true
  );
  assert.equal(
    shard.records.every(
      record => record.provenance.sourcePayloadSha256 === receipt.sourcePayloadSha256
    ),
    true
  );
  assert.equal(manifest.statusCanonicalJsonSha256, canonicalSha256(status));
  assert.equal(manifest.salesShardAttestations[0].canonicalJsonSha256, canonicalSha256(shard));
  assert.doesNotThrow(() => {
    assertRuntimeCompatibleCountyShard(shard, '035', 'Kitsap');
    assertRuntimeCompatibleCountyDetail(detail, status.counties[0], manifest.generatedAt);
  });
});
