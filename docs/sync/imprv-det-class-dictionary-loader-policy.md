# `imprv_det_class` Dictionary Loader Policy

**Slice:** C23-A (docs-only — defines the contract for C23-B
implementation: read-only loader that proposes a review CSV by
joining the workbook's 21 Deferred `imprv_det_class_cd` code-values
against PACS's `dbo.imprv_det_class` dictionary. C23-C will apply
the operator-approved CSV via the existing C11-B batch-edit pipeline).
**Lifecycle layer:** dictionary-assisted review for the Improvement
lane's Tier 2. Sits one level above the C17-A → C17-D Defer-by-
default sweep and one level below any future Improvement-lane
canonicalization consumer. The C22 series proved the dictionary-
loader architecture on Valuation; C23 applies the same pattern to
Improvement Tier 2.
**Status:** policy locked; live inspection + implementation deferred
to C23-B; CSV apply deferred to C23-C.

## Provenance

- **D0-D — PACS canonical dataflow + identity policy**
  (`docs/sync/pacs-canonical-dataflow-identity-policy.md`).
  Establishes property identity composite, year-keyed dictionary
  pattern, no autodetection, allowlisted dictionary tables.
- **C21-A — PACS canonical dictionaries reference**
  (`docs/sync/pacs-canonical-dictionaries-reference.md`).
  Catalogs `imprv_det_class` as the canonical dictionary for
  `imprv_detail.imprv_det_class_cd`.
- **C17-A → C17-D — Improvement-lane review** closed the
  `imprv_detail.imprv_det_class_cd` column at 21/21 = 100%
  terminal with all 21 rows in `Deferred` state, awaiting
  operator-confirmed canonical-vocabulary mapping. Per C17-A's
  three-tier framing, this is **Tier 2: Improvement Details**.
- **C17-A3 amendment** — operator-supplied i_attr_id mapping
  table from working sales-dashboard SQL. Documents the
  `imprv_det_type_cd` canonical values (`MA`, `BSMT`, `U-BSMT`,
  `ATTGAR`, `DETGAR`, `carport`, `polebldg`) which are *related
  but distinct* from `imprv_det_class_cd`. C23 covers the class
  column, not the type column.
- **C22-A → C22-C — first dictionary-aware Mapped promotion**.
  Established the architecture this slice inherits:
  M1-M5 mismatch rules, RFC 4180 quoting, read-only loader,
  artifact emission, operator-approved CSV via C11-B batch edit.
