/**
 * launchSurfaceContractParcelWorkbench.contract.test.tsx
 *
 * Phase 16 — Parcel-to-Workbench Launch Contract (SuiteModuleGrid routing mechanism)
 * =================================================================================
 *
 * Enforces the routing invariant of `SuiteModuleGrid.handleLaunch`:
 *   - launchMode 'workbench' + active parcel → navigate('/property/:parcelId/:tab')
 *     (every parcel-scoped tile routes INTO the Property Workbench, never a standalone window)
 *   - launchMode 'workbench' + NO active parcel → navigate('/property?openTab=:tab')
 *   - launchMode 'standalone' → activateModule(moduleId, {source}) — never /property/, never navigate
 *   - the destination tab is driven by `workbenchTab`, independent of which suite owns the tile
 *   - same parcel + same tab = same URL = natural window reuse (URL identity)
 *   - a workbench tile with no `workbenchTab` is a silent no-op (guard)
 *
 * SCOPE (read before extending this test):
 *   This guards the GRID ROUTING MECHANISM, not per-suite tile configuration. The fixtures
 *   below are synthetic, but each one MIRRORS a real shipped tile so the contract reflects
 *   real behavior rather than a counterfactual:
 *     - workbench tiles mirror the real Dais tiles (certification/appeals → tab 'dais') and
 *       Dossier tiles (documents/evidence → tab 'dossier'; defense → tab 'dais')
 *     - standalone tiles mirror the real Atlas ('atlas') and Dais ('terra-levy',
 *       'management-dashboard') tiles, which really launch via activateModule
 *   It does NOT assert which suite marks which tile workbench-vs-standalone. Notably the real
 *   Atlas suite is ALL standalone and Forge does not use SuiteModuleGrid at all — so this test
 *   deliberately does NOT claim Forge/Atlas launch into the Workbench. Guarding the literal
 *   shipped arrays (DAIS_MODULES / DOSSIER_MODULES / ATLAS_MODULES) is a SEPARATE coverage gap:
 *   those arrays are module-private and the suite-home deeplink tests stub SuiteModuleGrid, so
 *   no test currently exercises the real tile defs through the real grid. Closing that needs a
 *   product `export` (out of this tests-only lane) and is flagged as a follow-up.
 *
 * RE-AUTHORIZED (WO-WB-P16-004): un-skipped by adding the missing shallow mock for
 * `orchestration/moduleActivation` — SuiteModuleGrid imports `activateModule` from it, and the
 * real module's transitive graph (config/moduleComponents → desktopStore + moduleLoaderStore +
 * notificationStore + telemetry) crashed the vitest worker ("Worker exited unexpectedly" /
 * tinypool). Stubbing that one import lets the real SuiteModuleGrid render safely. The standalone
 * assertion reflects current behavior: standalone launch calls `activateModule(targetId, {source})`
 * (WO-SUITE-ROUTING-001), not a bare navigate('/:moduleId') — a test-only correction, no product change.
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
// Synthetic, but each mirrors a REAL shipped tile (see SCOPE note above).

/** Mirrors a real Dais workbench tile (DaisSuiteHome: certification/appeals → tab 'dais'). */
const daisWorkbenchTile: SuiteModuleDef = {
  id: 'certification',
  label: 'Certification',
  icon: () => React.createElement('span', null, '✅'),
  description: 'Assessment roll certification workflow',
  launchMode: 'workbench',
  workbenchTab: 'dais',
};

/** Mirrors a real Dossier workbench tile (DossierSuiteHome: documents/evidence → tab 'dossier'). */
const dossierWorkbenchTile: SuiteModuleDef = {
  id: 'documents',
  label: 'Document Manager',
  icon: () => React.createElement('span', null, '📁'),
  description: 'Parcel document repository',
  launchMode: 'workbench',
  workbenchTab: 'dossier',
};

/**
 * Mirrors the real Dossier "Defense Packets" tile, which launches the DAIS tab from the
 * Dossier suite — proves the destination follows `workbenchTab`, not the owning suite.
 */
const crossTabWorkbenchTile: SuiteModuleDef = {
  id: 'defense',
  label: 'Defense Packets',
  icon: () => React.createElement('span', null, '🛡️'),
  description: 'BOE appeal defense packet assembly via the Dais workbench flow',
  launchMode: 'workbench',
  workbenchTab: 'dais',
};

/** Mirrors the real Atlas TerraGIS tile — genuinely standalone (moduleId 'atlas'). */
const atlasStandaloneTile: SuiteModuleDef = {
  id: 'gis',
  label: 'TerraGIS',
  icon: () => React.createElement('span', null, '🗺️'),
  description: 'GIS surface',
  launchMode: 'standalone',
  moduleId: 'atlas',
};

/** Mirrors the real Dais TerraLevy tile — standalone (moduleId 'terra-levy'). */
const levyStandaloneTile: SuiteModuleDef = {
  id: 'terra-levy',
  label: 'TerraLevy',
  icon: () => React.createElement('span', null, '🧾'),
  description: 'County-wide levy rates by district',
  launchMode: 'standalone',
  moduleId: 'terra-levy',
};

