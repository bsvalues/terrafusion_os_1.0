import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';

import {
  buildWhatcomCountyPackage,
  parseWhatcomCsv,
} from './whatcom_public_sales.mjs';

const GENERATED_AT = '2026-09-02T04:15:30.167Z';
const HEADERS = [
  'Sale Date',
  'Sale Price',
  'Sale Type Code',
  'DOR State Code',
  'Site Size',
  'Property ID',
  'Parcel Number/Geo ID',
  'Neighborhood Code',
  'Property Type',
  'Tax Code Area',
  'Region Code',
  'Situs Address',
];
const SOURCE_KEYS = [
  'bellingham',
  'blaine',
  'commercial',
  'ferndale',
  'lynden',
  'meridian',
  'mt-baker-concrete-sedro',
  'nooksack',
];

function csvValue(value) {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function csv(rows) {
  return `${HEADERS.join(',')}\n${rows.map(row => row.map(csvValue).join(',')).join('\n')}\n`;
}

function row(index, overrides = {}) {
  const values = {
    'Sale Date': '2025-07-31',
    'Sale Price': String(300_000 + index),
    'Sale Type Code': 'Q',
    'DOR State Code': '11',
    'Site Size': '0.25',
    'Property ID': String(10_000 + index),
    'Parcel Number/Geo ID': `380212175500${String(index).padStart(4, '0')}`,
    'Neighborhood Code': '6110013000',
    'Property Type': 'R',
    'Tax Code Area': '100',
    'Region Code': '1',
    'Situs Address': `${index} TEST AVE, BELLINGHAM`,
    ...overrides,
  };
  return HEADERS.map(header => values[header]);
}

async function createFixture({ duplicate = false, conflict = false, future = false } = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'whatcom-public-sales-'));
  const sources = [];
  for (const [index, key] of SOURCE_KEYS.entries()) {
    let sourceRow = row(index + 1);
    if (duplicate && index === 1) sourceRow = row(1);
    if (conflict && index === 1) {
      sourceRow = row(1, { 'Situs Address': 'DIFFERENT ADDRESS, BELLINGHAM' });
    }
    if (future && index === 7) sourceRow = row(index + 1, { 'Sale Date': '2027-01-01' });
    const file = `${key}.csv`;
    const contents = csv([sourceRow]);
    await writeFile(join(directory, file), contents, 'utf8');
    sources.push({
      key,
      file,
      url: `https://www.whatcomcounty.us/DocumentCenter/View/${index + 1}/${file}`,
      sha256: createHash('sha256').update(contents).digest('hex'),
    });
  }
  const config = {
    schemaVersion: 'terrafusion.washington.public-source-set.v1',
    county: 'Whatcom',
    countyCode: '073',
    officialSourceBaseUrl: 'https://www.whatcomcounty.us/177/Assessor',
    indexUrl: 'https://www.whatcomcounty.us/4274/Neighborhood-Market-Study-Valuation-Sale',
    publishedLabel: 'test fixture',
    sourceDateRange: { start: '2024-01-01', end: '2025-07-31' },
    sources,
  };
  const configPath = join(directory, 'sources.json');
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  return { directory, configPath };
}

test('parses strict CSV with quoted commas and escaped quotes', () => {
  const [parsed] = parseWhatcomCsv(
    csv([row(1, { 'Situs Address': '4247 "WINTERGREEN", BELLINGHAM' })])
  );
  assert.equal(parsed['Situs Address'], '4247 "WINTERGREEN", BELLINGHAM');
  assert.throws(
    () => parseWhatcomCsv(`Wrong,${HEADERS.slice(1).join(',')}\n${row(1).join(',')}\n`),
    /header does not match/
  );
});

test('builds a county-isolated, public-only package and quarantines exact overlap', async t => {
  const fixture = await createFixture({ duplicate: true });
  t.after(() => rm(fixture.directory, { recursive: true, force: true }));
  const result = await buildWhatcomCountyPackage(
    fixture.directory,
    GENERATED_AT,
    fixture.configPath
  );

  assert.equal(result.receipt.candidateSales, 8);
  assert.equal(result.receipt.stagedSales, 7);
  assert.equal(result.receipt.quarantinedSales, 1);
  assert.equal(result.shard.records.length, 7);
  assert.equal(result.statusEntry.countyCode, '073');
  assert.equal(result.attestation.sourcePayloadSha256.length, 8);
  assert.equal(
    result.shard.records.every(
      record =>
        record.county === 'Whatcom' &&
        record.countyCode === '073' &&
        record.grantor === null &&
        record.grantee === null &&
        record.owner === undefined &&
        record.buyer === undefined &&
        record.seller === undefined
    ),
    true
  );
});

test('rejects a changed official payload before parsing it', async t => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.directory, { recursive: true, force: true }));
  await writeFile(join(fixture.directory, 'bellingham.csv'), csv([row(99)]), 'utf8');
  await assert.rejects(
    buildWhatcomCountyPackage(fixture.directory, GENERATED_AT, fixture.configPath),
    /does not match its expected SHA-256/
  );
});

test('rejects conflicting overlap and future-dated sales', async t => {
  const conflict = await createFixture({ conflict: true });
  const future = await createFixture({ future: true });
  t.after(async () => {
    await Promise.all([
      rm(conflict.directory, { recursive: true, force: true }),
      rm(future.directory, { recursive: true, force: true }),
    ]);
  });
  await assert.rejects(
    buildWhatcomCountyPackage(conflict.directory, GENERATED_AT, conflict.configPath),
    /files conflict for sale identity/
  );
  await assert.rejects(
    buildWhatcomCountyPackage(future.directory, GENERATED_AT, future.configPath),
    /outside its published date range|future-dated/
  );
});
