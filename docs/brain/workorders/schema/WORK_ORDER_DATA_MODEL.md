# Work Order Data Model

## Purpose

The Work Order data model defines the canonical shape of a governed TerraFusion work order packet.
It supports read-only discovery, docs/operator-truth work, local developer tooling, CI/governance
work, runtime work, and authority-gated production/security work without creating a second Brain.

The schema is a documentation and validation contract only. It does not implement a query engine,
automation runner, PR monitor, branch mutator, or merge authority.

Canonical schema:

```text
docs/brain/workorders/schema/work-order.schema.json
```

## Authority

The model sits under the existing Brain/Cortex work-order lane. It must preserve the current authority
hierarchy:

1. TerraFusion Constitution
2. Brain / Cortex queue, sequencing, risk, proof, review-diff, and commit-plan
3. Domain knowledge packs
4. Directory-local `AGENTS.md`
5. Existing implementation patterns
6. Agent judgment

The model describes work-order state. It does not override any authority source above it.

## Canonical Fields

| Field | Required | Purpose |
| --- | --- | --- |
| `id` | yes | Stable work order identifier, for example `WO-WOE-002`. |
| `title` | yes | Human-readable work order title. |
| `program` | yes | Owning program or lane, for example Work Order Engine, DevOps, LocalOps, Backend, or Workbench. |
| `goal` | yes | Concrete objective of the work order. |
| `goalId` | no | Canonical program-goal identity used for exact mission authority matching. |
| `loopId` | no | Canonical program-loop identity used for exact mission authority matching. |
| `riskClass` | yes | Minimum execution risk for the work order. |
| `status` | yes | Current lifecycle state. |
| `dependencies` | yes | Work orders, evidence, or external states required before execution. |
| `allowedSystems` | yes | Systems or domains the work order may touch. |
| `blockedSystems` | yes | Systems or domains explicitly out of scope. |
| `allowedFiles` | no | Repository-relative file/path globs allowed for writes. |
| `blockedFiles` | no | Repository-relative file/path globs forbidden for writes. |
| `evidenceRequired` | yes | Required proof before completion. |
| `evidenceProduced` | no | Evidence artifacts generated while executing. |
| `validationGates` | yes | Commands/checks required or optional for this WO. |
| `derivedState` | no | Observed Git/GitHub/worktree/check state. |
| `stopConditions` | yes | Conditions that force a stop or owner decision. |
| `blockers` | no | Current blockers and required authority to resolve them. |
| `nextCandidates` | yes | Candidate next work orders and why they follow. |
| `authority` | no | Explicit action permissions granted by the WO. |
| `provenance` | no | Source, timestamps, and schema version. |

## Risk Classes

| Class | Meaning | Examples |
| --- | --- | --- |
| `R0` | Read-only discovery | Inventory, audit, status poll, evidence report. |
| `R1` | Documentation or operator-truth patch | Docs, evidence packets, decision notes, schemas. |
| `R2` | Local developer tooling | Read-only scripts, local bootstrap, dev-only examples. |
| `R3` | CI/governance/tooling | Pipeline gates, hooks, policy config, branch hygiene. |
| `R4` | Runtime/application behavior | Backend, frontend, OS-platform behavior changes. |
| `R5` | Production/security/protected-data authority | Release, deployment, secrets, PACS, county SQL, county data. |

The route-table `risk_floor` is a minimum. A work order can be higher risk than a path's floor, but not
lower.

## Statuses

| Status | Meaning |
| --- | --- |
| `proposed` | Described but not yet authorized for execution. |
| `ready` | Dependencies are satisfied and scope is defined. |
| `in_progress` | Actively being executed. |
| `blocked` | Cannot proceed without blocker resolution. |
| `deferred` | Intentionally postponed. |
| `pr_open` | Branch has an open PR. |
| `review` | PR or human review is active. |
| `merged` | PR merged to main. |
| `complete` | Completion evidence is present. |
| `superseded` | Replaced by another WO or program decision. |
| `cancelled` | Closed without completion. |

## Dependency Model

Dependencies are explicit objects, not prose-only references. Each dependency records:

- `id`: work order, PR, evidence artifact, external state, or human decision
- `status`: `required`, `satisfied`, `blocked`, `deferred`, or `unknown`
- `evidence`: optional links to proof
- `notes`: optional explanation

Dependencies must not be inferred from naming alone. A later query tool may compute unresolved
dependencies from this model, but WO-WOE-002 does not implement that tool.

## Evidence Model

Evidence has two forms:

- `evidenceRequired`: what must exist before the work order can be considered complete
- `evidenceProduced`: what the work order actually produced

Evidence kinds are:

- `command`
- `file`
- `pr`
- `check`
- `review`
- `manual_attestation`
- `external_system`
- `other`

Evidence artifacts should include a location and, when useful, freshness metadata:

- observed timestamp
- commit SHA
- stale-after timestamp

Live GitHub checks, Azure runs, and local command outputs should be treated as evidence, not as
hand-authored truth.

## Validation Gate Model

Validation gates capture commands or checks required by the work order. Each gate records:

- `name`
- `command`
- `required`
- `result`
- `evidence`

Gate results are:

- `not_run`
- `pass`
- `fail`
- `skipped`
- `blocked`
- `unknown`

A skipped gate must explain why. A blocked required gate prevents completion unless the work order
explicitly defines that gate as non-blocking.

## Derived Git and GitHub State

Derived state is observed by tools and should not be maintained manually as primary authority.

The model separates derived state into:

- `git`: branch, head, base, ahead/behind counts, dirty state, changed files
- `github`: PR number, PR URL, state, draft status, merge state, unresolved threads, checks
- `worktree`: path, registered state, clean state, lock state, owner
- `validation`: aggregate validation status and summary

Derived state may become stale. Any automated query tool must refresh it before making a next-work
recommendation.

## Stop-Condition Model

Stop conditions are structured so an operator can distinguish routine work from authority walls.

Stop-condition types are:

- `authority_wall`
- `scope_boundary`
- `state_mismatch`
- `validation_failure`
- `dependency_blocked`
- `protected_data`
- `production_risk`
- `destructive_action`
- `conflicting_canon`
- `unknown`

Examples that require a stop:

- merge authority is absent
- destructive cleanup is required
- runtime behavior is required but the WO is docs-only
- secrets, PACS, county SQL, county data, or protected data appear
- branch protection or auth blocks progress
- canon sources conflict

## Next-Candidate Model

`nextCandidates` records possible next work orders without automatically authorizing them.

Each candidate records:

- `id`
- `reason`
- `riskClass`
- `blocked`
- optional `score`

WO-WOE-004 will define deterministic scoring rules. WO-WOE-002 only defines the shape that scoring can
use later.

## Authority Model

The `authority` object makes explicit which actions are permitted:

- `mayWrite`
- `mayCommit`
- `mayPush`
- `mayOpenPr`
- `mayMarkReady`
- `mayMerge`
- `mayCleanup`

No omitted authority should be inferred as granted. Higher-risk actions still obey the Constitution,
Brain/Cortex governance, domain packs, and directory-local rules.

## Non-Goals

WO-WOE-002 does not:

- implement a query tool
- migrate existing work orders
- modify active work order files
- execute a goal/loop
- query PR state
- mutate branches or worktrees
- add CI behavior
- touch runtime code

## Expected Next Work

WO-WOE-003 should seed a registry of known completed/current work orders using this schema. That work
should remain data-only and should not implement automation.
