# `imprv.primary_use_cd` Dictionary Loader Policy

**Slice:** C27-A (docs-only — defines the contract for C27-B
implementation: read-only loader that proposes a review CSV by
joining the workbook's 44 `imprv.primary_use_cd` code-values
against PACS's existing `dbo.property_use` dictionary. C27-C
will apply the operator-approved CSV via the existing C11-B
batch-edit pipeline).
**Lifecycle layer:** dictionary-assisted review for an
Improvement-level "primary use" axis using the *already-proven*
`property_use` dictionary. Sits one level above any future
`imprv.primary_use_cd`-aware sweep slice and one level below
any future Improvement-lane canonicalization consumer.
**Status:** policy locked; lane reclassification + sweep are
explicit C27-B preconditions; live inspection NOT required
(dictionary already inspected at C22-B-live); implementation
deferred to C27-B; CSV apply deferred to C27-C.

## Architectural significance

C27 is the **first dictionary-reuse slice** in the C-series.
C22 through C26 each introduced a new PACS dictionary table.
C27 introduces a new *workbook column* but reuses the existing
`dbo.property_use` dictionary that C22 already proved. This
exercises a property of the C23-B generalized
`DictionaryLoaderService` that has not yet been tested against
real workbook state: that the same `(PacsDictionarySchema,
PacsDictionaryTable, CodeColumn, DescriptionColumn)` tuple can
serve **two distinct workbook columns** via two distinct
`DictionaryLoaderTargetConfig` entries — one workbook target per
config, sharing the dictionary-side configuration.

Practical implication: future workbook columns whose values fall
in the DOR PUC vocabulary (e.g. `sale.primary_use_cd`,
`property_val.secondary_use_cd`, etc.) become Program.cs
config-branch additions only — no new dictionary inspection, no
new test scaffolding required at the dictionary level.

## Structural Blocker (parked target): `imprv_det_type_cd`

`dbo.imprv_detail.imprv_det_type_cd` is a known PACS column
documented in C17-A3 with operator-confirmed Benton values
(`MA`, `BSMT`, `U-BSMT`, `ATTGAR`, `DETGAR`, `carport`,
`polebldg`). It was the slice card's originally proposed C27-A
target. **However**, a pre-policy audit on workbook
`a767c8a2-5b8a-4846-af8b-c3496601e924` revealed:

```
SELECT COUNT(*) FROM "SyncMappingColumns"
  WHERE "WorkbookId" = 'a767c8a2-...'
    AND "SourceColumn" = 'imprv_det_type_cd';
-- → 0
```

The workbook never tracked this column. The profile slice that
seeded the workbook's column scope did not include
`imprv_detail.imprv_det_type_cd`. Therefore C27-A *cannot*
target it without a precondition slice (call it C27-Pre or
similar) that extends the workbook's column scope by re-running
the profile against the missing column.

**Decision (per the slice card)**: C27-Pre is **parked**. C27-A
pivots to `imprv.primary_use_cd`, which already exists in the
workbook with 44 code-values. The audit finding itself becomes
canon — no future "imprv_det_type" slice may run until the
workbook is extended.

## Provenance

- **D0-D — PACS canonical dataflow + identity policy**
  (`docs/sync/pacs-canonical-dataflow-identity-policy.md`).
- **C17-A → C17-D — Improvement-lane review** + C17-A3 amendment
  documenting Benton's `imprv_det_type_cd` values; same
  amendment also flagged `imprv.primary_use_cd` as a Tier 1
  improvement column whose lane assignment ("Improvement"
  vs "Other") was operator-pending.
- **C21-A — PACS canonical dictionaries reference**.
  Catalogs `property_use` as the canonical dictionary for
  `property_val.property_use_cd` *and* parallel columns
  carrying DOR PUC codes — explicitly including the
  improvement-side primary-use columns.
- **C22-A → C22-C — first dictionary-aware Mapped promotion**
  (`docs/sync/property-use-dictionary-loader-policy.md`).
  Established the architecture this slice inherits + already
  inspected `dbo.property_use` live (C22-B-live captured the
  schema: `property_use_cd`, `property_use_desc`, no
  `sys_flag`, no year column, 85 rows). **C27-B inherits that
  inspection unchanged — no second live-inspection of the same
  dictionary table is required.**
