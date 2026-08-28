import assert from 'node:assert/strict';
import test from 'node:test';

import { buildLedger } from './wal-public-baseline-ledger.mjs';
import {
  buildPublicAcquisitionArtifactReceipt,
  EXPECTED_COUNTIES,
} from './wal-public-acquisition-artifact-receipt.mjs';
import {
  buildPublicAcquisitionReceiptLedger,
  CONTRACT_ID,
  ENVIRONMENT_ID,
} from './wal-public-acquisition-receipt-ledger.mjs';

function baselineLedger() {
  return buildLedger({
    slice: 'in-memory-fixture',
    generatedAtUtc: null,
    status: 'fixture',
    source: {
      workbook: null,
      workbookSha256: null,
      supplementalResearchAtUtc: null,
    },
    counties: EXPECTED_COUNTIES.map(county => ({
      county,
      officialAssessorBaseUrl: `https://${county.toLowerCase().replaceAll(' ', '-')}.public.example`,
      primarySalesSource: `${county} public sales export`,
      fallbackSource: null,
      gisMapSurface: null,
      status: 'adapter-ready',
      acquisitionFamily: 'fixture-family',
      priority: 'fixture-only',
    })),
  });
}

function receipt(county, artifactKind, bytes = new Uint8Array([1, 2, 3])) {
  return buildPublicAcquisitionArtifactReceipt({
    baselineLedger: baselineLedger(),
    artifact: { county, artifactKind, bytes },
  });
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}

function frozenClone(value) {
  return deepFreeze(JSON.parse(JSON.stringify(value)));
}

test('builds exactly 39 canonical immutable rows with exact receipt hashes and visible gaps', () => {
  const yakimaParcels = receipt('Yakima', 'parcels', new Uint8Array([7, 8, 9]));
  const adamsSales = receipt('Adams', 'sales', new Uint8Array([4, 5]));
  const ledger = buildPublicAcquisitionReceiptLedger({ receipts: [yakimaParcels, adamsSales] });

  assert.equal(ledger.contract, CONTRACT_ID);
  assert.equal(ledger.environment, ENVIRONMENT_ID);
  assert.equal(ledger.rows.length, 39);
  assert.deepEqual(ledger.rows.map(row => row.county), EXPECTED_COUNTIES);
  assert.deepEqual(ledger.summary, {
    expectedCountyCount: 39,
    countyRowCount: 39,
    receiptCount: 2,
    parcelReceiptCount: 1,
    salesReceiptCount: 1,
    countiesWithBothReceipts: 0,
    countiesWithAnyReceipt: 2,
    countiesWithExplicitGaps: 39,
  });
  const yakima = ledger.rows.at(-1);
  assert.equal(yakima.artifacts.parcels.sha256, yakimaParcels.artifactReceipt.sha256);
  assert.equal(yakima.artifacts.parcels.byteLength, 3);
  assert.deepEqual(yakima.explicitGaps.parcels, []);
  assert.deepEqual(yakima.explicitGaps.sales, ['sales_artifact_receipt_missing']);
  assert.equal(Object.isFrozen(ledger), true);
  assert.equal(Object.isFrozen(ledger.rows), true);
  assert.equal(Object.isFrozen(yakima.artifacts.parcels), true);
  assert.throws(() => yakima.explicitGaps.sales.push('fabricated'), TypeError);
});

test('is deterministic regardless of receipt input order', () => {
  const receipts = [
    receipt('Spokane', 'sales', new Uint8Array([1])),
    receipt('Adams', 'parcels', new Uint8Array([2])),
    receipt('Spokane', 'parcels', new Uint8Array([3])),
  ];
  const first = buildPublicAcquisitionReceiptLedger({ receipts });
  const second = buildPublicAcquisitionReceiptLedger({ receipts: [...receipts].reverse() });
  assert.deepEqual(second, first);
  assert.equal(JSON.stringify(second), JSON.stringify(first));
});

test('represents a complete 39-county parcel and sales receipt matrix without erasing downstream gaps', () => {
  const receipts = EXPECTED_COUNTIES.flatMap((county, countyIndex) => [
    receipt(county, 'parcels', new Uint8Array([countyIndex + 1])),
    receipt(county, 'sales', new Uint8Array([countyIndex + 40])),
  ]);
  const ledger = buildPublicAcquisitionReceiptLedger({ receipts });

  assert.equal(ledger.summary.receiptCount, 78);
  assert.equal(ledger.summary.countiesWithBothReceipts, 39);
  assert.equal(ledger.summary.countiesWithExplicitGaps, 0);
  assert.equal(ledger.assertions.acquisitionPerformed, false);
  assert.equal(ledger.assertions.artifactContentParsed, false);
  assert.equal(ledger.assertions.landedRowsObserved, false);
  assert.equal(ledger.assertions.runtimeRegistrationObserved, false);
  assert.ok(ledger.rows.every(row => row.explicitGaps.interpretation.includes('content_not_parsed')));
  assert.ok(ledger.rows.every(row => row.explicitGaps.downstream.includes('landing_not_performed')));
});

