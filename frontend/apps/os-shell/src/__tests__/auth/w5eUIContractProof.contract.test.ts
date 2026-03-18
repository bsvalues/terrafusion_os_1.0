/**
 * W5E — UI Contract Proof Pass
 *
 * Static source-file inspection (no rendering, no mocking).
 * PROOF-HEAVY, NOT ARCHITECTURE-HEAVY.
 *
 * This is the regression wall for all disclosure, route-collapse, and
 * surface-honesty contracts established across W4A → W5D.
 *
 * Gate 1: DemoDataBanner inventory — every governed surface that uses
 *         fixture data must import and render DemoDataBanner
 * Gate 2: isFixture / isSampleData provenance tracking — every API-first
 *         component must track data origin
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
// Gate 1 — DemoDataBanner inventory (7 governed surfaces)
// ============================================================================

describe('Gate 1 — DemoDataBanner inventory: every fixture surface discloses', () => {
  it('CostManual renders DemoDataBanner unconditionally', () => {
    const src = readSrc('pages/forge/cost/CostManual.tsx');
    expect(src).toContain('DemoDataBanner');
    expect(src).toContain('module="Cost Manual"');
  });

  it('BatchCostRun renders DemoDataBanner unconditionally', () => {
    const src = readSrc('pages/forge/batch/BatchCostRun.tsx');
    expect(src).toContain('DemoDataBanner');
    expect(src).toContain('module="Batch Cost Run"');
  });

  it('TerraLevyDashboard renders DemoDataBanner unconditionally', () => {
    const src = readSrc('applications/terra-levy/TerraLevyDashboard.tsx');
    expect(src).toContain('DemoDataBanner');
    expect(src).toContain('module="TerraLevy"');
  });

  it('StatisticsStudio renders DemoDataBanner conditionally on isFixture', () => {
    const src = readSrc('pages/forge/statistics/StatisticsStudio.tsx');
    expect(src).toContain('DemoDataBanner');
    expect(src).toMatch(/isFixture.*&&.*DemoDataBanner|DemoDataBanner.*isFixture/s);
  });

  it('SegmentDiscoveryDashboard renders DemoDataBanner on isFixture', () => {
    const src = readSrc('pages/forge/calibration/SegmentDiscoveryDashboard.tsx');
    expect(src).toContain('DemoDataBanner');
    expect(src).toContain('isFixture');
    expect(src).toContain('module="Segment Discovery"');
  });

  it('GeoEquityDashboard renders DemoDataBanner on isFixture', () => {
    const src = readSrc('pages/atlas/GeoEquityDashboard.tsx');
    expect(src).toContain('DemoDataBanner');
    expect(src).toContain('isFixture');
    expect(src).toContain('module="GeoEquity"');
  });

  it('ManagementDashboard renders DemoDataBanner on isFixture', () => {
    const src = readSrc('pages/dais/ManagementDashboard.tsx');
    expect(src).toContain('DemoDataBanner');
    expect(src).toContain('isFixture');
    expect(src).toContain('module="Management Dashboard"');
  });
});

// ============================================================================
// Gate 2 — isFixture / isSampleData provenance tracking
// ============================================================================

describe('Gate 2 — provenance tracking: hooks and components expose data origin', () => {
  it('useTodaysWork returns isSampleData: true', () => {
    const src = readSrc('hooks/useTodaysWork.ts');
    expect(src).toMatch(/isSampleData:\s*true/);
    expect(src).toContain('SAMPLE_TASKS');
  });

  it('useBudgetData returns isSampleData: true', () => {
    const src = readSrc('applications/terra-levy/hooks/useBudgetData.ts');
    expect(src).toMatch(/isSampleData:\s*true/);
  });

  it('SegmentDiscoveryDashboard tracks isFixture state', () => {
    const src = readSrc('pages/forge/calibration/SegmentDiscoveryDashboard.tsx');
    expect(src).toContain('isFixture');
    expect(src).toContain('setIsFixture');
  });

  it('GeoEquityDashboard tracks isFixture state', () => {
    const src = readSrc('pages/atlas/GeoEquityDashboard.tsx');
    expect(src).toContain('isFixture');
    expect(src).toContain('setIsFixture');
  });

  it('ManagementDashboard tracks isFixture state', () => {
    const src = readSrc('pages/dais/ManagementDashboard.tsx');
    expect(src).toContain('isFixture');
    expect(src).toContain('setIsFixture');
  });

  it('BatchCostRun tracks BACKEND_APPLY_CAPABLE gate', () => {
    const src = readSrc('pages/forge/batch/BatchCostRun.tsx');
    expect(src).toMatch(/BACKEND_APPLY_CAPABLE\s*=\s*false/);
    expect(src).toContain('ForgeApplyMode');
  });

  it('queueService has throwOnError for provenance propagation (W5C)', () => {
    const src = readSrc('services/suites/queueService.ts');
    expect(src).toContain('QueueReadOptions');
    expect(src).toContain('throwOnError');
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
    expect(router).toContain("path='/property/:parcelId'");
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
    { path: '/forge', component: 'ForgeHome', importPath: 'suites/ForgeSuiteHome' },
    { path: '/atlas', component: 'AtlasHome', importPath: 'suites/AtlasSuiteHome' },
    { path: '/dais', component: 'DaisHome', importPath: 'suites/DaisSuiteHome' },
    { path: '/dossier', component: 'DossierHome', importPath: 'suites/DossierSuiteHome' },
    { path: '/gpt', component: 'GptHome', importPath: 'suites/GptSuiteHome' },
  ];

  for (const route of SUITE_ROUTES) {
    it(`${route.path} route exists with ${route.component}`, () => {
      expect(router).toContain(`path='${route.path}'`);
      expect(router).toContain(`element={<${route.component} />}`);
    });

    it(`${route.component} lazy import resolves to real file`, () => {
      expect(router).toContain(`import('./pages/${route.importPath}')`);
      expect(srcExists(`pages/${route.importPath}.tsx`)).toBe(true);
    });
  }

  const OS_ROUTES = [
    { path: '/pilot', component: 'PilotHome', importPath: 'pages/PilotHome' },
    { path: '/trace', component: 'TraceHome', importPath: 'pages/TraceHome' },
    { path: '/canon', component: 'CanonHome', importPath: 'pages/CanonHome' },
  ];

  for (const route of OS_ROUTES) {
    it(`${route.path} OS route exists`, () => {
      expect(router).toContain(`path='${route.path}'`);
      expect(router).toContain(`element={<${route.component} />}`);
    });

    it(`${route.component} file exists`, () => {
      expect(srcExists(`${route.importPath}.tsx`)).toBe(true);
    });
  }
});

// ============================================================================
// Gate 5 — No undisclosed fixture surfaces in governed forge pages
// ============================================================================

describe('Gate 5 — no fake surfaces: governed pages disclose fixture status', () => {
  it('CostManual uses SAMPLE_ prefix for fixture data', () => {
    const src = readSrc('pages/forge/cost/CostManual.tsx');
    expect(src).toContain('SAMPLE_COST_SCHEDULES');
    expect(src).not.toContain('fetch(');
  });

  it('BatchCostRun uses FIXTURE_ prefix for history data', () => {
    const src = readSrc('pages/forge/batch/BatchCostRun.tsx');
    expect(src).toContain('FIXTURE_HISTORY');
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

  it('BatchCostRun uses console.info for audit (not console.log)', () => {
    const src = readSrc('pages/forge/batch/BatchCostRun.tsx');
    expect(src).toContain('console.info');
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

  it('displays warning text with module name interpolation', () => {
    expect(src).toContain('DEMO DATA');
    expect(src).toContain('{module}');
    expect(src).toContain('sample fixtures');
    expect(src).toContain('not live county data');
  });

  it('uses warning color (yellow/amber)', () => {
    expect(src).toContain('234, 179, 8');
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
  it('SegmentDiscoveryDashboard has DemoDataBanner + isFixture (W4B)', () => {
    const src = readSrc('pages/forge/calibration/SegmentDiscoveryDashboard.tsx');
    expect(src).toContain('DemoDataBanner');
    expect(src).toContain('isFixture');
  });

  // W5B: GeoEquityDashboard disclosure
  it('GeoEquityDashboard has DemoDataBanner + isFixture + store (W5B)', () => {
    const src = readSrc('pages/atlas/GeoEquityDashboard.tsx');
    expect(src).toContain('DemoDataBanner');
    expect(src).toContain('isFixture');
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
  it('useTodaysWork returns isSampleData: true (W5D)', () => {
    const src = readSrc('hooks/useTodaysWork.ts');
    expect(src).toMatch(/isSampleData:\s*true/);
  });

  it('useBudgetData returns isSampleData: true (W5D)', () => {
    const src = readSrc('applications/terra-levy/hooks/useBudgetData.ts');
    expect(src).toMatch(/isSampleData:\s*true/);
  });

  it('BatchCostRun has DemoDataBanner + BACKEND_APPLY_CAPABLE (W5D)', () => {
    const src = readSrc('pages/forge/batch/BatchCostRun.tsx');
    expect(src).toContain('DemoDataBanner');
    expect(src).toMatch(/BACKEND_APPLY_CAPABLE\s*=\s*false/);
  });
});
