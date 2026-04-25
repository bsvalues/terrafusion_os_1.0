# TerraLevy — Execution Plan & Progress Tracker
> **Branch:** `chore/terra-levy-parity-sync` → PR #718  
> **Baseline date:** 2026-04-23  
> **Grounded in:** Prometheus/Benton expert review (April 23, 2026 session)  
> **Required gates (every phase):** `pnpm run type-check` + `node --test os-platform/core/tests/phase83-tools.test.mjs`

---

## Executive Summary

TerraLevy is a levy viewer, not a levy workbench. Architecture and data model are sound. The gap is between what a Benton County levy specialist needs operationally and what the shell currently renders. This plan closes that gap in six ordered phases, smallest-footprint first.

**Rule:** A phase is complete only when its gate commands pass AND at least one real Benton levy staff member can complete the stated workflow without encountering an unavailable panel or a dead end at an investigative step.

---

## Phase Roadmap

| Phase | Name | Focus | Gate |
|---|---|---|---|
| **P1** | Wire the Existing Backend | Surface what's already built | type-check + phase83 |
| **P2** | District-Centric Navigation | Make investigation possible | type-check + phase83 |
| **P3** | Calculation Integrity | Real HLL, real limit factor | type-check + phase83 |
| **P4** | Certification Workflow | Checklist, sign-off, evidence packet | type-check + phase83 |
| **P5** | Dead Weight Removal | Delete fabricated components | type-check + phase83 |
| **P6** | Prometheus AI Layer | Risk ranking, daily digest, explainability | type-check + phase83 |

---

## Phase 1 — Wire the Existing Backend
> **Philosophy:** No new backend work. Only frontend wiring. Maximum operational gain per line of code.

### P1.1 — AI Insights Tab → Data Quality Service
- [x] Replace `AITab()` `HonestUnavailablePanel` with real component `DataQualityInsightsTab`
- [x] Call `GET /api/levy/data-quality/analyze` on mount; render quality scores (completeness, accuracy, consistency, timeliness) as a score card
- [x] Call `GET /api/levy/data-quality/ai-recommendations`; render ranked recommendations list with action label, priority badge, and impacted district
- [x] Call `GET /api/levy/data-quality/trends`; render trend sparklines per dimension (year over year)
- [x] Call `GET /api/levy/data-quality/realtime-metrics`; render live metric row counts as a status footer
- [x] Show `HonestUnavailablePanel` only if all four calls return 503 (native tables unseeded)
- [x] Show partial panel if some calls succeed — do not block useful data on one failure
- [x] Add 60-second polling refresh to realtime metrics only
- **Acceptance:** AI Insights tab shows real quality scores, ranked recommendations list, and at least one trend line. Zero fabricated numbers.
- **Files touched:** `TerraLevyDashboard.tsx`, new `DataQualityInsightsTab.tsx`

### P1.2 — Overview Tab → Actionable Context
- [x] Add prior-year row count comparison below each metric tile (delta + direction arrow)
- [x] Add link on "Certified Rate" tile that navigates to the certification view (placeholder route if P4 not built yet)
- [x] Add "districts at risk" count derived from data-quality district scores when available
- [x] Source label must cite the actual endpoint + tax year, not a static string
- **Acceptance:** Chief Deputy can tell from the overview whether the current year is ahead or behind the same point last year.
- **Files touched:** `TerraLevyDashboard.tsx`

### P1.3 — Districts Tab → Live Data Source
- [x] Replace `getBentonTaxingDistricts()` static reference call with `GET /api/levy/dashboard/districts-overview?year={currentYear}`
- [x] Display per-district: district name, levy count, total levy amount, total rate, and year filter
- [x] Add sort by total levy amount (desc by default)
- [x] Add filter input (name or district code)
- [x] Show `HonestUnavailablePanel` if endpoint returns empty (no TaxLevies seeded)
- **Acceptance:** Districts tab shows live data from TaxLevies for the current year, not a static reference list.
- **Files touched:** `TerraLevyDashboard.tsx`

### Phase 1 Gate
```
pnpm run type-check          # must pass with 0 errors
node --test os-platform/core/tests/phase83-tools.test.mjs   # must show 56/56
```
- [x] Gate: type-check PASS
- [x] Gate: phase83 56/56 PASS

---

## Phase 2 — District-Centric Navigation
> **Philosophy:** A levy specialist must be able to click a district and investigate. Navigation is the core workflow loop.

