import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';

import { buildLedger } from './wal-public-baseline-ledger.mjs';
import {
  buildPublicAcquisitionArtifactReceipt,
  EXPECTED_COUNTIES,
  MAX_ARTIFACT_BYTES,
} from './wal-public-acquisition-artifact-receipt.mjs';
import { buildPublicAcquisitionReceiptLedger } from './wal-public-acquisition-receipt-ledger.mjs';
import {
  CONTRACT_ID,
  ENVIRONMENT_ID,
  verifyPublicAcquisitionArtifactBytes,
} from './wal-public-acquisition-artifact-verification.mjs';

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

function receiptLedger(declarations) {
  const baseline = baselineLedger();
  const receipts = declarations.map(({ county, artifactKind, bytes }) =>
    buildPublicAcquisitionArtifactReceipt({
      baselineLedger: baseline,
      artifact: { county, artifactKind, bytes },
    })
  );
  return buildPublicAcquisitionReceiptLedger({ receipts });
}

function verify(receiptLedgerValue, artifact) {
  return verifyPublicAcquisitionArtifactBytes({ receiptLedger: receiptLedgerValue, artifact });
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}

function frozenClone(value) {
  return deepFreeze(JSON.parse(JSON.stringify(value)));
}

test('recomputes exact byte length and SHA-256 for one canonical receipt-ledger slot', () => {
  const bytes = new TextEncoder().encode('Yakima public parcel bytes');
  const ledger = receiptLedger([{ county: 'Yakima', artifactKind: 'parcels', bytes }]);
  const proof = verify(ledger, { county: 'Yakima', artifactKind: 'parcels', bytes });
  const sha256 = createHash('sha256').update(bytes).digest('hex');

  assert.equal(proof.contract, CONTRACT_ID);
  assert.equal(proof.environment, ENVIRONMENT_ID);
  assert.deepEqual(proof.countyBinding, {
    county: 'Yakima',
    countyToken: 'yakima',
    artifactKind: 'parcels',
  });
  assert.deepEqual(proof.verification, {
    status: 'exact_match',
    hashAlgorithm: 'sha256',
    recomputedByteLength: bytes.byteLength,
    recomputedSha256: sha256,
    ledgerDeclaredByteLength: bytes.byteLength,
    ledgerDeclaredSha256: sha256,
    sourceLedgerContract: 'wal.public-acquisition-receipt-ledger.v1',
    sourceReceiptContract: 'wal.public-acquisition-artifact-receipt.v1',
    aggregationValidationScope: 'structure_and_internal_consistency_only',
  });
  assert.equal(proof.assertions.artifactDigestRecomputedFromSuppliedBytes, true);
  assert.equal(proof.assertions.exactSha256Matched, true);
  assert.equal(Object.isFrozen(proof), true);
  assert.equal(Object.isFrozen(proof.verification), true);
});

test('snapshots validated own-data descriptors instead of proxy get-trap substitutions', () => {
  const adamsBytes = new TextEncoder().encode('Adams parcel bytes');
  const bentonBytes = new TextEncoder().encode('Benton sales bytes');
  const ledger = receiptLedger([
    { county: 'Adams', artifactKind: 'parcels', bytes: adamsBytes },
    { county: 'Benton', artifactKind: 'sales', bytes: bentonBytes },
  ]);
  const target = { county: 'Adams', artifactKind: 'parcels', bytes: adamsBytes };
  const artifact = new Proxy(target, {
    get(object, key, receiver) {
      if (key === 'county') return 'Benton';
      if (key === 'artifactKind') return 'sales';
      if (key === 'bytes') return bentonBytes;
      return Reflect.get(object, key, receiver);
    },
  });

  const proof = verify(ledger, artifact);

  assert.deepEqual(proof.countyBinding, {
    county: 'Adams',
    countyToken: 'adams',
    artifactKind: 'parcels',
  });
  assert.equal(proof.verification.recomputedByteLength, adamsBytes.byteLength);
  assert.equal(
    proof.verification.recomputedSha256,
    createHash('sha256').update(adamsBytes).digest('hex')
  );
});

