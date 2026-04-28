# Mapping Workbook Column-Row Terminalization Policy

**Slice:** C32-A (docs-only — defines the contract for C32-B's
column-only batch-edit CSV apply that promotes
`SyncMappingColumn.ReviewStatus` rows from `NeedsReview` to a
terminal status (`Mapped` / `Excluded` / `Deferred`). Lock
(C34) requires this. C32-A is the policy. C32-B is the apply.).
**Lifecycle layer:** workbook-side hygiene, between code-value
review (C22→C31) and lock (C10-B / C34). Sits at the *column*
dimension of the workbook, parallel to but distinct from the
*code-value* dimension the C-series has been working on.
**Status:** policy locked; implementation deferred to C32-B.

## Context: the audit finding that prompted this slice

End-to-end audit on 2026-04-28 surfaced the lock blocker:

```
SyncMappingColumns ReviewStatus distribution:
  Mapped       : 1   (property_val.property_use_cd, set at workbook seed)
  NeedsReview  : 199

Per lane:
  Valuation     :   1 column   (1 Mapped — set at seed, pre-C22)
  Sales         :   2 columns  (both NeedsReview)
  Improvement   :   3 columns  (all NeedsReview)
  Land          :   2 columns  (both NeedsReview)
  Neighborhood  :   1 column   (NeedsReview)
  Other         : 191 columns  (all NeedsReview)
```

Lock per `mapping-workbook-lock-cli-policy.md` requires every
`SyncMappingColumn` AND every `SyncMappingCodeValue` in the
terminal set `{ Mapped, Excluded, Deferred }`. Code-value
status has been advanced 9 times across C22→C31 (223
dictionary-aware Mapped, plus various Deferred/Excluded). But
the column rows themselves were never moved off `NeedsReview`
except the one preset at seed.

This is not a bug — code-value review is independent from
column-row terminalization by design (C7-B read-model proves
they are queried separately). C32-A is the slice that closes
that gap.

## Architecture finding: dictionary-loader applies do NOT promote column rows

A second audit finding worth recording as canon: the C-series
dictionary-loader applies (C22-C through C31) promote
**code-value** rows from `Deferred` to `Mapped` and set
`canonical_value` on those rows, but they do NOT touch the
column row's `ReviewStatus` or `CanonicalTarget`. This is
correct C11-B behavior (the CSV scope is `code_value`), and
matches the C-series invariant of operator-only authority on
canonical decisions.

The implication: **eight columns whose code-values have been
dictionary-mapped still have NULL `CanonicalTarget` and
`NeedsReview` status at the column-row level**:

```
imprv_detail.imprv_det_class_cd           (C23-C, 21 code-values mapped)
land_detail.land_soil_code                (C24-C, 35 mapped)
imprv_detail.imprv_det_meth_cd            (C25-C, 10 mapped)
imprv_detail.imprv_det_sub_class_cd       (C26-C,  2 mapped)
imprv.primary_use_cd                      (C27-C, 44 mapped)
property_val.secondary_use_cd             (C28-C,  5 mapped)
imprv.secondary_use_cd                    (C29-C,  1 mapped)
sale.primary_use_cd                       (C30-C, 43 mapped)
```

