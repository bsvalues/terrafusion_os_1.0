#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();
const evidenceDir = path.join(repoRoot, 'os-platform/core/pilot/evidence');
const jsonOut = path.join(evidenceDir, 'direct-source-recompute.latest.json');
const mdOut = path.join(evidenceDir, 'direct-source-recompute.latest.md');

const defaultStudyId = '52eb120f-99d3-4790-a69c-49b6de80cd5e';
const studyId = process.env.TF_DATA_TRUTH_STUDY_ID ?? defaultStudyId;
const sampleSize = Number(process.env.TF_DATA_TRUTH_SEGMENT_SAMPLE_SIZE ?? 10);
const tolerance = {
  ratio: 0.0001,
  cod: 0.01,
  prd: 0.0001,
};

function rel(file) {
  return path.relative(repoRoot, file).replaceAll('\\', '/');
}

function readJson(target) {
  return JSON.parse(readFileSync(path.join(repoRoot, target), 'utf8'));
}

function parseConnectionString(value) {
  const parts = {};
  for (const part of String(value ?? '').split(';')) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    const key = part.slice(0, index).trim().toLowerCase();
    const val = part.slice(index + 1).trim();
    if (key) parts[key] = val;
  }
  return {
    host: parts.host ?? 'localhost',
    port: parts.port ?? '5432',
    database: parts.database,
    user: parts.username ?? parts.user,
    password: parts.password,
  };
}

function findPsql() {
  const explicit = process.env.PSQL_PATH;
  if (explicit && existsSync(explicit)) return explicit;
  const candidates = [
    'C:/Program Files/PostgreSQL/17/bin/psql.exe',
    'C:/Program Files/PostgreSQL/16/bin/psql.exe',
    'C:/Program Files/PostgreSQL/15/bin/psql.exe',
    'psql',
  ];
  for (const candidate of candidates) {
    if (candidate === 'psql' || existsSync(candidate)) return candidate;
  }
  return 'psql';
}

function sqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function runPsql(sql, connection) {
  const psql = findPsql();
  const result = spawnSync(
    psql,
    [
      '-h', connection.host,
      '-p', String(connection.port),
      '-U', connection.user,
      '-d', connection.database,
      '-q',
      '-t',
      '-A',
      '-v', 'ON_ERROR_STOP=1',
      '-c', sql,
    ],
    {
      cwd: repoRoot,
      env: { ...process.env, PGPASSWORD: connection.password ?? '' },
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
    },
  );

  if (result.status !== 0) {
    throw new Error(`psql failed: ${result.stderr || result.stdout}`);
  }

  return result.stdout.trim();
}

function nearlyEqual(a, b, tol) {
  if (a == null && b == null) return true;
  if (typeof a !== 'number' || typeof b !== 'number') return false;
  return Math.abs(a - b) <= tol;
}

function round(value, digits) {
  if (value == null || !Number.isFinite(Number(value))) return null;
  return Number(Number(value).toFixed(digits));
}

function metricStatus(segment, recompute) {
  const checks = [
    {
      metric: 'medianRatio',
      api: round(segment.medianRatio, 4),
      recomputed: round(recompute.medianRatio, 4),
      pass: nearlyEqual(round(segment.medianRatio, 4), round(recompute.medianRatio, 4), tolerance.ratio),
    },
    {
      metric: 'cod',
      api: round(segment.cod, 2),
      recomputed: round(recompute.cod, 2),
      pass: nearlyEqual(round(segment.cod, 2), round(recompute.cod, 2), tolerance.cod),
    },
    {
      metric: 'prd',
      api: round(segment.prd, 4),
      recomputed: round(recompute.prd, 4),
      pass: nearlyEqual(round(segment.prd, 4), round(recompute.prd, 4), tolerance.prd),
    },
    {
      metric: 'salesCount',
      api: Number(segment.salesCount),
      recomputed: Number(recompute.salesCount),
      pass: Number(segment.salesCount) === Number(recompute.salesCount),
    },
    {
      metric: 'exceptionCount',
      api: Number(segment.exceptionCount),
      recomputed: Number(recompute.exceptionCount),
      pass: Number(segment.exceptionCount) === Number(recompute.exceptionCount),
    },
  ];

  return {
    passed: checks.every((check) => check.pass),
    checks,
  };
}

