# LEV-144 — TCA Annexation Effective-Dating (Mid-Year)

**Status:** OPEN | **Blocking:** T-3d / T-5 | **Priority:** MEDIUM

## Problem
LEV-119 `tax_code_districts` has `effective_year` / `expired_year` — year
granularity only. Benton annexations occur mid-year. A parcel annexed into
a new fire district in June 2026 has partial-year liability, not full-year.

## Out of scope until GIS Lead + Specialist input
- How Benton currently handles mid-year annex parcels (proration? next-year
  snap-forward?)
- Whether PACS carries effective-date granularity beyond year

## Open questions for GIS Lead + Specialist
1. What's Benton's current practice for mid-year annexations?
2. Does PACS hold the annexation effective-date or only the year?
3. Does the Treasurer pro-rate or just snap forward?

## Deliverable shape (sketch)
- `tax_code_districts` gains `effective_date` / `expired_date` (full DATE,
  not year), with triggers to maintain existing `effective_year` columns
  for legacy queries
- Annexation compute uses 365-day proration for HLL new-construction-like
  add-ons (needs statutory confirmation)
- TCA Viewer (LEV-5 surfaces) shows effective-date history, not just current

## References
- LEV-114 (rate spread methodology)
- LEV-119 (data dictionary)
- RCW 35.13 / 35A.14 — Annexation statutes
