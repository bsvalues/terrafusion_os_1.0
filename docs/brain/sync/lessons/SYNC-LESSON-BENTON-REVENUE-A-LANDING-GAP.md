---
type: sync_lesson
county: Benton WA
domain: revenue-a
lane: assessment-bill / bill-line
status: proven
symptom: >
  tf-sync doctor step #2 (seal-check runner) shows FAIL for Revenue-A lane gates even though
  the drain appears to have completed. Specifically: tf_assessment_bill_current and
  tf_assessment_bill_line are empty (0 rows) in canonical_tf, so gates like
  "at least one current bill per active parcel" and "amount-due sum > $0" FAIL.
root_cause: >
  Revenue-A landing was never run against the 2025 active bill year. See [[SYNC-LESSON-BENTON-REVENUE-A-WORKINGYEAR]]
  for the root cause (NormalizeRequest defaults WorkingYear to 2026 → 0 rows). The downstream
  effect is that canonical tables are empty, making ALL seal gates for revenue-a FAIL.
  Secondary cause: Revenue-A is a late-added lane — it was not included in the original
  "initial seeding" drain sequence, so empty tables went unnoticed until the doctor ran.
proof: >
  Pre-repair: tf_assessment_bill_current=0 rows, tf_assessment_bill_line=0 rows. Seal gates FAIL.
  Post-repair (WorkingYear=2025): 313,139 bill lines, 79,078 current bill rows, $8,841,075.97.
  22/22 seal gates PASS. Doctor domain-coverage: revenue-a shows SEALED.
  commit: 1e75e628c (evidence doc).
fix: >
  POST /api/sync/doctrine/drain/revenue-a with {"WorkingYear": 2025}.
  Re-run tf-sync doctor to confirm seal-check PASS.
  Seal-check PASS evidence: 22/22 gates, $8,841,075.97 amount-due total, durationMs ~4000.
commit: "1e75e628c (Revenue-A repair evidence)"
prevention_rule: >
  After adding any new PACS lane, immediately run the drain AND the seal-check before
  claiming the lane is operational. An empty table has no visible error — only the seal-check
  exposes it. The doctor checklist order is:
    1. Pack validator (PACS structure)
    2. Identity-drift (canonical FK health)
    3. Seal-check (canonical data completeness)
    4. Domain coverage (lane inventory)
  Do not skip step 3 after a drain.
automation_target: >
  DoctrineDrainController: after drain completes, run a post-drain count check on the
  landing tables and return a warning if count=0 for a year that was expected to have data.
  Also: add Revenue-A to the initial seeding script / operator runbook so it is never
  omitted from new county deployments.
related_files:
  - backend/src/TerraFusion.API/Controllers/DoctrineDrainController.cs
  - tools/sync/tf-sync-doctor.mjs
  - tools/sync/seal-check.mjs
  - docs/sync/workbench/REVENUE_A_ASSESSMENT_BILL_REPAIR_EVIDENCE.md
  - docs/sync/workbench/SYNC_RUNTIME_PRODUCTION_PROOF.md
---

## Revenue-A Lane Scale (Benton 2025)

These numbers are the proven baseline. Future drains should match within normal drift.

| table | row count | notes |
|---|---|---|
| `canonical_tf.tf_assessment_bill_line` | 313,139 | individual bill lines |
| `canonical_tf.tf_assessment_bill_current` | 79,078 | parcel-level rollups |
| amount-due total | $8,841,075.97 | sum across all current bills |
| seal gates | 22/22 PASS | as of 2025 levy year |

## Drain Sequence

```
1. POST /api/sync/doctrine/drain/revenue-a
   Body: {"WorkingYear": 2025}
   
2. POST /api/sync/workbench/doctor/run
   Verify: seal-check section shows 22/22 PASS for revenue-a

3. GET /api/sync/workbench/doctor/status
   Verify: exitCode 0, OVERALL: WARN (not FAIL)
```

WARN is correct steady-state — the doctor shows WARN because some lanes are LANDED_ONLY
or DISCOVERED_DEFERRED. WARN ≠ broken. FAIL = broken.
