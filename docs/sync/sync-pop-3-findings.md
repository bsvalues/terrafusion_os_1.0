# SYNC-POP-3 — Findings: Targeted Supp Overlap Proves truth_pacs.sale > 0

**Slice:** SYNC-POP-3 (post-SYNC-POP-2). Proves the doctrine
truth-promotion gate end-to-end against live Harris PACS by aligning
the prop_supp_assoc batch to exactly the (prop_id, prop_val_yr) keys
the sale batch references. Builds on SYNC-POP-2's source connectors;
ships only the keyed supp source and a new chain endpoint.

**Status:** Proven on a 500-sale post-2018 sample.
`truth_pacs.sale` count: **3 rows** (non-zero — the operative
proof). `canonical_tf.tf_sale` remains 0 (expected — the parcel
pipeline is a separate slice; S3 quarantines because no `tf_parcel`
exists to resolve `source_xref` against).

## Why a targeted source

The SYNC-POP-2 chain endpoint took two independently-bounded source
queries: a TopN sale source and a TopN/full-drain prop_supp_assoc
source. With bounded samples the (prop_id, prop_val_yr) keys rarely
overlapped, so S2-B truth promotion correctly filtered every row
out: the gate requires the exact (PropId, PropValYr) tuple to exist
in the supp batch.

This slice introduces `KeyedSqlServerPacsPropSuppAssocSource`. It
takes a key set extracted from a just-landed sale batch and queries
`dbo.prop_supp_assoc` for ONLY those tuples, chunked at 1000 keys
per round-trip to stay under SQL Server's 2100-parameter limit.

## Files shipped

- `backend/src/TerraFusion.Data/Services/PacsSources/KeyedSqlServerPacsPropSuppAssocSource.cs`
  — keyed `IPacsPropSuppAssocSource` with chunked parameterized
  IN-clause emulation
- `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs`
  — adds `POST /api/debug/sync-pop-3/run-targeted-chain` (with
  `RunCanonicalProjection` flag; default false runs S2-B as the
  operative proof and reports S3's expected zero quarantine)

## Proof outcomes

Local proof run against live Benton `pacs_oltp` (TopN=500):

| Stage | Result |
|---|---|
| S1 | 500 post-2018 sales landed, 0 stale-axis violations |
| Key extraction | 460 distinct (PropId, PropValYr) tuples |
| S2-A | 441 prop_supp_assoc rows landed across 4 distinct years |
| S2-B | **3 sales promoted** to `truth_pacs.sale` |
| S3 | 0 projected, 3 quarantined (expected — `canonical_tf.tf_parcel` empty) |

The 3-of-500 promotion rate matches expectation: most sales in the
sample had `sl_county_ratio_cd = NULL` or `"200"`. Only sales with
exactly `"100"` (qualified) reach the truth-promotion success path,
and of those, only the ones whose (prop_id, owner_tax_yr) appear in
the supp batch get promoted. Both gates are working as documented.

## Doctrine alignment

This slice does NOT modify any doctrine destination service:

- `PacsSaleLandingService` (S1)
- `PacsPropSuppAssocLandingService` (S2-A)
- `PacsSaleTruthPromoter` (S2-B)
- `PacsSaleCanonicalProjector` (S3)

All four were unchanged. The sources feed them with shape-correct
data; the gates filter as designed; the result is recordable
non-zero `truth_pacs.sale` rows for the first time on this local
database.

## Next slice

To complete the proof through canonical projection
(`canonical_tf.tf_sale > 0`), the parcel pipeline must populate
`canonical_tf.tf_parcel` so S3's `source_xref` resolution can find
targets. That's a separate SYNC-POP-* slice and out of scope here.

## Re-open conditions for SYNC-POP-3

This slice stays closed unless:

- The doctrine truth-promotion gates change shape such that the
  targeted-key approach no longer aligns with what S2-B needs.
- The SQL Server 2100-parameter limit changes (would let us drop
  the 1000-key chunking).
- Operator workflow surfaces a need for a different keying strategy
  (e.g., owner-keyed instead of property-keyed).

## Boundary

This slice deliberately does **not** include:

- Any of the 4 still-missing source interfaces (Account / Owner /
  Improvement / Land / Geometry)
- Parcel pipeline (which is what unblocks canonical projection)
- Operator UI
- Production deployment
- Changes to doctrine landing/promotion/projection services
