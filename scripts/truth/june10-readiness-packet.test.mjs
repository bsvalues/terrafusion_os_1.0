#!/usr/bin/env node

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const scriptPath = path.resolve('scripts/truth/june10-readiness-packet.mjs');

function writeJson(root, relativePath, value) {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `${JSON.stringify(value, null, 2)}\n`);
}

function makeRepo({ passing = false } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tf-june10-packet-'));
  const truth = 'generated/truth';

  writeJson(root, `${truth}/washington-39-county-data-crosswalk.json`, {
    summary: {
      countiesChecked: 39,
      runtimeProven: passing ? 1 : 0,
      publicSourceSeed: 12,
      provenanceInventoryOnly: 27,
      prohibit39CountyRuntimeClaim: true,
    },
  });
  writeJson(root, `${truth}/runtime-candidate-set.json`, {
    summary: {
      june10RuntimeScope: passing ? 'benton_only_runtime_pilot' : 'runtime_scope_requires_review',
      prohibit39CountyRuntimeClaim: passing,
      runtimeProven: passing ? 1 : 0,
      evidenceBackedLoadCandidates: passing ? 0 : 1,
      shipBlockers: passing ? 0 : 1,
    },
    rows: passing
      ? []
      : [
          {
            county: 'Pacific',
            blockers: ['County has inventory evidence but is not registered in runtime.'],
          },
        ],
  });

  writeJson(root, `${truth}/county-runtime-contract.json`, {
    passed: passing,
    summary: {
      runtimeContractPass: passing ? 1 : 0,
      runtimeContractBlocked: passing ? 38 : 39,
      prohibit39CountyRuntimeClaim: true,
    },
  });

  writeJson(root, `${truth}/runtime-db-identity.json`, {
    endpointStatus: passing ? 200 : null,
    passed: passing,
    blockers: passing ? [] : ['Runtime DB identity is not proven.'],
  });
  writeJson(root, `${truth}/runtime-db-content-audit.json`, {
    endpointStatus: passing ? 200 : null,
    passed: passing,
    blockers: passing ? [] : ['Runtime DB content audit is not passing.'],
  });
  writeJson(root, `${truth}/runtime-row-path-proof.json`, {
    summary: {
      candidatesChecked: 1,
      passed: passing ? 1 : 0,
      failed: passing ? 0 : 1,
      silentBentonFallbacks: 0,
      zeroRowRuntimeResponses: passing ? 0 : 1,
      runtimeDbIdentityPassed: passing,
    },
    proofs: passing
      ? [
          {
            county: 'Benton',
            passed: true,
          },
        ]
      : [
          {
            county: 'Benton',
            blockers: ['Runtime returned zero rows.'],
          },
        ],
  });
  writeJson(root, `${truth}/terrafusion-db-product-load-ledger.json`, {
    passed: passing,
    summary: {
      productTablesChecked: 10,
      lineageProven: passing ? 10 : 0,
      rowsExistLineageUnproven: passing ? 0 : 4,
      emptyTables: passing ? 0 : 6,
    },
    blockers: passing ? [] : ['Rows exist but no product load receipt proves lineage.'],
    rows: passing
      ? []
      : [
          {
            tableName: 'Properties',
            blockers: ['Rows exist but no product load receipt proves lineage.'],
          },
        ],
  });
  writeJson(root, `${truth}/benton-parcel-count-sanity.json`, {
    passed: passing,
    blockers: passing ? [] : ['Benton parcel count sanity is not proven.'],
  });
  writeJson(root, `${truth}/runtime-row-source-lineage-proof.json`, {
    summary: {
      candidatesChecked: 1,
      passed: passing ? 1 : 0,
      failed: passing ? 0 : 1,
    },
    proofs: passing
      ? [
          {
            county: 'Benton',
            passed: true,
          },
        ]
      : [
          {
            county: 'Benton',
            blockers: ['Runtime lineage endpoint did not return 200. Status: 500'],
          },
        ],
  });
  writeJson(root, `${truth}/runtime-sale-qualification-lineage-proof.json`, {
    status: passing ? 'PASS' : 'FAIL',
    summary: {
      candidatesChecked: 1,
      passed: passing ? 1 : 0,
      failed: passing ? 0 : 1,
      canonicalLandingBacked: passing ? 1 : 0,
      recommendationBackedCanonicalMissing: passing ? 0 : 1,
    },
    proofs: passing
      ? [
          {
            county: 'Benton',
            classification: 'canonical_landing_backed',
            canonicalSaleQualifications: 10,
            ratioStudyWindow: {
              decisionQualified: 5,
            },
            passed: true,
          },
        ]
      : [
          {
            county: 'Benton',
            classification: 'recommendation_backed_canonical_landing_missing',
            passed: false,
            warnings: ['Ratio-study qualified pool is recommendation-backed.'],
          },
        ],
  });
  writeJson(root, `${truth}/benton-runtime-pilot-closure.json`, {
    status: passing ? 'PASS' : 'FAIL',
    benton: {
      saleQualificationClassification: passing
        ? 'canonical_landing_backed'
        : 'recommendation_backed_canonical_landing_missing',
      canonicalSaleQualifications: passing ? 10 : 0,
      ratioStudyDecisionQualified: passing ? 5 : 0,
    },
    countyScope: {
      runtimeProven: passing ? 1 : 0,
      evidenceBackedLoadCandidates: passing ? 0 : 1,
      provenanceInventoryOnly: passing ? 38 : 37,
      prohibit39CountyRuntimeClaim: passing,
    },
  });

  return root;
}

test('readiness packet fails when required runtime truth artifacts are red', () => {
  const root = makeRepo({ passing: false });
  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/june10-readiness-packet.json'), 'utf8')
  );
  assert.equal(report.status, 'FAIL');
  assert.ok(report.shipBlockers.length >= 1);
  assert.ok(report.shipBlockers.some(item => item.source === 'runtimeCandidateSet'));
  assert.ok(report.shipBlockers.some(item => item.source === 'dbIdentity'));
  assert.ok(report.executionQueue.some(item => item.source === 'runtimeCandidateSet'));
  assert.ok(report.shipBlockers.some(item => item.source === 'runtimeRowPath'));
  assert.ok(report.shipBlockers.some(item => item.source === 'sourceLineage'));
  assert.ok(report.executionQueue.some(item => item.source === 'dbIdentity'));
  assert.ok(report.executionQueue.some(item => item.source === 'runtimeRowPath'));
  assert.ok(report.executionQueue.some(item => item.source === 'sourceLineage'));
  assert.ok(
    report.executionQueue.some(item => item.nextCommand === 'pnpm run truth:runtime-db-identity')
  );
  assert.ok(
    report.executionQueue.some(item => item.nextCommand === 'pnpm run truth:runtime-row-path-proof')
  );
  assert.ok(
    report.executionQueue.some(item => item.nextCommand === 'pnpm run truth:runtime-source-lineage')
  );
  assert.equal(
    report.summary.terraFusionDb.liveRuntimeReachability,
    'api_unavailable_or_not_probed'
  );
  assert.equal(report.summary.terraFusionDb.dbIdentityEndpointStatus, null);
  assert.equal(report.summary.countyScope.runtimeCandidateSetPassed, false);
  assert.equal(report.summary.countyScope.runtimeCandidateScope, 'runtime_scope_requires_review');
  assert.equal(report.summary.terraFusionDb.runtimeRowPathPassed, false);
  assert.equal(report.summary.terraFusionDb.sourceLineagePassed, false);
  assert.equal(report.postDbRefreshQuickCommand, 'pnpm run truth:post-db-refresh-rerun');
  assert.equal(report.postDbRefreshFullReadinessCommand, 'pnpm run readiness:june10');
  assert.ok(report.artifactDetails.dbIdentity.blockers.items.length > 0);
  assert.ok(
    report.artifactDetails.productLoadLedger.blockers.items.some(blocker =>
      blocker.includes('Properties:')
    )
  );
  assert.ok(
    report.artifactDetails.runtimeRowPath.blockers.items.some(blocker =>
      blocker.includes('Benton:')
    )
  );
  assert.ok(
    report.artifactDetails.sourceLineage.blockers.items.some(blocker => blocker.includes('Benton:'))
  );
  assert.ok(
    report.artifactDetails.saleQualification.warnings.items.some(warning =>
      warning.includes('Benton: Ratio-study qualified pool is recommendation-backed.')
    )
  );
  const markdown = fs.readFileSync(
    path.join(root, 'generated/truth/june10-readiness-packet.md'),
    'utf8'
  );
  assert.match(markdown, /## Artifact Warning Details/);
  assert.match(
    markdown,
    /saleQualification: Benton: Ratio-study qualified pool is recommendation-backed\./
  );
  assert.deepEqual(
    report.postDbRefreshRerunChecklist.map(item => item.command),
    [
      'pnpm run truth:runtime-db-identity',
      'pnpm run truth:runtime-db-content',
      'pnpm run truth:data-source-inventory',
      'pnpm run truth:county-runtime-registration-ledger',
      'pnpm run truth:runtime-candidate-set',
      'pnpm run truth:runtime-row-path-proof',
      'pnpm run truth:terrafusion-db-product-load-ledger',
      'pnpm run truth:benton-parcel-count-sanity',
      'pnpm run truth:washington-39-county-data-crosswalk',
      'pnpm run truth:county-runtime-contract',
      'pnpm run truth:runtime-source-lineage',
      'pnpm run truth:runtime-sale-qualification',
      'pnpm run truth:benton-runtime-pilot-closure',
      'pnpm run truth:june10-readiness-packet',
    ]
  );
});

