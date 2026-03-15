# LEV-067 - Benton County Data Import Process

## Purpose

Describes the workflow for importing levy data from county source systems.
This document covers process steps only -- no actual county data is included.

## Import Sources

| Source System     | Format   | Description                            |
|-------------------|----------|----------------------------------------|
| Harris PACS 9.0   | XML/CSV  | Property and assessment rolls          |
| DOR Levy Cert     | XLSX     | Department of Revenue certification    |
| County GIS        | GeoJSON  | Tax district boundary polygons         |
| Treasurer Export   | TXT      | Tax code area composition              |

## Import Pipeline

1. **Extract** -- Pull source files into `imports/staging/` directory.
2. **Validate** -- Run schema validation against expected column headers.
3. **Transform** -- Map source fields to BCBSLevy canonical schema.
4. **Load** -- Insert/upsert into the levy database tables.
5. **Audit** -- Log import metadata (row counts, timestamps, hash).

## Pre-Import Checklist

- [ ] Source file received and placed in staging directory
- [ ] File hash recorded in import audit log
- [ ] Schema version confirmed compatible
- [ ] Prior year data archived before overwrite
- [ ] County administrator approval obtained

## Post-Import Validation

- Row counts match source file line counts (minus headers).
- Foreign key integrity passes (all district IDs exist).
- Rate totals fall within statutory limits.
- No duplicate parcel numbers within the same tax year.

## Security

All import operations require `levy:admin` role.
Import audit records are retained per FISMA-HIGH requirements.
