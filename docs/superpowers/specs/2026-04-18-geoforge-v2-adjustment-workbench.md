# GeoForge v2 — Adjustment Workbench Design Spec

**Date:** 2026-04-18
**Status:** Design — Companion to v1 (`2026-04-18-geoforge-design.md`), sequenced after v1 ships
**Scope:** Close the assessor loop: **See → Diagnose → Adjust → Verify → Certify**
**Suite:** TerraForge (Forge suite)

---

## What v2 Adds

GeoForge v1 gives the assessor a diagnostic microscope — they can see every neighborhood's ratio study, understand what's failing, and get AI-ranked root causes. But v1 stops there. The assessor must then jump out of GeoForge, open CAMA, apply adjustments by hand, export new values, and come back to re-check. That is the loop v2 closes.

v2 adds four capabilities, in order of cost:

1. **Staged adjustments** — propose a change, see it layered into a live simulation without touching base data
2. **Mass-adjustment tooling** — apply a single decision across many parcels at once (neighborhood-wide, quintile-wide, feature-wide)
3. **Simulation overlay** — ghost-render the map with hypothetical adjustments so the assessor sees downstream equity impact before committing
4. **Write-back with full audit trail** — commit a set of adjustments to production AV records, FISMA-HIGH compliant, with reversibility

The design principle: **every adjustment is a staged object that can be simulated, rejected, or committed, and every committed adjustment is fully attributable.** Nothing writes to `PropertyAssessments` directly from a UI click. Everything flows through an `AdjustmentProposal → AdjustmentRun → PropertyAssessment` chain.

---

## The Four Appraiser Phases (v2 covers all)

| Phase | v1 capability | v2 capability |
|---|---|---|
| **See** | Full: map, stats, radar, rail | — |
| **Diagnose** | AI root-cause, peer match, data quality, attribution | Adjustment recommender (what to change, by how much, expected impact) |
| **Adjust** | — | Workbench: stage, simulate, iterate, approve |
| **Verify** | — | Simulation overlay + delta view: before/after stats on same map |
| **Certify** | Draft Report (narrative) | Certification packet: report + full adjustment audit trail + sign-off |

---

## New Domain Concepts

### AdjustmentProposal (staged, not applied)

A single proposed change. Independent unit of adjustment logic.

```csharp
public class AdjustmentProposal
{
    public Guid Id { get; set; }
    public Guid CountyId { get; set; }
    public int TaxYear { get; set; }
    public AdjustmentScope Scope { get; set; }   // see below
    public AdjustmentKind Kind { get; set; }     // see below
    public decimal Magnitude { get; set; }       // interpretation depends on Kind
    public string? TargetFeatureCode { get; set; } // e.g. "BSMT-FIN", null if not feature-scoped
    public string Rationale { get; set; }        // assessor-written justification (required)
    public Guid ProposedByUserId { get; set; }
    public DateTime ProposedAt { get; set; }
    public ProposalStatus Status { get; set; }   // Draft | UnderReview | Approved | Rejected | Applied | Reverted
    public Guid? AdjustmentSetId { get; set; }   // grouping — see AdjustmentSet
}

public enum AdjustmentScope
{
    Neighborhood,         // all parcels in one neighborhood
    NeighborhoodQuintile, // parcels in one neighborhood, within one value quintile
    CityRollup,           // all parcels in one city
    FeatureCode,          // all parcels with a given feature (e.g. all with "BSMT-FIN")
    ParcelList            // explicit list of parcel IDs
}

public enum AdjustmentKind
{
    PercentOfAV,          // AV *= (1 + magnitude)
    FlatDelta,            // AV += magnitude
    FeatureUnitRate,      // unit rate for a feature changes to magnitude
    TimeAdjustment,       // time-trend % applied to sale-date-adjusted AV
    RemoveSale,           // mark sale as disqualified (does not change AV, but changes ratio study)
    ReassignNeighborhood, // move parcels to a different neighborhood code
    SplitNeighborhood     // create new neighborhood, reassign parcels
}
```

### AdjustmentSet (grouping for simulation and approval)