C32-B will set `CanonicalTarget` (matching the canonical_target
the operator chose at apply time per each column's policy doc)
AND promote `ReviewStatus` to `Mapped` at the column-row level
in a single CSV apply.

## Purpose

Define how column rows can be safely promoted to terminal
status (`Mapped` / `Excluded` / `Deferred`) without implying
unsupported canonical semantics. The policy is operator-driven;
the loader / batch-edit pipeline is mechanical.

The C-series invariant from C22-A ports verbatim: **the
operator is the only entity that promotes a row to a terminal
status**. C32-B is a single CSV that the operator authors and
applies; it does not auto-decide.

## Provenance

- **D0-D — PACS canonical dataflow + identity policy**.
- **C7-B — workbook read-model + status guard** (the read-model
  treats column rows and code-value rows as independent; C32 is
  the column-side completion).
- **C8-A — Sales Qualification Transform Policy**.
  Establishes that transform consumers read column-level
  `(canonical_target, ReviewStatus)` to find the right columns;
  this slice supplies the column-level metadata they consume.
- **C10-A / C10-B — Mapping Workbook Lock policy + CLI**.
  Lock requires every column AND every code-value to be
  terminal. This slice unblocks the column dimension.
- **C11-A — Mapping Workbook batch-edit policy**. The batch-edit
  CSV grammar already supports `scope=column` rows; this slice
  is operationalizing that scope at workbook-wide scale.
- **C13-A → C20-A — per-lane review policies**. These docs
  describe semantic intent for each lane; this slice converts
  that intent into terminal column-row decisions.
- **C22-A → C31-A — dictionary-loader series**. The 9 columns
  with dictionary-mapped code-values are first-class candidates
  for column-row Mapped status (with the canonical_target each
  policy doc named).

## Hard Guards

The five guards below extend the C11-A batch-edit Hard Guards
+ the lock-readiness contract from C10-A. C32-B implementation
must satisfy all of them.

### 1. Operator-only authority

No automatic promotion. The C32-B CSV is operator-authored.
Each row carries an explicit operator decision; no
heuristic infers terminal status from observed state.

### 2. No-guessing guardrails (THREE explicit forbiddens)

The slice card listed these. They are pinned here as Hard
Guards because the temptation to use them is real:

**(a) Mapped status NOT solely from code-value completion.**

A column whose code-values have all been resolved (Mapped /
Excluded / Deferred) is NOT automatically column-Mapped. The
column row's `Mapped` status implies *the operator has chosen
a canonical_target vocabulary for this column and confirmed
that downstream transforms can rely on it*. That decision is
orthogonal to whether the underlying code-values are reviewed.

Example: `imprv.imprv_cmnt` (a free-text comment field) might
have all 53 code-values Deferred (acknowledging the operator
will not canonicalize comment text). The column row should be
**Excluded** or **Deferred**, NOT Mapped — the column has no
canonical-vocabulary intent.

**(b) Mapped status NOT solely from observed counts.**

A high-frequency value distribution does not imply
canonicalization intent. A column with 95% NULL and 5% varied
text is not automatically Mapped; nor is a column with 100%
identical values. The operator decides whether the column has
canonical semantics.

**(c) Mapped status NOT solely from column name.**

`legal_desc_2` is not Mapped because the name suggests
"legal description". `imprv_type_cd` is not Mapped because the
name ends in `_cd`. The operator confirms semantic alignment
explicitly — names hint, but do not authorize.

### 3. Three terminal statuses, three intents

The terminal vocabulary is closed (per C11-A grammar):

| Status | Operator intent | Required fields | Forbidden fields |
|---|---|---|---|
| **Mapped** | "This column carries canonical-vocabulary semantics. Downstream transforms can read it via the named `canonical_target`." | `canonical_target` MUST be set | (none specific) |
| **Excluded** | "This column is out of scope for canonicalization. Downstream transforms must NOT read it. Notes MUST explain why." | `notes` MUST be non-empty and document the rationale | `canonical_target` MUST be null |
| **Deferred** | "This column has been reviewed but the operator chose to defer canonical-vocabulary commitment to a future slice. The column has no transform consumer yet." | `notes` SHOULD document the deferral rationale | `canonical_target` SHOULD be null (operator may set it speculatively but downstream consumers MUST treat null-canonical-value rows as no-data) |

### 4. Code-value preservation

C32-B's CSV mutates `SyncMappingColumn` rows ONLY. Code-value
rows are NOT touched. This is enforced by the
`scope=column` grammar from C11-A: scope=column rows reject
`source_value`, `canonical_value`, `canonical_value_null`,
`is_excluded`. The operator who authors C32-B's CSV must ensure
no row uses `scope=code_value`.

The C32-B run's success-gate verification compares
`SyncMappingCodeValue.UpdatedAt` pre/post — every code-value
row's UpdatedAt must be unchanged.

### 5. Workbook stays Draft

C32-B's apply does NOT lock the workbook. Lock is a separate
slice (C34). C32-B's success means "lock is now possible," not
"lock has happened."

## C32-B CSV Shape

C32-B emits/applies a single CSV with `scope=column` rows
covering **every NeedsReview column**. Per the slice card:

```csv
scope,source_schema,source_table,source_column,source_value,review_status,canonical_target,canonical_value,canonical_value_null,is_excluded,notes
column,dbo,sale,wac_cd,,Mapped,SalesQualification,,,,Sales qualification axis; code-values reviewed separately
column,dbo,sale,sl_ratio_type_cd,,Mapped,SalesQualification,,,,Sales qualification axis; code-values reviewed separately
column,dbo,property_val,property_use_cd,,Mapped,PropertyUse,,,,Dictionary-backed property-use classifier (already at Mapped from seed; row included for explicit re-confirmation)
column,dbo,imprv_detail,imprv_det_class_cd,,Mapped,ImprvDetailClass,,,,Dictionary-backed via C23-C
column,dbo,land_detail,land_soil_code,,Mapped,LandSoil,,,,Dictionary-backed via C24-C
column,dbo,imprv_detail,imprv_det_meth_cd,,Mapped,ImprvDetailMethod,,,,Dictionary-backed via C25-C
column,dbo,imprv_detail,imprv_det_sub_class_cd,,Mapped,ImprvDetailSubClass,,,,Dictionary-backed via C26-C
column,dbo,imprv,primary_use_cd,,Mapped,PropertyUse,,,,Dictionary-backed via C27-C (REUSED canonical_target=PropertyUse)
column,dbo,property_val,secondary_use_cd,,Mapped,PropertySecondaryUse,,,,Dictionary-backed via C28-C
column,dbo,imprv,secondary_use_cd,,Mapped,PropertySecondaryUse,,,,Dictionary-backed via C29-C
column,dbo,sale,primary_use_cd,,Mapped,PropertyUse,,,,Dictionary-backed via C30-C (REUSED canonical_target=PropertyUse, third column)
column,dbo,sale,secondary_use_cd,,Deferred,,,,,Per C31-A zero-observation: column is in scope but no code-values currently observed; deferred until workbook re-profile or cross-county deployment exercises it
column,dbo,property_val,legal_desc_2,,Deferred,,,,,Free-text legal description; no code-value transform policy yet
column,dbo,imprv,imprv_cmnt,,Excluded,,,,,Free-text improvement comment; not canonicalizable; transforms must not read this column
... (one row per remaining NeedsReview column)
```

**Critical**: the CSV has 199 rows (one per NeedsReview column)
plus the optional re-confirmation row for the already-Mapped
property_val.property_use_cd. Total CSV size: 199-200 data rows
+ header.

The CSV is operator-authored. C32-B's *generation* step is a
helper (read-only audit query that produces a draft CSV with
suggested statuses based on per-lane policy hints); the
*authoring* is the operator marking each row's intent. The
*apply* step is the existing C11-B batch-edit pipeline.

### Suggested status hints by lane (operator overrides)

These hints are *suggestions only*; the operator decides per
column. They are NOT auto-applied:

| Lane | Default suggestion | Rationale |
|---|---|---|
| **Valuation** | Mapped (already done) | property_val.property_use_cd already Mapped at seed; column is dictionary-backed |
| **Sales** | Mapped → SalesQualification (for wac_cd + sl_ratio_type_cd) | per C8-A policy; these are the qualification-axis columns |
| **Improvement (Tier 2)** | Mapped → ImprvDetail* | dictionary-backed columns from C23/C25/C26 |
| **Land (with dict)** | Mapped → LandSoil | C24-C target |
| **Neighborhood** | per C20-A — operator-decided | nbhd_descr is text; canonical_target unclear |
| **Other (dictionary-mapped)** | Mapped → matching canonical_target | the C27/C28/C29/C30 columns mis-laned in Other |
| **Other (free-text)** | Excluded with rationale | imprv_cmnt, legal_desc_2, etc. — out of canonical scope |
| **Other (alphanumeric IDs)** | Deferred | ref_id1, mbl_hm_sn_2, etc. — IDs but no canonical-vocabulary intent |
| **Other (audit/admin)** | Excluded with rationale | sup_desc, sup_comment, sup_cd — administrative metadata |

### Per-row required notes language (operator template)

For Mapped rows: "(brief description of the canonical-vocabulary
intent + provenance to the policy slice that defined it)"

