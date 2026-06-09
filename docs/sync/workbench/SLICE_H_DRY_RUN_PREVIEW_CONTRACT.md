# Workbench Slice H — Dry-Run Preview Contract

**Status**: CONTRACT — no implementation yet  
**Version**: 1.0 · 2026-06-08  
**Depends on**: Workbench v0.1 (Slices A–G sealed)  
**Implements**: TERRAFUSION_SYNC_WORKBENCH_MVP.md §5 (Step 5 — Dry Run)  
**Doctrine reference**: TERRAFUSION_SYNC_PRODUCT_DOCTRINE.md §3–§4

---

> **Hard rule** (non-negotiable, applies to every design decision in this slice):
>
> **The dry-run preview panel must never be visually or technically confused with drain
> execution.** A user who glances at the panel for two seconds must be able to tell,
> without reading fine print, that no data has moved.

---

## 1. What a dry-run preview is

A dry-run preview answers:

> **"If I ran this drain right now, what would happen — without actually running it?"**

It is a **read-only projection**. It reads source data and truth data (SELECT only), computes
what the drain *would* produce, and returns counts, delta estimates, quarantine candidates, and
a denominator verdict — without inserting, updating, or deleting any row in any table.

The operator uses it to verify, before committing, that:
- The projected row counts are within expected range
- The quarantine rate is acceptable
- Identity resolution is clean
- The denominator verdict matches what was agreed in the source pack

**It is the go/no-go checkpoint.** The drain does not execute until the operator explicitly
approves the dry-run result. That approval is a separate, intentional act — not a checkbox
buried in the preview panel.

---

## 2. What a dry-run preview is NOT

| Claim | Prohibited |
|-------|-----------|
| "This ran the drain" | Forbidden — the preview never writes |
| "These rows have been promoted" | Forbidden — no promotion occurs |
| "Quarantine has been released" | Forbidden — quarantine is untouched |
| "Canonical is now updated" | Forbidden — canonical is read-only during preview |
| "This is proof the drain succeeded" | Forbidden — it is a projection, not execution evidence |

The dry-run preview is NOT a seal. It is NOT an evidence artifact. It does NOT update any
lane status, seal registry, or audit log entry beyond a read-only preview-run record.

---

## 3. Mutation prohibition

The dry-run endpoint **MUST NOT**:

- INSERT, UPDATE, or DELETE any row in `truth_pacs.*`
- INSERT, UPDATE, or DELETE any row in `canonical_tf.*`
- INSERT, UPDATE, or DELETE any row in `legacy_pacs_raw.*`
- Modify any `sync_bridge.source_xref` row
- Write to any doctrine table (`tf_doctrine_*`)
- Trigger any EF ChangeTracker `SaveChanges()` call that would write truth or canonical data
- Update any lane seal registry entry
- Write to `docs/sync/seals/` (no evidence artifact is created)
- Trigger any downstream SignalR event that implies drain completion

**Permitted writes** (narrow exceptions, must be labeled as preview-only):

- A `sync_bridge.dry_run_log` row recording: lane, timestamp, operator, projected counts,
  and a `is_preview=true` flag. This row is for audit traceability only — it records that
  a preview was run, not that a drain executed.
- Nothing else.

**Verification rule**: after a dry-run completes, the operator must be able to re-run the
current doctor preflight and see no change in truth/canonical row counts. If counts change,
the implementation is wrong.

---

## 4. Allowed inputs

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `lane` | string | yes | Lane name: `parcel`, `owner`, `land`, `improvement`, `sales`, `geometry`, `assessment`, `exemption`, `jurisdiction`, `revenue-levy`, `revenue-assessment-bill` |
| `topN` | integer | no | Limit the preview to N source rows. Default: full corpus. Used for fast smoke-checks. |
| `operationalYear` | integer | no | Override the operational year. Default: current from source pack. |
| `dryRun` | boolean | yes | Must be `true`. If `false` or absent, the endpoint must refuse with 400. |

**Inputs that are NOT permitted in the dry-run call:**

- Mapping overrides (mapping is fixed at drain time, not per-preview)
- Quarantine disposition instructions (quarantine is read-only in preview)
- Any flag that implies approval of the result
- Any `commit=true`, `approve=true`, or `execute=true` parameter