A bundle of `AdjustmentProposal`s that are simulated and approved together — e.g. "KW-302 Q2 2025 revaluation corrections." Sets are the unit the assessor reviews, approves, and commits.

```csharp
public class AdjustmentSet
{
    public Guid Id { get; set; }
    public Guid CountyId { get; set; }
    public int TaxYear { get; set; }
    public string Name { get; set; }             // "KW-302 Q2 2025 corrections"
    public string Description { get; set; }
    public SetStatus Status { get; set; }        // Draft | Simulating | PendingApproval | Approved | Applied | Reverted
    public Guid OwnerUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? AppliedAt { get; set; }
    public Guid? AppliedRunId { get; set; }      // the AdjustmentRun produced when this was committed
    public ICollection<AdjustmentProposal> Proposals { get; set; }
}
```

### AdjustmentRun (the commit record, immutable)

When an `AdjustmentSet` is approved and applied, an `AdjustmentRun` snapshot is created. This is the audit record. It captures pre-state, post-state, and every individual parcel change.

```csharp
public class AdjustmentRun
{
    public Guid Id { get; set; }
    public Guid AdjustmentSetId { get; set; }
    public Guid CountyId { get; set; }
    public DateTime AppliedAt { get; set; }
    public Guid AppliedByUserId { get; set; }
    public Guid ApprovedByUserId { get; set; }    // must be different from AppliedByUserId (segregation of duties)
    public string PreStatsSnapshot { get; set; }  // serialized NeighborhoodStats for all affected neighborhoods, pre-adjustment
    public string PostStatsSnapshot { get; set; } // same, post-adjustment
    public int ParcelsAffected { get; set; }
    public ICollection<ParcelAdjustmentRecord> ParcelChanges { get; set; }
}

public class ParcelAdjustmentRecord
{
    public Guid Id { get; set; }
    public Guid AdjustmentRunId { get; set; }
    public string ParcelId { get; set; }
    public decimal PreAV { get; set; }
    public decimal PostAV { get; set; }
    public decimal DeltaAV { get; set; }
    public Guid SourceProposalId { get; set; }    // which proposal caused this change
}
```

**Reversibility:** An `AdjustmentRun` can be reverted by a new compensating run that restores `PreAV`. Reversion is itself a run — nothing is ever deleted, only compensated. This is the FISMA audit contract.

---

## The Workbench — New Primary Surface

A new route `/forge/geoforge/workbench` hosts the Adjustment Workbench. Alternatively, the workbench opens as a right-docked full-height panel within GeoForge when the assessor clicks "Open Workbench" from a DiagnosisPanel.

### Layout

```
┌─ GeoForge canvas (map + equity rail underneath, unchanged)  ┐
├──────────────────────────────────────────────────────────────┤
│  ADJUSTMENT WORKBENCH (right dock, 480px)                    │
│  ┌────────────────────────────────────────┐                  │
│  │ Active Set: "KW-302 Q2 corrections"   │                  │
│  │ [Draft] [Simulating] [Pending] [✓]    │                  │
│  └────────────────────────────────────────┘                  │
│                                                              │
│  PROPOSALS (3)                                               │
│  ┌────────────────────────────────────────┐                  │
│  │ ▸ +2.8% to KW-302 Q1                  │ simulated        │
│  │   Rationale: "lower-tier under-        │                 │
│  │   assessed per AI dx 2026-04-18"       │                 │
│  │   Impact: 34 parcels · ΔAV $1.2M       │                 │
│  │   Stats: COD 14.5 → 11.9 ✓ Benton     │                 │
│  └────────────────────────────────────────┘                  │
│  ┌────────────────────────────────────────┐                  │
│  │ ▸ Remove 3 outlier sales               │ simulated        │
│  │   Sale IDs: ...                        │                 │
│  │   Stats: COD 11.9 → 10.4 ✓            │                 │
│  └────────────────────────────────────────┘                  │
│  ┌────────────────────────────────────────┐                  │
│  │ + Add from AI recommendation           │                  │
│  │ + Add manually                         │                  │
│  └────────────────────────────────────────┘                  │
│                                                              │
│  CUMULATIVE IMPACT                                           │
│  Pre:  COD 14.5 · PRD 1.043 · VEI 12.8 ✗                    │
│  Post: COD  9.1 · PRD 1.008 · VEI  5.2 ✓                    │
│  [Visualize on map] [Request approval] [Discard set]        │
└──────────────────────────────────────────────────────────────┘
```

