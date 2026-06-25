# TerraFusion Shared Contracts Charter

> **Status:** authoritative · **Owner:** TerraFusionOS core · **Phase:** Migrate Phase-1
> (shared-contracts formalization). Established under `docs/forensics/MIGRATE-R1-RATIFICATION.md`
> (first narrow lock release). This file governs the cross-repo contract surface for the planned
> repo split (TerraFusionOS core · Sync · Dais · Atlas · Forge · Dossier).

## 1. Purpose
`TerraFusion.Abstractions` is the **single canonical home for cross-repo contracts** — the
interfaces, DTOs, event/payload schemas, and service contracts that more than one future repo
depends on. Contracts that live here are **core-owned but explicitly shared**; they must never be
buried inside shell, suite, or persistence code (topology rule R-SPLIT).

## 2. The dependency rule (hard — prevents inversion)
`TerraFusion.Abstractions` is the **upstream leaf**: it is referenced *by* `Core`, `Data`, `AI`,
`API`, `CostForge`, `CurrentUse`, `Consciousness`, `Operations`. Therefore:
- **Abstractions must NOT reference `Core`, suites, or any persistence/EF type.**
- A contract is **promotable only if its signature types are self-contained** — primitives,
  framework types, or types already in Abstractions. A contract that references a `Core` **entity**
  (e.g. EF entities) is **NOT promotable as-is**; promote its **DTO form first**, or leave it
  domain-local until decoupled. (This is why `ITerraFusionDbContext` stays in Core/Data — it is a
  persistence contract over EF entities, not a cross-repo contract.)

## 3. Ownership & versioning rules
- **Ownership:** every shared contract is **core-owned**. Suites consume; they do not redefine.
  Exactly one definition per contract (R-SPLIT: no duplicate ownership).
- **Versioning:** additive-by-default; **no breaking change without a new version** (e.g.
  `IFooServiceV2` / `FooResponseV2`) and a deprecation note. Consumers pin to a contract version.
- **Canonical conventions** (carried from F14): **`CountyId` is `string`** at contract boundaries
  (not Guid/int); responses use the three-state pattern where applicable (NotFound / NoEntries /
  Found). No fabricated/placeholder values in contract examples (valuation honesty).
- **No suite→suite contracts.** Cross-suite communication goes through a core-owned contract.
  Sync produces payloads *to* core contracts; suites read *from* core contracts.

## 4. The four named contract sets (Phase-1 targets)
| Set | What | Current location | Target consumers |
|---|---|---|---|
| **Workbench tab contracts** | tab host ↔ suite-surface contracts | `Core/Interfaces/Workbench/*` (`IWorkbenchSyncReadinessService`, `IWorkbenchSyncReadinessRefreshRunner`, `IPacsReachabilityProbeService`) | core (host) + all suites |
| **Sync→suite payloads** | normalized parcel/owner/sale/wsdor payloads | `Core/DTOs/CanonicalTf/*` (`OpenWorkResponse`, `ParcelOwnerCurrentResponse`, `ParcelWsdorRollResponse`, `TfSaleResponse`) | Sync (produces) → Dais/Forge/Atlas (consume) |
| **F14 levy projection / sync DTOs** | levy read-projection + cert read DTO (Option C) | *to be defined* (projection is additive; SoR stays in Dais/Levy) | Dais (SoR) → core (projection) |
| **Forge stats service contracts** | statistics / valuation service contracts | `API/Interfaces/IForgeStatisticsService.cs`, `IStatisticalAnalysisService.cs`; `Abstractions/DTOs/CostForgeStatsDto.cs` (already here) | Forge |

## 5. Contract classification (initial — each promotion is a separate verified increment)
> Promote = relocate into `Abstractions` (cross-repo). Stay = remains domain-local. This table is
> the **decision seam**; physical moves follow per §6. Classification is initial and re-confirmed
> per contract at promotion time.

### 5a. PROMOTE → Abstractions (cross-repo)

**VERIFIED-PROMOTABLE** (passed all 5 gate points 2026-06-25 — no EF/entity types, no Core-only
types in signatures, no inversion, consumers rebind cleanly, single small cluster). Increment
order by consumer surface: **GisTf (7) → Kernel (9) → CanonicalTf (21).**

| Contract cluster | From | Future home / consumers | Consumer files | Status |
|---|---|---|---|---|
| `GisTf/{ParcelGeometryResponse,ParcelNeighborResponse(+ParcelNeighbor)}` | Core/DTOs | Atlas (sync→suite geo) | 7 (API, Core, Data, tests) | **PROMOTED ✓ (Loop 25, CI-green on 5f8ef90de)** |
| `Kernel/{KernelCostApproachRequest,KernelCostApproachResponse(+KernelProvenance)}` | Core/DTOs | Forge cost approach | 9 (API, API.Tests, Core) | **PROMOTED ✓ (Loop 26, CI-green on 16c5e27a0)** |
| `CanonicalTf/{OpenWorkResponse(+Item),ParcelOwnerCurrentResponse(+Entry),ParcelWsdorRollResponse(+Entry),TfSaleResponse(+Paged)}` | Core/DTOs | sync→suite payloads | 21 (API, Core/Sync ifaces, Data, tests) | **PROMOTED — Loop 27 (CI-validating)** |

