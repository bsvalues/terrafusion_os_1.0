# CostForge Calibration Workbench — Design Spec
**Date**: 2026-04-12  
**Status**: Approved — ready for implementation planning  
**Feature**: AI-native cost matrix calibration system for county assessors  
**Context**: TerraFusion OS 1.0 / CostForge module  

---

## 1. Problem Statement

The existing Rate Matrix Review (AIMatrixAnalyzer.tsx) is a **read-only diagnostic tool**. It reports on internal matrix equity (PRD/PRB/COD) but cannot:

- Run real ratio studies against TerraFusion sales data
- Distinguish rate problems from data problems
- Propose or apply rate adjustments
- Track matrix versions with legal defensibility
- Auto-generate the Calibration Memo required by Benton Method SOP §5.3
- Produce DOR equalization packages or legislative audit packages

A PhD-level chief appraiser needs to **Audit → Diagnose → Adjust → Verify → Document** — a full calibration loop. The current tool handles only Audit. This spec defines the remaining four phases as the **Calibration Workbench**.

---

## 2. Scope

**In CostForge (this spec):**
- Rate matrix adjustments (base rates $/sqft, area factors, secondary feature schedules)
- AI diagnosis: rate problems, external factors, evidence age alerts
- Matrix version management (Draft → Review → Approved → Locked → Archived)
- Calibration Memo auto-generation
- DOR and legislative audit package export
- Flagging misclassified parcels for Property Workbench

**Out of scope (handled elsewhere):**
- Parcel-level record changes → Property Workbench
- Individual parcel valuation → Assessment Workbench
- Tax rate setting → Legislature / Treasurer

---

## 3. Architecture — Four Layers

### Layer 1: AI Diagnostic Engine (Backend)

Runs continuously against TerraFusion data. Completes before the appraiser opens the tool.

**Data inputs:**
- Arm's-length sales, rolling 24-month window, from TerraFusion properties/sales tables
- Each sale matched to assessed value at date of sale
- Building type, reval area, size, age, condition per parcel
- Current locked matrix (rates applied at last assessment)
- Prior 4 matrix versions (for drift detection)
- Evidence age per reval area factor

**Computations:**
- Real PRD/PRB per building type AND per reval area (against actual sales, not just internal matrix)
- Real COD by type, by area, by value tier (Low/Mid/High proxy via building type mean rate)
- Classification of each finding:
  - `RATE_PROBLEM` — systematic deviation across all parcels in a type/area → adjust rate
  - `DATA_PROBLEM` — driven by 1–3 outlier sales or misclassified parcels → flag to Property Workbench, no rate change
  - `EXTERNAL_FACTOR` — deviation correlates with market shift or new construction wave → sales window adjustment
  - `NO_ACTION` — structurally expected (e.g., cross-type COD driven by type diversity, not inequity)

**Outputs per finding:**
- Classification + confidence level
- For `RATE_PROBLEM`: exact $/sqft adjustment to hit PRD target (0.98–1.03), county AV impact
- For `DATA_PROBLEM`: parcel IDs to flag, PRD/COD with outliers excluded vs included
- Evidence age per reval area factor (months since last ratio study)
- Drift alert if a type's rate hasn't changed in 2+ cycles but market has moved

### Layer 2: Calibration Cockpit (Frontend — new `/calibration` route)

Command-center UI. AI findings are pre-loaded. Appraiser reviews, accepts, overrides, or drills. Non-linear — expert can jump to any finding or manually adjust any rate.

**Components:**

**AI Finding Queue**
- Ranked by impact (severity × county AV affected)
- Each finding shows: classification, recommended action, impact preview, evidence summary
- Actions per finding: Accept AI recommendation / Modify / Drill into sales data / Override with manual rate / Send to Property Workbench

**Working Matrix Diff View**
- Side-by-side: current locked matrix (v2025.0) vs working draft (v2026.0-DRAFT)
- Changed cells highlighted in green
- Pending/unresolved cells highlighted in amber
- Click any cell → drill panel showing all sales behind that type × area intersection

