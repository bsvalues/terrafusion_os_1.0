# TerraFusion Sync — Brain Memory Index

This directory contains runtime-proven lessons from operating TerraFusion Sync against real county data.
Each lesson is a reusable memory unit: a symptom, its proven root cause, the fix, and a prevention rule.

## Lesson Index

| file | county | domain | symptom |
|---|---|---|---|
| [SYNC-LESSON-BENTON-ACTIVE-SUPPLEMENT](lessons/SYNC-LESSON-BENTON-ACTIVE-SUPPLEMENT.md) | Benton WA | multi-lane | Wrong rows if sup_num assumed 0 |
| [SYNC-LESSON-BENTON-F1-LIVE-SPINE](lessons/SYNC-LESSON-BENTON-F1-LIVE-SPINE.md) | Benton WA | parcel-identity | Canonical rows point at dead parcel generation |
| [SYNC-LESSON-BENTON-F2-PARCEL-DEBRIS](lessons/SYNC-LESSON-BENTON-F2-PARCEL-DEBRIS.md) | Benton WA | parcel-identity | 3.1M debris rows from historical promoter bug |
| [SYNC-LESSON-BENTON-REVENUE-A-WORKINGYEAR](lessons/SYNC-LESSON-BENTON-REVENUE-A-WORKINGYEAR.md) | Benton WA | revenue-a | WorkingYear defaulting to wrong year → 0 rows |
| [SYNC-LESSON-BENTON-REVENUE-A-LANDING-GAP](lessons/SYNC-LESSON-BENTON-REVENUE-A-LANDING-GAP.md) | Benton WA | revenue-a | Canonical bill tables empty → seal-check FAIL |

## How to Query

From Obsidian: search `type: sync_lesson` to list all lessons.  
From code review: search `automation_target` for lessons that should be encoded in automation.  
From doctor FAIL: match `symptom` to the failure description to find the root cause and fix.
