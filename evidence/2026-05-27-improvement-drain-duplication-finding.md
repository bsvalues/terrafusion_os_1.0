# Improvement Drain — Duplication / Non-Advancement Finding (2026-05-27)

**Severity: CRITICAL. Reframes the entire improvement-drain "progress" narrative.**

Triggered by the first hostile-reviewer parcel trace (prop_id 61594). All numbers
below are live read-only measurements against the drain DB, not estimates.

## Headline
The improvement drain has **not been advancing through Benton County**. It has been
re-promoting and re-projecting the same small working set repeatedly. The large row
counts previously reported as progress are duplication, not coverage.

## Proven facts
| Metric | Reported as | Measured reality |
|---|---|---|
| `truth_pacs.imprv_current` | 150,406 (~52% of ~290K ceiling) | 150,406 **rows**, only **6,940 distinct** (PropId,PropValYr,SupNum,ImprvId) → **21.7× duplication**; worst keys appear **262×** |
| Parcel coverage | implied ~half county | **4,614 distinct PropId = ~5.2%** of Benton's 89,247 parcels |
| `canonical_tf.tf_improvement` | "1,105 stable / idempotent" | flat at **1,105** entire run; references **669** parcels; **1,066 (96%)** point to a `TfParcelId` absent from `canonical_tf.tf_parcel` (dangling) |
| `sync_bridge.source_xref` (improvement) | — | **1,105** total entities (flat) — never grew with truth |
| `canonical_tf.tf_improvement_feature` | "1.39M Benton features" | 1,385,745 rows, ~1,104 distinct parents (~1,255 features/improvement); sampled parcel 61594 had **72 rows for 14 distinct logical features (~5×)** |

