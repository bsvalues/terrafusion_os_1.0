import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  assertRuntimeCompatibleCountyDetail,
  assertRuntimeCompatibleCountyShard,
} from '../ci/package_washington_launch_data.mjs';

const PACKAGE_ROOT = 'frontend/apps/os-shell/public/launch-data/washington';
const EXPECTED_MANIFEST_SHA256 = '96734f8ca86bad7be62afa83cb8197e7762634057d8b167ff06ec4252cdf3ca7';

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

test('embedded Chelan, Clark, Kitsap, and Whatcom packages are digest-bound, county-isolated, public-only, and runtime-compatible', async () => {
  const manifest = JSON.parse(await readFile(`${PACKAGE_ROOT}/manifest.json`, 'utf8'));
  const status = JSON.parse(await readFile(`${PACKAGE_ROOT}/counties/status.json`, 'utf8'));
  const kitsapDetail = JSON.parse(await readFile(`${PACKAGE_ROOT}/counties/035.json`, 'utf8'));
  const kitsapShard = JSON.parse(
    await readFile(`${PACKAGE_ROOT}/sales/by-county/035.json`, 'utf8')
  );
  const kitsapReceipt = JSON.parse(
    await readFile(`${PACKAGE_ROOT}/receipts/kitsap-source.json`, 'utf8')
  );
  const chelanDetail = JSON.parse(await readFile(`${PACKAGE_ROOT}/counties/007.json`, 'utf8'));
  const chelanShard = JSON.parse(
    await readFile(`${PACKAGE_ROOT}/sales/by-county/007.json`, 'utf8')
  );
  const chelanReceipt = JSON.parse(
    await readFile(`${PACKAGE_ROOT}/receipts/chelan-source.json`, 'utf8')
  );
  const clarkDetail = JSON.parse(await readFile(`${PACKAGE_ROOT}/counties/011.json`, 'utf8'));
  const clarkShard = JSON.parse(await readFile(`${PACKAGE_ROOT}/sales/by-county/011.json`, 'utf8'));
  const clarkReceipt = JSON.parse(
    await readFile(`${PACKAGE_ROOT}/receipts/clark-source.json`, 'utf8')
  );
  const whatcomDetail = JSON.parse(await readFile(`${PACKAGE_ROOT}/counties/073.json`, 'utf8'));
  const whatcomShard = JSON.parse(
    await readFile(`${PACKAGE_ROOT}/sales/by-county/073.json`, 'utf8')
  );
  const whatcomReceipt = JSON.parse(
    await readFile(`${PACKAGE_ROOT}/receipts/whatcom-source.json`, 'utf8')
  );

  const manifestDigest = canonicalSha256(manifest);
  assert.equal(manifestDigest, EXPECTED_MANIFEST_SHA256);
  assert.deepEqual(
    status.counties.map(county => county.countyCode),
    ['007', '011', '035', '073']
  );
  assert.equal(status.counties[0].stagedSales, 908);
  assert.equal(status.counties[1].stagedSales, 5_476);
  assert.equal(status.counties[2].stagedSales, 24_585);
  assert.equal(status.counties[3].stagedSales, 5_109);
  assert.equal(chelanShard.countyCode, '007');
  assert.equal(chelanShard.records.length, 908);
  assert.equal(chelanShard.summary.reviewRecords, 132);
  assert.equal(
    chelanShard.records.every(
      record =>
        record.yearBuilt === null ||
        (Number.isInteger(record.yearBuilt) &&
          record.yearBuilt >= 1700 &&
          record.yearBuilt <= record.saleYear)
    ),
    true
  );
  assert.equal(chelanShard.records.filter(record => record.bedrooms !== null).length, 495);
  assert.equal(chelanShard.records.filter(record => record.bathrooms !== null).length, 498);
  assert.equal(
    chelanShard.records.every(
      record =>
        record.countyCode === '007' &&
        record.grantor === null &&
        record.grantee === null &&
        record.owner === undefined &&
        record.buyer === undefined &&
        record.seller === undefined
    ),
    true
  );
  const chelanSourceDigests = new Set(chelanReceipt.sources.map(source => source.sha256));
  assert.equal(
    chelanShard.records.every(record =>
      chelanSourceDigests.has(record.provenance.sourcePayloadSha256)
    ),
    true
  );
  assert.equal(
    chelanShard.records.every(
      record =>
        Array.isArray(record.provenance.componentRows) &&
        record.provenance.componentRows.length >= 1 &&
        record.provenance.componentRows.every(
          component =>
            chelanSourceDigests.has(component.sourcePayloadSha256) &&
            !new URL(component.sourceUrl).search &&
            !new URL(component.sourceUrl).hash
        )
    ),
    true
  );
  assert.equal(
    chelanShard.records.reduce(
      (total, record) => total + record.provenance.componentRows.length - 1,
      0
    ),
    77
  );
  assert.equal(chelanReceipt.candidateSales, 985);
  assert.equal(chelanReceipt.stagedSales, 908);
  assert.equal(chelanReceipt.reviewRequiredSales, 132);
  assert.equal(chelanReceipt.quarantinedSales, 0);
  assert.equal(chelanReceipt.consolidation.componentRowsConsolidated, 77);
  assert.equal(chelanReceipt.consolidation.multiComponentTransactions, 43);
  assert.equal(clarkShard.countyCode, '011');
  assert.equal(clarkShard.records.length, 5_476);
  assert.equal(clarkShard.summary.reviewRecords, 0);
  assert.equal(clarkReceipt.candidateSales, 5_482);
  assert.equal(clarkReceipt.stagedSales, 5_476);
  assert.equal(clarkReceipt.quarantinedSales, 6);
  assert.equal(clarkReceipt.quarantine.exactDuplicateRows, 6);
  assert.equal(clarkShard.records.filter(record => record.yearBuilt !== null).length, 5_373);
  assert.equal(clarkShard.records.filter(record => record.grossLivingArea !== null).length, 5_373);
  assert.equal(clarkShard.records.filter(record => record.lotSizeSqft !== null).length, 5_105);
  assert.equal(clarkShard.records.filter(record => record.qualityGrade !== null).length, 5_373);
  assert.equal(
    clarkShard.records.every(record => record.situsZip === null),
    true
  );
  const firstClarkSale = clarkShard.records.find(record => record.parcelNumber === '986046773');
  assert.equal(firstClarkSale.situsAddress, '18505 NE 78TH WAY VANCOUVER, WA 98682');
  assert.equal(firstClarkSale.qualityGrade, 'Good');
  assert.equal(firstClarkSale.acres, 0.2317);
  assert.equal(firstClarkSale.lotSizeSqft, 10_092);
  for (const parcelNumber of ['228329000', '986066723']) {
    const postConstructionSale = clarkShard.records.find(
      record => record.parcelNumber === parcelNumber
    );
    assert.equal(postConstructionSale.yearBuilt, null);
    assert.equal(postConstructionSale.grossLivingArea, null);
    assert.equal(postConstructionSale.qualityGrade, null);
    assert.equal(postConstructionSale.useCode, null);
  }
  assert.equal(
    clarkShard.records.filter(record => record.adjustedSalePrice !== null).length,
    5_476
  );
  assert.equal(
    clarkShard.records.every(
      record =>
        record.countyCode === '011' &&
        record.grantor === null &&
        record.grantee === null &&
        record.owner === undefined &&
        record.buyer === undefined &&
        record.seller === undefined &&
        (record.yearBuilt === null ||
          (Number.isInteger(record.yearBuilt) &&
            record.yearBuilt >= 1700 &&
            record.yearBuilt <= record.saleYear))
    ),
    true
  );
  assert.equal(
    clarkShard.records.every(
      record => record.provenance.sourcePayloadSha256 === clarkReceipt.sources[0].sha256
    ),
    true
  );
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
  assert.equal(attestations.get('007').canonicalJsonSha256, canonicalSha256(chelanShard));
  assert.equal(attestations.get('011').canonicalJsonSha256, canonicalSha256(clarkShard));
  assert.equal(attestations.get('035').canonicalJsonSha256, canonicalSha256(kitsapShard));
  assert.equal(attestations.get('073').canonicalJsonSha256, canonicalSha256(whatcomShard));
  assert.doesNotThrow(() => {
    assertRuntimeCompatibleCountyShard(chelanShard, '007', 'Chelan');
    assertRuntimeCompatibleCountyDetail(chelanDetail, status.counties[0], manifest.generatedAt);
    assertRuntimeCompatibleCountyShard(clarkShard, '011', 'Clark');
    assertRuntimeCompatibleCountyDetail(clarkDetail, status.counties[1], manifest.generatedAt);
    assertRuntimeCompatibleCountyShard(kitsapShard, '035', 'Kitsap');
    assertRuntimeCompatibleCountyDetail(kitsapDetail, status.counties[2], manifest.generatedAt);
    assertRuntimeCompatibleCountyShard(whatcomShard, '073', 'Whatcom');
    assertRuntimeCompatibleCountyDetail(whatcomDetail, status.counties[3], manifest.generatedAt);
  });
});