---

## 5. Expected outputs

The dry-run response returns a **projection object** per lane. All fields are counts or
verdicts — no row-level data (no PII, no parcel detail).

### Projection object

```
{
  lane:                   string,       // e.g. "owner"
  preview:                true,         // always true — confirms this is a preview
  operationalYear:        integer,
  topN:                   integer|null, // null = full corpus

  // Source counts
  sourceRowsScanned:      integer,      // rows examined in legacy_pacs_raw
  sourceRowsQualified:    integer,      // rows meeting the active-supplement rule
  sourceRowsDisqualified: integer,      // rows excluded by active-supplement or doctrine filter

  // Projection
  projectedTruthInserts:  integer,      // new truth rows that would be inserted
  projectedTruthUpdates:  integer,      // existing truth rows that would be updated
  projectedTruthDeletes:  integer,      // truth rows that would be removed (idempotent re-drain)
  projectedCanonical:     integer,      // canonical rows that would be written

  // Duplication invariant
  duplicationFactor:      number,       // projected truth rows / source rows qualified
  duplicationVerdict:     "PASS"|"WARN"|"FAIL",
  duplicationNote:        string|null,  // explanation if not exactly 1.0000×

  // Identity resolution
  identityResolved:       integer,      // projected rows that resolve to live spine
  identityUnresolved:     integer,      // projected rows without live-spine resolution
  identityVerdict:        "PASS"|"WARN"|"FAIL",

  // Quarantine
  projectedQuarantine:    integer,      // rows that would be quarantined
  quarantineRate:         number,       // projectedQuarantine / sourceRowsQualified (0.0–1.0)
  quarantineVerdict:      "PASS"|"WARN"|"BLOCKED", // BLOCKED if rate > 0.20
  quarantineTopReasons:   [             // top-5 quarantine reasons by projected count
    { reason: string, projectedCount: integer }
  ],

  // Denominator verdict
  denominatorExpected:    integer,      // from source pack / Benton reference (scaled)
  denominatorProjected:   integer,      // projectedCanonical
  denominatorDelta:       number,       // (projected - expected) / expected  (signed %)
  denominatorVerdict:     "PASS"|"WARN"|"FAIL",
  denominatorNote:        string|null,

  // Overall
  overallVerdict:         "PASS"|"WARN"|"BLOCKED",
  blockedReason:          string|null,  // set if overallVerdict == "BLOCKED"

  // Traceability
  previewRunId:           string,       // UUID recorded in dry_run_log (is_preview=true)
  previewTimestamp:       string,       // ISO 8601
  durationMs:             integer
}
```

### Verdict rules

| Condition | Verdict |
|-----------|---------|
| Quarantine rate > 20% | `overallVerdict = BLOCKED` — operator must review quarantine before approving |
| Identity unresolved > 5% | `identityVerdict = FAIL`, `overallVerdict = BLOCKED` |
| Denominator delta outside ±15% | `denominatorVerdict = WARN` |
| Denominator delta outside ±30% | `denominatorVerdict = FAIL`, `overallVerdict = BLOCKED` |
| Duplication factor ≠ 1.0000× (multi-row lanes excluded) | `duplicationVerdict = WARN` |
| All checks green | `overallVerdict = PASS` |

**BLOCKED means the operator cannot approve for drain from this preview result.** They must
investigate and re-run preview until the blocking condition is resolved.

---

## 6. Delta categories

The projection reports four delta categories for truth rows:

| Category | Meaning | Operator action |
|----------|---------|----------------|
| `projectedTruthInserts` | New rows — source has data canonical doesn't | Expected on first drain or after new PACS records |
| `projectedTruthUpdates` | Changed rows — source values differ from existing truth | Review if unexpectedly large |
| `projectedTruthDeletes` | Rows in truth not in source — idempotent re-drain cleanup | Should be zero on a healthy re-drain; non-zero means a parcel was removed from PACS |
| `projectedQuarantine` | Rows that would be refused for a known reason | Review top reasons before approving |

**The deltas are projections, not actions.** None of these numbers represent actual changes
until the operator explicitly approves the drain after reviewing this output.

---