test('readiness packet passes when all required runtime truth artifacts are green', () => {
  const root = makeRepo({ passing: true });
  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 0);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/june10-readiness-packet.json'), 'utf8')
  );
  assert.equal(report.status, 'PASS');
  assert.equal(report.summary.countyScope.runtimeCandidateSetPassed, true);
  assert.equal(report.summary.countyScope.runtimeCandidateScope, 'benton_only_runtime_pilot');
  assert.equal(report.summary.countyScope.evidenceBackedLoadCandidates, 0);
  assert.equal(report.summary.terraFusionDb.liveRuntimeReachability, 'api_reachable');
  assert.equal(report.summary.terraFusionDb.dbIdentityEndpointStatus, 200);
  assert.equal(report.summary.terraFusionDb.runtimeRowPathPassed, true);
  assert.equal(report.summary.terraFusionDb.sourceLineagePassed, true);
  assert.equal(report.summary.bentonPilot.saleQualificationCanonicalBacked, true);
  assert.equal(report.summary.bentonPilot.pilotClosureProofDetailPassed, true);
  const markdown = fs.readFileSync(
    path.join(root, 'generated/truth/june10-readiness-packet.md'),
    'utf8'
  );
  assert.match(markdown, /Sale qualification canonical-backed: yes/);
  assert.match(markdown, /Pilot closure proof detail passed: yes/);
  assert.equal(report.shipBlockers.length, 0);
  assert.deepEqual(report.executionQueue, []);
  assert.equal(report.postDbRefreshRerunChecklist.length, 14);
  assert.equal(report.artifactDetails.dbIdentity, undefined);
});

test('readiness packet blocks required artifacts with top-level failed proof posture', () => {
  const root = makeRepo({ passing: true });
  writeJson(root, 'generated/truth/runtime-candidate-set.json', {
    status: 'pretend_pass',
    summary: {
      june10RuntimeScope: 'benton_only_runtime_pilot',
      prohibit39CountyRuntimeClaim: true,
      runtimeProven: 1,
      evidenceBackedLoadCandidates: 0,
      shipBlockers: 0,
    },
    rows: [],
  });

  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/june10-readiness-packet.json'), 'utf8')
  );
  assert.equal(report.status, 'FAIL');
  assert.ok(
    report.shipBlockers.some(
      item =>
        item.source === 'runtimeCandidateSet' &&
        item.message.includes('top-level status is pretend_pass')
    )
  );
  assert.ok(
    report.artifactDetails.runtimeCandidateSet.blockers.items.some(item =>
      item.includes('top-level status is pretend_pass')
    )
  );
  assert.ok(report.executionQueue.some(item => item.source === 'runtimeCandidateSet'));
});

test('readiness packet blocks false success or ok posture fields', () => {
  const root = makeRepo({ passing: true });
  writeJson(root, 'generated/truth/runtime-candidate-set.json', {
    success: false,
    summary: {
      june10RuntimeScope: 'benton_only_runtime_pilot',
      prohibit39CountyRuntimeClaim: true,
      runtimeProven: 1,
      evidenceBackedLoadCandidates: 0,
      shipBlockers: 0,
      ok: false,
    },
    rows: [{ county: 'Benton', runtimeCandidateClass: 'runtime_proven', success: false }],
  });

  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/june10-readiness-packet.json'), 'utf8')
  );
  assert.equal(report.status, 'FAIL');
  assert.ok(
    report.shipBlockers.some(
      item =>
        item.source === 'runtimeCandidateSet' && item.message.includes('artifact.success is false')
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item => item.source === 'runtimeCandidateSet' && item.message.includes('summary.ok is false')
    )
  );
  assert.ok(
    report.artifactDetails.runtimeCandidateSet.blockers.items.some(item =>
      item.includes('Benton row.success is false')
    )
  );
});

test('readiness packet blocks string false proof posture fields', () => {
  const root = makeRepo({ passing: true });
  writeJson(root, 'generated/truth/runtime-db-content-audit.json', {
    endpointStatus: 200,
    passed: 'false',
    summary: {
      passed: 'false',
      dbIdentityPassed: 'false',
    },
    rows: [{ county: 'Benton', passed: 'false' }],
    checks: [{ propertyRowsMatchExpected: 'false' }],
  });

  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/june10-readiness-packet.json'), 'utf8')
  );
  assert.equal(report.status, 'FAIL');
  assert.ok(
    report.shipBlockers.some(
      item => item.source === 'dbContent' && item.message.includes('top-level passed is false')
    )
  );
  assert.ok(
    report.artifactDetails.dbContent.blockers.items.some(item =>
      item.includes('summary.dbIdentityPassed is false')
    )
  );
  assert.ok(
    report.artifactDetails.dbContent.blockers.items.some(item =>
      item.includes('Benton row passed is false')
    )
  );
  assert.ok(
    report.artifactDetails.dbContent.blockers.items.some(item =>
      item.includes('artifact.checks.[].propertyRowsMatchExpected is false')
    )
  );
});

test('readiness packet blocks numeric zero proof posture fields', () => {
  const root = makeRepo({ passing: true });
  writeJson(root, 'generated/truth/runtime-db-content-audit.json', {
    endpointStatus: 200,
    passed: 0,
    summary: {
      ok: 0,
      dbIdentityPassed: '0',
    },
    rows: [{ county: 'Benton', passed: 0 }],
    checks: [{ propertyRowsMatchExpected: 0 }],
  });

  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/june10-readiness-packet.json'), 'utf8')
  );
  assert.equal(report.status, 'FAIL');
  assert.ok(
    report.shipBlockers.some(
      item => item.source === 'dbContent' && item.message.includes('top-level passed is false')
    )
  );
  assert.ok(
    report.artifactDetails.dbContent.blockers.items.some(item =>
      item.includes('summary.ok is false')
    )
  );
  assert.ok(
    report.artifactDetails.dbContent.blockers.items.some(item =>
      item.includes('summary.dbIdentityPassed is false')
    )
  );
  assert.ok(
    report.artifactDetails.dbContent.blockers.items.some(item =>
      item.includes('artifact.checks.[].propertyRowsMatchExpected is false')
    )
  );
});

