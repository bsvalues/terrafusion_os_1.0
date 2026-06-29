# Developer Setup

This guide is supporting detail for the canonical onboarding entrypoint:
`docs/onboarding/DEVELOPER_ONBOARDING.md`.

For declared versus observed tool versions, use `docs/onboarding/TOOLCHAIN_TRUTH.md`.
For the operator-facing local-dev command order and stop gates, use
`docs/onboarding/LOCAL_DEV_OPERATING_PACKET.md`.

Use it for local development and CI-oriented validation after confirming repo identity and worktree
isolation. It does not authorize secrets handling, county runtime access, PACS or SQL access,
production deployment, or mutation of unrelated dirty checkouts.

## Repository Baseline

- Canonical onboarding entrypoint: `docs/onboarding/DEVELOPER_ONBOARDING.md`
- Local-dev operating packet: `docs/onboarding/LOCAL_DEV_OPERATING_PACKET.md`
- Smallest local-dev smoke gate: `docs/onboarding/LOCAL_DEV_SMOKE_GATE.md`
- Worktree rule: create a dedicated clean worktree for the active work order from current
  `origin/main`
- Historical DevOps migration baseline: `<user-home>\.codex-worktrees\devops-main-baseline` was
  used for Azure migration and is not the default onboarding worktree
- Backend solution: `backend/TerraFusion.sln`
- Frontend workspace: `frontend/package.json`
- Azure pipeline YAML:
  - `azure-pipelines/pr-validation.yml`
  - `azure-pipelines/build-main.yml`

## Prerequisites

- Git
- Node.js `20.x` preferred for the Azure CI first pass
- Node.js compatibility floor from `package.json`: `>=18.0.0 <25.0.0`
- `.nvmrc` baseline: `18.19.0`
- pnpm `9.0.0` from root `package.json` (`packageManager: pnpm@9.0.0`)
- .NET SDK `8.0.x`
- `global.json` SDK pin: `8.0.0`
- Docker Desktop if you need to inspect or later validate container surfaces
- Azure DevOps access if you will inspect pipeline definitions or runs

## Repo Orientation

Top-level surfaces you will use most often:

- `backend/` for the .NET solution and projects
- `frontend/` for the React/Vite workspace
- `os-platform/core/` for governance tooling and core tests
- `azure-pipelines/` for Azure CI YAML entrypoints
- `docs/migration/` for the DevOps baseline, build truth, and Azure runbooks
- `tools/` for local tooling and repo utilities

## First Commands

Before installing dependencies or running builds, follow the canonical path in
`docs/onboarding/DEVELOPER_ONBOARDING.md`. The first command is the read-only readiness checker:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/dev/readiness.ps1
```

Then run only the commands that match the active work order from the repo root unless noted
otherwise:

```powershell
git status --short --branch
git branch --show-current
git rev-parse --show-toplevel
pnpm install --frozen-lockfile
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
node --test os-platform/core/tests/phase85-tools.test.mjs
node --test os-platform/core/tests/phase86-toolrunner.test.mjs
pnpm -C frontend run type-check
pnpm -C frontend run test:tier1
dotnet restore backend/TerraFusion.sln
dotnet build backend/TerraFusion.sln -c Release --no-restore /warnaserror
pnpm -C frontend run build
pnpm run check:generated
```

## Suggested First-Pass Order

1. Confirm you are in the intended worktree and branch.
2. Read `AGENTS.md` and `docs/onboarding/DEVELOPER_ONBOARDING.md`.
3. Read `docs/onboarding/LOCAL_DEV_OPERATING_PACKET.md`.
4. Run `scripts/dev/readiness.ps1`.
5. Run `scripts/dev/bootstrap.ps1` or `scripts/dev/smoke.ps1` when local-dev evidence is needed.
6. For local Docker dev, read `docs/onboarding/DOCKER_DEV.md`.
7. Install dependencies with `pnpm install --frozen-lockfile` only when the active work order needs it.
8. Run the fast PR-validation command set first.
9. Run backend build and frontend build only after the fast gates are stable.

## Local Dev Notes

- Use a dedicated clean worktree for DevOps documentation, onboarding, and Azure-first-pass work.
- Treat the main shared checkout as evidence-only if it is dirty or conflicted.
- Prefer the documented command surfaces over ad hoc alternatives.
- Use `docs/onboarding/LOCAL_DEV_SMOKE_GATE.md` when you need one boring local-dev health signal.
- GitHub workflow history is useful reference, but Azure validation truth comes from the Azure pipeline YAML plus live Azure runs.
- Local Docker development is documented in `docs/onboarding/DOCKER_DEV.md` and uses only
  `docker/dev/**`.

## Azure DevOps Access

Azure DevOps is needed only for pipeline inspection, registration, and run triage in this lane.

- Organization: `https://dev.azure.com/bsvalues`
- Project: `TerraFusion`
- Repository: `terrafusion-monorepo`

Use existing authenticated local tooling only. Do not put tokens in chat or write secrets to repo files.

## Red Lines

- No secrets in repo files, docs, commands, or screenshots
- No PACS or county SQL access
- No county data handling
- No production deployment or environment mutation
- No PR `#133` mutation
- No cleanup or repair of unrelated dirty checkouts without a separate work order
