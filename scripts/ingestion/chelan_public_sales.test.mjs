import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import XLSX from 'xlsx';

import {
  buildChelanCountyPackage,
  canonicalSaleDate,
  parseChelanWorkbook,
} from './chelan_public_sales.mjs';
import {
  canonicalJsonSha256,
  loadVerifiedRetainedWashingtonPackage,
} from './kitsap_public_sales.mjs';

XLSX.set_fs(fs);

const GENERATED_AT = '2026-09-01T18:00:00.000Z';
const HEADERS = [
  'prop_id',
  'geo_id',
  'NBHD',
  'Region',
  'Sale_Price',
  'Deed_Date',
  'Sale_Date',
  'state_cd',
  'situs_num',
  'situs_street_prefx',
  'situs_street',
  'situs_street_sufix',
  'situs_city',
  'legal_acreage',
  'living_area',
  'Basement_Area',
  'Part_Finish',
  'Minimal_Finish',
  'Year Built',
  'Width',
  'Length',
  'Bedrooms',
  'Bathrooms',
  'Heat_Cool',
  'Number_of_Units',
  'Garage_Area',
  'Pool',
  'FIREPLACE',
  'Number_of_Fireplaces',
  'Deed_Type',
  'Reject_Code',
  'Aff_#',
  'Auditor_File_#',
  'Market',
  'Buyer',
  'Seller',
  'Tax Area',
];

function sourceRow(index, overrides = {}) {
  return {
    prop_id: `P${index}`,
    geo_id: `G${index}`,
    NBHD: 'N1',
    Region: '1',
    Sale_Price: 300000 + index,
    Deed_Date: '2026/01/05',
    Sale_Date: '2026/01/04',
    state_cd: '11',
    situs_num: String(index),
    situs_street_prefx: '',
    situs_street: 'TEST',
    situs_street_sufix: 'AVE',
    situs_city: 'WENATCHEE',
    legal_acreage: 0.25,
    living_area: 1400,
    Basement_Area: null,
    Part_Finish: null,
    Minimal_Finish: null,
    'Year Built': 1995,
    Width: null,
    Length: null,
    Bedrooms: 3,
    Bathrooms: 2,
    Heat_Cool: null,
    Number_of_Units: 1,
    Garage_Area: 400,
    Pool: null,
    FIREPLACE: null,
    Number_of_Fireplaces: null,
    Deed_Type: 'SWD',
    Reject_Code: null,
    'Aff_#': `A${index}`,
    'Auditor_File_#': `D${index}`,
    Market: 'Y',
    Buyer: `PRIVATE BUYER ${index}`,
    Seller: `PRIVATE SELLER ${index}`,
    'Tax Area': '001',
    ...overrides,
  };
}

function workbookBytes(rows) {
  const workbook = XLSX.utils.book_new();
  const table = [HEADERS, ...rows.map(row => HEADERS.map(header => row[header] ?? null))];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(table), 'Sales');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xls' });
}

async function fixture({
  conflict = false,
  crossSourceComponent = false,
  invalidYearBuilt = false,
} = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'chelan-public-sales-'));
  const sources = [];
  for (let month = 1; month <= 7; month += 1) {
    const key = `2026-${String(month).padStart(2, '0')}`;
    const file = `${key}.xls`;
    const rows = [
      crossSourceComponent && month === 2
        ? sourceRow(1, { Bedrooms: 3, Bathrooms: 2 })
        : sourceRow(
            month,
            crossSourceComponent && month === 1 ? { Bedrooms: null, Bathrooms: null } : {}
          ),
    ];
    if (month === 1 && !crossSourceComponent) {
      rows.push(
        sourceRow(1, {
          Garage_Area: 700,
          Bedrooms: conflict ? 4 : 3,
          Sale_Price: conflict ? 999999 : 300001,
        })
      );
    }
    if (invalidYearBuilt && month === 1) {
      rows.forEach(row => {
        row['Year Built'] = 0;
      });
    }
    if (month === 2 && !crossSourceComponent) rows[0].Reject_Code = '2';
    const bytes = workbookBytes(rows);
    await writeFile(join(directory, file), bytes);
    sources.push({
      key,
      file,
      url: `https://co.chelan.wa.us/files/assessor/${file}`,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    });
  }
  const config = {
    schemaVersion: 'terrafusion.washington.public-source-set.v1',
    county: 'Chelan',
    countyCode: '007',
    officialSourceBaseUrl: 'https://co.chelan.wa.us',
    indexUrl: 'https://co.chelan.wa.us/assessor/pages/monthly-sales-reports',
    publishedLabel: 'fixture',
    sourceDateRange: { start: '2026-01-01', end: '2026-01-31' },
    sources,
  };
  const configPath = join(directory, 'sources.json');
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
  return { directory, config, configPath };
}