test('hashes only the visible sliced view using typed-array internal slots', () => {
  const exact = new TextEncoder().encode('EXACT-BYTES');
  const backing = new TextEncoder().encode('prefix-EXACT-BYTES-suffix');
  const bytes = backing.subarray(7, 18);
  Object.defineProperty(bytes, 'byteLength', { value: 1_000_000_000 });
  Object.defineProperty(bytes, Symbol.iterator, {
    value: function* maliciousIterator() {
      while (true) yield 255;
    },
  });
  const ledger = receiptLedger([{ county: 'Clark', artifactKind: 'sales', bytes: exact }]);
  const proof = verify(ledger, { county: 'Clark', artifactKind: 'sales', bytes });

  assert.equal(proof.verification.recomputedByteLength, 11);
  assert.equal(
    proof.verification.recomputedSha256,
    createHash('sha256').update(exact).digest('hex')
  );

  const oversized = new Uint8Array(MAX_ARTIFACT_BYTES + 1);
  Object.defineProperty(oversized, 'byteLength', { value: 1 });
  assert.throws(
    () => verify(ledger, { county: 'Clark', artifactKind: 'sales', bytes: oversized }),
    /verification limit/i
  );
});

test('uses captured byte-copy intrinsics after Uint8Array prototype tampering', () => {
  const declared = new Uint8Array([9, 9, 9]);
  const supplied = new Uint8Array([1, 2, 3]);
  const ledger = receiptLedger([{ county: 'Clark', artifactKind: 'sales', bytes: declared }]);
  const ownSetDescriptor = Object.getOwnPropertyDescriptor(Uint8Array.prototype, 'set');
  const originalSet = Uint8Array.prototype.set;

  try {
    Object.defineProperty(Uint8Array.prototype, 'set', {
      configurable: true,
      writable: true,
      value(source, offset) {
        return Reflect.apply(originalSet, this, [source === supplied ? declared : source, offset]);
      },
    });

    assert.throws(
      () => verify(ledger, { county: 'Clark', artifactKind: 'sales', bytes: supplied }),
      /SHA-256 does not match/i
    );
  } finally {
    if (ownSetDescriptor) {
      Object.defineProperty(Uint8Array.prototype, 'set', ownSetDescriptor);
    } else {
      delete Uint8Array.prototype.set;
    }
  }
});

test('uses encoded multibyte length rather than JavaScript character count', () => {
  const text = 'Yakima naïve 税 parcel bytes';
  const bytes = new TextEncoder().encode(text);
  const ledger = receiptLedger([{ county: 'Yakima', artifactKind: 'parcels', bytes }]);

  const proof = verify(ledger, { county: 'Yakima', artifactKind: 'parcels', bytes });

  assert.notEqual(bytes.byteLength, text.length);
  assert.equal(proof.verification.recomputedByteLength, bytes.byteLength);
  assert.equal(
    proof.verification.recomputedSha256,
    createHash('sha256').update(bytes).digest('hex')
  );
});

test('is deterministic, snapshots caller bytes and returns a deeply immutable proof', () => {
  const bytes = new Uint8Array([3, 1, 4, 1, 5]);
  const ledger = receiptLedger([{ county: 'Adams', artifactKind: 'sales', bytes }]);
  const first = verify(ledger, { county: 'Adams', artifactKind: 'sales', bytes });
  const second = verify(ledger, {
    county: 'Adams',
    artifactKind: 'sales',
    bytes: new Uint8Array([3, 1, 4, 1, 5]),
  });
  const serialized = JSON.stringify(first);

  bytes.fill(0);
  assert.deepEqual(second, first);
  assert.equal(JSON.stringify(first), serialized);
  assert.throws(() => first.explicitGaps.verification.push('fabricated'), TypeError);
  assert.equal(Object.isFrozen(first.explicitGaps.sourceLedgerAtAggregation.downstream), true);
});

test('retains source-ledger receipt, interpretation and downstream gaps by layer', () => {
  const bytes = new Uint8Array([7, 8, 9]);
  const ledger = receiptLedger([{ county: 'Spokane', artifactKind: 'parcels', bytes }]);
  const proof = verify(ledger, { county: 'Spokane', artifactKind: 'parcels', bytes });

  assert.deepEqual(proof.explicitGaps.sourceLedgerAtAggregation.parcels, []);
  assert.deepEqual(proof.explicitGaps.sourceLedgerAtAggregation.sales, [
    'sales_artifact_receipt_missing',
  ]);
  assert.ok(
    proof.explicitGaps.sourceLedgerAtAggregation.interpretation.includes(
      'artifact_digest_not_recomputed'
    )
  );
  assert.ok(
    proof.explicitGaps.verification.includes('receipt_issuance_not_authenticated')
  );
  assert.ok(
    proof.explicitGaps.verification.includes('artifact_source_authenticity_not_established')
  );
  assert.ok(
    proof.explicitGaps.sourceLedgerAtAggregation.downstream.includes('landing_not_performed')
  );
});

