# WO-DAIS-X-001 — Dais Implementation Inventory (source-side, on sovereign base)

> Dais inventory. **Inventory + disposition only** — no code moved, no repo, no credential.
> Resolutions flagged for **WO-DAIS-X-002**.

**Date:** 2026-06-25 · **Source of truth:** `origin/main` @ `2ae013561` · **Contracts:** consumes `canonical.parcel`/`shared.envelopes`/`crosscut.audit`/`dais.sync-readiness` @ `v1.0.0`
**Dispositions:** `RETAIN_IN_OS · EXTRACT_EXACT · REWRITE_FOR_SUITE · SHARE_AS_CONTRACT · MINE_PATTERN · DEFER · REJECT`

## 0. Two load-bearing findings
1. **Dais is clean — NO theater** (name-overload check empty; contrast Forge's CostForge "Ultimate" and
   Atlas's SystemGptAtlas). The backend is real end-to-end (verified: `DaisController` 2,162 ln → 5
   persistence-backed services). **But it is the largest suite**: assessor workflow **+ a substantial
   Levy sub-domain** (own project + own DbContext + ~17 Levy controllers) **+ TerraNotice** (13 areas).
2. **F14 data-truth split is the Dais crux.** `LevyCertification` exists in **three** places:
   `Core/Entities/LevyCertification.cs`, `TerraFusion.Levy/Models/LevyCertification.cs`, and
   `Core/Entities/Pacs/PacsLevyCertification*` (Constitutional/Aggregate/HighestLawful limits). Per F14
   ratification (Option C): **Levy module = SoR → Dais; Core levy = read-only projection; Pacs* =
   PACS-ingested**. This governs the Dais/Levy cut (mirror of Forge shared-data / Atlas ingested-geometry).

## 1. Backend inventory
| Source path | Capability | Disposition | Dep | Tests |
|---|---|---|---|---|
| `Core/Entities/{Notice,QueueItem,CertificationStep,Appeal,Exemption,Workflow,WorkflowExecution}` + `CanonicalTf/DictExemptionType` | assessor-admin workflow domain | **REWRITE_FOR_SUITE** → DaisDbContext (EF-coupled, mirror pattern) | canonical.parcel | Dais endpoint-contract |
| `Core/Services/{NoticeService,QueueService,AppealService,CertificationService(I*),ExemptionService(I*),IQueueService}` | Dais services | **EXTRACT_EXACT** (type-cut from Core) | — | — |
| `API/Controllers/DaisController.cs` (2,162 ln) + assessor controllers (`Clerk,OpenWorkQueue,WorkflowAutomation,ImprovementFieldCheckQueue,Field,Adjustment,LandSegmentException,PropertyAssessment,ParcelWsdor,OwnerWsdorPipeline`) | Dais HTTP surface | **EXTRACT_EXACT** (controller-cut) | canonical.parcel, crosscut.audit | Dais tests |
| **`TerraFusion.Levy/**`** — Models (District/DistrictParcel/LevyRate/LevyScenario/RevenueProjection/BankedCapacity/LevyMeasure/LevyCertification/ReferenceSource), Services (Revenue/Audit/Ipd/PropertyAssessment/RiskScoring/DataQuality/Calculation/Certification), **own `LevyDbContext` (9 DbSets)** + migrations | **Levy SoR** (F14) | **EXTRACT_EXACT** (own context — clean, like CurrentUse) | levy.projection (GAP), canonical.parcel | LevyDbContext snapshot |
| Levy API controllers (~17: `Levy,LevyCalculator,LevyCalculation,LevyCertification,LevyDashboard,LevyDataManagement,LevyDataQuality,LevyExport,LevyForecast,LevyReport,LevyReference,LevyAudit,LevySearch,LevyPropertyAssessment,PublicLevyPortal,BankedCapacity,BudgetImpact`) | Levy HTTP surface | **EXTRACT_EXACT** (controller-cut) | levy.projection, canonical.parcel | LevyAudit tests |
| `API/Controllers/PiltController.cs` + `pages/pilt` | PILT (TerraPILT, Dais sub-domain per placement map) | **EXTRACT** (Dais) | canonical.parcel | — |
| `Core/Entities/LevyCertification.cs` | Core **projection** of levy cert | **SHARE_AS_CONTRACT / RETAIN_IN_OS** (read-projection, F14) | levy.projection | — |
| `Core/Entities/Pacs/{PacsAppeal,PacsExemption,PacsLevyCertification*}` | **PACS-ingested** projections | **RETAIN_IN_OS/Sync** | canonical.parcel | — |
| `TerraFusion.AI/Notices/DraftNoticeService.cs` | **AI notice drafting** (Muse/Pilot) | **RETAIN_IN_OS (Pilot)** — Dais consumes via contract | crosscut | — |

