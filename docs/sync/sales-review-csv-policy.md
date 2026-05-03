# Sales Review CSV Policy

**Slice:** C13-A (docs-only — defines the contract for C13-B
implementation: a hand-authored CSV of operator review decisions for
sales-comp-blocking codes that gets fed through the C11-B batch edit
CLI).
**Lifecycle layer:** sales-comp readiness — the review-throughput
work that has to happen before the lock CLI can succeed against the
live workbook and before any sales-comp transform consumer is
allowed to read the workbook as authoritative.
**Status:** policy locked; CSV authoring + C13-B live application
deferred to the next slice.

## Provenance

- C2 schema: `SyncMappingWorkbook` / `SyncMappingColumn` /
  `SyncMappingCodeValue` (audit fields auto-populated by the
  `AuditableEntityInterceptor`).
- C6 lock service: `SyncMappingWorkbookLockService` — the gate this
  policy is unblocking. Lock requires every column AND every
  code-value to reach a terminal review status (`Mapped` /
  `Excluded` / `Deferred`).
- C9-A single-row edit policy (`docs/sync/mapping-workbook-edit-cli-policy.md`)
  — the per-row review contract this CSV automates.
- C9-C first real edit proof (`sale.wac_cd / 458-61A-217(1)` →
  `Excluded`) — the original sales-comps anchor row that exists in
  the live workbook today.
- C10-A lock CLI policy (`docs/sync/mapping-workbook-lock-cli-policy.md`)
  — the downstream gate.
- C11-A batch edit policy (`docs/sync/mapping-workbook-batch-edit-policy.md`)
  — defines the CSV format, atomicity, and Hard Guards this slice
  authors review CSVs against.
- C11-C live batch edit proof (3-row CSV applied cleanly,
  `sale.wac_cd / 458-61A-203(1)` → `Excluded`,
  `sale.wac_cd / 458-61A-201` → `Deferred`,
  `property_val.property_use_cd` column → `Mapped`).
- C12 padded-source-value match fix (`MappingSourceValueMatcher`)
  + C12-live proof (`sale.sl_ratio_type_cd / 1` → `Deferred`) —
  the reason `sl_ratio_type_cd` is now safely in scope for this
  policy at all.
- Memory-flagged WacCd directive: "WAC values are excluded only when
  the operator explicitly says so." Preserved at every layer of the
  Mapping Workbook lifecycle. This policy is the layer where the
  directive is most operationally tested, since the operator is
  about to make dozens of WAC-row decisions in one CSV.

## Purpose

Capture, review, and apply the operator's decisions on the two
PACS source columns that gate sales-comp eligibility:

| Source | Purpose |
|---|---|
| `dbo.sale.wac_cd` | WAC (Washington Administrative Code) statute family + REET-exemption signal. Drives "is this sale arms-length and usable for comps?" |
| `dbo.sale.sl_ratio_type_cd` | Ratio-study qualification + type signal. Drives "should this sale enter the ratio study?" |

These two columns are the smallest set whose terminalization
unblocks downstream sales-comp work. Other columns (improvement
detail, property valuation, neighborhood, land class) are out of
scope for this slice and remain `NeedsReview` until later targeted
review CSVs.

## Scope

### In scope

- `dbo.sale.wac_cd` (column + every code-value row)
- `dbo.sale.sl_ratio_type_cd` (column + every code-value row)

### Out of scope

- Every other column in the workbook (~198 columns).
- Property / improvement / land / neighborhood transforms.
- The lock CLI invocation itself.
- C8-C qualify-sales runs.
- Any PACS / canonical landing / Forge / TerraAtlas / Studio / Dais
  mutation.
- Frontend review UI (parked).
- Cross-county multi-workbook batch (C11-A non-goal).

## Hard Guards

The five guards below extend the C11-A batch edit Hard Guards with
sales-review-specific safety. The C13-B implementation must satisfy
all of them.

### 1. `Status='Draft'` only

The C11-B service already enforces this. The policy guard is
operator-facing: do not author a sales review CSV against a workbook
that has been locked. If the workbook is `Mapped` / `Approved` /
`Archived`, the right move is a NEW workbook (C3 loader), not an
edit.

