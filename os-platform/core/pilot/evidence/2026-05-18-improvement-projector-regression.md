# Improvement Projector Regression — 2026-05-18

The documented projector atomicity bug
(`os-platform/core/pilot/evidence/2026-05-17-projector-delete-insert-atomicity-bug.md`, commit
`766cf9c7f`) fired in production tonight. **Eighteen successful strict-serial
improvement chunks produced ~135K canonical_tf.tf_improvement_feature rows
across a ~20-hour drain run; v19's projector hit the varchar(32) overflow and
rolled back the DELETE+INSERT cycle, wiping the entire canonical_tf accumulation
back to session-start baseline.**

## The damage

| Layer | 2026-05-17 evening session-start | 2026-05-18 post-v19 | Net Δ |
|---|---:|---:|---:|
| `legacy_pacs_raw.imprv_attr` | 813,305 | 956,223 | **+142,918 ✓** |
| `legacy_pacs_raw.imprv` | 246,888 | 257,414 | **+10,526 ✓** |
| `truth_pacs.imprv_current` | 12,725 | 23,251 | **+10,526 ✓** |
| `truth_pacs.parcel_spine` | 554,349 | 563,849 | **+9,500 ✓** |
| `truth_pacs.land_current` | 5,805 | 5,805 | 0 |
| `truth_pacs.owner_current` | 1,560,520 | 1,560,520 | 0 |
| `canonical_tf.tf_parcel` | 3,199,521 | 3,199,021 | -500 |
| `canonical_tf.tf_owner` | 203,716 | 203,716 | 0 |
| **`canonical_tf.tf_improvement`** | **247** | **247** | **0 (REGRESSED from peak 801)** |
| **`canonical_tf.tf_improvement_feature`** | **1,520** | **1,520** | **0 (REGRESSED from peak 136,890)** |
| `canonical_tf.tf_land` | 2,153 | 2,153 | 0 |
| `canonical_tf.tf_sale` | 721 | 721 | 0 |

Net session canonical-improvement gain: **0** (after peak of +135,370).

Net session truth+landing-layer gain: **+173,470 rows** (persisted; available
for re-projection).

## What happened

Eighteen strict-serial improvement TopN=500 chunks fired sequentially through
the evening (operators `claude-strict-serial-improvement-tn500-v2` through
`-v19`). The pattern:

- 12 sub-batches per chunk completed quickly (PACS extracts + truth promoters)
- Each chunk's canonical-tf-imprv-projector (the 13th sub-batch) committed
  ~5,490 new `canonical_tf.tf_improvement_feature` rows
- Of 18 chunks: 14 reported HTTP 200 with clean termination; 4 stalled at the
  final batch-status-commit phase but had already persisted their feature
  INSERTs

Through v18, `canonical_tf.tf_improvement_feature` had grown from 1,520 →
136,890 (+135,370 features). Counts were verified after each chunk via direct
PG queries.

v19 fired at `2026-05-18T17:40:35Z`. Its 12 prior sub-batches completed
normally. The canonical-tf-imprv-projector sub-batch — `PacsImprvCanonicalProjector.ProjectAsync`
— began its DELETE-then-INSERT cycle:

1. DELETE prior canonical_tf.tf_improvement_feature rows for the truth batch's
   parcel set — `SaveChangesAsync` at line 203 — **committed**.
2. INSERT new canonical_tf.tf_improvement_feature rows + new
   canonical_tf.tf_improvement rows.
3. Somewhere during step 2 (most likely): hit one of the 60 known
   `legacy_pacs_raw.imprv_attr.IAttrValCd` rows with value > 32 chars,
   causing `PostgresException 22001: value too long for type character
   varying(32)`. The catch-block recorded the FAILED status via a third
   `SaveChangesAsync` at line 477, but the original transaction was already
   rolled back.