For Excluded rows: "(brief reason why the column is out of
canonical scope: free-text, audit-only, administrative,
sale-context-only, etc.) Transforms must not read this column."

For Deferred rows: "(brief reason for deferral: pending future
canonicalization slice, ambiguous semantics, low-priority,
zero-observation per Cxx-A, etc.)"

## Lock-Readiness Proof Gates (C32-B success)

After C32-B applies, the workbook is **lock-ready on the
column dimension**. C32-B's success criteria:

| Gate | Pass criterion |
|---|---|
| **Workbook stays Draft** | `SyncMappingWorkbook.Status = 'Draft'` (C32-B is not a lock). |
| **Audit Stamp Bump** | `1` (single transactional batch). |
| **Per-scope counts** | `column rows: <N>`, `code_value rows: 0`. (The CSV is column-scope only.) |
| **Per-status counts** | sum of `Mapped + Excluded + Deferred` equals the number of CSV rows; `NeedsReview = 0`, `InProgress = 0`. |
| **Column NeedsReview = 0** | Post-apply query against `SyncMappingColumns` for this workbook returns zero NeedsReview rows. |
| **Column InProgress = 0** | (always 0 in this workbook; pinned for safety.) |
| **Code-value preservation** | Every `SyncMappingCodeValue` row's `UpdatedAt` is byte-identical pre/post. |
| **No PACS mutation** | C32-B never touches PACS. |
| **No canonical landing table mutation** | C32-B does not write to any canonical-side table (none exist yet anyway). |
| **No Forge / Atlas / transform-consumer mutation** | C32-B is workbook-only. |
| **No new schema** | C32-B uses the existing `SyncMappingColumn` row shape (no migration). |
| **Excluded rows have notes** | Every row with `review_status=Excluded` MUST have non-empty `notes` per Hard Guard #3. |
| **Mapped rows have canonical_target** | Every row with `review_status=Mapped` MUST have `canonical_target` set per Hard Guard #3. |
| **Deferred rows have null canonical_target** | Every row with `review_status=Deferred` SHOULD have `canonical_target` empty (a Deferred row with a canonical_target hints that the operator could have set Mapped; the deferral is then a pacing decision, not a vocabulary decision). |