- **C22-B-live operational lesson**: Program.cs's default
  column-config assumption was wrong (`sys_flag` predicate
  against a column that didn't exist). The C22-A live-inspection
  gate caught it before silent loader bugs. **C23-A inherits
  this lesson: NO hardcoded column names; every default in C23-B
  must trace to a captured live inspection.**
- **PACS canonical code-table catalog** (`Queries for all Codes
  in PACS (1).doc`, eflowers, 2017-11-29):
  > `-- Improvement Detail Class Codes on the improvement detail record`
  > `select * from imprv_det_class`
  Operator-confirmed that `imprv_det_class` is the dictionary
  table PACS clients are expected to enumerate.

## Purpose

Define how a future loader (C23-B) inspects `dbo.imprv_det_class`
in PACS, matches its rows to the workbook's 21 Deferred
`imprv_det_class_cd` code-values, and **proposes** a review CSV
for operator approval — without directly mutating the workbook,
PACS, the canonical landing tables, or any downstream consumer.

The C-series invariant from C22-A holds verbatim: the dictionary
is *evidence*, not *authority*. The operator stays the only entity
that promotes a row to a terminal status.

## Architectural note: terminal-count vs canonical-quality

Per the C22-C result: promoting `Deferred → Mapped` improves
**semantic quality** (the workbook now carries operator-confirmed
canonical labels) but does NOT change the workbook's
**terminal-count math** (Deferred and Mapped are both terminal).
Lock-readiness blockers are unchanged by C23-C's apply.

Future TerraFusion transform consumers reading the workbook
distinguish between:

- **Status-terminal**: row is decision-resolved (Mapped, Excluded,
  Deferred). Lock service cares about this only.
- **Canonical-terminal**: row carries an operator-confirmed
  `canonical_value` linked to `canonical_target` ("ImprvDetailClass"
  for this slice). Sales-comp / valuation transforms care about
  this distinction.

C23-C upgrades 21 rows from status-terminal-only to status-and-
canonical-terminal. That matters for downstream consumption even
though the lock-blocker count doesn't move.

## Source and Target

| Role | Identity |
|---|---|
| Dictionary source | `dbo.imprv_det_class` (in PACS `pacs_oltp` database; SQL Server) |
| Workbook source column | `dbo.imprv_detail.imprv_det_class_cd` |
| Workbook column scope | Improvement lane; column row currently `NeedsReview` (no canonical_target set yet) |
| Workbook code-value scope | 21 rows, all `Deferred` (post-C17-C) |
| Canonical target | `ImprvDetailClass` (operator-defined vocabulary; new for this slice) |

### Out of scope (this slice)

- `dbo.imprv_detail.imprv_det_meth_cd` — has its own dictionary
  (`imprv_det_meth`); future slice covers it.
- `dbo.imprv_detail.imprv_det_sub_class_cd` — has its own dictionary
  (`imprv_det_sub_class`); future slice covers it.
- `dbo.imprv_detail.imprv_det_type_cd` — different column entirely;
  C17-A3 documents the canonical values (`MA`, `BSMT`, `ATTGAR`,
  etc.) but it's lane-mismatched (currently in Other) and needs a
  separate slice for both lane reclassification + dictionary load.
- `dbo.imprv_attr.i_attr_val_cd` — Improvement Tier 3, requires the
  C17-A3 i_attr_id composite context. Explicitly deferred to a
  future C23-D / C24 slice; loading attribute-value codes without
  attribute-id context would re-introduce the ambiguity C17-A2
  already documented.
- `dbo.imprv.imprv_state_cd`, `dbo.imprv.imprv_type_cd`, etc. —
  Tier 1 columns; each gets their own slice.

## Benton Method relevance

Per the user's expressed framework (recorded in
`MEMORY.md → project_benton_method.md`), the Benton Method is the
operator's market-calibrated costing approach using percent-of-BIV
features. **Improvement detail class is one of the primary inputs
to that method.** Each `imprv_detail` row represents a component
of the parent `imprv` record; the class code says what kind of
component it is (main area, attached garage, basement, etc.).

Implication for this slice:

- The proposed canonical_value vocabulary should be operator-
  legible at the Benton-Method level (e.g. "MainArea",
  "AttachedGarage", "FinishedBasement") rather than verbose
  PACS-internal descriptions when the operator chooses to
  rephrase during C23-C review.
- Future Forge / Cost / sales-comp consumers reading
  `imprv_detail.imprv_det_class_cd` through the workbook's
  canonical_value will see Benton-Method-aligned categories,
  enabling the percent-of-BIV calculations the operator's
  framework relies on.
- The C23-B loader proposes the dictionary's verbatim description
  as canonical_value (per C22-A's pattern); the operator
  rephrases during C23-C if Benton-Method canonicalization is
  desired. Loader is mechanical; operator is canonical.

## Hard Guards

The five guards below extend the C11-A batch-edit Hard Guards
with C23-specific safety. C23-B implementation must satisfy all
of them.

### 1. Read PACS, never write

The loader connects to PACS via the existing `--connection-id`
SyncSourceConnection lookup pattern (D0-D-laminated). Every PACS
query is `SELECT`-only. No `INSERT`, `UPDATE`, `DELETE`, `MERGE`,
DDL, or stored-procedure call.

### 2. Read-only workbook surface

C23-B's loader does not call `SaveChangesAsync` against the
workbook DbContext. It produces a review CSV file + mismatch
report + run log. The CSV is fed into the existing C11-B batch-
edit pipeline as a separate operator-driven step (C23-C).

### 3. No autodetection / no inferred canonical labels

The dictionary's description column supplies the *proposed*
canonical_value for `Mapped` rows. The operator confirms each
row at C23-C. No classification heuristics, prefix matching,
frequency-based inference, or AI-suggested canonical labels are
introduced by this slice.

### 4. Year-aware reads + live-inspection-driven config

Per D0-D's year-keyed dictionary pattern + C22-B-live's lesson:

- C23-B's loader configuration (column names + active flag +
  year keying) MUST come from the C23-B preflight inspection,
  NOT from hardcoded assumptions copied from C22-B's
  `property_use` config.
