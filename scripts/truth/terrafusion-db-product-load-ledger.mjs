#!/usr/bin/env node

/**
 * TerraFusion DB Product Load Ledger
 *
 * Reads the TerraFusion runtime database only. It does not connect to upstream
 * source systems, does not require bridge credentials, and does not mutate rows.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const truthDir = path.join(repoRoot, 'generated', 'truth');
const outJson = path.join(truthDir, 'terrafusion-db-product-load-ledger.json');
const outMd = path.join(truthDir, 'terrafusion-db-product-load-ledger.md');

const pgContainer = process.env.TF_PG_CONTAINER ?? 'terrafusion-postgres-dev';
const pgDatabase = process.env.TF_PG_DATABASE ?? 'terrafusion';
const pgUser = process.env.TF_PG_USER ?? 'postgres';
const fixturePath = process.env.TF_PRODUCT_LOAD_LEDGER_FIXTURE
  ? path.resolve(process.env.TF_PRODUCT_LOAD_LEDGER_FIXTURE)
  : null;

const PRODUCT_TABLES = [
  {
    tableName: 'Properties',
    productDomain: 'parcel',
    productTimestampColumns: ['UpdatedAt', 'LastUpdated', 'CreatedAt', 'AssessmentDate'],
    sourceTableName: 'pacs_property_profiles',
    sourceTimestampColumns: ['LastPacsSync'],
  },
  {
    tableName: 'ComparableSales',
    productDomain: 'sales',
    productTimestampColumns: ['IngestedAt', 'DecisionAt', 'SaleDate'],
    sourceTableName: 'pacs_sales',
    sourceTimestampColumns: ['LastPacsSync', 'ImportDate'],
  },
  {
    tableName: 'CanonicalSaleQualifications',
    productDomain: 'qualified_sales',
    productTimestampColumns: ['UpdatedAt', 'CreatedAt', 'SourceWorkbookLockedAt'],
    sourceTableName: null,
    sourceTimestampColumns: [],
  },
  {
    tableName: 'CamaCharacteristics',
    productDomain: 'costforge',
    productTimestampColumns: ['UpdatedAt', 'CreatedAt'],
    sourceTableName: null,
    sourceTimestampColumns: [],
  },
  {
    tableName: 'ImprovementDetails',
    productDomain: 'costforge',
    productTimestampColumns: ['UpdatedAt', 'CreatedAt'],
    sourceTableName: 'pacs_improvement_details',
    sourceTimestampColumns: ['LastPacsSync'],
  },
  {
    tableName: 'LandSegments',
    productDomain: 'costforge',
    productTimestampColumns: ['UpdatedAt', 'CreatedAt'],
    sourceTableName: 'pacs_land_details',
    sourceTimestampColumns: ['LastPacsSync'],
  },
  {
    tableName: 'GisParcelGeometries',
    productDomain: 'atlas',
    productTimestampColumns: ['SyncedAt', 'UpdatedAt', 'CreatedAt'],
    sourceTableName: null,
    sourceTimestampColumns: [],
  },
  {
    tableName: 'DossierPackets',
    productDomain: 'dossier',
    productTimestampColumns: ['UpdatedAt', 'CreatedAt'],
    sourceTableName: null,
    sourceTimestampColumns: [],
  },
  {
    tableName: 'CountyDownstreamClosureReceipts',
    productDomain: 'dais',
    productTimestampColumns: ['UpdatedAt', 'ReturnedAtUtc', 'OpenedAtUtc', 'CreatedAt'],
    sourceTableName: null,
    sourceTimestampColumns: [],
  },
  {
    tableName: 'CountyApplyHandoffReceipts',
    productDomain: 'dossier',
    productTimestampColumns: [
      'UpdatedAt',
      'AppliedAtUtc',
      'RolledBackAtUtc',
      'OpenedAtUtc',
      'CreatedAt',
    ],
    sourceTableName: null,
    sourceTimestampColumns: [],
  },
];

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, '/');
}

function psql(sql) {
  return execFileSync(
    'docker',
    ['exec', pgContainer, 'psql', '-U', pgUser, '-d', pgDatabase, '-t', '-A', '-F', '|', '-c', sql],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
  ).trim();
}

function parseIso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function latest(...values) {
  const dates = values.map(parseIso).filter(Boolean);
  if (dates.length === 0) return null;
  return dates.sort().at(-1);
}

function quoteIdent(name) {
  return `"${String(name).replaceAll('"', '""')}"`;
}

function tableExists(tableName) {
  const result = psql(
    `select exists(select 1 from information_schema.tables where table_schema='public' and table_name='${tableName.replaceAll("'", "''")}');`
  );
  return result === 't';
}

function existingColumns(tableName) {
  const result = psql(
    `select column_name from information_schema.columns where table_schema='public' and table_name='${tableName.replaceAll("'", "''")}';`
  );
  return new Set(
    result
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
  );
}

function countRows(tableName) {
  const result = psql(`select count(*) from ${quoteIdent(tableName)};`);
  const parsed = Number.parseInt(result, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function maxColumn(tableName, columnName) {
  const result = psql(`select max(${quoteIdent(columnName)}) from ${quoteIdent(tableName)};`);
  return parseIso(result);
}

function latestColumnTimestamp(tableName, candidates) {
  const columns = existingColumns(tableName);
  return latest(
    ...candidates.filter(column => columns.has(column)).map(column => maxColumn(tableName, column))
  );
}

function latestEtlCompletedAt() {
  if (!tableExists('EtlSyncJobs')) return null;
  const columns = existingColumns('EtlSyncJobs');
  if (!columns.has('CompletedAt')) return null;
  return maxColumn('EtlSyncJobs', 'CompletedAt');
}

function latestProductLoadReceiptAtFor(_tableName) {
  if (!tableExists('ProductLoadReceipts')) return null;
  return null;
}

function buildRowsFromDatabase() {
  const globalEtlCompletedAt = latestEtlCompletedAt();
  const rows = PRODUCT_TABLES.map(definition => {
    if (!tableExists(definition.tableName)) {
      return evaluateProductLoadLineage({
        tableName: definition.tableName,
        productDomain: definition.productDomain,
        rowCount: null,
        latestProductUpdatedAt: null,
        latestSourceSyncAt: null,
        latestEtlCompletedAt: null,
        latestProductLoadReceiptAt: null,
      });
    }

    const sourceExists = definition.sourceTableName
      ? tableExists(definition.sourceTableName)
      : false;

    return evaluateProductLoadLineage({
      tableName: definition.tableName,
      productDomain: definition.productDomain,
      rowCount: countRows(definition.tableName),
      latestProductUpdatedAt: latestColumnTimestamp(
        definition.tableName,
        definition.productTimestampColumns
      ),
      latestSourceSyncAt: sourceExists
        ? latestColumnTimestamp(definition.sourceTableName, definition.sourceTimestampColumns)
        : null,
      latestEtlCompletedAt: globalEtlCompletedAt,
      latestProductLoadReceiptAt: latestProductLoadReceiptAtFor(definition.tableName),
    });
  });

  return { rows, globalEtlCompletedAt };
}

function evaluateProductLoadLineage(row) {
  const blockers = [];
  const warnings = [];

  if (row.rowCount === null) {
    blockers.push('Table missing or unreadable.');
    return { ...row, lineageStatus: 'missing_table', blockers, warnings };
  }

  if (row.rowCount === 0) {
    blockers.push('Table exists but is empty.');
    return { ...row, lineageStatus: 'empty_table', blockers, warnings };
  }

  if (!row.latestProductLoadReceiptAt) {
    blockers.push('Rows exist but no product load receipt proves lineage.');
    if (row.latestSourceSyncAt) {
      warnings.push('Source/cache timestamp exists, but it is not a product-load receipt.');
    }
    if (row.latestEtlCompletedAt) {
      warnings.push('ETL timestamp exists, but it is not linked to this product table load.');
    }
    return {
      ...row,
      lineageStatus: 'rows_exist_lineage_unproven',
      blockers,
      warnings,
    };
  }

  return {
    ...row,
    lineageStatus: 'lineage_proven',
    blockers,
    warnings,
  };
}

function summarize(rows) {
  return {
    productTablesChecked: rows.length,
    lineageProven: rows.filter(row => row.lineageStatus === 'lineage_proven').length,
    rowsExistLineageUnproven: rows.filter(
      row => row.lineageStatus === 'rows_exist_lineage_unproven'
    ).length,
    emptyTables: rows.filter(row => row.lineageStatus === 'empty_table').length,
    missingTables: rows.filter(row => row.lineageStatus === 'missing_table').length,
    blockers: rows.reduce((sum, row) => sum + row.blockers.length, 0),
    warnings: rows.reduce((sum, row) => sum + row.warnings.length, 0),
  };
}

function renderMarkdown(report) {
  return [
    '# TerraFusion DB Product Load Ledger',
    '',
    `Generated: ${report.generatedAt}`,
    `Database: \`${report.database.database}\``,
    `Container: \`${report.database.container}\``,
    '',
    '## Summary',
    '',
    `- Result: ${report.passed ? 'PASS' : 'FAIL'}`,
    `- Product tables checked: ${report.summary.productTablesChecked}`,
    `- Lineage proven: ${report.summary.lineageProven}`,
    `- Rows exist, lineage unproven: ${report.summary.rowsExistLineageUnproven}`,
    `- Empty tables: ${report.summary.emptyTables}`,
    `- Missing tables: ${report.summary.missingTables}`,
    `- Latest ETL completed at: ${report.globalEtlCompletedAt ?? '-'}`,
    '',
    '## Ledger',
    '',
    '| Table | Domain | Rows | Product Updated | Source/Cache Sync | ETL Completed | Product Load Receipt | Status | Blockers |',
    '|---|---|---:|---|---|---|---|---|---|',
    ...report.rows.map(row =>
      [
        `\`${row.tableName}\``,
        row.productDomain,
        row.rowCount === null ? '-' : String(row.rowCount),
        row.latestProductUpdatedAt ?? '-',
        row.latestSourceSyncAt ?? '-',
        row.latestEtlCompletedAt ?? '-',
        row.latestProductLoadReceiptAt ?? '-',
        row.lineageStatus,
        row.blockers.length ? row.blockers.join('<br>') : '-',
      ].join(' | ')
    ),
    '',
    '## Warnings',
    '',
    ...report.rows.flatMap(row => row.warnings.map(warning => `- ${row.tableName}: ${warning}`)),
    report.rows.some(row => row.warnings.length) ? '' : '- none',
    '',
    '## Trust Rule',
    '',
    'Rows in TerraFusion DB are runtime-present only when no product-load receipt exists. June 10 readiness must not treat runtime-present rows as lineage-proven rows.',
  ].join('\n');
}

function buildReport() {
  if (fixturePath) {
    const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
    const rows = fixture.rows.map(evaluateProductLoadLineage);
    return {
      rows,
      globalEtlCompletedAt: fixture.globalEtlCompletedAt ?? null,
      database: fixture.database ?? {
        container: 'fixture',
        database: 'fixture',
        user: 'fixture',
      },
    };
  }

  return {
    ...buildRowsFromDatabase(),
    database: {
      container: pgContainer,
      database: pgDatabase,
      user: pgUser,
    },
  };
}

function main() {
  const built = buildReport();
  const summary = summarize(built.rows);
  const report = {
    generatedAt: new Date().toISOString(),
    database: built.database,
    globalEtlCompletedAt: built.globalEtlCompletedAt,
    summary,
    rows: built.rows,
    passed: summary.blockers === 0,
  };

  fs.mkdirSync(truthDir, { recursive: true });
  fs.writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(outMd, `${renderMarkdown(report)}\n`);

  console.log(`Wrote ${rel(outJson)}`);
  console.log(`Wrote ${rel(outMd)}`);
  console.log(JSON.stringify({ passed: report.passed, ...summary }, null, 2));

  if (!report.passed) process.exitCode = 1;
}

main();
