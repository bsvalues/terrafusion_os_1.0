# SYNC-COMPLETE-2 — Lane-Scoped Drain Operator Runbook

**Audience:** the operator (Benton County assessor) running PACS →
canonical_tf doctrine work in production. **Supersedes the procedure
section of [SYNC-COMPLETE-1](./sync-complete-1-runbook.md)** for any
new full-corpus work — the SYNC-COMPLETE-1 runbook still documents
baselines, expected counts, and post-drain validation, all of which
remain authoritative. What changes here is *how the drain runs*.

## What this slice fixes

The SYNC-COMPLETE-1 procedure was one big `run-all-lanes` call wrapped
in `curl -m 21600` (6h timeout). In production that pattern lost
twice: each attempt ran out the budget mid-stream and aborted with no
checkpoint. Either lane re-orders, lane sizes, or laptop reboots
forced a restart from scratch.

SYNC-COMPLETE-2 ships:

1. **Per-lane perf**: `BulkInsertScope` disables EF Core's
   `AutoDetectChangesEnabled` over the streaming Add+SaveChanges
   loop in all 10 PACS landing services. Validated 1.58× speedup at
   N=20k via the synthetic perf-test endpoint
   `POST /api/debug/perf-test/bulk-insert-synthetic`. The win
   compounds at full-corpus N because the EF change tracker scan
   was O(tracker-size) per `Add()`.

2. **Single-lane drains**: six new endpoints under
   `POST /api/sync/doctrine/drain/{lane}`. Each one runs exactly one
   lane and returns within minutes, not hours. The operator
   checkpoints between lanes; a failure in one lane does not lose
   work from previous lanes.

3. **Dashboard buttons**: `/workbench/sync-doctrine` grew a "Drain by
   lane" panel — six buttons, one per lane, with live elapsed timer,
   result card (counts, gate summary, quarantine delta), and a
   "next recommended lane" hint. Defaults to FullCorpus=OFF /
   TopN=200 because synchronous browser fetches will time out before
   a full-corpus lane like owner-wsdor (~90 min) finishes.

The full-corpus `run-all-lanes` endpoint is unchanged and remains
available for environments that can hold a long-lived HTTP
connection (a CI worker, a hosted scheduler, etc.).

## The new drain procedure

### Step 1: capture baselines

Same as SYNC-COMPLETE-1 step 1. Capture both PACS source counts and
canonical state before starting.

```bash
curl -s "http://localhost:5000/api/debug/pacs-counts" \
  | tee pre-drain-pacs-counts.json

curl -s "http://localhost:5000/api/sync/doctrine/state" \
  | tee pre-drain-canonical.json
```

### Step 2: drain each lane in order

Recommended order (the dashboard's "next recommended lane" hint
matches this):

```
parcel  →  owner-wsdor  →  improvement  →  land  →  sales  →  geometry
```

Why this order:

- **parcel** first: every other lane (except sales and geometry)
  needs `tf_parcel` rows to xref against. Run it first so the rest
  of the lanes have the spine they need.
- **owner-wsdor** second: this is the heavy lane (~90 min full
  corpus). Doing it before improvement/land lets you catch any
  account / supp_assoc breakage early.
- **improvement, land**: smaller, lean on the parcel chain and the
  shared supp_assoc landing they re-do for their own keys.
- **sales** uses an independent DESC sale_id seed — order
  independent. Run it any time after parcel.
- **geometry** is fully independent (ArcGIS REST). Run it last so
  the APN crosswalk lands against a fully-projected `tf_parcel`.

#### Option A (preferred for short lanes — UI driven)

Open `http://localhost:5173/workbench/sync-doctrine`. In the "Drain
by lane" panel:

1. Set OperatorName, WorkingYear (default 2026), TopN sample size.
2. Click **Drain** on `parcel`. Watch the elapsed-time readout. When
   the result card shows `Succeeded`, the next-recommended lane
   appears.
3. Click **Drain** on the next recommended lane. Repeat until all
   six lanes are green.

The dashboard runs each lane synchronously via `fetch`. Lanes that
exceed the browser's idle timeout (most browsers cap at ~5 min for
some lanes; longer lanes will time out the request even though the
backend keeps running) need Option B instead.

#### Option B (full corpus — curl driven)

For multi-hour full-corpus lanes (owner-wsdor in particular), drive
the same endpoints with curl. The endpoints take the same body shape
the dashboard uses:

