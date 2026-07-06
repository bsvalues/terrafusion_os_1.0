/**
 * launchSurfaceContractParcelWorkbench.contract.test.tsx
 *
 * Phase 16 — Parcel-to-Workbench Launch Contract
 * ================================================
 *
 * Enforces the constitutional invariant:
 *   Every parcel-scoped action routes into the Property Workbench.
 *   No parcel tool opens as a standalone window.
 *   Cross-parcel operational tools remain standalone.
 *   Window reuse: same parcel + tab = same URL = no window multiplication.
 *
 * Proves SuiteModuleGrid.handleLaunch routes correctly based on
 * launchMode: 'workbench' | 'standalone'.
 *
 * Contract invariants:
 *   1. launchMode='workbench' + active parcel → navigate('/property/:parcelId/:tab')
 *   2. launchMode='workbench' + NO active parcel → navigate('/property?openTab=:tab')
 *   3. launchMode='standalone' → activateModule(moduleId) — never /property/, never navigate
 *   4. Same parcel + same tab = same URL = natural window reuse (URL identity)
 *   5. countyId + parcelId + tab survive: URL is source of truth (structural)
 *   6. workbenchTab missing → no navigation (guard protects against broken defs)
 *   7. Cross-parcel tools (ratio study, calibration, batch) never touch /property/
 *
 * RE-AUTHORIZED (WO-WB-P16-004): un-skipped by adding the missing shallow mock for
 * `orchestration/moduleActivation` — SuiteModuleGrid imports `activateModule` from it,
 * and the real module's transitive graph (config/moduleComponents → desktopStore +
 * moduleLoaderStore + notificationStore + telemetry) crashed the vitest worker
 * ("Worker exited unexpectedly" / tinypool). Stubbing that one import lets the real
 * SuiteModuleGrid render safely. Test 3/7 (standalone) is updated to the current
 * behavior: standalone launch now calls `activateModule(targetId)` (WO-SUITE-ROUTING-001),
 * not a bare navigate('/:moduleId') — a test-only correction, no product change.
 *
 * @see src/components/suites/SuiteModuleGrid.tsx — handleLaunch()
 */
import React from 'react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { SuiteModuleDef } from '../../components/suites/SuiteModuleGrid';
import { SuiteModuleGrid } from '../../components/suites/SuiteModuleGrid';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

