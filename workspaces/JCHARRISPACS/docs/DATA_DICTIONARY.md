# Data Dictionary – Usage

This repo can export a column-level data dictionary from extended properties and schema metadata, plus a highlight view for cryptic/critical fields.

## Generate

```powershell
pwsh ./Make.ps1 data-dictionary
```

Artifacts are written to `_artifacts/data_dictionary/`:

- `data_dictionary.csv` – full export (schema, table, column, type, nullability, default, extended property name/value).
- `highlights.md` – filtered view of columns matching patterns (vit, year, recalc, flag).

## Notes

- Extended properties are optional; when missing, rows still include schema/type info.
- For comprehensive documentation, consider populating `MS_Description` on key columns and tables.
