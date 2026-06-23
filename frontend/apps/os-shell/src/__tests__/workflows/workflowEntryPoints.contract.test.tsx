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
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import DaisSuiteHome from '../../pages/suites/DaisSuiteHome';
import ForgeSuiteHome from '../../pages/suites/ForgeSuiteHome';
import AtlasSuiteHome from '../../pages/suites/AtlasSuiteHome';

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

vi.mock('../../api/pilotApi', () => ({
  invokeTool: vi.fn(),
}));

vi.mock('lucide-react', () => {
  const Icon = (props: any) => <svg data-slot="icon" {...props} />;
  return {
    ArrowLeft: Icon, Search: Icon, Hammer: Icon, Calculator: Icon,
    BarChart3: Icon, Scale: Icon, TrendingUp: Icon, FileSearch: Icon,
    Gavel: Icon, ShieldCheck: Icon, LineChart: Icon, PieChart: Icon,
    MapPin: Icon, DollarSign: Icon, Map: Icon, Layers: Icon,
    Crosshair: Icon, Printer: Icon, Download: Icon, Database: Icon, BarChart2: Icon, Globe: Icon,
    Receipt: Icon, Landmark: Icon, CheckCircle2: Icon, HardHat: Icon,
    Calendar: Icon, Bot: Icon, LayoutDashboard: Icon, Pencil: Icon, ClipboardList: Icon, Mail: Icon, FileCheck: Icon,
  };
});

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
    expect(screen.getByTestId('forge-primary-applications')).toBeDefined();
    expect(screen.getByTestId('forge-queue')).toBeDefined();
  });

  // ForgeSuiteHome uses an inline primary-applications section (not SuiteModuleGrid).
  // All forge modules use standalone launch mode.
  it('Forge primary-applications section contains launchable module buttons', () => {
    const { container } = render(<MemoryRouter><ForgeSuiteHome /></MemoryRouter>);
    const section = container.querySelector('[data-testid="forge-primary-applications"]');
    expect(section).toBeTruthy();
    const buttons = section!.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('Forge primary modules have labels', () => {
    const { container } = render(<MemoryRouter><ForgeSuiteHome /></MemoryRouter>);
    const section = container.querySelector('[data-testid="forge-primary-applications"]');
    const buttons = section!.querySelectorAll('button');
    buttons.forEach((btn) => {
      expect(btn.textContent!.trim().length).toBeGreaterThan(0);
    });
  });

  it('Forge has at least one enabled (non-queued) primary module', () => {
    const { container } = render(<MemoryRouter><ForgeSuiteHome /></MemoryRouter>);
    const section = container.querySelector('[data-testid="forge-primary-applications"]');
    const enabled = section!.querySelectorAll('button:not([disabled])');
    expect(enabled.length).toBeGreaterThan(0);
  });

  it('clicking an enabled Forge primary module invokes activateModule', async () => {
    const user = userEvent.setup();
    const { container } = render(<MemoryRouter><ForgeSuiteHome /></MemoryRouter>);
    const section = container.querySelector('[data-testid="forge-primary-applications"]');
    const enabled = Array.from(section!.querySelectorAll('button:not([disabled])')) as HTMLElement[];
    expect(enabled.length).toBeGreaterThan(0);
    mockActivateModule.mockClear();
    await user.click(enabled[0]);
    expect(mockActivateModule).toHaveBeenCalled();
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

  it('Atlas module grid contains standalone TerraAtlas Suite app entries', () => {
    render(<MemoryRouter><AtlasSuiteHome /></MemoryRouter>);
    const grid = screen.getByTestId('mock-module-grid');
    const atlasStandalone = grid.querySelectorAll('[data-launch-mode="standalone"][data-module-id="atlas"]');
    const atlasWorkbench = grid.querySelectorAll('[data-workbench-tab="atlas"]');
    expect(atlasStandalone.length).toBeGreaterThan(0);
    expect(atlasWorkbench).toHaveLength(0);
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

  it('clicking Atlas Suite modules invokes standalone Atlas activation contract', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AtlasSuiteHome /></MemoryRouter>);
    const grid = screen.getByTestId('mock-module-grid');
    const standaloneButtons = Array.from(grid.querySelectorAll('[data-launch-mode="standalone"]')) as HTMLElement[];
    expect(standaloneButtons.length).toBeGreaterThan(0);

    for (const btn of standaloneButtons) {
      mockActivateModule.mockClear();
      await user.click(btn);
      expect(mockActivateModule).toHaveBeenCalledWith(
        'atlas',
        expect.objectContaining({ source: 'start_menu' })
      );
    }
  });
});

// ════════════════════════════════════════════════════════════════════════
// 4. Cross-Suite Entry Point Consistency
// ════════════════════════════════════════════════════════════════════════

describe('Cross-Suite Entry Point Consistency', () => {
  // Note: ForgeSuiteHome is architecturally distinct — it uses its own inline
  // primary-applications grid rather than the shared SuiteModuleGrid, and all
  // Forge modules use standalone launch mode (no workbench tab targeting).

  it('all 3 suites expose stats, module surface, and queue structural sections', () => {
    const suites = [
      { Component: DaisSuiteHome, prefix: 'dais', moduleTestId: 'dais-modules' },
      { Component: ForgeSuiteHome, prefix: 'forge', moduleTestId: 'forge-primary-applications' },
      { Component: AtlasSuiteHome, prefix: 'atlas', moduleTestId: 'atlas-modules' },
    ];

    for (const { Component, prefix, moduleTestId } of suites) {
      const { unmount } = render(<MemoryRouter><Component /></MemoryRouter>);
      // Every suite home has the constitutional 3-section structure
      expect(screen.getByTestId(`${prefix}-stats`)).toBeDefined();
      expect(screen.getByTestId(moduleTestId)).toBeDefined();
      // Queue section is always present (Dais/Atlas use OperationalQueue mock;
      // Forge implements its own inline queue — both carry the ${prefix}-queue testid)
      expect(screen.getByTestId(`${prefix}-queue`)).toBeDefined();
      unmount();
    }
  });

  it('Dais has workbench-mode entry points; Atlas and Forge expose standalone Suite entries', () => {
    // Dais remains workbench-targeted for its parcel workflow.
    const { unmount: unmountDais } = render(<MemoryRouter><DaisSuiteHome /></MemoryRouter>);
    const daisWorkbench = screen.getByTestId('mock-module-grid').querySelectorAll('[data-launch-mode="workbench"]');
    expect(daisWorkbench.length).toBeGreaterThan(0);
    unmountDais();

    // Atlas is the /atlas Suite surface in this WO, not the Property Workbench Atlas tab.
    const { unmount: unmountAtlas } = render(<MemoryRouter><AtlasSuiteHome /></MemoryRouter>);
    const atlasStandalone = screen.getByTestId('mock-module-grid').querySelectorAll('[data-launch-mode="standalone"]');
    const atlasWorkbench = screen.getByTestId('mock-module-grid').querySelectorAll('[data-launch-mode="workbench"]');
    expect(atlasStandalone.length).toBeGreaterThan(0);
    expect(atlasWorkbench).toHaveLength(0);
    unmountAtlas();

    // Forge uses its own inline primary-applications section with standalone modules
    const { container, unmount: unmountForge } = render(<MemoryRouter><ForgeSuiteHome /></MemoryRouter>);
    const section = container.querySelector('[data-testid="forge-primary-applications"]');
    expect(section).toBeTruthy();
    const buttons = section!.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
    unmountForge();
  });

  it('no suite home renders an empty module surface', () => {
    // Dais and Atlas expose modules via the shared SuiteModuleGrid
    for (const Component of [DaisSuiteHome, AtlasSuiteHome]) {
      const { unmount } = render(<MemoryRouter><Component /></MemoryRouter>);
      const buttons = screen.getByTestId('mock-module-grid').querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
      unmount();
    }

    // Forge exposes modules via its own inline primary-applications section
    const { container, unmount: unmountForge } = render(<MemoryRouter><ForgeSuiteHome /></MemoryRouter>);
    const section = container.querySelector('[data-testid="forge-primary-applications"]');
    expect(section).toBeTruthy();
    const buttons = section!.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
    unmountForge();
  });
});