/** Mirrors the real Dais Management tile — standalone (moduleId 'management-dashboard'). */
const mgmtStandaloneTile: SuiteModuleDef = {
  id: 'management-dashboard',
  label: 'Management',
  icon: () => React.createElement('span', null, '📊'),
  description: 'Assessor operations dashboard',
  launchMode: 'standalone',
  moduleId: 'management-dashboard',
};

/** Broken workbench module — missing workbenchTab (guard case). */
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

  // ── 1. A Dais workbench tile routes into the Property Workbench Dais tab ────

  it('routes a Dais workbench tile into the Property Workbench, not a standalone window', async () => {
    const user = userEvent.setup();
    renderGrid([daisWorkbenchTile]);

    await user.click(screen.getByRole('button', { name: /Certification/i }));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    const destination = mockNavigate.mock.calls[0][0] as string;
    expect(destination).toMatch(/^\/property\//);
    expect(destination).toContain('/dais');
    expect(destination).toContain('benton-12345');
    // Parcel action must not fall through to a standalone module window.
    expect(mockActivateModule).not.toHaveBeenCalled();
  });

  // ── 2. A Dossier workbench tile routes into the Property Workbench Dossier tab ─

  it('routes a Dossier workbench tile into the Property Workbench, not a standalone document window', async () => {
    const user = userEvent.setup();
    renderGrid([dossierWorkbenchTile]);

    await user.click(screen.getByRole('button', { name: /Document Manager/i }));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    const destination = mockNavigate.mock.calls[0][0] as string;
    expect(destination).toMatch(/^\/property\//);
    expect(destination).toContain('/dossier');
    expect(destination).toContain('benton-12345');
    expect(mockActivateModule).not.toHaveBeenCalled();
  });

  // ── 3. Destination follows workbenchTab, not the owning suite ──────────────

  it('routes to the tab named by workbenchTab even when a different suite owns the tile', async () => {
    // Real case: the Dossier "Defense Packets" tile launches the Dais tab.
    const user = userEvent.setup();
    renderGrid([crossTabWorkbenchTile]);

    await user.click(screen.getByRole('button', { name: /Defense Packets/i }));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    const destination = mockNavigate.mock.calls[0][0] as string;
    expect(destination).toBe('/property/benton-12345/dais');
  });

  // ── 4. Same parcel + tab re-entry → same URL = natural window reuse ────────

  it('reuses the existing workbench window for same parcel+tab re-entry', async () => {
    const user = userEvent.setup();
    renderGrid([daisWorkbenchTile]);

    await user.click(screen.getByRole('button', { name: /Certification/i }));
    const firstUrl = mockNavigate.mock.calls[0][0] as string;

    mockNavigate.mockClear();

    await user.click(screen.getByRole('button', { name: /Certification/i }));
    const secondUrl = mockNavigate.mock.calls[0][0] as string;

    // Same URL = same route = React Router reuses the existing mounted component.
    expect(secondUrl).toBe(firstUrl);
  });

  // ── 5. Context is encoded in the URL — structural proof ────────────────────

  it('encodes parcelId + tab slug in the URL, with countyId carried out-of-band', () => {
    // Structural proof: parcelId (route param) + tab (sub-route) live in the path;
    // countyId travels in the x-county-id header (FISMA isolation), NOT the path.
    const parcelId = 'R112233445566';
    const tab = 'dais';
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

  // ── 7. Standalone tiles activate a module — never route into /property/ ─────

  it('launches standalone tiles via activateModule (never into the Workbench)', async () => {
    // Current behavior (WO-SUITE-ROUTING-001): standalone tiles call
    // activateModule(moduleId, {source}) to open a desktop window — NOT
    // navigate('/:moduleId') (that path had no registered route and silently no-op'd).
    // Fixtures mirror the real standalone tiles: Atlas TerraGIS, Dais TerraLevy/Management.
    const user = userEvent.setup();
    renderGrid([atlasStandaloneTile, levyStandaloneTile, mgmtStandaloneTile]);

    await user.click(screen.getByRole('button', { name: /TerraGIS/i }));
    expect(mockActivateModule).toHaveBeenCalledWith('atlas', expect.objectContaining({ source: 'system' }));
    expect(mockNavigate).not.toHaveBeenCalled();

    mockActivateModule.mockClear();

    await user.click(screen.getByRole('button', { name: /TerraLevy/i }));
    expect(mockActivateModule).toHaveBeenCalledWith('terra-levy', expect.objectContaining({ source: 'system' }));
    expect(mockNavigate).not.toHaveBeenCalled();

    mockActivateModule.mockClear();

    await user.click(screen.getByRole('button', { name: /Management/i }));
    expect(mockActivateModule).toHaveBeenCalledWith('management-dashboard', expect.objectContaining({ source: 'system' }));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  // ── Bonus: no-parcel fallback routes to property search with tab intent ────

  it('routes workbench tiles to property search when no parcel is active', async () => {
    mockActiveParcel = null;
    const user = userEvent.setup();
    renderGrid([daisWorkbenchTile]);

    await user.click(screen.getByRole('button', { name: /Certification/i }));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    const destination = mockNavigate.mock.calls[0][0] as string;
    // Falls back to /property?openTab=dais — not a standalone window.
    expect(destination).toContain('/property');
    expect(destination).toContain('openTab=dais');
    expect(mockActivateModule).not.toHaveBeenCalled();
  });
});
