# LEV-121 - Levy Export Parser

## Overview

The export parser converts internal levy data into various output formats
required by DOR, county treasurers, and other downstream systems.

## Supported Formats

| Format | Extension | Use Case                              |
|--------|-----------|---------------------------------------|
| TXT    | .txt      | DOR legacy fixed-width submission     |
| XLS    | .xls      | County treasurer compatibility        |
| XLSX   | .xlsx     | Modern reporting and analysis         |
| XML    | .xml      | Inter-system data exchange            |
| CSV    | .csv      | General-purpose data export           |

## Parsing Rules

### Column Mapping

The parser maps internal field names to output-specific column headers:

| Internal Field    | TXT Position | XLSX Column | XML Element       |
|-------------------|-------------|-------------|--------------------|
| district_id       | 1-12        | A           | `<DistrictCode>`   |
| tax_year          | 13-16       | B           | `<TaxYear>`        |
| certified_levy    | 17-30       | C           | `<CertifiedLevy>`  |
| certified_rate    | 31-42       | D           | `<CertifiedRate>`  |
| total_av          | 43-58       | E           | `<AssessedValue>`  |

### Numeric Formatting

- Rates: 6 decimal places in data formats, 4 in display reports.
- Dollar amounts: 2 decimal places, no currency symbol in data formats.
- TXT format: right-justified, zero-padded.

### Character Encoding

- TXT: ASCII (7-bit)
- CSV: UTF-8 with BOM
- XLSX/XML: UTF-8

## Validation

Before export, the parser validates:

1. All required fields are non-null.
2. Rates and amounts are within plausible ranges.
3. District codes exist in the master district table.
4. Tax year matches the requested export year.

## Error Handling

Invalid records are excluded from the export and logged to the export
audit table with the reason for exclusion.
