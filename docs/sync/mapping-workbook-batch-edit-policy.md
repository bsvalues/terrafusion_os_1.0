# Mapping Workbook Batch Edit Policy

**Slice:** C11-A (docs-only — defines the contract for C11-B
implementation).
**Lifecycle layer:** review-throughput accelerator that sits between
C9-B (single-row edit) and C10-B (lock).
**Status:** policy locked; implementation deferred to C11-B.

## Provenance

- C2 schema: `SyncMappingWorkbook` / `SyncMappingColumn` /
  `SyncMappingCodeValue` (audit fields auto-populated by
  `AuditableEntityInterceptor`).
- C6 lock service: `SyncMappingWorkbookLockService` — defines the
  five-value review-status vocabulary and the three terminal values
  (`Mapped` / `Excluded` / `Deferred`).
- C9-A single-row edit policy: `docs/sync/mapping-workbook-edit-cli-policy.md`
  — the per-row contract this slice batches.
- C9-B single-row edit service: `SyncMappingWorkbookEditService` —
  the validation pipeline this slice will drive in a loop.
- C9-C first real edit proof — `sale.wac_cd / 458-61A-217(1)` →
  `Excluded`. The single anchor terminal row that exists today.
- C10-A lock CLI policy: `docs/sync/mapping-workbook-lock-cli-policy.md`
  — the downstream gate that this batch edit is unblocking.
- C10-C live lock guard proof at `64d41ee2e`: lock refused the C4.1
  workbook because **1,732 of 1,733 code-values still need review**.
  That is the throughput problem this slice exists to solve.
- Memory-flagged WacCd directive: "WAC values are excluded only when
  the operator explicitly says so." Preserved at every layer of the
  Mapping Workbook lifecycle since C3.

## Purpose

Enable controlled review throughput for `Status='Draft'` Mapping
Workbooks by applying a CSV file of explicit operator decisions in
one transactional pass. Same per-row contract as C9-B; new shape is
`many rows in one invocation`.

The current C4.1 workbook (`a767c8a2-5b8a-4846-af8b-c3496601e924`)
sits at:

| Metric | Value |
|---|---|
| Status | `Draft` |
| Columns | 200 |
| Code values | 1,733 |
| Terminal review status | 1 (`sale.wac_cd / 458-61A-217(1)` → `Excluded`) |
| Non-terminal | 1,732 |

Reviewing 1,732 code-values one CLI invocation at a time is not
viable. Reviewing them via uncontrolled SQL UPDATE bypasses every
guard the C9-B service enforces. C11-B (the implementation slice
that will follow this policy) bridges that gap with a CSV-driven
batch edit that runs each row through the same C9-B contract.

## Hard Guards

The four guards below are non-negotiable. The C11-B implementation
must enforce all of them; the C11-B test matrix must pin all of them
with at least one failing-input fixture each.

### 1. `Status='Draft'` only

Refuse the entire batch when the workbook is in any other status
(`Mapped`, `Approved`, `Archived`, etc.). One workbook-level status
check at the top of the batch run, before any row is processed.
Same gate as C9-B; same gate as C10-B. There is no `--force` flag,
no `--unlock-and-batch`, and no admin override.

### 2. County scope

The workbook must belong to the supplied `--county-id`. Cross-county
invocations are refused at the workbook lookup, identical to C9-B.
The CSV's `source_schema / source_table / source_column` triples are
matched only against columns belonging to **that** workbook —
nothing else.

### 3. All-or-nothing atomicity

The entire batch is one logical operation:

- **Validation phase:** every CSV row is validated (parse, scope,
  source identity, mutation legality, no duplicates, etc.) before
  any row is mutated.
- **Apply phase:** if and only if all rows validate cleanly, the
  service opens a single EF Core transaction, applies every row,
  bumps the workbook's audit timestamp once, commits, and returns.
- **Failure semantics:** if **any** row fails validation, **zero**
  rows mutate. The operator gets a complete error report; the
  workbook stays exactly as it was.

There is no "best-effort" partial-success mode. Half-applied batches
are exactly the kind of state that re-introduces the WacCd bug.

### 4. No auto-exclusion (WacCd directive preserved)

The batch path applies the same rule as C9-B:

> A code-value is excluded if and only if the operator explicitly
> supplies `review_status=Excluded` AND `is_excluded=true` for that
> exact row.

The batch service may not:

- pattern-match WAC code prefixes (`458-61A-*`) and auto-set
  `is_excluded=true`;
- expand operator decisions across statute families;
- infer exclusions from `canonical_value` text;
- carry forward exclusions from other workbooks or counties.

