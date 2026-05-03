/**
 * W5B — GeoEquityDashboard Honest-State Contract Tests
 *
 * Static source-file inspection (no rendering, no mocking).
 * Verifies that GeoEquityDashboard follows the governed live/unavailable pattern:
 *   - API-first via atlasService.getGeoEquityAreas
 *   - useAtlasSpatialStore is only used to prime sibling Atlas surfaces
 *   - explicit unavailable state replaces the old fixture fallback path
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
// Gate 1 — GeoEquityDashboard live wiring + store priming
// ============================================================================

describe('Gate 1 — GeoEquityDashboard API-first wiring', () => {
  const src = readSrc('pages/atlas/GeoEquityDashboard.tsx');

  it('imports useAtlasSpatialStore', () => {
    expect(src).toContain('useAtlasSpatialStore');
  });

  it('imports atlasService and uses the live GeoEquity endpoint', () => {
    expect(src).toContain("from '@/services/atlasService'");
    expect(src).toContain('getGeoEquityAreas(25)');
  });

  it('imports useEffect', () => {
    expect(src).toMatch(/import\s*\{[^}]*useEffect[^}]*\}\s*from\s*'react'/);
  });

  it('calls fetchSpatialData in useEffect', () => {
    expect(src).toContain('fetchSpatialData');
    expect(src).toContain('useEffect');
  });

  it('does not read GeoEquity areas from the store', () => {
    expect(src).not.toContain('s.equityAreas');
  });
});

// ============================================================================
// Gate 2 — explicit live/unavailable state instead of fixture fallback
// ============================================================================

describe('Gate 2 — explicit unavailable disclosure contract', () => {
  const src = readSrc('pages/atlas/GeoEquityDashboard.tsx');

  it('declares an explicit read state', () => {
    expect(src).toContain("type GeoEquityReadState = 'loading' | 'live' | 'unavailable'");
    expect(src).toContain("setReadState('loading')");
    expect(src).toContain("setReadState('live')");
    expect(src).toContain("setReadState('unavailable')");
  });

  it('renders an explicit unavailable landmark', () => {
    expect(src).toContain('data-testid="geo-equity-unavailable"');
    expect(src).toContain('Live GeoEquity unavailable.');
  });

  it('does not import DemoDataBanner or atlasSpatial fixture fallbacks', () => {
    expect(src).not.toContain('DemoDataBanner');
    expect(src).not.toContain('FALLBACK_EQUITY_AREAS');
    expect(src).not.toContain('atlasSpatialFixtures');
    expect(src).not.toContain('isFixture');
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

describe('Gate 4 — W3 regression (store-primed live gate)', () => {
  const src = readSrc('pages/atlas/GeoEquityDashboard.tsx');

  it('does not define inline EQUITY_AREAS data array', () => {
    expect(src).not.toMatch(/^const EQUITY_AREAS\s*:\s*EquityArea\[\]\s*=\s*\[/m);
  });

  it('still primes sibling Atlas surfaces through useAtlasSpatialStore', () => {
    expect(src).toContain('useAtlasSpatialStore');
    expect(src).toContain('fetchSpatialData');
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

  it('SegmentDiscoveryDashboard now uses explicit unavailable disclosure instead of DemoDataBanner', () => {
    const src = readSrc('pages/forge/calibration/SegmentDiscoveryDashboard.tsx');
    expect(src).toContain('segment-discovery-unavailable');
    expect(src).toContain('Segment discovery unavailable.');
    expect(src).not.toContain('DemoDataBanner');
  });
});
