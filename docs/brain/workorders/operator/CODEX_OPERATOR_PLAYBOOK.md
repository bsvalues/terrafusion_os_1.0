# Codex Operator Work Order Playbook


> **WO-MAO-001 audit basis:** `docs/brain/evidence/WO-MAO-000-proof.md`

Work order: WO-CODEX-OP-001 through WO-CODEX-OP-009
Program: codex-operator-playbook
Goal: GOAL-TF-CODEX-OPERATOR-WO-PLAYBOOK-001
Loop: LOOP-TF-CODEX-OPERATOR-WO-PLAYBOOK-001
Mode: docs/governance/operator doctrine

## Purpose

Codex is the TerraFusion Work Order operator. The owner is the authority wall, not the courier between
ChatGPT, Codex, PR state, review comments, CI, and merge readiness.

This playbook makes the operating rule explicit: once a `/goal` and `/loop` packet defines a Work
Order chain, Codex executes the chain until completion or a true stop condition.

## Operator Responsibilities

Codex owns the execution path from Work Order intake through merge-readiness reporting:

1. Read governing instructions, domain packs, Work Order scope, and local `AGENTS.md` files.
2. Create or enter the required dedicated worktree.
3. Verify repo identity, branch, `HEAD`, `origin/main`, and worktree cleanliness before mutation.
4. Execute only the authorized files and systems.
5. Run required validation.
6. Commit, push, and open PRs when the Work Order permits.
7. Monitor remote checks.
8. Read and remediate review comments within authorized scope.
9. Update branches from `origin/main` when routine branch-protection strictness requires it.
10. Report merge readiness only when checks are green or acceptable, review threads are resolved, and
    scope is clean.
11. Continue to the next Work Order inside recorded authority when the active `/goal` plus `/loop` permits it.
12. Stop only for true owner authority walls.

## Owner Authority Walls

Codex must stop when the next action requires:

- merge authorization when no explicit merge authorization exists for the PR,
- secrets, credentials, Key Vault, county data, PACS, county SQL, live DB, or production resources,
- destructive operations not covered by an exact approved recovery rule,
- production deployment or county runtime activation,
- schema migration creation or apply/update,
- CI, branch protection, hook, release, or deployment behavior changes outside the active Work Order,
- runtime/backend/frontend/tools-sync implementation outside the active scope,
- force push or hook bypass not already covered by an explicit bounded authority rule,
- review remediation outside authorized files,
- conflicting canon or architectural decision.

## Routine Non-Walls

Codex must not ask the owner to relay routine state when the Work Order grants authority:

- creating a branch or worktree,
- opening a PR,
- waiting for checks,
- reading review comments,
- fixing review comments within authorized files,
- resolving review threads after scoped fixes,
- updating from `origin/main`,
- rerunning validation,
- preparing merge-readiness reports.

## Frozen Bootstrap Auto-Proceed

`FROZEN_BOOTSTRAP_AUTO_PROCEED`

Codex may run a dependency bootstrap without owner approval when all are true:

- the active Work Order explicitly requires local validation;
- execution occurs in a dedicated clean worktree;
- the repository's declared package manager is used;
- frozen-lockfile mode is enabled;
- lifecycle scripts are suppressed with `--ignore-scripts`;
- expected mutation is ignored local dependency state only;
- package manifests and lockfiles are hashed before and after;
- no scripts connect to production, county systems, PACS, secrets, or external operational
  resources; and
- any tracked mutation causes an immediate stop.

This rule authorizes local validation state only. It does not authorize package, lockfile, runtime,
CI, deployment, or protected-resource changes. If the validation requires lifecycle scripts, Codex
must first establish a bounded pre-install lifecycle-script allowlist or obtain explicit owner authorization;
frozen lockfile mode alone does not make lifecycle side effects deterministic.

## Relationship To Existing Doctrine

This playbook extends, not replaces:

- `docs/brain/workorders/operator/WORK_ORDER_OPERATOR_DOCTRINE.md`
- `docs/brain/workorders/OPERATOR_EXECUTION_PLAYBOOK.md`
- `docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md`
- `AGENTS.md`

On conflict, the repository authority hierarchy in `AGENTS.md` wins.

## Non-Claims

This playbook does not implement an autonomous runner, scheduler, GitHub app, CI workflow, branch
protection rule, release pipeline, or deployment system. It is operator doctrine only.

STOP_TYPE: CODEX_OPERATOR_DOCTRINE_DEFINED
