// @vitest-environment jsdom
/**
 * Phase 11 TDD-first contract tests — Atlas Neighborhood / Analysis pages
 * Tests: TerraGamaPage, NeighborhoodComparison, SentimentDashboard, AtlasSuiteHome
 * These tests are written BEFORE the components exist — they will fail until implemented.
 */

import React from 'react';
import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Shared UI mocks
// ---------------------------------------------------------------------------

vi.mock('../../components/ui/card', () => ({
  Card: ({ children, ...props }: any) => (
    <div data-component="card" {...props}>
      {children}
    </div>
  ),
  CardContent: ({ children, ...props }: any) => (
    <div data-component="card-content" {...props}>
      {children}
    </div>
  ),
  CardHeader: ({ children, ...props }: any) => (
    <div data-component="card-header" {...props}>
      {children}
    </div>
  ),
  CardTitle: ({ children, ...props }: any) => (
    <div data-component="card-title" {...props}>
      {children}
    </div>
  ),
}));

vi.mock('../../lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

// ---------------------------------------------------------------------------
// AtlasSuiteHome-specific mocks
// ---------------------------------------------------------------------------

vi.mock('../../hooks/useCountyStats', () => ({
  useCountyStats: () => ({
    stats: {
      totalParcels: 128784,
      parcelsByCity: { Kennewick: 30000, Richland: 25000, Prosser: 8000 },
      parcelsByType: { residential: 65000, commercial: 12000, industrial: 5000 },
    },
    loading: false,
    error: null,
    source: 'live',
  }),
}));

vi.mock('../../hooks/useAtlasGis', () => ({
  useParcelGis: () => ({
    boundary: {
      data: {
        parcelId: '119802030006001',
        source: 'live',
        centroid: {
          lat: 46.1669718650024,
          lng: -119.115612775675,
          derivedFrom: 'arcgis-centroid',
        },
        dimensions: null,
        areaAcres: 0.3271,
        areaSqFt: 14250,
        situsDisplay: '203 E 47TH PL KENNEWICK, WA 99337-5905',
        ringJson: JSON.stringify(Array.from({ length: 15 }, (_, index) => [-119.115 + index * 0.001, 46.166])),
        ownerName: 'COX DONNA M',
        imageUrl: null,
        sketchUrl: null,
      },
      loading: false,
      error: null,
      source: 'live',
      refetch: vi.fn(),
    },
    layers: {
      data: {
        parcelId: '119802030006001',
        source: 'live',
        zoning: null,
        flood: { zone: 'unavailable', risk: 'FEMA flood enrichment unavailable', source: 'unavailable' },
        taxArea: { taxAreaNumber: 'K1', taxAreaDescription: null, taxYear: 2026, source: 'live' },
        landClass: { landTypeCode: null, landClassCode: null, primaryUseCd: '11', subUseCd: null, source: 'live' },
      },
      loading: false,
      error: null,
      source: 'live',
      refetch: vi.fn(),
    },
  }),
}));

vi.mock('../../components/suites/SuiteModuleGrid', () => ({
  SuiteModuleGrid: (props: any) => (
    <div data-accent={props.accentVar}>SuiteModuleGrid</div>
  ),
}));

vi.mock('../../components/suites/OperationalQueue', () => ({
  OperationalQueue: (props: any) => (
    <div data-accent={props.accentVar}>OperationalQueue</div>
  ),
}));

vi.mock('../../api/pilotApi', () => ({
  invokeTool: vi.fn(),
}));

// Lucide icons mock
vi.mock('lucide-react', () => {
  const Icon = (props: any) => <svg data-slot="icon" {...props} />;
  return {
    ArrowLeft: Icon,
    Map: Icon,
    Search: Icon,
    Layers: Icon,
    Crosshair: Icon,
    Printer: Icon,
    Download: Icon,
    Database: Icon,
    BarChart2: Icon,
    Globe: Icon,
  };
});

// ---------------------------------------------------------------------------
// Light-mode violation scanner
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
  // Strip SVG elements to avoid false positives from map/icon attributes
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

// ---------------------------------------------------------------------------
// 1. TerraGamaPage
// ---------------------------------------------------------------------------

describe('TerraGamaPage — contract', () => {
  let TerraGamaPage: React.ComponentType;

  beforeAll(async () => {
    const mod = await import('../../pages/atlas/TerraGamaPage');
    TerraGamaPage = mod.default;
  });

  it('renders container with data-testid="terra-gama"', () => {
    const { container } = render(<TerraGamaPage />);
    const root = container.querySelector('[data-testid="terra-gama"]');
    expect(root).not.toBeNull();
  });

  it('renders at least one bento-material Card in the page', () => {
    const { container } = render(<TerraGamaPage />);
    // The page always renders filter/legend/sidebar Cards even before parcel selection
    const bentoCards = container.querySelectorAll('[data-material="bento"]');
    // Contract: at least one bento-material surface exists in the layout
    expect(bentoCards.length).toBeGreaterThanOrEqual(1);
  });

  it('has no light-mode class violations', () => {
    const { container } = render(<TerraGamaPage />);
    const violations = findLightModeViolations(container.innerHTML);
    expect(violations).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 2. NeighborhoodComparison
// ---------------------------------------------------------------------------

describe('NeighborhoodComparison — contract', () => {
  let NeighborhoodComparison: React.ComponentType;

  beforeAll(async () => {
    const mod = await import(
      '../../pages/atlas/neighborhood/NeighborhoodComparison'
    );
    NeighborhoodComparison = mod.default;
  });

  it('renders container with data-testid="neighborhood-comparison"', () => {
    const { container } = render(<NeighborhoodComparison />);
    const root = container.querySelector(
      '[data-testid="neighborhood-comparison"]'
    );
    expect(root).not.toBeNull();
  });

  it('renders at least one bento-material Card in the sidebar/selection area', () => {
    const { container } = render(<NeighborhoodComparison />);
    // Sidebar selection controls are always visible; comparison table is conditional
    const bentoCards = container.querySelectorAll('[data-material="bento"]');
    expect(bentoCards.length).toBeGreaterThanOrEqual(1);
  });

  it('has no light-mode class violations', () => {
    const { container } = render(<NeighborhoodComparison />);
    const violations = findLightModeViolations(container.innerHTML);
    expect(violations).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 3. SentimentDashboard
// ---------------------------------------------------------------------------

describe('SentimentDashboard — contract', () => {
  let SentimentDashboard: React.ComponentType;

  beforeAll(async () => {
    const mod = await import(
      '../../pages/atlas/neighborhood/SentimentDashboard'
    );
    SentimentDashboard = mod.default;
  });

  it('renders container with data-testid="sentiment-dashboard"', () => {
    const { container } = render(<SentimentDashboard />);
    const root = container.querySelector('[data-testid="sentiment-dashboard"]');
    expect(root).not.toBeNull();
  });

  it('rankings Card has data-material="bento"', () => {
    const { container } = render(<SentimentDashboard />);
    // The rankings Card is always visible in the layout
    const bentoCards = container.querySelectorAll('[data-material="bento"]');
    expect(bentoCards.length).toBeGreaterThanOrEqual(1);
  });

  it('renders explicit unavailable disclosure instead of seeded sentiment rows', () => {
    render(<SentimentDashboard />);
    expect(screen.getByTestId('sentiment-dashboard-unavailable')).toBeInTheDocument();
    expect(screen.getByText(/Neighborhood sentiment unavailable\./i)).toBeInTheDocument();
    expect(
      screen.getByText(/no seeded Richland ranking or pseudo-heat bubbles are rendered here/i),
    ).toBeInTheDocument();
  });

  it('has no light-mode class violations', () => {
    const { container } = render(<SentimentDashboard />);
    const violations = findLightModeViolations(container.innerHTML);
    expect(violations).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 4. AtlasSuiteHome
// ---------------------------------------------------------------------------

describe('AtlasSuiteHome — contract', () => {
  let AtlasSuiteHome: React.ComponentType;

  beforeAll(async () => {
    const mod = await import('../../pages/suites/AtlasSuiteHome');
    AtlasSuiteHome = mod.default;
  });

  it('renders stats strip, module grid, and operational queue with correct testids', () => {
    render(
      <MemoryRouter>
        <AtlasSuiteHome />
      </MemoryRouter>
    );

    expect(screen.getByTestId('atlas-stats')).toBeInTheDocument();
    expect(screen.getByTestId('atlas-modules')).toBeInTheDocument();
    expect(screen.getByTestId('atlas-queue')).toBeInTheDocument();
  });

  it('renders the county evidence plane without changing the module grid contract', () => {
    render(
      <MemoryRouter>
        <AtlasSuiteHome />
      </MemoryRouter>
    );

    expect(screen.getByTestId('atlas-evidence-plane')).toBeInTheDocument();
    expect(screen.getByText('County Spatial Audit Posture')).toBeInTheDocument();
  });

  it('renders Suite app truth and corrected data-count labels', () => {
    render(
      <MemoryRouter>
        <AtlasSuiteHome />
      </MemoryRouter>
    );

    expect(screen.getByTestId('atlas-suite-app-proof')).toBeInTheDocument();
    expect(screen.getByText('GIS geometry rows')).toBeInTheDocument();
    expect(screen.getByText('80,084')).toBeInTheDocument();
    expect(screen.getByText('RingJson geometries')).toBeInTheDocument();
    expect(screen.getByText('80,083')).toBeInTheDocument();
    expect(screen.getByText('Active parcel count')).toBeInTheDocument();
    expect(screen.getByText('Not verified')).toBeInTheDocument();
    expect(screen.queryByText('Total Parcels')).not.toBeInTheDocument();
    expect(screen.queryByText('128,784')).not.toBeInTheDocument();
  });

  it('renders canonical parcel and layer truth for TerraGIS, ParcelLens, and LayerWorks', () => {
    render(
      <MemoryRouter>
        <AtlasSuiteHome />
      </MemoryRouter>
    );

    expect(screen.getByText('TerraGIS · PARTIAL')).toBeInTheDocument();
    expect(screen.getByText('ParcelLens · PARTIAL')).toBeInTheDocument();
    expect(screen.getByText('LayerWorks · PARTIAL')).toBeInTheDocument();
    expect(screen.getByText('COX DONNA M')).toBeInTheDocument();
    expect(screen.getByText(/203 E 47TH PL KENNEWICK/i)).toBeInTheDocument();
    expect(screen.getByText(/RingJson 15 points/i)).toBeInTheDocument();
    expect(screen.getByText(/Tax area K1/i)).toBeInTheDocument();
    expect(screen.getByText(/Land class 11/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Flood external enrichment/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Zoning null\/not configured/i)).toBeInTheDocument();
  });
});