test('readiness packet blocks false explicit passed-derived fields', () => {
  const root = makeRepo({ passing: true });
  writeJson(root, 'generated/truth/runtime-db-identity.json', {
    endpointStatus: 200,
    passed: true,
    dbIdentityPassed: false,
    summary: {
      sourceLineagePassed: false,
    },
    rows: [{ county: 'Benton', parcelSanityPassed: false }],
    proofs: [{ county: 'Benton', runtimeDbIdentityPassed: false }],
  });

  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/june10-readiness-packet.json'), 'utf8')
  );
  assert.equal(report.status, 'FAIL');
  assert.ok(
    report.shipBlockers.some(
      item =>
        item.source === 'dbIdentity' && item.message.includes('artifact.dbIdentityPassed is false')
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item =>
        item.source === 'dbIdentity' &&
        item.message.includes('summary.sourceLineagePassed is false')
    )
  );
  assert.ok(
    report.artifactDetails.dbIdentity.blockers.items.some(item =>
      item.includes('Benton row.parcelSanityPassed is false')
    )
  );
  assert.ok(
    report.artifactDetails.dbIdentity.blockers.items.some(item =>
      item.includes('Benton proof.runtimeDbIdentityPassed is false')
    )
  );
});

test('readiness packet blocks nested expected-match proof fields as false', () => {
  const root = makeRepo({ passing: true });
  writeJson(root, 'generated/truth/runtime-db-content-audit.json', {
    endpointStatus: 200,
    passed: true,
    identity: {
      isExpectedJune10RuntimeDb: false,
      isBentonParcelCountExpected: false,
    },
    content: {
      bentonDecision: {
        propertyRowsMatchExpected: false,
        distinctParcelIdsMatchExpected: false,
      },
    },
    configExpectationSources: [{ matchesRuntimeExpectation: false }],
  });

  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/june10-readiness-packet.json'), 'utf8')
  );
  assert.equal(report.status, 'FAIL');
  assert.ok(
    report.shipBlockers.some(
      item =>
        item.source === 'dbContent' &&
        item.message.includes('artifact.identity.isExpectedJune10RuntimeDb is false')
    )
  );
  assert.ok(
    report.artifactDetails.dbContent.blockers.items.some(item =>
      item.includes('artifact.content.bentonDecision.propertyRowsMatchExpected is false')
    )
  );
  assert.ok(
    report.artifactDetails.dbContent.blockers.items.some(item =>
      item.includes('artifact.configExpectationSources.[].matchesRuntimeExpectation is false')
    )
  );
});

test('readiness packet blocks variant boolean and expected-match proof fields', () => {
  const root = makeRepo({ passing: true });
  writeJson(root, 'generated/truth/runtime-db-content-audit.json', {
    endpointStatus: 200,
    passed: true,
    Success: false,
    summary: {
      OK: 'false',
    },
    identity: {
      is_expected_june10_runtime_db: false,
      is_benton_parcel_count_expected: false,
    },
    content: {
      bentonDecision: {
        property_rows_match_expected: false,
      },
    },
    rows: [{ county: 'Benton', proof_passed: false }],
    configExpectationSources: [{ matches_runtime_expectation: false }],
  });

  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/june10-readiness-packet.json'), 'utf8')
  );
  assert.equal(report.status, 'FAIL');
  assert.ok(
    report.shipBlockers.some(
      item => item.source === 'dbContent' && item.message.includes('artifact.Success is false')
    )
  );
  assert.ok(
    report.artifactDetails.dbContent.blockers.items.some(item =>
      item.includes('summary.OK is false')
    )
  );
  assert.ok(
    report.artifactDetails.dbContent.blockers.items.some(item =>
      item.includes('artifact.identity.is_expected_june10_runtime_db is false')
    )
  );
  assert.ok(
    report.artifactDetails.dbContent.blockers.items.some(item =>
      item.includes('artifact.content.bentonDecision.property_rows_match_expected is false')
    )
  );
  assert.ok(
    report.artifactDetails.dbContent.blockers.items.some(item =>
      item.includes('Benton row.proof_passed is false')
    )
  );
  assert.ok(
    report.artifactDetails.dbContent.blockers.items.some(item =>
      item.includes('artifact.configExpectationSources.[].matches_runtime_expectation is false')
    )
  );
});

test('readiness packet blocks nested explicit failing status fields', () => {
  const root = makeRepo({ passing: true });
  writeJson(root, 'generated/truth/runtime-db-content-audit.json', {
    endpointStatus: 200,
    passed: true,
    summary: {
      saleQualificationStatus: 'FAIL',
      pilotClosureStatus: 'ERROR',
    },
    receiptEvidence: {
      loadStatus: 'FAILED',
    },
    details: [{ validationStatus: 'DRY_RUN' }],
  });

  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/june10-readiness-packet.json'), 'utf8')
  );
  assert.equal(report.status, 'FAIL');
  assert.ok(
    report.shipBlockers.some(
      item =>
        item.source === 'dbContent' &&
        item.message.includes('artifact.summary.saleQualificationStatus is FAIL')
    )
  );
  assert.ok(
    report.artifactDetails.dbContent.blockers.items.some(item =>
      item.includes('artifact.receiptEvidence.loadStatus is FAILED')
    )
  );
  assert.ok(
    report.artifactDetails.dbContent.blockers.items.some(item =>
      item.includes('artifact.details.[].validationStatus is DRY_RUN')
    )
  );
});

test('readiness packet blocks nested arbitrary failing status fields', () => {
  const root = makeRepo({ passing: true });
  writeJson(root, 'generated/truth/runtime-db-content-audit.json', {
    endpointStatus: 200,
    passed: true,
    checks: [
      {
        status: 'FAIL',
        nested: {
          status: 'ERROR',
        },
      },
    ],
  });

  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/june10-readiness-packet.json'), 'utf8')
  );
  assert.equal(report.status, 'FAIL');
  assert.ok(
    report.shipBlockers.some(
      item =>
        item.source === 'dbContent' && item.message.includes('artifact.checks.[].status is FAIL')
    )
  );
  assert.ok(
    report.artifactDetails.dbContent.blockers.items.some(item =>
      item.includes('artifact.checks.[].nested.status is ERROR')
    )
  );
});

test('readiness packet blocks lowercase nested failing status fields', () => {
  const root = makeRepo({ passing: true });
  writeJson(root, 'generated/truth/runtime-db-content-audit.json', {
    endpointStatus: 200,
    passed: true,
    checks: [
      {
        status: 'fail',
        nested: {
          status: 'error',
        },
      },
    ],
    summary: {
      validationStatus: 'dry_run',
    },
  });

  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/june10-readiness-packet.json'), 'utf8')
  );
  assert.equal(report.status, 'FAIL');
  assert.ok(
    report.shipBlockers.some(
      item =>
        item.source === 'dbContent' && item.message.includes('artifact.checks.[].status is fail')
    )
  );
  assert.ok(
    report.artifactDetails.dbContent.blockers.items.some(item =>
      item.includes('artifact.checks.[].nested.status is error')
    )
  );
  assert.ok(
    report.artifactDetails.dbContent.blockers.items.some(item =>
      item.includes('artifact.summary.validationStatus is dry_run')
    )
  );
});