### Zones

**Set header** — active `AdjustmentSet` name, status chip, owner, last modified. Dropdown switches between the assessor's draft sets.

**Proposal list** — each proposal renders as a card with rationale (required free text), scope chip, magnitude, parcel count, and per-proposal stat delta. Cards are reorderable (order matters for some kinds — e.g., removing sales before applying percent adjustments changes which sales the PRB regression runs on). Each card has **Edit / Duplicate / Delete / Pin** actions.

**Add proposal** — three entry points:
- **From AI recommendation** — opens the Adjustment Recommender (below)
- **Manually** — scope picker → kind picker → magnitude → affected parcel preview → rationale → save
- **Batch import** — CSV of parcel IDs with deltas (power-user path for corrections from external sheets)

**Cumulative impact** — shows pre vs. post stats for all affected neighborhoods, with Benton/IAAO pass/fail badges, colored bars. This is the single number the assessor optimizes.

**Actions:**
- **Visualize on map** — activates simulation overlay (below)
- **Request approval** — moves set to `PendingApproval`; another authorized user must approve (segregation of duties)
- **Discard set** — soft-delete the set (proposals preserved in history)

---

## Adjustment Recommender (AI)

Opened from a DiagnosisPanel ("Recommend adjustments →" button) or from the workbench ("Add from AI recommendation"). Given:
- Subject neighborhood(s) and current stats
- Target threshold(s) (default: Benton Method — COD ≤ 12, PRD 0.99–1.02, VEI < 10)
- Constraints (assessor-specifiable: "don't adjust homes below $250k", "don't touch feature X", "max ±5% on any proposal")

The recommender returns a ranked list of candidate `AdjustmentProposal` specs, each with:
- Scope, kind, magnitude
- Expected post-application stats
- Expected impact on peer neighborhoods (overflow effects)
- Rationale (template-generated, editable)
- Confidence score

**Honest framing:** the recommender proposes options. The assessor picks, edits, and decides. AI never opens a proposal in approved state.

### Recommender logic (v2.0 — no LLM required)

1. Classify the failure mode from the DiagnosisPanel root-cause ranking
2. Select the playbook matching the dominant root cause:
   - **Stratification** → propose quintile-scoped percent adjustments; split-neighborhood if bimodality exceeds threshold
   - **Data quality** → propose corrective proposals per flag (e.g., re-code missing improvements, reconcile GIS/CAMA area)
   - **Outliers** → propose `RemoveSale` for each outlier with evidence of non-arms-length
   - **External factor** → propose time adjustments or suggest neighborhood-split along correlation boundary
3. Run each candidate proposal through the simulation endpoint (see below) to compute expected stats
4. Rank candidates by: (a) distance to target threshold, (b) smallest magnitude, (c) fewest parcels affected

LLM narrative layer (v2.1) can be added later for richer rationale strings; the core ranking is deterministic.

---

## Simulation Overlay (live map preview)

When the assessor clicks "Visualize on map" in the workbench, the main map enters **simulation mode**:

- Affected neighborhoods render with a subtle amber border glow
- Choropleth color repaints using simulated stats (current set applied)
- A **"Simulation" chip** appears top-right of the map — clicking it toggles simulation on/off
- The equity rail shows two bar strips stacked: current values (muted) + simulated values (bright)
- Hovering an affected neighborhood shows a mini before/after delta tooltip
- Bloom card, when opened in simulation mode, shows all stats as **"current → simulated"** pairs

Under the hood, the stats endpoint is called with `?proposedAdjustmentSetId=<current set id>` and the response overlays the proposal effects in-memory — **no writes to base data**. The backend computes this by loading base `ComparableSales` + `PropertyAssessments`, applying proposal transforms in a computed pipeline, then running the same Benton Method stat computation. Cached per-set for performance.

