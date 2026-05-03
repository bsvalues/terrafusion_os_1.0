# Land Review CSV Policy

**Slice:** C19-A (docs-only — defines the contract for C19-B+
implementation: operator-authored CSVs of land-classification
decisions across the two Land-lane columns currently in the
workbook, fed through the C11-B batch edit CLI).
**Lifecycle layer:** land-classification readiness — the
operator-decision layer that turns PACS land-use and soil-quality
codes into a canonical vocabulary the C7+ valuation transforms
can consume. Land classification has direct legal implications
(current-use / open-space taxation under RCW 84.34) so the
Defer-by-default posture is even more important here than in
prior lanes.
**Status:** policy locked; CSV authoring + C19-B+ live application
deferred to subsequent slices.

## Provenance

- C2 schema: `SyncMappingWorkbook` / `SyncMappingColumn` /
  `SyncMappingCodeValue`. Audit fields auto-populated.
- C13-A through C13-F sales-lane sweep — established the
  snapshot/drift/dry-run/apply/progress-after pattern.
- C16-A through C16-D valuation-lane sweep — established the
  per-numeric-code-column policy shape.
- C17-A → C17-D improvement-lane sweep — established the
  multi-column policy shape with tier-aware decision rules.
- C17-A2 amendment — established that "human-readable label"
  values are still Defer-by-default until attribute context is
  available; same principle applies to soil mnemonics here.
- 2017 conversion caveat (recorded in the sales-policy and
  improvement-policy amendments) — applies to land codes the
  same way it applies to sales / valuation / improvement codes.
- C12 trim-on-both-sides matcher (`MappingSourceValueMatcher`) —
  required because both Land columns store char(10)-padded
  values (`"NONE      "`, `"DRAG1     "`, etc.). Operators type
  the natural unpadded form; C12 makes the match cleanly.
- Memory-flagged WacCd directive — the Land-lane analog is
  "infer soil quality or land-use from mnemonic prefix" (e.g.
  `DR*` = Dryland, `IR*` = Irrigated). **Forbidden** the same way
  pattern-matching WAC statute prefixes was forbidden, regardless
  of how true the pattern looks. Operator confirms each row.
- Live workbook state at C17-A2 (`3207608d6`):
  | Metric | Value |
  |---|---|
  | Status | `Draft` |
  | Columns | 200 |
  | Code values | 1,733 |
  | Terminal | 314 (3 Excluded + 311 Deferred) |
  | Sales lane | 100% |
  | Valuation lane | 100% |
  | Improvement lane | 100% |
  | **Land lane** | 0% (89 code-values across 2 columns) |
  | Neighborhood | 0% |
  | Other | 0% |

## Purpose

Capture, review, and apply the operator's per-row decisions for
the two columns currently classified into the Land lane in this
workbook:

| Source | Codes | Distinct nature |
|---|---:|---|
| `dbo.land_detail.primary_use_cd` | 54 | Numeric primary land-use classification (parallels `property_val.property_use_cd` but for land segments specifically) |
| `dbo.land_detail.land_soil_code` | 35 | char(10)-padded mnemonic soil / land-use codes used for current-use valuation under RCW 84.34. Examples: `DRAG1`, `IRAG2`, `DRPA1`, `RHS`, `NONE`, `WASTE`, `SITE1` |

Total: **2 columns / 89 code-values.**

Land classification carries legal weight: a parcel coded for
current-use ag (`DRAG1` / `IRAG1` / etc.) under RCW 84.34 is
legally entitled to reduced assessment as long as it qualifies.
Wrong canonical mappings affect both citizen tax bills and
county compliance with state tax-relief statutes. Defer-by-
default is even more important here than in prior lanes.

## Scope

### In scope

- `dbo.land_detail.primary_use_cd` (54 NeedsReview codes)
- `dbo.land_detail.land_soil_code` (35 NeedsReview codes)

### Out of scope (deliberately deferred)

The 27 other `land_*` columns currently in the **Other** lane are
NOT covered by this slice. They include:

- **More numeric / mnemonic code columns** that arguably belong
  in Land lane: `land_class_code` (12 codes), `land_type_cd` (12),
  `ag_use_cd` (1), `ag_apply` (2), `ag_val_source` (2),
  `mkt_val_source` (2), `prev_st_land_type_cd` (1),
  `late_ag_apply` (1), `new_ag` (1). Lane-reclassification slice
  needed before they're touched.
- **Free-text fields:** `land_seg_desc` (41 codes — but
  description text, not a coded vocabulary), `land_seg_comment`,
  `flat_value_comment`. Need free-text-field policy.
- **Override / numeric-override fields:**
  `eff_size_acres_override`, `new_ag_prev_val_override`,
  `recording_number`, `application_number`. Per-record numeric
  overrides, not classification.
- **Identifier / boolean fields:** `ref_id1`, `land_seg_homesite`,
  `land_seg_sl_lock`. Per-record flags.

Each of those out-of-scope columns deserves review eventually but
needs the right policy shape (Other-lane / free-text / lane-
reclassification) before any of them gets touched.

### Forbidden in this slice

- Sales / Valuation / Improvement / Neighborhood / Other lane
  edits. Sales (C13-F) + Valuation (C16-D) + Improvement (C17-D)
  are closed at 100%; their audit trails must remain byte-for-
  byte unchanged across every C19-* slice.
