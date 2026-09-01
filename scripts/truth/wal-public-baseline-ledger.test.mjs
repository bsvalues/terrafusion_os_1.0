#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
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

function childTempEnvironment(tempRoot) {
  return {
    ...process.env,
    TEMP: tempRoot,
    TMP: tempRoot,
    TMPDIR: tempRoot,
  };
}

function runCliWithOutput(outputPath, options = {}) {
  return spawnSync(
    'node',
    [scriptPath, '--input', coverageProofPath, '--output', outputPath],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: options.env ?? process.env,
    }
  );
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

test('CLI accepts absolute and relative output paths strictly inside the OS temp directory', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tf-wal-public-ledger-'));
  const expected = serializeLedger(buildLedger(readCoverageProof()));

  try {
    const nestedTempDir = path.join(tempDir, 'nested', 'output');
    fs.mkdirSync(nestedTempDir, { recursive: true });
    const absoluteOutputPath = path.join(nestedTempDir, 'absolute-ledger.json');
    const relativeOutputPath = path.join(nestedTempDir, 'relative-ledger.json');

    execFileSync(
      'node',
      [scriptPath, '--input', coverageProofPath, '--output', absoluteOutputPath],
      { cwd: repoRoot, stdio: 'pipe' }
    );
    execFileSync(
      'node',
      [
        scriptPath,
        '--input',
        coverageProofPath,
        '--output',
        path.relative(repoRoot, relativeOutputPath),
      ],
      { cwd: repoRoot, stdio: 'pipe' }
    );

    assert.equal(fs.readFileSync(absoluteOutputPath, 'utf8'), expected);
    assert.equal(fs.readFileSync(relativeOutputPath, 'utf8'), expected);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('CLI rejects a symlink or junction parent that escapes its effective temp root', t => {
  const testRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tf-wal-public-ledger-link-parent-'));
  const effectiveTempRoot = path.join(testRoot, 'effective-temp');
  const outsideEffectiveTemp = path.join(testRoot, 'outside-effective-temp');
  const linkedParent = path.join(effectiveTempRoot, 'linked-parent');
  const escapedOutput = path.join(outsideEffectiveTemp, 'escaped-ledger.json');

  try {
    fs.mkdirSync(effectiveTempRoot);
    fs.mkdirSync(outsideEffectiveTemp);
    try {
      fs.symlinkSync(
        outsideEffectiveTemp,
        linkedParent,
        process.platform === 'win32' ? 'junction' : 'dir'
      );
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'EPERM') {
        t.skip('This host does not permit creating a directory symlink or junction.');
        return;
      }
      throw error;
    }

    const result = runCliWithOutput(path.join(linkedParent, 'escaped-ledger.json'), {
      env: childTempEnvironment(effectiveTempRoot),
    });

    assert.notEqual(result.status, 0);
    assert.match(
      result.stderr,
      /must resolve strictly inside the operating system temporary directory/i
    );
    assert.equal(fs.existsSync(escapedOutput), false);
  } finally {
    fs.rmSync(testRoot, { recursive: true, force: true });
  }
});

test('CLI rejects an existing final symlink or junction without changing its target', t => {
  const testRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tf-wal-public-ledger-final-link-'));
  const effectiveTempRoot = path.join(testRoot, 'effective-temp');
  const outsideEffectiveTemp = path.join(testRoot, 'outside-effective-temp');
  const finalLink = path.join(effectiveTempRoot, 'ledger.json');
  const sentinelPath = path.join(outsideEffectiveTemp, 'sentinel.txt');

  try {
    fs.mkdirSync(effectiveTempRoot);
    fs.mkdirSync(outsideEffectiveTemp);
    fs.writeFileSync(sentinelPath, 'unchanged', 'utf8');
    try {
      fs.symlinkSync(
        process.platform === 'win32' ? outsideEffectiveTemp : sentinelPath,
        finalLink,
        process.platform === 'win32' ? 'junction' : 'file'
      );
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'EPERM') {
        t.skip('This host does not permit creating a final symlink or junction.');
        return;
      }
      throw error;
    }

    const result = runCliWithOutput(finalLink, {
      env: childTempEnvironment(effectiveTempRoot),
    });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /must not be an existing symbolic link or junction/i);
    assert.equal(fs.readFileSync(sentinelPath, 'utf8'), 'unchanged');
  } finally {
    fs.rmSync(testRoot, { recursive: true, force: true });
  }
});

