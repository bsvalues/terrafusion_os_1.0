#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const evidenceDir = path.join(repoRoot, 'os-platform/core/pilot/evidence');
const jsonOut = path.join(evidenceDir, 'dev-data-truth-gate.latest.json');
const mdOut = path.join(evidenceDir, 'dev-data-truth-gate.latest.md');

const apiBase = (process.env.TF_DATA_TRUTH_API_BASE
  ?? process.env.VITE_DEV_HEALTH_BASE
  ?? 'http://localhost:5173/api').replace(/\/$/, '');
const countyId = process.env.TF_DATA_TRUTH_COUNTY_ID
  ?? process.env.VITE_DEV_COUNTY_ID
  ?? '19190019-1919-1919-1919-191919191919';
const requestedStudyId = process.env.TF_DATA_TRUTH_STUDY_ID ?? null;
const taxYear = Number(process.env.TF_DATA_TRUTH_TAX_YEAR ?? new Date().getFullYear());
const standardDirectSourceProofPath = 'os-platform/core/pilot/evidence/direct-source-recompute.latest.json';
const directSourceProofPath = process.env.TF_DATA_TRUTH_DIRECT_SOURCE_PROOF
  ?? (existsSync(path.join(repoRoot, standardDirectSourceProofPath)) ? standardDirectSourceProofPath : null);
const standardStatisticsScopeProofPath = 'os-platform/core/pilot/evidence/statistics-parity-scope-alignment.latest.json';
const statisticsScopeProofPath = process.env.TF_STATISTICS_PARITY_SCOPE_PROOF
  ?? (existsSync(path.join(repoRoot, standardStatisticsScopeProofPath)) ? standardStatisticsScopeProofPath : null);
const standardSharedContractProofPath = 'os-platform/core/pilot/evidence/statistics-shared-population-contract.latest.json';
const sharedContractProofPath = process.env.TF_STATISTICS_SHARED_CONTRACT_PROOF
  ?? (existsSync(path.join(repoRoot, standardSharedContractProofPath)) ? standardSharedContractProofPath : null);
const maxSegments = Number(process.env.TF_DATA_TRUTH_SEGMENT_SAMPLE_SIZE ?? 10);
const fakeCountyId = process.env.TF_DATA_TRUTH_FAKE_COUNTY_ID
  ?? '00000000-0000-0000-0000-000000000999';

const matrix = [];
const checks = [];
const failures = [];
const warnings = [];

function rel(file) {
  return path.relative(repoRoot, file).replaceAll('\\', '/');
}

function pushMatrix(surface, metricBehavior, sourceOfTruth, verified, notes, evidence = {}) {
  matrix.push({ surface, metricBehavior, sourceOfTruth, verified, notes, evidence });
  if (verified === 'no') failures.push(`${surface}: ${metricBehavior} - ${notes}`);
  if (verified === 'partial') warnings.push(`${surface}: ${metricBehavior} - ${notes}`);
}

function pushCheck(name, ok, detail = {}) {
  checks.push({ name, ok, ...detail });
  if (!ok) failures.push(`${name}: ${detail.reason ?? 'failed'}`);
}

function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function nearlyEqual(a, b, tolerance = 0.005) {
  return isNumber(a) && isNumber(b) && Math.abs(a - b) <= tolerance;
}

function readText(target) {
  try {
    return readFileSync(path.join(repoRoot, target), 'utf8');
  } catch {
    return '';
  }
}

function readJson(target) {
  try {
    return JSON.parse(readText(target));
  } catch {
    return null;
  }
}

async function getJson(name, route, options = {}) {
  const startedAt = Date.now();
  const url = route.startsWith('http') ? route : `${apiBase}${route}`;
  const headers = {
    'x-county-id': options.countyId ?? countyId,
    ...(options.headers ?? {}),
  };

  try {
    const response = await fetch(url, { headers });
    const text = await response.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    checks.push({
      name,
      ok: response.ok,
      status: response.status,
      ms: Date.now() - startedAt,
      url,
      bodyPreview: typeof body === 'string'
        ? body.slice(0, 240)
        : summarizeBody(body),
    });
    return { ok: response.ok, status: response.status, body, url };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    checks.push({ name, ok: false, status: 0, ms: Date.now() - startedAt, url, error: message });
    return { ok: false, status: 0, body: null, url, error: message };
  }
}

