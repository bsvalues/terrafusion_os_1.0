/**
 * W5C — Dais Frontend Wiring Contract Tests
 *
 * Static source-file inspection (no rendering, no mocking).
 * Verifies:
 *   - daisService targets /api/dais with auth, throws on error, no fixture fallback
 *   - queueService targets /api/dais/queue with auth, has throwOnError option
 *   - ManagementDashboard composes both services with isFixture + DemoDataBanner
 *   - Workbench dais route-collapse (PropertyDais tab wired in Router)
 *   - Sealed wave regression (W4A, W4B, W5B contracts still hold)
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const SRC_ROOT = path.resolve(__dirname, '../..');

function readSrc(relPath: string): string {
  return fs.readFileSync(path.join(SRC_ROOT, relPath), 'utf-8');
}

// ============================================================================
// Gate 1 — daisService endpoint alignment
// ============================================================================

describe('Gate 1 — daisService: real CRUD, no fixture fallback', () => {
  const src = readSrc('services/suites/daisService.ts');

  it('targets /api/dais base URL', () => {
    expect(src).toMatch(/['"`]\/api\/dais['"`]/);
  });

  it('imports getToken from auth', () => {
    expect(src).toContain('getToken');
    expect(src).toContain('authStorage');
  });

  it('uses Bearer authorization headers', () => {
    expect(src).toContain('Bearer');
  });

  it('exports appeal CRUD surface', () => {
    expect(src).toContain('export async function getAppeals');
    expect(src).toContain('export async function getAllAppeals');
    expect(src).toContain('export async function createAppeal');
    expect(src).toContain('export async function updateAppealStatus');
  });

  it('exports certification and notice surface', () => {
    expect(src).toContain('export async function getCertificationStatus');
    expect(src).toContain('export async function getNotices');
  });

  it('exports permit and exemption surface', () => {
    expect(src).toContain('export async function getPermits');
    expect(src).toContain('export async function getExemptions');
  });

  it('has NO fixture imports (throws on error)', () => {
    expect(src).not.toMatch(/Fixture|FIXTURE|fixture/i);
  });
});

// ============================================================================
// Gate 2 — queueService endpoint alignment + throwOnError
// ============================================================================

describe('Gate 2 — queueService: API + throwOnError provenance', () => {
  const src = readSrc('services/suites/queueService.ts');

  it('targets /api/dais/queue base URL', () => {
    expect(src).toMatch(/['"`]\/api\/dais\/queue['"`]/);
  });

  it('imports getToken from auth', () => {
    expect(src).toContain('getToken');
    expect(src).toContain('authStorage');
  });

  it('uses Bearer authorization headers', () => {
    expect(src).toContain('Bearer');
  });

  it('exports read operations (getQueueItems, getQueueMetrics, getAppraiserProductivity)', () => {
    expect(src).toContain('export async function getQueueItems');
    expect(src).toContain('export async function getQueueMetrics');
    expect(src).toContain('export async function getAppraiserProductivity');
  });

  it('exports write operations (assignWorkItems, reviewWorkItem)', () => {
    expect(src).toContain('export async function assignWorkItems');
    expect(src).toContain('export async function reviewWorkItem');
  });

  it('declares QueueReadOptions with throwOnError', () => {
    expect(src).toContain('QueueReadOptions');
    expect(src).toContain('throwOnError');
  });

  it('read functions accept optional QueueReadOptions parameter', () => {
    expect(src).toMatch(/getQueueItems\(options\?:\s*QueueReadOptions\)/);
    expect(src).toMatch(/getQueueMetrics\(options\?:\s*QueueReadOptions\)/);
    expect(src).toMatch(/getAppraiserProductivity\(options\?:\s*QueueReadOptions\)/);
  });

  it('re-throws when throwOnError is set', () => {
    const throwChecks = src.match(/options\?\.throwOnError/g);
    expect(throwChecks).not.toBeNull();
    expect(throwChecks!.length).toBeGreaterThanOrEqual(3);
  });
});

// ============================================================================
// Gate 3 — ManagementDashboard API-first composition with disclosure
// ============================================================================

describe('Gate 3 — ManagementDashboard composes both services honestly', () => {
  const src = readSrc('pages/dais/ManagementDashboard.tsx');

  it('imports from daisService (getCertificationStatus, getAllAppeals)', () => {
    expect(src).toContain('getCertificationStatus');
    expect(src).toContain('getAllAppeals');
    expect(src).toMatch(/from\s+['"]@\/services\/suites\/daisService['"]/);
  });

  it('imports from queueService (getQueueMetrics, getAppraiserProductivity)', () => {
    expect(src).toContain('getQueueMetrics');
    expect(src).toContain('getAppraiserProductivity');
    expect(src).toMatch(/from\s+['"]@\/services\/suites\/queueService['"]/);
  });

  it('has isFixture state for fixture disclosure', () => {
    expect(src).toContain('isFixture');
    expect(src).toContain('setIsFixture');
  });

  it('imports DemoDataBanner from governance', () => {
    expect(src).toContain('DemoDataBanner');
    expect(src).toMatch(/from\s+['"]@\/components\/governance\/DemoDataBanner['"]/);
  });

  it('passes throwOnError: true to queueService calls', () => {
    expect(src).toContain('getAppraiserProductivity({ throwOnError: true })');
    expect(src).toContain('getQueueMetrics({ throwOnError: true })');
  });

  it('uses useCallback for data fetching', () => {
    expect(src).toContain('useCallback');
  });

  it('uses useEffect for lifecycle', () => {
    expect(src).toContain('useEffect');
  });
});

// ============================================================================
// Gate 4 — Workbench dais route-collapse
// ============================================================================

describe('Gate 4 — dais route-collapse in Router + Workbench', () => {
  const router = readSrc('Router.tsx');

  it('lazy-loads PropertyDais for workbench tab', () => {
    expect(router).toMatch(/PropertyDais\s*=\s*lazy\(\(\)\s*=>\s*import\(['"]\.\/pages\/workbench\/tabs\/PropertyDais['"]\)/);
  });

  it('lazy-loads DaisHome for standalone route', () => {
    expect(router).toMatch(/DaisHome\s*=\s*lazy\(\(\)\s*=>\s*import\(['"]\.\/pages\/suites\/DaisSuiteHome['"]\)/);
  });

  it('wires /property/:parcelId/dais as nested workbench route', () => {
    expect(router).toMatch(/<Route\s+path=['"]dais['"]\s+element=\{<PropertyDais\s*\/>\}/);
  });

  it('wires /dais as standalone suite route', () => {
    expect(router).toMatch(/<Route\s+path=['"]\/dais['"]\s+element=\{<DaisHome\s*\/>\}/);
  });

  it('PropertyDais tab component exists', () => {
    const pd = readSrc('pages/workbench/tabs/PropertyDais.tsx');
    expect(pd).toBeTruthy();
  });
});

// ============================================================================
// Gate 5 — Sealed wave regression (W4A, W4B, W5B still hold)
// ============================================================================

describe('Gate 5 — sealed wave regression', () => {
  it('statisticsAPI still exports discoverSegments (W4B)', () => {
    const src = readSrc('services/forge/statisticsAPI.ts');
    expect(src).toContain('discoverSegments');
  });

  it('regressionAPI still exports getHistory (W4A)', () => {
    const src = readSrc('services/forge/regressionAPI.ts');
    expect(src).toContain('getHistory');
  });

  it('SegmentDiscoveryDashboard still has DemoDataBanner (W4B)', () => {
    const src = readSrc('pages/forge/calibration/SegmentDiscoveryDashboard.tsx');
    expect(src).toContain('DemoDataBanner');
    expect(src).toContain('isFixture');
  });

  it('GeoEquityDashboard still has DemoDataBanner (W5B)', () => {
    const src = readSrc('pages/atlas/GeoEquityDashboard.tsx');
    expect(src).toContain('DemoDataBanner');
    expect(src).toContain('isFixture');
    expect(src).toContain('useAtlasSpatialStore');
  });

  it('NeighborhoodTrendsPage has no console.log (W5B)', () => {
    const src = readSrc('pages/forge/market/NeighborhoodTrendsPage.tsx');
    expect(src).not.toContain('console.log');
  });
});
