/**
 * W5B — GeoEquityDashboard Fixture Disclosure Contract Tests
 *
 * Static source-file inspection (no rendering, no mocking).
 * Verifies that GeoEquityDashboard follows the W4B disclosure pattern:
 *   - API-first via store (useAtlasSpatialStore.fetchSpatialData)
 *   - isFixture state flag tracks data origin
 *   - DemoDataBanner renders when fixture fallback is active
 *   - No debug console.log in governed forge pages
 *
 * Also runs regression checks against sealed waves.
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const SRC_ROOT = path.resolve(__dirname, '../..');

function readSrc(relPath: string): string {
  return fs.readFileSync(path.join(SRC_ROOT, relPath), 'utf-8');
}

// ============================================================================
// Gate 1 — GeoEquityDashboard imports store + DemoDataBanner + has useEffect
// ============================================================================

describe('Gate 1 — GeoEquityDashboard API-first wiring', () => {
  const src = readSrc('pages/atlas/GeoEquityDashboard.tsx');

  it('imports useAtlasSpatialStore', () => {
    expect(src).toContain('useAtlasSpatialStore');
  });

  it('imports DemoDataBanner from governance', () => {
    expect(src).toContain("from '@/components/governance/DemoDataBanner'");
  });

  it('imports useEffect', () => {
    expect(src).toMatch(/import\s*\{[^}]*useEffect[^}]*\}\s*from\s*'react'/);
  });

  it('calls fetchSpatialData in useEffect', () => {
    expect(src).toContain('fetchSpatialData');
    expect(src).toContain('useEffect');
  });

  it('reads equityAreas from store', () => {
    expect(src).toContain('s.equityAreas');
  });
});

// ============================================================================
// Gate 2 — isFixture flag + DemoDataBanner conditional + fixture fallback
// ============================================================================

describe('Gate 2 — fixture disclosure contract', () => {
  const src = readSrc('pages/atlas/GeoEquityDashboard.tsx');

  it('declares isFixture state', () => {
    expect(src).toContain('isFixture');
    expect(src).toMatch(/useState.*false/);
  });

  it('renders DemoDataBanner conditionally on isFixture', () => {
    expect(src).toMatch(/isFixture\s*&&\s*<DemoDataBanner/);
  });

  it('passes module="GeoEquity" to DemoDataBanner', () => {
    expect(src).toContain('module="GeoEquity"');
  });

  it('imports fixture fallback from atlasSpatialFixtures', () => {
    expect(src).toContain('FALLBACK_EQUITY_AREAS');
    expect(src).toContain('atlasSpatialFixtures');
  });

  it('uses store-first fallback pattern', () => {
    // storeAreas.length > 0 ? storeAreas : FALLBACK_EQUITY_AREAS
    expect(src).toMatch(/storeAreas\.length\s*>\s*0/);
    expect(src).toContain('FALLBACK_EQUITY_AREAS');
  });
});

// ============================================================================
// Gate 3 — No debug console.log in governed forge market pages
// ============================================================================

describe('Gate 3 — no debug console.log in governed pages', () => {
  it('NeighborhoodTrendsPage has no console.log', () => {
    const src = readSrc('pages/forge/market/NeighborhoodTrendsPage.tsx');
    expect(src).not.toContain('console.log');
  });

  it('GeoEquityDashboard has no console.log', () => {
    const src = readSrc('pages/atlas/GeoEquityDashboard.tsx');
    expect(src).not.toContain('console.log');
  });
});

// ============================================================================
// Gate 4 — W3 regression: store-driven gate preserved
// ============================================================================

describe('Gate 4 — W3 regression (store-driven gate)', () => {
  const src = readSrc('pages/atlas/GeoEquityDashboard.tsx');

  it('does not define inline EQUITY_AREAS data array', () => {
    expect(src).not.toMatch(/^const EQUITY_AREAS\s*:\s*EquityArea\[\]\s*=\s*\[/m);
  });

  it('still consumes from useAtlasSpatialStore', () => {
    expect(src).toContain('useAtlasSpatialStore');
  });
});

// ============================================================================
// Gate 5 — Sealed wave regression: W4A+W4B contracts still structurally valid
// ============================================================================

describe('Gate 5 — sealed wave regression', () => {
  it('statisticsAPI still exports discoverSegments', () => {
    const src = readSrc('services/forge/statisticsAPI.ts');
    expect(src).toContain('discoverSegments');
  });

  it('regressionAPI still exports getHistory', () => {
    const src = readSrc('services/forge/regressionAPI.ts');
    expect(src).toContain('getHistory');
  });

  it('forgeStatisticsStore still imports statisticsAPI', () => {
    const src = readSrc('stores/forgeStatisticsStore.ts');
    expect(src).toContain('statisticsAPI');
  });

  it('SegmentDiscoveryDashboard still has DemoDataBanner', () => {
    const src = readSrc('pages/forge/calibration/SegmentDiscoveryDashboard.tsx');
    expect(src).toContain('DemoDataBanner');
    expect(src).toContain('isFixture');
  });
});
