# `land_soil` Dictionary Loader Policy

**Slice:** C24-A (docs-only — defines the contract for C24-B
implementation: read-only loader that proposes a review CSV by
joining the workbook's 35 Deferred `land_soil_code` code-values
against PACS's `dbo.land_soil` dictionary. C24-C will apply the
operator-approved CSV via the existing C11-B batch-edit pipeline).
**Lifecycle layer:** dictionary-assisted review for the Land lane.
Sits one level above the C19-A → C19-B Defer-by-default sweep and
one level below any future Land-lane canonicalization consumer.
The C22 series proved the dictionary-loader architecture on
Valuation Tier 1; C23 proved it generalizes to Improvement Tier 2;
C24 proves it generalizes to a tax-sensitive Land-lane domain
under RCW 84.34.
**Status:** policy locked; live inspection + implementation deferred
to C24-B; CSV apply deferred to C24-C.

## Provenance

- **D0-D — PACS canonical dataflow + identity policy**
  (`docs/sync/pacs-canonical-dataflow-identity-policy.md`).
  Establishes property identity composite, year-keyed dictionary
  pattern, no autodetection, allowlisted dictionary tables.
- **C19-A — Land-lane review policy**
  (`docs/sync/land-review-csv-policy.md`). Established the Land
  lane's two-column scope (`land_detail.primary_use_cd` and
  `land_detail.land_soil_code`), recorded the 35 land_soil_code
  values currently in workbook (`DRAG1`/`IRAG2`/`DRPA1`/`RHS`/
  `NONE`/`WASTE`/`SITE1` etc.), and documented the RCW 84.34 /
  WSDOR per-acre value-table sensitivity. C19-A is the operative
  Land-lane contract this slice extends without amending.
- **C19-B — Land-lane Defer-by-default sweep** closed the
  `land_detail.land_soil_code` column at 35/35 = 100% terminal
  with all 35 rows in `Deferred` state, awaiting operator-
  confirmed canonical-vocabulary mapping. The Land lane is
  status-terminal but not canonical-terminal.
- **C21-A — PACS canonical dictionaries reference**
  (`docs/sync/pacs-canonical-dictionaries-reference.md`).
  Catalogs `land_soil` as the canonical dictionary for
  `land_detail.land_soil_code`.
- **C22-A → C22-C — first dictionary-aware Mapped promotion**
  (`docs/sync/property-use-dictionary-loader-policy.md`).
  Established the architecture this slice inherits: M1-M5
  mismatch rules, RFC 4180 quoting, read-only loader, artifact
  emission, operator-approved CSV via C11-B batch edit.
- **C23-A → C23-C — second dictionary-aware Mapped promotion**
  (`docs/sync/imprv-det-class-dictionary-loader-policy.md`).
  Generalized the loader into a target-config-driven
  `DictionaryLoaderService`. Proved that future dictionary
  slices are a Program.cs config branch, not a new service
  class. C24-B will be the first slice to exercise the
  generalized loader against a third dictionary without code
  duplication.
- **C22-B-live + C23-B-live operational lessons**: pre-inspection
  defaults were wrong twice (sys_flag predicate against a column
  that didn't exist on `property_use`; description column abbreviated
  `imprv_det_cls_desc` not `imprv_det_class_desc` on
  `imprv_det_class`). C24-A inherits both lessons:
  **NO hardcoded column names; every default in C24-B must trace
  to a captured live inspection of `dbo.land_soil`.**
- **PACS canonical code-table catalog** (`Queries for all Codes
  in PACS (1).doc`, eflowers, 2017-11-29):
  > `-- Soil Codes`
  > `select * from land_soil`
  Operator-confirmed that `land_soil` is the dictionary table
  PACS clients are expected to enumerate.

## Purpose

Define how a future loader (C24-B) inspects `dbo.land_soil` in
PACS, matches its rows to the workbook's 35 Deferred
`land_soil_code` code-values, and **proposes** a review CSV for
operator approval — without directly mutating the workbook, PACS,
the canonical landing tables, or any downstream consumer.

