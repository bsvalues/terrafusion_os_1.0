# Workbench Slice D — Lane Seal Panel

**Status**: ✅ BUILT 2026-06-08  
**URL**: `http://127.0.0.1:7700` (same server as Slices A–C)  
**Extends**: `SLICE_C_PACK_FIT.md`  
**Design spec**: `TERRAFUSION_SYNC_WORKBENCH_MVP.md` §10

---

## Purpose

The Lane Seal panel answers:

> **Which sealed lanes still pass their structural gates?**

It renders the 22 gate results from `seal-check-runner.sql` grouped by lane,
so the operator can see at a glance whether any lane's integrity has been
compromised since the last drain.

Read-only. No drains. No schema mutation.

---

## Hard rule

If any seal gate returns FAIL, the affected lane card shows:

> ⛔ **Seal invalid — do not rely on this lane.**

If any structural gate fails overall, a banner at the top of the section shows:

> ⛔ **Seal integrity COMPROMISED — N gate(s) failed.**

---

## How it works

After the doctor run completes, if step #2 (Seal-Check Runner) is present in
the output, the panel fires `POST /api/seal-check/run` automatically
(non-blocking — same pattern as Slice C's pack validator).

`/api/seal-check/run` spawns `tools/sync/seal-runner.mjs`, which runs
`seal-check-runner.sql` via psql and returns the raw pipe-delimited output.
The client parses statement 1 (per-gate rows) and statement 2 (overall verdict),
then renders one card per lane.

---

## Nine lanes / 22 gates

| Lane | Label | Gates |
|------|-------|-------|
| `parcel-spine` | Parcel Spine | 1 — live parcel count |
| `assessment` | Assessment | 2 — count parity + no-dupe check |
| `jurisdiction` | Jurisdiction | 1 — parcel-tax-area count parity |
| `exemption` | Exemption | 1 — count ≥ threshold |
| `land` | Land | 1 — count ≥ threshold |
| `improvement` | Improvement | 1 — count ≥ threshold |
| `geometry` | Geometry | 1 — count ≥ threshold |
| `revenue-l` | Revenue — Levy | 7 — line count, rollup count, rollup integrity, no-dupe, amount-due, amount-paid, balance identity |
| `revenue-a` | Revenue — Special Assessment | 7 — same shape as revenue-l |

---

## Verdict taxonomy

| Verdict | Meaning | CSS class |
|---------|---------|-----------|
| `PASS` | Matches sealed benchmark or invariant holds | `pass` (green) |
| `WARN-CHANGED` | Count or amount changed from sealed benchmark — expected after re-drain | `warn` (amber) |
| `WARN-REGRESSED` | Count dropped below sealed threshold — investigate | `warn` (amber) |
| `FAIL` | Structural invariant broken — parity mismatch, rollup gap, balance error, or lane empty | `fail` (red) |

WARN-CHANGED and WARN-REGRESSED are shown as distinct tags so the operator
knows whether a change is expected (re-drain) or a regression.

---

## Benton steady-state

All 22 gates PASS after a clean drain:

```
Parcel Spine    ✓  live-parcel-count       83,326
Assessment      ✓  canonical-row-count     83,326
                ✓  no-duplicate-parcel/year   0 dupe(s)
Jurisdiction    ✓  parcel-tax-area-count   83,326
Exemption       ✓  canonical-row-count     ≥ 5,643
Land            ✓  canonical-row-count     ≥ 87,767
Improvement     ✓  canonical-row-count     ≥ 99,694
Geometry        ✓  canonical-row-count     ≥ 80,075
Revenue-L       ✓  bill-line-count         ≥ 990,665
                ✓  bill-current-count      ≥ 79,767
                ✓  rollup-sum = line-count (equal)
                ✓  no-duplicate-parcel-in-rollup  0
                ✓  amount-due              $308,949,578.44
                ✓  amount-paid             $3,602.19
                ✓  balance-identity        Δ=0.00
Revenue-A       ✓  (same 7 gates — all PASS)
```

After a re-drain, amount-due and amount-paid gates will likely show
`WARN-CHANGED` (expected — values update with new data). This is not a failure.

---

## Visibility rules

| Condition | Lane Seal panel |
|-----------|----------------|
| Page first load | Hidden |
| Doctor running | Hidden |
| Doctor completes, step #2 absent | Hidden |
| Doctor completes, step #2 present | Fires `/api/seal-check/run`; renders ~5–10s later |
| Seal check endpoint 409 (already running) | Silently stays hidden |

---

## Files changed

```
tools/sync/
  seal-runner.mjs                 NEW: thin psql runner for seal-check-runner.sql

tools/sync/workbench/
  server.mjs                      MODIFIED: SEAL_RUNNER path, sealRunning flag,
                                  runSealRunner(), POST /api/seal-check/run

tools/sync/workbench/panel/
  app.js                          MODIFIED: sealCheckEl DOM ref, LANE_META/LANE_ORDER,
                                  parseSealChecks(), sealVcls(), worstSealVerdict(),
                                  renderSealCheck(), fetchAndRenderSealCheck();
                                  updated click handler
  index.html                      MODIFIED: added <section id="seal-check">
  styles.css                      MODIFIED: sc-lane-card, sc-gate-row, sc-invalid-alert,
                                  sc-overall-fail, sc-gate-verdict styles

docs/sync/workbench/
  SLICE_D_LANE_SEAL.md            This file
```

---

## Non-goals (this slice)

- No drain buttons
- No schema or data mutation
- No "fix" actions for FAIL gates
- No per-run history comparison
- No county override tooling

---

## Acceptance criteria

- [ ] After doctor run, Lane Seal panel appears ~5–10s after step cards render
- [ ] Nine lane cards shown, each with verdict badge + gate rows
- [ ] Benton steady-state shows all 22 gates PASS (all cards green)
- [ ] WARN-CHANGED and WARN-REGRESSED shown as distinct amber tags
- [ ] Any FAIL gate triggers "⛔ Seal invalid — do not rely on this lane." in the card
- [ ] Any FAIL gate triggers global "⛔ Seal integrity COMPROMISED" banner at section top
- [ ] Panel hidden on page load, during run, and if step #2 absent
