import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';

import {
  buildWhatcomCountyPackage,
  parseWhatcomCsv,
  publishWhatcomPackage,
} from './whatcom_public_sales.mjs';
import { canonicalJsonSha256 } from './kitsap_public_sales.mjs';

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

async function createFixture({
  duplicate = false,
  conflict = false,
  future = false,
  blankSiteSize = false,
  invalidSiteSize = false,
  priceConflict = false,
} = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'whatcom-public-sales-'));
  const sources = [];
  for (const [index, key] of SOURCE_KEYS.entries()) {
    let sourceRow = row(index + 1);
    if (blankSiteSize && index === 0) sourceRow = row(index + 1, { 'Site Size': '' });
    if (invalidSiteSize && index === 0) sourceRow = row(index + 1, { 'Site Size': 'unknown' });
    if (duplicate && index === 1) sourceRow = row(1);
    if (priceConflict && index === 1) sourceRow = row(1, { 'Sale Price': '999999' });
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

async function writeRetainedKitsapPackage(
  outputPath,
  { tampered = false, futureSaleDate = false } = {}
) {
  const priorGeneratedAt = '2026-09-01T00:00:00.000Z';
  const shard = {
    schemaVersion: 'terrafusion.washington.sales-shard.v1',
    generatedAt: priorGeneratedAt,
    county: 'Kitsap',
    countyCode: '035',
    summary: {
      records: 1,
      latestSaleDate: '2025-08-01',
      reviewRecords: futureSaleDate ? 1 : 0,
      recordsWithNeighborhoodCode: 1,
      topNeighborhoodCodes: [{ neighborhoodCode: '100', records: 1 }],
    },
    records: [{ saleId: 'kitsap-retained-sale', flags: { futureSaleDate } }],
  };
  const status = {
    schemaVersion: 'terrafusion.washington.county-status.v1',
    generatedAt: priorGeneratedAt,
    sourcePosture: 'public_assessor_official_workbook',
    counties: [
      {
        county: 'Kitsap',
        countyCode: '035',
        priority: 'washington_assessor_launch',
        prometheusStatus: 'public_data_ready',
        primarySourceMode: 'public_assessor_official_workbook',
        latestSaleDate: '2025-08-01',
        candidateSales: 1,
        stagedSales: 1,
        needsReview: futureSaleDate ? 1 : 0,
        confidence: {
          averageQualityScore: 1,
          parserStatus: 'ready',
          rawStatus: 'official_workbook_verified',
          rawDriftDetected: false,
        },
        staticRoutes: {
          detail: '/launch-data/washington/counties/035.json',
          salesShard: '/launch-data/washington/sales/by-county/035.json',
        },
      },
    ],
  };
  const manifest = {
    schemaVersion: 'terrafusion.washington.launch-manifest.v1',
    statusSchemaVersion: status.schemaVersion,
    statusCanonicalJsonSha256: canonicalJsonSha256(status),
    generatedAt: priorGeneratedAt,
    sourcePosture: status.sourcePosture,
    salesShardAttestations: [
      {
        algorithm: 'SHA-256',
        canonicalJsonSha256: canonicalJsonSha256(shard),
        county: 'Kitsap',
        countyCode: '035',
        officialSourceBaseUrl: 'https://www.kitsap.gov/assessor',
        route: '/launch-data/washington/sales/by-county/035.json',
        sourcePayloadSha256: ['a'.repeat(64)],
        sourcePosture: 'public_assessor_official_workbook',
      },
    ],
    summary: {
      counties: 1,
      rawLanded: 1,
      parserReady: 1,
      candidateSales: 1,
      stagedSales: 1,
      needsReview: futureSaleDate ? 1 : 0,
      prometheusNeedsReview: 0,
      recordsWithNeighborhoodCode: 1,
      futureSaleDateRecords: futureSaleDate ? 1 : 0,
      criticalContradictions: 0,
      garfieldExceptions: 0,
      bentonCityAsNeighborhoodRecords: 0,
    },
  };
  await mkdir(join(outputPath, 'counties'), { recursive: true });
  await mkdir(join(outputPath, 'sales', 'by-county'), { recursive: true });
  await mkdir(join(outputPath, 'receipts'), { recursive: true });
  await writeFile(join(outputPath, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(
    join(outputPath, 'counties', 'status.json'),
    `${JSON.stringify(status, null, 2)}\n`
  );
  await writeFile(
    join(outputPath, 'counties', '035.json'),
    `${JSON.stringify(
      {
        schemaVersion: 'terrafusion.washington.county-detail.v1',
        generatedAt: priorGeneratedAt,
        county: 'Kitsap',
        countyCode: '035',
        operationalState: {
          primarySourceMode: 'public_assessor_official_workbook',
          prometheusStatus: 'public_data_ready',
        },
        summary: { records: 1, latestSaleDate: '2025-08-01' },
        salesRoute: '/launch-data/washington/sales/by-county/035.json',
      },
      null,
      2
    )}\n`
  );
  await writeFile(
    join(outputPath, 'sales', 'by-county', '035.json'),
    `${JSON.stringify(
      {
        ...shard,
        records: tampered
          ? [{ saleId: 'tampered-sale', flags: { futureSaleDate } }]
          : shard.records,
      },
      null,
      2
    )}\n`
  );
  await writeFile(
    join(outputPath, 'receipts', 'kitsap-source.json'),
    `${JSON.stringify(
      {
        schemaVersion: 'terrafusion.washington.public-source-receipt.v1',
        generatedAt: priorGeneratedAt,
        county: 'Kitsap',
        countyCode: '035',
      },
      null,
      2
    )}\n`
  );
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
  const mappedSale = result.shard.records.find(record => record.parcelNumber.endsWith('0001'));
  assert.equal(mappedSale.situsAddress, '1 TEST AVE');
  assert.equal(mappedSale.situsCity, 'BELLINGHAM');
  assert.equal(mappedSale.deedType, 'Q');
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

test('preserves unavailable acreage as null and rejects malformed acreage', async t => {
  const blank = await createFixture({ blankSiteSize: true });
  const malformed = await createFixture({ invalidSiteSize: true });
  t.after(async () => {
    await Promise.all([
      rm(blank.directory, { recursive: true, force: true }),
      rm(malformed.directory, { recursive: true, force: true }),
    ]);
  });
  const result = await buildWhatcomCountyPackage(blank.directory, GENERATED_AT, blank.configPath);
  assert.equal(
    result.shard.records.find(record => record.parcelNumber.endsWith('0001')).acres,
    null
  );
  await assert.rejects(
    buildWhatcomCountyPackage(malformed.directory, GENERATED_AT, malformed.configPath),
    /invalid site size/
  );
});

test('quarantines conflicting prices for the same parcel, property, and sale date', async t => {
  const fixture = await createFixture({ priceConflict: true });
  t.after(() => rm(fixture.directory, { recursive: true, force: true }));
  const result = await buildWhatcomCountyPackage(
    fixture.directory,
    GENERATED_AT,
    fixture.configPath
  );
  assert.equal(result.receipt.candidateSales, 8);
  assert.equal(result.receipt.stagedSales, 6);
  assert.equal(result.receipt.quarantinedSales, 2);
  assert.equal(result.receipt.quarantine.exactDuplicateRows, 0);
  assert.equal(result.receipt.quarantine.conflictingSaleRows, 2);
  assert.deepEqual(
    result.receipt.quarantine.conflictingSaleIdentities[0].observedSalePrices,
    [300001, 999999]
  );
  assert.equal(
    result.shard.records.some(record => record.parcelNumber.endsWith('0001')),
    false
  );
});

test('preserves retained counties future-sale review count in the combined manifest', async t => {
  const fixture = await createFixture();
  const outputPath = join(fixture.directory, 'launch-data', 'washington');
  t.after(() => rm(fixture.directory, { recursive: true, force: true }));
  await writeRetainedKitsapPackage(outputPath, { futureSaleDate: true });
  await publishWhatcomPackage(fixture.directory, outputPath, GENERATED_AT, fixture.configPath);
  const manifest = JSON.parse(await readFile(join(outputPath, 'manifest.json'), 'utf8'));
  assert.equal(manifest.summary.futureSaleDateRecords, 1);
});

test('reports the single official source posture for standalone Whatcom publication', async t => {
  const fixture = await createFixture();
  const outputPath = join(fixture.directory, 'standalone', 'washington');
  t.after(() => rm(fixture.directory, { recursive: true, force: true }));
  await mkdir(outputPath, { recursive: true });
  await publishWhatcomPackage(fixture.directory, outputPath, GENERATED_AT, fixture.configPath);
  const manifest = JSON.parse(await readFile(join(outputPath, 'manifest.json'), 'utf8'));
  const status = JSON.parse(await readFile(join(outputPath, 'counties', 'status.json'), 'utf8'));
  assert.equal(status.sourcePosture, 'public_assessor_qualified_sales_csv');
  assert.equal(manifest.sourcePosture, status.sourcePosture);
  assert.deepEqual(
    status.counties.map(county => county.countyCode),
    ['073']
  );
});

test('rejects a tampered retained county shard before re-attesting it', async t => {
  const fixture = await createFixture();
  const outputPath = join(fixture.directory, 'launch-data', 'washington');
  t.after(() => rm(fixture.directory, { recursive: true, force: true }));
  await writeRetainedKitsapPackage(outputPath, { tampered: true });

  await assert.rejects(
    publishWhatcomPackage(fixture.directory, outputPath, GENERATED_AT, fixture.configPath),
    /does not match its existing attestation/
  );
  const visibleShard = JSON.parse(
    await readFile(join(outputPath, 'sales', 'by-county', '035.json'), 'utf8')
  );
  assert.equal(visibleShard.records[0].saleId, 'tampered-sale');
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
