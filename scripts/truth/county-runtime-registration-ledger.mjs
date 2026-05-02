#!/usr/bin/env node

/**
 * Track 1D - Runtime County Registration Ledger
 *
 * Probes CountyRowsController for each Washington county and classifies runtime
 * registration/readiness. This does not load data, repair routes, or promote
 * counties. It only records what the live runtime proves.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const outDir = path.join(repoRoot, 'generated', 'truth');
const outJson = path.join(outDir, 'county-runtime-registration-ledger.json');
const outMd = path.join(outDir, 'county-runtime-registration-ledger.md');
const runtimeBaseUrl =
  process.env.TF_RUNTIME_BASE_URL ??
  process.env.TERRAFUSION_RUNTIME_BASE_URL ??
  'http://localhost:5046';
const probeTimeoutMs = Number(process.env.TF_COUNTY_RUNTIME_LEDGER_TIMEOUT_MS ?? 5000);

const defaultCounties = [
  'Adams',
  'Asotin',
  'Benton',
  'Chelan',
  'Clallam',
  'Clark',
  'Columbia',
  'Cowlitz',
  'Douglas',
  'Ferry',
  'Franklin',
  'Garfield',
  'Grant',
  'Grays Harbor',
  'Island',
  'Jefferson',
  'King',
  'Kitsap',
  'Kittitas',
  'Klickitat',
  'Lewis',
  'Lincoln',
  'Mason',
  'Okanogan',
  'Pacific',
  'Pend Oreille',
  'Pierce',
  'San Juan',
  'Skagit',
  'Skamania',
  'Snohomish',
  'Spokane',
  'Stevens',
  'Thurston',
  'Wahkiakum',
  'Walla Walla',
  'Whatcom',
  'Whitman',
  'Yakima',
];

const nextRuntimeCandidates = new Set(['Pacific', 'Franklin', 'Walla Walla']);

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, '/');
}

function counties() {
  return (process.env.TF_COUNTY_RUNTIME_LEDGER_COUNTIES ?? defaultCounties.join(','))
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function slugifyCounty(county) {
  return String(county)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeCounty(value) {
  const normalized = String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

  return normalized.endsWith('county') ? normalized.slice(0, -'county'.length) : normalized;
}

function endpointFor(county, rowType) {
  const token = slugifyCounty(county);
  return new URL(`/api/counties/${token}/${rowType}?limit=5`, runtimeBaseUrl).toString();
}

async function probeEndpoint(endpoint, county) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), probeTimeoutMs);

  try {
    const response = await fetch(endpoint, {
      headers: { accept: 'application/json' },
      signal: controller.signal,
    });
    const text = await response.text();
    const contentType = response.headers.get('content-type') ?? '';
    const payload = parsePayload(text, contentType);
    const countyValues = collectCountyValues(payload);
    const payloadCounty = countyValues[0] ?? null;
    const selectedCountyEchoed = countyValues.some(
      value => normalizeCounty(value) === normalizeCounty(county)
    );
    const silentBentonFallbackDetected =
      normalizeCounty(county) !== 'benton' &&
      countyValues.some(value => normalizeCounty(value) === 'benton');

    return {
      endpoint,
      status: response.status,
      runtimeRows: countRuntimeRows(payload),
      payloadCounty,
      selectedCountyEchoed,
      silentBentonFallbackDetected,
      error: null,
    };
  } catch (error) {
    return {
      endpoint,
      status: null,
      runtimeRows: 0,
      payloadCounty: null,
      selectedCountyEchoed: false,
      silentBentonFallbackDetected: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function parsePayload(text, contentType) {
  if ((contentType ?? '').includes('json') || /^[\s\r\n]*[{[]/.test(text)) {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
  return null;
}

function collectCountyValues(value, values = []) {
  if (!value || typeof value !== 'object') return values;
  if (Array.isArray(value)) {
    for (const item of value) collectCountyValues(item, values);
    return values;
  }

  for (const [key, child] of Object.entries(value)) {
    if (/county|countyName|selectedCounty/i.test(key) && typeof child === 'string') {
      values.push(child);
    }
    if (child && typeof child === 'object') collectCountyValues(child, values);
  }
  return [...new Set(values)];
}

function countRuntimeRows(value) {
  if (!value) return 0;
  if (Array.isArray(value)) return value.length;
  if (typeof value !== 'object') return 0;

  for (const key of ['rows', 'data', 'items', 'results', 'records', 'parcels', 'sales']) {
    if (Array.isArray(value[key])) return value[key].length;
  }

  for (const key of ['rowCount', 'count', 'total', 'totalCount']) {
    const count = Number(value[key]);
    if (Number.isFinite(count)) return count;
  }

  return 0;
}

function classifyCountyRuntime(input) {
  const blockers = [];

  if (input.silentBentonFallbackDetected) {
    return {
      readinessClass: 'fallback_violation',
      recommendedAction: 'investigate_endpoint_error',
      blockers: ['Silent Benton fallback detected.'],
    };
  }

  if (input.status === 404) {
    return {
      readinessClass: 'not_registered',
      recommendedAction: nextRuntimeCandidates.has(input.county)
        ? 'load_or_register_next'
        : 'downgrade_from_runtime_candidate',
      blockers: ['County is not registered in runtime endpoint.'],
    };
  }

  if (input.status !== 200) {
    return {
      readinessClass: 'endpoint_error',
      recommendedAction: 'investigate_endpoint_error',
      blockers: [`Runtime endpoint returned ${input.status}.`],
    };
  }

  if (input.runtimeRows <= 0) {
    return {
      readinessClass: 'registered_empty',
      recommendedAction: 'load_or_register_next',
      blockers: ['County endpoint is registered but returns zero rows.'],
    };
  }

  if (!input.selectedCountyEchoed) {
    blockers.push('Runtime did not echo selected county.');
  }

  return {
    readinessClass: blockers.length === 0 ? 'runtime_proven' : 'endpoint_error',
    recommendedAction:
      blockers.length === 0 ? 'keep_runtime_candidate' : 'investigate_endpoint_error',
    blockers,
  };
}

async function buildRow(county) {
  const parcels = await probeEndpoint(endpointFor(county, 'parcels'), county);
  const sales = await probeEndpoint(endpointFor(county, 'sales'), county);
  const classification = classifyCountyRuntime({
    county,
    status: parcels.status,
    runtimeRows: parcels.runtimeRows,
    payloadCounty: parcels.payloadCounty,
    selectedCountyEchoed: parcels.selectedCountyEchoed,
    silentBentonFallbackDetected:
      parcels.silentBentonFallbackDetected || sales.silentBentonFallbackDetected,
  });

  return {
    county,
    countyToken: slugifyCounty(county),
    parcels,
    sales,
    runtimeRows: parcels.runtimeRows,
    payloadCounty: parcels.payloadCounty,
    selectedCountyEchoed: parcels.selectedCountyEchoed,
    silentBentonFallbackDetected:
      parcels.silentBentonFallbackDetected || sales.silentBentonFallbackDetected,
    readinessClass: classification.readinessClass,
    recommendedAction: classification.recommendedAction,
    blockers: classification.blockers,
  };
}

function summarize(rows) {
  const count = readinessClass => rows.filter(row => row.readinessClass === readinessClass).length;
  const actionCount = action => rows.filter(row => row.recommendedAction === action).length;
  return {
    countiesChecked: rows.length,
    runtimeProven: count('runtime_proven'),
    registeredEmpty: count('registered_empty'),
    notRegistered: count('not_registered'),
    endpointErrors: count('endpoint_error'),
    fallbackViolations: count('fallback_violation'),
    keepRuntimeCandidate: actionCount('keep_runtime_candidate'),
    loadOrRegisterNext: actionCount('load_or_register_next'),
    downgradeFromRuntimeCandidate: actionCount('downgrade_from_runtime_candidate'),
    investigateEndpointError: actionCount('investigate_endpoint_error'),
  };
}

function renderMarkdown(report) {
  const rows = report.rows.map(row =>
    [
      row.county,
      row.countyToken,
      String(row.parcels.status),
      String(row.parcels.runtimeRows),
      String(row.sales.status),
      String(row.sales.runtimeRows),
      row.payloadCounty ?? '-',
      row.selectedCountyEchoed ? 'yes' : 'no',
      row.silentBentonFallbackDetected ? 'yes' : 'no',
      row.readinessClass,
      row.recommendedAction,
      row.blockers.length ? row.blockers.join('<br>') : '-',
    ].join(' | ')
  );

  return [
    '# County Runtime Registration Ledger',
    '',
    `Generated: ${report.generatedAt}`,
    `Runtime base URL: \`${report.runtimeBaseUrl}\``,
    '',
    '## Summary',
    '',
    `- Counties checked: ${report.summary.countiesChecked}`,
    `- Runtime proven: ${report.summary.runtimeProven}`,
    `- Registered empty: ${report.summary.registeredEmpty}`,
    `- Not registered: ${report.summary.notRegistered}`,
    `- Endpoint errors: ${report.summary.endpointErrors}`,
    `- Fallback violations: ${report.summary.fallbackViolations}`,
    `- Keep runtime candidate: ${report.summary.keepRuntimeCandidate}`,
    `- Load or register next: ${report.summary.loadOrRegisterNext}`,
    `- Downgrade from runtime candidate: ${report.summary.downgradeFromRuntimeCandidate}`,
    `- Investigate endpoint error: ${report.summary.investigateEndpointError}`,
    '',
    '## Ledger',
    '',
    '| County | Token | Parcel Status | Parcel Rows | Sales Status | Sales Rows | Payload County | County Echo | Benton Fallback | Readiness | Recommended Action | Blockers |',
    '|---|---|---:|---:|---:|---:|---|---|---|---|---|---|',
    ...rows,
    '',
    '## Scope Note',
    '',
    'This ledger proves runtime registration state only. It does not load county data, repair scraper flow, or certify 39-county readiness.',
  ].join('\n');
}

async function main() {
  const rows = [];
  for (const county of counties()) {
    rows.push(await buildRow(county));
  }

  const report = {
    generatedAt: new Date().toISOString(),
    runtimeBaseUrl,
    rows,
    summary: summarize(rows),
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(outMd, `${renderMarkdown(report)}\n`);

  console.log(`Wrote ${rel(outJson)}`);
  console.log(`Wrote ${rel(outMd)}`);
  console.log(JSON.stringify(report.summary, null, 2));

  if (rows.length === 0) {
    console.error('No counties were checked.');
    process.exitCode = 2;
  }
}

main();
