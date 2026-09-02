import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  buildClarkCountyPackage,
  canonicalClarkSaleDate,
  parseClarkCsv,
} from './clark_public_sales.mjs';

const GENERATED_AT = '2026-09-02T12:00:00.000Z';
const HEADERS = [
  'Property Identification #',
  'Assessment Group',
  'Parcel Size (Sq Ft)',
  'Parcel Size (Acres)',
  'Building Type',
  'Style',
  'Quality',
  'Year Built',
  'Main and Upper Living Area',
  'Basement Area',
  'Sale Date',
  'View?',
  'Waterfront?',
  ' Original Sale Amount ',
  'Parcel Address',
  'Class (Original)',
  ' Adjusted Sale Amount ',
];

function csvField(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function csv(rows) {
  return `${HEADERS.map(csvField).join(',')}\r\n${rows
    .map(row => row.map(csvField).join(','))
    .join('\r\n')}\r\n`;
}

function row(parcel, overrides = {}) {
  const values = {
    'Property Identification #': parcel,
    'Assessment Group': 'R1-TEST',
    'Parcel Size (Sq Ft)': '43560',
    'Parcel Size (Acres)': '1.00',
    'Building Type': 'Conventional',
    Style: 'One Story',
    Quality: 'Average',
    'Year Built': '2020',
    'Main and Upper Living Area': '1800',
    'Basement Area': '300',
    'Sale Date': '12/31/2025',
    'View?': 'No',
    'Waterfront?': 'No',
    'Original Sale Amount': ' $500,000 ',
    'Parcel Address': '1 TEST AVE VANCOUVER, WA 98660',
    'Class (Original)': '04',
    'Adjusted Sale Amount': ' $510,000 ',
    ...overrides,
  };
  return HEADERS.map(header => values[header.trim()]);
}

async function createFixture({ duplicate = false, postSaleYear = false, future = false } = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'tf-clark-sales-'));
  const file = 'Web Area Sales CSV.csv';
  const archiveFile = 'web-area-sales-csv.zip';
  const archiveBody = Buffer.from('fixture-clark-zip');
  const rows = [
    row('100000001'),
    row('100000002', {
      'Sale Date': future ? '12/31/2027' : '1/11/2024',
      'Original Sale Amount': '$300,000',
      'Adjusted Sale Amount': '$300,000',
      'Year Built': postSaleYear ? '2025' : '',
      'Parcel Size (Sq Ft)': '10092',
      'Parcel Size (Acres)': '0',
      'Main and Upper Living Area': postSaleYear ? '1200' : '0',
      'Parcel Address': '',
    }),
  ];
  if (duplicate) rows.push([...rows[0]]);
  const body = csv(rows);
  await writeFile(join(directory, file), body, 'utf8');
  await writeFile(join(directory, archiveFile), archiveBody);
  const config = {
    schemaVersion: 'terrafusion.washington.public-source-set.v1',
    county: 'Clark',
    countyCode: '011',
    officialSourceBaseUrl: 'https://clark.wa.gov/assessor',
    indexUrl: 'https://clark.wa.gov/assessor/residential-property-sales-information',
    publishedLabel: '2026',
    sourceDateRange: {
      start: '2024-01-11',
      end: future ? '2027-12-31' : '2025-12-31',
    },
    sources: [
      {
        key: 'residential',
        archiveFile,
        file,
        url: 'https://clark.wa.gov/media/document/228661',
        finalUrl:
          'https://clark.wa.gov/sites/default/files/media/document/2026-06/web-area-sales-csv.zip',
        archiveSha256: createHash('sha256').update(archiveBody).digest('hex'),
        sha256: createHash('sha256').update(body).digest('hex'),
      },
    ],
  };
  const configPath = join(directory, 'config.json');
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  return { directory, config, configPath };
}

test('parses Clark calendar dates and the exact quoted official CSV contract', () => {
  assert.equal(canonicalClarkSaleDate('1/11/2024'), '2024-01-11');
  const [parsed] = parseClarkCsv(csv([row('100000001')]));
  assert.equal(parsed['Original Sale Amount'], ' $500,000 ');
  assert.equal(parsed['Parcel Address'], '1 TEST AVE VANCOUVER, WA 98660');
  assert.throws(
    () => parseClarkCsv(`Wrong,${HEADERS.slice(1).join(',')}\n${row('1').join(',')}\n`),
    /header does not match/
  );
});