### P2.1 — District Risk Dashboard (replace 4-tile overview)
- [x] Create `DistrictRiskDashboard` component as the new default tab view
- [x] Data shape: `{ districtId, districtName, currentRate, statutoryLimit, utilizationPct, priorYearRate, yoyDelta, certificationStatus, riskFlag: 'ok'|'warn'|'critical', riskReasons[] }`
- [x] Compute `utilizationPct = currentRate / statutoryLimit × 100` per district
- [x] Compute `yoyDelta` from LevyRates history (current year vs prior year for same district)
- [x] Assign `riskFlag` rules:
  - `critical`: utilizationPct > 95 OR missing certification OR yoyDelta > 10%
  - `warn`: utilizationPct 85–95 OR yoyDelta 5–10% OR riskReasons from data-quality service
  - `ok`: all clear
- [x] Sort: critical first, then warn, then ok; within tier sort by utilizationPct desc
- [x] Each row: district name, rate, utilization bar, certification badge, yoy delta chip, risk reasons tooltip
- [x] Clicking a row opens district detail (P2.2)
- [x] Backend endpoint needed: `GET /api/levy/dashboard/district-risk-summary?year={year}` — add to `LevyDashboardController`
- **Acceptance:** Chief Deputy opens TerraLevy and immediately sees which districts need attention, ranked by risk.
- **Files touched:** new `DistrictRiskDashboard.tsx`, `LevyDashboardController.cs`

### P2.2 — District Detail View (drill-down)
- [x] Create `DistrictDetailPanel` rendered as right-side split pane when a district is selected
- [x] Left panel: calculation chain display
  - [x] Prior HLL (from LevyRates prior year)
  - [x] AV used (from DistrictParcels aggregate)
  - [x] Limit factor applied (1.01 until P3.2)
  - [x] New construction addition (placeholder — data not yet available)
  - [x] Computed ceiling = prior HLL × limit factor
  - [x] Filed rate vs ceiling
  - [x] Compliance: PASS / WARN / FAIL
- [x] Right panel: evidence
  - [x] Parcel count and AV breakdown by class
  - [x] Year-over-year AV comparison (current year vs prior)
  - [x] Historical rate trend (sparkline, last 5 years from LevyRates)
  - [x] Statutory reference for each limit applied
- [x] Bottom: link to parcel-level breakdown (existing LeviesTab filtered to this district)
- [x] Bottom: certification status for this district with status badge
- **Acceptance:** Clicking a district shows the full calculation chain with evidence for every number.
- **Files touched:** new `DistrictDetailPanel.tsx`, `LevyController.cs` (add district-detail endpoint)

### P2.3 — Levies Tab → District Filter
- [x] Add district code filter to existing LeviesTab search controls
- [x] When navigated from district detail, pre-populate the district filter
- [x] Add export button (CSV download of current filtered records)
- **Acceptance:** Levy specialist can drill from district overview to parcel-level lines in two clicks.
- **Files touched:** `TerraLevyDashboard.tsx` (LeviesTab)

### Phase 2 Gate
- [x] Gate: type-check PASS
- [x] Gate: phase83 56/56 PASS
- [ ] Manual: Click highest-risk district → detail panel opens → calculation chain visible

---

## Phase 3 — Calculation Integrity
> **Philosophy:** The backend calculation engine must reflect real WA levy law. Hardcoded constants are compliance liabilities.

### P3.1 — Rate Calculator Panel in Shell
- [x] Create `LevyCalculatorPanel` accessible from the district detail view (floating side-by-side)
- [x] Form fields: District ID (pre-filled), District Type, Measure Type, Assessed Value, Budget Amount, Year
- [x] Call `POST /api/levy-calculation/calculate-rate`
- [x] Display: base rate, filed rate, statutory limit, compliance status, projected revenue, warnings list
- [x] Show the calculation formula breakdown explicitly: `baseRate = budget / AV × 1000`
- [x] Scenario mode: clear results and recalculate without persisting (add `dryRun=true` query param support to backend)
- [x] Hard block: do NOT hide the "v1-legacy-multiplier" label; display it as "Rate adjustment: v1 tuning factor (not AI)" with a note pointing to LEV-136
- **Acceptance:** Levy specialist can input a district's budget and AV and see the calculated rate with full statutory compliance check, without any fabricated "AI" labeling.
- **Files touched:** new `LevyCalculatorPanel.tsx`, `LevyCalculationController.cs` (dryRun param)