Every exclusion in the output traces to a specific input CSV row.

## CLI Surface

The batch edit becomes the seventh mode in the SyncAtlas CLI mutex,
extending the existing six-way mutex (Profile / Generate / Export /
Qualify / Edit / Lock) by one slot:

```text
--batch-edit-mapping-workbook   ← new mode toggle (C11-B)
```

### Required invocation shape

```bash
# Dry-run (mandatory before apply):
sync-atlas \
  --db "$TF_DB" \
  --county-id <county-id> \
  --batch-edit-mapping-workbook \
  --workbook-id <workbook-id> \
  --input-csv <path> \
  --dry-run \
  [--operator <name>]

# Apply (after dry-run is clean):
sync-atlas \
  --db "$TF_DB" \
  --county-id <county-id> \
  --batch-edit-mapping-workbook \
  --workbook-id <workbook-id> \
  --input-csv <path> \
  --apply \
  [--operator <name>]
```

### Required fields

| Field | Required | Example |
|---|---|---|
| `--db` | Always | `"Host=localhost;Port=5432;Database=terrafusion;…"` |
| `--county-id` | Always | `19190019-1919-1919-1919-191919191919` |
| `--batch-edit-mapping-workbook` | Batch mode | (toggle, no value) |
| `--workbook-id` | Batch mode | `a767c8a2-5b8a-4846-af8b-c3496601e924` |
| `--input-csv` | Batch mode | `./reviews/wac-codes-day-1.csv` |
| `--dry-run` \| `--apply` | **Exactly one** of the two | `--dry-run` |
| `--operator` | Always (default `cli-operator`) | `bsval` |

### Mode mutex extension

The C11-B implementation extends the SyncAtlas mode mutex from
six-way to seven-way. The batch flag is mutually exclusive with all
existing toggles (`--generate-mapping-workbook`,
`--export-mapping-workbook`, `--qualify-sales`,
`--edit-mapping-workbook`, `--lock-mapping-workbook`). All
profile-mode flags (`--deep-profile`, `--connection-id` for the
profile path, `--deep-profile-include`, `--deep-profile-max-tables`)
are rejected in batch mode. All single-row edit-mode flags
(`--source`, `--source-value`, `--canonical-target`, etc.) are
rejected in batch mode — those mutations come from the CSV, not the
command line.

### `--dry-run` vs `--apply`

| Aspect | `--dry-run` | `--apply` |
|---|---|---|
| Validation | full | full |
| Mutation | none | all rows in one transaction |
| Output | planned changes per row | applied changes per row |
| Exit on validation error | 2 | 2 |
| Exit on success | 0 | 0 |
| Audit-stamp bump | none | one per workbook (single timestamp) |

Both modes must run the **identical** validation pipeline. A dry-run
that passes must guarantee the apply will pass, modulo concurrent
modification by another operator (C11-B will document the
concurrency model — see C11-B test matrix below).

The CLI must refuse an invocation that supplies neither
`--dry-run` nor `--apply`, and must refuse an invocation that
supplies both.

## CSV Format

Operator-authored, header-row-required, UTF-8, comma-separated. Each
non-header row is one edit decision.

### Required columns

```text
scope             — "column" | "code_value"
source_schema     — e.g. "dbo"
source_table      — e.g. "sale"
source_column     — e.g. "wac_cd"
source_value      — required when scope=code_value; empty/blank when scope=column
review_status     — "NeedsReview" | "InProgress" | "Mapped" | "Excluded" | "Deferred"
```

### Optional columns (mutation fields)

```text
canonical_target        — column-scope only
canonical_value         — code-value-scope only
canonical_value_null    — code-value-scope only; "true" or empty
is_excluded             — code-value-scope only; "true" | "false" | empty
notes                   — column-scope or code-value-scope
```

### Scope semantics

Identical to C9-A:

| Scope | Identity | Allowed mutations |
|---|---|---|
| `column` | `(source_schema, source_table, source_column)` | `review_status`, `canonical_target`, `notes` |
| `code_value` | `(source_schema, source_table, source_column, source_value)` | `review_status`, `canonical_value`, `canonical_value_null`, `is_excluded`, `notes` |

Scope-incorrect combinations are validation errors:

- `canonical_target` on a `code_value` row → reject row
- `canonical_value` / `canonical_value_null` / `is_excluded` on a
  `column` row → reject row
- `canonical_value` AND `canonical_value_null` on the same row →
  reject row (mutex)
- A row with no mutation field set (only identity) → reject row
  (no-op edits are not allowed; they would still bump audit
  timestamps for no operator-visible reason)

