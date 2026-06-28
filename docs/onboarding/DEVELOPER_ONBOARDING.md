# TerraFusion Developer Onboarding

This is the canonical entrypoint for local TerraFusion development and agent work. It is local-first,
evidence-oriented, and intentionally separate from production deployment.

## Purpose

Use this guide to get from a fresh checkout to a safe local development posture without touching
production systems, county data, PACS, county SQL, secrets, Helm, Kubernetes, or release machinery.

## Who This Is For

- New developers orienting to the repo.
- Agents starting DevOps or local-platform work.
- Operators validating that local tooling is present before running Docker dev commands.
- Reviewers checking that a work order stayed inside local-development scope.

## First-Read Order

1. `AGENTS.md` for global governance and worktree isolation.
2. This guide.
3. `docs/onboarding/DEV_SETUP.md` for tool versions and command truth.
4. `docs/onboarding/DOCKER_DEV.md` for local Docker dev commands.
5. `docs/onboarding/DOCKER_TROUBLESHOOTING.md` when Docker fails.
6. `docs/onboarding/AGENT_START_HERE.md` for agent handoff and preflight.

## Canonical Local-Dev Path

Use this path before trying ad hoc setup commands:

1. Confirm repo identity and clean worktree state.
2. Run the read-only readiness checker.
3. Validate Docker local-dev Compose with placeholder env values.
4. Choose a profile-specific Docker command only after config validation passes.
5. Clean up only the local-dev Compose project when you are done.

The first local command is:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/dev/readiness.ps1
```

The first Docker command is:

```powershell
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example config
```

That Docker command is read-only and may render `services: {}` because local-dev services are
profile-gated. Use `docs/onboarding/DOCKER_DEV.md` for the profile-specific validation and run
commands.

Cleanup is limited to the local-dev Compose project:

```powershell
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example down
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example down --volumes
```

Use `down --volumes` only when you intentionally want to remove local Docker cache volumes. Do not
use global Docker prune commands as part of onboarding.

## Repo Identity Check

From the checkout you intend to use:

```powershell
git remote -v
git branch --show-current
git rev-parse --show-toplevel
git status --short --branch
```

The canonical GitHub repo is `bsvalues/terrafusion_os_1.0`. Repo name alone is not enough when
duplicate estate copies exist; path identity is governed by `PATH_CANON_REGISTER.md` when present.

## Clean Worktree Requirement

Do not work from a dirty shared checkout unless a work order explicitly assigns it. Create a dedicated
worktree per work order:

```powershell
git fetch origin --prune
$worktreeRoot = Join-Path $HOME ".codex-worktrees"
$worktreePath = Join-Path $worktreeRoot "example-local-platform"
git worktree add -b wo/example-local-platform $worktreePath origin/main
Set-Location $worktreePath
git status --short --branch
```

Stop if foreign staged or unstaged files are present. Do not reset, clean, force checkout, or broad
stash without explicit authorization.

## Azure DevOps CI State

The Azure DevOps bridge is active:

- Project: `TerraFusion`
- Repository: `terrafusion-monorepo`
- PR Validation pipeline: active and required on `main`
- Main Build pipeline: active, but not required for PR completion

This does not authorize Azure resource creation, service connections, Key Vault, deployments, or
branch-policy changes.

## Local Readiness Route

Run the read-only readiness checker before Docker or broader setup:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/dev/readiness.ps1
```

The script reports local prerequisites and required file presence. It does not install packages,
start services, restore .NET packages, read secrets, or mutate the repo.

## Docker Dev Route

Local Docker dev is documented in `docs/onboarding/DOCKER_DEV.md` and implemented under
`docker/dev/**`. Validate the compose contract before starting any container:

```powershell
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example config
```

Use only placeholder values from `docker/dev/.env.example`. Do not copy values from production
Compose, Helm, county demos, quarantined artifacts, or operator machines.

## Package-Governance Note

The repo pins package-manager behavior in `package.json` and `pnpm-workspace.yaml`. Do not run broad
dependency upgrades, lockfile rewrites, or package-manager migrations as part of onboarding work.
If dependency policy blocks local tooling, classify it and route it through a package-governance work
order instead of bypassing it silently.

## Explicit No-Go Zones

- Real secrets, tokens, credentials, or connection strings.
- PACS integrations, county SQL, or county runtime data.
- Production Docker, Helm, Kubernetes, image publishing, or deployment behavior.
- Azure service connections, variable groups, Key Vault, production resources, or release tags.
- Runtime product behavior changes.
- Dirty shared checkout cleanup.

## Stop Gates

Stop and escalate when work requires any of these:

- Secrets or credentials.
- County data, PACS, or county SQL.
- Production deployment or infrastructure mutation.
- Helm or Kubernetes implementation.
- Runtime/product behavior changes.
- Destructive git or filesystem operations.
- Conflicting canon or path identity.
- Broad dependency upgrade or package-manager migration.

## Next Guide Links

- `docs/onboarding/DEV_SETUP.md`
- `docs/onboarding/DOCKER_DEV.md`
- `docs/onboarding/DOCKER_TROUBLESHOOTING.md`
- `docs/onboarding/TROUBLESHOOTING.md`
- `docs/agents/DEVOPS_AGENT_HANDOFF_TEMPLATE.md`
- `docs/decisions/DEV_BOOTSTRAP_DECISION.md`
- `docs/deployment/kubernetes-boundary-decision.md`
