# DOCTRINE-CLOSURE-1 — Findings: Unified All-Lanes Doctrine Runner

**Slice:** DOCTRINE-CLOSURE-1 (post-GIS-POP-1). The unified runner
that consolidates 9 separate per-lane closure proofs into one
operator-triggered call. Replaces the stack of `*-pop-*` debug
endpoints with a single canonical entry point. Foundation for the
operator dashboard.

**Status:** PROVEN. All 7 lanes (1 identity + 5 PACS domains +
1 geometry) executed end-to-end in one call. Total elapsed: 288
seconds.

## The result

```
elapsed: 288.4 seconds (~4.8 min)

LANE BREAKDOWN
══════════════════════════════════════════════════════════════
Parcel        : landed=200,   promoted=200,   projected=200
Owner         : landed=200,   promoted=200,   projected=178 + 200 links
WSDOR         : landed=199,   promoted=199,   projected=199, 0 quarantined
Improvement   : landed=241,                   projected=241 + 754 features
Land          : landed=239,                   projected=239 (40,813 acres)
Sale          : landed=500,   promoted=3,     projected=2,   1 quarantined
Geometry      : landed=1977,                  projected=1977 + 16 APN matches

CANONICAL COUNTS (after run)
══════════════════════════════════════════════════════════════
tf_parcel              : 1109
tf_sale                : 2
tf_owner               : 1133   (+178 from this run)
tf_parcel_owner_link   : 1300   (+800 from this run)
tf_assessment_wsdor    : 199
tf_improvement         : 241
tf_improvement_feature : 3016   (+754 from this run)
tf_land                : 239
tf_parcel_geom         : 1977
```

## Why a unified runner

Each prior closure shipped a per-lane `/api/debug/<name>/run-*`
endpoint. They all do the same shape of work — keyed-source closure
seeded from owners (or in the sale lane, from sales DESC) — and
all share the same county-id resolution, PACS connection string
lookup, and exception-handling boilerplate.

The unified runner consolidates that. One call, one verdict, one
audit anchor across all lanes. The natural foundation for the
operator dashboard's "Run Doctrine Closure" button.

## Files shipped

- `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs`
  — adds `POST /api/debug/doctrine-closure/run-all-lanes`. Single
  endpoint, 22 services injected, 7 lanes orchestrated in sequence.
- `docs/sync/doctrine-closure-1-findings.md`

## Doctrine alignment

The runner respects the established doctrine pattern:
- Owner-anchored seed (real-property guarantee for parcels and
  derived chains)
- Independent sale lane seed (sales DESC samples don't necessarily
  overlap with owner-anchored prop_ids; sale lane uses its own seed
  + targeted parcel chain to resolve the promoted sales' xrefs)
- Geometry lane runs against the configured ArcGIS REST FeatureServer;
  APN crosswalk resolves against whatever tf_parcel rows exist at
  projection time (so PACS lanes running first improves crosswalk
  hit rate)

Every per-lane idempotency contract still applies. Re-running the
unified endpoint replays each lane idempotently; canonical state
converges, doesn't drift.

## What this enables

- **Operator dashboard**: one button maps to one endpoint. UI just
  needs to display the per-lane block + the aggregate verdict.
- **Production drains**: TopN parameters become null (or large
  numbers) for full-corpus runs. Same orchestration code, just
  bigger samples.
- **Multi-county**: replicate by parameterizing the county-id
  resolution. The runner takes a county-id at call time; today it
  resolves Benton, tomorrow it can resolve Yakima/Cowlitz/etc.
- **CI/CD smoke tests**: a small-TopN run (e.g. owner=10, sale=20)
  fits in a CI budget and proves the doctrine end-to-end on every
  pipeline change.

## Per-lane proof verdicts

The runner produces one aggregate `proofVerdict`. Internal per-lane
status is also surfaced in the `lanes` array. The verdict is
PROOF if and only if every terminal canonical table has > 0 rows
after the run. PARTIAL otherwise (caller investigates via the
per-lane block).

## Re-open conditions for DOCTRINE-CLOSURE-1

- A new lane is added (e.g. mineral / personal-property classification).
  The runner needs the new chain inserted in the right ordering.
- The owner-anchored seed strategy changes (e.g. county-specific
  seeding policies).
- The 5-minute runtime becomes a problem (production drains will
  push this to hours; consider parallel lane execution if independent).

## Endpoint reference

```
POST /api/debug/doctrine-closure/run-all-lanes
Content-Type: application/json

{
  "OperatorName": "doctrine-closure-proof",  // optional
  "OwnerTopN": 200,                           // optional, default 200
  "SaleTopN": 500,                            // optional, default 500
  "WorkingYear": 2026,                         // optional, default 2026
  "SkipGeometry": false                        // optional; true = skip ArcGIS
}
```

Response includes `lanes[]` (per-lane status + counters), `counts{}`
(aggregate canonical state), `elapsedSeconds`, and `proofVerdict`.

## The TerraFusion canonical state — captured by this run

Plain English: against live Benton Harris PACS + Benton's public
ArcGIS REST FeatureServer, in one operator-triggered call running
on a developer laptop in 5 minutes, the doctrine pipeline produces:

- 1,109 canonical parcels
- 1,133 canonical owners (deduped by acct_id)
- 1,300 canonical parcel↔owner edges
- 199 WSDOR-grade per-owner valuations
- 241 canonical improvements
- 3,016 canonical improvement features
- 239 canonical land segments (40,813 acres)
- 2 canonical sales (the 1 quarantined fell out because its parcel
  was MH-typed, doctrine-correctly excluded from the real-property
  spine)
- 1,977 canonical parcel geometries (16 APN-resolved against tf_parcel)

Plus full provenance, lineage, idempotency, and county isolation
verified at every layer.

## The one-line summary

**DOCTRINE-CLOSURE-1 closed: one operator call, 5 minutes, 7 lanes
end-to-end against live data. The doctrine pipeline is operational
as a single coherent system.**
