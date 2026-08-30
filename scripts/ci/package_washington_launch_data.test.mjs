import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertRuntimeCompatibleCountyDetail,
  assertRuntimeCompatibleCountyShard,
  bindAttestedOfficialSourceToRepository,
  readRepositoryPublicSourceInventory,
  requireAttestedSourcePosture,
} from './package_washington_launch_data.mjs';

const GENERATED_AT = '2026-01-03T00:00:00.000Z';

function validRecord(overrides = {}) {
  return {
    saleId: 'benton-sale-1',
    county: 'Benton',
    countyCode: '005',
    parcelNumber: '1001',
    saleDate: '2026-01-02',
    saleYear: 2026,
    salePrice: 425_000,
    adjustedSalePrice: null,
    documentNumber: '2026-001',
    deedType: 'SWD',
    situsAddress: '100 Main St',
    situsCity: 'Prosser',
    situsZip: '99350',
    useCode: 'R',
    acres: null,
    grantor: null,
    grantee: null,
    saleNote: null,
    neighborhoodCode: null,
    currentNeighborhoodCode: null,
    sourceMode: 'public_recorder_export',
    candidateSource: 'benton-official-sales',
    confidenceScore: 0.99,
    qualityScore: 0.98,
    qualityBand: 'high',
    reviewStatus: 'ready',
    provenance: {
      sourceUrl: 'https://co.benton.wa.us/sales',
      sourceFinalUrl: null,
      sourcePayloadPath: 'benton/sales.json',
      sourcePayloadSha256: 'a'.repeat(64),
      candidateIndexSource: 'official-export',
      candidateRecordType: 'recorded-sale',
      candidateSourceOrdinal: 1,
    },
    flags: {
      duplicateRisk: false,
      needsReview: false,
      manualException: false,
    },
    ...overrides,
  };
}

function validShard(records = [validRecord()]) {
  return {
    schemaVersion: 'terrafusion.washington.sales-shard.v1',
    generatedAt: GENERATED_AT,
    county: 'Benton',
    countyCode: '005',
    summary: {
      records: records.length,
      latestSaleDate: '2026-01-02',
      reviewRecords: 0,
      recordsWithNeighborhoodCode: 0,
      topNeighborhoodCodes: {},
    },
    records,
  };
}

function validCountyStatus(overrides = {}) {
  return {
    county: 'Benton',
    countyCode: '005',
    prometheusStatus: 'reference_ready',
    primarySourceMode: 'public_recorder_export',
    latestSaleDate: '2026-01-02',
    stagedSales: 1,
    staticRoutes: {
      detail: '/launch-data/washington/counties/005.json',
      salesShard: '/launch-data/washington/sales/by-county/005.json',
    },
    ...overrides,
  };
}

function validCountyDetail(overrides = {}) {
  return {
    schemaVersion: 'terrafusion.washington.county-detail.v1',
    generatedAt: GENERATED_AT,
    county: 'Benton',
    countyCode: '005',
    operationalState: {
      primarySourceMode: 'public_recorder_export',
      prometheusStatus: 'reference_ready',
    },
    summary: {
      records: 1,
      latestSaleDate: '2026-01-02',
    },
    salesRoute: '/launch-data/washington/sales/by-county/005.json',
    ...overrides,
  };
}

test('packager shard validation matches browser-required record fields', () => {
  assert.doesNotThrow(() => {
    assertRuntimeCompatibleCountyShard(validShard(), '005', 'Benton');
  });

  const missingSaleId = validRecord();
  delete missingSaleId.saleId;
  assert.throws(() => {
    assertRuntimeCompatibleCountyShard(validShard([missingSaleId]), '005', 'Benton');
  });

  const missingFlags = validRecord();
  delete missingFlags.flags;
  assert.throws(() => {
    assertRuntimeCompatibleCountyShard(validShard([missingFlags]), '005', 'Benton');
  });

  const missingManualException = validRecord();
  delete missingManualException.flags.manualException;
  assert.throws(() => {
    assertRuntimeCompatibleCountyShard(validShard([missingManualException]), '005', 'Benton');
  });
});

test('packager rejects noncanonical dates and duplicate sale IDs before publication', () => {
  assert.throws(() => {
    assertRuntimeCompatibleCountyShard(
      validShard([validRecord({ saleDate: '1/2/2026' })]),
      '005',
      'Benton',
    );
  });

  assert.throws(() => {
    assertRuntimeCompatibleCountyShard(
      validShard([
        validRecord(),
        validRecord({ parcelNumber: '1002' }),
      ]),
      '005',
      'Benton',
    );
  }, /duplicate saleId/);
});

test('packager binds advertised county detail files to attested status', () => {
  const status = validCountyStatus();
  assert.doesNotThrow(() => {
    assertRuntimeCompatibleCountyDetail(validCountyDetail(), status, GENERATED_AT);
  });

  assert.throws(() => {
    assertRuntimeCompatibleCountyDetail(
      validCountyDetail({ countyCode: '063' }),
      status,
      GENERATED_AT,
    );
  }, /detail identity is invalid/);

  assert.throws(() => {
    assertRuntimeCompatibleCountyDetail(
      validCountyDetail({
        operationalState: {
          primarySourceMode: 'repository_reference_demo',
          prometheusStatus: 'reference_ready',
        },
      }),
      status,
      GENERATED_AT,
    );
  }, /operational state does not match attested status/);

  assert.throws(() => {
    assertRuntimeCompatibleCountyDetail(
      validCountyDetail({ summary: { records: 2, latestSaleDate: '2026-01-02' } }),
      status,
      GENERATED_AT,
    );
  }, /summary does not match attested status/);

  assert.throws(() => {
    assertRuntimeCompatibleCountyDetail(
      validCountyDetail({ salesRoute: '/launch-data/washington/sales/by-county/063.json' }),
      status,
      GENERATED_AT,
    );
  }, /sales route does not match attested status/);

  assert.throws(() => {
    assertRuntimeCompatibleCountyDetail(
      validCountyDetail({ generatedAt: '2026-01-04T00:00:00.000Z' }),
      status,
      GENERATED_AT,
    );
  }, /generation identity/);
});

test('attested official source origin is bound to the runtime repository inventory', async () => {
  const repositorySources = await readRepositoryPublicSourceInventory();
  assert.equal(repositorySources.size, 39);

  const bentonSource = bindAttestedOfficialSourceToRepository(
    'https://co.benton.wa.us/assessor/sales',
    'Benton',
    '005',
    repositorySources,
  );
  assert.equal(bentonSource.origin, 'https://co.benton.wa.us');

  assert.throws(() => {
    bindAttestedOfficialSourceToRepository(
      'https://public.example.test/benton',
      'Benton',
      '005',
      repositorySources,
    );
  }, /inconsistent with the repository inventory/);

  assert.throws(() => {
    bindAttestedOfficialSourceToRepository(
      'https://co.benton.wa.us/assessor/sales',
      'Benton',
      '001',
      repositorySources,
    );
  }, /missing Benton County/);
});

test('attested source posture must affirm non-synthetic public data', () => {
  assert.equal(
    requireAttestedSourcePosture(
      'public_recorder_export',
      'public_recorder_export',
      '005',
    ),
    'public_recorder_export',
  );
  assert.throws(() => {
    requireAttestedSourcePosture('   ', '', '005');
  }, /inconsistent for 005/);
});
