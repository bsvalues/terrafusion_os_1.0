# WO-BACKEND-006 - Backend Operational Packet

**Date:** 2026-07-01
**Mode:** Backend operational packet / governance evidence
**Scope:** Documentation and evidence only

## Objective

Package the current Backend Operational Excellence lane into an operator-facing
packet that explains how to reason about backend readiness, what evidence exists,
what validation gates apply, what boundaries remain protected, and what rollback
or recovery path is available.

This packet does not authorize release, deployment, production access, schema
migration, PACS access, county SQL access, protected-data handling, service
connections, Key Vault changes, or CI/branch-protection changes.

## Capability Statement

The backend is now governed by an evidence chain rather than informal claims:

- `WO-BACKEND-001` established backend runtime, build, persistence, health, and
  service-registry reality from source and local validation.
- `WO-BACKEND-002` established a zero-warning backend build posture and repaired
  low-risk test-only nullable warnings.
- `WO-BACKEND-003` records service-registry validation evidence once its PR
  merges.
- `WO-BACKEND-004` records health/readiness endpoint truth once its PR merges.
- `WO-BACKEND-005` defines the backend release gate once its PR merges.
- `WO-BACKEND-006` packages those results into this operator packet.

The packet is intentionally evidence-first. It separates "known and proven" from
"partial" and "not authorized."

## Canon References

| Canon / artifact | Use in this packet |
|------------------|--------------------|
| `AGENTS.md` | Worktree isolation, authority walls, governance surfaces, branch protection. |
| `brain/packs/README.md` | One-Brain doctrine and domain-pack routing. |
| `docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md` | Program map and /goal + /loop model. |
| `docs/brain/workorders/GOAL_LOOP_PLAYBOOK.md` and `docs/brain/workorders/goal-loop/` | Goal/loop/WO/evidence relationship. |
| `docs/brain/workorders/operator/WORK_ORDER_OPERATOR_DOCTRINE.md` | Operator continuation and stop-gate doctrine once merged. |
| `docs/brain/workorders/programs/backend-operational-excellence.md` | Backend operational program register, with historical naming caveats. |
| `docs/brain/workorders/evidence/WO-BACKEND-001-BACKEND-REALITY-AUDIT.md` | Backend reality baseline. |
| `docs/brain/workorders/evidence/WO-BACKEND-002-BUILD-WARNING-BURN-DOWN.md` | Warning baseline and test-only repairs. |

## Naming Reconciliation

The merged backend program register predates the current operator loop and uses
older labels for later backend WOs. The active owner-authorized loop defines:

- `WO-BACKEND-005 - Release Gate Definition`
- `WO-BACKEND-006 - Operational Packet`
- `WO-BACKEND-007 - Evidence Rollup`

This packet follows the active loop without modifying the registry or schema.
Registry/query modernization is a separate Work Order Engine concern.

## Sovereignty Boundary

Allowed in this packet:

- backend operational evidence,
- release/readiness gate documentation,
- validation command truth,
- runbook-style instructions,
- rollback and recovery statements, and
- explicit non-authorization language.

Blocked in this packet:

- runtime behavior changes,
- backend source or test changes,
- schema or EF migration changes,
- CI or branch-protection changes,
- registry or automation changes,
- production deployment,
- service connection or Key Vault changes,
- PACS access,
- county SQL access,
- protected county data access, and
- secret handling.

## Execution Playbook

When operating the backend lane, use this sequence:

1. Confirm the work order ID and allowed file scope.
2. Confirm the worktree is dedicated, clean, and not the shared checkout.
3. Identify whether the work order is docs/evidence, test-only, runtime, schema,
   CI, deployment, or protected-data scope.
4. Run the smallest relevant validation before committing.
5. Record validation command, result, and known limitations in the evidence
   artifact.
6. Commit and open a PR.
7. Let PR checks be the authoritative remote gate.
8. Resolve review comments only inside scope.
9. Batch merge-ready PRs for owner merge authorization.
10. Do not deploy, release, or apply schema migrations without a separate
    authorized work order.

