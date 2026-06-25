# Migrate-Phase Split Plan (decision-only)

*First artifact of the **Migrate** phase, opened by `TIER1-CLOSURE-RECORD.md`. The Tier-1 port
thesis is closed; **the evolved `main` spine is the migration source.** This plan maps *what splits
out of `main` into which repo, in what order, with which contracts extracted first*. **No code, no
repo creation, no `git filter-repo`/subtree, no lock release.** Recovery lock remains **ACTIVE**;
each repo's *execution* is a future, individually-ratified narrow release.*

**Date:** 2026-06-25 · **Branch:** `claude/terrafusion-forensic-playbook-u3kvx6` · **PR:** #1080 (draft)

---

## 0. First principles (carried from ratified doctrine)
- **Source = `main`, not branches** (Closure Record). Migration is a **split of the evolved
  spine**, not a port.
- **Contracts before consumers** (topology matrix R-SPLIT): the shared-contract surface is
  extracted/formalized **first**; no suite extracts before the contracts it depends on exist.
- **Split ≠ duplicate** (R-SPLIT): every split surface needs exactly one owner each for
  runtime · contracts · persistence · ingestion · UI host · tests. **Unfilled cell ⇒ do not split.**
- **Honor the fences** (Closure Record §4): CostForge "Ultimate", `LevyDbContextStub.cs`,
  fabricated value placeholders, Tyler lore, `*.tar.gz` — never migrate.
- **Maturity-aware**: extract what is real and bounded now; defer embedded/immature surfaces.

## 1. Spine inventory (grounded in `main`) → target repo

| Target repo | Backend in `main` | Frontend in `main` | Maturity | Migrate readiness |
|---|---|---|---|---|
| **TerraFusionOS** (core) | `TerraFusion.API`, `.Core`, `.Data`, `.Abstractions`, `.Security`, `.Operations`, shell host | `workbench` (77), `canon`, `pilt`, `suites`, `shared`, shell | **high** (live spine) | **Phase 1 — found core** |
| **core: shared-contracts** | `TerraFusion.Abstractions/{DTOs,Interfaces}` + scattered `Core/DTOs`, `Core/Interfaces` | tab/payload contracts | medium (scattered) | **Phase 1 — extract+formalize FIRST** |
| **TerraFusion-Sync** (platform) | `TerraFusion.Sync`, `Core/Sync/**`, `Data/Services/{LegacyPacsRaw,TruthPacs,CanonicalTf}`, `Core/GIS/ArcGisRest` | (none — headless) | **high** (real ETL) | **Phase 2** (behind contracts) |
| **TerraFusion-Atlas** (suite) | spatial *UI-facing* readers only (seam: ingestion stays in Sync) | `atlas` (20) | medium | **Phase 3a** |
| **TerraFusion-Dais** (suite) | `TerraFusion.Levy` (**SoR, Option C**), permits, cert; `Core/Entities/Levy` = projection | `dais` (8) + `levy` (1) | backend-high / frontend-thin | **Phase 3b** |
| **TerraFusion-Forge** (suite) | `TerraFusion.CostForge`, `TerraFusion.CurrentUse(.Host)`, stats in `TerraFusion.AI/{Regression,Spatial}`, `API/Services/*Statistics*` | `forge` (**307**) | **high / large** | **Phase 3c** |
| **TerraFusion-Dossier** (suite) | **embedded** — `API/Controllers/DossierController.cs`, `Core/Entities/Dossier*`, `Core/DTOs/*Dossier*` (no project) | `dossier` (**1**) | **low / immature** | **Phase 3d — extract-thin or DEFER** |

## 2. Phase 1 — Found the core (lowest risk; merge-mostly)
**Goal:** stand up `TerraFusionOS` as the runtime composition + host, and **formalize the
shared-contracts surface before any suite leaves.**
- **Contracts-first (the gating sub-step):** consolidate `TerraFusion.Abstractions/{DTOs,
  Interfaces}` + the levy projection/sync DTOs (F14 criterion 5) + `IForgeStatisticsService`
  + workbench tab contracts + sync→suite payload contracts into the **core shared-contracts**
  surface. Until this exists, **no suite (3a–3d) is cleared to split.**
- **Core contents:** shell, workbench **host** (77 files), canon/governance, registry, runtime
  composition, shell-facing Pilot/Muse/LocalOps (R-PILOT: deep AI internals stay, Phase 4).
- **Blocker/risk:** contracts are currently scattered (`Abstractions` + `Core`); formalizing them
  is the real Phase-1 work, not the shell move.
- **First-release candidate:** the shared-contracts package (proves the seam before suites pull on it).

## 3. Phase 2 — Platform ingress (`TerraFusion-Sync`)
- **Migrates:** `TerraFusion.Sync`, `Core/Sync/**`, PACS landing/truth/canonical services,
  `ArcGisRest` nightly ingestion. Headless (no frontend).
- **Seam (R-ATLAS):** spatial **ingestion / nightly feed → Sync**; spatial **UI → Atlas**. Sync
  owns the geo *feed*, not the map.
- **Depends on:** Phase-1 contracts (sync→suite payload). **Fence:** PACS source-of-truth
  direction immutable (PACS→TF); county isolation.
