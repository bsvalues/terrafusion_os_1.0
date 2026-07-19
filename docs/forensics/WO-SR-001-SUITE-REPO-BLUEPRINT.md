# WO-SR-001 — Canonical Suite Repository Ratification & Extraction Blueprint

> **Baseline:** `PROGRESS-RECONSTRUCTION-LEDGER.md` (Loop 47, commit `c1ca2370f`) is the accepted
> longitudinal truth. The program is **governed extraction of proven, tested capability** from
> `terrafusion_os_1.0` into five clean suite-ownership repos — **not** greenfield scaffolding.
> **This is a decision-layer blueprint.** It creates no repo, moves no code, releases no lock.
> Repo creation + code movement are future, individually-ratified, owner-gated Work Orders.

**Date:** 2026-06-25 · **Branch:** `claude/terrafusion-forensic-playbook-u3kvx6` · **Source main HEAD:** `2ae013561`
**Session evidence boundary:** grounded in `terrafusion_os_1.0`; **existence of any other repo is UNVERIFIABLE here** (scope = this repo only; `terrafusion-forge` probe → access-denied ≠ nonexistence).

---

## 1. Repository names (PROPOSED — require owner ratification) + existence
Names are **proposed, not final**. WO-SR-001 does not ratify them by stating them; the **owner must ratify** the final names and confirm GitHub existence. "Exists?" is **UNVERIFIABLE from this session** for every repo except this one.

| Role | Proposed name | Owns | Exists? (owner to confirm) |
|---|---|---|---|
| **OS / platform host (SOVEREIGN BASE)** | **`terrafusion_os_1.0`** (this repo) | shell, **Workbench Tier-0 host**, Brain (One Brain), Pilot, Trace, identity/auth/county/audit, Sync/PACS, shared contracts, gateway/MCP, CI/release/integration, portfolio governance | ✅ **RATIFIED** (`OWNER-DECISION-TOPOLOGY-RATIFIED.md`) — sovereign base is `terrafusion_os_1.0`; **`terrafusion-os` is a SUPERSEDED predecessor** (mine, not master). Consistent with `CAPABILITY_PLACEMENT_MAP.md`. Federated topology: base **consumes** the 5 suite repos via versioned contracts |
| Suite — valuation | `terrafusion-forge` | valuation / cost / current-use / sales | UNVERIFIABLE (access-denied) |
| Suite — spatial | `terrafusion-atlas` | GIS / spatial | UNVERIFIABLE |
| Suite — workflow | `terrafusion-dais` | assessor workflow / notices / certification / levy | UNVERIFIABLE |
| Suite — evidence | `terrafusion-dossier` | evidence / document assembly | UNVERIFIABLE |
| Suite — AI | `terrafusion-gpt` | governed AI / RAG | UNVERIFIABLE |

> **Owner action (blocking Phase 2):** ratify the five names; confirm which already exist; grant session scope or run owner-side for any repo I must read/write. Repo *creation* is owner-only (integration token returns `403`).

## 2. What RETAINS in the OS/platform (`terrafusion-os`)
Retention is the default; extraction is the exception. The OS **composes** suite capability via contracts; it does **not** surrender these:
- **Shell / desktop / windowing** — `frontend/apps/os-shell/src/shell/*`, App/Router/runtime/providers/context.
- **Property Workbench HOST** — `frontend/apps/os-shell/src/pages/workbench/**` (77 files: `PropertyWorkbench.tsx`, `PropertyWorkbenchWindow.tsx`, `tabs/`, context/placement contracts). **Tab *bodies* resolve to suites via contracts; the host stays.**
- **Brain / Work Order engine** — `scripts/brain/**`, `docs/brain/canon/**`, SEAL workflows.
- **TerraPilot** (`PilotConsole*`, backend `PilotController`/`MuseService`) and **TerraTrace** infra — cross-cutting, stay in OS.
- **Identity / auth / county-context** — auth policies, `RequireCountyAccessAsync`, county resolver.
- **Sync / PACS bridge** — `backend/src/TerraFusion.Sync`, `Core/Sync/**`, PACS adapters (owner-fence; platform ingress, **not** a suite).
- **Shared contracts** — `backend/src/TerraFusion.Abstractions/**` (the Loops 24–39 seam).
- **Integration testing + portfolio governance** — cross-repo test harness, `next-queue.json`, Loop Ledger.

