# Exhaustive Remaining Card Atlas

**Date**: 2026-03-28  
**Purpose**: map every non-ready March 28 ledger surface to one of three outcomes: execution card, hold card, or explicit no-card rationale  
**Status**: exhaustive control-plane coverage map for the remaining Copilot queue  
**Lane**:
- Codex: docs/control-plane only
- Copilot: execution only from named cards
- sub-agents: allowed only inside a selected execution card and only within that card's allowed files

## Authority Stack

This atlas is downstream of:

1. [2026-03-28-surface-readiness-ledger.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-surface-readiness-ledger.md)
2. [2026-03-28-master-remaining-copilot-card-plan.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-master-remaining-copilot-card-plan.md)
3. [2026-03-28-remaining-copilot-execution-cards.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-remaining-copilot-execution-cards.md)
4. [2026-03-28-full-ecosystem-demo-surface-matrix.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-full-ecosystem-demo-surface-matrix.md)
5. [2026-03-28-full-ecosystem-demo-launch-registry.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-full-ecosystem-demo-launch-registry.md)

## Coverage Legend

- `EXECUTION-CARD`: bounded runtime card exists now
- `HOLD-CARD`: card exists in control plane, but it is not issuable yet
- `NO-CARD-KEEP-QUEUED`: intentionally queued, placeholder, or reserved; do not open runtime work
- `NO-CARD-KEEP-IN-WORKBENCH`: real Workbench surface that should stay parcel-scoped; do not promote to standalone work
- `COVERED-BY-PARENT-CARDS`: no standalone card now because the surface is already covered by a bounded parent-card set

## Wave Summary

- `Wave 0`: `44A`, `44B` — COMPLETE
- `Wave 1`: `45A` — COMPLETE
- `Wave 2`: `45B`, `46A`, `47A`, `48A`, `49A` — COMPLETE
- `Wave 3 Pool B`: `45C`, `46B`, `46C`, `47B`, `49B`, `50A`, `50C`, `50D`, `50E` — SEALED 2026-03-29, execution-ready
- `Wave 3 Remaining Hold`: `45D` — ARCHITECTURAL-RISK-HOLD; `50B` — NO-OP closed

## OS, GPT, Canon, Governance, Admin

| surface | readiness | coverage | card / rationale | parallel lane |
| --- | --- | --- | --- | --- |
| Desktop shell / StageZero | Recovery | EXECUTION-CARD | `50E` Desktop shell proof seal — sealed 2026-03-29; allowed: `StageZeroState.tsx` | Wave 3 Pool B |
| Desktop icon launches | Recovery | ARCHITECTURAL-RISK-HOLD | `45D` Shell launcher truth-dialect reconciliation — held; shared launcher surfaces are OS-owned high-blast-radius infrastructure; requires explicit architectural-risk authorization | Wave 3 HOLD |
| GPT Studio / Marketplace / Builder / Analytics | Planned | NO-CARD-KEEP-QUEUED | queued GPT breadth stays planned; referenced by `45A` but not a live runtime target | none |
| Canon core IDE shell | Recovery | EXECUTION-CARD | `45B` Canon mixed-family gating | Wave 2 parallel |
| Canon collaboration / Codex-dependent slices | Planned | COVERED-BY-PARENT-CARDS | `45B` keeps them queued/planned while separating core IDE truth | Wave 2 parallel parent |
| Governance Dashboard | Recovery | EXECUTION-CARD | `50A` Governance Dashboard role seal — sealed 2026-03-29; allowed: `GovernanceDashboard.tsx` | Wave 3 Pool B |
| Monitoring | Planned | NO-OP-CLOSED | `50B` Monitoring simulation framing — closed; existing page-level framing on `Monitoring.tsx` already satisfies intent; do not widen scope | Wave 3 no-op |
| Pilot Home / Pilot Console | Recovery | EXECUTION-CARD | `45C` Pilot/Trace standalone posture alignment — sealed 2026-03-29; allowed: `PilotHome.tsx`, `PilotConsoleContent.tsx`, `TraceHome.tsx` | Wave 3 Pool B |
| Trace Home | Recovery | EXECUTION-CARD | `45C` Pilot/Trace standalone posture alignment — sealed 2026-03-29; allowed: `PilotHome.tsx`, `PilotConsoleContent.tsx`, `TraceHome.tsx` | Wave 3 Pool B |
| Admin Dashboard | Recovery | EXECUTION-CARD | `50C` Admin Dashboard static-data cleanup — sealed 2026-03-29; allowed: `AdminDashboard.tsx` | Wave 3 Pool B |
| User Admin | Quarantine | EXECUTION-CARD | `50D` User Admin honesty correction — sealed 2026-03-29; allowed: `UserAdmin.tsx` | Wave 3 Pool B |

## Forge And Atlas