### Identity matching

Same rules as C9-B:

- Case-insensitive matching for `source_schema`, `source_table`,
  `source_column`.
- Exact-after-trim matching for `source_value`. Whitespace inside
  the value is preserved verbatim.
- The triple/quad must resolve to **exactly one** column or
  code-value row in the target workbook. Zero matches → reject row.
  Multiple matches → reject row (this should never happen given the
  C2 schema's natural-key constraints, but the validator must check
  defensively).

### Duplicate-target rule

The CSV must not contain two rows that target the same workbook
entity:

- Two `column` rows with the same triple → reject batch.
- Two `code_value` rows with the same quad → reject batch.

A future "edit twice in one batch" use case would re-introduce the
ambiguity ("which edit wins?") that C9-B's idempotent re-edit
already solved at the per-call level. Reject at the CSV layer.

### Encoding and quoting

- UTF-8 only. UTF-8 BOM is tolerated and stripped.
- Standard RFC 4180 CSV quoting (double-quote field, double up
  internal quotes). The C11-B implementation must use a real CSV
  parser, not a `String.Split(',')`.
- Empty cells are distinct from missing cells. An empty
  `canonical_value` cell (the operator wrote `,,`) is **not** the
  same as a missing column header. Empty = "do not mutate this
  field." `canonical_value_null=true` is the explicit way to set
  the canonical value to NULL.

## Validation Output

Both `--dry-run` and `--apply` print the same structured per-row
report when validation fails. Format mirrors C5 / C8-C / C9-B / C10-B
output style.

### Failure (validation error in any row)

```text
sync-atlas: batch edit validation failed for workbook <id>
sync-atlas:   input csv:  <path>
sync-atlas:   total rows: <n>

─────────────────────────────────────────────
  Row  Scope        Source                    Error
─────────────────────────────────────────────
  3    code_value   dbo.sale.wac_cd /         is_excluded=true requires
                    458-61A-203(1)            review_status=Excluded
  7    column       dbo.imprv.imprv_state_cd  no matching column in workbook
  12   code_value   dbo.sale.sl_ratio_type_cd duplicate target with row 11
─────────────────────────────────────────────
  Validation errors: 3
  Rows that would apply: 0
─────────────────────────────────────────────
exit=2
```

The error column must be human-readable and operator-actionable.
"Validation failed" alone is not acceptable. Each error message must
name the specific rule that was violated and, when possible, the
exact field that caused it.

### Success (`--dry-run`)

```text
sync-atlas: batch edit DRY-RUN for workbook <id>
sync-atlas:   input csv:  <path>
sync-atlas:   total rows: <n>

─────────────────────────────────────────────
  Mapping Workbook:  <id>
  Mode:              dry-run (no mutations applied)
  Rows Validated:    <n>
  Rows To Mutate:    <m>
  Audit Stamp Bump:  none (dry-run)
─────────────────────────────────────────────
  Per-scope summary:
    column rows:     <a>
    code_value rows: <b>
─────────────────────────────────────────────
  Per-status summary (planned):
    → Mapped:        <c>
    → Excluded:      <d>
    → Deferred:      <e>
    → InProgress:    <f>
    → NeedsReview:   <g>   (yes, this is allowed — operator can
                            roll a row back from terminal)
─────────────────────────────────────────────
exit=0
```

### Success (`--apply`)

Same shape as the dry-run summary, but with `Mode: applied` and
`Audit Stamp Bump: 1` (the workbook's `UpdatedAt` and `UpdatedBy`
bumped once for the whole batch). Per-row state transitions are
printed only when verbose mode is added in a future slice.

### Status guard failure

When the workbook is not Status='Draft':

```text
sync-atlas: batch edit refused: workbook <id> has Status='<s>'.
            Only workbooks with Status='Draft' can be batch-edited.
exit=2
```

Verbatim from the C9-B service.

## Audit Expectations

### What the service mutates on `--apply`

- Per matched `SyncMappingColumn` / `SyncMappingCodeValue` row: the
  fields the CSV row mutated, plus `UpdatedAt` and `UpdatedBy`.
- The owning `SyncMappingWorkbook` row: `UpdatedAt` and `UpdatedBy`
  bumped **exactly once** per batch (not once per CSV row).
- Nothing else. The workbook's `Status`, `Name`, `CountyId`,
  `SourceConnectionId`, `ProfileBatchId`, `CreatedAt`, `CreatedBy`
  are never touched.

### What the service does **not** mutate

