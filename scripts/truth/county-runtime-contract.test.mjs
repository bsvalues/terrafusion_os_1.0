#!/usr/bin/env node

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const scriptPath = path.resolve('scripts/truth/county-runtime-contract.mjs');

function writeJson(root, relativePath, value) {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `${JSON.stringify(value, null, 2)}\n`);
}

function makeRepo({ runtimeProven = true } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tf-county-contract-'));
  const truthDir = 'generated/truth';

  writeJson(root, `${truthDir}/washington-39-county-data-crosswalk.json`, {
    rows: [
      {
        county: 'Benton',
        registryStatus: 'adapter-ready',
        classification: runtimeProven ? 'runtime_proven' : 'public_source_seed',
        runtimeClass: runtimeProven ? 'runtime_proven' : 'unknown',
        runtimeRows: runtimeProven ? 42 : 0,
      },
      {
        county: 'Yakima',
        registryStatus: 'adapter-ready',
        classification: 'provenance_inventory_only',
        runtimeClass: 'unknown',
        runtimeRows: 0,
      },
    ],
  });

  writeJson(root, `${truthDir}/county-runtime-registration-ledger.json`, {
    rows: [
      {
        county: 'Benton',
        readinessClass: runtimeProven ? 'runtime_proven' : 'not_registered',
        runtimeRows: runtimeProven ? 42 : 0,
        selectedCountyEchoed: runtimeProven,
        silentBentonFallbackDetected: false,
      },
    ],
  });

  writeJson(root, `${truthDir}/runtime-db-identity.json`, {
    passed: true,
  });

  writeJson(root, `${truthDir}/terrafusion-db-product-load-ledger.json`, {
    rows: [
      {
        tableName: 'Properties',
        productDomain: 'parcel',
        rowCount: 42,
        lineageStatus: 'lineage_proven',
        blockers: [],
      },
      {
        tableName: 'ComparableSales',
        productDomain: 'sales',
        rowCount: 12,
        lineageStatus: 'lineage_proven',
        blockers: [],
      },
      {
        tableName: 'CanonicalSaleQualifications',
        productDomain: 'qualified_sales',
        rowCount: 8,
        lineageStatus: 'lineage_proven',
        blockers: [],
      },
    ],
  });

  writeJson(root, `${truthDir}/benton-parcel-count-sanity.json`, {
    passed: true,
  });

  return root;
}

test('passes a county only when runtime identity, receipts, rows, and parcel sanity are proven', () => {
  const root = makeRepo();

  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);

  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/county-runtime-contract.json'), 'utf8')
  );
  const benton = report.rows.find(row => row.county === 'Benton');
  const yakima = report.rows.find(row => row.county === 'Yakima');

  assert.equal(benton.status, 'runtime_contract_pass');
  assert.equal(yakima.status, 'runtime_contract_blocked');
  assert.equal(report.summary.runtimeContractPass, 1);
  assert.equal(report.summary.prohibit39CountyRuntimeClaim, true);
});

test('blocks a county when runtime rows and county identity are not proven', () => {
  const root = makeRepo({ runtimeProven: false });

  const result = spawnSync('node', [scriptPath, root], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  assert.match(result.stdout, /runtimeContractBlocked/);

  const report = JSON.parse(
    fs.readFileSync(path.join(root, 'generated/truth/county-runtime-contract.json'), 'utf8')
  );
  const benton = report.rows.find(row => row.county === 'Benton');
  assert.equal(benton.status, 'runtime_contract_blocked');
  assert.ok(benton.blockers.some(blocker => blocker.includes('County runtime class')));
});
