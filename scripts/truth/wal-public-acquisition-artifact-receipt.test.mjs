import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';

import {
  BASELINE_CONTRACT_ID,
  CONTRACT_ID,
  ENVIRONMENT_ID,
  EXPECTED_COUNTIES,
  MAX_ARTIFACT_BYTES,
  buildPublicAcquisitionArtifactReceipt,
} from './wal-public-acquisition-artifact-receipt.mjs';

function countyToken(county) {
  return county.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function baselineRow(county) {
  return {
    county,
    countyToken: countyToken(county),
    sourceInventory: {
      observationStatus: 'observed_from_coverage_proof',
      officialAssessorBaseUrl: `https://${countyToken(county)}.public.example`,
      primarySalesSourceDescription: `${county} public sales export`,
      alternatePublicSourceDescription: null,
      gisMapSurfaceDescription: null,
    },
    acquisitionReadiness: {
      observationStatus: 'observed_from_coverage_proof',
      registryStatus: 'adapter-ready',
      registryStatusMeaning: 'source_decision_only',
      acquisitionFamily: 'fixture-family',
      priority: 'fixture-only',
      adapterExecutionStatus: 'not_observed',
    },
    landedRowsEvidence: {
      observationStatus: 'not_observed',
      parcelRows: null,
      salesRows: null,
      quarantinedRows: null,
    },
    runtimeRegistrationEvidence: {
      observationStatus: 'not_observed',
      parcels: { registrationStatus: 'not_observed', endpoint: null, rows: null },
      sales: { registrationStatus: 'not_observed', endpoint: null, rows: null },
      selectedCountyEchoed: null,
    },
    freshnessProvenanceEvidence: {
      observationStatus: 'not_observed',
      acquiredAtUtc: null,
      sourceRevision: null,
      contentHash: null,
      transformVersion: null,
      trustTier: null,
    },
    fallbackEvidence: {
      observationStatus: 'not_observed',
      silentBentonFallbackDetected: null,
      fallbackCounty: null,
    },
    capabilityEvidence: { observationStatus: 'not_assessed', supportedCapabilities: [] },
    explicitGaps: {
      sourceInventory: [],
      acquisition: [],
      landedData: ['parcel_rows_not_observed', 'sales_rows_not_observed'],
      runtime: [
        'parcel_runtime_registration_not_observed',
        'sales_runtime_registration_not_observed',
      ],
      freshnessProvenance: [
        'acquisition_freshness_not_observed',
        'row_provenance_not_observed',
        'transform_version_not_observed',
      ],
    },
  };
}

function baselineLedger() {
  return {
    contract: BASELINE_CONTRACT_ID,
    evidenceScope: 'source_registry_only',
    sourceEvidence: {
      slice: 'in-memory-fixture',
      generatedAtUtc: null,
      status: 'fixture',
      workbook: null,
      workbookSha256: null,
      supplementalResearchAtUtc: null,
    },
    assertions: {
      exactCanonicalCountySet: true,
      exactlyOneRowPerCounty: true,
      deterministicCanonicalOrder: true,
      registryReadinessDoesNotImplyLandedRows: true,
      registryReadinessDoesNotImplyRuntimeRegistration: true,
      noBentonFallbackMaterialized: true,
    },
    summary: {
      expectedCountyCount: 39,
      countyRowCount: 39,
      registryStatusCounts: { 'adapter-ready': 39 },
      sourceInventoryGapCount: 0,
      landedRowsObservedCountyCount: 0,
      runtimeRegistrationObservedCountyCount: 0,
      freshnessProvenanceObservedCountyCount: 0,
      capabilityAssessedCountyCount: 0,
    },
    rows: EXPECTED_COUNTIES.map(baselineRow),
  };
}

function buildReceipt(overrides = {}) {
  return buildPublicAcquisitionArtifactReceipt({
    baselineLedger: overrides.baselineLedger ?? baselineLedger(),
    artifact: overrides.artifact ?? {
      county: 'Yakima',
      artifactKind: 'parcels',
      bytes: new TextEncoder().encode('parcel-id,value\n1,125000\n'),
    },
  });
}

test('records the exact SHA-256 and byte length of supplied bytes', () => {
  const bytes = new TextEncoder().encode('parcel-id,owner\n1,Jos\u00e9 \ud83c\udf32\n');
  const receipt = buildReceipt({
    artifact: { county: 'Yakima', artifactKind: 'parcels', bytes },
  });

  assert.equal(receipt.contract, CONTRACT_ID);
  assert.equal(receipt.environment, ENVIRONMENT_ID);
  assert.equal(receipt.artifactReceipt.byteLength, bytes.byteLength);
  assert.equal(
    receipt.artifactReceipt.sha256,
    createHash('sha256').update(bytes).digest('hex')
  );
  assert.match(receipt.artifactReceipt.sha256, /^[a-f0-9]{64}$/);
});

test('hashes only the visible portion of a sliced Uint8Array view', () => {
  const backing = new TextEncoder().encode('prefix-EXACT-BYTES-suffix');
  const bytes = backing.subarray(7, 18);
  const receipt = buildReceipt({
    artifact: { county: 'Clark', artifactKind: 'sales', bytes },
  });

  assert.equal(receipt.artifactReceipt.byteLength, 11);
  assert.equal(
    receipt.artifactReceipt.sha256,
    createHash('sha256').update(new TextEncoder().encode('EXACT-BYTES')).digest('hex')
  );
});

test('uses typed-array internal slots instead of iterator or byteLength overrides', () => {
  const bytes = new Uint8Array([7]);
  Object.defineProperty(bytes, 'byteLength', { value: 1_000_000_000 });
  Object.defineProperty(bytes, Symbol.iterator, {
    value: function* maliciousIterator() {
      while (true) yield 255;
    },
  });

  const receipt = buildReceipt({
    artifact: { county: 'Yakima', artifactKind: 'parcels', bytes },
  });

  assert.equal(receipt.artifactReceipt.byteLength, 1);
  assert.equal(
    receipt.artifactReceipt.sha256,
    createHash('sha256').update(new Uint8Array([7])).digest('hex')
  );

  const oversized = new Uint8Array(MAX_ARTIFACT_BYTES + 1);
  Object.defineProperty(oversized, 'byteLength', { value: 1 });
  assert.throws(
    () =>
      buildReceipt({
        artifact: { county: 'Yakima', artifactKind: 'parcels', bytes: oversized },
      }),
    /fixture limit/i
  );
});

test('builds a deterministic county-bound baseline overlay', () => {
  const ledger = baselineLedger();
  const reorderedLedger = baselineLedger();
  const spokane = reorderedLedger.rows.find(row => row.county === 'Spokane');
  spokane.sourceInventory = Object.fromEntries(
    Object.entries(spokane.sourceInventory).reverse()
  );
  const artifact = {
    county: 'Spokane',
    artifactKind: 'sales',
    bytes: new Uint8Array([0, 1, 2, 3, 255]),
  };
  const first = buildPublicAcquisitionArtifactReceipt({ baselineLedger: ledger, artifact });
  const second = buildPublicAcquisitionArtifactReceipt({
    baselineLedger: reorderedLedger,
    artifact,
  });

  assert.deepEqual(second, first);
  assert.equal(JSON.stringify(second), JSON.stringify(first));
  assert.equal(first.countyBinding.county, 'Spokane');
  assert.equal(first.countyBinding.countyToken, 'spokane');
  assert.equal(first.countyBinding.artifactKind, 'sales');
  assert.equal(first.baselineLedgerOverlay.baselineContract, BASELINE_CONTRACT_ID);
  assert.equal(first.baselineLedgerOverlay.baselineRowSnapshot.county, 'Spokane');
  assert.deepEqual(first.baselineLedgerOverlay.acquisitionArtifactEvidence, first.artifactReceipt);
});

test('defensively snapshots bytes and baseline data and deeply freezes the receipt', () => {
  const ledger = baselineLedger();
  const bytes = new Uint8Array([10, 20, 30]);
  const artifact = { county: 'Yakima', artifactKind: 'parcels', bytes };
  const receipt = buildPublicAcquisitionArtifactReceipt({ baselineLedger: ledger, artifact });
  const originalHash = receipt.artifactReceipt.sha256;

  bytes[0] = 99;
  artifact.county = 'Benton';
  ledger.rows.at(-1).sourceInventory.primarySalesSourceDescription = 'mutated';

  assert.equal(receipt.artifactReceipt.sha256, originalHash);
  assert.equal(receipt.countyBinding.county, 'Yakima');
  assert.equal(
    receipt.baselineLedgerOverlay.baselineRowSnapshot.sourceInventory.primarySalesSourceDescription,
    'Yakima public sales export'
  );
  assert.equal(Object.isFrozen(receipt), true);
  assert.equal(Object.isFrozen(receipt.baselineLedgerOverlay), true);
  assert.equal(Object.isFrozen(receipt.baselineLedgerOverlay.baselineRowSnapshot.sourceInventory), true);
  assert.equal(Object.isFrozen(receipt.explicitGaps.downstream), true);
  assert.throws(() => {
    receipt.countyBinding.county = 'Benton';
  }, TypeError);
  assert.throws(() => receipt.explicitGaps.downstream.push('fabricated'), TypeError);
});

test('keeps acquisition, interpretation, landing, runtime, freshness and capability gaps explicit', () => {
  const receipt = buildReceipt();

  assert.deepEqual(receipt.assertions, {
    exactSuppliedBytesObserved: true,
    networkAcquisitionPerformed: false,
    filesystemAccessPerformed: false,
    persistencePerformed: false,
    artifactParsedOrNormalized: false,
    landedRowsObserved: false,
    runtimeRegistrationObserved: false,
    freshnessObserved: false,
    capabilityAssessed: false,
    launchReadinessAssessed: false,
  });
  assert.ok(receipt.explicitGaps.acquisition.includes('network_acquisition_not_performed'));
  assert.ok(receipt.explicitGaps.acquisition.includes('freshness_not_observed'));
  assert.ok(receipt.explicitGaps.artifactInterpretation.includes('content_not_parsed'));
  assert.ok(receipt.explicitGaps.artifactInterpretation.includes('row_counts_not_observed'));
  assert.ok(receipt.explicitGaps.downstream.includes('landing_not_performed'));
  assert.ok(receipt.explicitGaps.downstream.includes('runtime_registration_not_observed'));
  assert.ok(receipt.explicitGaps.downstream.includes('capability_not_assessed'));
});

test('rejects county aliases, invalid kinds, empty bytes and oversized fixtures', () => {
  for (const artifact of [
    { county: 'Yakima County', artifactKind: 'parcels', bytes: new Uint8Array([1]) },
    { county: 'yakima', artifactKind: 'parcels', bytes: new Uint8Array([1]) },
    { county: 'Yakima', artifactKind: 'unknown', bytes: new Uint8Array([1]) },
    { county: 'Yakima', artifactKind: 'parcels', bytes: new Uint8Array() },
    { county: 'Yakima', artifactKind: 'parcels', bytes: new Uint8Array(MAX_ARTIFACT_BYTES + 1) },
  ]) {
    assert.throws(() => buildReceipt({ artifact }));
  }
});

test('rejects missing, extra, inherited, accessor and non-byte artifact declarations', () => {
  const bytes = new Uint8Array([1]);
  assert.throws(
    () => buildReceipt({ artifact: { county: 'Yakima', artifactKind: 'parcels' } }),
    /must contain exactly/i
  );
  assert.throws(
    () =>
      buildReceipt({
        artifact: { county: 'Yakima', artifactKind: 'parcels', bytes, acquiredAtUtc: 'now' },
      }),
    /must contain exactly/i
  );
  const inherited = Object.create({ county: 'Benton' });
  Object.assign(inherited, { county: 'Yakima', artifactKind: 'parcels', bytes });
  assert.throws(() => buildReceipt({ artifact: inherited }), /own-property-only/i);

  const accessor = { county: 'Yakima', artifactKind: 'parcels' };
  Object.defineProperty(accessor, 'bytes', { enumerable: true, get: () => bytes });
  assert.throws(() => buildReceipt({ artifact: accessor }), /enumerable data property/i);
  assert.throws(
    () => buildReceipt({ artifact: { county: 'Yakima', artifactKind: 'parcels', bytes: [1] } }),
    /Uint8Array view/i
  );
});

test('rejects missing or extra top-level construction options', () => {
  const ledger = baselineLedger();
  const artifact = { county: 'Yakima', artifactKind: 'parcels', bytes: new Uint8Array([1]) };

  assert.throws(() => buildPublicAcquisitionArtifactReceipt(), /options must be a plain object/i);
  assert.throws(
    () => buildPublicAcquisitionArtifactReceipt({ artifact }),
    /must contain exactly/i
  );
  assert.throws(
    () => buildPublicAcquisitionArtifactReceipt({ baselineLedger: ledger, artifact, acquire: true }),
    /must contain exactly/i
  );
});

test('rejects malformed or non-canonical baseline ledgers', () => {
  const wrongContract = baselineLedger();
  wrongContract.contract = 'unknown';
  assert.throws(() => buildReceipt({ baselineLedger: wrongContract }), /baselineLedger.contract/i);

  const missing = baselineLedger();
  missing.rows.pop();
  assert.throws(() => buildReceipt({ baselineLedger: missing }), /exactly 39/i);

  const reordered = baselineLedger();
  [reordered.rows[0], reordered.rows[1]] = [reordered.rows[1], reordered.rows[0]];
  assert.throws(() => buildReceipt({ baselineLedger: reordered }), /canonical county Adams/i);

  const extraRowField = baselineLedger();
  extraRowField.rows[0].landed = true;
  assert.throws(() => buildReceipt({ baselineLedger: extraRowField }), /must contain exactly/i);

  const runtimeClaim = baselineLedger();
  runtimeClaim.rows[0].runtimeRegistrationEvidence.observationStatus = 'observed';
  assert.throws(() => buildReceipt({ baselineLedger: runtimeClaim }), /non-canonical runtime/i);
});

test('rejects every contradictory protected baseline evidence category', () => {
  const mutations = [
    row => {
      row.landedRowsEvidence.parcelRows = 123;
    },
    row => {
      row.runtimeRegistrationEvidence.parcels.registrationStatus = 'observed';
      row.runtimeRegistrationEvidence.parcels.endpoint = 'https://benton.example';
    },
    row => {
      row.freshnessProvenanceEvidence.contentHash = 'fabricated';
    },
    row => {
      row.capabilityEvidence.supportedCapabilities.push('writeback');
    },
    row => {
      row.fallbackEvidence.silentBentonFallbackDetected = true;
      row.fallbackEvidence.fallbackCounty = 'Benton';
    },
    row => {
      row.explicitGaps.runtime = [];
    },
  ];

  for (const mutate of mutations) {
    const ledger = baselineLedger();
    mutate(ledger.rows.at(-1));
    assert.throws(() => buildReceipt({ baselineLedger: ledger }));
  }
});

test('rejects sparse, accessor-backed and structurally expanded baseline rows', () => {
  for (const index of [0, EXPECTED_COUNTIES.length - 1]) {
    const ledger = baselineLedger();
    delete ledger.rows[index];
    assert.throws(() => buildReceipt({ baselineLedger: ledger }), /dense enumerable data/i);
  }

  const accessorLedger = baselineLedger();
  const firstRow = accessorLedger.rows[0];
  Object.defineProperty(accessorLedger.rows, '0', {
    enumerable: true,
    get: () => firstRow,
  });
  assert.throws(() => buildReceipt({ baselineLedger: accessorLedger }), /dense enumerable data/i);

  const expandedLedger = baselineLedger();
  expandedLedger.rows.at(-1).sourceInventory.officialAssessorBaseUrl = {
    nested: { without: { a: { bound: true } } },
  };
  assert.throws(() => buildReceipt({ baselineLedger: expandedLedger }), /bounded non-empty string/i);
});

test('requires protected trimmed strings and exact array own keys', () => {
  for (const value of [' ', ' https://adams.public.example ']) {
    const ledger = baselineLedger();
    ledger.rows[0].sourceInventory.officialAssessorBaseUrl = value;
    if (value.trim() === '') {
      ledger.rows[0].explicitGaps.sourceInventory = [
        'official_assessor_url_missing',
      ];
    }
    assert.throws(() => buildReceipt({ baselineLedger: ledger }), /bounded non-empty string/i);
  }

  const rowsWithCustomNumericKey = baselineLedger();
  Object.defineProperty(rowsWithCustomNumericKey.rows, '4294967295', {
    enumerable: true,
    get: () => rowsWithCustomNumericKey.rows[0],
  });
  assert.throws(
    () => buildReceipt({ baselineLedger: rowsWithCustomNumericKey }),
    /custom properties/i
  );

  const nestedArrayWithCustomNumericKey = baselineLedger();
  Object.defineProperty(
    nestedArrayWithCustomNumericKey.rows[0].capabilityEvidence.supportedCapabilities,
    '4294967295',
    { enumerable: true, value: 'hidden-capability' }
  );
  assert.throws(
    () => buildReceipt({ baselineLedger: nestedArrayWithCustomNumericKey }),
    /custom properties/i
  );
});

test('rejects Benton metadata contamination in any non-Benton baseline row', () => {
  for (const [field, value] of [
    ['officialAssessorBaseUrl', 'https://benton.example/fallback'],
    ['primarySalesSourceDescription', 'Ben\u200bton County public export'],
    ['acquisitionFamily', 'benton_county_adapter'],
    ['priority', 'fallback-to-BENTON'],
  ]) {
    const ledger = baselineLedger();
    const yakima = ledger.rows.find(row => row.county === 'Yakima');
    const target = field in yakima.sourceInventory ? yakima.sourceInventory : yakima.acquisitionReadiness;
    target[field] = value;

    assert.throws(
      () => buildReceipt({ baselineLedger: ledger }),
      /Non-Benton baseline row Yakima contains Benton source metadata/i,
      field
    );
  }
});

test('never silently substitutes Benton for a different county binding', () => {
  const ledger = baselineLedger();
  const receipt = buildPublicAcquisitionArtifactReceipt({
    baselineLedger: ledger,
    artifact: { county: 'Yakima', artifactKind: 'sales', bytes: new Uint8Array([7]) },
  });

  assert.equal(receipt.countyBinding.county, 'Yakima');
  assert.equal(receipt.baselineLedgerOverlay.county, 'Yakima');
  assert.equal(receipt.baselineLedgerOverlay.baselineRowSnapshot.county, 'Yakima');
  assert.equal(
    receipt.baselineLedgerOverlay.baselineRowSnapshot.fallbackEvidence.fallbackCounty,
    null
  );
  assert.equal(
    receipt.baselineLedgerOverlay.baselineRowSnapshot.fallbackEvidence
      .silentBentonFallbackDetected,
    null
  );
  assert.equal(
    /benton/i.test(
      JSON.stringify([
        receipt.baselineLedgerOverlay.baselineRowSnapshot.sourceInventory,
        receipt.baselineLedgerOverlay.baselineRowSnapshot.acquisitionReadiness,
      ])
    ),
    false
  );
});
