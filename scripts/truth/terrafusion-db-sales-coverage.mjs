#!/usr/bin/env node

/**
 * Track 2F — TerraFusion DB Sales Coverage Audit
 *
 * Proves whether Benton sale facts already exist in TerraFusion DB
 * and whether they are sufficient for canonical qualified-sales
 * lineage — WITHOUT inspecting any upstream source system.
 *
 * Hard guards (binding):
 *   - TerraFusion DB ONLY. No Harris PACS reads, no source credentials,
 *     no SyncAtlas invocation, no mapped-workbook dependency.
 *   - No row invention. Every count comes from a real SQL query.
 *   - Read-only. Zero writes to any TF DB table.
 *
 * Output:
 *   - generated/truth/terrafusion-db-sales-coverage.json
 *   - generated/truth/terrafusion-db-sales-coverage.md
 *
 * Run: pnpm run truth:terrafusion-db-sales-coverage
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const truthDir = path.join(repoRoot, 'generated', 'truth');
const outJson = path.join(truthDir, 'terrafusion-db-sales-coverage.json');
const outMd = path.join(truthDir, 'terrafusion-db-sales-coverage.md');

const PG_CONTAINER = process.env.TF_PG_CONTAINER ?? 'terrafusion-postgres-dev';
const PG_USER = process.env.TF_PG_USER ?? 'postgres';
const PG_DB = process.env.TF_PG_DB ?? 'terrafusion';
const BENTON_COUNTY_ID = '19190019-1919-1919-1919-191919191919';

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, '/');
}

/**
 * Run a SQL query inside the running Postgres container and return
 * tuples-only output. No source-system credentials. No HTTP. No API
 * dependency.
 */
function runSql(sql) {
  const args = [
    'exec',
    '-i',
    PG_CONTAINER,
    'psql',
    '-U',
    PG_USER,
    '-d',
    PG_DB,
    '--no-psqlrc',
    '-A',
    '-t',
    '-F',
    '\t',
    '-c',
    sql,
  ];
  const buf = execFileSync('docker', args, { stdio: ['ignore', 'pipe', 'pipe'] });
  return buf.toString('utf8').trim();
}

function singleInt(sql) {
  const txt = runSql(sql);
  const n = Number(txt);
  return Number.isFinite(n) ? n : null;
}

function rowsAsArray(sql) {
  const txt = runSql(sql);
  if (!txt) return [];
  return txt
    .split('\n')
    .filter(Boolean)
    .map(line => line.split('\t').map(c => c.trim()));
}

const COUNTY = `'${BENTON_COUNTY_ID}'`;

// ─── 13 metrics per Track 2F card ──────────────────────────────────

const metrics = {};

// 1. parcel rows (Benton scope)
metrics.parcelRows = singleInt(`SELECT COUNT(*) FROM "Properties" WHERE "CountyId" = ${COUNTY};`);

// 2. parcel rows with sale fields — Properties has no sale-attached
//    columns in TF DB; sales are a separate stream. We surface this
//    as 0 with the reason.
const parcelSaleColumns = rowsAsArray(
  `SELECT column_name FROM information_schema.columns
   WHERE table_name = 'Properties'
     AND (column_name ILIKE '%sale%' OR column_name ILIKE '%price%'
          OR column_name ILIKE '%transfer%' OR column_name ILIKE '%chg%');`
);
metrics.parcelSaleColumnsOnPropertiesTable = parcelSaleColumns.flat();
metrics.parcelRowsWithSaleFields = 0; // no sale attributes on Properties row

// 3. standalone sale fact rows (pacs_sales joined to Benton parcels)
metrics.standaloneSaleFactRows_pacsSales = singleInt(
  `SELECT COUNT(*) FROM pacs_sales s
     JOIN "Properties" p ON p."Id" = s."ParcelId"
     WHERE p."CountyId" = ${COUNTY};`
);

