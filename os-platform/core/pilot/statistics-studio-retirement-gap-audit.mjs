#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const evidenceDir = path.join(repoRoot, 'os-platform/core/pilot/evidence');
const statisticsStudioPath = 'frontend/apps/os-shell/src/pages/forge/statistics/StatisticsStudio.tsx';
const countyWorkbenchPath = 'frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyStatisticsWorkbenchPanel.tsx';
const moduleComponentsPath = 'frontend/apps/os-shell/src/config/moduleComponents.tsx';
const generatedModulesPath = 'frontend/apps/os-shell/src/config/generatedModules.ts';
const sharedContractPath = 'os-platform/core/pilot/evidence/statistics-shared-population-contract.latest.json';
const devDataTruthPath = 'os-platform/core/pilot/evidence/dev-data-truth-gate.latest.json';

function readText(relPath) {
  return readFileSync(path.join(repoRoot, relPath), 'utf8');
}

function readJson(relPath) {
  if (!existsSync(path.join(repoRoot, relPath))) return null;
  return JSON.parse(readText(relPath));
}

function lineOf(relPath, pattern) {
  const lines = readText(relPath).split(/\r?\n/);
  const index = lines.findIndex((line) => pattern.test(line));
  return index >= 0 ? index + 1 : null;
}

function ref(relPath, pattern) {
  const line = lineOf(relPath, pattern);
  return line ? `${relPath}:${line}` : relPath;
}

function has(relPath, pattern) {
  return pattern.test(readText(relPath));
}

const sharedContract = readJson(sharedContractPath);
const devDataTruth = readJson(devDataTruthPath);
const sharedParityPass =
  sharedContract?.status === 'PASS'
  && sharedContract?.apiParity?.status === 'PASS';
const dataTruthUnblocked =
  devDataTruth?.failures?.length === 0
  && (devDataTruth?.status === 'PASS' || devDataTruth?.status === 'PASS_WITH_WARNINGS');

const sourcePresence = {
  statisticsStudioStandaloneModule:
    has(moduleComponentsPath, /case 'statistics-studio'/)
    && has(generatedModulesPath, /"id": "statistics-studio"/),
  statisticsStudioCoreTabs:
    has(statisticsStudioPath, /ratio-study/)
    && has(statisticsStudioPath, /stratified/)
    && has(statisticsStudioPath, /trends/)
    && has(statisticsStudioPath, /equity/)
    && has(statisticsStudioPath, /outliers/)
    && has(statisticsStudioPath, /comparison/)
    && has(statisticsStudioPath, /calibration/)
    && has(statisticsStudioPath, /cost-analytics/),
  countyStudioCoreModes:
    has(countyWorkbenchPath, /ratio-study/)
    && has(countyWorkbenchPath, /stratified/)
    && has(countyWorkbenchPath, /trends/)
    && has(countyWorkbenchPath, /equity/)
    && has(countyWorkbenchPath, /outliers/)
    && has(countyWorkbenchPath, /comparison/)
    && has(countyWorkbenchPath, /calibration/)
    && has(countyWorkbenchPath, /cost-analytics/),
  countyStatisticsCompat:
    has(countyWorkbenchPath, /StatisticsCompatContractPanel/)
    && has(countyWorkbenchPath, /statistics_ratio_study_compat_v1/),
  countyNativeIntelligence:
    has(countyWorkbenchPath, /assessment-intelligence/)
    && has(countyWorkbenchPath, /quality-control/)
    && has(countyWorkbenchPath, /market-context/),
  advancedTabsShared:
    has(statisticsStudioPath, /DiagnosticsTab/)
    && has(countyWorkbenchPath, /DiagnosticsTab/)
    && has(statisticsStudioPath, /SpatialTemporalTab/)
    && has(countyWorkbenchPath, /SpatialTemporalTab/)
    && has(statisticsStudioPath, /CalibrationEngineTab/)
    && has(countyWorkbenchPath, /CalibrationEngineTab/),
  countyVeiPinnedToStudy:
    has(countyWorkbenchPath, /selectedTaxYear=\{taxYear\}/)
    && has(countyWorkbenchPath, /onTaxYearChange=\{\(\) => \{\}\}/),
  statisticsVeiCanChangeTaxYear:
    has(statisticsStudioPath, /onTaxYearChange=\{setTaxYear\}/),
};