- `SyncMappingWorkbook.Status` — only C10-B's lock CLI flips Draft to
  Mapped. Batch edit is review throughput, not a status transition.
- `SyncProfile*` rows — the upstream profile is immutable from C11.
- `SyncSourceConnection*` rows — connections are managed elsewhere.
- PACS rows / canonical landing tables / Forge artifacts /
  TerraAtlas artifacts / Studio artifacts / Dais artifacts — same
  blast radius rule as C9-B.
- Any other workbook in the same county or any other county. The
  blast radius is exactly the rows the CSV identifies in **this**
  workbook.

## Hard Non-Goals

| Non-goal | Rationale |
|---|---|
| **Auto-promotion to Mapped on full review** | Lock is its own slice (C10-B). Batch edit and lock stay decoupled so a partial review session can land safely. |
| **`--force` / status override** | Re-introduces the C9-A no-bypass rule we already paid for. |
| **Wildcard / regex `source_*` matching** | Identity must be exact. Wildcards are how WAC pattern-exclusion gets re-introduced. |
| **Auto-fill `canonical_*` from operator-decided synonyms** | Adjacent rows with similar names are not the same row. The operator decides each one explicitly. |
| **Cross-workbook batch (one CSV → many workbooks)** | County isolation gate becomes ambiguous. Run the CLI once per workbook. |
| **Batch unlock or batch lock** | Lock is one-shot per C10-A. Unlock does not exist. |
| **Implicit qualify-sales after batch apply** | C8-C qualify is a separate read-only mode. The operator runs it manually. |
| **CSV diff/merge against a previous CSV** | Out of scope; would re-introduce concurrency ambiguity. |
| **PACS / canonical / Forge / TerraAtlas / Studio / Dais writes** | Same blast radius rule as every other Mapping Workbook slice. |
| **Frontend UI** | Frontend WIP is parked; CLI-first per the workbench identity. |

## Concurrency

The C11-B implementation must document its concurrency posture
explicitly. The minimum bar:

- The apply phase opens a single EF Core transaction.
- The transaction reads the workbook's `Status` and `RowVersion`
  (or equivalent) inside the transaction before mutating, refusing
  the apply if either changed since the validation phase.
- Two concurrent batch-edit invocations against the same workbook
  must result in exactly one succeeding and the other failing
  cleanly with a non-zero exit code and an "concurrent modification
  detected" error message.

C11-B's test matrix includes one concurrency test
(`BatchEdit_RejectsConcurrentApply`); see below.

## C11-B Test Matrix

The following tests pin the contract this policy locks. The C11-B
implementation must add all of them. Existing C6 / C9-B / C10-B
test surfaces must continue to pass — batch edit does not regress
single-row paths.

### CSV parser tests

Pure I/O-free unit tests, similar to `CliArgsParserTests`.

- `BatchEditCsvParser_AcceptsMinimalValidCsv`
- `BatchEditCsvParser_RejectsMissingRequiredColumn`
- `BatchEditCsvParser_RejectsUnknownColumn`
- `BatchEditCsvParser_RejectsScopeColumnWithSourceValue`
- `BatchEditCsvParser_RejectsScopeCodeValueWithoutSourceValue`
- `BatchEditCsvParser_RejectsCanonicalTargetOnCodeValueRow`
- `BatchEditCsvParser_RejectsCanonicalValueOnColumnRow`
- `BatchEditCsvParser_RejectsCanonicalValueAndCanonicalValueNullTogether`
- `BatchEditCsvParser_RejectsRowWithNoMutationField`
- `BatchEditCsvParser_RejectsInvalidReviewStatus` (closed vocabulary)
- `BatchEditCsvParser_RejectsInvalidIsExcluded`
- `BatchEditCsvParser_RejectsDuplicateColumnTarget`
- `BatchEditCsvParser_RejectsDuplicateCodeValueTarget`
- `BatchEditCsvParser_HandlesUtf8Bom`
- `BatchEditCsvParser_HandlesQuotedCommasAndNewlines`

### Batch edit service tests

InMemory-DbContext integration tests on a small fixture workbook
(2 columns, 6 code-values).

- `BatchEdit_DryRunDoesNotMutate`
- `BatchEdit_ApplyMutatesOnlyListedRows`
- `BatchEdit_RejectsNonDraftWorkbook`
- `BatchEdit_RejectsCrossCountyWorkbook`
- `BatchEdit_RejectsInvalidReviewStatus`
- `BatchEdit_RejectsMissingSourceValueForCodeValueScope`
- `BatchEdit_RejectsDuplicateRowsForSameTarget`
- `BatchEdit_RejectsPartialFailure_AllOrNothing`  *(any row fails → zero rows mutate)*
- `BatchEdit_DoesNotAutoExcludeWacCodes`  *(WAC code rows untouched unless explicitly named)*
- `BatchEdit_ApplyCanTerminalizeSmallFixtureWorkbook`  *(end-to-end:
  every row of a tiny workbook reaches terminal status; lock then
  succeeds — bridges to C10-B)*
