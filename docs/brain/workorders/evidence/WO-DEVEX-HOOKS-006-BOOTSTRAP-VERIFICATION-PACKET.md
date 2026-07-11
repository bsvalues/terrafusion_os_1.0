# WO-DEVEX-HOOKS-006 - Bootstrap Verification Packet

**Program:** DevEx Hook Tooling

**Goal:** `GOAL-DEVEX-HOOK-BOOTSTRAP`

**Loop:** `LOOP-DEVEX-HOOK-BOOTSTRAP`

**Base:** `2b97106cf5895562b2eeb63fc219327e672a5797`

**Mode:** Isolated clean-worktree validation and evidence

## Verdict

PASS. A clean dedicated worktree bootstrapped the repository-declared `pnpm@9.0.0` dependency
graph with `corepack pnpm install --frozen-lockfile`. The operation changed no tracked file. The
repaired hooks resolved repository-local Prettier, lint-staged, and Vitest deterministically and did
not install dependencies during hook execution.

## Worktree And Bootstrap Evidence

| Check | Result |
|-------|--------|
| Worktree | `<HOME>/.codex-worktrees/devex-hooks-006-bootstrap-verification` |
| Branch | `wo/devex-hooks-006-bootstrap-verification` |
| Initial `HEAD` / `origin/main` | `2b97106cf5895562b2eeb63fc219327e672a5797` |
| Initial status | Clean |
| Package manager | `corepack pnpm`, repository-declared version `9.0.0` |
| Bootstrap command | `corepack pnpm install --frozen-lockfile` (explicitly owner-authorized; lifecycle scripts were not suppressed) |
| Bootstrap result | PASS; lockfile resolution skipped because the lockfile was current |
| Tracked mutation after bootstrap | None |
| Hook-time install | None |

## Immutable Input Proof

| File | SHA-256 before | SHA-256 after | Result |
|------|---------------|--------------|-------|
| `package.json` | `AE1B423C71421A30983D06D8F303E4B556E674F3551CBB226CF1F33AB500C0D6` | `AE1B423C71421A30983D06D8F303E4B556E674F3551CBB226CF1F33AB500C0D6` | Unchanged |
| `pnpm-lock.yaml` | `D23687DD59C77E400D392DC99BB3F12308761377368D686528868C22615489A0` | `D23687DD59C77E400D392DC99BB3F12308761377368D686528868C22615489A0` | Unchanged |

`git status --short` and the scoped manifest/lockfile diff were empty immediately after bootstrap.
Only ignored local dependency state under `node_modules` was created.

## Repository-Local Tool Resolution

| Tool | Resolution | Version | Result |
|------|------------|---------|--------|
| Prettier | `corepack pnpm exec prettier --version` | `3.7.4` | PASS |
| lint-staged | `corepack pnpm exec lint-staged --version` | `13.3.0` | PASS |
| Vitest | `corepack pnpm exec vitest --version` | `1.6.1` | PASS |

Windows repository-local command shims existed for all three tools under `node_modules/.bin`.

## Hook Behavior Proof

- `core.hooksPath` resolves to `.husky`.
- Pre-commit resolves the repository root, checks the declared pnpm version, and resolves
  repository-local lint-staged and Prettier before running staged-file validation.
- Pre-push resolves repository-local Vitest before quality gates.
- A controlled strict-mode synthetic failure exits nonzero at the first failed gate.
- The same controlled failure under explicit `TF_STRICT_PUSH=0` remains loud, continues through the
  declared gates, exits zero, and states that the override is not release evidence.
- Command capture from both hook exercises contains no `install`, `add`, `npm install`, or other
  dependency mutation command.

The synthetic runs replace gate command outcomes only; actual Corepack/pnpm and repository-local
tool resolution were verified separately against the bootstrapped worktree.

The owner-authorized bootstrap executed the repository's existing `prepare` lifecycle script, which
ran `husky install`. No tracked file, manifest hash, lockfile hash, or effective `core.hooksPath`
changed, but this run does not establish lifecycle scripts as safe for unattended auto-proceed.

## Standing Operator Policy

`FROZEN_BOOTSTRAP_AUTO_PROCEED` is added to the Codex operator playbook. Automatic frozen installs in
dedicated validation worktrees must also use `--ignore-scripts`; script-enabled bootstrap requires a
separate pre-install lifecycle-script allowlist or explicit owner authorization. Manifests and lockfiles are
hashed, only ignored dependency state is expected, protected resources are excluded, and any tracked
change still causes an immediate stop.

## Safety And Non-Claims

- No package manifest, lockfile, hook, CI workflow, runtime, backend, frontend product behavior,
  tools-sync implementation, deployment, county, PACS, secret, or production resource changed.
- This packet proves deterministic local bootstrap and hook mechanics. It does not claim that every
  repository quality script passes in every environment.
- The worktree hygiene register remains classification-only; no worktree or branch cleanup occurred.

## Program Disposition

`WO-DEVEX-HOOKS-001` through `WO-DEVEX-HOOKS-006` now establish the DevEx hook bootstrap baseline.
The program is ready to close after this packet merges. Any future hook defect or dependency-policy
change requires a new bounded Work Order.

STOP_TYPE: `DEVEX_HOOK_BOOTSTRAP_VERIFIED`
