# PhD Appraiser Command Center — Design Spec
**Date:** 2026-04-13  
**Status:** Approved for implementation  
**Branch:** feat/native-app-integrations  
**Author:** Benton County Chief Appraiser + TerraFusion AI

---

## Overview

The **Reval Area Command Center** is a PhD-level calibration audit suite that gives the Benton County chief appraiser AI-powered superpowers for the annual working matrix calibration. It is built as a direct extension of the existing Calibration Workbench.

### The PhD Audit Loop
```
Reval Area Navigator
        ↓
AI Co-pilot Band (always live: PRD / PRB / COD)
        ↓
Evidence & Outliers Panel
  → Flag / exclude outliers (dual-effect)
        ↓
Adjustment Simulator
  → Type proposed rate → see projected stats
  → Cross-area impact check
        ↓
Stratified Equity Panel
  → Value quintile × age band heatmap
  → Regressivity curve
  → Before/after toggle
        ↓
Apply Adjustment → Audit trail committed
        ↓
DOR / IAAO export package
```

The appraiser can enter this loop at any point. During active reval physical inspection they start with the specific reval area under review; during final county-wide review they start from the equity heatmap.

---

## Architecture: What Is Being Built

Three new panels added to the existing `CalibrationWorkbench` page, plus a persistent co-pilot band above all panels.

### Component Map

```
CalibrationWorkbench (existing page)
├── AiCopilotBand (NEW — always visible above tabs)
├── tabs:
│   ├── Evidence & Outliers (existing findings → NEW ParcelEvidenceViewer)
│   ├── Adjustment Simulator (NEW)
│   └── Stratified Equity (NEW)
└── RevalAreaNavigator (NEW — left sidebar within workbench)
```

All three new panels share a single `useCalibrationContext` hook that holds:
- `selectedRevalArea: string | null`
- `selectedBuildingType: string | null`
- `proposedAdjustments: Record<string, number>` (buildingType → % delta)
- `excludedSaleIds: string[]`

When any of these change, the co-pilot band recomputes projections.

---

## Section 1: Reval Area Navigator

**Location:** Left sidebar within CalibrationWorkbench, replacing or augmenting the existing area filter.

### Behavior
- Tree view: Reval Areas → Building Types
- Each node has a health indicator: 🔴 (PRD/PRB/COD out of IAAO range) / 🟡 (marginal) / 🟢 (compliant)
- Clicking a node sets `selectedRevalArea` + `selectedBuildingType` in context
- All three panels and the co-pilot band scope to the selected context
- "County-Wide" link at bottom switches to county aggregate view (no reval area filter)

### Health Indicator Logic
```
RED:    PRD > 1.03 OR PRD < 0.98 OR COD > 15% OR |PRB| > 0.05
YELLOW: PRD in [1.02, 1.03] OR COD in [12%, 15%]
GREEN:  All three metrics within IAAO residential standards
```

### API
`GET /api/calibrationdiagnostic/reval-area-summary?matrixVersionId={id}`  
Returns: `[{ revalArea, buildingType, prd, prb, cod, saleCount, healthStatus }]`

---

## Section 2: AI Co-pilot Band

**Location:** Fixed header above the tab bar within CalibrationWorkbench. Always visible.

### Two Modes

**Monitor Mode** (no proposed adjustment active):
- Shows current PRD / PRB / COD for selected context with IAAO threshold bars
- Color: red = out of range, yellow = marginal, green = compliant
- AI narrative: 1–2 sentence plain English summary of what the data shows and why
- Push alerts: time trend detected, outlier count, root cause classification (Rate Problem / Data Problem / External Factor), sample size warning

**Simulation Mode** (appraiser has typed a proposed adjustment):
- Shows current → projected values side by side with delta badges
- Animated "LIVE SIMULATION" pill
- Cross-area impact alert fires automatically if projected change pushes any other area out of compliance
- AI narrative updates to: "Simulation result: [adjustment] achieves IAAO compliance. Recommend proceeding."

### Projection Computation
Projections run client-side on the raw sale data (fetched once per context switch) using the same PRD/PRB/COD formulas as the backend. The backend `POST /api/calibrationdiagnostic/simulate` endpoint validates the final projection before the appraiser can apply.

