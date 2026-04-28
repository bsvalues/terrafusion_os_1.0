# `property_use` Dictionary Loader Policy

**Slice:** C22-A (docs-only — defines the contract for the first
dictionary-aware slice in TerraFusion. C22-B will implement the
inspector / loader; C22-C will apply the operator-approved
review CSV. This slice locks the rules before any code is written).
**Lifecycle layer:** dictionary-assisted review — sits one tier
above the C-series's per-row Defer-by-default work and one tier
below the eventual transform-consumer surface. The C-series
established that 62 valuation rows are Deferred; D0-D laminated
the identity / dataflow / cache rules; C21-A catalogued the PACS
canonical dictionary tables. C22-A picks the first dictionary
target and defines the rules for using it.
**Status:** policy locked; live inspection + implementation
deferred to C22-B; CSV apply deferred to C22-C.

## Provenance

- **D0-D — PACS canonical dataflow + identity policy**
  (`docs/sync/pacs-canonical-dataflow-identity-policy.md`,
  merged `5ff2c756c`). Establishes property identity composite
  `(prop_id, prop_val_yr, sup_num)`, year-keyed dictionary
  pattern (per neighborhood example), `property_profile = cache,
  not canon` rule, GIS via ArcGIS REST not from PACS.
- **C21-A — PACS canonical dictionaries reference**
  (`docs/sync/pacs-canonical-dictionaries-reference.md`).
  Catalogs `property_use` as the canonical dictionary for
  `property_val.property_use_cd`,
  `property_profile.property_use_cd`, and
  `land_detail.primary_use_cd`.
- **C16-A → C16-D — Valuation-lane review** closed the
  `property_val.property_use_cd` column at 62/62 = 100% terminal
  with all 62 rows in `Deferred` state, awaiting operator-
  confirmed canonical-vocabulary mapping.
- **C13-A 2017 conversion caveat** (recorded as the
  sales-policy amendment). Applies to `property_use_cd` the same
  way it applies to sales codes: pre-conversion records may
  carry semantics that differ from the current PACS code-table
  interpretation.
- **PACS Database Guide 9.0** (operator-supplied reference).
  Describes 32 canonical PACS tables; documents the
  property-related table family.
- **PACS canonical code-table catalog**
  (`Queries for all Codes in PACS (1).doc`, eflowers, 2017-11-29):
  > `-- Property Use codes`
  > `select * from property_use`
  Operator-confirmed that `property_use` is the dictionary table
  PACS clients are expected to be able to enumerate for open-
  records requests.

## Purpose

Define how the operator (or future TerraFusion code that
inherits this policy) inspects `dbo.property_use` in PACS,
matches its rows to the workbook's existing 62 Deferred
`property_use_cd` code-values, and **proposes** a review CSV
for operator approval — without directly mutating the workbook,
PACS, the canonical landing tables, or any downstream
consumer.

## Principle

> **Dictionary evidence may propose a canonical label, but the
> Mapping Workbook remains the decision surface.**

The dictionary is *evidence*, not *authority*. The operator
remains the only entity that promotes a workbook row to
`Mapped`. The dictionary's role is to make that promotion
faster and safer by pre-populating the canonical_value field
in a review CSV.

A dictionary loader that bypasses operator review and writes
directly to the workbook would re-introduce the "tool guessed"
failure mode the C-series's WacCd-directive guards against.
**No loader directly mutates workbook rows in this policy or
in C22-B's implementation.**

## Source and Target

| Role | Identity |
|---|---|
| Dictionary source | `dbo.property_use` (in PACS `pacs_oltp` database; SQL Server) |
| Workbook source column | `dbo.property_val.property_use_cd` |
| Workbook column scope | column row already `Mapped` from C11-C, with `canonical_target=PropertyUse` |
| Workbook code-value scope | 62 rows, all `Deferred` (post-C16-D) |
| Canonical target | `PropertyUse` (operator-defined vocabulary growing per workbook) |