## Lock Sequence Map (after C32-B passes)

```
C32-B passes          → all 199 column rows terminal
                       → workbook Draft + 0 column NeedsReview
                       → still 1225 code-value NeedsReview blocking lock

C33 (next slice)      → code-value Defer-by-default sweep for the
                        ~1131 Other-lane NeedsReview rows + the 94
                        Neighborhood NeedsReview rows.

C34 (after C33)       → C10-B lock CLI invocation. Workbook Draft → Mapped.

C35-A                 → canonical landing schema design (sales-qualification
                        first; per the audit's Path 1 step 5).

C36                   → C8-B Sales Qualification Transform implementation
                        (already designed at C8-A).

C37                   → first comp-filter end-to-end proof (operator's
                        "WacCd bug blocks all comps" memory satisfied).
```

## Hard Non-Goals

| Non-goal | Rationale |
|---|---|
| Auto-promote any column row to terminal | Operator authors the CSV; no heuristic decides. |
| Lock the workbook | Lock is C34, not C32-B. |
| Run any transform | Transforms come at C36 onwards. |
| Mutate code-value rows | C32-B is column-scope only; code-value preservation is a Hard Guard. |
| Mutate PACS | Read-only by policy. |
| Add schema (new columns, new tables) | C32-B uses existing `SyncMappingColumn` row shape. |
| Define canonical landing tables | That's C35-A. |
| Modify per-lane review policies (C13/C16/C17/C19/C20) | Those policies define semantic intent per lane; C32 operationalizes them at column scope without amending. |
| Modify the C-series dictionary-loader policies (C22-C31) | C32-B sets `CanonicalTarget` on the column rows the dictionary-loaders mapped at code-value scope, but does NOT touch the per-loader policy contracts. |
| Promote a column to Mapped on speculation | Operator decides each row; defaults are *suggestions* in this doc, not decisions. |
| Cross-county vocabulary import | Per-PACS-instance variation per D0-D. |

## Success Gates for C32-A (this slice)

This slice is docs-only. Gates:

| Gate | Pass criterion |
|---|---|
| **Policy doc lands** | `docs/sync/mapping-workbook-column-terminalization-policy.md` (NEW, this file). |
| **Three terminal statuses defined** | Mapped, Excluded, Deferred with required/forbidden fields per status. |
| **Three no-guessing guardrails defined** | Code-value-completion / observed-counts / column-name not sufficient for Mapped. |
| **C32-B CSV shape defined** | scope=column row template + suggested status by lane. |
| **Lock-readiness proof gates defined** | C32-B success criteria + the gates the lock CLI (C10-B) will then check. |
| **Preservation checks defined** | Code-value UpdatedAt unchanged + workbook stays Draft + no PACS / canonical / Forge / Atlas mutation. |

## Success Gates for C32-B (next slice)

