# WO-SR-006A-P - Forge Standalone Repository Path Canon Registration Evidence

## Result

`FORGE_PATH_CANON_REGISTERED`

## Live Identity Proof

| Assertion | Verified value |
| --- | --- |
| Local path | `D:\terrafusion-forge` |
| Git toplevel | `D:/terrafusion-forge` |
| Repository | `bsvalues/terrafusion-forge` |
| Visibility | Private |
| Remote | `git@github.com:bsvalues/terrafusion-forge.git` |
| Default branch | `main` |
| Current branch | `main` |
| HEAD | `2430b483f20e07a6ff9a66e493caab0e39db64ef` |
| origin/main | `2430b483f20e07a6ff9a66e493caab0e39db64ef` |
| Worktree status | Clean |
| Verification date | 2026-07-27 |

The checkout was created from the existing private GitHub repository and inspected without reading
credential values. No file in `D:\terrafusion-forge` was created, modified, staged, committed, or
pushed after clone.

## Canonical Routing Effect

`PATH_CANON_REGISTER.md` now binds repository name, local path, remote, and default branch. The
shared checkout is a read-only synchronization surface. Any future Forge implementation worker must
use an isolated worktree attached to this canonical repository and must reverify live remote and
head before writing.

This closes the path-canon prerequisite identified by WO-SR-006-P and PR #1375 review. It does not
authorize artifact transfer, workflow changes, shadow consumption, runtime configuration, source
retirement, publication, deployment, production, or cutover.

## Scope Proof

The sovereign change is limited to the exact ten-file A-P allowlist:

1. `PATH_CANON_REGISTER.md`
2. `docs/brain/workorders/active/WO-SR-006A-P-forge-standalone-repository-path-canon-registration.md`
3. `docs/brain/workorders/evidence/WO-SR-006A-P-FORGE-STANDALONE-REPOSITORY-PATH-CANON-REGISTRATION.md`
4. `docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md`
5. `docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md`
6. `docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md`
7. `docs/brain/workorders/programs/five-suite-federated-repository-buildout.md`
8. `docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md`
9. `docs/brain/workorders/goal-loop/GOAL_COMMANDS.md`
10. `docs/brain/workorders/registry/work-order-registry.seed.json`

## Validation

- live local and GitHub identity inspection: PASS
- Forge shared checkout clean and read-only: PASS
- repository path canon registered: PASS
- Work Order query and tooling tests
- exact ten-file scope inspection
- `git diff --check`
- runtime/backend/frontend/workflow/destination changes: none

## Next Boundary

`WO-SR-006A` is now dependency-cleared but remains blocked R3 implementation. One exact bounded
authority envelope is required for private cross-repository artifact access and the two named CI
workflow changes. Runtime switching, source retirement, publication, deployment, and cutover remain
separately denied.