- **C23-A → C26-C — dictionary-loader generalization** + four
  applications across `imprv_det_class`, `land_soil`,
  `imprv_det_meth`, `imprv_det_sub_class`. Five wrong-assumption
  catches by the live-inspection gate. C27-B is the first slice
  where the gate does NOT need to fire (target dictionary already
  inspected), proving the gate's per-dictionary scope is correct.
- **C25-B operational finding**: P1 (lane reclassification) is
  workbook hygiene, NOT a loader precondition. The loader joins
  by `SourceColumn`, not by lane. C27-A inherits this finding.
- **PACS canonical code-table catalog** (`Queries for all Codes
  in PACS (1).doc`, eflowers, 2017-11-29):
  > `-- Property Use Codes`
  > `select * from property_use`
  Already enumerated at C22-A. No new query class introduced.

## Purpose

Define how a future loader (C27-B) joins the workbook's 44
`imprv.primary_use_cd` code-values against PACS's
`dbo.property_use` dictionary (already inspected at C22-B-live)
and **proposes** a review CSV for operator approval — without
directly mutating the workbook, PACS, the canonical landing
tables, or any downstream consumer.

The C-series invariant from C22-A holds verbatim: the dictionary
is *evidence*, not *authority*. The operator stays the only
entity that promotes a row to a terminal status.

## Architectural distinction: primary_use vs property_use

PACS carries DOR Property Use Codes (PUCs) on multiple tables:

- `property_val.property_use_cd` — primary-use code at the
  property valuation level. **Already complete** at C22-C
  (62 rows mapped via `property_use` dictionary).
- **`imprv.primary_use_cd` — primary-use code at the
  improvement (building) level.** **This slice's target.**
- `sale.primary_use_cd` — primary-use code captured on the sale
  record at sale time. Future slice.
- `property_val.secondary_use_cd` — secondary classification
  (typically a finer-grained refinement). Future slice.

All four columns draw from the same DOR PUC vocabulary, so the
same `dbo.property_use` dictionary serves as the evidence
source for all four. C27-A is the first slice to exercise
that reuse explicitly.

## Architectural note: terminal-count vs canonical-quality

Per C22-C / C23-C / C24-C / C25-C / C26-C: promoting
`Deferred → Mapped` improves **semantic quality** but does NOT
change the workbook's **terminal-count math**. Lock-readiness
blockers are unchanged by C27-C's apply.

C27-C upgrades up to 44 rows from status-terminal-only (post-P2)
to status-and-canonical-terminal.

## Preconditions for C27-B (inherits C25-A / C26-A pattern)

Per C25-A and C26-A: the loader filters by `Deferred` status
and joins by `SourceColumn`, not by lane. Two preconditions
apply, but only one is required for the loader to function.

### Precondition P1 — Lane reclassification (DEFERRED, per C25-B finding)

`SyncMappingColumns.MappingLane` for the
`imprv.primary_use_cd` column is currently `Other`. **Per C25-B's
operational finding, this is workbook hygiene, NOT a loader
precondition.** The loader joins by `SourceColumn`, not lane.

C27-B may proceed without P1 satisfied. The "lane hygiene"
slice that batches all four lane-mismatched columns
(`imprv_det_meth_cd` + `imprv_det_sub_class_cd` +
`imprv.primary_use_cd` + future `imprv_det_type_cd`) stays
parked.

### Precondition P2 — Defer-by-default sweep (REQUIRED)

The 44 `NeedsReview` code-values must transition to `Deferred`
status before the loader will propose anything. The sweep is a
44-row CSV processed through C11-B batch-edit `--apply` —
identical pattern to C17-A → C17-D and to C25-B / C26-B's P2
steps.

### Precondition gate

