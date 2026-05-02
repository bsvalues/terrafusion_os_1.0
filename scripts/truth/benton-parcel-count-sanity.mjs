#!/usr/bin/env node

/**
 * Benton Parcel Count Sanity Gate
 *
 * Reads TerraFusion DB and the TerraFusion runtime API only. It does not inspect
 * upstream source systems, does not use source credentials, and does not mutate data.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const truthDir = path.join(repoRoot, 'generated', 'truth');
const outJson = path.join(truthDir, 'benton-parcel-count-sanity.json');
const outMd = path.join(truthDir, 'benton-parcel-count-sanity.md');

const runtimeBaseUrl =
  process.env.TF_RUNTIME_BASE_URL ??
  process.env.TERRAFUSION_RUNTIME_BASE_URL ??
  'http://localhost:5046';
const pgContainer = process.env.TF_PG_CONTAINER ?? 'terrafusion-postgres-dev';
const pgDatabase = process.env.TF_PG_DATABASE ?? 'terrafusion';
const pgUser = process.env.TF_PG_USER ?? 'postgres';
const fixturePath = process.env.TF_BENTON_PARCEL_SANITY_FIXTURE
  ? path.resolve(process.env.TF_BENTON_PARCEL_SANITY_FIXTURE)
  : null;

const expectedActiveParcelRange = {
  min: Number.parseInt(process.env.TF_BENTON_ACTIVE_PARCEL_MIN ?? '1', 10),
  max: Number.parseInt(process.env.TF_BENTON_ACTIVE_PARCEL_MAX ?? '100000', 10),
  source: 'operator_expectation',
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

function number(value) {
  const parsed = Number.parseInt(String(value ?? '').trim(), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseRows(output, mapper) {
  if (!output) return [];
  return output
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => mapper(line.split('|')));
}

function getScalar(sql) {
  return psql(sql).split(/\r?\n/)[0]?.trim() ?? '';
}

function getBentonCountyId() {
  return getScalar(
    `select "Id" from "Counties" where lower("Name") in ('benton county', 'benton') or "FipsCode" = '53005' order by "Name" limit 1;`
  );
}

function getPropertyColumns() {
  const output = psql(
    `select column_name from information_schema.columns where table_schema='public' and table_name='Properties';`
  );
  return new Set(
    output
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
  );
}

function detectStatusColumns(columns) {
  return ['Status', 'PropertyStatus', 'ParcelStatus', 'IsActive', 'Active'].filter(column =>
    columns.has(column)
  );
}

function queryDatabase() {
  const columns = getPropertyColumns();
  const statusColumns = detectStatusColumns(columns);
  const bentonCountyId = getBentonCountyId();

  const totalPropertyRows = number(getScalar(`select count(*) from "Properties";`));
  const bentonRowsByCountyId = bentonCountyId
    ? number(getScalar(`select count(*) from "Properties" where "CountyId"='${bentonCountyId}';`))
    : 0;
  const bentonRowsByCountyName = number(
    getScalar(
      `select count(*) from "Properties" p join "Counties" c on c."Id" = p."CountyId" where lower(c."Name") = 'benton county';`
    )
  );
  const nullCountyRows = number(
    getScalar(`select count(*) from "Properties" where "CountyId" is null;`)
  );
  const nonBentonRows = bentonCountyId
    ? number(
        getScalar(
          `select count(*) from "Properties" where "CountyId" is not null and "CountyId" <> '${bentonCountyId}';`
        )
      )
    : 0;

  const distinctParcelNumbers = number(
    getScalar(
      `select count(distinct nullif(coalesce("ParcelNumber", "ParcelId"), '')) from "Properties" where "CountyId"='${bentonCountyId}';`
    )
  );
  const currentTaxYearRaw = getScalar(
    `select max("TaxYear") from "Properties" where "CountyId"='${bentonCountyId}';`
  );
  const currentTaxYear = currentTaxYearRaw ? number(currentTaxYearRaw) : null;
  const distinctCurrentYearParcelNumbers = currentTaxYear
    ? number(
        getScalar(
          `select count(distinct nullif(coalesce("ParcelNumber", "ParcelId"), '')) from "Properties" where "CountyId"='${bentonCountyId}' and "TaxYear"=${currentTaxYear};`
        )
      )
    : 0;

  const rowsByTaxYear = parseRows(
    psql(
      `select coalesce("TaxYear"::text, ''), count(*), count(distinct nullif(coalesce("ParcelNumber", "ParcelId"), '')) from "Properties" where "CountyId"='${bentonCountyId}' group by "TaxYear" order by "TaxYear" nulls first;`
    ),
    parts => ({
      taxYear: parts[0] === '' ? null : number(parts[0]),
      rows: number(parts[1]),
      distinctParcels: number(parts[2]),
    })
  );

  const rowsByCounty = parseRows(
    psql(
      `select coalesce(p."CountyId"::text, ''), coalesce(c."Name", ''), count(*) from "Properties" p left join "Counties" c on c."Id" = p."CountyId" group by p."CountyId", c."Name" order by count(*) desc;`
    ),
    parts => ({
      countyId: parts[0] === '' ? null : parts[0],
      countyName: parts[1] === '' ? null : parts[1],
      rows: number(parts[2]),
    })
  );

  const rowsByPropertyStatus = statusColumns.length
    ? parseRows(
        psql(
          `select coalesce(${statusColumns.map(column => `"${column}"::text`).join(', ')}, ''), count(*) from "Properties" where "CountyId"='${bentonCountyId}' group by 1 order by count(*) desc;`
        ),
        parts => ({
          status: parts[0] === '' ? null : parts[0],
          rows: number(parts[1]),
        })
      )
    : [{ status: null, rows: bentonRowsByCountyId }];

  const activeRows = 0;
  const inactiveRows = 0;
  const unknownStatusRows = statusColumns.length ? 0 : bentonRowsByCountyId;
  const distinctActiveParcelNumbers = statusColumns.length ? distinctParcelNumbers : 0;

  return {
    totalPropertyRows,
    bentonRowsByCountyId,
    bentonRowsByCountyName,
    bentonRowsByCountyToken: bentonRowsByCountyId,
    activeRows,
    inactiveRows,
    unknownStatusRows,
    distinctParcelNumbers,
    distinctActiveParcelNumbers,
    distinctCurrentYearParcelNumbers,
    currentTaxYear,
    rowsByTaxYear,
    rowsByPropertyStatus,
    rowsByCounty,
    nullCountyRows,
    nonBentonRows,
    propertyStatusColumns: statusColumns,
  };
}

async function getEndpointBehavior(dbProof) {
  const endpoint = new URL('/api/counties/benton/parcels?limit=1', runtimeBaseUrl).toString();
  try {
    const response = await fetch(endpoint, { headers: { accept: 'application/json' } });
    const text = await response.text();
    const payload = JSON.parse(text);
    const returnedTotal = number(payload.total);
    const countyEcho = String(payload.county ?? '').toLowerCase();
    const countyIdEcho = String(payload.countyId ?? '').toLowerCase();
    return {
      endpoint: '/api/counties/benton/parcels',
      endpointStatus: response.status,
      returnedTotal,
      selectedCountyEchoed:
        response.status === 200 &&
        (countyEcho === 'benton county' ||
          countyIdEcho === String(dbProof.rowsByCounty[0]?.countyId ?? '').toLowerCase()),
      appliesCountyFilter:
        response.status === 200 &&
        returnedTotal === dbProof.bentonRowsByCountyId &&
        dbProof.bentonRowsByCountyId > 0,
      appliesActiveFilter: false,
      appliesCurrentYearFilter:
        response.status === 200 && returnedTotal === dbProof.distinctCurrentYearParcelNumbers,
      collapsesParcelVersions:
        response.status === 200 && returnedTotal === dbProof.distinctParcelNumbers,
    };
  } catch (error) {
    return {
      endpoint: '/api/counties/benton/parcels',
      endpointStatus: null,
      returnedTotal: 0,
      selectedCountyEchoed: false,
      appliesCountyFilter: false,
      appliesActiveFilter: false,
      appliesCurrentYearFilter: false,
      collapsesParcelVersions: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function evaluateBentonParcelSanity(proof) {
  const blockers = [];
  const warnings = [];

  if (!proof.endpointBehavior.selectedCountyEchoed) {
    blockers.push('Benton parcel endpoint did not echo Benton county identity.');
  }

  if (!proof.endpointBehavior.appliesCountyFilter) {
    blockers.push('Benton parcel endpoint does not prove county filtering.');
  }

  if (!proof.endpointBehavior.appliesActiveFilter) {
    blockers.push('Benton parcel endpoint does not apply active/current parcel filtering.');
  }

  if (!proof.endpointBehavior.collapsesParcelVersions) {
    blockers.push('Benton parcel endpoint does not collapse duplicate parcel versions.');
  }

  if (proof.unknownStatusRows > 0) {
    blockers.push(
      `Properties table has ${proof.unknownStatusRows} Benton rows with unknown active/inactive status.`
    );
  }

  if (
    proof.distinctActiveParcelNumbers < proof.expectedActiveParcelRange.min ||
    proof.distinctActiveParcelNumbers > proof.expectedActiveParcelRange.max
  ) {
    blockers.push(
      `Distinct active Benton parcel count ${proof.distinctActiveParcelNumbers} is outside expected range ${proof.expectedActiveParcelRange.min}-${proof.expectedActiveParcelRange.max}.`
    );
  }

  if (proof.distinctCurrentYearParcelNumbers > proof.expectedActiveParcelRange.max) {
    blockers.push(
      `Distinct current-year Benton parcel count ${proof.distinctCurrentYearParcelNumbers} is outside expected maximum ${proof.expectedActiveParcelRange.max}.`
    );
  }

  if (proof.totalPropertyRows === proof.bentonRowsByCountyId && proof.rowsByCounty.length === 1) {
    warnings.push('Runtime DB currently contains only Benton county property rows.');
  }

  return {
    passed: blockers.length === 0,
    blockers,
    warnings,
  };
}

function renderMarkdown(report) {
  return [
    '# Benton Parcel Count Sanity',
    '',
    `Generated: ${report.generatedAt}`,
    `Runtime base URL: \`${report.runtimeBaseUrl}\``,
    '',
    '## Status',
    '',
    `- Result: ${report.passed ? 'PASS' : 'FAIL'}`,
    `- Total Properties rows: ${report.totalPropertyRows}`,
    `- Benton rows by CountyId: ${report.bentonRowsByCountyId}`,
    `- Distinct Benton parcel numbers: ${report.distinctParcelNumbers}`,
    `- Distinct active Benton parcel numbers: ${report.distinctActiveParcelNumbers}`,
    `- Distinct current-year Benton parcel numbers: ${report.distinctCurrentYearParcelNumbers}`,
    `- Current tax year: ${report.currentTaxYear ?? '-'}`,
    `- Expected active parcel range: ${report.expectedActiveParcelRange.min}-${report.expectedActiveParcelRange.max}`,
    '',
    '## Endpoint Behavior',
    '',
    `- Endpoint: \`${report.endpointBehavior.endpoint}\``,
    `- Status: ${report.endpointBehavior.endpointStatus ?? 'unreachable'}`,
    `- Returned total: ${report.endpointBehavior.returnedTotal}`,
    `- Applies county filter: ${report.endpointBehavior.appliesCountyFilter ? 'yes' : 'no'}`,
    `- Applies active filter: ${report.endpointBehavior.appliesActiveFilter ? 'yes' : 'no'}`,
    `- Applies current-year filter: ${report.endpointBehavior.appliesCurrentYearFilter ? 'yes' : 'no'}`,
    `- Collapses parcel versions: ${report.endpointBehavior.collapsesParcelVersions ? 'yes' : 'no'}`,
    '',
    '## Tax Years',
    '',
    '| Tax Year | Rows | Distinct Parcels |',
    '|---|---:|---:|',
    ...report.rowsByTaxYear.map(row =>
      [row.taxYear ?? '-', String(row.rows), String(row.distinctParcels)].join(' | ')
    ),
    '',
    '## Counties',
    '',
    '| CountyId | County | Rows |',
    '|---|---|---:|',
    ...report.rowsByCounty.map(row =>
      [row.countyId ?? '-', row.countyName ?? '-', String(row.rows)].join(' | ')
    ),
    '',
    '## Status Rows',
    '',
    '| Status | Rows |',
    '|---|---:|',
    ...report.rowsByPropertyStatus.map(row =>
      [row.status ?? 'unknown', String(row.rows)].join(' | ')
    ),
    '',
    '## Blockers',
    '',
    ...(report.blockers.length ? report.blockers.map(item => `- ${item}`) : ['- none']),
    '',
    '## Warnings',
    '',
    ...(report.warnings.length ? report.warnings.map(item => `- ${item}`) : ['- none']),
    '',
    '## Trust Rule',
    '',
    'Raw TerraFusion DB property row count is not an active Benton parcel count unless county, status/currentness, tax year, and uniqueness are proven.',
  ].join('\n');
}

async function buildReport() {
  if (fixturePath) {
    const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
    const evaluation = evaluateBentonParcelSanity(fixture);
    return { ...fixture, ...evaluation };
  }

  const dbProof = queryDatabase();
  const endpointBehavior = await getEndpointBehavior(dbProof);
  const proof = {
    generatedAt: new Date().toISOString(),
    runtimeBaseUrl,
    ...dbProof,
    endpointBehavior,
    expectedActiveParcelRange,
  };
  return { ...proof, ...evaluateBentonParcelSanity(proof) };
}

async function main() {
  const report = await buildReport();
  fs.mkdirSync(truthDir, { recursive: true });
  fs.writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(outMd, `${renderMarkdown(report)}\n`);

  console.log(`Wrote ${rel(outJson)}`);
  console.log(`Wrote ${rel(outMd)}`);
  console.log(
    JSON.stringify(
      {
        passed: report.passed,
        blockers: report.blockers.length,
        totalPropertyRows: report.totalPropertyRows,
        distinctActiveParcelNumbers: report.distinctActiveParcelNumbers,
        distinctCurrentYearParcelNumbers: report.distinctCurrentYearParcelNumbers,
      },
      null,
      2
    )
  );

  if (!report.passed) process.exitCode = 1;
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
});
