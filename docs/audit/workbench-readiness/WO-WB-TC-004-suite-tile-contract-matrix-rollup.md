# WO-WB-TC-004 — Suite Tile Contract: Regression Matrix + Evidence Rollup

**Goal:** GOAL-TF-WB-SUITE-TILE-CONTRACT-001 — Real Suite Tile-Array Launch Contract
**WO:** WO-WB-TC-004 — Regression matrix + evidence rollup
**Category:** Documentation (closure) · **Operator:** Claude Code
**Status:** COMPLETE — real tile arrays now tested through the real grid; export-only product change.

**Authorization:** Ratified lane. Product edit = `export` keyword on 3 arrays only; test + docs otherwise. No SuiteModuleGrid
logic, Router, backend, registry, or tile-value change. Closes the gap codex flagged on #1237 / documented in
`WO-WB-P16-005/006`.

---

## 1. WOs

| WO | Deliverable |
|----|-------------|
| TC-001 | Tile-array audit + import-safety decision (strategy A, deeplink mock set) |
| TC-002 | `export` added to `ATLAS_MODULES` / `DAIS_MODULES` / `DOSSIER_MODULES` (export-only) |
| TC-003 | `suiteTileArrayLaunch.contract.test.tsx` — real arrays through the real grid |
| TC-004 | this matrix + rollup |

## 2. What changed

- **Product (export-only, 3 lines):** `AtlasSuiteHome.tsx` / `DaisSuiteHome.tsx` / `DossierSuiteHome.tsx` — `const X` →
  `export const X`. `git diff` shows only the `export` keyword added; no tile value / launchMode / workbenchTab / moduleId
  change. Verified.
- **Test (new):** `frontend/apps/os-shell/src/pages/suites/__tests__/suiteTileArrayLaunch.contract.test.tsx`.

## 3. Coverage matrix

| Layer | What it locks | Catches |
|-------|---------------|---------|
| A. Mechanism sweep (all 31 tiles) | every shipped tile routes per its declared mode: workbench → `/property/:id/:workbenchTab`; standalone → `activateModule(moduleId,{source})` | a workbench tile with a missing/blank tab (guard → no nav); grid routing a tile to the wrong channel; `undefined`/countyId leaking into the path |
| B. Intent lock (9 curated tiles) | hardcoded expected behavior for representative tiles (Dais certification/appeals/terra-levy/management; Dossier documents/**defense→dais**/terra-sync; Atlas gis/parcel-lens) | a **mode/tab flip** on a known tile (e.g. certification→standalone, or defense's tab dais→dossier) — which layer A alone cannot catch, since it derives expectations from the tile |
| C. Array invariants (pure data) | every tile has a known launchMode; every workbench tile has a tab within the 9 known workbench tabs; every standalone resolves a non-empty module id | a typo'd/unknown workbench tab; a standalone tile with no id source |

## 4. Import-safety (how the real arrays are testable)

Reused the proven mock set from the sibling deeplink tests (they already import these suite-homes), keeping
`SuiteModuleGrid` **real** and adding its `propertyStore`/`useNavigate` deps + the `orchestration/moduleActivation` spy.
No suite-home refactor; eval-safe modules (draft panels/stores, academy) left real. See TC-001 §3.

## 5. Honest scope + limits

- This locks each **shipped tile's launch behavior** through the real grid — the gap codex flagged is now closed.
- It does **not** assert which tiles *should* exist or which mode they *should* have beyond the layer-B curated set
  (product/roadmap decisions). Adding a new tile does not require touching this test unless it introduces an unknown tab.
- The mechanism sweep derives expectations from each tile; the intent-lock layer is what converts a subset into a true
  anti-drift guard. That split is intentional and documented, not an oversight.

## 6. CI validation

Vitest cannot run in the sparse worktree (no `node_modules`); **CI is the run of record** — Frontend Gate + Vitest full
suite. `git diff --check` clean; product diff = export-only (verified); review threads resolved before merge; no `--admin`
/ no break-glass.

## 7. Not touched

`SuiteModuleGrid` logic · `Router.tsx` · tile values/modes/tabs · tool registry · backend · package/build/CI · PACS/county
data · Codex Backend OE files.