```bash
# parcel — quick, ~5 min full corpus
curl -s -X POST "http://localhost:5000/api/sync/doctrine/drain/parcel" \
  -H "Content-Type: application/json" \
  -d '{"OperatorName":"prod-drain","FullCorpus":true,"WorkingYear":2026}' \
  -m 1800 \
  -o drain-parcel.json
jq '.status, .counts, .quarantineDelta' drain-parcel.json

# owner-wsdor — heavy lane, ~90 min full corpus. -m 7200 = 2h timeout.
curl -s -X POST "http://localhost:5000/api/sync/doctrine/drain/owner-wsdor" \
  -H "Content-Type: application/json" \
  -d '{"OperatorName":"prod-drain","FullCorpus":true,"WorkingYear":2026}' \
  -m 7200 \
  -o drain-owner-wsdor.json
jq '.status, .counts, .quarantineDelta' drain-owner-wsdor.json

# improvement — ~45 min full corpus
curl -s -X POST "http://localhost:5000/api/sync/doctrine/drain/improvement" \
  -H "Content-Type: application/json" \
  -d '{"OperatorName":"prod-drain","FullCorpus":true,"WorkingYear":2026}' \
  -m 5400 \
  -o drain-improvement.json

# land — ~15 min full corpus
curl -s -X POST "http://localhost:5000/api/sync/doctrine/drain/land" \
  -H "Content-Type: application/json" \
  -d '{"OperatorName":"prod-drain","FullCorpus":true,"WorkingYear":2026}' \
  -m 1800 \
  -o drain-land.json

# sales — ~15 min full corpus, independent of parcel chain
curl -s -X POST "http://localhost:5000/api/sync/doctrine/drain/sales" \
  -H "Content-Type: application/json" \
  -d '{"OperatorName":"prod-drain","FullCorpus":true,"WorkingYear":2026}' \
  -m 1800 \
  -o drain-sales.json

# geometry — ~5 min, ArcGIS only
curl -s -X POST "http://localhost:5000/api/sync/doctrine/drain/geometry" \
  -H "Content-Type: application/json" \
  -d '{"OperatorName":"prod-drain"}' \
  -m 600 \
  -o drain-geometry.json
```

Each call returns the same envelope:

```json
{
  "lane": "parcel",
  "status": "Succeeded",
  "batchIds": ["...guids..."],
  "counts": {
    "rowsLanded": 96750,
    "rowsPromotedToTruth": 96750,
    "rowsCanonicalized": 96750,
    "rowsQuarantinedThisLane": 0
  },
  "durationSec": 312.4,
  "gateSummary": { "totals": [...], "recentFailures": [...] },
  "quarantineDelta": { "before": 4, "after": 4, "delta": 0 },
  "nextRecommendedLane": "owner-wsdor"
}
```

A `Failed` response carries `failedStage` and `error` fields and
returns HTTP 500 — but with the same envelope so JSON tools work.

### Step 3: monitor progress

While a lane runs, poll the same dashboard from another shell or
tab. The dashboard auto-refreshes every 30s and shows:

- Canonical layer counts (does `tf_parcel` reach ~96k after the
  parcel lane?)
- Quarantine layer counts (does anything new appear unexpectedly?)
- Gate outcomes (any new FAIL/WARN since the lane started?)

For the curl path, also tail backend logs:

```bash
# wherever Serilog is writing
tail -f backend/logs/terrafusion-api-*.txt | grep -E "Drain:|Lane:"
```

### Step 4: post-drain validation

Same as SYNC-COMPLETE-1 step 4. Re-capture counts and diff.

```bash
curl -s "http://localhost:5000/api/sync/doctrine/state" \
  | tee post-drain-canonical.json
curl -s "http://localhost:5000/api/debug/pacs-counts" \
  | tee post-drain-pacs-counts.json

diff <(jq -S '.canonical' pre-drain-canonical.json) \
     <(jq -S '.canonical' post-drain-canonical.json)
```

Expected canonical counts are the same as SYNC-COMPLETE-1's table —
they describe steady-state of `canonical_tf.*`, not how it got
there. Reproducing here for convenience:

| Canonical table | PACS source baseline | Expected canonical |
|---|---|---|
| `tf_parcel` | `property_real` = 96,750 | ~96,750 |
| `tf_owner` | `account_total` = 471,401 distinct | ~471k |
| `tf_parcel_owner_link` | `owner_active_post2018` = 809,396 | ~809k |
| `tf_assessment_wsdor` | `wpov_active_post2018` = 809,385 | ~809k |
| `tf_improvement` | `imprv_2026_active` = 104,462 | ~104k |
| `tf_improvement_feature` | detail + attr ~ 997k | ~997k |
| `tf_land` | `land_detail_2026_active` = 87,767 | ~88k |
| `tf_sale` | qualified subset of `sale_post2018` 62k | ~370 |
| `tf_parcel_geom` | (ArcGIS) 1,977 | 1,977 |

