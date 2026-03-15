# LEV-112 - Levy Calculation Summary Report Format

## Overview

The calculation summary report provides a consolidated view of all levy
computations for a given tax year, organized by taxing district.

## Report Sections

### Header

- County name and code
- Tax year
- Report generation date
- Assessor signature line

### District Summary Table

| Column                | Description                               |
|-----------------------|-------------------------------------------|
| District Code         | Unique district identifier                |
| District Name         | Full legal name                           |
| Assessed Value        | Total taxable AV in the district          |
| Requested Levy        | Amount requested by the district          |
| HLL Amount            | Highest lawful levy calculation           |
| Certified Levy        | Final certified amount                    |
| Certified Rate        | Levy / AV x 1,000                        |
| Statutory Limit Rate  | Maximum rate allowed by statute           |
| Variance              | Difference between requested and certified|

### Aggregate Section

- Total county-wide assessed value
- Total levy amount across all districts
- Weighted average rate
- Constitutional 1% compliance check result

## Output Formats

- PDF (for official record and DOR submission)
- XLSX (for internal analysis)
- CSV (for data integration)

## Usage

Generated via `GET /api/levy/reports/calc-summary?year={year}`.