test('strips buyer and seller at the XLS parser boundary', () => {
  const rows = parseChelanWorkbook(workbookBytes([sourceRow(1)]));
  assert.equal(rows.length, 1);
  assert.equal('Buyer' in rows[0], false);
  assert.equal('Seller' in rows[0], false);
  assert.doesNotMatch(JSON.stringify(rows), /PRIVATE (BUYER|SELLER)/);
});

test('preserves native Excel calendar dates in a positive-offset time zone', () => {
  const previousTimeZone = process.env.TZ;
  process.env.TZ = 'Asia/Kolkata';
  try {
    const nativeDate = new Date(2026, 0, 4);
    const [parsed] = parseChelanWorkbook(workbookBytes([sourceRow(1, { Sale_Date: nativeDate })]));
    assert.equal(parsed.Sale_Date instanceof Date, true);
    assert.equal(canonicalSaleDate(parsed.Sale_Date), '2026-01-04');
  } finally {
    if (previousTimeZone === undefined) delete process.env.TZ;
    else process.env.TZ = previousTimeZone;
  }
});

test('consolidates component rows and marks official reject codes for review', async t => {
  const data = await fixture();
  t.after(() => rm(data.directory, { recursive: true, force: true }));
  const result = await buildChelanCountyPackage(data.directory, GENERATED_AT, data.configPath);
  assert.equal(result.receipt.candidateSales, 8);
  assert.equal(result.receipt.stagedSales, 7);
  assert.equal(result.receipt.consolidation.componentRowsConsolidated, 1);
  assert.equal(result.receipt.consolidation.multiComponentTransactions, 1);
  assert.equal(result.receipt.reviewRequiredSales, 1);
  assert.equal(result.receipt.quarantinedSales, 0);
  const reviewed = result.shard.records.find(record => record.parcelNumber === 'G2');
  assert.equal(reviewed.reviewStatus, 'review_required');
  assert.equal(reviewed.flags.needsReview, true);
  assert.equal(
    result.shard.records.every(
      record =>
        record.countyCode === '007' &&
        record.grantor === null &&
        record.grantee === null &&
        record.owner === undefined &&
        record.buyer === undefined &&
        record.seller === undefined
    ),
    true
  );
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE (BUYER|SELLER)/);
});

test('normalizes impossible official year-built values to unavailable', async t => {
  const data = await fixture({ invalidYearBuilt: true });
  t.after(() => rm(data.directory, { recursive: true, force: true }));
  const result = await buildChelanCountyPackage(data.directory, GENERATED_AT, data.configPath);
  const invalid = result.shard.records.find(record => record.parcelNumber === 'G1');
  const valid = result.shard.records.find(record => record.parcelNumber === 'G2');

  assert.equal(invalid.yearBuilt, null);
  assert.equal(valid.yearBuilt, 1995);
  assert.equal(
    result.shard.records.every(
      record =>
        record.yearBuilt === null ||
        (Number.isInteger(record.yearBuilt) &&
          record.yearBuilt >= 1700 &&
          record.yearBuilt <= record.saleYear)
    ),
    true
  );
});

test('quarantines all rows in a transaction with conflicting prices', async t => {
  const data = await fixture({ conflict: true });
  t.after(() => rm(data.directory, { recursive: true, force: true }));
  const result = await buildChelanCountyPackage(data.directory, GENERATED_AT, data.configPath);
  assert.equal(result.receipt.candidateSales, 8);
  assert.equal(result.receipt.stagedSales, 6);
  assert.equal(result.receipt.quarantinedSales, 2);
  assert.equal(result.receipt.quarantine.conflictingSaleIdentities.length, 1);
  assert.equal(
    result.shard.records.some(record => record.parcelNumber === 'G1'),
    false
  );
});

test('binds mapped values to every contributing source row', async t => {
  const data = await fixture({ crossSourceComponent: true });
  t.after(() => rm(data.directory, { recursive: true, force: true }));
  const result = await buildChelanCountyPackage(data.directory, GENERATED_AT, data.configPath);
  const consolidated = result.shard.records.find(record => record.parcelNumber === 'G1');

  assert.equal(consolidated.bedrooms, 3);
  assert.deepEqual(
    consolidated.provenance.componentRows.map(component => component.sourceKey),
    ['2026-01', '2026-02']
  );
  assert.deepEqual(
    consolidated.provenance.componentRows.map(component => component.candidateIndexSource),
    ['2026-01.xls#row:2', '2026-02.xls#row:2']
  );
  assert.equal(
    consolidated.provenance.componentRows.every(component =>
      /^[a-f\d]{64}$/.test(component.sourcePayloadSha256)
    ),
    true
  );
});

test('rejects source digest drift before workbook parsing', async t => {
  const data = await fixture();
  t.after(() => rm(data.directory, { recursive: true, force: true }));
  await writeFile(join(data.directory, '2026-01.xls'), workbookBytes([sourceRow(99)]));
  await assert.rejects(
    buildChelanCountyPackage(data.directory, GENERATED_AT, data.configPath),
    /does not match its expected SHA-256/
  );
});

