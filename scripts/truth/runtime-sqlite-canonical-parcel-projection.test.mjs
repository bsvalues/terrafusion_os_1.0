#!/usr/bin/env node

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import {
  inspectCanonicalParcelProjectionSource,
  projectCanonicalParcelsFromProperties,
} from './runtime-sqlite-canonical-parcel-projection.mjs';

function makeDb() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tf-runtime-parcel-projection-'));
  const dbPath = path.join(root, 'terrafusion.db');
  const db = new DatabaseSync(dbPath);

  db.exec(`
    CREATE TABLE Counties (
      Id TEXT NOT NULL PRIMARY KEY,
      Name TEXT NOT NULL,
      State TEXT NOT NULL,
      FipsCode TEXT NOT NULL
    );

    CREATE TABLE Properties (
      Id TEXT NOT NULL PRIMARY KEY,
      PropertyId TEXT NOT NULL,
      ParcelId TEXT NOT NULL,
      ParcelNumber TEXT NOT NULL,
      Address TEXT NOT NULL,
      PropertyType TEXT NULL,
      TaxYear INTEGER NOT NULL,
      CountyId TEXT NOT NULL,
      LegalDescription TEXT NULL,
      UpdatedAt TEXT NOT NULL
    );
  `);

  db.prepare('INSERT INTO Counties (Id, Name, State, FipsCode) VALUES (?, ?, ?, ?)').run(
    'benton-county',
    'Benton',
    'WA',
    '53005'
  );

  const insert = db.prepare(`
    INSERT INTO Properties
      (Id, PropertyId, ParcelId, ParcelNumber, Address, PropertyType, TaxYear, CountyId, LegalDescription, UpdatedAt)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insert.run(
    'old-1',
    'P-OLD',
    'OLD',
    '1001',
    'Old Address',
    'R',
    2015,
    'benton-county',
    null,
    '2015-01-01T00:00:00Z'
  );
  insert.run(
    'new-1',
    'P-1',
    '1',
    '1001',
    'Current Address 1',
    'R',
    2026,
    'benton-county',
    'Legal 1',
    '2026-01-01T00:00:00Z'
  );
  insert.run(
    'new-2',
    'P-2',
    '2',
    '1002',
    'Current Address 2',
    'P',
    2026,
    'benton-county',
    null,
    '2026-01-02T00:00:00Z'
  );
  insert.run(
    'dup-old',
    'P-3',
    '3',
    '1002',
    'Current Address 2 stale',
    'P',
    2026,
    'benton-county',
    null,
    '2026-01-01T00:00:00Z'
  );

  db.close();
  return dbPath;
}

test('inspects current-year distinct parcel source without counting historical Properties rows', () => {
  const dbPath = makeDb();

  const source = inspectCanonicalParcelProjectionSource({ dbPath, countyFips: '53005' });

  assert.equal(source.sourceTable, 'Properties');
  assert.equal(source.targetTable, 'tf_parcel');
  assert.equal(source.taxYear, 2026);
  assert.equal(source.sourceRows, 3);
  assert.equal(source.distinctParcelNumbers, 2);
  assert.equal(source.historicalRowsExcluded, 1);
});

test('projects current-year distinct Properties into governed tf_parcel rows', () => {
  const dbPath = makeDb();

  const result = projectCanonicalParcelsFromProperties({
    dbPath,
    countyFips: '53005',
    write: true,
  });

  assert.equal(result.projectedRows, 2);
  assert.equal(result.expectedBentonParcelCount, 2);
  assert.equal(result.projectionStatus, 'projected');

  const db = new DatabaseSync(dbPath);
  const rows = db
    .prepare(
      'SELECT ParcelNumber, SitusAddress, ParcelStatus, PropertyType, ConversionEra FROM tf_parcel ORDER BY ParcelNumber'
    )
    .all()
    .map(row => ({ ...row }));
  db.close();

  assert.deepEqual(rows, [
    {
      ParcelNumber: '1001',
      SitusAddress: 'Current Address 1',
      ParcelStatus: 'ACTIVE',
      PropertyType: 'R',
      ConversionEra: 'PRODUCT_2026',
    },
    {
      ParcelNumber: '1002',
      SitusAddress: 'Current Address 2',
      ParcelStatus: 'ACTIVE',
      PropertyType: 'P',
      ConversionEra: 'PRODUCT_2026',
    },
  ]);
});

test('refuses to overwrite existing county projection unless replace is explicit', () => {
  const dbPath = makeDb();
  projectCanonicalParcelsFromProperties({ dbPath, countyFips: '53005', write: true });

  assert.throws(
    () => projectCanonicalParcelsFromProperties({ dbPath, countyFips: '53005', write: true }),
    /tf_parcel already contains/
  );
});

test('fails closed when the TerraFusion SQLite DB path is missing', () => {
  assert.throws(
    () =>
      inspectCanonicalParcelProjectionSource({
        dbPath: path.join(os.tmpdir(), `missing-${Date.now()}.db`),
        countyFips: '53005',
      }),
    /TerraFusion SQLite DB not found/
  );
});
