# LEV-140 — State School Levy (Part 1 + Part 2)

**Status:** OPEN | **Blocking:** T-3e | **Priority:** HIGH (largest single levy in county)

## Problem
Post-EHB 2242 (2017), the state school levy has two parts:
- **Part 1** — Original state school levy
- **Part 2** — New "Local Effort Assistance" levy

Both are **outside the $5.90 aggregate** but **inside the constitutional 1%**.
Both use **DOR-equalized AV** — not local AV — so the base differs from
every other levy the county certifies. This is currently absent from all
LEV-### tickets.

## Out of scope until Specialist input
- How DOR communicates equalization ratios annually
- Benton's historical equalization ratio
- Whether TerraLevy needs to hold the equalization data or consume it from
  Codex's canonical PACS projection

## Open questions for Specialist
1. Do you receive DOR's equalization memo directly, or via PACS feed?
2. Is there a reconciliation step where local AV × ratio must equal
   equalized AV within tolerance?
3. How does Part 2 interact with OSPI M&O levies (LEV-115)?

## Deliverable shape (sketch)
- Entity: `state_school_levy`
  - year PK, part enum (PART_1, PART_2)
  - state_rate, equalization_ratio, local_av, equalized_av, levy_amount
- Compute service: separate path from local HLL, uses equalized AV
- 1% constitutional aggregation must include both parts

## References
- RCW 84.52.053 — State school levy Part 1
- RCW 84.52.065 — State school levy Part 2 (LEA)
- EHB 2242 (2017)
- DOR annual equalization ratio memo
