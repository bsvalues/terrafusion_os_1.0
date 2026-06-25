# TerraFusionOS Core — First Topology-Split Plan (decision-only)

> **First repo boundary of the Migrate topology split.** Builds on `MIGRATE-SPLIT-PLAN.md`
> (Phase-1 sequencing) and `founding/TERRAFUSIONOS-FOUNDING-PLAN.md`. Source = the evolved `main`
> spine (Tier-1 port thesis closed). **Decision-only: no repo creation, no extraction, no code
> movement, no lock release.** Recovery lock holds; this is a ratifiable plan, not an action.

**Date:** 2026-06-25 · **Branch:** `claude/terrafusion-forensic-playbook-u3kvx6` · **PR:** #1080 (draft)

## 0. Governing reality (the hard part)
`frontend/apps/os-shell` is a **monolith**: it holds the core shell host **and** every suite's
pages (`pages/{atlas,dais,forge,dossier,levy,notice,…}`). Backend `TerraFusion.Core`/`.Data` host
suite **domain** (Levy/Forge/CurrentUse entities) alongside core. **So the core split is a
cut *inside* these projects, not a clean project lift.** The plan below draws that line. The
shared-contract seam (`TerraFusion.Abstractions`, Phase-1) is what makes this drawable without
guessing — suites will consume contracts from there, not from core internals.

---

## 1. Source-of-truth extraction map (core-owned → first repo)
| Surface | Current path in `main` | Keep in 1st repo? | Why | Owner | Contract deps | Blockers |
|---|---|---|---|---|---|---|
| **Desktop/windowing shell** | `frontend/apps/os-shell/src/shell/` (`DesktopShell.tsx`, `WindowManager.tsx`, `ModuleLauncher.tsx`, `ShellLayout.tsx`, `SystemTray.tsx`, `command-palette`) | **YES** | the OS shell itself | core | none (host) | drop `*.backup.tsx`/`*.clean.tsx` dupes |
| **App composition / routing** | `src/App.tsx`, `Router.tsx`, `TerraFusionApp.tsx`, `routes/`, `routing/`, `runtime/`, `core/`, `orchestration/`, `providers/`, `context(s)/` | **YES** | runtime composition | core | module/registry contracts | routes reference suite pages → must become contract-driven module slots |
| **Electron desktop host** | `frontend/electron/`, build target `native-shell/ui/` | **YES** | desktop packaging | core | none | vite outDir contract (`../native-shell/ui/dist`) preserved |
| **Workbench HOST** | `src/pages/workbench` (host/tab-frame only) + tab contracts in `Abstractions` | **YES (host only)** | R-WB: host + tab contract; suites render *inside* | core | workbench tab contracts (✅ in Abstractions) | must split host vs suite-domain tab bodies |
| **Canon / governance tooling** | `src/canon/`, `.governance/`, canon backend surfaces | **YES** | governance is core | core | core-owned | — |
| **Registry / module catalog** | `tools/registry/`, `os-platform/core/ToolRegistry.js`, backend `ServiceRegistry`, `IModuleCatalog` | **YES** | runtime module discovery | core | `IModuleCatalog` (DEFER — needs `ModuleDto`) | IModuleCatalog still returns `Module` entity (B-tier DEFER) |
| **Shell-facing Pilot / Muse / LocalOps** | `backend/src/TerraFusion.AI/Services/Muse*.cs`, `src/pages/pilt` (shell), `os-platform/core/pilot/{local-agent,trace,ops}` | **YES (shell-facing only)** | R-PILOT: shell surfaces in core; deep AI internals deferred | core | Muse/Pilot shell contracts | deep AI internals (Phase 4) must NOT come |
| **Kernel API host** | `backend/src/TerraFusion.API` (Program.cs composition, auth, health, hubs) **minus** suite controllers | **YES (host + core controllers)** | the kernel | core | most contracts in Abstractions | ~150 controllers mix core + suite → controller-level cut |
| **Core domain libs** | `TerraFusion.Core`, `.Data`, `.Abstractions`, `.Security`, `.Operations` | **YES (core slices)** | shared kernel libs | core | Abstractions = the seam | `Core`/`Data` also hold suite domain → **type-level cut, not whole-project** |
| **Shared contracts** | `TerraFusion.Abstractions` (Phase-1 formalized) | **YES (whole)** | the cross-repo seam | core (shared) | — | none — already the clean seam |

---

