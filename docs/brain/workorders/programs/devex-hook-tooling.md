# DevEx Hook Tooling Program Playbook

**Program:** DevEx Hook Tooling
**Goal:** `GOAL-DEVEX-HOOK-BOOTSTRAP`
**Loop:** `LOOP-DEVEX-HOOK-BOOTSTRAP`
**Status:** Closing - bootstrap verification complete
**Current base:** `origin/main` at `2b97106cf5895562b2eeb63fc219327e672a5797`

---

## Purpose

Remove recurring local hook friction from product, backend, release, and governance lanes by making
local hook/tooling prerequisites explicit before any hook implementation changes occur.

This lane is for developer-experience bootstrap truth. It is not release evidence, product runtime,
CI wiring, deployment, or county runtime work.

---

## Current Truth

- Release Engineering is listed as `Closing` in the program register, with `WO-REL-006` recorded as
  the closeout work order and DevEx Hook Tooling selected as the next lane.
- `WO-DEVEX-HOOKS-001` completed a read-only hook/tooling reality audit; its source findings are
  anchored in the `WO-DEVEX-HOOKS-002` evidence packet.
- Active hooks are routed through `core.hooksPath=.husky`.
- `.husky/pre-commit` and `.husky/pre-push` are active.
- `.githooks/pre-commit` exists but is not active under current Git config.
- Dependency-clean worktrees do not begin with root `node_modules`; hooks fail fast with the
  governed bootstrap instruction until dependencies are explicitly installed.
- `prettier` and `vitest` need not be globally available because repaired hooks resolve the
  repository-local tools through Corepack and the pinned pnpm contract.
- After governed frozen bootstrap, repo-local Prettier, lint-staged, and Vitest resolve in clean
  worktrees, including their Windows `.cmd` shims.
- `npx --no-install` can resolve non-canonical global/cache tool versions, which is not acceptable
  as release-grade local hook proof.
- The repaired pre-push hook never installs dependencies; missing local tooling is an explicit
  bootstrap failure.
- `scripts/setup/setup-atlas-hooks.sh` is retired and no longer changes hook authority away from
  `.husky`.

---

## Work Order Chain

| WO | Mode | Purpose | Stop Type |
|----|------|---------|-----------|
| `WO-DEVEX-HOOKS-001` | Read-only discovery | Inventory hook/tooling reality | `DEVEX_HOOK_REALITY_AUDIT_COMPLETE_READY_FOR_BOOTSTRAP_CONTRACT` |
| `WO-DEVEX-HOOKS-002` | Docs/governance | Define local tooling bootstrap contract | `DEVEX_HOOK_BOOTSTRAP_CONTRACT_READY_FOR_PR` |
| `WO-DEVEX-HOOKS-003` | Docs/governance design | Define deterministic hook execution policy before hook edits | `DEVEX_HOOK_DETERMINISM_DESIGN_READY` |
| `WO-DEVEX-HOOKS-004` | Implementation, only if authorized | Repair `.husky` scripts to enforce the approved deterministic policy | `DEVEX_HOOK_SCRIPT_REPAIR_READY` |
| `WO-DEVEX-HOOKS-005` | Evidence/register | Classify stale worktrees and branch ownership cleanup candidates | `DEVEX_WORKTREE_HYGIENE_REGISTER_READY` |
| `WO-DEVEX-HOOKS-006` | Evidence/validation | Verify clean-worktree bootstrap after policy and any authorized repair | `DEVEX_HOOK_BOOTSTRAP_VERIFIED` |

---

## Bootstrap Contract

The local tooling contract is:

1. Hooks must not rely on globally installed `prettier`, `vitest`, or `lint-staged`.
2. Hooks must not treat `npx` fallback resolution as canonical proof because it can resolve versions
   outside the repo contract.
3. Hooks must not perform implicit dependency installation during commit or push without explicit
   owner authorization.
4. The canonical tool source is repo-local dependency installation from the checked-in lockfile and
   package manager policy.
5. The repo currently declares `packageManager: pnpm@9.0.0`, while the active Codex runtime exposes
   `pnpm@11.7.0`; that drift must be resolved by policy before script repair.
6. Clean worktrees must fail fast with a clear bootstrap instruction when repo-local dependencies are
   absent.

---

## Non-Goals

- Do not change `.husky` in `WO-DEVEX-HOOKS-002`.
- Do not edit package manager files in `WO-DEVEX-HOOKS-002`.
- Do not install dependencies in this work order.
- Do not modify CI, branch protection, deployment, runtime, backend, frontend, tools/sync, schema,
  secrets, county, PACS, or live resources.
- Do not weaken hook policy to hide validation failures.

---

## Deterministic Design Decision

[`WO-DEVEX-HOOKS-003`](../evidence/WO-DEVEX-HOOKS-003-HOOK-DETERMINISM-DESIGN.md)
selected this policy and records the detailed evidence, implementation contract, and authority
boundary:

- retain the declared `pnpm@9.0.0` contract;
- use Corepack-mediated `pnpm exec` for repo-local hook tools;
- bootstrap explicitly with `corepack pnpm install --frozen-lockfile`, never from a hook;
- fail fast when dependencies are absent instead of installing or silently skipping gates;
- keep strict push mode as the default;
- retain `TF_STRICT_PUSH=0` only as a loud developer-local override that cannot bypass bootstrap
  preflight or serve as release evidence;
- keep `.husky` as the sole supported hook authority and retire the Atlas script that switches
  authority to `.githooks`.

`scripts/setup/setup-atlas-hooks.sh` is therefore an unsupported setup path. Operators must not run
it while it still rewrites `core.hooksPath` to `.githooks`; its retirement or replacement belongs to
the exact owner-authorized `WO-DEVEX-HOOKS-004` implementation scope.

## Program Closeout State

`WO-DEVEX-HOOKS-004 - Hook Script Repair` implemented the approved policy in `.husky/pre-commit`,
`.husky/pre-push`, and `scripts/setup/setup-atlas-hooks.sh`. It did not change packages, lockfiles,
CI, or product runtime.

`WO-DEVEX-HOOKS-005 - Worktree Hygiene Register` classified 54 registered worktrees without cleanup.
Dirty, locked, detached, active-PR, no-PR, and stale-main ownership boundaries remain preserved.

`WO-DEVEX-HOOKS-006 - Bootstrap Verification Packet` verified a clean-worktree frozen bootstrap,
unchanged manifest and lockfile hashes, repository-local tool resolution, deterministic strict and
non-strict hook behavior, and no hook-time install. The DevEx hook bootstrap baseline is complete
when its evidence packet merges.

The operator playbook now includes `FROZEN_BOOTSTRAP_AUTO_PROCEED`; future ordinary frozen installs
in isolated validation worktrees are routine operations when all policy predicates hold.