- If `imprv_det_class` is year-keyed (e.g. `imprv_yr` per the
  related `imprv_attr_val` table), the loader filters by
  `pacs_system.appr_yr` by default.
- If the dictionary is universe-wide, the loader proceeds
  without year filtering and notes this in output.

### 5. Allowlisted dictionary table

C23-B extends the SyncAtlas allowlist (currently only
`property_use`) to include `imprv_det_class`. The CLI rejects any
table name outside the allowlist. Adding `imprv_det_class` to the
allowlist is itself a code-line change in this slice's successor;
no operator can run C23-B against an unlisted table.

## Live Inspection Required (gate before C23-B)

Before C23-B implementation begins, the operator (or a C23-B
preflight slice) must run a live inspection of
`dbo.imprv_det_class` in the live PACS environment and record the
findings in
`backend/artifacts/sync-atlas/c23-a/<run-id>/dictionary-inspection.txt`.

The inspection MUST capture:

```sql
-- Schema introspection
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'imprv_det_class'
ORDER BY ORDINAL_POSITION;

-- Row count
SELECT COUNT(*) AS total_rows FROM dbo.imprv_det_class;

-- Top 50 sample
SELECT TOP (50) * FROM dbo.imprv_det_class ORDER BY 1;

-- Duplicate-code probe
SELECT imprv_det_class_cd, COUNT(*) AS n
FROM dbo.imprv_det_class
GROUP BY imprv_det_class_cd
HAVING COUNT(*) > 1;
```

The inspection identifies (operator-recorded findings, not
loader-inferred):

1. **Code column** — exact name (likely `imprv_det_class_cd`;
   verify).
2. **Description / name column** — exact name.
3. **Active / inactive indicator** — column name + semantics.
4. **Year / version columns** — whether the dictionary is
   year-keyed.
5. **Duplicate-code risk** — does the table allow multiple rows
   with the same code (across years or inactive rows)?
6. **Mapping columns** — does the dictionary carry a
   cost-schedule reference, sub-class linkage, or DOR-grouping
   column that could inform the canonical_value vocabulary?

The inspection output is the input to C23-B's per-county column
configuration block. C23-B does not hardcode column names; it
loads them from the inspection findings.

## Mismatch Rules

When C23-B runs, the same five mismatch shapes from C22-A apply.
Output conventions are identical to C22-A:

### Rule M1 — Workbook code present, dictionary code missing

Workbook has `imprv_det_class_cd = 'X'` but `dbo.imprv_det_class`
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
ambiguous matches. Same shape as the C12 ambiguous-trim error
pattern.

### Rule M4 — Inactive dictionary row

Dictionary has the code but it's marked inactive.

**Output**: `review_status=Deferred` with notes documenting the
inactivity.

### Rule M5 — Clean match (the happy path)

Workbook has `imprv_det_class_cd = 'W'` and the dictionary has
**exactly one active** row with that code.

**Output**: `review_status=Mapped` with the dictionary's
description as `canonical_value`, `canonical_target=ImprvDetailClass`,
notes documenting the match + 2017 conversion caveat.

## Review CSV Output Shape

C23-B's loader produces a CSV in the C11-A grammar:

```text
scope,source_schema,source_table,source_column,source_value,review_status,canonical_target,canonical_value,canonical_value_null,is_excluded,notes
```

For each of the 21 Deferred workbook rows, the loader proposes
exactly one CSV row classified per M1-M5. Output lands at:

```text
backend/artifacts/sync-atlas/c23-b/<run-id>/imprv-det-class-review.csv
backend/artifacts/sync-atlas/c23-b/<run-id>/imprv-det-class-mismatch-report.md
backend/artifacts/sync-atlas/c23-b/<run-id>/dictionary-inspection.txt
backend/artifacts/sync-atlas/c23-b/<run-id>/loader-run.txt
```

The CSV is **not committed**. It's operator-reviewable, then fed
into C11-B's `--batch-edit-mapping-workbook --apply` pipeline at
C23-C. C23-A and C23-B together do not touch a workbook row.

