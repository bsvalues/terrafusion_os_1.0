# Mapping Workbook Lock CLI Policy

> Slice C10-A — design only. **No CLI code lands with this slice.** The
> accompanying implementation is Slice C10-B.

This document defines the safety contract for the operator command that
promotes a Draft Mapping Workbook to Mapped. The lock CLI is the bridge
between operator review work (Slice C9 — edit) and transform consumption
(Slice C8 — qualify-sales, plus future lanes). Once a workbook is
locked, downstream consumers can rely on it; once it's locked, the
edit CLI refuses to touch it. This is the most consequential single-row
mutation in the whole sync workbench, so it gets the same policy-first
treatment edit did.

The C6 service (`SyncMappingWorkbookLockService`, merged at
`44c7c1737`) already encodes the validation rules and is heavily
tested (22 tests in `SyncMappingWorkbookLockServiceTests`). C10-B is
the thinnest possible CLI shim over that service; this document
defines the surface.

The atlas got a stamp policy before touching the big stamp.

## Purpose

Provide a controlled, county-scoped, single-workbook command that:

1. Validates every column and every code-value row in the named
   workbook has reached a terminal review status
   (`Mapped` / `Excluded` / `Deferred`).
2. Flips workbook `Status='Draft'` → `Status='Mapped'`.
3. Bumps audit fields on the workbook row.
4. Touches **nothing else** in the database.