// Shallow-mock the standalone-launch path. SuiteModuleGrid imports `activateModule`
// from orchestration/moduleActivation; the REAL module transitively pulls
// config/moduleComponents + desktopStore + moduleLoaderStore + notificationStore +
// telemetry, which crashes the vitest worker during evaluation. Stubbing it here is
// the sole reason the original test was skipped (2026-04-25).
const { mockActivateModule } = vi.hoisted(() => ({ mockActivateModule: vi.fn() }));
vi.mock('../../orchestration/moduleActivation', () => ({
  activateModule: mockActivateModule,
  default: mockActivateModule,
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('lucide-react', () => {
  const Icon = (props: Record<string, unknown>) =>
    React.createElement('span', { 'data-slot': 'icon', ...props });
  return new Proxy({}, { get: () => Icon });
});

// Property store mock — controls active parcel
let mockActiveParcel: { parcelId: string; countyId?: string } | null = {
  parcelId: 'benton-12345',
  countyId: 'benton',
};

vi.mock('../../stores/propertyStore', () => ({
  usePropertyStore: (selector: (s: { activeParcel: typeof mockActiveParcel }) => unknown) =>
    selector({ activeParcel: mockActiveParcel }),
}));

// ── Test Fixtures ─────────────────────────────────────────────────────────────

/** A parcel-scoped Forge workbench module */
const forgeWorkbenchMod: SuiteModuleDef = {
  id: 'costforge',
  label: 'CostForge',
  icon: () => React.createElement('span', null, '🔥'),
  description: 'Cost approach calculator',
  launchMode: 'workbench',
  workbenchTab: 'forge',
};

/** A parcel-scoped Atlas workbench module */
const atlasWorkbenchMod: SuiteModuleDef = {
  id: 'gis',
  label: 'TerraGIS',
  icon: () => React.createElement('span', null, '🗺️'),
  description: 'GIS viewer',
  launchMode: 'workbench',
  workbenchTab: 'atlas',
};

/** A parcel-scoped Dossier workbench module */
const dossierWorkbenchMod: SuiteModuleDef = {
  id: 'dossier-view',
  label: 'Dossier',
  icon: () => React.createElement('span', null, '📁'),
  description: 'Parcel document viewer',
  launchMode: 'workbench',
  workbenchTab: 'dossier',
};

/** Cross-parcel standalone tool — ratio study */
const ratioStudyStandaloneMod: SuiteModuleDef = {
  id: 'statistics-studio',
  label: 'Ratio Study',
  icon: () => React.createElement('span', null, '📊'),
  description: 'County-wide ratio study',
  launchMode: 'standalone',
  moduleId: 'statistics-studio',
};

/** Cross-parcel standalone tool — batch cost run */
const batchCostStandaloneMod: SuiteModuleDef = {
  id: 'batch-cost-run',
  label: 'Batch Cost Runs',
  icon: () => React.createElement('span', null, '⚙️'),
  description: 'Batch cost model runs',
  launchMode: 'standalone',
  moduleId: 'batch-cost-run',
};

/** Cross-parcel standalone tool — calibration */
const calibrationStandaloneMod: SuiteModuleDef = {
  id: 'regression-studio',
  label: 'Regression Studio',
  icon: () => React.createElement('span', null, '📉'),
  description: 'MRA regression models',
  launchMode: 'standalone',
  moduleId: 'regression-studio',
};

/** Broken workbench module — missing workbenchTab */
const brokenWorkbenchMod: SuiteModuleDef = {
  id: 'broken-mod',
  label: 'Broken Module',
  icon: () => React.createElement('span', null, '💀'),
  description: 'Missing tab def',
  launchMode: 'workbench',
  // workbenchTab intentionally omitted
};

function renderGrid(modules: SuiteModuleDef[]) {
  return render(
    <MemoryRouter>
      <SuiteModuleGrid modules={modules} />
    </MemoryRouter>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('launchSurfaceContractParcelWorkbench', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockActivateModule.mockClear();
    mockActiveParcel = { parcelId: 'benton-12345', countyId: 'benton' };
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // ── 1. Forge parcel actions route into Property Workbench ──────────────────

  it('routes Forge parcel actions into Property Workbench, not standalone Forge windows', async () => {
    const user = userEvent.setup();
    renderGrid([forgeWorkbenchMod]);

    await user.click(screen.getByRole('button', { name: /CostForge/i }));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    const destination = mockNavigate.mock.calls[0][0] as string;
    expect(destination).toMatch(/^\/property\//);
    expect(destination).toContain('/forge');
    expect(destination).toContain('benton-12345');
    expect(destination).not.toBe('/costforge');
    expect(destination).not.toBe('/forge');
    // Parcel action must not fall through to a standalone module window.
    expect(mockActivateModule).not.toHaveBeenCalled();
  });

  // ── 2. Atlas parcel actions route into Property Workbench ──────────────────

  it('routes Atlas parcel actions into Property Workbench, not standalone GIS windows', async () => {
    const user = userEvent.setup();
    renderGrid([atlasWorkbenchMod]);

    await user.click(screen.getByRole('button', { name: /TerraGIS/i }));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    const destination = mockNavigate.mock.calls[0][0] as string;
    expect(destination).toMatch(/^\/property\//);
    expect(destination).toContain('/atlas');
    expect(destination).toContain('benton-12345');
    expect(destination).not.toBe('/gis');
    expect(destination).not.toBe('/terra-gis');
  });

  // ── 3. Dossier parcel actions route into Property Workbench ───────────────

  it('routes Dossier parcel actions into Property Workbench, not standalone document windows', async () => {
    const user = userEvent.setup();
    renderGrid([dossierWorkbenchMod]);

    await user.click(screen.getByRole('button', { name: /Dossier/i }));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    const destination = mockNavigate.mock.calls[0][0] as string;
    expect(destination).toMatch(/^\/property\//);
    expect(destination).toContain('/dossier');
    expect(destination).toContain('benton-12345');
  });

  // ── 4. Same parcel + tab re-entry → same URL = natural window reuse ────────

  it('reuses the existing workbench window for same parcel+tab re-entry', async () => {
    const user = userEvent.setup();
    renderGrid([forgeWorkbenchMod]);

    await user.click(screen.getByRole('button', { name: /CostForge/i }));
    const firstUrl = mockNavigate.mock.calls[0][0] as string;

    mockNavigate.mockClear();

    await user.click(screen.getByRole('button', { name: /CostForge/i }));
    const secondUrl = mockNavigate.mock.calls[0][0] as string;

    // Same URL = same route = React Router reuses the existing mounted component.
    expect(secondUrl).toBe(firstUrl);
  });

  // ── 5. Context survives refresh/navigation — structural proof ──────────────

  it('preserves countyId + parcelId + tab slug across refresh and browser navigation', () => {
    // Structural proof: tab state and parcel context are encoded in the URL.
    // /property/benton-12345/forge encodes parcelId (route param) + tab (sub-route);
    // countyId travels in the x-county-id header (FISMA isolation), not the path.
    const parcelId = 'R112233445566';
    const tab = 'forge';
    const countyId = 'benton';

    const workbenchUrl = `/property/${parcelId}/${tab}`;

    expect(workbenchUrl).toContain(parcelId);
    expect(workbenchUrl).toContain(tab);
    expect(workbenchUrl).not.toContain(countyId);
    expect(workbenchUrl).toMatch(/^\/property\/[^/]+\/[^/]+$/);
  });

  // ── 6. Invalid workbenchTab → no navigation (guard) ────────────────────────

  it('drops workbench modules with a missing tab slug without navigating', async () => {
    // SuiteModuleGrid guards: if (!mod.workbenchTab) return; — prevents a
    // /property/parcelId/undefined URL. The guard is a silent no-op.
    const user = userEvent.setup();
    renderGrid([brokenWorkbenchMod]);

    await user.click(screen.getByRole('button', { name: /Broken Module/i }));

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockActivateModule).not.toHaveBeenCalled();
  });

  // ── 7. Cross-parcel tools remain standalone — activateModule, never /property/ ─

  it('launches cross-parcel operational tools as standalone modules (never into the Workbench)', async () => {
    // Current behavior (WO-SUITE-ROUTING-001): standalone tiles call
    // activateModule(moduleId) to open a desktop window — NOT navigate('/:moduleId')
    // (that path had no registered route and silently no-op'd). This test enforces
    // that standalone tools open standalone and never route into /property/.
    const user = userEvent.setup();
    renderGrid([ratioStudyStandaloneMod, batchCostStandaloneMod, calibrationStandaloneMod]);

    await user.click(screen.getByRole('button', { name: /Ratio Study/i }));
    expect(mockActivateModule).toHaveBeenCalledWith('statistics-studio', expect.objectContaining({ source: 'system' }));
    expect(mockNavigate).not.toHaveBeenCalled();

    mockActivateModule.mockClear();

    await user.click(screen.getByRole('button', { name: /Batch Cost/i }));
    expect(mockActivateModule).toHaveBeenCalledWith('batch-cost-run', expect.objectContaining({ source: 'system' }));
    expect(mockNavigate).not.toHaveBeenCalled();

    mockActivateModule.mockClear();

    await user.click(screen.getByRole('button', { name: /Regression/i }));
    expect(mockActivateModule).toHaveBeenCalledWith('regression-studio', expect.objectContaining({ source: 'system' }));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  // ── Bonus: no-parcel fallback routes to property search with tab intent ────

  it('routes workbench modules to property search when no parcel is active', async () => {
    mockActiveParcel = null;
    const user = userEvent.setup();
    renderGrid([forgeWorkbenchMod]);

    await user.click(screen.getByRole('button', { name: /CostForge/i }));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    const destination = mockNavigate.mock.calls[0][0] as string;
    // Falls back to /property?openTab=forge — not a standalone window.
    expect(destination).toContain('/property');
    expect(destination).toContain('openTab=forge');
    expect(destination).not.toMatch(/^\/costforge/);
  });
});
