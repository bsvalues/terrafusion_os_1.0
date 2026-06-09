# TerraFusion Sync — Branch Merge Readiness

**Recorded**: 2026-06-09  
**Branch**: `fix/projector-delete-insert-atomicity`  
**Status**: DEFERRED — main merge is a separate integration mission

---

## Divergence State

| direction | commits |
|---|---|
| branch ahead of main | 433 |
| main ahead of branch | 1,278 |

A direct `--no-ff` merge was attempted and **aborted cleanly** (no data was changed). The merge produced broad conflicts across backend controllers, frontend components, CI workflows, and test files. The conflict surface is too large to resolve safely as a wrap-up step.

---

## Branch Status

`fix/projector-delete-insert-atomicity` is **runtime-proven** and remains the active Sync working surface:

- tf-sync doctor: `OVERALL: WARN` (substrate clean, known deferred items)
- 11-lane Benton substrate sealed
- Identity: 0 dangling rows across all 11 canonical tables
- Revenue-A: 22/22 seal gates / $8,841,075.97
- Workbench v0.3: 4 endpoints proven, 46/46 unit tests pass
- 5 Brain/Cortex lessons seeded
- Production readiness packet: `docs/sync/TERRAFUSION_SYNC_PRODUCTION_READINESS_PACKET.md`

The branch is stable for continued Sync work. Continued development should happen here, not on main.

---

## Why Cherry-Pick Is Not Safe Yet

The final production-readiness commits (`3057891b4`, `1e75e628c`, `e50e9633a`, `a3fcb143b`) depend on earlier branch work that is not yet on main:

- Doctor tooling (`tools/sync/tf-sync-doctor.mjs` and dependencies)
- Source-pack validator (`tools/sync/harris-pacs-pack-validator.sql`)
- Identity runner (`tools/sync/identity-runner.mjs`, `identity-drift-detector.sql`)
- Seal-check runner
- Workbench controller routes and backend services
- EF migration state (20+ Sync-specific tables)
- Docs and evidence paths referenced by the production readiness packet
- Brain/Cortex docs structure (`docs/brain/sync/`)

Cherry-picking the final commits without their prerequisites would produce broken references and orphaned documentation on main.

---

## Recommended Future Merge Strategy

When a dedicated integration mission is opened:

1. **Inventory branch dependencies** — map which commits on the branch are self-contained vs. which depend on earlier branch-only work
2. **Identify minimal PR slices** — group by subsystem (Sync tooling, Workbench backend, EF migrations, Brain/Cortex docs, etc.)
3. **Cherry-pick only after dependency graph is proven** — each slice must be self-sufficient before landing on main
4. **Or rebase in a dedicated integration session** — `git rebase main` on the branch resolves conflicts one commit at a time; this is a focused multi-hour session, not a wrap-up step

This is a separate mission: **TerraFusion Sync Mainline Integration Plan**.

---

## No Code Changes

This document is a record only. No source code, migrations, tests, or tooling were modified in this commit.

---

*Recorded 2026-06-09. Branch remains active Sync surface until integration mission is explicitly opened.*
