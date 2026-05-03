#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const evidenceDir = path.join(repoRoot, 'os-platform/core/pilot/evidence');
const jsonOut = path.join(evidenceDir, 'statistics-shared-population-contract.latest.json');
const mdOut = path.join(evidenceDir, 'statistics-shared-population-contract.latest.md');

const scopeProofPath = process.env.TF_STATISTICS_PARITY_SCOPE_PROOF
  ?? 'os-platform/core/pilot/evidence/statistics-parity-scope-alignment.latest.json';
const apiBase = (process.env.TF_DATA_TRUTH_API_BASE
  ?? process.env.VITE_DEV_HEALTH_BASE
  ?? 'http://localhost:5173/api').replace(/\/$/, '');

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

function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function nearlyEqual(a, b, tolerance) {
  return isNumber(a) && isNumber(b) && Math.abs(a - b) <= tolerance;
}

async function getJson(route, headers = {}) {
  const url = `${apiBase}${route}`;
  const startedAt = Date.now();
  try {
    const response = await fetch(url, { headers });
    const text = await response.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    return { ok: response.ok, status: response.status, url, ms: Date.now() - startedAt, body };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      url,
      ms: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    };
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
    countyStudyStatisticsCompatEndpoint:
      /statistics-compat/.test(readText('backend/src/TerraFusion.API/Controllers/CountyStudyController.cs'))
      && /GetStatisticsCompatAsync/.test(readText('backend/src/TerraFusion.Core/Services/CountyStudyHealthService.cs')),
    countyStudyStatisticsCompatDtoContract:
      /CountyStatisticsCompatDto/.test(readText('backend/src/TerraFusion.Core/DTOs/CountyStudyDtos.cs'))
      && /StatisticsCompatConversionSensitiveCountsDto/.test(readText('backend/src/TerraFusion.Core/DTOs/CountyStudyDtos.cs'))
      && /StatisticsCompatParcelIdentityReconciliationDto/.test(readText('backend/src/TerraFusion.Core/DTOs/CountyStudyDtos.cs')),
    countyWorkbenchStatisticsCompatMode:
      /Statistics Compat/.test(countyWorkbench)
      && /statisticsCompat/.test(countyWorkbench)
      && /statistics_ratio_study_compat_v1/.test(countyWorkbench),
  };
}

function ratioStats(body) {
  return body?.stats && typeof body.stats === 'object' ? body.stats : {};
}

function parityRows(compat, ratio) {
  const stats = ratioStats(ratio);
  return [
    { field: 'countWithRatio', countyStudio: compat?.countWithRatio, terraForge: ratio?.countWithRatio, tolerance: 0 },
    { field: 'outliersExcluded', countyStudio: compat?.outliersExcluded, terraForge: ratio?.outliersExcluded, tolerance: 0 },
    { field: 'medianRatio', countyStudio: compat?.medianRatio, terraForge: stats.medianRatio, tolerance: 0.0001 },
    { field: 'cod', countyStudio: compat?.cod, terraForge: stats.cod, tolerance: 0.01 },
    { field: 'prd', countyStudio: compat?.prd, terraForge: stats.prd, tolerance: 0.0001 },
    { field: 'prb', countyStudio: compat?.prb, terraForge: stats.prb, tolerance: 0.0001 },
    { field: 'weightedMeanRatio', countyStudio: compat?.weightedMeanRatio, terraForge: stats.weightedMeanRatio, tolerance: 0.0001 },
  ].map((row) => ({
    ...row,
    delta: isNumber(row.countyStudio) && isNumber(row.terraForge)
      ? Math.abs(row.countyStudio - row.terraForge)
      : null,
    pass: row.tolerance === 0
      ? row.countyStudio === row.terraForge
      : nearlyEqual(row.countyStudio, row.terraForge, row.tolerance),
  }));
}

