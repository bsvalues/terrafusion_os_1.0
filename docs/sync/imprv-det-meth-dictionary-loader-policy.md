# `imprv_det_meth` Dictionary Loader Policy

**Slice:** C25-A (docs-only — defines the contract for C25-B
implementation: read-only loader that proposes a review CSV by
joining the workbook's 10 `imprv_det_meth_cd` code-values against
PACS's `dbo.imprv_det_meth` dictionary. C25-C will apply the
operator-approved CSV via the existing C11-B batch-edit pipeline).
**Lifecycle layer:** dictionary-assisted review for the Improvement
lane's "calculation method" axis. Sits one level above any future
`imprv_det_meth`-aware sweep slice and one level below any future
Improvement-lane canonicalization consumer.
**Status:** policy locked; lane reclassification + sweep are
explicit C25-B preconditions; live inspection + implementation
deferred to C25-B; CSV apply deferred to C25-C.

## Provenance

- **D0-D — PACS canonical dataflow + identity policy**
  (`docs/sync/pacs-canonical-dataflow-identity-policy.md`).
  Establishes property identity composite, year-keyed dictionary
  pattern, no autodetection, allowlisted dictionary tables.
- **C17-A → C17-D — Improvement-lane review** closed three
  Improvement Tier 1/2 columns; C17-A3 explicitly noted that
  several `imprv_detail` columns (including `imprv_det_meth_cd`,
  `imprv_det_type_cd`) are currently lane-mismatched in the
  workbook (sitting in `Other`, not `Improvement`) and need a
  separate slice for both lane reclassification + dictionary
  load. C25 honors that observation.
- **C21-A — PACS canonical dictionaries reference**
  (`docs/sync/pacs-canonical-dictionaries-reference.md`).
  Catalogs `imprv_det_meth` as the canonical dictionary for
  `imprv_detail.imprv_det_meth_cd`.
- **C22-A → C22-C — first dictionary-aware Mapped promotion**
  (`docs/sync/property-use-dictionary-loader-policy.md`).
  Established the architecture this slice inherits: M1-M5
  mismatch rules, RFC 4180 quoting, read-only loader, artifact
  emission, operator-approved CSV via C11-B batch edit.
- **C23-A → C23-C — second dictionary-aware Mapped promotion**
  (`docs/sync/imprv-det-class-dictionary-loader-policy.md`).
  Generalized the loader into a target-config-driven
  `DictionaryLoaderService`. Confirmed the architecture extends
  to a different Improvement-lane axis (class vs method).
- **C24-A → C24-C — third dictionary-aware Mapped promotion**
  (`docs/sync/land-soil-dictionary-loader-policy.md`).
  Extended the architecture to a tax-sensitive Land-lane domain.
  Verified that future dictionary slices add zero new service
  classes (Program.cs config branch + new test file only).
- **C22-B-live + C23-B-live + C24-B-live operational lessons**:
  pre-inspection defaults were wrong three times in a row
  (`sys_flag` on property_use; `imprv_det_class_desc` vs
  `imprv_det_cls_desc`; `land_soil_code` vs Hungarian
  `szLandSoilCode`). C25-A inherits the same hard rule:
  **NO hardcoded column names; every default in C25-B must
  trace to a captured live inspection of `dbo.imprv_det_meth`.**
- **PACS canonical code-table catalog** (`Queries for all Codes
  in PACS (1).doc`, eflowers, 2017-11-29):
  > `-- Improvement Detail Method Codes`
  > `select * from imprv_det_meth`
  Operator-confirmed that `imprv_det_meth` is the dictionary
  table PACS clients are expected to enumerate.

## Purpose

Define how a future loader (C25-B) inspects `dbo.imprv_det_meth`
in PACS, matches its rows to the workbook's 10
`imprv_det_meth_cd` code-values, and **proposes** a review CSV
for operator approval — without directly mutating the workbook,
PACS, the canonical landing tables, or any downstream consumer.

The C-series invariant from C22-A holds verbatim: the dictionary
is *evidence*, not *authority*. The operator stays the only entity
that promotes a row to a terminal status.

## Architectural distinction: method vs class

Within `imprv_detail`, the workbook tracks several closely related
code columns. Per C17-A3 and C23-A, this slice is precise about
which one it covers:

- `imprv_det_class_cd` — *what kind of improvement-detail this
  is* (construction class / quality grade).
  **Already complete** at C23-C (21 rows mapped via dictionary).
- **`imprv_det_meth_cd` — *how the improvement-detail's value is
  calculated* (calculation method axis).** **This slice's target.**
- `imprv_det_sub_class_cd` — sub-class refinement; future slice.
- `imprv_det_type_cd` — improvement type (MA / BSMT / ATTGAR /
  POLEBLDG); separate slice; lane-mismatched in `Other` like
  this column.

C25-A does NOT touch `imprv_det_class_cd`, `imprv_det_sub_class_cd`,
or `imprv_det_type_cd`. The per-table column-config is one-to-one
by intent.

## Architectural note: terminal-count vs canonical-quality

Per the C22-C / C23-C / C24-C results: promoting `Deferred → Mapped`
improves **semantic quality** but does NOT change the workbook's
**terminal-count math** (Deferred and Mapped are both terminal).
Lock-readiness blockers are unchanged by C25-C's apply.

Future TerraFusion transform consumers reading the workbook
distinguish between:

- **Status-terminal**: row is decision-resolved (Mapped, Excluded,
  Deferred). Lock service cares about this only.
- **Canonical-terminal**: row carries an operator-confirmed
  `canonical_value` linked to `canonical_target`
  (`ImprvDetailMethod` for this slice).

C25-C upgrades up to 10 rows from status-terminal-only to
status-and-canonical-terminal — assuming the C25-B preconditions
(see next section) move them to status-terminal first.

## Preconditions for C25-B (a Land/Improvement reality check)

**This is the major structural difference from C22 / C23 / C24.**

The C22 / C23 / C24 dictionary loaders all ran against
`Deferred`-status code-values produced by an upstream Defer-by-
default sweep (C13-A / C16-A / C17-A / C19-A / C20-A). The
loader's `ProposeReviewCsvAsync` only emits proposals for
code-values whose `ReviewStatus = "Deferred"`.

Pre-C25 audit of the workbook reveals two facts about
`imprv_det_meth_cd`:

1. The column itself is currently classified in the **Other**
   mapping lane (per C17-A3's documented lane-mismatch),
   not Improvement.
2. All 10 of its code-values are **`NeedsReview`**, not
   `Deferred`. No Defer-by-default sweep has been applied to
   this column yet.

Therefore C25-B is **not** a single-step "extend allowlist + add
config branch + run loader" operation like C24-B was. Two
preconditions must land first, in any order, before the loader
will produce any proposed CSV row:

### Precondition P1 — Lane reclassification

`SyncMappingColumns.MappingLane` for the
`imprv_detail.imprv_det_meth_cd` column must be moved from
`Other` to `Improvement`. The reclassification is a single
column-row UpdatedAt change; it does NOT touch any code-value.
This may be folded into C25-B as the first step, OR landed as
a tiny C25-Pre slice if the operator wants strict separation.

### Precondition P2 — Defer-by-default sweep

The 10 `NeedsReview` code-values must transition to `Deferred`
status, mirroring the C17-A → C17-D sweep pattern that took
`imprv_det_class_cd` to 21/21 Deferred at the time. The sweep
is a 10-row CSV processed through C11-B batch-edit
`--apply` — exactly the same pipeline used for the C-series
dictionary applies, but in the *opposite direction* (NeedsReview
→ Deferred, with `notes` documenting the operator's
defer-by-default rationale).

### Precondition gate

C25-B's loader run **shall produce a `Workbook Deferred rows
scanned: 0` summary if either precondition is not met**, and
shall not silently regress to scanning `NeedsReview` rows. The
zero-row run is itself a useful diagnostic; it surfaces the
precondition gap to the operator without producing a misleading
CSV. This matches the C22-A invariant of "the loader does not
infer state."

## Source and Target

| Role | Identity |
|---|---|
| Dictionary source | `dbo.imprv_det_meth` (in PACS `pacs_oltp` database; SQL Server) |
| Workbook source column | `dbo.imprv_detail.imprv_det_meth_cd` |
| Workbook column scope | Currently `Other` lane (precondition P1: reclassify to `Improvement`); column row currently `NeedsReview` |
| Workbook code-value scope | 10 rows, all currently `NeedsReview` (precondition P2: sweep to `Deferred`) |
| Canonical target | `ImprvDetailMethod` (operator-defined vocabulary; new for this slice) |
| Currently observed codes | `C`, `EXT-B`, `EXT-F`, `IRR`, `M`, `R`, `T1`, `T3`, `TRL`, `V1` (10 codes) |

### Out of scope (this slice)

- `dbo.imprv_detail.imprv_det_class_cd` — covered by C23-A.
- `dbo.imprv_detail.imprv_det_sub_class_cd` — has its own
  dictionary (`imprv_det_sub_class`); future slice (C26 or later).
- `dbo.imprv_detail.imprv_det_type_cd` — has its own dictionary
  candidate; same lane-mismatch problem as this column; future
  slice (C26 or later).
- `dbo.imprv_attr.i_attr_val_cd` — Improvement Tier 3, requires
  the C17-A3 i_attr_id composite context. Explicitly deferred
  per C23-A's out-of-scope list.
- Marshall & Swift cost-schedule references — disabled in the
  live install per D0-D.

## Hard Guards

The five guards below extend the C11-A batch-edit Hard Guards +
the C22-A / C23-A / C24-A dictionary-loader Hard Guards with
C25-specific safety. C25-B implementation must satisfy all of
them.

### 1. Read PACS, never write

The loader connects to PACS via the existing `--connection-id`
SyncSourceConnection lookup pattern (D0-D-laminated). Every PACS
query is `SELECT`-only. No `INSERT`, `UPDATE`, `DELETE`, `MERGE`,
DDL, or stored-procedure call.

### 2. Read-only workbook surface

C25-B's loader does not call `SaveChangesAsync` against the
workbook DbContext. It produces a review CSV file + mismatch
report + run log. The CSV is fed into the existing C11-B batch-
edit pipeline as a separate operator-driven step (C25-C).

The lane-reclassification (P1) and Defer-by-default sweep (P2)
are themselves separate operator-driven C11-B batch-edit
operations, not loader side-effects.

### 3. No autodetection / no inferred canonical labels

The dictionary's description column supplies the *proposed*
canonical_value for `Mapped` rows. The operator confirms each
row at C25-C. No classification heuristics, prefix matching
(`EXT-*` ≠ "exterior" by inference), frequency-based inference,
or AI-suggested canonical labels are introduced by this slice.

### 4. Year-aware reads + live-inspection-driven config

Per D0-D's year-keyed dictionary pattern + the threefold
C22/C23/C24-B-live lesson:

- C25-B's loader configuration (column names + active flag +
  year keying) MUST come from the C25-B preflight inspection,
  NOT from hardcoded assumptions copied from prior dictionary
  config branches. Especially relevant after C24-B-live
  surfaced Hungarian-notation prefixes (`szLandSoilCode`).
- If `imprv_det_meth` is year-keyed, the loader filters by
  `pacs_system.appr_yr` by default.
- If the dictionary is universe-wide, the loader proceeds
  without year filtering and notes this in output.

### 5. Allowlisted dictionary table

C25-B extends the SyncAtlas allowlist (currently
`property_use ∪ imprv_det_class ∪ land_soil`) to include
`imprv_det_meth`. The CLI rejects any table name outside the
allowlist. Adding `imprv_det_meth` to the allowlist is itself
a code-line change in this slice's successor; no operator can
run C25-B against an unlisted table.

## Live Inspection Required (gate before C25-B)

Before C25-B implementation begins, the operator (or a C25-B
preflight slice) must run a live inspection of
`dbo.imprv_det_meth` in the live PACS environment and record the
findings in
`backend/artifacts/sync-atlas/c25-b/<run-id>/dictionary-inspection.txt`.

The inspection MUST capture:

```sql
-- Schema introspection
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'imprv_det_meth'
ORDER BY ORDINAL_POSITION;

-- Row count
SELECT COUNT(*) AS total_rows FROM dbo.imprv_det_meth;

-- Top 50 sample
SELECT TOP (50) * FROM dbo.imprv_det_meth ORDER BY 1;

-- Duplicate-code probe
-- (column name TBD per inspection — likely imprv_det_meth_cd
--  or szImprvDetMethCd, but DO NOT assume.)
```

The inspection identifies (operator-recorded findings, not
loader-inferred):

1. **Code column** — exact name (likely `imprv_det_meth_cd`;
   verify — could be Hungarian-prefixed like `land_soil`).
2. **Description / name column** — exact name. Per C23-B-live
   "_desc" vs "_cls_desc" lesson, do not assume.
3. **Active / inactive indicator** — column name + semantics.
4. **Year / version columns** — whether the dictionary is
   year-keyed.
5. **Duplicate-code risk** — does the table allow multiple rows
   with the same code (across years or inactive rows)?
6. **Method-domain columns** — informational only; the loader
   does NOT read calculation-method computation rules
   (rate-per-sf / rate-per-cf / rate-per-unit) from the
   dictionary as canonical-value sources. That is operator
   judgment at C25-C.

The inspection output is the input to C25-B's per-county column
configuration block. C25-B does not hardcode column names; it
loads them from the inspection findings.

## Mismatch Rules

When C25-B runs (after preconditions P1 + P2 are met), the same
five mismatch shapes from C22-A apply. Output conventions are
identical to C22-A / C23-A / C24-A.

### Rule M1 — Workbook code present, dictionary code missing

Workbook has `imprv_det_meth_cd = 'X'` but `dbo.imprv_det_meth`
has no row with that code.

**Output**: `review_status=Deferred` with notes documenting the
data-integrity issue + 2017 conversion caveat.

### Rule M2 — Dictionary code present, workbook code absent

Dictionary has codes the workbook never observed.

**Output**: row is **NOT included** in the review CSV. The
workbook only reviews observed codes.

### Rule M3 — Duplicate dictionary code

Dictionary has multiple rows with the same code.

**Output**: `review_status=Deferred` with notes naming the
ambiguous matches.

### Rule M4 — Inactive dictionary row

Dictionary has the code but it's marked inactive.

**Output**: `review_status=Deferred` with notes documenting the
inactivity.

### Rule M5 — Clean match (the happy path)

Workbook has `imprv_det_meth_cd = 'W'` and the dictionary has
**exactly one active** row with that code.

**Output**: `review_status=Mapped` with the dictionary's
description as `canonical_value`,
`canonical_target=ImprvDetailMethod`, notes documenting the
match + 2017 conversion caveat.

## Review CSV Output Shape

C25-B's loader produces a CSV in the C11-A grammar:

```text
scope,source_schema,source_table,source_column,source_value,review_status,canonical_target,canonical_value,canonical_value_null,is_excluded,notes
```

For each of the up-to-10 Deferred workbook rows (post-precondition),
the loader proposes exactly one CSV row classified per M1-M5.
Output lands at:

```text
backend/artifacts/sync-atlas/c25-b/<run-id>/imprv_det_meth-proposed-review.csv
backend/artifacts/sync-atlas/c25-b/<run-id>/imprv_det_meth-mismatch-report.md
backend/artifacts/sync-atlas/c25-b/<run-id>/dictionary-inspection.txt
backend/artifacts/sync-atlas/c25-b/<run-id>/loader-run.txt
```

The CSV is **not committed**. It's operator-reviewable, then fed
into C11-B's `--batch-edit-mapping-workbook --apply` pipeline at
C25-C. C25-A and C25-B together do not touch a workbook row
that wasn't already moved by the precondition steps.

## RFC 4180 quoting

Inherited from C17-A2 / C19-B / C20-A / C22-A / C23-A / C24-A.
The dictionary's description column may contain commas / quotes;
C25-B's CSV emitter applies RFC 4180 quoting per the established
pattern.

## Pre-2017 Conversion Caveat (cross-reference)

Same as C22-A / C23-A / C24-A. Pre-2017 PACS records may carry
`imprv_det_meth_cd` values whose semantics differ from current
dictionary interpretation. C25-B's loader records the caveat in
each proposed Mapped row's `notes` field; operator confirms
during C25-C review.

## Audit Expectations

### What C25-B produces (read-only loader)

```text
backend/artifacts/sync-atlas/c25-b/<run-id>/
├── dictionary-inspection.txt              # Live PACS inspection
├── workbook-pre-state.txt                 # Confirms preconditions met
├── imprv_det_meth-proposed-review.csv     # Proposed review CSV
├── imprv_det_meth-mismatch-report.md      # M1-M5 counts + first 50 examples
└── loader-run.txt                         # CLI stdout
```

None committed. `backend/artifacts/` is gitignored.

### What C25-B does NOT produce

- No workbook row mutations.
- No PACS row mutations.
- No `SaveChangesAsync` calls.
- No PostgreSQL writes.
- No automatic precondition mutation (P1 + P2 are operator-driven
  C11-B steps, not loader side-effects).

### What C25-C eventually does (separate slice)

- Operator reviews `imprv_det_meth-proposed-review.csv`.
- Operator may rephrase canonical_values for Benton-Method
  alignment (calculation-method context).
- Operator runs `--batch-edit-mapping-workbook --apply` against
  the operator-approved CSV via the existing C11-B path.
- Up to 10 Deferred rows convert to whatever terminal status the
  operator confirms.

## Hard Non-Goals

| Non-goal | Rationale |
|---|---|
| **Auto-promote workbook rows to Mapped without operator approval** | Dictionary is evidence, not authority. |
| **Run the precondition lane reclassification + sweep as loader side-effects** | Each precondition is an explicit operator-driven C11-B operation; the loader is read-only. |
| **Apply dictionary to other improvement columns in this slice** | `imprv_det_class_cd` (done at C23), `imprv_det_sub_class_cd`, `imprv_det_type_cd` each need their own slice. |
| **Touch `imprv_attr.i_attr_val_cd`** | Tier 3 requires `i_attr_id` composite context per C17-A3; not in scope. |
| **Create canonical-value vocabulary by code-shape inference** | `EXT-B` / `EXT-F` ≠ "exterior" by loader inference; the dictionary is the only authoritative source. |
| **Pull Marshall & Swift cost-schedule references** | M&S integration disabled in the live install per D0-D. |
| **Mutate PACS rows** | Read-only by policy. |
| **Run a recalc / canonicalize / qualify-sales side effect** | Decoupled by design. |
| **Skip the live inspection gate** | C25-B cannot run until inspection captures column names; no hardcoded assumptions per the threefold C22/C23/C24-B-live pattern. |
| **Skip preconditions P1 + P2** | The loader will produce 0 rows until the column is in Improvement and code-values are Deferred. This is the design. |
| **Cross-county vocabulary import** | Per-PACS-instance variation per D0-D. |

## Success Gates for C25-B (loader implementation slice)

| Gate | Pass criterion |
|---|---|
| **Inspection captured** | `dictionary-inspection.txt` exists with column-name / active-flag / year-keying findings. |
| **Preconditions documented** | `workbook-pre-state.txt` confirms (a) column row in `Improvement` lane, (b) all in-scope code-values in `Deferred` status. If not met, loader produces zero proposed rows + diagnostic. |
| **Loader runs read-only** | C25-B run produces zero workbook mutations and zero PACS mutations. Verified by pre/post timestamp comparison. |
| **Up to 10 rows classified** | Output CSV (or rejected-row sidecar) accounts for all in-scope workbook Deferred rows. M1+M3+M4+M5 sum equals the in-scope count. |
| **No `Mapped` without dictionary match** | Every Mapped row has a corresponding active, unambiguous dictionary row. |
| **RFC 4180 compliance** | CSV passes the C11-B parser's dry-run validation step. |
| **Sales / Valuation / Land / Improvement Tier 1+2 preservation** | wac_cd 54/54 + sl_ratio_type_cd 23/23 + property_use_cd 62/62 + imprv_det_class_cd 21/21 + land_soil_code 35/35 + land_detail.primary_use_cd 54/54 anchors byte-for-byte unchanged. |
| **Other improvement columns preserved** | `imprv_det_sub_class_cd`, `imprv_det_type_cd`, `imprv.imprv_state_cd`, `imprv_attr.i_attr_val_cd` unchanged. |
| **No new service class** | C25-B exercises the C23-B generalized `DictionaryLoaderService` with a fourth target config — Program.cs config branch + new test file only. |
| **Leak scan clean** | No PACS credentials / API keys in any artifact. |

## Success Gates for C25-C (operator-approve-and-apply slice)

Inherits the C13-A success-gate template:

| Gate | Pass criterion |
|---|---|
| **Workbook stays Draft** | C25-C apply does not lock. |
| **Exact mutation count** | `Audit Stamp Bump: 1`; exactly the in-scope row count mutated (≤10). |
| **All other lanes preserved** | All anchor lanes byte-for-byte unchanged. |
| **imprv_det_meth_cd column-row preserved** | Column row stays at its post-precondition status; CSV mutates code-value rows only. |

## Recommended pacing

Per the C22 / C23 / C24 series precedent + C25-specific scope:

- **C25-Pre (optional)** — lane reclassification + Defer-by-
  default sweep. Two tiny C11-B batch-edit operations. Could be
  folded into C25-B as steps 1 + 2 of the same session.
- **C25-B** — loader implementation + live run. Inherits the
  C23-B / C24-B Program.cs-config-branch pattern. ~6-9 unit
  tests against InMemory + stub reader. **No new service class.**
- **C25-C** — operator review + apply. Standard C11-B batch-edit
  pattern.

## What This Enables (non-binding)

- **C25-B** — the actual loader. Inherits this slice's mismatch
  rules, output shape, inspection gate, and precondition
  language.
- **C25-C** — operator-driven CSV review and apply. Promotes the
  Deferred rows to whatever terminal status the operator
  confirms.
- **C26+** — the same policy shape applied to the next
  dictionary tables in priority order:
  - `imprv_det_sub_class` (small; Improvement lane)
  - `imprv_det_type` (lane-mismatched in Other, like this slice)
  - `nbhd_codes` after C20-C workbook extension
- **Benton-Method alignment** — once C25-C lands operator-
  rephrased canonical_values, future Forge / cost / sales-comp
  consumers can read calculation-method-aware classes through
  the workbook's `(canonical_target=ImprvDetailMethod,
  canonical_value=...)` surface, complementing the
  `(canonical_target=ImprvDetailClass, ...)` surface from C23-C.

## Hard Non-Goals (recap)

This doc explicitly does NOT:

- Modify any workbook row.
- Change C3-loader behavior.
- Promote any code-value to a terminal status.
- Build or change any code.
- Touch the running PACS sync service install.
- Pick which county to onboard next.
- Mandate a Benton-Method canonical-value vocabulary
  (operator-defined at C25-C).
- Auto-execute the lane reclassification or Defer-by-default
  sweep preconditions.

## What This Slice Is

The fourth dictionary-aware policy in TerraFusion. C22-A
established the architecture; C23-A confirmed the architecture
generalizes to a different Improvement-lane axis; C24-A confirmed
extension into a tax-sensitive Land-lane domain; C25-A confirms
the architecture handles a column whose preconditions (lane +
status) are NOT yet met — and pins the precondition contract
explicitly rather than hiding it inside loader code.

## What This Slice Is Not

A loader. A workbook write. A code change. A schema migration. A
canonical-vocabulary commitment beyond what the operator-confirmed
C25-C apply produces. A lane reclassification. A Defer-by-default
sweep. A coverage expansion to other Improvement-tier columns.

## Related policy memory

| Doc | Layer |
|---|---|
| `docs/sync/sales-review-csv-policy.md` (C13-A + amendment) | sales-lane review contract + 2017 caveat |
| `docs/sync/valuation-review-csv-policy.md` (C16-A) | valuation-lane review contract |
| `docs/sync/improvement-review-csv-policy.md` (C17-A + A2 + A3) | improvement-lane three-tier contract + i_attr_id mappings + lane-mismatch acknowledgment |
| `docs/sync/land-review-csv-policy.md` (C19-A) | land-lane review contract + RCW 84.34 |
| `docs/sync/neighborhood-review-csv-policy.md` (C20-A + A2) | neighborhood-lane contract + hood_cd domain truth |
| `docs/sync/mapping-workbook-batch-edit-policy.md` (C11-A) | the batch-edit grammar this slice's CSV is fed into at C25-C, and the precondition pipeline |
| `docs/sync/pacs-canonical-dictionaries-reference.md` (C21-A) | PACS dictionary catalog — `imprv_det_meth` is one of 10 |
| `docs/sync/pacs-canonical-dataflow-identity-policy.md` (D0-D) | identity / dataflow / cache rules |
| `docs/sync/property-use-dictionary-loader-policy.md` (C22-A) | first dictionary-loader policy — architectural template |
| `docs/sync/imprv-det-class-dictionary-loader-policy.md` (C23-A) | second dictionary-loader policy — generalized service |
| `docs/sync/land-soil-dictionary-loader-policy.md` (C24-A) | third dictionary-loader policy — RCW 84.34-sensitive |
| **`docs/sync/imprv-det-meth-dictionary-loader-policy.md` (C25-A)** | **this doc — fourth dictionary-aware slice (Improvement-method axis, with explicit preconditions)** |
