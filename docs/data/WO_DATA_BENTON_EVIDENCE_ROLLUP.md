# WO-DATA-BENTON-EVIDENCE-ROLLUP — Benton Data Truth Packet

**Program:** P2 — Benton Data Quality
**Date:** 2026-07-01
**Mode:** Read-only synthesis (R1). No mutation, no secrets, no deployment. Rolls up the merged
data-quality audits into one truth packet for demo / prototype / release decisions.
**Depends on:** WO-DATA-BENTON-DUPE-001, ADDR-001, GEOM-001, OWNER-001, IMPR-LAND-001 (all merged).
**Authority Boundary:** SW-02/SW-03 not crossed. This packet decides nothing that mutates data.

---

## 0. Bottom Line

The Benton canonical corpus is **demo-ready for parcel + sales + owner + improvement/land counts**,
with **honest, quantified gaps** in geometry (6.2%), a **known 30-row parcel duplicate cohort**, and
**address/legal completeness that is not measurable from the public surface**. No fabricated numbers;
every figure below traces to the live anonymous `/api/sync/doctrine/state` surface or a merged audit.

---

## 1. Canonical Truth (live, anonymous — `/api/sync/doctrine/state`, 2026-07-01)

| Table | Rows | Note |
|-------|------|------|
| `tf_parcel` | **84,418** | = 84,388 distinct active + **30 anomalous** (DUPE-001) |
| `tf_sale` | 90,386 | — |
| `tf_owner` | 97,062 | current owners (distilled from 8.57M raw, 12.5%) |
| `tf_parcel_owner_link` | 686,851 | ownership history (~8.1 links/parcel) |
| `tf_assessment_wsdor` | 686,820 | — |
| `tf_improvement` | 100,144 | ~1.19 per parcel |
| `tf_improvement_feature` | 1,351,892 | ~13.5 per improvement |
| `tf_land` | 87,767 | truth = canonical, clean (multi-segment) |
| `tf_parcel_geom` | 79,199 | **93.82% coverage** |
| canonical rows total | 3,264,539 | operational = true; counties bound = 1 |
| quarantine rows total | 2,053,173 | preserved, not deleted |

---

## 2. Per-Dimension Verdict

| Dimension | Verdict | Evidence WO |
|-----------|---------|-------------|
| **Parcels** | Demo-ready. 84,388 distinct; 30-row duplicate cohort known + isolated. | DUPE-001 |
| **Sales** | Demo-ready. 90,386 canonical; 4,489 sale quarantine. | (state) |
| **Owners** | Demo-ready for current owners (97,062). **87,909 unproven owner-current** in quarantine = top owner question. | OWNER-001 |
| **Improvements** | Demo-ready (100,144 + 1.35M features). Bodies clean; **1,872,866 improvement-attribute rows quarantined** = largest cohort in the DB. | IMPR-LAND-001 |
| **Land** | Clean. 87,767 truth = canonical, quarantine 0. | IMPR-LAND-001 |
| **Geometry** | Demo-ready with disclosure. **93.82% coverage; 5,219 parcels (6.18%) lack canonical geometry** (ArcGIS-sourced). Atlas must show `unavailable` for the gap. | GEOM-001 |
| **Address / legal** | **Not measurable** from the public surface (all property endpoints 401). Needs credentialed read. Do NOT publish a completeness number. | ADDR-001 |

---

## 3. Gaps → Required Action → Wall

| Gap | Action to close | Wall |
|-----|-----------------|------|
| 30 anomalous parcel rows (`tf_parcel` 84,418 vs 84,388) | DELETE/MERGE the 30 rows (WO-DUPE-001B) | **SW-02** (data mutation) |
| 87,909 unproven owner-current + 1,872,866 improvement-attr quarantine | Credentialed classification of *why* they failed truth-gate | **SW-03** (credentialed DB read) |
| Address / legal null-rate unknown | Credentialed query on `canonical_tf.tf_parcel` situs/legal, or an authenticated `/api/properties` | **SW-03** / SW-10 |
| 6.18% parcels without geometry | Upstream ArcGIS parcel-layer completion; Atlas discloses `unavailable` meanwhile | (data source; non-blocking) |

**None of these block a demo** that discloses honestly. All are parked walls.

---

## 4. Release / Prototype / Demo Guidance

- **Demo:** SAFE to show parcel/sales/owner/improvement/land counts and the Sync Doctrine Console
  (which already discloses the provenance layers). Show geometry as 93.82% with `unavailable` for the
  rest. Do NOT present address/legal completeness (unmeasured) or agent/AI counts.
- **Prototype:** the canonical corpus is a sound base. The two quarantine cohorts (owner-current,
  improvement-attr) are the highest-value credentialed follow-ups before any owner/improvement
  accuracy claim.
- **Release:** blocked on (a) DUPE-001B cleanup (SW-02), (b) credentialed quarantine classification
  + address/legal measurement (SW-03), (c) a decision on geometry-gap disclosure. None are code; all
  need operator authorization.

---

## 5. Honesty Ledger (what this packet does NOT claim)

- Does not claim address/legal completeness (unmeasured — flagged, not faked).
- Does not treat the 2.05M quarantine rows as either "bad data" or "fine" — they are *unproven*,
  preserved, and pending credentialed classification.
- Does not use the stale `89,247` parcel figure (real canonical = 84,418; active = 84,388).
- Every count is from the live anonymous doctrine surface; no stub/simulated data.

---

## 6. Evidence Log

- Merged audits: `WO_DATA_BENTON_{DUPE_001, ADDR_001, GEOM_001, OWNER_001, IMPR_LAND_001}` (PR #1132 + prior)
- Live source: `GET /api/sync/doctrine/state` + `/lanes` on `app-terrafusion-benton-demo.azurewebsites.net`
- Program register: `docs/brain/workorders/programs/benton-data-quality.md`

---

**WO-DATA-BENTON-EVIDENCE-ROLLUP: COMPLETE.** This is the last safe R1 WO in the benton-data-quality
program — the queue is now exhausted. Remaining WOs (DUPE-001B delete, quarantine classification)
are parked at SW-02 / SW-03 and require explicit operator authorization.
