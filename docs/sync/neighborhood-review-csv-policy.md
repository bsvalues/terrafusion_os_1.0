# Neighborhood Review CSV Policy

**Slice:** C20-A (docs-only — defines the contract for C20-B
implementation: an operator-authored CSV review of the single
Neighborhood-lane column, fed through the C11-B batch edit CLI).
**Lifecycle layer:** neighborhood-classification readiness — the
operator-decision layer that captures how PACS neighborhood
descriptions map (or don't map) to a canonical neighborhood
vocabulary the C7+ valuation transforms can consume.
**Status:** policy locked; CSV authoring + C20-B live application
deferred to subsequent slice. **Includes a documented grammar
limitation that affects this column specifically.**

## Provenance

- C2 schema: `SyncMappingWorkbook` / `SyncMappingColumn` /
  `SyncMappingCodeValue`. Audit fields auto-populated.
- C13-A through C13-F sales sweep, C16-A through C16-D valuation
  sweep, C17-A through C17-D + C17-A2 improvement sweep, C19-A +
  C19-B land sweep — established the snapshot/drift/dry-run/apply/
  progress-after pattern.
- **C17-A2 amendment is the closest precedent**: established that
  human-readable labels (not numeric codes) still take Defer-by-
  default until per-row context is operator-confirmed. Same
  reasoning extends to neighborhood descriptions.
- 2017 conversion caveat — applies to neighborhood descriptions
  the same way it applies to every other lane.
- Memory-flagged WacCd directive — the analog at this layer is
  "infer neighborhood class from text content (e.g. word
  'Industrial' → industrial use)." Forbidden the same way
  pattern-matching WAC statute prefixes was forbidden.
- Live workbook state at C19-B (`7243f7635`):
  | Metric | Value |
  |---|---|
  | Status | `Draft` |
  | Columns | 200 |
  | Code values | 1,733 |
  | Terminal | 403 |
  | Sales / Valuation / Improvement / Land lanes | 100% |
  | **Neighborhood** | 0% (94 code-values across 1 column) |
  | Other | 0% |

## Purpose

Capture, review, and apply the operator's per-row decisions for
the single Neighborhood-lane column in the workbook —
`dbo.neighborhood.nbhd_descr` — making the workbook capable of
expressing operator-confirmed neighborhood semantics for the C7+
valuation/comp transforms that will eventually consume it.

This column is **not** what a "code" column normally looks like.
The values are operator-authored free-text descriptions of
neighborhood geographies, ranging from short labels like
`Kellogg & 5th` (13 chars) to dense paragraphs of 269 chars.
Many values include embedded commas, periods, and `--` delimiters
(e.g. `Horn Rapids Community -- Golf Community South of Hwy 240
and NW of Richland Airport.`). The dominant `SourceValue` is the
**empty string** with 19,922 observations — most parcels have no
neighborhood description.

## Scope

### In scope

- `dbo.neighborhood.nbhd_descr` — 94 distinct SourceValue strings
  (93 non-empty + 1 empty-string row).

### Out of scope (deliberately deferred)

The 10 other `neighborhood`-table columns currently in the **Other**
lane:

- `comments` (5 codes), `nbhd_comment`, `eco_comment`,
  `gov_comment`, `phys_comment`, `soc_comment` — comment fields,
  free-text-policy candidates.
- `changed_flag`, `sys_flag`, `life_cycle`, `reappraisal_status`
  — flag/state fields with very few distinct values; per-record
  state, not classification.

Each deserves review eventually but with the appropriate policy
shape (free-text-field policy or per-record-flag policy). C20-A
stays narrow.

### Forbidden in this slice

- Sales / Valuation / Improvement / Land / Other lane edits.
  Those four lanes (C13-F / C16-D / C17-D / C19-B) are closed at
  100% and their audit trails must remain byte-for-byte unchanged
  across every C20-* slice.
- Lock / qualify-sales / transform-write side effects.

## Hard Guards

The five guards below extend C11-A's batch-edit Hard Guards with
neighborhood-specific safety. The C20-B implementation must
satisfy all of them.

### 1. `Status='Draft'` only

Inherited.

