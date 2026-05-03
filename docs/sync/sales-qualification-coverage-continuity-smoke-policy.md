# Sales Qualification Coverage-Continuity Smoke Policy

**Slice:** BENTON-SYNC-7-A (docs-only — defines the coverage-continuity
diagnostic that proves "every PACS sales row that should land lands,
and every land-row traces to its source." Pins the CLI surface,
report shape, hard guards, and BENTON-SYNC-7-B test matrix. Does
NOT add any code; implementation lands separately under
BENTON-SYNC-7-B and live proof under BENTON-SYNC-7-C.).

**Status:** policy-only. Implementation lands separately under
BENTON-SYNC-7-B; live proof + committed evidence baseline under
BENTON-SYNC-7-C.

**Authoritative cross-references:**

- `docs/sync/benton-core-sync-next-need.md` — BENTON-SYNC-1
  inventory; the parked item this slice promotes ("Sales
  qualification transform — coverage continuity proof").
- `docs/sync/sales-qualification-transform-policy.md` — C8-A
  authoritative qualification rule source.
- `docs/sync/canonical-sales-qualification-landing-schema-policy.md`
  — C35-A canonical-landing schema source.
- `docs/sync/sales-comp-eligibility-filter-policy.md` — C37-A
  read-side surface that consumes the canonical landing.
- `docs/sync/dictionary-loader-preflight-evidence-policy.md` —
  BENTON-SYNC-6-A precedent for opt-in artifact writes from
  SyncAtlas (same engagement model applies here).
- `docs/sync/benton-dictionary-loader-preflight-evidence-baseline.md`
  — BENTON-SYNC-6-C precedent for "best-effort artifact write,
  exit code preserved" reconciliation.

## Why this slice

Three production sales-qualification surfaces are live:

1. **C8-B transform** (`ISalesQualificationTransform`). Pure
   per-row qualifier over one `(WacCode, SaleRatioTypeCode)` pair.
2. **C8-C sample runner** (`ISalesQualificationSampleRunner`).
   SyncAtlas `--qualify-sales` mode — bounded read-only sample
   that returns counts + per-row decisions. No persistence.
3. **C36 canonical runner**
   (`ISalesQualificationCanonicalRunner`). Production write-side
   runner — reads PACS, qualifies, upserts to
   `CanonicalSaleQualifications` (the C35-B landing table).

What is NOT yet pinned: a single end-to-end check that the
canonical landing matches the universe of PACS sales the
transform considers. Today the operator can verify behavior
piecewise — sample counts on stdout, individual canonical rows
in the DB — but no slice produces a definitive
"every-row-accounted-for" verdict the way BENTON-SYNC-6 does for
preflight outcomes.

This slice closes that gap by pinning a coverage-continuity
SMOKE diagnostic (read-only, never persists, never mutates
canonical landing) that:

- Reads the universe of PACS sale rows under a defined scope.
- Runs the C8-B transform fresh against each row.
- Compares the fresh decision to whatever sits in
  `CanonicalSaleQualifications` for the same county /
  ChgOfOwnerId.
- Surfaces three classes of evidence: forward-coverage gaps
  (PACS rows the transform would persist but no canonical row
  exists), backward-traceability gaps (canonical rows whose
  ChgOfOwnerId cannot be located in the PACS scope), and
  decision drift (persisted canonical decision differs from
  the fresh transform output).

The smoke is the natural diagnostic precursor for any audit
posture that asks "is the canonical landing reliable?" It is
NOT a replacement for `--qualify-sales` (sample) or the C36
runner (production write); it is a third diagnostic surface
that consumes both production state and live PACS state and
emits a verdict.

## Scope

### In scope

- A new SyncAtlas read-only mode that produces a
  coverage-continuity verdict over the configured scope.
- A new CLI flag selecting the mode:
  `--qualify-sales-coverage`.
- A structured stdout report and an optional JSON artifact
  (the
  `--coverage-evidence-path` opt-in flag).
- Hard guards (HG3 read-only, HG6 source-traceable,
  HG7 fail-closed, no-PII-in-artifact).
- Acceptance test matrix BENTON-SYNC-7-B must satisfy.

### Out of scope

- Mutating any canonical landing row.
- Mutating any PACS row.
- Mutating any workbook row.
- Re-running the C36 production write path. (The smoke READS
  the canonical landing; it does NOT write to it. If gaps are
  found, the operator decides whether to re-run C36 to fix
  them.)
- Comp eligibility behavior beyond "canonical row presence /
  decision shape" — that stays under C37-A.
- Multi-county aggregation (C54-MULTI-E). One smoke run
  covers one (CountyId, WorkbookId, SourceConnectionId)
  triple, same shape as the C36 runner.

## CLI engagement model

The implementation slice (BENTON-SYNC-7-B) introduces one new
SyncAtlas mode flag plus an optional artifact path:

```text
--qualify-sales-coverage              # mode flag (mode-mutex member)
--coverage-evidence-path <path>       # opt-in artifact (mirrors
                                      #  --preflight-evidence-path)
--max-sales <n>                       # optional cap (existing flag,
                                      #  reused; default = unlimited)
```

Engagement rules — binding:

- **Mode-mutex member.** `--qualify-sales-coverage` joins the
  existing nine-way mode mutex (Profile / Generate Workbook /
  Export Workbook / Qualify Sales / Edit Workbook / Lock
  Workbook / Batch Edit Workbook / Review Progress /
  Load PACS Dictionary / Schema Catalog Health), promoting the
  mutex to ten-way. Same parser-side enforcement as every
  other mode.
- **Required flags.** `--db`, `--county-id`, `--connection-id`,
  `--workbook-id`. The smoke needs the canonical landing
  (TerraFusion DB), the PACS source (connection), and the
  workbook (so it can run the same C8-B transform the C36
  runner would).
- **Optional flags.** `--max-sales <n>` caps PACS reads (same
  semantics as the C8-C / C36 caps); `--coverage-evidence-path
  <path>` writes the structured report as JSON.
- **Cross-mode rejection.** Edit-mode flags
  (`--source` / `--canonical-target` / etc.), batch-edit-mode
  flags (`--input-csv-path` / `--dry-run` / `--apply`),
  generate-mode flags, export-mode flags, schema-catalog-health
  flags, and load-pacs-dictionary flags all reject when
  `--qualify-sales-coverage` is set, mirroring the existing
  per-mode reject blocks.
- **Failure semantics.** When `--coverage-evidence-path` is
  set and the artifact write fails, the smoke prints a stderr
  line; the smoke's primary exit code is preserved (best-effort
  artifact write per the BENTON-SYNC-6-C reconciliation).