> **CountyId convention flag (do NOT change on move):** these DTOs use `Guid CountyId`; the charter
> §3 canonical convention is `string CountyId` at boundaries. Changing the type during a *move* is a
> breaking change — **promote as-is (Guid), then align to string as a separate versioned decision.**

**INTERFACE TRANCHE** — classified in `docs/forensics/INTERFACE-CLASSIFICATION-REVIEW.md` (A/B/C).
Release R2 (A-tier) opened 2026-06-25; one interface per build-verified increment.
| Contract | From | Future home | Class | Status |
|---|---|---|---|---|
| `IGisDataService` (+ co-located records) | Core/Interfaces | Atlas/Sync seam | **A** | **PROMOTED — Loop 29 (CI-validating)** |
| `IPacsReachabilityProbeService` | Core/Interfaces/Workbench | core (workbench tab) | **A** | **PROMOTED — Loop 30 (CI-validating)** |
| `IWorkbenchSyncReadinessRefreshRunner` | Core/Interfaces/Workbench | core (workbench tab) | **A** | **PROMOTED — Loop 31 (CI-validating)** |
| `IForgeStatisticsService` (+ co-located DTOs) | API/Interfaces | Forge | **A** | **PROMOTED ✓ (Loop 32, CI-green on 1653b6f7d). R2 A-tier COMPLETE — all 4 A green.** |
| `IModuleCatalog` | Core/Interfaces | core registry | **B** | DTO-first (`Module` is an entity) |
| `IValuationService` | Core/Interfaces | Forge | **B** | DTO-first (ValuationDTOs; CostApproach entity ambiguity) |
| `IWorkbenchSyncReadinessService` | Core/Interfaces/Workbench | core (workbench tab) | **B1** | **PROMOTED ✓ (Loop 36, CI-green on 84ff32d60). B1 + Workbench tab-contract cluster COMPLETE** |
| `ITerraFusionSyncService` | Core/Interfaces | Sync platform (SoT) | **B** | DTO-first cluster (`LegacySystemHealth` + ~10 POCOs) |
| `ICacheStatisticsService` | Core/Interfaces | cross-cutting | **B2** | **DTO `NegativeCacheStatistics` EXTRACTED → Abstractions/DTOs (Loop 37, CI-validating); iface = step 2 after green** |
| `IStatisticalAnalysisService` | API/Interfaces | — | **C** | **STAY** (quantum/infinite-dim theater; consciousness-coupled) |
| `ForgeValuationDtos`, `CostForgeAIDtos` | Core/DTOs | Forge | — | review for entity coupling (DTO-tier) |

### 5b. STAY domain-local (NOT cross-repo)
| Contract | Reason |
|---|---|
| `ICacheStatisticsService` | **FAILED gate 2026-06-25** — `using TerraFusion.Core.Services;`; returns `NegativeCacheStatistics` (Core type) in signature → promoting inverts the dependency. **STAY until its result type is promoted DTO-first.** (Corrects earlier "self-contained" tag.) |
| `ITerraFusionDbContext` | persistence over EF entities → Core/Data (per §2; F14: Core levy = projection) |
| `IMuseService`, `IMuseRouter`, `IMuseLlmClient`, `IMuseRouterStatusService`, `MuseTaskType` | Pilot deep AI internals → Phase 4 (R-PILOT) |
| `IQuantumConsciousnessServices`, `IQuantumAIRoutingService`* | consciousness — defer/cut |
| `ICountyStudioAiService`, `ICountyStudyService`, `ISalesAiDiagnosticService`, `ICamaDataQualityService`, `IBentonCustomMetricService`, `IEquityMetricService`, `ICodexService`, `IGitContextService`, `IDraftService`, `IRollupService`, `IContextRetrievalService`, `IAICommandService`, `IAIEngineService`, `IAISuperiorityDemonstrationService`, `IPropertyValuationAIEnhancementService` | domain/AI-internal services; not cross-repo |
| repositories (`IAnalysisResultRepository`, `IWorkflowRepository`, `IWorkflowExecutionRepository`, `IQuantumNotebookRepository`) | persistence-layer, suite/core-internal |
| `ILegacyDatabaseService`, `ICollaborationService` | domain-internal |
| most `Core/DTOs/AI*`, `Auth*`, `FISMA*`, `Collaboration*`, `Consciousness*` DTOs | domain/core-internal payloads |

\* `IQuantumAIRoutingService` already physically sits in `Abstractions/Interfaces`; flagged for
review — it may be consciousness-internal mis-placed here (do not expand its use).

## 6. Promotion procedure (per contract — build-verified, no big-bang)
1. Confirm §2 self-containment (no Core/entity/EF coupling). If coupled, promote DTOs first.
2. Move the file to `Abstractions/{Interfaces|DTOs}`; set namespace `TerraFusion.Abstractions.*`.
3. Update consumers' `using` + any DI registration.
4. **Build green** (full solution) — no behavior change. One contract (or one tight cluster) per
   increment. **No "done" claim without the green build** (HR-4).
5. Record the increment.

## 7. What this charter does NOT authorize
Repo creation, `filter-repo`/subtree moves, suite extraction, schema/persistence changes, or any
move of fenced material (CostForge "Ultimate", `LevyDbContextStub.cs`, fabricated value
placeholders, Tyler lore). Those remain lock-gated (`MIGRATE-R1-RATIFICATION.md` §3).