### IAAO Thresholds (residential single-family)
| Metric | Standard | Source |
|--------|----------|--------|
| PRD | 0.98–1.03 | IAAO Standard on Ratio Studies §6 |
| PRB | ±0.05 | IAAO Standard on Ratio Studies §6 |
| COD | ≤15% | IAAO Standard on Ratio Studies §6 |
| Median Ratio | 0.95–1.05 | IAAO Standard on Ratio Studies §4 |

---

## Section 3: Parcel Evidence Viewer (Evidence & Outliers Tab)

Replaces the current text-only `evidenceSummary` field in `AIFindingQueue` with a full evidence panel.

### Layout
Left: Ratio scatter plot + time trend overlay  
Right: Outlier panel with IQR-flagged parcels

### Scatter Plot
- X axis: Sale Price
- Y axis: Sale Price / Assessed Value ratio (assessment-to-sale ratio)
- Color encodes sale date (Q1=blue → Q4=red/orange) so time trend is visually immediate
- Horizontal dashed line at 1.00 (target)
- Outlier parcels circled in red with numbered labels
- Trend line overlaid: shows market appreciation drift over study year

### Outlier Detection
IQR method:
```
Q1 = 25th percentile of ratios
Q3 = 75th percentile of ratios
IQR = Q3 - Q1
Outlier if ratio < Q1 - 1.5×IQR  OR  ratio > Q3 + 1.5×IQR
```
AI classifies each outlier by type using evidence from PACS data:
- Estate sale / below-market indicator
- Unreported renovation (large gap between assessed vs market)
- Related-party / non-arm's-length (flagged in PACS)
- New construction adjustment lag

### Outlier Disposition — Dual-Effect Action
Each outlier card has three buttons:

| Action | Calibration Effect | Data Effect |
|--------|-------------------|-------------|
| **Exclude from Study** | Removed from ratio calculations; co-pilot band updates immediately; logged to matrix version audit trail with required reason | None |
| **Flag as Data Problem** | Excluded from study (same as above) | Creates `CalibrationFinding` with `classification=DATA_PROBLEM` + triggers Property Workbench flag for the parcel |
| **Accept as Valid** | Kept in study; override logged with required appraiser note | None |

Exclusions persist in the matrix version's `OutlierExclusions` table. They are included in the DOR export.

### Summary Statistics Row
Below the scatter: Median Ratio · COD · Sale Count · Outlier Count (IQR)  
These update live as outliers are excluded.

### API
`GET /api/calibrationdiagnostic/parcel-evidence?matrixVersionId={id}&revalArea={area}&buildingType={type}`  
Returns: `[{ parcelId, address, saleDate, salePrice, assessedValue, ratio, isOutlierIqr, aiClassification, pacsFlags }]`

---

## Section 4: Adjustment Simulator

### Input Modes
Three tabs within the simulator:
1. **% Adjustment** — type a percentage (e.g. −6.5%). Applied multiplicatively to current rate.
2. **Flat Rate** — type the target dollar/sqft rate directly.
3. **Target PRD** (reverse solver) — type the PRD you want to achieve; AI back-calculates the required adjustment %.

### Rate Input Grid
Rows = Building types present in the selected reval area  
Columns: Current Rate · Adjustment % input · Projected Rate · PRD impact bar

All inputs are independent — appraiser can adjust S1 and S2 differently in the same simulation.

### Live Projection (300ms debounce)
As the appraiser types, the client recalculates:
- Projected PRD / PRB / COD for the selected context
- Projected median ratio
- Estimated AV impact (parcel count × avg assessment × adjustment %)
- Cross-area impact for all other reval areas (shows as bar chart)

Projection uses excluded sales list from the Evidence Viewer (they share context).

### Cross-Area Impact Table
Shows every reval area's projected PRD after the proposed adjustment is applied. If any area crosses an IAAO threshold, a warning fires in the co-pilot band.

### Reverse Solver
`POST /api/calibrationdiagnostic/solve-for-rate`  
Input: `{ matrixVersionId, revalArea, buildingType, targetPrd, excludedSaleIds }`  
Returns: `{ suggestedAdjustmentPct, projectedPrd, projectedCod, projectedPrb }`

