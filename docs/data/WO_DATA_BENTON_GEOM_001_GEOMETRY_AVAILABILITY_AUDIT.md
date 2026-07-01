# WO-DATA-BENTON-GEOM-001 — Geometry Availability Audit

**Program:** P2 — Benton Data Quality
**Date:** 2026-07-01
**Mode:** Read-only audit (R0). No mutation, no secrets, no deployment.
**Source:** Live anonymous `GET /api/sync/doctrine/state` + `/api/sync/doctrine/lanes`
(`app-terrafusion-benton-demo.azurewebsites.net`), snapshot `2026-07-01T16:59Z`.
**Authority Boundary:** SW-02 not crossed (read-only). SW-03 not crossed (no credentials used).

---

## Finding (quantified)

| Metric | Value |
|--------|-------|
| Canonical parcels (`tf_parcel`) | 84,418 |
| Canonical parcel geometry (`tf_parcel_geom`) | 79,199 |
| **Parcels WITHOUT canonical geometry** | **5,219 (6.18%)** |
| Geometry coverage | **93.82%** |
| Geometry quarantine | 0 |

## Provenance

Geometry does **not** come from the PACS raw/truth lanes — the `geometry` lane reports
`truthCount: -1, rawCount: -1` (sentinel = not sourced from PACS). It is sourced from the **ArcGIS
feature service** via `arcgis-feature-service` → `canonical-tf-arcgis-projector`, last completed
`2026-06-28T09:57Z`, 79,199 rows extracted and promoted (1:1, no loss).

## Interpretation

- The 6.18% gap (5,219 parcels) is a **real coverage gap**, not a pipeline failure: quarantine is 0
  and the projector promoted everything it extracted. The gap is upstream — the ArcGIS feature
  service returned geometry for 79,199 of 84,418 parcels.
- Likely causes (not verifiable from anonymous surface): parcels created in PACS but not yet in the
  ArcGIS parcel layer, retired/split parcels, or non-spatial account records. Confirming the cause
  requires joining `tf_parcel` to `tf_parcel_geom` (credentialed).

## Boundary

- `/api/geometry` → **401** (auth-gated). Geometry rows are not exposed anonymously; only the
  aggregate count is (via doctrine/state).

## Measurement Gap (honest limit)

Cannot, from the anonymous surface, identify *which* 5,219 parcels lack geometry or *why*. That needs:
```sql
SELECT p.parcel_id FROM canonical_tf.tf_parcel p
LEFT JOIN canonical_tf.tf_parcel_geom g ON g.parcel_id = p.parcel_id
WHERE g.parcel_id IS NULL;
```
→ requires credentialed DB read (SW-03) or an authenticated parcel/geometry endpoint. Flagged, not fabricated.

## Recommendation

Track "geometry coverage = 93.82%" as a demo data-quality KPI. Not blocking for the demo (Atlas/map
surfaces should disclose `unavailable` for the 5,219 without geometry, per the honesty contract).

**WO-DATA-BENTON-GEOM-001: COMPLETE (read-only).**