## RFC 4180 quoting

Inherited from C17-A2 / C19-B / C20-A / C22-A. The dictionary's
description column may contain commas / quotes; C23-B's CSV
emitter applies RFC 4180 quoting per the established pattern.

## Pre-2017 Conversion Caveat (cross-reference)

Same as C22-A. Pre-2017 PACS records may carry
`imprv_det_class_cd` values whose semantics differ from current
dictionary interpretation. C23-B's loader records the caveat in
each proposed Mapped row's `notes` field; operator confirms
during C23-C review.

## Audit Expectations

### What C23-B produces (read-only loader)

```text
backend/artifacts/sync-atlas/c23-b/<run-id>/
├── dictionary-inspection.txt            # Live PACS inspection
├── workbook-pre-state.txt               # 21 Deferred rows confirmed
├── imprv-det-class-review.csv           # Proposed review CSV (21 rows)
├── imprv-det-class-mismatch-report.md   # M1-M5 counts + first 50 examples
└── loader-run.txt                       # CLI stdout
```

None committed. `backend/artifacts/` is gitignored.

### What C23-B does NOT produce

- No workbook row mutations.
- No PACS row mutations.
- No `SaveChangesAsync` calls.
- No PostgreSQL writes.

### What C23-C eventually does (separate slice)

- Operator reviews `imprv-det-class-review.csv`.
- Operator may rephrase canonical_values for Benton-Method
  alignment.
- Operator runs `--batch-edit-mapping-workbook --apply` against
  the operator-approved CSV via the existing C11-B path.
- The 21 Deferred rows convert to whatever terminal status the
  operator confirms.

## Hard Non-Goals

| Non-goal | Rationale |
|---|---|
| **Auto-promote workbook rows to Mapped without operator approval** | Dictionary is evidence, not authority. |
| **Apply dictionary to other improvement columns in this slice** | `imprv_det_meth`, `imprv_det_sub_class`, `imprv_det_type` each need their own policy slice. |
| **Touch `imprv_attr.i_attr_val_cd`** | Tier 3 requires `i_attr_id` composite context per C17-A3; not in scope. |
| **Create canonical-value vocabulary by code-shape inference** | "11", "12", "13" prefix matching is forbidden; the dictionary is the only authoritative source. |
| **Pull Marshall & Swift cost-schedule references** | M&S integration disabled in the live install per D0-D. |
| **Mutate PACS rows** | Read-only by policy. |
| **Run a recalc / canonicalize / qualify-sales side effect** | Decoupled by design. |
| **Skip the live inspection gate** | C23-B cannot run until inspection captures column names; no hardcoded assumptions. |
| **Cross-county vocabulary import** | Per-PACS-instance variation per D0-D. |

## Success Gates for C23-B (loader implementation slice)

| Gate | Pass criterion |
|---|---|
| **Inspection captured** | `dictionary-inspection.txt` exists with column-name / active-flag / year-keying findings. |
| **Loader runs read-only** | C23-B run produces zero workbook mutations and zero PACS mutations. Verified by pre/post timestamp comparison. |
| **21 rows classified** | Output CSV (or rejected-row sidecar) accounts for all 21 workbook Deferred rows. M1+M3+M4+M5 sum equals 21. |
| **No `Mapped` without dictionary match** | Every Mapped row has a corresponding active, unambiguous dictionary row. |
| **RFC 4180 compliance** | CSV passes the C11-B parser's dry-run validation step. |
| **Sales / Valuation / Land lane preservation** | wac_cd 54/54 + sl_ratio_type_cd 23/23 + property_use_cd 62/62 + land_soil_code 35/35 + land_detail.primary_use_cd 54/54 anchors byte-for-byte unchanged. |
| **Improvement Tier 1 / Tier 3 preservation** | imprv.imprv_state_cd 94/94 + imprv_attr.i_attr_val_cd 60/60 anchors byte-for-byte unchanged. |
| **Other improvement columns preserved** | `imprv_det_meth_cd`, `imprv_det_sub_class_cd`, etc. unchanged. |
| **Leak scan clean** | No PACS credentials / API keys in any artifact. |

## Success Gates for C23-C (operator-approve-and-apply slice)