async function apiParityProof(study) {
  const headers = { 'x-county-id': study.countyId };
  const [compatResult, ratioResult] = await Promise.all([
    getJson(`/county-study/studies/${study.studyId}/statistics-compat`, headers),
    getJson(`/terraforge/ratio-study?taxYear=${study.taxYear}&countyId=${encodeURIComponent(study.countyId)}`, headers),
  ]);

  if (!compatResult.ok || !ratioResult.ok) {
    return {
      reachable: false,
      status: 'API_UNREACHABLE_OR_ENDPOINT_FAILED',
      compatResult: {
        ok: compatResult.ok,
        status: compatResult.status,
        url: compatResult.url,
        error: compatResult.error ?? null,
      },
      ratioResult: {
        ok: ratioResult.ok,
        status: ratioResult.status,
        url: ratioResult.url,
        error: ratioResult.error ?? null,
      },
      rows: [],
      mismatches: [],
    };
  }

  const rows = parityRows(compatResult.body, ratioResult.body);
  const mismatches = rows.filter((row) => !row.pass);
  const contractOk = compatResult.body?.contractId === 'statistics_ratio_study_compat_v1';
  return {
    reachable: true,
    status: contractOk && mismatches.length === 0 ? 'PASS' : 'MISMATCH',
    contractOk,
    compat: compatResult.body,
    terraForgeRatioStudy: ratioResult.body,
    rows,
    mismatches,
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
  const parityRows = report.apiParity.rows.map((row) =>
    `| ${row.field} | ${row.countyStudio ?? 'null'} | ${row.terraForge ?? 'null'} | ${row.tolerance} | ${row.pass ? 'yes' : 'no'} |`,
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
    '## API Same-Population Parity',
    '',
    `API base: \`${report.apiBase}\``,
    `API status: ${report.apiParity.status}`,
    `Contract echoed: ${report.apiParity.contractOk ?? false}`,
    '',
    '| Metric | County Studio Compat | TerraForge Ratio Study | Tolerance | Pass? |',
    '| --- | --- | --- | --- | --- |',
    ...(parityRows.length ? parityRows : ['| unavailable | unavailable | unavailable | unavailable | no |']),
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
const apiParity = await apiParityProof(scopeProof.study);

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
    implementsSharedContract: source.countyWorkbenchStatisticsCompatMode ? 'yes' : 'no',
    notes:
      source.countyWorkbenchStatisticsCompatMode
        ? 'Declares an explicit Statistics Compat mode and renders the statistics_ratio_study_compat_v1 contract fields as first-class data.'
        : 'No explicit shared-population parity mode was proven.',
  },
  {
    surface: 'County Studio statistics-compat endpoint',
    implementsSharedContract: source.countyStudyStatisticsCompatEndpoint && source.countyStudyStatisticsCompatDtoContract ? 'yes' : 'no',
    notes:
      source.countyStudyStatisticsCompatEndpoint && source.countyStudyStatisticsCompatDtoContract
        ? 'Backend endpoint and DTO surface contract id, countWithRatio, outliersExcluded, conversion-sensitive counts, parcel identity reconciliation, and trust posture.'
        : 'Backend endpoint/DTO contract fields are missing.',
  },
];

const blockers = [];
if (!source.countyStudyStatisticsCompatEndpoint || !source.countyStudyStatisticsCompatDtoContract) {
  blockers.push('County Studio statistics-compat endpoint or DTO contract fields are missing.');
}
if (!source.countyWorkbenchStatisticsCompatMode) {
  blockers.push('County Studio workbench does not declare the explicit Statistics Compat mode.');
}
if (!apiParity.reachable) {
  blockers.push('Dev API same-population parity check could not reach both County Studio statistics-compat and TerraForge ratio-study endpoints.');
}
if (apiParity.reachable && apiParity.status !== 'PASS') {
  blockers.push(`Same-population parity mismatch remains: ${apiParity.mismatches.map((row) => row.field).join(', ') || 'contract id missing'}.`);
}
blockers.push('County Studio health summary remains a different analytical surface and must not be used as the Statistics parity comparator.');
blockers.push('Benton qualification fields remain conversion-sensitive until row-level sync lineage closes the 2017 risk.');

const implementationReady =
  source.countyStudyStatisticsCompatEndpoint
  && source.countyStudyStatisticsCompatDtoContract
  && source.countyWorkbenchStatisticsCompatMode;
const hardBlockers = blockers.filter((blocker) =>
  !blocker.startsWith('County Studio health summary remains')
  && !blocker.startsWith('Benton qualification fields remain'),
);
const status =
  apiParity.status === 'PASS'
    ? 'PASS'
    : implementationReady && !apiParity.reachable
      ? 'IMPLEMENTED_STATIC_API_UNREACHABLE'
      : implementationReady
        ? 'BLOCKED_SHARED_CONTRACT_PARITY_MISMATCH'
        : 'IMPLEMENTATION_GAP_SHARED_PARITY_MODE_MISSING';
const decision =
  status === 'PASS'
    ? 'PATH_A_IMPLEMENTED_SHARED_PARITY_MODE_PROVEN'
    : status === 'IMPLEMENTED_STATIC_API_UNREACHABLE'
      ? 'PATH_A_IMPLEMENTED_STATIC_PROOF_PRESENT_LIVE_API_PROOF_PENDING'
      : status === 'BLOCKED_SHARED_CONTRACT_PARITY_MISMATCH'
        ? 'PATH_A_IMPLEMENTED_BUT_PARITY_MISMATCH_REMAINS'
        : 'PATH_A_REQUIRED_SHARED_PARITY_CONTRACT_DEFINED_NOT_IMPLEMENTED';

const report = {
  checkedAt: new Date().toISOString(),
  slice: 'statistics-shared-population-contract',
  status,
  decision,
  apiBase,
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
  apiParity,
  implementationAssessment,
  blockers,
  requiredClosure: [
    ...(hardBlockers.length
      ? ['Close the hard blockers listed above.']
      : ['Keep the live same-population parity proof attached to this artifact.']),
    'Only upgrade the Statistics superset claim when both surfaces agree on the shared contract and Benton reference lanes remain reference-only.',
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
  apiParity: report.apiParity.status,
  blockers: report.blockers.length,
  evidence: [rel(jsonOut), rel(mdOut)],
}, null, 2));

process.exitCode = report.status === 'PASS' ? 0 : 1;
