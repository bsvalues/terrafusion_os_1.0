#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const evidenceDir = path.join(repoRoot, 'os-platform/core/pilot/evidence');
const jsonOut = path.join(evidenceDir, 'statistics-shared-population-contract.latest.json');
const mdOut = path.join(evidenceDir, 'statistics-shared-population-contract.latest.md');

const scopeProofPath = process.env.TF_STATISTICS_PARITY_SCOPE_PROOF
  ?? 'os-platform/core/pilot/evidence/statistics-parity-scope-alignment.latest.json';

function rel(file) {
  return path.relative(repoRoot, file).replaceAll('\\', '/');
}

function readJson(target) {
  return JSON.parse(readFileSync(path.join(repoRoot, target), 'utf8'));
}

function readText(target) {
  try {
    return readFileSync(path.join(repoRoot, target), 'utf8');
  } catch {
    return '';
  }
}

function sourcePresence() {
  const health = readText('backend/src/TerraFusion.Core/Services/CountyStudyHealthService.cs');
  const terraForge = readText('backend/src/TerraFusion.API/Controllers/TerraForgeController.cs');
  const countyWorkbench = readText(
    'frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx',
  );
  return {
    countyHealthUsesParcelRollup:
      /LoadParcelRatiosAsync/.test(health)
      && /priceByParcel/.test(health)
      && /perParcel/.test(health),
    countyHealthUsesHealthQualificationRule:
      /\(s\.QualificationDecision \?\? s\.QualificationRecommendation \?\? s\.SaleQualification\) == "qualified"/.test(health),
    terraForgeUsesRatioStudyLens:
      /GetRatioStudy/.test(terraForge)
      && /countWithRatio/.test(terraForge)
      && /SuppressOnRatioRptCd != "T"/.test(terraForge)
      && /IncludeNoCalc != true/.test(terraForge),
    terraForgeUsesParcelNumberAssessedJoin:
      /Returns ParcelNumber .* AssessedValue/s.test(terraForge)
      && /ids\.Contains\(p\.ParcelNumber\)/.test(terraForge),
    countyWorkbenchStillHasBentonReferenceLane:
      /income-approach\/market-data\/benton/.test(countyWorkbench),
  };
}

function metricSummary(scopeProof) {
  const health = scopeProof.apiMetrics?.countyStudioHealth ?? {};
  const ratio = scopeProof.apiMetrics?.terraForgeRatioStudy ?? {};
  return {
    countyStudioHealth: {
      countLabel: 'ratioCount',
      count: health.ratioCount ?? scopeProof.dbCounts?.countyStudioHealthPopulation?.ratioCount ?? null,
      medianRatio: health.medianRatio ?? null,
      cod: health.cod ?? null,
      prd: health.prd ?? null,
    },
    terraForgeRatioStudy: {
      countLabel: 'countWithRatio',
      count: ratio.countWithRatio ?? scopeProof.dbCounts?.terraForgeRatioPopulation?.countWithRatio ?? null,
      outliersExcluded: ratio.outliersExcluded ?? scopeProof.dbCounts?.terraForgeRatioPopulation?.outliersExcluded ?? null,
      medianRatio: ratio.medianRatio ?? null,
      cod: ratio.cod ?? null,
      prd: ratio.prd ?? null,
      weightedMeanRatio: ratio.weightedMeanRatio ?? null,
      prb: ratio.prb ?? null,
    },
    overlap: scopeProof.overlap ?? scopeProof.dbCounts?.overlap ?? null,
  };
}

