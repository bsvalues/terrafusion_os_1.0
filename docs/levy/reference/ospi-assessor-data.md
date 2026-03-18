# LEV-115 - OSPI School District Levy Data Format

## Overview

The Office of Superintendent of Public Instruction (OSPI) provides school
district levy data that county assessors use during levy certification.
This document describes the data format and integration points.

## Data Elements

| Field                  | Type    | Description                            |
|------------------------|---------|----------------------------------------|
| `school_district_code` | string  | OSPI district identifier               |
| `district_name`        | string  | Official school district name          |
| `levy_type`            | string  | M_AND_O, BOND, CAPITAL, ENRICHMENT    |
| `authorized_amount`    | decimal | Voter-authorized levy amount           |
| `collection_year`      | int     | Year taxes are collected               |
| `duration_years`       | int     | Number of years authorized             |
| `election_date`        | date    | Date of authorizing election           |

## File Format

OSPI delivers data as XLSX with one worksheet per levy type. Column headers
appear in row 1. Data rows begin at row 2.

## Integration Flow

1. Assessor receives OSPI file after levy elections are certified.
2. File is imported into BCBSLevy via the CSV/XLSX import pipeline.
3. System maps OSPI district codes to internal district IDs.
4. Authorized amounts populate the excess levy fields for each district.
5. Excess levies are excluded from the constitutional 1% aggregate check.

## Validation Rules

- Authorized amounts must not exceed election resolution amounts.
- Levy duration must not extend beyond the authorized period.
- Each district-levy_type combination must be unique per collection year.

## Update Frequency

OSPI data is updated after each general and special election cycle
(typically November and February).
