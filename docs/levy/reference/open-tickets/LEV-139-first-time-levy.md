# LEV-139 — First-Time / Newly-Formed District Levy

**Status:** OPEN | **Blocking:** T-3c

## Problem
RCW 84.55.015: new junior districts have no prior-year levy base. The HLL
formula in LEV-110 assumes Row 1 (prior year certified levy) exists. For a
first-time levy, the base is established differently — typically the lesser
of the district's requested rate or the statutory maximum for its type.

## Out of scope until Specialist input
- Whether Benton has any districts in their first three levy years (needed
  for the substantial-need clause that applies to new districts)

## Open questions for Specialist
1. When was the last newly-formed Benton taxing district? What was its
   first-year HLL derivation?
2. Does Benton currently carry any "seed HLL" entries for annexation-created
   districts?

## Deliverable shape (sketch)
- HLL compute service branches on `district.formation_year >= year - 1`
- First-year base = `requested_rate × AV` clamped to statutory maximum per
  district type (fire, library, hospital, etc.)
- Second-year onward uses standard LEV-110 flow

## References
- RCW 84.55.015
- Statutory district-type rate maximums (various RCW 52.16 fire, 27.12 library, 70.44 hospital, etc.)