The C-series invariant from C22-A holds verbatim and gets a
**stronger** reading here: the dictionary is *evidence*, not
*authority*. The operator stays the only entity that promotes a
row to a terminal status. Because `land_soil_code` drives RCW
84.34 current-use per-acre valuation, the read of "evidence" is
narrower for this slice than for property_use or imprv_det_class:
the loader proposes a description, but the operator must
cross-check the proposed description against the WSDOR / DOR
per-acre value table before confirming.

## Architectural note: terminal-count vs canonical-quality (Land amendment)

Per the C22-C / C23-C results: promoting `Deferred → Mapped`
improves **semantic quality** (the workbook now carries
operator-confirmed canonical labels) but does NOT change the
workbook's **terminal-count math** (Deferred and Mapped are both
terminal). Lock-readiness blockers are unchanged by C24-C's apply.

Future TerraFusion transform consumers reading the workbook
distinguish between:

- **Status-terminal**: row is decision-resolved (Mapped, Excluded,
  Deferred). Lock service cares about this only.
- **Canonical-terminal**: row carries an operator-confirmed
  `canonical_value` linked to `canonical_target` (`LandSoil` for
  this slice).

C24-C upgrades 35 rows from status-terminal-only to status-and-
canonical-terminal. **Land-specific amendment**: because
land_soil_code feeds current-use valuation, the canonical_value
also encodes the RCW 84.34 / WSDOR per-acre intent the operator
confirms. Forge / cost / valuation transforms reading
`(canonical_target=LandSoil, canonical_value=...)` rely on the
operator's confirmation that the dictionary description aligns
with the per-acre value table the county is using; C24-C does not
introduce a per-acre value, it confirms a **label** the per-acre
table is keyed on.

## Source and Target

| Role | Identity |
|---|---|
| Dictionary source | `dbo.land_soil` (in PACS `pacs_oltp` database; SQL Server) |
| Workbook source column | `dbo.land_detail.land_soil_code` |
| Workbook column scope | Land lane; column row currently `NeedsReview` (no canonical_target set yet) |
| Workbook code-value scope | 35 rows, all `Deferred` (post-C19-B) |
| Canonical target | `LandSoil` (operator-defined vocabulary; new for this slice) |

### Out of scope (this slice)

- `dbo.land_detail.primary_use_cd` — separate Land-lane column
  (54 codes per C19-A). Has its own dictionary candidate
  (`property_use`-shaped or DOR-PUC-shaped) and gets its own
  policy slice; **not folded into C24** because the loader's
  per-table column-config is intentionally one-to-one.
- `dbo.land_detail.land_type_cd`, `land_class_code`,
  `state_cd` — other land_detail columns; each gets its own
  slice if it warrants dictionary loading.
- WSDOR per-acre value tables themselves — the loader proposes
  the dictionary's description as canonical_value; it does NOT
  read or propagate per-acre dollar values. Per-acre valuation
  is the operator's authority, not the loader's.
- Marshall & Swift cost-schedule references — disabled in the
  live install per D0-D.

## RCW 84.34 / WSDOR sensitivity (Land-specific Hard Guard)

Per C19-A's land-policy framing, soil codes drive **current-use
taxation under RCW 84.34** (Open Space Taxation Act). A
misclassified soil code can cause:

- a parcel taxed at market value when it should be taxed at
  current-use ag value (or vice versa)
- per-acre values applied from the wrong WSDOR / DOR class
- audit-trail gaps if the proposed canonical_value contradicts
  the per-acre table the operator is using

C24-B's loader does not, must not, and cannot:

- infer current-use eligibility from code prefix (`DR*` ≠
  "definitely dryland-ag", `IR*` ≠ "definitely irrigated-ag",
  even though that's the working pattern)
- propose RCW 84.34 / current-use intent in the canonical_value
- modify or recalc any per-acre value table
- assert that the dictionary description matches the operator's
  per-acre value table

What C24-B's loader **may** do:

- propose the dictionary's verbatim description as the
  `canonical_value`
- record per-row notes that surface the RCW 84.34 sensitivity to
  the operator at C24-C review time
- emit M1 / M3 / M4 deferrals with the same shape as C22-A /
  C23-A, plus a Land-specific note paragraph

## Hard Guards

The five guards below extend the C11-A batch-edit Hard Guards +
the C22-A / C23-A dictionary-loader Hard Guards with C24-specific
safety. C24-B implementation must satisfy all of them.

### 1. Read PACS, never write

The loader connects to PACS via the existing `--connection-id`
SyncSourceConnection lookup pattern (D0-D-laminated). Every PACS
query is `SELECT`-only. No `INSERT`, `UPDATE`, `DELETE`, `MERGE`,
DDL, or stored-procedure call.

### 2. Read-only workbook surface

C24-B's loader does not call `SaveChangesAsync` against the
workbook DbContext. It produces a review CSV file + mismatch
report + run log. The CSV is fed into the existing C11-B batch-
edit pipeline as a separate operator-driven step (C24-C).

### 3. No autodetection / no inferred RCW intent

The dictionary's description column supplies the *proposed*
canonical_value for `Mapped` rows. The operator confirms each
row at C24-C. **No code-prefix heuristic, no current-use class
inference, no RCW 84.34 eligibility assertion** is introduced by
this slice. `DRAG1` does not become "Dryland Ag Class 1" by
loader inference; it becomes whatever the dictionary's
description column says, and the operator confirms whether that
description aligns with the county's WSDOR / DOR per-acre table.

### 4. Year-aware reads + live-inspection-driven config

Per D0-D's year-keyed dictionary pattern + C22-B-live's +
C23-B-live's lessons:

- C24-B's loader configuration (column names + active flag +
  year keying) MUST come from the C24-B preflight inspection,
  NOT from hardcoded assumptions copied from C22-B's
  `property_use` config or C23-B's `imprv_det_class` config.
- If `land_soil` is year-keyed (likely, given WSDOR per-acre
  tables are revised periodically), the loader filters by
  `pacs_system.appr_yr` by default.
- If the dictionary is universe-wide, the loader proceeds
  without year filtering and notes this in output.

### 5. Allowlisted dictionary table

C24-B extends the SyncAtlas allowlist (currently
`property_use ∪ imprv_det_class`) to include `land_soil`. The
CLI rejects any table name outside the allowlist. Adding
`land_soil` to the allowlist is itself a code-line change in this
slice's successor; no operator can run C24-B against an unlisted
table.

## Live Inspection Required (gate before C24-B)

Before C24-B implementation begins, the operator (or a C24-B
preflight slice) must run a live inspection of `dbo.land_soil` in
the live PACS environment and record the findings in
`backend/artifacts/sync-atlas/c24-a/<run-id>/dictionary-inspection.txt`.

The inspection MUST capture:

```sql
-- Schema introspection
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'land_soil'
ORDER BY ORDINAL_POSITION;

-- Row count
SELECT COUNT(*) AS total_rows FROM dbo.land_soil;

-- Top 50 sample
SELECT TOP (50) * FROM dbo.land_soil ORDER BY 1;

-- Duplicate-code probe
SELECT land_soil_code, COUNT(*) AS n
FROM dbo.land_soil
GROUP BY land_soil_code
HAVING COUNT(*) > 1;

-- Year-keying probe (if a year column exists)
SELECT DISTINCT <year-column>, COUNT(*)
FROM dbo.land_soil
GROUP BY <year-column>
ORDER BY <year-column>;
```

The inspection identifies (operator-recorded findings, not
loader-inferred):

1. **Code column** — exact name (likely `land_soil_code` or
   `soil_cd`; verify).
2. **Description / name column** — exact name (per C23-B-live
   "_desc" vs "_cls_desc" lesson, do not assume).
3. **Active / inactive indicator** — column name + semantics.
4. **Year / version columns** — whether the dictionary is
   year-keyed (very likely for WSDOR-driven tables).
5. **Duplicate-code risk** — does the table allow multiple rows
   with the same code (across years or inactive rows)?
6. **Per-acre / WSDOR-class columns** — informational only;
   the loader does NOT read these as canonical-value sources.
7. **Current-use linkage columns** — informational only;
   the loader does NOT propagate current-use intent.

The inspection output is the input to C24-B's per-county column
configuration block. C24-B does not hardcode column names; it
loads them from the inspection findings.

## Mismatch Rules

When C24-B runs, the same five mismatch shapes from C22-A apply.
Output conventions are identical to C22-A / C23-A, with one
Land-specific note added to every classification.

### Rule M1 — Workbook code present, dictionary code missing