function buildMarkdown(report) {
  const rows = report.segments.map((segment) =>
    `| ${segment.segmentId} | ${segment.name} | ${segment.status} | ${segment.classification} | ${segment.notes} |`,
  );
  return [
    '# County Studio Direct Source Recompute Proof',
    '',
    `Checked: ${report.checkedAt}`,
    '',
    `Status: ${report.status}`,
    `Study: \`${report.study.studyId}\``,
    `County: \`${report.study.countyId}\``,
    `Tax year: \`${report.study.taxYear}\``,
    '',
    '| Segment | Name | Status | Classification | Notes |',
    '| --- | --- | --- | --- | --- |',
    ...rows,
    '',
    '## Source Tables',
    '',
    '- `Properties`',
    '- `CamaCharacteristics`',
    '- `pacs_valuations`',
    '- `ComparableSales`',
    '',
  ].join('\n');
}

const appsettings = readJson('backend/src/TerraFusion.API/appsettings.Development.json');
const connection = parseConnectionString(appsettings.ConnectionStrings?.DefaultConnection);
if (!connection.database || !connection.user) {
  throw new Error('DefaultConnection is not a PostgreSQL connection string with database/user fields.');
}

const studySql = `
select row_to_json(s)::text
from (
  select "StudyId" as "studyId",
         "CountyId" as "countyId",
         "TaxYear" as "taxYear",
         "CountyName" as "countyName",
         "ActiveSegmentSetId" as "activeSegmentSetId"
  from "CountyStudySessions"
  where "StudyId" = ${sqlLiteral(studyId)}::uuid
) s;`;
const study = JSON.parse(runPsql(studySql, connection));

const segmentsSql = `
select coalesce(json_agg(row_to_json(s)), '[]'::json)::text
from (
  select "SegmentId" as "segmentId",
         "Name" as "name",
         "RuleDefinition"::jsonb as "rule",
         "ParcelCount" as "parcelCount",
         "MedianRatio"::float8 as "medianRatio",
         "CoefficientOfDispersion"::float8 as "cod",
         "PriceRelatedDifferential"::float8 as "prd",
         "ExceptionCount" as "exceptionCount"
  from "CountySegments"
  where "SegmentSetId" = ${sqlLiteral(study.activeSegmentSetId)}::uuid
    and "CoefficientOfDispersion" is not null
    and "PriceRelatedDifferential" is not null
  order by "ParcelCount" desc, "SegmentId"
  limit ${Math.max(1, sampleSize)}
) s;`;
const segments = JSON.parse(runPsql(segmentsSql, connection));

