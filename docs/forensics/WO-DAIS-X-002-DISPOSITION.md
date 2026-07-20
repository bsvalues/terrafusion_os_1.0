# WO-DAIS-X-002 — Dais Exact Disposition, Dependency & Provenance

> Resolves the decisions flagged by `WO-DAIS-X-001-INVENTORY.md` with source evidence. **Decision-layer;
> no code moved, no repo, no credential.** (The `levy.projection` *manifest freeze* is specified here but
> NOT edited in `contracts.freeze.json` — that file is in flight on PR #1325; the edit lands after merge.)

**Date:** 2026-06-25 · **Source of truth:** `origin/main` @ `2ae013561` · **Contracts:** consumes `canonical.parcel`/`shared.envelopes`/`crosscut.audit`/`dais.sync-readiness`; needs `levy.projection` (spec-declared)

## 1. Flagged decisions — RESOLVED (evidence)
1. **F14 three-way `LevyCertification` cut — confirmed.** Core `LevyCertification` is read by **many Levy
   controllers** (LevyReport/Search/Dashboard/Certification), `LevyRiskScoringService`, `LevyDbContext`,
   `TerraFusionDbContext`, **and `CostForgeController`** (Forge reads it). ⇒ Core `LevyCertification` =
   **RETAIN_IN_OS read-projection** (via `levy.projection`); `Levy/Models/LevyCertification` = **SoR → Dais**;
   `Pacs/PacsLevyCertification*` = **PACS-ingested → RETAIN/Sync**. Forge consumes the projection via contract.
2. **`Workflow`/`WorkflowExecution` are GENERIC — NOT Dais-exclusive.** Readers: `QuantumAnalyticsService`,
   `Consciousness/IWorkflowRepository` (theater), `WorkflowAutomationService`, `Data/Repositories/
   WorkflowExecutionRepository`. ⇒ the **generic workflow engine stays OS** (shared infra; theater readers
   REJECT); **Dais owns its DOMAIN workflow state** (Notice/Cert/Appeal/Exemption/Queue progression), not the generic `Workflow` entity.
3. **DaisDbContext carve** = Dais domain entities (`Notice/QueueItem/CertificationStep/Appeal/Exemption`
   + `DictExemptionType`), **excluding** the generic `Workflow`/`WorkflowExecution` (stay OS) and `Pacs*`/Core-projection (RETAIN).
4. **`levy.projection` contract** is load-bearing (Forge + Levy surfaces + audit/notice all read it). Materialize
   the DTOs at extraction; freeze `levy.projection@1.0.0` (spec already recorded, WO-SR-002 §8b).
5. **DraftNoticeService → Pilot/OS** (AI notice-drafting); Dais owns the notice workflow, consumes the draft via Pilot contract.
6. **PILT → Dais sub-domain** confirmed (PiltController + pages/pilt).

## 2. Ownership line
```text
Dais owns:    assessor workflow domain (Notice/Queue/Cert/Appeal/Exemption state) + Levy SoR
              (TerraFusion.Levy + LevyDbContext) + PILT — persisted in DaisDbContext + LevyDbContext.
OS owns:      generic Workflow/WorkflowExecution engine (shared); AI notice-drafting (Pilot).
OS/Sync owns: Pacs* projections + Core LevyCertification read-projection — Dais reads via levy.projection.
```

## 3. Exact disposition matrix
| Source path | Action | Dep | Provenance | Cutover gate |
|---|---|---|---|---|
| `Core/Entities/{Notice,QueueItem,CertificationStep,Appeal,Exemption,DictExemptionType}` | **REWRITE_FOR_SUITE** → DaisDbContext | canonical.parcel | `2ae013561` | DaisDbContext migration applies |
| `Core/Services/{Notice,Queue,Appeal,Certification,Exemption}Service` | **EXTRACT_EXACT** (type-cut) | — | `2ae013561` | compiles |
| `API/Controllers/DaisController` + assessor controllers | **EXTRACT_EXACT** (controller-cut) | canonical.parcel, crosscut.audit | `2ae013561` | OS module-slot via contract |
| `TerraFusion.Levy/**` (+ own LevyDbContext, 9 DbSets, migrations) | **EXTRACT_EXACT** (SoR) | levy.projection, canonical.parcel | `2ae013561` | LevyDbContext migration; Levy tests green |
| ~17 Levy controllers + PiltController + `pages/pilt` | **EXTRACT_EXACT** | levy.projection | `2ae013561` | via contract |
| `Core/Entities/LevyCertification` (Core projection) | **RETAIN_IN_OS** (read-projection) | levy.projection | `2ae013561` | derived read-only; event-refreshed |
| `Core/Entities/{Workflow,WorkflowExecution}` (generic) | **RETAIN_IN_OS** (shared engine) | — | `2ae013561` | Dais uses domain state, not generic entity |
| `Core/Entities/Pacs/{PacsAppeal,PacsExemption,PacsLevyCertification*}` | **RETAIN_IN_OS/Sync** | canonical.parcel | `2ae013561` | — |
| `TerraFusion.AI/Notices/DraftNoticeService` | **RETAIN_IN_OS (Pilot)** | crosscut | — | Dais consumes draft via Pilot contract |
| `pages/dais` (8), `pages/notice` (16 TerraNotice) | **EXTRACT_EXACT** | Workbench tab contract | `2ae013561` | renders via contract; thicken thin shells |

## 4. Dependency inventory + contract action
Consumes `canonical.parcel`, `dais.sync-readiness`, `crosscut.audit`, `shared.envelopes`, **`levy.projection`** (must materialize + freeze — WO-SR-002 §8b; edit `contracts.freeze.json` **after PR #1325 merges**). New **DaisDbContext** + retained **LevyDbContext**. Reads Core levy projection + Pacs* via contract. Feeders (out-of-session): TerraFlow, TerraPILT, BCBSLevy.

## 5. Status
**WO-DAIS-X-002 COMPLETE** — F14 three-way split confirmed (Forge reads Core projection too); generic Workflow
stays OS; DaisDbContext + LevyDbContext defined; `levy.projection` materialization is the gating contract work.
Extraction gated on the Dais repo. No code moved.