function buildMarkdown(report) {
  const contractRows = report.sharedParityContract.rules.map((rule) =>
    `| ${rule.field} | ${rule.value} | ${rule.reason} |`,
  );
  const implementationRows = report.implementationAssessment.map((item) =>
    `| ${item.surface} | ${item.implementsSharedContract} | ${item.notes} |`,
  );
  const blockerRows = report.blockers.map((blocker) => `- ${blocker}`);
  const nextRows = report.requiredClosure.map((item) => `- ${item}`);

  return [
    '# Statistics Shared Population Contract',
    '',
    `Checked: ${report.checkedAt}`,
    '',
    `Status: ${report.status}`,
    `Decision: ${report.decision}`,
    `Study: \`${report.study.studyId}\``,
    `County: \`${report.study.countyId}\` (${report.study.countyName})`,
    `Tax year: \`${report.study.taxYear}\``,
    '',
    '## Shared Parity Contract',
    '',
    `Contract: \`${report.sharedParityContract.id}\``,
    '',
    '| Field | Value | Reason |',
    '| --- | --- | --- |',
    ...contractRows,
    '',
    '## Existing Surface Assessment',
    '',
    '| Surface | Implements shared contract? | Notes |',
    '| --- | --- | --- |',
    ...implementationRows,
    '',
    '## Current Counts',
    '',
    `County Studio health ratioCount: ${report.currentMetrics.countyStudioHealth.count}`,
    `TerraForge ratio-study countWithRatio: ${report.currentMetrics.terraForgeRatioStudy.count}`,
    `Overlap: ${JSON.stringify(report.currentMetrics.overlap)}`,
    '',
    '## Blockers',
    '',
    ...blockerRows,
    '',
    '## Required Closure',
    '',
    ...nextRows,
    '',
  ].join('\n');
}

const absScopeProof = path.resolve(repoRoot, scopeProofPath);
if (!existsSync(absScopeProof)) {
  throw new Error(`Scope proof not found: ${scopeProofPath}. Run pnpm run truth:statistics-parity-scope first.`);
}

const scopeProof = readJson(scopeProofPath);
const source = sourcePresence();
const currentMetrics = metricSummary(scopeProof);

const sharedParityContract = {
  id: 'statistics_ratio_study_compat_v1',
  intent:
    'Give County Studio a same-population parity mode that can be compared honestly against the existing Statistics/TerraForge ratio-study lens.',
  parityTarget: 'TerraForge ratio-study compatibility, not County Studio health summary equivalence.',
  rules: [
    {
      field: 'county',
      value: `Exact countyId ${scopeProof.study.countyId}`,
      reason: 'Avoid Benton/default/fallback contamination.',
    },
    {
      field: 'tax year',
      value: `Exact taxYear ${scopeProof.study.taxYear}`,
      reason: 'Both surfaces must use the same assessment year.',
    },
    {
      field: 'comparison unit',
      value: 'qualified sale ratio row',
      reason: 'Statistics Studio ratio-study is sale-row based; County Studio health is parcel-rollup based and must not be used as the parity comparator.',
    },
    {
      field: 'assessed value join',
      value: 'ComparableSales.ParcelId resolved to the canonical parcel identity used for Properties assessed value; report ParcelId vs ParcelNumber mapping and unmatched counts.',
      reason: 'Current surfaces disagree: County Studio health joins through Properties.ParcelId while TerraForge ratio-study joins through Properties.ParcelNumber.',
    },
    {
      field: 'sale window',
      value: `SalesYear=${scopeProof.study.taxYear}, or null SalesYear with SaleDate >= Jan 1 ${scopeProof.study.taxYear - 2} and < Jan 1 ${scopeProof.study.taxYear}`,
      reason: 'Matches the current Statistics/TerraForge ratio-study lens for immediate parity compatibility.',
    },
    {
      field: 'qualification rule',
      value: 'QualificationDecision == qualified, or null decision with QualificationRecommendation == qualified/null; additionally report SaleQualification-only inclusions as conversion-sensitive, not silent truth.',
      reason: 'Matches current ratio-study compatibility while making 2017 conversion-sensitive fallback risk visible.',
    },
    {
      field: 'suppression/no-calc',
      value: 'Exclude SuppressOnRatioRptCd=T and IncludeNoCalc=true.',
      reason: 'Matches current Statistics/TerraForge ratio-study and avoids known non-ratio-report rows.',
    },
    {
      field: 'outlier policy',
      value: 'Report countWithRatio before trimming; compute stats on Tukey/IQR-trimmed rows; report outliersExcluded.',
      reason: 'Matches current ratio-study statistics semantics.',
    },
    {
      field: 'segment/cohort scope',
      value: 'County-wide by default; optional activeSegmentSetId/segmentId/cohortId filters may be added, but every response must echo the applied scope.',
      reason: 'Keeps Statistics parity county-wide while allowing County Studio scoped drilldowns without changing metric meaning.',
    },
    {
      field: 'trust posture',
      value: 'Benton Production Provisional / Sync-Derived / Converted Legacy Sensitive until qualification lineage is closed.',
      reason: 'Prevents 2017 conversion-sensitive qualified-sale fields from being treated as production-verified proof.',
    },
  ],
};