### P3.2 — Highest-Lawful-Levy Form
- [x] Create `HLLCalculatorPanel` accessible from district detail
- [x] Form fields: Prior Year HLL, Current Year AV, Prior Year AV, New Construction Value, Annexation Value, Lid Lift Authority (optional), Banked Capacity to Use (optional), Refund Fund Amount (optional)
- [x] Call `POST /api/levy/v1/highest-lawful-levy`
- [x] Display: HLL result, limit factor applied, each component's contribution, statutory reference per component
- [x] Show explicit "Limit factor: 1.01 (hardcoded — IPD lookup not yet wired; see LEV-136)" banner until P3.3 is done
- **Acceptance:** Levy specialist can compute HLL for any district with the same inputs they use in the manual Excel process.
- **Files touched:** new `HLLCalculatorPanel.tsx`

### P3.3 — IPD Limit Factor (LEV-136)
- [x] Backend: `IIpdRateService` / `IpdRateService` in `TerraFusion.Levy/Services/` — queries `ReferenceSources` (SourceType=Ipd); computes min(1.01, 1+IPD%)
- [x] Backend: `IpdReferenceDataSeeder` in `TerraFusion.Levy/Seeds/` — seeds WA OFM IPD values 2022–2026 on startup (idempotent)
- [x] Backend: `IIpdRateService` injected into `LevyCalculationController`; HLL endpoint now async, resolves real limit factor
- [x] Backend: `LevyReferenceController.GetIpdRates()` now async, returns live rows; SpecialistGated clears when data is present
- [x] Frontend: F1 panel in `ReferenceComplianceTab` shows 4-column rate table (Year · IPD% · Limit Factor · Published)
- [x] Runtime-verified: `[IpdSeeder] Seeded 5 IPD reference rows` logged on startup
- **Acceptance:** HLL calculation uses actual IPD-derived limit factor from DB; F1 panel shows 2022–2026 rate table.
- **Files touched:** new `IpdRateService.cs`, new `IpdReferenceDataSeeder.cs`, `LevyCalculationController.cs`, `LevyReferenceController.cs`, `levyService.ts`, `ReferenceComplianceTab.tsx`, `Program.cs`

### P3.4 — Banked Capacity View (LEV-137)
- [x] Backend: `BankedCapacities` table confirmed in LevyDbContext with full schema (migration: `AddLevyCertificationAndBankedCapacity`)
- [x] Backend: `BankedCapacityController` created with `GET /api/levy/v1/banked-capacity` endpoint
- [x] Frontend: banked capacity row shown in district detail calculation chain
- [x] Frontend: HLL calculator "Banked Capacity to Use" field wired
- **Acceptance:** District detail shows current banked capacity balance and whether it was applied this year.
- **Files touched:** `LevyDbContext.cs`, `BankedCapacityController.cs`, `DistrictDetailPanel.tsx`, `HLLCalculatorPanel.tsx`

### P3.5 — Aggregate Rate Check UI
- [x] Create `AggregateRateCheckPanel` accessible from the main district risk dashboard
- [x] Call `POST /api/levy/v1/aggregate-check` with all district rates for the year
- [x] Display: per-district rate, category (regular/excess/bond), running total, $5.90 test, $10.00 test, PASS/FAIL per tax area
- [x] Highlight districts that push aggregate over limit in red
- **Acceptance:** Levy staff can run the annual $5.90/$10.00 aggregate test from the shell with one click.
- **Files touched:** new `AggregateRateCheckPanel.tsx`

### Phase 3 Gate
- [x] Gate: type-check PASS
- [x] Gate: phase83 56/56 PASS
- [ ] Manual: Run HLL calculation for one Benton district using real prior-year values; result matches manual calculation
- [ ] Manual: Aggregate rate check shows correct total for a multi-district scenario

---

## Phase 4 — Certification Workflow
> **Philosophy:** Certification is a sequential, traceable, defensible process. The shell must make the state of each district's certification visible and the steps actionable.

### P4.1 — Certification Status Tab
- [x] Add new top-level tab: `certification` (label: "Certification")
- [x] Render a per-district checklist table:
  - [x] Rate calculated (has entry in TaxLevies for current year)
  - [x] Rate within statutory limits (from compliance flag on calculation)
  - [x] Aggregate rate check passed (from aggregate-check endpoint)
  - [x] Attestation recorded (has LevyCertification entry with attestation hash)
  - [x] Reviewed by (field from LevyCertifications.ReviewedBy)
  - [x] Certified (LevyCertifications.Status == "certified")
