# Improvement Review CSV Policy

**Slice:** C17-A (docs-only — defines the contract for C17-B+
implementation: operator-authored CSVs of improvement-classification
decisions across the three-tier improvement model in PACS, fed
through the C11-B batch edit CLI).
**Lifecycle layer:** improvement-classification readiness — the
operator-decision layer that turns PACS improvement / improvement-
detail / improvement-attribute codes into a canonical vocabulary
the C7+ valuation transforms can consume per-tier.
**Status:** policy locked; CSV authoring + C17-B+ live application
deferred to subsequent slices.

## Provenance

- C2 schema: `SyncMappingWorkbook` / `SyncMappingColumn` /
  `SyncMappingCodeValue`. Audit fields auto-populated by
  `AuditableEntityInterceptor`.
- C13-A through C13-F sales-lane sweep (sales lane closed at 100%
  terminal at the code-value level) — established the
  snapshot/drift/dry-run/apply/progress-after pattern this slice
  inherits.
- C16-A through C16-D valuation-lane sweep (valuation lane closed
  at 100%) — established the per-numeric-code-column policy shape
  this slice extends from one column to a three-tier set.
- C16-A's pre-2017 conversion caveat — applies to improvement
  data the same way it applies to property-use and sales data.
  Same constraint, different lane.
- Memory-flagged WacCd directive — the analog at this layer is
  "infer building-class meaning from frequency or numeric-order
  proximity." Forbidden the same way.
- Live workbook state at C16-D (`e1b684ad6`):
  | Metric | Value |
  |---|---|
  | Status | `Draft` |
  | Columns | 200 |
  | Code values | 1,733 |
  | Terminal | 139 (3 Excluded + 136 Deferred) |
  | Non-terminal | 1,594 |
  | Sales lane | 100% complete |
  | Valuation lane | 100% complete |
  | **Improvement lane** | 0% (175 code-values across 3 columns) |
- **Operator-supplied domain context (2026-04-28):** PACS models
  improvements as a three-tier hierarchy:
  1. **Improvements** (`dbo.imprv.*`) — top-tier building / structure record.
  2. **Improvement Details** (`dbo.imprv_detail.*`) — middle-tier component breakdown (sections, additions, etc.).
  3. **Improvement Attributes / Assets** (`dbo.imprv_attr.*`) — bottom-tier per-feature attributes (one row per countable building feature).

## Purpose

Capture, review, and apply the operator's per-row decisions for
the three numerically-coded columns currently classified into the
Improvement lane in this workbook — one column per PACS tier —
making the workbook capable of expressing improvement-class
semantics at every tier the C7+ valuation transforms care about.

## Scope

### In scope (this slice's policy contract)

| Tier | Source | Code-values | Initial state | Decision shape |
|---|---|---:|---|---|
| **1: Improvements** | `dbo.imprv.imprv_state_cd` | 94 | NeedsReview | improvement state (numeric class for the top-level structure record) |
| **2: Improvement Details** | `dbo.imprv_detail.imprv_det_class_cd` | 21 | NeedsReview | per-component class (e.g. main-area class, addition class) |
| **3: Improvement Attributes** | `dbo.imprv_attr.i_attr_val_cd` | 60 | NeedsReview | per-feature attribute value (e.g. roof type, exterior type, heating type, etc.) |

Total: **3 columns / 175 code-values across 3 tiers.**

### Out of scope (deliberately deferred)

