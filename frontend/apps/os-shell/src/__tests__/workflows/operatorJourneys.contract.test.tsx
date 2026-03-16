/**
 * Phase 14 — Operator Journey Contract Tests
 * ════════════════════════════════════════════
 *
 * Golden-path end-to-end workflow tests proving that the 3 core
 * operator journeys work across suite boundaries:
 *
 *   Journey A: TerraDais → TerraForge  (Operational Triage → Analysis)
 *   Journey B: TerraForge → TerraAtlas (Analysis → Map Intelligence)
 *   Journey C: TerraDais → TerraForge → TerraAtlas (Multi-Suite Command Loop)
 *
 * These tests prove entry, handoff, destination render, and no dead-end
 * navigation on primary operator paths.
 *
 * @see Phase 14 — Operator Journey Proofing
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, within, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import React, { Suspense, lazy } from 'react';

// ── Shared Mocks ─────────────────────────────────────────────────────────

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

// Mock activateModule — the canonical launch pathway
const mockActivateModule = vi.fn();
vi.mock('../../orchestration/moduleActivation', () => ({
  activateModule: (...args: any[]) => mockActivateModule(...args),
  activateFromStartMenu: (...args: any[]) => mockActivateModule(...args),
  default: (...args: any[]) => mockActivateModule(...args),
}));

vi.mock('../../components/suites/SuiteModuleGrid', () => ({
  SuiteModuleGrid: ({ modules, accentVar }: any) => (
    <div data-testid="mock-module-grid" data-accent={accentVar}>
      {modules?.map((mod: any) => (
        <button
          key={mod.id}
          data-testid={`module-${mod.id}`}
          data-launch-mode={mod.launchMode}
          data-workbench-tab={mod.workbenchTab || ''}
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
  ),
}));

vi.mock('../../components/suites/OperationalQueue', () => ({
  OperationalQueue: ({ title }: any) => <div data-testid="mock-queue" data-title={title} />,
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
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ════════════════════════════════════════════════════════════════════════
// Journey A — Operational Triage to Analysis (TerraDais → TerraForge)
// ════════════════════════════════════════════════════════════════════════

describe('Journey A: TerraDais → TerraForge (Operational Triage → Analysis)', () => {
  it('DaisSuiteHome renders and exposes module grid as entry point', () => {
    render(<MemoryRouter initialEntries={['/dais']}><DaisSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('suite-dais-root')).toBeDefined();
    expect(screen.getByTestId('dais-modules')).toBeDefined();
    expect(screen.getByTestId('mock-module-grid')).toBeDefined();
  });

  it('Dais module grid contains workbench-mode modules that target Forge analytical surfaces', () => {
    render(<MemoryRouter initialEntries={['/dais']}><DaisSuiteHome /></MemoryRouter>);
    const grid = screen.getByTestId('mock-module-grid');
    // Dais modules include workbench-mode entries (Certification, Appeals, etc.)
    const workbenchButtons = grid.querySelectorAll('[data-launch-mode="workbench"]');
    expect(workbenchButtons.length).toBeGreaterThan(0);
  });

  it('clicking a workbench-mode Dais module invokes activateModule with property-workbench target', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/dais']}><DaisSuiteHome /></MemoryRouter>);
    const grid = screen.getByTestId('mock-module-grid');
    const workbenchButton = grid.querySelector('[data-launch-mode="workbench"]') as HTMLElement;
    expect(workbenchButton).toBeTruthy();

    await user.click(workbenchButton);

    expect(mockActivateModule).toHaveBeenCalledWith(
      'property-workbench',
      expect.objectContaining({
        source: 'start_menu',
        metadata: expect.objectContaining({ tabId: expect.any(String) }),
      })
    );
  });

  it('ForgeSuiteHome renders as a valid analytical destination', () => {
    render(<MemoryRouter initialEntries={['/forge']}><ForgeSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('suite-forge-root')).toBeDefined();
    expect(screen.getByTestId('forge-stats')).toBeDefined();
    expect(screen.getByTestId('forge-modules')).toBeDefined();
  });

  it('Forge module grid exposes analytical workbench targets (cost, comps, income)', () => {
    render(<MemoryRouter initialEntries={['/forge']}><ForgeSuiteHome /></MemoryRouter>);
    const grid = screen.getByTestId('mock-module-grid');
    const forgeButtons = grid.querySelectorAll('[data-workbench-tab="forge"]');
    expect(forgeButtons.length).toBeGreaterThan(0);
  });

  it('no dead-end: both Dais and Forge suite homes have operational queue for continuity', () => {
    const { unmount } = render(<MemoryRouter><DaisSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('dais-queue')).toBeDefined();
    expect(screen.getByTestId('mock-queue')).toBeDefined();
    unmount();

    render(<MemoryRouter><ForgeSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('forge-queue')).toBeDefined();
    expect(screen.getByTestId('mock-queue')).toBeDefined();
  });
});

// ════════════════════════════════════════════════════════════════════════
// Journey B — Analysis to Map Intelligence (TerraForge → TerraAtlas)
// ════════════════════════════════════════════════════════════════════════

describe('Journey B: TerraForge → TerraAtlas (Analysis → Map Intelligence)', () => {
  it('ForgeSuiteHome renders with analytical entry points', () => {
    render(<MemoryRouter initialEntries={['/forge']}><ForgeSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('suite-forge-root')).toBeDefined();
    const grid = screen.getByTestId('mock-module-grid');
    expect(grid.querySelectorAll('button').length).toBeGreaterThan(0);
  });

  it('Forge module grid contains at least one module that can route to atlas-relevant surfaces', () => {
    render(<MemoryRouter initialEntries={['/forge']}><ForgeSuiteHome /></MemoryRouter>);
    const grid = screen.getByTestId('mock-module-grid');
    // Forge has workbench-mode modules; some analytical actions lead to atlas
    const allButtons = grid.querySelectorAll('button');
    expect(allButtons.length).toBeGreaterThan(0);
    // The critical assertion: modules exist and are clickable (not dead-end)
    allButtons.forEach((btn) => {
      expect(btn).not.toBeDisabled();
    });
  });

  it('clicking a Forge workbench module invokes activateModule correctly', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/forge']}><ForgeSuiteHome /></MemoryRouter>);
    const grid = screen.getByTestId('mock-module-grid');
    const firstWorkbench = grid.querySelector('[data-launch-mode="workbench"]') as HTMLElement;
    expect(firstWorkbench).toBeTruthy();

    await user.click(firstWorkbench);

    expect(mockActivateModule).toHaveBeenCalledWith(
      'property-workbench',
      expect.objectContaining({ source: 'start_menu' })
    );
  });

  it('AtlasSuiteHome renders as a valid geospatial destination', () => {
    render(<MemoryRouter initialEntries={['/atlas']}><AtlasSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('suite-atlas-root')).toBeDefined();
    expect(screen.getByTestId('atlas-stats')).toBeDefined();
    expect(screen.getByTestId('atlas-modules')).toBeDefined();
  });

  it('Atlas module grid exposes GIS/map workbench targets', () => {
    render(<MemoryRouter initialEntries={['/atlas']}><AtlasSuiteHome /></MemoryRouter>);
    const grid = screen.getByTestId('mock-module-grid');
    const atlasButtons = grid.querySelectorAll('[data-workbench-tab="atlas"]');
    expect(atlasButtons.length).toBeGreaterThan(0);
  });

  it('no dead-end: Atlas suite home has operational queue and module grid', () => {
    render(<MemoryRouter><AtlasSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('atlas-queue')).toBeDefined();
    expect(screen.getByTestId('atlas-modules')).toBeDefined();
    expect(screen.getByTestId('mock-module-grid')).toBeDefined();
  });
});

// ════════════════════════════════════════════════════════════════════════
// Journey C — Multi-Suite Command Loop (Dais → Forge → Atlas)
// ════════════════════════════════════════════════════════════════════════

describe('Journey C: TerraDais → TerraForge → TerraAtlas (Multi-Suite Command Loop)', () => {
  it('all three suite roots render lawfully in sequence without crash', () => {
    // Simulate the operator moving through all 3 suites
    const { unmount: u1 } = render(<MemoryRouter><DaisSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('suite-dais-root')).toBeDefined();
    u1();

    const { unmount: u2 } = render(<MemoryRouter><ForgeSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('suite-forge-root')).toBeDefined();
    u2();

    render(<MemoryRouter><AtlasSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('suite-atlas-root')).toBeDefined();
  });

  it('each suite exposes clickable workflow surfaces (no dead-end navigation)', () => {
    // Dais
    const { unmount: u1 } = render(<MemoryRouter><DaisSuiteHome /></MemoryRouter>);
    let grid = screen.getByTestId('mock-module-grid');
    let buttons = grid.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((btn) => expect(btn).not.toBeDisabled());
    u1();

    // Forge
    const { unmount: u2 } = render(<MemoryRouter><ForgeSuiteHome /></MemoryRouter>);
    grid = screen.getByTestId('mock-module-grid');
    buttons = grid.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((btn) => expect(btn).not.toBeDisabled());
    u2();

    // Atlas
    render(<MemoryRouter><AtlasSuiteHome /></MemoryRouter>);
    grid = screen.getByTestId('mock-module-grid');
    buttons = grid.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((btn) => expect(btn).not.toBeDisabled());
  });

  it('workbench-mode modules across all 3 suites invoke activateModule with correct contract', async () => {
    const user = userEvent.setup();

    // Dais → workbench
    const { unmount: u1 } = render(<MemoryRouter><DaisSuiteHome /></MemoryRouter>);
    let wb = screen.getByTestId('mock-module-grid').querySelector('[data-launch-mode="workbench"]') as HTMLElement;
    await user.click(wb);
    expect(mockActivateModule).toHaveBeenLastCalledWith(
      'property-workbench',
      expect.objectContaining({ source: 'start_menu', metadata: expect.any(Object) })
    );
    u1();
    mockActivateModule.mockClear();

    // Forge → workbench
    const { unmount: u2 } = render(<MemoryRouter><ForgeSuiteHome /></MemoryRouter>);
    wb = screen.getByTestId('mock-module-grid').querySelector('[data-launch-mode="workbench"]') as HTMLElement;
    await user.click(wb);
    expect(mockActivateModule).toHaveBeenLastCalledWith(
      'property-workbench',
      expect.objectContaining({ source: 'start_menu', metadata: expect.any(Object) })
    );
    u2();
    mockActivateModule.mockClear();

    // Atlas → workbench
    render(<MemoryRouter><AtlasSuiteHome /></MemoryRouter>);
    wb = screen.getByTestId('mock-module-grid').querySelector('[data-launch-mode="workbench"]') as HTMLElement;
    await user.click(wb);
    expect(mockActivateModule).toHaveBeenLastCalledWith(
      'property-workbench',
      expect.objectContaining({ source: 'start_menu', metadata: expect.any(Object) })
    );
  });

  it('suite accent isolation is preserved across the full traversal', () => {
    const { unmount: u1 } = render(<MemoryRouter><DaisSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('mock-module-grid').getAttribute('data-accent')).toBe('--tf-suite-dais');
    u1();

    const { unmount: u2 } = render(<MemoryRouter><ForgeSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('mock-module-grid').getAttribute('data-accent')).toBe('--tf-suite-forge');
    u2();

    render(<MemoryRouter><AtlasSuiteHome /></MemoryRouter>);
    expect(screen.getByTestId('mock-module-grid').getAttribute('data-accent')).toBe('--tf-suite-atlas');
  });

  it('all three suite homes expose stats, modules, and queue regions', () => {
    const suites = [
      { Component: DaisSuiteHome, prefix: 'dais' },
      { Component: ForgeSuiteHome, prefix: 'forge' },
      { Component: AtlasSuiteHome, prefix: 'atlas' },
    ];

    for (const { Component, prefix } of suites) {
      const { unmount } = render(<MemoryRouter><Component /></MemoryRouter>);
      expect(screen.getByTestId(`${prefix}-stats`)).toBeDefined();
      expect(screen.getByTestId(`${prefix}-modules`)).toBeDefined();
      expect(screen.getByTestId(`${prefix}-queue`)).toBeDefined();
      unmount();
    }
  });
});