test('retains authenticity, interpretation and downstream gaps when both county slots exist', () => {
  const parcelBytes = new Uint8Array([1]);
  const salesBytes = new Uint8Array([2]);
  const ledger = receiptLedger([
    { county: 'King', artifactKind: 'parcels', bytes: parcelBytes },
    { county: 'King', artifactKind: 'sales', bytes: salesBytes },
  ]);
  const proof = verify(ledger, { county: 'King', artifactKind: 'sales', bytes: salesBytes });

  assert.deepEqual(proof.explicitGaps.sourceLedgerAtAggregation.parcels, []);
  assert.deepEqual(proof.explicitGaps.sourceLedgerAtAggregation.sales, []);
  assert.equal(proof.assertions.receiptIssuanceAuthenticated, false);
  assert.equal(proof.assertions.sourceAuthenticityEstablished, false);
  assert.equal(proof.assertions.artifactParsedOrNormalized, false);
  assert.equal(proof.assertions.runtimeRegistrationObserved, false);
  assert.equal(proof.assertions.capabilityAssessed, false);
});

test('fails closed on independent byte-length and SHA-256 mismatches', () => {
  const recorded = new Uint8Array([1, 2, 3]);
  const ledger = receiptLedger([{ county: 'Franklin', artifactKind: 'parcels', bytes: recorded }]);

  assert.throws(
    () =>
      verify(ledger, {
        county: 'Franklin',
        artifactKind: 'parcels',
        bytes: new Uint8Array([1, 2]),
      }),
    /byte length does not match/i
  );
  assert.throws(
    () =>
      verify(ledger, {
        county: 'Franklin',
        artifactKind: 'parcels',
        bytes: new Uint8Array([1, 2, 4]),
      }),
    /SHA-256 does not match/i
  );
});

test('requires an exact canonical county, artifact kind and present ledger slot', () => {
  const bytes = new Uint8Array([9]);
  const ledger = receiptLedger([{ county: 'Yakima', artifactKind: 'parcels', bytes }]);

  assert.throws(
    () => verify(ledger, { county: 'Yakima County', artifactKind: 'parcels', bytes }),
    /canonical Washington county/i
  );
  assert.throws(
    () => verify(ledger, { county: 'Yakima', artifactKind: 'parcel', bytes }),
    /parcels or sales/i
  );
  assert.throws(
    () => verify(ledger, { county: 'Yakima', artifactKind: 'sales', bytes }),
    /no sales receipt claim for Yakima/i
  );
  assert.throws(
    () => verify(ledger, { county: 'Benton', artifactKind: 'parcels', bytes }),
    /no parcels receipt claim for Benton/i
  );
});

test('validates the complete protected ledger, including unrelated rows and summary counts', () => {
  const bytes = new Uint8Array([6, 2, 6]);
  const source = receiptLedger([{ county: 'Yakima', artifactKind: 'sales', bytes }]);
  const mutations = [
    value => {
      value.contract = 'fabricated';
    },
    value => {
      value.environment = 'live-network';
    },
    value => {
      value.assertions.receiptIssuanceAuthenticated = true;
    },
    value => {
      value.summary.receiptCount = 2;
    },
    value => {
      value.rows[0].county = 'Benton';
      value.rows[0].countyToken = 'benton';
    },
    value => {
      value.rows.at(-1).artifacts.sales.receiptDeclaredSha256 = 'A'.repeat(64);
    },
    value => {
      value.rows[1].explicitGaps.interpretation = [];
    },
  ];

  for (const mutate of mutations) {
    const forged = JSON.parse(JSON.stringify(source));
    mutate(forged);
    deepFreeze(forged);
    assert.throws(() => verify(forged, { county: 'Yakima', artifactKind: 'sales', bytes }));
  }
});

test('requires the protected receipt ledger to remain deeply immutable and data-property-only', () => {
  const bytes = new Uint8Array([4]);
  const source = receiptLedger([{ county: 'Adams', artifactKind: 'parcels', bytes }]);
  const mutable = JSON.parse(JSON.stringify(source));
  assert.throws(
    () => verify(mutable, { county: 'Adams', artifactKind: 'parcels', bytes }),
    /deeply immutable/i
  );

  const accessor = JSON.parse(JSON.stringify(source));
  Object.defineProperty(accessor.rows[0], 'county', {
    enumerable: true,
    get: () => 'Adams',
  });
  deepFreeze(accessor);
  assert.throws(
    () => verify(accessor, { county: 'Adams', artifactKind: 'parcels', bytes }),
    /data properties/i
  );

  const sparse = JSON.parse(JSON.stringify(source));
  delete sparse.rows[1];
  deepFreeze(sparse);
  assert.throws(
    () => verify(sparse, { county: 'Adams', artifactKind: 'parcels', bytes }),
    /dense/i
  );
});

