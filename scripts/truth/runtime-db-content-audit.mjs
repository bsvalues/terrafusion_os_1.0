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
const bentonParcelSanityPath = path.join(truthDir, 'benton-parcel-count-sanity.json');
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
      distinctParcelNumbers: pick(summary, 'distinctParcelNumbers', 'DistinctParcelNumbers') ?? 0,
      duplicateParcelNumberGroups:
        pick(summary, 'duplicateParcelNumberGroups', 'DuplicateParcelNumberGroups') ?? 0,
      maxRowsPerParcelNumber:
        pick(summary, 'maxRowsPerParcelNumber', 'MaxRowsPerParcelNumber') ?? 0,
    })),
    bentonDecision: pick(payload, 'bentonDecision', 'BentonDecision') ?? null,
    passed: pick(payload, 'passed', 'Passed') === true,
    blockers: pick(payload, 'blockers', 'Blockers') ?? [],
    warnings: pick(payload, 'warnings', 'Warnings') ?? [],
  };
}

function readBentonParcelSanityExpectation() {
  if (!fs.existsSync(bentonParcelSanityPath)) return null;
  try {
    const proof = JSON.parse(fs.readFileSync(bentonParcelSanityPath, 'utf8'));
    const expectedBentonParcelCount = Number.parseInt(
      String(proof.distinctActiveParcelNumbers ?? ''),
      10
    );
    if (
      proof.passed === true &&
      proof.endpointBehavior?.activeCurrentSemanticsProven === true &&
      Number.isFinite(expectedBentonParcelCount) &&
      expectedBentonParcelCount > 0
    ) {
      return {
        expectedBentonParcelCount,
        source: 'benton_parcel_count_sanity',
      };
    }
  } catch {
    return null;
  }
  return null;
}

function applyDerivedBentonExpectation(content) {
  const derived = readBentonParcelSanityExpectation();
  if (!content || content.expectedBentonParcelCount !== null || !derived) return content;

  const bentonSummary = content.countySummaries.find(summary => {
    const name = String(summary.countyName ?? '').toLowerCase();
    return name === 'benton county' || summary.fipsCode === '53005';
  });
  const expected = derived.expectedBentonParcelCount;
  const propertyRowsMatchExpected = bentonSummary?.propertyRows === expected;
  const distinctParcelNumbersMatchExpected = bentonSummary?.distinctParcelNumbers === expected;
  const derivedDecision = {
    ...(content.bentonDecision ?? {}),
    expectedParcelCount: expected,
    propertyRowsMatchExpected,
    distinctParcelIdsMatchExpected: false,
    distinctParcelNumbersMatchExpected,
    classification: propertyRowsMatchExpected
      ? 'derived_count_matches_canonical_tf_parcel_rows'
      : distinctParcelNumbersMatchExpected
        ? 'derived_count_matches_distinct_canonical_parcels'
        : 'derived_count_matches_neither_canonical_rows_nor_distinct_parcels',
  };
  const blockers = (content.blockers ?? []).filter(
    blocker => blocker !== 'Expected Benton parcel count is not configured.'
  );
  if (!propertyRowsMatchExpected && !distinctParcelNumbersMatchExpected) {
    blockers.push(
      `Derived Benton parcel count ${expected} matches neither canonical_tf.tf_parcel rows ${bentonSummary?.propertyRows ?? 0} nor distinct parcel numbers ${bentonSummary?.distinctParcelNumbers ?? 0}.`
    );
  }

  return {
    ...content,
    expectedBentonParcelCount: expected,
    expectedBentonParcelCountSource: derived.source,
    bentonDecision: derivedDecision,
    blockers: [...new Set(blockers)],
    passed: blockers.length === 0,
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

  const content = probe.payload
    ? applyDerivedBentonExpectation(normalizePayload(probe.payload))
    : null;
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
      String(summary.distinctParcelNumbers),
      String(summary.duplicateParcelNumberGroups),
      String(summary.maxRowsPerParcelNumber),
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
    `- Expected Benton parcel count source: ${content.expectedBentonParcelCountSource ?? '-'}`,
    `- Benton classification: ${decision.classification ?? '-'}`,
    `- Property rows match expected: ${decision.propertyRowsMatchExpected ? 'yes' : 'no'}`,
    `- Distinct ParcelNumbers match expected: ${decision.distinctParcelNumbersMatchExpected ? 'yes' : 'no'}`,
    '',
    '## County Canonical Parcel Shape',
    '',
    '| County | FIPS | Active TF Parcel Rows | Distinct ParcelNumbers | Duplicate ParcelNumber Groups | Max Rows Per ParcelNumber |',
    '|---|---|---:|---:|---:|---:|',
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
    'This audit reads TerraFusion DB canonical runtime tables only. It does not inspect upstream source systems or bridge credentials.',
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