- **Stdout report.** Always printed regardless of artifact
  path. Same human-readable shape whether the artifact flag is
  on or off.

## Report shape (logical)

The smoke emits a single
`SalesQualificationCoverageReport` value that:
1. Captures identity envelope.
2. Captures input-side counts (PACS rows scanned).
3. Captures output-side counts
   (`CanonicalSaleQualifications` rows present for the same
   county scope, broken down by canonical decision status).
4. Captures three gap buckets.
5. Captures a small bounded sample of each gap bucket (capped
   so the smoke does not balloon into an exfiltration
   surface).

Logical shape:

```text
SalesQualificationCoverageReport
├── SchemaVersion        : "1.0.0"   (string; semver)
├── RunId                : <RFC3339 UTC timestamp>
├── CountyId             : <Guid>
├── WorkbookId           : <Guid>
├── SourceConnectionId   : <Guid>
├── PacsScope
│   ├── RowsScanned                : <int>
│   ├── MaxSalesApplied            : <int?>   (null when unbounded)
│   └── RowsWithChgOfOwnerId       : <int>    (the universe that
│                                              CAN be persisted —
│                                              null PK rows are
│                                              C36's SkipNoIdentifier)
├── CanonicalScope
│   ├── RowCount                   : <int>    (CanonicalSaleQualifications
│   │                                          for this CountyId)
│   ├── QualifiedCount             : <int>
│   ├── ExcludedCount              : <int>
│   └── InconclusiveCount          : <int>
├── ForwardCoverageGap
│   │  (PACS rows whose fresh transform decision would persist
│   │   a canonical row, but no canonical row exists for that
│   │   (CountyId, ChgOfOwnerId).)
│   ├── Count                      : <int>
│   └── Sample                     : list of {ChgOfOwnerId, FreshStatus} (capped at 50)
├── BackwardTraceabilityGap
│   │  (CanonicalSaleQualifications rows for this county whose
│   │   ChgOfOwnerId is NOT in the scanned PACS scope.)
│   ├── Count                      : <int>
│   └── Sample                     : list of {ChgOfOwnerId, CanonicalStatus} (capped at 50)
├── DecisionDrift
│   │  (Rows where a canonical row exists AND PACS source
│   │   exists, but the persisted decision != fresh transform
│   │   decision.)
│   ├── Count                      : <int>
│   └── Sample                     : list of {ChgOfOwnerId, CanonicalStatus, FreshStatus} (capped at 50)
└── Verdict
    ├── IsClean                    : <bool>   (all three gap counts == 0)
    └── Summary                    : <string> human-readable one-liner
```