## 7. Quarantine candidate reporting

The dry-run preview must surface quarantine **candidates** so the operator can decide whether
to proceed before any data moves. This is the primary value of dry-run over just running the
drain — catching a high quarantine rate before it lands in truth.

**Quarantine candidate output:**

- `projectedQuarantine` — total count of rows that would be quarantined
- `quarantineRate` — fraction of qualified source rows
- `quarantineTopReasons` — top-5 reason codes with projected counts (reason string only, no
  row-level PII or parcel detail)
- `quarantineVerdict`:
  - `PASS` — rate ≤ 5%
  - `WARN` — rate 5%–20%, operator should review reasons before approving
  - `BLOCKED` — rate > 20%, operator must address before any drain approval is possible

**What the quarantine output does NOT do:**

- Does not release any quarantined row
- Does not change the quarantine reason of any existing row
- Does not auto-approve any quarantine disposition
- Does not pre-populate the Step 6 quarantine review with decisions

The quarantine candidate list is advisory input for Step 6, not a substitute for it.

---

## 8. UI labels

Every surface that displays dry-run preview output must use these labels. No exceptions.

### Section heading

```
DRY-RUN PREVIEW — NO DATA HAS MOVED
```

Style: amber background, dark text, prominent. Not a subtle note — it must be the first thing
the operator sees when the panel renders.

### Per-lane card label

```
Preview · [lane name]
```

Not "Drain result", not "Projection complete", not "Ready to commit". The word "Preview" must
appear directly adjacent to the lane name on every card.

### Verdict display

```
✓  PASS — safe to approve
⚠  WARN — review before approving
⛔  BLOCKED — resolve before approving
```

### Approve button (NOT in Slice H)

The approve-for-drain button does not exist in Slice H. Slice H is the preview panel only.
The approval interaction is a separate implementation slice (v0.2 or later). If any button
appears in Slice H that could be mistaken for drain approval, the implementation is wrong.

### What must NOT appear in the UI

- "Run drain"
- "Commit"
- "Drain complete"
- "Rows promoted"
- "Sealed"
- Any green badge that implies finalization
- Any language suggesting the drain has already occurred

---

## 9. Required confirmation gate for any later execution

The dry-run preview result is a necessary but not sufficient condition for drain execution.
The confirmation gate consists of **all of the following**, in order:

1. **Preview result must be PASS or WARN** — BLOCKED previews cannot proceed to drain
2. **Operator reviews the projection** — counts, delta categories, quarantine rate, top reasons
3. **Operator explicitly clicks "Approve for drain"** on a separate, clearly-labeled screen
   (not the preview panel itself)
4. **Approval screen requires the operator to confirm:**
   - The projected canonical row count matches their expectation
   - The quarantine rate is acceptable for this county
   - They understand that the drain will write to truth and canonical tables
5. **Machine records the approval** with: operator identity, preview run ID (from dry-run
   log), timestamp, and which lane(s) were approved
6. **Drain executes only after all of the above** — no silent drain, no background execution,
   no "drain on next save"

**This gate is not implemented in Slice H.** Slice H delivers the preview panel only. The
approval interaction is a future slice. The contract defines the gate here so the preview
panel is built with the right affordances (it must carry a `previewRunId` that the approval
step will reference).

---

## 10. Acceptance criteria

Slice H is complete when:

- [ ] `POST /api/sync/dry-run/preview?lane={lane}&dryRun=true` exists and returns the
      projection object defined in §5
- [ ] Passing `dryRun=false` or omitting it returns HTTP 400 with a clear error message
- [ ] Running the endpoint against a live Benton DB produces non-zero `sourceRowsQualified`
      for at least the `owner` lane (the largest sealed lane)
- [ ] After running preview, re-running `tf-sync-doctor` shows no change in truth/canonical
      row counts (mutation prohibition verified)
- [ ] The UI panel heading renders "DRY-RUN PREVIEW — NO DATA HAS MOVED" in amber
- [ ] Each lane card shows "Preview ·" prefix on the lane name
- [ ] BLOCKED verdict renders with ⛔ and the blocking reason; no approve-equivalent button
      is visible
- [ ] The `previewRunId` UUID appears in `sync_bridge.dry_run_log` with `is_preview=true`
      after a run
