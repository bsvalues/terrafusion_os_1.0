# WO-DEVEX-HOOKS-003 - Hook Determinism Design

**Program:** DevEx Hook Tooling
**Goal:** `GOAL-DEVEX-HOOK-BOOTSTRAP`
**Loop:** `LOOP-DEVEX-HOOK-BOOTSTRAP`
**Mode:** Docs/governance design only
**Base:** `origin/main` at `a4344f58c0d6d3270332a20984898058b7edda20`

---

## Objective

Define one deterministic local hook execution policy before any `.husky`, package manager, setup
script, or CI change is authorized. This design resolves the decisions raised by
`WO-DEVEX-HOOKS-002` without claiming that local hook bootstrap is repaired.

---

## Evidence Used

- `package.json` declares `packageManager: pnpm@9.0.0`.
- `docs/onboarding/TOOLCHAIN_TRUTH.md` and `docs/onboarding/DEV_SETUP.md` identify pnpm 9.0.0 as the
  repository contract.
- The root `pnpm-lock.yaml` is the workspace dependency source of truth.
- `core.hooksPath` currently selects `.husky`.
- `.husky/pre-commit` resolves `lint-staged` through `npx` and can silently skip it.
- `.husky/pre-push` can run `npm install --legacy-peer-deps` during push and resolves Vitest through
  `npx`.
- `scripts/setup/setup-atlas-hooks.sh` can replace `.husky` authority with `.githooks`.
- Clean worktrees lack repo-local Prettier, Vitest, and lint-staged binaries until dependencies are
  explicitly bootstrapped.

The source findings from `WO-DEVEX-HOOKS-001` remain anchored in the merged
`WO-DEVEX-HOOKS-002` evidence packet; no separate audit artifact is invented here.

---

## Deterministic Policy Decision

| Decision | Selected policy | Reason |
|----------|-----------------|--------|
| Package manager | Retain the declared `pnpm@9.0.0` contract | Package and onboarding canon agree; observed pnpm 11 is local drift, not upgrade authority |
| Package-manager entrypoint | Use Corepack to select the package-manager version declared by the repo | Avoid dependence on whichever global pnpm happens to be first on PATH |
| Dependency bootstrap | Explicit operator command outside hooks: `corepack pnpm install --frozen-lockfile` | Installation is intentional, auditable, and lockfile-bound |
| Tool resolution | Run repo-local tools through `corepack pnpm exec <tool>` after verifying their local binaries exist | Avoid PATH and `npx` cache/global fallback |
| Missing dependencies | Fail fast with the exact bootstrap instruction | Missing tooling is a bootstrap failure, not a passing or skipped quality gate |
| Hook-time installation | Prohibited | Commit and push hooks must validate; they must not mutate dependency state |
| Strict push mode | Keep strict mode as the default | Existing quality posture remains intact |
| `TF_STRICT_PUSH=0` | Retain only as a loud developer-local override; it cannot bypass bootstrap preflight or serve as release evidence | Preserves a reversible hot-path without weakening canonical validation claims |
| Hook authority | `.husky` remains the sole supported hook authority | Matches current `core.hooksPath` and package setup |
| Atlas setup script | Retire `scripts/setup/setup-atlas-hooks.sh` as unsupported because it switches authority to `.githooks` | Prevents two competing hook authorities |
| Legacy `package.json` hook metadata | Treat as non-authoritative and schedule explicit cleanup | Avoids implying a second active hook system |

---

## Required WO-DEVEX-HOOKS-004 Behavior

If the owner authorizes implementation, `WO-DEVEX-HOOKS-004` must make only the approved repair:

1. Preserve the worktree lane guard and governed untracked-file guard.
2. Require Corepack and the repository-declared pnpm version instead of accepting arbitrary global
   pnpm state.
3. Check for repo-local `lint-staged`, Prettier, and Vitest before invoking them.
4. Invoke Node tools through `corepack pnpm exec`; do not use `npx` as validation proof.
5. Replace hook-time `npm install --legacy-peer-deps` with a fail-fast message:
   `corepack pnpm install --frozen-lockfile`.
6. Do not silently skip a required staged-file or push gate because tooling is missing.
7. Keep `TF_STRICT_PUSH=1` as the default. If `TF_STRICT_PUSH=0` is used, bootstrap preflight must
   still pass and the hook must report that the result is not release evidence.
8. Prevent `scripts/setup/setup-atlas-hooks.sh` from switching `core.hooksPath` to `.githooks`; its
   retirement or replacement requires explicit authorized scope.
9. Treat removal of legacy `package.json` hook metadata as a separately listed package-governance
   change, not incidental cleanup.

The implementation must not change CI, branch protection, test expectations, product behavior,
runtime code, deployment, schema, county data, PACS, secrets, or production resources.

---

## Validation Contract For Implementation

Before a repaired hook can be called deterministic, a future authorized WO must prove:

- clean worktree identity and scope;
- declared pnpm resolution through Corepack;
- frozen-lockfile dependency bootstrap succeeds in an approved local environment;
- missing dependencies fail with the documented bootstrap instruction and do not install anything;
- repo-local `lint-staged`, Prettier, and Vitest are the executables used;
- pre-commit passes and fails on controlled synthetic cases;
- pre-push strict mode passes and fails on controlled synthetic cases;
- `TF_STRICT_PUSH=0` remains loud and cannot bypass bootstrap preflight;
- `.husky` remains the selected `core.hooksPath`;
- no remote CI, branch-protection, or release gate was weakened.

---

## Authority Boundary

This work order authorizes design only. It does not authorize:

- edits to `.husky`, `.githooks`, `scripts/setup/setup-atlas-hooks.sh`, or `package.json`;
- dependency installation or lockfile mutation;
- package-manager policy changes;
- CI, branch-protection, runtime, backend, frontend, tools/sync, deployment, schema, secrets,
  county, PACS, or live-resource changes.

`WO-DEVEX-HOOKS-004 - Hook Script Repair` is therefore the next dependency-cleared work order but
remains blocked on explicit owner authorization for its exact implementation file set.

---

## Verdict

**PASS - deterministic hook execution design is defined.**

The design preserves the pinned package-manager contract, eliminates implicit hook mutation,
requires repo-local tool proof, and keeps implementation behind an owner authority wall.