Workbook has `land_soil_code = 'X'` but `dbo.land_soil` has no
row with that code.

**Output**: `review_status=Deferred` with notes documenting:
- the data-integrity issue
- the 2017 conversion caveat
- **Land-specific note**: "RCW 84.34 / current-use eligibility
  cannot be determined from a missing dictionary row; operator
  must consult WSDOR / DOR per-acre table before confirming."

### Rule M2 — Dictionary code present, workbook code absent

Dictionary has codes the workbook never observed.

**Output**: row is **NOT included** in the review CSV. The
workbook only reviews observed codes.

### Rule M3 — Duplicate dictionary code

Dictionary has multiple rows with the same code.

**Output**: `review_status=Deferred` with notes naming the
ambiguous matches + Land-specific note: "Duplicate land_soil
codes typically indicate year-keyed revisions; operator
selects the appropriate WSDOR / DOR vintage during C24-C
review."

### Rule M4 — Inactive dictionary row

Dictionary has the code but it's marked inactive.

**Output**: `review_status=Deferred` with notes documenting the
inactivity + Land-specific note: "Inactive land_soil rows may
represent superseded WSDOR per-acre vintages; operator
determines whether the inactive row's per-acre table is still
applicable to the parcels carrying this code."

### Rule M5 — Clean match (the happy path)

Workbook has `land_soil_code = 'W'` and the dictionary has
**exactly one active** row with that code.

**Output**: `review_status=Mapped` with the dictionary's
description as `canonical_value`, `canonical_target=LandSoil`,
notes documenting:
- the dictionary match
- the 2017 conversion caveat
- **Land-specific note**: "Mapping reflects current dictionary
  semantics. Operator confirms the dictionary description aligns
  with the WSDOR / DOR per-acre table the county is using; the
  loader does not assert per-acre value or RCW 84.34 eligibility."

## Review CSV Output Shape

C24-B's loader produces a CSV in the C11-A grammar:

```text
scope,source_schema,source_table,source_column,source_value,review_status,canonical_target,canonical_value,canonical_value_null,is_excluded,notes
```

For each of the 35 Deferred workbook rows, the loader proposes
exactly one CSV row classified per M1-M5. Output lands at:

```text
backend/artifacts/sync-atlas/c24-b/<run-id>/land_soil-proposed-review.csv
backend/artifacts/sync-atlas/c24-b/<run-id>/land_soil-mismatch-report.md
backend/artifacts/sync-atlas/c24-b/<run-id>/dictionary-inspection.txt
backend/artifacts/sync-atlas/c24-b/<run-id>/loader-run.txt
```

The CSV is **not committed**. It's operator-reviewable, then fed
into C11-B's `--batch-edit-mapping-workbook --apply` pipeline at
C24-C. C24-A and C24-B together do not touch a workbook row.

## RFC 4180 quoting

Inherited from C17-A2 / C19-B / C20-A / C22-A / C23-A. The
dictionary's description column may contain commas / quotes;
C24-B's CSV emitter applies RFC 4180 quoting per the established
pattern.

## Pre-2017 Conversion Caveat (cross-reference)

Same as C22-A / C23-A. Pre-2017 PACS records may carry
`land_soil_code` values whose semantics differ from current
dictionary interpretation. C24-B's loader records the caveat in
each proposed Mapped row's `notes` field; operator confirms
during C24-C review.

**Land-specific amplification**: pre-2017 land_soil_code values
may also reflect superseded WSDOR per-acre vintages. The loader
records the caveat; the operator decides whether to revalue at
C24-C or to keep the historical mapping.

## Audit Expectations

### What C24-B produces (read-only loader)

```text
backend/artifacts/sync-atlas/c24-b/<run-id>/
├── dictionary-inspection.txt            # Live PACS inspection
├── workbook-pre-state.txt               # 35 Deferred rows confirmed
├── land_soil-proposed-review.csv        # Proposed review CSV (35 rows)
├── land_soil-mismatch-report.md         # M1-M5 counts + first 50 examples
└── loader-run.txt                       # CLI stdout
```

None committed. `backend/artifacts/` is gitignored.

### What C24-B does NOT produce

