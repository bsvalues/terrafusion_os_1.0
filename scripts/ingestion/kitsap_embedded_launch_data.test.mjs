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
  '63d6a05a7b6901136a5d3e5deedb6034c3b95c96408eb0f08641910ec0ad702c';

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

test('embedded Kitsap and Whatcom packages are digest-bound, county-isolated, public-only, and runtime-compatible', async () => {
  const manifest = JSON.parse(await readFile(`${PACKAGE_ROOT}/manifest.json`, 'utf8'));
  const status = JSON.parse(await readFile(`${PACKAGE_ROOT}/counties/status.json`, 'utf8'));
  const kitsapDetail = JSON.parse(await readFile(`${PACKAGE_ROOT}/counties/035.json`, 'utf8'));
  const kitsapShard = JSON.parse(await readFile(`${PACKAGE_ROOT}/sales/by-county/035.json`, 'utf8'));
  const kitsapReceipt = JSON.parse(await readFile(`${PACKAGE_ROOT}/receipts/kitsap-source.json`, 'utf8'));
  const whatcomDetail = JSON.parse(await readFile(`${PACKAGE_ROOT}/counties/073.json`, 'utf8'));
  const whatcomShard = JSON.parse(await readFile(`${PACKAGE_ROOT}/sales/by-county/073.json`, 'utf8'));
  const whatcomReceipt = JSON.parse(await readFile(`${PACKAGE_ROOT}/receipts/whatcom-source.json`, 'utf8'));

  const manifestDigest = canonicalSha256(manifest);
  assert.equal(manifestDigest, EXPECTED_MANIFEST_SHA256);
  assert.deepEqual(status.counties.map(county => county.countyCode), ['035', '073']);
  assert.equal(status.counties[0].stagedSales, 24_585);
  assert.equal(status.counties[1].stagedSales, 5_109);
  assert.equal(kitsapShard.countyCode, '035');
  assert.equal(kitsapShard.records.length, 24_585);
  assert.equal(
    kitsapShard.records.every(record => record.countyCode === '035'),
    true
  );
  assert.equal(
    kitsapShard.records.every(record => record.grantor === null && record.grantee === null),
    true
  );
  assert.equal(
    kitsapShard.records.every(
      record => record.provenance.sourcePayloadSha256 === kitsapReceipt.sourcePayloadSha256
    ),
    true
  );
  assert.equal(whatcomShard.countyCode, '073');
  assert.equal(whatcomShard.records.length, 5_109);
  assert.equal(
    whatcomShard.records.every(
      record =>
        record.countyCode === '073' &&
        record.grantor === null &&
        record.grantee === null &&
        record.owner === undefined &&
        record.buyer === undefined &&
        record.seller === undefined
    ),
    true
  );
  const whatcomSourceDigests = new Set(whatcomReceipt.sources.map(source => source.sha256));
  assert.equal(
    whatcomShard.records.every(record =>
      whatcomSourceDigests.has(record.provenance.sourcePayloadSha256)
    ),
    true
  );
  assert.equal(whatcomReceipt.candidateSales, 5_123);
  assert.equal(whatcomReceipt.stagedSales, 5_109);
  assert.equal(whatcomReceipt.quarantinedSales, 14);
  assert.equal(whatcomReceipt.quarantine.exactDuplicateRows, 12);
  assert.equal(whatcomReceipt.quarantine.conflictingSaleRows, 2);
  assert.equal(manifest.statusCanonicalJsonSha256, canonicalSha256(status));
  const attestations = new Map(
    manifest.salesShardAttestations.map(attestation => [attestation.countyCode, attestation])
  );
  assert.equal(attestations.get('035').canonicalJsonSha256, canonicalSha256(kitsapShard));
  assert.equal(attestations.get('073').canonicalJsonSha256, canonicalSha256(whatcomShard));
  assert.doesNotThrow(() => {
    assertRuntimeCompatibleCountyShard(kitsapShard, '035', 'Kitsap');
    assertRuntimeCompatibleCountyDetail(kitsapDetail, status.counties[0], manifest.generatedAt);
    assertRuntimeCompatibleCountyShard(whatcomShard, '073', 'Whatcom');
    assertRuntimeCompatibleCountyDetail(whatcomDetail, status.counties[1], manifest.generatedAt);
  });
});