**Mass Adjustment Controls**
- Scope: all types / selected type / selected reval area / selected type × area
- Adjustment type: % of current rate (preferred — preserves proportionality) or $/sqft flat
- Live impact preview: new rate, PRD after, PRB after, county AV delta
- "Apply to Draft" → updates working matrix, recalculates all diagnostics

**Live Diagnostics Bar**
- PRD, PRB, COD recalculate client-side as adjustments are applied
- Shows before (locked) and after (draft) values simultaneously

**Version Timeline**
- Visual list of all versions: DRAFT → LOCKED → ARCHIVED
- Evidence age indicator per reval area (CURRENT / AGING / STALE / CRITICAL)
- "Submit for Review" button → transitions draft to REVIEW state

**Calibration Memo Panel**
- Auto-drafts throughout the session as the appraiser works
- All 8 sections per Benton Method SOP §5.3 pre-filled from session activity
- Appraiser adds context notes, reviews, triggers sign-off chain
- Export as PDF

### Layer 3: Matrix Version Registry (Backend)

Git-model versioning. Every matrix has a semantic version and a state. State transitions are one-way per version.

**State machine:**
```
DRAFT → REVIEW → APPROVED → LOCKED → ARCHIVED
```

**Version types:**
- `CALIBRATED` — locally-driven by ratio evidence (standard)
- `MANDATED` — state DOR equalization order (different memo template, DOR order citation required)
- `PATCH` — mid-cycle correction to a locked matrix (creates e.g. v2025.1, full mini-cycle)

**MatrixVersion entity fields:**
```
id, countyId, version (semver string)
status: DRAFT | REVIEW | APPROVED | LOCKED | ARCHIVED
versionType: CALIBRATED | MANDATED | PATCH
effectiveDate, lockedAt, lockedBy
rateSnapshot: JSON (full 11×6 matrix at lock — immutable)
triggeringEvent: string
salesWindowStart, salesWindowEnd
salesExclusionRules: JSON
prdBefore, prdAfter, prbBefore, prbAfter, codBefore, codAfter
countyAvImpact: decimal
signOffChain: JSON (analyst → chief appraiser → assessor + timestamps)
calibrationMemoId: FK
nextReviewDate
parentVersionId: FK (patch lineage)
```

**RevalAreaEvidenceAge entity fields:**
```
matrixVersionId, revalArea, factor
lastRatioStudyDate, saleCount, medianRatio
evidenceAgeMonths (computed)
evidenceStatus: CURRENT (<24mo) | AGING (24–36mo) | STALE (36–60mo) | CRITICAL (>60mo)
```

**Invariants:**
- LOCKED and ARCHIVED versions are immutable — rateSnapshot never changes after lock
- Every rate change produces a new version — no in-place edits
- MANDATED versions block local calibration tools from overriding them
- Patch versions (v2025.1) carry parentVersionId pointing to v2025.0

### Layer 4: Governance Engine (Backend services + export endpoints)

Auto-generates all compliance artifacts. Nothing requires manual assembly.

**Calibration Memo** — auto-drafts from session activity, all 8 SOP §5.3 sections:
1. Purpose/Trigger (from AI finding that initiated the session)
2. Data Used (sales window, cleaning rules, exclusions from Layer 1)
3. Diagnostics Summary (PRD/PRB/COD before, from locked matrix analysis)
4. Change Made (from applied adjustments, with old/new version numbers and effective date)
5. Expected Impact (county AV impact, PRD/PRB/COD after projection)
6. Verification Plan (post-change ratio study date scheduled)
7. Sign-off/Review Chain (enforced workflow — cannot be bypassed)
8. Appraiser narrative notes (free text, added during session)

**DOR Equalization Package** — generated on demand:
- All matrix versions for requested date range with timestamps
- All Calibration Memos with complete sign-off chains
- PRD/COD trend charts across years
- Ratio study evidence linked to each version change
- Export in WA State DOR required format

