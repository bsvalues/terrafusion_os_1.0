import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  buildSkagitCountyPackage,
  canonicalSkagitSaleDate,
  parseSkagitPipeRows,
  SKAGIT_ASSESSOR_HEADERS,
  SKAGIT_SALE_HEADERS,
} from './skagit_public_sales.mjs';

const GENERATED_AT = '2026-09-02T20:00:00.000Z';

function saleRow({
  saleId,
  parcel,
  price = '625000',
  date = '2026-08-18 00:00:00',
  saleType = 'VALID SALE',
  recording,
  excise,
}) {
  return [
    saleId,
    parcel,
    `ACCOUNT-${parcel}`,
    'PRIVATE SELLER',
    'PRIVATE BUYER',
    price,
    date,
    saleType,
    recording ?? `RECORDING-${saleId}`,
    'WARRANTY DEED',
    date,
    '100',
    excise ?? `EXCISE-${saleId}`,
  ].join('|');
}

function assessorRow({
  aid,
  parcel,
  streetNumber = '123',
  streetName = 'TEST AVENUE',
  cityStateZip = 'MOUNT VERNON, WA 98273',
  propertyType = 'R',
  inactiveDate = '',
  unit = '',
  bedrooms = '3',
}) {
  const row = Array(SKAGIT_ASSESSOR_HEADERS.length).fill('');
  row[0] = aid;
  row[1] = parcel;
  row[2] = `ACCOUNT-${parcel}`;
  row[4] = streetNumber;
  row[5] = streetName;
  row[6] = cityStateZip;
  row[10] = 'PRIVATE OWNER';
  row[11] = 'PRIVATE MAILING ADDRESS';
  row[18] = 'MV-100';
  row[20] = '(111) HOUSEHOLD, SFR, INSIDE CITY';
  row[27] = '0.25';
  row[32] = '2018';
  row[33] = '1800';
  row[36] = inactiveDate;
  row[50] = bedrooms;
  row[56] = unit;
  row[69] = propertyType;
  return row.join('|');
}

