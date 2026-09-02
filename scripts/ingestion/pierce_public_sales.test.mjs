import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  buildPierceCountyPackage,
  canonicalPierceSaleDate,
  parsePiercePipeRows,
} from './pierce_public_sales.mjs';

const GENERATED_AT = '2026-09-02T18:00:00.000Z';

function saleRow({
  etn,
  parcel,
  date = '08/18/2026',
  price = '625000.00',
  valid = '1',
  confirmed = '1',
  excludeReason = '',
}) {
  return [
    etn,
    '1',
    parcel,
    date,
    price,
    'Statutory Warranty Deed',
    'PRIVATE GRANTOR',
    'PRIVATE GRANTEE',
    valid,
    confirmed,
    excludeReason,
    'Improved',
    'Residential',
  ].join('|');
}

function taxRow(parcel, address = '123 TEST AVE') {
  return [
    parcel,
    'REAL',
    'LNDIM',
    address,
    '1101',
    'SINGLE FAMILY RESIDENCE',
    '2025',
    '001',
    '',
    '',
    '100000',
    '400000',
    '500000',
    '500000',
    '2026',
    '001',
    '',
    '',
    '110000',
    '440000',
    '550000',
    '550000',
    '03E',
    '20N',
    '01',
    'NE',
    'TEST PLAT',
    '',
  ].join('|');
}

async function createFixture() {
  const directory = await mkdtemp(join(tmpdir(), 'tf-pierce-sales-'));
  const saleArchive = Buffer.from('fixture-pierce-sale-zip');
  const taxArchive = Buffer.from('fixture-pierce-tax-zip');
  const sales =
    [
      saleRow({ etn: '20260818001', parcel: '1000000001' }),
      saleRow({ etn: '20260818002', parcel: '1000000002', valid: '0' }),
      saleRow({ etn: '20260818003', parcel: '1000000003', confirmed: '0' }),
      saleRow({ etn: '20260818004', parcel: '1000000004', excludeReason: 'Improved after sale' }),
      saleRow({ etn: '20260818005', parcel: '1000000005', price: '0.00' }),
      saleRow({ etn: '20230818001', parcel: '1000000006', date: '08/18/2023' }),
      saleRow({ etn: '20260818007', parcel: '1000000007' }),
      saleRow({ etn: '20260818007', parcel: '1000000008' }),
    ].join('\r\n') + '\r\n';
  const taxes =
    Array.from({ length: 8 }, (_, index) =>
      taxRow(`100000000${index + 1}`, `${index + 1} TEST AVE TACOMA WA 98402`)
    ).join('\r\n') + '\r\n';
  await Promise.all([
    writeFile(join(directory, 'sale.txt'), sales),
    writeFile(join(directory, 'sale.zip'), saleArchive),
    writeFile(join(directory, 'tax_account.txt'), taxes),
    writeFile(join(directory, 'tax_account.zip'), taxArchive),
  ]);
  const digest = value => createHash('sha256').update(value).digest('hex');
  const config = {
    schemaVersion: 'terrafusion.washington.public-source-set.v1',
    county: 'Pierce',
    countyCode: '053',
    officialSourceBaseUrl: 'https://www.co.pierce.wa.us',
    indexUrl: 'https://online.co.pierce.wa.us/cfapps/atr/datamart/downloads.cfm',
    publishedLabel: 'Fixture weekly extract',
    sourceDateRange: { start: '2024-01-01', end: '2026-08-18' },
    sources: [
      {
        key: 'sale',
        archiveFile: 'sale.zip',
        file: 'sale.txt',
        url: 'https://online.co.pierce.wa.us/datamart/sale.zip',
        finalUrl: 'https://online.co.pierce.wa.us/datamart/sale.zip',
        archiveSha256: digest(saleArchive),
        sha256: digest(sales),
      },
      {
        key: 'tax_account',
        archiveFile: 'tax_account.zip',
        file: 'tax_account.txt',
        url: 'https://online.co.pierce.wa.us/datamart/tax_account.zip',
        finalUrl: 'https://online.co.pierce.wa.us/datamart/tax_account.zip',
        archiveSha256: digest(taxArchive),
        sha256: digest(taxes),
      },
    ],
  };
  const configPath = join(directory, 'config.json');
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
  return { config, configPath, directory };
}

