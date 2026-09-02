import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  buildThurstonCountyPackage,
  projectThurstonPublicCandidate,
} from './thurston_public_sales.mjs';

const GENERATED_AT = '2026-09-02T22:00:00.000Z';

function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

test('projects only public assessor fields at the APTE parser boundary', () => {
  const candidate = projectThurstonPublicCandidate(
    {
      PARCEL_NO: '12345678900',
      ADDRESS1: 'PRIVATE OWNER MAILING ADDRESS',
      ADDRESS2: 'PRIVATE OWNER MAILING ADDRESS 2',
      CITY: 'PRIVATE MAILING CITY',
      STATE: 'OR',
      ZIP: '97000',
      COUNTRY: 'US',
      LEGAL_DESC: 'PRIVATE LEGAL DESCRIPTION',
      SITUS_STRE: '100 CAPITOL WAY N',
      SITUS_CITY: 'OLYMPIA',
      SITUS_ZIP: '98501',
      TOTAL_ACRE: '0.50',
      STATUS_IND: 'A',
      PROP_SUBTY: '11',
      O_NEIGHBOR: '1001',
      PROP_TYPE: 'RES',
      REC_VOLPAG: '5123456',
      MULT_PARCL: 'N',
      SALE_DATE: '2026-07-01',
      SALE_PRICE: '500000',
      SALE_VRFY: 'AA',
      CURR_USE: 'N',
      YEAR_BUILT: '2020',
    },
    17
  );

  assert.deepEqual(candidate, {
    ordinal: 17,
    parcelNumber: '12345678900',
    saleDate: '2026-07-01',
    salePrice: 500000,
    verificationCode: 'AA',
    multiParcel: 'N',
    status: 'A',
    recordingReference: '5123456',
    situsAddress: '100 CAPITOL WAY N',
    situsCity: 'OLYMPIA',
    situsZip: '98501',
    propertyType: 'RES',
    propertySubtype: '11',
    currentUse: 'N',
    neighborhoodCode: '1001',
    acres: 0.5,
    yearBuilt: 2020,
  });
  assert.doesNotMatch(JSON.stringify(candidate), /PRIVATE/);
});

test('rejects source digest drift and credential-bearing county URLs before APTE parsing', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'tf-thurston-sales-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const database = Buffer.from('not an Access database');
  const archive = Buffer.from('fixture archive');
  await Promise.all([
    writeFile(join(directory, 'apte.accdb'), database),
    writeFile(join(directory, 'thurston-apte.zip'), archive),
  ]);
  const config = {
    schemaVersion: 'terrafusion.washington.public-source-set.v1',
    county: 'Thurston',
    countyCode: '067',
    officialSourceBaseUrl: 'https://www.co.thurston.wa.us',
    indexUrl: 'https://www.thurstoncountywa.gov/assessor-database-extracts',
    publishedLabel: 'fixture',
    sourceDateRange: { start: '2024-01-01', end: '2026-07-29' },
    sources: [
      {
        key: 'assessor',
        archiveFile: 'thurston-apte.zip',
        file: 'apte.accdb',
        url: 'https://map.co.thurston.wa.us/assessors/apte.zip',
        finalUrl: 'https://map.co.thurston.wa.us/assessors/apte.zip',
        archiveSha256: digest(archive),
        sha256: '0'.repeat(64),
      },
    ],
  };
  const configPath = join(directory, 'config.json');
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
  await assert.rejects(
    buildThurstonCountyPackage(directory, GENERATED_AT, configPath),
    /APTE database does not match its SHA-256/
  );

  config.sources[0].sha256 = digest(database);
  config.sources[0].url =
    'https://private-user:private-secret@map.co.thurston.wa.us/assessors/apte.zip';
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
  await assert.rejects(buildThurstonCountyPackage(directory, GENERATED_AT, configPath), error => {
    assert.match(error.message, /outside the official county hosts/);
    assert.doesNotMatch(error.message, /private-(user|secret)/);
    return true;
  });
});