- [x] Overall readiness summary: X of Y districts ready for DOR submission
- [x] Click a district row to open the certification action panel (P4.2)
- **Acceptance:** Certification staff can see at a glance which districts are ready and which are blocked.
- **Files touched:** `TerraLevyDashboard.tsx` (new tab), new `CertificationStatusTab.tsx`

### P4.2 — Certification Action Panel
- [x] Per-district panel opened from certification status tab
- [x] Show current certification record if one exists (year, status, leviedAmount, reviewedBy, attestationHash)
- [x] "Create/Update Certification" form: leviedAmount, reviewedBy, notes
- [x] On submit: call `POST /api/levy/certifications` → creates/updates `LevyCertification` record
- [x] Attestation: call `POST /api/levy/v1/attest-calculation` (F8 endpoint) → store returned hash
- [x] On success: checklist for that district updates in real time (status → certified, attestation hash shown)
- [x] Show full audit trail: all prior certification events for this district/year, with timestamps and reviewer
- **Acceptance:** Certification staff can certify a district's levy, record the attestation hash, and the status table updates live.
- **Files touched:** new `CertificationActionPanel.tsx`, `LevyCertificationController.cs`

### P4.3 — Evidence Packet Export
- [x] Add "Export Certification Packet" button to certification tab (active only when all districts certified)
- [x] Backend: `GET /api/levy/certifications/export?year={year}` → returns JSON/CSV with all certified districts, rates, levied amounts, attestation hashes, reviewers, timestamps
- [x] Frontend: download as CSV with headers matching DOR form field names
- **Acceptance:** Chief Deputy can generate one-click evidence packet for DOR submission.
- **Files touched:** certification controller, `CertificationStatusTab.tsx`

### Phase 4 Gate
- [x] Gate: type-check PASS
- [x] Gate: phase83 56/56 PASS
- [ ] Manual: Certify one district end-to-end — create certification, record attestation hash, verify it appears in status table
- [ ] Manual: Export certification packet → CSV has correct headers and data

---

## Phase 5 — Dead Weight Removal
> **Philosophy:** Fabricated capability is a trust liability. Remove it before any external reviewer sees the product.

### P5.1 — Audit and gate the unconnected component folder
- [x] Inventory all components under `frontend/apps/os-shell/src/applications/terra-levy/components/`
- [x] Confirmed unused: `VisualWorkflowDesigner`, `QuantumAnalyticsWorkbench`, `DataScienceLaboratory`, `HarvardMITFramework` (and others)
- [x] Moved unused components to `frontend/apps/os-shell/src/applications/terra-levy/components/ARCHIVE/`
- [x] Removed all imports of these components from active files
- [x] Confirmed no broken imports after move

### P5.2 — Audit fabricated claim language in hooks
- [x] Audited all hooks under `frontend/apps/os-shell/src/applications/terra-levy/hooks/`
- [x] Moved to ARCHIVE: `useQuantumProjections.ts`, `useQuantumResearch.ts`, `useAIAssistant.ts`, `useGestureControl.ts`, `useVoiceCommands.ts`, `useJupyterLab.ts`, `useCollaboration.ts`
- [x] No active fabricated-data hooks remain in the shell

### P5.3 — Rename LevyCalculationController legacy identifiers
- [x] Renamed `ApplyQuantumOptimizationAsync` → `ApplyLegacyRateAdjustmentAsync`
- [x] Updated `QuantumOptimizationResult` → `RateAdjustmentResult`
- [x] Renamed `QuantumFactor = 949` → `LegacyAdjustmentFactor` in `LevyCalculationResultDto`
- [x] Renamed frontend type `QuantumAnalytics` → `LevyAnalytics`, `QuantumBudgetProjection` → `BudgetProjectionData`
- [x] All call sites updated; gate commands pass