### 2. Snapshot before apply

Before every `--apply` invocation, the operator captures a workbook
snapshot to `backend/artifacts/sync-atlas/c13-b/<run-id>/` covering:

```text
- workbook Status
- workbook UpdatedAt
- columns_total
- code_values_total
- terminal_values (Mapped + Excluded + Deferred)
- non_terminal_values (NeedsReview + InProgress)
- per-row state for the two sales columns:
  - sale.wac_cd: every code-value's SourceValue, ReviewStatus, IsExcluded, CanonicalValue, Notes
  - sale.sl_ratio_type_cd: every code-value's SourceValue, ReviewStatus, IsExcluded, CanonicalValue, Notes
```

The snapshot is the audit trail's first row. Without it, drift
detection is impossible.

### 3. Dry-run before apply

`--dry-run` is mandatory before `--apply`, even on the same CSV.
The dry-run summary must be reviewed by the operator and confirmed
against expected row counts before apply runs. The C11-B service
already enforces atomicity; the policy guard is procedural —
operators do not skip the dry-run because "the CSV looks fine."

### 4. Explicit operator decision per row

Every CSV row carries an explicit operator decision. The C13-B CSV
generator (when it exists) may seed rows in `NeedsReview` state,
but the operator must promote every row to one of the terminal
statuses before that row appears in an `--apply` CSV. No row in
the apply CSV may carry `review_status=NeedsReview` or
`review_status=InProgress`.

(Rationale: those statuses are valid in the C11-A grammar — the
operator can roll a row back from terminal — but a "review CSV"
that lands NeedsReview is wasted I/O. If the operator wants to roll
back, they say so explicitly, in a separate run.)

### 5. WacCd no-auto-exclusion (memory-flagged directive)

This policy carries the strongest version of the directive because
it is the layer where the operator is making the most WAC-row
decisions per slice. The CSV authoring tool MUST NOT:

- pattern-match WAC code prefixes (`458-61A-*`, `458-20-*`) and
  pre-set `review_status=Excluded`;
- expand operator decisions across statute families;
- infer exclusions from observed-count distributions;
- carry forward exclusions from other workbooks or counties;
- treat low-frequency codes as "probably exempt;"
- treat high-frequency codes as "probably qualifying."

Every exclusion in the apply CSV must trace to a specific operator
decision recorded in that row's `notes` cell. The Notes field is
required for every Excluded row.

## CSV Format

Reuses the C11-A grammar verbatim. No new columns, no scope
extensions, no special "sales review" header.

### Columns

```text
scope,source_schema,source_table,source_column,source_value,review_status,canonical_target,canonical_value,canonical_value_null,is_excluded,notes
```

### Allowed scopes for this slice

| Scope | Identity | Purpose in the sales review CSV |
|---|---|---|
| `column` | `(dbo, sale, wac_cd)` | One row promoting the WAC column from `NeedsReview` to `Mapped` once every code-value is decided. Same for `sl_ratio_type_cd`. |
| `code_value` | `(dbo, sale, wac_cd, <statute>)` | One row per WAC code-value the operator reviews. Same for ratio-type codes. |

### Forbidden in this slice

- Any row whose `source_table` is not `sale`.
- Any row whose `source_column` is not `wac_cd` or
  `sl_ratio_type_cd`.
- Cross-table batch edits.
- Row counts that exceed the column's stored code-value count
  (the C11-B duplicate-target rule already catches the same-target
  case; this policy guard catches phantom-target authoring errors
  earlier in dry-run review).

## Decision Rules

These are the rules the human reviewer applies when promoting each
WAC and ratio-type row from `NeedsReview` to a terminal status. The
tooling does not enforce them — the operator does. The policy
exists so the operator's decisions are repeatable and auditable.

### WAC (`dbo.sale.wac_cd`)