## Hostile-reviewer trace (prop_id 61594) — what it showed
- SOURCE `legacy_pacs_raw.imprv`: 18 rows for **6 distinct ImprvId** (each landed 3×).
- TRUTH: 6 rows, each correctly linked to a source LandedRowId (truth dedup works at the (Prop,Imprv) level for this parcel, but the table as a whole carries 21.7× duplicate rows across re-promotions).
- XREF + CANONICAL: 6 improvements, all REAL_COMMERCIAL — but `TfParcelId=4a8d48c2…` is **absent from tf_parcel** (improvement projected against a parcel identity that doesn't exist in the canonical parcel table).
- FEATURES: 72 rows → 14 distinct logical (duplicate landed-detail rows each projected).

## ROOT CAUSE — PROVEN (traced to exact code)
**The drain seed query has no advancement cursor.**
`backend/src/TerraFusion.Data/Services/PacsSources/SqlServerPacsOwnerSource.cs` (lines 62–74):
```sql
SELECT TOP {topN} ... FROM owner
WHERE sup_num = 0 AND owner_tax_yr >= 2018
ORDER BY owner_tax_yr DESC, prop_id, owner_id
```
- No `OFFSET`, no keyset pagination, no "exclude already-promoted" predicate.
- `TOP 500` + fixed `ORDER BY` against a static PACS mirror = **the same 500 owners every chunk.**
- The improvement landing is keyed off this owner seed, so every chunk re-lands the
  SAME parcels' improvements under a NEW `ImprvLoadBatchId`.

Compounding mechanism (PROVEN in `PacsImprvCurrentTruthPromoter.cs` lines 110–119):
- Truth idempotency clears prior rows **by `ImprvLoadBatchId`** (the landing batch),
  NOT by the natural key (PropId,PropValYr,SupNum,ImprvId). Each chunk's landing batch
  is new, so nothing is cleared → duplicate truth rows accumulate (21.7×, up to 262×).
- The canonical projector re-projects features from all (duplicated) landed-detail rows
  → feature duplication (~5×); `tf_improvement`/`source_xref` stay ~flat because the
  natural-key set of improvements never changes.

**Conclusion:** `FullCorpus=false, TopN=500` is a SAMPLE/TEST mode. It was structurally
incapable of advancing through the county. The 200+ "chunks" re-drained the same top
~500 owners (~4,614 parcels accumulated from historical TopN/FullCorpus variation).

## Fix options (for operator decision — NOT yet applied)
1. **Run FullCorpus=true** (topN=null → all owners). Simplest; drains the whole county
   in one (long) pass. Needs the truth-dedup fix first or it still duplicates on re-runs.
2. **Add an advancing cursor** to the seed (keyset pagination on (owner_tax_yr,prop_id,
   owner_id) OR a WHERE that excludes parcels already in truth_pacs) so successive TopN
   chunks cover new ground.
3. **Fix truth idempotency** to UPSERT on the natural key (PropId,PropValYr,SupNum,
   ImprvId) instead of clearing by ImprvLoadBatchId — makes re-drains safe/idempotent.
4. **Dedup features** at landing or projection so canonical features aren't multiplied
   by re-landing.
5. **Dedup pass** to collapse the existing 21.7×/5× duplication once 1–4 are fixed.

Cross-lane note: tf_parcel has 3.2M rows vs ~89K Benton parcels — likely the SAME
non-advancement/duplication pattern in the parcel lane. Worth the same trace.

## Parcel-lane investigation result (agent, read-only, 2026-05-27)
- tf_parcel 3.2M rows = LEGITIMATE (39-county bulk import, ~1:1 on ParcelNumber). NOT drain duplication.
- Benton drained coverage ~93% (83,326 distinct prop_id) — far ahead of improvement's 5% (it got a full-corpus run historically; improvement was only ever sampled).
- SAME two root causes confirmed in parcel lane: non-advancing `SqlServerPacsOwnerSource` seed + batch-scoped idempotency in `PacsParcelSpineTruthPromoter` → `truth_pacs.parcel_spine` is **8.2× duplicated** (681,457 rows / 83,326 distinct / 321 batches).
- BUT the parcel CANONICAL projector dedups by natural key (prop_id, `PacsParcelCanonicalProjector.cs` ~154-182) — which is why tf_parcel didn't blow up. The improvement projector dedups improvements by 4-tuple too, but projects features per landed detail/attr row without deduping those.

## FIX STATUS (2026-05-27)
**FIX 1 — truth-promoter natural-key idempotency: DONE + PROVEN + DEPLOYED.**
- `PacsImprvCurrentTruthPromoter.cs`: replaced batch-scoped clear with a delete of
  existing truth rows for the parcel-years being promoted (ExecuteDeleteAsync), so
  re-drains REPLACE instead of stacking. Compiled clean, published to running backend.
- Proof: re-draining the top (262×-duplicated) parcels dropped truth_pacs.imprv_current
  150,406 → 9,303 rows with distinct held at 6,940 (zero loss).
- One-time dedup pass then collapsed all residual: **truth now 6,940 rows = 6,940 distinct = 1.0×.**

**REMAINING (next focused session — designed, NOT yet done):**
2. **Feature dedup:** the improvement projector projects one feature per landed
   `imprv_detail` / `imprv_attr` row; those landing tables carry re-landed duplicates,
   so `tf_improvement_feature` (1.39M) is ~5× inflated. Fix EITHER by deduping
   `detailsByKey`/`attrsByImprv` in `PacsImprvCanonicalProjector.cs` by their detail/attr
   natural key, OR (root) by making the landing services idempotent so re-drains don't
   duplicate detail/attr rows. Then a one-time canonical dedup/re-project pass.
3. **Advancement:** `SqlServerPacsOwnerSource` needs a cursor (keyset on prop_id) or the
   improvement drain must seed prop_ids NOT already in truth_pacs, so chunks cover NEW
   parcels. Without this, coverage stays at ~5% no matter how many chunks run. Same fix
   benefits the parcel lane's remaining ~7%.
4. **parcel_spine** needs the same natural-key idempotency fix as FIX 1 (8.2× dup).

Watchdog remains DISABLED until advancement (3) lands — otherwise it just re-drains the
same parcels (now idempotently, but still no new coverage).

## Action taken
- **Autonomous drain (`TF-DrainWatchdog`) DISABLED** — continuing only adds duplicate
  rows. Recon monitor + backup remain (read-only / safe).
- This finding committed so it cannot be lost.

## Next step
Investigate the truth-promoter selection + upsert logic and the canonical projector's
improvement-creation path (C# in `backend/src/TerraFusion.Data/Services/CanonicalTf/`
and the truth promoter) to find why the drain does not advance and why truth/features
duplicate. Do NOT resume the drain until the advancement + dedup behavior is understood
and fixed. The ~6,940 distinct improvements already promoted are real; the duplication
is recoverable (dedup pass) once the root cause is fixed.
