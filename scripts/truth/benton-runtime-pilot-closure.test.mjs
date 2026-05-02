#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const scriptPath = path.resolve('scripts/truth/benton-runtime-pilot-closure.mjs');

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

function writeInputs(root, overrides = {}) {
  writeJson(root, 'runtime-candidate-set.json', {
    summary: {
      june10RuntimeScope: 'benton_only_runtime_pilot',
      prohibit39CountyRuntimeClaim: true,
      runtimeProven: 1,
      evidenceBackedLoadCandidates: 0,
      provenanceInventoryOnly: 38,
      allowedRuntimeClaim:
        'Benton runtime pilot only; 39-county data remains provenance/inventory, not runtime readiness.',
      ...(overrides.candidateSummary ?? {}),
    },
    rows: [
      {
        county: 'Benton',
        runtimeCandidateClass: 'runtime_proven',
        ...(overrides.bentonCandidate ?? {}),
      },
    ],
  });

  writeJson(root, 'runtime-row-path-proof.json', {
    proofs: [
      {
        county: 'Benton',
        passed: true,
        endpointStatus: 200,
        runtimeRowsReturned: 50,
        silentBentonFallbackDetected: false,
        ...(overrides.bentonRowPath ?? {}),
      },
    ],
  });

  writeJson(root, 'runtime-sale-qualification-lineage-proof.json', {
    proofs: [
      {
        county: 'Benton',
        passed: true,
        classification: 'canonical_landing_backed',
        canonicalSaleQualifications: 25,
        ratioStudyWindow: {
          effectiveQualified: 10,
          decisionQualified: 10,
          recQualifiedFallback: 0,
        },
        eliteOperationsMockDataEnabled: false,
        ...(overrides.bentonSales ?? {}),
      },
    ],
  });
}

function runClosure(root) {
  return spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
}

function readReport(root) {
  return JSON.parse(
    fs.readFileSync(
      path.join(root, 'generated', 'truth', 'benton-runtime-pilot-closure.json'),
      'utf8'
    )
  );
}

test('closure passes when Benton is canonical-backed and scope is Benton-only', () => {
  const root = makeTempRepo('tf-benton-closure-pass-');
  writeInputs(root);

  execFileSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    stdio: 'pipe',
  });

  const report = readReport(root);
  assert.equal(report.status, 'PASS');
  assert.equal(report.blockers.length, 0);
});

test('closure fails when canonical sale qualifications are missing', () => {
  const root = makeTempRepo('tf-benton-closure-canonical-missing-');
  writeInputs(root, {
    bentonSales: {
      classification: 'recommendation_backed_canonical_landing_missing',
      canonicalSaleQualifications: 0,
      ratioStudyWindow: {
        effectiveQualified: 36,
        decisionQualified: 0,
        recQualifiedFallback: 36,
      },
    },
  });

  const result = runClosure(root);
  const report = readReport(root);

  assert.notEqual(result.status, 0);
  assert.equal(report.status, 'FAIL');
  assert.ok(
    report.blockers.some(blocker =>
      blocker.includes('CanonicalSaleQualifications landing table is empty')
    )
  );
  assert.ok(report.blockers.some(blocker => blocker.includes('expected canonical_landing_backed')));
});

test('closure fails if 39-county runtime claim is not prohibited', () => {
  const root = makeTempRepo('tf-benton-closure-scope-');
  writeInputs(root, {
    candidateSummary: {
      prohibit39CountyRuntimeClaim: false,
    },
  });

  const result = runClosure(root);
  const report = readReport(root);

  assert.notEqual(result.status, 0);
  assert.equal(report.status, 'FAIL');
  assert.ok(
    report.blockers.some(blocker =>
      blocker.includes('39-county runtime claim is not explicitly prohibited')
    )
  );
});
