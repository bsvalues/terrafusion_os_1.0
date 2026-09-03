import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  findLewisExciseCollisions,
  projectLewisPdfRow,
  buildLewisCountyPackage,
} from './lewis_public_sales.mjs';

const GENERATED_AT = '2026-09-02T23:45:00.000Z';

function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

function item(text, x) {
  return { text, x, y: 100 };
}

test('projects the fixed Lewis PDF row without treating school district as city', () => {
  const candidate = projectLewisPdfRow(
    [
      item('018106003002', 52),
      item('1151', 118),
      item('RES', 145),
      item('340239', 175),
      item('SWD', 222),
      item('AA', 251),
      item('N', 279),
      item('Y', 312),
      item('31-Dec-24', 356),
      item('283000 481 KIRKLAND RD', 410),
      item('CHEHALIS', 580),
      item('2.5', 650),
      item('0 300', 695),
    ],
    7,
    2
  );

  assert.deepEqual(candidate, {
    ordinal: 188,
    pageNumber: 7,
    pageRow: 2,
    parcelNumber: '018106003002',
    neighborhoodCode: '1151',
    propertyType: 'RES',
    exciseId: '340239',
    deedType: 'SWD',
    verificationCode: 'AA',
    multiParcel: 'N',
    benchmark: 'Y',
    saleDate: '2024-12-31',
    salePrice: 283000,
    situsAddress: '481 KIRKLAND RD',
    schoolDistrict: 'CHEHALIS',
    acres: 2.5,
  });
  assert.equal(candidate.situsCity, undefined);
});

test('identifies excise references that contradict across parcels', () => {
  const collisions = findLewisExciseCollisions([
    { exciseId: '340239', parcelNumber: '018106003002' },
    { exciseId: '340239', parcelNumber: '018106003003' },
    { exciseId: 'same-parcel', parcelNumber: '123456789012' },
    { exciseId: 'same-parcel', parcelNumber: '123456789012' },
    { exciseId: null, parcelNumber: '999999999999' },
  ]);

  assert.deepEqual([...collisions.keys()], ['340239']);
  assert.deepEqual([...collisions.get('340239').parcels].sort(), ['018106003002', '018106003003']);
  assert.equal(collisions.get('340239').rowCount, 2);
});

test('rejects source digest drift and credential-bearing county URLs before PDF parsing', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'tf-lewis-sales-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const sales = Buffer.from('not a sales PDF');
  const legend = Buffer.from('not a legend PDF');
  await Promise.all([
    writeFile(join(directory, 'sales.pdf'), sales),
    writeFile(join(directory, 'legend.pdf'), legend),
  ]);
  const config = {
    schemaVersion: 'terrafusion.washington.public-source-set.v1',
    county: 'Lewis',
    countyCode: '041',
    officialSourceBaseUrl: 'https://lewiscountywa.gov/offices/assessor/',
    indexUrl:
      'https://lewiscountywa.gov/offices/assessor/sales-data/2024-sales-for-2025-assessments-for-the-2026-tax-year/',
    publishedLabel: 'fixture',
    sourceDateRange: { start: '2024-01-01', end: '2024-12-31' },
    sources: [
      {
        key: 'sales',
        file: 'sales.pdf',
        url: 'https://lewiscountywa.gov/documents/17288/2024_All_Sales_All_County.pdf',
        finalUrl: 'https://lewiscountywa.gov/documents/17288/2024_All_Sales_All_County.pdf',
        sha256: '0'.repeat(64),
      },
      {
        key: 'legend',
        file: 'legend.pdf',
        url: 'https://lewiscountywa.gov/documents/12617/Web_Sales_Information_v7Ega81.pdf',
        finalUrl: 'https://lewiscountywa.gov/documents/12617/Web_Sales_Information_v7Ega81.pdf',
        sha256: digest(legend),
      },
    ],
  };
  const configPath = join(directory, 'config.json');
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
  await assert.rejects(
    buildLewisCountyPackage(directory, GENERATED_AT, configPath),
    /sales PDF does not match its SHA-256/
  );

  config.sources[0].sha256 = digest(sales);
  config.sources[0].url =
    'https://private-user:private-secret@lewiscountywa.gov/documents/17288/2024_All_Sales_All_County.pdf';
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
  await assert.rejects(buildLewisCountyPackage(directory, GENERATED_AT, configPath), error => {
    assert.match(error.message, /outside the official county host/);
    assert.doesNotMatch(error.message, /private-(user|secret)/);
    return true;
  });
});
