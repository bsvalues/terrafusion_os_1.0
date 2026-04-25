# LEV-110 - HLL Worksheet Format and Calculation Methodology

## Overview

The Highest Lawful Levy (HLL) worksheet determines the maximum levy amount
a taxing district may impose under Washington State law (RCW 84.55).

## Worksheet Structure

| Row | Field                        | Description                                                              |
|-----|------------------------------|--------------------------------------------------------------------------|
| 1   | Prior Year Levy Amount       | Certified levy from the preceding year                                   |
| 2   | Limit Factor                 | `min(1.01, 1 + IPD%)` for districts >10k pop; see §Limit Factor below    |
| 3   | Base Levy                    | Row 1 × Row 2                                                            |
| 4   | New Construction Value       | AV of new construction added to the roll (RCW 84.55.010)                 |
| 5   | New Construction Levy        | Row 4 × prior year rate                                                  |
| 6   | Annexation Levy              | Annexed AV × prior year rate (RCW 84.55.010)                             |
| 7   | Refund Fund Levy             | Court/BOE refund reserve — levied OUTSIDE the 101% cap (RCW 84.69)       |
| 8   | Highest Lawful Levy          | Sum of Rows 3 + 5 + 6 + 7                                                |

## Limit Factor (RCW 84.55.005, WAC 458-19-045)

The literal "1.01" is **not** universally correct. The statutory rule:

- For districts with population **> 10,000** (Benton County, major cities, most
  fire/school districts): `Limit Factor = min(1.01, 1 + IPD%)` where IPD is the
  Implicit Price Deflator published annually by DOR in September for the prior
  calendar year.
- If **IPD < 1%** and the district wants to use 1.01, a **supermajority
  "substantial need" resolution** is required per **RCW 84.55.0101**. Without it,
  the limit factor is capped at `1 + IPD%`.
- For districts ≤ 10,000 population: limit factor is 1.01 (no IPD test).
- **Exempt from the 101% limit entirely:** Port districts and PUDs (RCW 84.55.070).

## Calculation Steps

1. Start with the prior year certified levy (or the prior HLL if higher — see
   §Banked Capacity).
2. Apply the limit factor per the rule above.
3. Add the levy attributable to new construction (Row 5).
4. Add the levy attributable to annexed property (Row 6).
5. Add refund fund allowance (Row 7) — note this is outside the 101% cap.
6. Result is the HLL. Compare to the district's requested amount.
7. The certified levy is the lesser of the HLL and the requested amount
   (unless reduced further by the $5.90 aggregate or 1% constitutional check —
   see LEV-113).

## Banked Capacity (RCW 84.55.092)

Districts that levy less than their HLL may "bank" the unused capacity for
future years. Banked capacity is a **stateful, district-scoped ledger** that
carries forward indefinitely and is separately tracked from the current-year
HLL. When used, it increases the allowable levy above what the limit factor
alone would permit — but the aggregate $5.90 and constitutional 1% limits
still apply.

## Related Concepts (open tickets)

- **Lid lifts** (RCW 84.55.050) — voter-approved permanent or temporary levy
  base increase. See LEV-138 (open).
- **First-time / newly-formed district levy** (RCW 84.55.015). See LEV-139 (open).
- **State school Part 1 + Part 2** (RCW 84.52.053 / 84.52.065, post-EHB 2242).
  Uses DOR-equalized AV; outside $5.90, inside constitutional 1%. See LEV-140 (open).
- **Senior/disabled freeze extension** (RCW 84.36.381). Two-slice extension math;
  frozen AV ≠ current AV. See LEV-141 (open).
- **Public records retention** (RCW 40.14) and PRA response (RCW 42.56) — 6-year
  minimum retention for fiscal records. See LEV-142 (open).

## References

- RCW 84.55.005 — Limit factor definition
- RCW 84.55.010 — Annual levy limit + new construction + annexation
- RCW 84.55.0101 — Substantial need escalation
- RCW 84.55.050 — Lid lifts
- RCW 84.55.070 — Port/PUD exemption
- RCW 84.55.092 — Banked capacity
- RCW 84.69 — Refund fund
- WAC 458-19-045 — Limit factor rule
- WAC 458-19 — DOR administrative rules (general)
