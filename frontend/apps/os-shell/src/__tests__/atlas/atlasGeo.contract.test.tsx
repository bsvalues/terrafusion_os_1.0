/**
 * Phase 11: TerraAtlas Geospatial Pages Contract Tests
 * =====================================================================
 * TDD-first contract tests for four TerraAtlas geospatial page components:
 *   - GeoEquityDashboard
 *   - GeometryHealth
 *   - MarketHeatMapPage
 *   - MassAppraisalGIS
 *
 * Tests verify:
 *   1. Root data-testid markers are present
 *   2. Bento card panels carry data-material="bento"
 *   3. Interactive area/ranking items carry role="link"
 *   4. No hardcoded light-mode Tailwind color classes leak into output
 *      (SVG map elements are exempt — stripped before scan)
 *
 * These tests will FAIL initially. Components must be updated to add
 * the required data-testid / data-material / role attributes.
 *
 * @module __tests__/atlas/atlasGeo.contract.test
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';

// ---------------------------------------------------------------------------
// UI primitive mocks — use relative paths, not @/ aliases
// ---------------------------------------------------------------------------

vi.mock('../../components/ui/card', () => ({
  Card: ({ children, ...props }: any) => (
    <div data-component="card" {...props}>{children}</div>
  ),
  CardContent: ({ children, ...props }: any) => (
    <div data-component="card-content" {...props}>{children}</div>
  ),
  CardHeader: ({ children, ...props }: any) => (
    <div data-component="card-header" {...props}>{children}</div>
  ),
  CardTitle: ({ children, ...props }: any) => (
    <div data-component="card-title" {...props}>{children}</div>
  ),
}));

vi.mock('../../lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

// Stub live data hook so structural tests don't need QueryClientProvider
vi.mock('../../hooks/useParcelCount', () => ({
  useParcelCount: () => ({
    data: { totalParcels: 89_247, dataSource: 'STUB', stubbed: true },
    isLoading: false,
    error: null,
    isSuccess: true,
  }),
}));

// ---------------------------------------------------------------------------
// Page components under test
// ---------------------------------------------------------------------------

import GeoEquityDashboard from '../../pages/atlas/GeoEquityDashboard';
import GeometryHealth from '../../pages/atlas/GeometryHealth';
import MarketHeatMapPage from '../../pages/atlas/MarketHeatMapPage';
import MassAppraisalGIS from '../../pages/atlas/MassAppraisalGIS';

// ---------------------------------------------------------------------------
// Light-mode violation scanner
// SVG elements are stripped — map visualization hex colors inside <svg> are
// intentional data colours and are acceptable.
// ---------------------------------------------------------------------------

const LIGHT_MODE_PATTERNS = [
  /\bbg-gray-\d+\b/,
  /\bbg-red-\d+\b/,
  /\bbg-blue-\d+\b/,
  /\bbg-green-\d+\b/,
  /\bbg-yellow-\d+\b/,
  /\bbg-orange-\d+\b/,
  /\bhover:bg-gray-\d+\b/,
  /\btext-red-\d+\b/,
  /\bborder-red-\d+\b/,
  /\bring-blue-\d+\b/,
];

function findLightModeViolations(html: string): string[] {
  // Strip SVG elements — map visualization colors in SVG are acceptable
  const stripped = html.replace(/<svg[\s\S]*?<\/svg>/gi, '');
  const violations: string[] = [];
  for (const pattern of LIGHT_MODE_PATTERNS) {
    const matches = stripped.match(new RegExp(pattern.source, 'g'));
    if (matches) violations.push(...matches);
  }
  return [...new Set(violations)];
}

// ---------------------------------------------------------------------------
// Teardown
// ---------------------------------------------------------------------------

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ===========================================================================
// GeoEquityDashboard
// ===========================================================================

describe('GeoEquityDashboard — contract', () => {
  it('renders root element with data-testid="geo-equity-dashboard"', () => {
    const { container } = render(<GeoEquityDashboard />);
    const root = container.querySelector('[data-testid="geo-equity-dashboard"]');
    expect(root).toBeInTheDocument();
  });

  it('sidebar summary Card has data-material="bento"', () => {
    const { container } = render(<GeoEquityDashboard />);
    const bentoCards = container.querySelectorAll('[data-material="bento"]');
    expect(bentoCards.length).toBeGreaterThanOrEqual(1);
  });

  it('sidebar area buttons carry role="link"', () => {
    const { container } = render(<GeoEquityDashboard />);
    const linkButtons = container.querySelectorAll('button[role="link"]');
    expect(linkButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('contains no hardcoded light-mode Tailwind classes', () => {
    const { container } = render(<GeoEquityDashboard />);
    const violations = findLightModeViolations(container.innerHTML);
    expect(violations).toEqual([]);
  });
});

// ===========================================================================
// GeometryHealth
// ===========================================================================

describe('GeometryHealth — contract', () => {
  it('renders root element with data-testid="geometry-health"', () => {
    const { container } = render(<GeometryHealth />);
    const root = container.querySelector('[data-testid="geometry-health"]');
    expect(root).toBeInTheDocument();
  });

  it('overall health Card has data-material="bento"', () => {
    const { container } = render(<GeometryHealth />);
    const bentoCards = container.querySelectorAll('[data-material="bento"]');
    expect(bentoCards.length).toBeGreaterThanOrEqual(1);
  });

  it('recommendations Card also carries data-material="bento" (at least 2 total)', () => {
    const { container } = render(<GeometryHealth />);
    const bentoCards = container.querySelectorAll('[data-material="bento"]');
    expect(bentoCards.length).toBeGreaterThanOrEqual(2);
  });

  it('contains no hardcoded light-mode Tailwind classes', () => {
    const { container } = render(<GeometryHealth />);
    const violations = findLightModeViolations(container.innerHTML);
    expect(violations).toEqual([]);
  });
});

// ===========================================================================
// MarketHeatMapPage
// ===========================================================================

describe('MarketHeatMapPage — contract', () => {
  it('renders root element with data-testid="market-heat-map"', () => {
    const { container } = render(<MarketHeatMapPage />);
    const root = container.querySelector('[data-testid="market-heat-map"]');
    expect(root).toBeInTheDocument();
  });

  it('activity rankings Card has data-material="bento"', () => {
    const { container } = render(<MarketHeatMapPage />);
    const bentoCards = container.querySelectorAll('[data-material="bento"]');
    expect(bentoCards.length).toBeGreaterThanOrEqual(1);
  });

  it('ranking buttons inside rankings Card carry role="link"', () => {
    const { container } = render(<MarketHeatMapPage />);
    const linkButtons = container.querySelectorAll('button[role="link"]');
    expect(linkButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('contains no hardcoded light-mode Tailwind classes', () => {
    const { container } = render(<MarketHeatMapPage />);
    const violations = findLightModeViolations(container.innerHTML);
    expect(violations).toEqual([]);
  });
});

// ===========================================================================
// MassAppraisalGIS
// ===========================================================================

describe('MassAppraisalGIS — contract', () => {
  it('renders root element with data-testid="mass-appraisal-gis"', () => {
    const { container } = render(<MassAppraisalGIS />);
    const root = container.querySelector('[data-testid="mass-appraisal-gis"]');
    expect(root).toBeInTheDocument();
  });

  it('layer toggle panel Card has data-material="bento"', () => {
    const { container } = render(<MassAppraisalGIS />);
    const bentoCards = container.querySelectorAll('[data-material="bento"]');
    expect(bentoCards.length).toBeGreaterThanOrEqual(1);
  });

  it('contains no hardcoded light-mode Tailwind classes', () => {
    const { container } = render(<MassAppraisalGIS />);
    const violations = findLightModeViolations(container.innerHTML);
    expect(violations).toEqual([]);
  });
});