The following `imprv*`-table columns are in the **Other** lane in
the workbook (the C3 loader's classification) and are NOT covered
by this slice:

- **Free-text comment fields:** `imprv.dep_cmnt`,
  `imprv.economic_cmnt`, `imprv.functional_cmnt`,
  `imprv.physical_cmnt`, `imprv.percent_complete_cmnt`,
  `imprv.flat_value_comment`, `imprv.imprv_cmnt` (53 distinct
  values), `imprv_detail.economic_cmnt`,
  `imprv_detail.physical_cmnt`,
  `imprv_detail.percent_complete_cmnt`,
  `imprv_detail.flat_value_comment`. These need a separate
  free-text-field policy slice (C18 or later).
- **Mobile-home identifier fields:** `mbl_hm_make` (79 values),
  `mbl_hm_sn_*`, `mbl_hm_hud_num*`, `mbl_hm_title_num`. These are
  per-record identifiers, not classification codes — different
  policy shape entirely.
- **Building-name / number fields:** `building_name`,
  `building_number`. Per-record labels, not classification.
- **Override fields:** `imp_new_val_override`,
  `dep_pct_override`, `depreciation_yr_override`,
  `economic_pct_override`, `physical_pct_override`,
  `new_value_override`, `override_area`, `override_perimeter`,
  `override_cubic_area`, `size_adj_pct_override`,
  `add_factor_override`, `percent_complete_override`,
  `physical_pct_source`. These are per-record numeric overrides,
  not classification codes.
- **Other numeric-coded columns currently in Other lane** —
  `imprv.primary_use_cd` (44 codes), `imprv.imprv_type_cd` (6),
  `imprv.imprv_val_source`, `imprv.secondary_use_cd`,
  `imprv_detail.condition_cd` (12), `imprv_detail.imprv_det_meth_cd` (10),
  `imprv_detail.imprv_det_sub_class_cd`,
  `imprv_detail.imprv_det_val_source`,
  `imprv_detail.imprv_det_area_type`, `imprv_detail.lease_class`,
  `imprv_detail.permanent_crop_*` codes. These deserve numeric-
  code review BUT are currently lane-tagged `Other` — promoting
  them into the Improvement lane (or extending this policy to
  cover them in their current lane) is a future slice. This slice
  stays narrow to the 3 columns the C3 loader already classified
  into Improvement.
- **Boolean / flag fields:** `imprv.imprv_homesite`,
  `imprv.imprv_sl_locked`, `imprv.primary_imprv`,
  `imprv_detail.new_value_flag`, `imprv_detail.use_up_for_pct_base`,
  `imprv_detail.can_close_sketch`. These have a few distinct
  values (mostly true/false-shaped). Out of scope here; arguably
  belong with the override-field policy.
- **JSON / structured payloads:** `imprv_detail.ms_building_json`,
  `imprv_detail.sketch_cmds`. These are not codes; need a
  different policy entirely.
- **Identifier / URL fields:** `imprv.imprv_image_url`,
  `imprv.misc_cd`, `imprv_detail.ref_id1`, `imprv.ref_id1`.

### Forbidden in this slice

- Sales-lane edits (`dbo.sale.*`). Sales is closed at C13-F.
- Valuation-lane edits (`dbo.property_val.property_use_cd`).
  Valuation is closed at C16-D.
- Land / Neighborhood / any non-improvement column.
- Lock / qualify-sales / transform-write side effects.

## Hard Guards

The five guards below extend the C11-A batch edit Hard Guards with
improvement-specific safety. The C17-B+ implementations must
satisfy all of them.

### 1. `Status='Draft'` only

Inherited from C11-A.

### 2. Snapshot before apply

Inherited from C13-A. Capture workbook + per-row state for the
target tier's column to
`backend/artifacts/sync-atlas/c17-<letter>/<run-id>/pre-snapshot.txt`
before every `--apply`.

### 3. Dry-run before apply

Inherited from C13-A.

### 4. No autodetection of improvement classification

The improvement-lane analog of the WacCd directive. The CSV
authoring tool / operator MUST NOT:

- pattern-match codes by leading digit (e.g. assume `1x` =
  residential, `2x` = commercial) — PACS-county-specific code
  tables vary;
- infer class from observed-count distributions (a high-frequency
  attribute code is not necessarily the dominant building feature
  in the active inventory; it could be a default placeholder);
- treat numeric-order proximity as semantic ("class 11 and class
  12 must be related building types");
- carry forward classification decisions from other workbooks /
  other counties — even if Yakima or Cowlitz already mapped the
  same improvement state code, those decisions don't transfer
  because PACS code tables are county-instance-specific;
- conflate the three tiers — an `imprv_state_cd` value of `11` is
  unrelated to an `imprv_det_class_cd` value of `11` is unrelated
  to an `i_attr_val_cd` value of `11`. Tier-tier code collisions
  are coincidental.

Every `Mapped` decision must trace to either:
(a) the operator's direct knowledge of what the code means at
    that tier in this county's PACS instance, OR
(b) a documented PACS / WSDOR / DOR code reference for that
    specific table+column, named in the row's `notes` cell.

When neither is available, the row is `Deferred` with notes
explaining what reference material is needed.

### 5. No sales-lane / valuation-lane mutation as a side effect

This slice's CSVs MUST NOT contain rows that target any
`source_table` other than the three in scope (`imprv`,
`imprv_detail`, `imprv_attr`) AND must only touch the **specific**
in-scope column per tier (not other columns within those tables
that happen to live in Other lane). The C11-B parser-side
duplicate-target rule catches one class of error; the policy
guard is operator-facing CSV-authoring discipline.

## Tier-aware decision rules

The decision shape is the same at every tier (Mapped requires
documented source, Excluded requires explicit invalid-code
rationale, Deferred is the safe default), but the **semantic
meaning** of each tier matters for what canonical vocabulary the
operator types into `canonical_value`.

### Tier 1 — `dbo.imprv.imprv_state_cd` (94 codes)

**Semantic:** the top-level state classification of an entire
improvement record. Examples in many PACS deployments include
"residential single-family", "commercial improved", "industrial
warehouse", "agricultural barn", etc. This code answers "what
KIND of structure is this whole record describing?"

**Canonical vocabulary candidates** (operator-typed, growing):
`Residential`, `Commercial`, `Industrial`, `Agricultural`,
`Outbuilding`, `MobileHome`, `MixedUse`, etc.

**Decision policy:** Deferred unless the operator has the PACS
state-code table in hand AND the table specifies the same code
meaning for both pre-conversion and post-conversion records.

### Tier 2 — `dbo.imprv_detail.imprv_det_class_cd` (21 codes)

**Semantic:** the per-component class within an improvement
record. An `imprv_detail` row represents one section / addition /
component of the parent `imprv` record (e.g. main living area,
attached garage, finished basement, deck). The class code says
"what KIND of component is this one piece?"

**Canonical vocabulary candidates** (operator-typed, growing):
`MainArea`, `AttachedGarage`, `DetachedGarage`, `Basement`,
`FinishedBasement`, `Porch`, `Deck`, `CoveredPatio`, `Outbuilding`,
etc. (These mirror the PACS `ImprvDetTypeCd` codes documented in
the Benton corpus — but DO NOT auto-map: the operator types each.)

**Decision policy:** Same as Tier 1. Defer when the per-component
table mapping isn't operator-documented.

### Tier 3 — `dbo.imprv_attr.i_attr_val_cd` (60 codes)

**Semantic:** the per-feature attribute value. An `imprv_attr` row
represents one countable / measurable feature of an improvement
detail (e.g. exterior wall material, heating system, roof type,
plumbing fixtures). The attribute value code says "what specific
**value** does this feature take?" — the *kind* of feature is
encoded separately (the `i_attr_id` column, which is currently
out of scope).

**Canonical vocabulary candidates** (operator-typed, growing):
context-dependent on which attribute is being valued. The same
attribute-value code can mean different things depending on which
feature it's recording (a `1` for "exterior wall material" means
something different from a `1` for "heating system"). This makes
attribute-value codes the **most operator-judgment-dependent**
tier.

**Decision policy:** Deferred is the default at this tier even
more strongly than at Tiers 1 and 2 — without context about which
feature each attribute-value code is recording, mapping a single
`i_attr_val_cd` row to a canonical label is ambiguous on its
face. A future slice may extend this column's review to include
the attribute-id context (joining `imprv_attr.i_attr_id` into the
read), but that's beyond C17-A.

## Pre-2017 conversion caveat (improvement-specific)

The Benton pre-2017 PACS data conversion caveat (recorded in
the sales-policy amendment at C16-A) **also applies to improvement
codes**:

- Pre-conversion improvement records may carry `imprv_state_cd` /
  `imprv_det_class_cd` / `i_attr_val_cd` values whose semantic
  meaning differs from the current PACS code-table interpretation.
- The `ObservedCount` figures reflect the full undated population.
  A high-`ObservedCount` improvement-state code may include
  thousands of pre-2017 records whose classification predates the
  current code-table version.
- When the operator can't document that the canonical mapping
  holds for both pre- and post-conversion semantics, the row
  stays `Deferred` with notes calling that ambiguity out.

This is the same stance C16-A took for property-use codes; the
operator response is identical (defer when in doubt; document
mapping scope in notes when promoting).

## CSV Format

Reuses the C11-A grammar verbatim. No new columns.

```text
scope,source_schema,source_table,source_column,source_value,review_status,canonical_target,canonical_value,canonical_value_null,is_excluded,notes
```

### Allowed shapes per slice

C17-B / C17-C / C17-D may run as separate per-tier slices, OR a
single C17-B may bundle all three tiers into one CSV. Either is
fine; the policy treats them as independent decision sets.

Recommended pacing (parallels C16-B/C/D):
- **C17-B**: top-frequency rows from Tier 1 (`imprv_state_cd`),
  ~12-16 rows.
- **C17-C**: continue Tier 1 + start Tier 2 (`imprv_det_class_cd`),
  ~16 rows mixed.
- **C17-D**: close Tier 1 + most of Tier 2 + start Tier 3
  (`i_attr_val_cd`), ~20-30 rows.
- **C17-E**: closeout (similar to C13-F's 25-row sales closeout
  or C16-D's 34-row valuation closeout).

This is *recommended* pacing only. The operator can choose any
slice grouping; the C13-A snapshot / drift / dry-run / apply /
progress-after gates apply to every batch.

## Audit Expectations

### What every C17-* run produces

```text
backend/artifacts/sync-atlas/c17-<letter>/<run-id>/
├── pre-snapshot.txt          # Hard Guard 2 snapshot
├── drift.txt                 # Drift report vs. prior-marker anchor
├── improvement-review.csv    # Operator's authored CSV
├── csv-authoring-notes.md    # Decision rationale + tier context + canonical-vocab choices
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
  bumped exactly once for the whole batch.
- Workbook `Status`: still `Draft`.
- The 3 in-scope **column rows** (`imprv.imprv_state_cd`,
  `imprv_detail.imprv_det_class_cd`, `imprv_attr.i_attr_val_cd`)
  stay at `NeedsReview` unless an explicit operator decision
  promotes one — different from valuation, where the column row
  was already `Mapped` from C11-C. C17 may or may not promote
  these column rows; if it does, each must include
  `canonical_target` per C9-A scope rules.
- Every other workbook row: byte-for-byte unchanged. **Sales
  lane (C9-C → C13-F) and Valuation lane (C16-A → C16-D)
  audit timestamps must remain intact across every C17-* slice.**

## Hard Non-Goals

| Non-goal | Rationale |
|---|---|
| **Auto-fill canonical_value from PACS docs** | Re-introduces "the tool guessed" failure mode. |
| **Apply a generic improvement-state code table out of the box** | County-specific. Even widely-circulated PACS / WSDOR tables aren't safe to apply without operator confirmation. |
| **Cross-tier semantic inference** | An `imprv_state_cd=11` and an `imprv_det_class_cd=11` and an `i_attr_val_cd=11` are unrelated codes that happen to share a number. |
| **Cross-county vocabulary import** | County PACS instances diverge over time; cross-county mappings don't transfer. |
| **Promote rows from Deferred to Mapped without operator notes** | Notes is the audit trail's why-this-decision row; required for terminal-status promotion. |
| **Lock the workbook on lane-completion** | Lock is a separate slice; C17 is review acceleration. |
| **Edit non-improvement columns** | Out of scope. The remaining lanes (Land, Neighborhood, Other) get their own policies. |
| **Tackle the 64 imprv-related Other-lane columns in C17** | Out of scope. They're a mix of comments / overrides / identifiers / additional numeric codes; each shape needs the right policy. |
| **Skip snapshot or dry-run** | Both are Hard Guards. |

## Success Gates (apply per C17-B/C/D/E run)

A C17-* run is successful iff every gate passes. The empty marker
commit lands only after all ten gates are green.

| Gate | Pass criterion |
|---|---|
| **Snapshot captured** | `pre-snapshot.txt` exists. |
| **Drift acknowledged** | `drift.txt` exists; sales + valuation lane anchors match expected timestamps. |
| **Dry-run validates** | `batch-dry-run.txt` exit 0, all rows valid. |
| **Dry-run verify clean** | `batch-dry-run-verify.txt` shows zero mutation. |
| **Apply succeeds** | `batch-apply.txt` exit 0, Outcome=Applied, Audit Stamp Bump=1. |
| **Apply verify exact** | `batch-verify.txt` shows the exact set of CSV-listed rows mutated. |
| **Workbook stays Draft** | `post-snapshot.txt` shows Status=Draft, columns/code-values unchanged. |
| **Sales lane preserved** | C9-C / C11-C / C13-B/C/D/E/F anchors byte-for-byte unchanged. wac_cd 54/54 + sl_ratio_type_cd 23/23 = 77/77 sales terminal. |
| **Valuation lane preserved** | C16-B/C/D anchors byte-for-byte unchanged. property_use_cd 62/62 = 62 valuation terminal. |
| **Improvement lane only** | Every mutated row has `source_table` ∈ {`imprv`, `imprv_detail`, `imprv_attr`} AND `source_column` ∈ {`imprv_state_cd`, `imprv_det_class_cd`, `i_attr_val_cd`}. |
| **Dashboard math exact** | `progress-after.txt` Improvement-lane NonTerminal decreased by exactly the CSV row count vs `progress-before.txt`. |
| **Leak scan clean** | No matches under `c17-<letter>/`. |

## C17-B Marker (recommended template)

If all gates pass on the first batch:

```bash
git commit --allow-empty -m \
  "test(sync): Slice C17-B — apply first improvement review CSV. The goblin labeled improvement-state codes without conflating tiers."
```

Subsequent slices follow the same shape (C17-C, C17-D, C17-E).

## Operator Workflow

```text
1. Run progress dashboard:
     sync-atlas --mapping-review-progress --workbook-id <id>
   Confirm Improvement lane is at <prior>/175 terminal and
   Sales / Valuation lanes are 77/77 / 62/62 (preserved).

2. Pull NeedsReview candidates for the chosen tier(s):
     SELECT v.SourceValue, v.ObservedCount
     FROM "SyncMappingColumns" c
     JOIN "SyncMappingCodeValues" v ON ...
     WHERE c.SourceTable = '<imprv|imprv_detail|imprv_attr>'
       AND c.SourceColumn = '<imprv_state_cd|imprv_det_class_cd|i_attr_val_cd>'
       AND v.ReviewStatus = 'NeedsReview'
     ORDER BY v.ObservedCount DESC NULLS LAST
     LIMIT <batch-size>;
   Note the 2017 conversion caveat before treating ObservedCount
   as a reliable signal.

3. Capture pre-snapshot + drift report.

4. Author CSV in a real editor:
     # one row per code at one tier;
     # canonical_value only when operator has documented source
     # AT THAT SPECIFIC TIER (do not borrow Tier 1 vocabulary
     # for Tier 3 rows or vice versa);
     # notes field explicitly mentions tier and reference source.

5. Dry-run + verify zero mutation.

6. Apply + verify exact mutations + sales-lane preserved +
   valuation-lane preserved.

7. Run progress dashboard again; confirm Improvement-lane
   NonTerminal dropped by exactly the CSV row count.

8. Capture post-snapshot.

9. Empty marker commit (only if all gates green).
```

## What This Document Is Not

- **Not the CSV.** Operators author CSVs in
  `backend/artifacts/sync-atlas/c17-*/<run-id>/improvement-review.csv`;
  files never committed.
- **Not a script.** No automation infers tier semantics or
  generates per-row decisions.
- **Not a code table.** The canonical vocabulary for each tier is
  operator-defined, with the constraint that a given tier's
  vocabulary is documented in `notes` on first use within a run.
- **Not a transform consumer.** Improvement transforms read the
  workbook through the C7 read model; this slice does not change
  the read-model contract.
- **Not a license to relax the WacCd directive at the
  improvement layer.** "Don't infer building-class meaning from
  numeric prefix" is just as binding as "don't infer WAC
  exclusion from statute prefix" was at the sales layer.
- **Not a license to forget the 2017 conversion caveat.** Same
  caveat as sales and valuation: operators document which
  conversion era a Mapped decision applies to, or defer.
- **Not coverage of the 64 imprv-related Other-lane columns.**
  Those are explicitly future work — they need either an Other-
  lane policy (free-text, identifier, override fields) or a
  lane-reclassification slice (numeric codes that should arguably
  move from Other → Improvement) before any of them gets touched.

---

## Amendment — 2026-04-28: Tier 3 values are human-readable labels (post-C17-D observation)

This amendment is added retroactively after C17-D ran the
improvement-lane closeout (138 rows: 78 imprv_state_cd + 60
i_attr_val_cd). The C17-A policy as originally written assumed
all three tiers used numeric / operator-judgment-dependent code
vocabularies. Observation during C17-D's apply phase corrected
that assumption for **Tier 3 only**.

### Observation

`dbo.imprv_attr.i_attr_val_cd` does **not** store numeric codes.
The `SourceValue` strings are **human-readable category labels**
in plain English. Top observed values from the live workbook
(per `ObservedCount` desc, post-C17-D state):

| SourceValue | ObservedCount |
|---|---:|
| `Count` | 2,911 |
| `Crawl/Concrete Perimeter Piers` | 1,122 |
| `Comp Shingle` | 1,080 |
| `Hardboard` | 1,070 |
| `FIREPLACE` | 715 |
| `Central heat/cooling` | 424 |
| `T 111 plywood` | 389 |
| `Central Warm Air` | 386 |
| `Heat pump` | 326 |
| `Stucco` | 239 |
| `Wood` | 238 |
| `Vinyl` | 236 |
| `Metal` | 235 |
| `Slab` | 106 |
| `Baseboard` | 103 |

The values include material names (`Wood`, `Vinyl`, `Metal`,
`Stucco`, `Comp Shingle`, `Hardboard`, `T 111 plywood`),
foundation types (`Slab`, `Crawl/Concrete Perimeter Piers`),
heating systems (`Heat pump`, `Central Warm Air`, `Baseboard`,
`Central heat/cooling`), feature labels (`FIREPLACE`), and one
value containing a comma: **`Electric, Cable or Baseboard`**.

### CSV format consequence: RFC 4180 quoting required

PACS attribute-value labels can contain commas (and in principle
quotes, though none observed in this workbook). The C11-B
`BatchEditCsvParser` already handles RFC 4180 quoting per the
C11-A grammar — this is not a new code requirement. The
authoring-side requirement is that batch-edit CSV generators MUST
quote any `source_value` whose stored value contains a comma:

```text
code_value,dbo,imprv_attr,i_attr_val_cd,"Electric, Cable or Baseboard",Deferred,...
```

Naive comma-joined SQL output without quote-handling will split
the value mid-field and cause the row to fail validation (the
parser will see `Electric` as the SourceValue and `Cable or
Baseboard` as the ReviewStatus, which fails the closed-vocabulary
check). The C17-D run hit and recovered from this exact failure
mode; the doubled-quote SQL pattern that fixed it:

```sql
CASE WHEN v."SourceValue" LIKE '%,%' OR v."SourceValue" LIKE '%"%'
     THEN '"' || REPLACE(v."SourceValue", '"', '""') || '"'
     ELSE v."SourceValue" END
```

For future improvement / land / other-lane batches whose stored
values may contain commas or quotes, generators must apply the
same quoting pattern.

### Why Defer-by-default still binds

It is tempting to read `Wood` and assume it canonically maps to
something like a `Wood` exterior-wall material — and `Vinyl` to
`Vinyl` siding, etc. The C17-A "no autodetection" Hard Guard
forbids that shortcut, and the underlying reason is structural:

- A row in `imprv_attr` represents one (improvement_id,
  attribute_id, value) triple. The `i_attr_id` column (NOT in
  this slice's scope) tells you **which feature** the value
  describes: exterior wall material, foundation type, heating
  system, roof type, fireplace count, etc.
- The same `i_attr_val_cd` string carries different semantics
  depending on which `i_attr_id` it's paired with. `Count` (2,911
  obs) is presumably a count-typed attribute (number of fixtures,
  number of bedrooms, etc.) but reading the value alone, you
  can't tell what's being counted. `Wood` could be wall material
  in one row and floor material in another. `FIREPLACE` is itself
  a feature label, not a value — suggesting some attribute IDs
  encode the feature name into the value column itself in this
  PACS deployment.
- Without joining `i_attr_id` context, mapping a single
  `i_attr_val_cd` row to a canonical attribute is at best
  partial-information; at worst it's wrong by virtue of being
  applied to multiple incompatible features simultaneously.

### Updated Tier 3 decision rule

Slot this rule into the per-tier decision rules section above
(no change to the canonical vocabulary candidates list — it's
already correct in saying "context-dependent on which attribute
is being valued"):

> **Tier 3 (`i_attr_val_cd`) values are human-readable labels,
> not numeric codes.** This does not change the Defer-by-default
> policy. A row whose `SourceValue` is `Wood` still requires
> assessor confirmation that, **in this county's PACS instance,
> for the specific attribute IDs that pair with this value**,
> `Wood` is the canonical-vocabulary label for that feature
> material. Until then, `Wood` is `Deferred` with notes
> documenting the attribute-id ambiguity.

### Updated Tier 3 future-work hint

A future slice could extend Tier 3 review to include the
`i_attr_id` context (joining the attribute-id table into the
SyncMapping reads, or adding a parallel mapping for
`imprv_attr.i_attr_id` itself, or both). With `i_attr_id`
context, `i_attr_val_cd` rows become per-feature value lists
(this exterior-wall-material attribute has values `{Wood, Vinyl,
Stucco, Hardboard, T 111 plywood, Comp Shingle, Metal}`; this
heating-system attribute has values `{Heat pump, Central Warm
Air, Baseboard, Central heat/cooling, Electric Cable or Baseboard}`)
which are dramatically easier to operator-confirm to canonical
vocabulary.

That extension is **not part of this amendment**. It's a future
slice (let's call it C17-F or similar) that needs both schema
inspection (does `imprv_attr.i_attr_id` already exist as a
distinct mapping column?) and a separate policy contract.

### What this amendment changes

- Adds the Tier 3 observation table to the policy memory.
- Records the RFC 4180 quoting requirement for SourceValue
  strings that contain commas.
- States that `i_attr_id` context is required before promoting
  any Tier 3 row to Mapped.
- Preserves every prior Hard Guard verbatim.

### What this amendment does not change

- The Defer-by-default decision rule for all three tiers.
- The pre-2017 conversion caveat — still applies to all three
  tiers.
- The "no autodetection" Hard Guard — still binds.
- The 60 Tier 3 rows from C17-D — they remain Deferred with
  notes; this amendment retroactively justifies the per-row
  notes that already say `"values are human-readable category
  labels not numeric codes"`.
- The lane-completion math — Improvement lane is still 175/175
  terminal at the code-value level.

### What this amendment is

A docs-only domain memory record of post-execution observation.
No code changes. No CSV re-runs. No row mutations.

---

## Amendment — 2026-04-28: Operator-supplied i_attr_id mapping table (resolves C17-A2 forward reference)

This amendment is added retroactively after the operator shared
their working sales-dashboard SQL on 2026-04-28. The SQL contains
explicit `i_attr_id`-to-attribute-name mappings that resolve the
C17-A2 "ambiguous without attribute context" caveat for Tier 3
(`imprv_attr.i_attr_val_cd`) rows.

### Operator-supplied i_attr_id table (Benton County PACS)

The operator's dashboard SQL aggregates `imprv_attr` rows using
`i_attr_val_id` as the disambiguator. The mappings observed in
that SQL:

| `i_attr_val_id` | Attribute name | Reading semantics |
|---:|---|---|
| 2 | **Foundation** | `i_attr_val_cd` is the foundation type (e.g. `Slab`, `Crawl/Concrete Perimeter Piers`) |
| 3 | **ExtWall** | exterior wall material (`Wood`, `Vinyl`, `Stucco`, `Hardboard`, `Comp Shingle`, `T 111 plywood`, `Metal`) |
| 6 | **RoofCovering** | roof covering material (`Comp Shingle`, etc.) |
| 9 | **HVAC** | residential HVAC type (`Heat pump`, `Central Warm Air`, `Baseboard`, `Central heat/cooling`) |
| 10 | **Fireplace** | fireplace count (`i_attr_unit` is the count; `imprv_attr_val` is the cost) |
| 12 | **Comm__Sprinkler** | commercial sprinkler indicator |
| 15 | **Bedrooms** | bedroom count (`i_attr_val_cd` cast to int) |
| 31 | **COMM_HVAC** | commercial HVAC type |
| 39 | **Comm_frame** | commercial frame / class description |
| 45 | **Bathrooms** | bathroom count (`i_attr_unit` cast to int) |
| 46 | **HalfBaths** | half-bath count |
| 47 | **Fixture_Count** | plumbing fixture count |
| 51 | **Comm_Shape** | commercial building shape + units |
| 56 | **COMM_Elevators** | commercial elevator count + units |
| 58 | **COMM_Units** | commercial unit count |
| 61 | **COMM_Tank_Type** | commercial tank type + units |
| 62 | **COMM_Tank_Capacity** | commercial tank capacity + units |
| 63 | **COMM_Service_Pit** | commercial service pit + units |
| 67 | **Solar_Panels** | solar panel cost (`imprv_attr_val`) |

**Source:** operator's working `_clientdb_property_sales_*` SQL
that populates the Excel sales dashboard (shared 2026-04-28).
The SQL is operationally proven — it's the data shape the
sales-dashboard pulls from PACS daily — so this table is treated
as authoritative for Benton County PACS.

### What this resolves

The C17-A2 amendment said:

> A future slice could extend Tier 3 review to include the
> `i_attr_id` context. ... With `i_attr_id` context,
> `i_attr_val_cd` rows become per-feature value lists ...
> which are dramatically easier to operator-confirm to canonical
> vocabulary.

That future slice now has a concrete starting point. The
operator-supplied table above is the first half of the work; the
second half is querying `pacs_oltp.dbo.imprv_attr` for the actual
`(i_attr_id, i_attr_val_cd)` pairs and joining them into the
workbook's review surface.

### Concrete consequence for the 60 Tier 3 Deferred rows

The 60 `i_attr_val_cd` rows that landed `Deferred` in C17-D can
now be **conditionally promoted** by an operator who knows the
attribute-id context:

- A `Wood` row paired with `i_attr_id=3` → can be `Mapped` to
  canonical `ExtWall:Wood` with notes referencing the
  operator-supplied table.
- A `Heat pump` row paired with `i_attr_id=9` → `Mapped` to
  canonical `HVAC:HeatPump`.
- A `Slab` row paired with `i_attr_id=2` → `Mapped` to
  canonical `Foundation:Slab`.
- An ambiguous label (e.g. `Comp Shingle` could be `i_attr_id=6`
  RoofCovering or `i_attr_id=3` ExtWall depending on the row)
  remains `Deferred` until per-row attribute-id context is
  joined.

Important: **promoting these requires reading the live PACS
`imprv_attr` table to know which `i_attr_id` each value pairs
with**. That join isn't possible against the workbook alone (the
workbook only carries the distinct `i_attr_val_cd` SourceValues,
not the per-`imprv_attr` rows). A future slice would either:

1. Extend the workbook schema to include `(i_attr_id, i_attr_val_cd)`
   tuples as a composite key (workbook schema change), OR
2. Add a new `SyncMappingColumn` for `imprv_attr.i_attr_id`
   alongside `imprv_attr.i_attr_val_cd`, and let the operator
   correlate them out-of-band, OR
3. Add a separate "Tier 3 attribute-context mapping" file
   that lists the operator's per-`(i_attr_id, value)` decisions
   independent of the workbook code-value rows.

This amendment does not promote either path. The choice depends
on how downstream consumers read the workbook.

### Cross-reference: imprv_det_type_cd canonical values

The same operator SQL also documents canonical `imprv_det_type_cd`
values used by the dashboard's component-area aggregations:

| `imprv_det_type_cd` | Canonical component |
|---|---|
| `MA` | Main Area (living area) |
| `BSMT` | Finished Basement |
| `U-BSMT` | Unfinished Basement |
| `ATTGAR` | Attached Garage |
| `DETGAR` | Detached Garage |
| `carport` | Carport |
| `polebldg` | Pole Building |

The C17-A policy did not include `imprv_detail.imprv_det_type_cd`
as a reviewed column (the C3 loader put it in Other lane with
6 codes). When that column is reviewed in a future slice
(C18-style Other-lane policy or a lane-reclassification slice),
this table becomes the canonical-value reference for Mapped
promotions.

The user's project memory (`MEMORY.md`
→ `project_pacs_imprv_type_codes.md`) already captures
related observed counts:

- `CovPatio` ~71k obs
- `ATTGAR` ~44k obs
- `MA` ~40k obs
- `BSMT` ~10k obs
- `POLEBLDG` ~9k obs
- `DETGAR` ~8k obs
- `POOL` ~3.8k obs

Combining the C17-A3 canonical table with those observed counts
gives a future Other-lane review the actionable inputs needed for
operator-confirmed Mapped promotions.

### What this amendment changes

- Adds the operator-supplied `i_attr_id` mapping table to
  policy memory (resolves C17-A2's forward reference).
- Adds the `imprv_det_type_cd` canonical-value table for
  reference when that column is reviewed in a future slice.
- Re-frames C17-D's 60 Deferred Tier 3 rows as conditionally
  promotable once attribute-id context is joined.

### What this amendment does not change

- The 60 Tier 3 rows from C17-D remain `Deferred` until a
  future slice promotes them — the conditional path exists but
  has not been executed.
- All prior C17-A / C17-A2 Hard Guards.
- The pre-2017 conversion caveat.
- Sales / Valuation / Improvement / Land lane preservation.
- The 403 prior terminal rows in the workbook. All unchanged.

### What this amendment is

A docs-only domain memory record. No code changes. No row
mutations. No workbook schema extension. The `i_attr_id` table
is recorded as canonical reference for future slices to use.