C27-B's loader run **shall produce a `Workbook Deferred rows
scanned: 0` summary if P2 is not met**, and shall not silently
regress to scanning `NeedsReview` rows.

## Source and Target

| Role | Identity |
|---|---|
| Dictionary source | `dbo.property_use` (in PACS `pacs_oltp` database; SQL Server) |
| Dictionary inspection | **already complete at C22-B-live** — no second inspection required |
| Workbook source column | `dbo.imprv.primary_use_cd` |
| Workbook column scope | Currently `Other` lane (P1 deferred); column row currently `NeedsReview` |
| Workbook code-value scope | 44 rows, all currently `NeedsReview` (P2: sweep to `Deferred`) |
| Canonical target | `PropertyUse` (REUSED from C22-C — proves vocabulary reuse) |
| Currently observed codes | `11`, `12`, `13`, `14`, `15`, `16`, `17`, `18`, `21`, `31-34`, `37`, `39`, `41`, `43`, `46-48`, `51-55`, `58`, `59`, `61-69`, `72`, `74`, `77`, `81-83`, `86`, `91` (44 distinct numeric DOR PUC codes) |

### Canonical-target reuse decision

`canonical_target = "PropertyUse"` is the same vocabulary used
at C22-C for `property_val.property_use_cd`. Both columns hold
DOR Property Use Codes, so the canonical-value namespace is
shared.

This means a future canonical-value consumer reading the workbook
will see the same `(canonical_target=PropertyUse, canonical_value=...)`
surface for **both** `property_val.property_use_cd` AND
`imprv.primary_use_cd`. Operator confirmation at C27-C may
choose to:

1. Accept the dictionary description verbatim (same as C22-C —
   "Single Family Residential" etc.).
2. Match the canonical_value to whatever C22-C used for the
   same code (so '11' on both columns maps to the same
   canonical_value string).
3. Diverge if the operator's semantic intent is different at
   the improvement level vs the property-valuation level.

The loader does NOT enforce reuse of C22-C's canonical_values
— it proposes the dictionary description, same as for any
other Mapped row. The operator's review at C27-C is where
cross-column consistency is decided.

### Out of scope (this slice)

- `dbo.property_val.property_use_cd` — covered by C22-A (62 rows
  already Mapped).
- `dbo.sale.primary_use_cd` — separate workbook column (43
  NeedsReview); future slice.
- `dbo.property_val.secondary_use_cd` — separate workbook column
  (5 NeedsReview); future slice.
- `dbo.imprv.imprv_type_cd` — different column (6 NeedsReview);
  not a primary-use column; future slice.
- `dbo.imprv_detail.imprv_det_type_cd` — **structurally blocked**
  per the audit at the top of this doc; future C27-Pre slice.
- Marshall & Swift cost-schedule references — disabled per D0-D.

## Hard Guards

The five guards below extend the C11-A batch-edit Hard Guards +
the C22-A through C26-A dictionary-loader Hard Guards with
C27-specific safety. C27-B implementation must satisfy all of
them.

### 1. Read PACS, never write

Inherited verbatim. Every PACS query is `SELECT`-only.

### 2. Read-only workbook surface

Inherited verbatim. C27-B's loader does not call
`SaveChangesAsync` against the workbook DbContext.

### 3. No autodetection / no inferred canonical labels

Inherited verbatim. **Particularly relevant for this slice**:
the loader does NOT cross-reference C22-C's canonical_values
to "auto-fill" canonical_values for matching codes on
`imprv.primary_use_cd`. Each row's proposed `canonical_value`
comes from the dictionary description column — same path as
every other M5 row. The operator decides at C27-C whether to
align with C22-C's canonical-value choices.

### 4. No second live-inspection (special to this slice)

Per C21-A and C22-A: `dbo.property_use` was already inspected
at C22-B-live. The schema captured there
(`property_use_cd` / `property_use_desc`, no `sys_flag`, no
year column, 85 rows) is operative for C27-B without
re-inspection. **This is the first slice to exercise the
"per-dictionary inspection scope" property** of the
live-inspection gate: the gate fires once per dictionary, not
once per workbook column.

If a future county's PACS instance has a different
`property_use` schema, that's a per-county-deployment override,
not a per-slice override.

### 5. Allowlisted dictionary table — no new entry

The allowlist `property_use ∪ imprv_det_class ∪ land_soil ∪
imprv_det_meth ∪ imprv_det_sub_class` already includes
`property_use`. **C27-B does NOT add to the allowlist** —
this is the first dictionary-reuse slice. The allowlist
expansion is the C-series test of "new PACS dictionary
introduced"; C27 is the test of "existing PACS dictionary
applied to a new workbook column", a structurally distinct
scenario.

## Mismatch Rules

When C27-B runs (after P2 is met), the same five mismatch
shapes from C22-A apply.

### Rule M1 — Workbook code present, dictionary code missing

Workbook has `imprv.primary_use_cd = 'X'` but
`dbo.property_use` has no row with that code.

**Output**: `review_status=Deferred` with notes documenting the
data-integrity issue + 2017 conversion caveat + a Land/Improvement
expectation note: "Note: PACS DOR PUC vocabulary is shared with
property_val.property_use_cd; if this code was successfully
mapped at C22-C against `property_val.property_use_cd`, its
absence here may indicate a 2017-conversion-era divergence
between the two columns."

### Rule M2 — Dictionary code present, workbook code absent

Dictionary has codes the workbook never observed for this column
specifically.

**Output**: row is **NOT included** in the review CSV.

### Rule M3 — Duplicate dictionary code

Dictionary has multiple rows with the same code.

**Output**: `review_status=Deferred` with notes naming the
ambiguous matches.

### Rule M4 — Inactive dictionary row

Dictionary has the code but it's marked inactive. Per
C22-B-live: the live `dbo.property_use` instance has no usable
active flag, so M4 cannot fire against this PACS instance. C27-B
inherits the same null active-flag predicate.

### Rule M5 — Clean match (the happy path)

Workbook has `imprv.primary_use_cd = 'W'` and
`dbo.property_use` has **exactly one active** row with that
code.

**Output**: `review_status=Mapped` with the dictionary's
description as `canonical_value`,
`canonical_target=PropertyUse`, notes documenting the match +
2017 conversion caveat.

## Review CSV Output Shape

C27-B's loader produces a CSV in the C11-A grammar:

```text
scope,source_schema,source_table,source_column,source_value,review_status,canonical_target,canonical_value,canonical_value_null,is_excluded,notes
```

For each of the up-to-44 Deferred workbook rows (post-P2), the
loader proposes exactly one CSV row classified per M1-M5.
Output lands at:

```text
backend/artifacts/sync-atlas/c27-b/<run-id>/imprv_primary_use-proposed-review.csv
backend/artifacts/sync-atlas/c27-b/<run-id>/imprv_primary_use-mismatch-report.md
backend/artifacts/sync-atlas/c27-b/<run-id>/loader-run.txt
```

**No `dictionary-inspection.txt`** — the dictionary is the
already-inspected `dbo.property_use` from C22-B-live. The
loader run text references the prior inspection by run-id for
audit trail.

The CSV is **not committed**. It's operator-reviewable, then
fed into C11-B's `--batch-edit-mapping-workbook --apply`
pipeline at C27-C. C27-A and C27-B together do not touch a
workbook row that wasn't already moved by P2.

## RFC 4180 quoting

Inherited from C17-A2 / C19-B / C20-A / C22-A through C26-A.

## Pre-2017 Conversion Caveat (cross-reference)

Same as C22-A through C26-A. With the additional cross-column
note: pre-2017 records may carry `imprv.primary_use_cd` values
whose semantics differ from the 2017+ DOR PUC interpretation
*and* may not align with the 2017+ value on the same parcel's
`property_val.property_use_cd`. Operator confirms during C27-C
review whether the historical mapping should be
canonical-aligned with C22-C's values or kept distinct.

## Audit Expectations

### What C27-B produces (read-only loader)

```text
backend/artifacts/sync-atlas/c27-b/<run-id>/
├── workbook-pre-state.txt                          # Confirms P2 met
├── imprv_primary_use-proposed-review.csv           # Proposed review CSV
├── imprv_primary_use-mismatch-report.md            # M1-M5 counts + samples
└── loader-run.txt                                  # CLI stdout (references C22-B-live inspection by run-id)
```

None committed. `backend/artifacts/` is gitignored.

### What C27-B does NOT produce

- No workbook row mutations.
- No PACS row mutations.
- No `SaveChangesAsync` calls.
- No PostgreSQL writes.
- No automatic precondition mutation (P2 is operator-driven C11-B,
  not a loader side-effect).
- No second live-inspection of `dbo.property_use`.

### What C27-C eventually does (separate slice)

- Operator reviews `imprv_primary_use-proposed-review.csv`.
- Operator may choose to align canonical_values with C22-C's
  choices for matching codes (cross-column consistency), or
  to keep them distinct.
- Operator runs `--batch-edit-mapping-workbook --apply` against
  the operator-approved CSV via the existing C11-B path.
- Up to 44 Deferred rows convert to whatever terminal status
  the operator confirms.

## Hard Non-Goals

| Non-goal | Rationale |
|---|---|
| **Auto-promote workbook rows to Mapped without operator approval** | Dictionary is evidence, not authority. |
| **Auto-fill canonical_values from C22-C's mappings** | Each row's proposed canonical_value comes from the dictionary description, not from cross-column lookup. Cross-column consistency is the operator's decision. |
| **Run the precondition Defer-by-default sweep as a loader side-effect** | P2 is an explicit operator-driven C11-B operation. |
| **Apply dictionary to other DOR-PUC-bearing columns in this slice** | `sale.primary_use_cd`, `property_val.secondary_use_cd` each need their own slice. |
| **Re-inspect `dbo.property_use`** | Already inspected at C22-B-live; per-dictionary inspection scope. |
| **Add `property_use` to the allowlist twice** | The allowlist already includes it. |
| **Profile or extend the workbook to add `imprv_det_type_cd`** | Out of scope; explicitly parked as C27-Pre. |
| **Pull Marshall & Swift cost-schedule references** | M&S integration disabled per D0-D. |
| **Mutate PACS rows** | Read-only by policy. |
| **Run a recalc / canonicalize / qualify-sales side effect** | Decoupled by design. |
| **Skip precondition P2** | The loader produces 0 rows until code-values are `Deferred`. |
| **Require P1 (lane reclassification)** | Per C25-B finding: P1 is workbook hygiene, not a loader precondition. |
| **Cross-county vocabulary import** | Per-PACS-instance variation per D0-D. |

## Success Gates for C27-B (loader implementation slice)

| Gate | Pass criterion |
|---|---|
| **No new live-inspection performed** | C27-B does NOT re-query `dbo.property_use`'s schema; it inherits the C22-B-live findings. |
| **No allowlist change** | `IsAllowedPacsDictionaryTable` is unchanged; `property_use` is already allowlisted. |
| **P2 documented** | `workbook-pre-state.txt` confirms all in-scope code-values in `Deferred` status. If not met, loader produces zero proposed rows + diagnostic. |
| **Loader runs read-only** | C27-B run produces zero workbook mutations and zero PACS mutations. |
| **Up to 44 rows classified** | Output CSV accounts for all in-scope workbook Deferred rows. M1+M3+M4+M5 sum equals the in-scope count. |
| **No `Mapped` without dictionary match** | Every Mapped row has a corresponding active, unambiguous dictionary row. |
| **No cross-column auto-fill** | Loader's M5 path proposes the dictionary description verbatim; does NOT consult C22-C's prior canonical_values for matching codes. Test pin: a unit test exercises overlap with C22's '11' / '21' / '83' codes and asserts the proposed canonical_value comes from the dictionary description, not from a C22-C mapping table. |
| **RFC 4180 compliance** | CSV passes the C11-B parser's dry-run validation step. |
| **All prior C-series anchors preserved** | Every C22-C / C23-C / C24-C / C25-C / C26-C anchor row byte-for-byte unchanged. |
| **No new service class** | C27-B exercises the C23-B generalized `DictionaryLoaderService` with a sixth target config — Program.cs config branch + new test file only. |
| **Dictionary-reuse explicit** | New test file `ImprvPrimaryUseDictionaryLoaderTests` includes a test that asserts `Target.CanonicalTargetName == "PropertyUse"` (same as C22) AND `Target.PacsDictionaryTable == "property_use"` (reuse), proving the dictionary-reuse pattern in code. |
| **Leak scan clean** | No PACS credentials / API keys in any artifact. |

## Success Gates for C27-C (operator-approve-and-apply slice)

| Gate | Pass criterion |
|---|---|
| **Workbook stays Draft** | C27-C apply does not lock. |
| **Exact mutation count** | `Audit Stamp Bump: 1`; exactly the in-scope row count mutated (≤44). |
| **All other lanes preserved** | All anchor lanes byte-for-byte unchanged. |
| **imprv.primary_use_cd column-row preserved** | Column row stays at its post-P2 status; CSV mutates code-value rows only. |
| **PropertyUse vocabulary consistency (operator-discretion)** | Where the operator chose to align with C22-C's canonical_values, the alignment is explicit in the CSV's notes column for each row. |

## Recommended pacing

Per the C22 through C26 series precedent + C27-specific scope:

- **C27-B** — P2 sweep (44-row CSV) + Program.cs config branch +
  `ImprvPrimaryUseDictionaryLoaderTests` + read-only proposal
  generation. Same fold-in-one-session pattern as C25-B / C26-B.
  ~6-9 unit tests against InMemory + stub reader. **No new
  service class. No new live-inspection. No allowlist change.**
- **C27-C** — operator review + apply. Operator may choose
  cross-column alignment with C22-C's canonical_values; the
  CSV's notes column documents each alignment choice.

## What This Enables (non-binding)

- **C27-B** — the actual loader run. Inherits this slice's
  mismatch rules, output shape, P2 precondition, and dictionary-
  reuse language.
- **C27-C** — operator-driven CSV review and apply, with
  optional cross-column canonical-value alignment.
- **C28+** — the same dictionary-reuse pattern applied to:
  - `sale.primary_use_cd` (43 NeedsReview, Other lane)
  - `property_val.secondary_use_cd` (5 NeedsReview, Other lane)
- **C27-Pre (parked)** — workbook profile extension to include
  `imprv_detail.imprv_det_type_cd`. Required before any
  `imprv_det_type` dictionary slice can run.
- **Lane hygiene slice** — extend C11-B grammar to support
  `mapping_lane`, then batch-reclassify all four lane-mismatched
  Improvement-domain columns at once
  (`imprv_det_meth_cd` + `imprv_det_sub_class_cd` +
  `imprv.primary_use_cd` + future `imprv_det_type_cd`).

## Hard Non-Goals (recap)

This doc explicitly does NOT:

- Modify any workbook row.
- Change C3-loader behavior.
- Promote any code-value to a terminal status.
- Build or change any code.
- Touch the running PACS sync service install.
- Pick which county to onboard next.
- Mandate cross-column canonical-value alignment with C22-C
  (operator-defined at C27-C).
- Auto-execute the Defer-by-default sweep precondition.
- Re-inspect `dbo.property_use`.
- Profile `imprv_detail.imprv_det_type_cd` into the workbook.

## What This Slice Is

The sixth dictionary-aware policy in TerraFusion, and the FIRST
**dictionary-reuse** slice. C22-A through C26-A each introduced
a new PACS dictionary table; C27-A introduces a new workbook
column that reuses an already-proven dictionary. This proves
the per-target-config / per-dictionary-config separation of
concerns built into the C23-B generalized service.

## What This Slice Is Not

A loader. A workbook write. A code change. A schema migration.
A canonical-vocabulary commitment beyond what the
operator-confirmed C27-C apply produces. A re-inspection of
`dbo.property_use`. An allowlist amendment. A workbook profile
extension. A coverage expansion to other DOR-PUC-bearing
columns.

## Related policy memory

| Doc | Layer |
|---|---|
| `docs/sync/sales-review-csv-policy.md` (C13-A + amendment) | sales-lane review contract + 2017 caveat |
| `docs/sync/valuation-review-csv-policy.md` (C16-A) | valuation-lane review contract |
| `docs/sync/improvement-review-csv-policy.md` (C17-A + A2 + A3) | improvement-lane three-tier contract + i_attr_id mappings + lane-mismatch acknowledgment + `imprv.primary_use_cd` lane-pending flag |
| `docs/sync/land-review-csv-policy.md` (C19-A) | land-lane review contract + RCW 84.34 |
| `docs/sync/neighborhood-review-csv-policy.md` (C20-A + A2) | neighborhood-lane contract + hood_cd domain truth |
| `docs/sync/mapping-workbook-batch-edit-policy.md` (C11-A) | the batch-edit grammar this slice's CSV is fed into at C27-C |
| `docs/sync/pacs-canonical-dictionaries-reference.md` (C21-A) | PACS dictionary catalog |
| `docs/sync/pacs-canonical-dataflow-identity-policy.md` (D0-D) | identity / dataflow / cache rules |
| `docs/sync/property-use-dictionary-loader-policy.md` (C22-A) | **first dictionary-loader policy — provides the inspection + allowlist entry C27 reuses** |
| `docs/sync/imprv-det-class-dictionary-loader-policy.md` (C23-A) | second dictionary-loader policy — generalized service |
| `docs/sync/land-soil-dictionary-loader-policy.md` (C24-A) | third dictionary-loader policy — RCW 84.34-sensitive |
| `docs/sync/imprv-det-meth-dictionary-loader-policy.md` (C25-A) | fourth dictionary-loader policy — precondition gate language |
| `docs/sync/imprv-det-sub-class-dictionary-loader-policy.md` (C26-A) | fifth dictionary-loader policy — special-character codes |
| **`docs/sync/imprv-primary-use-dictionary-loader-policy.md` (C27-A)** | **this doc — sixth dictionary-aware slice; first dictionary-reuse slice** |
