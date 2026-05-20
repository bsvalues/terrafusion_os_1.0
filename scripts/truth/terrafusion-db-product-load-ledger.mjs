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
    tableName: 'canonical_tf.tf_parcel',
    productDomain: 'parcel',
    loadRequirement: 'seed_required',
    productTimestampColumns: ['UpdatedAt', 'CreatedAt', 'ImportedAt'],
    sourceTableName: 'pacs_property_profiles',
    sourceTimestampColumns: ['LastPacsSync'],
  },
  {
    tableName: 'canonical_tf.tf_sale',
    productDomain: 'sales',
    loadRequirement: 'seed_required',
    productTimestampColumns: ['UpdatedAt', 'CreatedAt', 'ImportedAt', 'SaleDate'],
    sourceTableName: 'pacs_sales',
    sourceTimestampColumns: ['LastPacsSync', 'ImportDate'],
  },
  {
    tableName: 'CanonicalSaleQualifications',
    productDomain: 'qualified_sales',
    loadRequirement: 'seed_required',
    productTimestampColumns: ['UpdatedAt', 'CreatedAt', 'SourceWorkbookLockedAt'],
    sourceTableName: null,
    sourceTimestampColumns: [],
  },
  {
    tableName: 'CamaCharacteristics',
    productDomain: 'costforge',
    loadRequirement: 'seed_required',
    productTimestampColumns: ['UpdatedAt', 'CreatedAt'],
    sourceTableName: null,
    sourceTimestampColumns: [],
  },
  {
    tableName: 'canonical_tf.tf_improvement',
    productDomain: 'costforge',
    loadRequirement: 'seed_required',
    productTimestampColumns: ['UpdatedAt', 'CreatedAt'],
    sourceTableName: null,
    sourceTimestampColumns: [],
  },
  {
    tableName: 'canonical_tf.tf_land',
    productDomain: 'costforge',
    loadRequirement: 'seed_required',
    productTimestampColumns: ['UpdatedAt', 'CreatedAt'],
    sourceTableName: null,
    sourceTimestampColumns: [],
  },
  {
    tableName: 'GisParcelGeometries',
    productDomain: 'atlas',
    loadRequirement: 'seed_required',
    productTimestampColumns: ['SyncedAt', 'UpdatedAt', 'CreatedAt'],
    sourceTableName: null,
    sourceTimestampColumns: [],
  },
  {
    tableName: 'DossierPackets',
    productDomain: 'dossier',
    loadRequirement: 'operational_state',
    productTimestampColumns: ['UpdatedAt', 'CreatedAt'],
    sourceTableName: null,
    sourceTimestampColumns: [],
  },
  {
    tableName: 'CountyDownstreamClosureReceipts',
    productDomain: 'dais',
    loadRequirement: 'operational_state',
    productTimestampColumns: ['UpdatedAt', 'ReturnedAtUtc', 'OpenedAtUtc', 'CreatedAt'],
    sourceTableName: null,
    sourceTimestampColumns: [],
  },
  {
    tableName: 'CountyApplyHandoffReceipts',
    productDomain: 'dossier',
    loadRequirement: 'operational_state',
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

const PRODUCT_LOAD_RECEIPT_CONTRACT = {
  tableName: 'ProductLoadReceipts',
  acceptedTableColumns: [
    'TableName',
    'ProductTableName',
    'TargetTableName',
    'RuntimeTableName',
    'ProductTable',
  ],
  acceptedTimestampColumns: [
    'LoadedAtUtc',
    'LoadedAt',
    'LoadCompletedAtUtc',
    'CompletedAtUtc',
    'CompletedAt',
    'ReceiptAtUtc',
    'ReceiptAt',
    'CreatedAtUtc',
    'CreatedAt',
    'UpdatedAt',
  ],
  recommendedColumns: [
    'Id',
    'TargetTableName',
    'CountyId',
    'RowCount',
    'LoadedAtUtc',
    'SourceSnapshotId',
    'SourceSystem',
    'LoadBatchId',
    'TransformVersion',
    'InputHash',
    'OutputHash',
  ],
};

const LOAD_REQUIREMENTS_BY_TABLE = Object.fromEntries(
  PRODUCT_TABLES.map(definition => [definition.tableName, definition.loadRequirement])
);

const SYNC_BRIDGE_LOAD_BATCH_CONTRACT = {
  tableName: 'sync_bridge.load_batch',
  tableIdentityColumn: 'SourceSystem',
  timestampColumn: 'CompletedAt',
  statusColumn: 'Status',
  rowsPromotedColumn: 'RowsPromoted',
};

const SYNC_BRIDGE_PROJECTOR_SOURCES_BY_TABLE = {
  'canonical_tf.tf_parcel': ['canonical-tf-parcel-projector'],
  'canonical_tf.tf_sale': ['canonical-tf-projector'],
  'canonical_tf.tf_improvement': ['canonical-tf-imprv-projector'],
  'canonical_tf.tf_land': ['canonical-tf-land-projector'],
  GisParcelGeometries: ['canonical-tf-arcgis-projector'],
};

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

function splitTableName(tableName) {
  const parts = String(tableName).split('.');
  if (parts.length === 2) {
    return { schema: parts[0], table: parts[1] };
  }
  return { schema: 'public', table: tableName };
}

function quoteTable(tableName) {
  const { schema, table } = splitTableName(tableName);
  return `${quoteIdent(schema)}.${quoteIdent(table)}`;
}

function tableExists(tableName) {
  const { schema, table } = splitTableName(tableName);
  const result = psql(
    `select exists(select 1 from information_schema.tables where table_schema='${schema.replaceAll("'", "''")}' and table_name='${String(table).replaceAll("'", "''")}');`
  );
  return result === 't';
}

function existingColumns(tableName) {
  const { schema, table } = splitTableName(tableName);
  const result = psql(
    `select column_name from information_schema.columns where table_schema='${schema.replaceAll("'", "''")}' and table_name='${String(table).replaceAll("'", "''")}';`
  );
  return new Set(
    result
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
  );
}

function countRows(tableName) {
  const result = psql(`select count(*) from ${quoteTable(tableName)};`);
  const parsed = Number.parseInt(result, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function maxColumn(tableName, columnName) {
  const result = psql(`select max(${quoteIdent(columnName)}) from ${quoteTable(tableName)};`);
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
  const productLoadReceiptAt = latestProductLoadReceiptAtForProductLoadReceipts(_tableName);
  const syncBridgeLoadBatchAt = latestSyncBridgeLoadBatchAtFor(_tableName);

  return latest(productLoadReceiptAt, syncBridgeLoadBatchAt);
}

function latestProductLoadReceiptAtForProductLoadReceipts(_tableName) {
  if (!tableExists('ProductLoadReceipts')) return null;
  const columns = existingColumns('ProductLoadReceipts');
  const tableColumn = [
    'TableName',
    'ProductTableName',
    'TargetTableName',
    'RuntimeTableName',
    'ProductTable',
  ].find(column => columns.has(column));
  const timestampColumns = [
    'LoadedAtUtc',
    'LoadedAt',
    'LoadCompletedAtUtc',
    'CompletedAtUtc',
    'CompletedAt',
    'ReceiptAtUtc',
    'ReceiptAt',
    'CreatedAtUtc',
    'CreatedAt',
    'UpdatedAt',
  ].filter(column => columns.has(column));

  if (!tableColumn || timestampColumns.length === 0) return null;

  const tableName = String(_tableName).replaceAll("'", "''");
  const predicate = `lower(${quoteIdent(tableColumn)}::text) = lower('${tableName}')`;

  return latest(
    ...timestampColumns.map(column => {
      const result = psql(
        `select max(${quoteIdent(column)}) from "ProductLoadReceipts" where ${predicate};`
      );
      return parseIso(result);
    })
  );
}

function syncBridgeProjectorSourcesFor(tableName) {
  return SYNC_BRIDGE_PROJECTOR_SOURCES_BY_TABLE[String(tableName)] ?? [];
}

function loadRequirementFor(tableName) {
  return LOAD_REQUIREMENTS_BY_TABLE[String(tableName)] ?? 'seed_required';
}

function latestSyncBridgeLoadBatchAtFor(tableName) {
  if (!tableExists(SYNC_BRIDGE_LOAD_BATCH_CONTRACT.tableName)) return null;

  const sources = syncBridgeProjectorSourcesFor(tableName);
  if (sources.length === 0) return null;

  const columns = existingColumns(SYNC_BRIDGE_LOAD_BATCH_CONTRACT.tableName);
  const requiredColumns = [
    SYNC_BRIDGE_LOAD_BATCH_CONTRACT.tableIdentityColumn,
    SYNC_BRIDGE_LOAD_BATCH_CONTRACT.timestampColumn,
    SYNC_BRIDGE_LOAD_BATCH_CONTRACT.statusColumn,
  ];
  if (!requiredColumns.every(column => columns.has(column))) return null;

  const sourceList = sources
    .map(source => `'${String(source).replaceAll("'", "''").toLowerCase()}'`)
    .join(', ');
  const rowsPromotedPredicate = columns.has(SYNC_BRIDGE_LOAD_BATCH_CONTRACT.rowsPromotedColumn)
    ? ` and coalesce(${quoteIdent(SYNC_BRIDGE_LOAD_BATCH_CONTRACT.rowsPromotedColumn)}, 0) > 0`
    : '';
  const result = psql(
    `select max(${quoteIdent(SYNC_BRIDGE_LOAD_BATCH_CONTRACT.timestampColumn)}) from ${quoteTable(SYNC_BRIDGE_LOAD_BATCH_CONTRACT.tableName)} where lower(${quoteIdent(SYNC_BRIDGE_LOAD_BATCH_CONTRACT.tableIdentityColumn)}::text) in (${sourceList}) and ${quoteIdent(SYNC_BRIDGE_LOAD_BATCH_CONTRACT.statusColumn)} = 'COMPLETED'${rowsPromotedPredicate};`
  );

  return parseIso(result);
}

function productLoadReceiptEvidenceFromDatabase() {
  const exists = tableExists(PRODUCT_LOAD_RECEIPT_CONTRACT.tableName);
  const columns = exists ? existingColumns(PRODUCT_LOAD_RECEIPT_CONTRACT.tableName) : new Set();
  const tableColumn =
    PRODUCT_LOAD_RECEIPT_CONTRACT.acceptedTableColumns.find(column => columns.has(column)) ?? null;
  const timestampColumns = PRODUCT_LOAD_RECEIPT_CONTRACT.acceptedTimestampColumns.filter(column =>
    columns.has(column)
  );
  const rowCount = exists ? countRows(PRODUCT_LOAD_RECEIPT_CONTRACT.tableName) : null;
  const blockers = [];

  const syncBridgeLoadBatchEvidence = syncBridgeLoadBatchEvidenceFromDatabase();
  const hasAnyReceiptEvidence = exists || syncBridgeLoadBatchEvidence.exists;

  if (!exists && !syncBridgeLoadBatchEvidence.exists) {
    blockers.push(
      'ProductLoadReceipts table is missing and sync_bridge.load_batch receipt evidence is unavailable.'
    );
  } else {
    if (exists && !tableColumn) {
      blockers.push('ProductLoadReceipts has no accepted product table identity column.');
    }
    if (exists && timestampColumns.length === 0) {
      blockers.push('ProductLoadReceipts has no accepted load timestamp column.');
    }
    if (exists && rowCount === 0) {
      blockers.push('ProductLoadReceipts table exists but is empty.');
    }
  }

  return {
    tableName: PRODUCT_LOAD_RECEIPT_CONTRACT.tableName,
    exists: hasAnyReceiptEvidence,
    evidenceSource: exists
      ? PRODUCT_LOAD_RECEIPT_CONTRACT.tableName
      : syncBridgeLoadBatchEvidence.tableName,
    rowCount:
      rowCount ??
      (syncBridgeLoadBatchEvidence.exists ? syncBridgeLoadBatchEvidence.rowCount : null),
    productLoadReceiptsTableExists: exists,
    productLoadReceiptsRowCount: rowCount,
    tableIdentityColumn: tableColumn,
    timestampColumns,
    acceptedTableColumns: PRODUCT_LOAD_RECEIPT_CONTRACT.acceptedTableColumns,
    acceptedTimestampColumns: PRODUCT_LOAD_RECEIPT_CONTRACT.acceptedTimestampColumns,
    recommendedColumns: PRODUCT_LOAD_RECEIPT_CONTRACT.recommendedColumns,
    syncBridgeLoadBatchEvidence,
    blockers,
  };
}

function syncBridgeLoadBatchEvidenceFromDatabase() {
  const exists = tableExists(SYNC_BRIDGE_LOAD_BATCH_CONTRACT.tableName);
  const columns = exists ? existingColumns(SYNC_BRIDGE_LOAD_BATCH_CONTRACT.tableName) : new Set();
  const rowCount = exists ? countRows(SYNC_BRIDGE_LOAD_BATCH_CONTRACT.tableName) : null;
  const blockers = [];

  if (!exists) {
    blockers.push('sync_bridge.load_batch table is missing.');
  } else {
    for (const column of [
      SYNC_BRIDGE_LOAD_BATCH_CONTRACT.tableIdentityColumn,
      SYNC_BRIDGE_LOAD_BATCH_CONTRACT.timestampColumn,
      SYNC_BRIDGE_LOAD_BATCH_CONTRACT.statusColumn,
    ]) {
      if (!columns.has(column)) blockers.push(`sync_bridge.load_batch is missing ${column}.`);
    }
    if (rowCount === 0) blockers.push('sync_bridge.load_batch table exists but is empty.');
  }

  return {
    tableName: SYNC_BRIDGE_LOAD_BATCH_CONTRACT.tableName,
    exists: exists && blockers.length === 0,
    rowCount,
    tableIdentityColumn: SYNC_BRIDGE_LOAD_BATCH_CONTRACT.tableIdentityColumn,
    timestampColumns: columns.has(SYNC_BRIDGE_LOAD_BATCH_CONTRACT.timestampColumn)
      ? [SYNC_BRIDGE_LOAD_BATCH_CONTRACT.timestampColumn]
      : [],
    acceptedSourceSystemsByTable: SYNC_BRIDGE_PROJECTOR_SOURCES_BY_TABLE,
    blockers,
  };
}

function productLoadReceiptEvidenceFromFixture(fixture) {
  const receipts = Array.isArray(fixture.productLoadReceipts) ? fixture.productLoadReceipts : [];
  const sample = receipts[0] ?? {};
  const columns = new Set(Object.keys(sample));
  const tableColumn =
    PRODUCT_LOAD_RECEIPT_CONTRACT.acceptedTableColumns.find(column =>
      columns.has(column[0].toLowerCase() + column.slice(1))
    ) ??
    PRODUCT_LOAD_RECEIPT_CONTRACT.acceptedTableColumns.find(column => columns.has(column)) ??
    null;
  const timestampColumns = PRODUCT_LOAD_RECEIPT_CONTRACT.acceptedTimestampColumns.filter(
    column => columns.has(column) || columns.has(column[0].toLowerCase() + column.slice(1))
  );

  const syncBridgeLoadBatchEvidence = syncBridgeLoadBatchEvidenceFromFixture(fixture);
  const hasAnyReceiptEvidence = receipts.length > 0 || syncBridgeLoadBatchEvidence.exists;

  return {
    tableName: PRODUCT_LOAD_RECEIPT_CONTRACT.tableName,
    exists: hasAnyReceiptEvidence,
    evidenceSource:
      receipts.length > 0
        ? PRODUCT_LOAD_RECEIPT_CONTRACT.tableName
        : syncBridgeLoadBatchEvidence.tableName,
    rowCount: receipts.length > 0 ? receipts.length : syncBridgeLoadBatchEvidence.rowCount,
    productLoadReceiptsTableExists: receipts.length > 0,
    productLoadReceiptsRowCount: receipts.length,
    tableIdentityColumn: tableColumn,
    timestampColumns,
    acceptedTableColumns: PRODUCT_LOAD_RECEIPT_CONTRACT.acceptedTableColumns,
    acceptedTimestampColumns: PRODUCT_LOAD_RECEIPT_CONTRACT.acceptedTimestampColumns,
    recommendedColumns: PRODUCT_LOAD_RECEIPT_CONTRACT.recommendedColumns,
    syncBridgeLoadBatchEvidence,
    blockers: hasAnyReceiptEvidence
      ? []
      : [
          'Product load receipt fixture has no productLoadReceipts or syncBridgeLoadBatches entries.',
        ],
  };
}

function syncBridgeLoadBatchEvidenceFromFixture(fixture) {
  const batches = Array.isArray(fixture.syncBridgeLoadBatches) ? fixture.syncBridgeLoadBatches : [];
  return {
    tableName: SYNC_BRIDGE_LOAD_BATCH_CONTRACT.tableName,
    exists: batches.length > 0,
    rowCount: batches.length,
    tableIdentityColumn: SYNC_BRIDGE_LOAD_BATCH_CONTRACT.tableIdentityColumn,
    timestampColumns: batches.length > 0 ? [SYNC_BRIDGE_LOAD_BATCH_CONTRACT.timestampColumn] : [],
    acceptedSourceSystemsByTable: SYNC_BRIDGE_PROJECTOR_SOURCES_BY_TABLE,
    blockers: batches.length > 0 ? [] : ['syncBridgeLoadBatches fixture has no entries.'],
  };
}

function latestFixtureProductLoadReceiptAtFor(receipts, tableName) {
  if (!Array.isArray(receipts)) return null;

  return latest(
    ...receipts
      .filter(receipt => {
        const receiptTable =
          receipt.tableName ??
          receipt.productTableName ??
          receipt.targetTableName ??
          receipt.runtimeTableName ??
          receipt.productTable;

        return String(receiptTable ?? '').toLowerCase() === String(tableName).toLowerCase();
      })
      .flatMap(receipt => [
        receipt.loadedAtUtc,
        receipt.loadedAt,
        receipt.loadCompletedAtUtc,
        receipt.completedAtUtc,
        receipt.completedAt,
        receipt.receiptAtUtc,
        receipt.receiptAt,
        receipt.createdAtUtc,
        receipt.createdAt,
        receipt.updatedAt,
      ])
  );
}

function latestFixtureSyncBridgeLoadBatchAtFor(batches, tableName) {
  if (!Array.isArray(batches)) return null;

  const acceptedSources = syncBridgeProjectorSourcesFor(tableName).map(source =>
    String(source).toLowerCase()
  );
  if (acceptedSources.length === 0) return null;

  return latest(
    ...batches
      .filter(batch => {
        const sourceSystem = String(batch.sourceSystem ?? batch.SourceSystem ?? '').toLowerCase();
        const status = String(batch.status ?? batch.Status ?? '').toUpperCase();
        const rowsPromoted = Number(batch.rowsPromoted ?? batch.RowsPromoted ?? 0);

        return acceptedSources.includes(sourceSystem) && status === 'COMPLETED' && rowsPromoted > 0;
      })
      .flatMap(batch => [
        batch.completedAt,
        batch.CompletedAt,
        batch.completedAtUtc,
        batch.CompletedAtUtc,
        batch.createdAt,
        batch.CreatedAt,
      ])
  );
}

function buildRowsFromDatabase() {
  const globalEtlCompletedAt = latestEtlCompletedAt();
  const rows = PRODUCT_TABLES.map(definition => {
    if (!tableExists(definition.tableName)) {
      return evaluateProductLoadLineage({
        tableName: definition.tableName,
        productDomain: definition.productDomain,
        loadRequirement: definition.loadRequirement,
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
      loadRequirement: definition.loadRequirement,
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
  const loadRequirement = row.loadRequirement ?? loadRequirementFor(row.tableName);

  if (loadRequirement === 'operational_state') {
    if (row.rowCount === null) {
      blockers.push('Operational state table missing or unreadable.');
      return { ...row, loadRequirement, lineageStatus: 'missing_table', blockers, warnings };
    }

    if (row.rowCount === 0) {
      warnings.push(
        'Operational state table is empty; this is allowed before user workflow activity.'
      );
      return {
        ...row,
        loadRequirement,
        lineageStatus: 'operational_empty_allowed',
        blockers,
        warnings,
      };
    }

    warnings.push(
      'Rows are operational state generated by product workflow; product-load receipt is not required.'
    );
    return {
      ...row,
      loadRequirement,
      lineageStatus: 'operational_state_present',
      blockers,
      warnings,
    };
  }

  if (row.rowCount === null) {
    blockers.push('Table missing or unreadable.');
    return { ...row, loadRequirement, lineageStatus: 'missing_table', blockers, warnings };
  }

  if (row.rowCount === 0) {
    blockers.push('Table exists but is empty.');
    return { ...row, loadRequirement, lineageStatus: 'empty_table', blockers, warnings };
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
      loadRequirement,
      lineageStatus: 'rows_exist_lineage_unproven',
      blockers,
      warnings,
    };
  }

  return {
    ...row,
    loadRequirement,
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
    seedRequiredTables: rows.filter(row => row.loadRequirement === 'seed_required').length,
    operationalStateTables: rows.filter(row => row.loadRequirement === 'operational_state').length,
    operationalStateAllowed: rows.filter(row =>
      ['operational_empty_allowed', 'operational_state_present'].includes(row.lineageStatus)
    ).length,
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
    `- Seed-required tables: ${report.summary.seedRequiredTables}`,
    `- Operational state tables: ${report.summary.operationalStateTables}`,
    `- Operational state allowed: ${report.summary.operationalStateAllowed}`,
    `- Latest ETL completed at: ${report.globalEtlCompletedAt ?? '-'}`,
    `- Product load receipt evidence exists: ${report.receiptEvidence.exists ? 'yes' : 'no'}`,
    `- Product load receipt evidence source: ${report.receiptEvidence.evidenceSource ?? '-'}`,
    `- ProductLoadReceipts table exists: ${report.receiptEvidence.productLoadReceiptsTableExists ? 'yes' : 'no'}`,
    `- ProductLoadReceipts rows: ${report.receiptEvidence.productLoadReceiptsRowCount ?? '-'}`,
    `- sync_bridge.load_batch exists: ${report.receiptEvidence.syncBridgeLoadBatchEvidence?.exists ? 'yes' : 'no'}`,
    `- sync_bridge.load_batch rows: ${report.receiptEvidence.syncBridgeLoadBatchEvidence?.rowCount ?? '-'}`,
    '',
    '## Product Load Receipt Contract',
    '',
    `- Receipt table: \`${report.receiptEvidence.tableName}\``,
    `- Table identity column detected: ${report.receiptEvidence.tableIdentityColumn ?? '-'}`,
    `- Timestamp columns detected: ${report.receiptEvidence.timestampColumns.length ? report.receiptEvidence.timestampColumns.join(', ') : '-'}`,
    `- Accepted table identity columns: ${report.receiptEvidence.acceptedTableColumns.join(', ')}`,
    `- Accepted timestamp columns: ${report.receiptEvidence.acceptedTimestampColumns.join(', ')}`,
    `- Recommended columns: ${report.receiptEvidence.recommendedColumns.join(', ')}`,
    '',
    '## Receipt Blockers',
    '',
    ...(report.receiptEvidence.blockers.length
      ? report.receiptEvidence.blockers.map(blocker => `- ${blocker}`)
      : ['- none']),
    '',
    '## Ledger',
    '',
    '| Table | Domain | Requirement | Rows | Product Updated | Source/Cache Sync | ETL Completed | Product Load Receipt | Status | Blockers |',
    '|---|---|---|---:|---|---|---|---|---|---|',
    ...report.rows.map(row =>
      [
        `\`${row.tableName}\``,
        row.productDomain,
        row.loadRequirement ?? '-',
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
    'Operational state tables are workflow state, not source-seeded product tables; they may be empty before user activity without blocking product-load lineage.',
  ].join('\n');
}

function buildReport() {
  if (fixturePath) {
    const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
    const rows = fixture.rows.map(row =>
      evaluateProductLoadLineage({
        ...row,
        loadRequirement: row.loadRequirement ?? loadRequirementFor(row.tableName),
        latestProductLoadReceiptAt:
          row.latestProductLoadReceiptAt ??
          latest(
            latestFixtureProductLoadReceiptAtFor(fixture.productLoadReceipts, row.tableName),
            latestFixtureSyncBridgeLoadBatchAtFor(fixture.syncBridgeLoadBatches, row.tableName)
          ),
      })
    );
    return {
      rows,
      globalEtlCompletedAt: fixture.globalEtlCompletedAt ?? null,
      receiptEvidence: productLoadReceiptEvidenceFromFixture(fixture),
      database: fixture.database ?? {
        container: 'fixture',
        database: 'fixture',
        user: 'fixture',
      },
    };
  }

  return {
    ...buildRowsFromDatabase(),
    receiptEvidence: productLoadReceiptEvidenceFromDatabase(),
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
    receiptEvidence: built.receiptEvidence,
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