- [ ] The panel renders on doctor run completion (not page load — it requires a prior doctor
      result to establish the baseline row counts for denominator comparison)
- [ ] 409 guard prevents concurrent preview runs on the same lane

---

## 11. Out-of-scope for Slice H

These are explicitly excluded. Do not add them until a separate slice is planned.

| Excluded item | Deferred to |
|--------------|-------------|
| Approve-for-drain button or interaction | Future slice (v0.2 approval gate) |
| Actual drain execution | Future slice (v0.2 drain trigger with explicit gate) |
| Quarantine disposition (accept/reject/map) | Slice I — Quarantine Review |
| Mapping grid override during preview | Future slice (Step 4 mapping) |
| Multi-lane batch preview | Future slice — preview one lane at a time in v0.2 |
| Historical drain comparison ("last time vs this time") | Out of scope — history lanes deferred |
| F2 parcel inflation diagnosis or repair | Separate workstream — explicitly deferred |
| Owner-link drift repair | Separate workstream — known deferred |
| Treasurer accounting surfaces | Out of scope per Doctrine §10 — permanently deferred |
| Evidence packet generation from preview | Step 7 only — preview is not a seal |

---

## 12. Implementation notes (not prescriptive — for reference only)

These are observations to help the implementer, not binding requirements.

**Existing dry-run surface:** The backend drain endpoints accept a `TopN` parameter for
sampling. Dry-run mode will need a distinct `?dryRun=true` flag that suppresses all writes.
The simplest implementation wraps the existing promoter pipeline in a transaction that is
always rolled back — projection counts are computed from the transaction before rollback.
Alternatively, a dedicated read-only projection path may be built that mirrors the promoter
logic without touching EF ChangeTracker.

**Denominator reference:** The expected canonical count for each lane comes from the source
pack lane contract. For Benton, these are known values. For a new county, they are estimated
from the source pack reference scaled by the county parcel count. The contract field
`denominatorExpected` is populated from the source pack, not computed dynamically.

**Quarantine candidate counts:** The quarantine reason taxonomy is already defined in
`SYNC-DOCTRINE-4-IMPL` (five reasons for improvement-attr quarantine). The dry-run preview
reuses the same classification logic but writes to a transient projection buffer rather than
the quarantine table.

**`sync_bridge.dry_run_log` schema (proposed):**

```sql
CREATE TABLE sync_bridge.dry_run_log (
  Id             BIGSERIAL PRIMARY KEY,
  PreviewRunId   UUID NOT NULL DEFAULT gen_random_uuid(),
  Lane           VARCHAR(64) NOT NULL,
  IsPreview      BOOLEAN NOT NULL DEFAULT TRUE,
  OperationalYear INT NOT NULL,
  TopN           INT NULL,
  ProjectedJson  JSONB NOT NULL,   -- full projection object
  CreatedAt      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

This table is append-only. No UPDATE or DELETE on it. Records are audit evidence that a
preview was run, not that data was changed.

---

## 13. Relation to existing workbench panels

Slice H adds one new panel to the cockpit, triggered after the doctor run:

| Panel position | Trigger | Contents |
|---------------|---------|----------|
| After Slice E (Identity Spine) | Doctor run complete + operator initiates | Per-lane dry-run projections |

The panel does NOT fire automatically after the doctor. The operator explicitly requests a
preview by selecting a lane and clicking "Run preview". This is intentional — preview runs
against the live PACS source and may take 30–120 seconds per lane.

The panel is NOT a replacement for any existing read-only panel. Slices A–G remain visible.
The dry-run preview is an additive layer on top of the preflight cockpit.

---

## 14. Contract sign-off

This contract must be confirmed before any Slice H implementation begins.

The implementation may NOT add features beyond what is defined here without a contract
amendment. The following are specifically prohibited without amendment:

- Any drain trigger, implicit or explicit
- Any quarantine disposition UI
- Any mapping override during preview
- Any evidence artifact generation from preview results

---

_Contract before code. This document is the single source of truth for Slice H._  
_Implementation follows only after this contract is confirmed._

**Prepared**: 2026-06-08  
**Status**: DRAFT — awaiting operator confirmation
