# WO-WB-P16-005 — Launch-Contract Regression Matrix

**Goal:** GOAL-TF-WB-PHASE16-LAUNCH-CONTRACT-001 — Re-author Parcel-to-Workbench Launch Contract
**WO:** WO-WB-P16-005 — Regression Matrix
**Category:** Documentation (coverage matrix)
**Operator:** Claude Code · ratified tests-only follow-up

**Authorization:** Operator-ratified Phase-16 lane (tests-only / shallow mocks / no product behavior change).

---

## 1. Purpose

Map each re-authored test to the launch-contract invariant it locks, so the coverage is auditable and future regressions
have a named guard.

## 2. Invariant → test map

Fixtures are synthetic but each **mirrors a real shipped tile** (Dais/Dossier workbench tiles; Atlas/Dais standalone
tiles) so every asserted launch reflects real behavior — see §3.

| # | Test | Invariant enforced | Product path guarded |
|---|------|--------------------|----------------------|
| 1 | Dais workbench tile → workbench | Parcel action routes into Workbench, not a standalone window | `workbench` + parcel → `/property/:id/dais` |
| 2 | Dossier workbench tile → workbench | Same, Dossier tab | `/property/:id/dossier` |
| 3 | Cross-tab tile (Dossier "Defense" → Dais) | Destination follows `workbenchTab`, not the owning suite | `/property/:id/dais` |
| 4 | Same parcel+tab re-entry | Window reuse: identical URL ⇒ React Router reuses the mounted component (no window multiplication) | URL identity |
| 5 | Structural URL proof | `parcelId` + `tab` encoded in path; `countyId` travels in header, not path (FISMA isolation) | `/property/:id/:tab` shape |
| 6 | Broken module (no `workbenchTab`) | Guard: malformed workbench def no-ops instead of routing to `/property/:id/undefined` | `if (!mod.workbenchTab) return;` |
| 7 | Standalone tiles (Atlas GIS / TerraLevy / Management) | Standalone tiles open via `activateModule`, never touch `/property/` | `standalone → activateModule(moduleId, {source:'system'})` |
| bonus | No active parcel | Workbench tile falls back to `/property?openTab=:tab`, not a standalone window | no-parcel branch |

## 3. Truth-fidelity of fixtures (codex #1237 review)

The re-author uses synthetic `SuiteModuleDef` fixtures but binds them to **real** launch modes/tabs so the contract
cannot pass on counterfactual behavior:

- **Corrected false cases:** an earlier draft asserted **Forge → workbench** and **Atlas → workbench**. Neither is real —
  the shipped Atlas suite is **all standalone** (`AtlasSuiteHome`) and **Forge does not use `SuiteModuleGrid`** at all.
  Those cases were removed; the workbench cases now mirror the real Dais (`certification` → `dais`) and Dossier
  (`documents` → `dossier`; `defense` → `dais`) tiles.
- **Standalone cases** now mirror real standalone tiles (`atlas`, `terra-levy`, `management-dashboard`).
- **Test 7 behavior-truth:** standalone launch asserts the **current** `activateModule(moduleId, {source})` behavior,
  which diverged from the original `navigate('/:moduleId')` at **WO-SUITE-ROUTING-001**. Intentional test correction; no
  product behavior changed.

**Known coverage gap (flagged, not closed here):** this guards the grid ROUTING MECHANISM, not the literal shipped tile
arrays. `DAIS_MODULES` / `DOSSIER_MODULES` / `ATLAS_MODULES` are module-private and the suite-home deeplink tests **stub**
`SuiteModuleGrid`, so no test drives the real tile defs through the real grid. Closing that needs a product `export`
(outside this tests-only lane) → **follow-up:** a small lane to export the arrays and assert their launch modes directly.

## 4. Run of record

Vitest cannot run in the sparse worktree (no `node_modules`; a full local sweep hangs ~30 min). **CI is the run of
record** — Frontend Gate + Vitest full suite on the PR. This matrix is verified green there before merge; local static
review (`git diff --check`, mock-path/type check against `SuiteModuleGrid` source) is the pre-push gate.

## 5. Coverage honesty

No redundant tests were added. Each row above is a distinct branch or invariant of `handleLaunch`. The re-author restores
the original coverage and corrects a single stale assertion; it does not manufacture additional cases beyond the eight
the contract requires.
