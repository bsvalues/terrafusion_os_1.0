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
- `CLOSED-NO-RUNTIME`: current runtime already satisfies the card intent; do not reopen the slice unless proof regresses
- `COVERED-BY-PARENT-CARDS`: no standalone card now because the surface is already covered by a bounded parent-card set

## Wave Summary

- `Wave 0`: `44A`, `44B`
- `Wave 1`: `45A`
- `Wave 2`: `45C`, `45B`, `46A`, `46B1`, `46B2`, `46B3`, `46C`, `47A`, `47B`, `48A`, `49A`, `49B`, `50A`, `50C`
- `Ready serial sidecar`: `50E`
- `Wave 3 Remaining Hold`: `45D`
- `Closed / No Runtime`: `50B`, `50D`

## OS, GPT, Canon, Governance, Admin

| surface | readiness | coverage | card / rationale | parallel lane |
| --- | --- | --- | --- | --- |
| Desktop shell / StageZero | Recovery | EXECUTION-CARD | `50E` Desktop shell proof seal — CP-55 sealed `StageZeroState.tsx` as the sole file and lifted the hold | Ready serial sidecar |
| Desktop icon launches | Recovery | HOLD-CARD | `45D` Shell launcher truth-dialect reconciliation | Wave 3 hold |
| GPT Studio / Marketplace / Builder / Analytics | Planned | NO-CARD-KEEP-QUEUED | queued GPT breadth stays planned; referenced by `45A` but not a live runtime target | none |
| Canon core IDE shell | Recovery | EXECUTION-CARD | `45B` Canon mixed-family gating | Wave 2 parallel |
| Canon collaboration / Codex-dependent slices | Planned | COVERED-BY-PARENT-CARDS | `45B` keeps them queued/planned while separating core IDE truth | Wave 2 parallel parent |
| Governance Dashboard | Recovery | EXECUTION-CARD | `50A` Governance Dashboard role seal | Wave 2 parallel |
| Monitoring | Planned | CLOSED-NO-RUNTIME | existing simulation framing already satisfies the card intent | none |
| Pilot Home / Pilot Console | Recovery | EXECUTION-CARD | `45C` Pilot/Trace standalone posture alignment — sealed 2026-03-29; allowed: `PilotHome.tsx`, `TraceHome.tsx` | Wave 2 parallel |
| Trace Home | Recovery | EXECUTION-CARD | `45C` Pilot/Trace standalone posture alignment — sealed 2026-03-29; allowed: `PilotHome.tsx`, `TraceHome.tsx` | Wave 2 parallel |
| Admin Dashboard | Recovery | EXECUTION-CARD | `50C` Admin Dashboard static-data cleanup | Wave 2 parallel |
| User Admin | Recovery | CLOSED-NO-RUNTIME | unconditional `DemoDataBanner` already discloses sample-fixture posture | none |

## Forge And Atlas

| surface | readiness | coverage | card / rationale | parallel lane |
| --- | --- | --- | --- | --- |
| Forge suite home | Recovery | COVERED-BY-PARENT-CARDS | `46A` and later Forge cards already touch the suite-home posture; no standalone suite-home card yet | parent cards |
| CostForge | Quarantine | EXECUTION-CARD | `46A` CostForge quarantine honesty seal | Wave 2 parallel |
| Statistics Studio | Recovery | EXECUTION-CARD | `46B1` Statistics Studio proof seal — sealed 2026-03-29; allowed: `StatisticsStudio.tsx` | Wave 2 parallel |
| Batch Cost Runs | Recovery | EXECUTION-CARD | `46B2` Batch/Preview proof seal — sealed 2026-03-29; allowed: `BatchCostRun.tsx`, `CoefficientPreview.tsx` | Wave 2 parallel |
| Regression Studio | Recovery | EXECUTION-CARD | `46C` Regression Studio proof seal — sealed 2026-03-29; allowed: `RegressionStudio.tsx` | Wave 2 parallel |
| TerraGAMA | Planned | NO-CARD-KEEP-QUEUED | placeholder host; do not promote into execution | none |
| Coefficient Preview | Recovery | EXECUTION-CARD | `46B2` Batch/Preview proof seal — sealed 2026-03-29; allowed: `BatchCostRun.tsx`, `CoefficientPreview.tsx` | Wave 2 parallel |
| Cost Manual | Recovery | EXECUTION-CARD | `46B3` Cost Manual / Value Audit proof seal — sealed 2026-03-29; allowed: `CostManual.tsx`, `ValueAuditModule.tsx` | Wave 2 parallel |
| Value Audit Log | Recovery | EXECUTION-CARD | `46B3` Cost Manual / Value Audit proof seal — sealed 2026-03-29; allowed: `CostManual.tsx`, `ValueAuditModule.tsx` | Wave 2 parallel |
| Atlas suite home | Recovery | EXECUTION-CARD | `47A` Atlas breadth queued-posture seal | Wave 2 parallel |
| Geo Equity | Recovery | EXECUTION-CARD | `47B` Atlas renderer truth sweep — sealed 2026-03-29; allowed: `GeoEquityDashboard.tsx` | Wave 2 parallel |
| Appraisal GIS | Recovery | EXECUTION-CARD | `47B` Atlas renderer truth sweep — sealed 2026-03-29; allowed: `MassAppraisalGIS.tsx` | Wave 2 parallel |
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
| Dossier tab | Recovery | EXECUTION-CARD | `49B` Workbench Dossier proof sweep — sealed 2026-03-29; allowed: `PropertyDossier.tsx` | Wave 2 parallel |
| Clerk tab | Recovery | NO-CARD-KEEP-IN-WORKBENCH | real parcel tab; reserved namespace must not be promoted to standalone runtime work | none |
| Treasury tab | Recovery | NO-CARD-KEEP-IN-WORKBENCH | real parcel tab; reserved namespace must not be promoted to standalone runtime work | none |
| Audit tab | Recovery | NO-CARD-KEEP-IN-WORKBENCH | real parcel tab; reserved namespace must not be promoted to standalone runtime work | none |
| Pilot tab | Recovery | NO-CARD-KEEP-IN-WORKBENCH | real parcel tab; keep OS ownership clear and parcel-scoped | none |
| PACS DataBridge | Planned | NO-CARD-KEEP-QUEUED | placeholder host only | none |
| TerraSync | Planned | NO-CARD-KEEP-QUEUED | placeholder host only | none |
| TerraFlow | Planned | NO-CARD-KEEP-QUEUED | active path is queued canon; historical renderer residue is not an execution target | none |

## Coverage Gaps Closed By This Atlas

This atlas explicitly closes the control-plane gap for:

1. desktop shell proof-gap coverage is now explicitly bounded under `50E` rather than left implicit
2. reserved Workbench tabs as `NO-CARD-KEEP-IN-WORKBENCH`
3. all placeholder or queued breadth surfaces as explicit `NO-CARD-KEEP-QUEUED`
4. suite-home proof gaps that are already covered by parent cards rather than requiring invented standalone work

## Multi-Agent Operating Rule

When Copilot executes from this atlas:

1. choose only `EXECUTION-CARD` rows from the current clear waves
2. allow sub-agents only inside the selected card's allowed files
3. `45D` remains `HOLD-CARD` until the shell hot-surface window is explicitly opened
4. `50E` may run only as a single-owner serial sidecar on `StageZeroState.tsx`
5. do not reopen `50B` or `50D`
6. do not turn a `NO-CARD` row into runtime work without first changing the control plane
