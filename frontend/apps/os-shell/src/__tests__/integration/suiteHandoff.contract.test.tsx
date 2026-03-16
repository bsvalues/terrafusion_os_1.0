/**
 * Phase 12 — Suite Handoff Contract Tests
 * ════════════════════════════════════════
 *
 * Tests cross-suite rendering and shell boundary governance:
 *   - All 3 mature suite homes render without crashing
 *   - Suite chrome structure (stats, modules, queue sections)
 *   - Cross-suite accent isolation
 *
 * @see contracts/objectPlacement.ts — 3-6-9 Codex
 * @see components/suites/SuiteModuleGrid.tsx — launch orchestration
 */
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// ── Mocks ──────────────────────────────────────────────────────────────
vi.mock('../../components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div data-component="Card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

vi.mock('../../lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

vi.mock('../../hooks/useCountyStats', () => ({
  useCountyStats: () => ({
    stats: {
      totalParcels: 89247,
      parcelsByCity: { Kennewick: 30000, Richland: 25000, 'West Richland': 10000 },
      parcelsByType: { residential: 60000, commercial: 12000, agricultural: 5000 },
      averageAssessedValue: 285000,
      assessedThisYear: 45000,
      pendingAssessments: 1200,
      assessmentCompletionPercent: 86.5,
      activeAppeals: 245,
      totalLevyRevenue: 125000000,
    },
  }),
}));

vi.mock('../../components/suites/SuiteModuleGrid', () => ({
  SuiteModuleGrid: (props: any) => <div data-testid="mock-module-grid" data-accent={props.accentVar}>{props.modules?.length ?? 0} modules</div>,
}));

vi.mock('../../components/suites/OperationalQueue', () => ({
  OperationalQueue: (props: any) => <div data-testid="mock-queue" data-title={props.title} />,
}));

vi.mock('../../components/workbench/ParcelContextBanner', () => ({
  ParcelContextBanner: () => <div data-testid="mock-parcel-banner" />,
}));

vi.mock('lucide-react', () => {
  const Icon = (props: any) => <svg data-slot="icon" {...props} />;
  // Explicit exports for all icons used across Forge, Atlas, and Dais suite homes
  return {
    // Shared
    ArrowLeft: Icon, Search: Icon,
    // Forge icons
    Hammer: Icon, Calculator: Icon, BarChart3: Icon, Scale: Icon,
    TrendingUp: Icon, FileSearch: Icon, Gavel: Icon, ShieldCheck: Icon,
    LineChart: Icon, PieChart: Icon, MapPin: Icon, DollarSign: Icon,
    // Atlas icons
    Map: Icon, Layers: Icon, Crosshair: Icon, Printer: Icon,
    Download: Icon, Database: Icon,
    // Dais icons
    Receipt: Icon, Landmark: Icon, CheckCircle2: Icon, HardHat: Icon,
    Calendar: Icon, Bot: Icon, LayoutDashboard: Icon,
  };
});

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
// 1. Suite Home Rendering — All 3 Mature Suites
// ============================================================================

describe('Suite Home Rendering', () => {
  it('ForgeSuiteHome renders with root testid', () => {
    render(<MemoryRouter><ForgeSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('suite-forge-root')).toBeDefined();
  });

  it('AtlasSuiteHome renders with root testid', () => {
    render(<MemoryRouter><AtlasSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('suite-atlas-root')).toBeDefined();
  });

  it('DaisSuiteHome renders with root testid', () => {
    render(<MemoryRouter><DaisSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('suite-dais-root')).toBeDefined();
  });
});

// ============================================================================
// 2. Suite Chrome Structure — testids on sub-sections
// ============================================================================

describe('Suite Chrome Structure', () => {
  it('ForgeSuiteHome has stats, modules, and queue sections', () => {
    render(<MemoryRouter><ForgeSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('forge-stats')).toBeDefined();
    expect(screen.getByTestId('forge-modules')).toBeDefined();
    expect(screen.getByTestId('forge-queue')).toBeDefined();
  });

  it('AtlasSuiteHome has stats, modules, and queue sections', () => {
    render(<MemoryRouter><AtlasSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('atlas-stats')).toBeDefined();
    expect(screen.getByTestId('atlas-modules')).toBeDefined();
    expect(screen.getByTestId('atlas-queue')).toBeDefined();
  });

  it('DaisSuiteHome has stats, modules, and queue sections', () => {
    render(<MemoryRouter><DaisSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('dais-stats')).toBeDefined();
    expect(screen.getByTestId('dais-modules')).toBeDefined();
    expect(screen.getByTestId('dais-queue')).toBeDefined();
  });
});

// ============================================================================
// 3. Cross-Suite Accent Isolation
// ============================================================================

describe('Cross-Suite Accent Isolation', () => {
  it('ForgeSuiteHome passes --tf-suite-forge accent to module grid', () => {
    render(<MemoryRouter><ForgeSuiteHome /></MemoryRouter>);
    const grid = screen.getByTestId('mock-module-grid');
    expect(grid.getAttribute('data-accent')).toBe('--tf-suite-forge');
  });

  it('AtlasSuiteHome passes --tf-suite-atlas accent to module grid', () => {
    render(<MemoryRouter><AtlasSuiteHome /></MemoryRouter>);
    const grid = screen.getByTestId('mock-module-grid');
    expect(grid.getAttribute('data-accent')).toBe('--tf-suite-atlas');
  });

  it('DaisSuiteHome passes --tf-suite-dais accent to module grid', () => {
    render(<MemoryRouter><DaisSuiteHome /></MemoryRouter>);
    const grid = screen.getByTestId('mock-module-grid');
    expect(grid.getAttribute('data-accent')).toBe('--tf-suite-dais');
  });
});