- **Salvage micro-fragments (from Sync entry-check):** verify the malformed-county-key guard /
  WSDOR doc-comment against main's current files *if touched* — not a lane.
- **First-release candidate:** `TerraFusion.Sync` + its `Core/Sync` deps as a clean headless module.

## 4. Phase 3 — Suites (in order; platform settles first)

### 3a — `TerraFusion-Atlas` (map UI / spatial interaction)
- Migrates: `frontend atlas` (20) + UI-facing spatial readers. **Ingestion stays in Sync.**
- Note: **PR #1073 (atlas-maplibre)** is the one parked contained win — it lands the maplibre
  migration in `main` first, *then* Atlas splits cleanly (do not split mid-migration).
- Ownership cells (R-SPLIT): runtime=Atlas(UI)/Sync(feed) · contracts=**core** · persistence=Atlas(view state)/Sync(geo) · ingestion=**Sync** · UI host=core shell · tests=per repo. **All filled.**

### 3b — `TerraFusion-Dais` (Levy SoR + permits + cert)
- Migrates: `TerraFusion.Levy` (the **de-stubbed real SoR**, Option C) + permits/cert; `dais`(8)+`levy`(1) frontend.
- **Option-C discipline at split:** Dais owns Levy persistence; `Core/Entities/Levy` stays a
  **read-only projection** in core (no dual-write, no shadow schema). The F14 migration plan
  (criterion 4) is the precondition. **Fence:** `LevyDbContextStub.cs` (never migrate).
- Ownership cells: runtime=Dais · contracts=**core** · persistence=**Dais** · ingestion=Sync · UI host=core(workbench tab) · tests=Dais. **All filled.**
- Note: frontend is thin (9 files) — Dais is a **backend-weighted** split.

### 3c — `TerraFusion-Forge` (stats / valuation / current-use)
- Migrates: `TerraFusion.CostForge`, `TerraFusion.CurrentUse(.Host)`, stats engines
  (`TerraFusion.AI/{Regression,Spatial}`, `API/Services/*Statistics*`, `ForgeStatisticsService`),
  `forge` frontend (**307** — largest suite). `IForgeStatisticsService` = **core shared-contract**.
- **Fence:** CostForge "Ultimate" theater + `$425k`/Tyler lore — **CUT, never migrate.**
- **Risk:** largest surface; current-use has its own DB (`CurrentUseDbContext`) → apply
  `fix/currentuse-sqlite-provider-fix` at migrate time (per F14). Sequence late so contracts +
  Sync feed are stable.
- Ownership cells: runtime=Forge · contracts=**core** (`IForgeStatisticsService`) · persistence=Forge(+CurrentUse DB) · ingestion=Sync · UI host=core shell · tests=Forge. **All filled.**

### 3d — `TerraFusion-Dossier` (parcel dossier / docs) — **extract-thin or DEFER**
- Reality: **no backend project** (embedded in `API` + `Core/Entities/Dossier*`); **1 frontend file.**
- **R-SPLIT verdict:** ownership cells are **NOT cleanly fillable today** (no distinct runtime,
  no persistence boundary). ⇒ **Do NOT split yet.** Either (a) first *consolidate* dossier into a
  bounded module inside core, then split later, or (b) defer to a later wave. **Flagged: premature
  to extract.**

## 5. Extraction mechanics (framed, NOT chosen — decision-only)
For each repo, history-preservation method is a future decision:
- **Option H (history-preserving):** `git filter-repo`/subtree split to carry blame/history.
- **Option F (fresh-tree):** copy current module into a new repo (clean, loses history).
- Recommendation lean: **H for backend modules** (Sync/Levy/Forge — provenance matters for
  government audit), **F acceptable for thin frontend suites**. *Chosen per-repo at release time.*

## 6. Sequencing summary
**1 (core + contracts-FIRST) → 2 (Sync) → 3a (Atlas, after PR #1073 lands) → 3b (Dais/Levy, after
F14 migration) → 3c (Forge) → 3d (Dossier: consolidate-then-split or defer).** Phase 4 (Pilot deep
AI / mesh) stays deferred (R-PILOT). No phase starts before its predecessor's contracts exist.

## 7. Per-repo "proof of success" (of the PLAN, not execution)
Each repo section is ready to convert to a narrow release work order when it can show: source
modules enumerated (real `main` paths ✓), all R-SPLIT ownership cells filled (✓ except Dossier),
dependencies sequenced behind contracts (✓), fences listed (✓), and a first-release candidate named (✓).

## 8. What stays gated
Repo **creation**, `filter-repo`/subtree **execution**, any file movement, and contract
**code** are all **lock-gated**. This plan authorizes none of them. The first executable step —
when the owner releases it — is **Phase-1 shared-contracts formalization inside `main`** (no new
repo yet), which de-risks every later split. Recovery lock remains **ACTIVE**.

## 9. Next
Reassess with the owner: (a) ratify this split plan + sequencing; (b) authorize the **first narrow
Migrate release = Phase-1 shared-contracts formalization** (in-repo, no new repos); or (c) take the
parked **PR #1073** first so Atlas (3a) can later split cleanly.
