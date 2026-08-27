#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  CONTRACT_ID,
  EXPECTED_COUNTIES,
  buildLedger,
  serializeLedger,
} from './wal-public-baseline-ledger.mjs';

const repoRoot = path.resolve('.');
const scriptPath = path.join(repoRoot, 'scripts', 'truth', 'wal-public-baseline-ledger.mjs');
const coverageProofPath = path.join(
  repoRoot,
  'os-platform',
  'core',
  'pilot',
  'evidence',
  'washington-39-county-coverage.latest.json'
);

function readCoverageProof() {
  return JSON.parse(fs.readFileSync(coverageProofPath, 'utf8'));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test('emits one canonical row for every Washington county', () => {
  const ledger = buildLedger(readCoverageProof());

  assert.equal(ledger.contract, CONTRACT_ID);
  assert.equal(ledger.evidenceScope, 'source_registry_only');
  assert.equal(ledger.rows.length, 39);
  assert.deepEqual(
    ledger.rows.map(row => row.county),
    EXPECTED_COUNTIES
  );
  assert.equal(new Set(ledger.rows.map(row => row.countyToken)).size, 39);
  assert.equal(ledger.summary.expectedCountyCount, 39);
  assert.equal(ledger.summary.countyRowCount, 39);
  assert.equal(ledger.summary.registryStatusCounts['adapter-ready'], 35);
  assert.equal(ledger.summary.registryStatusCounts.researched, 4);
});

test('keeps source readiness separate from landed, runtime, provenance, and capability truth', () => {
  const ledger = buildLedger(readCoverageProof());
  const adapterReadyRow = ledger.rows.find(
    row => row.acquisitionReadiness.registryStatus === 'adapter-ready'
  );

  assert.ok(adapterReadyRow);
  assert.equal(adapterReadyRow.acquisitionReadiness.registryStatusMeaning, 'source_decision_only');
  assert.equal(adapterReadyRow.acquisitionReadiness.adapterExecutionStatus, 'not_observed');
  assert.equal(adapterReadyRow.landedRowsEvidence.observationStatus, 'not_observed');
  assert.equal(adapterReadyRow.landedRowsEvidence.parcelRows, null);
  assert.equal(adapterReadyRow.landedRowsEvidence.salesRows, null);
  assert.equal(adapterReadyRow.runtimeRegistrationEvidence.observationStatus, 'not_observed');
  assert.equal(
    adapterReadyRow.runtimeRegistrationEvidence.parcels.registrationStatus,
    'not_observed'
  );
  assert.equal(adapterReadyRow.runtimeRegistrationEvidence.parcels.rows, null);
  assert.equal(adapterReadyRow.freshnessProvenanceEvidence.observationStatus, 'not_observed');
  assert.equal(adapterReadyRow.freshnessProvenanceEvidence.contentHash, null);
  assert.equal(adapterReadyRow.capabilityEvidence.observationStatus, 'not_assessed');
  assert.deepEqual(adapterReadyRow.capabilityEvidence.supportedCapabilities, []);
  assert.deepEqual(adapterReadyRow.explicitGaps.landedData, [
    'parcel_rows_not_observed',
    'sales_rows_not_observed',
  ]);
  assert.equal(ledger.summary.landedRowsObservedCountyCount, 0);
  assert.equal(ledger.summary.runtimeRegistrationObservedCountyCount, 0);
  assert.equal(ledger.summary.freshnessProvenanceObservedCountyCount, 0);
  assert.equal(ledger.summary.capabilityAssessedCountyCount, 0);
});

test('rejects a duplicate county instead of collapsing it', () => {
  const proof = readCoverageProof();
  proof.counties.push(clone(proof.counties[0]));

  assert.throws(() => buildLedger(proof), /duplicate counties: Adams/i);
});

test('rejects a missing county instead of emitting fewer than 39 rows', () => {
  const proof = readCoverageProof();
  proof.counties = proof.counties.filter(row => row.county !== 'Whitman');

  assert.throws(() => buildLedger(proof), /missing counties: Whitman/i);
});

test('rejects an unexpected county and preserves the canonical set invariant', () => {
  const proof = readCoverageProof();
  proof.counties[0] = { ...proof.counties[0], county: 'Multnomah' };

  assert.throws(
    () => buildLedger(proof),
    /missing counties: Adams; unexpected counties: Multnomah/i
  );
});

test('serialization is byte-stable regardless of input county row order', () => {
  const forwardProof = readCoverageProof();
  const reverseProof = clone(forwardProof);
  reverseProof.counties.reverse();

  const forwardBytes = serializeLedger(buildLedger(forwardProof));
  const reverseBytes = serializeLedger(buildLedger(reverseProof));

  assert.equal(reverseBytes, forwardBytes);
  assert.equal(forwardBytes.endsWith('\n'), true);
  assert.equal(forwardBytes.endsWith('\n\n'), false);
});

test('CLI output is byte-stable across repeated default executions', () => {
  const first = execFileSync('node', [scriptPath], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const second = execFileSync('node', [scriptPath], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  assert.equal(second, first);
  assert.equal(JSON.parse(first).rows.length, 39);
});

test('CLI writes only to an explicitly selected local output path', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tf-wal-public-ledger-'));
  const outputPath = path.join(tempDir, 'ledger.json');

  execFileSync('node', [scriptPath, '--input', coverageProofPath, '--output', outputPath], {
    cwd: repoRoot,
    stdio: 'pipe',
  });

  const output = fs.readFileSync(outputPath, 'utf8');
  assert.equal(output, serializeLedger(buildLedger(readCoverageProof())));
});

test('rejects Benton source contamination for a non-Benton county', () => {
  const proof = readCoverageProof();
  const yakima = proof.counties.find(row => row.county === 'Yakima');
  yakima.primarySalesSource = 'Benton County Property Search';

  assert.throws(
    () => buildLedger(proof),
    /Non-Benton county Yakima contains Benton source evidence/i
  );
});

test('does not materialize a Benton runtime fallback for any non-Benton row', () => {
  const ledger = buildLedger(readCoverageProof());

  for (const row of ledger.rows.filter(candidate => candidate.county !== 'Benton')) {
    assert.equal(row.fallbackEvidence.observationStatus, 'not_observed');
    assert.equal(row.fallbackEvidence.silentBentonFallbackDetected, null);
    assert.equal(row.fallbackEvidence.fallbackCounty, null);
    assert.equal(row.runtimeRegistrationEvidence.parcels.endpoint, null);
    assert.equal(row.runtimeRegistrationEvidence.sales.endpoint, null);
    assert.equal(/benton/i.test(JSON.stringify(row.sourceInventory)), false);
  }
});