test('rejects duplicate county and artifact-kind receipts', () => {
  const first = receipt('Clark', 'parcels', new Uint8Array([1]));
  const second = receipt('Clark', 'parcels', new Uint8Array([2]));
  assert.throws(
    () => buildPublicAcquisitionReceiptLedger({ receipts: [first, second] }),
    /Duplicate parcels receipt for Clark/
  );
});

test('rejects aliases, county mismatches and silent Benton substitution', () => {
  const source = receipt('Yakima', 'sales');
  for (const mutate of [
    value => {
      value.countyBinding.county = 'Yakima County';
    },
    value => {
      value.baselineLedgerOverlay.county = 'Benton';
    },
    value => {
      value.baselineLedgerOverlay.baselineRowSnapshot.county = 'Benton';
    },
    value => {
      value.baselineLedgerOverlay.baselineRowSnapshot.sourceInventory.officialAssessorBaseUrl =
        'https://ben\u200bton.example/fallback';
    },
    value => {
      const snapshot = value.baselineLedgerOverlay.baselineRowSnapshot;
      snapshot.sourceInventory.officialAssessorBaseUrl = 'https://franklin.example/fallback';
      const runtime = snapshot.runtimeRegistrationEvidence;
      runtime.observationStatus = 'observed';
      runtime.parcels.registrationStatus = 'registered';
      runtime.parcels.endpoint = 'https://franklin.example/runtime';
      runtime.parcels.rows = 123;
      runtime.selectedCountyEchoed = 'Franklin';
    },
  ]) {
    const forged = JSON.parse(JSON.stringify(source));
    mutate(forged);
    deepFreeze(forged);
    assert.throws(() => buildPublicAcquisitionReceiptLedger({ receipts: [forged] }));
  }
});

test('rejects malformed hashes, bounds, contracts and contradictory truth claims', () => {
  const source = receipt('Franklin', 'parcels');
  const mutations = [
    value => {
      value.artifactReceipt.sha256 = 'A'.repeat(64);
    },
    value => {
      value.artifactReceipt.byteLength = 0;
    },
    value => {
      value.contract = 'fabricated';
    },
    value => {
      value.assertions.runtimeRegistrationObserved = true;
    },
    value => {
      value.explicitGaps.downstream = [];
    },
    value => {
      value.baselineLedgerOverlay.acquisitionArtifactEvidence.sha256 = '0'.repeat(64);
    },
  ];
  for (const mutate of mutations) {
    const forged = JSON.parse(JSON.stringify(source));
    mutate(forged);
    deepFreeze(forged);
    assert.throws(() => buildPublicAcquisitionReceiptLedger({ receipts: [forged] }));
  }
});

test('requires protected receipts to remain deeply immutable', () => {
  const mutable = JSON.parse(JSON.stringify(receipt('Adams', 'sales')));
  assert.throws(
    () => buildPublicAcquisitionReceiptLedger({ receipts: [mutable] }),
    /deeply immutable/i
  );
  Object.freeze(mutable);
  assert.throws(
    () => buildPublicAcquisitionReceiptLedger({ receipts: [mutable] }),
    /deeply immutable/i
  );
});

test('rejects sparse, accessor-backed, oversized and structurally expanded inputs', () => {
  const valid = receipt('Adams', 'parcels');
  const sparse = new Array(1);
  assert.throws(() => buildPublicAcquisitionReceiptLedger({ receipts: sparse }), /dense/i);

  const accessor = [];
  Object.defineProperty(accessor, '0', { enumerable: true, get: () => valid });
  accessor.length = 1;
  assert.throws(() => buildPublicAcquisitionReceiptLedger({ receipts: accessor }), /dense/i);

  assert.throws(
    () => buildPublicAcquisitionReceiptLedger({ receipts: new Array(79).fill(valid) }),
    /capacity/i
  );

  const expanded = JSON.parse(JSON.stringify(valid));
  expanded.runtime = true;
  deepFreeze(expanded);
  assert.throws(() => buildPublicAcquisitionReceiptLedger({ receipts: [expanded] }), /exactly/i);
});

test('accepts an empty receipt set as 39 explicit parcel and sales gaps', () => {
  const ledger = buildPublicAcquisitionReceiptLedger({ receipts: [] });
  assert.equal(ledger.summary.receiptCount, 0);
  assert.equal(ledger.summary.countiesWithExplicitGaps, 39);
  assert.ok(ledger.rows.every(row => row.artifacts.parcels === null && row.artifacts.sales === null));
});

test('rejects missing, extra and inherited construction options', () => {
  assert.throws(() => buildPublicAcquisitionReceiptLedger(), /plain object/i);
  assert.throws(() => buildPublicAcquisitionReceiptLedger({}), /exactly/i);
  assert.throws(() => buildPublicAcquisitionReceiptLedger({ receipts: [], acquire: true }), /exactly/i);
  const inherited = Object.create({ receipts: [] });
  assert.throws(() => buildPublicAcquisitionReceiptLedger(inherited), /own-property-only/i);
});
