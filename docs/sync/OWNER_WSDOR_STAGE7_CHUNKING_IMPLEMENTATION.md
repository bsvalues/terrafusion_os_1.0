# OWNER_WSDOR_STAGE7_CHUNKING_IMPLEMENTATION

Work Order: WO-OWNER-PERF-001  
Date: 2026-06-20  
Branch: fix/owner-truth-chunk-save  

---

## RESULT

COMPLETE. Stage 7 (`PacsOwnerCurrentTruthPromoter`) now persists truth entities in
chunks of 10,000 with targeted ChangeTracker detach after each flush. The single
monolithic SaveChangesAsync over ~809k entities is eliminated. 3420/3420 unit tests
pass. Owner scope not changed. Full owner-wsdor not rerun.

---

## BRANCH

`fix/owner-truth-chunk-save` off `9e17f0e2b` (main HEAD)

---

## FILES_CHANGED

| File | Change |
|---|---|
| `backend/src/TerraFusion.Data/Services/TruthPacs/PacsOwnerCurrentTruthPromoter.cs` | Added `OwnerTruthChunkSize = 10_000` constant; chunked save + detach in promotion loop; detach after final flush |
| `backend/tests/TerraFusion.Unit.Tests/TruthPacs/PacsOwnerCurrentTruthPromoterTests.cs` | Added 3 new tests covering chunk boundary, ChangeTracker detach contract, and small-batch path |

---

## ROOT_CAUSE

`PacsOwnerCurrentTruthPromoter.PromoteAsync` iterated all ~809k owner rows,
calling `_db.TruthPacsOwnerCurrents.Add(...)` per row, then called
`SaveChangesAsync` once after the loop. EF Core's ChangeTracker tracked all
~809k Added entities simultaneously — both the object-graph overhead and the
resulting single large-transaction Save caused the lane to exceed 2 hours at
Benton full-corpus scale.

Same pattern as GEOM-011B-H1 (geometry ChangeTracker accumulation), applied here
at the truth-promotion layer.

---

## CHUNK_SIZE

`10,000` entities per flush (`private const int OwnerTruthChunkSize = 10_000`).

At 809,396 total owner rows: ~81 chunk saves during the loop + 1 final flush.
Each chunk save persists ≤10k rows and detaches them before the next chunk begins.
Estimated Stage 7 wall-clock with this change: **2–5 minutes** (vs. >60 min before).

---

## SCOPE_CHANGED

**No.** Owner scope is unchanged:
- Source query: `sup_num = 0 AND owner_tax_yr >= 2018`
- Total rows: 809,396
- Pre-2018 rows: excluded (migration artifacts, not touched)
- Canonical output: identical — same rows, same keys, same gates

---

## CHANGETRACKER_BEHAVIOR

Two detach points added:

1. **Inside the promotion loop** — after every `OwnerTruthChunkSize` promoted rows:
   ```csharp
   await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
   foreach (var entry in _db.ChangeTracker
                .Entries<TruthPacsOwnerCurrent>().ToList())
       entry.State = EntityState.Detached;
   ```

2. **After the final post-loop flush** — cleans up the last partial chunk:
   ```csharp
   await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
   foreach (var entry in _db.ChangeTracker
                .Entries<TruthPacsOwnerCurrent>().ToList())
       entry.State = EntityState.Detached;
   ```

Targeted detach (type-scoped) — NOT `ChangeTracker.Clear()`. The `LoadBatch`
entity and `PromotionGateResult` entities added by gate writers remain tracked,
which is required for the batch status update and gate writes that follow.

In-memory state unaffected: `groupPctSums`, rejection counters (`rejectedNoSupp`,
`rejectedStaleSup`, `rejectedNoAccount`), and `preConversionPromoted` are plain
C# variables with no EF dependency. ChangeTracker detach does not alter them.

Gate query safety: `WriteRemainingGatesAsync` counts unprovenanced truth rows via
`CountAsync` against the DB — not the ChangeTracker. Detaching truth entities
before this call is safe.

---

## TESTS

3 new tests in `PacsOwnerCurrentTruthPromoterTests`:

| Test | What it proves |
|---|---|
| `ChunkSave_MultipleOwners_AllPromotedAndNoTrackedEntitiesRemain` | All rows survive chunk boundary + final flush; DB count matches promoted count |
| `ChunkSave_NoTrackedOwnerCurrentEntities_AfterFullPromote` | Zero `TruthPacsOwnerCurrent` entities tracked in ChangeTracker after promotion completes |
| `ChunkSave_SmallBatch_CompletesWithoutChunkBoundary` | Single-row path (final-flush only, no chunk boundary) still works correctly |

All 24 `PacsOwnerCurrentTruthPromoterTests` pass.  
Full suite: **3420/3420 pass, 0 fail, 0 skip.**

---

## BUILD_STATUS

```
Build succeeded. 0 Warning(s). 0 Error(s).
Passed! Failed: 0, Passed: 3420, Skipped: 0, Total: 3420
```

---

## OWNER_WSDOR_RERUN

**Not run.** Full owner-wsdor drain is deferred to:

**WO-DATA-FINALIZE-OWNER-002 — Rerun Full Owner-WSDOR From S1b Snapshot**

That work order is separately authorized. The S1b snapshot is intact:
- `D:/TerraFusion_PACS_Verification/terrafusion_benton_demo_S1b_post_parcel.dump`
- Post-restore state: `canonical_tf.tf_parcel` = 83,326; `legacy_pacs_raw.property` = 95,810
- Owner-wsdor v2 partial state: cleared by restore

---

## PR

To be opened from branch `fix/owner-truth-chunk-save`.
