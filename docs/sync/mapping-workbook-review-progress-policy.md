# Mapping Workbook Review Progress Policy

**Slice:** C14-A (docs-only — defines the contract for C14-B
implementation: a read-only progress reporter that surfaces what's
blocking a Mapping Workbook from being lockable).
**Lifecycle layer:** review-throughput visibility — sits between the
edit slices (C9-B / C11-B / C13-B) that mutate review state and the
lock slice (C10-B) that gates downstream consumption. C14 does not
mutate; it only reports.
**Status:** policy locked; implementation deferred to C14-B.

## Provenance

- C2 schema: `SyncMappingWorkbook` / `SyncMappingColumn` /
  `SyncMappingCodeValue`. Audit fields auto-populated by
  `AuditableEntityInterceptor`.
- C6 lock service: `SyncMappingWorkbookLockService` — defines the
  three terminal review statuses (`Mapped` / `Excluded` /
  `Deferred`) and the workbook-completeness rule. The progress
  report quantifies exactly the gap between the current state and
  what the lock service would accept.
- C7 read model: `SyncMappingWorkbookReadModel` — read-only
  workbook surface used by C8-C qualify-sales. The C14-B
  implementation reuses or extends this read model rather than
  inventing a new query path.
- C9-B / C11-B / C13-B edit slices — every operator action they
  produce moves a row from non-terminal toward terminal; C14-B
  reports on that progress.
- Live workbook state at C13-B (`97245d619`):
  | Metric | Value |
  |---|---|
  | Status | `Draft` |
  | Columns | 200 |
  | Code values | 1,733 |
  | Terminal values | 8 |
  | Non-terminal values | 1,725 |
- Memory-flagged WacCd directive: "WAC values are excluded only
  when the operator explicitly says so." A progress report that
  surfaces "exclusion ratio per column" is fine; one that suggests
  exclusions is not. C14 reports facts, not recommendations.

## Purpose

Give the operator a one-page read-only view of how close a Mapping
Workbook is to lock readiness, broken down by lane / column /
review status. The report exists so larger review batches (10–30
rows per CSV per C13-C) are authored against actual blockers, not
guesswork.

The progress report is the operator's lock-readiness dashboard. It
is the only slice in the C-series that is purely informational —
every other slice either changes state or defines how state can
change.

## Hard Guards

The four guards below are non-negotiable. C14-B's implementation
must enforce all of them; the C14-B test matrix must pin all of
them.

### 1. Read-only

The report MUST NOT mutate any workbook or any other entity. In
implementation terms:

- No `SaveChangesAsync` call.
- No tracked entities returned from the DbContext (use
  `AsNoTracking()` on every query).
- The workbook's `UpdatedAt` / `UpdatedBy` are not touched.
- No `SyncBatch` row is written.
- No PACS / canonical landing / Forge / TerraAtlas / Studio / Dais
  read or write.

The C14-B test matrix pins this with a "workbook UpdatedAt
unchanged after report" test.

### 2. County scope

The workbook must belong to the supplied `--county-id`. Cross-
county invocation is refused at the workbook lookup, identical
shape to C5 / C8-C / C9-B / C10-B / C11-B. Sovereign County
isolation is non-negotiable here as everywhere else.

### 3. No status guard

Unlike every other workbook-mode slice, the progress report
accepts workbooks in **any** Status — `Draft`, `Mapped`,
`Approved`, `Archived`. The whole point is "tell me where I am,
including after lock." Status-gating the report would defeat its
purpose.

(The lock-readiness section accurately reflects post-lock state
too: a `Mapped` workbook reports `ReadyToLock: already locked` and
zero blockers.)

### 4. No autodetection of decisions

The report counts existing review-status values; it does not infer
what an unreviewed row "probably" should be. No frequency-based
heuristics, no pattern matching against statute prefixes, no
"recommended exclusion" column. The operator's eyes still do every
review decision; the report just tells them where to point those
eyes.

## CLI Surface

The progress report becomes the eighth mode in the SyncAtlas mode
mutex, extending the existing seven-way mutex (Profile / Generate /
Export / Qualify / Edit / Lock / BatchEdit) by one slot:

```text
--mapping-review-progress   ← new mode toggle (C14-B)
```

### Required invocation shape

```bash
sync-atlas \
  --db "$TF_DB" \
  --county-id <county-id> \
  --mapping-review-progress \
  --workbook-id <workbook-id> \
  [--operator <name>]
```

### Required fields

| Field | Required | Example |
|---|---|---|
| `--db` | Always | `"Host=localhost;Port=5432;Database=terrafusion;…"` |
| `--county-id` | Always | `19190019-1919-1919-1919-191919191919` |
| `--mapping-review-progress` | Progress mode | (toggle, no value) |
| `--workbook-id` | Progress mode | `a767c8a2-5b8a-4846-af8b-c3496601e924` |
| `--operator` | Always (default `cli-operator`) | `bsval` |

`--operator` is honored only for log-line provenance. Because the
report does not mutate, no audit field receives the operator id.

### Mode mutex extension (seven → eight)

The C14-B implementation extends the SyncAtlas mode mutex from
seven-way to eight-way. The progress flag is mutually exclusive
with all existing toggles. All other modes' input flags
(`--source`, `--source-value`, `--canonical-*`, `--review-status`,
`--is-excluded`, `--notes`, `--input-csv`, `--dry-run`, `--apply`,
`--workbook-name`, `--profile-batch-id`, `--latest-profile-batch`,
`--replace-existing-draft`, `--mapping-max-candidates`,
`--output-dir`, `--format`, `--source-connection-id`,
`--max-sales`, all `--deep-profile*` flags) are rejected in
progress mode — the report takes only `--workbook-id` plus the
shared identity flags. `--connection-id` is tolerated and ignored
(matches the lock mode's posture; the progress reporter never
queries PACS).

## Output Sections

The report writes a single one-page summary to stdout in the same
visual style as C4 / C5 / C8-C / C9-B / C10-B / C11-B output. Exit
codes:
- `0` — report rendered successfully.
- `1` — argument parse failure or missing required flags.
- `2` — workbook lookup failure (cross-county, missing).
- `3` — operator cancelled (Ctrl+C).

### 1. Workbook Summary

```text
sync-atlas: Mapping Workbook review progress for county <guid>...
sync-atlas:   workbook id: <guid>

─────────────────────────────────────────────
  Workbook Summary
─────────────────────────────────────────────
  Workbook Id:        <guid>
  Name:               <workbook-name>
  Status:             Draft
  County Id:          <guid>
  Source Connection:  <guid>
  Profile Batch:      <guid>
  Created:            <iso8601>
  Updated:            <iso8601>
  Created By:         <operator-id>
  Updated By:         <operator-id>
  Columns:                200
  Code Values:          1,733
  Lock Readiness:     not ready (1,725 code-values + N columns blocking)
─────────────────────────────────────────────
```

The "Lock Readiness" line is the headline — what every operator
will read first.

### 2. Review Status Counts

Every row breaks the workbook into the C2 review-status vocabulary:

```text
─────────────────────────────────────────────
  Review Status Counts
─────────────────────────────────────────────
  Scope        NeedsReview  InProgress  Mapped  Excluded  Deferred  Terminal  NonTerminal
  ────────     ───────────  ──────────  ──────  ────────  ────────  ────────  ───────────
  Columns              199           0       1         0         0         1          199
  Code Values        1,725           0       1         3         4         8        1,725
─────────────────────────────────────────────
```

- "Columns" row counts `SyncMappingColumn.ReviewStatus` values.
- "Code Values" row counts `SyncMappingCodeValue.ReviewStatus`
  values.
- Terminal = Mapped + Excluded + Deferred (mirrors
  `SyncMappingWorkbookLockService.TerminalReviewStatuses`).
- NonTerminal = NeedsReview + InProgress.

### 3. Lane Breakdown

Each `SyncMappingColumn.MappingLane` value gets one row, sorted by
PercentComplete ascending so the most-blocked lanes appear first:

```text
─────────────────────────────────────────────
  Lane Breakdown (sorted by % complete, ascending)
─────────────────────────────────────────────
  Lane              Columns  CodeValues  Terminal  NonTerminal  Percent
  ──────────────    ───────  ──────────  ────────  ───────────  ───────
  Improvement            87         412         0          412     0.0%
  Land                   23          81         0           81     0.0%
  Neighborhood           14          27         0           27     0.0%
  Other                  41         158         0          158     0.0%
  Valuation              28         298         0          298     0.0%
  Sales                   7         757         8          749     1.1%
─────────────────────────────────────────────
```

- "Columns" is `COUNT(DISTINCT SyncMappingColumn.Id)` per lane.
- "CodeValues" is `COUNT(DISTINCT SyncMappingCodeValue.Id)` for
  every column in the lane.
- "Terminal" / "NonTerminal" are computed from the code-value
  ReviewStatus only — column-row review statuses are surfaced in
  Section 2 but not included in the percent calculation here, so
  the percent reflects "how much of the actual decision surface is
  done." Column-row status is covered by Section 5.
- "Percent" = `Terminal / (Terminal + NonTerminal) * 100`, one
  decimal place. Zero-divide safe (a lane with zero code-values
  shows `n/a`).

### 4. Top Blocking Columns

The columns with the most non-terminal code-values, capped at the
top 20 (or fewer if there are fewer non-fully-reviewed columns):

```text
─────────────────────────────────────────────
  Top Blocking Columns (top 20 by NonTerminal desc)
─────────────────────────────────────────────
  Source                              Lane           NonTerminal  Terminal   Total
  ──────────────────────────────────  ─────────────  ───────────  ────────   ─────
  dbo.sale.wac_cd                     Sales                  157         5     162
  dbo.imprv.imprv_state_cd            Improvement             89         0      89
  dbo.imprv_attr.i_attr_val_cd        Improvement             67         0      67
  dbo.imprv_detail.imprv_det_class_cd Improvement             42         0      42
  dbo.sale.sl_ratio_type_cd           Sales                   38         3      41
  ...
─────────────────────────────────────────────
```

- "Source" is `<schema>.<table>.<column>`.
- "Lane" is `SyncMappingColumn.MappingLane`.
- Sort: `NonTerminal DESC, Source ASC`. Stable on ties.
- Columns with `NonTerminal = 0` are NEVER listed — they're not
  blocking anything.
- The cap (20) is fixed; not configurable in C14-B. A future slice
  could add `--top-n` but that's out of scope here.

### 5. Sales Review Focus

A pinned subsection that always shows the two sales-comp-blocking
columns, regardless of where they fall in the top-blockers ranking:

```text
─────────────────────────────────────────────
  Sales Review Focus (pinned)
─────────────────────────────────────────────
  Source                          ColumnReviewStatus  CodeValues  Terminal  NonTerminal  Percent
  ──────────────────────────────  ──────────────────  ──────────  ────────  ───────────  ───────
  dbo.sale.wac_cd                 NeedsReview                162         5          157     3.1%
  dbo.sale.sl_ratio_type_cd       NeedsReview                 41         3           38     7.3%
─────────────────────────────────────────────
```

The "ColumnReviewStatus" cell is the column-row status itself
(distinct from the per-code-value statuses), so the operator can
see whether the column-level decision still needs to be made
*after* every code-value reaches terminal.

If either column does not exist in the workbook, the row is
omitted with no error — the report still renders the rest cleanly.
(That state is unusual but possible after a non-default C3 loader
run.)

### 6. Lock Readiness

The bottom-line answer:

```text
─────────────────────────────────────────────
  Lock Readiness
─────────────────────────────────────────────
  Status:               not ready
  Blocking Columns:                    199  (NeedsReview / InProgress)
  Blocking Code Values:              1,725  (NeedsReview / InProgress)
  First Lockable When:  every column AND every code-value reaches a terminal status
                        (Mapped / Excluded / Deferred).
─────────────────────────────────────────────
```

When the workbook is fully terminalized:

```text
  Status:               READY
  Blocking Columns:                      0
  Blocking Code Values:                  0
  First Lockable When:  now — run --lock-mapping-workbook to flip Status to Mapped.
```

When the workbook is already locked (`Status='Mapped' /
'Approved' / 'Archived'`):