async function createFixture() {
  const directory = await mkdtemp(join(tmpdir(), 'tf-skagit-sales-'));
  const saleArchive = Buffer.from('fixture-skagit-sales-zip');
  const assessorArchive = Buffer.from('fixture-skagit-assessor-zip');
  const sales = `${SKAGIT_SALE_HEADERS.join('|')}\r\n${[
    saleRow({ saleId: '1', parcel: 'P1' }),
    saleRow({ saleId: '2', parcel: 'P2' }),
    saleRow({ saleId: '2', parcel: 'P3' }),
    saleRow({ saleId: '3', parcel: 'P4', price: '0' }),
    saleRow({ saleId: '4', parcel: 'P5' }),
    saleRow({ saleId: '4', parcel: 'P5' }),
    saleRow({ saleId: '5', parcel: 'P-MISSING' }),
    saleRow({ saleId: '6', parcel: 'P6' }),
    saleRow({ saleId: '7', parcel: 'P7' }),
    saleRow({ saleId: '8', parcel: 'P8' }),
    saleRow({ saleId: '9', parcel: 'P9' }),
    saleRow({ saleId: '10', parcel: 'P10', date: '2027-01-01 00:00:00' }),
    saleRow({ saleId: '11', parcel: 'P11', date: 'bad-date' }),
    saleRow({ saleId: '12', parcel: 'P12', date: '2023-12-31 00:00:00' }),
    saleRow({ saleId: '13', parcel: 'P13', saleType: 'QUITCLAIM' }),
    saleRow({ saleId: '14', parcel: 'P14', recording: 'RECORDING-14', excise: 'EXCISE-14' }),
    saleRow({
      saleId: '15',
      parcel: 'P15',
      price: '0',
      recording: 'RECORDING-14',
      excise: 'EXCISE-15',
    }),
    saleRow({
      saleId: '16',
      parcel: 'P16',
      recording: 'RECORDING-16-A',
      excise: 'EXCISE-16-A',
    }),
    saleRow({
      saleId: '17',
      parcel: 'P16',
      recording: 'RECORDING-16-B',
      excise: 'EXCISE-16-B',
    }),
    saleRow({
      saleId: '18',
      parcel: 'P17',
      recording: 'RECORDING-17',
      excise: 'EXCISE-17-A',
    }),
    saleRow({
      saleId: '19',
      parcel: 'P17',
      recording: 'RECORDING-17',
      excise: 'EXCISE-17-B',
    }),
  ].join('\r\n')}\r\n`;
  const assessors = `${SKAGIT_ASSESSOR_HEADERS.join('|')}\r\n${[
    assessorRow({ aid: '1', parcel: 'P1', unit: 'UNIT 4', bedrooms: '' }),
    assessorRow({ aid: '2', parcel: 'P2' }),
    assessorRow({ aid: '3', parcel: 'P3' }),
    assessorRow({ aid: '4', parcel: 'P4' }),
    assessorRow({ aid: '5', parcel: 'P5', bedrooms: '0' }),
    assessorRow({ aid: '6', parcel: 'P6' }),
    assessorRow({ aid: '7', parcel: 'P6', streetName: 'OTHER AVENUE' }),
    assessorRow({ aid: '8', parcel: 'P7', propertyType: 'P' }),
    assessorRow({ aid: '9', parcel: 'P8', inactiveDate: '2026-01-01' }),
    assessorRow({ aid: '10', parcel: 'P9', streetName: '' }),
    assessorRow({ aid: '11', parcel: 'P14' }),
    assessorRow({ aid: '12', parcel: 'P15' }),
    assessorRow({ aid: '13', parcel: 'P16' }),
    assessorRow({ aid: '14', parcel: 'P17' }),
  ].join('\r\n')}\r\n`;
  await Promise.all([
    writeFile(join(directory, 'Sales.txt'), sales),
    writeFile(join(directory, 'Sales.zip'), saleArchive),
    writeFile(join(directory, 'AssessorData.txt'), assessors),
    writeFile(join(directory, 'AssessorData.zip'), assessorArchive),
  ]);
  const digest = value => createHash('sha256').update(value).digest('hex');
  const config = {
    schemaVersion: 'terrafusion.washington.public-source-set.v1',
    county: 'Skagit',
    countyCode: '057',
    officialSourceBaseUrl: 'https://skagitcounty.net',
    indexUrl: 'https://www.skagitcounty.net/Reporting/DataDownloads/',
    publishedLabel: 'Fixture daily exports',
    sourceDateRange: { start: '2024-01-01', end: '2026-09-02' },
    sources: [
      {
        key: 'sale',
        archiveFile: 'Sales.zip',
        file: 'Sales.txt',
        url: 'https://www.skagitcounty.net/Assessor/Documents/DataDownloads/Sales.zip',
        finalUrl: 'https://www.skagitcounty.net/Assessor/Documents/DataDownloads/Sales.zip',
        archiveSha256: digest(saleArchive),
        sha256: digest(sales),
      },
      {
        key: 'assessor',
        archiveFile: 'AssessorData.zip',
        file: 'AssessorData.txt',
        url: 'https://www.skagitcounty.net/Assessor/Documents/DataDownloads/AssessorData.zip',
        finalUrl: 'https://www.skagitcounty.net/Assessor/Documents/DataDownloads/AssessorData.zip',
        archiveSha256: digest(assessorArchive),
        sha256: digest(assessors),
      },
    ],
  };
  const configPath = join(directory, 'config.json');
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
  return { config, configPath, directory };
}

test('parses exact Skagit pipe contracts and canonicalizes valid timestamps', () => {
  assert.equal(canonicalSkagitSaleDate('2026-08-18 00:00:00'), '2026-08-18');
  assert.equal(canonicalSkagitSaleDate('2026-08-18 16:02:26'), '2026-08-18');
  assert.equal(canonicalSkagitSaleDate('2026-02-30 00:00:00'), null);
  assert.equal(canonicalSkagitSaleDate('2026-08-18 25:00:00'), null);
  const input = `${SKAGIT_SALE_HEADERS.join('|')}\n${saleRow({ saleId: '1', parcel: 'P1' })}`;
  assert.equal(parseSkagitPipeRows(input, SKAGIT_SALE_HEADERS, 'sales').length, 1);
  assert.throws(
    () => parseSkagitPipeRows(`wrong|header\n1|2`, SKAGIT_SALE_HEADERS, 'sales'),
    /header does not match/
  );
});

