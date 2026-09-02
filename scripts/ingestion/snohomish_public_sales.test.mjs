import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import XLSX from 'xlsx';

import {
  buildSnohomishCountyPackage,
  canonicalSnohomishExcelDate,
  parseSnohomishCsvLine,
  parseSnohomishWorkbook,
  SNOHOMISH_ASSESSOR_HEADERS,
  SNOHOMISH_SALES_HEADERS,
} from './snohomish_public_sales.mjs';

XLSX.set_fs(fs);

const GENERATED_AT = '2026-09-02T21:00:00.000Z';

function saleRow(index, overrides = {}) {
  return {
    LRSN: 1000 + index,
    Parcel_Id: `P${index}`,
    Status: 'A',
    SD_Nbr: '101',
    Nbhd: '5001001',
    TRSQ: 'TEST',
    Prop_Class: 111,
    PropertyStreet: `${index} TEST AVE`,
    OwnerName1: `PRIVATE OWNER ${index}`,
    Sale_Date: new Date(2026, 0, 15),
    Sale_Price: 500000 + index,
    Excise_Nbr: `E${index}`,
    Deed_Type: 'W',
    Sale_Qual_Code: 'Q',
    'V/I': 'I',
    year_built: 2000,
    Bedrooms: 3,
    Total_SqFt: 1800,
    ...overrides,
  };
}

function workbookBytes(rows) {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([['Official public-data disclaimer fixture']]),
    'Disclaimer'
  );
  const table = [
    ['Snohomish County AllSales Report'],
    SNOHOMISH_SALES_HEADERS,
    ...rows.map(row => SNOHOMISH_SALES_HEADERS.map(header => row[header] ?? null)),
  ];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(table), 'All Sales');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

function assessorRow(parcel, overrides = {}) {
  const ordinal = Number(parcel.slice(1));
  const row = {
    ID: parcel.slice(1),
    PropId: String(1000 + ordinal),
    parcel_number: parcel,
    alt_parcel_nr: `ALT-${parcel}`,
    tax_year: '2026',
    TCAnumber: '001',
    UseCode: '111 Single Family Residence, Detached -Real',
    UnitMeas: 'Acres',
    SIZE: '0.25',
    SitusLine1: `${parcel.slice(1)} TEST AVE`,
    SitusLine2: '',
    SitusLine3: '',
    SitusCity: 'EVERETT',
    SitusState: 'WA',
    SitusZip: '98201',
    TVR: '500000',
    MKIMP: '300000',
    MKLND: '200000',
    CUIMP: '0',
    CULND: '0',
    MKTTL: '500000',
    ...overrides,
  };
  return SNOHOMISH_ASSESSOR_HEADERS.map(header => row[header] ?? '');
}

function csvLine(fields) {
  return fields
    .map(value => {
      const text = String(value ?? '');
      return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
    })
    .join(',');
}