test('readiness packet blocks alternate status field casing and separators', () => {
  const root = makeRepo({ passing: true });
  writeJson(root, 'generated/truth/runtime-db-content-audit.json', {
    endpointStatus: 200,
    passed: true,
    checks: [
      {
        STATUS: 'fail',
        nested: {
          validation_status: 'error',
          pipelinestatus: 'dry_run',
        },
      },
    ],
    summary: {
      closure_status: 'failed',
    },
  });

  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/june10-readiness-packet.json'), 'utf8')
  );
  assert.equal(report.status, 'FAIL');
  assert.ok(
    report.shipBlockers.some(
      item =>
        item.source === 'dbContent' && item.message.includes('artifact.checks.[].STATUS is fail')
    )
  );
  assert.ok(
    report.artifactDetails.dbContent.blockers.items.some(item =>
      item.includes('artifact.checks.[].nested.validation_status is error')
    )
  );
  assert.ok(
    report.artifactDetails.dbContent.blockers.items.some(item =>
      item.includes('artifact.checks.[].nested.pipelinestatus is dry_run')
    )
  );
  assert.ok(
    report.artifactDetails.dbContent.blockers.items.some(item =>
      item.includes('artifact.summary.closure_status is failed')
    )
  );
});

test('readiness packet blocks nested arbitrary blocker and failure collections', () => {
  const root = makeRepo({ passing: true });
  writeJson(root, 'generated/truth/runtime-db-content-audit.json', {
    endpointStatus: 200,
    passed: true,
    checks: [
      {
        blockers: ['Nested readiness blocker.'],
        errors: ['Nested readiness error.'],
        metrics: {
          failureCount: 1,
        },
      },
    ],
  });

  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/june10-readiness-packet.json'), 'utf8')
  );
  assert.equal(report.status, 'FAIL');
  assert.ok(
    report.shipBlockers.some(
      item =>
        item.source === 'dbContent' &&
        item.message.includes('artifact.checks.[].blockers has 1 item(s)')
    )
  );
  assert.ok(
    report.artifactDetails.dbContent.blockers.items.some(item =>
      item.includes('artifact.checks.[].errors has 1 item(s)')
    )
  );
  assert.ok(
    report.artifactDetails.dbContent.blockers.items.some(item =>
      item.includes('artifact.checks.[].metrics.failureCount is 1')
    )
  );
});

test('readiness packet blocks required artifacts whose JSON root is not an object', () => {
  const root = makeRepo({ passing: true });
  writeJson(root, 'generated/truth/runtime-candidate-set.json', []);

  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/june10-readiness-packet.json'), 'utf8')
  );
  assert.equal(report.status, 'FAIL');
  assert.ok(
    report.shipBlockers.some(
      item =>
        item.source === 'runtimeCandidateSet' &&
        item.message === 'Artifact JSON root must be an object.'
    )
  );
  assert.equal(
    report.artifacts.runtimeCandidateSet.shapeError,
    'Artifact JSON root must be an object.'
  );
  assert.ok(
    report.artifactDetails.runtimeCandidateSet.blockers.items.includes(
      'Artifact JSON root must be an object.'
    )
  );
});

test('readiness packet blocks nested failed row and proof posture', () => {
  const root = makeRepo({ passing: true });
  writeJson(root, 'generated/truth/runtime-db-identity.json', {
    endpointStatus: 200,
    passed: true,
    summary: {
      passed: false,
      status: 'FAIL',
    },
    rows: [
      {
        county: 'Benton',
        passed: false,
        summary: {
          passed: false,
        },
      },
    ],
    proofs: [
      {
        county: 'Benton',
        status: 'FAIL',
        summary: {
          status: 'FAIL',
        },
      },
    ],
    blockers: [],
  });

  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/june10-readiness-packet.json'), 'utf8')
  );
  assert.equal(report.status, 'FAIL');
  assert.ok(
    report.shipBlockers.some(
      item => item.source === 'dbIdentity' && item.message.includes('summary.passed is false')
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item => item.source === 'dbIdentity' && item.message.includes('summary.status is FAIL')
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item => item.source === 'dbIdentity' && item.message.includes('Benton row passed is false')
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item => item.source === 'dbIdentity' && item.message.includes('Benton proof status is FAIL')
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item =>
        item.source === 'dbIdentity' && item.message.includes('Benton row summary.passed is false')
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item =>
        item.source === 'dbIdentity' && item.message.includes('Benton proof summary.status is FAIL')
    )
  );
  assert.ok(
    report.artifactDetails.dbIdentity.blockers.items.some(item =>
      item.includes('summary.passed is false')
    )
  );
  assert.ok(
    report.artifactDetails.dbIdentity.blockers.items.some(item =>
      item.includes('summary.status is FAIL')
    )
  );
  assert.ok(
    report.artifactDetails.dbIdentity.blockers.items.some(item =>
      item.includes('Benton row passed is false')
    )
  );
  assert.ok(
    report.artifactDetails.dbIdentity.blockers.items.some(item =>
      item.includes('Benton proof status is FAIL')
    )
  );
  assert.ok(
    report.artifactDetails.dbIdentity.blockers.items.some(item =>
      item.includes('Benton row summary.passed is false')
    )
  );
  assert.ok(
    report.artifactDetails.dbIdentity.blockers.items.some(item =>
      item.includes('Benton proof summary.status is FAIL')
    )
  );
  assert.ok(report.executionQueue.some(item => item.source === 'dbIdentity'));
});

test('readiness packet blocks explicit blocker error and failure collections', () => {
  const root = makeRepo({ passing: true });
  writeJson(root, 'generated/truth/runtime-db-identity.json', {
    endpointStatus: 200,
    passed: true,
    blockers: ['Explicit top-level blocker.'],
    errors: ['Top-level error.'],
    failures: ['Top-level failure.'],
    receiptEvidence: {
      blockers: ['Receipt blocker.'],
    },
    errorCount: 2,
    failureCount: 3,
    blockerCount: 4,
    failed: 5,
    summary: {
      blockers: ['Summary blocker.'],
      errors: ['Summary error.'],
      failures: ['Summary failure.'],
      failed: 6,
      shipBlockers: 7,
    },
    rows: [
      {
        county: 'Benton',
        blockers: ['Row blocker.'],
        errors: ['Row error.'],
        failures: ['Row failure.'],
        failed: 8,
      },
    ],
    proofs: [
      {
        county: 'Benton',
        blockers: ['Proof blocker.'],
        errors: ['Proof error.'],
        failures: ['Proof failure.'],
        errorCount: 9,
      },
    ],
  });

  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/june10-readiness-packet.json'), 'utf8')
  );
  assert.equal(report.status, 'FAIL');
  assert.ok(
    report.shipBlockers.some(
      item => item.source === 'dbIdentity' && item.message === 'Explicit top-level blocker.'
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item => item.source === 'dbIdentity' && item.message === 'Benton: Row blocker.'
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item => item.source === 'dbIdentity' && item.message === 'Benton: Proof blocker.'
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item => item.source === 'dbIdentity' && item.message === 'receiptEvidence: Receipt blocker.'
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item => item.source === 'dbIdentity' && item.message.includes('artifact.errors has 1 item(s)')
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item => item.source === 'dbIdentity' && item.message.includes('artifact.failed is 5')
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item => item.source === 'dbIdentity' && item.message.includes('artifact.errorCount is 2')
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item =>
        item.source === 'dbIdentity' && item.message.includes('summary.failures has 1 item(s)')
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item => item.source === 'dbIdentity' && item.message.includes('summary.shipBlockers is 7')
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item =>
        item.source === 'dbIdentity' && item.message.includes('Benton row.errors has 1 item(s)')
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item => item.source === 'dbIdentity' && item.message.includes('Benton row.failed is 8')
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item =>
        item.source === 'dbIdentity' && item.message.includes('Benton proof.failures has 1 item(s)')
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item => item.source === 'dbIdentity' && item.message.includes('Benton proof.errorCount is 9')
    )
  );
  assert.ok(
    report.artifactDetails.dbIdentity.blockers.items.includes('Explicit top-level blocker.')
  );
  assert.ok(report.artifactDetails.dbIdentity.blockers.items.includes('Summary blocker.'));
  assert.ok(report.artifactDetails.dbIdentity.blockers.items.includes('Benton: Row blocker.'));
  assert.ok(report.artifactDetails.dbIdentity.blockers.omitted > 0);
  assert.ok(report.executionQueue.some(item => item.source === 'dbIdentity'));
});