| Gate | Pass criterion |
|---|---|
| **Operator-authored CSV exists** | Per the C32-B CSV shape; operator decisions per row. |
| **Apply succeeds** | C11-B batch-edit `--apply` returns success; per-status counts match the CSV. |
| **Column NeedsReview = 0** | Post-apply audit query confirms. |
| **Code-value preservation** | Pre/post UpdatedAt diff on `SyncMappingCodeValues` is empty. |
| **Workbook stays Draft** | `SyncMappingWorkbook.Status = 'Draft'` post-apply. |
| **All Mapped rows have canonical_target** | Audit query: zero rows with `ReviewStatus='Mapped' AND CanonicalTarget IS NULL`. |
| **All Excluded rows have notes** | Audit query: zero rows with `ReviewStatus='Excluded' AND (Notes IS NULL OR Notes='')`. |
| **C-series dictionary alignment** | The 8 dictionary-mapped columns from C23/C24/C25/C26/C27/C28/C29/C30 carry the canonical_target named in their respective policy docs. |
| **Lock-CLI dry-run** | A dry-run of `--lock-mapping-workbook` after C32-B should fail ONLY because of remaining NeedsReview *code-value* rows (not column rows). The diagnostic message should not mention any column row. |

## Recommended pacing

- **C32-B** (next slice) — author the column-only CSV (helper
  generates a draft from per-lane suggestions; operator
  reviews row-by-row and confirms each); apply via C11-B;
  verify gates above.
- **C33** (after C32-B) — code-value Defer-by-default sweep
  for remaining ~1225 NeedsReview code-values.
- **C34** — invoke C10-B lock CLI; workbook Draft → Mapped.

## What This Slice Is

The eleventh sync-side policy in TerraFusion (after 10
dictionary-loader policies). The first **column-row
terminalization** policy. Documents the contract for promoting
all 199 NeedsReview column rows to terminal status without
auto-deciding canonical vocabularies. Required for lock; lock
is required for transform consumption.

## What This Slice Is Not

A loader. A workbook write. A code change. A schema migration.
A canonical landing table design. A lock invocation. A
transform implementation. An amendment to any prior C-series
policy.

## Related policy memory

| Doc | Layer |
|---|---|
| `docs/sync/mapping-workbook-batch-edit-policy.md` (C11-A) | the batch-edit grammar this slice operationalizes at column scope |
| `docs/sync/mapping-workbook-edit-cli-policy.md` (C9-A) | per-row edit semantics |
| `docs/sync/mapping-workbook-lock-cli-policy.md` (C10-A) | the lock contract this slice unblocks |
| `docs/sync/mapping-workbook-review-progress-policy.md` (C14-A) | how progress is reported (will need a column-dimension addition post-C32-B) |
| `docs/sync/sales-review-csv-policy.md` (C13-A) | sales-lane review intent (informs Sales column suggestions) |
| `docs/sync/valuation-review-csv-policy.md` (C16-A) | valuation-lane review intent |
| `docs/sync/improvement-review-csv-policy.md` (C17-A) | improvement-lane review intent |
| `docs/sync/land-review-csv-policy.md` (C19-A) | land-lane review intent |
| `docs/sync/neighborhood-review-csv-policy.md` (C20-A) | neighborhood-lane review intent |
| `docs/sync/sales-qualification-transform-policy.md` (C8-A) | the first downstream consumer; informs Sales canonical_target=SalesQualification |
| `docs/sync/property-use-dictionary-loader-policy.md` (C22-A) | first dictionary-loader policy — provides canonical_target=PropertyUse |
| `docs/sync/imprv-det-class-dictionary-loader-policy.md` (C23-A) | provides canonical_target=ImprvDetailClass |
| `docs/sync/land-soil-dictionary-loader-policy.md` (C24-A) | provides canonical_target=LandSoil |
| `docs/sync/imprv-det-meth-dictionary-loader-policy.md` (C25-A) | provides canonical_target=ImprvDetailMethod |
| `docs/sync/imprv-det-sub-class-dictionary-loader-policy.md` (C26-A) | provides canonical_target=ImprvDetailSubClass |
| `docs/sync/imprv-primary-use-dictionary-loader-policy.md` (C27-A) | reuses canonical_target=PropertyUse |
| `docs/sync/property-val-secondary-use-dictionary-loader-policy.md` (C28-A) | introduces canonical_target=PropertySecondaryUse |
| `docs/sync/imprv-secondary-use-dictionary-loader-policy.md` (C29-A) | reuses canonical_target=PropertySecondaryUse |
| `docs/sync/sale-primary-use-dictionary-loader-policy.md` (C30-A) | reuses canonical_target=PropertyUse (third column) |
| `docs/sync/sale-secondary-use-dictionary-loader-policy.md` (C31-A) | zero-observation; Deferred at C32-B |
| **`docs/sync/mapping-workbook-column-terminalization-policy.md` (C32-A)** | **this doc — column-row terminalization; bridge from code-value review to lock-readiness** |
