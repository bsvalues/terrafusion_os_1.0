# Testing Strategy – PACS Databases and Workflows

This document proposes a pragmatic path to introduce database testing with minimal disruption, focusing on tSQLt for unit tests, smoke validations for living docs, and CI-ready patterns.

## Goals

- Catch regressions in stored procedures, functions, and triggers.
- Provide a fast, local feedback loop for engineers.
- Enable CI to block risky changes using a stable test suite.

## Framework

- Unit Tests: [tSQLt](https://tsqlt.org) framework installed per database under test (start with `PACS_Training`).
- Smoke Checks: Existing `verify_surface.sql` runs in PR pipelines as a gate.

## Install tSQLt (Dev Instance)

1. Download latest tSQLt release (zip) from official site.
2. In SSMS/Azure Data Studio, connect to your dev database (e.g., `PACS_Training`).
3. Enable CLR and install framework scripts as per tSQLt instructions.

## Test Organization

- Create a `tests` schema per database under test.
- Name tests `test_*` and group by module (e.g., `test_property`, `test_permits`).
- Example file: `scripts/sql/tests/sample_tests.sql`.

## Example Test (Sample)

```sql
-- Ensure tSQLt is installed in the target database before running.
EXEC tSQLt.NewTestClass @ClassName = N'test_property';
GO

CREATE PROCEDURE test_property.[test_property_has_situs]
AS
BEGIN
    -- Arrange: pick a known property id (adjust to your dataset)
    DECLARE @pid INT = (SELECT TOP (1) property_id FROM dbo.property ORDER BY property_id);

    -- Act
    DECLARE @has INT = (SELECT COUNT(1) FROM dbo.situs WHERE property_id = @pid);

    -- Assert
    EXEC tSQLt.AssertTrue @has >= 0, N'situs row count should be non-negative';
END;
GO
```

## Running Tests

- Ad-hoc in SSMS/Azure Data Studio:

  ```sql
  EXEC tSQLt.RunAll;
  ```

- Via PowerShell (planned Make target `sql-tests`):

  ```powershell
  pwsh ./Make.ps1 sql-tests
  ```

This will attempt to run `EXEC tSQLt.RunAll;` and print a summary if tSQLt exists; otherwise, it will no-op with a clear message.

## CI Integration (Proposed)

- Pipeline steps:
  - Build SQL projects to DACPACs (existing pipeline).
  - Deploy to ephemeral DB (e.g., PACS_Training_ci_XYZ).
  - Install tSQLt to that DB.
  - Run tests and publish JUnit-style output if available.
  - Run `verify_surface.sql` and `pacs_inventory.ps1` as additional gates.

## Coverage Growth

- Start with top-20 procedures by impact (recalc, property lookups, exports).
- Add at least 2 new tests per change touching SQL.
- Track flaky tests; fix or quarantine promptly.
