# LEV-117 - HLL Panel Calculation Descriptions

## Overview

The HLL (Highest Lawful Levy) panel view presents the step-by-step
calculation for each taxing district in a visual panel format within
the BCBSLevy application.

## Panel Layout

Each district gets one panel containing the following sections:

### Section A - Prior Year Base

| Field                    | Source                          |
|--------------------------|---------------------------------|
| Prior Year Certified Levy| Previous year certification     |
| Limit Factor (%)         | 101% default or banked amount   |
| Base Levy Amount         | Prior x Limit Factor            |

### Section B - Adjustments

| Field                    | Source                          |
|--------------------------|---------------------------------|
| New Construction AV      | Assessor roll                   |
| New Construction Levy    | New AV x Prior Year Rate        |
| Annexed Property Levy    | Annexed AV x Prior Rate         |
| Refund Fund              | Statutory allowance             |

### Section C - Result

| Field                    | Derivation                      |
|--------------------------|---------------------------------|
| Highest Lawful Levy      | Section A + Section B totals    |
| District Request         | From levy request form          |
| Certified Levy           | MIN(HLL, Request)              |
| Certified Rate           | Certified / Total AV x 1000    |

## Visual Indicators

- Green: Certified equals requested (district received full amount).
- Yellow: Certified is less than requested (HLL cap applied).
- Red: Constitutional limit or pro-ration reduced the levy further.

## Navigation

Panels are organized by district type (county, city, fire, school, etc.)
and can be filtered or searched by district name or code.
