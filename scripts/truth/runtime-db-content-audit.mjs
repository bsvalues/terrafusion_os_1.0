#!/usr/bin/env node

/**
 * Runtime TerraFusion DB Content Audit
 *
 * Explains the Benton parcel-count mismatch from TerraFusion DB tables only.
 * This script does not inspect upstream source systems.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { runtimeFetch } from './runtime-auth.mjs';

const repoRoot = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const truthDir = path.join(repoRoot, 'generated', 'truth');
const outJson = path.join(truthDir, 'runtime-db-content-audit.json');
const outMd = path.join(truthDir, 'runtime-db-content-audit.md');
const runtimeBaseUrl =
  process.env.TF_RUNTIME_BASE_URL ??
  process.env.TERRAFUSION_RUNTIME_BASE_URL ??
  'http://localhost:5046';

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, '/');
}

async function getJson(endpoint) {
  try {
    const response = await runtimeFetch(endpoint, { headers: { accept: 'application/json' } });
    const text = await response.text();
    let payload = null;
    if (
      (response.headers.get('content-type') ?? '').includes('json') ||
      /^[\s\r\n]*[{[]/.test(text)
    ) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }
    }
    return { status: response.status, payload, error: null };
  } catch (error) {
    return {
      status: null,
      payload: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function pick(object, ...names) {
  if (!object || typeof object !== 'object') return undefined;
  for (const name of names) {
    if (Object.prototype.hasOwnProperty.call(object, name)) return object[name];
  }
  return undefined;
}

function normalizePayload(payload) {
  const summaries = pick(payload, 'countySummaries', 'CountySummaries') ?? [];
  return {
    expectedBentonParcelCount:
      pick(payload, 'expectedBentonParcelCount', 'ExpectedBentonParcelCount') ?? null,
    totalCounties: pick(payload, 'totalCounties', 'TotalCounties') ?? 0,
    totalProperties: pick(payload, 'totalProperties', 'TotalProperties') ?? 0,
    countySummaries: summaries.map(summary => ({
      countyId: pick(summary, 'countyId', 'CountyId') ?? null,
      countyName: pick(summary, 'countyName', 'CountyName') ?? null,
      fipsCode: pick(summary, 'fipsCode', 'FipsCode') ?? null,
      propertyRows: pick(summary, 'propertyRows', 'PropertyRows') ?? 0,
      distinctParcelIds: pick(summary, 'distinctParcelIds', 'DistinctParcelIds') ?? 0,
      distinctParcelNumbers: pick(summary, 'distinctParcelNumbers', 'DistinctParcelNumbers') ?? 0,
      distinctPropertyIds: pick(summary, 'distinctPropertyIds', 'DistinctPropertyIds') ?? 0,
      duplicateParcelIdGroups:
        pick(summary, 'duplicateParcelIdGroups', 'DuplicateParcelIdGroups') ?? 0,
      duplicateParcelNumberGroups:
        pick(summary, 'duplicateParcelNumberGroups', 'DuplicateParcelNumberGroups') ?? 0,
      maxRowsPerParcelId: pick(summary, 'maxRowsPerParcelId', 'MaxRowsPerParcelId') ?? 0,
      taxYears: pick(summary, 'taxYears', 'TaxYears') ?? [],
    })),
    bentonDecision: pick(payload, 'bentonDecision', 'BentonDecision') ?? null,
    passed: pick(payload, 'passed', 'Passed') === true,
    blockers: pick(payload, 'blockers', 'Blockers') ?? [],
    warnings: pick(payload, 'warnings', 'Warnings') ?? [],
  };
}

function evaluate(probe) {
  const blockers = [];
  const warnings = [];

  if (probe.status !== 200) {
    blockers.push(`Runtime DB content endpoint did not return 200. Status: ${probe.status}.`);
  }
  if (probe.error) blockers.push(`Runtime DB content endpoint failed: ${probe.error}`);
  if (!probe.payload) blockers.push('Runtime DB content endpoint did not return JSON payload.');

  const content = probe.payload ? normalizePayload(probe.payload) : null;
  if (content) {
    if (!content.passed) blockers.push(...content.blockers);
    warnings.push(...content.warnings);
  }

  return {
    endpointStatus: probe.status,
    passed: blockers.length === 0,
    blockers: [...new Set(blockers)],
    warnings: [...new Set(warnings)],
    content,
  };
}

function renderMarkdown(report) {
  const content = report.content ?? {};
  const rows = (content.countySummaries ?? []).map(summary =>
    [
      summary.countyName ?? '-',
      summary.fipsCode ?? '-',
      String(summary.propertyRows),
      String(summary.distinctParcelIds),
      String(summary.distinctParcelNumbers),
      String(summary.distinctPropertyIds),
      String(summary.duplicateParcelIdGroups),
      String(summary.duplicateParcelNumberGroups),
      String(summary.maxRowsPerParcelId),
    ].join(' | ')
  );
  const decision = content.bentonDecision ?? {};

  return [
    '# Runtime TerraFusion DB Content Audit',
    '',
    `Generated: ${report.generatedAt}`,
    `Runtime base URL: \`${report.runtimeBaseUrl}\``,
    '',
    '## Status',
    '',
    `- Result: ${report.passed ? 'PASS' : 'FAIL'}`,
    `- Endpoint status: ${report.endpointStatus ?? 'unreachable'}`,
    `- Expected Benton parcel count: ${content.expectedBentonParcelCount ?? '-'}`,
    `- Benton classification: ${decision.classification ?? '-'}`,
    `- Property rows match expected: ${decision.propertyRowsMatchExpected ? 'yes' : 'no'}`,
    `- Distinct ParcelIds match expected: ${decision.distinctParcelIdsMatchExpected ? 'yes' : 'no'}`,
    `- Distinct ParcelNumbers match expected: ${decision.distinctParcelNumbersMatchExpected ? 'yes' : 'no'}`,
    '',
    '## County Property Shape',
    '',
    '| County | FIPS | Property Rows | Distinct ParcelIds | Distinct ParcelNumbers | Distinct PropertyIds | Duplicate ParcelId Groups | Duplicate ParcelNumber Groups | Max Rows Per ParcelId |',
    '|---|---|---:|---:|---:|---:|---:|---:|---:|',
    ...rows,
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
    'This audit reads TerraFusion DB runtime tables only. It does not inspect upstream source systems or bridge credentials.',
  ].join('\n');
}

async function main() {
  const endpoint = new URL('/api/runtime/truth/db-content', runtimeBaseUrl).toString();
  const report = {
    generatedAt: new Date().toISOString(),
    runtimeBaseUrl,
    endpoint,
    ...evaluate(await getJson(endpoint)),
  };

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
        warnings: report.warnings.length,
        expectedBentonParcelCount: report.content?.expectedBentonParcelCount ?? null,
        totalProperties: report.content?.totalProperties ?? null,
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
