# Interface Classification Review (read-only; lock held)

> **Phase-1 shared-contracts — interface tranche.** Read-only per-interface gate pass before any
> promotion (contracts-first discipline). **No code movement.** Lock remains PARTIALLY RELEASED
> (shared-contracts only); no new release opened by this doc. Sorts every remaining cross-repo
> interface candidate into **A promote-now / B DTO-first / C stay**.

Easy DTO tranche already CI-green: GisTf, Kernel, CanonicalTf. This review gates the harder
interface tranche where inversion risk lives (cf. `ICacheStatisticsService`).

## Verdict table
| Interface | Location | Key signature types | Core types? | Entity/Data ctx? | Consumers | Verdict | Notes |
|---|---|---|---|---|---|---|---|
| **IGisDataService** | Core/Interfaces | `ParcelBoundaryResult`, `ParcelLayersResult` (+ records) | **No** | No | API | **A — promote now** | All response records **co-located in same file**, pure primitives. Cleanest single-file move. Home: Atlas/Sync seam |
| **IWorkbenchSyncReadinessRefreshRunner** | Core/Interfaces/Workbench | `WorkbenchSyncReadinessRefreshResult(+Surface)` | **No** | No | API, **Sync** | **A — promote now** | Result records co-located; Guid/string/DateTime/IReadOnlyDictionary. Workbench tab contract |
| **IPacsReachabilityProbeService** | Core/Interfaces/Workbench | `PacsReachabilityProbeResult` | **No** | No | API, **Sync** | **A — promote now** | Result record co-located; Guid/string/DateTime. Sanitized (no secrets) |
| **IForgeStatisticsService** | **API**/Interfaces | `StrataResultDto`, `OutlierRecordDto`, `ModelComparisonDto`, `CompareModelsRequest`, … | **No** | No | API, API.Tests | **A — promote now** | All DTOs **co-located in same file**; pure primitives. The *real* IAAO/ratio-study contract (COD/PRD). Move API→Abstractions is "up" (valid). Home: Forge |
| **IModuleCatalog** | Core/Interfaces | `Module` | **Yes** | **Yes (EF entity)** | API | **B — DTO-first** | Returns `Core/Entities/Module.cs` (EF entity). Define `ModuleDto` first; do not export an entity across the seam |
| **IValuationService** | Core/Interfaces | `CostApproachResult`, `SalesComparisonResult`, `IncomeApproachResult`, `ReconciliationResult`, `ParcelYearLayersResult` | **Yes** | **mixed** | API, tests | **B — DTO-first** | Result DTOs in `Core/DTOs/ValuationDTOs.cs` + `ForgeValuationDtos.cs`; **`CostApproach` also exists as an Entity** (`Entities/Forge/CostApproach.cs`) → resolve DTO-vs-entity ambiguity, promote DTOs first. Home: Forge |
| **IWorkbenchSyncReadinessService** | Core/Interfaces/Workbench | `SyncReadinessDto` | **Yes** | No | API, **Sync** | **B — DTO-first** | `SyncReadinessDto` in `Core/DTOs/Workbench/`. Promote that DTO first — then this joins the two A workbench runners. **The workbench tab-contract cluster splits A/B** |
| **ITerraFusionSyncService** | Core/Interfaces | `SyncResult`(✓already in Abstractions) + ~10 co-located POCOs + **`LegacySystemHealth`** | **Yes (1 external)** | No | API, **Core**, tests | **B — DTO-first / cluster** | THE sync platform contract (→ Sync SoT). Mostly self-contained POCOs, but depends on `LegacySystemHealth` (in `ILegacyDatabaseService.cs`). Resolve that dep + decide which co-located POCOs travel; large surface — handle as its own careful cluster |
| **ICacheStatisticsService** | Core/Interfaces | `NegativeCacheStatistics` | **Yes** | No | (cross-cutting) | **B — DTO-first** | (Already flagged Loop 25) returns `Core.Services.NegativeCacheStatistics`. Promote/define that type first or it inverts |
| **IStatisticalAnalysisService** | **API**/Interfaces | `StatisticalAnalysisResult`, `InfiniteDimensionalModel`, `SignificanceValidationResult`, … | self-co-located | No | API | **C — STAY (theater-adjacent)** | "quantum-enhanced / infinite-dimensional / championship-level" (F18 Tier-5 language); result types also consumed by `TerraFusion.Research/ConsciousnessParameterTuningService` (quarantine zone). **Not a real cross-repo contract** — do not promote. Distinct from the *real* `IForgeStatisticsService` (A) |

## Summary
- **A (promote now) — 4:** `IGisDataService`, `IWorkbenchSyncReadinessRefreshRunner`,
  `IPacsReachabilityProbeService`, `IForgeStatisticsService`. All carry their DTOs in-file (or use
  only primitives), no EF/entity/Core coupling, consumers already reference Abstractions.
- **B (DTO-first) — 5:** `IModuleCatalog`, `IValuationService`, `IWorkbenchSyncReadinessService`,
  `ITerraFusionSyncService`, `ICacheStatisticsService`. Each blocked on a signature type that must
  be promoted (or de-entitied) first.
- **C (stay) — 1:** `IStatisticalAnalysisService` (theater-adjacent; not cross-repo).

## Notable findings
1. **Real vs theater split confirmed at the contract layer:** the genuine Forge stats contract is
   `IForgeStatisticsService` (IAAO COD/PRD — A); `IStatisticalAnalysisService` (quantum/infinite-
   dimensional, consciousness-coupled) is theater → **C, do not promote** (matches F17/F18).
2. **Workbench tab-contract cluster splits A/B:** two runners are self-contained (A); the readiness
   *service* needs `SyncReadinessDto` first (B). They cannot all move together — DTO leads.
3. **`IModuleCatalog` / `IValuationService` would export entities** (`Module`, `CostApproach`) —
   exactly the inversion the dependency rule (§2) forbids. DTO-first, not as-is.
4. **`ITerraFusionSyncService` is the highest-value but heaviest** (Sync SoT, ~10 POCOs +
   `LegacySystemHealth`). Worth a dedicated cluster, not a quick promote.

## Recommended order (when a new narrow release is authorized — NOT now)
1. **`IGisDataService`** — cleanest single-file A (API-only consumer).
2. **`IPacsReachabilityProbeService` + `IWorkbenchSyncReadinessRefreshRunner`** — self-contained
   workbench/sync tab contracts (API+Sync).
3. **`IForgeStatisticsService`** — self-contained Forge contract (API+tests).
4. *(then B tier)* promote the gating DTOs first (`SyncReadinessDto`, `ValuationDTOs`,
   `NegativeCacheStatistics`, `ModuleDto`), each its own verified increment, before their interfaces.
5. **`ITerraFusionSyncService`** — last, as a dedicated cluster after `LegacySystemHealth` resolved.
6. **`IStatisticalAnalysisService`** — never (C).

Lock unchanged. This is a decision artifact; opening the first A-interface release is a separate
owner authorization.
