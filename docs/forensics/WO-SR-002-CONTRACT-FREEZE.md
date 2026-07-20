# WO-SR-002 — Shared-Contract Freeze (contract-first)

> Operator work under `OWNER-DECISION-TOPOLOGY-RATIFIED.md` §8/§10. In-session capable — needs **no**
> repo-creation credential. **Narrow boundary:** version only *genuinely suite-consumable* contracts;
> distinguish stable contracts from implementation details; **invent nothing**; do **not** move suite
> implementation; do **not** publish packages yet. Freezes the versioned boundary suites will consume
> *before* any suite implementation proceeds.

**Date:** 2026-06-25 · **Seam:** `backend/src/TerraFusion.Abstractions` (the Loops 24–39 promoted seam) · **Base:** `terrafusion_os_1.0`

## 1. Classification of the existing Abstractions seam
`SUITE` = genuinely suite-consumable stable contract (freeze + version) · `OS-INTERNAL` = OS
implementation detail (**not** a suite contract; do not freeze as one) · `CROSS-CUTTING` = OS-owned,
consumed by suites read-only · `DEFER` = not yet freezable (Core-side / DTO-first).

| Artifact (in `Abstractions`) | Class | Consuming suite(s) | Freeze version | Note |
|---|---|---|---|---|
| `DTOs/CanonicalTf/{OpenWorkResponse,ParcelOwnerCurrentResponse,ParcelWsdorRollResponse,TfSaleResponse}` | **SUITE** | forge, dais, dossier (read) | `v1.0.0` | canonical parcel/sale/roll — core read model |
| `DTOs/GisTf/{ParcelGeometryResponse,ParcelNeighborResponse}` | **SUITE** | atlas | `v1.0.0` | spatial read model |
| `Interfaces/IGisDataService` | **SUITE** | atlas | `v1.0.0` | GIS data contract |
| `DTOs/{CostForgeStatsDto,CostMatrixDto,UpdateCostMatrixDto,PropertyValuationInputDto,ValuationResultDto}` | **SUITE** | forge | `v1.0.0` | valuation I/O |
| `DTOs/Kernel/{KernelCostApproachRequest,KernelCostApproachResponse}` | **SUITE** | forge | `v1.0.0` | cost-approach kernel |
| `Interfaces/IForgeStatisticsService` | **SUITE** | forge | `v1.0.0` | forge stats contract |
| `DTOs/Workbench/SyncReadinessDto` | **SUITE** | dais (+ Workbench host) | `v1.0.0` | sync readiness read model |
| `Interfaces/Workbench/{IWorkbenchSyncReadinessService,IPacsReachabilityProbeService}` | **SUITE** | dais | `v1.0.0` | sync/PACS-probe contracts (impl stays OS/Sync) |
| `Interfaces/Workbench/IWorkbenchSyncReadinessRefreshRunner` | **OS-INTERNAL** | — | — | host refresh runner — orchestration detail, not a suite contract |
| `Interfaces/{IAuditLogger,ICitizenContextService}` | **CROSS-CUTTING** | all (read) | `v1.0.0` | OS-owned; suites consume, never implement |
| `DTOs/{ModelTrainingConfigDto,ModelTrainingStatusDto,TrainingConfigDto,TrainingDataDto}` | **DEFER** | gpt/forge-ML? | — | ownership unclear (AI vs Forge-ML) — classify at WO-GPT/FORGE-X-001, don't freeze speculatively |
| `DTOs/AIAgentStatusDto`, `Interfaces/IQuantumAIRoutingService` | **OS-INTERNAL** | — | — | AI-swarm surface (stubbed) — not a suite contract |
| `Interfaces/{ICacheStatisticsService,IPerformanceMonitor,IServiceDiscoveryService}` | **OS-INTERNAL** | — | — | infra/impl details — explicitly NOT suite contracts |
| `DTOs/NegativeCacheStatistics` | **OS-INTERNAL** | — | — | cache internal (promoted only to satisfy an interface sig) |
| `DTOs/{ComplianceDto,Responses/CommonResponses,Responses/PerformanceMetricsDto,Shared/SharedDtos}` | **CROSS-CUTTING** | all (read) | `v1.0.0` | shared response envelopes — OS-owned |
| `Interfaces/IContextEnrichmentService` | **DEFER** | — | — | consumer unclear — classify before freeze |
| `ITerraFusionSyncService` (Core, not yet promoted) | **DEFER** | dais/sync | — | PACS fence; DTO-first before freeze |
| `IModuleCatalog`, `IValuationService` (Core) | **DEFER** | forge/OS | — | entity-coupled; DTO-first before freeze |

