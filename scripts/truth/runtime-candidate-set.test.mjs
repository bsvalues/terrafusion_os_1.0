#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const scriptPath = path.resolve('scripts/truth/runtime-candidate-set.mjs');

function makeTempRepo(prefix) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  fs.mkdirSync(path.join(root, 'generated', 'truth'), { recursive: true });
  return root;
}

function writeJson(root, name, value) {
  fs.writeFileSync(
    path.join(root, 'generated', 'truth', name),
    `${JSON.stringify(value, null, 2)}\n`
  );
}

function inventoryRow(county, overrides = {}) {
  return {
    county,
    rowsLanded: 0,
    evidenceCount: 0,
    dbTableTargetExists: false,
    runtimeApiConsumesIt: false,
    scraperOrAdapterExists: false,
    trustTier: 'unknown_untrusted',
    classification: 'unknown_untrusted',
    costForge: {
      costForgeReadinessTier: 'CF0_no_runtime_data',
      costForgeCountyMode: 'not_available',
    },
    ...overrides,
  };
}

function ledgerRow(county, overrides = {}) {
  const token = county.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return {
    county,
    countyToken: token,
    parcels: { status: 404, runtimeRows: 0 },
    readinessClass: 'not_registered',
    recommendedAction: 'downgrade_from_runtime_candidate',
    silentBentonFallbackDetected: false,
    ...overrides,
  };
}

function runCandidateSet(root) {
  execFileSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    stdio: 'pipe',
  });

  return JSON.parse(
    fs.readFileSync(path.join(root, 'generated', 'truth', 'runtime-candidate-set.json'), 'utf8')
  );
}

test('candidate set locks Benton-only runtime pilot when all other counties lack evidence', () => {
  const root = makeTempRepo('tf-runtime-candidates-benton-');
  writeJson(root, 'data-source-truth-inventory.json', {
    rows: [
      inventoryRow('Benton', {
        rowsLanded: 241,
        dbTableTargetExists: true,
        runtimeApiConsumesIt: true,
        classification: 'public_data_seed',
        costForge: {
          costForgeReadinessTier: 'CF1_parcel_public_data',
          costForgeCountyMode: 'public_data_loaded',
        },
      }),
      inventoryRow('Pacific'),
    ],
  });
  writeJson(root, 'county-runtime-registration-ledger.json', {
    rows: [
      ledgerRow('Benton', {
        parcels: { status: 200, runtimeRows: 5 },
        readinessClass: 'runtime_proven',
        recommendedAction: 'keep_runtime_candidate',
      }),
      ledgerRow('Pacific'),
    ],
  });

  const report = runCandidateSet(root);
  const pacific = report.rows.find(row => row.county === 'Pacific');

  assert.equal(report.summary.june10RuntimeScope, 'benton_only_runtime_pilot');
  assert.equal(report.summary.runtimeProven, 1);
  assert.equal(report.summary.evidenceBackedLoadCandidates, 0);
  assert.equal(report.summary.prohibit39CountyRuntimeClaim, true);
  assert.equal(pacific.runtimeCandidateClass, 'downgraded_no_runtime_evidence');
  assert.equal(pacific.june10Action, 'provenance_inventory_only');
});

test('candidate set keeps evidence-backed unregistered county as explicit promotion work', () => {
  const root = makeTempRepo('tf-runtime-candidates-promote-');
  writeJson(root, 'data-source-truth-inventory.json', {
    rows: [
      inventoryRow('Benton', {
        rowsLanded: 241,
        dbTableTargetExists: true,
        runtimeApiConsumesIt: true,
        classification: 'public_data_seed',
      }),
      inventoryRow('Pacific', {
        rowsLanded: 11,
        dbTableTargetExists: true,
        runtimeApiConsumesIt: true,
        classification: 'public_data_seed',
      }),
    ],
  });
  writeJson(root, 'county-runtime-registration-ledger.json', {
    rows: [
      ledgerRow('Benton', {
        parcels: { status: 200, runtimeRows: 5 },
        readinessClass: 'runtime_proven',
        recommendedAction: 'keep_runtime_candidate',
      }),
      ledgerRow('Pacific', {
        recommendedAction: 'load_or_register_next',
      }),
    ],
  });

  const report = runCandidateSet(root);
  const pacific = report.rows.find(row => row.county === 'Pacific');

  assert.equal(report.summary.june10RuntimeScope, 'runtime_scope_requires_review');
  assert.equal(report.summary.evidenceBackedLoadCandidates, 1);
  assert.equal(pacific.runtimeCandidateClass, 'evidence_backed_load_candidate');
  assert.equal(pacific.june10Action, 'may_promote_after_registration');
});

test('candidate set blocks silent fallback violations', () => {
  const root = makeTempRepo('tf-runtime-candidates-fallback-');
  writeJson(root, 'data-source-truth-inventory.json', {
    rows: [inventoryRow('Yakima')],
  });
  writeJson(root, 'county-runtime-registration-ledger.json', {
    rows: [
      ledgerRow('Yakima', {
        readinessClass: 'fallback_violation',
        recommendedAction: 'investigate_endpoint_error',
        silentBentonFallbackDetected: true,
      }),
    ],
  });

  assert.throws(() => runCandidateSet(root), /Command failed/);

  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated', 'truth', 'runtime-candidate-set.json'), 'utf8')
  );
  assert.equal(report.summary.shipBlockers, 1);
  assert.equal(report.rows[0].runtimeCandidateClass, 'blocked_fallback_violation');
});
