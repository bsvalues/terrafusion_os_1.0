# WO-DATA-BENTON-IMPR-LAND-001 — Improvements / Land Endpoint Gap Audit

**Program:** P2 — Benton Data Quality
**Date:** 2026-07-01
**Mode:** Read-only audit (R0). No mutation, no secrets, no deployment.
**Source:** Live anonymous `GET /api/sync/doctrine/state` + `/api/sync/doctrine/lanes`, snapshot `2026-07-01T16:59Z`.
**Authority Boundary:** SW-02 not crossed (read-only). SW-03 not crossed (no credentials used).

---

## Improvement Lane — Layer Counts

| Layer | Table | Rows |
|-------|-------|------|
| Raw | `legacy_pacs_raw_imprv` | 400,576 |
| Raw detail | `legacy_pacs_raw_imprv_detail` | 1,351,892 |
| Raw attr | `legacy_pacs_raw_imprv_attr` | 1,870,609 |
| Truth | `truth_pacs_imprv_current` | 300,432 |
| Canonical | `tf_improvement` | 100,144 |
| Canonical feature | `tf_improvement_feature` | 1,351,892 |
| Quarantine (current) | `legacy_tf_unproven_imprv_current` | 0 |
| Quarantine (attr) | `legacy_tf_unproven_imprv_attr` | 1,872,866 |

## Land Lane — Layer Counts

| Layer | Table | Rows |
|-------|-------|------|
| Raw | `legacy_pacs_raw_land_detail` | 352,131 |
| Truth | `truth_pacs_land_current` | 87,767 |
| Canonical | `tf_land` | 87,767 |
| Quarantine | `legacy_tf_unproven_land_current` | 0 |

## Findings

1. **Improvements canonical = 100,144** across 84,418 parcels → **avg 1.19 improvements per parcel**
   (many parcels have >1 structure; vacant parcels have 0). `canonical-tf-imprv-projector`
   (last `2026-06-22T12:09Z`) extracted and promoted 100,144 (1:1, clean).
2. **Improvement features = 1,351,892** = exactly the raw `imprv_detail` count → **avg ~13.5 features
   per improvement**. Feature layer passes through 1:1 from raw detail.
3. **Improvement bodies are clean** (`imprv_current` quarantine = 0), but the **attribute layer has a
   large 1,872,866-row unproven cohort** (`imprv_attr` quarantine > raw `imprv_attr` 1,870,609 —
   the quarantine exceeds current raw, indicating accumulated unproven attribute rows across loads).
   This is the top improvements data-quality question.
4. **Land canonical = truth = 87,767**, quarantine 0 → **clean 1:1 truth→canonical**. Land segments
   (87,767) exceed parcels (84,418) by **3,349** → some parcels carry multiple land segments (1.04
   segments/parcel avg). Raw land detail 352,131 distills to 87,767 current (24.9%).

## Boundary

- `/api/improvements` → **401**; `/api/land` → **401** (both auth-gated). Rows not exposed anonymously.

## Measurement Gaps (honest limits)

Cannot, from the anonymous surface, compute: % parcels with ≥1 improvement, distribution of
improvements/parcel, or classify the 1,872,866 quarantined improvement-attribute rows. Needs
credentialed read (SW-03) or authenticated endpoints. Flagged, not fabricated.

## Recommendation

- Land lane is **clean** — no action.
- The **1.87M-row improvement-attribute quarantine** is the largest single quarantine cohort in the
  whole demo DB (bigger than the 2.05M total is dominated by it) and is the highest-value credentialed
  follow-up. Non-blocking for the demo; improvement-attribute surfaces must disclose `unavailable`
  for unproven attributes.

**WO-DATA-BENTON-IMPR-LAND-001: COMPLETE (read-only).**