function summarizeBody(body) {
  if (Array.isArray(body)) return { kind: 'array', count: body.length };
  if (!body || typeof body !== 'object') return body;
  const summary = {};
  for (const key of Object.keys(body).slice(0, 12)) {
    const value = body[key];
    summary[key] = Array.isArray(value) ? `array(${value.length})` : value;
  }
  return summary;
}

function chooseStudy(studies) {
  if (!Array.isArray(studies)) return null;
  if (requestedStudyId) {
    return studies.find((study) => study.studyId === requestedStudyId) ?? null;
  }
  return studies.find((study) => study.activeSegmentSetId)
    ?? studies.find((study) => study.status === 'Active')
    ?? studies[0]
    ?? null;
}

function classifyLeakageLine(line, file) {
  if (/[\\/]__tests__[\\/]|\.test\./i.test(file)) {
    return 'test-fixture';
  }
  if (/BENTON_DEV_COUNTY_ID|DEFAULT_DEV_SESSION|benton.*alias|BENTON_ALIASES/i.test(line)) {
    return 'dev-session-normalization';
  }
  if (/income-approach\/market-data\/benton|market-data\/benton/i.test(line)) {
    return 'benton-certified-reference-lane';
  }
  if (/fallback|mock|fixture|sample/i.test(line)) {
    return 'possible-fallback-or-fixture';
  }
  if (!/export\s+default/i.test(line) && /default\s+county|default.*county|county.*default/i.test(line)) {
    return 'possible-fallback-or-fixture';
  }
  return 'reference';
}

function leakageScan() {
  const targets = [
    'frontend/apps/os-shell/src/auth/session.ts',
    'frontend/apps/os-shell/src/auth/useSession.ts',
    'frontend/apps/os-shell/src/pages/forge/county-studio',
    'frontend/apps/os-shell/src/pages/forge/statistics',
    'frontend/apps/os-shell/src/services',
    'backend/src/TerraFusion.API/Controllers/TerraForgeController.cs',
    'backend/src/TerraFusion.API/Controllers/CountyStudyController.cs',
    'backend/src/TerraFusion.Core/Services/CountyStudySegmentDerivationService.cs',
    'backend/src/TerraFusion.Core/Services/CountyStudyService.cs',
  ];
  const matches = [];

  function walk(absPath) {
    if (!existsSync(absPath)) return;
    const stat = statSync(absPath);
    if (stat.isDirectory()) {
      for (const entry of readdirSync(absPath)) {
        walk(path.join(absPath, entry));
      }
      return;
    }
    if (!/\.(ts|tsx|cs|mjs|js)$/.test(absPath)) return;
    const text = readFileSync(absPath, 'utf8');
    text.split(/\r?\n/).forEach((line, index) => {
      if (/benton|19190019-1919-1919-1919-191919191919|53005|BentonCountyId/i.test(line)) {
        matches.push({
          file: rel(absPath),
          line: index + 1,
          classification: classifyLeakageLine(line, absPath),
          text: line.trim().slice(0, 220),
        });
      }
    });
  }

  for (const target of targets) walk(path.join(repoRoot, target));
  return matches;
}

function sourcePathAudit() {
  const derivation = readText('backend/src/TerraFusion.Core/Services/CountyStudySegmentDerivationService.cs');
  const scenario = readText('backend/src/TerraFusion.Core/Services/CountyStudyService.cs');
  const sync = readText('backend/src/TerraFusion.API/Controllers/SyncController.cs');
  const terraForge = readText('backend/src/TerraFusion.API/Controllers/TerraForgeController.cs');
  return {
    segmentDerivationUsesCanonicalTables:
      /_db\.Properties/.test(derivation)
      && /_db\.CamaCharacteristics/.test(derivation)
      && /_db\.ComparableSales/.test(derivation),
    segmentDerivationQualifiedSales:
      /QualificationDecision.*QualificationRecommendation.*SaleQualification/s.test(derivation),
    scenarioPreviewRehydratesCohortFromSource:
      /ResolveCohortParcelsAsync/.test(scenario)
      && /_db\.Properties/.test(scenario)
      && /_db\.ComparableSales/.test(scenario),
    syncBridgeBackfillsRatioMetadata:
      /BackfillRatios/.test(sync)
      && /RawRatioTypeCd/.test(sync)
      && /PacsComputedRatio/.test(sync)
      && /ComputeRecommendationsAsync/.test(sync),
    ratioStudyUsesEffectiveQualifiedPool:
      /QualificationDecision == "qualified"/.test(terraForge)
      && /QualificationRecommendation == "qualified"/.test(terraForge)
      && /SuppressOnRatioRptCd != "T"/.test(terraForge)
      && /IncludeNoCalc != true/.test(terraForge),
  };
}

