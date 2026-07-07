/**
 * suiteTileArrayLaunch.contract.test.tsx
 *
 * Real Suite Tile-Array Launch Contract (GOAL-TF-WB-SUITE-TILE-CONTRACT-001)
 * =========================================================================
 *
 * Closes the residual gap flagged on the Phase-16 launch contract (codex #1237): that test proved the
 * SuiteModuleGrid ROUTING MECHANISM with synthetic fixtures, but nothing drove the REAL shipped tile
 * arrays (ATLAS_MODULES / DAIS_MODULES / DOSSIER_MODULES) through the REAL grid. This test does exactly
 * that — it imports the real, now-exported arrays and launches every tile through the real
 * SuiteModuleGrid.handleLaunch, so a launch-mode / workbenchTab / moduleId regression on a shipped tile
 * is caught.
 *
 * Three layers:
 *   A. Mechanism sweep — every real tile routes correctly for its DECLARED launchMode (workbench →
 *      /property/:parcelId/:workbenchTab; standalone → activateModule(moduleId, {source})).
 *   B. Intent lock — a curated set of representative tiles with HARDCODED expected behavior, so a
 *      mode/tab flip on a known tile (e.g. certification → standalone, or defense's tab dais → dossier)
 *      is caught even though layer A derives expectations from the tile itself.
 *   C. Array invariants — pure-data checks over all arrays (every workbench tile has a tab; every
 *      standalone resolves a module id; tabs are within the known workbench tab set).
 *
 * Import-safety (why the mock wall): importing a suite-home evaluates its whole module graph —
 * SuiteModuleGrid (→ orchestration/moduleActivation, the Phase-16 worker-crash vector), pilotApi, county
 * study/handoff services, panels, hooks. We reuse the PROVEN mock set from the sibling deeplink tests
 * (DaisSuiteHome.deeplink / DossierSuiteHome.deeplink) — but keep SuiteModuleGrid REAL (it is the unit
 * under test) and add the grid's own deps (propertyStore selector, useNavigate). Modules the deeplink
 * tests import unmocked (DaisWorkflowDraftPanel, DossierEvidenceDraftPanel, academy, the zustand draft
 * stores) are eval-safe and left real.
 *
 * NOT PRODUCT CHANGE: the only product edit in this lane is adding `export` to the three arrays.
 * SCOPE NOTE: this locks each shipped tile's launch behavior; it does not assert which tiles SHOULD
 * exist (that is a product/roadmap decision).
 */
import React from 'react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SuiteModuleGrid, type SuiteModuleDef } from '../../../components/suites/SuiteModuleGrid';
import { ATLAS_MODULES } from '../AtlasSuiteHome';
import { DAIS_MODULES } from '../DaisSuiteHome';
import { DOSSIER_MODULES } from '../DossierSuiteHome';

// ── Mocks ───────────────────────────────────────────────────────────────────────
const mockNavigate = vi.fn();
const { mockActivateModule } = vi.hoisted(() => ({ mockActivateModule: vi.fn() }));

