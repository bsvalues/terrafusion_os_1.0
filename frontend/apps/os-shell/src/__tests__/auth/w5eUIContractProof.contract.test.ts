/**
 * W5E — UI Contract Proof Pass
 *
 * Static source-file inspection (no rendering, no mocking).
 * PROOF-HEAVY, NOT ARCHITECTURE-HEAVY.
 *
 * This is the regression wall for all disclosure, route-collapse, and
 * surface-honesty contracts established across W4A → W5D.
 *
 * Gate 1: DemoDataBanner inventory — every governed fixture surface discloses,
 *         and TerraLevy stays on the live service path
 * Gate 2: isFixture / governed-unavailable provenance tracking — API-first
 *         components disclose truth instead of silently falling back
 * Gate 3: Workbench route-collapse — all suite tabs lazy-loaded + routed
 * Gate 4: Standalone suite routes — constitutional routes wired
 * Gate 5: No undisclosed fixture surfaces — governed pages must not
 *         silently serve fixture data without disclosure
 * Gate 6: DemoDataBanner component contract — the banner itself is correct
 * Gate 7: Sealed wave regression wall (W4A → W5D)
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const SRC_ROOT = path.resolve(__dirname, '../..');

function readSrc(relPath: string): string {
  return fs.readFileSync(path.join(SRC_ROOT, relPath), 'utf-8');
}

function srcExists(relPath: string): boolean {
  return fs.existsSync(path.join(SRC_ROOT, relPath));
}

// ============================================================================
// Gate 1 — DemoDataBanner inventory plus TerraLevy live-path proof
// ============================================================================

describe('Gate 1 — DemoDataBanner inventory: every fixture surface discloses', () => {
  it('CostManual stays on the live schedule path and does not import DemoDataBanner', () => {
    const src = readSrc('pages/forge/cost/CostManual.tsx');
    expect(src).not.toContain('DemoDataBanner');
    expect(src).toContain('data-testid="cost-manual-unavailable"');
    expect(src).toContain('Live cost schedule unavailable.');
  });

  it('BatchCostRun renders an explicit unavailable state instead of DemoDataBanner', () => {
    const src = readSrc('pages/forge/batch/BatchCostRun.tsx');
    expect(src).not.toContain('DemoDataBanner');
    expect(src).toContain('data-testid="batch-cost-run-unavailable"');
    expect(src).toContain('Governed batch cost run unavailable.');
  });

  it('TerraLevyDashboard stays on live levy services and does not import DemoDataBanner', () => {
    const src = readSrc('applications/terra-levy/TerraLevyDashboard.tsx');
    expect(src).not.toContain('DemoDataBanner');
    expect(src).toContain('getLevyDashboardSummary');
    expect(src).toContain('getLevyDashboardMetrics');
    expect(src).toContain('getLevyDistrictOverview');
    expect(src).toContain('getBudgetScenarios');
    expect(src).toContain('getBudgetVisualization');
    expect(src).toContain('getDataQualityRecommendations');
    expect(src).toContain('getDistrictRiskScores');
  });

  it('StatisticsStudio stays on live/store-backed paths without DemoDataBanner dead code', () => {
    const src = readSrc('pages/forge/statistics/StatisticsStudio.tsx');
    expect(src).not.toContain('DemoDataBanner');
    expect(src).not.toContain('isFixture');
    expect(src).toContain('useForgeStatisticsStore');
    expect(src).toContain('apiFetch(`/terraforge/ratio-study/trends?taxYear=${taxYear}`)');
  });

  it('SegmentDiscoveryDashboard renders explicit unavailable state instead of DemoDataBanner', () => {
    const src = readSrc('pages/forge/calibration/SegmentDiscoveryDashboard.tsx');
    expect(src).toContain('segment-discovery-unavailable');
    expect(src).toContain('Segment discovery unavailable.');
    expect(src).not.toContain('DemoDataBanner');
  });

  it('GeoEquityDashboard renders explicit unavailable state instead of DemoDataBanner', () => {
    const src = readSrc('pages/atlas/GeoEquityDashboard.tsx');
    expect(src).toContain('geo-equity-unavailable');
    expect(src).toContain('GeoEquityReadState');
    expect(src).not.toContain('DemoDataBanner');
    expect(src).not.toContain('isFixture');
    expect(src).toContain('getGeoEquityAreas(25)');
  });

  it('ManagementDashboard does not import DemoDataBanner and uses explicit unavailable states', () => {
    const src = readSrc('pages/dais/ManagementDashboard.tsx');
    expect(src).not.toContain('DemoDataBanner');
    expect(src).not.toContain('isFixture');
    expect(src).toContain('WorkbenchSourceBadge');
    expect(src).toContain('Certification deadlines unavailable.');
  });
});

// ============================================================================
// Gate 2 — isFixture / governed-unavailable provenance tracking
// ============================================================================

describe('Gate 2 — provenance tracking: hooks and components expose data origin', () => {
  it('useTodaysWork tracks explicit live and unavailable read states', () => {
    const src = readSrc('hooks/useTodaysWork.ts');
    expect(src).toContain('readState: TodaysWorkReadState');
    expect(src).toContain("setReadState('live')");
    expect(src).toContain("setReadState('unavailable')");
    expect(src).toContain('getQueueItems({ throwOnError: true })');
    expect(src).not.toContain('isSampleData');
    expect(src).not.toContain('SAMPLE_TASKS');
  });

  it('useBudgetData exposes an explicit live-data gap without sample fallback state', () => {
    const src = readSrc('applications/terra-levy/hooks/useBudgetData.ts');
    expect(src).toContain('/levy/dashboard/summary');
    expect(src).toContain('/levy/budget/scenarios');
    expect(src).toContain('/levy/budget/visualization');
    expect(src).toContain('Live levy budget endpoints returned no certified budget-category data.');
    expect(src).not.toContain('isSampleData');
  });

  it('SegmentDiscoveryDashboard tracks explicit read state', () => {
    const src = readSrc('pages/forge/calibration/SegmentDiscoveryDashboard.tsx');
    expect(src).toContain('SegmentDiscoveryReadState');
    expect(src).toContain("setReadState('live')");
    expect(src).toContain("setReadState('unavailable')");
  });

  it('GeoEquityDashboard tracks explicit live and unavailable read state', () => {
    const src = readSrc('pages/atlas/GeoEquityDashboard.tsx');
    expect(src).toContain('GeoEquityReadState');
    expect(src).toContain("setReadState('loading')");
    expect(src).toContain("setReadState('live')");
    expect(src).toContain("setReadState('unavailable')");
    expect(src).not.toContain('isFixture');
  });

  it('ManagementDashboard tracks explicit live read state instead of isFixture', () => {
    const src = readSrc('pages/dais/ManagementDashboard.tsx');
    expect(src).toContain('readState');
    expect(src).toContain('certification: false');
    expect(src).not.toContain('isFixture');
  });

  it('BatchCostRun exposes explicit governed blockers instead of a fake apply gate', () => {
    const src = readSrc('pages/forge/batch/BatchCostRun.tsx');
    expect(src).toContain("lane: 'Preview Engine'");
    expect(src).toContain("lane: 'Apply Endpoint'");
    expect(src).toContain("lane: 'Run History'");
    expect(src).not.toContain('BACKEND_APPLY_CAPABLE');
  });

  it('queueService has throwOnError for provenance propagation (W5C)', () => {
    const src = readSrc('services/suites/queueService.ts');
    expect(src).toContain('QueueReadOptions');
    expect(src).toContain('throwOnError');
  });

  it('StageZeroState renders explicit unavailable text instead of DemoDataBanner', () => {
    const src = readSrc('shell/desktop/StageZeroState.tsx');
    expect(src).not.toContain('DemoDataBanner');
    expect(src).not.toContain('isSampleData');
    expect(src).toContain("Today's work unavailable from TerraDais.");
  });
});

// ============================================================================
// Gate 3 — Workbench route-collapse: all suite tabs lazy + routed
// ============================================================================

describe('Gate 3 — Workbench route-collapse: parcel-context tabs', () => {
  const router = readSrc('Router.tsx');

  const WORKBENCH_TABS = [
    { name: 'PropertySummary', path: 'workbench/tabs/PropertySummary' },
    { name: 'PropertyForge', path: 'workbench/tabs/PropertyForge' },
    { name: 'PropertyAtlas', path: 'workbench/tabs/PropertyAtlas' },
    { name: 'PropertyDais', path: 'workbench/tabs/PropertyDais' },
    { name: 'PropertyDossier', path: 'workbench/tabs/PropertyDossier' },
    { name: 'PropertyPilot', path: 'workbench/tabs/PropertyPilot' },
    { name: 'PropertyClerk', path: 'workbench/tabs/PropertyClerk' },
    { name: 'PropertyTreasury', path: 'workbench/tabs/PropertyTreasury' },
    { name: 'PropertyAudit', path: 'workbench/tabs/PropertyAudit' },
  ];

  for (const tab of WORKBENCH_TABS) {
    it(`lazy-loads ${tab.name}`, () => {
      expect(router).toContain(`import('./pages/${tab.path}')`);
    });

    it(`${tab.name} file exists`, () => {
      expect(srcExists(`pages/${tab.path}.tsx`)).toBe(true);
    });
  }

  it('PropertyWorkbench is the parent route at /property/:parcelId', () => {
    expect(router).toContain("path='property/:parcelId'");
    expect(router).toContain('element={<PropertyWorkbench />}');
  });

  it('PropertySummary is the index route', () => {
    expect(router).toMatch(/<Route\s+index\s+element=\{<PropertySummary\s*\/>\}/);
  });
});

// ============================================================================
// Gate 4 — Standalone suite routes: constitutional routes wired
// ============================================================================

describe('Gate 4 — standalone suite home routes', () => {
  const router = readSrc('Router.tsx');

  const SUITE_ROUTES = [
    { publicPath: '/forge', sourcePath: 'forge', component: 'ForgeHome', importPath: 'suites/ForgeSuiteHome' },
    { publicPath: '/atlas', sourcePath: 'atlas', component: 'AtlasHome', importPath: 'suites/AtlasSuiteHome' },
    { publicPath: '/dais', sourcePath: 'dais', component: 'DaisHome', importPath: 'suites/DaisSuiteHome' },
    { publicPath: '/dossier', sourcePath: 'dossier', component: 'DossierHome', importPath: 'suites/DossierSuiteHome' },
    { publicPath: '/gpt', sourcePath: 'gpt', component: 'GptHome', importPath: 'suites/GptSuiteHome' },
  ];

  for (const route of SUITE_ROUTES) {
    it(`${route.publicPath} route exists with ${route.component}`, () => {
      expect(router).toContain(`path='${route.sourcePath}'`);
      expect(router).toContain(`element={<${route.component} />}`);
    });

    it(`${route.component} lazy import resolves to real file`, () => {
      expect(router).toContain(`import('./pages/${route.importPath}')`);
      expect(srcExists(`pages/${route.importPath}.tsx`)).toBe(true);
    });
  }

  const OS_ROUTES = [
    { publicPath: '/pilot', sourcePath: 'pilot', component: 'PilotHome', importPath: 'pages/PilotHome' },
    { publicPath: '/trace', sourcePath: 'trace', component: 'TraceHome', importPath: 'pages/TraceHome' },
    { publicPath: '/canon', sourcePath: 'canon', component: 'CanonHome', importPath: 'pages/CanonHome' },
  ];

  for (const route of OS_ROUTES) {
    it(`${route.publicPath} OS route exists`, () => {
      expect(router).toContain(`path='${route.sourcePath}'`);
      expect(router).toContain(`element={<${route.component} />}`);
    });

    it(`${route.component} file exists`, () => {
      expect(srcExists(`${route.importPath}.tsx`)).toBe(true);
    });
  }
});

describe('Gate 4A — /gpt bounded workspace host', () => {
  const src = readSrc('pages/suites/GptSuiteHome.tsx');

  it('hosts GPTManagementDashboard directly inside /gpt', () => {
    expect(src).toContain('GPTManagementDashboard');
  });

  it('hosts RAGDatasetManager directly inside /gpt', () => {
    expect(src).toContain('RAGDatasetManager');
  });

  it('defines a bounded workspace panel test landmark', () => {
    expect(src).toContain('data-testid="gpt-workspace-panel"');
    expect(src).toContain('data-testid="gpt-workspace-nav"');
  });

  it('does not use SuiteModuleGrid launch cards for /gpt', () => {
    expect(src).not.toContain('SuiteModuleGrid');
  });

  it('does not send /gpt modules through the pilot workbench tab', () => {
    expect(src).not.toContain("launchMode: 'workbench'");
    expect(src).not.toContain("workbenchTab: 'pilot'");
  });
});

// ============================================================================
// Gate 5 — No undisclosed fixture surfaces in governed forge pages
// ============================================================================

describe('Gate 5 — no fake surfaces: governed pages disclose fixture status', () => {
  it('CostManual uses the live schedule API with explicit unavailable state', () => {
    const src = readSrc('pages/forge/cost/CostManual.tsx');
    expect(src).toContain('getCostSchedule');
    expect(src).not.toContain('SAMPLE_COST_SCHEDULES');
    expect(src).not.toContain('DemoDataBanner');
    expect(src).toContain('readState === \'unavailable\'');
  });

  it('BatchCostRun no longer uses fixture history or demo disclosure', () => {
    const src = readSrc('pages/forge/batch/BatchCostRun.tsx');
    expect(src).not.toContain('FIXTURE_HISTORY');
    expect(src).not.toContain('DemoDataBanner');
    expect(src).toContain('Governed batch engine unavailable');
  });

  it('no governed forge page has stray console.log (debug noise)', () => {
    const forgePages = [
      'pages/forge/cost/CostManual.tsx',
      'pages/forge/market/NeighborhoodTrendsPage.tsx',
      'pages/forge/statistics/StatisticsStudio.tsx',
      'pages/forge/calibration/SegmentDiscoveryDashboard.tsx',
    ];
    for (const page of forgePages) {
      const src = readSrc(page);
      expect(src).not.toContain('console.log');
    }
  });

  it('BatchCostRun does not use console.log in its blocked state', () => {
    const src = readSrc('pages/forge/batch/BatchCostRun.tsx');
    expect(src).not.toContain('console.log');
  });

  it('daisService has no fixture imports (fully real)', () => {
    const src = readSrc('services/suites/daisService.ts');
    expect(src).not.toMatch(/Fixture|FIXTURE|fixture/i);
  });
});

// ============================================================================
// Gate 6 — DemoDataBanner component contract
// ============================================================================

describe('Gate 6 — DemoDataBanner component is governance-correct', () => {
  const src = readSrc('components/governance/DemoDataBanner.tsx');

  it('exports DemoDataBanner component', () => {
    expect(src).toContain('export const DemoDataBanner');
  });

  it('accepts module prop', () => {
    expect(src).toContain('module: string');
  });

  it('has role="status" for accessibility', () => {
    expect(src).toContain('role="status"');
  });

  it('displays non-live warning text with module name interpolation', () => {
    expect(src).toContain('NON-LIVE DATA');
    expect(src).toContain('{module}');
    expect(src).toContain('non-live or simulated data');
    expect(src).toContain('not live county data');
  });

  it('uses warning color (yellow/amber)', () => {
    expect(src).toContain("hsl(var(--tf-warning))");
  });
});

// ============================================================================
// Gate 7 — Sealed wave regression wall (W4A → W5D)
// ============================================================================

describe('Gate 7 — sealed wave regression wall', () => {
  // W4A: statisticsAPI + regressionAPI backend truth
  it('statisticsAPI exports discoverSegments (W4A)', () => {
    const src = readSrc('services/forge/statisticsAPI.ts');
    expect(src).toContain('discoverSegments');
    expect(src).toContain('getToken');
  });

  it('regressionAPI exports getHistory (W4A)', () => {
    const src = readSrc('services/forge/regressionAPI.ts');
    expect(src).toContain('getHistory');
    expect(src).toContain('getToken');
  });

  // W4B: SegmentDiscoveryDashboard disclosure
  it('SegmentDiscoveryDashboard has explicit unavailable disclosure (W4B)', () => {
    const src = readSrc('pages/forge/calibration/SegmentDiscoveryDashboard.tsx');
    expect(src).toContain('segment-discovery-unavailable');
    expect(src).toContain('Segment discovery unavailable.');
    expect(src).not.toContain('DemoDataBanner');
  });

  // W5B: GeoEquityDashboard disclosure
  it('GeoEquityDashboard has explicit unavailable disclosure + live service path + store priming (W5B)', () => {
    const src = readSrc('pages/atlas/GeoEquityDashboard.tsx');
    expect(src).toContain('geo-equity-unavailable');
    expect(src).toContain('GeoEquityReadState');
    expect(src).toContain('getGeoEquityAreas(25)');
    expect(src).not.toContain('DemoDataBanner');
    expect(src).not.toContain('isFixture');
    expect(src).toContain('useAtlasSpatialStore');
  });

  it('NeighborhoodTrendsPage has no console.log (W5B)', () => {
    const src = readSrc('pages/forge/market/NeighborhoodTrendsPage.tsx');
    expect(src).not.toContain('console.log');
  });

  // W5C: Dais wiring honesty
  it('queueService has throwOnError option (W5C)', () => {
    const src = readSrc('services/suites/queueService.ts');
    expect(src).toContain('QueueReadOptions');
    expect(src).toContain('throwOnError');
    const checks = src.match(/options\?\.throwOnError/g);
    expect(checks).not.toBeNull();
    expect(checks!.length).toBeGreaterThanOrEqual(3);
  });

  it('ManagementDashboard passes throwOnError: true (W5C)', () => {
    const src = readSrc('pages/dais/ManagementDashboard.tsx');
    expect(src).toContain('getAppraiserProductivity({ throwOnError: true })');
    expect(src).toContain('getQueueMetrics({ throwOnError: true })');
  });

  // W5D: Honesty sweep
  it('useTodaysWork keeps explicit live/unavailable read state (W5D)', () => {
    const src = readSrc('hooks/useTodaysWork.ts');
    expect(src).toContain("setReadState('live')");
    expect(src).toContain("setReadState('unavailable')");
    expect(src).not.toContain('isSampleData');
  });

  it('useBudgetData keeps explicit live-data gap handling without sample fallback state (W5D)', () => {
    const src = readSrc('applications/terra-levy/hooks/useBudgetData.ts');
    expect(src).toContain('Live levy budget endpoints returned no certified budget-category data.');
    expect(src).not.toContain('isSampleData');
  });

  it('BatchCostRun keeps the explicit unavailable posture (W5D)', () => {
    const src = readSrc('pages/forge/batch/BatchCostRun.tsx');
    expect(src).toContain('Governed batch cost run unavailable.');
    expect(src).toContain("lane: 'Apply Endpoint'");
    expect(src).not.toContain('DemoDataBanner');
  });
});
