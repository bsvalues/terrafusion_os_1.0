---
type: sync_lesson
county: Benton WA
domain: revenue-a
lane: assessment-bill / bill-line
status: proven
symptom: >
  POST /api/sync/doctrine/drain/revenue-a returns HTTP 200, exitCode 0, but zero rows land in
  canonical_tf.tf_assessment_bill_current, tf_assessment_bill_line, tf_assessment_bill_history.
  Doctor domain-coverage audit shows revenue-a lane as LANDED_ONLY or EMPTY_IN_SOURCE.
  No error thrown — the drain silently processes 0 rows.
root_cause: >
  DoctrineDrainController.cs:2178 NormalizeRequest defaults WorkingYear to 2026 when the
  request body is omitted or when WorkingYear is not present. Benton County A-bills (the
  current levy year's active bills) exist for 2025, not 2026. Draining with WorkingYear=2026
  produces a valid SQL result set with 0 rows — PACS simply has no active A-bills for 2026
  yet. The drain succeeds silently with a 0-row batch.
proof: >
  POST /api/sync/doctrine/drain/revenue-a with no body → 0 rows.
  POST /api/sync/doctrine/drain/revenue-a with {"WorkingYear": 2025} → 313,139 bill lines,
  79,078 current bill rows, $8,841,075.97 amount-due, 22/22 seal gates PASS.
  commit: 1e75e628c (evidence doc + KNOWN_DRIFT_DEFERRED cleared).
fix: >
  Always pass {"WorkingYear": 2025} in the POST body when draining Benton Revenue-A.
  General rule: check active working year in PACS before draining year-specific lanes.
  The active year for Benton A-bills is always the current levy cycle year (2025 as of this seal).
commit: "1e75e628c (Revenue-A repair evidence doc)"
prevention_rule: >
  Before draining any year-scoped PACS lane, query:
    SELECT MAX(year) FROM dbo.bill WHERE bill_type='A' AND is_active=1
  This gives the active A-bill year. If the year does not match the NormalizeRequest default,
  pass it explicitly. Add a pre-drain year-resolve call to the Revenue-A controller pipeline.
automation_target: >
  DoctrineDrainController: auto-resolve WorkingYear from MAX(active bill year) if not specified.
  Or: add a pre-drain validator that checks whether the requested WorkingYear has at least
  one active A-bill in PACS before proceeding, and returns 409 + guidance if 0 rows found.
related_files:
  - backend/src/TerraFusion.API/Controllers/DoctrineDrainController.cs
  - docs/sync/workbench/REVENUE_A_ASSESSMENT_BILL_REPAIR_EVIDENCE.md
  - docs/sync/workbench/SYNC_RUNTIME_PRODUCTION_PROOF.md
---

## NormalizeRequest Trap Detail

`DoctrineDrainController.NormalizeRequest()` sets a default `WorkingYear` when the field is missing:

```csharp
// DoctrineDrainController.cs ~line 2178
if (request.WorkingYear == 0)
    request.WorkingYear = DateTime.UtcNow.Year;  // → 2026
```

This is a silent year-inference bug. 2026 is technically valid SQL — it just returns 0 PACS rows.

### Correct POST body

```json
POST /api/sync/doctrine/drain/revenue-a
Content-Type: application/json

{
  "WorkingYear": 2025
}
```

### How to find the active year without guessing

```sql
-- Run against Harris PACS (tf-mssql connection):
SELECT MAX(year) AS active_bill_year
FROM dbo.bill
WHERE bill_type = 'A' AND is_active = 1;
-- Benton: returns 2025 as of seal date 2026-06-09
```
