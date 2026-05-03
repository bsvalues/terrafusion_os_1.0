# LEV-142 — Retention + Public Records Act

**Status:** OPEN | **Blocking:** T-4 (CalcTrace + attestation) | **Priority:** MUST-HAVE (DPA blocker)

## Problem
TerraTrace retention for fiscal records = 6 years minimum (RCW 40.14).
Public Records Act (RCW 42.56) requires responsive production of any
requested levy calculation artifact within statutory deadlines. Plan mentions
neither in enforceable terms.

## Out of scope until DPA input
- Whether Benton's records schedule differs from the state minimum
- Destruction/disposition procedure for expired records

## Open questions for DPA (Civil) + PRO
1. Is the TerraTrace event stream itself a public record?
2. For a PRA request on a parcel's 2024 bill, what exactly must be produced
   (the calc event? the HLL panel PDF? the filed REV 64-0100?)
3. Are AI-assisted narrative outputs (if any) discoverable under PRA?

## Deliverable shape (sketch)
- TerraTrace store enforces 6-year minimum retention, configurable longer
- Every `levy.certification.computed` event includes county_id, tax_year,
  district_id in indexed fields for PRA lookup
- Admin PRA export surface: given {parcel | district | year | date-range},
  produce all related trace events as a signed zip bundle
- Destruction log: expired records tracked with disposition reason

## References
- RCW 40.14 — Preservation and destruction of public records
- RCW 42.56 — Public Records Act
- WA State Local Government General Records Retention Schedule (LGS)
- LEV-134 (certification documents)