test('readiness packet blocks ship blocker collections in required artifacts', () => {
  const root = makeRepo({ passing: true });
  writeJson(root, 'generated/truth/runtime-db-identity.json', {
    endpointStatus: 200,
    passed: true,
    shipBlockers: ['Ship blocker from nested artifact.'],
  });

  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/june10-readiness-packet.json'), 'utf8')
  );
  assert.equal(report.status, 'FAIL');
  assert.ok(
    report.shipBlockers.some(
      item =>
        item.source === 'dbIdentity' && item.message.includes('artifact.shipBlockers has 1 item')
    )
  );
  assert.ok(
    report.artifactDetails.dbIdentity.blockers.items.some(item =>
      item.includes('artifact.shipBlockers has 1 item')
    )
  );
  assert.ok(report.executionQueue.some(item => item.source === 'dbIdentity'));
});

test('readiness packet blocks failing receipt evidence summary posture', () => {
  const root = makeRepo({ passing: true });
  writeJson(root, 'generated/truth/runtime-db-identity.json', {
    endpointStatus: 200,
    passed: true,
    receiptEvidence: {
      summary: {
        passed: false,
        status: 'FAIL',
        blockers: ['Receipt summary blocker.'],
      },
    },
  });

  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/june10-readiness-packet.json'), 'utf8')
  );
  assert.equal(report.status, 'FAIL');
  assert.ok(
    report.shipBlockers.some(
      item =>
        item.source === 'dbIdentity' &&
        item.message.includes('receiptEvidence.summary.passed is false')
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item =>
        item.source === 'dbIdentity' &&
        item.message.includes('receiptEvidence.summary.status is FAIL')
    )
  );
  assert.ok(
    report.artifactDetails.dbIdentity.blockers.items.some(item =>
      item.includes('receiptEvidence.summary: Receipt summary blocker.')
    )
  );
  assert.ok(report.executionQueue.some(item => item.source === 'dbIdentity'));
});

test('readiness packet blocks failing receipt evidence row and proof posture', () => {
  const root = makeRepo({ passing: true });
  writeJson(root, 'generated/truth/runtime-db-identity.json', {
    endpointStatus: 200,
    passed: true,
    receiptEvidence: {
      rows: [{ county: 'Benton', passed: false, blockers: ['Receipt row blocker.'] }],
      proofs: [{ county: 'Benton', status: 'FAIL', errors: ['Receipt proof error.'] }],
    },
  });

  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/june10-readiness-packet.json'), 'utf8')
  );
  assert.equal(report.status, 'FAIL');
  assert.ok(
    report.shipBlockers.some(
      item =>
        item.source === 'dbIdentity' &&
        item.message.includes('Benton receiptEvidence.row passed is false')
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item =>
        item.source === 'dbIdentity' &&
        item.message.includes('Benton receiptEvidence.proof status is FAIL')
    )
  );
  assert.ok(
    report.artifactDetails.dbIdentity.blockers.items.some(item =>
      item.includes('Benton: Receipt row blocker.')
    )
  );
  assert.ok(
    report.artifactDetails.dbIdentity.blockers.items.some(item =>
      item.includes('Benton receiptEvidence.proof.errors has 1 item')
    )
  );
});

test('readiness packet blocks object-shaped blocker error and failure collections', () => {
  const root = makeRepo({ passing: true });
  writeJson(root, 'generated/truth/runtime-db-identity.json', {
    endpointStatus: 200,
    passed: true,
    blockers: {
      top: 'Top blocker',
    },
    errors: {
      one: 'Top error',
      two: 'Top error',
    },
    failures: {
      one: 'Top failure',
    },
    summary: {
      blockers: {
        one: 'Summary blocker',
      },
      errors: {
        one: 'Summary error',
      },
    },
    rows: [
      {
        county: 'Benton',
        blockers: {
          one: 'Row blocker',
        },
        errors: {
          one: 'Row error',
        },
      },
    ],
    proofs: [
      {
        county: 'Benton',
        failures: {
          one: 'Proof failure',
        },
      },
    ],
  });

  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/june10-readiness-packet.json'), 'utf8')
  );
  assert.equal(report.status, 'FAIL');
  assert.ok(
    report.shipBlockers.some(
      item =>
        item.source === 'dbIdentity' && item.message.includes('artifact.errors has 2 object key')
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item =>
        item.source === 'dbIdentity' && item.message.includes('summary.errors has 1 object key')
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item =>
        item.source === 'dbIdentity' && item.message.includes('Benton row.errors has 1 object key')
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item =>
        item.source === 'dbIdentity' &&
        item.message.includes('Benton proof.failures has 1 object key')
    )
  );
  assert.ok(
    report.artifactDetails.dbIdentity.blockers.items.includes(
      'artifact.blockers has 1 object key(s)'
    )
  );
  assert.ok(
    report.artifactDetails.dbIdentity.blockers.items.includes(
      'summary.blockers has 1 object key(s)'
    )
  );
  assert.ok(
    report.artifactDetails.dbIdentity.blockers.items.includes('Benton.blockers has 1 object key(s)')
  );
});

