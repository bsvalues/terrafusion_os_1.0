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
      ? []
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
      ? []
      : [
          {
            county: 'Benton',
            blockers: ['Runtime lineage endpoint did not return 200. Status: 500'],
          },
        ],
  });
  writeJson(root, `${truth}/runtime-sale-qualification-lineage-proof.json`, {
    status: passing ? 'PASS' : 'FAIL',
  });
  writeJson(root, `${truth}/benton-runtime-pilot-closure.json`, {
    status: passing ? 'PASS' : 'FAIL',
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
  assert.ok(report.shipBlockers.some(item => item.source === 'dbIdentity'));
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
  assert.deepEqual(
    report.postDbRefreshRerunChecklist.map(item => item.command),
    [
      'pnpm run truth:runtime-db-identity',
      'pnpm run truth:runtime-db-content',
      'pnpm run truth:runtime-row-path-proof',
      'pnpm run truth:terrafusion-db-product-load-ledger',
      'pnpm run truth:benton-parcel-count-sanity',
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
  assert.equal(report.summary.terraFusionDb.liveRuntimeReachability, 'api_reachable');
  assert.equal(report.summary.terraFusionDb.dbIdentityEndpointStatus, 200);
  assert.equal(report.summary.terraFusionDb.runtimeRowPathPassed, true);
  assert.equal(report.summary.terraFusionDb.sourceLineagePassed, true);
  assert.equal(report.shipBlockers.length, 0);
  assert.deepEqual(report.executionQueue, []);
  assert.equal(report.postDbRefreshRerunChecklist.length, 9);
  assert.equal(report.artifactDetails.dbIdentity, undefined);
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