| Decision | When | Required CSV cells |
|---|---|---|
| **Mapped** | Operator decides the WAC value represents a qualifying arms-length transfer. | `review_status=Mapped`, `canonical_value=<canonical-label>`, `is_excluded=false`, `notes=<assessor rationale>` |
| **Excluded** | Operator decides the WAC value is a REET / quitclaim / family / exempt-transfer / non-arms-length transfer that must NOT enter sales comps. | `review_status=Excluded`, `is_excluded=true`, `canonical_value=<exclusion-label>` (e.g. `REETExempt`, `QuitclaimDeed`, `FamilyTransfer`), `notes=<statute-text rationale>` |
| **Deferred** | Statute meaning is unclear, frequency is too low to research now, or operator wants assessor input. | `review_status=Deferred`, `notes=<what's blocking the decision>` |

**Hard rule:** the operator's `notes` text must reference the WAC
statute or the operator's reasoning in plain language. A blank
notes cell on an Excluded row fails the C13-B authoring
preflight (see "C13-B Success Criteria" below).

**Hard rule:** the canonical_value vocabulary is operator-defined
and consistent within a workbook. The CSV author must not invent
new canonical labels mid-run; the workbook's existing
`canonical_value` strings (from prior C9-C / C11-C / C12-live
runs) form the seed vocabulary.

### Ratio type (`dbo.sale.sl_ratio_type_cd`)

| Decision | When | Required CSV cells |
|---|---|---|
| **Mapped** | Operator decides the ratio type belongs in the ratio study. | `review_status=Mapped`, `canonical_value=<ratio-study-bucket>`, `notes=<rationale>` |
| **Excluded** | Operator decides the ratio type signals a sale that should NOT enter the ratio study (e.g. partial interest, multi-parcel, unusual financing). | `review_status=Excluded`, `is_excluded=true`, `canonical_value=<exclusion-label>`, `notes=<rationale>` |
| **Deferred** | Operator wants assessor / DOR guidance before deciding. | `review_status=Deferred`, `notes=<what's blocking>` |

**Hard rule:** PACS `char(N)` padding is now invisible to the
operator (C12 fix). The CSV author types ratio type codes in their
natural unpadded form (`1`, `00`, `10`). The C11-B + C12 stack
handles the match.

**Hard rule:** Blank / null ratio type codes are decided by
explicit operator review, not by tool default. If the workbook
contains a row whose `SourceValue` is empty / blank / null, the
operator either marks it Deferred (with notes explaining why
blank-coded sales need attention) or Excluded (with notes
explaining the rule). The tool never auto-defers them.

## Drift Handling

The C12-live session observed unexplained workbook drift:
`sale.sl_ratio_type_cd / 00` was at `Deferred` outside the
documented C9-C / C11-C / C12-live edit chain. That kind of drift
is a leading indicator of dual-operator confusion or an
out-of-band edit. This policy treats drift as a first-class
concern.

### Mandatory pre-apply drift check

Every C13-B run captures the snapshot described in Hard Guard 2,
then diffs it against the workbook state recorded at the prior
slice marker (`10bd1819d` for C11-C; `e22b04b5d` for C12-live).
The diff is recorded to
`backend/artifacts/sync-atlas/c13-b/<run-id>/drift.txt`.

Expected drift between markers:

| Source row | Reason | Expected |
|---|---|---|
| `sale.wac_cd / 458-61A-217(1)` | C9-C edit | Excluded, IsExcluded=true |
| `sale.wac_cd / 458-61A-203(1)` | C11-C apply | Excluded, IsExcluded=true |
| `sale.wac_cd / 458-61A-201` | C11-C apply | Deferred |
| `property_val.property_use_cd` (column) | C11-C apply | Mapped, CanonicalTarget=PropertyUse |
| `sale.sl_ratio_type_cd / 1` | C12-live edit | Deferred |
| `sale.sl_ratio_type_cd / 00` | unexplained | Deferred (no current notes) |

### Drift response

If the drift report contains rows the operator did not commit:

1. **Do not apply** the planned C13-B CSV.
2. Capture a per-row snapshot of the unexpected rows.
3. Decide whether the drift is acceptable (and re-anchor the
   expected-drift table) or whether the workbook needs a fresh
   C3-loader pass (which is its own separate slice).
