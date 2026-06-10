# Workbench Slice E — Identity Spine Panel

**Status**: ✅ BUILT 2026-06-08  
**URL**: `http://127.0.0.1:7700` (same server as Slices A–D)  
**Extends**: `SLICE_D_LANE_SEAL.md`  
**Design spec**: `TERRAFUSION_SYNC_WORKBENCH_MVP.md` §11

---

## Purpose

The Identity Spine panel answers:

> **Do all canonical tables point at the live parcel spine?**

It renders the 11-table output of `identity-drift-detector.sql`, making the
F1 class of failure visually impossible to miss. Dangling rows — canonical
rows whose `TfParcelId` resolves to dead or stale identity generations rather
than the live spine — are the alarm signal.

Read-only. No drains. No schema mutation.

---

## Hard rule

If any sealed-lane table has `dangling > 0`, the panel shows:

> ⛔ **Identity drift detected — do not drain until resolved.**

The global banner names the specific tables. Each affected group card shows a
FAIL badge. The dangling count is highlighted red.

---

## Known-deferred exception

`canonical_tf.tf_parcel_owner_link` is the one known-deferred drift table.
It is NOT a sealed canonical lane. If it has `dangling > 0`, the row and its
group card show WARN (amber) — not FAIL. This mirrors `KNOWN_DRIFT_DEFERRED`
in `tf-sync-doctor.mjs`.

---

## How it works

After the doctor run completes, if step #1 (Identity Drift Detector) is
present in the output, the panel fires `POST /api/identity-drift/run`
automatically (non-blocking, ~10–20s).

`/api/identity-drift/run` spawns `tools/sync/identity-runner.mjs`, which runs
`identity-drift-detector.sql` via psql and returns raw pipe-delimited output.
The client parses statement 1 (per-table rows) and statement 2 (overall),
then renders four group cards.

---

## Eleven tables / four groups

| Group | Tables |
|-------|--------|
| F1 Family | tf_land, tf_improvement, gis_tf.tf_parcel_geom |
| Valuation · Jurisdiction · Exemption | tf_assessment, tf_parcel_tax_area, tf_exemption |
| Revenue | tf_tax_bill_line, tf_tax_bill_current, tf_assessment_bill_line, tf_assessment_bill_current |
| Owner Link (known deferred) | tf_parcel_owner_link |

---

## Metrics per table

| Metric | Meaning | Action |
|--------|---------|--------|
| total | All rows | Context |
| live | Rows resolving to live spine | Expected ≈ total (except multi-row tables) |
| **dangling** | Non-null TfParcelId NOT on live spine | **Zero required on all sealed lanes** |
| null | NULL TfParcelId | Informational — some residuals are valid |

The `dangling` count is the only alarm metric. `null_ref` is shown grayed
out — do not fail on it; confirm against the lane's documented residual.

---

## Benton steady-state

After F1 fix, F1 family and all sealed lanes should be clean:

```
F1 Family
  ✓  tf_land                87,767  total  87,767  live  0 dangling  0  null
  ✓  tf_improvement         99,694  total  99,694  live  0 dangling  0  null
  ✓  tf_parcel_geom         80,075  total  80,075  live  0 dangling  …  null

Valuation · Jurisdiction · Exemption
  ✓  tf_assessment          83,326  total  83,326  live  0 dangling
  ✓  tf_parcel_tax_area     83,326  total  83,326  live  0 dangling
  ✓  tf_exemption            5,643  total   5,643  live  0 dangling

Revenue
  ✓  tf_tax_bill_line      990,665  total  990,665  live  0 dangling
  … (all PASS)

Owner Link (known deferred)
  ⚠  tf_parcel_owner_link  …  N dangling  (WARN — expected, not a sealed lane)
```

---

## Doctrine (Learned Law #2)

Shown as a callout at the bottom of the panel:

> Never blind-join `canonical_tf.tf_parcel` (3.2M rows including legacy
> generations). Resolve through `sync_bridge.source_xref` WHERE
> `TfEntityType='parcel' AND IsActive`.

---

## Visibility rules

| Condition | Identity Spine panel |
|-----------|---------------------|
| Page first load | Hidden |
| Doctor running | Hidden |
| Doctor completes, step #1 absent | Hidden |
| Doctor completes, step #1 present | Fires `/api/identity-drift/run`; renders ~10–20s later |
| Endpoint 409 (already running) | Silently stays hidden |

---

## Files changed

```
tools/sync/
  identity-runner.mjs             NEW: thin psql runner for identity-drift-detector.sql

tools/sync/workbench/
  server.mjs                      MODIFIED: IDENTITY_RUNNER path, identityRunning flag,
                                  runIdentityRunner(), POST /api/identity-drift/run

tools/sync/workbench/panel/
  app.js                          MODIFIED: identitySpineEl DOM ref, KNOWN_DRIFT_DEFERRED,
                                  ID_GROUPS, parseIdentityDrift(), idEffectiveVerdict(),
                                  idShortName(), renderIdentitySpine(),
                                  fetchAndRenderIdentitySpine(); updated click handler
  index.html                      MODIFIED: added <section id="identity-spine">
  styles.css                      MODIFIED: is-* styles (group cards, table rows,
                                  metric cells, dangling highlight, doctrine callout)

docs/sync/workbench/
  SLICE_E_IDENTITY_SPINE.md       This file
```

---

## Non-goals (this slice)

- No drain buttons
- No schema or data mutation
- No "fix drift" actions
- No per-row detail on which parcels are dangling
- No historical comparison

---

## Acceptance criteria

- [ ] After doctor run, Identity Spine panel appears ~10–20s after step cards render
- [ ] Four group cards: F1 Family / Valuation·Jurisdiction·Exemption / Revenue / Owner Link
- [ ] Each table row shows: sym · schema-prefix · table-name · total · live · dangling · null
- [ ] Benton F1 family shows all PASS with dangling=0 (green)
- [ ] tf_parcel_owner_link shows WARN (amber) — not FAIL
- [ ] Any non-deferred sealed-lane table with dangling>0 → red dangling count + FAIL badge
- [ ] Any FAIL triggers global "⛔ Identity drift detected — do not drain until resolved." banner
- [ ] Doctrine callout visible at bottom of section
- [ ] Panel hidden on page load, during run, and if step #1 absent