## 2. Leave-behind map (NOT in the first repo)
| Surface | Current path | Future repo | Why excluded from 1st split |
|---|---|---|---|
| Sync / PACS ETL | `TerraFusion.Sync`, `Core/Sync/**`, `Data/Services/{LegacyPacsRaw,TruthPacs,CanonicalTf}`, PACS adapters | **TerraFusion-Sync** | platform ingress; PACS owner-fence; B3 (`ITerraFusionSyncService`) lands here |
| Atlas suite | `src/pages/atlas` (20) + spatial UI | **TerraFusion-Atlas** | suite UI; PR #1073 lands maplibre first |
| Dais / Levy domain | `TerraFusion.Levy`, `src/pages/{dais,levy}`, permits/cert | **TerraFusion-Dais** | ratified SoR (Option C); F14 migration precedes |
| Forge suite/domain | `TerraFusion.CostForge`, `.CurrentUse`, stats engines, `src/pages/forge` (307) | **TerraFusion-Forge** | largest suite; `IValuationService` DEFER (F14/Forge) |
| Dossier internals | `API/Controllers/DossierController`, `Core/Entities/Dossier*`, `src/pages/dossier` (1) | **TerraFusion-Dossier** | embedded/immature → consolidate-then-split (per split plan §3d) |
| Pilot deep AI internals | `os-platform/core/pilot/src` deep, AI internals | **undecided (→ Pilot?)** | Phase 4; runtime-real + owned first (R-PILOT) |
| Theater / legacy-only | CostForge "Ultimate", consciousness/quantum, `*.backup/*.clean`, `.tar.gz` | **legacy/archive** | F18 Tier-5 / fenced — never copy in |

---

## 3. Bootstrap plan (what `TerraFusionOS` needs day 1)
- **Workspace skeleton:** a backend `.sln` with `TerraFusion.API` (host) + `.Core` (core slice) +
  `.Data` (core slice) + `.Abstractions` + `.Security` + `.Operations`; a frontend `os-shell` app
  (shell host + workbench host + canon + pilt-shell) building to `native-shell/ui/dist`.
- **Build path:** `dotnet build` (central `Directory.Packages.props` copied) + `vite build`
  (preserve `outDir: ../native-shell/ui/dist`).
- **CI minimum:** the gating jobs proven this phase — Warning Gate (`/warnaserror`), Backend .NET
  canonical tests, Vitest, Frontend Build, Classify Changes. (Drop the suite-specific gates.)
- **Config/env minimum:** `appsettings.json` + `.Development`; JWT/auth config; **no** Levy/CurrentUse
  connection strings (those leave with their suites).
- **Contract strategy:** `TerraFusion.Abstractions` ships as the **shared-contracts package**
  (project-ref now; NuGet/package-ref at multi-repo time). Suites depend on it; core owns it.
- **Test minimum:** the core/host unit + smoke tests (shell, workbench host, canon, registry,
  Muse/Pilot shell); suite tests leave with suites.

## 4. Cut line (blunt)
- **Must exist for `TerraFusionOS` to stand up:** shell host + windowing, app composition/routing
  as **contract-driven module slots** (not hard imports of suite pages), workbench **host**, canon/
  governance, registry, Muse/Pilot **shell** surfaces, the kernel API host with **core-only**
  controllers, the core slices of `Core`/`Data`, and **all of `Abstractions`**.
- **May remain temporarily in `main`:** suite domain in `Core`/`Data` and suite controllers in
  `API` **until their suite repo extracts** — core references them through **contracts only**, never
  by reaching into suite internals. (Transitional, time-boxed; not a permanent fork.)
- **Must NEVER be copied in "for convenience":** any suite page/domain (atlas/dais/levy/forge/
  dossier), Sync/PACS code, deep Pilot internals, consciousness/quantum, CostForge "Ultimate",
  `*.backup/*.clean` dupes, `.tar.gz` bundles. Copying these recreates the monolith.

## 5. First execution candidate (after ratification)
- **The move:** stand up the repo skeleton around **`TerraFusion.Abstractions` + the kernel host
  shell** — i.e. the seam package + the minimal bootable shell — *nothing suite*.
- **How small:** smallest bootable unit = `Abstractions` (already clean) + `TerraFusion.API`
  Program.cs host wired to **core-only** controllers + the frontend shell host. Suite slots are
  empty/contract-stubbed on day 1.
- **Proof the split works:** the core repo **builds green** (warnaserror + canonical tests +
  frontend build) with **zero references into suite internals** — every suite touchpoint resolves
  through `Abstractions`. A dependency-direction check (no core→suite edge) is the success gate.

## 6. Deferred / parked (unchanged)
- **B3 `ITerraFusionSyncService`** → inside the future TerraFusion-Sync split (PACS fence).
- **F14 / Forge** (`IValuationService`, levy SoR data migration) → after core + Sync planning.
- **PR #1073** (Atlas maplibre) → still parked as a contained alternative win.

## 7. What this plan is / isn't
- **Is:** a ratifiable definition of the first repo boundary — what's core, what leaves, day-1
  bootstrap, the cut line, and the smallest first move with a success gate.
- **Isn't:** execution. No repo created, no files moved, no lock released. Each step (skeleton,
  controller-level cut, monolith page-slot decoupling) is a future, individually-ratified release.

**Next:** owner ratifies the boundary + cut line → then the first execution candidate (repo
skeleton around Abstractions + kernel host shell) becomes the first narrow Migrate-execution release.