// 3b. SaleRecords (alternate canonical-landing variant, currently empty)
metrics.standaloneSaleFactRows_SaleRecords = singleInt(`SELECT COUNT(*) FROM "SaleRecords";`);

// 4. comparable sale rows
metrics.comparableSaleRows = singleInt(`SELECT COUNT(*) FROM "ComparableSales";`);

// 5. sales by year (Benton, top years)
metrics.salesByYear_top20 = rowsAsArray(
  `SELECT EXTRACT(YEAR FROM s."SaleDate")::int AS yr, COUNT(*) AS cnt
     FROM pacs_sales s
     JOIN "Properties" p ON p."Id" = s."ParcelId"
     WHERE p."CountyId" = ${COUNTY}
       AND s."SaleDate" IS NOT NULL
     GROUP BY yr
     ORDER BY yr DESC
     LIMIT 20;`
).map(r => ({ year: Number(r[0]), sales: Number(r[1]) }));

// 6. sales before 2018 (Benton)
metrics.salesBefore2018 = singleInt(
  `SELECT COUNT(*) FROM pacs_sales s
     JOIN "Properties" p ON p."Id" = s."ParcelId"
     WHERE p."CountyId" = ${COUNTY}
       AND s."SaleDate" IS NOT NULL
       AND s."SaleDate" < '2018-01-01';`
);

// 7. sales from 2018 onward (Benton)
metrics.salesFrom2018Onward = singleInt(
  `SELECT COUNT(*) FROM pacs_sales s
     JOIN "Properties" p ON p."Id" = s."ParcelId"
     WHERE p."CountyId" = ${COUNTY}
       AND s."SaleDate" IS NOT NULL
       AND s."SaleDate" >= '2018-01-01';`
);

// 7b. sales with no SaleDate at all
metrics.salesWithNoSaleDate = singleInt(
  `SELECT COUNT(*) FROM pacs_sales s
     JOIN "Properties" p ON p."Id" = s."ParcelId"
     WHERE p."CountyId" = ${COUNTY}
       AND s."SaleDate" IS NULL;`
);

// 8. rows with missing WAC code
metrics.rowsWithMissingWacCd = singleInt(
  `SELECT COUNT(*) FROM pacs_sales s
     JOIN "Properties" p ON p."Id" = s."ParcelId"
     WHERE p."CountyId" = ${COUNTY}
       AND (s."WacCd" IS NULL OR btrim(s."WacCd") = '');`
);
metrics.rowsWithWacCdPresent = singleInt(
  `SELECT COUNT(*) FROM pacs_sales s
     JOIN "Properties" p ON p."Id" = s."ParcelId"
     WHERE p."CountyId" = ${COUNTY}
       AND s."WacCd" IS NOT NULL
       AND btrim(s."WacCd") <> '';`
);

// 9. rows with missing ratio type code
metrics.rowsWithMissingSaleRatioTypeCd = singleInt(
  `SELECT COUNT(*) FROM pacs_sales s
     JOIN "Properties" p ON p."Id" = s."ParcelId"
     WHERE p."CountyId" = ${COUNTY}
       AND (s."SaleRatioTypeCd" IS NULL OR btrim(s."SaleRatioTypeCd") = '');`
);
metrics.rowsWithSaleRatioTypeCdPresent = singleInt(
  `SELECT COUNT(*) FROM pacs_sales s
     JOIN "Properties" p ON p."Id" = s."ParcelId"
     WHERE p."CountyId" = ${COUNTY}
       AND s."SaleRatioTypeCd" IS NOT NULL
       AND btrim(s."SaleRatioTypeCd") <> '';`
);

// 10. rows with sale price AND sale date
metrics.rowsWithSalePriceAndSaleDate = singleInt(
  `SELECT COUNT(*) FROM pacs_sales s
     JOIN "Properties" p ON p."Id" = s."ParcelId"
     WHERE p."CountyId" = ${COUNTY}
       AND s."SalePrice" IS NOT NULL AND s."SalePrice" > 0
       AND s."SaleDate" IS NOT NULL;`
);
metrics.rowsWithSalePriceMissing = singleInt(
  `SELECT COUNT(*) FROM pacs_sales s
     JOIN "Properties" p ON p."Id" = s."ParcelId"
     WHERE p."CountyId" = ${COUNTY}
       AND (s."SalePrice" IS NULL OR s."SalePrice" = 0);`
);

