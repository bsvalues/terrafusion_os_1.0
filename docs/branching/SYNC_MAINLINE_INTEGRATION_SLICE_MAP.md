# TerraFusion Sync — Mainline Integration Slice Map

**Date**: 2026-06-09  
**Integration branch**: `integration/sync-onto-main`  
**Source**: `fix/projector-delete-insert-atomicity`  

---

## Summary

| direction | files |
|---|---|
| Added on sync branch (new, no conflict) | 1,447 |
| Modified on sync branch (conflict zone) | 368 |
| Deleted on sync branch | 60 |
| Main-only files (runtime artifacts, screenshots) | 60 |

The 60 main-only files are runtime evidence artifacts (`generated/truth/`), temp files, and screenshots — not source code. No migration files are exclusive to main.

The 1,447 Added files are the Sync stack. They can be ported via `git checkout fix/projector-delete-insert-atomicity -- <path>` with no conflicts.

The 368 Modified files are shared source. Only 5-6 of them need manual merge for Sync functionality. The rest stay at main's version.

---

## Slice A — Sync Docs / Evidence / Readiness

**Method**: `git checkout fix/projector-delete-insert-atomicity -- docs/sync/`  
**Conflict risk**: LOW — all new files  
**Preserve**: main's version of docs/sync/ if any exist (none do)

