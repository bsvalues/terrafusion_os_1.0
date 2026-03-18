# LEV-114 - County Rate Spread Methodology

## Overview

Rate spread is the process of distributing a district's certified levy
amount across all tax code areas (TCAs) that include that district,
resulting in a per-TCA levy rate.

## Why Rate Spread Is Needed

A single taxing district may overlap with multiple TCAs. Each TCA has a
different total assessed value. The levy rate must be uniform across the
district, so the rate is calculated from the district's total AV.

## Calculation

```
district_rate = certified_levy / total_district_av * 1000
```

This rate is then applied to every TCA that contains the district.

## Rate Spread Report

| Column         | Description                                |
|----------------|--------------------------------------------|
| Tax Code Area  | TCA identifier                             |
| District       | Taxing district within the TCA             |
| District Rate  | Uniform rate for the district              |
| TCA AV         | Assessed value of the TCA                  |
| TCA Levy Share | District rate x TCA AV / 1000             |

## Aggregate Rate

The aggregate rate for a TCA is the sum of all district rates within it:

```
tca_aggregate_rate = SUM(district_rate) for all districts in the TCA
```

## Rounding

Rates are carried to 10 decimal places during computation and rounded to
the nearest cent per $1,000 AV on final reports, per DOR guidance.

## Validation

- Sum of TCA levy shares for a district must equal the certified levy
  (within rounding tolerance of +/- $1.00).
- No TCA aggregate rate may exceed the constitutional limit without
  triggering pro-ration.