### Out of scope (this slice)

The following columns ALSO map to `PropertyUse` per C21-A but
are NOT covered by this slice:

- `dbo.property_profile.property_use_cd` — cache surface per
  D0-D; reading the canonical column is the right read path,
  not the cache. This slice does not extend review to the
  cache copy.
- `dbo.land_detail.primary_use_cd` — Land lane (54 rows
  closed at C19-B). May benefit from the same dictionary in a
  future slice (C22-D or similar) but with land-specific
  decision rules; not in C22-A.

The 9 other dictionary tables catalogued in C21-A (
`imprv_det_class`, `imprv_attr_val`, `land_soil`, `nbhd_codes`,
etc.) each get their own policy slice; this one is `property_use`
only.

## Hard Guards

### 1. Read PACS, never write

The loader (C22-B) connects to PACS via the existing SyncAtlas
`--connection-id` pattern (D0-D-laminated). Every PACS query is
`SELECT`-only. No `INSERT`, `UPDATE`, `DELETE`, `MERGE`,
DDL, or stored-procedure call that mutates state.

### 2. Read-only workbook surface in this loader

C22-B's loader does not call `SaveChangesAsync` against the
workbook DbContext. It produces a review CSV file and
optionally a console summary. The CSV is fed into the existing
C11-B batch-edit pipeline as a separate operator-driven step
(C22-C).

### 3. No autodetection / no inferred canonical labels

The dictionary's `description` (or equivalent column) supplies
the **proposed** `canonical_value` for `Mapped` rows. The
operator confirms each row before C11-B applies it. No
classification heuristics, prefix matching, frequency-based
inference, or AI-suggested canonical labels are introduced by
this slice.

### 4. Year-aware reads

Per D0-D's year-keyed dictionary pattern:

- If `property_use` carries a year column (e.g. `prop_val_yr`,
  `effective_yr`), C22-B's loader filters to
  `pacs_system.appr_yr` (the canonical "current appraisal year")
  by default.
- If `property_use` is universe-wide (no year column), the
  loader proceeds without year filtering and notes this in the
  output.
- The pre-2017 conversion caveat applies: if the dictionary's
  active rows differ from what was canonical pre-conversion, the
  loader records the divergence in the proposed CSV's `notes`
  field per row.

### 5. Allowlisted dictionary table

C22-B's loader accepts `property_use` only for this slice. The
list of acceptable dictionary tables grows by explicit policy
amendment; the loader rejects any other table name. Defense-
in-depth against `--table 'property_use; DROP TABLE …'`-style
input.

## Live Inspection Required (gate before C22-B)

Before C22-B implementation begins, the operator (or a C22-B
preflight slice) must run a live inspection of `dbo.property_use`
in the live PACS environment and record the findings in
`backend/artifacts/sync-atlas/c22-a/<run-id>/dictionary-inspection.txt`.
The inspection MUST capture:

```sql
SELECT TOP (50) * FROM dbo.property_use ORDER BY 1;
```

…and also:

```sql
-- Schema introspection
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'property_use'
ORDER BY ORDINAL_POSITION;

-- Row count + active-row count if active flag exists
SELECT COUNT(*) AS total_rows FROM dbo.property_use;
```

The inspection identifies:

1. **Code column** — exact name (`property_use_cd` likely; verify).
2. **Description / name column** — exact name (`property_use_desc`,
   `name`, `description` — varies across PACS versions).
3. **Active / inactive indicator** — column name and semantics
   (e.g. `inactive_dt IS NULL`, `active_flag = 'Y'`,
   `sys_flag = 'A'`, etc.).
4. **Year / version columns** — whether the dictionary is
   year-keyed (e.g. `prop_val_yr`, `effective_yr`,
   `version_num`), or universe-wide.
5. **Duplicate-code risk** — does the dictionary allow multiple
   rows with the same `property_use_cd` (across years or
   inactive rows)? Confirms the code column's effective
   uniqueness scope.