| path | exists on main | conflict |
|---|---|---|
| docs/sync/TERRAFUSION_SYNC_PRODUCTION_READINESS_PACKET.md | NO | NONE |
| docs/sync/SYNC_BRANCH_MERGE_READINESS.md | NO | NONE |
| docs/sync/TERRAFUSION_SYNC_AUTOMATION_BACKLOG.md | NO | NONE |
| docs/sync/TERRAFUSION_SYNC_PRODUCT_DOCTRINE.md | NO | NONE |
| docs/sync/seals/** | NO | NONE |
| docs/sync/workbench/** | NO | NONE |
| docs/sync/source-packs/** | NO | NONE |
| docs/sync/automation/** | NO | NONE |
| docs/sync/benton-*.md | NO | NONE |
| docs/sync/sync-complete-*.md | NO | NONE |
| docs/sync/*-findings.md | NO | NONE |

---

## Slice B — Brain/Cortex Sync Lessons

**Method**: `git checkout fix/projector-delete-insert-atomicity -- docs/brain/sync/`  
**Conflict risk**: ZERO — new directory

| path | exists on main | conflict |
|---|---|---|
| docs/brain/sync/README.md | NO | NONE |
| docs/brain/sync/lessons/SYNC-LESSON-BENTON-ACTIVE-SUPPLEMENT.md | NO | NONE |
| docs/brain/sync/lessons/SYNC-LESSON-BENTON-F1-LIVE-SPINE.md | NO | NONE |
| docs/brain/sync/lessons/SYNC-LESSON-BENTON-F2-PARCEL-DEBRIS.md | NO | NONE |
| docs/brain/sync/lessons/SYNC-LESSON-BENTON-REVENUE-A-LANDING-GAP.md | NO | NONE |
| docs/brain/sync/lessons/SYNC-LESSON-BENTON-REVENUE-A-WORKINGYEAR.md | NO | NONE |

---

## Slice C — tools/sync Automation

**Method**: `git checkout fix/projector-delete-insert-atomicity -- tools/sync/`  
**Conflict risk**: LOW for new files; MEDIUM for tf-sync-doctor.mjs and identity-runner.mjs (Modified)  

| path | exists on main | conflict | notes |
|---|---|---|---|
| tools/sync/tf-sync-doctor.mjs | YES (M) | MEDIUM | Sync branch: KNOWN_DRIFT_DEFERRED cleared. Use sync version. |
| tools/sync/identity-runner.mjs | YES (M) | MEDIUM | Sync branch: timeout 90s → 300s. Use sync version. |
| tools/sync/harris-pacs-pack-validator.sql | NO | NONE | |
| tools/sync/identity-drift-detector.sql | NO | NONE | |
| tools/sync/seal-check-runner.sql | NO | NONE | |
| tools/sync/domain-coverage-audit.sql | NO | NONE | |
| tools/sync/pack-validator-runner.mjs | NO | NONE | |
| tools/sync/seal-runner.mjs | NO | NONE | |
| tools/sync/run-*.mjs | NO | NONE | |
| tools/sync/f2-parcel-debris-*.sql | NO | NONE | |
| tools/sync/workbench/** | NO | NONE | |

---

## Slice D — Branching Docs

**Method**: Selective checkout (NOT full directory — preserve SYNC_MAINLINE_INTEGRATION_SESSION.md)  
**Conflict risk**: ZERO

| path | action |
|---|---|
| docs/branching/SOLO_DEV_BRANCH_AUTHORITY_REVIEW.md | checkout from sync |
| docs/branching/SYNC_BRANCH_PROMOTION_PLAN.md | checkout from sync |
| docs/branching/SYNC_MAINLINE_INTEGRATION_SESSION.md | already on integration branch — preserve |

---

## Slice E — Backend DB Foundation

**Method**: selective checkout for new files; manual merge for DbContext and ModelSnapshot  
**Conflict risk**: HIGH for ModelSnapshot.cs; MEDIUM for TerraFusionDbContext.cs

### New entities (no conflict):
| path | method |
|---|---|
| backend/src/TerraFusion.Core/Entities/SyncBridge/DryRunLog.cs | checkout from sync |
| backend/src/TerraFusion.Core/Entities/SyncBridge/QuarantineReasons.cs | checkout from sync |
| backend/src/TerraFusion.Core/Entities/SyncBridge/QuarantineReviewDecision.cs | checkout from sync |
| backend/src/TerraFusion.Data/Migrations/20260609*.cs (3 migrations) | checkout from sync |
| backend/src/TerraFusion.Data/Migrations/20260609*.Designer.cs (3) | checkout from sync |

Plus all other sync-only migrations (2026-05-03 through 2026-06-08).

### Conflict files (manual merge):
| path | strategy |
|---|---|
| backend/src/TerraFusion.Data/TerraFusionDbContext.cs | Use sync branch version (superset — adds Sync DbSets without removing main's) |
| backend/src/TerraFusion.Data/Migrations/TerraFusionDbContextModelSnapshot.cs | Use sync branch version (superset — includes all sync migrations) |

### Rationale for using sync branch versions:
The sync branch has MORE migrations (55 additional) and MORE DbSets than main. Main's ModelSnapshot stops at the divergence point. Using the sync branch's ModelSnapshot and DbContext preserves everything main had plus adds the Sync tables. This is safe because main has NO additional migrations that the sync branch doesn't have.

---

## Slice F — Backend Sync APIs/Services

**Method**: `git checkout fix/projector-delete-insert-atomicity -- <specific paths>`  
**Conflict risk**: LOW — all new files

| path | exists on main | conflict |
|---|---|---|
| backend/src/TerraFusion.API/Services/Workbench/DoctorRunnerService.cs | NO | NONE |
| backend/src/TerraFusion.API/Services/Workbench/IdentityRunnerService.cs | NO | NONE |
| backend/src/TerraFusion.API/Services/Workbench/PackValidatorRunnerService.cs | NO | NONE |
| backend/src/TerraFusion.API/Services/Workbench/SystemProcessRunner.cs | NO | NONE |
| backend/src/TerraFusion.API/Controllers/WorkbenchDoctorController.cs | NO | NONE |
| backend/src/TerraFusion.API/Controllers/WorkbenchDryRunController.cs | NO | NONE |
| backend/src/TerraFusion.API/Controllers/WorkbenchIdentitySpineController.cs | NO | NONE |
| backend/src/TerraFusion.API/Controllers/WorkbenchQuarantineReviewController.cs | NO | NONE |
| backend/src/TerraFusion.API/Controllers/WorkbenchSourcePackController.cs | NO | NONE |
| backend/src/TerraFusion.API/Controllers/WorkbenchFController.cs | NO | NONE |
| backend/src/TerraFusion.API/Controllers/WorkbenchGController.cs | NO | NONE |
| backend/src/TerraFusion.API/Controllers/WorkbenchHController.cs | NO | NONE |

### Conflict files (manual merge):
| path | strategy |
|---|---|
| backend/src/TerraFusion.API/Program.cs | Use main version + add Sync DI registrations from sync branch |

---

## Slice G — Local Sync Cockpit

Included in Slice C (`tools/sync/workbench/**`) — no separate slice needed.

---

## Slice H — OS Shell Sync Workbench Frontend

**Method**: `git checkout fix/projector-delete-insert-atomicity -- <sync-specific paths>`  
**Conflict risk**: LOW for new sync-specific files; MEDIUM for Router.tsx

### New Sync-specific files (no conflict):
| path | conflict |
|---|---|
| frontend/apps/os-shell/src/api/sync*.ts (8 files) | NONE |
| frontend/apps/os-shell/src/pages/workbench/sync-doctor/** | NONE |
| frontend/apps/os-shell/src/pages/workbench/sync-quarantine/** | NONE |
| frontend/apps/os-shell/src/pages/workbench/sync-quarantine-review/** | NONE |
| frontend/apps/os-shell/src/pages/workbench/sync-commits/** | NONE |
| frontend/apps/os-shell/src/pages/workbench/sync-corpus/** | NONE |
| frontend/apps/os-shell/src/pages/workbench/sync-doctrine/** | NONE |

### Conflict file (manual merge):
| path | strategy |
|---|---|
| frontend/apps/os-shell/src/Router.tsx | Use main version + add Sync routes from sync branch |

---

## Slice I — Backend Tests

**Method**: `git checkout fix/projector-delete-insert-atomicity -- backend/TerraFusion.API.Tests/Workbench/`  
**Conflict risk**: ZERO — all new files

| path | conflict |
|---|---|
| backend/TerraFusion.API.Tests/Workbench/DoctorRunnerServiceTests.cs | NONE |
| backend/TerraFusion.API.Tests/Workbench/DryRunPreviewServiceTests.cs | NONE |
| backend/TerraFusion.API.Tests/Workbench/IdentityRunnerServiceTests.cs | NONE |
| backend/TerraFusion.API.Tests/Workbench/PackValidatorRunnerServiceTests.cs | NONE |
| backend/TerraFusion.API.Tests/Workbench/QuarantineReviewServiceTests.cs | NONE |

---

## Files NOT Ported (Intentional)

| path | reason |
|---|---|
| All other M (modified) backend controllers | Out of scope — main's version is current; sync branch edits are unrelated |
| All other M frontend components | Out of scope — main's version is current |
| All M CI workflows | Out of scope — main's CI is the authority |
| .gitignore, CLAUDE.md, README.md | Out of scope — main's versions are current |
| backend/TerraFusion.sln | If sync branch only added Sync-related projects, use sync version; otherwise use main |
| generated/truth/** | Runtime artifacts — not source, not needed |

---

## Critical Manual Merges Summary

| file | action | risk |
|---|---|---|
| `Program.cs` | Add Sync DI registrations to main's version | MEDIUM |
| `TerraFusionDbContext.cs` | Use sync branch's superset version | MEDIUM |
| `ModelSnapshot.cs` | Use sync branch's superset version | HIGH |
| `Router.tsx` | Add Sync routes to main's version | MEDIUM |
| `tools/sync/tf-sync-doctor.mjs` | Use sync branch version | LOW |
| `tools/sync/identity-runner.mjs` | Use sync branch version | LOW |

---

*Slice map complete. Proceed to Phase 2: port docs and evidence.*
