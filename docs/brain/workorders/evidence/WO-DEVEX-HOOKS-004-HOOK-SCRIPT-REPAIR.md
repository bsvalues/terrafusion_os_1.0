# WO-DEVEX-HOOKS-004 - Hook Script Repair

**Program:** DevEx Hook Tooling
**Goal:** `GOAL-DEVEX-HOOK-BOOTSTRAP`
**Loop:** `LOOP-DEVEX-HOOK-BOOTSTRAP`
**Mode:** Owner-authorized bounded implementation
**Base:** `origin/main` at `bba74f3227fa5e208cbd34e9bc4e581ff1e94404`

---

## Objective

Implement the deterministic local hook policy approved by `WO-DEVEX-HOOKS-003` without modifying
packages, lockfiles, CI, branch protection, product runtime, deployment, or protected resources.

---

## Authorized Implementation

| File | Change |
|------|--------|
| `.husky/pre-commit` | Resolve the repository-declared pnpm through Corepack, require repo-local lint-staged and Prettier, fail fast with the frozen-lockfile bootstrap command, and remove silent tool skips |
| `.husky/pre-push` | Remove hook-time dependency installation, require repo-local Vitest, run quality scripts through the pinned pnpm contract, and preserve strict/non-strict behavior |
| `scripts/setup/setup-atlas-hooks.sh` | Retire the legacy authority-switching setup path without changing `core.hooksPath` |

The repair keeps `.husky` as the sole supported hook authority and leaves `package.json`,
`pnpm-lock.yaml`, all workflows, and all product surfaces unchanged.

---

## Behavior Contract

### Pre-commit

- Preserves the worktree lane guard and governed untracked-file guard.
- Runs the UI token gate through `corepack pnpm` when its existing path classifier selects it.
- Requires repo-local `lint-staged` and Prettier shims before staged-file validation.
- Verifies both tools execute through `corepack pnpm exec`.
- Fails with `corepack pnpm install --frozen-lockfile` when bootstrap is incomplete.
- Never resolves validation tools through `npx` and never silently skips missing tooling.

### Pre-push

- Resolves pnpm 9.0.0 from the repository `packageManager` declaration through Corepack.
- Requires the root lockfile, root dependency directory, and repo-local Vitest.
- Verifies Vitest through `corepack pnpm exec vitest --version`.
- Runs the existing quality scripts through `corepack pnpm run`.
- Never invokes `npm install`, `npm`, or `npx`.
- Keeps `TF_STRICT_PUSH=1` as the default fail-closed mode.
- Keeps `TF_STRICT_PUSH=0` as a loud developer-local override after bootstrap preflight and labels
  its result as non-release evidence.

### Legacy Atlas setup

- Exits nonzero with an unsupported-path explanation.
- Does not change Git configuration.
- Directs operators to the canonical frozen-lockfile bootstrap command.

---

## TDD Evidence

A temporary ignored synthetic harness exercised real copies of the three scripts in isolated Git
repositories. The harness was not added to the repository.

### RED

Before implementation, 10 assertions failed, including canonical bootstrap guidance, Corepack tool
resolution, non-strict push behavior, and legacy Atlas authority switching.

### GREEN

After the minimal implementation and review-remediation proof cycles, all 27
assertions passed:

- missing dependency fail-fast behavior;
- canonical bootstrap command output;
- repo-local lint-staged, Prettier, and Vitest resolution;
- no `npm` or `npx` hook execution;
- no install mutation;
- strict push failure behavior;
- non-strict developer override behavior and non-release-evidence label;
- legacy Atlas setup retirement without `core.hooksPath` mutation;
- commit/push invocation from nested working directories;
- POSIX `sh` compatibility without `local` declarations;
- executable Git index modes for both Husky hooks;
- POSIX shell syntax for all three scripts.

---

## Validation

| Validation | Result |
|------------|--------|
| Synthetic hook contract, 27 assertions | PASS |
| `sh -n .husky/pre-commit` | PASS |
| `sh -n .husky/pre-push` | PASS |
| `sh -n scripts/setup/setup-atlas-hooks.sh` | PASS |
| `corepack pnpm --version` | PASS - `9.0.0` |
| `git config --get core.hooksPath` | PASS - `.husky` |
| Missing root dependencies during proof | Confirmed; no install performed |
| `git diff --check` | PASS |
| `node docs/brain/workorders/tools/wo-query.mjs --json` | PASS |
| Remote PR checks | Required before merge |

---

## Explicit Non-Changes

- No `package.json` or lockfile change.
- No GitHub Actions, CI, branch-protection, or release automation change.
- No backend, frontend product, runtime, tools/sync, deployment, schema, migration, county, PACS,
  secret, or production-resource change.
- No dependency installation was run.

---

## Rollback

Revert the WO-004 squash commit. That restores the prior three executable files and removes this
evidence/routing update without package, lockfile, CI, or runtime rollback.

---

## Verdict

**PASS - bounded hook script repair is implemented and locally validated.**

The next same-risk work order is `WO-DEVEX-HOOKS-005 - Worktree Hygiene Register`, an
evidence/register lane. It must classify cleanup candidates without deleting worktrees or branches.