**Legislative / State Auditor Package** — on demand:
- 5-year vertical equity trend (PRD/PRB/COD by type, all years)
- Every rate change with triggering market evidence
- WAC 458-07 compliance checklist (area factor documentation per factor)
- Value-tier equity analysis (no systematic regressivity)
- Full sign-off chain for all changes

**Matrix Provenance Report** — on demand or auto-presented to new staff:
- For every current rate: last calibration date, evidence, who signed, evidence age
- Market context: how has the local market moved since last calibration?
- Stale rate flags with recommended review priority

**Drift Alerts** — pushed proactively:
- "Type X hasn't been recalibrated in N cycles. Market has moved Y%. Estimated under/over-assessment: Z%."
- Reval area evidence age alerts when a factor ages past 36 months

**Property Workbench Flagging** — relay endpoint:
- CostForge sends parcel IDs identified as potential data problems to Property Workbench
- Includes AI finding context (why flagged, what the outlier evidence showed)
- CostForge never modifies parcel records directly

---

## 4. Multi-County and State DOR Considerations

**Sovereign county isolation** (already implemented in TerraFusion OS):
- Each county's matrix, sales data, and parcel records are fully isolated
- A Benton appraiser cannot see Yakima's rates or parcels
- Multi-county access requires explicit authorization

**State DOR aggregate role** (new — requires authorization):
- Read-only access to aggregate equity metrics per county (PRD/PRB/COD medians)
- No parcel data, no individual rates, no sales records
- Used for cross-county equalization analysis
- Implemented as a separate API endpoint with DOR-specific role claim

**Cross-county benchmarking** (authorized only):
- With inter-county data sharing agreement, chief appraiser can request anonymized peer county rate ranges
- "How does Benton Agricultural compare to Eastern WA county median?"
- Not automatic — requires per-request authorization

**Non-annual reval cycle support:**
- Version effective dates drive the cycle, not hardcoded annual logic
- A county on a 4-year cycle creates versions at 4-year intervals
- Evidence age thresholds scale with cycle length (STALE threshold adjusts)

**Reval area evidence age tracking:**
- Each of Benton's 6 reval areas has its own evidence age tracked independently
- The area currently in active revaluation has the most current evidence
- Areas not actively revalued in recent cycles trigger STALE/CRITICAL alerts
- This is a first-class UI indicator in the Version Timeline component

---

## 5. Relationship to Existing Components

**AIMatrixAnalyzer.tsx** (existing):
- Becomes the read-only **Rate Matrix Review** — unchanged
- Shows internal matrix equity (PRD/PRB by construction = 1.000, COD, factor analysis)
- The "Audit" phase output — what the matrix looks like internally

**Calibration Workbench** (new):
- The "Diagnose → Adjust → Verify → Document" phases
- Uses real ratio study data from TerraFusion (Layer 1)
- Sits at `/calibration` route in CostForge sidebar
- AIMatrixAnalyzer remains at `/ai-tools` as-is

**BenchmarkingController** (existing):
- Add ratio study query endpoints: sales per type×area, median ratio, PRD/PRB against sales
- These feed Layer 1 AI Diagnostic Engine

**CostForgeController** (existing):
- Add matrix version CRUD endpoints
- Add calibration memo endpoints

**Sidebar** (existing):
- Add "Calibration" nav item under Analysis section
- Badge showing count of open AI findings

---

## 6. Key Design Decisions

1. **AI proposes, appraiser approves.** AI never applies changes automatically. Every rate change requires an explicit "Apply to Draft" action by the appraiser.

2. **%-of-base adjustments preferred over flat dollar.** Mass adjustment controls default to % mode. Flat $/sqft mode is available but triggers a warning: "Flat adjustments may introduce Scale Effect regressivity (Benton Method SOP §2.2)."

3. **Evidence age is a first-class field.** Every reval area factor carries its last ratio study date. The UI shows CURRENT/AGING/STALE/CRITICAL status visibly. WAC 458-07 compliance risk is flagged at STALE.