Field semantics:

- **`IsClean = true`** when all three gap counts are zero. This
  is the operator's go-ahead signal: every PACS row that
  should be persisted IS persisted, every canonical row's
  source can be located, and no persisted decision drifted.
- **Bounded samples (50 rows per bucket).** Operator-safe
  upper bound. Larger gaps surface their full count; the
  sample is a forensic starting point, not an exfiltration
  surface.
- **`MaxSalesApplied`** records whether the run was bounded.
  A bounded run produces an INCONCLUSIVE verdict for
  `BackwardTraceabilityGap` because a canonical row outside
  the scanned PACS slice may exist legitimately. The smoke
  reports this honestly by setting
  `BackwardTraceabilityGap.IsConclusive = false` (added in
  BENTON-SYNC-7-B's record shape — this policy permits the
  implementation to add that field if useful; the literal
  shape above is the floor).

### What the smoke deliberately does NOT report

- Per-row diff details beyond `ChgOfOwnerId` and decision
  status. Field-level deltas (WAC code drift, ratio code drift,
  workbook entry drift) are out of scope; the operator runs
  individual queries for forensics if a gap is surfaced.
- Decision REASONS (the C8-A reason strings). Reasons are
  derived data; persisting them in the smoke artifact would
  duplicate state already in the canonical landing's
  `Reasons` column.
- Any field from PACS sale rows beyond `ChgOfOwnerId` and the
  two qualification axes. Specifically: no party identifiers,
  no sale prices, no addresses, no parcel ids beyond what
  qualification touches. The artifact stays metadata-flavored.

## Hard guards (binding for any implementation)

- **HG3 read-only.** The smoke MUST NOT write to
  `CanonicalSaleQualifications`, MUST NOT write to PACS, MUST
  NOT write to the workbook, MUST NOT write to the
  `SyncMappingWorkbooks*` family. The only write the
  implementation may perform is the optional JSON artifact at
  `--coverage-evidence-path`. Implementation tests pin
  pre/post DB snapshot equivalence on
  `CanonicalSaleQualifications` and the workbook.
- **HG6 source-traceable.** The artifact carries
  `(CountyId, WorkbookId, SourceConnectionId)` at the top
  level. Per-row sample entries carry `ChgOfOwnerId` so each
  flagged row is traceable to its PACS source.
