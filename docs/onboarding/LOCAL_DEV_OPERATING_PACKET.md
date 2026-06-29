# Local Dev Operating Packet

This packet is the operator-facing local development contract for TerraFusion. It turns the current
onboarding, smoke, Docker, and toolchain truth docs into one safe execution path for a new developer
or agent.

It is local-first only. It does not authorize runtime feature work, production deployment, release,
Helm, Kubernetes, image publishing, secrets, county data, PACS, or county SQL.

## Authorization

This document is created under `WO-DEVOPS-006L - Local Dev Operating Packet` in the TerraFusion
local development chain. The authorized lane is local developer onboarding documentation only.

This work order does not expand the root Core Governance Surface, modify repo-shape policy, change
runtime code, change Docker configuration, or authorize writes outside the local-dev operating packet
scope.

## Start Here

Read in this order:

1. `AGENTS.md`
2. `docs/onboarding/DEVELOPER_ONBOARDING.md`
3. `docs/onboarding/TOOLCHAIN_TRUTH.md`
4. `docs/onboarding/LOCAL_DEV_SMOKE_GATE.md`
5. `docs/onboarding/DOCKER_DEV.md`
6. `docs/onboarding/DOCKER_TROUBLESHOOTING.md`

## Operating Path

From a dedicated worktree created from current `origin/main`:

```powershell
pwd
git remote -v
git branch --show-current
git rev-parse --show-toplevel
git status --short --branch
```

Then run the read-only local gates:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/dev/readiness.ps1
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/dev/bootstrap.ps1
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/dev/smoke.ps1
```

Each local-dev script supports `-Help` for usage and read-only behavior notes:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/dev/readiness.ps1 -Help
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/dev/bootstrap.ps1 -Help
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/dev/smoke.ps1 -Help
```

Validate Docker local-dev config before starting any Docker service:

```powershell
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example config
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile tooling config
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile frontend config
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example --profile backend config
```

## What Passing Means

Passing the local-dev packet means:

- the worktree is identifiable
- required local tools are discoverable
- required onboarding docs exist
- Docker dev Compose YAML and placeholder env render
- local smoke wraps readiness plus bootstrap inspect

Passing does not mean:

- production readiness
- release readiness
- runtime application correctness
- dependency install correctness
- backend restore/build correctness
- frontend build correctness
- Kubernetes or Helm readiness
- county runtime readiness

## Mutability Rules

| Action | Default posture |
| --- | --- |
| Read docs and inspect versions | allowed |
| Run readiness/bootstrap/smoke | allowed |
| Run Docker Compose `config` commands | allowed |
| Create `docker/dev/.env` from placeholders | allowed only when the active WO needs local Docker execution |
| Run Docker toolbox/profile commands | allowed only when the active WO authorizes local Docker state mutation |
| Run package install or restore | separate WO or explicit scope required |
| Run migrations | blocked |
| Use real secrets or county values | blocked |
| Touch production Compose, Helm, or Kubernetes | blocked |

## Evidence Sources

- `docs/devops/evidence/local-dev-readiness-example.md`
- `docs/devops/evidence/docker-dev-evidence-pack.md`
- `docs/devops/evidence/LOCAL_DEV_EVIDENCE_TEMPLATE.md`

## Stop Gates

Stop and route through a separate work order if progress requires:

- secrets, credentials, tokens, or connection strings
- county data, PACS, or county SQL
- runtime product behavior changes
- package dependency upgrades or package-manager migration
- production Docker, Helm, Kubernetes, release, deployment, or image publishing
- destructive git, Docker, filesystem, or worktree cleanup
- conflicting canon or path identity