- `BatchEdit_RejectsConcurrentApply`  *(second concurrent apply
  fails cleanly with a row-version / status-change message)*
- `BatchEdit_BumpsWorkbookAuditOnce`  *(N-row apply produces a
  single workbook UpdatedAt bump, not N)*
- `BatchEdit_PreservesUnlistedRows`  *(rows not named in CSV are
  byte-for-byte unchanged, including the C9-C anchor row)*

### CLI parser tests

Same pattern as the C10-B parser tests.

- `Parse_BatchEditMappingWorkbookSetsMode`
- `Parse_BatchEditRequiresWorkbookId`
- `Parse_BatchEditRequiresInputCsv`
- `Parse_BatchEditRequiresExactlyOneOfDryRunOrApply`
- `Parse_BatchEditRejectsBothDryRunAndApply`
- `Parse_BatchEditRejectsProfileFlags`
- `Parse_BatchEditRejectsGenerateFlags`
- `Parse_BatchEditRejectsExportFlags`
- `Parse_BatchEditRejectsQualifyFlags`
- `Parse_BatchEditRejectsSingleRowEditFlags`  *(--source, --source-value, --canonical-*, etc.)*
- `Parse_BatchEditRejectsLockFlags`
- `Parse_BatchEditMutuallyExclusiveWithOtherModes`
- `Parse_BatchEditMode_ExistingModesRemainCompatible`
- `UsageText_IncludesBatchEditMode`

### Live guard proof gates (post-C11-B)

After C11-B lands, two real-data proofs are required before any
review CSV touches the actual workbook:

1. **Dry-run proof on a synthetic CSV against the live workbook.**
   No mutation. Captured to `backend/artifacts/sync-atlas/c11-c-batch-dry-run.txt`.
2. **Apply proof on a deliberately tiny CSV (≤ 5 rows) against the
   live workbook.** Mutation count exactly matches CSV row count;
   workbook stays Draft; UpdatedAt bumps once.
   Captured to `backend/artifacts/sync-atlas/c11-c-batch-apply.txt`.

Both proofs must pass before any operator sends a >100-row CSV. The
C11-C live guard will add an empty marker commit after both pass.

## Operator Workflow

The natural sequence with batch edit in place becomes:

```text
operator authors review CSV (from PACS data dictionary, scratch notes,
                             prior workbook decisions, etc.)
                                ↓
                    sync-atlas --batch-edit-mapping-workbook --dry-run
                                ↓
                    review the dry-run summary; iterate on CSV
                                ↓
                    sync-atlas --batch-edit-mapping-workbook --apply
                                ↓
                    (loop with new CSV chunks until terminal coverage = 100%)
                                ↓
                    sync-atlas --lock-mapping-workbook    → flips Draft to Mapped
                                ↓
                    sync-atlas --qualify-sales            → C8-C consults the now-Mapped workbook
```

The single-row C9-B edit remains the way to do interactive
exploration ("what does this one weird WAC code do") and to fix
single-row mistakes after a batch apply. Batch edit is for review
throughput, not for everything.

## What This Document Is Not

- **Not an implementation.** No batch edit code is written until
  C11-B; this slice is purely the contract.
- **Not a migration.** No schema changes. The C2 schema already has
  every field this batch edit needs.
- **Not a license to skip C9-B's per-row contract.** Every CSV row
  is a C9-B edit. The batch service runs each row through the same
  validation pipeline, in-process, in one transaction.
- **Not a license to bypass the lock guard.** A fully-batch-reviewed
  workbook still has to pass through C10-B's lock CLI before any
  downstream consumer treats it as authoritative.
- **Not a frontend.** Frontend WIP is parked.
- **Not a permission system.** All authentication/authorization
  remains where it is today (operator identity is `--operator` plus
  the existing audit-interceptor wiring).
- **Not a license to auto-exclude WAC codes.** The memory-flagged
  WacCd directive is preserved at this layer the same way it was
  preserved at the C3 loader, the C5 export, the C7 read model, the
  C8-B/C transform, the C9-B edit, and the C10-A/B lock. A batch
  apply that contains zero `is_excluded=true` rows will land zero
  exclusions. Period.
