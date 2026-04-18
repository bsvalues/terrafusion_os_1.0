# LEV-136 — IPD Table / Annual DOR Ingestion

**Status:** OPEN | **Blocking:** Limit Factor math (LEV-110 § Limit Factor)

## Problem
RCW 84.55.005 defines Limit Factor as `min(1.01, 1 + IPD%)` for districts
with population > 10,000. DOR publishes the Implicit Price Deflator in
September each year for the prior calendar year. TerraLevy needs a
year-indexed table of IPD values and an annual ingestion mechanism.

## Out of scope until Specialist input
- Exact DOR publication URL / format
- Historical IPD values Benton has used (back to 2007 limit-factor adoption)
- Whether Benton uses DOR's stated IPD verbatim or applies local adjustments

## Open questions for Specialist
1. Where do you currently pull IPD from each September?
2. Are there any years where Benton's substantial-need resolution was required?
3. Do you track IPD per district (some districts ≤10k population) or countywide?

## Deliverable shape (sketch)
- Data dictionary entry: `ipd_annual_rate` table (year PK, ipd_pct, source_note,
  published_date, imported_by, imported_at)
- Admin surface: one-row-per-year view with ability to mark "used substantial
  need" per district per year
- Validation: computing HLL for year Y requires `ipd_annual_rate` row for
  year Y-1 (publication lag)

## References
- RCW 84.55.005
- WAC 458-19-045
- DOR Property Tax Division — annual IPD memo