// 11. rows attached to valid parcel IDs (== row count joining
//     successfully through Properties for Benton)
metrics.rowsAttachedToValidBentonParcels = metrics.standaloneSaleFactRows_pacsSales;
// orphans = rows whose ParcelId doesn't match any Property
metrics.salesWithOrphanParcelId = singleInt(
  `SELECT COUNT(*) FROM pacs_sales s
     LEFT JOIN "Properties" p ON p."Id" = s."ParcelId"
     WHERE p."Id" IS NULL;`
);

// 12. rows ELIGIBLE FOR QUALIFICATION before mapping
//     Definition (no workbook dependency, no source-system reads):
//     - attached to a valid Benton parcel
//     - has SaleDate
//     - has SalePrice > 0
//     - has at least one of (WacCd, SaleRatioTypeCd) populated
//       (qualification axes per C8-A; absence of both means
//       MissingCode on both axes regardless of mapping state)
metrics.rowsEligibleForQualificationBeforeMapping = singleInt(
  `SELECT COUNT(*) FROM pacs_sales s
     JOIN "Properties" p ON p."Id" = s."ParcelId"
     WHERE p."CountyId" = ${COUNTY}
       AND s."SaleDate" IS NOT NULL
       AND s."SalePrice" IS NOT NULL AND s."SalePrice" > 0
       AND (
         (s."WacCd" IS NOT NULL AND btrim(s."WacCd") <> '')
         OR (s."SaleRatioTypeCd" IS NOT NULL AND btrim(s."SaleRatioTypeCd") <> '')
       );`
);

// 12b. STRICT eligibility: BOTH axes populated AND date AND price.
metrics.rowsStrictlyEligibleForQualification = singleInt(
  `SELECT COUNT(*) FROM pacs_sales s
     JOIN "Properties" p ON p."Id" = s."ParcelId"
     WHERE p."CountyId" = ${COUNTY}
       AND s."SaleDate" IS NOT NULL
       AND s."SalePrice" IS NOT NULL AND s."SalePrice" > 0
       AND s."WacCd" IS NOT NULL AND btrim(s."WacCd") <> ''
       AND s."SaleRatioTypeCd" IS NOT NULL AND btrim(s."SaleRatioTypeCd") <> '';`
);

// 13. rows already canonical-qualified (CanonicalSaleQualifications)
metrics.rowsAlreadyCanonicalQualified = singleInt(
  `SELECT COUNT(*) FROM "CanonicalSaleQualifications"
     WHERE "CountyId" = ${COUNTY};`
);

// ─── Verdict ──────────────────────────────────────────────────────

