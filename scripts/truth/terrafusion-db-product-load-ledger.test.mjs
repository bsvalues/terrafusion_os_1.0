#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

const scriptPath = path.resolve('scripts/truth/terrafusion-db-product-load-ledger.mjs');
const execFileAsync = promisify(execFile);

function makeTempRepo(prefix) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  fs.mkdirSync(path.join(root, 'generated', 'truth'), { recursive: true });
  return root;
}

function writeFixture(root, fixture) {
  const filePath = path.join(root, 'fixture.json');
  fs.writeFileSync(filePath, `${JSON.stringify(fixture, null, 2)}\n`);
  return filePath;
}

test('product load ledger fails when rows exist without a product load receipt', async () => {
  const root = makeTempRepo('tf-product-ledger-fail-');
  const fixturePath = writeFixture(root, {
    database: { container: 'fixture', database: 'terrafusion', user: 'postgres' },
    globalEtlCompletedAt: '2026-04-19T04:18:21.199Z',
    rows: [
      {
        tableName: 'Properties',
        productDomain: 'parcel',
        rowCount: 128788,
        latestProductUpdatedAt: '2026-04-28T05:27:22.933Z',
        latestSourceSyncAt: '2026-04-17T01:43:32.918Z',
        latestEtlCompletedAt: '2026-04-19T04:18:21.199Z',
        latestProductLoadReceiptAt: null,
      },
    ],
  });

  await execFileAsync('node', [scriptPath, root], {
    cwd: process.cwd(),
    env: { ...process.env, TF_PRODUCT_LOAD_LEDGER_FIXTURE: fixturePath },
  }).catch(error => {
    assert.equal(error.code, 1);
  });

  const report = JSON.parse(
    fs.readFileSync(
      path.join(root, 'generated', 'truth', 'terrafusion-db-product-load-ledger.json'),
      'utf8'
    )
  );

  assert.equal(report.passed, false);
  assert.equal(report.summary.rowsExistLineageUnproven, 1);
  assert.equal(report.rows[0].lineageStatus, 'rows_exist_lineage_unproven');
  assert.match(report.rows[0].blockers[0], /no product load receipt/i);
});

test('product load ledger passes when rows have a product load receipt', async () => {
  const root = makeTempRepo('tf-product-ledger-pass-');
  const fixturePath = writeFixture(root, {
    database: { container: 'fixture', database: 'terrafusion', user: 'postgres' },
    rows: [
      {
        tableName: 'Properties',
        productDomain: 'parcel',
        rowCount: 89447,
        latestProductUpdatedAt: '2026-04-28T05:27:22.933Z',
        latestSourceSyncAt: '2026-04-17T01:43:32.918Z',
        latestEtlCompletedAt: '2026-04-19T04:18:21.199Z',
        latestProductLoadReceiptAt: '2026-04-28T05:27:30.000Z',
      },
    ],
  });

  await execFileAsync('node', [scriptPath, root], {
    cwd: process.cwd(),
    env: { ...process.env, TF_PRODUCT_LOAD_LEDGER_FIXTURE: fixturePath },
  });

  const report = JSON.parse(
    fs.readFileSync(
      path.join(root, 'generated', 'truth', 'terrafusion-db-product-load-ledger.json'),
      'utf8'
    )
  );

  assert.equal(report.passed, true);
  assert.equal(report.summary.lineageProven, 1);
  assert.equal(report.rows[0].lineageStatus, 'lineage_proven');
});