- No workbook row mutations.
- No PACS row mutations.
- No `SaveChangesAsync` calls.
- No PostgreSQL writes.
- No RCW 84.34 / current-use assertions.
- No WSDOR per-acre value lookups, propagations, or
  canonicalizations.

### What C24-C eventually does (separate slice)

- Operator reviews `land_soil-proposed-review.csv`.
- Operator may rephrase canonical_values for WSDOR / DOR
  per-acre table alignment.
- Operator runs `--batch-edit-mapping-workbook --apply` against
  the operator-approved CSV via the existing C11-B path.
- The 35 Deferred rows convert to whatever terminal status the
  operator confirms (Mapped / Excluded / Deferred-with-notes).

## Hard Non-Goals

| Non-goal | Rationale |
|---|---|
| **Auto-promote workbook rows to Mapped without operator approval** | Dictionary is evidence, not authority. RCW 84.34 sensitivity makes this stricter than C22-A / C23-A. |
| **Infer current-use / RCW 84.34 intent from code prefix** | `DRAG*`, `IRAG*`, `DRPA*` patterns are NOT loader-actionable; only the operator can confirm WSDOR / DOR class alignment. |
| **Read or propagate WSDOR / DOR per-acre values** | Per-acre valuation is the operator's authority via the per-acre table; the loader proposes labels, not values. |
| **Apply dictionary to other land_detail columns in this slice** | `land_detail.primary_use_cd` and `land_detail.land_type_cd` each need their own policy slice. |
| **Pull Marshall & Swift cost-schedule references** | M&S integration disabled in the live install per D0-D. |
| **Mutate PACS rows** | Read-only by policy. |
| **Run a recalc / canonicalize / qualify-sales / current-use re-eligibility side effect** | Decoupled by design. |
| **Skip the live inspection gate** | C24-B cannot run until inspection captures column names; no hardcoded assumptions per the C22-B-live + C23-B-live pattern. |
| **Cross-county vocabulary import** | Per-PACS-instance variation per D0-D. WSDOR per-acre tables are county-applied; dictionary description ≠ per-acre value. |

## Success Gates for C24-B (loader implementation slice)

| Gate | Pass criterion |
|---|---|
| **Inspection captured** | `dictionary-inspection.txt` exists with column-name / active-flag / year-keying findings. |
| **Loader runs read-only** | C24-B run produces zero workbook mutations and zero PACS mutations. Verified by pre/post timestamp comparison. |
| **35 rows classified** | Output CSV (or rejected-row sidecar) accounts for all 35 workbook Deferred rows. M1+M3+M4+M5 sum equals 35. |
| **No `Mapped` without dictionary match** | Every Mapped row has a corresponding active, unambiguous dictionary row. |
| **RFC 4180 compliance** | CSV passes the C11-B parser's dry-run validation step. |
| **Sales / Valuation / Improvement preservation** | wac_cd 54/54 + sl_ratio_type_cd 23/23 + property_use_cd 62/62 + imprv_det_class_cd 21/21 anchors byte-for-byte unchanged. |
| **Land Tier 1 preservation** | `land_detail.primary_use_cd` 54/54 anchor byte-for-byte unchanged. |
| **No code-prefix inference** | Loader's classification logic does not branch on `SourceValue` substrings. The same M1-M5 machinery used for property_use / imprv_det_class is used here unchanged. |
| **Leak scan clean** | No PACS credentials / API keys / WSDOR per-acre values in any artifact. |

## Success Gates for C24-C (operator-approve-and-apply slice)

Inherits the C13-A success-gate template:

| Gate | Pass criterion |
|---|---|
| **Workbook stays Draft** | C24-C apply does not lock. |
| **Exact mutation count** | `Audit Stamp Bump: 1`; exactly 35 rows mutated. |
| **Sales / Valuation / Improvement / Land Tier 1 preserved** | All anchor lanes byte-for-byte unchanged. |
| **land_soil_code column-row preserved** | Column row stays at its pre-apply status; CSV mutates code-value rows only. |
| **Operator-confirmed RCW 84.34 alignment** | Each Mapped row's canonical_value carries the operator's WSDOR / DOR per-acre table confirmation in the notes field. |

## Recommended pacing

Per the C22 / C23 series precedent + Land-specific scope:

- **C24-B** (loader implementation + live run): one session,
  small. Allowlist extension + Program.cs config branch + new
  `LandSoilDictionaryLoaderTests` covering the Land-specific
  notes language. **No new service class** — exercises the
  C23-B generalized `DictionaryLoaderService` with a third
  target config.
- **C24-C** (operator review + apply): one session, smallest in
  the C24 series, but with the most operator-side work:
  cross-checking each proposed canonical_value against the
  county's WSDOR / DOR per-acre table before confirming.

## What This Enables (non-binding)

- **C24-B** — the actual loader run. Inherits this slice's
  mismatch rules, output shape, inspection gate, and Land-
  specific note language.
- **C24-C** — operator-driven CSV review and apply. Promotes the
  35 Deferred rows to whatever terminal status the operator
  confirms after WSDOR / DOR cross-check.
- **C24-D / C25 / C26** — the same policy shape applied to the
  next dictionary tables in priority order:
  - `imprv_det_meth` (10 codes, in workbook's Improvement /
    Other lane)
  - `imprv_det_sub_class` (2 codes; smallest)
  - `nbhd_codes` after C20-C workbook extension
- **WSDOR / DOR per-acre alignment proof** — once C24-C lands
  operator-confirmed canonical_values, future Land-valuation
  consumers can read RCW-aware classifications through the
  workbook's `(canonical_target=LandSoil, canonical_value=...)`
  surface, with an audit trail showing operator confirmation
  against the per-acre table.

## Hard Non-Goals (recap)

This doc explicitly does NOT:

- Modify any workbook row.
- Change C3-loader behavior.
- Promote any Deferred row.
- Build or change any code.
- Touch the running PACS sync service install.
- Pick which county to onboard next.
- Mandate a WSDOR / DOR per-acre canonical-value vocabulary
  (operator-defined at C24-C).
- Read or propagate per-acre values.
- Assert RCW 84.34 / current-use eligibility.

## What This Slice Is

The third dictionary-aware policy in TerraFusion. C22-A
established the architecture; C23-A confirmed the architecture
generalizes to a different lane (Improvement Tier 2); C24-A
confirms the architecture extends into a tax-sensitive Land-lane
domain under RCW 84.34 *without* loosening any guard. The
generalized loader from C23-B carries the implementation cost
forward; this slice's only contribution is the policy + the
Land-specific notes language operators will see at C24-C.

## What This Slice Is Not

A loader. A workbook write. A code change. A schema migration. A
canonical-vocabulary commitment beyond what the operator-confirmed
C24-C apply produces. A WSDOR / DOR per-acre value extraction. A
RCW 84.34 eligibility tool. A current-use re-classification
engine. A coverage expansion to other Land-tier columns.

## Related policy memory

| Doc | Layer |
|---|---|
| `docs/sync/sales-review-csv-policy.md` (C13-A + amendment) | sales-lane review contract + 2017 caveat |
| `docs/sync/valuation-review-csv-policy.md` (C16-A) | valuation-lane review contract |
| `docs/sync/improvement-review-csv-policy.md` (C17-A + A2 + A3) | improvement-lane three-tier contract + i_attr_id mappings |
| `docs/sync/land-review-csv-policy.md` (C19-A) | land-lane review contract + RCW 84.34 — **this slice's parent contract** |
| `docs/sync/neighborhood-review-csv-policy.md` (C20-A + A2) | neighborhood-lane contract + hood_cd domain truth |
| `docs/sync/mapping-workbook-batch-edit-policy.md` (C11-A) | the batch-edit grammar this slice's CSV is fed into at C24-C |
| `docs/sync/pacs-canonical-dictionaries-reference.md` (C21-A) | PACS dictionary catalog — `land_soil` is one of 10 |
| `docs/sync/pacs-canonical-dataflow-identity-policy.md` (D0-D) | identity / dataflow / cache rules |
| `docs/sync/property-use-dictionary-loader-policy.md` (C22-A) | first dictionary-loader policy — architectural template |
| `docs/sync/imprv-det-class-dictionary-loader-policy.md` (C23-A) | second dictionary-loader policy — Improvement Tier 2 |
| **`docs/sync/land-soil-dictionary-loader-policy.md` (C24-A)** | **this doc — third dictionary-aware slice (Land lane, RCW 84.34-sensitive)** |
