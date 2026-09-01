import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import XLSX from 'xlsx';

import {
  assertRuntimeCompatibleCountyDetail,
  assertRuntimeCompatibleCountyShard,
} from '../ci/package_washington_launch_data.mjs';

XLSX.set_fs(fs);

const GENERATED_AT = '2026-08-26T17:48:16.000Z';
const SCRIPT_PATH = resolve('scripts/ingestion/kitsap_public_sales.mjs');

function fixtureRow(overrides = {}) {
  return {
    'REET no.': '2026EX00001',
    'Sale Dt': new Date('2026-07-15T00:00:00.000Z'),
    Yr: 2026,
    Price: 450_000,
    Validity: 'Valid sale',
    'Tax parcel no.': '1234-000-001-0001',
    LRSN: 123,
    Nbrhd: '7400207',
    'Neighborhood name': 'Gunderson',
    'Sec-Twn-Rg-Qtr': '31-26N-2E-NE',
    Class: '111',
    Acres: 0.2,
    'Property address': '100 Public Record Way',
    WF: 'No',
    View: '',
    '# Dwellings': 1,
    'Main dwelling': 'Single family',
    'Yr blt': 1999,
    Condition: 'AV',
    'Living area': 1800,
    ...overrides,
  };
}

async function createFixtureWorkbook(path) {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([
      fixtureRow(),
      fixtureRow({
        'REET no.': '2026EX00002',
        'Tax parcel no.': '1234-000-001-0002',
        Validity: 'With other property',
      }),
    ]),
    'Dwellings'
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([
      fixtureRow({
        'REET no.': '2026EX00003',
        'Tax parcel no.': '1234-000-001-0003',
        '# Dwellings': null,
        'Main dwelling': null,
        'Yr blt': null,
        Condition: null,
        'Living area': null,
      }),
    ]),
    'Vacant land'
  );
  XLSX.writeFile(workbook, path);
}

test('Kitsap adapter stages only valid official rows with county-scoped public provenance', async () => {
  const root = await mkdtemp(join(tmpdir(), 'tf-kitsap-adapter-'));
  try {
    const workbookPath = join(root, 'Residential_Sales_2021-2026.xlsx');
    const outputPath = join(root, 'launch-data', 'washington');
    await createFixtureWorkbook(workbookPath);
    const workbookBytes = await readFile(workbookPath);
    const workbookSha256 = createHash('sha256').update(workbookBytes).digest('hex');

    const result = spawnSync(
      process.execPath,
      [SCRIPT_PATH, workbookPath, workbookSha256, outputPath, GENERATED_AT],
      { encoding: 'utf8' }
    );
    assert.equal(result.status, 0, result.stderr);

    const manifest = JSON.parse(await readFile(join(outputPath, 'manifest.json'), 'utf8'));
    const status = JSON.parse(await readFile(join(outputPath, 'counties/status.json'), 'utf8'));
    const detail = JSON.parse(await readFile(join(outputPath, 'counties/035.json'), 'utf8'));
    const shard = JSON.parse(await readFile(join(outputPath, 'sales/by-county/035.json'), 'utf8'));
    const receipt = JSON.parse(
      await readFile(join(outputPath, 'receipts/kitsap-source.json'), 'utf8')
    );

    assert.equal(status.counties.length, 1);
    assert.equal(status.counties[0].countyCode, '035');
    assert.equal(status.counties[0].candidateSales, 3);
    assert.equal(status.counties[0].stagedSales, 2);
    assert.equal(status.counties[0].needsReview, 1);
    assert.equal(shard.records.length, 2);
    assert.equal(shard.records[0].countyCode, '035');
    assert.equal(shard.records[0].grantor, null);
    assert.equal(shard.records[0].grantee, null);
    assert.equal(shard.records[0].provenance.sourcePayloadSha256, workbookSha256);
    assert.equal(receipt.omittedFields.includes('owner'), true);
    assert.equal(receipt.quarantinedSales, 1);
    assert.equal(manifest.salesShardAttestations[0].countyCode, '035');
    assert.equal(manifest.salesShardAttestations[0].sourcePayloadSha256[0], workbookSha256);
    assert.doesNotThrow(() => {
      assertRuntimeCompatibleCountyShard(shard, '035', 'Kitsap');
      assertRuntimeCompatibleCountyDetail(detail, status.counties[0], GENERATED_AT);
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('Kitsap adapter fails closed when the official workbook digest changes', async () => {
  const root = await mkdtemp(join(tmpdir(), 'tf-kitsap-digest-'));
  try {
    const workbookPath = join(root, 'Residential_Sales_2021-2026.xlsx');
    await createFixtureWorkbook(workbookPath);
    const result = spawnSync(
      process.execPath,
      [SCRIPT_PATH, workbookPath, '0'.repeat(64), join(root, 'output'), GENERATED_AT],
      { encoding: 'utf8' }
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /does not match its expected SHA-256/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
