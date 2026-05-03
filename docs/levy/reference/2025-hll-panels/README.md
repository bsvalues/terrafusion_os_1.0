# LEV-117 - HLL Panel Calculation Descriptions

## Overview

The HLL (Highest Lawful Levy) panel view presents the step-by-step
calculation for each taxing district in a visual panel format within
the BCBSLevy application.

## Panel Layout

Each district gets one panel containing the following sections:

### Section A - Prior Year Base

| Field                    | Source / Formula                                                        |
|--------------------------|-------------------------------------------------------------------------|
| Prior Year Certified Levy| Previous year certification                                             |
| IPD %                    | DOR annual publication (September, prior calendar year)                 |
| Limit Factor             | `min(1.01, 1 + IPD%)` if pop > 10k; else 1.01 (RCW 84.55.005)           |
| Substantial Need Flag    | TRUE if district uses 1.01 with IPD < 1% (RCW 84.55.0101 resolution)    |
| Port/PUD Exempt Flag     | TRUE if RCW 84.55.070 applies — Section A is bypassed                   |
| Base Levy Amount         | Prior × Limit Factor (or Prior × 1.00 if exempt)                        |

### Section B - Adjustments

| Field                    | Source / Formula                                                        |
|--------------------------|-------------------------------------------------------------------------|
| New Construction AV      | Assessor roll (RCW 84.55.010)                                           |
| New Construction Levy    | New AV × Prior Year Rate                                                |
| Annexed Property AV      | Annexation roll, effective-date aware                                   |
| Annexed Property Levy    | Annexed AV × Prior Year Rate                                            |
| Refund Fund Levy         | Court/BOE refund reserve — OUTSIDE 101% cap (RCW 84.69)                 |
| Lid Lift Adjustment      | Voter-approved base increase, if applicable (RCW 84.55.050) — LEV-138   |
| Banked Capacity Applied  | Draw from ledger (RCW 84.55.092) — subject to $5.90 / 1% limits         |

### Section C - Result

| Field                    | Derivation                                                              |
|--------------------------|-------------------------------------------------------------------------|
| Highest Lawful Levy      | Section A base + Section B adjustments (refund fund tracked separately) |
| District Request         | From levy request form / adopted resolution (RCW 84.52.070)             |
| Certified Levy (pre-limit)| MIN(HLL, Request)                                                      |
| $5.90 Aggregate Check    | Per WAC 458-19-075 proration order (LEV-113)                            |
| 1% Constitutional Check  | Per LEV-113                                                             |
| Certified Levy (final)   | After any aggregate/constitutional reduction                            |
| Certified Rate           | Certified / Total AV × 1000                                             |
| Banked Capacity Delta    | HLL − Certified (posted to ledger for future years)                     |

## Visual Indicators

- Green: Certified equals requested (district received full amount).
- Yellow: Certified is less than requested (HLL cap applied).
- Red: Constitutional limit or pro-ration reduced the levy further.

## Navigation

Panels are organized by district type (county, city, fire, school, etc.)
and can be filtered or searched by district name or code.
