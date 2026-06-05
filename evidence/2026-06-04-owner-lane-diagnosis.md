# Owner Lane — Diagnosis + Idempotency Fix (2026-06-04)

## Lane shape (two chains, last lane)
- **Owner identity:** legacy_pacs_raw.owner + account → truth_pacs.owner_current →
  canonical_tf.tf_owner + tf_parcel_owner_link.
- **WSDOR:** legacy_pacs_raw.wash_prop_owner_val → truth_pacs.wash_prop_owner_val →
  canonical_tf.tf_assessment_wsdor.
- Drain endpoint: `owner-wsdor` (owner-seeded, TopN/FullCorpus, no advancement cursor).
- Owner truth natural key: (PropId, OwnerTaxYr, SupNum, OwnerId) — co-ownership is multi-row
  per parcel-year. WSDOR key: (PropId, PropValYr, SupNum). Years 2018–2026, sup_num=0.

## Idempotency bug — FOUND + FIXED + PROVEN (both promoters)
- `PacsOwnerCurrentTruthPromoter` and `PacsWashPropOwnerValTruthPromoter` cleared prior truth
  by OwnerLoadBatchId / WpovLoadBatchId (batch-scoped) → re-drains duplicated.
  Observed: owner_current **2.01×** (1,560,520 / 774,760), WSDOR **1.013×** (784,821 / 774,696).
- Fix: clear prior truth by NATURAL KEY (the batch's (PropId, OwnerTaxYr/PropValYr) set), same
  pattern as improvement(76027e412)/land(bfe989350)/sales(7f635489f). Build clean.
- One-time dedup: owner 1,560,520→774,760 (1.0×); WSDOR 784,821→774,696 (1.0×).
- **PROOF:** re-drained a TopN=500 owner-wsdor chunk over already-covered parcels →
  owner 774,760/774,760 **1.0000×**, WSDOR 774,696/774,696 **1.0000×** — held, no inflation.
  (Pre-fix this would have added duplicate rows.)

## Canonical layers — CLEAN (no fix needed)
- tf_owner = 204,137 distinct (1.0×). tf_parcel_owner_link = 1,385,202 = 1,385,202 distinct on
  the YEAR-AWARE key (TfParcelId, TfOwnerId, OwnerTaxYr) = 1.000×. (A naive (parcel,owner) key
  shows 5.28× but that's expected year-versioning, NOT duplication.)

## Denominator + residual (the seal blocker — NOT yet closed)
- PACS owner universe (sup_num=0, 2018+): **95,810 parcels / 809,396 tuples / 809,363 parcel-years.**
  (45,900 non-zero-sup tuples are doctrinally excluded — owner source filters sup_num=0, correct
  for the current-owner snapshot.)
- Truth owner: **95,810 parcels (100% PARCEL coverage) / 774,760 tuples / 774,727 parcel-years.**
- **Tuple gap = 34,636 (4.3%).** Decomposed:
  - **~28,086 = supp-assoc LANDING gap**: owner landing has 809,363 parcel-years but
    prop_supp_assoc landing only 781,277 → promoter's rejectedNoSupp drops the difference.
    **PACS SOURCE HAS prop_supp_assoc for ALL 809,363** (verified: 809,363 = 809,363) → these
    are NOT landed, not absent. Fixable by landing the full supp-assoc universe.
  - **~6,550 = promotion-reject tail** (have supp-assoc but failed stale-sup / no-account).

## Status: NOT sealed.
Idempotency is fixed + proven (both chains 1.0×, parcel coverage 100%). The 34,636-tuple gap is
a supp-assoc LANDING coverage gap (source-complete, just not fully drained) + a small reject
tail — diagnosed by reason. Closing it needs a full owner-wsdor sweep (809K-tuple universe;
owner-seeded, would benefit from a cursor like land/sales). That sweep is the next slice.

## Commits
Idempotency fix (this artifact + both promoters): pending commit.
