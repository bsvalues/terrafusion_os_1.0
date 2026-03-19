/**
 * wave4BackendTruth.contract.test.ts
 *
 * Wave 4A: Backend Truth Slice contract tests.
 *
 * Enforces that:
 *   1. statisticsAPI client exists with auth interceptor and correct base URL
 *   2. forgeStatisticsStore imports statisticsAPI and calls it for strata/outliers/comparison
 *   3. forgeStatisticsStore retains fixture fallback + isFixture disclosure
 *   4. statisticsAPI mirrors regressionAPI auth pattern (getToken + Bearer)
 *   5. No Math.random in stores or API clients
 *   6. W3 contract gates remain intact (regression)
 *
 * Static-analysis tests (file content inspection) — no running backend needed.
 *
 * @module __tests__/auth/wave4BackendTruth.contract.test
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
// Gate 1: statisticsAPI client exists with correct structure
// ============================================================================

describe('Gate 1 — statisticsAPI client exists and has correct structure', () => {
  it('statisticsAPI.ts file exists', () => {
    expect(existsSync(resolve(SRC_ROOT, 'services/forge/statisticsAPI.ts'))).toBe(true);
  });

  const src = readSrc('services/forge/statisticsAPI.ts');

  it('imports getToken from authStorage', () => {
    expect(src).toMatch(/import\s+\{[^}]*getToken[^}]*\}\s+from\s+['"]@\/auth\/authStorage['"]/);
  });

  it('imports getViteEnv from env module', () => {
    expect(src).toMatch(/import\s+\{[^}]*getViteEnv[^}]*\}\s+from\s+['"]@\/env\/getViteEnv['"]/);
  });

  it('targets /api/MassAppraisal base URL', () => {
    expect(src).toContain('/api/MassAppraisal');
  });

  it('attaches Bearer token in interceptor', () => {
    expect(src).toContain('Bearer');
    expect(src).toContain('interceptors.request.use');
  });

  it('exports singleton statisticsAPI', () => {
    expect(src).toMatch(/export\s+(const|let)\s+statisticsAPI/);
  });
});

// ============================================================================
// Gate 2: statisticsAPI exposes strata, outliers, compare, segments methods
// ============================================================================

describe('Gate 2 — statisticsAPI method surface', () => {
  const src = readSrc('services/forge/statisticsAPI.ts');

  it('has getStrata method', () => {
    expect(src).toMatch(/async\s+getStrata/);
  });

  it('has getOutliers method', () => {
    expect(src).toMatch(/async\s+getOutliers/);
  });

  it('has compareModels method', () => {
    expect(src).toMatch(/async\s+compareModels/);
  });

  it('has discoverSegments method', () => {
    expect(src).toMatch(/async\s+discoverSegments/);
  });

  it('calls ratio-study/{modelId}/strata endpoint', () => {
    expect(src).toContain('ratio-study/');
    expect(src).toContain('/strata');
  });

  it('calls ratio-study/{modelId}/outliers endpoint', () => {
    expect(src).toContain('/outliers');
  });

  it('calls /compare endpoint', () => {
    expect(src).toContain('/compare');
  });

  it('calls /segments/ endpoint', () => {
    expect(src).toContain('/segments/');
  });
});

// ============================================================================
// Gate 3: forgeStatisticsStore imports and calls statisticsAPI
// ============================================================================

describe('Gate 3 — forgeStatisticsStore wired to statisticsAPI', () => {
  const src = readSrc('stores/forgeStatisticsStore.ts');

  it('imports statisticsAPI', () => {
    expect(src).toMatch(/import\s+\{[^}]*statisticsAPI[^}]*\}\s+from\s+['"]@\/services\/forge\/statisticsAPI['"]/);
  });

  it('calls statisticsAPI.getOutliers in fetchStudy', () => {
    expect(src).toContain('statisticsAPI.getOutliers');
  });

  it('calls statisticsAPI.getStrata in fetchStudy', () => {
    expect(src).toContain('statisticsAPI.getStrata');
  });

  it('calls statisticsAPI.compareModels in loadComparison', () => {
    expect(src).toContain('statisticsAPI.compareModels');
  });
});

// ============================================================================
// Gate 4: forgeStatisticsStore retains fixture fallback + isFixture disclosure
// ============================================================================

describe('Gate 4 — forgeStatisticsStore fixture fallback preserved', () => {
  const src = readSrc('stores/forgeStatisticsStore.ts');

  it('imports OUTLIER_RECORDS fixture', () => {
    expect(src).toContain('OUTLIER_RECORDS');
  });

  it('imports STRATA_RESULTS fixture', () => {
    expect(src).toContain('STRATA_RESULTS');
  });

  it('imports MODEL_COMPARISON fixture', () => {
    expect(src).toContain('MODEL_COMPARISON');
  });

  it('tracks isFixture state for outliers', () => {
    expect(src).toMatch(/isFixture.*outliers|outliers.*isFixture/s);
  });

  it('tracks isFixture state for strata', () => {
    expect(src).toMatch(/isFixture.*strata|strata.*isFixture/s);
  });

  it('tracks isFixture state for comparison', () => {
    expect(src).toMatch(/isFixture.*comparison|comparison.*isFixture/s);
  });
});

// ============================================================================
// Gate 5: No Math.random in stores or API clients
// ============================================================================

describe('Gate 5 — no Math.random in stores or API clients', () => {
  it('forgeStatisticsStore has no Math.random', () => {
    const src = readSrc('stores/forgeStatisticsStore.ts');
    expect(src).not.toContain('Math.random');
  });

  it('statisticsAPI has no Math.random', () => {
    const src = readSrc('services/forge/statisticsAPI.ts');
    expect(src).not.toContain('Math.random');
  });

  it('regressionAPI has no Math.random', () => {
    const src = readSrc('services/forge/regressionAPI.ts');
    expect(src).not.toContain('Math.random');
  });

  it('forgeRegressionStore has no Math.random', () => {
    const src = readSrc('stores/forgeRegressionStore.ts');
    expect(src).not.toContain('Math.random');
  });
});

// ============================================================================
// Gate 6: W3 regression gates still pass
// ============================================================================

describe('Gate 6 — W3 regressionAPI contract preserved', () => {
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
