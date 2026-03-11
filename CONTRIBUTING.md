# Contributing to TerraFusion OS

This repository uses `main` as the working branch and requires pull requests for
all routine changes. CI is the review authority on the protected branch; the
current branch-protection model does not rely on manual approval counts.

## Before You Start

- Read [AGENTS.md](./AGENTS.md) if you are using an agent or touching the
  governed core surface.
- Read [README.md](./README.md) for current repository state.
- Read [hostinger-control-plane.md](./os-platform/core/pilot/ops/hostinger-control-plane.md)
  before editing deploy/runbook material.

## Branch and PR Flow

1. Branch from `main`.
2. Keep the change small and scoped to one logical outcome.
3. Push the branch and open a pull request back to `main`.
4. Wait for the required checks to pass.
5. Merge only after the branch is up to date and the required checks are green.

Suggested branch naming:

```text
feat/<short-description>
fix/<short-description>
docs/<short-description>
chore/<short-description>
ops/<short-description>
```

Examples:
- `fix/release-lane-ghcr-cutover`
- `docs/update-github-frontpage`
- `ops/hostinger-proof-runbook`

## Local Verification

### Minimum required for governed/core changes

```bash
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
```

### Recommended for governed/core changes

```bash
pnpm run governance:check
```

### If you changed generated core JS inputs

```bash
pnpm run build:core-js
pnpm run check:generated
```

### If you changed workflow or Markdown docs

Use targeted checks appropriate to the change. Examples:

```bash
pnpm exec prettier --check README.md CONTRIBUTING.md .github/**/*.md
pnpm exec prettier --check .github/workflows/*.yml
```

If you did not run a relevant check, say so explicitly in the PR body.

## Required GitHub Checks

The protected `main` branch currently requires:

- `governed-spine`
- `phase85-tools`
- `phase86-toolrunner`
- `🔒 TerraFusion Seal Gate`
- `🧪 Tier-1 UI Harness Validation`

Branch-protection canon is documented in:

- [AGENTS.md](./AGENTS.md)
- [.github/branch-protection.md](./.github/branch-protection.md)

## Evidence Expectations

Every PR should answer three things clearly:

- What changed
- Why it changed
- How it was verified

Include concrete commands, screenshots, artifact names, or workflow run IDs when
they matter. For deployment changes, include the exact workflow names and target
environment. For UI errors, include the `correlationId` if available.

## Security Rules

- Never commit secrets, private keys, live kubeconfigs, or production passwords.
- If a credential may have been exposed, rotate it before or alongside the fix.
- Do not paste live secrets into issues, PRs, or chat.
- Use GitHub environment secrets, VPS-local env files, or a proper secret
  manager for secret material.

For sensitive reports, use the guidance in [.github/SECURITY.md](./.github/SECURITY.md).

## Scope Discipline

If your change is agent-driven, respect the governed edit surface in
[AGENTS.md](./AGENTS.md). If you need to edit outside that surface, get explicit
authorization first and state it in the PR description.

## Deploy and Runbook Changes

If your change affects deployment behavior, one or more of these usually needs
to be updated in the same PR:

- [hostinger-control-plane.md](./os-platform/core/pilot/ops/hostinger-control-plane.md)
- `.github/workflows/**`
- `.github/README.md`
- `.github/QUICK_START.md`

Do not leave deploy docs describing a previous lane contract.

## Issues

Use the GitHub issue templates for:

- bug reports
- feature requests
- non-sensitive security tracking

Current repo settings: issues are enabled, discussions are disabled, wiki is
disabled.
