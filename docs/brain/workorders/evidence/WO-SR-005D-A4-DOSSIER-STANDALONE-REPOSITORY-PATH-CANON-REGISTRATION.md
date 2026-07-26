# WO-SR-005D-A4 - Dossier Standalone Repository Path Canon Registration Evidence

## Result

`DOSSIER_PATH_CANON_REGISTERED_WITH_UNRATIFIED_F1`

## Live Identity Proof

| Assertion | Verified value |
| --- | --- |
| Local path | `D:\terrafusion-dossier` |
| Git toplevel | `D:/terrafusion-dossier` |
| Repository | `bsvalues/terrafusion-dossier` |
| Visibility | Private |
| Remote | `git@github.com:bsvalues/terrafusion-dossier.git` |
| Default branch | `main` |
| Current branch | `main` |
| HEAD | `ccdc227812264ec52f4ec506de49693ac91d0a9d` |
| origin/main | `ccdc227812264ec52f4ec506de49693ac91d0a9d` |
| Worktree status | Clean |
| Verification date | 2026-07-26 |

The checkout was created from the existing private GitHub repository and inspected without reading
credential values. No file in `D:\terrafusion-dossier` was created, modified, staged, committed, or
pushed after clone.

## Destination Drift Classification

The E2 anchor was Dossier PR #1 at merge
`dcd8a1a3066101597bcc64de1d9bf60ee7f8e9cf`. Live `main` is one commit ahead:

- PR: `bsvalues/terrafusion-dossier#2`
- reviewed head: `2a3b3f9e228b4fad1c20d3a9619d16eb9724aca3`
- merge: `ccdc227812264ec52f4ec506de49693ac91d0a9d`
- title: `WO-SR-005D-F1 Dossier standalone evidence-registry-read foundation`
- changed paths: five
- sovereign owner-decision or F1 authority record found: none

The destination change is recorded as `UNRATIFIED_DESTINATION_MUTATION`. A4 does not decide whether
to retain or revert it and does not infer authority from the merged destination state.

## Canonical Routing Effect

`PATH_CANON_REGISTER.md` now binds repository name, local path, remote, and default branch. The
shared checkout is a read-only synchronization surface. Any future Dossier implementation worker
must use an isolated worktree attached to this canonical repository and must reverify live remote
and head before writing.

This closes the path-canon prerequisite identified by WO-SR-005D-E3. It does not authorize F1,
custody mutation, runtime consumers, persistence, source extraction, publication, deployment,
production, cutover, retention, or reversion of PR #2.

## Scope Proof

The sovereign change is limited to the exact ten-file A4 allowlist:

1. `PATH_CANON_REGISTER.md`
2. `docs/brain/workorders/active/WO-SR-005D-A4-dossier-standalone-repository-path-canon-registration.md`
3. `docs/brain/workorders/evidence/WO-SR-005D-A4-DOSSIER-STANDALONE-REPOSITORY-PATH-CANON-REGISTRATION.md`
4. `docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md`
5. `docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md`
6. `docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md`
7. `docs/brain/workorders/programs/five-suite-federated-repository-buildout.md`
8. `docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md`
9. `docs/brain/workorders/goal-loop/GOAL_COMMANDS.md`
10. `docs/brain/workorders/registry/work-order-registry.seed.json`

## Validation

- live local and GitHub identity inspection: PASS
- Dossier shared checkout clean and read-only: PASS
- E2-to-live destination comparison: PASS; one merged F1-like commit classified
- repository path canon registered: PASS
- Work Order query: PASS; A4 complete, Dossier and GPT F1 blocked, no R2 candidate
- Work Order tooling tests: PASS; query 12/12 and planner 29/29
- exact scope inspection: PASS; ten authorized A4 files only
- frozen bootstrap integrity: PASS; `package.json` and `pnpm-lock.yaml` hashes unchanged
- `git diff --check`: PASS
- runtime/backend/frontend/workflow/destination changes: none

## Next Boundary

No bounded R2 node remains admitted after A4. Dossier PR #2 and GPT PR #3 each require an exact
retain-or-revert disposition before either F1-like destination module can be accepted, changed, or
used as a dependency. Dais F1 also remains separately gated. No runtime, provider, persistence,
publication, deployment, production, or cutover authority exists.
