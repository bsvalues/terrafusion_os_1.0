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
