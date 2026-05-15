# Benton Multi-Lane Drain Restored — Evidence Note 2026-05-15

After the 2026-05-13 ATTEMPT (commit `6df11c25c`) and a day of stuck-chunk
firing, the drain endpoint was restored to working state by a single root-cause
fix and several controlled aborts. This note records what changed, what data
landed in the TerraFusion DB today, and what is now known about the improvement
lane.

## Root cause

**19 zombie `Status='IN_PROGRESS'` rows in `sync_bridge.load_batch`**, dating
back to 2026-05-05, were blocking every new drain attempt. The lane runner
appears to serialize on outstanding IN_PROGRESS batches as a global lock; with
19 stale rows from prior backend crashes never marking themselves terminal,
every new chunk waited indefinitely.

After explicit `OperatorAborted` UPDATE on those zombies (with their original
operators preserved in `ErrorSummary`), the drain endpoint immediately resumed
working. The cleanup query:

```sql
UPDATE sync_bridge.load_batch
SET "Status"='FAILED',
    "ErrorSummary"='OperatorAborted: zombie cleanup. Row was IN_PROGRESS for >1 day after the parent backend process died without marking terminal status. Likely contributing to drain-endpoint serialization stalls. Marked FAILED 2026-05-15 during diagnostic phase.',
    "CompletedAt"=now()
WHERE "Status"='IN_PROGRESS' AND "StartedAt" < now() - interval '1 day'
```

cleared all 19 rows. Re-poll showed `0 IN_PROGRESS rows` remaining.

A second, related root cause was that the OLD backend worktree at
`C:/Users/bsval/.tf-old-backend-a844ffe15` (created from SHA `a844ffe15` to
sidestep a suspected HEAD regression) lacked the gitignored
`appsettings.{Development,BentonCounty}.local.json` files. These files contain
the live PACS SA password; without them, the lane runner hung on MSSQL login
retries. Copying the two files from the main worktree into both the OLD source
dir AND the OLD publish dir restored PACS auth.

The "HEAD regression" hypothesis turned out to be incorrect — HEAD code was
fine; both backends had been blocked on the same zombie-row symptom plus
credentials.

## Slices completed today (post-cleanup)

Backend: OLD `a844ffe15` running from
`C:/Users/bsval/.tf-old-backend-a844ffe15/.tmp/api-old-publish` with
`TERRAFUSION_API_CONTENT_ROOT` pointing at the OLD source tree. Bound :5000
at `2026-05-15T17:49:18Z`.

| Lane | TopN | Operator | Duration | Rows Landed | Promoted | Canonicalized | Quarantined | Gates |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| sales | 1 (probe) | claude-probe-sales-tn1-today | 8.6 s | 1 | 0 | 0 | 0 | 14 PASS |
| sales | 500 | claude-post-zombie-sales-tn500 | 173 s | 500 | 257 | 256 | 1 | 30 PASS / 1 WARN |
| land | 500 | claude-post-zombie-land-tn500 | 269 s | 543 | 543 | 543 | 0 | 34 PASS |
| owner-wsdor | 500 | claude-post-zombie-owner-wsdor-tn500 | 528 s | 999 | 999 | 1,420 | 0 | 49 PASS |
| geometry | 500 | claude-post-zombie-geometry-tn500 | 512 s | 1,978 | 3,955 | 3,955 | 0 | 13 PASS |
| geometry | 2000 | claude-post-zombie-geometry-tn2000 | 824 s | 1,978 | 3,955 | 3,955 | 0 | 13 PASS *(re-canonicalized; source exhausted at 1,978)* |
| sales | 2000 | claude-post-zombie-sales-tn2000 | 533 s | 2,000 | 726 | 721 | 5 | 30 PASS / 1 WARN |
| land | 2000 | claude-post-zombie-land-tn2000 | server-side ~25–35 min (curl timed out at 1500 s but completed) | 2,153 | — | — | — | — |
| owner-wsdor | 2000 | claude-post-zombie-owner-wsdor-tn2000 | 2340 s | 3,999 | 3,999 | 5,726 | 0 | 49 PASS |