```text
  Status:               already <s>
  Blocking Columns:                      0
  Blocking Code Values:                  0
  First Lockable When:  workbook already past the Draft stage; lock cannot be re-run.
```

## Audit Expectations

### What the report does not write

- No new rows in any table.
- No mutations on any existing row.
- No `UpdatedAt` / `UpdatedBy` bumps — including on the workbook.
- No `AuditLogs` entries.
- No `SyncBatch` rows.
- The C14-B test matrix has a dedicated test (`Progress_DoesNotMutateWorkbookUpdatedAt`)
  that captures `UpdatedAt` before the report runs, runs the report,
  re-reads, and asserts byte-for-byte equality.

### What the report does read

- One workbook row.
- All columns of the workbook (typically ≤ 200).
- All code-values for the workbook (typically ≤ ~2,000).
- Nothing else. No `SyncProfile*`, no `SyncBatch`, no
  `SyncSourceConnection`, no PACS-side reads.

## Hard Non-Goals

| Non-goal | Rationale |
|---|---|
| **Recommend a review status for any row** | Re-introduces the "tool guessed" failure mode the WacCd directive rules out. |
| **Sort by exclusion ratio or any other "interesting" metric** | Sort is fixed (NonTerminal DESC). Operator-actionable beats operator-impressive. |
| **Per-county-pair drift comparison** | Out of scope; cross-county comparison is a separate slice with its own contract. |
| **CSV / JSON / Markdown export** | The report is human-readable stdout, same shape as every other SyncAtlas summary. Exporting would require a separate flag and its own format spec. |
| **Watch / live-update mode** | Static snapshot only. Re-run the command for a fresh view. |
| **Frontend dashboard** | Frontend WIP is parked. CLI-first per the workbench identity. |
| **Lock the workbook on `ReadyToLock=true`** | Decoupled by design. The operator runs `--lock-mapping-workbook` separately when ready. |
| **Cache or memoize results** | Read-only and bounded; a fresh query per invocation is correct and cheap. |
| **Auto-export the workbook on each progress run** | C5 export is a separate slice with its own contract. |

## C14-B Test Matrix

The following tests pin the contract this policy locks. The C14-B
implementation must add all of them. The existing C6 / C9-B / C10-B
/ C11-B test surfaces must continue to pass — progress reporting
does not regress edit / lock / batch-edit paths.

### Read-model tests (or equivalent)

InMemory-DbContext integration tests against a small fixture
workbook (4 columns × ~6 code-values total).

- `Progress_ReportsWorkbookSummary` — section 1 contains all named
  fields with correct values from the seeded workbook.
- `Progress_RejectsCrossCountyWorkbook` — supplying a foreign
  county-id throws an `InvalidOperationException` with `not found
  for county <id>`.
- `Progress_DoesNotMutateWorkbookUpdatedAt` — capture `UpdatedAt`
  before, run the report, re-read, assert unchanged.
- `Progress_CountsTerminalStatusesCorrectly` — fixture seeded with
  one of each terminal value; section 2 counts match.
- `Progress_CountsNonTerminalStatusesCorrectly` — fixture seeded
  with NeedsReview + InProgress mix; section 2 counts match.
- `Progress_GroupsByLane` — fixture seeded with two lanes; section
  3 has exactly two rows with correct lane labels and percentages.
- `Progress_ListsTopBlockingColumns` — section 4 sorted by
  NonTerminal DESC, Source ASC for stability, capped at 20, omits
  fully-reviewed columns.
- `Progress_IncludesSalesFocus` — section 5 always present, lists
  `dbo.sale.wac_cd` and `dbo.sale.sl_ratio_type_cd` even when not
  in the top 20 blockers.
- `Progress_OmitsSalesFocusRowWhenColumnAbsent` — fixture without
  `sl_ratio_type_cd` still renders `wac_cd` row and skips the
  missing one cleanly.
- `Progress_ReportsReadyToLockFalseWhenAnyRowNonTerminal` — single
  NeedsReview row → "not ready", correct blocker counts.
- `Progress_ReportsReadyToLockTrueOnFullyTerminalFixture` —
  fixture where every row is terminal → "READY", zero blockers.