test('readiness packet blocks scalar blocker error and failure fields', () => {
  const root = makeRepo({ passing: true });
  writeJson(root, 'generated/truth/runtime-db-identity.json', {
    endpointStatus: 200,
    passed: true,
    blocker: 'Top blocker.',
    blockers: 'Top blockers string.',
    error: 'Top error.',
    errors: 'Top errors string.',
    failure: 'Top failure.',
    failures: 'Top failures string.',
    summary: {
      blocker: 'Summary blocker.',
      error: 'Summary error.',
      failure: 'Summary failure.',
    },
    receiptEvidence: {
      blocker: 'Receipt blocker.',
      blockers: {
        one: 'Receipt blocker one.',
      },
      error: 'Receipt error.',
      failures: 'Receipt failure string.',
      status: 'FAIL',
    },
    rows: [
      {
        county: 'Benton',
        blocker: 'Row blocker.',
        error: 'Row error.',
        failure: 'Row failure.',
      },
    ],
    proofs: [
      {
        county: 'Benton',
        blockers: 'Proof blocker string.',
        errors: 'Proof error string.',
        failures: 'Proof failure string.',
      },
    ],
  });

  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/june10-readiness-packet.json'), 'utf8')
  );
  assert.equal(report.status, 'FAIL');
  assert.ok(
    report.shipBlockers.some(
      item => item.source === 'dbIdentity' && item.message === 'Top blocker.'
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item => item.source === 'dbIdentity' && item.message === 'Top blockers string.'
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item => item.source === 'dbIdentity' && item.message === 'Benton: Row blocker.'
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item => item.source === 'dbIdentity' && item.message === 'Benton: Proof blocker string.'
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item => item.source === 'dbIdentity' && item.message === 'receiptEvidence: Receipt blocker.'
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item =>
        item.source === 'dbIdentity' &&
        item.message.includes('receiptEvidence.blockers has 1 object key')
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item => item.source === 'dbIdentity' && item.message.includes('artifact.error is set')
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item => item.source === 'dbIdentity' && item.message.includes('artifact.errors is set')
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item => item.source === 'dbIdentity' && item.message.includes('summary.error is set')
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item => item.source === 'dbIdentity' && item.message.includes('receiptEvidence.error is set')
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item =>
        item.source === 'dbIdentity' && item.message.includes('receiptEvidence.status is FAIL')
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item => item.source === 'dbIdentity' && item.message.includes('Benton row.error is set')
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item => item.source === 'dbIdentity' && item.message.includes('Benton proof.failures is set')
    )
  );
  assert.ok(report.artifactDetails.dbIdentity.blockers.items.includes('Top blocker.'));
  assert.ok(report.artifactDetails.dbIdentity.blockers.items.includes('Top blockers string.'));
  assert.ok(report.artifactDetails.dbIdentity.blockers.items.includes('Summary blocker.'));
  assert.ok(
    report.artifactDetails.dbIdentity.blockers.items.includes('receiptEvidence: Receipt blocker.')
  );
  assert.ok(report.artifactDetails.dbIdentity.blockers.items.includes('Benton: Row blocker.'));
  assert.ok(
    report.artifactDetails.dbIdentity.blockers.items.includes('Benton: Proof blocker string.')
  );
  assert.ok(
    report.artifactDetails.dbIdentity.blockers.items.includes(
      'Artifact reports failed proof posture: artifact.error is set.'
    )
  );
  assert.ok(
    report.artifactDetails.dbIdentity.blockers.items.includes(
      'Artifact reports failed proof posture: Benton proof.failures is set.'
    )
  );
});

test('readiness packet blocks variant blocker and failure collection fields', () => {
  const root = makeRepo({ passing: true });
  writeJson(root, 'generated/truth/runtime-db-identity.json', {
    endpointStatus: 200,
    passed: true,
    ship_blockers: ['Variant ship blocker.'],
    Error_Count: 2,
    summary: {
      FailureCount: 3,
      blocker_count: 4,
    },
    rows: [
      {
        county: 'Benton',
        Blockers: ['Variant row blocker.'],
        Errors: ['Variant row error.'],
      },
    ],
    proofs: [
      {
        county: 'Benton',
        commands_failed: 5,
        artifact_failures: 6,
      },
    ],
  });

  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/june10-readiness-packet.json'), 'utf8')
  );
  assert.equal(report.status, 'FAIL');
  assert.ok(
    report.shipBlockers.some(
      item =>
        item.source === 'dbIdentity' &&
        item.message.includes('artifact.ship_blockers has 1 item(s)')
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item => item.source === 'dbIdentity' && item.message.includes('artifact.Error_Count is 2')
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item => item.source === 'dbIdentity' && item.message.includes('summary.FailureCount is 3')
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item => item.source === 'dbIdentity' && item.message.includes('summary.blocker_count is 4')
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item => item.source === 'dbIdentity' && item.message === 'Benton: Variant row blocker.'
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item =>
        item.source === 'dbIdentity' && item.message.includes('Benton row.Errors has 1 item(s)')
    )
  );
  assert.ok(
    report.shipBlockers.some(
      item =>
        item.source === 'dbIdentity' && item.message.includes('Benton proof.commands_failed is 5')
    )
  );
  assert.ok(
    report.artifactDetails.dbIdentity.blockers.items.includes('Benton: Variant row blocker.')
  );
});

test('readiness packet surfaces warning-only proof artifacts', () => {
  const root = makeRepo({ passing: true });
  writeJson(root, 'generated/truth/runtime-sale-qualification-lineage-proof.json', {
    status: 'PASS',
    summary: {
      candidatesChecked: 1,
      passed: 1,
      failed: 0,
      canonicalLandingBacked: 1,
      recommendationBackedCanonicalMissing: 0,
    },
    proofs: [
      {
        county: 'Benton',
        classification: 'canonical_landing_backed',
        canonicalSaleQualifications: 10,
        ratioStudyWindow: {
          decisionQualified: 5,
        },
        passed: true,
        warnings: ['Manual review still recommended before publication.'],
      },
    ],
  });

  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 0);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/june10-readiness-packet.json'), 'utf8')
  );
  assert.equal(report.status, 'PASS_WITH_WARNINGS');
  assert.ok(
    report.warnings.some(
      item =>
        item.source === 'saleQualification' &&
        item.message === 'Benton: Manual review still recommended before publication.'
    )
  );
  assert.ok(report.artifactDetails.saleQualification);
  assert.ok(
    report.artifactDetails.saleQualification.warnings.items.includes(
      'Benton: Manual review still recommended before publication.'
    )
  );
  const markdown = fs.readFileSync(
    path.join(root, 'generated/truth/june10-readiness-packet.md'),
    'utf8'
  );
  assert.match(
    markdown,
    /saleQualification: Benton: Manual review still recommended before publication\./
  );
});

test('readiness packet surfaces receipt evidence row and proof warnings', () => {
  const root = makeRepo({ passing: true });
  writeJson(root, 'generated/truth/runtime-db-identity.json', {
    endpointStatus: 200,
    passed: true,
    receiptEvidence: {
      rows: [
        {
          county: 'Benton',
          status: 'PASS_WITH_WARNINGS',
          warning: 'Receipt row warning.',
          summary: { status: 'PASS_WITH_WARNINGS', warningCount: 2 },
        },
      ],
      proofs: [
        {
          county: 'Benton',
          status: 'PASS_WITH_WARNINGS',
          warnings: ['Receipt proof warning.'],
          summary: { status: 'PASS_WITH_WARNINGS', warning: 'Receipt proof summary warning.' },
        },
      ],
    },
  });

  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 0);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/june10-readiness-packet.json'), 'utf8')
  );
  assert.equal(report.status, 'PASS_WITH_WARNINGS');
  assert.ok(
    report.warnings.some(
      item => item.source === 'dbIdentity' && item.message.includes('Receipt row warning.')
    )
  );
  assert.ok(
    report.warnings.some(
      item => item.source === 'dbIdentity' && item.message.includes('Receipt proof warning.')
    )
  );
  assert.ok(
    report.artifactDetails.dbIdentity.warnings.items.some(item =>
      item.includes('Benton: receiptEvidence proof summary status is PASS_WITH_WARNINGS')
    )
  );
});

