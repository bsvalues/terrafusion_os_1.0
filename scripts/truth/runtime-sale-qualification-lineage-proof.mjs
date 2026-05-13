#!/usr/bin/env node

/**
 * Track 1E - Runtime Sale Qualification Lineage Proof
 *
 * Proves whether a county has a usable runtime qualified-sale pool and whether
 * that pool is backed by canonical landing rows or by ComparableSales runtime
 * recommendations. This script does not mutate qualification data.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { runtimeFetch } from './runtime-auth.mjs';

const repoRoot = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const truthDir = path.join(repoRoot, 'generated', 'truth');
const sourceLineagePath = path.join(truthDir, 'runtime-row-source-lineage-proof.json');
const outJson = path.join(truthDir, 'runtime-sale-qualification-lineage-proof.json');
const outMd = path.join(truthDir, 'runtime-sale-qualification-lineage-proof.md');
const runtimeBaseUrl =
  process.env.TF_RUNTIME_BASE_URL ??
  process.env.TERRAFUSION_RUNTIME_BASE_URL ??
  'http://localhost:5046';
const strict = process.env.TF_RUNTIME_SALE_QUALIFICATION_STRICT !== '0';

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

function candidates() {
  const requested = process.env.TF_RUNTIME_SALE_QUALIFICATION_CANDIDATES;
  if (requested) {
    return requested
      .split(',')
      .map(county => ({ county: county.trim() }))
      .filter(candidate => candidate.county);
  }

  const sourceLineage = readJson(sourceLineagePath);
  return (sourceLineage?.proofs ?? []).map(proof => ({
    county: proof.county,
    sourceLineagePassed: proof.passed === true,
    sourceLineageBlockers: proof.blockers ?? [],
  }));
}

async function probeCounty(candidate) {
  const lineageEndpoint = new URL(
    `/api/counties/${slugifyCounty(candidate.county)}/runtime-lineage`,
    runtimeBaseUrl
  ).toString();
  const lineage = await getJson(lineageEndpoint);
  const countyId = lineage.payload?.countyId ?? null;

  const qualificationEndpoint = countyId
    ? new URL(`/api/sync/qualification-status/${countyId}?taxYear=2026`, runtimeBaseUrl).toString()
    : null;
  const qualification = qualificationEndpoint ? await getJson(qualificationEndpoint) : null;

  return evaluate({
    county: candidate.county,
    lineageEndpoint,
    lineageStatus: lineage.status,
    qualificationEndpoint,
    qualificationStatus: qualification?.status ?? null,
    payloadCounty: lineage.payload?.county ?? null,
    selectedCountyEchoed:
      normalizeCounty(lineage.payload?.county) === normalizeCounty(candidate.county),
    silentBentonFallbackDetected:
      normalizeCounty(candidate.county) !== 'benton' &&
      normalizeCounty(lineage.payload?.county) === 'benton',
    countyId,
    runtimeLineageClassification: lineage.payload?.runtimeLineageClassification ?? null,
    sourceLineagePassed: candidate.sourceLineagePassed ?? true,
    sourceLineageBlockers: candidate.sourceLineageBlockers ?? [],
    runtimeMockDataEnabled: lineage.payload?.runtimeMockDataEnabled ?? null,
    eliteOperationsMockDataEnabled: lineage.payload?.eliteOperationsMockDataEnabled ?? null,
    comparableSales: numberAt(lineage.payload, ['canonicalRuntime', 'comparableSales']),
    canonicalSaleQualifications: numberAt(lineage.payload, [
      'canonicalRuntime',
      'canonicalSaleQualifications',
    ]),
    sourceSales: numberAt(lineage.payload, ['sourceMirror', 'pacsSales']),
    allTime: {
      totalSales: numberAt(qualification?.payload, ['allTime', 'totalSales']),
      hasRecommendation: numberAt(qualification?.payload, ['allTime', 'hasRecommendation']),
      pendingDecision: numberAt(qualification?.payload, ['allTime', 'pendingDecision']),
      staffConfirmed: numberAt(qualification?.payload, ['allTime', 'staffConfirmed']),
      appraiserFinal: numberAt(qualification?.payload, ['allTime', 'appraiserFinal']),
      decisionQualified: numberAt(qualification?.payload, ['allTime', 'decisionQualified']),
      recQualified: numberAt(qualification?.payload, ['allTime', 'recQualified']),
      recommendationCoverage: numberAt(qualification?.payload, [
        'allTime',
        'recommendationCoverage',
      ]),
    },
    ratioStudyWindow: {
      totalSales: numberAt(qualification?.payload, ['ratioStudyWindow', 'totalSales']),
      hasRecommendation: numberAt(qualification?.payload, [
        'ratioStudyWindow',
        'hasRecommendation',
      ]),
      pendingDecision: numberAt(qualification?.payload, ['ratioStudyWindow', 'pendingDecision']),
      effectiveQualified: numberAt(qualification?.payload, [
        'ratioStudyWindow',
        'effectiveQualified',
      ]),
      decisionQualified: numberAt(qualification?.payload, [
        'ratioStudyWindow',
        'decisionQualified',
      ]),
      recQualifiedFallback: numberAt(qualification?.payload, [
        'ratioStudyWindow',
        'recQualifiedFallback',
      ]),
    },
    errors: [lineage.error, qualification?.error].filter(Boolean),
  });
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

function numberAt(value, pathParts) {
  let current = value;
  for (const part of pathParts) current = current?.[part];
  const number = Number(current ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function evaluate(proof) {
  const blockers = [];
  const warnings = [];

  if (proof.lineageStatus !== 200) {
    blockers.push(`Runtime lineage endpoint did not return 200. Status: ${proof.lineageStatus}`);
  }
  if (!proof.sourceLineagePassed) {
    blockers.push(
      `Runtime source-lineage proof is not trusted: ${(proof.sourceLineageBlockers ?? []).join('; ') || 'unknown blocker'}`
    );
  }
  if (proof.qualificationStatus !== 200) {
    blockers.push(
      `Qualification status endpoint did not return 200. Status: ${proof.qualificationStatus}`
    );
  }
  if (!proof.selectedCountyEchoed) blockers.push('Runtime lineage did not echo selected county.');
  if (proof.silentBentonFallbackDetected) blockers.push('Silent Benton fallback detected.');
  if (proof.runtimeMockDataEnabled) blockers.push('County runtime mock data is enabled.');
  if (proof.comparableSales <= 0) blockers.push('No ComparableSales runtime rows counted.');
  if (proof.sourceSales <= 0) blockers.push('No source sales rows counted.');
  if (proof.allTime.totalSales <= 0) blockers.push('No sales found in qualification status.');
  if (proof.allTime.hasRecommendation <= 0) {
    blockers.push('No runtime qualification recommendations found.');
  }
  if (proof.ratioStudyWindow.effectiveQualified <= 0) {
    blockers.push('No effective qualified sales found in ratio-study window.');
  }

  if (proof.canonicalSaleQualifications <= 0) {
    warnings.push('CanonicalSaleQualifications landing table is empty for this county.');
  }
  if (proof.allTime.recommendationCoverage < 100) {
    warnings.push(`Recommendation coverage below 100%: ${proof.allTime.recommendationCoverage}`);
  }
  if (
    proof.ratioStudyWindow.recQualifiedFallback > 0 &&
    proof.ratioStudyWindow.decisionQualified <= 0
  ) {
    warnings.push(
      'Ratio-study qualified pool is recommendation-backed, not final-decision-backed.'
    );
  }
  if (proof.eliteOperationsMockDataEnabled) {
    warnings.push('Elite Operations mock flag is enabled; county runtime mock flag is false.');
  }

  let classification = 'not_qualified_runtime_ready';
  if (proof.canonicalSaleQualifications > 0 && proof.ratioStudyWindow.effectiveQualified > 0) {
    classification = 'canonical_landing_backed';
  } else if (proof.allTime.hasRecommendation > 0 && proof.ratioStudyWindow.effectiveQualified > 0) {
    classification = 'recommendation_backed_canonical_landing_missing';
  } else if (proof.allTime.totalSales > 0) {
    classification = 'sales_loaded_qualification_not_backed';
  }

  return {
    ...proof,
    classification,
    passed: blockers.length === 0,
    blockers,
    warnings,
  };
}

function summarize(proofs) {
  const blockers = [];
  if (proofs.length === 0) {
    blockers.push(
      'No runtime sale qualification candidates were found. Run runtime source-lineage proof or set TF_RUNTIME_SALE_QUALIFICATION_CANDIDATES.'
    );
  }
  for (const proof of proofs) {
    for (const proofBlocker of proof.blockers ?? []) {
      blockers.push(`${proof.county}: ${proofBlocker}`);
    }
  }

  return {
    candidatesChecked: proofs.length,
    passed: proofs.filter(proof => proof.passed).length,
    failed: proofs.filter(proof => !proof.passed).length,
    warnings: proofs.reduce((sum, proof) => sum + proof.warnings.length, 0),
    canonicalLandingBacked: proofs.filter(
      proof => proof.classification === 'canonical_landing_backed'
    ).length,
    recommendationBackedCanonicalMissing: proofs.filter(
      proof => proof.classification === 'recommendation_backed_canonical_landing_missing'
    ).length,
    blockers,
    status: blockers.length === 0 && proofs.every(proof => proof.passed) ? 'PASS' : 'FAIL',
  };
}

function renderMarkdown(proofs, summary) {
  const rows = proofs.map(proof =>
    [
      proof.county,
      proof.classification,
      proof.sourceLineagePassed ? 'yes' : 'no',
      String(proof.comparableSales),
      String(proof.sourceSales),
      String(proof.canonicalSaleQualifications),
      String(proof.allTime.totalSales),
      String(proof.allTime.hasRecommendation),
      String(proof.allTime.recommendationCoverage),
      String(proof.ratioStudyWindow.totalSales),
      String(proof.ratioStudyWindow.effectiveQualified),
      String(proof.ratioStudyWindow.decisionQualified),
      String(proof.ratioStudyWindow.recQualifiedFallback),
      proof.passed ? 'PASS' : 'FAIL',
      proof.blockers.length ? proof.blockers.join('<br>') : '-',
      proof.warnings.length ? proof.warnings.join('<br>') : '-',
    ].join(' | ')
  );

  return [
    '# Runtime Sale Qualification Lineage Proof',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Runtime base URL: \`${runtimeBaseUrl}\``,
    '',
    '| County | Classification | Source Lineage Trusted | Comparable Sales | Source Sales | Canonical Qualifications | All Sales | Recommendations | Recommendation Coverage % | Window Sales | Effective Qualified | Decision Qualified | Recommendation Fallback | Result | Blockers | Warnings |',
    '|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|---|',
    ...rows,
    '',
    '## Summary',
    '',
    `- Candidates checked: ${summary.candidatesChecked}`,
    `- Passed: ${summary.passed}`,
    `- Failed: ${summary.failed}`,
    `- Warnings: ${summary.warnings}`,
    `- Canonical landing backed: ${summary.canonicalLandingBacked}`,
    `- Recommendation-backed with canonical landing missing: ${summary.recommendationBackedCanonicalMissing}`,
    `- Result: ${summary.status}`,
    '',
    '## Blockers',
    '',
    ...(summary.blockers.length ? summary.blockers.map(item => `- ${item}`) : ['- none']),
    '',
    '## Interpretation',
    '',
    'A PASS means the live runtime has a usable qualified-sale pool without silent fallback or county-row mock data. Warnings identify weaker lineage, especially when the pool is backed by ComparableSales recommendations instead of CanonicalSaleQualifications landing rows.',
    '',
  ].join('\n');
}

async function main() {
  const proofs = [];
  for (const candidate of candidates()) {
    proofs.push(await probeCounty(candidate));
  }

  const summary = summarize(proofs);
  const status = summary.status;
  fs.mkdirSync(truthDir, { recursive: true });
  fs.writeFileSync(
    outJson,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        repoRoot,
        runtimeBaseUrl,
        status,
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

  if (strict && (summary.failed > 0 || summary.blockers.length > 0)) {
    process.exitCode = 1;
    return;
  }
  process.exitCode = 0;
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
});