### Step 5: drain quarantine (unchanged)

If any non-doctrine-correct quarantine residual appears, the
existing per-quarantine drain endpoints still apply:

```bash
# imprv_attr quarantine (rare given ATTR-DRAIN-1 dictionary refresh):
curl -s -X POST "http://localhost:5000/api/debug/attr-drain-1/run-drain" \
  -H "Content-Type: application/json" -d '{}'

# Sale NoParcelXref quarantine for non-R parcels is doctrine-correct
# — leave it. Re-validate after a full drain:
curl -s -X POST "http://localhost:5000/api/debug/sale-drain-1/run-drain" \
  -H "Content-Type: application/json" -d '{}'
```

### Step 6: lock the state (unchanged)

Screenshot `/workbench/sync-doctrine`, save all `*-drain*.json`
artifacts, update the user memory.

## What "checkpoint-able" buys you

If a lane fails partway through, the failure is isolated to that
lane:

- Earlier lanes' canonical_tf rows stay in place.
- The failed lane's `legacy_pacs_raw_*` rows for that batch are
  marked `FAILED` (via the catch block's `batch.Status = "FAILED"`).
- Truth/canonical rows from a successful prior partial run of the
  same lane are NOT rolled back — the truth promoters are
  idempotent on `(LoadBatchId, business_key)` and canonical
  projectors upsert.
- You re-run only the failed lane after fixing the root cause.

The previous all-or-nothing model lost lanes A-E when lane F died at
hour 5.

## Known operational notes

- **Browser timeouts**: Chrome / Firefox idle-timeout long fetches.
  The dashboard is the right surface for parcel/sales/geometry
  (~5–15 min). Use curl with explicit `-m` for owner-wsdor and
  improvement.
- **AbortController**: clicking Cancel in the dashboard aborts the
  request *client-side*. The backend continues until its own
  cancellation token fires when the connection drops; no rollback.
  If you need a hard backend stop, kill the backend process.
- **Concurrent lanes**: technically supported (each lane writes
  isolated batches and the gate aggregator is per-batch-id). The
  recommended order exists because lanes share the parcel chain;
  running improvement before parcel will produce empty improvement
  truth because there's nothing to xref. The dashboard does not
  block concurrent runs — operator discipline does.
- **ChangeTracker after SYNC-COMPLETE-2**: AutoDetectChanges is
  disabled scoped to the streaming loop; post-loop modifications
  to the LoadBatch entity (Status, RowsExtracted, RowsPromoted)
  run with AutoDetectChanges restored so the final SaveChanges
  captures them. If you add new landing services, copy the pattern
  from `PacsOwnerLandingService.cs` exactly — block-scoped
  `using (var _bulkScope = BulkInsertScope.Begin(_db)) { ... }`.

## Re-open conditions for SYNC-COMPLETE-2

- A lane drain reveals a new failure mode the TopN sample didn't
  surface (most likely candidates: FK violations from sub-county
  isolation gaps, PACS schema drift in a table we don't audit yet,
  ArcGIS rate limits on geometry).
- The dashboard panel needs progress streaming (per-stage
  granularity) — today the elapsed-time readout is just wall clock.
  SignalR feed is a future slice.
- A second county lights up and lane logic needs county
  parameterization (today every drain calls
  `ResolveOrCreateBentonCountyAsync`).

## What's NOT shipped in this slice

- Multi-county lane parameterization (still Benton-only).
- SignalR per-stage progress events (still wall-clock only on the
  dashboard).
- A scheduled cron-style hosted drain service.
- Backend cancellation token plumbing on the abort path (the
  request aborts client-side; the backend completes its current
  stage).
- Tests for `DoctrineDrainController` and `DrainLanePanel`. The
  components type-check and build clean; integration tests against
  PACS are deferred until the test harness has a PACS fixture.

## The one-line summary

**SYNC-COMPLETE-2: lane-scoped drain operator model. Six per-lane
endpoints + dashboard buttons + EF ChangeTracker bulk-insert
optimization (1.58×). The county goblin learned to walk in lanes,
and the batch goblin stopped counting every crumb twice.**