test('rejects malformed construction options and artifact declarations', () => {
  const bytes = new Uint8Array([1]);
  const ledger = receiptLedger([{ county: 'Adams', artifactKind: 'sales', bytes }]);

  assert.throws(() => verifyPublicAcquisitionArtifactBytes(), /plain object/i);
  assert.throws(() => verifyPublicAcquisitionArtifactBytes({}), /exactly/i);
  assert.throws(
    () =>
      verifyPublicAcquisitionArtifactBytes({
        receiptLedger: ledger,
        artifact: { county: 'Adams', artifactKind: 'sales', bytes },
        acquire: true,
      }),
    /exactly/i
  );
  assert.throws(
    () => verify(ledger, { county: 'Adams', artifactKind: 'sales', bytes, parsed: true }),
    /exactly/i
  );
  const inherited = Object.create({ county: 'Adams', artifactKind: 'sales', bytes });
  assert.throws(() => verify(ledger, inherited), /own-property-only/i);
  const accessor = { county: 'Adams', artifactKind: 'sales' };
  Object.defineProperty(accessor, 'bytes', { enumerable: true, get: () => bytes });
  assert.throws(() => verify(ledger, accessor), /data property/i);
});

test('rejects empty, non-byte, oversized and detached artifact bytes', () => {
  const recorded = new Uint8Array([1]);
  const ledger = receiptLedger([{ county: 'Adams', artifactKind: 'sales', bytes: recorded }]);

  assert.throws(
    () => verify(ledger, { county: 'Adams', artifactKind: 'sales', bytes: new Uint8Array() }),
    /must not be empty/i
  );
  assert.throws(
    () => verify(ledger, { county: 'Adams', artifactKind: 'sales', bytes: new DataView(new ArrayBuffer(1)) }),
    /Uint8Array view/i
  );
  assert.throws(
    () =>
      verify(ledger, {
        county: 'Adams',
        artifactKind: 'sales',
        bytes: new Uint8Array(MAX_ARTIFACT_BYTES + 1),
      }),
    /verification limit/i
  );

  const detached = new Uint8Array([1]);
  structuredClone(detached.buffer, { transfer: [detached.buffer] });
  assert.throws(
    () => verify(ledger, { county: 'Adams', artifactKind: 'sales', bytes: detached }),
    /must not be empty|Uint8Array view/i
  );
});

test('does not promote byte agreement into authenticity, acquisition or product truth', () => {
  const bytes = new Uint8Array([2, 7, 1, 8]);
  const ledger = receiptLedger([{ county: 'Walla Walla', artifactKind: 'sales', bytes }]);
  const proof = verify(ledger, { county: 'Walla Walla', artifactKind: 'sales', bytes });

  assert.equal(
    proof.evidenceScope,
    'supplied_in_memory_bytes_matched_to_structurally_validated_receipt_ledger_claim_only'
  );
  for (const field of [
    'receiptIssuanceAuthenticated',
    'sourceAuthenticityEstablished',
    'networkAcquisitionPerformed',
    'filesystemAccessPerformed',
    'persistencePerformed',
    'artifactParsedOrNormalized',
    'freshnessObserved',
    'landedRowsObserved',
    'runtimeRegistrationObserved',
    'capabilityAssessed',
    'launchReadinessAssessed',
  ]) {
    assert.equal(proof.assertions[field], false, field);
  }
  assert.equal('bytes' in proof, false);
});

test('accepts an internally consistent ledger claim only when supplied bytes independently match it', () => {
  const original = new Uint8Array([1, 2, 3]);
  const source = receiptLedger([{ county: 'Yakima', artifactKind: 'parcels', bytes: original }]);
  const forgedBytes = new Uint8Array([9, 9, 9]);
  const forgedSha256 = createHash('sha256').update(forgedBytes).digest('hex');
  const forged = JSON.parse(JSON.stringify(source));
  forged.rows.at(-1).artifacts.parcels.receiptDeclaredSha256 = forgedSha256;
  deepFreeze(forged);

  assert.throws(
    () => verify(forged, { county: 'Yakima', artifactKind: 'parcels', bytes: original }),
    /SHA-256 does not match/i
  );
  const proof = verify(forged, {
    county: 'Yakima',
    artifactKind: 'parcels',
    bytes: forgedBytes,
  });
  assert.equal(proof.assertions.exactSha256Matched, true);
  assert.equal(proof.assertions.receiptIssuanceAuthenticated, false);
  assert.equal(proof.assertions.sourceAuthenticityEstablished, false);
});