## Validation Gates

| Gate | Required for | Evidence |
|------|--------------|----------|
| Worktree gate | Every backend WO | Dedicated clean worktree and scoped branch. |
| Scope gate | Every backend WO | Changed files match the authorized work order. |
| Diff gate | Every changed file | `git diff --check` passes. |
| Query gate | Work Order evidence/docs | `node docs/brain/workorders/tools/wo-query.mjs --json` runs. |
| Build gate | Backend runtime/test changes | Canonical backend build passes. |
| Warning gate | Backend runtime/test changes | Warning count remains 0 for touched backend build surface. |
| Focused test gate | Changed operational surface | Relevant focused tests pass. |
| PR gate | Every PR | Required GitHub checks pass. |
| Release gate | Release consideration | `WO-BACKEND-005` criteria are satisfied. |

Docs/evidence-only backend WOs do not require broad runtime test execution unless
the work order changes runtime, tests, CI, schema, registry, automation, or
deployment behavior.

## Evidence Requirements

Every backend operational WO should record:

- work order ID,
- branch/worktree,
- changed files,
- validation commands,
- validation results,
- runtime/code/CI/schema/deployment impact,
- secret/county/PACS/SQL status,
- known gaps,
- rollback path, and
- next recommended WO.

## Operational Owner

Backend operational evidence is owned by the Work Order Operator until an
explicit owner is assigned in a future backend program update. Merge authority,
release authority, deployment authority, schema authority, and protected-data
authority remain owner-controlled authority walls.

## Rollback Path

For docs/evidence-only backend WOs:

1. Revert the PR commit.
2. Re-run `git diff --check` on the revert.
3. Re-run `node docs/brain/workorders/tools/wo-query.mjs --json` if the work
   order touched Work Order evidence or docs.
4. Confirm no runtime, CI, schema, deployment, secret, county, PACS, or SQL
   surface changed.

For backend runtime or test WOs:

1. Revert the PR commit.
2. Re-run the focused tests from the original evidence packet.
3. Re-run the relevant backend build/warning gate.
4. Do not apply or roll back schema migrations unless a schema-specific work
   order authorized that path.

## Promotion Criteria

Backend operational evidence may be promoted toward release consideration only
when:

- the release gate exists and is current,
- changed surfaces have focused validation,
- known failures are classified,
- county/PACS/SQL/protected-data status is explicit,
- rollback path is documented,
- PR checks are green, and
- owner merge/release decisions are separate and explicit.

## ADR Impact

No ADR is created by this packet. Future ADR work is required if backend
operational evidence reveals a durable architecture choice, such as a new
canonical health/readiness contract, service registry ownership model, or release
governance model that supersedes existing canon.

## Runbook Impact

This packet is a backend operational runbook seed. It establishes the operator
steps and evidence expectations but does not replace endpoint-specific runbooks
or production incident playbooks.

## Known Limitations

- `docs/brain/workorders/tools/wo-query.mjs --json` currently reports stale WOE
  seed recommendations relative to the active backend loop.
- `WO-BACKEND-003`, `WO-BACKEND-004`, and `WO-BACKEND-005` may still be open PRs
  when this packet is created. Their evidence is referenced as part of the active
  backend loop and becomes authoritative only when merged.
- The backend program register uses older labels for some later WOs. This packet
  follows the current owner-authorized loop and does not modify the register.
- This packet does not prove production readiness.

## Done Definition

This packet is complete when:

- it exists under the Work Order evidence path,
- it links the backend evidence chain,
- it defines execution, validation, rollback, owner, and promotion expectations,
- validation passes, and
- no runtime, CI, schema, registry, automation, deployment, secret, county data,
  PACS, or SQL changes are included.

## Next Recommended WO

Proceed to `WO-BACKEND-007 - Evidence Rollup` after this packet is published.