test('rejects credentials in index and monthly source URLs without reflecting them', async t => {
  const data = await fixture();
  t.after(() => rm(data.directory, { recursive: true, force: true }));
  for (const field of ['index', 'source']) {
    const config = structuredClone(data.config);
    if (field === 'index')
      config.indexUrl = 'https://private-user:private-secret@co.chelan.wa.us/assessor';
    else
      config.sources[0].url =
        'https://private-user:private-secret@co.chelan.wa.us/files/assessor/2026-01.xls';
    await writeFile(data.configPath, `${JSON.stringify(config, null, 2)}\n`);
    await assert.rejects(
      buildChelanCountyPackage(data.directory, GENERATED_AT, data.configPath),
      error => {
        assert.match(error.message, /credential-free HTTPS/);
        assert.doesNotMatch(error.message, /private-(user|secret)/);
        return true;
      }
    );
  }
});

test('uses canonicalized slash-form source date-range bounds', async t => {
  const data = await fixture();
  t.after(() => rm(data.directory, { recursive: true, force: true }));
  const config = structuredClone(data.config);
  config.sourceDateRange = { start: '2026/01/01', end: '2026/01/31' };
  await writeFile(data.configPath, `${JSON.stringify(config, null, 2)}\n`);

  const result = await buildChelanCountyPackage(data.directory, GENERATED_AT, data.configPath);
  assert.deepEqual(result.config.sourceDateRange, {
    start: '2026-01-01',
    end: '2026-01-31',
  });
  assert.equal(result.shard.records.length, 7);
});

test('sanitizes malformed credential-bearing URL parse failures', async t => {
  const data = await fixture();
  t.after(() => rm(data.directory, { recursive: true, force: true }));
  const config = structuredClone(data.config);
  config.sources[0].url = 'https://private-user:private-secret@%';
  await writeFile(data.configPath, `${JSON.stringify(config, null, 2)}\n`);

  await assert.rejects(
    buildChelanCountyPackage(data.directory, GENERATED_AT, data.configPath),
    error => {
      assert.match(error.message, /valid credential-free HTTPS/);
      assert.equal(Object.hasOwn(error, 'input'), false);
      assert.doesNotMatch(`${error.message}\n${error.stack}`, /private-(user|secret)/);
      return true;
    }
  );
});

test('rejects query and fragment secrets before public provenance publication', async t => {
  const data = await fixture();
  t.after(() => rm(data.directory, { recursive: true, force: true }));
  for (const suffix of ['?token=private-secret', '#private-secret']) {
    const config = structuredClone(data.config);
    config.sources[0].url = `${config.sources[0].url}${suffix}`;
    await writeFile(data.configPath, `${JSON.stringify(config, null, 2)}\n`);
    await assert.rejects(
      buildChelanCountyPackage(data.directory, GENERATED_AT, data.configPath),
      error => {
        assert.match(error.message, /without a query or fragment/);
        assert.doesNotMatch(error.message, /private-secret/);
        return true;
      }
    );
  }
});

test('rejects generation identities older than the retained Washington package', async t => {
  const outputRoot = await mkdtemp(join(tmpdir(), 'chelan-monotonic-package-'));
  t.after(() => rm(outputRoot, { recursive: true, force: true }));
  const retainedGeneratedAt = '2026-09-02T05:46:07.877Z';
  const status = {
    schemaVersion: 'terrafusion.washington.county-status.v1',
    generatedAt: retainedGeneratedAt,
    sourcePosture: 'public_assessor_official_workbook',
    counties: [],
  };
  const manifest = {
    schemaVersion: 'terrafusion.washington.launch-manifest.v1',
    statusSchemaVersion: status.schemaVersion,
    statusCanonicalJsonSha256: canonicalJsonSha256(status),
    generatedAt: retainedGeneratedAt,
    sourcePosture: status.sourcePosture,
    salesShardAttestations: [],
    summary: {},
  };
  await mkdir(join(outputRoot, 'counties'), { recursive: true });
  await writeFile(join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(
    join(outputRoot, 'counties', 'status.json'),
    `${JSON.stringify(status, null, 2)}\n`
  );

  await assert.rejects(
    loadVerifiedRetainedWashingtonPackage(outputRoot, '007', '2026-09-01T18:00:00.000Z'),
    /cannot precede the existing Washington package/
  );

  status.generatedAt = '2026-09-02T06:46:07.877Z';
  manifest.statusCanonicalJsonSha256 = canonicalJsonSha256(status);
  await writeFile(join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(
    join(outputRoot, 'counties', 'status.json'),
    `${JSON.stringify(status, null, 2)}\n`
  );
  await assert.rejects(
    loadVerifiedRetainedWashingtonPackage(outputRoot, '007', '2026-09-02T06:00:00.000Z'),
    /status and manifest release identities do not match/
  );
});