test('readiness packet surfaces scalar and object-shaped warning fields', () => {
  const root = makeRepo({ passing: true });
  writeJson(root, 'generated/truth/runtime-db-identity.json', {
    endpointStatus: 200,
    passed: true,
    warning: 'Top warning.',
    warnings: {
      one: 'Top warning one.',
      two: 'Top warning two.',
    },
    summary: {
      status: 'PASS_WITH_WARNINGS',
      warning: 'Summary warning.',
      warnings: 'Summary warning string.',
    },
    receiptEvidence: {
      status: 'PASS_WITH_WARNINGS',
      warning: 'Receipt warning.',
      warnings: {
        one: 'Receipt warning one.',
      },
      summary: {
        status: 'PASS_WITH_WARNINGS',
        warning: 'Receipt summary warning.',
      },
    },
    rows: [
      {
        county: 'Benton',
        status: 'PASS_WITH_WARNINGS',
        warning: 'Row warning.',
        warnings: 'Row warning string.',
        summary: {
          status: 'PASS_WITH_WARNINGS',
          warning: 'Row summary warning.',
        },
      },
    ],
    proofs: [
      {
        county: 'Benton',
        status: 'PASS_WITH_WARNINGS',
        warning: 'Proof warning.',
        warnings: {
          one: 'Proof warning one.',
        },
        summary: {
          status: 'PASS_WITH_WARNINGS',
          warning: 'Proof summary warning.',
        },
      },
    ],
    blockers: [],
  });

  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 0);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/june10-readiness-packet.json'), 'utf8')
  );
  assert.equal(report.status, 'PASS_WITH_WARNINGS');
  assert.ok(
    report.warnings.some(item => item.source === 'dbIdentity' && item.message === 'Top warning.')
  );
  assert.ok(
    report.warnings.some(
      item =>
        item.source === 'dbIdentity' && item.message === 'Artifact.warnings has 2 object key(s).'
    )
  );
  assert.ok(
    report.warnings.some(
      item => item.source === 'dbIdentity' && item.message === 'Summary warning.'
    )
  );
  assert.ok(
    report.warnings.some(
      item =>
        item.source === 'dbIdentity' &&
        item.message === 'Artifact summary status is PASS_WITH_WARNINGS.'
    )
  );
  assert.ok(
    report.warnings.some(
      item => item.source === 'dbIdentity' && item.message === 'Summary warning string.'
    )
  );
  assert.ok(
    report.warnings.some(
      item => item.source === 'dbIdentity' && item.message === 'Receipt warning.'
    )
  );
  assert.ok(
    report.warnings.some(
      item =>
        item.source === 'dbIdentity' &&
        item.message === 'receiptEvidence status is PASS_WITH_WARNINGS.'
    )
  );
  assert.ok(
    report.warnings.some(
      item =>
        item.source === 'dbIdentity' &&
        item.message === 'receiptEvidence.warnings has 1 object key(s).'
    )
  );
  assert.ok(
    report.warnings.some(
      item => item.source === 'dbIdentity' && item.message === 'Receipt summary warning.'
    )
  );
  assert.ok(
    report.warnings.some(
      item =>
        item.source === 'dbIdentity' &&
        item.message === 'receiptEvidence summary status is PASS_WITH_WARNINGS.'
    )
  );
  assert.ok(
    report.warnings.some(
      item => item.source === 'dbIdentity' && item.message === 'Benton: Row warning.'
    )
  );
  assert.ok(
    report.warnings.some(
      item =>
        item.source === 'dbIdentity' && item.message === 'Benton: row status is PASS_WITH_WARNINGS.'
    )
  );
  assert.ok(
    report.warnings.some(
      item => item.source === 'dbIdentity' && item.message === 'Benton: Row warning string.'
    )
  );
  assert.ok(
    report.warnings.some(
      item => item.source === 'dbIdentity' && item.message === 'Benton: Row summary warning.'
    )
  );
  assert.ok(
    report.warnings.some(
      item => item.source === 'dbIdentity' && item.message === 'Benton: Proof warning.'
    )
  );
  assert.ok(
    report.warnings.some(
      item =>
        item.source === 'dbIdentity' &&
        item.message === 'Benton: proof status is PASS_WITH_WARNINGS.'
    )
  );
  assert.ok(
    report.warnings.some(
      item =>
        item.source === 'dbIdentity' &&
        item.message === 'Benton: proof.warnings has 1 object key(s).'
    )
  );
  assert.ok(
    report.warnings.some(
      item => item.source === 'dbIdentity' && item.message === 'Benton: Proof summary warning.'
    )
  );
  assert.ok(report.artifactDetails.dbIdentity.warnings.items.includes('Top warning.'));
  assert.ok(report.artifactDetails.dbIdentity.warnings.items.includes('Receipt warning.'));
  assert.ok(
    report.artifactDetails.dbIdentity.warnings.items.includes(
      'Artifact.warnings has 2 object key(s).'
    )
  );
  assert.ok(report.artifactDetails.dbIdentity.warnings.items.includes('Benton: Row warning.'));
  assert.ok(
    report.artifactDetails.dbIdentity.warnings.items.includes(
      'Benton: proof.warnings has 1 object key(s).'
    )
  );
});

test('readiness packet preserves PASS_WITH_WARNINGS from artifact status', () => {
  const root = makeRepo({ passing: true });
  writeJson(root, 'generated/truth/runtime-db-identity.json', {
    status: 'PASS_WITH_WARNINGS',
    endpointStatus: 200,
    passed: true,
    blockers: [],
  });

  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 0);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/june10-readiness-packet.json'), 'utf8')
  );
  assert.equal(report.status, 'PASS_WITH_WARNINGS');
  assert.ok(
    report.warnings.some(
      item =>
        item.source === 'dbIdentity' && item.message === 'Artifact status is PASS_WITH_WARNINGS.'
    )
  );
  assert.ok(
    report.artifactDetails.dbIdentity.warnings.items.includes(
      'Artifact status is PASS_WITH_WARNINGS.'
    )
  );
  const markdown = fs.readFileSync(
    path.join(root, 'generated/truth/june10-readiness-packet.md'),
    'utf8'
  );
  assert.match(markdown, /dbIdentity: Artifact status is PASS_WITH_WARNINGS\./);
});

test('readiness packet preserves numeric warning counts from artifacts', () => {
  const root = makeRepo({ passing: true });
  writeJson(root, 'generated/truth/runtime-db-identity.json', {
    endpointStatus: 200,
    passed: true,
    warningCount: 2,
    summary: {
      warningCount: 1,
    },
    rows: [
      {
        county: 'Benton',
        warningCount: 3,
      },
    ],
    proofs: [
      {
        county: 'Benton',
        warningCount: 4,
        summary: {
          warningCount: 5,
        },
      },
    ],
    blockers: [],
  });

  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 0);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/june10-readiness-packet.json'), 'utf8')
  );
  assert.equal(report.status, 'PASS_WITH_WARNINGS');
  assert.ok(
    report.warnings.some(
      item => item.source === 'dbIdentity' && item.message === 'Artifact warningCount is 2.'
    )
  );
  assert.ok(
    report.warnings.some(
      item => item.source === 'dbIdentity' && item.message === 'Artifact summary.warningCount is 1.'
    )
  );
  assert.ok(
    report.warnings.some(
      item => item.source === 'dbIdentity' && item.message === 'Benton: row warningCount is 3.'
    )
  );
  assert.ok(
    report.warnings.some(
      item => item.source === 'dbIdentity' && item.message === 'Benton: proof warningCount is 4.'
    )
  );
  assert.ok(
    report.warnings.some(
      item =>
        item.source === 'dbIdentity' && item.message === 'Benton: proof summary.warningCount is 5.'
    )
  );
  assert.ok(
    report.artifactDetails.dbIdentity.warnings.items.includes('Artifact warningCount is 2.')
  );
  assert.ok(
    report.artifactDetails.dbIdentity.warnings.items.includes('Artifact summary.warningCount is 1.')
  );
  assert.ok(
    report.artifactDetails.dbIdentity.warnings.items.includes('Benton: row warningCount is 3.')
  );
  assert.ok(
    report.artifactDetails.dbIdentity.warnings.items.includes('Benton: proof warningCount is 4.')
  );
  assert.ok(
    report.artifactDetails.dbIdentity.warnings.items.includes(
      'Benton: proof summary.warningCount is 5.'
    )
  );
  const markdown = fs.readFileSync(
    path.join(root, 'generated/truth/june10-readiness-packet.md'),
    'utf8'
  );
  assert.match(markdown, /dbIdentity: Artifact warningCount is 2\./);
  assert.match(markdown, /dbIdentity: Artifact summary\.warningCount is 1\./);
  assert.match(markdown, /dbIdentity: Benton: row warningCount is 3\./);
  assert.match(markdown, /dbIdentity: Benton: proof warningCount is 4\./);
  assert.match(markdown, /dbIdentity: Benton: proof summary\.warningCount is 5\./);
});