test('publishes only single-parcel, public, active real-property sales with unambiguous joins', async t => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.directory, { recursive: true, force: true }));
  const result = await buildSkagitCountyPackage(
    fixture.directory,
    GENERATED_AT,
    fixture.configPath
  );

  assert.equal(result.receipt.candidateSales, 17);
  assert.equal(result.receipt.stagedSales, 2);
  assert.equal(result.receipt.quarantinedSales, 15);
  assert.deepEqual(
    {
      nonPositiveSalePrice: result.receipt.quarantine.nonPositiveSalePrice,
      multiParcelSales: result.receipt.quarantine.multiParcelSales,
      crossRecordingDuplicateSales:
        result.receipt.quarantine.crossRecordingDuplicateSales,
      conflictingConveyanceRows: result.receipt.quarantine.conflictingConveyanceRows,
      exactDuplicateRows: result.receipt.quarantine.exactDuplicateRows,
      missingAssessorJoin: result.receipt.quarantine.missingAssessorJoin,
      ambiguousAssessorJoin: result.receipt.quarantine.ambiguousAssessorJoin,
      nonRealProperty: result.receipt.quarantine.nonRealProperty,
      inactiveProperty: result.receipt.quarantine.inactiveProperty,
      missingSitusAddress: result.receipt.quarantine.missingSitusAddress,
    },
    {
      nonPositiveSalePrice: 2,
      multiParcelSales: 3,
      crossRecordingDuplicateSales: 2,
      conflictingConveyanceRows: 2,
      exactDuplicateRows: 1,
      missingAssessorJoin: 1,
      ambiguousAssessorJoin: 1,
      nonRealProperty: 1,
      inactiveProperty: 1,
      missingSitusAddress: 1,
    }
  );
  assert.equal(result.receipt.quarantine.multiParcelTransactions.length, 2);
  assert.equal(result.receipt.quarantine.crossRecordingDuplicateIdentities.length, 1);
  assert.equal(result.receipt.quarantine.conflictingSaleRows, 2);
  assert.equal(result.receipt.quarantine.conflictingSaleIdentities.length, 1);
  assert.equal(result.receipt.sourceDisposition.invalidOrFutureSaleDate, 2);
  assert.equal(result.receipt.sourceDisposition.outsideStudyWindow, 1);
  assert.equal(result.receipt.sourceDisposition.nonValidSaleType, 1);
  const first = result.shard.records.find(record => record.parcelNumber === 'P1');
  assert.equal(first.situsAddress, '123 TEST AVENUE UNIT 4');
  assert.equal(first.situsCity, 'MOUNT VERNON');
  assert.equal(first.situsZip, '98273');
  assert.equal(first.yearBuilt, 2018);
  assert.equal(first.grossLivingArea, 1800);
  assert.equal(first.lotSizeSqft, 10_890);
  assert.equal(first.bedrooms, null);
  assert.equal(
    result.shard.records.find(record => record.parcelNumber === 'P5').bedrooms,
    0
  );
  assert.equal(first.grantor, null);
  assert.equal(first.grantee, null);
  assert.equal(JSON.stringify(result).includes('PRIVATE SELLER'), false);
  assert.equal(JSON.stringify(result).includes('PRIVATE BUYER'), false);
  assert.equal(JSON.stringify(result).includes('PRIVATE OWNER'), false);
  assert.equal(JSON.stringify(result).includes('PRIVATE MAILING ADDRESS'), false);
  assert.deepEqual(
    first.provenance.componentRows.map(component => component.sourcePayloadPath),
    ['Sales.txt', 'AssessorData.txt']
  );
});

test('rejects extract drift and credential-bearing source URLs', async t => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.directory, { recursive: true, force: true }));
  await writeFile(join(fixture.directory, 'Sales.txt'), 'changed');
  await assert.rejects(
    buildSkagitCountyPackage(fixture.directory, GENERATED_AT, fixture.configPath),
    /sale extract does not match its SHA-256/
  );

  const second = await createFixture();
  t.after(() => rm(second.directory, { recursive: true, force: true }));
  second.config.sources[0].url =
    'https://token:secret@www.skagitcounty.net/Assessor/Documents/DataDownloads/Sales.zip';
  await writeFile(second.configPath, `${JSON.stringify(second.config, null, 2)}\n`);
  await assert.rejects(
    buildSkagitCountyPackage(second.directory, GENERATED_AT, second.configPath),
    /outside the official county host/
  );
});