function ratioStudyStats(body) {
  if (!body || typeof body !== 'object') return null;
  if (body.stats && typeof body.stats === 'object') return body.stats;
  return body;
}

function databasePosture() {
  const appsettings = readJson('backend/src/TerraFusion.API/appsettings.Development.json');
  const local = readJson('backend/src/TerraFusion.API/appsettings.Development.local.json');
  const coverage = readJson('os-platform/core/pilot/evidence/washington-39-county-coverage.latest.json');
  const defaultConnection = appsettings?.ConnectionStrings?.DefaultConnection ?? null;
  const bentonLegacy = appsettings?.ConnectionStrings?.BentonCountyLegacy ?? null;
  const localOverrides = Object.keys(local?.ConnectionStrings ?? {});
  return {
    defaultConnection,
    defaultConnectionKind: typeof defaultConnection === 'string' && defaultConnection.includes('Host=')
      ? 'postgres'
      : typeof defaultConnection === 'string' && defaultConnection.includes('Data Source=')
        ? 'sqlite'
        : 'unknown',
    bentonLegacy,
    localOverrides,
    defaultCounty: appsettings?.DefaultCounty ?? null,
    county39CoverageStatus: coverage?.status ?? null,
    county39CoverageScope: coverage?.source?.workbook ? 'registry/acquisition inventory workbook' : null,
    county39Limitations: coverage?.limitations ?? [],
    county39Counts: coverage?.counts ?? null,
  };
}

function trustTierPosture(activeCountyId) {
  const model = readJson('os-platform/core/pilot/county-data-trust-tiers.json');
  const countyRule = model?.countyRules?.find((rule) =>
    rule.countyId && String(rule.countyId).toLowerCase() === String(activeCountyId).toLowerCase(),
  );
  const defaultRule = model?.countyRules?.find((rule) => rule.scope === 'WA_39_COUNTY_REGISTRY_DEFAULT');
  const rule = countyRule ?? defaultRule ?? null;
  const tier = rule ? model?.tiers?.[rule.primaryTier] : null;
  return {
    modelPresent: Boolean(model),
    activeRule: rule,
    activeTier: tier,
    uiLabel: rule ? model?.uiLabels?.[rule.primaryTier] ?? tier?.label ?? rule.primaryTier : 'Unavailable',
    allowsParityClaims: Boolean(tier?.allowsParityClaims),
  };
}

function classifyCrossSurfaceMismatch(health, ratioStudy) {
  const stats = ratioStudyStats(ratioStudy);
  if (!health || !stats) {
    return {
      verified: 'partial',
      classification: 'honest unavailable / incompatible comparison',
      reason: 'One side of the comparison was unavailable.',
    };
  }

  const ratioStudyCount = Number(ratioStudy.countWithRatio ?? ratioStudy.total ?? 0);
  const healthCount = Number(health.ratioCount ?? 0);
  const populationDivergence = ratioStudyCount > 0 && healthCount > ratioStudyCount * 5;
  const metricMismatch =
    !nearlyEqual(health.medianRatio, stats.medianRatio, 0.02)
    || !nearlyEqual(health.cod, stats.cod, 2)
    || !nearlyEqual(health.prd, stats.prd, 0.05);

  if (!metricMismatch) {
    return {
      verified: 'yes',
      classification: 'consistent',
      reason: `health and ratio-study agree within tolerance; health ratioCount=${healthCount}; ratio-study countWithRatio=${ratioStudyCount}.`,
    };
  }

  if (populationDivergence) {
    return {
      verified: 'no',
      classification: 'scope mismatch',
      reason:
        `Population mismatch: County Studio health uses ratioCount=${healthCount}, ` +
        `while TerraForge ratio-study uses countWithRatio=${ratioStudyCount}. ` +
        'This blocks parity until both surfaces compare the same cohort/window/qualification pool.',
    };
  }

  return {
    verified: 'no',
    classification: 'derivation/API mapping mismatch',
    reason: 'Metric mismatch with comparable population sizes; inspect derivation and API mapping.',
  };
}

