#!/usr/bin/env node

/**
 * Runtime SQLite Canonical Parcel Projection
 *
 * Creates the SQLite-flattened canonical runtime parcel table
 * (`tf_parcel`) from current-year distinct TerraFusion `Properties`
 * rows. This reads and writes TerraFusion DB only; it does not inspect
 * upstream source systems or bridge credentials.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const repoRoot = process.cwd();
const __filename = fileURLToPath(import.meta.url);
const outJson = path.join(
  repoRoot,
  'generated',
  'truth',
  'runtime-sqlite-canonical-parcel-projection.json'
);
const outMd = path.join(
  repoRoot,
  'generated',
  'truth',
  'runtime-sqlite-canonical-parcel-projection.md'
);

function tableExists(db, tableName) {
  return Boolean(
    db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1").get(tableName)
  );
}

function requireTable(db, tableName) {
  if (!tableExists(db, tableName)) {
    throw new Error(`Required TerraFusion DB table is missing: ${tableName}`);
  }
}

function requireExistingDb(dbPath) {
  if (!dbPath || !fs.existsSync(dbPath) || !fs.statSync(dbPath).isFile()) {
    throw new Error(`TerraFusion SQLite DB not found: ${dbPath}`);
  }
}

function count(db, sql, ...params) {
  return Number(db.prepare(sql).get(...params)?.value ?? 0);
}

function resolveTaxYear(db, countyFips, requestedTaxYear = null) {
  if (requestedTaxYear !== null && requestedTaxYear !== undefined) {
    const parsed = Number.parseInt(String(requestedTaxYear), 10);
    if (!Number.isFinite(parsed) || parsed <= 0)
      throw new Error(`Invalid tax year: ${requestedTaxYear}`);
    return parsed;
  }

  const row = db
    .prepare(
      `
      SELECT MAX(p.TaxYear) AS value
      FROM Properties p
      JOIN Counties c ON c.Id = p.CountyId
      WHERE c.FipsCode = ?
        AND p.ParcelNumber IS NOT NULL
        AND trim(p.ParcelNumber) <> ''
      `
    )
    .get(countyFips);
  const taxYear = Number(row?.value ?? 0);
  if (!Number.isFinite(taxYear) || taxYear <= 0) {
    throw new Error(`No current tax year could be resolved for county FIPS ${countyFips}.`);
  }
  return taxYear;
}

export function inspectCanonicalParcelProjectionSource({
  dbPath,
  countyFips = '53005',
  taxYear = null,
}) {
  requireExistingDb(dbPath);
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    requireTable(db, 'Counties');
    requireTable(db, 'Properties');

    const resolvedTaxYear = resolveTaxYear(db, countyFips, taxYear);
    const county = db
      .prepare('SELECT Id, Name, FipsCode FROM Counties WHERE FipsCode = ? LIMIT 1')
      .get(countyFips);
    if (!county) throw new Error(`County FIPS ${countyFips} was not found in Counties.`);

    const totalCountyRows = count(
      db,
      `
      SELECT COUNT(*) AS value
      FROM Properties p
      WHERE p.CountyId = ?
      `,
      county.Id
    );
    const sourceRows = count(
      db,
      `
      SELECT COUNT(*) AS value
      FROM Properties p
      WHERE p.CountyId = ?
        AND p.TaxYear = ?
        AND p.ParcelNumber IS NOT NULL
        AND trim(p.ParcelNumber) <> ''
      `,
      county.Id,
      resolvedTaxYear
    );
    const distinctParcelNumbers = count(
      db,
      `
      SELECT COUNT(DISTINCT p.ParcelNumber) AS value
      FROM Properties p
      WHERE p.CountyId = ?
        AND p.TaxYear = ?
        AND p.ParcelNumber IS NOT NULL
        AND trim(p.ParcelNumber) <> ''
      `,
      county.Id,
      resolvedTaxYear
    );
    const duplicateGroups = count(
      db,
      `
      SELECT COUNT(*) AS value
      FROM (
        SELECT p.ParcelNumber
        FROM Properties p
        WHERE p.CountyId = ?
          AND p.TaxYear = ?
          AND p.ParcelNumber IS NOT NULL
          AND trim(p.ParcelNumber) <> ''
        GROUP BY p.ParcelNumber
        HAVING COUNT(*) > 1
      ) d
      `,
      county.Id,
      resolvedTaxYear
    );
    const existingTargetRows = tableExists(db, 'tf_parcel')
      ? count(db, 'SELECT COUNT(*) AS value FROM tf_parcel WHERE CountyId = ?', county.Id)
      : 0;

    return {
      sourceTable: 'Properties',
      targetTable: 'tf_parcel',
      countyId: county.Id,
      countyName: county.Name,
      countyFips: county.FipsCode,
      taxYear: resolvedTaxYear,
      totalCountyRows,
      sourceRows,
      distinctParcelNumbers,
      duplicateParcelNumberGroups: duplicateGroups,
      historicalRowsExcluded: totalCountyRows - sourceRows,
      existingTargetRows,
    };
  } finally {
    db.close();
  }
}

function createTfParcelTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tf_parcel (
      TfParcelId TEXT NOT NULL PRIMARY KEY,
      CountyId TEXT NOT NULL,
      ParcelNumber TEXT NULL,
      SitusAddress TEXT NULL,
      LegalDescription TEXT NULL,
      ParcelStatus TEXT NOT NULL,
      PropertyType TEXT NULL,
      CurrentOwnerId TEXT NULL,
      CurrentAssessmentId TEXT NULL,
      ConversionEra TEXT NULL,
      CreatedAt TEXT NOT NULL,
      UpdatedAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS IX_tf_parcel_CountyId_ParcelNumber
      ON tf_parcel (CountyId, ParcelNumber);

    CREATE INDEX IF NOT EXISTS IX_tf_parcel_CountyId_ParcelStatus
      ON tf_parcel (CountyId, ParcelStatus);

    CREATE INDEX IF NOT EXISTS ix_tf_parcel_conversion_era
      ON tf_parcel (ConversionEra);
  `);
}

function selectProjectionRows(db, countyId, taxYear) {
  return db
    .prepare(
      `
      WITH ranked AS (
        SELECT
          p.CountyId,
          p.ParcelNumber,
          p.Address,
          p.LegalDescription,
          p.PropertyType,
          p.UpdatedAt,
          ROW_NUMBER() OVER (
            PARTITION BY p.ParcelNumber
            ORDER BY datetime(p.UpdatedAt) DESC, p.Id DESC
          ) AS rn
        FROM Properties p
        WHERE p.CountyId = ?
          AND p.TaxYear = ?
          AND p.ParcelNumber IS NOT NULL
          AND trim(p.ParcelNumber) <> ''
      )
      SELECT CountyId, ParcelNumber, Address, LegalDescription, PropertyType
      FROM ranked
      WHERE rn = 1
      ORDER BY ParcelNumber
      `
    )
    .all(countyId, taxYear);
}

export function projectCanonicalParcelsFromProperties({
  dbPath,
  countyFips = '53005',
  taxYear = null,
  write = false,
  replace = false,
}) {
  const source = inspectCanonicalParcelProjectionSource({ dbPath, countyFips, taxYear });
  if (source.distinctParcelNumbers <= 0) {
    throw new Error(
      `No source parcel rows found for ${source.countyName} tax year ${source.taxYear}.`
    );
  }
  if (!write) {
    return {
      ...source,
      expectedBentonParcelCount: source.distinctParcelNumbers,
      projectionStatus: 'dry_run',
      projectedRows: 0,
    };
  }

  const db = new DatabaseSync(dbPath);
  try {
    createTfParcelTable(db);
    const existingRows = count(
      db,
      'SELECT COUNT(*) AS value FROM tf_parcel WHERE CountyId = ?',
      source.countyId
    );
    if (existingRows > 0 && !replace) {
      throw new Error(
        `tf_parcel already contains ${existingRows} row(s) for ${source.countyName}. Re-run with --replace to rebuild this county projection.`
      );
    }

    const now = new Date().toISOString();
    const conversionEra = `PRODUCT_${source.taxYear}`;
    const rows = selectProjectionRows(db, source.countyId, source.taxYear);
    const insert = db.prepare(`
      INSERT INTO tf_parcel
        (TfParcelId, CountyId, ParcelNumber, SitusAddress, LegalDescription, ParcelStatus, PropertyType, CurrentOwnerId, CurrentAssessmentId, ConversionEra, CreatedAt, UpdatedAt)
      VALUES
        (?, ?, ?, ?, ?, 'ACTIVE', ?, NULL, NULL, ?, ?, ?)
    `);

    db.exec('BEGIN IMMEDIATE');
    try {
      if (replace) {
        db.prepare('DELETE FROM tf_parcel WHERE CountyId = ?').run(source.countyId);
      }
      for (const row of rows) {
        insert.run(
          randomUUID().toUpperCase(),
          row.CountyId,
          row.ParcelNumber,
          row.Address,
          row.LegalDescription,
          row.PropertyType,
          conversionEra,
          now,
          now
        );
      }
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }

    const projectedRows = count(
      db,
      'SELECT COUNT(*) AS value FROM tf_parcel WHERE CountyId = ?',
      source.countyId
    );
    return {
      ...source,
      expectedBentonParcelCount: source.distinctParcelNumbers,
      projectionStatus: 'projected',
      projectedRows,
      conversionEra,
    };
  } finally {
    db.close();
  }
}

function parseArgs(argv) {
  const args = {
    dbPath: process.env.TF_RUNTIME_SQLITE_DB_PATH ?? null,
    countyFips: process.env.TF_RUNTIME_PROJECTION_COUNTY_FIPS ?? '53005',
    taxYear: process.env.TF_RUNTIME_PROJECTION_TAX_YEAR ?? null,
    write: false,
    replace: false,
    outJson,
    outMd,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--db') args.dbPath = path.resolve(argv[++i]);
    else if (arg === '--county-fips') args.countyFips = argv[++i];
    else if (arg === '--tax-year') args.taxYear = argv[++i];
    else if (arg === '--write') args.write = true;
    else if (arg === '--replace') args.replace = true;
    else if (arg === '--out-json') args.outJson = path.resolve(argv[++i]);
    else if (arg === '--out-md') args.outMd = path.resolve(argv[++i]);
  }

  if (!args.dbPath) throw new Error('Missing --db or TF_RUNTIME_SQLITE_DB_PATH.');
  return args;
}

function renderMarkdown(report) {
  return [
    '# Runtime SQLite Canonical Parcel Projection',
    '',
    `Generated: ${report.generatedAt}`,
    `Database: \`${report.dbPath}\``,
    '',
    '## Decision',
    '',
    `- Status: ${report.projectionStatus}`,
    `- County: ${report.countyName} (${report.countyFips})`,
    `- Source table: ${report.sourceTable}`,
    `- Target table: ${report.targetTable}`,
    `- Tax year: ${report.taxYear}`,
    `- Source rows for tax year: ${report.sourceRows}`,
    `- Distinct parcel numbers: ${report.distinctParcelNumbers}`,
    `- Historical rows excluded: ${report.historicalRowsExcluded}`,
    `- Duplicate source groups: ${report.duplicateParcelNumberGroups}`,
    `- Projected rows: ${report.projectedRows}`,
    `- Expected Benton parcel count: ${report.expectedBentonParcelCount}`,
    '',
    '## Trust Rule',
    '',
    'This projection is TerraFusion DB internal only. Raw historical `Properties` rows are not counted as active canonical parcels.',
  ].join('\n');
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const result = projectCanonicalParcelsFromProperties(args);
  const report = {
    generatedAt: new Date().toISOString(),
    dbPath: args.dbPath,
    ...result,
  };

  fs.mkdirSync(path.dirname(args.outJson), { recursive: true });
  fs.writeFileSync(args.outJson, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(args.outMd, `${renderMarkdown(report)}\n`);

  console.log(
    JSON.stringify(
      {
        projectionStatus: report.projectionStatus,
        county: report.countyName,
        taxYear: report.taxYear,
        expectedBentonParcelCount: report.expectedBentonParcelCount,
        projectedRows: report.projectedRows,
        output: path.relative(repoRoot, args.outJson).replaceAll(path.sep, '/'),
      },
      null,
      2
    )
  );

  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
