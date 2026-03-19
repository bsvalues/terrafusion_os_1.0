# CP-15 Route Readiness Map

Date: 2026-03-19
Phase: Phase 2 — Runtime Completeness / Shell Contract
Gate: G5 (Runtime Completeness)
Status: PARTIAL — review required per route

## Classification Key

- REAL: connects to real service with real data
- SAMPLE-TRANSPARENT: explicit fallback with provenance flag (DemoDataBanner / isSampleData)
- PLACEHOLDER: stub component, coming-soon, hardcoded data without transparency marker
- NOT-ASSESSED: not yet inspected

## Suite Route Survey

### TerraForge (Forge)

| Route | Component | Classification | Notes |
|---|---|---|---|
| `/forge` | TerraForge suite home | NOT-ASSESSED | Needs inspection |
| `/forge/valuation` | Valuation landing | NOT-ASSESSED | |
| `/forge/cost` | CostManual + CostForge | SAMPLE-TRANSPARENT | API-first via `getCostSchedule`; sample fallback disclosed |
| `/forge/batch` | BatchCostRun | SAMPLE-TRANSPARENT | Live preview/apply endpoints wired; fallback disclosed + TerraTrace emit |
| `/forge/sales` | Sales comparables | NOT-ASSESSED | |
| `/forge/income` | Income approach | NOT-ASSESSED | |

### TerraAtlas (Atlas)

| Route | Component | Classification | Notes |
|---|---|---|---|
| `/atlas` | Atlas suite home | NOT-ASSESSED | |
| `/atlas/map` | GIS map view | NOT-ASSESSED | |
| `/atlas/layers` | Layer management | NOT-ASSESSED | |

### TerraDais (Dais)

| Route | Component | Classification | Notes |
|---|---|---|---|
| `/dais` | Dais suite home | NOT-ASSESSED | |
| `/dais/appeals` | BOE appeals | NOT-ASSESSED | |
| `/dais/exemptions` | Exemptions | NOT-ASSESSED | |
| `/dais/permits` | Permits | NOT-ASSESSED | |
| `/dais/queue` | Task queue | NOT-ASSESSED | |

### TerraCanon (Canon)

| Route | Component | Classification | Notes |
|---|---|---|---|
| `/canon` | TerraCanon IDE | NOT-ASSESSED | Codex features post-25th |

### Property Workbench (Tier-0)

| Route | Component | Classification | Notes |
|---|---|---|---|
| `/property/:parcelId` | Property Workbench | NOT-ASSESSED | Forge/Atlas/Dais tabs must host real surfaces |
| `/property/:parcelId/forge` | Forge tab in workbench | NOT-ASSESSED | |
| `/property/:parcelId/atlas` | Atlas tab in workbench | NOT-ASSESSED | |
| `/property/:parcelId/dais` | Dais tab in workbench | NOT-ASSESSED | |
| `/property/:parcelId/dossier` | Dossier tab | NOT-ASSESSED | |
| `/property/:parcelId/pilot` | Pilot tab | NOT-ASSESSED | |

## Zero-Placeholder Gate Condition

G5 requires: every named route resolves to a real component with real data.
Current known gaps:
- Several routes remain NOT-ASSESSED (full route audit still pending)
- End-to-end live environment verification pending (staging/runtime)

All NOT-ASSESSED routes need per-route inspection before G5 can formally pass.

## Implementation Handoff

Full route inspection and placeholder elimination is a bounded Phase 2 delivery task.
Honesty Sweep fixes (CostManual, BatchCostRun) are complete; full route survey remains open.
