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
  assert.equal(report.receiptEvidence.exists, false);
  assert.ok(report.receiptEvidence.blockers.some(blocker => blocker.includes('fixture')));
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
  assert.equal(report.receiptEvidence.exists, false);
});

test('product load ledger resolves table-scoped product load receipts from receipt evidence', async () => {
  const root = makeTempRepo('tf-product-ledger-receipt-');
  const fixturePath = writeFixture(root, {
    database: { container: 'fixture', database: 'terrafusion', user: 'postgres' },
    productLoadReceipts: [
      {
        targetTableName: 'ComparableSales',
        completedAtUtc: '2026-05-01T12:00:00.000Z',
      },
      {
        targetTableName: 'Properties',
        completedAtUtc: '2026-05-02T12:00:00.000Z',
      },
    ],
    rows: [
      {
        tableName: 'Properties',
        productDomain: 'parcel',
        rowCount: 89447,
        latestProductUpdatedAt: '2026-04-28T05:27:22.933Z',
        latestSourceSyncAt: '2026-04-17T01:43:32.918Z',
        latestEtlCompletedAt: '2026-04-19T04:18:21.199Z',
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
  assert.equal(report.rows[0].latestProductLoadReceiptAt, '2026-05-02T12:00:00.000Z');
  assert.equal(report.rows[0].lineageStatus, 'lineage_proven');
  assert.equal(report.receiptEvidence.exists, true);
  assert.equal(report.receiptEvidence.rowCount, 2);
  assert.equal(report.receiptEvidence.tableIdentityColumn, 'TargetTableName');
});

test('product load ledger accepts sync_bridge load batches as TerraFusion DB receipt evidence', async () => {
  const root = makeTempRepo('tf-product-ledger-sync-batch-');
  const fixturePath = writeFixture(root, {
    database: { container: 'fixture', database: 'terrafusion', user: 'postgres' },
    syncBridgeLoadBatches: [
      {
        sourceSystem: 'canonical-tf-parcel-projector',
        status: 'COMPLETED',
        completedAt: '2026-05-20T16:22:24.631Z',
        rowsPromoted: 582869,
      },
    ],
    rows: [
      {
        tableName: 'canonical_tf.tf_parcel',
        productDomain: 'parcel',
        rowCount: 582869,
        latestProductUpdatedAt: '2026-05-20T16:22:24.631Z',
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
  assert.equal(report.rows[0].latestProductLoadReceiptAt, '2026-05-20T16:22:24.631Z');
  assert.equal(report.rows[0].lineageStatus, 'lineage_proven');
  assert.equal(report.receiptEvidence.exists, true);
  assert.equal(report.receiptEvidence.evidenceSource, 'sync_bridge.load_batch');
  assert.equal(report.receiptEvidence.productLoadReceiptsTableExists, false);
  assert.equal(report.receiptEvidence.syncBridgeLoadBatchEvidence.exists, true);
});

test('product load ledger proves canonical land and improvement seeds from sync_bridge batches', async () => {
  const root = makeTempRepo('tf-product-ledger-canonical-land-improvement-');
  const fixturePath = writeFixture(root, {
    database: { container: 'fixture', database: 'terrafusion', user: 'postgres' },
    syncBridgeLoadBatches: [
      {
        sourceSystem: 'canonical-tf-land-projector',
        status: 'COMPLETED',
        completedAt: '2026-05-15T23:34:24.216Z',
        rowsPromoted: 2153,
      },
      {
        sourceSystem: 'canonical-tf-imprv-projector',
        status: 'COMPLETED',
        completedAt: '2026-05-20T16:35:44.628Z',
        rowsPromoted: 1105,
      },
    ],
    rows: [
      {
        tableName: 'canonical_tf.tf_land',
        productDomain: 'costforge',
        rowCount: 2153,
        latestProductUpdatedAt: '2026-05-15T23:34:24.216Z',
      },
      {
        tableName: 'canonical_tf.tf_improvement',
        productDomain: 'costforge',
        rowCount: 1105,
        latestProductUpdatedAt: '2026-05-20T16:35:44.628Z',
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

  const land = report.rows.find(row => row.tableName === 'canonical_tf.tf_land');
  const improvement = report.rows.find(row => row.tableName === 'canonical_tf.tf_improvement');

  assert.equal(report.passed, true);
  assert.equal(land.latestProductLoadReceiptAt, '2026-05-15T23:34:24.216Z');
  assert.equal(land.lineageStatus, 'lineage_proven');
  assert.equal(improvement.latestProductLoadReceiptAt, '2026-05-20T16:35:44.628Z');
  assert.equal(improvement.lineageStatus, 'lineage_proven');
});

test('product load ledger does not treat unrelated sync_bridge batches as table lineage', async () => {
  const root = makeTempRepo('tf-product-ledger-sync-batch-unrelated-');
  const fixturePath = writeFixture(root, {
    database: { container: 'fixture', database: 'terrafusion', user: 'postgres' },
    syncBridgeLoadBatches: [
      {
        sourceSystem: 'canonical-tf-owner-projector',
        status: 'COMPLETED',
        completedAt: '2026-05-20T16:22:24.631Z',
        rowsPromoted: 10,
      },
    ],
    rows: [
      {
        tableName: 'canonical_tf.tf_parcel',
        productDomain: 'parcel',
        rowCount: 582869,
        latestProductUpdatedAt: '2026-05-20T16:22:24.631Z',
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
  assert.equal(report.rows[0].latestProductLoadReceiptAt, null);
  assert.equal(report.rows[0].lineageStatus, 'rows_exist_lineage_unproven');
});

test('product load ledger allows empty operational state tables without product-load receipts', async () => {
  const root = makeTempRepo('tf-product-ledger-operational-empty-');
  const fixturePath = writeFixture(root, {
    database: { container: 'fixture', database: 'terrafusion', user: 'postgres' },
    rows: [
      {
        tableName: 'CountyDownstreamClosureReceipts',
        productDomain: 'dais',
        rowCount: 0,
      },
      {
        tableName: 'CountyApplyHandoffReceipts',
        productDomain: 'dossier',
        rowCount: 0,
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
  assert.equal(report.summary.operationalStateTables, 2);
  assert.equal(report.summary.operationalStateAllowed, 2);
  assert.equal(report.rows[0].loadRequirement, 'operational_state');
  assert.equal(report.rows[0].lineageStatus, 'operational_empty_allowed');
  assert.deepEqual(report.rows[0].blockers, []);
});

test('product load ledger does not require product-load receipts for user-generated operational rows', async () => {
  const root = makeTempRepo('tf-product-ledger-operational-present-');
  const fixturePath = writeFixture(root, {
    database: { container: 'fixture', database: 'terrafusion', user: 'postgres' },
    rows: [
      {
        tableName: 'DossierPackets',
        productDomain: 'dossier',
        rowCount: 2,
        latestProductUpdatedAt: '2026-05-17T22:56:16.504Z',
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
  assert.equal(report.rows[0].loadRequirement, 'operational_state');
  assert.equal(report.rows[0].lineageStatus, 'operational_state_present');
  assert.deepEqual(report.rows[0].blockers, []);
  assert.ok(report.rows[0].warnings.some(warning => warning.includes('operational state')));
});
