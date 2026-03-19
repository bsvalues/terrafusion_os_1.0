/**
 * w4bSegmentDiscovery.contract.test.ts
 *
 * Wave 4B: Segment Discovery Truth contract tests.
 *
 * Enforces that:
 *   1. SegmentDiscoveryDashboard loads from backend service instead of page-local fixtures
 *   2. SegmentDiscoveryDashboard preserves disclosed empty-state behavior
 *   3. No Math.random or ML clustering logic is introduced
 *   4. W4A contract suite remains green (regression)
 *   5. W3 contract suite remains green (regression)
 *
 * Static-analysis tests (file content inspection) — no running backend needed.
 *
 * @module __tests__/auth/w4bSegmentDiscovery.contract.test
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// ============================================================================
// Helpers
// ============================================================================

const SRC_ROOT = resolve(__dirname, '../..');

function readSrc(relativePath: string): string {
  return readFileSync(resolve(SRC_ROOT, relativePath), 'utf-8');
}

// ============================================================================
// Gate 1: SegmentDiscoveryDashboard loads from backend service
// ============================================================================

describe('Gate 1 — SegmentDiscoveryDashboard loads from backend service', () => {
  const src = readSrc('pages/forge/calibration/SegmentDiscoveryDashboard.tsx');

  it('imports statisticsAPI or calls a backend discovery method', () => {
    expect(src).toMatch(/statisticsAPI|discoverSegments/);
  });

  it('calls discoverSegments at runtime (useEffect or equivalent)', () => {
    expect(src).toContain('discoverSegments');
  });

  it('has useEffect to trigger fetch on mount', () => {
    expect(src).toContain('useEffect');
  });

  it('still imports DiscoveredSegment type (for type safety)', () => {
    expect(src).toMatch(/DiscoveredSegment/);
  });
});

// ============================================================================
// Gate 2: SegmentDiscoveryDashboard preserves disclosed empty-state
// ============================================================================

describe('Gate 2 — SegmentDiscoveryDashboard empty-state and disclosure', () => {
  const src = readSrc('pages/forge/calibration/SegmentDiscoveryDashboard.tsx');

  it('has DemoDataBanner for fixture disclosure', () => {
    expect(src).toContain('DemoDataBanner');
  });

  it('tracks isFixture state for disclosure', () => {
    expect(src).toContain('isFixture');
  });

  it('retains fixture import as fallback', () => {
    expect(src).toMatch(/DISCOVERED_SEGMENTS_FIXTURE|segmentDiscoveryFixtures/);
  });

  it('handles empty segments array gracefully', () => {
    // Must have conditional rendering or empty-state message
    expect(src).toMatch(/segments\.length|No.*segment|empty/i);
  });
});

// ============================================================================
// Gate 3: No Math.random or ML clustering logic
// ============================================================================

describe('Gate 3 — no Math.random or ML clustering logic', () => {
  it('SegmentDiscoveryDashboard has no Math.random', () => {
    const src = readSrc('pages/forge/calibration/SegmentDiscoveryDashboard.tsx');
    expect(src).not.toContain('Math.random');
  });

  it('SegmentDiscoveryDashboard has no k-means', () => {
    const src = readSrc('pages/forge/calibration/SegmentDiscoveryDashboard.tsx');
    expect(src).not.toMatch(/kmeans|k-means|kMeans/i);
  });

  it('statisticsAPI has no Math.random', () => {
    const src = readSrc('services/forge/statisticsAPI.ts');
    expect(src).not.toContain('Math.random');
  });
});

// ============================================================================
// Gate 4: W4A contract suite remains green (regression)
// ============================================================================

describe('Gate 4 — W4A regression: statisticsAPI contract preserved', () => {
  it('statisticsAPI.ts still exists', () => {
    expect(existsSync(resolve(SRC_ROOT, 'services/forge/statisticsAPI.ts'))).toBe(true);
  });

  const src = readSrc('services/forge/statisticsAPI.ts');

  it('statisticsAPI still has discoverSegments method', () => {
    expect(src).toMatch(/async\s+discoverSegments/);
  });

  it('statisticsAPI still has getStrata method', () => {
    expect(src).toMatch(/async\s+getStrata/);
  });

  it('statisticsAPI still has getOutliers method', () => {
    expect(src).toMatch(/async\s+getOutliers/);
  });

  it('statisticsAPI still has compareModels method', () => {
    expect(src).toMatch(/async\s+compareModels/);
  });

  it('forgeStatisticsStore still imports statisticsAPI', () => {
    const storeSrc = readSrc('stores/forgeStatisticsStore.ts');
    expect(storeSrc).toMatch(/import\s+\{[^}]*statisticsAPI[^}]*\}\s+from\s+['"]@\/services\/forge\/statisticsAPI['"]/);
  });
});

// ============================================================================
// Gate 5: W3 regression: regressionAPI contract preserved
// ============================================================================

describe('Gate 5 — W3 regression: regressionAPI contract preserved', () => {
  const src = readSrc('services/forge/regressionAPI.ts');

  it('regressionAPI still imports getToken', () => {
    expect(src).toMatch(/import\s+\{[^}]*getToken[^}]*\}\s+from\s+['"]@\/auth\/authStorage['"]/);
  });

  it('regressionAPI still targets /api/costforge/analytics/regression', () => {
    expect(src).toContain('/api/costforge/analytics/regression');
  });

  it('regressionAPI still attaches Bearer token', () => {
    expect(src).toContain('Bearer');
  });
});