Inherits the C13-A success-gate template:

| Gate | Pass criterion |
|---|---|
| **Workbook stays Draft** | C23-C apply does not lock. |
| **Exact mutation count** | `Audit Stamp Bump: 1`; exactly 21 rows mutated. |
| **Sales / Valuation / Land / Improvement Tier 1 + 3 preserved** | All anchor lanes byte-for-byte unchanged. |
| **imprv_det_class_cd column-row preserved** | Column row stays at its pre-apply status; CSV mutates code-value rows only. |

## Recommended pacing

Per the C22 series precedent + scope:

- **C23-B** (loader implementation + live run): one session,
  small. Allowlist extension + service implementation +
  Program.cs default config block based on the inspection. ~6-9
  unit tests against InMemory + stub reader.
- **C23-C** (operator review + apply): one session, smallest.
  Standard C11-B batch-edit pattern.

## What This Enables (non-binding)

- **C23-B** — the actual loader. Inherits this slice's mismatch
  rules, output shape, and inspection gate.
- **C23-C** — operator-driven CSV review and apply. Promotes the
  21 Deferred rows to whatever terminal status the operator
  confirms (Mapped / Excluded / Deferred-with-notes).
- **C23-D / C24 / C25** — the same policy shape applied to the
  next dictionary tables in priority order:
  - `land_soil` (35 codes, RCW 84.34-sensitive per C19-A)
  - `imprv_det_meth` (10 codes, in workbook's Other lane)
  - `imprv_det_sub_class` (2 codes; smallest)
  - `nbhd_codes` after C20-C workbook extension
- **Benton-Method alignment** — once C23-C lands operator-
  rephrased canonical_values, future Forge / cost / sales-comp
  consumers can read Benton-Method-aligned classes through the
  workbook's `(canonical_target=ImprvDetailClass, canonical_value=...)`
  surface.

## Hard Non-Goals (recap)

This doc explicitly does NOT:

- Modify any workbook row.
- Change C3-loader behavior.
- Promote any Deferred row.
- Build or change any code.
- Touch the running PACS sync service install.
- Pick which county to onboard next.
- Mandate a Benton-Method canonical-value vocabulary (operator-
  defined at C23-C).

## What This Slice Is

The second dictionary-aware policy in TerraFusion. C22-A
established the architecture; C23-A confirms the architecture
generalizes to a different lane (Improvement Tier 2) with the
same shape. Future dictionary slices (`land_soil`,
`imprv_det_meth`, etc.) get cheaper from here because the
template is proven.

## What This Slice Is Not

A loader. A workbook write. A code change. A schema migration. A
canonical-vocabulary commitment beyond what the operator-confirmed
C23-C apply produces. A Benton-Method specification. A coverage
expansion to other Improvement-tier columns.

## Related policy memory

| Doc | Layer |
|---|---|
| `docs/sync/sales-review-csv-policy.md` (C13-A + amendment) | sales-lane review contract + 2017 caveat |
| `docs/sync/valuation-review-csv-policy.md` (C16-A) | valuation-lane review contract |
| `docs/sync/improvement-review-csv-policy.md` (C17-A + A2 + A3) | improvement-lane three-tier contract + i_attr_id mappings |
| `docs/sync/land-review-csv-policy.md` (C19-A) | land-lane review contract + RCW 84.34 |
| `docs/sync/neighborhood-review-csv-policy.md` (C20-A + A2) | neighborhood-lane contract + hood_cd domain truth |
| `docs/sync/mapping-workbook-batch-edit-policy.md` (C11-A) | the batch-edit grammar this slice's CSV is fed into at C23-C |
| `docs/sync/pacs-canonical-dictionaries-reference.md` (C21-A) | PACS dictionary catalog — `imprv_det_class` is one of 10 |
| `docs/sync/pacs-canonical-dataflow-identity-policy.md` (D0-D) | identity / dataflow / cache rules |
| `docs/sync/property-use-dictionary-loader-policy.md` (C22-A) | first dictionary-loader policy — architectural template |
| **`docs/sync/imprv-det-class-dictionary-loader-policy.md` (C23-A)** | **this doc — second dictionary-aware slice (Improvement Tier 2)** |