test('parses the exact Pierce pipe contracts and canonical calendar dates', () => {
  assert.equal(canonicalPierceSaleDate('08/18/2026'), '2026-08-18');
  assert.throws(() => canonicalPierceSaleDate('02/30/2026'), /real calendar date/);
  assert.equal(parsePiercePipeRows(saleRow({ etn: '1', parcel: '2' }), 13, 'sale').length, 1);
  assert.throws(() => parsePiercePipeRows('one|two', 13, 'sale'), /has 2 fields; expected 13/);
});

test('publishes only valid, confirmed, non-excluded sales and never retains names', async t => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.directory, { recursive: true, force: true }));
  const result = await buildPierceCountyPackage(
    fixture.directory,
    GENERATED_AT,
    fixture.configPath
  );

  assert.equal(result.receipt.candidateSales, 7);
  assert.equal(result.receipt.stagedSales, 1);
  assert.equal(result.receipt.quarantinedSales, 6);
  assert.deepEqual(
    {
      invalidSales: result.receipt.quarantine.invalidSales,
      unconfirmedSales: result.receipt.quarantine.unconfirmedSales,
      assessorExcludedSales: result.receipt.quarantine.assessorExcludedSales,
      nonPositiveSalePrice: result.receipt.quarantine.nonPositiveSalePrice,
      multiParcelSales: result.receipt.quarantine.multiParcelSales,
    },
    {
      invalidSales: 1,
      unconfirmedSales: 1,
      assessorExcludedSales: 1,
      nonPositiveSalePrice: 1,
      multiParcelSales: 2,
    }
  );
  assert.equal(result.receipt.quarantine.multiParcelTransactions.length, 1);
  assert.equal(result.receipt.quarantine.multiParcelTransactions[0].parcelCount, 2);
  const [record] = result.shard.records;
  assert.equal(record.county, 'Pierce');
  assert.equal(record.countyCode, '053');
  assert.equal(record.parcelNumber, '1000000001');
  assert.equal(record.situsAddress, '1 TEST AVE TACOMA WA 98402');
  assert.equal(record.salePrice, 625000);
  assert.equal(record.documentNumber, '20260818001');
  assert.equal(record.grantor, null);
  assert.equal(record.grantee, null);
  assert.equal(record.owner, undefined);
  assert.equal(record.taxpayer, undefined);
  assert.equal(JSON.stringify(result).includes('PRIVATE GRANTOR'), false);
  assert.equal(JSON.stringify(result).includes('PRIVATE GRANTEE'), false);
  assert.deepEqual(
    record.provenance.componentRows.map(component => component.sourcePayloadPath),
    ['sale.txt', 'tax_account.txt']
  );
});

test('rejects source or archive drift before parsing official records', async t => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.directory, { recursive: true, force: true }));
  await writeFile(join(fixture.directory, 'sale.txt'), 'changed');
  await assert.rejects(
    buildPierceCountyPackage(fixture.directory, GENERATED_AT, fixture.configPath),
    /sale extract does not match its SHA-256/
  );
});

test('rejects future-dated source rows even when they fall outside the configured study window', async t => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.directory, { recursive: true, force: true }));
  const salePath = join(fixture.directory, 'sale.txt');
  const body = await readFile(salePath, 'utf8');
  const futureBody = `${body}${saleRow({
    etn: '20270902001',
    parcel: '1000000001',
    date: '09/02/2027',
  })}\r\n`;
  await writeFile(salePath, futureBody);
  fixture.config.sources[0].sha256 = createHash('sha256').update(futureBody).digest('hex');
  await writeFile(fixture.configPath, `${JSON.stringify(fixture.config, null, 2)}\n`);
  await assert.rejects(
    buildPierceCountyPackage(fixture.directory, GENERATED_AT, fixture.configPath),
    /future-dated sale/
  );
});

test('rejects credential-bearing and non-county source URLs', async t => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.directory, { recursive: true, force: true }));
  fixture.config.sources[0].url = 'https://token:secret@online.co.pierce.wa.us/datamart/sale.zip';
  await writeFile(fixture.configPath, `${JSON.stringify(fixture.config, null, 2)}\n`);
  await assert.rejects(
    buildPierceCountyPackage(fixture.directory, GENERATED_AT, fixture.configPath),
    /outside the official county hosts/
  );
});
