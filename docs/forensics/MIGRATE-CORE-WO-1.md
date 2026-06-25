# Migrate Core — Ratification + First Execution Work Order (WO-CORE-1)

> **Ratifies** the `TerraFusionOS` core boundary + cut line + leave-behind map + first execution
> candidate (`MIGRATE-CORE-SPLIT-PLAN.md`), and **specifies** the first narrow Migrate-**execution**
> work order. This document is **decision-layer** (the ratified spec). It does **not** itself move
> code or create a repo — execution awaits its preconditions (§4) + a separate explicit release.

**Date:** 2026-06-25 · **Branch:** `claude/terrafusion-forensic-playbook-u3kvx6` · **PR:** #1080 (draft)

---

## 1. RATIFIED (as-is)
Per owner direction, the following from `MIGRATE-CORE-SPLIT-PLAN.md` are **RATIFIED without change**:
- **Core boundary** — IN: desktop/windowing shell, contract-driven app composition/routing,
  electron host, **workbench HOST only**, canon/governance, registry, **shell-facing**
  Muse/Pilot/LocalOps, kernel API host + **core-only** controllers, core slices of `Core`/`Data`,
  **all of `Abstractions`**.
- **Cut line** — must-exist / may-stay-temporarily (suite domain referenced via contracts only,
  time-boxed) / **never-copy** (suite pages, Sync/PACS, deep Pilot, theater, `*.backup`/`*.clean`,
  `.tar.gz`).
- **Leave-behind map** — Sync→Sync, Atlas→Atlas, Dais/Levy→Dais, Forge→Forge, Dossier→Dossier,
  deep Pilot→Phase 4, theater→legacy/archive.
- **First execution candidate** — repo skeleton around **`TerraFusion.Abstractions` + kernel host
  shell**; suite slots contract-stubbed only; proof gate = builds green with **zero core→suite
  internal references**.

Consistent with the ratified topology (`RECOVERY-TOPOLOGY-MATRIX.md`), the Tier-1 Closure Record
(branch-port thesis closed → migrate from evolved `main`), and the Phase-1 contracts seal.

## 2. WO-CORE-1 — scope (the first execution release, when authorized)
**Goal:** stand up `TerraFusionOS` as a **bootable skeleton** sourced from `main`, proving the
core↔suite boundary holds, with **nothing suite** inside.

**Backend skeleton (projects, in dependency order):**
- `TerraFusion.Abstractions` (verbatim — the proven seam; no change)
- `TerraFusion.Core` **core slice** (exclude suite domain: Levy/Forge/CurrentUse/Dossier entities + `Core/Sync/**`)
- `TerraFusion.Data` **core slice** (exclude suite DbContexts/services: Levy/CurrentUse/CanonicalTf/LegacyPacsRaw/TruthPacs)
- `TerraFusion.Security`, `TerraFusion.Operations` (core support)
- `TerraFusion.API` **host**: `Program.cs` composition + auth/health/hubs + **core-only controllers**; suite controllers excluded (their endpoints become contract-stubbed module slots)

**Frontend skeleton:**
- `os-shell` shell host (`src/shell/*` minus `*.backup`/`*.clean`), `App/Router/runtime/core/
  providers/context`, **workbench host frame**, `canon`, `pilt` **shell**, electron host; vite
  `outDir: ../native-shell/ui/dist` preserved. **Exclude** `src/pages/{atlas,dais,forge,dossier,
  levy,notice,...}` (suite pages → empty contract-stubbed slots).

**Contract-stub strategy:** every place core currently hard-imports a suite page/controller becomes
a **module slot** resolved via an `Abstractions` contract (registry/`IModuleCatalog`-driven). Day-1
slots render a "module not installed in this repo" placeholder — **no suite code copied**.

## 3. Proof gate (success = all true)
1. `dotnet build /warnaserror` green on the core `.sln`.
2. Canonical .NET tests green (core/host tests only).
3. `vite build` green → `native-shell/ui/dist`.
4. **Dependency-direction check: ZERO `TerraFusionOS → suite-internal` references** — every suite
   touchpoint resolves through `TerraFusion.Abstractions`. (This is the load-bearing gate.)
5. No fenced material present (no PACS/Sync, no deep Pilot, no theater, no `*.backup`/`*.clean`/`.tar.gz`).

## 4. Preconditions (ALL required before WO-CORE-1 executes)
- [x] **CI green on the source HEAD** — `9a6c4f765` is green (run 28177851987: Backend .NET Tests ✓,
  Warning Gate ✓, Quality/Vitest/Security/Frontend ✓). ✅ satisfied.
- [ ] **Target `TerraFusionOS` repo exists** — repo creation is **outside this session's scope**
  (scoped to `bsvalues/terrafusion_os_1.0`). Owner must create `TerraFusionOS` (or add it to the
  session) before any skeleton lands. Until then, WO-CORE-1 is ready-but-unexecutable.
- [ ] **Explicit narrow Migrate-execution release** — a new, individually-ratified lock release
  (the Phase-1 shared-contracts release is spent; this is a *new* release class: extraction/repo).
- [ ] **History-preservation method chosen** — `git filter-repo`/subtree (history-preserving;
  recommended for the government-audit backend) vs fresh-tree. Decided at release time.

## 5. Rollback / abort
- The skeleton is **additive in a new repo**; `main` is untouched by WO-CORE-1 (no deletion from
  `terrafusion_os_1.0` in this first move). Abort = discard the new repo; `main` unaffected.
- If the dependency-direction check (§3.4) fails, **stop** — it means the boundary is wrong;
  fix the slot/contract, do not weaken the gate.

## 6. What stays parked / locked
- **PR #1073** parked. **B3 / F14 / Forge / other suites** deferred to their lanes.
- No deletion from `main`, no suite extraction, no broader release. WO-CORE-1 is **repo-skeleton
  only**; later WOs handle the controller-level cut and the monolith page-slot decoupling.

## 7. Status
**RATIFIED (boundary + cut line + leave-behind + first candidate). WO-CORE-1 specified and
ready.** Blocked only on §4 preconditions — chiefly the **target repo** (out of this session's
scope) + an explicit execution release. Recovery lock otherwise holds.
