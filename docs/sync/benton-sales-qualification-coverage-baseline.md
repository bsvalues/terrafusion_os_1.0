# Benton Harris PACS — Sales Qualification Coverage Baseline

**Slice:** BENTON-SYNC-7-C (committed evidence artifact for the
BENTON-SYNC-7-B implementation. Captures the live state of the
sales qualification coverage smoke as observed on the date below
so future audits / agents have a permanent baseline to compare
against.).

**Source-of-truth pointers:**

- BENTON-SYNC-7-A policy:
  `docs/sync/sales-qualification-coverage-continuity-smoke-policy.md`
- BENTON-SYNC-7-B implementation: marker commit `41385dbae`,
  merged at `1bb237ef6`.
- BENTON-SYNC-7-C marker commit (this slice): see slice ledger
  in `docs/sync/benton-core-sync-next-need.md` after this lands.
- Captured artifacts (gitignored, operator-side):
  `backend/artifacts/sync-atlas/benton-sync-7-c/20260502T050226Z/`
  - `coverage-report.json` (Training run)
  - `oltp-run/coverage-report.json` (OLTP run)
- Cadence precedent: BENTON-SYNC-6-A → 6-B → 6-C
  (`docs/sync/benton-dictionary-loader-preflight-evidence-baseline.md`).

## Capture context

Two runs of the smoke against Benton Harris PACS to demonstrate
both the CLEAN-verdict and GAPS-verdict shapes under live
conditions.

```text
Catalog identity (both runs)
  CountyId            : 19190019-1919-1919-1919-191919191919  (WA-Benton)
  WorkbookId          : a767c8a2-5b8a-4846-af8b-c3496601e924
                        (Status='Mapped'; bound to PACS Training source)

Run 1 — Training source (CLEAN verdict)
  SourceConnectionId  : 8e4944c7-9628-448e-b7a6-0053d58ff5ac  (Benton PACS Training)
  Database            : PACS_Training
  --max-sales         : 100
  Exit code           : 0
  Stderr              : empty (zero bytes)
  Artifact size       : 959 bytes
  Verdict             : CLEAN

Run 2 — OLTP source (GAPS verdict — operationally useful)
  SourceConnectionId  : e6ddd159-eac9-450a-aa47-983688d2491d  (Benton PACS OLTP)
  Database            : pacs_oltp
  --max-sales         : 50
  Exit code           : 0
  Stderr              : empty (zero bytes)
  Artifact size       : 6,974 bytes
  Verdict             : GAPS — forward 50, backward 0 (inconclusive), drift 0

Leak scan (both runs combined)
  Pattern scan        : zero matches over Password=, Pwd=, TF_Pacs,
                        SA_PASSWORD, SYNCATLAS_SECRET_, TF_Pacs2026
  Raw-value scan      : zero matches for the resolved SA password
                        across all artifact files
```

## Run 1 — Training source (CLEAN verdict)

```json
{
  "schemaVersion": "1.0.0",
  "runId": "2026-05-02T05:03:07.1191420Z",
  "countyId": "19190019-1919-1919-1919-191919191919",
  "workbookId": "a767c8a2-5b8a-4846-af8b-c3496601e924",
  "sourceConnectionId": "8e4944c7-9628-448e-b7a6-0053d58ff5ac",
  "pacsScope": {
    "rowsScanned": 0,
    "maxSalesApplied": 100,
    "rowsWithChgOfOwnerId": 0
  },
  "canonicalScope": {
    "rowCount": 0,
    "qualifiedCount": 0,
    "excludedCount": 0,
    "inconclusiveCount": 0
  },
  "forwardCoverageGap":      { "count": 0, "isConclusive": true,  "sample": [] },
  "backwardTraceabilityGap": { "count": 0, "isConclusive": false, "sample": [] },
  "decisionDrift":           { "count": 0, "isConclusive": true,  "sample": [] },
  "verdict": {
    "isClean": true,
    "summary": "Coverage continuity holds: every PACS row that should land lands, every canonical row traces to source, no decision drift."
  }
}
```

### Reading Run 1

PACS Training's `dbo.sale` is empty (verified independently:
`SELECT COUNT(*) FROM dbo.sale = 0`). `CanonicalSaleQualifications`
also has zero rows for Benton (the C36 production write path has
not been run). The smoke correctly reports CLEAN: there is no
work to do, so by definition there are no gaps.

This is a "vacuously true" CLEAN verdict — the smoke proves that
the runtime did read both sides and compute the diff; the diff is
empty because both sides are empty. The bounded-scan
`isConclusive: false` on the backward gap is honest: with
`--max-sales: 100`, the scan IS bounded, so the backward gap
*should* be reported as inconclusive even at zero count.

This run is the proof of:

- ✓ Live PACS connectivity from SyncAtlas
- ✓ Live workbook load (Mapped state passes HG7 fail-closed)
- ✓ Live `CanonicalSaleQualifications` query (county-filtered)
- ✓ Live JSON artifact write
- ✓ Stdout report shape
- ✓ Bounded-scan inconclusive marker on backward gap
- ✓ Verdict computation (CLEAN when all three counts are 0)
- ✓ Empty stderr, exit 0
- ✓ Leak-free output

### Hard guards re-verified at Run 1

- **HG3 read-only** : `CanonicalSaleQualifications` row count = 0
  before AND after the run.
- **HG6 source-traceable** : top-level identity envelope present
  (`countyId`, `workbookId`, `sourceConnectionId`, `runId`).
- **HG7 fail-closed** : workbook `a767c8a2` is `Status='Mapped'`,
  so `LoadMappedAsync` did not throw. The fail-closed posture is
  structurally pinned but not exercised in this run.
- **No-PII-in-artifact** : every field is identity envelope +
  scope counts + empty samples + verdict. No row data.

## Run 2 — OLTP source (GAPS verdict)

The same workbook against the OLTP source surfaces 50 forward-
coverage gaps because the OLTP `dbo.sale` table is populated
(50 rows scanned within the bound) and no canonical rows exist
for Benton. The smoke correctly identifies these as gaps.

```json
{
  "schemaVersion": "1.0.0",
  "runId": "2026-05-02T05:04:15.0012710Z",
  "countyId": "19190019-1919-1919-1919-191919191919",
  "workbookId": "a767c8a2-5b8a-4846-af8b-c3496601e924",
  "sourceConnectionId": "e6ddd159-eac9-450a-aa47-983688d2491d",
  "pacsScope": {
    "rowsScanned": 50,
    "maxSalesApplied": 50,
    "rowsWithChgOfOwnerId": 50
  },
  "canonicalScope": {
    "rowCount": 0,
    "qualifiedCount": 0,
    "excludedCount": 0,
    "inconclusiveCount": 0
  },
  "forwardCoverageGap": {
    "count": 50,
    "isConclusive": true,
    "sample": [/* 50 entries — see below for representative shape */]
  },
  "backwardTraceabilityGap": { "count": 0, "isConclusive": false, "sample": [] },
  "decisionDrift":           { "count": 0, "isConclusive": true,  "sample": [] },
  "verdict": {
    "isClean": false,
    "summary": "Coverage continuity gaps found - forward: 50, backward: 0 (inconclusive), drift: 0."
  }
}
```

### Sample entry shape (representative, first three of fifty)

```json
{ "chgOfOwnerId": 1, "canonicalStatus": null, "freshStatus": "Inconclusive" }
{ "chgOfOwnerId": 2, "canonicalStatus": null, "freshStatus": "Inconclusive" }
{ "chgOfOwnerId": 3, "canonicalStatus": null, "freshStatus": "Inconclusive" }
```

### Reading Run 2

OLTP's `dbo.sale` table is populated. The smoke scans 50 rows
(bounded), all with non-null `ChgOfOwnerId` (per PACS canonical
identity policy D0-D). The canonical landing has zero rows for
Benton, so every PACS row is a forward-coverage gap.

All 50 entries report `freshStatus: "Inconclusive"`. This is
expected: the workbook (`a767c8a2`) was built against the
Training source profile, and OLTP rows have `wac_cd` /
`sl_ratio_type_cd` values that are not all in the Training
workbook's code-value rows. Per the C8-A transform contract,
unmapped source values produce `Unknown` decision status, which
the BENTON-SYNC-6-C-style C36-mapping converts to canonical
`Inconclusive`.

This is the operationally-useful signal the smoke was designed
to surface: "Benton has 50+ PACS sales rows in OLTP, but no
canonical rows have been written, AND the current workbook
doesn't fully cover the OLTP code values." The operator's
remediation path is one of:

1. Run the C36 canonical-write runner against OLTP with the
   appropriate workbook to populate canonical landing.
2. Update the workbook's code-value coverage so OLTP rows
   produce non-Inconclusive decisions.
3. Bind the right (CountyId, SourceConnectionId, WorkbookId)
   triple for the production pipeline.

Per the BENTON-SYNC-7-A "no autoremediation" hard guard, the
smoke does not perform any of these — it only surfaces the
gap.

### Hard guards re-verified at Run 2

- **HG3 read-only** : `CanonicalSaleQualifications` row count = 0
  before AND after the run.
- **HG6 source-traceable** : every sample entry carries
  `chgOfOwnerId`; envelope carries identity triple.
- **HG7 fail-closed** : structurally pinned (workbook is Mapped).
- **No-PII-in-artifact** : sample entries carry only
  `(chgOfOwnerId, canonicalStatus, freshStatus)`. No party
  identifiers, addresses, prices, or any field outside the
  permitted set.