// The Phase-16 crash vector — stub it so the real SuiteModuleGrid evaluates safely and standalone
// launches are observable. MUST use the SAME relative specifier SuiteModuleGrid resolves
// (`../../orchestration/moduleActivation` from components/suites → src/orchestration/moduleActivation),
// i.e. `../../../orchestration/moduleActivation` from here. The deeplink tests mock via the '@/' alias,
// but they STUB SuiteModuleGrid, so their alias never had to intercept the real grid's relative import;
// matching the proven relative pattern (see components/suites/__tests__/SuiteModuleGrid.test.tsx) is what
// actually intercepts the real grid and prevents the real moduleActivation graph from loading (codex/copilot #1240).
vi.mock('../../../orchestration/moduleActivation', () => ({
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

let mockActiveParcel: { parcelId: string; countyId?: string } | null = {
  parcelId: 'R7f3a12',
  countyId: 'benton',
};
vi.mock('../../../stores/propertyStore', () => ({
  usePropertyStore: (selector: (s: { activeParcel: typeof mockActiveParcel }) => unknown) =>
    selector({ activeParcel: mockActiveParcel }),
}));

// Heavy suite-home deps — mirror the proven deeplink mock set (import-taming only).
vi.mock('../../../api/pilotApi', () => ({ invokeTool: vi.fn() }));
vi.mock('../../../services/countyStudyHandoffApi', () => ({ exceptionApi: {}, adjustmentSetApi: {} }));
vi.mock('../../../components/workbench/ParcelContextBanner', () => ({ ParcelContextBanner: () => null }));
vi.mock('../../../components/suites/OperationalQueue', () => ({ OperationalQueue: () => null }));
vi.mock('../../../hooks/useCountyStats', () => ({ useCountyStats: () => ({}) }));
vi.mock('../../../hooks/useAtlasGis', () => ({ useParcelGis: () => ({}) }));
vi.mock('../../../components/dais/NoticeBatchQueuePanel', () => ({ default: () => null }));
vi.mock('../../../components/dais/CertRollPanel', () => ({ default: () => null }));
vi.mock('../../../components/dais/ManagementDashboardPanel', () => ({ default: () => null }));
vi.mock('../../../components/dais/SupervisorFlagQueue', () => ({ default: () => null }));
vi.mock('../useDaisSuiteStats', () => ({ useDaisSuiteStats: () => ({}) }));

// ── Helpers ─────────────────────────────────────────────────────────────────────
const PARCEL = 'R7f3a12'; // deliberately does NOT contain the countyId 'benton'

function renderTile(tile: SuiteModuleDef) {
  return render(
    <MemoryRouter>
      <SuiteModuleGrid modules={[tile]} />
    </MemoryRouter>,
  );
}

const SUITES: Array<[string, SuiteModuleDef[]]> = [
  ['Atlas', ATLAS_MODULES],
  ['Dais', DAIS_MODULES],
  ['Dossier', DOSSIER_MODULES],
];

const bySuite: Record<string, SuiteModuleDef[]> = {
  Atlas: ATLAS_MODULES,
  Dais: DAIS_MODULES,
  Dossier: DOSSIER_MODULES,
};

// ── Tests ───────────────────────────────────────────────────────────────────────
describe('suiteTileArrayLaunch.contract — real shipped tile arrays through the real SuiteModuleGrid', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockActivateModule.mockClear();
    mockActiveParcel = { parcelId: PARCEL, countyId: 'benton' };
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // ── A. Mechanism sweep — every real tile routes per its declared mode ──────────
  for (const [suite, modules] of SUITES) {
    describe(`${suite} — every shipped tile launches per its declared mode`, () => {
      for (const tile of modules) {
        const label = `${tile.id} (${tile.launchMode}${tile.workbenchTab ? '/' + tile.workbenchTab : ''})`;
        it(label, async () => {
          const user = userEvent.setup();
          renderTile(tile);
          await user.click(screen.getByRole('button'));

          if (tile.launchMode === 'workbench') {
            expect(
              tile.workbenchTab,
              `${suite}/${tile.id} is workbench-mode but declares no workbenchTab`,
            ).toBeTruthy();
            expect(mockNavigate).toHaveBeenCalledTimes(1);
            const dest = mockNavigate.mock.calls[0][0] as string;
            expect(dest).toBe(`/property/${PARCEL}/${tile.workbenchTab}`);
            expect(dest).not.toContain('undefined');
            expect(dest).not.toContain('benton'); // countyId travels out-of-band, never in the path
            expect(mockActivateModule).not.toHaveBeenCalled();
          } else {
            const expectedId = tile.moduleId ?? tile.id;
            expect(expectedId).toBeTruthy();
            expect(mockActivateModule).toHaveBeenCalledWith(
              expectedId,
              expect.objectContaining({ source: 'system' }),
            );
            expect(mockNavigate).not.toHaveBeenCalled();
          }
        });
      }
    });
  }

  // ── B. Intent lock — representative tiles keep their shipped launch behavior ────
  describe('intent lock — representative tiles keep their shipped launch behavior', () => {
    type Case = { suite: string; id: string } & (
      | { mode: 'workbench'; tab: string }
      | { mode: 'standalone'; moduleId: string }
    );
    const CASES: Case[] = [
      { suite: 'Dais', id: 'certification', mode: 'workbench', tab: 'dais' },
      { suite: 'Dais', id: 'appeals', mode: 'workbench', tab: 'dais' },
      { suite: 'Dais', id: 'terra-levy', mode: 'standalone', moduleId: 'terra-levy' },
      { suite: 'Dais', id: 'management-dashboard', mode: 'standalone', moduleId: 'management-dashboard' },
      { suite: 'Dossier', id: 'documents', mode: 'workbench', tab: 'dossier' },
      // cross-suite: a Dossier tile that launches the DAIS workbench tab
      { suite: 'Dossier', id: 'defense', mode: 'workbench', tab: 'dais' },
      { suite: 'Dossier', id: 'terra-sync', mode: 'standalone', moduleId: 'terra-sync' },
      { suite: 'Atlas', id: 'gis', mode: 'standalone', moduleId: 'atlas' },
      { suite: 'Atlas', id: 'parcel-lens', mode: 'standalone', moduleId: 'atlas' },
    ];

    for (const c of CASES) {
      it(`${c.suite}/${c.id} → ${c.mode}`, async () => {
        const tile = bySuite[c.suite].find((t) => t.id === c.id);
        expect(tile, `${c.suite}/${c.id} no longer exists in the shipped array`).toBeTruthy();
        const user = userEvent.setup();
        renderTile(tile!);
        await user.click(screen.getByRole('button'));

        if (c.mode === 'workbench') {
          expect(mockNavigate).toHaveBeenCalledWith(`/property/${PARCEL}/${c.tab}`);
          expect(mockActivateModule).not.toHaveBeenCalled();
        } else {
          expect(mockActivateModule).toHaveBeenCalledWith(
            c.moduleId,
            expect.objectContaining({ source: 'system' }),
          );
          expect(mockNavigate).not.toHaveBeenCalled();
        }
      });
    }
  });

  // ── C. Array invariants (pure data) ────────────────────────────────────────────
  describe('array invariants', () => {
    const ALL = [...ATLAS_MODULES, ...DAIS_MODULES, ...DOSSIER_MODULES];
    // Mirrors the canonical WorkbenchTabSlug union in src/contracts/workbench.ts (8 slugs, no 'pilot').
    // SuiteModuleDef.workbenchTab is typed as WorkbenchTabSlug, so the compiler already constrains this;
    // the runtime check additionally guards against `as`-casts / @ts-ignore drift.
    const KNOWN_TABS = new Set([
      'summary', 'forge', 'atlas', 'dais', 'clerk', 'treasury', 'audit', 'dossier',
    ]);

    it('every tile declares a known launchMode', () => {
      const bad = ALL.filter((t) => t.launchMode !== 'workbench' && t.launchMode !== 'standalone');
      expect(bad.map((t) => t.id)).toEqual([]);
    });

    it('every workbench tile declares a workbenchTab', () => {
      const bad = ALL.filter((t) => t.launchMode === 'workbench' && !t.workbenchTab);
      expect(bad.map((t) => t.id)).toEqual([]);
    });

    it('every workbench tile targets a known workbench tab', () => {
      const bad = ALL.filter(
        (t) => t.launchMode === 'workbench' && t.workbenchTab && !KNOWN_TABS.has(t.workbenchTab),
      );
      expect(bad.map((t) => `${t.id}:${t.workbenchTab}`)).toEqual([]);
    });

    it('every standalone tile resolves a non-empty module id', () => {
      const bad = ALL.filter((t) => t.launchMode === 'standalone' && !(t.moduleId ?? t.id));
      expect(bad.map((t) => t.id)).toEqual([]);
    });
  });
});
