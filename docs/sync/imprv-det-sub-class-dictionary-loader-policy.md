# `imprv_det_sub_class` Dictionary Loader Policy

**Slice:** C26-A (docs-only — defines the contract for C26-B
implementation: read-only loader that proposes a review CSV by
joining the workbook's 2 `imprv_det_sub_class_cd` code-values
against PACS's `dbo.imprv_det_sub_class` dictionary. C26-C will
apply the operator-approved CSV via the existing C11-B batch-edit
pipeline).
**Lifecycle layer:** dictionary-assisted review for the Improvement
lane's "sub-class refinement" axis. Sits one level above any
future `imprv_det_sub_class`-aware sweep slice and one level below
any future Improvement-lane canonicalization consumer.
**Status:** policy locked; lane reclassification + sweep are
explicit C26-B preconditions; live inspection + implementation
deferred to C26-B; CSV apply deferred to C26-C.

## Provenance

- **D0-D — PACS canonical dataflow + identity policy**
  (`docs/sync/pacs-canonical-dataflow-identity-policy.md`).
  Establishes property identity composite, year-keyed dictionary
  pattern, no autodetection, allowlisted dictionary tables.
- **C17-A → C17-D — Improvement-lane review** closed three
  Improvement Tier 1/2 columns; C17-A3 explicitly noted that
  several `imprv_detail` columns (including
  `imprv_det_sub_class_cd`) are currently lane-mismatched in the
  workbook (sitting in `Other`, not `Improvement`) and need a
  separate slice for both lane reclassification + dictionary
  load. C26 honors that observation.
- **C21-A — PACS canonical dictionaries reference**
  (`docs/sync/pacs-canonical-dictionaries-reference.md`).
  Catalogs `imprv_det_sub_class` as the canonical dictionary for
  `imprv_detail.imprv_det_sub_class_cd`.
- **C22-A → C22-C — first dictionary-aware Mapped promotion**
  (`docs/sync/property-use-dictionary-loader-policy.md`).
  Established the architecture this slice inherits: M1-M5
  mismatch rules, RFC 4180 quoting, read-only loader, artifact
  emission, operator-approved CSV via C11-B batch edit.
- **C23-A → C23-C — second dictionary-aware Mapped promotion**
  (`docs/sync/imprv-det-class-dictionary-loader-policy.md`).
  Generalized the loader into a target-config-driven
  `DictionaryLoaderService`. C26-B exercises that service with a
  fifth target config.
- **C24-A → C24-C — third dictionary-aware Mapped promotion**
  (`docs/sync/land-soil-dictionary-loader-policy.md`).
  Extended the architecture to a tax-sensitive Land-lane domain.
- **C25-A → C25-C — fourth dictionary-aware Mapped promotion**
  (`docs/sync/imprv-det-meth-dictionary-loader-policy.md`).
  Established the precondition gate language (P1 lane / P2
  sweep) and the honest "P1 is workbook hygiene, not a loader
  precondition" finding. C26 inherits that finding verbatim:
  the loader joins by `SourceColumn`, not by lane, so P1 is
  optional; only P2 (sweep) is required.
- **C22-B-live + C23-B-live + C24-B-live + C25-B-live operational
  lessons**: pre-inspection defaults were wrong **four times** in
  a row (`sys_flag` on property_use; `imprv_det_class_desc` vs
  `imprv_det_cls_desc`; `land_soil_code` vs Hungarian
  `szLandSoilCode`; `imprv_det_meth_desc` vs `imprv_det_meth_dsc`).
  C26-A inherits the same hard rule: **NO hardcoded column names;
  every default in C26-B must trace to a captured live inspection
  of `dbo.imprv_det_sub_class`.**
- **PACS canonical code-table catalog** (`Queries for all Codes
  in PACS (1).doc`, eflowers, 2017-11-29):
  > `-- Improvement Detail Sub Class Codes`
  > `select * from imprv_det_sub_class`
  Operator-confirmed that `imprv_det_sub_class` is the dictionary
  table PACS clients are expected to enumerate.

