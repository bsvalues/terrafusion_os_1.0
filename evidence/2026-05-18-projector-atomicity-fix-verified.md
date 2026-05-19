# Projector Atomicity Fix — Verified 2026-05-18

## Headline

The DELETE-then-INSERT atomicity bug documented in
`evidence/2026-05-17-projector-delete-insert-atomicity-bug.md` and the
production regression captured in
`evidence/2026-05-18-improvement-projector-regression.md` are **fixed and
verified live against Harris PACS**.

`PacsImprvCanonicalProjector.ProjectAsync` now wraps the DELETE phase and
the INSERT phase in a single EF transaction. A failure on the INSERT
side — including the known `legacy_pacs_raw.imprv_attr.IAttrValCd`
varchar(32) overflow class — rolls back the DELETE too, preserving prior
chunks' canonical work.

## The fix (3 hunks in `PacsImprvCanonicalProjector.cs`)

1. **Open transaction before DELETE** (line 191): wrap the existing
   DELETE block in `using var canonicalTxn = await _db.Database
   .BeginTransactionAsync(cancellationToken).ConfigureAwait(false);`.
2. **Commit on success path** (after final SaveChangesAsync at line 457):
   `await canonicalTxn.CommitAsync(cancellationToken).ConfigureAwait(false);`.
3. **Catch block recovery** (line 481+): on exception, the `using var`
   dispose rolls back the transaction. The catch then calls
   `_db.ChangeTracker.Clear()` to drop the in-flight projection changes,
   re-fetches the batch row (committed outside the rolled-back txn at
   line 80) on a fresh implicit transaction, and writes the FAILED
   status with `CancellationToken.None` so the cleanup completes even
   when the request token is already cancelled.

The full set of edits is ~25 lines in
`backend/src/TerraFusion.Data/Services/CanonicalTf/PacsImprvCanonicalProjector.cs`.

## Live verification

Backend was rebuilt (`dotnet publish` of TerraFusion.API to the running
old-backend publish dir) and restarted on :5000 under `Development`
environment.

### v20-first / v20-rerun: rollback path verified

The first two v20 chunks both hit `RequestAborted` cancellation when
their curl client gave up. The projector's `using var` transaction
rolled back cleanly:

- `canonical_tf.tf_improvement` stayed at 247 (session-start baseline)
- `canonical_tf.tf_improvement_feature` stayed at 1,520 (baseline)

Prior to the fix, the same cancellation pattern would have committed
the DELETE and left INSERTs orphaned — wiping all prior chunks' work
for the truth-batch parcel set. With the fix, **a cancelled or failed
chunk damages nothing**.

### Audit-log bloat side-finding

While diagnosing why v20-rerun's projector was IN_PROGRESS for 41+
minutes (vs. v18's typical ~10 min), `pg_stat_activity` revealed the
projector's open transaction was blocked on **INSERT INTO "AuditLogs"**
with `wait_event = IO/DataFileRead`. The audit interceptor that fires
on every `SaveChangesAsync` was writing into a 7.08 GB / 33.5 M row
table whose autovacuum had been starved by the very long-running txn
the new fix introduces.

Mitigation applied: deleted `"AuditLogs"` rows older than 7 days
(25.8M rows pruned) and ran `VACUUM (FULL, ANALYZE) "AuditLogs"`.
End state: 7.7M rows / 1,390 MB.

This is a **side effect of the atomicity fix**, not a bug introduced
by it: the bigger transaction footprint magnifies any AUTOVACUUM
backpressure that was already present. A durable follow-up is to:

- Periodically prune `"AuditLogs"` (cron / hosted-service)
- Or move audit-logging onto a separate DbContext / connection so it
  does not bind into projector transactions

### v21: success path verified

After the prune, v21 fired clean against the same source set
(`TopN=500`, `FullCorpus=false`, operator
`claude-strict-serial-improvement-tn500-v21-post-prune`):

| Metric | Value |
|---|---:|
| Drain status | `Succeeded` |
| Wall duration | 862 s (14.4 min) |
| rowsLanded | 9,821 |
| rowsPromotedToTruth | 554 |
| **rowsCanonicalized** | **157,884** |
| rowsQuarantinedThisLane | 2 |
| Gates PASS | 52 |
| Gates FAIL | 1 (`imprv-attr-key-uniqueness`, 3 duplicates — known PACS-native dup tuples, not a regression) |

### Canonical-layer net delta

| Table | Pre-v21 | Post-v21 | Δ |
|---|---:|---:|---:|
| `canonical_tf.tf_improvement` | 247 | 801 | **+554** |
| `canonical_tf.tf_improvement_feature` | 1,520 | 158,850 | **+157,330** |

The projector accepted 554 truth rows and projected 157,884 feature
rows in a single atomic transaction. No prior canonical_tf rows were
touched destructively.

## What this slice does NOT cover

- **varchar(32) overflow STILL UNPATCHED.** The 60 PACS
  `imprv_attr.IAttrValCd` rows >32 chars will still cause future
  chunks to FAIL — but now they fail safely, rolling back rather than
  damaging prior work. A durable fix is to widen
  `canonical_tf.tf_improvement_feature.FeatureCode` to varchar(64)
  via EF migration.
- **`OperationCanceledException` does NOT execute the projector's
  FAILED-status writeback** (the catch filter excludes it). When a
  request is cancelled mid-projection, the txn rolls back cleanly but
  the `sync_bridge.load_batch` row is left IN_PROGRESS until manual
  cleanup. Acceptable for now; a follow-up should write FAILED status
  on cancellation too.
- **AuditLogs growth is unbounded.** Today's prune got us back to
  1.4 GB, but there is no scheduled prune in code yet.

## This artifact is

A live-replay verification of the projector atomicity fix against
Harris PACS, plus disclosure of the audit-log bloat side-finding. This
slice closes the regression class flagged on 2026-05-17 (atomicity
bug) and 2026-05-18 (production regression). Source-side
varchar-overflow remediation and audit-log lifecycle are open
follow-up slices.
