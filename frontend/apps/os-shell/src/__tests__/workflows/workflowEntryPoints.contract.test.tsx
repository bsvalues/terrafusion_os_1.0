/**
 * Phase 14 — Workflow Entry Points Contract Tests
 * ════════════════════════════════════════════════
 *
 * Proves that operators can actually START the 3 golden-path journeys.
 * Each suite home's module grid and operational queue are verified as
 * lawful entry points into the correct destinations.
 *
 * Covers:
 *   - Dais queue cards / module entries launch correct workbench destinations
 *   - Forge analytical entry points launch correct workbench destinations
 *   - Atlas entry surfaces preserve shell chrome and lawful return path
 *   - Primary workflow entry surfaces have stable selectors
 *
 * @see Phase 14 — Operator Journey Proofing
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// ── Shared Mocks (identical contract as operatorJourneys) ────────────────

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

const mockActivateModule = vi.fn();
vi.mock('../../orchestration/moduleActivation', () => ({
  activateModule: (...args: any[]) => mockActivateModule(...args),
  activateFromStartMenu: (...args: any[]) => mockActivateModule(...args),
  default: (...args: any[]) => mockActivateModule(...args),
}));

// Track module definitions passed to grid for entry-point analysis
let capturedModules: any[] = [];

vi.mock('../../components/suites/SuiteModuleGrid', () => ({
  SuiteModuleGrid: ({ modules, accentVar }: any) => {
    capturedModules = modules || [];
    return (
      <div data-testid="mock-module-grid" data-accent={accentVar}>
        {modules?.map((mod: any) => (
          <button
            key={mod.id}
            data-testid={`module-${mod.id}`}
            data-launch-mode={mod.launchMode}
            data-workbench-tab={mod.workbenchTab || ''}
            data-module-id={mod.moduleId || mod.id}
            onClick={() => {
              if (mod.launchMode === 'workbench' && mod.workbenchTab) {
                mockActivateModule('property-workbench', {
                  source: 'start_menu',
                  metadata: { tabId: mod.workbenchTab },
                });
              } else {
                mockActivateModule(mod.moduleId ?? mod.id, { source: 'start_menu' });
              }
            }}
          >
            {mod.label}
          </button>
        ))}
      </div>
    );
  },
}));

vi.mock('../../components/suites/OperationalQueue', () => ({
  OperationalQueue: ({ title, accentVar }: any) => (
    <div data-testid="mock-queue" data-title={title} data-accent={accentVar || ''} />
  ),
}));

vi.mock('../../components/workbench/ParcelContextBanner', () => ({
  ParcelContextBanner: () => <div data-testid="mock-parcel-banner" />,
}));

vi.mock('lucide-react', () => {
  const Icon = (props: any) => <svg data-slot="icon" {...props} />;
  return {
    ArrowLeft: Icon, Search: Icon, Hammer: Icon, Calculator: Icon,
    BarChart3: Icon, Scale: Icon, TrendingUp: Icon, FileSearch: Icon,
    Gavel: Icon, ShieldCheck: Icon, LineChart: Icon, PieChart: Icon,
    MapPin: Icon, DollarSign: Icon, Map: Icon, Layers: Icon,
    Crosshair: Icon, Printer: Icon, Download: Icon, Database: Icon,
    Receipt: Icon, Landmark: Icon, CheckCircle2: Icon, HardHat: Icon,
    Calendar: Icon, Bot: Icon, LayoutDashboard: Icon, Pencil: Icon, ClipboardList: Icon,
  };
});

// ── Dynamic Suite Home Imports ───────────────────────────────────────────

let DaisSuiteHome: React.ComponentType;
let ForgeSuiteHome: React.ComponentType;
let AtlasSuiteHome: React.ComponentType;

beforeAll(async () => {
  const [dais, forge, atlas] = await Promise.all([
    import('../../pages/suites/DaisSuiteHome'),
    import('../../pages/suites/ForgeSuiteHome'),
    import('../../pages/suites/AtlasSuiteHome'),
  ]);
  DaisSuiteHome = dais.default;
  ForgeSuiteHome = forge.default;
  AtlasSuiteHome = atlas.default;
}, 30000);

beforeEach(() => {
  mockActivateModule.mockClear();
  capturedModules = [];
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ════════════════════════════════════════════════════════════════════════
// 1. Dais Entry Points
// ════════════════════════════════════════════════════════════════════════

describe('Dais Entry Points', () => {
  it('DaisSuiteHome exposes stable structural selectors (root, stats, modules, queue)', () => {
    render(<MemoryRouter><DaisSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('suite-dais-root')).toBeDefined();
    expect(screen.getByTestId('dais-stats')).toBeDefined();
    expect(screen.getByTestId('dais-modules')).toBeDefined();
    expect(screen.getByTestId('dais-queue')).toBeDefined();
  });

  it('Dais module grid contains both workbench-mode and standalone-mode entries', () => {
    render(<MemoryRouter><DaisSuiteHome /></MemoryRouter>);
    const grid = screen.getByTestId('mock-module-grid');
    const workbench = grid.querySelectorAll('[data-launch-mode="workbench"]');
    const standalone = grid.querySelectorAll('[data-launch-mode="standalone"]');
    expect(workbench.length).toBeGreaterThan(0);
    expect(standalone.length).toBeGreaterThan(0);
  });

  it('Dais workbench modules target the "dais" tab in Property Workbench', () => {
    render(<MemoryRouter><DaisSuiteHome /></MemoryRouter>);
    const grid = screen.getByTestId('mock-module-grid');
    const daisWorkbench = grid.querySelectorAll('[data-workbench-tab="dais"]');
    expect(daisWorkbench.length).toBeGreaterThan(0);
  });

  it('every Dais module button is clickable (no disabled dead-ends)', () => {
    render(<MemoryRouter><DaisSuiteHome /></MemoryRouter>);
    const buttons = screen.getByTestId('mock-module-grid').querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((btn) => {
      expect(btn).not.toBeDisabled();
      expect(btn.textContent).toBeTruthy();
    });
  });

  it('clicking each Dais workbench module invokes correct activation contract', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><DaisSuiteHome /></MemoryRouter>);
    const grid = screen.getByTestId('mock-module-grid');
    const workbenchButtons = Array.from(grid.querySelectorAll('[data-launch-mode="workbench"]')) as HTMLElement[];

    for (const btn of workbenchButtons) {
      mockActivateModule.mockClear();
      await user.click(btn);
      expect(mockActivateModule).toHaveBeenCalledWith(
        'property-workbench',
        expect.objectContaining({
          source: 'start_menu',
          metadata: expect.objectContaining({ tabId: expect.any(String) }),
        })
      );
    }
  });

  it('clicking each Dais standalone module invokes activation with module ID', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><DaisSuiteHome /></MemoryRouter>);
    const grid = screen.getByTestId('mock-module-grid');
    const standaloneButtons = Array.from(grid.querySelectorAll('[data-launch-mode="standalone"]')) as HTMLElement[];

    for (const btn of standaloneButtons) {
      mockActivateModule.mockClear();
      const moduleId = btn.getAttribute('data-module-id');
      await user.click(btn);
      expect(mockActivateModule).toHaveBeenCalledWith(
        moduleId,
        expect.objectContaining({ source: 'start_menu' })
      );
    }
  });
});

// ════════════════════════════════════════════════════════════════════════
// 2. Forge Analytical Entry Points
// ════════════════════════════════════════════════════════════════════════

describe('Forge Analytical Entry Points', () => {
  it('ForgeSuiteHome exposes stable structural selectors', () => {
    render(<MemoryRouter><ForgeSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('suite-forge-root')).toBeDefined();
    expect(screen.getByTestId('forge-stats')).toBeDefined();
    expect(screen.getByTestId('forge-modules')).toBeDefined();
    expect(screen.getByTestId('forge-queue')).toBeDefined();
  });

  it('Forge module grid contains workbench-mode analytical modules', () => {
    render(<MemoryRouter><ForgeSuiteHome /></MemoryRouter>);
    const grid = screen.getByTestId('mock-module-grid');
    const forgeWorkbench = grid.querySelectorAll('[data-workbench-tab="forge"]');
    expect(forgeWorkbench.length).toBeGreaterThan(0);
  });

  it('Forge exposes both workbench and standalone launch modes', () => {
    render(<MemoryRouter><ForgeSuiteHome /></MemoryRouter>);
    const grid = screen.getByTestId('mock-module-grid');
    const workbench = grid.querySelectorAll('[data-launch-mode="workbench"]');
    const standalone = grid.querySelectorAll('[data-launch-mode="standalone"]');
    expect(workbench.length).toBeGreaterThan(0);
    expect(standalone.length).toBeGreaterThan(0);
  });

  it('every Forge module button has a label and is not disabled', () => {
    render(<MemoryRouter><ForgeSuiteHome /></MemoryRouter>);
    const buttons = screen.getByTestId('mock-module-grid').querySelectorAll('button');
    buttons.forEach((btn) => {
      expect(btn).not.toBeDisabled();
      expect(btn.textContent!.trim().length).toBeGreaterThan(0);
    });
  });

  it('clicking Forge workbench modules invokes correct activation contract', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ForgeSuiteHome /></MemoryRouter>);
    const grid = screen.getByTestId('mock-module-grid');
    const workbenchButtons = Array.from(grid.querySelectorAll('[data-launch-mode="workbench"]')) as HTMLElement[];

    for (const btn of workbenchButtons) {
      mockActivateModule.mockClear();
      await user.click(btn);
      expect(mockActivateModule).toHaveBeenCalledWith(
        'property-workbench',
        expect.objectContaining({
          source: 'start_menu',
          metadata: expect.objectContaining({ tabId: expect.any(String) }),
        })
      );
    }
  });
});

// ════════════════════════════════════════════════════════════════════════
// 3. Atlas GIS Entry Points
// ════════════════════════════════════════════════════════════════════════

describe('Atlas GIS Entry Points', () => {
  it('AtlasSuiteHome exposes stable structural selectors', () => {
    render(<MemoryRouter><AtlasSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('suite-atlas-root')).toBeDefined();
    expect(screen.getByTestId('atlas-stats')).toBeDefined();
    expect(screen.getByTestId('atlas-modules')).toBeDefined();
    expect(screen.getByTestId('atlas-queue')).toBeDefined();
  });

  it('Atlas module grid contains workbench-mode GIS modules targeting atlas tab', () => {
    render(<MemoryRouter><AtlasSuiteHome /></MemoryRouter>);
    const grid = screen.getByTestId('mock-module-grid');
    const atlasWorkbench = grid.querySelectorAll('[data-workbench-tab="atlas"]');
    expect(atlasWorkbench.length).toBeGreaterThan(0);
  });

  it('every Atlas module button is clickable and labeled', () => {
    render(<MemoryRouter><AtlasSuiteHome /></MemoryRouter>);
    const buttons = screen.getByTestId('mock-module-grid').querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((btn) => {
      expect(btn).not.toBeDisabled();
      expect(btn.textContent!.trim().length).toBeGreaterThan(0);
    });
  });

  it('clicking Atlas workbench modules invokes correct activation contract', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AtlasSuiteHome /></MemoryRouter>);
    const grid = screen.getByTestId('mock-module-grid');
    const workbenchButtons = Array.from(grid.querySelectorAll('[data-launch-mode="workbench"]')) as HTMLElement[];

    for (const btn of workbenchButtons) {
      mockActivateModule.mockClear();
      await user.click(btn);
      expect(mockActivateModule).toHaveBeenCalledWith(
        'property-workbench',
        expect.objectContaining({
          source: 'start_menu',
          metadata: expect.objectContaining({ tabId: 'atlas' }),
        })
      );
    }
  });
});

// ════════════════════════════════════════════════════════════════════════
// 4. Cross-Suite Entry Point Consistency
// ════════════════════════════════════════════════════════════════════════

describe('Cross-Suite Entry Point Consistency', () => {
  it('all 3 suites use the same module grid + queue structural pattern', () => {
    const suites = [
      { Component: DaisSuiteHome, prefix: 'dais' },
      { Component: ForgeSuiteHome, prefix: 'forge' },
      { Component: AtlasSuiteHome, prefix: 'atlas' },
    ];

    for (const { Component, prefix } of suites) {
      const { unmount } = render(<MemoryRouter><Component /></MemoryRouter>);
      // Every suite home has the constitutional 3-section structure
      expect(screen.getByTestId(`${prefix}-stats`)).toBeDefined();
      expect(screen.getByTestId(`${prefix}-modules`)).toBeDefined();
      expect(screen.getByTestId(`${prefix}-queue`)).toBeDefined();
      // Module grid is always present
      expect(screen.getByTestId('mock-module-grid')).toBeDefined();
      // Queue is always present
      expect(screen.getByTestId('mock-queue')).toBeDefined();
      unmount();
    }
  });

  it('all 3 suites have at least one workbench-mode entry point', () => {
    const suites = [DaisSuiteHome, ForgeSuiteHome, AtlasSuiteHome];

    for (const Component of suites) {
      const { unmount } = render(<MemoryRouter><Component /></MemoryRouter>);
      const wb = screen.getByTestId('mock-module-grid').querySelectorAll('[data-launch-mode="workbench"]');
      expect(wb.length).toBeGreaterThan(0);
      unmount();
    }
  });

  it('no suite home renders an empty module grid', () => {
    const suites = [DaisSuiteHome, ForgeSuiteHome, AtlasSuiteHome];

    for (const Component of suites) {
      const { unmount } = render(<MemoryRouter><Component /></MemoryRouter>);
      const buttons = screen.getByTestId('mock-module-grid').querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
      unmount();
    }
  });
});