### Commit Flow
1. Appraiser reviews projected stats (all must be within IAAO range, or override with note)
2. "Apply Adjustment" button shows audit trail preview (what changes, outlier exclusions, IAAO citation, AV impact, appraiser name + date)
3. On confirm: `POST /api/matrixversion/{id}/apply-adjustment`
4. Matrix version bumps patch version, saves new rateSnapshot, records audit entry
5. Co-pilot band exits simulation mode, shows new current stats

### API
`POST /api/calibrationdiagnostic/simulate`  
Input: `{ matrixVersionId, revalArea, buildingType, adjustmentPct, excludedSaleIds }`  
Returns: `{ projectedPrd, projectedPrb, projectedCod, projectedMedianRatio, estimatedAvImpact, crossAreaImpact: [{ revalArea, projectedPrd }] }`

`POST /api/matrixversion/{id}/apply-adjustment`  
Input: `{ revalArea, buildingType, adjustmentPct, excludedSaleIds, appraiserNote, iaaoReference }`  
Returns: updated matrix version

---

## Section 5: Stratified Equity Panel

### Primary View: Value Quintile × Age Band Heatmap
5 columns (value quintiles) × 5 rows (age bands) = 25 cells  
Each cell: median ratio for that stratum, sale count  
Color scale:
- Deep red: ratio > 1.15 (severely over-assessed)
- Orange: 1.10–1.15
- Yellow: 1.05–1.10
- Green: 0.97–1.03 (IAAO target range)
- Blue: < 0.97 (under-assessed)

**Value quintile boundaries** computed from the filtered sale set (not fixed dollar amounts).  
**Age bands:** Pre-1960 · 1960–1980 · 1980–2000 · 2000–2015 · Post-2015

### Before/After Toggle
When simulation is active: toggle between current and projected heatmap.  
Projected heatmap recolors each cell based on the adjustment applied to its stratum.

### Click-to-Drill
Clicking any cell opens the Evidence Viewer filtered to that stratum (value quintile + age band intersection). This is the core PhD workflow — see the pattern, click the problem cell, review the sales.

### Alternative Views (tabs within panel)
- **By Reval Area** — rows = reval areas, columns = value quintiles
- **By Building Type** — rows = building types, columns = value quintiles
- **Time Trend** — quarterly median ratio chart showing market drift over study year

### Regressivity Curve
Right sub-panel shows PRD per quintile as a line chart (before vs. after).  
Flat line = equity. Downward slope = regressive (low-value over-assessed). Upward = progressive.

### PRD/PRB/COD Summary Bar
Fixed at bottom of heatmap. Shows county-wide stats for selected context, with projected values alongside when simulation is active.

### AI Insight Cards
Three cards below the heatmap:
1. Pattern classification: "Regressivity confirmed — Q1/Pre-1960 is worst stratum"
2. Interaction alert: age × value interaction, targeting recommendation
3. Clean strata: "Post-2015 new construction is equitable — do not adjust"

### Export
- **DOR Ratio Study Package** — stratified equity tables, PRD/PRB/COD, outlier exclusion log, appraiser certification signature block. Format: Washington State DOR audit standard.
- **IAAO-Format Report** — IAAO Standard on Ratio Studies compliant format
- **Strata CSV** — raw stratum data for external analysis

### API
`GET /api/calibrationdiagnostic/stratified-equity?matrixVersionId={id}&revalArea={area}&buildingType={type}`  
Returns: `[{ quintile, ageBand, medianRatio, cod, saleCount, parcelIds }]`

---

## New Backend Entities / Tables

### `SaleRecord` (new entity)
```csharp
public class SaleRecord
{
    public int Id { get; set; }
    public int MatrixVersionId { get; set; }
    public string ParcelId { get; set; }
    public string RevalArea { get; set; }
    public string BuildingType { get; set; }
    public DateTime SaleDate { get; set; }
    public decimal SalePrice { get; set; }
    public decimal AssessedValue { get; set; }
    public decimal Ratio { get; set; }           // AssessedValue / SalePrice
    public bool IsOutlierIqr { get; set; }       // computed on import
    public string? AiClassification { get; set; } // ESTATE_SALE, RENOVATION, RELATED_PARTY, etc.
    public string? PacsFlags { get; set; }        // raw flags from PACS
    public int ValueQuintile { get; set; }        // 1–5, computed on import
    public int AgeBand { get; set; }              // 1–5 (Pre-1960 through Post-2015)
    // audit fields
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string CreatedBy { get; set; }
    public string UpdatedBy { get; set; }
}
```

