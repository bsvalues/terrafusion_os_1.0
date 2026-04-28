# Valuation Review CSV Policy

**Slice:** C16-A (docs-only — defines the contract for C16-B
implementation: an operator-authored CSV of valuation-classification
decisions for `dbo.property_val.property_use_cd` that gets fed
through the C11-B batch edit CLI).
**Lifecycle layer:** valuation-classification readiness — the
operator-decision layer that turns PACS property-use codes into a
canonical `PropertyUse` vocabulary the C7+ valuation transforms can
consume.
**Status:** policy locked; CSV authoring + C16-B live application
deferred to the next slice.

## Provenance

- C2 schema: `SyncMappingWorkbook` / `SyncMappingColumn` /
  `SyncMappingCodeValue`. Audit fields auto-populated by
  `AuditableEntityInterceptor`.
- C6 lock service: `SyncMappingWorkbookLockService` — the eventual
  gate. Lock requires every column AND every code-value to reach a
  terminal review status.
- C9-A single-row edit policy + C11-A batch edit policy + C13-A
  sales review CSV policy — this slice's structural ancestors. The
  CSV grammar, atomicity, and Hard Guards are inherited verbatim
  from C11-A; the per-lane decision rules below are the
  valuation-specific layer on top.
- C11-C live batch edit proof — the original C13-B run mapped this
  slice's target column to canonical `PropertyUse` at the
  **column-row** level. That's the seed: the canonical target
  exists; this slice fills in every code-value's per-row decision.
- C13-A — C13-F sales lane review (6 slices, sales lane 0% → 100%
  terminal at the code-value level). The pattern that worked there
  (snapshot → drift → CSV → dry-run → apply → progress-after) is
  the same pattern this slice applies to valuation.
- C14-A / C14-B / C14-C review-progress dashboard — this slice's
  feedback loop. The operator runs the dashboard before authoring
  each batch and again after applying it; the NonTerminal-count
  delta must equal the CSV row count exactly (the C13-series
  pattern held for 4 consecutive batches; valuation gets the same
  invariant).
- Live workbook state at C13-F (`89d9606b3`):
  | Metric | Value |
  |---|---|
  | Status | `Draft` |
  | Columns | 200 |
  | Code values | 1,733 |
  | Terminal | 77 |
  | Non-terminal | 1,656 |
  | Sales lane | 100% complete |
  | **Valuation lane** | 0% (62 code-values NeedsReview) |
- Memory-flagged WacCd directive: still binding everywhere. For
  valuation, the analogous trap is "infer residential vs.
  commercial from code prefix or frequency." This policy explicitly
  rules that out.

## Purpose

Capture, review, and apply the operator's per-row decisions for
the single Valuation-lane column in the workbook. The output is
the column's full code-value vocabulary mapped to (or deferred
against) the existing canonical target `PropertyUse` — making the
C7+ valuation transforms able to translate PACS property-use codes
through workbook semantics.

## Scope

### In scope

| Source | Canonical Target | C13-F state |
|---|---|---|
| `dbo.property_val.property_use_cd` | `PropertyUse` (already set on column row) | column row Mapped; **62 code-values NeedsReview** |

### Out of scope

- Every other column in the workbook (~198 columns).
- Property-record / parcel-record mutation. The workbook is the
  decision layer; the C7+ transform consumer (a separate slice
  series) does the actual property-row mapping.
- PACS / canonical landing / Forge valuation artifacts /
  TerraAtlas / Studio / Dais writes.
- Sales-lane edits — sales is closed at the code-value level
  (C13-F); promotion of Deferred sales codes is a separate
  assessor-consult slice.
- Improvement / Land / Neighborhood / Other lanes — separate
  policies per lane.
- Frontend review UI (parked).

## Hard Guards

The five guards below extend the C11-A batch edit Hard Guards with
valuation-specific safety. The C16-B implementation must satisfy
all of them.

### 1. `Status='Draft'` only

Inherited from C11-A. The C11-B service already enforces this; the
policy guard is operator-facing.

### 2. Snapshot before apply

Inherited from C13-A. Capture workbook + per-row state for
`property_val.property_use_cd` to
`backend/artifacts/sync-atlas/c16-b/<run-id>/pre-snapshot.txt`
before every `--apply` invocation. Drift comparison anchored at
the C13-F marker (`89d9606b3`).

### 3. Dry-run before apply

Inherited from C13-A. `--dry-run` mandatory before `--apply`.

### 4. No autodetection of property-use category

This is the valuation-lane equivalent of the WacCd directive. The
CSV authoring tool MUST NOT:

- pattern-match property-use code prefixes (`1x` → residential,
  `2x` → commercial, etc.) and pre-set `canonical_value`;