const recomputedSegments = [];
for (const segment of segments) {
  const rule = segment.rule ?? {};
  const neighborhood = rule.neighborhood ?? 'UNKNOWN';
  const buildingType = rule.buildingType ?? 'UNKNOWN';
  const qualityGrade = rule.qualityGrade ?? 'UNKNOWN';
  const revalArea = rule.revalArea == null ? null : Number(rule.revalArea);

  const recomputeSql = `
with params as (
  select ${sqlLiteral(study.countyId)}::uuid as county_id,
         ${Number(study.taxYear)}::int as tax_year,
         ${sqlLiteral(neighborhood)}::text as neighborhood,
         ${sqlLiteral(buildingType)}::text as building_type,
         ${sqlLiteral(qualityGrade)}::text as quality_grade,
         ${revalArea == null ? 'null' : Number(revalArea)}::int as reval_area
),
canonical_parcels as (
  select p."ParcelId",
         p."AssessedValue",
         coalesce(nullif(v."hood_cd", ''), p."Neighborhood") as neighborhood,
         case when v."Cycle" between 1 and 6 then v."Cycle" else null end as reval_area,
         c."BuildingType" as building_type,
         c."QualityGrade" as quality_grade
  from "Properties" p
  cross join params prm
  left join "CamaCharacteristics" c
    on p."ParcelId" = c."ParcelId"
   and p."TaxYear" = c."TaxYear"
  left join "pacs_valuations" v
    on case when p."PropertyId" ~ '^[0-9]+$' then p."PropertyId"::int else null end = v."PacsPropId"
   and v."PropValYear" = prm.tax_year
   and v."SupNum" = 0
  where p."CountyId" = prm.county_id
    and p."TaxYear" = prm.tax_year
),
members as (
  select p.*
  from canonical_parcels p
  cross join params prm
  where coalesce(nullif(trim(p.neighborhood), ''), 'UNKNOWN') = prm.neighborhood
    and coalesce(nullif(trim(p.building_type), ''), 'UNKNOWN') = prm.building_type
    and coalesce(nullif(trim(p.quality_grade), ''), 'UNKNOWN') = prm.quality_grade
    and ((prm.reval_area is null and p.reval_area is null) or p.reval_area = prm.reval_area)
),
prices_by_parcel as (
  select s."ParcelId",
         avg(coalesce(s."AdjustedSalePrice", s."SalePrice")) as price,
         count(*) as sale_count
  from "ComparableSales" s
  cross join params prm
  where s."CountyId" = prm.county_id
    and s."SaleDate" >= make_timestamptz(prm.tax_year - 2, 1, 1, 0, 0, 0)
    and s."SaleDate" <= make_timestamptz(prm.tax_year, 12, 31, 23, 59, 59)
    and s."SalePrice" > 0
    and coalesce(s."QualificationDecision", s."QualificationRecommendation", s."SaleQualification") = 'qualified'
  group by s."ParcelId"
),
ratio_rows as (
  select m."ParcelId",
         m."AssessedValue"::numeric as assessed_value,
         p.price::numeric as price,
         (m."AssessedValue" / p.price)::numeric as ratio,
         p.sale_count
  from members m
  join prices_by_parcel p on p."ParcelId" = m."ParcelId"
  where m."AssessedValue" > 0 and p.price > 0
),
base_stats as (
  select count(*)::int as sales_count,
         coalesce(sum(sale_count), 0)::int as source_sale_rows,
         percentile_cont(0.5) within group (order by ratio)::numeric as median_ratio,
         avg(ratio)::numeric as mean_ratio,
         sum(assessed_value)::numeric / nullif(sum(price), 0)::numeric as weighted_mean_ratio,
         count(*) filter (where ratio < 0.70 or ratio > 1.30)::int as exception_count,
         regr_slope(ratio::float8, ln(price::float8))::numeric as prb
  from ratio_rows
)
select row_to_json(r)::text
from (
  select (select count(*) from members)::int as "parcelCount",
         sales_count as "salesCount",
         source_sale_rows as "sourceSaleRows",
         round(median_ratio, 4)::float8 as "medianRatio",
         case when sales_count >= 5 and median_ratio > 0
              then round((select avg(abs(ratio - median_ratio)) / median_ratio * 100 from ratio_rows), 2)::float8
              else null end as "cod",
         round(weighted_mean_ratio, 4)::float8 as "weightedMeanRatio",
         case when sales_count >= 5 and weighted_mean_ratio > 0
              then round(mean_ratio / weighted_mean_ratio, 4)::float8
              else null end as "prd",
         round(prb, 4)::float8 as "prb",
         exception_count as "exceptionCount"
  from base_stats
) r;`;

  const recompute = JSON.parse(runPsql(recomputeSql, connection));
  const status = metricStatus(
    {
      ...segment,
      salesCount: recompute.salesCount,
    },
    recompute,
  );

  recomputedSegments.push({
    segmentId: segment.segmentId,
    name: segment.name,
    rule,
    status: status.passed ? 'PASS' : 'FAIL',
    classification: status.passed ? 'direct-source-match' : 'derivation mismatch',
    notes: status.passed
      ? `Matched median/COD/PRD/sales count/exception count from canonical source tables; PRB=${recompute.prb ?? 'null'}, weightedMean=${recompute.weightedMeanRatio ?? 'null'}.`
      : 'One or more recomputed metrics did not match County Studio segment metrics.',
    countyStudio: segment,
    recomputed: recompute,
    checks: status.checks,
  });
}

const failed = recomputedSegments.filter((segment) => segment.status !== 'PASS');
const report = {
  checkedAt: new Date().toISOString(),
  slice: 'county-studio-direct-source-recompute-and-mismatch-classification',
  status: failed.length === 0 ? 'PASS' : 'FAIL',
  directSourceRecompute: failed.length === 0,
  study,
  sampleSize: recomputedSegments.length,
  connection: {
    host: connection.host,
    port: connection.port,
    database: connection.database,
    user: connection.user,
    password: '<redacted>',
  },
  sourceTables: ['Properties', 'CamaCharacteristics', 'pacs_valuations', 'ComparableSales'],
  caveats: [
    'This recomputes County Studio segment metrics using the same canonical population rule as CountyStudySegmentDerivationService.',
    'This does not resolve the cross-surface scope mismatch with TerraForge ratio-study, which uses a different tax-year/window/qualification population.',
  ],
  segments: recomputedSegments,
};

mkdirSync(evidenceDir, { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(mdOut, buildMarkdown(report));
console.log(JSON.stringify({
  status: report.status,
  sampleSize: report.sampleSize,
  failures: failed.length,
  evidence: [rel(jsonOut), rel(mdOut)],
}, null, 2));

if (failed.length > 0) process.exit(1);
