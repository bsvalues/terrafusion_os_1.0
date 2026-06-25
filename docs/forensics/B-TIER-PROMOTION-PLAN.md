# B-Tier Interface Promotion Plan (read-only verification)

> **Phase-1 shared-contracts — B-tier (DTO-first) verification pass.** Read-only; **no code
> movement, no new release opened.** Each B interface is blocked on a signature type that must be
> promoted (or resolved) first. Sorts the 5 B interfaces by promotion risk + smallest safe unit.
> Lock remains PARTIALLY RELEASED (R1 DTOs + R2 A-interfaces); B/C ACTIVE-LOCKED.

A-tier (4 interfaces) + R1 DTO clusters are all CI-green. This pass gates whether/how to open a
B-tier release.

## Per-interface findings
| Interface | Signature dep that blocks it | Dep location | Dep shape | Inversion risk | Verdict |
|---|---|---|---|---|---|
| **IWorkbenchSyncReadinessService** | `SyncReadinessDto` | `Core/DTOs/Workbench/SyncReadinessDto.cs` | **self-contained** (System usings only; zero `TerraFusion.` refs) | low | **B1 — promote now** (DTO-first, then iface) |
| **ICacheStatisticsService** | `NegativeCacheStatistics` | buried in `Core/Services/NegativeCachingService.cs` (line 423) | **plain POCO** (long counters, double, TimeSpan, DateTime, Dictionary) — but co-located in a service/infra file | low (after extraction) | **B2 — extract POCO first, then iface** |
| **ITerraFusionSyncService** | `LegacySystemHealth` + ~10 co-located POCOs | `LegacySystemHealth` in `Core/Interfaces/ILegacyDatabaseService.cs`; POCOs in the iface file | all **plain POCOs** (no EF/entity) | low per-type, but **large surface** + `LegacySystemHealth` is shared with `ILegacyDatabaseService` (stays) | **B3 — heavy mechanical cluster (dedicated)** |
| **IModuleCatalog** | `Module` | `Core/Entities/Module.cs` | **EF ENTITY** (`int Id`, `[Required]`, `CreatedAt/UpdatedAt` audit, `Core.Enums`) | **high** — would export an entity | **DEFER — needs a NEW `ModuleDto` + impl mapping (behavior-adjacent, not a move)** |
| **IValuationService** | `CostApproachResult`, `SalesComparisonResult`, `IncomeApproachResult`, `ReconciliationResult`, `ParcelYearLayersResult` | **name-collision across Entities/Forge + DTOs/ForgeValuationDtos** | `CostApproachResult` & `IncomeApproachResult` exist as **BOTH Forge entities AND DTOs**; `ReconciliationResult` in **3 files** | **high — entity/DTO name collisions** | **DEFER — F14/Forge schema-truth disambiguation required first** |

## Detail on the two DEFERs (why they are not clean contract moves)
- **IModuleCatalog → `Module` is an EF entity.** Promoting the interface as-is exports an entity
  across the seam (forbidden by the charter dependency rule §2). The correct fix is to **author a
  new `ModuleDto`** and change the implementation to project entity→DTO — that is new behavior, not
  a namespace move. It belongs in a feature increment, not Phase-1 contract formalization.
- **IValuationService → entity/DTO name collisions.** The return types are tangled: `CostApproachResult`
  and `IncomeApproachResult` exist **simultaneously** as `Entities/Forge/*` and as
  `DTOs/ForgeValuationDtos.cs`; `ReconciliationResult` is declared in 3 places. Which is canonical is
  a **schema-truth decision** (F14/Forge), not a contract-move decision. Moving anything here before
  that disambiguation risks cementing the wrong type. **Defer to the Forge/F14 lane.**

## Smallest safe promotion units (DTO-first, each its own CI-verified increment)
1. **B1a:** `SyncReadinessDto` → `Abstractions/DTOs/Workbench` (self-contained; mirror the CanonicalTf move).
2. **B1b:** `IWorkbenchSyncReadinessService` → `Abstractions/Interfaces/Workbench` — **completes the
   Workbench tab-contract cluster** (the 2 A runners already landed there).
3. **B2a:** extract `NegativeCacheStatistics` from `NegativeCachingService.cs` into its own file in
   `Abstractions/DTOs` (leave the service + options in Core). 
4. **B2b:** `ICacheStatisticsService` → `Abstractions/Interfaces`.
5. **B3:** `ITerraFusionSyncService` cluster — move `LegacySystemHealth` (+ repoint `ILegacyDatabaseService`'s
   reference, which stays in Core) + the ~10 co-located POCOs + the interface, as one dedicated
   increment. Mechanical but large; do last, alone.
6. **DEFER:** `IModuleCatalog` (needs `ModuleDto` authoring) and `IValuationService` (F14/Forge
   collision resolution). **`IStatisticalAnalysisService` never** (C, theater).

## Recommended next narrow release (if owner opens B-tier)
**B1 only first: `SyncReadinessDto` → `IWorkbenchSyncReadinessService`.** It is the single cleanest
B path (self-contained DTO, low consumer surface), and it finishes the Workbench tab-contract cluster
that the two A runners already populate. Then reassess before B2/B3.

## What this pass concluded
- 1 clean B path (Workbench, B1), 1 medium (cache, B2), 1 heavy-but-mechanical (Sync SoT, B3),
  **2 genuine DEFERs** (`IModuleCatalog` entity export; `IValuationService` entity/DTO collision —
  both belong with feature/F14 work, not contract formalization).
- This is the natural **edge of pure contract formalization**: beyond B1–B3, the remaining B work is
  entangled with entities/schema and should ride with the Forge/F14 execution, not this lock.

**No code moved. No release opened. Awaiting owner decision** to open B1 (Workbench) or hold.