## 3. Initial source-path assignments (verified paths; per-file matrix deferred to WO-*-X-001)
| Suite | Backend (verified) | Frontend (verified) | Tests / tools (verified) | First-cut note |
|---|---|---|---|---|
| **Forge** | `backend/src/TerraFusion.CostForge`, `TerraFusion.CurrentUse`(+`.Host`) | `frontend/apps/os-shell/src/pages/forge` (**307**) | `backend/tests/{TerraFusion.CostForge.Tests,CurrentUse.Tests,SalesForge.Tests}`, `backend/tools/{CostForgePerfHarness,SalesCompProof}` | **strongest → pilot.** Consumes valuation contracts already in Abstractions |
| **Atlas** | GIS geometry in `TerraFusion.Data`; `IGisDataService` (in Abstractions) | `frontend/apps/os-shell/src/pages/atlas` (**20**) | `backend/tools/SyncAtlas` | **maps are placeholder** (`atlas/components/MapContainer.tsx`) → close #1073 rendering *before* cutover |
| **Dais** | Dais entities+services in `TerraFusion.Core`, `DaisController` in `TerraFusion.API`, `TerraFusion.Levy`(+`LevyDbContext`) | `pages/dais` (**8**, thin), `pages/notice` (**16**) | `backend/tests/TerraFusion.Levy.Tests`; Dais hosted-service + endpoint-contract tests | backend strong, fe thin → **extract backend, thicken fe** |
| **Dossier** | Dossier controllers/entities in `API`/`Core`; evidence-packet services | `pages/dossier` (**1**) | evidence-packet component tests | thinnest → **consolidate ownership slice first; do not split early** |
| **GPT** | Muse/RAG surfaces in `TerraFusion.AI` (careful: Muse also powers OS-retained Pilot) | `pages/suites` (**49**, GPT modules) + `MuseChat.tsx` | AI contract tests | needs **safety/tool/citation boundary** frozen before extraction |

## 4. Shared contracts each suite consumes (from the `Abstractions` seam)
The Phase-1 seam already exists — suites **consume**, OS **owns**. Verified present in `TerraFusion.Abstractions`:
- **Forge:** `DTOs/{CostForgeStatsDto,CostMatrixDto,PropertyValuationInputDto,ValuationResultDto,Kernel/KernelCostApproach*}`, `Interfaces/IForgeStatisticsService`.
- **Atlas:** `DTOs/GisTf/{ParcelGeometryResponse,ParcelNeighborResponse}`, `Interfaces/IGisDataService`.
- **Dais/Workbench:** `DTOs/Workbench/SyncReadinessDto`, `Interfaces/Workbench/{IWorkbenchSyncReadinessService,IWorkbenchSyncReadinessRefreshRunner,IPacsReachabilityProbeService}`, `DTOs/CanonicalTf/*`.
- **Cross-cutting:** `Interfaces/{IAuditLogger,ICacheStatisticsService,ICitizenContextService,IPerformanceMonitor}`.
- **Deferred (still in Core, DTO-first before promotion):** `ITerraFusionSyncService` (PACS fence → stays OS/Sync), `IModuleCatalog`, `IValuationService`.

## 5. Disposition taxonomy (every candidate path gets exactly one)
`RETAIN_IN_OS` · `EXTRACT_EXACT` (move verbatim, history-preserving) · `REWRITE_FOR_SUITE` (re-author against contracts) · `SHARE_AS_CONTRACT` (promote to Abstractions, both consume) · `MINE_PATTERN` (copy idea, not file) · `DEFER` · `REJECT` (theater/`*.backup`/`*.clean`/`.tar.gz`/quarantine).

## 6. Extraction matrix (schema + worked Forge rows — full matrix = WO-FORGE-X-001)
Schema: `Source path | Current capability | Target | Action | Shared dep | Tests | Provenance (SHA/WO) | Cutover gate`

| Source path | Capability | Target | Action | Shared dep | Tests | Provenance | Cutover gate |
|---|---|---|---|---|---|---|---|
| `backend/src/TerraFusion.CostForge/**` | cost approach engine | forge | EXTRACT_EXACT | `IForgeStatisticsService`, `CostForgeStatsDto` | `CostForge.Tests` | source SHA + WO-FORGE-X-005 | build-green + tests parity |
| `backend/src/TerraFusion.CurrentUse/**`(+`.Host`) | current-use valuation | forge | EXTRACT_EXACT | `CurrentUseDbContext` (own) | `CurrentUse.Tests` | SHA + WO-FORGE-X-005 | migrations apply green |
| `frontend/.../pages/forge/**` (307) | valuation/sales/AVM UI | forge | EXTRACT_EXACT | Workbench tab contract | vitest forge suite | SHA + WO-FORGE-X-004 | renders in Workbench via contract |
| `frontend/.../pages/workbench/**` | Workbench host | **OS** | RETAIN_IN_OS | forge tab contract | workbench tests | — | Forge tab resolves through contract |
| `backend/src/TerraFusion.Abstractions/DTOs/CostForgeStatsDto.cs` | contract | **OS (shared)** | SHARE_AS_CONTRACT | — | — | Loop 38 | both repos consume |