async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), 'tf-snohomish-sales-'));
  const sales = workbookBytes([
    saleRow(1, { Bedrooms: null }),
    saleRow(2, {
      Parcel_Id: '000000001234',
      Excise_Nbr: 'E2',
      Exten: 'R01',
      Imp_Type: 'DWELL',
      Total_SqFt: 1800,
    }),
    saleRow(2, {
      Parcel_Id: '000000001234',
      Excise_Nbr: 'E2',
      Exten: 'G01',
      Imp_Type: 'GARAGE',
      Total_SqFt: 1800,
    }),
    saleRow(3, { Excise_Nbr: 'E3' }),
    saleRow(4, { Excise_Nbr: 'E3' }),
    saleRow(5, { Sale_Qual_Code: 'M' }),
    saleRow(5, { Excise_Nbr: 'E5-T', Status: 'T' }),
    saleRow(6),
    saleRow(7),
    saleRow(8, { Excise_Nbr: 'E8', Sale_Price: 600000 }),
    saleRow(8, { Excise_Nbr: 'E8', Sale_Price: 700000 }),
    saleRow(9, { Sale_Price: 0 }),
    saleRow(10, { Excise_Nbr: null }),
    saleRow(11, { Parcel_Id: null }),
    saleRow(12, { Excise_Nbr: 'E12-A' }),
    saleRow(12, { Excise_Nbr: 'E12-B' }),
    saleRow(1, { Bedrooms: null }),
    saleRow(13, { Parcel_Id: 'CONTRADICTS-P13' }),
  ]);
  const archive = Buffer.from('fixture official assessor archive');
  const assessorRows = [
    assessorRow('P1'),
    assessorRow('P2', { parcel_number: '1234' }),
    assessorRow('P3'),
    assessorRow('P4'),
    assessorRow('P5'),
    assessorRow('P7', { SitusZip: '' }),
    assessorRow('P8'),
    assessorRow('P9'),
    assessorRow('P10'),
    assessorRow('P11'),
    assessorRow('P12'),
    assessorRow('P13'),
  ];
  const assessor = `${csvLine(SNOHOMISH_ASSESSOR_HEADERS)}\r\n${assessorRows.map(csvLine).join('\r\n')}\r\n`;
  await Promise.all([
    writeFile(join(directory, 'snohomish-all-sales.xlsx'), sales),
    writeFile(join(directory, 'snohomish-assessor-roll.zip'), archive),
    writeFile(join(directory, 'MainData.csv'), assessor),
  ]);
  const digest = value => createHash('sha256').update(value).digest('hex');
  const config = {
    schemaVersion: 'terrafusion.washington.public-source-set.v1',
    county: 'Snohomish',
    countyCode: '061',
    officialSourceBaseUrl: 'https://snohomishcountywa.gov',
    indexUrl: 'https://www.snohomishcountywa.gov/6322/102531/County-Sales',
    publishedLabel: 'fixture',
    sourceDateRange: { start: '2024-01-01', end: '2026-09-02' },
    sources: [
      {
        key: 'sales',
        file: 'snohomish-all-sales.xlsx',
        url: 'https://snohomishcountywa.gov/DocumentCenter/View/109438',
        finalUrl: 'https://snohomishcountywa.gov/DocumentCenter/View/109438',
        sha256: digest(sales),
      },
      {
        key: 'assessor',
        archiveFile: 'snohomish-assessor-roll.zip',
        file: 'MainData.csv',
        url: 'https://www.arcgis.com/sharing/rest/content/items/ee76dfa5905947cc9af1605a25cf216a/data',
        finalUrl:
          'https://www.arcgis.com/sharing/rest/content/items/ee76dfa5905947cc9af1605a25cf216a/data',
        archiveSha256: digest(archive),
        sha256: digest(assessor),
      },
    ],
  };
  const configPath = join(directory, 'config.json');
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
  return { assessor, config, configPath, directory };
}

test('parses official Excel calendar dates and RFC-style assessor CSV fields', () => {
  assert.equal(canonicalSnohomishExcelDate('2026-01-15'), '2026-01-15');
  assert.equal(canonicalSnohomishExcelDate('2026-02-30'), null);
  assert.deepEqual(parseSnohomishCsvLine('1,"a,b","c""d"'), ['1', 'a,b', 'c"d']);
  const parsed = parseSnohomishWorkbook(workbookBytes([saleRow(1)]));
  assert.equal(parsed[0].saleDate, '2026-01-15');
  assert.equal('OwnerName1' in parsed[0], false);
  assert.doesNotMatch(JSON.stringify(parsed), /PRIVATE OWNER/);
});