6. **Mapping columns** — does the dictionary carry a state-code
   mapping, DOR-use-grouping, or cross-reference column that
   informs the canonical_value vocabulary?

The inspection output is the input to C22-B's allowlist /
field-name configuration. C22-B does not hardcode column names;
it reads them from a per-county configuration block populated
by this inspection.

## Mismatch Rules

When C22-B runs, four mismatch shapes are possible. Each has a
predefined output convention:

### Rule M1 — Workbook code present, dictionary code missing

The workbook has `property_use_cd = 'X'` but `dbo.property_use`
has no row with `property_use_cd = 'X'`.

**Output**: `review_status=Deferred` with notes:
> "Code 'X' observed in workbook but missing from PACS
> property_use dictionary; data-integrity issue or pre-2017
> conversion artifact. Operator review required."

This row remains Deferred regardless of the rest of the loader's
logic. The data integrity issue is surfaced for operator
attention without prejudging the resolution.

### Rule M2 — Dictionary code present, workbook code absent

The dictionary has `property_use_cd = 'Y'` but the workbook
has no observed code-value with that source value.

**Output**: row is **NOT included** in the review CSV. The
workbook only reviews observed codes; expanding scope to all
dictionary entries is out of scope for this slice (and would
create review work for codes that don't appear in the county's
data).

### Rule M3 — Duplicate dictionary code

The dictionary has multiple rows with the same
`property_use_cd` (different years, different active states,
or schema bug).

**Output**: `review_status=Deferred` with notes:
> "Code 'X' has multiple dictionary rows: [row-a-summary],
> [row-b-summary]. Cannot unambiguously map. Operator review
> required."

Same behavior as the C12 ambiguous-trim error: refuse to choose
silently; surface the ambiguity for operator resolution.

### Rule M4 — Inactive dictionary row

The dictionary has `property_use_cd = 'Z'` but the matching row
is marked inactive (per the inspection-identified inactive
indicator).

**Output**: `review_status=Deferred` with notes:
> "Code 'Z' matches an INACTIVE PACS property_use dictionary
> row [inactive-since-X]. May represent legacy or pre-conversion
> data. Operator review required."

The Defer-by-default posture is consistent with the C13-A 2017
conversion caveat: if dictionary state suggests semantic drift,
the operator decides.

### Rule M5 — Clean match (the happy path)

The workbook has `property_use_cd = 'W'` and the dictionary has
**exactly one active** row with `property_use_cd = 'W'`.

**Output**: `review_status=Mapped` with:
- `canonical_value` = dictionary description / canonical-grouping
  value (operator-confirmed at C22-B implementation time which
  field maps to canonical_value)
- `canonical_target` = `PropertyUse`
- `is_excluded` = `false`
- `notes` = "Dictionary-matched: [dict-row-summary]; reviewed
  via C22-A policy."

This is the only path that proposes `Mapped`. All other paths
propose `Deferred`.

## Review CSV Output Shape

C22-B's loader produces a CSV in the C11-A grammar:

```text
scope,source_schema,source_table,source_column,source_value,review_status,canonical_target,canonical_value,canonical_value_null,is_excluded,notes
```

For each of the 62 Deferred workbook rows, the loader proposes
exactly one CSV row, classified per the M1-M5 rules above. The
output file lands at:

```text
backend/artifacts/sync-atlas/c22-b/<run-id>/property-use-review.csv
```

The CSV is **not committed**. It is operator-reviewable, then
fed into the existing C11-B batch-edit pipeline (`--batch-edit-mapping-workbook`)
as a separate slice (C22-C). C22-A and C22-B together do not
touch a workbook row.

## RFC 4180 quoting (C17-A2 lesson)

The dictionary's `description` column may contain commas (e.g.
`"Single Family Residential, Detached"`) or quotes. C22-B's
CSV emitter applies RFC 4180 quoting per the established
pattern in C17-D and C19-B / C20-A. The C11-B
`BatchEditCsvParser` already handles standard RFC 4180 quoted
fields cleanly.