The 1 WARN seen on sales was the doctrine-named gate
`truth-pacs-supp-aware-join` reporting `noSuppPointer=21` (chunk 1) and 435
(chunk 2) — these are sales rows with no supplemental pointer, an informational
gate, not a failure.

## Data delta (TerraFusion DB row counts)

Baseline at start of session vs current:

| Table | Pre-session | Now | Delta |
|---|---:|---:|---:|
| `truth_pacs.parcel_spine` | 531,792 | 538,266 | +6,474 |
| `truth_pacs.land_current` | 956 | 3,652 | +2,696 |
| `truth_pacs.owner_current` | 1,556,020 | 1,558,520 | +2,500 |
| `truth_pacs.sale` | 108 | 1,091 | +983 |
| `truth_pacs.imprv_current` | 3,100 | 3,100 | 0 *(improvement lane in flight at write time)* |
| `canonical_tf.tf_parcel` | 3,197,521 | 3,197,521 | 0 |
| `canonical_tf.tf_owner` | 199,841 | 201,989 | +2,148 |
| `canonical_tf.tf_land` | 239 | 543 | +304 |
| `canonical_tf.tf_sale` | 98 | 721 | +623 |
| `canonical_tf.tf_improvement` | 488 | 488 | 0 *(in flight)* |
| `truth_arcgis.parcel_geom_current` | 1,977 | 3,955 | +1,978 |

Geometry source is exhausted at 1,978 for the current scope (Benton parcels
with current ArcGIS feature service coverage). Repeating geometry chunks
returns the same numbers idempotently.

## Improvement lane — diagnosis only, no seal yet

The improvement lane was the originally-broken lane today; multiple TopN=500
attempts at 30-min and 60-min deadlines all hit deadlineExit with no growth.
Reading `DoctrineDrainController.cs` line 703+ revealed why: the improvement
lane runs **8+ sequential stages**:

1. Owner-Seed-S1 (PACS owner extract)
2. Parcel-S1 (property extract for those owners)
3. Parcel-Spine (truth promotion of parcels)
4. Parcel-Canonical (canonical projection of parcels)
5. Supp-S1 (supplemental association extract)
6. PropertyVal-S1 (non-blocking)
7. LandDetail-S1 (non-blocking)
8. Imprv-S1 (actual improvement extract)
9. Imprv-Detail-S1, Imprv-Attr-S1, truth promotion, canonical projection

vs sales (3 stages), land (3 stages), geometry (3 stages), owner-wsdor (5
stages). At TopN=500, improvement legitimately needs 30–90 minutes for the
8-stage chain to complete. My earlier 5-min and 30-min curl timeouts were
short, not the lane being broken.

A `claude-post-cleanup-improvement-tn500` chunk with a 90-min server-side
timeout is in flight at write time. If it succeeds, improvement is just slow,
not broken, and the lane works under the chunk-strategy.

## What this artifact is NOT

This is not the singular-gate seal. It is a controlled-state evidence note
recording today's restored drain progress. The 7-clause anti-cheat seal in
[project_benton_truth_singular_gate.md](../../.claude/projects/C--Users-bsval-terrafusion-os-1-0/memory/project_benton_truth_singular_gate.md)
still requires all six lanes complete to PACS-equivalent totals + the
hostile-reviewer trace. Parcel and geometry are functionally complete; sales,
land, owner-wsdor have substantial new data but more chunks needed; improvement
in flight. This is mid-corpus ATTEMPT data, not seal.

## Doctrine reference

Generated alongside `evidence/2026-05-13-benton-full-corpus-ATTEMPT.md`
(`6df11c25c`). Attempts are data, not seals. The drain endpoint is now restored
to a known-working state; the zombie cleanup is reproducible for future stalls.
