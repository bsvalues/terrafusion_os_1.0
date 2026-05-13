#!/usr/bin/env node

/**
 * Track 1D - Runtime Row Source Lineage Proof
 *
 * Proves that runtime county rows are backed by source-lineage counts, not just
 * a callable API response. This script reports evidence; it does not repair
 * endpoints, scrapers, databases, or UI consumers.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { runtimeFetch } from './runtime-auth.mjs';

const repoRoot = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const truthDir = path.join(repoRoot, 'generated', 'truth');
const inventoryPath = path.join(truthDir, 'data-source-truth-inventory.json');
const rowPathProofPath = path.join(truthDir, 'runtime-row-path-proof.json');
const dbIdentityPath = path.join(truthDir, 'runtime-db-identity.json');
const outJson = path.join(truthDir, 'runtime-row-source-lineage-proof.json');
const outMd = path.join(truthDir, 'runtime-row-source-lineage-proof.md');
const runtimeBaseUrl =
  process.env.TF_RUNTIME_BASE_URL ??
  process.env.TERRAFUSION_RUNTIME_BASE_URL ??
  'http://localhost:5046';
const strict = process.env.TF_RUNTIME_SOURCE_LINEAGE_STRICT !== '0';

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

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadDbIdentity() {
  const proof = readJson(dbIdentityPath);
  if (!proof) {
    return {
      passed: false,
      blockers: [`Runtime DB identity proof not found: ${rel(dbIdentityPath)}`],
    };
  }

  return {
    passed: proof.passed === true,
    blockers: proof.blockers ?? [],
    database: proof.identity?.database ?? null,
    provider: proof.identity?.provider ?? null,
    expectedJune10Database: proof.identity?.expectedJune10Database ?? null,
    isExpectedJune10RuntimeDb: proof.identity?.isExpectedJune10RuntimeDb === true,
  };
}

function candidateRows() {
  const requested = process.env.TF_RUNTIME_SOURCE_LINEAGE_CANDIDATES;
  if (requested) {
    return requested
      .split(',')
      .map(county => ({ county: county.trim() }))
      .filter(row => row.county);
  }

  const rowProof = readJson(rowPathProofPath);
  const runtimeRows = rowProof?.proofs ?? [];
  if (runtimeRows.length > 0) {
    return runtimeRows.map(proof => ({
      county: proof.county,
      runtimeEndpoint: proof.endpoint,
    }));
  }

  const inventory = readJson(inventoryPath);
  return (inventory?.rows ?? [])
    .filter(row => row.costForge?.costForgeReadinessTier !== 'CF0_no_runtime_data')
    .map(row => ({ county: row.county }));
}

async function probeCounty(candidate) {
  const endpoint = new URL(
    `/api/counties/${slugifyCounty(candidate.county)}/runtime-lineage`,
    runtimeBaseUrl
  ).toString();
  const probe = await probeEndpoint(endpoint);

  return {
    county: candidate.county,
    endpoint,
    endpointStatus: probe.status,
    payloadCounty: probe.payloadCounty,
    selectedCountyEchoed:
      normalizeCounty(probe.payloadCounty) === normalizeCounty(candidate.county),
    silentBentonFallbackDetected:
      normalizeCounty(candidate.county) !== 'benton' &&
      normalizeCounty(probe.payloadCounty) === 'benton',
    runtimeLineageClassification: probe.payload?.runtimeLineageClassification ?? null,
    databaseProvider: probe.payload?.databaseProvider ?? null,
    developmentSeedersSkipped: probe.payload?.developmentSeedersSkipped ?? null,
    runtimeMockDataEnabled: probe.payload?.runtimeMockDataEnabled ?? null,
    eliteOperationsMockDataEnabled: probe.payload?.eliteOperationsMockDataEnabled ?? null,
    canonicalRuntime: {
      properties: numberAt(probe.payload, ['canonicalRuntime', 'properties']),
      comparableSales: numberAt(probe.payload, ['canonicalRuntime', 'comparableSales']),
      canonicalSaleQualifications: numberAt(probe.payload, [
        'canonicalRuntime',
        'canonicalSaleQualifications',
      ]),
    },
    sourceMirror: {
      pacsParcels: numberAt(probe.payload, ['sourceMirror', 'pacsParcels']),
      pacsSales: numberAt(probe.payload, ['sourceMirror', 'pacsSales']),
    },
    posture: {
      noSilentFallback: probe.payload?.posture?.noSilentFallback ?? false,
      exposesCountsOnly: probe.payload?.posture?.exposesCountsOnly ?? false,
      containsOwnerOrPartyPii: probe.payload?.posture?.containsOwnerOrPartyPii ?? true,
    },
    error: probe.error,
  };
}

async function probeEndpoint(endpoint) {
  try {
    const response = await runtimeFetch(endpoint, { headers: { accept: 'application/json' } });
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

    return {
      status: response.status,
      payload,
      payloadCounty: payload?.county ?? null,
      error: null,
    };
  } catch (error) {
    return {
      status: null,
      payload: null,
      payloadCounty: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function numberAt(value, pathParts) {
  let current = value;
  for (const part of pathParts) current = current?.[part];
  const number = Number(current ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function evaluateRuntimeSourceLineageProof(proof, dbIdentity) {
  const blockers = [];
  const canonicalRows =
    proof.canonicalRuntime.properties +
    proof.canonicalRuntime.comparableSales +
    proof.canonicalRuntime.canonicalSaleQualifications;
  const sourceRows = proof.sourceMirror.pacsParcels + proof.sourceMirror.pacsSales;

  if (!dbIdentity.passed) {
    blockers.push(
      `Runtime DB identity proof is not trusted: ${(dbIdentity.blockers ?? []).join('; ') || 'unknown blocker'}`
    );
  }
  if (proof.endpointStatus !== 200) {
    blockers.push(`Runtime lineage endpoint did not return 200. Status: ${proof.endpointStatus}`);
  }
  if (!proof.selectedCountyEchoed) blockers.push('Runtime lineage did not echo selected county.');
  if (proof.silentBentonFallbackDetected) blockers.push('Silent Benton fallback detected.');
  if (canonicalRows <= 0) blockers.push('No canonical runtime rows counted.');
  if (sourceRows <= 0) blockers.push('No source mirror rows counted.');
  if (proof.runtimeMockDataEnabled) blockers.push('Runtime mock data is enabled.');
  if (!proof.posture.noSilentFallback)
    blockers.push('Endpoint did not declare no-silent-fallback posture.');
  if (!proof.posture.exposesCountsOnly)
    blockers.push('Endpoint did not declare counts-only posture.');
  if (proof.posture.containsOwnerOrPartyPii)
    blockers.push('Endpoint posture allows owner/party PII.');

  return {
    ...proof,
    canonicalRows,
    sourceRows,
    runtimeDbIdentityPassed: dbIdentity.passed,
    passed: blockers.length === 0,
    blockers,
  };
}

function summarize(proofs, dbIdentity) {
  return {
    candidatesChecked: proofs.length,
    passed: proofs.filter(proof => proof.passed).length,
    failed: proofs.filter(proof => !proof.passed).length,
    totalCanonicalRows: proofs.reduce((sum, proof) => sum + proof.canonicalRows, 0),
    totalSourceRows: proofs.reduce((sum, proof) => sum + proof.sourceRows, 0),
    mockRuntimeEnabled: proofs.filter(proof => proof.runtimeMockDataEnabled).length,
    eliteOperationsMockEnabled: proofs.filter(proof => proof.eliteOperationsMockDataEnabled).length,
    silentBentonFallbacks: proofs.filter(proof => proof.silentBentonFallbackDetected).length,
    runtimeDbIdentityPassed: dbIdentity.passed,
    runtimeDbIdentityDatabase: dbIdentity.database ?? null,
    runtimeDbIdentityProvider: dbIdentity.provider ?? null,
  };
}

function renderMarkdown(proofs, summary, dbIdentity) {
  const rows = proofs.map(proof =>
    [
      proof.county,
      proof.endpoint ? `\`${proof.endpoint}\`` : '-',
      String(proof.endpointStatus),
      proof.payloadCounty ?? '-',
      proof.runtimeLineageClassification ?? '-',
      String(proof.canonicalRuntime.properties),
      String(proof.canonicalRuntime.comparableSales),
      String(proof.canonicalRuntime.canonicalSaleQualifications),
      String(proof.sourceMirror.pacsParcels),
      String(proof.sourceMirror.pacsSales),
      proof.runtimeMockDataEnabled ? 'yes' : 'no',
      proof.eliteOperationsMockDataEnabled ? 'yes' : 'no',
      proof.runtimeDbIdentityPassed ? 'yes' : 'no',
      proof.passed ? 'PASS' : 'FAIL',
      proof.blockers.length ? proof.blockers.join('<br>') : '-',
    ].join(' | ')
  );

  return [
    '# Runtime Row Source Lineage Proof',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Runtime base URL: \`${runtimeBaseUrl}\``,
    '',
    '| County | Endpoint | Status | Payload County | Classification | Properties | Comparable Sales | Canonical Sale Qualifications | Source Parcels | Source Sales | County Runtime Mock | Elite Ops Mock | DB Identity Trusted | Result | Blockers |',
    '|---|---|---:|---|---|---:|---:|---:|---:|---:|---|---|---|---|---|',
    ...rows,
    '',
    '## Summary',
    '',
    `- Candidates checked: ${summary.candidatesChecked}`,
    `- Passed: ${summary.passed}`,
    `- Failed: ${summary.failed}`,
    `- Total canonical rows counted: ${summary.totalCanonicalRows}`,
    `- Total source rows counted: ${summary.totalSourceRows}`,
    `- Mock-runtime enabled responses: ${summary.mockRuntimeEnabled}`,
    `- Elite Operations mock enabled responses: ${summary.eliteOperationsMockEnabled}`,
    `- Silent Benton fallbacks: ${summary.silentBentonFallbacks}`,
    `- Runtime DB identity trusted: ${summary.runtimeDbIdentityPassed ? 'yes' : 'no'}`,
    `- Runtime DB: ${summary.runtimeDbIdentityDatabase ?? '-'}`,
    `- Runtime provider: ${summary.runtimeDbIdentityProvider ?? '-'}`,
    '',
    '## Runtime DB Identity Blockers',
    '',
    ...((dbIdentity.blockers ?? []).length
      ? dbIdentity.blockers.map(item => `- ${item}`)
      : ['- none']),
    '',
    '## Scope Note',
    '',
    'This proof only verifies runtime lineage counts and endpoint posture. It does not certify scraper completeness, official county calibration, or June 10 readiness by itself.',
    '',
  ].join('\n');
}

async function main() {
  const candidates = candidateRows();
  const dbIdentity = loadDbIdentity();
  const proofs = [];

  for (const candidate of candidates) {
    const proof = await probeCounty(candidate);
    proofs.push(evaluateRuntimeSourceLineageProof(proof, dbIdentity));
  }

  const summary = summarize(proofs, dbIdentity);
  fs.mkdirSync(truthDir, { recursive: true });
  fs.writeFileSync(
    outJson,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        repoRoot,
        runtimeBaseUrl,
        runtimeDbIdentity: dbIdentity,
        summary,
        proofs,
      },
      null,
      2
    )
  );
  fs.writeFileSync(outMd, renderMarkdown(proofs, summary, dbIdentity));

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