4. Only after the drift is reconciled does C13-B proceed.

### Drift guard for `sl_ratio_type_cd / 00`

The current observed state of that row is `Deferred` with empty
`Notes`. The C13-B run author has two choices:

- **Adopt** the drift: include `sale.sl_ratio_type_cd / 00` as a
  `Deferred` row in the C13-B CSV with notes that document the
  retroactive operator decision. This re-anchors the audit trail.
- **Reject** the drift: revert that row to `NeedsReview` via a
  single-row C9-B edit before running the C13-B batch. This
  invalidates the silent edit.

The policy does not prescribe which is correct — only that the
operator must explicitly choose one before C13-B applies.

## Audit Expectations

### What the C13-B run produces

```text
backend/artifacts/sync-atlas/c13-b/<run-id>/
├── pre-snapshot.txt          # Hard Guard 2 snapshot
├── drift.txt                 # Drift report vs. C12-live anchor
├── sales-review.csv          # The operator's authored review CSV
├── batch-dry-run.txt         # First dry-run output
├── batch-dry-run-verify.txt  # SQL confirming no mutation
├── batch-apply.txt           # Apply output
├── batch-verify.txt          # SQL confirming exact mutations
└── post-snapshot.txt         # Workbook state after apply
```

None of these artifacts is committed. They live in `backend/artifacts/`
which is gitignored. The C13-B marker commit is empty.

### What the workbook gets

- Per touched `SyncMappingColumn` / `SyncMappingCodeValue` row:
  the supplied mutation fields + `UpdatedAt` + `UpdatedBy` bumped.
- The `SyncMappingWorkbook` row: `UpdatedAt` and `UpdatedBy`
  bumped exactly once for the whole batch (C11-A guarantee).
- Workbook `Status`: still `Draft`. C13-B does not lock.
- Every other workbook row: byte-for-byte unchanged.

### What downstream consumers do not see

- No PACS row mutation.
- No canonical landing table writes.
- No Forge / TerraAtlas / Studio / Dais artifacts written.
- No C8-C qualify-sales run triggered.
- No audit log row outside the workbook entities (the `AuditLogs`
  table is for the kernel's authentication/authorization audit
  trail, not for the workbook's per-row review state — the
  `SyncMappingCodeValue.UpdatedAt` + `UpdatedBy` audit columns are
  the workbook audit trail).

## Hard Non-Goals

| Non-goal | Rationale |
|---|---|
| **Auto-generate the CSV from PACS frequency data** | The CSV is operator-authored. Auto-generation re-introduces "the tool guessed" failure modes. C13-B may produce a `NeedsReview`-only seed CSV from the workbook's current state for the operator to fill in, but no decision field is auto-set. |
| **Auto-fill canonical_value from synonyms or prior counties** | Canonical vocabulary is workbook-local. Cross-workbook copy-paste re-introduces the WacCd directive's bypass risk. |
| **Promote the workbook to `Mapped` (lock) at the end of the run** | Lock is a separate slice. The C13-B run is a review acceleration, not a status transition. |
| **Edit any non-sales column** | Out of scope. A separate slice handles improvement / land / neighborhood / valuation review. |
| **Run C8-C qualify-sales as a side effect** | Decoupled by design. The operator runs qualify separately when ready. |
| **Skip the snapshot or dry-run** | Both are Hard Guards. No `--force-skip-snapshot`, no `--apply-without-dry-run`. |
| **Edit the workbook between snapshot and apply** | Single-operator window enforced by procedure. The C11-B concurrency check fires if the workbook Status changes mid-flight; that is fail-safe, not a license to multi-edit. |

## C13-B Success Criteria

A C13-B run is successful iff every gate below passes. The empty
marker commit lands only after all eight gates are green.