- Lock / qualify-sales / transform-write side effects.
- Lane reclassification of any column (a separate slice's job).

## Hard Guards

The five guards below extend the C11-A batch edit Hard Guards with
land-specific safety. C19-B+ implementations must satisfy all of
them.

### 1. `Status='Draft'` only

Inherited from C11-A.

### 2. Snapshot before apply

Inherited from C13-A. Capture workbook + per-row state for both
Land columns to
`backend/artifacts/sync-atlas/c19-<letter>/<run-id>/pre-snapshot.txt`
before every `--apply`.

### 3. Dry-run before apply

Inherited from C13-A.

### 4. No autodetection of land classification

The land-lane analog of the WacCd directive. The CSV authoring
tool / operator MUST NOT:

- pattern-match soil-code prefixes (`DR*` = Dryland,
  `IR*` = Irrigated, `RC*` = Range-Class, `WC*` = Water-Class,
  etc.) and pre-set `canonical_value`. Even if the prefix
  convention is documented in WSDOR / DOR materials, individual
  county PACS instances can deviate.
- infer use-class from observed-count distributions. `NONE`
  appears 7,702 times in this workbook (the dominant default
  for land segments without an active current-use designation)
  but that does NOT mean the canonical mapping is "no current
  use applicable" — it might also mean "code wasn't entered" or
  "pre-conversion default" (see 2017 caveat below).
- treat numeric-order proximity as semantic on `primary_use_cd`
  (e.g. assume "code 11 and code 12 are related"). Same lesson
  as Valuation.
- carry forward classification decisions from other workbooks /
  other counties — Benton's land-classification choices may
  legitimately differ from Yakima's.
- conflate `primary_use_cd` and `land_soil_code` semantics.
  These are two different classification axes:
  - `primary_use_cd` says **what is on the land** (residential,
    commercial, agricultural, range, etc.)
  - `land_soil_code` says **how the land is classified for
    current-use valuation purposes** (typically tied to RCW
    84.34 and WSDOR ag-class tables: `DRAG1` = dryland-ag-class-
    1, `IRAG2` = irrigated-ag-class-2, etc.) — these are
    quality-stratified codes that drive per-acre value tables.

Every `Mapped` decision must trace to either:
(a) the operator's direct knowledge of what the code means in
    this county's PACS instance, OR
(b) a documented PACS / WSDOR / DOR / RCW 84.34 reference for
    that specific table+column, named in the row's `notes` cell.

When neither is available, the row is `Deferred` with notes
explaining what reference material is needed.

### 5. No prior-lane mutation

This slice's CSVs MUST NOT contain rows that target any
`source_table` other than `land_detail`, AND must only touch the
**two** in-scope columns (not other `land_detail` columns that
happen to live in the Other lane). The C11-B parser-side
duplicate-target rule catches one class of error; the policy
guard is operator-facing CSV-authoring discipline.

## Per-column decision rules

### `dbo.land_detail.primary_use_cd` (54 codes)

**Semantic:** numeric primary land-use classification at the
land segment level. Parallels `property_val.property_use_cd` but
for `land_detail` rows specifically. Examples in many PACS
deployments include codes for residential lots, commercial lots,
agricultural acreage, range, forest, vacant, etc.

**Canonical vocabulary candidates** (operator-typed, growing):
`Residential`, `Commercial`, `Agricultural`, `Range`, `Forest`,
`Vacant`, `Industrial`, `Recreational`, `Conservation`, etc.

**Decision policy:** Deferred unless the operator has the PACS
land-use code table in hand AND the table specifies the same
code meaning for both pre-conversion and post-conversion records.
Same posture as Valuation property-use codes.

### `dbo.land_detail.land_soil_code` (35 codes)

**Semantic:** char(10)-padded mnemonic codes used for current-
use valuation under **RCW 84.34** (Open Space Taxation Act) and
the WSDOR / DOR per-acre soil-class value tables. These codes
typically encode:

- a **use type** (Dryland-AG vs Irrigated-AG vs Range-class vs
  Pasture vs Wasteland vs Site, etc.), AND
- a **quality class** within that use (1, 2, 3, 4, 5 — where
  class 1 is highest quality / value-per-acre).

Examples from the live workbook:

- `DRAG1`–`DRAG5`: dryland agriculture classes 1 through 5
  (likely)
- `IRAG1`–`IRAG3`: irrigated agriculture classes
- `DRPA1`–`DRPA3`: dryland pasture classes
- `IRPA1`–`IRPA3`: irrigated pasture classes
- `RCIA1`–`RCIA3`: range-class-IA (?) classes
- `WCIA1`, `RMIA1`, `WCRP`, `RMDRP`, `RCIP`: other variants
- `RANGE` (99 obs), `RHS` (87 obs — possibly residential home
  site land carve-out), `WASTE`, `SITE1`, `OSOS`, `BASE$`,
  `DRPNV` (dryland-pasture-non-valid?), `NONE` (7,702 obs —
  dominant default for non-current-use segments)

**These are operator-decoded mnemonics, not arbitrary codes.**
The prefix conventions look obvious; that does not make
operator-side pattern-matching safe. The actual semantic
meaning of each mnemonic in this county's PACS instance, AND
its post-2017 conversion meaning, must be documented before
promotion to Mapped.

**Canonical vocabulary candidates** (operator-typed, growing):
the canonical labels here likely encode **use-and-class**
together to mirror the WSDOR per-acre table structure (e.g.
`DrylandAgClass1`, `IrrigatedAgClass2`, `Range`, `Pasture-Dry-1`,
`Wasteland`, `HomeSite`, `NoCurrentUse` for `NONE`). Operator
defines the exact strings.

**Decision policy:** Deferred is the default at this column even
more strongly than at `primary_use_cd`. RCW 84.34 misclassification
has citizen-impact and county-compliance consequences. Promotion
to Mapped requires:

- operator confirmation of the WSDOR / DOR table mapping for
  this county, AND
- explicit pre/post-2017 conversion alignment in the `notes`
  cell, AND
- canonical_value chosen from a vocabulary that mirrors the
  per-acre value-table structure (so downstream consumers can
  read the workbook → look up per-acre table → produce the
  legally-correct assessment).

### Padded SourceValue handling (C12 already covers this)

Both Land columns store char(10)-padded values:
- `NONE` is stored as `"NONE      "` (10 chars: NONE + 6 spaces)
- `DRAG1` is stored as `"DRAG1     "` (10 chars: DRAG1 + 5 spaces)

The C12 trim-on-both-sides matcher (`MappingSourceValueMatcher`)
handles this. Operators type the natural unpadded form
(`DRAG1`, not `"DRAG1     "`) and the C11-B batch edit service
matches against the stored value cleanly. The C16-A policy's
"natural input" guarantee carries over.

## Pre-2017 conversion caveat (Land-specific)

The Benton pre-2017 PACS data conversion caveat applies to land
codes the same way it applies to sales / valuation / improvement
codes:

- Pre-conversion land segments may carry `primary_use_cd` /
  `land_soil_code` values whose semantic meaning differs from
  the current PACS / WSDOR table interpretation. Soil codes in
  particular have evolved over the years as WSDOR has refined
  per-acre value tables; pre-2017 records may reference
  superseded class definitions.
- The `ObservedCount` figures reflect the full undated population.
  `NONE`'s 7,702 observations may include thousands of pre-2017
  segments whose "no current-use" designation predates the
  current PACS code-table version.
- When the operator can't document that the canonical mapping
  holds for both pre- and post-conversion semantics, the row
  stays `Deferred` with notes calling that ambiguity out.

This is the same posture as every other lane in the workbook;
the operator response is identical (defer when in doubt;
document mapping scope in notes when promoting).

## CSV Format

Reuses the C11-A grammar verbatim (no new columns):

```text
scope,source_schema,source_table,source_column,source_value,review_status,canonical_target,canonical_value,canonical_value_null,is_excluded,notes
```

### RFC 4180 quoting requirement (C17-A2 lesson)

`land_soil_code` values in this workbook are mnemonic strings
without commas, but the C17-A2 amendment's RFC 4180 quoting rule
applies preemptively to any future Land batch CSV: if any
SourceValue contains a comma or a double-quote, it MUST be
`"..."`-wrapped before reaching the parser. The C11-B
`BatchEditCsvParser` handles standard RFC 4180 quoting cleanly;
the authoring side just has to use it.

### Allowed scopes for this slice

| Scope | Identity | Purpose |
|---|---|---|
| `code_value` | `(dbo, land_detail, primary_use_cd, <code>)` or `(dbo, land_detail, land_soil_code, <mnemonic>)` | One row per code-value the operator reviews. |
| `column` | `(dbo, land_detail, <column>)` | At most one row per column to set its `canonical_target` (neither column has one set yet) and/or promote the column-row's review status. |

### Forbidden scopes

- Any row whose `source_table` is not `land_detail`.
- Any row whose `source_column` is not `primary_use_cd` or
  `land_soil_code`.
- Cross-lane batch edits.

## Audit Expectations

### What every C19-* run produces

```text
backend/artifacts/sync-atlas/c19-<letter>/<run-id>/
├── pre-snapshot.txt
├── drift.txt
├── land-review.csv
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
- Sales / Valuation / Improvement lanes: byte-for-byte unchanged
  across every C19-* slice. C9-C through C17-D anchor timestamps
  preserved.
- The two in-scope **column rows** stay at `NeedsReview` unless
  an explicit operator decision promotes them. A column-row
  promotion requires the column to have a `canonical_target`
  (which neither does today); setting `canonical_target` is
  itself an operator-explicit decision.

## Hard Non-Goals

| Non-goal | Rationale |
|---|---|
| **Auto-fill canonical_value from WSDOR ag-class tables** | Re-introduces "the tool guessed" failure mode. RCW 84.34 misclassification has citizen-impact and county-compliance consequences. |
| **Apply a generic soil-code mapping** | Even WSDOR-published mnemonic tables have county-specific deviations and historical drift. Operator confirms per-row. |
| **Pattern-match `DR*` / `IR*` prefixes** | The autodetection guard explicitly forbids this. |
| **Numeric-order proximity inference on `primary_use_cd`** | Same lesson as Valuation. |
| **Cross-tier semantic inference** (mixing `primary_use_cd` and `land_soil_code`) | Two different classification axes. |
| **Cross-county vocabulary import** | Counties' PACS instances diverge over time. |
| **Promote rows from Deferred to Mapped without operator notes referencing WSDOR / RCW 84.34** | Notes is the audit trail's why-this-decision row; required for terminal-status promotion. |
| **Lock the workbook on lane-completion** | Lock is a separate slice; C19 is review acceleration. |
| **Edit the 27 land-related Other-lane columns in C19** | Out of scope. Each shape needs the right policy. |
| **Skip snapshot or dry-run** | Both are Hard Guards. |

## C19-B+ Success Gates

A C19-* run is successful iff every gate below passes. The empty
marker commit lands only after all gates are green.

| Gate | Pass criterion |
|---|---|
| **Snapshot captured** | `pre-snapshot.txt` exists and contains workbook + per-row state for both Land columns. |
| **Drift acknowledged** | `drift.txt` exists; sales / valuation / improvement lane anchors match expected timestamps. |
| **Dry-run validates** | `batch-dry-run.txt` exit 0, all rows valid. |
| **Dry-run verify clean** | `batch-dry-run-verify.txt` shows zero mutation. |
| **Apply succeeds** | `batch-apply.txt` exit 0, Outcome=Applied, Audit Stamp Bump=1. |
| **Apply verify exact** | `batch-verify.txt` shows the exact set of CSV-listed Land rows mutated. |
| **Workbook stays Draft** | `post-snapshot.txt` shows Status=Draft, columns/code-values unchanged. |
| **Sales lane preserved** | wac_cd 54/54 + sl_ratio_type_cd 23/23 = 77/77; original timestamps intact. |
| **Valuation lane preserved** | property_use_cd 62/62; original timestamps intact. |
| **Improvement lane preserved** | imprv_state_cd 94/94 + imprv_det_class_cd 21/21 + i_attr_val_cd 60/60 = 175/175; original timestamps intact. |
| **Land lane only** | Every mutated row has `source_table='land_detail'` AND `source_column ∈ {'primary_use_cd', 'land_soil_code'}`. |
| **Dashboard math exact** | `progress-after.txt` Land-lane NonTerminal decreased by exactly the CSV row count vs `progress-before.txt`. |
| **Leak scan clean** | No matches under `c19-<letter>/`. |

## Recommended pacing

Parallels the C16/C17 pacing pattern. With 89 codes total and
each batch typically 12–25 rows:

- **C19-B**: top ~16 `primary_use_cd` codes by ObservedCount.
- **C19-C**: continue `primary_use_cd` + start `land_soil_code`
  with the high-frequency soil mnemonics (~20 rows mixed).
- **C19-D**: close out remaining rows in both columns (~30+ rows
  closeout, similar shape to C13-F's wac_cd closeout or C16-D's
  property_use_cd closeout).

Pacing is *recommended* only. Operator can slice differently;
the Hard Guards apply to every batch.

## Operator Workflow

```text
1. Run progress dashboard:
     sync-atlas --mapping-review-progress --workbook-id <id>
   Confirm Land lane is at <prior>/89 terminal and prior lanes
   are 77/77 / 62/62 / 175/175 (preserved).

2. Pull NeedsReview candidates ordered by ObservedCount DESC for
   the chosen column. Note the 2017 conversion caveat —
   high-ObservedCount codes (e.g. NONE = 7,702) include large
   pre-conversion populations whose semantics may differ.

3. Capture pre-snapshot + drift report.

4. Author CSV in a real editor:
     # one row per code at one column;
     # canonical_value only when operator has documented
     # WSDOR / RCW 84.34 reference;
     # notes field references the specific reference + states
     # whether the mapping holds pre- and post-2017.

5. Dry-run + verify zero mutation.

6. Apply + verify exact mutations + sales/valuation/improvement
   lanes preserved.

7. Run progress dashboard again; confirm Land-lane NonTerminal
   dropped by exactly the CSV row count.

8. Capture post-snapshot.

9. Empty marker commit (only if all gates green).
```

## What This Document Is Not

- **Not the CSV.** Operators author CSVs in
  `backend/artifacts/sync-atlas/c19-*/<run-id>/land-review.csv`;
  files never committed.
- **Not a script.** No automation infers soil-code semantics or
  generates per-row decisions.
- **Not an RCW 84.34 reference.** The policy points at the
  statute and the WSDOR per-acre value tables but does not
  reproduce them. The operator is expected to consult those
  references when promoting to Mapped.
- **Not a transform consumer.** Land transforms read the
  workbook through the C7 read model.
- **Not a license to relax the WacCd directive at the land
  layer.** "Don't infer soil quality from `DR*` / `IR*` prefix"
  is just as binding as "don't infer WAC exclusion from statute
  prefix" was at sales.
- **Not a license to forget the 2017 conversion caveat.** Same
  caveat as every other lane.
- **Not coverage of the 27 land-related Other-lane columns.**
  Those are explicitly future work.
- **Not a lane-reclassification slice.** Several Other-lane
  `land_detail` columns (`land_class_code`, `land_type_cd`,
  `ag_use_cd`) arguably belong in the Land lane; moving them is
  a separate slice.
