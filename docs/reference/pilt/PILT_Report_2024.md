# PILT Report Reference (2024)

This document describes the Payment In Lieu of Taxes (PILT) reporting format used by Washington State counties. It replaces a PDF that was in the source repository. The reference content is preserved as markdown.

## Overview

PILT compensates local governments for non-taxable federal land within their boundaries. Counties submit annual PILT reports to the Department of the Interior detailing eligible acreage, entitlement calculations, and distribution amounts. The report covers the federal fiscal year (October 1 through September 30).

## Data Fields

| Field               | Type     | Description                                       |
|---------------------|----------|---------------------------------------------------|
| CountyFIPS          | string   | Five-digit FIPS code identifying the county       |
| CountyName          | string   | Official county name                              |
| StateFIPS           | string   | Two-digit state FIPS code                         |
| FederalAcreage      | decimal  | Total qualifying federal acres in the county      |
| ProgramCode         | string   | Federal program code (see table below)            |
| EntitlementAmount   | decimal  | Calculated entitlement in USD                     |
| PopulationFactor    | integer  | County population used in per-capita calculation  |
| PriorYearPayment    | decimal  | Previous fiscal year PILT payment in USD          |
| CurrentYearPayment  | decimal  | Current fiscal year PILT payment in USD           |
| PaymentDate         | date     | Date payment was disbursed                        |
| AgencyCode          | string   | Managing federal agency identifier                |

## Report Structure

A PILT report contains three sections:

1. **Header** -- Reporting county, fiscal year, submission date, and preparer contact.
2. **Acreage Detail** -- Line items per federal program, listing qualifying acres, managing agency, and entitlement calculation.
3. **Payment Summary** -- Total entitlement, adjustments, sequestration (if applicable), and net payment.

Counties must reconcile the Payment Summary total against the Treasury disbursement before filing.

## Federal Program Codes

| Code | Program                                              |
|------|------------------------------------------------------|
| BLM  | Bureau of Land Management general holdings           |
| NFS  | National Forest System lands                         |
| NPS  | National Park Service lands                          |
| FWS  | Fish and Wildlife Service refuge lands               |
| BOR  | Bureau of Reclamation withdrawn lands                |
| DOD  | Department of Defense installations                  |
| COE  | Army Corps of Engineers project lands                |
| TVA  | Tennessee Valley Authority (not applicable in WA)    |
| OTH  | Other qualifying federal land                        |

## County Distribution Rules

1. **Section 6902 (standard)** -- Payment equals the greater of (a) 75 cents per qualifying acre or (b) 10 cents per acre of BLM/NFS land, subject to the population cap.
2. **Section 6904 (supplement)** -- Additional payment for counties where Section 6902 amount is below the per-capita floor.
3. **Population cap** -- Per-capita ceiling is applied using the most recent Census or Census estimate.
4. **Sequestration** -- Federal sequestration percentages reduce the gross entitlement before disbursement.
5. **Multi-county parcels** -- When a federal parcel spans county lines, acreage is apportioned by GIS boundary, and each county claims its portion independently.
6. **State pass-through** -- Washington State does not retain a share; the full PILT payment goes to the county general fund.

## References

- 31 U.S.C. 6901-6907 (PILT authorizing statute)
- Department of the Interior PILT program page
- Washington State Department of Revenue guidance on federal land payments