| surface | readiness | coverage | card / rationale | parallel lane |
| --- | --- | --- | --- | --- |
| Forge suite home | Recovery | COVERED-BY-PARENT-CARDS | `46A` and later Forge cards already touch the suite-home posture; no standalone suite-home card yet | parent cards |
| CostForge | Quarantine | EXECUTION-CARD | `46A` CostForge quarantine honesty seal | Wave 2 parallel |
| Statistics Studio | Recovery | EXECUTION-CARD | `46B` Forge fixture-risk renderer sweep — sealed 2026-03-29; allowed: `StatisticsStudio.tsx` | Wave 3 Pool B |
| Batch Cost Runs | Recovery | EXECUTION-CARD | `46B` Forge fixture-risk renderer sweep — sealed 2026-03-29; allowed: `BatchCostRun.tsx` | Wave 3 Pool B |
| Regression Studio | Recovery | EXECUTION-CARD | `46C` Regression Studio proof seal — sealed 2026-03-29; host-only: `RegressionStudio.tsx` | Wave 3 Pool B |
| TerraGAMA | Planned | NO-CARD-KEEP-QUEUED | placeholder host; do not promote into execution | none |
| Coefficient Preview | Recovery | EXECUTION-CARD | `46B` Forge fixture-risk renderer sweep — sealed 2026-03-29; allowed: `CoefficientPreview.tsx` | Wave 3 Pool B |
| Cost Manual | Recovery | EXECUTION-CARD | `46B` Forge fixture-risk renderer sweep — sealed 2026-03-29; allowed: `CostManual.tsx` | Wave 3 Pool B |
| Value Audit Log | Recovery | EXECUTION-CARD | `46B` Forge fixture-risk renderer sweep — sealed 2026-03-29; allowed: `ValueAuditModule.tsx` | Wave 3 Pool B |
| Atlas suite home | Recovery | EXECUTION-CARD | `47A` Atlas breadth queued-posture seal | Wave 2 parallel |
| Geo Equity | Recovery | EXECUTION-CARD | `47B` Atlas renderer truth sweep — sealed 2026-03-29; allowed: `GeoEquityDashboard.tsx` | Wave 3 Pool B |
| Appraisal GIS | Recovery | EXECUTION-CARD | `47B` Atlas renderer truth sweep — sealed 2026-03-29; allowed: `MassAppraisalGIS.tsx` | Wave 3 Pool B |
| TerraGIS Pro | Planned | NO-CARD-KEEP-QUEUED | placeholder host; stay queued | none |

## Dais

| surface | readiness | coverage | card / rationale | parallel lane |
| --- | --- | --- | --- | --- |
| Dais suite home | Recovery | COVERED-BY-PARENT-CARDS | `44A`, `44B`, and `48A` already own the bounded cleanup touching suite posture | parent cards |
| Management Dashboard | Recovery | EXECUTION-CARD | `48A` Management Dashboard conditional-live cleanup | Wave 2 parallel |
| TerraLevy | Quarantine | EXECUTION-CARD | `44A` TerraLevy honesty correction | Wave 0 |
| TerraQueue | Quarantine | EXECUTION-CARD | `44B` TerraQueue posture correction | Wave 0 |
| TerraCert | Planned | NO-CARD-KEEP-QUEUED | queued canon surface; do not reopen old crash work | none |
| TerraNotice | Planned | NO-CARD-KEEP-QUEUED | queued canon surface; do not reopen old crash work | none |
| TerraPILT | Planned | NO-CARD-KEEP-QUEUED | placeholder host; stay queued | none |
| TerraPermit | Planned | NO-CARD-KEEP-QUEUED | placeholder host; stay queued | none |
| VEI | Planned | NO-CARD-KEEP-QUEUED | placeholder host; stay queued | none |
| PropertyTax AI | Planned | NO-CARD-KEEP-QUEUED | placeholder host; stay queued | none |

## Dossier And Workbench

| surface | readiness | coverage | card / rationale | parallel lane |
| --- | --- | --- | --- | --- |
| Dossier suite home | Recovery | EXECUTION-CARD | `49A` Dossier suite-home proof seal | Wave 2 parallel |
| Dossier tab | Recovery | EXECUTION-CARD | `49B` Workbench Dossier proof sweep — sealed 2026-03-29; allowed: `PropertyDossier.tsx` | Wave 3 Pool B |
| Clerk tab | Recovery | NO-CARD-KEEP-IN-WORKBENCH | real parcel tab; reserved namespace must not be promoted to standalone runtime work | none |
| Treasury tab | Recovery | NO-CARD-KEEP-IN-WORKBENCH | real parcel tab; reserved namespace must not be promoted to standalone runtime work | none |
| Audit tab | Recovery | NO-CARD-KEEP-IN-WORKBENCH | real parcel tab; reserved namespace must not be promoted to standalone runtime work | none |
| Pilot tab | Recovery | NO-CARD-KEEP-IN-WORKBENCH | real parcel tab; keep OS ownership clear and parcel-scoped | none |
| PACS DataBridge | Planned | NO-CARD-KEEP-QUEUED | placeholder host only | none |
| TerraSync | Planned | NO-CARD-KEEP-QUEUED | placeholder host only | none |
| TerraFlow | Planned | NO-CARD-KEEP-QUEUED | active path is queued canon; historical renderer residue is not an execution target | none |

## Coverage Gaps Closed By This Atlas

This atlas explicitly closes the control-plane gap for:

1. desktop shell proof-gap coverage via `50E`
2. reserved Workbench tabs as `NO-CARD-KEEP-IN-WORKBENCH`
3. all placeholder or queued breadth surfaces as explicit `NO-CARD-KEEP-QUEUED`
4. suite-home proof gaps that are already covered by parent cards rather than requiring invented standalone work

## Multi-Agent Operating Rule

When Copilot executes from this atlas:

1. choose only `EXECUTION-CARD` rows from the current clear waves
2. allow sub-agents only inside the selected card's allowed files
3. `45D` remains `ARCHITECTURAL-RISK-HOLD` — do not issue without explicit architectural-risk authorization
4. `50B` is `NO-OP-CLOSED` — do not execute; existing framing is sufficient
5. do not turn a `NO-CARD` row into runtime work without first changing the control plane
