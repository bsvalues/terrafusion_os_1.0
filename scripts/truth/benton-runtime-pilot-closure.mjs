#!/usr/bin/env node

/**
 * Track 2 Finalization - Benton June 10 Runtime Pilot Closure
 *
 * Reads the runtime candidate set, row-path proof, and sale-qualification
 * lineage proof. This is the shipping gate: Benton can be the June 10 runtime
 * pilot only when parcel runtime, qualified-sales lineage, and scope messaging
 * are all true at the same time.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const truthDir = path.join(repoRoot, 'generated', 'truth');
const candidateSetPath = path.join(truthDir, 'runtime-candidate-set.json');
const rowPathProofPath = path.join(truthDir, 'runtime-row-path-proof.json');
const saleQualificationPath = path.join(truthDir, 'runtime-sale-qualification-lineage-proof.json');
const outJson = path.join(truthDir, 'benton-runtime-pilot-closure.json');
const outMd = path.join(truthDir, 'benton-runtime-pilot-closure.md');

function rel(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, '/');
}

function readJson(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} not found at ${rel(filePath)}.`);
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeCounty(value) {
  const normalized = String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

  return normalized.endsWith('county') ? normalized.slice(0, -'county'.length) : normalized;
}

function findCounty(rows, county) {
  return rows?.find(row => normalizeCounty(row.county) === normalizeCounty(county)) ?? null;
}

function evaluate({ candidateSet, rowPathProof, saleQualification }) {
  const blockers = [];
  const warnings = [];

  const candidateSummary = candidateSet.summary ?? {};
  const bentonCandidate = findCounty(candidateSet.rows, 'Benton');
  const bentonRowPath = findCounty(rowPathProof.proofs, 'Benton');
  const bentonSales = findCounty(saleQualification.proofs, 'Benton');

  if (candidateSummary.june10RuntimeScope !== 'benton_only_runtime_pilot') {
    blockers.push(
      `June 10 runtime scope is ${candidateSummary.june10RuntimeScope}, expected benton_only_runtime_pilot.`
    );
  }
  if (candidateSummary.prohibit39CountyRuntimeClaim !== true) {
    blockers.push('39-county runtime claim is not explicitly prohibited.');
  }
  if (Number(candidateSummary.runtimeProven ?? 0) !== 1) {
    blockers.push(
      `Expected exactly one runtime-proven county; found ${candidateSummary.runtimeProven}.`
    );
  }
  if (Number(candidateSummary.evidenceBackedLoadCandidates ?? 0) !== 0) {
    blockers.push(
      `Expected zero evidence-backed load candidates; found ${candidateSummary.evidenceBackedLoadCandidates}.`
    );
  }
  if (Number(candidateSummary.provenanceInventoryOnly ?? 0) !== 38) {
    blockers.push(
      `Expected 38 provenance-only counties; found ${candidateSummary.provenanceInventoryOnly}.`
    );
  }

  if (!bentonCandidate) {
    blockers.push('Benton is missing from runtime candidate set.');
  } else if (bentonCandidate.runtimeCandidateClass !== 'runtime_proven') {
    blockers.push(`Benton candidate class is ${bentonCandidate.runtimeCandidateClass}.`);
  }

  if (!bentonRowPath) {
    blockers.push('Benton is missing from runtime row-path proof.');
  } else {
    if (!bentonRowPath.passed) blockers.push('Benton runtime row-path proof did not pass.');
    if (bentonRowPath.endpointStatus !== 200) {
      blockers.push(`Benton parcel endpoint status is ${bentonRowPath.endpointStatus}.`);
    }
    if (Number(bentonRowPath.runtimeRowsReturned ?? 0) <= 0) {
      blockers.push('Benton parcel endpoint returned zero runtime rows.');
    }
    if (bentonRowPath.silentBentonFallbackDetected) {
      blockers.push('Benton row-path proof detected a fallback violation.');
    }
  }

  if (!bentonSales) {
    blockers.push('Benton is missing from sale-qualification lineage proof.');
  } else {
    if (!bentonSales.passed) blockers.push('Benton sale-qualification lineage proof did not pass.');
    if (bentonSales.classification !== 'canonical_landing_backed') {
      blockers.push(
        `Benton sale-qualification lineage is ${bentonSales.classification}, expected canonical_landing_backed.`
      );
    }
    if (Number(bentonSales.canonicalSaleQualifications ?? 0) <= 0) {
      blockers.push('Benton CanonicalSaleQualifications landing table is empty.');
    }
    if (Number(bentonSales.ratioStudyWindow?.effectiveQualified ?? 0) <= 0) {
      blockers.push('Benton ratio-study window has no effective qualified sales.');
    }
    if (Number(bentonSales.ratioStudyWindow?.decisionQualified ?? 0) <= 0) {
      blockers.push('Benton ratio-study window has no final-decision qualified sales.');
    }
    if (Number(bentonSales.ratioStudyWindow?.recQualifiedFallback ?? 0) > 0) {
      warnings.push('Benton ratio-study pool still depends on recommendation fallback.');
    }
    if (bentonSales.eliteOperationsMockDataEnabled) {
      warnings.push('Elite Operations mock flag is enabled; county runtime mock flag is false.');
    }
  }

  const status = blockers.length > 0 ? 'FAIL' : warnings.length > 0 ? 'PASS_WITH_WARNINGS' : 'PASS';

  return {
    status,
    blockers,
    warnings,
    june10RuntimeScope: candidateSummary.june10RuntimeScope ?? null,
    allowedRuntimeClaim: candidateSummary.allowedRuntimeClaim ?? null,
    benton: {
      runtimeCandidateClass: bentonCandidate?.runtimeCandidateClass ?? null,
      parcelEndpointStatus: bentonRowPath?.endpointStatus ?? null,
      parcelRowsReturned: bentonRowPath?.runtimeRowsReturned ?? 0,
      saleQualificationClassification: bentonSales?.classification ?? null,
      canonicalSaleQualifications: bentonSales?.canonicalSaleQualifications ?? 0,
      ratioStudyEffectiveQualified: bentonSales?.ratioStudyWindow?.effectiveQualified ?? 0,
      ratioStudyDecisionQualified: bentonSales?.ratioStudyWindow?.decisionQualified ?? 0,
      ratioStudyRecommendationFallback: bentonSales?.ratioStudyWindow?.recQualifiedFallback ?? 0,
    },
    countyScope: {
      runtimeProven: candidateSummary.runtimeProven ?? 0,
      evidenceBackedLoadCandidates: candidateSummary.evidenceBackedLoadCandidates ?? 0,
      provenanceInventoryOnly: candidateSummary.provenanceInventoryOnly ?? 0,
      prohibit39CountyRuntimeClaim: candidateSummary.prohibit39CountyRuntimeClaim === true,
    },
  };
}

function renderMarkdown(report) {
  return [
    '# Benton Runtime Pilot Closure',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Status',
    '',
    `- Result: ${report.status}`,
    `- June 10 runtime scope: ${report.june10RuntimeScope}`,
    `- Allowed runtime claim: ${report.allowedRuntimeClaim}`,
    `- 39-county runtime claim prohibited: ${report.countyScope.prohibit39CountyRuntimeClaim ? 'yes' : 'no'}`,
    '',
    '## Benton Proof',
    '',
    `- Runtime candidate class: ${report.benton.runtimeCandidateClass}`,
    `- Parcel endpoint status: ${report.benton.parcelEndpointStatus}`,
    `- Parcel rows returned: ${report.benton.parcelRowsReturned}`,
    `- Sale qualification classification: ${report.benton.saleQualificationClassification}`,
    `- Canonical sale qualifications: ${report.benton.canonicalSaleQualifications}`,
    `- Ratio-study effective qualified: ${report.benton.ratioStudyEffectiveQualified}`,
    `- Ratio-study decision qualified: ${report.benton.ratioStudyDecisionQualified}`,
    `- Ratio-study recommendation fallback: ${report.benton.ratioStudyRecommendationFallback}`,
    '',
    '## County Scope',
    '',
    `- Runtime proven counties: ${report.countyScope.runtimeProven}`,
    `- Evidence-backed load candidates: ${report.countyScope.evidenceBackedLoadCandidates}`,
    `- Provenance/inventory-only counties: ${report.countyScope.provenanceInventoryOnly}`,
    '',
    '## Blockers',
    '',
    ...(report.blockers.length ? report.blockers.map(item => `- ${item}`) : ['- none']),
    '',
    '## Warnings',
    '',
    ...(report.warnings.length ? report.warnings.map(item => `- ${item}`) : ['- none']),
    '',
    '## Closure Rule',
    '',
    'This gate fails while Benton qualified-sales lineage is recommendation-backed instead of CanonicalSaleQualifications-backed. Recommendation-backed runtime sales may remain diagnostically useful, but they are not enough to close June 10 Benton runtime pilot readiness.',
  ].join('\n');
}

function main() {
  const report = {
    generatedAt: new Date().toISOString(),
    inputs: {
      candidateSetPath: rel(candidateSetPath),
      rowPathProofPath: rel(rowPathProofPath),
      saleQualificationPath: rel(saleQualificationPath),
    },
    ...evaluate({
      candidateSet: readJson(candidateSetPath, 'Runtime candidate set'),
      rowPathProof: readJson(rowPathProofPath, 'Runtime row-path proof'),
      saleQualification: readJson(saleQualificationPath, 'Sale qualification lineage proof'),
    }),
  };

  fs.mkdirSync(truthDir, { recursive: true });
  fs.writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(outMd, `${renderMarkdown(report)}\n`);

  console.log(`Wrote ${rel(outJson)}`);
  console.log(`Wrote ${rel(outMd)}`);
  console.log(
    JSON.stringify(
      {
        status: report.status,
        blockers: report.blockers.length,
        warnings: report.warnings.length,
        june10RuntimeScope: report.june10RuntimeScope,
        canonicalSaleQualifications: report.benton.canonicalSaleQualifications,
      },
      null,
      2
    )
  );

  if (report.status === 'FAIL') {
    process.exitCode = 1;
  }
}

main();