test('builds a public-only Clark package and quarantines exact duplicate rows', async t => {
  const fixture = await createFixture({ duplicate: true, postSaleYear: true });
  t.after(() => rm(fixture.directory, { recursive: true, force: true }));
  const result = await buildClarkCountyPackage(fixture.directory, GENERATED_AT, fixture.configPath);

  assert.equal(result.receipt.candidateSales, 3);
  assert.equal(result.receipt.stagedSales, 2);
  assert.equal(result.receipt.quarantinedSales, 1);
  assert.equal(result.receipt.quarantine.exactDuplicateRows, 1);
  assert.equal(result.statusEntry.countyCode, '011');
  assert.equal(result.shard.records.length, 2);
  const first = result.shard.records.find(record => record.parcelNumber === '100000001');
  const second = result.shard.records.find(record => record.parcelNumber === '100000002');
  assert.equal(first.salePrice, 500_000);
  assert.equal(first.adjustedSalePrice, 510_000);
  assert.equal(first.situsAddress, '1 TEST AVE VANCOUVER, WA 98660');
  assert.equal(first.situsCity, null);
  assert.equal(first.situsZip, null);
  assert.equal(first.grossLivingArea, 1800);
  assert.equal(first.yearBuilt, 2020);
  assert.equal(second.yearBuilt, null);
  assert.equal(second.useCode, null);
  assert.equal(second.qualityGrade, null);
  assert.equal(second.lotSizeSqft, 10_092);
  assert.equal(second.acres, 0.2317);
  assert.equal(second.grossLivingArea, null);
  assert.equal(
    result.shard.records.every(
      record =>
        record.county === 'Clark' &&
        record.countyCode === '011' &&
        record.grantor === null &&
        record.grantee === null &&
        record.owner === undefined &&
        record.buyer === undefined &&
        record.seller === undefined
    ),
    true
  );
});

test('rejects source drift before parsing the official CSV', async t => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.directory, { recursive: true, force: true }));
  await writeFile(join(fixture.directory, 'Web Area Sales CSV.csv'), 'changed', 'utf8');
  await assert.rejects(
    buildClarkCountyPackage(fixture.directory, GENERATED_AT, fixture.configPath),
    /does not match its expected SHA-256/
  );
});

test('rejects source archive drift before publishing its extracted CSV', async t => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.directory, { recursive: true, force: true }));
  await writeFile(join(fixture.directory, 'web-area-sales-csv.zip'), 'changed archive', 'utf8');
  await assert.rejects(
    buildClarkCountyPackage(fixture.directory, GENERATED_AT, fixture.configPath),
    /ZIP does not match its expected SHA-256/
  );
});

test('rejects future-dated official sales instead of silently staging them', async t => {
  const fixture = await createFixture({ future: true });
  t.after(() => rm(fixture.directory, { recursive: true, force: true }));
  await assert.rejects(
    buildClarkCountyPackage(fixture.directory, GENERATED_AT, fixture.configPath),
    /future-dated/
  );
});

test('rejects credential-bearing official source URLs', async t => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.directory, { recursive: true, force: true }));
  fixture.config.sources[0].url = 'https://token:secret@clark.wa.gov/media/document/228661';
  await writeFile(fixture.configPath, `${JSON.stringify(fixture.config, null, 2)}\n`, 'utf8');
  await assert.rejects(
    buildClarkCountyPackage(fixture.directory, GENERATED_AT, fixture.configPath),
    /outside the official county origin/
  );
});

test('rejects ambiguous source metadata before reading payloads', async t => {
  const cases = [
    {
      mutate: config => {
        config.officialSourceBaseUrl = 'https://clark.wa.gov/assessor?alternate=true';
      },
      expected: /official source must be credential-free HTTPS/,
    },
    {
      mutate: config => {
        config.sourceDateRange.start = '2025-02-30';
      },
      expected: /source date range is invalid/,
    },
    {
      mutate: config => {
        config.sources[0].archiveFile = config.sources[0].file;
      },
      expected: /source identity is invalid/,
    },
  ];

  for (const { mutate, expected } of cases) {
    const fixture = await createFixture();
    t.after(() => rm(fixture.directory, { recursive: true, force: true }));
    mutate(fixture.config);
    await writeFile(fixture.configPath, `${JSON.stringify(fixture.config, null, 2)}\n`, 'utf8');
    await assert.rejects(
      buildClarkCountyPackage(fixture.directory, GENERATED_AT, fixture.configPath),
      expected
    );
  }
});