- infer residential / commercial / industrial classification from
  observed-count distributions ("most-frequent code is probably
  the dominant land use");
- treat numeric-order proximity as semantic ("11 and 12 must be
  similar");
- carry forward decisions from other workbooks or counties;
- import a "default" property-use code table from any source other
  than an operator-supplied authoritative reference.

Every `Mapped` decision in the apply CSV must trace to a specific
operator-supplied source — either:
(a) the operator's direct knowledge of what the code means in this
    county's PACS instance, OR
(b) a documented PACS / DOR / WSDOR code table the operator has
    referenced in the row's `notes` cell.

When neither (a) nor (b) is available, the row is `Deferred` with
notes explaining what reference material is needed.

### 5. No sales-lane mutation as a side effect

This slice's CSVs MUST NOT contain rows that target any
`source_table = 'sale'` column. C13-F closed the sales lane at
100% terminal; an apply CSV that accidentally re-touches a sales
row would bump audit fields needlessly and contaminate the sales
audit trail. The C16-B parser-side check is the C11-B
duplicate-target rule; the policy guard is operator-facing CSV
authoring discipline.

## CSV Format

Reuses the C11-A grammar verbatim (no new columns):

```text
scope,source_schema,source_table,source_column,source_value,review_status,canonical_target,canonical_value,canonical_value_null,is_excluded,notes
```

### Allowed scopes for this slice

| Scope | Identity | Purpose |
|---|---|---|
| `code_value` | `(dbo, property_val, property_use_cd, <code>)` | One row per property-use code-value the operator reviews. The bulk of C16-B work. |
| `column` | `(dbo, property_val, property_use_cd)` | At most one row to update the column-row's `Notes` field, since the column is already `Mapped` with `canonical_target=PropertyUse` from C11-C. The column-row review status itself stays `Mapped` unless an explicit operator decision changes it. |

### Forbidden scopes

- Any row whose `source_table` is not `property_val`.
- Any row whose `source_column` is not `property_use_cd`.
- Cross-lane batch edits.

## Decision Rules

These are the rules the human reviewer applies when promoting each
property-use code from `NeedsReview` to a terminal status. The
tooling does not enforce them — the operator does.

| Decision | When | Required CSV cells |
|---|---|---|
| **Mapped** | Operator knows the canonical property-use meaning of this code in this county's PACS instance, with documented source. | `review_status=Mapped`, `canonical_value=<canonical-class>`, `is_excluded=false`, `notes=<source: PACS code table / DOR ref / assessor confirmation>` |
| **Excluded** | Operator decides the code is NOT a valid property-use classification (data-quality marker, deprecated code, placeholder) and downstream valuation transforms must skip it. | `review_status=Excluded`, `is_excluded=true`, `canonical_value=<exclusion-label>`, `notes=<rationale>` |
| **Deferred** | Code meaning is unclear or operator wants assessor / DOR / WSDOR table confirmation before deciding. | `review_status=Deferred`, `notes=<what reference is needed: "PACS code table not on hand" / "ambiguous between residential and mixed-use" / etc.>` |

### Canonical vocabulary (operator-defined, growing)

The `canonical_value` strings used in this slice's `Mapped` rows
form a growing operator-defined vocabulary. The C16-B run author
must:

- **Reuse** any canonical labels already in the workbook from
  prior slices (none from sales — sales never set
  `canonical_value` on the property-use column).
- **Document** each new canonical label in the row's `notes` cell
  the first time it's used in the CSV ("first use of canonical
  label `Residential` in this workbook; refers to single-family,
  multi-family, and condo aggregate per WSDOR PUC table").
- **Stay consistent** within a run — `Residential` and
  `residential` and `RES` must not all appear in the same CSV.

A future slice may formalize the canonical vocabulary into a
seed-controlled enum; this slice keeps it operator-defined and
free-form per C2 schema (`CanonicalValue` is a free-text column).

### Safe handling for unknown / mixed-use values

PACS property-use code tables vary across counties and across PACS
versions. When the operator encounters a code whose meaning is
unclear:

- **Do not guess.** Even if the code "looks like" it should mean a
  specific land use, set `review_status=Deferred` with notes
  explaining the ambiguity.
- **Do not pattern-match.** A code numerically adjacent to a known
  code is not necessarily semantically adjacent.
- **Do not infer from frequency.** A high-observed-count code is
  not necessarily the dominant use; it could be a default
  placeholder.
- **Do not infer from co-occurrence.** A property-use code that
  appears alongside specific other codes (e.g. always alongside
  agricultural land flags) is not necessarily co-classified.

The cost of a wrong `Mapped` decision is downstream valuation
mis-classification (every property in that code's set gets
mis-bucketed). The cost of `Deferred` is review delay. Defer.

### Mixed-use codes specifically

PACS often encodes mixed-use parcels with a primary code plus
secondary indicators (in other columns). The CSV in this slice is
about the primary `property_use_cd` value alone; secondary mixed-
use signals (a separate column entirely, when present) are out of
scope for this slice and may need their own future review pass.

## Data Lineage Caveat (operator-noted, 2026-04-28)

The PACS instance underlying this workbook had a **data conversion
event before 2017**. Pre-2017 sales codes are documented (in
operator memory) as potentially missing or unreliable. The same
caveat may extend to property-use codes:

- Some `property_use_cd` rows may carry their **pre-conversion**
  semantics for older properties and **post-conversion**
  semantics for newer ones, even though the SourceValue string is
  identical.
- The `ObservedCount` figures in the workbook reflect the **full
  sample population, undated**. A code with high `ObservedCount`
  may include thousands of pre-2017 records whose semantics
  differ from the current PACS code-table meaning.

### Operator response

- When deciding `Mapped`, the operator's `notes` cell must state
  whether the canonical mapping holds for **both** pre- and post-
  conversion semantics, OR document that the mapping applies only
  to post-2017 data (in which case downstream consumers need a
  date-filtered read).
- When in doubt, **Defer**.
- Future slice work could add a `valid_from_year` column to
  `SyncMappingCodeValue` to track this explicitly; for now it
  lives in `notes` text.

## Audit Expectations

### What the C16-B run produces

```text
backend/artifacts/sync-atlas/c16-b/<run-id>/
├── pre-snapshot.txt          # Hard Guard 2 snapshot
├── drift.txt                 # Drift report vs. C13-F anchor
├── valuation-review.csv      # The operator's authored review CSV
├── csv-authoring-notes.md    # Decision rationale + canonical-vocab choices
├── batch-dry-run.txt         # First dry-run output
├── batch-dry-run-verify.txt  # SQL confirming no mutation
├── batch-apply.txt           # Apply output
├── batch-verify.txt          # SQL confirming exact mutations + sales-lane preserved
├── progress-before.txt       # Dashboard before
├── progress-after.txt        # Dashboard after; NonTerminal Δ = CSV row count
└── post-snapshot.txt         # Workbook state after apply
```

None committed. `backend/artifacts/` is gitignored.

### What the workbook gets

- Per touched `SyncMappingCodeValue` row: the supplied mutation
  fields + `UpdatedAt` + `UpdatedBy` bumped.
- The `SyncMappingWorkbook` row: `UpdatedAt` and `UpdatedBy`
  bumped exactly once for the whole batch.
- Workbook `Status`: still `Draft`.
- The `property_val.property_use_cd` **column row** stays at
  `Mapped` / `CanonicalTarget=PropertyUse` — the column-level
  decision is already done. Code-value-level decisions are this
  slice's whole point.
- Every other workbook row: byte-for-byte unchanged. Sales lane
  audit timestamps from C9-C / C11-C / C13-B / C13-C / C13-D /
  C13-E / C13-F must remain intact.

## Hard Non-Goals

| Non-goal | Rationale |
|---|---|
| **Auto-fill canonical_value from PACS docs** | Re-introduces "the tool guessed" failure mode. The operator types every canonical label. |
| **Apply a PACS standard property-use code table out of the box** | Code tables vary by county and by PACS deployment. Even widely-used WSDOR / DOR PUC tables aren't safe to apply without operator confirmation. |
| **Promote individual rows from Deferred to Mapped without operator notes** | The notes field is the audit trail's why-this-decision row; cannot be optional for terminal-status promotion. |
| **Cross-county vocabulary import** | Even if Yakima or Cowlitz already mapped property-use codes, those decisions don't transfer — the codes themselves can mean different things in different counties' PACS instances. |
| **Lock the workbook on `ReadyToLock=true`** | Lock is a separate slice. C16-B is a review acceleration. |
| **Edit any non-valuation column** | Out of scope. The Improvement / Land / Neighborhood / Other lanes get their own policies. |
| **Run C8-C qualify-sales as a side effect** | Decoupled by design. Qualify reads the workbook through the C7 read model when the operator chooses. |
| **Skip the snapshot or dry-run** | Both are Hard Guards. No `--force-skip-snapshot`, no `--apply-without-dry-run`. |
| **Auto-promote the column row from Mapped to Approved** | "Approved" is a future workflow status; the column is already at `Mapped` from C11-C. No further column-row change in this slice. |

## C16-B Success Gates

A C16-B run is successful iff every gate below passes. The empty
marker commit lands only after all nine gates are green.

| Gate | Pass criterion |
|---|---|
| **Snapshot captured** | `pre-snapshot.txt` exists and contains workbook + per-row state for `property_val.property_use_cd`. |
| **Drift acknowledged** | `drift.txt` exists; every prior anchor row from C9-C through C13-F matches its expected timestamp; no new unexpected drift. |
| **Dry-run validates** | `batch-dry-run.txt` shows `exit=0`, all rows valid, planned per-status counts match operator expectation. |
| **Dry-run verify clean** | `batch-dry-run-verify.txt` shows zero mutation: workbook `UpdatedAt` unchanged from snapshot. |
| **Apply succeeds** | `batch-apply.txt` shows `exit=0`, `Outcome: Applied`, `Audit Stamp Bump: 1`, exact row count match. |
| **Apply verify exact** | `batch-verify.txt` shows the exact set of CSV-listed property-use rows mutated and nothing else. |
| **Workbook stays Draft** | `post-snapshot.txt` shows `Status=Draft`, `columns_total=200`, `code_values_total=1733`. |
| **Sales lane preserved** | All sales-lane rows from C9-C through C13-F remain byte-for-byte unchanged: `wac_cd` stays at 54/54 terminal (3 Excluded + 51 Deferred), `sl_ratio_type_cd` stays at 23/23 Deferred, original timestamps intact. |
| **Dashboard math exact** | `progress-after.txt` `property_use_cd NonTerminal` decreased by exactly the CSV row count vs `progress-before.txt`. |
| **Leak scan clean** | No matches for `TF_Pacs|SA_PASSWORD|Password=|Pwd=|SYNCATLAS_SECRET_…` under `backend/artifacts/sync-atlas/c16-b/`. |

## C16-B Marker

If all gates pass:

```bash
git commit --allow-empty -m \
  "test(sync): Slice C16-B — apply targeted valuation review CSV. The goblin labeled property-use boxes without inventing land uses."
```

If any gate fails: roll back is automatic for atomicity. Iterate on
the CSV and re-run.

## Operator Workflow (concrete, post-C16-A)

```text
1. Run progress dashboard:
     sync-atlas --mapping-review-progress --workbook-id <id>
   Confirms property_val.property_use_cd is at 0/62 terminal.

2. Pull NeedsReview candidates ordered by ObservedCount DESC:
     SELECT v.SourceValue, v.ObservedCount
     FROM "SyncMappingColumns" c
     JOIN "SyncMappingCodeValues" v ON ...
     WHERE c.SourceTable='property_val' AND c.SourceColumn='property_use_cd'
       AND v.ReviewStatus='NeedsReview'
     ORDER BY v.ObservedCount DESC NULLS LAST
     LIMIT 30;
   Note: these counts are undated and include pre-2017 conversion records;
   see the Data Lineage Caveat above before treating ObservedCount as
   a reliable signal.

3. Capture pre-snapshot:
     ...workbook + property_use_cd per-row state to pre-snapshot.txt

4. Capture drift report against C13-F anchor (89d9606b3):
     ...sales-lane rows must match expected timestamps; document any
     unexpected drift before proceeding.

5. Author CSV in a real editor (not a script):
     # one row per property-use code; review_status decided per row;
     # canonical_value only when operator has documented source;
     # notes field documents the source for every Mapped row;
     # codes whose meaning is unclear or whose pre-2017 semantics
     # differ from post-2017 → Deferred.

6. Dry-run:
     sync-atlas --batch-edit-mapping-workbook --workbook-id <id> \
                --input-csv valuation-review.csv --dry-run

7. Read dry-run output. Iterate on CSV if counts don't match
   expectation.

8. Apply:
     ...same command, --apply

9. Verify exact mutations (batch-verify SQL) + sales-lane preserved.

10. Run progress dashboard again; confirm property_use_cd NonTerminal
    dropped by exactly the CSV row count.

11. Capture post-snapshot.

12. Empty marker commit (only if all 10 success gates green).
```

## What This Document Is Not

- **Not the CSV itself.** Operator authors `valuation-review.csv`
  in `backend/artifacts/sync-atlas/c16-b/<run-id>/` and the file
  is never committed.
- **Not a script.** No automation generates the per-row decisions.
- **Not a property-use code table.** The canonical vocabulary
  (`Residential`, `Commercial`, `Industrial`, `Agricultural`, etc.)
  is operator-defined per workbook, not seeded from a global
  enum. A future slice may formalize the vocabulary; this slice
  keeps it operator-typed.
- **Not a transform consumer.** Valuation transforms read the
  workbook through the C7 read model; this slice does not change
  that contract.
- **Not a license to relax the WacCd directive — even though
  this lane has different semantics.** The valuation analog is
  "infer residential vs. commercial from prefix or frequency" —
  which is just as forbidden as the WAC pattern sweep was.
- **Not a license to forget the 2017 data conversion.** Every
  high-ObservedCount property-use code may include thousands of
  records whose semantics predate the current PACS code table.
  When the operator can't document that the canonical mapping
  holds for both pre- and post-2017 semantics, the row stays
  Deferred.
