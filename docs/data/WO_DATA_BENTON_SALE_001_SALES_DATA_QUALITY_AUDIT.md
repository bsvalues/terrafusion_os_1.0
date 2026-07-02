# WO-DATA-BENTON-SALE-001 — Sales Data Quality Audit

**Program:** P2 — Benton Data Quality
**Date:** 2026-07-02
**Mode:** Read-only audit (R0). No mutation, no secrets, no deployment.
**Source:** Live anonymous `GET /api/sync/doctrine/state` + `/api/sync/doctrine/lanes`
(`app-terrafusion-benton-demo.azurewebsites.net`), snapshot 2026-07-02.
**Authority Boundary:** SW-02 not crossed (read-only). SW-03 not crossed (no credentials used).

---

## 0. Why this WO

The original benton-data-quality audits (ADDR/GEOM/OWNER/IMPR-LAND-001, PR #1132) did not cover the
**sales** layer — which is where the demo's known anomalies live (the 30 duplicate rows of
WO-DATA-BENTON-DUPE-001 are parcel-level, but the sale lane carries its own 4,489-row quarantine).
This audit closes that gap from the anonymous truth surface.

---

## 1. Sales Pipeline — layer counts (verified live)

| Layer | Table | Rows |
|-------|-------|------|
| Raw | `legacy_pacs_raw_sale` | 440,274 |
| Truth | `truth_pacs_sale` | 94,875 |
| Canonical | `tf_sale` | 90,386 |
| Quarantine | `legacy_tf_unproven_sale` | 4,489 |

Projector: `canonical-tf-projector` — last completed **2026-06-28T05:38Z**, extracted **94,875**,
promoted **90,386** (fresh; matches current state).

---

## 2. Findings (quantified)

### F1 — Raw → Truth is a heavy, BY-DESIGN filter (not data loss)
Raw **440,274** → Truth **94,875** = **21.5% promoted** (78.5% filtered out). This is the **year-aware
valid-sale doctrine** at work (DOR ratio codes, arms-length / valid-sale predicates per the Benton
method) — the pipeline deliberately narrows the full PACS sale history to sales usable for ratio
studies. **This is expected doctrine, not a defect.** (See `reference_benton_sync_doctrine_corrections`:
`sl_county_ratio_cd='100'` DOR vs `sl_ratio_type_cd='00'` county; year-aware valid-sale.)

### F2 — Truth → Canonical is near-complete, and the drop == the quarantine exactly
Truth **94,875** → Canonical **90,386**. **Truth − Canonical = 4,489 = the quarantine count exactly.**
So the projector promoted 90,386 of 94,875 truth sales and quarantined **precisely** the 4,489 it could
not prove into canonical. The pipeline is internally consistent (no silent drops; every non-promoted
truth sale is accounted for in quarantine).

### F3 — The 4,489-row sale quarantine is the audit's headline question
**4,489 sales (4.7% of the 94,875 truth sales)** reached the truth layer but failed canonical
promotion. These are preserved (not deleted), consistent with the quarantine-not-drop doctrine. **Why**
they failed proof (missing parcel link? invalid year? sentinel date? failed a gate) is **not derivable
from counts alone** — see §3.

### F4 — Sale-level duplicates are NOT visible from counts
The 30 known anomalous rows (WO-DUPE-001) are **parcel-level** (`tf_parcel` 84,418 = 84,388 active +
30). Whether the **sale** layer has its own duplicates (same parcel+date+price appearing twice, as the
June-27 PACS batch double-return did for parcels) **cannot be determined from layer counts** — it needs
a row-level `GROUP BY` (§3). No sale-duplicate claim is made here.

### F5 — Sales : parcels ratio is plausible
Canonical sales **90,386** across **84,418** parcels ≈ **1.07 sales/parcel** (many parcels have a sale
history; some none). Consistent with a valid-sale set spanning multiple years.

---

## 3. Measurement Gaps (honest limits — need credentials, SW-03)

The anonymous surface gives layer counts, not rows. It **cannot** answer:
- **Which** 4,489 sales are quarantined, or **why** (the gate/reason).
- Sale-level **duplicate** rate (`GROUP BY parcel_id, sale_date, sale_price HAVING count(*)>1`).
- **Sentinel/invalid sale dates** (e.g. the 1980 `PropCreateDt` = 2017 ProVal-conversion artifact noted
  in `project_sync_doctrine_4_seal`) in the canonical set.
- Null/zero sale-price rate.

These require a credentialed read of `canonical_tf.tf_sale` / `legacy_tf_unproven_sale` or an
authenticated sales endpoint — **flagged, not fabricated.** Bundle with the owner-current (87,909) and
improvement-attr (1.87M) quarantine classifications already flagged (OWNER-001, IMPR-LAND-001) into one
credentialed follow-up (**WO-DATA-BENTON-QUARANTINE-001, SW-03**).

---

## 4. Recommendation

- Treat **90,386 canonical valid sales** as the demo sales truth; the 78.5% raw→truth filter is
  correct doctrine, not loss.
- The **4,489-row sale quarantine** joins the credentialed-classification backlog (SW-03).
- Non-blocking for the demo; sales surfaces must disclose `unavailable` for any sale that isn't
  canonicalized rather than fall back to raw/unproven rows.

---

## 5. Evidence Log

- `GET /api/sync/doctrine/lanes` → `sale`: canonical 90,386 / truth 94,875 / raw 440,274 / quarantine 4,489
- `GET /api/sync/doctrine/state` → same + `canonical-tf-projector` ext 94,875 / prom 90,386 (2026-06-28)
- Doctrine context: `reference_benton_sync_doctrine_corrections` (year-aware valid-sale, DOR vs county ratio codes)
- Cross-ref: WO-DATA-BENTON-DUPE-001 (parcel-level 30 rows), OWNER-001 / IMPR-LAND-001 (quarantine cohorts)

---

**WO-DATA-BENTON-SALE-001: COMPLETE (read-only).** With ADDR/GEOM/OWNER/IMPR-LAND/SALE-001 done, the
benton-data-quality **read-only (R0) audit queue is exhausted.** Remaining: DUPE-001B delete (SW-02) and
credentialed quarantine classification (SW-03) — both require operator authorization.