---

## Write-Back — the Commit Path

When a set is approved (two-person integrity — owner proposes, authorized approver approves), clicking **Apply** triggers:

1. **Snapshot pre-state** — serialize current stats for all affected neighborhoods into the forthcoming `AdjustmentRun`
2. **Apply proposals in order** — each proposal translates to a set of `PropertyAssessments` row updates (new AV, new feature codings, sale qualifications)
3. **Snapshot post-state** — serialize new stats
4. **Create `AdjustmentRun` + `ParcelAdjustmentRecord`s** — the immutable audit record
5. **Mark `AdjustmentSet.Status = Applied`** and set `AppliedRunId`
6. **Emit audit log events** — via existing `AuditableEntityInterceptor` plus a new dedicated `AdjustmentAuditLog` table that records the full run metadata for FISMA reporting
7. **Invalidate TanStack Query caches** — all ratio study queries for the affected county/year

All six steps are wrapped in a single EF Core transaction. Partial failure rolls back the entire run.

### Segregation of duties

`AdjustmentRun.AppliedByUserId` MUST differ from `AdjustmentRun.ApprovedByUserId`. Enforced at the service layer, not merely UI. This is FISMA-HIGH access control.

### Reversion

Any `AdjustmentRun` can be reverted. Reversion creates a new compensating run that applies the inverse of every `ParcelAdjustmentRecord`. The original run is never deleted — both the original and the reversion remain in the audit trail. The `AdjustmentSet` status moves to `Reverted`.

---

## New Backend Endpoints (v2)

```
# Proposals (CRUD, all county-scoped from JWT)
GET    /api/terraforge/adjustments/proposals?setId=...
POST   /api/terraforge/adjustments/proposals
PATCH  /api/terraforge/adjustments/proposals/{id}
DELETE /api/terraforge/adjustments/proposals/{id}

# Sets
GET    /api/terraforge/adjustments/sets
POST   /api/terraforge/adjustments/sets
PATCH  /api/terraforge/adjustments/sets/{id}
POST   /api/terraforge/adjustments/sets/{id}/request-approval
POST   /api/terraforge/adjustments/sets/{id}/approve        // different user from owner
POST   /api/terraforge/adjustments/sets/{id}/reject
POST   /api/terraforge/adjustments/sets/{id}/apply          // commits → creates AdjustmentRun
POST   /api/terraforge/adjustments/sets/{id}/discard

# Runs (audit trail, read-only after creation)
GET    /api/terraforge/adjustments/runs
GET    /api/terraforge/adjustments/runs/{id}
GET    /api/terraforge/adjustments/runs/{id}/parcel-changes
POST   /api/terraforge/adjustments/runs/{id}/revert         // creates compensating run

# Recommender
POST   /api/terraforge/adjustments/recommend
  body: { neighborhood, taxYear, targetThresholds, constraints }
  returns: ranked proposal candidates with simulated impact

# Simulation (the v1 forward-compat hook)
GET    /api/terraforge/ratio-study/neighborhood-stats?proposedAdjustmentSetId=...
  // v1 endpoint, now honors the parameter in v2
```

All endpoints enforce county isolation per the v1 contract (CountyId from JWT, never from input).

---

## New Frontend Structure (v2)

```
frontend/apps/os-shell/src/pages/forge/geoforge/
  workbench/
    WorkbenchPanel.tsx                  — dock root
    ProposalCard.tsx                    — individual proposal card
    ProposalEditor.tsx                  — create/edit modal
    ProposalRecommender.tsx             — AI recommender chooser
    CumulativeImpactStrip.tsx           — pre/post summary
    SimulationOverlayToggle.tsx         — map chip
    ApprovalRequestDialog.tsx           — segregation-of-duties approval flow
    ApplyConfirmationDialog.tsx         — final commit confirmation
  audit/
    AdjustmentRunList.tsx               — run history
    AdjustmentRunDetail.tsx             — per-run diff + revert button
    ParcelChangeTable.tsx               — sortable diff of parcel AVs
  hooks/
    useAdjustmentSet.ts                 — active set CRUD
    useProposals.ts                     — proposal CRUD
    useSimulation.ts                    — fetches stats with proposedAdjustmentSetId
    useAdjustmentRuns.ts                — audit history
    useRecommender.ts                   — AI recommender
  store/
    adjustmentStore.ts                  — Zustand slice (activates the v1-reserved slots)
```

