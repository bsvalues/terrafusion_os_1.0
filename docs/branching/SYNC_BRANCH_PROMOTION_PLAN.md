# TerraFusion Sync — Branch Promotion Plan

**Date**: 2026-06-09  
**Status**: PLANNING ONLY — no execution yet  
**Prerequisite**: Read `SOLO_DEV_BRANCH_AUTHORITY_REVIEW.md` first  

---

## Warning: Reset Is Wrong

The original hypothesis — "promote sync branch to main via `git reset --hard`" — is **incorrect**.

**Why**: Main is not old/drifted. It contains 1,278 real commits including 428 sync-scoped commits (the PACS raw → truth → canonical data pipeline) that do NOT exist on the sync branch. A reset would permanently destroy the canonical data landing architecture, county-studio, geoforge, costforge, and all other product work that landed on main after 2026-04-28.

Do not run `git reset --hard fix/projector-delete-insert-atomicity`.

---

## Current State

| item | value |
|---|---|
| Divergence point | `fda772a74` — 2026-04-28 |
| Main HEAD | `e4b3ec0cd` — 2026-05-02 |
| Sync branch HEAD | `e601e53ef` — 2026-06-09 |
| Commits on main not on branch | 1,278 |
| Commits on branch not on main | 434 |

---

## Safety Backups — Create Before Any Integration Work

These must exist before touching either branch:

```bash
git branch backup-main-2026-06-09 main
git branch backup-sync-production-2026-06-09 fix/projector-delete-insert-atomicity
git tag sync-production-ready-2026-06-09 fix/projector-delete-insert-atomicity
git tag main-pre-integration-2026-06-09 main
```

Verify with: `git branch --list backup-*` and `git tag --list *2026-06-09*`

---

## Correct Integration Path

### Goal

Bring the sync branch's unique work (workbench, doctrine, F1/F2, Revenue-A, brain lessons, CompsForge) onto main without losing any of main's 1,278 commits.

### Recommended Approach: Rebase in a Dedicated Session

```bash
# 1. Create safety backups (above)
# 2. Create integration staging branch from main
git checkout -b integration/sync-onto-main main

# 3. Rebase sync branch work onto integration/sync-onto-main
git rebase main fix/projector-delete-insert-atomicity --onto integration/sync-onto-main
# This replays 434 commits onto main's current state
# Conflicts resolved one commit at a time

# 4. Run tests after rebase completes
dotnet test backend/TerraFusion.API.Tests/TerraFusion.API.Tests.csproj
node tools/sync/tf-sync-doctor.mjs

# 5. If clean: fast-forward main
git checkout main
git merge --ff-only integration/sync-onto-main
```

### Scope of Conflicts to Expect

From the aborted merge, these areas will need resolution:
- **Backend controllers** — both sides added controllers; most can be combined with both sides' additions kept
- **Frontend components** — UI work on both sides; requires visual review
- **CI workflows** — add/add conflicts; need to inspect which side's version is current
- **`.gitignore`** — minor, easy to combine
- **`TerraFusion.sln`** — project references; keep all references from both sides

### Conflicts to Resolve in Favor of Sync Branch

These items exist on the sync branch and should win conflicts:
- `tools/sync/identity-runner.mjs` (timeout fix to 300s)
- `tools/sync/tf-sync-doctor.mjs` (KNOWN_DRIFT_DEFERRED cleared)
- All of `docs/brain/sync/` (new, no conflict)
- All of `docs/sync/workbench/` (new, no conflict)
- `docs/sync/TERRAFUSION_SYNC_PRODUCTION_READINESS_PACKET.md` (new, no conflict)
- `docs/sync/SYNC_BRANCH_MERGE_READINESS.md` (new, no conflict)
- `docs/branching/` (new, no conflict)
- Doctrine D1-D4 controller work
- F1/F2 projector fixes
- Revenue-A canonical lane
- Workbench v0.3 backend services and controllers

### Conflicts to Resolve in Favor of Main

- Main's controller additions (county-studio, geoforge, costforge, etc. — keep main's work)
- Main's frontend product work (forge suite, atlas, calibration)
- Main's CI/CD pipeline changes (unless the branch's CI is clearly newer)
- Main's theme/token work
- Main's PACS landing pipeline (Block B/C) — this is main's unique contribution

---

## Work Inventory: What the Sync Branch Uniquely Contributes

This is what must successfully land on main after integration:

### Must land
| area | files | risk |
|---|---|---|
| identity-runner.mjs timeout fix | `tools/sync/identity-runner.mjs` | LOW — line change |
| tf-sync-doctor KNOWN_DRIFT_DEFERRED | `tools/sync/tf-sync-doctor.mjs` | LOW — small change |
| Workbench v0.3 backend (doctor/identity/source-pack/quarantine) | `backend/.../Workbench/` | MEDIUM — depends on service registrations |
| Doctrine D4 (universe classifier, attribute dictionary) | multiple backend files | HIGH — depends on EF migration state |
| F1 projector FK fix | projector files | MEDIUM — may already be superseded by main's C3 |
| F2 parcel debris cleanup (SQL only) | cleanup SQL + evidence docs | LOW — SQL files, no code deps |
| Revenue-A canonical lane | drain controller + canonical tables | MEDIUM |
| CompsForge defensibility loop | backend + frontend Comps files | MEDIUM |
| Brain lessons + docs | `docs/brain/sync/` | ZERO — new files only |
| Production readiness packet | `docs/sync/` | ZERO — new files only |

### Check before landing
| area | reason |
|---|---|
| F1 projector fix | Main's Block C (C3) improvement landing may have superseded or diverged from the branch's F1 fix — compare both before keeping |
| Doctrine D1-D4 | Main's 428 sync commits include their own doctrine evolution — check for overlap |
| EF migrations | Both sides likely have migrations; must reconcile the migration history before applying |

---

## Timeline

This is a dedicated integration session — not a wrap-up step.

Estimated effort: **1 full focused session** minimum for rebasing + conflict resolution.  
Do not start it as a side task. Open it as: **TerraFusion Sync Mainline Integration Plan**.

---

## What NOT To Do

- `git reset --hard fix/projector-delete-insert-atomicity` — destroys main's 1,278 commits
- `git merge --no-ff` — aborts with hundreds of conflicts, confirmed
- `git cherry-pick a3fcb143b e50e9633a 1e75e628c 3057891b4` — these commits have dependencies on branch-specific services and migrations; cherry-picking tip commits without base would create broken references on main
- Start this session while other work is in flight

---

*Planning document only. No files or branches modified.*
