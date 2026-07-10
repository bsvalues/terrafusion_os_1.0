# DevEx Hook Tooling Program Playbook

**Program:** DevEx Hook Tooling
**Goal:** `GOAL-DEVEX-HOOK-BOOTSTRAP`
**Loop:** `LOOP-DEVEX-HOOK-BOOTSTRAP`
**Status:** Active - docs/governance bootstrap contract
**Current base:** `origin/main` at `509bc0c4fd8741351aff4c1128af60da12f56fba`

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
- Clean worktrees do not have root `node_modules` or `frontend/node_modules`.
- `prettier` and `vitest` are not available on PATH.
- Repo-local `node_modules/.bin/prettier` and `node_modules/.bin/vitest` are absent in clean
  worktrees; on Windows the corresponding `.cmd` shims are also absent.
- `npx --no-install` can resolve non-canonical global/cache tool versions, which is not acceptable
  as release-grade local hook proof.
- The current pre-push hook may attempt `npm install --legacy-peer-deps` when `node_modules` is
  missing; hook-time install mutation is not approved by this lane.
- `scripts/setup/setup-atlas-hooks.sh` can set `core.hooksPath` to `.githooks`; that legacy hook
  authority must be dispositioned before hook repair.

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

## Required Next Decision

`WO-DEVEX-HOOKS-003` should decide the deterministic hook execution design:

- whether the repo standardizes on `pnpm@9.0.0`, updates policy to pnpm 11, or documents a supported
  bridge;
- whether hooks should call `pnpm exec`, explicit `node_modules/.bin/*`, or a repo-owned wrapper;
- whether missing dependencies fail with bootstrap instructions or trigger an approved explicit
  bootstrap command;
- whether `TF_STRICT_PUSH=0` remains a developer escape hatch or is replaced by a clearer docs-only
  hook path.

Implementation remains blocked until that design is owner-approved.
