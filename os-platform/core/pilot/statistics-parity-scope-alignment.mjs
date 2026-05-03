#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();
const evidenceDir = path.join(repoRoot, 'os-platform/core/pilot/evidence');
const jsonOut = path.join(evidenceDir, 'statistics-parity-scope-alignment.latest.json');
const mdOut = path.join(evidenceDir, 'statistics-parity-scope-alignment.latest.md');

const defaultStudyId = '52eb120f-99d3-4790-a69c-49b6de80cd5e';
const studyId = process.env.TF_DATA_TRUTH_STUDY_ID ?? defaultStudyId;
const apiBase = (process.env.TF_DATA_TRUTH_API_BASE
  ?? process.env.VITE_DEV_HEALTH_BASE
  ?? 'http://localhost:5173/api').replace(/\/$/, '');

function rel(file) {
  return path.relative(repoRoot, file).replaceAll('\\', '/');
}

function readJson(target) {
  return JSON.parse(readFileSync(path.join(repoRoot, target), 'utf8'));
}

function tryReadJson(target) {
  try {
    return readJson(target);
  } catch {
    return null;
  }
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
  const result = spawnSync(
    findPsql(),
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
      maxBuffer: 30 * 1024 * 1024,
    },
  );

  if (result.status !== 0) {
    throw new Error(`psql failed: ${result.stderr || result.stdout}`);
  }

  return result.stdout.trim();
}