**Frozen set = the `SUITE` + `CROSS-CUTTING` rows only.** OS-INTERNAL rows are explicitly excluded from
the suite-contract surface. No contract was invented to fill the matrix.

## 2. Versioning scheme
- **SemVer per contract-group**, starting `v1.0.0`. Group = a coherent DTO/interface cluster (e.g.
  `forge.valuation@1.0.0`, `atlas.gis@1.0.0`, `dais.sync-readiness@1.0.0`, `canonical.parcel@1.0.0`, `shared.envelopes@1.0.0`, `crosscut.audit@1.0.0`).
- Version lives as contract metadata (assembly/package version + a `CONTRACTS.md` version table); the
  **impl** version is independent.

## 3. Compatibility & deprecation rules
- **MINOR** = additive, backward-compatible (new optional field / new member). **MAJOR** = breaking
  (removed/renamed/retyped member, semantic change). **PATCH** = doc/annotation only.
- Suites pin a **MAJOR** line and must accept MINOR within it. A MAJOR bump requires a deprecation
  window: old + new coexist ≥1 release; `[Obsolete]` on the old; removal only after all consumers migrate.
- **No suite may redefine a shared contract** (owner decision §5/§8). Cross-lane needs go through a
  governed request + TerraTrace event (`write-lanes.json`).

## 4. Package / publication boundary (NOT published yet)
- **Now:** project-reference within `terrafusion_os_1.0` (single build). The freeze establishes the
  *versioned surface*, not a published artifact.
- **At multi-repo time (post repo-creation, gated):** publish `TerraFusion.Contracts.*` as versioned
  NuGet/npm from the sovereign base; suites consume the package, never the source. **Do not publish now** — not yet authorized.

## 5. Contract validation (add now)
- A `contract-compat` check (the required check named in the suite manifest) that asserts: (a) no suite
  redefines a frozen contract; (b) consumers reference the pinned MAJOR; (c) the `CONTRACTS.md` version
  table matches assembly versions. Runs in base CI now; becomes each suite's required check post-bootstrap (phase-2 tighten).
- Extends the existing `Abstractions/CONTRACTS.md` charter (no-inversion rule already there).

## 6. Explicit non-actions (acceptance boundary)
Did **not**: move suite implementation · publish packages · invent contracts to populate the matrix ·
freeze OS-internal/infra interfaces as suite contracts · resolve the DEFER rows speculatively.

## 7. Sequence position
```text
shared-contract freeze (THIS)  →  suite repos created (WO-SR-003, credential-gated)
→ bootstrap + settings verified (two-phase protection)  →  bounded extraction/promotion (WO-*-X)
→ suite-owned implementation  →  OS/Workbench integration
```

## 8. Status
**WO-SR-002 COMPLETE.** Classification + versioning + compat/deprecation + publication boundary +
validation — done (decision-layer) **and stamped/wired in-repo (Loop 53):**
- Machine source of truth: `backend/src/TerraFusion.Abstractions/contracts.freeze.json` (6 groups @ `v1.0.0`, 24 files).
- Human version table stamped into `Abstractions/CONTRACTS.md` §8 (owner reconciled to sovereign base).
- CI check **`contract-compat`** wired: `scripts/contracts/verify-contract-freeze.mjs` + `.github/workflows/contract-compat.yml` — verifies every frozen file exists, versions are SemVer, OS-internal details are not frozen, single ownership. **Local run: PASS** (24 files verified, 7 excluded, 5 deferred).
- No implementation moved; no package published; no contract invented.