- `Progress_ReportsAlreadyLockedWhenStatusMapped` — fixture with
  `Status='Mapped'` → "already Mapped", zero blockers, suggests
  lock cannot be re-run.

### CLI parser tests (CliArgsParserTests)

Same pattern as C10-B / C11-B parser tests:

- `Parse_MappingReviewProgressSetsMode`
- `Parse_ProgressRequiresWorkbookId`
- `Parse_ProgressRejectsProfileFlags` (`--deep-profile`,
  `--deep-profile-include`, `--deep-profile-max-tables`)
- `Parse_ProgressRejectsGenerateFlags` (`--workbook-name`, etc.)
- `Parse_ProgressRejectsExportFlags` (`--output-dir`, `--format`)
- `Parse_ProgressRejectsQualifyFlags` (`--source-connection-id`,
  `--max-sales`)
- `Parse_ProgressRejectsEditFlags` (`--source`, `--source-value`,
  `--canonical-*`, `--review-status`, `--is-excluded`, `--notes`)
- `Parse_ProgressRejectsLockFlags` — already covered by mutex but
  pinned explicitly
- `Parse_ProgressRejectsBatchEditFlags` (`--input-csv`,
  `--dry-run`, `--apply`)
- `Parse_ProgressMutuallyExclusiveWithOtherSevenModes` — Theory
  ×7 covering every other mode toggle paired with progress
- `Parse_ProgressMode_ExistingModesRemainCompatible` — sanity
  regression for the prior 7 modes
- `UsageText_IncludesProgressMode`

### Live guard proof gates (post-C14-B → C14-C)

After C14-B lands, one real-data proof is required before C14-C
markers:

1. Run progress report against the live C13-B workbook
   (`a767c8a2-5b8a-4846-af8b-c3496601e924`). Capture to
   `backend/artifacts/sync-atlas/c14-c/progress-c13b-state.txt`.
2. Verify report shows:
   - `Status=Draft`
   - `Code Values: 1,733`
   - `Columns: 200`
   - `Terminal: 8` (matches C13-B post-snapshot)
   - `NonTerminal: 1,725`
   - `ReadyToLock: not ready`
3. Verify workbook `UpdatedAt` is unchanged before vs. after the
   report (no audit-bump leak).
4. Empty marker commit lands only after the proof passes.

## Operator Workflow

```text
operator wants to plan the next review batch
                ↓
    sync-atlas --mapping-review-progress --workbook-id <id>
                ↓
    operator reads "Top Blocking Columns" + "Sales Review Focus"
                ↓
    operator picks 10–30 rows from a high-blocker column to author
    a C13-C review CSV against (sales-focused if sales is highest
    blocker; improvement-focused if that's higher; etc.)
                ↓
    sync-atlas --batch-edit-mapping-workbook --dry-run + --apply
                ↓
    sync-atlas --mapping-review-progress  ← repeat to verify drop
                                            in NonTerminal counts
                ↓
    (loop until ReadyToLock = READY)
                ↓
    sync-atlas --lock-mapping-workbook
```

The progress report becomes the operator's compass: they look at
it before authoring each batch CSV and again after applying it.
Every successful batch should drop the NonTerminal count by
exactly the rows in the CSV — a useful sanity check that the
batch landed where intended.

## What This Document Is Not

- **Not the implementation.** No code lands until C14-B; this slice
  is purely the read-only contract.
- **Not a writer.** The report produces stdout text only. There is
  no `--output` flag, no JSON mode, no database write.
- **Not a recommender.** It surfaces facts (counts, lanes,
  blockers); it does not suggest which rows to mark Excluded /
  Mapped / Deferred. That stays operator-decided.
- **Not a lock trigger.** "ReadyToLock: READY" tells the operator
  they could run `--lock-mapping-workbook`; it does not run lock
  itself.
- **Not a frontend.** The progress data is stdout text shaped for
  a human reading a terminal. A future frontend dashboard could
  query the same read model, but that's a separate slice with its
  own contract.
- **Not a license to relax the WacCd directive.** Even with a
  visible "Sales Review Focus" section putting WAC review in the
  spotlight, every WAC exclusion is still operator-decided
  per-row. The report makes the work visible; the operator does
  the work.
