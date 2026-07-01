# WO-DATA-BENTON-ADDR-001 — Address / Legal Description Null Audit

**Program:** P2 — Benton Data Quality
**Date:** 2026-07-01
**Mode:** Read-only audit (R0). No mutation, no secrets, no deployment.
**Source:** Live anonymous `GET /api/sync/doctrine/state` + endpoint probes, snapshot `2026-07-01T16:59Z`.
**Authority Boundary:** SW-02 not crossed (read-only). SW-03 not crossed (no credentials used).

---

## Honest Headline

**Address and legal-description null-rates are NOT measurable from the anonymous surface.** This audit
establishes the *boundary* precisely and specifies the exact query that would answer it, rather than
fabricating a number.

## What the anonymous surface shows

| Relevant layer | Table | Rows | Carries address/legal? |
|----------------|-------|------|------------------------|
| Canonical spine | `tf_parcel` | 84,418 | parcel identity; address/legal not exposed anonymously |
| Raw property | `legacy_pacs_raw_property` | 818,836 | PACS property records (situs/legal live here) |
| Raw supp assoc | `legacy_pacs_raw_prop_supp_assoc` | 3,231,679 | supplemental property associations |
| Raw account | `legacy_pacs_raw_account` | 439,948 | account/owner-of-record (mailing address) |

The doctrine/state endpoint returns **row counts only** — no column-level null statistics. Address
(situs), mailing address, and legal description are PACS property/account columns that are not
projected into any anonymously-readable aggregate.

## Boundary probe

- `/api/properties?countyId=benton` → **401**
- `/api/properties/count` → **401**
- `/api/parcels` → **401**

All parcel/property data endpoints that would carry address/legal are **auth-gated**. Confirmed: the
address/legal fields are not reachable without authentication.

## Exact measurement that WOULD answer this (requires authorization)

Column-level null-rate needs credentialed DB read (**SW-03**) or an authenticated properties endpoint.
The query, for a future authorized WO:
```sql
SELECT
  count(*)                                            AS parcels,
  count(*) FILTER (WHERE situs_address IS NULL OR situs_address = '')  AS null_situs,
  count(*) FILTER (WHERE legal_desc   IS NULL OR legal_desc   = '')    AS null_legal
FROM canonical_tf.tf_parcel;   -- exact column names to be confirmed against the canonical schema
```
(Canonical column names for situs/legal are not confirmable from the anonymous surface; the raw
source is `legacy_pacs_raw_property`.)

## Interpretation (bounded)

- The parcel spine is complete (84,418 canonical). Whether each parcel carries a non-null situs and
  legal description is **unknown from here** and must not be asserted.
- The large raw property/supp-assoc/account layers indicate the source columns exist upstream; the
  question is projection completeness into canonical, which is credentialed.

## Recommendation

- Do **not** publish an address/legal completeness number until measured under authorization.
- Promote this to a credentialed follow-up (bundled with the geometry/owner/improvement credentialed
  passes). Non-blocking for the demo; property surfaces must disclose `unavailable` for missing
  address/legal rather than blank-fill.

**WO-DATA-BENTON-ADDR-001: COMPLETE (boundary established; value gap flagged, not fabricated).**