test('CLI creates output exclusively and does not overwrite an existing regular file', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tf-wal-public-ledger-exclusive-'));
  const outputPath = path.join(tempDir, 'ledger.json');

  try {
    fs.writeFileSync(outputPath, 'sentinel', 'utf8');
    const result = runCliWithOutput(outputPath);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /existing targets are not overwritten/i);
    assert.equal(fs.readFileSync(outputPath, 'utf8'), 'sentinel');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test(
  'CLI rejects Windows alternate data streams on existing files and directories',
  { skip: process.platform !== 'win32' },
  () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tf-wal-public-ledger-ads-'));
    const regularFile = path.join(tempDir, 'existing.txt');
    const existingDirectory = path.join(tempDir, 'existing-directory');

    try {
      fs.writeFileSync(regularFile, 'unchanged', 'utf8');
      fs.mkdirSync(existingDirectory);

      for (const outputPath of [`${regularFile}:ledger`, `${existingDirectory}:ledger`]) {
        const result = runCliWithOutput(outputPath);
        assert.notEqual(result.status, 0);
        assert.match(result.stderr, /must not use a Windows alternate data stream/i);
      }

      assert.equal(fs.readFileSync(regularFile, 'utf8'), 'unchanged');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
);

test('CLI rejects output paths outside or equal to the OS temp directory without creating files', () => {
  const uniqueToken = `${process.pid}-${Date.now()}`;
  const repositoryOutputPath = path.join(
    repoRoot,
    'generated',
    `wal-public-baseline-ledger-${uniqueToken}.json`
  );
  const tempRootOutputPath = os.tmpdir();
  const tempSiblingOutputPath = path.join(
    path.dirname(os.tmpdir()),
    `${path.basename(os.tmpdir())}-sibling`,
    `wal-public-baseline-ledger-${uniqueToken}.json`
  );
  const rejectedPaths = [
    path.relative(repoRoot, repositoryOutputPath),
    tempRootOutputPath,
    tempSiblingOutputPath,
  ];

  try {
    for (const outputPath of rejectedPaths) {
      const result = spawnSync(
        'node',
        [scriptPath, '--input', coverageProofPath, '--output', outputPath],
        { cwd: repoRoot, encoding: 'utf8' }
      );

      assert.notEqual(result.status, 0, `expected rejection for ${outputPath}`);
      assert.match(
        result.stderr,
        /must resolve strictly inside the operating system temporary directory/i
      );
    }

    assert.equal(fs.existsSync(repositoryOutputPath), false);
    assert.equal(fs.existsSync(tempSiblingOutputPath), false);
  } finally {
    fs.rmSync(repositoryOutputPath, { force: true });
    fs.rmSync(tempSiblingOutputPath, { force: true });
  }
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

test('rejects Benton contamination in every emitted acquisition readiness input', () => {
  for (const [field, value] of [
    ['status', 'BentonCounty adapter-ready'],
    ['acquisitionFamily', 'https://benton_county.example/PACS'],
    ['priority', 'fallback to Ben\u200bton County'],
  ]) {
    const proof = readCoverageProof();
    const yakima = proof.counties.find(row => row.county === 'Yakima');
    yakima[field] = value;

    assert.throws(
      () => buildLedger(proof),
      /contains Benton source evidence or acquisition readiness metadata/i,
      field
    );
  }
});

test('does not materialize a Benton runtime fallback for any non-Benton row', () => {
  const ledger = buildLedger(readCoverageProof());

  for (const row of ledger.rows.filter(candidate => candidate.county !== 'Benton')) {
    assert.equal(row.fallbackEvidence.observationStatus, 'not_observed');
    assert.equal(row.fallbackEvidence.silentBentonFallbackDetected, null);
    assert.equal(row.fallbackEvidence.fallbackCounty, null);
    assert.equal(row.runtimeRegistrationEvidence.parcels.endpoint, null);
    assert.equal(row.runtimeRegistrationEvidence.sales.endpoint, null);
    assert.equal(
      /benton/i.test(JSON.stringify([row.sourceInventory, row.acquisitionReadiness])),
      false
    );
  }
});