## 2. Frontend inventory
| Path | Disposition | Notes |
|---|---|---|
| `pages/dais` (8): WorkflowComponents, AuditTrailPage, AppealsWorkflow, DefensePacket, RollReadiness, FieldStudio, TerraQueue, ManagementDashboard | **EXTRACT to Dais** | thin route-shells (FieldStudio = 8-ln re-export) — **thicken post-gate** |
| `pages/notice` (16): TerraNoticeConsole + 13 `areas/*` (CommandCenter, PolicyPacks, ReleaseConsole, AuditVault, VendorDispatch, TemplateGovernance, BatchOperations, FreezeSnapshots, Telemetry, ReturnedMail, CitizenPortalPreview, CountyConfiguration) | **EXTRACT to Dais** | TerraNotice = notice/cert surface (dais owns "notice generation/queue"); substantial |
| `pages/pilt` (1, read-only per prior) | **EXTRACT to Dais** (PILT sub-domain) | write flows not wired |
| Workbench Dais tab host | **RETAIN_IN_OS** | Tier-0 |

## 3. Ownership line (mirror + F14 specialization)
```text
Dais owns:    assessor workflow (notice/queue/cert/appeal/exemption/workflow-state), Levy SoR
              (TerraFusion.Levy + own LevyDbContext), PILT — persisted in DaisDbContext + LevyDbContext.
OS/Sync owns: PACS-ingested projections (Pacs*), Core levy read-projection — Dais reads via contract.
Not Dais:     AI notice DRAFTING (DraftNoticeService → Pilot/OS; Dais owns the workflow, not the LLM draft).
```

## 4. Contracts + a contract GAP
- **Consumes:** `canonical.parcel@1.0.0` (parcel/owner), `shared.envelopes`, `crosscut.audit`, `dais.sync-readiness@1.0.0` (workbench sync-readiness surfaces).
- **GAP → new contract needed:** **`levy.projection`** (F14 levy read-projection + cert read DTO) is
  named in `CONTRACTS.md` §4 as "to be defined" — **not yet frozen**. Dais/Levy extraction needs it.
  → new WO-SR-002 increment (freeze `levy.projection@1.0.0`) before Levy cutover.
- **Feeders (out-of-session):** `TerraFlow`→workflow, `TerraPILT`→PILT, `BCBSLevy`→Levy rates.

## 5. Flagged for WO-DAIS-X-002 (not decided here)
1. **F14 SoR/projection cut** — per-field: Levy `LevyCertification` (SoR) vs Core `LevyCertification`
   (projection) vs `PacsLevyCertification*` (ingested). Resolve the three-way split precisely.
2. **DaisDbContext carve** — which of Notice/Queue/Cert/Appeal/Exemption/Workflow are Dais-authored vs shared (per-entity reader scan).
3. **`Workflow`/`WorkflowExecution` genericity** — Dais-owned or cross-cutting? (TerraFlow-derived; check non-Dais readers.)
4. **`levy.projection` contract freeze** — define + version before Levy cutover.
5. **DraftNoticeService boundary** — Dais consumes AI-draft via Pilot contract (confirm no Dais→AI hard dep).
6. **PILT** — confirm Dais sub-domain (vs own micro-suite).

## 6. Proven vs unverifiable
- **Proven (strongest backend suite):** Dais end-to-end (controller→5 services→persistence, county-scoped), Levy own project (9-DbSet context + services + migrations).
- **Weak:** frontend dais (8 thin shells); Levy/notice frontends partial.
- **Unverifiable in-session:** build/test greenness (no `dotnet`); feeder repos.

## 7. Status
**WO-DAIS-X-001 COMPLETE.** Dais is clean (no theater) but largest; the crux is the **F14 Levy
SoR/projection three-way split** + a **missing `levy.projection` contract**. Backend-strong,
frontend-thin. Next: **WO-DAIS-X-002** (F14 cut, DaisDbContext carve, freeze `levy.projection`). Extraction
gated on the Dais repo. No code moved.