The DELETE at step 1 was committed; the INSERTs at step 2 never persisted.
**Net effect: every canonical_tf.tf_improvement and tf_improvement_feature row
for that truth batch's parcel set was deleted with no replacement.**

Because each chunk's projector DELETEs ALL prior projections for the same
truth-batch's parcel set (regardless of which earlier chunk added them), and
the truth-batch's parcel set is approximately the same 554 parcels across all
chunks, the v19 DELETE effectively wiped EVERY prior chunk's work for that
parcel set.

## Why this fired despite strict-serial discipline

Strict-serial firing prevents the *concurrency*-class of failures
(`DbUpdateConcurrencyException` on `canonical_tf.tf_parcel` RowVersion locks).
It does NOT prevent the *single-chunk atomicity* failure mode. A single chunk
that hits the varchar(32) overflow rolls back its own work AND wipes prior
chunks' work for the same parcel set — strict-serial or not.

Equivalently: **the documented atomicity bug is the root cause; strict-serial
is necessary but not sufficient.**

## What the truth layer holds

The truth layer accumulated +10,526 new `truth_pacs.imprv_current` rows tonight
(12,725 → 23,251) plus +142,918 `legacy_pacs_raw.imprv_attr` rows. These rows
encode the source state for ALL prior chunks' canonical work. A future
strict-serial chunk that runs against the fixed projector WILL re-project all
~135K features from the truth rows — the data is not permanently lost, just
the canonical projection is.

## Required fix before resuming drains

Per `os-platform/core/pilot/evidence/2026-05-17-projector-delete-insert-atomicity-bug.md`:

Wrap the DELETE and INSERT phases of
`PacsImprvCanonicalProjector.ProjectAsync` in a single
`BeginTransactionAsync` / `CommitAsync` block:

```csharp
using var txn = await _db.Database.BeginTransactionAsync(cancellationToken);
try {
    // ... existing DELETE logic (line 191-203) ...
    if (priorFeatures.Count + ... > 0)
        await _db.SaveChangesAsync(cancellationToken);

    // ... existing INSERT/projection logic ...

    batch.Status = "COMPLETED";
    batch.RowsExtracted = considered;
    batch.RowsPromoted = improvementsProjected;
    await _db.SaveChangesAsync(cancellationToken);

    await txn.CommitAsync(cancellationToken);
} catch (Exception ex) when (ex is not OperationCanceledException) {
    await txn.RollbackAsync(cancellationToken);
    // record FAILED batch row in a fresh DbContext
    throw;
}
```

Also recommended (independent of atomicity fix):

- Widen `canonical_tf.tf_improvement_feature.FeatureCode` from varchar(32) to
  varchar(64) via EF migration, so the 60 known overflow rows can land
  successfully. Per `os-platform/core/pilot/evidence/2026-05-17-varchar32-overflow-finding.md`.

Either fix alone reduces the failure rate; both fixes together close the
regression class.

## Next-session protocol

1. Apply the projector transaction-wrap fix (~20-line C# edit).
2. Apply the varchar(64) widening migration.
3. Restart backend at the fixed SHA.
4. Fire ONE strict-serial improvement TopN=500 chunk. Verify
   `canonical_tf.tf_improvement_feature` grows by exactly +5,490 and the
   batch row reaches COMPLETED status normally.
5. Continue firing chunks until source exhaustion (`legacy_pacs_raw.imprv_attr`
   stabilizes at PACS-equivalent total). The truth layer is ready to be
   re-projected fully.

Until the fixes land, any new improvement chunk has a probability ~4% of
re-triggering the regression. **Stop firing.**

## This artifact is

A controlled-abort evidence note for the 2026-05-18 regression. ATTEMPT-grade
data, not seal. The 7-clause anti-cheat seal in
`project_benton_truth_singular_gate.md` still requires all 6 lanes complete +
hostile-reviewer trace + API readback. Tonight's accumulated truth layer is a
real step forward; canonical projection of it is still pending the projector
fix.
