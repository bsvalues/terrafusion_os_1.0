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
    status: 'DRY_RUN',
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
        item.message.includes('top-level status is DRY_RUN')
    )
  );
  assert.ok(report.executionQueue.some(item => item.source === 'runtimeCandidateSet'));
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
