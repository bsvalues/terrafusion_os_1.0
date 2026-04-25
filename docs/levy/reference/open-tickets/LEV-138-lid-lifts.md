# LEV-138 — Lid Lifts (RCW 84.55.050)

**Status:** OPEN | **Blocking:** T-3c

## Problem
Voter-approved lid lifts restart or elevate the HLL base. There are two kinds:
- **Single-year lid lift** — one-year authorization to exceed limit factor
- **Multi-year lid lift** — up to 6 years, may permanently elevate base

Neither is modeled in the current TerraFusion.Levy code or in LEV-110. Every
Benton district that passed an EMS levy, fire lift, or library lift since 2020
computes wrong without this.

## Out of scope until Specialist input
- Benton's history of passed lid lifts by district
- Which districts currently have active lid-lift authorization
- Election date / effective-year mapping

## Open questions for Specialist
1. Which Benton districts have active lid lifts for 2026?
2. When a multi-year lid lift expires, does the base snap back or stay elevated?
   (Depends on ballot language — need resolution copies.)
3. How is an "EMS levy" (RCW 84.52.069) different from a standard lid lift
   in Benton's workflow?

## Deliverable shape (sketch)
- Entity: `lid_lift`
  - id PK, district_id FK, ballot_measure_id
  - lift_type enum (SINGLE_YEAR, MULTI_YEAR, EMS)
  - first_year, last_year (NULL for permanent base elevation)
  - authorized_rate or authorized_amount
  - base_elevation_permanent bool
  - election_date, resolution_pdf_ref
- HLL panel Section A gains a "Lid Lift Override" row when active

## References
- RCW 84.55.050 — Lid lifts
- RCW 84.52.069 — EMS levy
- LEV-110 § Related Concepts
