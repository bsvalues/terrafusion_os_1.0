# Migrate Phase-1 — Shared-Contracts Closure Record

> **Governance record.** Seals the **Phase-1 shared-contracts formalization** sub-phase of Migrate
> at a clean, fully-CI-green milestone, and formally hands the remaining items to their proper
> lanes. **No code moved by this record.** Recovery lock returns to: Phase-1 shared-contracts
> release **CLOSED**; B3 + DEFERs + repo-creation/extraction/schema all **ACTIVE-LOCKED**.

**Date:** 2026-06-25 · **Branch:** `claude/terrafusion-forensic-playbook-u3kvx6` · **PR:** #1080 (draft) · **HEAD at seal:** `cacbd9af2`

---

## 1. What was formalized (all CI-green, in-repo on `main`)
The canonical cross-repo contract surface now lives in `TerraFusion.Abstractions`, established
contracts-first per `MIGRATE-SPLIT-PLAN.md` and the charter (`Abstractions/CONTRACTS.md`):

| Release | Contents | Verdict |
|---|---|---|
| **R1 — DTO clusters** | `GisTf` (ParcelGeometry/Neighbor), `Kernel` (CostApproach req/resp + Provenance), `CanonicalTf` (OpenWork/Owner/Wsdor/Sale + nested) | ✅ CI-green |
| **R2 — A-tier interfaces** | `IGisDataService`, `IPacsReachabilityProbeService`, `IWorkbenchSyncReadinessRefreshRunner`, `IForgeStatisticsService` | ✅ CI-green |
| **R3 / B1** | `SyncReadinessDto` + `IWorkbenchSyncReadinessService` → **Workbench tab-contract cluster complete** | ✅ CI-green |
| **R4 / B2** | `NegativeCacheStatistics` + `ICacheStatisticsService` | ✅ CI-green |

Every increment: one cluster, build-green under `/warnaserror`, canonical .NET tests green,
zero regressions. Trap catalogue proven and recorded (shared-namespace swap-vs-add; vanishing-
namespace CS0246; Sync transitive-ref; CS1574 doc-cref; unqualified DI registration; extract-from-
multi-type-file comment-only-ref). HR-4 honored throughout (CI as validator; no unverified claims).

## 2. What is deferred, and to which lane
| Item | Why deferred | Handed to |
|---|---|---|
| **B3 — `ITerraFusionSyncService` cluster** | Its DTO-first dependency `LegacySystemHealth` is consumed by the **Harris PACS / legacy-DB adapters** (`HarrisPacsLegacyService`, `TylerTechLegacyService`, `CamaPlusLegacyService`, `GenericLegacyService`) — an **owner-sensitive fence** (CLAUDE.md: do not modify Harris PACS integration without county approval). Also the heaviest single increment. | **TerraFusion-Sync repo split** (the Sync system-of-truth contract belongs with the adapters, under county/owner review). |
| **`IModuleCatalog`** | Returns the `Module` **EF entity** → needs a new `ModuleDto` + impl projection (behavior, not a move). | **core feature / topology split** (author `ModuleDto` then). |
| **`IValuationService`** | Return types collide as **both Forge entities and DTOs** (`CostApproachResult`/`IncomeApproachResult` dual; `ReconciliationResult` ×3) → schema-truth decision. | **F14 / Forge lane** (resolve entity-vs-DTO first). |
| **`IStatisticalAnalysisService`** | Quantum/infinite-dimensional theater, consciousness-coupled — not a cross-repo contract. | **never promote** (C; stays in API). |

## 3. Closure decisions (ratified)
1. **Phase-1 shared-contracts release is CLOSED** at HEAD `cacbd9af2` — the self-contained DTOs,
   the Workbench tab-contract cluster, and the cache contract are all migrated and green.
2. **B3 is deferred to the Sync repo split** (PACS fence + heaviest increment). Not abandoned —
   the `B-TIER-PROMOTION-PLAN.md` B3 recipe (extract `LegacySystemHealth`, then move the interface
   + its ~10 co-located POCOs) is the ready work order when that lane opens with owner review.
3. **The two entity-coupled DEFERs ride the F14/Forge lane**; `IStatisticalAnalysisService` never.
4. **Lock re-tightens:** the Phase-1 shared-contracts narrow release is spent/closed. No further
   contract moves, no B3, no repo creation, no extraction, no schema work without a new explicit,
   individually-ratified release.

## 4. State of the seam (for the future repo split)
`TerraFusion.Abstractions` is now the **proven canonical contract home**: the Atlas geo, Forge
cost-approach + stats, sync→suite payloads (CanonicalTf), the full Workbench tab-contract cluster,
and the cache contract are all there, each validated. When the topology split executes, suites
consume these from Abstractions; the dependency rule (charter §2, no inversion) held across every
move. The remaining contracts (Sync SoT, levy/valuation) are explicitly mapped to land during their
own repo/schema lanes.

## 5. Proof of success (of Phase-1 shared-contracts)
- canonical home + charter established ✓
- 3 DTO clusters + 4 A-interfaces + 2 B clusters promoted, **each CI-green** ✓
- dependency rule never inverted; consumers rebound cleanly every time ✓
- deferred items each have a named lane + a ready recipe ✓
- no fenced material touched (PACS adapters untouched — B3 deferred *because* of the fence) ✓

## 6. FECF position
**Migrate ▶ — shared-contracts formalization COMPLETE (in-repo seam established).** Next Migrate
work = the actual **topology split** (per `MIGRATE-SPLIT-PLAN.md`: core+contracts → Sync → Atlas →
Dais → Forge → Dossier), each a future, individually-ratified release. Recovery lock holds.