The v1 Zustand store slots `adjustmentProposals` and `activeAdjustmentSetId` are populated by this new `adjustmentStore.ts`. No refactor of v1 state is required.

---

## Certification Packet (replaces v1 "Draft Report")

In v2, the assessor's deliverable to the county board is a **Certification Packet**:

1. **Ratio study narrative** — same as v1 (assessment level, uniformity, vertical equity, per-neighborhood table)
2. **Adjustment history** — every `AdjustmentRun` applied this revaluation cycle, with rationale, who approved, what it changed
3. **Before/after comparison** — county-wide stat trajectory from first-draft ratio study to certified final
4. **Signed statement** — assessor's digital signature on the final certified values with county seal metadata

Export formats: `.docx`, `.pdf`, plus a machine-readable `.json` adjudication bundle for state reporting to Washington DOR.

---

## Compliance Considerations (FISMA-HIGH)

| Control area | v2 implementation |
|---|---|
| Audit logging | Every proposal mutation, approval, application, reversion logged to immutable `AdjustmentAuditLog` via `AuditableEntityInterceptor` |
| Access control | Segregation of duties enforced: proposer ≠ approver; approver must have `Role.AssessmentApprover` claim |
| Data integrity | All writes transactional; every committed change produces a `ParcelAdjustmentRecord` snapshot |
| Reversibility | Every run reversible; original records never deleted |
| County isolation | Every endpoint filters by `CountyId` from JWT; no cross-county visibility |
| Non-repudiation | Approver's user ID and timestamp signed into the run record |
| Data retention | `AdjustmentRun` and `ParcelAdjustmentRecord` retained per state records-retention schedule (currently 7 years for Washington) |

---

## v2 Success Criteria

1. Assessor can create an `AdjustmentSet`, add proposals of any supported `AdjustmentKind`, and simulate their cumulative effect on ratio statistics without touching base data
2. Simulation overlay repaints the map with hypothetical stats within 500ms of toggling
3. AI recommender returns a ranked list of candidate proposals matching the root-cause category
4. Approval flow requires two distinct authorized users (segregation of duties) before an `AdjustmentSet` can be applied
5. Applying a set produces exactly one `AdjustmentRun` with pre/post snapshots and one `ParcelAdjustmentRecord` per affected parcel
6. Any `AdjustmentRun` can be reverted via a compensating run; original records remain intact
7. Every proposal, approval, application, and reversion produces an immutable `AdjustmentAuditLog` entry
8. County isolation holds for all endpoints — no cross-county data visible, even for system admins
9. Certification Packet exports as `.docx`, `.pdf`, and `.json` with all adjustment history inlined
10. All v2 copy passes `ui-honesty-pass` — AI *recommends*, assessor *applies*; no "AI applies" language anywhere

---

## Sequencing

v2 depends on v1 shipping. The v1 forward-compat hooks (stats endpoint `proposedAdjustmentSetId` parameter, Zustand reserved slots, `mode` prop on stat components) make v2 additive — no v1 refactor.

Recommended sequence inside v2:

1. Domain entities + DB migrations (AdjustmentProposal, AdjustmentSet, AdjustmentRun, ParcelAdjustmentRecord, AdjustmentAuditLog)
2. Proposal/Set CRUD endpoints + basic workbench UI (no simulation yet)
3. Simulation pipeline — honor `proposedAdjustmentSetId` in stats endpoint
4. Simulation overlay on map
5. Approval flow (segregation of duties)
6. Apply flow (write-back + audit)
7. Reversion flow
8. AI Recommender
9. Certification Packet
