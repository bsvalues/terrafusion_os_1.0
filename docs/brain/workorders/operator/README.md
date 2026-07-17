# Work Order Operator Packet


> **WO-MAO-001 audit basis:** `docs/brain/evidence/WO-MAO-000-proof.md`
## Purpose

This packet defines how Codex uses the TerraFusion Work Order Engine as an operator doctrine.

It is a governance and operating guide only. It does not implement automation, mutate GitHub, change
CI, grant production authority, or override the one-Brain model.

Permanent doctrine:

- [`WORK_ORDER_OPERATOR_DOCTRINE.md`](WORK_ORDER_OPERATOR_DOCTRINE.md) promotes the proven operator
  pattern into reusable TerraFusion operating doctrine.
- [`CODEX_OPERATOR_PLAYBOOK.md`](CODEX_OPERATOR_PLAYBOOK.md) defines Codex as the primary Work Order
  operator and the owner as the authority wall, not the courier.
- [`GOAL_LOOP_OPERATOR_CONTRACT.md`](../goal-loop/GOAL_LOOP_OPERATOR_CONTRACT.md) defines the
  `/goal` + `/loop` contract that governs the operator chain.
- [`WORK_ORDER_LIFECYCLE.md`](WORK_ORDER_LIFECYCLE.md) defines the canonical Work Order states,
  result classifier, and stop-type registry.
- [`AUTONOMOUS_CONTINUATION_RULES.md`](AUTONOMOUS_CONTINUATION_RULES.md) defines recorded-authority
  continuation and mandatory stop conditions.
- [`PR_REVIEW_CI_OPERATOR_RULES.md`](PR_REVIEW_CI_OPERATOR_RULES.md) defines PR, review, and CI
  ownership after implementation.
- [`OWNER_DECISION_PACKET_TEMPLATE.md`](OWNER_DECISION_PACKET_TEMPLATE.md) standardizes authority-wall
  requests.
- [`.governance/owner-decisions.json`](../../../../.governance/owner-decisions.json) is the canonical
  machine-readable register for ratified owner grants, expiry, revocation, and exact boundaries.
- [`MERGE_AUTHORITY_MODEL.md`](MERGE_AUTHORITY_MODEL.md) defines merge authorization and post-merge
  verification.

## Operator Role

The Work Order Operator is responsible for:

- reading current repo, worktree, PR, validation, and evidence state;
- classifying the active Work Order risk class;
- executing only inside the Work Order authority boundary;
- committing, opening PRs, and resolving in-scope review comments;
- stopping for merge unless a recorded Mode B or Mode C grant covers the PR;
- continuing to the next authorized Work Order when the chain explicitly permits it;
- stopping at true authority walls.

The operator is not a second Brain and must not create suite-local queues.

## Subagent Patterns

Subagents are execution patterns, not independent governance authorities.

| Pattern | Purpose | Must not do |
| --- | --- | --- |
| Discovery Agent | Inventory current state and evidence. | Mutate files or infer authority. |
| Scope/Evidence Reviewer | Verify file scope, non-changes, and completion evidence. | Expand scope to fix unrelated issues. |
| Implementation Agent | Make the smallest approved edit. | Cross write-lane boundaries. |
| Validation Agent | Run required gates and classify failures. | Weaken tests or bypass gates. |
| Hygiene/Cleanup Agent | Classify cleanup candidates. | Delete without explicit cleanup authority. |
| Stop-Gate Classifier | Decide whether a blocker is routine or an authority wall. | Resolve business/product/security decisions. |

## Autonomous Continuation Rules

The operator may continue automatically when all of these are true:

- the next Work Order is documented in the current chain;
- the next Work Order remains inside the active recorded authority;
- previous validation passed or failures were fixed within scope;
- branch protection is green before merge;
- review comments are resolvable within approved files/systems;
- no protected systems are touched;
- no explicit human gate is reached.

Routine PR creation, green checks, and merge readiness are not stop gates when the chain grants that
authority. Merge is a wall only when the canonical merge model has no active grant covering the PR.

## Stop Rules

The operator must stop when the next action requires:

- runtime or product behavior not authorized by the Work Order;
- CI/governance/tooling changes outside the current Work Order;
- secrets, credentials, PACS, county SQL, county data, release, deployment, or production resources;
- destructive cleanup not explicitly authorized;
- branch protection override, admin merge, or auth repair;
- merge conflict requiring product or governance judgment;
- changing canon, the Constitution, Brain authority, or domain-pack ownership;
- broad migration of existing Work Orders;
- write behavior from a read-only query or evidence tool.

## Merge Readiness Rules

The operator may report merge readiness only when all conditions hold:

- PR is open and not draft;
- branch protection is green;
- `mergeStateStatus` is clean or equivalent;
- unresolved review threads are zero;
- file scope matches the Work Order;
- no protected systems or forbidden paths changed;
- no admin override is required.

The operator must not infer program scope from this packet alone. Merge requires an applicable active
Mode B or Mode C grant under [MERGE_AUTHORITY_MODEL.md](MERGE_AUTHORITY_MODEL.md). The standing Mode B
grant covers delivery mechanics for already-ratified Work Orders; narrower grants may cover one PR,
an explicitly bounded batch, or a bounded PR class. If no grant applies, request owner authority once.
If any readiness condition fails, classify the blocker instead of asking for merge.

## Review Comment Handling

The operator may resolve review comments when the fix:

- touches only approved files;
- preserves the Work Order's risk class;
- does not broaden runtime, CI, deployment, or protected-data behavior;
- adds or updates validation for the reviewed behavior when practical.

Review comments that require a new architecture, product, security, or production decision are authority
walls.

## Evidence Output

Each Work Order or chain report should include:

- Work Orders completed;
- PR numbers and merge commits;
- files changed by Work Order;
- validation commands and results;
- runtime, CI, Docker/Kubernetes, protected-data, and deployment non-change confirmation;
- unresolved blockers or next recommended Work Order.

## Local Tooling Reality

If local hooks require dependency materialization, the operator may allow the repository's normal hooks
to install or use local tooling in the dedicated worktree. That is not a bypass when:

- no tracked package files change;
- the hook is not disabled;
- the resulting worktree has no tracked residue;
- the Work Order scope remains unchanged.

If hook execution requires bypass, destructive cleanup, dependency upgrades, or package policy changes,
the operator must stop unless that authority is explicitly granted.

## Non-Goals

This packet does not:

- implement an autonomous runner;
- create a scheduler;
- add branch protection rules;
- modify CI workflows;
- migrate active Work Orders;
- authorize release, deployment, PACS, county SQL, county data, secrets, or production resources.

## Validation

Expected validation:

```powershell
git diff --check
node docs/brain/workorders/tools/wo-query.mjs --json
```