## Pre-2017 Conversion Caveat (cross-reference)

Per D0-D and the sales-policy amendment, pre-2017 PACS data
conversion may have left `property_use_cd` values whose
semantics differ from the current dictionary's interpretation.
C22-B's loader records this caveat in the `notes` field of every
proposed `Mapped` row:

> "Mapping reflects current dictionary semantics; pre-2017
> records may carry different intent — operator confirms."

This is informational, not gating: a clean dictionary match still
proposes `Mapped`. The operator can defer the row if the pre-
2017 caveat is judged material for that specific code.

## Audit Expectations

### What C22-B produces (read-only loader)

```text
backend/artifacts/sync-atlas/c22-b/<run-id>/
├── dictionary-inspection.txt       # Live PACS inspection results
├── workbook-pre-state.txt          # 62 Deferred rows confirmed
├── property-use-review.csv         # The proposed review CSV
├── classification-summary.txt      # M1/M2/M3/M4/M5 counts
└── loader-run.txt                  # Console output of the run
```

None committed. `backend/artifacts/` is gitignored.

### What C22-B does NOT produce

- No workbook row mutations.
- No PACS row mutations.
- No `SaveChangesAsync` calls anywhere.
- No PostgreSQL writes (the loader is a read pipeline only).

### What C22-C eventually does (separate slice)

- Operator reviews `property-use-review.csv`.
- Operator iterates on the file (rejects auto-Mapped proposals,
  rephrases canonical_values, adds notes).
- Operator runs `--batch-edit-mapping-workbook --apply` against
  the operator-approved CSV via the existing C11-B path.
- The 62 Deferred rows convert to whatever terminal status the
  operator confirmed.

C22-C is **not** automated by C22-B. It's the operator's manual
review-and-approve step using existing C11-B machinery.

## Hard Non-Goals

| Non-goal | Rationale |
|---|---|
| **Auto-promote workbook rows to Mapped without operator approval** | The dictionary is evidence, not authority. Re-introduces "the tool guessed" failure mode. |
| **Apply dictionary to other columns in this slice** | `imprv_det_class`, `land_soil`, etc. each need their own policy slice. |
| **Apply dictionary to `property_profile.property_use_cd`** | Cache surface per D0-D; not the canonical read path. |
| **Apply dictionary to `land_detail.primary_use_cd`** | Land lane has its own decision rules per C19-A; cross-lane application requires its own policy. |
| **Pull Marshall & Swift cost-file canonical labels** | M&S integration is disabled in the live install (`MarshallAndSwiftEnabled=false` per D0-D); out of scope. |
| **Mutate PACS rows** | The loader is read-only against PACS. |
| **Run a recalc / canonicalize / qualify-sales side effect** | Decoupled by design. |
| **Skip the live inspection gate** | C22-B cannot run until the inspection is captured. No hardcoded column names. |
| **Cross-county vocabulary import** | Dictionary contents are per-PACS-instance per D0-D; never copy a Mapped row from another county. |

## Success Gates for C22-B (the loader implementation slice)

C22-B is successful iff every gate below passes. The empty
marker commit lands only after all gates are green:

| Gate | Pass criterion |
|---|---|
| **Inspection captured** | `dictionary-inspection.txt` exists and contains the column-name / active-flag / year-key findings. |
| **Loader runs read-only** | C22-B run produces zero workbook mutations and zero PACS mutations. Verified by pre/post timestamp comparison on the workbook + PACS audit logs. |
| **62 rows classified** | The output CSV (or its rejected-row sidecar) accounts for all 62 workbook Deferred rows. M1+M2+M3+M4+M5 sum equals 62. |
| **No `Mapped` without dictionary match** | Every row with `review_status=Mapped` in the CSV has a corresponding active, unambiguous dictionary row. |
| **RFC 4180 compliance** | The CSV passes the C11-B parser's dry-run validation step. |
| **Sales / Valuation column-row anchor preserved** | The `property_val.property_use_cd` column row stays `Mapped` with `canonical_target=PropertyUse` (set at C11-C); the loader does not touch it. |
| **Other lanes preserved** | All Sales / Improvement / Land terminal rows are byte-for-byte unchanged. |
| **Leak scan clean** | No PACS credentials, API keys, or operator-machine secrets land in any artifact. |