### 2. Snapshot before apply

Inherited from C13-A.

### 3. Dry-run before apply

Inherited from C13-A.

### 4. No autodetection of neighborhood semantics from text content

The Neighborhood-lane analog of the WacCd directive. The CSV
authoring tool / operator MUST NOT:

- pattern-match keywords inside the description text and pre-set
  `canonical_value` (e.g. assume `"Industrial Park"` description
  → canonical `Industrial`). The text is operator-authored
  free-form; word presence does not imply classification under a
  controlled vocabulary.
- treat description length as semantic ("longer descriptions are
  more important neighborhoods").
- carry forward decisions from other workbooks / counties — even
  more strongly than in prior lanes, because neighborhood names
  are intrinsically county-specific.
- normalize the descriptions in place. The stored `SourceValue`
  must remain byte-for-byte identical to what the operator
  originally authored, including idiosyncratic capitalization
  (`FIREPLACE` → see C17-A2), abbreviations (`Hwy`, `Blvd`), and
  embedded delimiters (` -- `). The C12 trim-on-both-sides
  matcher only normalizes leading/trailing whitespace; the
  policy guard is the C11-A "stored value preserved" rule
  carried forward.

Every `Mapped` decision must trace to operator confirmation that
the description's geographic intent maps to a specific canonical
neighborhood label, with notes referencing the source (parcel
boundary set, GIS layer, assessor's neighborhood-definition
document, etc.).

When the operator can't confirm the geography, the row is
`Deferred` with notes calling that ambiguity out.

### 5. No prior-lane mutation

This slice's CSVs MUST NOT contain rows targeting any
`source_table` other than `neighborhood`, AND must only touch
`nbhd_descr`. The C11-B parser-side duplicate-target rule catches
one class of error; the policy guard is operator-facing CSV-
authoring discipline.

## Decision rules

### `dbo.neighborhood.nbhd_descr` (94 codes)

**Semantic:** operator-authored description of a neighborhood
geography — frequently a "short-name -- long-description" pattern
or a road-segment / landmark-bounded geographic extent.

**Canonical vocabulary candidates** (operator-typed, growing):
this column is the **most operator-judgment-dependent** of any
reviewed so far because the values are descriptions, not codes.
Possible canonical mappings:

- A normalized neighborhood-id (e.g. `BENTON-N-001`,
  `BENTON-N-002`) that abstracts away the descriptive text.
- A geographic-class label (e.g. `Residential-South-Richland`,
  `Industrial-Hanford-Corridor`, `Agricultural-Prosser-Outer`)
  that groups multiple per-segment descriptions into a coarser
  bucket.
- Pass-through (the description IS the canonical name). Operator-
  decided per row whether the description is canonical-clean
  enough to use as-is.

**Decision policy:** Deferred is the default for this column even
more strongly than at the improvement Tier 3 attribute level.
Promotion to Mapped requires:

- operator confirmation of which canonical scheme they're
  applying (neighborhood-id vs. geographic-class vs. pass-through),
- a documented source for the geographic intent (parcel-boundary
  GIS layer, neighborhood-definition document), and
- explicit pre/post-2017 conversion alignment in `notes`.

When in doubt, **defer**.

### Common patterns observed in the live data (informational)

Neither pattern below justifies auto-classification. They're
recorded so the operator knows the data shape, not as inference
hooks:

| Pattern | Example |
|---|---|
| Short-name + long-description with `--` separator | `Antenne Site -- Antenne Site within Benton County` |
| Road-segment / landmark bounds | `Canal Drive from Coulumbia Center Blvd. to the NE sec line of 3299` |
| Geographic extent | `geographic extent` (literally) |
| Map / atlas reference | `As defined by KID map of Vista Field` |
| City-relative | `Parcels lying outside of Prosser City limits to the West` |
| Empty string | (19,922 obs — dominant default, parcels with no description) |

The operator may use these patterns as a structural authoring
hint when deciding whether to set `canonical_value`. They are
not auto-classification rules.

## CSV Format

Reuses the C11-A grammar verbatim:

```text
scope,source_schema,source_table,source_column,source_value,review_status,canonical_target,canonical_value,canonical_value_null,is_excluded,notes
```

### RFC 4180 quoting requirement (per C17-A2)

`nbhd_descr` values frequently contain commas, periods, and other
RFC 4180-significant characters. Authoring-side requirement:
every code-value row's `source_value` cell MUST be `"..."`-wrapped
when it contains a comma or a double-quote. The C11-B
`BatchEditCsvParser` handles standard RFC 4180 quoting cleanly;
the SQL-generation pattern from C17-D applies:

```sql
CASE WHEN v."SourceValue" LIKE '%,%' OR v."SourceValue" LIKE '%"%'
     THEN '"' || REPLACE(v."SourceValue", '"', '""') || '"'
     ELSE v."SourceValue" END
```

### Empty-string SourceValue limitation (C20 specific)

**One row in this column has `SourceValue = ''` (the empty
string), with ObservedCount = 19,922.** This row is structurally
unreachable through the current batch-edit grammar:

- `scope=code_value` requires `source_value` to be non-empty
  (parser rejection: `"source_value is required when
  scope=code_value"`).
- `scope=column` requires `source_value` to be empty AND targets
  the column-row, not an individual code-value row.

There is no current CSV grammar that targets a code-value row
whose stored SourceValue is the empty string. C20-B can therefore
batch-edit at most **93** of the 94 distinct values; the 94th
(empty-string) row stays NeedsReview after C20-B closes.

### Future slice options for the empty-string row

Three reasonable paths (none promoted in this slice):

1. **Single-row C9-B edit pass-through** — extend the C9-B
   single-row CLI to accept `--source-value ""` (or a sentinel
   like `--source-value-empty`) so the empty-string row can be
   targeted explicitly, one-shot. Smallest change.
2. **Grammar extension** — extend the C11-A CSV grammar to
   support an explicit `source_value_empty=true` column,
   parallel to `canonical_value_null=true`. Cleaner for operators
   but a larger code change.
3. **Domain decision: leave the empty-string row at NeedsReview
   permanently** — argue that a parcel with no neighborhood
   description is not a reviewable category and the row is
   therefore a no-op for downstream consumers. Cheapest; defers
   the decision indefinitely.

The C20-A policy itself does not pick. C20-B will close as much
of this column as the grammar allows (93/94) and document the
remaining empty-string row in its post-snapshot.

### Allowed scopes for this slice

| Scope | Identity | Purpose |
|---|---|---|
| `code_value` | `(dbo, neighborhood, nbhd_descr, <description>)` | One row per non-empty distinct description in the workbook (93 reachable rows). |
| `column` | `(dbo, neighborhood, nbhd_descr)` | At most one row to set the column-row's `canonical_target` (the column has none set today) and/or update its `Notes`. |

### Forbidden scopes

- Any row whose `source_table` is not `neighborhood`.
- Any row whose `source_column` is not `nbhd_descr`.
- Cross-lane batch edits.

## Pre-2017 conversion caveat

Same caveat as every other lane: pre-conversion neighborhood
descriptions may have been authored under different definitional
conventions than post-conversion ones. The 19,922 observations on
the empty-string row may include both pre-conversion default
records (the column wasn't populated yet) and post-conversion
"no neighborhood description authored" records. The operator
documents in `notes` whether each canonical mapping holds for
both eras, or defers.

## Audit Expectations

### What the C20-B run produces

```text
backend/artifacts/sync-atlas/c20-b/<run-id>/
├── pre-snapshot.txt
├── drift.txt
├── neighborhood-review.csv
├── csv-authoring-notes.md
├── batch-dry-run.txt
├── batch-dry-run-verify.txt
├── batch-apply.txt
├── batch-verify.txt
├── progress-before.txt
├── progress-after.txt
└── post-snapshot.txt
```

None committed. `backend/artifacts/` is gitignored.

### What the workbook gets

- Per touched `SyncMappingCodeValue` row: the supplied mutation
  fields + `UpdatedAt` + `UpdatedBy` bumped.
- The `SyncMappingWorkbook` row: `UpdatedAt` and `UpdatedBy`
  bumped exactly once per batch.
- Workbook `Status`: still `Draft`.
- Sales / Valuation / Improvement / Land lanes: byte-for-byte
  unchanged across every C20-* slice. C9-C through C19-B anchor
  timestamps preserved.

## Hard Non-Goals

| Non-goal | Rationale |
|---|---|
| **Auto-classify descriptions by keyword content** | Re-introduces "the tool guessed" failure mode. |
| **Normalize descriptions in place** | C11-A "stored value preserved" rule. |
| **Cross-county vocabulary import** | Neighborhood names are intrinsically county-specific. |
| **Treat the empty-string row as the column row** | They are different entities at the C2 schema level; an empty-string code-value row is a code-value row. |
| **Promote rows from Deferred to Mapped without operator notes referencing geography source** | Notes is the audit trail's why-this-decision row. |
| **Lock the workbook on lane-completion** | Lock is a separate slice. |
| **Edit the 10 neighborhood-table Other-lane columns** | Out of scope. |
| **Skip snapshot or dry-run** | Both are Hard Guards. |
| **Promote the unreachable empty-string row in C20-B** | Grammar limitation; needs C9-B extension or grammar extension. |

## C20-B Success Gates

A C20-B run is successful iff every gate below passes. The empty
marker commit lands only after all gates are green.

| Gate | Pass criterion |
|---|---|
| **Snapshot captured** | `pre-snapshot.txt` exists. |
| **Drift acknowledged** | `drift.txt` exists; sales / valuation / improvement / land anchors match expected timestamps. |
| **Dry-run validates** | `batch-dry-run.txt` exit 0, all 93 reachable rows valid. |
| **Dry-run verify clean** | `batch-dry-run-verify.txt` shows zero mutation. |
| **Apply succeeds** | `batch-apply.txt` exit 0, Outcome=Applied, Audit Stamp Bump=1. |
| **Apply verify exact** | `batch-verify.txt` shows the exact 93 CSV-listed rows mutated. |
| **Workbook stays Draft** | `post-snapshot.txt` shows Status=Draft, columns/code-values unchanged. |
| **Sales lane preserved** | C13-F anchor (77/77) intact. |
| **Valuation lane preserved** | C16-D anchor (62/62) intact. |
| **Improvement lane preserved** | C17-D anchor (175/175) intact. |
| **Land lane preserved** | C19-B anchor (89/89) intact. |
| **Neighborhood-only mutation** | Every mutated row has `source_table='neighborhood'` AND `source_column='nbhd_descr'`. |
| **Empty-string row stays NeedsReview** | The 19,922-observation row whose SourceValue is `''` remains `NeedsReview` after apply. C20-B's progress-after report should explicitly note `nbhd_descr` at 93/94 = 98.9%. |
| **Dashboard math exact** | Neighborhood-lane NonTerminal decreased by exactly 93 vs progress-before. |
| **Leak scan clean** | No matches under `c20-b/`. |

## Operator Workflow

```text
1. Run progress dashboard:
     sync-atlas --mapping-review-progress --workbook-id <id>
   Confirm Neighborhood lane is at 0/94 terminal and prior lanes
   are 77/77 / 62/62 / 175/175 / 89/89.

2. Pull NeedsReview candidates with non-empty SourceValue
   ordered by ObservedCount DESC. Note that the dominant value
   is the empty string with 19,922 obs which the C11-A grammar
   cannot target — exclude it from the CSV authoring pool.

3. Capture pre-snapshot + drift report.

4. Author CSV in a real editor with RFC 4180 quoting:
     # one row per non-empty distinct description;
     # canonical_value only when operator confirms the geographic
     # intent maps to a canonical scheme;
     # notes field documents the source (GIS layer, assessor doc,
     # parcel-boundary reference) and pre/post-2017 alignment;
     # source_value MUST be RFC-4180-quoted when it contains a
     # comma or quote.

5. Dry-run + verify zero mutation.

6. Apply + verify exact mutations + sales/valuation/improvement/
   land lanes preserved.

7. Run progress dashboard again; confirm Neighborhood-lane
   NonTerminal dropped by exactly 93 (empty-string row stays).

8. Capture post-snapshot. Record explicitly: "1 row remains
   NeedsReview — the empty-string SourceValue, unreachable
   through current grammar; future slice will close."

9. Empty marker commit (only if all gates green).
```

## What This Document Is Not

- **Not the CSV.** Operators author CSVs in
  `backend/artifacts/sync-atlas/c20-b/<run-id>/neighborhood-review.csv`;
  files never committed.
- **Not a script.** No automation infers neighborhood semantics
  from description text.
- **Not a geographic-information system.** The policy points at
  external GIS / parcel-boundary references but does not
  reproduce or query them.
- **Not a transform consumer.** Neighborhood transforms read the
  workbook through the C7 read model.
- **Not a license to relax the WacCd directive.** "Don't infer
  neighborhood class from text keywords" is just as binding as
  "don't infer WAC exclusion from statute prefix."
- **Not a license to forget the 2017 conversion caveat.** Same
  caveat as every other lane.
- **Not a fix for the empty-string-SourceValue grammar
  limitation.** That's a future slice, not this one.
- **Not coverage of the 10 neighborhood-table Other-lane
  columns.** Those are explicitly future work.

---

## Amendment — 2026-04-28: hood_cd is the canonical neighborhood identifier (workbook-gap-discovered)

This amendment is added retroactively after an operator domain
note received between the C20-A merge and the planned C20-B run.
The C20-A policy (above) treated `dbo.neighborhood.nbhd_descr` as
the primary neighborhood-review target. That treatment is
**incomplete**: it covers the dictionary side of the relation
(neighborhood definitions) but not the membership side
(per-parcel neighborhood assignment).

### Domain truth (operator-supplied)

> Neighborhood is represented by `hood_cd`.

In Benton County's PACS deployment:

- **`dbo.property_val.hood_cd`** is the canonical per-parcel
  neighborhood-membership code. Each parcel-record carries a
  `hood_cd` value that names which neighborhood it belongs to.
  This is the column the calculator (`CostForgeController`,
  `PacsValuation.NeighborhoodCode`), the forge sales-comp
  filter, and the `PacsCanonicalizer` already use as the source
  of truth — see prior commits `27bb5f7eb`, `67e873600`,
  `6f76ae629`, `1553f2239` from April 3, 2026.
- **`dbo.neighborhood.nbhd_descr`** is the description text
  for each neighborhood definition. It is dictionary-side
  metadata: which `hood_cd` value gets which human-readable
  description. Useful for display, auxiliary for classification.
- **A historical typo `nbhd_cd` is documented** in
  `SyncController.cs` line 298 (`"reads property_val.hood_cd
  (not the earlier typo 'nbhd_cd')"`); the canonical column is
  `hood_cd`, not `nbhd_cd`, on the `property_val` table.

### Workbook gap (post-C20-A discovery)

Querying the live Mapping Workbook (`a767c8a2-…`) at C20-A
post-merge state:

- `dbo.property_val.hood_cd`: **not present** in any
  `SyncMappingColumn` row.
- `dbo.property.hood_cd`: **not present** in any
  `SyncMappingColumn` row.
- The C3 profile loader picked up 46 columns from `property_val`
  and zero columns from `property` matching `hood_cd` / `hood`.
  The actual canonical neighborhood column was excluded entirely.

The cause is most likely the C3 loader's column-selection
heuristic (the loader includes columns where review value is
inferable from observed-count distributions or column-name
patterns; `hood_cd` is always populated, so it may have been
filtered as "no review needed" or excluded by some other rule).
The cause itself is out of scope for this amendment.

### What this gap means for C20-B

The C20-A policy as written would close 93 of 94 `nbhd_descr`
rows (per the empty-string grammar limitation). That work is
**still meaningful** — it terminalizes the dictionary side of
the neighborhood relation — but it does **not** unblock the
sales-comp / forge / calculator consumers. Those consumers read
`hood_cd`, not `nbhd_descr`. Until `hood_cd` is added to the
workbook AND reviewed, the workbook's "Neighborhood lane = 100%
terminal" milestone would be a misnomer at the sales-comp-
consumption layer.

### Re-scoped C20 slice plan

The following replaces the recommended pacing in the C20-A doc
above:

1. **C20-A2 (this amendment)** — record domain truth and
   workbook gap. Docs only.
2. **C20-B (deferred / re-scoped)** — choose ONE of:
   - **Option B-1 (dictionary-only review)**: run the planned
     93-row `nbhd_descr` batch, with each row's `notes` cell
     amended to read *"description-side review only; canonical
     neighborhood membership lives on `property_val.hood_cd`
     which is not in this workbook (pending C20-D)"*. Lane shows
     93/94 terminal afterward. Acceptable as long as future
     consumers don't mistake this for membership review.
   - **Option B-2 (block until hood_cd is added)**: defer
     C20-B entirely until `hood_cd` is added to the workbook
     (C20-D below). Workbook stays at 0/94 terminal on
     Neighborhood lane.
   - **Option B-3 (skip nbhd_descr permanently)**: if the
     operator decides nbhd_descr is purely operator-authored
     descriptive text with no canonical-vocabulary value, mark
     the entire column as "review-not-applicable" via a future
     mechanism (no current grammar exists for this).
   This amendment does **not** pick. The choice is operator-
   driven and depends on whether dictionary-side review has
   downstream value for any consumer.
3. **C20-C — add `hood_cd` to the workbook** (new). Either:
   - Extend the C3 loader to include `hood_cd` (requires loader
     code change, lane-classification rule, and a migration to
     re-profile + insert the column row + its code-values), OR
   - One-shot SQL insert of the `SyncMappingColumn` row for
     `(dbo, property_val, hood_cd, lane='Neighborhood',
     canonical_target='Neighborhood')` plus its
     `SyncMappingCodeValue` rows pulled from a fresh PACS
     `SELECT DISTINCT hood_cd, COUNT(*) FROM property_val …`.
     Smaller blast radius but bypasses C3's normal flow.
   This is a separate slice; needs its own contract.
4. **C20-D — review `hood_cd` codes** once they're in the
   workbook. This is the actual neighborhood-membership review
   that unblocks downstream consumers.

### Hard updates to the C20-A policy text above

The policy text remains authoritative for `nbhd_descr` review
shape (free-text, RFC 4180, Defer-by-default), but every
reference to "neighborhood-classification readiness" or
"unblocks the C7+ valuation transforms" should be read in light
of this amendment: until `hood_cd` is added and reviewed,
**`nbhd_descr` review alone is dictionary metadata, not
classification readiness.**

### Already-applied retroactive readings

- **C20-A's "Purpose" section** (above) overstates the value of
  `nbhd_descr` review for sales-comp consumers. The amendment
  re-frames it: dictionary-side only.
- **C20-A's success-gate "Lane preserved" math** was correct in
  isolation. After this amendment, `Neighborhood lane = 100%
  terminal` means *the dictionary column is fully decided*, not
  *neighborhood-membership review is complete*.
- **No prior workbook rows are wrong.** `nbhd_descr`'s 94 rows
  are still legitimate dictionary-side review targets. If C20-B
  Option B-1 runs, those rows still get Defer-by-default
  treatment — correctly.

### What this amendment changes

- Adds the `hood_cd` domain truth to the policy memory.
- Documents the workbook gap (no `hood_cd` column present).
- Re-scopes C20-B as conditional / re-numbers the C20 slice
  series to include C20-C (loader extension) and C20-D
  (membership review).
- Re-frames `nbhd_descr` review as dictionary-side, not
  classification-side.

### What this amendment does not change

- The `nbhd_descr` Hard Guards (Status='Draft', county scope,
  snapshot/dry-run, no autodetection from text content, no
  prior-lane mutation).
- The pre-2017 conversion caveat.
- The empty-string-SourceValue grammar limitation.
- Sales / Valuation / Improvement / Land lane preservation.
- The 403 prior terminal rows in the workbook (1 Excluded
  anchor + 402 Deferred rows from C9-C through C19-B). All
  unchanged.

### What this amendment is

A docs-only domain memory record. No code changes. No CSV
authoring. No row mutations. No C3-loader changes.