| Gate | Pass criterion |
|---|---|
| **Snapshot captured** | `pre-snapshot.txt` exists and contains workbook + per-row state for both sales columns. |
| **Drift acknowledged** | `drift.txt` exists; every row of unexpected drift is either adopted or reverted before apply. |
| **Dry-run validates** | `batch-dry-run.txt` shows `exit=0`, all rows valid, planned per-status counts match operator expectation. |
| **Dry-run verify clean** | `batch-dry-run-verify.txt` shows zero mutation: workbook `UpdatedAt` unchanged from snapshot. |
| **Apply succeeds** | `batch-apply.txt` shows `exit=0`, `Outcome: Applied`, `Audit Stamp Bump: 1`, exact row count match. |
| **Apply verify exact** | `batch-verify.txt` shows the exact set of CSV-listed rows mutated and nothing else. |
| **Workbook stays Draft** | `post-snapshot.txt` shows `Status=Draft`, `columns_total=200`, `code_values_total=1733`. |
| **Prior anchors preserved** | `sale.wac_cd / 458-61A-217(1)` (C9-C anchor) and any rows from C11-C / C12-live not named in the new CSV remain byte-for-byte unchanged, including their original `UpdatedAt`. |
| **WAC no-auto-exclusion holds** | A sample of 5+ unlisted WAC code-values shows `IsExcluded=false`, `ReviewStatus=NeedsReview`. |
| **Leak scan clean** | `rg -n "TF_Pacs|SA_PASSWORD|Password=|Pwd=|SYNCATLAS_SECRET_..." backend/artifacts/sync-atlas/c13-b/` returns no matches. |

## C13-B Marker

If all gates pass:

```bash
git commit --allow-empty -m \
  "test(sync): Slice C13-B — apply targeted sales review CSV. The goblin labeled the right boxes and the haunted sandwich stayed in the bin."
```

If any gate fails:

- Roll back is automatic for atomicity (the C11-B service refuses
  partial applies). The CSV stays uncommitted; the snapshot files
  stay in artifacts. The operator iterates on the CSV and re-runs
  dry-run + apply.
- Drift caused by the apply itself (impossible under C11-A
  atomicity) would be a defect, not an operator error; spawn a
  fresh investigation slice rather than re-applying.

## Operator Workflow (concrete, post-C13-A)

```text
1. Capture pre-snapshot:
     docker exec -i terrafusion-postgres-dev psql -U postgres -d terrafusion <<SQL > pre-snapshot.txt
       SELECT ...workbook + per-row state for sale.wac_cd + sale.sl_ratio_type_cd...
     SQL

2. Diff against C12-live anchor:
     diff pre-snapshot.txt c12-live-baseline.txt > drift.txt
     # operator reads drift.txt, decides adopt-or-revert per row

3. Author CSV (operator does this in a real editor, NOT a script):
     # one row per WAC code: review_status + is_excluded + canonical_value + notes
     # one row per ratio-type code: review_status + canonical_value + notes
     # one column-scope row per source column once every code-value is decided

4. Dry-run:
     dotnet run --project backend/tools/SyncAtlas --no-build -- \
       --db "$TF_DB" \
       --county-id 19190019-... \
       --batch-edit-mapping-workbook \
       --workbook-id a767c8a2-... \
       --input-csv backend/artifacts/sync-atlas/c13-b/<run-id>/sales-review.csv \
       --dry-run \
       --operator bsval

5. Read dry-run output. If counts don't match expectation → iterate on CSV.

6. Apply:
     # same command, --apply instead of --dry-run

7. Verify exact mutations:
     # SQL counting rows by review_status before/after; check anchors

8. Capture post-snapshot.

9. Empty marker commit (only if all 10 gates green).
```

## What This Document Is Not

- **Not the CSV itself.** The operator authors the CSV in
  `backend/artifacts/sync-atlas/c13-b/<run-id>/sales-review.csv`
  and that file is never committed.
- **Not a script.** No automation generates the per-row decisions.
  The CSV-authoring tool that lands in C13-B may produce a
  `NeedsReview`-only seed from the workbook's current state, but
  every decision field stays empty until the operator fills it in.
- **Not a lock.** The workbook stays `Draft` for as many C13-B
  runs as it takes to terminalize the sales columns. Lock is a
  separate slice.
- **Not a transform consumer.** Sales-comp, ratio-study, and any
  other downstream consumer reads the workbook through the C7
  read model; this slice does not change the read model contract.