- **HG7 fail-closed.** If the workbook is anything other than
  `Status='Mapped'`, the smoke fails closed (same posture as
  the C36 runner — `LoadMappedAsync` throws
  `InvalidOperationException` BEFORE any PACS or canonical
  read). The artifact is NOT written in that case (no
  partial-finalization surface for an args-validation-time
  throw).
- **No PII in artifact / stdout.** The implementation MUST NOT
  surface party names, addresses, sale prices, parcel ids, or
  any field outside `(ChgOfOwnerId, WacCode,
  SaleRatioTypeCode, decision status)`. Tests grep the
  artifact + stdout for non-permitted patterns.
- **County-scoped.** `(CountyId)` filters every read on both
  sides. Cross-county leakage is rejected; if the workbook's
  CountyId differs from `--county-id`, the smoke fails closed
  with a structured error.
- **No autoremediation.** When gaps are found, the smoke
  reports them and exits — it MUST NOT silently re-run C36 or
  any production write path. Remediation is a separate
  operator action.

## Test matrix (binding for BENTON-SYNC-7-B)

The implementation slice MUST include integration tests that
pin all of the following. These are acceptance gates.

### Parser

- `Parse_QualifySalesCoverage_WithRequiredFlags_Succeeds` —
  flag parses with `--db`, `--county-id`, `--connection-id`,
  `--workbook-id`.
- `Parse_QualifySalesCoverage_WithoutWorkbookId_ReturnsError`
  — same shape as the C36 runner's required-flag check.
- `Parse_QualifySalesCoverage_WithoutConnectionId_ReturnsError`.
- `Parse_QualifySalesCoverage_WithMaxSales_ParsesAsBound`.
- `Parse_QualifySalesCoverage_WithCoverageEvidencePath_ParsesAsPath`.
- `Parse_CoverageEvidencePath_WithoutValue_ReturnsError`.
- `Parse_CoverageEvidencePath_OnUnsupportedCommand_Rejects`
  — flag rejected on every other mode (mirrors
  `--preflight-evidence-path`).
- `Parse_QualifySalesCoverage_RejectsEditModeFlags` /
  `RejectsBatchEditModeFlags` / `RejectsExportFlags` etc.
  (all the cross-mode rejects pinned by precedent).

### Smoke logic

- `Run_AllRowsAccountedFor_ProducesCleanVerdict` — given a
  fixture where every PACS row has a matching canonical row
  with the same decision, `IsClean = true` and all three gap
  counts are 0.
- `Run_PacsRowMissingCanonical_RecordsForwardGap` — fresh
  transform decision would persist (Qualified or Excluded),
  no canonical row exists → forward-gap count incremented;
  sample includes the row.
- `Run_CanonicalRowMissingPacs_RecordsBackwardGap` —
  unbounded run; canonical row's ChgOfOwnerId not present in
  the scanned PACS scope → backward-gap count incremented.
- `Run_CanonicalDecisionDiffersFromFresh_RecordsDrift` —
  canonical row says Excluded; fresh transform says Qualified
  → drift count incremented; sample includes the row.
- `Run_BoundedRun_BackwardGapMarkedInconclusive` — when
  `--max-sales` is set, the backward-traceability gap MAY
  contain rows that legitimately live outside the bounded
  scan; the verdict honestly reports this rather than
  fabricating a clean signal.

### Hard-guard tests

- `Run_DoesNotMutateCanonicalLandingTable` — pre/post snapshot
  equality on `CanonicalSaleQualifications`.
- `Run_DoesNotMutatePacs` — sample runner pattern; no PACS
  write performed.
- `Run_NotMappedWorkbook_FailsClosed` — workbook in
  Status='Draft' / 'Approved' / 'Archived' throws before any
  PACS / canonical read.
- `Run_CrossCountyWorkbook_FailsClosed` — workbook's CountyId
  does not match `--county-id` → structured error.

### Artifact tests

- `Write_CoverageReport_ProducesByteStableJson` — given a
  fixed report shape, the writer's output is deterministic
  byte-for-byte.