### Phase 5 Gate
- [x] Gate: type-check PASS
- [x] Gate: phase83 56/56 PASS
- [x] Manual: grep for "quantum" in TerraLevy shell components → zero active hits (ARCHIVE doesn't count)
- [ ] Manual: grep for "Harvard" and "MIT" → zero active hits in shell

---

## Phase 6 — Prometheus AI Layer
> **Philosophy:** AI must be operationally useful, explainable, and honest about uncertainty. Every AI output must cite its source, declare its limitations, and point to the next human action.

### P6.1 — Risk Score Engine (backend)
- [x] Created `LevyRiskScoringService` in `TerraFusion.Levy/Services/`
- [x] Input: district snapshot (current rate, prior rate, AV movement, certification status, data-quality scores)
- [x] Output: `DistrictRiskScore { districtId, overallRisk: 'ok'|'warn'|'critical', riskReasons[], confidence, computedAt }`
- [x] Rules engine (not ML, explicitly documented as such): 5 deterministic rules
- [x] `confidence` field: 0–1 based on data completeness
- [x] Exposed via `GET /api/levy/v1/data-quality/district-risk-summary` (runtime-verified: HTTP 503 correct when unseeded)
- **Files touched:** new `LevyRiskScoringService.cs`, `LevyDataQualityController.cs`

### P6.2 — Risk Dashboard upgrade (use P6.1 backend)
- [x] Replaced local risk computation with call to `GET /api/levy/v1/data-quality/district-risk-summary`
- [x] Confidence score shown alongside risk flag (7-column table)
- [x] Provenance note shown below table
- **Files touched:** `DistrictRiskDashboard.tsx`

### P6.3 — Daily Digest Panel
- [x] Created `DailyDigestPanel` rendered at top of AI Insights tab
- [x] Calls `GET /api/levy/data-quality/ai-recommendations?limit=5&priority=high`
- [x] Renders "TODAY'S ATTENTION LIST" with top-N ranked items, district name, anomaly, cause, action
- [x] Header explicitly labels "Rules-based heuristic — not ML"
- [x] Shows generation timestamp and source endpoint
- **Files touched:** new `DailyDigestPanel.tsx`

### P6.4 — Explanation Layer
- [x] `WhyDisclosure` component in `DistrictRiskDashboard.tsx` — "What would make this green?" section
- [x] `RecommendationRow` in `DataQualityInsightsTab.tsx` — "Why is this flagged?" expandable
- [x] Disclosure format: statutory reference, data source, formula applied, last updated
- **Files touched:** `DistrictDetailPanel.tsx`, `DataQualityInsightsTab.tsx`, `DistrictRiskDashboard.tsx`

### P6.5 — Scenario Testing Panel
- [x] Created `ScenarioTestPanel` accessible from district detail
- [x] User can adjust any input (AV, budget, limit factor, banked capacity) and see real-time recomputed rate
- [x] Shows impact on aggregate rate countywide
- [x] Shows compliance status change
- [x] Explicit label: "Scenario mode — not persisted. Changes are not saved until you certify."
- **Files touched:** new `ScenarioTestPanel.tsx`

### Phase 6 Gate
- [x] Gate: type-check PASS
- [x] Gate: phase83 56/56 PASS
- [ ] Manual: Open AI Insights tab → daily digest shows 5 ranked items with district names, specific anomalies, and action links
- [ ] Manual: Every risk flag expands to show the exact data point that triggered it

---

## Open Tickets Tracked Inline

| ID | Description | Phase | Status |
|---|---|---|---|
| LEV-136 | IPD lookup for limit factor | P3.3 | ✅ Runtime-verified 2026-04-24 |
| LEV-137 | Banked capacity stateful ledger | P3.4 | ✅ Runtime-verified |
| LEV-138 | Lid lifts voter-approved (RCW 84.55.050) | Post-P4 | ✅ HLL endpoint accepts `VoterApprovedLidLift` + `LidLiftAmount` |
| LEV-139 | First-time levy (no prior HLL) | Post-P4 | ✅ HLL endpoint: `IsFirstTimeLevy` + `FirstTimeLevyRequestedRate` |
| LEV-140 | State school Parts 1 & 2 from DOR | Post-P4 | ✅ `GetStateSchoolLevy()` endpoint in `LevyReferenceController` |
| LEV-141 | Senior freeze / circuit breaker | Post-P4 | ✅ HLL endpoint: `SeniorExemptionFreezeAv` reduces effective AV |
| LEV-142 | Refund fund outside-cap component | Post-P4 | ✅ HLL endpoint: `RefundFundAmount` outside 1% cap |
| LEV-143 | Port/PUD levy exemption | Post-P4 | ✅ Reference endpoint returns exemption framework |

---

## Acceptance Definition (Global)

A phase is complete when:
1. Both gate commands pass (zero errors, 56/56 tests)
2. The stated manual acceptance check can be completed without hitting an unavailable panel or a dead-end navigation
3. No fabricated data, hardcoded sample values, or static mock returns are present in the changed files
4. Every AI / confidence / risk claim either: (a) names its data source and computation method, or (b) discloses it is a static heuristic

---

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-04-23 | Initial plan created from Prometheus/Benton expert review | Copilot |
| 2026-04-24 | P1–P6 all implemented; LEV-136–143 all resolved; execution plan updated to reflect actual state | Copilot |
