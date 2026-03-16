/**
 * Phase 13 -- Suite State Governance Contract Tests
 * ==================================================
 *
 * Tests loading, error, and empty state handling across suite homes:
 *   - Loading state: suite homes should render a loading indicator when stats are loading
 *   - Error state: suite homes should render an error message when stats fail
 *   - Empty/null state: stats=null should NOT crash the component
 *   - Stats-present state: stats strip renders when data arrives
 *
 * Current reality: suite homes only do `{stats && (...)}` — no loading spinner,
 * no error display. These tests document the gap and will drive minimum fixes.
 *
 * @see hooks/useCountyStats.ts — returns { stats, loading, error }
 */
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// ── Mock factory ───────────────────────────────────────────────────────
// We need to control what useCountyStats returns per-test.

const mockCountyStats = vi.fn();

vi.mock('../../hooks/useCountyStats', () => ({
  useCountyStats: () => mockCountyStats(),
}));

vi.mock('../../components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div data-component="Card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

vi.mock('../../lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

vi.mock('../../components/suites/SuiteModuleGrid', () => ({
  SuiteModuleGrid: (props: any) => <div data-testid="mock-module-grid">{props.modules?.length ?? 0} modules</div>,
}));

vi.mock('../../components/suites/OperationalQueue', () => ({
  OperationalQueue: (props: any) => <div data-testid="mock-queue" />,
}));

vi.mock('../../components/workbench/ParcelContextBanner', () => ({
  ParcelContextBanner: () => <div data-testid="mock-parcel-banner" />,
}));

vi.mock('lucide-react', () => {
  const Icon = (props: any) => <svg data-slot="icon" {...props} />;
  return {
    ArrowLeft: Icon, Search: Icon,
    Hammer: Icon, Calculator: Icon, BarChart3: Icon, Scale: Icon,
    TrendingUp: Icon, FileSearch: Icon, Gavel: Icon, ShieldCheck: Icon,
    LineChart: Icon, PieChart: Icon, MapPin: Icon, DollarSign: Icon,
    Map: Icon, Layers: Icon, Crosshair: Icon, Printer: Icon,
    Download: Icon, Database: Icon,
    Receipt: Icon, Landmark: Icon, CheckCircle2: Icon, HardHat: Icon,
    Calendar: Icon, Bot: Icon, LayoutDashboard: Icon, ClipboardList: Icon,
  };
});

// ── Shared stats fixture ───────────────────────────────────────────────

const FULL_STATS = {
  totalParcels: 89247,
  parcelsByCity: { Kennewick: 30000, Richland: 25000, 'West Richland': 10000 },
  parcelsByType: { residential: 60000, commercial: 12000, agricultural: 5000 },
  averageAssessedValue: 285000,
  assessedThisYear: 45000,
  pendingAssessments: 1200,
  assessmentCompletionPercent: 86.5,
  activeAppeals: 245,
  totalLevyRevenue: 125000000,
};

// ── Dynamic imports ────────────────────────────────────────────────────

let ForgeSuiteHome: React.ComponentType;
let AtlasSuiteHome: React.ComponentType;
let DaisSuiteHome: React.ComponentType;

beforeAll(async () => {
  const [forgeModule, atlasModule, daisModule] = await Promise.all([
    import('../../pages/suites/ForgeSuiteHome'),
    import('../../pages/suites/AtlasSuiteHome'),
    import('../../pages/suites/DaisSuiteHome'),
  ]);
  ForgeSuiteHome = forgeModule.default;
  AtlasSuiteHome = atlasModule.default;
  DaisSuiteHome = daisModule.default;
}, 30000);

afterEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// 1. Null Stats — Component Must Not Crash
// ============================================================================

describe('Null Stats Safety', () => {
  it('ForgeSuiteHome renders without crashing when stats is null', () => {
    mockCountyStats.mockReturnValue({ stats: null, loading: false, error: null });
    const { container } = render(<MemoryRouter><ForgeSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('suite-forge-root')).toBeDefined();
    // Stats strip should NOT be present
    expect(container.querySelector('[data-testid="forge-stats"]')).toBeNull();
  });

  it('AtlasSuiteHome renders without crashing when stats is null', () => {
    mockCountyStats.mockReturnValue({ stats: null, loading: false, error: null });
    const { container } = render(<MemoryRouter><AtlasSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('suite-atlas-root')).toBeDefined();
    expect(container.querySelector('[data-testid="atlas-stats"]')).toBeNull();
  });

  it('DaisSuiteHome renders without crashing when stats is null', () => {
    mockCountyStats.mockReturnValue({ stats: null, loading: false, error: null });
    const { container } = render(<MemoryRouter><DaisSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('suite-dais-root')).toBeDefined();
    expect(container.querySelector('[data-testid="dais-stats"]')).toBeNull();
  });
});

// ============================================================================
// 2. Stats Present — Stats Strip Renders
// ============================================================================

describe('Stats Present', () => {
  it('ForgeSuiteHome shows stats strip when stats are available', () => {
    mockCountyStats.mockReturnValue({ stats: FULL_STATS, loading: false, error: null });
    render(<MemoryRouter><ForgeSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('forge-stats')).toBeDefined();
  });

  it('AtlasSuiteHome shows stats strip when stats are available', () => {
    mockCountyStats.mockReturnValue({ stats: FULL_STATS, loading: false, error: null });
    render(<MemoryRouter><AtlasSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('atlas-stats')).toBeDefined();
  });

  it('DaisSuiteHome shows stats strip when stats are available', () => {
    mockCountyStats.mockReturnValue({ stats: FULL_STATS, loading: false, error: null });
    render(<MemoryRouter><DaisSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('dais-stats')).toBeDefined();
  });
});

// ============================================================================
// 3. Loading State — Suite Homes Should Show Loading Indicator
// ============================================================================

describe('Loading State', () => {
  it('ForgeSuiteHome renders a loading indicator when loading=true', () => {
    mockCountyStats.mockReturnValue({ stats: null, loading: true, error: null });
    const { container } = render(<MemoryRouter><ForgeSuiteHome /></MemoryRouter>);
    // Should not crash
    expect(screen.getByTestId('suite-forge-root')).toBeDefined();
    // Should show a loading indicator (data-testid="loading" or role="status" or aria-busy)
    const loading = container.querySelector('[data-testid="forge-loading"]') ||
                    container.querySelector('[role="status"]') ||
                    container.querySelector('[aria-busy="true"]');
    expect(loading).not.toBeNull();
  });

  it('AtlasSuiteHome renders a loading indicator when loading=true', () => {
    mockCountyStats.mockReturnValue({ stats: null, loading: true, error: null });
    const { container } = render(<MemoryRouter><AtlasSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('suite-atlas-root')).toBeDefined();
    const loading = container.querySelector('[data-testid="atlas-loading"]') ||
                    container.querySelector('[role="status"]') ||
                    container.querySelector('[aria-busy="true"]');
    expect(loading).not.toBeNull();
  });

  it('DaisSuiteHome renders a loading indicator when loading=true', () => {
    mockCountyStats.mockReturnValue({ stats: null, loading: true, error: null });
    const { container } = render(<MemoryRouter><DaisSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('suite-dais-root')).toBeDefined();
    const loading = container.querySelector('[data-testid="dais-loading"]') ||
                    container.querySelector('[role="status"]') ||
                    container.querySelector('[aria-busy="true"]');
    expect(loading).not.toBeNull();
  });
});

// ============================================================================
// 4. Error State — Suite Homes Should Show Error Message
// ============================================================================

describe('Error State', () => {
  it('ForgeSuiteHome renders error message when error is present', () => {
    mockCountyStats.mockReturnValue({ stats: null, loading: false, error: 'Network error' });
    const { container } = render(<MemoryRouter><ForgeSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('suite-forge-root')).toBeDefined();
    const error = container.querySelector('[data-testid="forge-error"]') ||
                  container.querySelector('[role="alert"]');
    expect(error).not.toBeNull();
  });

  it('AtlasSuiteHome renders error message when error is present', () => {
    mockCountyStats.mockReturnValue({ stats: null, loading: false, error: 'Network error' });
    const { container } = render(<MemoryRouter><AtlasSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('suite-atlas-root')).toBeDefined();
    const error = container.querySelector('[data-testid="atlas-error"]') ||
                  container.querySelector('[role="alert"]');
    expect(error).not.toBeNull();
  });

  it('DaisSuiteHome renders error message when error is present', () => {
    mockCountyStats.mockReturnValue({ stats: null, loading: false, error: 'Network error' });
    const { container } = render(<MemoryRouter><DaisSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('suite-dais-root')).toBeDefined();
    const error = container.querySelector('[data-testid="dais-error"]') ||
                  container.querySelector('[role="alert"]');
    expect(error).not.toBeNull();
  });
});