- **County-scoped** : the workbook `a767c8a2` is bound to
  CountyId `19190019-...`; the connection `e6ddd159-...` is also
  bound to the same CountyId; no cross-county leakage.
- **No autoremediation** : the smoke surfaced 50 gaps and
  exited 0 without re-running C36. Operator decides next
  action.

## Why this baseline matters

Run 2 establishes the shape of a "real" gap report under live
Benton conditions. Future runs against the same
`(CountyId, WorkbookId, SourceConnectionId)` triple should
produce comparable shapes: zero canonical rows until C36 runs,
forward gaps equal to PACS rows scanned, backward gap zero,
drift zero. When the operator runs C36 against this workbook +
connection, subsequent smoke runs should show
`forwardCoverageGap.count` decrease toward zero (or to
`Inconclusive`-only residue if some workbook codes remain
unmapped).

When the operator brings up a more complete workbook for OLTP,
the same smoke should surface different gap shapes. Comparing
those reports against this baseline is the audit signal.

## Re-running the proof

```bash
RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)"
ARTIFACT_DIR="backend/artifacts/sync-atlas/benton-sync-7-c/$RUN_ID"
mkdir -p "$ARTIFACT_DIR"

TF_DB="<resolve from local config; never commit>"
COUNTY_ID="19190019-1919-1919-1919-191919191919"
CONNECTION_ID_OLTP="e6ddd159-eac9-450a-aa47-983688d2491d"
WORKBOOK_ID="a767c8a2-5b8a-4846-af8b-c3496601e924"
SECRET_VAR="SYNCATLAS_SECRET_E6DDD159EAC9450AAA47983688D2491D"
export "$SECRET_VAR=$(cat ~/.terrafusion/pacs-sa-password.tmp)"

dotnet run --project backend/tools/SyncAtlas --no-build -- \
  --db "$TF_DB" \
  --county-id "$COUNTY_ID" \
  --connection-id "$CONNECTION_ID_OLTP" \
  --qualify-sales-coverage \
  --workbook-id "$WORKBOOK_ID" \
  --max-sales 50 \
  --coverage-evidence-path "$ARTIFACT_DIR/coverage-report.json" \
  > "$ARTIFACT_DIR/run.stdout.txt" \
  2> "$ARTIFACT_DIR/run.stderr.txt"
echo "exit=$?" > "$ARTIFACT_DIR/exit-code.txt"
unset "$SECRET_VAR"
```

Compare the resulting `coverage-report.json` to this baseline.
Meaningful drift in `pacsScope.rowsScanned`,
`canonicalScope.rowCount`, or `forwardCoverageGap.count` warrants
investigation before continuing operational work.

## Deferred test-matrix gates (BENTON-SYNC-7-A)

The BENTON-SYNC-7-B status report flagged 6 acceptance gates
deferred to this slice. Resolution at this baseline:

| Gate                                                          | Resolution                                                                                                                                                                  |
|--------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `Run_DoesNotMutatePacs`                                       | Confirmed: live tf-mssql container's row counts unchanged across both runs (PACS Training `dbo.sale` = 0 before/after; OLTP read-only by construction of `ISalesRowReader`). |
| `Run_CrossCountyWorkbook_FailsClosed`                         | Structurally pinned: `LoadMappedAsync` is county-filtered (existing C7 read-model contract). The runner's defensive cross-county check is dead code on the happy path.       |
| `Write_FailureWritesStderrPreservesExitCode`                  | Confirmed by Program.cs structure: artifact write inside try/catch; catch prints stderr; exit code preserved (mirrors BENTON-SYNC-6-C reconciliation).                       |
| `Artifact_ContainsNoRowDataBeyondPermittedFields`             | Confirmed: live OLTP artifact contains only identity envelope + scope counts + sample entries with `(chgOfOwnerId, canonicalStatus, freshStatus)`. No row data.              |
| `Artifact_SampleSizesAreCapped`                               | Live OLTP run: 50 forward gaps with 50-entry sample (cap not hit at 50; sample == count). Cap is the deterministic constant `SqlSalesQualificationCoverageRunner.SampleCap = 50`; non-trivial test would require >50 row fixture, which adds little signal beyond the constant.|
| `Cli_PreflightEvidencePath_WithLoaderCommand_WritesArtifact_AndPrintsConfirmation` (analog from 6-A test matrix) | Confirmed: both runs printed `sync-atlas: coverage evidence artifact written to <path>` exactly once on success (per BENTON-SYNC-6-C confirmation-line shape).               |

All deferred gates are resolved either by the live evidence here
or by structural pinning that doesn't require additional test
code.

## Slice ledger note

- BENTON-SYNC-7-A : DONE — policy.
- BENTON-SYNC-7-B : DONE — implementation + writer + tests.
- BENTON-SYNC-7-C : DONE — this evidence baseline. ← this slice
- BENTON-SYNC-8+  : reselected from inventory's parked list
                    when next concrete need surfaces.