async function getJson(route, countyId) {
  const url = route.startsWith('http') ? route : `${apiBase}${route}`;
  const startedAt = Date.now();
  try {
    const response = await fetch(url, {
      headers: {
        'x-county-id': countyId,
      },
    });
    const text = await response.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    return {
      ok: response.ok,
      status: response.status,
      ms: Date.now() - startedAt,
      url,
      body,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      ms: Date.now() - startedAt,
      url,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function round(value, digits) {
  if (value == null || !Number.isFinite(Number(value))) return null;
  return Number(Number(value).toFixed(digits));
}

function numericDelta(a, b) {
  if (a == null || b == null) return null;
  return round(Number(a) - Number(b), 4);
}

function metricView(health, ratioStudy, db) {
  const stats = ratioStudy?.stats ?? {};
  return {
    countyStudioHealth: {
      ratioCount: health?.ratioCount ?? db?.countyStudioHealthPopulation?.ratioCount ?? null,
      medianRatio: health?.medianRatio ?? db?.countyStudioHealthPopulation?.medianRatio ?? null,
      cod: health?.cod ?? db?.countyStudioHealthPopulation?.cod ?? null,
      prd: health?.prd ?? db?.countyStudioHealthPopulation?.prd ?? null,
    },
    terraForgeRatioStudy: {
      countWithRatio: ratioStudy?.countWithRatio ?? db?.terraForgeRatioPopulation?.countWithRatio ?? null,
      outliersExcluded: ratioStudy?.outliersExcluded ?? db?.terraForgeRatioPopulation?.outliersExcluded ?? null,
      medianRatio: stats?.medianRatio ?? db?.terraForgeRatioPopulation?.medianRatio ?? null,
      cod: stats?.cod ?? db?.terraForgeRatioPopulation?.cod ?? null,
      prd: stats?.prd ?? db?.terraForgeRatioPopulation?.prd ?? null,
      weightedMeanRatio: stats?.weightedMeanRatio ?? db?.terraForgeRatioPopulation?.weightedMeanRatio ?? null,
      prb: stats?.prb ?? db?.terraForgeRatioPopulation?.prb ?? null,
    },
  };
}

function buildMarkdown(report) {
  const rows = [
    ['County Studio health', report.populationDefinitions.countyStudioHealth.populationConcept, report.populationDefinitions.countyStudioHealth.countLabel, report.dbCounts.countyStudioHealthPopulation.ratioCount],
    ['TerraForge ratio-study', report.populationDefinitions.terraForgeRatioStudy.populationConcept, report.populationDefinitions.terraForgeRatioStudy.countLabel, report.dbCounts.terraForgeRatioPopulation.countWithRatio],
  ].map((row) => `| ${row[0]} | ${row[1]} | ${row[2]} | ${row[3] ?? 'n/a'} |`);

  const diffs = report.scopeDifferences
    .map((diff) => `| ${diff.field} | ${diff.countyStudioHealth} | ${diff.terraForgeRatioStudy} |`)
    .join('\n');

  return [
    '# Statistics Parity Scope Alignment',
    '',
    `Checked: ${report.checkedAt}`,
    '',
    `Status: ${report.status}`,
    `Study: \`${report.study.studyId}\``,
    `County: \`${report.study.countyId}\` (${report.study.countyName})`,
    `Tax year: \`${report.study.taxYear}\``,
    `Root cause: \`${report.rootCause.label}\``,
    '',
    '## Population Counts',
    '',
    '| Surface | Population concept | Count label | Count |',
    '| --- | --- | --- | ---: |',
    ...rows,
    '',
    `Count difference: ${report.countDifference.countyStudioHealthRatioCount} vs ${report.countDifference.terraForgeCountWithRatio} (${report.countDifference.delta} delta).`,
    '',
    '## Scope Differences',
    '',
    '| Field | County Studio health | TerraForge ratio-study |',
    '| --- | --- | --- |',
    diffs,
    '',
    '## Conversion-Sensitive Fields',
    '',
    ...report.conversionSensitiveFields.map((field) => `- \`${field}\``),
    '',
    '## Conclusion',
    '',
    report.rootCause.notes,
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
         "Status" as "status",
         "ActiveSegmentSetId" as "activeSegmentSetId"
  from "CountyStudySessions"
  where "StudyId" = ${sqlLiteral(studyId)}::uuid
) s;`;
const study = JSON.parse(runPsql(studySql, connection));

if (!study?.activeSegmentSetId) {
  throw new Error(`Study ${studyId} does not have an active segment set.`);
}

const populationSql = `
with params as (
  select ${sqlLiteral(study.studyId)}::uuid as study_id,
         ${sqlLiteral(study.countyId)}::uuid as county_id,
         ${Number(study.taxYear)}::int as tax_year,
         ${sqlLiteral(study.activeSegmentSetId)}::uuid as segment_set_id
),
health_group_keys as (
  select distinct
         coalesce(nullif("RuleDefinition"::jsonb ->> 'neighborhood', ''), 'UNKNOWN') as hood,
         coalesce(nullif("RuleDefinition"::jsonb ->> 'buildingType', ''), 'UNKNOWN') as building_type,
         coalesce(nullif("RuleDefinition"::jsonb ->> 'qualityGrade', ''), 'UNKNOWN') as quality_grade
  from "CountySegments" s
  cross join params prm
  where s."SegmentSetId" = prm.segment_set_id
    and s."RuleDefinition" is not null
),
health_in_scope as (
  select p."ParcelId",
         p."ParcelNumber",
         p."AssessedValue"::numeric as assessed_value,
         coalesce(nullif(p."Neighborhood", ''), 'UNKNOWN') as hood,
         coalesce(nullif(c."BuildingType", ''), 'UNKNOWN') as building_type,
         coalesce(nullif(c."QualityGrade", ''), 'UNKNOWN') as quality_grade
  from "Properties" p
  cross join params prm
  left join "CamaCharacteristics" c
    on p."ParcelId" = c."ParcelId"
   and p."TaxYear" = c."TaxYear"
  join health_group_keys g
    on coalesce(nullif(p."Neighborhood", ''), 'UNKNOWN') = g.hood
   and coalesce(nullif(c."BuildingType", ''), 'UNKNOWN') = g.building_type
   and coalesce(nullif(c."QualityGrade", ''), 'UNKNOWN') = g.quality_grade
  where p."CountyId" = prm.county_id
    and p."TaxYear" = prm.tax_year
),
health_sales as (
  select s."Id",
         s."ParcelId",
         avg(coalesce(s."AdjustedSalePrice", s."SalePrice")) as price,
         count(*) as sale_count
  from "ComparableSales" s
  cross join params prm
  join health_in_scope p on p."ParcelId" = s."ParcelId"
  where s."CountyId" = prm.county_id
    and s."SaleDate" >= make_timestamptz(prm.tax_year - 2, 1, 1, 0, 0, 0)
    and s."SaleDate" <= make_timestamptz(prm.tax_year, 12, 31, 23, 59, 59)
    and s."SalePrice" > 0
    and coalesce(s."QualificationDecision", s."QualificationRecommendation", s."SaleQualification") = 'qualified'
  group by s."Id", s."ParcelId"
),
health_prices_by_parcel as (
  select "ParcelId",
         avg(price)::numeric as price,
         sum(sale_count)::int as source_sale_rows
  from health_sales
  group by "ParcelId"
),
health_ratio_rows as (
  select p."ParcelId",
         p."ParcelNumber",
         p.assessed_value,
         h.price,
         (p.assessed_value / h.price)::numeric as ratio,
         h.source_sale_rows
  from health_in_scope p
  join health_prices_by_parcel h on h."ParcelId" = p."ParcelId"
  where p.assessed_value > 0 and h.price > 0
),
health_stats as (
  select count(*)::int as ratio_count,
         coalesce(sum(source_sale_rows), 0)::int as source_sale_rows,
         percentile_cont(0.5) within group (order by ratio)::numeric as median_ratio,
         avg(ratio)::numeric as mean_ratio,
         sum(assessed_value)::numeric / nullif(sum(price), 0)::numeric as weighted_mean_ratio,
         regr_slope(ratio::float8, ln(price::float8))::numeric as prb
  from health_ratio_rows
),
terra_base_sales as (
  select s."Id",
         s."ParcelId",
         coalesce(s."AdjustedSalePrice", s."SalePrice")::numeric as price,
         s."SaleDate",
         s."SalesYear",
         s."QualificationDecision",
         s."QualificationRecommendation",
         s."SaleQualification",
         s."SuppressOnRatioRptCd",
         s."IncludeNoCalc"
  from "ComparableSales" s
  cross join params prm
  where s."CountyId" = prm.county_id
    and (s."SalesYear" = prm.tax_year
      or (s."SalesYear" is null
        and s."SaleDate" >= make_timestamptz(prm.tax_year - 2, 1, 1, 0, 0, 0)
        and s."SaleDate" < make_timestamptz(prm.tax_year, 1, 1, 0, 0, 0)))
    and (s."QualificationDecision" = 'qualified'
      or (s."QualificationDecision" is null
        and (s."QualificationRecommendation" = 'qualified' or s."QualificationRecommendation" is null)))
    and (s."SuppressOnRatioRptCd" is null or s."SuppressOnRatioRptCd" <> 'T')
    and coalesce(s."IncludeNoCalc", false) <> true
),
terra_ratio_rows as (
  select s."Id",
         s."ParcelId",
         p."ParcelNumber",
         p."AssessedValue"::numeric as assessed_value,
         s.price,
         (p."AssessedValue" / s.price)::numeric as ratio
  from terra_base_sales s
  join "Properties" p
    on p."ParcelNumber" = s."ParcelId"
  cross join params prm
  where p."CountyId" = prm.county_id
    and p."TaxYear" = prm.tax_year
    and p."AssessedValue" > 0
    and s.price > 0
),
terra_iqr as (
  select percentile_cont(0.25) within group (order by ratio)::numeric as q1,
         percentile_cont(0.75) within group (order by ratio)::numeric as q3
  from terra_ratio_rows
),
terra_trimmed_rows as (
  select r.*
  from terra_ratio_rows r
  cross join terra_iqr i
  where i.q1 is null
     or r.ratio between (i.q1 - (1.5 * (i.q3 - i.q1))) and (i.q3 + (1.5 * (i.q3 - i.q1)))
),
terra_stats as (
  select count(*)::int as trimmed_count,
         percentile_cont(0.5) within group (order by ratio)::numeric as median_ratio,
         avg(ratio)::numeric as mean_ratio,
         sum(assessed_value)::numeric / nullif(sum(price), 0)::numeric as weighted_mean_ratio,
         regr_slope(ratio::float8, ln(price::float8))::numeric as prb
  from terra_trimmed_rows
),
shared_sales as (
  select count(*)::int as shared_sale_rows
  from health_sales h
  join terra_base_sales t on t."Id" = h."Id"
),
health_not_terra as (
  select count(*)::int as sale_rows
  from health_sales h
  left join terra_base_sales t on t."Id" = h."Id"
  where t."Id" is null
),
terra_not_health as (
  select count(*)::int as sale_rows
  from terra_base_sales t
  left join health_sales h on h."Id" = t."Id"
  where h."Id" is null
)
select row_to_json(r)::text
from (
  select
    json_build_object(
      'activeSegmentSetId', (select segment_set_id from params),
      'activeSegmentKeyCount', (select count(*) from health_group_keys),
      'inScopeParcelCount', (select count(*) from health_in_scope),
      'matchedSaleRows', (select count(*) from health_sales),
      'ratioCount', (select ratio_count from health_stats),
      'sourceSaleRows', (select source_sale_rows from health_stats),
      'medianRatio', round((select median_ratio from health_stats), 4)::float8,
      'cod', case when (select ratio_count from health_stats) >= 5 and (select median_ratio from health_stats) > 0
        then round((select avg(abs(ratio - (select median_ratio from health_stats))) / (select median_ratio from health_stats) * 100 from health_ratio_rows), 2)::float8
        else null end,
      'weightedMeanRatio', round((select weighted_mean_ratio from health_stats), 4)::float8,
      'prd', case when (select ratio_count from health_stats) >= 5 and (select weighted_mean_ratio from health_stats) > 0
        then round((select mean_ratio from health_stats) / (select weighted_mean_ratio from health_stats), 4)::float8
        else null end,
      'prb', round((select prb from health_stats), 4)::float8
    ) as "countyStudioHealthPopulation",
    json_build_object(
      'baseSaleRows', (select count(*) from terra_base_sales),
      'countWithRatio', (select count(*) from terra_ratio_rows),
      'outliersExcluded', (select count(*) from terra_ratio_rows) - (select count(*) from terra_trimmed_rows),
      'trimmedCount', (select trimmed_count from terra_stats),
      'medianRatio', round((select median_ratio from terra_stats), 4)::float8,
      'cod', case when (select trimmed_count from terra_stats) >= 5 and (select median_ratio from terra_stats) > 0
        then round((select avg(abs(ratio - (select median_ratio from terra_stats))) / (select median_ratio from terra_stats) * 100 from terra_trimmed_rows), 2)::float8
        else null end,
      'weightedMeanRatio', round((select weighted_mean_ratio from terra_stats), 4)::float8,
      'prd', case when (select trimmed_count from terra_stats) >= 5 and (select weighted_mean_ratio from terra_stats) > 0
        then round((select mean_ratio from terra_stats) / (select weighted_mean_ratio from terra_stats), 4)::float8
        else null end,
      'prb', round((select prb from terra_stats), 4)::float8
    ) as "terraForgeRatioPopulation",
    json_build_object(
      'sharedSaleRows', (select shared_sale_rows from shared_sales),
      'healthSaleRowsNotInTerraForge', (select sale_rows from health_not_terra),
      'terraForgeSaleRowsNotInHealth', (select sale_rows from terra_not_health)
    ) as "overlap"
) r;`;

const dbCounts = JSON.parse(runPsql(populationSql, connection));

const [healthResponse, ratioResponse] = await Promise.all([
  getJson(`/county-study/studies/${study.studyId}/health-summary`, study.countyId),
  getJson(`/terraforge/ratio-study?taxYear=${study.taxYear}&countyId=${study.countyId}`, study.countyId),
]);

const trustModel = tryReadJson('os-platform/core/pilot/county-data-trust-tiers.json');
const countyRule = trustModel?.countyRules?.find((rule) =>
  rule.countyId && String(rule.countyId).toLowerCase() === String(study.countyId).toLowerCase(),
);
const conversionSensitiveFields = countyRule?.conversionRisks?.flatMap((risk) => risk.affectedFields) ?? [
  'QualificationDecision',
  'QualificationRecommendation',
  'SaleQualification',
  'SuppressOnRatioRptCd',
  'IncludeNoCalc',
];

const apiMetrics = metricView(
  healthResponse.ok ? healthResponse.body : null,
  ratioResponse.ok ? ratioResponse.body : null,
  dbCounts,
);
const countDifference = {
  countyStudioHealthRatioCount: apiMetrics.countyStudioHealth.ratioCount,
  terraForgeCountWithRatio: apiMetrics.terraForgeRatioStudy.countWithRatio,
  delta: numericDelta(apiMetrics.countyStudioHealth.ratioCount, apiMetrics.terraForgeRatioStudy.countWithRatio),
};

const scopeDifferences = [
  {
    field: 'Population concept',
    countyStudioHealth: 'Active segment-set parcel rollup for the study.',
    terraForgeRatioStudy: 'County-wide effective qualified sale pool.',
  },
  {
    field: 'Parcel/sale identifier join',
    countyStudioHealth: 'ComparableSales.ParcelId joins Properties.ParcelId.',
    terraForgeRatioStudy: 'ComparableSales.ParcelId maps to Properties.ParcelNumber for assessed value.',
  },
  {
    field: 'Study/segment scope',
    countyStudioHealth: 'Requires parcels matching active CountySegments rule keys.',
    terraForgeRatioStudy: 'No active segment set required; optional hood/propertyType filters only.',
  },
  {
    field: 'Sale date window',
    countyStudioHealth: `SaleDate from Jan 1 ${study.taxYear - 2} through Dec 31 ${study.taxYear}.`,
    terraForgeRatioStudy: `SalesYear=${study.taxYear}, or null SalesYear with SaleDate from Jan 1 ${study.taxYear - 2} through Dec 31 ${study.taxYear - 1}.`,
  },
  {
    field: 'Qualification rule',
    countyStudioHealth: 'coalesce(QualificationDecision, QualificationRecommendation, SaleQualification) == qualified.',
    terraForgeRatioStudy: 'QualificationDecision == qualified, or null decision with qualified/null recommendation.',
  },
  {
    field: 'Suppression/no-calc handling',
    countyStudioHealth: 'No SuppressOnRatioRptCd or IncludeNoCalc exclusion in health summary loader.',
    terraForgeRatioStudy: 'Excludes SuppressOnRatioRptCd=T and IncludeNoCalc=true.',
  },
  {
    field: 'Outlier handling',
    countyStudioHealth: 'No IQR trim in health summary rollup.',
    terraForgeRatioStudy: 'Computes stats after Tukey/IQR trim; countWithRatio remains pre-trim.',
  },
];

const rootCause = {
  label: 'scope_mismatch_different_population_definitions',
  blockedParityClaim: true,
  notes: 'County Studio health and TerraForge ratio-study are both ratio surfaces, but they are not currently measuring the same population. The observed mismatch is therefore not proof that either metric is mathematically wrong; it blocks parity until a shared comparison contract is implemented.',
};

const report = {
  checkedAt: new Date().toISOString(),
  slice: 'statistics-parity-scope-alignment',
  status: countDifference.countyStudioHealthRatioCount === countDifference.terraForgeCountWithRatio
    ? 'PASS'
    : 'BLOCKED_SCOPE_MISMATCH',
  study,
  apiBase,
  connection: {
    host: connection.host,
    port: connection.port,
    database: connection.database,
    user: connection.user,
    password: '<redacted>',
  },
  apiChecks: {
    countyStudioHealth: {
      ok: healthResponse.ok,
      status: healthResponse.status,
      ms: healthResponse.ms,
      url: healthResponse.url,
      error: healthResponse.error ?? null,
    },
    terraForgeRatioStudy: {
      ok: ratioResponse.ok,
      status: ratioResponse.status,
      ms: ratioResponse.ms,
      url: ratioResponse.url,
      error: ratioResponse.error ?? null,
    },
  },
  apiMetrics,
  dbCounts,
  countDifference,
  populationDefinitions: {
    countyStudioHealth: {
      populationConcept: 'Active segment-set parcel-weighted health rollup',
      countLabel: 'ratioCount',
      sourceTables: ['CountyStudySessions', 'CountySegments', 'Properties', 'CamaCharacteristics', 'ComparableSales'],
      codePath: 'backend/src/TerraFusion.Core/Services/CountyStudyHealthService.cs',
    },
    terraForgeRatioStudy: {
      populationConcept: 'County-wide effective qualified sale ratio study',
      countLabel: 'countWithRatio',
      sourceTables: ['ComparableSales', 'Properties'],
      codePath: 'backend/src/TerraFusion.API/Controllers/TerraForgeController.cs',
    },
  },
  scopeDifferences,
  conversionSensitiveFields: [...new Set(conversionSensitiveFields)],
  overlap: dbCounts.overlap,
  rootCause,
  requiredClosure: [
    'Define a shared comparison contract: county, study/tax year, qualification pool, sale window, active segment/cohort scope, identifier join, suppression/no-calc policy, and outlier policy.',
    'Run TerraForge ratio-study with a County Studio-compatible scoped population, or add a dedicated County Studio parity endpoint that exposes the exact same population definition.',
    'Keep Statistics Studio visible and keep the County Studio statistics superset claim provisional until the shared-population parity check passes.',
  ],
};

mkdirSync(evidenceDir, { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(mdOut, buildMarkdown(report));

console.log(JSON.stringify({
  status: report.status,
  rootCause: report.rootCause.label,
  countDifference: report.countDifference,
  overlap: report.overlap,
  evidence: [rel(jsonOut), rel(mdOut)],
}, null, 2));

if (report.status !== 'PASS') process.exitCode = 1;
