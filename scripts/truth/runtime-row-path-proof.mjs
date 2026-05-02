#!/usr/bin/env node

/**
 * Track 1B - Runtime Row Path Proof
 *
 * Proves whether strongest Track 1 county-data candidates reach runtime without
 * silent Benton fallback. This script reports evidence; it does not repair data
 * flows or endpoints.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const inventoryPath = path.join(repoRoot, 'generated', 'truth', 'data-source-truth-inventory.json');
const outDir = path.join(repoRoot, 'generated', 'truth');
const outJson = path.join(outDir, 'runtime-row-path-proof.json');
const outMd = path.join(outDir, 'runtime-row-path-proof.md');
const defaultCandidates = ['Benton', 'Pacific', 'Franklin', 'Walla Walla'];
const runtimeBaseUrl =
  process.env.TF_RUNTIME_BASE_URL ??
  process.env.TERRAFUSION_RUNTIME_BASE_URL ??
  'http://localhost:5046';
const strict = process.env.TF_RUNTIME_ROW_PROOF_STRICT !== '0';

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, '/');
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

function loadInventory() {
  if (!fs.existsSync(inventoryPath)) {
    throw new Error(`Inventory not found: ${rel(inventoryPath)}`);
  }
  return JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
}

function candidateNames() {
  return (process.env.TF_RUNTIME_ROW_CANDIDATES ?? defaultCandidates.join(','))
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function candidateReason(row) {
  if (row.costForge?.costForgeReadinessTier !== 'CF0_no_runtime_data') {
    return 'costforge_cf1_or_higher';
  }
  if (
    row.sourceUrlOrSystem &&
    row.scraperOrAdapterExists &&
    row.dbTableTargetExists &&
    row.rowsLanded > 0 &&
    row.runtimeApiConsumesIt &&
    row.uiSurfacePath
  ) {
    return 'apparent_full_chain';
  }
  if (row.scraperOrAdapterExists && row.runtimeApiConsumesIt) return 'scraper_api_candidate';
  if (row.scraperOrAdapterExists) return 'scraper_only_candidate';
  return 'not_track_1b_candidate';
}

function endpointTemplates() {
  return (
    process.env.TF_RUNTIME_ROW_ENDPOINTS ??
    [
      '/api/counties/{countySlug}/data',
      '/api/counties/{countySlug}/rows',
      '/api/counties/{countySlug}/parcels',
      '/api/counties/{countySlug}/sales',
      '/api/county/{countySlug}/data',
      '/api/real-data/{countySlug}',
      '/api/terraforge/counties/{countySlug}/data',
      '/api/costforge/counties/{countySlug}/data',
    ].join(',')
  )
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function buildEndpoint(template, county) {
  const countySlug = slugifyCounty(county);
  const countyEncoded = encodeURIComponent(county);
  const pathPart = template
    .replaceAll('{countySlug}', countySlug)
    .replaceAll('{county}', countyEncoded);
  return new URL(pathPart, runtimeBaseUrl).toString();
}

async function probeCandidate(row) {
  const attemptedEndpoints = [];
  let selected = null;

  for (const template of endpointTemplates()) {
    const endpoint = buildEndpoint(template, row.county);
    const attempt = await probeEndpoint(endpoint);
    attemptedEndpoints.push(attempt);

    if (!selected && attempt.status && attempt.status !== 404) {
      selected = attempt;
    }
    if (attempt.status === 200) {
      selected = attempt;
      break;
    }
  }

  if (!selected) {
    selected =
      attemptedEndpoints.find(attempt => attempt.selectedCountyEchoed) ??
      attemptedEndpoints.find(attempt => attempt.status) ??
      null;
  }

  const proof = {
    county: row.county,
    candidateReason: candidateReason(row),
    expectedInventoryRows: row.rowsLanded,
    endpoint: selected?.endpoint ?? null,
    endpointStatus: selected?.status ?? null,
    runtimeRowsReturned: selected?.runtimeRowsReturned ?? 0,
    payloadCounty: selected?.payloadCounty ?? null,
    selectedCountyEchoed: selected?.selectedCountyEchoed ?? false,
    silentBentonFallbackDetected: selected?.silentBentonFallbackDetected ?? false,
    uiConsumerPath: row.uiSurfacePath ?? null,
    costForgeTier: row.costForge?.costForgeReadinessTier ?? 'unknown',
    costForgeMode: row.costForge?.costForgeCountyMode ?? 'unknown',
    allowedWorkflows: row.costForge?.allowedWorkflows ?? [],
    blockedWorkflows: row.costForge?.blockedWorkflows ?? [],
    attemptedEndpoints,
  };

  return evaluateRuntimeRowPathProof(proof);
}

async function probeEndpoint(endpoint) {
  try {
    const response = await fetch(endpoint, { headers: { accept: 'application/json' } });
    const contentType = response.headers.get('content-type') ?? '';
    const text = await response.text();
    let payload = null;

    if (contentType.includes('json') || /^[\s\r\n]*[{[]/.test(text)) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }
    }

    const countyValues = collectCountyValues(payload);
    const selectedCountyEchoed = countyValues.some(
      value => normalizeCounty(value) === normalizeCounty(endpointCounty(endpoint))
    );
    const silentBentonFallbackDetected =
      normalizeCounty(endpointCounty(endpoint)) !== 'benton' &&
      countyValues.some(value => normalizeCounty(value) === 'benton');

    return {
      endpoint,
      status: response.status,
      runtimeRowsReturned: countRuntimeRows(payload),
      payloadCounty: countyValues[0] ?? null,
      selectedCountyEchoed,
      silentBentonFallbackDetected,
    };
  } catch (error) {
    return {
      endpoint,
      status: null,
      runtimeRowsReturned: 0,
      payloadCounty: null,
      selectedCountyEchoed: false,
      silentBentonFallbackDetected: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function endpointCounty(endpoint) {
  const url = new URL(endpoint);
  const parts = url.pathname.split('/').filter(Boolean);
  for (const part of [...parts].reverse()) {
    if (
      !['api', 'counties', 'county', 'data', 'rows', 'parcels', 'sales', 'real-data'].includes(part)
    ) {
      return part;
    }
  }
  return '';
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

  for (const key of [
    'rows',
    'data',
    'items',
    'results',
    'records',
    'parcels',
    'sales',
    'properties',
    'values',
  ]) {
    if (Array.isArray(value[key])) return value[key].length;
  }

  for (const key of ['rowCount', 'count', 'total', 'totalCount']) {
    const count = Number(value[key]);
    if (Number.isFinite(count)) return count;
  }

  return 0;
}

function evaluateRuntimeRowPathProof(proof) {
  const blockers = [];

  if (!proof.endpoint) blockers.push('No runtime endpoint identified.');
  if (proof.endpointStatus !== 200) {
    blockers.push(`Runtime endpoint did not return 200. Status: ${proof.endpointStatus}`);
  }
  if (proof.runtimeRowsReturned <= 0) blockers.push('Runtime returned zero rows.');
  if (!proof.selectedCountyEchoed) blockers.push('Runtime did not echo selected county.');
  if (proof.silentBentonFallbackDetected) blockers.push('Silent Benton fallback detected.');
  if (!proof.uiConsumerPath) blockers.push('No UI consumer path identified.');

  return {
    ...proof,
    passed: blockers.length === 0,
    blockers,
  };
}

function summarize(proofs) {
  return {
    candidatesChecked: proofs.length,
    passed: proofs.filter(proof => proof.passed).length,
    failed: proofs.filter(proof => !proof.passed).length,
    silentBentonFallbacks: proofs.filter(proof => proof.silentBentonFallbackDetected).length,
    zeroRowRuntimeResponses: proofs.filter(proof => proof.runtimeRowsReturned <= 0).length,
  };
}

function renderMarkdown(proofs, summary) {
  const rows = proofs.map(proof =>
    [
      proof.county,
      proof.candidateReason,
      String(proof.expectedInventoryRows),
      proof.endpoint ? `\`${proof.endpoint}\`` : '-',
      String(proof.endpointStatus),
      String(proof.runtimeRowsReturned),
      proof.payloadCounty ?? '-',
      proof.selectedCountyEchoed ? 'yes' : 'no',
      proof.silentBentonFallbackDetected ? 'yes' : 'no',
      proof.costForgeTier,
      proof.costForgeMode,
      proof.passed ? 'PASS' : 'FAIL',
      proof.blockers.length ? proof.blockers.join('<br>') : '-',
    ].join(' | ')
  );

  return [
    '# Runtime Row Path Proof',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Runtime base URL: \`${runtimeBaseUrl}\``,
    '',
    '| County | Candidate Reason | Inventory Rows | Endpoint | Status | Runtime Rows | Payload County | County Echo | Benton Fallback | CostForge Tier | CostForge Mode | Result | Blockers |',
    '|---|---|---:|---|---:|---:|---|---|---|---|---|---|---|',
    ...rows,
    '',
    '## Summary',
    '',
    `- Candidates checked: ${summary.candidatesChecked}`,
    `- Passed: ${summary.passed}`,
    `- Failed: ${summary.failed}`,
    `- Silent Benton fallbacks: ${summary.silentBentonFallbacks}`,
    `- Zero-row runtime responses: ${summary.zeroRowRuntimeResponses}`,
    '',
    '## Scope Note',
    '',
    'This proof does not repair endpoints, scrapers, databases, UI consumers, or CostForge logic. A failed result means the runtime row path is not proven for June 10 readiness.',
    '',
  ].join('\n');
}

async function main() {
  const inventory = loadInventory();
  const rowsByCounty = new Map(inventory.rows.map(row => [row.county, row]));
  const candidates = candidateNames()
    .map(county => rowsByCounty.get(county))
    .filter(Boolean)
    .filter(row => candidateReason(row) !== 'not_track_1b_candidate');
  const proofs = [];

  for (const row of candidates) {
    proofs.push(await probeCandidate(row));
  }

  const summary = summarize(proofs);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    outJson,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        repoRoot,
        runtimeBaseUrl,
        summary,
        proofs,
      },
      null,
      2
    )
  );
  fs.writeFileSync(outMd, renderMarkdown(proofs, summary));

  console.log(`Wrote ${rel(outJson)}`);
  console.log(`Wrote ${rel(outMd)}`);
  console.log(JSON.stringify(summary, null, 2));

  if (strict && summary.failed > 0) {
    process.exitCode = 1;
    return;
  }
  process.exitCode = 0;
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
});