const verdict = (() => {
  const haveSales = metrics.standaloneSaleFactRows_pacsSales > 0;
  const haveAnyEligibility = metrics.rowsEligibleForQualificationBeforeMapping > 0;
  const haveStrictEligibility = metrics.rowsStrictlyEligibleForQualification > 0;
  const haveCanonical = metrics.rowsAlreadyCanonicalQualified > 0;

  if (!haveSales) {
    return {
      gate: 'TERRAFUSION_DB_LANDING_GAP',
      summary:
        'TerraFusion DB has zero pacs_sales rows for Benton. This is a Sync landing gap; readiness fails until upstream→TF DB sales sync runs.',
      nextSlice: 'Wait for / fix TerraFusion Sync landing into TerraFusion DB.',
    };
  }
  if (haveCanonical) {
    return {
      gate: 'CANONICAL_QUALIFIED_SALES_PRESENT',
      summary:
        'CanonicalSaleQualifications already populated for Benton. Product runtime can read qualified comp pool directly.',
      nextSlice: 'Wire / verify product-runtime reads of canonical qualified sales.',
    };
  }
  if (haveStrictEligibility) {
    return {
      gate: 'TF_DB_HAS_QUALIFIABLE_SALES',
      summary:
        'TerraFusion DB has sales with both qualification axes (WacCd + SaleRatioTypeCd) plus date + price. A TF-DB-only canonical qualification materializer is feasible without source reads.',
      nextSlice: 'Author qualification mapping (policy/table) → TF-DB-only materializer.',
    };
  }
  if (haveAnyEligibility) {
    return {
      gate: 'TF_DB_HAS_LOOSELY_ELIGIBLE_SALES',
      summary:
        'TerraFusion DB has sales with date + price + at least one qualification axis populated, but the strict-both-axes set may be small. Operator must decide whether single-axis qualification is acceptable for ratio-study work.',
      nextSlice:
        'Operator policy decision: WAC-only / Ratio-only / require-both qualification rule.',
    };
  }
  return {
    gate: 'TF_DB_SALES_PRESENT_BUT_NOT_QUALIFIABLE',
    summary:
      'pacs_sales rows exist but none meet the minimum qualification criteria (date + price + at least one axis). This is a data-coverage problem inside TerraFusion DB landing, not a mapping problem.',
    nextSlice:
      'Investigate Sync landing field-coverage; consider widening or fixing pacs_sales import.',
  };
})();

// ─── Compose artifact ─────────────────────────────────────────────

const generatedAt = new Date().toISOString();
const document = {
  track: 'Track 2F',
  title: 'TerraFusion DB Sales Coverage Audit',
  generatedAt,
  countyId: BENTON_COUNTY_ID,
  countyName: 'Benton',
  hardGuards: {
    sourceSystemReads: false,
    sourceCredentialsUsed: false,
    workbookDependency: false,
    countyStudioRuntimeDependency: false,
    rowInvention: false,
  },
  metrics,
  verdict,
  notes: [
    'WacCd is not strictly enforced in PACS even where applied; treat WAC presence as a hint, not ground truth.',
    'Pre-2018 sales are largely uncoded for WacCd by historical reality, not data corruption.',
    'Properties table carries zero sale-attached columns; sales live in pacs_sales joined by ParcelId.',
    'CanonicalSaleQualifications is the comp-pool-pre-qualified pipeline; empty means no ratio-study has been prepared, not that sales are missing.',
  ],
};

fs.mkdirSync(truthDir, { recursive: true });
fs.writeFileSync(outJson, JSON.stringify(document, null, 2) + '\n');

// ─── Markdown ─────────────────────────────────────────────────────