The CLI is the only sanctioned operator path for promoting a workbook.
Direct `UPDATE` against `SyncMappingWorkbooks` is forbidden by
operational policy (and the C2 schema's `AuditableEntityInterceptor`
won't stamp it correctly anyway).

## Hard Guards

The C6 service enforces every guard; the CLI propagates each error
message verbatim. The operator never sees a raw stack trace.

1. **Status guard.** Workbook must be `Status='Draft'`. Any other
   status (`Mapped` / `Approved` / `Archived` / etc.) refuses with
   the same shape used by C6, C7, C8-C, C9-B:
   `"Mapping workbook <id> has Status='X'. Only workbooks with
   Status='Draft' can be locked."`
2. **County scope.** The workbook's `CountyId` must match the
   operator's `--county-id`. Cross-county lock attempts surface as
   `"not found for county"` and never reveal whether the workbook
   exists in a different scope.
3. **Workbook completeness.** Every `SyncMappingColumn` AND every
   `SyncMappingCodeValue` row attached to the workbook must have a
   `ReviewStatus` in the terminal set:
   ```
   { Mapped, Excluded, Deferred }
   ```
   `NeedsReview` and `InProgress` are explicitly NOT terminal. The
   C6 service builds a one-line error summary that names up to 3
   non-terminal columns and up to 3 non-terminal code-values; the
   CLI relays it as-is. The operator's job is to fix those rows
   (via the C9-B edit CLI) and re-run lock.
4. **One-shot.** Locking is a one-way transition in the operator
   workflow. The CLI does not implement an `--unlock` form. Rolling
   a Mapped workbook back to Draft requires a deliberate separate
   action (e.g. regenerate a new Draft workbook from the same
   profile batch via `--generate-mapping-workbook --replace-existing-draft`,
   which only works on Draft, so in practice means archiving the
   Mapped one and starting over).

## CLI Mode

The lock CLI is the **sixth** mutually-exclusive SyncAtlas mode:

| Mode | Trigger | Slice |
|---|---|---|
| Profile (default) | (no toggle) | B1.5 / B2.x |
| Generate workbook | `--generate-mapping-workbook` | C4 |
| Export workbook | `--export-mapping-workbook` | C5 |
| Qualify sales | `--qualify-sales` | C8-C |
| Edit workbook | `--edit-mapping-workbook` | C9-B |
| **Lock workbook** | **`--lock-mapping-workbook`** | **C10-B (this slice's contract)** |

The six toggles are mutually exclusive — exactly one per invocation.
All other modes' flags must be rejected inside a lock invocation, and
the lock flag must be rejected inside any other mode.

## Required Fields

| Field | Required | Example |
|---|---|---|
| `--db` | Always | `"Host=localhost;Port=5432;Database=terrafusion;…"` |
| `--county-id` | Always | `19190019-1919-1919-1919-191919191919` |
| `--lock-mapping-workbook` | Lock mode | (toggle, no value) |
| `--workbook-id` | Lock mode | `a767c8a2-5b8a-4846-af8b-c3496601e924` |
| `--operator` | Always (default `cli-operator`) | `bsval` |

`--connection-id` is **not** required (the lock service never queries
PACS). All edit-mode flags (`--source`, `--source-value`,
`--canonical-target`, `--canonical-value`, `--canonical-value-null`,
`--review-status`, `--is-excluded`, `--notes`), all generate-mode
flags, all export-mode flags, all qualify-sales-mode flags, and all
deep-profile flags are rejected.

## CLI Examples

### Targeted lock against the C4.1 workbook

```bash
sync-atlas --db "$TF_DB" \
  --county-id "19190019-1919-1919-1919-191919191919" \
  --lock-mapping-workbook \
  --workbook-id "a767c8a2-5b8a-4846-af8b-c3496601e924" \
  --operator bsval
```

Against the current state of that workbook (1 reviewed, 1,732
NeedsReview), this command **must fail closed with exit 2** and a
message naming a few example non-terminal rows. That failure is the
expected proof of the C10-B implementation slice's first real run.

## Expected Failure on the Current Real Workbook

The C4.1 workbook (`a767c8a2-5b8a-4846-af8b-c3496601e924`) state at
`main` tip `7b86bbf17`:

| Metric | Value |
|---|---|
| Status | `Draft` |
| Columns | 200 |
| Code values | 1,733 |
| Reviewed (terminal status) | 1 (`sale.wac_cd / 458-61A-217(1)` → `Excluded`) |
| `NeedsReview` | 1,732 |
| `InProgress` | 0 |

A C10-B lock attempt against this state will surface the C6 service's
verbatim `InvalidOperationException` message:

```
sync-atlas: Mapping workbook a767c8a2-5b8a-4846-af8b-c3496601e924 cannot be locked:
            200 column(s) and 1732 code-value(s) still need review
            (terminal statuses: Mapped, Excluded, Deferred).
            Examples: columns [imprv.imprv_state_cd=[NeedsReview],
            imprv_attr.i_attr_val_cd=[NeedsReview],
            imprv_detail.imprv_det_class_cd=[NeedsReview]];
            values [value '<X>'=[NeedsReview], ...].
exit=2
```

The 200-column count is itself worth surfacing: every column in the
workbook is also `ReviewStatus='NeedsReview'` because the C3 loader
seeds new columns in that state. The operator has to walk both
levels — column-level review status AND every code-value's review
status — before lock will succeed.

## Success Output

When all 200 columns and all 1,733 code-values have moved to a
terminal status, a lock invocation prints a one-page summary
mirroring the existing C4 / C5 / C8-C / C9-B output style:

```
sync-atlas: locking mapping workbook a767c8a2-5b8a-4846-af8b-c3496601e924...
sync-atlas:   operator:  bsval

─────────────────────────────────────────────
  Mapping Workbook:        locked
  Workbook Id:             a767c8a2-5b8a-4846-af8b-c3496601e924
  Status:                  Mapped
  Columns Validated:           200
  Code Values Validated:     1,733
─────────────────────────────────────────────
```

The two `*Validated` counts come straight from
`SyncMappingWorkbookLockResult.ColumnsValidated` /
`CodeValuesValidated` — they're "what we walked," not just "what we
mutated." Locking flips one field on one row (`workbook.Status`)
plus its audit timestamp; nothing else.

## Audit Expectations

- Workbook `Status` flips `Draft` → `Mapped` via the C6 service path.
- Workbook `UpdatedAt` updates to `now()`.
- Workbook `UpdatedBy` stamps with `--operator` (default `cli-operator`).
- Workbook `CreatedAt` / `CreatedBy` are NEVER touched.
- **No** column row's audit fields change.
- **No** code-value row's audit fields change.
- The lock service does not write to `SyncProfileCodeCandidate`,
  `SyncBatch`, `SyncSourceConnection`, or any canonical / valuation
  / spatial table.

## Hard Non-Goals

The lock CLI must NOT:

- **Auto-complete `NeedsReview` / `InProgress` rows.** No silent flip
  to `Mapped` to satisfy the completeness rule. The operator decides
  every row via the C9-B edit CLI (or accepts the row's current
  `Excluded`/`Deferred` decision) before lock will succeed.
- **Implement `--unlock`.** Lock is one-way in the operator workflow.
  Rolling back a Mapped workbook to Draft is a deliberate separate
  action (regenerate a new Draft from the same profile batch and
  archive the locked one); the lock CLI does not provide a reverse.
- **Run any transform.** Locking is a status flip. Qualify-sales,
  property valuation, IAAO ratio studies, etc. all stay on their
  separate, downstream paths.
- **Mutate PACS.** No SQL Server connection is opened.
- **Mutate canonical landing tables.** `Owners`, `OwnershipEvents`,
  `LandSegments`, `ImprovementDetails`, `SyncRecords` — all out of
  scope.
- **Mutate Forge / TerraAtlas / Studio / Dais artifacts.** Suite
  boundary preserved.
- **Bypass county isolation.** The `--county-id` + workbook-id
  composite key is enforced by the C6 service.
- **Batch-lock multiple workbooks.** Single workbook per invocation.
  Future batch tooling is its own slice with its own card.
- **Auto-export.** A successful lock does not trigger `--export-mapping-workbook`.
  The operator runs export separately if they want a fresh CSV/MD
  packet of the now-Mapped workbook.

## Future Implementation Tests (C10-B)

The C6 lock service is already exhaustively tested
(`SyncMappingWorkbookLockServiceTests` — 22 tests covering Status
guard, completeness rule, county isolation, no-mutation-on-failure,
WAC preservation, audit stamping, edge cases, and argument
validation). C10-B's CLI tests are intentionally narrow — only the
parser surface and the output formatting / error propagation, since
the heavy lifting is already proven below.

### Parser tests (CliArgsParserTests)

- `Parse_LockMappingWorkbookSetsMode`
- `Parse_LockRequiresWorkbookId`
- `Parse_LockMode_DoesNotRequireConnectionId`
- `Parse_LockMutuallyExclusiveWithProfileGenerateExportQualifyEdit`
  (Theory ×4 — one row per "lock + other-mode" combination)
- `Parse_LockRejectsGenerateFlags` (`--workbook-name` etc.)
- `Parse_LockRejectsExportFlags` (`--output-dir`, `--format`)
- `Parse_LockRejectsQualifyFlags` (`--source-connection-id`,
  `--max-sales`)
- `Parse_LockRejectsEditFlags` (`--source`, `--source-value`,
  `--canonical-*`, `--review-status`, `--is-excluded`, `--notes`)
- `Parse_LockRejectsDeepProfileFlag` (`--deep-profile`,
  `--deep-profile-include`, `--deep-profile-max-tables`)
- `Parse_FullLockFlagSet_RoundTripsAllFields`
- `UsageText_MentionsLockFlag`

### Program / output tests

The Program-level test surface is small but worth pinning:

- `Lock_OutputContainsExpectedFields` — successful-lock output
  contains `Workbook Id`, `Status: Mapped`, `Columns Validated`,
  `Code Values Validated` headers.
- `Lock_OutputDistinguishesSuccessAndFailure` — failure path
  surfaces the C6 verbatim message and exits 2.
- `Lock_RejectionMessageBubblesUpVerbatim` — when the C6 service
  throws, the CLI prints the exception message to stderr without
  reformatting.

### Defensive integration test

One InMemory-DbContext test that exercises the CLI dispatch path
end-to-end (Program.RunLockMappingWorkbookAsync, not the service in
isolation):

- `RunLockMappingWorkbookAsync_HappyPath_FlipsStatusToMapped`
- `RunLockMappingWorkbookAsync_NonTerminalRows_ReturnsExit2`

## Provenance

- C6 lock service (the single source of truth for validation
  semantics): merge `44c7c1737`. The CLI only relays the service's
  message verbatim and prints the success summary.
- C9-B edit CLI policy (companion mutation surface that produces the
  terminal review statuses lock requires): merge `92f939316`.
- C9-C first real edit proof (one row terminal, 1,732 to go): marker
  `7b86bbf17`.
- C8-D Draft guard proof (the qualify-sales companion fail-closed
  surface): marker `4112a5f19`.
- C2 schema review-status vocabulary (`SyncMappingColumn.ReviewStatus`,
  `SyncMappingCodeValue.ReviewStatus`).
- The terminal-review-status set is published as
  `SyncMappingWorkbookLockService.TerminalReviewStatuses` for any
  consumer (CLI, future UI, future API) that needs to display the
  closed vocabulary.

## Operator Workflow

The natural sequence with the lock CLI in place:

```
1. (already done) profile evidence:        sync-atlas --deep-profile …
2. (already done) generate Draft workbook: sync-atlas --generate-mapping-workbook …  → C4.1 marker
3. (already done) export review packet:    sync-atlas --export-mapping-workbook …    → C5.1 marker
4. (already done) review one WAC code:     sync-atlas --edit-mapping-workbook …      → C9-C marker
5. (in progress)  review remaining 1,732 values via repeated --edit-mapping-workbook
                  invocations (one row per call, per the C9-A policy)
6. (next)         lock when all rows terminal:
                    sync-atlas --lock-mapping-workbook --workbook-id <id>            → produces C10-C marker
                  expected to fail until step 5 completes; exit 2 with a message
                  naming a few non-terminal rows is the correct response.
7. (after lock)   transform consumers can now read the workbook:
                    sync-atlas --qualify-sales …                                      → C10-D marker (post-lock)
```

Steps 5 + 6 are operator labor, not transform development. Step 7
is already exercised by C8-C against fixtures and will run cleanly
against the real workbook once it locks.

## What This Document Is Not

- **Not an implementation.** Slice C10-B owns the C# parser changes,
  the dispatcher branch, and `RunLockMappingWorkbookAsync`. This
  document is the contract C10-B must obey.
- **Not a re-test of the C6 service.** Lock semantics are pinned at
  the service layer; C10-B only adds the CLI shim. The CLI tests
  cover the shim.
- **Not an unlock policy.** Reversing Draft → Mapped is intentionally
  out-of-scope. A future slice can document an unlock workflow if
  the operational need arises; today it does not.
- **Not a batch-lock policy.** One workbook per invocation. Multi-
  workbook batch tooling is its own slice with its own card.
- **Not a transform-trigger policy.** A successful lock does not
  invoke any downstream transform. Transform invocation remains an
  explicit operator command (`--qualify-sales`, etc.).
- **Not a UI / API specification.** Slice C10-B is a CLI mode.
  Surfacing it through HTTP / WPF / Electron is out of scope.
