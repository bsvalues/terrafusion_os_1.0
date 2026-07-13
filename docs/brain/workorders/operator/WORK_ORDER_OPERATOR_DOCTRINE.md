# Work Order Operator Doctrine

## Purpose

This doctrine promotes the proven TerraFusion Work Order Operator pattern into reusable operating
practice. It is governance documentation only. It does not implement automation, change schemas,
modify CI, grant production authority, or create a second Brain.

The pattern exists to let Codex operate the Work Order Engine with evidence, risk classification,
scope discipline, and explicit stop gates instead of using the owner as a routine message relay.

## Authority Position

The Work Order Operator is an execution role under
[`ADR-EXEC-001`](../../../adr/ADR-EXEC-001-governance-authority-hierarchy.md). The operator follows
the Constitution, canonical Brain rules, and recorded owner authority before applying operator and
Goal/Loop procedure, domain packs, agent policies, playbooks, or implementation judgment.

The operator is not a competing Brain, not a suite-local queue, and not a new source of authority.
It may only act inside the Work Order, Goal, Loop, and Evidence boundaries already authorized.

## Role Definition

The Work Order Operator is responsible for:

- reading current repository, worktree, branch, PR, check, review, validation, and evidence state;
- classifying the Work Order risk class before acting;
- creating and using a dedicated worktree for each mutable Work Order;
- executing only the file and system scope authorized by the Work Order;
- using subagent patterns for discovery, implementation, validation, and stop-gate classification;
- committing, pushing, opening PRs, and resolving in-scope review comments when the Work Order permits;
- monitoring checks and review state without returning routine telemetry as owner questions;
- continuing automatically through documented chains inside recorded authority;
- stopping only at true authority walls;
- returning evidence packets, not chatter.

The operator must preserve the one-Brain model and must never create a separate queue, scheduler, or
suite-local autonomous governance layer.

## Subagent Patterns

Subagents are reusable execution patterns. They do not receive independent governance authority.
The Work Order Operator remains accountable for scope, evidence, and stop-gate decisions.

| Pattern | Purpose | Inputs | Outputs | Must stop when |
| --- | --- | --- | --- | --- |
| Discovery Agent | Inventory current repo, docs, PR, branch, validation, and evidence state. | Work Order scope, repo path, current branch, known evidence. | Read-only discovery notes, gaps, state mismatches. | Evidence requires mutation, protected data appears, or canon conflicts. |
| Scope/Evidence Reviewer | Verify allowed files, non-changes, validation proof, and completion evidence. | Diff, Work Order scope, validation results, PR files. | Scope verdict, evidence verdict, residual risk. | Runtime, CI, deployment, secrets, county, PACS, or SQL scope appears. |
| Implementation Agent | Make the smallest approved edit. | Approved files, hypothesis, validation target. | Narrow patch. | Patch requires a broader system, package upgrade, runtime change, or owner decision. |
| Validation Agent | Run required gates and classify failures. | Validation commands, local toolchain state, CI/check data. | Pass/fail evidence, failure class, next repair packet. | Failure is outside the Work Order scope or requires bypass authority. |
| Hygiene/Cleanup Agent | Classify worktrees, branches, residue, and cleanup candidates. | Worktree registry, branch list, PR state, local status. | Keep/delete/manual-review queue. | Cleanup is destructive and not explicitly authorized. |
| Stop-Gate Classifier | Decide whether a blocker is routine or an authority wall. | Failure evidence, scope, risk class, authority model. | Continue/fix/stop decision with rationale. | Decision changes product, governance, security, production, or protected-data posture. |

Promotion criteria for a subagent pattern to become a formal reusable role:

- the pattern recurs in at least three Work Orders or across two programs;
- its inputs and outputs are stable enough to document;
- its forbidden actions are explicit;
- its validation evidence is repeatable;
- it does not need independent authority;
- it improves throughput without weakening stop gates.

## Stop-Gate Rules

The operator must stop for owner authority when the next action requires any of the following:

- merge authorization when no active Mode B or Mode C grant covers the PR;
- mark-ready authorization when the Work Order requires owner approval before ready state;
- runtime or product behavior change outside the current Work Order;
- CI, branch protection, hook, pipeline, or governance behavior change outside the current Work Order;
- broad dependency upgrade, package-manager policy change, or repo restructuring;
- secrets, credentials, PACS, county SQL, county data, release, deployment, or production resources;
- destructive cleanup not explicitly authorized;
- branch protection override, admin merge, or auth repair;
- conflicting canon or ownership ambiguity;
- merge conflict requiring product or governance judgment;
- write behavior from a read-only query, discovery, or evidence tool.

The operator should not stop for routine states that can be resolved within the current authority:

- PR creation;
- checks running;
- green checks;
- review comments that can be fixed within approved files;
- docs-only formatting fixes inside the same Work Order scope;
- local dependency materialization by normal hooks when no tracked package files change;
- evidence updates that remain within the approved evidence path.

## Autonomous Continuation Rules

The operator may continue automatically to the next Work Order when all conditions are true:

- the next Work Order is documented in the current Goal or chain;
- the next Work Order's risk class, systems, files, and actions remain inside recorded authority;
- dependencies are satisfied or explicitly deferred;
- previous validation passed or failures were fixed within scope;
- PR checks are green before any merge;
- unresolved review threads are zero before any merge;
- the file scope matches the Work Order;
- no protected systems or forbidden files are touched;
- no owner authority wall is reached.

The operator must not infer permission to continue into a higher-risk lane. A numeric risk increase may
continue only when the active authority record explicitly grants the class, systems, files, and actions.
Runtime, production, protected data, or destructive cleanup are never authorized by implication.

## Evidence Output Format

Every Work Order or chain closure should return an evidence summary with:

```text
RESULT:
WORK_ORDER:
HEAD_BEFORE:
HEAD_AFTER:
FILES_CHANGED:
FILES_COMMITTED:
VALIDATION_RUN:
VALIDATION_RESULT:
PUSH_STATUS:
PR_NUMBER:
PR_URL:
PR_STATE:
PR_IS_DRAFT:
MERGE_COMMIT:
RUNTIME_CODE_CHANGED:
PACKAGE_JSON_CHANGED:
DEPENDENCY_VERSION_CHANGED:
PIPELINE_YAML_CHANGED:
GITHUB_WORKFLOWS_CHANGED:
DOCKER_CHANGED:
HELM_OR_K8S_CHANGED:
SECRETS_TOUCHED:
COUNTY_DATA_TOUCHED:
PACS_OR_SQL_TOUCHED:
SAFE_TO_MARK_READY:
SAFE_TO_MERGE:
NEXT_RECOMMENDED_WO:
STOP_TYPE:
```

For read-only Work Orders, omit commit/PR fields only when no branch or PR exists. For chain reports,
include the completed Work Orders, PRs, merge commits, and any blocked candidates.

## Goal, Loop, Work Order, Evidence, Operator Packet

The operator pattern connects the five WOE primitives:

- Goal owns intent and success criteria.
- Loop owns repeated execution inside an approved risk boundary.
- Work Order owns scope, allowed systems, blocked systems, validation gates, and stop conditions.
- Evidence proves what happened and what did not happen.
- Operator Packet defines how Codex executes the loop without becoming a new authority source.

The operator may use the read-only query tool as advisory input. Query output does not grant write,
merge, cleanup, production, or protected-data authority.

## Work Order Risk Use

The operator uses the canonical risk class as one dimension of the recorded continuation boundary:

- `R0`: read-only discovery only.
- `R1`: documentation or operator-truth patch.
- `R2`: local developer tooling.
- `R3`: CI, governance, hooks, branch hygiene, and tooling.
- `R4`: runtime or application behavior.
- `R5`: production, security, secrets, protected data, PACS, county SQL, county data, release, or deployment.

Automatic continuation is safest within `R0` through `R2` when the chain is documented and validation
is green. `R3` may continue only when the Work Order explicitly grants governance/tooling authority.
`R4` and `R5` require explicit Work Order authorization and cannot be entered by implication.

## Review and PR Handling

When the Work Order grants PR authority, the operator may:

- open a draft or ready PR as instructed;
- poll checks without asking the owner to relay status;
- fix review comments within approved scope;
- resolve review threads after a scoped fix;
- report merge readiness only after checks are green, review threads are resolved, and scope is clean.

The operator merges only under the canonical
[`MERGE_AUTHORITY_MODEL.md`](MERGE_AUTHORITY_MODEL.md). Mode B or Mode C authority may cover an exact
PR, batch, or bounded PR class when the owner records the grant. Routine merge execution inside that
grant is not a new branch/merge decision, but the grant alone is insufficient: exact scope,
reservation clearance, passing or explicitly acceptable checks, zero unresolved threads, clean merge
state, complete evidence and rollback, and protected-boundary checks remain mandatory. Ambiguity,
force operations, or missing authority remain walls.

## Non-Goals

This doctrine does not:

- implement an autonomous runner;
- create a scheduler or daemon;
- add GitHub, Azure, or CI automation;
- change the Work Order schema;
- update registry contents;
- migrate historical Work Orders;
- authorize backend, workbench, TerraPilot, runtime, production, release, PACS, county SQL, county data,
  or secrets work;
- override the complete canonical hierarchy in `AGENTS.md` and ADR-EXEC-001, including the
  Constitution, Brain rules, recorded owner authority, domain packs, path-local instructions, or
  branch protection.

## Validation

Expected validation for doctrine-only updates:

```powershell
git diff --check
node docs/brain/workorders/tools/wo-query.mjs --json
```

Root and directory-local `AGENTS.md` requirements remain additive. For this repository, mandatory
gates such as `pnpm run type-check` and
`node --test os-platform/core/tests/phase83-tools.test.mjs` remain required where the applicable
checkout can run them, and branch protection remains the full-repo enforcement point for every PR.

If sparse checkout prevents the query tool from resolving all required paths, validate `git diff --check`
locally and rely on PR checks for full-repo validation. Do not broaden sparse checkout or modify unrelated
files solely to satisfy local convenience.