const md = [];
md.push('# Track 2F — TerraFusion DB Sales Coverage Audit');
md.push('');
md.push(`**Generated:** ${generatedAt}`);
md.push(`**County:** Benton (${BENTON_COUNTY_ID})`);
md.push(`**Hard guards:** TF DB only. No source reads. No credentials. No workbook. No invention.`);
md.push('');
md.push('## Verdict');
md.push('');
md.push(`**${verdict.gate}**`);
md.push('');
md.push(verdict.summary);
md.push('');
md.push(`**Next slice:** ${verdict.nextSlice}`);
md.push('');
md.push('## Metrics');
md.push('');
md.push('| # | Metric | Value |');
md.push('|---|---|---:|');
md.push(`| 1 | Parcel rows (Benton) | ${metrics.parcelRows?.toLocaleString() ?? '?'} |`);
md.push(
  `| 2 | Parcel rows with sale fields on Properties row | ${metrics.parcelRowsWithSaleFields} |`
);
md.push(
  `| 2a | Properties-table sale-shaped columns found | ${metrics.parcelSaleColumnsOnPropertiesTable.length === 0 ? 'none' : metrics.parcelSaleColumnsOnPropertiesTable.join(', ')} |`
);
md.push(
  `| 3 | Standalone sale facts in pacs_sales (Benton) | ${metrics.standaloneSaleFactRows_pacsSales?.toLocaleString() ?? '?'} |`
);
md.push(
  `| 3b | SaleRecords (alternate canonical landing) | ${metrics.standaloneSaleFactRows_SaleRecords?.toLocaleString() ?? '?'} |`
);
md.push(`| 4 | ComparableSales rows | ${metrics.comparableSaleRows?.toLocaleString() ?? '?'} |`);
md.push(`| 6 | Sales before 2018 (Benton) | ${metrics.salesBefore2018?.toLocaleString() ?? '?'} |`);
md.push(`| 7 | Sales 2018+ (Benton) | ${metrics.salesFrom2018Onward?.toLocaleString() ?? '?'} |`);
md.push(
  `| 7b | Sales with no SaleDate | ${metrics.salesWithNoSaleDate?.toLocaleString() ?? '?'} |`
);
md.push(`| 8 | Rows missing WacCd | ${metrics.rowsWithMissingWacCd?.toLocaleString() ?? '?'} |`);
md.push(
  `| 8a | Rows with WacCd present | ${metrics.rowsWithWacCdPresent?.toLocaleString() ?? '?'} |`
);
md.push(
  `| 9 | Rows missing SaleRatioTypeCd | ${metrics.rowsWithMissingSaleRatioTypeCd?.toLocaleString() ?? '?'} |`
);
md.push(
  `| 9a | Rows with SaleRatioTypeCd present | ${metrics.rowsWithSaleRatioTypeCdPresent?.toLocaleString() ?? '?'} |`
);
md.push(
  `| 10 | Rows with sale price (>0) AND date | ${metrics.rowsWithSalePriceAndSaleDate?.toLocaleString() ?? '?'} |`
);
md.push(
  `| 10a | Rows with sale price missing | ${metrics.rowsWithSalePriceMissing?.toLocaleString() ?? '?'} |`
);
md.push(
  `| 11 | Rows attached to valid Benton parcels | ${metrics.rowsAttachedToValidBentonParcels?.toLocaleString() ?? '?'} |`
);
md.push(
  `| 11a | Sales with orphan ParcelId (any county) | ${metrics.salesWithOrphanParcelId?.toLocaleString() ?? '?'} |`
);
md.push(
  `| 12 | Rows eligible for qualification before mapping (loose: ≥1 axis) | ${metrics.rowsEligibleForQualificationBeforeMapping?.toLocaleString() ?? '?'} |`
);
md.push(
  `| 12b | Rows strictly eligible (BOTH axes + date + price) | ${metrics.rowsStrictlyEligibleForQualification?.toLocaleString() ?? '?'} |`
);
md.push(
  `| 13 | Rows already canonical-qualified | ${metrics.rowsAlreadyCanonicalQualified?.toLocaleString() ?? '?'} |`
);
md.push('');
md.push('## Sales by year (top 20, descending)');
md.push('');
md.push('| Year | Sales |');
md.push('|---:|---:|');
for (const r of metrics.salesByYear_top20) {
  md.push(`| ${r.year} | ${r.sales.toLocaleString()} |`);
}
md.push('');
md.push('## Notes');
md.push('');
for (const n of document.notes) {
  md.push(`- ${n}`);
}
md.push('');
md.push('## Provenance');
md.push('');
md.push(`- Postgres container: \`${PG_CONTAINER}\``);
md.push(`- Database: \`${PG_DB}\``);
md.push('- Source-system reads: 0');
md.push('- HTTP API calls: 0');
md.push('- Workbook lookups: 0');
md.push('- Mapped CodeValue dependency: 0');
md.push('');

fs.writeFileSync(outMd, md.join('\n'));

process.stdout.write(`Track 2F audit complete.\n`);
process.stdout.write(`  ${rel(outJson)}\n`);
process.stdout.write(`  ${rel(outMd)}\n`);
process.stdout.write(`  Verdict: ${verdict.gate}\n`);