- `Write_FailureWritesStderrPreservesExitCode` — directory
  non-existent → stderr message; primary smoke exit code
  preserved (per the BENTON-SYNC-6-C reconciliation).
- `Artifact_ContainsNoRowDataBeyondPermittedFields` — grep
  over artifact contents shows only `(ChgOfOwnerId, WacCode,
  SaleRatioTypeCode, decision status)` from per-row entries
  plus the identity envelope.
- `Artifact_SampleSizesAreCapped` — given a synthetic gap of
  500 rows, the sample lists contain at most 50 entries
  apiece while the count fields show the full 500.

## Engagement with existing surfaces

- The smoke joins the existing SyncAtlas mode mutex; the
  documentation in `docs/sync/sync-surface-inventory.md`
  gains one entry for the new mode (the surface inventory is
  the binding catalogue per SCOPE-3).
- The C36 canonical runner is unchanged; the smoke uses its
  same row-reader infrastructure
  (`ISalesRowReader.ReadAsync` from
  `SqlServerSalesRowReader`).
- The C8-B transform is unchanged; the smoke calls it through
  `ISalesQualificationTransform.QualifyAsync` per row.
- The C35-B canonical landing schema is unchanged; the smoke
  reads `CanonicalSaleQualifications` only.
- Family-index README gains a single entry pointing here.

## Slice ledger

- BENTON-SYNC-7-A : DONE — this policy. ← this slice
- BENTON-SYNC-7-B : NEXT — implementation: parser case +
                    mode mutex update + report record types +
                    `ISalesQualificationCoverageRunner`
                    interface + Sql implementation + writer +
                    test matrix from above.
- BENTON-SYNC-7-C : OPTIONAL FUTURE — committed Benton
                    evidence baseline once BENTON-SYNC-7-B's
                    first live run produces a clean (or
                    forensically-useful) report (mirrors
                    BENTON-SYNC-6-C's role for the preflight
                    evidence baseline).

## Acceptance for BENTON-SYNC-7-A

- [x] One file added at
  `docs/sync/sales-qualification-coverage-continuity-smoke-policy.md`.
- [x] Smoke definition pinned (forward / backward / drift gaps).
- [x] Logical report shape pinned (envelope + scope counts +
  three gap buckets with bounded samples + verdict).
- [x] CLI engagement model pinned
  (`--qualify-sales-coverage`, mode-mutex member;
  `--coverage-evidence-path` opt-in artifact path).
- [x] Hard guards enumerated (HG3 / HG6 / HG7 / no-PII /
  county-scoped / no-autoremediation).
- [x] Test matrix enumerated (parser / smoke logic / hard
  guards / artifact tests).
- [x] BENTON-SYNC-1 inventory updated to mark BENTON-SYNC-7-A
  DONE and name BENTON-SYNC-7-B as the new default.
- [x] No code changes. No test changes. No mutation of any
  existing transform / runner / canonical landing class.

## Non-goals (explicit)

- BENTON-SYNC-7-A does not implement the runner, the CLI
  flag, the writer, or the test matrix. BENTON-SYNC-7-B does.
- BENTON-SYNC-7-A does not commit to a specific JSON
  serialization format (key casing, indentation). The writer
  picks one and pins it byte-for-byte in tests.
- BENTON-SYNC-7-A does not authorize automated remediation
  of detected gaps. Operator runs C36 again or files a
  separate slice to investigate.
- BENTON-SYNC-7-A does not change anything about the C8-B
  transform, the C36 canonical runner, or the C35-B landing
  schema. Those policies remain authoritative.
- BENTON-SYNC-7-A does not promote a multi-county aggregation
  shape. One smoke run = one
  (CountyId, WorkbookId, SourceConnectionId) triple.
- BENTON-SYNC-7-A does not amend the BENTON-SYNC-6-A policy.
  The "best-effort artifact write" failure semantics
  reconciled at BENTON-SYNC-6-C are inherited as the family
  default; this policy adopts that default verbatim.
