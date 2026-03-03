# CC-4: forgeService.ts Export Inventory

**File**: `frontend/apps/os-shell/src/services/forgeService.ts` (867 lines)
**Purpose**: Benton County Cost Approach Engine (CostForge + IncomeForge + AppealForge + Reconciliation + Audit)
**Lineage**: BCBSCOSTApp -> TerraBuild -> TerraFusionBuild -> CostForge -> TerraForge

## Summary

| Category | Count | Action |
|----------|-------|--------|
| Type exports | 26 | KEEP (contract types) |
| Data constants | 7 | KEEP (Harris PACS 9.0 matrix data) |
| Pure calculation functions | 5 | REWRITE via pilotApi.invoke() in R1 |
| Matrix lookup utilities | 3 | KEEP (pure, no side effects) |
| localStorage CRUD functions | 12 | REWRITE to backend persistence |
| Stats function | 1 | REWRITE to backend API |

## Type Exports (26) — KEEP

All types are contract interfaces consumed by UI components. Keep as-is.

| Export | Line | Notes |
|--------|------|-------|
| `CostMatrixEntry` | 18 | Harris PACS matrix row |
| `BuildingTypeInfo` | 30 | 14 building type codes |
| `QualityLevel` | 38 | Economy..Custom (6 levels) |
| `ConditionOption` | 44 | Poor..Excellent (5 levels) |
| `RegionInfo` | 50 | 9 Benton County regions |
| `CostCalculationInput` | 57 | 11-field input shape |
| `CostBreakdownItem` | 71 | category + amount |
| `CostCalculationResult` | 76 | Full result with breakdown, confidence, matrix source |
| `CostScenario` | 105 | Saved scenario wrapper |
| `IncomeExpenses` | 457 | 7 expense categories |
| `IncomeInput` | 467 | Income approach input |
| `IncomeResult` | 479 | Income approach result |
| `AppealStatus` | 570 | DRAFT..WITHDRAWN (7 states) |
| `AppealType` | 571 | VALUATION, CLASSIFICATION, EXEMPTION |
| `AppealDecision` | 572 | GRANTED, DENIED, PARTIAL, PENDING |
| `AppealEvidence` | 574 | Evidence attachment |
| `AppealRecord` | 582 | Full appeal record |
| `ApproachValue` | 636 | Indicated value + confidence |
| `ApproachSummaryItem` | 642 | Weight + contributed value |
| `ReconciliationMethod` | 648 | weighted_average, bracketed, primary_approach |
| `PropertyCategory` | 649 | residential..special_purpose |
| `ReconciliationInput` | 651 | Multi-approach reconciliation input |
| `ReconciliationOutput` | 664 | USPAP-aligned final value opinion |
| `AuditAction` | 801 | 8 audit event types |
| `ValuationAuditEntry` | 803 | Full audit trail entry |
| `ForgeStats` | 851 | Summary statistics |

## Data Constants (7) — KEEP

Real Benton County data from Harris PACS 9.0. Keep as reference data.

| Export | Line | Notes |
|--------|------|-------|
| `COST_MATRIX` | 118 | 42 entries (14 types x 3 regions), Matrix Year 2025 |
| `BUILDING_TYPES` | 185 | 14 Harris PACS building codes |
| `QUALITY_LEVELS` | 208 | 6 quality tiers with factors |
| `CONDITION_OPTIONS` | 217 | 5 condition ratings with factors |
| `REGIONS` | 225 | 9 Benton County regions with matrix mapping |
| `MARKET_CAP_RATES` | 556 | 7 property types, Benton County 2025 survey |
| `DEFAULT_RECONCILIATION_WEIGHTS` | 691 | 5 property categories, USPAP-aligned |

## Pure Calculation Functions (5) — REWRITE via pilotApi

These should become `pilotApi.invoke('run_valuation_model', ...)` calls in R1.
The backend handler executes the calculation; the frontend becomes a thin UI.

| Export | Line | Notes |
|--------|------|-------|
| `calculateCost()` | 323 | Core cost approach — 94 lines, uses matrix lookup + depreciation |
| `calculateIncome()` | 495 | Income approach — direct capitalization with warnings |
| `extractCapRate()` | 549 | Market extraction from comparables |
| `runReconciliation()` | 701 | USPAP-aligned weighted-average/bracketed/primary reconciliation |
| `getForgeStats()` | 859 | Returns hardcoded stats — should hit `/api/forge/stats` |

## Matrix Lookup Utilities (3) — KEEP

Pure functions, no side effects. Used by UI for display logic.

| Export | Line | Notes |
|--------|------|-------|
| `lookupMatrixEntry()` | 263 | Find matrix entry by type + region |
| `getMatrixRegion()` | 270 | Map region ID to Eastern/Central/Western |
| `getRegionalComparison()` | 275 | Get all 3 regional entries for a building type |

## localStorage CRUD (12) — REWRITE to backend persistence

All use `localStorage.setItem/getItem`. Must migrate to backend API for multi-device, audit trail, and FISMA compliance.

| Export | Line | localStorage Key | Notes |
|--------|------|-----------------|-------|
| `saveScenario()` | 425 | `costforge-scenarios` | Save cost scenario |
| `loadScenarios()` | 439 | `costforge-scenarios` | Load all scenarios |
| `deleteScenario()` | 448 | `costforge-scenarios` | Delete by ID |
| `saveAppeal()` | 600 | `appealforge-appeals` | Create appeal record |
| `loadAppeals()` | 612 | `appealforge-appeals` | Load all appeals |
| `updateAppeal()` | 621 | `appealforge-appeals` | Partial update |
| `deleteAppeal()` | 626 | `appealforge-appeals` | Delete by ID |
| `appendAuditEntry()` | 818 | `forgeaudit-entries` | Append audit event |
| `loadAuditEntries()` | 830 | `forgeaudit-entries` | Load all audit entries |
| `loadAuditEntriesForParcel()` | 839 | `forgeaudit-entries` | Filter by parcelId |
| `clearAuditEntries()` | 843 | `forgeaudit-entries` | Clear all (dangerous) |
| `getForgeStats()` | 859 | (none — hardcoded) | Returns static data |

## localStorage Keys (4)

| Key | Used By | R1 Replacement |
|-----|---------|---------------|
| `costforge-scenarios` | saveScenario, loadScenarios, deleteScenario | `POST/GET/DELETE /api/forge/scenarios` |
| `appealforge-appeals` | saveAppeal, loadAppeals, updateAppeal, deleteAppeal | `POST/GET/PUT/DELETE /api/dais/appeals` |
| `forgeaudit-entries` | appendAuditEntry, loadAuditEntries, loadAuditEntriesForParcel, clearAuditEntries | TraceService (automatic via pilotApi.invoke) |

## R1 Rewrite Priority

1. **calculateCost()** -> `pilotApi.invoke('run_valuation_model', { approach: 'cost', ... })`
2. **calculateIncome()** -> `pilotApi.invoke('run_valuation_model', { approach: 'income', ... })`
3. **runReconciliation()** -> `pilotApi.invoke('run_reconciliation', { ... })`
4. **localStorage CRUD** -> Backend REST endpoints (scenarios, appeals, audit trail)
5. **getForgeStats()** -> `GET /api/forge/stats` (real data from database)
