import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  assertRuntimeCompatibleCountyDetail,
  assertRuntimeCompatibleCountyShard,
} from '../ci/package_washington_launch_data.mjs';

const PACKAGE_ROOT = 'frontend/apps/os-shell/public/launch-data/washington';
const EXPECTED_MANIFEST_SHA256 = '2721a1e8d8f3e075b20726bf33005d83d38f949c29c3ea78911559815682fec7';

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

test('embedded Chelan, Clark, Kitsap, Pierce, Skagit, Snohomish, Thurston, and Whatcom packages are digest-bound, county-isolated, public-only, and runtime-compatible', async () => {
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
  const pierceDetail = JSON.parse(await readFile(`${PACKAGE_ROOT}/counties/053.json`, 'utf8'));
  const pierceShard = JSON.parse(
    await readFile(`${PACKAGE_ROOT}/sales/by-county/053.json`, 'utf8')
  );
  const pierceReceipt = JSON.parse(
    await readFile(`${PACKAGE_ROOT}/receipts/pierce-source.json`, 'utf8')
  );
  const skagitDetail = JSON.parse(await readFile(`${PACKAGE_ROOT}/counties/057.json`, 'utf8'));
  const skagitShard = JSON.parse(
    await readFile(`${PACKAGE_ROOT}/sales/by-county/057.json`, 'utf8')
  );
  const skagitReceipt = JSON.parse(
    await readFile(`${PACKAGE_ROOT}/receipts/skagit-source.json`, 'utf8')
  );
  const snohomishDetail = JSON.parse(await readFile(`${PACKAGE_ROOT}/counties/061.json`, 'utf8'));
  const snohomishShard = JSON.parse(
    await readFile(`${PACKAGE_ROOT}/sales/by-county/061.json`, 'utf8')
  );
  const snohomishReceipt = JSON.parse(
    await readFile(`${PACKAGE_ROOT}/receipts/snohomish-source.json`, 'utf8')
  );
  const thurstonDetail = JSON.parse(await readFile(`${PACKAGE_ROOT}/counties/067.json`, 'utf8'));
  const thurstonShard = JSON.parse(
    await readFile(`${PACKAGE_ROOT}/sales/by-county/067.json`, 'utf8')
  );
  const thurstonReceipt = JSON.parse(
    await readFile(`${PACKAGE_ROOT}/receipts/thurston-source.json`, 'utf8')
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
    ['007', '011', '035', '053', '057', '061', '067', '073']
  );
  assert.equal(status.counties[0].stagedSales, 908);
  assert.equal(status.counties[1].stagedSales, 5_476);
  assert.equal(status.counties[2].stagedSales, 24_585);
  assert.equal(status.counties[3].stagedSales, 12_738);
  assert.equal(status.counties[4].stagedSales, 3_877);
  assert.equal(status.counties[5].stagedSales, 21_792);
  assert.equal(status.counties[6].stagedSales, 9_550);
  assert.equal(status.counties[7].stagedSales, 5_109);
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
  assert.equal(pierceShard.countyCode, '053');
  assert.equal(pierceShard.records.length, 12_738);
  assert.equal(pierceShard.summary.reviewRecords, 0);
  assert.equal(pierceReceipt.candidateSales, 41_321);
  assert.equal(pierceReceipt.stagedSales, 12_738);
  assert.equal(pierceReceipt.quarantinedSales, 28_583);
  assert.equal(pierceReceipt.quarantine.invalidSales, 10_608);
  assert.equal(pierceReceipt.quarantine.unconfirmedSales, 16_366);
  assert.equal(pierceReceipt.quarantine.assessorExcludedSales, 808);
  assert.equal(pierceReceipt.quarantine.nonPositiveSalePrice, 22);
  assert.equal(pierceReceipt.quarantine.multiParcelSales, 779);
  assert.equal(pierceReceipt.quarantine.multiParcelTransactions.length, 324);
  assert.equal(
    pierceShard.records.every(
      record =>
        record.county === 'Pierce' &&
        record.countyCode === '053' &&
        record.grantor === null &&
        record.grantee === null &&
        record.owner === undefined &&
        record.taxpayer === undefined &&
        record.buyer === undefined &&
        record.seller === undefined &&
        record.flags.needsReview === false &&
        record.reviewStatus === 'ready'
    ),
    true
  );
  assert.equal(skagitShard.countyCode, '057');
  assert.equal(skagitShard.records.length, 3_877);
  assert.equal(skagitShard.summary.reviewRecords, 0);
  assert.equal(skagitReceipt.candidateSales, 4_918);
  assert.equal(skagitReceipt.stagedSales, 3_877);
  assert.equal(skagitReceipt.quarantinedSales, 1_041);
  assert.equal(skagitReceipt.quarantine.nonPositiveSalePrice, 31);
  assert.equal(skagitReceipt.quarantine.multiParcelSales, 815);
  assert.equal(skagitReceipt.quarantine.crossRecordingDuplicateSales, 4);
  assert.equal(skagitReceipt.quarantine.crossRecordingDuplicateIdentities.length, 2);
  assert.equal(skagitReceipt.quarantine.multiParcelTransactions.length, 298);
  assert.equal(skagitReceipt.quarantine.exactDuplicateRows, 7);
  assert.equal(skagitReceipt.quarantine.missingAssessorJoin, 4);
  assert.equal(skagitReceipt.quarantine.ambiguousAssessorJoin, 10);
  assert.equal(skagitReceipt.quarantine.missingSitusAddress, 170);
  assert.equal(skagitReceipt.sourceDisposition.invalidOrFutureSaleDate, 141);
  assert.equal(
    new Set(skagitShard.records.map(record => record.documentNumber)).size,
    skagitShard.records.length
  );
  assert.equal(
    skagitShard.records.every(
      record =>
        record.county === 'Skagit' &&
        record.countyCode === '057' &&
        record.grantor === null &&
        record.grantee === null &&
        record.owner === undefined &&
        record.taxpayer === undefined &&
        record.buyer === undefined &&
        record.seller === undefined &&
        record.flags.needsReview === false &&
        record.reviewStatus === 'ready'
    ),
    true
  );
  assert.equal(snohomishShard.countyCode, '061');
  assert.equal(snohomishShard.records.length, 21_792);
  assert.equal(snohomishShard.summary.latestSaleDate, '2026-04-01');
  assert.equal(snohomishShard.summary.reviewRecords, 0);
  assert.equal(snohomishReceipt.candidateSales, 22_288);
  assert.equal(snohomishReceipt.stagedSales, 21_792);
  assert.equal(snohomishReceipt.quarantinedSales, 363);
  assert.equal(snohomishReceipt.consolidation.componentRowsConsolidated, 133);
  assert.equal(snohomishReceipt.consolidation.multiComponentTransactions, 117);
  assert.equal(snohomishReceipt.quarantine.multiParcelSales, 50);
  assert.equal(snohomishReceipt.quarantine.multiParcelTransactions.length, 10);
  assert.equal(snohomishReceipt.quarantine.crossConveyanceDuplicateSales, 12);
  assert.equal(snohomishReceipt.quarantine.crossConveyanceDuplicateIdentities.length, 6);
  assert.equal(snohomishReceipt.quarantine.inactiveSales, 103);
  assert.equal(snohomishReceipt.quarantine.missingAssessorJoin, 9);
  assert.equal(snohomishReceipt.quarantine.missingSitusAddress, 189);
  assert.equal(
    snohomishShard.records.every(
      record =>
        record.county === 'Snohomish' &&
        record.countyCode === '061' &&
        record.grantor === null &&
        record.grantee === null &&
        record.owner === undefined &&
        record.OwnerName1 === undefined &&
        record.mailingAddress === undefined &&
        record.flags.needsReview === false &&
        record.reviewStatus === 'ready'
    ),
    true
  );
  const snohomishSourceDigests = new Set(snohomishReceipt.sources.map(source => source.sha256));
  assert.equal(
    snohomishShard.records.every(
      record =>
        snohomishSourceDigests.has(record.provenance.sourcePayloadSha256) &&
        record.provenance.componentRows.length >= 2 &&
        record.provenance.componentRows.every(component =>
          snohomishSourceDigests.has(component.sourcePayloadSha256)
        )
    ),
    true
  );
  assert.equal(thurstonShard.countyCode, '067');
  assert.equal(thurstonShard.records.length, 9_550);
  assert.equal(thurstonShard.summary.latestSaleDate, '2026-07-29');
  assert.equal(thurstonShard.summary.reviewRecords, 0);
  assert.equal(thurstonReceipt.candidateSales, 10_211);
  assert.equal(thurstonReceipt.stagedSales, 9_550);
  assert.equal(thurstonReceipt.quarantinedSales, 661);
  assert.deepEqual(thurstonReceipt.saleValidityAuthority, {
    table: 'PAR_SALES',
    column: 'SALE_VRFY',
    code: 'AA',
    description: 'SALE-VALID',
  });
  assert.equal(thurstonReceipt.quarantine.multiParcelSales, 623);
  assert.equal(thurstonReceipt.quarantine.missingSitusAddress, 36);
  assert.equal(thurstonReceipt.quarantine.recordingReferenceCollisions, 2);
  assert.deepEqual(thurstonReceipt.quarantineEvidence.recordingReferenceCollisionGroups, [
    {
      identitySha256: 'c9cbeb0174d2f88235831d3c9068666aa76eaa5fbfd788e252dadaad5e894710',
      parcelCount: 2,
      rowCount: 2,
    },
  ]);
  assert.equal(
    thurstonShard.records.some(record => record.documentNumber === '5046900'),
    false
  );
  assert.equal(
    thurstonShard.records.every(
      record =>
        record.county === 'Thurston' &&
        record.countyCode === '067' &&
        record.grantor === null &&
        record.grantee === null &&
        record.owner === undefined &&
        record.mailingAddress === undefined &&
        record.legalDescription === undefined &&
        record.buyer === undefined &&
        record.seller === undefined &&
        record.verificationCode === undefined &&
        record.flags.needsReview === false &&
        record.reviewStatus === 'ready' &&
        record.saleDate >= thurstonReceipt.sourceDateRange.start &&
        record.saleDate <= thurstonReceipt.sourceDateRange.end &&
        (record.yearBuilt === null || record.yearBuilt <= record.saleYear)
    ),
    true
  );
  const thurstonSourceDigests = new Set(thurstonReceipt.sources.map(source => source.sha256));
  assert.equal(
    thurstonShard.records.every(
      record =>
        thurstonSourceDigests.has(record.provenance.sourcePayloadSha256) &&
        record.provenance.componentRows.length === 1 &&
        record.provenance.componentRows.every(component =>
          thurstonSourceDigests.has(component.sourcePayloadSha256)
        )
    ),
    true
  );
  const skagitSourceDigests = new Set(skagitReceipt.sources.map(source => source.sha256));
  assert.equal(
    skagitShard.records.every(
      record =>
        skagitSourceDigests.has(record.provenance.sourcePayloadSha256) &&
        record.provenance.componentRows.length === 2 &&
        record.provenance.componentRows.every(component =>
          skagitSourceDigests.has(component.sourcePayloadSha256)
        )
    ),
    true
  );
  const pierceSourceDigests = new Set(pierceReceipt.sources.map(source => source.sha256));
  assert.equal(
    pierceShard.records.every(
      record =>
        pierceSourceDigests.has(record.provenance.sourcePayloadSha256) &&
        record.provenance.componentRows.length === 2 &&
        record.provenance.componentRows.every(component =>
          pierceSourceDigests.has(component.sourcePayloadSha256)
        )
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
  assert.equal(attestations.get('053').canonicalJsonSha256, canonicalSha256(pierceShard));
  assert.equal(attestations.get('057').canonicalJsonSha256, canonicalSha256(skagitShard));
  assert.equal(attestations.get('061').canonicalJsonSha256, canonicalSha256(snohomishShard));
  assert.equal(attestations.get('067').canonicalJsonSha256, canonicalSha256(thurstonShard));
  assert.equal(attestations.get('073').canonicalJsonSha256, canonicalSha256(whatcomShard));
  assert.doesNotThrow(() => {
    assertRuntimeCompatibleCountyShard(chelanShard, '007', 'Chelan');
    assertRuntimeCompatibleCountyDetail(chelanDetail, status.counties[0], manifest.generatedAt);
    assertRuntimeCompatibleCountyShard(clarkShard, '011', 'Clark');
    assertRuntimeCompatibleCountyDetail(clarkDetail, status.counties[1], manifest.generatedAt);
    assertRuntimeCompatibleCountyShard(kitsapShard, '035', 'Kitsap');
    assertRuntimeCompatibleCountyDetail(kitsapDetail, status.counties[2], manifest.generatedAt);
    assertRuntimeCompatibleCountyShard(pierceShard, '053', 'Pierce');
    assertRuntimeCompatibleCountyDetail(pierceDetail, status.counties[3], manifest.generatedAt);
    assertRuntimeCompatibleCountyShard(skagitShard, '057', 'Skagit');
    assertRuntimeCompatibleCountyDetail(skagitDetail, status.counties[4], manifest.generatedAt);
    assertRuntimeCompatibleCountyShard(snohomishShard, '061', 'Snohomish');
    assertRuntimeCompatibleCountyDetail(snohomishDetail, status.counties[5], manifest.generatedAt);
    assertRuntimeCompatibleCountyShard(thurstonShard, '067', 'Thurston');
    assertRuntimeCompatibleCountyDetail(thurstonDetail, status.counties[6], manifest.generatedAt);
    assertRuntimeCompatibleCountyShard(whatcomShard, '073', 'Whatcom');
    assertRuntimeCompatibleCountyDetail(whatcomDetail, status.counties[7], manifest.generatedAt);
  });
});