## Purpose

Define how a future loader (C26-B) inspects
`dbo.imprv_det_sub_class` in PACS, matches its rows to the
workbook's 2 `imprv_det_sub_class_cd` code-values, and **proposes**
a review CSV for operator approval — without directly mutating
the workbook, PACS, the canonical landing tables, or any
downstream consumer.

The C-series invariant from C22-A holds verbatim: the dictionary
is *evidence*, not *authority*. The operator stays the only entity
that promotes a row to a terminal status.

## Architectural distinction: sub-class vs class vs method

Within `imprv_detail`, the workbook tracks several closely related
code columns. Per C17-A3, C23-A, and C25-A, this slice is precise
about which one it covers:

- `imprv_det_class_cd` — what kind of improvement-detail this
  is (construction class / quality grade).
  **Already complete** at C23-C (21 rows mapped via dictionary).
- `imprv_det_meth_cd` — how the improvement-detail's value is
  calculated (calculation method axis).
  **Already complete** at C25-C (10 rows mapped via dictionary).
- **`imprv_det_sub_class_cd` — sub-class refinement of the class
  axis (typically a fine-grained variant flag on top of
  `imprv_det_class_cd`).** **This slice's target.**
- `imprv_det_type_cd` — improvement type (MA / BSMT / ATTGAR /
  POLEBLDG); separate slice; lane-mismatched in `Other` like
  this column.

C26-A does NOT touch `imprv_det_class_cd`, `imprv_det_meth_cd`,
or `imprv_det_type_cd`. The per-table column-config is one-to-one
by intent.

### About the observed Benton codes (`*` and `+`)

Pre-policy workbook audit reveals only 2 distinct
`imprv_det_sub_class_cd` values in the live workbook: `*` and
`+`. These are **special-character / wildcard-shaped codes**, not
mnemonic abbreviations. Their semantic meaning is operator-
authoritative; the loader will propose whatever the dictionary's
description column carries verbatim, and the operator will
confirm at C26-C whether the dictionary description is the
canonical-value the operator wants to commit, or whether to
rephrase.

The loader does NOT, must not, and cannot:

- assume `*` means "any sub-class" or "wildcard";
- assume `+` means "additional / extra";
- propose any RCW / current-use / Benton-Method intent based on
  the code shape;
- treat these codes differently from any other code by virtue
  of their special-character shape.

This pins the C25-A "no prefix-based logic" guard explicitly for
characters that aren't even prefixes — they're whole codes whose
visual shape might tempt inference. The loader treats `*` and `+`
identically to `R` or `DRAG1` or any other code.

## Architectural note: terminal-count vs canonical-quality

Per C22-C / C23-C / C24-C / C25-C: promoting `Deferred → Mapped`
improves **semantic quality** but does NOT change the workbook's
**terminal-count math**. Lock-readiness blockers are unchanged
by C26-C's apply.

C26-C upgrades up to 2 rows from status-terminal-only to
status-and-canonical-terminal — assuming preconditions land
first.

## Preconditions for C26-B (inherits C25-A's structural finding)

The C25-A policy introduced a precondition gate when the column's
code-values are not yet `Deferred`. C26-A inherits that gate
**plus the C25-B operational finding** that P1 (lane
reclassification) is workbook hygiene, NOT a loader precondition.

Pre-C26 audit of the workbook reveals two facts about
`imprv_det_sub_class_cd`:

1. The column itself is currently classified in the **Other**
   mapping lane (per C17-A3's documented lane-mismatch),
   not Improvement.
2. Both of its 2 code-values (`*`, `+`) are **`NeedsReview`**,
   not `Deferred`. No Defer-by-default sweep has been applied
   to this column yet.

### Precondition P1 — Lane reclassification (DEFERRED, per C25-B finding)

`SyncMappingColumns.MappingLane` for the
`imprv_detail.imprv_det_sub_class_cd` column would ideally move
from `Other` to `Improvement`. **Per C25-B's operational finding,
this is workbook hygiene, NOT a loader precondition** — the
C23-B generalized loader joins by `SourceColumn`, not by lane.

C26-B may proceed without P1 satisfied. P1 stays parked for a
future tiny lane-hygiene slice that batches all three
lane-mismatched Improvement columns at once
(`imprv_det_meth_cd` + `imprv_det_sub_class_cd` +
`imprv_det_type_cd`).

### Precondition P2 — Defer-by-default sweep (REQUIRED)

The 2 `NeedsReview` code-values must transition to `Deferred`
status before the loader will propose anything. The sweep is a
2-row CSV processed through C11-B batch-edit `--apply` —
identical pattern to C17-A → C17-D and to C25-B's P2 step.

### Precondition gate

C26-B's loader run **shall produce a `Workbook Deferred rows
scanned: 0` summary if P2 is not met**, and shall not silently
regress to scanning `NeedsReview` rows. The zero-row run is
itself a useful diagnostic; it surfaces the precondition gap
to the operator without producing a misleading CSV.

## Source and Target

| Role | Identity |
|---|---|
| Dictionary source | `dbo.imprv_det_sub_class` (in PACS `pacs_oltp` database; SQL Server) |
| Workbook source column | `dbo.imprv_detail.imprv_det_sub_class_cd` |
| Workbook column scope | Currently `Other` lane (P1 deferred); column row currently `NeedsReview` |
| Workbook code-value scope | 2 rows, both currently `NeedsReview` (P2: sweep to `Deferred`) |
| Canonical target | `ImprvDetailSubClass` (operator-defined vocabulary; new for this slice) |
| Currently observed codes | `*`, `+` (2 codes — smallest dictionary target in the C-series so far) |

### Out of scope (this slice)

- `dbo.imprv_detail.imprv_det_class_cd` — covered by C23-A.
- `dbo.imprv_detail.imprv_det_meth_cd` — covered by C25-A.
- `dbo.imprv_detail.imprv_det_type_cd` — has its own dictionary
  candidate; same lane-mismatch problem as this column; future
  slice.
- `dbo.imprv_detail.permanent_crop_irrigation_sub_class` —
  separately tracked column; lane-mismatched in Other; future
  slice.
- `dbo.sale.sl_sub_class_cd` — sales-side sub-class column;
  separate slice; different lane semantics.
- `dbo.imprv_attr.i_attr_val_cd` — Improvement Tier 3, requires
  the C17-A3 i_attr_id composite context.
- Marshall & Swift cost-schedule references — disabled in the
  live install per D0-D.

## Hard Guards

The five guards below extend the C11-A batch-edit Hard Guards +
the C22-A / C23-A / C24-A / C25-A dictionary-loader Hard Guards
with C26-specific safety. C26-B implementation must satisfy all
of them.

### 1. Read PACS, never write

The loader connects to PACS via the existing `--connection-id`
SyncSourceConnection lookup pattern (D0-D-laminated). Every PACS
query is `SELECT`-only.

### 2. Read-only workbook surface

C26-B's loader does not call `SaveChangesAsync` against the
workbook DbContext. It produces a review CSV file + mismatch
report + run log. The CSV is fed into the existing C11-B batch-
edit pipeline as a separate operator-driven step (C26-C).

The Defer-by-default sweep (P2) is itself a separate
operator-driven C11-B batch-edit operation, not a loader
side-effect.

### 3. No autodetection / no inferred canonical labels

The dictionary's description column supplies the *proposed*
canonical_value for `Mapped` rows. The operator confirms each
row at C26-C. No classification heuristics, **no special-
character interpretation** (`*` does not become "any" / "all" by
inference; `+` does not become "additional" by inference),
frequency-based inference, or AI-suggested canonical labels are
introduced by this slice.

### 4. Year-aware reads + live-inspection-driven config

Per D0-D's year-keyed dictionary pattern + the **fourfold**
C22/C23/C24/C25-B-live lesson:

- C26-B's loader configuration (column names + active flag +
  year keying) MUST come from the C26-B preflight inspection,
  NOT from hardcoded assumptions. After four straight wrong
  guesses, the live-inspection gate is non-negotiable.
- If `imprv_det_sub_class` is year-keyed, the loader filters by
  `pacs_system.appr_yr` by default.
- If the dictionary is universe-wide, the loader proceeds
  without year filtering.

### 5. Allowlisted dictionary table

C26-B extends the SyncAtlas allowlist (currently
`property_use ∪ imprv_det_class ∪ land_soil ∪ imprv_det_meth`)
to include `imprv_det_sub_class`. The CLI rejects any table
name outside the allowlist.

## Live Inspection Required (gate before C26-B)

Before C26-B implementation begins, the operator (or a C26-B
preflight slice) must run a live inspection of
`dbo.imprv_det_sub_class` in the live PACS environment and
record the findings in
`backend/artifacts/sync-atlas/c26-b/<run-id>/dictionary-inspection.txt`.

The inspection MUST capture:

```sql
-- Schema introspection
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'imprv_det_sub_class'
ORDER BY ORDINAL_POSITION;

-- Row count
SELECT COUNT(*) AS total_rows FROM dbo.imprv_det_sub_class;

-- Top 50 sample
SELECT TOP (50) * FROM dbo.imprv_det_sub_class ORDER BY 1;

-- Duplicate-code probe
-- (column name TBD per inspection — assumed to be
--  imprv_det_sub_class_cd but DO NOT hardcode after C25-B-live
--  proved descriptions can be _dsc / _desc / sz-prefixed.)
```

The inspection identifies (operator-recorded findings, not
loader-inferred):

1. **Code column** — exact name (likely
   `imprv_det_sub_class_cd`; verify).
2. **Description / name column** — exact name. After fourfold
   wrong-assumption catches: do not predict.
3. **Active / inactive indicator** — column name + semantics.
4. **Year / version columns** — whether the dictionary is
   year-keyed.
5. **Duplicate-code risk** — does the table allow multiple rows
   with the same code?
6. **Linkage to imprv_det_class** — informational only;
   the loader does NOT join sub-class to class as part of
   canonical-value derivation. Sub-class proposals are
   one-to-one against the dictionary description column.

The inspection output is the input to C26-B's per-county column
configuration block. C26-B does not hardcode column names.

## Mismatch Rules

When C26-B runs (after P2 is met), the same five mismatch shapes
from C22-A apply. Output conventions are identical to C22-A /
C23-A / C24-A / C25-A.

### Rule M1 — Workbook code present, dictionary code missing

Workbook has `imprv_det_sub_class_cd = 'X'` but
`dbo.imprv_det_sub_class` has no row with that code. Particularly
relevant for `*` / `+` since these may be wildcard placeholders
that PACS handles outside the dictionary.

**Output**: `review_status=Deferred` with notes documenting the
data-integrity issue + 2017 conversion caveat + special-character
note ("Special-character codes may represent wildcards or
placeholders that PACS handles outside the dictionary;
operator confirms semantic at C26-C.").

### Rule M2 — Dictionary code present, workbook code absent

Dictionary has codes the workbook never observed.

**Output**: row is **NOT included** in the review CSV.

### Rule M3 — Duplicate dictionary code

Dictionary has multiple rows with the same code.

**Output**: `review_status=Deferred` with notes naming the
ambiguous matches.

### Rule M4 — Inactive dictionary row

Dictionary has the code but it's marked inactive.

**Output**: `review_status=Deferred` with notes documenting the
inactivity.

### Rule M5 — Clean match (the happy path)

Workbook has `imprv_det_sub_class_cd = 'W'` and the dictionary
has **exactly one active** row with that code.

**Output**: `review_status=Mapped` with the dictionary's
description as `canonical_value`,
`canonical_target=ImprvDetailSubClass`, notes documenting the
match + 2017 conversion caveat.

## Review CSV Output Shape

C26-B's loader produces a CSV in the C11-A grammar:

```text
scope,source_schema,source_table,source_column,source_value,review_status,canonical_target,canonical_value,canonical_value_null,is_excluded,notes
```

For each of the up-to-2 Deferred workbook rows (post-P2), the
loader proposes exactly one CSV row classified per M1-M5. Output
lands at:

```text
backend/artifacts/sync-atlas/c26-b/<run-id>/imprv_det_sub_class-proposed-review.csv
backend/artifacts/sync-atlas/c26-b/<run-id>/imprv_det_sub_class-mismatch-report.md
backend/artifacts/sync-atlas/c26-b/<run-id>/dictionary-inspection.txt
backend/artifacts/sync-atlas/c26-b/<run-id>/loader-run.txt
```

The CSV is **not committed**. It's operator-reviewable, then fed
into C11-B's `--batch-edit-mapping-workbook --apply` pipeline at
C26-C. C26-A and C26-B together do not touch a workbook row that
wasn't already moved by the P2 step.

## RFC 4180 quoting

Inherited from C17-A2 / C19-B / C20-A / C22-A / C23-A / C24-A /
C25-A. Special-character codes (`*`, `+`) require no special
quoting on the source-value side, but their dictionary
descriptions may contain commas / quotes; C26-B's CSV emitter
applies RFC 4180 quoting per the established pattern.

## Pre-2017 Conversion Caveat (cross-reference)

Same as C22-A / C23-A / C24-A / C25-A. Pre-2017 PACS records may
carry `imprv_det_sub_class_cd` values whose semantics differ from
current dictionary interpretation. C26-B's loader records the
caveat in each proposed Mapped row's `notes` field.

## Audit Expectations

### What C26-B produces (read-only loader)

```text
backend/artifacts/sync-atlas/c26-b/<run-id>/
├── dictionary-inspection.txt                    # Live PACS inspection
├── workbook-pre-state.txt                       # Confirms P2 met
├── imprv_det_sub_class-proposed-review.csv      # Proposed review CSV
├── imprv_det_sub_class-mismatch-report.md       # M1-M5 counts + samples
└── loader-run.txt                               # CLI stdout
```

None committed. `backend/artifacts/` is gitignored.

### What C26-B does NOT produce

- No workbook row mutations.
- No PACS row mutations.
- No `SaveChangesAsync` calls.
- No PostgreSQL writes.
- No automatic precondition mutation (P2 is operator-driven C11-B,
  not a loader side-effect).

### What C26-C eventually does (separate slice)

- Operator reviews `imprv_det_sub_class-proposed-review.csv`.
- Operator may rephrase canonical_values, especially for the
  special-character codes `*` and `+` whose semantic is more
  operator-judgment-heavy than mnemonic codes.
- Operator runs `--batch-edit-mapping-workbook --apply` against
  the operator-approved CSV via the existing C11-B path.
- Up to 2 Deferred rows convert to whatever terminal status the
  operator confirms.

## Hard Non-Goals

| Non-goal | Rationale |
|---|---|
| **Auto-promote workbook rows to Mapped without operator approval** | Dictionary is evidence, not authority. |
| **Run the precondition Defer-by-default sweep as a loader side-effect** | P2 is an explicit operator-driven C11-B operation; the loader is read-only. |
| **Apply dictionary to other improvement columns in this slice** | `imprv_det_class_cd` (C23-C done), `imprv_det_meth_cd` (C25-C done), `imprv_det_type_cd` each need their own slice. |
| **Touch `imprv_attr.i_attr_val_cd`** | Tier 3 requires `i_attr_id` composite context per C17-A3. |
| **Interpret `*` as "wildcard / any" or `+` as "additional / extra" by code-shape** | Special-character codes are NOT loader-actionable; only the operator can confirm semantic. |
| **Pull Marshall & Swift cost-schedule references** | M&S integration disabled per D0-D. |
| **Mutate PACS rows** | Read-only by policy. |
| **Run a recalc / canonicalize / qualify-sales side effect** | Decoupled by design. |
| **Skip the live inspection gate** | C26-B cannot run until inspection captures column names; no hardcoded assumptions per the fourfold C22/C23/C24/C25-B-live pattern. |
| **Skip precondition P2** | The loader will produce 0 rows until code-values are `Deferred`. This is the design. |
| **Require P1 (lane reclassification)** | Per C25-B's operational finding: P1 is workbook hygiene, NOT a loader precondition. The loader joins by `SourceColumn`, not lane. |
| **Cross-county vocabulary import** | Per-PACS-instance variation per D0-D. |

## Success Gates for C26-B (loader implementation slice)

| Gate | Pass criterion |
|---|---|
| **Inspection captured** | `dictionary-inspection.txt` exists with column-name / active-flag / year-keying findings. |
| **P2 documented** | `workbook-pre-state.txt` confirms all in-scope code-values in `Deferred` status. If not met, loader produces zero proposed rows + diagnostic. |
| **Loader runs read-only** | C26-B run produces zero workbook mutations and zero PACS mutations. |
| **Up to 2 rows classified** | Output CSV (or rejected-row sidecar) accounts for all in-scope workbook Deferred rows. M1+M3+M4+M5 sum equals the in-scope count. |
| **No `Mapped` without dictionary match** | Every Mapped row has a corresponding active, unambiguous dictionary row. |
| **No special-character semantic inference** | `*` / `+` are treated identically to other codes by the loader. Test pin: a unit test exercises both codes in M5 + M1 paths and asserts identical classification logic. |
| **RFC 4180 compliance** | CSV passes the C11-B parser's dry-run validation step. |
| **All prior C-series anchors preserved** | wac_cd 54/54 + sl_ratio_type_cd 23/23 + property_use_cd 62/62 + imprv_det_class_cd 21/21 + imprv_det_meth_cd 10/10 + land_soil_code 35/35 + land_detail.primary_use_cd 54/54 anchors byte-for-byte unchanged. |
| **Other improvement columns preserved** | `imprv_det_type_cd`, `imprv.imprv_state_cd`, `imprv_attr.i_attr_val_cd` unchanged. |
| **No new service class** | C26-B exercises the C23-B generalized `DictionaryLoaderService` with a fifth target config — Program.cs config branch + new test file only. |
| **Leak scan clean** | No PACS credentials / API keys in any artifact. |

## Success Gates for C26-C (operator-approve-and-apply slice)

Inherits the C13-A success-gate template:

| Gate | Pass criterion |
|---|---|
| **Workbook stays Draft** | C26-C apply does not lock. |
| **Exact mutation count** | `Audit Stamp Bump: 1`; exactly the in-scope row count mutated (≤2). |
| **All other lanes preserved** | All anchor lanes byte-for-byte unchanged. |
| **imprv_det_sub_class_cd column-row preserved** | Column row stays at its post-P2 status; CSV mutates code-value rows only. |

## Recommended pacing

Per the C22 / C23 / C24 / C25 series precedent + C26-specific scope:

- **C26-B** — P2 sweep + live inspection + loader implementation +
  live run. Same fold-in-one-session pattern as C25-B. ~6-9 unit
  tests against InMemory + stub reader. **No new service class.**
- **C26-C** — operator review + apply. Smallest C-series apply
  yet (≤2 rows).

## What This Enables (non-binding)

- **C26-B** — the actual loader. Inherits this slice's mismatch
  rules, output shape, inspection gate, P2 precondition, and
  no-special-character-inference language.
- **C26-C** — operator-driven CSV review and apply.
- **C27+** — the same policy shape applied to the next dictionary
  tables in priority order:
  - `imprv_det_type` (lane-mismatched in Other, like this slice;
    larger code count)
  - `nbhd_codes` after C20-C workbook extension
  - `i_attr_id` composite-context loader (Improvement Tier 3,
    structurally different — requires composite identity, may
    need a new service class).
- **Lane hygiene slice** (C25-D / C26-D) — extend C11-B grammar
  to support `mapping_lane`, then batch-reclassify
  `imprv_det_meth_cd` + `imprv_det_sub_class_cd` +
  `imprv_det_type_cd` from Other → Improvement at once.

## Hard Non-Goals (recap)

This doc explicitly does NOT:

- Modify any workbook row.
- Change C3-loader behavior.
- Promote any code-value to a terminal status.
- Build or change any code.
- Touch the running PACS sync service install.
- Pick which county to onboard next.
- Mandate a Benton-Method canonical-value vocabulary
  (operator-defined at C26-C).
- Auto-execute the Defer-by-default sweep precondition.
- Interpret `*` or `+` as wildcard / placeholder semantics
  (operator-defined at C26-C).

## What This Slice Is

The fifth dictionary-aware policy in TerraFusion. C22-A
established the architecture; C23-A confirmed it generalized;
C24-A extended to RCW 84.34 sensitivity; C25-A added the
precondition gate language; C26-A proves the policy template
handles the smallest possible target (2 codes) and pins the
"no special-character inference" guard explicitly.

## What This Slice Is Not

A loader. A workbook write. A code change. A schema migration. A
canonical-vocabulary commitment beyond what the operator-confirmed
C26-C apply produces. A wildcard-semantic specification. A
coverage expansion to other Improvement-tier columns.

## Related policy memory

| Doc | Layer |
|---|---|
| `docs/sync/sales-review-csv-policy.md` (C13-A + amendment) | sales-lane review contract + 2017 caveat |
| `docs/sync/valuation-review-csv-policy.md` (C16-A) | valuation-lane review contract |
| `docs/sync/improvement-review-csv-policy.md` (C17-A + A2 + A3) | improvement-lane three-tier contract + i_attr_id mappings + lane-mismatch acknowledgment |
| `docs/sync/land-review-csv-policy.md` (C19-A) | land-lane review contract + RCW 84.34 |
| `docs/sync/neighborhood-review-csv-policy.md` (C20-A + A2) | neighborhood-lane contract + hood_cd domain truth |
| `docs/sync/mapping-workbook-batch-edit-policy.md` (C11-A) | the batch-edit grammar this slice's CSV is fed into at C26-C, and the precondition pipeline |
| `docs/sync/pacs-canonical-dictionaries-reference.md` (C21-A) | PACS dictionary catalog — `imprv_det_sub_class` is one of 10 |
| `docs/sync/pacs-canonical-dataflow-identity-policy.md` (D0-D) | identity / dataflow / cache rules |
| `docs/sync/property-use-dictionary-loader-policy.md` (C22-A) | first dictionary-loader policy — architectural template |
| `docs/sync/imprv-det-class-dictionary-loader-policy.md` (C23-A) | second dictionary-loader policy — generalized service |
| `docs/sync/land-soil-dictionary-loader-policy.md` (C24-A) | third dictionary-loader policy — RCW 84.34-sensitive |
| `docs/sync/imprv-det-meth-dictionary-loader-policy.md` (C25-A) | fourth dictionary-loader policy — precondition gate language |
| **`docs/sync/imprv-det-sub-class-dictionary-loader-policy.md` (C26-A)** | **this doc — fifth dictionary-aware slice (sub-class refinement axis, smallest target, no special-character inference)** |