- **Not a license to relax the WacCd directive.** It is the layer
  where the directive is most heavily exercised, not the layer
  where it gets "this one time" exceptions.

---

## Amendment — 2026-04-28: Benton pre-2017 sales-code conversion caveat

This amendment is added retroactively to record an operator-noted
domain truth that affects every sales-related slice (C9-C, C11-C,
C13-A through C13-F, and any future C8-C qualify-sales / sales-comp
transform consumer).

### Fact

Benton County's PACS instance had a **data conversion event before
2017**. Sales codes captured on PACS rows for sales prior to that
conversion may be **absent, incomplete, or semantically shifted**
from their post-conversion meanings.

### Affected fields

- `dbo.sale.wac_cd`
- `dbo.sale.sl_ratio_type_cd`
- any downstream sales-qualification / comp-pool transform that
  reads those fields as primary qualification signals

### Engineering consequences

1. **Sales qualification transforms must be conversion-aware.** A
   sale-row's `SaleDate` (or `RecordingDate` / `TransferDate`) is
   the disambiguator: pre-conversion-cutoff records cannot be
   auto-qualified solely from WAC / ratio-type codes the same way
   post-conversion records can.
2. **Pre-conversion sales should not be auto-qualified solely
   from WAC / ratio-type codes.** Even if the codes match a
   workbook `Mapped` decision, the pre-conversion record's
   semantic meaning may differ from what the operator decided
   for post-conversion data.
3. **Mapping Workbook review treats pre-2017 behavior as a
   separate policy concern.** The C13-series review work that
   landed `Deferred` decisions on 74 of 77 sales codes already
   defers to assessor judgment; this amendment formalizes that
   the deferral is explicitly correct — many of those Deferred
   codes apply differently to pre- vs. post-conversion records.
4. **Sales code distributions from B2.7-OLTP carry a temporal
   caveat.** The `ObservedCount` figures in
   `SyncMappingCodeValue` reflect the full undated population. A
   high-`ObservedCount` code may include thousands of
   pre-conversion records whose semantics differ from the current
   PACS code-table meaning.
5. **Future transform output should carry a reason / provenance
   message when the sale date is pre-conversion-cutoff.** The
   downstream consumer needs to know the qualification decision
   was made under conversion-era data.

### Default future policy (applies to C7+ sales-transform consumers)

For sale records dated **before** the conversion cutoff:

- Do **not** auto-qualify based on WAC / ratio-type codes alone.
- Do **not** treat missing WAC / ratio codes as valid arms-length
  signals.
- **Emit a "PreConversionData" reason** on the qualification
  decision (or whatever the consumer's reason vocabulary is).
- **Require explicit assessor / review policy** before treating
  the sale as comp-pool-eligible.

### Already-applied retroactive readings

The 74 `Deferred` sales codes from C13-A through C13-F already
implicitly satisfy this caveat — `Deferred` means "not yet usable
for comps without further review." The 3 `Excluded` codes
(`458-61A-217(1)`, `458-61A-203(1)`, `458-61A-203(2)`) are REET
exemptions that are non-arms-length regardless of date, so the
conversion caveat doesn't change their semantic outcome.

### Recommended downstream transform contract update (later)

When a conversion-aware sales transform slice promotes, the
qualification consumer's input record likely needs:

```csharp
public sealed record SalesQualificationSource(
    string? WacCode,
    string? SaleRatioTypeCode,
    DateOnly? SaleDate);  // ← new
```

…and a new decision-status case:

```csharp
SalesQualificationDecisionStatus.PreConversionData
```

These are forward references; this amendment does not add them.
The C8-C qualify-sales transform may need a follow-up slice
("C8-D-conversion-aware" or similar) once that change is
explicitly promoted.

### What this amendment is

A docs-only domain memory record. No code changes.

### What this amendment is not

- Not a transform code change.
- Not a data backfill.
- Not a license to retroactively re-edit C9-C / C11-C / C13-B/C/D/E/F
  rows. Those decisions stand. The caveat affects how downstream
  consumers should interpret them, not whether the workbook
  decisions were correct.
