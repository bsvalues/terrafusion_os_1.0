# LEV-142 - CSV Bulk Import

## Purpose

Documents the CSV bulk import capability for loading levy data from
spreadsheet exports. Covers supported formats, column mapping, and
error handling.

## Supported CSV Layouts

### Levy Rates CSV

```
district_id,tax_year,regular_rate,excess_rate,description
```

### Properties CSV

```
parcel_number,tax_code_area,assessed_land,assessed_improvement,exemption_amount
```

### Tax Codes CSV

```
tax_code,district_id,levy_type,effective_date
```

## Import Rules

1. First row must be a header row matching the expected column names.
2. Encoding must be UTF-8 (BOM optional).
3. Delimiter is comma; fields containing commas must be double-quoted.
4. Maximum file size: 50 MB.
5. Blank rows are skipped silently.

## Error Handling

| Error Type           | Behavior                              |
|----------------------|---------------------------------------|
| Missing column       | Reject entire file with error message |
| Invalid data type    | Skip row, log to error report         |
| Duplicate key        | Upsert (update existing record)       |
| Rate out of range    | Flag for review, do not auto-certify  |

## API Endpoint

```
POST /api/levy/import/csv
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

Response includes row counts for inserted, updated, skipped, and errored.
