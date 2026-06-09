# TerraFusion Sync Automation #1 — Identity-Drift Detector

_Built 2026-06-08. Implements Automation Backlog #1. Read-only. Encodes Product Doctrine Learned Laws
#1 (active supplement), #2 (never blind-join raw parcel table), #4 (truth sealed ≠ canonical readable)._

## What it is

A read-only SQL detector that prevents the **F1 failure** from recurring silently: canonical rows
that *look* sealed but point at a dead/stale parcel-identity generation instead of the **live parcel
spine**. It is the alarm installed on the drawer that broke.

File: `tools/sync/identity-drift-detector.sql` — pure `SELECT`, no DDL, no mutation.

## Live parcel spine (the only authoritative identity)

```
active parcel cross-reference  ->  canonical_tf.tf_parcel
  sync_bridge.source_xref WHERE "TfEntityType"='parcel' AND "IsActive"
```

**Hard rule:** never blind-join the ~3.1M-row `tf_parcel` table. The detector resolves ONLY through
the active `source_xref` / live spine. It therefore does **not** sub-classify "dangling" into
"tf_parcel debris" vs "nonexistent" (that would require joining the 3.1M debris). **"Not live" is
sufficient for the alarm.**

## How to run

```
docker exec -i terrafusion-postgres-dev psql -U postgres -d terrafusion -P pager=off \
  < tools/sync/identity-drift-detector.sql
# or paste into SSMS / any SQL client; export the result set to Excel if desired.
```

## What it reports (per parcel-bearing canonical table)

| column | meaning |
|---|---|
| `total` | total rows |
| `live` | TfParcelId resolves to the live parcel spine |
| `dangling` | **non-NULL TfParcelId NOT on the live spine — the alarm; FAIL if > 0** |
| `null_ref` | NULL TfParcelId — valid-zero candidate (e.g. geometry's 970 NULL-APN residual); reported, not failed |
| `verdict` | PASS if dangling = 0 else FAIL |

Tables covered (11): `tf_land`, `tf_improvement`, `tf_parcel_geom`, `tf_assessment`, `tf_exemption`,
`tf_parcel_tax_area`, `tf_tax_bill_line`, `tf_assessment_bill_line` (the 8 core lanes) + the rollups
`tf_tax_bill_current`, `tf_assessment_bill_current` + `tf_parcel_owner_link` (added for completeness).

## Interpreting results

- `dangling = 0` everywhere → no identity drift; substrate joins on the live spine.
- `dangling > 0` for a table → that lane's canonical rows are detached from the current parcel
  identity (the F1 disease). **Do not auto-repair from the detector** — triage first (it may be
  F1-class dead-identity drift, or legitimately-historical association). Repair is a separate,
  authorized canonical re-key task (see the F1 set-based re-key as the template).
- `null_ref > 0` → confirm against the lane's documented residual (Learned Law #9: a null/zero can be
  valid when source truth has none).

## Adding a table / county scope

Add a `UNION ALL` block per parcel-bearing table (the canonical schema is shared across counties).
For multi-county DBs, add `AND "CountyId" = :'county_id'` to each block and scope the live CTE
accordingly — county isolation is by `CountyId`, not separate tables.

## First run (Benton, 2026-06-08) — the detector immediately found new drift

See `evidence/2026-06-08-identity-drift-detector-benton-pass.md`. All 10 F1-scope tables PASS (the F1
re-key is durable); `tf_parcel_owner_link` FAILed (1,397,252 non-live refs) — a **new finding the
six-parcel readback had masked**, surfaced on the detector's very first run. Validates Backlog #1 as
the correct first automation.
