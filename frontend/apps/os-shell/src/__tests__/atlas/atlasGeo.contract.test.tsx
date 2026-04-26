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
import { screen, waitFor } from '@testing-library/react';

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

const MASS_APPRAISAL_FIXTURE = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-119.31, 46.24],
          [-119.30, 46.24],
          [-119.30, 46.25],
          [-119.31, 46.25],
          [-119.31, 46.24],
        ]],
      },
      properties: {
        Parcel_ID: '100100000000001',
        situs_display: '123 Live Parcel Rd WA',
        Property_Type: 'Residential',
        neighborhood: '540100',
        zoning: 'R-1',
        Current_Ratio: 0.82,
        TotalMarketValue: 325000,
        Shape__Area: 7200,
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-119.295, 46.245],
          [-119.285, 46.245],
          [-119.285, 46.255],
          [-119.295, 46.255],
          [-119.295, 46.245],
        ]],
      },
      properties: {
        Parcel_ID: '100100000000002',
        situs_display: '456 County Review Ave WA',
        Property_Type: 'Commercial',
        neighborhood: '540100',
        zoning: 'C-1',
        Current_Ratio: 1.18,
        TotalMarketValue: 510000,
        Shape__Area: 9100,
      },
    },
  ],
  properties: {
    exceededTransferLimit: false,
  },
} as const;

vi.mock('../../services/atlasService', () => ({
  atlasService: {
    getGeometryHealth: vi.fn(async () => ({
      totalParcels: 89247,
      parcelsWithGeometry: 89239,
      parcelsMissingGeometry: 8,
      flaggedGeometryRecords: 17,
      lastSyncTimestamp: '2026-04-16T00:00:00Z',
      source: 'Benton County ArcGIS AssessorPropVal geometry coverage and recalculation flags grouped by neighborhood',
      areaStats: [
        {
          id: '150007',
          name: 'Neighborhood 150007',
          neighborhoodCode: '150007',
          totalParcels: 2861,
          parcelsWithGeometry: 2861,
          parcelsMissingGeometry: 0,
          flaggedGeometryRecords: 0,
          center: [46.27982, -119.354085],
        },
        {
          id: '530300',
          name: 'Neighborhood 530300',
          neighborhoodCode: '530300',
          totalParcels: 1783,
          parcelsWithGeometry: 1783,
          parcelsMissingGeometry: 0,
          flaggedGeometryRecords: 14,
          center: [46.049809, -119.413432],
        },
      ],
    })),
    getGeoEquityAreas: vi.fn(async () => ({
      count: 2,
      asOf: '2026-04-16T00:00:00Z',
      source: 'Benton County ArcGIS AssessorPropVal grouped by neighborhood and property type',
      areas: [
        {
          id: '150007:Residential',
          name: 'Neighborhood 150007',
          neighborhoodCode: '150007',
          propertyType: 'Residential',
          propertyTypeCategory: 'Residential',
          equityRatio: 1.1281,
          ratioStdDev: 0.2398,
          parcelCount: 1622,
          averageMarketValue: 280500.91,
          center: [46.278638, -119.355752],
        },
        {
          id: '11040:Residential',
          name: 'Neighborhood 11040',
          neighborhoodCode: '11040',
          propertyType: 'Residential',
          propertyTypeCategory: 'Residential',
          equityRatio: 1.1501,
          ratioStdDev: 0.2185,
          parcelCount: 781,
          averageMarketValue: 273722.23,
          center: [46.216697, -119.237311],
        },
      ],
    })),
    getMassAppraisalStats: vi.fn(async () => ({
      totalParcels: 89247,
      totalAcreage: 123456,
      zoningDistrictCount: 18,
      floodZoneCount: 0,
      lastDataUpdate: '2026-04-16T00:00:00Z',
      typeBreakdown: [
        { type: 'Residential', count: 60000 },
        { type: 'Commercial', count: 12000 },
      ],
      averageAssessedValue: 418000,
      averageMarketValue: 418000,
      totalAssessedValue: 37300000000,
      totalMarketValue: 40100000000,
      layers: ['atlas-api'],
    })),
    getStats: vi.fn(async () => ({
      totalParcels: 89247,
      totalAcreage: 123456,
      zoningDistrictCount: 18,
      floodZoneCount: 0,
      lastDataUpdate: '2026-04-16T00:00:00Z',
      typeBreakdown: [
        { type: 'Residential', count: 60000 },
        { type: 'Commercial', count: 12000 },
      ],
      averageAssessedValue: 418000,
      averageMarketValue: 418000,
      totalAssessedValue: 37300000000,
      totalMarketValue: 40100000000,
      layers: ['atlas-api'],
    })),
    searchMassAppraisalParcels: vi.fn(async () => MASS_APPRAISAL_FIXTURE),
  },
}));

vi.mock('../../api/pilotApi', () => ({
  invokeTool: vi.fn(async () => ({
    success: true,
    correlationId: 'corr-atlas-001',
    result: {
      output: JSON.stringify({
        narrative: 'Residual clustering is concentrated in the governed Benton audit area.',
        hotspotCount: 3,
        recommendedAction: 'Route neighborhood review to TerraForge and parcel defects to Workbench.',
      }),
    },
  })),
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

  it('sidebar area buttons carry role="link"', async () => {
    const { container } = render(<GeoEquityDashboard />);
    await waitFor(() => {
      const linkButtons = container.querySelectorAll('button[role="link"]');
      expect(linkButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('contains no hardcoded light-mode Tailwind classes', () => {
    const { container } = render(<GeoEquityDashboard />);
    const violations = findLightModeViolations(container.innerHTML);
    expect(violations).toEqual([]);
  });

  it('renders live Benton GeoEquity posture instead of the old governed fixture brief', async () => {
    render(<GeoEquityDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText(/Live Benton County neighborhood equity groups derived from the Assessor Prop Val layer\./i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Neighborhood 150007/i)
      ).toBeInTheDocument();
    });
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

  it('renders live Benton geometry posture instead of demo area health data', async () => {
    render(<GeometryHealth />);

    await waitFor(() => {
      expect(
        screen.getByText(/Live Benton County geometry coverage derived from Assessor Prop Val parcel geometry and recalculation flags\./i),
      ).toBeInTheDocument();
      expect(screen.getAllByText(/Neighborhood 530300/i).length).toBeGreaterThanOrEqual(1);
    });
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

  it('renders explicit unavailable disclosure instead of seeded area rankings', () => {
    render(<MarketHeatMapPage />);
    expect(screen.getByTestId('market-heat-map-unavailable')).toBeInTheDocument();
    expect(
      screen.getByText(/Market activity heat map unavailable\./i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no seeded area rankings or pseudo-sale clusters are rendered here/i),
    ).toBeInTheDocument();
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

  it('renders a live county audit brief for the Atlas parcel slice', async () => {
    render(<MassAppraisalGIS />);

    expect(screen.getByTestId('mass-appraisal-governed-brief')).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText(/2 parcels in the current live slice are outside the 0.90-1.10 ratio band\./i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Live Benton County ArcGIS geometry and Atlas county stats\./i)
      ).toBeInTheDocument();
    });
  });
});
