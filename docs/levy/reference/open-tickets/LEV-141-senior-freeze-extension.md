# LEV-141 — Senior / Disabled Freeze Extension Slices

**Status:** OPEN | **Blocking:** T-3f

## Problem
RCW 84.36.381 freezes AV for qualified senior/disabled taxpayers. The frozen
AV differs from the current-year AV, so **extension** (the step that turns
a rate into a dollar bill for a parcel) requires two-slice math:
- Slice 1 — frozen AV × rates that existed at freeze year (for qualifying exemptions)
- Slice 2 — current AV × current rates (for the portion above the freeze)

LEV-119 currently has `properties.exemption_amount` as a scalar — insufficient.

## Out of scope until Specialist input
- Number of Benton parcels currently in senior freeze (thousands)
- How Exemptions Clerk captures freeze-year AV

## Open questions for Specialist + Exemptions Clerk
1. Where is freeze-year AV stored per parcel today?
2. Does Benton apply senior-freeze exemption to all levies or only regular
   (not excess / bond)?
3. How are mid-year qualification changes handled?

## Deliverable shape (sketch)
- Entity: `senior_freeze`
  - parcel_number PK, qualification_year, freeze_av_land, freeze_av_improvement
  - qualification_type (senior / disabled), income_tier (RCW 84.36.381 thresholds)
- Extension service computes two slices per qualifying parcel
- Public Estimate (LEV-143) must show senior-freeze-adjusted estimate when
  applicable

## References
- RCW 84.36.381 — Senior/disabled exemption
- RCW 84.36.383 — Income definitions
- LEV-143 (public estimate)