const implementationAssessment = [
  {
    surface: 'TerraForge ratio-study',
    implementsSharedContract: source.terraForgeUsesRatioStudyLens ? 'partial' : 'no',
    notes:
      'Implements the ratio-study lens and current countWithRatio population, but does not emit a contract id, parcel identity reconciliation counts, or conversion-sensitive qualification classifications.',
  },
  {
    surface: 'County Studio health summary',
    implementsSharedContract: 'no',
    notes:
      'Uses segment-set parcel health rollup semantics. It is intentionally not the comparator for statistics parity.',
  },
  {
    surface: 'County Studio statistics workbench',
    implementsSharedContract: 'no',
    notes:
      source.countyWorkbenchStillHasBentonReferenceLane
        ? 'Still has a Benton-certified reference lane and no explicit shared-population parity mode.'
        : 'No Benton reference lane detected, but no explicit shared-population parity mode was proven.',
  },
];

const blockers = [
  'No County Studio endpoint or workbench mode currently declares statistics_ratio_study_compat_v1.',
  'No shared response currently echoes contract id, population count, pre/post-trim counts, parcel identity join mode, and conversion-sensitive qualification counts.',
  'County Studio health summary remains a different analytical surface and must not be used as the Statistics parity comparator.',
  'Benton qualification fields remain conversion-sensitive until row-level sync lineage closes the 2017 risk.',
];

const report = {
  checkedAt: new Date().toISOString(),
  slice: 'statistics-shared-population-contract',
  status: 'IMPLEMENTATION_GAP_SHARED_PARITY_MODE_MISSING',
  decision: 'PATH_A_REQUIRED_SHARED_PARITY_CONTRACT_DEFINED_NOT_IMPLEMENTED',
  scopeProof: {
    path: rel(absScopeProof),
    status: scopeProof.status,
    rootCause: scopeProof.rootCause?.label ?? null,
    countDifference: scopeProof.countDifference ?? null,
  },
  study: scopeProof.study,
  currentMetrics,
  sourcePresence: source,
  sharedParityContract,
  implementationAssessment,
  blockers,
  requiredClosure: [
    'Add a County Studio statistics parity mode or endpoint that computes statistics_ratio_study_compat_v1.',
    'Make both County Studio and TerraForge responses echo contract id, population count, countWithRatio, outliersExcluded, identity join mode, sale window, qualification policy, suppression/no-calc policy, and conversion-sensitive row counts.',
    'Run parity against the contract artifact; only upgrade the Statistics superset claim when both surfaces agree on the shared contract.',
    'Keep Statistics Studio visible until the shared-population parity mode passes against live Benton data.',
  ],
};

mkdirSync(evidenceDir, { recursive: true });
writeFileSync(jsonOut, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(mdOut, buildMarkdown(report));

console.log(JSON.stringify({
  status: report.status,
  decision: report.decision,
  contract: report.sharedParityContract.id,
  blockers: report.blockers.length,
  evidence: [rel(jsonOut), rel(mdOut)],
}, null, 2));

process.exitCode = 1;
