# WO-DEVEX-HOOKS-002 - Local Tooling Bootstrap Contract

**Program:** DevEx Hook Tooling
**Goal:** `GOAL-DEVEX-HOOK-BOOTSTRAP`
**Loop:** `LOOP-DEVEX-HOOK-BOOTSTRAP`
**Mode:** Docs/governance only
**Base:** `origin/main` at `509bc0c4fd8741351aff4c1128af60da12f56fba`

---

## Objective

Define the local tooling bootstrap contract required to stop repeated hook bypasses for docs and
governance work, without editing hooks, package manager policy, CI, runtime code, or deployment
behavior in this work order.

Owner authorization selected the DevEx Hook Tooling lane after the Release Engineering closeout and
authorized docs/governance evidence work only. This packet does not broaden the root `AGENTS.md`
runtime/core write scope; it records the owner-selected governance lane and keeps all implementation
changes blocked.

---

## Source Evidence

`WO-DEVEX-HOOKS-001` established the current hook/tooling reality:

| Surface | Evidence |
|---------|----------|
| Active hook path | `core.hooksPath=.husky` |
| Active pre-commit hook | `.husky/pre-commit` |
| Active pre-push hook | `.husky/pre-push` |
| Inactive legacy hook | `.githooks/pre-commit` |
| Root dependencies in clean worktree | `node_modules` missing |
| Frontend dependencies in clean worktree | `frontend/node_modules` missing |
| PATH `prettier` | missing |
| PATH `vitest` | missing |
| Repo-local `prettier` binary | `node_modules/.bin/prettier` missing; Windows `.cmd` shim also missing |
| Repo-local `vitest` binary | `node_modules/.bin/vitest` missing; Windows `.cmd` shim also missing |
| Package manager declaration | `packageManager: pnpm@9.0.0` |
| Observed Codex pnpm | `pnpm@11.7.0` |

The audit also showed that `npx --no-install` can resolve non-canonical versions from outside the
repo-local dependency tree. That is useful as diagnosis, but not as bootstrap proof.

This packet is also the Brain evidence anchor for the `WO-DEVEX-HOOKS-001` read-only audit facts. No
standalone `WO-DEVEX-HOOKS-001` evidence file existed on `origin/main` when this contract was
created; `WO-DEVEX-HOOKS-003` must either accept this packet as the source evidence or create a
dedicated archival packet before any hook implementation work starts.

---

## Bootstrap Contract

The local hook contract is:

1. A clean worktree must not be considered hook-ready until repo-local dependencies are installed
   from the checked-in lockfile and approved package manager policy.
2. Hook execution must prefer deterministic repo-local tools over PATH/global/cache resolution.
3. Missing repo-local dependencies must produce a clear bootstrap instruction, not a misleading
   validation failure.
4. Hooks must not run implicit install commands during commit or push unless a future owner-approved
   policy explicitly allows that behavior.
5. Hook bypasses remain emergency/authority exceptions, not normal lane operation.
6. Docs/governance validation results remain distinct from local hook bootstrap failure.

---

## Current Drift To Resolve

| Drift | Impact | Required disposition |
|-------|--------|----------------------|
| `packageManager` says `pnpm@9.0.0`; active Codex runtime exposes `pnpm@11.7.0` | Bootstrap commands may not reproduce CI or lockfile expectations | Decide whether to pin pnpm 9, update policy to pnpm 11, or document a compatibility bridge |
| `pre-push` may run `npm install --legacy-peer-deps` if `node_modules` is missing | Hook can mutate local dependency state during push | Decide whether to remove implicit install behavior or gate it behind explicit bootstrap |
| `npx` can resolve non-repo versions | Tool checks can pass with non-canonical versions | Decide whether hooks may use `npx` only as a diagnostic fallback, never as proof |
| `package.json` has legacy `husky.hooks` entries while `core.hooksPath` points to `.husky` | Multiple hook authorities are visible | Decide whether to document or clean legacy hook metadata in a future authorized WO |
| `scripts/setup/setup-atlas-hooks.sh` sets `core.hooksPath` to `.githooks` | A bootstrap script can reactivate the legacy hook authority and conflict with the current `.husky` contract | Decide in `WO-DEVEX-HOOKS-003` whether the script is retired, updated, or explicitly unsupported |

---

## Explicit Non-Claims

- This work order does not repair hooks.
- This work order does not install packages.
- This work order does not change package manager policy.
- This work order does not change CI, branch protection, deployment, runtime code, backend code,
  frontend code, tools/sync code, schemas, migrations, secrets, county data, PACS, or live systems.
- This work order does not claim hook readiness on a clean machine.

---

## Proposed Repair Chain

| Next WO | Purpose | Mode |
|---------|---------|------|
| `WO-DEVEX-HOOKS-003 - Hook Determinism Design` | Decide deterministic hook execution and bootstrap policy | Docs/governance design |
| `WO-DEVEX-HOOKS-004 - Hook Script Repair` | Apply approved `.husky` changes only after design approval | Implementation, owner-gated |
| `WO-DEVEX-HOOKS-005 - Worktree Hygiene Register` | Classify stale worktrees and branch ownership cleanup candidates | Evidence/register |
| `WO-DEVEX-HOOKS-006 - Bootstrap Verification Packet` | Verify clean-worktree bootstrap after policy and repair | Evidence/validation |

---

## Recommended Next Work Order

`WO-DEVEX-HOOKS-003 - Hook Determinism Design`

Recommended scope: docs/governance only. Decide the hook execution policy before any `.husky` or
package manager edits.