test('publishes only active, single-parcel qualified sales joined to public situs data', async t => {
  const data = await fixture();
  t.after(() => rm(data.directory, { recursive: true, force: true }));
  const result = await buildSnohomishCountyPackage(data.directory, GENERATED_AT, data.configPath);

  assert.equal(result.receipt.sourceRows.sales, 18);
  assert.equal(result.receipt.sourceRows.assessor, 12);
  assert.equal(result.receipt.sourceDisposition.notOfficiallyQualified, 1);
  assert.equal(result.receipt.candidateSales, 17);
  assert.equal(result.receipt.stagedSales, 1);
  assert.equal(result.receipt.consolidation.componentRowsConsolidated, 1);
  assert.equal(result.receipt.consolidation.multiComponentTransactions, 1);
  assert.equal(result.receipt.quarantinedSales, 15);
  assert.deepEqual(
    {
      missingParcelIdentity: result.receipt.quarantine.missingParcelIdentity,
      missingConveyanceIdentity: result.receipt.quarantine.missingConveyanceIdentity,
      nonPositiveSalePrice: result.receipt.quarantine.nonPositiveSalePrice,
      multiParcelSales: result.receipt.quarantine.multiParcelSales,
      crossConveyanceDuplicateSales: result.receipt.quarantine.crossConveyanceDuplicateSales,
      exactDuplicateRows: result.receipt.quarantine.exactDuplicateRows,
      inactiveSales: result.receipt.quarantine.inactiveSales,
      conflictingTransactionRows: result.receipt.quarantine.conflictingTransactionRows,
      missingAssessorJoin: result.receipt.quarantine.missingAssessorJoin,
      ambiguousAssessorJoin: result.receipt.quarantine.ambiguousAssessorJoin,
      parcelAssessorContradictions: result.receipt.quarantine.parcelAssessorContradictions,
      missingSitusAddress: result.receipt.quarantine.missingSitusAddress,
    },
    {
      missingParcelIdentity: 1,
      missingConveyanceIdentity: 1,
      nonPositiveSalePrice: 1,
      multiParcelSales: 2,
      crossConveyanceDuplicateSales: 2,
      exactDuplicateRows: 2,
      inactiveSales: 1,
      conflictingTransactionRows: 2,
      missingAssessorJoin: 1,
      ambiguousAssessorJoin: 0,
      parcelAssessorContradictions: 1,
      missingSitusAddress: 1,
    }
  );
  assert.equal(result.receipt.quarantine.crossConveyanceDuplicateIdentities.length, 1);
  assert.equal(
    result.shard.records.some(record => record.parcelNumber === 'P1'),
    false
  );
  assert.equal(
    result.shard.records.some(record => record.parcelNumber === 'P13'),
    false
  );
  const consolidated = result.shard.records.find(record => record.parcelNumber === '1234');
  assert.equal(consolidated.provenance.componentRows.length, 3);
  assert.equal(JSON.stringify(result).includes('PRIVATE OWNER'), false);
  assert.equal(JSON.stringify(result).includes('NameAddr.csv'), true);
  assert.equal(
    result.shard.records.every(record => record.grantor === null && record.grantee === null),
    true
  );
});

test('rejects digest drift and non-exact assessor source authority', async t => {
  const data = await fixture();
  t.after(() => rm(data.directory, { recursive: true, force: true }));
  await writeFile(join(data.directory, 'MainData.csv'), 'changed');
  await assert.rejects(
    buildSnohomishCountyPackage(data.directory, GENERATED_AT, data.configPath),
    /assessor extract does not match its SHA-256/
  );

  const second = await fixture();
  t.after(() => rm(second.directory, { recursive: true, force: true }));
  second.config.sources[1].url =
    'https://www.arcgis.com/sharing/rest/content/items/another-item/data';
  await writeFile(second.configPath, `${JSON.stringify(second.config, null, 2)}\n`);
  await assert.rejects(
    buildSnohomishCountyPackage(second.directory, GENERATED_AT, second.configPath),
    /not the exact official GIS item payload/
  );

  const third = await fixture();
  t.after(() => rm(third.directory, { recursive: true, force: true }));
  await writeFile(join(third.directory, 'snohomish-assessor-roll.zip'), 'changed');
  await assert.rejects(
    buildSnohomishCountyPackage(third.directory, GENERATED_AT, third.configPath),
    /assessor archive does not match its SHA-256/
  );

  const fourth = await fixture();
  t.after(() => rm(fourth.directory, { recursive: true, force: true }));
  fourth.config.sources[0].url =
    'https://private-user:private-secret@snohomishcountywa.gov/DocumentCenter/View/109438';
  await writeFile(fourth.configPath, `${JSON.stringify(fourth.config, null, 2)}\n`);
  await assert.rejects(
    buildSnohomishCountyPackage(fourth.directory, GENERATED_AT, fourth.configPath),
    error => {
      assert.match(error.message, /outside the official county host/);
      assert.doesNotMatch(error.message, /private-(user|secret)/);
      return true;
    }
  );
});
