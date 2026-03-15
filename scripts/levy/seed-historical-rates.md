# LEV-065 - Historical Rates Seeding

## Purpose

Documents how to populate multi-year historical levy rate data for trend
analysis and compliance testing. All values are fictional examples.

## Data Shape

Each historical rate record contains:

| Field             | Type    | Description                          |
|-------------------|---------|--------------------------------------|
| `district_id`     | string  | FK to tax_districts                  |
| `tax_year`        | int     | Assessment year (e.g., 2020-2025)    |
| `regular_rate`    | decimal | Regular levy rate per $1,000 AV      |
| `excess_rate`     | decimal | Voter-approved excess levy rate      |
| `total_rate`      | decimal | Sum of regular + excess              |
| `assessed_value`  | decimal | Total district assessed value        |

## Year Range

Seed 6 years of history (2020-2025) for each demo district, providing enough
data for trend charts and IPD calculations.

## Steps

1. Generate rate records using the formula:
   `regular_rate = base_rate * (1 + annual_growth)^(year - base_year)`
2. Insert into `levy_rates` with appropriate district foreign keys.
3. Validate that trend queries return monotonic or near-monotonic series.

## Notes

- Growth factors should vary by district type (fire, school, city, etc.).
- Excess levy rates should only appear on select districts / years.
- No real county rate data may be used.
