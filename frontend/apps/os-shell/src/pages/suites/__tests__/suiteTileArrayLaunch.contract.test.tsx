/**
 * suiteTileArrayLaunch.contract.test.tsx
 *
 * Real Suite Tile-Array Contract (GOAL-TF-WB-SUITE-TILE-CONTRACT-001)
 * ==================================================================
 *
 * Locks the REAL shipped suite tile arrays (ATLAS_MODULES / DAIS_MODULES / DOSSIER_MODULES) as a
 * DATA contract: which tiles exist, their launch mode, and their route/command identifiers — so a
 * launch-mode / workbenchTab / moduleId regression on a shipped tile is caught.
 *
 * DESIGN (Option A, owner-approved 2026-07-11 — see WO-WB-TC-005):
 *   The prior version imported the real suite-homes AND rendered the real SuiteModuleGrid ~40× (once
 *   per real tile) to exercise handleLaunch. Under the full sharded Frontend Fast Gate, that repeated
 *   real-grid rendering left an open worker handle that DETERMINISTICALLY hung one shard to the 30-min
 *   timeout (orphan vitest/esbuild at kill), while sibling shards finished in ~4.5 min. The routing
 *   MECHANISM (given a launchMode, the grid navigates / activates correctly) is already proven by the
 *   Phase-16 synthetic-fixture test `launchSurfaceContractParcelWorkbench.contract.test.tsx`. So this
 *   test drops the rendering entirely and asserts the real arrays as pure data — no render, no hang,
 *   while preserving the real-array contract codex #1237 asked for.
 *
 * Import-safety: reading the exported arrays still evaluates the suite-home module graph, including
 * SuiteModuleGrid → orchestration/moduleActivation (the Phase-16 worker-crash vector) plus panels /
 * services / hooks. The mocks below tame that evaluation (import-taming only — nothing is rendered).
 *
 * NOT PRODUCT CHANGE: the only product edit in this lane is adding `export` to the three arrays.
 */
import React from 'react';
import { vi, describe, it, expect } from 'vitest';
import type { SuiteModuleDef } from '../../../components/suites/SuiteModuleGrid';
import { ATLAS_MODULES } from '../AtlasSuiteHome';
import { DAIS_MODULES } from '../DaisSuiteHome';
import { DOSSIER_MODULES } from '../DossierSuiteHome';

// ── Import-taming mocks (nothing is rendered; these only keep the module eval safe) ──────────────
// KEY: stub SuiteModuleGrid, exactly as the sibling deeplink tests (DaisSuiteHome.deeplink /
// DossierSuiteHome.deeplink) do. This test reads the exported arrays but never renders the grid, so it
// does not need the real grid — and stubbing it stops the suite-home import from loading the real
// SuiteModuleGrid module and its heavy transitive graph. That real-grid load is what deterministically
// hung a Frontend Fast Gate unit shard to the 30-min timeout even after all rendering was removed;
// stubbing it matches the deeplink tests' proven hang-free import path. (`type SuiteModuleDef` is a
// type-only import, unaffected by this mock.)
vi.mock('../../../components/suites/SuiteModuleGrid', () => ({ SuiteModuleGrid: () => null }));
// The Phase-16 crash vector: SuiteModuleGrid → orchestration/moduleActivation. Kept mocked defensively.
vi.mock('../../../orchestration/moduleActivation', () => ({ activateModule: vi.fn(), default: vi.fn() }));
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => vi.fn() };
});
vi.mock('lucide-react', () => {
  const Icon = (props: Record<string, unknown>) =>
    React.createElement('span', { 'data-slot': 'icon', ...props });
  return new Proxy({}, { get: () => Icon });
});
vi.mock('../../../stores/propertyStore', () => ({ usePropertyStore: vi.fn() }));
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

// ── Data under test ──────────────────────────────────────────────────────────────────────────────
const bySuite: Record<string, SuiteModuleDef[]> = {
  Atlas: ATLAS_MODULES,
  Dais: DAIS_MODULES,
  Dossier: DOSSIER_MODULES,
};
const ALL: SuiteModuleDef[] = [...ATLAS_MODULES, ...DAIS_MODULES, ...DOSSIER_MODULES];
// Canonical WorkbenchTabSlug union in src/contracts/workbench.ts (8 slugs, no 'pilot').
const KNOWN_TABS = new Set(['summary', 'forge', 'atlas', 'dais', 'clerk', 'treasury', 'audit', 'dossier']);

// ── Tests (pure data — no rendering) ───────────────────────────────────────────────────────────────
describe('suiteTileArrayLaunch.contract — real shipped suite tile arrays (data contract)', () => {
  // 1. Required tiles exist in the shipped arrays.
  describe('required tiles are present', () => {
    const REQUIRED: Record<string, string[]> = {
      Dais: ['certification', 'appeals', 'calendar', 'terra-levy', 'management-dashboard'],
      Dossier: ['documents', 'evidence', 'defense', 'chain', 'photos', 'search', 'terra-sync'],
      Atlas: ['gis', 'parcel-lens', 'layer-works'],
    };
    for (const [suite, ids] of Object.entries(REQUIRED)) {
      for (const id of ids) {
        it(`${suite}/${id} exists`, () => {
          expect(bySuite[suite].some((t) => t.id === id)).toBe(true);
        });
      }
    }
  });

  // 2. Intent lock — representative tiles keep their shipped launch mode + target (catches a flip).
  describe('intent lock — representative tiles keep their launch mode + target', () => {
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
      const label = c.mode === 'workbench' ? `workbench/${c.tab}` : `standalone ${c.moduleId}`;
      it(`${c.suite}/${c.id} → ${label}`, () => {
        const tile = bySuite[c.suite].find((t) => t.id === c.id);
        expect(tile, `${c.suite}/${c.id} no longer exists in the shipped array`).toBeTruthy();
        expect(tile!.launchMode).toBe(c.mode);
        if (c.mode === 'workbench') {
          expect(tile!.workbenchTab).toBe(c.tab);
        } else {
          expect(tile!.moduleId ?? tile!.id).toBe(c.moduleId);
        }
      });
    }
  });

  // 3. Array invariants over every shipped tile.
  describe('array invariants', () => {
    it('every tile declares a supported launchMode (workbench | standalone)', () => {
      const bad = ALL.filter((t) => t.launchMode !== 'workbench' && t.launchMode !== 'standalone');
      expect(bad.map((t) => `${t.id}:${t.launchMode}`)).toEqual([]);
    });

    it('every workbench tile targets a known workbench tab', () => {
      const bad = ALL.filter(
        (t) => t.launchMode === 'workbench' && (!t.workbenchTab || !KNOWN_TABS.has(t.workbenchTab)),
      );
      expect(bad.map((t) => `${t.id}:${t.workbenchTab ?? 'MISSING'}`)).toEqual([]);
    });

    it('every standalone tile resolves a non-empty module id', () => {
      const bad = ALL.filter((t) => t.launchMode === 'standalone' && !(t.moduleId ?? t.id));
      expect(bad.map((t) => t.id)).toEqual([]);
    });

    it('tile ids are unique within each suite array', () => {
      for (const [suite, arr] of Object.entries(bySuite)) {
        const ids = arr.map((t) => t.id);
        const dupes = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
        expect(dupes, `${suite} has duplicate tile ids`).toEqual([]);
      }
    });
  });
});