### `OutlierExclusion` (new entity)
```csharp
public class OutlierExclusion
{
    public int Id { get; set; }
    public int MatrixVersionId { get; set; }
    public int SaleRecordId { get; set; }          // FK to SaleRecord (not just parcelId — one parcel may have multiple sales)
    public string DispositionType { get; set; }   // EXCLUDED, FLAGGED_DATA, ACCEPTED
    public string AppraiserNote { get; set; }
    public bool DataProblemFlagged { get; set; }  // triggers Property Workbench finding
    // audit fields
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; }
}
```

### New API Endpoints Summary
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/calibrationdiagnostic/reval-area-summary` | Navigator health indicators |
| GET | `/api/calibrationdiagnostic/parcel-evidence` | Sale records + outlier flags |
| POST | `/api/calibrationdiagnostic/simulate` | Project PRD/PRB/COD for proposed adjustment |
| POST | `/api/calibrationdiagnostic/solve-for-rate` | Reverse solver: target PRD → adjustment % |
| GET | `/api/calibrationdiagnostic/stratified-equity` | Quintile × age band heatmap data |
| POST | `/api/matrixversion/{id}/apply-adjustment` | Commit adjustment to matrix version |
| POST | `/api/calibrationdiagnostic/outlier-exclusions` | Record outlier disposition |
| GET | `/api/calibrationdiagnostic/export-dor` | Generate DOR ratio study package |

---

## New Frontend Components

| Component | File | Purpose |
|-----------|------|---------|
| `AiCopilotBand` | `calibration/AiCopilotBand.tsx` | Always-visible stats + alerts + narrative |
| `RevalAreaNavigator` | `calibration/RevalAreaNavigator.tsx` | Left sidebar tree with health indicators |
| `ParcelEvidenceViewer` | `calibration/ParcelEvidenceViewer.tsx` | Scatter plot + outlier cards |
| `AdjustmentSimulator` | `calibration/AdjustmentSimulator.tsx` | Rate input grid + projection + cross-area |
| `StratifiedEquityPanel` | `calibration/StratifiedEquityPanel.tsx` | Heatmap + regressivity curve + export |
| `useCalibrationContext` | `hooks/calibration/useCalibrationContext.ts` | Shared state: area, type, adjustments, exclusions |
| `useRatioProjection` | `hooks/calibration/useRatioProjection.ts` | Client-side PRD/PRB/COD projection engine |

---

## Data Flow Summary

```
SaleRecord data (from PACS import or dev seed)
        ↓
GET /parcel-evidence → ParcelEvidenceViewer
  Appraiser excludes outliers → OutlierExclusion records created
        ↓
useCalibrationContext (excludedSaleIds updated)
        ↓
useRatioProjection (client-side, runs on adjustmentPct change)
  → AiCopilotBand updates live (current → projected)
  → AdjustmentSimulator shows projected stats + cross-area impact
  → StratifiedEquityPanel "After" toggle recolors heatmap
        ↓
POST /simulate (validates projection server-side)
POST /apply-adjustment (commits to matrix version on confirm)
        ↓
Audit trail entry → DOR export package
```

---

## Out of Scope (Post-R1)

- Multi-year trend analysis (comparing 2025 vs 2024 study)
- Automated time-trend adjustment calculation (flag it, appraiser decides)
- Geographic clustering / GIS overlay on the scatter
- Automated PACS data sync (seed via existing DevPropertySeeder pattern for now)

---

## Success Criteria

A PhD-level chief appraiser can:
1. Open the workbench, select Reval 3 / S1, and immediately see PRD/PRB/COD with IAAO compliance status
2. See the ratio scatter with outliers flagged, read the AI classification, and make dispositions in < 2 minutes
3. Type a proposed adjustment and see projected stats across all IAAO metrics + cross-area impact before touching anything
4. See the regressivity pattern in the heatmap and click into the worst stratum to review the individual sales
5. Apply an adjustment with a full audit trail entry and generate a DOR-ready export package
6. Complete a full reval area audit loop in < 15 minutes per area

All three IAAO metrics (PRD, PRB, COD) must be within standard after the final applied adjustment, or the appraiser must have documented an override with a note.
