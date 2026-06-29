# Agent Start Here

This is the minimum safe preflight for any agent or human operator starting work in this repository.

## Scope Rule

Start with the active work order. Do not widen scope because adjacent files exist.

For onboarding and local-platform work, start with:

- `docs/onboarding/DEVELOPER_ONBOARDING.md`
- `docs/onboarding/LOCAL_DEV_OPERATING_PACKET.md`
- a dedicated clean worktree from current `origin/main`

Historical worktrees, including `<user-home>\.codex-worktrees\devops-main-baseline`, are evidence of
prior migration work and are not the default for new work.

Do not work from:

- `C:\Users\bsval\terrafusion_os_1.0` when that checkout is dirty, conflicted, or quarantined

## Mandatory Preflight

Run and inspect:

```powershell
pwd
git branch --show-current
git rev-parse --show-toplevel
git status --short --branch
```

Stop if:

- the repo root is the shared checkout and you were not explicitly assigned there
- foreign staged or unstaged files are present
- the work order assumptions no longer match live repo state

## Read Before Writing

1. `brain/packs/README.md`
2. `AGENTS.md`
3. The active work-order packet
4. `docs/onboarding/DEVELOPER_ONBOARDING.md`
5. `docs/onboarding/LOCAL_DEV_OPERATING_PACKET.md` for local-dev command order and stop gates
6. The nearest supporting docs for your lane

For DevOps onboarding, local Docker, and Azure migration, read as applicable:

- `docs/onboarding/TOOLCHAIN_TRUTH.md`
- `docs/onboarding/LOCAL_DEV_SMOKE_GATE.md`
- `docs/onboarding/DOCKER_DEV.md`
- `docs/onboarding/DOCKER_TROUBLESHOOTING.md`
- `docs/migration/build-truth-sheet.md`
- `docs/migration/azure-devops-cutover.md`
- `docs/migration/azure-pipelines-first-run.md`

## Repo Entry Points

- Backend: `backend/TerraFusion.sln`
- Frontend workspace: `frontend/package.json`
- Core governance tests: `os-platform/core/tests/`
- Azure pipeline YAML: `azure-pipelines/`

## Validation Gates

Governance-required or Azure-first-pass commands already documented in repo truth:

```powershell
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

Run only the commands that match the active work order. Documentation-only work does not justify broad installs, builds, or deployments.

## Worktree Rules

- One worktree = one work order = one branch = one PR
- Do not use `git reset --hard`, `git clean`, force checkout, broad stash, or `git add -A` without explicit approval
- Draft PRs are the sync boundary
- If shared checkout state is uncertain, quarantine it rather than “fixing” it

## Expected Files For The DevOps Lane

- `docs/onboarding/DEVELOPER_ONBOARDING.md`
- `docs/onboarding/LOCAL_DEV_OPERATING_PACKET.md`
- `docs/onboarding/TOOLCHAIN_TRUTH.md`
- `docs/onboarding/LOCAL_DEV_SMOKE_GATE.md`
- `docs/onboarding/DOCKER_DEV.md`
- `docs/onboarding/DOCKER_TROUBLESHOOTING.md`
- `docs/agents/DEVOPS_AGENT_HANDOFF_TEMPLATE.md`
- `scripts/dev/readiness.ps1`
- `azure-pipelines/pr-validation.yml`
- `azure-pipelines/build-main.yml`
- `docs/migration/build-truth-sheet.md`
- `docs/migration/azure-devops-cutover.md`
- `docs/migration/azure-pipelines-first-run.md`

## Red Lines

- No secrets
- No PACS or county SQL
- No county data
- No production resources
- No branch strategy changes without explicit approval
- No pipeline or runtime edits when the active work order is docs-only
