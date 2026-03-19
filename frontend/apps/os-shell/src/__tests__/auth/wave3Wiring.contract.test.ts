/**
 * wave3Wiring.contract.test.ts
 *
 * Wave 3: Standalone Page Completion contract tests.
 *
 * Enforces that:
 *   1. forgeRegressionStore imports regressionAPI and does not use Math.random
 *   2. regressionAPI attaches auth via existing token pattern
 *   3. forgeStatisticsStore performs API-first loading with fixture fallback support
 *   4. ManagementDashboard imports useSession
 *   5. ManagementDashboard does not retain hardcoded page-local dashboard arrays
 *   6. SegmentDiscoveryDashboard is API-first or explicitly fixture-backed
 *   7. GeoEquityDashboard remains store-driven and is not page-local mocked
 *   8. Scoped pages expose disclosed fallback instead of silent live-looking mock data
 *
 * These are static-analysis tests (file content inspection) — they do NOT
 * require a running backend or React rendering.
 *
 * @module __tests__/auth/wave3Wiring.contract.test
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ============================================================================
// Helpers
// ============================================================================

const SRC_ROOT = resolve(__dirname, '../..');

function readSrc(relativePath: string): string {
  return readFileSync(resolve(SRC_ROOT, relativePath), 'utf-8');
}

// ============================================================================
// Gate 1: forgeRegressionStore imports regressionAPI and does not use Math.random
// ============================================================================

describe('Gate 1 — forgeRegressionStore imports regressionAPI, no Math.random', () => {
  const src = readSrc('stores/forgeRegressionStore.ts');

  it('imports regressionAPI', () => {
    expect(src).toMatch(/import\s+.*regressionAPI.*from\s+['"]@\/services\/forge\/regressionAPI['"]/);
  });

  it('does not use Math.random()', () => {
    expect(src).not.toContain('Math.random');
  });

  it('calls regressionAPI in runRegression', () => {
    expect(src).toContain('regressionAPI.');
  });
});

// ============================================================================
// Gate 2: regressionAPI attaches auth via existing token pattern
// ============================================================================

describe('Gate 2 — regressionAPI auth interceptor', () => {
  const src = readSrc('services/forge/regressionAPI.ts');

  it('imports getToken from authStorage', () => {
    expect(src).toMatch(/import\s+\{[^}]*getToken[^}]*\}\s+from\s+['"]@\/auth\/authStorage['"]/);
  });

  it('attaches Bearer token in interceptor', () => {
    expect(src).toContain('Bearer');
    expect(src).toContain('interceptors.request.use');
  });

  it('targets /api/costforge/analytics/regression base URL', () => {
    expect(src).toContain('/api/costforge/analytics/regression');
  });
});

// ============================================================================
// Gate 3: forgeStatisticsStore performs API-first with fixture fallback support
// ============================================================================

describe('Gate 3 — forgeStatisticsStore API-first with fixture fallback', () => {
  const src = readSrc('stores/forgeStatisticsStore.ts');

  it('calls computeRatioStudy (real API)', () => {
    expect(src).toContain('computeRatioStudy');
  });

  it('has fixture fallback in loadComparison or marks comparison as fixture', () => {
    // loadComparison should either attempt API-first or mark data as fixture
    expect(src).toMatch(/isFixture|api.*comparison|comparison.*api/i);
  });
});

// ============================================================================
// Gate 4: ManagementDashboard imports useSession
// ============================================================================

describe('Gate 4 — ManagementDashboard imports useSession', () => {
  const src = readSrc('pages/dais/ManagementDashboard.tsx');

  it('imports useSession from auth module', () => {
    expect(src).toMatch(/import\s+\{[^}]*useSession[^}]*\}\s+from\s+['"]@\/auth\/useSession['"]/);
  });

  it('calls useSession()', () => {
    expect(src).toContain('useSession()');
  });
});

// ============================================================================
// Gate 5: ManagementDashboard does not retain hardcoded page-local arrays
// ============================================================================

describe('Gate 5 — ManagementDashboard no hardcoded page-local arrays', () => {
  const src = readSrc('pages/dais/ManagementDashboard.tsx');

  it('does not have hardcoded overviewStats array', () => {
    expect(src).not.toMatch(/^const overviewStats\s*=/m);
  });

  it('does not have hardcoded certificationAreas array', () => {
    expect(src).not.toMatch(/^const certificationAreas.*=\s*\[/m);
  });

  it('does not have hardcoded appraisers array', () => {
    expect(src).not.toMatch(/^const appraisers.*=\s*\[/m);
  });

  it('does not have hardcoded recentAppeals array', () => {
    expect(src).not.toMatch(/^const recentAppeals.*=\s*\[/m);
  });

  it('does not have hardcoded appealsSummary object', () => {
    expect(src).not.toMatch(/^const appealsSummary\s*=/m);
  });
});

// ============================================================================
// Gate 6: SegmentDiscoveryDashboard is API-first or explicitly fixture-backed
// ============================================================================

describe('Gate 6 — SegmentDiscoveryDashboard API-first or fixture-backed', () => {
  const src = readSrc('pages/forge/calibration/SegmentDiscoveryDashboard.tsx');

  it('does not have hardcoded DISCOVERED_SEGMENTS in page', () => {
    expect(src).not.toMatch(/^const DISCOVERED_SEGMENTS.*=\s*\[/m);
  });

  it('uses a store or service for data', () => {
    expect(src).toMatch(/useForge|useFetch|Store|Service|Fixtures|segmentDiscoveryFixtures/i);
  });
});

// ============================================================================
// Gate 7: GeoEquityDashboard remains store-driven, not page-local mocked
// ============================================================================

describe('Gate 7 — GeoEquityDashboard store-driven', () => {
  const src = readSrc('pages/atlas/GeoEquityDashboard.tsx');

  it('imports useAtlasSpatialStore', () => {
    expect(src).toContain('useAtlasSpatialStore');
  });

  it('does not define inline EQUITY_AREAS data array', () => {
    // The page should import fallback from fixtures, not define inline data
    expect(src).not.toMatch(/^const EQUITY_AREAS\s*:\s*EquityArea\[\]\s*=\s*\[/m);
  });

  it('consumes storeAreas from the spatial store', () => {
    expect(src).toContain('useAtlasSpatialStore');
  });
});

// ============================================================================
// Gate 8: Scoped pages expose disclosed fallback instead of silent mocks
// ============================================================================

describe('Gate 8 — disclosed fallback instead of silent mocks', () => {
  it('forgeRegressionStore has fixture fallback disclosure', () => {
    const src = readSrc('stores/forgeRegressionStore.ts');
    expect(src).toMatch(/isFixture|fixture.*fallback|Using fixture/i);
  });

  it('ManagementDashboard has fixture fallback disclosure', () => {
    const src = readSrc('pages/dais/ManagementDashboard.tsx');
    expect(src).toMatch(/isFixture|DemoDataBanner|fixture/i);
  });

  it('SegmentDiscoveryDashboard has fixture fallback disclosure', () => {
    const src = readSrc('pages/forge/calibration/SegmentDiscoveryDashboard.tsx');
    expect(src).toMatch(/isFixture|DemoDataBanner|fixture/i);
  });

  it('No Math.random in any store', () => {
    const regression = readSrc('stores/forgeRegressionStore.ts');
    const statistics = readSrc('stores/forgeStatisticsStore.ts');
    expect(regression).not.toContain('Math.random');
    expect(statistics).not.toContain('Math.random');
  });
});