4. **Locked matrices are truly immutable.** No update path exists for a LOCKED version's rateSnapshot. Corrections create a new PATCH version with its own full Draft→Review→Approve→Lock cycle.

5. **The Calibration Memo is not optional.** "Submit for Review" is blocked until the memo has a minimum completeness score (trigger, data universe, diagnostics summary, change description all filled).

6. **Two views always present.** The cockpit always shows current LOCKED matrix alongside the working DRAFT. The diff is always visible.

7. **CostForge never touches parcel records.** Data problems route to Property Workbench via a relay endpoint. CostForge emits the flag; Property Workbench owns the correction.

---

## 7. Files to Create / Modify

### Backend — TerraFusion.API

**New entities (TerraFusion.Core/Entities/):**
- `MatrixVersion.cs`
- `RevalAreaEvidenceAge.cs`
- `CalibrationMemo.cs`
- `CalibrationFinding.cs` (AI diagnostic results, stored per session)
- `PropertyWorkbenchFlag.cs` (relay to Property Workbench)

**New EF configurations (TerraFusion.Data/Configurations/):**
- One config class per entity above

**New controllers (TerraFusion.API/Controllers/):**
- `MatrixVersionController.cs` — CRUD + state transitions + DOR/audit export
- `CalibrationMemoController.cs` — CRUD + PDF export + sign-off chain
- `CalibrationDiagnosticController.cs` — AI diagnostic trigger + finding retrieval

**New services (TerraFusion.Core/Services/):**
- `IMatrixDiagnosticService.cs` + `MatrixDiagnosticService.cs` — Layer 1 AI engine
- `ICalibrationMemoService.cs` + `CalibrationMemoService.cs` — auto-draft logic
- `IGovernanceExportService.cs` + `GovernanceExportService.cs` — DOR/audit packages

**Modified:**
- `BenchmarkingController.cs` — add ratio study query endpoints
- `CostForgeController.cs` — add matrix version reference endpoints
- `TerraFusionDbContext.cs` — add new DbSets
- `Program.cs` — register new services

### Frontend — packages/terrabuild/client

**New pages:**
- `src/pages/CalibrationWorkbench.tsx` — main cockpit page

**New components:**
- `src/components/calibration/AIFindingQueue.tsx`
- `src/components/calibration/MatrixDiffView.tsx`
- `src/components/calibration/MassAdjustmentControls.tsx`
- `src/components/calibration/LiveDiagnosticsBar.tsx`
- `src/components/calibration/VersionTimeline.tsx`
- `src/components/calibration/CalibrationMemoPanel.tsx`
- `src/components/calibration/RevalAreaEvidenceAgeIndicator.tsx`
- `src/components/calibration/index.ts`

**Modified:**
- `src/components/layout/Sidebar.tsx` — add Calibration nav item with finding count badge
- `src/App.tsx` — add `/calibration` route

---

## 8. Success Criteria

1. Chief appraiser opens Calibration Workbench → AI findings are pre-loaded, no manual setup required
2. AI correctly classifies Agricultural rate deviation as RATE_PROBLEM and proposes +12.5% adjustment
3. AI correctly classifies C1 Reval 3 outliers as DATA_PROBLEM and flags 2 parcels to Property Workbench
4. Applying Agricultural adjustment updates all 11 area rates proportionally, PRD recalculates to 0.998
5. Calibration Memo auto-drafts with all 8 SOP sections, 90%+ pre-filled before appraiser adds notes
6. Matrix version v2026.0-DRAFT transitions through REVIEW → APPROVED → LOCKED with sign-off chain enforced
7. DOR equalization package generates in <60 seconds for 5-year date range
8. Locked matrix rateSnapshot is immutable — no update path exists in the API
9. Evidence age shows CRITICAL for any reval area factor >60 months old
10. TypeScript: 0 errors. All new backend endpoints return 200 in integration tests.
