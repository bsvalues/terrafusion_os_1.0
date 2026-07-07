# WO-CLAUDE-SUP-004 — Next Claude Lane Draft: Suite Tile-Array Contract

**Goal:** GOAL-TF-CLAUDE-SUPPORT-001 — Claude Code Backend OE Support + Next-Lane Packet Prep
**WO:** WO-CLAUDE-SUP-004 — Next Claude Lane Draft Packet
**Category:** Support (draft only — NOT ratified, NOT executed)
**Operator:** Claude Code · support lane

**Status:** DRAFT awaiting Brain/operator ratification. Nothing in this packet is executed. It exists so that, when the
owner wants the next Claude-safe lane, the packet is ready to paste without a design round-trip.

---

## 1. Origin

This closes the gap codex flagged on #1237 (P2) and Claude documented in `WO-WB-P16-005/006`: the Phase-16 launch
contract proves the **SuiteModuleGrid routing mechanism** with synthetic fixtures, but **no test drives the real shipped
tile arrays through the real grid**. `DAIS_MODULES` / `DOSSIER_MODULES` / `ATLAS_MODULES` are module-private, and the
suite-home deeplink tests **stub** `SuiteModuleGrid`. So a real regression — e.g. flipping a Dais tile from `workbench`
to `standalone`, or mis-setting a `workbenchTab` — is currently ungated.

## 2. Why this needs ratification (not self-start)

Closing the gap requires **exporting** `DAIS_MODULES` / `DOSSIER_MODULES` / `ATLAS_MODULES` from the suite-home files so a
test can import and assert them. An `export` is a **product-file edit** — outside the tests-only Phase-16 scope and
outside Claude's default lane. Per the operator law, Claude may **draft** this packet but must not execute it until
Brain/operator ratifies. Brain/Cortex remains the sole sequencer.

## 3. Draft packet (paste-ready when ratified)

```
/goal create
GOAL-TF-WB-SUITE-TILE-CONTRACT-001 — Real Suite Tile-Array Launch Contract

PURPOSE:
Close the Phase-16 residual gap by asserting the REAL shipped suite tile arrays
(DAIS_MODULES / DOSSIER_MODULES / ATLAS_MODULES) through the real SuiteModuleGrid,
so a launch-mode/tab regression on a real tile is caught. Minimal product surface:
add `export` to the three arrays. No behavior change.

WOs:
  TC-001 — audit: enumerate each array's tiles (launchMode, workbenchTab, moduleId) first-hand
  TC-002 — add `export` to DAIS_MODULES / DOSSIER_MODULES / ATLAS_MODULES (export-only; no reorder, no value change)
  TC-003 — contract test: import the real arrays; assert every workbench tile → /property/:id/:workbenchTab
           and every standalone tile → activateModule(moduleId,{source}); reuse the P16 shallow mock for
           orchestration/moduleActivation to avoid the worker crash
  TC-004 — regression matrix + evidence rollup

ALLOWED:
  frontend/apps/os-shell/src/pages/suites/{AtlasSuiteHome,DaisSuiteHome,DossierSuiteHome}.tsx  (EXPORT KEYWORD ONLY)
  frontend/apps/os-shell/src/__tests__/**
  docs/audit/workbench-readiness/**

BLOCKED:
  any tile value/launchMode/tab change ; SuiteModuleGrid product logic ; Router.tsx ; backend/** ;
  tools/registry/** ; package/build/CI ; PACS/county data ; break-glass ; hook bypass

VALIDATION:
  Frontend Gate + Vitest full suite (CI = run of record) ; git diff --check ; export-only diff verified
  (git diff shows only `export` added to the three const lines) ; review threads resolved

STOP IF:
  closing the gap requires changing any tile's launchMode/workbenchTab/moduleId (that would be a product
  behavior change, not a test) ; or the arrays cannot be exported without a broader refactor.
```

## 4. Pre-checked facts (first-hand, this session)

- The three arrays are module-private `const` (`AtlasSuiteHome.tsx:32`, `DaisSuiteHome.tsx:81`, `DossierSuiteHome.tsx:44`).
- Real launch modes verified: **Atlas = all `standalone`** (moduleId `atlas`); **Dais** has workbench tiles
  (`certification`/`appeals`/`calendar` → `dais`) + standalone (`terra-levy`, `management-dashboard`, …); **Dossier** has
  workbench tiles (`documents`/`evidence`/`chain`/`photos`/`search` → `dossier`; `defense` → `dais`) + standalone.
- Importing a suite-home file pulls a heavy graph (panels, `invokeTool`) — the test must reuse the Phase-16
  `orchestration/moduleActivation` shallow mock and likely mock the suite-home's heavy panel imports, OR (cleaner) move
  the arrays to a tiny sibling module the suite home re-exports. **TC-001 must decide import-safety before TC-003** — this
  is the main design risk and why it's a real lane, not a one-liner.

## 5. Non-goals

No change to any tile's shipped launch behavior; no SuiteModuleGrid logic change; no backend; no registry. This lane only
makes the **already-true** tile config **test-guarded**.
