# DOCTRINE-STATUS-1 — Findings: Operator Status Read Surface

**Slice:** DOCTRINE-STATUS-1 (post-DOCTRINE-CLOSURE-1). Read-only
operator-facing endpoint. Aggregates the data the operator dashboard
needs to render the doctrine pipeline's current state, batch
freshness, gate failures, and quarantine totals — all in one
call.

**Status:** SHIPPED. Three endpoints under `/api/sync/doctrine/`:
state, batch detail, lane health. All read-only. None trigger
canonical state changes.

## Why this slice exists

DOCTRINE-CLOSURE-1 (PR #777) gave operators one button to run the
doctrine pipeline. They still couldn't *see* it without DB queries.
This slice is the read counterpart: the data the dashboard renders
between closure runs.

The endpoint surface is split into three calls so the UI can pick
its weight class:

- **`GET /api/sync/doctrine/state`** — full snapshot. ~30 LINQ
  aggregates, ~20 KB JSON. Use for the main dashboard load.
- **`GET /api/sync/doctrine/lanes`** — per-lane row counts only.
  Light. Use for periodic polling (e.g. 30s tick).
- **`GET /api/sync/doctrine/batch/{loadBatchId}`** — single-batch
  detail with all gate results. Use when an operator clicks a
  failure row.

## Sample state response (current Benton dev DB)

```
operational: true
summary:
  canonicalRowsTotal:  9216
  quarantineRowsTotal: 3176
  countiesBound:       1
canonical:
  tf_parcel              : 1109
  tf_sale                : 2
  tf_owner               : 1133
  tf_parcel_owner_link   : 1300
  tf_assessment_wsdor    : 199
  tf_improvement         : 241
  tf_improvement_feature : 3016
  tf_land                : 239
  tf_parcel_geom         : 1977
truth: ... (six tables, totals)
raw: ... (ten tables, totals)
quarantine:
  legacy_tf_unproven_sale         : 8
  legacy_tf_unproven_imprv_attr   : 3168
  (others: 0)
lastCompleted: [12+ source-system rows with timestamps + counts]
recentGateFailures: [25 most recent FAIL/WARN rows]
gateOutcomeSummary: [PASS / FAIL / WARN aggregate counts]
counties: [{Id, Name, State, FipsCode}]
```

## Files shipped

- `backend/src/TerraFusion.API/Controllers/DoctrineStatusController.cs`
  — three GET endpoints, AllowAnonymous, dev-mode posture (auth
  hardening when this graduates out of debug)
- `docs/sync/doctrine-status-1-findings.md`

## Operational verdict

The endpoint computes a single `operational: bool` based on a
simple invariant: every terminal canonical table has > 0 rows.
This is the dashboard's traffic-light. The operator dashboard
renders green when operational, yellow when partial (some lanes
populated, others empty), red when nothing has run.

The verdict is computed each call — it always reflects current
DB state, not a cached value. Polling cost is one COUNT(*) per
canonical table (already 9 cheap aggregates).

## Patterns surfaced

The shape of the response is intentionally a **strict layer model**:

1. **canonical** — what consumers see (the public-facing TF objects)
2. **truth** — what passed the doctrine gates (the proven middle layer)
3. **raw** — what landed verbatim from sources (the audit substrate)
4. **quarantine** — what the projection couldn't resolve but
   doctrine preserved rather than discarded

The dashboard renders these as columns; per-row trace is the
batch-detail drilldown.

## Quarantine signal

The current dev DB shows 3,168 quarantined imprv_attr rows. These
came from earlier runs where the imprv_attr stage actually
returned data (different keying than the year-2026-only run that
produced 0 attr rows). The `legacy_tf_unproven_imprv_attr` table
captures attribute rows whose `i_attr_val_id` didn't resolve to
a `canonical_tf.attribute_definition` row in the same county.

This is a real signal: the `attribute_definition` table for Benton
is sparsely populated, so most imprv_attr rows quarantine. A future
slice (IMP-POP-2 or similar) can either:

- Populate `attribute_definition` from the PACS `imprv_attribute_dictionary`
- Refine the projector to handle missing definitions gracefully
- Both

This endpoint surfaces the issue. The dashboard makes it visible
to the operator; the operator decides priority.

## Re-open conditions for DOCTRINE-STATUS-1

- New canonical tables added to the doctrine. The state endpoint
  must include them.
- New quarantine tables. Same.
- Dashboard performance becomes a problem (today: ~1s for the
  state call against a small dev DB; production drains will push
  this if not careful — consider materialized views).
- Auth hardening: this slice is `AllowAnonymous` for dev posture.
  Production deployment must add JWT bearer / role check.

## Endpoint reference

```
GET /api/sync/doctrine/state?recentGateLimit=25
GET /api/sync/doctrine/lanes
GET /api/sync/doctrine/batch/{loadBatchId}
```

All three are read-only, idempotent, GET-method.

## What this enables

- **Operator dashboard frontend**: just renders this JSON. No
  per-table query plumbing in the UI layer.
- **CI smoke tests**: a small TopN closure run + a state-endpoint
  hit verifies operational == true.
- **Multi-county**: when N counties are bound, the dashboard
  renders N status cards. The endpoint already returns the bound
  counties list.
- **Production health checks**: external monitors hit `lanes` for
  a cheap liveness signal.

## The one-line summary

**DOCTRINE-STATUS-1 shipped: three GET endpoints render the
doctrine pipeline's current state, freshness, and quarantine
signal. The data plane behind the operator dashboard.**