## 7. Dependency & build boundaries
- **One-way dependency:** `suite → Abstractions (contract) → OS`. **No** suite→OS-internal edge; **no** suite→suite edge. (The Loop-41 core proof gate — "zero core→suite internal refs" — applies in reverse for suites.)
- **Build:** each suite = independent `.sln`/vite build + own CI (frozen-lockfile, warnaserror, its own tests). `Abstractions` ships as project-ref now → package-ref at multi-repo time.
- **DB:** Levy/CurrentUse carry their own DbContexts with them; core `TerraFusionDbContext` stays in OS; suite domain leaves `Core`/`Data` **type-by-type**, not whole-project.

## 8. Test / evidence required before ownership cutover (per suite)
1. Suite builds green standalone (warnaserror) + its migrations apply.
2. Suite's own tests pass in its repo (Forge: CostForge/CurrentUse/SalesForge suites).
3. **Parity proof:** behavior identical to monorepo (golden outputs / contract tests).
4. Workbench renders the suite tab **through the contract** (no hard import).
5. Provenance recorded (source SHA + WO) in the suite's provenance ledger.
6. **Only then** retire the duplicated monorepo ownership (`COPY-THEN-DELETE`, never delete-first).

## 9. Bootstrap sequence
- **Phase 1 — Freeze contracts & ownership (no code moved):** suite-identity, county-context, Workbench context/launch, Trace correlation envelope, authz/actor, error/availability, version-compat, per-suite write-lane. Extends the existing `Abstractions` seam.
- **Phase 2 — Create 5 receiving repos (owner-only):** governance + branch protection, **no runtime code**. Reuse the `terrafusionos-vessel/` governance scaffold pattern (Loop 44) per suite.
- **Phase 3 — TerraForge pilot extraction:** prove provenance, dependency separation, contract consumption, retained OS composition, independent build/test, cross-repo integration.
- **Phase 4 — Remaining suites** in uncertainty-minimizing order: **Atlas → Dais → Dossier → GPT** (Atlas after #1073 maps; GPT after safety/citation boundary). Lanes may overlap once the Forge pattern + contracts are proven.

## 10. Work Order chain
**Portfolio foundation:** `WO-SR-001` (this) → `WO-SR-002` freeze OS↔suite contracts → `WO-SR-003` create 5 repos + protections (owner-only) → `WO-SR-004` install governance/evidence scaffold → `WO-SR-005` cross-repo contract validation → `WO-SR-006` register suites in Brain/portfolio state.
**Forge pilot:** `WO-FORGE-X-001` inventory proven impl on main → `X-002` disposition/provenance matrix → `X-003` bootstrap build+contract boundary → `X-004` first compile-safe slice → `X-005` domain services + tests → `X-006` rebind Workbench via contracts → `X-007` parity proof + retire monorepo ownership.
**Repeat pattern:** `WO-{ATLAS,DAIS,DOSSIER,GPT}-X-001..007` (inventory → disposition → bootstrap → first compile-safe extraction → service/domain → Workbench/platform rebind → parity + source retirement).

## 11. Locks / what stays blocked
- **Repo creation (Phase 2 / WO-SR-003):** owner-only — integration token `403`; unchanged.
- **Code movement (Phase 3+):** each a future individually-ratified execution release; migration-execution **ACTIVE-LOCKED** until then.
- **PACS/Sync:** owner-fence; stays in OS. **Property Workbench:** stays in OS (composes, never absorbs).
- WO-SR-001 is **the blueprint**; it authorizes nothing beyond planning.

## 12. Owner ratification checklist (unblocks WO-SR-002/003)
```text
[ ] Final 5 suite repo names ratified (or corrected)
[ ] Existence of each confirmed (create the missing ones — owner-only)
[ ] terrafusion-os confirmed as OS/platform host successor
[ ] Retention list (§2) accepted
[ ] Initial source-path assignments (§3) accepted
[ ] Disposition taxonomy (§5) + cutover gates (§8) accepted
[ ] Forge-first pilot accepted; Phase-4 order accepted
[ ] Session scope for suite repos granted (or agreed owner-side execution)
```