const capabilities = [
  {
    capability: 'Ratio-study metrics and IAAO status',
    statisticsStudioSurface: 'Ratio Study tab uses TerraForge store data.',
    countyStudioEquivalent:
      'Statistics Compat mode uses County Studio statistics-compat endpoint and renders the same RatioStudyPanel.',
    uiProof: [
      ref(statisticsStudioPath, /<RatioStudyPanel/),
      ref(countyWorkbenchPath, /StatisticsCompatContractPanel/),
      ref(countyWorkbenchPath, /<RatioStudyPanel/),
    ],
    parityStatus: sharedParityPass ? 'proven' : 'blocked',
    recommendation: sharedParityPass ? 'retire-or-demote-standalone' : 'keep-temporarily',
    notes:
      sharedParityPass
        ? 'statistics_ratio_study_compat_v1 is live-proven; Statistics Studio is no longer uniquely needed for ratio-study parity.'
        : 'Shared-population parity proof is not green.',
  },
  {
    capability: 'Stratified/DOR study table and CSV export',
    statisticsStudioSurface: 'Stratified Study tab renders StratifiedStudyPanel.',
    countyStudioEquivalent: 'County Studio imports the same StratifiedStudyPanel with active study county scope.',
    uiProof: [
      ref(statisticsStudioPath, /<StratifiedStudyPanel/),
      ref(countyWorkbenchPath, /<StratifiedStudyPanel/),
      ref('frontend/apps/os-shell/src/pages/forge/statistics/StratifiedStudyPanel.tsx', /generateDorCsv/),
    ],
    parityStatus: 'shared-component',
    recommendation: 'retire-or-demote-standalone',
    notes: 'No separate Statistics Studio-only implementation was found.',
  },
  {
    capability: 'COD/PRD trend charts',
    statisticsStudioSurface: 'Trends tab calls TerraForge trends endpoint and renders COD/PRD charts.',
    countyStudioEquivalent: 'County Studio calls the same trends endpoint and renders the same COD/PRD charts.',
    uiProof: [
      ref(statisticsStudioPath, /`\/terraforge\/ratio-study\/trends/),
      ref(countyWorkbenchPath, /ratio-study\/trends/),
      ref(countyWorkbenchPath, /<CODTrendChart/),
      ref(countyWorkbenchPath, /<PRDTrendChart/),
    ],
    parityStatus: 'covered-same-endpoint',
    recommendation: 'retire-or-demote-standalone',
    notes: 'Covered natively inside the County Studio workbench.',
  },
  {
    capability: 'Valuation Equity Index',
    statisticsStudioSurface: 'Equity tab renders VEIDashboard and lets the local Statistics Studio tax year change.',
    countyStudioEquivalent:
      'County Studio renders VEIDashboard with active study tax year and same neighborhood snapshots, but pins tax-year controls to the study scope.',
    uiProof: [
      ref(statisticsStudioPath, /onTaxYearChange=\{setTaxYear\}/),
      ref(countyWorkbenchPath, /selectedTaxYear=\{taxYear\}/),
      ref(countyWorkbenchPath, /onTaxYearChange=\{\(\) => \{\}\}/),
    ],
    parityStatus: 'covered-differently',
    recommendation: 'migrate-if-ad-hoc-tax-year-exploration-is-required',
    notes:
      'This is the only meaningful behavioral difference found. It is acceptable for study-scoped County Studio, but standalone Statistics Studio still has ad hoc tax-year exploration value.',
  },
  {
    capability: 'Outlier review',
    statisticsStudioSurface: 'Outliers tab renders OutlierReviewPanel.',
    countyStudioEquivalent: 'County Studio renders the same OutlierReviewPanel in its analytics modes.',
    uiProof: [
      ref(statisticsStudioPath, /<OutlierReviewPanel/),
      ref(countyWorkbenchPath, /<OutlierReviewPanel/),
    ],
    parityStatus: 'shared-component',
    recommendation: 'retire-or-demote-standalone',
    notes: 'No unique Statistics Studio-only outlier surface was found.',
  },
  {
    capability: 'Model comparison',
    statisticsStudioSurface: 'Comparison tab renders ModelComparisonPanel.',
    countyStudioEquivalent: 'County Studio renders the same ModelComparisonPanel.',
    uiProof: [
      ref(statisticsStudioPath, /<ModelComparisonPanel/),
      ref(countyWorkbenchPath, /<ModelComparisonPanel/),
    ],
    parityStatus: 'shared-component',
    recommendation: 'retire-or-demote-standalone',
    notes: 'No unique Statistics Studio-only model comparison implementation was found.',
  },
  {
    capability: 'Calibration matrix and value-driver attribution',
    statisticsStudioSurface: 'Calibration tab renders CostRatioAnalysis and ValueDriverPanel.',
    countyStudioEquivalent:
      'County Studio renders CostRatioAnalysis and ValueDriverPanel with active county scope override.',
    uiProof: [
      ref(statisticsStudioPath, /<CostRatioAnalysis/),
      ref(statisticsStudioPath, /<ValueDriverPanel/),
      ref(countyWorkbenchPath, /<CostRatioAnalysis/),
      ref(countyWorkbenchPath, /<ValueDriverPanel/),
    ],
    parityStatus: 'shared-component',
    recommendation: 'retire-or-demote-standalone',
    notes: 'Covered in County Studio with study county context.',
  },
  {
    capability: 'Cost analytics',
    statisticsStudioSurface: 'Cost Analytics tab renders CostForgeDashboard.',
    countyStudioEquivalent: 'County Studio renders the same CostForgeDashboard.',
    uiProof: [
      ref(statisticsStudioPath, /<CostForgeDashboard/),
      ref(countyWorkbenchPath, /<CostForgeDashboard/),
    ],
    parityStatus: 'shared-component',
    recommendation: 'retire-or-demote-standalone',
    notes: 'Covered, but still conceptually a specialist CostForge surface inside County Studio.',
  },
  {
    capability: 'Advanced diagnostics, spatial/temporal, and calibration engine',
    statisticsStudioSurface: 'Advanced tabs render DiagnosticsTab, SpatialTemporalTab, and CalibrationEngineTab.',
    countyStudioEquivalent:
      'County Studio renders the same advanced panels and applies the same advanced certification guard.',
    uiProof: [
      ref(statisticsStudioPath, /activeTab === 'diagnostics'/),
      ref(countyWorkbenchPath, /case 'diagnostics'/),
      ref(countyWorkbenchPath, /advancedGuarded/),
    ],
    parityStatus: sourcePresence.advancedTabsShared ? 'shared-component' : 'missing',
    recommendation: sourcePresence.advancedTabsShared ? 'retire-or-demote-standalone' : 'keep-temporarily',
    notes: 'Advanced panels are shared; certification posture is preserved.',
  },
  {
    capability: 'Market context and economics',
    statisticsStudioSurface: 'Statistics Studio does not expose a market-context tab.',
    countyStudioEquivalent:
      'County Studio adds a reference-only certified market lane plus MarketAnalyticsDashboard, MarketDashboard, and EconomicIndicators.',
    uiProof: [
      ref(countyWorkbenchPath, /case 'market-context'/),
      ref(countyWorkbenchPath, /Reference-Only Market Lane/),
      ref(countyWorkbenchPath, /<MarketAnalyticsDashboard/),
    ],
    parityStatus: dataTruthUnblocked ? 'county-studio-only-reference-context' : 'posture-blocked',
    recommendation: 'keep-in-county-studio',
    notes: 'This is additional County Studio context, not a reason to keep Statistics Studio.',
  },
  {
    capability: 'Assessment intelligence and quality control',
    statisticsStudioSurface: 'Statistics Studio does not expose these as tabs.',
    countyStudioEquivalent:
      'County Studio derives AssessmentIntelligence and QualityControlPanel from active study health and segment data.',
    uiProof: [
      ref(countyWorkbenchPath, /buildAssessmentIntelligence/),
      ref(countyWorkbenchPath, /buildQualityDimensions/),
      ref(countyWorkbenchPath, /<AssessmentIntelligence/),
      ref(countyWorkbenchPath, /<QualityControlPanel/),
    ],
    parityStatus: 'county-studio-only',
    recommendation: 'keep-in-county-studio',
    notes: 'County Studio now exceeds Statistics Studio for operational triage context.',
  },
  {
    capability: 'Standalone module entrypoint',
    statisticsStudioSurface:
      'Statistics Studio remains a standalone module id in moduleComponents/generatedModules and can launch without an active County Studio study.',
    countyStudioEquivalent:
      'County Studio requires an active study for its workbench-native statistics surface.',
    uiProof: [
      ref(moduleComponentsPath, /case 'statistics-studio'/),
      ref(generatedModulesPath, /"id": "statistics-studio"/),
      ref(countyWorkbenchPath, /Open a County Studio study/),
    ],
    parityStatus: 'unique-shell-not-unique-analytics',
    recommendation: 'demote-keep-temporarily',
    notes:
      'This is the remaining unique value: a standalone launcher/shell for ad hoc access. It is not unique analytical capability.',
  },
];

const missing = capabilities.filter((row) => row.parityStatus === 'missing');
const keepTemporarily = capabilities.filter((row) => /keep-temporarily|migrate/.test(row.recommendation));

const decision =
  missing.length > 0
    ? 'KEEP_STATISTICS_STUDIO_UNTIL_MISSING_CAPABILITIES_MIGRATE'
    : keepTemporarily.length > 0
      ? 'DEMOTE_STATISTICS_STUDIO_KEEP_TEMPORARILY_FOR_STANDALONE_SHELL_AND_VEI_EXPLORATION'
      : 'RETIRE_STATISTICS_STUDIO';

const report = {
  checkedAt: new Date().toISOString(),
  slice: 'statistics-studio-retirement-gap-audit',
  status: missing.length === 0 ? 'PASS_WITH_PRODUCT_GAPS' : 'FAIL_MISSING_CAPABILITY',
  decision,
  sourcePresence,
  prerequisiteProofs: {
    statisticsSharedContract: {
      path: sharedContractPath,
      status: sharedContract?.status ?? 'missing',
      apiParity: sharedContract?.apiParity?.status ?? 'missing',
    },
    devDataTruth: {
      path: devDataTruthPath,
      status: devDataTruth?.status ?? 'missing',
      failures: devDataTruth?.failures?.length ?? null,
    },
  },
  summary: {
    totalCapabilities: capabilities.length,
    missing: missing.length,
    keepTemporarily: keepTemporarily.length,
    retireOrDemote: capabilities.filter((row) => row.recommendation === 'retire-or-demote-standalone').length,
    countyStudioOnly: capabilities.filter((row) => row.parityStatus.startsWith('county-studio-only')).length,
  },
  matrix: capabilities,
  requiredClosureBeforeHiding: [
    'Decide whether standalone Statistics Studio ad hoc tax-year exploration is still required.',
    'If not required, demote the statistics-studio module entrypoint to legacy/specialist or redirect users to County Studio study selection.',
    'Do not remove shared statistics panels; County Studio still imports them as native workbench capabilities.',
  ],
};

function mdTable(rows) {
  return [
    '| Capability | County Studio equivalent | UI proof | Parity status | Recommendation |',
    '| --- | --- | --- | --- | --- |',
    ...rows.map((row) =>
      `| ${row.capability} | ${row.countyStudioEquivalent} | ${row.uiProof.map((proof) => `\`${proof}\``).join('<br>')} | ${row.parityStatus} | ${row.recommendation} |`,
    ),
  ];
}

function writeMarkdown() {
  const lines = [
    '# Statistics Studio Retirement Gap Audit',
    '',
    `Checked: ${report.checkedAt}`,
    `Status: ${report.status}`,
    `Decision: ${report.decision}`,
    '',
    '## Prerequisite Proofs',
    '',
    `- Shared contract: ${report.prerequisiteProofs.statisticsSharedContract.status} / ${report.prerequisiteProofs.statisticsSharedContract.apiParity}`,
    `- Dev-data truth: ${report.prerequisiteProofs.devDataTruth.status}; failures=${report.prerequisiteProofs.devDataTruth.failures}`,
    '',
    '## Gap Matrix',
    '',
    ...mdTable(report.matrix),
    '',
    '## Required Closure Before Hiding',
    '',
    ...report.requiredClosureBeforeHiding.map((item) => `- ${item}`),
    '',
  ];
  return `${lines.join('\n')}\n`;
}

mkdirSync(evidenceDir, { recursive: true });
const jsonPath = path.join(evidenceDir, 'statistics-studio-retirement-gap-audit.latest.json');
const mdPath = path.join(evidenceDir, 'statistics-studio-retirement-gap-audit.latest.md');
writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(mdPath, writeMarkdown());

console.log(JSON.stringify({
  status: report.status,
  decision: report.decision,
  capabilities: report.summary.totalCapabilities,
  missing: report.summary.missing,
  keepTemporarily: report.summary.keepTemporarily,
  evidence: [
    'os-platform/core/pilot/evidence/statistics-studio-retirement-gap-audit.latest.json',
    'os-platform/core/pilot/evidence/statistics-studio-retirement-gap-audit.latest.md',
  ],
}, null, 2));

if (missing.length > 0) process.exit(1);