test('readiness packet blocks candidate set that promotes another county', () => {
  const root = makeRepo({ passing: true });
  writeJson(root, 'generated/truth/runtime-candidate-set.json', {
    summary: {
      june10RuntimeScope: 'runtime_scope_requires_review',
      prohibit39CountyRuntimeClaim: true,
      runtimeProven: 1,
      evidenceBackedLoadCandidates: 1,
      shipBlockers: 0,
    },
    rows: [
      {
        county: 'Pacific',
        blockers: ['County has inventory evidence but is not registered in runtime.'],
      },
    ],
  });

  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/june10-readiness-packet.json'), 'utf8')
  );
  assert.equal(report.status, 'FAIL');
  assert.equal(report.summary.countyScope.runtimeCandidateSetPassed, false);
  assert.ok(report.shipBlockers.some(item => item.source === 'runtimeCandidateSet'));
  assert.ok(report.executionQueue.some(item => item.source === 'runtimeCandidateSet'));
});

test('readiness packet blocks crosswalk and candidate set runtime count disagreement', () => {
  const root = makeRepo({ passing: true });
  writeJson(root, 'generated/truth/washington-39-county-data-crosswalk.json', {
    summary: {
      countiesChecked: 39,
      runtimeProven: 2,
      publicSourceSeed: 12,
      provenanceInventoryOnly: 26,
      prohibit39CountyRuntimeClaim: true,
    },
  });

  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/june10-readiness-packet.json'), 'utf8')
  );
  assert.equal(report.status, 'FAIL');
  assert.ok(report.shipBlockers.some(item => item.source === 'crosswalk'));
  assert.ok(
    report.shipBlockers.some(item => item.message.includes('does not match runtime candidate set'))
  );
});

test('readiness packet blocks candidate set and county runtime contract count disagreement', () => {
  const root = makeRepo({ passing: true });
  writeJson(root, 'generated/truth/county-runtime-contract.json', {
    passed: true,
    summary: {
      runtimeContractPass: 2,
      runtimeContractBlocked: 37,
      prohibit39CountyRuntimeClaim: true,
    },
  });

  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/june10-readiness-packet.json'), 'utf8')
  );
  assert.equal(report.status, 'FAIL');
  assert.ok(report.shipBlockers.some(item => item.source === 'countyRuntimeContract'));
  assert.ok(
    report.shipBlockers.some(item => item.message.includes('does not match runtime candidate set'))
  );
});

test('readiness packet blocks county runtime contract without 39-county claim prohibition', () => {
  const root = makeRepo({ passing: true });
  writeJson(root, 'generated/truth/county-runtime-contract.json', {
    passed: true,
    summary: {
      runtimeContractPass: 1,
      runtimeContractBlocked: 38,
      prohibit39CountyRuntimeClaim: false,
    },
  });

  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/june10-readiness-packet.json'), 'utf8')
  );
  assert.equal(report.status, 'FAIL');
  assert.ok(report.shipBlockers.some(item => item.source === 'countyRuntimeContract'));
  assert.ok(
    report.shipBlockers.some(item =>
      item.message.includes('does not explicitly prohibit 39-county runtime claim')
    )
  );
});

test('readiness packet blocks source lineage artifact with no checked candidates', () => {
  const root = makeRepo({ passing: true });
  writeJson(root, 'generated/truth/runtime-row-source-lineage-proof.json', {
    summary: {
      candidatesChecked: 0,
      passed: 0,
      failed: 0,
    },
    proofs: [],
  });

  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/june10-readiness-packet.json'), 'utf8')
  );
  assert.equal(report.status, 'FAIL');
  assert.equal(report.summary.terraFusionDb.sourceLineagePassed, false);
  assert.ok(report.shipBlockers.some(item => item.source === 'sourceLineage'));
  assert.ok(report.executionQueue.some(item => item.source === 'sourceLineage'));
});

test('readiness packet blocks runtime row path proof that passes a non-Benton county', () => {
  const root = makeRepo({ passing: true });
  writeJson(root, 'generated/truth/runtime-row-path-proof.json', {
    summary: {
      candidatesChecked: 1,
      passed: 1,
      failed: 0,
      silentBentonFallbacks: 0,
      zeroRowRuntimeResponses: 0,
      runtimeDbIdentityPassed: true,
    },
    proofs: [
      {
        county: 'Pacific',
        passed: true,
      },
    ],
  });

  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/june10-readiness-packet.json'), 'utf8')
  );
  assert.equal(report.status, 'FAIL');
  assert.equal(report.summary.terraFusionDb.runtimeRowPathPassed, false);
  assert.ok(report.shipBlockers.some(item => item.source === 'runtimeRowPath'));
  assert.ok(report.shipBlockers.some(item => item.message.includes('not passing for Benton only')));
});

test('readiness packet blocks source lineage proof that passes a non-Benton county', () => {
  const root = makeRepo({ passing: true });
  writeJson(root, 'generated/truth/runtime-row-source-lineage-proof.json', {
    summary: {
      candidatesChecked: 1,
      passed: 1,
      failed: 0,
    },
    proofs: [
      {
        county: 'Pacific',
        passed: true,
      },
    ],
  });

  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/june10-readiness-packet.json'), 'utf8')
  );
  assert.equal(report.status, 'FAIL');
  assert.equal(report.summary.terraFusionDb.sourceLineagePassed, false);
  assert.ok(report.shipBlockers.some(item => item.source === 'sourceLineage'));
  assert.ok(report.shipBlockers.some(item => item.message.includes('not passing for Benton only')));
});

test('readiness packet blocks sale qualification proof that passes a non-Benton county', () => {
  const root = makeRepo({ passing: true });
  writeJson(root, 'generated/truth/runtime-sale-qualification-lineage-proof.json', {
    status: 'PASS',
    summary: {
      candidatesChecked: 1,
      passed: 1,
      failed: 0,
      canonicalLandingBacked: 1,
      recommendationBackedCanonicalMissing: 0,
    },
    proofs: [
      {
        county: 'Pacific',
        classification: 'canonical_landing_backed',
        passed: true,
      },
    ],
  });

  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/june10-readiness-packet.json'), 'utf8')
  );
  assert.equal(report.status, 'FAIL');
  assert.equal(report.summary.bentonPilot.saleQualificationCanonicalBacked, false);
  assert.ok(report.shipBlockers.some(item => item.source === 'saleQualification'));
  assert.ok(
    report.shipBlockers.some(item =>
      item.message.includes('Benton canonical sale qualification lineage')
    )
  );
});

test('readiness packet blocks pilot closure status without Benton proof detail', () => {
  const root = makeRepo({ passing: true });
  writeJson(root, 'generated/truth/benton-runtime-pilot-closure.json', {
    status: 'PASS',
  });

  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/june10-readiness-packet.json'), 'utf8')
  );
  assert.equal(report.status, 'FAIL');
  assert.equal(report.summary.bentonPilot.pilotClosureProofDetailPassed, false);
  assert.ok(report.shipBlockers.some(item => item.source === 'bentonPilotClosure'));
  assert.ok(
    report.shipBlockers.some(item =>
      item.message.includes('does not prove canonical sale qualification and Benton-only scope')
    )
  );
});
