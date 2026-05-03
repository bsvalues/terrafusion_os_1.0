# LEV-137 — Banked Capacity Ledger

**Status:** OPEN | **Blocking:** T-3b (Banked Capacity)

## Problem
LEV-110 mentions banked capacity in prose but LEV-119 data dictionary has no
`banked_capacity_ledger` table. Banked capacity is a **stateful, district-scoped
ledger that carries forward indefinitely** (RCW 84.55.092). It cannot be a
calc-field recomputed each year — it must be append-only.

## Out of scope until Specialist input
- Benton's current banked-capacity balance per district (this lives in PACS
  or in the Specialist's working files)
- How historical banking decisions were recorded before TerraLevy

## Open questions for Specialist
1. Where is banked capacity currently recorded per district? (PACS table? Excel? Manual memo?)
2. When a district "uses" banked capacity, is that a resolution action requiring
   supermajority, or administrative?
3. Has any Benton district ever lost banked capacity (e.g., RCW 84.55.092
   special purposes)?

## Deliverable shape (sketch)
- Entity: `banked_capacity_ledger`
  - id PK
  - district_id FK
  - tax_year int
  - entry_type enum (ACCRUED, USED, ADJUSTED, FORFEITED)
  - amount decimal(15,2) (positive = accrued, negative = used)
  - running_balance decimal(15,2) (denormalized for query speed)
  - resolution_ref varchar (RCW 84.55.092 tag or administrative note)
  - correlationId, created_at, created_by
- Invariant: sum(amount) per district_id equals running_balance of latest entry
- No UPDATE or DELETE operations — corrections via compensating ADJUSTED entry

## References
- RCW 84.55.092
- LEV-110 § Banked Capacity (amended 2026-04-17)