## Success Gates for C22-C (the operator-approve-and-apply slice)

C22-C inherits the C13-A success-gate template (snapshot →
drift → dry-run → verify → apply → verify → progress-after).
Specific to property_use:

| Gate | Pass criterion |
|---|---|
| **Workbook stays Draft** | C22-C apply does not lock. |
| **Exact mutation count** | Dashboard's NonTerminal-count delta equals exactly the operator-approved row count. |
| **Sales / Improvement / Land preserved** | All three closed lanes' anchors byte-for-byte unchanged. |
| **Property_use_cd column-row preserved** | The column row stays `Mapped`; the operator-approved CSV mutates code-value rows only. |

## What This Enables (non-binding)

The following are *implications* — what future slices reading
this policy may build on. None is a forward commitment; each
remains subject to its own slice card.

- **C22-B** — the actual loader (CLI + service) implementation.
  Inherits this slice's mismatch rules, output shape, and
  live-inspection gate.
- **C22-C** — operator-driven CSV review and apply via existing
  C11-B batch-edit pipeline. Promotes the 62 Deferred rows to
  whatever terminal status the operator confirms (Mapped /
  Excluded / Deferred-with-notes).
- **C22-D and beyond** — the same policy shape, applied to the
  next dictionary table (`imprv_det_class` is the smallest at
  21 codes; `land_soil` at 35; `imprv_attr_val` at 60 with the
  C17-A3 i_attr_id complication; `nbhd_codes` after C20-C
  workbook extension).
- **Cross-county scaling** — once C22-A → C22-C completes for
  Benton's `property_use`, the per-county adaptation surface is
  the live-inspection step (column names + active-flag +
  year-keying may differ across PACS deployments). Future
  multi-county work inherits the inspection-then-load pattern.

## What This Slice Is

The first step in TerraFusion's transition from "Defer-by-
default review work" to "dictionary-evidence-assisted review
work." The principle preserved: the operator stays the only
entity that promotes a row to a terminal status. The principle
relaxed: the operator gets a pre-populated CSV from dictionary
evidence rather than authoring per-row decisions cold.

## What This Slice Is Not

A loader. A workbook write. A code change of any kind. A
schema migration. A frontend feature. A multi-table dictionary
sweep. A canonical-vocabulary commitment beyond what the
operator-confirmed C22-C apply produces.

## Related policy memory

| Doc | Layer |
|---|---|
| `docs/sync/sales-review-csv-policy.md` (C13-A + amendment) | sales-lane review contract + 2017 caveat |
| `docs/sync/valuation-review-csv-policy.md` (C16-A) | valuation-lane review contract — context for the 62 Deferred rows |
| `docs/sync/improvement-review-csv-policy.md` (C17-A + A2 + A3) | improvement-lane contract + i_attr_id mappings |
| `docs/sync/land-review-csv-policy.md` (C19-A) | land-lane review contract |
| `docs/sync/neighborhood-review-csv-policy.md` (C20-A + A2) | neighborhood-lane contract |
| `docs/sync/mapping-workbook-batch-edit-policy.md` (C11-A) | the batch-edit grammar this slice's CSV is fed into at C22-C |
| `docs/sync/pacs-canonical-dictionaries-reference.md` (C21-A) | PACS dictionary table catalog — `property_use` is one of 10 |
| `docs/sync/pacs-canonical-dataflow-identity-policy.md` (D0-D) | identity / dataflow / cache rules — the foundation under this slice |
| **`docs/sync/property-use-dictionary-loader-policy.md` (C22-A)** | **this doc — first dictionary-aware slice** |