function directSourceProof() {
  if (!directSourceProofPath) return { present: false, reason: 'TF_DATA_TRUTH_DIRECT_SOURCE_PROOF is not set.' };
  const abs = path.resolve(repoRoot, directSourceProofPath);
  if (!existsSync(abs)) return { present: false, reason: `Proof file does not exist: ${directSourceProofPath}` };
  try {
    const parsed = JSON.parse(readFileSync(abs, 'utf8'));
    return {
      present: parsed.status === 'PASS' || parsed.directSourceRecompute === true,
      path: rel(abs),
      status: parsed.status,
      reason: parsed.status === 'PASS' || parsed.directSourceRecompute === true
        ? 'Direct source recomputation proof accepted.'
        : 'Proof file did not report PASS/directSourceRecompute.',
    };
  } catch (error) {
    return {
      present: false,
      path: rel(abs),
      reason: `Proof file is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

function statisticsScopeProof() {
  if (!statisticsScopeProofPath) {
    return { present: false, reason: 'TF_STATISTICS_PARITY_SCOPE_PROOF is not set.' };
  }
  const abs = path.resolve(repoRoot, statisticsScopeProofPath);
  if (!existsSync(abs)) return { present: false, reason: `Proof file does not exist: ${statisticsScopeProofPath}` };
  try {
    const parsed = JSON.parse(readFileSync(abs, 'utf8'));
    return {
      present: true,
      path: rel(abs),
      status: parsed.status,
      rootCause: parsed.rootCause?.label ?? null,
      countDifference: parsed.countDifference ?? null,
      overlap: parsed.overlap ?? null,
      reason: parsed.rootCause?.notes ?? 'Statistics parity scope alignment proof parsed.',
    };
  } catch (error) {
    return {
      present: false,
      path: rel(abs),
      reason: `Scope proof file is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

function sharedContractProof() {
  if (!sharedContractProofPath) {
    return { present: false, reason: 'TF_STATISTICS_SHARED_CONTRACT_PROOF is not set.' };
  }
  const abs = path.resolve(repoRoot, sharedContractProofPath);
  if (!existsSync(abs)) return { present: false, reason: `Proof file does not exist: ${sharedContractProofPath}` };
  try {
    const parsed = JSON.parse(readFileSync(abs, 'utf8'));
    return {
      present: true,
      path: rel(abs),
      status: parsed.status,
      decision: parsed.decision ?? null,
      contract: parsed.sharedParityContract?.id ?? null,
      blockers: parsed.blockers ?? [],
      reason: parsed.decision ?? 'Statistics shared population contract proof parsed.',
    };
  } catch (error) {
    return {
      present: false,
      path: rel(abs),
      reason: `Shared contract proof file is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

function postureFromLeakage(leakage, directProof) {
  const bentonReferenceLanes = leakage.filter(
    (match) => match.classification === 'benton-certified-reference-lane',
  );
  const devSessionNormalizations = leakage.filter(
    (match) => match.classification === 'dev-session-normalization',
  );
  const possibleFallbacks = leakage.filter(
    (match) => match.classification === 'possible-fallback-or-fixture',
  );

  const blockers = [];
  if (!directProof.present) blockers.push('direct source-data recomputation is missing');
  if (bentonReferenceLanes.length > 0) blockers.push('Benton-certified reference lanes are still present');
  if (possibleFallbacks.length > 0) blockers.push('possible Benton fallback/fixture references require review');

  return {
    bentonReferenceLanes,
    devSessionNormalizations,
    possibleFallbacks,
    blockers,
    countySovereignStatisticsSupersetProven: blockers.length === 0,
  };
}

function buildMarkdown(report) {
  const rows = report.matrix.map((row) =>
    `| ${row.surface} | ${row.metricBehavior} | ${row.sourceOfTruth} | ${row.verified} | ${String(row.notes).replaceAll('\n', ' ')} |`,
  );
  const failureRows = report.failures.map((failure) => `- ${failure}`);
  const warningRows = report.warnings.map((warning) => `- ${warning}`);
  return [
    '# County Studio Data Truth Matrix',
    '',
    `Checked: ${report.checkedAt}`,
    '',
    `Status: ${report.status}`,
    '',
    `API base: \`${report.apiBase}\``,
    `County: \`${report.countyId}\``,
    `Study: \`${report.study?.studyId ?? 'none'}\``,
    '',
    '| Surface | Metric/Behavior | Source of truth | Verified? | Notes |',
    '| --- | --- | --- | --- | --- |',
    ...rows,
    '',
    '## Failures',
    '',
    ...(failureRows.length ? failureRows : ['- None']),
    '',
    '## Warnings',
    '',
    ...(warningRows.length ? warningRows : ['- None']),
    '',
    '## Leakage Matches',
    '',
    ...(report.fixtureLeakage.matches.length
      ? report.fixtureLeakage.matches.slice(0, 80).map(
          (match) => `- ${match.file}:${match.line} [${match.classification}] ${match.text}`,
        )
      : ['- None']),
    '',
  ].join('\n');
}

async function main() {
  const sourceAudit = sourcePathAudit();
  const directProof = directSourceProof();
  const scopeProof = statisticsScopeProof();
  const contractProof = sharedContractProof();
  const leakage = leakageScan();
  const posture = postureFromLeakage(leakage, directProof);
  const dbPosture = databasePosture();
  const trustPosture = trustTierPosture(countyId);

  pushMatrix(
    'County Studio',
    'Derivation source path',
    'CountyStudySegmentDerivationService canonical tables',
    sourceAudit.segmentDerivationUsesCanonicalTables && sourceAudit.segmentDerivationQualifiedSales ? 'partial' : 'no',
    sourceAudit.segmentDerivationUsesCanonicalTables
      ? 'Code path reads Properties, CamaCharacteristics, and ComparableSales. Independent row recomputation still required.'
      : 'Derivation source path did not show all canonical inputs.',
    sourceAudit,
  );

  pushMatrix(
    'County Studio',
    'Direct source-data recomputation',
    'Independent source ledger or DB recompute artifact',
    directProof.present ? 'yes' : 'no',
    directProof.reason,
    directProof,
  );

  pushMatrix(
    'TerraFusion Sync',
    '2017 conversion / qualified-sale risk posture',
    'SyncController qualification-status/backfill-ratios + direct source proof dependency',
    directProof.present ? 'partial' : 'no',
    directProof.present
      ? 'Direct proof exists, but qualification conversion coverage still needs explicit row-level classification.'
      : 'Known risk: converted qualified-sale fields may be missing or misfilled; no direct source recomputation artifact has closed this risk.',
    {
      syncBridgeBackfillsRatioMetadata: sourceAudit.syncBridgeBackfillsRatioMetadata,
      ratioStudyUsesEffectiveQualifiedPool: sourceAudit.ratioStudyUsesEffectiveQualifiedPool,
    },
  );

  pushMatrix(
    'Database posture',
    'Benton operational DB vs legacy sync bridge',
    'backend/src/TerraFusion.API/appsettings.Development.json',
    dbPosture.defaultConnection && dbPosture.bentonLegacy ? 'partial' : 'no',
    dbPosture.defaultConnection && dbPosture.bentonLegacy
      ? `Development API points at ${dbPosture.defaultConnectionKind} DefaultConnection and keeps BentonCountyLegacy as a sync bridge. This proves configuration posture, not source truth.`
      : 'Could not verify both TerraFusion DefaultConnection and BentonCountyLegacy sync bridge configuration.',
    dbPosture,
  );

  pushMatrix(
    'Database posture',
    'Washington 39-county data posture',
    'washington-39-county-coverage proof',
    dbPosture.county39CoverageStatus === 'PASS_WITH_LIMITATIONS' ? 'partial' : 'no',
    dbPosture.county39CoverageStatus === 'PASS_WITH_LIMITATIONS'
      ? '39-county proof is registry/acquisition-path inventory only; it does not prove official statewide ingestion, normalization, geometry, or runtime county data.'
      : '39-county coverage evidence missing or not in PASS_WITH_LIMITATIONS posture.',
    {
      status: dbPosture.county39CoverageStatus,
      scope: dbPosture.county39CoverageScope,
      limitations: dbPosture.county39Limitations,
      counts: dbPosture.county39Counts,
    },
  );

  pushMatrix(
    'County Studio',
    'County trust tier and UI label posture',
    'county-data-trust-tiers.json',
    trustPosture.modelPresent && trustPosture.activeRule ? 'partial' : 'no',
    trustPosture.modelPresent && trustPosture.activeRule
      ? `${trustPosture.uiLabel}; parity claims allowed=${trustPosture.allowsParityClaims}. UI must surface badges: ${(trustPosture.activeRule.badges ?? []).join(', ')}.`
      : 'No trust-tier rule exists for this county/scope.',
    trustPosture,
  );

  pushMatrix(
    'Statistics Studio parity',
    'County-sovereign statistics superset claim',
    'dev-data-truth-gate direct proof + Benton leakage scan',
    posture.countySovereignStatisticsSupersetProven ? 'yes' : 'no',
    posture.countySovereignStatisticsSupersetProven
      ? 'Native workbench posture has direct source proof and no Benton-only reference-lane blockers.'
      : `Claim remains provisional: ${posture.blockers.join('; ')}.`,
    {
      bentonReferenceLaneCount: posture.bentonReferenceLanes.length,
      devSessionNormalizationCount: posture.devSessionNormalizations.length,
      possibleFallbackCount: posture.possibleFallbacks.length,
      directSourceProofPresent: directProof.present,
    },
  );

  const countyStats = await getJson(
    'TerraForge county stats reachability',
    `/terraforge/county-stats?taxYear=${taxYear}&countyId=${encodeURIComponent(countyId)}`,
  );
  pushCheck('Dev data API reachable', countyStats.ok, {
    reason: countyStats.error ?? `HTTP ${countyStats.status}`,
  });
  if (!countyStats.ok) {
    writeReport(null, null, [], null, null, [], [], [], sourceAudit, directProof, leakage);
    process.exit(1);
  }

  const studiesResult = await getJson(
    'County Studio study list',
    `/county-study/studies?countyId=${encodeURIComponent(countyId)}`,
  );
  const studies = Array.isArray(studiesResult.body) ? studiesResult.body : [];
  const study = chooseStudy(studies);

  pushMatrix(
    'County Studio',
    'Study metadata',
    'GET /county-study/studies + selected study',
    study ? 'yes' : 'no',
    study
      ? `Selected ${study.studyId}; taxYear=${study.taxYear}; countyId=${study.countyId}; countyName=${study.countyName ?? 'missing'}.`
      : 'No control study was available for the active county.',
    { studyCount: studies.length, requestedStudyId },
  );
  if (!study) {
    writeReport(null, studies, [], null, null, [], [], [], sourceAudit, directProof, leakage);
    process.exit(1);
  }

  const [studyGet, segmentSetsResult, healthResult, cohortsResult, scenariosResult, ratioStudyResult, snapshotsResult] =
    await Promise.all([
      getJson('County Studio selected study', `/county-study/studies/${study.studyId}`),
      getJson('County Studio segment sets', `/county-study/studies/${study.studyId}/segment-sets`),
      getJson('County Studio health summary', `/county-study/studies/${study.studyId}/health-summary`),
      getJson('County Studio cohorts', `/county-study/studies/${study.studyId}/cohorts`),
      getJson('County Studio scenarios', `/county-study/studies/${study.studyId}/scenarios`),
      getJson('Statistics ratio study', `/terraforge/ratio-study?taxYear=${study.taxYear}&countyId=${encodeURIComponent(countyId)}`),
      getJson('Statistics comparison snapshots', `/terraforge/comparison-snapshots?taxYear=${study.taxYear}&countyId=${encodeURIComponent(countyId)}`),
    ]);

  const segmentSets = Array.isArray(segmentSetsResult.body) ? segmentSetsResult.body : [];
  const activeSet = segmentSets.find((set) => set.segmentSetId === study.activeSegmentSetId)
    ?? segmentSets[0]
    ?? null;
  const segmentsResult = activeSet
    ? await getJson('County Studio active segments', `/county-study/segment-sets/${activeSet.segmentSetId}/segments`)
    : { ok: false, status: 0, body: [] };
  const segments = Array.isArray(segmentsResult.body) ? segmentsResult.body : [];
  const cohorts = Array.isArray(cohortsResult.body) ? cohortsResult.body : [];
  const scenarios = Array.isArray(scenariosResult.body) ? scenariosResult.body : [];
  const health = healthResult.ok && healthResult.body && typeof healthResult.body === 'object'
    ? healthResult.body
    : null;
  const ratioStudy = ratioStudyResult.ok && ratioStudyResult.body && typeof ratioStudyResult.body === 'object'
    ? ratioStudyResult.body
    : null;
  const snapshots = Array.isArray(snapshotsResult.body) ? snapshotsResult.body : [];

  const ratioBearing = segments.filter((segment) =>
    isNumber(segment.medianRatio) || isNumber(segment.cod) || isNumber(segment.prd),
  );
  pushMatrix(
    'County Studio',
    'Study counts',
    'segment sets, active segments, cohorts, scenarios endpoints',
    activeSet && segments.length > 0 ? 'yes' : 'no',
    `segmentSets=${segmentSets.length}; segments=${segments.length}; ratioBearingSegments=${ratioBearing.length}; cohorts=${cohorts.length}; scenarios=${scenarios.length}.`,
    { activeSegmentSetId: activeSet?.segmentSetId ?? null },
  );

  pushMatrix(
    'County Studio',
    'Health summary backed by active segment set',
    'GET /county-study/studies/{studyId}/health-summary',
    health ? 'yes' : 'no',
    health
      ? `median=${health.medianRatio}; cod=${health.cod}; prd=${health.prd}; ratioCount=${health.ratioCount}; derivedAt=${health.derivedAt ?? 'null'}.`
      : `Health summary unavailable: HTTP ${healthResult.status}.`,
    { status: healthResult.status },
  );

  const sampleSegments = ratioBearing.slice(0, Math.max(1, maxSegments));
  const detailResults = [];
  for (const segment of sampleSegments) {
    detailResults.push({
      segment,
      result: await getJson(
        `Segment detail ${segment.segmentId}`,
        `/county-study/segments/${segment.segmentId}/detail`,
      ),
    });
  }

  const completeSegmentDetails = detailResults.filter(({ result }) => result.ok && result.body);
  pushMatrix(
    'County Studio',
    'Segment derivation sample',
    'GET /county-study/segment-sets/{id}/segments + /segments/{id}/detail',
    completeSegmentDetails.length >= Math.min(5, sampleSegments.length) ? 'partial' : 'no',
    `Sampled ${sampleSegments.length}; detail responses ${completeSegmentDetails.length}. API confirms shape, not independent source recomputation.`,
    {
      sampled: sampleSegments.map((segment) => ({
        segmentId: segment.segmentId,
        name: segment.name,
        medianRatio: segment.medianRatio,
        cod: segment.cod,
        prd: segment.prd,
        prb: segment.prb ?? null,
        weightedMeanRatio: segment.weightedMeanRatio ?? null,
        yoyMedianRatioDelta: segment.yoyMedianRatioDelta ?? null,
        salesCount: segment.salesCount ?? segment.ratioCount ?? null,
        exceptionCount: segment.exceptionCount,
      })),
    },
  );

  const stats = ratioStudyStats(ratioStudy);
  const crossSurface = classifyCrossSurfaceMismatch(health, ratioStudy);
  pushMatrix(
    'Cross-surface',
    'County median/COD/PRD consistency and mismatch class',
    'County health summary vs TerraForge ratio-study endpoint',
    crossSurface.verified,
    health && stats
      ? `${crossSurface.classification}: health median/COD/PRD=${health.medianRatio}/${health.cod}/${health.prd}; ratio-study=${stats.medianRatio}/${stats.cod}/${stats.prd}. ${crossSurface.reason}`
      : crossSurface.reason,
    { classification: crossSurface.classification, health, ratioStudy },
  );

  pushMatrix(
    'Statistics Studio parity',
    'Population scope alignment proof',
    'statistics-parity-scope-alignment.latest.json',
    scopeProof.present ? 'partial' : 'no',
    scopeProof.present
      ? `${scopeProof.status}; rootCause=${scopeProof.rootCause}; countDifference=${JSON.stringify(scopeProof.countDifference)}.`
      : scopeProof.reason,
    scopeProof,
  );

  pushMatrix(
    'Statistics Studio parity',
    'Shared population contract',
    'statistics-shared-population-contract.latest.json',
    contractProof.present ? 'partial' : 'no',
    contractProof.present
      ? `${contractProof.status}; decision=${contractProof.decision}; contract=${contractProof.contract}.`
      : contractProof.reason,
    contractProof,
  );

  pushMatrix(
    'Statistics Studio parity',
    'Comparison snapshot availability',
    'GET /terraforge/comparison-snapshots',
    snapshots.length > 0 ? 'partial' : 'no',
    snapshots.length > 0
      ? `Loaded ${snapshots.length} neighborhood snapshots. Neighborhood-level parity still requires row matching to segment keys.`
      : 'No comparison snapshots available for parity checks.',
    { snapshotCount: snapshots.length },
  );

  if (scenarios.length > 0) {
    const preview = await getJson(
      'Scenario preview',
      `/county-study/scenarios/${scenarios[0].scenarioId}/preview`,
    );
    pushMatrix(
      'County Studio',
      'Scenario preview',
      'GET /county-study/scenarios/{scenarioId}/preview',
      preview.ok && preview.body ? 'partial' : 'no',
      preview.ok
        ? `Preview returned for scenario ${scenarios[0].scenarioId}; source recomputation still required.`
        : `Preview unavailable: HTTP ${preview.status}.`,
      { scenarioId: scenarios[0].scenarioId, preview: preview.body },
    );
  } else {
    pushMatrix(
      'County Studio',
      'Scenario preview',
      'GET /county-study/scenarios/{scenarioId}/preview',
      'partial',
      'No scenario exists in the control study; preview truth could not be exercised.',
      { scenarioCount: 0 },
    );
  }

  const fakeCountyStats = await getJson(
    'Fixture leakage fake county stats',
    `/terraforge/county-stats?taxYear=${taxYear}&countyId=${encodeURIComponent(fakeCountyId)}`,
    { countyId: fakeCountyId },
  );
  const fakeLeakedData =
    fakeCountyStats.ok
    && fakeCountyStats.body
    && typeof fakeCountyStats.body === 'object'
    && Number(fakeCountyStats.body.totalParcels ?? 0) > 0;
  pushMatrix(
    'Fixture leakage',
    'Nonexistent county does not receive Benton data',
    'TerraForge county-stats with fake county scope',
    fakeLeakedData ? 'no' : 'yes',
    fakeLeakedData
      ? `Fake county returned parcel data; possible county fallback leakage.`
      : `Fake county returned HTTP ${fakeCountyStats.status}, not live Benton-looking data.`,
    { status: fakeCountyStats.status, body: fakeCountyStats.body },
  );

  const hardLeakage = posture.possibleFallbacks;
  pushMatrix(
    'Fixture leakage',
    'Static Benton/fallback scan',
    'frontend/backend source scan',
    hardLeakage.length === 0 ? 'yes' : 'partial',
    hardLeakage.length === 0
      ? `Found ${leakage.length} Benton references, none classified as fallback/fixture by this scanner.`
      : `Found ${hardLeakage.length} possible fallback/fixture Benton references requiring review.`,
    { totalMatches: leakage.length, possibleFallbacks: hardLeakage.slice(0, 20) },
  );

  writeReport(studyGet.body ?? study, studies, segmentSets, activeSet, health, segments, cohorts, scenarios, sourceAudit, directProof, leakage);

  if (failures.length > 0) process.exit(1);
}

function writeReport(study, studies, segmentSets, activeSet, health, segments, cohorts, scenarios, sourceAudit, directProof, leakage) {
  mkdirSync(evidenceDir, { recursive: true });
  const report = {
    checkedAt: new Date().toISOString(),
    slice: 'dev-data-truth-gate',
    status: failures.length > 0
      ? 'FAIL'
      : warnings.length > 0 ? 'PASS_WITH_WARNINGS' : 'PASS',
    apiBase,
    countyId,
    taxYear,
    study,
    counts: {
      studies: Array.isArray(studies) ? studies.length : 0,
      segmentSets: Array.isArray(segmentSets) ? segmentSets.length : 0,
      segments: Array.isArray(segments) ? segments.length : 0,
      cohorts: Array.isArray(cohorts) ? cohorts.length : 0,
      scenarios: Array.isArray(scenarios) ? scenarios.length : 0,
    },
    activeSegmentSetId: activeSet?.segmentSetId ?? null,
    healthSummary: health,
    sourcePathAudit: sourceAudit,
    directSourceProof: directProof,
    statisticsScopeProof: statisticsScopeProof(),
    sharedContractProof: sharedContractProof(),
    trustTierPosture: trustTierPosture(countyId),
    posture: postureFromLeakage(leakage, directProof),
    fixtureLeakage: {
      totalMatches: leakage.length,
      matches: leakage,
    },
    failures,
    warnings,
    checks,
    matrix,
  };
  writeFileSync(jsonOut, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(mdOut, buildMarkdown(report));
  console.log(JSON.stringify({
    status: report.status,
    failures: report.failures.length,
    warnings: report.warnings.length,
    matrixRows: report.matrix.length,
    evidence: [rel(jsonOut), rel(mdOut)],
  }, null, 2));
}

main().catch((error) => {
  failures.push(error instanceof Error ? error.stack ?? error.message : String(error));
  writeReport(null, [], [], null, null, [], [], [], sourcePathAudit(), directSourceProof(), []);
  process.exit(1);
});
