# Workbench Slice G — Readback Set Panel

**Status**: ✅ BUILT 2026-06-08  
**URL**: `http://127.0.0.1:7700` (same server as Slices A–F)  
**Extends**: `SLICE_F_EVIDENCE_BROWSER.md`  
**Source docs**:
  - `docs/sync/seals/benton-current-year-production-readback-checklist.md`
  - `docs/sync/seals/benton-current-year-production-readback-results.md`

---

## Purpose

The Readback Set panel answers:

> **Which specific parcels were accepted, and what did each one prove?**

It makes the six Benton acceptance parcels and their post-F1 surface results
visible inside the cockpit without requiring the operator to open the readback
results document. Renders on page load — no doctor run required.

Read-only. Static catalog. No live queries. No mutation.

---

## Six acceptance parcels

| prop_id | Profile | What it exercises |
|--------:|---------|-------------------|
| **321209** | Normal residential | Assessment sup=0, no exemption, no special-assessment — the plain path |
| **10009** | With exemption | `tf_exemption` + dict-backed type / pct; financials all-zero (fully exempt) |
| **87621** | Non-zero active supplement | Active-supplement resolution; all three physical surfaces truth-absent |
| **23199** | With special-assessment bill | 6 agencies — `tf_assessment_bill_line` + `tf_assessment_agency` |
| **10881** | Paid amount > 0 | Due / paid / balance rollup + net-paid attestation (Stage 3B) |
| **56444** | Complex district set | 8 districts — jurisdiction breadth + levy bill fan-out |

---

## Surface matrix (post-F1 repair, 2026-06-08)

| parcel | own | assmt | land | improv | geom | exmpt | txarea | levy | A-bill | due / paid / bal |
|-------:|:---:|:-----:|:----:|:------:|:----:|:-----:|:------:|:----:|:------:|:----------------:|
| 321209 | 2   | 1     | 0 ¹  | 1      | 0 ¹  | 0 ✓   | 1      | 11   | 0 ✓    | 1309.58 / 0 / 1309.58 |
| 10009  | 9   | 1     | 1    | 0 ✓    | 1    | 1     | 1      | 12   | 0 ✓    | 0 / 0 / 0 |
| 87621  | 9   | 1     | 0 ¹  | 0 ¹    | 0 ¹  | 0 ✓   | 1      | 15   | 0 ✓    | 4260.25 / 0 / 4260.25 |
| 23199  | 9   | 1     | 1    | 0 ✓    | 1    | 0 ✓   | 1      | 14   | 6      | 606.77 / 0 / 606.77 |
| 10881  | 9   | 1     | 1    | 3      | 1    | 0 ✓   | 1      | 11   | 3      | 1841.02 / **1132.26** / 708.76 |
| 56444  | 9   | 1     | 1    | 1      | 1    | 0 ✓   | 1      | 15   | 4      | 3453.38 / 0 / 3453.38 |

¹ = truth-verified absent: canonical truth has no segment for this parcel in Harris PACS — not a defect.  
✓ = correct expected absence for the profile.

**All six verdict: PASS** — data-seal + cross-lane join layer, post-F1 repair.

---

## Hard boundary

**County Studio UI pixel layer NOT exercised.** The frontend (`:3000`) was not
running during readback. Surface counts are from canonical data-seal +
cross-lane join queries only. The UI render + API projection layer remains the
remaining human acceptance step, now enabled by the F1 repair.

The panel makes this explicit with an amber notice at the top.

---

## Truth-valid zero surfaces

Two categories of zero counts are displayed with distinct markers:

| Marker | Meaning |
|--------|---------|
| `0 ¹` | Truth-verified absent — PACS has no segment for this parcel; the zero is correct |
| `0 ✓` | Correct expected absence — e.g. no exemption on a non-exempt parcel, no A-bill on a levy-only parcel |

Neither is a failure. Both are correct states. The panel explains them so the
operator does not mistake a correct zero for a missing surface.

---

## Forbidden claims (shown in panel)

- Receipt-level payment history or tender detail
- Void / refund / reversal workflow
- Penalty / interest / bond paid breakdown
- Delinquency status or certification
- Fund / distribution accounting
- Prior-year revenue history (current-year 2025 only)
- County Studio UI pixel layer acceptance (UI not exercised — human step)
- F2 — tf_parcel identity inflation diagnosis or repair

---

## Visibility

Always visible on page load. No doctor run required.

---

## Files changed

```
tools/sync/workbench/panel/
  app.js        MODIFIED: readbackSetEl DOM ref, READBACK_SET catalog,
                RB_SURFACE_META, renderReadbackSet(), page-load call,
                header comment updated
  index.html    MODIFIED: added <section id="readback-set"> (no hidden class)
  styles.css    MODIFIED: rb-* styles (card grid, surface cells, financials,
                verdict, footnote, forbidden list)

docs/sync/workbench/
  SLICE_G_READBACK_SET.md    This file
```

---

## Non-goals (this slice)

- No live queries against canonical DB
- No drain or mutation buttons
- No per-row detail / drill-down
- No F2 repair or investigation
- No County Studio UI acceptance claim
- No multi-county or historical comparison
